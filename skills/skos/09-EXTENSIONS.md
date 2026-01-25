# Extending SKOS: Cagle's tax: Namespace

> "SKOS provides the foundation, but real-world taxonomies need more—lifecycle status, hierarchy levels, ordering, and relationships SKOS doesn't cover."

---

## Why Extend SKOS?

Core SKOS covers semantic relations and labeling but lacks:

- **Hierarchy level** — Distance from root concept
- **Lifecycle status** — Active, deprecated, proposed
- **Sort order** — UI presentation and feature weighting
- **Antonyms** — Opposition relationships
- **Custom relations** — Domain-specific connections

Cagle proposes a `tax:` (taxonomy) namespace for these extensions.

---

## The tax: Namespace

```turtle
@prefix tax: <http://example.org/taxonomy#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
```

---

## Hierarchy Level (tax:level)

Track each concept's depth in the hierarchy:

### Definition

```turtle
tax:level a owl:DatatypeProperty ;
    rdfs:label "Hierarchy Level"@en ;
    rdfs:comment "Distance from root concept (0 = top concept)"@en ;
    rdfs:domain skos:Concept ;
    rdfs:range xsd:nonNegativeInteger .
```

### Usage

```turtle
ex:Products a skos:Concept ;
    skos:prefLabel "Products"@en ;
    skos:topConceptOf ex:ProductTaxonomy ;
    tax:level 0 .  # Root

ex:Electronics a skos:Concept ;
    skos:prefLabel "Electronics"@en ;
    skos:broader ex:Products ;
    tax:level 1 .

ex:Computers a skos:Concept ;
    skos:prefLabel "Computers"@en ;
    skos:broader ex:Electronics ;
    tax:level 2 .

ex:Laptops a skos:Concept ;
    skos:prefLabel "Laptops"@en ;
    skos:broader ex:Computers ;
    tax:level 3 .
```

### Use Cases

1. **Level-specific validation** — "Products can only reference level 3 concepts"
2. **Query optimization** — Filter by depth without traversing paths
3. **UI rendering** — Indentation based on level
4. **Feature engineering** — ML features from hierarchy depth

---

## Lifecycle Status (tax:status)

Track concept lifecycle:

### Definition

```turtle
tax:status a owl:ObjectProperty ;
    rdfs:label "Lifecycle Status"@en ;
    rdfs:comment "Current status of the concept in the taxonomy"@en ;
    rdfs:domain skos:Concept ;
    rdfs:range tax:Status .

tax:Status a owl:Class ;
    rdfs:label "Concept Status"@en .

# Status instances
tax:Active a tax:Status ;
    rdfs:label "Active"@en ;
    rdfs:comment "Concept is current and should be used"@en .

tax:Deprecated a tax:Status ;
    rdfs:label "Deprecated"@en ;
    rdfs:comment "Concept should no longer be used; see replacedBy"@en .

tax:Proposed a tax:Status ;
    rdfs:label "Proposed"@en ;
    rdfs:comment "Concept is under review, not yet approved"@en .

tax:Retired a tax:Status ;
    rdfs:label "Retired"@en ;
    rdfs:comment "Concept has been removed from active use"@en .
```

### Usage

```turtle
ex:CurrentTerm a skos:Concept ;
    skos:prefLabel "Laptop"@en ;
    tax:status tax:Active .

ex:OldTerm a skos:Concept ;
    skos:prefLabel "Notebook Computer"@en ;
    tax:status tax:Deprecated ;
    dct:isReplacedBy ex:CurrentTerm ;
    skos:changeNote "Deprecated 2024-01: Use 'Laptop' instead"@en .

ex:NewTerm a skos:Concept ;
    skos:prefLabel "AI Laptop"@en ;
    tax:status tax:Proposed ;
    skos:editorialNote "Under review by Taxonomy Committee"@en .
```

### Workflow Integration

```sparql
# Find all deprecated concepts needing migration
SELECT ?deprecated ?replacement ?label
WHERE {
    ?deprecated tax:status tax:Deprecated ;
                skos:prefLabel ?label ;
                dct:isReplacedBy ?replacement .
    FILTER (lang(?label) = "en")
}
```

---

## Sort Order (tax:sortOrder)

Control presentation and weighting:

### Definition

```turtle
tax:sortOrder a owl:DatatypeProperty ;
    rdfs:label "Sort Order"@en ;
    rdfs:comment "Numeric order for sorting among siblings"@en ;
    rdfs:domain skos:Concept ;
    rdfs:range xsd:integer .
```

### Usage

```turtle
ex:Red a skos:Concept ;
    skos:prefLabel "Red"@en ;
    skos:broader ex:PrimaryColors ;
    tax:sortOrder 1 .

ex:Blue a skos:Concept ;
    skos:prefLabel "Blue"@en ;
    skos:broader ex:PrimaryColors ;
    tax:sortOrder 2 .

ex:Yellow a skos:Concept ;
    skos:prefLabel "Yellow"@en ;
    skos:broader ex:PrimaryColors ;
    tax:sortOrder 3 .
```

