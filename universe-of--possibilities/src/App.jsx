

import { useState, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";import { calculateUniverseStats } from "./utils/analytics.js";
import { recommendConnections } from "./utils/recommendations.js";
import DreamStar from "./components/DreamStar.jsx";
import CameraNavigator from "./components/CameraNavigator.jsx";
import Constellations from "./components/Constellations.jsx";
import CreateStarForm from "./components/CreateStarForm.jsx";
import StarPanel from "./components/StarPanel.jsx";
import ConstellationEditor from "./components/ConstellationEditor.jsx";
import RecommendationPanel from "./components/RecommendationPanel.jsx";
import UniverseTimeline from "./components/UniverseTimeline.jsx";
import UniverseAnalytics from "./components/UniverseAnalytics.jsx";
import UniverseReplay from "./components/UniverseReplay.jsx";
import {
  edgeKey,
  findShortestPath
} from "./utils/graph.js";

const dreams = [
  {
    id: 1,
    name: "Learn Three.js",
    category: "Skills",
    position: [-2, 1, 0],
    color: "#38bdf8",
    size: 0.4,
  },
  {
    id: 2,
    name: "Build ANTE",
    category: "Projects",
    position: [2, 1.5, -1],
    color: "#a855f7",
    size: 0.6,
    orbit: {
      radius: 0.8,
      speed: 0.3
    },
  },
  {
    id: 3,
    name: "Learn Quantum Computing",
    category: "Skills",
    position: [0, -1.5, 1],
    color: "#facc15",
    size: 0.35,

    orbit: {
      radius: 0.8,
      speed: 0.7
    },
  },
  {
    id: 4,
    name: "Invent Something New",
    category: "Experiments",
    position: [-3, -1.5, -2],
    color: "#34d399",
    size: 0.5,
  },
  {
    id: 5,
    name: "Explore the Universe",
    category: "Dreams",
    position: [3, -1, 0],
    color: "#fb7185",
    size: 0.45,
  },
  {
  id: 6,
  name: "Make a Difference in the World",
  category: "Dreams",
  position: [3, 3, 0],
  color: "#b8549a",
  size: 0.76,

  description:
    "Build meaningful projects that positively impact people's lives.",

  progress: 0
},
];



const connections = [
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 5 },
  { from: 6, to: 2 },
  { from: 6, to: 1 }
];


function App() {
  // Load saved stars, or use our original data
  const [starData, setStarData] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("universe-stars-v1")
      );

      return Array.isArray(saved) && saved.length > 0
        ? saved
        : dreams;
    } catch {
      return dreams;
    }
  });

  // Track the selected star by its ID
  const [selectedStarId, setSelectedStarId] = useState(null);
  const [isCreatingStar, setIsCreatingStar] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [showRecommendations, setShowRecommendations] =
  useState(false);

const [connectionData, setConnectionData] = useState(() => {
  try {
    const saved = JSON.parse(
      localStorage.getItem("universe-connections-v1")
    );

    return Array.isArray(saved) ? saved : connections;
  } catch {
    return connections;
  }
});


const [snapshots, setSnapshots] = useState(() => {
  try {
    const saved = JSON.parse(
      localStorage.getItem("universe-snapshots-v1")
    );

    if (Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
  } catch {
    // Start with a new history
  }

  // Capture the current universe as our baseline
  return [{
    id: `baseline-${Date.now()}`,
    timestamp: new Date().toISOString(),
    stars: structuredClone(starData),
    connections: structuredClone(connectionData)
  }];
});

const [showReplay, setShowReplay] = useState(false);


const [isEditingConnections, setIsEditingConnections] =
  useState(false);

  const selectedStar =
    starData.find((star) => star.id === selectedStarId)
    ?? null;
  
  
useEffect(() => {
  try {
    localStorage.setItem(
      "universe-connections-v1",
      JSON.stringify(connectionData)
    );
  } catch (error) {
    console.warn("Could not save connections:", error);
  }
}, [connectionData]);



useEffect(() => {
  try {
    localStorage.setItem(
      "universe-snapshots-v1",
      JSON.stringify(snapshots)
    );
  } catch (error) {
    console.warn("Could not save snapshots:", error);
  }
}, [snapshots]);


const [timelineEvents, setTimelineEvents] = useState(() => {
  try {
    const saved = JSON.parse(
      localStorage.getItem("universe-timeline-v1")
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
});

const [showTimeline, setShowTimeline] = useState(false);


  // Save changes whenever our star data changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "universe-stars-v1",
        JSON.stringify(starData)
      );
    } catch (error) {
      console.warn("Could not save stars:", error);
    }
  }, [starData]);

  
