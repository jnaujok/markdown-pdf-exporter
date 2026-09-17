/**
 * Diagram types shipped by the installed mermaid@11.16.1 package
 * (see node_modules/mermaid/dist/mermaid.core.mjs detectors).
 * Do not add types that package does not register.
 */

export type MermaidStability = "stable" | "experimental";

export interface MermaidTypeEntry {
  /** mermaid detector id */
  id: string;
  /** First-line keywords this detector accepts */
  keywords: readonly string[];
  title: string;
  stability: MermaidStability;
  supported: boolean;
  reason?: string;
  sample: string;
  /** mermaid.parse().diagramType when parse succeeds */
  parseType: string;
}

export const MERMAID_PACKAGE_VERSION = "11.16.1";

/**
 * Detector ids registered in mermaid@11.16.1 `mermaid.core.mjs`
 * (excludes internal `error` and `---` YAML-front-matter traps).
 * Legacy `flowchart` / `class` / `state` stay registered; export config
 * selects the v2 detectors via `defaultRenderer: "dagre-wrapper"`.
 */
export const MERMAID_INSTALLED_DETECTOR_IDS = [
  "architecture",
  "block",
  "c4",
  "class",
  "classDiagram",
  "cynefin",
  "er",
  "eventmodeling",
  "flowchart",
  "flowchart-elk",
  "flowchart-v2",
  "gantt",
  "gitGraph",
  "info",
  "ishikawa",
  "journey",
  "kanban",
  "mindmap",
  "packet",
  "pie",
  "quadrantChart",
  "radar",
  "railroad",
  "railroadAbnf",
  "railroadEbnf",
  "railroadPeg",
  "requirement",
  "sankey",
  "sequence",
  "state",
  "stateDiagram",
  "swimlane",
  "timeline",
  "treeView",
  "treemap",
  "venn",
  "wardley",
  "xychart",
] as const;

export const MERMAID_LEGACY_DETECTOR_IDS = ["flowchart", "class", "state"] as const;

