import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions";
import { canAccessAction } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح - يرجى تسجيل الدخول" }, { status: 401 });
    }

    if (!canAccessAction(user, "backupDatabase") && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "ليس لديك صلاحية تصدير نسخة احتياطية" }, { status: 403 });
    }

    // Path to SQLite dev.db
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: "ملف قاعدة البيانات غير موجود" }, { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(dbPath);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    const filename = `qayd-backup-khawad-${dateStr}-${timeStr}.db`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Backup export error:", error);
    return NextResponse.json({ error: error.message || "فشل تصدير النسخة الاحتياطية" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح - يرجى تسجيل الدخول" }, { status: 401 });
    }

    if (!canAccessAction(user, "restoreDatabase") && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "ليس لديك صلاحية استيراد واستعادة قاعدة البيانات" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("databaseFile") as File | null;

    if (!file) {
      return NextResponse.json({ error: "يرجى اختيار ملف النسخة الاحتياطية (.db)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate SQLite Header (first 16 bytes: "SQLite format 3\0")
    const header = buffer.subarray(0, 16).toString("utf8");
    if (!header.startsWith("SQLite format 3")) {
      return NextResponse.json({ error: "الملف المرفوع ليس ملف قاعدة بيانات SQLite صالح" }, { status: 400 });
    }

    const dbDir = path.join(process.cwd(), "prisma");
    const currentDbPath = path.join(dbDir, "dev.db");
    const preRestoreBackupPath = path.join(dbDir, `dev.pre-restore-${Date.now()}.db`);

    // Disconnect Prisma before file swap
    await prisma.$disconnect();

    // Take automated emergency backup of current db if exists
    if (fs.existsSync(currentDbPath)) {
      await fs.promises.copyFile(currentDbPath, preRestoreBackupPath);
    }

    // Write new database file
    await fs.promises.writeFile(currentDbPath, buffer);

    // Auto-migrate/sync schema so if the restored database is an older version missing new columns (e.g. passwordHash, permissions), it syncs seamlessly
    try {
      const { execSync } = require("child_process");
      execSync("npx prisma db push --skip-generate", { stdio: "ignore" });
    } catch (pushErr) {
      console.warn("Prisma db push auto-sync warning:", pushErr);
    }

    // Reconnect Prisma
    await prisma.$connect();

    // Preserve active session: find the restored user record matching the active username
    const currentUsername = user.username.toLowerCase();
    const restoredUser = await prisma.user.findUnique({
      where: { username: currentUsername },
    });

    const response = NextResponse.json({
      success: true,
      message: "تم استيراد واستعادة ومزامنة قاعدة البيانات بنجاح تام",
      safetyBackup: path.basename(preRestoreBackupPath),
    });

    // Re-issue session cookie using restored user's ID
    if (restoredUser) {
      response.cookies.set("qayd_session", restoredUser.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (error: any) {
    console.error("Backup restore error:", error);
    return NextResponse.json({ error: error.message || "فشل استيراد واستعادة قاعدة البيانات" }, { status: 500 });
  }
}
