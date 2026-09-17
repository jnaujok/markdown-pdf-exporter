# Distributed Microservices Architecture & Math Specification

This document demonstrates the full rendering capabilities of the **Markdown to PDF (with Mermaid & Math)** extension.

---

## 1. System Topology (Flowchart)

Below is the microservices routing topology:

```mermaid
flowchart TD
    Client[Web & Mobile Clients] -->|HTTPS / WSS| CDN[Global Edge CDN]
    CDN -->|Encrypted Mesh| APIGateway[Cloud API Gateway]
    
    subgraph Core Services
        APIGateway --> AuthSvc[Authentication Service]
        APIGateway --> OrderSvc[Order Processing Service]
        APIGateway --> PaymentSvc[Payment Gateway Service]
    end

    subgraph Data & Cache Tier
        OrderSvc --> Redis[(Redis Cache Cluster)]
        OrderSvc --> Postgres[(PostgreSQL Primary / Replica)]
        PaymentSvc --> Vault[(HashiCorp Vault)]
    end

    AuthSvc -.->|OAuth2 / JWT| APIGateway
```

---

## 2. Authentication Flow (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant DB as Identity DB

    User->>Browser: Submit Credentials
    Browser->>Gateway: POST /api/v1/auth/login
    Gateway->>Auth: Validate Credentials
    Auth->>DB: Query User Record & Hash
    DB-->>Auth: Return Hash & Salt
    Auth->>Auth: Verify Argon2id
    Auth-->>Gateway: Issue JWT Access & Refresh Token
    Gateway-->>Browser: HTTP 200 (Secure HttpOnly Cookie)
    Browser-->>User: Redirect to Dashboard
```

---

## 3. Mathematical Foundations (KaTeX LaTeX)

### 3.1 Normal Distribution Probability Density Function
The standard Gaussian probability density function is represented as:

$$f(x \mid \mu, \sigma^2) = \frac{1}{\sqrt{2\pi\sigma^2}} \exp\left( -\frac{(x - \mu)^2}{2\sigma^2} \right)$$

### 3.2 Euler's Identity & Energy Formulation
Inline equations work seamlessly: Euler's identity is defined as $e^{i\pi} + 1 = 0$, and relativistic energy is given by $E^2 = (mc^2)^2 + (pc)^2$.

### 3.3 Fourier Transform Definition
$$\hat{f}(\xi) = \int_{-\infty}^{\infty} f(x) e^{-2\pi i x \xi} \, dx$$

---

## 4. Entity Relationship Model

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    CUSTOMER {
        string customer_id PK
        string email
        string full_name
        datetime created_at
    }
    ORDER {
        string order_id PK
        string customer_id FK
        decimal total_amount
        string status
    }
    ORDER_ITEM {
        string item_id PK
        string order_id FK
        string product_id FK
        int quantity
        decimal unit_price
    }
    PRODUCT {
        string product_id PK
        string sku
        string title
        decimal price
    }
```

---

## 5. Performance Metrics & SLA Benchmarks

| Service | p50 Latency (ms) | p95 Latency (ms) | p99 Latency (ms) | Target Availability |
| :--- | :---: | :---: | :---: | :---: |
| **API Gateway** | 1.2 | 3.5 | 6.8 | 99.99% |
| **Auth Service** | 4.8 | 12.0 | 25.4 | 99.95% |
| **Order Service** | 8.5 | 18.2 | 38.0 | 99.99% |
| **Payment Service**| 45.0 | 95.0 | 180.0 | 99.999% |

> **Note on Reliability:** All critical path queries utilize connection pooling with circuit breakers configured to trip at $5\%$ consecutive failure rate.

```typescript
// Sample Circuit Breaker Definition
export class CircuitBreaker {
  private failureCount = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(private readonly threshold: number = 5) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN. Fast failing.');
    }
    try {
      const result = await fn();
      this.failureCount = 0;
      return result;
    } catch (err) {
      if (++this.failureCount >= this.threshold) {
        this.state = 'OPEN';
      }
      throw err;
    }
  }
}
```

---

## 6. Inline code wrapping (regression)

When an inline code span wraps across a line end, each line fragment must keep its own highlight. The highlight must not paint one opaque rectangle that erases the surrounding sentence. This paragraph is deliberately long so the following token wraps: `abcdefghijklmnopqrstuvwxyz-wrap-test-token-one-two-three-four-five-six-seven-eight-nine-ten` sits in the middle of ordinary words on both sides, and a second example uses a spaced phrase `this inline code span is intentionally verbose so the renderer must wrap it across a line boundary without covering neighbors`.

---

## 7. Platform Delivery Schedule (Gantt)

A realistic multi-section Gantt with done / active / critical tasks, a milestone, weekend exclusions, and `after` dependencies. This must raster into the printable column without collapsing or timing out.

```mermaid
gantt
    title Q3 Platform Delivery
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d
    tickInterval 1week
    excludes    weekends
    weekday     monday

    section Discovery
    Stakeholder interviews       :done,    disc1, 2026-07-01, 10d
    Architecture spike           :done,    disc2, after disc1, 8d

    section Build
    Auth service                 :active,  build1, 2026-07-20, 21d
    Order API                    :         build2, after disc2, 18d
    Payment adapter              :crit,    build3, after build1, 14d

    section QA
    Integration tests            :         qa1, after build2, 10d
    Load testing                 :         qa2, after build3, 7d
    Security review              :crit,    qa3, after qa1, 5d

    section Release
    Staging rollout              :         rel1, after qa3, 4d
    Production cutover           :milestone, rel2, after rel1, 0d
```

---

## 8. Additional Mermaid types

Export covers every diagram detector shipped in mermaid@11.16.1 except `flowchart-elk` (ELK is not bundled). Full sample fences live in `samples/mermaid-all-diagrams.md`.

```mermaid
radar-beta
  title Skills
  axis docs["Docs"], tests["Tests"], ux["UX"], perf["Perf"]
  curve a["Current"]{4, 3, 2, 4}
  curve b["Target"]{5, 4, 4, 4}
  max 5
```

```mermaid
venn-beta
set A ["Backend"]
set B ["Frontend"]
union A,B ["Full-stack"]
```

```mermaid
architecture-beta
    group api(cloud)[API]
    service db(database)[Database] in api
    service server(server)[Server] in api
    db:L -- R:server
```


