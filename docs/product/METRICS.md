# Metrics Framework: AI SDR Platform

**Author:** Mohit Tiwari
**Last Updated:** October 15, 2025
**Status:** Framework Design (Pre-Launch)

> **Note:** This metrics framework is designed for a production AI SDR platform. While the backend implementation is complete and functional, metrics collection represents planned instrumentation for real customer deployments.

---

## Philosophy: Metrics-Driven Product Development

**Core Principle:** Every feature must move at least one of these three needles:
1. **Speed** - Reduce time from lead capture to qualified conversation
2. **Quality** - Improve lead qualification accuracy and conversation quality
3. **Scale** - Increase volume of leads processed per dollar spent

**Anti-pattern:** Vanity metrics that don't correlate with revenue (e.g., total AI calls made without qualification rate)

---

## North Star Metric

### Lead-to-Opportunity Conversion Rate

**Definition:** % of inbound leads that convert to sales-qualified opportunities within 30 days

**Why This Metric:**
- Directly ties to revenue (not a proxy)
- Captures both speed AND quality of lead handling
- Aligns sales, marketing, and product teams
- Industry benchmark: 8-12% (we target 15%+)

**Calculation:**
```sql
SELECT
  COUNT(DISTINCT CASE WHEN opportunity_created_at IS NOT NULL THEN lead_id END) * 100.0 /
  COUNT(DISTINCT lead_id) AS conversion_rate
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND source_type = 'inbound'
```

---

## Metric Hierarchy (AARRR + AI-Specific)

### 1. Acquisition Metrics

**A1: Lead Capture Rate**
- **Definition:** % of website visitors who submit lead form
- **Target:** Industry avg 2-5%, we aim for 8% with AI chat

**A2: Lead Response Time (P50, P90, P99)**
- **Definition:** Time from form submission to first AI engagement
- **Target:**
  - P50: <2 minutes
  - P90: <5 minutes
  - P99: <10 minutes (even during traffic spikes)
- **How Measured:** `response_time_ms = ai_call_initiated_at - lead_created_at`

**A3: Multi-channel Reach Rate**
- **Definition:** % of leads engaged on 2+ channels (voice + SMS + email)
- **Target:** 70%
- **Why:** Redundancy increases connection rate by 3x

---

### 2. Activation Metrics (Lead Engagement)

**B1: Call Connection Rate**
- **Definition:** % of AI calls where lead answers
- **Target:** 60-70% (industry benchmark: 50% for cold calls, we benefit from inbound context)
- **Segmentation:**
  - Business hours: 75%
  - After hours: 45%
  - Mobile vs landline: Track separately

**B2: Conversation Completion Rate**
- **Definition:** % of connected calls where AI completes qualification script
- **Target:** 80%
- **Failure Modes to Track:**
  - Lead hangs up early (<30 sec): Indicates poor opening
  - AI transfers to human: Indicates AI limitation
  - Technical failure: API errors, latency issues

**B3: Average Conversation Duration**
- **Definition:** Median call length for completed calls
- **Target:** 4-6 minutes (sweet spot for BANT without friction)
- **Monitoring:**
  - <2 min: Likely unqualified or AI failure
  - >10 min: AI may be inefficient

---

### 3. AI Quality Metrics (Custom for AI SDR)

**C1: Lead Qualification Accuracy**
- **Definition:** % agreement between AI qualification and human SDR review
- **Target:** 85% agreement
- **How Measured:**
  - Sample 50 calls/week
  - Human SDR re-scores BANT (blind to AI score)
  - Calculate Cohen's Kappa coefficient

**C2: BANT Completeness**
- **Definition:** % of qualification calls that capture all 4 BANT dimensions
- **Target:** >90%
- **Breakdown:**
  - Budget: 95% (easiest, direct question)
  - Authority: 85% (requires navigating org chart)
  - Need: 98% (natural in conversation)
  - Timeline: 80% (hardest, requires probing)

**C3: Conversation Quality Score**
- **Definition:** Post-call lead NPS + AI naturalness rating
- **Target:** 4.0/5.0 average
- **Components:**
  - Lead satisfaction (post-call survey): 40%
  - Transcript coherence (GPT-4 grading): 30%
  - Filler word ratio (<5%): 15%
  - Response latency (<2sec): 15%

