---
name: skos
description: Design, implement, and manage knowledge organization systems with SKOS (Simple Knowledge Organization System). Covers concept schemes, taxonomies, thesauri, controlled vocabularies, semantic relations, mapping, SKOS-XL labels, AI/LLM integration patterns, and SHACL validation. Informed by Kurt Cagle's ontologist perspective and W3C specifications.
allowed-tools: Read, Write, Edit, Grep, Glob, WebFetch
---

# SKOS & Knowledge Organization Skill

Design, implement, and manage knowledge organization systems with an ontologist's perspective. This skill embodies the practical wisdom that taxonomies are fundamentally different from instance data—they provide the conceptual scaffolding upon which we classify and qualify the things in our knowledge graphs.

---

## Core Philosophy (Cagle's Principles)

> "Taxonomies can, at their core, be considered lists of concepts or categories, whereas instance data are lists of things."

**Key Insights:**

1. **Concepts qualify entities**: "Taxonomies help to qualify (and to some extent quantify) the properties of entities"—they are adjectives to the knowledge graph's nouns
2. **Bottom-up hierarchy**: SKOS uses a "bottom-up" approach where subordinate concepts point upward via `skos:broader`, enabling efficient transitive traversal
3. **Separate from instances**: Keep taxonomies in dedicated named graphs; they represent categories of thought, not things themselves
4. **The taxonomist's role**: "The taxonomist then determines how those entities are classified based upon the ontologist's model"
5. **SKOS extends RDFS**: SKOS labeling properties (`skos:prefLabel`, etc.) are subproperties of `rdfs:label`, enabling general resource labeling beyond concepts

> "SKOS, or the Simple Knowledge Ontology System, is a taxonomy system that was first formalised in 2003, shortly after RDF became a standard. It has features that make it suitable for taxonomies."

---

## Guide Router

Load **only ONE guide** per request:

| User Intent | Load Guide | Content |
|-------------|------------|---------|
| Concept schemes, top concepts, scheme design | 02-CONCEPT-SCHEMES.md | ConceptScheme patterns |
| Semantic relations, broader/narrower/related | 03-SEMANTIC-RELATIONS.md | Hierarchical and associative |
| Labels, prefLabel/altLabel, multilingual | 04-LABELING.md | Lexical labels |
| Documentation, notes, definitions | 05-DOCUMENTATION.md | Note properties |
| Mapping between schemes, exactMatch | 06-MAPPING.md | Cross-scheme linking |
| Collections, ordered/unordered grouping | 07-COLLECTIONS.md | Concept grouping |
| SKOS-XL, labels as resources | 08-SKOS-XL.md | Extended labeling |
| Extended properties, tax: namespace | 09-EXTENSIONS.md | Cagle's patterns |
| AI/LLM integration, context-free queries | 10-AI-INTEGRATION.md | AI patterns |
| SHACL validation for taxonomies | 11-SHACL-VALIDATION.md | Shape constraints |
| SPARQL patterns for taxonomies | 12-SPARQL-PATTERNS.md | Query patterns |
| Best practices, design patterns | 13-BEST-PRACTICES.md | Design guidance |

---

## The Ontologist's View of Taxonomies

### Taxonomies vs. Ontologies (Cagle's Framework)

| Aspect | Taxonomy | Ontology |
|--------|----------|----------|
| **Focus** | Categories, concepts | Entities, relationships |
| **Structure** | Hierarchical (tree/forest) | Graph (networked) |
| **Primary relation** | Broader/narrower | Diverse predicates |
| **Typical role** | Classification | Description |
| **Data type** | Concepts (adjectives) | Instances (nouns) |
| **Tool** | Taxonomy management system | Ontology editor |

> "An ontologist frequently does work that overlaps with that of a taxonomist: the ontologist usually defines the language that the taxonomist uses to classify items, while the taxonomist concentrates on the meaning and interpretation of specific classifications."

### The Five-Layer Knowledge Graph (Cagle's Architecture)

```
1. Ontology Layer     → Shapes, structure (SHACL, OWL)
2. Taxonomy Layer     → Concepts, categories (SKOS)
3. Instance Layer     → Individual things (RDF data)
4. Annotation Layer   → Events, metadata (PROV-O)
5. Operational Layer  → Queries, configs (SPARQL)
```

---

## SKOS Quick Reference

### Core Vocabulary

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix skosxl: <http://www.w3.org/2008/05/skos-xl#> .
```

### Core Classes

| Class | Purpose | Notes |
|-------|---------|-------|
| `skos:Concept` | Unit of thought | Identified by URI, labeled in multiple languages |
| `skos:ConceptScheme` | Aggregation of concepts | Container for a vocabulary/taxonomy |
| `skos:Collection` | Grouped concepts | Without hierarchical implication |
| `skos:OrderedCollection` | Sequenced group | Order-significant grouping |

### Labeling Properties

| Property | Cardinality | Purpose |
|----------|-------------|---------|
| `skos:prefLabel` | One per language | Primary display label |
| `skos:altLabel` | Multiple | Synonyms, abbreviations |
| `skos:hiddenLabel` | Multiple | Search terms, misspellings |
| `skos:notation` | Multiple | Classification codes |

### Semantic Relations

```turtle
# Hierarchical (non-transitive by design)
ex:Cat skos:broader ex:Mammal .
ex:Mammal skos:narrower ex:Cat .