useEffect(() => {
  try {
    localStorage.setItem(
      "universe-timeline-v1",
      JSON.stringify(timelineEvents)
    );
  } catch (error) {
    console.warn("Could not save timeline:", error);
  }
}, [timelineEvents]);


function recordEvent(type, title, details = "") {
  const newEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    title,
    details,
    timestamp: new Date().toISOString()
  };

  setTimelineEvents((currentEvents) => [
    newEvent,
    ...currentEvents
  ]);
}

function recordSnapshot(nextStars, nextConnections) {
  const snapshot = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    stars: structuredClone(nextStars),
    connections: structuredClone(nextConnections)
  };

  setSnapshots((current) => {
    const latest = current[current.length - 1];

    // Avoid saving identical snapshots
    if (
      JSON.stringify(latest?.stars) ===
        JSON.stringify(nextStars) &&
      JSON.stringify(latest?.connections) ===
        JSON.stringify(nextConnections)
    ) {
      return current;
    }

    return [...current, snapshot];
  });
}


  // Update the selected star

function updateSelectedStar(changes) {
  if (!selectedStar) return;

  // Find which fields were actually changed
  const changedFields = Object.keys(changes).filter(
    (field) => selectedStar[field] !== changes[field]
  );

  if (changedFields.length === 0) return;

  
const updatedStars = starData.map((star) =>
  star.id === selectedStar.id
    ? { ...star, ...changes }
    : star
);

setStarData(updatedStars);

recordSnapshot(updatedStars, connectionData);


  recordEvent(
    "star-updated",
    `Updated ${changes.name ?? selectedStar.name}`,
    `Changed fields: ${changedFields.join(", ")}`
  );
}


  
const [showAnalytics, setShowAnalytics] =
  useState(false);

const universeStats = useMemo(
  () => calculateUniverseStats(
    starData,
    connectionData
  ),
  [starData, connectionData]
);


const recommendations = useMemo(
  () => recommendConnections(
    starData,
    connectionData
  ),
  [starData, connectionData]
);


  // Determine which stars are connected
  const connectedIds = selectedStar
    ? new Set([
        selectedStar.id,
        ...connections
          .filter(
            (connection) =>
              connection.from === selectedStar.id ||
              connection.to === selectedStar.id
          )
          .map((connection) =>
            connection.from === selectedStar.id
              ? connection.to
              : connection.from
          )
      ])
    : null;
    
function addStar(details) {
  // Find the next available star ID
  const nextId =
    Math.max(0, ...starData.map((star) => star.id)) + 1;

  // Calculate a position for the new star
  const angle = nextId * 2.39996;
  const radius = 2.4 + (nextId % 3) * 0.45;

  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);
  const z = ((nextId % 5) - 2) * 0.4;

  // Create the new star object
  const newStar = {
    ...details,
    id: nextId,
    position: [x, y, z],
    size: 0.4,
  };

  // Add our star to the existing array

const updatedStars = [...starData, newStar];

setStarData(updatedStars);

recordSnapshot(updatedStars, connectionData);

  // Select our newly created star
  setSelectedStarId(nextId);

  // Close the creation form
  setIsCreatingStar(false);
  recordEvent("star-created", "New Star Discovered",newStar.name);
}


function addConnection(newConnection) {
  const { from, to } = newConnection;

  const startStar = starData.find(
    (star) => star.id === from
  );

  const endStar = starData.find(
    (star) => star.id === to
  );

  if (!startStar || !endStar || from === to) {
    return;
  }

  const duplicate = connectionData.some(
    (connection) =>
      edgeKey(connection.from, connection.to) ===
      edgeKey(from, to)
  );

  if (duplicate) return;


const updatedConnections = [
  ...connectionData,
  newConnection
];

// Update our constellation network
setConnectionData(updatedConnections);

// Save a historical snapshot
recordSnapshot(starData, updatedConnections);


  recordEvent(
    "connection-created",
    "Connection Established",
    `${startStar.name} ↔ ${endStar.name}`
  );
}



function removeConnection(from, to) {
  const key = edgeKey(from, to);

  const exists = connectionData.some(
    (connection) =>
      edgeKey(connection.from, connection.to) === key
  );

  if (!exists) return;


const updatedConnections = connectionData.filter(
  (connection) =>
    edgeKey(connection.from, connection.to) !== key
);

// Update the constellation network
setConnectionData(updatedConnections);

// Save the updated universe in our Time Machine
recordSnapshot(starData, updatedConnections); 

  const first = starData.find(
    (star) => star.id === from
  );

  const second = starData.find(
    (star) => star.id === to
  );

  recordEvent(
    "connection-removed",
    "Connection Removed",
    `${first?.name ?? from} ↔ ${second?.name ?? to}`
  );
}


