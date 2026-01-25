---
name: sparql
description: Write, analyze, and optimize SPARQL 1.1 queries for knowledge graphs. Covers RDF, OWL, SHACL, Turtle serialization, and AI/LLM integration patterns. Informed by Kurt Cagle's ontologist perspective.
allowed-tools: Read, Write, Edit, Grep, Glob, WebFetch
---

# SPARQL & Semantic Web Skill

Generate, analyze, and optimize SPARQL queries with an ontologist's perspective. This skill embodies the practical wisdom of knowledge graph practitioners—SPARQL is fundamentally a language for the manipulation of sets of assertions called triples, and nearly all operations are set operations.

---

## Core Philosophy (Cagle's Principles)

> "SPARQL and SHACL are the twin pillars of modern knowledge graph work. OWL's complexity fades; shapes and queries remain."

**Key Insights:**

1. **SPARQL differentiates databases** by stitching together assertions based on shared identifiers—this is almost its entire role
2. **Thirty-Table Threshold**: Knowledge graphs outperform relational databases once you exceed ~30 tables due to better handling of interconnected data
3. **Data gathering is expensive**—assess your organization's data access and acquisition capacity before planning major KG initiatives
4. **Learn SPARQL. SHACL can be thought of as a dedicated wrapper around SPARQL queries and filters.**

---

## Guide Router

Load **only ONE guide** per request. Match user intent to the most specific keywords:

| User Intent | Load Guide | Content |
|-------------|------------|---------|
| SPARQL query syntax, SELECT, CONSTRUCT, ASK | 02-QUERY-PATTERNS.md | Query forms, graph patterns, filters |
| Property paths, traversal, recursive queries | 03-PROPERTY-PATHS.md | Path operators, traversal patterns |
| SPARQL Update, INSERT, DELETE, LOAD | 04-UPDATE-OPERATIONS.md | Data manipulation |
| Aggregation, GROUP BY, subqueries | 05-AGGREGATION-SUBQUERIES.md | Advanced query patterns |
| SHACL shapes, validation, constraints | 06-SHACL-INTEGRATION.md | Shapes and validation |
| Turtle, RDF serialization, JSON-LD | 07-SERIALIZATION.md | Data formats |
| OWL ontologies, reasoning, inference | 08-OWL-REASONING.md | Ontology patterns |
| SPARQL for AI/LLM, parameterized queries | 09-AI-INTEGRATION.md | LLM patterns |
| Federated queries, SERVICE, SPARQL-Anything | 10-FEDERATION.md | Distributed queries |
| Performance, optimization, debugging | 11-OPTIMIZATION.md | Query efficiency |
| IRI design, namespaces, naming conventions | 12-IRI-DESIGN.md | Identifier patterns |

**Default behavior**: If intent is unclear, ask the user to clarify or provide query patterns from this entry point.

---

## SPARQL 1.1 Quick Reference

### Query Forms

```sparql
# SELECT - Return variable bindings
SELECT ?subject ?predicate ?object
WHERE { ?subject ?predicate ?object }

# CONSTRUCT - Return an RDF graph
CONSTRUCT { ?s ?p ?o }
WHERE { ?s ?p ?o . FILTER(?p = foaf:knows) }

# ASK - Return boolean
ASK { ?person foaf:name "Kurt Cagle" }

# DESCRIBE - Return graph describing resources
DESCRIBE <http://example.org/person/kurt>
```

### Essential Clauses

```sparql
PREFIX ex: <http://example.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?name ?title
WHERE {
  ?person a ex:Author ;
          rdfs:label ?name .
  OPTIONAL { ?person ex:title ?title }
  FILTER (lang(?name) = "en")
  FILTER NOT EXISTS { ?person ex:deceased ?d }
}
ORDER BY ?name
LIMIT 100
OFFSET 0
```

### Graph Pattern Operators

| Operator | Purpose | Example |
|----------|---------|---------|
| `.` | Conjunction | `?s ?p ?o . ?o ?p2 ?o2` |
| `OPTIONAL` | Left outer join | `OPTIONAL { ?s ex:prop ?val }` |
| `UNION` | Disjunction | `{ ?s ex:a ?o } UNION { ?s ex:b ?o }` |
| `MINUS` | Set difference | `{ ?s ?p ?o } MINUS { ?s a ex:Draft }` |
| `FILTER` | Constraint | `FILTER (?age > 18)` |
| `BIND` | Assignment | `BIND (CONCAT(?first, " ", ?last) AS ?name)` |
| `VALUES` | Inline data | `VALUES ?type { ex:Book ex:Article }` |

