class JournalDomPanel {
    constructor(actionDispatcher = null) {
        this.actionDispatcher = actionDispatcher;
        this.root = null;
        this.headerTitle = null;
        this.headerSubtitle = null;
        this.tabRow = null;
        this.toolbar = null;
        this.body = null;
        this.footer = null;
    }

    mount(container) {
        if (this.root) return this.root;
        const root = document.createElement('section');
        root.className = 'shell-panel shell-journal-panel';
        root.dataset.panel = 'journal';

        const header = document.createElement('div');
        header.className = 'shell-header';
        this.headerTitle = document.createElement('div');
        this.headerTitle.className = 'shell-title';
        this.headerSubtitle = document.createElement('div');
        this.headerSubtitle.className = 'shell-subtitle';
        header.appendChild(this.headerTitle);
        header.appendChild(this.headerSubtitle);

        this.tabRow = document.createElement('div');
        this.tabRow.className = 'shell-action-row';

        this.toolbar = document.createElement('div');
        this.toolbar.className = 'shell-action-row';

        this.body = document.createElement('div');
        this.body.className = 'shell-body-scroll';

        this.footer = document.createElement('div');
        this.footer.className = 'shell-footer-row';

        root.appendChild(header);
        root.appendChild(this.tabRow);
        root.appendChild(this.toolbar);
        root.appendChild(this.body);
        root.appendChild(this.footer);
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
        this.headerTitle.textContent = state.title || 'Journal';
        this.headerSubtitle.textContent = state.subtitle || 'Butterfly archive';
        this.renderTabs(state);
        this.renderToolbar(state);
        this.renderBody(state);
        this.renderFooter(state);
    }

    renderTabs(state) {
        this.tabRow.replaceChildren();
        for (const tab of state.tabs || []) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'shell-button';
            if (tab.active) button.classList.add('is-active');
            button.textContent = tab.label || tab.id || 'Tab';
            button.addEventListener('click', () => {
                this.dispatch({ panel: 'journal', action: 'setMode', mode: tab.id });
            });
            this.tabRow.appendChild(button);
        }
    }

    renderToolbar(state) {
        this.toolbar.replaceChildren();
        const addButton = (label, payload, active = false) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'shell-button';
            if (active) button.classList.add('is-active');
            button.textContent = label;
            button.addEventListener('click', () => this.dispatch(payload));
            this.toolbar.appendChild(button);
        };

        addButton('◀', { panel: 'journal', action: 'navigateLeft' }, false);
        addButton('▶', { panel: 'journal', action: 'navigateRight' }, false);

        if (state.mode === 'collection') {
            addButton(state.filterLabel || 'Hybrids', { panel: 'journal', action: 'toggleHybridOnly' }, !!state.hybridOnly);
            if (state.canRenameHybrid) {
                addButton('Rename', { panel: 'journal', action: 'renameCurrentHybrid' });
            }
        }

        if (state.mode === 'roster' && state.rosterAction) {
            addButton(state.rosterAction.toggleLabel || 'Toggle Roster', { panel: 'journal', action: 'toggleRosterMember' });
            addButton(state.rosterAction.battleLabel || 'Open Battle', { panel: 'journal', action: 'openBattle' });
        }
    }

    renderBody(state) {
        this.body.replaceChildren();
        if (state.emptyLabel) {
            const empty = document.createElement('div');
            empty.className = 'shell-empty';
            empty.textContent = state.emptyLabel;
            this.body.appendChild(empty);
            return;
        }

        const page = state.page || null;
        if (!page) {
            const empty = document.createElement('div');
            empty.className = 'shell-empty';
            empty.textContent = 'No journal page available.';
            this.body.appendChild(empty);
            return;
        }

        const hero = document.createElement('div');
        hero.className = 'shell-hero-card';
        const title = document.createElement('div');
        title.className = 'shell-title';
        title.textContent = page.title || 'Journal page';
        hero.appendChild(title);
        if (page.eyebrow) {
            const eyebrow = document.createElement('div');
            eyebrow.className = 'shell-subtitle';
            eyebrow.textContent = page.eyebrow;
            hero.appendChild(eyebrow);
        }
        if (Array.isArray(page.chips) && page.chips.length) {
            const chips = document.createElement('div');
            chips.className = 'shell-chip-row';
            for (const chipLabel of page.chips) {
                const chip = document.createElement('div');
                chip.className = 'shell-chip';
                chip.textContent = chipLabel;
                chips.appendChild(chip);
            }
            hero.appendChild(chips);
        }
        this.body.appendChild(hero);

        const sectionList = document.createElement('div');
        sectionList.className = 'shell-section-list';
        for (const section of page.sections || []) {
            const card = document.createElement('section');
            card.className = 'shell-section-card';
            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'shell-section-title';
            sectionTitle.textContent = section.title || 'Section';
            card.appendChild(sectionTitle);
            for (const line of section.lines || []) {
                const row = document.createElement('div');
                row.className = 'shell-section-line';
                row.textContent = line;
                card.appendChild(row);
            }
            sectionList.appendChild(card);
        }
        this.body.appendChild(sectionList);
    }

    renderFooter(state) {
        this.footer.replaceChildren();
        const label = document.createElement('div');
        label.className = 'shell-footer-label';
        label.textContent = state.indexLabel || state.subtitle || '';
        this.footer.appendChild(label);
    }

    unmount() {
        if (!this.root) return;
        this.root.remove();
        this.root = null;
        this.headerTitle = null;
        this.headerSubtitle = null;
        this.tabRow = null;
        this.toolbar = null;
        this.body = null;
        this.footer = null;
    }

    applyRect(element, rect) {
        const { x = 0, y = 0, width = 320, height = 360 } = rect || {};
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
