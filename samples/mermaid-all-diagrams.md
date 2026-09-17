# Mermaid 11 diagram types (export samples)

Inventory is taken from `mermaid@11.16.1` detectors in the installed package. Experimental types use the documented `-beta` keyword.

## Flowchart (`flowchart-v2`)

- Stability: stable; export: **supported**; keywords: `flowchart`, `graph`

```mermaid
flowchart TD
    Client[Web Client] --> Gateway[API Gateway]
    Gateway --> Auth[Auth Service]
    Gateway --> Orders[Order API]
```

## Flowchart (ELK layout) (`flowchart-elk`)

- Stability: stable; export: **unsupported**; keywords: `flowchart-elk`
- Reason: mermaid@11.16.1 registers flowchart-elk but does not bundle the ELK layout loader (@mermaid-js/layout-elk).

```mermaid
flowchart-elk TD
    A[Start] --> B[End]
```

## Sequence diagram (`sequence`)

- Stability: stable; export: **supported**; keywords: `sequenceDiagram`

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant API
    User->>API: POST /login
    API-->>User: 200 JWT
```

## Class diagram (`classDiagram`)

- Stability: stable; export: **supported**; keywords: `classDiagram`, `classDiagram-v2`

```mermaid
classDiagram
    class Animal {
        +String name
        +eat()
    }
    class Duck {
        +swim()
    }
    Animal <|-- Duck
```

## State diagram (`stateDiagram`)

- Stability: stable; export: **supported**; keywords: `stateDiagram`, `stateDiagram-v2`

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Running
    Running --> Idle
    Running --> Failed
    Failed --> [*]
```

## Entity relationship (`er`)

- Stability: stable; export: **supported**; keywords: `erDiagram`

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    CUSTOMER {
        string id PK
        string email
    }
    ORDER {
        string id PK
        string customer_id FK
    }
```

## Gantt chart (`gantt`)

- Stability: stable; export: **supported**; keywords: `gantt`

```mermaid
gantt
    title Q3 Delivery
    dateFormat YYYY-MM-DD
    section Build
    Auth service :active, 2026-07-01, 14d
    Order API    :         2026-07-10, 10d
    section Release
    Cutover      :milestone, 2026-08-01, 0d
```

## Git graph (`gitGraph`)

- Stability: stable; export: **supported**; keywords: `gitGraph`

```mermaid
gitGraph
    commit id: "init"
    commit id: "api"
    branch develop
    checkout develop
    commit id: "feature"
    checkout main
    merge develop
```

## Pie chart (`pie`)

- Stability: stable; export: **supported**; keywords: `pie`

```mermaid
pie title Traffic share
    "API" : 45
    "Web" : 30
    "Batch" : 25
```

## Quadrant chart (`quadrantChart`)

- Stability: stable; export: **supported**; keywords: `quadrantChart`

```mermaid
quadrantChart
    title Reach and engagement
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 Expand
    quadrant-2 Promote
    quadrant-3 Re-evaluate
    quadrant-4 Improve
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
```

## Requirement diagram (`requirement`)

- Stability: stable; export: **supported**; keywords: `requirementDiagram`, `requirement`

```mermaid
requirementDiagram
    requirement auth_req {
        id: 1
        text: Users must authenticate.
        risk: high
        verifymethod: test
    }
    element login_api {
        type: simulation
    }
    login_api - satisfies -> auth_req
```

## C4 architecture (`c4`)

- Stability: stable; export: **supported**; keywords: `C4Context`, `C4Container`, `C4Component`, `C4Dynamic`, `C4Deployment`

```mermaid
C4Context
    title System Context for Internet Banking
    Person(customer, "Banking Customer", "A customer of the bank.")
    System(banking, "Internet Banking", "Views accounts and makes payments.")
    System_Ext(mail, "E-mail system", "Internal mail.")
    Rel(customer, banking, "Uses")
    Rel(banking, mail, "Sends e-mails")
```

## Mindmap (`mindmap`)

- Stability: stable; export: **supported**; keywords: `mindmap`

```mermaid
mindmap
  root((Platform))
    API
      REST
      GraphQL
    Data
      Postgres
      Redis
```

## User journey (`journey`)

- Stability: stable; export: **supported**; keywords: `journey`

```mermaid
journey
    title Checkout
    section Browse
      Open catalog: 5: User
      Add to cart: 4: User
    section Pay
      Enter card: 3: User
      Confirm: 5: User, Payments
```

## Timeline (`timeline`)

- Stability: stable; export: **supported**; keywords: `timeline`

```mermaid
timeline
    title Platform history
    2024 : Private beta
    2025 : GA launch
         : First enterprise
    2026 : Mermaid export
```

## Kanban (`kanban`)

- Stability: stable; export: **supported**; keywords: `kanban`

```mermaid
kanban
  todo[Todo]
    docs[Write export docs]
  doing[In progress]
    render[Shared Mermaid path]
  done[Done]
    gantt[Gantt printable width]
```

## Sankey (`sankey`)

- Stability: stable; export: **supported**; keywords: `sankey`, `sankey-beta`

```mermaid
sankey-beta

