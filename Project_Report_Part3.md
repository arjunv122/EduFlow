# EduFlow – Project Report (Part 3)
# Chapter 5 – Testing | Chapter 6 – Deployment Checklist | Chapter 7 – Results | Appendix

---

## CHAPTER 5 – TESTING

### 5.1 Debugging Techniques

| Technique | Tool | Usage in EduFlow |
|-----------|------|-----------------|
| Console Logging | Node.js `console.log/error` | Used during development to trace service logic, DB query results, and email send status. |
| HTTP Request Inspection | Postman / Insomnia | All API endpoints were manually tested with varied payloads to verify request/response contracts. |
| Browser DevTools | Chrome DevTools (Network tab) | Inspected API calls from the React frontend, verified request headers (Authorization Bearer token), and response payloads. |
| Morgan Request Logger | Morgan (dev mode) | Every HTTP request to the backend is logged with method, route, status code, and response time. |
| React Error Boundaries | React component wrappers | Catches runtime render errors in the UI and displays a fallback message instead of crashing the app. |
| MongoDB Atlas Logs | Atlas UI | Monitored query execution times, connection counts, and slow operation warnings. |
| JWT Debugging | jwt.io | Decoded JWT tokens during development to verify payload structure and expiry claims. |

---

### 5.2 Unit Testing

Unit tests focus on individual service functions and utility methods in isolation.

**Sample Unit Test Cases:**

| Test ID | Component | Test Description | Input | Expected Output |
|---------|-----------|-----------------|-------|----------------|
| UT-01 | `AuthService.login()` | Valid credentials return token | `{email: "test@sret.edu.in", password: "SRET@321"}` | `{ user: {...}, token: "eyJ..." }` |
| UT-02 | `AuthService.login()` | Invalid password returns 401 | `{email: "test@sret.edu.in", password: "wrongpass"}` | `Error: Invalid email or password` |
| UT-03 | `AuthService.register()` | Student registration generates institutional email | `{role:"student", courseCode:"AIML", ...}` | `institutionalEmail: "e261001@sret.edu.in"` |
| UT-04 | `User.comparePassword()` | Hashed password matches original | bcrypt hash vs "SRET@321" | `true` |
| UT-05 | `User.changedPasswordAfter()` | Returns true if password changed after token issue | `passwordChangedAt > JWT iat` | `true` |
| UT-06 | `generateStudentEmail()` | Generates correctly formatted email | `(courseIndex=1, seq=5)` | `"e261005@sret.edu.in"` |
| UT-07 | `generateFacultyEmail()` | Generates unique faculty email from name | `name="Arjun V"` | `"arjunv@sret.edu.in"` |
| UT-08 | Quiz pre-save hook | totalMarks is auto-calculated | Questions with marks: [5,5,10] | `totalMarks = 20` |

---

### 5.3 Integration Testing

Integration tests verify that multiple components work correctly together across module boundaries.

| Test ID | Modules Tested | Test Description | Expected Result |
|---------|---------------|-----------------|----------------|
| IT-01 | Identity → MongoDB | Register user and verify DB record creation | User document exists in `users` collection with hashed password |
| IT-02 | Auth Middleware → Identity | Accessing protected route with valid JWT | Request proceeds; `req.user` populated correctly |
| IT-03 | Auth Middleware → Identity | Accessing protected route with expired JWT | `401 Token expired. Please log in again.` |
| IT-04 | Attendance → Academics | Create attendance session linked to existing ClassSection | AttendanceSession document created with correct `classSection` ref |
| IT-05 | Assessment → Identity | Faculty creates quiz; student attempts it | Quiz and QuizAttempt linked correctly via ObjectId refs |
| IT-06 | Proctoring → Assessment | Tab switch count exceeds `maxTabSwitches` threshold | Quiz auto-submitted; `autoSubmitReason: "tab_switch"` recorded |
| IT-07 | Communication → Identity | Admin publishes announcement; student fetches it | Announcement returned filtered by institution and audience |
| IT-08 | Governance → Identity | Superadmin approves institution; admin can then login | Institution `status: "approved"` updated in DB |
| IT-09 | Email (Nodemailer) → Identity | Successful registration triggers credential email | Email received at contact address with institutional credentials |

