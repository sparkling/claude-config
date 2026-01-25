# OWL Class Expressions and Axioms

OWL extends RDFS with rich class expressions enabling complex definitions and automated reasoning.

---

## Class Expression Types

### Atomic Classes

```turtle
# Named class
ex:Person a owl:Class .

# Built-in classes
owl:Thing   # Universal class - everything
owl:Nothing # Empty class - nothing
```

### Boolean Combinations

#### Intersection (AND)

All conditions must hold:

```turtle
# Turtle syntax
ex:WorkingMother owl:equivalentClass [
    a owl:Class ;
    owl:intersectionOf (
        ex:Woman
        ex:Employee
        [ a owl:Restriction ;
          owl:onProperty ex:hasChild ;
          owl:someValuesFrom ex:Person ]
    )
] .
```

```manchester
# Manchester syntax
Class: WorkingMother
    EquivalentTo: Woman and Employee and hasChild some Person
```

#### Union (OR)

At least one condition must hold:

```turtle
ex:Parent owl:equivalentClass [
    a owl:Class ;
    owl:unionOf ( ex:Mother ex:Father )
] .
```

```manchester
Class: Parent
    EquivalentTo: Mother or Father
```

#### Complement (NOT)

Negation of a class:

```turtle
ex:NonPerson owl:equivalentClass [
    a owl:Class ;
    owl:complementOf ex:Person
] .

# Combined with intersection
ex:ChildlessPerson owl:equivalentClass [
    a owl:Class ;
    owl:intersectionOf (
        ex:Person
        [ owl:complementOf ex:Parent ]
    )
] .
```

```manchester
Class: ChildlessPerson
    EquivalentTo: Person and not Parent
```

### Enumeration (One Of)

Explicit listing of members:

```turtle
ex:Continent owl:equivalentClass [
    a owl:Class ;
    owl:oneOf (
        ex:Africa ex:Antarctica ex:Asia
        ex:Australia ex:Europe ex:NorthAmerica
        ex:SouthAmerica
    )
] .

ex:TrafficLightColor owl:equivalentClass [
    a owl:Class ;
    owl:oneOf ( ex:Red ex:Yellow ex:Green )
] .
```

```manchester
Class: Continent
    EquivalentTo: {Africa, Antarctica, Asia, Australia, Europe, NorthAmerica, SouthAmerica}
```

---

## Property Restrictions

### Existential Quantification (Some)

At least one value from the specified class:

```turtle
# Someone who has at least one child
ex:Parent owl:equivalentClass [
    a owl:Restriction ;
    owl:onProperty ex:hasChild ;
    owl:someValuesFrom ex:Person
] .

# Someone who owns at least one pet that is a dog
ex:DogOwner owl:equivalentClass [
    a owl:Restriction ;
    owl:onProperty ex:hasPet ;
    owl:someValuesFrom ex:Dog
] .
```

```manchester
Class: Parent
    EquivalentTo: hasChild some Person

Class: DogOwner
    EquivalentTo: hasPet some Dog
```

### Universal Quantification (Only/All)

All values must be from the specified class:

```turtle
# Someone whose children are all happy
ex:HappyParent rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:hasChild ;
    owl:allValuesFrom ex:HappyPerson
] .
```

```manchester
Class: HappyParent
    SubClassOf: hasChild only HappyPerson
```

**Warning**: Universal restrictions don't require any values exist! Use with existential:

```turtle
# Has children and all children are happy
ex:ProudParent owl:equivalentClass [
    owl:intersectionOf (
        [ a owl:Restriction ;
          owl:onProperty ex:hasChild ;
          owl:someValuesFrom ex:Person ]
        [ a owl:Restriction ;
          owl:onProperty ex:hasChild ;
          owl:allValuesFrom ex:HappyPerson ]
    )
] .
```

### Has Value

Must have a specific individual as value:

```turtle
# Lives in Boston specifically
ex:BostonResident owl:equivalentClass [
    a owl:Restriction ;
    owl:onProperty ex:livesIn ;
    owl:hasValue ex:Boston
] .
```

```manchester
Class: BostonResident
    EquivalentTo: livesIn value Boston
```

### Self Restriction (OWL 2)

The individual relates to itself:

```turtle
ex:Narcissist owl:equivalentClass [
    a owl:Restriction ;
    owl:onProperty ex:loves ;
    owl:hasSelf true
] .
```

```manchester
Class: Narcissist
    EquivalentTo: loves Self
```

---

## Cardinality Restrictions

### Unqualified Cardinality

Count any values:

```turtle
# Exactly 2 parents
ex:Person rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:hasParent ;
    owl:cardinality "2"^^xsd:nonNegativeInteger
] .

# At least 1 name
ex:NamedThing rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:hasName ;
    owl:minCardinality "1"^^xsd:nonNegativeInteger
] .

# At most 1 spouse
ex:Person rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:hasSpouse ;
    owl:maxCardinality "1"^^xsd:nonNegativeInteger
] .
```

```manchester
Class: Person
    SubClassOf: hasParent exactly 2,
                hasSpouse max 1
```

### Qualified Cardinality (OWL 2)

Count values of a specific type:

```turtle
# At least 2 children who are students
ex:ProudParent owl:equivalentClass [
    a owl:Restriction ;
    owl:onProperty ex:hasChild ;
    owl:minQualifiedCardinality "2"^^xsd:nonNegativeInteger ;
    owl:onClass ex:Student
] .

# Exactly 4 wheels that are rubber
ex:Car rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:hasWheel ;
    owl:qualifiedCardinality "4"^^xsd:nonNegativeInteger ;
    owl:onClass ex:RubberWheel
] .
```

```manchester
Class: ProudParent
    EquivalentTo: hasChild min 2 Student

Class: Car
    SubClassOf: hasWheel exactly 4 RubberWheel
```

