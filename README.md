# MEDIGUIDE BLOODCONNECT
**Verified Hospital Blood Availability Platform**

MediGuide BloodConnect is a real, data-driven web application connecting registered hospitals and licensed blood banks with patients and families who urgently need a specific blood group.

---

## Key Principles & Guarantees
- **Strictly Real Data:** Zero demo hospitals, zero sample users, zero fake blood stock, zero hardcoded placeholder records.
- **Initial Clean State:** The application starts with an empty central database (0 hospitals, 0 inventory, 0 requirements).
- **Single Central Database:** Both Hospital Portal and User Portal share the exact same SQLite database. Any update made by a hospital is immediately live in the User Portal.
- **Duplicate Prevention:** Unique hospital registration numbers, unique emails, and unique `(hospital_id, blood_group)` inventory records ensure clean, normalized data.
- **Dynamic Stock Status Calculation:**
  - `0 Units` → **Out of Stock**
  - `1–5 Units` → **Low Stock**
  - `> 5 Units` → **Available**
- **Live Urgent Requirements:** Hospitals can broadcast their specific urgent blood needs which appear dynamically on hospital cards in search results.
- **Direct Hospital Contact:** Real verified contact number provided with a direct call action.

---

## Tech Stack
- **Frontend:** React 19, Vite, Modern CSS Design System (Healthcare Red, Navy Blue, Clean White & Slate), Lucide Icons.
- **Backend:** Node.js, Express.js (REST API Architecture).
- **Database:** SQLite (`better-sqlite3` with Foreign Keys and WAL mode).
- **Security:** Password hashing with `bcryptjs`, JWT token authentication.

---

## Project Structure
```
blood donor/
├── backend/
│   ├── src/
│   │   ├── db.js                 # Database schema initialization and reset utilities
│   │   ├── server.js             # Express server with REST API routes & static serving
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT authentication middleware
│   │   └── routes/
│   │       ├── hospitals.js      # Hospital register, login, profile endpoints
│   │       ├── inventory.js      # Blood stock management & urgent requirements
│   │       └── blood.js          # User blood availability search
│   ├── data/
│   │   └── bloodconnect.db       # Central SQLite database
│   ├── test_verification.js      # Integration test suite for the 10 core test cases
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Top navigation with portal switching & auth state
│   │   │   ├── LandingPage.jsx   # Clean landing page (Application name, subtitle, CTA)
│   │   │   ├── HospitalAuth.jsx  # Hospital registration & login forms with validation
│   │   │   ├── HospitalDashboard.jsx # Blood stock inventory & requirements management
│   │   │   ├── UserPortal.jsx    # "Find Blood" search, matching cards, contact modal
│   │   │   └── Footer.jsx        # Professional healthcare footer
│   │   ├── api.js                # Frontend API client
│   │   ├── App.jsx               # Main view orchestrator
│   │   ├── index.css             # Healthcare UI design system
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── package.json
```

---

## How to Run the Application

### Option 1: Unified Production Server (Port 5000)
Serves both backend API and the built React frontend on a single port:
```bash
node backend/src/server.js
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

### Option 2: Full Development Environment (With Vite HMR)
Run backend and frontend concurrently:
1. Start backend:
   ```bash
   node backend/src/server.js
   ```
2. Start frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```
Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3001](http://localhost:3001).

---

## Running Verification Tests
The project includes a 10-step integration test suite that tests:
1. Initial empty database state (0 records)
2. Hospital manual registration
3. Hospital login & JWT authentication
4. Blood stock entry & automatic status calculation
5. User Portal blood search matching
6. Real-time stock update propagation (e.g. 5 → 10 units)
7. Search for unavailable blood groups (returns 0 records / empty state)
8. Rejection of duplicate hospital registration numbers
9. Prevention of duplicate blood stock entries
10. Database reset to empty schema (zero demo data)

Run the test suite:
```bash
node backend/test_verification.js
```

---

## Resetting the Database to Fresh Empty State
To clear all data and start with an empty schema (0 records):
```bash
npm run reset-db
```
or call `POST /api/dev/reset-database`.
