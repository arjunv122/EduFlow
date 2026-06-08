# EduFlow – Project Report (Part 2)
# Chapter 3 – Design Methodology & Chapter 4 – Coding Practices

---

## CHAPTER 3 – DESIGN METHODOLOGY

### 3.1 UML Diagrams

**Aim of the Project:**
To design, model, and document the essential Unified Modeling Language (UML) diagrams—Use Case, Class, Sequence, Activity, Component, and Deployment—for the EduFlow academic portal in order to visualize its system requirements, static structure, dynamic behavior, and physical deployment architecture.

---

#### 3.1.1 Use Case Diagram

**Procedure:**
1. Open StarUML and create a new **Use Case Diagram**.
2. Define the System Boundary labelled "EduFlow Academic Portal".
3. Add actors: **Student**, **Faculty**, **Admin**, **Superadmin**.
4. Add use cases: Login, Register, View Dashboard, Mark Attendance, View Attendance, Create Quiz, Take Quiz, Submit Assignment, Manage Courses, Manage Departments, Publish Announcement, Request Leave, Approve Substitution, Manage Users, Register Institution, Approve Institution.
5. Draw associations between each actor and their permitted use cases.
6. Apply `<<include>>` on Login (included in all authenticated use cases).
7. Apply `<<extend>>` on Proctoring (extends Take Quiz, conditionally).
8. Export the diagram.

**Result:** The Use Case diagram showing all four actors and their interactions with the EduFlow system was successfully created.

---

#### 3.1.2 Class Diagram

**Procedure:**
1. Create a new **Class Diagram** in StarUML.
2. Add the following classes with their attributes and methods:

| Class | Key Attributes | Key Methods |
|-------|---------------|-------------|
| User | name, email, password, role, isActive, isApproved | comparePassword(), changedPasswordAfter() |
| FacultyProfile | facultyId, designation, qualification, department | — |
| StudentProfile | studentId, batchYear, currentSemester, department | — |
| Institution | name, emailDomain, status, stats | — |
| Department | name, code, head, coordinator | — |
| Course | code, name, credits, semester, gradingComponents | — |
| ClassSection | section, classType, faculty, enrolledStudents, schedule | — |
| AttendanceSession | date, method, records[], isSubmitted | — |
| Quiz | title, questions[], duration, proctoring, status | — |
| QuizAttempt | answers[], totalScore, tabSwitchCount, status | — |
| Announcement | title, body, audience, priority | — |
| Substitution | originalFaculty, substituteFaculty, date, status | — |

3. Define relationships:
   - User **1** — **0..1** FacultyProfile (Aggregation)
   - User **1** — **0..1** StudentProfile (Aggregation)
   - Institution **1** — **\*** Department (Composition)
   - Department **1** — **\*** Course (Composition)
   - Course **1** — **\*** ClassSection (Composition)
   - ClassSection **\*** — **\*** User/Student (Association — enrolledStudents)
   - ClassSection **1** — **\*** AttendanceSession (Aggregation)
   - ClassSection **1** — **\*** Quiz (Aggregation)
   - Quiz **1** — **\*** QuizAttempt (Aggregation)

4. Annotate visibility (+public, -private) and multiplicity on all relationships.
5. Export the diagram.

**Result:** The Class diagram illustrating the complete static structure and relationships of the EduFlow data model was successfully created.

---

#### 3.1.3 Sequence Diagram – User Login Flow

**Procedure:**
1. Create a new **Sequence Diagram** in StarUML.
2. Add lifelines: **User (Browser)**, **React Frontend**, **Express API**, **AuthMiddleware**, **AuthService**, **MongoDB**.
3. Draw the following message sequence:
   - User → Frontend: `enterCredentials(email, password)`
   - Frontend → API: `POST /api/auth/login`
   - API → AuthService: `login(email, password)`
   - AuthService → MongoDB: `User.findOne({ email }).select('+password')`
   - MongoDB → AuthService: `userDocument`
   - AuthService → AuthService: `comparePassword()`
   - AuthService → MongoDB: `user.save() [lastLogin update]`
   - AuthService → API: `{ user, token }`
   - API → Frontend: `200 OK { token, user }`
   - Frontend → User: `Redirect to Dashboard`
4. Add an `alt` fragment for invalid credentials returning `401 Unauthorized`.
5. Export the diagram.

**Result:** The Sequence diagram detailing the Login flow with JWT issuance was successfully created.

---

#### 3.1.4 Activity Diagram – Mark Attendance Flow

