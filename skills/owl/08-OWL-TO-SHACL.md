# OWL to SHACL: The Evolution of Ontology Modeling

> "SHACL represents a shift by the W3C away from OWL2 and towards a workflow that takes advantage of the power and expressiveness of SPARQL." — Kurt Cagle

This guide covers the transition from OWL-centric to SHACL-centric ontology design, including when to use each and how to migrate.

---

## The Paradigm Shift

### Historical Context

```
2000s: RDF → RDFS → OWL
       Focus: Inference, classification, formal semantics
       Assumption: Reasoners are central to the workflow

2010s-2020s: SPARQL maturation → SHACL
       Focus: Validation, constraints, practical data quality
       Reality: Reasoners fading, SPARQL is the workhorse
```

### Why the Shift?

> "Reasoners are disappearing from newer knowledge graph systems, partly because there is no real demand and partly because SPARQL and SPARQL Update are more targeted in their capabilities." — Cagle

**OWL's Challenges:**
1. Forward-chaining inference can be slow at scale
2. Binary valid/invalid doesn't match real-world messiness
3. Open World Assumption causes unexpected results
4. Requires specialized reasoners
5. Complex specification, steep learning curve

**SHACL's Advantages:**
1. Built on SPARQL—widely understood and implemented
2. Graduated severity (error/warning/info)
3. Allows invalid data storage with validation reporting
4. Works with standard triple stores
5. More intuitive for developers

---

## Philosophical Differences

### Open World vs Closed World

**OWL (Open World Assumption):**
```turtle
# No children stated doesn't mean childless
ex:John a ex:Person .
# John might have children we don't know about

# OWL CANNOT conclude John is childless
```

**SHACL (Closed World by Default):**
```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:hasChild ;
        sh:minCount 0 ;
        sh:maxCount 0 ;
        sh:message "Person has no children recorded"
    ] .

# SHACL CAN validate that John has no children in the data
```

### Inference vs Validation

**OWL: Inference-First**
```turtle
# Domain triggers type inference
ex:worksFor rdfs:domain ex:Employee .

ex:John ex:worksFor ex:Acme .
# INFERS: ex:John rdf:type ex:Employee
# Even if John was declared as ex:Rock!
```

**SHACL: Validation-First**
```turtle
ex:WorksForShape a sh:PropertyShape ;
    sh:path ex:worksFor ;
    sh:class ex:Employee ;  # Subject must be Employee
    sh:node [
        sh:class ex:Organization  # Object must be Organization
    ] .

# VALIDATES: Reports violation if John isn't an Employee
# Doesn't change John's type
```

---

## Migration Patterns

### Class Membership

**OWL:**
```turtle
ex:Person a owl:Class .
ex:John rdf:type ex:Person .
```

**SHACL:**
```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person .
```

### Subclass Constraints

**OWL:**
```turtle
ex:Student rdfs:subClassOf ex:Person .
ex:Student rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:enrolledIn ;
    owl:someValuesFrom ex:Institution
] .
```

**SHACL:**
```turtle
ex:StudentShape a sh:NodeShape ;
    sh:targetClass ex:Student ;
    sh:property [
        sh:path ex:enrolledIn ;
        sh:minCount 1 ;
        sh:class ex:Institution ;
        sh:message "Student must be enrolled in at least one institution"
    ] .
```

### Cardinality

**OWL:**
```turtle
ex:Person rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:hasSSN ;
    owl:cardinality 1
] .
```

**SHACL:**
```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:hasSSN ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:datatype xsd:string ;
        sh:pattern "^[0-9]{3}-[0-9]{2}-[0-9]{4}$" ;
        sh:message "Person must have exactly one valid SSN"
    ] .
```

### Functional Property

**OWL:**
```turtle
ex:hasBirthMother a owl:FunctionalProperty .
```

**SHACL:**
```turtle
ex:BirthMotherShape a sh:PropertyShape ;
    sh:path ex:hasBirthMother ;
    sh:maxCount 1 ;
    sh:class ex:Woman .
```

### Disjointness

**OWL:**
```turtle
ex:Cat owl:disjointWith ex:Dog .
```

**SHACL:**
```turtle
ex:CatShape a sh:NodeShape ;
    sh:targetClass ex:Cat ;
    sh:not [
        sh:class ex:Dog
    ] ;
    sh:message "Cannot be both a Cat and a Dog" .
```

### Universal Restriction (allValuesFrom)

**OWL:**
```turtle
ex:VegetarianRestaurant rdfs:subClassOf [
    a owl:Restriction ;
    owl:onProperty ex:servesFood ;
    owl:allValuesFrom ex:VegetarianFood
] .
```

**SHACL:**
```turtle
ex:VegetarianRestaurantShape a sh:NodeShape ;
    sh:targetClass ex:VegetarianRestaurant ;
    sh:property [
        sh:path ex:servesFood ;
        sh:class ex:VegetarianFood ;
        sh:message "Vegetarian restaurants can only serve vegetarian food"
    ] .
```

### Property Chains

**OWL:**
```turtle
ex:hasUncle owl:propertyChainAxiom ( ex:hasParent ex:hasBrother ) .
```

