
import { useState } from "react";

export default function DatabaseDeleteConnectionForm({
  stars,
  connections,
  onRemoved,
  onCancel
}) {
  const [selectedKey, setSelectedKey] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Connections have no separate database ID,
  // so we identify them by their two star IDs.
  function connectionKey(link) {
    return [link.from, link.to]
      .sort((a, b) => a - b)
      .join("-");
  }

  function starName(id) {
    return stars.find((star) => star.id === id)?.name
      ?? `Star ${id}`;
  }

  async function handleDelete(event) {
    event.preventDefault();

    if (deleting) return;

    const selectedConnection = connections.find(
      (link) => connectionKey(link) === selectedKey
    );

    if (!selectedConnection) {
      setError("Please select a connection.");
      return;
    }

    const { from, to } = selectedConnection;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/galaxy/connections/${from}/${to}`,
        {
          method: "DELETE"
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

      // Python has successfully deleted the connection.
      onRemoved({ from, to });

    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="db-delete-backdrop">
      <form
        className="db-delete-form"
        onSubmit={handleDelete}
      >
        <h2>Remove a Connection</h2>

        <p>
          Choose an existing relationship to remove.
          Both stars will remain in your galaxy.
        </p>

        <label htmlFor="delete-connection">
          Select Connection
        </label>

        <select
          id="delete-connection"
          value={selectedKey}
          onChange={(event) =>
            setSelectedKey(event.target.value)
          }
          required
        >
          <option value="">Select a connection</option>

          {connections.map((link) => (
            <option
              key={connectionKey(link)}
              value={connectionKey(link)}
            >
              {starName(link.from)}
              {" ↔ "}
              {starName(link.to)}
            </option>
          ))}
        </select>

        {selectedKey && (
          <p className="db-delete-warning">
            This will permanently remove the selected
            relationship from SQLite.
          </p>
        )}

        {error && (
          <p role="alert" className="db-delete-error">
            {error}
          </p>
        )}

        <div className="db-delete-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="db-delete-confirm"
            disabled={deleting || !selectedKey}
          >
            {deleting
              ? "Removing..."
              : "Remove Connection"}
          </button>
        </div>
      </form>
    </div>
  );
}
