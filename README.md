# QuizPro — Full-Stack GK Quiz Platform

A production-ready quiz platform with PDF-based question banks, JWT authentication, randomized quizzes, and detailed analytics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v4 + React Router v6 + Recharts |
| Backend | Node.js + Express.js + Prisma ORM v7 |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| PDF Parsing | pdf-parse |

---

## Project Structure

```
Quiz/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── prisma.config.ts           # Prisma v7 datasource config
│   ├── src/
│   │   ├── controllers/           # Auth, Quiz, Dashboard
│   │   ├── routes/                # Express routers
│   │   ├── middleware/            # JWT auth, error handler
│   │   ├── services/              # Quiz business logic
│   │   ├── scripts/               # PDF parser & seeder
│   │   └── utils/                 # Prisma client, JWT, response helpers
│   ├── pdfs/                      # ← PUT YOUR 4 PDF FILES HERE
│   ├── .env                       # Environment variables (edit this!)
│   └── server.js
│
└── frontend/
    └── src/
        ├── pages/                 # All 9 pages
        ├── components/            # Reusable components
        ├── context/               # Auth context
        ├── hooks/                 # useTimer
        └── api/                   # Axios client
```

---

## Setup Instructions

### Step 1: Database Setup

**Option A — Local PostgreSQL**
1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create a database: `CREATE DATABASE quiz_db;`
3. Note your username/password

**Option B — Neon (Cloud, Recommended)**
1. Create a free account at https://neon.tech
2. Create a new project → Copy the connection string

---

### Step 2: Configure Backend Environment

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/quiz_db"
# OR for Neon:
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/quiz_db?sslmode=require"

JWT_SECRET="your-very-long-secret-key-min-32-characters"
PORT=5000
FRONTEND_URL=http://localhost:5173

QUIZ_QUESTIONS_COUNT=30
QUIZ_TIMER_MINUTES=30
QUIZ_PASS_PERCENTAGE=60
```

Also update `backend/prisma.config.ts`:
```ts
import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

---

### Step 3: Place PDF Files

Copy your 4 GK PDF files into: `backend/pdfs/`

The PDF parser supports the most common question formats:
```
Q1. What is the capital of France?
A) Paris
B) Berlin
C) Rome
D) Madrid
Answer: A
Explanation: Paris is the capital and most populous city of France...
```

---

### Step 4: Initialize Database

```bash
cd backend

# Push schema to database
npx prisma db push

# Parse PDFs and seed questions
npm run seed
```

You should see output like:
```
📄 Processing: gk_questions_1.pdf
  ✅ Parsed 150 questions
  📥 Inserted: 150 | Skipped (duplicate): 0

✅ Database ready for quiz generation!
```

---

### Step 5: Start the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server running on port 5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App running at http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## API Reference

### Authentication
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{name, email, password}` | Register |
| POST | `/api/auth/login` | `{email, password}` | Login |
| GET | `/api/auth/me` | — | Get current user |

### Quiz
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/quiz/generate` | Create new quiz attempt (30 random Qs) |
| GET | `/api/quiz/:id/questions` | Get quiz questions |
| POST | `/api/quiz/:id/submit` | Submit answers |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/attempts` | All past attempts |
| GET | `/api/dashboard/analytics` | Aggregated stats |
| GET | `/api/dashboard/attempts/:id/review` | Full review with explanations |

All quiz/dashboard routes require `Authorization: Bearer <token>` header.

---

## Deployment

### Frontend → Vercel
1. Push `frontend/` to a GitHub repo
2. Import in Vercel, set build command: `npm run build`
3. Set environment variable: `VITE_API_URL` (your backend URL)

### Backend → Railway or Render
1. Push `backend/` to GitHub
2. Add all `.env` variables in the dashboard
3. Set start command: `node server.js`
4. Run `npx prisma db push` via shell

### Database → Neon
1. Create a project at https://neon.tech
2. Use the connection string in your `DATABASE_URL` env var

---

## Features

- ✅ JWT Authentication (Register/Login/Logout)
- ✅ Automatic PDF parsing with deduplication
- ✅ 30-question randomized quiz per attempt
- ✅ Shuffled answer options per attempt
- ✅ 30-minute countdown timer with auto-submit
- ✅ Question navigator grid
- ✅ Post-quiz score card with animated ring
- ✅ Detailed review with explanations (shown only after submission)
- ✅ Filter reviews by correct/incorrect/skipped
- ✅ Full attempt history
- ✅ Analytics with trend charts (Recharts)
- ✅ Score distribution bar chart
- ✅ Improvement vs previous attempt
- ✅ Dark mode glassmorphism UI
- ✅ Fully responsive (mobile-first)
