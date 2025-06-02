import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectPage from './page'; // Testing the main page component
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { api } from '~/trpc/react';
import { ProjectStatus, DeveloperApplicationStatus } from '@prisma/client';

// Mock tRPC (extending from previous test file's setup)
vi.mock('~/trpc/react', async () => {
  const actual = await vi.importActual('~/trpc/react');
  return {
    ...actual,
    api: {
      projectIdea: {
        getById: { useQuery: vi.fn() },
        markAsCompleted: { useMutation: vi.fn() }, // Added from page features
      },
      stripe: {
        createCheckoutSession: { useMutation: vi.fn() },
      },
      developerApplication: {
        getForProject: { useQuery: vi.fn() },
        apply: { useMutation: vi.fn() },
        accept: { useMutation: vi.fn() },
        reject: { useMutation: vi.fn() },
      },
      projectMilestone: {
        getForProject: { useQuery: vi.fn() },
        create: { useMutation: vi.fn() },
        toggleComplete: { useMutation: vi.fn() },
        delete: { useMutation: vi.fn() },
      }
    },
  };
});

// Mock Next.js router
const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn(); // For query param clearing
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
  useParams: () => ({ id: 'projectDevAppTest1' }), // Mock project ID
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('~/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const queryClient = new QueryClient();
const renderProjectPage = (sessionData: any, projectData: any) => {
  (api.projectIdea.getById.useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
    data: projectData, isLoading: false, error: null, refetch: vi.fn()
  });
  // Mock other queries as needed, e.g., for milestones, applications
  (api.developerApplication.getForProject.useQuery as ReturnType<typeof vi.fn>).mockReturnValue({ data: projectData.developerApplications || [], isLoading: false, refetch: vi.fn()});
  (api.projectMilestone.getForProject.useQuery as ReturnType<typeof vi.fn>).mockReturnValue({ data: projectData.milestones || [], isLoading: false, refetch: vi.fn()});


  return render(
    <SessionProvider session={sessionData}>
      <QueryClientProvider client={queryClient}>
        <ProjectPage />
      </QueryClientProvider>
    </SessionProvider>
  );
};

describe('ProjectPage - Developer Application & Management', () => {
  let mockApplyMutation: ReturnType<typeof vi.fn>;
  let mockAcceptMutation: ReturnType<typeof vi.fn>;
  let mockRejectMutation: ReturnType<typeof vi.fn>;

  const projectOwnerSession = { user: { id: 'ownerXYZ', name: 'Project Owner' }, expires: 'never' };
  const developerSession = { user: { id: 'devABC', name: 'Developer User' }, expires: 'never' };

  const fundedProjectNoApps = {
    id: 'projectDevAppTest1', title: 'Funded Project Needs Dev', status: ProjectStatus.FUNDED,
    userId: projectOwnerSession.user.id,
    developerApplications: [], pledges: [], user: {id: projectOwnerSession.user.id}
    // ... other fields
  };
  const fundedProjectWithPendingApp = {
    ...fundedProjectNoApps,
    developerApplications: [
      { id: 'app1', developerId: 'devABC', developer:{name:'Dev User'}, coverLetter: 'My CV for app1', status: DeveloperApplicationStatus.PENDING, createdAt: new Date() },
      { id: 'app2', developerId: 'devXYZ', developer:{name:'Another Dev'}, coverLetter: 'My CV for app2', status: DeveloperApplicationStatus.PENDING, createdAt: new Date() },
    ],
  };


  beforeEach(() => {
    vi.resetAllMocks();
    mockApplyMutation = vi.fn();
    mockAcceptMutation = vi.fn();
    mockRejectMutation = vi.fn();

    (api.developerApplication.apply.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({ mutate: mockApplyMutation, isPending: false });
    (api.developerApplication.accept.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({ mutate: mockAcceptMutation, isPending: false });
    (api.developerApplication.reject.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({ mutate: mockRejectMutation, isPending: false });
  });

  // Developer applies
  it('allows a developer to apply for a FUNDED project', async () => {
    renderProjectPage(developerSession, fundedProjectNoApps);

    const coverLetterTextarea = screen.getByLabelText(/your cover letter/i);
    const applyButton = screen.getByRole('button', { name: /submit application/i });

    expect(coverLetterTextarea).toBeInTheDocument();
    await userEvent.type(coverLetterTextarea, 'This is my detailed cover letter explaining my skills.');
    await userEvent.click(applyButton);

    expect(mockApplyMutation).toHaveBeenCalledWith({
      projectIdeaId: fundedProjectNoApps.id,
      coverLetter: 'This is my detailed cover letter explaining my skills.',
    });
  });

  it('does not show apply section if user is project owner', () => {
    renderProjectPage(projectOwnerSession, fundedProjectNoApps);
    expect(screen.queryByLabelText(/your cover letter/i)).not.toBeInTheDocument();
  });

  it('does not show apply section if project is not FUNDED (e.g. CROWDFUNDING)', () => {
    renderProjectPage(developerSession, {...fundedProjectNoApps, status: ProjectStatus.CROWDFUNDING });
    expect(screen.queryByLabelText(/your cover letter/i)).not.toBeInTheDocument();
  });

  // Project owner manages applications
  it('allows project owner to see and accept a PENDING application', async () => {
    renderProjectPage(projectOwnerSession, fundedProjectWithPendingApp);

    // Find the "Accept" button for the first application (app1)
    // This assumes the applications are rendered in a way that allows selecting specific ones.
    // A more robust selector might be needed (e.g., within a card for 'Dev User')
    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    expect(acceptButtons.length).toBeGreaterThan(0);

    // Mock the mutation's onSuccess to simulate backend behavior
    mockAcceptMutation.mockImplementation((_variables, options) => {
        options?.onSuccess?.({ id: 'app1', status: 'ACCEPTED', developer:{name:'Dev User'} }); // Simulate success with some data
    });
     (api.developerApplication.accept.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: mockAcceptMutation, isPending: false,
    });


    await userEvent.click(acceptButtons[0]);

    expect(mockAcceptMutation).toHaveBeenCalledWith({ applicationId: 'app1' });
    // Check for toast message (via mockToast)
    // await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Application Accepted" })));
  });

  it('allows project owner to reject a PENDING application', async () => {
    renderProjectPage(projectOwnerSession, fundedProjectWithPendingApp);

    const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
    expect(rejectButtons.length).toBeGreaterThan(0);

    mockRejectMutation.mockImplementation((_variables, options) => {
        options?.onSuccess?.({ id: 'app2', status: 'REJECTED', developer:{name:'Another Dev'} });
    });
    (api.developerApplication.reject.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: mockRejectMutation, isPending: false,
    });

    await userEvent.click(rejectButtons[1]); // Assuming this corresponds to app2

    expect(mockRejectMutation).toHaveBeenCalledWith({ applicationId: 'app2' });
    // await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Application Rejected" })));
  });

  it('does not show accept/reject buttons if project is IN_PROGRESS', () => {
    renderProjectPage(projectOwnerSession, {...fundedProjectWithPendingApp, status: ProjectStatus.IN_PROGRESS });
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
  });
});
