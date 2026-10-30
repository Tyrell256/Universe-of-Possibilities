
import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import DatabaseCreateStarForm from "./DatabaseCreateStarForm.jsx";
import DreamStar from "./DreamStar.jsx";
import Constellations from "./Constellations.jsx";
import DatabaseConnectionForm from "./DatabaseConnectionForm.jsx";
import DatabaseDeleteConnectionForm from "./DatabaseDeleteConnectionForm.jsx";
import DatabaseAnalyticsPanel from "./DatabaseAnalyticsPanel.jsx";
import DatabaseRecommendationsPanel from "./DatabaseRecommendationsPanel.jsx";
import DatabaseTimeMachine from "./DatabaseTimeMachine.jsx";
import GalaxyEvolutionDashboard from "./GalaxyEvolutionDashboard.jsx";
export default function DatabaseGalaxyPreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [galaxy, setGalaxy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStarId, setSelectedStarId] = useState(null);
  const [showEvolution, setShowEvolution] = useState(false);
  const [isCreatingStar, setIsCreatingStar] = useState(false);
  const [draftProgress, setDraftProgress] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftDifficulty, setDraftDifficulty] = useState("Not set");
  const [draftColor, setDraftColor] = useState("#38bdf8");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isRemovingConnection, setIsRemovingConnection] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showTimeMachine, setShowTimeMachine] = useState(false);
  const [initialTimeMachineSnapshotId,setInitialTimeMachineSnapshotId] = useState(null);
  async function openPreview() {
    setIsOpen(true);
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/galaxy"
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (
        !Array.isArray(data.stars) ||
        !Array.isArray(data.connections)
      ) {
        throw new Error("Invalid galaxy data");
      }

      setGalaxy(data);
      setSelectedStarId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedStar = galaxy?.stars.find(
    (star) => star.id === selectedStarId
  ) ?? null;
  

async function saveStarChanges() {
  if (!selectedStar || saving) return;

  const name = draftName.trim();
  const progress = Number(draftProgress);

  // Validate the star's information
  if (!name) {
    setSaveError("Star name cannot be empty.");
    return;
  }

  if (
    draftProgress === "" ||
    !Number.isInteger(progress) ||
    progress < 0 ||
    progress > 100
  ) {
    setSaveError("Progress must be between 0 and 100.");
    return;
  }

  setSaving(true);
  setSaveError("");

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/stars/${selectedStar.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          category: selectedStar.category,
          progress,
          description: draftDescription.trim(),
          difficulty: draftDifficulty,

          // Preserve the existing 3D properties
          color: draftColor,
          size: selectedStar.size,
          position: selectedStar.position,
          orbit: selectedStar.orbit
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const updatedStar = await response.json();

    // Update the displayed galaxy after a successful save
    setGalaxy((current) => ({
      ...current,
      stars: current.stars.map((star) =>
        star.id === updatedStar.id
          ? updatedStar
          : star
      )
    }));

  } catch (error) {
    setSaveError(error.message);
  } finally {
    setSaving(false);
  }
}
function openMilestoneInTimeMachine(snapshotId) {
  setShowEvolution(false);
  setInitialTimeMachineSnapshotId(snapshotId);
  setShowTimeMachine(true);
}

  return (
    <>
      <button
        type="button"
        className="db-preview-open"
        onClick={openPreview}
      >
        🌌 Open Database Galaxy
      </button>

      {isOpen && (
        <div className="db-preview-overlay">
          

{showTimeMachine && (
  <DatabaseTimeMachine
    initialSnapshotId={initialTimeMachineSnapshotId}
    onClose={() => {
      setShowTimeMachine(false);
      setInitialTimeMachineSnapshotId(null);
    }}
  />
)}

{showEvolution && (
  <GalaxyEvolutionDashboard
    onClose={() => setShowEvolution(false)}
    onViewSnapshot={openMilestoneInTimeMachine}
  />
)}


          
{showRecommendations && galaxy && (
  
<DatabaseRecommendationsPanel
  stars={galaxy.stars}
  connections={galaxy.connections}
  onClose={() => setShowRecommendations(false)}
  onAccepted={(newConnection) => {
    setGalaxy((current) => ({
      ...current,
      connections: [
        ...current.connections,
        newConnection
      ]
    }));
  }}
/>
)}

          
{showAnalytics && galaxy && (
  <DatabaseAnalyticsPanel
    stars={galaxy.stars}
    connections={galaxy.connections}
    onClose={() => setShowAnalytics(false)}
  />
)}

          
{isRemovingConnection && galaxy && (
  <DatabaseDeleteConnectionForm
    stars={galaxy.stars}
    connections={galaxy.connections}
    onCancel={() =>
      setIsRemovingConnection(false)
    }
    onRemoved={({ from, to }) => {
      setGalaxy((current) => ({
        ...current,
        connections: current.connections.filter(
          (link) =>
            !(
              (link.from === from && link.to === to) ||
              (link.from === to && link.to === from)
            )
        )
      }));

      setIsRemovingConnection(false);
    }}
  />
)}

          
{isConnecting && galaxy && (
  <DatabaseConnectionForm
    stars={galaxy.stars}
    connections={galaxy.connections}
    onCancel={() => setIsConnecting(false)}
    onCreated={(newConnection) => {
      setGalaxy((current) => ({
        ...current,
        connections: [
          ...current.connections,
          newConnection
        ]
      }));

      setIsConnecting(false);
    }}
  />
)}

{isCreatingStar && galaxy && (
  <DatabaseCreateStarForm
    starCount={galaxy.stars.length}
    onCancel={() => setIsCreatingStar(false)}
    onCreated={(newStar) => {
      setGalaxy((current) => ({
        ...current,
        stars: [...current.stars, newStar]
      }));

      setSelectedStarId(null);
      setIsCreatingStar(false);
    }}
  />
)}

          <div className="db-preview-header">
            <div>
              <h2>Universe of Possibilities</h2>
              <p>
                SQLite-powered galaxy
                {galaxy && !loading && (
                  <>
                    {" — "}
                    {galaxy.stars.length} stars
                    {" · "}
                    {galaxy.connections.length} connections
                  </>
                )}
              </p>
              {selectedStar && !loading && (
                <p>Selected: {selectedStar.name}</p>
              )}
              
{selectedStar && !loading && (
  <div className="db-preview-editor">
    
<label htmlFor="db-name">
  Star Name
</label>

<input
  id="db-name"
  type="text"
  value={draftName}
  onChange={(event) =>
    setDraftName(event.target.value)
  }
/>

<label htmlFor="db-description">
  Description
</label>

<textarea
  id="db-description"
  value={draftDescription}
  onChange={(event) =>
    setDraftDescription(event.target.value)
  }
  rows={2}
/>

<label htmlFor="db-difficulty">
  Difficulty
</label>


<label htmlFor="db-color">
  Star Color
</label>

<input
  id="db-color"
  type="color"
  value={draftColor}
  onChange={(event) =>
    setDraftColor(event.target.value)
  }
/>

<span className="db-color-value">
  {draftColor}
</span>


<input
  id="db-difficulty"
  type="text"
  value={draftDifficulty}
  onChange={(event) =>
    setDraftDifficulty(event.target.value)
  }
/>

    <label htmlFor="db-progress">
      Progress (%)
    </label>

    <input
      id="db-progress"
      type="number"
      min="0"
      max="100"
      step="1"
      value={draftProgress}
      onChange={(event) =>
        setDraftProgress(event.target.value)
      }
    />

    <button
      type="button"
onClick={saveStarChanges}     
disabled={saving}
    >
      {saving ? "Saving..." : "Save to SQLite"}
    </button>

    {saveError && (
      <p role="alert">{saveError}</p>
    )}
  </div>
)}

            </div>
            <button
  type="button"
  onClick={() => setIsCreatingStar(true)}
  disabled={loading || !galaxy}
>
  + Create Star
</button>
<button
  type="button"
  onClick={() => setIsConnecting(true)}
  disabled={loading || !galaxy || isCreatingStar}
>
  ✨ Connect Stars
</button>

<button
  type="button"
  onClick={() => setIsRemovingConnection(true)}
  disabled={
    loading ||
    !galaxy ||
    galaxy.connections.length === 0 ||
    isCreatingStar ||
    isConnecting
  }
>
  Remove Connection
</button>

<button
  type="button"
  onClick={() => setShowAnalytics(true)}
  disabled={loading || !galaxy}
>
  📊 Galaxy Analytics
</button>


<button
  type="button"
  onClick={() => setShowRecommendations(true)}
  disabled={loading || !galaxy}
>
  ✨ Discover Connections
</button>


<button
  type="button"
  onClick={() => {
  setInitialTimeMachineSnapshotId(null);
  setShowTimeMachine(true);
}}
  disabled={loading || !galaxy}
>
  ⏳ Database Time Machine
</button>

<button
  type="button"
  onClick={() => setShowEvolution(true)}
>
  📊 Galaxy Evolution
</button>


            <button
              type="button"
              onClick={() => setIsOpen(false)}
            >
              Close Preview ✕
            </button>
          </div>

          {loading && (
            <p className="db-preview-status">
              Contacting Python...
            </p>
          )}

          {!loading && error && (
            <p className="db-preview-status">
              Error: {error}
            </p>
          )}

          {!loading && !error && galaxy && (
            <div className="db-preview-canvas">
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

                {galaxy.stars.map((star) => (
                  <DreamStar
                    key={star.id}
                    star={star}
                    
                    
                      onSelect={(clickedStar) => {
                        setSelectedStarId(clickedStar.id);
                        setDraftColor(clickedStar.color ?? "#38bdf8");
                        setDraftProgress(clickedStar.progress);
                        setDraftName(clickedStar.name);
                        setDraftDescription(clickedStar.description ?? "");
                        setDraftDifficulty(clickedStar.difficulty ?? "Not set");

                        setSaveError("");
                      }}


                    isSelected={
                      selectedStarId === star.id
                    }
                    isDimmed={false}
                  />
                ))}

                <Constellations
                  stars={galaxy.stars}
                  connections={galaxy.connections}
                  selectedStar={selectedStar}
                />

                <OrbitControls enableDamping />
              </Canvas>
            </div>
          )}
        </div>
      )}
    </>
  );
}
