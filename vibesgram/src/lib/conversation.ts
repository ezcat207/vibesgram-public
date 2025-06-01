/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { db } from "@/server/db";
import { type Message } from "ai";

/**
 * Creates a new conversation and returns its ID
 * @param userId - The user ID
 * @returns The conversation ID
 */
export async function createConversationForUser(
  userId: string,
): Promise<string> {
  if (!userId) {
    throw new Error("User ID is required to create a conversation");
  }

  // Create a new conversation in the database
  const conversation = await db.conversation.create({
    data: {
      userId,
      messages: [], // Empty array of messages initially
    },
  });

  return conversation.id;
}

/**
 * Loads a conversation by ID for a specific user
 * @param id - The conversation ID
 * @param userId - The user ID
 * @returns The conversation messages
 * @throws Error if conversation doesn't exist or doesn't belong to the user
 */
export async function loadConversationForUser(
  id: string,
  userId: string,
): Promise<Message[]> {
  if (!userId) {
    throw new Error("User ID is required to load a conversation");
  }

  // Fetch from the database
  try {
    const conversation = await db.conversation.findUnique({
      where: {
        id,
        userId, // Ensure the conversation belongs to the specified user
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found or not authorized");
    }

    // Cast the JSON to Message[] type
    // Need to handle the type conversion safely
    const messagesData = conversation.messages as unknown;
    return Array.isArray(messagesData) ? (messagesData as Message[]) : [];
  } catch (error) {
    console.error("Error loading conversation:", error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

/**
 * Saves a conversation with updated messages for a specific user
 * @param params - The conversation data
 */
export async function saveConversationForUser({
  id,
  userId,
  messages,
  defaultTitle,
}: {
  id: string;
  userId: string;
  messages: Message[];
  defaultTitle?: string;
}): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required to save a conversation");
  }

  // Convert messages to a format compatible with JSON storage
  // This ensures we're storing valid JSON
  const messagesJson = JSON.parse(JSON.stringify(messages));

  // Check if conversation exists
  const existing = await db.conversation.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (existing) {
    // Update existing conversation
    await db.conversation.update({
      where: { id },
      data: {
        messages: messagesJson,
        updatedAt: new Date(),
      },
    });
  } else {
    // Create new conversation
    await db.conversation.create({
      data: {
        id,
        userId,
        messages: messagesJson,
        title: defaultTitle,
      },
    });
  }
}

/**
 * Gets all conversations for a specific user
 * @param userId - The user ID
 * @returns The conversations
 */
export async function getConversationsForUser(userId: string) {
  if (!userId) {
    return [];
  }

  return db.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Deletes a conversation for a specific user
 * @param id - The conversation ID
 * @param userId - The user ID
 */
export async function deleteConversationForUser(
  id: string,
  userId: string,
): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required to delete a conversation");
  }

  await db.conversation.deleteMany({
    where: {
      id,
      userId,
    },
  });
}

/**
 * Clears all messages for a specific conversation for a specific user
 * @param id - The conversation ID
 * @param userId - The user ID
 */
export async function clearMessageForUser(id: string, userId: string) {
  if (!userId) {
    throw new Error("User ID is required to clear a message");
  }

  await db.conversation.update({
    where: { id, userId },
    data: {
      messages: [],
    },
  });
}
