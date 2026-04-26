const PAPILIONEM_PROGRESS_KEY = 'papilionem-progression-v1';
const PAPILIONEM_HYBRID_MASCULINE_NAMES = [
    'Aaron', 'Adrian', 'Aiden', 'Alex', 'Andrew', 'Anthony', 'Asher', 'Austin', 'Benjamin', 'Blake',
    'Brandon', 'Caleb', 'Cameron', 'Carter', 'Charles', 'Christian', 'Christopher', 'Cole', 'Connor', 'Daniel',
    'David', 'Dean', 'Dominic', 'Dylan', 'Easton', 'Eli', 'Elias', 'Elijah', 'Ethan', 'Evan',
    'Ezra', 'Felix', 'Gabriel', 'Gavin', 'Grayson', 'Hayden', 'Henry', 'Hudson', 'Hunter', 'Ian',
    'Isaac', 'Jack', 'Jackson', 'Jacob', 'James', 'Jasper', 'Jason', 'Jeremiah', 'John', 'Jonathan',
    'Jordan', 'Joseph', 'Joshua', 'Julian', 'Justin', 'Kai', 'Kevin', 'Landon', 'Leo', 'Liam',
    'Logan', 'Lucas', 'Luke', 'Marco', 'Mason', 'Matthew', 'Michael', 'Miles', 'Nathan', 'Nicholas',
    'Noah', 'Nolan', 'Oliver', 'Owen', 'Parker', 'Paul', 'Peter', 'Preston', 'Rafael', 'Robert',
    'Roman', 'Ryan', 'Samuel', 'Sawyer', 'Sebastian', 'Silas', 'Simon', 'Theodore', 'Thomas', 'Tristan',
    'Tyler', 'Victor', 'Vincent', 'Wesley', 'William', 'Wyatt', 'Xander', 'Zachary', 'Zion', 'Nico'
];
const PAPILIONEM_HYBRID_FEMININE_NAMES = [
    'Abigail', 'Addison', 'Ainsley', 'Alexandra', 'Alice', 'Alyssa', 'Amelia', 'Anna', 'Aria', 'Ariana',
    'Autumn', 'Ava', 'Bella', 'Brianna', 'Brooklyn', 'Camila', 'Caroline', 'Charlotte', 'Chloe', 'Claire',
    'Cora', 'Daisy', 'Delilah', 'Eden', 'Eleanor', 'Eliana', 'Elizabeth', 'Ella', 'Ellie', 'Emery',
    'Emma', 'Eva', 'Evelyn', 'Faith', 'Fiona', 'Gabriella', 'Gemma', 'Gianna', 'Grace', 'Hailey',
    'Hannah', 'Harper', 'Hazel', 'Isabella', 'Isla', 'Ivy', 'Jade', 'Jasmine', 'Josephine', 'Julia',
    'Katherine', 'Layla', 'Leah', 'Lily', 'Lucy', 'Luna', 'Madeline', 'Madison', 'Maya', 'Mia',
    'Mila', 'Naomi', 'Natalie', 'Nora', 'Nova', 'Olivia', 'Paige', 'Penelope', 'Piper', 'Quinn',
    'Riley', 'Rose', 'Ruby', 'Sadie', 'Samantha', 'Savannah', 'Scarlett', 'Sophia', 'Stella', 'Summer',
    'Sydney', 'Talia', 'Taylor', 'Valentina', 'Victoria', 'Violet', 'Willow', 'Zoe', 'Audrey', 'Eliza',
    'Freya', 'Georgia', 'Hope', 'Iris', 'Juniper', 'Keira', 'Melody', 'Nina', 'Phoebe', 'Serena'
];

class ProgressionManager {
    getCanonicalTypeOrder() {
        return ['friendly', 'cautious', 'energetic', 'skittish', 'wise', 'mystic', 'golden'];
    }

    getBaseVariantTypes(includeGolden = true) {
        const ordered = this.getCanonicalTypeOrder();
        return includeGolden ? [...ordered] : ordered.filter(type => type !== 'golden');
    }

    getFreshSeedTypes() {
        return this.getBaseVariantTypes(false);
    }

    getRequiredGoldenUnlockTypes() {
        return [];
    }

    getDefaultUnlockedType() {
        return 'friendly';
    }

    getDefaultUnlockedSet() {
        return new Set(this.getFreshSeedTypes());
    }

    getTypeUnlockIndex(type) {
        return this.getCanonicalTypeOrder().indexOf(type);
    }

    getProgressionTimestamp() {
        return typeof frameCount === 'number' ? frameCount : Date.now();
    }

    getHybridNamePool(sex = 'M') {
        return sex === 'F'
            ? PAPILIONEM_HYBRID_FEMININE_NAMES
            : PAPILIONEM_HYBRID_MASCULINE_NAMES;
    }

    buildNameSeed(...parts) {
        return parts
            .flat()
            .filter(part => part !== undefined && part !== null)
            .join(':')
            .split('')
            .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    }

    pickHybridPersonalName(sex = 'M', seedParts = []) {
        const pool = this.getHybridNamePool(sex);
        if (!pool.length) return sex === 'F' ? 'Iris' : 'Nico';
        const seed = this.buildNameSeed(sex, seedParts);
        return pool[seed % pool.length];
    }

