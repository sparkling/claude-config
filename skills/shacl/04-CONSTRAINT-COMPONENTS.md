# Constraint Components

Complete reference for all SHACL Core constraint components with examples.

---

## Value Type Constraints

### sh:class

Values must be instances of the specified class:

```turtle
sh:property [
    sh:path ex:author ;
    sh:class ex:Person ;
    sh:message "Author must be a Person"
] .
```

Multiple classes (intersection—must be ALL):
```turtle
sh:property [
    sh:path ex:employee ;
    sh:class ex:Person ;
    sh:class ex:Employee  # Must be BOTH Person AND Employee
] .
```

### sh:datatype

Values must have the specified datatype:

```turtle
# Common datatypes
sh:datatype xsd:string
sh:datatype xsd:integer
sh:datatype xsd:decimal
sh:datatype xsd:boolean
sh:datatype xsd:date
sh:datatype xsd:dateTime
sh:datatype xsd:time
sh:datatype xsd:anyURI
sh:datatype xsd:float
sh:datatype xsd:double
sh:datatype xsd:nonNegativeInteger
sh:datatype xsd:positiveInteger
sh:datatype rdf:langString  # Language-tagged strings
```

### sh:nodeKind

Restricts the kind of RDF term:

```turtle
sh:nodeKind sh:IRI           # Must be IRI
sh:nodeKind sh:BlankNode     # Must be blank node
sh:nodeKind sh:Literal       # Must be literal
sh:nodeKind sh:BlankNodeOrIRI
sh:nodeKind sh:BlankNodeOrLiteral
sh:nodeKind sh:IRIOrLiteral
```

---

## Cardinality Constraints

### sh:minCount

Minimum number of values:

```turtle
sh:property [
    sh:path ex:name ;
    sh:minCount 1 ;  # At least one
    sh:message "At least one name required"
] .
```

### sh:maxCount

Maximum number of values:

```turtle
sh:property [
    sh:path ex:spouse ;
    sh:maxCount 1 ;  # At most one
    sh:message "At most one spouse allowed"
] .
```

### Combined (Exact Count)

```turtle
sh:property [
    sh:path ex:ssn ;
    sh:minCount 1 ;
    sh:maxCount 1 ;  # Exactly one
    sh:message "Exactly one SSN required"
] .
```

---

## Value Range Constraints

### sh:minInclusive / sh:maxInclusive

```turtle
# Age 0-150 (inclusive)
sh:property [
    sh:path ex:age ;
    sh:minInclusive 0 ;
    sh:maxInclusive 150
] .

# Date range
sh:property [
    sh:path ex:startDate ;
    sh:minInclusive "2020-01-01"^^xsd:date
] .
```

### sh:minExclusive / sh:maxExclusive

```turtle
# Price > 0 (not including 0)
sh:property [
    sh:path ex:price ;
    sh:minExclusive 0
] .

# Must be before today
sh:property [
    sh:path ex:birthDate ;
    sh:maxExclusive "2025-12-18"^^xsd:date
] .
```

---

## String Constraints

### sh:minLength / sh:maxLength

```turtle
# Non-empty, max 100 chars
sh:property [
    sh:path ex:name ;
    sh:minLength 1 ;
    sh:maxLength 100
] .

# Fixed length
sh:property [
    sh:path ex:countryCode ;
    sh:minLength 2 ;
    sh:maxLength 2
] .
```

### sh:pattern

Regular expression matching (SPARQL REGEX compatible):

```turtle
# Email pattern
sh:property [
    sh:path ex:email ;
    sh:pattern "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
] .

# Phone number
sh:property [
    sh:path ex:phone ;
    sh:pattern "^\\+?[0-9]{10,15}$"
] .

# Uppercase letters only
sh:property [
    sh:path ex:code ;
    sh:pattern "^[A-Z]+$"
] .
```

### sh:flags

Pattern matching flags:

```turtle
sh:property [
    sh:path ex:code ;
    sh:pattern "^[a-z]+$" ;
    sh:flags "i"  # Case insensitive
] .
```

Flags:
- `i` — Case insensitive
- `m` — Multiline mode
- `s` — Dot matches newlines
- `x` — Extended (ignore whitespace)

### sh:languageIn

Allowed language tags:

```turtle
sh:property [
    sh:path rdfs:label ;
    sh:languageIn ("en" "de" "fr" "es")
] .
```

### sh:uniqueLang

One value per language:

```turtle
sh:property [
    sh:path skos:prefLabel ;
    sh:uniqueLang true ;
    sh:message "Only one preferred label per language"
] .
```

---

## Property Pair Constraints

### sh:equals

Value sets must be identical:

```turtle
sh:property [
    sh:path ex:shippingAddress ;
    sh:equals ex:billingAddress
] .
```

### sh:disjoint

Value sets must not overlap:

```turtle
sh:property [
    sh:path ex:startDate ;
    sh:disjoint ex:endDate
] .
```

### sh:lessThan

All values must be less than values of another property:

```turtle
sh:property [
    sh:path ex:startDate ;
    sh:lessThan ex:endDate ;
    sh:message "Start date must be before end date"
] .
```

### sh:lessThanOrEquals

```turtle
sh:property [
    sh:path ex:salePrice ;
    sh:lessThanOrEquals ex:listPrice ;
    sh:message "Sale price cannot exceed list price"
] .
```

---

## Logical Constraints

### sh:not

Value must NOT conform to shape:

```turtle
# Must not be a draft
sh:not [
    sh:property [
        sh:path ex:status ;
        sh:hasValue "draft"
    ]
] .
```

### sh:and

Must conform to ALL shapes:

```turtle
sh:and (
    [ sh:property [ sh:path ex:name ; sh:minCount 1 ] ]
    [ sh:property [ sh:path ex:email ; sh:minCount 1 ] ]
    [ sh:class ex:Person ]
) .
```

### sh:or

Must conform to at least ONE shape:

```turtle
# Contact info: email OR phone required
sh:or (
    [ sh:property [ sh:path ex:email ; sh:minCount 1 ] ]
    [ sh:property [ sh:path ex:phone ; sh:minCount 1 ] ]
) .
```

### sh:xone

Must conform to EXACTLY ONE shape:

```turtle
# Either person or organization, not both
sh:xone (
    [ sh:class ex:Person ]
    [ sh:class ex:Organization ]
) .
```

---

## Value Constraints

### sh:in

Value must be in the list:

```turtle
# String enumeration
sh:property [
    sh:path ex:status ;
    sh:in ("draft" "review" "published" "archived")
] .

# IRI enumeration
sh:property [
    sh:path ex:priority ;
    sh:in (ex:Low ex:Medium ex:High ex:Critical)
] .

# Mixed types
sh:property [
    sh:path ex:value ;
    sh:in (1 2 3 "unknown")
] .
```

### sh:hasValue

Must include the specified value (other values allowed):

```turtle
# Must have at least "admin" role
sh:property [
    sh:path ex:role ;
    sh:hasValue "admin"
] .

# Must be related to specific entity
sh:property [
    sh:path ex:relatedTo ;
    sh:hasValue ex:MainProject
] .
```

---

## Shape-Based Constraints

### sh:node

Values must conform to specified shape:

```turtle
sh:property [
    sh:path ex:address ;
    sh:node ex:AddressShape
] .
```

### sh:property

Property constraint (used in node shapes):

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1
    ] .
```

### sh:qualifiedValueShape

Count values conforming to a shape:

```turtle
# At least 2 adult contacts
sh:property [
    sh:path ex:contact ;
    sh:qualifiedMinCount 2 ;
    sh:qualifiedMaxCount 5 ;
    sh:qualifiedValueShape [
        sh:property [
            sh:path ex:age ;
            sh:minInclusive 18
        ]
    ] ;
    sh:qualifiedValueShapesDisjoint true  # Optional: shapes must be disjoint
] .
```

---

## Other Constraints

### sh:closed / sh:ignoredProperties

Restrict to declared properties:

```turtle
ex:StrictShape a sh:NodeShape ;
    sh:closed true ;
    sh:ignoredProperties ( rdf:type rdfs:label ) ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1
    ] ;
    sh:property [
        sh:path ex:email
    ] .
# Only ex:name and ex:email allowed (plus ignored ones)
```

---

## Severity Levels

### sh:severity

```turtle
sh:severity sh:Violation  # Default - critical error
sh:severity sh:Warning    # Non-critical warning
sh:severity sh:Info       # Informational only
```

Example with severity:
```turtle
sh:property [
    sh:path ex:email ;
    sh:pattern "^[^@]+@[^@]+$" ;
    sh:severity sh:Warning ;
    sh:message "Email format may be invalid"
] .
```

---

## Messages

### sh:message

Human-readable error message:

```turtle
sh:property [
    sh:path ex:age ;
    sh:minInclusive 0 ;
    sh:maxInclusive 150 ;
    sh:message "Age must be between 0 and 150"
] .
```

### Multilingual Messages

```turtle
sh:property [
    sh:path ex:name ;
    sh:minCount 1 ;
    sh:message "Name is required"@en ;
    sh:message "Name ist erforderlich"@de ;
    sh:message "Le nom est requis"@fr
] .
```

---

## Constraint Summary Table

| Constraint | Type | Purpose |
|------------|------|---------|
| `sh:class` | Value | Instance of class |
| `sh:datatype` | Value | Literal datatype |
| `sh:nodeKind` | Value | IRI/Literal/BlankNode |
| `sh:minCount` | Cardinality | Minimum values |
| `sh:maxCount` | Cardinality | Maximum values |
| `sh:minInclusive` | Range | >= value |
| `sh:maxInclusive` | Range | <= value |
| `sh:minExclusive` | Range | > value |
| `sh:maxExclusive` | Range | < value |
| `sh:minLength` | String | Minimum length |
| `sh:maxLength` | String | Maximum length |
| `sh:pattern` | String | Regex match |
| `sh:flags` | String | Regex flags |
| `sh:languageIn` | String | Allowed languages |
| `sh:uniqueLang` | String | One per language |
| `sh:equals` | Pair | Values equal |
| `sh:disjoint` | Pair | Values different |
| `sh:lessThan` | Pair | Values ordered |
| `sh:lessThanOrEquals` | Pair | Values ordered (inclusive) |
| `sh:not` | Logical | Negation |
| `sh:and` | Logical | Conjunction |
| `sh:or` | Logical | Disjunction |
| `sh:xone` | Logical | Exclusive or |
| `sh:in` | Value | Enumeration |
| `sh:hasValue` | Value | Required value |
| `sh:node` | Shape | Conform to shape |
| `sh:property` | Shape | Property constraint |
| `sh:qualifiedValueShape` | Shape | Qualified count |
| `sh:closed` | Other | Restrict properties |
