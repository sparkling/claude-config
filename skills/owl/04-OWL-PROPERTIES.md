# OWL Property Axioms and Characteristics

OWL provides rich vocabulary for defining property semantics, characteristics, and relationships.

---

## Property Types

### Object Properties

Connect individuals to individuals:

```turtle
ex:hasParent a owl:ObjectProperty ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Person ;
    rdfs:label "has parent" .

ex:worksFor a owl:ObjectProperty ;
    rdfs:domain ex:Employee ;
    rdfs:range ex:Organization .
```

### Data Properties

Connect individuals to literal values:

```turtle
ex:hasAge a owl:DatatypeProperty ;
    rdfs:domain ex:Person ;
    rdfs:range xsd:nonNegativeInteger .

ex:hasName a owl:DatatypeProperty ;
    rdfs:domain ex:Thing ;
    rdfs:range xsd:string .

ex:hasEmail a owl:DatatypeProperty ;
    rdfs:domain ex:Person ;
    rdfs:range xsd:string .
```

### Annotation Properties

Attach metadata without logical implications:

```turtle
ex:creator a owl:AnnotationProperty .
ex:createdDate a owl:AnnotationProperty .
ex:deprecated a owl:AnnotationProperty .

ex:Person ex:creator "Jane Ontologist" ;
          ex:createdDate "2025-01-01"^^xsd:date .
```

Built-in annotation properties:
- `rdfs:label` - Human-readable name
- `rdfs:comment` - Description
- `rdfs:seeAlso` - Related resource
- `rdfs:isDefinedBy` - Defining resource
- `owl:versionInfo` - Version information
- `owl:deprecated` - Deprecation marker

---

## Property Characteristics

### Functional Property

At most one value per subject:

```turtle
ex:hasBirthMother a owl:ObjectProperty, owl:FunctionalProperty ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Woman .

ex:hasSSN a owl:DatatypeProperty, owl:FunctionalProperty ;
    rdfs:domain ex:Person ;
    rdfs:range xsd:string .
```

**Inference**: If `x hasBirthMother y` and `x hasBirthMother z`, then `y = z`.

```manchester
ObjectProperty: hasBirthMother
    Characteristics: Functional
    Domain: Person
    Range: Woman
```

### Inverse Functional Property

At most one subject per value (unique identifier):

```turtle
ex:hasSSN a owl:DatatypeProperty, owl:InverseFunctionalProperty .
ex:hasEmail a owl:DatatypeProperty, owl:InverseFunctionalProperty .
```

**Inference**: If `x hasSSN "123"` and `y hasSSN "123"`, then `x = y`.

```manchester
ObjectProperty: hasSSN
    Characteristics: InverseFunctional
```

### Symmetric Property

Bidirectional relationship:

```turtle
ex:isMarriedTo a owl:ObjectProperty, owl:SymmetricProperty ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Person .

ex:isSiblingOf a owl:ObjectProperty, owl:SymmetricProperty .
ex:knows a owl:ObjectProperty, owl:SymmetricProperty .
```

**Inference**: If `x isMarriedTo y`, then `y isMarriedTo x`.

### Asymmetric Property (OWL 2)

Never bidirectional:

```turtle
ex:isParentOf a owl:ObjectProperty, owl:AsymmetricProperty ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Person .

ex:isOlderThan a owl:ObjectProperty, owl:AsymmetricProperty .
```

**Constraint**: Cannot have both `x isParentOf y` and `y isParentOf x`.

### Transitive Property

Chains through intermediate nodes:

```turtle
ex:isAncestorOf a owl:ObjectProperty, owl:TransitiveProperty ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Person .

ex:isPartOf a owl:ObjectProperty, owl:TransitiveProperty .
ex:isLocatedIn a owl:ObjectProperty, owl:TransitiveProperty .
```

**Inference**: If `x isAncestorOf y` and `y isAncestorOf z`, then `x isAncestorOf z`.

### Reflexive Property (OWL 2)

Everything relates to itself:

```turtle
ex:knows a owl:ObjectProperty, owl:ReflexiveProperty .
ex:hasPart a owl:ObjectProperty, owl:ReflexiveProperty .  # Everything is part of itself
```

**Inference**: For all `x`, `x knows x`.

### Irreflexive Property (OWL 2)

Nothing relates to itself:

```turtle
ex:isParentOf a owl:ObjectProperty, owl:IrreflexiveProperty .
ex:isOlderThan a owl:ObjectProperty, owl:IrreflexiveProperty .
```

**Constraint**: Cannot have `x isParentOf x`.

---

## Property Relationships

### Inverse Properties

```turtle
ex:hasChild a owl:ObjectProperty ;
    owl:inverseOf ex:hasParent .

ex:employs a owl:ObjectProperty ;
    owl:inverseOf ex:worksFor .

ex:isPartOf a owl:ObjectProperty ;
    owl:inverseOf ex:hasPart .
```

**Inference**: If `x hasChild y`, then `y hasParent x`.

```manchester
ObjectProperty: hasChild
    InverseOf: hasParent
```

### Subproperty

```turtle
ex:hasMother rdfs:subPropertyOf ex:hasParent .
ex:hasFather rdfs:subPropertyOf ex:hasParent .

ex:hasParent rdfs:subPropertyOf ex:hasAncestor .
ex:hasGrandparent rdfs:subPropertyOf ex:hasAncestor .
```

**Inference**: If `x hasMother y`, then `x hasParent y`.

### Equivalent Properties

```turtle
ex:author owl:equivalentProperty dc:creator .
ex:name owl:equivalentProperty foaf:name .
```

**Inference**: Instances of one are instances of the other.

### Disjoint Properties (OWL 2)

