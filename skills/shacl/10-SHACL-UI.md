# SHACL for User Interfaces

> "SHACL is surprisingly good not only at validation but also at providing structural information, including data groupings, ordering, and interfaces." — Kurt Cagle

SHACL shapes can drive automatic form generation and UI scaffolding.

---

## UI-Relevant Properties

### Core Documentation Properties

| Property | Purpose | Example |
|----------|---------|---------|
| `sh:name` | Field identifier/label | `"firstName"` |
| `sh:description` | Help text | `"Enter your legal first name"` |
| `sh:order` | Display sequence | `1`, `2`, `3` |
| `sh:group` | Logical grouping | `ex:PersonalInfoGroup` |
| `sh:defaultValue` | Pre-populated value | `"Unknown"` |

### Example

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;

    sh:property [
        sh:path ex:firstName ;
        sh:name "firstName" ;
        sh:description "Your legal first name" ;
        sh:order 1 ;
        sh:group ex:NameGroup ;
        sh:minCount 1 ;
        sh:datatype xsd:string
    ] ;

    sh:property [
        sh:path ex:lastName ;
        sh:name "lastName" ;
        sh:description "Your legal last name" ;
        sh:order 2 ;
        sh:group ex:NameGroup ;
        sh:minCount 1 ;
        sh:datatype xsd:string
    ] ;

    sh:property [
        sh:path ex:email ;
        sh:name "email" ;
        sh:description "Primary email address" ;
        sh:order 3 ;
        sh:group ex:ContactGroup ;
        sh:pattern "^[^@]+@[^@]+$"
    ] .
```

---

## Property Groups

### Defining Groups

```turtle
ex:NameGroup a sh:PropertyGroup ;
    rdfs:label "Name Information" ;
    sh:order 1 .

ex:ContactGroup a sh:PropertyGroup ;
    rdfs:label "Contact Details" ;
    sh:order 2 .

ex:PreferencesGroup a sh:PropertyGroup ;
    rdfs:label "Preferences" ;
    sh:order 3 .
```

### Using Groups

```turtle
sh:property [
    sh:path ex:firstName ;
    sh:group ex:NameGroup ;
    sh:order 1  # Order within group
] .
```

Groups enable:
- Fieldsets/sections in forms
- Tabbed interfaces
- Collapsible panels

---

## DASH Widgets

DASH (Data Shapes) extends SHACL with UI hints.

### Editor vs Viewer

```turtle
@prefix dash: <http://datashapes.org/dash#> .

sh:property [
    sh:path ex:description ;
    dash:editor dash:TextAreaEditor ;     # For editing
    dash:viewer dash:LabelViewer          # For display
] .
```

### Common Editors

| Editor | Use Case |
|--------|----------|
| `dash:TextFieldEditor` | Single-line text |
| `dash:TextAreaEditor` | Multi-line text |
| `dash:DatePickerEditor` | Date selection |
| `dash:BooleanSelectEditor` | Checkbox |
| `dash:EnumSelectEditor` | Dropdown from `sh:in` |
| `dash:InstancesSelectEditor` | Select from class instances |
| `dash:AutoCompleteEditor` | Search/autocomplete |
| `dash:RichTextEditor` | HTML/markdown |
| `dash:URIEditor` | IRI input |

### Common Viewers

| Viewer | Use Case |
|--------|----------|
| `dash:LabelViewer` | Text display |
| `dash:ValueTableViewer` | Table of values |
| `dash:HTMLViewer` | Rendered HTML |
| `dash:HyperlinkViewer` | Clickable link |
| `dash:ImageViewer` | Image display |

---

## Intelligent Type Inference

DASH can infer widgets from constraints:

```turtle
# Date picker inferred from datatype
sh:property [
    sh:path ex:birthDate ;
    sh:datatype xsd:date
    # dash:DatePickerEditor inferred
] .

# Dropdown inferred from sh:in
sh:property [
    sh:path ex:status ;
    sh:in ("draft" "review" "published")
    # dash:EnumSelectEditor inferred
] .

# Instance selector inferred from sh:class
sh:property [
    sh:path ex:author ;
    sh:class ex:Person
    # dash:InstancesSelectEditor inferred
] .

# Checkbox inferred from boolean
sh:property [
    sh:path ex:active ;
    sh:datatype xsd:boolean
    # dash:BooleanSelectEditor inferred
] .
```

---

## Form Generation Pattern

### SPARQL Query for Form Fields

```sparql
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?property ?name ?description ?datatype ?minCount ?maxCount ?order ?groupLabel ?groupOrder
WHERE {
    ex:PersonShape sh:property ?propShape .
    ?propShape sh:path ?property .

    OPTIONAL { ?propShape sh:name ?name }
    OPTIONAL { ?propShape sh:description ?description }
    OPTIONAL { ?propShape sh:datatype ?datatype }
    OPTIONAL { ?propShape sh:minCount ?minCount }
    OPTIONAL { ?propShape sh:maxCount ?maxCount }
    OPTIONAL { ?propShape sh:order ?order }

    OPTIONAL {
        ?propShape sh:group ?group .
        ?group rdfs:label ?groupLabel ;
               sh:order ?groupOrder .
    }
}
ORDER BY ?groupOrder ?order
```

### JavaScript Form Generator

```javascript
async function generateForm(shapeUri) {
    const fields = await queryShapeProperties(shapeUri);

    const groups = groupBy(fields, 'groupLabel');

    return groups.map(group => ({
        label: group.label,
        fields: group.fields.map(field => ({
            name: field.name,
            label: field.name,
            description: field.description,
            type: inferWidgetType(field),
            required: field.minCount >= 1,
            multiple: field.maxCount !== 1,
            options: field.inValues
        }))
    }));
}

