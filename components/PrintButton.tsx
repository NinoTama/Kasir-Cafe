"use client";
export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded-lg bg-pine px-4 py-2 text-sm text-cream hover:bg-pine-dark">
      Cetak struk
    </button>
  );
}
