// Butterfly Collection UI - A field notebook for butterfly observations
class ButterflyCollectionUI {
    constructor() {
        // Scale UI based on canvas size
        const scale = Math.min(gameConfig.canvas.baseWidth / 800, gameConfig.canvas.baseHeight / 600);
        this.width = Math.min(360 * scale, gameConfig.canvas.baseWidth * 0.8);
        this.height = Math.min(440 * scale, gameConfig.canvas.baseHeight * 0.85);
        
        // Center in screen with margin
        this.x = (gameConfig.canvas.baseWidth - this.width) / 2;
        this.y = (gameConfig.canvas.baseHeight - this.height) / 2;
        this.padding = 20 * scale;
        this.visible = false;
        this.fadeAlpha = 0;
        this.fadeSpeed = 10;
        
        // Current page/butterfly being viewed
        this.currentIndex = 0;
        
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
        
        // Journal entries for each butterfly type
        this.journalEntries = {
            friendly: {
                title: "The Warm Welcome",
                notes: [
                    "Bright orange & gold wings catch the morning sun",
                    "Approaches without fear - curious about everything!",
                    "Often the first to greet visitors to the garden",
                    "Trusts quickly, loves to share flower discoveries"
                ],
                sketch: "Wings like autumn leaves, always dancing"
            },
            cautious: {
                title: "The Delicate Pink",
                notes: [
                    "Soft pink petals for wings, spotted with deeper hues",
                    "Moves slowly, thoughtfully - each flight deliberate",
                    "When happy, leaves a trail of sparkling dust",
                    "Rewards patient observers with beautiful displays"
                ],
                sketch: "Like cherry blossoms on the breeze"
            },
            energetic: {
                title: "The Electric Violet",
                notes: [
                    "Purple wings shimmer with lightning patterns",
                    "Never stops moving - zippy, erratic flight paths",
                    "Creates mysterious speed zones in its wake",
                    "Burns bright but shares energy generously"
                ],
                sketch: "A living spark of purple electricity"
            },
            skittish: {
                title: "The Nervous Jewel",
                notes: [
                    "Spring green meets turquoise in jagged patterns",
                    "Extremely jumpy - the slightest movement sends it flying",
                    "But oh! When it trusts, others follow its lead",
                    "Creates beautiful trust cascades in the garden"
                ],
                sketch: "Quick as thought, precious as jade"
            },
            wise: {
                title: "The Ancient Scholar",
                notes: [
                    "Deep blue wings carry the weight of knowledge",
                    "Moves with purpose, unruffled by chaos",
                    "Other butterflies learn from watching it feed",
                    "Doubles the joy found at blessed flowers"
                ],
                sketch: "Midnight blue sage of the garden"
            },
            mystic: {
                title: "The Twilight Dancer",
                notes: [
                    "Wings shift between deep purple and shadows",
                    "Appears when the garden's magic is strongest",
                    "Phases through normal space - can't be caught",
                    "Enhances nearby flowers with ethereal energy"
                ],
                sketch: "Not quite here, not quite there"
            },
            golden: {
                title: "The Legendary One",
                notes: [
                    "Pure golden wings that shimmer like liquid sunlight",
                    "Appears only when all others have been befriended",
                    "The ultimate symbol of a thriving garden",
                    "Brings completion to the ephemeral cycle"
                ],
                sketch: "The crown jewel of the butterfly realm"
            }
        };
        
        // UI scale for responsive sizing
        this.scale = scale;
        
        // Arrow button positions
        this.leftArrow = {
            x: this.x + 20,
            y: this.y + this.height / 2,
            width: 30,
            height: 40
        };
        
        this.rightArrow = {
            x: this.x + this.width - 50,
            y: this.y + this.height / 2,
            width: 30,
            height: 40
        };
    }
    
    toggle() {
        this.visible = !this.visible;
        if (this.visible) {
            // Start at first encountered butterfly
            this.currentIndex = 0;
            const encountered = this.getEncounteredButterflies();
            if (encountered.length > 0) {
                const firstEncountered = encountered[0];
                this.currentIndex = this.butterflyOrder.indexOf(firstEncountered);
            }
        }
    }
    
