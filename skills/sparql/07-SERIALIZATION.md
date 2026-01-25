# RDF Serialization Formats

> "RDF is NOT a specific format - rather, RDF is a way of expressing graphs abstractly" that can be represented in approximately 35 different profiles. — Kurt Cagle

---

## Format Comparison

| Format | Use Case | Human Readable | Streaming | Standard |
|--------|----------|----------------|-----------|----------|
| **Turtle** | Hand-editing, examples | Excellent | No | W3C |
| **N-Triples** | Bulk data, processing | Poor | Yes | W3C |
| **N-Quads** | Named graphs, bulk | Poor | Yes | W3C |
| **TriG** | Named graphs, readable | Good | No | W3C |
| **JSON-LD** | Web APIs, JavaScript | Good | No | W3C |
| **RDF/XML** | Legacy, interop | Poor | Partial | W3C |
| **RDFa** | Embedded in HTML | Context-dependent | No | W3C |

---

## Turtle (Terse RDF Triple Language)

The most human-readable RDF format. Use for examples, hand-editing, and documentation.

### Prefix Declarations

```turtle
# Turtle-style (ends with period)
@prefix ex: <http://example.org/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# SPARQL-style (no period, case-insensitive)
PREFIX ex: <http://example.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
```

### Base URI

```turtle
@base <http://example.org/resources/> .

# Relative IRIs resolve against base
<person/123> a ex:Person .
# Expands to: <http://example.org/resources/person/123>
```

### Triple Patterns

```turtle
# Full triple
ex:Kurt ex:wrote ex:TheOntologist .

# Predicate shorthand: 'a' for rdf:type
ex:Kurt a ex:Person .

# Predicate lists (same subject)
ex:Kurt a ex:Person ;
        rdfs:label "Kurt Cagle" ;
        ex:founded ex:Semantical ;
        ex:writes ex:TheOntologist, ex:TheCagleReport .

# Object lists (same subject and predicate)
ex:Kurt ex:expertise ex:SPARQL, ex:RDF, ex:SHACL, ex:KnowledgeGraphs .
```

### Literals

```turtle
# Plain string
ex:Kurt rdfs:label "Kurt Cagle" .

# Language-tagged
ex:Kurt rdfs:label "Kurt Cagle"@en .
ex:Kurt rdfs:label "Kurt Cagle"@de .

# Typed literals
ex:Event ex:date "2025-12-18"^^xsd:date .
ex:Book ex:pages "350"^^xsd:integer .
ex:Item ex:price "29.99"^^xsd:decimal .

# Numeric shortcuts (auto-typed)
ex:Book ex:pages 350 .         # xsd:integer
ex:Item ex:price 29.99 .       # xsd:decimal
ex:Constant ex:value 6.022e23 . # xsd:double

# Boolean
ex:Flag ex:active true .       # xsd:boolean

# Multi-line strings
ex:Article ex:content """
This is a multi-line
string literal that preserves
line breaks.
""" .
```

### Blank Nodes

```turtle
# Labeled blank node
_:address1 a ex:Address ;
           ex:street "123 Main St" ;
           ex:city "Seattle" .

ex:Kurt ex:address _:address1 .

# Anonymous blank node (inline)
ex:Kurt ex:address [
    a ex:Address ;
    ex:street "123 Main St" ;
    ex:city "Seattle"
] .

# Multiple references to same blank node
ex:Kurt ex:homeAddress _:addr .
ex:Kurt ex:workAddress _:addr .
_:addr ex:city "Seattle" .
```

### Collections (RDF Lists)

```turtle
# Collection syntax
ex:Course ex:topics ( ex:SPARQL ex:RDF ex:OWL ex:SHACL ) .

# Expands to rdf:first/rdf:rest structure:
# _:b1 rdf:first ex:SPARQL ; rdf:rest _:b2 .
# _:b2 rdf:first ex:RDF ; rdf:rest _:b3 .
# _:b3 rdf:first ex:OWL ; rdf:rest _:b4 .
# _:b4 rdf:first ex:SHACL ; rdf:rest rdf:nil .

# Empty list
ex:EmptyThing ex:items () .  # = rdf:nil
```

### Comments

```turtle
# Single-line comments start with hash

ex:Kurt a ex:Person ;  # Inline comment
        rdfs:label "Kurt Cagle" .
```

---

## TriG (Turtle with Named Graphs)

Extends Turtle to support named graphs:

```trig
@prefix ex: <http://example.org/> .

# Default graph (no name)
ex:Kurt a ex:Person .

# Named graph
ex:Graph1 {
    ex:Kurt ex:wrote ex:TheOntologist .
    ex:TheOntologist a ex:Newsletter .
}

# Another named graph
ex:Graph2 {
    ex:Kurt ex:founded ex:Semantical .
}

# Graph with base
@base <http://example.org/data/> .
<source/wikipedia> {
    ex:Kurt rdfs:seeAlso <http://wikipedia.org/Kurt_Cagle> .
}
```

---

## N-Triples

Line-based format for streaming and bulk processing:

```ntriples
<http://example.org/Kurt> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.org/Person> .
<http://example.org/Kurt> <http://www.w3.org/2000/01/rdf-schema#label> "Kurt Cagle" .
<http://example.org/Kurt> <http://example.org/age> "55"^^<http://www.w3.org/2001/XMLSchema#integer> .
<http://example.org/Kurt> <http://www.w3.org/2000/01/rdf-schema#label> "Kurt Cagle"@en .
```

**Characteristics:**
- One triple per line
- No prefixes (full IRIs only)
- No abbreviations
- Easy to parse, split, and process in parallel

---

## N-Quads

