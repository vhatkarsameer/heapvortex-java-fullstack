import React from "react";
import { HeapVortexVisualizer } from "@/components/HeapVortexVisualizer";
import { HeapVortexMetrics } from "@/components/HeapVortexMetrics";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";

interface HeapObject {
  id: number;
  snapshotId: number;
  className: string;
  retainedSize: number;
  objectId: string;
}

interface HeapEdge {
  id: number;
  snapshotId: number;
  sourceObjectId: string;
  targetObjectId: string;
}

export default function HeapVortexPage() {
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

  if (snapshotQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-4 gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">HeapVortex - 3D JVM Memory Profiler</h1>
        <div className="text-sm text-gray-400">
          {snapshotQuery.data && `Snapshot ID: ${snapshotQuery.data.id}`}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-4">
        <div className="col-span-3 bg-gray-800 rounded-lg overflow-hidden">
          {objects.length > 0 ? (
            <HeapVortexVisualizer objects={objects} edges={edges} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Loading 3D visualization...
            </div>
          )}
        </div>
        <div className="col-span-1 flex flex-col gap-4">
          <HeapVortexMetrics />
          <div className="bg-gray-800 rounded-lg p-4 text-white flex-1 overflow-y-auto">
            <h3 className="text-lg font-bold mb-2">Heap Objects ({objects.length})</h3>
            <div className="space-y-2 text-sm">
              {objects.slice(0, 10).map((obj) => (
                <div key={obj.objectId} className="bg-gray-700 rounded p-2">
                  <p className="font-mono text-xs text-gray-400">{obj.className}</p>
                  <p className="text-xs">Size: {obj.retainedSize} bytes</p>
                </div>
              ))}
              {objects.length > 10 && (
                <p className="text-gray-500 text-xs">+{objects.length - 10} more objects</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
