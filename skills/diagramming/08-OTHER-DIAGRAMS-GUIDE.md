# Other Mermaid Diagram Types Guide

> **SKILL QUICK REF**: `pie` `mindmap` `journey` `timeline` `quadrantChart` `gitGraph` `C4Context` `sankey-beta` `xychart-beta` `requirementDiagram` `block-beta` `kanban`

## Diagram Types in This Guide

| Type | Declaration | Use Case |
|------|-------------|----------|
| Pie Chart | `pie` | Proportions, distributions |
| Mind Map | `mindmap` | Brainstorming, hierarchies |
| User Journey | `journey` | UX mapping, customer experience |
| Timeline | `timeline` | History, milestones |
| Quadrant | `quadrantChart` | Priority matrices, analysis |
| GitGraph | `gitGraph` | Git branching visualization |
| C4 | `C4Context/Container/Component` | Software architecture |
| Sankey | `sankey-beta` | Flow quantities, budgets |
| XY Chart | `xychart-beta` | Trends, bar/line charts |

## Overview

This guide covers additional Mermaid diagram types beyond the core flowchart, sequence, class, state, ER, and Gantt diagrams.

---

## Pie Charts

### Basic Syntax

```mermaid
pie title Browser Market Share
    "Chrome" : 65
    "Safari" : 19
    "Firefox" : 4
    "Edge" : 4
    "Other" : 8
```

### With Show Data

```mermaid
pie showData
    title Project Time Allocation
    "Development" : 45
    "Testing" : 20
    "Documentation" : 15
    "Meetings" : 12
    "Admin" : 8
```

### Themed Pie Chart

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "pie1": "#e74c3c",
    "pie2": "#3498db",
    "pie3": "#2ecc71",
    "pie4": "#f1c40f",
    "pie5": "#9b59b6"
  }
}}%%
pie title Budget Distribution
    "Engineering" : 40
    "Marketing" : 25
    "Operations" : 20
    "R&D" : 15
```

---

## Mind Maps

### Basic Syntax

```mermaid
mindmap
    root((Project))
        Planning
            Requirements
            Timeline
            Resources
        Development
            Frontend
            Backend
            Database
        Testing
            Unit Tests
            Integration
            E2E
        Deployment
            Staging
            Production
