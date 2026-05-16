# Project Management Platform - Complete Technical Documentation

## Table of Contents
1. [Project Overview and Technology Stack](#1-project-overview-and-technology-stack)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Backend Architecture Deep Dive](#3-backend-architecture-deep-dive)
4. [Frontend Architecture Deep Dive](#4-frontend-architecture-deep-dive)
5. [Database Design and Relationships](#5-database-design-and-relationships)
6. [Authentication and Authorization](#6-authentication-and-authorization)
7. [Request Lifecycle and Data Flow](#7-request-lifecycle-and-data-flow)
8. [Key Features Implementation Details](#8-key-features-implementation-details)
9. [Important Software Engineering Concepts](#9-important-software-engineering-concepts)

---

## 1. Project Overview and Technology Stack

### 1.1 What is this Project?

This is a full-stack Project Management Platform that enables teams to collaborate on projects, manage tasks, track progress, and handle user roles and permissions. The system is built as a modern web application with a React frontend and Spring Boot backend, connected to a PostgreSQL database.

### 1.2 Technology Stack

#### Backend Technologies:
- **Java 17**: The programming language used for the backend. Java 17 is a Long-Term Support (LTS) version that provides modern features like records, pattern matching, and sealed classes.
- **Spring Boot 3.2.0**: A framework that simplifies building production-ready Spring applications. It provides auto-configuration, embedded server support, and opinionated defaults.
- **Spring Security**: The security framework that handles authentication and authorization. It integrates with Spring Boot to provide filter-based security.
- **Spring Data JPA**: Part of the Spring Data family, it simplifies database access by providing repository abstractions on top of JPA/Hibernate.
- **Hibernate**: The Object-Relational Mapping (ORM) framework that maps Java objects to database tables. It handles the translation between object-oriented code and relational database schemas.
- **PostgreSQL**: The production database. It's a powerful, open-source relational database known for reliability and feature set.
- **H2 Database**: An in-memory database used for testing. It allows running tests without setting up an external database.
- **Maven**: The build tool that manages dependencies and builds the project.

#### Frontend Technologies:
- **React 18.3**: A JavaScript library for building user interfaces. React uses a component-based architecture and virtual DOM for efficient rendering.
- **TypeScript**: A typed superset of JavaScript that provides compile-time type checking. It helps catch errors early and improves code maintainability.
- **Vite**: A modern build tool that provides fast development server and optimized production builds.
- **React Router v7**: The routing library for React that handles navigation between pages.
- **Tailwind CSS 4.1**: A utility-first CSS framework that provides pre-built classes for styling. It enables rapid UI development.
- **Radix UI**: A collection of unstyled, accessible UI components that serve as building blocks for the interface.
- **Recharts**: A charting library for React that provides responsive charts for data visualization.
- **Lucide React**: A collection of icons for React applications.
- **React Hook Form**: A library for managing form state and validation.
- **Sonner**: A toast notification library for React.

### 1.3 Why These Technologies?

The technology choices were made based on several factors:

1. **Spring Boot**: Provides rapid development with minimal configuration. It has excellent integration with Spring Security and Spring Data, making it ideal for building REST APIs.

2. **React + TypeScript**: TypeScript adds type safety to JavaScript, which is crucial for large applications. React's component-based architecture makes code reusable and maintainable.

3. **PostgreSQL**: A robust, enterprise-grade database that handles complex queries well. It supports JSON data types, full-text search, and has excellent concurrency handling.

4. **Tailwind CSS**: Enables rapid UI development with utility classes. It allows for consistent styling without writing custom CSS files.

5. **Radix UI**: Provides accessible, unstyled components that can be customized with Tailwind. This gives full control over the UI while maintaining accessibility.

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture

The project follows a client-server architecture with three main layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │ Components  │  │    State Management    │  │
│  │             │  │             │  │  (Context + Hooks)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (JSON)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Spring Boot)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Controllers│  │  Services   │  │     Repositories       │  │
│  │   (REST)   │  │ (Business)  │  │   (Data Access)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ JPA/Hibernate
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Users    │  │  Projects   │  │        Tasks           │  │
│  │   Teams     │  │ Memberships │  │      Milestones        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Communication Flow

1. **Frontend to Backend**: The frontend makes HTTP requests (GET, POST, PUT, DELETE) to the backend REST API. Requests are made using the fetch API with JSON data.

2. **Backend Processing**: The backend receives requests, processes them through controllers, services, and repositories, and returns JSON responses.

3. **Database Interaction**: The backend uses JPA/Hibernate to interact with the PostgreSQL database. Hibernate translates Java method calls into SQL queries.

### 2.3 Key Architectural Principles

1. **Layered Architecture**: The backend is organized into distinct layers (Controller → Service → Repository), each with specific responsibilities.

2. **RESTful Design**: The API follows REST principles with proper HTTP methods, status codes, and resource-based URLs.

3. **Stateless Authentication**: The system uses token-based authentication where each request contains the authentication token. No server-side session storage.

4. **Separation of Concerns**: Frontend and backend are completely separate applications that communicate via HTTP.

---

## 3. Backend Architecture Deep Dive

### 3.1 Package Structure

The backend code is organized in the following package structure:

```
com.projectmanagement/
├── controller/      # REST API endpoints
├── service/        # Business logic
├── repository/     # Data access
├── model/          # Entity classes
├── config/         # Configuration classes
├── security/       # Security-related code
└── exception/      # Exception handling
```

### 3.2 Controllers

Controllers handle incoming HTTP requests and return HTTP responses. They are the entry point for the API.

#### ApiController.java

This is the main controller that handles all API endpoints. It delegates business logic to the AppService.

**Key Endpoints:**

1. **Authentication Endpoints:**
   - `POST /api/auth/register`: Creates a new user account
   - `POST /api/auth/login`: Authenticates user and returns token
   - `POST /api/auth/logout`: Invalidates the current token

2. **User Endpoints:**
   - `GET /api/users`: Returns all users (admin only)
   - `GET /api/users/me`: Returns the currently authenticated user
   - `GET /api/users/in-projects`: Returns users who share projects with current user

3. **Project Endpoints:**
   - `GET /api/projects`: Returns projects the current user is a member of
   - `POST /api/projects`: Creates a new project
   - `GET /api/projects/{id}`: Returns a specific project
   - `PUT /api/projects/{id}`: Updates a project
   - `DELETE /api/projects/{id}`: Deletes a project

4. **Project Membership Endpoints:**
   - `GET /api/projects/{projectId}/members`: Returns members of a project
   - `PUT /api/projects/{projectId}/members/{userId}`: Updates a member's role
   - `DELETE /api/projects/{projectId}/members/{userId}`: Removes a member

5. **Invite Endpoints:**
   - `POST /api/projects/{projectId}/invites`: Creates an invite link
   - `GET /api/projects/{projectId}/invites`: Returns all invites for a project
   - `GET /api/invites/{token}`: Returns invite details (public endpoint)
   - `POST /api/invites/{token}/accept`: Accepts an invite

6. **Task Endpoints:**
   - `GET /api/tasks`: Returns all tasks for the current user
   - `POST /api/tasks`: Creates a new task
   - `PUT /api/tasks/{id}`: Updates a task
   - `DELETE /api/tasks/{id}`: Deletes a task

7. **Milestone Endpoints:**
   - `GET /api/projects/{projectId}/milestones`: Returns milestones for a project
   - `POST /api/projects/{projectId}/milestones`: Creates a milestone
   - `PUT /api/projects/{projectId}/milestones/{id}`: Updates a milestone
   - `DELETE /api/projects/{projectId}/milestones/{id}`: Deletes a milestone

8. **Activity Endpoints:**
   - `GET /api/activities`: Returns activity feed
   - `POST /api/activities`: Records a new activity

### 3.3 Services

The Service layer contains the business logic of the application. It acts as an intermediary between controllers and repositories.

#### AppService.java

This is the main service class that handles all business operations.

**Key Methods:**

1. **Authentication Methods:**
   - `register(Map<String, String> body)`: Creates a new user with encrypted password
   - `login(Map<String, String> body)`: Validates credentials and generates token
   - `logout(String token)`: Removes token from token store

2. **User Methods:**
   - `getUsers()`: Returns all users
   - `getUser(Long id)`: Returns a specific user
   - `getCurrentUser(Long actorId)`: Returns the authenticated user
   - `getUsersInMyProjects(Long actorId)`: Returns users who share projects with current user

3. **Project Methods:**
   - `getProjects(Long actorId)`: Returns projects the user is a member of
   - `createProject(Project p, Long actorId)`: Creates a new project and makes creator owner
   - `updateProject(Project p, Long actorId)`: Updates a project
   - `deleteProject(Long id, Long actorId)`: Deletes a project with cascade delete

4. **Authorization Methods:**
   - `requireProjectMember(Long projectId, Long actorId)`: Throws exception if user is not a member
   - `requireProjectOwner(Long projectId, Long actorId)`: Throws exception if user is not the owner

5. **Membership Methods:**
   - `getProjectMembers(Long projectId, Long actorId)`: Returns all members of a project
   - `updateProjectMemberRole(Long projectId, Long userId, Role role, Long actorId)`: Updates member role
   - `removeProjectMember(Long projectId, Long userId, Long actorId)`: Removes a member

6. **Invite Methods:**
   - `createProjectInvite(Long projectId, Map<String, Number> body, Long actorId)`: Creates invite with token
   - `acceptProjectInvite(String token, Long actorId)`: Accepts invite and creates membership

7. **Task Methods:**
   - `getTasks(Long actorId)`: Returns tasks from user's projects
   - `createTask(Task t, Long projectId, Long assigneeId, Long actorId)`: Creates a task
   - `updateTaskStatus(Long id, String status, Long actorId)`: Updates task status

8. **Activity Methods:**
   - `getActivities(Long actorId, Integer limit)`: Returns activities for the user
   - `createActivity(Long actorId, String type, String title, String message, String targetPath)`: Records activity

### 3.4 Repositories

Repositories handle data access and provide methods for querying the database. They are interfaces that extend JpaRepository.

#### Key Repositories:

1. **UserRepository:**
   - `findByEmail(String email)`: Finds user by email
   - `existsByEmail(String email)`: Checks if email exists

2. **ProjectRepository:**
   - `findByTeamId(Long teamId)`: Finds projects by team

3. **ProjectMembershipRepository:**
   - `findByProjectIdAndUserId(Long projectId, Long userId)`: Finds membership by project and user
   - `findByProjectId(Long projectId)`: Finds all memberships for a project
   - `findByUserId(Long userId)`: Finds all memberships for a user

4. **ProjectInviteRepository:**
   - `findByToken(String token)`: Finds invite by token
   - `findByProjectIdOrderByCreatedAtDesc(Long projectId)`: Finds invites for a project

5. **TaskRepository:**
   - `findByProjectId(Long projectId)`: Finds tasks by project
   - `findByAssigneeId(Long userId)`: Finds tasks assigned to user
   - `findByDeadlineBeforeAndStatusNot(LocalDate date, Task.Status status)`: Finds overdue tasks

### 3.5 Security Configuration

The security is implemented using Spring Security with a custom filter.

#### SecurityFilter.java (AuthFilter)

This filter intercepts every request and performs authentication:

1. **Token Extraction**: Extracts the Bearer token from the Authorization header
2. **Token Validation**: Checks if the token exists in the token store
3. **User Authentication**: If valid, sets the user principal in the Security Context
4. **Authorization**: Adds ROLE_USER authority to authenticated users

#### Security Configuration:

- **Public Endpoints**: `/api/auth/**`, `/api/invites/{token}`
- **Authenticated Endpoints**: All other endpoints require valid token
- **CORS Configuration**: Allows requests from `http://localhost:5173` and `http://localhost:3000`

### 3.6 Data Flow in Backend

When a request arrives at the backend, it goes through the following steps:

```
1. HTTP Request arrives at Controller
         │
         ▼
2. Controller validates input and calls Service
         │
         ▼
3. Service performs business logic:
   - Validates permissions
   - Processes data
   - Calls Repository if needed
         │
         ▼
4. Repository interacts with Database via JPA/Hibernate
         │
         ▼
5. Database returns data to Repository
         │
         ▼
6. Repository returns data to Service
         │
         ▼
7. Service processes data and returns to Controller
         │
         ▼
8. Controller creates HTTP Response with JSON
         │
         ▼
9. Response sent back to Frontend
```

---

## 4. Frontend Architecture Deep Dive

### 4.1 Project Structure

```
src/
├── main.tsx                 # Entry point
├── app/
│   ├── App.tsx             # Root component
│   ├── routes.tsx          # Route definitions
│   ├── api/
│   │   ├── client.ts       # API client with fetch wrapper
│   │   └── useApi.ts       # React hooks for data fetching
│   ├── context/
│   │   └── AuthContext.tsx # Authentication context
│   ├── pages/              # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   └── ... (14 pages total)
│   ├── components/         # Reusable components
│   │   ├── Layout.tsx      # Main layout with sidebar
│   │   └── ui/            # UI components (Radix + Tailwind)
│   └── types/
│       └── frontend.ts     # TypeScript type definitions
└── styles/                 # CSS files
```

### 4.2 API Client (client.ts)

The API client is a wrapper around the fetch API that handles all HTTP communication with the backend.

#### Key Functions:

1. **request<T>(path, options)**: Generic request function
   - Adds Content-Type header
   - Adds Authorization header with Bearer token
   - Handles 401 responses (clears token, notifies auth expired)
   - Returns parsed JSON response

2. **api object**: Contains all API endpoints
   - `auth`: login, register, me
   - `users`: get all users
   - `usersInMyProjects`: get users in current user's projects
   - `projects`: CRUD operations
   - `projectMembers`: member management
   - `projectInvites`: invite management
   - `tasks`: CRUD operations
   - `milestones`: CRUD operations
   - `activities`: activity feed

#### Token Management:

- `getToken()`: Retrieves token from localStorage
- `setToken(token)`: Stores token in localStorage
- `clearToken()`: Removes token from localStorage
- `storeUser(user)`: Stores user info in localStorage
- `getStoredUser()`: Retrieves stored user info

### 4.3 React Hooks (useApi.ts)

The hooks provide a way to fetch and manage data in React components.

#### Key Hooks:

1. **useProjects()**: Fetches all projects the current user is a member of
2. **useProject(id)**: Fetches a specific project
3. **useTasks(projectId?)**: Fetches tasks, optionally filtered by project
4. **useUsers()**: Fetches all users
5. **useUsersInMyProjects()**: Fetches users who share projects with current user
6. **useProjectMembers(projectId)**: Fetches members of a project
7. **useMilestones(projectId)**: Fetches milestones for a project
8. **useActivities(limit?)**: Fetches activity feed
9. **useTeams()**: Fetches all teams
10. **useNotifications()**: Fetches user notifications

#### Hook Structure:

Each hook follows a similar pattern:
```typescript
export function useProjects() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = () => {
    setLoading(true);
    return api.projects()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void loadData();
  }, []);

  return { projects: data, loading, error, refresh: loadData };
}
```

### 4.4 Authentication Context (AuthContext.tsx)

The AuthContext provides authentication state and methods to all components.

#### Context Values:

- `user`: Current authenticated user object
- `login(email, password)`: Function to authenticate user
- `register(name, email, password)`: Function to create new user
- `logout()`: Function to sign out user
- `isAuthenticated`: Boolean indicating if user is logged in
- `loading`: Boolean indicating if auth state is being loaded

#### Authentication Flow:

1. **App Mount**: AuthProvider checks for token in localStorage
2. **Token Present**: Calls `/api/users/me` to validate token and get user info
3. **Token Invalid**: Clears storage and sets user to null
4. **Login**: Calls `/api/auth/login`, stores token and user in localStorage
5. **Logout**: Clears localStorage and sets user to null

### 4.5 Routing (routes.tsx)

The routing configuration defines all application routes and their access control.

#### Route Structure:

```typescript
// Public routes
/login
/register
/invite/:token

// Protected routes (require authentication)
/dashboard
/projects
/projects/:id
/projects/:id/milestones/:id
/users
/roles
/reports
/progress
/notifications
/activities
/settings

// Catch-all
* → /dashboard
```

#### Route Protection:

Routes are protected by checking the authentication state. If not authenticated, the user is redirected to `/login`.

### 4.6 Pages

The application has 14 main pages:

1. **LoginPage**: Email/password authentication form
2. **RegisterPage**: New user registration form
3. **DashboardPage**: Overview with stats, activity feed, progress charts
4. **ProjectsPage**: List of all projects with search/filter
5. **ProjectDetailPage**: Kanban board, task management, milestones
6. **MilestoneDetailPage**: Milestone details and task assignment
7. **UsersPage**: User management with project filtering
8. **RolesPage**: Role management for projects
9. **ReportsPage**: Charts and data visualization
10. **ProgressPage**: Progress tracking across projects
11. **NotificationsPage**: Activity and notification feed
12. **SettingsPage**: User profile and preferences
13. **InviteAcceptPage**: Accept project invite
14. **TasksDueSoonPage**: Tasks due soon filtered view

### 4.7 State Management

The application uses a combination of:

1. **React Context**: For global authentication state (AuthContext)
2. **React Hooks**: For component-level state and data fetching
3. **localStorage**: For persisting authentication token and user info

This approach is simpler than Redux or other state management libraries but sufficient for the application's needs.

---

## 5. Database Design and Relationships

### 5.1 Entity Overview

The database consists of 11 main tables (entities):

1. **users**: System users
2. **teams**: Team groupings
3. **projects**: Project entities
4. **project_memberships**: User-project relationships with roles
5. **project_invites**: Invite links for projects
6. **tasks**: Task items
7. **milestones**: Project milestones
8. **comments**: Task comments
9. **notifications**: User notifications
10. **work_logs**: Time tracking
11. **attachments**: File attachments

### 5.2 Entity Relationships

#### User Entity
- One user can belong to many teams (Many-to-Many)
- One user can have many project memberships (One-to-Many)
- One user can create many projects (One-to-Many)
- One user can be assigned many tasks (One-to-Many)
- One user can create many comments (One-to-Many)
- One user can have many notifications (One-to-Many)

#### Team Entity
- One team can have many projects (One-to-Many)
- One team can have many users (Many-to-Many)

#### Project Entity
- Belongs to one team (Many-to-One)
- Can have many memberships (One-to-Many)
- Can have many invites (One-to-Many)
- Can have many tasks (One-to-Many)
- Can have many milestones (One-to-Many)

#### ProjectMembership Entity
- Links users to projects with roles (OWNER/MEMBER)
- Unique constraint on (project_id, user_id) to prevent duplicate memberships

#### ProjectInvite Entity
- Links to a project (Many-to-One)
- Created by a user (Many-to-One)
- Has unique token for URL

#### Task Entity
- Belongs to a project (Many-to-One)
- Can belong to a milestone (Many-to-One)
- Can be assigned to a user (Many-to-One)
- Can have many comments (One-to-Many)
- Can have many work logs (One-to-Many)
- Can have many attachments (One-to-Many)

#### Milestone Entity
- Belongs to a project (Many-to-One)
- Can have many tasks (One-to-Many)

### 5.3 Database Schema Details

#### users table
- id: Primary key (BIGINT)
- name: User's full name (VARCHAR)
- email: Unique email address (VARCHAR)
- password: BCrypt encrypted password (VARCHAR)
- role: User role (ADMIN, PROJECT_MANAGER, TEAM_MEMBER, VIEWER, QA, DEVELOPER)
- avatar: URL to avatar image (VARCHAR, nullable)
- created_at: Timestamp

#### teams table
- id: Primary key (BIGINT)
- name: Team name (VARCHAR)
- department: Department (VARCHAR, nullable)

#### projects table
- id: Primary key (BIGINT)
- name: Project name (VARCHAR)
- description: Project description (TEXT, nullable)
- start_date: Start date (DATE, nullable)
- end_date: End date (DATE, nullable)
- team_id: Foreign key to teams (BIGINT, nullable)

#### project_memberships table
- id: Primary key (BIGINT)
- project_id: Foreign key to projects
- user_id: Foreign key to users
- role: OWNER or MEMBER
- joined_at: Timestamp
- Unique constraint: (project_id, user_id)

#### project_invites table
- id: Primary key (BIGINT)
- project_id: Foreign key to projects
- token: Unique UUID string
- expires_at: Expiration timestamp
- max_uses: Maximum uses (INTEGER)
- used_count: Current uses (INTEGER)
- revoked: Boolean
- created_by: Foreign key to users
- created_at: Timestamp

#### tasks table
- id: Primary key (BIGINT)
- project_id: Foreign key to projects
- milestone_id: Foreign key to milestones (nullable)
- assignee_id: Foreign key to users (nullable)
- title: Task title (VARCHAR)
- description: Task description (TEXT, nullable)
- status: BACKLOG, IN_PROGRESS, REVIEW, DONE
- priority: LOW, MEDIUM, HIGH
- deadline: Due date (DATE, nullable)
- created_at: Timestamp

#### milestones table
- id: Primary key (BIGINT)
- project_id: Foreign key to projects
- name: Milestone name (VARCHAR)
- description: Description (TEXT, nullable)
- due_date: Due date (DATE, nullable)
- completed: Boolean

#### comments table
- id: Primary key (BIGINT)
- task_id: Foreign key to tasks
- user_id: Foreign key to users
- content: Comment text (TEXT)
- created_at: Timestamp

#### notifications table
- id: Primary key (BIGINT)
- user_id: Foreign key to users
- type: Notification type (VARCHAR)
- title: Title (VARCHAR)
- message: Message (TEXT)
- target_path: Navigation path (VARCHAR)
- read: Boolean
- created_at: Timestamp

---

## 6. Authentication and Authorization

### 6.1 Authentication

Authentication is the process of verifying user identity.

#### Registration Flow:
1. User fills registration form (name, email, password)
2. Frontend sends POST to `/api/auth/register`
3. Backend validates:
   - Email doesn't already exist
   - Password meets requirements
4. Backend creates User entity with BCrypt-encrypted password
5. Backend generates UUID token
6. Backend stores token → userId in tokenStore (ConcurrentHashMap)
7. Backend returns user object and token
8. Frontend stores token in localStorage
9. Frontend stores user in localStorage

#### Login Flow:
1. User fills login form (email, password)
2. Frontend sends POST to `/api/auth/login`
3. Backend finds user by email
4. Backend validates password using BCrypt
5. Backend generates new UUID token
6. Backend stores token → userId in tokenStore
7. Backend returns user object and token
8. Frontend stores token and user in localStorage

#### Token-Based Authentication:
- Tokens are UUIDs stored in memory on the backend
- Each request includes the token in the Authorization header
- The AuthFilter validates the token on each request
- Tokens are not expired (stateless design)

### 6.2 Authorization

Authorization is the process of determining what actions a user can perform.

#### Project-Level Authorization:

1. **requireProjectMember(projectId, actorId)**:
   - Checks if user is in project_memberships table
   - Throws AccessDeniedException if not a member

2. **requireProjectOwner(projectId, actorId)**:
   - Checks if user is in project_memberships table with OWNER role
   - Throws AccessDeniedException if not the owner

#### Role-Based Access:

- **Owner**: Can manage project, members, invites, tasks, milestones
- **Member**: Can view project, create tasks, comment
- **System Roles**: ADMIN, PROJECT_MANAGER, TEAM_MEMBER, VIEWER, QA, DEVELOPER

### 6.3 Security Implementation

#### Password Security:
- BCrypt hashing with salt
- Never stores plain text passwords
- Automatic salt generation per user

#### Token Security:
- UUID tokens are randomly generated
- Tokens stored in server memory (not persistent)
- Token sent in Authorization header (Bearer token)

#### API Security:
- All endpoints except auth and invite require valid token
- CORS configured to allow only frontend origins
- 401 response on authentication failure

---

## 7. Request Lifecycle and Data Flow

### 7.1 Complete Request Lifecycle

When a user performs an action (e.g., creating a project), here's what happens:

#### Step 1: User Action (Frontend)
1. User fills form and clicks submit
2. React component calls API method from client.ts
3. API method includes auth token in request header

#### Step 2: HTTP Request
```
POST /api/projects HTTP/1.1
Host: localhost:8080
Content-Type: application/json
Authorization: Bearer abc123-uuid-token
{
  "name": "New Project",
  "description": "Project description"
}
```

#### Step 3: Backend Reception
1. Spring Boot receives request
2. AuthFilter intercepts request
3. AuthFilter extracts token from header
4. AuthFilter validates token in tokenStore
5. If valid, sets Security Context with user principal

#### Step 4: Controller Processing
1. ApiController receives request
2. Extracts parameters from request body
3. Gets userId from Security Context
4. Calls AppService.createProject()

#### Step 5: Service Processing
1. AppService validates input
2. Checks authorization (user must be authenticated)
3. Creates Project entity
4. Saves to database via ProjectRepository
5. Creates ProjectMembership with OWNER role for creator
6. Creates activity record

#### Step 6: Database Interaction
1. JPA/Hibernate translates to SQL
2. Hibernate executes INSERT statement
3. PostgreSQL processes query
4. Returns generated ID
5. Hibernate creates entity instance with ID

#### Step 7: Response
1. Service returns Project entity
2. Controller converts to JSON
3. HTTP response sent to frontend

#### Step 8: Frontend Processing
1. React receives response
2. Updates component state
3. Re-renders UI with new data

### 7.2 Specific Action Flows

#### Registration Flow:
1. User fills form → Submit
2. Frontend POST /api/auth/register
3. Backend validates email uniqueness
4. Backend encrypts password with BCrypt
5. Backend creates User entity
6. Backend generates token, stores in tokenStore
7. Returns user + token
8. Frontend stores in localStorage
9. Redirects to dashboard

#### Login Flow:
1. User enters credentials → Submit
2. Frontend POST /api/auth/login
3. Backend finds user by email
4. Backend validates password with BCrypt
5. Backend generates token, stores in tokenStore
6. Returns user + token
7. Frontend stores in localStorage
8. Redirects to dashboard

#### Creating a Project:
1. User fills project form → Submit
2. Frontend POST /api/projects with auth header
3. AuthFilter validates token
4. Controller receives request
5. Service creates Project entity
6. Service creates ProjectMembership (owner)
7. Service creates activity record
8. Returns created project
9. Frontend updates project list

#### Joining via Invite:
1. User clicks invite link `/invite/abc123token`
2. Frontend loads InviteAcceptPage
3. Page calls GET /api/invites/{token}
4. Backend validates token, returns invite details
5. User clicks "Accept Invite"
6. Frontend POST /api/invites/{token}/accept
7. Backend creates ProjectMembership
8. Backend returns updated membership
9. User redirected to project

#### Creating a Task:
1. User fills task form in project → Submit
2. Frontend POST /api/tasks with projectId
3. AuthFilter validates token
4. Controller receives request
5. Service validates project membership
6. Service creates Task entity
7. Service creates activity record
8. Returns created task
9. Frontend updates task list

#### Changing a Role:
1. Owner clicks "Make Member" button
2. Frontend PUT /api/projects/{id}/members/{userId}
3. AuthFilter validates token
4. Controller receives request
5. Service validates owner permission
6. Service updates ProjectMembership role
7. Service creates activity record
8. Returns updated membership
9. Frontend updates member list

#### Viewing Dashboard:
1. User navigates to /dashboard
2. Frontend loads DashboardPage
3. Page calls multiple hooks:
   - useProjects() - gets projects
   - useTasks() - gets tasks
   - useActivities() - gets activities
4. Each hook makes API call with auth header
5. Backend validates tokens
6. Backend returns filtered data
7. Frontend renders dashboard with data

#### Loading Activities:
1. User navigates to /activities
2. Frontend calls useActivities(limit?)
3. Hook makes GET /api/activities?limit=20
4. Backend gets userId from token
5. Service queries notifications for user
6. Returns activity list
7. Frontend renders activity feed

#### Filtering Users/Projects:
1. User selects filter in dropdown
2. Frontend updates state with selected filter
3. Hook re-fetches data with new filter
4. Backend filters based on query parameters
5. Returns filtered results
6. Frontend updates display

---

## 8. Key Features Implementation Details

### 8.1 Project Membership Logic

The project membership system determines who can access what projects.

**How it works:**
1. When a project is created, the creator automatically becomes an OWNER
2. Owners can invite others via invite links
3. When someone accepts an invite, they become a MEMBER
4. Only project members can see the project
5. Only owners can manage members and delete the project

**Database storage:**
- project_memberships table stores user-project relationships
- role column indicates OWNER or MEMBER
- Unique constraint prevents duplicate memberships

### 8.2 Invite Link System

The invite system allows sharing project access via links.

**Invite Creation:**
1. Project owner clicks "Invite"
2. Frontend POST /api/projects/{id}/invites
3. Backend creates ProjectInvite with:
   - Unique UUID token
   - Expiration time (default 72 hours)
   - Max uses (optional)
4. Backend returns invite with token

**Invite Acceptance:**
1. User visits /invite/{token}
2. Frontend shows invite details (project name, inviter)
3. User clicks "Accept"
4. Frontend POST /api/invites/{token}/accept
5. Backend validates:
   - Token exists
   - Not expired
   - Not revoked
   - Not max uses reached
6. Backend creates ProjectMembership
7. User redirected to project

### 8.3 Activity Tracking System

Activities provide an audit trail of all actions in the system.

**Activity Creation:**
Activities are created automatically when:
- A project is created, updated, or deleted
- A task is created, updated, or deleted
- A milestone is created, updated, or deleted
- A member joins or is removed
- A role is changed

**Activity Data:**
- type: What entity (project, task, milestone)
- title: Brief description
- message: Detailed description
- targetPath: Navigation path
- createdAt: Timestamp

**Activity Retrieval:**
- GET /api/activities returns activities for current user
- Optional limit parameter for pagination
- Activities ordered by created_at descending

### 8.4 Role System

The system has two types of roles:

**System Roles (User entity):**
- ADMIN: Full system access
- PROJECT_MANAGER: Can manage projects
- TEAM_MEMBER: Default role
- VIEWER: Read-only access
- QA: Quality assurance
- DEVELOPER: Development team

**Project Roles (ProjectMembership entity):**
- OWNER: Can manage project, members, settings
- MEMBER: Can view and contribute

### 8.5 Task Management

Tasks are the core work items in the system.

**Task Properties:**
- title: Task name
- description: Detailed description
- status: BACKLOG, IN_PROGRESS, REVIEW, DONE
- priority: LOW, MEDIUM, HIGH
- deadline: Due date
- assignee: User assigned to task
- milestone: Associated milestone (optional)

**Task Status Flow:**
- BACKLOG → IN_PROGRESS → REVIEW → DONE
- Can skip stages (e.g., BACKLOG → DONE)

### 8.6 Kanban Board

The ProjectDetailPage displays tasks in a Kanban board.

**Columns:**
- To Do (BACKLOG)
- In Progress (IN_PROGRESS)
- Review (REVIEW)
- Done (DONE)

**Drag and Drop:**
- Users can drag tasks between columns
- On drop, status is updated via API
- Activity is recorded for audit trail

---

## 9. Important Software Engineering Concepts

### 9.1 REST API

REST (Representational State Transfer) is an architectural style for designing networked applications.

**Key Principles:**
- **Resources**: Everything is a resource (users, projects, tasks)
- **URIs**: Resources identified by URIs (/api/users, /api/projects)
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (delete)
- **Stateless**: Each request contains all information needed
- **JSON**: Data format for requests and responses

**HTTP Status Codes Used:**
- 200 OK: Successful GET/PUT
- 201 Created: Successful POST
- 400 Bad Request: Invalid input
- 401 Unauthorized: Not authenticated
- 403 Forbidden: Not authorized
- 404 Not Found: Resource doesn't exist
- 500 Internal Server Error: Server error

### 9.2 JWT vs Bearer Tokens

This project uses Bearer tokens (not JWT).

**Bearer Tokens:**
- Simple random string (UUID)
- Stored in server memory
- No payload or claims
- Validated by existence in tokenStore

**JWT (JSON Web Tokens):**
- Self-contained tokens with payload
- Digitally signed
- Can be validated without server lookup
- This project doesn't use JWT (simpler approach)

### 9.3 ORM (Object-Relational Mapping)

ORM bridges the gap between object-oriented code and relational databases.

**How it works in this project:**
1. Java classes (entities) map to database tables
2. JPA/Hibernate translates method calls to SQL
3. Relationships defined with annotations (@OneToMany, @ManyToOne)
4. Queries written in Java, translated to SQL

**Benefits:**
- Write Java instead of SQL
- Database independence
- Automatic table creation
- Caching support

### 9.4 CRUD Operations

CRUD stands for Create, Read, Update, Delete.

**In this project:**
- **Create**: POST endpoints (createProject, createTask)
- **Read**: GET endpoints (getProjects, getTasks)
- **Update**: PUT endpoints (updateProject, updateTask)
- **Delete**: DELETE endpoints (deleteProject, deleteTask)

### 9.5 Middleware and Filters

Filters intercept requests before they reach controllers.

**AuthFilter in this project:**
1. Extracts Authorization header
2. Validates Bearer token
3. Sets Security Context
4. Passes request to next filter/controller

**Filter Chain:**
```
Request → CORS Filter → Auth Filter → Controller
```

### 9.6 State Management

State management handles data changes in the application.

**In this project:**
- **React Context**: Global auth state
- **useState**: Component-level state
- **useEffect**: Side effects and data fetching
- **localStorage**: Persistent auth data

### 9.7 CORS (Cross-Origin Resource Sharing)

CORS allows browsers to make requests to different domains.

**Configuration:**
- Allowed origins: localhost:5173, localhost:3000
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed headers: Content-Type, Authorization

### 9.8 BCrypt Password Hashing

BCrypt is a password hashing algorithm.

**How it works:**
1. When user sets password, BCrypt generates salt
2. Password hashed with salt (cost factor 10)
3. Hash stored in database
4. On login, input hashed with stored salt
5. Hashes compared for validation

**Security benefits:**
- Salt protects against rainbow tables
- Slow hashing protects against brute force
- Automatic salt generation per user

### 9.9 Cascade Deletes

Cascade deletes automatically delete related entities.

**In this project:**
- Deleting a project deletes:
  - All tasks in the project
  - All milestones in the project
  - All invites for the project
  - All memberships for the project

This prevents orphaned data in the database.

### 9.10 Indexes and Performance

Database indexes improve query performance.

**Indexes in this project:**
- Primary keys (automatic)
- Unique constraints (email on users)
- Foreign keys (project_id on tasks, memberships)
- Composite indexes (project_id, user_id on memberships)

---

## Conclusion

This Project Management Platform is a full-stack application built with modern technologies and best practices. The backend uses Spring Boot with Spring Security for a secure, scalable API. The frontend uses React with TypeScript for a type-safe, maintainable UI. The database uses PostgreSQL with proper relationships and constraints.

The architecture follows industry-standard patterns:
- Layered backend (Controller → Service → Repository)
- RESTful API design
- Token-based authentication
- Proper authorization at project level
- Comprehensive activity tracking

This documentation should provide a complete understanding of how the system works internally, from low-level implementation details to high-level system design.