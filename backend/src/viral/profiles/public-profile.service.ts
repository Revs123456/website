import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { LEVEL_NAMES } from '../../engagement/engagement.constants';

/**
 * Read-only public projection of a SiteUser.
 * Mirrors what the /u/<username> page renders — careful to expose ONLY
 * what the user has explicitly made public.
 */
@Injectable()
export class PublicProfileService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly cache?: CacheService,
  ) {}

  async getByUsername(username: string) {
    const normalized = username.toLowerCase();
    // 60s cache — profiles change slowly (XP increments, occasional new badge).
    // Acceptable staleness; offloads bulk of social-share traffic from DB.
    if (this.cache) {
      return this.cache.wrap(`profile:${normalized}`, 60, () => this.fetchByUsername(normalized));
    }
    return this.fetchByUsername(normalized);
  }

  private async fetchByUsername(normalized: string) {

    // Filter on the composite index (profile_public, username) — fast.
    // Both conditions matter: profile_public=false is the privacy gate.
    const user = await this.prisma.siteUser.findFirst({
      where: { username: normalized, profile_public: true },
      include: {
        streak: { select: { current_streak: true, longest_streak: true } },
        badges: {
          include: { badge: true },
          orderBy: { earned_at: 'desc' },
          take: 12,
        },
      },
    });
    if (!user) throw new NotFoundException('Profile not found or set to private.');

    return {
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatar_url: user.avatar_url,
      experience: user.experience,
      current_role: user.current_role,
      target_role: user.target_role,
      github_url: user.github_url,
      linkedin_url: user.linkedin_url,
      level: user.level,
      level_name: LEVEL_NAMES[Math.max(0, Math.min(user.level - 1, LEVEL_NAMES.length - 1))],
      xp: user.xp,
      is_pro: user.is_pro,
      member_since: user.created_at,
      streak: user.streak ? {
        current: user.streak.current_streak,
        longest: user.streak.longest_streak,
      } : { current: 0, longest: 0 },
      badges: user.badges.map(b => ({
        code: b.badge.code,
        name: b.badge.name,
        description: b.badge.description,
        icon: b.badge.icon,
        tier: b.badge.tier,
        earned_at: b.earned_at,
      })),
      // No email, no phone, no last_login_at, no referral_code,
      // no resume roast history — those are private.
    };
  }
}
