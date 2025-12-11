# Deployment Architecture Guide

> **SKILL QUICK REF**: K8s→`flowchart TB` + ELK • Cloud regions→nested subgraphs • CI/CD→`flowchart LR` or `sequenceDiagram` • `classDef cluster|namespace|pod|service|ingress|storage` • HA/DR patterns

## When to Use

- Cloud infrastructure topology (multi-region, VPC)
- Kubernetes architecture (clusters, namespaces, pods)
- CI/CD pipeline visualization
- Container and service mesh architecture
- Monitoring and observability stacks
- High availability and disaster recovery

## Overview

This guide documents deployment and infrastructure visualization patterns using Mermaid diagrams, following Kurt Cagle's semantic visualization principles. Deployment diagrams illustrate how software systems are deployed to hardware, cloud infrastructure, containers, and orchestration platforms.

**Key Principle**: *"Deployment architecture diagrams should reveal the physical and logical topology of systems, showing how components are distributed across infrastructure and how they communicate."*

---

## Cagle Color System for Deployment

### Infrastructure Semantic Colors

```
%% Deployment Architecture Color System
%% Based on Cagle's semantic approach with infrastructure focus

%% Cloud & Platform
classDef cloud fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
classDef region fill:#BBDEFB,stroke:#1976D2,stroke-width:2px,color:#0D47A1
classDef zone fill:#90CAF9,stroke:#1E88E5,stroke-width:2px,color:#0D47A1

%% Kubernetes Resources
classDef cluster fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
classDef namespace fill:#C8E6C9,stroke:#43A047,stroke-width:2px,color:#1B5E20
classDef pod fill:#A5D6A7,stroke:#66BB6A,stroke-width:2px,color:#1B5E20
classDef service fill:#81C784,stroke:#4CAF50,stroke-width:2px,color:#1B5E20

%% Containers & Runtime
classDef container fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
classDef image fill:#B3E5FC,stroke:#039BE5,stroke-width:2px,color:#01579B

%% Networking
classDef network fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
classDef loadbalancer fill:#E1BEE7,stroke:#8E24AA,stroke-width:2px,color:#4A148C
classDef ingress fill:#CE93D8,stroke:#AB47BC,stroke-width:2px,color:#4A148C

%% Storage
classDef storage fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
classDef volume fill:#FFECB3,stroke:#FFA000,stroke-width:2px,color:#E65100
classDef database fill:#FFE082,stroke:#FFB300,stroke-width:2px,color:#E65100

%% Security
classDef security fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40
classDef firewall fill:#B2DFDB,stroke:#00897B,stroke-width:2px,color:#004D40

%% CI/CD
classDef pipeline fill:#EDE7F6,stroke:#512DA8,stroke-width:2px,color:#311B92
classDef stage fill:#D1C4E9,stroke:#673AB7,stroke-width:2px,color:#311B92
classDef artifact fill:#B39DDB,stroke:#7E57C2,stroke-width:2px,color:#311B92
```

---

## Pattern 1: Cloud Infrastructure Topology

### Multi-Region Architecture

