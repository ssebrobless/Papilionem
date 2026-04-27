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

class ButterflyStore {
    static EMPTY_ARRAY = Object.freeze([]);

    constructor(arrayRef = []) {
        this._arr = arrayRef;
        this._byZone = new Map();
        this._zoneOf = new Map();
        this._lastSyncedLength = -1;
        this._emptyArray = Object.freeze([]);
    }

    adoptArray(arr) {
        this._arr = Array.isArray(arr) ? arr : [];
        this._byZone.clear();
        this._zoneOf.clear();
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

    inZone(zoneId) {
        if (!zoneId) return this._emptyArray;
        this._ensureConsistent();
        return this._byZone.get(zoneId) || this._emptyArray;
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
            lastSyncedLength: this._lastSyncedLength
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
}
