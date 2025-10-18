# System Architecture Diagrams

> **Note:** These diagrams use Mermaid syntax and render automatically on GitHub. You can also export them as images using tools like [Mermaid Live Editor](https://mermaid.live/).

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Dashboard<br/>React]
        B[Mobile App<br/>React Native]
        C[External Webhooks<br/>CRM Systems]
    end

    subgraph "API Gateway Layer"
        D[Load Balancer<br/>AWS ALB / Nginx]
        D --> E[Express.js API Server<br/>Node.js 18+]
        D --> F[Socket.io Server<br/>Real-time Events]
    end

    subgraph "Service Layer"
        E --> G[AI Service Factory]
        E --> H[Lead Management]
        E --> I[CRM Sync Service]
        E --> J[Analytics Service]
        F --> K[WebSocket Handlers]
    end

    subgraph "AI Providers"
        G --> L[OpenAI GPT-4<br/>Primary]
        G --> M[Google Gemini<br/>Fallback]
        G --> N[ElevenLabs<br/>Voice Synthesis]
    end

    subgraph "Data Layer"
        H --> O[(PostgreSQL<br/>Prisma ORM)]
        H --> P[(Redis<br/>Cache + Queue)]
        I --> Q[S3 Storage<br/>Call Recordings]
    end

    subgraph "External Services"
        I --> R[Twilio<br/>Voice + SMS]
        I --> S[HubSpot API<br/>CRM Sync]
        I --> T[Salesforce API<br/>CRM Sync]
    end

    A -.HTTPS/WSS.-> D
    B -.HTTPS/WSS.-> D
    C -.HTTPS.-> D

    style L fill:#10a37f,stroke:#0d8a6a,color:#fff
    style M fill:#4285f4,stroke:#357ae8,color:#fff
    style N fill:#6366f1,stroke:#4f46e5,color:#fff
    style O fill:#336791,stroke:#2d5a7b,color:#fff
    style P fill:#dc382d,stroke:#c5302b,color:#fff
```

---

## 2. AI Call Flow (Lead Submission → AI Call → CRM Update)

```mermaid
sequenceDiagram
    participant User as Inbound Lead
    participant Form as Website Form
    participant API as API Server
    participant Queue as Bull Queue
    participant AI as AI Service
    participant Twilio as Twilio
    participant OpenAI as OpenAI GPT-4
    participant ElevenLabs as ElevenLabs
    participant DB as PostgreSQL
    participant CRM as HubSpot
    participant WS as WebSocket

    User->>Form: Submits demo request
    Form->>API: POST /api/leads
    API->>DB: Create lead record
    API->>Queue: Add job: enrich-lead
    API->>Queue: Add job: schedule-ai-call
    API-->>Form: 201 Created

    Queue->>AI: Process: enrich-lead
    AI->>DB: Update lead (company data)

    Queue->>AI: Process: schedule-ai-call
    AI->>Twilio: Initiate call to lead
    Twilio-->>AI: Call connected

    loop During Call
        AI->>OpenAI: Generate response (BANT questions)
        OpenAI-->>AI: AI response text
        AI->>ElevenLabs: Text-to-Speech
        ElevenLabs-->>AI: Audio stream
        AI->>Twilio: Play audio to lead
        Twilio-->>AI: Lead response (audio)
        AI->>OpenAI: Transcribe + Analyze (Whisper)
        AI->>DB: Store transcript entry
        AI->>WS: Emit transcript:update
        WS-->>User: Real-time update
    end

    AI->>OpenAI: Generate final BANT score
    OpenAI-->>AI: Qualification result (0-100)
    AI->>DB: Update call status
    AI->>Queue: Add job: sync-to-crm

    Queue->>CRM: POST /contacts (HubSpot API)
    CRM-->>Queue: Contact created
    Queue->>CRM: POST /engagements (call log)
    CRM-->>Queue: Activity logged

    AI->>WS: Emit call:completed
    WS-->>User: Dashboard update
