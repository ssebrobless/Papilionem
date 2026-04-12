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
        this.minEggHatchFrames = hybridBalance.eggHatchFrames?.min ?? (60 * 420);
        this.maxEggHatchFrames = hybridBalance.eggHatchFrames?.max ?? (60 * 600);
        this.minCocoonHatchFrames = hybridBalance.cocoonHatchFrames?.min ?? (60 * 420);
        this.maxCocoonHatchFrames = hybridBalance.cocoonHatchFrames?.max ?? (60 * 600);
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
        butterfly.offspringReservationActive = !!butterfly.offspringReservationActive;
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
        const females = gameState.butterflies.filter(b => this.isEligibleFemale(b));

        for (const female of females) {
            let bestMale = null;
            let bestScore = Infinity;

            for (const male of males) {
                const dx = male.x - female.x;
                const dy = male.y - female.y;
                const dist = Math.hypot(dx, dy);
                if (dist > this.pheromoneRadius) continue;
                if (male.breeding.partnerId || female.breeding.partnerId) continue;

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
            if (!this.isEligibleFemale(female)) continue;
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
            if (flower.occupancyState === 'egg' && flower.eggData && frameCount >= flower.eggData.hatchFrame) {
                const caterpillar = new Caterpillar(flower.x, flower.y, flower.eggData.lifecycleData);
                gameState.caterpillars.push(caterpillar);
                gameState.flowers.splice(i, 1);
                continue;
            }

            if (flower.occupancyState === 'chrysalis' && flower.chrysalisData && frameCount >= flower.chrysalisData.hatchFrame) {
                if (!flower.chrysalisData.hasHatched) {
                    const adult = this.spawnHybridButterfly(flower.x, flower.y, flower.chrysalisData.lifecycleData, gameState, particleSystem);
                    if (adult) {
                        flower.chrysalisData.hasHatched = true;
                        flower.chrysalisData.hatchedAt = frameCount;
                        flower.startPostHatchFade();
                    } else {
                        flower.chrysalisData.hatchFrame = frameCount + 60;
                    }
                }
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

    refreshMaleCooldowns(gameState) {
        for (const butterfly of gameState.butterflies) {
            this.ensureButterflyData(butterfly);
            if (butterfly.sex === 'M') {
                butterfly.pheromoneCooldownUntil = frameCount;
            }
        }
    }

    hatchAllEggs(gameState) {
        for (const flower of gameState.flowers) {
            if (flower.occupancyState === 'egg' && flower.eggData) {
                flower.eggData.hatchFrame = frameCount;
            }
        }
    }

    hatchAllCocoons(gameState) {
        for (const flower of gameState.flowers) {
            if (flower.occupancyState === 'chrysalis' && flower.chrysalisData) {
                flower.chrysalisData.hatchFrame = frameCount;
            }
        }
    }

    spawnFlowersAtCaterpillars(gameState) {
        for (const caterpillar of gameState.caterpillars) {
            const flower = new Flower(caterpillar.x, caterpillar.y, false);
            flower.ensureLifecycleData();
            flower.stage = 'mature';
            flower.stageTimer = 0;
            gameState.flowers.push(flower);
        }
    }

    isEligibleMale(butterfly, gameState) {
        this.ensureButterflyData(butterfly);
        if (butterfly.sex !== 'M') return false;
        if (butterfly.state !== 'normal') return false;
        if (butterfly.pheromoneCooldownUntil > frameCount) return false;
        if (butterfly.isSpawning) return false;
        if (butterfly.pregnancy?.active) return false;
        if (butterfly.breeding.partnerId) return false;
        if (!this.canReproduce(butterfly)) return false;
        if ((gameState.butterflies.length + gameState.pendingOffspringReservations) >= this.adultHardCap) return false;
        return true;
    }

    isEligibleFemale(butterfly) {
        this.ensureButterflyData(butterfly);
        if (butterfly.sex !== 'F') return false;
        if (butterfly.state !== 'normal') return false;
        if (butterfly.isSpawning) return false;
        if (butterfly.pregnancy?.active) return false;
        if (butterfly.breeding.partnerId) return false;
        return this.canReproduce(butterfly);
    }

    canReproduce(butterfly) {
        return butterfly.fertilityUsesRemaining === Infinity || butterfly.fertilityUsesRemaining > 0;
    }

    startMating(female, male) {
        if (female.state === 'mating' || male.state === 'mating') return;

        female.breeding.partnerId = male.id;
        male.breeding.partnerId = female.id;
        female.breeding.matingTimer = this.matingDuration;
        male.breeding.matingTimer = this.matingDuration;
        female.breeding.matingResolved = false;
        male.breeding.matingResolved = false;
        female.changeState('mating', { partnerId: male.id });
        male.changeState('mating', { partnerId: female.id });
    }

    completeMating(female, male, gameState, particleSystem) {
        if (female.breeding.matingResolved) return;

        female.breeding.matingResolved = true;
        male.breeding.matingResolved = true;

        if (female.fertilityUsesRemaining !== Infinity) {
            female.fertilityUsesRemaining = Math.max(0, female.fertilityUsesRemaining - 1);
        }
        if (male.fertilityUsesRemaining !== Infinity) {
            male.fertilityUsesRemaining = Math.max(0, male.fertilityUsesRemaining - 1);
        }

        male.pheromoneCooldownUntil = frameCount + this.pheromoneCooldownFrames;

        const lifecycleData = this.createLifecycleData(female, male);
        female.pregnancy = {
            active: true,
            lifecycleData,
            targetFlower: this.findNearestFlowerForEgg(female, gameState.flowers)
        };
        gameState.pendingOffspringReservations++;

        if (particleSystem) {
            particleSystem.emitBurst(female.x, female.y, [255, 255, 255], 12);
            particleSystem.emitBurst(male.x, male.y, [255, 220, 255], 12);
        }

        female.breeding.partnerId = null;
        male.breeding.partnerId = null;
        female.changeState('normal');
        male.changeState('normal');
    }

    createLifecycleData(female, male) {
        const childSex = random() < 0.5 ? 'M' : 'F';
        const chosenAbility = random([
            typeof female.getSpecialAbility === 'function' ? female.getSpecialAbility() : female.traits.special,
            typeof male.getSpecialAbility === 'function' ? male.getSpecialAbility() : male.traits.special
        ].filter(Boolean)) || null;
        const traitKeys = ['speed', 'jitteriness', 'trustPropensity', 'trustSpeed', 'scareThreshold', 'happinessBonus'];
        const averagedTraits = {};
        for (const key of traitKeys) {
            averagedTraits[key] = ((female.traits[key] || 0) + (male.traits[key] || 0)) / 2;
        }
        if (chosenAbility) {
            averagedTraits.special = chosenAbility;
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

        return {
            childSex,
            parentA: female.getCollectionRenderSpec(),
            parentB: male.getCollectionRenderSpec(),
            hybridGenome: {
                wingDonors,
                bodySex: childSex
            },
            inheritedTraits: averagedTraits,
            inheritedColors: [
                avgColor(female.colors[0], male.colors[0]),
                avgColor(female.colors[1], male.colors[1])
            ],
            inheritedAbility: chosenAbility,
            reservationActive: true
        };
    }

    findNearestFlowerForEgg(butterfly, flowers) {
        let bestFlower = null;
        let bestDistance = Infinity;

        for (const flower of flowers) {
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

        flower.attachEgg({
            motherId: female.id,
            hatchFrame: frameCount + Math.floor(random(this.minEggHatchFrames, this.maxEggHatchFrames)),
            lifecycleData: female.pregnancy.lifecycleData
        });

        female.pregnancy = null;
        female.changeState('feeding', { flower });
    }

    spawnHybridButterfly(x, y, lifecycleData, gameState, particleSystem) {
        if (gameState.butterflies.length >= this.adultHardCap) {
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
                isHybrid: true,
                displayName: null
            }
        );

        gameState.butterflies.push(butterfly);
        gameState.pendingOffspringReservations = Math.max(0, gameState.pendingOffspringReservations - 1);

        const entry = progressionManager.makeHybridEntry(
            gameState,
            butterfly,
            lifecycleData.parentA,
            lifecycleData.parentB
        );
        butterfly.hybridEntryId = entry.id;
        butterfly.displayName = entry.name;

        if (particleSystem) {
            particleSystem.emitBurst(x, y, lifecycleData.inheritedColors[0], 16);
        }

        progressionManager.save(gameState);
        return butterfly;
    }
}

const breedingSystem = new BreedingSystem();
