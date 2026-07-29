import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface MetricPoint {
  timestamp: string;
  heapUsedMB: number;
  heapCommittedMB: number;
  heapMaxMB: number;
}

export const HeapMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/telemetry/current");
        if (!response.ok) {
          setConnected(false);
          return;
        }

        const data = await response.json();
        setConnected(true);

        const newPoint: MetricPoint = {
          timestamp: data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
          heapUsedMB: Math.round((data.heapUsed || 0) / (1024 * 1024)),
          heapCommittedMB: Math.round((data.heapCommitted || 0) / (1024 * 1024)),
          heapMaxMB: Math.round((data.heapMax || 0) / (1024 * 1024)),
        };

        setMetrics((prev) => [...prev.slice(-29), newPoint]); // Keeps last 30 readings
      } catch (err) {
        setConnected(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-md font-bold text-indigo-400">Live Telemetry (Spring Boot JMX)</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full ${connected ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
          {connected ? "LIVE" : "DISCONNECTED"}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={metrics}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="timestamp" stroke="#9CA3AF" style={{ fontSize: "10px" }} />
          <YAxis stroke="#9CA3AF" style={{ fontSize: "10px" }} />
          <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }} />
          <Legend />
          <Line type="monotone" dataKey="heapUsedMB" stroke="#3B82F6" dot={false} name="Heap Used (MB)" isAnimationActive={false} />
          <Line type="monotone" dataKey="heapCommittedMB" stroke="#10B981" dot={false} name="Committed (MB)" isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HeapMetrics;