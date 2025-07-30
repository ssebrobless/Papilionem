// Butterfly Collection UI - Displays which butterflies have been seen and collected
class ButterflyCollectionUI {
    constructor() {
        console.log('ButterflyCollectionUI: Constructor called');
        this.x = 20;
        this.y = 20;
        this.width = 300;
        this.entryHeight = 60;
        this.padding = 15;
        this.visible = false;
        this.fadeAlpha = 0;
        this.fadeSpeed = 10;
        
        // Butterfly display order (common to rare)
        this.butterflyOrder = [
            'friendly',
            'cautious',
            'energetic',
            'skittish',
            'wise',
            'mystic',
            'golden'
        ];
        
        // Cache for rendering
        this.lastUpdateFrame = -1;
        this.cachedHeight = 0;
    }
    
    toggle() {
        console.log('ButterflyCollectionUI: toggle() called');
        console.log('ButterflyCollectionUI: visible before toggle:', this.visible);
        this.visible = !this.visible;
        console.log('ButterflyCollectionUI: visible after toggle:', this.visible);
        console.log(`Butterfly collection ${this.visible ? 'shown' : 'hidden'}`);
    }
    
    update() {
        // Smooth fade in/out
        if (this.visible && this.fadeAlpha < 255) {
            this.fadeAlpha = Math.min(255, this.fadeAlpha + this.fadeSpeed);
            if (frameCount % 60 === 0) { // Log every second while fading in
                console.log('ButterflyCollectionUI: Fading in, alpha:', this.fadeAlpha);
            }
        } else if (!this.visible && this.fadeAlpha > 0) {
            this.fadeAlpha = Math.max(0, this.fadeAlpha - this.fadeSpeed);
        }
        
        // Calculate height based on number of butterflies
        if (frameCount !== this.lastUpdateFrame) {
            const visibleButterflies = this.getVisibleButterflies();
            this.cachedHeight = this.padding * 2 + visibleButterflies.length * this.entryHeight;
            this.lastUpdateFrame = frameCount;
        }
    }
    
    getVisibleButterflies() {
        if (!gameCore || !gameCore.gameState) return [];
        
        // Show butterflies that have been encountered
        return this.butterflyOrder.filter(type => {
            return gameCore.gameState.encounteredButterflies.has(type) || 
                   type === 'golden'; // Always show golden as a goal
        });
    }
    
    draw(graphics) {
        if (frameCount % 60 === 0 && this.visible) { // Log every second if visible
            console.log('ButterflyCollectionUI: draw() called, fadeAlpha:', this.fadeAlpha, 'visible:', this.visible);
        }
        
        if (this.fadeAlpha <= 0) {
            if (this.visible) {
                console.warn('ButterflyCollectionUI: visible is true but fadeAlpha is 0!');
            }
            return;
        }
        
        console.log('ButterflyCollectionUI: Drawing with fadeAlpha:', this.fadeAlpha);
        const visibleButterflies = this.getVisibleButterflies();
        const height = this.cachedHeight;
        
        graphics.push();
        
        // Background panel
        graphics.fill(20, 20, 30, this.fadeAlpha * 0.9);
        graphics.stroke(255, 255, 255, this.fadeAlpha * 0.3);
        graphics.strokeWeight(2);
        graphics.rect(this.x, this.y, this.width, height, 10);
        
        // Title
        graphics.noStroke();
        graphics.fill(255, 255, 255, this.fadeAlpha);
        graphics.textAlign(CENTER, TOP);
        graphics.textSize(20);
        graphics.text('Butterfly Collection', this.x + this.width/2, this.y + 10);
        
        // Draw each butterfly entry
        let yOffset = this.y + 40;
        for (let type of visibleButterflies) {
            this.drawButterflyEntry(graphics, type, yOffset);
            yOffset += this.entryHeight;
        }
        
        // Collection progress
        const collected = gameCore.gameState.collectedButterflies.size;
        const total = this.butterflyOrder.length;
        graphics.textAlign(CENTER, BOTTOM);
        graphics.textSize(14);
        graphics.fill(255, 255, 200, this.fadeAlpha * 0.8);
        graphics.text(`${collected}/${total} Collected`, this.x + this.width/2, this.y + height - 5);
        
        graphics.pop();
    }
    
