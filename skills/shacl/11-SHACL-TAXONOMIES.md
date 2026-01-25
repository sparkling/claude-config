# SHACL and Taxonomies

> "Taxonomies can, at their core, be considered lists of concepts or categories, whereas instance data are lists of things." — Kurt Cagle

SHACL provides powerful validation for taxonomic structures and SKOS concept schemes.

---

## Understanding the Distinction

### Ontology vs Taxonomy vs Instance Data

| Layer | Contains | Examples |
|-------|----------|----------|
| **Ontology** | Structural shapes | PersonShape, ProductShape |
| **Taxonomy** | Concepts/categories | Red, Blue, Manager, Engineer |
| **Instance Data** | Individual things | John, Product-123 |

> "Taxonomies help to qualify (and to some extent quantify) the properties of entities."

---

## SKOS Integration

### Basic SKOS Validation

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .

ex:ConceptShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;

    # Must have preferred label
    sh:property [
        sh:path skos:prefLabel ;
        sh:minCount 1 ;
        sh:uniqueLang true ;
        sh:message "Concept must have at least one prefLabel, unique per language"
    ] ;

    # Optional alternate labels
    sh:property [
        sh:path skos:altLabel ;
        sh:datatype rdf:langString
    ] ;

    # Must belong to a scheme
    sh:property [
        sh:path skos:inScheme ;
        sh:minCount 1 ;
        sh:class skos:ConceptScheme
    ] .
```

### ConceptScheme Validation

```turtle
ex:ConceptSchemeShape a sh:NodeShape ;
    sh:targetClass skos:ConceptScheme ;

    sh:property [
        sh:path skos:prefLabel ;
        sh:minCount 1
    ] ;

    sh:property [
        sh:path skos:hasTopConcept ;
        sh:minCount 1 ;
        sh:class skos:Concept ;
        sh:message "Scheme must have at least one top concept"
    ] .
```

---

## Taxonomy Hierarchy Validation

### Broader/Narrower Consistency

```turtle
ex:ConceptShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;

    # Broader must not be self
    sh:sparql [
        sh:message "Concept cannot be broader than itself" ;
        sh:select """
            SELECT $this
            WHERE {
                $this skos:broader+ $this .
            }
        """
    ] ;

    # Broader concepts must be in same scheme
    sh:sparql [
        sh:message "Broader concept must be in the same scheme" ;
        sh:select """
            SELECT $this ?broader ?scheme ?broaderScheme
            WHERE {
                $this skos:broader ?broader ;
                      skos:inScheme ?scheme .
                ?broader skos:inScheme ?broaderScheme .
                FILTER (?scheme != ?broaderScheme)
            }
        """
    ] .
```

### Top Concept Validation

```turtle
ex:TopConceptShape a sh:NodeShape ;
    sh:target [
        a sh:SPARQLTarget ;
        sh:select """
            SELECT ?this WHERE {
                ?scheme skos:hasTopConcept ?this .
            }
        """
    ] ;

    # Top concepts should not have broader
    sh:property [
        sh:path skos:broader ;
        sh:maxCount 0 ;
        sh:message "Top concepts should not have broader concepts"
    ] .
```

---

## Extended Taxonomy Properties (Cagle's Pattern)

### The tax: Namespace

Cagle proposes extending SKOS with additional metadata:

```turtle
@prefix tax: <http://example.org/taxonomy#> .

# Level in hierarchy (distance from root)
tax:level a rdf:Property ;
    rdfs:domain skos:Concept ;
    rdfs:range xsd:integer .

# Active/deprecated status
tax:status a rdf:Property ;
    rdfs:domain skos:Concept ;
    rdfs:range xsd:string .

# Sort order for UI/weighting
tax:sortOrder a rdf:Property ;
    rdfs:domain skos:Concept ;
    rdfs:range xsd:integer .

# Antonym relationship
tax:antonym a rdf:Property ;
    rdfs:domain skos:Concept ;
    rdfs:range skos:Concept .