**C4: AI Confidence Score Calibration**
- **Definition:** Correlation between AI's self-reported confidence and actual accuracy
- **Target:** R² > 0.7 (well-calibrated)
- **Use Case:** If AI says 90% confident, it should be right 90% of the time

---

### 4. Retention Metrics (Lead Nurture)

**D1: Follow-up Response Rate**
- **Definition:** % of AI-sent follow-up emails/SMS that get replies
- **Target:** 35% (vs 20% industry avg for cold outreach)

**D2: Meeting Booking Rate**
- **Definition:** % of qualified leads that book demo/discovery call
- **Target:** 60%

**D3: No-show Rate**
- **Definition:** % of booked meetings where lead doesn't attend
- **Target:** <15% (AI sends multi-channel reminders)

---

### 5. Revenue Metrics

**E1: Cost Per Qualified Lead**
- **Definition:** Total platform cost ÷ # of SQLs generated
- **Target:** $80 (vs $280 industry average with human SDRs)
- **Cost Components:**
  - AI provider costs (OpenAI, ElevenLabs): $0.45/call
  - Twilio (voice + SMS): $0.15/call
  - Infrastructure (AWS, Redis): $0.05/call
  - Platform fee: $0.35/call
  - **Total:** ~$1.00/call → $5-8/SQL (assuming 12-15% qualification rate)

**E2: Lead Velocity Rate (LVR)**
- **Definition:** Month-over-month growth in qualified leads
- **Target:** 15-25% MoM in first year
- **Formula:** `(Qualified Leads This Month - Qualified Leads Last Month) ÷ Qualified Leads Last Month`

**E3: Lead-to-Close Time**
- **Definition:** Days from inbound lead to closed-won deal
- **Target:** Reduce from industry avg 45 days to 30 days
- **Hypothesis:** Faster initial response = faster close

---

## Dashboard Mockups (Proposed Views)

### Executive Dashboard (For CEO/CRO)

```
┌─────────────────────────────────────────────────────────┐
│  North Star: Lead→Opportunity Conversion    15.2% ↑2.1% │
│                                                           │
│  This Month                                               │
│  ├─ Inbound Leads: 847                                   │
│  ├─ AI Contacted: 823 (97.2%)                           │
│  ├─ Qualified: 124 (15.1%)                              │
│  └─ Opportunities: 129 (15.2%)                          │
│                                                           │
│  Key Metrics vs Target                                    │
│  ├─ Response Time (P90): 4.2min ✅ (target: <5min)      │
│  ├─ Call Connection: 68% ✅ (target: 60%)               │
│  ├─ Cost/SQL: $82 ⚠️ (target: $80)                      │
│  └─ AI Accuracy: 87% ✅ (target: 85%)                   │
└─────────────────────────────────────────────────────────┘
```

