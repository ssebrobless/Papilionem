class GuideDomPanel {
    constructor(actionDispatcher = null) {
        this.actionDispatcher = actionDispatcher;
        this.root = null;
        this.headerTitle = null;
        this.headerSubtitle = null;
        this.body = null;
        this.actions = null;
    }

    mount(container) {
        if (this.root) return this.root;
        const root = document.createElement('section');
        root.className = 'shell-panel shell-guide-panel';
        root.dataset.panel = 'guide';

        const header = document.createElement('div');
        header.className = 'shell-header';
        this.headerTitle = document.createElement('div');
        this.headerTitle.className = 'shell-title';
        this.headerSubtitle = document.createElement('div');
        this.headerSubtitle.className = 'shell-subtitle';
        header.appendChild(this.headerTitle);
        header.appendChild(this.headerSubtitle);

        this.body = document.createElement('div');
        this.body.className = 'shell-body-scroll';

        this.actions = document.createElement('div');
        this.actions.className = 'shell-action-row';

        root.appendChild(header);
        root.appendChild(this.body);
        root.appendChild(this.actions);
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
        this.headerTitle.textContent = state.title || 'Quick start';
        this.headerSubtitle.textContent = state.subtitle || '';
        this.renderBody(state.lines || []);
        this.renderActions(state.dismissLabel || 'Dismiss');
    }

    renderBody(lines = []) {
        this.body.replaceChildren();
        const card = document.createElement('section');
        card.className = 'shell-section-card';
        for (const line of lines) {
            const row = document.createElement('div');
            row.className = 'shell-section-line';
            row.textContent = line;
            card.appendChild(row);
        }
        this.body.appendChild(card);
    }

    renderActions(dismissLabel) {
        this.actions.replaceChildren();
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'shell-button';
        button.textContent = dismissLabel;
        button.addEventListener('click', () => this.dispatch({ panel: 'guide', action: 'dismiss' }));
        this.actions.appendChild(button);
    }

    unmount() {
        if (!this.root) return;
        this.root.remove();
        this.root = null;
        this.headerTitle = null;
        this.headerSubtitle = null;
        this.body = null;
        this.actions = null;
    }

    applyRect(element, rect) {
        const { x = 0, y = 0, width = 214, height = 118 } = rect || {};
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
