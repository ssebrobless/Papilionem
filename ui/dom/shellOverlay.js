class ShellDomOverlay {
    constructor() {
        this.root = null;
        this.initialized = false;
        this.panels = {};
        this.panelSignatures = new Map();
        this.lastAnyVisible = null;
        this.actionDispatcher = payload => {
            if (typeof eventBus !== 'undefined') {
                eventBus.emit('ui:domAction', payload || {});
            }
        };
    }

    initialize() {
        if (this.initialized) return;
        this.root = document.getElementById('shell-overlay') || null;
        if (!this.root) return;
        this.panels = {
            feed: new FeedDomPanel(this.actionDispatcher),
            access: new AccessDomPanel(this.actionDispatcher),
            inspect: new InspectDomPanel(this.actionDispatcher),
            journal: new JournalDomPanel(this.actionDispatcher),
            debug: new DebugDomPanel(this.actionDispatcher),
            guide: new GuideDomPanel(this.actionDispatcher)
        };
        this.root.addEventListener('wheel', event => this.handleWheel(event), { passive: false });
        this.initialized = true;
    }

    hideAll() {
        this.initialize();
        if (!this.root) return;
        this.root.classList.add('is-hidden');
        for (const panel of Object.values(this.panels)) {
            panel?.unmount?.();
        }
        this.panelSignatures.clear();
        this.lastAnyVisible = false;
    }

    update(state = {}) {
        this.initialize();
        if (!this.root) return;
        const anyVisible = !!(
            state.feed?.visible
            || state.access?.visible
            || state.inspect?.visible
            || state.journal?.visible
            || state.debug?.visible
            || state.guide?.visible
        );
        if (this.lastAnyVisible !== anyVisible) {
            this.root.classList.toggle('is-hidden', !anyVisible);
            this.lastAnyVisible = anyVisible;
        }
        const container = this.root;
        this.updatePanel('feed', state.feed, container);
        this.updatePanel('access', state.access, container);
        this.updatePanel('inspect', state.inspect, container);
        this.updatePanel('journal', state.journal, container);
        this.updatePanel('debug', state.debug, container);
        this.updatePanel('guide', state.guide, container);
    }

    updatePanel(id, rawState = {}, container) {
        const panel = this.panels[id];
        if (!panel) return;
        const state = rawState || { visible: false };
        const signature = this.buildSignature(state);
        const lastSignature = this.panelSignatures.get(id);
        if (lastSignature === signature) {
            return;
        }
        this.panelSignatures.set(id, signature);
        panel.update?.({ ...state, container });
    }

    buildSignature(state = {}) {
        const serializable = {};
        for (const [key, value] of Object.entries(state)) {
            if (key === 'container') continue;
            serializable[key] = value;
        }
        try {
            return JSON.stringify(serializable);
        } catch (_error) {
            return `${serializable.visible ? 'visible' : 'hidden'}:${Date.now()}`;
        }
    }

    handleWheel(event) {
        if (!event || !this.root || this.root.classList.contains('is-hidden')) return;
        const panel = this.getPanelForWheelTarget(event.target);
        if (!panel) return;

        const scroller = this.getScrollerForPanel(event.target, panel);
        const deltaY = this.getWheelDeltaY(event);
        if (scroller && Number.isFinite(deltaY) && deltaY !== 0) {
            scroller.scrollTop += deltaY;
        }
        event.preventDefault?.();
        event.stopPropagation?.();
    }

    getPanelForWheelTarget(target) {
        if (!target?.closest) return null;
        const panel = target.closest('.shell-panel');
        return panel && this.root?.contains(panel) ? panel : null;
    }

    getScrollerForPanel(target, panel) {
        const visited = new Set();
        let node = target;
        while (node && node !== panel.parentElement) {
            if (this.isScrollableElement(node)) {
                return node;
            }
            visited.add(node);
            if (node === panel) break;
            node = node.parentElement;
        }

        const selectors = [
            '.shell-feed-list',
            '.shell-body-scroll',
            '.shell-access-list',
            '.shell-debug-status'
        ];
        for (const selector of selectors) {
            const candidate = panel.querySelector?.(selector);
            if (candidate && !visited.has(candidate) && this.isScrollableElement(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    isScrollableElement(element) {
        if (!element || element.nodeType !== 1) return false;
        const style = typeof getComputedStyle === 'function' ? getComputedStyle(element) : null;
        const overflowY = style?.overflowY || '';
        if (!/(auto|scroll|overlay)/.test(overflowY)) return false;
        return (element.scrollHeight || 0) > (element.clientHeight || 0) + 1;
    }

    getWheelDeltaY(event) {
        const raw = Number(event.deltaY ?? 0);
        if (!Number.isFinite(raw) || raw === 0) return 0;
        if (event.deltaMode === 1) return raw * 16;
        if (event.deltaMode === 2) return raw * 240;
        return raw;
    }
}

const shellDomOverlay = new ShellDomOverlay();
