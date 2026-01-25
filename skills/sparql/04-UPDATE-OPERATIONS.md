# SPARQL Update Operations

SPARQL 1.1 Update provides a language for modifying RDF graphs in a Graph Store.

---

## Graph Store Concepts

A **Graph Store** contains:
- **Default Graph**: Unnamed graph for general data
- **Named Graphs**: Zero or more graphs identified by IRIs

Operations affect either specific graphs or the entire store.

---

## Data Modification Operations

### INSERT DATA

Add specific triples to a graph:

```sparql
PREFIX ex: <http://example.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

# Insert into default graph
INSERT DATA {
  ex:Kurt a ex:Person ;
          rdfs:label "Kurt Cagle" ;
          ex:expertise ex:SPARQL, ex:RDF, ex:SHACL .
}

# Insert into named graph
INSERT DATA {
  GRAPH ex:PeopleGraph {
    ex:Kurt a ex:Person ;
            rdfs:label "Kurt Cagle" .
  }
}

# Insert into multiple graphs
INSERT DATA {
  GRAPH ex:Graph1 { ex:A ex:p ex:B }
  GRAPH ex:Graph2 { ex:C ex:q ex:D }
}
```

### DELETE DATA

Remove specific triples:

```sparql
# Delete from default graph
DELETE DATA {
  ex:Kurt ex:status "draft" .
}

# Delete from named graph
DELETE DATA {
  GRAPH ex:TempGraph {
    ex:Kurt ex:temporaryFlag true .
  }
}
```

**Note**: DELETE DATA cannot use blank nodes (they have no stable identity).

### DELETE/INSERT with WHERE

Pattern-based modification:

```sparql
# Update status
DELETE { ?s ex:status "draft" }
INSERT { ?s ex:status "published" }
WHERE {
  ?s ex:status "draft" ;
     ex:reviewed true .
}

# With named graphs
DELETE { GRAPH ?g { ?s ex:oldProp ?o } }
INSERT { GRAPH ?g { ?s ex:newProp ?o } }
WHERE {
  GRAPH ?g { ?s ex:oldProp ?o }
}

# Conditional update
DELETE { ?person ex:age ?oldAge }
INSERT { ?person ex:age ?newAge }
WHERE {
  ?person ex:age ?oldAge ;
          ex:birthYear ?year .
  BIND (YEAR(NOW()) - ?year AS ?newAge)
}
```

### DELETE WHERE (Shorthand)

When DELETE and WHERE patterns match:

```sparql
# Delete all triples matching pattern
DELETE WHERE {
  ?s ex:deprecated true ;
     ?p ?o .
}

# Delete from named graph
DELETE WHERE {
  GRAPH ex:TempGraph { ?s ?p ?o }
}
```

### INSERT-Only Updates

```sparql
# Insert derived data
INSERT {
  ?person ex:fullName ?full .
}
WHERE {
  ?person ex:firstName ?first ;
          ex:lastName ?last .
  BIND (CONCAT(?first, " ", ?last) AS ?full)
}

# Materialize inferences
INSERT {
  ?instance a ?superclass .
}
WHERE {
  ?instance a ?class .
  ?class rdfs:subClassOf+ ?superclass .
}
```

---

## Graph Management Operations

### LOAD

Load external RDF into graph store:

```sparql
# Load into default graph
LOAD <http://example.org/data.ttl>

# Load into named graph
LOAD <http://example.org/data.ttl> INTO GRAPH ex:ImportedData

# Silent (ignore errors)
LOAD SILENT <http://example.org/maybe-missing.ttl>
```

### CLEAR

Remove all triples from graph(s):

```sparql
# Clear default graph
CLEAR DEFAULT

# Clear named graph
CLEAR GRAPH ex:TempGraph

# Clear all named graphs
CLEAR NAMED

# Clear everything
CLEAR ALL

# Silent (no error if graph doesn't exist)
CLEAR SILENT GRAPH ex:MaybeNotExist
```

### DROP

Remove graph from store:

```sparql
# Drop named graph
DROP GRAPH ex:ObsoleteGraph

# Drop default graph
DROP DEFAULT

# Drop all named graphs
DROP NAMED

# Drop everything
DROP ALL

# Silent
DROP SILENT GRAPH ex:MaybeNotExist
```

### CREATE

Create empty named graph:

```sparql
# Create new graph
CREATE GRAPH ex:NewGraph

# Silent (no error if exists)
CREATE SILENT GRAPH ex:MaybeExists
```

