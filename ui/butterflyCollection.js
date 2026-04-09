// Butterfly Collection UI - notebook pages for base butterflies and bred hybrids
class ButterflyCollectionUI {
    constructor() {
        const scale = Math.min(gameConfig.canvas.baseWidth / 800, gameConfig.canvas.baseHeight / 600);
        this.width = Math.min(390 * scale, gameConfig.canvas.baseWidth * 0.86);
        this.height = Math.min(470 * scale, gameConfig.canvas.baseHeight * 0.88);
        this.x = (gameConfig.canvas.baseWidth - this.width) / 2;
        this.y = (gameConfig.canvas.baseHeight - this.height) / 2;
        this.padding = 20 * scale;
        this.scale = scale;
        this.visible = false;
        this.fadeAlpha = 0;
        this.fadeSpeed = 10;
        this.currentIndex = 0;
        this.hybridOnly = false;

        this.butterflyOrder = [
            'friendly',
            'cautious',
            'energetic',
            'skittish',
            'wise',
            'mystic',
            'golden'
        ];

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

        this.filterButton = {
            x: this.x + this.width - 145,
            y: this.y + 18,
            width: 120,
            height: 26
        };
    }

    toggle() {
        this.visible = !this.visible;
        if (this.visible) {
            this.currentIndex = 0;
        }
    }

    update() {
        if (this.visible && this.fadeAlpha < 255) {
            this.fadeAlpha = Math.min(255, this.fadeAlpha + this.fadeSpeed);
        } else if (!this.visible && this.fadeAlpha > 0) {
            this.fadeAlpha = Math.max(0, this.fadeAlpha - this.fadeSpeed);
        }
    }

    getPages() {
        if (!gameCore || !gameCore.gameState) return [];

        const basePages = this.butterflyOrder.map(type => ({ kind: 'base', type }));
        const hybridPages = (gameCore.gameState.hybridJournal || []).map(entry => ({ kind: 'hybrid', entry }));
        return this.hybridOnly ? hybridPages : [...basePages, ...hybridPages];
    }

    getCurrentPage() {
        const pages = this.getPages();
        if (pages.length === 0) return null;
        this.currentIndex = constrain(this.currentIndex, 0, pages.length - 1);
        return pages[this.currentIndex];
    }