    isLegacyHybridPlaceholderName(name = '') {
        return /^Hybrid(?:\s*(?:#|\[)?\s*\d+\s*\]?)?$/i.test(String(name || '').trim());
    }

    stripHybridNameDisambiguator(name = '') {
        return String(name || '').replace(/\s+[A-Z]\.$/, '').trim();
    }

    pickHybridDisambiguator(seedParts = []) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const seed = this.buildNameSeed(seedParts);
        return letters[seed % letters.length];
    }

    formatHybridDisplayName(personalName, disambiguator = null) {
        const trimmed = String(personalName || '').trim() || 'Hybrid';
        return disambiguator ? `${trimmed} ${disambiguator}.` : trimmed;
    }

    getHybridPersonalName(subject = {}, fallbackSex = 'M', seedParts = []) {
        const direct = String(subject.personalName || '').trim();
        if (direct) return direct;

        const displayCandidate = String(subject.displayName || subject.name || '').trim();
        if (displayCandidate && !this.isLegacyHybridPlaceholderName(displayCandidate)) {
            return this.stripHybridNameDisambiguator(displayCandidate);
        }

        return this.pickHybridPersonalName(subject.sex || fallbackSex, seedParts);
    }

    getHybridIdentitySortValue(subject = {}) {
        if (Number.isFinite(subject.bornAt)) return subject.bornAt;
        if (Number.isFinite(subject.hybridEntryId)) return subject.hybridEntryId;
        if (Number.isFinite(subject.id)) return subject.id;
        const numericTail = String(subject.id || '').match(/(\d+)$/);
        return numericTail ? Number(numericTail[1]) : 0;
    }

    applyHybridIdentityToSubject(subject, personalName, disambiguator = null) {
        if (!subject) return null;
        const displayName = this.formatHybridDisplayName(personalName, disambiguator);
        subject.personalName = personalName;
        subject.nameDisambiguator = disambiguator || null;
        subject.displayName = displayName;
        subject.name = displayName;
        if (subject.lifeSim?.identity) {
            subject.lifeSim.identity.personalName = personalName;
            subject.lifeSim.identity.displayName = displayName;
        }
        if (subject.lifeSim?.communication) {
            subject.lifeSim.communication.selfName = displayName;
        }
        return displayName;
    }

    refreshLivingHybridDisplayNames(gameState) {
        const livingHybrids = (gameState?.butterflies || []).filter(butterfly =>
            butterfly &&
            !butterfly.isDead?.() &&
            this.isReleasableHybrid(butterfly)
        );
        if (!livingHybrids.length) return;

        const journalById = new Map(
            Array.isArray(gameState?.hybridJournal)
                ? gameState.hybridJournal.map(entry => [entry.id, entry])
                : []
        );
        const groups = new Map();

        for (const butterfly of livingHybrids) {
            const linkedEntry = journalById.get(butterfly.hybridEntryId) || null;
            const personalName = this.getHybridPersonalName(
                butterfly.personalName ? butterfly : (linkedEntry || butterfly),
                butterfly.sex || linkedEntry?.sex || 'M',
                [butterfly.id, butterfly.hybridEntryId, linkedEntry?.bornAt || null]
            );
            butterfly.personalName = personalName;
            if (linkedEntry) linkedEntry.personalName = personalName;
            const group = groups.get(personalName) || [];
            group.push({ butterfly, entry: linkedEntry });
            groups.set(personalName, group);
        }

        for (const [personalName, group] of groups.entries()) {
            group.sort((left, right) =>
                this.getHybridIdentitySortValue(left.entry || left.butterfly)
                - this.getHybridIdentitySortValue(right.entry || right.butterfly)
            );

            group.forEach(({ butterfly, entry }, index) => {
                const disambiguator = index === 0
                    ? null
                    : this.pickHybridDisambiguator([personalName, butterfly.id, entry?.id || index]);
                this.applyHybridIdentityToSubject(butterfly, personalName, disambiguator);
                if (entry) {
                    this.applyHybridIdentityToSubject(entry, personalName, disambiguator);
                }
            });
        }
    }

    isBaseVariantType(type) {
        return this.getCanonicalTypeOrder().includes(type);
    }

    isTrackedWildButterfly(butterfly) {
        return !!butterfly && (butterfly.birthSource || 'wild') === 'wild';
    }

    isDebugButterfly(butterfly) {
        return !!butterfly && butterfly.birthSource === 'debug';
    }

    isReleasableHybrid(butterfly) {
        return !!butterfly && !this.isTrackedWildButterfly(butterfly) && !this.isDebugButterfly(butterfly);
    }

    getBreedingType(entity) {
        if (!entity) return null;
        if (entity.isHybrid || entity.personalityType === 'hybrid') return 'hybrid';
        return entity.personalityType || entity.birthSource || 'wild';
    }

    getTrackedTraitKeys() {
        return ['speed', 'jitteriness', 'trustPropensity', 'trustSpeed', 'scareThreshold', 'happinessBonus'];
    }

    getVariantRarity(type) {
        return BUTTERFLY_PERSONALITIES?.[type]?.rarity || 'unknown';
    }

    getWildBaseWeights() {
        if (typeof BUTTERFLY_SPAWN_WEIGHTS !== 'undefined') {
            return { ...BUTTERFLY_SPAWN_WEIGHTS };
        }
        return {
            friendly: 40,
            cautious: 15,
            energetic: 15,
            skittish: 10,
            wise: 10,
            mystic: 10,
            golden: 0
        };
    }

    clampTraitValue(key, value) {
        if (typeof statProfileSystem !== 'undefined' && typeof statProfileSystem.clampTraitValue === 'function') {
            return statProfileSystem.clampTraitValue(key, value);
        }
        const floor = key === 'scareThreshold' ? 0.5 : 0.05;
        return Math.max(floor, Number.isFinite(value) ? value : floor);
    }

    clamp01(value) {
        return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
    }

    clampBaselineModifier(key, value) {
        const maxDelta = key === 'scareThreshold' ? 0.9 : 0.28;
        return Math.max(-maxDelta, Math.min(maxDelta, Number.isFinite(value) ? value : 0));
    }

    cloneTrackedTraits(traits = {}) {
        const tracked = {};
        for (const key of this.getTrackedTraitKeys()) {
            tracked[key] = typeof traits[key] === 'number' ? traits[key] : 0;
        }
        if (traits.special) {
            tracked.special = traits.special;
        }
        return tracked;
    }

    cloneValue(value, fallback = null) {
        if (value === undefined || value === null) return fallback;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_error) {
            return fallback;
        }
    }

    normalizeCountMap(source = {}) {
        const next = {};
        for (const [key, value] of Object.entries(source || {})) {
            if (!key) continue;
            const numericValue = Number.isFinite(value) ? value : 0;
            if (numericValue <= 0) continue;
            next[key] = numericValue;
        }
        return next;
    }

    incrementCountMap(target = {}, key, amount = 1) {
        if (!key || !Number.isFinite(amount) || amount <= 0) return target;
        target[key] = (target[key] || 0) + amount;
        return target;
    }

    getTopCountEntries(counts = {}, limit = 3) {
        const normalized = this.normalizeCountMap(counts);
        const total = Object.values(normalized).reduce((sum, value) => sum + value, 0);
        return Object.entries(normalized)
            .map(([key, count]) => ({
                key,
                count,
                share: total > 0 ? (count / total) : 0
            }))
            .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
            .slice(0, Math.max(1, limit || 1));
    }

    getZoneLabel(zoneId) {
        return gameCore?.getZoneConfig?.(zoneId)?.label || zoneId || 'garden';
    }

    getTraitLabel(key) {
        if (typeof statProfileSystem !== 'undefined' && typeof statProfileSystem.getTraitLabel === 'function') {
            return statProfileSystem.getTraitLabel(key);
        }
        return key;
    }

    getParentTraitsFromSpec(spec = {}) {
        const baseType = spec.baseType || spec.personalityType;
        const personality = typeof BUTTERFLY_PERSONALITIES !== 'undefined'
            ? BUTTERFLY_PERSONALITIES[baseType]
            : null;
        return personality?.traits ? this.cloneTrackedTraits(personality.traits) : null;
    }

    inferHybridTraits(entry = {}) {
        const parentATraits = this.getParentTraitsFromSpec(entry.parentA);
        const parentBTraits = this.getParentTraitsFromSpec(entry.parentB);
        if (!parentATraits || !parentBTraits) return null;

        const inferred = {};
        for (const key of this.getTrackedTraitKeys()) {
            inferred[key] = ((parentATraits[key] || 0) + (parentBTraits[key] || 0)) / 2;
        }
        if (entry.inheritedAbility) {
            inferred.special = entry.inheritedAbility;
        }
        return inferred;
    }

    normalizeLineageIds(lineageIds = {}) {
        const parents = Array.isArray(lineageIds?.parents)
            ? Array.from(new Set(lineageIds.parents.filter(Boolean)))
            : [];
        const ancestors = Array.isArray(lineageIds?.ancestors)
            ? Array.from(new Set(lineageIds.ancestors.filter(Boolean)))
            : [];
        return {
            parents,
            ancestors: ancestors.filter(ref => !parents.includes(ref))
        };
    }

