import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";

import { getStarPosition } from "../utils/orbits.js";
import { edgeKey } from "../utils/graph.js";

function MovingConnection({
  connection,
  selectedStar,
  stars,
  routeEdges,
  routeActive,
  animate,
  reveal,
  delay
}) {
  const lineRef = useRef(null);
  const elapsedRef = useRef(0);

  const startStar = stars.find((star) => star.id === connection.from);
  const endStar = stars.find((star) => star.id === connection.to);

  const isConnected = Boolean(
    selectedStar &&
    (connection.from === selectedStar.id ||
      connection.to === selectedStar.id)
  );

  const isOnRoute = routeActive && routeEdges.has(
    edgeKey(connection.from, connection.to)
  );

  // Keep the existing highlighting behavior from the original component.
  const targetOpacity = routeActive
    ? isOnRoute ? 1 : 0.06
    : selectedStar
      ? isConnected ? 1 : 0.07
      : 0.6;

  // Drei's <Line> creates a Line2 object. Animate its OWN geometry and
  // material instead of searching for lines in a parent Three.js group.
  useFrame((state, delta) => {
    const line = lineRef.current;
    if (!line || !startStar || !endStar) return;

    const time = state.clock.elapsedTime;
    const start = getStarPosition(startStar, time);
    const end = getStarPosition(endStar, time);

    let progress = 1;

    if (animate) {
      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!reveal) {
        // The dark transition covers the scene. Reset the drawing animation.
        elapsedRef.current = 0;
        progress = 0;
      } else if (!reducedMotion) {
        elapsedRef.current += Math.min(delta, 0.1);
        progress = Math.max(
          0,
          Math.min(1, (elapsedRef.current - delay) / 1.25)
        );
      }
    }

    const eased = progress * progress * (3 - 2 * progress);

    // Draw the segment from its first star toward the moving second star.
    const tip = start.map((value, axis) =>
      value + (end[axis] - value) * eased
    );

    line.geometry.setPositions([
      ...start,
      ...tip
    ]);

    // Fade in while drawing. This uses the SAME Line material Drei renders.
    if (line.material && !Array.isArray(line.material)) {
      line.material.opacity = targetOpacity * eased;
    }
  });

  if (!startStar || !endStar) return null;

  return (
    <Line
      ref={lineRef}
      points={[
        getStarPosition(startStar, 0),
        getStarPosition(endStar, 0)
      ]}
      color={
        routeActive
          ? isOnRoute ? "#facc15" : "#67e8f9"
          : isConnected
            ? "#fde68a"
            : connection.color ?? "#67e8f9"
      }
      lineWidth={
        routeActive && isOnRoute ? 4 : isConnected ? 3 : 2
      }
      transparent
      opacity={animate ? 0 : targetOpacity}
      frustumCulled={false}
    />
  );
}

const EMPTY_ROUTE_EDGES = new Set();

export default function Constellations({
  selectedStar = null,
  stars,
  connections,
  routeEdges = EMPTY_ROUTE_EDGES,
  routeActive = false,
  animate = false,
  reveal = true,
  entranceDelay = 2
}) {
  return connections.map((connection, index) => (
    <MovingConnection
      key={edgeKey(connection.from, connection.to)}
      connection={connection}
      selectedStar={selectedStar}
      stars={stars}
      routeEdges={routeEdges}
      routeActive={routeActive}
      animate={animate}
      reveal={reveal}
      delay={entranceDelay + index * 0.75}
    />
  ));
}
