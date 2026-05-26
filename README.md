# Jimma University Student Cafeteria Management System (MERN)

**Jimma University** — Institute of Technology (JIT). Software Requirements Engineering project implementation.

Replaces the semi-automated cafeteria system with a full-stack web application for meal verification, transaction recording, inventory tracking, and reporting.

## Features (from SRS document)

| Requirement | Implementation |
|-------------|----------------|
| Admin login & user management | JWT auth, role-based access |
| Student registration (ID) | Student registry with eligibility |
| Meal eligibility verification | JIT **barcode** (ID card), **QR**, or manual + duplicate check |
| Record meal transactions | Cashier terminal; stock auto-deducted per meal |
| Duplicate meal prevention | One meal per period (breakfast/lunch/dinner) per day |
| Daily meal program | Fixed program by period (SRS — not student menu choice) |
| Food quality inspection | Digital Appendix A-2 (mold/damage/discoloration) |
| Daily/weekly/monthly reports | Meals + inventory usage tabs, print |
| Inventory tracking | Stock ledger, low-stock alerts, meal-linked usage |
| Student feedback | Anonymous complaint form |
| Logout & profile update | Auth routes |

### Actors & roles

- **Administrator** — users, students, full access
- **Cafeteria Manager** — reports, inventory, menus, complaints
- **Cashier** — meal verification terminal

### Meal service windows (JIT)

- Breakfast: 6:00 – 11:00
- Lunch: 11:00 – 16:00
- Dinner: 16:00 – 20:00

## Tech stack

- **M**ongoDB — database
- **E**xpress — REST API
- **R**eact (Vite) — frontend
- **N**ode.js — runtime

## Prerequisites

- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`)

## Quick start

```bash
cd jit-cafeteria-mern

# Install dependencies
npm run install:all

# Seed demo data (users, students, inventory, menus)
npm run seed

# Run backend + frontend
npm run dev
```

- **Frontend:** http://localhost:5173
- **API:** http://localhost:5000/api/health

## Demo accounts

| Role | Username | Password |
|------|----------|----------|
| Administrator | `admin` | `admin123` |
| Cafeteria Manager | `manager` | `manager123` |
| Cashier | `cashier1` | `cashier123` |

### Sample student IDs (team members from SRS)

- `RU0830/16` — Petros Bekana
- `RU1004/16` — Tewodros Kifle
- `RU1046/16` — Wakoya Daba
- `RR1813/15` — Tariku Mato
- `RU0965/16` — Sudeys Mohammed

## Project structure

```
jit-cafeteria-mern/
├── backend/
│   ├── models/       User, Student, Transaction, Menu, Inventory, Complaint
│   ├── routes/       auth, users, students, meals, menus, inventory, reports
│   ├── middleware/   JWT protection
│   └── seed.js       Demo data
└── frontend/
    └── src/pages/    Dashboard, Cashier, Students, Reports, etc.
```

## API endpoints

- `POST /api/auth/login` — Login
- `POST /api/meals/verify` — Check eligibility & duplicates
- `GET /api/quality` — Food delivery inspections (manager/admin)
- `GET /api/reports/inventory-usage` — Stock usage from meals served
- `GET /api/students/qr/:studentId` — QR payload for student card
- `POST /api/meals/transaction` — Record meal
- `GET /api/reports/meals?period=daily|weekly|monthly`
- `GET /api/reports/dashboard`
- `GET/POST /api/students`, `/api/users`, `/api/inventory`, `/api/menus`
- `POST /api/complaints` — Public feedback (no auth)

## Team (SRS authors)

1. Petros Bekana — RU0830/16
2. Tewodros Kifle — RU1004/16
3. Wakoya Daba — RU1046/16
4. Tariku Mato — RR1813/15
5. Sudeys Mohammed — RU0965/16

**Submitted to:** Mr. Kuma · **Course:** Software Requirement Engineering

## Out of scope (per SRS limitations)

- Payment/billing
- Personalized dietary tracking
- External university SIS integration (can be added later)

## License

Academic project — Jimma University Institute of Technology.
