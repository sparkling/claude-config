# SHACL-SPARQL Integration

> "Learn SPARQL. SHACL can be thought of as a dedicated wrapper around SPARQL queries and filters." — Kurt Cagle

SHACL-SPARQL extends core SHACL with custom SPARQL-based constraints for complex validation logic.

---

## SPARQL-Based Constraints

### Basic Structure

```turtle
ex:CustomConstraint a sh:SPARQLConstraint ;
    sh:message "Validation failed" ;
    sh:prefixes ex:prefixes ;
    sh:select """
        SELECT $this ?value
        WHERE {
            $this ex:property ?value .
            FILTER (condition)
        }
    """ .
```

### Binding in Shapes

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:sparql ex:UniqueEmailConstraint .
```

Or inline:

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:sparql [
        sh:message "Email must be unique" ;
        sh:select """
            SELECT $this ?email
            WHERE {
                $this ex:email ?email .
                ?other ex:email ?email .
                FILTER ($this != ?other)
            }
        """
    ] .
```

---

## Pre-Bound Variables

SHACL provides these variables in SPARQL constraints:

| Variable | Description |
|----------|-------------|
| `$this` | The focus node being validated |
| `$PATH` | The property path (in property shapes) |
| `$shapesGraph` | The shapes graph URI |
| `$currentShape` | The current shape being validated |

---

## SELECT-Based Constraints

SELECT constraints return rows for violations. Any result = violation.

### Unique Value Constraint

```turtle
ex:UniqueEmailConstraint a sh:SPARQLConstraint ;
    sh:message "Email address must be unique: {?email}" ;
    sh:select """
        SELECT $this ?email
        WHERE {
            $this ex:email ?email .
            ?other ex:email ?email .
            FILTER ($this != ?other)
        }
    """ .
```

### Cross-Property Validation

```turtle
ex:DateRangeConstraint a sh:SPARQLConstraint ;
    sh:message "End date must be after start date" ;
    sh:select """
        SELECT $this ?start ?end
        WHERE {
            $this ex:startDate ?start ;
                  ex:endDate ?end .
            FILTER (?end <= ?start)
        }
    """ .
```

### Conditional Required Fields

```turtle
ex:PremiumRequiresContact a sh:SPARQLConstraint ;
    sh:message "Premium members must have phone or email" ;
    sh:select """
        SELECT $this
        WHERE {
            $this ex:membershipLevel "premium" .
            FILTER NOT EXISTS { $this ex:phone ?phone }
            FILTER NOT EXISTS { $this ex:email ?email }
        }
    """ .
```

### Referential Integrity

```turtle
ex:ValidManagerConstraint a sh:SPARQLConstraint ;
    sh:message "Manager must be an employee of the same company" ;
    sh:select """
        SELECT $this ?manager ?company
        WHERE {
            $this ex:manager ?manager ;
                  ex:worksFor ?company .
            FILTER NOT EXISTS { ?manager ex:worksFor ?company }
        }
    """ .
```

---

## ASK-Based Constraints

ASK constraints return true for conforming values (opposite of SELECT).

```turtle
ex:ValidAgeConstraint a sh:SPARQLConstraint ;
    sh:message "Invalid age" ;
    sh:ask """
        ASK {
            $this ex:birthDate ?birth ;
                  ex:deathDate ?death .
            FILTER (?death < ?birth)
        }
    """ .
```

If ASK returns `true`, the constraint is **violated**.

---

## Property Shape SPARQL

For property shapes, use `$PATH`:

```turtle
ex:PositiveValuesConstraint a sh:PropertyShape ;
    sh:path ex:values ;
    sh:sparql [
        sh:message "All values must be positive" ;
        sh:select """
            SELECT $this ?value
            WHERE {
                $this $PATH ?value .
                FILTER (?value <= 0)
            }
        """
    ] .
```

---

## Prefix Declarations

### Inline Prefixes

