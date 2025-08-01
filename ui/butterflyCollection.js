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
                quote: "Will land on your finger if you hold very, very still.",
                description: "Orange wings like autumn leaves, trusts quickly and loves to share discoveries."
            },
            cautious: {
                title: "The Delicate Pink",
                quote: "Takes the scenic route everywhere, even to breakfast.",
                description: "Soft pink wings spotted with deeper hues, rewards patience with sparkling trails."
            },
            energetic: {
                title: "The Electric Violet",
                quote: "Probably had too much nectar this morning.",
                description: "Purple lightning wings, creates speed zones and shares energy generously."
            },
            skittish: {
                title: "The Nervous Jewel",
                quote: "Jumps at its own shadow, but somehow makes it look graceful.",
                description: "Jade and turquoise wings, extremely jumpy but creates trust cascades when befriended."
            },
            wise: {
                title: "The Ancient Scholar",
                quote: "Knows all the best flowers, keeps a mental map.",
                description: "Deep blue wings, teaches others and doubles the joy at blessed flowers."
            },
            mystic: {
                title: "The Twilight Dancer",
                quote: "Sometimes appears to be in two places at once.",
                description: "Phases between purple and shadow, appears when magic is strongest."
            },
            golden: {
                title: "The Legendary One",
                quote: "The friend you made along the way.",
                description: "Pure golden wings of liquid sunlight, the crown jewel of the garden."
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
            // Always start at the first butterfly (friendly)
            this.currentIndex = 0;
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
        // Navigate through all butterflies, not just encountered ones
        if (this.currentIndex > 0) {
            this.currentIndex--;
        }
    }
    
    navigateRight() {
        // Navigate through all butterflies, not just encountered ones
        if (this.currentIndex < this.butterflyOrder.length - 1) {
            this.currentIndex++;
        }
    }
    
    canNavigateLeft() {
        return this.currentIndex > 0;
    }
    
    canNavigateRight() {
        return this.currentIndex < this.butterflyOrder.length - 1;
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
        
        // Enable smooth text rendering for better quality
        graphics.smooth();
        
        // Simple background panel
        graphics.fill(20, 20, 30, this.fadeAlpha * 0.9);
        graphics.stroke(255, 255, 255, this.fadeAlpha * 0.3);
        graphics.strokeWeight(2);
        graphics.rect(this.x, this.y, this.width, this.height, 10);
        
        // Title - crisp and clear
        graphics.noStroke();
        graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha * 1.2));
        graphics.textAlign(CENTER, TOP);
        graphics.textSize(24 * this.scale);
        graphics.text('Butterfly Collection', this.x + this.width/2, this.y + 15 * this.scale);
        
        // Page content
        const currentType = this.butterflyOrder[this.currentIndex];
        this.drawButterflyInfo(graphics, currentType);
        
        // Draw navigation arrows
        this.drawNavigationArrows(graphics);
        
        // Collection progress at bottom - crisp and clear
        const collected = gameCore.gameState.collectedButterflies.size;
        const total = this.butterflyOrder.length;
        graphics.textAlign(CENTER, BOTTOM);
        graphics.textSize(16 * this.scale);
        graphics.fill(255, 255, 200, Math.min(255, this.fadeAlpha * 1.0));
        graphics.text(`${collected}/${total} Collected`, this.x + this.width/2, this.y + this.height - 12 * this.scale);
        
        // Page counter - improved readability
        graphics.textAlign(CENTER, BOTTOM);
        graphics.textSize(12 * this.scale);
        graphics.fill(200, 200, 200, Math.min(255, this.fadeAlpha * 0.8));
        graphics.text(`${this.currentIndex + 1} of ${this.butterflyOrder.length}`, this.x + this.width/2, this.y + this.height - 30 * this.scale);
        
        graphics.pop();
    }
    
    drawButterflyInfo(graphics, type) {
        const personality = BUTTERFLY_PERSONALITIES[type];
        const isCollected = gameCore.gameState.collectedButterflies.has(type);
        const isEncountered = gameCore.gameState.encounteredButterflies.has(type);
        const journalEntry = this.journalEntries[type];
        
        // Draw butterfly with background lighting
        const butterflyY = this.y + 80 * this.scale;
        
        // Add subtle background glow for visibility
        graphics.push();
        graphics.noStroke();
        const glowSize = 80 * this.scale;
        for (let i = 3; i > 0; i--) {
            const alpha = (this.fadeAlpha * 0.15) / i;
            graphics.fill(255, 255, 255, alpha);
            graphics.ellipse(this.x + this.width/2, butterflyY, glowSize * i, glowSize * i * 0.8);
        }
        graphics.pop();
        
        // Show butterfly if encountered OR collected (collected should always mean encountered, but let's be safe)
        if (isEncountered || isCollected || type === 'golden') {
            this.drawSimpleButterfly(graphics, this.x + this.width/2, butterflyY, personality, isCollected, type);
        } else {
            // Mystery silhouette
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(48 * this.scale);
            graphics.fill(100, 100, 100, this.fadeAlpha * 0.5);
            graphics.text('?', this.x + this.width/2, butterflyY);
        }
        
        // Butterfly name and type - BIGGER and crisper
        graphics.textAlign(CENTER, TOP);
        graphics.textSize(20 * this.scale);
        const displayName = type.charAt(0).toUpperCase() + type.slice(1);
        
        if (isCollected) {
            graphics.fill(100, 255, 100, Math.min(255, this.fadeAlpha * 1.1));
        } else if (isEncountered) {
            graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha * 1.1));
        } else {
            graphics.fill(150, 150, 150, Math.min(255, this.fadeAlpha * 0.8));
        }
        graphics.text(displayName, this.x + this.width/2, butterflyY + 50 * this.scale);
        
        // Rarity - BIGGER with color coding
        graphics.textSize(16 * this.scale);
        const rarityColors = {
            common: [200, 200, 200],      // White/Gray
            uncommon: [100, 255, 100],    // Green
            rare: [100, 150, 255],        // Blue
            epic: [200, 100, 255]         // Purple
        };
        const rarityColor = rarityColors[personality.rarity] || [200, 200, 200];
        graphics.fill(rarityColor[0], rarityColor[1], rarityColor[2], Math.min(255, this.fadeAlpha * 1.0));
        graphics.text(personality.rarity.toUpperCase(), this.x + this.width/2, butterflyY + 75 * this.scale);
        
        // Status - BIGGER and clearer
        graphics.textSize(18 * this.scale);
        if (isCollected) {
            graphics.fill(100, 255, 100, Math.min(255, this.fadeAlpha * 1.1));
            graphics.text('✓ Befriended', this.x + this.width/2, butterflyY + 100 * this.scale);
        } else if (type === 'golden' && !isEncountered) {
            graphics.fill(255, 215, 0, Math.min(255, this.fadeAlpha * 1.0));
            graphics.text('Befriend all others first', this.x + this.width/2, butterflyY + 100 * this.scale);
        } else if (isEncountered) {
            graphics.fill(255, 255, 100, Math.min(255, this.fadeAlpha * 0.9));
            graphics.text('Lead to befriend', this.x + this.width/2, butterflyY + 100 * this.scale);
        } else {
            graphics.fill(100, 100, 100, Math.min(255, this.fadeAlpha * 0.7));
            graphics.text('Not encountered', this.x + this.width/2, butterflyY + 100 * this.scale);
        }
        
        // Display journal entry with quote - show if encountered OR collected
        if ((isEncountered || isCollected || type === 'golden') && journalEntry) {
            graphics.textAlign(CENTER, TOP);
            
            // Title - bold and prominent (no quotes, no italic)
            graphics.textSize(18 * this.scale);
            graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha * 1.1));
            graphics.textStyle(BOLD);
            graphics.text(journalEntry.title, this.x + this.width/2, butterflyY + 135 * this.scale);
            graphics.textStyle(NORMAL);
            
            // Quote - italicized and in quotes
            graphics.textSize(15 * this.scale);
            graphics.fill(255, 255, 200, Math.min(255, this.fadeAlpha * 1.0));
            
            // Word wrap the quote
            const quoteText = `"${journalEntry.quote}"`;
            const quoteWords = quoteText.split(' ');
            const maxWidth = this.width - 70 * this.scale;
            let line = '';
            let y = butterflyY + 165 * this.scale;
            
            graphics.textStyle(ITALIC);
            for (let word of quoteWords) {
                const testLine = line + word + ' ';
                const testWidth = graphics.textWidth(testLine);
                if (testWidth > maxWidth && line !== '') {
                    graphics.text(line, this.x + this.width/2, y);
                    line = word + ' ';
                    y += 20 * this.scale;
                } else {
                    line = testLine;
                }
            }
            if (line !== '') {
                graphics.text(line, this.x + this.width/2, y);
            }
            graphics.textStyle(NORMAL);
            
            // Description - compact at the bottom
            y += 35 * this.scale;
            graphics.textSize(12 * this.scale);
            graphics.fill(180, 180, 180, Math.min(255, this.fadeAlpha * 0.8));
            
            // Word wrap the description
            const descWords = journalEntry.description.split(' ');
            line = '';
            for (let word of descWords) {
                const testLine = line + word + ' ';
                const testWidth = graphics.textWidth(testLine);
                if (testWidth > maxWidth && line !== '') {
                    graphics.text(line, this.x + this.width/2, y);
                    line = word + ' ';
                    y += 16 * this.scale;
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
        // Left arrow - improved visibility
        if (this.canNavigateLeft()) {
            const hover = this.isMouseOverLeftArrow();
            const arrowAlpha = hover ? Math.min(255, this.fadeAlpha * 1.2) : Math.min(255, this.fadeAlpha * 0.7);
            
            graphics.fill(255, 255, 255, arrowAlpha);
            graphics.noStroke();
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(24 * this.scale);
            graphics.text('<', this.leftArrow.x + this.leftArrow.width/2, this.leftArrow.y);
        }
        
        // Right arrow - improved visibility
        if (this.canNavigateRight()) {
            const hover = this.isMouseOverRightArrow();
            const arrowAlpha = hover ? Math.min(255, this.fadeAlpha * 1.2) : Math.min(255, this.fadeAlpha * 0.7);
            
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
    
    isClickInside(mouseX, mouseY) {
        if (!this.visible || this.fadeAlpha < 200) return false;
        
        // Adjust for canvas scaling
        const adjustedX = mouseX * (gameConfig.canvas.baseWidth / gameConfig.canvas.targetWidth);
        const adjustedY = mouseY * (gameConfig.canvas.baseHeight / gameConfig.canvas.targetHeight);
        
        // Check if click is within the collection panel bounds
        return adjustedX >= this.x && 
               adjustedX <= this.x + this.width &&
               adjustedY >= this.y && 
               adjustedY <= this.y + this.height;
    }
}