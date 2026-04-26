(function (globalScope) {
    class OffloadHost {
        constructor(workerUrl, options = {}) {
            this.workerUrl = workerUrl;
            this.defaultTimeoutMs = Math.max(1, Math.round(options.timeoutMs || 250));
            this.seq = 0;
            this.pending = new Map();
            this.worker = null;
            this.lastError = null;
        }

        isSupported() {
            return typeof Worker === 'function';
        }

        ensureWorker() {
            if (!this.isSupported()) return null;
            if (this.worker) return this.worker;

            const worker = new Worker(this.workerUrl);
            worker.onmessage = (event) => this.handleMessage(event?.data || {});
            worker.onerror = (event) => this.handleWorkerError(event?.message || event?.error || 'worker error');
            this.worker = worker;
            this.lastError = null;
            return worker;
        }

        request(kind, payload = {}, options = {}) {
            const worker = this.ensureWorker();
            if (!worker) {
                return Promise.reject(new Error('worker unavailable'));
            }

            const seq = ++this.seq;
            const timeoutMs = Math.max(1, Math.round(options.timeoutMs || this.defaultTimeoutMs));
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    this.pending.delete(seq);
                    reject(new Error(`${kind} timeout`));
                }, timeoutMs);

                this.pending.set(seq, {
                    resolve,
                    reject,
                    timeoutId
                });

                worker.postMessage({
                    kind,
                    seq,
                    payload
                });
            });
        }

        handleMessage(message) {
            const seq = Number(message?.seq);
            if (!Number.isFinite(seq)) return;
            const pending = this.pending.get(seq);
            if (!pending) return;

            clearTimeout(pending.timeoutId);
            this.pending.delete(seq);

            if (message?.ok === false) {
                pending.reject(new Error(message?.error || 'worker request failed'));
                return;
            }

            pending.resolve(message?.payload ?? null);
        }

        handleWorkerError(error) {
            this.lastError = String(error?.message || error || 'worker error');
            for (const [seq, pending] of this.pending.entries()) {
                clearTimeout(pending.timeoutId);
                pending.reject(new Error(this.lastError));
                this.pending.delete(seq);
            }
            if (this.worker) {
                this.worker.terminate();
                this.worker = null;
            }
        }

        terminate() {
            for (const [seq, pending] of this.pending.entries()) {
                clearTimeout(pending.timeoutId);
                pending.reject(new Error('worker terminated'));
                this.pending.delete(seq);
            }
            if (this.worker) {
                this.worker.terminate();
                this.worker = null;
            }
        }
    }

    globalScope.OffloadHost = OffloadHost;
})(typeof window !== 'undefined' ? window : self);