```mermaid
---
config:
  layout: elk
  elk:
    mergeEdges: false
    nodePlacementStrategy: BRANDES_KOEPF
---
flowchart TB
    %% Cagle Cloud Colors
    classDef cloud fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef region fill:#BBDEFB,stroke:#1976D2,stroke-width:2px,color:#0D47A1
    classDef zone fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef storage fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef network fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef user fill:#ECEFF1,stroke:#455A64,stroke-width:2px,color:#263238

    Users[Global Users]:::user
    GLB[Global Load Balancer]:::network
    CDN[CDN Edge Network]:::network

    subgraph GCP ["☁️ Google Cloud Platform"]
        subgraph US ["🇺🇸 us-central1"]
            US_LB[Regional LB]:::network
            subgraph US_A ["Zone A"]
                US_GKE_A[GKE Cluster]:::zone
            end
            subgraph US_B ["Zone B"]
                US_GKE_B[GKE Cluster]:::zone
            end
            US_SQL[(Cloud SQL)]:::storage
            US_GCS[Cloud Storage]:::storage
        end

        subgraph EU ["🇪🇺 europe-west1"]
            EU_LB[Regional LB]:::network
            subgraph EU_A ["Zone A"]
                EU_GKE_A[GKE Cluster]:::zone
            end
            subgraph EU_B ["Zone B"]
                EU_GKE_B[GKE Cluster]:::zone
            end
            EU_SQL[(Cloud SQL)]:::storage
            EU_GCS[Cloud Storage]:::storage
        end

        subgraph APAC ["🌏 asia-east1"]
            APAC_LB[Regional LB]:::network
            subgraph APAC_A ["Zone A"]
                APAC_GKE_A[GKE Cluster]:::zone
            end
            APAC_SQL[(Cloud SQL)]:::storage
        end
    end

    Users --> CDN
    CDN --> GLB
    GLB --> US_LB
    GLB --> EU_LB
    GLB --> APAC_LB

    US_LB --> US_GKE_A
    US_LB --> US_GKE_B
    EU_LB --> EU_GKE_A
    EU_LB --> EU_GKE_B
    APAC_LB --> APAC_GKE_A

    US_GKE_A --> US_SQL
    US_GKE_B --> US_SQL
    EU_GKE_A --> EU_SQL
    EU_GKE_B --> EU_SQL
    APAC_GKE_A --> APAC_SQL

    US_SQL -.->|Replication| EU_SQL
    EU_SQL -.->|Replication| APAC_SQL
```

### VPC Network Architecture

```mermaid
---
config:
  layout: elk
---
flowchart TB
    %% Cagle Network Colors
    classDef vpc fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef subnet fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef firewall fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40
    classDef nat fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef instance fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100

    INET[Internet]

    subgraph VPC ["🔒 Production VPC (10.0.0.0/16)"]
        FW[Cloud Firewall]:::firewall
        NAT[Cloud NAT]:::nat

        subgraph PubSubnet ["📡 Public Subnet (10.0.1.0/24)"]
            LB[Load Balancer]:::subnet
            BASTION[Bastion Host]:::instance
        end

        subgraph AppSubnet ["🔧 Application Subnet (10.0.2.0/24)"]
            APP1[App Server 1]:::instance
            APP2[App Server 2]:::instance
            APP3[App Server 3]:::instance
        end

        subgraph DataSubnet ["💾 Data Subnet (10.0.3.0/24)"]
            DB1[(Primary DB)]:::instance
            DB2[(Replica DB)]:::instance
            CACHE[Redis Cache]:::instance
        end
    end

    INET --> FW
    FW --> LB
    FW --> BASTION
    LB --> APP1
    LB --> APP2
    LB --> APP3
    APP1 --> DB1
    APP2 --> DB1
    APP3 --> DB1
    DB1 -.-> DB2
    APP1 --> CACHE
    APP2 --> CACHE
    APP3 --> CACHE
    AppSubnet --> NAT
    NAT --> INET
```

---

## Pattern 2: Kubernetes Architecture

### GKE Cluster Topology

```mermaid
---
config:
  layout: elk
---
flowchart TB
    %% Cagle K8s Colors
    classDef cluster fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef control fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef node fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef pod fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef service fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C

    subgraph GKE ["☸️ GKE Cluster"]
        subgraph ControlPlane ["🎛️ Control Plane (Managed)"]
            API[API Server]:::control
            ETCD[(etcd)]:::control
            SCHED[Scheduler]:::control
            CM[Controller Manager]:::control
        end

        subgraph NodePool1 ["📦 Node Pool: General (n2-standard-4)"]
            N1[Node 1]:::node
            N2[Node 2]:::node
            N3[Node 3]:::node
        end

        subgraph NodePool2 ["🚀 Node Pool: High-Memory (n2-highmem-8)"]
            N4[Node 4]:::node
            N5[Node 5]:::node
        end

        subgraph NodePool3 ["⚡ Node Pool: GPU (a2-highgpu-1g)"]
            N6[GPU Node 1]:::node
        end
    end

    API --> ETCD
    API --> SCHED
    API --> CM
    SCHED --> N1
    SCHED --> N2
    SCHED --> N3
    SCHED --> N4
    SCHED --> N5
    SCHED --> N6
```

