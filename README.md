# قَيْـد (Qayd) - نظام إدارة المطابع ونقاط البيع المتكامل

نظام إدارة سحابي متكامل ومخصص للمطابع والخدمات الإعلانية ومحلات القرطاسية.

- **الرابط المباشر**: [https://qayd.duckdns.org](https://qayd.duckdns.org)
- **عنوان السيرفر (AWS EC2)**: `13.60.174.109`
- **المطور**: محمد حيدر ([Facebook](https://www.facebook.com/mohamed.haydar))

---

## 🔑 الدخول والاتصال بسيرفر AWS (SSH Access)

يمكنك الدخول إلى الطرفية (Terminal) الخاصة بالسيرفر عبر بروتوكول SSH باستخدام المفتاح:

### من جهازك عبر PowerShell (Windows):
```powershell
ssh -i "$env:USERPROFILE\.ssh\qyad.pem" ubuntu@13.60.174.109
```
أو إذا كنت داخل مجلد المشروع وكان المفتاح موجوداً به:
```powershell
ssh -i .\qyad.pem ubuntu@13.60.174.109
```

### من أنظمة Linux / macOS:
```bash
chmod 400 ~/.ssh/qyad.pem
ssh -i ~/.ssh/qyad.pem ubuntu@13.60.174.109
```

> **مسار مجلد المشروع داخل السيرفر**: `/var/www/qayd`

---

## 🗄️ إدارة وصيانة قاعدة البيانات (Database Management)

قاعدة البيانات الحالية تعمل بنظام **SQLite** المدار عبر **Prisma ORM**، ومسار ملف البيانات في السيرفر هو:
`/var/www/qayd/prisma/dev.db`

### 1. فتح لوحة تحكم رسومية تفاعلية (Prisma Studio)
لإدارة الجداول وتعديل وحذف السجلات مباشرة عبر واجهة رسومية في المتصفح، نفّذ الأمر التالي من جهازك في PowerShell:

```powershell
ssh -i "$env:USERPROFILE\.ssh\qyad.pem" -L 5555:localhost:5555 ubuntu@13.60.174.109 "cd /var/www/qayd && npx prisma studio"
```

ثم افتح المتصفح على:
👉 **[http://localhost:5555](http://localhost:5555)**

---

### 2. سحب نسخة احتياطية من السيرفر إلى جهازك (Download Backup)
لتنزيل ملف قاعدة البيانات كاملاً من السيرفر إلى جهازك المحلي:

```powershell
scp -i "$env:USERPROFILE\.ssh\qyad.pem" ubuntu@13.60.174.109:/var/www/qayd/prisma/dev.db ./backup_qayd_dev.db
```

> **ملاحظة:** يمكنك تصفح وتعديل ملف `backup_qayd_dev.db` على جهازك باستخدام برنامج مجاني مثل [DB Browser for SQLite](https://sqlitebrowser.org/).

---

### 3. استرجاع نسخة احتياطية ورفعها إلى السيرفر (Restore Backup)
لرفع ملف قاعدة بيانات من جهازك إلى السيرفر وإعادة تشغيل التطبيق:

```powershell
# رفع الملف إلى السيرفر
scp -i "$env:USERPROFILE\.ssh\qyad.pem" ./backup_qayd_dev.db ubuntu@13.60.174.109:/var/www/qayd/prisma/dev.db

# إعادة تشغيل التطبيق لتطبيق التغييرات
ssh -i "$env:USERPROFILE\.ssh\qyad.pem" ubuntu@13.60.174.109 "pm2 reload qayd"
```

---

### 4. النسخ الاحتياطي عبر المتصفح (Web UI)
يمكنك أيضاً تنزيل نسخة احتياطية أو استعادتها مباشرة بنقرة واحدة من لوحة التحكم:
👉 **https://qayd.duckdns.org/settings**

---

## 🚀 نشر التحديثات على السيرفر المباشر (Deployment)

عند إجراء أي تعديلات برمجية جديدة، يمكنك دفع التعديلات وتحديث السيرفر بالأمر التالي:

```powershell
# 1. رفع التعديلات إلى GitHub
git add .
git commit -m "update message"
git push origin main

# 2. التحديث والبناء وإعادة التشغيل على سيرفر AWS
ssh -i "$env:USERPROFILE\.ssh\qyad.pem" ubuntu@13.60.174.109 "cd /var/www/qayd && git pull origin main && npm run build && pm2 reload qayd"
```

---

## 🛠️ أوامر فحص ومراقبة السيرفر (Server Monitoring)

```powershell
# متابعة سجلات أخطاء وعمليات التطبيق المباشرة
ssh -i "$env:USERPROFILE\.ssh\qyad.pem" ubuntu@13.60.174.109 "pm2 logs qayd"

# التحقق من حالة خدمات النظام
ssh -i "$env:USERPROFILE\.ssh\qyad.pem" ubuntu@13.60.174.109 "pm2 status && sudo systemctl status nginx"

# فحص استهلاك الذاكرة والمعالج
ssh -i "$env:USERPROFILE\.ssh\qyad.pem" ubuntu@13.60.174.109 "free -h && df -h"
```

---

## 💻 التشغيل المحلي للتطوير (Local Development)

```bash
# تثبيت الحزم
npm install

# تشغيل خادم التطوير المحلي
npm run dev
```

افتح المتصفح على [http://localhost:3000](http://localhost:3000).
