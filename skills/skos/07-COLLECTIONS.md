# SKOS Collections

> "Collections group concepts without imposing hierarchy—a flexible organizational layer for navigation and presentation."

---

## Understanding Collections

SKOS Collections provide a way to group concepts together without hierarchical implications. Unlike `skos:broader/narrower`, collection membership doesn't imply semantic generalization.

### Use Cases

- **Faceted navigation** — Group concepts by facet (color, size, material)
- **Guide terms** — Non-hierarchical groupings in thesauri
- **Presentation order** — Control display sequence
- **Node labels** — ISO 25964 "node labels" for hierarchy groupings

---

## Collection Types

### skos:Collection

Unordered grouping of concepts:

```turtle
ex:PrimaryColors a skos:Collection ;
    skos:prefLabel "Primary Colors"@en ;
    skos:member ex:Red ;
    skos:member ex:Blue ;
    skos:member ex:Yellow .
```

### skos:OrderedCollection

Sequence-significant grouping:

```turtle
ex:RainbowColors a skos:OrderedCollection ;
    skos:prefLabel "Rainbow Colors"@en ;
    skos:memberList (
        ex:Red
        ex:Orange
        ex:Yellow
        ex:Green
        ex:Blue
        ex:Indigo
        ex:Violet
    ) .
```

---

## Basic Collection Patterns

### Simple Collection

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix ex: <http://example.org/> .

ex:DomesticAnimals a skos:Collection ;
    skos:prefLabel "Domestic Animals"@en ;
    skos:prefLabel "Haustiere"@de ;
    skos:definition "Animals commonly kept as pets or on farms"@en ;
    skos:member ex:Cat ;
    skos:member ex:Dog ;
    skos:member ex:Horse ;
    skos:member ex:Chicken ;
    skos:member ex:Cow .
```

### Collection with Documentation

```turtle
ex:SustainableMaterials a skos:Collection ;
    skos:prefLabel "Sustainable Materials"@en ;
    skos:definition "Materials with low environmental impact"@en ;
    skos:scopeNote "Use for grouping eco-friendly product materials"@en ;
    skos:editorialNote "Review annually for new materials"@en ;
    skos:member ex:Bamboo ;
    skos:member ex:RecycledPlastic ;
    skos:member ex:OrganicCotton ;
    skos:member ex:Hemp ;
    skos:member ex:Cork .
```

---

## Ordered Collections

### Using memberList

```turtle
ex:SeverityLevels a skos:OrderedCollection ;
    skos:prefLabel "Severity Levels"@en ;
    skos:memberList (
        ex:Critical
        ex:High
        ex:Medium
        ex:Low
        ex:Info
    ) .
```

The RDF list preserves order, essential for:
- Dropdown menus
- Priority rankings
- Sequential processes
- Alphabetical listings

### Order Matters

```turtle
# Workflow stages in sequence
ex:DocumentWorkflow a skos:OrderedCollection ;
    skos:prefLabel "Document Workflow Stages"@en ;
    skos:memberList (
        ex:Draft
        ex:InReview
        ex:Approved
        ex:Published
        ex:Archived
    ) .

# Size scale
ex:ClothingSizes a skos:OrderedCollection ;
    skos:prefLabel "Clothing Sizes"@en ;
    skos:memberList (
        ex:XS
        ex:S
        ex:M
        ex:L
        ex:XL
        ex:XXL
    ) .
```

---

## Nested Collections

Collections can contain other collections:

```turtle
ex:AllColors a skos:Collection ;
    skos:prefLabel "All Colors"@en ;
    skos:member ex:PrimaryColors ;      # Collection
    skos:member ex:SecondaryColors ;    # Collection
    skos:member ex:NeutralColors .      # Collection

ex:PrimaryColors a skos:Collection ;
    skos:prefLabel "Primary Colors"@en ;
    skos:member ex:Red ;
    skos:member ex:Blue ;
    skos:member ex:Yellow .

ex:SecondaryColors a skos:Collection ;
    skos:prefLabel "Secondary Colors"@en ;
    skos:member ex:Green ;
    skos:member ex:Orange ;
    skos:member ex:Purple .
```

---

## Collections vs Concepts

### Key Differences

| Aspect | skos:Concept | skos:Collection |
|--------|--------------|-----------------|
| Purpose | Unit of thought | Grouping mechanism |
| Semantic relations | broader/narrower/related | Not applicable |
| Member of schemes | Yes (inScheme) | Optional |
| Contains | Nothing | Concepts or collections |

### Collections Are NOT Concepts

```turtle
# INCORRECT - Collection used as concept
ex:PrimaryColors a skos:Collection ;
    skos:broader ex:Colors .  # Collections don't have broader!

# CORRECT - Use a concept for hierarchy
ex:PrimaryColor a skos:Concept ;
    skos:prefLabel "Primary Color"@en ;
    skos:broader ex:Color ;
    skos:narrower ex:Red, ex:Blue, ex:Yellow .
