# Use Case Scenarios - Diagram Type Selection Guide

> **SKILL QUICK REF**: Database→`erDiagram` | API calls→`sequenceDiagram` | States→`stateDiagram-v2` | Classes→`classDiagram` | Schedule→`gantt` | Architecture→`flowchart+ELK` | Semantic→`flowchart LR`

## When to Use

- Choosing the right diagram type for a use case
- Understanding diagram type strengths and trade-offs
- Mapping domains to visualization approaches

## Overview

This guide maps common diagramming scenarios to their optimal Mermaid diagram types, helping you choose the right visualization for your needs.

---

## Quick Reference Matrix

### By Domain

| Domain | Primary Diagram Types | Secondary Options |
|--------|----------------------|-------------------|
| **Software Architecture** | C4, Flowchart, Class | Sequence, ER |
| **Database Design** | ER Diagram | Class Diagram |
| **API Documentation** | Sequence | Flowchart |
| **Project Management** | Gantt | Timeline, Kanban |
| **Business Process** | Flowchart | State, User Journey |
| **UX/CX Design** | User Journey | Flowchart, Mindmap |
| **Data Analysis** | Pie, XY Chart, Sankey | Quadrant |
| **Knowledge Management** | Mindmap | Flowchart (Cagle style) |
| **DevOps/CI-CD** | Flowchart, GitGraph | Sequence |
| **Requirements** | Requirement Diagram | Mindmap |

---

## Software Development Scenarios

### 1. System Architecture Overview

**Best Choice: C4 Context Diagram**

```mermaid
C4Context
    title System Context

    Person(user, "User")
    System(app, "Application")
    System_Ext(ext, "External Service")

    Rel(user, app, "Uses")
    Rel(app, ext, "Calls")
```

**When to use:**
- High-level system documentation
- Stakeholder presentations
- Architecture decision records

**Alternatives:**
- Flowchart with subgraphs for simpler systems
- Block diagram for infrastructure focus

---

### 2. API Request/Response Flow

**Best Choice: Sequence Diagram**

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant G as Gateway
    participant S as Service
    participant D as Database

    C->>G: POST /api/users
    G->>G: Validate token
    G->>S: Forward request
    S->>D: INSERT user
    D-->>S: User record
    S-->>G: 201 Created
    G-->>C: Response + JWT
```

**When to use:**
- REST/GraphQL API documentation
- Authentication flows
- Microservice interactions
- Debugging communication issues

---

### 3. Database Schema Design

**Best Choice: ER Diagram**

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : "included in"

    USER {
        uuid id PK
        string email UK
        string name
    }

    ORDER {
        uuid id PK
        uuid user_id FK
        decimal total
    }
```

**When to use:**
- Database design documentation
- Data model reviews
- ORM/migration planning

---

### 4. Object-Oriented Design

**Best Choice: Class Diagram**

```mermaid
classDiagram
    class Repository~T~ {
        <<interface>>
        +findById(id) T
        +save(entity: T) T
    }

    class UserRepository {
        +findById(id) User
        +save(entity: User) User
        +findByEmail(email) User
    }

    Repository~T~ <|.. UserRepository
```

**When to use:**
- Design pattern documentation
- Code architecture planning
- API/SDK design
- Inheritance/interface relationships

---

### 5. Application State Management

**Best Choice: State Diagram**

```mermaid
stateDiagram-v2
    [*] --> Idle

    state "Active Session" as Active {
        [*] --> Authenticated
        Authenticated --> Loading : fetch
        Loading --> Ready : success
        Loading --> Error : failure
        Error --> Loading : retry
        Ready --> Loading : refresh
    }

    Idle --> Active : login
    Active --> Idle : logout
    Active --> [*] : session_expired
```

**When to use:**
- UI component states
- Workflow/process states
- Game logic
- Order/transaction lifecycles

---

### 6. Git Workflow Documentation

**Best Choice: GitGraph**

```mermaid
gitGraph
    commit id: "init"
    branch develop
    commit id: "setup"

    branch feature/auth
    commit id: "login"
    commit id: "logout"
    checkout develop
    merge feature/auth

    checkout main
    merge develop tag: "v1.0"
```

**When to use:**
- Branching strategy documentation
- Release planning
- Training materials
- PR/merge visualization

---

### 7. CI/CD Pipeline

**Best Choice: Flowchart**

