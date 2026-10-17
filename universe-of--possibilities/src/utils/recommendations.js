
export function recommendConnections(stars, connections) {
  // Create an adjacency list
  const neighbors = new Map();

  stars.forEach((star) => {
    neighbors.set(star.id, new Set());
  });

  // Populate the network
  connections.forEach(({ from, to }) => {
    if (
      from === to ||
      !neighbors.has(from) ||
      !neighbors.has(to)
    ) {
      return;
    }

    neighbors.get(from).add(to);
    neighbors.get(to).add(from);
  });

  const recommendations = [];

  // Compare every unique pair of stars
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      const starA = stars[i];
      const starB = stars[j];

      const neighborsA = neighbors.get(starA.id);
      const neighborsB = neighbors.get(starB.id);

      // Skip pairs already connected
      if (neighborsA.has(starB.id)) {
        continue;
      }

      // Find common neighbors
      const shared = [...neighborsA].filter(
        (id) => neighborsB.has(id)
      );

      if (shared.length === 0) {
        continue;
      }

      // Calculate Jaccard similarity
      const union = new Set([
        ...neighborsA,
        ...neighborsB
      ]);

      const score = shared.length / union.size;

      recommendations.push({
        from: starA.id,
        to: starB.id,
        sharedIds: shared,
        score
      });
    }
  }

  // Rank and return the strongest candidates
  return recommendations
    .sort(
      (a, b) =>
        b.sharedIds.length - a.sharedIds.length ||
        b.score - a.score
    )
    .slice(0, 5);
}
