import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface MetricData {
  timestamp: string;
  cpu: number;
  heapUsed: number;
  heapMax: number;
}

export const HeapVortexMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);

  useEffect(() => {
    // Generate mock metrics data
    const generateMetrics = () => {
      const data: MetricData[] = [];
      const now = Date.now();
      for (let i = 59; i >= 0; i--) {
        data.push({
          timestamp: new Date(now - i * 1000).toLocaleTimeString(),
          cpu: Math.random() * 80 + 10,
          heapUsed: Math.random() * 800 + 200,
          heapMax: 1024,
        });
      }
      return data;
    };

    setMetrics(generateMetrics());

    // Update metrics every second
    const interval = setInterval(() => {
      setMetrics((prev) => {
        const newData = [...prev.slice(1)];
        const now = Date.now();
        newData.push({
          timestamp: new Date(now).toLocaleTimeString(),
          cpu: Math.random() * 80 + 10,
          heapUsed: Math.random() * 800 + 200,
          heapMax: 1024,
        });
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white">
      <h2 className="text-lg font-bold mb-4">JVM Metrics</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={metrics}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="timestamp" stroke="#888" style={{ fontSize: "12px" }} />
          <YAxis stroke="#888" style={{ fontSize: "12px" }} />
          <Tooltip 
            contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #444" }}
            labelStyle={{ color: "#fff" }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="cpu" 
            stroke="#8b5cf6" 
            dot={false} 
            name="CPU (%)"
            isAnimationActive={false}
          />
          <Line 
            type="monotone" 
            dataKey="heapUsed" 
            stroke="#3b82f6" 
            dot={false} 
            name="Heap Used (MB)"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
