"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession, signOut } from "next-auth/react";

const PERAN = [
  { key: "ADMIN", label: "Admin" },
  { key: "KASIR", label: "Kasir" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [peran, setPeran] = useState<"ADMIN" | "KASIR">("KASIR");
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
    const roleAsli = session?.user.role;

    if (roleAsli !== peran) {
      await signOut({ redirect: false });
      setError(
        roleAsli === "ADMIN"
          ? "Akun ini adalah akun Admin. Pilih tab \"Admin\" untuk masuk."
          : "Akun ini adalah akun Kasir. Pilih tab \"Kasir\" untuk masuk."
      );
      setLoading(false);
      return;
    }

    router.push(roleAsli === "ADMIN" ? "/admin" : "/kasir");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="font-display text-3xl text-pine">Kasir Cafe</div>
          <p className="mt-1 text-sm text-ink/60">Masuk untuk mulai bertugas</p>
        </div>

        <div className="mb-4 flex rounded-lg border border-line bg-paper p-1">
          {PERAN.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setPeran(p.key);
                setError("");
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                peran === p.key ? "bg-pine text-cream" : "text-ink/60 hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
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
            {loading ? "Memproses..." : `Masuk sebagai ${peran === "ADMIN" ? "Admin" : "Kasir"}`}
          </button>
        </form>
      </div>
    </main>
  );
}
