---
name: owl
description: Design and implement OWL 2 ontologies for knowledge representation. Covers RDFS foundations, OWL profiles (EL, QL, RL), class expressions, property characteristics, reasoning patterns, SKOS taxonomies, and the evolving shift toward SHACL. Informed by Kurt Cagle's ontologist perspective.
allowed-tools: Read, Write, Edit, Grep, Glob, WebFetch
---

# OWL & Ontology Design Skill

Design, implement, and maintain ontologies with an ontologist's perspective. This skill embodies the practical wisdom that ontology is fundamentally about modeling the meaningful relationships between things—and recognizing that the field is evolving from class-centric OWL toward shape-centric SHACL.

---

## Core Philosophy (Cagle's Principles)

> "OWL is not going away, but there is definitely a shift occurring within the semantic community around the use of SHAPES, rather than classes and properties."

**Key Insights:**

1. **RDFS does more than you think**: "It is possible to do a surprising amount with even the minimal set of RDFS"
2. **OWL brought inference power**: "Most of the real power came from the introduction of OWL, which established inferential predicates that trigger rules generating additional triples"
3. **Reasoners are fading**: "Reasoners are disappearing from newer knowledge graph systems, partly because SPARQL and SPARQL Update are more targeted"
4. **The future is shapes**: "SHACL represents a shift by the W3C away from OWL2 and towards a workflow that takes advantage of SPARQL"
5. **Learn all three**: "Learn SHACL, RDFS and OWL. These are the languages that underlie almost the entire RDF stack"

---

## Guide Router

Load **only ONE guide** per request:

| User Intent | Load Guide | Content |
|-------------|------------|---------|
| RDFS basics, subclass, property definitions | 02-RDFS-FOUNDATIONS.md | Core RDF Schema vocabulary |
| OWL classes, expressions, restrictions | 03-OWL-CLASSES.md | Class axioms and expressions |
| OWL properties, characteristics, chains | 04-OWL-PROPERTIES.md | Property axioms and features |
| OWL profiles (EL, QL, RL), choosing profiles | 05-OWL-PROFILES.md | Profile selection and constraints |
| SKOS taxonomies, concept schemes | 06-SKOS-TAXONOMIES.md | Knowledge organization systems |
| Reasoning, inference, entailment | 07-REASONING-INFERENCE.md | Logical consequences |
| OWL vs SHACL, migration patterns | 08-OWL-TO-SHACL.md | Modern validation approaches |
| Ontology design patterns | 09-DESIGN-PATTERNS.md | Reusable modeling solutions |
| Manchester syntax, Turtle for OWL | 10-SYNTAX-FORMATS.md | Serialization formats |
| Upper ontologies, reuse, imports | 11-ONTOLOGY-REUSE.md | Building on existing work |

---

## The Ontology Landscape

### Taxonomy of Ontologies (Cagle's Classification)

| Type | Description | Examples |
|------|-------------|----------|
| **Glossaries/Vocabularies** | Term lists with definitions | Wikipedia, Wikidata |
| **Taxonomies** | Hierarchical classifications | Linnaeus, SKOS schemes |
| **Enterprise KGs** | Domain-specific entity graphs | Customer, product, org models |
| **Operational Ontologies** | Meta-modeling frameworks | RDFS, OWL, SHACL, PROV-O |
| **Upper Ontologies** | Abstract concept toolkits | BFO, GIST, Schema.org |
| **Data Catalogues** | Metadata about data assets | DCAT, schema registries |

### The RDFS → OWL → SHACL Evolution

```
RDFS (2000)          OWL (2004/2009)         SHACL (2017)
    │                      │                      │
    │ Basic typing         │ Rich inference       │ Flexible validation
    │ rdfs:Class           │ owl:Class            │ sh:NodeShape
    │ rdfs:subClassOf      │ owl:equivalentClass  │ sh:targetClass
    │ rdfs:domain/range    │ owl:Restriction      │ sh:property
    │                      │ Reasoners required   │ SPARQL-based
    │                      │                      │
    └──────────────────────┴──────────────────────┘
                     Knowledge Graphs Today
```

---

## RDFS Quick Reference

RDF Schema provides the foundational vocabulary for typing and hierarchy.

