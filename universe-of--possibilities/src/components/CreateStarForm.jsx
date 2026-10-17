import { useState } from "react";
export default function CreateStarForm({ onCreate, onCancel }) {
  const [draft, setDraft] = useState({
    name: "",
    category: "Dreams",
    description: "",
    color: "#38bdf8",
    progress: 0,
    difficulty: "Not set",
  });

  function handleSubmit(event) {
    event.preventDefault();

    if (!draft.name.trim()) return;

    onCreate({
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
    });
  }

  return (
    <div
      className="create-star-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Create a new star"
    >
      <form
        className="create-star-form"
        onSubmit={handleSubmit}
      >
        <h2>Create a New Star ✨</h2>

        <label>
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

        <label>
          Category
          <select
            value={draft.category}
            onChange={(event) =>
              setDraft({
                ...draft,
                category: event.target.value,
              })
            }
          >
            <option>Dreams</option>
            <option>Skills</option>
            <option>Projects</option>
            <option>Experiments</option>
          </select>
        </label>

        <label>
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

        <label>
          Star Color
          <input
            type="color"
            value={draft.color}
            onChange={(event) =>
              setDraft({
                ...draft,
                color: event.target.value,
              })
            }
          />
        </label>

        <label>
          Progress: {draft.progress}%
          <input
            type="range"
            min="0"
            max="100"
            value={draft.progress}
            onChange={(event) =>
              setDraft({
                ...draft,
                progress: Number(event.target.value),
              })
            }
          />
        </label>

        <label>
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

        <div className="new-star-actions">
          <button type="submit">
            Create Star
          </button>

          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}