```turtle
ex:MyConstraint a sh:SPARQLConstraint ;
    sh:prefixes [
        sh:declare [
            sh:prefix "ex" ;
            sh:namespace "http://example.org/"^^xsd:anyURI
        ] ;
        sh:declare [
            sh:prefix "xsd" ;
            sh:namespace "http://www.w3.org/2001/XMLSchema#"^^xsd:anyURI
        ]
    ] ;
    sh:select """...""" .
```

### Shared Prefix Set

```turtle
ex:prefixes
    sh:declare [
        sh:prefix "ex" ;
        sh:namespace "http://example.org/"^^xsd:anyURI
    ] ;
    sh:declare [
        sh:prefix "xsd" ;
        sh:namespace "http://www.w3.org/2001/XMLSchema#"^^xsd:anyURI
    ] ;
    sh:declare [
        sh:prefix "rdf" ;
        sh:namespace "http://www.w3.org/1999/02/22-rdf-syntax-ns#"^^xsd:anyURI
    ] .

ex:Constraint1 sh:prefixes ex:prefixes ; sh:select """...""" .
ex:Constraint2 sh:prefixes ex:prefixes ; sh:select """...""" .
```

---

## Custom Constraint Components

Define reusable parameterized constraints:

### Component Definition

```turtle
ex:UniquePropertyComponent a sh:ConstraintComponent ;
    sh:parameter [
        sh:path ex:uniqueProperty ;
        sh:description "Property that must be unique" ;
        sh:nodeKind sh:IRI
    ] ;
    sh:propertyValidator [
        a sh:SPARQLSelectValidator ;
        sh:prefixes ex:prefixes ;
        sh:select """
            SELECT $this ?value
            WHERE {
                $this $uniqueProperty ?value .
                ?other $uniqueProperty ?value .
                FILTER ($this != ?other)
            }
        """
    ] .
```

### Component Usage

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:email ;
        ex:uniqueProperty ex:email  # Uses custom component
    ] .
```

---

## SPARQL Target Types

### Basic SPARQL Target

```turtle
ex:ActiveCustomerShape a sh:NodeShape ;
    sh:target [
        a sh:SPARQLTarget ;
        sh:prefixes ex:prefixes ;
        sh:select """
            SELECT ?this
            WHERE {
                ?this a ex:Customer ;
                      ex:status "active" .
            }
        """
    ] .
```

### Parameterized Target Type

```turtle
ex:StatusTargetType a sh:SPARQLTargetType ;
    sh:parameter [
        sh:path ex:requiredStatus
    ] ;
    sh:prefixes ex:prefixes ;
    sh:select """
        SELECT ?this
        WHERE {
            ?this ex:status $requiredStatus .
        }
    """ .

ex:PublishedShape a sh:NodeShape ;
    sh:target [
        a ex:StatusTargetType ;
        ex:requiredStatus "published"
    ] .
```

---

## Common SPARQL Constraint Patterns

### Uniqueness

```turtle
sh:sparql [
    sh:message "Value must be unique" ;
    sh:select """
        SELECT $this ?value
        WHERE {
            $this $PATH ?value .
            ?other $PATH ?value .
            FILTER ($this != ?other)
        }
    """
] .
```

### Symmetry

```turtle
sh:sparql [
    sh:message "Symmetric relationship violated" ;
    sh:select """
        SELECT $this ?other
        WHERE {
            $this ex:marriedTo ?other .
            FILTER NOT EXISTS { ?other ex:marriedTo $this }
        }
    """
] .
```

### Transitivity Check

```turtle
sh:sparql [
    sh:message "Circular dependency detected" ;
    sh:select """
        SELECT $this
        WHERE {
            $this ex:dependsOn+ $this .
        }
    """
] .
```

### Count Constraints

```turtle
sh:sparql [
    sh:message "Must have between 2 and 5 members" ;
    sh:select """
        SELECT $this (COUNT(?member) AS ?count)
        WHERE {
            $this ex:hasMember ?member .
        }
        GROUP BY $this
        HAVING (COUNT(?member) < 2 || COUNT(?member) > 5)
    """
] .
```

### Conditional Logic

```turtle
sh:sparql [
    sh:message "Managers must have direct reports" ;
    sh:select """
        SELECT $this
        WHERE {
            $this ex:role "manager" .
            FILTER NOT EXISTS {
                ?report ex:reportsTo $this .
            }
        }
    """
] .
```

### Value Comparison Across Entities

```turtle
sh:sparql [
    sh:message "Salary exceeds department maximum" ;
    sh:select """
        SELECT $this ?salary ?maxSalary
        WHERE {
            $this ex:salary ?salary ;
                  ex:department ?dept .
            ?dept ex:maxSalary ?maxSalary .
            FILTER (?salary > ?maxSalary)
        }
    """
] .
```

---

## Message Templates

Use `{?variable}` to include values in messages:

```turtle
sh:sparql [
    sh:message "Duplicate email found: {?email} (also on {?other})" ;
    sh:select """
        SELECT $this ?email ?other
        WHERE {
            $this ex:email ?email .
            ?other ex:email ?email .
            FILTER ($this != ?other)
        }
    """
] .
```

---

## Performance Considerations

### 1. Index-Friendly Patterns

```turtle
# Good: Uses indexed pattern first
sh:select """
    SELECT $this
    WHERE {
        $this a ex:Person .  # Indexed
        FILTER NOT EXISTS { $this ex:email ?e }
    }
"""

