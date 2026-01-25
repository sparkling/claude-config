# SPARQL Property Paths

Property paths enable compact queries and arbitrary-length traversals through graph structures—a critical feature for knowledge graph navigation.

---

## Path Operators

| Operator | Name | Meaning |
|----------|------|---------|
| `iri` | PredicatePath | Single property step |
| `^elt` | InversePath | Traverse in reverse direction |
| `elt1/elt2` | SequencePath | First elt1, then elt2 |
| `elt1\|elt2` | AlternativePath | Either elt1 or elt2 |
| `elt*` | ZeroOrMorePath | Zero or more occurrences |
| `elt+` | OneOrMorePath | One or more occurrences |
| `elt?` | ZeroOrOnePath | Zero or one occurrence |
| `!iri` or `!(iri1\|...\|irin)` | NegatedPropertySet | Any property except listed |
| `(elt)` | Grouping | Precedence control |

---

## Basic Path Examples

### Sequence Paths

```sparql
PREFIX ex: <http://example.org/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

# Two-step path: friend's name
SELECT ?person ?friendName
WHERE {
  ?person foaf:knows/foaf:name ?friendName .
}

# Equivalent without path:
SELECT ?person ?friendName
WHERE {
  ?person foaf:knows ?friend .
  ?friend foaf:name ?friendName .
}

# Three-step path: friend of friend's email
SELECT ?person ?email
WHERE {
  ?person foaf:knows/foaf:knows/foaf:mbox ?email .
}
```

### Alternative Paths

```sparql
# Match any label predicate
SELECT ?resource ?label
WHERE {
  ?resource rdfs:label|skos:prefLabel|dcterms:title ?label .
}

# Parent via either mother or father
SELECT ?child ?parent
WHERE {
  ?child ex:mother|ex:father ?parent .
}
```

### Inverse Paths

```sparql
# Find children (inverse of parent)
SELECT ?parent ?child
WHERE {
  ?parent ^ex:parent ?child .
}

# Equivalent to:
SELECT ?parent ?child
WHERE {
  ?child ex:parent ?parent .
}

# Chain with inverse: siblings via shared parent
SELECT ?person ?sibling
WHERE {
  ?person ex:parent/^ex:parent ?sibling .
  FILTER (?person != ?sibling)
}
```

### Optional Paths

```sparql
# Zero or one: optional middle name
SELECT ?person ?fullName
WHERE {
  ?person ex:firstName ?first .
  ?person ex:middleName? ?middle .
  ?person ex:lastName ?last .
  BIND (COALESCE(CONCAT(?first, " ", ?middle, " ", ?last),
                 CONCAT(?first, " ", ?last)) AS ?fullName)
}
```

---

## Transitive Closure (Recursive Paths)

### Zero or More (`*`)

```sparql
# All superclasses (including indirect)
SELECT ?class ?superclass
WHERE {
  ?class rdfs:subClassOf* ?superclass .
}

# All ancestors in a hierarchy
SELECT ?category ?ancestor
WHERE {
  ?category skos:broader* ?ancestor .
}

# Note: includes the starting node when path length is 0
# ex:A rdfs:subClassOf* ?x will bind ?x to ex:A itself plus all superclasses
```

### One or More (`+`)

```sparql
# All superclasses (excluding self)
SELECT ?class ?superclass
WHERE {
  ?class rdfs:subClassOf+ ?superclass .
}

# All descendants (excluding self)
SELECT ?parent ?descendant
WHERE {
  ?parent ^ex:parent+ ?descendant .
}
```

### Combining Paths

```sparql
# Friends and friends-of-friends (up to 2 hops)
SELECT ?person ?connection
WHERE {
  ?person foaf:knows/foaf:knows? ?connection .
  FILTER (?person != ?connection)
}

# All related items via any relationship path
SELECT ?start ?related
WHERE {
  ex:StartNode (ex:relatedTo|ex:linkedTo)+ ?related .
}

# Type hierarchy: direct or inherited type
SELECT ?instance ?type
WHERE {
  ?instance a/rdfs:subClassOf* ?type .
}
```

---

## Negated Property Sets

Match any property EXCEPT specified ones:

```sparql
# All properties except rdf:type and rdfs:label
SELECT ?s ?p ?o
WHERE {
  ?s !(rdf:type|rdfs:label) ?o .
  BIND (?p AS ?p)  # Note: ?p won't be bound in negated sets
}

# Actually, negated paths don't bind the property variable
# Use this pattern instead:
SELECT ?s ?p ?o
WHERE {
  ?s ?p ?o .
  FILTER (?p NOT IN (rdf:type, rdfs:label))
}
```

---

## Complex Path Patterns

### Organizational Hierarchy

```sparql
PREFIX org: <http://www.w3.org/ns/org#>

# All reports (direct and indirect) of a manager
SELECT ?manager ?report
WHERE {
  ?manager ^org:reportsTo+ ?report .
}

# Distance in hierarchy
SELECT ?manager ?report (COUNT(?mid) AS ?distance)
WHERE {
  ?manager ^org:reportsTo+ ?mid .
  ?mid ^org:reportsTo* ?report .
}
GROUP BY ?manager ?report
```

