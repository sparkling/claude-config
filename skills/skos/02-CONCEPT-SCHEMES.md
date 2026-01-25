# Concept Schemes and Taxonomy Structure

> "A ConceptScheme is a container that holds related concepts together, defining the boundaries of a controlled vocabulary."

---

## Understanding ConceptSchemes

A `skos:ConceptScheme` represents a complete knowledge organization system—a thesaurus, taxonomy, classification scheme, or controlled vocabulary. It provides:

1. **Scope boundaries** — Concepts belong to specific schemes
2. **Entry points** — Top concepts define where navigation begins
3. **Metadata container** — Scheme-level documentation and provenance
4. **Namespace authority** — The scheme "owns" its concepts

---

## Basic Scheme Definition

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix ex: <http://example.org/> .

ex:ProductCategories a skos:ConceptScheme ;
    # Labeling
    skos:prefLabel "Product Categories"@en ;
    skos:prefLabel "Produktkategorien"@de ;

    # Entry points
    skos:hasTopConcept ex:Electronics ;
    skos:hasTopConcept ex:Clothing ;
    skos:hasTopConcept ex:Food ;

    # Dublin Core metadata
    dct:title "Product Category Taxonomy"@en ;
    dct:description "Hierarchical classification of retail products"@en ;
    dct:creator <http://example.org/people/taxonomist> ;
    dct:created "2024-01-01"^^xsd:date ;
    dct:modified "2025-06-15"^^xsd:date ;
    dct:publisher ex:ExampleCorp ;
    dct:language "en", "de" ;
    dct:rights "CC BY 4.0" .
```

---

## Top Concepts

Top concepts are the entry points of a hierarchy—concepts with no broader concepts within the scheme.

### Defining Top Concepts

```turtle
# Two-way assertion (recommended)
ex:ProductCategories skos:hasTopConcept ex:Electronics .
ex:Electronics skos:topConceptOf ex:ProductCategories .

# Note: topConceptOf implies inScheme
# So this is redundant but explicit:
ex:Electronics skos:inScheme ex:ProductCategories .
```

### Top Concept Properties

```turtle
ex:Electronics a skos:Concept ;
    skos:prefLabel "Electronics"@en ;
    skos:topConceptOf ex:ProductCategories ;
    skos:narrower ex:Computers, ex:Phones, ex:Accessories ;
    skos:definition "Electronic devices and equipment"@en .
```

### Multiple Top Concepts

Most real taxonomies have multiple top concepts (a "forest" rather than a single "tree"):

```turtle
ex:LibraryClassification a skos:ConceptScheme ;
    skos:prefLabel "Library Classification"@en ;
    skos:hasTopConcept ex:Philosophy ;
    skos:hasTopConcept ex:Science ;
    skos:hasTopConcept ex:Arts ;
    skos:hasTopConcept ex:History ;
    skos:hasTopConcept ex:Technology .
```

---

## Scheme Membership

### The inScheme Property

Every concept should declare scheme membership:

```turtle
ex:Laptops a skos:Concept ;
    skos:prefLabel "Laptops"@en ;
    skos:inScheme ex:ProductCategories ;
    skos:broader ex:Computers .
```

### Multiple Scheme Membership

SKOS allows concepts to belong to multiple schemes:

```turtle
# A concept shared across schemes
ex:Database a skos:Concept ;
    skos:prefLabel "Database"@en ;
    skos:inScheme ex:ComputerScienceTerms ;
    skos:inScheme ex:InformationManagementTerms ;
    skos:inScheme ex:LibraryTerms .
