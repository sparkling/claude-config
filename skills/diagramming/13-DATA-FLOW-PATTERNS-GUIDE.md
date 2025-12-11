# Data Flow Patterns Guide

> **SKILL QUICK REF**: API flows→`sequenceDiagram` | Async/Queue→`flowchart LR` | Events→`flowchart TB` | Streaming→ELK | `rect rgb()` for phases | `classDef source|processor|sink|queue` | Saga patterns

## When to Use

- Synchronous API request/response flows
- Asynchronous message queue patterns
- Event-driven architecture (CQRS, Event Sourcing)
- Streaming data pipelines
- Saga patterns for distributed transactions
- Circuit breaker and retry flows

## Overview

This guide documents data flow visualization patterns using Mermaid diagrams, following Kurt Cagle's semantic visualization principles. Data flows are critical for understanding how information moves through systems—from user inputs to storage, from services to queues, and through complex event-driven architectures.

**Key Principle**: *"Data flow diagrams should reveal the temporal and spatial journey of information, making visible the transformations, validations, and decision points that occur along the way."*

---

## Cagle Color System for Data Flows

### Flow-Specific Semantic Colors

```
%% Data Flow Color System
%% Based on Cagle's semantic approach with analogous palette

%% Data States
classDef raw fill:#FFECB3,stroke:#FF8F00,stroke-width:2px,color:#E65100
classDef validated fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
classDef transformed fill:#B3E5FC,stroke:#0277BD,stroke-width:2px,color:#01579B
classDef stored fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100

%% Flow Participants
classDef source fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
classDef processor fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
classDef sink fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
classDef queue fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C

%% Flow Types
classDef sync fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
classDef async fill:#FCE4EC,stroke:#C2185B,stroke-width:2px,color:#880E4F
classDef batch fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40
classDef stream fill:#EDE7F6,stroke:#512DA8,stroke-width:2px,color:#311B92
```

### Sequence Diagram Theme for Data Flows

```yaml
%%{init: {
  "theme": "base",
  "themeVariables": {
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "actorTextColor": "#0D47A1",
    "actorLineColor": "#1565C0",
    "signalColor": "#37474F",
    "signalTextColor": "#263238",
    "noteBkgColor": "#FFF8E1",
    "noteTextColor": "#E65100",
    "noteBorderColor": "#F57F17",
    "activationBkgColor": "#E8F5E9",
    "activationBorderColor": "#2E7D32",
    "sequenceNumberColor": "#FFFFFF"
  }
}}%%
```

---

## Pattern 1: Synchronous API Request/Response

### Basic Request Flow

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "actorTextColor": "#0D47A1",
    "signalColor": "#37474F",
    "noteBkgColor": "#FFF8E1",
    "noteTextColor": "#E65100",
    "noteBorderColor": "#F57F17",
    "activationBkgColor": "#E8F5E9",
    "activationBorderColor": "#2E7D32"
  }
}}%%
sequenceDiagram
    autonumber
    participant C as Client
    participant G as API Gateway
    participant S as Service
    participant D as Database

    C->>+G: POST /api/resource
    Note over G: Validate JWT
    G->>+S: Forward Request
    Note over S: Business Logic
    S->>+D: Query/Mutation
    D-->>-S: Result Set
    S-->>-G: Response DTO
    G-->>-C: 200 OK + JSON