### Namespace Organization

```mermaid
---
config:
  layout: elk
---
flowchart LR
    %% Cagle Namespace Colors
    classDef system fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#B71C1C
    classDef infra fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef app fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef data fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef monitor fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C

    subgraph Cluster ["☸️ Kubernetes Cluster"]
        subgraph kube-system ["🔴 kube-system"]
            DNS[CoreDNS]:::system
            PROXY[kube-proxy]:::system
            CNI[Calico CNI]:::system
        end

        subgraph istio-system ["🔵 istio-system"]
            ISTIOD[istiod]:::infra
            INGRESS[Istio Ingress]:::infra
            EGRESS[Istio Egress]:::infra
        end

        subgraph app-prod ["🟢 app-prod"]
            API[API Pods]:::app
            WEB[Web Pods]:::app
            WORKER[Worker Pods]:::app
        end

        subgraph data-prod ["🟡 data-prod"]
            PG[(PostgreSQL)]:::data
            REDIS[(Redis)]:::data
            KAFKA[Kafka]:::data
        end

        subgraph monitoring ["🟣 monitoring"]
            PROM[Prometheus]:::monitor
            GRAF[Grafana]:::monitor
            ALERT[Alertmanager]:::monitor
        end
    end

    INGRESS --> API
    INGRESS --> WEB
    API --> PG
    API --> REDIS
    WORKER --> KAFKA
    PROM --> API
    PROM --> WEB
    PROM --> WORKER
```

### Pod Architecture Detail

```mermaid
---
config:
  layout: elk
---
flowchart TB
    %% Cagle Pod Colors
    classDef pod fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef container fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef init fill:#FFF9C4,stroke:#F9A825,stroke-width:2px,color:#F57F17
    classDef sidecar fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef volume fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef service fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1

    SVC[Service: api-service]:::service

    subgraph Pod ["📦 Pod: api-deployment-xyz"]
        subgraph InitContainers ["⏳ Init Containers"]
            INIT1[db-migrator]:::init
            INIT2[config-loader]:::init
        end

        subgraph Containers ["🐳 Containers"]
            MAIN[api-server :8080]:::container
            SIDECAR1[istio-proxy :15001]:::sidecar
            SIDECAR2[filebeat :5066]:::sidecar
        end

        subgraph Volumes ["💾 Volumes"]
            VOL1[config-volume]:::volume
            VOL2[secret-volume]:::volume
            VOL3[log-volume]:::volume
        end
    end

    ConfigMap[ConfigMap: api-config]:::service
    Secret[Secret: api-secrets]:::service
    PVC[PVC: logs-pvc]:::service

    SVC --> Pod
    INIT1 --> INIT2
    INIT2 --> MAIN
    MAIN --> SIDECAR1
    MAIN --> SIDECAR2
    ConfigMap --> VOL1
    Secret --> VOL2
    PVC --> VOL3
    VOL1 --> MAIN
    VOL2 --> MAIN
    VOL3 --> SIDECAR2
```

---

## Pattern 3: CI/CD Pipeline Architecture

### GitOps Deployment Pipeline

