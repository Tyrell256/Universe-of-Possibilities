import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

const METRICS = {
  dreams: {
    label: "Total Dreams",
    suffix: "",
    description: "Number of stars saved in each historical snapshot."
  },
  connections: {
    label: "Connections",
    suffix: "",
    description: "Number of constellation connections in each snapshot."
  },
  completed: {
    label: "Completed Dreams",
    suffix: "",
    description: "Dreams that reached 100% completion."
  },
  averageProgress: {
    label: "Average Progress",
    suffix: "%",
    description: "Average completion percentage across all dreams in each snapshot."
  }
};

export default function GalaxyGrowthChart() {
  const [timeline, setTimeline] = useState([]);
  const [metric, setMetric] = useState("dreams");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function getJSON(url) {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }

    async function loadHistory() {
      try {
        const history = await getJSON(`${API}/galaxy/history`);
        if (!Array.isArray(history)) {
          throw new Error("Invalid history response");
        }

        // Our history API returns newest first. Chart oldest -> newest.
        const ordered = [...history].reverse();
        const snapshots = await Promise.all(
          ordered.map((item) =>
            getJSON(`${API}/galaxy/history/${item.id}`)
          )
        );

        const chartData = snapshots.map((snapshot, index) => {
          const stars = snapshot.galaxy?.stars;
          const connections = snapshot.galaxy?.connections;

          if (!Array.isArray(stars) || !Array.isArray(connections)) {
            throw new Error("Invalid snapshot data");
          }

          const totalProgress = stars.reduce((total, star) => {
            const value = Number(star.progress);
            return total + (Number.isFinite(value) ? value : 0);
          }, 0);

          return {
            id: ordered[index].id,
            action: ordered[index].action,
            dreams: stars.length,
            connections: connections.length,
            completed: stars.filter(
              (star) => Number(star.progress) >= 100
            ).length,
            averageProgress: stars.length
              ? Math.round(totalProgress / stars.length)
              : 0
          };
        });

        if (!controller.signal.aborted) setTimeline(chartData);
      } catch (err) {
        if (err.name !== "AbortError" && !controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadHistory();
    return () => controller.abort();
  }, []);

  const selectedMetric = METRICS[metric];
  const values = timeline.map((item) => item[metric]);
  const earliest = values.length ? values[0] : 0;
  const latest = values.length ? values[values.length - 1] : 0;
  const difference = latest - earliest;
  const unchanged = values.length > 1 && values.every((value) => value === earliest);

  // Percentages always use 0-100; count metrics use readable integer ticks.
  const maxValue =
    metric === "averageProgress"
      ? 100
      : Math.max(4, Math.ceil(Math.max(0, ...values) / 4) * 4);

  const left = 64;
  const right = 590;
  const top = 24;
  const bottom = 205;

  const points = timeline.map((item, index) => {
    const x =
      timeline.length === 1
        ? (left + right) / 2
        : left + (index / (timeline.length - 1)) * (right - left);

    const value = item[metric];
    const y = bottom - (value / maxValue) * (bottom - top);
    return { ...item, x, y, value };
  });

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <section className="evolution-chart-section">
      <h3>📈 Historical Galaxy Growth</h3>
      <p>Explore how your dreams and connections changed across saved snapshots.</p>

      <div className="evolution-chart-controls">
        {Object.entries(METRICS).map(([key, config]) => (
          <button
            key={key}
            type="button"
            aria-pressed={metric === key}
            onClick={() => setMetric(key)}
          >
            {config.label}
          </button>
        ))}
      </div>

      {loading && <p>Loading historical data...</p>}
      {error && <p role="alert">Error: {error}</p>}
      {!loading && !error && timeline.length === 0 && (
        <p>No historical snapshots found.</p>
      )}

      {!loading && !error && timeline.length > 0 && (
        <>
          <div style={{ margin: "16px 0", color: "#cbd5e1" }}>
            <strong style={{ color: "#c084fc", fontSize: "18px" }}>
              Showing: {selectedMetric.label}
            </strong>
            <p style={{ margin: "6px 0" }}>{selectedMetric.description}</p>
            <p style={{ margin: "6px 0", fontSize: "15px" }}>
              Earliest: <strong>{earliest}{selectedMetric.suffix}</strong>
              {" · "}
              Latest: <strong>{latest}{selectedMetric.suffix}</strong>
              {" · "}
              Change: <strong>
                {difference > 0 ? "+" : ""}{difference}
                {metric === "averageProgress" ? " percentage points" : ""}
              </strong>
            </p>
          </div>

          <div className="evolution-chart-container">
            <svg
              key={metric}
              viewBox="0 0 640 260"
              role="img"
              aria-label={`${selectedMetric.label} by snapshot: ${values.join(", ")}${selectedMetric.suffix}`}
            >
              <line x1={left} y1={top} x2={left} y2={bottom} stroke="#62517d" />
              <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#62517d" />

              {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                const y = bottom - fraction * (bottom - top);
                return (
                  <g key={fraction}>
                    <line
                      x1={left}
                      y1={y}
                      x2={right}
                      y2={y}
                      stroke="#49316d"
                      strokeDasharray="4 6"
                    />
                    <text
                      x={left - 12}
                      y={y + 4}
                      fill="#cbd5e1"
                      fontSize="12"
                      textAnchor="end"
                    >
                      {Math.round(maxValue * fraction)}{selectedMetric.suffix}
                    </text>
                  </g>
                );
              })}

              {points.length > 1 && (
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {points.map((point, index) => (
                <g key={point.id}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="#67e8f9"
                    stroke="#100b25"
                    strokeWidth="2"
                  >
                    <title>
                      {`Snapshot #${point.id}: ${point.value}${selectedMetric.suffix} (${point.action})`}
                    </title>
                  </circle>
                  {(points.length <= 7 || index === 0 || index === points.length - 1) && (
                    <text
                      x={point.x}
                      y={Math.max(16, point.y - 11)}
                      fill="#e9d5ff"
                      fontSize="12"
                      textAnchor="middle"
                    >
                      {point.value}{selectedMetric.suffix}
                    </text>
                  )}
                </g>
              ))}

              <text
                x={points[0].x}
                y="235"
                fill="#cbd5e1"
                fontSize="12"
                textAnchor={points.length === 1 ? "middle" : "start"}
              >
                Snapshot #{points[0].id}
              </text>
              {points.length > 1 && (
                <text
                  x={points[points.length - 1].x}
                  y="235"
                  fill="#cbd5e1"
                  fontSize="12"
                  textAnchor="end"
                >
                  Snapshot #{points[points.length - 1].id}
                </text>
              )}
            </svg>
          </div>

          {unchanged && (
            <p style={{ color: "#e9d5ff" }}>
              The saved value is the same in every snapshot, so this line is
              correctly flat. This isn't a chart error.
            </p>
          )}

          <details style={{ marginTop: "14px", color: "#cbd5e1" }}>
            <summary style={{ cursor: "pointer", color: "#c084fc" }}>
              View the exact {selectedMetric.label.toLowerCase()} values for each snapshot
            </summary>
            <div style={{ maxHeight: "220px", overflowY: "auto", marginTop: "10px" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th scope="col">Snapshot</th>
                    <th scope="col">Event</th>
                    <th scope="col">{selectedMetric.label}</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>{item.action}</td>
                      <td>{item[metric]}{selectedMetric.suffix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <p className="evolution-chart-footer">
            {timeline.length} snapshots · Oldest to newest
          </p>
        </>
      )}
    </section>
  );
}
