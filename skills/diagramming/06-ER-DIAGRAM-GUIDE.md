# Entity Relationship Diagram Guide

> **SKILL QUICK REF**: `erDiagram` • `ENTITY { type attr PK|FK|UK }` • Cardinality: `||--||` `||--o{` `}o--o{` • `|` one `o` zero `{` many • Solid `--` identifying, dotted `..` non-identifying

## When to Use

- Database schema design
- Data model documentation
- ORM entity relationships
- System data architecture
- API resource modeling

## Overview

Entity Relationship (ER) diagrams model database schemas and data relationships. Essential for database design, data modeling, and system architecture documentation.

## Basic Syntax

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : "appears in"
```

## Entity Definition

### Basic Entity

```mermaid
erDiagram
    CUSTOMER {
        int id PK
        string name
        string email UK
        date created_at
    }
```

### Attribute Types

```mermaid
erDiagram
    PRODUCT {
        int id PK "Primary Key"
        string name "Product name"
        decimal price
        int stock
        boolean active
        date created_at
        datetime updated_at
    }
```

### Key Constraints

| Constraint | Meaning |
|------------|---------|
| `PK` | Primary Key |
| `FK` | Foreign Key |
| `UK` | Unique Key |

```mermaid
erDiagram
    ORDER {
        int id PK
        int customer_id FK
        string order_number UK
        decimal total
        date order_date
    }
