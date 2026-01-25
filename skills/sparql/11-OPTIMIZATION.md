# SPARQL Query Optimization

> "When you keep in mind the amount of work that each part of your query asks a SPARQL processor to perform, it helps you create queries that run faster." — Bob DuCharme

---

## Core Principles

### 1. Reduce Search Space Early

Place the most restrictive patterns first in your WHERE clause:

```sparql
# SLOW: Scans all triples, then filters
SELECT ?person ?name
WHERE {
  ?person ?p ?o .
  ?person a ex:Person .
  ?person ex:name ?name .
}

# FAST: Starts with type constraint
SELECT ?person ?name
WHERE {
  ?person a ex:Person ;
          ex:name ?name .
}
```

### 2. Order Triple Patterns Strategically

```sparql
# BETTER: Known predicate first, filters bound variables
SELECT ?author ?book
WHERE {
  ?book a ex:Book .           # Many books
  ?book ex:published 2024 .   # Fewer books from 2024
  ?book ex:author ?author .   # Authors of those books
}

# Principle: Start with patterns that:
# 1. Have the fewest matching triples
# 2. Use bound variables from previous patterns
# 3. Avoid cartesian products
```

### 3. OPTIONAL Placement

```sparql
# SLOW: Optional evaluated for all subjects
SELECT ?person ?name ?email
WHERE {
  OPTIONAL { ?person ex:email ?email }
  ?person a ex:Person ;
          ex:name ?name .
}

# FAST: Optional evaluated only for matching persons
SELECT ?person ?name ?email
WHERE {
  ?person a ex:Person ;
          ex:name ?name .
  OPTIONAL { ?person ex:email ?email }
}
```

---

## FILTER Optimization

### Push Filters Down

```sparql
# SLOW: Filter after large join
SELECT ?person ?friend ?friendName
WHERE {
  ?person foaf:knows ?friend .
  ?friend foaf:name ?friendName .
  FILTER (STRSTARTS(?friendName, "A"))
}

# FAST: Filter early in subquery or inline
SELECT ?person ?friend ?friendName
WHERE {
  ?person foaf:knows ?friend .
  {
    SELECT ?friend ?friendName
    WHERE {
      ?friend foaf:name ?friendName .
      FILTER (STRSTARTS(?friendName, "A"))
    }
  }
}
```

### Prefer Triple Patterns Over FILTER

```sparql
# SLOW: Filter on predicate
SELECT ?s ?o
WHERE {
  ?s ?p ?o .
  FILTER (?p = rdfs:label)
}

# FAST: Direct pattern
SELECT ?s ?o
WHERE {
  ?s rdfs:label ?o .
}
```

### Avoid Expensive Filter Functions

| Function | Cost | Alternative |
|----------|------|-------------|
| `REGEX` | High | Text index, CONTAINS, STRSTARTS |
| `STR()` comparison | Medium | Direct comparison where possible |
| `LANG()` | Low | Use directly |
| `BOUND()` | Low | Use directly |
| Arithmetic | Low | Use directly |

```sparql
# SLOW: Full regex scan
FILTER (REGEX(?label, "graph", "i"))

# FASTER: String functions
FILTER (CONTAINS(LCASE(?label), "graph"))

# FASTEST: Text index (triplestore-specific)
?resource text:query "graph" .
```

---

## Property Path Performance

### Bounded vs Unbounded Paths

```sparql
# EXPENSIVE: Unbounded transitive closure
SELECT ?class ?ancestor
WHERE {
  ?class rdfs:subClassOf* ?ancestor .
}

# LESS EXPENSIVE: Bounded depth
SELECT ?class ?ancestor
WHERE {
  ?class rdfs:subClassOf/rdfs:subClassOf?/rdfs:subClassOf? ?ancestor .
}

# BEST FOR FREQUENT USE: Materialized closure
SELECT ?class ?ancestor
WHERE {
  ?class ex:transitiveSubClassOf ?ancestor .
}
```

### Alternative Paths vs UNION

```sparql
# May be optimized differently by engines
# Test both on your triplestore:

# Alternative path
?s rdfs:label|skos:prefLabel ?label .

# UNION equivalent
{ ?s rdfs:label ?label } UNION { ?s skos:prefLabel ?label }
```

---

## Aggregation Optimization

### Filter Before Grouping

```sparql
# SLOW: Group all, then filter
SELECT ?author (COUNT(?book) AS ?count)
WHERE {
  ?book ex:author ?author .
}
GROUP BY ?author
HAVING (COUNT(?book) > 5)

# FASTER: Pre-filter authors with books
SELECT ?author (COUNT(?book) AS ?count)
WHERE {
  ?author ex:hasPublishedBooks true .  # Pre-computed flag
  ?book ex:author ?author .
}
GROUP BY ?author
HAVING (COUNT(?book) > 5)
```

### Use SAMPLE for Non-Aggregated Variables

```sparql
# ERROR: Non-aggregated variable
SELECT ?author ?name (COUNT(?book) AS ?count)
WHERE {
  ?book ex:author ?author .
  ?author ex:name ?name .
}
GROUP BY ?author

# CORRECT: Sample the name
SELECT ?author (SAMPLE(?name) AS ?authorName) (COUNT(?book) AS ?count)
WHERE {
  ?book ex:author ?author .
  ?author ex:name ?name .
}
GROUP BY ?author
```

---

## Subquery Strategies

### Push Work to Subqueries

```sparql
# Find top 10 authors and their recent books
SELECT ?author ?authorName ?book ?title
WHERE {
  {
    SELECT ?author (COUNT(?b) AS ?bookCount)
    WHERE { ?b ex:author ?author }
    GROUP BY ?author
    ORDER BY DESC(?bookCount)
    LIMIT 10
  }
  ?author ex:name ?authorName .
  ?book ex:author ?author ;
        ex:title ?title ;
        ex:year ?year .
  FILTER (?year >= 2020)
}
```