### SDR Manager Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  Lead Queue (Requires Human Follow-up)                   │
│                                                           │
│  🔥 Hot Leads (AI Score >80):  12 leads                 │
│  └─ Avg Wait Time: 18 minutes                           │
│                                                           │
│  🟡 Warm Leads (AI Score 60-80):  34 leads              │
│  └─ Avg Wait Time: 2.4 hours                            │
│                                                           │
│  AI Performance Today                                     │
│  ├─ Calls Attempted: 89                                  │
│  ├─ Connected: 62 (69.7%)                               │
│  ├─ Completed Qualification: 54 (87%)                   │
│  ├─ Technical Failures: 2 (2.2%) ⚠️                     │
│  └─ Avg Call Quality Score: 4.3/5.0 ✅                  │
│                                                           │
│  Rep Performance (Human Follow-ups)                       │
│  ├─ Sarah: 8 calls, 5 meetings booked (62.5%)           │
│  ├─ Mike: 6 calls, 3 meetings booked (50%)              │
│  └─ Alex: 4 calls, 3 meetings booked (75%) 🏆          │
└─────────────────────────────────────────────────────────┘
```

### AI Ops Dashboard (For Product/Eng Team)

```
┌─────────────────────────────────────────────────────────┐
│  AI Provider Health                                       │
│                                                           │
│  OpenAI GPT-4                                            │
│  ├─ Uptime: 99.8%                                        │
│  ├─ Avg Latency: 850ms                                   │
│  ├─ Cost/1k tokens: $0.03                               │
│  └─ Fallback Triggers: 3 (last 24h)                     │
│                                                           │
│  ElevenLabs Voice                                         │
│  ├─ Uptime: 99.9%                                        │
│  ├─ Avg Generation Time: 1.2s                           │
│  ├─ Cost/call: $0.15                                     │
│  └─ Voice: "Rachel" (professional female)                │
│                                                           │
│  System Performance                                       │
│  ├─ API P99 Latency: 180ms ✅                           │
│  ├─ WebSocket Connections: 47 active                     │
│  ├─ Queue Depth: 3 pending calls                        │
│  ├─ Redis Hit Rate: 94.2%                               │
│  └─ Database Connection Pool: 18/50 used                 │
│                                                           │
│  Error Rates (Last 1 Hour)                               │
│  ├─ AI API Errors: 0.2% ✅                              │
│  ├─ Twilio Errors: 0.5% ✅                              │
│  ├─ CRM Sync Errors: 1.2% ⚠️ (investigate HubSpot)     │
│  └─ 5xx Server Errors: 0.0% ✅                          │
└─────────────────────────────────────────────────────────┘
```

---

## Instrumentation Plan (Technical Implementation)

### Event Schema (Snowplow-style)

**Event: `lead_created`**
```json
{
  "event_id": "uuid",
  "timestamp": "2025-10-15T14:23:01Z",
  "lead_id": "lead_xyz",
  "source": "website_form",
  "utm_campaign": "google_ads_q4",
  "company_size": "50-200",
  "industry": "saas"
}
```

**Event: `ai_call_initiated`**
```json
{
  "event_id": "uuid",
  "timestamp": "2025-10-15T14:24:15Z",
  "lead_id": "lead_xyz",
  "call_id": "call_abc",
  "phone_number": "+1-555-0123",
  "ai_provider": "openai",
  "voice_provider": "elevenlabs"
}
```

**Event: `ai_call_completed`**
```json
{
  "event_id": "uuid",
  "timestamp": "2025-10-15T14:29:42Z",
  "call_id": "call_abc",
  "duration_seconds": 327,
  "call_outcome": "qualified",
  "bant_score": {
    "budget": 8,
    "authority": 7,
    "need": 9,
    "timeline": 6,
    "overall": 75
  },
  "ai_confidence": 0.82,
  "transcript_word_count": 842,
  "cost_usd": 0.58
}
```

### Data Pipeline Architecture

```
Lead Form → API → PostgreSQL → Event Bus (Redis) → Analytics DB (ClickHouse/Snowflake)
                       ↓                                      ↓
                   WebSocket → Real-time Dashboard     BI Tool (Metabase/Looker)
```

### SQL Queries for Key Metrics

**Response Time P90:**
```sql
SELECT PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY response_time_seconds) AS p90_response_time
FROM (
  SELECT
    lead_id,
    EXTRACT(EPOCH FROM (ai_call_initiated_at - lead_created_at)) AS response_time_seconds
  FROM leads
  WHERE created_at >= NOW() - INTERVAL '7 days'
    AND ai_call_initiated_at IS NOT NULL
) subquery;
```

**AI Qualification Accuracy (requires human review join):**
```sql
SELECT
  COUNT(CASE WHEN ai_score_bucket = human_score_bucket THEN 1 END) * 100.0 / COUNT(*) AS accuracy_pct