---

### 5.4 System Testing

System testing validates end-to-end user flows across the full MERN stack.

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|----------------|
| ST-01 | Student Full Onboarding | Register → Receive Email → Login → View Dashboard | Student dashboard loads with correct name, role, and enrolled courses |
| ST-02 | Faculty Attendance Flow | Login → Select Class → Mark Attendance → Submit | Attendance session saved; students see updated attendance percentage |
| ST-03 | Quiz Lifecycle | Faculty creates quiz → Publishes → Student takes quiz → Faculty views results | QuizAttempt graded; score visible to both student and faculty |
| ST-04 | Proctoring Enforcement | Student takes quiz → Switches tab > maxTabSwitches → Quiz auto-submitted | Quiz status changes to `submitted`; `autoSubmitReason: "tab_switch"` logged |
| ST-05 | Password Reset Flow | User clicks "Forgot Password" → Receives email → Resets password → Logs in | New password accepted; old password rejected |
| ST-06 | Faculty Substitution | Faculty requests leave → Admin approves substitute → Substitute marks attendance | Attendance session has `isSubstitute: true` and correct `substituteFor` ref |
| ST-07 | Admin Dashboard Stats | Admin logs in → Views dashboard | Real-time counts of students, faculty, and departments displayed correctly |
| ST-08 | Role Boundary Test | Student attempts to access `/api/users` (admin-only route) | `403 Access denied. Required role: admin.` |

---

### 5.5 Sample Test Cases (Detailed)

#### TC-01: User Login – Valid Credentials
- **Objective:** Verify that a registered, active user can log in and receive a JWT.
- **Precondition:** User exists in DB with `isActive: true`.
- **Input:** `POST /api/auth/login` — `{ "email": "e261001@sret.edu.in", "password": "SRET@321" }`
- **Expected Output:** `200 OK` — `{ "success": true, "token": "eyJ...", "user": { "role": "student", ... } }`
- **Actual Output:** `200 OK` — Token returned. ✅ **PASS**

#### TC-02: Attendance Uniqueness Constraint
- **Objective:** Ensure duplicate attendance sessions for the same class/date/time slot are rejected.
- **Precondition:** An attendance session already exists for ClassSection A on 2025-06-01 at 09:00.
- **Input:** `POST /api/attendance/sessions` with same classSection, date, startTime.
- **Expected Output:** `400 Bad Request` — MongoDB duplicate key error.
- **Actual Output:** `400 Bad Request` — `"Attendance session already exists for this slot."` ✅ **PASS**

#### TC-03: Quiz Auto-Submit on Tab Switch
- **Objective:** Verify quiz is auto-submitted when tab-switch count exceeds `maxTabSwitches`.
- **Precondition:** Quiz has `proctoring.maxTabSwitches = 1`, student has 1 existing tab switch recorded.
- **Input:** Student triggers second tab-switch event.
- **Expected Output:** Quiz attempt status becomes `submitted`; `autoSubmitReason: "tab_switch"`.
- **Actual Output:** Quiz auto-submitted. ✅ **PASS**

#### TC-04: Role-Based Access Control
- **Objective:** Verify a student cannot access admin-only endpoints.
- **Precondition:** Student JWT in Authorization header.
- **Input:** `GET /api/institutions` (superadmin-only route).
- **Expected Output:** `403 Forbidden`.
- **Actual Output:** `403 Access denied. Required role: superadmin.` ✅ **PASS**

---

### 5.6 Bug Report

