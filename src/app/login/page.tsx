"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, User, ArrowLeft, AlertCircle } from "lucide-react";
import { loginUser } from "../actions";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await loginUser({
      username: form.username,
      password: form.password,
    });

    setLoading(false);

    if (res.success) {
      router.push("/");
      router.refresh();
      return;
    }

    setError(res.error || "فشل تسجيل الدخول");
  };

  return (
    <div className="min-h-screen bg-[#EAF6F4] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-[#2BA8A2]/20 bg-white/90 p-6 shadow-[0_20px_50px_rgba(43,168,162,0.12)] backdrop-blur-sm">
        <div className="flex items-center justify-center mb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2BA8A2] to-[#1E8C86] text-white shadow-teal-glow">
            <Shield className="h-8 w-8" />
          </div>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black text-[#142826]">تسجيل الدخول</h1>
          <p className="mt-1 text-xs font-medium text-gray-500">
            نظام قَيْد OS • الوصول السريع للإدارة
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">
              اسم المستخدم
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-[#2BA8A2]/20 bg-[#F7FBFB] px-3 py-2.5">
              <User className="h-4 w-4 text-[#2BA8A2]" />
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-transparent text-sm font-bold text-[#142826] outline-none placeholder:text-gray-400"
                dir="ltr"
                placeholder="أدخل اسم المستخدم"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">
              كلمة المرور
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-[#2BA8A2]/20 bg-[#F7FBFB] px-3 py-2.5">
              <Lock className="h-4 w-4 text-[#2BA8A2]" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-transparent text-sm font-bold text-[#142826] outline-none placeholder:text-gray-400"
                dir="ltr"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] px-4 py-3 text-sm font-black text-white shadow-teal-glow hover:opacity-95 transition-all disabled:opacity-70 cursor-pointer"
          >
            {loading ? "جاري تسجيل الدخول..." : "دخول النظام"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
            <span>تطوير :</span>
            <span className="text-[#142826] font-black">محمد حيدر</span>
          </p>
          <a
            href="https://www.facebook.com/mohamed.haydar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors text-xs font-black"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>حساب المطور على فيسبوك</span>
          </a>
        </div>
      </div>
    </div>
  );
}