---

## Class Axioms

### Subclass

Necessary conditions—all instances of subclass are instances of superclass:

```turtle
ex:Student rdfs:subClassOf ex:Person .

# With restrictions
ex:Student rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:enrolledIn ;
    owl:someValuesFrom ex:EducationalInstitution
] .
```

### Equivalent Class

Necessary and sufficient conditions—enables classification:

```turtle
# Definition: a parent is a person with at least one child
ex:Parent owl:equivalentClass [
    owl:intersectionOf (
        ex:Person
        [ a owl:Restriction ;
          owl:onProperty ex:hasChild ;
          owl:someValuesFrom ex:Person ]
    )
] .
```

**Key Insight**: Use `equivalentClass` for definitions (reasoner can classify instances), use `subClassOf` for constraints only.

### Disjoint Classes

No individual can be both:

```turtle
# Pairwise disjoint
ex:Cat owl:disjointWith ex:Dog .
ex:Cat owl:disjointWith ex:Bird .
ex:Dog owl:disjointWith ex:Bird .

# All disjoint (OWL 2)
[] a owl:AllDisjointClasses ;
   owl:members ( ex:Cat ex:Dog ex:Bird ex:Fish ) .
```

### Disjoint Union (OWL 2)

Partition: subclasses are exhaustive and mutually exclusive:

```turtle
ex:Animal owl:disjointUnionOf (
    ex:Mammal ex:Bird ex:Fish ex:Reptile ex:Amphibian
) .
```

This means:
1. Each subclass is disjoint from others
2. Their union equals the superclass
3. Every Animal must be exactly one of these

---

## Defined vs Primitive Classes

### Primitive Classes

Only necessary conditions (subClassOf):

```turtle
ex:Person a owl:Class ;
    rdfs:subClassOf ex:Agent .

# We can say persons are agents
# But not all agents are automatically persons
```

### Defined Classes

Necessary and sufficient conditions (equivalentClass):

```turtle
ex:Parent owl:equivalentClass [
    owl:intersectionOf (
        ex:Person
        [ a owl:Restriction ;
          owl:onProperty ex:hasChild ;
          owl:someValuesFrom ex:Person ]
    )
] .

# Now anyone with a child is automatically classified as Parent
```

### When to Use Each

| Use Case | Approach |
|----------|----------|
| Core taxonomy | Primitive classes |
| Automatic classification desired | Defined classes |
| Constraints without inference | Primitive + restrictions |
| Computed categories | Defined classes |

---

## Complex Class Examples

### Wine Example (from W3C)

```turtle
ex:WhiteWine owl:equivalentClass [
    owl:intersectionOf (
        ex:Wine
        [ a owl:Restriction ;
          owl:onProperty ex:hasColor ;
          owl:hasValue ex:White ]
    )
] .

ex:FullBodiedWine owl:equivalentClass [
    owl:intersectionOf (
        ex:Wine
        [ a owl:Restriction ;
          owl:onProperty ex:hasBody ;
          owl:hasValue ex:Full ]
    )
] .

ex:WhiteBurgundy owl:equivalentClass [
    owl:intersectionOf (
        ex:WhiteWine
        ex:Burgundy
    )
] .
```

### Family Relationships

```turtle
ex:Grandparent owl:equivalentClass [
    owl:intersectionOf (
        ex:Person
        [ a owl:Restriction ;
          owl:onProperty ex:hasChild ;
          owl:someValuesFrom ex:Parent ]
    )
] .

ex:Orphan owl:equivalentClass [
    owl:intersectionOf (
        ex:Person
        [ owl:complementOf [
            a owl:Restriction ;
            owl:onProperty ex:hasParent ;
            owl:someValuesFrom ex:LivingPerson
          ]
        ]
    )
] .
```

### Academic Example

```turtle
ex:GraduateStudent owl:equivalentClass [
    owl:intersectionOf (
        ex:Student
        [ a owl:Restriction ;
          owl:onProperty ex:hasDegree ;
          owl:someValuesFrom ex:BachelorsDegree ]
        [ a owl:Restriction ;
          owl:onProperty ex:enrolledIn ;
          owl:someValuesFrom ex:GraduateProgram ]
    )
] .

ex:FullProfessor owl:equivalentClass [
    owl:intersectionOf (
        ex:Professor
        [ a owl:Restriction ;
          owl:onProperty ex:hasRank ;
          owl:hasValue ex:ProfessorRank ]
        [ a owl:Restriction ;
          owl:onProperty ex:hasTenure ;
          owl:hasValue true ]
    )
] .
```

---

## Common Pitfalls

### 1. Forgetting Open World Assumption

```turtle
# No children asserted doesn't mean childless!
ex:John a ex:Person .
# John might still have children we don't know about
```

### 2. Universal Without Existential

```turtle
# This doesn't require any pets!
ex:GoodPetOwner rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:hasPet ;
    owl:allValuesFrom ex:WellCaredFor
] .

# Better: require at least one
ex:GoodPetOwner owl:equivalentClass [
    owl:intersectionOf (
        [ a owl:Restriction ;
          owl:onProperty ex:hasPet ;
          owl:someValuesFrom ex:Pet ]
        [ a owl:Restriction ;
          owl:onProperty ex:hasPet ;
          owl:allValuesFrom ex:WellCaredFor ]
    )
] .
```

### 3. Confusing SubClass and EquivalentClass

```turtle
# SubClass: one-way implication
ex:Dog rdfs:subClassOf ex:Mammal .
# All dogs are mammals, but not all mammals are dogs

# EquivalentClass: two-way implication
ex:Human owl:equivalentClass ex:Person .
# Interchangeable - use for synonyms or definitions
```
