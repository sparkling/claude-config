# Property Paths

SHACL supports SPARQL-style property paths for flexible navigation through RDF graphs.

---

## Path Types

### Predicate Path

The simplest path—a direct property:

```turtle
sh:property [
    sh:path ex:name ;  # Direct property
    sh:minCount 1
] .
```

### Sequence Path

Chain of properties (list syntax):

```turtle
# Parent's name
sh:property [
    sh:path ( ex:parent ex:name ) ;
    sh:minCount 1
] .

# Grandparent
sh:property [
    sh:path ( ex:parent ex:parent ) ;
    sh:class ex:Person
] .

# Deep traversal
sh:property [
    sh:path ( ex:company ex:address ex:city ex:country ) ;
    sh:hasValue ex:USA
] .
```

### Alternative Path

Either property (disjunction):

```turtle
# Label from any vocabulary
sh:property [
    sh:path [ sh:alternativePath ( rdfs:label skos:prefLabel dcterms:title schema:name ) ] ;
    sh:minCount 1
] .

# Parent via mother or father
sh:property [
    sh:path [ sh:alternativePath ( ex:mother ex:father ) ] ;
    sh:class ex:Person
] .
```

### Inverse Path

Traverse in reverse direction:

```turtle
# Children (inverse of parent)
sh:property [
    sh:path [ sh:inversePath ex:parent ] ;
    sh:class ex:Person
] .

# Books written by this author
sh:property [
    sh:path [ sh:inversePath ex:author ] ;
    sh:class ex:Book
] .
```

### Zero-or-More Path

Zero or more repetitions:

```turtle
# All ancestors (including self at zero steps)
sh:property [
    sh:path [ sh:zeroOrMorePath ex:parent ] ;
    sh:class ex:Person
] .

# All superclasses
sh:property [
    sh:path [ sh:zeroOrMorePath rdfs:subClassOf ] ;
    sh:nodeKind sh:IRI
] .
```

### One-or-More Path

One or more repetitions:

```turtle
# All ancestors (excluding self)
sh:property [
    sh:path [ sh:oneOrMorePath ex:parent ] ;
    sh:class ex:Person
] .

# All proper subparts
sh:property [
    sh:path [ sh:oneOrMorePath ex:hasPart ] ;
    sh:class ex:Component
] .
```

### Zero-or-One Path

Optional single step:

```turtle
# Optional middle name
sh:property [
    sh:path [ sh:zeroOrOnePath ex:middleName ] ;
    sh:datatype xsd:string
] .
```

---

## Complex Path Combinations

### Sequence + Inverse

```turtle
# Siblings (share a parent)
sh:property [
    sh:path ( ex:parent [ sh:inversePath ex:parent ] ) ;
    sh:class ex:Person
] .
```

### Alternative + Inverse

```turtle
# Related resources in either direction
sh:property [
    sh:path [
        sh:alternativePath (
            ex:relatedTo
            [ sh:inversePath ex:relatedTo ]
        )
    ] ;
    sh:nodeKind sh:IRI
] .
```

### Transitive + Sequence

```turtle
# All descendant names
sh:property [
    sh:path ( [ sh:oneOrMorePath [ sh:inversePath ex:parent ] ] ex:name ) ;
    sh:datatype xsd:string
] .
```

---

## Common Patterns

### Label Resolution

```turtle
# Any standard label property
ex:LabelPath a sh:PropertyShape ;
    sh:path [
        sh:alternativePath (
            rdfs:label
            skos:prefLabel
            dcterms:title
            schema:name
            foaf:name
        )
    ] ;
    sh:minCount 1 ;
    sh:message "Resource must have a label" .
```

### Type Hierarchy

```turtle
# All types including inherited
sh:property [
    sh:path ( rdf:type [ sh:zeroOrMorePath rdfs:subClassOf ] ) ;
    sh:hasValue ex:Agent
] .
```

### Part-Whole Relationships

```turtle
# All components (recursive)
sh:property [
    sh:path [ sh:oneOrMorePath ex:hasPart ] ;
    sh:class ex:Component ;
    sh:message "All parts must be Components"
] .
```

### Organizational Hierarchy

```turtle
# All reports (direct and indirect)
sh:property [
    sh:path [ sh:oneOrMorePath [ sh:inversePath ex:reportsTo ] ] ;
    sh:class ex:Employee
] .
```

### SKOS Broader/Narrower

