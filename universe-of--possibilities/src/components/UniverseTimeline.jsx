

export default function UniverseTimeline({ events, onClose }) {
  const eventLabels = {
    "star-created": "✨",
    "star-updated": "✏️",
    "connection-created": "🔗",
    "connection-removed": "✂️"
  };

  return (
    <div className="timeline-backdrop">
      <section
        className="timeline-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Universe timeline"
      >
        <div className="timeline-header">
          <h2>🕰️ The Time Machine</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close timeline"
          >
            ×
          </button>
        </div>

        <p>
          Explore the history of your universe.
        </p>

        <div className="timeline-count">
          {events.length} Events Recorded
        </div>

        {events.length === 0 ? (
          <p>
            Your timeline is empty.
            Create or update a star to begin!
          </p>
        ) : (
          <ol className="timeline-events">
            {events.map((event) => (
              <li
                className="timeline-event"
                key={event.id}
              >
                <div className="timeline-icon">
                  {eventLabels[event.type] ?? "⭐"}
                </div>

                <div className="timeline-event-content">
                  <time dateTime={event.timestamp}>
                    {new Date(
                      event.timestamp
                    ).toLocaleString()}
                  </time>

                  <h3>{event.title}</h3>

                  <p>{event.details}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}