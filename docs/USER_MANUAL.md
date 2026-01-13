# 📖 Panduan Pengguna (User Manual)

## 🧑‍💼 Untuk Admin / Pemilik Toko

### Login ke Dashboard
1. Buka `https://[domain-anda]/login`.
2. Masukkan email dan password admin.
3. Anda akan diarahkan ke Dashboard Utama. Pilih brand **Rasa Ibu**.

### Cara Menambah Produk Baru
1. Masuk ke menu **E-Commerce > Products**.
2. Klik tombol **+ Add Product**.
3. Isi data wajib:
   - **Nama Produk**: Judul yang menarik.
   - **Harga**: Harga jual satuan.
   - **Kategori**: Pilih kategori (Sarapan, Makan Siang, dll). Jika belum ada, buat dulu di menu Categories.
   - **Stok**: Jumlah stok awal.
   - **Gambar**: Upload foto produk (format JPG/PNG, rasio 1:1 disarankan).
4. Klik **Save**. Produk langsung tayang di website.

### Cara Memproses Pesanan Masuk
1. Cek notifikasi lonceng atau menu **E-Commerce > Orders**.
2. Klik pesanan dengan status `Pending Payment` atau `Pending Review`.
3. Klik tombol **Lihat Bukti Bayar**.
   - Jika cocok: Klik **Mark as Paid** -> Pesanan jadi `Processing`.
   - Jika palsu: Klik **Reject Payment**.
4. Setelah barang dikemas, klik **Mark as Shipped** dan masukkan nomor Resi (JNE/J&T/Gojek).
5. Pesanan selesai.

### Cara Membuat Artikel Resep (Recipe Blog)
1. Masuk ke menu **Rasa Ibu Admin > Recipes**.
2. Klik **Add New Recipe**.
3. Isi detail:
   - **Judul**: Nama resep.
   - **Ingredients**: Daftar bahan (satu per baris).
   - **Steps**: Langkah memasak (satu per baris).
   - **Products Used**: Pilih produk jualan kita yang dipakai di resep ini (agar muncul tombol "Beli Bahan").
4. Publish. Resep akan muncul di halaman `/rasa-ibu/recipes`.

### Cara Mencatat Prive (Pengambilan Pribadi)
1. Masuk ke menu **Finance Hub > Record Expense**.
2. Pilih akun **3-3000 - Prive Pemilik**.
3. Masukkan jumlah uang yang diambil.
4. Berikan keterangan (opsional).
5. Klik **Save**.
   - Saldo Kas akan berkurang.
   - Ekuitas Pemilik akan berkurang (tercatat sebagai penarikan modal).

---

## 🧑‍🍳 Untuk Pelanggan (Customer)

### Cara Berbelanja
1. Buka website Rasa Ibu.
2. Jelajahi menu **Produk** atau **Resep Inspirasi**.
3. Klik **+ Keranjang** pada produk yang diinginkan.
4. Klik ikon Keranjang di pojok kanan atas, lalu **Checkout**.
5. Isi alamat lengkap agar kurir tidak nyasar.
6. Lakukan transfer ke rekening yang tertera.
7. Upload bukti transfer di halaman "Riwayat Pesanan".

### Cara Edit Profil & Ganti Password
1. Login ke akun Anda.
2. Klik foto profil di pojok kanan atas -> **Profil Saya**.
3. Di sidebar kiri, pilih menu **Pengaturan Akun**.
4. **Ubah Data Diri**: Edit nama/telepon/alamat, lalu klik Simpan.
5. **Ganti Password**:
   - Klik "Ubah Password".
   - Masukkan password lama dan baru.
   - Cek email Anda untuk kode OTP 6 digit.
   - Masukkan kode OTP untuk konfirmasi.

### Lupa Password?
1. Di halaman Login, klik **Lupa Password?**.
2. Masukkan email. Link reset akan dikirim ke email Anda.
