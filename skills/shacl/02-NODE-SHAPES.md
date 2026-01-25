# Node Shapes

> "A node shape is not necessarily a class" — Kurt Cagle

Node shapes define constraints on focus nodes themselves. They are the primary building blocks of SHACL validation.

---

## Understanding Node Shapes

### What is a Node Shape?

A node shape constrains individual nodes (resources) in an RDF graph. Unlike OWL classes that define what something IS, shapes describe what something LOOKS LIKE structurally.

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.org/> .

ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [...] .
```

### Key Characteristics

1. **Type**: `sh:NodeShape`
2. **No `sh:path`**: Node shapes never have `sh:path` (that's for property shapes)
3. **Targets focus nodes**: Identifies which nodes to validate
4. **Contains constraints**: Either directly or via property shapes

---

## Creating Node Shapes

### Minimal Node Shape

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person .
```

### Node Shape with Property Constraints

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1
    ] ;
    sh:property [
        sh:path ex:email ;
        sh:datatype xsd:string
    ] .
```

### Node Shape with Direct Constraints

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:nodeKind sh:IRI ;           # Must be an IRI (not blank node)
    sh:class ex:Agent ;            # Must be instance of Agent
    sh:property [...] .
```

---

## Targeting Focus Nodes

### Class-Based Targeting

The most common approach—validate all instances of a class:

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person .

# Multiple classes
ex:AgentShape a sh:NodeShape ;
    sh:targetClass ex:Person, ex:Organization .
```

### Node Targeting

Validate specific named resources:

```turtle
ex:CriticalResourceShape a sh:NodeShape ;
    sh:targetNode ex:ImportantEntity, ex:CriticalConfig .
```

### Property-Based Targeting

Target nodes based on their relationships:

```turtle
# Subjects that have a specific property
ex:AuthorShape a sh:NodeShape ;
    sh:targetSubjectsOf ex:wrote .

# Objects of a specific property
ex:BookShape a sh:NodeShape ;
    sh:targetObjectsOf ex:wrote .
```

### Implicit Class Targeting

When a shape is also defined as a class:

```turtle
# Shape and class combined (punning)
ex:Person a sh:NodeShape, rdfs:Class ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1
    ] .

# Instances automatically targeted
ex:John a ex:Person .  # Will be validated against ex:Person shape
```

---

## Node Constraints

### Class Constraint

Value must be instance of specified class:

```turtle
ex:ManagerShape a sh:NodeShape ;
    sh:targetClass ex:Manager ;
    sh:class ex:Employee .  # Must also be an Employee
```

### Node Kind Constraint

Restrict the type of RDF term:

```turtle
ex:ResourceShape a sh:NodeShape ;
    sh:nodeKind sh:IRI .         # Must be IRI
    sh:nodeKind sh:BlankNode .   # Must be blank node
    sh:nodeKind sh:Literal .     # Must be literal
    sh:nodeKind sh:BlankNodeOrIRI .
    sh:nodeKind sh:BlankNodeOrLiteral .
    sh:nodeKind sh:IRIOrLiteral .
```

### Closed Shape

Restrict to declared properties only:

```turtle
ex:StrictPersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:closed true ;
    sh:ignoredProperties ( rdf:type ) ;  # Allow these anyway
    sh:property [
        sh:path ex:name ;
        sh:minCount 1
    ] ;
    sh:property [
        sh:path ex:email
    ] .
```

With `sh:closed true`, any properties not declared in the shape (except ignored ones) cause violations.

---

## Combining Constraints

### Logical AND

All constraints must be satisfied:

```turtle
ex:ValidPersonShape a sh:NodeShape ;
    sh:and (
        ex:HasNameShape
        ex:HasEmailShape
        ex:IsAdultShape
    ) .
```

### Logical OR

At least one constraint must be satisfied:

```turtle
ex:ContactShape a sh:NodeShape ;
    sh:or (
        [ sh:property [ sh:path ex:email ; sh:minCount 1 ] ]
        [ sh:property [ sh:path ex:phone ; sh:minCount 1 ] ]
    ) .
```

### Logical NOT

Constraint must NOT be satisfied:

```turtle
ex:ActivePersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:not [
        sh:property [
            sh:path ex:status ;
            sh:hasValue "inactive"
        ]
    ] .
```

### Exclusive OR (XOne)

Exactly one constraint must be satisfied:

```turtle
ex:EntityShape a sh:NodeShape ;
    sh:xone (
        [ sh:class ex:Person ]
        [ sh:class ex:Organization ]
    ) .
```

---

## Nested Shapes

### Using sh:node

Require values to conform to another shape:

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:address ;
        sh:node ex:AddressShape ;  # Values must conform to AddressShape
        sh:minCount 1
    ] .

ex:AddressShape a sh:NodeShape ;
    sh:property [
        sh:path ex:street ;
        sh:minCount 1
    ] ;
    sh:property [
        sh:path ex:city ;
        sh:minCount 1
    ] .
```

### Inline Nested Shape

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:address ;
        sh:minCount 1 ;
        sh:node [
            a sh:NodeShape ;
            sh:property [
                sh:path ex:street ;
                sh:minCount 1
            ]
        ]
    ] .
```

---

## Shape Metadata

### Documentation Properties

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:name "Person" ;
    sh:description "Shape for validating person entities" ;
    sh:order 1 ;
    sh:group ex:CoreShapes ;
    sh:property [...] .
```

### Deactivation

```turtle
ex:DeprecatedShape a sh:NodeShape ;
    sh:deactivated true ;  # Shape ignored during validation
    sh:property [...] .
```

---

## Instance-Level Shapes (Cagle's Pattern)

Shapes can target individual nodes without requiring class membership:

```turtle
# Target specific node, not a class
ex:BrightEyesShape a sh:NodeShape ;
    sh:targetNode ex:BrightEyes ;
    sh:property [
        sh:path ex:species ;
        sh:hasValue ex:Cat
    ] ;
    sh:property [
        sh:path ex:breed ;
        sh:hasValue ex:Siamese
    ] .
```

This enables validation without `rdf:type` declarations—useful for:
- External data integration
- Flexible classification
- Pattern-based discovery

---

## Best Practices

### 1. Name Your Shapes Meaningfully

```turtle
# Good
ex:ActiveEmployeeShape a sh:NodeShape .
ex:PublishedArticleShape a sh:NodeShape .

# Avoid
ex:Shape1 a sh:NodeShape .
```

### 2. Use Reusable Shapes

```turtle
# Define once
ex:HasNameShape a sh:NodeShape ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1 ;
        sh:datatype xsd:string
    ] .

# Reuse via sh:and
ex:PersonShape a sh:NodeShape ;
    sh:and ( ex:HasNameShape [...] ) .
```

### 3. Document Constraints

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:description "Validates person entities for the HR system" ;
    sh:property [
        sh:path ex:employeeId ;
        sh:name "Employee ID" ;
        sh:description "Unique identifier assigned by HR"
    ] .
```

### 4. Consider Open vs Closed

- **Open (default)**: Additional properties allowed
- **Closed (`sh:closed true`)**: Only declared properties allowed

Use closed shapes for:
- Strict API contracts
- Database-backed systems
- High-integrity requirements
