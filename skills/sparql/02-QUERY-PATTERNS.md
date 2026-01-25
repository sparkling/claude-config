# SPARQL Query Patterns

Comprehensive patterns for the four SPARQL query forms with practical examples.

---

## SELECT Queries

SELECT returns tabular data as variable bindings.

### Basic Pattern Matching

```sparql
PREFIX ex: <http://example.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

# Simple triple pattern
SELECT ?subject ?object
WHERE {
  ?subject ex:knows ?object .
}

# Multiple patterns (implicit join on shared variables)
SELECT ?person ?name ?email
WHERE {
  ?person a ex:Person ;
          rdfs:label ?name ;
          ex:email ?email .
}

# Semicolon notation expands to same subject
# The above is equivalent to:
SELECT ?person ?name ?email
WHERE {
  ?person a ex:Person .
  ?person rdfs:label ?name .
  ?person ex:email ?email .
}
```

### OPTIONAL - Left Outer Join

```sparql
# Return all people, with email if available
SELECT ?person ?name ?email
WHERE {
  ?person a ex:Person ;
          rdfs:label ?name .
  OPTIONAL { ?person ex:email ?email }
}

# Multiple OPTIONAL clauses
SELECT ?person ?name ?email ?phone
WHERE {
  ?person a ex:Person ;
          rdfs:label ?name .
  OPTIONAL { ?person ex:email ?email }
  OPTIONAL { ?person ex:phone ?phone }
}

# Nested OPTIONAL (email only if phone exists)
SELECT ?person ?name ?phone ?email
WHERE {
  ?person a ex:Person ;
          rdfs:label ?name .
  OPTIONAL {
    ?person ex:phone ?phone .
    OPTIONAL { ?person ex:email ?email }
  }
}
```

### UNION - Alternative Patterns

```sparql
# Match either pattern
SELECT ?resource ?label
WHERE {
  { ?resource rdfs:label ?label }
  UNION
  { ?resource skos:prefLabel ?label }
}

# Union with different shapes
SELECT ?thing ?name ?type
WHERE {
  {
    ?thing a ex:Person ;
           ex:name ?name .
    BIND ("person" AS ?type)
  }
  UNION
  {
    ?thing a ex:Organization ;
           ex:title ?name .
    BIND ("org" AS ?type)
  }
}
```

### MINUS - Set Difference

```sparql
# All people who are NOT authors
SELECT ?person ?name
WHERE {
  ?person a ex:Person ;
          rdfs:label ?name .
  MINUS { ?person ex:wrote ?book }
}

# MINUS vs NOT EXISTS - subtle difference
# MINUS compares solution sets; NOT EXISTS tests pattern existence
# They differ when MINUS pattern introduces unbound variables

# Example where they differ:
# MINUS removes solutions where variables match
SELECT ?s WHERE { ?s ex:p ?o } MINUS { ?x ex:q ?y }
# vs
SELECT ?s WHERE { ?s ex:p ?o FILTER NOT EXISTS { ?x ex:q ?y } }
```

### FILTER Expressions

```sparql
# Comparison operators
SELECT ?product ?price
WHERE {
  ?product ex:price ?price .
  FILTER (?price > 10 && ?price < 100)
}

# String matching
SELECT ?person ?name
WHERE {
  ?person rdfs:label ?name .
  FILTER (STRSTARTS(?name, "Dr."))
}

# Language filtering
SELECT ?resource ?label
WHERE {
  ?resource rdfs:label ?label .
  FILTER (lang(?label) = "en")
}

# Regular expressions
SELECT ?person ?email
WHERE {
  ?person ex:email ?email .
  FILTER (REGEX(?email, "@example\\.org$", "i"))
}

# Type checking
SELECT ?value
WHERE {
  ?s ex:data ?value .
  FILTER (isNumeric(?value))
}

# Existence tests
SELECT ?person ?name
WHERE {
  ?person a ex:Person ;
          rdfs:label ?name .
  FILTER EXISTS { ?person ex:verified true }
  FILTER NOT EXISTS { ?person ex:banned true }
}
```