# Less efficient: Filter-heavy
sh:select """
    SELECT $this
    WHERE {
        $this ?p ?o .
        FILTER (?p = ex:name && STRLEN(?o) > 100)
    }
"""
```

### 2. Avoid Cartesian Products

```turtle
# Dangerous: Cross-join
sh:select """
    SELECT $this
    WHERE {
        $this ex:value ?v1 .
        ?other ex:value ?v2 .  # Joins EVERYTHING
        FILTER (?v1 > ?v2)
    }
"""

# Better: Bound join
sh:select """
    SELECT $this ?v1
    WHERE {
        $this ex:value ?v1 .
        FILTER EXISTS {
            ?other ex:value ?v2 .
            FILTER (?other != $this && ?v1 > ?v2)
        }
    }
"""
```

### 3. Use LIMIT for Existence Checks

```turtle
# Efficient: Stop at first violation
sh:select """
    SELECT $this
    WHERE {
        $this ex:status "draft" .
        $this ex:publishDate ?date .
    }
    LIMIT 1
"""
```

---

## Complete Example

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ex:prefixes
    sh:declare [ sh:prefix "ex" ; sh:namespace "http://example.org/"^^xsd:anyURI ] ;
    sh:declare [ sh:prefix "xsd" ; sh:namespace "http://www.w3.org/2001/XMLSchema#"^^xsd:anyURI ] .

ex:EmployeeShape a sh:NodeShape ;
    sh:targetClass ex:Employee ;

    # Standard constraints
    sh:property [
        sh:path ex:employeeId ;
        sh:minCount 1 ;
        sh:maxCount 1
    ] ;

    # Unique employee ID
    sh:sparql [
        a sh:SPARQLConstraint ;
        sh:message "Employee ID {?id} is not unique" ;
        sh:prefixes ex:prefixes ;
        sh:select """
            SELECT $this ?id
            WHERE {
                $this ex:employeeId ?id .
                ?other ex:employeeId ?id .
                FILTER ($this != ?other)
            }
        """
    ] ;

    # Manager must be in same department
    sh:sparql [
        a sh:SPARQLConstraint ;
        sh:message "Manager must be in the same department" ;
        sh:prefixes ex:prefixes ;
        sh:select """
            SELECT $this ?manager ?dept ?mgrDept
            WHERE {
                $this ex:manager ?manager ;
                      ex:department ?dept .
                ?manager ex:department ?mgrDept .
                FILTER (?dept != ?mgrDept)
            }
        """
    ] ;

    # Start date before end date
    sh:sparql [
        a sh:SPARQLConstraint ;
        sh:message "Employment end date must be after start date" ;
        sh:prefixes ex:prefixes ;
        sh:select """
            SELECT $this ?start ?end
            WHERE {
                $this ex:startDate ?start ;
                      ex:endDate ?end .
                FILTER (?end <= ?start)
            }
        """
    ] .
```
