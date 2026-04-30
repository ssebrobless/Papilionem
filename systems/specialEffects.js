class SpecialEffectsSystem {
    constructor() {
        this.activeEffects = [];
        this.maxActiveEffects = 18;
        this.audioContext = null;
        this.lastImpactSoundAt = 0;
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (typeof eventBus === 'undefined') return;

        eventBus.on('ability:visual', data => this.addAbilityVisualEffect(data));
        eventBus.on('mating:visual', data => this.addMatingHeartsEffect(data));
        eventBus.on('pollen:sprinkle', data => this.addPollenSprinkleEffect(data));
        eventBus.on('cursor:pet', data => this.addPetEffect(data));
        eventBus.on('cursor:clap', data => {
            this.addClapEffect(data);
            this.playClapSound();
        });
        eventBus.on('training:impact', data => {
            this.addTrainingImpactEffect(data);
            this.playTrainingImpactSound();
        });
    }

    countNearbyEffects(type, x, y, radius = 48) {
        let count = 0;
        for (const effect of this.activeEffects) {
            if (type && effect.type !== type) continue;
            const effectX = effect.x ?? effect.startX;
            const effectY = effect.y ?? effect.startY;
            if (typeof effectX !== 'number' || typeof effectY !== 'number') continue;
            if (dist(effectX, effectY, x, y) <= radius) count++;
        }
        return count;
    }

    addEffect(effect) {
        if (!effect) return;
        const pressure = this.getPressureProfile();
        const normalized = {
            ...effect,
            priority: effect.priority ?? this.getEffectPriority(effect)
        };
        const budget = this.getEffectBudget(pressure);
        if (normalized.priority <= 1 && pressure.isCritical) return;
        if (normalized.priority <= 1 && pressure.isHot && this.activeEffects.length >= Math.max(4, budget - 2)) return;
        if (this.activeEffects.length >= budget && !this.pruneForIncomingEffect(normalized, pressure, budget)) {
            return;
        }
        this.activeEffects.push(normalized);
    }

    findTrackedEntity(sourceId) {
        if (!sourceId) return null;
        const state = gameCore?.gameState;
        if (!state) return null;
        const collections = [
            ...(state.butterflies || []),
            ...(state.caterpillars || []),
            ...(state.flowers || [])
        ];
        return collections.find(entity => entity?.id === sourceId) || null;
    }

    syncEffectAnchor(effect) {
        if (!effect?.sourceId) return;
        const source = this.findTrackedEntity(effect.sourceId);
        if (!source || !Number.isFinite(source.x) || !Number.isFinite(source.y)) return;
        effect.x = source.x;
        effect.y = source.y;
        effect.zoneId = source.currentZoneId || source.lifeSim?.lifecycle?.currentZoneId || effect.zoneId || null;
    }

    shouldDrawEffect(effect) {
        if (!effect) return false;
        if (renderManager?.viewState?.battleActive) return true;
        const focusedZoneId = gameCore?.getFocusedZoneId?.() || null;
        if (!focusedZoneId) return true;
        if (!effect.zoneId) return true;
        return effect.zoneId === focusedZoneId;
    }

    isEffectOnScreen(effect, padding = 32) {
        if (!effect || !Number.isFinite(effect.x) || !Number.isFinite(effect.y)) return false;
        const width = gameConfig?.canvas?.baseWidth || 800;
        const height = gameConfig?.canvas?.baseHeight || 600;
        const radius = Math.max(
            effect.abilityRadius || 0,
            effect.maxRadius || 0,
            effect.radius || 0,
            14
        );
        return effect.x >= -radius - padding
            && effect.x <= width + radius + padding
            && effect.y >= -radius - padding
            && effect.y <= height + radius + padding;
    }

    getVisibleEffectCount() {
        let count = 0;
        for (const effect of this.activeEffects) {
            if (this.shouldDrawEffect(effect) && this.isEffectOnScreen(effect)) {
                count++;
            }
        }
        return count;
    }

    getPressureProfile() {
        return gameCore?.telemetrySystem?.getPressureProfile?.()
            || telemetrySystem?.getPressureProfile?.()
            || {
                tier: 'normal',
                isHot: false,
                isCritical: false,
                visibleEffects: this.getVisibleEffectCount()
            };
    }

    getEffectBudget(pressure = this.getPressureProfile()) {
        switch (pressure?.tier) {
            case 'critical':
                return 8;
            case 'hot':
                return 11;
            case 'warm':
                return 14;
            default:
                return this.maxActiveEffects;
        }
    }

    getEffectPriority(effect) {
        switch (effect?.type) {
            case 'abilityring':
            case 'abilitysymbol':
                return 3;
            case 'trainingimpact':
            case 'clappulse':
                return 2;
            case 'pollensprinkle':
            case 'matinghearts':
            case 'petpulse':
                return 1;
            default:
                return 1;
        }
    }

    pruneForIncomingEffect(incomingEffect, pressure = this.getPressureProfile(), budget = this.getEffectBudget(pressure)) {
        let candidateIndex = -1;
        let candidateScore = Number.POSITIVE_INFINITY;
        const incomingPriority = incomingEffect?.priority ?? this.getEffectPriority(incomingEffect);

        for (let i = 0; i < this.activeEffects.length; i++) {
            const effect = this.activeEffects[i];
            const priority = effect.priority ?? this.getEffectPriority(effect);
            if (priority > incomingPriority && pressure?.isHot) continue;
            const visible = this.shouldDrawEffect(effect) && this.isEffectOnScreen(effect);
            const lifetimeRatio = (effect.maxLifetime && effect.lifetime)
                ? (effect.lifetime / Math.max(1, effect.maxLifetime))
                : 0;
            const score = (priority * 100) + (visible ? 40 : 0) + lifetimeRatio;
            if (score < candidateScore) {
                candidateScore = score;
                candidateIndex = i;
            }
        }

        if (candidateIndex === -1) {
            return false;
        }

        if (this.activeEffects.length >= budget) {
            this.activeEffects.splice(candidateIndex, 1);
            return true;
        }
        return false;
    }

    getRenderPressureProfile() {
        const pressure = this.getPressureProfile();
        const avgRenderMs = pressure?.avgRenderMs || 0;
        const visibleEffects = pressure?.visibleEffects ?? this.getVisibleEffectCount();

        let tier = 'full';
        if (pressure?.isCritical || avgRenderMs > 110 || visibleEffects >= 10) {
            tier = 'minimal';
        } else if (pressure?.isHot || avgRenderMs > 60 || visibleEffects >= 6) {
            tier = 'simplified';
        }

        return {
            tier,
            ringPulseScale: tier === 'full' ? 0.03 : tier === 'simplified' ? 0.015 : 0,
            pollenBudget: tier === 'minimal' ? 6 : tier === 'simplified' ? 9 : 14,
            heartBudget: tier === 'minimal' ? 2 : tier === 'simplified' ? 3 : 5,
            minimalSymbolBadge: tier === 'minimal'
        };
    }

    getBoardPixelsPerUnit(zoneId = null) {
        const projection = renderManager?.getProjectionForZone?.(zoneId) || {};
        return Number.isFinite(projection.ppu)
            ? projection.ppu
            : (gameConfig?.spatial?.projection?.ppu || 20);
    }

    getAbilityRadiusPixels(radiusUnits, zoneId = null) {
        return Math.max(0, radiusUnits || 0) * this.getBoardPixelsPerUnit(zoneId);
    }

    getAbilityRadiusUnits(radiusPx, zoneId = null) {
        const ppu = this.getBoardPixelsPerUnit(zoneId);
        return ppu ? (Math.max(0, radiusPx || 0) / ppu) : 0;
    }

    withAbilityRadiusUnits(defaults, zoneId = null) {
        const abilityRadiusUnits = Number.isFinite(defaults.abilityRadiusUnits)
            ? defaults.abilityRadiusUnits
            : this.getAbilityRadiusUnits(defaults.abilityRadius || 0, zoneId);
        return {
            ...defaults,
            abilityRadiusUnits,
            abilityRadius: Number.isFinite(defaults.abilityRadius)
                ? defaults.abilityRadius
                : this.getAbilityRadiusPixels(abilityRadiusUnits, zoneId)
        };
    }

    getAbilityVisualDefaults(ability = 'ability') {
        const normalizedAbility = ability === 'warmRally'
            ? 'welcome'
            : ability === 'shimmerVeil'
                ? 'shimmerVeil'
                : ability;
        switch (normalizedAbility) {
            case 'welcome':
                return this.withAbilityRadiusUnits({
                    visualStyle: 'ring',
                    abilityRadius: 90,
                    abilityRadiusUnits: 4.5,
                    durationFrames: 28,
                    primaryColor: [255, 165, 0],
                    secondaryColor: [255, 215, 0]
                });
            case 'sparkle':
                return {
                    visualStyle: 'trail',
                    durationFrames: 0,
                    primaryColor: [255, 182, 193],
                    secondaryColor: [255, 20, 147]
                };
            case 'speedzone':
                return this.withAbilityRadiusUnits({
                    visualStyle: 'ring',
                    abilityRadius: 100,
                    abilityRadiusUnits: 5,
                    durationFrames: 32,
                    primaryColor: [138, 43, 226],
                    secondaryColor: [75, 0, 130]
                });
            case 'cascade':
                return {
                    visualStyle: 'symbol',
                    durationFrames: 30,
                    symbol: '🤝',
                    fallbackSymbol: 'S',
                    primaryColor: [0, 255, 127],
                    secondaryColor: [32, 178, 170]
                };
            case 'teacher':
                return {
                    visualStyle: 'symbol',
                    durationFrames: 30,
                    symbol: '📘',
                    fallbackSymbol: 'T',
                    primaryColor: [72, 61, 139],
                    secondaryColor: [106, 90, 205]
                };
            case 'shimmer':
                return this.withAbilityRadiusUnits({
                    visualStyle: 'ring',
                    abilityRadius: 85,
                    abilityRadiusUnits: 4.25,
                    durationFrames: 26,
                    primaryColor: [218, 112, 214],
                    secondaryColor: [0, 255, 255]
                });
            case 'shimmerVeil':
                return this.withAbilityRadiusUnits({
                    visualStyle: 'ring',
                    abilityRadius: 100,
                    abilityRadiusUnits: 5,
                    durationFrames: 26,
                    primaryColor: [218, 112, 214],
                    secondaryColor: [0, 255, 255]
                });
            case 'golden':
                return {
                    visualStyle: 'symbol',
                    durationFrames: 32,
                    symbol: '👑',
                    fallbackSymbol: '★',
                    primaryColor: [255, 215, 0],
                    secondaryColor: [255, 255, 100]
                };
            default:
                return {
                    visualStyle: 'symbol',
                    durationFrames: 24,
                    symbol: '✦',
                    fallbackSymbol: '*',
                    primaryColor: [255, 255, 255],
                    secondaryColor: [200, 200, 200]
                };
        }
    }

    getGroundPlaneProfile() {
        return renderManager?.getGroundPlaneProfile?.()
            || gameConfig?.world?.mapGeometry?.groundPlane
            || {
                ellipseScaleY: 0.56,
                haloScaleY: 0.6,
                centerYOffset: 3
            };
    }

    drawGroundPlaneEllipse(graphics, x, y, width, options = {}) {
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width)) return;
        const profile = this.getGroundPlaneProfile();
        const ellipseScaleY = options.heightScale
            || profile.ellipseScaleY
            || 0.56;
        const centerYOffset = Number.isFinite(options.centerYOffset)
            ? options.centerYOffset
            : (profile.centerYOffset || 0);
        const height = width * ellipseScaleY;
        graphics.ellipse(x, y + centerYOffset, width, height);
    }

    addAbilityVisualEffect(data = {}) {
        const ability = data.ability || 'ability';
        const defaults = this.getAbilityVisualDefaults(ability);
        const visualStyle = data.visualStyle || defaults.visualStyle || 'symbol';
        if (visualStyle === 'trail') return;

        const sourceId = data.sourceId || null;
        const source = this.findTrackedEntity(sourceId);
        const x = source?.x ?? data.x;
        const y = source?.y ?? data.y;
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        const zoneId = source?.currentZoneId || source?.lifeSim?.lifecycle?.currentZoneId || data.zoneId || null;
        const abilityRadiusUnits = Number.isFinite(data.abilityRadiusUnits)
            ? data.abilityRadiusUnits
            : (Number.isFinite(defaults.abilityRadiusUnits)
                ? defaults.abilityRadiusUnits
                : this.getAbilityRadiusUnits(data.abilityRadius || defaults.abilityRadius || 24, zoneId));
        const abilityRadius = Math.max(12, data.abilityRadius || this.getAbilityRadiusPixels(abilityRadiusUnits, zoneId) || defaults.abilityRadius || 24);
        const abilityRadiusDebug = {
            units: Math.round(abilityRadiusUnits * 100) / 100,
            px: Math.round(abilityRadius)
        };

        const effectType = visualStyle === 'ring' ? 'abilityring' : 'abilitysymbol';
        const durationFrames = Math.max(8, data.durationFrames || defaults.durationFrames || 24);
        const existing = sourceId
            ? this.activeEffects.find(effect =>
                effect.type === effectType &&
                effect.sourceId === sourceId &&
                effect.ability === ability)
            : null;

        if (existing) {
            existing.x = x;
            existing.y = y;
            existing.lifetime = durationFrames;
            existing.maxLifetime = durationFrames;
            existing.primaryColor = data.primaryColor || defaults.primaryColor || existing.primaryColor;
            existing.secondaryColor = data.secondaryColor || defaults.secondaryColor || existing.secondaryColor;
            existing.abilityRadiusUnits = abilityRadiusUnits;
            existing.abilityRadius = abilityRadius;
            existing.abilityRadiusDebug = abilityRadiusDebug;
            existing.symbol = data.symbol || defaults.symbol || existing.symbol || null;
            existing.fallbackSymbol = data.fallbackSymbol || defaults.fallbackSymbol || existing.fallbackSymbol || null;
            return;
        }

        if (!sourceId && this.countNearbyEffects(effectType, x, y, visualStyle === 'ring' ? 48 : 22) >= 1) return;

        this.addEffect({
            type: effectType,
            ability,
            sourceId,
            zoneId,
            x,
            y,
            lifetime: durationFrames,
            maxLifetime: durationFrames,
            abilityRadiusUnits,
            abilityRadius,
            abilityRadiusDebug,
            symbol: data.symbol || defaults.symbol || null,
            fallbackSymbol: data.fallbackSymbol || defaults.fallbackSymbol || null,
            phaseOffset: random(0, 200),
            primaryColor: data.primaryColor || defaults.primaryColor || [255, 255, 255],
            secondaryColor: data.secondaryColor || defaults.secondaryColor || data.primaryColor || defaults.primaryColor || [255, 255, 255]
        });
    }

    addMatingHeartsEffect(data = {}) {
        if (!Number.isFinite(data.x) || !Number.isFinite(data.y)) return;
        if (this.getPressureProfile().isHot) return;
        if (this.countNearbyEffects('matinghearts', data.x, data.y, 30) >= 1) return;

        const hearts = [];
        for (let i = 0; i < 5; i++) {
            hearts.push({
                x: random(-9, 9),
                y: random(-7, 7),
                driftX: random(-0.18, 0.18),
                driftY: random(-0.55, -0.25),
                size: random(5, 7)
            });
        }

        this.addEffect({
            type: 'matinghearts',
            priority: 1,
            zoneId: data.zoneId || null,
            x: data.x,
            y: data.y,
            hearts,
            lifetime: 34,
            maxLifetime: 34
        });
    }

    addPollenSprinkleEffect(data = {}) {
        if (!Number.isFinite(data.x) || !Number.isFinite(data.y)) return;
        if (this.getPressureProfile().isCritical) return;

        const particles = [];
        for (let i = 0; i < 14; i++) {
            particles.push({
                x: random(-7, 7),
                y: random(-12, 2),
                vx: random(-0.22, 0.22),
                vy: random(-0.12, 0.28),
                size: random(1.5, 2.8),
                color: random([
                    [255, 243, 160],
                    [255, 224, 120],
                    [255, 210, 90]
                ])
            });
        }

        this.addEffect({
            type: 'pollensprinkle',
            priority: 1,
            zoneId: data.zoneId || null,
            x: data.x,
            y: data.y,
            particles,
            lifetime: 45,
            maxLifetime: 45
        });
    }

    addTrainingImpactEffect(data = {}) {
        if (!Number.isFinite(data.x) || !Number.isFinite(data.y)) return;
        if (this.countNearbyEffects('trainingimpact', data.x, data.y, 18) >= 1) return;
        const impactStrength = Math.max(1, data.impactStrength || 6);

        this.addEffect({
            type: 'trainingimpact',
            priority: 2,
            zoneId: data.zoneId || null,
            x: data.x,
            y: data.y,
            lifetime: 14,
            maxLifetime: 14,
            radius: 4 + (impactStrength * 0.08),
            maxRadius: 12 + (impactStrength * 0.3)
        });
    }

    addPetEffect(data = {}) {
        if (!Number.isFinite(data.x) || !Number.isFinite(data.y)) return;
        this.addEffect({
            type: 'petpulse',
            priority: 1,
            zoneId: data.zoneId || null,
            x: data.x,
            y: data.y,
            lifetime: 20,
            maxLifetime: 20,
            radius: 4,
            maxRadius: 12,
            color: data.colors || [140, 255, 140]
        });
    }

    addClapEffect(data = {}) {
        if (!Number.isFinite(data.x) || !Number.isFinite(data.y)) return;
        if (this.countNearbyEffects('clappulse', data.x, data.y, 18) >= 1) return;
        this.addEffect({
            type: 'clappulse',
            priority: 2,
            zoneId: data.zoneId || null,
            x: data.x,
            y: data.y,
            lifetime: 14,
            maxLifetime: 14,
            radius: 6,
            maxRadius: 22
        });
    }

    getAudioContext() {
        if (this.audioContext) return this.audioContext;
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return null;
        this.audioContext = new AudioCtor();
        return this.audioContext;
    }

    playTrainingImpactSound() {
        const nowMs = Date.now();
        if (nowMs - this.lastImpactSoundAt < 60) return;
        this.lastImpactSoundAt = nowMs;

        const context = this.getAudioContext();
        if (!context) return;

        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.08);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.02, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }

    playClapSound() {
        const nowMs = Date.now();
        if (nowMs - this.lastImpactSoundAt < 45) return;
        this.lastImpactSoundAt = nowMs;

        const context = this.getAudioContext();
        if (!context) return;

        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(520, now);
        oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.06);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.035, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.09);
    }

    update() {
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            this.syncEffectAnchor(effect);
            effect.lifetime--;

            switch (effect.type) {
                case 'matinghearts':
                    for (const heart of effect.hearts) {
                        heart.x += heart.driftX;
                        heart.y += heart.driftY;
                    }
                    break;
                case 'pollensprinkle':
                    for (const particle of effect.particles) {
                        particle.x += particle.vx;
                        particle.y += particle.vy;
                        particle.vy += 0.01;
                    }
                    break;
                case 'trainingimpact':
                    effect.radius = lerp(effect.radius, effect.maxRadius, 0.35);
                    break;
                case 'petpulse':
                    effect.radius = lerp(effect.radius, effect.maxRadius, 0.28);
                    break;
                case 'clappulse':
                    effect.radius = lerp(effect.radius, effect.maxRadius, 0.42);
                    break;
            }

            if (effect.lifetime <= 0) {
                this.activeEffects.splice(i, 1);
            }
        }
    }

    draw(graphics) {
        const renderProfile = this.getRenderPressureProfile();
        for (const effect of this.activeEffects) {
            if (!this.shouldDrawEffect(effect)) continue;
            if (!this.isEffectOnScreen(effect)) continue;
            const alpha = (effect.lifetime / effect.maxLifetime) * 255;

            switch (effect.type) {
                case 'abilityring':
                    this.drawAbilityRing(graphics, effect, alpha, renderProfile);
                    break;
                case 'abilitysymbol':
                    this.drawAbilitySymbol(graphics, effect, alpha, renderProfile);
                    break;
                case 'matinghearts':
                    this.drawMatingHearts(graphics, effect, alpha, renderProfile);
                    break;
                case 'pollensprinkle':
                    this.drawPollenSprinkle(graphics, effect, alpha, renderProfile);
                    break;
                case 'trainingimpact':
                    this.drawTrainingImpact(graphics, effect, alpha);
                    break;
                case 'petpulse':
                    this.drawPetPulse(graphics, effect, alpha);
                    break;
                case 'clappulse':
                    this.drawClapPulse(graphics, effect, alpha);
                    break;
            }
        }
    }

    drawAbilityRing(graphics, effect, alpha, renderProfile = null) {
        graphics.push();
        graphics.noFill();
        const performanceProfile = renderProfile || this.getRenderPressureProfile();
        const groundPlaneProfile = this.getGroundPlaneProfile();
        const pulse = 1 + (sin((frameCount + effect.phaseOffset) * 0.08) * (performanceProfile.ringPulseScale ?? 0.03));
        const baseRadius = Number.isFinite(effect.abilityRadiusUnits)
            ? this.getAbilityRadiusPixels(effect.abilityRadiusUnits, effect.zoneId)
            : (effect.abilityRadius || 24);
        const radius = baseRadius * pulse;
        if (performanceProfile.tier === 'minimal') {
            graphics.stroke(effect.secondaryColor[0], effect.secondaryColor[1], effect.secondaryColor[2], alpha * 0.58);
            graphics.strokeWeight(1.4);
            this.drawGroundPlaneEllipse(graphics, effect.x, effect.y, radius * 1.92, {
                heightScale: groundPlaneProfile.haloScaleY || groundPlaneProfile.ellipseScaleY
            });
            graphics.pop();
            return;
        }
        if (performanceProfile.tier === 'simplified') {
            graphics.stroke(effect.primaryColor[0], effect.primaryColor[1], effect.primaryColor[2], alpha * 0.24);
            graphics.strokeWeight(2.7);
            this.drawGroundPlaneEllipse(graphics, effect.x, effect.y, radius * 2.02, {
                heightScale: groundPlaneProfile.haloScaleY || groundPlaneProfile.ellipseScaleY
            });
            graphics.stroke(effect.secondaryColor[0], effect.secondaryColor[1], effect.secondaryColor[2], alpha * 0.6);
            graphics.strokeWeight(1.2);
            this.drawGroundPlaneEllipse(graphics, effect.x, effect.y, radius * 1.82);
            graphics.pop();
            return;
        }
        graphics.stroke(effect.primaryColor[0], effect.primaryColor[1], effect.primaryColor[2], alpha * 0.14);
        graphics.strokeWeight(5);
        this.drawGroundPlaneEllipse(graphics, effect.x, effect.y, radius * 2.1, {
            heightScale: groundPlaneProfile.haloScaleY || groundPlaneProfile.ellipseScaleY
        });
        graphics.stroke(effect.primaryColor[0], effect.primaryColor[1], effect.primaryColor[2], alpha * 0.7);
        graphics.strokeWeight(1.9);
        this.drawGroundPlaneEllipse(graphics, effect.x, effect.y, radius * 2);
        graphics.stroke(effect.secondaryColor[0], effect.secondaryColor[1], effect.secondaryColor[2], alpha * 0.48);
        graphics.strokeWeight(1);
        this.drawGroundPlaneEllipse(graphics, effect.x, effect.y, radius * 1.78);
        graphics.pop();
    }

    drawAbilitySymbol(graphics, effect, alpha, renderProfile = null) {
        const progress = 1 - (effect.lifetime / Math.max(1, effect.maxLifetime));
        const y = effect.y - 20 - (progress * 8);
        const symbol = effect.symbol || effect.fallbackSymbol || '✦';
        const profile = renderProfile || this.getRenderPressureProfile();

        graphics.push();
        graphics.textAlign(CENTER, CENTER);
        if (!profile.minimalSymbolBadge) {
            graphics.stroke(effect.primaryColor[0], effect.primaryColor[1], effect.primaryColor[2], alpha * 0.45);
            graphics.strokeWeight(1.2);
            graphics.fill(14, 20, 22, alpha * 0.7);
            graphics.circle(effect.x, y, 18);
            graphics.noStroke();
        } else {
            graphics.noStroke();
        }
        graphics.fill(effect.secondaryColor[0], effect.secondaryColor[1], effect.secondaryColor[2], alpha * 0.95);
        graphics.textSize(profile.minimalSymbolBadge ? 10 : 11);
        graphics.text(symbol, effect.x, y + 0.5);
        graphics.pop();
    }

    drawMatingHearts(graphics, effect, alpha, renderProfile = null) {
        const profile = renderProfile || this.getRenderPressureProfile();
        graphics.push();
        graphics.textAlign(CENTER, CENTER);
        graphics.noStroke();
        const heartLimit = Math.min(effect.hearts.length, profile.heartBudget || effect.hearts.length);
        for (let i = 0; i < heartLimit; i++) {
            const heart = effect.hearts[i];
            graphics.fill(255, 70, 95, alpha * 0.9);
            graphics.textSize(heart.size);
            graphics.text('♥', effect.x + heart.x, effect.y + heart.y);
        }
        graphics.pop();
    }

    drawPollenSprinkle(graphics, effect, alpha, renderProfile = null) {
        const profile = renderProfile || this.getRenderPressureProfile();
        graphics.push();
        graphics.noStroke();
        const particleLimit = Math.min(effect.particles.length, profile.pollenBudget || effect.particles.length);
        for (let i = 0; i < particleLimit; i++) {
            const particle = effect.particles[i];
            graphics.fill(particle.color[0], particle.color[1], particle.color[2], alpha * 0.7);
            graphics.ellipse(effect.x + particle.x, effect.y + particle.y, particle.size, particle.size);
        }
        graphics.pop();
    }

    drawTrainingImpact(graphics, effect, alpha) {
        graphics.push();
        graphics.noFill();
        graphics.stroke(210, 210, 230, alpha * 0.55);
        graphics.strokeWeight(1.4);
        this.drawGroundPlaneEllipse(graphics, effect.x, effect.y, effect.radius * 2.1);
        graphics.pop();
    }

    drawPetPulse(graphics, effect, alpha) {
        graphics.push();
        graphics.noFill();
        graphics.stroke(effect.color[0], effect.color[1], effect.color[2], alpha * 0.6);
        graphics.strokeWeight(1.2);
        this.drawGroundPlaneEllipse(graphics, effect.x, effect.y, effect.radius * 2);
        graphics.pop();
    }

    drawClapPulse(graphics, effect, alpha) {
        graphics.push();
        graphics.noFill();
        graphics.stroke(245, 245, 255, alpha * 0.75);
        graphics.strokeWeight(1.5);
        this.drawGroundPlaneEllipse(graphics, effect.x, effect.y, effect.radius * 2.3);
        graphics.pop();
    }
}

const specialEffectsSystem = new SpecialEffectsSystem();
const specialEffects = specialEffectsSystem;

if (typeof window !== 'undefined') {
    window.specialEffects = specialEffectsSystem;
    window.specialEffectsSystem = specialEffectsSystem;
}