export const MERMAID_DIAGRAM_TYPES: readonly MermaidTypeEntry[] = [
  {
    id: "flowchart-v2",
    keywords: ["flowchart", "graph"],
    title: "Flowchart",
    stability: "stable",
    supported: true,
    parseType: "flowchart-v2",
    sample: `flowchart TD
    Client[Web Client] --> Gateway[API Gateway]
    Gateway --> Auth[Auth Service]
    Gateway --> Orders[Order API]`,
  },
  {
    id: "flowchart-elk",
    keywords: ["flowchart-elk"],
    title: "Flowchart (ELK layout)",
    stability: "stable",
    supported: false,
    reason:
      "mermaid@11.16.1 registers flowchart-elk but does not bundle the ELK layout loader (@mermaid-js/layout-elk).",
    parseType: "flowchart-elk",
    sample: `flowchart-elk TD
    A[Start] --> B[End]`,
  },
  {
    id: "sequence",
    keywords: ["sequenceDiagram"],
    title: "Sequence diagram",
    stability: "stable",
    supported: true,
    parseType: "sequence",
    sample: `sequenceDiagram
    autonumber
    actor User
    participant API
    User->>API: POST /login
    API-->>User: 200 JWT`,
  },
  {
    id: "classDiagram",
    keywords: ["classDiagram", "classDiagram-v2"],
    title: "Class diagram",
    stability: "stable",
    supported: true,
    parseType: "classDiagram",
    sample: `classDiagram
    class Animal {
        +String name
        +eat()
    }
    class Duck {
        +swim()
    }
    Animal <|-- Duck`,
  },
  {
    id: "stateDiagram",
    keywords: ["stateDiagram", "stateDiagram-v2"],
    title: "State diagram",
    stability: "stable",
    supported: true,
    parseType: "stateDiagram",
    sample: `stateDiagram-v2
    [*] --> Idle
    Idle --> Running
    Running --> Idle
    Running --> Failed
    Failed --> [*]`,
  },
  {
    id: "er",
    keywords: ["erDiagram"],
    title: "Entity relationship",
    stability: "stable",
    supported: true,
    parseType: "er",
    sample: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    CUSTOMER {
        string id PK
        string email
    }
    ORDER {
        string id PK
        string customer_id FK
    }`,
  },
  {
    id: "gantt",
    keywords: ["gantt"],
    title: "Gantt chart",
    stability: "stable",
    supported: true,
    parseType: "gantt",
    sample: `gantt
    title Q3 Delivery
    dateFormat YYYY-MM-DD
    section Build
    Auth service :active, 2026-07-01, 14d
    Order API    :         2026-07-10, 10d
    section Release
    Cutover      :milestone, 2026-08-01, 0d`,
  },
  {
    id: "gitGraph",
    keywords: ["gitGraph"],
    title: "Git graph",
    stability: "stable",
    supported: true,
    parseType: "gitGraph",
    sample: `gitGraph
    commit id: "init"
    commit id: "api"
    branch develop
    checkout develop
    commit id: "feature"
    checkout main
    merge develop`,
  },
  {
    id: "pie",
    keywords: ["pie"],
    title: "Pie chart",
    stability: "stable",
    supported: true,
    parseType: "pie",
    sample: `pie title Traffic share
    "API" : 45
    "Web" : 30
    "Batch" : 25`,
  },
  {
    id: "quadrantChart",
    keywords: ["quadrantChart"],
    title: "Quadrant chart",
    stability: "stable",
    supported: true,
    parseType: "quadrantChart",
    sample: `quadrantChart
    title Reach and engagement
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 Expand
    quadrant-2 Promote
    quadrant-3 Re-evaluate
    quadrant-4 Improve
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]`,
  },
  {
    id: "requirement",
    keywords: ["requirementDiagram", "requirement"],
    title: "Requirement diagram",
    stability: "stable",
    supported: true,
    parseType: "requirement",
    sample: `requirementDiagram
    requirement auth_req {
        id: 1
        text: Users must authenticate.
        risk: high
        verifymethod: test
    }
    element login_api {
        type: simulation
    }
    login_api - satisfies -> auth_req`,
  },
  {
    id: "c4",
    keywords: [
      "C4Context",
      "C4Container",
      "C4Component",
      "C4Dynamic",
      "C4Deployment",
    ],
    title: "C4 architecture",
    stability: "stable",
    supported: true,
    parseType: "c4",
    sample: `C4Context
    title System Context for Internet Banking
    Person(customer, "Banking Customer", "A customer of the bank.")
    System(banking, "Internet Banking", "Views accounts and makes payments.")
    System_Ext(mail, "E-mail system", "Internal mail.")
    Rel(customer, banking, "Uses")
    Rel(banking, mail, "Sends e-mails")`,
  },
  {
    id: "mindmap",
    keywords: ["mindmap"],
    title: "Mindmap",
    stability: "stable",
    supported: true,
    parseType: "mindmap",
    sample: `mindmap
  root((Platform))
    API
      REST
      GraphQL
    Data
      Postgres
      Redis`,
  },
  {
    id: "journey",
    keywords: ["journey"],
    title: "User journey",
    stability: "stable",
    supported: true,
    parseType: "journey",
    sample: `journey
    title Checkout
    section Browse
      Open catalog: 5: User
      Add to cart: 4: User
    section Pay
      Enter card: 3: User
      Confirm: 5: User, Payments`,
  },
  {
    id: "timeline",
    keywords: ["timeline"],
    title: "Timeline",
    stability: "stable",
    supported: true,
    parseType: "timeline",
    sample: `timeline
    title Platform history
    2024 : Private beta
    2025 : GA launch
         : First enterprise
    2026 : Mermaid export`,
  },
  {
    id: "kanban",
    keywords: ["kanban"],
    title: "Kanban",
    stability: "stable",
    supported: true,
    parseType: "kanban",
    sample: `kanban
  todo[Todo]
    docs[Write export docs]
  doing[In progress]
    render[Shared Mermaid path]
  done[Done]
    gantt[Gantt printable width]`,
  },
  {
    id: "sankey",
    keywords: ["sankey", "sankey-beta"],
    title: "Sankey",
    stability: "stable",
    supported: true,
    parseType: "sankey",
    sample: `sankey-beta

Source,API,40
Source,Web,25
API,Database,30
API,Cache,10
Web,CDN,25`,
  },
  {
    id: "packet",
    keywords: ["packet", "packet-beta"],
    title: "Packet diagram",
    stability: "stable",
    supported: true,
    parseType: "packet",
    sample: `packet
title UDP Packet
+16: "Source Port"
+16: "Destination Port"
32-47: "Length"
48-63: "Checksum"`,
  },
  {
    id: "xychart",
    keywords: ["xychart", "xychart-beta"],
    title: "XY chart",
    stability: "experimental",
    supported: true,
    parseType: "xychart",
    sample: `xychart-beta
    title "Orders"
    x-axis [jan, feb, mar, apr]
    y-axis "Count" 0 --> 100
    bar [20, 40, 55, 80]
    line [20, 40, 55, 80]`,
  },
  {
    id: "block",
    keywords: ["block", "block-beta"],
    title: "Block diagram",
    stability: "stable",
    supported: true,
    parseType: "block",
    sample: `block-beta
columns 3
  Client space Gateway
  Client --> Gateway
  Gateway space DB[("Database")]
  Gateway --> DB`,
  },
  {
    id: "architecture",
    keywords: ["architecture", "architecture-beta"],
    title: "Architecture diagram",
    stability: "experimental",
    supported: true,
    parseType: "architecture",
    sample: `architecture-beta
    group api(cloud)[API]
    service db(database)[Database] in api
    service server(server)[Server] in api
    db:L -- R:server`,
  },
  {
    id: "eventmodeling",
    keywords: ["eventmodeling"],
    title: "Event modeling",
    stability: "experimental",
    supported: true,
    parseType: "eventmodeling",
    sample: `eventmodeling

tf 01 ui CartUI
tf 02 cmd AddItem
tf 03 evt ItemAdded`,
  },
  {
    id: "ishikawa",
    keywords: ["ishikawa", "ishikawa-beta"],
    title: "Ishikawa (fishbone)",
    stability: "experimental",
    supported: true,
    parseType: "ishikawa",
    sample: `ishikawa-beta
    Export timeout
    Diagram
        Collapsed viewBox
        Missing useWidth
    Runtime
        10s raster cap
    Content
        Very wide gantt`,
  },
  {
    id: "treemap",
    keywords: ["treemap", "treemap-beta"],
    title: "Treemap",
    stability: "experimental",
    supported: true,
    parseType: "treemap",
    sample: `treemap-beta
"Platform"
    "API": 40
    "Web": 25
    "Batch": 15
    "Other": 20`,
  },
  {
    id: "info",
    keywords: ["info"],
    title: "Info",
    stability: "stable",
    supported: true,
    parseType: "info",
    sample: `info`,
  },
  {
    id: "swimlane",
    keywords: ["swimlane-beta"],
    title: "Swimlanes",
    stability: "experimental",
    supported: true,
    parseType: "swimlane",
    sample: `swimlane-beta LR
  subgraph Customer
    Browse[Browse catalogue]
    Pay[Pay]
  end
  subgraph Warehouse
    Pick[Pick items]
    Ship[Ship order]
  end
  Browse --> Pay --> Pick --> Ship`,
  },
  {
    id: "radar",
    keywords: ["radar-beta"],
    title: "Radar chart",
    stability: "experimental",
    supported: true,
    parseType: "radar",
    sample: `radar-beta
  title Skills
  axis docs["Docs"], tests["Tests"], ux["UX"], perf["Perf"]
  curve a["Current"]{4, 3, 2, 4}
  curve b["Target"]{5, 4, 4, 4}
  max 5`,
  },
  {
    id: "treeView",
    keywords: ["treeView-beta"],
    title: "Tree view",
    stability: "experimental",
    supported: true,
    parseType: "treeView",
    sample: `treeView-beta
    src/
        mermaidConfig.ts
        mermaidCatalog.ts
    tests/
        mermaidAllDiagrams.test.ts`,
  },
  {
    id: "venn",
    keywords: ["venn-beta"],
    title: "Venn diagram",
    stability: "experimental",
    supported: true,
    parseType: "venn",
    sample: `venn-beta
set A ["Backend"]
set B ["Frontend"]
union A,B ["Full-stack"]`,
  },
  {
    id: "wardley",
    keywords: ["wardley-beta"],
    title: "Wardley map",
    stability: "experimental",
    supported: true,
    parseType: "wardley",
    sample: `wardley-beta
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
Kettle -> Power`,
  },
  {
    id: "cynefin",
    keywords: ["cynefin-beta"],
    title: "Cynefin framework",
    stability: "experimental",
    supported: true,
    parseType: "cynefin",
    sample: `cynefin-beta
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
"Not yet classified"`,
  },
  {
    id: "railroad",
    keywords: ["railroad-beta"],
    title: "Railroad (IR)",
    stability: "experimental",
    supported: true,
    parseType: "railroad",
    sample: `railroad-beta
title Digit
digit = choice(terminal("0"), terminal("1"), terminal("2")) ;`,
  },
  {
    id: "railroadEbnf",
    keywords: ["railroad-ebnf-beta"],
    title: "Railroad (EBNF)",
    stability: "experimental",
    supported: true,
    parseType: "railroadEbnf",
    sample: `railroad-ebnf-beta
title "Digit Definition"
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;`,
  },
  {
    id: "railroadAbnf",
    keywords: ["railroad-abnf-beta"],
    title: "Railroad (ABNF)",
    stability: "experimental",
    supported: true,
    parseType: "railroadAbnf",
    sample: `railroad-abnf-beta
title "Digit"
digit = "0" / "1" / "2" ;`,
  },
  {
    id: "railroadPeg",
    keywords: ["railroad-peg-beta"],
    title: "Railroad (PEG)",
    stability: "experimental",
    supported: true,
    parseType: "railroadPeg",
    sample: `railroad-peg-beta
title "Digit"
Digit <- "0" / "1" / "2" ;`,
  },
];

export function mermaidTypeById(id: string): MermaidTypeEntry | undefined {
  return MERMAID_DIAGRAM_TYPES.find((entry) => entry.id === id);
}

export function mermaidFence(sample: string): string {
  return "```mermaid\n" + sample.trim() + "\n```";
}

export function mermaidCatalogMarkdown(): string {
  const lines: string[] = [
    "# Mermaid 11 diagram types (export samples)",
    "",
    "Inventory is taken from `mermaid@" +
      MERMAID_PACKAGE_VERSION +
      "` detectors in the installed package. Experimental types use the documented `-beta` keyword.",
    "",
  ];

  for (const entry of MERMAID_DIAGRAM_TYPES) {
    const badge = entry.supported ? "supported" : "unsupported";
    lines.push(`## ${entry.title} (\`${entry.id}\`)`);
    lines.push("");
    lines.push(
      `- Stability: ${entry.stability}; export: **${badge}**; keywords: ${entry.keywords
        .map((keyword) => "`" + keyword + "`")
        .join(", ")}`
    );
    if (entry.reason) {
      lines.push(`- Reason: ${entry.reason}`);
    }
    lines.push("");
    lines.push(mermaidFence(entry.sample));
    lines.push("");
  }

  return lines.join("\n");
}
