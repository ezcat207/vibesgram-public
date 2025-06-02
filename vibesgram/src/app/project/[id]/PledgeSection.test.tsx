import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectPage from './page'; // Adjust if path is different or testing a sub-component
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { api } from '~/trpc/react';
import { ProjectStatus } from '@prisma/client';

// Mock tRPC
vi.mock('~/trpc/react', async () => {
  const actual = await vi.importActual('~/trpc/react');
  return {
    ...actual,
    api: {
      projectIdea: {
        getById: { useQuery: vi.fn() },
      },
      stripe: {
        createCheckoutSession: { useMutation: vi.fn() },
      },
      // Mock other routers/procedures if used by the page
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
const mockRouterReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
  useParams: () => ({ id: 'projectTest1' }), // Mock project ID
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }), // Default no query params
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('~/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const queryClient = new QueryClient();

const renderProjectPage = (sessionData = null) => {
  return render(
    <SessionProvider session={sessionData}>
      <QueryClientProvider client={queryClient}>
        <ProjectPage />
      </QueryClientProvider>
    </SessionProvider>
  );
};

describe('ProjectPage - Pledging Section', () => {
  let mockGetByIdQuery: ReturnType<typeof vi.fn>;
  let mockCreateCheckoutSessionMutation: ReturnType<typeof vi.fn>;

  const mockProjectIdeaCrowdfunding = {
    id: 'projectTest1',
    title: 'Test Crowdfunding Project',
    description: 'Support this!',
    status: ProjectStatus.CROWDFUNDING,
    userId: 'ownerUser',
    targetPrice: 10000,
    crowdfundingEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    pledges: [],
    user: { id: 'ownerUser', name: 'Owner', username: 'owner' },
    developerApplications: [],
    // ... other fields as needed by the page
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockGetByIdQuery = (api.projectIdea.getById.useQuery as ReturnType<typeof vi.fn>);
    mockCreateCheckoutSessionMutation = vi.fn();
    (api.stripe.createCheckoutSession.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: mockCreateCheckoutSessionMutation,
      isPending: false,
    });
    // Default mock for other queries on the page to avoid console errors
    (api.developerApplication.getForProject.useQuery as ReturnType<typeof vi.fn>).mockReturnValue({ data: [], isLoading: false });
    (api.projectMilestone.getForProject.useQuery as ReturnType<typeof vi.fn>).mockReturnValue({ data: [], isLoading: false });

  });

  it('allows user to input pledge amount and initiate pledge if project is CROWDFUNDING', async () => {
    mockGetByIdQuery.mockReturnValue({ data: mockProjectIdeaCrowdfunding, isLoading: false, error: null, refetch: vi.fn() });
    const sessionData = { user: { id: 'pledger1', name: 'Pledger' }, expires: 'never' };
    renderProjectPage(sessionData as any);

    const pledgeAmountInput = screen.getByLabelText(/pledge amount/i);
    const pledgeButton = screen.getByRole('button', { name: /pledge now/i });

    expect(pledgeAmountInput).toBeInTheDocument();
    expect(pledgeButton).toBeInTheDocument();
    expect(pledgeButton).not.toBeDisabled();

    await userEvent.clear(pledgeAmountInput);
    await userEvent.type(pledgeAmountInput, '2500'); // 2500 cents = $25.00
    await userEvent.click(pledgeButton);

    expect(mockCreateCheckoutSessionMutation).toHaveBeenCalledWith({
      projectIdeaId: 'projectTest1',
      amount: 2500,
    });
  });

  it('disables pledge button if user is project owner', async () => {
    mockGetByIdQuery.mockReturnValue({ data: mockProjectIdeaCrowdfunding, isLoading: false, error: null, refetch: vi.fn() });
    // Session user is the project owner
    const ownerSessionData = { user: { id: 'ownerUser', name: 'Owner' }, expires: 'never' };
    renderProjectPage(ownerSessionData as any);

    const pledgeButton = screen.getByRole('button', { name: /pledge now/i });
    expect(pledgeButton).toBeDisabled();
  });

  it('does not show pledge section if project is not CROWDFUNDING (e.g., FUNDED)', () => {
    const fundedProject = { ...mockProjectIdeaCrowdfunding, status: ProjectStatus.FUNDED };
    mockGetByIdQuery.mockReturnValue({ data: fundedProject, isLoading: false, error: null, refetch: vi.fn() });
    renderProjectPage();

    const pledgeAmountInput = screen.queryByLabelText(/pledge amount/i);
    const pledgeButton = screen.queryByRole('button', { name: /pledge now/i });

    expect(pledgeAmountInput).not.toBeInTheDocument();
    expect(pledgeButton).not.toBeInTheDocument();
    expect(screen.getByText(/project funded!/i)).toBeInTheDocument(); // Check for FUNDED status message
  });

  it('redirects to Stripe checkout on successful session creation', async () => {
    mockGetByIdQuery.mockReturnValue({ data: mockProjectIdeaCrowdfunding, isLoading: false, error: null, refetch: vi.fn() });
    const sessionData = { user: { id: 'pledger1' }, expires: 'never' };

    const checkoutUrl = 'https://checkout.stripe.com/mock_session';
    mockCreateCheckoutSessionMutation.mockImplementation((_variables, options) => {
        options?.onSuccess?.({ checkoutUrl, sessionId: 'sess_mock' });
    });
     (api.stripe.createCheckoutSession.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: mockCreateCheckoutSessionMutation,
      isPending: false,
    });


    renderProjectPage(sessionData as any);

    await userEvent.type(screen.getByLabelText(/pledge amount/i), '1000');
    await userEvent.click(screen.getByRole('button', { name: /pledge now/i }));

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(checkoutUrl);
    });
  });

  // TODO: Test for minimum pledge amount validation toast
});