```mermaid
---
config:
  layout: elk
---
flowchart LR
    %% Cagle CI/CD Colors
    classDef source fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef build fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef test fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef artifact fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef deploy fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef env fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40

    subgraph Source ["📝 Source"]
        GIT[GitHub Repository]:::source
        PR[Pull Request]:::source
    end

    subgraph CI ["🔨 CI Pipeline"]
        BUILD[Build & Compile]:::build
        UNIT[Unit Tests]:::test
        LINT[Lint & SAST]:::test
        IMG[Build Image]:::build
    end

    subgraph Registry ["📦 Artifact Registry"]
        GAR[Google Artifact Registry]:::artifact
        HELM[Helm Charts]:::artifact
    end

    subgraph CD ["🚀 CD Pipeline (ArgoCD)"]
        ARGO[ArgoCD]:::deploy
        SYNC[Sync Controller]:::deploy
    end

    subgraph Environments ["🌍 Environments"]
        DEV[Development]:::env
        STG[Staging]:::env
        PROD[Production]:::env
    end

    GIT -->|push| BUILD
    PR -->|webhook| BUILD
    BUILD --> UNIT
    UNIT --> LINT
    LINT --> IMG
    IMG --> GAR
    IMG --> HELM
    GAR --> ARGO
    HELM --> ARGO
    ARGO --> SYNC
    SYNC --> DEV
    DEV -->|promote| STG
    STG -->|promote| PROD
```

### Detailed CI/CD Sequence

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
    participant DEV as Developer
    participant GH as GitHub
    participant CI as Cloud Build
    participant GAR as Artifact Registry
    participant ARGO as ArgoCD
    participant K8S as Kubernetes

    rect rgb(227, 242, 253)
        Note over DEV,GH: Code Commit Phase
        DEV->>GH: git push feature-branch
        GH->>GH: Create PR
        GH->>CI: Trigger CI (webhook)
    end

    rect rgb(232, 245, 233)
        Note over CI,GAR: Build & Test Phase
        CI->>CI: Checkout Code
        CI->>CI: Install Dependencies
        CI->>CI: Run Unit Tests
        CI->>CI: Run Linting
        CI->>CI: Security Scan (SAST)
        CI->>CI: Build Container Image
        CI->>GAR: Push Image (tag: sha-abc123)
        CI->>GH: Report Status ✓
    end

    rect rgb(255, 248, 225)
        Note over GH,ARGO: Merge & Deploy Phase
        DEV->>GH: Merge PR to main
        GH->>GH: Update manifests (image tag)
        ARGO->>GH: Detect manifest change
        ARGO->>ARGO: Calculate diff
    end

    rect rgb(232, 245, 233)
        Note over ARGO,K8S: Deployment Phase
        ARGO->>K8S: Apply manifests (dev)
        K8S->>GAR: Pull image
        K8S->>K8S: Rolling update
        K8S-->>ARGO: Deployment healthy
    end

    rect rgb(224, 242, 241)
        Note over ARGO,K8S: Promotion Phase
        ARGO->>K8S: Sync to staging
        K8S-->>ARGO: Staging healthy
        Note over ARGO: Manual approval
        ARGO->>K8S: Sync to production
        K8S-->>ARGO: Production healthy
    end
```

### Multi-Stage Pipeline

```mermaid
flowchart TB
    %% Cagle Pipeline Colors
    classDef trigger fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef build fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef test fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef security fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40
    classDef deploy fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef gate fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef success fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef fail fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#B71C1C

    START[Git Push]:::trigger

    subgraph Build ["🔨 Build Stage"]
        B1[Checkout]:::build
        B2[Dependencies]:::build
        B3[Compile]:::build
        B4[Build Image]:::build
    end

    subgraph Test ["🧪 Test Stage"]
        T1[Unit Tests]:::test
        T2[Integration Tests]:::test
        T3[E2E Tests]:::test
    end

    subgraph Security ["🔒 Security Stage"]
        S1[SAST Scan]:::security
        S2[Dependency Scan]:::security
        S3[Container Scan]:::security
    end

    GATE1{Quality Gate}:::gate

    subgraph DeployDev ["🚀 Deploy Dev"]
        D1[Push to Registry]:::deploy
        D2[Deploy to Dev]:::deploy
        D3[Smoke Tests]:::test
    end

    GATE2{Approval}:::gate

    subgraph DeployProd ["🌟 Deploy Prod"]
        P1[Deploy to Staging]:::deploy
        P2[Performance Tests]:::test
        P3[Deploy to Prod]:::deploy
    end

    SUCCESS[Pipeline Success]:::success
    FAILURE[Pipeline Failed]:::fail

    START --> B1 --> B2 --> B3 --> B4
    B4 --> T1 & S1
    T1 --> T2 --> T3
    S1 --> S2 --> S3
    T3 --> GATE1
    S3 --> GATE1
    GATE1 -->|Pass| D1
    GATE1 -->|Fail| FAILURE
    D1 --> D2 --> D3
    D3 --> GATE2
    GATE2 -->|Approved| P1
    GATE2 -->|Rejected| FAILURE
    P1 --> P2 --> P3 --> SUCCESS
