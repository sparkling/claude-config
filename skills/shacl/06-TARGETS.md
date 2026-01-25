# SHACL Targets

Targets determine which nodes in the data graph are validated against a shape.

---

## Target Types Overview

| Target Type | Property | Selects |
|-------------|----------|---------|
| Class Target | `sh:targetClass` | Instances of class |
| Node Target | `sh:targetNode` | Specific nodes |
| Subjects-of Target | `sh:targetSubjectsOf` | Subjects having property |
| Objects-of Target | `sh:targetObjectsOf` | Objects of property |
| Implicit Class Target | (shape is also class) | Instances of shape-as-class |
| SPARQL Target | `sh:target` | Custom SPARQL selection |

---

## Class-Based Targets

### Single Class

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [...] .
```

All instances of `ex:Person` become focus nodes.

### Multiple Classes

```turtle
ex:AgentShape a sh:NodeShape ;
    sh:targetClass ex:Person, ex:Organization, ex:SoftwareAgent ;
    sh:property [...] .
```

Instances of ANY listed class become focus nodes (union).

### Subclass Considerations

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person .

# Data:
ex:Employee rdfs:subClassOf ex:Person .
ex:John a ex:Employee .
```

**Important**: Whether `ex:John` is validated depends on RDFS inference:
- With inference: `ex:John` is also `rdf:type ex:Person` → validated
- Without inference: `ex:John` is only `ex:Employee` → NOT validated

For explicit subclass targeting:

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person, ex:Employee, ex:Customer .
```

---

## Node Targets

### Specific Nodes

```turtle
ex:CriticalConfigShape a sh:NodeShape ;
    sh:targetNode ex:SystemConfig, ex:SecurityConfig ;
    sh:property [...] .
```

Only the explicitly named nodes are validated.

### Use Cases

- Configuration validation
- Singleton resources
- Critical entities requiring special validation
- Testing specific instances

---

## Property-Based Targets

### Subjects-of Target

Target nodes that ARE SUBJECTS of a specific property:

```turtle
ex:AuthorShape a sh:NodeShape ;
    sh:targetSubjectsOf ex:wrote ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1
    ] .
```

Any node that appears as subject in `?node ex:wrote ?something` is validated.

### Objects-of Target

Target nodes that ARE OBJECTS of a specific property:

```turtle
ex:BookShape a sh:NodeShape ;
    sh:targetObjectsOf ex:wrote ;
    sh:property [
        sh:path ex:title ;
        sh:minCount 1
    ] .
```

Any node that appears as object in `?someone ex:wrote ?node` is validated.

### Combining Property Targets

```turtle
# Anything that was written OR published
ex:PublicationShape a sh:NodeShape ;
    sh:targetObjectsOf ex:wrote ;
    sh:targetObjectsOf ex:published ;
    sh:property [...] .
```

---

## Implicit Class Targets

When a shape is also defined as a class:

```turtle
# Shape that IS a class
ex:Person a sh:NodeShape, rdfs:Class ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1
    ] .

# Instances are automatically targeted
ex:John a ex:Person .  # Validated against ex:Person shape
```

This is OWL-style punning—the same IRI serves as both class and shape.

### Advantages
- Cleaner ontologies
- Single source of truth
- Natural integration with class hierarchies

### Disadvantages
- Tight coupling between ontology and validation
- Less flexible than separate shapes
- Can confuse tools expecting pure OWL or pure SHACL

---

## SPARQL-Based Targets (Advanced)

For complex targeting logic, use SPARQL:

```turtle
ex:HighValueCustomerShape a sh:NodeShape ;
    sh:target [
        a sh:SPARQLTarget ;
        sh:select """
            SELECT ?this
            WHERE {
                ?this a ex:Customer ;
                      ex:totalPurchases ?total .
                FILTER (?total > 10000)
            }
        """
    ] ;
    sh:property [...] .
```

### SPARQL Target Requirements
- Must be a SELECT query
- Must bind `?this` variable
- Returns focus nodes

### Use Cases

- Conditional targeting (e.g., customers above threshold)
- Complex criteria (e.g., nodes with specific relationships)
- Temporal conditions (e.g., recently modified)
- Computed membership

---

## Target Combinations

### Multiple Target Types

Shapes can have multiple targets (union):

```turtle
ex:ImportantEntityShape a sh:NodeShape ;
    sh:targetClass ex:VIPCustomer ;
    sh:targetNode ex:CEOAccount ;
    sh:targetSubjectsOf ex:criticalOperation ;
    sh:property [...] .
