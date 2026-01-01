import { useState, useEffect } from "react";
import { Card } from "../card/Card";
import { Button } from "../button/Button";
import { Loader } from "../loader/Loader";

interface SecurityAlert {
  id: string;
  eventId: string;
  timestamp: number;
  threat_level: "safe" | "suspicious" | "dangerous" | "critical";
  ai_recommendation: string;
  action_taken: "none" | "blocked" | "flagged" | "escalated";
}

interface SecurityStats {
  total_events: number;
  total_alerts: number;
  alerts_24h: number;
  critical_threats: number;
  dangerous_threats: number;
  avg_threat_level: string;
}

const getThreatColor = (level: string) => {
  switch (level) {
    case "critical":
      return "text-red-600 bg-red-100";
    case "dangerous":
      return "text-orange-600 bg-orange-100";
    case "suspicious":
      return "text-yellow-600 bg-yellow-100";
    case "safe":
      return "text-green-600 bg-green-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

const getThreatBgColor = (level: string) => {
  switch (level) {
    case "critical":
      return "border-red-200 dark:border-red-900";
    case "dangerous":
      return "border-orange-200 dark:border-orange-900";
    case "suspicious":
      return "border-yellow-200 dark:border-yellow-900";
    case "safe":
      return "border-green-200 dark:border-green-900";
    default:
      return "border-gray-200 dark:border-gray-900";
  }
};

export function SecurityDashboard() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [alertsRes, statsRes] = await Promise.all([
          fetch("/api/security/alerts?limit=20"),
          fetch("/api/security/stats")
        ]);

        if (!alertsRes.ok || !statsRes.ok) {
          throw new Error("Failed to fetch security data");
        }

        const alertsData = (await alertsRes.json()) as SecurityAlert[];
        const statsData = (await statsRes.json()) as SecurityStats;

        setAlerts(alertsData);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-red-200 bg-red-50">
          <div className="text-red-800">Error: {error}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🛡️ Security Monitor</h1>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200">
            <div className="text-sm text-gray-600">Total Alerts (24h)</div>
            <div className="text-3xl font-bold text-blue-600">
              {stats.alerts_24h}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Total: {stats.total_alerts}
            </div>
          </Card>

          <Card className="border-red-200">
            <div className="text-sm text-gray-600">Critical Threats</div>
            <div className="text-3xl font-bold text-red-600">
              {stats.critical_threats}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Requires immediate action
            </div>
          </Card>

          <Card className="border-orange-200">
            <div className="text-sm text-gray-600">Risk Level</div>
            <div
              className={`text-3xl font-bold ${getThreatColor(stats.avg_threat_level).split(" ")[0]}`}
            >
              {stats.avg_threat_level.toUpperCase()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Average threat level
            </div>
          </Card>
        </div>
      )}

      {/* Alerts List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Security Alerts</h2>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <Card className="border-green-200">
              <div className="text-center text-green-700">
                ✓ No security threats detected
              </div>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`border-2 ${getThreatBgColor(alert.threat_level)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getThreatColor(alert.threat_level)}`}
                      >
                        {alert.threat_level.toUpperCase()}
                      </span>
                      {alert.action_taken !== "none" && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold 
                          ${alert.action_taken === "escalated" ? "text-red-600 bg-red-100" : "text-yellow-600 bg-yellow-100"}`}
                        >
                          {alert.action_taken.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-800">
                        Event ID: {alert.eventId}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        <strong>AI Recommendation:</strong>{" "}
                        {alert.ai_recommendation}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
