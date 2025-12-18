# Named Graphs and Quads

> **GUIDE QUICK REF**: `GRAPH <uri> { }` | `FROM NAMED` | Quads: `s p o g` | Workflow states | Provenance | Multi-tenancy | "Under-utilized but powerful" — Cagle

## What Are Named Graphs?

Named graphs extend RDF triples to quads by adding a graph identifier:

```
# Triple (3 elements)
subject predicate object .

# Quad (4 elements)
subject predicate object graphName .
```

The graph name provides a fourth dimension for organizing data.

---

## Kurt Cagle's Philosophy on Named Graphs

From The Ontologist and Knowledge Graph Conference tutorials:

> "Named graphs in particular are under-utilized, and represent a level of abstraction that most people are only just beginning to tap into."

> "Named graphs can majorly affect your knowledge graph's organization and performance. Such named graphs make workflow operations possible, and because graph data is determined by the fourth tuple, there is comparatively little movement of data (and hence reindexing) needed."

**Key insight**: Moving data between named graphs is cheap—you're just changing the graph identifier, not physically relocating triples.

---

## Use Cases for Named Graphs

| Use Case | Graph Organization |
|----------|-------------------|
| **Provenance** | One graph per data source |
| **Versioning** | One graph per version/snapshot |
| **Workflow States** | Graphs for staging, review, production |
| **Multi-tenancy** | One graph per tenant/customer |
| **Access Control** | Graphs aligned with permissions |
| **Modularity** | Separate ontology, instance data, metadata |
| **Transactions** | Temporary graphs for atomic operations |

---

## Querying Named Graphs

### Query Specific Graph

```sparql
SELECT ?name ?email
WHERE {
  GRAPH <http://example.org/employees> {
    ?person foaf:name ?name ;
            foaf:mbox ?email .
  }
}
```

### Query Multiple Named Graphs

```sparql
SELECT ?g ?name
WHERE {
  GRAPH ?g {
    ?person foaf:name ?name .
  }
  FILTER (?g IN (
    <http://example.org/employees>,
    <http://example.org/contractors>
  ))
}
```

### Query All Named Graphs

```sparql
SELECT ?graph ?subject ?predicate ?object
WHERE {
  GRAPH ?graph {
    ?subject ?predicate ?object .
  }
}
```

---

## Default Graph vs Named Graphs

### FROM and FROM NAMED

```sparql
# Query default graph (merged from specified sources)
SELECT ?name
FROM <http://example.org/people>
FROM <http://example.org/contacts>
WHERE {
  ?person foaf:name ?name .
}

# Query named graphs explicitly
SELECT ?g ?name
FROM NAMED <http://example.org/people>
FROM NAMED <http://example.org/contacts>
WHERE {
  GRAPH ?g {
    ?person foaf:name ?name .
  }
}
```

### Triple Store Variations (Cagle's Warning)

**GraphDB**: Default graph includes union of all named graphs
**Stardog/Jena**: Default graph is separate; named graphs require explicit GRAPH clause

```sparql
# Works in GraphDB (default includes named)
SELECT ?name
WHERE { ?person foaf:name ?name }

# Required in Stardog for cross-graph query
SELECT ?name
WHERE {
  GRAPH ?g { ?person foaf:name ?name }
}
```

---

## Workflow Pattern (Cagle's Transactional Approach)

### State Machine with Named Graphs

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   :inbox    │ -> │  :staging   │ -> │   :review   │ -> │ :production │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Move Items Through Workflow

```sparql
# Move approved items from review to production
DELETE {
  GRAPH <http://example.org/review> {
    ?item ?p ?o .
  }
}
INSERT {
  GRAPH <http://example.org/production> {
    ?item ?p ?o .
  }
}
WHERE {
  GRAPH <http://example.org/review> {
    ?item ?p ?o ;
          ex:status "approved" .
  }
};

# Update audit trail
INSERT {
  GRAPH <http://example.org/audit> {
    ?item ex:publishedAt ?now ;
          ex:publishedBy ?user .
  }
}
WHERE {
  GRAPH <http://example.org/production> {
    ?item a ex:Content .
  }
  BIND (NOW() AS ?now)
  BIND (<http://example.org/users/system> AS ?user)
}
```

---

## Provenance Tracking

### One Graph Per Source

```sparql
# Load data with provenance
LOAD <http://data.gov/dataset.ttl> INTO GRAPH <http://example.org/sources/data-gov>

# Query with source information
SELECT ?fact ?source
WHERE {
  GRAPH ?source {
    ?s ex:population ?fact .
  }
}
```

### Attach Metadata to Graphs

```sparql
# Graph metadata in a dedicated graph
INSERT DATA {
  GRAPH <http://example.org/graph-metadata> {
    <http://example.org/sources/data-gov>
      prov:wasGeneratedBy <http://example.org/imports/2024-01> ;
      prov:generatedAtTime "2024-01-15T10:00:00Z"^^xsd:dateTime ;
      dct:source <http://data.gov/dataset> ;
      dct:license <http://creativecommons.org/publicdomain/zero/1.0/> .
  }
}
```

