import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from '~/server/api/root';
import { createInnerTRPCContext } from '~/server/api/trpc';
import { type DeepMockProxy, mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, ProjectStatus, ProjectMilestone } from '@prisma/client';
import { TRPCError } from '@trpc/server';

// Mock Prisma client
const prismaMock = mockDeep<PrismaClient>();
vi.mock('~/server/db', () => ({
  db: prismaMock,
}));

describe('ProjectMilestone Router', () => {
  const projectOwnerSession = {
    user: { id: 'owner123', name: 'Project Owner', username: 'owneruser' },
    expires: new Date().toISOString(),
  };
  const acceptedDeveloperSession = {
    user: { id: 'dev123', name: 'Accepted Developer', username: 'devuser' },
    expires: new Date().toISOString(),
  };
  const otherUserSession = {
    user: { id: 'otherUser1', name: 'Other User', username: 'otheruser' },
    expires: new Date().toISOString(),
  };

  const ownerCtx = createInnerTRPCContext({ session: projectOwnerSession as any });
  const devCtx = createInnerTRPCContext({ session: acceptedDeveloperSession as any });
  const otherUserCtx = createInnerTRPCContext({ session: otherUserSession as any });

  const ownerCaller = appRouter.createCaller(ownerCtx);
  const devCaller = appRouter.createCaller(devCtx);
  const otherUserCaller = appRouter.createCaller(otherUserCtx);

  const projectIdeaId = 'inProgressProject1';
  const mockProjectIdeaInProgress = {
    id: projectIdeaId,
    userId: projectOwnerSession.user.id,
    status: ProjectStatus.IN_PROGRESS,
    developerApplications: [{ developerId: acceptedDeveloperSession.user.id, status: 'ACCEPTED' }],
  };
   const mockProjectIdeaFunded = { // For testing cases where project is not yet IN_PROGRESS
    id: 'fundedProject2',
    userId: projectOwnerSession.user.id,
    status: ProjectStatus.FUNDED,
    developerApplications: [],
  };


  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('projectMilestone.create', () => {
    const createInput = {
      projectIdeaId,
      title: 'New Milestone',
      description: 'Description for the new milestone.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };

    it('should allow project owner to create a milestone for IN_PROGRESS project', async () => {
      prismaMock.projectIdea.findUnique.mockResolvedValue(mockProjectIdeaInProgress as any);
      const expectedMilestone = { ...createInput, id: 'milestone1', completed: false, createdAt: new Date(), updatedAt: new Date() } as ProjectMilestone;
      prismaMock.projectMilestone.create.mockResolvedValue(expectedMilestone);

      const result = await ownerCaller.projectMilestone.create(createInput);
      expect(result).toEqual(expectedMilestone);
      expect(prismaMock.projectMilestone.create).toHaveBeenCalledWith({
        data: { ...createInput, description: createInput.description ?? "" },
      });
    });

    it('should allow accepted developer to create a milestone for IN_PROGRESS project', async () => {
      prismaMock.projectIdea.findUnique.mockResolvedValue(mockProjectIdeaInProgress as any);
      const expectedMilestone = { ...createInput, id: 'milestone2' } as any;
      prismaMock.projectMilestone.create.mockResolvedValue(expectedMilestone);

      const result = await devCaller.projectMilestone.create(createInput);
      expect(result).toEqual(expectedMilestone);
    });

    it('should prevent non-authorized user from creating a milestone', async () => {
      prismaMock.projectIdea.findUnique.mockResolvedValue(mockProjectIdeaInProgress as any);

      await expect(otherUserCaller.projectMilestone.create(createInput))
        .rejects.toThrowError(TRPCError);
      await expect(otherUserCaller.projectMilestone.create(createInput))
        .rejects.toHaveProperty('code', 'FORBIDDEN');
    });

    it('should prevent creating milestone if project is not IN_PROGRESS', async () => {
      prismaMock.projectIdea.findUnique.mockResolvedValue(mockProjectIdeaFunded as any);
       const fundedProjectCreateInput = {...createInput, projectIdeaId: mockProjectIdeaFunded.id };

      await expect(ownerCaller.projectMilestone.create(fundedProjectCreateInput))
        .rejects.toThrowError(/Project must be IN_PROGRESS to add milestones/);
    });
  });

  describe('projectMilestone.toggleComplete', () => {
    const milestoneId = 'ms1';
    const toggleInput = { id: milestoneId, projectIdeaId, completed: true };

    it('should allow project owner to toggle milestone completion', async () => {
      prismaMock.projectIdea.findUnique.mockResolvedValue(mockProjectIdeaInProgress as any);
      prismaMock.projectMilestone.update.mockResolvedValue({ ...toggleInput } as any);

      const result = await ownerCaller.projectMilestone.toggleComplete(toggleInput);
      expect(result.completed).toBe(true);
      expect(prismaMock.projectMilestone.update).toHaveBeenCalledWith({
        where: { id: milestoneId },
        data: { completed: true },
      });
    });

    it('should prevent toggling if project is not IN_PROGRESS', async () => {
        prismaMock.projectIdea.findUnique.mockResolvedValue(mockProjectIdeaFunded as any); // Project is FUNDED, not IN_PROGRESS
        const fundedProjectToggleInput = {...toggleInput, projectIdeaId: mockProjectIdeaFunded.id};

        await expect(ownerCaller.projectMilestone.toggleComplete(fundedProjectToggleInput))
            .rejects.toThrowError(/Project must be IN_PROGRESS to update milestones/);
    });
  });

  // TODO: Tests for getForProject, update, delete
});
