import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });

  if (!member) redirect("/onboarding");

  return <AppShell currentMemberId={member.id} />;
}
