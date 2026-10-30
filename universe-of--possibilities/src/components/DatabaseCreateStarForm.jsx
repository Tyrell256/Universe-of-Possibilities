
import { useState } from "react";

export default function DatabaseCreateStarForm({
  starCount,
  onCreated,
  onCancel
}) {
  const [draft, setDraft] = useState({
    name: "",
    category: "Dreams",
    description: "",
    progress: 0,
    difficulty: "Not set",
    color: "#a855f7"
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = draft.name.trim();
    const category = draft.category.trim();
    const progress = Number(draft.progress);

    if (!name || !category) {
      setError("Name and category are required.");
      return;
    }

    if (
      draft.progress === "" ||
      !Number.isInteger(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      setError("Progress must be a whole number from 0 to 100.");
      return;
    }

    // Position the new star in our 3D universe
    const index = starCount + 1;
    const angle = index * 2.39996;
    const radius = 3 + (index % 3) * 0.6;

    const position = [
      radius * Math.cos(angle),
      radius * Math.sin(angle),
      ((index % 5) - 2) * 0.5
    ];

    const newStar = {
      ...draft,
      name,
      category,
      progress,
      size: 0.45,
      position,
      orbit: null
    };

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/galaxy/stars",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(newStar)
        }
      );

      if (!response.ok) {
        throw new Error(
          `Could not save star: HTTP ${response.status}`
        );
      }

      const savedStar = await response.json();

      // Tell our parent component about the new star
      onCreated(savedStar);

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="db-create-backdrop">
      <form
        className="db-create-form"
        onSubmit={handleSubmit}
      >
        <h2>Discover a New Star</h2>

        <label htmlFor="new-star-name">
          Dream Name
        </label>
        <input
          id="new-star-name"
          required
          value={draft.name}
          onChange={(event) =>
            updateField("name", event.target.value)
          }
          placeholder="What do you dream of achieving?"
        />

        <label htmlFor="new-star-category">
          Category
        </label>
        <input
          id="new-star-category"
          required
          value={draft.category}
          onChange={(event) =>
            updateField("category", event.target.value)
          }
        />

        <label htmlFor="new-star-description">
          Description
        </label>
        <textarea
          id="new-star-description"
          rows={3}
          value={draft.description}
          onChange={(event) =>
            updateField("description", event.target.value)
          }
          placeholder="Why does this dream matter?"
        />

        <label htmlFor="new-star-progress">
          Progress (%)
        </label>
        <input
          id="new-star-progress"
          type="number"
          min="0"
          max="100"
          step="1"
          value={draft.progress}
          onChange={(event) =>
            updateField("progress", event.target.value)
          }
        />

        <label htmlFor="new-star-difficulty">
          Difficulty
        </label>
        <select
          id="new-star-difficulty"
          value={draft.difficulty}
          onChange={(event) =>
            updateField("difficulty", event.target.value)
          }
        >
          <option value="Not set">Not set</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <label htmlFor="new-star-color">
          Star Color
        </label>
        <input
          id="new-star-color"
          type="color"
          value={draft.color}
          onChange={(event) =>
            updateField("color", event.target.value)
          }
        />

        {error && (
          <p role="alert" className="db-create-error">
            {error}
          </p>
        )}

        <div className="db-create-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create Star"}
          </button>
        </div>
      </form>
    </div>
  );
}
