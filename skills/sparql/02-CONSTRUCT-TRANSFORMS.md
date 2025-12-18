# CONSTRUCT and RDF Transformations

> **GUIDE QUICK REF**: `CONSTRUCT { template } WHERE { pattern }` | Transform schemas | Build intermediate graphs | Output to JSON-LD | Graph-to-graph pipelines

## The CONSTRUCT Query Form

CONSTRUCT creates new RDF graphs from query results:

```sparql
PREFIX schema: <http://schema.org/>
PREFIX ex: <http://example.org/>

CONSTRUCT {
  ?person schema:name ?name ;
          schema:email ?email ;
          schema:worksFor ?company .
}
WHERE {
  ?person ex:fullName ?name ;
          ex:emailAddress ?email ;
          ex:employer ?company .
}
```

**Output**: RDF triples using Schema.org vocabulary, transformed from internal vocabulary.

---

## Template vs Pattern

The CONSTRUCT has two parts:

1. **Template** (CONSTRUCT clause): The shape of output triples
2. **Pattern** (WHERE clause): The query pattern to match

```sparql
CONSTRUCT {
  # TEMPLATE: Output triples
  ?s ?p ?o .
  ?s ex:processed true .
}
WHERE {
  # PATTERN: Input matching
  ?s ?p ?o .
  ?s a ex:RawData .
}
```

---

## Vocabulary Mapping

Transform between ontologies:

```sparql
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX schema: <http://schema.org/>
PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>

# FOAF to Schema.org
CONSTRUCT {
  ?person a schema:Person ;
          schema:name ?name ;
          schema:email ?email ;
          schema:knows ?friend .
}
WHERE {
  ?person a foaf:Person ;
          foaf:name ?name .
  OPTIONAL { ?person foaf:mbox ?emailUri . BIND(STR(?emailUri) AS ?email) }
  OPTIONAL { ?person foaf:knows ?friend }
}
```

### Bi-directional Mapping Table

| Source (FOAF) | Target (Schema.org) |
|---------------|---------------------|
| `foaf:Person` | `schema:Person` |
| `foaf:name` | `schema:name` |
| `foaf:mbox` | `schema:email` |
| `foaf:knows` | `schema:knows` |
| `foaf:img` | `schema:image` |
| `foaf:homepage` | `schema:url` |

---

## Creating Derived Properties

Generate computed values in output:

```sparql
CONSTRUCT {
  ?product ex:displayPrice ?formattedPrice ;
           ex:discountedPrice ?salePrice ;
           ex:inStock ?stockStatus .
}
WHERE {
  ?product ex:price ?price ;
           ex:inventory ?qty .
  BIND (CONCAT("$", STR(?price)) AS ?formattedPrice)
  BIND (?price * 0.85 AS ?salePrice)
  BIND (IF(?qty > 0, true, false) AS ?stockStatus)
}
```

---

## Blank Node Patterns

Create structured blank nodes for nested data:

```sparql
CONSTRUCT {
  ?person schema:address [
    a schema:PostalAddress ;
    schema:streetAddress ?street ;
    schema:addressLocality ?city ;
    schema:postalCode ?zip
  ] .
}
WHERE {
  ?person ex:street ?street ;
          ex:city ?city ;
          ex:zipCode ?zip .
}
```

### Named Blank Nodes (Skolemization)

```sparql
CONSTRUCT {
  ?person schema:address ?addrNode .
  ?addrNode a schema:PostalAddress ;
            schema:streetAddress ?street .
}
WHERE {
  ?person ex:street ?street .
  BIND (IRI(CONCAT("http://example.org/.well-known/genid/addr-", STRUUID())) AS ?addrNode)
}
```

---

## Graph Envelope Pattern (Cagle)

Pre-build related data bundles for performance:

```sparql
# Build envelope containing person + related data
CONSTRUCT {
  ?person ?p ?o .
  ?person ex:label ?name .
  ?person ex:typeLabel ?typeLabel .
  ?related ?rp ?ro .
}
WHERE {
  # Core person data
  ?person a foaf:Person ;
          ?p ?o ;
          foaf:name ?name .

  # Type labels
  ?person a ?type .
  ?type rdfs:label ?typeLabel .
  FILTER (lang(?typeLabel) = "en")

  # Related resources (1 hop)
  OPTIONAL {
    ?person (foaf:knows|ex:worksFor|ex:memberOf) ?related .
    ?related ?rp ?ro .
  }
}
```

**Use Case**: Cache these envelopes, serve directly without runtime DESCRIBE queries.

---

## Multi-Graph CONSTRUCT

Build output across named graphs:

