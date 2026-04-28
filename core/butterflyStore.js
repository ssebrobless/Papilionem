// ButterflyStore: zone-indexed sidecar over the flat butterflies array.
//
// The flat array is still the canonical storage (preserves iteration order,
// serialization, and any code that does for/of, .indexOf, etc.). The store
// maintains a parallel Map<zoneId, butterfly[]> that mutation hooks keep in
// sync, so getButterfliesInZone is O(1) instead of O(N) per call.
//
// Usage rules:
//   - Anywhere that pushes a butterfly onto gameState.butterflies, also call
//     store.add(butterfly).
//   - Anywhere that splices a butterfly out, also call store.remove(butterfly).
//   - Anywhere that wholesale reassigns gameState.butterflies = [...], also
//     call store.adoptArray(newArray).
//   - Anywhere that changes a butterfly's currentZoneId, also call
//     store.moveZone(butterfly, previousZoneId, nextZoneId). gameCore's
//     assignEntityToZone is the centralized hook for this.
//
// The store has a safety net: if its internal length tracker disagrees with
// the underlying array length on the next lookup, it rebuilds the index. So
// any unhooked mutation just costs one O(N) rebuild rather than corrupting
// reads.
//
// Proximity grids: each zone bucket also gets a uniform-cell ProximityGrid
// (cellSize 64) that's lazily rebuilt the first time a proximity query fires
// in a given frame. Direct position mutation hooks invalidate the affected
// zone grid so same-frame proximity reads do not reuse stale coordinates.

class ProximityGrid {
    constructor(cellSize = 64) {
        this.cellSize = cellSize;
        this.cells = new Map();
        this.builtForFrame = -1;
        this.builtForLength = -1;
    }

    needsRebuild(frame, bucketLength) {
        return this.builtForFrame !== frame || this.builtForLength !== bucketLength;
    }

    rebuild(bucket, frame) {
        this.cells.clear();
        const inv = 1 / this.cellSize;
        for (let i = 0; i < bucket.length; i += 1) {
            const b = bucket[i];
            if (!b) continue;
            const cx = Math.floor((b.x || 0) * inv);
            const cy = Math.floor((b.y || 0) * inv);
            const key = (cx << 16) ^ (cy & 0xffff);
            let cell = this.cells.get(key);
            if (!cell) {
                cell = [];
                this.cells.set(key, cell);
            }
            cell.push(b);
        }
        this.builtForFrame = frame;
        this.builtForLength = bucket.length;
    }

    countWithin(x, y, radius, excludeId, filterFn = null) {
        const inv = 1 / this.cellSize;
        const minCX = Math.floor((x - radius) * inv);
        const maxCX = Math.floor((x + radius) * inv);
        const minCY = Math.floor((y - radius) * inv);
        const maxCY = Math.floor((y + radius) * inv);
        const rSq = radius * radius;
        let count = 0;
        for (let cy = minCY; cy <= maxCY; cy += 1) {
            const yKey = cy & 0xffff;
            for (let cx = minCX; cx <= maxCX; cx += 1) {
                const cell = this.cells.get((cx << 16) ^ yKey);
                if (!cell) continue;
                for (let i = 0; i < cell.length; i += 1) {
                    const b = cell[i];
                    if (!b || (excludeId != null && b.id === excludeId)) continue;
                    if (filterFn && !filterFn(b)) continue;
                    const dx = (b.x || 0) - x;
                    const dy = (b.y || 0) - y;
                    if (dx * dx + dy * dy <= rSq) count += 1;
                }
            }
        }
        return count;
    }

    listWithin(x, y, radius, excludeId, out) {
        const result = out || [];
        const inv = 1 / this.cellSize;
        const minCX = Math.floor((x - radius) * inv);
        const maxCX = Math.floor((x + radius) * inv);
        const minCY = Math.floor((y - radius) * inv);
        const maxCY = Math.floor((y + radius) * inv);
        const rSq = radius * radius;
        for (let cy = minCY; cy <= maxCY; cy += 1) {
            const yKey = cy & 0xffff;
            for (let cx = minCX; cx <= maxCX; cx += 1) {
                const cell = this.cells.get((cx << 16) ^ yKey);
                if (!cell) continue;
                for (let i = 0; i < cell.length; i += 1) {
                    const b = cell[i];
                    if (!b || (excludeId != null && b.id === excludeId)) continue;
                    const dx = (b.x || 0) - x;
                    const dy = (b.y || 0) - y;
                    if (dx * dx + dy * dy <= rSq) result.push(b);
                }
            }
        }
        return result;
    }
}

class ButterflyStore {
    static EMPTY_ARRAY = Object.freeze([]);

    constructor(arrayRef = []) {
        this._arr = arrayRef;
        this._byZone = new Map();
        this._zoneOf = new Map();
        this._lastSyncedLength = -1;
        this._emptyArray = Object.freeze([]);
        this._gridByZone = new Map();
        this._gridCellSize = 96;
        this._gridMinBucket = 96;
        this._gridStats = { rebuilds: 0, queries: 0 };
    }