    deriveHybridLineageTypes(entry = {}, hybridGenome = entry.hybridGenome || entry.renderSpec?.hybridGenome || null) {
        return Array.from(new Set([
            ...(Array.isArray(entry.lineageTypes) ? entry.lineageTypes : []),
            ...(Array.isArray(hybridGenome?.heritage?.lineageTypes) ? hybridGenome.heritage.lineageTypes : []),
            entry.parentA?.baseType || entry.parentA?.personalityType || null,
            entry.parentB?.baseType || entry.parentB?.personalityType || null
        ].filter(Boolean)));
    }

    deriveHybridLineageDepth(entry = {}, hybridGenome = entry.hybridGenome || entry.renderSpec?.hybridGenome || null) {
        const explicitDepth = Math.max(
            0,
            entry.lineageDepth || 0,
            hybridGenome?.heritage?.lineageDepth || 0
        );
        if (explicitDepth > 0) return explicitDepth;
        return entry.parentA || entry.parentB ? 1 : 0;
    }

    deriveHybridHeritageTags(entry = {}, hybridGenome = entry.hybridGenome || entry.renderSpec?.hybridGenome || null, mutationProfile = entry.mutationProfile || null) {
        return Array.from(new Set([
            ...(Array.isArray(entry.heritageTags) ? entry.heritageTags : []),
            ...(Array.isArray(hybridGenome?.heritage?.heritageTags) ? hybridGenome.heritage.heritageTags : []),
            ...this.deriveHybridLineageTypes(entry, hybridGenome),
            mutationProfile?.active ? 'mutant' : null
        ].filter(Boolean)));
    }

    normalizeHybridEntry(entry = {}) {
        const hybridGenome = entry.hybridGenome || entry.renderSpec?.hybridGenome || null;
        const inheritedTraits = entry.inheritedTraits || this.inferHybridTraits(entry);
        const mutationProfile = this.cloneValue(entry.mutationProfile, null);
        const lineageTypes = this.deriveHybridLineageTypes(entry, hybridGenome);
        const lineageDepth = this.deriveHybridLineageDepth(entry, hybridGenome);
        const heritageTags = this.deriveHybridHeritageTags(entry, hybridGenome, mutationProfile);
        const explicitParentRefs = [
            ...(Array.isArray(entry.lineageIds?.parents) ? entry.lineageIds.parents : []),
            ...(Array.isArray(hybridGenome?.heritage?.lineageIds?.parents) ? hybridGenome.heritage.lineageIds.parents : [])
        ].filter(Boolean);
        const lineageIds = this.normalizeLineageIds({
            ...(entry.lineageIds || hybridGenome?.heritage?.lineageIds || {}),
            parents: explicitParentRefs.length
                ? explicitParentRefs
                : [
                    entry.parentA
                        ? `lineage:${entry.parentA.baseType || entry.parentA.personalityType || '?'}:${entry.parentA.sex || '?'}`
                        : null,
                    entry.parentB
                        ? `lineage:${entry.parentB.baseType || entry.parentB.personalityType || '?'}:${entry.parentB.sex || '?'}`
                        : null
                ].filter(Boolean)
        });
        const personalName = this.getHybridPersonalName(entry, entry.sex || 'M', [
            entry.id,
            entry.sex,
            entry.bornAt,
            entry.parentA?.baseType || entry.parentA?.personalityType || '',
            entry.parentB?.baseType || entry.parentB?.personalityType || ''
        ]);
        const explicitDisambiguator = entry.nameDisambiguator
            || ((String(entry.displayName || entry.name || '').match(/\s+([A-Z])\.$/) || [])[1] || null);
        const displayName = this.formatHybridDisplayName(personalName, explicitDisambiguator);
        return {
            ...entry,
            birthSource: entry.birthSource || 'bred',
            name: displayName,
            displayName,
            personalName,
            nameDisambiguator: explicitDisambiguator,
            inheritedAbility: entry.inheritedAbility || inheritedTraits?.special || null,
            inheritedTraits: inheritedTraits ? this.cloneTrackedTraits(inheritedTraits) : null,
            hybridGenome,
            mutationProfile,
            heritageTags,
            lineageTypes,
            lineageDepth,
            lineageIds
        };
    }

    getLegacySeenTypes(source = {}) {
        const ordered = this.getCanonicalTypeOrder();
        return new Set([
            ...(source?.encounteredButterflies || []),
            ...(source?.collectedButterflies || []),
            ...Object.keys(source?.butterflyCollectionStats || {})
        ].filter(type => ordered.includes(type)));
    }

    getFreshSeedZoneId(gameState, zoneIds = []) {
        return gameState?.freshSeedZoneId || zoneIds?.[0] || null;
    }

    getWildTraitReference() {
        const types = this.getFreshSeedTypes();
        const reference = {};
        for (const key of this.getTrackedTraitKeys()) {
            const total = types.reduce((sum, type) => sum + (BUTTERFLY_PERSONALITIES?.[type]?.traits?.[key] || 0), 0);
            reference[key] = total / Math.max(1, types.length);
        }
        return reference;
    }

    normalizeWildProgress(entry = {}, butterfly = null) {
        const uniquePartnerIds = Array.isArray(entry.partnerHistoryIds)
            ? Array.from(new Set(entry.partnerHistoryIds.filter(Boolean)))
            : [];
        return {
            butterflyId: entry.butterflyId || butterfly?.id || null,
            type: entry.type || butterfly?.personalityType || null,
            seededBy: entry.seededBy || null,
            zoneId: entry.zoneId || butterfly?.currentZoneId || butterfly?.lifeSim?.lifecycle?.currentZoneId || null,
            mateCount: Math.max(0, Math.min(3, entry.mateCount ?? 0)),
            partnerHistoryIds: uniquePartnerIds,
            deathQueued: !!entry.deathQueued,
            departed: !!entry.departed,
            departedAt: entry.departedAt ?? null,
            exitReason: entry.exitReason || null,
            lastBreedAt: entry.lastBreedAt ?? null,
            lastPartnerId: entry.lastPartnerId || null,
            lastPartnerType: entry.lastPartnerType || null,
            releaseCohortId: Number.isFinite(entry.releaseCohortId) ? entry.releaseCohortId : null
        };
    }

    normalizeReleaseBatch(batch = {}) {
        const traitSums = {};
        for (const key of this.getTrackedTraitKeys()) {
            traitSums[key] = Number.isFinite(batch?.traitSums?.[key]) ? batch.traitSums[key] : 0;
        }
        return {
            count: Math.max(0, batch.count || 0),
            traitSums,
            mutationCarriers: Math.max(0, batch.mutationCarriers || 0),
            releasedIds: Array.isArray(batch.releasedIds) ? batch.releasedIds.filter(Boolean).slice(-10) : [],
            lineageCounts: this.normalizeCountMap(batch.lineageCounts),
            zoneCounts: this.normalizeCountMap(batch.zoneCounts)
        };
    }

