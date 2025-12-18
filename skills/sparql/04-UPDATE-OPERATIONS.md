# SPARQL UPDATE Operations

> **GUIDE QUICK REF**: `INSERT DATA { }` | `DELETE DATA { }` | `DELETE { } INSERT { } WHERE { }` | `LOAD` | `CLEAR` | `DROP` | Transactional workflows | "SPARQL UPDATE as workflow engine" — Cagle

## SPARQL 1.1 Update Overview

SPARQL UPDATE provides graph modification capabilities:

| Operation | Purpose |
|-----------|---------|
| `INSERT DATA` | Add specific triples |
| `DELETE DATA` | Remove specific triples |
| `DELETE/INSERT` | Conditional modification |
| `LOAD` | Import external RDF |
| `CLEAR` | Remove graph contents |
| `DROP` | Delete entire graph |
| `COPY` | Duplicate graph |
| `MOVE` | Rename graph |
| `ADD` | Merge graphs |
| `CREATE` | Create empty graph |

---

## INSERT DATA - Add Triples

Insert specific triples without a WHERE clause:

```sparql
PREFIX ex: <http://example.org/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

INSERT DATA {
  ex:person1 a foaf:Person ;
             foaf:name "Alice Smith" ;
             foaf:mbox <mailto:alice@example.org> ;
             ex:created "2024-01-15"^^xsd:date .
}
```

### Insert into Named Graph

```sparql
INSERT DATA {
  GRAPH <http://example.org/people> {
    ex:person2 a foaf:Person ;
               foaf:name "Bob Jones" .
  }
}
```

### Bulk Insert

```sparql
INSERT DATA {
  ex:p1 foaf:name "Person 1" .
  ex:p2 foaf:name "Person 2" .
  ex:p3 foaf:name "Person 3" .
  ex:p4 foaf:name "Person 4" .
  ex:p5 foaf:name "Person 5" .
}
```

---

## DELETE DATA - Remove Triples

Remove specific triples (must match exactly):

```sparql
DELETE DATA {
  ex:person1 foaf:mbox <mailto:alice@example.org> .
}
```

### Delete from Named Graph

```sparql
DELETE DATA {
  GRAPH <http://example.org/people> {
    ex:person2 foaf:name "Bob Jones" .
  }
}
```

**Note**: DELETE DATA requires exact values—no variables or patterns.

---

## DELETE/INSERT WHERE - Conditional Updates

The most powerful update form:

```sparql
# Update email address
DELETE { ?person foaf:mbox ?oldEmail }
INSERT { ?person foaf:mbox <mailto:alice.new@example.org> }
WHERE {
  ?person foaf:name "Alice Smith" ;
          foaf:mbox ?oldEmail .
}
```

### DELETE Only

```sparql
# Remove all pending status markers
DELETE { ?item ex:status "pending" }
WHERE {
  ?item ex:status "pending" ;
        ex:created ?date .
  FILTER (?date < "2024-01-01"^^xsd:date)
}
```

### INSERT Only with WHERE

```sparql
# Add computed property
INSERT { ?person ex:age ?age }
WHERE {
  ?person ex:birthDate ?birth .
  BIND (YEAR(NOW()) - YEAR(?birth) AS ?age)
  FILTER NOT EXISTS { ?person ex:age ?existing }
}
```

### Complex Transformation

```sparql
# Normalize phone numbers
DELETE { ?person ex:phone ?oldPhone }
INSERT { ?person ex:phone ?normalizedPhone }
WHERE {
  ?person ex:phone ?oldPhone .
  FILTER (STRSTARTS(?oldPhone, "1-"))
  BIND (CONCAT("+", REPLACE(?oldPhone, "-", "")) AS ?normalizedPhone)
}
```

---

## Workflow Patterns (Cagle's Approach)

### State Transition

```sparql
# Move items from draft to review
DELETE {
  GRAPH <http://example.org/drafts> { ?item ?p ?o }
}
INSERT {
  GRAPH <http://example.org/review> { ?item ?p ?o }
  GRAPH <http://example.org/audit> {
    ?item ex:submittedAt ?now ;
          ex:submittedBy ?user .
  }
}
WHERE {
  GRAPH <http://example.org/drafts> {
    ?item ?p ?o ;
          ex:status "complete" .
  }
  BIND (NOW() AS ?now)
  BIND (<http://example.org/users/current> AS ?user)
}
```

### Approval Workflow

```sparql
# Approve items with score > 80
DELETE { ?item ex:status "pending" }
INSERT {
  ?item ex:status "approved" ;
        ex:approvedAt ?now .
}
WHERE {
  ?item ex:status "pending" ;
        ex:score ?score .
  FILTER (?score > 80)
  BIND (NOW() AS ?now)
}
```

### Rejection with Reason

```sparql
DELETE { ?item ex:status "pending" }
INSERT {
  ?item ex:status "rejected" ;
        ex:rejectedAt ?now ;
        ex:rejectionReason "Score below threshold" .
}
WHERE {
  ?item ex:status "pending" ;
        ex:score ?score .
  FILTER (?score <= 50)
  BIND (NOW() AS ?now)
}
```

---

## Chained Operations

SPARQL UPDATE supports multiple operations separated by semicolons:

```sparql
# Transaction: Multiple related updates
DELETE DATA { ex:counter ex:value 41 };

INSERT DATA { ex:counter ex:value 42 };

INSERT DATA {
  GRAPH <http://example.org/log> {
    _:entry ex:action "increment" ;
            ex:timestamp "2024-01-15T10:30:00Z"^^xsd:dateTime .
  }
}
```

