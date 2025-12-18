---
name: sparql
description: SPARQL 1.1 query and update language for RDF knowledge graphs. Write queries, construct transformations, update operations, and work with OWL ontologies, SHACL validation, and linked data. Incorporates Kurt Cagle's ontological philosophy.
allowed-tools: Read, Write, Edit, Grep, Glob, WebFetch
---

# SPARQL Skill

> **SKILL QUICK REF**: Query: `SELECT`, `CONSTRUCT`, `ASK`, `DESCRIBE` | Patterns: `OPTIONAL`, `FILTER`, `UNION`, `BIND` | Aggregates: `GROUP BY`, `COUNT`, `SUM`, `AVG` | Paths: `/`, `*`, `+`, `?`, `|` | Update: `INSERT`, `DELETE`, `LOAD`, `CLEAR` | Named Graphs: `GRAPH ?g { }` | Federation: `SERVICE <endpoint> { }`

## Philosophy: The Ontologist's Approach

Drawing from Kurt Cagle's work at The Ontologist, this skill treats SPARQL not merely as a query language but as a **communication contract** between systems and stakeholders. As Cagle writes, ontologists are "legislators concerning the language that binds people together."

**Core Principles:**
1. **Graphs over Tables**: RDF has no tables—the object of one triple becomes the subject of another
2. **Named Graphs as Abstraction**: Under-utilized but powerful for workflows, provenance, and organization
3. **SPARQL UPDATE as Workflow Engine**: Transactional operations enable complex data pipelines
4. **SHACL over OWL for Validation**: Validation without triple expansion; SPARQL queries under the hood
5. **Transformation Flexibility**: RDF is abstract—transform to JSON, XML, Markdown, diagrams

---

## When to Use This Skill

- Writing SPARQL queries against RDF triple stores
- Constructing RDF transformations with CONSTRUCT
- Building knowledge graph data pipelines
- Validating data with SPARQL-based SHACL
- Federating queries across SPARQL endpoints
- Working with OWL ontologies and RDFS schemas
- Integrating linked data sources

---

## Guide Router

Load **only ONE guide** per request based on user intent:

| User Intent | Load Guide |
|-------------|------------|
| Basic queries, SELECT, WHERE, FILTER | 01-QUERY-FUNDAMENTALS.md |
| CONSTRUCT, transformations, JSON-LD output | 02-CONSTRUCT-TRANSFORMS.md |
| Named graphs, quads, GRAPH keyword | 03-NAMED-GRAPHS.md |
| INSERT, DELETE, UPDATE operations | 04-UPDATE-OPERATIONS.md |
| Property paths, traversal, transitive | 05-PROPERTY-PATHS.md |
| Aggregation, GROUP BY, HAVING | 06-AGGREGATION.md |
| Federation, SERVICE, remote endpoints | 07-FEDERATION.md |
| OWL, RDFS, ontology patterns | 08-OWL-ONTOLOGIES.md |
| SHACL validation queries | 09-SHACL-VALIDATION.md |
| Best practices, optimization, patterns | 10-BEST-PRACTICES.md |

---

## SPARQL 1.1 Query Forms

### SELECT - Return Variable Bindings

```sparql
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

SELECT ?name ?email
WHERE {
  ?person a foaf:Person ;
          foaf:name ?name ;
          foaf:mbox ?email .
}
ORDER BY ?name
LIMIT 100
```

### CONSTRUCT - Build RDF Graphs

```sparql
PREFIX schema: <http://schema.org/>
PREFIX ex: <http://example.org/>

CONSTRUCT {
  ?person schema:name ?name ;
          schema:email ?email .
}
WHERE {
  ?person ex:fullName ?name ;
          ex:emailAddress ?email .
}
```

### ASK - Boolean Existence Check

```sparql
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

ASK {
  ?person foaf:name "Kurt Cagle" .
}
```

### DESCRIBE - Resource Description

```sparql
PREFIX ex: <http://example.org/>

DESCRIBE ex:Person123
```

**Note (Cagle)**: DESCRIBE is expensive—prefer pre-populated graph envelopes for performance.

---

## Essential Patterns

### OPTIONAL - Non-blocking Matches

```sparql
SELECT ?name ?email
WHERE {
  ?person foaf:name ?name .
  OPTIONAL { ?person foaf:mbox ?email }
}
```

### FILTER - Constraint Conditions

```sparql
SELECT ?product ?price
WHERE {
  ?product ex:price ?price .
  FILTER (?price < 50 && ?price > 10)
  FILTER (lang(?label) = "en")
  FILTER regex(?name, "^A", "i")
}
```

### BIND - Variable Assignment