```

---

## Pattern 4: Container Architecture

### Microservices Container Deployment

```mermaid
---
config:
  layout: elk
---
flowchart TB
    %% Cagle Container Colors
    classDef ingress fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef api fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef service fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef worker fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef data fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef queue fill:#EDE7F6,stroke:#512DA8,stroke-width:2px,color:#311B92

    LB[Load Balancer]:::ingress
    ING[Ingress Controller]:::ingress

    subgraph APIGateway ["🚪 API Gateway"]
        GW1[Gateway Pod 1]:::api
        GW2[Gateway Pod 2]:::api
    end

    subgraph Services ["🔧 Microservices"]
        subgraph UserSvc ["User Service"]
            U1[user-svc:v2.1]:::service
            U2[user-svc:v2.1]:::service
            U3[user-svc:v2.1]:::service
        end

        subgraph OrderSvc ["Order Service"]
            O1[order-svc:v3.0]:::service
            O2[order-svc:v3.0]:::service
        end

        subgraph PaymentSvc ["Payment Service"]
            P1[payment-svc:v1.5]:::service
            P2[payment-svc:v1.5]:::service
        end
    end

    subgraph Workers ["⚙️ Background Workers"]
        W1[email-worker]:::worker
        W2[report-worker]:::worker
        W3[sync-worker]:::worker
    end

    subgraph Messaging ["📨 Message Queue"]
        KAFKA[Kafka Cluster]:::queue
    end

    subgraph DataLayer ["💾 Data Layer"]
        PG[(PostgreSQL)]:::data
        REDIS[(Redis)]:::data
        ES[(Elasticsearch)]:::data
    end

    LB --> ING
    ING --> GW1 & GW2
    GW1 & GW2 --> U1 & U2 & U3
    GW1 & GW2 --> O1 & O2
    GW1 & GW2 --> P1 & P2

    U1 & U2 & U3 --> PG
    U1 & U2 & U3 --> REDIS
    O1 & O2 --> PG
    O1 & O2 --> KAFKA
    P1 & P2 --> PG

    KAFKA --> W1 & W2 & W3
    W1 --> ES
    W2 --> ES
    W3 --> PG
```

### Docker Compose Development Stack

```mermaid
---
config:
  layout: elk
---
flowchart LR
    %% Cagle Docker Colors
    classDef frontend fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef backend fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef database fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef cache fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef proxy fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40
    classDef volume fill:#ECEFF1,stroke:#455A64,stroke-width:2px,color:#263238

    subgraph DockerCompose ["🐳 Docker Compose Stack"]
        NGINX[nginx:alpine<br/>:80, :443]:::proxy

        subgraph Frontend ["Frontend"]
            REACT[react-app<br/>:3000]:::frontend
        end

        subgraph Backend ["Backend Services"]
            API[api-server<br/>:8080]:::backend
            WORKER[worker<br/>]:::backend
        end

        subgraph Data ["Data Services"]
            PG[(postgres:15<br/>:5432)]:::database
            REDIS[(redis:7<br/>:6379)]:::cache
            MINIO[minio<br/>:9000]:::database
        end

        subgraph Volumes ["Volumes"]
            V1[pg_data]:::volume
            V2[redis_data]:::volume
            V3[minio_data]:::volume
        end
    end

    NGINX --> REACT
    NGINX --> API
    API --> PG
    API --> REDIS
    API --> MINIO
    WORKER --> PG
    WORKER --> REDIS
    PG --- V1
    REDIS --- V2
    MINIO --- V3
