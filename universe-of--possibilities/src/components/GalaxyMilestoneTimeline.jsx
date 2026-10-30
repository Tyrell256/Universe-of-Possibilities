import { useEffect, useState } from "react";
import "./GalaxyMilestoneTimeline.css";

const API = "http://127.0.0.1:8000";

function progressOf(star) {
  const value = Number(star?.progress);
  return Number.isFinite(value) ? value : 0;
}

function describeMilestone(snapshot, previous) {
  const action = snapshot.action ?? "unknown";
  const stars = snapshot.galaxy.stars;
  const earlierStars = previous?.galaxy.stars ?? [];
  const id = action.split(":")[1] ?? "";

  function findStar(starId) {
    return [...stars, ...earlierStars].find(
      (star) => String(star.id) === String(starId)
    );
  }

  const event = {
    id: snapshot.id,
    date: snapshot.created_at,
    action,
    category: "dreams",
    icon: "🌌",
    title: "Galaxy changed",
    detail: action,
  };

  if (action === "baseline") {
    return {
      ...event,
      title: "The beginning",
      detail: `Your first saved galaxy had ${stars.length} dreams and ${snapshot.galaxy.connections.length} connections.`,
    };
  }

  if (action.startsWith("star-created:")) {
    const name = findStar(id)?.name ?? `Star #${id}`;
    return {
      ...event,
      icon: "⭐",
      title: "New dream created",
      detail: `“${name}” joined your galaxy.`,
    };
  }

  if (action.startsWith("star-updated:")) {
    const current = stars.find((star) => String(star.id) === id);
    const earlier = earlierStars.find((star) => String(star.id) === id);
    const name = current?.name ?? earlier?.name ?? `Star #${id}`;

    if (current && earlier) {
      const before = progressOf(earlier);
      const after = progressOf(current);

      if (before < 100 && after >= 100) {
        return {
          ...event,
          category: "progress",
          icon: "🏆",
          title: "Dream completed!",
          detail: `“${name}” reached 100% progress.`,
        };
      }

      if (after !== before) {
        return {
          ...event,
          category: "progress",
          icon: after > before ? "📈" : "📝",
          title: after > before ? "Dream progress increased" : "Dream progress revised",
          detail: `“${name}” changed from ${before}% to ${after}%.`,
        };
      }
    }

    return {
      ...event,
      icon: "✏️",
      title: "Dream details updated",
      detail: `“${name}” was edited.`,
    };
  }

  if (
    action.startsWith("connection-created:") ||
    action.startsWith("connection-deleted:")
  ) {
    const [fromId, toId] = id.split("-");
    const fromName = findStar(fromId)?.name ?? `Star #${fromId}`;
    const toName = findStar(toId)?.name ?? `Star #${toId}`;
    const created = action.startsWith("connection-created:");

    return {
      ...event,
      category: "connections",
      icon: created ? "🔗" : "🌠",
      title: created ? "Connection created" : "Connection removed",
      detail: `“${fromName}” and “${toName}” were ${created ? "connected" : "disconnected"}.`,
    };
  }

  return event;
}

const FILTERS = [
  { id: "all", label: "All events" },
  { id: "dreams", label: "Dreams" },
  { id: "progress", label: "Progress" },
  { id: "connections", label: "Connections" },
];

export default function GalaxyMilestoneTimeline({onViewSnapshot }) {
  const [milestones, setMilestones] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function getJSON(url) {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }

    async function loadMilestones() {
      try {
        const history = await getJSON(`${API}/galaxy/history`);
        if (!Array.isArray(history)) {
          throw new Error("Invalid galaxy history response");
        }

        // The API returns newest first; a story reads oldest first.
        const ordered = [...history].sort((a, b) => a.id - b.id);
        const snapshots = await Promise.all(
          ordered.map((event) =>
            getJSON(`${API}/galaxy/history/${event.id}`)
          )
        );

        for (const snapshot of snapshots) {
          if (
            !Array.isArray(snapshot.galaxy?.stars) ||
            !Array.isArray(snapshot.galaxy?.connections)
          ) {
            throw new Error(`Invalid galaxy in snapshot #${snapshot.id}`);
          }
        }

        const events = snapshots.map((snapshot, index) =>
          describeMilestone(snapshot, snapshots[index - 1])
        );

        if (!controller.signal.aborted) setMilestones(events);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadMilestones();
    return () => controller.abort();
  }, []);

  const visible = milestones.filter(
    (item) => filter === "all" || item.category === filter
  );

  return (
    <section className="milestone-section">
      <div className="milestone-heading">
        <h3>✨ Your Milestone Timeline</h3>
        <p>Moments recorded in your galaxy's history.</p>
      </div>

      <div className="milestone-filters" aria-label="Filter milestones">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={filter === option.id}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading && <p>Gathering your milestones...</p>}
      {error && <p role="alert">Couldn't load milestones: {error}</p>}

      {!loading && !error && visible.length === 0 && (
        <p>No recorded milestones match this filter yet.</p>
      )}

      {!loading && !error && visible.length > 0 && (
        <ol className="milestone-list">
          {visible.map((item) => (
            <li className="milestone-item" key={item.id}>
              <span className="milestone-icon" aria-hidden="true">
                {item.icon}
              </span>
              <div className="milestone-card">
                <div className="milestone-meta">
                  <span>Snapshot #{item.id}</span>
                  <span>{item.date ?? "Date unavailable"}</span>
                </div>
                <h4>{item.title}</h4>
                <p>{item.detail}</p>

                
{typeof onViewSnapshot === "function" && (
  <button
    type="button"
    className="milestone-time-travel"
    onClick={() => onViewSnapshot(item.id)}
  >
    ⏳ View this moment in 3D
  </button>
)}

              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="milestone-footnote">
        Based on saved snapshots. Changes made before the baseline, or changes
        that weren't recorded, won't appear as separate events.
      </p>
    </section>
  );
}
