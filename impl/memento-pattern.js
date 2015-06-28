export default class Engine {
    static async new(machine) {
        let engine = new Engine();
        engine.machine = machine;
        engine.history = [await machine.takeSnapshot()];
        engine.current = 0;
        return engine;
    }
    async do(action, rollback, amend, user) {
        if (user !== undefined)
            throw new Error('single user only');
        this.history.splice(this.current + 1, Infinity);
        if (amend && this.current > 0) {
            this.history.pop();
        }
        await action();
        let snapshot = await this.machine.takeSnapshot();
        this.history.push(snapshot);
        this.current = this.history.length - 1;
    }
    async undo(user) {
        if (user !== undefined)
            throw new Error('single user only');
        if (this.current === 0) {
            throw new Error('can\'t undo');
        } else {
            let snapshot = this.history[--this.current];
            await this.machine.applySnapshot(snapshot);
        }
    }
    async redo(user) {
        if (user !== undefined)
            throw new Error('single user only');
        if (this.current === this.history.length - 1) {
            throw new Error('can\'t redo');
        } else {
            let snapshot = this.history[++this.current];
            await this.machine.applySnapshot(snapshot);
        }
    }
}