### Part-Whole Relationships

```sparql
# All components (recursive)
SELECT ?assembly ?component
WHERE {
  ?assembly ex:hasPart+ ?component .
}

# Bill of materials with quantity (requires intermediate variables)
SELECT ?product ?part ?totalQty
WHERE {
  ?product ex:hasPart ?part .
  # Path expressions don't capture intermediate nodes
  # For full BOM, use recursive query or rules
}
```

### Knowledge Graph Exploration

```sparql
# Find connection between two nodes (any path up to 4 hops)
ASK {
  ex:NodeA (owl:sameAs|rdfs:seeAlso|ex:relatedTo){1,4} ex:NodeB .
}

# Note: SPARQL 1.1 doesn't support {n,m} syntax
# Use explicit paths:
ASK {
  {
    ex:NodeA ex:relatedTo ex:NodeB .
  } UNION {
    ex:NodeA ex:relatedTo/ex:relatedTo ex:NodeB .
  } UNION {
    ex:NodeA ex:relatedTo/ex:relatedTo/ex:relatedTo ex:NodeB .
  }
}
```

---

## Performance Considerations

> "Be cautious with property paths (`*`, `+`) in large datasets." — DuCharme

### Path Expansion Cost

Property paths with `*` and `+` can be expensive:

```sparql
# EXPENSIVE: Unbounded traversal on large graph
SELECT ?s ?target
WHERE {
  ?s ex:linkedTo* ?target .
}

# BETTER: Limit depth or results
SELECT ?s ?target
WHERE {
  ?s ex:linkedTo+ ?target .
}
LIMIT 1000

# BETTER: Bounded explicit path
SELECT ?s ?target
WHERE {
  ?s ex:linkedTo/ex:linkedTo?/ex:linkedTo? ?target .
}
```

### Materialization Strategy

For frequently-queried hierarchies, consider materializing transitive closure:

```sparql
# One-time materialization
INSERT {
  ?sub ex:transitiveSubClassOf ?super .
}
WHERE {
  ?sub rdfs:subClassOf+ ?super .
}

# Then query the materialized property (fast)
SELECT ?class ?ancestor
WHERE {
  ?class ex:transitiveSubClassOf ?ancestor .
}
```

### Path vs Explicit Patterns

```sparql
# Path syntax (compact but may be slower)
SELECT ?person ?ancestor
WHERE {
  ?person ex:parent+ ?ancestor .
}

# Explicit join (potentially optimizable by engine)
SELECT ?person ?grandparent
WHERE {
  ?person ex:parent ?parent .
  ?parent ex:parent ?grandparent .
}
```

---

## Common Path Patterns

### RDFS/OWL Reasoning Patterns

```sparql
# All types (direct and inferred via subclass)
SELECT ?resource ?type
WHERE {
  ?resource a/rdfs:subClassOf* ?type .
}

# All applicable properties (via domain inheritance)
SELECT ?class ?property
WHERE {
  ?property rdfs:domain ?domain .
  ?class rdfs:subClassOf* ?domain .
}
```

### SKOS Concept Hierarchies

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

# All broader concepts
SELECT ?concept ?broader
WHERE {
  ?concept skos:broader+ ?broader .
}

# Top concepts (no broader)
SELECT ?topConcept
WHERE {
  ?topConcept a skos:Concept .
  FILTER NOT EXISTS { ?topConcept skos:broader ?any }
}

# Sibling concepts
SELECT ?concept ?sibling
WHERE {
  ?concept skos:broader/^skos:broader ?sibling .
  FILTER (?concept != ?sibling)
}
```

### Social Network Patterns

```sparql
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

# Friends of friends (excluding direct friends)
SELECT DISTINCT ?person ?fof
WHERE {
  ?person foaf:knows/foaf:knows ?fof .
  FILTER NOT EXISTS { ?person foaf:knows ?fof }
  FILTER (?person != ?fof)
}

# Shortest path indicator (1 or 2 hops)
SELECT ?person ?target ?hops
WHERE {
  {
    ?person foaf:knows ?target .
    BIND (1 AS ?hops)
  } UNION {
    ?person foaf:knows/foaf:knows ?target .
    FILTER NOT EXISTS { ?person foaf:knows ?target }
    BIND (2 AS ?hops)
  }
}
```

---

## Limitations

1. **No path length capture**: Can't retrieve the actual path or its length directly
2. **No intermediate node access**: `?a ex:knows+ ?b` doesn't expose middle nodes
3. **No counted repetition**: SPARQL 1.1 lacks `{n}`, `{n,m}` quantifiers
4. **Variable predicates**: Can't use variables in paths (`?a ?p+ ?b` is invalid)

### Workarounds

For path length or intermediate nodes, use explicit patterns or CONSTRUCT to build augmented graphs:

```sparql
# Explicit 2-hop with intermediate
SELECT ?start ?mid ?end
WHERE {
  ?start ex:knows ?mid .
  ?mid ex:knows ?end .
}

# For longer paths, consider graph algorithms outside SPARQL
# or use SPARQL 1.2/GraphQL extensions
```
