class InspectDomPanel {
    constructor(actionDispatcher = null) {
        this.actionDispatcher = actionDispatcher;
        this.root = null;
        this.headerTitle = null;
        this.headerSubtitle = null;
        this.primaryActions = null;
        this.secondaryActions = null;
        this.body = null;
    }

    mount(container) {
        if (this.root) return this.root;
        const root = document.createElement('section');
        root.className = 'shell-panel shell-inspect-panel';
        root.dataset.panel = 'inspect';

        const header = document.createElement('div');
        header.className = 'shell-header';
        this.headerTitle = document.createElement('div');
        this.headerTitle.className = 'shell-title';
        this.headerSubtitle = document.createElement('div');
        this.headerSubtitle.className = 'shell-subtitle';
        header.appendChild(this.headerTitle);
        header.appendChild(this.headerSubtitle);

        this.primaryActions = document.createElement('div');
        this.primaryActions.className = 'shell-action-row';

        this.secondaryActions = document.createElement('div');
        this.secondaryActions.className = 'shell-action-row';

        this.body = document.createElement('div');
        this.body.className = 'shell-body-scroll';

        root.appendChild(header);
        root.appendChild(this.primaryActions);
        root.appendChild(this.secondaryActions);
        root.appendChild(this.body);
        container.appendChild(root);
        this.root = root;
        return root;
    }

    update(state = {}) {
        if (!state.visible) {
            this.unmount();
            return;
        }
        const root = this.mount(state.container);
        root.classList.toggle('is-high-contrast', !!state.highContrast);
        this.applyRect(root, state.rect);
        this.headerTitle.textContent = state.title || 'Inspect';
        this.headerSubtitle.textContent = state.subtitle || 'Butterfly detail';

        this.renderActions(state);
        this.renderBody(state);
    }

    renderActions(state) {
        this.primaryActions.replaceChildren();
        this.secondaryActions.replaceChildren();

        const addButton = (targetRow, label, payload, active = false) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'shell-button';
            if (active) button.classList.add('is-active');
            button.textContent = label;
            button.addEventListener('click', () => this.dispatch(payload));
            targetRow.appendChild(button);
        };

        if (state.mode === 'browse') {
            addButton(this.primaryActions, 'All', { panel: 'inspect', action: 'toggleBrowseScope' }, !!state.browseAll);
            addButton(this.primaryActions, 'Release', { panel: 'inspect', action: 'enterReleaseMode' });
            return;
        }

        if (state.mode === 'release') {
            addButton(this.primaryActions, 'Cancel', { panel: 'inspect', action: 'cancelReleaseMode' });
            addButton(this.primaryActions, state.selectedCount > 0 ? `Confirm ${state.selectedCount}` : 'Release', { panel: 'inspect', action: 'confirmReleaseMode' }, state.selectedCount > 0);
            return;
        }

        if (state.mode === 'mates') {
            addButton(this.primaryActions, 'Stop', { panel: 'inspect', action: 'toggleMateMode' }, true);
            addButton(this.primaryActions, 'List', { panel: 'inspect', action: 'clearSelection' });
            return;
        }

