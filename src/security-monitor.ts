/**
 * Security Monitor - Intelligent threat detection and analysis system
 * Uses Llama 3.3 to analyze security events and provide recommendations
 */

import { DurableObject } from "cloudflare:workers";
import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { DEFAULT_GROQ_MODEL } from "./shared";

export interface SecurityEvent {
  id: string;
  timestamp: number;
  type:
    | "login_attempt"
    | "api_call"
    | "data_access"
    | "config_change"
    | "unknown";
  severity: "low" | "medium" | "high" | "critical";
  source: string; // IP or user
  description: string;
  metadata?: Record<string, unknown>;
}

export interface SecurityAlert {
  id: string;
  eventId: string;
  timestamp: number;
  threat_level: "safe" | "suspicious" | "dangerous" | "critical";
  ai_recommendation: string;
  action_taken: "none" | "blocked" | "flagged" | "escalated";
}

export class SecurityMonitor extends DurableObject<Env> {
  declare env: Env;
  events: SecurityEvent[] = [];
  alerts: SecurityAlert[] = [];
  aiAnalysis: Map<string, string> = new Map();
  initialized = false;

  // Load persisted state from storage
  async initialize() {
    if (this.initialized) return;

    const storedEvents = await this.ctx.storage.get<SecurityEvent[]>("events");
    const storedAlerts = await this.ctx.storage.get<SecurityAlert[]>("alerts");

    if (storedEvents) this.events = storedEvents;
    if (storedAlerts) this.alerts = storedAlerts;

    this.initialized = true;
  }

  // Save state to persistent storage
  async saveState() {
    await this.ctx.storage.put("events", this.events);
    await this.ctx.storage.put("alerts", this.alerts);
  }

  async analyzeEvent(event: SecurityEvent): Promise<SecurityAlert> {
    const groqClient = createGroq({
      apiKey: this.env.GROQ_API_KEY
    });
    const model = groqClient(DEFAULT_GROQ_MODEL);

    const prompt = `Analyze this security event and determine if it's a threat:

Event Type: ${event.type}
Source: ${event.source}
Description: ${event.description}
Severity: ${event.severity}
Metadata: ${JSON.stringify(event.metadata || {})}

Provide:
1. Threat Level: safe, suspicious, dangerous, or critical
2. Risk Assessment: Brief explanation
3. Recommended Action: What should be done

Response format:
THREAT_LEVEL: [level]
RISK: [explanation]
ACTION: [recommendation]`;

    const result = await streamText({
      model,
      prompt,
      temperature: 0.7
    });

    let analysisText = "";

    for await (const chunk of result.textStream) {
      analysisText += chunk;
    }

    const threatMatch = analysisText.match(/THREAT_LEVEL:\s*(\w+)/i);
    const actionMatch = analysisText.match(/ACTION:\s*([^\n]+)/i);

    const threatLevel = (threatMatch?.[1]?.toLowerCase() ||
      "suspicious") as SecurityAlert["threat_level"];
    const recommendation = actionMatch?.[1] || "Manual review recommended";

    const alert: SecurityAlert = {
      id: `alert_${Date.now()}`,
      eventId: event.id,
      timestamp: Date.now(),
      threat_level: threatLevel,
      ai_recommendation: recommendation,
      action_taken:
        threatLevel === "critical"
          ? "escalated"
          : threatLevel === "dangerous"
            ? "flagged"
            : "none"
    };

    this.alerts.push(alert);
    this.aiAnalysis.set(event.id, analysisText);

    // Persist the new alert
    await this.saveState();

    return alert;
  }

  async logEvent(
    event: Omit<SecurityEvent, "id" | "timestamp">
  ): Promise<SecurityAlert> {
    await this.initialize();

    const securityEvent: SecurityEvent = {
      ...event,
      id: `event_${Date.now()}`,
      timestamp: Date.now()
    };

    this.events.push(securityEvent);
    // Save events immediately
    await this.saveState();

    const alert = await this.analyzeEvent(securityEvent);

    return alert;
  }

  async getRecentAlerts(limit = 10): Promise<SecurityAlert[]> {
    await this.initialize();
    return this.alerts.slice(-limit).reverse();
  }

  async getStats() {
    await this.initialize();

    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const recent = this.alerts.filter((a) => a.timestamp > last24h);
    const critical = recent.filter((a) => a.threat_level === "critical");
    const dangerous = recent.filter((a) => a.threat_level === "dangerous");

    return {
      total_events: this.events.length,
      total_alerts: this.alerts.length,
      alerts_24h: recent.length,
      critical_threats: critical.length,
      dangerous_threats: dangerous.length,
      avg_threat_level: this.calculateAverageThreat()
    };
  }

  private calculateAverageThreat(): string {
    if (this.alerts.length === 0) return "safe";

    const threatScores = {
      safe: 0,
      suspicious: 1,
      dangerous: 2,
      critical: 3
    };

    const avg =
      this.alerts.reduce(
        (sum, alert) => sum + (threatScores[alert.threat_level] || 0),
        0
      ) / this.alerts.length;

    if (avg < 0.5) return "safe";
    if (avg < 1.5) return "suspicious";
    if (avg < 2.5) return "dangerous";
    return "critical";
  }

  fetch = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    if (url.pathname === "/api/events" && request.method === "POST") {
      const event = (await request.json()) as Omit<
        SecurityEvent,
        "id" | "timestamp"
      >;
      const alert = await this.logEvent(event);
      return Response.json(alert);
    }

    if (url.pathname === "/api/alerts") {
      const limit = parseInt(url.searchParams.get("limit") || "10", 10);
      const alerts = await this.getRecentAlerts(limit);
      return Response.json(alerts);
    }

    if (url.pathname === "/api/stats") {
      const stats = await this.getStats();
      return Response.json(stats);
    }

    return new Response("Not found", { status: 404 });
  };
}
