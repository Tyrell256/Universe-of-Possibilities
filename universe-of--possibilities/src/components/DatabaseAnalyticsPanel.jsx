
import { useMemo } from "react";

import { calculateUniverseStats } from "../utils/analytics.js";

export default function DatabaseAnalyticsPanel({
  stars,
  connections,
  onClose
}) {
  // Reuse our existing graph analytics algorithm
  const stats = useMemo(
    () => calculateUniverseStats(stars, connections),
    [stars, connections]
  );

  return (
    <div className="db-analytics-backdrop">
      <section
        className="db-analytics-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="db-analytics-title"
      >
        <div className="db-analytics-heading">
          <h2 id="db-analytics-title">
            Galaxy Intelligence
          </h2>

          <button type="button" onClick={onClose}>
            Close ✕
          </button>
        </div>

        <p>
          Live statistics from your SQLite-powered
          universe.
        </p>

        <div className="db-analytics-grid">
          <div className="db-analytics-stat">
            <span>Total Dreams</span>
            <strong>{stats.starCount}</strong>
          </div>

          <div className="db-analytics-stat">
            <span>Connections</span>
            <strong>{stats.connectionCount}</strong>
          </div>

          <div className="db-analytics-stat">
            <span>Average Connections</span>
            <strong>
              {Number(stats.averageDegree).toFixed(2)}
            </strong>
          </div>

          <div className="db-analytics-stat">
            <span>Connected Groups</span>
            <strong>{stats.componentCount}</strong>
          </div>

          <div className="db-analytics-stat">
            <span>Isolated Dreams</span>
            <strong>{stats.isolated.length}</strong>
          </div>
        </div>

        <p className="db-analytics-footer">
          Every dream counts. Every connection
          creates new possibilities.
        </p>
      </section>
    </div>
  );
}
