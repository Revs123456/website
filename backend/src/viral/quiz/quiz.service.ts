import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateShareToken } from '../viral.util';

/**
 * 8 archetypes the quiz can resolve to.
 * Add new ones by extending this list AND the scoring weights in QUIZ.
 *
 * `traits` describes the archetype in 3 short tags — used by the share card.
 * `roles` are example job titles that match — used by the result page CTAs.
 */
export const ARCHETYPES = {
  'system-design-architect': {
    label: 'System Design Architect',
    blurb: 'You think in diagrams. You see scaling problems before they happen. You\'d rather design the cathedral than lay bricks.',
    traits: ['Big picture', 'Pattern-driven', 'Long-term'],
    roles: ['Staff Engineer', 'Principal Engineer', 'Solutions Architect'],
    emoji: '🏛️',
  },
  'product-engineer': {
    label: 'Product Engineer',
    blurb: 'You ship features users actually feel. You read user feedback like a novelist reads reviews. UX is engineering to you.',
    traits: ['User-obsessed', 'Pragmatic', 'Shipper'],
    roles: ['Senior Full-Stack Engineer', 'Founding Engineer', 'PM-Engineer'],
    emoji: '🚀',
  },
  'ai-ml-engineer': {
    label: 'AI/ML Engineer',
    blurb: 'You believe the next decade is model-shaped. You read papers for fun. Math doesn\'t scare you — it excites you.',
    traits: ['Research-minded', 'Numerical', 'Curious'],
    roles: ['ML Engineer', 'Applied Researcher', 'AI Platform Engineer'],
    emoji: '🤖',
  },
  'devops-platform': {
    label: 'DevOps / Platform Engineer',
    blurb: 'You\'re the one who keeps the lights on. You automate everything. Bash scripts are your love language.',
    traits: ['Systems-thinker', 'Automation-first', 'Reliable'],
    roles: ['Senior DevOps', 'Platform Engineer', 'SRE'],
    emoji: '⚙️',
  },
  'frontend-craftsman': {
    label: 'Frontend Craftsman',
    blurb: 'You sweat the pixels. You\'ve rewritten the same animation 4 times because the easing was off. Quality > quantity.',
    traits: ['Aesthetic-driven', 'Detail-obsessed', 'Performant'],
    roles: ['Senior Frontend Engineer', 'Design Engineer', 'UI Architect'],
    emoji: '🎨',
  },
  'backend-pragmatist': {
    label: 'Backend Pragmatist',
    blurb: 'You build APIs that don\'t break. You optimize the right things and ignore the wrong ones. You write the boring code that runs the business.',
    traits: ['Reliable', 'Deep-diver', 'Calm'],
    roles: ['Senior Backend Engineer', 'API Lead', 'Database Engineer'],
    emoji: '🛠️',
  },
  'founder-hacker': {
    label: 'Founder Hacker',
    blurb: 'You don\'t want a job — you want leverage. You\'ve built things on weekends. You\'d rather own 10% of something real than be employee #200.',
    traits: ['Builder', 'Risk-comfortable', 'Generalist'],
    roles: ['Founding Engineer', 'Solo Founder', 'CTO'],
    emoji: '⚡',
  },
  'security-engineer': {
    label: 'Security Engineer',
    blurb: 'You think like an attacker. You see CVEs in your sleep. You\'re paid to be paranoid — and you\'re really good at it.',
    traits: ['Adversarial', 'Detail-paranoid', 'Investigative'],
    roles: ['Application Security Engineer', 'Pentester', 'Security Architect'],
    emoji: '🛡️',
  },
} as const;

export type ArchetypeKey = keyof typeof ARCHETYPES;

/**
 * 10 questions. Each option contributes weighted points to specific archetypes.
 * Scoring rule: pick the archetype with the highest total. Ties broken by
 * the order in ARCHETYPES (stable).
 */
