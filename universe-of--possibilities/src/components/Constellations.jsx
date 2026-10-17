
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
  routeActive
}) {
  const lineRef = useRef(null);

  const startStar = stars.find(
    (star) => star.id === connection.from
  );

  const endStar = stars.find(
    (star) => star.id === connection.to
  );

  // Keep constellation lines synchronized
  // with moving stars.
  useFrame((state) => {
    if (
      !lineRef.current ||
      !startStar ||
      !endStar
    ) {
      return;
    }

    const time = state.clock.elapsedTime;

    const start = getStarPosition(startStar, time);
    const end = getStarPosition(endStar, time);

    lineRef.current.geometry.setPositions([
      ...start,
      ...end
    ]);
  });

  // Don't render connections with missing stars.
  if (!startStar || !endStar) {
    return null;
  }

  const isConnected =
    selectedStar &&
    (
      connection.from === selectedStar.id ||
      connection.to === selectedStar.id
    );

  const isOnRoute =
    routeActive &&
    routeEdges.has(
      edgeKey(connection.from, connection.to)
    );

  return (
    <Line
      ref={lineRef}
      points={[
        getStarPosition(startStar, 0),
        getStarPosition(endStar, 0)
      ]}
      color={
        routeActive
          ? isOnRoute
            ? "#facc15"
            : "#67e8f9"
          : isConnected
            ? "#fde68a"
            : connection.color ?? "#67e8f9"
      }
      lineWidth={
        routeActive && isOnRoute
          ? 4
          : isConnected
            ? 3
            : 2
      }
      transparent
      opacity={
        routeActive
          ? isOnRoute
            ? 1
            : 0.06
          : selectedStar
            ? isConnected
              ? 1
              : 0.07
            : 0.6
      }
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
  routeActive = false
}) {
  return connections.map((connection) => (
    <MovingConnection
      key={edgeKey(connection.from, connection.to)}
      connection={connection}
      selectedStar={selectedStar}
      stars={stars}
      routeEdges={routeEdges}
      routeActive={routeActive}
    />
  ));
}
