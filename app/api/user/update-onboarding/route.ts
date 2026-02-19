import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { hasSeenOnboarding } = body

    // TODO: Connect to your actual database/user service
    // For now, acknowledge the request and log the preference
    console.log("[Y.EAA] Onboarding preference updated:", { hasSeenOnboarding })

    return NextResponse.json({ success: true, hasSeenOnboarding })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update onboarding preference" },
      { status: 400 }
    )
  }
}
