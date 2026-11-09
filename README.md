# LearnHub -- Learning Management System

LearnHub is a MERN stack Learning Management System (LMS) for students,
instructors, and administrators. Students can browse and enroll in
courses, instructors can manage courses and lessons, and administrators
can oversee platform activity.

## Project Information

-   **Subject:** MERN Stack Web Development
-   **Project:** LearnHub -- Learning Management System
-   **Batch:** 3
-   **Stack:** MongoDB, Express.js, React.js, Node.js

## Live Application

-   **Frontend:** https://learnhub-frontend-wheat.vercel.app/
-   **Backend:** https://learnhub-backend-one.vercel.app
-   **Health check:** https://learnhub-backend-one.vercel.app/api/health


## Technologies Used

-   **Frontend:** React.js, React Router, Axios, CSS
-   **Backend:** Node.js, Express.js, Mongoose
-   **Authentication:** JSON Web Tokens (JWT), bcryptjs
-   **Middleware/security:** Helmet, CORS, Morgan, express-rate-limit
-   **Database:** MongoDB Atlas
-   **Deployment:** Vercel
-   **Development tools:** VS Code, Git, GitHub

## Main Features

-   JWT-based user authentication.
-   Password hashing using bcryptjs.
-   Student, Instructor, and Admin roles.
-   Course browsing and course management.
-   Student enrollment functionality.
-   Lesson-related routes and learning content.
-   Reviews, certificates, and notifications.
-   Instructor and administrator route groups.
-   API error handling and authentication rate limiting.

## Project Structure

``` text
LearnHub/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── dashboards/
│   │   ├── routes/
│   │   ├── context/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── backend/
    ├── api/
    │   └── index.js
    ├── config/
    │   └── db.js
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── app.js
    ├── server.js
    ├── vercel.json
    ├── .env
    └── package.json
```

This is the main structure; additional files may exist in the actual
project.

## User Roles

  -----------------------------------------------------------------------
  Role                                Responsibilities
  ----------------------------------- -----------------------------------
  Student                             Browse courses, enroll, and view
                                      enrolled courses and learning
                                      progress.

  Instructor                          Create and manage courses and
                                      lessons.

  Admin                               Manage platform users and courses
                                      and view administrative analytics.
  -----------------------------------------------------------------------

## Installation and Local Setup

### Prerequisites

-   Node.js 18 or later
-   npm
-   MongoDB Atlas account or a local MongoDB instance
-   Git

### 1. Clone the repository

``` bash
git clone  https://github.com/MaryamShaikh124/learn_hub
cd LearnHub
```

### 2. Install and run the backend

``` bash
cd backend
npm install
```

Create `backend/.env`:

``` env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
SEED_ON_START=false
```

Replace the example values with your own. Do not commit `.env` to
GitHub.

Start the backend:

``` bash
npm run dev
```

Local backend URL: `http://localhost:5000`

Health check: `http://localhost:5000/api/health`

### 3. Install and run the frontend

Open another terminal:

``` bash
cd frontend
npm install
```

Create `frontend/.env`:

local:

``` env
VITE_SERVER_LINK=http://localhost:5000/api
```

Start the frontend:

``` bash
npm run dev
```

Vite normally serves the frontend at `http://localhost:5173`.

## Environment Variables

### Backend

  -----------------------------------------------------------------------
  Variable                            Description
  ----------------------------------- -----------------------------------
  `PORT`                              Local backend port.

  `NODE_ENV`                          Runtime environment, such as
                                      `development` or `production`.

  `MONGODB_URI`                       MongoDB connection string.

  `JWT_SECRET`                        Secret used to sign and verify
                                      JWTs.

  `CLIENT_URL`                        Allowed frontend origin for CORS.
                                      Multiple origins can be
                                      comma-separated in the current
                                      configuration.

  `SEED_ON_START`                     Controls optional seed-on-start
                                      behaviour in the local server entry
                                      point.
  -----------------------------------------------------------------------

### Frontend

  -----------------------------------------------------------------------
  Variable                            Description
  ----------------------------------- -----------------------------------
  `VITE_SERVER_LINK`                  Backend API base URL. Use
                                      `http://localhost:5000/api` locally
                                      and the deployed backend URL ending
                                      in `https://learnhub-backend-one.vercel.app/api` in production.

  -----------------------------------------------------------------------

