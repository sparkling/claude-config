# Property Graph Visualization Guide

> **SKILL QUICK REF**: `flowchart LR` + ELK | Nodes with properties `["Label<br/><small>prop: value</small>"]` | Labeled relationships `-->|:RELATIONSHIP|` | classDef by node label | Neo4j/graph DB patterns

## When to Use

- Neo4j/graph database schema design
- Cypher query visualization
- Social network graphs
- Recommendation engine models
- Fraud detection patterns
- Network topology diagrams
- Entity relationship with properties

---

## Property Graph vs RDF

| Aspect | Property Graph | RDF/Linked Data |
|--------|---------------|-----------------|
| **Model** | Nodes + Relationships (both have properties) | Subject-Predicate-Object triples |
| **Properties** | On nodes AND edges | Literals only on objects |
| **Schema** | Labels on nodes, types on relationships | Classes and predicates |
| **Query** | Cypher, Gremlin | SPARQL |
| **Use** | Traversal-heavy, local queries | Integration, inference |

Use this guide for Neo4j-style property graphs. Use `17-LINKED-DATA-GUIDE.md` for RDF.

---

## Core Pattern: Labeled Nodes and Relationships

```mermaid
flowchart LR
    A[Person: Alice] -->|:KNOWS| B[Person: Bob]
    A -->|:WORKS_AT| C[Company: Acme]
```

**Convention**:
- Node labels: `[Label: Name]`
- Relationship types: `-->|:TYPE|` (uppercase with colon prefix)

---

## Nodes with Properties

Show node properties using HTML-style formatting:

```mermaid
flowchart LR
    classDef person fill:#B3E5FC,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef company fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20

    A["<b>Person</b><br/>Alice Smith<br/><small>age: 32<br/>role: Engineer</small>"]:::person
    B["<b>Company</b><br/>Acme Corp<br/><small>founded: 1995<br/>employees: 500</small>"]:::company

    A -->|:WORKS_AT| B
```

**Pattern**: `["<b>Label</b><br/>Name<br/><small>prop: value</small>"]`

---

## Relationship Properties

Show properties on relationships using edge labels:

```mermaid
flowchart LR
    classDef person fill:#B3E5FC,stroke:#0277BD,stroke-width:2px

    Alice[Person: Alice]:::person
    Bob[Person: Bob]:::person

    Alice -->|":KNOWS<br/><small>since: 2020<br/>strength: 0.8</small>"| Bob
```

For complex relationship properties, use an intermediate node:

```mermaid
flowchart LR
    classDef person fill:#B3E5FC,stroke:#0277BD,stroke-width:2px
    classDef rel fill:#F8BBD9,stroke:#AD1457,stroke-width:2px

    Alice[Person: Alice]:::person
    Bob[Person: Bob]:::person
    Knows["<small>:KNOWS<br/>since: 2020<br/>strength: 0.8</small>"]:::rel

    Alice --> Knows --> Bob
```

---

## Semantic Color System for Property Graphs

```mermaid
flowchart LR
    classDef person fill:#B3E5FC,stroke:#0277BD,stroke-width:2px,color:#01579B
    classDef company fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
    classDef product fill:#FFF8E1,stroke:#F57F17,stroke-width:2px,color:#E65100
    classDef location fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef event fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#4A148C
    classDef transaction fill:#E0F2F1,stroke:#00695C,stroke-width:2px,color:#004D40

    P[Person]:::person
    C[Company]:::company
    Pr[Product]:::product
    L[Location]:::location
    E[Event]:::event
    T[Transaction]:::transaction
```

| Node Label | Fill | Stroke | Use |
|------------|------|--------|-----|
| **Person/User** | `#B3E5FC` | `#0277BD` | People, accounts, actors |
| **Company/Org** | `#E8F5E9` | `#2E7D32` | Organizations, groups |
| **Product/Item** | `#FFF8E1` | `#F57F17` | Products, content, assets |
| **Location** | `#E3F2FD` | `#1565C0` | Places, addresses, regions |
| **Event** | `#F3E5F5` | `#7B1FA2` | Actions, occurrences |
| **Transaction** | `#E0F2F1` | `#00695C` | Payments, transfers |

---

## Common Graph Patterns

### Social Network

```mermaid
---
config:
  layout: elk
---
flowchart LR
    classDef person fill:#B3E5FC,stroke:#0277BD,stroke-width:2px

    Alice[Person: Alice]:::person
    Bob[Person: Bob]:::person
    Carol[Person: Carol]:::person
    Dave[Person: Dave]:::person

    Alice -->|:KNOWS| Bob
    Alice -->|:KNOWS| Carol
    Bob -->|:KNOWS| Carol
    Bob -->|:KNOWS| Dave
    Carol -->|:FOLLOWS| Alice
```