```

---

## 3. Multi-Provider AI Fallback Architecture

```mermaid
graph TB
    A[AI Service Factory] --> B{Check Provider Health}

    B -->|Primary Healthy| C[OpenAI GPT-4<br/>Priority: 1<br/>Health: 100%]
    B -->|Primary Down| D[Circuit Breaker<br/>Triggered]

    D --> E[Google Gemini<br/>Priority: 2<br/>Health: 100%]

    C -->|Success| F[Record Success Metrics]
    C -->|Failure| G{Failure Type?}

    G -->|Rate Limit 429| H[Immediate Switch to Gemini]
    G -->|Timeout >5s| H
    G -->|Service Error 503| H
    G -->|3 Consecutive Failures| I[Switch for 15 minutes]

    H --> E
    I --> E

    E -->|Success| J[Record Fallback Event]
    E -->|Failure| K[All Providers Failed<br/>Alert + Queue for Retry]

    F --> L[Return to Caller]
    J --> L
    K --> M[Return Error]

    style C fill:#10a37f,stroke:#0d8a6a,color:#fff
    style E fill:#4285f4,stroke:#357ae8,color:#fff
    style K fill:#ef4444,stroke:#dc2626,color:#fff
```

---

## 4. Real-Time WebSocket Architecture

```mermaid
graph LR
    subgraph "Clients"
        A1[Dashboard User 1]
        A2[Dashboard User 2]
        A3[Mobile App User]
    end

    subgraph "Socket.io Server"
        B[Socket.io Connection Manager]
        B --> C[Room: call-123]
        B --> D[Room: call-456]
        B --> E[Room: dashboard-user1]
    end

    subgraph "Backend Services"
        F[AI Call Service]
        G[Transcription Service]
        H[Insights Service]
    end

    subgraph "Event Broadcasting"
        I[Event Emitter]
    end

    A1 -.Join call-123.-> C
    A2 -.Join call-456.-> D
    A3 -.Join dashboard-user1.-> E

    F --> I
    G --> I
    H --> I

    I -->|transcript:update| C
    I -->|insight:new| C
    I -->|call:status| C

    I -->|transcript:update| D
    I -->|queue:updated| E

    C -.Broadcast.-> A1
    D -.Broadcast.-> A2
    E -.Broadcast.-> A3

    style B fill:#6366f1,stroke:#4f46e5,color:#fff
    style I fill:#10b981,stroke:#059669,color:#fff
