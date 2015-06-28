export default class {
    constructor() {
        this.state = [];
    }
    takeSnapshot(part) {
        return this.state.concat();
    }
    applySnapshot(snapshot, part) {
        this.state = snapshot.concat();
    }
    push(value) {
        this.state.push(value);
    }
    pop() {
        this.state.pop();
    }
}
