# SKOS Skill

A comprehensive skill for designing, implementing, and managing knowledge organization systems with SKOS (Simple Knowledge Organization System).

## Overview

This skill provides guidance for building taxonomies, thesauri, and controlled vocabularies using the W3C SKOS standard. It embodies the practical wisdom of ontologists, particularly drawing from Kurt Cagle's writings on semantic technologies and knowledge graphs.

## Core Philosophy

> "Taxonomies can, at their core, be considered lists of concepts or categories, whereas instance data are lists of things." — Kurt Cagle

SKOS taxonomies are fundamentally different from instance data:
- **Concepts** qualify and classify entities (adjectives)
- **Instances** represent individual things (nouns)

## When to Use This Skill

Use this skill when you need to:
- Design controlled vocabularies or thesauri
- Build product category taxonomies
- Create subject classification systems
- Manage multilingual terminology
- Map between different vocabularies
- Validate taxonomy data with SHACL
- Integrate taxonomies with AI/LLM systems

## Guide Structure

| File | Content |
|------|---------|
| `SKILL.md` | Main entry point, quick reference, core concepts |
| `02-CONCEPT-SCHEMES.md` | ConceptScheme design, top concepts, versioning |
| `03-SEMANTIC-RELATIONS.md` | Broader/narrower/related, transitivity |
| `04-LABELING.md` | prefLabel, altLabel, hiddenLabel, notation |
| `05-DOCUMENTATION.md` | Definition, scopeNote, changeNote, etc. |
| `06-MAPPING.md` | exactMatch, closeMatch, cross-scheme linking |
| `07-COLLECTIONS.md` | Grouped and ordered concept sets |
| `08-SKOS-XL.md` | Labels as resources, label metadata |
| `09-EXTENSIONS.md` | Cagle's tax: namespace extensions |
| `10-AI-INTEGRATION.md` | Context-free SPARQL, RAG patterns |
| `11-SHACL-VALIDATION.md` | Validating taxonomies with SHACL |
| `12-SPARQL-PATTERNS.md` | Common queries for taxonomies |
| `13-BEST-PRACTICES.md` | Design patterns and anti-patterns |

## Key Concepts

### Concept vs Instance

```turtle
# Concept (category) - in taxonomy
ex:Laptop a skos:Concept ;
    skos:prefLabel "Laptop"@en ;
    skos:inScheme ex:ProductTaxonomy .

# Instance (thing) - in data
ex:MacBookPro16 a ex:Product ;
    ex:category ex:Laptop .
```

### Semantic Relations

```turtle
# Hierarchy
ex:Cat skos:broader ex:Mammal .

# Association
ex:Cat skos:related ex:Dog .

# Mapping
ex:Cat skos:exactMatch wd:Q146 .
```

### Labeling

```turtle
ex:Cat skos:prefLabel "Cat"@en ;       # Display label
       skos:altLabel "Feline"@en ;      # Synonym
       skos:hiddenLabel "Kat"@en .      # Search term
```

## Integration with Other Skills

- **SPARQL Skill** — Query taxonomies, traverse hierarchies
- **SHACL Skill** — Validate taxonomy data, enforce business rules
- **OWL Skill** — Formal ontology modeling (when inference needed)

## Resources

### W3C Specifications
- [SKOS Reference](https://www.w3.org/TR/skos-reference/)
- [SKOS Primer](https://www.w3.org/TR/skos-primer/)

### Kurt Cagle's Work
- [The Ontologist](https://ontologist.substack.com/)
- [A Taxonomy of Ontologies](https://ontologist.substack.com/p/a-taxonomy-of-ontologies)
- [SHACL and Taxonomies](https://ontologist.substack.com/p/shacl-and-taxonomies)

## Quick Start

1. **Read SKILL.md** for core concepts and quick reference
2. **Start with 02-CONCEPT-SCHEMES.md** to design your taxonomy structure
3. **Use 03-SEMANTIC-RELATIONS.md** for hierarchy patterns
4. **Apply 11-SHACL-VALIDATION.md** for data quality
5. **Reference 13-BEST-PRACTICES.md** throughout development