```

### REST CRUD Pattern

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "actorTextColor": "#0D47A1",
    "noteBkgColor": "#FFF8E1",
    "noteTextColor": "#E65100",
    "activationBkgColor": "#E8F5E9",
    "activationBorderColor": "#2E7D32"
  }
}}%%
sequenceDiagram
    autonumber
    participant UI as Web Client
    participant API as REST API
    participant Cache as Redis Cache
    participant DB as PostgreSQL

    rect rgb(227, 242, 253)
        Note over UI,DB: READ Operation (with caching)
        UI->>+API: GET /users/{id}
        API->>Cache: Check Cache
        alt Cache Hit
            Cache-->>API: Cached User
        else Cache Miss
            API->>+DB: SELECT * FROM users
            DB-->>-API: User Record
            API->>Cache: Store in Cache
        end
        API-->>-UI: 200 OK + User JSON
    end

    rect rgb(232, 245, 233)
        Note over UI,DB: CREATE Operation
        UI->>+API: POST /users
        Note over API: Validate Input
        API->>+DB: INSERT INTO users
        DB-->>-API: New User ID
        API->>Cache: Invalidate List Cache
        API-->>-UI: 201 Created + User
    end

    rect rgb(255, 248, 225)
        Note over UI,DB: UPDATE Operation
        UI->>+API: PUT /users/{id}
        API->>+DB: UPDATE users SET...
        DB-->>-API: Updated Record
        API->>Cache: Update Cache Entry
        API-->>-UI: 200 OK + Updated User
    end

    rect rgb(255, 205, 210)
        Note over UI,DB: DELETE Operation
        UI->>+API: DELETE /users/{id}
        API->>+DB: DELETE FROM users
        DB-->>-API: Confirmation
        API->>Cache: Remove from Cache
        API-->>-UI: 204 No Content
    end
```

---

## Pattern 2: Asynchronous Message Queue Flow

### Producer-Consumer Pattern

```mermaid
---
config:
  layout: elk
  elk:
    mergeEdges: false
    nodePlacementStrategy: BRANDES_KOEPF
---
flowchart LR
    %% Cagle Data Flow Colors
    classDef source fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef queue fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef processor fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef sink fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100

    subgraph Producers ["📤 Producers"]
        P1[Web API]:::source
        P2[Mobile API]:::source
        P3[Batch Job]:::source
    end

    subgraph MessageBroker ["📨 Message Broker"]
        Q1[/Order Queue/]:::queue
        Q2[/Notification Queue/]:::queue
        Q3[/Analytics Queue/]:::queue
    end

    subgraph Consumers ["📥 Consumers"]
        C1[Order Processor]:::processor
        C2[Email Service]:::processor
        C3[Analytics Engine]:::processor
    end

    subgraph Storage ["💾 Storage"]
        DB1[(Orders DB)]:::sink
        DB2[(Email Logs)]:::sink
        DB3[(Data Warehouse)]:::sink
    end

    P1 --> Q1
    P1 --> Q2
    P2 --> Q1
    P2 --> Q2
    P3 --> Q3

    Q1 --> C1
    Q2 --> C2
    Q3 --> C3

    C1 --> DB1
    C2 --> DB2
    C3 --> DB3
```

### Message Queue Sequence with Retry

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "noteBkgColor": "#FFF8E1",
    "noteTextColor": "#E65100",
    "activationBkgColor": "#E8F5E9"
  }
}}%%
sequenceDiagram
    autonumber
    participant P as Producer
    participant Q as Message Queue
    participant C as Consumer
    participant DLQ as Dead Letter Queue
    participant DB as Database

    P->>Q: Publish Message
    Note over Q: Message Persisted

    loop Retry Logic (max 3)
        Q->>+C: Deliver Message
        alt Processing Success
            C->>+DB: Persist Data
            DB-->>-C: Confirmed
            C-->>-Q: ACK
            Note over Q: Message Removed
        else Processing Failure
            C-->>Q: NACK
            Note over Q: Increment Retry Count
        end
    end

    alt Max Retries Exceeded
        Q->>DLQ: Move to DLQ
        Note over DLQ: Manual Review Required
    end
```

---

## Pattern 3: Event-Driven Architecture

### Event Sourcing Flow

```mermaid
---
config:
  layout: elk
---
flowchart TB
    %% Cagle Event Flow Colors
    classDef command fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef event fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef store fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef projection fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef handler fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C

    subgraph Commands ["📝 Commands"]
        CMD1[CreateOrder]:::command
        CMD2[UpdateOrder]:::command
        CMD3[CancelOrder]:::command
    end

    subgraph Aggregate ["🎯 Order Aggregate"]
        AGG[Order Domain Logic]:::handler
    end

    subgraph Events ["📢 Domain Events"]
        E1[OrderCreated]:::event
        E2[OrderUpdated]:::event
        E3[OrderCancelled]:::event
    end

    subgraph EventStore ["💾 Event Store"]
        ES[(Event Log)]:::store
    end

    subgraph Projections ["📊 Read Models"]
        P1[Orders List View]:::projection
        P2[Order Detail View]:::projection
        P3[Analytics View]:::projection
    end

    CMD1 --> AGG
    CMD2 --> AGG
    CMD3 --> AGG

    AGG --> E1
    AGG --> E2
    AGG --> E3

    E1 --> ES
    E2 --> ES
    E3 --> ES

    ES --> P1
    ES --> P2
    ES --> P3
