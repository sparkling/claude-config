# SKOS Best Practices

> "Good taxonomies are built incrementally, validated continuously, and maintained thoughtfully."

---

## Design Principles

### 1. Separate Concepts from Instances

> "Taxonomies can, at their core, be considered lists of concepts or categories, whereas instance data are lists of things." — Cagle

```turtle
# CORRECT: Taxonomy layer
ex:Laptop a skos:Concept ;
    skos:prefLabel "Laptop"@en ;
    skos:inScheme ex:ProductTaxonomy .

# CORRECT: Instance layer
ex:MacBookPro16 a ex:Product ;
    ex:category ex:Laptop ;
    ex:price 2499.00 .
```

**Don't mix:**
```turtle
# AVOID: Concept used as instance
ex:MacBookPro16 a skos:Concept ;  # This is a product, not a concept!
    skos:prefLabel "MacBook Pro 16"@en .
```

### 2. Use Named Graphs for Separation

```turtle
# Taxonomy graph
GRAPH <http://example.org/graphs/taxonomy> {
    ex:ProductTaxonomy a skos:ConceptScheme .
    ex:Electronics a skos:Concept .
    ex:Laptops a skos:Concept .
}

# Instance graph
GRAPH <http://example.org/graphs/products> {
    ex:Product123 a ex:Product ;
        ex:category ex:Laptops .
}
```

### 3. Design for Humans First

- Labels should be readable and meaningful
- Definitions should be self-contained
- Hierarchy should reflect natural understanding
- Avoid technical jargon in user-facing labels

---

## Labeling Best Practices

### One Preferred Label per Language

```turtle
# CORRECT
ex:Cat skos:prefLabel "Cat"@en ;
       skos:prefLabel "Katze"@de ;
       skos:altLabel "Feline"@en .

# WRONG: Multiple English prefLabels
ex:Cat skos:prefLabel "Cat"@en ;
       skos:prefLabel "Feline"@en .  # Should be altLabel!
```

### Use Language Tags Consistently

```turtle
# Always include language tags
ex:Concept skos:prefLabel "Label"@en .      # Good
ex:Concept skos:prefLabel "Label" .          # Acceptable but less precise
```

### Capture Synonyms and Variants

```turtle
ex:UnitedStates a skos:Concept ;
    skos:prefLabel "United States of America"@en ;
    skos:altLabel "USA"@en ;
    skos:altLabel "US"@en ;
    skos:altLabel "America"@en ;
    skos:altLabel "The States"@en ;
    skos:hiddenLabel "Unites States"@en .  # Misspelling for search
```

### Avoid Ambiguous Labels

```turtle
# PROBLEMATIC: "Mercury" is ambiguous
ex:Mercury skos:prefLabel "Mercury"@en .

# BETTER: Add disambiguation
ex:MercuryPlanet skos:prefLabel "Mercury (planet)"@en ;
    skos:altLabel "Mercury"@en .

ex:MercuryElement skos:prefLabel "Mercury (element)"@en ;
    skos:altLabel "Mercury"@en ;
    skos:altLabel "Quicksilver"@en .
```

---

## Hierarchy Best Practices

### Keep Hierarchies Manageable

- **5-7 levels maximum** — Deep hierarchies are hard to navigate
- **Flatten when possible** — Use properties instead of deep nesting
- **Balance breadth and depth** — Neither too flat nor too deep

### Consistent Hierarchy Types

Pick one primary hierarchy type and stick to it:

```turtle
# Generic (IS-A) - Most common
ex:Cat skos:broader ex:Mammal .  # Cat IS A Mammal

# Partitive (PART-OF) - Separate scheme recommended
ex:Engine skos:broader ex:Car .  # Engine is PART OF Car

# Don't mix without clear documentation
```

### Avoid Cycles

```sparql
# Validate: No concept should be its own ancestor
SELECT ?concept WHERE {
    ?concept skos:broader+ ?concept .
}
```

### Top Concepts Should Be Comprehensive

```turtle
# Good: Top concepts cover the domain
ex:ProductTaxonomy skos:hasTopConcept
    ex:Electronics,
    ex:Clothing,
    ex:Food,
    ex:HomeAndGarden .

# Each category should be distinct and comprehensive
```

---

## Documentation Best Practices

### Provide Definitions for All Concepts

```turtle
ex:MachineLearning a skos:Concept ;
    skos:prefLabel "Machine Learning"@en ;
    skos:definition """A subset of artificial intelligence that enables
        systems to learn and improve from experience without being
        explicitly programmed."""@en .
```

### Use Scope Notes for Classification Guidance

```turtle
ex:Cat a skos:Concept ;
    skos:prefLabel "Cat"@en ;
    skos:scopeNote """Use for domestic cats (Felis catus).
        For wild cats, use 'Felidae'.
        For big cats (lions, tigers), use 'Panthera'."""@en .
```

### Document Changes

```turtle
ex:CloudComputing a skos:Concept ;
    skos:changeNote "2020-01: Concept created"@en ;
    skos:changeNote "2021-06: Added SaaS, PaaS, IaaS as narrower"@en ;
    skos:changeNote "2023-09: Updated definition for edge computing"@en .
```

---

## Mapping Best Practices

### Map to Authoritative Sources

