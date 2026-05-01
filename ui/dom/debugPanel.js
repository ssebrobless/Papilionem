class DebugDomPanel {
    constructor(actionDispatcher = null) {
        this.actionDispatcher = actionDispatcher;
        this.root = null;
        this.headerTitle = null;
        this.headerSubtitle = null;
        this.statusBody = null;
        this.buttonGrid = null;
        this.focusBody = null;
    }

    mount(container) {
        if (this.root) return this.root;
        const root = document.createElement('section');
        root.className = 'shell-panel shell-debug-panel';
        root.dataset.panel = 'debug';
        root.addEventListener('wheel', event => this.handlePanelWheel(event), { passive: false });

        const header = document.createElement('div');
        header.className = 'shell-header';
        this.headerTitle = document.createElement('div');
        this.headerTitle.className = 'shell-title';
        this.headerSubtitle = document.createElement('div');
        this.headerSubtitle.className = 'shell-subtitle';
        header.appendChild(this.headerTitle);
        header.appendChild(this.headerSubtitle);

        this.statusBody = document.createElement('div');
        this.statusBody.className = 'shell-body-scroll shell-debug-status';

        this.buttonGrid = document.createElement('div');
        this.buttonGrid.className = 'shell-debug-grid';

        this.focusBody = document.createElement('div');
        this.focusBody.className = 'shell-footer-row';

        root.appendChild(header);
        root.appendChild(this.statusBody);
        root.appendChild(this.buttonGrid);
        root.appendChild(this.focusBody);
        container.appendChild(root);
        this.root = root;
        return root;
    }

    handlePanelWheel(event) {
        if (!this.statusBody) return;
        const rawDelta = Number(event?.deltaY ?? 0);
        if (!Number.isFinite(rawDelta) || rawDelta === 0) return;
        const deltaY = event.deltaMode === 1
            ? rawDelta * 16
            : event.deltaMode === 2
                ? rawDelta * 240
                : rawDelta;
        this.statusBody.scrollTop += deltaY;
        event.preventDefault?.();
        event.stopPropagation?.();
    }

    update(state = {}) {
        if (!state.visible) {
            this.unmount();
            return;
        }
        const root = this.mount(state.container);
        root.classList.toggle('is-high-contrast', !!state.highContrast);
        root.classList.toggle(`tone-${state.statusTone || 'idle'}`, true);
        this.applyRect(root, state.rect);
        this.headerTitle.textContent = state.title || 'Debug';
        this.headerSubtitle.textContent = state.subtitle || 'Local-only test actions';
        this.renderStatus(state);
        this.renderButtons(state.buttons || []);
        this.renderFocus(state.spatialFocus);
    }

    renderStatus(state) {
        this.statusBody.replaceChildren();
        const intro = document.createElement('div');
        intro.className = 'shell-section-card';
        const detail = document.createElement('div');
        detail.className = 'shell-section-line';
        detail.textContent = state.detailLine || '';
        intro.appendChild(detail);
        for (const line of state.statusLines || []) {
            const row = document.createElement('div');
            row.className = 'shell-section-line';
            row.textContent = line;
            intro.appendChild(row);
        }
        this.statusBody.appendChild(intro);
    }

    renderButtons(buttons) {
        this.buttonGrid.replaceChildren();
        for (const buttonState of buttons) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'shell-button';
            button.textContent = buttonState.text || buttonState.id || 'Action';
            button.disabled = !!buttonState.disabled;
            button.addEventListener('click', () => {
                this.dispatch({
                    panel: 'debug',
                    action: 'invoke',
                    actionId: buttonState.id
                });
            });
            this.buttonGrid.appendChild(button);
        }
    }

    renderFocus(spatialFocus) {
        this.focusBody.replaceChildren();
        if (!spatialFocus?.lines?.length) return;
        const card = document.createElement('div');
        card.className = 'shell-section-card';
        const title = document.createElement('div');
        title.className = 'shell-section-title';
        title.textContent = spatialFocus.title || 'Spatial Focus';
        card.appendChild(title);
        for (const line of spatialFocus.lines || []) {
            const row = document.createElement('div');
            row.className = 'shell-section-line';
            row.textContent = line;
            card.appendChild(row);
        }
        this.focusBody.appendChild(card);
    }

    unmount() {
        if (!this.root) return;
        this.root.remove();
        this.root = null;
        this.headerTitle = null;
        this.headerSubtitle = null;
        this.statusBody = null;
        this.buttonGrid = null;
        this.focusBody = null;
    }

    applyRect(element, rect) {
        const { x = 0, y = 0, width = 420, height = 180 } = rect || {};
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
