

export default function RecommendationPanel({
  recommendations,
  stars,
  onConnect,
  onClose
}) {
  function getName(id) {
    return stars.find((star) => star.id === id)?.name
      ?? `Star ${id}`;
  }

  return (
    <div className="recommendation-backdrop">
      <section
        className="recommendation-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Connection recommendations"
      >
        <div className="recommendation-header">
          <h2>✨ Connection Discovery</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close recommendations"
          >
            ×
          </button>
        </div>

        <p>
          Discover possible relationships between
          your stars.
        </p>

        {recommendations.length === 0 ? (
          <p>
            No new connections found.
            Try adding more stars and relationships!
          </p>
        ) : (
          recommendations.map((item) => (
            <article
              className="recommendation-card"
              key={`${item.from}-${item.to}`}
            >
              <h3>
                {getName(item.from)}
                {" ↔ "}
                {getName(item.to)}
              </h3>

              <p>
                Shared connections:{" "}
                {item.sharedIds
                  .map(getName)
                  .join(", ")}
              </p>

              <div className="recommendation-score">
                <span>Neighbor similarity</span>
                <strong>
                  {Math.round(item.score * 100)}%
                </strong>
              </div>

              <button
                type="button"
                onClick={() =>
                  onConnect({
                    from: item.from,
                    to: item.to,
                    color: "#67e8f9"
                  })
                }
              >
                + Connect Stars
              </button>
            </article>
          ))
        )}
      </section>
    </div>
  );
}