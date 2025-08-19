import { NextResponse } from "next/server"

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  
  return NextResponse.json({
    message: "OAuth Configuration Test",
    baseUrl,
    expectedCallbackUrls: {
      google: `${baseUrl}/api/auth/callback/google`,
      github: `${baseUrl}/api/auth/callback/github`
    },
    currentUrl: `${baseUrl}/api/auth/test-oauth`,
    instructions: [
      "1. Go to Google Cloud Console > APIs & Services > Credentials",
      "2. Edit your OAuth 2.0 Client ID",
      "3. Add this Authorized redirect URI:",
      `   ${baseUrl}/api/auth/callback/google`,
      "4. Save and try signing in again"
    ]
  })
}
