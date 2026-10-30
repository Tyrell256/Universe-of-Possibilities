
import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";

import DreamStar from "./DreamStar.jsx";
import Constellations from "./Constellations.jsx";

const API = "http://127.0.0.1:8000";



function HistoricalStarArrival({ children, delay = 0, reveal = true }) {
  const groupRef = useRef(null);
  const elapsedRef = useRef(0);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Respect accessibility settings
    if (reducedMotion) {
      groupRef.current.visible = true;
      groupRef.current.scale.setScalar(1);
      return;
    }

    // Do not animate while the scene is covered.
    // This prevents stars from finishing their animation behind the veil.
    if (!reveal) {
      elapsedRef.current = 0;
      groupRef.current.visible = false;
      groupRef.current.scale.setScalar(0.01);
      return;
    }

    elapsedRef.current += Math.min(delta, 0.1);

    // Wait for this particular star's entrance
    const elapsed = elapsedRef.current - delay;

    // Each star takes 0.9 seconds to grow into view.
    const progress = Math.min(
      1,
      Math.max(0, elapsed / 0.9)
    );

    // Smooth easing
    const eased = 1 - Math.pow(1 - progress, 3);

    // Hide the star until its animation starts
    groupRef.current.visible = progress > 0;

    // Grow the star toward its normal size
    const scale = 0.01 + 0.99 * eased;

    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef} visible={false}>
      {children}
    </group>
  );
}