### Property Paths (SPARQL 1.1)

```sparql
# Sequence path: A then B
?s ex:knows/ex:knows ?friend_of_friend

# Alternative path: A or B
?s rdfs:label|skos:prefLabel ?label

# Inverse path
?child ^ex:parent ?parent

# Zero or more
?class rdfs:subClassOf* ?superclass

# One or more
?s ex:contains+ ?descendant

# Zero or one
?s ex:nickname? ?nick

# Negated property set
?s !(rdf:type|rdfs:label) ?other
```

### Aggregation

```sparql
SELECT ?author (COUNT(?book) AS ?bookCount) (GROUP_CONCAT(?title; separator=", ") AS ?titles)
WHERE {
  ?book ex:author ?author ;
        ex:title ?title .
}
GROUP BY ?author
HAVING (COUNT(?book) > 5)
ORDER BY DESC(?bookCount)
```

| Function | Description |
|----------|-------------|
| `COUNT(*)` | Cardinality of solutions |
| `SUM(?val)` | Numeric sum |
| `AVG(?val)` | Average value |
| `MIN(?val)` | Minimum value |
| `MAX(?val)` | Maximum value |
| `GROUP_CONCAT(?val; separator=", ")` | Concatenate strings |
| `SAMPLE(?val)` | Arbitrary value |

### Subqueries

```sparql
# Find authors with above-average book counts
SELECT ?author ?bookCount
WHERE {
  {
    SELECT ?author (COUNT(?book) AS ?bookCount)
    WHERE { ?book ex:author ?author }
    GROUP BY ?author
  }
  {
    SELECT (AVG(?cnt) AS ?avgCount)
    WHERE {
      SELECT ?a (COUNT(?b) AS ?cnt)
      WHERE { ?b ex:author ?a }
      GROUP BY ?a
    }
  }
  FILTER (?bookCount > ?avgCount)
}
```

---

## Essential Functions

### String Functions

| Function | Example |
|----------|---------|
| `STR(?x)` | Convert to string |
| `STRLEN(?s)` | String length |
| `SUBSTR(?s, 1, 5)` | Substring |
| `UCASE(?s)` / `LCASE(?s)` | Case conversion |
| `STRSTARTS(?s, "pre")` | Prefix test |
| `STRENDS(?s, "suf")` | Suffix test |
| `CONTAINS(?s, "sub")` | Substring test |
| `CONCAT(?a, ?b)` | Concatenation |
| `REPLACE(?s, "old", "new")` | Replacement |
| `REGEX(?s, "pattern", "i")` | Regex match |
| `ENCODE_FOR_URI(?s)` | URL encoding |

### RDF Term Functions

| Function | Purpose |
|----------|---------|
| `IRI(?s)` / `URI(?s)` | Construct IRI |
| `BNODE()` / `BNODE(?id)` | Blank node |
| `STRDT(?s, xsd:date)` | Typed literal |
| `STRLANG(?s, "en")` | Language-tagged literal |
| `LANG(?lit)` | Get language tag |
| `DATATYPE(?lit)` | Get datatype |
| `isIRI(?x)` | IRI test |
| `isBlank(?x)` | Blank node test |
| `isLiteral(?x)` | Literal test |
| `isNumeric(?x)` | Numeric test |

### Conditional & Existence

```sparql
# IF conditional
BIND (IF(?age >= 18, "adult", "minor") AS ?category)

# COALESCE - first non-error value
BIND (COALESCE(?preferredName, ?name, "Unknown") AS ?displayName)

# EXISTS / NOT EXISTS
FILTER EXISTS { ?s ex:verified true }
FILTER NOT EXISTS { ?s ex:deleted true }

# BOUND - test if variable is bound
FILTER (BOUND(?optionalValue))
```

---

## The Label Problem (Cagle's Solution)

Knowledge graphs use URIs, but users shouldn't need to know them. Multiple label predicates exist across ontologies.

**Problem**: Different ontologies use different label predicates:
- `rdfs:label`
- `skos:prefLabel`
- `dcterms:title`
- `schema:name`
- `foaf:name`

**Solution**: Use property path alternatives or VALUES:

```sparql
# Property path approach
SELECT ?resource ?label
WHERE {
  ?resource rdfs:label|skos:prefLabel|dcterms:title|schema:name ?label .
  FILTER (lang(?label) = "en" || lang(?label) = "")
}

# VALUES approach (more extensible)
SELECT ?resource ?label
WHERE {
  VALUES ?labelProp { rdfs:label skos:prefLabel dcterms:title schema:name }
  ?resource ?labelProp ?label .
}
```

