import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface HeapObject {
  className: string;
  address: string;
  shallowHeap: number;
  retainedHeap: number;
}

export interface HeapEdge {
  sourceAddress: string;
  targetAddress: string;
}

export interface HeapVisualizerProps {
  objects: HeapObject[];
  edges?: HeapEdge[];
  onObjectSelected?: (object: HeapObject | null) => void;
}

export const HeapVortexVisualizer: React.FC<HeapVisualizerProps> = ({
  objects,
  edges = [],
  onObjectSelected,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let width = container.clientWidth || 800;
    let height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 0, 150); // Pulled back slightly to fit more objects

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height, true);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    const nodeMap = new Map<string, THREE.Mesh>();
    const nodeObjectMap = new Map<THREE.Mesh, HeapObject>();

    // CHANGE: Increased from 150 to 500 so you can see all loaded items in the 3D space!
    const displayObjects = objects.slice(0, 500);

    displayObjects.forEach((obj, index) => {
      const heapVal = obj.retainedHeap || obj.shallowHeap || 1000;

      const radius = Math.max(1.0, Math.min(5.5, Math.log10(heapVal) * 0.9));
      const geometry = new THREE.SphereGeometry(radius, 24, 24);

      const hue = (index / Math.max(displayObjects.length, 1)) * 0.85;
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(hue, 0.85, 0.55),
        emissive: new THREE.Color().setHSL(hue, 0.85, 0.15),
        shininess: 50,
      });

      const mesh = new THREE.Mesh(geometry, material);

      const phi = Math.acos(-1 + (2 * (index + 0.5)) / Math.max(displayObjects.length, 1));
      const theta = Math.sqrt(Math.max(displayObjects.length, 1) * Math.PI) * phi;

      // Adjusted the spacing slightly to accommodate 500 objects beautifully
      const distance = 20 + (index % 12) * 2.5;

      mesh.position.set(
        distance * Math.cos(theta) * Math.sin(phi),
        distance * Math.sin(theta) * Math.sin(phi),
        distance * Math.cos(phi)
      );

      scene.add(mesh);
      nodeMap.set(obj.address, mesh);
      nodeObjectMap.set(mesh, obj);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Array.from(nodeMap.values()));

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const obj = nodeObjectMap.get(mesh) || null;
        if (onObjectSelected) onObjectSelected(obj);
      }
    };

    renderer.domElement.addEventListener("click", onClick);

    const updateDimensions = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight, true);
      }
    };

    const resizeObserver = new ResizeObserver(() => updateDimensions());
    resizeObserver.observe(container);
    window.addEventListener("resize", updateDimensions);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", updateDimensions);
      resizeObserver.disconnect();
      renderer.dispose();
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [objects, edges, onObjectSelected]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: "8px"
      }}
    />
  );
};

export default HeapVortexVisualizer;