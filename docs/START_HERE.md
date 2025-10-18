# 👋 Start Here: Portfolio Navigation Guide

**Welcome!** This document helps you navigate this portfolio project based on your role and interests.

---

## 🎯 I'm a Hiring Manager - Show Me The Good Stuff

**Start with these 3 documents (15-minute read):**

1. **[README.md](../README.md)** (5 min) - Project overview, key skills demonstrated
2. **[CASE_STUDY.md](../CASE_STUDY.md)** (7 min) - Complete project narrative with learnings
3. **[PRD](./product/PRD.md)** (3 min - skim) - Product thinking demonstration

**Then explore based on the role:**

### For AI SDR Startup Founders/Leaders:
- ✅ Product thinking → [PRD](./product/PRD.md), [Metrics Framework](./product/METRICS.md)
- ✅ Technical depth → [System Design](./architecture/SYSTEM_DESIGN.md), [AI Strategy](./ai-engineering/AI_STRATEGY.md)
- ✅ Decision-making → [ADRs](./decisions/)

### For Technical Interviewers:
- ✅ Architecture → [System Design](./architecture/SYSTEM_DESIGN.md)
- ✅ AI Implementation → [AI Strategy](./ai-engineering/AI_STRATEGY.md)
- ✅ Trade-off Analysis → [ADR 001](./decisions/001-multi-provider-ai-strategy.md), [ADR 002](./decisions/002-websocket-vs-polling.md)

---

## 👔 I'm Evaluating Product Management Skills

**Read in this order:**

1. [Product Requirements Document](./product/PRD.md)
   - User personas based on industry research
   - User stories with acceptance criteria
   - RICE prioritization framework
   - Go-to-market strategy

2. [Metrics Framework](./product/METRICS.md)
   - North Star metric definition
   - AARRR + AI-specific KPIs
   - Dashboard mockups
   - A/B testing framework

3. [Case Study](../CASE_STUDY.md) - Sections to focus on:
   - Product Strategy (voice-first decision)
   - What I'd Do Differently (learnings)

**Time Required:** 30 minutes

---

## 🤖 I'm Evaluating AI Engineering Skills

**Read in this order:**

1. [AI Strategy & Architecture](./ai-engineering/AI_STRATEGY.md)
   - Multi-provider decision matrix
   - Prompt engineering evolution (v1.0 → v2.0)
   - Cost optimization techniques ($0.68 → $0.42/call)
   - AI quality assurance framework

2. [ADR: Multi-Provider AI Strategy](./decisions/001-multi-provider-ai-strategy.md)
   - Why multi-provider? (availability + cost)
   - Alternatives considered
   - Validation results

3. [Case Study - AI Engineering Section](../CASE_STUDY.md#ai-engineering-quality--cost-optimization)

**Time Required:** 25 minutes

---

## ⚙️ I'm Evaluating Backend Engineering Skills

**Read in this order:**

1. [System Design](./architecture/SYSTEM_DESIGN.md)
   - High-level architecture diagrams
   - Data flow (lead submission → AI call → CRM)
   - Scalability analysis (1 instance → horizontal scaling)
   - Performance benchmarks

2. [ADR: WebSocket vs HTTP Polling](./decisions/002-websocket-vs-polling.md)
   - Real-time architecture decision
   - Load testing results (500 concurrent clients)

3. [ADR: Prisma ORM Choice](./decisions/003-prisma-orm-choice.md)
   - Database abstraction trade-offs
   - Performance vs developer experience

**Time Required:** 30 minutes

---

## 🚀 I'm a Developer Who Wants to Run This

**Quick Start:**

```bash
# Clone
git clone https://github.com/Mohit4022-cloud/Mohit-AI-Backend.git
cd Mohit-AI-Backend

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your API keys (OpenAI, Twilio optional)

# Setup database
npx prisma migrate deploy
npx prisma generate

# Run
npm run dev
```

**Then explore:**
- API Endpoints: `http://localhost:5000/health`
- Code structure: Start with `src/server.js`
- Database schema: `prisma/schema.prisma`

---

## 📊 Document Map (At a Glance)

```
Mohit-AI-Backend/
├── README.md                           ⭐ Start here
├── CASE_STUDY.md                       ⭐ Full project narrative
├── docs/
│   ├── START_HERE.md                   👈 You are here
│   ├── product/
│   │   ├── PRD.md                      🎯 Product strategy, user stories
│   │   └── METRICS.md                  📊 KPIs, dashboards, analytics
│   ├── architecture/
│   │   └── SYSTEM_DESIGN.md            🏗️ Backend architecture, scalability
│   ├── ai-engineering/
│   │   └── AI_STRATEGY.md              🤖 AI providers, prompts, cost optimization
│   └── decisions/
│       ├── 001-multi-provider-ai.md    📝 AI fallback architecture
│       ├── 002-websocket-vs-polling.md 📝 Real-time communication
│       └── 003-prisma-orm-choice.md    📝 Database ORM decision
```

---

## 💡 Key Differentiators of This Portfolio

**1. Honest About Scope**
- Clearly labeled as portfolio/demonstration project
- No fake customer metrics or invented testimonials
- All data sources cited (industry reports)

**2. Full-Stack Thinking**
- Not just code - product strategy + architecture + implementation
- Shows how PM/AI Eng/Backend Eng skills work together

**3. Decision Documentation**
- Every major choice has an ADR explaining why
- Alternatives considered with trade-off analysis
- Validation with metrics

**4. Production-Ready Quality**
- Multi-provider AI fallback (not just POC with one API)
- Real-time WebSocket architecture
- Security, monitoring, scalability built in

---

## ❓ Common Questions

### "Is this a real product with customers?"
No, this is a portfolio demonstration project. All code is functional and production-ready, but metrics are based on industry research and hypothetical scenarios. This demonstrates my ability to build AI products, not that I've successfully sold one (yet!).

### "Why AI SDR specifically?"
I researched the space and identified a gap: competitors focus on outbound (11x.ai) or analytics (Gong), but nobody owns the *inbound* voice-first SDR workflow. This shows product thinking + market understanding.

### "How long did this take?"
3 months solo (July - October 2025). Includes research, architecture, implementation, and documentation.

### "What's the tech highlight you're most proud of?"
Multi-provider AI architecture with automatic fallback. It's the difference between a POC and production-ready system. Shows I think about reliability, not just features.

---

## 📞 Want to Discuss This Project?

**Mohit Tiwari**
- 📧 Email: mohit@mohit-ai.com
- 💼 LinkedIn: [linkedin.com/in/mohittiwari](https://linkedin.com/in/mohittiwari)
- 🐙 GitHub: [github.com/Mohit4022-cloud](https://github.com/Mohit4022-cloud)

**Best use of your time:**
- Short conversation? Read [README](../README.md) + [Case Study](../CASE_STUDY.md)
- Technical interview? Review [System Design](./architecture/SYSTEM_DESIGN.md) + [AI Strategy](./ai-engineering/AI_STRATEGY.md)
- Product discussion? Read [PRD](./product/PRD.md) + [Metrics](./product/METRICS.md)

---

*Last Updated: October 17, 2025*
