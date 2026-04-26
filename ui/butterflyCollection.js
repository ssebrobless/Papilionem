// Butterfly Collection UI - notebook pages for base butterflies and bred hybrids
class ButterflyCollectionUI {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.x = 0;
        this.y = 0;
        this.padding = 0;
        this.scale = 1;
        this.visible = false;
        this.fadeAlpha = 0;
        this.fadeSpeed = 10;
        this.currentIndex = 0;
        this.currentRosterIndex = 0;
        this.hybridOnly = false;
        this.mode = 'collection';
        this.pageScrollOffsets = new Map();
        this.scrollViewport = null;
        this.maxScrollOffset = 0;
        this.renameButton = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
        this.tabButtons = [];
        this.rosterActionButtons = {};
        this.textLayoutCache = new Map();
        this.measurementCache = new Map();

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
                description: "Orange wings like autumn leaves, trusts quickly and steadies nearby butterflies with a warm support aura."
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
                description: "Deep blue wings, sends teaching pulses that help nearby butterflies learn and recover."
            },
            mystic: {
                title: "The Twilight Dancer",
                quote: "Sometimes appears to be in two places at once.",
                description: "Phases between orchid and cyan, surrounding nearby butterflies with sleep comfort and recovery support."
            },
            golden: {
                title: "The Legendary One",
                quote: "The friend you made along the way.",
                description: "Pure golden wings of liquid sunlight, blessing visited flowers with a brief golden crown state."
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
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
        this.refreshLayout();
    }

    readLayoutCache(cache, key, buildValue, maxEntries = 500) {
        if (!gameConfig?.performance?.flags?.textMeasureCache) {
            return buildValue();
        }
        if (cache.has(key)) {
            const cached = cache.get(key);
            cache.delete(key);
            cache.set(key, cached);
            return cached;
        }

        const value = buildValue();
        cache.set(key, value);
        while (cache.size > maxEntries) {
            const oldestKey = cache.keys().next().value;
            cache.delete(oldestKey);
        }
        return value;
    }

    measureTextWidth(graphics, value) {
        if (typeof textMeasureCache !== 'undefined' && textMeasureCache?.measure) {
            return textMeasureCache.measure(graphics, value);
        }
        return graphics?.textWidth ? graphics.textWidth(String(value ?? '')) : 0;
    }

    getGraphicsTextStateKey(graphics) {
        const renderer = graphics?._renderer || null;
        const textSize = Number(renderer?._textSize || graphics?._textSize || 12);
        const textStyle = renderer?._textStyle || graphics?._textStyle || 'normal';
        return `${Math.round(textSize * 100) / 100}|${textStyle}`;
    }

    refreshLayout() {
        const uiScale = typeof gameUI !== 'undefined' && gameUI.getEffectiveUiScale
            ? gameUI.getEffectiveUiScale()
            : 1;
        const scale = Math.max(0.9, Math.min(gameConfig.canvas.baseWidth / 800, gameConfig.canvas.baseHeight / 600) * (0.88 * uiScale));
        this.scale = scale;
        const leftColumnX = typeof gameUI !== 'undefined' && gameUI.activityLogPanel
            ? gameUI.activityLogPanel.x
            : 8;
        const panelAnchorY = typeof gameUI !== 'undefined' && gameUI.activityLogPanel
            ? gameUI.activityLogPanel.y
            : 34 * uiScale;
        const topSafeY = Math.max(26 * uiScale, panelAnchorY - 8 * uiScale);
        const isRosterMode = this.mode === 'roster';
        const availableHeight = Math.max(236 * uiScale, gameConfig.canvas.baseHeight - topSafeY - (24 * uiScale));
        this.width = Math.min((isRosterMode ? 356 : 338) * scale, gameConfig.canvas.baseWidth * (isRosterMode ? 0.55 : 0.52));
        this.height = Math.min((isRosterMode ? 390 : 370) * scale, availableHeight);
        this.x = leftColumnX;
        this.y = topSafeY;
        this.padding = 14 * scale;
        this.leftArrow = {
            x: this.x + 10 * scale,
            y: this.y + 78 * scale,
            width: 22 * scale,
            height: 28 * scale
        };
        this.rightArrow = {
            x: this.x + this.width - 32 * scale,
            y: this.y + 78 * scale,
            width: 22 * scale,
            height: 28 * scale
        };
        this.filterButton = {
            x: this.x + this.width - 82 * scale,
            y: this.y + 10 * scale,
            width: 66 * scale,
            height: 14 * scale
        };
        this.renameButton = {
            x: this.x + this.width - 72 * scale,
            y: this.y + 56 * scale,
            width: 54 * scale,
            height: 14 * scale
        };
        const tabY = this.y + 10 * scale;
        this.tabButtons = [
            {
                id: 'collection',
                x: this.x + 14 * scale,
                y: tabY,
                width: 56 * scale,
                height: 14 * scale,
                label: 'Collection'
            },
            {
                id: 'roster',
                x: this.x + 74 * scale,
                y: tabY,
                width: 44 * scale,
                height: 14 * scale,
                label: 'Roster'
            }
        ];
        this.rosterActionButtons = {
            toggleMember: {
                x: this.x + 18 * scale,
                y: this.y + this.height - 46 * scale,
                width: 88 * scale,
                height: 16 * scale
            },
            openBattle: {
                x: this.x + this.width - 106 * scale,
                y: this.y + this.height - 46 * scale,
                width: 88 * scale,
                height: 16 * scale
            }
        };
    }

    toggle() {
        this.visible = !this.visible;
        if (this.visible) {
            this.currentIndex = 0;
            this.currentRosterIndex = 0;
            this.resetAllScrollOffsets();
        }
    }

    update() {
        this.refreshLayout();
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

    getRosterEntries() {
        if (!gameCore?.gameState) return [];
        const butterflies = [...(gameCore.gameState.butterflies || [])];
        const summaries = typeof rosterSystem !== 'undefined'
            ? new Map(butterflies.map(entity => [entity.id, rosterSystem.getEntitySummary?.(entity.id, gameCore.gameState)]))
            : new Map();
        const profiles = typeof statProfileSystem !== 'undefined'
            ? new Map(butterflies.map(entity => [entity.id, statProfileSystem.getEntityProfile?.(entity, gameCore.gameState)]))
            : new Map();

        butterflies.sort((left, right) => {
            const leftSummary = summaries.get(left.id);
            const rightSummary = summaries.get(right.id);
            if (!!leftSummary?.member !== !!rightSummary?.member) {
                return leftSummary?.member ? -1 : 1;
            }
            const leftReady = profiles.get(left.id)?.readinessProfile?.score || 0;
            const rightReady = profiles.get(right.id)?.readinessProfile?.score || 0;
            if (leftReady !== rightReady) return rightReady - leftReady;
            return String(left.displayName || left.personalityType || left.id).localeCompare(String(right.displayName || right.personalityType || right.id));
        });

        return butterflies;
    }

    getCurrentRosterEntry() {
        const entries = this.getRosterEntries();
        if (!entries.length) return null;
        this.currentRosterIndex = constrain(this.currentRosterIndex, 0, entries.length - 1);
        return entries[this.currentRosterIndex];
    }

    getCurrentScrollKey() {
        if (this.mode === 'roster') {
            const entry = this.getCurrentRosterEntry();
            return `roster:${entry?.id ?? this.currentRosterIndex}`;
        }
        const page = this.getCurrentPage();
        if (!page) return `collection:${this.currentIndex}`;
        if (page.kind === 'hybrid') {
            return `collection:hybrid:${page.entry?.id ?? this.currentIndex}`;
        }
        return `collection:base:${page.type ?? this.currentIndex}`;
    }

    resetAllScrollOffsets() {
        this.pageScrollOffsets = new Map();
        this.scrollViewport = null;
        this.maxScrollOffset = 0;
    }

    resetCurrentScrollOffset() {
        const key = this.getCurrentScrollKey();
        if (key) {
            this.pageScrollOffsets.set(key, 0);
        }
        this.maxScrollOffset = 0;
    }

    getCurrentScrollOffset() {
        const key = this.getCurrentScrollKey();
        if (!key) return 0;
        return this.pageScrollOffsets.get(key) || 0;
    }

    setCurrentScrollOffset(value, maxScroll = this.maxScrollOffset) {
        const key = this.getCurrentScrollKey();
        if (!key) return 0;
        const bounded = Math.max(0, Math.min(Math.round(value), Math.max(0, Math.round(maxScroll || 0))));
        this.pageScrollOffsets.set(key, bounded);
        return bounded;
    }

    registerScrollViewport(viewport, maxScroll) {
        this.scrollViewport = viewport;
        this.maxScrollOffset = Math.max(0, Math.round(maxScroll || 0));
        this.setCurrentScrollOffset(this.getCurrentScrollOffset(), this.maxScrollOffset);
    }

    setMode(mode) {
        if (this.mode === mode) return;
        this.mode = mode;
        this.currentIndex = 0;
        this.currentRosterIndex = 0;
        this.resetAllScrollOffsets();
        this.refreshLayout();
    }

    navigateRoster(delta) {
        const entries = this.getRosterEntries();
        if (!entries.length) return;
        const nextIndex = constrain(this.currentRosterIndex + delta, 0, entries.length - 1);
        if (nextIndex !== this.currentRosterIndex) {
            this.currentRosterIndex = nextIndex;
            this.resetCurrentScrollOffset();
        }
    }

    navigateLeft() {
        if (this.mode === 'roster') {
            this.navigateRoster(-1);
            return;
        }
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.resetCurrentScrollOffset();
        }
    }

    navigateRight() {
        if (this.mode === 'roster') {
            this.navigateRoster(1);
            return;
        }
        const pages = this.getPages();
        if (this.currentIndex < pages.length - 1) {
            this.currentIndex++;
            this.resetCurrentScrollOffset();
        }
    }

    canNavigateLeft() {
        if (this.mode === 'roster') {
            return this.currentRosterIndex > 0;
        }
        return this.currentIndex > 0;
    }

    canNavigateRight() {
        if (this.mode === 'roster') {
            return this.currentRosterIndex < this.getRosterEntries().length - 1;
        }
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
        this.refreshLayout();
        if (!this.visible || this.fadeAlpha < 200) return false;

        const adjustedX = mouseX * (gameConfig.canvas.baseWidth / gameConfig.canvas.targetWidth);
        const adjustedY = mouseY * (gameConfig.canvas.baseHeight / gameConfig.canvas.targetHeight);

        for (const tab of this.tabButtons) {
            if (this.isInsideRect(adjustedX, adjustedY, tab)) {
                this.setMode(tab.id);
                return true;
            }
        }

        if (this.isInsideRect(adjustedX, adjustedY, this.filterButton)) {
            this.hybridOnly = !this.hybridOnly;
            this.currentIndex = 0;
            this.resetCurrentScrollOffset();
            return true;
        }

        if (this.mode === 'roster') {
            const entry = this.getCurrentRosterEntry();
            if (entry && this.isInsideRect(adjustedX, adjustedY, this.rosterActionButtons.toggleMember)) {
                rosterSystem?.toggleMember?.(entry.id, gameCore.gameState);
                return true;
            }
            if (this.isInsideRect(adjustedX, adjustedY, this.rosterActionButtons.openBattle)) {
                if (typeof gameUI !== 'undefined') {
                    gameUI.openBattleSetupFromJournal?.();
                }
                return true;
            }
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

        const page = this.getCurrentPage();
        if (this.mode === 'collection' && page?.kind === 'hybrid' && this.isPointInsideRenameButton(adjustedX, adjustedY)) {
            return this.promptRenameCurrentHybrid();
        }

        return false;
    }

    handleMouseWheel(mouseX, mouseY, delta) {
        this.refreshLayout();
        if (!this.visible) return false;
        if (!this.scrollViewport || !this.isInsideRect(mouseX, mouseY, this.scrollViewport)) {
            return false;
        }
        if (this.maxScrollOffset <= 0) {
            return true;
        }
        const step = Math.max(18, Math.round(22 * this.scale));
        if (delta < 0) {
            this.setCurrentScrollOffset(this.getCurrentScrollOffset() + step);
        } else if (delta > 0) {
            this.setCurrentScrollOffset(this.getCurrentScrollOffset() - step);
        }
        return true;
    }

    draw(graphics) {
        this.refreshLayout();
        if (this.fadeAlpha <= 0) return;

        const pages = this.getPages();
        const rosterEntries = this.getRosterEntries();

        graphics.push();
        graphics.fill(20, 20, 30, this.fadeAlpha * 0.94);
        graphics.stroke(255, 255, 255, this.fadeAlpha * 0.3);
        graphics.strokeWeight(2);
        graphics.rect(this.x, this.y, this.width, this.height, 10);

        graphics.noStroke();
        graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha * 1.2));
        graphics.textAlign(CENTER, TOP);
        graphics.textSize(Math.max(8, Math.round(9.2 * this.scale)));
        graphics.text(this.mode === 'roster' ? 'Battle Journal' : 'Butterfly Journal', this.x + this.width / 2, this.y + 10 * this.scale);

        this.drawFilterButton(graphics);

        this.drawTabButtons(graphics);

        if (this.mode === 'roster') {
            this.drawRosterPage(graphics);
        } else if (!pages.length) {
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(Math.max(7, Math.round(7.6 * this.scale)));
            graphics.fill(210, 220, 228, Math.min(255, this.fadeAlpha));
            graphics.text('No journal entries match the current filter.', this.x + this.width / 2, this.y + this.height / 2);
        } else {
            const page = this.getCurrentPage();
            if (page?.kind === 'base') {
                this.drawBasePage(graphics, page.type);
            } else if (page?.kind === 'hybrid') {
                this.drawHybridPage(graphics, page.entry);
            }
        }

        this.drawNavigationArrows(graphics);

        graphics.textAlign(CENTER, BOTTOM);
        if (this.mode === 'roster') {
            graphics.textSize(6.5 * this.scale);
            graphics.fill(255, 255, 200, Math.min(255, this.fadeAlpha));
            graphics.text(`Roster ${rosterEntries.length} living`, this.x + this.width / 2, this.y + this.height - 6 * this.scale);
            graphics.textSize(5 * this.scale);
            graphics.fill(200, 200, 200, Math.min(255, this.fadeAlpha * 0.85));
            graphics.text(`${Math.min(this.currentRosterIndex + 1, Math.max(1, rosterEntries.length))} / ${Math.max(1, rosterEntries.length)}`, this.x + this.width / 2, this.y + this.height - 16 * this.scale);
        } else {
            const footerWildTypes = this.butterflyOrder.filter(type => type !== 'golden').length;
            const footerHybridCount = (gameCore.gameState.hybridJournal || []).length;
            graphics.textSize(6.5 * this.scale);
            graphics.fill(255, 255, 200, Math.min(255, this.fadeAlpha));
            graphics.text(`${footerWildTypes} Wild Types • ${footerHybridCount} Hybrids`, this.x + this.width / 2, this.y + this.height - 6 * this.scale);
            graphics.textSize(5 * this.scale);
            graphics.fill(200, 200, 200, Math.min(255, this.fadeAlpha * 0.85));
            graphics.text(`${pages.length ? this.currentIndex + 1 : 0} / ${Math.max(1, pages.length)}`, this.x + this.width / 2, this.y + this.height - 16 * this.scale);
        }

        graphics.pop();
        return;

        const baseWildTypes = this.butterflyOrder.filter(type => type !== 'golden').length;
        const hybridCountLabel = (gameCore.gameState.hybridJournal || []).length;
        graphics.textAlign(CENTER, BOTTOM);
        graphics.textSize(6.5 * this.scale);
        graphics.fill(255, 255, 200, Math.min(255, this.fadeAlpha));
        graphics.text(`${baseWildTypes} Wild Types • ${hybridCountLabel} Hybrids`, this.x + this.width / 2, this.y + this.height - 6 * this.scale);

        graphics.textSize(5 * this.scale);
        graphics.fill(200, 200, 200, Math.min(255, this.fadeAlpha * 0.85));
        graphics.text(`${this.currentIndex + 1} / ${pages.length}`, this.x + this.width / 2, this.y + this.height - 16 * this.scale);

        graphics.pop();
        return;

        const legacyBaseWildTypes = this.butterflyOrder.filter(type => type !== 'golden').length;
        const legacyHybridCount = (gameCore.gameState.hybridJournal || []).length;
        graphics.textAlign(CENTER, BOTTOM);
        graphics.textSize(6.5 * this.scale);
        graphics.fill(255, 255, 200, Math.min(255, this.fadeAlpha));
        graphics.text(`${collected}/7 Base • ${hybridCount} Hybrids`, this.x + this.width / 2, this.y + this.height - 6 * this.scale);

        graphics.textSize(5 * this.scale);
        graphics.fill(200, 200, 200, Math.min(255, this.fadeAlpha * 0.85));
        graphics.text(`${this.currentIndex + 1} / ${pages.length}`, this.x + this.width / 2, this.y + this.height - 16 * this.scale);

        graphics.pop();
    }

    drawTabButtons(graphics) {
        graphics.push();
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(Math.max(5, Math.round(5.8 * this.scale)));
        for (const tab of this.tabButtons) {
            const active = this.mode === tab.id;
            graphics.fill(
                ...(active ? [86, 118, 170] : [34, 40, 52]),
                Math.min(255, this.fadeAlpha * (active ? 0.98 : 0.92))
            );
            graphics.stroke(255, 255, 255, this.fadeAlpha * (active ? 0.44 : 0.22));
            graphics.strokeWeight(active ? 1.5 : 1);
            graphics.rect(tab.x, tab.y, tab.width, tab.height, 6);
            graphics.noStroke();
            graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha));
            graphics.text(tab.label, tab.x + tab.width / 2, tab.y + tab.height / 2 + 1);
        }
        graphics.pop();
    }

    drawFilterButton(graphics) {
        if (this.mode !== 'collection') return;
        graphics.push();
        graphics.fill(this.hybridOnly ? 75 : 40, this.hybridOnly ? 115 : 40, this.hybridOnly ? 85 : 55, Math.min(255, this.fadeAlpha));
        graphics.stroke(255, 255, 255, this.fadeAlpha * 0.25);
        graphics.rect(this.filterButton.x, this.filterButton.y, this.filterButton.width, this.filterButton.height, 6);
        graphics.noStroke();
        graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha));
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(6 * this.scale);
        graphics.text(this.hybridOnly ? 'All' : 'Hybrid', this.filterButton.x + this.filterButton.width / 2, this.filterButton.y + this.filterButton.height / 2 + 1);
        graphics.pop();
    }

    getTrackedTraitKeys() {
        return ['speed', 'jitteriness', 'trustPropensity', 'trustSpeed', 'scareThreshold', 'happinessBonus'];
    }

    getTraitLabel(key) {
        const labels = {
            speed: 'Speed',
            jitteriness: 'Jitter',
            trustPropensity: 'Trust lean',
            trustSpeed: 'Trust rate',
            scareThreshold: 'Calmness',
            happinessBonus: 'Joy gain'
        };
        return labels[key] || key;
    }

    formatTraitValue(value) {
        if (typeof value !== 'number' || Number.isNaN(value)) return '--';
        return value.toFixed(2);
    }

    wrapTextLines(graphics, textValue, maxWidth, fontSize) {
        const raw = `${textValue ?? ''}`;
        const cacheKey = [
            'wrap',
            Math.round(fontSize * 100) / 100,
            Math.round(maxWidth * 10) / 10,
            raw
        ].join('|');
        return this.readLayoutCache(this.textLayoutCache, cacheKey, () => {
            const words = raw.split(' ');
            const lines = [];
            let current = '';
            graphics.push();
            graphics.textSize(fontSize);
            for (const word of words) {
                const next = current ? `${current} ${word}` : word;
                if (this.measureTextWidth(graphics, next) > maxWidth && current) {
                    lines.push(current);
                    current = word;
                } else {
                    current = next;
                }
            }
            graphics.pop();
            if (current) lines.push(current);
            return lines.length ? lines : [''];
        }, 1000);
    }

    measureStatsCardHeight(graphics, width, lines) {
        const fontSize = Math.max(6, Math.round(6.8 * this.scale));
        const cacheKey = [
            'stats',
            Math.round(width * 10) / 10,
            Math.round(this.scale * 100) / 100,
            Array.isArray(lines) ? lines.join('¦') : ''
        ].join('|');
        return this.readLayoutCache(this.measurementCache, cacheKey, () => {
            const wrappedLines = [];
            graphics.push();
            for (const line of lines) {
                wrappedLines.push(...this.wrapTextLines(graphics, line, width - 14 * this.scale, fontSize));
            }
            graphics.pop();
            const rowHeight = 7 * this.scale;
            return {
                wrappedLines,
                height: 14 * this.scale + (wrappedLines.length * rowHeight)
            };
        }, 300);
    }

    drawStatsCard(graphics, x, y, width, title, lines) {
        const measurement = this.measureStatsCardHeight(graphics, width, lines);
        const wrappedLines = measurement.wrappedLines;
        const height = measurement.height;
        const rowHeight = 7 * this.scale;
        const style = this.getStatsCardStyle(title);

        graphics.push();
        graphics.fill(style.fill[0], style.fill[1], style.fill[2], Math.min(255, this.fadeAlpha * 0.92));
        graphics.stroke(style.stroke[0], style.stroke[1], style.stroke[2], this.fadeAlpha * 0.2);
        graphics.strokeWeight(1);
        graphics.rect(x, y, width, height, 8);
        graphics.noStroke();
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(Math.max(7, Math.round(7.8 * this.scale)));
        graphics.fill(style.title[0], style.title[1], style.title[2], Math.min(255, this.fadeAlpha));
        graphics.text(title, x + 8 * this.scale, y + 4 * this.scale);

        graphics.textSize(Math.max(6, Math.round(6.8 * this.scale)));
        graphics.fill(style.text[0], style.text[1], style.text[2], Math.min(255, this.fadeAlpha));
        let lineY = y + 14 * this.scale;
        for (const line of wrappedLines) {
            graphics.text(line, x + 8 * this.scale, lineY);
            lineY += rowHeight;
        }
        graphics.pop();
        return height;
    }

    clipRect(graphics, x, y, width, height, drawFn) {
        const ctx = graphics.drawingContext;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
        drawFn();
        ctx.restore();
    }

    drawScrollViewport(graphics, viewport, sections, footerLabel = '') {
        const validSections = sections.filter(section => section && section.lines && section.lines.length);
        const gap = 4 * this.scale;
        const measured = validSections.map(section => ({
            ...section,
            measurement: this.measureStatsCardHeight(graphics, viewport.width, section.lines)
        }));
        const totalHeight = measured.reduce((sum, section, index) => (
            sum + section.measurement.height + (index < measured.length - 1 ? gap : 0)
        ), 0);
        const maxScroll = Math.max(0, totalHeight - viewport.height);
        this.registerScrollViewport(viewport, maxScroll);
        const offset = this.getCurrentScrollOffset();

        this.clipRect(graphics, viewport.x, viewport.y, viewport.width, viewport.height, () => {
            let currentY = viewport.y - offset;
            for (const section of measured) {
                this.drawStatsCard(graphics, viewport.x, currentY, viewport.width, section.title, section.lines);
                currentY += section.measurement.height + gap;
            }
        });

        graphics.push();
        graphics.textAlign(LEFT, BOTTOM);
        graphics.textSize(Math.max(5, Math.round(5.8 * this.scale)));
        graphics.fill(190, 198, 208, Math.min(255, this.fadeAlpha * 0.9));
        const leftLabel = maxScroll > 0 ? 'Wheel to scroll' : footerLabel;
        if (leftLabel) {
            graphics.text(leftLabel, viewport.x, viewport.y + viewport.height + 12 * this.scale);
        }
        if (maxScroll > 0) {
            graphics.textAlign(RIGHT, BOTTOM);
            const scrollPage = Math.min(maxScroll, offset) <= 0 ? 1 : Math.floor(offset / Math.max(1, viewport.height * 0.75)) + 1;
            const scrollPages = Math.max(1, Math.ceil(maxScroll / Math.max(1, viewport.height * 0.75)) + 1);
            graphics.text(`Scroll ${scrollPage}/${scrollPages}`, viewport.x + viewport.width, viewport.y + viewport.height + 12 * this.scale);
        }
        graphics.pop();
    }

    getWildStatusSummary(type) {
        const gameState = gameCore?.gameState || {};
        const livingWildCount = progressionManager?.getActiveWildVariantCount?.(gameState, type) || 0;
        const livingHybridCount = progressionManager?.getLivingHybridCount?.(gameState) || 0;
        const hybridCap = progressionManager?.getHybridAdultCap?.() || 50;
        const releasesRemaining = Math.max(0, 10 - (gameState.releasesSinceRespawn || 0));
        const modifiers = gameState.wildBaselineModifiers || {};
        const dominantShift = Object.entries(modifiers)
            .filter(([, value]) => Math.abs(value || 0) >= 0.02)
            .sort((left, right) => Math.abs(right[1]) - Math.abs(left[1]))[0] || null;

        if (type === 'golden') {
            return {
                statusLine: 'Legendary reserve',
                cardLines: [
                    'Deferred from the active wild ecology for now',
                    `Hybrids ${livingHybridCount}/${hybridCap} | releases ${gameState.totalReleases || 0}`,
                    'Returns only if we explicitly restore the legendary loop'
                ]
            };
        }

        const shiftLine = dominantShift
            ? `${this.getTraitLabel(dominantShift[0])} ${dominantShift[1] >= 0 ? '+' : ''}${Number(dominantShift[1]).toFixed(2)}`
            : 'near origin';

        return {
            statusLine: `Wild type | ${livingWildCount} living`,
            cardLines: [
                `${livingWildCount} active | 3 mates max | unique partners only`,
                `Release wave in ${releasesRemaining} | hybrids ${livingHybridCount}/${hybridCap}`,
                `Baseline drift ${shiftLine}`
            ]
        };
    }

    drawBasePage(graphics, type) {
        const personality = BUTTERFLY_PERSONALITIES[type];
        const journalEntry = this.journalEntries[type];
        const ecologySummary = this.getWildStatusSummary(type);
        const butterflyY = this.y + 62 * this.scale;

        this.drawPreviewGlow(graphics, butterflyY);

        this.drawSpritePreview(graphics, this.x + this.width / 2, butterflyY, {
            personalityType: type,
            sex: 'F'
        }, 0.045 * this.scale, this.fadeAlpha);

        graphics.textAlign(CENTER, TOP);
        graphics.textSize(Math.max(10, Math.round(11.4 * this.scale)));
        const nameColor = type === 'golden' ? [255, 220, 120] : [244, 246, 250];
        graphics.fill(nameColor[0], nameColor[1], nameColor[2], Math.min(255, this.fadeAlpha * 1.1));
        graphics.text(type.charAt(0).toUpperCase() + type.slice(1), this.x + this.width / 2, butterflyY + 30 * this.scale);

        const rarityColors = {
            common: [200, 200, 200],
            uncommon: [100, 255, 100],
            rare: [100, 150, 255],
            epic: [200, 100, 255],
            legendary: [255, 215, 0]
        };
        const rarityColor = rarityColors[personality.rarity] || [200, 200, 200];
        graphics.textSize(Math.max(7, Math.round(8.2 * this.scale)));
        graphics.fill(rarityColor[0], rarityColor[1], rarityColor[2], Math.min(255, this.fadeAlpha));
        graphics.text(personality.rarity.toUpperCase(), this.x + this.width / 2, butterflyY + 44 * this.scale);

        graphics.textSize(Math.max(7, Math.round(7.8 * this.scale)));
        graphics.fill(type === 'golden' ? 255 : 180, type === 'golden' ? 215 : 220, type === 'golden' ? 120 : 240, Math.min(255, this.fadeAlpha));
        graphics.text(ecologySummary.statusLine, this.x + this.width / 2, butterflyY + 56 * this.scale);

        if (journalEntry) {
            const introWidth = this.width - 46 * this.scale;
            const introFontSize = Math.max(6, Math.round(6.6 * this.scale));
            const introTop = butterflyY + 72 * this.scale;
            const introLines = this.wrapTextLines(graphics, journalEntry.description, introWidth, introFontSize);
            graphics.textAlign(CENTER, TOP);
            graphics.textSize(Math.max(8, Math.round(9.1 * this.scale)));
            graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha));
            graphics.textStyle(BOLD);
            graphics.text(journalEntry.title, this.x + this.width / 2, introTop);
            graphics.textStyle(NORMAL);
            this.drawWrappedText(graphics, journalEntry.description, this.x + this.width / 2, introTop + 14 * this.scale, introWidth, introFontSize, [190, 198, 208], false);

            const archetypeProfile = typeof statProfileSystem !== 'undefined'
                ? statProfileSystem.getArchetypeProfile?.(type)
                : null;
            const geneLines = archetypeProfile
                ? archetypeProfile.display.baselineLines
                : [
                    ...this.getTrackedTraitKeys().map(key => `${this.getTraitLabel(key)} ${this.formatTraitValue(personality.traits[key])}`),
                    `Ability ${BUTTERFLY_VARIANT_ABILITIES[type] || 'none'}`
                ];
            const abilityLines = archetypeProfile?.display?.abilityLines || [`Ability ${BUTTERFLY_VARIANT_ABILITIES[type] || 'none'}`];
            const mutationLines = archetypeProfile?.display?.mutationLines || [];
            const battleLines = archetypeProfile
                ? archetypeProfile.display.battleLines
                : ['No battle profile'];
            const readinessLines = archetypeProfile?.display?.readinessLines || ['Ready -- | Unknown'];
            const introHeight = introLines.length * (introFontSize + 2 * this.scale);
            const viewport = {
                x: this.x + 22 * this.scale,
                y: introTop + 22 * this.scale + introHeight,
                width: this.width - 44 * this.scale,
                height: this.y + this.height - (34 * this.scale) - (introTop + 22 * this.scale + introHeight)
            };
            this.drawScrollViewport(
                graphics,
                viewport,
                [
                    {
                        title: 'Genetic Baseline',
                        lines: [...geneLines, ...abilityLines.slice(0, 1), ...mutationLines.slice(0, 1)]
                    },
                    {
                        title: 'Battle Readiness',
                        lines: [...readinessLines.slice(0, 2), ...battleLines.slice(0, 2)]
                    },
                    {
                        title: 'Wild Ecology',
                        lines: ecologySummary.cardLines
                    },
                    {
                        title: 'Field Notes',
                        lines: [journalEntry.quote]
                    }
                ],
                ecologySummary.statusLine
            );
        }
    }

    drawHybridPage(graphics, entry) {
        const butterflyY = this.y + 58 * this.scale;
        const profile = typeof statProfileSystem !== 'undefined'
            ? statProfileSystem.getJournalProfile?.(entry, gameCore?.gameState)
            : null;
        const inheritanceLines = profile
            ? profile.display.baselineLines
            : [];
        const comparisonLines = profile
            ? profile.display.comparisonLines.slice(0, 2)
            : [];
        const battleLines = profile
            ? profile.display.battleLines.slice(0, 2)
            : [];
        const readinessLines = profile?.display?.readinessLines?.slice(0, 1) || [];
        const abilityLines = profile?.display?.abilityLines?.slice(0, 1) || [];
        const mutationLines = profile?.display?.mutationLines?.slice(0, 1) || [];
        const lineageLine = profile?.display?.wingLines?.[0] || null;
        const parentLines = profile?.display?.parentLines?.slice(0, 2) || [];
        const detailsLines = [...parentLines, ...comparisonLines, ...(lineageLine ? [lineageLine] : [])];

        this.drawPreviewGlow(graphics, butterflyY);
        this.drawSpritePreview(graphics, this.x + this.width / 2, butterflyY, entry.renderSpec, 0.042 * this.scale, this.fadeAlpha);

        graphics.textAlign(CENTER, TOP);
        graphics.textSize(Math.max(9, Math.round(10.6 * this.scale)));
        graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha));
        graphics.text(entry.name, this.x + this.width / 2, butterflyY + 28 * this.scale);

        graphics.textSize(Math.max(7, Math.round(8.2 * this.scale)));
        graphics.fill(120, 255, 180, Math.min(255, this.fadeAlpha));
        graphics.text('HYBRID', this.x + this.width / 2, butterflyY + 40 * this.scale);

        graphics.textSize(Math.max(6, Math.round(6.8 * this.scale)));
        graphics.fill(220, 220, 220, Math.min(255, this.fadeAlpha));
        graphics.text(`Sex: ${entry.sex}`, this.x + this.width / 2, butterflyY + 50 * this.scale);

        this.drawParentStrip(graphics, entry, butterflyY + 68 * this.scale);

        const bornAt = new Date(entry.bornAt);
        const viewport = {
            x: this.x + 22 * this.scale,
            y: butterflyY + 92 * this.scale,
            width: this.width - 44 * this.scale,
            height: this.y + this.height - (34 * this.scale) - (butterflyY + 92 * this.scale)
        };
        this.drawScrollViewport(
            graphics,
            viewport,
            [
                {
                    title: 'Genetic Baseline',
                    lines: [...inheritanceLines, ...abilityLines.slice(0, 1), ...mutationLines]
                },
                {
                    title: 'Parents + Wings',
                    lines: detailsLines
                },
                {
                    title: 'Battle Readiness',
                    lines: [...readinessLines.slice(0, 2), ...battleLines.slice(0, 2)]
                }
            ],
            `Born ${bornAt.toLocaleDateString()}`
        );

        graphics.fill(36, 52, 70, Math.min(255, this.fadeAlpha));
        graphics.stroke(255, 255, 255, this.fadeAlpha * 0.25);
        graphics.strokeWeight(1);
        graphics.rect(this.renameButton.x, this.renameButton.y, this.renameButton.width, this.renameButton.height, 8);
        graphics.noStroke();
        graphics.textSize(Math.max(6, Math.round(6.8 * this.scale)));
        graphics.fill(255, 240, 180, Math.min(255, this.fadeAlpha));
        graphics.text('Rename', this.renameButton.x + this.renameButton.width / 2, this.renameButton.y + 3 * this.scale);

        graphics.fill(180, 180, 180, Math.min(255, this.fadeAlpha));
        graphics.textSize(Math.max(5, Math.round(5.8 * this.scale)));
        graphics.textAlign(LEFT, TOP);
        graphics.text(`Born ${bornAt.toLocaleDateString()} ${bornAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`, this.x + 22 * this.scale, this.renameButton.y + 2 * this.scale);
    }

    drawRosterPage(graphics) {
        const entry = this.getCurrentRosterEntry();
        const entries = this.getRosterEntries();
        const rosterCount = gameCore?.gameState?.roster?.memberIds?.length || 0;
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(Math.max(7, Math.round(7.6 * this.scale)));
        graphics.fill(210, 220, 228, Math.min(255, this.fadeAlpha));
        graphics.text(`Roster ${entries.length} living | ${rosterCount} selected`, this.x + 16 * this.scale, this.y + 30 * this.scale);

        if (!entry) {
            graphics.text('No butterflies available', this.x + 16 * this.scale, this.y + 46 * this.scale);
            return;
        }

        const summary = typeof rosterSystem !== 'undefined'
            ? rosterSystem.getEntitySummary?.(entry.id, gameCore.gameState)
            : null;
        const profile = typeof statProfileSystem !== 'undefined'
            ? statProfileSystem.getEntityProfile?.(entry, gameCore.gameState)
            : null;
        const lifeSimSummary = typeof lifeSimSystem !== 'undefined'
            ? lifeSimSystem.getEntitySummary?.(entry.id)
            : null;
        const readiness = profile?.readinessProfile;
        const readinessScore = Math.round(readiness?.score || 0);
        const readinessTier = readiness?.tier || 'Watch';
        const readinessTone = readinessScore >= 70 ? 'ready' : 'watch';
        const readinessLines = profile?.display?.readinessLines || ['Ready -- | Unknown'];
        const battleLines = profile?.display?.battleLines || ['No battle profile'];
        const abilityLines = profile?.display?.abilityLines || ['Ability none'];
        const geneLines = profile?.display?.baselineLines || ['No genetic baseline'];
        const mutationLines = profile?.display?.mutationLines || [];
        const expressionLines = [
            ...(profile?.display?.upbringingLines?.slice(0, 1) || ['No learned imprint yet']),
            ...(profile?.display?.stateLines?.slice(0, 1) || ['Near baseline']),
            ...(profile?.display?.effectiveLines?.slice(0, 1) || ['No effective stats'])
        ];
        const contextLines = lifeSimSummary
            ? [
                `Origin ${lifeSimSummary.progression?.origin || entry.birthSource || 'wild'} | line ${lifeSimSummary.progression?.lineageValue || 0} | rare ${lifeSimSummary.progression?.rarityExposure || 0}`,
                `Use ${lifeSimSummary.objects?.focusType || 'none'} | ${lifeSimSummary.objects?.affordance || 'observe'} | shelter ${lifeSimSummary.objects?.shelterConfidence || 0}`,
                `Space ${lifeSimSummary.space?.role || 'loose'} | ${lifeSimSummary.space?.pathState || 'open'} | ${lifeSimSummary.space?.bodyFit || 'canPass'}`
            ]
            : [`Origin ${entry.birthSource || 'wild'} | line 0 | rare 0`];

        const previewY = this.y + 62 * this.scale;
        this.drawPreviewGlow(graphics, previewY);
        this.drawSpritePreview(graphics, this.x + this.width / 2, previewY, entry.getCollectionRenderSpec?.() || entry.renderSpec || {
            personalityType: entry.personalityType,
            sex: entry.sex,
            isHybrid: !!entry.isHybrid,
            hybridGenome: entry.hybridGenome || null
        }, 0.04 * this.scale, this.fadeAlpha);

        graphics.textAlign(CENTER, TOP);
        graphics.textSize(Math.max(8, Math.round(9.4 * this.scale)));
        graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha));
        graphics.text(entry.displayName || entry.personalityType || entry.id, this.x + this.width / 2, previewY + 26 * this.scale);
        graphics.textSize(Math.max(6, Math.round(6.8 * this.scale)));
        graphics.fill(180, 220, 255, Math.min(255, this.fadeAlpha));
        graphics.text(`${entry.sex || '?'} | ${summary?.label || 'Not on battle roster'} | ${readiness?.tier || 'Watch'}`, this.x + this.width / 2, previewY + 38 * this.scale);

        const cardX = this.x + 16 * this.scale;
        const cardWidth = this.width - 32 * this.scale;
        const viewport = {
            x: cardX,
            y: previewY + 54 * this.scale,
            width: cardWidth,
            height: this.y + this.height - (54 * this.scale) - (previewY + 54 * this.scale)
        };
        this.drawScrollViewport(
            graphics,
            viewport,
            [
                {
                    title: 'Genes + Ability',
                    lines: [...geneLines, ...abilityLines.slice(0, 1), ...mutationLines.slice(0, 1)]
                },
                {
                    title: 'Expression',
                    lines: expressionLines
                },
                {
                    title: 'Battle Readiness',
                    lines: [
                        ...readinessLines.slice(0, 2),
                        ...battleLines.slice(0, 1),
                        ...(profile?.display?.comparisonLines?.slice(0, 1) || []),
                        `Index ${this.currentRosterIndex + 1}/${Math.max(1, entries.length)}`
                    ]
                },
                {
                    title: 'Context',
                    lines: contextLines
                }
            ],
            `Roster ${entries.length} living`
        );

        this.drawRosterActionButtons(graphics, entry, summary, entries);
    }

    drawRosterActionButtons(graphics, entry, summary, entries) {
        const buttons = this.rosterActionButtons;
        const rosterCount = gameCore?.gameState?.roster?.memberIds?.length || 0;
        const drawButton = (rect, label, fillColor, textColor = [255, 255, 255]) => {
            graphics.fill(...fillColor, Math.min(255, this.fadeAlpha));
            graphics.stroke(255, 255, 255, this.fadeAlpha * 0.25);
            graphics.strokeWeight(1);
            graphics.rect(rect.x, rect.y, rect.width, rect.height, 6);
            graphics.noStroke();
            graphics.fill(...textColor, Math.min(255, this.fadeAlpha));
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(Math.max(6, Math.round(6.1 * this.scale)));
            graphics.text(label, rect.x + rect.width / 2, rect.y + rect.height / 2 + 1);
        };

        drawButton(buttons.toggleMember, summary?.member ? 'Leave Roster' : 'Join Roster', summary?.member ? [54, 72, 112] : [46, 58, 74]);
        drawButton(buttons.openBattle, rosterCount < 2 ? 'Need 2+' : 'Open Battle', rosterCount < 2 ? [54, 54, 54] : [92, 62, 44]);

        graphics.textAlign(LEFT, TOP);
        graphics.textSize(Math.max(5, Math.round(5.8 * this.scale)));
        graphics.fill(190, 198, 208, Math.min(255, this.fadeAlpha));
        graphics.text(`Battle roster ${rosterCount}`, this.x + 18 * this.scale, this.y + this.height - 22 * this.scale);
        graphics.text(`Viewing ${this.currentRosterIndex + 1}/${Math.max(1, entries.length)}`, this.x + this.width - 92 * this.scale, this.y + this.height - 22 * this.scale);
    }

    isPointInsideRenameButton(x, y) {
        return x >= this.renameButton.x &&
            x <= this.renameButton.x + this.renameButton.width &&
            y >= this.renameButton.y &&
            y <= this.renameButton.y + this.renameButton.height;
    }

    drawParentStrip(graphics, entry, y) {
        const leftX = this.x + this.width / 2 - 42 * this.scale;
        const rightX = this.x + this.width / 2 + 42 * this.scale;

        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(10 * this.scale);
        graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha));
        graphics.text('+', this.x + this.width / 2, y + 4 * this.scale);

        this.drawSpritePreview(graphics, leftX, y, entry.parentA, 0.022 * this.scale, this.fadeAlpha);
        this.drawSpritePreview(graphics, rightX, y, entry.parentB, 0.022 * this.scale, this.fadeAlpha);

        graphics.textSize(6 * this.scale);
        graphics.fill(200, 200, 200, Math.min(255, this.fadeAlpha));
        graphics.text(entry.parentA?.personalityType?.toUpperCase() || '?', leftX, y + 16 * this.scale);
        graphics.text(entry.parentB?.personalityType?.toUpperCase() || '?', rightX, y + 16 * this.scale);
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
        const lines = this.wrapTextLines(graphics, textValue || '', maxWidth, fontSize);
        let y = startY;
        graphics.textSize(fontSize);
        graphics.fill(color[0], color[1], color[2], Math.min(255, this.fadeAlpha));
        graphics.textStyle(italic ? ITALIC : NORMAL);
        for (const line of lines) {
            graphics.text(line, centerX, y);
            y += fontSize + 2 * this.scale;
        }
        graphics.textStyle(NORMAL);
    }

    drawSpritePreview(graphics, x, y, spec, previewScale, alpha) {
        if (!spec) return;

        graphics.push();
        graphics.translate(x, y);

        const wingSpread = 0.84;
        const hindSpread = 0.8;
        const flutter = 0;

        if (spriteManager.loaded && spriteManager.hasRenderableSpec(spec)) {
            const bodyScale = spec.sex === 'M' ? 0.8 : 1.0;
            const wingScale = spec.sex === 'F' ? 1.2 : 1.0;
            const bodyCenter = spriteManager.anchors.body;
            const useBakedSprites = !!spriteManager.isBakedCreatureSpritesEnabled?.();

            graphics.tint(255, alpha);

            if (spriteManager.body) {
                const s = previewScale * bodyScale;
                const bodySprite = spriteManager.body;
                const bodyW = spriteManager.body.width * s;
                const bodyH = spriteManager.body.height * s;
                graphics.image(bodySprite, -bodyW / 2, -bodyH / 2, bodyW, bodyH);
            }

            if (spriteManager.antenna) {
                const antennaScale = previewScale * bodyScale;
                const antennaSprite = spriteManager.antenna;
                const antennaW = spriteManager.antenna.width * antennaScale;
                const antennaH = spriteManager.antenna.height * antennaScale;
                const anchors = spriteManager.anchors.antenna;
                for (const side of ['left', 'right']) {
                    const anchor = anchors[side];
                    const bodyConnX = (anchor.onBody.x - bodyCenter.centerX) * antennaScale;
                    const bodyConnY = (anchor.onBody.y - bodyCenter.centerY) * antennaScale;
                    const drawX = bodyConnX - (anchor.onAntenna.x * antennaScale);
                    const drawY = bodyConnY - (anchor.onAntenna.y * antennaScale);
                    graphics.image(antennaSprite, drawX, drawY, antennaW, antennaH);
                }
            }

            graphics.push();
            graphics.rotate(flutter * 0.3);

            for (const wingKey of ['hindLeft', 'hindRight', 'foreLeft', 'foreRight']) {
                const rawPiece = spriteManager.getWingPieceForSpec(spec, wingKey);
                if (!rawPiece) continue;

                const anchor = spriteManager.anchors.wings[wingKey];
                const relAnchor = spriteManager.anchors.wingsRelative[wingKey];
                const bodyConnX = (anchor.onBody.x - bodyCenter.centerX) * (previewScale * bodyScale);
                let bodyConnY = (anchor.onBody.y - bodyCenter.centerY) * (previewScale * bodyScale);
                if (wingKey.startsWith('hind')) {
                    bodyConnY -= 5 * previewScale * bodyScale;
                }

                const ws = previewScale * wingScale * 1.45;
                let piece = rawPiece;
                let pieceW = rawPiece.width * ws;
                let pieceH = rawPiece.height * ws;
                let anchorX = relAnchor.x * ws;
                let anchorY = relAnchor.y * ws;
                let bakedPoseUsed = false;
                if (useBakedSprites) {
                    const spread = wingKey.startsWith('hind') ? hindSpread : wingSpread;
                    const bakedPose = spriteManager.shouldUseBakedWingPose?.(wingKey, spread, false)
                        ? spriteManager.getBakedWingPoseData(spec, wingKey, ws, spread)
                        : null;
                    if (bakedPose?.surface) {
                        piece = bakedPose.surface;
                        pieceW = bakedPose.drawWidth;
                        pieceH = bakedPose.drawHeight;
                        anchorX = bakedPose.anchorX;
                        anchorY = bakedPose.anchorY;
                        bakedPoseUsed = true;
                    } else {
                        const bakedPiece = spriteManager.getBakedWingPieceData(spec, wingKey, ws);
                        if (bakedPiece?.surface) {
                            piece = bakedPiece.surface;
                            pieceW = bakedPiece.drawWidth;
                            pieceH = bakedPiece.drawHeight;
                            anchorX = bakedPiece.anchorX;
                            anchorY = bakedPiece.anchorY;
                        }
                    }
                }
                const drawX = bodyConnX - anchorX;
                const drawY = bodyConnY - anchorY;
                const spread = wingKey.startsWith('hind') ? hindSpread : wingSpread;

                if (bakedPoseUsed) {
                    graphics.image(piece, drawX, drawY, pieceW, pieceH);
                    continue;
                }

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

    measureWrappedBlock(graphics, textValue, maxWidth, fontSize) {
        const raw = `${textValue ?? ''}`;
        const cacheKey = [
            'block',
            Math.round(fontSize * 100) / 100,
            Math.round(maxWidth * 10) / 10,
            Math.round(this.scale * 100) / 100,
            raw
        ].join('|');
        return this.readLayoutCache(this.measurementCache, cacheKey, () => {
            const lines = this.wrapTextLines(graphics, raw, maxWidth, fontSize);
            return {
                lines,
                height: lines.length * (fontSize + 2 * this.scale)
            };
        }, 320);
    }

    drawWrappedBlock(graphics, x, y, fontSize, color, lines) {
        let currentY = y;
        graphics.push();
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(fontSize);
        graphics.fill(color[0], color[1], color[2], Math.min(255, this.fadeAlpha));
        for (const line of lines) {
            graphics.text(line, x, currentY);
            currentY += fontSize + 2 * this.scale;
        }
        graphics.pop();
        return currentY;
    }

    truncateText(graphics, textValue, maxWidth) {
        const raw = `${textValue ?? ''}`;
        if (!raw) return '';
        const cacheKey = [
            'truncate',
            this.getGraphicsTextStateKey(graphics),
            Math.round(maxWidth * 10) / 10,
            raw
        ].join('|');
        return this.readLayoutCache(this.textLayoutCache, cacheKey, () => {
            if (this.measureTextWidth(graphics, raw) <= maxWidth) return raw;

            let sliceLength = raw.length;
            while (sliceLength > 1 && this.measureTextWidth(graphics, `${raw.slice(0, sliceLength)}...`) > maxWidth) {
                sliceLength -= 1;
            }
            return `${raw.slice(0, sliceLength)}...`;
        }, 900);
    }

    getStatsCardStyle(title = '') {
        const key = String(title || '').toLowerCase();
        if (key.includes('battle')) {
            return {
                fill: [54, 36, 30],
                stroke: [236, 188, 156],
                title: [255, 226, 200],
                text: [250, 242, 234]
            };
        }
        if (key.includes('genetic') || key.includes('gene')) {
            return {
                fill: [30, 36, 56],
                stroke: [178, 196, 240],
                title: [228, 236, 255],
                text: [238, 242, 250]
            };
        }
        if (key.includes('ecology') || key.includes('field')) {
            return {
                fill: [28, 46, 40],
                stroke: [162, 218, 198],
                title: [220, 244, 234],
                text: [238, 246, 242]
            };
        }
        if (key.includes('context') || key.includes('parents') || key.includes('wings')) {
            return {
                fill: [42, 38, 30],
                stroke: [224, 208, 150],
                title: [246, 234, 198],
                text: [244, 240, 230]
            };
        }
        if (key.includes('expression')) {
            return {
                fill: [34, 40, 34],
                stroke: [184, 214, 184],
                title: [226, 242, 220],
                text: [238, 246, 236]
            };
        }
        return {
            fill: [20, 28, 38],
            stroke: [255, 255, 255],
            title: [255, 245, 190],
            text: [230, 230, 230]
        };
    }

    getJournalBadgePalette(tone = 'neutral') {
        const palettes = {
            wild: {
                fill: [36, 64, 54],
                stroke: [162, 220, 198],
                text: [236, 248, 242]
            },
            hybrid: {
                fill: [42, 58, 78],
                stroke: [172, 206, 246],
                text: [238, 244, 252]
            },
            rostered: {
                fill: [56, 72, 112],
                stroke: [194, 214, 255],
                text: [242, 246, 255]
            },
            reserve: {
                fill: [48, 48, 56],
                stroke: [196, 196, 204],
                text: [238, 238, 242]
            },
            ready: {
                fill: [66, 84, 48],
                stroke: [206, 226, 168],
                text: [244, 248, 236]
            },
            watch: {
                fill: [76, 62, 42],
                stroke: [236, 204, 150],
                text: [248, 242, 230]
            },
            legendary: {
                fill: [112, 84, 26],
                stroke: [255, 226, 150],
                text: [255, 247, 224]
            },
            rarity: {
                fill: [54, 46, 68],
                stroke: [210, 188, 244],
                text: [244, 236, 255]
            },
            count: {
                fill: [38, 44, 58],
                stroke: [188, 204, 228],
                text: [236, 242, 250]
            },
            meta: {
                fill: [44, 48, 54],
                stroke: [196, 202, 212],
                text: [238, 242, 246]
            },
            neutral: {
                fill: [34, 40, 50],
                stroke: [206, 214, 226],
                text: [238, 242, 246]
            }
        };
        return palettes[tone] || palettes.neutral;
    }

    drawJournalBadgeRow(graphics, x, y, badges = [], maxWidth = Infinity) {
        const activeBadges = (badges || []).filter(badge => badge?.label);
        if (!activeBadges.length) {
            return {
                height: 0,
                width: 0
            };
        }

        const gap = 4 * this.scale;
        const badgeHeight = Math.max(11, Math.round(12 * this.scale));
        const fontSize = Math.max(5, Math.round(5.7 * this.scale));
        let currentX = x;
        let totalWidth = 0;

        graphics.push();
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(fontSize);

        for (const badge of activeBadges) {
            const palette = this.getJournalBadgePalette(badge.tone || 'neutral');
            const rawLabel = `${badge.label}`;
            const maxBadgeWidth = Math.max(36 * this.scale, maxWidth - (currentX - x));
            const width = Math.max(
                28 * this.scale,
                Math.min(maxBadgeWidth, this.measureTextWidth(graphics, rawLabel) + (10 * this.scale))
            );
            const label = this.truncateText(graphics, rawLabel, width - (8 * this.scale));

            graphics.fill(palette.fill[0], palette.fill[1], palette.fill[2], Math.min(255, this.fadeAlpha * 0.96));
            graphics.stroke(palette.stroke[0], palette.stroke[1], palette.stroke[2], this.fadeAlpha * 0.28);
            graphics.strokeWeight(1);
            graphics.rect(currentX, y, width, badgeHeight, 6);
            graphics.noStroke();
            graphics.fill(palette.text[0], palette.text[1], palette.text[2], Math.min(255, this.fadeAlpha));
            graphics.text(label, currentX + width / 2, y + badgeHeight / 2 + 0.5);

            currentX += width + gap;
            totalWidth += width + gap;
            if (currentX > x + maxWidth) {
                break;
            }
        }

        graphics.pop();
        return {
            height: badgeHeight,
            width: Math.max(0, totalWidth - gap)
        };
    }

    drawJournalSummaryCard(graphics, {
        title,
        eyebrow = '',
        accentColor = [255, 255, 255],
        description = '',
        detailLines = [],
        badgeItems = [],
        previewSpec = null,
        previewScale = 0.03 * this.scale,
        parentStrip = null
    }) {
        const cardX = this.x + 16 * this.scale;
        const cardY = this.y + 34 * this.scale;
        const cardWidth = this.width - 32 * this.scale;
        const cardPadding = 10 * this.scale;
        const previewCenterX = cardX + 28 * this.scale;
        const previewCenterY = cardY + 30 * this.scale;
        const textX = cardX + 54 * this.scale;
        const textWidth = Math.max(108 * this.scale, cardWidth - 64 * this.scale);
        const eyebrowFont = Math.max(6, Math.round(6.5 * this.scale));
        const titleFont = Math.max(8, Math.round(9.4 * this.scale));
        const descFont = Math.max(6, Math.round(6.5 * this.scale));
        const detailFont = Math.max(6, Math.round(6.2 * this.scale));
        const activeDetailLines = (detailLines || []).filter(Boolean).slice(0, 2);
        const descriptionMeasure = this.measureWrappedBlock(graphics, description, textWidth, descFont);
        const badgeHeight = (badgeItems || []).filter(item => item?.label).length
            ? Math.max(11, Math.round(12 * this.scale))
            : 0;
        const badgeGap = badgeHeight > 0 ? 4 * this.scale : 0;
        const detailHeight = activeDetailLines.length
            ? activeDetailLines.length * (detailFont + 2 * this.scale) + 4 * this.scale
            : 0;
        const parentStripHeight = parentStrip ? 34 * this.scale : 0;
        const cardHeight = Math.max(
            78 * this.scale,
            (cardPadding * 2) + badgeHeight + badgeGap + 10 * this.scale + titleFont + descriptionMeasure.height + detailHeight + parentStripHeight
        );

        graphics.push();
        graphics.fill(24, 30, 40, Math.min(255, this.fadeAlpha * 0.92));
        graphics.stroke(255, 255, 255, this.fadeAlpha * 0.22);
        graphics.strokeWeight(1);
        graphics.rect(cardX, cardY, cardWidth, cardHeight, 10);

        graphics.noStroke();
        graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha * 0.08));
        graphics.ellipse(previewCenterX, previewCenterY, 42 * this.scale, 32 * this.scale);
        if (previewSpec) {
            this.drawSpritePreview(graphics, previewCenterX, previewCenterY, previewSpec, previewScale, this.fadeAlpha);
        }

        const textTop = cardY + cardPadding;
        if (badgeHeight > 0) {
            this.drawJournalBadgeRow(graphics, textX, textTop, badgeItems, textWidth);
        }

        graphics.textAlign(LEFT, TOP);
        graphics.textSize(eyebrowFont);
        graphics.fill(190, 204, 220, Math.min(255, this.fadeAlpha));
        graphics.text(eyebrow, textX, textTop + badgeHeight + badgeGap);

        graphics.textSize(titleFont);
        graphics.fill(accentColor[0], accentColor[1], accentColor[2], Math.min(255, this.fadeAlpha));
        graphics.text(title, textX, textTop + badgeHeight + badgeGap + 10 * this.scale);

        let currentY = textTop + badgeHeight + badgeGap + 22 * this.scale;
        if (descriptionMeasure.lines.length) {
            currentY = this.drawWrappedBlock(graphics, textX, currentY, descFont, [228, 234, 242], descriptionMeasure.lines);
            currentY += 3 * this.scale;
        }
        if (activeDetailLines.length) {
            currentY = this.drawWrappedBlock(graphics, textX, currentY, detailFont, [192, 206, 220], activeDetailLines);
        }

        if (parentStrip) {
            const stripY = cardY + cardHeight - 22 * this.scale;
            const leftX = cardX + cardWidth / 2 - 28 * this.scale;
            const rightX = cardX + cardWidth / 2 + 28 * this.scale;
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(10 * this.scale);
            graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha));
            graphics.text('+', cardX + cardWidth / 2, stripY);
            this.drawSpritePreview(graphics, leftX, stripY - 2 * this.scale, parentStrip.leftSpec, 0.016 * this.scale, this.fadeAlpha);
            this.drawSpritePreview(graphics, rightX, stripY - 2 * this.scale, parentStrip.rightSpec, 0.016 * this.scale, this.fadeAlpha);
            graphics.textSize(Math.max(5, Math.round(5.2 * this.scale)));
            graphics.fill(200, 208, 216, Math.min(255, this.fadeAlpha));
            graphics.text(parentStrip.leftLabel || '?', leftX, stripY + 12 * this.scale);
            graphics.text(parentStrip.rightLabel || '?', rightX, stripY + 12 * this.scale);
        }
        graphics.pop();

        return {
            x: cardX,
            y: cardY,
            width: cardWidth,
            height: cardHeight,
            bottomY: cardY + cardHeight
        };
    }

    drawRosterGlanceStrip(graphics, x, y, width, entries, currentIndex) {
        const visibleCount = Math.min(5, entries.length);
        if (!visibleCount) return 0;

        const startIndex = Math.max(
            0,
            Math.min(entries.length - visibleCount, currentIndex - Math.floor(visibleCount / 2))
        );
        const visibleEntries = entries.slice(startIndex, startIndex + visibleCount);
        const gap = 4 * this.scale;
        const cardHeight = Math.max(24, Math.round(24 * this.scale));
        const labelFont = Math.max(5, Math.round(5.8 * this.scale));
        const metaFont = Math.max(5, Math.round(5.4 * this.scale));
        const cardWidth = (width - (gap * (visibleEntries.length - 1))) / Math.max(1, visibleEntries.length);

        graphics.push();
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(Math.max(5, Math.round(5.5 * this.scale)));
        graphics.fill(196, 206, 220, Math.min(255, this.fadeAlpha * 0.9));
        graphics.text('Roster band', x, y);

        let currentX = x;
        const cardY = y + 8 * this.scale;
        for (let index = 0; index < visibleEntries.length; index += 1) {
            const entry = visibleEntries[index];
            const absoluteIndex = startIndex + index;
            const summary = rosterSystem?.getEntitySummary?.(entry.id, gameCore?.gameState) || null;
            const profile = statProfileSystem?.getEntityProfile?.(entry, gameCore?.gameState) || null;
            const readinessScore = Math.round(profile?.readinessProfile?.score || 0);
            const isCurrent = absoluteIndex === currentIndex;
            const isMember = !!summary?.member;
            const fill = isCurrent
                ? [82, 104, 156]
                : isMember
                    ? [46, 64, 104]
                    : [34, 40, 50];
            const stroke = isCurrent
                ? [220, 232, 255]
                : isMember
                    ? [182, 206, 248]
                    : [188, 196, 210];
            const shortName = this.truncateText(graphics, entry.displayName || entry.personalityType || entry.id, cardWidth - (10 * this.scale));

            graphics.fill(fill[0], fill[1], fill[2], Math.min(255, this.fadeAlpha * 0.95));
            graphics.stroke(stroke[0], stroke[1], stroke[2], this.fadeAlpha * (isCurrent ? 0.42 : 0.24));
            graphics.strokeWeight(isCurrent ? 1.5 : 1);
            graphics.rect(currentX, cardY, cardWidth, cardHeight, 7);
            graphics.noStroke();
            graphics.textAlign(LEFT, TOP);
            graphics.textSize(labelFont);
            graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha));
            graphics.text(shortName, currentX + 5 * this.scale, cardY + 4 * this.scale);
            graphics.textSize(metaFont);
            graphics.fill(210, 220, 234, Math.min(255, this.fadeAlpha * 0.95));
            graphics.text(`R ${readinessScore} | ${isMember ? 'IN' : 'OUT'}`, currentX + 5 * this.scale, cardY + 12 * this.scale);

            currentX += cardWidth + gap;
        }
        graphics.pop();

        return (cardY + cardHeight) - y;
    }

    drawFilterButton(graphics) {
        if (this.mode !== 'collection') return;
        graphics.push();
        graphics.fill(...(this.hybridOnly ? [68, 98, 132] : [40, 48, 60]), Math.min(255, this.fadeAlpha));
        graphics.stroke(255, 255, 255, this.fadeAlpha * 0.26);
        graphics.rect(this.filterButton.x, this.filterButton.y, this.filterButton.width, this.filterButton.height, 6);
        graphics.noStroke();
        graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha));
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(Math.max(5, Math.round(5.6 * this.scale)));
        graphics.text(this.hybridOnly ? 'All Pages' : 'Hybrids', this.filterButton.x + this.filterButton.width / 2, this.filterButton.y + this.filterButton.height / 2 + 1);
        graphics.pop();
    }

    drawBasePage(graphics, type) {
        const personality = BUTTERFLY_PERSONALITIES[type];
        const journalEntry = this.journalEntries[type];
        const ecologySummary = this.getWildStatusSummary(type);
        const archetypeProfile = typeof statProfileSystem !== 'undefined'
            ? statProfileSystem.getArchetypeProfile?.(type)
            : null;
        const livingWildCount = progressionManager?.getActiveWildVariantCount?.(gameCore?.gameState || {}, type) || 0;
        const rarityTone = personality.rarity === 'legendary'
            ? 'legendary'
            : (personality.rarity === 'rare' || personality.rarity === 'epic')
                ? 'rarity'
                : 'meta';
        const geneLines = archetypeProfile
            ? archetypeProfile.display.baselineLines
            : [
                ...this.getTrackedTraitKeys().map(key => `${this.getTraitLabel(key)} ${this.formatTraitValue(personality.traits[key])}`),
                `Ability ${BUTTERFLY_VARIANT_ABILITIES[type] || 'none'}`
            ];
        const abilityLines = archetypeProfile?.display?.abilityLines || [`Ability ${BUTTERFLY_VARIANT_ABILITIES[type] || 'none'}`];
        const mutationLines = archetypeProfile?.display?.mutationLines || [];
        const battleLines = archetypeProfile ? archetypeProfile.display.battleLines : ['No battle profile'];
        const readinessLines = archetypeProfile?.display?.readinessLines || ['Ready -- | Unknown'];
        const nameColor = type === 'golden' ? [255, 220, 120] : [244, 246, 250];
        const summary = this.drawJournalSummaryCard(graphics, {
            title: journalEntry?.title || type,
            eyebrow: `${personality.rarity.toUpperCase()} | ${type.toUpperCase()} wild type`,
            accentColor: nameColor,
            description: journalEntry?.description || '',
            detailLines: [
                abilityLines[0],
                readinessLines[0] || 'Ready -- | Unknown',
                ecologySummary.cardLines[0]
            ],
            badgeItems: [
                { label: 'WILD', tone: 'wild' },
                { label: personality.rarity.toUpperCase(), tone: rarityTone },
                { label: `${livingWildCount} living`, tone: 'count' }
            ],
            previewSpec: {
                personalityType: type,
                sex: 'F'
            },
            previewScale: 0.032 * this.scale
        });
        const viewport = {
            x: this.x + 20 * this.scale,
            y: summary.bottomY + 10 * this.scale,
            width: this.width - 40 * this.scale,
            height: this.y + this.height - (34 * this.scale) - (summary.bottomY + 10 * this.scale)
        };
        this.drawScrollViewport(
            graphics,
            viewport,
            [
                {
                    title: 'Genetic Baseline',
                    lines: [...geneLines, ...abilityLines.slice(0, 1), ...mutationLines.slice(0, 1)]
                },
                {
                    title: 'Battle Readiness',
                    lines: [...readinessLines.slice(0, 2), ...battleLines.slice(0, 2)]
                },
                {
                    title: 'Wild Ecology',
                    lines: ecologySummary.cardLines
                },
                {
                    title: 'Field Notes',
                    lines: [journalEntry?.quote || '', journalEntry?.description || '']
                }
            ],
            ecologySummary.statusLine
        );
    }

    drawHybridPage(graphics, entry) {
        const profile = typeof statProfileSystem !== 'undefined'
            ? statProfileSystem.getJournalProfile?.(entry, gameCore?.gameState)
            : null;
        const inheritanceLines = profile ? profile.display.baselineLines : [];
        const comparisonLines = profile ? profile.display.comparisonLines.slice(0, 2) : [];
        const battleLines = profile ? profile.display.battleLines.slice(0, 2) : [];
        const readinessLines = profile?.display?.readinessLines?.slice(0, 1) || [];
        const abilityLines = profile?.display?.abilityLines?.slice(0, 1) || [];
        const mutationLines = profile?.display?.mutationLines?.slice(0, 1) || [];
        const heritageLines = profile?.display?.heritageLines?.slice(0, 2) || [];
        const rarityLines = profile?.display?.rarityLines?.slice(0, 2) || [];
        const ecologyLines = profile?.display?.ecologyLines?.slice(0, 3) || [];
        const lockLines = profile?.display?.lockLines?.slice(0, 1) || [];
        const lineageLine = profile?.display?.wingLines?.[0] || null;
        const parentLines = profile?.display?.parentLines?.slice(0, 2) || [];
        const detailsLines = [
            ...parentLines,
            ...comparisonLines,
            ...(lineageLine ? [lineageLine] : []),
            ...heritageLines.slice(0, 1),
            ...rarityLines.slice(0, 1)
        ];
        const bornAt = new Date(entry.bornAt);
        const summary = this.drawJournalSummaryCard(graphics, {
            title: entry.name,
            eyebrow: `HYBRID | ${entry.sex} | Born ${bornAt.toLocaleDateString()}`,
            accentColor: [255, 255, 255],
            description: parentLines.join(' | '),
            detailLines: [
                abilityLines[0] || 'Ability none',
                readinessLines[0] || 'Ready -- | Unknown',
                ecologyLines[0] || heritageLines[0] || lineageLine || 'No wing lineage trace'
            ],
            badgeItems: [
                { label: 'HYBRID', tone: 'hybrid' },
                { label: entry.sex || '?', tone: 'meta' },
                { label: `Born ${bornAt.toLocaleDateString()}`, tone: 'count' }
            ],
            previewSpec: entry.renderSpec,
            previewScale: 0.03 * this.scale,
            parentStrip: {
                leftSpec: entry.parentA,
                rightSpec: entry.parentB,
                leftLabel: entry.parentA?.personalityType?.toUpperCase() || '?',
                rightLabel: entry.parentB?.personalityType?.toUpperCase() || '?'
            }
        });
        const viewport = {
            x: this.x + 20 * this.scale,
            y: summary.bottomY + 10 * this.scale,
            width: this.width - 40 * this.scale,
            height: this.y + this.height - (34 * this.scale) - (summary.bottomY + 10 * this.scale)
        };
        this.drawScrollViewport(
            graphics,
            viewport,
            [
                {
                    title: 'Genetic Baseline',
                    lines: [...inheritanceLines, ...abilityLines.slice(0, 1), ...mutationLines, ...lockLines]
                },
                {
                    title: 'Parents + Wings',
                    lines: [
                        ...detailsLines,
                        ...heritageLines.slice(1),
                        ...rarityLines.slice(1),
                        `Born ${bornAt.toLocaleDateString()} ${bornAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                    ]
                },
                {
                    title: 'Release + Ecology',
                    lines: ecologyLines.length ? ecologyLines : ['No active release pressure summary']
                },
                {
                    title: 'Battle Readiness',
                    lines: [...readinessLines.slice(0, 2), ...battleLines.slice(0, 2)]
                }
            ],
            `Born ${bornAt.toLocaleDateString()}`
        );

        graphics.fill(36, 52, 70, Math.min(255, this.fadeAlpha));
        graphics.stroke(255, 255, 255, this.fadeAlpha * 0.25);
        graphics.strokeWeight(1);
        graphics.rect(this.renameButton.x, this.renameButton.y, this.renameButton.width, this.renameButton.height, 8);
        graphics.noStroke();
        graphics.textSize(Math.max(6, Math.round(6.8 * this.scale)));
        graphics.fill(255, 240, 180, Math.min(255, this.fadeAlpha));
        graphics.text('Rename', this.renameButton.x + this.renameButton.width / 2, this.renameButton.y + 3 * this.scale);
    }

    drawRosterPage(graphics) {
        const entry = this.getCurrentRosterEntry();
        const entries = this.getRosterEntries();
        const rosterCount = gameCore?.gameState?.roster?.memberIds?.length || 0;
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(Math.max(7, Math.round(7.6 * this.scale)));
        graphics.fill(210, 220, 228, Math.min(255, this.fadeAlpha));
        graphics.text(`Roster ${entries.length} living | ${rosterCount} selected`, this.x + 16 * this.scale, this.y + 30 * this.scale);

        if (!entry) {
            graphics.text('No butterflies available', this.x + 16 * this.scale, this.y + 46 * this.scale);
            return;
        }

        const summary = typeof rosterSystem !== 'undefined'
            ? rosterSystem.getEntitySummary?.(entry.id, gameCore.gameState)
            : null;
        const profile = typeof statProfileSystem !== 'undefined'
            ? statProfileSystem.getEntityProfile?.(entry, gameCore.gameState)
            : null;
        const lifeSimSummary = typeof lifeSimSystem !== 'undefined'
            ? lifeSimSystem.getEntitySummary?.(entry.id)
            : null;
        const readiness = profile?.readinessProfile;
        const readinessScore = Math.round(readiness?.score || 0);
        const readinessTier = readiness?.tier || 'Watch';
        const readinessTone = readinessScore >= 70 ? 'ready' : 'watch';
        const readinessLines = profile?.display?.readinessLines || ['Ready -- | Unknown'];
        const battleLines = profile?.display?.battleLines || ['No battle profile'];
        const abilityLines = profile?.display?.abilityLines || ['Ability none'];
        const geneLines = profile?.display?.baselineLines || ['No genetic baseline'];
        const mutationLines = profile?.display?.mutationLines || [];
        const heritageLines = profile?.display?.heritageLines || [];
        const rarityLines = profile?.display?.rarityLines || [];
        const ecologyLines = profile?.display?.ecologyLines || [];
        const lockLines = profile?.display?.lockLines || [];
        const expressionLines = [
            ...(profile?.display?.upbringingLines?.slice(0, 1) || ['No learned imprint yet']),
            ...(profile?.display?.stateLines?.slice(0, 1) || ['Near baseline']),
            ...(profile?.display?.effectiveLines?.slice(0, 1) || ['No effective stats'])
        ];
        const contextLines = lifeSimSummary
            ? [
                `Origin ${lifeSimSummary.progression?.origin || entry.birthSource || 'wild'} | line ${lifeSimSummary.progression?.lineageValue || 0} | rare ${lifeSimSummary.progression?.rarityExposure || 0}`,
                `Use ${lifeSimSummary.objects?.focusType || 'none'} | ${lifeSimSummary.objects?.affordance || 'observe'} | shelter ${lifeSimSummary.objects?.shelterConfidence || 0}`,
                `Space ${lifeSimSummary.space?.role || 'loose'} | ${lifeSimSummary.space?.pathState || 'open'} | ${lifeSimSummary.space?.bodyFit || 'canPass'}`
            ]
            : [`Origin ${entry.birthSource || 'wild'} | line 0 | rare 0`];
        const renderSpec = entry.getCollectionRenderSpec?.() || entry.renderSpec || {
            personalityType: entry.personalityType,
            sex: entry.sex,
            isHybrid: !!entry.isHybrid,
            hybridGenome: entry.hybridGenome || null
        };
        const summaryCard = this.drawJournalSummaryCard(graphics, {
            title: entry.displayName || entry.personalityType || entry.id,
            eyebrow: `${entry.sex || '?'} | ${summary?.label || 'Not on battle roster'} | ${readiness?.tier || 'Watch'}`,
            accentColor: [255, 255, 255],
            description: readinessLines[0] || 'Ready -- | Unknown',
            detailLines: [
                battleLines[0] || 'No battle profile',
                abilityLines[0] || 'Ability none',
                ecologyLines[0] || heritageLines[0] || contextLines[0] || `Origin ${entry.birthSource || 'wild'}`
            ],
            badgeItems: [
                { label: summary?.member ? 'ROSTERED' : 'RESERVE', tone: summary?.member ? 'rostered' : 'reserve' },
                { label: readinessTier.toUpperCase(), tone: readinessTone },
                { label: `R ${readinessScore}`, tone: 'count' }
            ],
            previewSpec: renderSpec,
            previewScale: 0.03 * this.scale
        });
        const stripHeight = this.drawRosterGlanceStrip(
            graphics,
            this.x + 16 * this.scale,
            summaryCard.bottomY + 8 * this.scale,
            this.width - 32 * this.scale,
            entries,
            this.currentRosterIndex
        );

        const viewport = {
            x: this.x + 16 * this.scale,
            y: summaryCard.bottomY + 12 * this.scale + stripHeight,
            width: this.width - 32 * this.scale,
            height: this.y + this.height - (54 * this.scale) - (summaryCard.bottomY + 12 * this.scale + stripHeight)
        };
        this.drawScrollViewport(
            graphics,
            viewport,
            [
                {
                    title: 'Genes + Ability',
                    lines: [...geneLines, ...abilityLines.slice(0, 1), ...mutationLines.slice(0, 1), ...lockLines.slice(0, 1)]
                },
                {
                    title: 'Expression',
                    lines: expressionLines
                },
                {
                    title: 'Battle Readiness',
                    lines: [
                        ...readinessLines.slice(0, 2),
                        ...battleLines.slice(0, 1),
                        ...(profile?.display?.comparisonLines?.slice(0, 1) || []),
                        `Index ${this.currentRosterIndex + 1}/${Math.max(1, entries.length)}`
                    ]
                },
                {
                    title: 'Context',
                    lines: [...ecologyLines, ...heritageLines, ...rarityLines, ...contextLines]
                }
            ],
            `Roster ${entries.length} living`
        );

        this.drawRosterActionButtons(graphics, entry, summary, entries);
    }

    draw(graphics) {
        this.refreshLayout();
        if (this.fadeAlpha <= 0) return;

        const pages = this.getPages();
        const rosterEntries = this.getRosterEntries();

        graphics.push();
        graphics.fill(20, 20, 30, this.fadeAlpha * 0.94);
        graphics.stroke(255, 255, 255, this.fadeAlpha * 0.3);
        graphics.strokeWeight(2);
        graphics.rect(this.x, this.y, this.width, this.height, 10);

        graphics.noStroke();
        graphics.fill(255, 255, 255, Math.min(255, this.fadeAlpha * 1.2));
        graphics.textAlign(CENTER, TOP);
        graphics.textSize(Math.max(8, Math.round(9.2 * this.scale)));
        graphics.text(this.mode === 'roster' ? 'Battle Journal' : 'Butterfly Journal', this.x + this.width / 2, this.y + 10 * this.scale);

        this.drawFilterButton(graphics);
        this.drawTabButtons(graphics);

        if (this.mode === 'roster') {
            this.drawRosterPage(graphics);
        } else if (!pages.length) {
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(Math.max(7, Math.round(7.6 * this.scale)));
            graphics.fill(210, 220, 228, Math.min(255, this.fadeAlpha));
            graphics.text('No journal entries match the current filter.', this.x + this.width / 2, this.y + this.height / 2);
        } else {
            const page = this.getCurrentPage();
            if (page?.kind === 'base') {
                this.drawBasePage(graphics, page.type);
            } else if (page?.kind === 'hybrid') {
                this.drawHybridPage(graphics, page.entry);
            }
        }

        this.drawNavigationArrows(graphics);

        graphics.textAlign(CENTER, BOTTOM);
        if (this.mode === 'roster') {
            graphics.textSize(6.5 * this.scale);
            graphics.fill(255, 255, 200, Math.min(255, this.fadeAlpha));
            graphics.text(`Roster ${rosterEntries.length} living`, this.x + this.width / 2, this.y + this.height - 6 * this.scale);
            graphics.textSize(5 * this.scale);
            graphics.fill(200, 200, 200, Math.min(255, this.fadeAlpha * 0.85));
            graphics.text(`${Math.min(this.currentRosterIndex + 1, Math.max(1, rosterEntries.length))} / ${Math.max(1, rosterEntries.length)}`, this.x + this.width / 2, this.y + this.height - 16 * this.scale);
        } else {
            const footerWildTypes = this.butterflyOrder.filter(type => type !== 'golden').length;
            const footerHybridCount = (gameCore.gameState.hybridJournal || []).length;
            graphics.textSize(6.5 * this.scale);
            graphics.fill(255, 255, 200, Math.min(255, this.fadeAlpha));
            graphics.text(`${footerWildTypes} Wild Types | ${footerHybridCount} Hybrids`, this.x + this.width / 2, this.y + this.height - 6 * this.scale);
            graphics.textSize(5 * this.scale);
            graphics.fill(200, 200, 200, Math.min(255, this.fadeAlpha * 0.85));
            graphics.text(`${pages.length ? this.currentIndex + 1 : 0} / ${Math.max(1, pages.length)}`, this.x + this.width / 2, this.y + this.height - 16 * this.scale);
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
