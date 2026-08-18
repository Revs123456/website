import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { XpService } from '../engagement/xp.service';
import { StreakService } from '../engagement/streak.service';
import { BadgesService } from '../engagement/badges.service';
import { EvaluatorService } from '../evaluator/evaluator.service';
import { istTodayDate, XP_REASONS } from '../engagement/engagement.constants';

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xp: XpService,
    private readonly streak: StreakService,
    private readonly badges: BadgesService,
    private readonly evaluator: EvaluatorService,
  ) {}

  /**
   * Cron — IST midnight. Picks a random published interview question and
   * locks it as today's challenge. Idempotent via unique(date): re-runs
   * (e.g. after restart) won't replace today's pick.
   *
   * NestJS Cron supports `timeZone` since v6. 'Asia/Kolkata' has no DST.
   */
  @Cron('0 0 * * *', { timeZone: 'Asia/Kolkata' })
  async selectDailyChallenge(): Promise<void> {
    const today = istTodayDate();

    const existing = await this.prisma.dailyChallenge.findUnique({ where: { date: today } });
    if (existing) {
      this.logger.log(`Daily challenge for ${today} already exists; skipping`);
      return;
    }

    // Pool: any published interview question. Could be filtered to
    // behavioral-only later, but the existing question bank mixes types
    // and that's fine for Phase 2 (participation, not perfect curation).
    const total = await this.prisma.interviewQuestion.count({ where: { published: true } });
    if (total === 0) {
      this.logger.warn('No published interview questions available — skipping daily challenge selection');
      return;
    }

    const skip = Math.floor(Math.random() * total);
    const question = await this.prisma.interviewQuestion.findFirst({
      where: { published: true },
      skip,
      orderBy: { created_at: 'asc' },
    });
    if (!question) return;

    try {
      await this.prisma.dailyChallenge.create({
        data: { date: today, question_id: question.id, xp_reward: 50 },
      });
      this.logger.log(`Selected daily challenge for ${today}: question ${question.id}`);
    } catch (e: any) {
      // P2002 = race condition (another instance won) — fine, log and move on
      if (e?.code !== 'P2002') throw e;
    }
  }

  /** Public read — anyone (logged in or not) can view today's question. */
  async getTodaysChallenge() {
    const today = istTodayDate();
    let challenge = await this.prisma.dailyChallenge.findUnique({ where: { date: today } });

    // Lazy backfill: if cron hasn't run yet today (e.g. fresh deploy, missed run),
    // pick one on first read. Same logic, same idempotency.
    if (!challenge) {
      await this.selectDailyChallenge();
      challenge = await this.prisma.dailyChallenge.findUnique({ where: { date: today } });
    }
    if (!challenge) return null;

    const question = await this.prisma.interviewQuestion.findUnique({
      where: { id: challenge.question_id },
      select: {
        id: true, company: true, role: true, question: true,
        difficulty: true, category: true,
      },
    });

    return {
      date: challenge.date,
      xp_reward: challenge.xp_reward,
      question,
      // We deliberately don't return the answer text here — even for the public
      // endpoint — so users actually attempt it before seeing it.
    };
  }

  /**
   * Submit an answer. Atomic: insert submission + award XP + touch streak +
   * evaluate badges, all in one transaction. The user.xp, streak, and badges
   * read back from /users/me will be consistent immediately.
   */
  async submit(userId: string, date: string, answer: string) {
    const today = istTodayDate();
    if (date !== today) {
      throw new BadRequestException('You can only submit today\'s challenge.');
    }

    const challenge = await this.prisma.dailyChallenge.findUnique({ where: { date } });
    if (!challenge) throw new NotFoundException('No challenge found for this date.');

    // Check duplicate before opening a transaction — cheaper to fail fast
    const existing = await this.prisma.challengeSubmission.findUnique({
      where: { site_user_id_challenge_id: { site_user_id: userId, challenge_id: challenge.id } },
    });
    if (existing) throw new ConflictException('You have already submitted today\'s challenge.');

    const txResult = await this.prisma.$transaction(async (tx) => {
      // Race-safe insert — unique constraint catches the case where two requests
      // arrive in the gap between our check and this write.
      let submission;
      try {
        submission = await tx.challengeSubmission.create({
          data: {
            site_user_id: userId,
            challenge_id: challenge.id,
            answer,
          },
        });
      } catch (e: any) {
        if (e?.code === 'P2002') throw new ConflictException('You have already submitted today\'s challenge.');
        throw e;
      }

      const xpResult = await this.xp.award(userId, challenge.xp_reward, XP_REASONS.DAILY_CHALLENGE, {
        metadata: { challenge_id: challenge.id, date },
        // No idempotency_key here — the submission's unique constraint above
        // is what guards against double XP; using one would block intentional
        // future re-grading by AI.
        tx,
      });

      const streakResult = await this.streak.touchStreak(userId, tx);

      // Badges last — they read streak/xp/submission_count that the steps
      // above just updated.
      const newBadges = await this.badges.evaluate(userId, 'challenge_submitted', tx);
      // Also evaluate streak and xp/level badges in case the milestone hit one
      const moreBadges1 = streakResult.changed
        ? await this.badges.evaluate(userId, 'streak_changed', tx)
        : [];
      const moreBadges2 = xpResult.leveled_up
        ? await this.badges.evaluate(userId, 'level_up', tx)
        : [];

      return {
        submission: { id: submission.id, submitted_at: submission.submitted_at },
        xp: {
          awarded: xpResult.amount,
          total_xp: xpResult.total_xp,
          leveled_up: xpResult.leveled_up,
          new_level: xpResult.new_level,
        },
        streak: {
          current: streakResult.current_streak,
          longest: streakResult.longest_streak,
          milestone_hit: streakResult.milestone_hit,
          milestone_xp: streakResult.milestone_xp,
        },
        new_badges: [...newBadges, ...moreBadges1, ...moreBadges2],
      };
    });

    // Async AI evaluation — fire-and-forget AFTER the transaction commits.
    // Failures here don't roll back the submission (the user already saw their
    // XP/streak update on the response). The score lands on the next /account
    // refresh once it's written back to ai_score/ai_feedback.
    const question = await this.prisma.interviewQuestion.findUnique({
      where: { id: challenge.question_id },
      select: { question: true },
    });
    if (question) {
      this.evaluator.evaluateChallengeSubmission({
        submissionId: txResult.submission.id,
        userId,
        questionText: question.question,
        answer,
      }).catch(() => undefined);
    }

    return txResult;
  }

  async getMySubmissionForToday(userId: string) {
    const today = istTodayDate();
    const challenge = await this.prisma.dailyChallenge.findUnique({ where: { date: today } });
    if (!challenge) return null;
    return this.prisma.challengeSubmission.findUnique({
      where: { site_user_id_challenge_id: { site_user_id: userId, challenge_id: challenge.id } },
    });
  }
}
