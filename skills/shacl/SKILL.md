---
name: shacl
description: Design, implement, and validate RDF data with SHACL (Shapes Constraint Language). Covers node shapes, property shapes, constraint components, validation reports, SHACL-SPARQL integration, AI/LLM patterns, UI generation, and taxonomy integration. Informed by Kurt Cagle's ontologist perspective and W3C specifications.
allowed-tools: Read, Write, Edit, Grep, Glob, WebFetch
---

# SHACL Skill

Design, implement, and validate RDF data structures with the Shapes Constraint Language. This skill embodies the practical wisdom that shapes provide a fundamentally different way of thinking about data than classes—they describe structural expectations and patterns without requiring formal hierarchies.

---

## Core Philosophy (Cagle's Principles)

> "OWL is not going away, but there is definitely a shift occurring within the semantic community around the use of SHAPES, rather than classes and properties."

**Key Insights:**

1. **Shapes, not classes**: "A shape is, at its core, simply a pattern that is common to one or more nodes in a graph"
2. **SHACL wraps SPARQL**: "Learn SPARQL. SHACL can be thought of as a dedicated wrapper around SPARQL queries and filters"
3. **Validation, not inference**: SHACL validates existing data; OWL prevents invalid data through inference
4. **Beyond validation**: SHACL provides "structural information, including data groupings, ordering, and interfaces"
5. **The future is shapes**: "SHACL will eventually be foundational not just for RDF, but at the broader level of data design and management"

---

## Guide Router

Load **only ONE guide** per request:

| User Intent | Load Guide | Content |
|-------------|------------|---------|
| Node shapes, targeting, focus nodes | 02-NODE-SHAPES.md | NodeShape fundamentals |
| Property shapes, paths, constraints | 03-PROPERTY-SHAPES.md | PropertyShape patterns |
| Constraint types, cardinality, datatype | 04-CONSTRAINT-COMPONENTS.md | All constraint components |
| Property paths, traversal, sequences | 05-PROPERTY-PATHS.md | SHACL path expressions |
| Targets, class targets, SPARQL targets | 06-TARGETS.md | Focus node selection |
| Validation reports, results, severity | 07-VALIDATION-REPORTS.md | Report structure |
| SPARQL constraints, custom validation | 08-SHACL-SPARQL.md | Advanced constraints |
| AI/LLM integration, query generation | 09-SHACL-FOR-AI.md | SHACL with AI systems |
| UI generation, forms, DASH widgets | 10-SHACL-UI.md | Interface scaffolding |
| Taxonomies, SKOS, classification | 11-SHACL-TAXONOMIES.md | Taxonomy validation |
| Best practices, patterns, anti-patterns | 12-BEST-PRACTICES.md | Design guidance |

---

## SHACL vs OWL: The Paradigm Shift

### Why the Shift?

> "Reasoners are disappearing from newer knowledge graph systems, partly because there is no real demand and partly because SPARQL and SPARQL Update are more targeted in their capabilities." — Cagle

| Aspect | OWL | SHACL |
|--------|-----|-------|
| Purpose | Inference & classification | Validation & constraints |
| Approach | Forward-chaining rules | SPARQL-based checking |
| Invalid data | Prevents storage | Allows storage, reports issues |
| Severity | Binary (valid/invalid) | Graduated (Violation/Warning/Info) |
| World assumption | Open (unknown ≠ false) | Closed by default |
| Implementation | Requires reasoner | SPARQL engine sufficient |
| Learning curve | Steep (formal logic) | Accessible (structural) |

### Philosophical Differences

**OWL (Open World):**
```turtle
# No children stated doesn't mean childless
ex:John a ex:Person .
# John might have children we don't know about
# OWL CANNOT conclude John is childless
```

**SHACL (Closed World by Default):**
```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:hasChild ;
        sh:maxCount 0 ;
        sh:message "Person has no children recorded"
    ] .
# SHACL CAN validate that John has no children in the data
```