N-Triples with named graph support:

```nquads
<http://example.org/Kurt> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.org/Person> <http://example.org/Graph1> .
<http://example.org/Kurt> <http://www.w3.org/2000/01/rdf-schema#label> "Kurt Cagle" <http://example.org/Graph1> .
<http://example.org/Kurt> <http://example.org/founded> <http://example.org/Semantical> <http://example.org/Graph2> .
```

---

## JSON-LD

RDF as JSON, ideal for web APIs and JavaScript:

### Basic Structure

```json
{
  "@context": {
    "ex": "http://example.org/",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "name": "rdfs:label",
    "wrote": { "@id": "ex:wrote", "@type": "@id" },
    "founded": { "@id": "ex:founded", "@type": "@id" }
  },
  "@id": "ex:Kurt",
  "@type": "ex:Person",
  "name": "Kurt Cagle",
  "wrote": "ex:TheOntologist",
  "founded": "ex:Semantical"
}
```

### Context Patterns

```json
{
  "@context": {
    "@vocab": "http://example.org/",
    "@base": "http://example.org/resources/",

    "name": "rdfs:label",
    "Person": "ex:Person",

    "age": {
      "@id": "ex:age",
      "@type": "xsd:integer"
    },

    "knows": {
      "@id": "foaf:knows",
      "@type": "@id",
      "@container": "@set"
    },

    "topics": {
      "@id": "ex:topics",
      "@container": "@list"
    }
  }
}
```

### Multiple Resources

```json
{
  "@context": { ... },
  "@graph": [
    {
      "@id": "ex:Kurt",
      "@type": "Person",
      "name": "Kurt Cagle"
    },
    {
      "@id": "ex:TheOntologist",
      "@type": "Newsletter",
      "name": "The Ontologist"
    }
  ]
}
```

### Named Graphs in JSON-LD

```json
{
  "@context": { ... },
  "@id": "ex:Graph1",
  "@graph": [
    {
      "@id": "ex:Kurt",
      "wrote": "ex:TheOntologist"
    }
  ]
}
```

### Framing (Reshaping JSON-LD)

```json
// Frame to reshape data
{
  "@context": { ... },
  "@type": "Person",
  "wrote": {
    "@embed": "@always"
  }
}

// Output: People with embedded works
{
  "@id": "ex:Kurt",
  "@type": "Person",
  "wrote": {
    "@id": "ex:TheOntologist",
    "@type": "Newsletter",
    "name": "The Ontologist"
  }
}
```

---

## SPARQL CONSTRUCT for Format Conversion

### Turtle Generation Pattern

```sparql
CONSTRUCT {
  ?person a ex:Person ;
          rdfs:label ?name ;
          ex:email ?email .
}
WHERE {
  ?person ex:fullName ?name .
  OPTIONAL { ?person ex:emailAddress ?email }
}
```

### JSON-LD via CONSTRUCT + Framing

```sparql
# Generate base triples
CONSTRUCT {
  ?author a ex:Author ;
          ex:name ?name ;
          ex:wrote ?book .
  ?book ex:title ?title .
}
WHERE {
  ?author a ex:Author ;
          rdfs:label ?name ;
          ex:authored ?book .
  ?book dcterms:title ?title .
}
```

Then apply JSON-LD frame to shape output.

---

## Namespace Helper Pattern (Cagle's NS Class)

For programmatic namespace management:

```javascript
class NS {
  constructor(prefixes) {
    this.prefixes = prefixes;
    this.inverse = Object.fromEntries(
      Object.entries(prefixes).map(([k, v]) => [v, k])
    );
  }

  // Generate SPARQL PREFIX declarations
  sparql() {
    return Object.entries(this.prefixes)
      .map(([prefix, iri]) => `PREFIX ${prefix}: <${iri}>`)
      .join('\n');
  }

  // IRI to CURIE
  curie(iri) {
    for (const [ns, prefix] of Object.entries(this.inverse)) {
      if (iri.startsWith(ns)) {
        return `${prefix}:${iri.slice(ns.length)}`;
      }
    }
    return `<${iri}>`;
  }

  // CURIE to IRI
  expand(curie) {
    const [prefix, local] = curie.split(':');
    return this.prefixes[prefix] ? this.prefixes[prefix] + local : curie;
  }
}

// Usage
const ns = new NS({
  ex: 'http://example.org/',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  xsd: 'http://www.w3.org/2001/XMLSchema#'
});

console.log(ns.sparql());
// PREFIX ex: <http://example.org/>
// PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
// PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

console.log(ns.curie('http://example.org/Person'));
// ex:Person
```

---

## Common Prefixes Reference

```turtle
@prefix rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:   <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:    <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:    <http://www.w3.org/2002/07/owl#> .
@prefix skos:   <http://www.w3.org/2004/02/skos/core#> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix foaf:   <http://xmlns.com/foaf/0.1/> .
@prefix schema: <http://schema.org/> .
@prefix sh:     <http://www.w3.org/ns/shacl#> .
@prefix prov:   <http://www.w3.org/ns/prov#> .
@prefix dcat:   <http://www.w3.org/ns/dcat#> .
```

---

## Format Selection Guide

| Scenario | Recommended Format |
|----------|-------------------|
| Human authoring | Turtle |
| Documentation examples | Turtle |
| Web API responses | JSON-LD |
| JavaScript applications | JSON-LD |
| Bulk data loading | N-Triples, N-Quads |
| Data exchange | Turtle or JSON-LD |
| Legacy systems | RDF/XML |
| Named graphs | TriG or N-Quads |
| Embedded in HTML | RDFa or JSON-LD |
| Configuration files | Turtle or JSON-LD |
