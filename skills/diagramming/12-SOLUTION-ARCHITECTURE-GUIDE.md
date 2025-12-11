# Solution Architecture Diagram Guide

> **SKILL QUICK REF**: `flowchart TB` + ELK for architecture • Subgraphs for layers • Users→Interface→Service→Data flow • `classDef user|service|data|infra|security|external` • TB for layers, LR for flows

## When to Use

- System context diagrams (users, systems, external)
- Layered architecture (presentation, service, data)
- Component architecture (internal structure)
- Platform architecture (multi-service systems)
- Security architecture (trust boundaries)
- Integration architecture (API, events)

## Overview

Solution architecture diagrams communicate system design at multiple levels of abstraction. This guide covers patterns for creating clear, professional architecture diagrams using Mermaid, following Kurt Cagle's principles of semantic clarity and visual consistency.

**Key Insight**: Architecture diagrams should tell a story—from users through interfaces to services to infrastructure. Use consistent layering, semantic coloring, and appropriate layout engines.

---

## Configuration

### Recommended Settings for Architecture Diagrams

```yaml
---
config:
  layout: elk
  elk:
    mergeEdges: false
    nodePlacementStrategy: BRANDES_KOEPF
---
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E3F2FD",
    "primaryTextColor": "#0D47A1",
    "primaryBorderColor": "#1565C0",
    "lineColor": "#37474F"
  }
}}%%
```

### Standard classDef Block

```
%% Cagle Architecture Palette
classDef user fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
classDef interface fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
classDef service fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
classDef data fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
classDef infra fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
classDef security fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40
classDef external fill:#ECEFF1,stroke:#455A64,stroke-width:2px,color:#263238
classDef queue fill:#FCE4EC,stroke:#AD1457,stroke-width:2px,color:#880E4F
```

---

## Pattern 1: System Context Diagram

The highest-level view showing users, the system, and external dependencies.

### Structure

```
Users → System → External Dependencies
```

### Example

```mermaid
---
config:
  layout: elk
---
flowchart TB
    %% Cagle Architecture Palette
    classDef user fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef system fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef external fill:#ECEFF1,stroke:#455A64,stroke-width:2px,color:#263238

    subgraph Users["Users"]
        direction LR
        Analyst["Analyst"]:::user
        Admin["Administrator"]:::user
        API_Consumer["API Consumer"]:::user
    end

    subgraph System["Analytics Platform"]
        Core["Core Platform"]:::system
    end

    subgraph External["External Systems"]
        direction LR
        DataSource[("Data Warehouse")]:::external
        Auth["Identity Provider"]:::external
        Notifications["Email Service"]:::external
    end

    Users --> System
    System --> External
```

### Guidelines

1. **Three-zone layout**: Users (top/left) → System (center) → External (bottom/right)
2. **Single system box**: Abstract internal complexity at this level
3. **Name external dependencies explicitly**: Shows integration points
4. **Use TB direction**: Natural top-down reading for context diagrams

---

## Pattern 2: Layered Architecture

Shows the vertical layers of a system from presentation through data.

### Structure

```
Presentation Layer
    ↓
API Layer
    ↓
Service Layer
    ↓
Data Layer
```

### Example: Three-Tier Application

```mermaid
---
config:
  layout: elk
---
flowchart TB
    classDef user fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef interface fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef service fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef data fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100

    subgraph Presentation["Presentation Layer"]
        direction LR
        WebApp["Web Application<br/>React + TypeScript"]:::interface
        MobileApp["Mobile App<br/>React Native"]:::interface
    end

    subgraph Application["Application Layer"]
        direction LR
        API["REST API<br/>Node.js + Express"]:::service
        GraphQL["GraphQL Server<br/>Apollo"]:::service
        Workers["Background Workers<br/>Bull + Redis"]:::service
    end

    subgraph Data["Data Layer"]
        direction LR
        Primary[("PostgreSQL<br/>Primary DB")]:::data
        Cache[("Redis<br/>Cache")]:::data
        Search[("Elasticsearch<br/>Search")]:::data
    end

    Presentation --> Application
    Application --> Data
    WebApp --> API
    WebApp --> GraphQL
    MobileApp --> API
    API --> Primary
    API --> Cache
    GraphQL --> Primary
    Workers --> Primary
    Workers --> Search
```

### Example: Control Plane Architecture

