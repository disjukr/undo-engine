export default class Engine {
    static async new(machine) {
        let engine = new Engine();
        engine.machine = machine;
        engine.history = new History();
        engine.initialState = await machine.takeSnapshot();
        return engine;
    }
    async do(action, rollback, amend, user) {
        this.history.push(action, user, amend);
        await action();
    }
    async undo(user) {
        this.history.undo(user);
        await this.machine.applySnapshot(this.initialState);
        await this.history.replay();
    }
    async redo(user) {
        this.history.redo(user);
        await this.machine.applySnapshot(this.initialState);
        await this.history.replay();
    }
}

class History {
    constructor() {
        this.i = 0;
        this.firstTransaction = null;
        this.lastTransactionMap = new Map();
        this.lastSkippedTransactionMap = new Map();
    }
    async replay() {
        if (this.firstTransaction) {
            let curr = this.firstTransaction;
            while (curr) {
                if (!curr.skip) await curr.execute();
                curr = curr.globalNext;
            }
        }
    }
    push(action, user, amend) {
        let last = this.lastSkippedTransactionMap.get(user);
        if (last) {
            if (last.localPrev) {
                last = last.localPrev;
            } else {
                this.firstTransaction = null;
            }
        } else {
            last = this.lastTransactionMap.get(user);
        }
        if (amend && last) {
            last.push(action);
        } else {
            let transaction = new Transaction(action, user, this, this.i++);
            if (!this.firstTransaction) this.firstTransaction = transaction;
            if (last && last.localNext)
                last.localNext.cut(user === undefined);
            let globalLast = this.lastSkippedTransactionMap.get(undefined);
            if (globalLast && globalLast.globalPrev)
                globalLast = globalLast.globalPrev;
            this.lastSkippedTransactionMap = new Map();
            if (user !== undefined) {
                let curr = globalLast;
                let first = true;
                while (curr) {
                    if (first) {
                        this.lastSkippedTransactionMap.set(undefined, curr);
                        first = false;
                    }
                    if (curr.skip && !this.lastSkippedTransactionMap.has(curr.user)) {
                        this.lastSkippedTransactionMap.set(curr.user, curr);
                    }
                    curr = curr.globalNext;
                }
            }
            transaction.localPrev = this.lastTransactionMap.get(user);
            transaction.globalPrev = this.lastTransactionMap.get(undefined);
            if (transaction.localPrev) transaction.localPrev.localNext = transaction;
            if (transaction.globalPrev) transaction.globalPrev.globalNext = transaction;
            this.lastTransactionMap.set(user, transaction);
            this.lastTransactionMap.set(undefined, transaction);
        }
    }
    undo(user) {
        let last = this.lastSkippedTransactionMap.get(user);
        last = last ? last.localPrev : this.lastTransactionMap.get(user);
        if (!last) throw new Error('can\'t undo');
        last.skip = true;
        this.lastSkippedTransactionMap.set(user, last);
        let globalLast = this.lastSkippedTransactionMap.get(undefined);
        if (!globalLast || last.i < globalLast.i)
            this.lastSkippedTransactionMap.set(undefined, last);
    }
    redo(user) {
        let last = this.lastSkippedTransactionMap.get(user);
        if (!last) throw new Error('can\'t redo');
        last.skip = false;
        let next = (user === undefined) ? last.globalNext : last.localNext;
        if (user === undefined) {
            this.lastSkippedTransactionMap.set(undefined, next);
        } else {
            let globalLast = this.lastSkippedTransactionMap.get(undefined);
            if (!globalLast || last.i === globalLast.i || next.i < globalLast.i)
                this.lastSkippedTransactionMap.set(undefined, next);
            this.lastSkippedTransactionMap.set(user, next);
        }
    }
}

class Transaction {
    constructor(action, user, history, i) {
        this.actions = [];
        this.user = user;
        this.history = history;
        this.skip = false;
        this.localNext = null;
        this.localPrev = null;
        this.globalNext = null;
        this.globalPrev = null;
        this.i = i;
        this.push(action);
    }
    cut(global) {
        if (!this.skip) return;
        if (this.user === undefined || global) {
            if (this.globalNext) this.globalNext.cut(true);
        } else {
            if (this.localNext) this.localNext.cut();
        }
        if (this.localPrev) this.localPrev.localNext = this.localNext;
        if (this.localNext) this.localNext.localPrev = this.localPrev;
        if (this.globalPrev) this.globalPrev.globalNext = this.globalNext;
        if (this.globalNext) this.globalNext.globalPrev = this.globalPrev;
        this.localNext = null;
        this.localPrev = null;
        this.globalNext = null;
        this.globalPrev = null;
        if (!this.globalPrev) this.history.firstTransaction = null;
        if (this.user === undefined) {
            this.history.lastTransactionMap.set(undefined, this.globalPrev);
        } else {
            this.history.lastTransactionMap.set(this.user, this.localPrev);
            let lastGlobal = this.history.lastTransactionMap.get(undefined);
            if (this.i < lastGlobal.i)
                this.history.lastTransactionMap.set(undefined, this.globalPrev);
        }
    }
    push(action) {
        this.actions.push(action);
    }
    async execute() {
        for (let action of this.actions) {
            await action();
        }
    }
}