```

## Relationships

### Cardinality Notation (Crow's Foot)

Mermaid uses crow's foot notation with two characters:
- **Outer character**: Maximum value
- **Inner character**: Minimum value

| Symbol | Meaning |
|--------|---------|
| `\|` | One |
| `o` | Zero |
| `{` | Many |

### Relationship Patterns

```mermaid
erDiagram
    A ||--|| B : "one to one"
    C ||--o| D : "one to zero-or-one"
    E ||--o{ F : "one to zero-or-many"
    G ||--|{ H : "one to one-or-many"
    I }o--o{ J : "zero-or-many to zero-or-many"
```

### Relationship Reference Table

| Syntax | Left | Right | Description |
|--------|------|-------|-------------|
| `\|\|--\|\|` | One | One | One-to-one (mandatory) |
| `\|\|--o\|` | One | Zero or one | One-to-optional |
| `\|o--o\|` | Zero or one | Zero or one | Optional-to-optional |
| `\|\|--o{` | One | Zero or many | One-to-many (optional) |
| `\|\|--\|{` | One | One or many | One-to-many (required) |
| `}o--o{` | Many | Many | Many-to-many |

### Identifying vs Non-Identifying

- **Solid line** (`--`): Identifying relationship (dependent entity)
- **Dotted line** (`.`): Non-identifying relationship (independent entity)

```mermaid
erDiagram
    PARENT ||--|{ CHILD : "has (identifying)"
    PERSON }|..|{ CAR : "drives (non-identifying)"
```

## Relationship Labels

Labels describe the relationship from the first entity's perspective:

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    EMPLOYEE ||--o{ PROJECT : "works on"
    DEPARTMENT ||--|{ EMPLOYEE : employs
```

## Common Patterns

### E-Commerce Schema

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    PRODUCT }|--|| CATEGORY : "belongs to"
    PRODUCT ||--o{ REVIEW : has
    CUSTOMER ||--o{ REVIEW : writes
    CUSTOMER ||--o{ ADDRESS : has
    ORDER ||--|| ADDRESS : "ships to"
    ORDER ||--|| PAYMENT : "paid by"

    CUSTOMER {
        int id PK
        string email UK
        string name
        string password_hash
        date created_at
    }

    ORDER {
        int id PK
        int customer_id FK
        int shipping_address_id FK
        string status
        decimal total
        datetime created_at
    }

    ORDER_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal unit_price
    }

    PRODUCT {
        int id PK
        int category_id FK
        string name
        string description
        decimal price
        int stock
        boolean active
    }

    CATEGORY {
        int id PK
        string name
        int parent_id FK
    }

    REVIEW {
        int id PK
        int product_id FK
        int customer_id FK
        int rating
        text content
        datetime created_at
    }

    ADDRESS {
        int id PK
        int customer_id FK
        string street
        string city
        string postal_code
        string country
    }

    PAYMENT {
        int id PK
        int order_id FK
        string method
        decimal amount
        string status
        datetime processed_at
    }
```

### User Authentication System

```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER ||--o{ USER_ROLE : has
    ROLE ||--o{ USER_ROLE : "assigned to"
    ROLE ||--o{ ROLE_PERMISSION : has
    PERMISSION ||--o{ ROLE_PERMISSION : "granted by"
    USER ||--o{ AUDIT_LOG : generates

    USER {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        boolean email_verified
        boolean active
        datetime created_at
        datetime last_login
    }

    SESSION {
        uuid id PK
        uuid user_id FK
        string token UK
        string ip_address
        string user_agent
        datetime created_at
        datetime expires_at
    }

    ROLE {
        int id PK
        string name UK
        string description
    }

    USER_ROLE {
        int user_id PK,FK
        int role_id PK,FK
        datetime assigned_at
    }

    PERMISSION {
        int id PK
        string name UK
        string resource
        string action
    }

    ROLE_PERMISSION {
        int role_id PK,FK
        int permission_id PK,FK
    }

    AUDIT_LOG {
        bigint id PK
        uuid user_id FK
        string action
        string resource
        json details
        string ip_address
        datetime created_at
    }
```

### Content Management System

```mermaid
erDiagram
    USER ||--o{ POST : creates
    USER ||--o{ COMMENT : writes
    POST ||--o{ COMMENT : has
    POST }|--|{ TAG : "tagged with"
    POST ||--o{ POST_TAG : has
    TAG ||--o{ POST_TAG : "applied to"
    POST }|--|| CATEGORY : "belongs to"
    POST ||--o{ MEDIA : contains
    COMMENT ||--o{ COMMENT : "replies to"

    USER {
        int id PK
        string username UK
        string email UK
        string role
        datetime created_at
    }

    POST {
        int id PK
        int author_id FK
        int category_id FK
        string title
        string slug UK
        text content
        string status
        datetime published_at
        datetime created_at
    }

    CATEGORY {
        int id PK
        string name
        string slug UK
        int parent_id FK
    }

    TAG {
        int id PK
        string name UK
        string slug UK
    }

    POST_TAG {
        int post_id PK,FK
        int tag_id PK,FK
    }

    COMMENT {
        int id PK
        int post_id FK
        int author_id FK
        int parent_id FK
        text content
        string status
        datetime created_at
    }

    MEDIA {
        int id PK
        int post_id FK
        string filename
        string url
        string type
        int size
    }
```

### Multi-Tenant SaaS

```mermaid
erDiagram
    TENANT ||--|{ USER : has
    TENANT ||--o{ SUBSCRIPTION : has
    PLAN ||--o{ SUBSCRIPTION : "applied to"
    USER ||--o{ WORKSPACE : owns
    WORKSPACE ||--|{ PROJECT : contains
    PROJECT ||--|{ TASK : contains
    USER }|--o{ TASK : "assigned to"
    TASK ||--o{ TASK_ASSIGNEE : has
    USER ||--o{ TASK_ASSIGNEE : "assigned in"

    TENANT {
        uuid id PK
        string name
        string subdomain UK
        string status
        datetime created_at
    }

    PLAN {
        int id PK
        string name
        decimal price
        int max_users
        int max_projects
        json features
    }

    SUBSCRIPTION {
        uuid id PK
        uuid tenant_id FK
        int plan_id FK
        string status
        datetime starts_at
        datetime ends_at
    }

    USER {
        uuid id PK
        uuid tenant_id FK
        string email
        string name
        string role
    }

    WORKSPACE {
        uuid id PK
        uuid owner_id FK
        string name
    }

    PROJECT {
        uuid id PK
        uuid workspace_id FK
        string name
        string status
    }

    TASK {
        uuid id PK
        uuid project_id FK
        string title
        text description
        string status
        string priority
        date due_date
    }

    TASK_ASSIGNEE {
        uuid task_id PK,FK
        uuid user_id PK,FK
        datetime assigned_at
    }
```

### Knowledge Graph Entity Model (Cagle Style)

```mermaid
erDiagram
    ENTITY ||--o{ TRIPLE : "is subject of"
    ENTITY ||--o{ TRIPLE : "is object of"
    PREDICATE ||--o{ TRIPLE : "relates"
    ENTITY }|--|| CLASS : "instance of"
    CLASS ||--o{ CLASS : "subclass of"
    GRAPH ||--o{ TRIPLE : contains
    NAMESPACE ||--o{ ENTITY : defines
    NAMESPACE ||--o{ PREDICATE : defines

    ENTITY {
        uri id PK
        string local_name
        uri namespace FK
        uri class_uri FK
        json labels
    }

    CLASS {
        uri id PK
        string local_name
        uri parent_class FK
        json labels
    }

    PREDICATE {
        uri id PK
        string local_name
        uri namespace FK
        uri domain
        uri range
    }

    TRIPLE {
        bigint id PK
        uri subject FK
        uri predicate FK
        uri object FK
        uri graph FK
        datetime created_at
    }

    GRAPH {
        uri id PK
        string name
        datetime created_at
    }

    NAMESPACE {
        uri prefix PK
        uri uri UK
        string description
    }
```

## Styling

### Theme Configuration

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#e8f5e9",
    "primaryTextColor": "#1b5e20",
    "primaryBorderColor": "#2e7d32",
    "lineColor": "#43a047"
  }
}}%%
erDiagram
    USER ||--o{ POST : creates
    POST ||--|{ COMMENT : has

    USER {
        int id PK
        string name
    }

    POST {
        int id PK
        string title
    }

    COMMENT {
        int id PK
        text content
    }
```

## Configuration Options

### Complete Configuration Block

```mermaid
---
config:
  er:
    titleTopMargin: 25
    diagramPadding: 20
    layoutDirection: TB
    minEntityWidth: 100
    minEntityHeight: 75
    entityPadding: 15
    stroke: gray
    fill: honeydew
    fontSize: 12
    useMaxWidth: true
---
erDiagram
    ENTITY {
        int id PK
        string name
    }
```

### Configuration Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `titleTopMargin` | number | 25 | Margin above diagram title |
| `diagramPadding` | number | 20 | Padding around entire diagram |
| `layoutDirection` | string | TB | Layout direction: `TB`, `BT`, `LR`, `RL` |
| `minEntityWidth` | number | 100 | Minimum width of entity boxes |
| `minEntityHeight` | number | 75 | Minimum height of entity boxes |
| `entityPadding` | number | 15 | Padding inside entity boxes |
| `stroke` | string | gray | Border color of entities |
| `fill` | string | honeydew | Background fill color |
| `fontSize` | number | 12 | Font size for text |
| `useMaxWidth` | boolean | true | Use maximum available width |

### Layout Direction Examples

#### Left-to-Right Layout

```mermaid
%%{init: {"er": {"layoutDirection": "LR"}} }%%
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ITEM : contains
    PRODUCT ||--o{ ITEM : "included in"

    USER { int id PK }
    ORDER { int id PK }
    ITEM { int id PK }
    PRODUCT { int id PK }
```

#### Bottom-to-Top Layout

```mermaid
%%{init: {"er": {"layoutDirection": "BT"}} }%%
erDiagram
    BASE ||--|| DERIVED : extends

    BASE { int id PK }
    DERIVED { int id PK }
```

### Entity Sizing Examples

#### Wider Entity Boxes

```mermaid
%%{init: {
  "er": {
    "minEntityWidth": 200,
    "entityPadding": 20,
    "fontSize": 14
  }
}}%%
erDiagram
    CUSTOMER {
        int id PK
        string email UK
        string full_name
        datetime created_at
    }
```

#### Compact Entities

```mermaid
%%{init: {
  "er": {
    "minEntityWidth": 80,
    "minEntityHeight": 50,
    "entityPadding": 8,
    "fontSize": 10
  }
}}%%
erDiagram
    A ||--o{ B : rel
    B ||--|{ C : rel

    A { int id PK }
    B { int id PK }
    C { int id PK }
```

### Custom Colors

```mermaid
%%{init: {
  "theme": "base",
  "er": {
    "stroke": "#2E7D32",
    "fill": "#E8F5E9"
  },
  "themeVariables": {
    "primaryColor": "#E8F5E9",
    "primaryTextColor": "#1B5E20",
    "primaryBorderColor": "#2E7D32"
  }
}}%%
erDiagram
    ENTITY_A ||--o{ ENTITY_B : relates

    ENTITY_A { int id PK }
    ENTITY_B { int id PK }
```

---

## Best Practices

1. **Use consistent naming conventions** - UPPER_CASE for entities, snake_case for attributes
2. **Include all key constraints** - PK, FK, UK for clarity
3. **Label relationships clearly** - Use verbs that describe the relationship
4. **Choose correct cardinality** - Be precise about min/max
5. **Use identifying vs non-identifying appropriately** - Shows dependency
6. **Group related entities** - Organize logically
7. **Add attribute comments** - Explain non-obvious fields
8. **Keep diagrams focused** - One domain per diagram
9. **Use `layoutDirection: LR`** - For wide schemas with many relationships
10. **Adjust `minEntityWidth`** - For entities with long attribute names

## Cardinality Quick Reference

| Relationship | Syntax | Example |
|--------------|--------|---------|
| One-to-One | `\|\|--\|\|` | User has Profile |
| One-to-Many | `\|\|--o{` | User places Orders |
| Many-to-Many | `}o--o{` | Students enroll in Courses |
| Optional One | `\|o--o\|` | Employee has Parking Spot |
| Required Many | `\|\|--\|{` | Order contains Items |