    summarizeReleaseBatch(batch = {}, gameState = null) {
        const normalizedBatch = this.normalizeReleaseBatch(batch);
        const topLineages = this.getTopCountEntries(normalizedBatch.lineageCounts, 3).map(entry => ({
            id: entry.key,
            label: entry.key,
            count: entry.count,
            share: entry.share
        }));
        const topZones = this.getTopCountEntries(normalizedBatch.zoneCounts, 3).map(entry => ({
            id: entry.key,
            label: this.getZoneLabel(entry.key),
            count: entry.count,
            share: entry.share
        }));
        const focusShare = topLineages[0]?.share || 0;
        const preferredZoneShare = topZones[0]?.share || 0;
        const blendGuard = this.clamp01(
            1
            - Math.max(0, focusShare - 0.5) * 0.35
            - Math.max(0, preferredZoneShare - 0.6) * 0.18
        );
        return {
            count: normalizedBatch.count,
            mutationCarriers: normalizedBatch.mutationCarriers,
            mutationRatio: normalizedBatch.count > 0 ? (normalizedBatch.mutationCarriers / normalizedBatch.count) : 0,
            nextWaveRemaining: Math.max(0, 10 - normalizedBatch.count),
            topLineages,
            topZones,
            focusLineageId: topLineages[0]?.id || null,
            focusShare,
            preferredZoneId: topZones[0]?.id || null,
            preferredZoneShare,
            blendGuard,
            lineageCounts: this.cloneValue(normalizedBatch.lineageCounts, {}),
            zoneCounts: this.cloneValue(normalizedBatch.zoneCounts, {}),
            totalReleases: Math.max(0, gameState?.totalReleases || 0)
        };
    }

    normalizeReleaseHistoryEntry(entry = {}, gameState = null) {
        const normalizedEntry = {
            at: entry.at ?? null,
            cohortId: Number.isFinite(entry.cohortId)
                ? entry.cohortId
                : (Number.isFinite(entry.at) ? entry.at : null),
            releasedIds: Array.isArray(entry.releasedIds) ? entry.releasedIds.filter(Boolean).slice(-10) : [],
            wildBaselineModifiers: this.normalizeWildBaselineModifiers(entry.wildBaselineModifiers),
            batchSummary: {
                count: Math.max(
                    0,
                    entry.batchSummary?.count
                    || entry.count
                    || (Array.isArray(entry.releasedIds) ? entry.releasedIds.length : 0)
                ),
                mutationCarriers: Math.max(0, entry.batchSummary?.mutationCarriers || entry.mutationCarriers || 0),
                lineageCounts: this.normalizeCountMap(entry.batchSummary?.lineageCounts || entry.lineageCounts),
                zoneCounts: this.normalizeCountMap(entry.batchSummary?.zoneCounts || entry.zoneCounts)
            }
        };
        const summary = this.summarizeReleaseBatch(normalizedEntry.batchSummary, gameState);
        normalizedEntry.batchSummary = {
            count: summary.count,
            mutationCarriers: summary.mutationCarriers,
            lineageCounts: this.cloneValue(summary.lineageCounts, {}),
            zoneCounts: this.cloneValue(summary.zoneCounts, {})
        };
        return normalizedEntry;
    }

    getReleaseLineageTypes(butterfly, gameState = null) {
        if (!butterfly) return [];
        const journalEntry = Number.isFinite(butterfly.hybridEntryId)
            ? (gameState?.hybridJournal || []).find(entry => entry.id === butterfly.hybridEntryId) || null
            : null;
        const lineageTypes = Array.from(new Set([
            ...(Array.isArray(butterfly?.lifeSim?.genetics?.lineageTypes) ? butterfly.lifeSim.genetics.lineageTypes : []),
            ...(Array.isArray(journalEntry?.lineageTypes) ? journalEntry.lineageTypes : []),
            ...(Array.isArray(journalEntry?.hybridGenome?.heritage?.lineageTypes) ? journalEntry.hybridGenome.heritage.lineageTypes : []),
            ...(Array.isArray(butterfly?.hybridGenome?.heritage?.lineageTypes) ? butterfly.hybridGenome.heritage.lineageTypes : []),
            journalEntry?.parentA?.baseType || journalEntry?.parentA?.personalityType || null,
            journalEntry?.parentB?.baseType || journalEntry?.parentB?.personalityType || null,
            butterfly?.parentA?.baseType || butterfly?.parentA?.personalityType || null,
            butterfly?.parentB?.baseType || butterfly?.parentB?.personalityType || null
        ].filter(Boolean)));
        if (!lineageTypes.length) {
            const directType = butterfly.baseType || butterfly.personalityType || null;
            if (directType && directType !== 'hybrid') {
                lineageTypes.push(directType);
            }
        }
        return lineageTypes.slice(0, 4);
    }

    getReleaseZoneId(butterfly) {
        return butterfly?.currentZoneId || butterfly?.lifeSim?.lifecycle?.currentZoneId || null;
    }

