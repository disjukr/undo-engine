export default class Engine {
    static async new() {
        let engine = new Engine();
        engine.undoStack = [];
        engine.redoStack = [];
        return engine;
    }
    async do(action, rollback, amend, user) {
        if (!(rollback instanceof Function))
            throw new Error('command pattern always require rollback function');
        if (user !== undefined)
            throw new Error('single user only');
        this.redoStack = [];
        if (amend && last(this.undoStack) !== undefined) {
            last(this.undoStack).push(action, rollback);
        } else {
            this.undoStack.push(new Transaction(action, rollback));
        }
        await action();
    }
    async undo(user) {
        if (user !== undefined)
            throw new Error('single user only');
        let transaction = this.undoStack.pop();
        if (transaction === undefined) {
            throw new Error('can\'t undo');
        } else {
            await transaction.rollback();
            this.redoStack.push(transaction);
        }
    }
    async redo(user) {
        if (user !== undefined)
            throw new Error('single user only');
        let transaction = this.redoStack.pop();
        if (transaction === undefined) {
            throw new Error('can\'t redo');
        } else {
            await transaction.execute();
            this.undoStack.push(transaction);
        }
    }
}

function last(array) {
    return array[array.length - 1];
}

class Command {
    constructor(action, rollback) {
        this.action = action;
        this.rollback = rollback;
    }
}

class Transaction {
    constructor(action, rollback) {
        this.commands = [];
        this.push(action, rollback);
    }
    push(action, rollback) {
        this.commands.push(new Command(action, rollback));
    }
    async execute() {
        for (let command of this.commands) {
            await command.action();
        }
    }
    async rollback() {
        for (let command of this.commands.concat().reverse()) {
            await command.rollback();
        }
    }
}