### Core Classes

```turtle
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

# rdfs:Resource - Everything
# rdfs:Class - The class of classes
# rdfs:Literal - String/numeric values
# rdf:Property - The class of properties
# rdfs:Datatype - Typed literal classes
```

### Core Properties

| Property | Domain | Range | Purpose |
|----------|--------|-------|---------|
| `rdf:type` | Resource | Class | Class membership |
| `rdfs:subClassOf` | Class | Class | Class hierarchy (transitive) |
| `rdfs:subPropertyOf` | Property | Property | Property hierarchy (transitive) |
| `rdfs:domain` | Property | Class | Subject type constraint |
| `rdfs:range` | Property | Class | Object type constraint |
| `rdfs:label` | Resource | Literal | Human-readable name |
| `rdfs:comment` | Resource | Literal | Description |
| `rdfs:seeAlso` | Resource | Resource | Related information |
| `rdfs:isDefinedBy` | Resource | Resource | Defining resource |

### RDFS Example

```turtle
@prefix ex: <http://example.org/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

ex:Person a rdfs:Class ;
    rdfs:label "Person" ;
    rdfs:comment "A human being" .

ex:Employee a rdfs:Class ;
    rdfs:subClassOf ex:Person ;
    rdfs:label "Employee" .

ex:worksFor a rdf:Property ;
    rdfs:domain ex:Employee ;
    rdfs:range ex:Organization ;
    rdfs:label "works for" .
```

### RDFS Inference Rules

| Pattern | Infers |
|---------|--------|
| `?x rdf:type ?C . ?C rdfs:subClassOf ?D` | `?x rdf:type ?D` |
| `?x ?p ?y . ?p rdfs:subPropertyOf ?q` | `?x ?q ?y` |
| `?x ?p ?y . ?p rdfs:domain ?C` | `?x rdf:type ?C` |
| `?x ?p ?y . ?p rdfs:range ?C` | `?y rdf:type ?C` |

---

## OWL 2 Quick Reference

OWL extends RDFS with rich class expressions and property characteristics.

### Built-in Classes

```turtle
owl:Thing        # Universal class (everything)
owl:Nothing      # Empty class (nothing)
```

### Class Axioms

```turtle
# Subclass
ex:Student rdfs:subClassOf ex:Person .

# Equivalence (bidirectional subclass)
ex:Human owl:equivalentClass ex:Person .

# Disjointness (no shared members)
ex:Cat owl:disjointWith ex:Dog .

# Disjoint Union (partitions a class)
ex:Animal owl:disjointUnionOf ( ex:Mammal ex:Bird ex:Fish ex:Reptile ) .
```

### Class Expressions (Turtle)

```turtle
@prefix owl: <http://www.w3.org/2002/07/owl#> .

# Intersection (AND)
ex:WorkingParent owl:equivalentClass [
    owl:intersectionOf ( ex:Person
                         [ a owl:Restriction ;
                           owl:onProperty ex:hasChild ;
                           owl:someValuesFrom ex:Person ]
                         [ a owl:Restriction ;
                           owl:onProperty ex:hasJob ;
                           owl:someValuesFrom ex:Job ] )
] .

# Union (OR)
ex:Parent owl:equivalentClass [
    owl:unionOf ( ex:Mother ex:Father )
] .

# Complement (NOT)
ex:NonParent owl:equivalentClass [
    owl:complementOf ex:Parent
] .

# Enumeration (one of)
ex:PrimaryColor owl:equivalentClass [
    owl:oneOf ( ex:Red ex:Blue ex:Yellow )
] .
```

### Property Restrictions

```turtle
# Existential (some)
ex:Parent owl:equivalentClass [
    a owl:Restriction ;
    owl:onProperty ex:hasChild ;
    owl:someValuesFrom ex:Person
] .

# Universal (only/all)
ex:HappyParent rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:hasChild ;
    owl:allValuesFrom ex:HappyPerson
] .

# Exact cardinality
ex:Couple rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:hasMember ;
    owl:cardinality "2"^^xsd:nonNegativeInteger
] .

# Min/Max cardinality
ex:LargeFamily rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:hasChild ;
    owl:minCardinality "3"^^xsd:nonNegativeInteger
] .

# Has value
ex:BostonResident rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:livesIn ;
    owl:hasValue ex:Boston
] .

# Self restriction
ex:Narcissist owl:equivalentClass [
    a owl:Restriction ;
    owl:onProperty ex:loves ;
    owl:hasSelf true
] .
```