```mermaid
flowchart LR
    subgraph Build
        A[Checkout] --> B[Install]
        B --> C[Lint]
        C --> D[Test]
        D --> E[Build]
    end

    subgraph Deploy
        F[Stage] --> G{Approve?}
        G -->|Yes| H[Prod]
        G -->|No| I[Rollback]
    end

    E --> F

    classDef success fill:#48bb78,stroke:#276749,color:#fff
    classDef fail fill:#f56565,stroke:#c53030,color:#fff

    class H success
    class I fail
```

**When to use:**
- Pipeline documentation
- DevOps onboarding
- Automation design

---

## Project Management Scenarios

### 8. Project Timeline & Scheduling

**Best Choice: Gantt Chart**

```mermaid
gantt
    title Project Roadmap
    dateFormat YYYY-MM-DD
    excludes weekends

    section Planning
    Requirements :done, req, 2024-01-01, 2w
    Design :active, des, after req, 2w

    section Development
    Backend :dev1, after des, 4w
    Frontend :dev2, after des, 4w

    section Release
    Testing :test, after dev1 dev2, 2w
    Launch :milestone, launch, after test, 0d
```

**When to use:**
- Sprint planning
- Release roadmaps
- Resource allocation
- Deadline tracking

---

### 9. Task Prioritization

**Best Choice: Quadrant Chart**

```mermaid
quadrantChart
    title Feature Priority Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Quick Wins
    quadrant-2 Major Projects
    quadrant-3 Fill-Ins
    quadrant-4 Time Sinks

    Auth Refactor: [0.3, 0.9]
    Dark Mode: [0.2, 0.4]
    Performance: [0.7, 0.85]
    New Logo: [0.4, 0.2]
    Search: [0.6, 0.7]
```

**When to use:**
- Backlog prioritization
- Technical debt assessment
- Risk/impact analysis
- Feature triage

---

### 10. Historical Timeline

**Best Choice: Timeline Diagram**

```mermaid
timeline
    title Product Evolution
    section Foundation
        2020 : Company founded
             : First prototype
    section Growth
        2021 : Seed funding
             : Beta launch
        2022 : Series A
             : 10K users
    section Scale
        2023 : Global expansion
             : 100K users
        2024 : IPO preparation
```

**When to use:**
- Company/product history
- Milestone tracking
- Retrospectives
- Investor presentations

---

## Business & Analysis Scenarios

### 11. Business Process Workflow

**Best Choice: Flowchart**

```mermaid
flowchart TD
    A[Customer Request] --> B{Valid Request?}
    B -->|Yes| C[Create Ticket]
    B -->|No| D[Request Info]
    D --> A

    C --> E{Priority?}
    E -->|High| F[Immediate Review]
    E -->|Normal| G[Queue]

    F --> H[Assign Agent]
    G --> H

    H --> I[Resolve]
    I --> J{Satisfied?}
    J -->|Yes| K[Close]
    J -->|No| L[Escalate]
    L --> H
```

**When to use:**
- Process documentation
- SOP creation
- Workflow automation design
- Business analysis

---

### 12. Customer Journey Mapping

**Best Choice: User Journey**

```mermaid
journey
    title E-commerce Customer Journey
    section Discovery
        Search online: 3: Customer
        Read reviews: 4: Customer
        Compare options: 3: Customer
    section Purchase
        Add to cart: 5: Customer
        Checkout: 2: Customer
        Payment: 3: Customer
    section Delivery
        Track order: 4: Customer
        Receive package: 5: Customer
    section Support
        Contact support: 2: Customer
        Issue resolved: 4: Customer, Agent
```

**When to use:**
- UX research documentation
- Pain point identification
- Service design
- Customer experience optimization

---

### 13. Data Distribution/Proportions

**Best Choice: Pie Chart**

```mermaid
pie showData
    title Revenue by Region
    "North America" : 45
    "Europe" : 30
    "Asia Pacific" : 15
    "Other" : 10
```

**When to use:**
- Budget allocation
- Market share
- Survey results
- Resource distribution

---

### 14. Flow Quantities (Budget, Energy, etc.)

**Best Choice: Sankey Diagram**

```mermaid
sankey-beta

Revenue,Operating Costs,60
Revenue,Profit,40
Operating Costs,Salaries,35
Operating Costs,Infrastructure,15
Operating Costs,Marketing,10
Profit,Reinvestment,25
Profit,Dividends,15
```

**When to use:**
- Financial flow visualization
- Energy/resource tracking
- Conversion funnels
- Supply chain analysis

---

### 15. Trend Analysis

**Best Choice: XY Chart**

