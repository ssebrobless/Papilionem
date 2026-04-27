class BreedingSystem {
    constructor() {
        this.refreshConfig();
    }

    getHybridBalance() {
        return gameConfig?.balance?.hybrid || {};
    }

    refreshConfig() {
        const hybridBalance = this.getHybridBalance();
        this.pheromoneRadius = hybridBalance.pheromoneRadius ?? 150;
        this.matingDistance = hybridBalance.matingDistance ?? 18;
        this.matingDuration = hybridBalance.matingDurationFrames ?? 120;
        this.pheromoneCooldownFrames = hybridBalance.pheromoneCooldownFrames ?? (60 * 300);
        this.adultHardCap = hybridBalance.adultHardCap ?? 50;
        this.zoneAdultSoftCap = hybridBalance.zoneAdultSoftCap ?? 8;
        this.zoneReservationCap = hybridBalance.zoneReservationCap ?? 2;
        this.matingFreezePressure = hybridBalance.matingFreezePressure ?? 0.82;
        this.zoneFreezePressure = hybridBalance.zoneFreezePressure ?? 0.88;
        this.minZoneFlowersForBreeding = hybridBalance.minZoneFlowersForBreeding ?? 2;
        this.minEggHatchFrames = hybridBalance.eggHatchFrames?.min ?? (60 * 420);
        this.maxEggHatchFrames = hybridBalance.eggHatchFrames?.max ?? (60 * 600);
        this.minCocoonHatchFrames = hybridBalance.cocoonHatchFrames?.min ?? (60 * 420);
        this.maxCocoonHatchFrames = hybridBalance.cocoonHatchFrames?.max ?? (60 * 600);
        this.mutationChance = hybridBalance.mutationChance ?? 0.2;
        this.majorMutationChance = hybridBalance.majorMutationChance ?? 0.06;
        this.mutationDeltaMin = hybridBalance.mutationDeltaMin ?? 0.08;
        this.mutationDeltaMax = hybridBalance.mutationDeltaMax ?? 0.24;
        this.majorMutationDeltaMin = hybridBalance.majorMutationDeltaMin ?? 0.18;
        this.majorMutationDeltaMax = hybridBalance.majorMutationDeltaMax ?? 0.42;
        this.maxMutatedTraits = hybridBalance.maxMutatedTraits ?? 2;
    }

    getTrackedTraitKeys() {
        return typeof statProfileSystem !== 'undefined' && typeof statProfileSystem.getTrackedTraitKeys === 'function'
            ? statProfileSystem.getTrackedTraitKeys()
            : ['speed', 'jitteriness', 'trustPropensity', 'trustSpeed', 'scareThreshold', 'happinessBonus'];
    }

    clampTraitValue(key, value) {
        if (typeof statProfileSystem !== 'undefined' && typeof statProfileSystem.clampTraitValue === 'function') {
            return statProfileSystem.clampTraitValue(key, value);
        }
        const floor = key === 'scareThreshold' ? 0.5 : 0.05;
        return Math.max(floor, Number.isFinite(value) ? value : floor);
    }

    pickRandomItems(values = [], count = 1) {
        const available = [...values];
        const picked = [];
        while (available.length && picked.length < count) {
            const index = Math.floor(random(available.length));
            picked.push(available.splice(index, 1)[0]);
        }
        return picked;
    }

    buildMutationProfile(baseTraits = {}, options = {}) {
        const forceMutation = !!options.forceMutation;
        if (!forceMutation && random() >= this.mutationChance) {
            return null;
        }

        const candidateKeys = this.getTrackedTraitKeys();
        const desiredCount = Math.max(1, Math.min(
            this.maxMutatedTraits,
            options.mutatedTraitCount || (random() < 0.34 ? 2 : 1)
        ));
        const mutatedKeys = this.pickRandomItems(candidateKeys, desiredCount);
        const mutatedTraits = [];

        for (const key of mutatedKeys) {
            const major = options.forceMajor || random() < this.majorMutationChance;
            const minDelta = major ? this.majorMutationDeltaMin : this.mutationDeltaMin;
            const maxDelta = major ? this.majorMutationDeltaMax : this.mutationDeltaMax;
            const direction = random() < 0.5 ? -1 : 1;
            const before = typeof baseTraits[key] === 'number' ? baseTraits[key] : 0;
            const after = this.clampTraitValue(key, before + (random(minDelta, maxDelta) * direction));
            const delta = after - before;

            if (Math.abs(delta) < 0.01) continue;

            mutatedTraits.push({
                key,
                before,
                after,
                delta,
                intensity: major ? 'major' : 'minor'
            });
        }

        if (!mutatedTraits.length) {
            return null;
        }

        const tier = mutatedTraits.some(trait => trait.intensity === 'major') ? 'major' : 'minor';
        const signature = mutatedTraits
            .map(trait => `${trait.key}:${trait.delta >= 0 ? '+' : ''}${trait.delta.toFixed(2)}`)
            .join(', ');

        return {
            active: true,
            tier,
            mutatedTraits,
            signature,
            summary: `${tier} mutation in ${mutatedTraits.length} trait${mutatedTraits.length === 1 ? '' : 's'}`
        };
    }

    ensureState(gameState) {
        gameState.pendingOffspringReservations = gameState.pendingOffspringReservations || 0;
        gameState.hybridJournal = gameState.hybridJournal || [];
        gameState.nextHybridId = gameState.nextHybridId || 1;

        for (const butterfly of gameState.butterflies || []) {
            this.ensureButterflyData(butterfly);
        }

        for (const flower of gameState.flowers || []) {
            if (typeof flower.ensureLifecycleData === 'function') {
                flower.ensureLifecycleData();
            }
        }
    }

    ensureButterflyData(butterfly) {
        if (butterfly.sex !== 'M' && butterfly.sex !== 'F') {
            butterfly.sex = random() < 0.5 ? 'M' : 'F';
        }

        butterfly.birthSource = butterfly.birthSource || 'wild';
        butterfly.fertilityUsesRemaining = butterfly.fertilityUsesRemaining ?? (butterfly.birthSource === 'bred'
            ? (this.getHybridBalance().bredFertilityUses ?? 1)
            : Infinity);
        butterfly.pheromoneCooldownUntil = butterfly.pheromoneCooldownUntil || 0;
        butterfly.breeding = butterfly.breeding || {};
        butterfly.pregnancy = butterfly.pregnancy || null;
        butterfly.hybridGenome = butterfly.hybridGenome || null;
        butterfly.isHybrid = !!butterfly.hybridGenome;
        butterfly.mutationProfile = butterfly.mutationProfile || butterfly.lifeSim?.genetics?.mutationProfile || null;
        butterfly.offspringReservationActive = !!butterfly.offspringReservationActive;
        butterfly.wildLifecycle = butterfly.wildLifecycle || {};
        butterfly.wildLifecycle.entryDirection = butterfly.wildLifecycle.entryDirection || (random() < 0.5 ? 'left' : 'right');
        butterfly.wildLifecycle.exitQueued = !!butterfly.wildLifecycle.exitQueued;
        butterfly.wildLifecycle.exitAfterEgg = !!butterfly.wildLifecycle.exitAfterEgg;
        butterfly.wildLifecycle.hasBred = !!butterfly.wildLifecycle.hasBred;
        butterfly.wildLifecycle.exitReason = butterfly.wildLifecycle.exitReason || null;
        butterfly.wildLifecycle.mateCount = Math.max(0, Math.min(3, butterfly.wildLifecycle.mateCount || 0));
        butterfly.wildLifecycle.partnerHistoryIds = Array.isArray(butterfly.wildLifecycle.partnerHistoryIds)
            ? Array.from(new Set(butterfly.wildLifecycle.partnerHistoryIds.filter(Boolean)))
            : [];
        butterfly.breeding.requestedMateId = butterfly.breeding.requestedMateId || null;
        butterfly.breeding.lastMateId = butterfly.breeding.lastMateId || null;
    }

    isResidentButterfly(butterfly) {
        return butterfly?.birthSource === 'bred';
    }

    getResidentAdultCount(gameState) {
        return (gameState?.butterflies || []).filter(butterfly => this.isResidentButterfly(butterfly)).length;
    }

    getWildAdultCount(gameState) {
        return (gameState?.butterflies || []).filter(butterfly => !this.isResidentButterfly(butterfly)).length;
    }

    getTotalAdultCount(gameState) {
        return (gameState?.butterflies || []).length;
    }

    update(gameState, particleSystem) {
        this.refreshConfig();
        this.ensureState(gameState);
        this.updateAttraction(gameState);
        this.updateMatings(gameState, particleSystem);
        this.updatePregnancies(gameState);
        this.updateFlowerLifecycle(gameState, particleSystem);
    }

    updateAttraction(gameState) {
        const males = gameState.butterflies.filter(b => this.isEligibleMale(b, gameState));
        const females = gameState.butterflies.filter(b => this.isEligibleFemale(b, gameState));

        for (const female of females) {
            let bestMale = null;
            let bestScore = Infinity;
            const requestedMale = female.breeding?.requestedMateId
                ? gameState.butterflies.find(butterfly => butterfly.id === female.breeding.requestedMateId) || null
                : null;

            if (female.breeding?.requestedMateId && !requestedMale) {
                female.breeding.requestedMateId = null;
            } else if (requestedMale?.id) {
                if (requestedMale.breeding?.requestedMateId !== female.id || requestedMale.sex !== 'M') {
                    female.breeding.requestedMateId = null;
                } else if (
                    this.getEntityZoneId(requestedMale, null) === this.getEntityZoneId(female, null) &&
                    this.isEligibleMale(requestedMale, gameState) &&
                    progressionManager?.isPairAllowedForProgression?.(gameState, female, requestedMale)
                ) {
                    const dx = requestedMale.x - female.x;
                    const dy = requestedMale.y - female.y;
                    bestMale = requestedMale;
                    bestScore = Math.hypot(dx, dy);
                }
            }

            for (const male of (bestMale || female.breeding?.requestedMateId) ? [] : males) {
                if (this.getEntityZoneId(male, null) !== this.getEntityZoneId(female, null)) continue;
                const dx = male.x - female.x;
                const dy = male.y - female.y;
                const dist = Math.hypot(dx, dy);
                if (dist > this.pheromoneRadius) continue;
                if (male.breeding.partnerId || female.breeding.partnerId) continue;
                if (!progressionManager?.isPairAllowedForProgression?.(gameState, female, male)) continue;

                if (dist < bestScore) {
                    bestScore = dist;
                    bestMale = male;
                }
            }

            female.breeding.attractedMaleId = bestMale ? bestMale.id : null;
            female.breeding.attractionStrength = bestMale ? (1 - (bestScore / this.pheromoneRadius)) : 0;

            if (bestMale && female.state === 'normal') {
                const targetGrid = gridManager.screenToIso(bestMale.x, bestMale.y);
                const wobble = map(1 - female.breeding.attractionStrength, 0, 1, 0.02, 0.12);
                female.movement.setTarget(targetGrid.x, targetGrid.y, 'pheromone', 4, wobble);
            } else if (!bestMale && female.movement.targetType === 'pheromone') {
                female.movement.clearTarget('pheromone');
            }
        }
    }

    updateMatings(gameState, particleSystem) {
        const butterflies = gameState.butterflies;

        for (const female of butterflies) {
            if (!this.isEligibleFemale(female, gameState)) continue;
            const male = butterflies.find(item => item.id === female.breeding.attractedMaleId);
            if (!male || !this.isEligibleMale(male, gameState)) continue;

            const dx = male.x - female.x;
            const dy = male.y - female.y;
            if (dx * dx + dy * dy <= this.matingDistance * this.matingDistance) {
                this.startMating(female, male);
            }
        }

        for (const butterfly of butterflies) {
            if (butterfly.state !== 'mating') continue;
            const partner = butterflies.find(item => item.id === butterfly.breeding.partnerId);
            if (!partner) {
                butterfly.changeState('normal');
                butterfly.breeding.partnerId = null;
                butterfly.breeding.matingTimer = 0;
                continue;
            }

            butterfly.breeding.matingTimer = Math.max(0, (butterfly.breeding.matingTimer || 0) - 1);

            const midpointX = (butterfly.x + partner.x) / 2;
            const midpointY = (butterfly.y + partner.y) / 2;
            const offset = butterfly.sex === 'M' ? -4 : 4;
            const targetGrid = gridManager.screenToIso(midpointX + offset, midpointY);
            butterfly.movement.setTarget(targetGrid.x, targetGrid.y, 'mating', 12, 0);

            if (butterfly.sex === 'F' && typeof eventBus !== 'undefined' && frameCount % 18 === 0) {
                eventBus.emit('mating:visual', {
                    x: midpointX,
                    y: midpointY - 6
                });
            }

            if (butterfly.sex === 'F' && butterfly.breeding.matingTimer === 0 && !butterfly.breeding.matingResolved) {
                this.completeMating(butterfly, partner, gameState, particleSystem);
            }
        }
    }

    updatePregnancies(gameState) {
        for (const butterfly of gameState.butterflies) {
            if (!butterfly.pregnancy?.active) continue;

            let flower = butterfly.pregnancy.targetFlower;
            if (!flower || !gameState.flowers.includes(flower) || !flower.canReceiveEggFrom(butterfly)) {
                flower = this.findNearestFlowerForEgg(butterfly, gameState.flowers);
                butterfly.pregnancy.targetFlower = flower;
            }

            if (butterfly.state !== 'pregnant-travel') {
                butterfly.changeState('pregnant-travel', { flower });
            }

            if (!flower) continue;

            const dx = butterfly.x - flower.x;
            const dy = butterfly.y - flower.y;
            if (dx * dx + dy * dy <= 12 * 12) {
                this.layEggAndFeed(butterfly, flower);
            }
        }
    }

    updateFlowerLifecycle(gameState, particleSystem) {
        for (let i = gameState.flowers.length - 1; i >= 0; i--) {
            const flower = gameState.flowers[i];
            this.normalizeLifecycleTiming(flower);
            if (flower.occupancyState === 'egg' && flower.eggData && frameCount >= flower.eggData.hatchFrame) {
                this.hatchEggFlowerAtIndex(gameState, i);
                continue;
            }

            if (flower.occupancyState === 'chrysalis' && flower.chrysalisData && frameCount >= flower.chrysalisData.hatchFrame) {
                this.hatchChrysalisFlower(flower, gameState, particleSystem);
            }
        }

        for (let i = gameState.caterpillars.length - 1; i >= 0; i--) {
            const caterpillar = gameState.caterpillars[i];
            if (caterpillar.isDead()) {
                if (caterpillar.lifecycleData?.reservationActive) {
                    gameState.pendingOffspringReservations = Math.max(0, gameState.pendingOffspringReservations - 1);
                }
                gameState.caterpillars.splice(i, 1);
            }
        }
    }

    hatchEggFlowerAtIndex(gameState, flowerIndex) {
        const flower = gameState?.flowers?.[flowerIndex];
        if (!flower || flower.occupancyState !== 'egg' || !flower.eggData) return null;

        const lifecycleData = {
            ...(flower.eggData.lifecycleData || {}),
            currentZoneId: flower.currentZoneId || flower.eggData.lifecycleData?.currentZoneId || null
        };
        const caterpillar = new Caterpillar(flower.x, flower.y, lifecycleData, {
            currentZoneId: lifecycleData.currentZoneId
        });
        gameState.caterpillars.push(caterpillar);

        if (typeof eventBus !== 'undefined' && GameEvents?.CATERPILLAR_HATCHED) {
            eventBus.emit(GameEvents.CATERPILLAR_HATCHED, {
                caterpillar,
                flowerId: flower.id,
                lifecycleData: flower.eggData.lifecycleData || null
            });
        }

        gameState.flowers.splice(flowerIndex, 1);
        return caterpillar;
    }

    hatchChrysalisFlower(flower, gameState, particleSystem) {
        if (!flower || flower.occupancyState !== 'chrysalis' || !flower.chrysalisData || flower.chrysalisData.hasHatched) {
            return null;
        }

        if (!progressionManager?.canHybridEmerge?.(gameState)) {
            if (flower.chrysalisData.lifecycleData?.reservationActive) {
                flower.chrysalisData.lifecycleData.reservationActive = false;
                gameState.pendingOffspringReservations = Math.max(0, (gameState.pendingOffspringReservations || 0) - 1);
            }
            flower.chrysalisData.hasHatched = true;
            flower.chrysalisData.hatchedAt = frameCount;
            flower.chrysalisData.hatchOutcome = 'hybrid-cap-death';
            flower.startPostHatchFade();
            if (typeof eventBus !== 'undefined') {
                eventBus.emit('lifecycle:hybridHatchBlocked', {
                    flowerId: flower.id,
                    zoneId: flower.currentZoneId || flower.chrysalisData.lifecycleData?.currentZoneId || null
                });
            }
            return null;
        }

        const adult = this.spawnHybridButterfly(
            flower.x,
            flower.y,
            flower.chrysalisData.lifecycleData,
            gameState,
            particleSystem
        );

        if (adult) {
            flower.chrysalisData.hasHatched = true;
            flower.chrysalisData.hatchedAt = frameCount;
            flower.chrysalisData.hatchOutcome = 'born';
            flower.startPostHatchFade();
            return adult;
        }

        flower.chrysalisData.hatchFrame = frameCount + 60;
        return null;
    }

    normalizeLifecycleTiming(flower) {
        if (flower.occupancyState === 'egg' && flower.eggData) {
            const maxAllowed = frameCount + this.maxEggHatchFrames;
            if (flower.eggData.hatchFrame > maxAllowed) {
                flower.eggData.hatchFrame = maxAllowed;
            }
        }

        if (flower.occupancyState === 'chrysalis' && flower.chrysalisData && !flower.chrysalisData.hasHatched) {
            const maxAllowed = frameCount + this.maxCocoonHatchFrames;
            if (flower.chrysalisData.hatchFrame > maxAllowed) {
                flower.chrysalisData.hatchFrame = maxAllowed;
            }
        }
    }

    refreshMaleCooldowns(gameState) {
        for (const butterfly of gameState.butterflies) {
            this.ensureButterflyData(butterfly);
            if (butterfly.sex === 'M') {
                butterfly.pheromoneCooldownUntil = frameCount;
            }
        }
    }

    getEntityZoneId(entity, fallback = null) {
        return entity?.currentZoneId ||
            entity?.lifeSim?.lifecycle?.currentZoneId ||
            entity?.lifecycleData?.currentZoneId ||
            fallback ||
            null;
    }

    hatchAllEggs(gameState) {
        for (let i = gameState.flowers.length - 1; i >= 0; i--) {
            const flower = gameState.flowers[i];
            if (flower.occupancyState === 'egg' && flower.eggData) {
                flower.eggData.hatchFrame = frameCount;
                this.hatchEggFlowerAtIndex(gameState, i);
            }
        }
    }

    hatchAllCocoons(gameState) {
        for (const flower of gameState.flowers) {
            if (flower.occupancyState === 'chrysalis' && flower.chrysalisData) {
                flower.chrysalisData.hatchFrame = frameCount;
                this.hatchChrysalisFlower(flower, gameState, gameState.particleSystem || gameCore?.particleSystem || null);
            }
        }
    }

    spawnFlowersAtCaterpillars(gameState) {
        for (const caterpillar of gameState.caterpillars) {
            const zoneId = this.getEntityZoneId(caterpillar, null);
            const flower = gameCore?.spawnFlowerAt?.(zoneId, caterpillar.x, caterpillar.y, {
                exactPoint: true,
                minDistance: 0,
                maxAttempts: 1
            });
            if (!flower) continue;
            flower.ensureLifecycleData();
            flower.stage = 'mature';
            flower.stageTimer = 0;
            flower.becomeChrysalisFlower(caterpillar.lifecycleData);
            caterpillar.dead = true;
        }
    }

    isEligibleMale(butterfly, gameState) {
        this.ensureButterflyData(butterfly);
        const zoneId = this.getEntityZoneId(butterfly, null);
        if (butterfly.sex !== 'M') return false;
        if (butterfly.state !== 'normal') return false;
        if (butterfly.pheromoneCooldownUntil > frameCount) return false;
        if (butterfly.isSpawning) return false;
        if (butterfly.wildLifecycle?.exitQueued) return false;
        if (butterfly.pregnancy?.active) return false;
        if (butterfly.breeding.partnerId) return false;
        if (!this.canReproduce(butterfly)) return false;
        if (!this.canZoneSupportOffspring(zoneId, gameState)) return false;
        return true;
    }

    isEligibleFemale(butterfly, gameState = null) {
        this.ensureButterflyData(butterfly);
        const zoneId = this.getEntityZoneId(butterfly, null);
        if (butterfly.sex !== 'F') return false;
        if (butterfly.state !== 'normal') return false;
        if (butterfly.isSpawning) return false;
        if (butterfly.wildLifecycle?.exitQueued) return false;
        if (butterfly.pregnancy?.active) return false;
        if (butterfly.breeding.partnerId) return false;
        if (gameState && !this.canZoneSupportOffspring(zoneId, gameState)) return false;
        return this.canReproduce(butterfly);
    }

    canReproduce(butterfly) {
        return butterfly.fertilityUsesRemaining === Infinity || butterfly.fertilityUsesRemaining > 0;
    }

    getGlobalPopulationPressure(gameState) {
        const activeAdults = this.getResidentAdultCount(gameState);
        const pending = gameState?.pendingOffspringReservations || 0;
        return (activeAdults + pending) / Math.max(1, this.adultHardCap);
    }

    getZonePopulationPressure(zoneId, gameState) {
        const stats = this.getZoneStats(gameState, zoneId);
        return (stats.residentButterflies + stats.pendingReservations) / Math.max(1, this.zoneAdultSoftCap);
    }

    getZoneStats(gameState, zoneId) {
        const inZone = (entity) => this.getEntityZoneId(entity, null) === zoneId;
        const butterflies = (gameState.butterflies || []).filter(inZone);
        const residentButterflies = butterflies.filter(entity => this.isResidentButterfly(entity)).length;
        const wildButterflies = butterflies.length - residentButterflies;
        const flowers = (gameState.flowers || []).filter(inZone);
        const pendingReservations = butterflies.filter(entity => entity?.pregnancy?.active).length;
        const availableFlowers = flowers.filter(flower => {
            if (!flower) return false;
            if (typeof flower.ensureLifecycleData === 'function') {
                flower.ensureLifecycleData();
            }
            return flower.occupancyState === 'normal' &&
                flower.stage !== 'dissolve' &&
                !flower.currentFeeder;
        }).length;
        return {
            butterflies: butterflies.length,
            residentButterflies,
            wildButterflies,
            flowers: flowers.length,
            pendingReservations,
            availableFlowers
        };
    }

    canZoneSupportOffspring(zoneId, gameState) {
        if (!zoneId || !gameState) return true;
        const stats = this.getZoneStats(gameState, zoneId);
        const zonePressure = this.getZonePopulationPressure(zoneId, gameState);
        if (zonePressure >= this.zoneFreezePressure) return false;
        if (stats.residentButterflies + stats.pendingReservations >= this.zoneAdultSoftCap) return false;
        if (stats.pendingReservations >= this.zoneReservationCap) return false;
        if (stats.flowers < this.minZoneFlowersForBreeding) return false;
        if (stats.availableFlowers <= stats.pendingReservations) return false;
        if (stats.availableFlowers <= 0) return false;
        return true;
    }

    canZoneAcceptEmergingAdult(zoneId, gameState) {
        return true;
    }

    startMating(female, male) {
        if (female.state === 'mating' || male.state === 'mating') return;

        female.breeding.requestedMateId = null;
        male.breeding.requestedMateId = null;
        female.breeding.partnerId = male.id;
        male.breeding.partnerId = female.id;
        female.breeding.matingTimer = this.matingDuration;
        male.breeding.matingTimer = this.matingDuration;
        female.breeding.matingResolved = false;
        male.breeding.matingResolved = false;
        female.changeState('mating', { partnerId: male.id });
        male.changeState('mating', { partnerId: female.id });
    }

    clearRequestedMate(butterfly, gameState = null) {
        if (!butterfly?.breeding) return;
        const requestedMateId = butterfly.breeding.requestedMateId || null;
        butterfly.breeding.requestedMateId = null;
        if (!requestedMateId || !gameState) return;
        const requestedMate = (gameState.butterflies || []).find(entry => entry.id === requestedMateId) || null;
        if (requestedMate?.breeding?.requestedMateId === butterfly.id) {
            requestedMate.breeding.requestedMateId = null;
        }
    }

    requestMatePair(source, candidate, gameState = null) {
        if (!source?.id || !candidate?.id || source.id === candidate.id) return false;
        this.ensureButterflyData(source);
        this.ensureButterflyData(candidate);
        this.clearRequestedMate(source, gameState);
        this.clearRequestedMate(candidate, gameState);
        source.breeding.requestedMateId = candidate.id;
        candidate.breeding.requestedMateId = source.id;
        return true;
    }

    completeMating(female, male, gameState, particleSystem) {
        if (female.breeding.matingResolved) return;
        const zoneId = this.getEntityZoneId(female, this.getEntityZoneId(male, null));
        if (!this.canZoneSupportOffspring(zoneId, gameState)) {
            female.breeding.partnerId = null;
            male.breeding.partnerId = null;
            female.changeState('normal');
            male.changeState('normal');
            return;
        }

        female.breeding.matingResolved = true;
        male.breeding.matingResolved = true;
        if ((female.birthSource || 'wild') === 'wild') {
            female.wildLifecycle.hasBred = true;
        }
        if ((male.birthSource || 'wild') === 'wild') {
            male.wildLifecycle.hasBred = true;
        }

        if (female.fertilityUsesRemaining !== Infinity) {
            female.fertilityUsesRemaining = Math.max(0, female.fertilityUsesRemaining - 1);
        }
        if (male.fertilityUsesRemaining !== Infinity) {
            male.fertilityUsesRemaining = Math.max(0, male.fertilityUsesRemaining - 1);
        }

        male.pheromoneCooldownUntil = frameCount + this.pheromoneCooldownFrames;

        const lifecycleData = this.createLifecycleData(female, male);
        const targetFlower = this.findNearestFlowerForEgg(female, gameState.flowers);
        if (!targetFlower) {
            female.breeding.partnerId = null;
            male.breeding.partnerId = null;
            female.changeState('normal');
            male.changeState('normal');
            return;
        }
        female.pregnancy = {
            active: true,
            lifecycleData,
            targetFlower
        };
        female.breeding.lastMateId = male.id;
        male.breeding.lastMateId = female.id;
        gameState.pendingOffspringReservations++;

        if (particleSystem) {
            const crowdPressure = this.getGlobalPopulationPressure(gameState);
            if (crowdPressure < 0.72) {
                particleSystem.emitBurst(female.x, female.y, [255, 255, 255], 10);
                particleSystem.emitBurst(male.x, male.y, [255, 220, 255], 10);
            }
        }

        female.breeding.partnerId = null;
        male.breeding.partnerId = null;
        female.changeState('normal');
        male.changeState('normal');
    }

    getLineageRecordForEntity(entity, gameState = gameCore?.gameState) {
        if (!entity) return null;
        if (entity.hybridEntryId && Array.isArray(gameState?.hybridJournal)) {
            return gameState.hybridJournal.find(entry => entry.id === entity.hybridEntryId) || entity;
        }
        return entity;
    }

    buildLineageRef(entity, gameState = gameCore?.gameState) {
        if (!entity) return null;
        const record = this.getLineageRecordForEntity(entity, gameState);
        if (record?.id && record?.parentA && record?.parentB) {
            return `hybrid:${record.id}`;
        }
        if (entity.hybridEntryId) {
            return `hybrid:${entity.hybridEntryId}`;
        }
        if (entity.id) {
            return entity.id;
        }
        const type = entity.personalityType || record?.personalityType || record?.baseType || null;
        return type ? `${type}:${entity.sex || record?.sex || '?'}` : null;
    }

    getLineageTypesForEntity(entity, gameState = gameCore?.gameState) {
        if (!entity) return [];
        const record = this.getLineageRecordForEntity(entity, gameState);
        const geneticsTypes = Array.isArray(entity?.lifeSim?.genetics?.lineageTypes)
            ? entity.lifeSim.genetics.lineageTypes
            : [];
        const recordTypes = Array.isArray(record?.lineageTypes)
            ? record.lineageTypes
            : [];
        const heritageTypes = Array.isArray(record?.hybridGenome?.heritage?.lineageTypes)
            ? record.hybridGenome.heritage.lineageTypes
            : Array.isArray(entity?.hybridGenome?.heritage?.lineageTypes)
                ? entity.hybridGenome.heritage.lineageTypes
                : [];
        const directTypes = [
            record?.parentA?.personalityType || record?.parentA?.baseType || null,
            record?.parentB?.personalityType || record?.parentB?.baseType || null,
            entity.personalityType && entity.personalityType !== 'hybrid' ? entity.personalityType : null
        ];
        return Array.from(new Set([
            ...geneticsTypes,
            ...recordTypes,
            ...heritageTypes,
            ...directTypes
        ].filter(Boolean)));
    }

    getLineageDepthForEntity(entity, gameState = gameCore?.gameState) {
        if (!entity) return 0;
        const record = this.getLineageRecordForEntity(entity, gameState);
        return Math.max(
            0,
            entity?.lifeSim?.genetics?.lineageDepth || 0,
            record?.lineageDepth || 0,
            record?.hybridGenome?.heritage?.lineageDepth || 0,
            entity?.hybridGenome?.heritage?.lineageDepth || 0,
            (entity?.isHybrid || record?.parentA || record?.parentB) ? 1 : 0
        );
    }

    getLineageIdsForEntity(entity, gameState = gameCore?.gameState) {
        if (!entity) {
            return { parents: [], ancestors: [] };
        }
        const record = this.getLineageRecordForEntity(entity, gameState);
        const fallbackParentRefs = [
            record?.parentA
                ? `lineage:${record.parentA.baseType || record.parentA.personalityType || '?'}:${record.parentA.sex || '?'}`
                : null,
            record?.parentB
                ? `lineage:${record.parentB.baseType || record.parentB.personalityType || '?'}:${record.parentB.sex || '?'}`
                : null
        ].filter(Boolean);
        const geneticsIds = entity?.lifeSim?.genetics?.lineageIds || {};
        const recordIds = record?.lineageIds || record?.hybridGenome?.heritage?.lineageIds || entity?.hybridGenome?.heritage?.lineageIds || {};
        const parents = Array.from(new Set([
            ...(Array.isArray(geneticsIds.parents) ? geneticsIds.parents : []),
            ...(Array.isArray(recordIds.parents) ? recordIds.parents : []),
            ...fallbackParentRefs
        ].filter(Boolean)));
        const ancestors = Array.from(new Set([
            ...(Array.isArray(geneticsIds.ancestors) ? geneticsIds.ancestors : []),
            ...(Array.isArray(recordIds.ancestors) ? recordIds.ancestors : [])
        ].filter(Boolean))).filter(ref => !parents.includes(ref));
        return { parents, ancestors };
    }

    buildLifecycleHeritage(female, male, mutationProfile = null, gameState = gameCore?.gameState) {
        const parentRefs = Array.from(new Set([
            this.buildLineageRef(female, gameState),
            this.buildLineageRef(male, gameState)
        ].filter(Boolean)));
        const femaleIds = this.getLineageIdsForEntity(female, gameState);
        const maleIds = this.getLineageIdsForEntity(male, gameState);
        const lineageIds = {
            parents: parentRefs,
            ancestors: Array.from(new Set([
                ...femaleIds.parents,
                ...femaleIds.ancestors,
                ...maleIds.parents,
                ...maleIds.ancestors
            ].filter(Boolean))).filter(ref => !parentRefs.includes(ref))
        };
        const lineageTypes = Array.from(new Set([
            ...this.getLineageTypesForEntity(female, gameState),
            ...this.getLineageTypesForEntity(male, gameState)
        ].filter(Boolean)));
        const lineageDepth = lineageTypes.length
            ? 1 + Math.max(
                this.getLineageDepthForEntity(female, gameState),
                this.getLineageDepthForEntity(male, gameState)
            )
            : 0;
        const goldenLine = lineageTypes.includes('golden');
        const heritageTags = Array.from(new Set([
            ...lineageTypes,
            goldenLine ? 'legendary-line' : null,
            mutationProfile?.active ? 'mutant' : null
        ].filter(Boolean)));

        return {
            lineageTypes,
            lineageDepth,
            lineageIds,
            heritageTags,
            goldenLine
        };
    }

    createLifecycleData(female, male, options = {}) {
        const childSex = random() < 0.5 ? 'M' : 'F';
        const chosenAbility = random([
            typeof female.getSpecialAbility === 'function' ? female.getSpecialAbility() : female.traits.special,
            typeof male.getSpecialAbility === 'function' ? male.getSpecialAbility() : male.traits.special
        ].filter(Boolean)) || null;
        const traitKeys = this.getTrackedTraitKeys();
        const averagedTraits = {};
        for (const key of traitKeys) {
            averagedTraits[key] = ((female.traits[key] || 0) + (male.traits[key] || 0)) / 2;
        }
        const mutationProfile = this.buildMutationProfile(averagedTraits, options);
        const inheritedTraits = { ...averagedTraits };
        if (mutationProfile?.mutatedTraits?.length) {
            for (const trait of mutationProfile.mutatedTraits) {
                inheritedTraits[trait.key] = trait.after;
            }
        }
        if (chosenAbility) {
            inheritedTraits.special = chosenAbility;
        }

        const wingKeys = ['foreLeft', 'foreRight', 'hindLeft', 'hindRight'];
        const wingDonors = {};
        for (const wingKey of wingKeys) {
            const sourceParent = random(['mother', 'father']);
            const source = sourceParent === 'mother'
                ? female.getFlattenedWingSource(wingKey)
                : male.getFlattenedWingSource(wingKey);
            wingDonors[wingKey] = source;
        }

        const avgColor = (a, b) => [
            Math.floor((a[0] + b[0]) / 2),
            Math.floor((a[1] + b[1]) / 2),
            Math.floor((a[2] + b[2]) / 2)
        ];
        const heritage = this.buildLifecycleHeritage(female, male, mutationProfile, gameCore?.gameState);

        return {
            childSex,
            currentZoneId: this.getEntityZoneId(female, this.getEntityZoneId(male, null)),
            parentA: female.getCollectionRenderSpec(),
            parentB: male.getCollectionRenderSpec(),
            hybridGenome: {
                wingDonors,
                bodySex: childSex,
                mutationSignature: mutationProfile?.signature || null,
                heritage: {
                    lineageTypes: [...heritage.lineageTypes],
                    lineageDepth: heritage.lineageDepth,
                    lineageIds: {
                        parents: [...heritage.lineageIds.parents],
                        ancestors: [...heritage.lineageIds.ancestors]
                    },
                    heritageTags: [...heritage.heritageTags],
                    goldenLine: heritage.goldenLine
                }
            },
            inheritedTraits,
            inheritedColors: [
                avgColor(female.colors[0], male.colors[0]),
                avgColor(female.colors[1], male.colors[1])
            ],
            inheritedAbility: chosenAbility,
            mutationProfile,
            heritageTags: [...heritage.heritageTags],
            lineageTypes: [...heritage.lineageTypes],
            lineageDepth: heritage.lineageDepth,
            lineageIds: {
                parents: [...heritage.lineageIds.parents],
                ancestors: [...heritage.lineageIds.ancestors]
            },
            reservationActive: true
        };
    }

    findNearestFlowerForEgg(butterfly, flowers) {
        let bestFlower = null;
        let bestDistance = Infinity;
        const zoneId = this.getEntityZoneId(butterfly, null);

        for (const flower of flowers) {
            if (zoneId && this.getEntityZoneId(flower, zoneId) !== zoneId) continue;
            if (!flower.canReceiveEggFrom(butterfly)) continue;
            const distance = Math.hypot(flower.x - butterfly.x, flower.y - butterfly.y);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestFlower = flower;
            }
        }

        return bestFlower;
    }

    layEggAndFeed(female, flower) {
        if (!female.pregnancy?.active) return;
        if (female.pregnancy.lifecycleData) {
            female.pregnancy.lifecycleData.currentZoneId = flower.currentZoneId || this.getEntityZoneId(female, null);
        }

        const mateId = female.breeding?.lastMateId || female.breeding?.partnerId || null;
        const male = mateId && typeof gameCore !== 'undefined'
            ? (gameCore.gameState?.butterflies || []).find(entry => entry.id === mateId) || null
            : null;

        flower.attachEgg({
            motherId: female.id,
            hatchFrame: frameCount + Math.floor(random(this.minEggHatchFrames, this.maxEggHatchFrames)),
            lifecycleData: female.pregnancy.lifecycleData
        });

        if (male && typeof progressionManager !== 'undefined' && typeof gameCore !== 'undefined') {
            const progressionResult = progressionManager.recordSuccessfulOffspring(
                gameCore.gameState,
                female,
                male,
                female.pregnancy.lifecycleData
            );
            if (Array.isArray(progressionResult?.departures) && progressionResult.departures.length) {
                for (const butterflyId of progressionResult.departures) {
                    const departingButterfly = (gameCore.gameState?.butterflies || []).find(entry => entry.id === butterflyId) || null;
                    if (!departingButterfly) continue;
                    gameCore.removeButterflyFromGame?.(departingButterfly);
                }
            }
        }

        female.pregnancy = null;
        female.changeState('feeding', { flower });
    }

    spawnHybridButterfly(x, y, lifecycleData, gameState, particleSystem) {
        if (!progressionManager?.canHybridEmerge?.(gameState)) {
            return null;
        }
        if (!this.canZoneAcceptEmergingAdult(lifecycleData.currentZoneId || null, gameState)) {
            return null;
        }

        const butterfly = new Butterfly(
            x,
            y - gameConfig.entities.heightOffset.butterfly,
            lifecycleData.inheritedColors,
            false,
            'hybrid',
            {
                sex: lifecycleData.childSex,
                birthSource: 'bred',
                fertilityUsesRemaining: this.getHybridBalance().bredFertilityUses ?? 1,
                hybridGenome: lifecycleData.hybridGenome,
                customTraits: lifecycleData.inheritedTraits,
                customAbility: lifecycleData.inheritedAbility,
                mutationProfile: lifecycleData.mutationProfile,
                inheritedTraits: lifecycleData.inheritedTraits,
                heritageTags: lifecycleData.heritageTags,
                lineageTypes: lifecycleData.lineageTypes,
                lineageDepth: lifecycleData.lineageDepth,
                parentIds: lifecycleData.lineageIds?.parents || [],
                ancestorIds: lifecycleData.lineageIds?.ancestors || [],
                isHybrid: true,
                displayName: null,
                currentZoneId: lifecycleData.currentZoneId || null
            }
        );

        gameState.butterflies.push(butterfly);
        if (typeof gameCore !== 'undefined') {
            gameCore?.butterflyStore?.add(butterfly);
        }
        gameState.pendingOffspringReservations = Math.max(0, gameState.pendingOffspringReservations - 1);

        const entry = progressionManager.makeHybridEntry(
            gameState,
            butterfly,
            lifecycleData.parentA,
            lifecycleData.parentB
        );
        butterfly.hybridEntryId = entry.id;
        butterfly.displayName = entry.name;
        butterfly.personalName = entry.personalName || entry.name;
        butterfly.nameDisambiguator = entry.nameDisambiguator || null;
        if (butterfly.lifeSim?.identity) {
            butterfly.lifeSim.identity.personalName = butterfly.personalName;
            butterfly.lifeSim.identity.displayName = butterfly.displayName;
        }

        if (particleSystem && this.getGlobalPopulationPressure(gameState) < 0.72) {
            particleSystem.emitBurst(x, y, lifecycleData.inheritedColors[0], 12);
        }

        if (typeof eventBus !== 'undefined' && GameEvents?.HYBRID_BORN) {
            eventBus.emit(GameEvents.HYBRID_BORN, {
                butterfly,
                entry,
                parentA: lifecycleData.parentA,
                parentB: lifecycleData.parentB
            });
        }

        progressionManager.save(gameState);
        return butterfly;
    }
}

const breedingSystem = new BreedingSystem();
