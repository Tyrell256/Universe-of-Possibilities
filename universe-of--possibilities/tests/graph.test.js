
import test from "node:test";
import assert from "node:assert/strict";

import {
  edgeKey,
  findShortestPath
} from "../src/utils/graph.js";

// Sample network for our tests
const connections = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 1, to: 4 },
  { from: 4, to: 5 },
  { from: 5, to: 3 }
];

test("Edge keys ignore direction", () => {
  assert.equal(
    edgeKey(2, 6),
    edgeKey(6, 2)
  );
});

test("BFS finds the shortest path", () => {
  const path = findShortestPath(
    1,
    3,
    connections
  );

  assert.deepEqual(path, [1, 2, 3]);
});

test("BFS handles unreachable stars", () => {
  const path = findShortestPath(
    1,
    99,
    connections
  );

  assert.deepEqual(path, []);
});

test("BFS handles identical start and end", () => {
  const path = findShortestPath(
    2,
    2,
    connections
  );

  assert.deepEqual(path, [2]);
});