```turtle
ex:likes owl:propertyDisjointWith ex:hates .
ex:trusts owl:propertyDisjointWith ex:distrusts .

# Multiple disjoint
[] a owl:AllDisjointProperties ;
   owl:members ( ex:likes ex:dislikes ex:hates ) .
```

**Constraint**: Cannot have both `x likes y` and `x hates y`.

---

## Property Chains (OWL 2)

Define properties as compositions of other properties:

```turtle
# Uncle = parent's brother
ex:hasUncle owl:propertyChainAxiom ( ex:hasParent ex:hasBrother ) .

# Grandparent = parent's parent
ex:hasGrandparent owl:propertyChainAxiom ( ex:hasParent ex:hasParent ) .

# Owner of a part is owner of the whole
ex:owns owl:propertyChainAxiom ( ex:owns ex:hasPart ) .

# Colleague = works with someone at same company
ex:isColleagueOf owl:propertyChainAxiom ( ex:worksFor ex:employs ) .
```

```manchester
ObjectProperty: hasUncle
    SubPropertyChain: hasParent o hasBrother

ObjectProperty: hasGrandparent
    SubPropertyChain: hasParent o hasParent
```

### Chain Restrictions

- Chains can only be subproperties (not equivalent)
- Certain combinations with transitivity are restricted
- Chains enable powerful inference but can be expensive

---

## Keys (OWL 2)

Unique identification of individuals:

```turtle
# SSN uniquely identifies a person
ex:Person owl:hasKey ( ex:hasSSN ) .

# Department + course number identify a course
ex:Course owl:hasKey ( ex:hasDepartment ex:hasCourseNumber ) .

# ISBN identifies a book
ex:Book owl:hasKey ( ex:hasISBN ) .
```

**Inference**: If two individuals share all key values, they are the same individual.

```manchester
Class: Person
    HasKey: hasSSN

Class: Course
    HasKey: hasDepartment, hasCourseNumber
```

---

## Property Domain and Range

### Basic Declaration

```turtle
ex:hasParent a owl:ObjectProperty ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Person .
```

### Multiple Domains/Ranges (Intersection!)

```turtle
# Subject must be BOTH Employee AND Manager
ex:manages a owl:ObjectProperty ;
    rdfs:domain ex:Employee ;
    rdfs:domain ex:Manager ;
    rdfs:range ex:Employee .
```

**Warning**: Multiple domains/ranges are intersected, not unioned!

### Scoped Range (via Restriction)

```turtle
# Cats only eat CatFood (not general Food)
ex:Cat rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:eats ;
    owl:allValuesFrom ex:CatFood
] .
```

---

## Data Ranges

### Datatype Restrictions

```turtle
# Age between 0 and 150
ex:hasAge a owl:DatatypeProperty ;
    rdfs:range [
        a rdfs:Datatype ;
        owl:onDatatype xsd:integer ;
        owl:withRestrictions (
            [ xsd:minInclusive 0 ]
            [ xsd:maxInclusive 150 ]
        )
    ] .

# Non-empty string
ex:hasName a owl:DatatypeProperty ;
    rdfs:range [
        a rdfs:Datatype ;
        owl:onDatatype xsd:string ;
        owl:withRestrictions (
            [ xsd:minLength 1 ]
        )
    ] .
```

### Data One Of (Enumeration)

```turtle
ex:hasSize a owl:DatatypeProperty ;
    rdfs:range [
        a rdfs:Datatype ;
        owl:oneOf ( "small" "medium" "large" )
    ] .
```

---

## Combining Characteristics

### Family Relationships Example

```turtle
# Parent-child relationship
ex:hasParent a owl:ObjectProperty, owl:AsymmetricProperty, owl:IrreflexiveProperty ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Person ;
    owl:inverseOf ex:hasChild .

ex:hasChild a owl:ObjectProperty, owl:AsymmetricProperty, owl:IrreflexiveProperty ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Person .

# Spouse relationship
ex:hasSpouse a owl:ObjectProperty,
               owl:SymmetricProperty,
               owl:IrreflexiveProperty,
               owl:FunctionalProperty ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Person .

# Ancestor (transitive closure of parent)
ex:hasAncestor a owl:ObjectProperty,
                 owl:TransitiveProperty,
                 owl:AsymmetricProperty,
                 owl:IrreflexiveProperty ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Person .

ex:hasParent rdfs:subPropertyOf ex:hasAncestor .
```

### Part-Whole Example

```turtle
ex:hasPart a owl:ObjectProperty, owl:TransitiveProperty ;
    owl:inverseOf ex:isPartOf .

ex:hasDirectPart a owl:ObjectProperty ;
    rdfs:subPropertyOf ex:hasPart .

ex:isPartOf a owl:ObjectProperty, owl:TransitiveProperty, owl:ReflexiveProperty .
```

---

## Common Patterns

### Role Pattern

```turtle
# A person can play multiple roles
ex:playsRole a owl:ObjectProperty ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Role .

ex:Employee a owl:Class ;
    rdfs:subClassOf ex:Role .

ex:Customer a owl:Class ;
    rdfs:subClassOf ex:Role .

# Same person can be both employee and customer
ex:John ex:playsRole ex:EmployeeRole1 ;
        ex:playsRole ex:CustomerRole1 .
```

### Qualified Property

```turtle
# A person's employer (functional)
ex:hasEmployer a owl:ObjectProperty, owl:FunctionalProperty ;
    rdfs:domain ex:Employee ;
    rdfs:range ex:Organization .

# A person's employers (non-functional for contractors)
ex:worksFor a owl:ObjectProperty ;
    rdfs:domain ex:Person ;
    rdfs:range ex:Organization .
```
