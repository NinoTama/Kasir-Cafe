"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function TrenChart({ data }: { data: { tanggal: string; total: number }[] }) {
  return (
    <div className="h-64 w-full rounded-2xl border border-line bg-paper p-4 shadow-sm">
      <div className="mb-2 font-display text-sm text-pine">Tren Omzet</div>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ left: 0, right: 10 }}>
          <CartesianGrid stroke="#ded2b6" strokeDasharray="3 3" />
          <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: "#241c16aa" }} />
          <YAxis
            tick={{ fontSize: 11, fill: "#241c16aa" }}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}rb` : v)}
            width={40}
          />
          <Tooltip
            formatter={(value) => ["Rp" + Number(value).toLocaleString("id-ID"), "Omzet"]}
            contentStyle={{ borderRadius: 10, borderColor: "#ded2b6", fontSize: 12 }}
          />
          <Line type="monotone" dataKey="total" stroke="#2c4a3b" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
