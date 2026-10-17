
import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";

import DreamStar from "./DreamStar.jsx";
import Constellations from "./Constellations.jsx";



export default function UniverseReplay({ snapshots, onClose }) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const current = snapshots[index] ?? snapshots[0];
  const lastIndex = snapshots.length - 1;


useEffect(() => {
  // Don't advance when paused or at the end
  if (!isPlaying || index >= lastIndex) {
    return;
  }

  const timer = setTimeout(() => {
    const nextIndex = index + 1;

    // Advance the timeline
    setIndex(nextIndex);

    // Stop when the final snapshot is reached
    if (nextIndex >= lastIndex) {
      setIsPlaying(false);
    }
  }, 1200);

  // Clean up the timer
  return () => clearTimeout(timer);
}, [isPlaying, index, lastIndex]);


  function togglePlayback() {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (index === lastIndex) {
      setIndex(0);
    }

    setIsPlaying(true);
  }

  return (
    <div className="replay-backdrop">
      <section
        className="replay-console"
        role="dialog"
        aria-modal="true"
        aria-label="Universe replay"
      >
        <div className="replay-header">
          <h2>🕰️ Universe Replay</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close replay"
          >
            ×
          </button>
        </div>

        <p>Explore your universe through time.</p>

        <div className="replay-viewport">
          <Canvas camera={{ position: [0, 0, 11] }}>
            <color
              attach="background"
              args={["#050510"]}
            />

            <ambientLight intensity={0.5} />

            <pointLight
              position={[3, 3, 3]}
              intensity={20}
            />

            <Stars
              radius={100}
              depth={50}
              count={1500}
              factor={4}
              fade
            />

            <Constellations
              stars={current.stars}
              connections={current.connections}
              selectedStar={null}
              routeEdges={new Set()}
              routeActive={false}
            />

            {current.stars.map((star) => (
              <DreamStar
                key={star.id}
                star={star}
                onSelect={() => {}}
                isSelected={false}
                isDimmed={false}
              />
            ))}

            <OrbitControls enableDamping />
          </Canvas>
        </div>

        <div className="replay-stats">
          <span>{current.stars.length} Stars</span>
          <span>
            {current.connections.length} Connections
          </span>
        </div>

        <p className="replay-date">
          {new Date(current.timestamp).toLocaleString()}
        </p>

        <label className="replay-slider-label">
          Snapshot {index + 1} of {snapshots.length}

          <input
            type="range"
            min="0"
            max={lastIndex}
            value={index}
            disabled={lastIndex === 0}
            onChange={(event) => {
              setIsPlaying(false);
              setIndex(Number(event.target.value));
            }}
          />
        </label>

        <div className="replay-controls">
          <button
            disabled={index === 0}
            onClick={() => {
              setIsPlaying(false);
              setIndex((i) => i - 1);
            }}
          >
            ◀ Previous
          </button>

          <button
            disabled={lastIndex === 0}
            onClick={togglePlayback}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>

          <button
            disabled={index === lastIndex}
            onClick={() => {
              setIsPlaying(false);
              setIndex((i) => i + 1);
            }}
          >
            Next ▶
          </button>
        </div>
      </section>
    </div>
  );
}