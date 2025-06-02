import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectPage from './page'; // Testing the main page component
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { api } from '~/trpc/react';
import { ProjectStatus, ProjectMilestone } from '@prisma/client';

// Mock tRPC (similar to DeveloperApplication.test.tsx)
vi.mock('~/trpc/react', async () => {
  const actual = await vi.importActual('~/trpc/react');
  return {
    ...actual,
    api: {
      projectIdea: { getById: { useQuery: vi.fn() }, markAsCompleted: { useMutation: vi.fn() } },
      stripe: { createCheckoutSession: { useMutation: vi.fn() } },
      developerApplication: { getForProject: { useQuery: vi.fn() }, apply: { useMutation: vi.fn() }, accept: { useMutation: vi.fn() }, reject: { useMutation: vi.fn() } },
      projectMilestone: { getForProject: { useQuery: vi.fn() }, create: { useMutation: vi.fn() }, toggleComplete: { useMutation: vi.fn() }, delete: { useMutation: vi.fn() } }
    },
  };
});

// Mock Next.js router & toast (similar to DeveloperApplication.test.tsx)
const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
  useParams: () => ({ id: 'projectMilestoneTest1' }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}));
const mockToast = vi.fn();
vi.mock('~/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const queryClient = new QueryClient();
const renderProjectPage = (sessionData: any, projectData: any, milestonesData: any[] = []) => {
  (api.projectIdea.getById.useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
    data: projectData, isLoading: false, error: null, refetch: vi.fn()
  });
  (api.developerApplication.getForProject.useQuery as ReturnType<typeof vi.fn>).mockReturnValue({ data: projectData.developerApplications || [], isLoading: false, refetch: vi.fn()});
  (api.projectMilestone.getForProject.useQuery as ReturnType<typeof vi.fn>).mockReturnValue({ data: milestonesData, isLoading: false, refetch: vi.fn() });

  return render(
    <SessionProvider session={sessionData}>
      <QueryClientProvider client={queryClient}>
        <ProjectPage />
      </QueryClientProvider>
    </SessionProvider>
  );
};

describe('ProjectPage - Milestone Management', () => {
  let mockCreateMilestoneMutation: ReturnType<typeof vi.fn>;
  let mockToggleMilestoneMutation: ReturnType<typeof vi.fn>;
  let mockDeleteMilestoneMutation: ReturnType<typeof vi.fn>;

  const projectOwnerSession = { user: { id: 'ownerMilestone', name: 'Milestone Owner' }, expires: 'never' };
  const acceptedDevSession = { user: { id: 'devMilestone', name: 'Milestone Dev' }, expires: 'never' };
  const otherUserSession = { user: { id: 'otherMilestone', name: 'Other User' }, expires: 'never' };

  const projectInProgress = {
    id: 'projectMilestoneTest1', title: 'Project With Milestones', status: ProjectStatus.IN_PROGRESS,
    userId: projectOwnerSession.user.id,
    developerApplications: [{ developerId: acceptedDevSession.user.id, status: 'ACCEPTED' }],
    pledges: [], user: {id: projectOwnerSession.user.id}
    // ... other fields
  };
  const initialMilestones: ProjectMilestone[] = [
    { id: 'm1', title: 'First Milestone', description: 'Desc 1', completed: true, projectIdeaId: projectInProgress.id, createdAt: new Date(), updatedAt: new Date(), dueDate: null },
    { id: 'm2', title: 'Second Milestone', description: 'Desc 2', completed: false, projectIdeaId: projectInProgress.id, createdAt: new Date(), updatedAt: new Date(), dueDate: new Date() },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    mockCreateMilestoneMutation = vi.fn();
    mockToggleMilestoneMutation = vi.fn();
    mockDeleteMilestoneMutation = vi.fn();

    (api.projectMilestone.create.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({ mutate: mockCreateMilestoneMutation, isPending: false });
    (api.projectMilestone.toggleComplete.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({ mutate: mockToggleMilestoneMutation, isPending: false });
    (api.projectMilestone.delete.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({ mutate: mockDeleteMilestoneMutation, isPending: false });
  });

  it('allows project owner to add a milestone if project is IN_PROGRESS', async () => {
    renderProjectPage(projectOwnerSession, projectInProgress, initialMilestones);

    await userEvent.type(screen.getByLabelText(/title/i, { selector: 'input[id="milestoneTitle"]'}), 'New Test Milestone');
    await userEvent.type(screen.getByLabelText(/description \(optional\)/i), 'A description for testing.');
    await userEvent.click(screen.getByRole('button', { name: /add milestone/i }));

    expect(mockCreateMilestoneMutation).toHaveBeenCalledWith(expect.objectContaining({
      projectIdeaId: projectInProgress.id,
      title: 'New Test Milestone',
      description: 'A description for testing.',
    }));
  });

  it('allows accepted developer to add a milestone if project is IN_PROGRESS', async () => {
    renderProjectPage(acceptedDevSession, projectInProgress, initialMilestones);
    await userEvent.type(screen.getByLabelText(/title/i, { selector: 'input[id="milestoneTitle"]'}), 'Dev Milestone');
    await userEvent.click(screen.getByRole('button', { name: /add milestone/i }));
    expect(mockCreateMilestoneMutation).toHaveBeenCalledWith(expect.objectContaining({ title: 'Dev Milestone' }));
  });

  it('does not show add milestone form for non-authorized users', () => {
    renderProjectPage(otherUserSession, projectInProgress, initialMilestones);
    expect(screen.queryByRole('button', { name: /add milestone/i })).not.toBeInTheDocument();
  });

  it('does not show add milestone form if project is not IN_PROGRESS (e.g. FUNDED)', () => {
    renderProjectPage(projectOwnerSession, {...projectInProgress, status: ProjectStatus.FUNDED }, initialMilestones);
    expect(screen.queryByRole('button', { name: /add milestone/i })).not.toBeInTheDocument();
  });


  it('allows authorized user to toggle milestone completion', async () => {
    renderProjectPage(projectOwnerSession, projectInProgress, initialMilestones);

    // Find checkbox for the second milestone (m2, which is not completed)
    // This relies on how checkboxes are associated with milestones (e.g., by ID or title)
    const checkboxLabel = screen.getByLabelText('Done', { selector: 'input[id="milestone-m2"] + label'});
    const checkbox = screen.getByRole('checkbox', { name: 'Done',  checked: false }); // Assuming it's linked by label content for m2

    mockToggleMilestoneMutation.mockImplementation((_variables, options) => {
        options?.onSuccess?.({ id: 'm2', completed: true });
    });
     (api.projectMilestone.toggleComplete.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: mockToggleMilestoneMutation, isPending: false,
    });


    await userEvent.click(checkbox);

    expect(mockToggleMilestoneMutation).toHaveBeenCalledWith({
      id: 'm2',
      projectIdeaId: projectInProgress.id,
      completed: true,
    });
  });

  it('allows authorized user to delete a milestone', async () => {
    renderProjectPage(projectOwnerSession, projectInProgress, initialMilestones);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBe(initialMilestones.length); // One for each milestone

    mockDeleteMilestoneMutation.mockImplementation((_variables, options) => {
        options?.onSuccess?.({ id: 'm1' });
    });
    (api.projectMilestone.delete.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: mockDeleteMilestoneMutation, isPending: false,
    });

    await userEvent.click(deleteButtons[0]); // Delete the first milestone (m1)

    expect(mockDeleteMilestoneMutation).toHaveBeenCalledWith({
      id: 'm1',
      projectIdeaId: projectInProgress.id,
    });
  });
});