```

All nodes matching ANY target are validated.

### No Targets

A shape without targets is not applied automatically during validation:

```turtle
ex:AddressShape a sh:NodeShape ;
    # No target
    sh:property [...] .
```

Such shapes are typically:
- Referenced via `sh:node` from other shapes
- Applied explicitly by validation APIs
- Used as building blocks

---

## Target Selection Patterns (Cagle's Approach)

### Instance-Level Validation

> "Shapes can target individual nodes without requiring class membership"

```turtle
# Validate specific node without class
ex:BrightEyesShape a sh:NodeShape ;
    sh:targetNode ex:BrightEyes ;
    sh:property [
        sh:path ex:species ;
        sh:hasValue ex:Cat
    ] .
```

### Property-Triggered Classification

```turtle
# If you have employees, you're an employer
ex:EmployerShape a sh:NodeShape ;
    sh:targetSubjectsOf ex:hasEmployee ;
    sh:property [
        sh:path ex:taxId ;
        sh:minCount 1
    ] .
```

### Conditional Targeting

```turtle
# Only published articles
ex:PublishedArticleShape a sh:NodeShape ;
    sh:target [
        a sh:SPARQLTarget ;
        sh:select """
            SELECT ?this WHERE {
                ?this a ex:Article ;
                      ex:status "published" .
            }
        """
    ] ;
    sh:property [
        sh:path ex:publicationDate ;
        sh:minCount 1
    ] .
```

---

## Best Practices

### 1. Choose Appropriate Target Type

| Scenario | Recommended Target |
|----------|-------------------|
| All instances of a type | `sh:targetClass` |
| Specific known resources | `sh:targetNode` |
| Nodes with certain relationships | `sh:targetSubjectsOf` / `sh:targetObjectsOf` |
| Complex conditions | SPARQL Target |

### 2. Consider Inference

Decide whether to rely on RDFS/OWL inference:
- With inference: Target superclasses, subclasses included automatically
- Without inference: Explicitly list all relevant classes

### 3. Document Target Intent

```turtle
ex:ActiveCustomerShape a sh:NodeShape ;
    rdfs:comment "Validates customers who have made purchases in the last year" ;
    sh:target [...] .
```

### 4. Test Target Coverage

Verify your targets select the intended nodes:

```sparql
# Find all nodes that would be targeted by class target
SELECT ?node WHERE {
    ?node a ex:Person .
}

# Find all nodes targeted by subjects-of
SELECT DISTINCT ?node WHERE {
    ?node ex:wrote ?anything .
}
```

### 5. Avoid Over-Targeting

Don't validate everything:
```turtle
# BAD: Validates all nodes
ex:EverythingShape a sh:NodeShape ;
    sh:targetSubjectsOf ?anyProperty .

# GOOD: Specific targeting
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person .
```

---

## Complete Example

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# Class-based target
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1
    ] .

# Node target for special entities
ex:AdminConfigShape a sh:NodeShape ;
    sh:targetNode ex:SystemAdmin, ex:SecurityAdmin ;
    sh:property [
        sh:path ex:secretKey ;
        sh:minCount 1
    ] .

# Property-based target
ex:AuthorShape a sh:NodeShape ;
    sh:targetSubjectsOf ex:authored ;
    sh:property [
        sh:path ex:biography ;
        sh:maxLength 5000
    ] .

# SPARQL target for complex conditions
ex:PremiumCustomerShape a sh:NodeShape ;
    sh:target [
        a sh:SPARQLTarget ;
        sh:select """
            SELECT ?this WHERE {
                ?this a ex:Customer ;
                      ex:membershipLevel "premium" ;
                      ex:accountActive true .
            }
        """
    ] ;
    sh:property [
        sh:path ex:dedicatedSupport ;
        sh:minCount 1
    ] .

# Implicit class target (punning)
ex:Document a sh:NodeShape, rdfs:Class ;
    sh:property [
        sh:path ex:title ;
        sh:minCount 1
    ] .
```
