# Help Desk Backend

Backend ini menyediakan API autentikasi, manajemen user, tiket percakapan, pesan chat, activity log, dan koneksi real-time dengan Socket.IO untuk aplikasi help desk.

## Ringkasan

- Runtime: Node.js
- Framework: Express
- Database: MongoDB dengan Mongoose
- Auth: JWT Bearer Token
- Real-time: Socket.IO
- Parsing request: JSON, URL-encoded, dan `multipart/form-data` untuk endpoint pesan

Server berjalan dengan prefix route langsung dari root. Tidak ada prefix `/api` pada implementasi saat ini.

Contoh:

- `POST /auth/login`
- `GET /conversations`
- `POST /messages`

## Fitur Yang Sudah Ada

- Registrasi user baru dengan role default `user`
- Login dan pengambilan profil user aktif
- Proteksi route dengan JWT
- Otorisasi berbasis role: `user`, `admin`, `it_staff`
- Pembuatan tiket/conversation oleh user
- Penambahan IT staff ke conversation oleh admin
- Penutupan conversation oleh admin atau IT staff
- Pengiriman dan pengambilan pesan per conversation
- Pengambilan activity log per conversation
- Event real-time untuk ticket dan chat

## Struktur Proyek

```text
.
|-- config/
|   `-- database.js
|-- controllers/
|   |-- activityLogController.js
|   |-- authController.js
|   |-- conversationController.js
|   |-- messageController.js
|   `-- userController.js
|-- middleware/
|   |-- authMiddleware.js
|   `-- roleMiddleware.js
|-- models/
|   |-- ActivityLog.js
|   |-- Conversation.js
|   |-- Message.js
|   `-- User.js
|-- routes/
|   |-- authRoutes.js
|   |-- conversationRoutes.js
|   |-- messageRoutes.js
|   `-- userRoutes.js
|-- socket/
|   `-- socketHandler.js
|-- uploads/
|   `-- chat/
|-- server.js
`-- package.json
```

## Teknologi Dan Dependency Utama

Dependency yang memang terpasang di project saat ini:

- `express`
- `mongoose`
- `jsonwebtoken`
- `bcrypt`
- `socket.io`
- `cors`
- `dotenv`
- `body-parser`
- `express-validator`
- `multer`
- `nodemon` untuk development

Ada juga dependency seperti `ejs`, `express-session`, dan `connect-mongo` di `package.json`, tetapi belum dipakai langsung di alur server yang ada sekarang.

## Konfigurasi Environment

Buat file `.env` di root backend. Variabel yang dipakai oleh kode saat ini:

```env
PORT=8000
MONGODB_URI=mongodb://127.0.0.1:27017/helpdesk
JWT_SECRET=change_this_secret
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

Keterangan:

- `PORT`: port server Express dan Socket.IO
- `MONGODB_URI`: koneksi MongoDB
- `JWT_SECRET`: secret untuk signing token
- `JWT_EXPIRE`: masa berlaku token, default di kode adalah `7d`
- `FRONTEND_URL`: dipakai sebagai origin tambahan dan log akses
- `ALLOWED_ORIGINS`: daftar origin dipisahkan koma untuk Socket.IO

Catatan:

- Middleware `cors()` Express masih memakai konfigurasi default terbuka.
- Validasi origin kustom saat ini diterapkan di Socket.IO, bukan di middleware Express.

## Instalasi Dan Menjalankan Project

```bash
npm install
npm run dev
```

Mode production:

```bash
npm start
```

Jika koneksi berhasil, server akan:

- terkoneksi ke MongoDB
- listen di `http://localhost:<PORT>`
- mengaktifkan Socket.IO

## Base URL Dan Route Root

Endpoint root:

```http
GET /
```

Contoh response:

```json
{
   "message": "Server is running successfully!",
   "socket": "Socket.IO enabled",
   "endpoints": {
      "auth": "/auth",
      "users": "/users",
      "conversations": "/conversations",
      "messages": "/messages"
   }
}
```

## Model Data

### User

Collection user menyimpan akun sistem.

- `work_id` — Type: String. Keterangan: wajib, unik.
- `nama` — Type: String. Keterangan: wajib.
- `email` — Type: String. Keterangan: wajib, unik, lowercase.
- `password` — Type: String. Keterangan: wajib, minimal 6 karakter, disimpan dalam bentuk hash.
- `role` — Type: String. Keterangan: enum: `user`, `admin`, `it_staff`.
- `createdAt` — Type: Date. Keterangan: otomatis.
- `updatedAt` — Type: Date. Keterangan: otomatis.

