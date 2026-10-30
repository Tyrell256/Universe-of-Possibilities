
import { useMemo, useState } from "react";
import { recommendConnections } from "../utils/recommendations.js";

export default function DatabaseRecommendationsPanel({
  stars,
  connections,
  onClose,
  onAccepted
}) {
  // Use the recommendation algorithm we built earlier
  const recommendations = useMemo(
    () => recommendConnections(stars, connections),
    [stars, connections]
  );
  const [savingKey, setSavingKey] = useState(null);
  const [saveError, setSaveError] = useState("");
  function getStarName(id) {
  const star = stars.find((star) => star.id === id);

  return star?.name ?? `Star ${id}`;
}

async function acceptRecommendation(recommendation) {
  if (savingKey !== null) return;

  const { from, to } = recommendation;
  const key = `${from}-${to}`;

  setSavingKey(key);
  setSaveError("");

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
          color: "#67e8f9"
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

    const newConnection = await response.json();

    // Tell the parent galaxy about the saved connection
    onAccepted(newConnection);

  } catch (error) {
    setSaveError(error.message);
  } finally {
    setSavingKey(null);
  }
}


  return (
    <div className="db-recommendations-backdrop">
      <section className="db-recommendations-panel">
        <div className="db-recommendations-header">
          <h2>Galaxy Recommendations</h2>

          <button type="button" onClick={onClose}>
            Close ✕
          </button>
        </div>

        <p>
          Discover possible connections between
          your dreams.
        </p>

        <p>
          Suggestions found: {recommendations.length}
        </p>

        {recommendations.length === 0 ? (
          <p>No new connections to recommend yet.</p>
        ) : (
          recommendations.map((recommendation, index) => (
            <div
              key={index}
              className="db-recommendation-item"
            >
              <h3>Suggestion {index + 1}</h3>
              {saveError && (
  <p className="db-recommendation-error" role="alert">
    {saveError}
  </p>
)}

              
<div className="db-recommendation-details">
  <h3>
    {getStarName(recommendation.from)}
    {" ↔ "}
    {getStarName(recommendation.to)}
  </h3>

  <p>
    <strong>Connection Score:</strong>{" "}
    {(recommendation.score * 100).toFixed(0)}%
  </p>

  <p>
    <strong>Shared Dreams:</strong>
  </p>

  <ul>
    {recommendation.sharedIds.map((id) => (
      <li key={id}>
        {getStarName(id)}
      </li>
    ))}
  </ul>
</div>

<button
  type="button"
  className="db-accept-connection"
  onClick={() => acceptRecommendation(recommendation)}
  disabled={savingKey !== null}
>
  {savingKey ===
  `${recommendation.from}-${recommendation.to}`
    ? "Connecting..."
    : "✨ Accept Connection"}
</button>


            </div>
          ))
        )}
      </section>
    </div>
  );
}
