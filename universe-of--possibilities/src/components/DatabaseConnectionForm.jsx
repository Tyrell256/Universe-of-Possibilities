
import { useState } from "react";

export default function DatabaseConnectionForm({
  stars,
  connections,
  onCreated,
  onCancel
}) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [color, setColor] = useState("#67e8f9");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    const from = Number(fromId);
    const to = Number(toId);

    if (!fromId || !toId) {
      setError("Please select two stars.");
      return;
    }

    if (from === to) {
      setError("A star cannot connect to itself.");
      return;
    }

    // Make sure these are valid galaxy stars
    if (
      !stars.some((star) => star.id === from) ||
      !stars.some((star) => star.id === to)
    ) {
      setError("Please select valid stars.");
      return;
    }

    // Prevent duplicate connections
    const exists = connections.some(
      (link) =>
        (link.from === from && link.to === to) ||
        (link.from === to && link.to === from)
    );

    if (exists) {
      setError("These stars are already connected.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/galaxy/connections",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from_id: from,
            to_id: to,
            color
          })
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(
          () => null
        );

        throw new Error(
          typeof result?.detail === "string"
            ? result.detail
            : `HTTP ${response.status}`
        );
      }

      const savedConnection = await response.json();

      // Tell our galaxy about the new connection
      onCreated(savedConnection);

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="db-connection-backdrop">
      <form
        className="db-connection-form"
        onSubmit={handleSubmit}
      >
        <h2>Create a Constellation</h2>

        <p>
          Connect two dreams to show how they
          support each other.
        </p>

        <label htmlFor="connection-from">
          First Star
        </label>

        <select
          id="connection-from"
          value={fromId}
          required
          onChange={(event) =>
            setFromId(event.target.value)
          }
        >
          <option value="">Select a star</option>

          {stars.map((star) => (
            <option key={star.id} value={star.id}>
              {star.name}
            </option>
          ))}
        </select>

        <label htmlFor="connection-to">
          Second Star
        </label>

        <select
          id="connection-to"
          value={toId}
          required
          onChange={(event) =>
            setToId(event.target.value)
          }
        >
          <option value="">Select a star</option>

          {stars.map((star) => (
            <option key={star.id} value={star.id}>
              {star.name}
            </option>
          ))}
        </select>

        <label htmlFor="connection-color">
          Connection Color
        </label>

        <input
          id="connection-color"
          type="color"
          value={color}
          onChange={(event) =>
            setColor(event.target.value)
          }
        />

        {error && (
          <p role="alert" className="db-connection-error">
            {error}
          </p>
        )}

        <div className="db-connection-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button type="submit" disabled={saving}>
            {saving ? "Connecting..." : "Connect Stars"}
          </button>
        </div>
      </form>
    </div>
  );
}
