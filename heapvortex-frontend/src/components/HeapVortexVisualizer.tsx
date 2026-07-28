import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface HeapObject {
  id: number;
  className: string;
  retainedSize: number;
  objectId: string;
  referenceChain?: string[];
}

export interface HeapEdge {
  id: number;
  sourceObjectId: string;
  targetObjectId: string;
}

export interface HeapVisualizerProps {
  objects: HeapObject[];
  edges: HeapEdge[];
  onObjectSelected?: (object: HeapObject | null) => void;
}

export const HeapVortexVisualizer: React.FC<HeapVisualizerProps> = ({
  objects,
  edges,
  onObjectSelected,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const nodeMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const selectedMeshRef = useRef<THREE.Mesh | null>(null);

  const [hoveredObject, setHoveredObject] = useState<HeapObject | null>(null);
  const [selectedObject, setSelectedObject] = useState<HeapObject | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 100, 200);
    sceneRef.current = scene;

    // 2. Camera setup
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 60);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controls.enablePan = true;
    controlsRef.current = controls;

    // 5. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x6366f1, 0.8);
    pointLight.position.set(-30, 30, 30);
    scene.add(pointLight);

    // 6. Create Nodes (Objects)
    const nodeMap = new Map<string, THREE.Mesh>();
    const nodeObjectMap = new Map<THREE.Mesh, HeapObject>();

    objects.forEach((obj, index) => {
      const size = Math.max(1.2, Math.log(obj.retainedSize + 1) / 4);
      const geometry = new THREE.SphereGeometry(size, 32, 32);

      const hue = Math.min(obj.retainedSize / 50000, 1) * 0.8;
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(hue, 0.8, 0.5),
        emissive: new THREE.Color().setHSL(hue, 0.8, 0.2),
        shininess: 80,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const angle = (index / (objects.length || 1)) * Math.PI * 2;
      const radius = 25 + (index % 5) * 6;
      const h = (Math.random() - 0.5) * 30;

      mesh.position.set(Math.cos(angle) * radius, h, Math.sin(angle) * radius);
      mesh.userData = { objectId: obj.objectId, object: obj };

      scene.add(mesh);
      nodeMap.set(obj.objectId, mesh);
      nodeObjectMap.set(mesh, obj);
    });

    nodeMapRef.current = nodeMap;

    // 7. Create Edges
    const edgeGroup = new THREE.Group();
    edges.forEach((edge) => {
      const sourceNode = nodeMap.get(edge.sourceObjectId);
      const targetNode = nodeMap.get(edge.targetObjectId);

      if (sourceNode && targetNode) {
        const points = [sourceNode.position, targetNode.position];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
          color: 0x6366f1,
          transparent: true,
          opacity: 0.5,
        });
        const line = new THREE.Line(geometry, material);
        edgeGroup.add(line);
      }
    });
    scene.add(edgeGroup);

    // 8. Event Handlers
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(
        Array.from(nodeMap.values())
      );

      if (selectedMeshRef.current && selectedMeshRef.current !== intersects[0]?.object) {
        const mat = selectedMeshRef.current.material as THREE.MeshPhongMaterial;
        mat.emissive.setHex(0x000000);
      }

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const obj = nodeObjectMap.get(mesh);
        if (obj) {
          setHoveredObject(obj);
          const mat = mesh.material as THREE.MeshPhongMaterial;
          mat.emissive.setHex(0x444444);
          selectedMeshRef.current = mesh;
        }
      } else {
        setHoveredObject(null);
        selectedMeshRef.current = null;
      }
    };

    const onClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(
        Array.from(nodeMap.values())
      );

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const obj = nodeObjectMap.get(mesh) || null;
        setSelectedObject(obj);
        if (onObjectSelected) {
          onObjectSelected(obj);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("click", onClick);

    // 9. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 10. Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener("mousemove", onMouseMove);
        renderer.domElement.removeEventListener("click", onClick);
      }
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [objects, edges, onObjectSelected]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={containerRef} className="w-full h-full min-h-[500px] rounded-lg overflow-hidden" />

      {/* Hover Tooltip */}
      {hoveredObject && (
        <div className="absolute top-4 left-4 bg-gray-900/90 text-white p-3 rounded-lg border border-gray-700 pointer-events-none shadow-lg">
          <p className="text-sm font-mono text-indigo-400">{hoveredObject.className}</p>
          <p className="text-xs text-gray-300">Size: {hoveredObject.retainedSize} bytes</p>
          <p className="text-xs text-gray-400">ID: {hoveredObject.objectId}</p>
        </div>
      )}

      {/* Selected Object Panel */}
      {selectedObject && (
        <div className="absolute top-4 right-4 bg-gray-900/95 text-white p-4 rounded-lg border border-indigo-500/50 shadow-xl w-72">
          <h3 className="text-md font-bold mb-2 text-indigo-400">Object Details</h3>
          <p className="text-xs mb-1"><strong>Class:</strong> {selectedObject.className}</p>
          <p className="text-xs mb-1"><strong>Retained Size:</strong> {selectedObject.retainedSize} bytes</p>
          <p className="text-xs mb-1"><strong>Object ID:</strong> {selectedObject.objectId}</p>
        </div>
      )}
    </div>
  );
};