### Avoid Correlated Subqueries

```sparql
# SLOW: Correlated (nested loop)
SELECT ?person ?avgAge
WHERE {
  ?person a ex:Person .
  {
    SELECT (AVG(?age) AS ?avgAge)
    WHERE { ?p ex:age ?age }
  }
}

# FAST: Compute once
SELECT ?person ?avgAge
WHERE {
  {
    SELECT (AVG(?age) AS ?avgAge)
    WHERE { ?p a ex:Person ; ex:age ?age }
  }
  ?person a ex:Person .
}
```

---

## Named Graph Optimization

### Specify Graphs Explicitly

```sparql
# SLOW: Search all graphs
SELECT ?s ?p ?o
WHERE {
  GRAPH ?g { ?s ?p ?o }
  FILTER (?g != ex:TempGraph)
}

# FAST: Named specific graphs
SELECT ?s ?p ?o
FROM NAMED ex:Graph1
FROM NAMED ex:Graph2
WHERE {
  GRAPH ?g { ?s ?p ?o }
}
```

### Partition Data Appropriately

Consider graph organization:
- By source/provenance
- By time period
- By domain/topic
- By access level

---

## CONSTRUCT Optimization

### Minimize Template Size

```sparql
# SLOW: Large template with optionals
CONSTRUCT {
  ?s ?p ?o .
  ?o rdfs:label ?oLabel .
  ?o rdf:type ?oType .
}
WHERE {
  ?s ?p ?o .
  OPTIONAL { ?o rdfs:label ?oLabel }
  OPTIONAL { ?o rdf:type ?oType }
}

# FASTER: Focused template
CONSTRUCT {
  ?s ex:relevantProp ?o .
}
WHERE {
  ?s ex:relevantProp ?o .
}
```

---

## Indexing Strategies

### Understand Your Triplestore Indexes

Most triplestores maintain indexes on triple patterns:

| Index | Patterns Optimized |
|-------|-------------------|
| SPO | `?s ?p ?o` with bound S |
| POS | `?s ?p ?o` with bound P |
| OSP | `?s ?p ?o` with bound O |
| PSO | `?s ?p ?o` with bound P, S |

### Query Design for Index Use

```sparql
# Uses POS index (predicate + object)
SELECT ?subject
WHERE {
  ?subject ex:status "active" .
}

# Uses SPO index (subject)
SELECT ?predicate ?object
WHERE {
  ex:Resource123 ?predicate ?object .
}
```

---

## Debugging Slow Queries

### Step 1: Isolate the Problem

```sparql
# Break query into parts, test each
SELECT (COUNT(*) AS ?c) WHERE { ?s a ex:Person }       # How many persons?
SELECT (COUNT(*) AS ?c) WHERE { ?s ex:email ?e }       # How many emails?
SELECT (COUNT(*) AS ?c) WHERE {                        # Combined?
  ?s a ex:Person ; ex:email ?e
}
```

### Step 2: Check for Cartesian Products

```sparql
# DANGER: Unconnected patterns create cross product
SELECT ?person ?book
WHERE {
  ?person a ex:Person .   # 1000 persons
  ?book a ex:Book .       # 5000 books
  # No connection! Returns 5,000,000 rows
}

# FIXED: Connected patterns
SELECT ?person ?book
WHERE {
  ?person a ex:Person ;
          ex:owns ?book .
  ?book a ex:Book .
}
```

### Step 3: Use EXPLAIN (Triplestore-Specific)

```sparql
# Jena
PREFIX explain: <http://jena.apache.org/explain#>
explain:query "SELECT ..."

# Stardog
explain SELECT ...

# Check your triplestore documentation
```

### Step 4: Profile with LIMIT

```sparql
# Quick test with limit
SELECT * WHERE { <complex pattern> } LIMIT 10

# Compare execution times
```

---

## Common Anti-Patterns

### 1. SELECT *

```sparql
# BAD: Returns all variables
SELECT * WHERE { ?s ?p ?o }

# GOOD: Project only needed variables
SELECT ?s ?label WHERE { ?s rdfs:label ?label }
```

### 2. Unrestricted DESCRIBE

```sparql
# BAD: May return enormous graphs
DESCRIBE ?s WHERE { ?s a ex:LargeClass }

# GOOD: Bounded describe
DESCRIBE ?s WHERE { ?s a ex:LargeClass } LIMIT 10
```

### 3. Unnecessary DISTINCT

```sparql
# BAD: DISTINCT on already unique patterns
SELECT DISTINCT ?person ?name
WHERE {
  ?person a ex:Person ;
          ex:name ?name .
  # If each person has one name, DISTINCT is redundant
}

# GOOD: Only when needed
SELECT DISTINCT ?topic
WHERE {
  ?book ex:topic ?topic .  # Books may share topics
}
```

### 4. ORDER BY Without LIMIT

```sparql
# BAD: Sorts all results
SELECT ?item ?date
WHERE { ?item ex:date ?date }
ORDER BY DESC(?date)

# GOOD: Sort with limit
SELECT ?item ?date
WHERE { ?item ex:date ?date }
ORDER BY DESC(?date)
LIMIT 100
```

---

## Performance Checklist

Before deploying a query:

- [ ] Most restrictive patterns first?
- [ ] OPTIONAL after required patterns?
- [ ] FILTER using indexed functions?
- [ ] No accidental cartesian products?
- [ ] Property paths bounded?
- [ ] Graphs specified explicitly?
- [ ] Only necessary variables projected?
- [ ] LIMIT for exploratory queries?
- [ ] Tested on representative data volume?
