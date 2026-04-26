class StatProfileSystem {
    constructor() {
        this.initialized = false;
        this.traitKeys = ['speed', 'jitteriness', 'trustPropensity', 'trustSpeed', 'scareThreshold', 'happinessBonus'];
        this.traitLabels = {
            speed: 'Speed',
            jitteriness: 'Jitter',
            trustPropensity: 'Trust lean',
            trustSpeed: 'Trust rate',
            scareThreshold: 'Calmness',
            happinessBonus: 'Joy gain'
        };
        this.battleLabels = {
            initiative: 'Initiative',
            offense: 'Offense',
            guard: 'Guard',
            resolve: 'Resolve',
            support: 'Support'
        };
    }

    initialize() {
        this.initialized = true;
    }

    reset() {}

    clamp(value, min = 0, max = 1) {
        return Math.max(min, Math.min(max, value ?? 0));
    }

    clampTraitValue(key, value) {
        const floor = key === 'scareThreshold' ? 0.5 : 0.05;
        return Math.max(floor, Number.isFinite(value) ? value : floor);
    }

    getTrackedTraitKeys() {
        return [...this.traitKeys];
    }

    getTraitLabel(key) {
        return this.traitLabels[key] || key;
    }

    formatTraitValue(value) {
        if (typeof value !== 'number' || Number.isNaN(value)) return '--';
        const rounded = Math.abs(value) >= 10 ? value.toFixed(1) : value.toFixed(2);
        return rounded.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    }

    formatSignedTraitValue(value) {
        if (typeof value !== 'number' || Number.isNaN(value)) return '--';
        const prefix = value > 0 ? '+' : '';
        return `${prefix}${this.formatTraitValue(value)}`;
    }

    formatBattleValue(value) {
        if (typeof value !== 'number' || Number.isNaN(value)) return '--';
        return `${Math.round(value)}`;
    }

    createEmptyTraitBundle() {
        const bundle = {};
        for (const key of this.traitKeys) {
            bundle[key] = 0;
        }
        return bundle;
    }

    cloneTraitBundle(traits = {}) {
        const bundle = this.createEmptyTraitBundle();
        for (const key of this.traitKeys) {
            bundle[key] = typeof traits[key] === 'number' ? traits[key] : 0;
        }
        if (traits.special) {
            bundle.special = traits.special;
        }
        return bundle;
    }

    addTraitBundles(...bundles) {
        const total = this.createEmptyTraitBundle();
        let special = null;
        for (const bundle of bundles) {
            if (!bundle) continue;
            for (const key of this.traitKeys) {
                total[key] += typeof bundle[key] === 'number' ? bundle[key] : 0;
            }
            if (!special && bundle.special) {
                special = bundle.special;
            }
        }
        if (special) {
            total.special = special;
        }
        return total;
    }

    applyTraitBundle(baseTraits = {}, modifierTraits = {}) {
        const effective = this.cloneTraitBundle(baseTraits);
        for (const key of this.traitKeys) {
            effective[key] = this.clampTraitValue(key, effective[key] + (modifierTraits[key] || 0));
        }
        if (!effective.special && modifierTraits.special) {
            effective.special = modifierTraits.special;
        }
        return effective;
    }

    averageParentTraits(parentATraits = {}, parentBTraits = {}) {
        const average = this.createEmptyTraitBundle();
        for (const key of this.traitKeys) {
            average[key] = ((parentATraits[key] || 0) + (parentBTraits[key] || 0)) / 2;
        }
        return average;
    }

    getAbilityForSubject(subject) {
        if (!subject) return null;
        if (typeof subject.getSpecialAbility === 'function') {
            return subject.getSpecialAbility();
        }
        return subject.inheritedAbility || subject.specialAbility || subject.customAbility || subject.traits?.special || null;
    }

    getArchetypeTraits(personalityType) {
        if (!personalityType || typeof BUTTERFLY_PERSONALITIES === 'undefined') return null;
        const personality = BUTTERFLY_PERSONALITIES[personalityType];
        if (!personality?.traits) return null;
        return this.cloneTraitBundle(personality.traits);
    }

    getTraitsFromSpec(spec = {}) {
        const baseType = spec.baseType || spec.personalityType || null;
        return this.getArchetypeTraits(baseType);
    }

    getHybridJournalEntryForEntity(entity, gameState = gameCore?.gameState) {
        if (!entity?.hybridEntryId || !Array.isArray(gameState?.hybridJournal)) return null;
        return gameState.hybridJournal.find(entry => entry.id === entity.hybridEntryId) || null;
    }

    getLineageRecord(subject, gameState = gameCore?.gameState) {
        if (!subject) return null;
        if (subject?.lifeSim && subject?.hybridEntryId) {
            const journalEntry = this.getHybridJournalEntryForEntity(subject, gameState);
            if (journalEntry) return journalEntry;
        }
        if (subject.parentA || subject.parentB || subject.hybridGenome || subject.inheritedTraits) {
            return subject;
        }
        return this.getHybridJournalEntryForEntity(subject, gameState);
    }

    getBaselineTraits(subject, gameState = gameCore?.gameState) {
        if (!subject) return this.createEmptyTraitBundle();
        const lineageRecord = this.getLineageRecord(subject, gameState);

        if (subject?.lifeSim?.genetics?.baselineTraits && Object.keys(subject.lifeSim.genetics.baselineTraits).length) {
            const baseline = this.cloneTraitBundle(subject.lifeSim.genetics.baselineTraits);
            const ability = this.getAbilityForSubject(subject);
            if (ability) baseline.special = ability;
            return baseline;
        }

        if (lineageRecord?.inheritedTraits) {
            const inherited = this.cloneTraitBundle(lineageRecord.inheritedTraits);
            const hasInheritedValues = this.traitKeys.some(key => (inherited[key] || 0) > 0);
            if (hasInheritedValues) {
                const ability = this.getAbilityForSubject(lineageRecord) || this.getAbilityForSubject(subject);
                if (ability) inherited.special = ability;
                return inherited;
            }
        }

        if (lineageRecord?.parentA && lineageRecord?.parentB) {
            const parentATraits = this.getTraitsFromSpec(lineageRecord.parentA);
            const parentBTraits = this.getTraitsFromSpec(lineageRecord.parentB);
            if (parentATraits && parentBTraits) {
                const baseline = this.averageParentTraits(parentATraits, parentBTraits);
                const ability = this.getAbilityForSubject(lineageRecord) || this.getAbilityForSubject(subject);
                if (ability) baseline.special = ability;
                return baseline;
            }
        }

        if (subject?.traits) {
            const baseline = this.cloneTraitBundle(subject.traits);
            const ability = this.getAbilityForSubject(subject);
            if (ability) baseline.special = ability;
            return baseline;
        }

        const archetypeTraits = this.getTraitsFromSpec(subject);
        if (archetypeTraits) {
            const ability = this.getAbilityForSubject(subject);
            if (ability) archetypeTraits.special = ability;
            return archetypeTraits;
        }

        return this.createEmptyTraitBundle();
    }

    getParentProfile(subject, gameState = gameCore?.gameState) {
        const lineageRecord = this.getLineageRecord(subject, gameState);
        if (!lineageRecord?.parentA || !lineageRecord?.parentB) {
            return null;
        }

        const parentATraits = this.getTraitsFromSpec(lineageRecord.parentA);
        const parentBTraits = this.getTraitsFromSpec(lineageRecord.parentB);
        if (!parentATraits || !parentBTraits) {
            return null;
        }

        return {
            parentA: lineageRecord.parentA,
            parentB: lineageRecord.parentB,
            parentATraits,
            parentBTraits,
            midpointTraits: this.averageParentTraits(parentATraits, parentBTraits),
            wingDonors: lineageRecord.hybridGenome?.wingDonors || null
        };
    }

    getMutationProfile(subject, gameState = gameCore?.gameState) {
        const lineageRecord = this.getLineageRecord(subject, gameState);
        const mutationProfile = subject?.lifeSim?.genetics?.mutationProfile
            || subject?.mutationProfile
            || lineageRecord?.mutationProfile
            || null;
        return mutationProfile?.mutatedTraits?.length ? mutationProfile : null;
    }

    getUpbringingProfile(entity) {
        const modifiers = this.createEmptyTraitBundle();
        const notes = [];
        if (!entity?.lifeSim) {
            return {
                modifiers,
                lessonCount: 0,
                routineSummary: {},
                notes: ['No upbringing imprint recorded yet']
            };
        }

        const lessons = entity.lifeSim.upbringing?.lessons || [];
        const routines = entity.lifeSim.upbringing?.routineReinforcement || {};
        const teachingRoutine = entity.lifeSim.routines?.teaching || [];
        let trainingLessons = 0;
        let careLessons = 0;
        let socialLessons = 0;
        let warpedLessons = 0;

        for (const lesson of lessons) {
            const strength = lesson?.strength || 0.2;
            const category = String(lesson?.category || '').toLowerCase();
            const fromTrainingGround = lesson?.content?.source === 'training-ground';
            const warped = !!lesson?.warped;
            if (fromTrainingGround || category.includes('training')) trainingLessons += strength;
            if (category.includes('care') || category.includes('sleep')) careLessons += strength;
            if (category.includes('social') || category.includes('teach') || category.includes('resource')) socialLessons += strength;
            if (warped) warpedLessons += strength;
        }

        const teachingRoutineStrength = Array.isArray(teachingRoutine) && teachingRoutine.length
            ? teachingRoutine.reduce((sum, routine) => sum + (routine?.strength || 0), 0) / teachingRoutine.length
            : 0;
        const routineTeaching = routines.teaching || 0;
        const routineSocial = routines.social || 0;
        const routineMovement = routines.movement || 0;
        const routineResource = routines.resource || 0;
        const routineRest = routines.rest || 0;

        modifiers.speed += (trainingLessons * 0.18) + (routineMovement * 0.12) + (routineResource * 0.06);
        modifiers.jitteriness += (warpedLessons * 0.16) - (careLessons * 0.08) - (routineRest * 0.06);
        modifiers.trustPropensity += (socialLessons * 0.18) + (routineSocial * 0.14) + (routineTeaching * 0.06);
        modifiers.trustSpeed += (trainingLessons * 0.16) + (teachingRoutineStrength * 0.08) + (routineTeaching * 0.1);
        modifiers.scareThreshold += (careLessons * 0.22) + (trainingLessons * 0.08) - (warpedLessons * 0.16);
        modifiers.happinessBonus += (careLessons * 0.16) + (socialLessons * 0.12) + (routineRest * 0.06);

        if (trainingLessons > 0) notes.push(`Training imprint ${this.formatTraitValue(trainingLessons)}`);
        if (socialLessons > 0) notes.push(`Social lessons ${this.formatTraitValue(socialLessons)}`);
        if (careLessons > 0) notes.push(`Care lessons ${this.formatTraitValue(careLessons)}`);
        if (warpedLessons > 0) notes.push(`Warped lessons ${this.formatTraitValue(warpedLessons)}`);
        if (!notes.length) notes.push('No strong lesson imprint yet');

        return {
            modifiers,
            lessonCount: lessons.length,
            routineSummary: {
                teaching: teachingRoutineStrength,
                social: routineSocial,
                movement: routineMovement,
                resource: routineResource,
                rest: routineRest
            },
            notes
        };
    }

    getCurrentStateProfile(entity) {
        const modifiers = this.createEmptyTraitBundle();
        const notes = [];
        if (!entity?.lifeSim) {
            return {
                modifiers,
                notes: ['No live state modifiers'],
                emotionalState: {},
                socialState: {},
                exhaustion: 0,
                clarity: 1
            };
        }

        const emotions = entity.lifeSim.emotions || {};
        const social = entity.lifeSim.social || {};
        const interpretation = entity.lifeSim.interpretation || {};
        const statusBundle = typeof statusSystem !== 'undefined'
            ? statusSystem.getAggregatedModifiers?.(entity.id) || { numeric: {} }
            : { numeric: {} };
        const sleepState = typeof sleepSystem !== 'undefined'
            ? sleepSystem.getSleepState?.(entity.id)
            : null;
        const exhaustion = sleepState?.exhaustion ?? emotions.exhaustion ?? 0;
        const clarity = interpretation.clarity ?? 1;
        const moveBonus = statusBundle.numeric?.movement_speed_bonus || 0;
        const healBonus = statusBundle.numeric?.healing_received_bonus || 0;
        const wakeResistance = statusBundle.numeric?.wake_resistance || 0;

        modifiers.speed += (moveBonus * 0.9) - (exhaustion * 0.35) - ((emotions.agitation || 0) * 0.08);
        modifiers.jitteriness += ((emotions.agitation || 0) * 0.55) + ((emotions.threat || 0) * 0.18) - ((emotions.relief || 0) * 0.16);
        modifiers.trustPropensity += ((emotions.attachment || 0) * 0.18) + ((emotions.relief || 0) * 0.1) - ((emotions.rejection || 0) * 0.22) - ((emotions.threat || 0) * 0.08);
        modifiers.trustSpeed += ((clarity - 0.5) * 0.42) + ((social.confidence || 0) * 0.16) - (exhaustion * 0.1);
        modifiers.scareThreshold += ((emotions.relief || 0) * 0.3) + ((social.belonging || 0) * 0.12) + (wakeResistance * 0.08) - ((emotions.threat || 0) * 0.46) - ((emotions.agitation || 0) * 0.18);
        modifiers.happinessBonus += ((emotions.significance || 0) * 0.16) + ((emotions.relief || 0) * 0.14) + (healBonus * 0.1) - ((emotions.failure || 0) * 0.14);

        notes.push(`Clarity ${Math.round(clarity * 100)}%`);
        notes.push(`Exhaustion ${Math.round(exhaustion * 100)}%`);
        if ((emotions.threat || 0) > 0.15) notes.push(`Threat ${Math.round((emotions.threat || 0) * 100)}%`);
        if ((emotions.agitation || 0) > 0.15) notes.push(`Agitation ${Math.round((emotions.agitation || 0) * 100)}%`);
        if ((social.confidence || 0) > 0.15) notes.push(`Confidence ${Math.round((social.confidence || 0) * 100)}%`);

        return {
            modifiers,
            notes,
            emotionalState: emotions,
            socialState: social,
            exhaustion,
            clarity
        };
    }

    getEffectiveTraits(entity, gameState = gameCore?.gameState) {
        const baselineTraits = this.getBaselineTraits(entity, gameState);
        const upbringingProfile = this.getUpbringingProfile(entity);
        const currentStateProfile = this.getCurrentStateProfile(entity);
        const effectiveTraits = this.applyTraitBundle(
            this.applyTraitBundle(baselineTraits, upbringingProfile.modifiers),
            currentStateProfile.modifiers
        );

        return {
            baselineTraits,
            upbringingProfile,
            currentStateProfile,
            effectiveTraits
        };
    }

    buildBattleProfile(subject, gameState = gameCore?.gameState) {
        const isEntity = !!subject?.lifeSim;
        const traitBundle = isEntity
            ? this.getEffectiveTraits(subject, gameState).effectiveTraits
            : this.getBaselineTraits(subject, gameState);
        const stateProfile = isEntity ? this.getCurrentStateProfile(subject) : { exhaustion: 0, emotionalState: {}, socialState: {}, clarity: 1 };
        const exhaustion = stateProfile.exhaustion || 0;
        const emotions = stateProfile.emotionalState || {};
        const social = stateProfile.socialState || {};

        const initiative = this.clamp(
            (traitBundle.speed * 16) +
            (traitBundle.trustSpeed * 11) +
            ((2.4 - traitBundle.jitteriness) * 7) +
            ((social.confidence || 0) * 12) -
            (exhaustion * 22),
            10,
            120
        );
        const offense = this.clamp(
            (traitBundle.speed * 15) +
            (traitBundle.happinessBonus * 10) +
            (traitBundle.jitteriness * 4) +
            ((emotions.significance || 0) * 10),
            10,
            120
        );
        const guard = this.clamp(
            (traitBundle.scareThreshold * 12) +
            (traitBundle.trustSpeed * 6) +
            ((1 - (emotions.threat || 0)) * 10) +
            ((1 - exhaustion) * 8),
            10,
            120
        );
        const resolve = this.clamp(
            (traitBundle.scareThreshold * 10) +
            (traitBundle.happinessBonus * 9) +
            ((social.belonging || 0) * 12) +
            ((1 - (emotions.failure || 0)) * 8),
            10,
            120
        );
        const support = this.clamp(
            (traitBundle.trustPropensity * 12) +
            (traitBundle.happinessBonus * 8) +
            ((social.confidence || 0) * 10) +
            ((emotions.attachment || 0) * 12),
            10,
            120
        );

        return {
            initiative,
            offense,
            guard,
            resolve,
            support,
            derivedMaxHp: Math.round(70 + (guard * 0.8) + (resolve * 0.35))
        };
    }

    buildTraitLines(traits, includeAbility = true) {
        const lines = [];
        const entries = this.traitKeys.map(key => `${this.getTraitLabel(key)} ${this.formatTraitValue(traits[key])}`);
        for (let index = 0; index < entries.length; index += 2) {
            lines.push(entries.slice(index, index + 2).join(' | '));
        }
        if (includeAbility) {
            lines.push(`Ability ${traits.special || 'none'}`);
        }
        return lines;
    }

    buildModifierLines(modifiers, emptyLabel) {
        const entries = this.traitKeys.map(key => `${this.getTraitLabel(key)} ${this.formatSignedTraitValue(modifiers[key] || 0)}`);
        const hasMeaningfulShift = this.traitKeys.some(key => Math.abs(modifiers[key] || 0) >= 0.02);
        if (!hasMeaningfulShift) {
            return [emptyLabel];
        }

        const lines = [];
        for (let index = 0; index < entries.length; index += 2) {
            lines.push(entries.slice(index, index + 2).join(' | '));
        }
        return lines;
    }

    getRarityRank(rarity = 'unknown') {
        return ({
            unknown: 0,
            common: 1,
            uncommon: 2,
            rare: 3,
            epic: 4,
            legendary: 5
        })[rarity] ?? 0;
    }

    getHighestLineageRarity(lineageTypes = []) {
        const ranked = (lineageTypes || [])
            .map(type => ({
                type,
                rarity: progressionManager?.getVariantRarity?.(type) || BUTTERFLY_PERSONALITIES?.[type]?.rarity || 'unknown'
            }))
            .sort((left, right) => this.getRarityRank(right.rarity) - this.getRarityRank(left.rarity));
        return ranked[0]?.rarity || 'unknown';
    }

    getAlternateParentAbility(parentProfile, subject) {
        if (!parentProfile?.parentA || !parentProfile?.parentB) return null;
        const inheritedAbility = this.getAbilityForSubject(subject) || 'none';
        const parentAbilities = Array.from(new Set([
            this.getAbilityForSubject(parentProfile.parentA) || 'none',
            this.getAbilityForSubject(parentProfile.parentB) || 'none'
        ]));
        return parentAbilities.find(ability => ability !== inheritedAbility && ability !== 'none') || null;
    }

    getLineageContext(subject, gameState = gameCore?.gameState, parentProfile = this.getParentProfile(subject, gameState)) {
        const record = this.getLineageRecord(subject, gameState);
        const genetics = subject?.lifeSim?.genetics || {};
        const lineageIds = {
            parents: Array.from(new Set([
                ...(Array.isArray(genetics?.lineageIds?.parents) ? genetics.lineageIds.parents : []),
                ...(Array.isArray(record?.lineageIds?.parents) ? record.lineageIds.parents : []),
                ...(Array.isArray(record?.hybridGenome?.heritage?.lineageIds?.parents) ? record.hybridGenome.heritage.lineageIds.parents : []),
                ...(Array.isArray(subject?.hybridGenome?.heritage?.lineageIds?.parents) ? subject.hybridGenome.heritage.lineageIds.parents : [])
            ].filter(Boolean))),
            ancestors: []
        };
        lineageIds.ancestors = Array.from(new Set([
            ...(Array.isArray(genetics?.lineageIds?.ancestors) ? genetics.lineageIds.ancestors : []),
            ...(Array.isArray(record?.lineageIds?.ancestors) ? record.lineageIds.ancestors : []),
            ...(Array.isArray(record?.hybridGenome?.heritage?.lineageIds?.ancestors) ? record.hybridGenome.heritage.lineageIds.ancestors : []),
            ...(Array.isArray(subject?.hybridGenome?.heritage?.lineageIds?.ancestors) ? subject.hybridGenome.heritage.lineageIds.ancestors : [])
        ].filter(Boolean))).filter(ref => !lineageIds.parents.includes(ref));

        const lineageTypes = Array.from(new Set([
            ...(Array.isArray(genetics?.lineageTypes) ? genetics.lineageTypes : []),
            ...(Array.isArray(record?.lineageTypes) ? record.lineageTypes : []),
            ...(Array.isArray(record?.hybridGenome?.heritage?.lineageTypes) ? record.hybridGenome.heritage.lineageTypes : []),
            ...(Array.isArray(subject?.hybridGenome?.heritage?.lineageTypes) ? subject.hybridGenome.heritage.lineageTypes : []),
            record?.parentA?.personalityType || record?.parentA?.baseType || null,
            record?.parentB?.personalityType || record?.parentB?.baseType || null,
            subject?.personalityType && subject.personalityType !== 'hybrid' ? subject.personalityType : null
        ].filter(Boolean)));

        const heritageTags = Array.from(new Set([
            ...(Array.isArray(genetics?.heritageTags) ? genetics.heritageTags : []),
            ...(Array.isArray(record?.heritageTags) ? record.heritageTags : []),
            ...(Array.isArray(record?.hybridGenome?.heritage?.heritageTags) ? record.hybridGenome.heritage.heritageTags : []),
            ...(Array.isArray(subject?.hybridGenome?.heritage?.heritageTags) ? subject.hybridGenome.heritage.heritageTags : [])
        ].filter(Boolean)));

        const lineageDepth = Math.max(
            0,
            genetics?.lineageDepth || 0,
            record?.lineageDepth || 0,
            record?.hybridGenome?.heritage?.lineageDepth || 0,
            subject?.hybridGenome?.heritage?.lineageDepth || 0,
            (parentProfile?.parentA || parentProfile?.parentB) ? 1 : 0
        );
        const lineageRarity = this.getHighestLineageRarity(lineageTypes);
        const encounterRarity = subject?.birthSource === 'wild'
            ? (progressionManager?.getVariantRarity?.(subject?.personalityType || subject?.baseType || null)
                || subject?.personality?.rarity
                || 'unknown')
            : 'bred';

        return {
            lineageTypes,
            lineageDepth,
            lineageIds,
            heritageTags,
            lineageRarity,
            encounterRarity,
            goldenLine: lineageTypes.includes('golden') || lineageRarity === 'legendary',
            alternateParentAbility: this.getAlternateParentAbility(parentProfile, subject),
            parentCount: lineageIds.parents.length || ((parentProfile?.parentA || parentProfile?.parentB) ? 2 : 0),
            ancestorCount: lineageIds.ancestors.length
        };
    }

    buildBattleLines(battleProfile) {
        return [
            `Initiative ${this.formatBattleValue(battleProfile.initiative)} | Offense ${this.formatBattleValue(battleProfile.offense)}`,
            `Guard ${this.formatBattleValue(battleProfile.guard)} | Resolve ${this.formatBattleValue(battleProfile.resolve)}`,
            `Support ${this.formatBattleValue(battleProfile.support)} | HP seed ${this.formatBattleValue(battleProfile.derivedMaxHp)}`
        ];
    }

    getAbilityOriginLabel(subject, gameState = gameCore?.gameState) {
        if (!subject) return 'natural';
        const record = this.getLineageRecord(subject, gameState);
        if (record?.inheritedAbility) return 'inherited';
        if (subject?.birthSource === 'bred' || subject?.isHybrid || subject?.hybridGenome) return 'bred';
        return 'natural';
    }

    buildAbilityLines(subject, gameState = gameCore?.gameState) {
        const ability = this.getAbilityForSubject(subject) || 'none';
        const origin = this.getAbilityOriginLabel(subject, gameState);
        const lines = [`Ability ${ability} | ${origin}`];
        const parentProfile = this.getParentProfile(subject, gameState);
        if (parentProfile?.parentA || parentProfile?.parentB) {
            const parentAAbility = this.getAbilityForSubject(parentProfile.parentA) || 'none';
            const parentBAbility = this.getAbilityForSubject(parentProfile.parentB) || 'none';
            lines.push(`Parents ${parentAAbility} + ${parentBAbility}`);
            const alternateAbility = this.getAlternateParentAbility(parentProfile, subject);
            if (alternateAbility) {
                lines.push(`Alt ${alternateAbility} | heritage only`);
            }
        }
        return lines;
    }

    buildParentSummaryLines(parentProfile, subject, gameState = gameCore?.gameState) {
        if (!parentProfile?.parentA || !parentProfile?.parentB) return [];
        const parentAType = parentProfile.parentA?.personalityType || parentProfile.parentA?.baseType || '?';
        const parentBType = parentProfile.parentB?.personalityType || parentProfile.parentB?.baseType || '?';
        const parentAAbility = this.getAbilityForSubject(parentProfile.parentA) || 'none';
        const parentBAbility = this.getAbilityForSubject(parentProfile.parentB) || 'none';
        const inheritedAbility = this.getAbilityForSubject(subject) || 'none';
        let inheritedSource = 'no inherited carry';
        if (inheritedAbility !== 'none') {
            inheritedSource = parentAAbility === inheritedAbility
                ? parentAType
                : parentBAbility === inheritedAbility
                    ? parentBType
                    : 'lineage';
        }
        return [
            `Parents ${parentAType} + ${parentBType}`,
            `Ability ${inheritedAbility} | ${inheritedSource}`
        ];
    }

    buildExpressionSummaryLines(traitProfile, mutationProfile = null) {
        if (!traitProfile) return [];
        const lines = [
            `Base ${this.buildTraitLines(traitProfile.baselineTraits, false)[0] || 'none'}`,
            `Learn ${this.buildModifierLines(traitProfile.upbringingProfile?.modifiers || {}, 'No imprint')[0] || 'No imprint'}`,
            `State ${this.buildModifierLines(traitProfile.currentStateProfile?.modifiers || {}, 'Near baseline')[0] || 'Near baseline'}`,
            `Eff ${this.buildTraitLines(traitProfile.effectiveTraits, false)[0] || 'none'}`
        ];
        const mutationLines = this.buildMutationLines(mutationProfile);
        if (mutationLines.length) {
            lines.splice(1, 0, mutationLines[0]);
        }
        return lines;
    }

    buildReadinessProfile(subject, gameState = gameCore?.gameState) {
        const battleProfile = this.buildBattleProfile(subject, gameState);
        const stateProfile = subject?.lifeSim
            ? this.getCurrentStateProfile(subject)
            : { exhaustion: 0, clarity: 1, emotionalState: {}, socialState: {} };
        const exhaustion = Math.max(0, Math.min(1, stateProfile.exhaustion || 0));
        const clarity = Math.max(0, Math.min(1, stateProfile.clarity ?? 1));
        const hp = subject?.battleState?.hp ?? subject?.hp ?? battleProfile.derivedMaxHp;
        const hpRatio = battleProfile.derivedMaxHp > 0 ? Math.max(0, Math.min(1, hp / battleProfile.derivedMaxHp)) : 1;
        const pressure = Math.max(0, subject?.battleState?.pressure ?? 0);
        const pressurePenalty = Math.max(0, Math.min(0.22, pressure * 0.018));
        const emotions = stateProfile.emotionalState || {};
        const social = stateProfile.socialState || {};
        const score = Math.round(this.clamp(
            (battleProfile.initiative * 0.16) +
            (battleProfile.offense * 0.18) +
            (battleProfile.guard * 0.18) +
            (battleProfile.resolve * 0.18) +
            (battleProfile.support * 0.14) +
            (hpRatio * 14) +
            (clarity * 8) +
            ((social.confidence || 0) * 8) -
            (exhaustion * 22) -
            pressurePenalty * 100 -
            ((emotions.threat || 0) * 10),
            5,
            99
        ));
        const tier = score >= 82
            ? 'Prime'
            : score >= 68
                ? 'Ready'
                : score >= 52
                    ? 'Watch'
                    : 'Rest';
        const strengths = [];
        const concerns = [];
        if (battleProfile.offense >= 80) strengths.push('high offense');
        if (battleProfile.guard >= 80) strengths.push('stable guard');
        if (battleProfile.resolve >= 80) strengths.push('strong resolve');
        if (battleProfile.support >= 80) strengths.push('supportive');
        if (battleProfile.initiative >= 80) strengths.push('fast opener');
        if (!strengths.length) strengths.push('balanced profile');
        if (exhaustion >= 0.45) concerns.push('tired');
        if (pressure >= 4) concerns.push('under pressure');
        if (clarity <= 0.7) concerns.push('unclear reading');
        if ((emotions.threat || 0) >= 0.45) concerns.push('threatened');
        if (hpRatio <= 0.65) concerns.push('low hp');
        if (!concerns.length) concerns.push('clear for battle');

        return {
            score,
            tier,
            hp,
            hpRatio,
            pressure,
            exhaustion,
            clarity,
            strengths,
            concerns
        };
    }

    buildReadinessLines(readinessProfile) {
        if (!readinessProfile) return ['Readiness unknown'];
        return [
            `Ready ${readinessProfile.score} | ${readinessProfile.tier} | HP ${this.formatBattleValue(readinessProfile.hp)} | Pressure ${this.formatBattleValue(readinessProfile.pressure)}`,
            `Strength ${readinessProfile.strengths[0] || 'balanced'} | Watch ${readinessProfile.concerns[0] || 'clear'}`
        ];
    }

    buildHeritageLines(lineageContext) {
        if (!lineageContext?.lineageTypes?.length && !lineageContext?.parentCount) return [];
        const lines = [];
        if (lineageContext.lineageTypes?.length) {
            lines.push(`Heritage ${lineageContext.lineageTypes.slice(0, 4).join(' | ')}`);
        }
        lines.push(`Depth ${Math.max(1, lineageContext.lineageDepth || 1)} | parents ${lineageContext.parentCount || 0} | ancestors ${lineageContext.ancestorCount || 0}`);
        return lines;
    }

    buildRarityLines(lineageContext) {
        if (!lineageContext) return [];
        const lines = [
            `Line ${lineageContext.lineageRarity || 'unknown'} | encounter ${lineageContext.encounterRarity || 'unknown'}`
        ];
        lines.push(lineageContext.goldenLine
            ? 'Golden line normal | no unlock carry'
            : 'Rarity is lineage-only | no spawn carry');
        return lines;
    }

    buildEcologyLines(releaseEcology) {
        if (!releaseEcology) return [];
        const formatEntries = (entries = [], fallback = 'steady mix') =>
            entries.length
                ? entries.slice(0, 2).map(entry => `${entry.label || entry.id} ${Math.round((entry.share || 0) * 100)}`).join(' | ')
                : fallback;
        const modifierText = (releaseEcology.modifierHighlights || []).length
            ? releaseEcology.modifierHighlights
                .slice(0, 2)
                .map(entry => `${entry.label} ${this.formatSignedTraitValue(entry.delta)}`)
                .join(' | ')
            : '';

        if (releaseEcology.isReleasableHybrid) {
            return [
                `Release ${releaseEcology.batchCount || 0}/10 | next ${releaseEcology.nextWaveRemaining ?? 10} | total ${releaseEcology.totalReleases || 0}`,
                `Carries ${(releaseEcology.releaseLineages || []).slice(0, 3).join(' | ') || 'no strong lineage'} | zone ${releaseEcology.currentZoneLabel || 'garden'}`,
                releaseEcology.cohortId
                    ? `Last wave ${formatEntries(releaseEcology.cohortLineages, 'steady mix')} | root ${releaseEcology.preferredZoneLabel || 'garden'} | blend ${Math.round((releaseEcology.cohortBlendGuard || 0) * 100)}`
                    : `Batch mix ${formatEntries(releaseEcology.batchLineages, 'steady mix')} | zones ${formatEntries(releaseEcology.batchZones, 'current zone')}`
            ].filter(Boolean);
        }

        if (releaseEcology.seededBy === 'release-wave' && releaseEcology.cohortId) {
            return [
                `Wave ${releaseEcology.cohortId} | familiar ${formatEntries(releaseEcology.cohortLineages, 'steady mix')}`,
                `Root ${releaseEcology.preferredZoneLabel || 'garden'} | zone ${Math.round((releaseEcology.preferredZoneShare || 0) * 100)} | blend ${Math.round((releaseEcology.cohortBlendGuard || 0) * 100)}`,
                modifierText ? `Uplift ${modifierText}` : null
            ].filter(Boolean);
        }

        if ((releaseEcology.batchCount || 0) > 0 || releaseEcology.cohortId) {
            return [
                `Batch ${releaseEcology.batchCount || 0}/10 | next ${releaseEcology.nextWaveRemaining ?? 10} | total ${releaseEcology.totalReleases || 0}`,
                `Mix ${formatEntries(releaseEcology.batchLineages, 'steady mix')} | zones ${formatEntries(releaseEcology.batchZones, 'steady garden')}`,
                releaseEcology.cohortId
                    ? `Last wave ${formatEntries(releaseEcology.cohortLineages, 'steady mix')} | root ${releaseEcology.preferredZoneLabel || 'garden'}`
                    : null
            ].filter(Boolean);
        }

        return [];
    }

    buildInheritanceLockLines(lineageContext, mutationProfile = null) {
        if (!lineageContext) return [];
        const lines = [];
        if (lineageContext.alternateParentAbility) {
            lines.push(`Alt ability ${lineageContext.alternateParentAbility} | heritage only`);
        }
        lines.push(mutationProfile?.mutatedTraits?.length
            ? 'Latent none | mutation is baseline truth'
            : 'Latent none | no hidden stat layer');
        return lines;
    }

    buildMutationLines(mutationProfile) {
        if (!mutationProfile?.mutatedTraits?.length) return [];
        const lines = [
            `Mutant ${mutationProfile.tier || 'minor'} | post-average | ${mutationProfile.mutatedTraits.length} shift${mutationProfile.mutatedTraits.length === 1 ? '' : 's'}`
        ];
        const entries = mutationProfile.mutatedTraits.map(trait =>
            `${this.getTraitLabel(trait.key)} ${this.formatSignedTraitValue(trait.delta)}`
        );
        for (let index = 0; index < entries.length; index += 2) {
            lines.push(entries.slice(index, index + 2).join(' | '));
        }
        return lines;
    }

    buildComparisonLines(parentProfile, childTraits, mutationProfile = null) {
        if (!parentProfile) return [];

        const midpoint = parentProfile.midpointTraits;
        const mutatedKeys = new Set((mutationProfile?.mutatedTraits || []).map(trait => trait.key));
        const notableKeys = this.traitKeys
            .map(key => ({
                key,
                delta: Math.abs((childTraits[key] || 0) - (midpoint[key] || 0))
            }))
            .sort((left, right) => right.delta - left.delta)
            .slice(0, 3)
            .map(entry => entry.key);

        const lines = [
            `Parents ${(parentProfile.parentA?.personalityType || '?')} + ${(parentProfile.parentB?.personalityType || '?')}`
        ];

        for (const key of notableKeys) {
            const childValue = childTraits[key] || 0;
            const midValue = midpoint[key] || 0;
            lines.push(`${this.getTraitLabel(key)} ${this.formatTraitValue(childValue)} vs mid ${this.formatTraitValue(midValue)} (${this.formatSignedTraitValue(childValue - midValue)}${mutatedKeys.has(key) ? ' | mutation' : ''})`);
        }

        return lines;
    }

    buildWingLines(parentProfile) {
        if (!parentProfile?.wingDonors) return [];
        const wingDonors = parentProfile.wingDonors;
        return [
            `FL ${wingDonors.foreLeft?.personalityType || '?'} | FR ${wingDonors.foreRight?.personalityType || '?'}`,
            `HL ${wingDonors.hindLeft?.personalityType || '?'} | HR ${wingDonors.hindRight?.personalityType || '?'}`
        ];
    }

    getEntityProfile(entity, gameState = gameCore?.gameState) {
        if (!entity) return null;

        const traitProfile = this.getEffectiveTraits(entity, gameState);
        const parentProfile = this.getParentProfile(entity, gameState);
        const battleProfile = this.buildBattleProfile(entity, gameState);
        const readinessProfile = this.buildReadinessProfile(entity, gameState);
        const mutationProfile = this.getMutationProfile(entity, gameState);
        const lineageContext = this.getLineageContext(entity, gameState, parentProfile);
        const releaseEcology = progressionManager?.getReleaseEcologyContext?.(gameState, entity) || null;

        return {
            baselineTraits: traitProfile.baselineTraits,
            upbringingProfile: traitProfile.upbringingProfile,
            currentStateProfile: traitProfile.currentStateProfile,
            effectiveTraits: traitProfile.effectiveTraits,
            battleProfile,
            readinessProfile,
            parentProfile,
            mutationProfile,
            lineageContext,
            releaseEcology,
            display: {
                baselineLines: this.buildTraitLines(traitProfile.baselineTraits, true),
                abilityLines: this.buildAbilityLines(entity, gameState),
                parentLines: this.buildParentSummaryLines(entity ? parentProfile : null, entity, gameState),
                upbringingLines: this.buildModifierLines(traitProfile.upbringingProfile.modifiers, 'No strong training imprint yet'),
                stateLines: this.buildModifierLines(traitProfile.currentStateProfile.modifiers, 'Current state is close to baseline'),
                effectiveLines: this.buildTraitLines(traitProfile.effectiveTraits, false),
                expressionLines: this.buildExpressionSummaryLines(traitProfile, mutationProfile),
                battleLines: this.buildBattleLines(battleProfile),
                readinessLines: this.buildReadinessLines(readinessProfile),
                comparisonLines: this.buildComparisonLines(parentProfile, traitProfile.baselineTraits, mutationProfile),
                wingLines: this.buildWingLines(parentProfile),
                mutationLines: this.buildMutationLines(mutationProfile),
                heritageLines: this.buildHeritageLines(lineageContext),
                rarityLines: this.buildRarityLines(lineageContext),
                ecologyLines: this.buildEcologyLines(releaseEcology),
                lockLines: this.buildInheritanceLockLines(lineageContext, mutationProfile)
            }
        };
    }

    getJournalProfile(entry, gameState = gameCore?.gameState) {
        if (!entry) return null;
        const baselineTraits = this.getBaselineTraits(entry, gameState);
        const parentProfile = this.getParentProfile(entry, gameState);
        const battleProfile = this.buildBattleProfile(entry, gameState);
        const readinessProfile = this.buildReadinessProfile(entry, gameState);
        const mutationProfile = this.getMutationProfile(entry, gameState);
        const lineageContext = this.getLineageContext(entry, gameState, parentProfile);
        const releaseEcology = progressionManager?.getReleaseEcologyContext?.(gameState, entry) || null;
        return {
            baselineTraits,
            battleProfile,
            readinessProfile,
            parentProfile,
            mutationProfile,
            lineageContext,
            releaseEcology,
            display: {
                baselineLines: this.buildTraitLines(baselineTraits, true),
                abilityLines: this.buildAbilityLines(entry, gameState),
                parentLines: this.buildParentSummaryLines(parentProfile, entry, gameState),
                comparisonLines: this.buildComparisonLines(parentProfile, baselineTraits, mutationProfile),
                battleLines: this.buildBattleLines(battleProfile),
                readinessLines: this.buildReadinessLines(readinessProfile),
                wingLines: this.buildWingLines(parentProfile),
                mutationLines: this.buildMutationLines(mutationProfile),
                heritageLines: this.buildHeritageLines(lineageContext),
                rarityLines: this.buildRarityLines(lineageContext),
                ecologyLines: this.buildEcologyLines(releaseEcology),
                lockLines: this.buildInheritanceLockLines(lineageContext, mutationProfile)
            }
        };
    }

    getArchetypeProfile(personalityType) {
        const baselineTraits = this.getArchetypeTraits(personalityType);
        if (!baselineTraits) return null;
        const subject = {
            personalityType,
            baseType: personalityType,
            specialAbility: BUTTERFLY_VARIANT_ABILITIES?.[personalityType] || null,
            traits: baselineTraits
        };
        const battleProfile = this.buildBattleProfile(subject);
        const readinessProfile = this.buildReadinessProfile(subject);
        baselineTraits.special = this.getAbilityForSubject(subject);
        const lineageContext = this.getLineageContext(subject, gameCore?.gameState, null);
        return {
            baselineTraits,
            battleProfile,
            readinessProfile,
            lineageContext,
            display: {
                baselineLines: this.buildTraitLines(baselineTraits, true),
                abilityLines: this.buildAbilityLines(subject),
                parentLines: [],
                battleLines: this.buildBattleLines(battleProfile),
                readinessLines: this.buildReadinessLines(readinessProfile),
                heritageLines: this.buildHeritageLines(lineageContext),
                rarityLines: this.buildRarityLines(lineageContext),
                ecologyLines: [],
                lockLines: []
            }
        };
    }

    getBattleSnapshot(entity, gameState = gameCore?.gameState) {
        if (!entity) return null;
        const entityProfile = this.getEntityProfile(entity, gameState);
        return {
            baselineTraits: this.cloneTraitBundle(entityProfile.baselineTraits),
            effectiveTraits: this.cloneTraitBundle(entityProfile.effectiveTraits),
            battleStats: { ...entityProfile.battleProfile },
            mutationProfile: entityProfile.mutationProfile ? JSON.parse(JSON.stringify(entityProfile.mutationProfile)) : null
        };
    }
}

const statProfileSystem = new StatProfileSystem();