### E-Commerce Model

```mermaid
---
config:
  layout: elk
---
flowchart TB
    classDef user fill:#B3E5FC,stroke:#0277BD,stroke-width:2px
    classDef product fill:#FFF8E1,stroke:#F57F17,stroke-width:2px
    classDef order fill:#E0F2F1,stroke:#00695C,stroke-width:2px
    classDef category fill:#E1BEE7,stroke:#6A1B9A,stroke-width:2px

    User1[User: Alice]:::user
    Order1[Order: #1234]:::order
    Prod1[Product: Laptop]:::product
    Prod2[Product: Mouse]:::product
    Cat1[Category: Electronics]:::category

    User1 -->|:PLACED| Order1
    Order1 -->|:CONTAINS| Prod1
    Order1 -->|:CONTAINS| Prod2
    Prod1 -->|:IN_CATEGORY| Cat1
    Prod2 -->|:IN_CATEGORY| Cat1
    User1 -->|:VIEWED| Prod1
    User1 -->|:VIEWED| Prod2
```

### Recommendation Pattern

```mermaid
---
config:
  layout: elk
---
flowchart LR
    classDef user fill:#B3E5FC,stroke:#0277BD,stroke-width:2px
    classDef product fill:#FFF8E1,stroke:#F57F17,stroke-width:2px
    classDef rec fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px,stroke-dasharray: 5 5

    You[User: You]:::user
    Similar[User: Similar User]:::user
    Bought[Product: Item A]:::product
    Recommend[Product: Item B]:::rec

    You -->|:PURCHASED| Bought
    Similar -->|:PURCHASED| Bought
    Similar -->|:PURCHASED| Recommend
    You -.->|:RECOMMENDED| Recommend
```

### Fraud Detection Pattern

```mermaid
---
config:
  layout: elk
---
flowchart TB
    classDef account fill:#B3E5FC,stroke:#0277BD,stroke-width:2px
    classDef device fill:#ECEFF1,stroke:#455A64,stroke-width:2px
    classDef ip fill:#E3F2FD,stroke:#1565C0,stroke-width:2px
    classDef suspicious fill:#FFCDD2,stroke:#C62828,stroke-width:3px

    Acct1[Account: User1]:::account
    Acct2[Account: User2]:::suspicious
    Acct3[Account: User3]:::suspicious
    Device1[Device: D-123]:::device
    IP1[IP: 192.168.1.1]:::ip

    Acct1 -->|:USES| Device1
    Acct2 -->|:USES| Device1
    Acct3 -->|:USES| Device1
    Acct2 -->|:FROM_IP| IP1
    Acct3 -->|:FROM_IP| IP1
```

### Knowledge Graph (Domain Model)

```mermaid
---
config:
  layout: elk
---
flowchart LR
    classDef movie fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
    classDef person fill:#B3E5FC,stroke:#0277BD,stroke-width:2px
    classDef genre fill:#E1BEE7,stroke:#6A1B9A,stroke-width:2px

    Matrix["<b>Movie</b><br/>The Matrix<br/><small>year: 1999</small>"]:::movie
    Keanu["<b>Person</b><br/>Keanu Reeves"]:::person
    Carrie["<b>Person</b><br/>Carrie-Anne Moss"]:::person
    Wachowski["<b>Person</b><br/>Wachowskis"]:::person
    SciFi[Genre: Sci-Fi]:::genre
    Action[Genre: Action]:::genre

    Keanu -->|:ACTED_IN| Matrix
    Carrie -->|:ACTED_IN| Matrix
    Wachowski -->|:DIRECTED| Matrix
    Matrix -->|:HAS_GENRE| SciFi
    Matrix -->|:HAS_GENRE| Action
```

---

## Cypher Query Visualization

### Match Pattern

Visualize what a Cypher query matches:

```cypher
MATCH (p:Person)-[:KNOWS]->(friend:Person)-[:WORKS_AT]->(c:Company)
WHERE c.name = 'Acme'
RETURN p, friend
```

```mermaid
flowchart LR
    classDef person fill:#B3E5FC,stroke:#0277BD,stroke-width:2px
    classDef company fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px
    classDef match fill:#FFF9C4,stroke:#F9A825,stroke-width:3px

    p["(p:Person)"]:::match
    friend["(friend:Person)"]:::match
    c["(c:Company)<br/><small>name: 'Acme'</small>"]:::company

    p -->|:KNOWS| friend
    friend -->|:WORKS_AT| c
```

### Path Pattern

