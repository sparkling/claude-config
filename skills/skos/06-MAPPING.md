# Mapping Between SKOS Concept Schemes

> "Mapping is the bridge between isolated vocabularies—transforming silos into a connected web of knowledge."

---

## The Purpose of Mapping

Mapping properties establish semantic correspondences between concepts in **different** concept schemes. They enable:

1. **Vocabulary alignment** — Connect internal terms to external standards
2. **Data integration** — Combine data using different classification systems
3. **Query expansion** — Find related content across vocabularies
4. **Linked Data** — Connect to the broader semantic web

---

## Mapping Properties Overview

| Property | Transitivity | Semantics | Use Case |
|----------|--------------|-----------|----------|
| `skos:exactMatch` | Transitive | Equivalent | Interchangeable concepts |
| `skos:closeMatch` | Non-transitive | Similar | Similar but not identical |
| `skos:broadMatch` | Non-transitive | Hierarchical | Target is more general |
| `skos:narrowMatch` | Non-transitive | Hierarchical | Target is more specific |
| `skos:relatedMatch` | Non-transitive | Associative | Non-hierarchical link |

All mapping properties are subproperties of `skos:mappingRelation`.

---

## Exact Match (skos:exactMatch)

Use when concepts are **semantically equivalent** and can be used interchangeably.

### Basic Usage

```turtle
# Local concept mapped to Wikidata
ex:Cat skos:exactMatch <http://www.wikidata.org/entity/Q146> .

# Mapped to DBpedia
ex:Cat skos:exactMatch <http://dbpedia.org/resource/Cat> .

# Mapped to Library of Congress
ex:Cat skos:exactMatch <http://id.loc.gov/authorities/subjects/sh85021262> .
```

### Transitivity Implications

`skos:exactMatch` is **transitive and symmetric**:

```turtle
ex:Cat skos:exactMatch wd:Q146 .
wd:Q146 skos:exactMatch dbpedia:Cat .

# Implies (by transitivity):
ex:Cat skos:exactMatch dbpedia:Cat .

# Implies (by symmetry):
wd:Q146 skos:exactMatch ex:Cat .
```

### Caution with exactMatch

> "Apply `skos:exactMatch` only for genuinely equivalent meanings across schemes."

Beware of **transitivity chains** creating unintended equivalences:

```turtle
# If vocabulary A maps to B, and B maps to C...
vocabA:Automobile skos:exactMatch vocabB:Car .
vocabB:Car skos:exactMatch vocabC:Motor_Vehicle .

# This implies (potentially incorrectly):
vocabA:Automobile skos:exactMatch vocabC:Motor_Vehicle .
```

---

## Close Match (skos:closeMatch)

Use when concepts are **similar but not identical**—interchangeable in some contexts.

```turtle
# Similar concepts that might differ in scope
ex:MobilePhone skos:closeMatch schema:MobilePhone .
ex:Smartphone skos:closeMatch dbpedia:Smartphone .

# Cross-cultural concepts
ex:Anime skos:closeMatch loc:Animation .  # Related but distinct traditions
```

### Key Differences from exactMatch

- **Not transitive** — Prevents equivalence chains
- **Lower confidence** — Acknowledges semantic differences
- **Safer for alignment** — Won't merge concepts unexpectedly

```turtle
# closeMatch does NOT imply transitivity
ex:Laptop skos:closeMatch vocabA:Notebook .
vocabA:Notebook skos:closeMatch vocabB:PortableComputer .

# This does NOT imply:
# ex:Laptop skos:closeMatch vocabB:PortableComputer .
```

---

## Hierarchical Mapping

### skos:broadMatch

The target concept is **more general**:

```turtle
# Local concept maps to broader external concept
ex:PersianCat skos:broadMatch loc:Cats .
ex:DeepLearning skos:broadMatch wd:MachineLearning .
```

### skos:narrowMatch

The target concept is **more specific**:

```turtle
# Local concept maps to narrower external concept
ex:Cats skos:narrowMatch loc:PersianCats .
ex:Vehicles skos:narrowMatch wd:Automobiles .
```

### Inverse Relationship

`skos:broadMatch` and `skos:narrowMatch` are inverses:

```turtle
ex:Siamese skos:broadMatch ext:Cat .
# Implies:
ext:Cat skos:narrowMatch ex:Siamese .
```

---

## Associative Mapping (skos:relatedMatch)

Non-hierarchical cross-scheme relationships:

```turtle
# Related concepts in different vocabularies
ex:Coffee skos:relatedMatch wd:Caffeine .
ex:Photography skos:relatedMatch getty:Cameras .
ex:Cooking skos:relatedMatch loc:Recipes .
```

**Properties:**
- Symmetric
- Non-transitive
- Disjoint from exactMatch

---

## Mapping vs Internal Relations

### Key Distinction

| Property | Within Scheme | Across Schemes |
|----------|---------------|----------------|
| `skos:broader` | Yes | No |
| `skos:narrower` | Yes | No |
| `skos:related` | Yes | No |
| `skos:broadMatch` | No | Yes |
| `skos:narrowMatch` | No | Yes |
| `skos:relatedMatch` | No | Yes |

**Rule**: Mapping properties link concepts in **different** schemes.

```turtle
# CORRECT: Internal hierarchy
ex:Cat skos:inScheme ex:AnimalTaxonomy ;
       skos:broader ex:Mammal .  # Same scheme

# CORRECT: Cross-scheme mapping
ex:Cat skos:broadMatch loc:Carnivora .  # Different schemes
```

