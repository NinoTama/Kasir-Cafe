"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { username, password, redirect: false });
    if (res?.error) {
      setError("Username atau password salah");
      setLoading(false);
      return;
    }
    const session = await getSession();
    router.push(session?.user.role === "ADMIN" ? "/admin" : "/kasir");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="font-display text-3xl text-pine">Kasir Cafe</div>
          <p className="mt-1 text-sm text-ink/60">Masuk untuk mulai bertugas</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-paper p-6 shadow-sm">
          {error && (
            <p className="rounded-lg border border-brick/30 bg-brick/10 p-2.5 text-sm text-brick-dark">{error}</p>
          )}
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Username</span>
            <input
              className="w-full rounded-lg border border-line bg-white p-2.5 outline-none focus:border-pine"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Password</span>
            <input
              className="w-full rounded-lg border border-line bg-white p-2.5 outline-none focus:border-pine"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            disabled={loading}
            className="w-full rounded-lg bg-pine p-2.5 font-medium text-cream transition hover:bg-pine-dark disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </main>
  );
}
