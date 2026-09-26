"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-pill px-5 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs font-black shadow-teal-glow hover:brightness-110"
    >
      <Printer className="w-4 h-4" />
      طباعة الفاتورة (A4 / حراري)
    </button>
  );
}
