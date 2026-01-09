# URGENT: Clear Session untuk Fix HTTP 431

## Masalah
Session cookie lama masih menyimpan data 97 brands, menyebabkan HTTP 431.

## Solusi - Hapus Cookie Manual

### Cara 1: Via Browser DevTools (TERCEPAT)
1. Buka DevTools (`F12`)
2. Pergi ke tab **Application** (Chrome) atau **Storage** (Firefox)
3. Di sidebar kiri, klik **Cookies** → `http://localhost:3000`
4. **Hapus semua cookies**, terutama:
   - `next-auth.session-token`
   - `next-auth.csrf-token`
   - `__Secure-next-auth.session-token` (jika ada)
5. Refresh halaman (`Ctrl + Shift + R`)
6. Login ulang

### Cara 2: Via Browser Settings
1. Buka Settings → Privacy → Clear browsing data
2. Pilih **Cookies and other site data**
3. Time range: **All time**
4. Clear data
5. Restart browser
6. Buka `http://localhost:3000/login`
7. Login ulang

### Cara 3: Incognito/Private Window (PALING MUDAH)
1. Buka **Incognito/Private Window** (`Ctrl + Shift + N`)
2. Buka `http://localhost:3000/login`
3. Login dengan kredensial OWNER
4. Sekarang akan melihat 3 brands tanpa error!

## Verifikasi Berhasil
Setelah login ulang, Anda akan melihat di console browser:
```
[AUTH] OWNER detected! Flagged for all-brand access.
[AUTH] Success! User: [email], GlobalRole: OWNER, Brands context count: 1
```

Dan di halaman `/dashboard` akan melihat **3 brands**:
- Rasa Ibu
- Achiera Merch  
- IT Solution

## Catatan Teknis
Kode sudah diperbaiki di:
- ✅ `src/auth.ts` - Session hanya simpan 1 flag
- ✅ `src/app/dashboard/page.tsx` - Fetch brands server-side

Tapi browser masih pakai session cookie LAMA yang belum di-clear.
