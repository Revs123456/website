/**
 * Reusable Prisma mock for unit tests. Every model used by a service under
 * test gets a jest-mocked set of the query methods that service actually
 * calls — override `PrismaService` in the Nest testing module with the
 * return value of this function instead of hitting a real database.
 *
 * Usage:
 *   const prisma = createMockPrismaService();
 *   const module = await Test.createTestingModule({ providers: [MyService] })
 *     .overrideProvider(PrismaService).useValue(prisma)
 *     .compile();
 *   prisma.admin.findUnique.mockResolvedValue({ ... });
 */
function mockModel() {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
  };
}

export function createMockPrismaService() {
  return {
    admin: mockModel(),
    refreshToken: mockModel(),
    userRefreshToken: mockModel(),
    siteUser: mockModel(),
    setting: mockModel(),
    order: mockModel(),
    service: mockModel(),
    booking: mockModel(),
    $executeRaw: jest.fn(),
    $transaction: jest.fn((arg: any) => (Array.isArray(arg) ? Promise.all(arg) : arg())),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
}

export type MockPrismaService = ReturnType<typeof createMockPrismaService>;
