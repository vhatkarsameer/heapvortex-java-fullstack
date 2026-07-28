import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Copy, X } from "lucide-react";

interface HeapObject {
  id: number;
  className: string;
  retainedSize: number;
  objectId: string;
  referenceChain?: string[];
}

interface HeapObjectDetailsPanelProps {
  object: HeapObject | null;
  onClose: () => void;
}

export const HeapObjectDetailsPanel: React.FC<HeapObjectDetailsPanelProps> = ({
  object,
  onClose,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["overview", "referenceChain"])
  );
  const [copied, setCopied] = useState(false);

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes, k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const generateReferenceChain = (objectId: string): string[] => {
    // Mock reference chain generation
    const chains = [
      ["GC Root", "ThreadGroup", "Thread", "ThreadLocal", objectId],
      ["Static Reference", "Class Loader", "Class", objectId],
      ["Heap Root", "Instance", objectId],
      ["Array Element", "Collection", objectId],
    ];
    return chains[Math.floor(Math.random() * chains.length)];
  };

  if (!object) return null;

  const referenceChain = object.referenceChain || generateReferenceChain(object.objectId);

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-gray-800 border-l border-gray-700 shadow-2xl overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Object Details</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Overview Section */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("overview")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-800 transition-colors"
          >
            <span className="font-semibold text-white">Overview</span>
            {expandedSections.has("overview") ? (
              <ChevronUp size={18} className="text-purple-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-500" />
            )}
          </button>

          {expandedSections.has("overview") && (
            <div className="border-t border-gray-700 p-3 space-y-3">
              {/* Class Name */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Class Name</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-mono text-purple-400 break-all">
                    {object.className}
                  </p>
                  <button
                    onClick={() => copyToClipboard(object.className)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors ml-2"
                    title="Copy class name"
                  >
                    <Copy size={14} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Object ID */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Object ID</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-mono text-blue-400 break-all">
                    {object.objectId}
                  </p>
                  <button
                    onClick={() => copyToClipboard(object.objectId)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors ml-2"
                    title="Copy object ID"
                  >
                    <Copy size={14} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Retained Size */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Retained Size</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-lg font-bold text-green-400">
                    {formatBytes(object.retainedSize)}
                  </p>
                  <p className="text-xs text-gray-500">
                    ({object.retainedSize.toLocaleString()} bytes)
                  </p>
                </div>
              </div>

              {/* Size Percentage */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Heap Impact</p>
                <div className="mt-2 w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-full"
                    style={{
                      width: `${Math.min((object.retainedSize / 100000) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {Math.min((object.retainedSize / 100000) * 100, 100).toFixed(1)}% of max heap
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reference Chain Section */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("referenceChain")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-800 transition-colors"
          >
            <span className="font-semibold text-white">Reference Chain</span>
            {expandedSections.has("referenceChain") ? (
              <ChevronUp size={18} className="text-purple-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-500" />
            )}
          </button>

          {expandedSections.has("referenceChain") && (
            <div className="border-t border-gray-700 p-3">
              <div className="space-y-2">
                {referenceChain.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0
                            ? "bg-red-500"
                            : index === referenceChain.length - 1
                            ? "bg-green-500"
                            : "bg-purple-500"
                        }`}
                      />
                      {index < referenceChain.length - 1 && (
                        <div className="w-0.5 h-6 bg-gray-600 my-1" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-mono text-gray-300 break-all">{item}</p>
                      <p className="text-xs text-gray-500">
                        {index === 0
                          ? "Root Reference"
                          : index === referenceChain.length - 1
                          ? "Target Object"
                          : `Level ${index}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reference Chain Stats */}
              <div className="mt-4 pt-3 border-t border-gray-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Chain Depth:</span>
                  <span className="text-white font-semibold">{referenceChain.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Reachability:</span>
                  <span className="text-green-400 font-semibold">Reachable</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Metrics Section */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("metrics")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-800 transition-colors"
          >
            <span className="font-semibold text-white">Metrics</span>
            {expandedSections.has("metrics") ? (
              <ChevronUp size={18} className="text-purple-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-500" />
            )}
          </button>

          {expandedSections.has("metrics") && (
            <div className="border-t border-gray-700 p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 rounded p-2">
                  <p className="text-xs text-gray-500">Shallow Size</p>
                  <p className="text-sm font-bold text-blue-400 mt-1">
                    {formatBytes(Math.floor(object.retainedSize * 0.3))}
                  </p>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <p className="text-xs text-gray-500">Referenced Objects</p>
                  <p className="text-sm font-bold text-purple-400 mt-1">
                    {Math.floor(Math.random() * 50) + 5}
                  </p>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <p className="text-xs text-gray-500">Referencing Objects</p>
                  <p className="text-sm font-bold text-green-400 mt-1">
                    {Math.floor(Math.random() * 30) + 1}
                  </p>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <p className="text-xs text-gray-500">GC Root Distance</p>
                  <p className="text-sm font-bold text-orange-400 mt-1">
                    {Math.floor(Math.random() * 20) + 1}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4">
        <button
          onClick={onClose}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
        >
          Close Panel
        </button>
        {copied && (
          <p className="text-xs text-green-400 text-center mt-2">Copied to clipboard!</p>
        )}
      </div>
    </div>
  );
};
