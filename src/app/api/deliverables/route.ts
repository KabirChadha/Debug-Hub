import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") || "FIX-DEMO";
  const type = searchParams.get("type") || "project";

  if (type === "viva") {
    const vivaContent = `# CAMPUS CODE FIX: 1-PAGE VIVA DEFENSE SHEET
# CONFIDENTIAL CAPSTONE DEFENSE DOSSIER
# Order Reference: ${code}

--------------------------------------------------------------------------------
1. 60-SECOND ARCHITECTURE PITCH (Memorize for oral introduction)
--------------------------------------------------------------------------------
"Our application is built as a modular modern architecture. The client interface
utilizes React with Next.js App Router for optimal rendering performance. State
and real-time data persistence are managed through an asynchronous database layer,
isolated behind strictly enforced Row Level Security (RLS) policies. Critical
background tasks are decoupled into asynchronous worker routines to guarantee
zero blocking on primary presentation threads."

--------------------------------------------------------------------------------
2. ROOT CAUSE SUMMARY & REPAIR LOG
--------------------------------------------------------------------------------
- Original Crash Symptom: Runtime crash with unhandled promise rejection & DB lock timeout.
- Root Cause Identified: Detached event listeners in real-time subscriptions and unpooled
  database connection exhaustion.
- Engineering Resolution Applied:
  1. Implemented singleton connection pool with explicit timeout limits.
  2. Applied cleanup teardown listeners in lifecycle hooks.
  3. Pre-compiled environment configuration with sanitized fallbacks.
  4. Executed comprehensive end-to-end regression test suite (0 errors).

--------------------------------------------------------------------------------
3. TOP 5 ANTICIPATED VIVA QUESTIONS & MODEL ANSWERS
--------------------------------------------------------------------------------
Q1: "Why did you choose this database architecture over alternatives?"
A1: "Our schema demands strict relational integrity and deterministic data flow.
PostgreSQL provides ACID compliance, and Row Level Security guarantees data isolation
at the protocol layer without requiring custom middleware overhead."

Q2: "What is the computational complexity of your core data processing algorithm?"
A2: "The search indexing routines operate at O(log N) through balanced tree and
index scans, preventing O(N) full-table bottlenecks during high-concurrency evaluation."

Q3: "How does your code prevent memory leaks during long-running sessions?"
A3: "All reactive subscriptions implement explicit teardown in their respective
lifecycle cleanup callbacks, ensuring unreferenced event emitters are collected."

Q4: "What happens if a network error occurs during a client mutation?"
A4: "Mutations are wrapped in optimistic update blocks with automatic exponential
backoff retry logic and user-friendly error rollback states."

Q5: "How is your application secured against unauthorized data modification?"
A5: "Security is enforced at the database layer using cryptographic tokens and
Row Level Security policies that validate the user's authenticated session claim."
`;

    return new NextResponse(vivaContent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="viva-defense-${code}.md"`,
      },
    });
  }

  // Project download mock zip / payload
  const projectSummary = `# CAMPUS CODE FIX - REPAIRED REPOSITORY
Order ID: ${code}
Status: 100% Verified Run Passing

Installation & Execution Instructions:
1. Extract repository files.
2. Run 'npm install' or 'pip install -r requirements.txt'.
3. Run 'npm run dev' or 'python main.py'.
4. Open http://localhost:3000 in your browser.
`;

  return new NextResponse(projectSummary, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="fixed-project-${code}.txt"`,
    },
  });
}

