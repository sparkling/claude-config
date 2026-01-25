# SKOS Taxonomies and Knowledge Organization

> "Taxonomies can, at their core, be considered lists of concepts or categories, whereas instance data are lists of things." — Kurt Cagle

SKOS (Simple Knowledge Organization System) provides a standard for representing taxonomies, thesauri, and controlled vocabularies.

---

## Core SKOS Model

### Concepts vs Instances

**Key Distinction:**
- **Concepts** (SKOS) = Categories, classifications, types
- **Instances** (RDF) = Individual things, entities, objects

```turtle
# Concept (category)
ex:Cat a skos:Concept ;
    skos:prefLabel "Cat"@en ;
    skos:broader ex:Mammal .

# Instance (individual thing)
ex:Whiskers a ex:Cat ;  # Note: rdf:type, not skos
    rdfs:label "Whiskers" ;
    ex:age 5 .
```

### Concept Schemes

A concept scheme organizes related concepts:

```turtle
ex:AnimalTaxonomy a skos:ConceptScheme ;
    skos:prefLabel "Animal Classification System"@en ;
    skos:definition "A hierarchical classification of animals"@en ;
    skos:hasTopConcept ex:Animal .

ex:Animal a skos:Concept ;
    skos:inScheme ex:AnimalTaxonomy ;
    skos:topConceptOf ex:AnimalTaxonomy ;
    skos:prefLabel "Animal"@en .

ex:Mammal a skos:Concept ;
    skos:inScheme ex:AnimalTaxonomy ;
    skos:broader ex:Animal ;
    skos:prefLabel "Mammal"@en .
```

---

## Labeling

### Label Types

| Property | Purpose | Cardinality |
|----------|---------|-------------|
| `skos:prefLabel` | Primary label | One per language |
| `skos:altLabel` | Alternative labels | Multiple allowed |
| `skos:hiddenLabel` | Search terms, misspellings | Multiple allowed |

```turtle
ex:Cat a skos:Concept ;
    # Preferred label (one per language)
    skos:prefLabel "Cat"@en ;
    skos:prefLabel "Katze"@de ;
    skos:prefLabel "Chat"@fr ;

    # Alternative labels
    skos:altLabel "Feline"@en ;
    skos:altLabel "Kitty"@en ;
    skos:altLabel "Domestic cat"@en ;

    # Hidden labels (for search, not display)
    skos:hiddenLabel "Kat"@en ;      # Common misspelling
    skos:hiddenLabel "Felis catus"@en .  # Scientific name
```

### Label Integrity

**Rule**: No concept should have identical `skos:prefLabel`, `skos:altLabel`, or `skos:hiddenLabel` within the same language.

```turtle
# WRONG: Same label used twice
ex:Feline skos:prefLabel "Cat"@en ;
          skos:altLabel "Cat"@en .  # Conflict!
```

---

## Semantic Relations

### Hierarchical Relations

```turtle
# Broader (parent/superordinate)
ex:Cat skos:broader ex:Mammal .

# Narrower (child/subordinate) - inverse
ex:Mammal skos:narrower ex:Cat .

# Hierarchy
ex:Animal
    skos:narrower ex:Mammal, ex:Bird, ex:Fish .

ex:Mammal
    skos:broader ex:Animal ;
    skos:narrower ex:Cat, ex:Dog, ex:Horse .

ex:Cat
    skos:broader ex:Mammal ;
    skos:narrower ex:PersianCat, ex:SiameseCat, ex:TabbyCat .
```

### Transitive Relations

For query expansion and reasoning:

```turtle
# skos:broader and skos:narrower are NOT transitive by design
# Use transitive variants for closure:

ex:Cat skos:broaderTransitive ex:Mammal .
ex:Cat skos:broaderTransitive ex:Animal .  # Transitive closure

ex:Animal skos:narrowerTransitive ex:Mammal .
ex:Animal skos:narrowerTransitive ex:Cat .
```

### Associative Relations

Non-hierarchical connections:

```turtle
# Related concepts (symmetric)
ex:Cat skos:related ex:Dog .
ex:Dog skos:related ex:Cat .  # Implied by symmetry

# More examples
ex:Painting skos:related ex:Artist .
ex:Coffee skos:related ex:Tea .
ex:Sunrise skos:related ex:Sunset .
```

---

## Documentation

### Note Types

| Property | Purpose |
|----------|---------|
| `skos:note` | General note |
| `skos:definition` | Formal definition |
| `skos:scopeNote` | Usage guidance |
| `skos:example` | Illustrative examples |
| `skos:historyNote` | Historical information |
| `skos:editorialNote` | Editor's notes |
| `skos:changeNote` | Change documentation |

```turtle
ex:Cat a skos:Concept ;
    skos:prefLabel "Cat"@en ;

    skos:definition "A small domesticated carnivorous mammal with soft fur, a short snout, and retractable claws."@en ;

    skos:scopeNote "Use for domestic cats only. For wild cats, use broader term 'Felidae'."@en ;

    skos:example "Persian, Siamese, Maine Coon, Tabby"@en ;

    skos:historyNote "Added to taxonomy in version 1.0 (2020)"@en ;

    skos:editorialNote "Consider adding subspecies in future version"@en ;

    skos:changeNote "2024-06: Updated definition to include 'retractable claws'"@en .
```

### Notations

Codes or identifiers for concepts:

```turtle
ex:Cat a skos:Concept ;
    skos:prefLabel "Cat"@en ;
    skos:notation "MAM-CAT-001" ;  # Local code
    skos:notation "Q146"^^ex:WikidataID .  # Typed notation
```

---

## Collections

### Labeled Collections

Group concepts without hierarchy:

```turtle
ex:DomesticAnimals a skos:Collection ;
    skos:prefLabel "Domestic Animals"@en ;
    skos:member ex:Cat ;
    skos:member ex:Dog ;
    skos:member ex:Horse ;
    skos:member ex:Chicken .
```

### Ordered Collections

When order matters:

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

## Mapping Between Schemes

### Mapping Properties

| Property | Meaning | Use Case |
|----------|---------|----------|
| `skos:exactMatch` | Interchangeable | High confidence equivalence |
| `skos:closeMatch` | Similar meaning | Lower confidence |
| `skos:broadMatch` | Target is broader | Cross-scheme hierarchy |
| `skos:narrowMatch` | Target is narrower | Cross-scheme hierarchy |
| `skos:relatedMatch` | Associated | Cross-scheme association |

```turtle
# Exact match - high confidence, interchangeable
ex:Cat skos:exactMatch wikidata:Q146 .
ex:Cat skos:exactMatch dbpedia:Cat .

# Close match - similar but not identical
ex:Feline skos:closeMatch lc:sh85021262 .

# Hierarchical mappings
ex:SiameseCat skos:broadMatch dbpedia:Cat .
ex:Cat skos:narrowMatch lc:sh85021262 .  # If LC term is broader

# Associative mapping
ex:CatFood skos:relatedMatch dbpedia:Cat .
```

### Mapping Best Practices

1. **exactMatch implies transitivity** — be careful with chains
2. **Document mapping provenance** — who created, when
3. **Version awareness** — schemes change over time
4. **Avoid circular exactMatch**

---

## Extending SKOS (Cagle's Approach)

### Custom Taxonomy Properties

```turtle
@prefix tax: <http://example.org/taxonomy#> .

# Level in hierarchy (computed or asserted)
tax:level a owl:DatatypeProperty ;
    rdfs:domain skos:Concept ;
    rdfs:range xsd:integer .

# Node status
tax:status a owl:ObjectProperty ;
    rdfs:domain skos:Concept ;
    rdfs:range tax:Status .

tax:Active a tax:Status .
tax:Deprecated a tax:Status .

# Sort order for children
tax:sortOrder a owl:DatatypeProperty ;
    rdfs:domain skos:Concept ;
    rdfs:range xsd:integer .

# Antonyms
tax:antonym a owl:ObjectProperty ;
    rdfs:domain skos:Concept ;
    rdfs:range skos:Concept .
```

### Usage Example

```turtle
ex:Hot a skos:Concept ;
    skos:prefLabel "Hot"@en ;
    tax:level 2 ;
    tax:status tax:Active ;
    tax:sortOrder 1 ;
    tax:antonym ex:Cold .

ex:Cold a skos:Concept ;
    skos:prefLabel "Cold"@en ;
    tax:level 2 ;
    tax:status tax:Active ;
    tax:sortOrder 2 ;
    tax:antonym ex:Hot .
```

---

## SHACL Validation for Taxonomies

```turtle
ex:ConceptShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;

    sh:property [
        sh:path skos:prefLabel ;
        sh:minCount 1 ;
        sh:uniqueLang true ;
        sh:message "Concept must have at least one prefLabel, unique per language"
    ] ;

    sh:property [
        sh:path skos:inScheme ;
        sh:minCount 1 ;
        sh:class skos:ConceptScheme ;
        sh:message "Concept must belong to a concept scheme"
    ] ;

    sh:property [
        sh:path skos:broader ;
        sh:class skos:Concept ;
        sh:message "Broader must reference another concept"
    ] .

# Validate taxonomy structure
ex:TaxonomyConstraint a sh:SPARQLConstraint ;
    sh:message "Concept cannot be its own ancestor" ;
    sh:select """
        SELECT $this
        WHERE {
            $this skos:broader+ $this .
        }
    """ .
```

---

## Complete Taxonomy Example

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix ex: <http://example.org/> .
@prefix dct: <http://purl.org/dc/terms/> .

# Concept Scheme
ex:ProductCategories a skos:ConceptScheme ;
    skos:prefLabel "Product Categories"@en ;
    dct:creator "Example Corp" ;
    dct:created "2024-01-01"^^xsd:date ;
    skos:hasTopConcept ex:Products .

# Top concept
ex:Products a skos:Concept ;
    skos:prefLabel "Products"@en ;
    skos:inScheme ex:ProductCategories ;
    skos:topConceptOf ex:ProductCategories ;
    skos:narrower ex:Electronics, ex:Clothing, ex:Food .

# Level 1
ex:Electronics a skos:Concept ;
    skos:prefLabel "Electronics"@en ;
    skos:altLabel "Electronic Goods"@en ;
    skos:inScheme ex:ProductCategories ;
    skos:broader ex:Products ;
    skos:narrower ex:Computers, ex:Phones, ex:Accessories ;
    skos:notation "ELEC" .

# Level 2
ex:Computers a skos:Concept ;
    skos:prefLabel "Computers"@en ;
    skos:inScheme ex:ProductCategories ;
    skos:broader ex:Electronics ;
    skos:narrower ex:Laptops, ex:Desktops ;
    skos:related ex:Accessories ;
    skos:notation "ELEC-COMP" .

# Level 3
ex:Laptops a skos:Concept ;
    skos:prefLabel "Laptops"@en ;
    skos:altLabel "Notebook Computers"@en ;
    skos:inScheme ex:ProductCategories ;
    skos:broader ex:Computers ;
    skos:notation "ELEC-COMP-LAP" ;
    skos:definition "Portable computers with integrated display and keyboard"@en ;
    skos:scopeNote "Includes ultrabooks and gaming laptops"@en .

# Cross-scheme mapping
ex:Laptops skos:exactMatch schema:LaptopComputer .
ex:Laptops skos:closeMatch dbpedia:Laptop .
```