Source,API,40
Source,Web,25
API,Database,30
API,Cache,10
Web,CDN,25
```

## Packet diagram (`packet`)

- Stability: stable; export: **supported**; keywords: `packet`, `packet-beta`

```mermaid
packet
title UDP Packet
+16: "Source Port"
+16: "Destination Port"
32-47: "Length"
48-63: "Checksum"
```

## XY chart (`xychart`)

- Stability: experimental; export: **supported**; keywords: `xychart`, `xychart-beta`

```mermaid
xychart-beta
    title "Orders"
    x-axis [jan, feb, mar, apr]
    y-axis "Count" 0 --> 100
    bar [20, 40, 55, 80]
    line [20, 40, 55, 80]
```

## Block diagram (`block`)

- Stability: stable; export: **supported**; keywords: `block`, `block-beta`

```mermaid
block-beta
columns 3
  Client space Gateway
  Client --> Gateway
  Gateway space DB[("Database")]
  Gateway --> DB
```

## Architecture diagram (`architecture`)

- Stability: experimental; export: **supported**; keywords: `architecture`, `architecture-beta`

```mermaid
architecture-beta
    group api(cloud)[API]
    service db(database)[Database] in api
    service server(server)[Server] in api
    db:L -- R:server
```

## Event modeling (`eventmodeling`)

- Stability: experimental; export: **supported**; keywords: `eventmodeling`

```mermaid
eventmodeling

tf 01 ui CartUI
tf 02 cmd AddItem
tf 03 evt ItemAdded
```

## Ishikawa (fishbone) (`ishikawa`)

- Stability: experimental; export: **supported**; keywords: `ishikawa`, `ishikawa-beta`

```mermaid
ishikawa-beta
    Export timeout
    Diagram
        Collapsed viewBox
        Missing useWidth
    Runtime
        10s raster cap
    Content
        Very wide gantt
```

## Treemap (`treemap`)

- Stability: experimental; export: **supported**; keywords: `treemap`, `treemap-beta`

```mermaid
treemap-beta
"Platform"
    "API": 40
    "Web": 25
    "Batch": 15
    "Other": 20
```

## Info (`info`)

- Stability: stable; export: **supported**; keywords: `info`

```mermaid
info
```

## Swimlanes (`swimlane`)

- Stability: experimental; export: **supported**; keywords: `swimlane-beta`

```mermaid
swimlane-beta LR
  subgraph Customer
    Browse[Browse catalogue]
    Pay[Pay]
  end
  subgraph Warehouse
    Pick[Pick items]
    Ship[Ship order]
  end
  Browse --> Pay --> Pick --> Ship
```

## Radar chart (`radar`)

- Stability: experimental; export: **supported**; keywords: `radar-beta`

```mermaid
radar-beta
  title Skills
  axis docs["Docs"], tests["Tests"], ux["UX"], perf["Perf"]
  curve a["Current"]{4, 3, 2, 4}
  curve b["Target"]{5, 4, 4, 4}
  max 5
```

## Tree view (`treeView`)

- Stability: experimental; export: **supported**; keywords: `treeView-beta`

```mermaid
treeView-beta
    src/
        mermaidConfig.ts
        mermaidCatalog.ts
    tests/
        mermaidAllDiagrams.test.ts
```

## Venn diagram (`venn`)

- Stability: experimental; export: **supported**; keywords: `venn-beta`

```mermaid
venn-beta
set A ["Backend"]
set B ["Frontend"]
union A,B ["Full-stack"]
```

## Wardley map (`wardley`)

- Stability: experimental; export: **supported**; keywords: `wardley-beta`

```mermaid
wardley-beta
title Tea Shop
anchor Business [0.95, 0.63]
component Cup of Tea [0.79, 0.61]
component Tea [0.63, 0.81]
component Hot Water [0.52, 0.80]
component Kettle [0.43, 0.35]
component Power [0.10, 0.70]
Business -> Cup of Tea
Cup of Tea -> Tea
Cup of Tea -> Hot Water
Hot Water -> Kettle
Kettle -> Power
```

## Cynefin framework (`cynefin`)

- Stability: experimental; export: **supported**; keywords: `cynefin-beta`

```mermaid
cynefin-beta
title Delivery decisions
complex
"Unknown failure mode"
complicated
"Needs specialist review"
clear
"Run the runbook"
chaotic
"Incident in progress"
confusion
"Not yet classified"
```

## Railroad (IR) (`railroad`)

- Stability: experimental; export: **supported**; keywords: `railroad-beta`

```mermaid
railroad-beta
title Digit
digit = choice(terminal("0"), terminal("1"), terminal("2")) ;
```

## Railroad (EBNF) (`railroadEbnf`)

- Stability: experimental; export: **supported**; keywords: `railroad-ebnf-beta`

```mermaid
railroad-ebnf-beta
title "Digit Definition"
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

## Railroad (ABNF) (`railroadAbnf`)

- Stability: experimental; export: **supported**; keywords: `railroad-abnf-beta`

```mermaid
railroad-abnf-beta
title "Digit"
digit = "0" / "1" / "2" ;
```

## Railroad (PEG) (`railroadPeg`)

- Stability: experimental; export: **supported**; keywords: `railroad-peg-beta`

```mermaid
railroad-peg-beta
title "Digit"
Digit <- "0" / "1" / "2" ;
```
