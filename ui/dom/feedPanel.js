class FeedDomPanel {
    constructor(actionDispatcher = null) {
        this.actionDispatcher = actionDispatcher;
        this.root = null;
        this.headerTitle = null;
        this.headerSubtitle = null;
        this.filterRow = null;
        this.list = null;
        this.footerRow = null;
    }

    mount(container) {
        if (this.root) return this.root;
        const root = document.createElement('section');
        root.className = 'shell-panel shell-feed-panel';
        root.dataset.panel = 'feed';

        const header = document.createElement('div');
        header.className = 'shell-header';
        this.headerTitle = document.createElement('div');
        this.headerTitle.className = 'shell-title';
        this.headerSubtitle = document.createElement('div');
        this.headerSubtitle.className = 'shell-subtitle';
        header.appendChild(this.headerTitle);
        header.appendChild(this.headerSubtitle);

        this.filterRow = document.createElement('div');
        this.filterRow.className = 'shell-action-row';

        this.list = document.createElement('div');
        this.list.className = 'shell-feed-list';

        this.footerRow = document.createElement('div');
        this.footerRow.className = 'shell-action-row';

        root.appendChild(header);
        root.appendChild(this.filterRow);
        root.appendChild(this.list);
        root.appendChild(this.footerRow);
        container.appendChild(root);
        this.root = root;
        return root;
    }

    unmount() {
        if (!this.root) return;
        this.root.remove();
        this.root = null;
        this.headerTitle = null;
        this.headerSubtitle = null;
        this.filterRow = null;
        this.list = null;
        this.footerRow = null;
    }

    update(state = {}) {
        if (!state.visible) {
            this.unmount();
            return;
        }
        const root = this.mount(state.container);
        root.classList.toggle('is-high-contrast', !!state.highContrast);
        this.applyRect(root, state.rect);

        this.headerTitle.textContent = 'Feed';
        this.headerSubtitle.textContent = state.contextLabel || 'Live garden';
        this.renderFilters(state.filters || {});
        this.renderEntries(state.entries || []);
        this.renderFooter(state);
    }

    renderFilters(filters) {
        this.filterRow.replaceChildren();
        const descriptors = [
            ['talk', 'Talk'],
            ['action', 'Action'],
            ['learn', 'Learn'],
            ['warning', 'Warning'],
            ['system', 'System']
        ];
        for (const [id, label] of descriptors) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'shell-button';
            if (filters[id] !== false) {
                button.classList.add('is-active');
            }
            button.textContent = label;
            button.addEventListener('click', () => {
                this.dispatch({
                    panel: 'feed',
                    action: 'toggleFilter',
                    filterId: id
                });
            });
            this.filterRow.appendChild(button);
        }
    }

    renderEntries(entries) {
        this.list.replaceChildren();
        if (!entries.length) {
            const empty = document.createElement('div');
            empty.className = 'shell-empty';
            empty.textContent = 'No visible activity for the current feed filters.';
            this.list.appendChild(empty);
            return;
        }

        for (const entry of entries) {
            const card = document.createElement('article');
            card.className = 'shell-feed-entry';
            card.dataset.category = entry.category || 'action';

            if (entry.headline) {
                const headline = document.createElement('div');
                headline.className = 'shell-feed-headline';
                headline.textContent = entry.headline;
                card.appendChild(headline);
            }

            if (entry.detail) {
                const detail = document.createElement('div');
                detail.className = 'shell-feed-detail';
                detail.textContent = entry.detail;
                card.appendChild(detail);
            }

            if (gameConfig?.ui?.feedThreads?.interpretationItalicDom !== false
                && gameConfig?.ui?.feedThreads?.interpretationItalic !== false
                && Array.isArray(entry.threadLines)) {
                for (const line of entry.threadLines) {
                    const heardMeaning = this.formatHeardMeaning(line?.heardMeaning);
                    if (!heardMeaning) continue;
                    const heard = document.createElement('em');
                    heard.className = 'shell-feed-heard-meaning';
                    heard.textContent = `(heard: ${heardMeaning})`;
                    card.appendChild(heard);
                }
            }

            if (entry.footer) {
                const footer = document.createElement('div');
                footer.className = 'shell-feed-footer';
                footer.textContent = entry.footer;
                card.appendChild(footer);
            }

            this.list.appendChild(card);
        }
    }

    formatHeardMeaning(value = '') {
        const text = String(value || '').trim().replace(/\s+/g, ' ');
        if (!text) return '';
        return text.length > 60 ? `${text.slice(0, 57)}...` : text;
    }

    renderFooter(state) {
        this.footerRow.replaceChildren();
        if (state.followLatest === false) {
            const resume = document.createElement('button');
            resume.type = 'button';
            resume.className = 'shell-button';
            resume.textContent = 'Resume latest';
            resume.addEventListener('click', () => {
                this.dispatch({
                    panel: 'feed',
                    action: 'resumeLatest'
                });
            });
            this.footerRow.appendChild(resume);
        }
    }

    applyRect(element, rect) {
        const { x = 0, y = 0, width = 280, height = 220 } = rect || {};
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
