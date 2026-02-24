# 🤖 Help Desk Chat - Backend API

> *Backend API untuk Sistem Tiket Dukungan Berbasis Chat Real-Time*

---

## 📋 Daftar Isi

1. [Tentang Backend](#-tentang-backend)
2. [Struktur Database](#-struktur-database)
3. [Model & Koleksi](#-model--koleksi)
4. [Fitur Backend](#-fitur-backend)
5. [Teknologi](#-teknologi)
6. [Instalasi](#-instalasi)
7. [Penggunaan](#-penggunaan)
8. [API Endpoints](#-api-endpoints)

---

## 🎯 Tentang Backend

Backend API ini menyediakan layanan untuk sistem Help Desk Chat yang memungkinkan user menghubungi Call Center untuk troubleshooting masalah melalui chat real-time.

### ✨ Prinsip Backend

> *"API yang baik adalah API yang cepat, aman, dan mudah diintegrasikan"*

- **RESTful API**: Endpoint yang terstruktur dan konsisten
- **Real-Time Communication**: Socket.IO untuk chat dan notifikasi
- **Secure Authentication**: JWT dengan proteksi role-based
- **Clean Code**: MVC pattern dengan separation of concerns

---

## 🗄️ Struktur Database

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     USERS       │     │  CONVERSATIONS  │     │    MESSAGES     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ _id             │◄────┤ participants[]  │◄────┤ conversation_id │
│ nama            │     │ subject         │     │ sender_id       │
│ email           │     │ status          │     │ isi_pesan       │
│ password        │     │ is_locked       │     │ sent_at         │
│ role            │     │ closed_by       │────►│                 │
│ work_id         │     │ closed_at       │     │                 │
│ createdAt       │     │ createdAt       │     │                 │
│ updatedAt       │     │ updatedAt       │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │
         │              ┌─────────────────┐
         └─────────────►│  ACTIVITY_LOGS  │
                        ├─────────────────┤
                        │ conversation_id │
                        │ action          │
                        │ performed_by    │
                        │ target_user     │
                        │ details         │
                        │ timestamp       │
                        └─────────────────┘
```

---

## 📦 Model & Koleksi

### 1. 👤 User
Menyimpan data pengguna sistem dengan tiga peran berbeda.

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `_id` | ObjectId | Identifier unik pengguna |
| `nama` | String | Nama lengkap pengguna |
| `email` | String | Email unik untuk login |
| `password` | String | Password terenkripsi (bcrypt) |
| `role` | String | Peran: `user`, `it_staff`, atau `admin` |
| `work_id` | String | ID karyawan (unik per organisasi) |
| `createdAt` | Date | Tanggal registrasi |
| `updatedAt` | Date | Tanggal update terakhir |

**Relasi:**
- Satu User dapat memiliki banyak Conversations (sebagai participant)
- Satu User dapat mengirim banyak Messages

---

### 2. 💬 Conversation (Ticket)
Representasi dari tiket dukungan yang berisi percakapan.

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `_id` | ObjectId | Identifier unik tiket |
| `subject` | String | Judul/subjek permasalahan |
| `participants` | Array[ObjectId] | Daftar user yang terlibat (ref: User) |
| `status` | String | Status: `open`, `in_progress`, `closed` |
| `is_locked` | Boolean | Apakah tiket sudah ditutup permanen |
| `closed_by` | ObjectId | User yang menutup tiket (ref: User) |
| `closed_at` | Date | Tanggal penutupan tiket |
| `createdAt` | Date | Tanggal pembuatan tiket |
| `updatedAt` | Date | Tanggal update terakhir |

**Relasi:**
- Satu Conversation memiliki banyak Messages
- Satu Conversation melibatkan banyak Users (participants)

---

### 3. 📨 Message
Pesan individual dalam sebuah percakapan.

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `_id` | ObjectId | Identifier unik pesan |
| `conversation_id` | ObjectId | Referensi ke Conversation |
| `sender_id` | ObjectId | Pengirim pesan (ref: User) |
| `isi_pesan` | String | Konten teks pesan |
| `sent_at` | Date | Waktu pengiriman |

**Relasi:**
- Satu Message milik satu Conversation
- Satu Message dikirim oleh satu User

---

### 4. 📋 ActivityLog
Catatan aktivitas untuk audit trail.

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `_id` | ObjectId | Identifier unik log |
| `conversation_id` | ObjectId | Tiket terkait (ref: Conversation) |
| `action` | String | Jenis aksi: `CREATED`, `ADD_IT_STAFF`, `CLOSED` |
| `performed_by` | ObjectId | User yang melakukan aksi (ref: User) |
| `target_user` | ObjectId | User target (opsional, ref: User) |
| `details` | String | Keterangan detail |
| `timestamp` | Date | Waktu kejadian |

---

## 🚀 Fitur Backend

### 🔐 Autentikasi & Keamanan
- **JWT-based Authentication**: Token-based login dengan expiry
- **Password Hashing**: Enkripsi bcrypt dengan salt round 10
- **Role-based Access Control**: Middleware proteksi per level user (user, it_staff, admin)

### 💡 Real-Time Communication (Socket.IO)
- **Bidirectional Event**: Chat real-time antara user dan staf
- **Room-based Messaging**: Pesan terisolasi per conversation
- **Broadcast Events**: Notifikasi ke semua client terkait
- **Typing Indicators**: Event saat user sedang mengetik

### 🎫 Manajemen Tiket (Conversation)
- **CRUD Operations**: Create, Read, Update (status), Delete (soft)
- **Status Workflow**: `open` → `in_progress` → `closed`
- **Participant Management**: Auto-assign admin, manual assign IT staff
- **Data Population**: MongoDB populate untuk relasi user

### 📨 Message System
- **Create & Read**: Kirim dan baca pesan
- **Sender Population**: Data pengirim lengkap dengan work_id
- **Timestamp Tracking**: Waktu pengiriman presisi

### 📋 Activity Logging
- **Audit Trail**: Catatan semua aktivitas tiket
- **Action Types**: CREATED, ADD_IT_STAFF, CLOSED

---

## 🛠️ Teknologi

### Core Stack
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| **Node.js** | 18.x | Runtime environment |
| **Express.js** | 4.x | Web framework |
| **MongoDB** | 6.x | Database NoSQL |
| **Mongoose** | 7.x | ODM untuk MongoDB |
| **Socket.IO** | 4.x | Real-time communication |
| **JWT** | 9.x | JSON Web Token authentication |
| **bcryptjs** | 2.x | Password hashing |
| **CORS** | 2.x | Cross-origin resource sharing |

### Development Tools
- **nodemon**: Auto-restart saat development
- **dotenv**: Environment variables management

---

## ⚙️ Instalasi

### Prasyarat
- Node.js v18+ terinstall
- MongoDB server berjalan
- Git (opsional)

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd Chat-Helping/Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit file `.env`:
   ```env
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/helpdesk_chat
   JWT_SECRET=your_super_secret_key_here
   NODE_ENV=development
   ```

4. **Jalankan server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Verifikasi instalasi**
   ```
   Server running on port 8000
   MongoDB Connected
   ```

---

## 🎮 Penggunaan

### Inisialisasi Data Awal

1. **Buat Admin pertama** (Manual di Database agar Aman):

2. **Buat IT Staff** (Di add oleh Admin )

### Alur Kerja Sistem

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐
│  USER   │────►│Create Ticket│────►│    OPEN     │
└─────────┘     └─────────────┘     └──────┬──────┘
                                           │
                                           ▼
┌─────────┐     ┌─────────────┐     ┌─────────────┐
│  ADMIN  │◄────│Assign Staff │────►│ IN_PROGRESS │
└────┬────┘     └─────────────┘     └──────┬──────┘
     │                                     │
     │    ┌─────────────┐     ┌─────────┐  │
     └───►│   IT STAFF  │◄────│  Chat   │◄─┘
          └──────┬──────┘     └─────────┘
                 │
                 ▼
          ┌─────────────┐
          │    CLOSE    │
          └─────────────┘
```

---

## 🔌 API Endpoints

### Autentikasi
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrasi user baru |
| POST | `/api/auth/login` | Login dan dapatkan token |

### Conversations (Tiket)
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/conversations` | List semua tiket | All |
| POST | `/api/conversations` | Buat tiket baru | User |
| GET | `/api/conversations/:id` | Detail tiket | Participant |
| POST | `/api/conversations/:id/add-it-staff` | Tambah IT Staff | Admin |
| POST | `/api/conversations/:id/close` | Tutup tiket | Admin/IT Staff |

### Messages
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/messages/:conversation_id` | List pesan | Participant |
| POST | `/api/messages` | Kirim pesan | Participant |

### Users
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/users` | List semua user | Admin |
| GET | `/api/users/role/:role` | List user by role | Admin |
| PUT | `/api/users/:id` | Update user | Admin |

---

## 📝 Versi

**Versi 1.0** - *Initial Release*

> Versi ini merupakan fondasi dari sistem Help Desk Chat. 
> Pengembangan lebih lanjut akan menyusul untuk peningkatan fitur dan optimasi.

---

## 🎯 Roadmap Pengembangan

Fitur yang direncanakan untuk versi berikutnya:
- [ ] Attachment file dalam chat

---

<p align="center">
  <i>✨ Help Desk Chat v1.0 ✨</i>
</p>
