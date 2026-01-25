# Semantic Relations in SKOS

> "SKOS uses a 'bottom-up' approach where subordinate concepts point upward via skos:broader, enabling efficient transitive traversal."

---

## Overview of Semantic Relations

SKOS defines two types of semantic relations between concepts:

1. **Hierarchical** — Broader/narrower (parent/child)
2. **Associative** — Related (non-hierarchical connection)

All semantic relations have `skos:Concept` as both domain and range.

---

## Hierarchical Relations

### skos:broader / skos:narrower

These are **inverse properties** expressing hierarchical relationships:

```turtle
# Bottom-up (recommended primary direction)
ex:Cat skos:broader ex:Mammal .

# Top-down (implied by inverse)
ex:Mammal skos:narrower ex:Cat .
```

### Design Philosophy

Cagle emphasizes the "bottom-up" approach:

> "SKOS is a 'bottom-up' framework where subordinate concepts initiate relationships upward toward superordinate ones."

**Why bottom-up?**
- Efficient transitive closure queries
- Natural direction for classification
- Easier maintenance (leaf concepts point to parents)

### Non-Transitivity by Design

`skos:broader` and `skos:narrower` are **NOT transitive**:

```turtle
ex:Siamese skos:broader ex:Cat .
ex:Cat skos:broader ex:Mammal .

# This does NOT imply:
# ex:Siamese skos:broader ex:Mammal .
```

**Why non-transitive?**
- Different KOS types have different transitivity semantics
- Explicit control over hierarchical assertions
- Cleaner data management

---

## Transitive Variants

For query expansion and inference, use the transitive properties:

### skos:broaderTransitive / skos:narrowerTransitive

```turtle
# These ARE transitive
ex:Siamese skos:broaderTransitive ex:Cat .
ex:Cat skos:broaderTransitive ex:Mammal .

# This IS implied:
ex:Siamese skos:broaderTransitive ex:Mammal .
```

### Important Distinctions

| Property | Transitive | Assert? | Use For |
|----------|------------|---------|---------|
| `skos:broader` | No | Yes | Direct parent |
| `skos:broaderTransitive` | Yes | No* | Query/inference |
| `skos:narrower` | No | Yes | Direct children |
| `skos:narrowerTransitive` | Yes | No* | Query/inference |

*The transitive properties are typically inferred, not asserted directly.

### SPARQL for Transitive Closure

Without reasoning support, use property paths:

```sparql
# All ancestors of a concept
SELECT ?ancestor ?label
WHERE {
    ex:Siamese skos:broader+ ?ancestor .
    ?ancestor skos:prefLabel ?label .
}

# All descendants of a concept
SELECT ?descendant ?label
WHERE {
    ?descendant skos:broader+ ex:Mammal .
    ?descendant skos:prefLabel ?label .
}
```

---

## Associative Relations

### skos:related

For non-hierarchical connections between concepts:

```turtle
ex:Cat skos:related ex:Dog .
ex:Coffee skos:related ex:Tea .
ex:Painting skos:related ex:Artist .
```

### Properties of skos:related

- **Symmetric**: `A related B` implies `B related A`
- **Non-transitive**: `A related B` and `B related C` does NOT imply `A related C`
- **Disjoint from hierarchy**: Cannot be both `broader` and `related`

### Symmetry in Practice

```turtle
# Only need to assert one direction
ex:Cat skos:related ex:Dog .

# This is implied (symmetric):
ex:Dog skos:related ex:Cat .
```

### Related vs Broader

The SKOS Reference defines an integrity constraint:

```
skos:related is disjoint with skos:broaderTransitive
```

This means concepts cannot be both hierarchically and associatively related:

```turtle
# INVALID - integrity violation
ex:Cat skos:broader ex:Mammal ;
       skos:related ex:Mammal .  # Cannot be both!
```

---

## Semantic Relation Hierarchy

All semantic relation properties derive from `skos:semanticRelation`:

```
skos:semanticRelation
├── skos:broader
│   └── skos:broaderTransitive
├── skos:narrower
│   └── skos:narrowerTransitive
└── skos:related
```

### Using the Parent Property

```sparql
# Find all semantically related concepts
SELECT ?concept ?relation ?target
WHERE {
    ?concept skos:semanticRelation ?target .
    BIND (
        IF(EXISTS { ?concept skos:broader ?target }, "broader",
        IF(EXISTS { ?concept skos:narrower ?target }, "narrower",
        "related"))
    AS ?relation)
}
```

---

## Hierarchical Relationship Types

ISO 25964 distinguishes three types of hierarchical relationships:

### Generic (Genus-Species)

The subordinate is a "kind of" the superordinate:

```turtle
ex:Siamese skos:broader ex:Cat .  # A Siamese IS A kind of Cat
ex:Cat skos:broader ex:Mammal .   # A Cat IS A kind of Mammal
```

### Partitive (Whole-Part)

The subordinate is a "part of" the superordinate:

```turtle
ex:Engine skos:broader ex:Car .     # Engine is PART OF Car
ex:Chapter skos:broader ex:Book .   # Chapter is PART OF Book
```

### Instance (Class-Instance)

The subordinate is an instance of the superordinate:

```turtle
ex:MountEverest skos:broader ex:Mountain .  # Everest is AN INSTANCE OF Mountain
ex:Paris skos:broader ex:City .             # Paris is AN INSTANCE OF City
```