    drawButterflyEntry(graphics, type, y) {
        const personality = BUTTERFLY_PERSONALITIES[type];
        const isCollected = gameCore.gameState.collectedButterflies.has(type);
        const isEncountered = gameCore.gameState.encounteredButterflies.has(type);
        
        // Entry background
        if (isCollected) {
            graphics.fill(100, 255, 100, this.fadeAlpha * 0.1);
            graphics.noStroke();
            graphics.rect(this.x + 5, y, this.width - 10, this.entryHeight - 5, 5);
        }
        
        // Butterfly icon/silhouette
        const iconX = this.x + 35;
        const iconY = y + this.entryHeight/2;
        
        if (isEncountered || type === 'golden') {
            // Draw butterfly shape
            this.drawButterflyIcon(graphics, iconX, iconY, personality, isCollected, type === 'golden');
        } else {
            // Unknown - show ???
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(20);
            graphics.fill(100, 100, 100, this.fadeAlpha);
            graphics.text('?', iconX, iconY);
        }
        
        // Butterfly name
        graphics.textAlign(LEFT, CENTER);
        graphics.textSize(16);
        if (isCollected) {
            graphics.fill(100, 255, 100, this.fadeAlpha);
        } else if (isEncountered) {
            graphics.fill(255, 255, 255, this.fadeAlpha * 0.7);
        } else {
            graphics.fill(150, 150, 150, this.fadeAlpha * 0.5);
        }
        
        const displayName = type.charAt(0).toUpperCase() + type.slice(1);
        graphics.text(displayName, this.x + 65, y + 20);
        
        // Rarity and status
        graphics.textSize(12);
        if (isEncountered || type === 'golden') {
            graphics.fill(200, 200, 200, this.fadeAlpha * 0.6);
            graphics.text(personality.rarity, this.x + 65, y + 38);
            
            // Collection status
            if (isCollected) {
                graphics.fill(100, 255, 100, this.fadeAlpha);
                graphics.text('✓ Collected', this.x + 200, y + this.entryHeight/2);
            } else if (type === 'golden') {
                // Special message for golden
                graphics.fill(255, 215, 0, this.fadeAlpha * 0.8);
                graphics.text('Lead all others', this.x + 180, y + this.entryHeight/2);
            } else {
                graphics.fill(255, 255, 100, this.fadeAlpha * 0.6);
                graphics.text('Lead to collect', this.x + 180, y + this.entryHeight/2);
            }
        }
    }
    
    drawButterflyIcon(graphics, x, y, personality, isCollected, isGolden) {
        graphics.push();
        graphics.translate(x, y);
        
        const alpha = isCollected ? this.fadeAlpha : this.fadeAlpha * 0.5;
        const scale = 0.8;
        
        // Simple butterfly shape
        graphics.noStroke();
        
        // Wings
        const wingColor = personality.colors[0];
        if (isGolden && !gameCore.gameState.encounteredButterflies.has('golden')) {
            // Golden not yet revealed - show as silhouette
            graphics.fill(100, 100, 100, alpha);
        } else {
            graphics.fill(wingColor[0], wingColor[1], wingColor[2], alpha);
        }
        
        // Left wing
        graphics.push();
        graphics.scale(scale);
        graphics.beginShape();
        graphics.vertex(-15, -5);
        graphics.bezierVertex(-20, -15, -25, -10, -20, 0);
        graphics.bezierVertex(-25, 10, -20, 15, -15, 5);
        graphics.vertex(-5, 0);
        graphics.endShape(CLOSE);
        
        // Right wing
        graphics.beginShape();
        graphics.vertex(15, -5);
        graphics.bezierVertex(20, -15, 25, -10, 20, 0);
        graphics.bezierVertex(25, 10, 20, 15, 15, 5);
        graphics.vertex(5, 0);
        graphics.endShape(CLOSE);
        
        // Body
        graphics.fill(40, 30, 20, alpha);
        graphics.rect(-3, -8, 6, 16);
        graphics.pop();
        
        // Collection checkmark
        if (isCollected) {
            graphics.fill(100, 255, 100, this.fadeAlpha);
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(16);
            graphics.text('✓', 0, 15);
        }
        
        graphics.pop();
    }
}