```sparql
SELECT ?name ?discountedPrice
WHERE {
  ?product ex:name ?name ;
           ex:price ?price .
  BIND (?price * 0.9 AS ?discountedPrice)
}
```

### UNION - Alternative Patterns

```sparql
SELECT ?title
WHERE {
  { ?book dc10:title ?title }
  UNION
  { ?book dc11:title ?title }
}
```

### NOT EXISTS / MINUS - Negation

```sparql
# NOT EXISTS: Filter solutions where pattern doesn't match
SELECT ?person
WHERE {
  ?person a foaf:Person .
  FILTER NOT EXISTS { ?person foaf:mbox ?email }
}

# MINUS: Remove matching solutions
SELECT ?person
WHERE {
  ?person a foaf:Person .
  MINUS { ?person foaf:mbox ?email }
}
```

---

## Property Paths (Cagle's "rdf:* trick")

Property paths enable graph traversal without multiple queries:

| Operator | Meaning | Example |
|----------|---------|---------|
| `/` | Sequence | `foaf:knows/foaf:name` |
| `\|` | Alternative | `dc:title\|rdfs:label` |
| `*` | Zero or more | `rdfs:subClassOf*` |
| `+` | One or more | `skos:broader+` |
| `?` | Zero or one | `foaf:mbox?` |
| `^` | Inverse | `^foaf:knows` (who knows me) |
| `!` | Negation | `!(rdf:type\|rdfs:label)` |

```sparql
# Transitive closure - all ancestors
SELECT ?ancestor
WHERE {
  ex:Person123 rdfs:subClassOf+ ?ancestor .
}

# Two-hop social network
SELECT ?friend ?friendOfFriend
WHERE {
  ex:Alice foaf:knows ?friend .
  ?friend foaf:knows ?friendOfFriend .
  FILTER (?friendOfFriend != ex:Alice)
}
```

---

## Aggregation

```sparql
SELECT ?department (COUNT(?employee) AS ?count) (AVG(?salary) AS ?avgSalary)
WHERE {
  ?employee ex:department ?department ;
            ex:salary ?salary .
}
GROUP BY ?department
HAVING (COUNT(?employee) > 5)
ORDER BY DESC(?avgSalary)
```

**Aggregate Functions**: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `GROUP_CONCAT`, `SAMPLE`

---

## Named Graphs (Quads)

Named graphs add a fourth element—the graph identifier:

```sparql
# Query specific graph
SELECT ?name
FROM NAMED <http://example.org/people>
WHERE {
  GRAPH <http://example.org/people> {
    ?person foaf:name ?name .
  }
}

# Query across all named graphs
SELECT ?g ?name
WHERE {
  GRAPH ?g {
    ?person foaf:name ?name .
  }
}
```

**Cagle's Insight**: Named graphs enable workflow operations with minimal data movement. The graph identifier acts as a state marker, audit trail, or provenance record.

---

## SPARQL UPDATE (1.1)

### INSERT DATA - Add Triples

```sparql
PREFIX ex: <http://example.org/>

INSERT DATA {
  ex:Person123 a foaf:Person ;
               foaf:name "Jane Doe" ;
               foaf:mbox <mailto:jane@example.org> .
}
```

### DELETE/INSERT - Conditional Update

```sparql
DELETE { ?person ex:status "pending" }
INSERT { ?person ex:status "approved" }
WHERE {
  ?person ex:status "pending" ;
          ex:score ?score .
  FILTER (?score > 80)
}
```

### Graph Management

```sparql
# Load external RDF
LOAD <http://example.org/data.ttl> INTO GRAPH <http://example.org/imported>

# Copy graph
COPY GRAPH <http://example.org/source> TO GRAPH <http://example.org/target>

# Move graph (rename)
MOVE GRAPH <http://example.org/staging> TO GRAPH <http://example.org/production>

# Clear graph
CLEAR GRAPH <http://example.org/temp>

# Drop graph
DROP GRAPH <http://example.org/obsolete>
```

### Workflow Pattern (Cagle)

```sparql
# Transaction: Move approved items from staging to production
DELETE { GRAPH <staging> { ?item ?p ?o } }
INSERT { GRAPH <production> { ?item ?p ?o } }
WHERE {
  GRAPH <staging> {
    ?item ?p ?o ;
          ex:status "approved" .
  }
};

# Update status in audit graph
INSERT {
  GRAPH <audit> {
    ?item ex:movedTo <production> ;
          ex:movedAt ?now .
  }
}
WHERE {
  GRAPH <production> { ?item a ex:Item }
  BIND (NOW() AS ?now)
}
```

---

## Subqueries

