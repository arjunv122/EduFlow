# Software Design Description (SDD) for EduFlow Academic Portal (SRIHER)

## 3. Conceptual model for software design descriptions

### 3.1 Software design in context
The EduFlow Academic Portal is a design subject created to streamline academic operations at Sri Ramachandra Institute of Higher Education and Research (SRIHER). The design embodies the essential characteristics of an integrated academic management system, fulfilling requirements for attendance tracking, assessment management, faculty substitution, and student governance.

- **Design Subject**: EduFlow Academic Portal (Institutionalized for SRIHER).
- **Core Purpose**: To provide a unified platform for students, faculty, and administrators to manage the academic life cycle.
- **Constraints**: Single-institution scoping, RBAC-based security, and high availability for assessment sessions.

### 3.2 Software design descriptions within the life cycle
The SDD for EduFlow is integrated into the software development life cycle (SDLC), serving as the primary reference for developers, testers, and system administrators.

#### 3.2.1 Influences on SDD preparation
Preparation is driven by:
- **SRIHER Institutional Requirements**: Custom grading systems (CGPA/Letter), specific attendance thresholds (75%).
- **Technical Stack Constraints**: Node.js event-loop considerations for fire-and-forget tasks (e.g., background email alerts).
- **Security Standards**: JWT-based stateless authentication and password hashing (Bcrypt).

#### 3.2.2 Influences on software life cycle products
- **Requirements Specification**: Refined through design discoveries (e.g., proctoring requirements in the Assessment module).
- **Test Documentation**: Informs unit tests for service layers and integration tests for Express routers.
- **Walkthroughs**: Used for peer reviews during the implementation of complex modules like "Smart Substitution."

#### 3.2.3 Design verification and design role in validation
- **Verification**: Conducted via automated linting (ESLint), manual API testing, and code audits.
- **Validation**: Ensures that workflows like "Faculty Substitution" correctly notify relevant stakeholders and maintain timetable integrity.

---

## 4. Design description information content

### 4.1 Introduction
This section defines the exhaustive content of the EduFlow SDD, identifying the concrete entities and attributes that compose the system.

### 4.2 SDD identification
- **Document ID**: SRIHER-EDU-SDD-2025
- **Date of Issue**: 2026-05-06
- **Status**: Production-Ready (Version 1.0.0)
- **Scope**: Comprehensive Academic Management System.
- **Issuing Organization**: SRIHER (Sri Ramachandra Institute of Higher Education and Research).
- **Authorship**: Antigravity AI Engineering Team.
- **References**: IEEE Std 1016-2009, ISO/IEC 12207.
- **Context**: Centralized institutional portal.
- **Design Languages**: JavaScript (ES2022), React 19, Mongoose ODM, Tailwind CSS.
- **Change History**: 
    - v0.1: Initial scaffolding of modules.
    - v1.0: Full implementation of Attendance, Assessment, and Governance.

### 4.3 Design stakeholders and their concerns
1.  **Students**: Real-time access to attendance, quiz results, and institutional announcements.
2.  **Faculty**: Automated attendance marking, proctored quiz creation, and leave/substitution management.
3.  **Admins**: Comprehensive control over user provisioning, academic configuration, and system audit logs.
4.  **SRET IT Support**: Maintainability of the MERN stack, database optimization, and secure deployment.

### 4.4 Design views
The system is partitioned into views governed by specific viewpoints to ensure separation of concerns.

### 4.5 Design viewpoints
Viewpoints define the rules for modeling entities such as "ClassSection" and "AttendanceSession."

### 4.6 Design elements
#### 4.6.1 Design entities
Key entities include:
- **Identity Module**: `User`, `PreApprovedUser`.
- **Academics Module**: `Department`, `Course`, `ClassSection`.
- **Attendance Module**: `AttendanceSession`, `AttendanceRecord`.
- **Assessment Module**: `Quiz`, `Question`, `QuizAttempt`.

#### 4.6.2 Design attributes
##### 4.6.2.1 Name attribute
- `User.email`: Unique identifier for authentication.
- `Course.code`: Institutional identifier for curriculum tracking.
##### 4.6.2.2 Type attribute
- `Mongoose.Schema.Types.ObjectId`: Used for relational linking in MongoDB.
- `React.FC`: Functional component type for UI elements.
##### 4.6.2.3 Purpose attribute
- `Institution.branding`: Customizes the UI for SRIHER (colors, logos).
- `AuditLog.action`: Describes the specific change made (CREATE, UPDATE, DELETE).
##### 4.6.2.4 Author attribute
- Development Team / Module Lead.

#### 4.6.3 Design relationships
- **Reference (ref)**: `AttendanceSession` references `Course` and `Faculty`.
- **Virtuals**: `User` profile virtuals to link to `StudentProfile` or `FacultyProfile`.

#### 4.6.4 Design constraints
- **Unique Scoping**: All academic entities (Departments, Courses) are uniquely indexed by `{ institution, code }`.
- **State Enforcement**: Quizzes transition through states: `draft` -> `published` -> `active` -> `completed`.

### 4.7 Design overlays
- **Security Overlay**: JWT verification in every route except public auth.
- **Performance Overlay**: Database indexing on `institutionId` and `date` for fast query performance.

### 4.8 Design rationale
The **MERN stack** was selected for its unified language (JavaScript), high-performance JSON handling, and the flexibility of Document-based storage for varied academic structures.

### 4.9 Design languages
- **Backend**: Node.js/Express (CommonJS).
- **Frontend**: React/Vite (ES Modules).
- **Documentation**: Markdown, UML (Textual).

---

## 5. Design viewpoints

### 5.1 Introduction
This section provides the technical implementation details for every viewpoint.

