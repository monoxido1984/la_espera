import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildUniverseData, groupsFor, packGroups, clusterPoints } from '../app/v2/universe-model.ts';
const read = name => JSON.parse(readFileSync(new URL(`../app/${name}`, import.meta.url)));
const raw = read('story-data.generated.json');
const data = buildUniverseData(raw, read('history.generated.json'), read('transplant-snapshot.generated.json'));
test('all point populations preserve their published totals', () => {
  assert.equal(data.total, raw.facts.current.total);
  assert.equal(data.organs.reduce((sum, group) => sum + group.value, 0), data.total);
  for (const list of data.lists) for (const dimension of ['seniority', 'territory']) {
    assert.equal(groupsFor(data, dimension, list.id).reduce((sum, group) => sum + group.value, 0), list.total, `${list.id} ${dimension}`);
  }
});
test('unpublished distributions retain their explicit category', () => {
  const unpublished = data.lists.filter(list => list.seniority.some(row => row.label === 'SIN DISTRIBUCIÓN PUBLICADA'));
  assert.ok(unpublished.length > 0);
  for (const list of unpublished) assert.ok(groupsFor(data, 'seniority', list.id).some(group => group.label === 'Sin distribución publicada' && group.value > 0));
});
test('responsive clusters preserve every point, fit and do not overlap', () => {
  for (const [width, height] of [[700, 520], [346, 330], [276, 250]]) for (const dimension of ['organ', 'seniority', 'territory']) {
    const groups = groupsFor(data, dimension, null);
    const clusters = packGroups(groups, width, height);
    assert.equal(clusterPoints(clusters, 1).length, data.total);
    for (const [index, cluster] of clusters.entries()) {
      assert.ok(cluster.x - cluster.radius >= 0 && cluster.x + cluster.radius <= width);
      assert.ok(cluster.y - cluster.radius >= 0 && cluster.y + cluster.radius <= height);
      for (const other of clusters.slice(index + 1)) assert.ok(Math.hypot(cluster.x - other.x, cluster.y - other.y) >= cluster.radius + other.radius);
    }
  }
});