```

---

## 5. Database Schema (Core Entities)

```mermaid
erDiagram
    LEAD ||--o{ AI_CALL : has
    LEAD ||--o{ LEAD_ACTIVITY : has
    LEAD }o--|| USER : "assigned to"

    AI_CALL ||--o{ TRANSCRIPT_ENTRY : contains
    AI_CALL ||--o{ AI_INSIGHT : generates
    AI_CALL }o--|| LEAD : "belongs to"

    USER ||--o{ LEAD : manages

    LEAD {
        uuid id PK
        string email UK
        string phone
        string company
        string status
        int score
        uuid assignedToId FK
        timestamp createdAt
        timestamp updatedAt
    }

    AI_CALL {
        uuid id PK
        uuid leadId FK
        string status
        int duration
        json bant
        int overallScore
        string aiProvider
        decimal cost
        timestamp createdAt
        timestamp completedAt
    }

    TRANSCRIPT_ENTRY {
        uuid id PK
        uuid callId FK
        string speaker
        text content
        timestamp timestamp
        decimal confidence
    }

    AI_INSIGHT {
        uuid id PK
        uuid callId FK
        string type
        text content
        decimal confidence
        timestamp timestamp
    }

    USER {
        uuid id PK
        string email UK
        string name
        string role
        timestamp createdAt
    }

    LEAD_ACTIVITY {
        uuid id PK
        uuid leadId FK
        string type
        json metadata
        timestamp createdAt
    }
```

---

## 6. Background Job Queue Architecture

```mermaid
graph LR
    subgraph "Job Producers"
        A[API Server]
        B[Scheduled Tasks<br/>node-cron]
        C[Webhook Handlers]
    end

    subgraph "Bull Queue (Redis)"
        D[Lead Enrichment Queue<br/>Priority: High]
        E[AI Call Queue<br/>Priority: High]
        F[CRM Sync Queue<br/>Priority: Medium]
        G[Email Campaign Queue<br/>Priority: Low]
    end

    subgraph "Workers"
        H[Worker 1<br/>Concurrency: 5]
        I[Worker 2<br/>Concurrency: 5]
        J[Worker 3<br/>Concurrency: 10]
    end

    subgraph "External Services"
        K[Clearbit API<br/>Enrichment]
        L[Twilio API<br/>Calls]
        M[HubSpot API<br/>CRM]
    end

    A --> D
    A --> E
    B --> F
    C --> G

    D --> H
    E --> H
    F --> I
    G --> J

    H --> K
    H --> L
    I --> M
    J --> M

    style D fill:#fbbf24,stroke:#f59e0b,color:#000
    style E fill:#ef4444,stroke:#dc2626,color:#fff
    style F fill:#3b82f6,stroke:#2563eb,color:#fff
    style G fill:#6b7280,stroke:#4b5563,color:#fff
```

---

## 7. Horizontal Scaling Architecture

```mermaid
graph TB
    subgraph "DNS & Load Balancing"
        A[Route 53<br/>DNS]
        A --> B[Application Load Balancer<br/>AWS ALB]
    end

    subgraph "Auto Scaling Group"
        B --> C[API Instance 1<br/>t3.large]
        B --> D[API Instance 2<br/>t3.large]
        B --> E[API Instance 3<br/>t3.large]
    end

    subgraph "Shared State Layer"
        F[(Redis Cluster<br/>ElastiCache)]
        G[(PostgreSQL Primary<br/>RDS)]
    end

    subgraph "Read Replicas"
        G --> H[(Read Replica 1<br/>us-east-1a)]
        G --> I[(Read Replica 2<br/>us-east-1b)]
    end

    C --> F
    D --> F
    E --> F

    C --> G
    D --> G
    E --> G

    C -.Read.-> H
    D -.Read.-> I
    E -.Read.-> H

    subgraph "Monitoring"
        J[CloudWatch<br/>Metrics & Alarms]
    end

    C --> J
    D --> J
    E --> J

    style B fill:#ff9900,stroke:#ff6600,color:#fff
    style F fill:#dc382d,stroke:#c5302b,color:#fff
    style G fill:#336791,stroke:#2d5a7b,color:#fff
```

---

## 8. Cost Optimization Flow (AI Calls)

```mermaid
graph TB
    A[Incoming AI Call Request] --> B{Check Cache<br/>Redis}

    B -->|Cache Hit| C[Return Cached Response<br/>Cost: $0.00]
    B -->|Cache Miss| D{Determine Task Type}

    D -->|Simple: Sentiment Analysis| E[GPT-3.5-turbo<br/>Cost: $0.02/call]
    D -->|Medium: Transcript Summary| F[GPT-3.5-turbo<br/>Cost: $0.03/call]
    D -->|Complex: Live Conversation| G{Check Provider Cost}

    G -->|Normal Traffic| H[OpenAI GPT-4<br/>Cost: $0.30/call]
    G -->|High Traffic / Cost Spike| I[Google Gemini<br/>Cost: $0.12/call]

    E --> J[Cache Result<br/>TTL: 24 hours]
    F --> K[Cache Result<br/>TTL: 90 days]
    H --> L[No Cache<br/>Real-time only]
    I --> L

    C --> M[Total Call Cost: $0.42]
    J --> M
    K --> M
    L --> M

    M --> N{Cost Threshold Check}
    N -->|Hourly Cost <$150| O[Continue Normal Operations]
    N -->|Hourly Cost >$200| P[Alert + Auto-switch to Gemini]

    style C fill:#10b981,stroke:#059669,color:#fff
    style E fill:#fbbf24,stroke:#f59e0b,color:#000
    style H fill:#10a37f,stroke:#0d8a6a,color:#fff
    style I fill:#4285f4,stroke:#357ae8,color:#fff
    style P fill:#ef4444,stroke:#dc2626,color:#fff
```

---

## How to Use These Diagrams

### On GitHub
These diagrams render automatically when viewing the Markdown file on GitHub.

### Export as Images
1. Copy the Mermaid code
2. Go to [Mermaid Live Editor](https://mermaid.live/)
3. Paste the code
4. Click "Actions" → "PNG" or "SVG" to download

### Embed in Documentation
Reference from other docs:
```markdown
![System Architecture](./diagrams/system-architecture.md#1-high-level-system-architecture)
```

---

## Diagram Legend

| Color | Meaning |
|-------|---------|
| 🟢 Green | Success state, cached data |
| 🔵 Blue | External service, database |
| 🟡 Yellow | Warning, medium priority |
| 🔴 Red | Error state, high priority, alerts |
| 🟣 Purple | Real-time / WebSocket |
| 🟠 Orange | Load balancer, AWS infrastructure |

---

*Last Updated: October 17, 2025*
