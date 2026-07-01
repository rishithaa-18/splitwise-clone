# Ledger — Split Expenses With Friends

A full-stack expense-splitting app (a Splitwise clone) built with React, Node.js/Express, and PostgreSQL. Create groups, log shared expenses, and instantly see who owes whom — settled with a debt-simplification algorithm that minimizes the number of transactions needed to settle up.

**Live demo:** [https://splitwise-clone-cyan.vercel.app/](#) 


> Note: the backend is hosted on Render's free tier, which spins down after periods of inactivity. The first request after idle time may take 30–50 seconds to respond while the server wakes up.

---

## Features

- **Authentication** — secure signup/login with JWT and bcrypt password hashing
- **Groups** — create groups, invite others via a unique shareable code, join existing groups
- **Expenses** — log shared expenses, automatically split equally among all group members (with penny-accurate rounding)
- **Smart settlements** — a debt-simplification algorithm calculates each member's net balance and produces the *minimum number of transactions* needed to settle the group, instead of naive pairwise settling
- **Dashboard** — an aggregated view across all groups showing net balance, total owed, total owing, and recent activity

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Tailwind CSS, Axios, Lucide Icons |
| Backend | Node.js, Express |
| Database | PostgreSQL (hosted on Supabase) |
| Auth | JWT, bcrypt |
| Deployment | Vercel (frontend), Render (backend), Supabase (database) |

---

## The Settlement Algorithm

The core feature of this project is debt simplification. Instead of tracking every individual expense as a separate debt, the app:

1. Calculates each member's **net balance** across all expenses in a group (total paid − total owed).
2. Splits members into **creditors** (net balance > 0, owed money) and **debtors** (net balance < 0, owe money).
3. Greedily matches the largest creditor against the largest debtor, settling as much of the smaller amount as possible, and repeats until every balance reaches zero.

This produces the **minimum possible number of transactions** to settle a group — for example, if A owes B, B owes C, and C owes A, the naive approach requires 3 transactions, while this algorithm can resolve it in far fewer (or even zero, if the amounts cancel out).

The implementation lives in [`backend/src/controllers/settlement.controller.js`](./backend/src/controllers/settlement.controller.js).

---

## Project Structure

```
splitwise-clone/
├── backend/
│   ├── src/
│   │   ├── routes/          # Express route definitions
│   │   ├── controllers/     # Request handlers & business logic
│   │   ├── models/          # Database connection
│   │   ├── middleware/      # JWT authentication middleware
│   │   └── server.js        # App entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/            # Login, Signup, Dashboard, Group Detail
    │   ├── components/       # Layout (sidebar), ProtectedRoute
    │   ├── api/               # Axios instance with auth interceptor
    │   └── App.jsx
    └── package.json
```

---

## Database Schema

```sql
users            (id, name, email, password_hash, created_at)
groups           (id, name, created_by, invite_code, created_at)
group_members    (id, group_id, user_id, joined_at)
expenses         (id, group_id, paid_by, description, amount, created_at)
expense_shares   (id, expense_id, user_id, amount_owed)
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create a new account |
| POST | `/api/auth/login` | Log in and receive a JWT |
| POST | `/api/groups/create` | Create a new group |
| POST | `/api/groups/join` | Join a group via invite code |
| GET | `/api/groups/my-groups` | List all groups the user belongs to |
| POST | `/api/expenses/add` | Add an expense, split equally among group members |
| GET | `/api/expenses/group/:groupId` | List all expenses in a group |
| GET | `/api/settlements/group/:groupId` | Get net balances and simplified settlement transactions |

All routes except signup/login require a `Authorization: Bearer <token>` header.

---

## Running Locally

### Prerequisites
- Node.js (v18+)
- A PostgreSQL database (e.g. a free [Supabase](https://supabase.com) project)

### 1. Clone the repo
```bash
git clone https://github.com/rishithaa-18/splitwise-clone.git
cd splitwise-clone
```

### 2. Backend setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/`:
```
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```
Run the SQL schema above in your database, then start the server:
```bash
npm run dev
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
```
Create a `.env` file in `frontend/`:
```
VITE_API_URL=http://localhost:5000/api
```
Start the dev server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Future Improvements

- Custom and percentage-based expense splits (currently equal-split only)
- Expense editing and deletion
- Activity notifications when a new expense is added
- Support for multiple currencies

---

## Author

**Rishitha Godishala**
B.Tech, Mathematics and Computing — Indian Institute of Technology Mandi
[GitHub](https://github.com/rishithaa-18) · rishithagodishala2006@gmail.com