### Pipeline Pattern

```sparql
# Step 1: Mark items for processing
INSERT { ?item ex:processing true }
WHERE { ?item ex:status "queued" };

# Step 2: Process items
DELETE { ?item ex:rawData ?raw }
INSERT { ?item ex:processedData ?processed }
WHERE {
  ?item ex:processing true ;
        ex:rawData ?raw .
  BIND (UCASE(?raw) AS ?processed)
};

# Step 3: Complete processing
DELETE { ?item ex:processing true }
INSERT { ?item ex:status "complete" }
WHERE { ?item ex:processing true }
```

---

## LOAD - Import External RDF

```sparql
# Load into default graph
LOAD <http://example.org/data.ttl>

# Load into named graph
LOAD <http://example.org/data.ttl> INTO GRAPH <http://example.org/imported>

# Load silently (ignore errors)
LOAD SILENT <http://example.org/maybe-exists.ttl>
```

### Common Load Patterns

```sparql
# Load ontology
LOAD <http://xmlns.com/foaf/spec/index.rdf>
  INTO GRAPH <http://example.org/ontologies/foaf>

# Load vocabulary
LOAD <http://www.w3.org/2004/02/skos/core.rdf>
  INTO GRAPH <http://example.org/ontologies/skos>

# Load data from local file (if supported)
LOAD <file:///data/import.ttl>
  INTO GRAPH <http://example.org/data/batch-001>
```

---

## Graph Management

### CREATE - Empty Graph

```sparql
# Create named graph (some stores require this)
CREATE GRAPH <http://example.org/new-graph>

# Create silently (no error if exists)
CREATE SILENT GRAPH <http://example.org/maybe-exists>
```

### CLEAR - Empty Graph Contents

```sparql
# Clear specific graph
CLEAR GRAPH <http://example.org/temp>

# Clear default graph
CLEAR DEFAULT

# Clear all named graphs
CLEAR NAMED

# Clear everything
CLEAR ALL
```

### DROP - Delete Graph

```sparql
# Drop specific graph
DROP GRAPH <http://example.org/obsolete>

# Drop silently (no error if missing)
DROP SILENT GRAPH <http://example.org/maybe-exists>

# Drop default graph
DROP DEFAULT

# Drop all named graphs
DROP NAMED

# Drop everything
DROP ALL
```

### COPY - Duplicate Graph

```sparql
# Copy overwrites target
COPY GRAPH <http://example.org/production>
  TO GRAPH <http://example.org/backup-2024-01-15>

# Copy default to named
COPY DEFAULT TO GRAPH <http://example.org/snapshot>
```

### MOVE - Rename Graph

```sparql
# Move (source deleted, target overwritten)
MOVE GRAPH <http://example.org/staging>
  TO GRAPH <http://example.org/production>
```

### ADD - Merge Graphs

```sparql
# Add source to target (both preserved)
ADD GRAPH <http://example.org/updates>
  TO GRAPH <http://example.org/main>
```

---

## WITH Clause

Specify default graph for updates:

```sparql
WITH <http://example.org/mydata>
DELETE { ?person ex:status "active" }
INSERT { ?person ex:status "inactive" }
WHERE {
  ?person ex:lastLogin ?date .
  FILTER (?date < "2023-01-01"^^xsd:date)
}
```

### USING and USING NAMED

```sparql
# Query from specific graphs for WHERE clause
DELETE { ?item ex:price ?old }
INSERT { ?item ex:price ?new }
USING <http://example.org/prices>
USING NAMED <http://example.org/adjustments>
WHERE {
  ?item ex:price ?old .
  GRAPH <http://example.org/adjustments> {
    ?item ex:adjustment ?adj .
  }
  BIND (?old + ?adj AS ?new)
}
```

---

## Error Handling Patterns

### Conditional Insert (Idempotent)

```sparql
# Only insert if not exists
INSERT {
  ex:config ex:initialized true ;
            ex:version "1.0" .
}
WHERE {
  FILTER NOT EXISTS { ex:config ex:initialized ?any }
}
```

### Upsert Pattern

```sparql
# Delete old, insert new (upsert)
DELETE { ex:user123 ex:email ?old }
INSERT { ex:user123 ex:email "new@example.org" }
WHERE {
  OPTIONAL { ex:user123 ex:email ?old }
}
```

### Safe Delete (Only If Matches)

```sparql
# Delete only if current value matches expected
DELETE { ex:counter ex:value 42 }
WHERE { ex:counter ex:value 42 }
```

---

## Best Practices

1. **Use Transactions**: Chain related operations with semicolons
2. **Preserve Audit Trail**: Insert provenance when modifying
3. **Test with SELECT**: Verify WHERE clause matches expected data
4. **Use SILENT for Optional Operations**: LOAD SILENT, DROP SILENT
5. **Backup Before Bulk Updates**: COPY to backup graph first
6. **Leverage Named Graphs**: State transitions are cheap with graphs
7. **Avoid Expensive WHERE Clauses**: Filter early, limit scope

### Pre-Update Verification

```sparql
# Step 1: Check what will be affected
SELECT ?item ?currentStatus (COUNT(*) AS ?count)
WHERE {
  ?item ex:status ?currentStatus .
  FILTER (?currentStatus = "pending")
}
GROUP BY ?item ?currentStatus

# Step 2: If count is expected, proceed with update
DELETE { ?item ex:status "pending" }
INSERT { ?item ex:status "approved" }
WHERE {
  ?item ex:status "pending" .
}
```