### Feature Engineering (Cagle's Pattern)

Convert sort order to normalized weights:

```sparql
# Calculate normalized weight from sort order
SELECT ?concept ?label ?weight
WHERE {
    ?concept skos:broader ex:Colors ;
             skos:prefLabel ?label ;
             tax:sortOrder ?order .

    # Count siblings
    {
        SELECT (COUNT(?sibling) AS ?siblingCount)
        WHERE {
            ?sibling skos:broader ex:Colors .
        }
    }

    # Normalize: order / sibling count
    BIND (?order / ?siblingCount AS ?weight)
}
ORDER BY ?order
```

Result for 4 colors:
- sortOrder 1 → weight 0.25
- sortOrder 2 → weight 0.50
- sortOrder 3 → weight 0.75
- sortOrder 4 → weight 1.00

---

## Antonyms (tax:antonym)

Opposition relationships:

### Definition

```turtle
tax:antonym a owl:SymmetricProperty ;
    rdfs:label "Antonym"@en ;
    rdfs:comment "Indicates concepts with opposite meanings"@en ;
    rdfs:domain skos:Concept ;
    rdfs:range skos:Concept .
```

### Usage

```turtle
ex:Hot a skos:Concept ;
    skos:prefLabel "Hot"@en ;
    tax:antonym ex:Cold .

ex:Cold a skos:Concept ;
    skos:prefLabel "Cold"@en ;
    tax:antonym ex:Hot .  # Implied by symmetry

ex:Large a skos:Concept ;
    skos:prefLabel "Large"@en ;
    tax:antonym ex:Small .

ex:Active a skos:Concept ;
    skos:prefLabel "Active"@en ;
    tax:antonym ex:Inactive .
```

### Query for Antonym Pairs

```sparql
SELECT ?concept ?antonym ?conceptLabel ?antonymLabel
WHERE {
    ?concept tax:antonym ?antonym ;
             skos:prefLabel ?conceptLabel .
    ?antonym skos:prefLabel ?antonymLabel .
    FILTER (STR(?concept) < STR(?antonym))  # Avoid duplicates
    FILTER (lang(?conceptLabel) = "en" && lang(?antonymLabel) = "en")
}
```

---

## Custom Hierarchical Relations

Extend SKOS broader/narrower with specific relationship types:

### ISO 25964 Types

```turtle
# Generic (genus-species)
tax:broaderGeneric rdfs:subPropertyOf skos:broader ;
    rdfs:label "Broader (Generic)"@en ;
    rdfs:comment "Subordinate is a 'kind of' superordinate"@en .

# Partitive (whole-part)
tax:broaderPartitive rdfs:subPropertyOf skos:broader ;
    rdfs:label "Broader (Partitive)"@en ;
    rdfs:comment "Subordinate is a 'part of' superordinate"@en .

# Instance (class-instance)
tax:broaderInstantial rdfs:subPropertyOf skos:broader ;
    rdfs:label "Broader (Instantial)"@en ;
    rdfs:comment "Subordinate is an 'instance of' superordinate"@en .
```

### Usage

```turtle
# Generic: Cat is a kind of Mammal
ex:Cat tax:broaderGeneric ex:Mammal .

# Partitive: Engine is part of Car
ex:Engine tax:broaderPartitive ex:Car .

# Instantial: Everest is an instance of Mountain
ex:Everest tax:broaderInstantial ex:Mountain .
```

---

## Domain-Specific Extensions

### Product Taxonomy Example

```turtle
# Product-specific properties
tax:productLine a owl:ObjectProperty ;
    rdfs:domain skos:Concept ;
    rdfs:range tax:ProductLine .

tax:targetAudience a owl:ObjectProperty ;
    rdfs:domain skos:Concept ;
    rdfs:range tax:Audience .

tax:seasonality a owl:ObjectProperty ;
    rdfs:domain skos:Concept ;
    rdfs:range tax:Season .

# Usage
ex:WinterCoats a skos:Concept ;
    skos:prefLabel "Winter Coats"@en ;
    skos:broader ex:Outerwear ;
    tax:level 3 ;
    tax:status tax:Active ;
    tax:sortOrder 1 ;
    tax:seasonality tax:Winter ;
    tax:targetAudience tax:Adults .
```

### Scientific Taxonomy Example

