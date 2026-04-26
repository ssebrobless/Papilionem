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
}

const shellDomOverlay = new ShellDomOverlay();
