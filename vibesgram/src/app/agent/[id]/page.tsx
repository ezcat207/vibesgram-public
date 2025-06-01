import { AgentContainer, AgentProvider } from "@/components/agent";
import { AgentHeader } from "@/components/agent/layout";
import { Header } from "@/components/layout/header";
import { DISABLE_AGENT } from "@/lib/const";
import {
  createConversationForUser,
  loadConversationForUser,
} from "@/lib/conversation";
import { auth } from "@/server/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AgentChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (DISABLE_AGENT) {
    redirect("/");
  }

  // Check if user is authenticated
  const session = await auth();

  // If not authenticated, redirect to login
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const userId = session.user.id;

  // Get the conversation ID from URL params
  let { id } = await params;

  // Handle special case: "new" - create a new conversation
  if (id === "new") {
    id = await createConversationForUser(userId);
    redirect(`/agent/${id}`);
  }

  // Load initial messages for this conversation
  try {
    const initialMessages = await loadConversationForUser(id, userId);

    return (
      <div className="flex min-h-screen flex-col">
        <AgentProvider initialMessages={initialMessages} chatId={id}>
          <AgentHeader />
          <main className="flex flex-1 flex-col">
            <AgentContainer className="flex-1" />
          </main>
        </AgentProvider>
      </div>
    );
  } catch (error) {
    // Handle the error - conversation not found or not authorized
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center">
          <div className="max-w-md rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
            <h2 className="mb-2 text-xl font-semibold">Access Denied</h2>
            <p className="mb-4 text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "You don't have permission to view this conversation or it doesn't exist."}
            </p>
            <Link
              href="/agent/new"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Start New Conversation
            </Link>
          </div>
        </main>
      </div>
    );
  }
}