Perilaku tambahan:

- password di-hash dengan bcrypt sebelum save
- field password tidak ikut terambil secara default

### Conversation

Merepresentasikan tiket help desk.

- `subject` — Type: String. Keterangan: wajib.
- `participants` — Type: ObjectId[]. Keterangan: referensi ke `User`.
- `status` — Type: String. Keterangan: enum: `open`, `in_progress`, `closed`.
- `is_locked` — Type: Boolean. Keterangan: `true` jika tiket sudah ditutup.
- `closed_by` — Type: ObjectId. Keterangan: referensi ke `User`, default `null`.
- `closed_at` — Type: Date. Keterangan: waktu penutupan, default `null`.
- `createdAt` — Type: Date. Keterangan: otomatis.
- `updatedAt` — Type: Date. Keterangan: otomatis.

Perilaku tambahan:

- saat tiket dibuat, participant awal adalah user pembuat + satu admin
- ada index pada `participants` dan `status`

### Message

Menyimpan pesan di dalam conversation.

- `conversation_id` — Type: ObjectId. Keterangan: referensi ke `Conversation`, wajib.
- `sender_id` — Type: ObjectId. Keterangan: referensi ke `User`, wajib.
- `isi_pesan` — Type: String. Keterangan: isi pesan, wajib.
- `sent_at` — Type: Date. Keterangan: default `Date.now`.
- `createdAt` — Type: Date. Keterangan: otomatis.
- `updatedAt` — Type: Date. Keterangan: otomatis.

Perilaku tambahan:

- ada index pada `conversation_id` dan `sent_at`

### ActivityLog

Mencatat perubahan penting pada conversation.

- `conversation_id` — Type: ObjectId. Keterangan: referensi ke `Conversation`, wajib.
- `action` — Type: String. Keterangan: enum: `ADD_IT_STAFF`, `CLOSED`, `CREATED`, `REOPENED`, `STATUS_CHANGED`.
- `actor_id` — Type: ObjectId. Keterangan: user yang melakukan aksi.
- `target_user_id` — Type: ObjectId. Keterangan: user target, opsional.
- `details` — Type: String. Keterangan: detail tambahan.
- `timestamp` — Type: Date. Keterangan: default `Date.now`.
- `createdAt` — Type: Date. Keterangan: otomatis.
- `updatedAt` — Type: Date. Keterangan: otomatis.

## Autentikasi

Semua route private memakai header berikut:

```http
Authorization: Bearer <token>
```

Token dibuat saat login dan register dengan payload berisi id user.

## Role Dan Hak Akses

- `user`: membuat ticket, melihat conversation miliknya, mengirim pesan jika menjadi participant
- `admin`: melihat semua conversation, menambah IT staff, mengelola user, dan tetap bisa mengakses conversation walau bukan participant
- `it_staff`: dapat melihat semua conversation dan menutup conversation

## Endpoint API

### Auth

1. `GET /auth/login`
   Public. Menampilkan info penggunaan endpoint login.
2. `GET /auth/register`
   Public. Menampilkan info penggunaan endpoint register.
3. `POST /auth/register`
   Public. Register user baru.
4. `POST /auth/login`
   Public. Login user.
5. `POST /auth/logout`
   Pada implementasi route saat ini endpoint ini tidak diproteksi. Fungsinya hanya mengembalikan response logout, sedangkan token dihapus di sisi client.
6. `GET /auth/me`
   Private. Mengambil data user yang sedang login.

Body register:

```json
{
   "work_id": "EMP001",
   "nama": "Fariz",
   "email": "fariz@example.com",
   "password": "secret123"
}
```

Body login:

```json
{
   "email": "fariz@example.com",
   "password": "secret123"
}
```

### Conversations

Semua route conversation dilindungi middleware `protect`.

1. `GET /conversations/new`
   Private. Menampilkan info penggunaan endpoint create ticket.
2. `GET /conversations`
   Private. Mengambil list conversation. User biasa hanya melihat conversation miliknya.
3. `POST /conversations`
   Private. Membuat ticket baru.
4. `GET /conversations/:id`
   Private. Mengambil detail conversation beserta messages.
5. `POST /conversations/:id/add-it-staff`
   Admin. Menambahkan IT staff ke conversation.
6. `POST /conversations/:id/close`
   Admin atau IT Staff. Menutup conversation.
7. `GET /conversations/:id/logs`
   Private. Mengambil activity log conversation.

Body create conversation:

```json
{
   "subject": "Printer tidak bisa digunakan"
}
```

