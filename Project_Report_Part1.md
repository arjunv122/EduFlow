# EduFlow – Academic Portal
## Project Report

---

## TABLE OF CONTENTS

| Chapter No. | Title | Page No. |
|-------------|-------|----------|
| | Abstract | 3 |
| 1 | Problem Definition | 4 |
| 2 | Requirements Engineering | 5 |
| 3 | Design Methodology | 8 |
| 4 | Coding Practices and Platforms | 14 |
| 5 | Testing | 16 |
| 6 | Deployment Checklist | 19 |
| 7 | Results | 20 |
| | Appendix (Screenshots) | 21 |

---

## ABSTRACT

Academic institutions today operate across multiple disconnected systems for attendance, assessments, communication, and faculty management, leading to administrative inefficiency and poor data visibility. The EduFlow Academic Portal is a unified, full-stack web application built on the MERN stack (MongoDB, Express.js, React, Node.js) designed to consolidate all core institutional workflows into a single, role-aware platform.

The problem addressed by this project is the absence of an integrated digital solution for managing student lifecycle events—from enrollment and attendance to online assessments with proctoring—within a single institution. EduFlow serves as a centralized academic management system for SRIHER, enabling Administrators, Faculty, and Students to collaborate efficiently with automated credential provisioning, real-time analytics, and secure role-based access control.

---

## CHAPTER 1 – PROBLEM DEFINITION

Academic institutions such as SRIHER rely on fragmented, manual, or paper-based processes to handle critical operations including attendance tracking, quiz administration, faculty substitution, and announcement dissemination, resulting in data inconsistencies, delays, and lack of accountability. The EduFlow project aims to replace these siloed workflows with a unified, web-based academic portal that enforces role-based access control (RBAC) for Superadmin, Admin, Faculty, and Student roles, ensuring each actor interacts only with the data and functions relevant to them. The system must automatically generate institutional email credentials for new students and faculty upon registration, reducing manual onboarding effort and ensuring consistent identity management. Furthermore, assessments delivered through the platform must be proctored—detecting tab switches and enforcing full-screen modes—to uphold academic integrity during online quizzes. The solution must be deployable to a cloud environment (Render for the backend, Vercel for the frontend) with a secured MongoDB Atlas database, ensuring 99%+ availability and sub-second API response times for concurrent institutional users.

---

## CHAPTER 2 – REQUIREMENTS ENGINEERING

### 2.1 Requirements Engineering Life Cycle

The requirements for EduFlow were gathered and refined following a structured lifecycle:

1. **Elicitation** – Stakeholder interviews with faculty coordinators and administrators identified core pain points: manual attendance registers, no online quiz system, and no unified announcement board.
2. **Analysis** – Requirements were analysed for feasibility, conflicts, and prioritization (MoSCoW method).
3. **Specification** – Functional and non-functional requirements were formally documented.
4. **Validation** – Requirements were validated through prototype walkthroughs with end-users.
5. **Management** – A Requirements Traceability Matrix (RTM) was maintained to link each requirement to its implementation module.

---

### 2.2 Functional Requirements

| ID | Requirement | Module |
|----|-------------|--------|
| FR-01 | The system shall allow users to register with role-specific profiles (Student, Faculty, Admin). | Identity |
| FR-02 | The system shall auto-generate institutional email credentials for students and faculty on registration. | Identity / Auth |
| FR-03 | The system shall authenticate users via JWT and enforce session expiry. | Identity |
| FR-04 | Faculty shall be able to mark class attendance manually or via QR code. | Attendance |
| FR-05 | Students shall be able to view their own attendance percentage per course. | Attendance |
| FR-06 | Faculty shall be able to create quizzes with MCQ, True/False, short answer, and essay questions. | Assessment |
| FR-07 | The system shall enforce proctoring (tab-switch detection, full-screen enforcement) during active quizzes. | Assessment |
| FR-08 | The system shall auto-submit a quiz attempt when the tab-switch threshold is exceeded. | Assessment |
| FR-09 | Admin shall be able to manage departments, courses, and class sections. | Academics |
| FR-10 | Faculty shall be able to request leave; the system shall suggest substitutes. | Substitution |
| FR-11 | Admin shall be able to publish announcements visible to all institution users. | Communication |
| FR-12 | The system shall send automated emails for account activation, password reset, and credential delivery. | Notification |
| FR-13 | Superadmin shall be able to register and approve institutions. | Governance |
| FR-14 | Admin shall be able to view real-time dashboard statistics (student count, faculty count, dept count). | Dashboard |