    update() {
        // Smooth fade in/out
        if (this.visible && this.fadeAlpha < 255) {
            this.fadeAlpha = Math.min(255, this.fadeAlpha + this.fadeSpeed);
        } else if (!this.visible && this.fadeAlpha > 0) {
            this.fadeAlpha = Math.max(0, this.fadeAlpha - this.fadeSpeed);
        }
    }
    
    getEncounteredButterflies() {
        if (!gameCore || !gameCore.gameState) return [];
        
        // Show butterflies that have been encountered
        return this.butterflyOrder.filter(type => {
            return gameCore.gameState.encounteredButterflies.has(type) || 
                   type === 'golden'; // Always show golden as a goal
        });
    }
    
    navigateLeft() {
        const encountered = this.getEncounteredButterflies();
        if (encountered.length === 0) return;
        
        // Find previous encountered butterfly
        for (let i = this.currentIndex - 1; i >= 0; i--) {
            if (encountered.includes(this.butterflyOrder[i])) {
                this.currentIndex = i;
                break;
            }
        }
    }
    
    navigateRight() {
        const encountered = this.getEncounteredButterflies();
        if (encountered.length === 0) return;
        
        // Find next encountered butterfly
        for (let i = this.currentIndex + 1; i < this.butterflyOrder.length; i++) {
            if (encountered.includes(this.butterflyOrder[i])) {
                this.currentIndex = i;
                break;
            }
        }
    }
    
    canNavigateLeft() {
        const encountered = this.getEncounteredButterflies();
        for (let i = this.currentIndex - 1; i >= 0; i--) {
            if (encountered.includes(this.butterflyOrder[i])) {
                return true;
            }
        }
        return false;
    }
    
    canNavigateRight() {
        const encountered = this.getEncounteredButterflies();
        for (let i = this.currentIndex + 1; i < this.butterflyOrder.length; i++) {
            if (encountered.includes(this.butterflyOrder[i])) {
                return true;
            }
        }
        return false;
    }
    
    handleMousePressed(mouseX, mouseY) {
        if (!this.visible || this.fadeAlpha < 200) return false;
        
        // Adjust for canvas scaling
        const adjustedX = mouseX * (gameConfig.canvas.baseWidth / gameConfig.canvas.targetWidth);
        const adjustedY = mouseY * (gameConfig.canvas.baseHeight / gameConfig.canvas.targetHeight);
        
        // Check left arrow
        if (this.canNavigateLeft() && 
            adjustedX >= this.leftArrow.x && 
            adjustedX <= this.leftArrow.x + this.leftArrow.width &&
            adjustedY >= this.leftArrow.y - this.leftArrow.height/2 && 
            adjustedY <= this.leftArrow.y + this.leftArrow.height/2) {
            this.navigateLeft();
            return true;
        }
        
        // Check right arrow
        if (this.canNavigateRight() && 
            adjustedX >= this.rightArrow.x && 
            adjustedX <= this.rightArrow.x + this.rightArrow.width &&
            adjustedY >= this.rightArrow.y - this.rightArrow.height/2 && 
            adjustedY <= this.rightArrow.y + this.rightArrow.height/2) {
            this.navigateRight();
            return true;
        }
        
        return false;
    }
    
    draw(graphics) {
        if (this.fadeAlpha <= 0) return;
        
        const encountered = this.getEncounteredButterflies();
        if (encountered.length === 0) return;
        
        graphics.push();
        
        // Simple background panel
        graphics.fill(20, 20, 30, this.fadeAlpha * 0.9);
        graphics.stroke(255, 255, 255, this.fadeAlpha * 0.3);
        graphics.strokeWeight(2);
        graphics.rect(this.x, this.y, this.width, this.height, 10);
        
        // Title
        graphics.noStroke();
        graphics.fill(255, 255, 255, this.fadeAlpha);
        graphics.textAlign(CENTER, TOP);
        graphics.textSize(20 * this.scale);
        graphics.text('Butterfly Collection', this.x + this.width/2, this.y + 15 * this.scale);
        
        // Page content
        const currentType = this.butterflyOrder[this.currentIndex];
        this.drawButterflyInfo(graphics, currentType);
        
        // Draw navigation arrows
        this.drawNavigationArrows(graphics);
        
        // Collection progress at bottom
        const collected = gameCore.gameState.collectedButterflies.size;
        const total = this.butterflyOrder.length;
        graphics.textAlign(CENTER, BOTTOM);
        graphics.textSize(12 * this.scale);
        graphics.fill(255, 255, 200, this.fadeAlpha * 0.8);
        graphics.text(`${collected}/${total} Collected`, this.x + this.width/2, this.y + this.height - 12 * this.scale);
        
        // Page counter
        graphics.textAlign(CENTER, BOTTOM);
        graphics.textSize(10 * this.scale);
        graphics.fill(200, 200, 200, this.fadeAlpha * 0.6);
        graphics.text(`${this.currentIndex + 1} of ${encountered.length}`, this.x + this.width/2, this.y + this.height - 28 * this.scale);
        
        graphics.pop();
    }
    