    navigateLeft() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        }
    }

    navigateRight() {
        const pages = this.getPages();
        if (this.currentIndex < pages.length - 1) {
            this.currentIndex++;
        }
    }

    canNavigateLeft() {
        return this.currentIndex > 0;
    }

    canNavigateRight() {
        return this.currentIndex < this.getPages().length - 1;
    }

    promptRenameCurrentHybrid() {
        const page = this.getCurrentPage();
        if (!page || page.kind !== 'hybrid') return false;

        const nextName = prompt('Rename this hybrid butterfly:', page.entry.name);
        if (nextName == null) return true;

        const trimmed = nextName.trim();
        if (!trimmed) return true;

        if (progressionManager.renameHybrid(gameCore.gameState, page.entry.id, trimmed)) {
            page.entry.name = trimmed;
            const liveButterfly = (gameCore.gameState.butterflies || []).find(item => item.hybridEntryId === page.entry.id);
            if (liveButterfly) {
                liveButterfly.displayName = trimmed;
            }
        }

        return true;
    }

    handleMousePressed(mouseX, mouseY) {
        if (!this.visible || this.fadeAlpha < 200) return false;

        const adjustedX = mouseX * (gameConfig.canvas.baseWidth / gameConfig.canvas.targetWidth);
        const adjustedY = mouseY * (gameConfig.canvas.baseHeight / gameConfig.canvas.targetHeight);

        if (this.isInsideRect(adjustedX, adjustedY, this.filterButton)) {
            this.hybridOnly = !this.hybridOnly;
            this.currentIndex = 0;
            return true;
        }

        if (this.canNavigateLeft() &&
            adjustedX >= this.leftArrow.x &&
            adjustedX <= this.leftArrow.x + this.leftArrow.width &&
            adjustedY >= this.leftArrow.y - this.leftArrow.height / 2 &&
            adjustedY <= this.leftArrow.y + this.leftArrow.height / 2) {
            this.navigateLeft();
            return true;
        }

        if (this.canNavigateRight() &&
            adjustedX >= this.rightArrow.x &&
            adjustedX <= this.rightArrow.x + this.rightArrow.width &&
            adjustedY >= this.rightArrow.y - this.rightArrow.height / 2 &&
            adjustedY <= this.rightArrow.y + this.rightArrow.height / 2) {
            this.navigateRight();
            return true;
        }

        return false;
    }

    draw(graphics) {
        if (this.fadeAlpha <= 0) return;

        const pages = this.getPages();
        if (pages.length === 0) return;

        graphics.push();
        graphics.smooth();
        graphics.fill(20, 20, 30, this.fadeAlpha * 0.94);
        graphics.stroke(255, 255, 255, this.fadeAlpha * 0.3);
        graphics.strokeWeight(2);
        graphics.rect(this.x, this.y, this.width, this.height, 10);

        graphics.noStroke();
        graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha * 1.2));
        graphics.textAlign(CENTER, TOP);
        graphics.textSize(24 * this.scale);
        graphics.text('Butterfly Collection', this.x + this.width / 2, this.y + 15 * this.scale);

        this.drawFilterButton(graphics);

        const page = this.getCurrentPage();
        if (page?.kind === 'base') {
            this.drawBasePage(graphics, page.type);
        } else if (page?.kind === 'hybrid') {
            this.drawHybridPage(graphics, page.entry);
        }

        this.drawNavigationArrows(graphics);

        const collected = gameCore.gameState.collectedButterflies.size;
        const hybridCount = (gameCore.gameState.hybridJournal || []).length;
        graphics.textAlign(CENTER, BOTTOM);
        graphics.textSize(15 * this.scale);
        graphics.fill(255, 255, 200, Math.min(255, this.fadeAlpha));
        graphics.text(`${collected}/7 Base Collected • ${hybridCount} Hybrids`, this.x + this.width / 2, this.y + this.height - 12 * this.scale);

        graphics.textSize(12 * this.scale);
        graphics.fill(200, 200, 200, Math.min(255, this.fadeAlpha * 0.85));
        graphics.text(`${this.currentIndex + 1} of ${pages.length}`, this.x + this.width / 2, this.y + this.height - 30 * this.scale);

        graphics.pop();
    }

    drawFilterButton(graphics) {
        graphics.push();
        graphics.fill(this.hybridOnly ? 75 : 40, this.hybridOnly ? 115 : 40, this.hybridOnly ? 85 : 55, Math.min(255, this.fadeAlpha));
        graphics.stroke(255, 255, 255, this.fadeAlpha * 0.25);
        graphics.rect(this.filterButton.x, this.filterButton.y, this.filterButton.width, this.filterButton.height, 6);
        graphics.noStroke();
        graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha));
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(11 * this.scale);
        graphics.text(this.hybridOnly ? 'Show All Pages' : 'Hybrids Only', this.filterButton.x + this.filterButton.width / 2, this.filterButton.y + this.filterButton.height / 2 + 1);
        graphics.pop();
    }

    drawBasePage(graphics, type) {
        const personality = BUTTERFLY_PERSONALITIES[type];
        const debugEnabled = typeof debugUI !== 'undefined' && debugUI.enabled;
        const isCollected = gameCore.gameState.collectedButterflies.has(type);
        const isEncountered = gameCore.gameState.encounteredButterflies.has(type);
        const journalEntry = this.journalEntries[type];
        const butterflyY = this.y + 92 * this.scale;

        this.drawPreviewGlow(graphics, butterflyY);

        if (debugEnabled || isEncountered || isCollected || type === 'golden') {
            this.drawSpritePreview(graphics, this.x + this.width / 2, butterflyY, {
                personalityType: type,
                sex: 'F'
            }, 0.06 * this.scale, this.fadeAlpha);
        } else {
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(48 * this.scale);
            graphics.fill(100, 100, 100, this.fadeAlpha * 0.5);
            graphics.text('?', this.x + this.width / 2, butterflyY);
        }

        graphics.textAlign(CENTER, TOP);
        graphics.textSize(20 * this.scale);
        const nameColor = isCollected ? [100, 255, 100] : isEncountered ? [255, 255, 255] : [150, 150, 150];
        graphics.fill(nameColor[0], nameColor[1], nameColor[2], Math.min(255, this.fadeAlpha * 1.1));
        graphics.text(type.charAt(0).toUpperCase() + type.slice(1), this.x + this.width / 2, butterflyY + 54 * this.scale);

        const rarityColors = {
            common: [200, 200, 200],
            uncommon: [100, 255, 100],
            rare: [100, 150, 255],
            epic: [200, 100, 255],
            legendary: [255, 215, 0]
        };
        const rarityColor = rarityColors[personality.rarity] || [200, 200, 200];
        graphics.textSize(16 * this.scale);
        graphics.fill(rarityColor[0], rarityColor[1], rarityColor[2], Math.min(255, this.fadeAlpha));
        graphics.text(personality.rarity.toUpperCase(), this.x + this.width / 2, butterflyY + 80 * this.scale);

        graphics.textSize(18 * this.scale);
        if (isCollected) {
            graphics.fill(100, 255, 100, Math.min(255, this.fadeAlpha));
            graphics.text('Befriended', this.x + this.width / 2, butterflyY + 104 * this.scale);
        } else if (type === 'golden' && !isEncountered) {
            graphics.fill(255, 215, 0, Math.min(255, this.fadeAlpha));
            graphics.text('Befriend all others first', this.x + this.width / 2, butterflyY + 104 * this.scale);
        } else if (isEncountered) {
            graphics.fill(255, 255, 100, Math.min(255, this.fadeAlpha));
            graphics.text('Lead to befriend', this.x + this.width / 2, butterflyY + 104 * this.scale);
        } else {
            graphics.fill(120, 120, 120, Math.min(255, this.fadeAlpha));
            graphics.text('Not encountered', this.x + this.width / 2, butterflyY + 104 * this.scale);
        }

        if ((debugEnabled || isEncountered || isCollected || type === 'golden') && journalEntry) {
            graphics.textAlign(CENTER, TOP);
            graphics.textSize(18 * this.scale);
            graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha));
            graphics.textStyle(BOLD);
            graphics.text(journalEntry.title, this.x + this.width / 2, butterflyY + 140 * this.scale);
            graphics.textStyle(NORMAL);
            this.drawWrappedText(graphics, `"${journalEntry.quote}"`, this.x + this.width / 2, butterflyY + 170 * this.scale, this.width - 70 * this.scale, 15 * this.scale, [255, 255, 200], true);
            this.drawWrappedText(graphics, journalEntry.description, this.x + this.width / 2, butterflyY + 245 * this.scale, this.width - 70 * this.scale, 12 * this.scale, [180, 180, 180], false);
        }
    }

    drawHybridPage(graphics, entry) {
        const butterflyY = this.y + 86 * this.scale;

        this.drawPreviewGlow(graphics, butterflyY);
        this.drawSpritePreview(graphics, this.x + this.width / 2, butterflyY, entry.renderSpec, 0.07 * this.scale, this.fadeAlpha);

        graphics.textAlign(CENTER, TOP);
        graphics.textSize(20 * this.scale);
        graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha));
        graphics.text(entry.name, this.x + this.width / 2, butterflyY + 58 * this.scale);

        graphics.textSize(16 * this.scale);
        graphics.fill(120, 255, 180, Math.min(255, this.fadeAlpha));
        graphics.text('HYBRID', this.x + this.width / 2, butterflyY + 84 * this.scale);

        graphics.textSize(13 * this.scale);
        graphics.fill(220, 220, 220, Math.min(255, this.fadeAlpha));
        graphics.text(`Sex: ${entry.sex}`, this.x + this.width / 2, butterflyY + 107 * this.scale);

        this.drawParentStrip(graphics, entry, butterflyY + 150 * this.scale);

        const bornAt = new Date(entry.bornAt);
        graphics.textSize(12 * this.scale);
        graphics.fill(255, 240, 180, Math.min(255, this.fadeAlpha));
        graphics.text('Press R to rename', this.x + this.width / 2, this.y + this.height - 72 * this.scale);

        graphics.fill(180, 180, 180, Math.min(255, this.fadeAlpha));
        graphics.text(`Born: ${bornAt.toLocaleString()}`, this.x + this.width / 2, this.y + this.height - 45 * this.scale);
    }

    drawParentStrip(graphics, entry, y) {
        const leftX = this.x + this.width / 2 - 70 * this.scale;
        const rightX = this.x + this.width / 2 + 70 * this.scale;

        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(22 * this.scale);
        graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha));
        graphics.text('+', this.x + this.width / 2, y + 8 * this.scale);

        this.drawSpritePreview(graphics, leftX, y, entry.parentA, 0.04 * this.scale, this.fadeAlpha);
        this.drawSpritePreview(graphics, rightX, y, entry.parentB, 0.04 * this.scale, this.fadeAlpha);

        graphics.textSize(11 * this.scale);
        graphics.fill(200, 200, 200, Math.min(255, this.fadeAlpha));
        graphics.text(entry.parentA?.personalityType?.toUpperCase() || '?', leftX, y + 36 * this.scale);
        graphics.text(entry.parentB?.personalityType?.toUpperCase() || '?', rightX, y + 36 * this.scale);
    }

    drawPreviewGlow(graphics, butterflyY) {
        graphics.push();
        graphics.noStroke();
        const glowSize = 85 * this.scale;
        for (let i = 3; i > 0; i--) {
            const alpha = (this.fadeAlpha * 0.12) / i;
            graphics.fill(255, 255, 255, alpha);
            graphics.ellipse(this.x + this.width / 2, butterflyY, glowSize * i, glowSize * i * 0.8);
        }
        graphics.pop();
    }

    drawWrappedText(graphics, textValue, centerX, startY, maxWidth, fontSize, color, italic) {
        const words = textValue.split(' ');
        let line = '';
        let y = startY;
        graphics.textSize(fontSize);
        graphics.fill(color[0], color[1], color[2], Math.min(255, this.fadeAlpha));
        graphics.textStyle(italic ? ITALIC : NORMAL);

        for (const word of words) {
            const testLine = line + word + ' ';
            if (graphics.textWidth(testLine) > maxWidth && line !== '') {
                graphics.text(line, centerX, y);
                line = word + ' ';
                y += fontSize + 5 * this.scale;
            } else {
                line = testLine;
            }
        }
        if (line !== '') {
            graphics.text(line, centerX, y);
        }
        graphics.textStyle(NORMAL);
    }

    drawSpritePreview(graphics, x, y, spec, previewScale, alpha) {
        if (!spec) return;

        graphics.push();
        graphics.translate(x, y);

        const wingSpread = map(sin(frameCount * 0.08), -1, 1, 0.6, 1);
        const hindSpread = map(sin(frameCount * 0.08 - 0.6), -1, 1, 0.55, 0.95);
        const flutter = sin(frameCount * 0.1) * 0.15;

        if (spriteManager.loaded && spriteManager.hasRenderableSpec(spec)) {
            const bodyScale = spec.sex === 'M' ? 0.8 : 1.0;
            const wingScale = spec.sex === 'F' ? 1.2 : 1.0;
            const bodyCenter = spriteManager.anchors.body;

            graphics.smooth();
            graphics.tint(255, alpha);

            if (spriteManager.body) {
                const s = previewScale * bodyScale;
                const bodyW = spriteManager.body.width * s;
                const bodyH = spriteManager.body.height * s;
                graphics.image(spriteManager.body, -bodyW / 2, -bodyH / 2, bodyW, bodyH);
            }

            if (spriteManager.antenna) {
                const antennaScale = previewScale * bodyScale;
                const antennaW = spriteManager.antenna.width * antennaScale;
                const antennaH = spriteManager.antenna.height * antennaScale;
                const anchors = spriteManager.anchors.antenna;
                for (const side of ['left', 'right']) {
                    const anchor = anchors[side];
                    const bodyConnX = (anchor.onBody.x - bodyCenter.centerX) * antennaScale;
                    const bodyConnY = (anchor.onBody.y - bodyCenter.centerY) * antennaScale;
                    const drawX = bodyConnX - (anchor.onAntenna.x * antennaScale);
                    const drawY = bodyConnY - (anchor.onAntenna.y * antennaScale);
                    graphics.image(spriteManager.antenna, drawX, drawY, antennaW, antennaH);
                }
            }

            graphics.push();
            graphics.rotate(flutter * 0.3);

            for (const wingKey of ['hindLeft', 'hindRight', 'foreLeft', 'foreRight']) {
                const piece = spriteManager.getWingPieceForSpec(spec, wingKey);
                if (!piece) continue;

                const anchor = spriteManager.anchors.wings[wingKey];
                const relAnchor = spriteManager.anchors.wingsRelative[wingKey];
                const bodyConnX = (anchor.onBody.x - bodyCenter.centerX) * (previewScale * bodyScale);
                let bodyConnY = (anchor.onBody.y - bodyCenter.centerY) * (previewScale * bodyScale);
                if (wingKey.startsWith('hind')) {
                    bodyConnY -= 5 * previewScale * bodyScale;
                }

                const ws = previewScale * wingScale * 1.45;
                const pieceW = piece.width * ws;
                const pieceH = piece.height * ws;
                const drawX = bodyConnX - (relAnchor.x * ws);
                const drawY = bodyConnY - (relAnchor.y * ws);
                const spread = wingKey.startsWith('hind') ? hindSpread : wingSpread;

                graphics.push();
                graphics.translate(bodyConnX, bodyConnY);
                graphics.scale(spread, 1);
                graphics.translate(-bodyConnX, -bodyConnY);
                graphics.image(piece, drawX, drawY, pieceW, pieceH);
                graphics.pop();
            }

            graphics.pop();
            graphics.noTint();
            graphics.noSmooth();
        } else {
            graphics.noStroke();
            graphics.fill(255, 255, 255, alpha);
            graphics.ellipse(0, 0, 24 * this.scale, 14 * this.scale);
        }

        graphics.pop();
    }

    drawNavigationArrows(graphics) {
        if (this.canNavigateLeft()) {
            graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha * 0.85));
            graphics.noStroke();
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(24 * this.scale);
            graphics.text('<', this.leftArrow.x + this.leftArrow.width / 2, this.leftArrow.y);
        }

        if (this.canNavigateRight()) {
            graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha * 0.85));
            graphics.noStroke();
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(24 * this.scale);
            graphics.text('>', this.rightArrow.x + this.rightArrow.width / 2, this.rightArrow.y);
        }
    }

    isInsideRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
    }

    isClickInside(mouseX, mouseY) {
        if (!this.visible || this.fadeAlpha < 200) return false;

        const adjustedX = mouseX * (gameConfig.canvas.baseWidth / gameConfig.canvas.targetWidth);
        const adjustedY = mouseY * (gameConfig.canvas.baseHeight / gameConfig.canvas.targetHeight);

        return adjustedX >= this.x &&
               adjustedX <= this.x + this.width &&
               adjustedY >= this.y &&
               adjustedY <= this.y + this.height;
    }
}