**Procedure:**
1. Create a new **Activity Diagram** in StarUML.
2. Place an **Initial Node**.
3. Add the following activity sequence:
   - Faculty Opens Attendance Module
   - Select Class Section & Date
   - Choose Method (Manual / QR)
   - **Decision**: Method = QR?
     - [Yes] → Generate QR Code → Students Scan QR → System Records Scans
     - [No] → Faculty Marks Each Student (Present / Absent / Late / Excused)
   - Save Attendance Session
   - **Decision**: isSubmitted?
     - [Yes] → Lock Session (No Further Edits)
     - [No] → Allow Edit Until Submission
   - System Updates AttendanceSession Record in DB
   - Notify Students via Dashboard
4. Place a **Final Node**.
5. Export the diagram.

**Result:** The Activity diagram mapping the attendance marking workflow was successfully created.

---

#### 3.1.5 Component Diagram

**Procedure:**
1. Create a new **Component Diagram** in StarUML.
2. Add the following components:
   - **React SPA** (Frontend)
   - **Vite Build Tool**
   - **React Router**
   - **Axios HTTP Client**
   - **Express.js API Gateway** (Backend)
   - **Auth Middleware** (JWT Verify)
   - **Identity Module** (Auth Service)
   - **Academics Module** (Dept, Course, ClassSection)
   - **Attendance Module**
   - **Assessment Module** (Quiz, QuizAttempt)
   - **Communication Module** (Announcements)
   - **Substitution Module**
   - **Governance Module** (Institution)
   - **MongoDB Atlas** (Database)
   - **Nodemailer / Gmail SMTP** (Email)
3. Draw dependency arrows:
   - React SPA → Express API (via HTTPS REST)
   - Express API → Auth Middleware → each Module
   - Each Module → MongoDB Atlas
   - Identity Module → Nodemailer
4. Use `<<provide>>` and `<<require>>` interfaces where applicable.
5. Export the diagram.

**Result:** The Component diagram visualizing the MERN-stack module architecture of EduFlow was successfully created.

---

#### 3.1.6 Deployment Diagram

**Procedure:**
1. Create a new **Deployment Diagram** in StarUML.
2. Add the following nodes:
   - **Client Device** (Node) — contains: Web Browser artifact (Chrome/Firefox)
   - **Vercel Edge Network** (Node) — contains: React SPA Build (dist/) artifact
   - **Render Web Service** (Node) — contains: Node.js / Express API artifact (src/server.js)
   - **MongoDB Atlas Cluster** (Node) — contains: MongoDB Database artifact
   - **Gmail SMTP Server** (Node) — contains: Email Delivery artifact
3. Draw communication paths:
   - Client Device ↔ Vercel (`<<HTTPS>>`)
   - Client Device ↔ Render API (`<<HTTPS / REST>>`)
   - Render API ↔ MongoDB Atlas (`<<TCP/IP / TLS>>`)
   - Render API ↔ Gmail SMTP (`<<SMTP / TLS Port 587>>`)
4. Annotate environment variables on the Render node (PORT=10000, NODE_ENV=production, JWT_SECRET, MONGODB_URI, SMTP credentials).
5. Export the diagram.

**Result:** The Deployment diagram depicting the physical cloud topology of EduFlow was successfully created.

---

### 3.2 Wireframes

Wireframes for EduFlow were designed using **Figma Community Templates** to prototype the following screens before implementation:

| Screen | Description |
|--------|-------------|
| Landing Page | Hero section, feature highlights, CTA buttons for Login/Register |
| Login Page | Email + Password fields, Forgot Password link |
| Student Registration | Multi-step wizard: Personal Info → Course Selection → Preview Institutional Email |
| Faculty Registration | Personal Info → Department → Designation |
| Student Dashboard | Attendance summary cards, upcoming quizzes, announcements feed |
| Faculty Dashboard | Today's classes, pending attendance sessions, quiz management |
| Admin Dashboard | Real-time stats: student count, faculty count, department count |
| Attendance Marking | Class section selector, student list, status radio buttons |
| Quiz Builder | Question editor with question type toggle, proctoring settings panel |
| Quiz Attempt View | Question navigator, timer countdown, full-screen enforcement UI |

---

### 3.3 ER Diagram

The Entity-Relationship (ER) Diagram was designed using **dbdiagram.io** and maps the following entities and relationships:

```
User ||--o| FacultyProfile : "has"
User ||--o| StudentProfile : "has"
Institution ||--|{ Department : "contains"
Institution ||--|{ User : "belongs to"
Department ||--|{ Course : "offers"
Course ||--|{ ClassSection : "has"
ClassSection }|--|{ User : "enrolledStudents"
ClassSection ||--|{ AttendanceSession : "has"
AttendanceSession ||--|{ AttendanceRecord : "records"
ClassSection ||--|{ Quiz : "has"
Quiz ||--|{ QuizAttempt : "has"
QuizAttempt }|--|| User : "taken by"
User ||--|{ Substitution : "originalFaculty"
User ||--|{ Substitution : "substituteFaculty"
Institution ||--|{ Announcement : "publishes"
```

---

### 3.4 Database Schema

All collections are stored in MongoDB Atlas. Key schema highlights:

**Users Collection:**
- Fields: `name`, `email` (unique), `password` (hashed, bcrypt-12), `role` (enum: superadmin/admin/faculty/student), `institution` (ref), `isActive`, `isApproved`, `department` (ref), `isHOD`, `lastLogin`, `passwordChangedAt`
- Index: email (unique)

**AttendanceSessions Collection:**
- Fields: `institution`, `classSection`, `course`, `faculty`, `date`, `startTime`, `endTime`, `method` (manual/qr/geo/face), `records[]` (embedded), `isSubmitted`
- Index: `{ classSection, date, startTime }` (unique compound)

**Quizzes Collection:**
- Fields: `title`, `questions[]` (embedded — MCQ/TF/Short/Essay/FillBlank), `duration`, `startDateTime`, `endDateTime`, `proctoring{}`, `totalMarks` (auto-calculated), `status`

**QuizAttempts Collection:**
- Fields: `quiz`, `student`, `answers[]`, `totalScore`, `percentage`, `isPassed`, `tabSwitchCount`, `proctorLog[]`, `autoSubmitReason`
- Index: `{ quiz, student }` (unique — one attempt per student)

---

### 3.5 Cohesion & Coupling

| Aspect | EduFlow Implementation |
|--------|----------------------|
| **Cohesion** | **High (Functional Cohesion)** — Each backend module (identity, attendance, assessment, communication, substitution, governance) contains only code related to its own domain. Services, controllers, models, and routes are co-located per module. |
| **Coupling** | **Low (Data Coupling)** — Modules communicate only through well-defined REST API contracts and shared Mongoose ObjectId references. No module directly imports another module's controller or service. Cross-module data access happens through DB references (populate), not direct function calls. |

---

### 3.6 Design Pattern

| Pattern | Usage in EduFlow |
|---------|-----------------|
| **MVC (Model-View-Controller)** | Backend follows strict MVC: Mongoose Models → Service Layer (business logic) → Controllers (request/response) → Routes (URL mapping). |
| **Service Layer Pattern** | Business logic is isolated in `*Service` classes (e.g., `AuthService`, `GovernanceService`), keeping controllers thin. |
| **Middleware Chain** | Express middleware pipeline: Helmet → CORS → Morgan → Routes → Error Handler. Auth middleware (protect, requireRole, requirePermission) is composed per-route. |
| **Repository Pattern (implicit)** | Mongoose models act as repositories. All data access flows through the service layer using Mongoose query methods. |
| **Observer (Event-driven Email)** | Email notifications (activation credentials, password reset) are triggered as side-effects within service methods using Nodemailer. |
| **Strategy Pattern** | Attendance method selection (manual/QR/geo/face) acts as a strategy, with different handling logic per method type. |

---

### 3.7 Architectural Style

EduFlow uses a **Layered (N-Tier) Architecture** combined with a **RESTful API** style:

- **Presentation Layer** — React SPA (Vite) hosted on Vercel. Communicates exclusively via HTTP REST calls to the backend API.
- **Application Layer** — Express.js API Gateway on Render. Routes, middleware, controllers, and service classes reside here.
- **Business Logic Layer** — Service classes per module encapsulate all domain rules (e.g., institutional email generation, proctoring logic, approval workflows).
- **Data Layer** — MongoDB Atlas accessed through Mongoose ODM. Schema validation, indexing, and pre-save hooks enforce data integrity at the database layer.

---

### 3.8 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite | React 19, Vite 5 |
| Styling | TailwindCSS | 3.x |
| State | React Context API | — |
| Routing | React Router DOM | 7.x |
| HTTP Client | Axios | 1.x |
| Charts | Recharts | 3.x |
| Icons | Lucide-React | 1.x |
| Backend | Node.js + Express.js | Node 18, Express 5 |
| Auth | JWT (jsonwebtoken) | 9.x |
| Hashing | bcryptjs | 3.x |
| Database | MongoDB + Mongoose | Mongo 7, Mongoose 9 |
| Email | Nodemailer | 8.x |
| Security | Helmet, CORS | 8.x, 2.x |
| Logging | Morgan | 1.x |
| Deployment | Render (BE) + Vercel (FE) | — |
| DB Hosting | MongoDB Atlas | — |

