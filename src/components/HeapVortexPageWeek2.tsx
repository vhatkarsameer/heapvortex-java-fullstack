import React, { useState } from "react";
import { HeapVortexVisualizer } from "@/components/HeapVortexVisualizer";
import { HeapObjectDetailsPanel } from "@/components/HeapObjectDetailsPanel";
import { HeapVortexMetrics } from "@/components/HeapVortexMetrics";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { RotateCcw, Settings, Download, Play, Pause } from "lucide-react";

interface HeapObject {
  id: number;
  snapshotId: number;
  className: string;
  retainedSize: number;
  objectId: string;
  referenceChain?: string[];
}

interface HeapEdge {
  id: number;
  snapshotId: number;
  sourceObjectId: string;
  targetObjectId: string;
}

export default function HeapVortexPageWeek2() {
  const [selectedObject, setSelectedObject] = useState<HeapObject | null>(null);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);

  // Fetch initial heap snapshot
  const snapshotQuery = trpc.heapVortex.getHeapSnapshot.useQuery({ jvmId: "default-jvm" });

  // Fetch heap objects
  const objectsQuery = trpc.heapVortex.getHeapObjects.useQuery(
    { snapshotId: snapshotQuery.data?.id || 0 },
    { enabled: !!snapshotQuery.data?.id }
  );

  // Fetch heap edges
  const edgesQuery = trpc.heapVortex.getHeapEdges.useQuery(
    { snapshotId: snapshotQuery.data?.id || 0 },
    { enabled: !!snapshotQuery.data?.id }
  );

  const objects = (objectsQuery.data as HeapObject[]) || [];
  const edges = (edgesQuery.data as HeapEdge[]) || [];

  const handleRefreshSnapshot = () => {
    snapshotQuery.refetch();
  };

  const handleExportData = () => {
    const data = {
      snapshot: snapshotQuery.data,
      objects,
      edges,
      timestamp: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `heap-snapshot-${Date.now()}.json`;
    a.click();
  };

  if (snapshotQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">HeapVortex - 3D JVM Memory Profiler</h1>
            <p className="text-sm text-gray-400 mt-1">
              Interactive heap visualization with reference chain analysis
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Snapshot ID: {snapshotQuery.data?.id}</p>
            <p className="text-sm text-gray-400">
              Objects: {objects.length} | Edges: {edges.length}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center gap-3">
        <button
          onClick={handleRefreshSnapshot}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-medium"
          title="Refresh heap snapshot"
        >
          <RotateCcw size={16} />
          Refresh
        </button>

        <button
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
            isAutoRotate
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          title="Toggle auto-rotation"
        >
          {isAutoRotate ? <Pause size={16} /> : <Play size={16} />}
          {isAutoRotate ? "Pause" : "Play"}
        </button>

        <button
          onClick={() => setShowMetrics(!showMetrics)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
            showMetrics
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          title="Toggle metrics panel"
        >
          <Settings size={16} />
          {showMetrics ? "Hide" : "Show"} Metrics
        </button>

        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium ml-auto"
          title="Export snapshot data"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Visualization */}
        <div className="flex-1 relative">
          {objects.length > 0 ? (
            <HeapVortexVisualizer
              objects={objects}
              edges={edges}
              onObjectSelected={setSelectedObject}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">Loading 3D visualization...</p>
                <Spinner />
              </div>
            </div>
          )}

          {/* Info Overlay */}
          <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 text-white p-4 rounded-lg max-w-sm">
            <h3 className="font-semibold mb-2 text-sm">Controls</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• <span className="text-purple-400">Left Click + Drag</span>: Rotate view</li>
              <li>• <span className="text-purple-400">Right Click + Drag</span>: Pan view</li>
              <li>• <span className="text-purple-400">Scroll</span>: Zoom in/out</li>
              <li>• <span className="text-purple-400">Hover</span>: Preview object info</li>
              <li>• <span className="text-purple-400">Click Node</span>: Select object</li>
            </ul>
          </div>
        </div>

        {/* Sidebar Panels */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
          {/* Metrics Panel */}
          {showMetrics && (
            <div className="flex-1 border-b border-gray-700 overflow-y-auto">
              <HeapVortexMetrics />
            </div>
          )}

          {/* Objects List */}
          <div className={`${showMetrics ? "flex-1" : "flex-1"} overflow-y-auto border-b border-gray-700`}>
            <div className="p-4">
              <h3 className="text-lg font-bold mb-3">Heap Objects ({objects.length})</h3>
              <div className="space-y-2">
                {objects.slice(0, 15).map((obj) => (
                  <div
                    key={obj.objectId}
                    onClick={() => setSelectedObject(obj)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedObject?.objectId === obj.objectId
                        ? "bg-purple-600 border border-purple-500"
                        : "bg-gray-700 hover:bg-gray-600 border border-gray-600"
                    }`}
                  >
                    <p className="font-mono text-xs text-purple-300 truncate">
                      {obj.className}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {(obj.retainedSize / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ))}
                {objects.length > 15 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    +{objects.length - 15} more objects
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Selection Summary */}
          {selectedObject && (
            <div className="p-4 bg-purple-900 bg-opacity-30 border-t border-purple-700">
              <p className="text-xs text-purple-300 uppercase tracking-wide">Selected</p>
              <p className="text-sm font-mono text-purple-200 mt-1 truncate">
                {selectedObject.className}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Size: {(selectedObject.retainedSize / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Details Panel */}
      {selectedObject && (
        <HeapObjectDetailsPanel
          object={selectedObject}
          onClose={() => setSelectedObject(null)}
        />
      )}
    </div>
  );
}