### COPY, MOVE, ADD

Manage graph contents:

```sparql
# Copy: Replace target with source contents
COPY ex:Source TO ex:Target
COPY DEFAULT TO ex:Backup

# Move: Copy then drop source
MOVE ex:Source TO ex:Target

# Add: Insert source contents into target (union)
ADD ex:Source TO ex:Target
ADD ex:NewData TO DEFAULT

# With SILENT
COPY SILENT ex:MaybeNotExist TO ex:Target
```

---

## Transaction Patterns

### Atomic Updates

Use DELETE/INSERT together for atomic changes:

```sparql
# Rename property atomically
DELETE { ?s ex:oldName ?name }
INSERT { ?s ex:newName ?name }
WHERE { ?s ex:oldName ?name }
```

### Conditional Insert (No Duplicates)

```sparql
# Only insert if not exists
INSERT {
  ex:NewPerson a ex:Person ;
               rdfs:label "New Person" .
}
WHERE {
  FILTER NOT EXISTS { ex:NewPerson a ex:Person }
}
```

### Upsert Pattern

```sparql
# Delete existing, insert new (upsert)
DELETE { ex:Resource ex:value ?old }
INSERT { ex:Resource ex:value "new value" }
WHERE {
  OPTIONAL { ex:Resource ex:value ?old }
}
```

### Batch Operations

```sparql
# Process in batches (pseudo-code pattern)
# Run multiple times until no matches

DELETE { ?s ex:processed ?val }
INSERT { ?s ex:archived ?val }
WHERE {
  ?s ex:processed ?val .
}
LIMIT 1000
```

---

## Common Update Patterns

### Add Timestamp

```sparql
INSERT {
  ?resource ex:modified ?now .
}
WHERE {
  ?resource ex:needsTimestamp true .
  BIND (NOW() AS ?now)
}
```

### Increment Counter

```sparql
DELETE { ex:Counter ex:value ?old }
INSERT { ex:Counter ex:value ?new }
WHERE {
  ex:Counter ex:value ?old .
  BIND (?old + 1 AS ?new)
}
```

### Merge Duplicate Records

```sparql
# Find duplicates and merge to canonical
DELETE {
  ?duplicate ?p ?o .
  ?s ?p2 ?duplicate .
}
INSERT {
  ?canonical ?p ?o .
  ?s ?p2 ?canonical .
}
WHERE {
  ?canonical ex:canonicalId ?id .
  ?duplicate ex:duplicateOf ?canonical ;
             ?p ?o .
  ?s ?p2 ?duplicate .
}
```

### Cascade Delete

```sparql
# Delete resource and all references to it
DELETE {
  ex:ToDelete ?p ?o .
  ?s ?p2 ex:ToDelete .
}
WHERE {
  { ex:ToDelete ?p ?o }
  UNION
  { ?s ?p2 ex:ToDelete }
}
```

### Archive Pattern

```sparql
# Move to archive graph
DELETE { GRAPH ex:Active { ?s ?p ?o } }
INSERT { GRAPH ex:Archive { ?s ?p ?o . ?s ex:archivedAt ?now } }
WHERE {
  GRAPH ex:Active {
    ?s ex:status "inactive" ;
       ?p ?o .
  }
  BIND (NOW() AS ?now)
}
```

---

## Security Considerations

### Update Permissions

| Operation | Risk | Recommendation |
|-----------|------|----------------|
| INSERT DATA | Low | Allow with constraints |
| DELETE DATA | Medium | Require authentication |
| DELETE/INSERT | Medium | Validate patterns |
| LOAD | High | Whitelist sources |
| DROP/CLEAR | Critical | Admin only |

### Safe Update Template

```sparql
# Template with parameter validation
DELETE { ?s ex:status ?old }
INSERT { ?s ex:status $newStatus }
WHERE {
  VALUES ?s { $targetResource }
  VALUES $newStatus { "draft" "review" "published" }  # Whitelist
  ?s ex:status ?old .
  ?s ex:owner $currentUser .  # Authorization
}
```

---

## Performance Tips

1. **Batch large updates** - Break into chunks of 1000-10000 triples
2. **Use DELETE WHERE** when pattern matches exactly
3. **Avoid unbounded DELETE** - Always have restrictive WHERE
4. **Index before bulk load** - Disable during load, rebuild after
5. **Use named graphs** for logical partitioning
6. **Transaction boundaries** - Group related changes
