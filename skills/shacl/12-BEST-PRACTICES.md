# SHACL Best Practices

Design patterns, anti-patterns, and practical guidance for SHACL shape development.

---

## Core Principles

### 1. Shapes Describe Structure, Not Meaning

> "Shapes describe what things LOOK LIKE, not what they ARE" — Cagle

```turtle
# Good: Structural constraint
sh:property [
    sh:path ex:email ;
    sh:pattern "^[^@]+@[^@]+$"
] .

# Avoid: Trying to encode business logic through shapes alone
# Use SPARQL constraints for complex business rules
```

### 2. Start with Declarative, Add SPARQL as Needed

```turtle
# Prefer: Built-in constraints
sh:property [
    sh:path ex:age ;
    sh:minInclusive 0 ;
    sh:maxInclusive 150
] .

# Use SPARQL for: Cross-entity validation, uniqueness, complex logic
sh:sparql [
    sh:message "Age must be consistent with birth date" ;
    sh:select """..."""
] .
```

### 3. Validate at Boundaries

Apply SHACL validation at:
- **Data ingestion**: Validate before storing
- **API endpoints**: Validate requests/responses
- **ETL pipelines**: Validate transformations
- **User input**: Validate before processing

---

## Shape Design Patterns

### Reusable Property Shapes

```turtle
# Define once
ex:RequiredStringProperty a sh:PropertyShape ;
    sh:datatype xsd:string ;
    sh:minCount 1 ;
    sh:minLength 1 .

# Reuse via composition
ex:PersonShape a sh:NodeShape ;
    sh:property [
        sh:path ex:name ;
        sh:node ex:RequiredStringProperty
    ] .
```

### Inheritance via sh:and

```turtle
ex:BaseEntityShape a sh:NodeShape ;
    sh:property [
        sh:path ex:id ;
        sh:minCount 1 ;
        sh:maxCount 1
    ] ;
    sh:property [
        sh:path ex:created ;
        sh:datatype xsd:dateTime
    ] .

ex:PersonShape a sh:NodeShape ;
    sh:and ( ex:BaseEntityShape ) ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1
    ] .
```

### Optional vs Required

```turtle
# Required (violations if missing)
sh:property [
    sh:path ex:name ;
    sh:minCount 1
] .

# Optional but constrained (only validates if present)
sh:property [
    sh:path ex:nickname ;
    sh:datatype xsd:string ;
    sh:maxLength 50
    # No minCount = optional
] .

# Conditionally required (use SPARQL)
sh:sparql [
    sh:message "Email required for active users" ;
    sh:select """
        SELECT $this WHERE {
            $this ex:status "active" .
            FILTER NOT EXISTS { $this ex:email ?e }
        }
    """
] .
```

---

## Naming Conventions

### Shape Names

```turtle
# Pattern: {Domain}{Concept}Shape
ex:PersonShape
ex:OrderItemShape
ex:AddressShape

# For specific contexts
ex:ActiveCustomerShape
ex:PublishedArticleShape
ex:ValidatedPaymentShape
```

### Property Shape Names

```turtle
# Pattern: {Concept}_{Property}PropertyShape
ex:Person_namePropertyShape
ex:Order_totalPropertyShape

# Or inline (preferred for simple cases)
sh:property [
    sh:path ex:name ;
    ...
] .
```

### Constraint Component Names

```turtle
# Pattern: {Purpose}Constraint
ex:UniqueEmailConstraint
ex:DateRangeConstraint
ex:ManagerDepartmentConstraint
```

---

## Message Guidelines

### Be Specific

```turtle
# Bad
sh:message "Validation failed"

# Good
sh:message "Email address must contain @ symbol"

# Better
sh:message "Email '{?value}' is invalid - must be format user@domain.com"
```

### Include Context

```turtle
sh:message "Employee ID {?value} is already assigned to another employee"
sh:message "Start date {?start} must be before end date {?end}"
```

### Support Multiple Languages

```turtle
sh:message "Name is required"@en ;
sh:message "Der Name ist erforderlich"@de ;
sh:message "Le nom est requis"@fr .
```

### Match Severity to Tone

```turtle
# Violation (blocking)
sh:severity sh:Violation ;
sh:message "ID is required and cannot be empty"

# Warning (advisory)
sh:severity sh:Warning ;
sh:message "Consider adding a description for better searchability"

# Info (guidance)
sh:severity sh:Info ;
sh:message "Tip: Use ISO 8601 format for dates (YYYY-MM-DD)"
```

---

## Performance Optimization

### Place Restrictive Patterns First

```turtle
# In SPARQL constraints, filter early
sh:select """
    SELECT $this
    WHERE {
        $this a ex:Person .           # Restrictive first
        $this ex:status "active" .    # Then more selective
        FILTER NOT EXISTS { ... }     # Filters last
    }
"""
```

### Avoid Unbounded Recursion

```turtle
# Dangerous
sh:path [ sh:zeroOrMorePath ex:relatedTo ]

# Safer: Explicit bounds
sh:path ( ex:relatedTo ex:relatedTo ex:relatedTo )  # Max 3 hops

# Or use SPARQL with LIMIT
sh:sparql [
    sh:select """
        SELECT $this WHERE {
            $this ex:relatedTo+ ?related .
        }
        LIMIT 100
    """
] .
```

### Materialize Frequently Validated Paths