# Transitive variants (for inference)
ex:Cat skos:broaderTransitive ex:Animal .

# Associative (symmetric)
ex:Cat skos:related ex:Dog .
```

### Documentation Properties

```turtle
ex:Concept skos:definition "Formal meaning"@en ;
           skos:scopeNote "Usage guidance"@en ;
           skos:example "Illustrative instances"@en ;
           skos:historyNote "Historical context"@en ;
           skos:editorialNote "Internal notes"@en ;
           skos:changeNote "Version changes"@en .
```

### Mapping Properties

| Property | Transitivity | Confidence | Use Case |
|----------|--------------|------------|----------|
| `skos:exactMatch` | Transitive | High | Interchangeable concepts |
| `skos:closeMatch` | Non-transitive | Medium | Similar meaning |
| `skos:broadMatch` | Non-transitive | Hierarchical | Target is broader |
| `skos:narrowMatch` | Non-transitive | Hierarchical | Target is narrower |
| `skos:relatedMatch` | Non-transitive | Associative | Cross-scheme relation |

---

## Minimal Concept Example

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix ex: <http://example.org/> .

ex:AnimalTaxonomy a skos:ConceptScheme ;
    skos:prefLabel "Animal Classification"@en ;
    skos:hasTopConcept ex:Animal .

ex:Animal a skos:Concept ;
    skos:prefLabel "Animal"@en ;
    skos:inScheme ex:AnimalTaxonomy ;
    skos:topConceptOf ex:AnimalTaxonomy ;
    skos:definition "A living organism that feeds on organic matter"@en .

ex:Mammal a skos:Concept ;
    skos:prefLabel "Mammal"@en ;
    skos:inScheme ex:AnimalTaxonomy ;
    skos:broader ex:Animal ;
    skos:narrower ex:Cat, ex:Dog .

ex:Cat a skos:Concept ;
    skos:prefLabel "Cat"@en, "Katze"@de, "Chat"@fr ;
    skos:altLabel "Feline"@en, "Kitty"@en ;
    skos:hiddenLabel "Kat"@en ;  # Misspelling for search
    skos:inScheme ex:AnimalTaxonomy ;
    skos:broader ex:Mammal ;
    skos:related ex:Dog ;
    skos:notation "MAM-001" ;
    skos:definition "A small domesticated carnivorous mammal"@en ;
    skos:scopeNote "Use for domestic cats; wild cats use Felidae"@en .
```

---

## SKOS Integrity Constraints

The W3C SKOS specification defines critical consistency rules:

### Label Disjointness

```
# A concept cannot have identical prefLabel, altLabel, and hiddenLabel
skos:prefLabel ∩ skos:altLabel = ∅ (per concept)
skos:prefLabel ∩ skos:hiddenLabel = ∅ (per concept)
skos:altLabel ∩ skos:hiddenLabel = ∅ (per concept)
```

### Hierarchical/Associative Disjointness

```
# Broader/narrower and related are disjoint
skos:related ∩ skos:broaderTransitive = ∅
```

A concept cannot be both hierarchically and associatively related to the same concept.

### Mapping Integrity

```
# exactMatch is disjoint from hierarchical/associative mapping
skos:exactMatch ∩ skos:broadMatch = ∅
skos:exactMatch ∩ skos:narrowMatch = ∅
skos:exactMatch ∩ skos:relatedMatch = ∅
```

---

## Cagle's Extended Taxonomy Properties

Beyond core SKOS, Cagle proposes practical extensions:

```turtle
@prefix tax: <http://example.org/taxonomy#> .

# Hierarchy level (distance from root)
tax:level a owl:DatatypeProperty ;
    rdfs:domain skos:Concept ;
    rdfs:range xsd:integer .

# Lifecycle status
tax:status a owl:ObjectProperty ;
    rdfs:domain skos:Concept ;
    rdfs:range tax:Status .

tax:Active a tax:Status .
tax:Deprecated a tax:Status .
tax:Proposed a tax:Status .

# Sort order (for UI, feature weighting)
tax:sortOrder a owl:DatatypeProperty ;
    rdfs:domain skos:Concept ;
    rdfs:range xsd:integer .

# Antonym relationship
tax:antonym a owl:SymmetricProperty ;
    rdfs:domain skos:Concept ;
    rdfs:range skos:Concept .
```

### Usage

```turtle
ex:Hot a skos:Concept ;
    skos:prefLabel "Hot"@en ;
    skos:broader ex:Temperature ;
    tax:level 2 ;
    tax:status tax:Active ;
    tax:sortOrder 1 ;
    tax:antonym ex:Cold .
```

---

