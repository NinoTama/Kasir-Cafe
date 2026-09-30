"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function TopProdukChart({ data }: { data: { nama: string; qty: number }[] }) {
  return (
    <div className="h-64 w-full rounded-2xl border border-line bg-paper p-4 shadow-sm">
      <div className="mb-2 font-display text-sm text-pine">Menu Terlaris</div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid stroke="#ded2b6" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#241c16aa" }} allowDecimals={false} />
          <YAxis type="category" dataKey="nama" tick={{ fontSize: 11, fill: "#241c16" }} width={110} />
          <Tooltip formatter={(v: number) => [v, "Terjual"]} contentStyle={{ borderRadius: 10, borderColor: "#ded2b6", fontSize: 12 }} />
          <Bar dataKey="qty" fill="#a8402c" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