    getReleaseModifierHighlights(modifiers = {}) {
        return Object.entries(this.normalizeWildBaselineModifiers(modifiers))
            .map(([key, delta]) => ({
                key,
                label: this.getTraitLabel(key),
                delta
            }))
            .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta) || left.key.localeCompare(right.key))
            .filter(entry => Math.abs(entry.delta) > 0.001)
            .slice(0, 3);
    }

    getCurrentReleaseBatchSummary(gameState) {
        this.ensureProgressionContainers(gameState);
        return this.summarizeReleaseBatch(gameState?.currentReleaseBatch, gameState);
    }

    getReleaseHistoryEntry(gameState, cohortId = null) {
        this.ensureProgressionContainers(gameState);
        const releaseHistory = Array.isArray(gameState?.releaseHistory) ? gameState.releaseHistory : [];
        if (cohortId == null) {
            return releaseHistory[0] || null;
        }
        return releaseHistory.find(entry => entry?.cohortId === cohortId) || null;
    }

    getReleaseCohortSummary(gameState, cohortId = null) {
        const entry = this.getReleaseHistoryEntry(gameState, cohortId);
        if (!entry) return null;
        const summary = this.summarizeReleaseBatch(entry.batchSummary, gameState);
        return {
            cohortId: entry.cohortId,
            at: entry.at,
            releasedIds: [...(entry.releasedIds || [])],
            wildBaselineModifiers: this.cloneValue(entry.wildBaselineModifiers, {}),
            modifierHighlights: this.getReleaseModifierHighlights(entry.wildBaselineModifiers),
            ...summary
        };
    }

    getReleaseWavePreferredZoneId(gameState, options = {}) {
        const cohortSummary = this.getReleaseCohortSummary(gameState);
        const fallbackZoneId = options.fallbackZoneId || null;
        if (!cohortSummary?.topZones?.length || (cohortSummary.preferredZoneShare || 0) < 0.34) {
            return fallbackZoneId;
        }
        const candidateZoneIds = cohortSummary.topZones
            .filter(entry => (entry.share || 0) >= 0.18)
            .map(entry => entry.id)
            .filter(Boolean);
        if (!candidateZoneIds.length) return fallbackZoneId;
        const seed = this.buildNameSeed(cohortSummary.cohortId, options.type || '', options.sex || '', options.waveIndex || 0);
        return candidateZoneIds[seed % candidateZoneIds.length] || fallbackZoneId;
    }

    getReleaseEcologyContext(gameState, subject) {
        if (!gameState || !subject) return null;
        this.ensureProgressionContainers(gameState);
        const currentBatch = this.getCurrentReleaseBatchSummary(gameState);
        const isWild = this.isTrackedWildButterfly(subject);
        const isReleasableHybrid = this.isReleasableHybrid(subject);
        const wildProgress = isWild ? this.getWildProgress(gameState, subject) : null;
        const activeCohort = wildProgress?.releaseCohortId
            ? this.getReleaseCohortSummary(gameState, wildProgress.releaseCohortId)
            : this.getReleaseCohortSummary(gameState);
        const lineageTypes = this.getReleaseLineageTypes(subject, gameState);
        const currentZoneId = this.getReleaseZoneId(subject);
        const lineageMatchShare = Math.max(
            0,
            ...lineageTypes.map(type =>
                activeCohort?.topLineages?.find(entry => entry.id === type)?.share || 0
            )
        );
        const preferredZoneId = activeCohort?.preferredZoneId || null;
        return {
            isWild,
            isReleasableHybrid,
            seededBy: wildProgress?.seededBy || null,
            totalReleases: Math.max(0, gameState.totalReleases || 0),
            currentZoneId,
            currentZoneLabel: this.getZoneLabel(currentZoneId),
            releaseLineages: lineageTypes,
            batchCount: currentBatch.count,
            nextWaveRemaining: currentBatch.nextWaveRemaining,
            batchLineages: currentBatch.topLineages,
            batchZones: currentBatch.topZones,
            batchBlendGuard: currentBatch.blendGuard,
            cohortId: activeCohort?.cohortId || null,
            cohortLineages: activeCohort?.topLineages || [],
            cohortZones: activeCohort?.topZones || [],
            preferredZoneId,
            preferredZoneLabel: this.getZoneLabel(preferredZoneId),
            preferredZoneShare: activeCohort?.preferredZoneShare || 0,
            cohortBlendGuard: activeCohort?.blendGuard || 0,
            cohortCount: activeCohort?.count || 0,
            lineageMatchShare,
            cohortZoneMatch: !!preferredZoneId && preferredZoneId === currentZoneId,
            cohortPreferredZoneBoost: this.clamp01((activeCohort?.preferredZoneShare || 0) * 0.18),
            cohortFamiliarityBoost: this.clamp01(lineageMatchShare * 0.22),
            modifierHighlights: activeCohort?.modifierHighlights || []
        };
    }

    normalizeWildBaselineModifiers(modifiers = {}) {
        const next = {};
        for (const key of this.getTrackedTraitKeys()) {
            next[key] = this.clampBaselineModifier(key, modifiers[key] || 0);
        }
        return next;
    }

    ensureProgressionContainers(gameState) {
        if (!gameState) return;

        if (!Array.isArray(gameState.hybridJournal)) {
            gameState.hybridJournal = [];
        } else {
            gameState.hybridJournal = gameState.hybridJournal.map(entry => this.normalizeHybridEntry(entry));
        }
        gameState.nextHybridId = Math.max(1, gameState.nextHybridId || (gameState.hybridJournal.length + 1));

        gameState.ecologyMode = 'wild-release-loop';
        gameState.unlockedButterflyTypes = new Set(this.getFreshSeedTypes());
        gameState.progressionOrderIndex = 0;
        gameState.unlockHistory = [];
        gameState.starterPairsSeeded = (gameState.starterPairsSeeded && typeof gameState.starterPairsSeeded === 'object')
            ? gameState.starterPairsSeeded
            : {};
        gameState.perTypeUnlockStatus = {};
        gameState.perWildButterflyProgress = (gameState.perWildButterflyProgress && typeof gameState.perWildButterflyProgress === 'object')
            ? gameState.perWildButterflyProgress
            : {};
        gameState.goldenButterflySpawned = false;
        gameState.freshSeedZoneId = gameState.freshSeedZoneId || Object.keys(gameState.starterPairsSeeded)[0] || null;
        gameState.releasesSinceRespawn = Math.max(0, gameState.releasesSinceRespawn || 0);
        gameState.totalReleases = Math.max(0, gameState.totalReleases || 0);
        gameState.currentReleaseBatch = this.normalizeReleaseBatch(gameState.currentReleaseBatch);
        gameState.wildBaselineModifiers = this.normalizeWildBaselineModifiers(gameState.wildBaselineModifiers);
        gameState.releaseHistory = Array.isArray(gameState.releaseHistory)
            ? gameState.releaseHistory.map(entry => this.normalizeReleaseHistoryEntry(entry, gameState))
            : [];

        for (const butterflyId of Object.keys(gameState.perWildButterflyProgress)) {
            const existingProgress = gameState.perWildButterflyProgress[butterflyId];
            const normalizedProgress = this.normalizeWildProgress(existingProgress);
            if (existingProgress && typeof existingProgress === 'object') {
                Object.keys(existingProgress).forEach(key => delete existingProgress[key]);
                Object.assign(existingProgress, normalizedProgress);
                gameState.perWildButterflyProgress[butterflyId] = existingProgress;
            } else {
                gameState.perWildButterflyProgress[butterflyId] = normalizedProgress;
            }
        }
    }

    initializeFreshWorldState(gameState, zoneIds = []) {
        if (!gameState) return;

        gameState.hybridJournal = [];
        gameState.nextHybridId = 1;
        gameState.unlockedButterflyTypes = this.getDefaultUnlockedSet();
        gameState.progressionOrderIndex = 0;
        gameState.unlockHistory = [];
        gameState.freshSeedZoneId = zoneIds?.[0] || null;
        gameState.starterPairsSeeded = gameState.freshSeedZoneId ? { [gameState.freshSeedZoneId]: false } : {};
        gameState.perTypeUnlockStatus = {};
        gameState.perWildButterflyProgress = {};
        gameState.goldenButterflySpawned = false;
        gameState.releasesSinceRespawn = 0;
        gameState.totalReleases = 0;
        gameState.currentReleaseBatch = this.normalizeReleaseBatch();
        gameState.wildBaselineModifiers = this.normalizeWildBaselineModifiers();
        gameState.releaseHistory = [];
        this.ensureProgressionContainers(gameState);
    }

    markStarterPairSeeded(gameState, zoneId) {
        if (!gameState || !zoneId) return;
        this.ensureProgressionContainers(gameState);
        gameState.starterPairsSeeded[zoneId] = true;
    }

    markUnlockPairsSeeded(_gameState, _type) {
        return false;
    }

    isTypeUnlocked(_gameState, type) {
        return this.getFreshSeedTypes().includes(type);
    }

    getUnlockedTypes(_gameState, options = {}) {
        const allowGolden = options.allowGolden === true && false;
        return allowGolden ? this.getBaseVariantTypes(true) : this.getFreshSeedTypes();
    }

    getNextUnlockType(_gameState) {
        return null;
    }

    unlockType(_gameState, _type, _options = {}) {
        return false;
    }

    isGoldenUnlocked(_gameState) {
        return false;
    }

    getWildProgress(gameState, butterflyOrId, options = {}) {
        this.ensureProgressionContainers(gameState);
        const butterfly = typeof butterflyOrId === 'object' ? butterflyOrId : null;
        const butterflyId = butterfly?.id || butterflyOrId;
        if (!butterflyId) return null;

        const existing = gameState.perWildButterflyProgress[butterflyId];
        if (existing) {
            return gameState.perWildButterflyProgress[butterflyId] = this.normalizeWildProgress(existing, butterfly);
        }

        if (!butterfly || !this.isTrackedWildButterfly(butterfly) || this.isDebugButterfly(butterfly)) {
            return null;
        }

        const created = this.normalizeWildProgress({
            butterflyId,
            type: butterfly.personalityType,
            seededBy: options.seededBy || 'ambient',
            zoneId: options.zoneId || butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || null
        }, butterfly);
        gameState.perWildButterflyProgress[butterflyId] = created;
        this.applyWildProgressToButterfly(butterfly, created);
        return created;
    }

    applyWildProgressToButterfly(butterfly, progress) {
        if (!butterfly || !progress) return;
        butterfly.wildLifecycle = butterfly.wildLifecycle || {};
        butterfly.wildLifecycle.mateCount = progress.mateCount || 0;
        butterfly.wildLifecycle.partnerHistoryIds = [...(progress.partnerHistoryIds || [])];
        butterfly.wildLifecycle.exitQueued = !!progress.deathQueued;
        butterfly.wildLifecycle.permanentDepartureQueued = !!progress.deathQueued;
        butterfly.wildLifecycle.exitReason = progress.deathQueued
            ? (progress.exitReason || 'wild-mating-limit')
            : (progress.exitReason || null);
    }

    registerWildButterfly(gameState, butterfly, options = {}) {
        if (!this.isTrackedWildButterfly(butterfly) || this.isDebugButterfly(butterfly)) return null;
        const progress = this.getWildProgress(gameState, butterfly, options);
        if (progress) {
            progress.type = butterfly.personalityType || progress.type;
            progress.zoneId = options.zoneId || butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || progress.zoneId;
            if (options.seededBy && !progress.seededBy) {
                progress.seededBy = options.seededBy;
            }
            if (Number.isFinite(options.releaseCohortId)) {
                progress.releaseCohortId = options.releaseCohortId;
            }
            this.applyWildProgressToButterfly(butterfly, progress);
        }
        return progress;
    }

    markWildButterflyDeparted(gameState, butterfly, reason = 'wild-removed') {
        if (!gameState || !butterfly?.id) return null;
        const progress = this.getWildProgress(gameState, butterfly);
        if (!progress) return null;
        progress.deathQueued = false;
        progress.departed = true;
        progress.departedAt = progress.departedAt ?? this.getProgressionTimestamp();
        progress.exitReason = reason;
        progress.zoneId = butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || progress.zoneId;
        this.applyWildProgressToButterfly(butterfly, progress);
        return progress;
    }

    unregisterWildButterfly(gameState, butterfly) {
        if (!gameState || !butterfly?.id) return;
        if (this.isTrackedWildButterfly(butterfly) && !this.isDebugButterfly(butterfly)) {
            this.markWildButterflyDeparted(gameState, butterfly, butterfly.wildLifecycle?.exitReason || 'wild-removed');
            return;
        }
        if (gameState.perWildButterflyProgress && gameState.perWildButterflyProgress[butterfly.id]) {
            delete gameState.perWildButterflyProgress[butterfly.id];
        }
    }

    hasWildPartnerHistory(progress, partnerId) {
        if (!progress || !partnerId) return false;
        return Array.isArray(progress.partnerHistoryIds) && progress.partnerHistoryIds.includes(partnerId);
    }

    isPairAllowedForProgression(gameState, female, male) {
        if (!female?.id || !male?.id) return false;
        if (female.id === male.id) return false;
        if (female.sex !== 'F' || male.sex !== 'M') return false;
        if (this.isDebugButterfly(female) || this.isDebugButterfly(male)) return false;

        this.ensureProgressionContainers(gameState);
        const isEntityAllowed = (entity, partner) => {
            if (!this.isTrackedWildButterfly(entity)) return true;
            const progress = this.registerWildButterfly(gameState, entity);
            if (!progress) return true;
            if (progress.deathQueued || progress.departed) return false;
            if ((progress.mateCount || 0) >= 3) return false;
            if (this.hasWildPartnerHistory(progress, partner.id)) return false;
            return true;
        };

        return isEntityAllowed(female, male) && isEntityAllowed(male, female);
    }

    recordSuccessfulOffspring(gameState, female, male, lifecycleData = null) {
        if (!gameState || !female?.id || !male?.id) {
            return { unlocks: [], departures: [], sameTypePairCompleted: false };
        }

        this.ensureProgressionContainers(gameState);
        const timestamp = this.getProgressionTimestamp();
        const departures = [];

        const registerWildMating = (entity, partner) => {
            if (!this.isTrackedWildButterfly(entity) || this.isDebugButterfly(entity)) return null;
            const progress = this.registerWildButterfly(gameState, entity);
            if (!progress) return null;
            if (!this.hasWildPartnerHistory(progress, partner.id)) {
                progress.partnerHistoryIds.push(partner.id);
            }
            progress.partnerHistoryIds = Array.from(new Set(progress.partnerHistoryIds.filter(Boolean)));
            progress.mateCount = Math.max(0, Math.min(3, (progress.mateCount || 0) + 1));
            progress.lastBreedAt = timestamp;
            progress.lastPartnerId = partner.id;
            progress.lastPartnerType = this.getBreedingType(partner);
            if (progress.mateCount >= 3) {
                progress.deathQueued = true;
                progress.exitReason = progress.exitReason || 'wild-mating-limit';
                departures.push(entity.id);
            }
            this.applyWildProgressToButterfly(entity, progress);
            return progress;
        };

        registerWildMating(female, male);
        registerWildMating(male, female);

        if (lifecycleData) {
            lifecycleData.ecologySnapshot = {
                departures: [...departures]
            };
        }

        this.save(gameState);
        return {
            unlocks: [],
            departures,
            sameTypePairCompleted: false
        };
    }

    getActiveWildVariantCount(gameState, type) {
        if (!gameState || !Array.isArray(gameState.butterflies)) return 0;
        return gameState.butterflies.filter(butterfly =>
            butterfly &&
            !butterfly.isDead?.() &&
            this.isTrackedWildButterfly(butterfly) &&
            !this.isDebugButterfly(butterfly) &&
            butterfly.personalityType === type
        ).length;
    }

    getWildDiscoveryWeight(gameState, type, options = {}) {
        if (!this.isBaseVariantType(type)) return 0;
        if (type === 'golden' && options.allowGolden !== true) return 0;
        if (type === 'golden') return 0;

        const activeCount = options.activeCounts?.[type] ?? this.getActiveWildVariantCount(gameState, type);
        const baseWeights = this.getWildBaseWeights();
        let weight = baseWeights[type] || 0;
        if (weight <= 0) return 0;

        if (activeCount === 0) {
            weight *= 1.08;
        }
        if (activeCount > 0) {
            weight *= Math.pow(0.72, Math.min(activeCount, 4));
        }

        return Math.max(0, weight);
    }

    chooseWildVariant(gameState, options = {}) {
        this.ensureProgressionContainers(gameState);
        const candidates = this.getFreshSeedTypes();
        const weights = [];
        let totalWeight = 0;

        for (const type of candidates) {
            const weight = this.getWildDiscoveryWeight(gameState, type, options);
            if (weight > 0) {
                weights.push({ type, weight });
                totalWeight += weight;
            }
        }

        if (totalWeight <= 0) {
            return candidates[0] || this.getDefaultUnlockedType();
        }

        const roll = (typeof random === 'function' ? random(totalWeight) : Math.random() * totalWeight);
        let cumulative = 0;
        for (const candidate of weights) {
            cumulative += candidate.weight;
            if (roll < cumulative) {
                return candidate.type;
            }
        }

        return weights[weights.length - 1]?.type || candidates[0] || this.getDefaultUnlockedType();
    }

    getLivingHybridCount(gameState) {
        if (!gameState || !Array.isArray(gameState.butterflies)) return 0;
        return gameState.butterflies.filter(butterfly =>
            butterfly &&
            !butterfly.isDead?.() &&
            !this.isTrackedWildButterfly(butterfly) &&
            !this.isDebugButterfly(butterfly)
        ).length;
    }

    getHybridAdultCap() {
        return Math.max(1, gameConfig?.balance?.hybrid?.adultHardCap || 50);
    }

    isHybridCapReached(gameState, extra = 0) {
        return (this.getLivingHybridCount(gameState) + Math.max(0, extra || 0)) >= this.getHybridAdultCap();
    }

    canHybridEmerge(gameState) {
        return this.getLivingHybridCount(gameState) < this.getHybridAdultCap();
    }

    getReleaseTraitPackage(butterfly, gameState) {
        const baselineTraits = typeof statProfileSystem !== 'undefined'
            ? statProfileSystem.getBaselineTraits?.(butterfly, gameState)
            : this.cloneTrackedTraits(butterfly?.traits || {});
        return this.cloneTrackedTraits(baselineTraits || butterfly?.traits || {});
    }

    applyReleaseBatchToWildBaselines(gameState, batch = gameState?.currentReleaseBatch, batchSummary = null) {
        this.ensureProgressionContainers(gameState);
        const normalizedBatch = this.normalizeReleaseBatch(batch);
        if (!normalizedBatch.count) return this.cloneValue(gameState.wildBaselineModifiers, {});

        const reference = this.getWildTraitReference();
        const modifiers = this.normalizeWildBaselineModifiers(gameState.wildBaselineModifiers);
        const summary = batchSummary || this.summarizeReleaseBatch(normalizedBatch, gameState);
        const blendGuard = 0.7 + (summary.blendGuard || 0) * 0.22;

        for (const key of this.getTrackedTraitKeys()) {
            const average = normalizedBatch.traitSums[key] / Math.max(1, normalizedBatch.count);
            const delta = average - (reference[key] || 0);
            const maxDelta = key === 'scareThreshold' ? 0.8 : 0.24;
            const clampedDelta = Math.max(-maxDelta, Math.min(maxDelta, delta));
            modifiers[key] = this.clampBaselineModifier(key, (modifiers[key] * 0.78) + (clampedDelta * 0.22 * blendGuard));
        }

        gameState.wildBaselineModifiers = modifiers;
        return this.cloneValue(modifiers, {});
    }

    getWildSpawnTraits(gameState, type) {
        this.ensureProgressionContainers(gameState);
        const baseTraits = this.cloneTrackedTraits(BUTTERFLY_PERSONALITIES?.[type]?.traits || {});
        const modifiers = this.normalizeWildBaselineModifiers(gameState.wildBaselineModifiers);
        const nextTraits = { ...baseTraits };
        for (const key of this.getTrackedTraitKeys()) {
            nextTraits[key] = this.clampTraitValue(key, (baseTraits[key] || 0) + (modifiers[key] || 0));
        }
        if (baseTraits.special) {
            nextTraits.special = baseTraits.special;
        }
        return nextTraits;
    }

    recordHybridRelease(gameState, butterfly) {
        this.ensureProgressionContainers(gameState);
        if (!this.isReleasableHybrid(butterfly)) {
            return { released: false, waveTriggered: false, batchCount: gameState.currentReleaseBatch.count || 0 };
        }

        const batch = this.normalizeReleaseBatch(gameState.currentReleaseBatch);
        const traitPackage = this.getReleaseTraitPackage(butterfly, gameState);
        for (const key of this.getTrackedTraitKeys()) {
            batch.traitSums[key] += traitPackage[key] || 0;
        }
        batch.count += 1;
        if (butterfly?.mutationProfile?.active || butterfly?.lifeSim?.genetics?.mutationProfile?.active) {
            batch.mutationCarriers += 1;
        }
        for (const lineageType of this.getReleaseLineageTypes(butterfly, gameState)) {
            this.incrementCountMap(batch.lineageCounts, lineageType, 1);
        }
        this.incrementCountMap(batch.zoneCounts, this.getReleaseZoneId(butterfly), 1);
        batch.releasedIds.push(butterfly.id);
        batch.releasedIds = batch.releasedIds.slice(-10);

        gameState.currentReleaseBatch = batch;
        gameState.totalReleases = Math.max(0, gameState.totalReleases || 0) + 1;
        gameState.releasesSinceRespawn = Math.max(0, gameState.releasesSinceRespawn || 0) + 1;

        let waveTriggered = false;
        if (gameState.releasesSinceRespawn >= 10 && batch.count >= 10) {
            const cohortId = gameState.totalReleases;
            const batchSummary = this.summarizeReleaseBatch(batch, gameState);
            const modifiers = this.applyReleaseBatchToWildBaselines(gameState, batch, batchSummary);
            gameState.releaseHistory.unshift({
                cohortId,
                at: this.getProgressionTimestamp(),
                releasedIds: [...batch.releasedIds],
                wildBaselineModifiers: modifiers,
                batchSummary: {
                    count: batchSummary.count,
                    mutationCarriers: batchSummary.mutationCarriers,
                    lineageCounts: this.cloneValue(batchSummary.lineageCounts, {}),
                    zoneCounts: this.cloneValue(batchSummary.zoneCounts, {})
                }
            });
            gameState.releaseHistory = gameState.releaseHistory
                .map(entry => this.normalizeReleaseHistoryEntry(entry, gameState))
                .slice(0, 16);
            gameState.releasesSinceRespawn = 0;
            gameState.currentReleaseBatch = this.normalizeReleaseBatch();
            waveTriggered = true;
        }

        this.save(gameState);
        return {
            released: true,
            waveTriggered,
            batchCount: gameState.currentReleaseBatch.count || 0,
            totalReleases: gameState.totalReleases || 0
        };
    }

    serializeDurableState(gameState) {
        this.ensureProgressionContainers(gameState);
        return {
            ecologyMode: 'wild-release-loop',
            hybridJournal: this.cloneValue(gameState.hybridJournal, []),
            nextHybridId: gameState.nextHybridId || 1,
            progressionOrderIndex: 0,
            unlockedButterflyTypes: this.getFreshSeedTypes(),
            unlockHistory: [],
            starterPairsSeeded: this.cloneValue(gameState.starterPairsSeeded, {}),
            perTypeUnlockStatus: {},
            perWildButterflyProgress: this.cloneValue(gameState.perWildButterflyProgress, {}),
            freshSeedZoneId: gameState.freshSeedZoneId || null,
            releasesSinceRespawn: gameState.releasesSinceRespawn || 0,
            totalReleases: gameState.totalReleases || 0,
            currentReleaseBatch: this.cloneValue(gameState.currentReleaseBatch, this.normalizeReleaseBatch()),
            wildBaselineModifiers: this.cloneValue(gameState.wildBaselineModifiers, this.normalizeWildBaselineModifiers()),
            releaseHistory: this.cloneValue(gameState.releaseHistory, [])
        };
    }

    applyDurableState(gameState, data = {}) {
        if (!gameState) return;
        gameState.hybridJournal = Array.isArray(data.hybridJournal)
            ? data.hybridJournal.map(entry => this.normalizeHybridEntry(entry))
            : [];
        gameState.nextHybridId = Math.max(1, data.nextHybridId || (gameState.hybridJournal.length + 1));
        gameState.unlockedButterflyTypes = this.getDefaultUnlockedSet();
        gameState.progressionOrderIndex = 0;
        gameState.unlockHistory = [];
        gameState.starterPairsSeeded = this.cloneValue(data.starterPairsSeeded, {});
        gameState.perTypeUnlockStatus = {};
        gameState.perWildButterflyProgress = this.cloneValue(data.perWildButterflyProgress, {});
        gameState.freshSeedZoneId = data.freshSeedZoneId || Object.keys(gameState.starterPairsSeeded || {})[0] || null;
        gameState.releasesSinceRespawn = Math.max(0, data.releasesSinceRespawn || 0);
        gameState.totalReleases = Math.max(0, data.totalReleases || 0);
        gameState.currentReleaseBatch = this.normalizeReleaseBatch(data.currentReleaseBatch);
        gameState.wildBaselineModifiers = this.normalizeWildBaselineModifiers(data.wildBaselineModifiers);
        gameState.releaseHistory = Array.isArray(data.releaseHistory) ? data.releaseHistory : [];
        this.ensureProgressionContainers(gameState);
        this.refreshLivingHybridDisplayNames(gameState);
    }

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
        try {
            localStorage.setItem(PAPILIONEM_PROGRESS_KEY, JSON.stringify(this.serializeDurableState(gameState)));
        } catch (error) {
            console.warn('ProgressionManager: Failed to save progression', error);
        }
    }

    applyToGameState(gameState) {
        const data = this.load();
        if (!data || !gameState) return;
        this.applyDurableState(gameState, data);
    }

    clear() {
        if (typeof localStorage === 'undefined') return;
        localStorage.removeItem(PAPILIONEM_PROGRESS_KEY);
    }

    makeHybridEntry(gameState, butterfly, parentA, parentB) {
        const id = gameState.nextHybridId || 1;
        gameState.nextHybridId = id + 1;
        const baselineTraits = typeof statProfileSystem !== 'undefined'
            ? statProfileSystem.getBaselineTraits?.(butterfly, gameState)
            : this.cloneTrackedTraits(butterfly.traits || {});
        const inheritedAbility = typeof statProfileSystem !== 'undefined'
            ? statProfileSystem.getAbilityForSubject?.(butterfly)
            : ((typeof butterfly.getSpecialAbility === 'function'
                ? butterfly.getSpecialAbility()
                : butterfly.traits.special) || null);
        const mutationProfile = this.cloneValue(
            butterfly?.mutationProfile || butterfly?.lifeSim?.genetics?.mutationProfile,
            null
        );
        const genetics = this.cloneValue(butterfly?.lifeSim?.genetics, {}) || {};

        const personalName = this.pickHybridPersonalName(butterfly.sex || 'M', [
            id,
            butterfly.sex,
            parentA?.baseType || parentA?.personalityType || '',
            parentB?.baseType || parentB?.personalityType || '',
            butterfly.hybridGenome?.ability || butterfly.hybridGenome?.baseType || ''
        ]);
        const entry = {
            id,
            name: personalName,
            displayName: personalName,
            personalName,
            nameDisambiguator: null,
            sex: butterfly.sex,
            bornAt: Date.now(),
            renderSpec: butterfly.getRenderSpec(),
            parentA,
            parentB,
            hybridGenome: butterfly.hybridGenome || null,
            birthSource: butterfly.birthSource || 'bred',
            inheritedTraits: this.cloneTrackedTraits(baselineTraits || {}),
            inheritedAbility,
            mutationProfile,
            heritageTags: Array.isArray(genetics.heritageTags) ? [...genetics.heritageTags] : [],
            lineageTypes: Array.isArray(genetics.lineageTypes) ? [...genetics.lineageTypes] : [],
            lineageDepth: Math.max(0, genetics.lineageDepth || 0),
            lineageIds: this.normalizeLineageIds(genetics.lineageIds || {})
        };

        if (!Array.isArray(gameState.hybridJournal)) {
            gameState.hybridJournal = [];
        }

        gameState.hybridJournal.unshift(this.normalizeHybridEntry(entry));
        this.refreshLivingHybridDisplayNames(gameState);
        this.save(gameState);
        return gameState.hybridJournal[0];
    }

    renameHybrid(gameState, id, name) {
        if (!Array.isArray(gameState.hybridJournal)) return false;
        const entry = gameState.hybridJournal.find(item => item.id === id);
        if (!entry) return false;

        entry.personalName = name;
        entry.displayName = name;
        entry.name = name;
        entry.nameDisambiguator = null;
        const liveButterfly = (gameState?.butterflies || []).find(butterfly => butterfly.hybridEntryId === id) || null;
        if (liveButterfly) {
            this.applyHybridIdentityToSubject(liveButterfly, name, null);
        }
        this.refreshLivingHybridDisplayNames(gameState);
        this.save(gameState);
        return true;
    }

    resetAll(gameState) {
        this.clear();
        if (!gameState) return;

        gameState.hybridJournal = [];
        gameState.nextHybridId = 1;
        gameState.unlockedButterflyTypes = new Set();
        gameState.progressionOrderIndex = 0;
        gameState.unlockHistory = [];
        gameState.starterPairsSeeded = {};
        gameState.perTypeUnlockStatus = {};
        gameState.perWildButterflyProgress = {};
        gameState.goldenButterflySpawned = false;
        gameState.butterflySpawnCounts = {};
        gameState.freshSeedZoneId = null;
        gameState.releasesSinceRespawn = 0;
        gameState.totalReleases = 0;
        gameState.currentReleaseBatch = this.normalizeReleaseBatch();
        gameState.wildBaselineModifiers = this.normalizeWildBaselineModifiers();
        gameState.releaseHistory = [];
    }
}

const progressionManager = new ProgressionManager();
