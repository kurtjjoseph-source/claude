import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  activeBackend,
  addHolding,
  deleteHolding,
  getTargetAcres,
  listHoldings,
  setTargetAcres,
  updateHolding,
} from "../src/lib/portfolio/store";
import { computeGoal, projectRunway } from "../src/lib/portfolio/goal";

// The file backend resolves DATA_DIR on every call rather than at import time,
// so setting it in a hook is enough to redirect the store at a scratch path.
const TMP_DIR = ".data-test";

before(() => {
  process.env.DATA_DIR = TMP_DIR;
});

beforeEach(async () => {
  await fs.rm(path.join(process.cwd(), TMP_DIR), { recursive: true, force: true });
});

after(async () => {
  await fs.rm(path.join(process.cwd(), TMP_DIR), { recursive: true, force: true });
  delete process.env.DATA_DIR;
});

function draft(over: Partial<Parameters<typeof addHolding>[0]> = {}) {
  return {
    label: "Parcel",
    stateCode: "CO",
    county: "Prowers",
    acres: 100,
    stage: "prospect" as const,
    reliableAcreFeet: null,
    irrigableAcres: null,
    price: null,
    composite: null,
    verdict: null,
    ...over,
  };
}

test("selects the file backend when Netlify Blobs is unavailable", () => {
  assert.equal(activeBackend().name, "file");
});

test("an empty store reads as empty with the default target", async () => {
  assert.deepEqual(await listHoldings(), []);
  assert.equal(await getTargetAcres(), 1000);
});

test("holdings round-trip through add, update and delete", async () => {
  const created = await addHolding(draft({ label: "Sand Creek", acres: 400 }));
  assert.ok(created.id);
  assert.equal(created.createdAt, created.updatedAt);

  const listed = await listHoldings();
  assert.equal(listed.length, 1);
  assert.equal(listed[0]!.label, "Sand Creek");

  const updated = await updateHolding(created.id, { stage: "closed", acres: 420 });
  assert.equal(updated?.stage, "closed");
  assert.equal(updated?.acres, 420);
  assert.equal(updated?.createdAt, created.createdAt, "createdAt must be preserved");
  assert.ok(updated!.updatedAt >= created.updatedAt);

  assert.equal(await deleteHolding(created.id), true);
  assert.equal(await deleteHolding(created.id), false, "second delete must report nothing removed");
  assert.deepEqual(await listHoldings(), []);
});

test("updating a missing holding returns null rather than creating one", async () => {
  assert.equal(await updateHolding("does-not-exist", { stage: "closed" }), null);
  assert.deepEqual(await listHoldings(), []);
});

test("concurrent adds all survive", async () => {
  // The file backend rewrites one document, so unserialized concurrent adds
  // would clobber each other. This pins the serialization.
  await Promise.all(
    Array.from({ length: 12 }, (_, i) => addHolding(draft({ label: `P${i}`, acres: 10 }))),
  );
  const listed = await listHoldings();
  assert.equal(listed.length, 12);
  assert.equal(new Set(listed.map((h) => h.id)).size, 12, "ids must be unique");
});

test("target acreage persists and is clamped to a sane integer", async () => {
  assert.equal(await setTargetAcres(2500.4), 2500);
  assert.equal(await getTargetAcres(), 2500);
  assert.equal(await setTargetAcres(0), 1, "a zero target would divide by zero downstream");
});

test("target and holdings do not overwrite one another", async () => {
  await setTargetAcres(1500);
  await addHolding(draft({ label: "A", stage: "closed", acres: 300 }));
  assert.equal(await getTargetAcres(), 1500);
  assert.equal((await listHoldings()).length, 1);
});

test("holdings are returned most-recently-updated first", async () => {
  const a = await addHolding(draft({ label: "A" }));
  await addHolding(draft({ label: "B" }));
  await updateHolding(a.id, { acres: 999 });
  const listed = await listHoldings();
  assert.equal(listed[0]!.label, "A");
});

test("goal roll-up separates deeded acres from water-secured acres", async () => {
  await addHolding(draft({ label: "Good", stage: "closed", acres: 400, reliableAcreFeet: 500, composite: 84, price: 2_000_000 }));
  await addHolding(draft({ label: "Dry", stage: "closed", acres: 150, reliableAcreFeet: 0, composite: 80, price: 200_000 }));
  await addHolding(draft({ label: "Weak", stage: "closed", acres: 100, reliableAcreFeet: 90, composite: 41, price: 100_000 }));
  await addHolding(draft({ label: "Pending", stage: "under-contract", acres: 180 }));
  await addHolding(draft({ label: "Looking", stage: "prospect", acres: 320 }));
  await addHolding(draft({ label: "Rejected", stage: "passed", acres: 900 }));

  const goal = computeGoal(await listHoldings(), 1000);

  assert.equal(goal.closedAcres, 650, "closed = 400 + 150 + 100");
  // Water-secured needs both reliable supply and a composite of at least 60.
  assert.equal(goal.waterSecuredAcres, 400, "dry and weak parcels are closed but not water-secured");
  assert.equal(goal.committedAcres, 180);
  assert.equal(goal.pipelineAcres, 320);
  assert.equal(goal.totalReliableAcreFeet, 590);
  assert.equal(goal.capitalDeployed, 2_300_000);
  assert.equal(goal.remainingAcres, 350);
  assert.equal(goal.percentComplete, 65);
  // Acreage-weighted, so the 400-acre block dominates the 100-acre one.
  assert.equal(goal.averageComposite, Math.round((84 * 400 + 80 * 150 + 41 * 100) / 650));
  assert.ok(!("passed" in goal), "passed holdings contribute to nothing");
});

test("runway projects from realised averages and is null before the first close", async () => {
  const empty = computeGoal([], 1000);
  const before = projectRunway(empty, []);
  assert.equal(before.parcelsRemaining, null);
  assert.equal(before.capitalRemaining, null);

  await addHolding(draft({ label: "A", stage: "closed", acres: 250, price: 1_000_000 }));
  await addHolding(draft({ label: "B", stage: "closed", acres: 250, price: 1_500_000 }));
  const holdings = await listHoldings();
  const goal = computeGoal(holdings, 1000);
  const after = projectRunway(goal, holdings);

  assert.equal(after.avgParcelAcres, 250);
  assert.equal(after.avgPricePerAcre, 5000, "$2.5M over 500 acres");
  assert.equal(after.parcelsRemaining, 2, "500 acres left at 250 per parcel");
  assert.equal(after.capitalRemaining, 2_500_000);
});