```mermaid
---
config:
  layout: elk
---
flowchart TB
    classDef interface fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef service fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef data fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef infra fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1

    subgraph ControlPlane["Control Plane"]
        subgraph WebLayer["Web Layer"]
            direction LR
            Dashboard["Dashboard UI"]:::interface
            AdminUI["Admin Console"]:::interface
            ConfigUI["Config Manager"]:::interface
        end

        subgraph APILayer["API Layer"]
            direction LR
            ResourceAPI["/api/resources"]:::service
            ConfigAPI["/api/config"]:::service
            HealthAPI["/api/health"]:::service
        end

        subgraph ServiceLayer["Service Layer"]
            direction LR
            AuthSvc["Auth Service"]:::service
            LifecycleSvc["Lifecycle Manager"]:::service
            OrchestratorSvc["Orchestrator"]:::service
            NotifSvc["Notification Service"]:::service
        end

        subgraph DataLayer["Data Layer"]
            direction LR
            ConfigDB[("Config Store")]:::data
            StateDB[("State Store")]:::data
            AuditLog[("Audit Log")]:::data
        end
    end

    subgraph Infra["Infrastructure"]
        K8s["Kubernetes API"]:::infra
        Queue["Message Queue"]:::infra
    end

    WebLayer --> APILayer --> ServiceLayer --> DataLayer
    OrchestratorSvc --> K8s
    NotifSvc --> Queue
```

---

## Pattern 3: Component Architecture

Detailed view of a single service or application's internal structure.

### Structure

```
Entry Points (APIs/Events)
    ↓
Controllers/Handlers
    ↓
Business Logic Services
    ↓
Data Access / External Clients
```

### Example: Microservice Internal Architecture

```mermaid
---
config:
  layout: elk
---
flowchart TB
    classDef endpoint fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef handler fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef service fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef repo fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef external fill:#ECEFF1,stroke:#455A64,stroke-width:2px,color:#263238

    subgraph OrderService["Order Service"]
        subgraph API["REST API Layer"]
            direction LR
            CreateOrder["POST /orders"]:::endpoint
            GetOrder["GET /orders/:id"]:::endpoint
            ListOrders["GET /orders"]:::endpoint
            CancelOrder["DELETE /orders/:id"]:::endpoint
        end

        subgraph Handlers["Handler Layer"]
            direction LR
            OrderHandler["Order Handler"]:::handler
            ValidationMiddleware["Validation"]:::handler
            AuthMiddleware["Auth Middleware"]:::handler
        end

        subgraph Services["Service Layer"]
            direction LR
            OrderSvc["Order Service"]:::service
            PricingSvc["Pricing Service"]:::service
            InventorySvc["Inventory Service"]:::service
        end

        subgraph DataAccess["Data Access Layer"]
            direction LR
            OrderRepo["Order Repository"]:::repo
            ProductRepo["Product Repository"]:::repo
        end
    end

    subgraph External["External Dependencies"]
        DB[("PostgreSQL")]:::external
        PaymentAPI["Payment Gateway"]:::external
        EventBus["Event Bus"]:::external
    end

    API --> Handlers --> Services --> DataAccess
    CreateOrder --> OrderHandler
    OrderHandler --> OrderSvc
    OrderSvc --> PricingSvc
    OrderSvc --> InventorySvc
    OrderRepo --> DB
    OrderSvc --> PaymentAPI
    OrderSvc --> EventBus
```

---

## Pattern 4: Platform Architecture

Shows the complete platform with multiple services, infrastructure, and data flows.

### Example: Analytics Platform

```mermaid
---
config:
  layout: elk
---
flowchart TB
    classDef user fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef interface fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef service fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef data fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef infra fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef queue fill:#FCE4EC,stroke:#AD1457,stroke-width:2px,color:#880E4F
    classDef external fill:#ECEFF1,stroke:#455A64,stroke-width:2px,color:#263238

    subgraph Users["Users"]
        direction LR
        Analyst["Analyst"]:::user
        DataEngineer["Data Engineer"]:::user
        Admin["Admin"]:::user
    end

    subgraph Interfaces["User Interfaces"]
        direction LR
        WebApp["Web Dashboard<br/>React"]:::interface
        Notebook["Jupyter Notebook"]:::interface
        CLI["CLI Tool"]:::interface
    end

    subgraph Platform["Analytics Platform"]
        direction TB

        subgraph ControlPlane["Control Plane"]
            CP_API["Control Plane API"]:::service
            Scheduler["Job Scheduler"]:::service
        end

        subgraph ComputeLayer["Compute Layer"]
            direction LR
            subgraph Workers["Worker Pods"]
                W1["Worker 1"]:::service
                W2["Worker 2"]:::service
                WN["Worker N"]:::service
            end
        end

        Queue["Job Queue<br/>Redis"]:::queue
    end

    subgraph Storage["Storage Layer"]
        direction LR
        MetadataDB[("Metadata<br/>PostgreSQL")]:::data
        DataLake[("Data Lake<br/>S3/GCS")]:::data
        Cache[("Results Cache<br/>Redis")]:::data
    end

    subgraph External["External"]
        DataWarehouse[("Enterprise DW<br/>Snowflake")]:::external
    end

    Users --> Interfaces
    WebApp --> CP_API
    Notebook --> CP_API
    CLI --> CP_API
    CP_API --> MetadataDB
    CP_API --> Queue
    Scheduler --> Queue
    Queue --> Workers
    Workers --> DataLake
    Workers --> DataWarehouse
    Workers --> Cache
```