```

### When to Use Each

**Use skos:Concept when:**
- Term represents a unit of thought
- Term participates in hierarchical relations
- Term can be used to classify/tag resources

**Use skos:Collection when:**
- Grouping is for navigation/presentation
- No hierarchical implication intended
- Order might matter
- Creating facet groupings

---

## Faceted Classification with Collections

### Product Facets Example

```turtle
# Facet groupings
ex:ColorFacet a skos:Collection ;
    skos:prefLabel "Available Colors"@en ;
    skos:member ex:Black, ex:White, ex:Red, ex:Blue .

ex:SizeFacet a skos:Collection ;
    skos:prefLabel "Available Sizes"@en ;
    skos:member ex:Small, ex:Medium, ex:Large .

ex:MaterialFacet a skos:Collection ;
    skos:prefLabel "Materials"@en ;
    skos:member ex:Cotton, ex:Polyester, ex:Wool .

# Master facet collection
ex:ProductFacets a skos:Collection ;
    skos:prefLabel "Product Facets"@en ;
    skos:member ex:ColorFacet ;
    skos:member ex:SizeFacet ;
    skos:member ex:MaterialFacet .
```

---

## ISO 25964 Node Labels

In thesaurus standards, "node labels" group terms without being terms themselves:

```turtle
# Node label as collection
ex:TypesOfBuildings a skos:Collection ;
    skos:prefLabel "<Types of Buildings>"@en ;  # Angle brackets indicate node label
    skos:member ex:House ;
    skos:member ex:Apartment ;
    skos:member ex:Office ;
    skos:member ex:Factory .

# The collection is NOT a concept
# It just organizes the display hierarchy
```

---

## SPARQL Patterns

### Get All Collections

```sparql
SELECT ?collection ?label (COUNT(?member) AS ?memberCount)
WHERE {
    { ?collection a skos:Collection }
    UNION
    { ?collection a skos:OrderedCollection }

    ?collection skos:prefLabel ?label .
    OPTIONAL { ?collection skos:member ?member }

    FILTER (lang(?label) = "en")
}
GROUP BY ?collection ?label
ORDER BY ?label
```

### Get Collection Members

```sparql
SELECT ?collection ?member ?memberLabel
WHERE {
    ?collection skos:prefLabel "Primary Colors"@en ;
                skos:member ?member .
    ?member skos:prefLabel ?memberLabel .
    FILTER (lang(?memberLabel) = "en")
}
```

### Get Ordered Collection with Position

```sparql
SELECT ?collection ?member ?memberLabel ?position
WHERE {
    ?collection a skos:OrderedCollection ;
                skos:prefLabel ?collLabel ;
                skos:memberList ?list .

    ?list rdf:rest*/rdf:first ?member .

    # Calculate position
    {
        SELECT ?list ?member (COUNT(?mid) AS ?position)
        WHERE {
            ?list rdf:rest* ?mid .
            ?mid rdf:rest*/rdf:first ?member .
        }
        GROUP BY ?list ?member
    }

    ?member skos:prefLabel ?memberLabel .
    FILTER (lang(?memberLabel) = "en")
}
ORDER BY ?position
```

### Find Nested Collections

```sparql
SELECT ?parent ?child ?depth
WHERE {
    ?parent a skos:Collection ;
            skos:member+ ?child .
    ?child a skos:Collection .

    {
        SELECT ?parent ?child (COUNT(?mid) AS ?depth)
        WHERE {
            ?parent skos:member* ?mid .
            ?mid skos:member ?child .
            ?child a skos:Collection .
        }
        GROUP BY ?parent ?child
    }
}
```

---

## SHACL Validation

```turtle
ex:CollectionShape a sh:NodeShape ;
    sh:targetClass skos:Collection ;

    # Must have a label
    sh:property [
        sh:path skos:prefLabel ;
        sh:minCount 1 ;
        sh:message "Collection must have a preferred label"
    ] ;

    # Must have members
    sh:property [
        sh:path skos:member ;
        sh:minCount 1 ;
        sh:message "Collection must have at least one member"
    ] ;

    # Members must be concepts or collections
    sh:property [
        sh:path skos:member ;
        sh:or (
            [ sh:class skos:Concept ]
            [ sh:class skos:Collection ]
        ) ;
        sh:message "Members must be Concepts or Collections"
    ] .

ex:OrderedCollectionShape a sh:NodeShape ;
    sh:targetClass skos:OrderedCollection ;

    # Must have memberList (not member)
    sh:property [
        sh:path skos:memberList ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:message "OrderedCollection must have exactly one memberList"
    ] ;

    # Should not use unordered member
    sh:property [
        sh:path skos:member ;
        sh:maxCount 0 ;
        sh:severity sh:Warning ;
        sh:message "OrderedCollection should use memberList, not member"
    ] .
```

---

## Best Practices

1. **Don't use collections for hierarchy** — Use concepts with broader/narrower
2. **Label collections clearly** — Indicate they're groupings
3. **Use ordered collections when order matters** — Rankings, sequences
4. **Avoid deep nesting** — Keep collection hierarchies shallow
5. **Document purpose** — Explain why concepts are grouped
6. **Consider performance** — Large RDF lists can be slow to query
7. **Distinguish from concepts** — Collections organize; concepts mean