```mermaid
xychart-beta
    title Monthly Active Users
    x-axis [Jan, Feb, Mar, Apr, May, Jun]
    y-axis "Users (K)" 0 --> 100
    line [20, 35, 45, 60, 75, 90]
    bar [25, 30, 40, 55, 70, 85]
```

**When to use:**
- KPI tracking
- Performance metrics
- Financial reporting
- Comparative analysis

---

## Knowledge Management Scenarios

### 16. Brainstorming & Ideation

**Best Choice: Mindmap**

```mermaid
mindmap
    root((Product Vision))
        Core Features
            Authentication
            Dashboard
            Reports
        Technical
            Frontend
                React
                TypeScript
            Backend
                Node.js
                PostgreSQL
        Business
            Target Market
            Revenue Model
            Competition
```

**When to use:**
- Brainstorming sessions
- Project scoping
- Learning/study notes
- Information organization

---

### 17. Knowledge Graph Visualization (Cagle Style)

**Best Choice: Flowchart with ELK**

```mermaid
---
config:
  layout: elk
---
flowchart LR
    classDef class fill:#DDA0DD,stroke:#000
    classDef instance fill:#ADD8E6,stroke:#000
    classDef literal fill:#FFFACD,stroke:#000

    Person["Person"]:::class
    Employee["Employee"]:::class
    John["John Smith"]:::instance
    StartDate["2024-01-15"]:::literal

    Person --> |subclass| Employee
    Employee --> |instance| John
    John --> |startDate| StartDate
```

**When to use:**
- RDF/ontology visualization
- Semantic data models
- Taxonomy documentation
- Linked data representation

---

### 18. Requirements Traceability

**Best Choice: Requirement Diagram**

```mermaid
requirementDiagram

    requirement secure_auth {
        id: REQ-001
        text: System must authenticate users securely
        risk: high
        verifymethod: test
    }

    requirement mfa {
        id: REQ-002
        text: MFA must be available
        risk: medium
        verifymethod: demonstration
    }

    element auth_module {
        type: module
    }

    auth_module - satisfies -> secure_auth
    mfa - derives -> secure_auth
```

**When to use:**
- Requirements documentation
- Compliance tracking
- Feature traceability
- Audit preparation

---

## Decision Guide Flowchart

```mermaid
flowchart TD
    A{What are you documenting?}

    A -->|Time/Schedule| B{Multiple tasks?}
    B -->|Yes| Gantt[Gantt Chart]
    B -->|No| Timeline[Timeline]

    A -->|Process/Flow| C{Has states?}
    C -->|Yes| State[State Diagram]
    C -->|No| Flow[Flowchart]

    A -->|Data| D{Type of data?}
    D -->|Proportions| Pie[Pie Chart]
    D -->|Trends| XY[XY Chart]
    D -->|Flow quantities| Sankey[Sankey]
    D -->|Priority matrix| Quad[Quadrant Chart]

    A -->|Interactions| E{Over time?}
    E -->|Yes| Seq[Sequence Diagram]
    E -->|No| Flow2[Flowchart]

    A -->|Structure| F{Type?}
    F -->|Database| ER[ER Diagram]
    F -->|Code/OOP| Class[Class Diagram]
    F -->|Architecture| C4[C4 Diagram]
    F -->|Ideas| Mind[Mindmap]

    A -->|User Experience| Journey[User Journey]

    A -->|Git/Versions| Git[GitGraph]

    A -->|Knowledge/Semantic| KG[Flowchart + ELK]
```

---

## Summary Table

| Scenario | Primary | Alternative | Cagle Approach |
|----------|---------|-------------|----------------|
| System architecture | C4 | Flowchart | Flowchart LR + subgraphs |
| API documentation | Sequence | - | - |
| Database design | ER | Class | - |
| OOP design | Class | - | - |
| State machines | State | Flowchart | classDef coloring |
| Project schedule | Gantt | Timeline | - |
| Priority analysis | Quadrant | Mindmap | - |
| Process workflows | Flowchart | State | Flowchart LR + ELK |
| User experience | Journey | Flowchart | - |
| Brainstorming | Mindmap | Flowchart | - |
| Knowledge graphs | Flowchart | - | **ELK + classDef + LR** |
| Data proportions | Pie | - | - |
| Trends/metrics | XY Chart | - | - |
| Flow quantities | Sankey | - | - |
| Git workflows | GitGraph | Flowchart | - |
| Requirements | Requirement | Mindmap | - |
