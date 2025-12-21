import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync-worker";

// Vercel Cron config (runs daily)
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/cron/sync
 * Trigger manual sync (or called by Vercel Cron)
 *
 * To set up Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
export async function POST() {
  try {
    const result = await runSync();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Synced ${result.nodesCount} nodes`,
        nodesCount: result.nodesCount,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// Also allow GET for easy testing in browser
export async function GET() {
  return POST();
}