        if (state.mode === 'detail') {
            addButton(this.primaryActions, 'All', { panel: 'inspect', action: 'toggleBrowseScope' }, !!state.browseAll);
            addButton(this.primaryActions, 'List', { panel: 'inspect', action: 'clearSelection' });
            addButton(this.primaryActions, 'Release', { panel: 'inspect', action: 'enterReleaseMode' });
            addButton(this.secondaryActions, state.rostered ? 'Leave' : 'Roster', { panel: 'inspect', action: 'toggleRoster' }, !!state.rostered);
            addButton(this.secondaryActions, state.isMateArmed ? 'Stop' : 'Mate', { panel: 'inspect', action: 'toggleMateMode' }, !!state.isMateArmed);
        }
    }

    renderBody(state) {
        this.body.replaceChildren();
        if (state.mode === 'browse' || state.mode === 'release' || state.mode === 'mates') {
            this.renderEntryList(state);
            return;
        }

        if (state.mode === 'detail' && state.detailState) {
            const hero = document.createElement('div');
            hero.className = 'shell-hero-card';
            for (const line of state.detailState.heroLines || []) {
                const row = document.createElement('div');
                row.className = 'shell-hero-line';
                row.textContent = line;
                hero.appendChild(row);
            }
            this.body.appendChild(hero);
            const feelings = state.detailState.cognition?.feelings || null;
            if (feelings) {
                this.body.appendChild(this.renderFeelingRow(feelings, state.detailState.cognition?.strongestFeeling || 'steady'));
            }

            const sectionList = document.createElement('div');
            sectionList.className = 'shell-section-list';
            for (const section of state.detailState.sections || []) {
                const card = document.createElement('section');
                card.className = 'shell-section-card';
                const title = document.createElement('div');
                title.className = 'shell-section-title';
                title.textContent = section.title || 'Section';
                card.appendChild(title);
                for (const line of section.lines || []) {
                    const row = document.createElement('div');
                    row.className = 'shell-section-line';
                    row.textContent = line;
                    card.appendChild(row);
                }
                sectionList.appendChild(card);
            }
            this.body.appendChild(sectionList);
            return;
        }

        const empty = document.createElement('div');
        empty.className = 'shell-empty';
        empty.textContent = 'No inspect data available.';
        this.body.appendChild(empty);
    }

    renderFeelingRow(feelings, strongestFeeling = 'steady') {
        const wrap = document.createElement('div');
        wrap.className = 'shell-chip-row shell-inspect-feeling-row';
        wrap.dataset.cognitionFeelings = 'true';
        const labels = [
            ['loneliness', 'lonely'],
            ['comfortSeeking', 'comfort'],
            ['socialInsecurity', 'insecure'],
            ['jealousy', 'jealous'],
            ['grief', 'grief'],
            ['pride', 'pride'],
            ['shame', 'shame'],
            ['loyaltyBias', 'loyal']
        ];
        const strongest = document.createElement('div');
        strongest.className = 'shell-chip';
        strongest.dataset.feelingKey = 'strongestFeeling';
        strongest.textContent = `feeling ${strongestFeeling || 'steady'}`;
        wrap.appendChild(strongest);
        for (const [key, label] of labels) {
            const value = Math.max(0, Math.min(100, Math.round(Number(feelings[key]) || 0)));
            const chip = document.createElement('div');
            chip.className = 'shell-chip';
            chip.dataset.feelingKey = key;
            chip.textContent = `${label} ${value}%`;
            wrap.appendChild(chip);
        }
        return wrap;
    }

    renderEntryList(state) {
        const list = document.createElement('div');
        list.className = 'shell-entry-list';
        const entries = state.entries || [];
        if (!entries.length) {
            const empty = document.createElement('div');
            empty.className = 'shell-empty';
            empty.textContent = 'No butterflies available for this inspect mode.';
            list.appendChild(empty);
        } else {
            for (const entry of entries) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'shell-entry-button';
                if (entry.selected) button.classList.add('is-active');
                const title = document.createElement('div');
                title.className = 'shell-entry-title';
                title.textContent = entry.title || 'Unknown';
                const detail = document.createElement('div');
                detail.className = 'shell-entry-detail';
                detail.textContent = entry.detail || '';
                button.appendChild(title);
                button.appendChild(detail);
                button.addEventListener('click', () => {
                    if (state.mode === 'browse') {
                        this.dispatch({ panel: 'inspect', action: 'selectBrowse', butterflyId: entry.butterflyId });
                    } else if (state.mode === 'release') {
                        this.dispatch({ panel: 'inspect', action: 'toggleReleaseSelection', butterflyId: entry.butterflyId });
                    } else if (state.mode === 'mates') {
                        this.dispatch({ panel: 'inspect', action: 'selectMateCandidate', butterflyId: entry.butterflyId });
                    }
                });
                list.appendChild(button);
            }
        }
        this.body.appendChild(list);
    }

    unmount() {
        if (!this.root) return;
        this.root.remove();
        this.root = null;
        this.headerTitle = null;
        this.headerSubtitle = null;
        this.primaryActions = null;
        this.secondaryActions = null;
        this.body = null;
    }

    applyRect(element, rect) {
        const { x = 0, y = 0, width = 320, height = 280 } = rect || {};
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
    }

    dispatch(payload) {
        if (typeof this.actionDispatcher === 'function') {
            this.actionDispatcher(payload);
        }
    }
}
