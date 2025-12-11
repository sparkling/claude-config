# Class Diagram Guide

> **SKILL QUICK REF**: `classDiagram` • Visibility: `+` `-` `#` `~` • Relations: `<|--` `*--` `o--` `<--` `<..` `<|..` • `class Name { +attr: Type }` • `<<interface>>` `<<abstract>>`

## When to Use

- Object-oriented design documentation
- API/SDK class structure
- Design pattern visualization
- Domain model documentation
- Interface/inheritance hierarchies

## Overview

Class diagrams model object-oriented structure, showing classes, their attributes, methods, and relationships. Essential for software design documentation and API modeling.

## Basic Syntax

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
    }
```

## Class Definition

### Attributes and Methods

```mermaid
classDiagram
    class BankAccount {
        +String accountNumber
        -double balance
        #String owner
        ~Date createdAt
        +deposit(amount) void
        +withdraw(amount) bool
        -validateAmount(amount) bool
        +getBalance() double
    }
```

### Visibility Modifiers

| Symbol | Visibility | Meaning |
|--------|------------|---------|
| `+` | Public | Accessible from anywhere |
| `-` | Private | Accessible only within class |
| `#` | Protected | Accessible within class and subclasses |
| `~` | Package/Internal | Accessible within package |

### Method Syntax

```mermaid
classDiagram
    class Calculator {
        +add(a, b) int
        +subtract(a, b) int
        +multiply(a, b)$ int
        +divide(a, b)* double
    }
```

| Syntax | Meaning |
|--------|---------|
| `method()` | No return type |
| `method() returnType` | With return type |
| `method()$` | Static method |
| `method()*` | Abstract method |

### Generic Types

```mermaid
classDiagram
    class List~T~ {
        +add(item: T) void
        +get(index: int) T
        +size() int
    }

    class Map~K, V~ {
        +put(key: K, value: V) void
        +get(key: K) V
    }
```

## Annotations (Stereotypes)

```mermaid
classDiagram
    class IShape {
        <<interface>>
        +draw() void
        +area() double
    }

    class AbstractShape {
        <<abstract>>
        #color: String
        +draw()* void
    }

    class ShapeService {
        <<service>>
        +createShape(type) Shape
    }

    class ShapeType {
        <<enumeration>>
        CIRCLE
        SQUARE
        TRIANGLE
    }
```

### Common Annotations

| Annotation | Use Case |
|------------|----------|
| `<<interface>>` | Interface definition |
| `<<abstract>>` | Abstract class |
| `<<service>>` | Service class |
| `<<enumeration>>` | Enum type |
| `<<entity>>` | Domain entity |
| `<<repository>>` | Data repository |
| `<<controller>>` | Controller class |

## Relationships

### Relationship Types

```mermaid
classDiagram
    classA <|-- classB : Inheritance
    classC *-- classD : Composition
    classE o-- classF : Aggregation
    classG <-- classH : Association
    classI -- classJ : Link (solid)
    classK <.. classL : Dependency
    classM <|.. classN : Implementation
    classO .. classP : Link (dashed)
```

### Relationship Reference

| Syntax | Type | Description |
|--------|------|-------------|
| `<\|--` | Inheritance | "is-a" relationship |
| `*--` | Composition | Strong "has-a" (lifecycle dependent) |
| `o--` | Aggregation | Weak "has-a" (independent lifecycle) |
| `<--` | Association | "uses" relationship |
| `--` | Link | Basic connection |
| `<..` | Dependency | "depends on" |
| `<\|..` | Implementation | Implements interface |
| `..` | Dashed link | Weak connection |

### Cardinality (Multiplicity)

```mermaid
classDiagram
    Customer "1" --> "*" Order : places
    Order "1" *-- "1..*" LineItem : contains
    Product "1" --> "0..*" Review : has
```

| Notation | Meaning |
|----------|---------|
| `1` | Exactly one |
| `0..1` | Zero or one |
| `*` | Zero or more |
| `1..*` | One or more |
| `n..m` | Range (n to m) |

### Two-Way Relationships

```mermaid
classDiagram
    Student "many" <--> "many" Course : enrolls
```

## Labels and Notes

### Relationship Labels

```mermaid
classDiagram
    class Car
    class Engine

    Car *-- Engine : has
    Car : +start()
    Engine : +ignite()
```

### Notes

```mermaid
classDiagram
    class User {
        +id: int
        +name: String
    }

    note for User "This is the main user entity\nstored in the users table"
```

## Namespaces (v10.6.0+)

```mermaid
classDiagram
    namespace Domain {
        class User
        class Order
        class Product
    }

    namespace Infrastructure {
        class UserRepository
        class OrderRepository
    }

    UserRepository --> User
    OrderRepository --> Order
```

## Styling

### Class Styling with CSS

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "classText": "#333"
  }
}}%%
classDiagram
    class Important {
        +criticalMethod()
    }
    style Important fill:#ff6b6b,stroke:#333,stroke-width:2px
```

### Direction

```mermaid
classDiagram
    direction LR

    class A
    class B
    class C

    A --> B
    B --> C
```

Directions: `TB` (top-bottom), `BT`, `LR` (left-right), `RL`

## Common Patterns

### Inheritance Hierarchy

```mermaid
classDiagram
    class Animal {
        <<abstract>>
        +String name
        +makeSound()* void
    }

    class Dog {
        +breed: String
        +makeSound() void
        +fetch() void
    }

    class Cat {
        +indoor: bool
        +makeSound() void
        +climb() void
    }

    Animal <|-- Dog
    Animal <|-- Cat
