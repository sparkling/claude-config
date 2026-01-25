# RDFS Foundations

> "It is possible to do a surprising amount with even the minimal set of RDFS" — Kurt Cagle

RDF Schema provides the foundational vocabulary for typing, hierarchy, and basic inference in the semantic web stack.

---

## Core Vocabulary

### Classes

| Class | Description |
|-------|-------------|
| `rdfs:Resource` | The class of everything—all things are resources |
| `rdfs:Class` | The class of classes (metaclass) |
| `rdfs:Literal` | The class of literal values (strings, numbers) |
| `rdfs:Datatype` | The class of datatypes (subclass of Class) |
| `rdf:Property` | The class of properties |

### Class Relationships

```turtle
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .

# Everything is a Resource
rdfs:Class rdfs:subClassOf rdfs:Resource .
rdfs:Literal rdfs:subClassOf rdfs:Resource .
rdf:Property rdfs:subClassOf rdfs:Resource .

# Class hierarchy
rdfs:Datatype rdfs:subClassOf rdfs:Class .
```

---

## Property Vocabulary

### Core Properties

| Property | Domain | Range | Purpose |
|----------|--------|-------|---------|
| `rdf:type` | Resource | Class | Asserts class membership |
| `rdfs:subClassOf` | Class | Class | Establishes class hierarchy |
| `rdfs:subPropertyOf` | Property | Property | Establishes property hierarchy |
| `rdfs:domain` | Property | Class | Constrains property subjects |
| `rdfs:range` | Property | Class | Constrains property objects |

### Documentation Properties

| Property | Domain | Range | Purpose |
|----------|--------|-------|---------|
| `rdfs:label` | Resource | Literal | Human-readable name |
| `rdfs:comment` | Resource | Literal | Description/documentation |
| `rdfs:seeAlso` | Resource | Resource | Related resource |
| `rdfs:isDefinedBy` | Resource | Resource | Defining resource |

### Utility Properties

| Property | Purpose |
|----------|---------|
| `rdfs:member` | Container membership |
| `rdf:value` | Principal value of a resource |

---

## Defining Classes

### Basic Class Definition

```turtle
@prefix ex: <http://example.org/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

ex:Person a rdfs:Class ;
    rdfs:label "Person"@en ;
    rdfs:comment "A human being"@en ;
    rdfs:isDefinedBy <http://example.org/ontology> .
```

### Class Hierarchy

```turtle
# Superclass
ex:LivingThing a rdfs:Class ;
    rdfs:label "Living Thing" .

# Subclasses
ex:Animal a rdfs:Class ;
    rdfs:subClassOf ex:LivingThing ;
    rdfs:label "Animal" .

ex:Plant a rdfs:Class ;
    rdfs:subClassOf ex:LivingThing ;
    rdfs:label "Plant" .

# Further specialization
ex:Mammal a rdfs:Class ;
    rdfs:subClassOf ex:Animal ;
    rdfs:label "Mammal" .

ex:Cat a rdfs:Class ;
    rdfs:subClassOf ex:Mammal ;
    rdfs:label "Cat" .
```

### Multiple Inheritance

```turtle
# A class can have multiple superclasses
ex:Amphibian a rdfs:Class ;
    rdfs:subClassOf ex:LandAnimal ;
    rdfs:subClassOf ex:WaterAnimal ;
    rdfs:label "Amphibian" .
```

---

## Defining Properties

### Basic Property Definition

```turtle
ex:name a rdf:Property ;
    rdfs:label "name"@en ;
    rdfs:comment "The name of a resource"@en ;
    rdfs:domain ex:Person ;
    rdfs:range rdfs:Literal .
```

### Property Hierarchy

```turtle
# General property
ex:hasRelative a rdf:Property ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Person .

# Specialized properties
ex:hasParent a rdf:Property ;
    rdfs:subPropertyOf ex:hasRelative ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Person .

ex:hasSibling a rdf:Property ;
    rdfs:subPropertyOf ex:hasRelative ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Person .

# Further specialization
ex:hasMother a rdf:Property ;
    rdfs:subPropertyOf ex:hasParent .

ex:hasFather a rdf:Property ;
    rdfs:subPropertyOf ex:hasParent .
```

### Domain and Range

```turtle
# Single domain and range
ex:worksFor a rdf:Property ;
    rdfs:domain ex:Employee ;
    rdfs:range ex:Organization .

# Multiple domains (interpreted as intersection)
ex:salary a rdf:Property ;
    rdfs:domain ex:Employee ;
    rdfs:domain ex:Contractor ;  # Subject is BOTH Employee AND Contractor
    rdfs:range xsd:decimal .

# Multiple ranges (interpreted as intersection)
ex:produces a rdf:Property ;
    rdfs:domain ex:Factory ;
    rdfs:range ex:Product ;
    rdfs:range ex:PhysicalObject .  # Object is BOTH Product AND PhysicalObject
```

**Important**: Multiple domain/range declarations are intersected, not unioned. This is often misunderstood!

---

## RDFS Inference Rules

### Type Propagation via Subclass

```
Given: ?x rdf:type ?C .
       ?C rdfs:subClassOf ?D .
Infer: ?x rdf:type ?D .
```

Example:
```turtle
# Data
ex:Whiskers rdf:type ex:Cat .
ex:Cat rdfs:subClassOf ex:Mammal .
ex:Mammal rdfs:subClassOf ex:Animal .

# Inferred
ex:Whiskers rdf:type ex:Mammal .
ex:Whiskers rdf:type ex:Animal .
```