```

---

## Pattern 5: Service Mesh Architecture

### Istio Service Mesh

```mermaid
---
config:
  layout: elk
---
flowchart TB
    %% Cagle Service Mesh Colors
    classDef control fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef data fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef proxy fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef service fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef external fill:#ECEFF1,stroke:#455A64,stroke-width:2px,color:#263238

    EXT[External Traffic]:::external

    subgraph ControlPlane ["🎛️ Control Plane"]
        ISTIOD[istiod]:::control
        PILOT[Pilot]:::control
        CITADEL[Citadel]:::control
        GALLEY[Galley]:::control
    end

    subgraph DataPlane ["📦 Data Plane"]
        ING[Istio Ingress Gateway]:::proxy

        subgraph SvcA ["Service A Pod"]
            A_APP[app-a]:::service
            A_PROXY[envoy-proxy]:::proxy
        end

        subgraph SvcB ["Service B Pod"]
            B_APP[app-b]:::service
            B_PROXY[envoy-proxy]:::proxy
        end

        subgraph SvcC ["Service C Pod"]
            C_APP[app-c]:::service
            C_PROXY[envoy-proxy]:::proxy
        end

        EG[Istio Egress Gateway]:::proxy
    end

    EXT_SVC[External Service]:::external

    EXT --> ING
    ING --> A_PROXY --> A_APP
    A_PROXY --> B_PROXY --> B_APP
    B_PROXY --> C_PROXY --> C_APP
    C_PROXY --> EG --> EXT_SVC

    ISTIOD --> PILOT
    ISTIOD --> CITADEL
    ISTIOD --> GALLEY

    PILOT -.->|config| A_PROXY
    PILOT -.->|config| B_PROXY
    PILOT -.->|config| C_PROXY
    CITADEL -.->|certs| A_PROXY
    CITADEL -.->|certs| B_PROXY
    CITADEL -.->|certs| C_PROXY
```

---

## Pattern 6: Monitoring Stack

### Observability Architecture

```mermaid
---
config:
  layout: elk
---
flowchart TB
    %% Cagle Monitoring Colors
    classDef app fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef metrics fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef logs fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef traces fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef viz fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef alert fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#B71C1C

    subgraph Applications ["📱 Applications"]
        APP1[Service A]:::app
        APP2[Service B]:::app
        APP3[Service C]:::app
    end

    subgraph MetricsStack ["📊 Metrics Pipeline"]
        PROM[Prometheus]:::metrics
        THANOS[Thanos]:::metrics
        NODE[Node Exporter]:::metrics
    end

    subgraph LogsStack ["📝 Logs Pipeline"]
        FB[Filebeat]:::logs
        LOGSTASH[Logstash]:::logs
        ES[(Elasticsearch)]:::logs
    end

    subgraph TracesStack ["🔍 Traces Pipeline"]
        JAEGER[Jaeger Agent]:::traces
        COLLECTOR[Jaeger Collector]:::traces
        TRACE_DB[(Trace Storage)]:::traces
    end

    subgraph Visualization ["📈 Visualization"]
        GRAF[Grafana]:::viz
        KIBANA[Kibana]:::viz
        JAEGER_UI[Jaeger UI]:::viz
    end

    subgraph Alerting ["🚨 Alerting"]
        ALERT[Alertmanager]:::alert
        PD[PagerDuty]:::alert
        SLACK[Slack]:::alert
    end

    APP1 & APP2 & APP3 -->|metrics| PROM
    APP1 & APP2 & APP3 -->|logs| FB
    APP1 & APP2 & APP3 -->|traces| JAEGER

    NODE --> PROM
    PROM --> THANOS
    THANOS --> GRAF

    FB --> LOGSTASH --> ES
    ES --> KIBANA

    JAEGER --> COLLECTOR --> TRACE_DB
    TRACE_DB --> JAEGER_UI

    PROM --> ALERT
    ALERT --> PD
    ALERT --> SLACK
