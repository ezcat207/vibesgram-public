import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubmitIdeaPage from './page'; // Adjust path as needed
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react'; // If page uses useSession
import { api } from '~/trpc/react'; // Path to your tRPC setup for mocking

// Mock tRPC
vi.mock('~/trpc/react', async () => {
  const actual = await vi.importActual('~/trpc/react');
  return {
    ...actual,
    api: {
      projectIdea: {
        create: {
          useMutation: vi.fn(),
        },
      },
      // Mock other procedures if this page uses them for queries
    },
  };
});

// Mock Next.js router
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
  useParams: () => ({}), // If needed
  useSearchParams: () => ({ get: vi.fn() }), // If needed
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('~/hooks/use-toast', () => ({ // Adjust path as needed
  useToast: () => ({
    toast: mockToast,
  }),
}));

const queryClient = new QueryClient();

// Helper to wrap component with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <SessionProvider session={null}> {/* Provide a mock session if needed */}
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    </SessionProvider>
  );
};


describe('SubmitIdeaPage', () => {
  let mockCreateMutation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    mockCreateMutation = vi.fn();
    (api.projectIdea.create.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: mockCreateMutation,
      isPending: false,
    });
  });

  it('renders the form correctly', () => {
    renderWithProviders(<SubmitIdeaPage />);
    expect(screen.getByLabelText(/project title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/detailed description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit project idea/i })).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    renderWithProviders(<SubmitIdeaPage />);
    await userEvent.click(screen.getByRole('button', { name: /submit project idea/i }));

    // Check for a few error messages (Zod errors appear)
    // Note: The exact error messages depend on your Zod schema and react-hook-form setup
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/description is required/i)).toBeInTheDocument();
    // ... test other required fields
    expect(mockCreateMutation).not.toHaveBeenCalled();
  });

  it('validates targetPrice range (e.g., must be at least 100 cents)', async () => {
    renderWithProviders(<SubmitIdeaPage />);
    const titleInput = screen.getByLabelText(/project title/i);
    // ... fill other required fields ...
    await userEvent.type(titleInput, 'Valid Title');
    // ... (fill other required fields to pass their validation)

    const priceInput = screen.getByLabelText(/target funding amount/i);
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, '50'); // Below 100 cents minimum

    await userEvent.click(screen.getByRole('button', { name: /submit project idea/i }));

    expect(await screen.findByText(/target price must be at least \$1.00 \(100 cents\)/i)).toBeInTheDocument();
    expect(mockCreateMutation).not.toHaveBeenCalled();
  });

  it('successfully submits the form with valid data', async () => {
    const mockData = {
        title: 'New Valid Idea',
        description: 'This is a very detailed and valid description of the project idea that meets all length requirements.',
        expectedFeatures: 'Feature A, Feature B, Feature C',
        targetPrice: 300,
        projectType: 'Web Application',
        contactInfo: 'valid@email.com',
        crowdfundingEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 60 days from now
    };

    // Mock mutation success
    (api.projectIdea.create.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: mockCreateMutation.mockImplementation((variables) => {
        // Simulate successful API call
        // The actual onSuccess logic is part of the component
      }),
      isPending: false,
      // Simulate onSuccess behavior by directly calling it or checking its effects
    });
     mockCreateMutation.mockImplementation((_variables, options) => {
        options?.onSuccess?.({ id: 'project123', ...mockData, crowdfundingEndDate: new Date(mockData.crowdfundingEndDate) });
     });


    renderWithProviders(<SubmitIdeaPage />);

    await userEvent.type(screen.getByLabelText(/project title/i), mockData.title);
    await userEvent.type(screen.getByLabelText(/detailed description/i), mockData.description);
    await userEvent.type(screen.getByLabelText(/expected features/i), mockData.expectedFeatures);
    const priceInput = screen.getByLabelText(/target funding amount/i);
    await userEvent.clear(priceInput); // Clear default value
    await userEvent.type(priceInput, mockData.targetPrice.toString());
    await userEvent.type(screen.getByLabelText(/project type/i), mockData.projectType);
    await userEvent.type(screen.getByLabelText(/contact email/i), mockData.contactInfo);
    await userEvent.type(screen.getByLabelText(/crowdfunding end date/i), mockData.crowdfundingEndDate);

    await userEvent.click(screen.getByRole('button', { name: /submit project idea/i }));

    await waitFor(() => {
      expect(mockCreateMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockData.title,
          description: mockData.description,
          expectedFeatures: ['Feature A', 'Feature B', 'Feature C'], // Processed by form
          targetPrice: mockData.targetPrice,
          projectType: mockData.projectType,
          contactInfo: mockData.contactInfo,
          crowdfundingEndDate: new Date(mockData.crowdfundingEndDate), // Converted to Date
        }),
        expect.anything() // For the options object
      );
    });

    // Check for toast message and navigation (indirectly, via mocks)
    // await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Project Idea Submitted!" })));
    // await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/project/project123'));
    // Due to how onSuccess is called in the mock, these might need more specific waiting or assertion setup
  });

  // TODO: Test AI placeholder button presence
});
