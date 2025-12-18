# SPARQL Query Fundamentals

> **GUIDE QUICK REF**: `SELECT ?var` | `WHERE { ?s ?p ?o }` | `OPTIONAL { }` | `FILTER (condition)` | `BIND (expr AS ?var)` | `ORDER BY` | `LIMIT` | `OFFSET` | `DISTINCT`

## The Triple Pattern

RDF data is expressed as subject-predicate-object triples. SPARQL queries match these patterns:

```sparql
# Basic triple pattern
?subject ?predicate ?object .

# With specific predicate
?person foaf:name ?name .

# Chained (same subject)
?person foaf:name ?name ;
        foaf:mbox ?email ;
        foaf:age ?age .

# Multiple subjects
?person1 foaf:knows ?person2 .
?person2 foaf:name ?friendName .
```

---

## SELECT Query Structure

```sparql
# 1. PREFIX declarations
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX ex: <http://example.org/>

# 2. SELECT clause (variables to return)
SELECT ?name ?email

# 3. Dataset clause (optional - specify graphs)
FROM <http://example.org/people>

# 4. WHERE clause (graph pattern)
WHERE {
  ?person a foaf:Person ;
          foaf:name ?name ;
          foaf:mbox ?email .
}

# 5. Solution modifiers
ORDER BY ?name
LIMIT 100
OFFSET 0
```

---

## Variable Binding

Variables start with `?` or `$` (equivalent):

```sparql
SELECT ?name $email  # Both work
WHERE {
  ?person foaf:name ?name ;
          foaf:mbox $email .
}
```

### Wildcard SELECT

```sparql
# Return all bound variables
SELECT *
WHERE { ?s ?p ?o }

# Return distinct combinations
SELECT DISTINCT ?type
WHERE { ?s a ?type }

# Return with duplicates removed by expression
SELECT REDUCED ?name
WHERE { ?person foaf:name ?name }
```

---

## OPTIONAL Patterns

Match data when available without rejecting solutions:

```sparql
# Required: name; Optional: email and phone
SELECT ?name ?email ?phone
WHERE {
  ?person foaf:name ?name .
  OPTIONAL { ?person foaf:mbox ?email }
  OPTIONAL { ?person foaf:phone ?phone }
}
```

**Result**: All persons with names returned; email/phone are NULL if not present.

### Nested OPTIONAL

```sparql
SELECT ?name ?email ?workEmail
WHERE {
  ?person foaf:name ?name .
  OPTIONAL {
    ?person foaf:mbox ?email .
    OPTIONAL { ?email ex:type "work" . BIND(?email AS ?workEmail) }
  }
}
```

---

## FILTER Expressions

### Comparison Operators

```sparql
FILTER (?age > 18)
FILTER (?price >= 10 && ?price <= 100)
FILTER (?status != "inactive")
```

### Logical Operators

```sparql
FILTER (?age > 18 && ?country = "US")
FILTER (?status = "active" || ?status = "pending")
FILTER (!bound(?email))  # email not bound
```

### String Functions

```sparql
# Regex matching
FILTER regex(?name, "^John", "i")  # case-insensitive

# String functions
FILTER (STRLEN(?name) > 3)
FILTER (STRSTARTS(?url, "http://"))
FILTER (STRENDS(?email, "@example.org"))
FILTER (CONTAINS(?description, "urgent"))

# Language filtering
FILTER (lang(?label) = "en")
FILTER (langMatches(lang(?label), "en"))
```

### Numeric Functions

```sparql
FILTER (ABS(?value) < 10)
FILTER (ROUND(?price) = 100)
FILTER (CEIL(?rating) >= 4)
FILTER (FLOOR(?score) > 0)
```

### Date/Time Functions

```sparql
FILTER (?date > "2024-01-01"^^xsd:date)
FILTER (YEAR(?created) = 2024)
FILTER (MONTH(?birthday) = 12)
FILTER (?timestamp > NOW() - "P7D"^^xsd:duration)
```

### Type Checking

```sparql
FILTER (isIRI(?resource))
FILTER (isBlank(?node))
FILTER (isLiteral(?value))
FILTER (isNumeric(?amount))
FILTER (datatype(?value) = xsd:integer)
```

### Existence Tests

```sparql
# Variable is bound
FILTER (bound(?email))

# Pattern exists
FILTER EXISTS { ?person foaf:mbox ?email }

# Pattern doesn't exist
FILTER NOT EXISTS { ?person ex:deleted true }
```

---

## BIND - Variable Assignment

Create new variables from expressions:

```sparql
SELECT ?name ?discountedPrice ?formattedPrice
WHERE {
  ?product ex:name ?name ;
           ex:price ?price .
  BIND (?price * 0.9 AS ?discountedPrice)
  BIND (CONCAT("$", STR(?discountedPrice)) AS ?formattedPrice)
}
```

