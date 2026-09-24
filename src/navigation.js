import { LAYOUTS, WORLD } from './config.js';
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function walkable(floor, x, y, radius = 0.2) {
  if (x < 0.35 || x > WORLD.width-.35 || y < 0.35 || y > WORLD.depth-.35) return false;
  return !LAYOUTS[floor].some(o => x > o.x - radius && x < o.x + o.w + radius && y > o.y - radius && y < o.y + o.d + radius);
}
export function move(actor, dx, dy, floor) {
  if (walkable(floor, actor.x + dx, actor.y)) actor.x += dx;
  if (walkable(floor, actor.x, actor.y + dy)) actor.y += dy;
  actor.moving = Math.abs(dx) + Math.abs(dy) > 0.001;
  if (actor.moving) actor.facing = dx - dy >= 0 ? 1 : -1;
}
export function findPath(floor, from, to) {
  const cell = p => [Math.round(p.x * 2), Math.round(p.y * 2)];
  const [sx, sy] = cell(from), [tx, ty] = cell(to);
  const columns=WORLD.width*2+1,key = (x, y) => x + y * columns;
  const start = key(sx, sy), dest = key(tx, ty);
  const queue = [[sx, sy]], previous = new Map([[start, null]]);
  let found = false;
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    if (key(x, y) === dest) { found = true; break; }
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (previous.has(k) || !walkable(floor, nx / 2, ny / 2, 0.23)) continue;
      previous.set(k, key(x, y)); queue.push([nx, ny]);
    }
  }
  if (!found) return [];
  const path = [{ ...to }];
  for (let k = dest; k !== start && k !== null; k = previous.get(k)) path.unshift({ x: (k % columns) / 2, y: Math.floor(k / columns) / 2 });
  return path;
}
export function followPath(actor, floor, destination, dt, speed) {
  const targetKey = `${destination.x},${destination.y}`;
  if (actor.pathKey !== targetKey || !actor.path?.length) {
    actor.pathKey = targetKey; actor.path = findPath(floor, actor, destination);
  }
  const next = actor.path[0];
  if (!next) { actor.moving = false; return; }
  const d = distance(actor, next), amount = Math.min(speed * dt, d);
  if (d < 0.08) { actor.path.shift(); actor.moving = false; return; }
  move(actor, (next.x - actor.x) / d * amount, (next.y - actor.y) / d * amount, floor);
}