export default function DatabaseTimeMachine({ onClose, initialSnapshotId = null }) {
  const [history, setHistory] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedStarId, setSelectedStarId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [error, setError] = useState("");
  const [isCovered, setIsCovered] = useState(false);
  const autoOpenedSnapshotRef = useRef(null);

  // Load the list of historical events
  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        const response = await fetch(`${API}/galaxy/history`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid history response");
        }

        if (active) setHistory(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoadingHistory(false);
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, []);

  // Retrieve one historical galaxy
  


const selectSnapshot = useCallback(async (id) => {
  if (loadingSnapshot) return;

  setLoadingSnapshot(true);
  setSelectedStarId(null);
  setError("");

  // Begin covering the old galaxy.
  setIsCovered(true);

  // Give the dark overlay time to fade in.
  const coverAnimation = new Promise((resolve) => {
    setTimeout(resolve, 500);
  });

  try {
    // Fetch the new snapshot WITHOUT removing
    // the currently displayed galaxy.
    const response = await fetch(
      `${API}/galaxy/history/${id}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (
      !Array.isArray(data.galaxy?.stars) ||
      !Array.isArray(data.galaxy?.connections)
    ) {
      throw new Error("Invalid snapshot data");
    }

    // Wait until the old galaxy is covered.
    await coverAnimation;

    // Swap the historical galaxy while hidden.
    setSnapshot(data);
    setSelectedId(id);

    // Allow React and Three.js to process
    // the new snapshot before revealing it.
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    // Reveal the new galaxy smoothly.
    setIsCovered(false);

  } catch (err) {
    setIsPlaying(false);
    setError(err.message);

    // Uncover the old galaxy if something fails.
    setIsCovered(false);

  } finally {
    setLoadingSnapshot(false);
  }
}, [loadingSnapshot]);

  // Mission 24, Part 5: open a milestone's exact saved snapshot once.
  // Normal Time Machine launches (initialSnapshotId=null) still show the list.
  useEffect(() => {
    if (initialSnapshotId == null || loadingHistory) return;

    const id = Number(initialSnapshotId);
    if (!Number.isInteger(id) || id < 1) {
      setError("Invalid milestone snapshot ID.");
      return;
    }
    if (autoOpenedSnapshotRef.current === id) return;

    if (!history.some((item) => Number(item.id) === id)) {
      setError(`Snapshot #${id} was not found in history.`);
      return;
    }

    autoOpenedSnapshotRef.current = id;
    void selectSnapshot(id);
  }, [initialSnapshotId, loadingHistory, history, selectSnapshot]);




  const selectedStar = snapshot?.galaxy.stars.find(
    (star) => star.id === selectedStarId
  ) ?? null;

const currentIndex = history.findIndex(
  (item) => item.id === selectedId
);


useEffect(() => {
  if (
    !isPlaying ||
    loadingSnapshot ||
    selectedId === null
  ) {
    return;
  }

  const index = history.findIndex(
    (item) => item.id === selectedId
  );

  // We are already at the newest snapshot
  if (index <= 0) return;

  const timer = setTimeout(() => {
    // History is ordered newest -> oldest,
    // so subtracting 1 moves us toward the present.
    const nextSnapshot = history[index - 1];

    selectSnapshot(nextSnapshot.id);

    // Stop when we reach the newest snapshot
    if (index === 1) {
      setIsPlaying(false);
    }
  }, Math.max(
    9000,
    1800 +
      Math.max(0, (snapshot?.galaxy.stars.length ?? 0) - 1) * 250 +
      900 +
      Math.max(0, (snapshot?.galaxy.connections.length ?? 0) - 1) * 750 +
      1250
  ));

  return () => clearTimeout(timer);
}, [
  isPlaying,
  loadingSnapshot,
  selectedId,
  history,
  snapshot,
  selectSnapshot
]);


// Our history is ordered newest to oldest
const canGoPrevious =
  currentIndex >= 0 &&
  currentIndex < history.length - 1;

const canGoNext = currentIndex > 0;

function goPrevious() {
  if (!canGoPrevious || loadingSnapshot) return;

  // Move toward an older snapshot
  const olderSnapshot = history[currentIndex + 1];

  setIsPlaying(false);
  selectSnapshot(olderSnapshot.id);
}

function goNext() {
  if (!canGoNext || loadingSnapshot) return;

  // Move toward a newer snapshot
  const newerSnapshot = history[currentIndex - 1];

  setIsPlaying(false);
  selectSnapshot(newerSnapshot.id);
}


function startPlayback() {
  if (history.length < 2 || loadingSnapshot) return;

  // If no snapshot is selected, or we're at the
  // newest snapshot, start again from the oldest.
  if (currentIndex <= 0) {
    const oldestSnapshot = history[history.length - 1];
    selectSnapshot(oldestSnapshot.id);
  }

  setIsPlaying(true);
}

function pausePlayback() {
  setIsPlaying(false);
}

function restartPlayback() {
  if (history.length === 0 || loadingSnapshot) return;

  setIsPlaying(false);

  const oldestSnapshot = history[history.length - 1];
  selectSnapshot(oldestSnapshot.id);
}



  return (
    <div className="db-time-machine-backdrop">
      <section className="db-time-machine-modal">
        <header className="db-time-machine-header">
          <div>
            <h2>⏳ Galaxy Time Machine</h2>
            <p>Explore the history of your dreams</p>
          </div>

          <button type="button" onClick={onClose}>
            Close ✕
          </button>
        </header>

        <div className="db-time-machine-layout">
          <aside className="db-time-machine-list">
            <h3>Historical Events</h3>

            {loadingHistory && <p>Loading history...</p>}

            {!loadingHistory && history.length === 0 && (
              <p>No snapshots available.</p>
            )}

            {history.map((item) => (
              <button
                key={item.id}
                type="button"
                className="db-time-machine-event"
                aria-pressed={selectedId === item.id}
                disabled={loadingSnapshot}
                onClick={() => {
  setIsPlaying(false);
  selectSnapshot(item.id);
}}
              >
                <strong>Snapshot #{item.id}</strong>
                <span>{item.action}</span>
                <small>{item.created_at}</small>
              </button>
            ))}
          </aside>

          <div className="db-time-machine-preview">
            
{/* Time Machine Playback Controls */}
<div className="db-time-machine-controls">

  <button
    type="button"
    onClick={goPrevious}
    disabled={!canGoPrevious || loadingSnapshot}
  >
    ← Previous
  </button>

  <span>
    {selectedId !== null
      ? `Snapshot #${selectedId}`
      : "Select a snapshot"}
  </span>

  <button
    type="button"
    onClick={goNext}
    disabled={!canGoNext || loadingSnapshot}
  >
    Next →
  </button>

  <button
    type="button"
    onClick={isPlaying ? pausePlayback : startPlayback}
    disabled={
      history.length < 2 ||
      (loadingSnapshot && !isPlaying)
    }
  >
    {isPlaying ? "⏸ Pause" : "▶ Play"}
  </button>
  <button
    type="button"
    onClick={restartPlayback}
    disabled={
      history.length === 0 ||
      loadingSnapshot
    }
  >
    ↺ Restart
  </button>

</div>

            {error && (
              <p className="db-time-machine-message" role="alert">
                Error: {error}
              </p>
            )}

            {loadingSnapshot && (
              <p className="db-time-machine-message">
                Traveling through time...
              </p>
            )}

            {!snapshot && !loadingSnapshot && !error && (
              <p className="db-time-machine-message">
                Select a snapshot to explore the past.
              </p>
            )}

            {snapshot && (
              <>
                <div className="db-time-machine-info">
                  <strong>Snapshot #{snapshot.id}</strong>

                  <span>{snapshot.action}</span>

                  <span>
                    {snapshot.galaxy.stars.length} stars ·{" "}
                    {snapshot.galaxy.connections.length} connections
                  </span>

                  {selectedStar && (
                    <span>Selected: {selectedStar.name}</span>
                  )}
                </div>

                
<div
  className="db-time-machine-canvas"
  style={{ position: "relative" }}
>

                  <Canvas
                    camera={{
                      position: [0, 3, 14],
                      fov: 55
                    }}
                  >
                    <color
                      attach="background"
                      args={["#050316"]}
                    />

                    <ambientLight intensity={0.7} />

                    <pointLight
                      position={[5, 5, 5]}
                      intensity={2}
                    />

                    <Stars
                      radius={60}
                      depth={50}
                      count={1500}
                      factor={4}
                      fade
                    />

                   
{snapshot.galaxy.stars.map((star, index) => (
  <HistoricalStarArrival
    key={`${snapshot.id}-${star.id}`}
    delay={index * 0.25}
    reveal={!isCovered}
  >
    <DreamStar
      star={star}
      onSelect={(clickedStar) =>
        setSelectedStarId(clickedStar.id)
      }
      isSelected={selectedStarId === star.id}
      isDimmed={false}
    />
  </HistoricalStarArrival>
))}


                    

<Constellations
  key={`constellations-${snapshot.id}`}
  stars={snapshot.galaxy.stars}
  connections={snapshot.galaxy.connections}
  selectedStar={selectedStar}
  animate
  reveal={!isCovered}
  entranceDelay={
    Math.max(0, snapshot.galaxy.stars.length - 1) * 0.25 + 1.1
  }
/>



                    <OrbitControls enableDamping />
                  </Canvas>
                  

<div
  className="db-time-machine-transition"
  aria-hidden="true"
  style={{
    position: "absolute",
    inset: 0,
    zIndex: 9999,
    backgroundColor: "#050316",
    opacity: isCovered ? 1 : 0,
    transition: "opacity 450ms ease-in-out",
    pointerEvents: "none"
  }}
/>


                  
 
                </div>
              </>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
