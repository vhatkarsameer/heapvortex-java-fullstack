import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface HeapObject {
  id: number;
  className: string;
  retainedSize: number;
  objectId: string;
}

interface HeapEdge {
  id: number;
  sourceObjectId: string;
  targetObjectId: string;
}

interface HeapVisualizerProps {
  objects: HeapObject[];
  edges: HeapEdge[];
}

export const HeapVortexVisualizer: React.FC<HeapVisualizerProps> = ({ objects, edges }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [selectedObject, setSelectedObject] = useState<HeapObject | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 50;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create nodes for each heap object
    const nodeMap = new Map<string, THREE.Mesh>();
    objects.forEach((obj, index) => {
      const geometry = new THREE.SphereGeometry(Math.log(obj.retainedSize + 1) / 5, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
      });
      const mesh = new THREE.Mesh(geometry, material);

      // Position nodes in a circular pattern
      const angle = (index / objects.length) * Math.PI * 2;
      const radius = 30;
      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.y = Math.sin(angle) * radius;
      mesh.position.z = (Math.random() - 0.5) * 20;

      mesh.userData = { objectId: obj.objectId, object: obj };
      scene.add(mesh);
      nodeMap.set(obj.objectId, mesh);
    });

    // Create edges between nodes
    edges.forEach((edge) => {
      const sourceNode = nodeMap.get(edge.sourceObjectId);
      const targetNode = nodeMap.get(edge.targetObjectId);

      if (sourceNode && targetNode) {
        const points = [sourceNode.position, targetNode.position];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
      }
    });

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Simple rotation animation
    const animate = () => {
      requestAnimationFrame(animate);
      scene.rotation.x += 0.0001;
      scene.rotation.y += 0.0002;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [objects, edges]);

  return (
    <div className="flex h-full gap-4">
      <div ref={containerRef} className="flex-1 bg-gray-900 rounded-lg" />
      {selectedObject && (
        <div className="w-64 bg-gray-800 rounded-lg p-4 text-white">
          <h3 className="text-lg font-bold mb-2">Object Details</h3>
          <p><strong>Class:</strong> {selectedObject.className}</p>
          <p><strong>Retained Size:</strong> {selectedObject.retainedSize} bytes</p>
          <p><strong>Object ID:</strong> {selectedObject.objectId}</p>
        </div>
      )}
    </div>
  );
};
      
