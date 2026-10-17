
import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateUniverseStats
} from "../src/utils/analytics.js";

import {
  recommendConnections
} from "../src/utils/recommendations.js";

// A small sample galaxy
const stars = [
  { id: 1, name: "Alpha", color: "#ffffff" },
  { id: 2, name: "Beta", color: "#ffffff" },
  { id: 3, name: "Gamma", color: "#ffffff" },
  { id: 4, name: "Delta", color: "#ffffff" },
  { id: 5, name: "Epsilon", color: "#ffffff" }
];

const connections = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 1 },
  { from: 2, to: 4 },
  { from: 2, to: 1 }, // Duplicate
  { from: 3, to: 3 }, // Invalid self-link
  { from: 1, to: 99 } // Missing star
];

test("Analytics counts valid connections", () => {
  const stats = calculateUniverseStats(
    stars,
    connections
  );

  assert.equal(stats.starCount, 5);
  assert.equal(stats.connectionCount, 4);
  assert.equal(stats.averageDegree, 1.6);
});

test("Analytics identifies clusters and isolated stars", () => {
  const stats = calculateUniverseStats(
    stars,
    connections
  );

  assert.equal(stats.componentCount, 2);
  assert.deepEqual(
    stats.isolated.map((star) => star.id),
    [5]
  );

  assert.equal(stats.rankings[0].id, 2);
  assert.equal(stats.rankings[0].degree, 3);
});

// Simple recommendation network
const sampleStars = stars.slice(0, 4);

const sampleConnections = [
  { from: 1, to: 2 },
  { from: 2, to: 3 }
];

test("Recommendations find shared neighbors", () => {
  const results = recommendConnections(
    sampleStars,
    sampleConnections
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].from, 1);
  assert.equal(results[0].to, 3);
  assert.deepEqual(results[0].sharedIds, [2]);
  assert.equal(results[0].score, 1);
});

test("Recommendations disappear after connecting stars", () => {
  const updatedConnections = [
    ...sampleConnections,
    { from: 1, to: 3 }
  ];

  const results = recommendConnections(
    sampleStars,
    updatedConnections
  );

  assert.deepEqual(results, []);
});