```turtle
# All broader concepts
sh:property [
    sh:path [ sh:oneOrMorePath skos:broader ] ;
    sh:class skos:Concept
] .

# Sibling concepts
sh:property [
    sh:path ( skos:broader [ sh:inversePath skos:broader ] ) ;
    sh:class skos:Concept
] .
```

---

## Path Syntax Reference

| Path Type | Turtle Syntax | Description |
|-----------|---------------|-------------|
| Predicate | `sh:path ex:prop` | Direct property |
| Sequence | `sh:path ( ex:a ex:b )` | a then b |
| Alternative | `sh:path [ sh:alternativePath ( ex:a ex:b ) ]` | a or b |
| Inverse | `sh:path [ sh:inversePath ex:prop ]` | Reverse direction |
| Zero-or-more | `sh:path [ sh:zeroOrMorePath ex:prop ]` | * (0+) |
| One-or-more | `sh:path [ sh:oneOrMorePath ex:prop ]` | + (1+) |
| Zero-or-one | `sh:path [ sh:zeroOrOnePath ex:prop ]` | ? (0-1) |

---

## Comparison with SPARQL Paths

| SPARQL | SHACL |
|--------|-------|
| `ex:a/ex:b` | `( ex:a ex:b )` |
| `ex:a\|ex:b` | `[ sh:alternativePath ( ex:a ex:b ) ]` |
| `^ex:a` | `[ sh:inversePath ex:a ]` |
| `ex:a*` | `[ sh:zeroOrMorePath ex:a ]` |
| `ex:a+` | `[ sh:oneOrMorePath ex:a ]` |
| `ex:a?` | `[ sh:zeroOrOnePath ex:a ]` |

---

## Performance Considerations

### Recursive Paths Can Be Expensive

```turtle
# CAUTION: Can be slow on large graphs
sh:property [
    sh:path [ sh:zeroOrMorePath ex:linkedTo ] ;
    sh:maxCount 1000
] .
```

### Prefer Bounded Paths

```turtle
# Better: Explicit depth
sh:property [
    sh:path ( ex:parent ex:parent ex:parent ) ;  # Max 3 levels
    sh:class ex:Person
] .
```

### Consider Materialization

For frequently validated hierarchies, consider materializing transitive closures:

```sparql
# Pre-compute ancestors
INSERT {
    ?person ex:ancestor ?ancestor .
}
WHERE {
    ?person ex:parent+ ?ancestor .
}
```

Then validate against the materialized property:

```turtle
sh:property [
    sh:path ex:ancestor ;  # Pre-computed
    sh:class ex:Person
] .
```

---

## Limitations

1. **No negated property sets**: Unlike SPARQL, SHACL doesn't support `!(ex:a|ex:b)`
2. **No counted repetition**: No `{n,m}` quantifiers
3. **No variable paths**: Cannot use variables in paths
4. **Intermediate nodes not accessible**: Can't constrain nodes along the path

### Workaround: SPARQL Constraints

For complex path logic, use SPARQL-based constraints:

```turtle
ex:ComplexPathConstraint a sh:SPARQLConstraint ;
    sh:message "Complex path validation failed" ;
    sh:select """
        SELECT $this
        WHERE {
            $this ex:a/ex:b ?intermediate .
            ?intermediate ex:c ?value .
            FILTER (?value < 0)
        }
    """ .
```

---

## Complete Example

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.org/> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;

    # Direct property
    sh:property [
        sh:path ex:name ;
        sh:minCount 1 ;
        sh:datatype xsd:string
    ] ;

    # Alternative labels
    sh:property [
        sh:path [ sh:alternativePath ( rdfs:label skos:prefLabel ) ] ;
        sh:minCount 1 ;
        sh:message "Must have label or prefLabel"
    ] ;

    # Parent's employer
    sh:property [
        sh:path ( ex:parent ex:employer ) ;
        sh:class ex:Organization ;
        sh:message "Parent's employer must be an Organization"
    ] ;

    # All ancestors must be persons
    sh:property [
        sh:path [ sh:oneOrMorePath ex:parent ] ;
        sh:class ex:Person ;
        sh:message "All ancestors must be Persons"
    ] ;

    # Children (inverse)
    sh:property [
        sh:path [ sh:inversePath ex:parent ] ;
        sh:class ex:Person ;
        sh:message "Children must be Persons"
    ] .
```
