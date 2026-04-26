class Caterpillar extends Entity {
    constructor(x, y, lifecycleData = {}, options = {}) {
        super(x, y);
        this.id = generateEntityId('caterpillar');
        this.currentZoneId = options.currentZoneId || lifecycleData.currentZoneId || null;
        this.shadowOffset = 1;
        this.size = 24;
        this.lifecycleData = lifecycleData;
        this.phase = 'seekingFood';
        this.phaseStartedAt = frameCount;
        this.phaseTimeout = 60 * 300; // 5 minutes
        this.minimumLarvalFrames = 60 * 40;
        this.speed = 0.18;
        this.targetFlower = null;
        this.dead = false;
        this.animationFrames = [0, 1, 2, 1];
        this.animationSpeed = 8;
        this.lifeSim = createBaseLifeSimState({
            entityType: 'caterpillar',
            archetype: 'caterpillar',
            source: lifecycleData.birthSource || 'garden',
            drives: {
                selfMaintenance: 0.55,
                safetyAvoidance: 0.2,
                resourceControl: 0.35,
                socialConnection: 0.05,
                caregiving: 0,
                exploration: 0.15,
                statusExpression: 0,
                rest: 0.25
            },
            emotions: {
                curiosity: 0.15,
                agitation: 0.1,
                exhaustion: 0.1
            },
            genetics: {
                source: lifecycleData.birthSource || 'garden',
                heritageTags: ['caterpillar']
            },
            lifecycle: {
                stage: 'larval',
                currentZoneId: this.currentZoneId
            }
        });
    }

    update(gameState) {
        if (this.dead) return;
        this.lifeSim.lifecycle.ageTicks++;
        this.lifeSim.lifecycle.stage = this.phase;
        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || this.lifecycleData?.currentZoneId || null;
        const interactionSpace = (typeof gameCore !== 'undefined' && gameCore?.getCaterpillarInteractionSpace)
            ? gameCore.getCaterpillarInteractionSpace(zoneId, { entity: this })
            : null;

        this.acquireTarget(gameState.flowers || []);
        if (!this.targetFlower) {
            if (frameCount - this.phaseStartedAt >= this.phaseTimeout) {
                this.dead = true;
                this.failReason = 'starved';
            }
            this.updateZIndex();
            return;
        }

        const dx = this.targetFlower.x - this.x;
        const dy = this.targetFlower.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= (interactionSpace?.reachRadius || 8)) {
            this.onReachFlower(gameState);
            this.updateZIndex();
            return;
        }

        if (frameCount - this.phaseStartedAt >= this.phaseTimeout) {
            this.dead = true;
            this.failReason = 'starved';
            return;
        }

        const moveX = dx / Math.max(dist, 0.001);
        const moveY = dy / Math.max(dist, 0.001);
        const nextX = this.x + moveX * this.speed;
        const nextY = this.y + moveY * this.speed;
        const clampedPoint = zoneId && typeof gameCore !== 'undefined' && gameCore?.clampPlacementPointInZone
            ? gameCore.clampPlacementPointInZone(zoneId, nextX, nextY, interactionSpace?.clampPadding || 8)
            : { x: nextX, y: nextY };
        this.x = clampedPoint.x;
        this.y = clampedPoint.y;
        this.gridPos = gridManager.screenToIso(this.x, this.y);
        this.updateZIndex();
    }

    acquireTarget(flowers) {
        if (this.targetFlower && flowers.includes(this.targetFlower) && this.targetFlower.canHostCaterpillar(this.phase)) {
            return;
        }

        this.targetFlower = null;
        let bestDistance = Infinity;
        const searchingForChrysalis = this.phase === 'seekingChrysalis';
        const canSeekChrysalisNow = !searchingForChrysalis || (frameCount - this.phaseStartedAt >= this.minimumLarvalFrames);
        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || this.lifecycleData?.currentZoneId || null;

        if (searchingForChrysalis && !canSeekChrysalisNow) {
            return;
        }

        for (const flower of flowers) {
            if (
                zoneId
                && typeof gameCore !== 'undefined'
                && gameCore?.getEntityZoneId
                && gameCore.getEntityZoneId(flower, zoneId) !== zoneId
            ) {
                continue;
            }
            if (!flower.canHostCaterpillar(this.phase)) continue;
            const distance = Math.hypot(flower.x - this.x, flower.y - this.y);
            if (distance < bestDistance) {
                bestDistance = distance;
                this.targetFlower = flower;
            }
        }
    }

    onReachFlower(gameState) {
        if (!this.targetFlower) return;

        if (this.phase === 'seekingFood') {
            this.targetFlower.consumeByCaterpillar(gameState.particleSystem);
            this.phase = 'seekingChrysalis';
            this.lifeSim.drives.resourceControl = 0.1;
            this.lifeSim.drives.rest = 0.45;
            this.phaseStartedAt = frameCount;
            this.targetFlower = null;
            return;
        }

        if (this.phase === 'seekingChrysalis') {
            this.targetFlower.becomeChrysalisFlower(this.lifecycleData);
            this.dead = true;
        }
    }

    isDead() {
        return this.dead;
    }

    drawEntity(graphics, alpha) {
        const frames = spriteManager.caterpillarFrames || [];
        const frameIndex = this.animationFrames[Math.floor(frameCount / this.animationSpeed) % this.animationFrames.length];
        const frame = frames[frameIndex];

        graphics.push();
        graphics.translate(this.x, this.y);

        if (frame) {
            const s = (this.size * 1.7) / 1080;
            const drawFrame = frame;
            const w = frame.width * s;
            const h = frame.height * s;
            const drawX = -w / 2;
            const drawY = -h / 2;
            if (alpha < 255) {
                graphics.tint(255, alpha);
            }
            graphics.image(drawFrame, drawX, drawY, w, h);
            if (alpha < 255) {
                graphics.noTint();
            }
        } else {
            graphics.noStroke();
            graphics.fill(122, 216, 92, alpha);
            graphics.ellipse(0, 0, 20, 11);
            graphics.fill(74, 142, 48, alpha);
            graphics.ellipse(7, 0, 12, 8);
            graphics.fill(38, 64, 24, alpha);
            graphics.ellipse(-6, 0, 4, 4);
        }

        graphics.pop();
    }
}