---

### 3.9 Interface Design

The EduFlow interface follows these design principles:

- **Role-Aware Navigation** — The sidebar and dashboard components conditionally render menu items based on the authenticated user's role (student/faculty/admin/superadmin) using React Context.
- **Responsive Layout** — TailwindCSS grid and flex utilities ensure the layout adapts to desktop, tablet, and mobile viewports.
- **Toast Notifications** — `react-hot-toast` provides real-time success/error feedback for all API interactions.
- **Dark-Themed UI** — The design uses a dark slate color palette with accent blues and purples for a premium, modern feel.
- **Protected Routes** — React Router DOM's nested route protection redirects unauthenticated users to the login page and role-mismatched users to their appropriate dashboard.

---

## CHAPTER 4 – CODING PRACTICES

### 4.1 Code Analyzers

#### 4.1.1 Static Code Analysis – ESLint

EduFlow's frontend codebase is analyzed using **ESLint 9.x** with the following configuration (`eslint.config.js`):

- **`eslint-plugin-react-hooks`** — Enforces rules of hooks (no hooks in conditional blocks, correct dependency arrays in useEffect).
- **`eslint-plugin-react-refresh`** — Ensures only React components are exported from modules to enable Vite's Hot Module Replacement (HMR).
- **`globals`** — Defines browser global variables to prevent false "undefined variable" errors.

**Tool:** [SonarSource / SonarQube](https://www.sonarsource.com) — For enterprise-grade static analysis, SonarQube can be integrated with the GitHub repository to scan for:
- Code smells and duplications
- Security vulnerabilities (e.g., hardcoded secrets, injection risks)
- Reliability bugs (null pointer risks, uncaught promise rejections)
- Maintainability issues (cognitive complexity, function length)

**Sample ESLint output (clean run):**
```
✔ No ESLint warnings or errors found.
   Checked: src/App.jsx, src/pages/**, src/components/**, src/context/**
```

---

#### 4.1.2 Dynamic Code Analysis

Dynamic analysis is performed at runtime using the following techniques:

| Technique | Tool / Method | Purpose |
|-----------|--------------|---------|
| API Response Monitoring | Morgan HTTP logger (dev mode) | Logs every request: method, URL, status code, response time |
| Error Boundary Testing | Manual + React Error Boundaries | Catches unhandled render errors in the UI |
| JWT Expiry Testing | Postman / Insomnia | Verifies token rejection after 7-day expiry |
| Proctoring Event Testing | Browser DevTools (tab-switch simulation) | Validates tab-switch detection and auto-submit logic |
| DB Query Monitoring | MongoDB Atlas Performance Advisor | Identifies slow queries and suggests indexes |
| Load Testing | Postman Collection Runner | Simulates concurrent API requests to verify throughput |

**Morgan Log Sample (Development):**
```
POST /api/auth/login 200 142ms
GET  /api/attendance/sessions 200 87ms
POST /api/assessment/quizzes 201 203ms
GET  /api/users/me 401 12ms
```

---

### 4.2 Key Coding Practices Followed

| Practice | Implementation |
|----------|---------------|
| **Environment Variables** | All secrets (JWT_SECRET, MONGODB_URI, SMTP credentials) are stored in `.env` files, never hardcoded. |
| **Password Hashing** | bcrypt salt factor 12 applied via Mongoose pre-save hook in `User.js`. |
| **Input Validation** | Mongoose schema-level validation (required, minlength, enum, regex match) on all models. |
| **Error Handling** | Centralized `errorHandler` middleware in Express catches all uncaught errors and returns consistent JSON error responses. |
| **Async/Await** | All asynchronous operations use async/await with try/catch blocks throughout service and controller layers. |
| **Token Security** | JWT tokens expire in 7 days (`JWT_EXPIRES_IN=7d`). Token payload only carries `user._id` (minimal surface area). |
| **CORS Policy** | Permissive during development; locked to specific Vercel origin in production. |
| **Helmet** | Cross-Origin Resource Policy, Content Security Policy headers applied to all responses. |
| **Atomic DB Operations** | Student email sequence counter uses MongoDB `$inc` with `findOneAndUpdate` for race-condition-safe increments. |
| **Code Modularization** | Each feature is isolated into its own module folder with controllers, services, models, and routes — no cross-contamination. |
