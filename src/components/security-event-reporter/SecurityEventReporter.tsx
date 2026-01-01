import React, { useState } from "react";
import { Card } from "../card/Card";
import { Button } from "../button/Button";

const SECURITY_EVENT_TYPES = [
  { label: "Login Attempt", value: "login_attempt" },
  { label: "API Call", value: "api_call" },
  { label: "Data Access", value: "data_access" },
  { label: "Config Change", value: "config_change" },
  { label: "Unknown/Other", value: "unknown" },
];

const SEVERITY_LEVELS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
];

export function SecurityEventReporter() {
  const [eventType, setEventType] = useState("login_attempt");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/security/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: eventType,
          source,
          description,
          severity,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to report event");
      }

      const data = await res.json();
      setResponse(data);

      // Reset form
      setSource("");
      setDescription("");
      setSeverity("medium");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">🚨 Report Security Event</h1>
        <p className="text-gray-600">Report suspicious activity for AI analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="border-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Event Type</label>
              <select
                value={eventType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEventType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {SECURITY_EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Source (IP/User)</label>
              <input
                type="text"
                placeholder="192.168.1.1 or user-123"
                value={source}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSource(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                placeholder="Describe the security event..."
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                rows={4}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Severity</label>
              <select
                value={severity}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {SEVERITY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Analyzing..." : "Report Event"}
            </Button>
          </form>
        </Card>

        {/* Response */}
        <div className="space-y-4">
          {error && (
            <Card className="border-red-200 bg-red-50">
              <div className="text-red-800">{error}</div>
            </Card>
          )}

          {response && (
            <div className="space-y-3">
              <Card className={`border-2 ${
                response.threat_level === "critical"
                  ? "border-red-200"
                  : response.threat_level === "dangerous"
                  ? "border-orange-200"
                  : response.threat_level === "suspicious"
                  ? "border-yellow-200"
                  : "border-green-200"
              }`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">AI Analysis Result</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      response.threat_level === "critical"
                        ? "bg-red-100 text-red-800"
                        : response.threat_level === "dangerous"
                        ? "bg-orange-100 text-orange-800"
                        : response.threat_level === "suspicious"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {response.threat_level.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Event ID:</span>
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
                        {response.eventId}
                      </code>
                    </div>

                    <div>
                      <span className="font-medium">AI Recommendation:</span>
                      <p className="mt-1 text-gray-700">
                        {response.ai_recommendation}
                      </p>
                    </div>

                    <div>
                      <span className="font-medium">Action Taken:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                        response.action_taken === "escalated"
                          ? "bg-red-100 text-red-800"
                          : response.action_taken === "flagged"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {response.action_taken.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="text-xs text-gray-500">
                Reported at: {new Date(response.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Example Events */}
      <Card className="border-blue-200 bg-blue-50">
        <div className="space-y-3">
          <h3 className="font-semibold text-blue-900">💡 Example Events to Try</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Brute Force:</strong> Type: Login Attempt, Source: 203.0.113.1, Description: "Failed password authentication - 10 attempts in 5 minutes"</p>
            <p><strong>Data Exfiltration:</strong> Type: Data Access, Source: user-456, Description: "Downloaded 50GB of customer data"</p>
            <p><strong>Config Change:</strong> Type: Config Change, Source: admin, Description: "Disabled firewall rules"</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
