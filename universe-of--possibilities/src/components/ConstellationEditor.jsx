import { useState } from "react";

export default function ConstellationEditor({
  stars,
  connections,
  onAdd,
  onRemove,
  onClose
}) {
  const [from, setFrom] = useState(stars[0]?.id ?? 0);
  const [to, setTo] = useState(stars[1]?.id ?? 0);
  const [color, setColor] = useState("#67e8f9");

  // Check whether these stars are already connected
  const isDuplicate = connections.some(
    (connection) =>
      (connection.from === from && connection.to === to) ||
      (connection.from === to && connection.to === from)
  );

  const canConnect =
    from !== 0 &&
    to !== 0 &&
    from !== to &&
    !isDuplicate;

  function handleSubmit(event) {
    event.preventDefault();

    if (!canConnect) return;

    onAdd({ from, to, color });
  }

  function getStarName(id) {
    return stars.find((star) => star.id === id)?.name
      ?? `Star ${id}`;
  }

  return (
    <div
      className="constellation-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Constellation editor"
    >
      <div className="constellation-editor">
        <button
          className="constellation-close"
          type="button"
          onClick={onClose}
        >
          ×
        </button>

        <h2>Constellation Builder ✨</h2>
        <p>Connect two possibilities in your universe.</p>

        <form onSubmit={handleSubmit}>
          <label>
            First Star
            <select
              value={from}
              onChange={(event) =>
                setFrom(Number(event.target.value))
              }
            >
              {stars.map((star) => (
                <option key={star.id} value={star.id}>
                  {star.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Second Star
            <select
              value={to}
              onChange={(event) =>
                setTo(Number(event.target.value))
              }
            >
              {stars.map((star) => (
                <option key={star.id} value={star.id}>
                  {star.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Connection Color
            <input
              type="color"
              value={color}
              onChange={(event) =>
                setColor(event.target.value)
              }
            />
          </label>

          {!canConnect && (
            <p className="connection-warning">
              {from === to
                ? "Choose two different stars."
                : "These stars are already connected."}
            </p>
          )}

          <button
            type="submit"
            disabled={!canConnect}
          >
            Create Connection
          </button>
        </form>

        <h3>Existing Connections ({connections.length})</h3>

        <ul className="connection-list">
          {connections.map((connection) => (
            <li
              key={`${connection.from}-${connection.to}`}
            >
              <span>
                {getStarName(connection.from)}
                {" ↔ "}
                {getStarName(connection.to)}
              </span>

              <button
                type="button"
                onClick={() =>
                  onRemove(connection.from, connection.to)
                }
                aria-label="Remove connection"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}