---

### 2.3 Non-Functional Requirements

| ID | Requirement | Category |
|----|-------------|----------|
| NFR-01 | API response time shall not exceed 500 ms under normal load. | Performance |
| NFR-02 | All passwords shall be hashed using bcrypt with a salt factor of 12. | Security |
| NFR-03 | All API endpoints shall be protected with JWT Bearer token authentication. | Security |
| NFR-04 | The frontend shall be fully responsive across desktop and tablet viewports. | Usability |
| NFR-05 | The system shall achieve 99% uptime via cloud deployment (Render + Vercel). | Reliability |
| NFR-06 | The backend shall enforce CORS policies, allowing only whitelisted origins. | Security |
| NFR-07 | All data shall be stored in MongoDB Atlas with field-level validation via Mongoose schemas. | Data Integrity |
| NFR-08 | HTTP security headers shall be enforced via the Helmet middleware. | Security |
| NFR-09 | The system shall support a minimum of 200 concurrent users without degradation. | Scalability |

---

### 2.4 Domain Requirements

| ID | Requirement |
|----|-------------|
| DR-01 | Student institutional emails shall follow the SRIHER format: `e{YY}{COURSE_INDEX}{SEQ}@sret.edu.in`. |
| DR-02 | Faculty approval must be granted by an Admin before login is permitted. |
| DR-03 | Attendance sessions shall be unique per class section, date, and time slot. |
| DR-04 | Quiz total marks shall be auto-calculated from individual question marks on save. |
| DR-05 | Faculty substitution requests are linked to a leave request and a replacement faculty record. |

---

### 2.5 Requirements Traceability Matrix (RTM)

| Req. ID | Description | Design Component | Code Module | Test Case |
|---------|-------------|-----------------|-------------|-----------|
| FR-01 | User Registration | Use Case Diagram | `identity/services/auth.service.js` | TC-01 |
| FR-03 | JWT Authentication | Sequence Diagram | `middleware/auth.middleware.js` | TC-02 |
| FR-04 | Mark Attendance | Activity Diagram | `attendance/controllers` | TC-03 |
| FR-06 | Create Quiz | Class Diagram | `assessment/models/Quiz.js` | TC-04 |
| FR-07 | Proctoring | Activity Diagram | `assessment/models/QuizAttempt.js` | TC-05 |
| FR-11 | Announcements | Component Diagram | `communication/models/Announcement.js` | TC-06 |
| FR-13 | Institution Governance | Deployment Diagram | `governance/routes/governance.router.js` | TC-07 |

---

### 2.6 Hardware Requirements

| Component | Minimum Specification |
|-----------|-----------------------|
| Processor | Intel Core i3 / AMD Ryzen 3 (2.0 GHz or above) |
| RAM | 4 GB (8 GB recommended) |
| Storage | 20 GB free disk space |
| Network | Broadband Internet (10 Mbps or above) |
| Browser | Google Chrome 110+ / Mozilla Firefox 110+ |
| Server (Production) | Render.com Web Service (512 MB RAM, shared CPU) |
| Database (Production) | MongoDB Atlas M0 Free Tier / M10 Dedicated |

---

### 2.7 Software Requirements

| Component | Technology / Version |
|-----------|---------------------|
| Operating System | Windows 10/11, macOS 12+, Ubuntu 20.04+ |
| Runtime Environment | Node.js v18.x or above |
| Package Manager | npm v9.x |
| Frontend Framework | React 19.x (via Vite 5.x) |
| Backend Framework | Express.js 5.x |
| Database | MongoDB 7.x (Mongoose ODM 9.x) |
| Authentication | JSON Web Token (jsonwebtoken 9.x) |
| Password Hashing | bcryptjs 3.x |
| Email Service | Nodemailer 8.x + Gmail SMTP |
| HTTP Security | Helmet 8.x |
| Logging | Morgan 1.x |
| UI Component Library | Lucide-React, Recharts |
| Routing | React Router DOM 7.x |
| State Management | React Context API |
| HTTP Client | Axios 1.x |
| Build Tool | Vite 5.x |
| CSS Framework | TailwindCSS 3.x |
| Code Linting | ESLint 9.x |
| Deployment (Backend) | Render.com |
| Deployment (Frontend) | Vercel |
| Database Hosting | MongoDB Atlas |
| Version Control | Git + GitHub |
