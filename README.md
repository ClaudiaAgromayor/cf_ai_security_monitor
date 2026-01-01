# Intelligent Security Monitor

An AI-powered security monitoring system built with Cloudflare Workers. This application detects, analyzes, and responds to security threats in real-time using Llama 3.3 via Groq.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Threat Levels](#threat-levels)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

---

## Features

**AI-Powered Threat Analysis**
- Uses Llama 3.3 70B to analyze security events in real-time
- Determines threat levels: safe, suspicious, dangerous, critical
- Provides actionable recommendations automatically

**Real-Time Monitoring**
- Event logging and tracking
- 24-hour alert history
- Threat level aggregation and statistics

**Interactive Chat Agent**
- Web-based chat interface
- Task scheduling capabilities (one-time, delayed, cron)
- Streaming responses

**Persistent State Management**
- Durable Objects for event and alert storage
- Data persists across requests and deployments
- Isolated state per account

**Serverless Architecture**
- Runs entirely on Cloudflare's edge network
- Auto-scaling, no infrastructure management
- Low latency globally

---

## Architecture

```
                    Cloudflare Workers
                   (Serverless Compute)
                          |
        +-----------------+-----------------+
        |                 |                 |
        v                 v                 v
   +---------+      +-----------+     +-----------+
   |  Chat   |      | Security  |     |   React   |
   |  Agent  |      |  Monitor  |     | Dashboard |
   |  (DO)   |      |   (DO)    |     |   (UI)    |
   +---------+      +-----------+     +-----------+
        |                 |
        v                 v
   +----------------------------------+
   |        Groq API (Llama 3.3)      |
   |       AI Analysis & Chat         |
   +----------------------------------+
```

**Components:**

- **Chat Agent (Durable Object)**: Manages chat state and conversation history
- **Security Monitor (Durable Object)**: Stores events, alerts, and statistics
- **React Dashboard**: User interface for chat and security visualization
- **Groq API**: Provides Llama 3.3 70B for AI analysis

---

## Quick Start

### Prerequisites

- Node.js v18 or higher
- Cloudflare account (https://dash.cloudflare.com/sign-up)
- Groq API key (https://console.groq.com) - free tier available

### Installation

```bash
git clone https://github.com/your-username/agents-starter.git
cd agents-starter
npm install
```

### Configuration

Create a `.dev.vars` file in the root directory:

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get your free Groq API key at https://console.groq.com

### Run Locally

```bash
npm start
```

Open http://localhost:5173 in your browser.

### Deploy to Cloudflare

```bash
# Add your API key as a secret
npx wrangler secret put GROQ_API_KEY

# Deploy
npm run deploy
```

Your app will be live at: `https://agents-starter.<your-subdomain>.workers.dev`

---

## API Reference

### POST /api/security/log

Analyze a security event with AI and get threat assessment.

**Request:**

```json
{
  "type": "login_attempt",
  "source": "192.168.1.100",
  "description": "10 failed login attempts in 5 minutes",
  "severity": "high",
  "metadata": {
    "attempts": 10,
    "timeframe": "5 minutes"
  }
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Event type: `login_attempt`, `api_call`, `data_access`, `config_change`, `unknown` |
| source | string | Yes | IP address or user identifier |
| description | string | Yes | Human-readable event description |
| severity | string | Yes | `low`, `medium`, `high`, `critical` |
| metadata | object | No | Additional context data |

**Response:**

```json
{
  "id": "alert_1767307788856",
  "eventId": "event_1767307788303",
  "timestamp": 1767307788856,
  "threat_level": "dangerous",
  "ai_recommendation": "Immediately block the IP address and trigger an alert to the security team.",
  "action_taken": "flagged"
}
```

### GET /api/security/alerts

Get recent security alerts.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 10 | Maximum alerts to return |

**Response:**

```json
[
  {
    "id": "alert_1767307788856",
    "eventId": "event_1767307788303",
    "timestamp": 1767307788856,
    "threat_level": "dangerous",
    "ai_recommendation": "Block IP immediately",
    "action_taken": "flagged"
  }
]
```

### GET /api/security/stats

Get security statistics.

**Response:**

```json
{
  "total_events": 15,
  "total_alerts": 15,
  "alerts_24h": 12,
  "critical_threats": 2,
  "dangerous_threats": 5,
  "avg_threat_level": "suspicious"
}
```

---

## Usage Examples

### Example 1: Brute Force Attack Detection

**Request:**

```bash
curl -X POST https://your-app.workers.dev/api/security/log \
  -H "Content-Type: application/json" \
  -d '{
    "type": "login_attempt",
    "source": "203.0.113.45",
    "description": "7 failed password attempts in 5 minutes - possible brute force",
    "severity": "high",
    "metadata": {"attempts": 7, "timeframe": "5 minutes"}
  }'
```

**AI Response:**

```
threat_level: dangerous
ai_recommendation: Immediately block the IP address 203.0.113.45 and trigger an alert to the security team for further investigation.
action_taken: flagged
```

### Example 2: Data Exfiltration

**Request:**

```bash
curl -X POST https://your-app.workers.dev/api/security/log \
  -H "Content-Type: application/json" \
  -d '{
    "type": "api_call",
    "source": "user-suspicious-123",
    "description": "Downloaded 15GB of sensitive customer data in 45 seconds",
    "severity": "high",
    "metadata": {"data_size": "15GB", "duration": "45s"}
  }'
```

**AI Response:**

```
threat_level: critical
ai_recommendation: Immediately investigate the user activity, revoke access to sensitive data, and initiate a thorough audit.
action_taken: escalated
```

### Example 3: Configuration Change

**Request:**

```bash
curl -X POST https://your-app.workers.dev/api/security/log \
  -H "Content-Type: application/json" \
  -d '{
    "type": "config_change",
    "source": "admin-compromised",
    "description": "Disabled 2FA for all 200 user accounts",
    "severity": "critical",
    "metadata": {"accounts_affected": 200}
  }'
