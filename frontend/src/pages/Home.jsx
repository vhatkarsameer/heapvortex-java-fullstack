import { useEffect, useRef } from "react";
import { initScene } from "../three/SceneManager";

function Home() {
  const mountRef = useRef(null);

  useEffect(() => {
    initScene(mountRef.current);
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

export default Home;