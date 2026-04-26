import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runDesperationSearches, runDeepMarketSearches } from "@/lib/tavily";
import { generateMarketResearch } from "@/lib/scoring/market-research";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });

  const idea = await prisma.idea.findFirst({
    where: { id, workspaceId: member.workspaceId },
    include: { score: true },
  });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!idea.score) {
    return NextResponse.json(
      { error: "Idea must be evaluated before running market research" },
      { status: 400 }
    );
  }

  const hasReeval = idea.score.reevalScore !== null;

  const searchPromises: Promise<Awaited<ReturnType<typeof runDesperationSearches>>>[] = [
    runDesperationSearches(idea),
  ];
  if (hasReeval) {
    searchPromises.push(runDeepMarketSearches(idea));
  }

  const searchResults = await Promise.all(searchPromises);
  const combinedSearchSets = searchResults.flat();

  let result;
  try {
    result = await generateMarketResearch(idea, combinedSearchSets);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Market research failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const updated = await prisma.ideaScore.update({
    where: { ideaId: id },
    data: {
      marketResearch: result as object,
      marketResearchAt: new Date(),
    },
  });

  return NextResponse.json({
    marketResearch: updated.marketResearch,
    marketResearchAt: updated.marketResearchAt,
  });
}
