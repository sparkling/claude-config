# SPARQL Best Practices

> **GUIDE QUICK REF**: Optimize patterns | Use property paths | Leverage named graphs | SHACL over OWL | Transform with CONSTRUCT | Test with SELECT | Know your triple store

## Kurt Cagle's Core Principles

Drawing from The Ontologist, The Cagle Report, and Knowledge Graph Conference tutorials:

### 1. Knowledge Graphs as Data Hubs

> "Knowledge graphs should be considered an integral part of an organization's data life cycle—to facilitate integration, establish consistent terminology, store complex data structures, improve search and transformation, and ground artificial intelligence systems."

**Implication**: Design SPARQL queries to serve integration, not just retrieval.

### 2. Named Graphs Are Under-Utilized

> "Named graphs in particular are under-utilized, and represent a level of abstraction that most people are only just beginning to tap into."

**Implication**: Use named graphs for workflow, provenance, versioning, and multi-tenancy.

### 3. SPARQL UPDATE as Workflow Engine

> "Once you start thinking about SPARQL Update in transactional terms, the idea of creating workflows seems a logical next step."

**Implication**: Build state machines with named graphs; chain UPDATE operations.

### 4. SHACL over OWL for Validation

> "OWL inference worked great for those trained in formal logical systems, but OWL was fairly lacklustre with regard to the ability to control how invalid constraints were handled."

**Implication**: Use SHACL for practical validation; reserve OWL for inference needs.

---

## Query Optimization

### Filter Early

```sparql
# SLOW: Filter at end
SELECT ?name
WHERE {
  ?person foaf:name ?name ;
          foaf:knows ?friend .
  ?friend foaf:age ?age .
  FILTER (?age > 30)
}

# FAST: Filter early in pattern
SELECT ?name
WHERE {
  ?friend foaf:age ?age .
  FILTER (?age > 30)
  ?person foaf:knows ?friend ;
          foaf:name ?name .
}
```

### Use LIMIT with ORDER BY

```sparql
# Get top 10 by score
SELECT ?item ?score
WHERE {
  ?item ex:score ?score .
}
ORDER BY DESC(?score)
LIMIT 10
```

### Avoid Cartesian Products

```sparql
# DANGEROUS: Creates cross-product
SELECT ?person ?product
WHERE {
  ?person a foaf:Person .
  ?product a ex:Product .
}

# SAFE: Ensure patterns connect
SELECT ?person ?product
WHERE {
  ?person a foaf:Person ;
          ex:purchased ?product .
  ?product a ex:Product .
}
```

### Use OPTIONAL Carefully

```sparql
# Can explode result count
SELECT ?person ?email ?phone ?address
WHERE {
  ?person a foaf:Person .
  OPTIONAL { ?person foaf:mbox ?email }
  OPTIONAL { ?person ex:phone ?phone }
  OPTIONAL { ?person ex:address ?address }
}

# Better: Aggregate optional values
SELECT ?person
       (SAMPLE(?email) AS ?email)
       (SAMPLE(?phone) AS ?phone)
WHERE {
  ?person a foaf:Person .
  OPTIONAL { ?person foaf:mbox ?email }
  OPTIONAL { ?person ex:phone ?phone }
}
GROUP BY ?person
```

---

## Property Path Patterns

### Replace Multiple Queries

```sparql
# SLOW: Manual traversal
SELECT ?grandparent
WHERE {
  ex:Person1 ex:parent ?parent .
  ?parent ex:parent ?grandparent .
}

# FAST: Property path
SELECT ?grandparent
WHERE {
  ex:Person1 ex:parent/ex:parent ?grandparent .
}
```

### Transitive Closure

```sparql
# All ancestors (any depth)
SELECT ?ancestor
WHERE {
  ex:Person1 ex:parent+ ?ancestor .
}

# With depth limit (manual)
SELECT ?ancestor ?depth
WHERE {
  {
    ex:Person1 ex:parent ?ancestor .
    BIND (1 AS ?depth)
  } UNION {
    ex:Person1 ex:parent/ex:parent ?ancestor .
    BIND (2 AS ?depth)
  } UNION {
    ex:Person1 ex:parent/ex:parent/ex:parent ?ancestor .
    BIND (3 AS ?depth)
  }
}
```

### Alternative Predicates

```sparql
# Match any label predicate
SELECT ?label
WHERE {
  ex:Resource1 (rdfs:label|skos:prefLabel|schema:name) ?label .
}
```

---

## Named Graph Strategies

### Organize by Purpose

```
/graphs/
├── ontology/          # Schema definitions
│   ├── core.ttl
│   └── extensions.ttl
├── data/              # Instance data
│   ├── customers.ttl
│   └── products.ttl
├── staging/           # Incoming data
├── production/        # Active data
└── archive/           # Historical data
```

### Query Patterns

```sparql
# Query data with schema awareness
SELECT ?person ?typeName
WHERE {
  GRAPH <http://example.org/data/customers> {
    ?person a ?type .
  }
  GRAPH <http://example.org/ontology/core> {
    ?type rdfs:label ?typeName .
  }
}
```

### Workflow with Graphs

```sparql
# Publish workflow
DELETE { GRAPH <staging> { ?item ?p ?o } }
INSERT { GRAPH <production> { ?item ?p ?o } }
WHERE {
  GRAPH <staging> {
    ?item ?p ?o ; ex:approved true .
  }
}
```

---

## CONSTRUCT Patterns

### Build API Responses

