import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    message: "Auth test endpoint",
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not set",
      GITHUB_ID: process.env.GITHUB_ID ? "Set" : "Not set",
      GITHUB_SECRET: process.env.GITHUB_SECRET ? "Set" : "Not set",
    },
    expectedCallbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  })
}