```

**Use case**: Reusing concepts across organizational boundaries while maintaining distinct taxonomic structures.

---

## Scheme Versioning

### Version Metadata

```turtle
ex:ProductCategories_v2 a skos:ConceptScheme ;
    skos:prefLabel "Product Categories v2"@en ;

    # Version information
    owl:versionInfo "2.0.0" ;
    dct:issued "2025-01-01"^^xsd:date ;
    dct:replaces ex:ProductCategories_v1 ;

    # Changes from previous version
    skos:changeNote "Added sustainability categories"@en ;
    skos:changeNote "Deprecated legacy electronics subcategories"@en ;

    # Backward compatibility
    dct:conformsTo <http://example.org/taxonomy-standard/v2> .
```

### Version URIs

Two strategies:

```turtle
# Strategy 1: Version in URI (explicit)
<http://example.org/taxonomy/products/v2> a skos:ConceptScheme .

# Strategy 2: Generic URI with version metadata (recommended)
<http://example.org/taxonomy/products> a skos:ConceptScheme ;
    owl:versionIRI <http://example.org/taxonomy/products/2.0> ;
    owl:versionInfo "2.0" .
```

---

## Named Graphs for Schemes

Cagle recommends separating taxonomies into named graphs:

```turtle
# Taxonomies in dedicated graph
GRAPH <http://example.org/graphs/taxonomies> {
    ex:ProductCategories a skos:ConceptScheme .
    ex:Electronics a skos:Concept .
    ex:Computers a skos:Concept .
    # ... all taxonomy concepts
}

# Instance data in separate graph
GRAPH <http://example.org/graphs/products> {
    ex:Product123 a ex:Product ;
        ex:category ex:Laptops .
}
```

### Benefits

1. **Clear separation** — Taxonomy vs instance data
2. **Access control** — Different permissions per layer
3. **Caching** — Taxonomies change less frequently
4. **Provenance** — Track where data comes from

---

## Scheme Design Patterns

### Polyhierarchy vs Strict Hierarchy

**Strict hierarchy** (tree): Each concept has at most one broader concept

```turtle
ex:Tomato skos:broader ex:Vegetable .  # Only one parent
```

**Polyhierarchy** (DAG): Concepts can have multiple broader concepts

```turtle
ex:Tomato skos:broader ex:Vegetable .
ex:Tomato skos:broader ex:Fruit .  # Botanically a fruit!
```

SKOS supports both. Choose based on domain requirements.

### Faceted Classification

Multiple independent hierarchies within one scheme:

```turtle
ex:ClothingTaxonomy a skos:ConceptScheme ;
    skos:hasTopConcept ex:ByType ;      # Shirts, Pants, Dresses
    skos:hasTopConcept ex:ByMaterial ;  # Cotton, Wool, Silk
    skos:hasTopConcept ex:ByOccasion ;  # Casual, Formal, Sport
    skos:hasTopConcept ex:ByGender .    # Men, Women, Unisex
```

Products can then be classified along multiple facets:

```turtle
ex:Shirt123 ex:category ex:DressShirt ;
            ex:material ex:Cotton ;
            ex:occasion ex:Formal ;
            ex:gender ex:Men .
```

---

## Scheme Provenance

### PROV-O Integration

```turtle
@prefix prov: <http://www.w3.org/ns/prov#> .

ex:ProductCategories a skos:ConceptScheme, prov:Entity ;
    prov:wasGeneratedBy ex:TaxonomyCreation ;
    prov:wasAttributedTo ex:TaxonomyTeam .

ex:TaxonomyCreation a prov:Activity ;
    prov:startedAtTime "2024-01-01T09:00:00"^^xsd:dateTime ;
    prov:endedAtTime "2024-03-15T17:00:00"^^xsd:dateTime ;
    prov:wasAssociatedWith ex:LeadTaxonomist .
```

---

## SPARQL Patterns for Schemes

### List All Schemes

```sparql
SELECT ?scheme ?label ?topConceptCount
WHERE {
    ?scheme a skos:ConceptScheme ;
            skos:prefLabel ?label .

    {
        SELECT ?scheme (COUNT(?top) AS ?topConceptCount)
        WHERE {
            ?scheme skos:hasTopConcept ?top .
        }
        GROUP BY ?scheme
    }
}
```

### Get Scheme Statistics

```sparql
SELECT ?scheme
       (COUNT(DISTINCT ?concept) AS ?totalConcepts)
       (COUNT(DISTINCT ?top) AS ?topConcepts)
       (MAX(?depth) AS ?maxDepth)
