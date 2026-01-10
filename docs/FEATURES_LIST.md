# 📋 Daftar Fitur Achiera Web v1.0.0

Dokumen ini berisi inventaris lengkap fitur yang tersedia pada versi 1.0.0.

## 🌟 Modul Brand Publik (Rasa Ibu)
Frontend publik yang dapat diakses oleh pelanggan (`/rasa-ibu`).

| Fitur | Deskripsi | Status |
| :--- | :--- | :--- |
| **Katalog Produk** | Menampilkan produk frozen food dengan filter kategori (Sarapan, Makan Siang, dll). Data diambil real-time dari stok gudang. | ✅ Ready |
| **Detail Produk** | Halaman detail produk dengan foto, deskripsi, harga, dan tombol Add to Cart. | ✅ Ready |
| **Recipe Blog** | Blog resep masakan lengkap dengan bahan, langkah pembuatan, foto, dan estimasi waktu. Terintegrasi dengan produk (Call to Action "Beli Bahan"). | ✅ Ready |
| **System Pencarian** | Filter kategori dinamis untuk produk dan resep. | ✅ Ready |
| **Keranjang Belanja** | Sistem cart persist (disimpan di browser/akun) yang mendukung multiple item dan kuantitas. | ✅ Ready |
| **Checkout Flow** | Alur checkout 3 langkah: Data Diri -> Pengiriman (JNE/GoSend manual) -> Pembayaran (Transfer Bank/QRIS manual). | ✅ Ready |
| **Upload Bukti Bayar** | Fitur untuk pelanggan mengunggah bukti transfer, otomatis notifikasi ke Admin. | ✅ Ready |
| **User Profile** | Dashboard pelanggan untuk melihat riwayat pesanan, status langganan katering, dan edit profil. | ✅ Ready |
| **Edit Profile & Password** | Fitur keamanan bagi user untuk mengubah data diri dan password dengan verifikasi OTP email. | ✅ Ready |
| **Subscription (Katering)** | Fitur berlangganan paket makanan harian/mingguan dengan pengaturan jadwal pengiriman fleksibel. | ✅ Ready |

## 🏢 Modul Dashboard Admin
Pusat kontrol untuk pemilik bisnis dan staf (`/dashboard`).

### 🛍️ E-Commerce Management
| Fitur | Deskripsi | Status |
| :--- | :--- | :--- |
| **Order Management** | Melihat daftar pesanan masuk, verifikasi bukti bayar, update status (Diproses/Dikirim/Selesai). | ✅ Ready |
| **Product Management** | Tambah/Edit/Hapus produk, upload foto, atur harga dan SKU. | ✅ Ready |
| **Category Management** | Kelola kategori produk agar tertata rapi di web publik. | ✅ Ready |
| **Customer Database** | Database pelanggan lengkap dengan riwayat pembelian dan total belanja (LTV). | ✅ Ready |
| **Subscription Management** | Kelola pelanggan katering, lihat jadwal pengiriman harian, dan status aktif/pause. | ✅ Ready |

### 📦 Inventory & Operations
| Fitur | Deskripsi | Status |
| :--- | :--- | :--- |
| **Real-time Stock** | Monitoring stok bahan baku dan produk jadi. | ✅ Ready |
| **Auto-deduction** | Stok produk otomatis berkurang saat ada order baru. | ✅ Ready |
| **Stock Opname/Reconcile** | Fitur untuk menyesuaikan stok fisik vs sistem jika ada selisih. | ✅ Ready |
| **Purchase Orders (PO)** | Mencatat pembelian bahan baku ke supplier. | ✅ Ready |
| **Production Planning** | (Beta) Perencanaan produksi dapur berdasarkan tren pesanan. | ⚠️ Beta |

### 💰 Finance & Accounting
| Fitur | Deskripsi | Status |
| :--- | :--- | :--- |
| **Financial Reports** | Laporan Laba Rugi, Neraca, dan Arus Kas otomatis. | ✅ Ready |
| **Expense Tracking** | Catat pengeluaran operasional (gaji, listrik, beli bahan). | ✅ Ready |
| **COGS Calculation** | Perhitungan Harga Pokok Penjualan otomatis berdasarkan resep produk. | ✅ Ready |
| **Invoice Generator** | Cetak invoice resmi untuk pesanan katering atau B2B. | ✅ Ready |

### 🤖 AI & Automation (Achiera Core)
| Fitur | Deskripsi | Status |
| :--- | :--- | :--- |
| **Sales Forecasting** | Prediksi penjualan masa depan menggunakan algoritma Holt-Winters. | ✅ Ready |
| **Smart Restock** | Rekomendasi belanja bahan baku berdasarkan prediksi penjualan. | ✅ Ready |
| **Brand Isolation** | Keamanan data antar brand (Rasa Ibu data tidak bocor ke unit bisnis lain). | ✅ Ready |
| **Autonomous Analytics** | Sistem otomatis yang menganalisis kinerja bisnis dan memberikan "Insight" tanpa diminta. | ✅ Ready |

## 🛡️ Security & Technical
| Fitur | Deskripsi | Status |
| :--- | :--- | :--- |
| **RBAC** | Role-Based Access Control (Owner, Admin, Staff, User) untuk membatasi akses menu. | ✅ Ready |
| **Middleware Protection** | Api dan Halaman Admin terlindungi dari akses tanpa login. | ✅ Ready |
| **SEO Optimization** | Sitemap.xml dan Robots.txt otomatis untuk Google Indexing. | ✅ Ready |
| **Error Handling 404** | Halaman "Not Found" yang ramah pengguna. | ✅ Ready |
