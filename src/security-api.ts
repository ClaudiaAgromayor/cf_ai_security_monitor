/**
 * Security API - Handles security events and monitoring
 * Integrates with SecurityMonitor Durable Object
 */

import type { SecurityEvent } from "./security-monitor";

export async function handleSecurityRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // Get the security monitor instance
  const securityMonitorId = env.SECURITY_MONITOR.idFromName("default");
  const securityMonitor = env.SECURITY_MONITOR.get(securityMonitorId);

  if (url.pathname === "/api/security/log" && request.method === "POST") {
    // Log a security event
    const event = await request.json<Omit<SecurityEvent, "id" | "timestamp">>();
    return securityMonitor.fetch(
      new Request("https://security/api/events", {
        method: "POST",
        body: JSON.stringify(event),
      })
    );
  }

  if (url.pathname === "/api/security/alerts") {
    // Get recent alerts
    const limit = url.searchParams.get("limit") || "10";
    return securityMonitor.fetch(
      new Request(`https://security/api/alerts?limit=${limit}`)
    );
  }

  if (url.pathname === "/api/security/stats") {
    // Get security statistics
    return securityMonitor.fetch(
      new Request("https://security/api/stats")
    );
  }

  return new Response("Not found", { status: 404 });
}

/**
 * Example security events to detect
 */
export const SECURITY_EVENT_TYPES = {
  FAILED_LOGIN: "login_attempt",
  UNUSUAL_API_ACTIVITY: "api_call",
  DATA_ACCESS_ANOMALY: "data_access",
  CONFIG_CHANGE: "config_change",
  SUSPICIOUS_BEHAVIOR: "unknown",
} as const;

export async function logSecurityEvent(
  env: Env,
  type: string,
  source: string,
  description: string,
  severity: "low" | "medium" | "high" | "critical" = "medium",
  metadata?: Record<string, unknown>
) {
  const event: Omit<SecurityEvent, "id" | "timestamp"> = {
    type: type as any,
    source,
    description,
    severity,
    metadata,
  };

  return fetch("https://dummy/api/security/log", {
    method: "POST",
    body: JSON.stringify(event),
  });
}