---

## Why Not owl:sameAs?

SKOS deliberately avoids `owl:sameAs` for mapping:

> "SKOS avoids `owl:sameAs` to prevent unwanted triple merging."

### The Problem with owl:sameAs

```turtle
# With owl:sameAs, all triples merge:
ex:Cat owl:sameAs dbpedia:Cat .

# If dbpedia:Cat has different properties,
# they ALL become properties of ex:Cat
# This may cause unintended consequences
```

### SKOS Approach

```turtle
# With skos:exactMatch, concepts remain distinct:
ex:Cat skos:exactMatch dbpedia:Cat .

# ex:Cat and dbpedia:Cat are equivalent in meaning
# but remain separate resources with their own properties
```

---

## Mapping Provenance

### Documenting Mappings

```turtle
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix dct: <http://purl.org/dc/terms/> .

# Using reification
ex:Mapping1 a rdf:Statement ;
    rdf:subject ex:Cat ;
    rdf:predicate skos:exactMatch ;
    rdf:object wd:Q146 ;
    dct:creator ex:MappingTeam ;
    dct:created "2024-06-15"^^xsd:date ;
    dct:confidence "0.95"^^xsd:decimal ;
    prov:wasDerivedFrom ex:MappingProject1 .
```

### RDF-star for Mapping Metadata

```turtle
# RDF-star annotation
<< ex:Cat skos:exactMatch wd:Q146 >>
    dct:creator ex:Taxonomist1 ;
    dct:created "2024-06-15"^^xsd:date ;
    ex:confidence 0.95 ;
    ex:method "manual" .
```

---

## SPARQL Patterns

### Find All Mappings

```sparql
SELECT ?concept ?matchType ?target ?targetLabel
WHERE {
    ?concept skos:inScheme ex:LocalTaxonomy .

    {
        ?concept skos:exactMatch ?target
        BIND ("exact" AS ?matchType)
    } UNION {
        ?concept skos:closeMatch ?target
        BIND ("close" AS ?matchType)
    } UNION {
        ?concept skos:broadMatch ?target
        BIND ("broad" AS ?matchType)
    } UNION {
        ?concept skos:narrowMatch ?target
        BIND ("narrow" AS ?matchType)
    } UNION {
        ?concept skos:relatedMatch ?target
        BIND ("related" AS ?matchType)
    }

    OPTIONAL {
        SERVICE <http://query.wikidata.org/sparql> {
            ?target rdfs:label ?targetLabel .
            FILTER (lang(?targetLabel) = "en")
        }
    }
}
```

### Find Unmapped Concepts

```sparql
SELECT ?concept ?label
WHERE {
    ?concept skos:inScheme ex:LocalTaxonomy ;
             skos:prefLabel ?label .

    FILTER NOT EXISTS {
        ?concept skos:mappingRelation ?external .
    }

    FILTER (lang(?label) = "en")
}
ORDER BY ?label
```

### Validate Mapping Consistency

```sparql
# Find concepts with both exactMatch and broadMatch to same target
SELECT ?concept ?target
WHERE {
    ?concept skos:exactMatch ?target ;
             skos:broadMatch ?target .  # Inconsistent!
}
```

---

## SHACL Validation

```turtle
ex:MappingShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;

    # exactMatch targets must be external
    sh:sparql [
        sh:message "exactMatch should link to external scheme" ;
        sh:select """
            SELECT $this ?target
            WHERE {
                $this skos:exactMatch ?target ;
                      skos:inScheme ?scheme .
                ?target skos:inScheme ?scheme .
            }
        """
    ] ;

    # No exactMatch with hierarchical match to same target
    sh:sparql [
        sh:message "Cannot have both exactMatch and broadMatch to same concept" ;
        sh:select """
            SELECT $this ?target
            WHERE {
                $this skos:exactMatch ?target ;
                      skos:broadMatch ?target .
            }
        """
    ] ;

    # Mapping targets should be IRIs
    sh:property [
        sh:path skos:mappingRelation ;
        sh:nodeKind sh:IRI ;
        sh:message "Mapping targets must be IRIs"
    ] .
```

---

## Best Practices

1. **Use exactMatch sparingly** — Only for truly interchangeable concepts
2. **Prefer closeMatch when uncertain** — Safer than exactMatch
3. **Document mapping decisions** — Record creator, date, confidence
4. **Map to authoritative sources** — Wikidata, Library of Congress, Getty
5. **Validate transitivity chains** — Ensure exactMatch chains make sense
6. **Version mapping sets** — Mappings may need updates as schemes evolve
7. **Test bidirectionally** — Check that inverse mappings also hold

---

## Common External Vocabularies

| Vocabulary | URI Pattern | Coverage |
|------------|-------------|----------|
| Wikidata | `http://www.wikidata.org/entity/Q{id}` | General knowledge |
| DBpedia | `http://dbpedia.org/resource/{name}` | Wikipedia-derived |
| Library of Congress | `http://id.loc.gov/authorities/subjects/{id}` | Subject headings |
| Getty AAT | `http://vocab.getty.edu/aat/{id}` | Art & architecture |
| GeoNames | `http://sws.geonames.org/{id}/` | Geographic |
| Schema.org | `http://schema.org/{Type}` | Web vocabulary |
