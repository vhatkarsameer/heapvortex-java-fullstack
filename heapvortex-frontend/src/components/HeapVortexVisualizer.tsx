import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { AlertCircle } from "lucide-react";

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
  const [webGlError, setWebGlError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Remove any old canvases before creating a new renderer
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    let width = container.clientWidth || 800;
    let height = container.clientHeight || 500;

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch (err: any) {
      console.error("WebGL Context Creation Failed:", err);
      setWebGlError("WebGL is disabled or not supported.");
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 5000);
    camera.position.set(0, 0, 300);

    renderer.setSize(width, height, true);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.enableZoom = true;
    controls.minDistance = 10;
    controls.maxDistance = 2000;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    const nodeObjectMap = new Map<number, HeapObject>();
    let instancedMesh: THREE.InstancedMesh | null = null;

    try {
      const safeObjects = Array.isArray(objects) ? objects : [];
      const displayObjects = safeObjects.slice(0, 15000);
      const count = displayObjects.length;

      if (count > 0) {
        const geometry = new THREE.IcosahedronGeometry(1, 1);
        const material = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          shininess: 50,
        });

        instancedMesh = new THREE.InstancedMesh(geometry, material, count);

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();

        displayObjects.forEach((obj, index) => {
          if (!obj) return;
          const heapVal = Number(obj.retainedHeap) || Number(obj.shallowHeap) || 1000;

          const radius = Math.max(1.0, Math.min(4.0, Math.log10(heapVal) * 0.7));

          const phi = Math.acos(-1 + (2 * (index + 0.5)) / count);
          const theta = Math.sqrt(count * Math.PI) * phi;

          const distance = 30 + (Math.random() * 80) + (Math.log(index + 1) * 8);

          dummy.position.set(
            distance * Math.cos(theta) * Math.sin(phi),
            distance * Math.sin(theta) * Math.sin(phi),
            distance * Math.cos(phi)
          );
          dummy.scale.set(radius, radius, radius);
          dummy.updateMatrix();

          instancedMesh!.setMatrixAt(index, dummy.matrix);

          const hue = (index / count) * 0.85;
          color.setHSL(hue, 0.85, 0.55);
          instancedMesh!.setColorAt(index, color);

          nodeObjectMap.set(index, obj);
        });

        instancedMesh.instanceMatrix.needsUpdate = true;
        if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

        scene.add(instancedMesh);
      }
    } catch (err) {
      console.error("Error rendering 3D instances:", err);
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
      if (!containerRef.current || !instancedMesh) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(instancedMesh);

      if (intersects.length > 0) {
        const instanceId = intersects[0].instanceId;
        if (instanceId !== undefined) {
          const obj = nodeObjectMap.get(instanceId) || null;
          if (onObjectSelected) onObjectSelected(obj);
        }
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

    // FIX: Define animId outside the animate function so it can be reliably cancelled
    let animId: number;
    let isDisposed = false;

    // FIX: Ensure the animation loop runs continuously until unmounted
    const animate = () => {
      if (isDisposed) return;

      // Update controls before rendering for smooth auto-rotation
      controls.update();
      renderer.render(scene, camera);

      animId = requestAnimationFrame(animate);
    };

    // Kick off the loop immediately
    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", updateDimensions);
      resizeObserver.disconnect();
      renderer.dispose();
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [objects]); // Reacting ONLY to objects changing.

  if (webGlError) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center", color: "#f87171" }}>
        <AlertCircle size={40} style={{ marginBottom: "12px" }} />
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#e5e7eb" }}>3D Acceleration Unavailable</h3>
        <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af", maxWidth: "350px" }}>{webGlError}</p>
      </div>
    );
  }

  return <div ref={containerRef} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", overflow: "hidden", borderRadius: "8px" }} />;
};

export default HeapVortexVisualizer;