### Modeling Relationship Types

SKOS doesn't distinguish these natively. Use extensions:

```turtle
@prefix iso: <http://example.org/iso25964#> .

iso:broaderGeneric rdfs:subPropertyOf skos:broader .
iso:broaderPartitive rdfs:subPropertyOf skos:broader .
iso:broaderInstantial rdfs:subPropertyOf skos:broader .

ex:Siamese iso:broaderGeneric ex:Cat .
ex:Engine iso:broaderPartitive ex:Car .
ex:MountEverest iso:broaderInstantial ex:Mountain .
```

---

## Common Patterns

### Linear Hierarchy

```turtle
ex:GamingLaptop skos:broader ex:Laptop .
ex:Laptop skos:broader ex:Computer .
ex:Computer skos:broader ex:Electronics .
ex:Electronics skos:broader ex:Products .
```

### Polyhierarchy (Multiple Parents)

```turtle
# Tomato belongs to both Fruit and Vegetable
ex:Tomato skos:broader ex:Fruit .
ex:Tomato skos:broader ex:Vegetable .
```

### Sibling Relationships via Related

```turtle
# Alternative approach for associating siblings
ex:Cat skos:related ex:Dog .
ex:Cat skos:related ex:Horse .
ex:Dog skos:related ex:Horse .
```

### Hub Concept Pattern

```turtle
# Central concept with many relations
ex:Climate a skos:Concept ;
    skos:related ex:Weather ;
    skos:related ex:Temperature ;
    skos:related ex:Precipitation ;
    skos:related ex:Atmosphere ;
    skos:related ex:Season .
```

---

## SPARQL Patterns for Relations

### Get Full Hierarchy

```sparql
SELECT ?concept ?label ?depth
WHERE {
    ?concept skos:inScheme ex:ProductTaxonomy ;
             skos:prefLabel ?label .

    {
        SELECT ?concept (COUNT(?ancestor) AS ?depth)
        WHERE {
            ?concept skos:broader* ?ancestor .
            ?ancestor skos:inScheme ex:ProductTaxonomy .
        }
        GROUP BY ?concept
    }
}
ORDER BY ?depth ?label
```

### Find All Related Concepts

```sparql
SELECT ?concept ?relatedConcept ?relatedLabel
WHERE {
    ?concept skos:inScheme ex:ProductTaxonomy ;
             skos:related ?relatedConcept .
    ?relatedConcept skos:prefLabel ?relatedLabel .
}
```

### Build Breadcrumb Path

```sparql
SELECT ?concept ?path
WHERE {
    ?concept skos:inScheme ex:ProductTaxonomy .

    {
        SELECT ?concept (GROUP_CONCAT(?ancestorLabel; separator=" > ") AS ?path)
        WHERE {
            ?concept skos:broader* ?ancestor .
            ?ancestor skos:prefLabel ?ancestorLabel .
            FILTER (lang(?ancestorLabel) = "en")
        }
        GROUP BY ?concept
    }
}
```

### Count Children

```sparql
SELECT ?concept ?label (COUNT(?child) AS ?childCount)
WHERE {
    ?concept skos:inScheme ex:ProductTaxonomy ;
             skos:prefLabel ?label .
    OPTIONAL { ?concept skos:narrower ?child }
}
GROUP BY ?concept ?label
ORDER BY DESC(?childCount)
```

---

## SHACL Validation

### Hierarchy Integrity

```turtle
ex:HierarchyShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;

    # Broader must be a concept
    sh:property [
        sh:path skos:broader ;
        sh:class skos:Concept ;
        sh:message "Broader must reference a SKOS Concept"
    ] ;

    # No self-reference
    sh:sparql [
        sh:message "Concept cannot be broader than itself" ;
        sh:select """
            SELECT $this WHERE {
                $this skos:broader $this .
            }
        """
    ] ;

    # No cycles
    sh:sparql [
        sh:message "Circular hierarchy detected" ;
        sh:select """
            SELECT $this WHERE {
                $this skos:broader+ $this .
            }
        """
    ] ;

    # Broader must be in same scheme
    sh:sparql [
        sh:message "Broader concept must be in the same scheme" ;
        sh:select """
            SELECT $this ?broader
            WHERE {
                $this skos:broader ?broader ;
                      skos:inScheme ?scheme .
                FILTER NOT EXISTS { ?broader skos:inScheme ?scheme }
            }
        """
    ] .
```

### Disjointness Validation

```turtle
ex:RelationDisjointnessShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;

    # Cannot be both broader and related
    sh:sparql [
        sh:message "Concept cannot be both hierarchically and associatively related" ;
        sh:select """
            SELECT $this ?other
            WHERE {
                $this skos:broader+ ?other .
                $this skos:related ?other .
            }
        """
    ] .
```

---

## Best Practices

1. **Assert direct relations only** — Let inference handle transitive closure
2. **Use bottom-up direction** — Primary assertions via `skos:broader`
3. **Avoid deep hierarchies** — Flatten when possible (5-7 levels max)
4. **Document relationship types** — Use extensions for genus/part/instance
5. **Validate cycles** — Circular hierarchies indicate data errors
6. **Be consistent** — Choose one primary direction for assertions
