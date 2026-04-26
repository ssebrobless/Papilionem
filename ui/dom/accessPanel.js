class AccessDomPanel {
    constructor(actionDispatcher = null) {
        this.actionDispatcher = actionDispatcher;
        this.root = null;
        this.list = null;
        this.sliderValue = null;
        this.sliderInput = null;
    }

    mount(container) {
        if (this.root) return this.root;
        const root = document.createElement('section');
        root.className = 'shell-panel shell-access-panel';
        root.dataset.panel = 'access';

        const header = document.createElement('div');
        header.className = 'shell-header';
        const title = document.createElement('div');
        title.className = 'shell-title';
        title.textContent = 'Access';
        const subtitle = document.createElement('div');
        subtitle.className = 'shell-subtitle';
        subtitle.textContent = 'Presentation only';
        header.appendChild(title);
        header.appendChild(subtitle);

        this.list = document.createElement('div');
        this.list.className = 'shell-access-list';

        const sliderRow = document.createElement('div');
        sliderRow.className = 'shell-slider-row';
        this.sliderInput = document.createElement('input');
        this.sliderInput.type = 'range';
        this.sliderInput.min = '0.75';
        this.sliderInput.max = '1.25';
        this.sliderInput.step = '0.01';
        this.sliderInput.addEventListener('input', () => {
            this.dispatch({
                panel: 'access',
                action: 'setUiScale',
                value: Number(this.sliderInput.value || 1)
            });
        });
        this.sliderValue = document.createElement('div');
        this.sliderValue.className = 'shell-slider-value';
        sliderRow.appendChild(this.sliderInput);
        sliderRow.appendChild(this.sliderValue);

        root.appendChild(header);
        root.appendChild(this.list);
        root.appendChild(sliderRow);
        container.appendChild(root);
        this.root = root;
        return root;
    }

    unmount() {
        if (!this.root) return;
        this.root.remove();
        this.root = null;
        this.list = null;
        this.sliderValue = null;
        this.sliderInput = null;
    }

    update(state = {}) {
        if (!state.visible) {
            this.unmount();
            return;
        }
        const root = this.mount(state.container);
        root.classList.toggle('is-high-contrast', !!state.highContrast);
        this.applyRect(root, state.rect);
        this.renderControls(state.controls || []);
        if (this.sliderInput) {
            this.sliderInput.value = `${state.uiScale ?? 1}`;
        }
        if (this.sliderValue) {
            this.sliderValue.textContent = `${Math.round((state.uiScale ?? 1) * 100)}%`;
        }
    }

    renderControls(controls) {
        this.list.replaceChildren();
        for (const control of controls) {
            const row = document.createElement('div');
            row.className = 'shell-access-item';

            const label = document.createElement('div');
            label.className = 'shell-access-label';
            label.textContent = control.label || control.id || 'Control';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'shell-button';
            button.textContent = control.value || 'Toggle';
            button.addEventListener('click', () => {
                this.dispatch({
                    panel: 'access',
                    action: 'control',
                    controlId: control.id
                });
            });

            row.appendChild(label);
            row.appendChild(button);
            this.list.appendChild(row);
        }
    }

    applyRect(element, rect) {
        const { x = 0, y = 0, width = 180, height = 220 } = rect || {};
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
