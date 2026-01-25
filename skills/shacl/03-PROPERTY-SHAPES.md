# Property Shapes

Property shapes define constraints on values reachable via property paths from focus nodes. They are the workhorse of SHACL validation.

---

## Understanding Property Shapes

### What is a Property Shape?

A property shape constrains the values of a specific property (or property path) on focus nodes.

```turtle
ex:NamePropertyShape a sh:PropertyShape ;
    sh:path ex:name ;              # Property to constrain
    sh:minCount 1 ;                # At least one value
    sh:maxCount 1 ;                # At most one value
    sh:datatype xsd:string .       # Must be string
```

### Key Characteristics

1. **Type**: `sh:PropertyShape`
2. **Has `sh:path`**: Must have exactly one `sh:path` value
3. **Constrains values**: Not the focus node itself
4. **Reusable**: Can be referenced from multiple node shapes

---

## Creating Property Shapes

### Standalone Property Shape

```turtle
ex:EmailPropertyShape a sh:PropertyShape ;
    sh:path ex:email ;
    sh:datatype xsd:string ;
    sh:pattern "^[^@]+@[^@]+\\.[^@]+$" ;
    sh:minCount 1 ;
    sh:message "Valid email address required" .
```

### Inline Property Shape

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:email ;
        sh:datatype xsd:string ;
        sh:pattern "^[^@]+@[^@]+\\.[^@]+$"
    ] .
```

### Referenced Property Shape

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property ex:EmailPropertyShape ;
    sh:property ex:NamePropertyShape .
```

---

## Cardinality Constraints

### Minimum Count

```turtle
# At least one name required
sh:property [
    sh:path ex:name ;
    sh:minCount 1
] .

# At least two references required
sh:property [
    sh:path ex:reference ;
    sh:minCount 2
] .
```

### Maximum Count

```turtle
# At most one spouse
sh:property [
    sh:path ex:spouse ;
    sh:maxCount 1
] .

# No more than 5 tags
sh:property [
    sh:path ex:tag ;
    sh:maxCount 5
] .
```

### Exact Count

```turtle
# Exactly one ID
sh:property [
    sh:path ex:id ;
    sh:minCount 1 ;
    sh:maxCount 1
] .
```

### Optional Property

```turtle
# Zero or more (default behavior)
sh:property [
    sh:path ex:nickname ;
    sh:datatype xsd:string  # Constrains IF values exist
] .
```

---

## Value Type Constraints

### Datatype

```turtle
# String
sh:property [
    sh:path ex:name ;
    sh:datatype xsd:string
] .

# Integer
sh:property [
    sh:path ex:age ;
    sh:datatype xsd:integer
] .

# Date
sh:property [
    sh:path ex:birthDate ;
    sh:datatype xsd:date
] .

# Boolean
sh:property [
    sh:path ex:active ;
    sh:datatype xsd:boolean
] .

# Decimal
sh:property [
    sh:path ex:price ;
    sh:datatype xsd:decimal
] .
```

### Class Constraint

```turtle
# Must be instance of class
sh:property [
    sh:path ex:author ;
    sh:class ex:Person
] .

# Multiple allowed classes
sh:property [
    sh:path ex:creator ;
    sh:or (
        [ sh:class ex:Person ]
        [ sh:class ex:Organization ]
    )
] .
```

### Node Kind

```turtle
# Must be IRI
sh:property [
    sh:path ex:reference ;
    sh:nodeKind sh:IRI
] .

# Must be literal
sh:property [
    sh:path ex:label ;
    sh:nodeKind sh:Literal
] .

# Must be blank node
sh:property [
    sh:path ex:details ;
    sh:nodeKind sh:BlankNode
] .
```

---

## Value Range Constraints

### Numeric Ranges

```turtle
# Age between 0 and 150
sh:property [
    sh:path ex:age ;
    sh:datatype xsd:integer ;
    sh:minInclusive 0 ;
    sh:maxInclusive 150
] .

# Positive numbers only
sh:property [
    sh:path ex:price ;
    sh:minExclusive 0
] .

# Percentage (0-100)
sh:property [
    sh:path ex:percentage ;
    sh:minInclusive 0 ;
    sh:maxInclusive 100
] .
```

### Date Ranges

```turtle
# Future dates only
sh:property [
    sh:path ex:scheduledDate ;
    sh:datatype xsd:date ;
    sh:minExclusive "2025-01-01"^^xsd:date
] .
```

---

## String Constraints

### Length

```turtle
# Non-empty string
sh:property [
    sh:path ex:name ;
    sh:minLength 1
] .

# Maximum 100 characters
sh:property [
    sh:path ex:description ;
    sh:maxLength 100
] .

# Fixed length code
sh:property [
    sh:path ex:countryCode ;
    sh:minLength 2 ;
    sh:maxLength 2
] .
```

### Pattern (Regex)

```turtle
# Email pattern
sh:property [
    sh:path ex:email ;
    sh:pattern "^[^@]+@[^@]+\\.[^@]+$"
] .

# Employee ID format
sh:property [
    sh:path ex:employeeId ;
    sh:pattern "^EMP[0-9]{6}$" ;
    sh:message "Employee ID must be EMP followed by 6 digits"
] .

# Case-insensitive matching
sh:property [
    sh:path ex:code ;
    sh:pattern "^[A-Z]{3}$" ;
    sh:flags "i"  # Case insensitive
] .
```

