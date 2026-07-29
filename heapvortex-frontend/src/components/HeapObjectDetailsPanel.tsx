import React, { useEffect, useState } from "react";
import { HeapObject } from "./HeapVortexVisualizer";
import { X, ShieldAlert, GitCommit, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface Props {
  object: HeapObject;
  fileName: string;
  onClose: () => void;
}

type TabType = "gcPath" | "incoming" | "outgoing";

export const HeapObjectDetailsPanel: React.FC<Props> = ({ object, fileName, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>("gcPath");
  const [results, setResults] = useState<HeapObject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!fileName || !object.address) return;
      setLoading(true);
      setResults([]);

      let endpoint = "path-to-gc-roots";
      if (activeTab === "incoming") endpoint = "incoming-references";
      if (activeTab === "outgoing") endpoint = "outgoing-references";

      try {
        const url = `http://localhost:8080/api/heap/${endpoint}?fileName=${encodeURIComponent(
          fileName
        )}&address=${encodeURIComponent(object.address)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error(`Failed to fetch ${activeTab} from Spring Boot:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferenceData();
  }, [object, fileName, activeTab]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(3, 7, 18, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "500px",
          maxHeight: "85vh",
          backgroundColor: "#111827",
          border: "1px solid #6366f1",
          borderRadius: "16px",
          padding: "24px",
          boxSizing: "border-box",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          overflowY: "auto"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1f2937", paddingBottom: "12px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#818cf8", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldAlert size={18} /> Object Inspector
          </h3>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#1f2937",
              border: "none",
              color: "#9ca3af",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Selected Object Info */}
        <div style={{ backgroundColor: "#1f2937", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ color: "#9ca3af", fontSize: "11px" }}>Class Name:</span>
            <code style={{ color: "#c084fc", fontFamily: "monospace", wordBreak: "break-all", fontSize: "12px", fontWeight: "600" }}>
              {object.className}
            </code>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #374151", paddingTop: "8px" }}>
            <span style={{ color: "#9ca3af" }}>Memory Address:</span>
            <code style={{ color: "#4ade80", fontFamily: "monospace" }}>{object.address}</code>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#9ca3af" }}>Retained Size:</span>
            <span style={{ fontWeight: "bold", color: "#ffffff" }}>
              {((object.retainedHeap || 0) / 1024).toFixed(2)} KB
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#9ca3af" }}>Shallow Size:</span>
            <span style={{ color: "#e5e7eb" }}>
              {((object.shallowHeap || 0) / 1024).toFixed(2)} KB
            </span>
          </div>
        </div>

        {/* Tab Selection Controls */}
        <div style={{ display: "flex", gap: "6px", backgroundColor: "#1f2937", padding: "4px", borderRadius: "10px" }}>
          <button
            onClick={() => setActiveTab("gcPath")}
            style={{
              flex: 1,
              padding: "8px 6px",
              fontSize: "11px",
              fontWeight: "bold",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              backgroundColor: activeTab === "gcPath" ? "#4f46e5" : "transparent",
              color: activeTab === "gcPath" ? "#ffffff" : "#9ca3af"
            }}
          >
            <GitCommit size={13} /> GC Roots
          </button>

          <button
            onClick={() => setActiveTab("incoming")}
            style={{
              flex: 1,
              padding: "8px 6px",
              fontSize: "11px",
              fontWeight: "bold",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              backgroundColor: activeTab === "incoming" ? "#4f46e5" : "transparent",
              color: activeTab === "incoming" ? "#ffffff" : "#9ca3af"
            }}
          >
            <ArrowDownLeft size={13} /> Incoming
          </button>

          <button
            onClick={() => setActiveTab("outgoing")}
            style={{
              flex: 1,
              padding: "8px 6px",
              fontSize: "11px",
              fontWeight: "bold",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              backgroundColor: activeTab === "outgoing" ? "#4f46e5" : "transparent",
              color: activeTab === "outgoing" ? "#ffffff" : "#9ca3af"
            }}
          >
            <ArrowUpRight size={13} /> Outgoing
          </button>
        </div>

        {/* Tab Content Display */}
        <div>
          {loading ? (
            <p style={{ margin: 0, fontSize: "12px", color: "#a5b4fc", fontStyle: "italic" }}>
              Querying MAT Engine for {activeTab}...
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
              {results.length > 0 ? (
                results.map((node, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px",
                      backgroundColor: "#1f2937",
                      borderRadius: "8px",
                      borderLeft: "3px solid #6366f1",
                      fontSize: "11px"
                    }}
                  >
                    <p style={{ margin: 0, color: "#c084fc", fontFamily: "monospace", wordBreak: "break-all", fontWeight: "600" }}>
                      {node.className}
                    </p>
                    <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontFamily: "monospace", fontSize: "10px" }}>
                      {node.address}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
                  No records found for {activeTab}.
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default HeapObjectDetailsPanel;