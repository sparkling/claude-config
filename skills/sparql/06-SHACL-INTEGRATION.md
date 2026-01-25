# SHACL Integration with SPARQL

> "Learn SPARQL. SHACL can be thought of as a dedicated wrapper around SPARQL queries and filters." — Kurt Cagle

SHACL (Shapes Constraint Language) validates RDF data and integrates deeply with SPARQL for custom constraints and data-driven query generation.

---

## SHACL Fundamentals

### Core Concepts

| Term | Description |
|------|-------------|
| **Shape** | Set of constraints for validating nodes |
| **Node Shape** | Constraints on focus nodes themselves |
| **Property Shape** | Constraints on values reachable via property paths |
| **Target** | Mechanism to identify focus nodes |
| **Constraint Component** | Reusable validation building block |
| **Validation Report** | RDF graph describing violations |

### Basic Structure

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;           # What to validate
    sh:property ex:NamePropertyShape ;   # Constraints
    sh:property ex:EmailPropertyShape .

ex:NamePropertyShape a sh:PropertyShape ;
    sh:path ex:name ;                    # Property to constrain
    sh:minCount 1 ;                      # At least one
    sh:maxCount 1 ;                      # At most one
    sh:datatype xsd:string .             # Must be string

ex:EmailPropertyShape a sh:PropertyShape ;
    sh:path ex:email ;
    sh:pattern "^[^@]+@[^@]+\\.[^@]+$" ; # Regex validation
    sh:severity sh:Warning .              # Non-blocking violation
```

---

## Target Types

### Class-Based Targets

```turtle
# All instances of ex:Person
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person .

# Multiple classes
ex:AgentShape a sh:NodeShape ;
    sh:targetClass ex:Person, ex:Organization .
```

### Node Targets

```turtle
# Specific nodes
ex:SpecificShape a sh:NodeShape ;
    sh:targetNode ex:ImportantResource, ex:CriticalResource .
```

### Property-Based Targets

```turtle
# Subjects having a specific property
ex:AuthoredShape a sh:NodeShape ;
    sh:targetSubjectsOf ex:wrote .

# Objects of a specific property
ex:BookShape a sh:NodeShape ;
    sh:targetObjectsOf ex:wrote .
```

### Implicit Class Targets

```turtle
# Shape that is also a class (implicit targeting)
ex:Person a sh:NodeShape, rdfs:Class ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1
    ] .
```

---

## Constraint Components

### Value Type Constraints

```turtle
ex:TypedPropertyShape a sh:PropertyShape ;
    sh:path ex:data ;
    sh:class ex:DataType ;            # Must be instance of class
    sh:datatype xsd:integer ;         # Must have datatype
    sh:nodeKind sh:IRI ;              # Must be IRI (vs blank/literal)
    sh:nodeKind sh:BlankNode ;        # Must be blank node
    sh:nodeKind sh:Literal ;          # Must be literal
    sh:nodeKind sh:BlankNodeOrIRI ;   # IRI or blank
    sh:nodeKind sh:IRIOrLiteral .     # IRI or literal
```

### Cardinality Constraints

```turtle
ex:CardinalityShape a sh:PropertyShape ;
    sh:path ex:items ;
    sh:minCount 1 ;       # At least 1
    sh:maxCount 10 ;      # At most 10
    sh:qualifiedMinCount 2 ;
    sh:qualifiedMaxCount 5 ;
    sh:qualifiedValueShape ex:QualifyingShape .
```

### Value Range Constraints

```turtle
ex:RangeShape a sh:PropertyShape ;
    sh:path ex:age ;
    sh:minInclusive 0 ;
    sh:maxInclusive 150 ;
    sh:minExclusive 0 ;   # Greater than (not equal)
    sh:maxExclusive 200 . # Less than (not equal)
```

### String Constraints

```turtle
ex:StringShape a sh:PropertyShape ;
    sh:path ex:code ;
    sh:minLength 3 ;
    sh:maxLength 10 ;
    sh:pattern "^[A-Z]{2}[0-9]+$" ;
    sh:flags "i" ;        # Case insensitive
    sh:languageIn ("en" "de" "fr") ;
    sh:uniqueLang true .  # Each language only once