### Language Tags

```turtle
# Only English and German
sh:property [
    sh:path rdfs:label ;
    sh:languageIn ("en" "de")
] .

# One label per language
sh:property [
    sh:path skos:prefLabel ;
    sh:uniqueLang true
] .
```

---

## Value Constraints

### Enumeration

```turtle
# Status must be one of these values
sh:property [
    sh:path ex:status ;
    sh:in ("draft" "review" "published" "archived")
] .

# Color enumeration
sh:property [
    sh:path ex:color ;
    sh:in (ex:Red ex:Green ex:Blue)
] .
```

### Required Value

```turtle
# Must have this specific value
sh:property [
    sh:path ex:type ;
    sh:hasValue ex:Person
] .

# Must include "active" among values
sh:property [
    sh:path ex:status ;
    sh:hasValue "active"  # Other values also allowed
] .
```

---

## Property Pair Constraints

### Equality

```turtle
# Shipping address must equal billing address
sh:property [
    sh:path ex:shippingAddress ;
    sh:equals ex:billingAddress
] .
```

### Disjointness

```turtle
# Start date and end date must be different
sh:property [
    sh:path ex:startDate ;
    sh:disjoint ex:endDate
] .
```

### Less Than

```turtle
# Start date must be before end date
sh:property [
    sh:path ex:startDate ;
    sh:lessThan ex:endDate
] .

# Price must be less than or equal to list price
sh:property [
    sh:path ex:salePrice ;
    sh:lessThanOrEquals ex:listPrice
] .
```

---

## Qualified Cardinality

Count values that conform to a specific shape:

```turtle
# At least 2 emergency contacts who are adults
sh:property [
    sh:path ex:emergencyContact ;
    sh:qualifiedMinCount 2 ;
    sh:qualifiedValueShape [
        sh:property [
            sh:path ex:age ;
            sh:minInclusive 18
        ]
    ]
] .

# Exactly one primary address
sh:property [
    sh:path ex:address ;
    sh:qualifiedMinCount 1 ;
    sh:qualifiedMaxCount 1 ;
    sh:qualifiedValueShape [
        sh:property [
            sh:path ex:isPrimary ;
            sh:hasValue true
        ]
    ]
] .
```

---

## Nested Value Shapes

### Using sh:node

```turtle
# Address values must conform to AddressShape
sh:property [
    sh:path ex:address ;
    sh:node ex:AddressShape
] .

ex:AddressShape a sh:NodeShape ;
    sh:property [
        sh:path ex:street ;
        sh:minCount 1 ;
        sh:datatype xsd:string
    ] ;
    sh:property [
        sh:path ex:city ;
        sh:minCount 1 ;
        sh:datatype xsd:string
    ] .
```

### Inline Node Shape

```turtle
sh:property [
    sh:path ex:address ;
    sh:node [
        sh:property [
            sh:path ex:street ;
            sh:minCount 1
        ] ;
        sh:property [
            sh:path ex:city ;
            sh:minCount 1
        ]
    ]
] .
```

---

## Property Shape Metadata

### Documentation

```turtle
ex:NamePropertyShape a sh:PropertyShape ;
    sh:path ex:name ;
    sh:name "name" ;                    # Programming identifier
    sh:description "Full legal name" ;  # Human description
    sh:order 1 ;                        # Display order
    sh:group ex:BasicInfoGroup ;        # Logical grouping
    sh:defaultValue "Unknown" .         # Suggested default
```

### Severity and Messages

```turtle
sh:property [
    sh:path ex:email ;
    sh:pattern "^[^@]+@[^@]+$" ;
    sh:severity sh:Warning ;            # Not a violation
    sh:message "Email format appears invalid"@en ;
    sh:message "E-Mail-Format scheint ungültig"@de
] .
```

---

## Complete Example

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ex:ProductShape a sh:NodeShape ;
    sh:targetClass ex:Product ;

    # Required SKU
    sh:property [
        sh:path ex:sku ;
        sh:name "sku" ;
        sh:description "Stock Keeping Unit" ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:datatype xsd:string ;
        sh:pattern "^[A-Z]{2}-[0-9]{6}$" ;
        sh:message "SKU must be XX-123456 format" ;
        sh:order 1
    ] ;

    # Required name
    sh:property [
        sh:path ex:name ;
        sh:name "name" ;
        sh:minCount 1 ;
        sh:datatype xsd:string ;
        sh:minLength 1 ;
        sh:maxLength 200 ;
        sh:order 2
    ] ;

    # Price
    sh:property [
        sh:path ex:price ;
        sh:name "price" ;
        sh:minCount 1 ;
        sh:datatype xsd:decimal ;
        sh:minExclusive 0 ;
        sh:order 3
    ] ;

    # Category (enumeration)
    sh:property [
        sh:path ex:category ;
        sh:name "category" ;
        sh:minCount 1 ;
        sh:in (ex:Electronics ex:Clothing ex:Food ex:Books) ;
        sh:order 4
    ] ;

    # Optional description
    sh:property [
        sh:path ex:description ;
        sh:name "description" ;
        sh:datatype xsd:string ;
        sh:maxLength 5000 ;
        sh:order 5
    ] .
```