---

## Pattern 5: Resource Hierarchy

Shows ownership and containment relationships between resources.

### Structure (ASCII)

```
Resource Type A (long-lived)
    └── Resource Type B (medium-lived)
            └── Resource Type C (ephemeral)
```

### Example: Multi-Tenant Resource Model

```mermaid
flowchart TB
    classDef tenant fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef workspace fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef project fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef resource fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100

    Tenant["Tenant<br/>(Organization)"]:::tenant

    subgraph Workspaces["Workspaces"]
        WS1["Workspace: Production"]:::workspace
        WS2["Workspace: Development"]:::workspace
    end

    subgraph Projects["Projects"]
        P1["Project: Analytics"]:::project
        P2["Project: ML Pipeline"]:::project
        P3["Project: Sandbox"]:::project
    end

    subgraph Resources["Resources"]
        R1["Dataset: customers"]:::resource
        R2["Dataset: transactions"]:::resource
        R3["Model: churn_v1"]:::resource
        R4["Notebook: exploration"]:::resource
    end

    Tenant --> Workspaces
    WS1 --> P1
    WS1 --> P2
    WS2 --> P3
    P1 --> R1
    P1 --> R2
    P2 --> R3
    P3 --> R4
```

---

## Pattern 6: Security Architecture

Shows authentication, authorization, and trust boundaries.

### Example: Zero Trust Architecture

```mermaid
---
config:
  layout: elk
---
flowchart TB
    classDef user fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef gateway fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40
    classDef service fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef data fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef security fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#B71C1C

    subgraph External["External Zone (Untrusted)"]
        User["User"]:::user
        ExtAPI["External API Client"]:::user
    end

    subgraph DMZ["DMZ (Semi-Trusted)"]
        WAF["Web Application Firewall"]:::security
        Gateway["API Gateway"]:::gateway
        RateLimiter["Rate Limiter"]:::security
    end

    subgraph Internal["Internal Zone (Trusted)"]
        subgraph AuthN["Authentication"]
            IdP["Identity Provider"]:::gateway
            TokenSvc["Token Service"]:::gateway
        end

        subgraph Services["Service Mesh"]
            SvcA["Service A"]:::service
            SvcB["Service B"]:::service
            SvcC["Service C"]:::service
        end

        subgraph Data["Data Zone (Restricted)"]
            Secrets["Secrets Manager"]:::security
            DB[("Encrypted Database")]:::data
            Audit[("Audit Log")]:::data
        end
    end

    User --> WAF --> Gateway
    ExtAPI --> RateLimiter --> Gateway
    Gateway --> IdP
    Gateway --> TokenSvc
    Gateway --> Services
    Services --> Secrets
    Services --> DB
    Services --> Audit
    SvcA <--> SvcB
    SvcB <--> SvcC
```

---

## Pattern 7: Integration Architecture

Shows how systems communicate via APIs, events, and data flows.

### Example: Event-Driven Integration

```mermaid
---
config:
  layout: elk
---
flowchart LR
    classDef producer fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef broker fill:#FCE4EC,stroke:#AD1457,stroke-width:2px,color:#880E4F
    classDef consumer fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef data fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100

    subgraph Producers["Event Producers"]
        direction TB
        OrderSvc["Order Service"]:::producer
        UserSvc["User Service"]:::producer
        PaymentSvc["Payment Service"]:::producer
    end

    subgraph Broker["Event Broker (Kafka)"]
        direction TB
        OrderTopic["orders"]:::broker
        UserTopic["users"]:::broker
        PaymentTopic["payments"]:::broker
    end

    subgraph Consumers["Event Consumers"]
        direction TB
        Analytics["Analytics Service"]:::consumer
        Notifications["Notification Service"]:::consumer
        Search["Search Indexer"]:::consumer
        Audit["Audit Service"]:::consumer
    end

    subgraph Sinks["Data Sinks"]
        DW[("Data Warehouse")]:::data
        ES[("Elasticsearch")]:::data
        S3[("Object Storage")]:::data
    end

    OrderSvc --> OrderTopic
    UserSvc --> UserTopic
    PaymentSvc --> PaymentTopic

    OrderTopic --> Analytics
    OrderTopic --> Notifications
    UserTopic --> Analytics
    UserTopic --> Search
    PaymentTopic --> Analytics
    PaymentTopic --> Audit

    Analytics --> DW
    Search --> ES
    Audit --> S3
```