WHERE {
    ?scheme a skos:ConceptScheme .
    ?concept skos:inScheme ?scheme .

    OPTIONAL { ?scheme skos:hasTopConcept ?top }

    # Calculate depth
    OPTIONAL {
        SELECT ?concept (COUNT(?ancestor) AS ?depth)
        WHERE {
            ?concept skos:broader+ ?ancestor .
        }
        GROUP BY ?concept
    }
}
GROUP BY ?scheme
```

### Find Concepts by Scheme

```sparql
SELECT ?concept ?label ?broader
WHERE {
    ?concept skos:inScheme ex:ProductCategories ;
             skos:prefLabel ?label .
    OPTIONAL { ?concept skos:broader ?broader }
}
ORDER BY ?broader ?label
```

---

## SHACL Validation

```turtle
ex:ConceptSchemeShape a sh:NodeShape ;
    sh:targetClass skos:ConceptScheme ;

    sh:property [
        sh:path skos:prefLabel ;
        sh:minCount 1 ;
        sh:message "Scheme must have a preferred label"
    ] ;

    sh:property [
        sh:path skos:hasTopConcept ;
        sh:minCount 1 ;
        sh:class skos:Concept ;
        sh:message "Scheme must have at least one top concept"
    ] ;

    # Validate that top concepts don't have broader in this scheme
    sh:sparql [
        sh:message "Top concept should not have broader concept" ;
        sh:select """
            SELECT $this ?top ?broader
            WHERE {
                $this skos:hasTopConcept ?top .
                ?top skos:broader ?broader .
                ?broader skos:inScheme $this .
            }
        """
    ] .
```

---

## Complete Example: Product Taxonomy

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix ex: <http://example.org/> .

# The scheme
ex:ProductTaxonomy a skos:ConceptScheme ;
    skos:prefLabel "Product Taxonomy"@en ;
    dct:description "Hierarchical classification for e-commerce products"@en ;
    dct:creator "Taxonomy Team" ;
    dct:created "2024-01-01"^^xsd:date ;
    skos:hasTopConcept ex:Electronics, ex:Clothing, ex:HomeAndGarden .

# Top concept: Electronics
ex:Electronics a skos:Concept ;
    skos:prefLabel "Electronics"@en ;
    skos:topConceptOf ex:ProductTaxonomy ;
    skos:inScheme ex:ProductTaxonomy ;
    skos:narrower ex:Computers, ex:Phones .

# Level 2: Computers
ex:Computers a skos:Concept ;
    skos:prefLabel "Computers"@en ;
    skos:inScheme ex:ProductTaxonomy ;
    skos:broader ex:Electronics ;
    skos:narrower ex:Laptops, ex:Desktops, ex:Tablets .

# Level 3: Laptops
ex:Laptops a skos:Concept ;
    skos:prefLabel "Laptops"@en ;
    skos:altLabel "Notebook Computers"@en ;
    skos:inScheme ex:ProductTaxonomy ;
    skos:broader ex:Computers ;
    skos:narrower ex:GamingLaptops, ex:BusinessLaptops, ex:Ultrabooks ;
    skos:related ex:LaptopAccessories ;
    skos:definition "Portable computers with integrated display"@en ;
    skos:notation "ELEC-COMP-LAP" .

# Level 4: Gaming Laptops
ex:GamingLaptops a skos:Concept ;
    skos:prefLabel "Gaming Laptops"@en ;
    skos:inScheme ex:ProductTaxonomy ;
    skos:broader ex:Laptops ;
    skos:scopeNote "High-performance laptops designed for gaming"@en .
```