function inferWidgetType(field) {
    if (field.inValues) return 'select';
    if (field.datatype === 'xsd:date') return 'date';
    if (field.datatype === 'xsd:boolean') return 'checkbox';
    if (field.datatype === 'xsd:integer') return 'number';
    if (field.classConstraint) return 'autocomplete';
    return 'text';
}
```

---

## Complete UI Schema Example

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix dash: <http://datashapes.org/dash#> .
@prefix ex: <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# Property Groups
ex:BasicInfoGroup a sh:PropertyGroup ;
    rdfs:label "Basic Information" ;
    sh:order 1 .

ex:ContactGroup a sh:PropertyGroup ;
    rdfs:label "Contact Details" ;
    sh:order 2 .

ex:SettingsGroup a sh:PropertyGroup ;
    rdfs:label "Settings" ;
    sh:order 3 .

# Shape with UI metadata
ex:UserProfileShape a sh:NodeShape ;
    sh:targetClass ex:User ;
    sh:name "User Profile" ;
    sh:description "User account information" ;

    # Basic Info
    sh:property [
        sh:path ex:username ;
        sh:name "username" ;
        sh:description "Unique username (cannot be changed)" ;
        sh:order 1 ;
        sh:group ex:BasicInfoGroup ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:datatype xsd:string ;
        sh:minLength 3 ;
        sh:maxLength 20 ;
        sh:pattern "^[a-z0-9_]+$" ;
        dash:editor dash:TextFieldEditor ;
        dash:readOnly true  # Cannot edit after creation
    ] ;

    sh:property [
        sh:path ex:displayName ;
        sh:name "displayName" ;
        sh:description "Name shown to other users" ;
        sh:order 2 ;
        sh:group ex:BasicInfoGroup ;
        sh:minCount 1 ;
        sh:datatype xsd:string ;
        sh:maxLength 50
    ] ;

    sh:property [
        sh:path ex:bio ;
        sh:name "bio" ;
        sh:description "Brief biography (optional)" ;
        sh:order 3 ;
        sh:group ex:BasicInfoGroup ;
        sh:datatype xsd:string ;
        sh:maxLength 500 ;
        dash:editor dash:TextAreaEditor
    ] ;

    # Contact
    sh:property [
        sh:path ex:email ;
        sh:name "email" ;
        sh:description "Primary email address" ;
        sh:order 1 ;
        sh:group ex:ContactGroup ;
        sh:minCount 1 ;
        sh:datatype xsd:string ;
        sh:pattern "^[^@]+@[^@]+\\.[^@]+$"
    ] ;

    sh:property [
        sh:path ex:phone ;
        sh:name "phone" ;
        sh:description "Phone number (optional)" ;
        sh:order 2 ;
        sh:group ex:ContactGroup ;
        sh:datatype xsd:string
    ] ;

    # Settings
    sh:property [
        sh:path ex:theme ;
        sh:name "theme" ;
        sh:description "UI color theme" ;
        sh:order 1 ;
        sh:group ex:SettingsGroup ;
        sh:in ("light" "dark" "system") ;
        sh:defaultValue "system"
    ] ;

    sh:property [
        sh:path ex:notifications ;
        sh:name "notifications" ;
        sh:description "Receive email notifications" ;
        sh:order 2 ;
        sh:group ex:SettingsGroup ;
        sh:datatype xsd:boolean ;
        sh:defaultValue true
    ] ;

    sh:property [
        sh:path ex:language ;
        sh:name "language" ;
        sh:description "Preferred language" ;
        sh:order 3 ;
        sh:group ex:SettingsGroup ;
        sh:in ("en" "de" "fr" "es" "ja") ;
        sh:defaultValue "en" ;
        dash:editor dash:EnumSelectEditor
    ] .
```

---

## GraphQL Integration

SHACL shapes can generate GraphQL schemas:

### SHACL to GraphQL Mapping

| SHACL | GraphQL |
|-------|---------|
| `sh:NodeShape` | `type` |
| `sh:name` | Field name |
| `sh:datatype xsd:string` | `String` |
| `sh:datatype xsd:integer` | `Int` |
| `sh:datatype xsd:boolean` | `Boolean` |
| `sh:minCount 1` | Non-null (`!`) |
| `sh:maxCount 1` | Scalar |
| No `sh:maxCount` | Array (`[]`) |
| `sh:class` | Type reference |
| `sh:in` | Enum |

### Generated GraphQL

```graphql
type User {
    username: String!
    displayName: String!
    bio: String
    email: String!
    phone: String
    theme: ThemeEnum
    notifications: Boolean
    language: LanguageEnum
}

enum ThemeEnum {
    light
    dark
    system
}

enum LanguageEnum {
    en
    de
    fr
    es
    ja
}
```

---

## Best Practices

### 1. Always Include Order

```turtle
sh:property [
    sh:order 1  # Essential for consistent UI
] .
```

### 2. Provide Help Text

```turtle
sh:property [
    sh:description "Enter your email address. We'll never share it."
] .
```

### 3. Use Groups Logically

Organize related fields together for better UX.

### 4. Set Sensible Defaults

```turtle
sh:property [
    sh:defaultValue "en"  # Reduce required input
] .
```

### 5. Indicate Required Fields

```turtle
sh:property [
    sh:minCount 1  # UI should mark as required
] .
```

---

## Resources

- [SHACL for User Interfaces](https://ontologist.substack.com/p/shacl-for-user-interfaces) — Kurt Cagle
- [DASH Data Shapes](https://datashapes.org/dash.html) — TopQuadrant
- [TopBraid Composer](https://www.topquadrant.com/) — SHACL UI tools