    drawButterflyInfo(graphics, type) {
        const personality = BUTTERFLY_PERSONALITIES[type];
        const isCollected = gameCore.gameState.collectedButterflies.has(type);
        const isEncountered = gameCore.gameState.encounteredButterflies.has(type);
        const journalEntry = this.journalEntries[type];
        
        // Draw butterfly
        const butterflyY = this.y + 80 * this.scale;
        if (isEncountered || type === 'golden') {
            this.drawSimpleButterfly(graphics, this.x + this.width/2, butterflyY, personality, isCollected, type);
        } else {
            // Mystery silhouette
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(36 * this.scale);
            graphics.fill(100, 100, 100, this.fadeAlpha * 0.5);
            graphics.text('?', this.x + this.width/2, butterflyY);
        }
        
        // Butterfly name and type
        graphics.textAlign(CENTER, TOP);
        graphics.textSize(16 * this.scale);
        const displayName = type.charAt(0).toUpperCase() + type.slice(1);
        
        if (isCollected) {
            graphics.fill(100, 255, 100, this.fadeAlpha);
        } else if (isEncountered) {
            graphics.fill(255, 255, 255, this.fadeAlpha * 0.8);
        } else {
            graphics.fill(150, 150, 150, this.fadeAlpha * 0.5);
        }
        graphics.text(displayName, this.x + this.width/2, butterflyY + 45 * this.scale);
        
        // Rarity
        if (isEncountered || type === 'golden') {
            graphics.textSize(12 * this.scale);
            graphics.fill(200, 200, 200, this.fadeAlpha * 0.6);
            graphics.text(personality.rarity, this.x + this.width/2, butterflyY + 65 * this.scale);
        }
        
        // Status
        graphics.textSize(14 * this.scale);
        if (isCollected) {
            graphics.fill(100, 255, 100, this.fadeAlpha);
            graphics.text('✓ Befriended', this.x + this.width/2, butterflyY + 85 * this.scale);
        } else if (type === 'golden' && !isEncountered) {
            graphics.fill(255, 215, 0, this.fadeAlpha * 0.8);
            graphics.text('Befriend all others first', this.x + this.width/2, butterflyY + 85 * this.scale);
        } else if (isEncountered) {
            graphics.fill(255, 255, 100, this.fadeAlpha * 0.6);
            graphics.text('Lead to befriend', this.x + this.width/2, butterflyY + 85 * this.scale);
        }
        
        // Simple description
        if ((isEncountered || type === 'golden') && journalEntry) {
            graphics.textAlign(CENTER, TOP);
            graphics.textSize(12 * this.scale);
            graphics.fill(220, 220, 220, this.fadeAlpha * 0.8);
            
            // Title
            graphics.textStyle(ITALIC);
            graphics.text(`"${journalEntry.title}"`, this.x + this.width/2, butterflyY + 115 * this.scale);
            graphics.textStyle(NORMAL);
            
            // Brief description (first note only for simplicity)
            graphics.textSize(10 * this.scale);
            graphics.fill(180, 180, 180, this.fadeAlpha * 0.7);
            const note = journalEntry.notes[0];
            
            // Word wrap the note
            const words = note.split(' ');
            const maxWidth = this.width - 60 * this.scale;
            let line = '';
            let y = butterflyY + 140 * this.scale;
            
            for (let word of words) {
                const testLine = line + word + ' ';
                const testWidth = graphics.textWidth(testLine);
                if (testWidth > maxWidth && line !== '') {
                    graphics.text(line, this.x + this.width/2, y);
                    line = word + ' ';
                    y += 14 * this.scale;
                } else {
                    line = testLine;
                }
            }
            if (line !== '') {
                graphics.text(line, this.x + this.width/2, y);
            }
        }
    }
    