```

### Validating Extended Properties

```turtle
ex:ExtendedConceptShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;

    sh:property [
        sh:path tax:level ;
        sh:datatype xsd:integer ;
        sh:minInclusive 0 ;
        sh:message "Level must be non-negative integer"
    ] ;

    sh:property [
        sh:path tax:status ;
        sh:in ("active" "deprecated" "proposed") ;
        sh:defaultValue "active"
    ] ;

    sh:property [
        sh:path tax:sortOrder ;
        sh:datatype xsd:integer ;
        sh:minInclusive 0
    ] .
```

---

## Level-Based Validation

### Validating Taxonomy Level References

```turtle
ex:CarColorConstraint a sh:NodeShape ;
    sh:targetClass ex:Car ;

    sh:property [
        sh:path ex:exteriorColor ;
        sh:class skos:Concept ;
        sh:message "Exterior color must be a color concept"
    ] ;

    # Color must be at level 2 (specific colors, not categories)
    sh:sparql [
        sh:message "Exterior color must be a level 2 color (e.g., Forest Green, not just Green)" ;
        sh:select """
            SELECT $this ?color
            WHERE {
                $this ex:exteriorColor ?color .
                ?color tax:level ?level .
                FILTER (?level != 2)
            }
        """
    ] ;

    # Color must be from approved parent categories
    sh:sparql [
        sh:message "Color must be from approved categories (RED, GREEN, BLUE, GRAY)" ;
        sh:select """
            SELECT $this ?color
            WHERE {
                $this ex:exteriorColor ?color .
                ?color skos:broader ?parent .
                FILTER (?parent NOT IN (ex:RED, ex:GREEN, ex:BLUE, ex:GRAY))
            }
        """
    ] .
```

---

## Taxonomy Example: Colors

### Structure

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix tax: <http://example.org/taxonomy#> .
@prefix ex: <http://example.org/> .

# Scheme
ex:ColorScheme a skos:ConceptScheme ;
    skos:prefLabel "Color Taxonomy"@en ;
    skos:hasTopConcept ex:RED, ex:GREEN, ex:BLUE, ex:GRAY .

# Level 1: Primary categories
ex:RED a skos:Concept ;
    skos:prefLabel "Red"@en ;
    skos:inScheme ex:ColorScheme ;
    tax:level 1 ;
    tax:sortOrder 1 .

ex:GREEN a skos:Concept ;
    skos:prefLabel "Green"@en ;
    skos:inScheme ex:ColorScheme ;
    tax:level 1 ;
    tax:sortOrder 2 ;
    tax:antonym ex:RED .

# Level 2: Specific colors
ex:ForestGreen a skos:Concept ;
    skos:prefLabel "Forest Green"@en ;
    skos:inScheme ex:ColorScheme ;
    skos:broader ex:GREEN ;
    tax:level 2 ;
    tax:sortOrder 1 .

ex:LimeGreen a skos:Concept ;
    skos:prefLabel "Lime Green"@en ;
    skos:inScheme ex:ColorScheme ;
    skos:broader ex:GREEN ;
    tax:level 2 ;
    tax:sortOrder 2 .

ex:CrimsonRed a skos:Concept ;
    skos:prefLabel "Crimson Red"@en ;
    skos:inScheme ex:ColorScheme ;
    skos:broader ex:RED ;
    tax:level 2 ;
    tax:sortOrder 1 .
```

### SHACL for Color Usage

```turtle
ex:ProductColorShape a sh:NodeShape ;
    sh:targetClass ex:Product ;

    sh:property [
        sh:path ex:color ;
        sh:name "color" ;
        sh:description "Product color (must be level 2 concept)" ;
        sh:class skos:Concept ;
        sh:minCount 1
    ] ;

    # Must reference level 2
    sh:sparql [
        sh:message "Color must be a specific color (level 2), not a category" ;
        sh:select """
            SELECT $this ?color ?level
            WHERE {
                $this ex:color ?color .
                OPTIONAL { ?color tax:level ?level }
                FILTER (!BOUND(?level) || ?level != 2)
            }
        """
    ] .
```