### Property Propagation via Subproperty

```
Given: ?x ?p ?y .
       ?p rdfs:subPropertyOf ?q .
Infer: ?x ?q ?y .
```

Example:
```turtle
# Data
ex:John ex:hasMother ex:Mary .
ex:hasMother rdfs:subPropertyOf ex:hasParent .
ex:hasParent rdfs:subPropertyOf ex:hasRelative .

# Inferred
ex:John ex:hasParent ex:Mary .
ex:John ex:hasRelative ex:Mary .
```

### Type Inference via Domain

```
Given: ?x ?p ?y .
       ?p rdfs:domain ?C .
Infer: ?x rdf:type ?C .
```

Example:
```turtle
# Data
ex:John ex:worksFor ex:Acme .
ex:worksFor rdfs:domain ex:Employee .

# Inferred
ex:John rdf:type ex:Employee .
```

### Type Inference via Range

```
Given: ?x ?p ?y .
       ?p rdfs:range ?C .
Infer: ?y rdf:type ?C .
```

Example:
```turtle
# Data
ex:John ex:worksFor ex:Acme .
ex:worksFor rdfs:range ex:Organization .

# Inferred
ex:Acme rdf:type ex:Organization .
```

---

## Domain/Range: Inference vs Validation

**Critical Understanding**: In RDFS (and OWL), domain and range are **not constraints**—they enable **inference**.

### The Inference Interpretation

```turtle
# Schema
ex:hasPet rdfs:domain ex:Person .
ex:hasPet rdfs:range ex:Animal .

# Data (note: no explicit types)
ex:Thing1 ex:hasPet ex:Thing2 .

# Inferred (not an error!)
ex:Thing1 rdf:type ex:Person .
ex:Thing2 rdf:type ex:Animal .
```

### The Validation Trap

Many developers expect domain/range to validate:

```turtle
# Schema
ex:hasPet rdfs:domain ex:Person .

# Data
ex:MyRock ex:hasPet ex:Pebble .
ex:MyRock rdf:type ex:Rock .

# NOT an error! Instead infers:
ex:MyRock rdf:type ex:Person .
# (MyRock is now both a Rock and a Person)
```

### For Actual Validation, Use SHACL

```turtle
ex:HasPetShape a sh:PropertyShape ;
    sh:path ex:hasPet ;
    sh:class ex:Person ;  # Subject must be Person
    sh:node [
        sh:class ex:Animal  # Object must be Animal
    ] ;
    sh:severity sh:Violation .
```

---

## Containers and Collections

### RDF Containers

```turtle
# Bag (unordered)
ex:MyBag a rdf:Bag ;
    rdf:_1 ex:Item1 ;
    rdf:_2 ex:Item2 ;
    rdf:_3 ex:Item3 .

# Seq (ordered)
ex:MySeq a rdf:Seq ;
    rdf:_1 ex:First ;
    rdf:_2 ex:Second ;
    rdf:_3 ex:Third .

# Alt (alternatives)
ex:MyAlt a rdf:Alt ;
    rdf:_1 "Primary choice" ;
    rdf:_2 "Alternative 1" ;
    rdf:_3 "Alternative 2" .
```

### RDF Collections (Lists)

```turtle
# Turtle shorthand
ex:Subject ex:hasItems ( ex:A ex:B ex:C ) .

# Expands to:
ex:Subject ex:hasItems _:list1 .
_:list1 rdf:first ex:A ;
        rdf:rest _:list2 .
_:list2 rdf:first ex:B ;
        rdf:rest _:list3 .
_:list3 rdf:first ex:C ;
        rdf:rest rdf:nil .
```

---

## Reification

Making statements about statements:

```turtle
# Original statement
ex:John ex:said ex:Claim1 .

# Reified statement
ex:Statement1 a rdf:Statement ;
    rdf:subject ex:Earth ;
    rdf:predicate ex:shape ;
    rdf:object ex:Round ;
    ex:assertedBy ex:Scientist ;
    ex:assertedOn "2025-01-01"^^xsd:date .
```

**Note**: RDF-star provides a more elegant solution for this pattern.

---

## Best Practices

### 1. Document Everything

```turtle
ex:Person a rdfs:Class ;
    rdfs:label "Person"@en, "Persona"@es, "Personne"@fr ;
    rdfs:comment "A human being, alive or deceased"@en ;
    rdfs:seeAlso <http://schema.org/Person> ;
    rdfs:isDefinedBy ex: .
```

### 2. Use Subclass Appropriately

```turtle
# Good: True taxonomic relationship
ex:Cat rdfs:subClassOf ex:Mammal .

# Bad: Attribute masquerading as class
ex:RedCar rdfs:subClassOf ex:Car .  # Use property instead
```

### 3. Be Careful with Multiple Domains/Ranges

```turtle
# This means subject must be BOTH types (intersection)
ex:teaches rdfs:domain ex:Person ;
           rdfs:domain ex:Professor .
# Better: use just the most specific
ex:teaches rdfs:domain ex:Professor .
```

### 4. Consider When to Stop at RDFS

RDFS is sufficient when:
- You need basic typing and hierarchy
- Inference requirements are simple
- Tooling support for OWL isn't available
- Performance is critical