```

### CQRS Pattern

```mermaid
---
config:
  layout: elk
  elk:
    mergeEdges: false
---
flowchart LR
    %% Cagle CQRS Colors
    classDef user fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef command fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef query fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef event fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef store fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100

    User[User]:::user

    subgraph WriteStack ["✏️ Write Side (Commands)"]
        direction TB
        CmdAPI[Command API]:::command
        CmdHandler[Command Handler]:::command
        WriteDB[(Write Database)]:::store
    end

    subgraph EventBus ["📡 Event Bus"]
        EB[Domain Events]:::event
    end

    subgraph ReadStack ["📖 Read Side (Queries)"]
        direction TB
        QueryAPI[Query API]:::query
        Projector[Event Projector]:::query
        ReadDB[(Read Database)]:::store
    end

    User -->|Commands| CmdAPI
    CmdAPI --> CmdHandler
    CmdHandler --> WriteDB
    CmdHandler --> EB
    EB --> Projector
    Projector --> ReadDB
    ReadDB --> QueryAPI
    QueryAPI -->|Queries| User
```

---

## Pattern 4: Streaming Data Pipeline

### Real-Time Stream Processing

```mermaid
---
config:
  layout: elk
---
flowchart LR
    %% Cagle Stream Colors
    classDef source fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef stream fill:#EDE7F6,stroke:#512DA8,stroke-width:2px,color:#311B92
    classDef processor fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef sink fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef alert fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#B71C1C

    subgraph Sources ["📡 Data Sources"]
        S1[IoT Sensors]:::source
        S2[User Clickstream]:::source
        S3[Transaction Feed]:::source
    end

    subgraph Ingestion ["📥 Ingestion Layer"]
        K1[/Kafka Topic: raw-events/]:::stream
    end

    subgraph Processing ["⚙️ Stream Processing"]
        direction TB
        F1[Filter Invalid]:::processor
        T1[Transform/Enrich]:::processor
        A1[Aggregate Windows]:::processor
    end

    subgraph Output ["📤 Output Sinks"]
        DB[(Time Series DB)]:::sink
        RT[Real-Time Dashboard]:::sink
        AL[Alert System]:::alert
    end

    S1 --> K1
    S2 --> K1
    S3 --> K1

    K1 --> F1
    F1 --> T1
    T1 --> A1

    A1 --> DB
    A1 --> RT
    A1 -->|Threshold Breach| AL
```

### Kafka Consumer Group Pattern

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "actorBkg": "#EDE7F6",
    "actorBorder": "#512DA8",
    "actorTextColor": "#311B92",
    "noteBkgColor": "#FFF8E1",
    "noteTextColor": "#E65100",
    "activationBkgColor": "#E8F5E9"
  }
}}%%
sequenceDiagram
    autonumber
    participant P as Producer
    participant T as Kafka Topic
    participant CG as Consumer Group
    participant C1 as Consumer 1
    participant C2 as Consumer 2
    participant C3 as Consumer 3

    Note over T: 6 Partitions

    P->>T: Publish Events

    rect rgb(237, 231, 246)
        Note over CG,C3: Partition Assignment
        T->>CG: Partitions [0,1,2,3,4,5]
        CG->>C1: Assigned [0,1]
        CG->>C2: Assigned [2,3]
        CG->>C3: Assigned [4,5]
    end

    par Parallel Processing
        T->>C1: Events from P0, P1
        T->>C2: Events from P2, P3
        T->>C3: Events from P4, P5
    end

    Note over C1,C3: Commit Offsets

    rect rgb(255, 205, 210)
        Note over CG,C3: Consumer Failure & Rebalance
        C2--xCG: Consumer 2 Failed
        CG->>C1: Reassigned [0,1,2]
        CG->>C3: Reassigned [3,4,5]
    end
```

---