---

## SHACL Quick Reference

### Core Vocabulary

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
```

### Basic Node Shape

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;           # What to validate
    sh:property ex:NamePropertyShape ;   # Property constraints
    sh:property ex:EmailPropertyShape .
```

### Basic Property Shape

```turtle
ex:NamePropertyShape a sh:PropertyShape ;
    sh:path ex:name ;                    # Property to constrain
    sh:minCount 1 ;                      # At least one
    sh:maxCount 1 ;                      # At most one
    sh:datatype xsd:string ;             # Must be string
    sh:message "Person must have exactly one name" .
```

### Inline Property Shapes

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1 ;
        sh:datatype xsd:string
    ] ;
    sh:property [
        sh:path ex:email ;
        sh:pattern "^[^@]+@[^@]+\\.[^@]+$" ;
        sh:severity sh:Warning
    ] .
```

---

## Constraint Components Summary

### Value Type Constraints

| Constraint | Purpose | Example |
|------------|---------|---------|
| `sh:class` | Instance of class | `sh:class ex:Person` |
| `sh:datatype` | Literal datatype | `sh:datatype xsd:string` |
| `sh:nodeKind` | IRI/Literal/BlankNode | `sh:nodeKind sh:IRI` |

### Cardinality Constraints

| Constraint | Purpose | Example |
|------------|---------|---------|
| `sh:minCount` | Minimum values | `sh:minCount 1` |
| `sh:maxCount` | Maximum values | `sh:maxCount 1` |

### Value Range Constraints

| Constraint | Purpose | Example |
|------------|---------|---------|
| `sh:minInclusive` | >= value | `sh:minInclusive 0` |
| `sh:maxInclusive` | <= value | `sh:maxInclusive 150` |
| `sh:minExclusive` | > value | `sh:minExclusive 0` |
| `sh:maxExclusive` | < value | `sh:maxExclusive 200` |

### String Constraints

| Constraint | Purpose | Example |
|------------|---------|---------|
| `sh:minLength` | Min string length | `sh:minLength 1` |
| `sh:maxLength` | Max string length | `sh:maxLength 100` |
| `sh:pattern` | Regex match | `sh:pattern "^[A-Z]"` |
| `sh:languageIn` | Allowed languages | `sh:languageIn ("en" "de")` |
| `sh:uniqueLang` | One per language | `sh:uniqueLang true` |

### Value Constraints

| Constraint | Purpose | Example |
|------------|---------|---------|
| `sh:in` | Enumeration | `sh:in ("draft" "published")` |
| `sh:hasValue` | Required value | `sh:hasValue ex:Required` |

### Logical Constraints

| Constraint | Purpose | Example |
|------------|---------|---------|
| `sh:and` | All must validate | `sh:and (ex:Shape1 ex:Shape2)` |
| `sh:or` | One must validate | `sh:or (ex:TypeA ex:TypeB)` |
| `sh:not` | Must NOT validate | `sh:not ex:DraftShape` |
| `sh:xone` | Exactly one validates | `sh:xone (ex:A ex:B)` |

### Shape-Based Constraints

| Constraint | Purpose | Example |
|------------|---------|---------|
| `sh:node` | Value conforms to shape | `sh:node ex:AddressShape` |
| `sh:property` | Property constraint | `sh:property [...]` |
| `sh:qualifiedValueShape` | Qualified cardinality | See guide |

---

## Property Paths

SHACL supports SPARQL-style property paths:

```turtle
# Predicate path (direct property)
sh:path ex:name

# Sequence path (chain of properties)
sh:path (ex:parent ex:name)

# Alternative path
sh:path [sh:alternativePath (rdfs:label skos:prefLabel)]

# Inverse path
sh:path [sh:inversePath ex:parent]

# Zero or more
sh:path [sh:zeroOrMorePath ex:parent]