```

### Value Constraints

```turtle
ex:ValueShape a sh:PropertyShape ;
    sh:path ex:status ;
    sh:in ("draft" "published" "archived") ;  # Enumeration
    sh:hasValue "required-value" .            # Must include this value
```

### Logical Constraints

```turtle
# AND - all shapes must validate
ex:AndShape a sh:NodeShape ;
    sh:and (ex:Shape1 ex:Shape2 ex:Shape3) .

# OR - at least one shape must validate
ex:OrShape a sh:NodeShape ;
    sh:or (ex:TypeAShape ex:TypeBShape) .

# NOT - shape must NOT validate
ex:NotShape a sh:NodeShape ;
    sh:not ex:DraftShape .

# XOR - exactly one shape must validate
ex:XoneShape a sh:NodeShape ;
    sh:xone (ex:PersonShape ex:OrgShape) .
```

### Shape-Based Constraints

```turtle
ex:NestedShape a sh:PropertyShape ;
    sh:path ex:address ;
    sh:node ex:AddressShape .  # Value must conform to shape

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

---

## Property Paths in SHACL

SHACL supports SPARQL-style property paths:

```turtle
# Sequence path
ex:GrandparentShape a sh:PropertyShape ;
    sh:path (ex:parent ex:parent) .

# Alternative path
ex:LabelShape a sh:PropertyShape ;
    sh:path [sh:alternativePath (rdfs:label skos:prefLabel)] .

# Inverse path
ex:ChildShape a sh:PropertyShape ;
    sh:path [sh:inversePath ex:parent] .

# Zero or more
ex:AncestorShape a sh:PropertyShape ;
    sh:path [sh:zeroOrMorePath ex:parent] .

# One or more
ex:StrictAncestorShape a sh:PropertyShape ;
    sh:path [sh:oneOrMorePath ex:parent] .

# Zero or one
ex:OptionalMiddleNameShape a sh:PropertyShape ;
    sh:path [sh:zeroOrOnePath ex:middleName] .
```

---

## SHACL-SPARQL Constraints

For validation logic beyond declarative constraints, embed SPARQL:

### SELECT-Based Constraints

```turtle
ex:UniqueEmailConstraint a sh:SPARQLConstraint ;
    sh:message "Email address must be unique across all persons" ;
    sh:prefixes ex:prefixes ;
    sh:select """
        SELECT $this ?email
        WHERE {
            $this ex:email ?email .
            ?other ex:email ?email .
            FILTER ($this != ?other)
        }
    """ .

ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:sparql ex:UniqueEmailConstraint .
```

### ASK-Based Constraints

```turtle
ex:ValidDateRangeConstraint a sh:SPARQLConstraint ;
    sh:message "End date must be after start date" ;
    sh:prefixes ex:prefixes ;
    sh:ask """
        ASK {
            $this ex:startDate ?start ;
                  ex:endDate ?end .
            FILTER (?end <= ?start)
        }
    """ .
```

### Parameterized Constraints

```turtle
# Define reusable constraint component
ex:PatternMatchComponent a sh:ConstraintComponent ;
    sh:parameter [
        sh:path ex:pattern ;
        sh:datatype xsd:string
    ] ;
    sh:validator ex:PatternMatchValidator .

ex:PatternMatchValidator a sh:SPARQLSelectValidator ;
    sh:prefixes ex:prefixes ;
    sh:select """
        SELECT $this ?value
        WHERE {
            $this $PATH ?value .
            FILTER (!REGEX(STR(?value), $pattern))
        }
    """ .

# Use the component
ex:CodeShape a sh:PropertyShape ;
    sh:path ex:code ;
    ex:pattern "^[A-Z]{3}[0-9]{4}$" .
```

---

## SHACL for API Design (Cagle's Pattern)

> "SHACL files describe 'free variables' within SPARQL queries—parameters typically used in VALUES statements or constraints."

### Query Template with SHACL Schema

