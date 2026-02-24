import { NextResponse } from "next/server"

/**
 * POST /api/user/onboarding-complete
 *
 * Called when the user finishes the onboarding tour.
 * Body: { dontShowAgain: boolean }
 *
 * TODO: Wire to backend persistence (database / user preferences store).
 * For now this is a stub that always returns success so the FE
 * contract is stable and BE can implement without touching FE.
 */
export async function POST(request: Request) {
  const body = await request.json()
  const { dontShowAgain } = body as { dontShowAgain: boolean }

  // TODO: Persist `dontShowAgain` to the user's preference record
  // e.g. await db.user.update({ onboardingComplete: true, dontShowAgain })
  console.log("[onboarding-complete] dontShowAgain:", dontShowAgain)

  return NextResponse.json({ success: true })
}
