import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });

  // No workspace yet — send to onboarding to create or wait for invite
  if (!member) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
