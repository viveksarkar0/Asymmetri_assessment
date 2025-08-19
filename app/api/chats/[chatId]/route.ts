import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { chats, messages } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { chatId } = await params

    // Fetch chat and verify ownership
    const chat = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.id, chatId),
          eq(chats.userId, session.user.email)
        )
      )
      .limit(1)

    if (chat.length === 0) {
      return new Response("Chat not found", { status: 404 })
    }

    // Fetch messages for this chat
    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt)

    return new Response(JSON.stringify({
      chat: chat[0],
      messages: chatMessages,
    }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Failed to fetch chat:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { chatId } = await params

    // Verify ownership before deletion
    const chat = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.id, chatId),
          eq(chats.userId, session.user.email)
        )
      )
      .limit(1)

    if (chat.length === 0) {
      return new Response("Chat not found", { status: 404 })
    }

    // Delete the chat (messages will be cascaded due to foreign key constraint)
    await db.delete(chats).where(eq(chats.id, chatId))

    return new Response("Chat deleted successfully", { status: 200 })
  } catch (error) {
    console.error("Failed to delete chat:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
