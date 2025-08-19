import { db } from ".";
import { sql } from "drizzle-orm";

export async function testDatabaseConnection() {
  try {
    // Try a simple query to test the connection
    const result = await db.execute(sql`SELECT 1`);
    console.log("✅ Database connection successful");
    return true;
  } catch (error: any) {
    console.error("❌ Database connection failed:", {
      message: error.message,
      cause: error.cause?.message,
      code: error.cause?.code,
      stack: error.stack,
    });

    // Log additional connection details (without sensitive info)
    const dbUrl = process.env.DATABASE_URL || "";
    if (dbUrl) {
      try {
        const maskedUrl = dbUrl
          .replace(/\/\/[^@]*@/, "//****:****@")
          .replace(/\?.*$/, "?****");

        console.error("Database configuration:", {
          url: maskedUrl,
          ssl: dbUrl.includes("sslmode="),
          host: new URL(dbUrl).hostname,
          port: new URL(dbUrl).port || "5432",
        });
      } catch (urlError) {
        console.error("Invalid DATABASE_URL format");
      }
    } else {
      console.error("DATABASE_URL is not set");
    }

    return false;
  }
}

// Add API route to test connection
export async function checkDatabaseHealth() {
  try {
    const start = Date.now();
    const isConnected = await testDatabaseConnection();
    const duration = Date.now() - start;

    return {
      status: isConnected ? "healthy" : "unhealthy",
      message: isConnected ? "Connection successful" : "Connection failed",
      latency: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      status: "error",
      message: error.message,
      error: {
        code: error.cause?.code,
        type: error.name,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
