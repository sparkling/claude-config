# OWL & Ontology Design Skill

A comprehensive skill for designing and implementing OWL 2 ontologies for knowledge representation. Covers the full spectrum from RDFS foundations through OWL's rich expressivity to the emerging shift toward SHACL. Informed by Kurt Cagle's ontologist perspective.

## Contents

| File | Description |
|------|-------------|
| `SKILL.md` | Main entry point with quick reference and guide router |
| `02-RDFS-FOUNDATIONS.md` | Core RDF Schema vocabulary and inference |
| `03-OWL-CLASSES.md` | Class expressions, restrictions, axioms |
| `04-OWL-PROPERTIES.md` | Property characteristics, chains, keys |
| `06-SKOS-TAXONOMIES.md` | Knowledge organization with SKOS |
| `08-OWL-TO-SHACL.md` | Evolution toward shapes-based validation |

## Philosophy

> "OWL is not going away, but there is definitely a shift occurring within the semantic community around the use of SHAPES, rather than classes and properties." — Kurt Cagle

This skill embodies practical wisdom from:

- **Kurt Cagle** (The Ontologist, The Cagle Report) — Evolution from OWL to SHACL
- **Allemang, Hendler & Gandon** (Semantic Web for the Working Ontologist) — Modeling patterns
- **W3C Specifications** — Authoritative syntax and semantics

## Key Concepts

### The Taxonomy of Ontologies
- Glossaries & Vocabularies
- Taxonomies (SKOS)
- Enterprise Knowledge Graphs
- Operational Ontologies (RDFS, OWL, SHACL)
- Upper Ontologies (BFO, GIST, Schema.org)

### OWL 2 Profiles

| Profile | Best For | Complexity |
|---------|----------|------------|
| OWL 2 EL | Large ontologies | PTIME |
| OWL 2 QL | SQL query rewriting | AC0 |
| OWL 2 RL | Rule-based reasoning | PTIME |
| OWL 2 DL | Full inference | 2-NEXPTIME |

### The Future is Shapes

Reasoners are fading. SPARQL is the workhorse. SHACL provides validation without the complexity of OWL inference.

## Quick Start

```turtle
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix ex: <http://example.org/> .

# Define a class
ex:Person a owl:Class ;
    rdfs:label "Person" .

# Define properties
ex:hasParent a owl:ObjectProperty ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Person ;
    owl:inverseOf ex:hasChild .

# Define a derived class
ex:Parent owl:equivalentClass [
    owl:intersectionOf (
        ex:Person
        [ a owl:Restriction ;
          owl:onProperty ex:hasChild ;
          owl:someValuesFrom ex:Person ]
    )
] .
```

## Resources

### W3C Specifications
- [OWL 2 Overview](https://www.w3.org/TR/owl2-overview/)
- [OWL 2 Primer](https://www.w3.org/TR/owl2-primer/)
- [OWL 2 Profiles](https://www.w3.org/TR/owl2-profiles/)
- [RDF Schema 1.1](https://www.w3.org/TR/rdf-schema/)
- [SKOS Reference](https://www.w3.org/TR/skos-reference/)
- [SHACL](https://www.w3.org/TR/shacl/)

### Books
- *Semantic Web for the Working Ontologist* by Allemang, Hendler, Gandon
- *Learning SPARQL* by Bob DuCharme

### Kurt Cagle's Work
- [The Ontologist](https://ontologist.substack.com/) — Substack newsletter
- [The Cagle Report](https://thecaglereport.com/) — Enterprise data and AI