```sparql
CONSTRUCT {
  ?person a schema:Person ;
          schema:name ?name ;
          schema:email ?email .
}
WHERE {
  ?person a foaf:Person ;
          foaf:name ?name .
  OPTIONAL { ?person foaf:mbox ?mbox . BIND(STR(?mbox) AS ?email) }
}
```

### Create Intermediate Views

```sparql
# Materialize computed view
INSERT {
  GRAPH <http://example.org/views/customer-summary> {
    ?customer ex:orderCount ?count ;
              ex:totalSpent ?total .
  }
}
WHERE {
  SELECT ?customer (COUNT(?order) AS ?count) (SUM(?amount) AS ?total)
  WHERE {
    ?order ex:customer ?customer ;
           ex:amount ?amount .
  }
  GROUP BY ?customer
}
```

---

## Debugging Techniques

### Inspect Query Plan

Most triple stores have EXPLAIN:

```sparql
# GraphDB
EXPLAIN SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10

# Stardog
EXPLAIN SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10
```

### Test WHERE Separately

```sparql
# Before UPDATE, test with SELECT
SELECT ?person ?oldStatus ?newStatus
WHERE {
  ?person ex:status ?oldStatus .
  FILTER (?oldStatus = "pending")
  BIND ("approved" AS ?newStatus)
}

# Then apply UPDATE
DELETE { ?person ex:status ?oldStatus }
INSERT { ?person ex:status ?newStatus }
WHERE {
  ?person ex:status ?oldStatus .
  FILTER (?oldStatus = "pending")
  BIND ("approved" AS ?newStatus)
}
```

### Count Before Modify

```sparql
# How many will be affected?
SELECT (COUNT(*) AS ?affected)
WHERE {
  ?item ex:status "pending" .
}
```

---

## Triple Store Considerations

### GraphDB Specifics

```sparql
# Full-text search
SELECT ?person ?name
WHERE {
  ?name <http://www.ontotext.com/connectors/lucene#query> "john*" .
  ?person foaf:name ?name .
}

# Default graph includes named graphs
# No need for GRAPH clause for cross-graph queries
```

### Stardog Specifics

```sparql
# Path queries with edge properties
SELECT ?person ?score
WHERE {
  ?person ex:knows{1,3} ?friend .
  (?person ?score) <tag:stardog:api:property:textMatch> "data scientist" .
}

# Explicit GRAPH needed for named graphs
```

### Jena/Fuseki Specifics

```sparql
# Text search with Lucene
PREFIX text: <http://jena.apache.org/text#>

SELECT ?person ?name
WHERE {
  ?person text:query (foaf:name "john*") ;
          foaf:name ?name .
}
```

### MarkLogic Specifics

```sparql
# MarkLogic SPARQL extensions for sem:store
# Uses XQuery integration for complex operations
```

---

## Security Practices

### Parameterize Queries

```javascript
// Don't concatenate user input
// BAD:
`SELECT * WHERE { ?s foaf:name "${userInput}" }`

// Use parameterized queries or escape properly
// GOOD: Use library that handles escaping
sparqlClient.query(
  'SELECT * WHERE { ?s foaf:name ?name }',
  { name: userInput }
)
```

### Limit Result Size

```sparql
# Always include LIMIT for user-facing queries
SELECT ?item
WHERE { ?item a ex:Product }
LIMIT 1000
```

### Restrict Graph Access

```sparql
# Query only authorized graphs
SELECT ?data
FROM NAMED <http://example.org/public>
WHERE {
  GRAPH <http://example.org/public> {
    ?s ?p ?data .
  }
}
```

---

## Common Anti-Patterns

### 1. SELECT * in Production

```sparql
# BAD: Unbounded columns
SELECT * WHERE { ?s ?p ?o }

# GOOD: Explicit columns
SELECT ?name ?email WHERE { ?person foaf:name ?name ; foaf:mbox ?email }
```

### 2. Unfiltered Cross-Graph Queries

```sparql
# BAD: Scans all graphs
SELECT ?name WHERE { GRAPH ?g { ?person foaf:name ?name } }

# GOOD: Specify graphs
SELECT ?name WHERE {
  VALUES ?g { <graph1> <graph2> }
  GRAPH ?g { ?person foaf:name ?name }
}
```

### 3. DESCRIBE in Performance-Critical Paths

```sparql
# BAD: Expensive, unpredictable
DESCRIBE ex:Person123

# GOOD: Targeted CONSTRUCT
CONSTRUCT { ex:Person123 ?p ?o } WHERE { ex:Person123 ?p ?o }
```

### 4. Nested OPTIONAL Explosion

```sparql
# BAD: Exponential complexity
SELECT * WHERE {
  ?a ex:rel1 ?b .
  OPTIONAL { ?b ex:rel2 ?c . OPTIONAL { ?c ex:rel3 ?d } }
}

# GOOD: Separate queries or flatten
```

---

## Recommended Learning Path (Cagle)

1. **Master Turtle and TriG**: Core serialization formats
2. **Learn SPARQL Query**: SELECT, CONSTRUCT, property paths
3. **Study Named Graphs**: Organization and workflow patterns
4. **Practice SPARQL UPDATE**: Transactional operations
5. **Explore SHACL**: Validation without inference overhead
6. **Understand JSON-LD**: Bridge to web APIs

### Essential Reading

- *Learning SPARQL* by Bob DuCharme
- *Semantic Web for the Working Ontologist* by Allemang & Hendler
- Kurt Cagle's newsletters: The Ontologist, The Cagle Report
