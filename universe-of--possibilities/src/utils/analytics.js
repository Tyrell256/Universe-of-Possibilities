
import { edgeKey } from "./graph.js";

export function calculateUniverseStats(stars, connections) {
  const graph = new Map();

  // Create an adjacency list for every star
  for (const star of stars) {
    graph.set(star.id, new Set());
  }

  const validEdges = new Set();

  // Process valid, unique connections
  for (const { from, to } of connections) {
    if (
      from === to ||
      !graph.has(from) ||
      !graph.has(to)
    ) {
      continue;
    }

    const key = edgeKey(from, to);

    if (validEdges.has(key)) continue;

    validEdges.add(key);

    graph.get(from).add(to);
    graph.get(to).add(from);
  }

  // Rank stars by their number of connections
  const rankings = stars.map((star) => ({
    id: star.id,
    name: star.name,
    color: star.color,
    degree: graph.get(star.id).size,
  }));

  rankings.sort((a, b) => b.degree - a.degree);

  // Identify stars with no connections
  const isolated = rankings.filter(
    (star) => star.degree === 0
  );

  // Count connected components using BFS
  const visited = new Set();
  let componentCount = 0;

  for (const star of stars) {
    if (visited.has(star.id)) continue;

    componentCount++;

    const queue = [star.id];
    visited.add(star.id);

    for (let i = 0; i < queue.length; i++) {
      const current = queue[i];

      for (const neighbor of graph.get(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }

  const starCount = stars.length;
  const connectionCount = validEdges.size;

  const averageDegree =
    starCount > 0
      ? (2 * connectionCount) / starCount
      : 0;

  return {
    starCount,
    connectionCount,
    averageDegree,
    componentCount,
    rankings,
    isolated,
  };
}