**SHACL (using SPARQL constraint):**
```turtle
ex:UncleConstraint a sh:SPARQLConstraint ;
    sh:message "Uncle relationship must match parent's brother" ;
    sh:select """
        SELECT $this ?uncle
        WHERE {
            $this ex:hasUncle ?uncle .
            FILTER NOT EXISTS {
                $this ex:hasParent ?parent .
                ?parent ex:hasBrother ?uncle .
            }
        }
    """ .
```

---

## Side-by-Side Comparison

### Complete Example: Employee Ontology

**OWL Version:**
```turtle
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix ex: <http://example.org/> .

ex:Employee a owl:Class ;
    rdfs:subClassOf ex:Person ;
    rdfs:subClassOf [
        a owl:Restriction ;
        owl:onProperty ex:hasEmployeeId ;
        owl:cardinality 1
    ] ;
    rdfs:subClassOf [
        a owl:Restriction ;
        owl:onProperty ex:worksFor ;
        owl:someValuesFrom ex:Organization
    ] .

ex:hasEmployeeId a owl:DatatypeProperty, owl:FunctionalProperty ;
    rdfs:domain ex:Employee ;
    rdfs:range xsd:string .

ex:worksFor a owl:ObjectProperty ;
    rdfs:domain ex:Employee ;
    rdfs:range ex:Organization .

ex:hasManager a owl:ObjectProperty, owl:FunctionalProperty ;
    rdfs:domain ex:Employee ;
    rdfs:range ex:Employee .
```

**SHACL Version:**
```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.org/> .

ex:EmployeeShape a sh:NodeShape ;
    sh:targetClass ex:Employee ;

    sh:property [
        sh:path ex:hasEmployeeId ;
        sh:name "Employee ID" ;
        sh:description "Unique identifier for the employee" ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:datatype xsd:string ;
        sh:pattern "^EMP[0-9]{6}$" ;
        sh:severity sh:Violation ;
        sh:message "Employee must have exactly one valid Employee ID (format: EMP######)"
    ] ;

    sh:property [
        sh:path ex:worksFor ;
        sh:name "Works For" ;
        sh:minCount 1 ;
        sh:class ex:Organization ;
        sh:severity sh:Violation ;
        sh:message "Employee must work for at least one organization"
    ] ;

    sh:property [
        sh:path ex:hasManager ;
        sh:name "Manager" ;
        sh:maxCount 1 ;
        sh:class ex:Employee ;
        sh:severity sh:Warning ;
        sh:message "Employee should have at most one manager"
    ] .
```

### Key Differences in This Example

| Aspect | OWL | SHACL |
|--------|-----|-------|
| Constraint expression | Restrictions nested in subClassOf | Flat property shapes |
| Regex validation | Not supported | `sh:pattern` |
| Error messages | None | `sh:message` |
| Severity levels | None | Violation/Warning/Info |
| Documentation | Via annotations | `sh:name`, `sh:description` |
| Domain/range | Triggers inference | True constraint |

---

## When to Use Each

### Use OWL When:

1. **Automatic classification is core to your use case**
   ```turtle
   # Reasoner will classify individuals automatically
   ex:Parent owl:equivalentClass [
       owl:intersectionOf (
           ex:Person
           [ a owl:Restriction ;
             owl:onProperty ex:hasChild ;
             owl:someValuesFrom ex:Person ]
       )
   ] .
   ```

2. **Interoperability with OWL tools is required**
3. **Building a formal ontology for academic/research purposes**
4. **Property characteristics are central** (transitivity, symmetry)
5. **You need OWL-specific features** (property chains, keys)

### Use SHACL When:

1. **Data validation is the primary concern**
2. **You need graduated severity levels**
3. **Data quality may vary** (allow storage, report issues)
4. **Your stack is SPARQL-based**
5. **You need rich validation feedback** (messages, severity)
6. **Closed-world validation is appropriate**
7. **Integration with APIs/forms** (SHACL as contract)

### Use Both When:

```turtle
# OWL for inference
ex:Parent owl:equivalentClass [
    owl:intersectionOf (
        ex:Person
        [ a owl:Restriction ;
          owl:onProperty ex:hasChild ;
          owl:someValuesFrom ex:Person ]
    )
] .

# SHACL for validation
ex:ParentShape a sh:NodeShape ;
    sh:targetClass ex:Parent ;
    sh:property [
        sh:path ex:hasChild ;
        sh:minCount 1 ;
        sh:message "A parent must have at least one child"
    ] .
```

---

## Future Outlook (Cagle's Perspective)

> "It takes 8-10 years to train a good ontologist, and many up-and-coming ontologists today were exposed to SPARQL UPDATE and SHACL early in their careers and are therefore more open to thinking about data in that light."

**Trends:**
1. SHACL becoming foundational for data design
2. OWL declining for general use, remaining for specialized inference
3. Property graphs (Neo4j/OpenCypher) converging with RDF
4. SHACL translatable to OpenCypher constraints
5. AI/LLM integration favoring SHACL's API-friendly design

**Recommendation:**
> "Learn SHACL, RDFS and OWL. These are the languages that underlie almost the entire RDF stack, as far as modelling, validation, and increasingly documentation go."