## Pattern 5: Batch Processing Flow

### ETL Pipeline

```mermaid
---
config:
  layout: elk
---
flowchart LR
    %% Cagle ETL Colors
    classDef extract fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef transform fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef load fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef validate fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40
    classDef error fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#B71C1C

    subgraph Extract ["📥 Extract"]
        E1[(Source DB)]:::extract
        E2[CSV Files]:::extract
        E3[API Endpoints]:::extract
    end

    subgraph Transform ["⚙️ Transform"]
        direction TB
        V1{Validate Schema}:::validate
        T1[Clean & Normalize]:::transform
        T2[Apply Business Rules]:::transform
        T3[Aggregate & Join]:::transform
        ERR[Error Records]:::error
    end

    subgraph Load ["📤 Load"]
        L1[(Data Warehouse)]:::load
        L2[(Data Lake)]:::load
        L3[BI Reports]:::load
    end

    E1 --> V1
    E2 --> V1
    E3 --> V1

    V1 -->|Valid| T1
    V1 -->|Invalid| ERR
    T1 --> T2
    T2 --> T3

    T3 --> L1
    T3 --> L2
    L1 --> L3
```

### Batch Job State Machine

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E1F5FE",
    "primaryTextColor": "#01579B",
    "primaryBorderColor": "#0277BD",
    "lineColor": "#37474F"
  }
}}%%
stateDiagram-v2
    classDef pending fill:#FFF9C4,stroke:#F9A825,color:#F57F17
    classDef running fill:#BBDEFB,stroke:#1565C0,color:#0D47A1
    classDef success fill:#C8E6C9,stroke:#2E7D32,color:#1B5E20
    classDef failed fill:#FFCDD2,stroke:#C62828,color:#B71C1C
    classDef retry fill:#E1BEE7,stroke:#7B1FA2,color:#4A148C

    [*] --> Scheduled

    state "Scheduled" as Scheduled
    state "Running" as Running
    state "Completed" as Completed
    state "Failed" as Failed
    state "Retrying" as Retrying

    Scheduled --> Running : trigger
    Running --> Completed : success
    Running --> Failed : error
    Failed --> Retrying : retry_policy
    Retrying --> Running : attempt
    Retrying --> Failed : max_retries
    Completed --> [*]
    Failed --> [*] : abandon

    class Scheduled pending
    class Running running
    class Completed success
    class Failed failed
    class Retrying retry
```

---

## Pattern 6: API Gateway Flow

### Gateway Routing Pattern

```mermaid
---
config:
  layout: elk
---
flowchart TB
    %% Cagle Gateway Colors
    classDef client fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef gateway fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef auth fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40
    classDef service fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef cache fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100

    subgraph Clients ["👥 Clients"]
        WEB[Web App]:::client
        MOB[Mobile App]:::client
        IOT[IoT Device]:::client
    end

    subgraph Gateway ["🚪 API Gateway"]
        direction TB
        LB[Load Balancer]:::gateway
        AUTH[Auth Middleware]:::auth
        RL[Rate Limiter]:::gateway
        CACHE[Response Cache]:::cache
        ROUTER[Request Router]:::gateway
    end

    subgraph Services ["🔧 Microservices"]
        US[User Service]:::service
        OS[Order Service]:::service
        PS[Product Service]:::service
        NS[Notification Service]:::service
    end

    WEB --> LB
    MOB --> LB
    IOT --> LB

    LB --> AUTH
    AUTH --> RL
    RL --> CACHE
    CACHE --> ROUTER

    ROUTER --> US
    ROUTER --> OS
    ROUTER --> PS
    ROUTER --> NS
```

### API Gateway Sequence

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "noteBkgColor": "#FFF8E1",
    "activationBkgColor": "#E8F5E9"
  }
}}%%
sequenceDiagram
    autonumber
    participant C as Client
    participant GW as API Gateway
    participant Auth as Auth Service
    participant Cache as Redis
    participant Svc as Backend Service

    C->>+GW: Request + API Key

    rect rgb(224, 242, 241)
        Note over GW,Auth: Authentication Phase
        GW->>+Auth: Validate Token
        Auth-->>-GW: Token Valid + Claims
    end

    rect rgb(255, 248, 225)
        Note over GW,Cache: Caching Phase
        GW->>Cache: Check Cache Key
        alt Cache Hit
            Cache-->>GW: Cached Response
            GW-->>C: 200 OK (Cached)
        else Cache Miss
            rect rgb(232, 245, 233)
                Note over GW,Svc: Service Call
                GW->>+Svc: Forward Request
                Svc-->>-GW: Response
            end
            GW->>Cache: Store Response
            GW-->>C: 200 OK
        end
    end

    deactivate GW
```