```

---

## Pattern 7: High Availability Deployment

### Active-Active Configuration

```mermaid
---
config:
  layout: elk
---
flowchart TB
    %% Cagle HA Colors
    classDef user fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef lb fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef active fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef standby fill:#FFF9C4,stroke:#F9A825,stroke-width:2px,color:#F57F17
    classDef storage fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef sync fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B

    USERS[Users]:::user
    GSLB[Global Server Load Balancer]:::lb

    subgraph DC1 ["🏢 Data Center 1 (Primary)"]
        LB1[Load Balancer]:::lb
        subgraph Cluster1 ["Active Cluster"]
            APP1_1[App Node 1]:::active
            APP1_2[App Node 2]:::active
            APP1_3[App Node 3]:::active
        end
        DB1[(Primary DB)]:::storage
        CACHE1[(Redis Primary)]:::storage
    end

    subgraph DC2 ["🏢 Data Center 2 (Secondary)"]
        LB2[Load Balancer]:::lb
        subgraph Cluster2 ["Active Cluster"]
            APP2_1[App Node 1]:::active
            APP2_2[App Node 2]:::active
            APP2_3[App Node 3]:::active
        end
        DB2[(Replica DB)]:::storage
        CACHE2[(Redis Replica)]:::storage
    end

    USERS --> GSLB
    GSLB -->|50%| LB1
    GSLB -->|50%| LB2

    LB1 --> APP1_1 & APP1_2 & APP1_3
    LB2 --> APP2_1 & APP2_2 & APP2_3

    APP1_1 & APP1_2 & APP1_3 --> DB1
    APP2_1 & APP2_2 & APP2_3 --> DB2

    APP1_1 & APP1_2 & APP1_3 --> CACHE1
    APP2_1 & APP2_2 & APP2_3 --> CACHE2

    DB1 <-->|Sync Replication| DB2
    CACHE1 <-->|Redis Cluster| CACHE2
```

### Blue-Green Deployment

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
    participant LB as Load Balancer
    participant BLUE as Blue (v1.0)
    participant GREEN as Green (v2.0)
    participant DB as Database

    rect rgb(187, 222, 251)
        Note over LB,DB: Initial State: Blue Active
        LB->>BLUE: 100% Traffic
        BLUE->>DB: Queries
    end

    rect rgb(232, 245, 233)
        Note over LB,DB: Deploy v2.0 to Green
        Note over GREEN: Deploy new version
        GREEN->>DB: Run migrations
        GREEN->>GREEN: Health checks pass
    end

    rect rgb(255, 249, 196)
        Note over LB,DB: Gradual Traffic Shift
        LB->>BLUE: 90% Traffic
        LB->>GREEN: 10% Traffic (canary)
        Note over LB: Monitor metrics
        LB->>BLUE: 50% Traffic
        LB->>GREEN: 50% Traffic
        Note over LB: Continue monitoring
    end

    rect rgb(200, 230, 201)
        Note over LB,DB: Complete Cutover
        LB->>GREEN: 100% Traffic
        Note over BLUE: Standby for rollback
    end

    rect rgb(255, 205, 210)
        Note over LB,DB: Rollback (if needed)
        LB->>BLUE: 100% Traffic (rollback)
        Note over GREEN: Investigate issues
    end
```

---

## Pattern 8: Disaster Recovery

### DR Architecture