### Common BIND Patterns

```sparql
# String manipulation
BIND (UCASE(?name) AS ?upperName)
BIND (CONCAT(?firstName, " ", ?lastName) AS ?fullName)
BIND (SUBSTR(?phone, 1, 3) AS ?areaCode)

# Type conversion
BIND (xsd:integer(?stringNum) AS ?number)
BIND (STR(?uri) AS ?uriString)

# Conditional (COALESCE for defaults)
BIND (COALESCE(?nickname, ?name, "Unknown") AS ?displayName)

# IRI construction
BIND (IRI(CONCAT("http://example.org/person/", ?id)) AS ?personUri)
```

---

## VALUES - Inline Data

Provide explicit bindings within query:

```sparql
# Single variable
SELECT ?person ?name
WHERE {
  VALUES ?person { ex:Alice ex:Bob ex:Charlie }
  ?person foaf:name ?name .
}

# Multiple variables
SELECT ?person ?role
WHERE {
  VALUES (?person ?role) {
    (ex:Alice "admin")
    (ex:Bob "user")
    (ex:Charlie "guest")
  }
  ?person ex:hasRole ?role .
}
```

---

## UNION - Alternative Patterns

Match either pattern:

```sparql
SELECT ?title
WHERE {
  { ?book dc:title ?title }
  UNION
  { ?book dcterms:title ?title }
  UNION
  { ?book schema:name ?title }
}
```

### Typed UNION

```sparql
SELECT ?item ?type ?name
WHERE {
  {
    ?item a ex:Book ;
          ex:title ?name .
    BIND ("Book" AS ?type)
  }
  UNION
  {
    ?item a ex:Movie ;
          ex:name ?name .
    BIND ("Movie" AS ?type)
  }
}
```

---

## Solution Modifiers

### ORDER BY

```sparql
# Ascending (default)
ORDER BY ?name

# Descending
ORDER BY DESC(?date)

# Multiple criteria
ORDER BY ?lastName ASC(?firstName)

# By expression
ORDER BY (STRLEN(?name))
```

### LIMIT and OFFSET

```sparql
# Pagination
SELECT ?item
WHERE { ?item a ex:Product }
ORDER BY ?item
LIMIT 20
OFFSET 40  # Skip first 40, return next 20
```

### DISTINCT and REDUCED

```sparql
# Remove duplicate rows
SELECT DISTINCT ?type
WHERE { ?s a ?type }

# Allow implementation to remove some duplicates (performance)
SELECT REDUCED ?name
WHERE { ?person foaf:name ?name }
```

---

## Query Patterns by Use Case

### Find All Instances of a Type

```sparql
SELECT ?instance
WHERE {
  ?instance a ex:Person .
}
```

### Find Properties of a Resource

```sparql
SELECT ?property ?value
WHERE {
  ex:Person123 ?property ?value .
}
```

### Find Resources with Specific Property Value

```sparql
SELECT ?person
WHERE {
  ?person foaf:name "John Smith" .
}
```

### Find Resources Missing a Property

```sparql
SELECT ?person ?name
WHERE {
  ?person a foaf:Person ;
          foaf:name ?name .
  FILTER NOT EXISTS { ?person foaf:mbox ?email }
}
```

### Count by Category

```sparql
SELECT ?type (COUNT(?instance) AS ?count)
WHERE {
  ?instance a ?type .
}
GROUP BY ?type
ORDER BY DESC(?count)
```

### Full-Text Search (Triple Store Dependent)

```sparql
# GraphDB
SELECT ?person ?name
WHERE {
  ?person foaf:name ?name .
  ?name <http://www.ontotext.com/connectors/lucene#query> "John*" .
}

# Stardog
SELECT ?person ?name
WHERE {
  ?person foaf:name ?name .
  (?name ?score) <tag:stardog:api:property:textMatch> "John" .
}
```

---

## Debugging Tips

### Show All Triples About a Subject

```sparql
SELECT ?p ?o
WHERE {
  <http://example.org/person/123> ?p ?o .
}
```

### Show Incoming References

```sparql
SELECT ?s ?p
WHERE {
  ?s ?p <http://example.org/person/123> .
}
```

### Count Total Triples

```sparql
SELECT (COUNT(*) AS ?count)
WHERE { ?s ?p ?o }
```

### List All Predicates Used

```sparql
SELECT DISTINCT ?predicate
WHERE { ?s ?predicate ?o }
ORDER BY ?predicate
```

### List All Types

```sparql
SELECT DISTINCT ?type (COUNT(?instance) AS ?count)
WHERE { ?instance a ?type }
GROUP BY ?type
ORDER BY DESC(?count)
```
