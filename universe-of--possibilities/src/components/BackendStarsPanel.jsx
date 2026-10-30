
import { useEffect, useState } from "react";

export default function BackendStarsPanel() {
  const [stars, setStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadStars() {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/stars",
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Expected an array of stars");
        }

        setStars(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadStars();

    return () => controller.abort();
  }, []);

  return (
    <aside className="backend-stars-panel">
      <details>
        <summary>
          Python API Stars ({loading ? "..." : stars.length})
        </summary>

        {loading && <p>Contacting Python...</p>}

        {error && <p>API error: {error}</p>}

        {!loading && !error && (
          <ul>
            {stars.map((star) => (
              <li key={star.id}>
                <strong>{star.name}</strong>
                <div>Category: {star.category}</div>
                <div>Progress: {star.progress}%</div>
              </li>
            ))}
          </ul>
        )}
      </details>
    </aside>
  );
}