```mermaid
---
config:
  layout: elk
---
flowchart TB
    %% Cagle DR Colors
    classDef primary fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef dr fill:#FFECB3,stroke:#FF8F00,stroke-width:2px,color:#E65100
    classDef sync fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef storage fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef network fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C

    DNS[Global DNS]:::network

    subgraph Primary ["🟢 Primary Region (us-central1)"]
        P_LB[Load Balancer]:::primary
        P_GKE[GKE Cluster]:::primary
        P_SQL[(Cloud SQL Primary)]:::storage
        P_GCS[Cloud Storage]:::storage
    end

    subgraph DR ["🟡 DR Region (us-east1)"]
        DR_LB[Load Balancer]:::dr
        DR_GKE[GKE Cluster]:::dr
        DR_SQL[(Cloud SQL Replica)]:::storage
        DR_GCS[Cloud Storage]:::storage
    end

    subgraph Backup ["💾 Backup Storage"]
        VAULT[Backup Vault]:::storage
        SNAP[Snapshots]:::storage
    end

    subgraph Replication ["🔄 Replication"]
        DB_SYNC[DB Replication]:::sync
        GCS_SYNC[Storage Replication]:::sync
    end

    DNS -->|Active| P_LB
    DNS -.->|Failover| DR_LB

    P_LB --> P_GKE --> P_SQL
    P_GKE --> P_GCS

    DR_LB --> DR_GKE --> DR_SQL
    DR_GKE --> DR_GCS

    P_SQL --> DB_SYNC --> DR_SQL
    P_GCS --> GCS_SYNC --> DR_GCS

    P_SQL --> SNAP --> VAULT
    P_GCS --> VAULT
```

---

## Quick Reference

### Copy-Paste Deployment classDef Block

```
%% Cagle Deployment Architecture Color System

%% Cloud & Platform
classDef cloud fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
classDef region fill:#BBDEFB,stroke:#1976D2,stroke-width:2px,color:#0D47A1
classDef zone fill:#90CAF9,stroke:#1E88E5,stroke-width:2px,color:#0D47A1

%% Kubernetes
classDef cluster fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
classDef namespace fill:#C8E6C9,stroke:#43A047,stroke-width:2px,color:#1B5E20
classDef pod fill:#A5D6A7,stroke:#66BB6A,stroke-width:2px,color:#1B5E20
classDef service fill:#81C784,stroke:#4CAF50,stroke-width:2px,color:#1B5E20

%% Containers
classDef container fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B

%% Networking
classDef network fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
classDef loadbalancer fill:#E1BEE7,stroke:#8E24AA,stroke-width:2px,color:#4A148C
classDef ingress fill:#CE93D8,stroke:#AB47BC,stroke-width:2px,color:#4A148C

%% Storage
classDef storage fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
classDef database fill:#FFE082,stroke:#FFB300,stroke-width:2px,color:#E65100

%% Security
classDef security fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40
classDef firewall fill:#B2DFDB,stroke:#00897B,stroke-width:2px,color:#004D40

%% CI/CD
classDef pipeline fill:#EDE7F6,stroke:#512DA8,stroke-width:2px,color:#311B92
classDef artifact fill:#B39DDB,stroke:#7E57C2,stroke-width:2px,color:#311B92

%% Status
classDef active fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
classDef standby fill:#FFF9C4,stroke:#F9A825,stroke-width:2px,color:#F57F17
classDef failed fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#B71C1C
```

### ELK Configuration for Infrastructure Diagrams

```yaml
---
config:
  layout: elk
  elk:
    mergeEdges: false
    nodePlacementStrategy: BRANDES_KOEPF
    hierarchyHandling: INCLUDE_CHILDREN
---
```

---

## References

- Cagle, Kurt. "Semantic Visualization and Knowledge Graphs" - The Ontologist
- [Kubernetes Architecture](https://kubernetes.io/docs/concepts/architecture/)
- [Google Cloud Architecture Center](https://cloud.google.com/architecture)
- [Mermaid Flowchart Documentation](https://mermaid.js.org/syntax/flowchart.html)
- [GitOps Principles](https://opengitops.dev/)
