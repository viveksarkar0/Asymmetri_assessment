import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Global connection singleton to prevent multiple connections
declare global {
  var __db: ReturnType<typeof drizzle> | undefined;
  var __dbClient: ReturnType<typeof postgres> | undefined;
}

// Create or reuse existing database connection
let client: ReturnType<typeof postgres>;
let db: ReturnType<typeof drizzle>;

if (process.env.NODE_ENV === "production") {
  // In production, create new connection
  client = postgres(process.env.DATABASE_URL, {
    prepare: false,
    max: 1,
    idle_timeout: 0,
    max_lifetime: 60 * 10,
    connect_timeout: 60,
    socket_timeout: 60,
    transform: {
      undefined: null,
    },
    onnotice: () => {},
    connection: {
      application_name: "nextjs-app",
    },
  });
  db = drizzle(client, { schema });
} else {
  // In development, reuse connection to prevent connection limit issues
  if (!global.__dbClient) {
    global.__dbClient = postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: 1,
      idle_timeout: 0,
      max_lifetime: 60 * 10,
      connect_timeout: 60,
      socket_timeout: 60,
      transform: {
        undefined: null,
      },
      onnotice: () => {},
      connection: {
        application_name: "nextjs-app-dev",
      },
    });
    global.__db = drizzle(global.__dbClient, { schema });
  }
  client = global.__dbClient;
  db = global.__db!;
}

export { db };

export type User = typeof schema.users.$inferSelect;
export type Chat = typeof schema.chats.$inferSelect;
export type Message = typeof schema.messages.$inferSelect;