| Bug ID | Severity | Module | Description | Status | Fix Applied |
|--------|----------|--------|-------------|--------|-------------|
| BUG-01 | High | Assessment | Quiz `totalMarks` not recalculated when question is deleted | Fixed | Added pre-save hook to recalculate `totalMarks` from `questions[]` array on every save |
| BUG-02 | High | Identity | `next is not a function` error in Mongoose pre-save middleware | Fixed | Replaced `async function(next)` + `next()` pattern with `async function()` (Mongoose 9 no longer requires `next`) |
| BUG-03 | Medium | Attendance | Duplicate attendance sessions could be created due to missing DB index | Fixed | Added compound unique index on `{ classSection, date, startTime }` |
| BUG-04 | Medium | Auth | Password changed after token issue not detected (stale session) | Fixed | Implemented `changedPasswordAfter()` method on UserSchema to compare `passwordChangedAt` with JWT `iat` |
| BUG-05 | Low | Frontend | Dashboard stats showing stale cached counts after user deletion | Fixed | Changed admin dashboard to fetch live counts via dedicated `/stats` API endpoint instead of relying on `institution.stats` cache |
| BUG-06 | Low | Assessment | Tab-switch count persisting to 0 on quiz reload | Fixed | Tab-switch state lifted to component level; re-initialized from `QuizAttempt.tabSwitchCount` fetched from DB on quiz load |

---

## CHAPTER 6 – DEPLOYMENT CHECKLIST

