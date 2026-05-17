import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireRole(roles: string[], redirectTo = "/login") {
  const session = await auth();
  if (!session?.user?.id) redirect(redirectTo);
  if (!roles.includes(session.user.role)) redirect("/");
  return session.user;
}
