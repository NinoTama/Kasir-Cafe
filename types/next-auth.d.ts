import "next-auth";
import "next-auth/jwt";

type Role = "ADMIN" | "KASIR";

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: { id: string; name?: string | null; role: Role };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