const routeIds =
  showRoute && selectedStar
    ? findShortestPath(
        selectedStar.id,
        6,
        connectionData
      )
    : [];

const routeSet = new Set(routeIds);

const routeEdges = new Set(
  routeIds.slice(1).map((id, index) =>
    edgeKey(routeIds[index], id)
  )
);

const routeActive = showRoute && routeIds.length > 0;

  return (
    <div className="universe">
      <div className="header">
        <h1>Universe of Possibilities</h1>
        <p>Keep Moving Forward 🚀</p>

        {selectedStar && (
          <p>
            Discovered: {selectedStar.name}
            {" — "}
            {selectedStar.category}
          </p>
        )}
      </div>

      <Canvas
        camera={{ position: [0, 0, 9] }}
        onPointerMissed={() => setSelectedStarId(null)}
      >
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
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        <CameraNavigator selectedStar={selectedStar} />


<Constellations
  selectedStar={selectedStar}
  stars={starData}
  connections={connectionData}
  routeEdges={routeEdges}
  routeActive={routeActive}
/>


        
{starData.map((star) => (
  <DreamStar
    key={star.id}
    star={star}
    onSelect={(clickedStar) => {
      setSelectedStarId(clickedStar.id);
      setShowRoute(false);
    }}
    isSelected={selectedStarId === star.id}
    isOnRoute={
      routeActive && routeSet.has(star.id)
    }
    isDimmed={
      routeActive
        ? !routeSet.has(star.id)
        : connectedIds !== null &&
          !connectedIds.has(star.id)
    }
  />
))}

      </Canvas>
      
<button
  type="button"
  className="timeline-trigger"
  onClick={() => setShowTimeline(true)}
>
  🕰️ Time Machine
</button>


<button
  type="button"
  className="replay-trigger"
  onClick={() => setShowReplay(true)}
>
  🚀 Replay Universe
</button>

{showReplay && (
  <UniverseReplay
    snapshots={snapshots}
    onClose={() => setShowReplay(false)}
  />
)}


{showTimeline && (
  <UniverseTimeline
    events={timelineEvents}
    onClose={() => setShowTimeline(false)}
  />
)}

      
<button
  type="button"
  className="recommendation-trigger"
  onClick={() => setShowRecommendations(true)}
>
  🧠 Discover Connections
</button>

{showRecommendations && (
  <RecommendationPanel
    recommendations={recommendations}
    stars={starData}
    onConnect={addConnection}
    onClose={() => setShowRecommendations(false)}
  />
)}

      
<button
  type="button"
  className="analytics-trigger"
  onClick={() =>
    setShowAnalytics((current) => !current)
  }
>
  📊 Galaxy Analytics
</button>

{showAnalytics && (
  <UniverseAnalytics
    stats={universeStats}
    onClose={() => setShowAnalytics(false)}
  />
)}

      
{selectedStar && (
  <div className="route-panel">
    <button
      type="button"
      onClick={() => setShowRoute(true)}
    >
      ✨ Find Path to North Star
    </button>

    {showRoute && (
      <p>
        {routeIds.length > 0
          ? `Path: ${routeIds
              .map((id) =>
                starData.find((star) => star.id === id)
                  ?.name ?? `Star ${id}`
              )
              .join(" → ")}`
          : "No path found. Try creating a new connection!"}
      </p>
    )}
  </div>
)}

      
<button
  type="button"
  className="create-star-trigger"
  onClick={() => {
    setSelectedStarId(null);
    setIsCreatingStar(true);
  }}
>
  + Create Star
</button>

<button
  type="button"
  className="constellation-trigger"
  onClick={() => setIsEditingConnections(true)}
>
  ✨ Build Constellation
</button>

{isCreatingStar && (
  <CreateStarForm
    onCreate={addStar}
    onCancel={() => setIsCreatingStar(false)}
    
  />
  
)}


{isEditingConnections && (
  <ConstellationEditor
    stars={starData}
    connections={connectionData}
    onAdd={addConnection}
    onRemove={removeConnection}
    onClose={() => setIsEditingConnections(false)}
  />
)}

      {selectedStar && (
        <StarPanel
          key={selectedStar.id}
          star={selectedStar}
          onClose={() => setSelectedStarId(null)}
          onSave={updateSelectedStar}
        />
      )}
    </div>
  );
}


export default App;