**Security:** Vite variables prefixed with `VITE_` are exposed to the
browser. Only public configuration, such as the API base URL, belongs
there. Never put database credentials, JWT secrets, or payment secret
keys in frontend variables.

## API Route Groups

The Express application mounts these route groups:

  Path                   Purpose
  ---------------------- -----------------------------
  `GET /api/health`      Backend health check.
  `GET /api/stats`       Public platform statistics.
  `/api/auth`            Authentication routes.
  `/api/courses`         Course routes.
  `/api`                 Lesson routes.
  `/api/enrollments`     Enrollment routes.
  `/api/reviews`         Review routes.
  `/api/certificates`    Certificate routes.
  `/api/notifications`   Notification routes.
  `/api/instructor`      Instructor routes.
  `/api/admin`           Admin routes.

The exact HTTP methods, request bodies, and individual endpoint paths
are defined in the corresponding files under `backend/routes`. Check
those files when preparing API documentation or Postman tests.

## Authentication and Security

-   Passwords are hashed using bcryptjs.
-   JWT authentication is used for authenticated requests.
-   The frontend Axios service attaches the stored token as a Bearer
    token when available.
-   Helmet adds security-related HTTP headers.
-   CORS controls which frontend origins can access the API from a
    browser.
-   Rate limiting is applied to authentication routes.
-   Database and JWT secrets are read from backend environment
    variables.

## Deployment

The project is configured for deployment on Vercel as separate frontend
and backend projects.

### Backend deployment

1.  Import the repository into Vercel.
2.  Set the backend project's **Root Directory** to `backend`.
3.  Confirm `api/index.js` and `vercel.json` are present.
4.  Add backend environment variables in Vercel Project Settings.
5.  Set `CLIENT_URL` to the exact frontend production origin, without
    `/api`.
6.  Deploy the backend.
7.  Test `/api/health`.

### Frontend deployment

1.  Import the repository as a separate Vercel project.
2.  Set the frontend project's **Root Directory** to `frontend`.
3.  Add `VITE_SERVER_LINK` with the deployed backend URL ending in
    `/api`.
4.  Deploy the frontend.
5.  Redeploy after changing Vite environment variables so the new value
    is included in the build.

### CORS configuration

The backend reads the allowed frontend origin from `CLIENT_URL`. It must
match the active frontend production domain exactly. If the frontend
domain changes, update `CLIENT_URL` in the backend Vercel project and
redeploy the backend.

## Testing Checklist

-   [ ] Backend health endpoint responds successfully.
-   [ ] MongoDB connection is successful.
-   [ ] Course listing loads in the frontend.
-   [ ] User registration works.
-   [ ] User login works.
-   [ ] Invalid input and failed requests show understandable feedback.
-   [ ] Student dashboard is accessible to a Student account.
-   [ ] Instructor dashboard is accessible to an Instructor account.
-   [ ] Admin dashboard is accessible to an Admin account.
-   [ ] Protected routes reject unauthorized access.
-   [ ] Course create, update, and delete operations work for authorized
    users.
-   [ ] Student enrollment works and appears in the student's enrolled
    courses.
-   [ ] Lessons, reviews, notifications, and certificates work where
    implemented.
-   [ ] Frontend and backend communicate without CORS or network errors.
-   [ ] Production deployment works after a fresh browser reload.

## GitHub Submission

Do not commit sensitive or generated files. At minimum, exclude:

``` text
.env
node_modules/
dist/
```

Use a `.gitignore` file in the repository. Keep real secrets in local
environment files and Vercel environment settings.

## Screenshots for the Project Report

folowing screenshots are included in report :

1.  Project structure in VS Code.
2.  Home page.
3.  Course listing and course detail.
4.  Login and registration.
5.  Student, Instructor, and Admin dashboards.
6.  Backend health-check response.
7.  API testing in Postman or Thunder Client.
8.  Course management and enrollment flow.
9.  Final deployed frontend.
10. Successful frontend-to-backend requests in the browser Network tab.

Do not include passwords, database credentials, private user
information, or unredacted JWT tokens in screenshots.

## Submission Details

-   **Student Name:** Maryam Shaikh
-   **Registration Number:** HM-B3-S2-2026-160233
-   **Subject:** MERN Stack Web Development
-   **Batch:** 3
-   **Project:** LearnHub -- Learning Management System
-   **GitHub Repository:** https://github.com/MaryamShaikh124/learn_hub
-   **Live Deployment Link:**
------------------------------------------------------------------------