### BIND - Variable Assignment

```sparql
# Compute derived values
SELECT ?product ?price ?priceWithTax
WHERE {
  ?product ex:price ?price .
  BIND (?price * 1.2 AS ?priceWithTax)
}

# Conditional assignment
SELECT ?person ?name ?status
WHERE {
  ?person rdfs:label ?name .
  OPTIONAL { ?person ex:active ?active }
  BIND (IF(BOUND(?active) && ?active, "Active", "Inactive") AS ?status)
}

# String construction
SELECT ?person ?fullName
WHERE {
  ?person ex:firstName ?first ;
          ex:lastName ?last .
  BIND (CONCAT(?first, " ", ?last) AS ?fullName)
}
```

### VALUES - Inline Data

```sparql
# Filter to specific values
SELECT ?person ?name
WHERE {
  VALUES ?person { ex:Alice ex:Bob ex:Carol }
  ?person rdfs:label ?name .
}

# Multiple variables
SELECT ?person ?skill
WHERE {
  VALUES (?person ?skill) {
    (ex:Alice "SPARQL")
    (ex:Bob "Python")
    (ex:Carol "RDF")
  }
  ?person ex:hasSkill ?skillResource .
  ?skillResource rdfs:label ?skill .
}

# UNDEF for optional values
SELECT ?person ?name ?role
WHERE {
  VALUES (?person ?role) {
    (ex:Alice "admin")
    (ex:Bob UNDEF)
  }
  ?person rdfs:label ?name .
}
```

### Solution Modifiers

```sparql
# DISTINCT - remove duplicates
SELECT DISTINCT ?type
WHERE { ?s a ?type }

# REDUCED - implementation may remove duplicates
SELECT REDUCED ?type
WHERE { ?s a ?type }

# ORDER BY
SELECT ?person ?name ?age
WHERE { ?person rdfs:label ?name ; ex:age ?age }
ORDER BY ?name                    # Ascending (default)
ORDER BY ASC(?name)               # Explicit ascending
ORDER BY DESC(?age)               # Descending
ORDER BY DESC(?age) ?name         # Multiple criteria

# LIMIT and OFFSET (pagination)
SELECT ?item ?label
WHERE { ?item rdfs:label ?label }
ORDER BY ?label
LIMIT 10
OFFSET 20

# Expressions in SELECT
SELECT ?person (UCASE(?name) AS ?upperName) (YEAR(?birthdate) AS ?birthYear)
WHERE {
  ?person rdfs:label ?name ;
          ex:birthdate ?birthdate .
}
```

---

## CONSTRUCT Queries

CONSTRUCT returns an RDF graph by substituting variables into a template.

### Basic CONSTRUCT

```sparql
PREFIX ex: <http://example.org/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

# Transform data model
CONSTRUCT {
  ?person foaf:name ?name ;
          foaf:mbox ?email .
}
WHERE {
  ?person ex:fullName ?name ;
          ex:emailAddress ?email .
}

# Create new relationships
CONSTRUCT {
  ?author ex:coauthorWith ?coauthor .
}
WHERE {
  ?book ex:author ?author, ?coauthor .
  FILTER (?author != ?coauthor)
}
```

### CONSTRUCT with Blank Nodes

```sparql
# Blank nodes in template are scoped per solution
CONSTRUCT {
  ?person ex:address [
    ex:street ?street ;
    ex:city ?city
  ] .
}
WHERE {
  ?person ex:streetAddress ?street ;
          ex:cityName ?city .
}
```

### Shorthand CONSTRUCT

```sparql
# When template matches WHERE pattern exactly
CONSTRUCT WHERE {
  ?s ex:type "Person" ;
     rdfs:label ?label .
}
```

### Transforming Ontologies

```sparql
# Map between vocabularies
CONSTRUCT {
  ?resource schema:name ?label ;
            schema:description ?comment .
}
WHERE {
  ?resource rdfs:label ?label .
  OPTIONAL { ?resource rdfs:comment ?comment }
}
```

