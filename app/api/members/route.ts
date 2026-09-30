import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/members?q=0812  -> cari member berdasarkan nama / no HP
export async function GET(req: Request) {
  try {
    await requireRole("ADMIN", "KASIR");
  } catch {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);
  const members = await prisma.member.findMany({
    where: { OR: [{ nama: { contains: q } }, { noHp: { contains: q } }] },
    take: 10,
  });
  return NextResponse.json(members);
}

// POST /api/members  { nama, noHp } -> daftar member baru
export async function POST(req: Request) {
  try {
    await requireRole("ADMIN", "KASIR");
  } catch {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }
  const body = await req.json();
  const nama = String(body.nama ?? "").trim();
  const noHp = String(body.noHp ?? "").replace(/\s|-/g, "");
  if (!nama || !/^\d{8,15}$/.test(noHp)) {
    return NextResponse.json({ error: "Nama wajib diisi dan No HP harus 8-15 angka" }, { status: 400 });
  }
  if (await prisma.member.findUnique({ where: { noHp } })) {
    return NextResponse.json({ error: "No HP sudah terdaftar" }, { status: 409 });
  }
  const member = await prisma.member.create({ data: { nama, noHp } });
  return NextResponse.json(member, { status: 201 });
}
