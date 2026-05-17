import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of authConfig used by middleware.
 * No DB or bcrypt imports allowed here.
 */
export const edgeAuthConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as { id: string }).id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      if (token.role) session.user.role = token.role as string;
      return session;
    },
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const role = auth?.user?.role as string | undefined;
      if (path.startsWith("/super")) return role === "super_admin";
      if (path.startsWith("/admin")) return role === "client_admin" || role === "super_admin";
      if (path.startsWith("/dashboard") || path.startsWith("/assessment") || path.startsWith("/report")) {
        return !!auth;
      }
      return true;
    },
  },
};