FROM (
  SELECT
    c.call_id,
    CASE
      WHEN c.bant_overall_score >= 70 THEN 'qualified'
      WHEN c.bant_overall_score >= 40 THEN 'nurture'
      ELSE 'disqualified'
    END AS ai_score_bucket,
    CASE
      WHEN hr.human_score >= 70 THEN 'qualified'
      WHEN hr.human_score >= 40 THEN 'nurture'
      ELSE 'disqualified'
    END AS human_score_bucket
  FROM ai_calls c
  INNER JOIN human_reviews hr ON c.call_id = hr.call_id
  WHERE c.created_at >= NOW() - INTERVAL '30 days'
) scored;
```

---

## A/B Testing Framework

### Example Test: Voice Selection

**Hypothesis:** Female voice has higher connection rate for B2B SaaS leads

**Test Design:**
- **Variant A:** ElevenLabs "Rachel" (professional female)
- **Variant B:** ElevenLabs "Josh" (professional male)
- **Sample Size:** 500 calls per variant (power analysis: detect 5% difference at 95% confidence)
- **Duration:** 2 weeks
- **Randomization:** Hash(lead_id) % 2

**Metrics:**
- Primary: Call connection rate
- Secondary: Call completion rate, quality score
- Guardrail: Cost per call (must stay <$1.00)

**Decision Criteria:**
- If p < 0.05 and delta > 5%: Ship winner
- If p < 0.05 and delta < 5%: Inconclusive, offer both options
- If p >= 0.05: No significant difference, choose cheaper option

---

## Alerting & Anomaly Detection

### Critical Alerts (Pagerduty → On-call Engineer)

| Alert | Condition | SLA |
|-------|-----------|-----|
| High Error Rate | 5xx errors >1% for 5 min | Respond in 15 min |
| AI Provider Down | OpenAI failures >50% for 2 min | Auto-fallback to Google AI |
| Lead Response SLA Miss | P90 response time >10 min for 1 hour | Investigate within 30 min |
| Cost Spike | Hourly AI cost >$200 (expected: $50/hr) | Pause new calls, investigate |

### Warning Alerts (Slack → Product Team)

| Alert | Condition | Action |
|-------|-----------|--------|
| Low Qualification Rate | <10% qualification rate for 24 hours | Review recent calls, update prompts |
| High Hang-up Rate | >30% of calls <30 seconds | A/B test new opening script |
| CRM Sync Lag | HubSpot sync delay >5 minutes | Check API rate limits |

---

## Monthly Metrics Review Template

### Date: [First Monday of Each Month]
**Attendees:** Product, Engineering, Sales Leadership

**Agenda:**

1. **North Star Review (10 min)**
   - Conversion rate trend
   - Attribution to specific product changes

2. **Speed Metrics (10 min)**
   - Response time distribution
   - After-hours coverage analysis
   - Bottleneck identification

3. **Quality Deep-dive (15 min)**
   - AI accuracy trend
   - Human review sample findings
   - Low-quality call post-mortem (if any)

4. **Cost Efficiency (10 min)**
   - Cost per SQL trend
   - Provider cost breakdown (OpenAI vs Google)
   - Infrastructure optimization opportunities

5. **Experiments & Learnings (10 min)**
   - A/B test results
   - Feature launches impact
   - Customer feedback themes

6. **Next Month Priorities (5 min)**
   - Metrics to focus on
   - Experiments to run

---

## Open Questions & Future Metrics

### To Add in Phase 2:
- **Lead Sentiment Analysis:** Track emotional tone throughout conversation
- **Competitive Intelligence:** How often do leads mention competitors?
- **Feature Request Mining:** Extract product feedback from transcripts
- **Rep Productivity Multiplier:** Qualified leads/rep before vs after AI

### To Validate:
- **Correlation Studies:**
  - Does faster response → higher close rate? (hypothesis: yes)
  - Does AI confidence score → actual qualification accuracy? (need data)
  - Do longer calls → better qualification? (might be inverted U-curve)

---

## Appendix: Industry Benchmarks

| Metric | Industry Avg | Top Quartile | Our Target |
|--------|--------------|--------------|------------|
| Lead Response Time | 42 hours | 5 hours | <5 minutes |
| Lead→Opp Conversion | 8% | 15% | 15% |
| Call Connection Rate | 50% | 65% | 60-70% |
| Cost per SQL | $280 | $120 | $80 |
| SDR Quota Attainment | 58% | 85% | N/A (AI) |

**Sources:**
- InsideSales.com Lead Response Study (2024)
- Bridge Group SDR Metrics Report (2025)
- LeanData State of Pipeline Generation (2024)

---

**Questions or feedback on metrics framework:** mohit@mohit-ai.com