```turtle
# SHACL shape describing query parameters
ex:PersonQueryParams a sh:NodeShape ;
    sh:property [
        sh:path ex:nameFilter ;
        sh:name "Name Filter" ;
        sh:description "Substring to search in person names" ;
        sh:datatype xsd:string ;
        sh:minCount 0 ;
        sh:maxCount 1
    ] ;
    sh:property [
        sh:path ex:minAge ;
        sh:name "Minimum Age" ;
        sh:datatype xsd:integer ;
        sh:minInclusive 0 ;
        sh:maxInclusive 150
    ] ;
    sh:property [
        sh:path ex:limit ;
        sh:name "Result Limit" ;
        sh:datatype xsd:integer ;
        sh:defaultValue 20 ;
        sh:minInclusive 1 ;
        sh:maxInclusive 1000
    ] .
```

### Associated SPARQL Template

```sparql
# Template query with parameter placeholders
PREFIX ex: <http://example.org/>

SELECT ?person ?name ?age
WHERE {
  ?person a ex:Person ;
          ex:name ?name .
  OPTIONAL { ?person ex:age ?age }

  # Parameter: nameFilter (optional)
  # FILTER (CONTAINS(LCASE(?name), LCASE($nameFilter)))

  # Parameter: minAge (optional)
  # FILTER (?age >= $minAge)
}
ORDER BY ?name
LIMIT $limit
```

### Benefits

1. **LLMs need only understand schema structures**, not full ontologies
2. **Security**: Neither LLM nor users access database directly
3. **Flexibility**: Programmers modify queries without affecting broader systems
4. **Documentation**: SHACL serves as self-documenting API contract

---

## Generating SPARQL from SHACL

### Shape to Query Translation

```turtle
# Given this shape:
ex:AuthorShape a sh:NodeShape ;
    sh:targetClass ex:Author ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1
    ] ;
    sh:property [
        sh:path ex:email ;
        sh:minCount 0
    ] .
```

```sparql
# Generated query:
SELECT ?author ?name ?email
WHERE {
  ?author a ex:Author ;
          ex:name ?name .
  OPTIONAL { ?author ex:email ?email }
}
```

### Shape to CONSTRUCT Translation

```sparql
# Generate normalized output matching shape
CONSTRUCT {
  ?author a ex:Author ;
          ex:name ?name ;
          ex:email ?email .
}
WHERE {
  ?author a ex:Author ;
          ex:name ?name .
  OPTIONAL { ?author ex:email ?email }
}
```

---

## Validation Reports

SHACL validation produces RDF reports:

```turtle
# Example validation report
[] a sh:ValidationReport ;
    sh:conforms false ;
    sh:result [
        a sh:ValidationResult ;
        sh:resultSeverity sh:Violation ;
        sh:focusNode ex:Person1 ;
        sh:resultPath ex:email ;
        sh:value "invalid-email" ;
        sh:resultMessage "Value does not match pattern" ;
        sh:sourceConstraintComponent sh:PatternConstraintComponent ;
        sh:sourceShape ex:EmailPropertyShape
    ] .
```

### Query Validation Results

```sparql
PREFIX sh: <http://www.w3.org/ns/shacl#>

# Find all violations
SELECT ?focus ?path ?value ?message
WHERE {
  ?report a sh:ValidationReport ;
          sh:result ?result .
  ?result sh:focusNode ?focus ;
          sh:resultPath ?path ;
          sh:resultMessage ?message .
  OPTIONAL { ?result sh:value ?value }
}
ORDER BY ?focus ?path
```

---

## SHACL 1.2 Preview

SHACL 1.2 (in development) adds:

- **Computed expressions** for data-driven transformations
- **Enhanced path expressions**
- **Better integration with RDF-star**
- **Rule-based shape activation**

```turtle
# SHACL 1.2 computed property (draft)
ex:FullNameShape a sh:PropertyShape ;
    sh:path ex:fullName ;
    sh:values [
        sh:concat (
            [sh:path ex:firstName]
            " "
            [sh:path ex:lastName]
        )
    ] .
```

---

## Best Practices

1. **Start with declarative constraints** before SPARQL-based
2. **Use severity levels** (`sh:Violation`, `sh:Warning`, `sh:Info`)
3. **Provide meaningful messages** with `sh:message`
4. **Group related constraints** in node shapes
5. **Document with `sh:name` and `sh:description`**
6. **Test shapes incrementally** against sample data
7. **Consider closed shapes** (`sh:closed true`) for strict validation
