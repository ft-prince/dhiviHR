import { LandingPage } from "@/components/landing/landing-page";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name, role: (session.user as { role?: string }).role }
    : null;
  return <LandingPage user={user} />;
}
