"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutUser } from "../app/actions";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
    >
      <LogOut className="h-3.5 w-3.5" />
      خروج
    </button>
  );
}