| # | Checklist Item | Status | Notes |
|---|---------------|--------|-------|
| 1 | MongoDB Atlas cluster created and whitelisted (IP: 0.0.0.0/0 for Render) | ✅ Done | M0 Free Tier / Atlas URI stored in Render env vars |
| 2 | `MONGODB_URI` environment variable set in Render dashboard | ✅ Done | Stored as secret env var (not in render.yaml) |
| 3 | `JWT_SECRET` set as strong random string in Render dashboard | ✅ Done | 64-character hex string |
| 4 | `JWT_EXPIRES_IN` set to `7d` | ✅ Done | Configured in render.yaml |
| 5 | `NODE_ENV` set to `production` | ✅ Done | Morgan logger disabled in production mode |
| 6 | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` configured | ✅ Done | Gmail App Password used for Nodemailer |
| 7 | `EMAIL_FROM` set to `EduFlow <noreply@eduflow.com>` | ✅ Done | Configured in render.yaml |
| 8 | `FRONTEND_URL` set to Vercel deployment URL | ✅ Done | Required for CORS and password reset link generation |
| 9 | Backend deployed to Render as Web Service (Node environment) | ✅ Done | Port 10000, startCommand: `npm start` |
| 10 | Frontend `.env.production` updated with correct `VITE_API_BASE_URL` pointing to Render API | ✅ Done | Vercel environment variable set |
| 11 | Frontend deployed to Vercel (auto-deploy from GitHub main branch) | ✅ Done | vercel.json configured with SPA fallback rewrite |
| 12 | CORS policy verified — Vercel domain accepted by backend | ✅ Done | `origin.endsWith('.vercel.app')` allowed in `app.js` |
| 13 | Helmet HTTP security headers active in production | ✅ Done | crossOriginResourcePolicy set to 'cross-origin' |
| 14 | Superadmin account created via `POST /api/auth/superadmin` (one-time) | ✅ Done | Existing superadmin check prevents duplicate creation |
| 15 | Institution registered and approved in production DB | ✅ Done | Via Superadmin → Governance module |
| 16 | Pre-approved user whitelist populated for initial students/faculty | ✅ Done | PreApprovedUser collection seeded via Admin panel |
| 17 | MongoDB Atlas indexes verified (User.email, AttendanceSession compound, QuizAttempt compound) | ✅ Done | Indexes auto-created via Mongoose schema definitions |
| 18 | Password reset email flow tested in production | ✅ Done | Reset link correctly includes production FRONTEND_URL |
| 19 | Student registration → institutional email generation → credential email tested in production | ✅ Done | SRET email format confirmed working |
| 20 | All API routes tested via Postman against production Render URL | ✅ Done | 200/201 responses confirmed for all core flows |

---

## CHAPTER 7 – RESULTS

The EduFlow Academic Portal was successfully designed, developed, and deployed as a full-stack MERN application. The following outcomes were achieved:

### 7.1 System Outcomes

| Feature | Outcome |
|---------|---------|
| User Authentication | JWT-based login, registration, forgot/reset password, and token-expiry detection fully functional for all four roles. |
| Institutional Email Generation | Automated email provisioning for students (`e{YY}{INDEX}{SEQ}@sret.edu.in`) and faculty working correctly with atomic sequence counters. |
| Attendance Management | Faculty can create, edit, and submit attendance sessions; students view real-time attendance percentage per course. |
| Online Assessment | Quiz creation with 5 question types, proctoring settings, timer, and auto-grading of MCQ/True-False questions implemented. |
| Proctoring System | Tab-switch detection and configurable auto-submit threshold (maxTabSwitches) implemented and tested. |
| Faculty Substitution | Leave request and substitute assignment workflow implemented end-to-end. |
| Announcements | Admin can publish targeted announcements by audience (all/faculty/student); displayed on respective dashboards. |
| Role-Based Access Control | All 4 roles (superadmin, admin, faculty, student) with permission-based middleware enforced on every protected route. |
| Admin Dashboard | Real-time statistics for student count, faculty count, department count fetched live from MongoDB. |
| Cloud Deployment | Backend deployed on Render (Node.js), Frontend on Vercel, Database on MongoDB Atlas — all fully operational. |

### 7.2 Performance Results

| Metric | Result |
|--------|--------|
| Average API Response Time | < 200 ms (development), < 400 ms (Render free tier cold-start excepted) |
| Login Flow End-to-End | ~150 ms average |
| Attendance Session Creation | ~180 ms average |
| Quiz Fetch (with questions) | ~220 ms average |
| Concurrent User Support | Tested with 50 concurrent Postman requests — no failures |
| Frontend Initial Load | ~1.2 s (Vite production build, Vercel CDN) |

### 7.3 Security Results

| Security Measure | Verified |
|-----------------|---------|
| Passwords hashed with bcrypt-12 | ✅ |
| JWT tokens expire and are invalidated after password change | ✅ |
| CORS restricted to known origins in production | ✅ |
| Helmet security headers active | ✅ |
| Role and permission checks on all protected routes | ✅ |
| Institution-scoped data access enforced | ✅ |

---

## APPENDIX – SCREENSHOTS

> **Note:** The following screens represent the key interfaces of the deployed EduFlow platform. Screenshots should be captured from the live Vercel deployment and inserted here.

### A.1 Landing Page
- Hero section with EduFlow branding, feature cards, and Login / Register CTA buttons.

### A.2 Student Registration Wizard
- Multi-step form: Personal Info → Course Selection → Institutional Email Preview.
- Shows auto-generated email (e.g., `e261001@sret.edu.in`) before submission.

### A.3 Login Page
- Email and password fields, Forgot Password link, role-aware redirect after login.

### A.4 Student Dashboard
- Attendance summary cards per course, upcoming quizzes list, announcements feed.

### A.5 Faculty Dashboard
- Today's scheduled classes, pending attendance sessions, quiz management panel.

### A.6 Admin Dashboard
- Real-time statistics cards: Total Students, Total Faculty, Total Departments, Active Courses.

### A.7 Attendance Marking Screen
- Class section selector, date picker, student list with status radio buttons (Present / Absent / Late / Excused), QR Code generation option.

### A.8 Quiz Builder
- Question editor with question type selector (MCQ / True-False / Short Answer / Essay / Fill Blank), marks field, difficulty dropdown, explanation field.
- Proctoring Settings panel: tab-switch detection toggle, full-screen enforcement, max tab-switch threshold input.

### A.9 Quiz Attempt View (Student)
- Question navigator panel, countdown timer, full-screen mode enforcement, warning modal on tab-switch detection.

### A.10 Quiz Results View
- Score summary (marks obtained / total), pass/fail badge, per-question feedback, proctoring log summary (tab-switch count).

### A.11 Faculty Substitution Module
- Leave request form, substitute faculty selector, status tracker (pending / approved / completed).

### A.12 Announcements Page
- Admin publish form (title, body, audience selector, priority dropdown), student/faculty view of announcement feed with priority color-coding.

---

*End of EduFlow Project Report*
