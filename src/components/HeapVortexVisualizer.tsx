import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface HeapObject {
  id: number;
  className: string;
  retainedSize: number;
  objectId: string;
  referenceChain?: string[];
}

interface HeapEdge {
  id: number;
  sourceObjectId: string;
  targetObjectId: string;
}

interface HeapVisualizerProps {
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

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 100, 200);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 60);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;
    controls.enablePan = true;
    controlsRef.current = controls;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 200;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x6366f1, 0.5);
    pointLight.position.set(-30, 30, 30);
    scene.add(pointLight);

    // Create nodes
    const nodeMap = new Map<string, THREE.Mesh>();
    const nodeObjectMap = new Map<THREE.Mesh, HeapObject>();

    objects.forEach((obj, index) => {
      const size = Math.max(1, Math.log(obj.retainedSize + 1) / 5);
      const geometry = new THREE.SphereGeometry(size, 32, 32);

      // Color based on retained size
      const hue = Math.min(obj.retainedSize / 50000, 1);
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(hue, 0.8, 0.5),
        emissive: new THREE.Color().setHSL(hue, 0.8, 0.3),
        shininess: 100,
        wireframe: false,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Position in 3D space
      const angle = (index / objects.length) * Math.PI * 2;
      const radius = 30 + (index % 5) * 5;
      const height = (Math.random() - 0.5) * 40;

      mesh.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );

      mesh.userData = {
        objectId: obj.objectId,
        isNode: true,
      };

      scene.add(mesh);
      nodeMap.set(obj.objectId, mesh);
      nodeObjectMap.set(mesh, obj);
    });

    nodeMapRef.current = nodeMap;

    // Create edges with glow effect
    const edgeGroup = new THREE.Group();
    edges.forEach((edge) => {
      const sourceNode = nodeMap.get(edge.sourceObjectId);
      const targetNode = nodeMap.get(edge.targetObjectId);

      if (sourceNode && targetNode) {
        const points = [sourceNode.position, targetNode.position];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        // Main line
        const material = new THREE.LineBasicMaterial({
          color: 0x6366f1,
          linewidth: 2,
          transparent: true,
          opacity: 0.6,
        });
        const line = new THREE.Line(geometry, material);
        edgeGroup.add(line);

        // Glow line
        const glowMaterial = new THREE.LineBasicMaterial({
          color: 0x8b5cf6,
          linewidth: 4,
          transparent: true,
          opacity: 0.2,
        });
        const glowLine = new THREE.Line(geometry, glowMaterial);
        edgeGroup.add(glowLine);
      }
    });
    scene.add(edgeGroup);

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

    // Raycasting for mouse interaction
    const onMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(
        Array.from(nodeMap.values())
      );

      // Reset previous hover
      if (selectedMeshRef.current && selectedMeshRef.current !== intersects[0]?.object) {
        const material = selectedMeshRef.current.material as THREE.MeshPhongMaterial;
        material.emissive.setHex(0x000000);
      }

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const object = nodeObjectMap.get(mesh);
        if (object) {
          setHoveredObject(object);
          const material = mesh.material as THREE.MeshPhongMaterial;
          material.emissive.setHex(0xffffff);
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
        const object = nodeObjectMap.get(mesh);
        if (object && onObjectSelected) {
          onObjectSelected(object);
        }
      }
    };

    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("click", onClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [objects, edges, onObjectSelected]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full bg-gray-950" />
      {hoveredObject && (
        <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 text-white p-3 rounded-lg max-w-xs pointer-events-none">
          <p className="text-sm font-mono text-purple-400">{hoveredObject.className}</p>
          <p className="text-xs text-gray-400">Size: {hoveredObject.retainedSize} bytes</p>
        </div>
      )}
    </div>
  );
};