Body add IT staff:

```json
{
   "it_staff_id": "<user_id_it_staff>"
}
```

Query yang didukung:

- `GET /conversations?status=open`
- `GET /conversations?status=in_progress`
- `GET /conversations?status=closed`

Perilaku penting:

- saat ticket dibuat, sistem mencari satu user dengan role `admin` untuk dimasukkan ke participant
- jika tidak ada admin di database, pembuatan ticket akan gagal
- route detail conversation juga mengembalikan daftar pesan conversation tersebut

### Messages

Semua route message dilindungi middleware `protect`.

1. `POST /messages`
   Private. Mengirim pesan ke conversation.
2. `GET /messages/:conversation_id`
   Private. Mengambil seluruh pesan dalam conversation.
3. `DELETE /messages/:id`
   Admin. Menghapus satu pesan.

Body send message:

```json
{
   "conversation_id": "<conversation_id>",
   "isi_pesan": "Saya butuh bantuan akses VPN"
}
```

Catatan request message:

- endpoint `POST /messages` mendukung `application/json`
- endpoint ini juga menerima `multipart/form-data` melalui `multer`
- konfigurasi `multer` saat ini memakai `upload.none()`, jadi form-data dipakai untuk field text saja, bukan upload file
- ada limit ukuran request form-data `5MB`

### Users

Semua route user saat ini dilindungi `protect` lalu `isAdmin`, jadi hanya admin yang bisa mengakses seluruh endpoint user.

1. `GET /users`
   Admin. Mengambil semua user.
2. `GET /users/role/:role`
   Admin. Memfilter user berdasarkan role.
3. `GET /users/:id`
   Admin. Mengambil detail user.
4. `PUT /users/:id`
   Admin. Mengupdate `nama`, `email`, atau `role`.
5. `DELETE /users/:id`
   Admin. Menghapus user.

Role yang valid untuk filter:

- `user`
- `admin`
- `it_staff`

## Event Socket.IO

Socket.IO memakai autentikasi token JWT dari:

```js
auth: {
   token: '<jwt>'
}
```

### Event dari client

- `join_conversation` — Payload: `conversationId`. Bergabung ke room `conversation_<id>`.
- `leave_conversation` — Payload: `conversationId`. Keluar dari room conversation.
- `typing` — Payload: `{ conversationId }`. Kirim indikator sedang mengetik.
- `stop_typing` — Payload: `{ conversationId }`. Hentikan indikator mengetik.

### Event yang di-emit server

- `new_ticket` — Ticket baru dibuat.
- `it_staff_added` — IT staff ditambahkan ke conversation.
- `ticket_closed` — Conversation ditutup.
- `new_message` — Pesan baru pada room conversation.
- `user_typing` — Participant lain sedang mengetik.
- `user_stop_typing` — Participant lain berhenti mengetik.

## Alur Ticket Yang Diimplementasikan

1. User register atau login.
2. User membuat ticket melalui `POST /conversations`.
3. Sistem otomatis menambahkan satu admin ke participant ticket.
4. Admin menambahkan IT staff lewat `POST /conversations/:id/add-it-staff`.
5. Status conversation berubah menjadi `in_progress`.
6. Participant bertukar pesan lewat REST dan Socket.IO.
7. Admin atau IT staff menutup ticket lewat `POST /conversations/:id/close`.
8. Status menjadi `closed` dan `is_locked = true`.

## Catatan Implementasi Saat Ini

- Tidak ada endpoint upload attachment meskipun folder `uploads/chat/` sudah ada.
- `multer` saat ini hanya dipakai untuk parsing `multipart/form-data` tanpa file pada route pesan.
- Route `POST /auth/logout` belum diproteksi dan hanya mengembalikan response sukses.
- Ada method `getAllLogs` di controller activity log, tetapi belum dipasang ke route.
- User dengan role `it_staff` dapat melihat semua conversation melalui `GET /conversations` karena filter khusus hanya diterapkan untuk role `user`.

## Saran Penggunaan Untuk Testing Manual

Urutan test yang masuk akal:

1. Buat satu akun admin langsung di database atau ubah role salah satu user menjadi `admin`.
2. Register user biasa melalui `POST /auth/register`.
3. Login dan simpan token.
4. Buat conversation baru.
5. Login sebagai admin lalu tambahkan IT staff ke conversation.
6. Kirim pesan dari participant yang terlibat.
7. Tutup ticket sebagai admin atau IT staff.

## Scripts

```json
{
   "dev": "nodemon server.js",
   "start": "node server.js"
}
```