```sparql
# Note: Not standard SPARQL 1.1, but supported by many stores
CONSTRUCT {
  GRAPH <http://example.org/transformed> {
    ?person schema:name ?name .
  }
  GRAPH <http://example.org/provenance> {
    ?person prov:wasDerivedFrom ?source .
  }
}
WHERE {
  GRAPH ?source {
    ?person foaf:name ?name .
  }
}
```

---

## Chained Transformations

Build pipelines with intermediate CONSTRUCT results:

### Step 1: Normalize

```sparql
# normalize.rq - Standardize property names
CONSTRUCT {
  ?s ex:name ?name .
  ?s ex:email ?email .
}
WHERE {
  ?s (foaf:name|schema:name|vcard:fn) ?name .
  OPTIONAL { ?s (foaf:mbox|schema:email|vcard:email) ?email }
}
```

### Step 2: Enrich

```sparql
# enrich.rq - Add derived properties
CONSTRUCT {
  ?s ?p ?o .
  ?s ex:displayName ?displayName .
  ?s ex:domain ?domain .
}
WHERE {
  ?s ?p ?o .
  ?s ex:name ?name .
  OPTIONAL { ?s ex:email ?email }
  BIND (UCASE(?name) AS ?displayName)
  BIND (REPLACE(?email, ".*@", "") AS ?domain)
}
```

### Step 3: Export

```sparql
# export.rq - Final schema for API
CONSTRUCT {
  ?s a schema:Person ;
     schema:name ?name ;
     schema:email ?email .
}
WHERE {
  ?s ex:name ?name .
  OPTIONAL { ?s ex:email ?email }
}
```

---

## JSON-LD Output Pattern

Structure CONSTRUCT output for JSON-LD framing:

```sparql
CONSTRUCT {
  ?person a schema:Person ;
          schema:identifier ?id ;
          schema:name ?name ;
          schema:email ?email ;
          schema:memberOf ?org .
  ?org a schema:Organization ;
       schema:name ?orgName .
}
WHERE {
  ?person a ex:Employee ;
          ex:id ?id ;
          ex:name ?name ;
          ex:email ?email ;
          ex:company ?org .
  ?org ex:name ?orgName .
}
```

### JSON-LD Frame

```json
{
  "@context": "https://schema.org/",
  "@type": "Person",
  "memberOf": {
    "@type": "Organization"
  }
}
```

### Framed Output

```json
{
  "@context": "https://schema.org/",
  "@type": "Person",
  "identifier": "emp123",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "memberOf": {
    "@type": "Organization",
    "name": "Acme Corp"
  }
}
```

---

## DESCRIBE Alternative

Instead of expensive DESCRIBE, use targeted CONSTRUCT:

```sparql
# Better than: DESCRIBE ex:Person123

CONSTRUCT {
  ex:Person123 ?p ?o .
  ?o rdfs:label ?label .
}
WHERE {
  ex:Person123 ?p ?o .
  OPTIONAL {
    FILTER (isIRI(?o))
    ?o rdfs:label ?label .
    FILTER (lang(?label) = "en" || lang(?label) = "")
  }
}
```

---

## Reification Pattern

Transform statements about statements:

```sparql
# Original: ex:Statement123 rdf:subject ?s ; rdf:predicate ?p ; rdf:object ?o
# Transform to RDF-star style annotation

CONSTRUCT {
  ?s ?p ?o .
  << ?s ?p ?o >> ex:confidence ?confidence ;
                 ex:source ?source .
}
WHERE {
  ?stmt a rdf:Statement ;
        rdf:subject ?s ;
        rdf:predicate ?p ;
        rdf:object ?o ;
        ex:confidence ?confidence ;
        ex:source ?source .
}
```

---

## Aggregation in CONSTRUCT

CONSTRUCT doesn't directly support aggregation, but you can use subqueries:

```sparql
CONSTRUCT {
  ?department ex:employeeCount ?count ;
              ex:avgSalary ?avg .
}
WHERE {
  {
    SELECT ?department (COUNT(?emp) AS ?count) (AVG(?salary) AS ?avg)
    WHERE {
      ?emp ex:department ?department ;
           ex:salary ?salary .
    }
    GROUP BY ?department
  }
}
```

---

## Best Practices

1. **Preserve Provenance**: Include source graph/document references
2. **Use BIND for Computation**: Calculate derived values in WHERE, reference in CONSTRUCT
3. **Handle OPTIONAL Gracefully**: Missing values won't create incomplete triples
4. **Skolemize Blank Nodes**: Use deterministic IRIs for reproducible transforms
5. **Test with SELECT First**: Debug patterns with SELECT before CONSTRUCT
6. **Document Mappings**: Maintain vocabulary mapping tables