    drawSimpleButterfly(graphics, x, y, personality, isCollected, type) {
        graphics.push();
        graphics.translate(x, y);
        
        const alpha = this.fadeAlpha;
        const scale = 1.2 * this.scale;
        
        // Wing flutter animation
        const flutter = sin(frameCount * 0.1) * 0.03;
        
        graphics.noStroke();
        
        // Draw both wing colors if available
        const colors = personality.colors;
        const wingColor = colors[0];
        
        // Left wing
        graphics.push();
        graphics.scale(scale);
        graphics.rotate(-flutter);
        
        if (type === 'golden' && !gameCore.gameState.encounteredButterflies.has('golden')) {
            graphics.fill(100, 100, 100, alpha);
        } else {
            graphics.fill(wingColor[0], wingColor[1], wingColor[2], alpha);
        }
        
        graphics.beginShape();
        graphics.vertex(-15, -5);
        graphics.bezierVertex(-20, -15, -25, -10, -20, 0);
        graphics.bezierVertex(-25, 10, -20, 15, -15, 5);
        graphics.vertex(-5, 0);
        graphics.endShape(CLOSE);
        
        graphics.pop();
        
        // Right wing
        graphics.push();
        graphics.scale(scale);
        graphics.rotate(flutter);
        
        graphics.fill(wingColor[0], wingColor[1], wingColor[2], alpha);
        graphics.beginShape();
        graphics.vertex(15, -5);
        graphics.bezierVertex(20, -15, 25, -10, 20, 0);
        graphics.bezierVertex(25, 10, 20, 15, 15, 5);
        graphics.vertex(5, 0);
        graphics.endShape(CLOSE);
        
        graphics.pop();
        
        // Body
        graphics.fill(40, 30, 20, alpha);
        graphics.rect(-3 * scale, -8 * scale, 6 * scale, 16 * scale);
        
        graphics.pop();
    }
    
    drawNavigationArrows(graphics) {
        // Left arrow
        if (this.canNavigateLeft()) {
            const hover = this.isMouseOverLeftArrow();
            const arrowAlpha = hover ? this.fadeAlpha : this.fadeAlpha * 0.5;
            
            graphics.fill(255, 255, 255, arrowAlpha);
            graphics.noStroke();
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(24 * this.scale);
            graphics.text('<', this.leftArrow.x + this.leftArrow.width/2, this.leftArrow.y);
        }
        
        // Right arrow
        if (this.canNavigateRight()) {
            const hover = this.isMouseOverRightArrow();
            const arrowAlpha = hover ? this.fadeAlpha : this.fadeAlpha * 0.5;
            
            graphics.fill(255, 255, 255, arrowAlpha);
            graphics.noStroke();
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(24 * this.scale);
            graphics.text('>', this.rightArrow.x + this.rightArrow.width/2, this.rightArrow.y);
        }
    }
    
    isMouseOverLeftArrow() {
        const adjustedX = mouseX * (gameConfig.canvas.baseWidth / gameConfig.canvas.targetWidth);
        const adjustedY = mouseY * (gameConfig.canvas.baseHeight / gameConfig.canvas.targetHeight);
        
        return adjustedX >= this.leftArrow.x && 
               adjustedX <= this.leftArrow.x + this.leftArrow.width &&
               adjustedY >= this.leftArrow.y - this.leftArrow.height/2 && 
               adjustedY <= this.leftArrow.y + this.leftArrow.height/2;
    }
    
    isMouseOverRightArrow() {
        const adjustedX = mouseX * (gameConfig.canvas.baseWidth / gameConfig.canvas.targetWidth);
        const adjustedY = mouseY * (gameConfig.canvas.baseHeight / gameConfig.canvas.targetHeight);
        
        return adjustedX >= this.rightArrow.x && 
               adjustedX <= this.rightArrow.x + this.rightArrow.width &&
               adjustedY >= this.rightArrow.y - this.rightArrow.height/2 && 
               adjustedY <= this.rightArrow.y + this.rightArrow.height/2;
    }
}