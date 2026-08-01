import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface MetricPoint {
  timestamp: string;
  heapUsedMB: number;
  heapCommittedMB: number;
  heapMaxMB: number;
}

interface HeapMetricsProps {
  jmxTarget?: string;
}

export const HeapMetrics: React.FC<HeapMetricsProps> = ({ jmxTarget = "localhost:9010" }) => {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [connected, setConnected] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout;

    // 1. CLEAR OLD DATA: Wipe the graph clean whenever the target JVM changes
    setMetrics([]);

    const fetchTelemetry = async () => {
      // If the component was closed/unmounted, stop running
      if (!isMounted) return;

      try {
        // CACHE-BUSTER: Force the browser to actually hit the Spring Boot backend every time
        const response = await fetch("http://localhost:8080/api/telemetry/current", {
          cache: 'no-store', // Absolutely no caching
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          if (isMounted) setConnected(false);
        } else {
          const data = await response.json();

          // Safely check if data exists and is valid
          if (!data || (data.heapUsed === 0 && data.heapMax === 0)) {
            if (isMounted) setConnected(false);
          } else {
            if (isMounted) {
              setConnected(true);
              const newPoint: MetricPoint = {
                timestamp: data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
                heapUsedMB: Math.round((data.heapUsed || 0) / (1024 * 1024)),
                heapCommittedMB: Math.round((data.heapCommitted || 0) / (1024 * 1024)),
                heapMaxMB: Math.round((data.heapMax || 0) / (1024 * 1024)),
              };
              setMetrics((prev) => [...prev.slice(-29), newPoint]); // Keep last 30 readings
            }
          }
        }
      } catch (err) {
        // Catch network disconnections (e.g., if Spring Boot itself is turned off)
        if (isMounted) setConnected(false);
      } finally {
        // RECURSIVE TIMEOUT: Only start the 1-second countdown AFTER the previous request finishes!
        // This completely prevents "Promise Pile-up" and network freezes.
        if (isMounted) {
          timer = setTimeout(fetchTelemetry, 1000);
        }
      }
    };

    // Start the polling loop
    fetchTelemetry();

    // Cleanup phase: wipe the timer if the user leaves the page or target changes
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [jmxTarget]); // 2. DEPENDENCY ARRAY BUG FIX: Restarts the engine when the target changes

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-md font-bold text-indigo-400">Live Telemetry ({jmxTarget})</h2>
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