# One or more
sh:path [sh:oneOrMorePath ex:parent]

# Zero or one
sh:path [sh:zeroOrOnePath ex:middleName]
```

---

## Target Types

### Class-Based Targets

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person .
```

### Node Targets

```turtle
ex:SpecificShape a sh:NodeShape ;
    sh:targetNode ex:ImportantResource .
```

### Property-Based Targets

```turtle
# Subjects of property
ex:AuthorShape a sh:NodeShape ;
    sh:targetSubjectsOf ex:wrote .

# Objects of property
ex:BookShape a sh:NodeShape ;
    sh:targetObjectsOf ex:wrote .
```

### Implicit Class Targets

```turtle
# Shape that is also a class
ex:Person a sh:NodeShape, rdfs:Class ;
    sh:property [...] .
```

---

## Severity Levels

```turtle
sh:Violation  # Critical failure (default)
sh:Warning    # Non-critical alert
sh:Info       # Informational message
```

Usage:
```turtle
ex:EmailShape a sh:PropertyShape ;
    sh:path ex:email ;
    sh:pattern "^[^@]+@[^@]+$" ;
    sh:severity sh:Warning ;
    sh:message "Email format appears invalid" .
```

---

## Complete Example

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ex:EmployeeShape a sh:NodeShape ;
    sh:targetClass ex:Employee ;

    # Required employee ID
    sh:property [
        sh:path ex:employeeId ;
        sh:name "employeeId" ;
        sh:description "Unique employee identifier" ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:datatype xsd:string ;
        sh:pattern "^EMP[0-9]{6}$" ;
        sh:severity sh:Violation ;
        sh:message "Employee must have exactly one valid ID (format: EMP######)"
    ] ;

    # Required organization
    sh:property [
        sh:path ex:worksFor ;
        sh:name "worksFor" ;
        sh:minCount 1 ;
        sh:class ex:Organization ;
        sh:severity sh:Violation ;
        sh:message "Employee must work for at least one organization"
    ] ;

    # Optional manager (at most one)
    sh:property [
        sh:path ex:hasManager ;
        sh:name "manager" ;
        sh:maxCount 1 ;
        sh:class ex:Employee ;
        sh:severity sh:Warning ;
        sh:message "Employee should have at most one manager"
    ] .
```

---

## SHACL Use Cases (Cagle's Framework)

1. **Data Quality Assurance**: Validate data pipelines before storage
2. **Classification**: Categorize unstructured data into shapes
3. **Structural Definition**: Define expected data entry structures
4. **Functional Metadata**: Bridge object-oriented and graph systems
5. **UI Generation**: Generate forms and interfaces from shapes
6. **API Contracts**: Define request/response structures
7. **AI Integration**: Describe query parameters for LLMs
8. **Documentation**: Self-documenting requirements specifications

---

## Resources

### W3C Specifications
- [SHACL Core](https://www.w3.org/TR/shacl/)
- [SHACL Advanced Features](https://www.w3.org/TR/shacl-af/)
- [SHACL Use Cases and Requirements](https://www.w3.org/TR/shacl-ucr/)

### Books
- *Semantic Web for the Working Ontologist* by Allemang, Hendler, Gandon (3rd ed.)
- *Learning SPARQL* by Bob DuCharme (O'Reilly)

### Kurt Cagle's Work
- [The Ontologist](https://ontologist.substack.com/) — Substack newsletter
- [The Cagle Report](https://thecaglereport.com/) — Enterprise data and AI
- [Validating ANYTHING With SHACL](https://ontologist.substack.com/p/validating-anything-with-shacl)
- [SHACL and Taxonomies](https://ontologist.substack.com/p/shacl-and-taxonomies)
- [SHACL for User Interfaces](https://ontologist.substack.com/p/shacl-for-user-interfaces)
- [Using SHACL and AI for Creating Queries](https://ontologist.substack.com/p/using-shacl-and-ai-for-creating-queries)
