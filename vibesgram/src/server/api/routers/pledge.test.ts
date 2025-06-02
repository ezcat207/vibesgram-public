import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from '~/server/api/root';
import { createInnerTRPCContext } from '~/server/api/trpc';
import { type DeepMockProxy, mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, Pledge, ProjectStatus } from '@prisma/client';
// import { TRPCError } from '@trpc/server'; // Not typically thrown by 'getMine' unless unauthenticated

// Mock Prisma client
const prismaMock = mockDeep<PrismaClient>();
vi.mock('~/server/db', () => ({
  db: prismaMock,
}));

describe('Pledge Router', () => {
  const mockUserSession = {
    user: { id: 'userPledger123', name: 'Pledger User', username: 'pledgerRUs' },
    expires: new Date().toISOString(),
  };
  const userCtx = createInnerTRPCContext({ session: mockUserSession as any });
  const caller = appRouter.createCaller(userCtx);

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('pledge.getMine', () => {
    it('should return pledges made by the current user with project details', async () => {
      const userId = mockUserSession.user.id;
      const expectedPledges = [
        {
          id: 'pledge1',
          userId,
          amount: 1000,
          projectIdeaId: 'project1',
          createdAt: new Date(),
          paymentIntentId: 'pi_1',
          projectIdea: { id: 'project1', title: 'Project Alpha', status: ProjectStatus.CROWDFUNDING },
        },
        {
          id: 'pledge2',
          userId,
          amount: 500,
          projectIdeaId: 'project2',
          createdAt: new Date(),
          paymentIntentId: 'pi_2',
          projectIdea: { id: 'project2', title: 'Project Beta', status: ProjectStatus.FUNDED },
        },
      ];

      prismaMock.pledge.findMany.mockResolvedValue(expectedPledges as any); // Cast as any for simplicity with nested select

      const result = await caller.pledge.getMine();

      expect(result.length).toBe(2);
      expect(result[0].projectIdea.title).toBe('Project Alpha');
      expect(result[1].amount).toBe(500);
      expect(prismaMock.pledge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          include: {
            projectIdea: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should return an empty array if the user has made no pledges', async () => {
      const userId = mockUserSession.user.id;
      prismaMock.pledge.findMany.mockResolvedValue([]);

      const result = await caller.pledge.getMine();

      expect(result).toEqual([]);
      expect(prismaMock.pledge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        })
      );
    });

    it('should require authentication (implicitly tested by protectedProcedure)', async () => {
      // Create a context without a session
      const unauthedCtx = createInnerTRPCContext({ session: null });
      const unauthedCaller = appRouter.createCaller(unauthedCtx);

      // protectedProcedure should throw UNAUTHORIZED if session is null
      await expect(unauthedCaller.pledge.getMine())
        .rejects.toThrowError(/UNAUTHORIZED/); // Message might vary slightly
        // .rejects.toHaveProperty('code', 'UNAUTHORIZED'); // More specific
      expect(prismaMock.pledge.findMany).not.toHaveBeenCalled();
    });
  });
});
