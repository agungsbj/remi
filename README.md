# ♠️ SBJ - Game Remi Online ♥️

Sistem permainan kartu Remi (Capsa Banting / 13 Cards Style) berbasis web yang interaktif, responsif, dan dapat dimainkan secara **Offline (vs AI Bot)** maupun **Online Realtime (Multiplayer)**.

![SBJ Remi Preview](https://via.placeholder.com/800x400?text=SBJ+Remi+Online+Game+Preview)

---

## 🌟 Fitur Utama

- **Mode Multi-Player & Offline AI:**
  - **Offline:** Bermain melawan 3 AI Bot dengan tingkat kesulitan (*Easy*, *Medium*, *Hard*).
  - **Online:** Buat room baru atau masuk ke room menggunakan kode akses unik berbasis teknologi Supabase Realtime.
- **Responsif & Mobile-Friendly:** Tampilan antarmuka (*UI*) fleksibel yang disesuaikan khusus untuk layar HP/Smartphone dengan visual kipas kartu profesional.
- **Aturan Otomatis & Validasi Kombinasi:** Sistem mendeteksi otomatis legalitas kombinasi kartu yang dibuang.
- **Sistem Fitur Spesial (REM & BOM):**
  - **REM:** Kemampuan membuang kartu angka `2` pada mode *Single*.
  - **BOM:** Pengeluaran 4 kartu bernilai sama (*Four of a Kind*) untuk langsung memenangkan permainan dan menginterupsi *REM*.
- **Penyusunan Kartu Otomatis:** Tombol pengurutan cepat berdasarkan nilai, suit, straight flush, maupun grouping otomatis.
- **Sistem Skor Sesi:** Akumulasi poin per ronde untuk menentukan juara akhir dalam satu sesi permainan.

---

## 🎯 Aturan Dasar Permainan

1. **Jumlah Pemain & Kartu:** 
   - Dimainkan oleh 4 pemain menggunakan 1 dek kartu standar (52 kartu tanpa Joker).
   - Masing-masing pemain mendapatkan 13 kartu di awal ronde.
2. **Hirarki Nilai Kartu:**
   - **Angka (Terkecil ke Terbesar):** `3` - `4` - `5` - `6` - `7` - `8` - `9` - `10` - `J` - `Q` - `K` - `A` - `2`
   - **Kembangan/Suit (Terkecil ke Terbesar):** Wajik/Diamond (`♦`) < Keriting/Club (`♣`) < Hati/Heart (`♥`) < Sekop/Spade (`♠`)
3. **Giliran Pertama:**
   - **Ronde 1:** Pemain yang memegang kartu **3♦** wajib membuang kartu tersebut di giliran awal.
   - **Ronde 2+:** Pemenang ronde sebelumnya berhak menentukan kartu/kombinasi yang dibuang pertama kali.

---

## 🃏 Kombinasi Kartu

Setiap pemain harus melawan kartu di meja dengan kombinasi yang sejenis namun memiliki nilai yang lebih tinggi.

- **Single (1 Kartu):** Kartu harus memiliki *suit* yang sama dan angka lebih tinggi, ATAU mengeluarkan kartu angka `2` (REM).
- **Tris (3 Kartu):** 3 kartu dengan angka yang sama (Contoh: `7♦ 7♣ 7♥`).
- **Straight (3–5 Kartu):** Urutan angka berurutan minimal 3 kartu. Kartu angka `2` tidak dapat digunakan dalam *Straight*.
- **Full House (5 Kartu):** Kombinasi 3 kartu angka sama (*Tris*) + 2 kartu angka sama (*Pair*).
- **Straight Flush (3–5 Kartu):** Urutan angka berurutan yang semuanya memiliki *suit* yang sama.
- **BOM (4 Kartu):** 4 kartu dengan angka yang sama (*Four of a Kind*). Digunakan untuk memutus alur *REM*.

---

## 🏆 Sistem Poin Sesi

Di akhir setiap ronde, poin akan dibagikan berdasarkan urutan pemain yang berhasil menghabiskan kartunya terlebih dahulu:

| Peringkat | Poin Tambahan |
| :---: | :---: |
| 🥇 Peringkat 1 | **+2 Pts** |
| 🥈 Peringkat 2 | **+1 Pt** |
| 🥉 Peringkat 3 | **0 Pt** |
| 4️⃣ Peringkat 4 | **-1 Pt** |

---

## 🚀 Cara Menjalankan Proyek

Proyek ini dibangun menggunakan **HTML5, CSS3, JavaScript murni (Vanilla JS)**, dan **Supabase JS Client**. Tidak memerlukan proses kompilasi (*build process*) yang rumit.

1. **Clone Repositori:**
   ```bash
   git clone [https://github.com/username-kamu/sbj-remi-online.git](https://github.com/username-kamu/sbj-remi-online.git)
