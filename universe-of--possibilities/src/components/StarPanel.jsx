import { useState } from "react";

export default function StarPanel({ star, onClose, onSave }) {
  const [isEditing, setIsEditing] = useState(false);

  const [draft, setDraft] = useState({
    name: star.name,
    category: star.category,
    description: star.description ?? "",
    progress: star.progress ?? 0,
    difficulty: star.difficulty ?? "Not set",
  });

  const progress =
    typeof star.progress === "number"
      ? Math.min(100, Math.max(0, star.progress))
      : null;

  function saveChanges(event) {
    event.preventDefault();

    if (!draft.name.trim()) return;

    onSave({
      name: draft.name.trim(),
      category: draft.category.trim() || "Other",
      description: draft.description.trim(),
      progress: Math.min(
        100,
        Math.max(0, Number(draft.progress) || 0)
      ),
      difficulty: draft.difficulty,
    });

    setIsEditing(false);
  }

  return (
    <aside
      className="star-panel"
      style={{
        "--star-accent": star.color,
        borderColor: star.color,
      }}
    >
      <button
        type="button"
        className="panel-close"
        onClick={onClose}
        aria-label="Close panel"
      >
        ×
      </button>

      <p className="panel-label">
        STAR DISCOVERED — ID {star.id}
      </p>

      {isEditing ? (
        <form className="panel-form" onSubmit={saveChanges}>
          <h2>Edit Star Details</h2>

          <label className="panel-field">
            Star Name
            <input
              required
              value={draft.name}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  name: event.target.value,
                })
              }
            />
          </label>

          <label className="panel-field">
            Category
            <input
              value={draft.category}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  category: event.target.value,
                })
              }
            />
          </label>

          <label className="panel-field">
            Description
            <textarea
              rows={3}
              value={draft.description}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  description: event.target.value,
                })
              }
            />
          </label>

          <label className="panel-field">
            Progress (0–100%)
            <input
              type="number"
              min="0"
              max="100"
              value={draft.progress}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  progress: event.target.value,
                })
              }
            />
          </label>

          <label className="panel-field">
            Difficulty
            <select
              value={draft.difficulty}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  difficulty: event.target.value,
                })
              }
            >
              <option>Not set</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </label>

          <div className="panel-actions">
            <button className="panel-save" type="submit">
              Save Changes
            </button>

            <button
              className="panel-cancel"
              type="button"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <h2>{star.name}</h2>

          <p className="panel-category">
            {star.category}
          </p>

          <p className="panel-description">
            {star.description ??
              "No description added yet."}
          </p>

          {progress !== null && (
            <div className="progress-section">
              <div className="progress-heading">
                <span>MISSION PROGRESS</span>
                <span>{progress}%</span>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: star.color,
                  }}
                />
              </div>
            </div>
          )}

          <p className="panel-difficulty">
            Difficulty:{" "}
            <strong>{star.difficulty ?? "Not set"}</strong>
          </p>

          <button
            type="button"
            className="panel-edit"
            onClick={() => setIsEditing(true)}
          >
            ✏️ Edit Star Details
          </button>
        </>
      )}
    </aside>
  );
}
