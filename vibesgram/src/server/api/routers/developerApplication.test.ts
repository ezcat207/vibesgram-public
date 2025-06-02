import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from '~/server/api/root';
import { createInnerTRPCContext } from '~/server/api/trpc';
import { type DeepMockProxy, mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, ProjectStatus, DeveloperApplication } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { DeveloperApplicationStatus } from './developerApplication'; // Import local enum

// Mock Prisma client
const prismaMock = mockDeep<PrismaClient>();
vi.mock('~/server/db', () => ({
  db: prismaMock,
}));

describe('DeveloperApplication Router', () => {
  const projectOwnerSession = {
    user: { id: 'owner123', name: 'Project Owner', email: 'owner@example.com', image: null, username: 'owneruser' },
    expires: new Date().toISOString(),
  };
  const developerSession = {
    user: { id: 'dev123', name: 'Developer One', email: 'dev@example.com', image: null, username: 'devuser' },
    expires: new Date().toISOString(),
  };

  const ownerCtx = createInnerTRPCContext({ session: projectOwnerSession });
  const devCtx = createInnerTRPCContext({ session: developerSession });
  const ownerCaller = appRouter.createCaller(ownerCtx);
  const devCaller = appRouter.createCaller(devCtx);

  const projectIdeaId = 'fundedProject1';

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('developerApplication.apply', () => {
    const applyInput = {
      projectIdeaId,
      coverLetter: 'I am a great developer for this project because...',
    };

    it('should allow a developer to apply for a FUNDED project', async () => {
      prismaMock.projectIdea.findUnique.mockResolvedValue({
        id: projectIdeaId,
        userId: projectOwnerSession.user.id, // Owned by someone else
        status: ProjectStatus.FUNDED,
      } as any);
      prismaMock.developerApplication.findUnique.mockResolvedValue(null); // No existing application
      prismaMock.developerApplication.count.mockResolvedValue(0); // No accepted applications yet
      const expectedApp = { ...applyInput, developerId: developerSession.user.id, status: DeveloperApplicationStatus.enum.PENDING, id:'app1' } as DeveloperApplication;
      prismaMock.developerApplication.create.mockResolvedValue(expectedApp);

      const result = await devCaller.developerApplication.apply(applyInput);
      expect(result).toEqual(expectedApp);
      expect(prismaMock.developerApplication.create).toHaveBeenCalledWith({
        data: {
          developerId: developerSession.user.id,
          projectIdeaId,
          coverLetter: applyInput.coverLetter,
          status: DeveloperApplicationStatus.enum.PENDING,
        },
      });
    });

    it('should prevent applying to own project', async () => {
      prismaMock.projectIdea.findUnique.mockResolvedValue({
        id: projectIdeaId,
        userId: developerSession.user.id, // Owned by the applicant
        status: ProjectStatus.FUNDED,
      } as any);

      await expect(devCaller.developerApplication.apply(applyInput))
        .rejects.toThrowError(TRPCError);
      await expect(devCaller.developerApplication.apply(applyInput))
        .rejects.toHaveProperty('code', 'BAD_REQUEST');
    });

    it('should prevent applying to a non-FUNDED project', async () => {
      prismaMock.projectIdea.findUnique.mockResolvedValue({
        id: projectIdeaId,
        userId: projectOwnerSession.user.id,
        status: ProjectStatus.CROWDFUNDING, // Not FUNDED
      } as any);
       prismaMock.developerApplication.findUnique.mockResolvedValue(null);

      await expect(devCaller.developerApplication.apply(applyInput))
        .rejects.toThrowError(TRPCError);
      await expect(devCaller.developerApplication.apply(applyInput))
        .rejects.toHaveProperty('code', 'BAD_REQUEST');
    });

    it('should prevent applying if project already has an accepted developer', async () => {
        prismaMock.projectIdea.findUnique.mockResolvedValue({
            id: projectIdeaId, userId: projectOwnerSession.user.id, status: ProjectStatus.FUNDED,
        } as any);
        prismaMock.developerApplication.findUnique.mockResolvedValue(null); // No existing application by this dev
        prismaMock.developerApplication.count.mockResolvedValue(1); // One accepted application exists

        await expect(devCaller.developerApplication.apply(applyInput))
            .rejects.toThrowError(/This project has already accepted a developer/);
    });
  });

  describe('developerApplication.accept', () => {
    const applicationId = 'appToAccept1';
    const mockApplication = {
      id: applicationId,
      projectIdeaId,
      developerId: developerSession.user.id,
      status: DeveloperApplicationStatus.enum.PENDING,
      projectIdea: { id: projectIdeaId, userId: projectOwnerSession.user.id, status: ProjectStatus.FUNDED },
    } as any;

    it('should allow project owner to accept a PENDING application', async () => {
      prismaMock.developerApplication.findUnique.mockResolvedValue(mockApplication);
      prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock)); // Mock transaction
      prismaMock.developerApplication.update.mockResolvedValue({ ...mockApplication, status: DeveloperApplicationStatus.enum.ACCEPTED });
      prismaMock.projectIdea.update.mockResolvedValue({ ...mockApplication.projectIdea, status: ProjectStatus.IN_PROGRESS });
      prismaMock.developerApplication.updateMany.mockResolvedValue({ count: 0 }); // Assume no other apps to reject for simplicity

      const result = await ownerCaller.developerApplication.accept({ applicationId });

      expect(result.status).toBe(DeveloperApplicationStatus.enum.ACCEPTED);
      expect(prismaMock.projectIdea.update).toHaveBeenCalledWith({
        where: { id: projectIdeaId },
        data: { status: ProjectStatus.IN_PROGRESS },
      });
      expect(prismaMock.developerApplication.updateMany).toHaveBeenCalled(); // Check if other apps rejection was called
    });

    it('should prevent non-owner from accepting an application', async () => {
      const nonOwnerCtx = createInnerTRPCContext({ session: developerSession }); // Use dev session
      const nonOwnerCaller = appRouter.createCaller(nonOwnerCtx);
      prismaMock.developerApplication.findUnique.mockResolvedValue(mockApplication);

      await expect(nonOwnerCaller.developerApplication.accept({ applicationId }))
        .rejects.toThrowError(TRPCError);
      await expect(nonOwnerCaller.developerApplication.accept({ applicationId }))
        .rejects.toHaveProperty('code', 'FORBIDDEN');
    });

    it('should prevent accepting application if project is not FUNDED', async () => {
        const appOnCrowdfundingProject = {
            ...mockApplication,
            projectIdea: { ...mockApplication.projectIdea, status: ProjectStatus.CROWDFUNDING }
        };
        prismaMock.developerApplication.findUnique.mockResolvedValue(appOnCrowdfundingProject);

        await expect(ownerCaller.developerApplication.accept({ applicationId }))
            .rejects.toThrowError(/Project must be in 'FUNDED' status/);
    });

    it('should prevent accepting an application that is not PENDING', async () => {
        const alreadyAcceptedApp = { ...mockApplication, status: DeveloperApplicationStatus.enum.ACCEPTED };
        prismaMock.developerApplication.findUnique.mockResolvedValue(alreadyAcceptedApp);

        await expect(ownerCaller.developerApplication.accept({ applicationId }))
            .rejects.toThrowError(/Application is already in 'ACCEPTED' status/);
    });
  });

  // TODO: Add tests for getForProject, getForDeveloper, reject
});
