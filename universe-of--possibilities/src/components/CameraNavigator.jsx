
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";

import { getStarPosition } from "../utils/orbits.js";

export default function CameraNavigator({ selectedStar }) {
  const controlsRef = useRef(null);
  const flyingRef = useRef(false);

  const targetPoint = useRef(new Vector3());
  const cameraPoint = useRef(new Vector3());

  useEffect(() => {
    flyingRef.current = selectedStar !== null;
  }, [selectedStar]);

  useFrame((state, delta) => {
    const controls = controlsRef.current;

    if (!controls || !selectedStar || !flyingRef.current) {
      return;
    }

    const [x, y, z] = getStarPosition(
      selectedStar,
      state.clock.elapsedTime
    );

    targetPoint.current.set(x, y, z);

    const distance = 3 + selectedStar.size * 2;

    cameraPoint.current.set(
      x,
      y,
      z + distance
    );

    const smooth = 1 - Math.exp(-2.5 * delta);

    state.camera.position.lerp(
      cameraPoint.current,
      smooth
    );

    controls.target.lerp(
      targetPoint.current,
      smooth
    );

    controls.update();

    if (
      !selectedStar.orbit &&
      state.camera.position.distanceTo(
        cameraPoint.current
      ) < 0.03 &&
      controls.target.distanceTo(
        targetPoint.current
      ) < 0.03
    ) {
      flyingRef.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      onStart={() => {
        flyingRef.current = false;
      }}
    />
  );
}