---

## Named Graphs

```sparql
# Query specific named graph
SELECT ?s ?p ?o
FROM <http://example.org/graph1>
WHERE { ?s ?p ?o }

# Query across named graphs
SELECT ?g ?s ?p ?o
FROM NAMED <http://example.org/graph1>
FROM NAMED <http://example.org/graph2>
WHERE {
  GRAPH ?g { ?s ?p ?o }
}

# Default graph + named graphs
SELECT ?s ?label ?graphLabel
WHERE {
  ?s rdfs:label ?label .  # From default graph
  GRAPH ?g {
    ?s ex:status ?status .  # From named graphs
  }
}
```

---

## SPARQL Update (1.1)

```sparql
# INSERT DATA - add specific triples
INSERT DATA {
  ex:person1 a ex:Person ;
             ex:name "Kurt Cagle" .
}

# DELETE DATA - remove specific triples
DELETE DATA {
  ex:person1 ex:status "draft" .
}

# DELETE/INSERT with WHERE
DELETE { ?s ex:status "draft" }
INSERT { ?s ex:status "published" }
WHERE { ?s ex:status "draft" ; ex:reviewed true }

# LOAD external data
LOAD <http://example.org/data.ttl> INTO GRAPH <http://example.org/imported>

# CLEAR graph
CLEAR GRAPH <http://example.org/temp>

# DROP graph
DROP GRAPH <http://example.org/obsolete>
```

---

## Turtle Quick Reference

```turtle
@prefix ex: <http://example.org/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# Subject with multiple predicates (semicolon)
ex:KurtCagle a ex:Person ;
    rdfs:label "Kurt Cagle"@en ;
    ex:role "Ontologist" ;
    ex:founded ex:Semantical ;
    ex:writes ex:TheOntologist, ex:TheCagleReport .

# Blank nodes
ex:Book1 ex:author [
    a ex:Person ;
    ex:name "Anonymous"
] .

# Collections (RDF lists)
ex:Course ex:topics ( ex:SPARQL ex:RDF ex:SHACL ) .

# Typed literals
ex:event ex:date "2025-12-18"^^xsd:date ;
         ex:attendees "150"^^xsd:integer .
```

---

## IRI Design Patterns (Cagle's Recommendations)

**Standard Structure**: `http://{authority}/{path/to/term}[#|/]{localName}`

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Namespaces | TitleCase | `http://example.org/Ontology/` |
| Classes | TitleCase | `ex:Person`, `ex:KnowledgeGraph` |
| Instances | TitleCase | `ex:KurtCagle`, `ex:Book123` |
| Properties | camelCase | `ex:hasAuthor`, `ex:datePublished` |

### Best Practices

1. **Avoid embedding semantics** in identifiers—use annotative properties
2. **Don't include versioning** in IRIs; versioning is metadata
3. **Meaningful local names** aid debugging, but don't parse them for data
4. **Use UUIDs** for auto-generated instances when readability isn't critical
5. **URNs are valid IRIs**: `urn:isbn:0451450523`, `urn:mailto:user@example.org`

---

## SHACL Integration Patterns

SHACL (Shapes Constraint Language) validates RDF data and can generate SPARQL queries.

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .

ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:datatype xsd:string ;
    ] ;
    sh:property [
        sh:path ex:email ;
        sh:pattern "^[^@]+@[^@]+$" ;
        sh:severity sh:Warning ;
    ] .
```

**SHACL-SPARQL** extends validation with custom queries:

```turtle
ex:UniqueEmailConstraint a sh:SPARQLConstraint ;
    sh:message "Email must be unique" ;
    sh:select """
        SELECT $this ?email
        WHERE {
            $this ex:email ?email .
            ?other ex:email ?email .
            FILTER ($this != ?other)
        }
    """ .
