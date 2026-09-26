"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UsersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings?tab=users");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="rounded-2xl border border-[#2BA8A2]/10 bg-white px-6 py-4 text-sm font-bold text-[#1E8C86] shadow-card-subtle">
        جاري تحويلك إلى صفحة الإعدادات...
      </div>
    </div>
  );
}
