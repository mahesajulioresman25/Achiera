# 📋 Daftar Fitur Lengkap Achiera Web v1.0.0

Dokumen ini memetakan seluruh kapabilitas sistem Achiera Web, dibagi berdasarkan akses pengguna: Publik, Brand Admin (Operasional), dan Holding Admin (Strategis).

---

## 🌟 1. Web Publik (Storefront Rasa Ibu)

Akses: `Semua Pengunjung`
URL: `https://[domain]/rasa-ibu`

E-Commerce modern yang fokus pada pengalaman visual dan kemudahan resep.

| Modul | Fitur | Deskripsi |
| :--- | :--- | :--- |
| **Katalog & Belanja** | **Dynamic Product Listing** | Filter produk berdasarkan kategori (Sarapan, Lauk, Sambal) yang mengambil data real-time stok. |
| | **Smart Search** | Pencarian cepat untuk menemukan produk atau resep. |
| | **Bundle & Promos** | Dukungan untuk paket bundling (Paket Hemat Keluarga) dan harga coret (Flash Sale). |
| **Recipe Blog** | **Resep Terintegrasi** | Artikel resep langkah demi langkah yang terhubung langsung dengan produk bahan baku ("Shop the Recipe"). |
| | **Estimasi & Tips** | Informasi durasi masak, tingkat kesulitan, dan tips koki untuk setiap resep. |
| **User Account** | **Dashboard Member** | Halaman profil untuk melihat riwayat pesanan (Order History) dan status pengiriman. |
| | **Subscription Manager** | Kelola langganan katering harian (Pause, Resume, ganti jadwal). |
| | **Secure Profile** | Edit data diri dan ganti password dengan keamanan OTP (One Time Password). |

---

## 🍳 2. Dashboard Brand (Rasa Ibu Admin)

akses: `Brand Admin`, `Brand Manager`, `Kitchen Staff`
URL: `https://[domain]/dashboard/rasa-ibu`

Pusat komando untuk operasional harian bisnis kuliner.

### A. E-Commerce & Marketing
| Fitur | Fungsi Utama |
| :--- | :--- |
| **Order Processing** | Verifikasi pembayaran manual/QRIS, update status pesanan (Processing -> Shipped), dan input Resi Kurir. |
| **Produk & Stok** | Manajemen SKU, upload foto produk, dan sinkronisasi stok otomatis saat ada penjualan. |
| **Campaign Manager** | Membuat Flash Sale (dengan timer mundur) dan Paket Bundling untuk meningkatkan nilai keranjang belanja (AOV). |
| **Recipe CMS** | Editor konten untuk menulis dan memublikasikan resep baru ke blog. |

### B. Kitchen & Inventory (Dapur)
| Fitur | Fungsi Utama |
| :--- | :--- |
| **Simple Manufacturing** | Mencatat hasil produksi dapur (Bahan Baku -> Produk Jadi) untuk update HPP dan stok. |
| **Stock Opname** | Fitur rekonsiliasi stok fisik dan sistem untuk audit gudang bulanan. |
| **Auto-Restock Alert** | Notifikasi otomatis jika stok bahan baku (misal: Cabai, Daging) di bawah batas aman. |

### C. Finance (Level Brand)
| Fitur | Fungsi Utama |
| :--- | :--- |
| **Brand P&L** | Laporan Laba Rugi spesifik untuk brand Rasa Ibu. Melihat profitabilitas unit bisnis ini secara mandiri. |
| **Expense Recording** | Pencatatan pengeluaran operasional outlet (Gaji karyawan outlet, Listrik, Gas). |
| **Invoice Generator** | Membuat invoice PDF otomatis untuk pesanan B2B atau Catering besar. |

---

## 🏢 3. Dashboard Holding (Achiera Core)

Akses: `Global Admin`, `Owner (Ibu)`
URL: `https://[domain]/dashboard`

"Control Tower" untuk mengelola konglomerasi bisnis dan strategi jangka panjang.

### A. Global Finance & Accounting
| Fitur | Keunggulan |
| :--- | :--- |
| **Consolidated Reports** | Menggabungkan laporan keuangan dari semua unit bisnis (Rasa Ibu + Merch + IT Services) menjadi satu Neraca Konsolidasi. |
| **Inter-Company Transactions** | Mencatat transaksi antar anak perusahaan (misal: Rasa Ibu membayar royalti ke Achiera IP) secara otomatis dengan jurnal eliminasi. |
| **Capital Allocation (AI)** | Sistem cerdas yang memantau arus kas setiap brand. Jika Brand A surplus kas dan Brand B butuh modal, AI akan menyarankan pemindahan dana internal. |

### B. Strategic Management
| Fitur | Keunggulan |
| :--- | :--- |
| **Business Intelligence** | Dashboard eksekutif yang menampilkan metrik kunci (Total Revenue, Group Net Profit, Cash Runway) dalam satu layar. |
| **Sales Forecasting** | Menggunakan algoritma **Holt-Winters** untuk memprediksi penjualan bulan depan berdasarkan data historis gabungan. |
| **Subscription Analytics** | Analisis retensi pelanggan (Churn Rate) dan pendapatan berulang (MRR) dari lini bisnis katering. |

### C. System Administration
| Fitur | Keunggulan |
| :--- | :--- |
| **Global User Management** | Pusat pengaturan akses user. Satu akun karyawan bisa diberi akses ke beberapa brand sekaligus (Single Sign-On). |
| **Audit Logs** | Mencatat *siapa melakukan apa* di seluruh sistem untuk keperluan audit keamanan. |
| **Integrations Hub** | Pengaturan koneksi pihak ketiga (WhatsApp Gateway, Email Server, Payment Gateway) secara terpusat. |
