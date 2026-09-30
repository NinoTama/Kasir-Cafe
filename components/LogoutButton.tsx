"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-lg border border-brick/30 bg-brick/10 px-3 py-1.5 text-sm text-brick-dark transition hover:bg-brick/20"
    >
      Keluar
    </button>
  );
}
