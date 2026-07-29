import React, { useState } from "react";
import { HeapVortexVisualizer, HeapObject } from "./HeapVortexVisualizer";
import { HeapObjectDetailsPanel } from "./HeapObjectDetailsPanel";
import HeapMetrics from "./HeapMetrics";
import { Upload, CheckCircle2, Loader2, HardDrive, Plug, Filter, AlertCircle, Cpu } from "lucide-react";

export default function HeapVortexDashboard() {
  const [selectedObject, setSelectedObject] = useState<HeapObject | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [objects, setObjects] = useState<HeapObject[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("byte[]");
  const [customClass, setCustomClass] = useState<string>("");

  // Upload & Dumping Status
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");

  // JMX Remote Connection State
  const [jmxHost, setJmxHost] = useState<string>("localhost");
  const [jmxPort, setJmxPort] = useState<string>("9010");
  const [jmxConnecting, setJmxConnecting] = useState<boolean>(false);
  const [jmxConnected, setJmxConnected] = useState<boolean>(false);
  const [jmxMessage, setJmxMessage] = useState<string>("");

  // Common Java Classes for Quick Querying
  const commonClasses = [
    "byte[]",
    "java.lang.String",
    "java.util.HashMap$Node",
    "char[]",
    "java.lang.Object[]",
    "Custom..."
  ];

  // 1. Connect to JVM JMX Port (Sends JSON Body)
  const handleJmxConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jmxHost || !jmxPort) return;
    setJmxConnecting(true);
    setJmxMessage("Connecting to JVM...");

    try {
      const res = await fetch("http://localhost:8080/api/jvm/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host: jmxHost,
          port: parseInt(jmxPort, 10),
        }),
      });

      if (res.ok) {
        setJmxConnected(true);
        setJmxMessage(`Connected to JMX (${jmxHost}:${jmxPort})`);
      } else {
        setJmxConnected(false);
        setJmxMessage("Connection failed. Check host/port.");
      }
    } catch (err) {
      console.error("JMX Connection Error:", err);
      setJmxConnected(false);
      setJmxMessage("Failed to reach Spring Boot server.");
    } finally {
      setJmxConnecting(false);
    }
  };

  // 2. Fetch Objects by Selected Class from MAT Engine
  const fetchObjectsForClass = async (targetFileName: string, classNameToQuery: string) => {
    if (!targetFileName || !classNameToQuery) return;
    try {
      const objRes = await fetch(
        `http://localhost:8080/api/heap/objects-by-class?fileName=${encodeURIComponent(
          targetFileName
        )}&className=${encodeURIComponent(classNameToQuery)}`
      );

      if (objRes.ok) {
        const objData = await objRes.json();
        setObjects(objData);
        setUploadStatus("success");
        setStatusMessage(`Loaded ${objData.length} instances of ${classNameToQuery}`);
      } else {
        setObjects([]);
        setStatusMessage(`No instances found for class: ${classNameToQuery}`);
      }
    } catch (err) {
      console.error("Failed to fetch objects by class:", err);
    }
  };

  // 3. Upload .hprof Dump File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setFileName(file.name);
    setUploadStatus("uploading");
    setStatusMessage(`Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8080/api/heap/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setStatusMessage("Parsing heap dump with Eclipse MAT...");
        const activeQueryClass = selectedClass === "Custom..." ? customClass : selectedClass;
        await fetchObjectsForClass(file.name, activeQueryClass || "byte[]");
      } else {
        setUploadStatus("error");
        setStatusMessage("Upload failed. Check backend logs.");
      }
    } catch (err) {
      console.error("Failed to upload/parse heap dump:", err);
      setUploadStatus("error");
      setStatusMessage("Connection error to Spring Boot (8080).");
    }
  };

  // 4. Trigger Heap Dump on the Local HeapVortex Backend itself
  const handleProfileSelfJvm = async () => {
    setUploadStatus("uploading");
    setStatusMessage("Dumping local HeapVortex JVM...");

    try {
      const res = await fetch("http://localhost:8080/api/jvm/dump-self", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        const generatedFileName = data.fileName;
        setFileName(generatedFileName);
        setStatusMessage(`Self-dump complete! Parsing ${generatedFileName}...`);

        const activeClass = selectedClass === "Custom..." ? customClass : selectedClass;
        await fetchObjectsForClass(generatedFileName, activeClass || "byte[]");
      } else {
        setUploadStatus("error");
        setStatusMessage("Failed to dump local JVM.");
      }
    } catch (err) {
      console.error("Error dumping self JVM:", err);
      setUploadStatus("error");
      setStatusMessage("Connection error to Spring Boot.");
    }
  };

  // 5. Trigger Remote Heap Dump over JMX and parse with MAT
  const handleTriggerRemoteDump = async () => {
    if (!jmxHost || !jmxPort) return;
    setUploadStatus("uploading");
    setStatusMessage(`Triggering remote dump on ${jmxHost}:${jmxPort}...`);

    try {
      const url = `http://localhost:8080/api/jvm/trigger-remote-dump?host=${encodeURIComponent(
        jmxHost
      )}&port=${encodeURIComponent(jmxPort)}`;

      const res = await fetch(url, { method: "POST" });

      if (res.ok) {
        const data = await res.json();
        const generatedFileName = data.fileName;
        setFileName(generatedFileName);
        setStatusMessage(`Remote dump complete! Parsing ${generatedFileName}...`);

        const activeClass = selectedClass === "Custom..." ? customClass : selectedClass;
        await fetchObjectsForClass(generatedFileName, activeClass || "byte[]");
      } else {
        setUploadStatus("error");
        setStatusMessage("Failed to trigger remote dump.");
      }
    } catch (err) {
      console.error("Error triggering remote dump:", err);
      setUploadStatus("error");
      setStatusMessage("Connection error to Spring Boot backend.");
    }
  };

  // 6. Handle Class Dropdown Change
  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass);
    const queryClass = newClass === "Custom..." ? customClass : newClass;
    if (fileName && queryClass) {
      fetchObjectsForClass(fileName, queryClass);
    }
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", backgroundColor: "#030712", color: "#ffffff", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" }}>

      {/* 1. Header Bar */}
      <header style={{ width: "100%", backgroundColor: "#111827", borderBottom: "1px solid #374151", padding: "16px 24px", boxSizing: "border-box" }}>
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>

          {/* Main App Title */}
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#818cf8", letterSpacing: "-0.5px" }}>
              HeapVortex - 3D JVM Profiler
            </h1>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>
              Interactive Heap Dump Parser & Live JMX Telemetry
            </p>
          </div>

          {/* JMX Remote Connection Form */}
          <form onSubmit={handleJmxConnect} style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#1f2937", padding: "6px 12px", borderRadius: "10px", border: "1px solid #374151" }}>
            <Plug size={16} color={jmxConnected ? "#4ade80" : "#9ca3af"} />
            <input
              type="text"
              placeholder="Host (localhost)"
              value={jmxHost}
              onChange={(e) => setJmxHost(e.target.value)}
              style={{ backgroundColor: "#111827", border: "1px solid #4b5563", color: "#ffffff", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", width: "100px" }}
            />
            <input
              type="text"
              placeholder="Port (9010)"
              value={jmxPort}
              onChange={(e) => setJmxPort(e.target.value)}
              style={{ backgroundColor: "#111827", border: "1px solid #4b5563", color: "#ffffff", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", width: "65px" }}
            />
            <button
              type="submit"
              disabled={jmxConnecting}
              style={{ backgroundColor: "#4f46e5", color: "#ffffff", border: "none", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
            >
              {jmxConnecting ? "..." : "Connect JMX"}
            </button>

            <button
              type="button"
              onClick={handleTriggerRemoteDump}
              disabled={uploadStatus === "uploading"}
              style={{ backgroundColor: "#8b5cf6", color: "#ffffff", border: "none", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
            >
              Dump Remote JVM
            </button>

            {jmxMessage && (
              <span style={{ fontSize: "10px", color: jmxConnected ? "#4ade80" : "#f87171", fontFamily: "monospace" }}>
                {jmxMessage}
              </span>
            )}
          </form>

          {/* Buttons: Profile Current JVM & File Upload */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={handleProfileSelfJvm}
              disabled={uploadStatus === "uploading"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                backgroundColor: "#059669",
                color: "#ffffff",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "bold",
                border: "none"
              }}
            >
              <Cpu size={16} />
              <span>Profile Current JVM</span>
            </button>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "#4f46e5", color: "#ffffff", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", border: "none" }}>
                {uploadStatus === "uploading" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                <span>{uploadStatus === "uploading" ? "Uploading..." : "Select .hprof File"}</span>
                <input type="file" accept=".hprof" onChange={handleFileUpload} style={{ display: "none" }} />
              </label>

              {statusMessage && (
                <span style={{ fontSize: "11px", fontFamily: "monospace", color: uploadStatus === "success" ? "#4ade80" : uploadStatus === "error" ? "#f87171" : "#a5b4fc" }}>
                  {statusMessage}
                </span>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* 2. Main Grid Layout */}
      <main style={{ width: "100%", flex: 1, padding: "20px 24px", boxSizing: "border-box", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>

        {/* Left: 3D Visualizer Container */}
        <div style={{
          gridColumn: "span 2",
          backgroundColor: "#111827",
          border: "1px solid #4f46e5",
          borderRadius: "14px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          minHeight: "550px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
        }}>
          {/* Visualizer Header & Class Filter */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <HardDrive size={18} color="#818cf8" />
              <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#e5e7eb" }}>3D Heap Memory Space</h2>
            </div>

            {/* Class Dropdown Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter size={14} color="#9ca3af" />
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>Class:</span>
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                style={{ backgroundColor: "#1f2937", border: "1px solid #4b5563", color: "#ffffff", padding: "4px 8px", borderRadius: "6px", fontSize: "11px" }}
              >
                {commonClasses.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>

              {selectedClass === "Custom..." && (
                <input
                  type="text"
                  placeholder="e.g. java.lang.String"
                  value={customClass}
                  onChange={(e) => setCustomClass(e.target.value)}
                  onBlur={() => fileName && fetchObjectsForClass(fileName, customClass)}
                  style={{ backgroundColor: "#1f2937", border: "1px solid #4b5563", color: "#ffffff", padding: "4px 8px", borderRadius: "6px", fontSize: "11px" }}
                />
              )}

              <span style={{ fontSize: "12px", color: "#9ca3af", fontFamily: "monospace", marginLeft: "8px" }}>
                ({objects.length} Objects)
              </span>
            </div>
          </div>

          {/* 3D Canvas Viewport / Empty State */}
          <div style={{
            width: "100%",
            flex: 1,
            position: "relative",
            minHeight: "480px",
            borderRadius: "10px",
            overflow: "hidden",
            border: "1px solid #374151",
            backgroundColor: "#0a0e27",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {objects.length > 0 ? (
              <HeapVortexVisualizer
                objects={objects}
                onObjectSelected={setSelectedObject}
              />
            ) : (
              <div style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}>
                <AlertCircle size={40} style={{ marginBottom: "12px", color: "#4f46e5" }} />
                <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#e5e7eb" }}>No Heap Dump Loaded</h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
                  Upload an <code>.hprof</code> file, or click <strong>Profile Current JVM</strong> / <strong>Dump Remote JVM</strong> to analyze memory.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Live JMX Telemetry Chart */}
          <div style={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "14px", padding: "16px" }}>
            <HeapMetrics />
          </div>

          {/* Loaded Heap Objects Inspector List */}
          <div style={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "14px", padding: "16px", flex: 1, display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold", color: "#e5e7eb", display: "flex", justifyContent: "space-between", items: "center" }}>
              <span>Loaded Heap Objects</span>
              <span style={{ backgroundColor: "#1e1b4b", color: "#a5b4fc", fontSize: "10px", padding: "2px 8px", borderRadius: "12px", border: "1px solid #3730a3" }}>
                {objects.length} Items
              </span>
            </h3>

            <div style={{ flex: 1, maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
              {objects.length > 0 ? (
                objects.map((obj) => (
                  <div
                    key={obj.address}
                    onClick={() => setSelectedObject(obj)}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      border: selectedObject?.address === obj.address ? "1px solid #6366f1" : "1px solid #374151",
                      backgroundColor: selectedObject?.address === obj.address ? "rgba(99, 102, 241, 0.2)" : "#1f2937",
                      fontSize: "12px"
                    }}
                  >
                    <p style={{ margin: 0, fontFamily: "monospace", color: "#c084fc", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {obj.className}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", marginTop: "4px", fontSize: "11px", fontFamily: "monospace" }}>
                      <span>Address: {obj.address}</span>
                      <span style={{ color: "#4ade80", fontWeight: "bold" }}>
                        {((obj.retainedHeap || 0) / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                  No objects loaded yet.
                </p>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Centered GC Roots & Reference Inspector Modal */}
      {selectedObject && (
        <HeapObjectDetailsPanel
          object={selectedObject}
          fileName={fileName}
          onClose={() => setSelectedObject(null)}
        />
      )}
    </div>
  );
}