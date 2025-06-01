/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { DISABLE_AGENT, MAX_STEPS, ToolName } from "@/lib/const";
import { saveConversationForUser } from "@/lib/conversation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { openai } from "@ai-sdk/openai";
import { appendResponseMessages, streamText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (DISABLE_AGENT) {
    return NextResponse.json(
      { error: "Agent is disabled until we are ready to launch" },
      { status: 403 },
    );
  }

  try {
    // Check if user is authenticated
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { messages } = await req.json();
    const { id } = await params;
    const userId = session.user.id;

    // Check if conversation exists and belongs to user before processing
    const conversation = await db.conversation.findUnique({
      where: {
        id,
        userId,
      },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found or not authorized" },
        { status: 403 },
      );
    }

    const result = streamText({
      model: openai("gpt-4o"),
      system: `You are a helpful Code Editor Assistant who can help users manipulate text content in the editor panel.

      Your primary function is to help users with text editing operations. When responding:
      1. Update text content - Use ${ToolName.CODE_EDITOR} to update the content in the editor panel
      2. Format text - Help users format their text in various ways
      3. Transform text - Assist with text transformations like case changes, line wrapping, etc.

      IMPORTANT: You are working with self-contained, single HTML documents. The content in the editor is a complete HTML file that should include all necessary elements (<html>, <head>, <body>, etc.).

      IMPORTANT: You must think out loud and explain your reasoning process:
      - Before performing any actions, explain your plan in detail
      - After updating the text, explain what changes were made
      - If multiple steps are needed, explain each step
      - Share your thought process about the text modifications

      Usage instructions:
      - Use the \`${ToolName.CODE_EDITOR}\` tool to update the editor content
      - The tool only needs the content parameter
      - Each update should maintain a complete, self-contained HTML document
      - Keep the user informed about what changes you're making
      - Be clear and precise in your explanations
      - Respond to users in a professional and helpful tone

      Example of thinking out loud:
      "I understand you want to convert this text to uppercase. Let me plan this out:
      1. I'll take the current HTML document
      2. Convert the text content to uppercase while preserving the HTML structure
      3. Use ${ToolName.CODE_EDITOR} to update the content
      Let me make those changes now..."

      After updating, explain what happened:
      "I've updated the text to uppercase format while maintaining the complete HTML structure. You should now see the transformed document in the editor panel."`,
      messages,
      tools: {
        [ToolName.CODE_EDITOR]: {
          description:
            "A simple declarative code editor that replaces the entire content. Each call will replace the current content with the new content provided, maintaining no history or incremental changes.",
          parameters: z.object({
            content: z.string(),
          }),
        },
      },
      maxSteps: MAX_STEPS,
      async onFinish({ response }) {
        try {
          // Use the appendResponseMessages helper to add the AI response to the messages
          const updatedMessages = appendResponseMessages({
            messages,
            responseMessages: response.messages,
          });

          // Save conversation with updated messages
          await saveConversationForUser({
            id,
            userId,
            messages: updatedMessages,
            // TODO: Optionally generate a title based on the first few messages
            defaultTitle:
              updatedMessages[0]?.content?.slice(0, 50) ?? "New conversation",
          });
        } catch (error) {
          console.error("Error saving conversation:", error);
          // Still continue with the response even if saving fails
        }
      },
    });

    // Consume the stream to ensure it runs to completion even if client disconnects
    // see https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot-message-persistence#handling-client-disconnects
    void result.consumeStream(); // no await, this is intentional

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Agent API error:", error);

    // Determine specific error type and return appropriate message
    let errorMessage = "An unexpected error occurred";
    let statusCode = 500;

    if (error instanceof SyntaxError) {
      errorMessage = "Invalid request format";
      statusCode = 400;
    } else if (error instanceof z.ZodError) {
      errorMessage = "Invalid parameters for tool";
      statusCode = 400;
    } else if (error instanceof Error) {
      // Don't expose full error details in production, but provide meaningful message
      errorMessage = `Error processing request: ${error.message}`;
    }

    // Log full error for debugging but return sanitized version to client
    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
      },
      { status: statusCode },
    );
  }
}