```sparql
# Pre-compute transitive closure
INSERT { ?x ex:ancestorOf ?y }
WHERE { ?x ex:parentOf+ ?y }
```

Then validate against materialized property.

### Use Targeted Shapes

```turtle
# Bad: Validates everything
ex:EverythingShape a sh:NodeShape ;
    sh:targetSubjectsOf ?anyProperty .

# Good: Specific targeting
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person .
```

---

## Common Anti-Patterns

### Anti-Pattern: Over-Constraining

```turtle
# Too strict - may reject valid data
sh:property [
    sh:path ex:phone ;
    sh:pattern "^\\+1-[0-9]{3}-[0-9]{3}-[0-9]{4}$"  # Only US format
] .

# Better - flexible
sh:property [
    sh:path ex:phone ;
    sh:pattern "^\\+?[0-9\\-\\s]{7,20}$"  # International
] .
```

### Anti-Pattern: Duplicate Constraints

```turtle
# Redundant
sh:property [
    sh:path ex:age ;
    sh:datatype xsd:integer ;
    sh:minInclusive 0 ;
    sh:datatype xsd:integer  # Duplicate!
] .
```

### Anti-Pattern: Missing Severity

```turtle
# All violations are blocking
sh:property [
    sh:path ex:preferredName ;
    sh:maxLength 50
    # Missing: sh:severity sh:Warning
] .

# Consider: Is this truly blocking?
```

### Anti-Pattern: Circular Shape References

```turtle
# Can cause infinite loops
ex:AShape a sh:NodeShape ;
    sh:property [
        sh:path ex:hasB ;
        sh:node ex:BShape
    ] .

ex:BShape a sh:NodeShape ;
    sh:property [
        sh:path ex:hasA ;
        sh:node ex:AShape
    ] .

# Handle with maxCount or custom logic
```

### Anti-Pattern: Ignoring Open World

```turtle
# Assumes closed world
sh:property [
    sh:path ex:status ;
    sh:in ("active" "inactive")
    # What if status is unknown/not yet set?
] .

# Consider
sh:property [
    sh:path ex:status ;
    sh:in ("active" "inactive" "unknown") ;
    sh:defaultValue "unknown"
] .
```

---

## Testing Shapes

### Unit Test Each Shape

```turtle
# Test data
ex:ValidPerson a ex:Person ;
    ex:name "John" ;
    ex:email "john@example.com" .

ex:InvalidPerson a ex:Person ;
    ex:email "invalid-email" .
    # Missing name

# Expected: ValidPerson passes, InvalidPerson fails
```

### Test Edge Cases

- Empty values
- Maximum length strings
- Boundary numbers (0, -1, max)
- Unicode characters
- Missing optional properties
- Multiple values when only one expected

### Validate the Shapes Themselves

```sparql
# Find shapes without targets
SELECT ?shape WHERE {
    ?shape a sh:NodeShape .
    FILTER NOT EXISTS { ?shape sh:targetClass ?c }
    FILTER NOT EXISTS { ?shape sh:targetNode ?n }
    FILTER NOT EXISTS { ?shape sh:targetSubjectsOf ?p }
    FILTER NOT EXISTS { ?shape sh:targetObjectsOf ?p }
    FILTER NOT EXISTS { ?shape sh:target ?t }
}
```

---

## Documentation

### Document Shape Purpose

```turtle
ex:ActiveCustomerShape a sh:NodeShape ;
    rdfs:label "Active Customer Shape" ;
    rdfs:comment """
        Validates customers who have made purchases in the last 12 months.
        Used for: Marketing campaigns, loyalty programs.
        Owner: Customer Success Team
        Last updated: 2025-01-15
    """ ;
    sh:targetClass ex:Customer .
```

### Document Constraints

```turtle
sh:property [
    sh:path ex:creditLimit ;
    sh:name "creditLimit" ;
    sh:description """
        Maximum credit extended to customer.
        Business rule: Cannot exceed 10x average monthly purchase.
        Approval required for exceptions.
    """ ;
    sh:maxInclusive 100000
] .
```

### Version Shapes

```turtle
ex:PersonShape_v2 a sh:NodeShape ;
    dcterms:replaces ex:PersonShape_v1 ;
    dcterms:issued "2025-01-01"^^xsd:date ;
    rdfs:comment "Added email validation, deprecated fax field" .
```

---

## Checklist

### Before Deploying a Shape

- [ ] All required properties have `sh:minCount`
- [ ] Appropriate `sh:severity` for each constraint
- [ ] Clear, actionable `sh:message` for each constraint
- [ ] `sh:order` set for UI-relevant shapes
- [ ] `sh:name` and `sh:description` for documentation
- [ ] Tested against valid data (should pass)
- [ ] Tested against invalid data (should fail correctly)
- [ ] Performance tested against realistic data volumes
- [ ] No unbounded recursive paths
- [ ] SPARQL constraints have appropriate indexes available

---

## Resources

- [Understanding Shapes](https://ontologist.substack.com/p/understanding-shapes) — Kurt Cagle
- [Tips for Building Knowledge Graphs](https://ontologist.substack.com/p/tips-for-building-knowledge-graphs) — Kurt Cagle
- [SHACL Specification](https://www.w3.org/TR/shacl/) — W3C
- [Semantic Web for the Working Ontologist](https://www.amazon.com/Semantic-Web-Working-Ontologist-Effective/dp/1450376142) — Allemang, Hendler, Gandon