```

---

## AI/LLM Integration Architecture (Cagle's Pattern)

**The Problem**: LLMs can generate SPARQL, but require deep ontology knowledge.

**Cagle's Solution**: Expose pre-written SPARQL through an API layer with SHACL describing parameters.

```
User Query → LLM → API Endpoint Selection → Parameterized SPARQL → Results → LLM → Natural Language
```

### Context-Free SPARQL Pattern

```sparql
# Parameterized query with VALUES injection
SELECT ?entity ?label ?description
WHERE {
  VALUES ?searchTerm { $SEARCH_TERM }

  ?entity a ?type ;
          rdfs:label|skos:prefLabel ?label .

  OPTIONAL { ?entity rdfs:comment|dcterms:description ?description }

  # Use text index if available (Lucene/Elasticsearch)
  # ?entity text:query ?searchTerm .

  FILTER (CONTAINS(LCASE(?label), LCASE(?searchTerm)))
}
LIMIT 20
```

### Service Response Format

```json
{
  "question": "Who wrote The Ontologist?",
  "answer": "Kurt Cagle writes The Ontologist newsletter.",
  "source": "http://example.org/graph/ontologist-metadata",
  "sparql": "SELECT ?author WHERE { ex:TheOntologist ex:author ?author }"
}
```

---

## Performance Guidelines (DuCharme's Wisdom)

> "When you keep in mind the amount of work that each part of your query asks a SPARQL processor to perform, it helps you create queries that run faster."

### Query Optimization

1. **Place restrictive patterns first** in WHERE clause
2. **Move OPTIONAL after restrictive patterns**
3. **Avoid FILTER on large result sets**—use triple patterns instead
4. **Use text indexes** instead of REGEX for string searches
5. **Be cautious with property paths** (`*`, `+`) in large datasets
6. **Use LIMIT early** when exploring data
7. **Prefer BIND over complex SELECT expressions**

### Anti-Patterns

```sparql
# BAD: Filter on unrestricted pattern
SELECT ?s ?label
WHERE {
  ?s ?p ?o .
  FILTER (?p = rdfs:label)
  BIND (STR(?o) AS ?label)
}

# GOOD: Direct triple pattern
SELECT ?s ?label
WHERE {
  ?s rdfs:label ?label .
}
```

---

## RDF-star / SPARQL-star (Emerging Standard)

RDF-star enables statements about statements using quoted triples:

```turtle
# RDF-star syntax
<< ex:Kurt ex:wrote ex:TheOntologist >> ex:since "2020" .

# Annotation shorthand
ex:Kurt ex:wrote ex:TheOntologist {| ex:since "2020" |} .
```

```sparql
# SPARQL-star query
SELECT ?author ?work ?since
WHERE {
  << ?author ex:wrote ?work >> ex:since ?since .
}

# Constructing quoted triples
SELECT (TRIPLE(?s, ?p, ?o) AS ?statement)
WHERE { ?s ?p ?o }
```

---

## Common Patterns

### Find All Classes

```sparql
SELECT DISTINCT ?class ?label
WHERE {
  { ?class a rdfs:Class } UNION { ?class a owl:Class }
  OPTIONAL { ?class rdfs:label ?label }
}
```

### Instance Count by Class

```sparql
SELECT ?class (COUNT(?instance) AS ?count)
WHERE {
  ?instance a ?class .
}
GROUP BY ?class
ORDER BY DESC(?count)
```

### Property Discovery

```sparql
SELECT DISTINCT ?property ?domain ?range
WHERE {
  ?property a rdf:Property .
  OPTIONAL { ?property rdfs:domain ?domain }
  OPTIONAL { ?property rdfs:range ?range }
}
```

### Hierarchical Traversal

```sparql
# All superclasses of a class
SELECT ?superclass
WHERE {
  ex:SpecificClass rdfs:subClassOf+ ?superclass .
}

# All subclasses (inverse)
SELECT ?subclass
WHERE {
  ?subclass rdfs:subClassOf+ ex:GeneralClass .
}
```

### Data Quality Check

```sparql
# Find resources missing required properties
SELECT ?resource
WHERE {
  ?resource a ex:Person .
  FILTER NOT EXISTS { ?resource ex:name ?name }
}
```

---

## Output Considerations

When generating SPARQL:

1. **Always include PREFIX declarations** for readability
2. **Use meaningful variable names** (`?author` not `?x`)
3. **Add comments** for complex patterns
4. **Format with consistent indentation**
5. **Consider result size**—include LIMIT for exploration queries
6. **Handle language tags** explicitly when dealing with labels

---

## Resources

### W3C Specifications
- [SPARQL 1.1 Query Language](https://www.w3.org/TR/sparql11-query/)
- [SPARQL 1.1 Update](https://www.w3.org/TR/sparql11-update/)
- [RDF 1.1 Turtle](https://www.w3.org/TR/turtle/)
- [OWL 2 Overview](https://www.w3.org/TR/owl2-overview/)
- [SHACL](https://www.w3.org/TR/shacl/)

### Books
- *Learning SPARQL* by Bob DuCharme (O'Reilly)
- *Semantic Web for the Working Ontologist* by Allemang, Hendler, Gandon

### Kurt Cagle's Work
- [The Ontologist](https://ontologist.substack.com/) - Substack newsletter
- [The Cagle Report](https://thecaglereport.com/) - Enterprise data and AI