---

## Best Practices

### Layout

1. **Use ELK** for complex diagrams (>10 nodes or >15 edges)
2. **TB direction** for layered architectures (top = users, bottom = data)
3. **LR direction** for flow-based architectures (left = input, right = output)
4. **Consistent subgraph nesting** - 2-3 levels maximum

### Coloring

1. **Semantic consistency** - Same color = same type across all diagrams
2. **Layer distinction** - Each architectural layer gets its own color
3. **External systems** - Always gray (`#ECEFF1`) to distinguish from internal
4. **Security elements** - Teal for auth, red accents for critical security

### Labeling

1. **Technology annotations** - Include framework/tool names in labels
2. **Clear node IDs** - Use descriptive IDs that match the visual labels
3. **Relationship labels** - Add labels to non-obvious connections

### Subgraphs

1. **Named subgraphs** - Always provide descriptive titles
2. **Consistent boundaries** - Subgraphs represent real architectural boundaries
3. **Direction within subgraphs** - Use `direction LR` or `TB` for internal layout

---

## Complete Example: Full Platform Architecture

```mermaid
---
config:
  layout: elk
---
flowchart TB
    classDef user fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef interface fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef service fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef data fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef infra fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef security fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40
    classDef queue fill:#FCE4EC,stroke:#AD1457,stroke-width:2px,color:#880E4F
    classDef external fill:#ECEFF1,stroke:#455A64,stroke-width:2px,color:#263238

    subgraph Users["Users"]
        direction LR
        Analyst["Analyst"]:::user
        Developer["Developer"]:::user
        Ops["Operations"]:::user
    end

    subgraph Interfaces["Interfaces"]
        direction LR
        WebApp["Web App<br/>React + TypeScript"]:::interface
        SDK["Python SDK"]:::interface
        CLI["CLI"]:::interface
    end

    subgraph Platform["Platform Services"]
        subgraph Gateway["API Gateway"]
            Auth["Auth Middleware"]:::security
            Router["Request Router"]:::service
        end

        subgraph Core["Core Services"]
            direction LR
            ResourceSvc["Resource Service"]:::service
            ComputeSvc["Compute Service"]:::service
            DataSvc["Data Service"]:::service
        end

        subgraph Async["Async Processing"]
            Queue["Task Queue<br/>Redis"]:::queue
            Workers["Worker Pool"]:::service
        end
    end

    subgraph Infrastructure["Infrastructure (GCP)"]
        direction LR
        GKE["GKE Cluster"]:::infra
        CloudSQL[("Cloud SQL")]:::data
        GCS[("Cloud Storage")]:::data
        PubSub["Pub/Sub"]:::queue
    end

    subgraph External["External Systems"]
        direction LR
        DataSource[("Enterprise DW")]:::external
        IdP["SSO Provider"]:::external
    end

    Users --> Interfaces
    Interfaces --> Gateway
    Gateway --> Core
    Core --> Async
    Core --> Infrastructure
    Async --> Infrastructure
    Auth --> IdP
    DataSvc --> DataSource
    ComputeSvc --> GKE
    ResourceSvc --> CloudSQL
    DataSvc --> GCS
    Workers --> PubSub
```

---

## See Also

- [11-CAGLE-COLOR-SYSTEM.md](./11-CAGLE-COLOR-SYSTEM.md) - Complete color reference
- [13-DATA-FLOW-PATTERNS-GUIDE.md](./13-DATA-FLOW-PATTERNS-GUIDE.md) - Sequence and flow diagrams
- [14-DEPLOYMENT-ARCHITECTURE-GUIDE.md](./14-DEPLOYMENT-ARCHITECTURE-GUIDE.md) - Kubernetes and cloud patterns
- [15-TECHNICAL-DESIGN-PATTERNS.md](./15-TECHNICAL-DESIGN-PATTERNS.md) - Combining diagram types