```

**AI Response:**

```
threat_level: critical
ai_recommendation: Immediately re-enable 2FA authentication for all user accounts and conduct a thorough investigation.
action_taken: escalated
```

### PowerShell Examples

```powershell
# Log a security event
Invoke-RestMethod -Method POST `
  -Uri "https://your-app.workers.dev/api/security/log" `
  -ContentType "application/json" `
  -Body '{"type":"login_attempt","source":"10.0.0.1","description":"Suspicious login","severity":"medium"}'

# Get alerts
Invoke-RestMethod -Uri "https://your-app.workers.dev/api/security/alerts"

# Get statistics
Invoke-RestMethod -Uri "https://your-app.workers.dev/api/security/stats"
```

---

## Project Structure

```
src/
├── server.ts              # Main Worker entry point
├── app.tsx                # React chat interface
├── tools.ts               # AI tools (weather, time, scheduling)
├── security-monitor.ts    # Security Durable Object
├── security-api.ts        # Security API routes
├── shared.ts              # Shared configuration
├── utils.ts               # Helper functions
├── styles.css             # UI styling
└── components/
    ├── security-dashboard/        # Stats and alerts UI
    └── security-event-reporter/   # Event submission form
```

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| GROQ_API_KEY | Groq API key for Llama 3.3 | Yes |

### Local Development

Create `.dev.vars` file:

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Production

Set secrets using Wrangler:

```bash
npx wrangler secret put GROQ_API_KEY
```

### Durable Objects Configuration

Defined in `wrangler.jsonc`:

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "Chat",
        "class_name": "Chat"
      },
      {
        "name": "SECURITY_MONITOR",
        "class_name": "SecurityMonitor"
      }
    ]
  }
}
```

---

## Threat Levels

| Level | Action | Description |
|-------|--------|-------------|
| safe | None | No threat detected |
| suspicious | Monitor | Potential threat, requires monitoring |
| dangerous | Flag | Confirmed threat, flagged for review |
| critical | Escalate | Severe threat, immediate escalation |

**Automatic Actions:**

- `safe` and `suspicious`: action_taken = "none"
- `dangerous`: action_taken = "flagged"
- `critical`: action_taken = "escalated"

---

## Development

### Commands

```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy

# View real-time logs
npx wrangler tail agents-starter
```

### Testing the API

After deployment, test your endpoints:

```bash
# Test event logging
curl -X POST https://agents-starter.YOUR_SUBDOMAIN.workers.dev/api/security/log \
  -H "Content-Type: application/json" \
  -d '{"type":"login_attempt","source":"test","description":"Test event","severity":"low"}'

# Verify persistence
curl https://agents-starter.YOUR_SUBDOMAIN.workers.dev/api/security/stats
```

---

## Troubleshooting

### GROQ_API_KEY not set

**Local development:**

```bash
# Verify .dev.vars exists and contains the key
cat .dev.vars
```

**Production:**

```bash
# List configured secrets
npx wrangler secret list

# Re-add the secret if missing
npx wrangler secret put GROQ_API_KEY
```

### Alerts not persisting

Redeploy to ensure latest code is running:

```bash
npm run deploy
```

### API returns empty arrays

The Durable Object initializes on first use. Send a test event to initialize:

```bash
curl -X POST https://your-app.workers.dev/api/security/log \
  -H "Content-Type: application/json" \
  -d '{"type":"unknown","source":"init","description":"Initialize","severity":"low"}'
```

### Analysis fails or times out

- Verify your Groq API key is valid
- Check Groq service status at https://status.groq.com
- Review logs: `npx wrangler tail agents-starter`

---

## Resources

**Cloudflare Documentation:**
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Durable Objects: https://developers.cloudflare.com/workers/runtime-apis/durable-objects/

**AI and APIs:**
- Groq API: https://console.groq.com/docs
- Llama 3.3: https://www.llama.com/

**Project Dependencies:**
- AI SDK: https://sdk.vercel.ai/
- React: https://react.dev/

---

## License

MIT License

Built for Cloudflare Summer Internship 2025