```

### Node Shapes

```mermaid
mindmap
    root((Central))
        [Square Topic]
            Subtopic 1
            Subtopic 2
        (Rounded Topic)
            Subtopic A
            Subtopic B
        ))Cloud Topic((
            Item X
            Item Y
```

### With Icons

```mermaid
mindmap
    root((Web Dev))
        Frontend
            ::icon(fa fa-html5)
            HTML
            CSS
            JavaScript
        Backend
            ::icon(fa fa-server)
            Node.js
            Python
            Go
        Database
            ::icon(fa fa-database)
            PostgreSQL
            MongoDB
```

### Markdown Strings

```mermaid
mindmap
    root(("`**Main Topic**`"))
        ("`*Italic Branch*`")
            Leaf 1
            Leaf 2
        ["`Code: \`example\``"]
            Detail A
            Detail B
```

---

## User Journey Maps

### Basic Syntax

```mermaid
journey
    title User Checkout Experience
    section Browse
        View homepage: 5: User
        Search products: 4: User
        View product details: 5: User
    section Purchase
        Add to cart: 5: User
        Enter shipping: 3: User
        Enter payment: 2: User
        Confirm order: 4: User
    section Post-Purchase
        Receive confirmation: 5: User, System
        Track shipment: 4: User
        Receive delivery: 5: User
```

### Multi-Actor Journey

```mermaid
journey
    title Support Ticket Resolution
    section Submission
        Submit ticket: 4: Customer
        Receive ticket: 5: System
        Auto-assign: 5: System
    section Resolution
        Review ticket: 3: Agent
        Request info: 2: Agent, Customer
        Provide details: 3: Customer
        Investigate: 3: Agent
        Resolve issue: 4: Agent
    section Closure
        Confirm resolution: 5: Agent
        Rate experience: 4: Customer
```

Score: 1 (negative) to 5 (positive)

---

## Timeline Diagrams

### Basic Syntax

```mermaid
timeline
    title Company History
    2010 : Founded in garage
    2012 : First product launch
    2015 : Series A funding
    2018 : IPO
    2020 : Global expansion
    2023 : 1M customers
```

### With Sections

```mermaid
timeline
    title Technology Evolution
    section Early Computing
        1940s : First computers
        1950s : Mainframes
        1960s : Time-sharing
    section Personal Computing
        1970s : Microprocessors
        1980s : PCs
        1990s : Internet boom
    section Modern Era
        2000s : Mobile revolution
        2010s : Cloud computing
        2020s : AI everywhere
```

### Multiple Events Per Period

```mermaid
timeline
    title Q1 Milestones
    January
        : Product launch
        : Team expansion
    February
        : Partnership signed
        : 100K users
    March
        : Series B funding
        : New office
```

---

## Quadrant Charts

### Basic Syntax

```mermaid
quadrantChart
    title Feature Priority Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Do First
    quadrant-2 Plan
    quadrant-3 Delegate
    quadrant-4 Eliminate

    Feature A: [0.8, 0.9]
    Feature B: [0.2, 0.8]
    Feature C: [0.7, 0.3]
    Feature D: [0.3, 0.2]
    Feature E: [0.5, 0.6]
```

### Eisenhower Matrix

```mermaid
quadrantChart
    title Task Prioritization
    x-axis Not Urgent --> Urgent
    y-axis Not Important --> Important
    quadrant-1 Do
    quadrant-2 Schedule
    quadrant-3 Delegate
    quadrant-4 Delete

    Critical Bug: [0.9, 0.95]
    Code Review: [0.3, 0.7]
    Email: [0.6, 0.2]
    Meeting Prep: [0.8, 0.6]
    Documentation: [0.2, 0.5]
    Social Media: [0.4, 0.1]
```

---

## GitGraph

### Basic Syntax

```mermaid
gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
```

### Feature Branch Workflow

```mermaid
gitGraph
    commit id: "Initial"
    commit id: "Setup"

    branch develop
    checkout develop
    commit id: "Dev setup"

    branch feature/auth
    checkout feature/auth
    commit id: "Login"
    commit id: "Logout"
    checkout develop
    merge feature/auth

    branch feature/dashboard
    checkout feature/dashboard
    commit id: "Layout"
    commit id: "Charts"
    checkout develop
    merge feature/dashboard

    checkout main
    merge develop tag: "v1.0"
```

### With Custom Styling

```mermaid
%%{init: {
  "theme": "base",
  "gitGraph": {
    "mainBranchName": "main",
    "showCommitLabel": true
  }
}}%%
gitGraph
    commit id: "feat: init"
    commit id: "feat: setup"
    branch feature
    commit id: "feat: new feature"
    checkout main
    merge feature id: "merge: feature" tag: "v1.0"
    commit id: "fix: bug"
```

---

## C4 Architecture Diagrams

### System Context (C4Context)

```mermaid
C4Context
    title System Context - E-Commerce Platform

    Person(customer, "Customer", "A user of the e-commerce platform")
    Person(admin, "Admin", "System administrator")

    System(ecommerce, "E-Commerce System", "Allows customers to browse and purchase products")

    System_Ext(payment, "Payment Provider", "Handles payment processing")
    System_Ext(shipping, "Shipping Service", "Manages delivery logistics")
    System_Ext(email, "Email Service", "Sends notifications")

    Rel(customer, ecommerce, "Uses")
    Rel(admin, ecommerce, "Manages")
    Rel(ecommerce, payment, "Processes payments via")
    Rel(ecommerce, shipping, "Ships orders via")
    Rel(ecommerce, email, "Sends emails via")
```

### Container Diagram (C4Container)

```mermaid
C4Container
    title Container Diagram - E-Commerce System

    Person(customer, "Customer")

    System_Boundary(ecommerce, "E-Commerce System") {
        Container(web, "Web Application", "React", "User interface")
        Container(api, "API Server", "Node.js", "Business logic")
        Container(worker, "Background Worker", "Node.js", "Async processing")
        ContainerDb(db, "Database", "PostgreSQL", "Stores data")
        ContainerDb(cache, "Cache", "Redis", "Session & cache")
        ContainerDb(queue, "Message Queue", "RabbitMQ", "Job queue")
    }

    System_Ext(payment, "Payment Provider")

    Rel(customer, web, "Uses", "HTTPS")
    Rel(web, api, "Calls", "REST/JSON")
    Rel(api, db, "Reads/Writes")
    Rel(api, cache, "Reads/Writes")
    Rel(api, queue, "Publishes")
    Rel(worker, queue, "Consumes")
    Rel(worker, db, "Updates")
    Rel(api, payment, "Processes payments")
```

### Component Diagram (C4Component)

```mermaid
C4Component
    title Component Diagram - API Server

    Container_Boundary(api, "API Server") {
        Component(auth, "Auth Controller", "Express", "Handles authentication")
        Component(product, "Product Controller", "Express", "Product operations")
        Component(order, "Order Controller", "Express", "Order management")
        Component(authSvc, "Auth Service", "Service", "Auth business logic")
        Component(productSvc, "Product Service", "Service", "Product logic")
        Component(orderSvc, "Order Service", "Service", "Order logic")
        Component(repo, "Repository Layer", "TypeORM", "Data access")
    }

    ContainerDb(db, "Database", "PostgreSQL")

    Rel(auth, authSvc, "Uses")
    Rel(product, productSvc, "Uses")
    Rel(order, orderSvc, "Uses")
    Rel(authSvc, repo, "Uses")
    Rel(productSvc, repo, "Uses")
    Rel(orderSvc, repo, "Uses")
    Rel(repo, db, "Reads/Writes")
```

---

## Sankey Diagrams

### Basic Syntax

```mermaid
sankey-beta

Revenue,Expenses,70
Revenue,Profit,30
Expenses,Salaries,40
Expenses,Operations,20
Expenses,Marketing,10
Profit,Reinvestment,20
Profit,Dividends,10
```

### Energy Flow Example

```mermaid
sankey-beta

Solar,Electricity,100
Wind,Electricity,80
Natural Gas,Electricity,150
Electricity,Residential,120
Electricity,Commercial,100
Electricity,Industrial,80
Electricity,Losses,30
```

---

## XY Charts

### Line Chart

```mermaid
xychart-beta
    title "Monthly Sales 2024"
    x-axis [Jan, Feb, Mar, Apr, May, Jun]
    y-axis "Revenue (K)" 0 --> 100
    line [30, 45, 60, 55, 70, 85]
```

### Bar Chart

```mermaid
xychart-beta
    title "Quarterly Performance"
    x-axis [Q1, Q2, Q3, Q4]
    y-axis "Units Sold" 0 --> 500
    bar [250, 320, 280, 450]
```

### Combined Chart

```mermaid
xychart-beta
    title "Sales vs Target"
    x-axis [Jan, Feb, Mar, Apr, May]
    y-axis "Amount" 0 --> 100
    bar [40, 55, 45, 60, 75]
    line [50, 50, 50, 50, 50]
```

---

## Requirement Diagrams

### Basic Syntax

```mermaid
requirementDiagram

    requirement user_auth {
        id: 1
        text: Users must be able to authenticate
        risk: high
        verifymethod: test
    }

    requirement data_encryption {
        id: 2
        text: All data must be encrypted at rest
        risk: high
        verifymethod: inspection
    }

    element auth_module {
        type: module
    }

    auth_module - satisfies -> user_auth
    data_encryption - derives -> user_auth
```

---

## Block Diagrams (Beta)

### Basic Syntax

```mermaid
block-beta
    columns 3

    a["Frontend"]:1
    b["API"]:1
    c["Database"]:1

    a --> b --> c
```

### System Architecture

```mermaid
block-beta
    columns 4

    block:client
        columns 1
        Web["Web App"]
        Mobile["Mobile App"]
    end

    space

    block:backend
        columns 1
        LB["Load Balancer"]
        API["API Servers"]
        Worker["Workers"]
    end

    block:data
        columns 1
        DB[("Database")]
        Cache[("Cache")]
        Queue[("Queue")]
    end

    client --> LB
    LB --> API
    API --> DB
    API --> Cache
    API --> Queue
    Worker --> Queue
```

---

## Kanban (Experimental)

```mermaid
kanban
    column1[Todo]
        task1[Design review]
        task2[Write tests]
    column2[In Progress]
        task3[API development]
    column3[Done]
        task4[Requirements]
        task5[Database schema]
```

---

## Best Practices by Diagram Type

| Diagram | Best For | Key Tip |
|---------|----------|---------|
| **Pie** | Proportions, distributions | Keep under 7 segments |
| **Mindmap** | Brainstorming, hierarchies | Use shapes for emphasis |
| **Journey** | UX mapping, experiences | Include pain point scores |
| **Timeline** | History, roadmaps | Group related events |
| **Quadrant** | Prioritization, analysis | Label quadrants clearly |
| **GitGraph** | Version control visualization | Show key branches |
| **C4** | Architecture documentation | Start with Context, drill down |
| **Sankey** | Flow quantities, budgets | Ensure data sums correctly |
| **XY** | Trends, comparisons | Combine bar + line when useful |
| **Requirement** | Traceability | Link to implementation elements |
