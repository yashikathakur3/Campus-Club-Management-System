# Campus Club Management Platform

Campus club management platform built with React, Vite, Tailwind CSS, Express, and MongoDB.

## Run the backend on Windows

Open two PowerShell terminals from `campus-club-platform`.

Backend terminal:

```powershell
cd backend
npm install
npm run dev
```

Frontend terminal:

```powershell
cd frontend
npm install
npm run dev
```

The backend expects a local MongoDB server and configuration in `backend/.env`. Check `backend/.env.example` for its required keys. The frontend API base URL is set in `frontend/.env` from `frontend/.env.example`.

## Provision the first Super Admin

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `backend/.env`. Use a password with at least 16 characters, including a letter, number, and symbol. From `backend`, run `npm run seed:admin`. The seed command is idempotent; it does not promote existing member accounts. Keep `.env` private.
