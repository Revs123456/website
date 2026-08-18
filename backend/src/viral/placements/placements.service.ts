import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import type { SubmitPlacementDto } from './dto/submit-placement.dto';

/**
 * Placement-story pipeline:
 *   1. User submits their own rough story via the form
 *   2. AI polishes it into a clean 2–3 sentence narrative (no fluff, no fabrication)
 *   3. We create a SuccessStory row with published=false
 *   4. Admin reviews/approves in the existing CMS at /admin/success-stories
 *   5. Once approved, it appears on /success-stories and the user can share it
 *
 * This re-uses the existing success_stories table — no parallel admin pipeline
 * to maintain. Admin only learns one workflow.
 */
@Injectable()
export class PlacementsService {
  private readonly logger = new Logger(PlacementsService.name);

  // Throttle: 1 placement story per user per week (in-memory not feasible — query DB)
  private readonly USER_WEEKLY_LIMIT = 1;
  private readonly IP_WEEKLY_LIMIT = 1;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async submit(opts: { dto: SubmitPlacementDto; userId: string | null }) {
    const { dto, userId } = opts;
    const sinceWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // ── Rate limit: 1/week per user, name-matched fallback for anonymous ────
    if (userId) {
      // Look for prior submissions tied to this user via the SuccessStory.story
      // contents — we don't have a FK from SuccessStory → SiteUser. Workaround:
      // store the user_id in story metadata via a marker. For Phase 3 the
      // simpler check is "has this user submitted a placement in the last 7 days?"
      // We track this via a Subscriber-style marker. For now, fall back to
      // a name-based heuristic — admin moderation catches obvious abuse.
      const recent = await this.prisma.successStory.count({
        where: {
          name: dto.name,
          company: dto.company,
          created_at: { gte: sinceWeekAgo },
        },
      });
      if (recent >= this.USER_WEEKLY_LIMIT) {
        throw new HttpException(
          'You\'ve already submitted a placement story this week.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } else {
      // Anonymous: cap to 1 per week per (name + company) tuple — best-effort
      const recent = await this.prisma.successStory.count({
        where: { name: dto.name, company: dto.company, created_at: { gte: sinceWeekAgo } },
      });
      if (recent >= this.IP_WEEKLY_LIMIT) {
        throw new HttpException(
          'A placement story with this name and company was already submitted this week.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // ── AI polish ────────────────────────────────────────────────────────────
    const { data, usage } = await this.ai.json<{ polished_story: string; tagline: string }>({
      model: 'fast',
      max_tokens: 400,
      temperature: 0.6,
      system: `You polish placement stories submitted by job seekers into clean, share-worthy narratives.

RULES:
- 2-3 sentences total. Tight, specific, human.
- Use the facts the user provided. NEVER invent salaries, dates, companies, or events.
- No buzzwords ("synergy", "leverage", "10x"). No emojis in the story itself.
- Write in third-person (e.g., "Priya went from..." not "I went from...").
- The tagline is a single share-worthy line under 12 words.

Output ONLY JSON, no markdown:
{ "polished_story": "string", "tagline": "string" }`,
      messages: [{
        role: 'user',
        content: `Polish this placement story:

Name: ${dto.name}
Before: ${dto.before_role}
After: ${dto.after_role} at ${dto.company}
${dto.salary_hike ? `Salary: ${dto.salary_hike}` : ''}

Their story (in their words):
${dto.story}`,
      }],
    });

    if (!data?.polished_story || data.polished_story.length < 20) {
      throw new HttpException('AI returned an empty story — try again.', HttpStatus.BAD_GATEWAY);
    }

    this.logger.log(`Placement submitted by ${userId ? `user:${userId}` : 'anon'} | ${usage.cost_usd.toFixed(4)}`);

    // ── Persist as unpublished SuccessStory ──────────────────────────────────
    const initials = dto.name.split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
    const colors = ['#2563eb', '#7c3aed', '#0891b2', '#16a34a', '#dc2626', '#ea580c'];
    const bgs    = ['#eff6ff', '#f5f3ff', '#ecfeff', '#f0fdf4', '#fef2f2', '#fff7ed'];
    const idx = Math.floor(Math.random() * colors.length);

    const story = await this.prisma.successStory.create({
      data: {
        name: dto.name,
        before_role: dto.before_role,
        after_role: dto.after_role,
        company: dto.company,
        salary_hike: dto.salary_hike,
        story: data.polished_story,
        initials,
        color: colors[idx],
        bg: bgs[idx],
        published: false, // Admin must approve
      },
    });

    return {
      story_id: story.id,
      tagline: data.tagline,
      polished_story: data.polished_story,
      status: 'pending_review' as const,
      message: 'Story submitted — it will appear on the site after admin review.',
    };
  }
}