### Qualified Cardinality (OWL 2)

```turtle
# At least 2 children who are students
ex:ProudParent rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:hasChild ;
    owl:minQualifiedCardinality "2"^^xsd:nonNegativeInteger ;
    owl:onClass ex:Student
] .
```

---

## Property Characteristics

### Object Property Features

```turtle
# Functional (at most one value)
ex:hasBirthMother a owl:FunctionalProperty .

# Inverse Functional (at most one subject per value)
ex:hasSocialSecurityNumber a owl:InverseFunctionalProperty .

# Symmetric (bidirectional)
ex:isMarriedTo a owl:SymmetricProperty .

# Asymmetric (never bidirectional)
ex:isParentOf a owl:AsymmetricProperty .

# Transitive (chains)
ex:isAncestorOf a owl:TransitiveProperty .

# Reflexive (everything relates to itself)
ex:knows a owl:ReflexiveProperty .

# Irreflexive (nothing relates to itself)
ex:isParentOf a owl:IrreflexiveProperty .
```

### Property Relationships

```turtle
# Inverse properties
ex:hasParent owl:inverseOf ex:hasChild .

# Equivalent properties
ex:creator owl:equivalentProperty dc:creator .

# Subproperty
ex:hasMother rdfs:subPropertyOf ex:hasParent .

# Disjoint properties (OWL 2)
ex:likes owl:propertyDisjointWith ex:hates .
```

### Property Chains (OWL 2)

```turtle
# uncle = parent's brother
ex:hasUncle owl:propertyChainAxiom ( ex:hasParent ex:hasBrother ) .

# grandparent = parent's parent
ex:hasGrandparent owl:propertyChainAxiom ( ex:hasParent ex:hasParent ) .
```

### Keys (OWL 2)

```turtle
# Social security number uniquely identifies a person
ex:Person owl:hasKey ( ex:hasSocialSecurityNumber ) .

# Composite key
ex:Course owl:hasKey ( ex:hasDepartment ex:hasCourseNumber ) .
```

---

## OWL 2 Profiles

Choose the right profile based on your needs:

| Profile | Best For | Reasoning Complexity | Key Trade-offs |
|---------|----------|---------------------|----------------|
| **OWL 2 Full** | Maximum expressivity | Undecidable | No guarantees |
| **OWL 2 DL** | Rich inference | 2-NEXPTIME | Full OWL with restrictions |
| **OWL 2 EL** | Large ontologies | PTIME | No negation, no universals |
| **OWL 2 QL** | Query rewriting to SQL | AC0 (data) | Very limited expressivity |
| **OWL 2 RL** | Rule-based reasoning | PTIME (data) | Limited class expressions |

### Profile Selection Guide

```
Do you need SQL query rewriting?
├── Yes → OWL 2 QL
└── No → Do you have millions of classes?
         ├── Yes → OWL 2 EL
         └── No → Do you need rule-based implementation?
                  ├── Yes → OWL 2 RL
                  └── No → OWL 2 DL
```

### Profile Feature Comparison

| Feature | EL | QL | RL |
|---------|----|----|-----|
| Intersection | ✓ | ✓ | ✓ |
| Union | ✗ | ✗ | ✓ (limited) |
| Complement | ✗ | ✗ | ✓ (limited) |
| Existential (some) | ✓ | ✗ | ✓ |
| Universal (all) | ✗ | ✗ | ✓ |
| Inverse properties | ✗ | ✓ | ✓ |
| Transitivity | ✓ | ✗ | ✓ |
| Property chains | ✓ | ✗ | ✓ |
| Cardinality | ✗ | ✗ | 0/1 only |
| Keys | ✓ | ✗ | ✗ |

---

## SKOS Quick Reference

Simple Knowledge Organization System for taxonomies and controlled vocabularies.

### Core Classes

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .

skos:Concept           # A unit of thought
skos:ConceptScheme     # An aggregation of concepts
skos:Collection        # A group of concepts
skos:OrderedCollection # An ordered group
```

### Labeling

```turtle
ex:Cat a skos:Concept ;
    skos:prefLabel "Cat"@en, "Katze"@de ;
    skos:altLabel "Feline"@en, "Kitty"@en ;
    skos:hiddenLabel "Kat"@en .  # For search, misspellings
```

### Semantic Relations

```turtle
# Hierarchy (non-transitive by design)
ex:Mammal skos:broader ex:Animal .
ex:Cat skos:broader ex:Mammal .

# Transitive closure (for query expansion)
ex:Cat skos:broaderTransitive ex:Mammal, ex:Animal .

# Association (symmetric)
ex:Cat skos:related ex:Dog .
```

### Documentation

```turtle
ex:Cat a skos:Concept ;
    skos:definition "A small domesticated carnivorous mammal"@en ;
    skos:scopeNote "Use for domestic cats only"@en ;
    skos:example "Persian, Siamese, Tabby"@en ;
    skos:historyNote "Added in version 1.0"@en ;
    skos:editorialNote "Review needed"@en ;
    skos:changeNote "Broader term changed 2024-01"@en ;
    skos:notation "CAT-001" .
```

### Concept Schemes

```turtle
ex:AnimalTaxonomy a skos:ConceptScheme ;
    skos:prefLabel "Animal Classification"@en ;
    skos:hasTopConcept ex:Animal .

ex:Animal a skos:Concept ;
    skos:inScheme ex:AnimalTaxonomy ;
    skos:topConceptOf ex:AnimalTaxonomy .
```

### Mapping Between Schemes

```turtle
# High confidence - interchangeable
ex:Cat skos:exactMatch wikidata:Q146 .

# Similar but not identical
ex:Feline skos:closeMatch dbpedia:Cat .

# Cross-scheme hierarchy
ex:Cat skos:broadMatch ex:Pet .
ex:Siamese skos:narrowMatch ex:Cat .
```

---

## Manchester Syntax Quick Reference

Human-readable OWL syntax used in Protégé and documentation.

### Class Expressions

```manchester
Class: Parent
    EquivalentTo: Person and hasChild some Person

Class: HappyParent
    SubClassOf: Parent and hasChild only HappyPerson

Class: Orphan
    EquivalentTo: Person and not (hasParent some Person)

Class: PrimaryColor
    EquivalentTo: {Red, Blue, Yellow}

Class: LargeFamily
    SubClassOf: hasChild min 3 Person
```

### Property Definitions

```manchester
ObjectProperty: hasParent
    Domain: Person
    Range: Person
    InverseOf: hasChild

ObjectProperty: hasAncestor
    SubPropertyOf: hasParent
    Characteristics: Transitive

ObjectProperty: hasSpouse
    Domain: Person
    Range: Person
    Characteristics: Symmetric, Functional

ObjectProperty: hasUncle
    SubPropertyChain: hasParent o hasBrother
```

### Individual Assertions

```manchester
Individual: John
    Types: Person, Parent
    Facts: hasChild Mary, hasChild Bob, hasAge 45

Individual: Mary
    Types: Student
    Facts: hasParent John
    SameAs: MarySmith
    DifferentFrom: MaryJones
```

---

## The Shift to SHACL (Cagle's Perspective)

> "SHACL represents a shift by the W3C away from OWL2 and towards a workflow that takes advantage of the power and expressiveness of SPARQL."

### OWL vs SHACL Comparison

| Aspect | OWL | SHACL |
|--------|-----|-------|
| Purpose | Inference & classification | Validation & constraints |
| Approach | Forward-chaining rules | SPARQL-based checking |
| Invalid data | Prevents storage | Allows storage, reports issues |
| Severity | Binary (valid/invalid) | Graduated (error/warning/info) |
| Closed world | No (open world assumption) | Optional per shape |
| Implementation | Requires reasoner | SPARQL engine sufficient |

### When to Use Each

**Use OWL when:**
- You need automated classification
- Inference is core to your use case
- You're building a formal ontology
- Interoperability with OWL tools matters

**Use SHACL when:**
- You need data validation
- You want graduated severity levels
- Your data may be incomplete
- You're integrating with SPARQL workflows
- You need closed-world validation

### Migration Pattern

```turtle
# OWL restriction
ex:Person rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:hasName ;
    owl:minCardinality 1
] .

