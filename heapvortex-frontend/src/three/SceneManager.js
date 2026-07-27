import * as THREE from "three";

export function initScene(container) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );

  container.appendChild(renderer.domElement);

  camera.position.z = 5;

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshNormalMaterial();
  const cube = new THREE.Mesh(geometry, material);

  scene.add(cube);

  function animate() {
    requestAnimationFrame(animate);

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
  }

  animate();
}