---

## Pattern 7: Saga Pattern for Distributed Transactions

### Choreography-Based Saga

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "noteBkgColor": "#FFF8E1",
    "activationBkgColor": "#E8F5E9"
  }
}}%%
sequenceDiagram
    autonumber
    participant OS as Order Service
    participant EB as Event Bus
    participant PS as Payment Service
    participant IS as Inventory Service
    participant SS as Shipping Service

    rect rgb(232, 245, 233)
        Note over OS,SS: Happy Path - Order Saga
        OS->>EB: OrderCreated
        EB->>PS: OrderCreated
        PS->>EB: PaymentCompleted
        EB->>IS: PaymentCompleted
        IS->>EB: InventoryReserved
        EB->>SS: InventoryReserved
        SS->>EB: ShipmentScheduled
        EB->>OS: ShipmentScheduled
        Note over OS: Order Completed
    end

    rect rgb(255, 205, 210)
        Note over OS,SS: Compensation - Payment Failed
        OS->>EB: OrderCreated
        EB->>PS: OrderCreated
        PS->>EB: PaymentFailed
        EB->>OS: PaymentFailed
        Note over OS: Order Cancelled
    end

    rect rgb(255, 248, 225)
        Note over OS,SS: Compensation - Inventory Failed
        OS->>EB: OrderCreated
        EB->>PS: OrderCreated
        PS->>EB: PaymentCompleted
        EB->>IS: PaymentCompleted
        IS->>EB: InsufficientInventory
        EB->>PS: InsufficientInventory
        PS->>EB: PaymentRefunded
        EB->>OS: PaymentRefunded
        Note over OS: Order Cancelled + Refund
    end
```

### Orchestration-Based Saga

```mermaid
---
config:
  layout: elk
---
flowchart TB
    %% Cagle Saga Colors
    classDef orchestrator fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef service fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef compensate fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#B71C1C
    classDef success fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20

    ORCH[Saga Orchestrator]:::orchestrator

    subgraph Step1 ["Step 1: Create Order"]
        S1[Order Service]:::service
        C1[Cancel Order]:::compensate
    end

    subgraph Step2 ["Step 2: Process Payment"]
        S2[Payment Service]:::service
        C2[Refund Payment]:::compensate
    end

    subgraph Step3 ["Step 3: Reserve Inventory"]
        S3[Inventory Service]:::service
        C3[Release Inventory]:::compensate
    end

    subgraph Step4 ["Step 4: Schedule Shipping"]
        S4[Shipping Service]:::service
        C4[Cancel Shipment]:::compensate
    end

    DONE[Saga Complete]:::success

    ORCH -->|1. Create| S1
    S1 -->|Success| ORCH
    S1 -.->|Fail| C1

    ORCH -->|2. Pay| S2
    S2 -->|Success| ORCH
    S2 -.->|Fail| C2
    C2 -.-> C1

    ORCH -->|3. Reserve| S3
    S3 -->|Success| ORCH
    S3 -.->|Fail| C3
    C3 -.-> C2

    ORCH -->|4. Ship| S4
    S4 -->|Success| DONE
    S4 -.->|Fail| C4
    C4 -.-> C3
```

---

## Pattern 8: Data Validation Pipeline

### Multi-Stage Validation Flow

```mermaid
---
config:
  layout: elk
