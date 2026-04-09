const PAPILIONEM_PROGRESS_KEY = 'papilionem-progression-v1';

class ProgressionManager {
    load() {
        try {
            const raw = localStorage.getItem(PAPILIONEM_PROGRESS_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('ProgressionManager: Failed to load progression', error);
            return null;
        }
    }

    save(gameState) {
        if (typeof localStorage === 'undefined' || !gameState) return;

        const data = {
            encounteredButterflies: Array.from(gameState.encounteredButterflies || []),
            collectedButterflies: Array.from(gameState.collectedButterflies || []),
            butterflyCollectionStats: gameState.butterflyCollectionStats || {},
            hybridJournal: gameState.hybridJournal || [],
            nextHybridId: gameState.nextHybridId || 1
        };

        try {
            localStorage.setItem(PAPILIONEM_PROGRESS_KEY, JSON.stringify(data));
        } catch (error) {
            console.warn('ProgressionManager: Failed to save progression', error);
        }
    }

    applyToGameState(gameState) {
        const data = this.load();
        if (!data || !gameState) return;

        gameState.encounteredButterflies = new Set(data.encounteredButterflies || []);
        gameState.collectedButterflies = new Set(data.collectedButterflies || []);
        gameState.butterflyCollectionStats = data.butterflyCollectionStats || {};
        gameState.hybridJournal = Array.isArray(data.hybridJournal) ? data.hybridJournal : [];
        gameState.nextHybridId = Math.max(1, data.nextHybridId || (gameState.hybridJournal.length + 1));
    }

    clear() {
        if (typeof localStorage === 'undefined') return;
        localStorage.removeItem(PAPILIONEM_PROGRESS_KEY);
    }

    makeHybridEntry(gameState, butterfly, parentA, parentB) {
        const id = gameState.nextHybridId || 1;
        gameState.nextHybridId = id + 1;

        const entry = {
            id,
            name: `Hybrid #${id}`,
            sex: butterfly.sex,
            bornAt: Date.now(),
            renderSpec: butterfly.getRenderSpec(),
            parentA: parentA,
            parentB: parentB,
            inheritedAbility: (typeof butterfly.getSpecialAbility === 'function'
                ? butterfly.getSpecialAbility()
                : butterfly.traits.special) || null
        };

        if (!Array.isArray(gameState.hybridJournal)) {
            gameState.hybridJournal = [];
        }

        gameState.hybridJournal.unshift(entry);
        this.save(gameState);
        return entry;
    }

    renameHybrid(gameState, id, name) {
        if (!Array.isArray(gameState.hybridJournal)) return false;
        const entry = gameState.hybridJournal.find(item => item.id === id);
        if (!entry) return false;

        entry.name = name;
        this.save(gameState);
        return true;
    }

    resetAll(gameState) {
        this.clear();
        if (!gameState) return;

        gameState.encounteredButterflies = new Set();
        gameState.collectedButterflies = new Set();
        gameState.butterflyCollectionStats = {};
        gameState.hybridJournal = [];
        gameState.nextHybridId = 1;
    }
}

const progressionManager = new ProgressionManager();