### 5.2 Context viewpoint
#### 5.2.1 Design concerns
The system boundary for SRIHER.
#### 5.2.2 Design elements
- **External Systems**: SMTP Server (Email), MongoDB Atlas (Persistence).
- **Human Actors**: Admin (Super/Sub), Faculty, Student.
#### 5.2.3 Example languages
UML Context Diagram.

### 5.3 Composition viewpoint
#### 5.3.1 Design concerns
Structural decomposition of the EduFlow platform.
#### 5.3.2 Design elements
- **Constituents**:
    - `backend/src/modules`: Domain-driven module separation.
    - `frontend/src/pages`: Feature-based routing.
##### 5.3.2.1 Function attribute
- `AttendanceService.initiateSession`: Scaffold a new attendance sheet for a class.
##### 5.3.2.2 Subordinates attribute
- `Identity` module contains `auth.router.js`, `User.js`, and `auth.middleware.js`.
#### 5.3.3 Example languages
UML Component Diagram.

### 5.4 Logical viewpoint
#### 5.4.1 Design concerns
Static structure of domain abstractions.
#### 5.4.2 Design elements
- **Hierarchy**: `Institution` > `Department` > `Course` > `ClassSection`.
- **Associations**: `User` belongs to `Institution`. `StudentProfile` belongs to `User`.
#### 5.4.3 Example languages
UML Class Diagram.

### 5.5 Dependency viewpoint
#### 5.5.1 Design concerns
Inter-module coupling and dependency management.
#### 5.5.2 Design elements
- **Dependencies**:
    - `Assessment` -> `Academics` (for Course selection).
    - `Substitution` -> `Faculty` (for Availability checks).
##### 5.5.2.1 Dependencies attribute
- `AttendanceSession` requires a valid `ClassSectionId` to generate student list.
#### 5.5.3 Example languages
Package Dependency Graphs.

### 5.6 Information viewpoint
#### 5.6.1 Design concerns
Persistent data schemas and metadata.
#### 5.6.2 Design elements
- **User Schema**: `name`, `email`, `password`, `role`, `institution`, `isActive`.
- **Institution Schema**: `branding`, `settings` (timezone, gradingSystem), `features`.
- **Quiz Schema**: `questions` (Array of MCQ/ShortAnswer), `duration`, `proctoring` (settings).
##### 5.6.2.1 Data attribute
- `Quiz.questions[i].options`: Text and `isCorrect` boolean.
#### 5.6.3 Example languages
Mongoose Schema Definitions (JSON/Schema).

### 5.7 Patterns use viewpoint
#### 5.7.1 Design concerns
Architectural patterns used for scalability.
#### 5.7.2 Design elements
- **Service Layer Pattern**: All business logic resides in `*.service.js`.
- **Middleware Pattern**: Authentication and error handling.
#### 5.7.3 Example languages
Architectural Pattern Descriptions.

### 5.8 Interface viewpoint
#### 5.8.1 Design concerns
Definition of the RESTful API contract.
#### 5.8.2 Design elements
- **Auth Interface**: `POST /api/auth/login`, `POST /api/auth/register/student`.
- **Attendance Interface**: `POST /api/attendance/session/initiate`, `PATCH /api/attendance/:id/mark`.
##### 5.8.2.1 Interface attribute
- `req.user.institution`: Injected by `protect` middleware for scoped database access.
#### 5.8.3 Example languages
RESTful Routing Tables.

### 5.9 Structure viewpoint
#### 5.9.1 Design concerns
Internal constituents of UI components.
#### 5.9.2 Design elements
- **MainLayout**: Houses `Navbar`, `Sidebar`, and the main `Content Area`.
- **QuizBuilder**: Composed of `QuestionEditor`, `SettingsPanel`, and `Preview`.
#### 5.9.3 Example languages
UML Structure Diagram.

### 5.10 Interaction viewpoint
#### 5.10.1 Design concerns
Dynamic behavior and object communication flows.
#### 5.10.2 Design elements
- **Flow**: User marks Attendance -> `markAttendance` service updates DB -> Background check fires for low attendance -> `email.util` sends alert.
#### 5.10.3 Examples
Sequence Diagrams for Auth and Quiz submission.

### 5.11 State dynamics viewpoint
#### 5.11.1 Design concerns
Behavior of reactive entities.
#### 5.11.2 Design elements
- **User States**: `PendingApproval` -> `Active` -> `Suspended`.
- **Quiz States**: `Draft` -> `Published` -> `Active` (during start time).
#### 5.11.3 Example languages
UML Statechart.

### 5.12 Algorithm viewpoint
#### 5.12.1 Design concerns
Detailed logic for automated academic processes.
#### 5.12.2 Design elements
- **Attendance Percentage**: `(Total Present / Total Submitted Sessions) * 100`.
- **Quiz Grading**: Iterating through `QuizAttempt.answers` and comparing with `Quiz.questions.correctAnswer`.
##### 5.12.3 Processing attribute
- `_checkLowAttendanceMetrics`: Uses `setImmediate` to perform O(N) alerting logic without blocking the main response thread.
#### 5.12.4 Examples
JavaScript pseudo-code for proctoring detection.

### 5.13 Resource viewpoint
#### 5.13.1 Design concerns
System resource allocation and performance monitoring.
#### 5.13.2 Design elements
- **Database**: MongoDB Atlas (Primary store).
- **Communication**: Brevo/SendGrid (External resource for SMTP).
##### 5.13.2.1 Resources attribute
- `maxUsers`: Enforced by `Institution.subscription.maxUsers` during provisioning.
#### 5.13.3 Examples
Resource usage diagrams.