---

## ASK Queries

ASK returns a boolean indicating whether a pattern matches.

```sparql
# Simple existence check
ASK { ex:Kurt a ex:Person }

# Complex pattern check
ASK {
  ?person a ex:Author ;
          ex:wrote ?book .
  ?book ex:published ?date .
  FILTER (YEAR(?date) = 2024)
}

# Validation query
ASK {
  ?person a ex:Person .
  FILTER NOT EXISTS { ?person rdfs:label ?name }
}
```

---

## DESCRIBE Queries

DESCRIBE returns an RDF graph describing resources (implementation-defined).

```sparql
# Describe specific resource
DESCRIBE ex:KurtCagle

# Describe resources matching pattern
DESCRIBE ?author
WHERE {
  ?author ex:wrote ?book .
  ?book ex:topic ex:KnowledgeGraphs .
}

# Multiple resources
DESCRIBE ex:Person1 ex:Person2
```

Typical DESCRIBE implementation returns:
- All triples where the resource is subject
- All triples where the resource is object
- Labels and types of related resources

---

## Common Query Patterns

### Find All Instances of a Class

```sparql
SELECT ?instance ?label
WHERE {
  ?instance a ex:Person .
  OPTIONAL { ?instance rdfs:label ?label }
}
```

### Find All Properties of a Resource

```sparql
SELECT ?property ?value
WHERE {
  ex:SomeResource ?property ?value .
}
```

### Find Incoming and Outgoing Links

```sparql
SELECT ?direction ?property ?related
WHERE {
  {
    ex:Resource ?property ?related .
    BIND ("outgoing" AS ?direction)
  }
  UNION
  {
    ?related ?property ex:Resource .
    BIND ("incoming" AS ?direction)
  }
}
```

### Explore Schema

```sparql
# All classes with instance counts
SELECT ?class (COUNT(?instance) AS ?count)
WHERE {
  ?instance a ?class .
}
GROUP BY ?class
ORDER BY DESC(?count)

# All properties used
SELECT DISTINCT ?property
WHERE { ?s ?property ?o }
ORDER BY ?property
```

### Pagination Pattern

```sparql
# Get page 3 with 20 items per page
SELECT ?item ?label
WHERE {
  ?item a ex:Product ;
        rdfs:label ?label .
}
ORDER BY ?label
LIMIT 20
OFFSET 40
```

### Conditional Text Search

```sparql
# Search with fallback
SELECT ?resource ?matchedLabel
WHERE {
  ?resource rdfs:label|skos:prefLabel|dcterms:title ?matchedLabel .
  FILTER (CONTAINS(LCASE(?matchedLabel), LCASE("search term")))
}
```

---

## Debugging Techniques

### Incremental Pattern Building

Start simple, add complexity:

```sparql
# Step 1: Verify basic pattern
SELECT * WHERE { ?s a ex:Person } LIMIT 5

# Step 2: Add property
SELECT * WHERE { ?s a ex:Person ; rdfs:label ?name } LIMIT 5

# Step 3: Add optional
SELECT * WHERE {
  ?s a ex:Person ; rdfs:label ?name .
  OPTIONAL { ?s ex:email ?email }
} LIMIT 5

# Step 4: Add filter
SELECT * WHERE {
  ?s a ex:Person ; rdfs:label ?name .
  OPTIONAL { ?s ex:email ?email }
  FILTER (lang(?name) = "en")
} LIMIT 5
```

### Check for Empty Results

```sparql
# If query returns nothing, check each pattern separately
ASK { ?s a ex:Person }          # Does class exist?
ASK { ?s rdfs:label ?o }         # Are there labels?
ASK { ?s ex:email ?o }           # Are there emails?
```

### Count Before Selecting

```sparql
# Check result size first
SELECT (COUNT(*) AS ?count)
WHERE {
  ?s a ex:Person ;
     rdfs:label ?name .
}
```
