import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from '~/server/api/root'; // Assuming appRouter is your main router
import { createInnerTRPCContext } from '~/server/api/trpc'; // Helper to create context
import { type DeepMockProxy, mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, ProjectStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';

// Mock Prisma client
const prismaMock = mockDeep<PrismaClient>();
vi.mock('~/server/db', () => ({
  db: prismaMock,
}));

describe('ProjectIdea Router', () => {
  const mockSession = {
    user: { id: 'user123', name: 'Test User', email: 'test@example.com', image: null, username: 'testuser' },
    expires: new Date().toISOString(),
  };
  const ctx = createInnerTRPCContext({ session: mockSession });
  const caller = appRouter.createCaller(ctx);

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('projectIdea.create', () => {
    it('should create a project idea with valid input', async () => {
      const input = {
        title: 'Test Project',
        description: 'A great project description.',
        expectedFeatures: ['Feature 1', 'Feature 2'],
        targetPrice: 500, // $5.00
        projectType: 'Web App',
        contactInfo: 'test@example.com',
        crowdfundingEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      };
      const expectedOutput = { ...input, id: 'project1', userId: 'user123', status: ProjectStatus.CROWDFUNDING, createdAt: new Date(), updatedAt: new Date() };

      prismaMock.projectIdea.create.mockResolvedValue(expectedOutput);

      const result = await caller.projectIdea.create(input);
      expect(result).toEqual(expectedOutput);
      expect(prismaMock.projectIdea.create).toHaveBeenCalledWith({
        data: {
          ...input,
          userId: 'user123',
        },
      });
    });

    it('should throw TRPCError for invalid targetPrice (too low)', async () => {
      const input = {
        title: 'Test Project Low Price',
        description: 'Valid description',
        expectedFeatures: ['Feature1'],
        targetPrice: 50, // $0.50 - too low based on schema (min 100 cents)
        projectType: 'AI Tool',
        contactInfo: 'contact@example.com',
        crowdfundingEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      };

      // Zod validation happens before the resolver, so we expect an error related to input parsing.
      // For tRPC, this often results in a TRPCError with code 'BAD_REQUEST' or 'INTERNAL_SERVER_ERROR' if Zod errors aren't handled gracefully by the framework setup.
      // Let's assume it's a BAD_REQUEST due to Zod parsing.
      await expect(caller.projectIdea.create(input))
        .rejects.toThrowError((e) => {
          // Check if it's a TRPCError and if the message indicates a Zod validation issue
          // This check might need adjustment based on how tRPC/Zod errors are structured in your specific setup
          return e instanceof TRPCError && e.code === 'BAD_REQUEST';
        });
      expect(prismaMock.projectIdea.create).not.toHaveBeenCalled();
    });

    it('should throw TRPCError for crowdfundingEndDate in the past', async () => {
        const input = {
            title: 'Old Project',
            description: 'A project with an old end date.',
            expectedFeatures: ['Feature 1'],
            targetPrice: 200,
            projectType: 'Mobile App',
            contactInfo: 'old@example.com',
            crowdfundingEndDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        };
        await expect(caller.projectIdea.create(input))
            .rejects.toThrowError((e) => e instanceof TRPCError && e.code === 'BAD_REQUEST');
        expect(prismaMock.projectIdea.create).not.toHaveBeenCalled();
    });
  });

  describe('projectIdea.markAsCompleted', () => {
    it('should allow project owner to mark IN_PROGRESS project as COMPLETED', async () => {
      const projectIdeaId = 'project1';
      prismaMock.projectIdea.findUnique.mockResolvedValue({
        id: projectIdeaId,
        userId: 'user123',
        status: ProjectStatus.IN_PROGRESS,
        // ... other fields
      } as any); // Cast to any to satisfy mock, ensure all required fields are present if not using 'any'
      prismaMock.projectIdea.update.mockResolvedValue({
        id: projectIdeaId,
        userId: 'user123',
        status: ProjectStatus.COMPLETED,
         // ... other fields
      } as any);

      const result = await caller.projectIdea.markAsCompleted({ projectIdeaId });
      expect(result.status).toBe(ProjectStatus.COMPLETED);
      expect(prismaMock.projectIdea.update).toHaveBeenCalledWith({
        where: { id: projectIdeaId },
        data: { status: ProjectStatus.COMPLETED },
      });
    });

    it('should prevent non-owner from marking project as COMPLETED', async () => {
      const projectIdeaId = 'project2';
      prismaMock.projectIdea.findUnique.mockResolvedValue({
        id: projectIdeaId,
        userId: 'otherUser', // Different user ID
        status: ProjectStatus.IN_PROGRESS,
      } as any);

      await expect(caller.projectIdea.markAsCompleted({ projectIdeaId }))
        .rejects.toThrowError(TRPCError);
      await expect(caller.projectIdea.markAsCompleted({ projectIdeaId }))
        .rejects.toHaveProperty('code', 'FORBIDDEN');
      expect(prismaMock.projectIdea.update).not.toHaveBeenCalled();
    });

    it('should prevent marking project as COMPLETED if not IN_PROGRESS', async () => {
      const projectIdeaId = 'project3';
      prismaMock.projectIdea.findUnique.mockResolvedValue({
        id: projectIdeaId,
        userId: 'user123',
        status: ProjectStatus.FUNDED, // Not IN_PROGRESS
      } as any);

      await expect(caller.projectIdea.markAsCompleted({ projectIdeaId }))
        .rejects.toThrowError(TRPCError);
      await expect(caller.projectIdea.markAsCompleted({ projectIdeaId }))
        .rejects.toHaveProperty('code', 'BAD_REQUEST');
      expect(prismaMock.projectIdea.update).not.toHaveBeenCalled();
    });
  });

  // TODO: Add tests for getAll (various filters) and getById
});