```mermaid
flowchart LR
    classDef node fill:#B3E5FC,stroke:#0277BD,stroke-width:2px
    classDef path fill:#C8E6C9,stroke:#2E7D32,stroke-width:3px

    A[Node: A]:::node
    B[Node: B]:::node
    C[Node: C]:::node
    D[Node: D]:::node

    A -->|":REL*1..3"| D

    subgraph "Possible Paths"
        A1[A]:::path --> B1[B]:::path --> D1[D]:::path
        A2[A]:::path --> C1[C]:::path --> D2[D]:::path
    end
```

---

## Schema Visualization

### Node Labels and Properties

```mermaid
flowchart TB
    classDef schema fill:#E1BEE7,stroke:#6A1B9A,stroke-width:2px
    classDef prop fill:#FFFFFF,stroke:#9E9E9E,stroke-width:1px

    subgraph Person["(:Person)"]
        direction LR
        p1[name: STRING]:::prop
        p2[age: INTEGER]:::prop
        p3[email: STRING]:::prop
    end
    Person:::schema

    subgraph Company["(:Company)"]
        direction LR
        c1[name: STRING]:::prop
        c2[founded: DATE]:::prop
        c3[employees: INTEGER]:::prop
    end
    Company:::schema

    Person -->|":WORKS_AT"| Company
    Person -->|":KNOWS"| Person
```

### Index and Constraint Notation

```mermaid
flowchart TB
    classDef label fill:#E1BEE7,stroke:#6A1B9A,stroke-width:2px
    classDef index fill:#BBDEFB,stroke:#1565C0,stroke-width:2px
    classDef constraint fill:#FFCDD2,stroke:#C62828,stroke-width:2px

    subgraph PersonSchema["Person"]
        direction TB
        Label[":Person"]:::label
        Idx["INDEX on name"]:::index
        Uniq["UNIQUE email"]:::constraint
    end
```

---

## Graph Algorithms Visualization

### Shortest Path

```mermaid
flowchart LR
    classDef node fill:#ECEFF1,stroke:#455A64,stroke-width:2px
    classDef path fill:#C8E6C9,stroke:#2E7D32,stroke-width:3px
    classDef start fill:#BBDEFB,stroke:#1565C0,stroke-width:3px
    classDef end fill:#F8BBD9,stroke:#AD1457,stroke-width:3px

    A[A]:::start
    B[B]:::node
    C[C]:::path
    D[D]:::path
    E[E]:::node
    F[F]:::end

    A -->|1| B
    A -->|2| C
    B -->|3| E
    C -->|1| D
    D -->|1| F
    E -->|2| F

    linkStyle 1,2,3 stroke:#2E7D32,stroke-width:3px
```

### PageRank / Centrality

```mermaid
flowchart LR
    classDef high fill:#1565C0,stroke:#0D47A1,stroke-width:4px,color:#FFFFFF
    classDef med fill:#64B5F6,stroke:#1976D2,stroke-width:3px
    classDef low fill:#BBDEFB,stroke:#1565C0,stroke-width:2px

    A[Hub Node]:::high
    B[Node B]:::med
    C[Node C]:::med
    D[Node D]:::low
    E[Node E]:::low
    F[Node F]:::low

    D --> A
    E --> A
    F --> A
    B --> A
    C --> A
    D --> B
    E --> C
```

---

## Configuration

### ELK Settings for Property Graphs

```yaml
---
config:
  layout: elk
  elk:
    mergeEdges: false
    nodePlacementStrategy: BRANDES_KOEPF
    edgeRouting: ORTHOGONAL
---
```

### Theme for Property Graphs

```yaml
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#B3E5FC",
    "primaryTextColor": "#01579B",
    "primaryBorderColor": "#0277BD",
    "secondaryColor": "#E8F5E9",
    "tertiaryColor": "#FFF8E1",
    "lineColor": "#37474F"
  }
}}%%
```

---

## Best Practices

1. **Use consistent label colors** - Same color for same node labels across diagrams
2. **Uppercase relationship types** - `:KNOWS`, `:WORKS_AT`, `:PURCHASED`
3. **Show key properties only** - Don't overload nodes with all properties
4. **Use ELK for >10 nodes** - Better layout for complex graphs
5. **Highlight query patterns** - Use distinct colors for matched elements
6. **Direction matters** - LR for flows, TB for hierarchies
7. **Use subgraphs for schema** - Group label definitions
8. **Dashed lines for inferred** - Recommendations, predictions

---

## References

- [Neo4j Graph Data Modeling](https://neo4j.com/developer/data-modeling/)
- [Cypher Query Language](https://neo4j.com/docs/cypher-manual/)
- [Graph Algorithms](https://neo4j.com/docs/graph-data-science/)
- [Property Graph Model](https://github.com/opencypher/openCypher)