```

### Interface Implementation

```mermaid
classDiagram
    class IRepository~T~ {
        <<interface>>
        +findById(id) T
        +findAll() List~T~
        +save(entity: T) T
        +delete(id) void
    }

    class UserRepository {
        -db: Database
        +findById(id) User
        +findAll() List~User~
        +save(entity: User) User
        +delete(id) void
    }

    IRepository~T~ <|.. UserRepository
```

### Design Pattern: Factory

```mermaid
classDiagram
    class Shape {
        <<interface>>
        +draw() void
    }

    class Circle {
        +radius: double
        +draw() void
    }

    class Square {
        +side: double
        +draw() void
    }

    class ShapeFactory {
        +createShape(type: String)$ Shape
    }

    Shape <|.. Circle
    Shape <|.. Square
    ShapeFactory ..> Shape : creates
```

### Design Pattern: Repository

```mermaid
classDiagram
    class Entity {
        <<abstract>>
        +id: UUID
        +createdAt: DateTime
        +updatedAt: DateTime
    }

    class User {
        +email: String
        +passwordHash: String
        +roles: List~Role~
    }

    class IUserRepository {
        <<interface>>
        +findByEmail(email) User
        +findByRole(role) List~User~
    }

    class UserRepositoryImpl {
        -db: DataSource
        +findByEmail(email) User
        +findByRole(role) List~User~
    }

    Entity <|-- User
    IUserRepository <|.. UserRepositoryImpl
    UserRepositoryImpl --> User
```

### Microservice Domain Model

```mermaid
classDiagram
    namespace OrderDomain {
        class Order {
            +id: UUID
            +status: OrderStatus
            +items: List~OrderItem~
            +calculateTotal() Money
        }

        class OrderItem {
            +productId: UUID
            +quantity: int
            +price: Money
        }

        class OrderStatus {
            <<enumeration>>
            PENDING
            CONFIRMED
            SHIPPED
            DELIVERED
            CANCELLED
        }
    }

    Order "1" *-- "*" OrderItem
    Order --> OrderStatus
```

### ORM Entity Mapping

```mermaid
classDiagram
    class BaseEntity {
        <<abstract>>
        +id: Long
        +version: int
        +createdAt: Timestamp
        +updatedAt: Timestamp
    }

    class User {
        +username: String
        +email: String
        +profile: Profile
    }

    class Profile {
        +firstName: String
        +lastName: String
        +avatar: String
    }

    class Post {
        +title: String
        +content: String
        +author: User
        +tags: List~Tag~
    }

    class Tag {
        +name: String
        +posts: List~Post~
    }

    BaseEntity <|-- User
    BaseEntity <|-- Profile
    BaseEntity <|-- Post
    BaseEntity <|-- Tag

    User "1" *-- "1" Profile
    User "1" --> "*" Post : writes
    Post "*" <--> "*" Tag
```

## Configuration Options

### Complete Configuration Block

```mermaid
---
config:
  class:
    titleTopMargin: 25
    arrowMarkerAbsolute: false
    dividerMargin: 10
    padding: 5
    textHeight: 10
    useMaxWidth: true
    defaultRenderer: dagre
    htmlLabels: false
    hideEmptyMembersBox: false
---
classDiagram
    class Example {
        +attribute: String
        +method() void
    }
```

### Configuration Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `titleTopMargin` | number | 25 | Margin above diagram title |
| `arrowMarkerAbsolute` | boolean | false | Use absolute arrow markers |
| `dividerMargin` | number | 10 | Margin around dividers |
| `padding` | number | 5 | Padding inside class boxes |
| `textHeight` | number | 10 | Height of text lines |
| `useMaxWidth` | boolean | true | Use maximum width |
| `defaultRenderer` | string | dagre | Layout renderer |
| `htmlLabels` | boolean | false | Allow HTML in labels |
| `hideEmptyMembersBox` | boolean | false | Hide empty attribute/method sections |

### Configuration Examples

#### Hide Empty Member Sections

```mermaid
%%{init: {"class": {"hideEmptyMembersBox": true}} }%%
classDiagram
    class OnlyMethods {
        +doSomething() void
        +doMore() void
    }
    class OnlyAttributes {
        +name: String
        +age: int
    }
```

#### Compact Diagram with Reduced Padding

```mermaid
%%{init: {
  "class": {
    "padding": 3,
    "dividerMargin": 5,
    "textHeight": 8
  }
}}%%
classDiagram
    class Compact {
        +attr: String
        +method() void
    }
```

---

## Best Practices

1. **Use visibility modifiers consistently** - Shows encapsulation
2. **Apply annotations for clarity** - `<<interface>>`, `<<abstract>>`, etc.
3. **Show cardinality** - Critical for data modeling
4. **Group with namespaces** - Organizes large diagrams
5. **Use direction wisely** - LR for wide, TB for tall diagrams
6. **Label relationships** - Makes intent clear
7. **Keep diagrams focused** - One domain per diagram
8. **Include key methods only** - Don't show everything
9. **Use `hideEmptyMembersBox`** - Clean up interfaces and partial classes

## Kurt Cagle's Approach

For ontology/class visualization, Cagle would style this similarly to his semantic graphs:

```mermaid
classDiagram
    class Animal {
        <<abstract>>
        +name: String
        +makeSound()* void
    }

    class Dog {
        +breed: String
        +makeSound() void
    }

    class Cat {
        +indoor: bool
        +makeSound() void
    }

    Animal <|-- Dog
    Animal <|-- Cat

    style Animal fill:#DDA0DD,stroke:#000
    style Dog fill:#ADD8E6,stroke:#000
    style Cat fill:#ADD8E6,stroke:#000
```