```turtle
# Scientific classification properties
tax:scientificName a owl:DatatypeProperty ;
    rdfs:domain skos:Concept ;
    rdfs:range xsd:string .

tax:taxonomicRank a owl:ObjectProperty ;
    rdfs:domain skos:Concept ;
    rdfs:range tax:Rank .

# Ranks
tax:Kingdom a tax:Rank .
tax:Phylum a tax:Rank .
tax:Class a tax:Rank .
tax:Order a tax:Rank .
tax:Family a tax:Rank .
tax:Genus a tax:Rank .
tax:Species a tax:Rank .

# Usage
ex:FelisCatus a skos:Concept ;
    skos:prefLabel "Domestic Cat"@en ;
    tax:scientificName "Felis catus" ;
    tax:taxonomicRank tax:Species ;
    skos:broader ex:Felis .
```

---

## Complete Extended Example

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix tax: <http://example.org/taxonomy#> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix ex: <http://example.org/> .

# Scheme
ex:ColorTaxonomy a skos:ConceptScheme ;
    skos:prefLabel "Color Taxonomy"@en ;
    skos:hasTopConcept ex:Colors .

# Root
ex:Colors a skos:Concept ;
    skos:prefLabel "Colors"@en ;
    skos:topConceptOf ex:ColorTaxonomy ;
    skos:inScheme ex:ColorTaxonomy ;
    tax:level 0 ;
    tax:status tax:Active .

# Level 1: Primary colors
ex:Red a skos:Concept ;
    skos:prefLabel "Red"@en ;
    skos:inScheme ex:ColorTaxonomy ;
    skos:broader ex:Colors ;
    skos:narrower ex:Crimson, ex:Scarlet, ex:Ruby ;
    tax:level 1 ;
    tax:status tax:Active ;
    tax:sortOrder 1 ;
    tax:antonym ex:Green .

ex:Green a skos:Concept ;
    skos:prefLabel "Green"@en ;
    skos:inScheme ex:ColorTaxonomy ;
    skos:broader ex:Colors ;
    skos:narrower ex:ForestGreen, ex:LimeGreen, ex:Emerald ;
    tax:level 1 ;
    tax:status tax:Active ;
    tax:sortOrder 2 ;
    tax:antonym ex:Red .

# Level 2: Specific colors
ex:ForestGreen a skos:Concept ;
    skos:prefLabel "Forest Green"@en ;
    skos:inScheme ex:ColorTaxonomy ;
    skos:broader ex:Green ;
    tax:level 2 ;
    tax:status tax:Active ;
    tax:sortOrder 1 ;
    skos:notation "GRN-FOR" .

ex:Crimson a skos:Concept ;
    skos:prefLabel "Crimson"@en ;
    skos:altLabel "Deep Red"@en ;
    skos:inScheme ex:ColorTaxonomy ;
    skos:broader ex:Red ;
    tax:level 2 ;
    tax:status tax:Active ;
    tax:sortOrder 1 ;
    skos:notation "RED-CRM" .

# Deprecated color
ex:OldColorName a skos:Concept ;
    skos:prefLabel "Verdant"@en ;
    skos:inScheme ex:ColorTaxonomy ;
    skos:broader ex:Green ;
    tax:level 2 ;
    tax:status tax:Deprecated ;
    dct:isReplacedBy ex:ForestGreen ;
    skos:changeNote "Deprecated 2024-01: Use 'Forest Green'"@en .
```

---

## SHACL Validation for Extensions

```turtle
ex:ExtendedConceptShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;

    # Level must be non-negative
    sh:property [
        sh:path tax:level ;
        sh:datatype xsd:integer ;
        sh:minInclusive 0 ;
        sh:maxCount 1 ;
        sh:message "Level must be a non-negative integer"
    ] ;

    # Status must be valid
    sh:property [
        sh:path tax:status ;
        sh:class tax:Status ;
        sh:maxCount 1 ;
        sh:message "Status must be a valid tax:Status instance"
    ] ;

    # Level consistency with parent
    sh:sparql [
        sh:message "Level must be parent level + 1" ;
        sh:select """
            SELECT $this ?level ?parentLevel
            WHERE {
                $this skos:broader ?parent ;
                      tax:level ?level .
                ?parent tax:level ?parentLevel .
                FILTER (?level != ?parentLevel + 1)
            }
        """
    ] ;

    # Antonyms must be symmetric
    sh:sparql [
        sh:message "Antonym relationship must be symmetric" ;
        sh:select """
            SELECT $this ?antonym
            WHERE {
                $this tax:antonym ?antonym .
                FILTER NOT EXISTS { ?antonym tax:antonym $this }
            }
        """
    ] .
```

---

## Best Practices

1. **Define clear semantics** — Document each extension property
2. **Use subproperties** — Extend SKOS rather than replace
3. **Maintain consistency** — Validate extended properties
4. **Compute what you can** — Level can be computed from hierarchy
5. **Version your extensions** — Track namespace evolution
6. **Document defaults** — What if tax:status is missing?
7. **Keep extensions minimal** — Only add what you need
