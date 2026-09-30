import { NextAuthOptions, getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export type Role = "ADMIN" | "KASIR";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8 jam
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: { username: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { username: credentials.username } });
        if (!user || !user.aktif) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        return { id: String(user.id), name: user.nama, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
};

/** Panggil di awal setiap server action / API route. Lempar error kalau role tidak sesuai. */
export async function requireRole(...roles: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session || !roles.includes(session.user.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
