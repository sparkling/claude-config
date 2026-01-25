# SPARQL for AI/LLM Integration

> "Most LLMs (I especially like Anthropic's Claude for this) can emulate a triple store fairly well." — Kurt Cagle

This guide covers patterns for integrating SPARQL with Large Language Models and AI systems, addressing the fundamental challenge of bridging natural language with structured queries.

---

## The Core Challenge

**Problem**: LLMs can generate SPARQL, but doing so effectively requires:
1. Deep knowledge of the target ontology
2. Understanding of available predicates and their semantics
3. Awareness of data quality and coverage
4. Security considerations around direct database access

**Solution**: Architectural patterns that decouple LLMs from raw SPARQL generation.

---

## Architecture Patterns

### Pattern 1: API-Mediated Queries

```
User → LLM → API Endpoint Selection → Parameterized SPARQL → Results → LLM → Response
```

```javascript
// Express.js endpoint example
app.get('/api/search/persons', async (req, res) => {
  const { name, minAge, limit = 20 } = req.query;

  const sparql = `
    PREFIX ex: <http://example.org/>

    SELECT ?person ?name ?age
    WHERE {
      ?person a ex:Person ;
              ex:name ?name .
      OPTIONAL { ?person ex:age ?age }
      ${name ? `FILTER (CONTAINS(LCASE(?name), LCASE("${escapeSparql(name)}")))` : ''}
      ${minAge ? `FILTER (?age >= ${parseInt(minAge)})` : ''}
    }
    ORDER BY ?name
    LIMIT ${Math.min(parseInt(limit), 100)}
  `;

  const results = await triplestore.query(sparql);
  res.json({
    query: req.query,
    results: results.bindings,
    sparql: sparql  // Optional: include for debugging
  });
});
```

### Pattern 2: SHACL-Guided Parameter Binding

LLM interprets user intent and binds to SHACL-defined parameters:

```turtle
# SHACL schema exposed to LLM
ex:BookSearchParams a sh:NodeShape ;
    sh:name "Book Search" ;
    sh:description "Search for books by various criteria" ;
    sh:property [
        sh:path ex:titleSearch ;
        sh:name "Title" ;
        sh:description "Search text to match against book titles" ;
        sh:datatype xsd:string
    ] ;
    sh:property [
        sh:path ex:authorName ;
        sh:name "Author Name" ;
        sh:description "Name of the author (partial match supported)" ;
        sh:datatype xsd:string
    ] ;
    sh:property [
        sh:path ex:publishedAfter ;
        sh:name "Published After" ;
        sh:description "Filter to books published after this year" ;
        sh:datatype xsd:gYear
    ] .
```

```json
// LLM output: parameter binding
{
  "endpoint": "book-search",
  "parameters": {
    "titleSearch": "knowledge graphs",
    "publishedAfter": "2020"
  }
}
```

### Pattern 3: RAG with Knowledge Graphs

```
Query → Vector Search → Candidate Entities → SPARQL Enrichment → Context → LLM → Response
```

```sparql
# Step 1: Get candidate entities from vector search result IRIs
VALUES ?entity { ex:Entity1 ex:Entity2 ex:Entity3 }

# Step 2: Enrich with graph context
SELECT ?entity ?label ?type ?description ?related ?relatedLabel
WHERE {
  ?entity rdfs:label ?label ;
          a ?type .
  OPTIONAL { ?entity rdfs:comment ?description }
  OPTIONAL {
    ?entity ex:relatedTo ?related .
    ?related rdfs:label ?relatedLabel
  }
}
```

---

## Context-Free SPARQL Patterns

Queries that work across different datasets without modification:

### Universal Label Resolution

```sparql
# Works with any labeling convention
SELECT ?resource ?label
WHERE {
  VALUES ?labelProp {
    rdfs:label
    skos:prefLabel
    dcterms:title
    schema:name
    foaf:name
  }
  ?resource ?labelProp ?label .
  FILTER (lang(?label) = "" || lang(?label) = "en")
}
```

### Schema Discovery

```sparql
# Discover available classes
SELECT ?class (COUNT(?instance) AS ?count) ?label
WHERE {
  ?instance a ?class .
  OPTIONAL {
    ?class rdfs:label|sh:name ?label .
    FILTER (lang(?label) = "" || lang(?label) = "en")
  }
}
GROUP BY ?class ?label
ORDER BY DESC(?count)
LIMIT 50

# Discover properties for a class
SELECT DISTINCT ?property ?label ?range
WHERE {
  ?instance a ex:TargetClass ;
            ?property ?value .
  FILTER (?property != rdf:type)
  OPTIONAL { ?property rdfs:label ?label }
  OPTIONAL { ?property rdfs:range ?range }
}
```

### Entity Lookup with Fallback

```sparql
# Find entity by various identifiers
SELECT ?entity ?label ?type
WHERE {
  VALUES ?searchTerm { "Kurt Cagle" }

  {
    # Exact label match
    ?entity rdfs:label|skos:prefLabel ?searchTerm .
  } UNION {
    # Case-insensitive substring
    ?entity rdfs:label|skos:prefLabel ?label .
    FILTER (CONTAINS(LCASE(STR(?label)), LCASE(?searchTerm)))
  } UNION {
    # By identifier/code
    ?entity dcterms:identifier|ex:code ?searchTerm .
  }

  OPTIONAL { ?entity a ?type }
  OPTIONAL { ?entity rdfs:label ?label }
}
LIMIT 10
```