---
flowchart LR
    %% Cagle Validation Colors
    classDef input fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef validate fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40
    classDef transform fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef output fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef error fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#B71C1C
    classDef warning fill:#FFF9C4,stroke:#F9A825,stroke-width:2px,color:#F57F17

    INPUT[Raw Input]:::input

    subgraph Validation ["🔍 Validation Pipeline"]
        direction TB
        V1{Schema Validation}:::validate
        V2{Type Coercion}:::validate
        V3{Business Rules}:::validate
        V4{Cross-Field Validation}:::validate
    end

    subgraph Results ["📊 Results"]
        VALID[Valid Record]:::output
        WARN[Warnings]:::warning
        ERR[Errors]:::error
    end

    TRANSFORM[Transformed Data]:::transform
    OUTPUT[(Target System)]:::output

    INPUT --> V1
    V1 -->|Pass| V2
    V1 -->|Fail| ERR
    V2 -->|Pass| V3
    V2 -->|Coerced| WARN
    V2 -->|Fail| ERR
    V3 -->|Pass| V4
    V3 -->|Fail| ERR
    V4 -->|Pass| VALID
    V4 -->|Fail| ERR

    VALID --> TRANSFORM
    WARN --> TRANSFORM
    TRANSFORM --> OUTPUT
```

---

## Pattern 9: Circuit Breaker Flow

### Circuit Breaker State Machine

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#E1F5FE",
    "primaryTextColor": "#01579B",
    "primaryBorderColor": "#0277BD"
  }
}}%%
stateDiagram-v2
    classDef closed fill:#C8E6C9,stroke:#2E7D32,color:#1B5E20
    classDef open fill:#FFCDD2,stroke:#C62828,color:#B71C1C
    classDef halfopen fill:#FFF9C4,stroke:#F9A825,color:#F57F17

    [*] --> Closed

    state "Closed" as Closed {
        [*] --> Monitoring
        Monitoring --> Monitoring : success
        Monitoring --> FailureCount : failure
        FailureCount --> Monitoring : below_threshold
    }

    state "Open" as Open {
        [*] --> Rejecting
        Rejecting --> Rejecting : request (fast fail)
        Rejecting --> Timeout : timer_elapsed
    }

    state "Half-Open" as HalfOpen {
        [*] --> Testing
        Testing --> Testing : limited_requests
    }

    Closed --> Open : threshold_exceeded
    Open --> HalfOpen : timeout_elapsed
    HalfOpen --> Closed : success
    HalfOpen --> Open : failure

    class Closed closed
    class Open open
    class HalfOpen halfopen
```

### Circuit Breaker Sequence

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "noteBkgColor": "#FFF8E1",
    "activationBkgColor": "#E8F5E9"
  }
}}%%
sequenceDiagram
    autonumber
    participant C as Client
    participant CB as Circuit Breaker
    participant S as Service

    rect rgb(200, 230, 201)
        Note over CB: State: CLOSED
        C->>CB: Request 1
        CB->>+S: Forward
        S-->>-CB: Success
        CB-->>C: Response
    end

    rect rgb(255, 205, 210)
        Note over CB: Failures Accumulate
        C->>CB: Request 2
        CB->>S: Forward
        S--xCB: Timeout
        CB-->>C: Error (failure_count=1)

        C->>CB: Request 3
        CB->>S: Forward
        S--xCB: Timeout
        CB-->>C: Error (failure_count=2)

        C->>CB: Request 4
        CB->>S: Forward
        S--xCB: Timeout
        Note over CB: threshold=3 exceeded
        CB-->>C: Error
    end

    rect rgb(255, 236, 179)
        Note over CB: State: OPEN
        C->>CB: Request 5
        CB-->>C: Fast Fail (circuit open)
        Note over CB: No call to service

        C->>CB: Request 6
        CB-->>C: Fast Fail (circuit open)
    end

    rect rgb(255, 249, 196)
        Note over CB: Timeout elapsed → State: HALF-OPEN
        C->>CB: Request 7 (probe)
        CB->>+S: Forward (limited)
        S-->>-CB: Success
        Note over CB: State: CLOSED
        CB-->>C: Response
    end
```

---

## Pattern 10: Data Replication Flow

### Master-Replica Synchronization

```mermaid
---
config:
  layout: elk
