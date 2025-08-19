import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { chats, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, session.user.email))
      .orderBy(chats.updatedAt);

    return new Response(JSON.stringify(userChats), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Failed to fetch chats:", error);

    if (error.message?.includes("Too many database connection attempts")) {
      return new Response("Database is busy. Please try again in a moment.", {
        status: 503,
      });
    }

    if (
      error.code === "CONNECT_TIMEOUT" ||
      error.message?.includes("timeout")
    ) {
      return new Response("Database connection timeout. Please try again.", {
        status: 503,
      });
    }

    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { title } = await req.json();

    if (!title) {
      return new Response("Title is required", { status: 400 });
    }

    // Ensure user exists before creating chat
    await db
      .insert(users)
      .values({
        id: session.user.email,
        email: session.user.email,
        name: session.user.name || null,
        image: session.user.image || null,
      })
      .onConflictDoNothing();

    const [newChat] = await db
      .insert(chats)
      .values({
        userId: session.user.email,
        title: title.slice(0, 100),
      })
      .returning();

    return new Response(JSON.stringify(newChat), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Failed to create chat:", error);

    if (error.message?.includes("Too many database connection attempts")) {
      return new Response("Database is busy. Please try again in a moment.", {
        status: 503,
      });
    }

    if (
      error.code === "CONNECT_TIMEOUT" ||
      error.message?.includes("timeout")
    ) {
      return new Response("Database connection timeout. Please try again.", {
        status: 503,
      });
    }

    return new Response("Internal Server Error", { status: 500 });
  }
}
