import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { chats, messages } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { chatId } = await params
    const { role, content, toolInvocations } = await req.json()

    if (!role || !content) {
      return new Response("Role and content are required", { status: 400 })
    }

    // Verify chat ownership
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

    // Save message
    const newMessage = await db
      .insert(messages)
      .values({
        chatId,
        role,
        content,
        toolInvocations: toolInvocations || undefined,
      })
      .returning()

    // Update chat's updatedAt timestamp
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, chatId))

    return new Response(JSON.stringify(newMessage[0]), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Failed to save message:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