---
flowchart TB
    %% Cagle Replication Colors
    classDef master fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef replica fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef sync fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef app fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100

    subgraph Application ["📱 Application Layer"]
        W[Write Operations]:::app
        R[Read Operations]:::app
    end

    subgraph Primary ["🔵 Primary Region"]
        M[(Master DB)]:::master
    end

    subgraph Replicas ["🟢 Read Replicas"]
        R1[(Replica 1)]:::replica
        R2[(Replica 2)]:::replica
        R3[(Replica 3)]:::replica
    end

    subgraph Replication ["🔄 Replication"]
        SYNC[Sync Process]:::sync
    end

    W -->|All Writes| M
    M --> SYNC
    SYNC -->|Async Replication| R1
    SYNC -->|Async Replication| R2
    SYNC -->|Async Replication| R3

    R1 -->|Reads| R
    R2 -->|Reads| R
    R3 -->|Reads| R
```

---

## Colored Region Reference

### Standard Flow Phases

Use `rect` blocks to highlight different phases:

```mermaid
sequenceDiagram
    participant A as Service A
    participant B as Service B
    participant C as Service C

    rect rgb(227, 242, 253)
        Note over A,C: 🔵 Initialization Phase
        A->>B: Initialize
        B->>C: Setup
    end

    rect rgb(232, 245, 233)
        Note over A,C: 🟢 Processing Phase
        A->>B: Process Data
        B->>C: Transform
        C-->>B: Result
        B-->>A: Complete
    end

    rect rgb(255, 248, 225)
        Note over A,C: 🟡 Finalization Phase
        A->>B: Cleanup
        B->>C: Release Resources
    end
```

### Phase Color Reference

| Phase | RGB Value | Hex Equivalent | Use Case |
|-------|-----------|----------------|----------|
| **Initialization** | `rgb(227, 242, 253)` | `#E3F2FD` | Setup, connection, auth |
| **Processing** | `rgb(232, 245, 233)` | `#E8F5E9` | Main operation, success path |
| **Data Operations** | `rgb(255, 248, 225)` | `#FFF8E1` | Database, storage, persistence |
| **Error Handling** | `rgb(255, 205, 210)` | `#FFCDD2` | Failures, exceptions, rollback |
| **Warning/Caution** | `rgb(255, 249, 196)` | `#FFF9C4` | Retry, degraded, warnings |
| **Security** | `rgb(224, 242, 241)` | `#E0F2F1` | Auth, encryption, validation |
| **Async/Background** | `rgb(237, 231, 246)` | `#EDE7F6` | Queue, stream, async processing |

---

## Quick Reference

### Copy-Paste Data Flow classDef Block

```
%% Cagle Data Flow Color System

%% Data States
classDef raw fill:#FFECB3,stroke:#FF8F00,stroke-width:2px,color:#E65100
classDef validated fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
classDef transformed fill:#B3E5FC,stroke:#0277BD,stroke-width:2px,color:#01579B
classDef stored fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100

%% Flow Participants
classDef source fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
classDef processor fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
classDef sink fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
classDef queue fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C

%% Flow Types
classDef sync fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
classDef async fill:#FCE4EC,stroke:#C2185B,stroke-width:2px,color:#880E4F
classDef batch fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40
classDef stream fill:#EDE7F6,stroke:#512DA8,stroke-width:2px,color:#311B92

%% Status
classDef success fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
classDef error fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#B71C1C
classDef warning fill:#FFF9C4,stroke:#F9A825,stroke-width:2px,color:#F57F17
```

### Sequence Diagram Theme Configuration

```yaml
%%{init: {
  "theme": "base",
  "themeVariables": {
    "actorBkg": "#E3F2FD",
    "actorBorder": "#1565C0",
    "actorTextColor": "#0D47A1",
    "actorLineColor": "#1565C0",
    "signalColor": "#37474F",
    "signalTextColor": "#263238",
    "noteBkgColor": "#FFF8E1",
    "noteTextColor": "#E65100",
    "noteBorderColor": "#F57F17",
    "activationBkgColor": "#E8F5E9",
    "activationBorderColor": "#2E7D32",
    "sequenceNumberColor": "#FFFFFF"
  }
}}%%
```

---

## References

- Cagle, Kurt. "RDF, Graphs and Mermaid Diagrams" - LinkedIn
- [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/)
- [Mermaid Sequence Diagram Documentation](https://mermaid.js.org/syntax/sequenceDiagram.html)
- [Microsoft Cloud Design Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/)