---

## Feature Engineering with sortOrder

Cagle uses `tax:sortOrder` for ML feature weighting:

```turtle
# If parent has 4 children:
# sortOrder 1 → weight 0.25
# sortOrder 2 → weight 0.50
# sortOrder 3 → weight 0.75
# sortOrder 4 → weight 1.00
```

### SPARQL for Feature Extraction

```sparql
SELECT ?product ?colorFeature
WHERE {
    ?product ex:color ?color .
    ?color skos:broader ?parent ;
           tax:sortOrder ?order .

    # Count siblings
    {
        SELECT ?parent (COUNT(?sibling) AS ?siblingCount)
        WHERE {
            ?sibling skos:broader ?parent .
        }
        GROUP BY ?parent
    }

    BIND (?order / ?siblingCount AS ?colorFeature)
}
```

---

## Taxonomy Querying Patterns

### Get All Concepts at Level

```sparql
SELECT ?concept ?label
WHERE {
    ?concept skos:inScheme ex:ColorScheme ;
             tax:level 2 ;
             skos:prefLabel ?label .
}
ORDER BY ?label
```

### Get Hierarchy Path

```sparql
SELECT ?concept ?label ?path
WHERE {
    ?concept skos:inScheme ex:ColorScheme ;
             skos:prefLabel ?label .

    {
        SELECT ?concept (GROUP_CONCAT(?ancestorLabel; separator=" > ") AS ?path)
        WHERE {
            ?concept skos:broader* ?ancestor .
            ?ancestor skos:prefLabel ?ancestorLabel .
        }
        GROUP BY ?concept
    }
}
```

### Validate Taxonomy Completeness

```sparql
# Find concepts missing required properties
SELECT ?concept ?missingProp
WHERE {
    ?concept a skos:Concept .

    {
        FILTER NOT EXISTS { ?concept skos:prefLabel ?label }
        BIND ("prefLabel" AS ?missingProp)
    }
    UNION
    {
        FILTER NOT EXISTS { ?concept skos:inScheme ?scheme }
        BIND ("inScheme" AS ?missingProp)
    }
    UNION
    {
        FILTER NOT EXISTS { ?concept tax:level ?level }
        BIND ("level" AS ?missingProp)
    }
}
```

---

## Best Practices

### 1. Separate Taxonomy from Instance Data

Keep taxonomies in dedicated named graphs:

```turtle
GRAPH ex:taxonomies {
    ex:ColorScheme a skos:ConceptScheme .
    ex:RED a skos:Concept .
    # ...
}

GRAPH ex:products {
    ex:Product1 ex:color ex:ForestGreen .
}
```

### 2. Version Taxonomies

```turtle
ex:ColorScheme_v2 a skos:ConceptScheme ;
    dcterms:replaces ex:ColorScheme_v1 ;
    dcterms:issued "2025-01-01"^^xsd:date .
```

### 3. Use Deprecation, Not Deletion

```turtle
ex:OldColor a skos:Concept ;
    tax:status "deprecated" ;
    dcterms:isReplacedBy ex:NewColor .
```

### 4. Validate Reference Integrity

```turtle
sh:sparql [
    sh:message "Referenced concept does not exist in scheme" ;
    sh:select """
        SELECT $this ?value
        WHERE {
            $this ex:category ?value .
            FILTER NOT EXISTS { ?value a skos:Concept }
        }
    """
] .
```

### 5. Ensure Consistent Levels

```turtle
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
] .
```

---

## Resources

- [SHACL and Taxonomies](https://ontologist.substack.com/p/shacl-and-taxonomies) — Kurt Cagle
- [SKOS Reference](https://www.w3.org/TR/skos-reference/) — W3C
- [SKOS Primer](https://www.w3.org/TR/skos-primer/) — W3C
