
import { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";

import { getStarPosition } from "../utils/orbits.js";

export default function DreamStar({
  star,
  onSelect,
  isSelected,
  isDimmed,
  isOnRoute = false
}) {
  const [isHovered, setIsHovered] = useState(false);
  const meshRef = useRef(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Calculate the star's target scale
    const targetScale = isSelected
      ? 1.5
      : isHovered
        ? 1.3
        : 1;

    // Apply a pulsing effect
    const pulse = isSelected
      ? 1 + Math.sin(state.clock.elapsedTime * 3) * 0.04
      : 1;

    // Smoothly animate star size
    const newScale = MathUtils.damp(
      meshRef.current.scale.x,
      targetScale * pulse,
      6,
      delta
    );

    meshRef.current.scale.setScalar(newScale);

    // Animate orbital position
    const [x, y, z] = getStarPosition(
      star,
      state.clock.elapsedTime
    );

    meshRef.current.position.set(x, y, z);
  });

  return (
    <mesh
      ref={meshRef}
      position={star.position}
      onPointerOver={(event) => {
        event.stopPropagation();
        setIsHovered(true);
      }}
      onPointerOut={() => {
        setIsHovered(false);
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(star);
      }}
    >
      <sphereGeometry
        args={[star.size, 32, 32]}
      />

      <meshStandardMaterial
        color={star.color}
        emissive={star.color}
        emissiveIntensity={
          isSelected ? 3
          : isHovered ? 2.3
          : isDimmed ? 0.1
          : isOnRoute ? 2.5
          : 1.5
        }
        transparent
        opacity={isDimmed ? 0.2 : 1}
      />
    </mesh>
  );
}
