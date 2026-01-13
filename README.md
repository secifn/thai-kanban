# Thai Kanban Board 🌞

ระบบบริหารจัดการงานแบบ Kanban Board ที่ใช้งานง่าย พร้อม UI ภาษาไทย

## ฟีเจอร์หลัก

- ✅ Kanban Board พร้อม Drag & Drop
- ✅ มุมมองตาราง (Table View) และปฏิทิน (Calendar View)
- ✅ Import ข้อมูลจาก Focalboard (.boardarchive)
- ✅ ระบบจัดการผู้ใช้และสิทธิ์
- ✅ UI/UX ทันสมัยเป็นภาษาไทย
- ✅ รองรับ Docker Deployment

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite + Prisma ORM
- **Authentication**: JWT + bcrypt
- **Deployment**: Docker + Docker Compose + Nginx

---

## 🐳 Deploy ด้วย Docker (แนะนำ)

### ข้อกำหนดเบื้องต้น

- Docker 20+
- Docker Compose 2+

### วิธี Deploy (Production)

```bash
# 1. Clone โปรเจค
cd thai-kanban

# 2. (Optional) ตั้งค่า JWT Secret
export JWT_SECRET="your-secure-secret-key"

# 3. Build และ Start
docker-compose up -d --build

# 4. ตรวจสอบสถานะ
docker-compose ps
docker-compose logs -f
```

**เปิดใช้งาน:** http://localhost

### วิธี Deploy (Development พร้อม Hot Reload)

```bash
# Start development containers
docker-compose -f docker-compose.dev.yml up --build

# Client จะรันที่ http://localhost:5173
# Server จะรันที่ http://localhost:3001
```

### คำสั่ง Docker ที่มีประโยชน์

```bash
# หยุด containers
docker-compose down

# ดู logs
docker-compose logs -f server
docker-compose logs -f client

# เข้าไปใน container
docker-compose exec server sh
docker-compose exec client sh

# ล้างข้อมูลทั้งหมด (รวมถึง database)
docker-compose down -v

# Rebuild เฉพาะ service
docker-compose up -d --build server
```

---

## 💻 ติดตั้งแบบ Local (ไม่ใช้ Docker)

### ข้อกำหนดเบื้องต้น

- Node.js 18+

### ขั้นตอนการติดตั้ง

1. **ติดตั้ง dependencies**

```bash
# Client
cd client
npm install

# Server
cd ../server
npm install
```

2. **ตั้งค่า Database**

```bash
cd server
npx prisma db push
npx prisma generate
```

3. **รันโปรเจค**

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

4. **เปิดใช้งาน**

- Client: http://localhost:5173
- Server: http://localhost:3001

---

## 📁 โครงสร้างโปรเจค

```
thai-kanban/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── pages/          # Pages
│   │   ├── services/       # API Services
│   │   └── store/          # Zustand Store
│   ├── Dockerfile          # Production Dockerfile
│   ├── Dockerfile.dev      # Development Dockerfile
│   └── nginx.conf          # Nginx config
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── controllers/    # Route Controllers
│   │   ├── middleware/     # Auth Middleware
│   │   ├── routes/         # API Routes
│   │   └── services/       # Business Logic
│   ├── prisma/             # Database Schema
│   ├── Dockerfile          # Production Dockerfile
│   └── Dockerfile.dev      # Development Dockerfile
├── docker-compose.yml      # Production compose
├── docker-compose.dev.yml  # Development compose
└── README.md
```

---

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key สำหรับ JWT | `your-super-secret-jwt-key` |
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `PORT` | Server port | `3001` |

---

## 📦 นำเข้าข้อมูลจาก Focalboard

1. Export บอร์ดจาก Focalboard เป็นไฟล์ `.boardarchive`
2. เข้าสู่ระบบ Thai Kanban
3. คลิก "นำเข้าจาก Focalboard"
4. เลือกไฟล์ `.boardarchive`
5. รอการนำเข้าเสร็จสิ้น

---

## License

MIT