---

## Text Search Integration

> "Direct regex/compare operations are VERY slow in comparison to triple matching." — Cagle

### Lucene/Full-Text Index Pattern

```sparql
PREFIX text: <http://jena.apache.org/text#>

# Jena text index (Fuseki)
SELECT ?resource ?label ?score
WHERE {
  (?resource ?score) text:query (rdfs:label "knowledge graph*") .
  ?resource rdfs:label ?label .
}
ORDER BY DESC(?score)
LIMIT 20

# GraphDB Lucene
PREFIX luc: <http://www.ontotext.com/owlim/lucene#>

SELECT ?resource ?label
WHERE {
  ?resource luc:label "knowledge graph" ;
            rdfs:label ?label .
}

# Stardog full-text
PREFIX fts: <tag:stardog:api:search:>

SELECT ?resource ?label ?score
WHERE {
  ?resource fts:textMatch ("knowledge graphs" ?score) ;
            rdfs:label ?label .
}
```

### Fallback Without Index

```sparql
# When text index unavailable (slower)
SELECT ?resource ?label
WHERE {
  ?resource rdfs:label ?label .
  FILTER (REGEX(?label, "knowledge.*graph", "i"))
}
LIMIT 50
```

---

## Response Format Design

### Structured Response for LLM Consumption

```sparql
# Return JSON-ready structure
SELECT ?question ?answer ?source ?confidence
WHERE {
  BIND ("What books did Kurt Cagle write?" AS ?question)

  ?book ex:author ex:KurtCagle ;
        rdfs:label ?title .

  BIND (GROUP_CONCAT(?title; separator=", ") AS ?answer)
  BIND (STR(ex:KurtCagle) AS ?source)
  BIND (1.0 AS ?confidence)
}
```

### Provenance-Aware Responses

```sparql
SELECT ?fact ?source ?confidence ?lastUpdated
WHERE {
  GRAPH ?source {
    ?subject ?predicate ?object .
    BIND (CONCAT(STR(?subject), " ", STR(?predicate), " ", STR(?object)) AS ?fact)
  }
  OPTIONAL {
    ?source ex:lastUpdated ?lastUpdated ;
            ex:confidence ?confidence .
  }
}
```

---

## Security Considerations

### Parameter Sanitization

```javascript
function escapeSparql(value) {
  if (typeof value !== 'string') return value;
  // Escape special characters in string literals
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

// Validate IRI parameters
function isValidIRI(iri) {
  const pattern = /^https?:\/\/[^\s<>"{}|\\^`\[\]]+$/;
  return pattern.test(iri);
}
```

### Query Restrictions

```sparql
# Safe: Bounded query with specific graph
SELECT ?s ?p ?o
FROM <http://example.org/safe-graph>
WHERE {
  VALUES ?type { ex:AllowedType1 ex:AllowedType2 }
  ?s a ?type ;
     ?p ?o .
}
LIMIT 100

# Unsafe: Unrestricted access
SELECT * WHERE { ?s ?p ?o }  # Never expose this
```

### Allowed Operations

| Operation | Risk Level | Recommendation |
|-----------|------------|----------------|
| SELECT with LIMIT | Low | Allow with bounds |
| ASK | Low | Allow |
| DESCRIBE | Medium | Allow specific resources |
| CONSTRUCT | Medium | Allow predefined templates |
| INSERT/DELETE | High | Require authentication |
| DROP/CLEAR | Critical | Never expose |

---

## LLM-as-Triplestore Pattern

For learning and prototyping:

```python
# Using Claude to simulate a triplestore
prompt = """
You are simulating an RDF triplestore containing information about
the semantic web community. The data includes:

- Classes: Person, Organization, Publication, Conference
- Properties: name, worksFor, wrote, attendedAt, topic

Given this SPARQL query, return results as a JSON array:

```sparql
SELECT ?person ?name ?org
WHERE {
  ?person a ex:Person ;
          ex:name ?name ;
          ex:worksFor ?org .
  ?org ex:name "Semantical LLC" .
}
```
"""
```

> "Use this approach to gain proficiency with SPARQL and SHACL before investing in infrastructure." — Cagle

---

## Hybrid Neurosymbolic Architecture

```
                    ┌─────────────────┐
                    │   User Query    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Intent Parser  │ ← LLM
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
   ┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐
   │ Vector Search │ │ SPARQL Query  │ │ Rule Engine   │
   │  (Semantic)   │ │  (Symbolic)   │ │  (Logic)      │
   └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                    ┌────────▼────────┐
                    │ Result Fusion   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Response Gen    │ ← LLM
                    └─────────────────┘
```

### Implementation Strategy

1. **Vector search** for fuzzy entity matching
2. **SPARQL** for precise relational queries
3. **Rules/SHACL** for inference and validation
4. **LLM** for natural language I/O

---

## Practical Tips

1. **Cache common queries** — entity lookups, schema discovery
2. **Materialize expensive paths** — transitive closures, aggregations
3. **Version your query templates** — maintain backwards compatibility
4. **Log query performance** — identify optimization opportunities
5. **Provide query explanations** — help users understand results
6. **Design for incremental adoption** — start simple, add complexity
