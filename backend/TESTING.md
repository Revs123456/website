# Backend Testing

Unit tests run on Jest (already configured in `package.json`'s `jest` block).
Coverage is deliberately concentrated on the five highest-risk modules first
(`auth`, `payments`, `orders`, `bookings`, `users`); everything else still
needs specs — see the checklist at the bottom.

## Running tests

```bash
npm test              # all unit specs (*.spec.ts under src/)
npm run test:watch    # watch mode
npm run test:cov      # with coverage report → backend/coverage/
npm run test:e2e      # end-to-end specs under test/*.e2e-spec.ts (needs a real DB)
```

A JUnit report is also written to `coverage/junit.xml` on every run (via
`jest-junit`) — that's what CI reads to render pass/fail per test.

## Pattern for a new module's tests

Every service takes `PrismaService` (extending `PrismaClient` directly) as a
constructor dependency. Don't hit a real database in unit tests — mock it:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/helpers/mock-prisma';

describe('MyService', () => {
  let service: MyService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyService, PrismaService], // PrismaService MUST be listed before it can be overridden
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    service = module.get<MyService>(MyService);
  });

  it('does the thing', async () => {
    prisma.someModel.findUnique.mockResolvedValue({ id: '1' });
    await expect(service.findOne('1')).resolves.toEqual({ id: '1' });
  });
});
```

If the model you need isn't in `test/helpers/mock-prisma.ts` yet, add it to
`createMockPrismaService()` rather than hand-rolling a mock per spec.

**Other injected services** (mail, otp, xp, badges, referrals, …): pass a
plain `{ provide: TheService, useValue: { methodUsed: jest.fn() } }` — don't
pull in the real implementation.

**Env-dependent constructors** (`AuthService.getJwtSecret()`,
`PaymentsService`'s Razorpay client, `UsersService`'s JWT signing): dummy
values for `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` are already
set globally in `test/jest.setup.ts` — you don't need to set them per spec.

**External SDKs constructed in a service's constructor** (e.g. `Razorpay` in
`PaymentsService`): mock the whole module at the top of the spec file —

```ts
jest.mock('razorpay', () => jest.fn().mockImplementation(() => ({
  orders: { create: jest.fn() },
  payments: { fetch: jest.fn() },
})));
```

— then reach into the constructed instance via `(service as any).razorpay`
to program its responses per test. See `src/payments/payments.service.spec.ts`.

**Controllers**: keep these thin. Mock the service, assert the controller
calls it with the right arguments and shapes the HTTP response (cookies,
status codes, stripped fields) correctly — the business logic itself belongs
in the service spec. See `src/auth/auth.controller.spec.ts` for the
cookie/CSRF assertions pattern.

## Modules still needing specs

Follow the pattern above, one module at a time. Roughly in order of risk /
user impact:

- [ ] jobs, job-applications, subscriptions (payment-adjacent)
- [ ] otp, engagement (xp/badges — used by users.service today, so partly
      exercised indirectly, but has no specs of its own)
- [ ] slots, saved-jobs, notifications
- [ ] viral, community, dashboard, activity-feed
- [ ] ai, chat, evaluator, mock-interview, optimizer, revbot
- [ ] blogs, courses, roadmaps, testimonials, success-stories,
      interview-questions, salary-insights, daily-tips, resume-templates
- [ ] settings, subscribers, audit, push, mail, seed, services, cache,
      challenges, common, health, prisma

## Test database for `test:e2e`

`test/jest-e2e.json` runs specs matching `*.e2e-spec.ts` against a real
NestJS app instance. Point `DATABASE_URL` at a disposable Postgres instance
before running it locally — `docker-compose.yml` at the repo root spins one
up (`docker compose up db`). CI does the same via a `postgres` service
container (see `.github/workflows/test.yml`).