## AI/LLM Integration Pattern

> "The need to know a URL for a given resource has been a major roadblock in the adoption of knowledge graphs."

### Context-Free SPARQL for Taxonomies

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

# Find concepts by label without knowing URIs
SELECT ?concept ?label ?definition
WHERE {
    VALUES ?searchTerm { "cat" }
    VALUES ?labelProp { skos:prefLabel skos:altLabel rdfs:label }

    ?concept a skos:Concept ;
             ?labelProp ?label .

    FILTER (CONTAINS(LCASE(STR(?label)), LCASE(?searchTerm)))

    OPTIONAL { ?concept skos:definition ?definition }
}
LIMIT 20
```

### LLM-Friendly Taxonomy Traversal

```sparql
# Get concept with full context for LLM consumption
SELECT ?concept ?label ?definition ?broader ?narrower ?related
WHERE {
    BIND (ex:Cat AS ?concept)

    ?concept skos:prefLabel ?label .
    OPTIONAL { ?concept skos:definition ?definition }
    OPTIONAL { ?concept skos:broader/skos:prefLabel ?broader }
    OPTIONAL { ?concept skos:narrower/skos:prefLabel ?narrower }
    OPTIONAL { ?concept skos:related/skos:prefLabel ?related }

    FILTER (lang(?label) = "en")
}
```

---

## SHACL Validation for Taxonomies

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .

ex:ConceptShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;

    # Required: at least one preferred label
    sh:property [
        sh:path skos:prefLabel ;
        sh:minCount 1 ;
        sh:uniqueLang true ;
        sh:message "Concept must have at least one prefLabel, unique per language"
    ] ;

    # Required: belong to a scheme
    sh:property [
        sh:path skos:inScheme ;
        sh:minCount 1 ;
        sh:class skos:ConceptScheme ;
        sh:message "Concept must belong to a concept scheme"
    ] ;

    # Broader must reference another concept
    sh:property [
        sh:path skos:broader ;
        sh:class skos:Concept
    ] ;

    # No cycles in hierarchy
    sh:sparql [
        sh:message "Concept cannot be its own ancestor" ;
        sh:select """
            SELECT $this WHERE {
                $this skos:broader+ $this .
            }
        """
    ] .
```

---

## Linked Data and SKOS

Tim Berners-Lee's Four Principles:

1. **Use URIs as names** — Every SKOS concept has a URI
2. **Use HTTP URIs** — Enable lookup via web
3. **Provide useful information** — Return RDF when URI dereferenced
4. **Include links to other URIs** — Use mapping properties

### SKOS in the Linked Data Ecosystem

```turtle
# Link to external vocabularies
ex:Cat skos:exactMatch <http://www.wikidata.org/entity/Q146> ;
       skos:exactMatch <http://dbpedia.org/resource/Cat> ;
       skos:closeMatch <http://id.loc.gov/authorities/subjects/sh85021262> .
```

> "The Semantic Web isn't just about putting data on the web. It is about making links, so that a person or machine can explore the web of data." — Tim Berners-Lee

---

## When to Use SKOS

**Use SKOS when:**
- Building controlled vocabularies or thesauri
- Creating classification systems (product categories, topics)
- Managing multilingual terminology
- Bridging between different vocabularies
- Qualifying instance data with categorical properties
- Building navigation structures (faceted search)

**Consider OWL instead when:**
- You need automated inference and classification
- Complex property restrictions matter
- Class equivalence and disjointness are important
- You're building a formal domain model

**Use SHACL with SKOS when:**
- Validating taxonomy data quality
- Enforcing business rules on concept usage
- Constraining which taxonomy levels entities can reference

---

## Resources

### W3C Specifications
- [SKOS Reference](https://www.w3.org/TR/skos-reference/) — Complete vocabulary
- [SKOS Primer](https://www.w3.org/TR/skos-primer/) — Tutorial introduction
- [SKOS Use Cases](https://www.w3.org/TR/skos-ucr/) — Requirements document
- [Linked Data Design Issues](https://www.w3.org/DesignIssues/LinkedData.html) — Tim Berners-Lee

### ISO Standards
- ISO 25964-1:2011 — Thesauri for information retrieval
- ISO 25964-2:2013 — Thesaurus interoperability

### Books
- *Semantic Web for the Working Ontologist* by Allemang, Hendler, Gandon
- *Linked Data* by Tom Heath and Christian Bizer

### Kurt Cagle's Work
- [The Ontologist](https://ontologist.substack.com/) — Substack newsletter
- [A Taxonomy of Ontologies](https://ontologist.substack.com/p/a-taxonomy-of-ontologies)
- [SHACL and Taxonomies](https://ontologist.substack.com/p/shacl-and-taxonomies)
- [Taxonomists vs. Ontologists](https://www.linkedin.com/pulse/taxonomy-vs-ontology-whats-difference-kurt-cagle)
- [Writing Context-Free SPARQL for AI](https://ontologist.substack.com/p/writing-context-free-sparql-for-ai)