```turtle
ex:Cat skos:exactMatch <http://www.wikidata.org/entity/Q146> ;
       skos:exactMatch <http://dbpedia.org/resource/Cat> ;
       skos:closeMatch <http://id.loc.gov/authorities/subjects/sh85021262> .
```

### Use Appropriate Match Types

| Scenario | Use |
|----------|-----|
| Concepts are interchangeable | `skos:exactMatch` |
| Similar but differences exist | `skos:closeMatch` |
| External is more general | `skos:broadMatch` |
| External is more specific | `skos:narrowMatch` |
| Non-hierarchical relation | `skos:relatedMatch` |

### Be Cautious with exactMatch

`skos:exactMatch` is **transitive**—chains propagate:

```turtle
# If A exactMatch B and B exactMatch C, then A exactMatch C
# Only use when truly equivalent
```

---

## Versioning Best Practices

### Use Deprecation, Not Deletion

```turtle
ex:OldTerm a skos:Concept ;
    skos:prefLabel "Old Term"@en ;
    tax:status tax:Deprecated ;
    dct:isReplacedBy ex:NewTerm ;
    skos:changeNote "Deprecated 2024-01: Use 'New Term'"@en .
```

### Version Schemes

```turtle
ex:ProductTaxonomy_v2 a skos:ConceptScheme ;
    owl:versionInfo "2.0" ;
    dct:issued "2024-01-01"^^xsd:date ;
    dct:replaces ex:ProductTaxonomy_v1 .
```

### Track Modification Dates

```turtle
ex:Concept dct:created "2020-01-15"^^xsd:date ;
           dct:modified "2024-06-20"^^xsd:date .
```

---

## Validation Best Practices

### Use SHACL for Data Quality

```turtle
ex:ConceptShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;

    sh:property [
        sh:path skos:prefLabel ;
        sh:minCount 1 ;
        sh:uniqueLang true
    ] ;

    sh:property [
        sh:path skos:inScheme ;
        sh:minCount 1 ;
        sh:class skos:ConceptScheme
    ] .
```

### Regular Quality Checks

Run these queries periodically:

1. **Missing labels** — Concepts without prefLabel
2. **Missing scheme** — Concepts without inScheme
3. **Orphan concepts** — No broader and not top concept
4. **Circular hierarchies** — Self-referential broader paths
5. **Duplicate labels** — Same prefLabel in scheme

---

## Performance Best Practices

### Index Labels for Search

Most triplestores support full-text indexes:

```sparql
# Use text index instead of FILTER with CONTAINS
?concept text:query "laptop" .  # Fast
# vs
FILTER(CONTAINS(LCASE(?label), "laptop"))  # Slow
```

### Cache Taxonomy Queries

Taxonomies change infrequently—cache:
- Hierarchy trees
- Label lookups
- Top concept lists

### Use LIMIT for Exploration

```sparql
SELECT ?concept ?label
WHERE {
    ?concept a skos:Concept ;
             skos:prefLabel ?label .
}
LIMIT 100  # Don't retrieve everything
```

---

## Common Anti-Patterns

### 1. Using Concepts as Instances

```turtle
# WRONG
ex:JohnSmith a skos:Concept ;
    skos:prefLabel "John Smith"@en .

# RIGHT
ex:JohnSmith a foaf:Person ;
    foaf:name "John Smith" .
```

### 2. Over-Deep Hierarchies

```turtle
# PROBLEMATIC: 10+ levels deep
ex:Thing > ex:Object > ex:Product > ex:Electronics > ex:Computer >
ex:PersonalComputer > ex:Laptop > ex:GamingLaptop > ex:HighEndGamingLaptop >
ex:RTX4090GamingLaptop > ex:RTX4090GamingLaptopBlack

# BETTER: Flatten with properties
ex:GamingLaptop a skos:Concept .
ex:Product123 ex:category ex:GamingLaptop ;
              ex:gpu "RTX4090" ;
              ex:color "Black" .
```

### 3. Ignoring Multilingual Needs

```turtle
# PROBLEMATIC: English-only, no language tags
ex:Concept skos:prefLabel "Label" .

# BETTER: Explicit language tags, multiple languages
ex:Concept skos:prefLabel "Label"@en ;
           skos:prefLabel "Bezeichnung"@de .
```

### 4. Mixing Hierarchy Types

```turtle
# CONFUSING: Generic and partitive mixed
ex:Car skos:broader ex:Vehicle .          # Generic: Car IS A Vehicle
ex:Wheel skos:broader ex:Car .            # Partitive: Wheel PART OF Car
ex:RubberWheel skos:broader ex:Wheel .    # Generic: RubberWheel IS A Wheel

# BETTER: Separate schemes or clear documentation
```

### 5. Not Validating Data

Always validate with SHACL before publishing.

---

## Checklist for New Taxonomies

- [ ] Clear scope and purpose documented
- [ ] Concept scheme defined with metadata
- [ ] Top concepts identified
- [ ] Every concept has prefLabel
- [ ] Every concept has inScheme
- [ ] Definitions for all concepts
- [ ] Scope notes for ambiguous concepts
- [ ] Hierarchy is cycle-free
- [ ] Maximum depth is reasonable
- [ ] Mappings to external vocabularies
- [ ] SHACL shapes for validation
- [ ] Versioning strategy defined
- [ ] Change management process in place