```sparql
SELECT ?department ?topEmployee
WHERE {
  {
    SELECT ?department (MAX(?salary) AS ?maxSalary)
    WHERE {
      ?emp ex:department ?department ;
           ex:salary ?salary .
    }
    GROUP BY ?department
  }
  ?topEmployee ex:department ?department ;
               ex:salary ?maxSalary .
}
```

---

## Federation (SERVICE)

Query remote SPARQL endpoints:

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>

SELECT ?localPerson ?wikidataLabel
WHERE {
  ?localPerson ex:wikidataId ?wdId .

  SERVICE <https://query.wikidata.org/sparql> {
    ?wdId rdfs:label ?wikidataLabel .
    FILTER (lang(?wikidataLabel) = "en")
  }
}
```

**Cagle's Note**: Federation was the promise of Linked Data, but practical challenges remain. Use sparingly for enrichment, not as primary data source.

---

## Common Namespace Prefixes

```sparql
PREFIX rdf:   <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs:  <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl:   <http://www.w3.org/2002/07/owl#>
PREFIX xsd:   <http://www.w3.org/2001/XMLSchema#>
PREFIX foaf:  <http://xmlns.com/foaf/0.1/>
PREFIX dc:    <http://purl.org/dc/elements/1.1/>
PREFIX dct:   <http://purl.org/dc/terms/>
PREFIX schema: <http://schema.org/>
PREFIX skos:  <http://www.w3.org/2004/02/skos/core#>
PREFIX sh:    <http://www.w3.org/ns/shacl#>
PREFIX prov:  <http://www.w3.org/ns/prov#>
```

---

## RDF Serialization Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| Turtle | `.ttl` | Human-readable, compact |
| TriG | `.trig` | Turtle + named graphs |
| JSON-LD | `.jsonld` | Web APIs, JavaScript |
| RDF/XML | `.rdf` | Legacy, XML toolchains |
| N-Triples | `.nt` | Streaming, line-based |
| N-Quads | `.nq` | N-Triples + named graphs |

**Cagle's Preference**: Turtle for authoring, JSON-LD for APIs, TriG for named graph workflows.

---

## Output Patterns

### Query Result as Table

When presenting SPARQL results, format as markdown tables:

```markdown
| ?person | ?name | ?email |
|---------|-------|--------|
| ex:p1 | "Alice" | alice@ex.org |
| ex:p2 | "Bob" | bob@ex.org |
```

### Query with Explanation

Always explain queries with comments:

```sparql
# Find all employees with their managers
# using transitive closure on reports-to relationship
PREFIX ex: <http://example.org/>

SELECT ?employee ?manager
WHERE {
  # Direct or indirect reporting relationship
  ?employee ex:reportsTo+ ?manager .

  # Only top-level managers (those who don't report to anyone)
  FILTER NOT EXISTS { ?manager ex:reportsTo ?higherManager }
}
```

---

## SHACL Integration

SHACL validation leverages SPARQL under the hood:

```sparql
# Find violations using SPARQL (what SHACL does internally)
SELECT ?resource ?property ?message
WHERE {
  ?resource a ex:Person .
  FILTER NOT EXISTS { ?resource foaf:name ?name }
  BIND (foaf:name AS ?property)
  BIND ("Person must have a name" AS ?message)
}
```

For SHACL-specific patterns, load 09-SHACL-VALIDATION.md.

---

## Best Practices (Cagle's Recommendations)

1. **Use Named Graphs Strategically**
   - Organize by provenance, state, or domain
   - Enable workflow transitions without data duplication

2. **Prefer CONSTRUCT for Transformations**
   - Build intermediate graphs for complex pipelines
   - Transform to JSON-LD via CONSTRUCT + framing

3. **Leverage Property Paths**
   - Replace multiple queries with transitive patterns
   - Use `rdf:*` for neighborhood retrieval

4. **Optimize with Subqueries**
   - Push filters into subqueries
   - Limit intermediate result sets

5. **Learn Your Triple Store**
   - GraphDB includes named graphs in default
   - Stardog/Jena require explicit FROM clauses
   - MarkLogic has SPARQL extensions

6. **SHACL over OWL for Validation**
   - OWL inference expands triples
   - SHACL validates without expansion
   - JSON can be validated via JSON-LD + SHACL

---

## References

- [SPARQL 1.1 Query Language - W3C](https://www.w3.org/TR/sparql11-query/)
- [SPARQL 1.2 Working Draft](https://www.w3.org/TR/sparql12-query/)
- [Kurt Cagle - The Ontologist](https://ontologist.substack.com/)
- [Kurt Cagle - The Cagle Report](https://thecaglereport.com/)
- [Learning SPARQL - Bob DuCharme](https://learningsparql.com/)
- [Semantic Web for the Working Ontologist](https://www.sciencedirect.com/book/9780123859655/semantic-web-for-the-working-ontologist)
