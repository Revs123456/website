import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityFeedService } from '../activity-feed/activity-feed.service';
import { XpService } from '../engagement/xp.service';

/**
 * User-facing community operations: ask, answer, vote, accept, bookmark.
 * The existing CommunityService (admin CMS) is left untouched — this is
 * separate concern: end users acting on questions vs admins curating them.
 *
 * Voting happens in transactions so the denormalized votes_count stays
 * consistent with the actual vote rows.
 */
@Injectable()
export class UserCommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityFeedService,
    private readonly xp: XpService,
  ) {}

  // ── Questions ──────────────────────────────────────────────────────────────

  /** Authenticated post — sets author_name + site_user_id from the user record. */
  async askQuestion(userId: string, dto: { title: string; question: string; tags?: string }) {
    const user = await this.prisma.siteUser.findUnique({
      where: { id: userId },
      select: { name: true, username: true },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.communityQuestion.create({
      data: {
        site_user_id: userId,
        author_name: user.name || user.username || 'Anonymous',
        title: dto.title,
        question: dto.question,
        tags: dto.tags,
        published: true,
      },
    });
  }

  /**
   * Fetch question with answers (sorted accepted-first then by votes desc),
   * vote counts, and the viewer's vote/bookmark state if logged in.
   *
   * One controller call to populate the entire detail page.
   */
  async getDetail(questionId: string, viewerId: string | null) {
    const question = await this.prisma.communityQuestion.findFirst({
      where: { id: questionId, published: true },
      include: {
        user: { select: { username: true, name: true, level: true } },
        answers: {
          orderBy: [{ accepted: 'desc' }, { votes_count: 'desc' }, { created_at: 'asc' }],
          include: {
            user: { select: { username: true, name: true, level: true, is_pro: true } },
          },
        },
      },
    });
    if (!question) throw new NotFoundException('Question not found');

    // Build viewer-specific state — vote sets + bookmark flag
    let viewerQuestionVoted = false;
    let viewerBookmarked = false;
    const viewerAnswerVotes = new Set<string>();

    if (viewerId) {
      const [qVote, bookmark, aVotes] = await Promise.all([
        this.prisma.communityVote.findUnique({
          where: { site_user_id_question_id: { site_user_id: viewerId, question_id: questionId } },
        }),
        this.prisma.communityBookmark.findUnique({
          where: { site_user_id_question_id: { site_user_id: viewerId, question_id: questionId } },
        }),
        question.answers.length > 0
          ? this.prisma.communityVote.findMany({
              where: { site_user_id: viewerId, answer_id: { in: question.answers.map(a => a.id) } },
              select: { answer_id: true },
            })
          : Promise.resolve([]),
      ]);
      viewerQuestionVoted = !!qVote;
      viewerBookmarked = !!bookmark;
      for (const v of aVotes) if (v.answer_id) viewerAnswerVotes.add(v.answer_id);
    }

    return {
      ...question,
      viewer: {
        is_author: viewerId === question.site_user_id,
        voted: viewerQuestionVoted,
        bookmarked: viewerBookmarked,
      },
      answers: question.answers.map(a => ({
        ...a,
        viewer_voted: viewerAnswerVotes.has(a.id),
      })),
    };
  }

  // ── Answers ────────────────────────────────────────────────────────────────

  async addAnswer(userId: string, questionId: string, content: string) {
    if (content.trim().length < 20) {
      throw new BadRequestException('Answer must be at least 20 characters.');
    }

    const question = await this.prisma.communityQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found');

    // Insert + bump denormalized counter atomically
    const answer = await this.prisma.$transaction(async (tx) => {
      const created = await tx.communityAnswer.create({
        data: { site_user_id: userId, question_id: questionId, content: content.trim() },
      });
      await tx.communityQuestion.update({
        where: { id: questionId },
        data: { answers_count: { increment: 1 } },
      });
      return created;
    });

    // Notify the question's author (if logged-in user, not the same person, and exists)
    if (question.site_user_id && question.site_user_id !== userId) {
      const author = await this.prisma.siteUser.findUnique({
        where: { id: userId },
        select: { name: true, username: true },
      });
      const fromName = author?.name || author?.username || 'Someone';
      await this.notifications.create({
        userId: question.site_user_id,
        type: 'answer_received',
        title: `${fromName} answered your question`,
        body: question.title.slice(0, 120),
        linkUrl: `/community/${questionId}`,
        icon: 'MessageSquare',
      });
    }

    return answer;
  }

  async deleteOwnAnswer(userId: string, answerId: string) {
    const ans = await this.prisma.communityAnswer.findUnique({ where: { id: answerId } });
    if (!ans) throw new NotFoundException();
    if (ans.site_user_id !== userId) throw new ForbiddenException();

    await this.prisma.$transaction(async (tx) => {
      await tx.communityAnswer.delete({ where: { id: answerId } });
      await tx.communityQuestion.update({
        where: { id: ans.question_id },
        data: { answers_count: { decrement: 1 } },
      });
    });
    return { deleted: true };
  }

  // ── Accept answer (asker only) ────────────────────────────────────────────

  async acceptAnswer(userId: string, answerId: string) {
    const ans = await this.prisma.communityAnswer.findUnique({
      where: { id: answerId },
      include: { question: true },
    });
    if (!ans) throw new NotFoundException();
    if (ans.question.site_user_id !== userId) {
      throw new ForbiddenException('Only the question asker can accept an answer');
    }

    // One accepted answer per question — un-accept all others first.
    await this.prisma.$transaction(async (tx) => {
      await tx.communityAnswer.updateMany({
        where: { question_id: ans.question_id, accepted: true },
        data: { accepted: false },
      });
      await tx.communityAnswer.update({
        where: { id: answerId },
        data: { accepted: true },
      });
      await tx.communityQuestion.update({
        where: { id: ans.question_id },
        data: { solved: true },
      });
    });

    // Reward the answer author — outside tx (XP/activity/notification each manage their own)
    if (ans.site_user_id !== userId) {
      await this.xp.award(ans.site_user_id, 100, 'answer_accepted', {
        metadata: { question_id: ans.question_id, answer_id: answerId },
        idempotencyKey: `answer_accepted:${answerId}`,
      });
      await this.activity.record({
        userId: ans.site_user_id,
        type: 'answer_accepted',
        metadata: { question_id: ans.question_id, question_title: ans.question.title },
        isPublic: true,
      });
      await this.notifications.create({
        userId: ans.site_user_id,
        type: 'answer_accepted',
        title: 'Your answer was accepted!',
        body: ans.question.title.slice(0, 120),
        linkUrl: `/community/${ans.question_id}`,
        icon: 'Check',
      });
    }

    return { accepted: true };
  }

  // ── Voting ─────────────────────────────────────────────────────────────────

  /** Toggle upvote on a question. Returns new vote count + whether user now has a vote. */
  async toggleQuestionVote(userId: string, questionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.communityVote.findUnique({
        where: { site_user_id_question_id: { site_user_id: userId, question_id: questionId } },
      });
      if (existing) {
        await tx.communityVote.delete({ where: { id: existing.id } });
        const q = await tx.communityQuestion.update({
          where: { id: questionId },
          data: { votes_count: { decrement: 1 } },
          select: { votes_count: true },
        });
        return { voted: false, votes_count: Math.max(0, q.votes_count) };
      }
      await tx.communityVote.create({
        data: { site_user_id: userId, question_id: questionId, value: 1 },
      });
      const q = await tx.communityQuestion.update({
        where: { id: questionId },
        data: { votes_count: { increment: 1 } },
        select: { votes_count: true },
      });
      return { voted: true, votes_count: q.votes_count };
    });
  }

  /** Toggle upvote on an answer. Same pattern as question. */
  async toggleAnswerVote(userId: string, answerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.communityVote.findUnique({
        where: { site_user_id_answer_id: { site_user_id: userId, answer_id: answerId } },
      });
      if (existing) {
        await tx.communityVote.delete({ where: { id: existing.id } });
        const a = await tx.communityAnswer.update({
          where: { id: answerId },
          data: { votes_count: { decrement: 1 } },
          select: { votes_count: true },
        });
        return { voted: false, votes_count: Math.max(0, a.votes_count) };
      }
      await tx.communityVote.create({
        data: { site_user_id: userId, answer_id: answerId, value: 1 },
      });
      const a = await tx.communityAnswer.update({
        where: { id: answerId },
        data: { votes_count: { increment: 1 } },
        select: { votes_count: true },
      });
      return { voted: true, votes_count: a.votes_count };
    });
  }

  // ── Bookmarks ──────────────────────────────────────────────────────────────

  async toggleBookmark(userId: string, questionId: string) {
    const existing = await this.prisma.communityBookmark.findUnique({
      where: { site_user_id_question_id: { site_user_id: userId, question_id: questionId } },
    });
    if (existing) {
      await this.prisma.communityBookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }
    await this.prisma.communityBookmark.create({
      data: { site_user_id: userId, question_id: questionId },
    });
    return { bookmarked: true };
  }

  async listBookmarks(userId: string) {
    return this.prisma.communityBookmark.findMany({
      where: { site_user_id: userId },
      orderBy: { created_at: 'desc' },
      include: { question: { select: { id: true, title: true, tags: true, answers_count: true } } },
      take: 100,
    });
  }
}