    _readCurrentFrame() {
        const core = typeof gameCore !== 'undefined' ? gameCore : null;
        return core?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : -1);
    }

    adoptArray(arr) {
        this._arr = Array.isArray(arr) ? arr : [];
        this._byZone.clear();
        this._zoneOf.clear();
        this._gridByZone.clear();
        this._lastSyncedLength = -1;
        this._ensureConsistent();
    }

    add(butterfly) {
        if (!butterfly) return butterfly;
        const zoneId = this._readZone(butterfly);
        if (zoneId) this._addToBucket(butterfly, zoneId);
        else if (butterfly.id != null) this._zoneOf.delete(butterfly.id);
        this._lastSyncedLength = this._arr.length;
        return butterfly;
    }

    remove(butterfly) {
        if (!butterfly) return false;
        const lastZone = butterfly.id != null ? this._zoneOf.get(butterfly.id) : null;
        if (lastZone) this._removeFromBucket(butterfly, lastZone);
        if (butterfly.id != null) this._zoneOf.delete(butterfly.id);
        this._lastSyncedLength = this._arr.length;
        return true;
    }

    moveZone(butterfly, previousZoneId, nextZoneId) {
        if (!butterfly) return;
        const prev = previousZoneId || (butterfly.id != null ? this._zoneOf.get(butterfly.id) : null) || null;
        const next = nextZoneId || null;
        if (prev === next) return;
        if (prev) this._removeFromBucket(butterfly, prev);
        if (next) this._addToBucket(butterfly, next);
        else if (butterfly.id != null) this._zoneOf.delete(butterfly.id);
    }

    afterPositionMutation(butterfly, previousZoneId = null, options = {}) {
        if (!butterfly) return null;
        const nextZoneId = options.zoneId || this._readZone(butterfly);
        const prevZoneId = previousZoneId || (butterfly.id != null ? this._zoneOf.get(butterfly.id) : null) || nextZoneId || null;
        if (prevZoneId !== nextZoneId) {
            this.moveZone(butterfly, prevZoneId, nextZoneId);
        }

        const groundY = (butterfly.y || 0) + (butterfly.shadowOffset || 0);
        if (typeof gridManager !== 'undefined' && gridManager?.screenToIso) {
            butterfly.gridPos = gridManager.screenToIso(butterfly.x || 0, groundY);
        }
        butterfly.updateZIndex?.();

        this.invalidateGrid(prevZoneId);
        this.invalidateGrid(nextZoneId);

        return {
            previousZoneId: prevZoneId,
            currentZoneId: nextZoneId,
            gridPos: butterfly.gridPos || null
        };
    }

    afterTeleport(butterfly, previousZoneId = null, options = {}) {
        const result = this.afterPositionMutation(butterfly, previousZoneId, options);
        if (!result || !butterfly) return result;

        if (options.resetMovement !== false && butterfly.movement) {
            const currentGrid = butterfly.gridPos || null;
            if (currentGrid) {
                butterfly.movement.target = { x: currentGrid.x, y: currentGrid.y };
                butterfly.movement.smoothFollowTarget = { x: currentGrid.x, y: currentGrid.y };
            }
            butterfly.movement.clearTarget?.();
        }

        if (options.resetPhysics !== false && typeof physicsSystem !== 'undefined') {
            const physics = physicsSystem?.getEntityState?.(butterfly.id)
                || physicsSystem?.registerEntity?.(butterfly, 'butterfly')
                || butterfly.physics
                || null;
            if (physics) {
                const groundPoint = {
                    x: butterfly.x || 0,
                    y: (butterfly.y || 0) + (butterfly.shadowOffset || 0)
                };
                physics.position = physics.position || {};
                physics.position.x = butterfly.x || 0;
                physics.position.y = butterfly.y || 0;
                physics.motion = physics.motion || { previous: {}, desired: {} };
                physics.motion.previous = { x: groundPoint.x, y: groundPoint.y };
                physics.motion.desired = { x: groundPoint.x, y: groundPoint.y };
                physics.motion.movedFrame = this._readCurrentFrame();
                physics.motion.source = options.source || 'teleport';
                physics.velocity = { x: 0, y: 0 };
                physics.intent = { x: 0, y: 0 };
                physics.impulse = { x: 0, y: 0, frames: 0, source: null };
                physics.contact = physics.contact || {};
                physics.contact.blocked = false;
                physics.contact.blockedByIds = [];
                physics.contact.touchedButterflyIds = [];
                physics.contact.touchedBlockIds = [];
                physics.diagnostics = physics.diagnostics || {};
                physics.diagnostics.lastMotionSource = options.source || 'teleport';
                physics.diagnostics.lastResolvedFrame = this._readCurrentFrame();
                butterfly.physics = physics;
            }
        }

        return result;
    }

    inZone(zoneId) {
        if (!zoneId) return this._emptyArray;
        this._ensureConsistent();
        return this._byZone.get(zoneId) || this._emptyArray;
    }

    proximityCount(zoneId, x, y, radius, excludeId = null, filterFn = null) {
        if (!zoneId || !(radius > 0)) return 0;
        const bucket = this.inZone(zoneId);
        const len = bucket.length;
        if (!len) return 0;
        this._gridStats.queries += 1;
        if (len <= this._gridMinBucket) {
            const rSq = radius * radius;
            let count = 0;
            for (let i = 0; i < len; i += 1) {
                const b = bucket[i];
                if (!b || (excludeId != null && b.id === excludeId)) continue;
                if (filterFn && !filterFn(b)) continue;
                const dx = (b.x || 0) - x;
                const dy = (b.y || 0) - y;
                if (dx * dx + dy * dy <= rSq) count += 1;
            }
            return count;
        }
        const grid = this._ensureGrid(zoneId, bucket);
        return grid.countWithin(x, y, radius, excludeId, filterFn);
    }

    proximityList(zoneId, x, y, radius, excludeId = null, out = null) {
        if (!zoneId || !(radius > 0)) return out || [];
        const bucket = this.inZone(zoneId);
        const len = bucket.length;
        if (!len) return out || [];
        this._gridStats.queries += 1;
        if (len <= this._gridMinBucket) {
            const result = out || [];
            const rSq = radius * radius;
            for (let i = 0; i < len; i += 1) {
                const b = bucket[i];
                if (!b || (excludeId != null && b.id === excludeId)) continue;
                const dx = (b.x || 0) - x;
                const dy = (b.y || 0) - y;
                if (dx * dx + dy * dy <= rSq) result.push(b);
            }
            return result;
        }
        const grid = this._ensureGrid(zoneId, bucket);
        return grid.listWithin(x, y, radius, excludeId, out);
    }

    _currentFrame() {
        return gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0);
    }

    _ensureGrid(zoneId, bucket) {
        let grid = this._gridByZone.get(zoneId);
        if (!grid) {
            grid = new ProximityGrid(this._gridCellSize);
            this._gridByZone.set(zoneId, grid);
        }
        const frame = this._currentFrame();
        if (grid.needsRebuild(frame, bucket.length)) {
            grid.rebuild(bucket, frame);
            this._gridStats.rebuilds += 1;
        }
        return grid;
    }

    invalidateGrid(zoneId) {
        if (!zoneId) return;
        const grid = this._gridByZone.get(zoneId);
        if (grid) {
            grid.builtForFrame = -1;
            grid.builtForLength = -1;
        }
    }

    rebuildFromArray() {
        this._byZone.clear();
        this._zoneOf.clear();
        const arr = this._arr;
        for (let i = 0; i < arr.length; i += 1) {
            const entity = arr[i];
            if (!entity) continue;
            const zoneId = this._readZone(entity);
            if (!zoneId) continue;
            this._addToBucket(entity, zoneId);
        }
        this._lastSyncedLength = arr.length;
    }

    debugStats() {
        return {
            arrayLength: this._arr.length,
            indexedLength: this._zoneOf.size,
            zoneCount: this._byZone.size,
            lastSyncedLength: this._lastSyncedLength,
            gridZones: this._gridByZone.size,
            gridRebuilds: this._gridStats.rebuilds,
            gridQueries: this._gridStats.queries
        };
    }

    _ensureConsistent() {
        if (this._lastSyncedLength === this._arr.length) return;
        this.rebuildFromArray();
    }

    _readZone(entity) {
        return entity?.currentZoneId
            || entity?.lifeSim?.lifecycle?.currentZoneId
            || entity?.lifecycleData?.currentZoneId
            || null;
    }

    _addToBucket(butterfly, zoneId) {
        let bucket = this._byZone.get(zoneId);
        if (!bucket) {
            bucket = [];
            this._byZone.set(zoneId, bucket);
        }
        const existingZone = butterfly.id != null ? this._zoneOf.get(butterfly.id) : null;
        if (existingZone === zoneId && bucket.includes(butterfly)) return;
        if (existingZone && existingZone !== zoneId) {
            this._removeFromBucket(butterfly, existingZone);
        }
        bucket.push(butterfly);
        if (butterfly.id != null) this._zoneOf.set(butterfly.id, zoneId);
    }

    _removeFromBucket(butterfly, zoneId) {
        const bucket = this._byZone.get(zoneId);
        if (!bucket) return;
        const idx = bucket.indexOf(butterfly);
        if (idx >= 0) bucket.splice(idx, 1);
        if (!bucket.length) this._byZone.delete(zoneId);
    }
}

if (typeof window !== 'undefined') {
    window.ButterflyStore = ButterflyStore;
    window.ProximityGrid = ProximityGrid;
}
