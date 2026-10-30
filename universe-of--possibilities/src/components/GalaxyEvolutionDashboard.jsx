
import { useEffect, useState } from "react";
import GalaxyGrowthChart from "./GalaxyGrowthChart.jsx";
import "./GalaxyEvolutionDashboard.css";
import GalaxyMilestoneTimeline from "./GalaxyMilestoneTimeline.jsx";

const API = "http://127.0.0.1:8000";

function calculateMetrics(galaxy) {
  const stars = galaxy.stars ?? [];
  const connections = galaxy.connections ?? [];

  const totalProgress = stars.reduce(
    (total, star) => total + (Number(star.progress) || 0),
    0
  );

  return {
    dreams: stars.length,
    connections: connections.length,
    completed: stars.filter(
      (star) => Number(star.progress) >= 100
    ).length,
    averageProgress: stars.length
      ? Math.round(totalProgress / stars.length)
      : 0
  };
}

export default function GalaxyEvolutionDashboard({ onClose, onViewSnapshot }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function getJSON(url) {
      const response = await fetch(url, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    }

    async function loadEvolution() {
      try {
        const history = await getJSON(`${API}/galaxy/history`);

        if (!Array.isArray(history) || history.length === 0) {
          throw new Error("No galaxy history found.");
        }

        // The API returns newest snapshots first.
        const latest = history[0];

        const baseline =
          history.find((item) => item.action === "baseline") ??
          history[history.length - 1];

        const [firstSnapshot, latestSnapshot] = await Promise.all([
          getJSON(`${API}/galaxy/history/${baseline.id}`),
          getJSON(`${API}/galaxy/history/${latest.id}`)
        ]);

        if (controller.signal.aborted) return;

        setReport({
          first: calculateMetrics(firstSnapshot.galaxy),
          latest: calculateMetrics(latestSnapshot.galaxy),
          snapshotCount: history.length,
          firstDate: baseline.created_at,
          latestDate: latest.created_at
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadEvolution();

    return () => controller.abort();
  }, []);

  const metrics = [
    { key: "dreams", label: "Total Dreams", unit: "" },
    { key: "connections", label: "Connections", unit: "" },
    { key: "completed", label: "Completed Dreams", unit: "" },
    { key: "averageProgress", label: "Average Progress", unit: "%" }
  ];

  return (
    <div className="evolution-backdrop">
      <section
        className="evolution-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Galaxy Evolution Dashboard"
      >
        <header className="evolution-header">
          <div>
            <h2>🌌 Galaxy Evolution</h2>
            <p>Discover how your universe has grown.</p>
          </div>

          <button type="button" onClick={onClose}>
            Close ✕
          </button>
        </header>

        {loading && <p>Analyzing your universe...</p>}
        {error && <p role="alert">Error: {error}</p>}

        {report && (
          <>
            <div className="evolution-intro">
              <strong>
                {report.snapshotCount} historical snapshots
              </strong>

              <p>
                Comparing your first saved galaxy with
                your latest historical snapshot.
              </p>
            </div>

            <div className="evolution-grid">
              {metrics.map(({ key, label, unit }) => {
                const current = report.latest[key];
                const original = report.first[key];
                const difference = current - original;

                return (
                  <article className="evolution-card" key={key}>
                    <h3>{label}</h3>

                    <div className="evolution-value">
                      {current}{unit}
                    </div>

                    <p>
                      Originally: {original}{unit}
                    </p>

                    <strong>
                      {difference > 0 ? "+" : ""}
                      {difference}
                      {unit === "%" ? " pts" : ""}
                      {" "}since baseline
                    </strong>
                  </article>
                );
              })}
            </div>
                <GalaxyGrowthChart />
                <GalaxyMilestoneTimeline
  onViewSnapshot={onViewSnapshot}
/>
            <p className="evolution-note">
              These results use saved historical snapshots,
              not unsaved changes in your live galaxy.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
