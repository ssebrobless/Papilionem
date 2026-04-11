class Caterpillar extends Entity {
    constructor(x, y, lifecycleData = {}) {
        super(x, y);
        this.id = generateEntityId('caterpillar');
        this.shadowOffset = 1;
        this.size = 12;
        this.lifecycleData = lifecycleData;
        this.phase = 'seekingFood';
        this.phaseStartedAt = frameCount;
        this.phaseTimeout = 60 * 180; // 3 minutes
        this.speed = 0.35;
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
                stage: 'larval'
            }
        });
    }

    update(gameState) {
        if (this.dead) return;
        this.lifeSim.lifecycle.ageTicks++;
        this.lifeSim.lifecycle.stage = this.phase;

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

        if (dist <= 8) {
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
        this.x += moveX * this.speed;
        this.y += moveY * this.speed;
        this.gridPos = gridManager.screenToIso(this.x, this.y);
        this.updateZIndex();
    }

    acquireTarget(flowers) {
        if (this.targetFlower && flowers.includes(this.targetFlower) && this.targetFlower.canHostCaterpillar(this.phase)) {
            return;
        }

        this.targetFlower = null;
        let bestDistance = Infinity;

        for (const flower of flowers) {
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
            const s = (this.size * 1.2) / 1080;
            const w = frame.width * s;
            const h = frame.height * s;
            if (alpha < 255) {
                graphics.tint(255, alpha);
            }
            graphics.image(frame, -w / 2, -h / 2, w, h);
            if (alpha < 255) {
                graphics.noTint();
            }
        } else {
            graphics.noStroke();
            graphics.fill(90, 180, 70, alpha);
            graphics.ellipse(0, 0, 14, 8);
            graphics.fill(60, 120, 50, alpha);
            graphics.ellipse(5, 0, 8, 6);
        }

        graphics.pop();
    }
}
