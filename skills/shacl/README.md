# SHACL Skill

A comprehensive skill for designing, implementing, and validating RDF data with the Shapes Constraint Language. Informed by Kurt Cagle's ontologist perspective and grounded in W3C specifications.

## Contents

| File | Description |
|------|-------------|
| `SKILL.md` | Main entry point with quick reference and guide router |
| `02-NODE-SHAPES.md` | Node shape fundamentals and targeting |
| `03-PROPERTY-SHAPES.md` | Property shapes and constraint patterns |
| `04-CONSTRAINT-COMPONENTS.md` | Complete constraint component reference |
| `05-PROPERTY-PATHS.md` | SHACL property path expressions |
| `06-TARGETS.md` | Focus node selection mechanisms |
| `07-VALIDATION-REPORTS.md` | Validation report structure and querying |
| `08-SHACL-SPARQL.md` | SPARQL-based constraints and custom validation |
| `09-SHACL-FOR-AI.md` | AI/LLM integration patterns |
| `10-SHACL-UI.md` | User interface generation from shapes |
| `11-SHACL-TAXONOMIES.md` | Taxonomy validation with SHACL |
| `12-BEST-PRACTICES.md` | Design patterns and best practices |

## Philosophy

> "If OWL is all about set theory, SHACL is all about graph theory." — Kurt Cagle

This skill embodies practical wisdom from:

- **Kurt Cagle** (The Ontologist, The Cagle Report) — Shape-based thinking, AI integration
- **Allemang, Hendler & Gandon** (Semantic Web for the Working Ontologist) — RDF modeling
- **W3C Specifications** — Authoritative syntax and semantics

## The Shape Paradigm

SHACL represents a fundamental shift in how we think about RDF data:

- **OWL**: Class hierarchies, inference, set theory
- **SHACL**: Structural patterns, validation, graph theory

> "A shape is, at its core, simply a pattern that is common to one or more nodes in a graph."

## Key Concepts

### Shapes vs Classes
- Classes define what things ARE
- Shapes describe what things LOOK LIKE
- Shapes can work without classes
- The same data can conform to multiple shapes

### Five Primary Uses (Cagle)
1. Data quality assurance through validation
2. Classification of unstructured data
3. Structural definition for data entry
4. Functional metadata for code generation
5. User interface scaffolding

### The Future
> "SHACL will eventually be foundational not just for RDF, but at the broader level of data design and management."

## Quick Start

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:datatype xsd:string ;
        sh:message "Person must have exactly one name"
    ] ;
    sh:property [
        sh:path ex:age ;
        sh:datatype xsd:integer ;
        sh:minInclusive 0 ;
        sh:maxInclusive 150
    ] .
```

## Resources

### W3C Specifications
- [SHACL Core](https://www.w3.org/TR/shacl/)
- [SHACL Advanced Features](https://www.w3.org/TR/shacl-af/)
- [RDF 1.1 Primer](https://www.w3.org/TR/rdf11-primer/)

### Kurt Cagle's Work
- [The Ontologist](https://ontologist.substack.com/) — Substack newsletter
- [Validating ANYTHING With SHACL](https://ontologist.substack.com/p/validating-anything-with-shacl)
- [Understanding Shapes](https://ontologist.substack.com/p/understanding-shapes)