# Equivalent SHACL shape
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:hasName ;
        sh:minCount 1 ;
        sh:severity sh:Violation ;
        sh:message "Person must have at least one name"
    ] .
```

---

## Common Ontology Patterns

### Value Partition

Exhaustive, mutually exclusive categories:

```turtle
# Values must be exactly one of these
ex:HealthStatus owl:equivalentClass [
    owl:unionOf ( ex:Healthy ex:Sick ex:Deceased )
] .

ex:Healthy owl:disjointWith ex:Sick, ex:Deceased .
ex:Sick owl:disjointWith ex:Deceased .
```

### N-ary Relation

When a relationship needs attributes:

```turtle
# Instead of: ex:John ex:bought ex:Book .
# Use an intermediate node:

ex:Purchase1 a ex:Purchase ;
    ex:buyer ex:John ;
    ex:item ex:Book ;
    ex:price "29.99"^^xsd:decimal ;
    ex:date "2025-01-15"^^xsd:date .
```

### Class as Property Value

When a class itself is a value:

```turtle
# Approach 1: Instance representing the class
ex:LionSpecies a ex:Species ;
    rdfs:label "Lion" ;
    ex:scientificName "Panthera leo" .

ex:Simba a ex:Animal ;
    ex:hasSpecies ex:LionSpecies .

# Approach 2: Punning (OWL 2)
ex:Lion a owl:Class, ex:Species .
```

### Defined vs Primitive Classes

```turtle
# Primitive: necessary conditions only
ex:Person a owl:Class .
ex:Person rdfs:subClassOf ex:Agent .

# Defined: necessary and sufficient
ex:Parent owl:equivalentClass [
    owl:intersectionOf (
        ex:Person
        [ a owl:Restriction ;
          owl:onProperty ex:hasChild ;
          owl:someValuesFrom ex:Person ]
    )
] .
```

---

## Best Practices (Allemang & Hendler)

### Modeling Principles

1. **Model what you know**: Don't over-specify
2. **Use equivalentClass for definitions**: Enables classification
3. **Use subClassOf for constraints**: Necessary conditions
4. **Prefer object properties**: Richer semantics than data properties
5. **Avoid overloading classes**: "One of the biggest problems that OWL has"

### Common Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Everything is a class | Over-classification | Use individuals for instances |
| Deep hierarchies | Brittle, hard to maintain | Flatten with properties |
| Domain/range as constraints | Inference, not validation | Use SHACL instead |
| Ignoring open world | Unexpected inferences | Document assumptions |

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Classes | TitleCase | `Person`, `Organization` |
| Properties | camelCase | `hasParent`, `worksFor` |
| Individuals | TitleCase or camelCase | `JohnSmith`, `unitedStates` |
| Namespaces | Lowercase with path | `http://example.org/ontology/` |

---

## Tools and Resources

### Ontology Editors
- **Protégé**: Industry standard, supports OWL 2
- **TopBraid Composer**: Enterprise features, SHACL support
- **WebVOWL**: Visualization

### Reasoners
- **HermiT**: OWL 2 DL, tableau-based
- **Pellet/Stardog**: OWL 2 DL, commercial
- **ELK**: OWL 2 EL, very fast
- **RDFox**: OWL 2 RL, rule-based

### Resources

#### W3C Specifications
- [OWL 2 Overview](https://www.w3.org/TR/owl2-overview/)
- [OWL 2 Primer](https://www.w3.org/TR/owl2-primer/)
- [OWL 2 Profiles](https://www.w3.org/TR/owl2-profiles/)
- [RDF Schema 1.1](https://www.w3.org/TR/rdf-schema/)
- [SKOS Reference](https://www.w3.org/TR/skos-reference/)
- [SHACL](https://www.w3.org/TR/shacl/)

#### Books
- *Semantic Web for the Working Ontologist* by Allemang, Hendler, Gandon
- *Learning SPARQL* by Bob DuCharme

#### Kurt Cagle's Work
- [The Ontologist](https://ontologist.substack.com/)
- [The Cagle Report](https://thecaglereport.com/)
