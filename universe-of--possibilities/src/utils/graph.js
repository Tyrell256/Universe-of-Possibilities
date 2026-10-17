
/*
  Universe of Possibilities
  Graph Algorithms
*/

// Create a consistent identifier for an edge
export function edgeKey(a, b) {
  return [a, b]
    .sort((x, y) => x - y)
    .join("-");
}

// Find the shortest path between two stars
export function findShortestPath(startId, endId, edges) {
  if (startId === endId) {
    return [startId];
  }

  const graph = new Map();

  // Create the adjacency list
  for (const { from, to } of edges) {
    if (!graph.has(from)) {
      graph.set(from, []);
    }

    if (!graph.has(to)) {
      graph.set(to, []);
    }

    graph.get(from).push(to);
    graph.get(to).push(from);
  }

  // Breadth-First Search
  const queue = [startId];
  const previous = new Map([[startId, null]]);

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];

    for (const neighbor of graph.get(current) ?? []) {
      if (previous.has(neighbor)) {
        continue;
      }

      previous.set(neighbor, current);

      if (neighbor === endId) {
        const path = [];
        let node = endId;

        while (node !== null) {
          path.unshift(node);
          node = previous.get(node);
        }

        return path;
      }

      queue.push(neighbor);
    }
  }

  return [];
}