---

## Multi-Tenancy Pattern

### Tenant-Specific Graphs

```sparql
# Insert for tenant
INSERT DATA {
  GRAPH <http://example.org/tenants/acme-corp> {
    ex:order123 a ex:Order ;
                ex:amount 500.00 .
  }
}

# Query scoped to tenant
SELECT ?order ?amount
WHERE {
  GRAPH <http://example.org/tenants/acme-corp> {
    ?order a ex:Order ;
           ex:amount ?amount .
  }
}
```

### Shared + Tenant-Specific Data

```sparql
SELECT ?product ?price ?tenantDiscount
WHERE {
  # Shared product catalog
  GRAPH <http://example.org/shared/products> {
    ?product ex:basePrice ?price .
  }

  # Tenant-specific pricing
  OPTIONAL {
    GRAPH <http://example.org/tenants/acme-corp> {
      ?product ex:discountPercent ?tenantDiscount .
    }
  }
}
```

---

## Versioning Pattern

### Snapshot Graphs

```sparql
# Create versioned snapshot
INSERT {
  GRAPH <http://example.org/versions/2024-01-15> {
    ?s ?p ?o .
  }
}
WHERE {
  GRAPH <http://example.org/current> {
    ?s ?p ?o .
  }
};

# Record version metadata
INSERT DATA {
  GRAPH <http://example.org/version-metadata> {
    <http://example.org/versions/2024-01-15>
      ex:createdAt "2024-01-15T00:00:00Z"^^xsd:dateTime ;
      ex:previousVersion <http://example.org/versions/2024-01-14> .
  }
}
```

### Diff Between Versions

```sparql
# Triples added in new version
SELECT ?s ?p ?o
WHERE {
  GRAPH <http://example.org/versions/v2> { ?s ?p ?o }
  FILTER NOT EXISTS {
    GRAPH <http://example.org/versions/v1> { ?s ?p ?o }
  }
}

# Triples removed in new version
SELECT ?s ?p ?o
WHERE {
  GRAPH <http://example.org/versions/v1> { ?s ?p ?o }
  FILTER NOT EXISTS {
    GRAPH <http://example.org/versions/v2> { ?s ?p ?o }
  }
}
```

---

## Graph Management Operations

### COPY, MOVE, ADD

```sparql
# Copy graph (target is replaced)
COPY GRAPH <http://example.org/source>
  TO GRAPH <http://example.org/backup>

# Move graph (source is deleted)
MOVE GRAPH <http://example.org/staging>
  TO GRAPH <http://example.org/production>

# Add graph (target is merged)
ADD GRAPH <http://example.org/updates>
  TO GRAPH <http://example.org/current>
```

### CLEAR and DROP

```sparql
# Clear contents (graph still exists)
CLEAR GRAPH <http://example.org/temp>

# Drop graph entirely
DROP GRAPH <http://example.org/obsolete>

# Clear all named graphs
CLEAR NAMED

# Clear default graph
CLEAR DEFAULT

# Clear everything
CLEAR ALL
```

---

## TriG Format for Named Graphs

TriG extends Turtle with named graph syntax:

```trig
@prefix ex: <http://example.org/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

# Default graph
ex:DefaultThing ex:prop "value" .

# Named graph
ex:people {
  ex:alice a foaf:Person ;
           foaf:name "Alice" .
  ex:bob a foaf:Person ;
         foaf:name "Bob" .
}

# Another named graph
ex:companies {
  ex:acme a ex:Company ;
          ex:employs ex:alice, ex:bob .
}
```

---

## Performance Considerations

### Graph Granularity

| Granularity | Pros | Cons |
|-------------|------|------|
| **Coarse** (few large graphs) | Simpler queries | Less flexibility |
| **Fine** (many small graphs) | Precise control | Query complexity |
| **Medium** (domain-aligned) | Balance | Requires planning |

### Query Optimization

```sparql
# SLOW: Scan all graphs
SELECT ?name
WHERE {
  GRAPH ?g { ?person foaf:name ?name }
}

# FAST: Target specific graph
SELECT ?name
WHERE {
  GRAPH <http://example.org/people> {
    ?person foaf:name ?name
  }
}

# FAST: Known set of graphs
SELECT ?name
WHERE {
  VALUES ?g { <graph1> <graph2> <graph3> }
  GRAPH ?g { ?person foaf:name ?name }
}
```

---

## Best Practices (Cagle's Recommendations)

1. **Design Graph Structure Early**: Graph organization is hard to change later
2. **Use Meaningful Graph URIs**: Encode purpose in the URI (`/staging/`, `/v1/`, `/tenant/acme/`)
3. **Separate Concerns**: Data graphs, schema graphs, metadata graphs
4. **Leverage for Workflows**: Named graphs make state transitions cheap
5. **Document Graph Conventions**: Maintain a graph registry
6. **Test Cross-Store Behavior**: Default graph semantics vary