const QUESTIONS = [
  {
    q: 'A new project lands on your desk. What\'s your first move?',
    options: [
      { label: 'Sketch the system diagram',                 w: { 'system-design-architect': 3, 'devops-platform': 1 } },
      { label: 'Build a quick prototype to feel the problem', w: { 'product-engineer': 3, 'founder-hacker': 2 } },
      { label: 'Read every research paper on the topic',    w: { 'ai-ml-engineer': 3 } },
      { label: 'Set up CI/CD and infrastructure first',     w: { 'devops-platform': 3, 'backend-pragmatist': 1 } },
    ],
  },
  {
    q: 'Which complaint hurts the most?',
    options: [
      { label: '"This UI feels janky"',                     w: { 'frontend-craftsman': 3 } },
      { label: '"This API is slow"',                        w: { 'backend-pragmatist': 3, 'devops-platform': 1 } },
      { label: '"This model gives wrong answers"',          w: { 'ai-ml-engineer': 3 } },
      { label: '"Nobody is using this feature"',            w: { 'product-engineer': 3, 'founder-hacker': 2 } },
    ],
  },
  {
    q: 'Pick your weekend project archetype.',
    options: [
      { label: 'A SaaS micro-tool with paying users',       w: { 'founder-hacker': 3, 'product-engineer': 2 } },
      { label: 'A custom Kubernetes cluster at home',       w: { 'devops-platform': 3 } },
      { label: 'A CTF challenge writeup',                   w: { 'security-engineer': 3 } },
      { label: 'A new visualization library',               w: { 'frontend-craftsman': 3 } },
    ],
  },
  {
    q: 'Which book are you most likely to recommend?',
    options: [
      { label: 'Designing Data-Intensive Applications',     w: { 'system-design-architect': 3, 'backend-pragmatist': 2 } },
      { label: 'The Mom Test',                              w: { 'product-engineer': 2, 'founder-hacker': 3 } },
      { label: 'The Pragmatic Programmer',                  w: { 'backend-pragmatist': 2, 'product-engineer': 1 } },
      { label: 'Refactoring UI',                            w: { 'frontend-craftsman': 3 } },
    ],
  },
  {
    q: 'Your dream interview question is…',
    options: [
      { label: 'Design Twitter for 100M users',             w: { 'system-design-architect': 3 } },
      { label: 'Tell me about a bug you fixed end-to-end',  w: { 'backend-pragmatist': 2, 'product-engineer': 2 } },
      { label: 'How would you exploit this code snippet?',  w: { 'security-engineer': 3 } },
      { label: 'Explain attention in transformers',         w: { 'ai-ml-engineer': 3 } },
    ],
  },
  {
    q: 'When something breaks in prod at 2 AM, you…',
    options: [
      { label: 'Spin up the war room and lead the response', w: { 'devops-platform': 3, 'system-design-architect': 1 } },
      { label: 'Dig into the logs alone with coffee',       w: { 'backend-pragmatist': 3 } },
      { label: 'Check if it\'s a user-facing regression',   w: { 'product-engineer': 2, 'frontend-craftsman': 2 } },
      { label: 'Sleep — runbooks should handle this',       w: { 'system-design-architect': 2, 'devops-platform': 1 } },
    ],
  },
  {
    q: 'What do you optimize for in code?',
    options: [
      { label: 'Readability — future me will thank me',     w: { 'backend-pragmatist': 3, 'product-engineer': 1 } },
      { label: 'Performance — every ms counts',             w: { 'system-design-architect': 2, 'frontend-craftsman': 2 } },
      { label: 'Speed of iteration — perfect is the enemy', w: { 'founder-hacker': 3, 'product-engineer': 2 } },
      { label: 'Correctness — proofs over benchmarks',      w: { 'ai-ml-engineer': 2, 'security-engineer': 2 } },
    ],
  },
  {
    q: 'Your relationship with abstractions is…',
    options: [
      { label: 'Build them early to keep things clean',     w: { 'system-design-architect': 3, 'backend-pragmatist': 1 } },
      { label: 'Resist until duplication is painful',       w: { 'product-engineer': 3, 'founder-hacker': 2 } },
      { label: 'Make them composable like math',            w: { 'ai-ml-engineer': 2, 'frontend-craftsman': 2 } },
      { label: 'Strip them away — abstraction hides bugs',  w: { 'security-engineer': 3 } },
    ],
  },
  {
    q: 'Which "win" feels best?',
    options: [
      { label: 'Shipping a feature 100K users tried',       w: { 'product-engineer': 3, 'frontend-craftsman': 1 } },
      { label: 'Closing a critical vulnerability',          w: { 'security-engineer': 3 } },
      { label: 'A model beating SOTA by 2%',                w: { 'ai-ml-engineer': 3 } },
      { label: 'Cutting infra cost 40% with one config',    w: { 'devops-platform': 3, 'system-design-architect': 1 } },
    ],
  },
  {
    q: 'Five years out, you want to be…',
    options: [
      { label: 'Running a tech-led 10-person company',      w: { 'founder-hacker': 3 } },
      { label: 'The "go-to person" for a hard domain',      w: { 'ai-ml-engineer': 2, 'security-engineer': 2, 'system-design-architect': 1 } },
      { label: 'Leading a team that ships beloved products',w: { 'product-engineer': 3 } },
      { label: 'A respected staff/principal IC',            w: { 'system-design-architect': 2, 'backend-pragmatist': 2, 'frontend-craftsman': 1 } },
    ],
  },
];

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  getQuestions() {
    // Strip weights when shipping to client — answers shouldn't reveal scoring
    return QUESTIONS.map((q, i) => ({
      id: i,
      question: q.q,
      options: q.options.map((o, j) => ({ id: j, label: o.label })),
    }));
  }

  /** Compute the winning archetype + persist for shareability. */
  async submit(opts: {
    answers: number[];
    userId: string | null;
  }) {
    const { answers, userId } = opts;
    if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) {
      throw new BadRequestException(`Expected exactly ${QUESTIONS.length} answers.`);
    }

    // Tally
    const scores: Record<string, number> = {};
    for (let i = 0; i < QUESTIONS.length; i++) {
      const optionIdx = answers[i];
      const option = QUESTIONS[i].options[optionIdx];
      if (!option) throw new BadRequestException(`Invalid answer for question ${i + 1}.`);
      for (const [arch, weight] of Object.entries(option.w)) {
        scores[arch] = (scores[arch] ?? 0) + (weight as number);
      }
    }

    // Pick winner. Order in ARCHETYPES is stable tiebreak.
    let winnerKey: ArchetypeKey = 'product-engineer';
    let winnerScore = -1;
    for (const key of Object.keys(ARCHETYPES) as ArchetypeKey[]) {
      const s = scores[key] ?? 0;
      if (s > winnerScore) { winnerScore = s; winnerKey = key; }
    }

    const archetype = ARCHETYPES[winnerKey];
    const share_token = generateShareToken('q');

    await this.prisma.quizResult.create({
      data: {
        share_token,
        site_user_id: userId,
        result_type: winnerKey,
        result_label: archetype.label,
        answers: answers as any,
      },
    });

    return {
      share_token,
      result_type: winnerKey,
      label: archetype.label,
      blurb: archetype.blurb,
      traits: archetype.traits,
      roles: archetype.roles,
      emoji: archetype.emoji,
    };
  }

  async getByToken(share_token: string) {
    const result = await this.prisma.quizResult.findUnique({
      where: { share_token },
      select: { share_token: true, result_type: true, result_label: true, created_at: true, site_user_id: true },
    });
    if (!result) throw new NotFoundException('Quiz result not found.');
    const archetype = ARCHETYPES[result.result_type as ArchetypeKey];
    if (!archetype) throw new NotFoundException('Invalid quiz result.');
    return {
      ...result,
      blurb: archetype.blurb,
      traits: archetype.traits,
      roles: archetype.roles,
      emoji: archetype.emoji,
    };
  }
}
