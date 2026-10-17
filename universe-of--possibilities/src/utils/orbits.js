
export function getStarPosition(star, time) {
  // Stationary stars keep their original position
  if (!star.orbit) {
    return star.position;
  }

  const { radius, speed } = star.orbit;

  const angle = time * speed;

  const [centerX, centerY, centerZ] = star.position;

  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  const z = centerZ;

  return [x, y, z];
}
