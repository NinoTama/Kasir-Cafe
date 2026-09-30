"use client";

const GULA = ["Less Sugar", "No Sugar", "Extra Sugar"];
const ES = ["Less Ice", "No Ice", "Extra Ice"];

function togglePreset(catatan: string, preset: string) {
  const parts = catatan.split(",").map((s) => s.trim()).filter(Boolean);
  const idx = parts.indexOf(preset);
  if (idx >= 0) parts.splice(idx, 1);
  else parts.push(preset);
  return parts.join(", ");
}

export default function CatatanItem({
  catatan,
  onChange,
}: {
  catatan: string;
  onChange: (v: string) => void;
}) {
  const aktif = catatan.split(",").map((s) => s.trim());

  const chip = (label: string) => (
    <button
      key={label}
      type="button"
      onClick={() => onChange(togglePreset(catatan, label))}
      className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
        aktif.includes(label) ? "border-brick bg-brick text-cream" : "border-line text-ink/60 hover:border-pine/50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-1.5 rounded-lg bg-cream/60 p-2">
      <div className="flex flex-wrap gap-1">{GULA.map(chip)}</div>
      <div className="flex flex-wrap gap-1">{ES.map(chip)}</div>
      <input
        value={catatan}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Catatan lain (mis. tanpa bawang)"
        className="w-full rounded-md border border-line bg-white p-1.5 text-xs outline-none focus:border-pine"
      />
    </div>
  );
}
