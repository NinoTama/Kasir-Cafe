import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // GANTI password ini setelah login pertama!
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { nama: "Administrator", username: "admin", password: await bcrypt.hash("admin123", 10), role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { username: "kasir" },
    update: {},
    create: { nama: "Kasir 1", username: "kasir", password: await bcrypt.hash("kasir123", 10), role: "KASIR" },
  });
  await prisma.product.upsert({
    where: { kode: "P001" },
    update: {},
    create: { nama: "Air Mineral 600ml", kode: "P001", harga: 4000, stok: 50, kategori: "Minuman" },
  });
  console.log("Seed selesai: admin/admin123 dan kasir/kasir123");
}

main().finally(() => prisma.$disconnect());
