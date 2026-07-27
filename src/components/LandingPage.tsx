import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
export default function LandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location, setLocation] = useLocation();
  const projects = [
    {
      id: "heapvortex",
      name: "HeapVortex",
      description: "3D JVM Memory Leak Profiler",
      icon: "
🔍
",
      path: "/heapvortex",
      color: "from-purple-600 to-blue-600",
      details: "Visualize Java heap objects in real-time with interactive 3D gra
    },
  ];
  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gray-900 border-r border-gray-800 transition-all duration-300 flex 
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-b
          {sidebarOpen && <h1 className="text-xl font-bold">Engineering</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-800 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setLocation(project.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg t
                location === project.path
                  ? "bg-gradient-to-r " + project.color + " text-white"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <span className="text-xl">{project.icon}</span>
              {sidebarOpen && (
                <div className="text-left">
                  <p className="font-semibold text-sm">{project.name}</p>
                  <p className="text-xs opacity-75">{project.description}</p>
                </div>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          {sidebarOpen && (
            <p className="text-xs text-gray-500">
              Advanced Full-Stack Engineering Demo Platform
            </p>
          )}
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-90
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple
              Engineering Demo Platform
            </h1>
            <p className="text-xl text-gray-400">
              Advanced full-stack applications showcasing real-time data visuali
            </p>
          </div>
          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative bg-gray-900 rounded-xl border border-g
              >
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${project.colo
                />
                {/* Content */}
                <div className="relative p-8">
                  <div className="text-5xl mb-4">{project.icon}</div>
                  <h2 className="text-3xl font-bold mb-2">{project.name}</h2>
                  <p className="text-gray-400 mb-4">{project.description}</p>
                  <p className="text-gray-500 text-sm mb-6">{project.details}</
                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-40
                      <span className="w-2 h-2 bg-purple-500 rounded-full" />
                      Interactive 3D object graph visualization
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-40
                      <span className="w-2 h-2 bg-purple-500 rounded-full" />
                      Real-time JVM metrics (CPU, heap usage)
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-40
                      <span className="w-2 h-2 bg-purple-500 rounded-full" />
                      Reference chain analysis and DFS algorithms
                    </div>
                  </div>
                  <Button
                    onClick={() => setLocation(project.path)}
                    className={`w-full bg-gradient-to-r ${project.color} text-w
                  >
                    Launch {project.name}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-gray-800 text-center text-g
            <p>Advanced Full-Stack Java Engineering • Real-time Visualization • 
          </div>
        </div>
      </div>
    </div>
  );
}
