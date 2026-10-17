

export default function UniverseAnalytics({ stats, onClose }) {

  const {
    starCount,
    connectionCount,
    averageDegree,
    componentCount,
    rankings,
    isolated
  } = stats;

  return (
    <section
      className="analytics-panel"
      aria-label="Universe analytics"
    >
      <div className="analytics-header">
        <h2>Galaxy Analytics 📊</h2>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close analytics"
        >
          ×
        </button>
      </div>

      <div className="analytics-metrics">
        <div>
          <span>Total Stars</span>
          <strong>{starCount}</strong>
        </div>

        <div>
          <span>Connections</span>
          <strong>{connectionCount}</strong>
        </div>

        <div>
          <span>Average Degree</span>
          <strong>
            {averageDegree.toFixed(1)}
          </strong>
        </div>

        <div>
          <span>Star Clusters</span>
          <strong>{componentCount}</strong>
        </div>
      </div>

      <h3>Most Connected Stars</h3>

      <div className="analytics-rankings">
        {rankings.slice(0, 5).map((star) => (
          <div key={star.id}>
            <div className="ranking-label">
              <span>{star.name}</span>
              <strong>{star.degree}</strong>
            </div>

            <div className="ranking-track">
              <div
                className="ranking-fill"
                style={{
                  backgroundColor: star.color,
                  width: `${
                    rankings[0].degree > 0
                      ? star.degree /
                        rankings[0].degree * 100
                      : 0
                  }%`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <h3>Isolated Stars</h3>

      {isolated.length === 0 ? (
        <p>Every star has at least one connection!</p>
      ) : (
        <ul>
          {isolated.map((star) => (
            <li key={star.id}>
              {star.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}