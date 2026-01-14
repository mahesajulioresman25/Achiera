# Achiera Web Platform (v1.0.1) - DEPLOY CHECK: 2026-01-15 00:48 WIB

Platform manajemen bisnis terintegrasi yang mencakup E-Commerce (Rasa Ibu), Inventory, Finance, dan AI Analytics.

## 🚀 Fitur Utama
- **Multi-Brand Support**: Manajemen Rasa Ibu, Merch, dan unit bisnis lain dalam satu atap.
- **Rasa Ibu Public Web**: Toko online frozen food & catering dengan fitur resep interaktif.
- **Autonomous Analytics**: Sistem cerdas yang menganalisis performa bisnis tanpa campur tangan manusia.
- **Secure & Scalable**: Dibangun dengan Next.js 15, Prisma, dan PostgreSQL.

## 📂 Dokumentasi Lengkap
Silakan baca dokumentasi detail di folder `docs/`:

- [📋 Daftar Fitur Lengkap (`docs/FEATURES_LIST.md`)](./docs/FEATURES_LIST.md)
- [🔄 Alur Proses Bisnis & SOP (`docs/BUSINESS_PROCESS.md`)](./docs/BUSINESS_PROCESS.md)
- [📖 Panduan Pengguna / User Manual (`docs/USER_MANUAL.md`)](./docs/USER_MANUAL.md)

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: NextAuth.js v5
- **UI**: Tailwind CSS, Lucide Icons, Shadcn/UI
- **Payment**: Manual Transfer Proof / Midtrans Integration (Upcoming)

## ⚡ Instalasi & Menjalankan
1.  **Clone Repo**:
    ```bash
    git clone https://github.com/mahesajulioresman25/Achiera.git
    cd achiera-web
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Setup Database**:
    Pastikan PostgreSQL berjalan, lalu update `.env`.
    ```bash
    npx prisma generate
    npx prisma db push
    ```
4.  **Jalankan Server**:
    ```bash
    npm run dev
    ```
    Buka [http://localhost:3000](http://localhost:3000).

---
*© 2026 Achiera Corp. All Rights Reserved.*