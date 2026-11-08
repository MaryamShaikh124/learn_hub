# LearnHub

LearnHub is a React and Express learning platform scaffold with student, instructor, and administrator workflows. The API uses MongoDB/Mongoose and JWT authentication.

## What is included

- Public course discovery with category, price, search, sort, and pagination filters.
- Student registration/login, profile/password settings, enrollments, lesson progress, certificates, and course reviews.
- Instructor course and lesson management, student lists, and database-backed analytics.
- Admin overview, user/role management, instructor account creation, and course oversight.
- User-scoped in-app notifications.
- Responsive Vite/React UI with separate role-based workspaces.

## Requirements

- Node.js 18 or newer.
- MongoDB (a local server or MongoDB Atlas). During development, the API can start an ephemeral in-memory MongoDB instance if `MONGODB_URI` is omitted. Data in that fallback is discarded when the API stops.

## Local setup

1. Configure the API:

   ```powershell
   cd backend
   Copy-Item .env.example .env
   npm install
   ```

   Set a unique `JWT_SECRET`. For persistent local data, set `MONGODB_URI` to your MongoDB connection string. Leave it empty only when you want the temporary in-memory development database.

2. Create the first administrator securely. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 12 characters in `backend/.env`, then run:

   ```powershell
   npm run seed
   ```

   The seed script only creates an administrator; if the email already exists it will not change that account. Public registration always creates a student.

3. Start the API:

   ```powershell
   npm run dev
   ```

   The default API URL is `http://localhost:5000/api`; health is available at `http://localhost:5000/api/health`.

4. Configure and run the frontend in another terminal:

   ```powershell
   cd frontend
   Copy-Item .env.example .env
   npm install
   npm run dev
   ```

   The Vite development server is normally available at `http://localhost:5173`.

## Checks

Run the frontend production build:

```powershell
cd frontend
npm run build
```

Run the backend API tests:

```powershell
cd backend
npm test
```

## Course pricing

Paid courses use an explicitly simulated checkout. Completing it creates a simulated payment record and enrolls the student, but no payment provider is connected, no payment details are collected, and no money is charged. Students can view their demo payment records; administrators can review all simulated transactions. These records are not real payments or revenue.

## Deployment

### Vercel API

Deploy the `backend` directory as a Vercel project root. Set `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL` in the backend project's environment variables.

### Vercel frontend

Deploy the `frontend` directory as the Vercel project root. Vercel uses `frontend/vercel.json` to send client-side routes to `index.html`. Set `VITE_API_URL` to the deployed API base URL, including `/api`, then build with `npm run build` (output directory `dist`).

### MongoDB Atlas

Create a database user with a strong password, restrict network access to the deployment environment where possible, and set the resulting URI as `MONGODB_URI`. Do not commit `.env` files or real credentials.

## Current limitations

- Video hosting is external: instructors provide YouTube/Vimeo URLs; LearnHub does not upload or transcode video files.
- The in-memory MongoDB fallback is for local development only and resets on process shutdown.
- Paid course checkout is currently simulated. Connect a payment provider and verify its server-side payment result before treating an order as paid or granting real-world value.
