export default class {
    constructor() {
        this.state = 0;
    }
    takeSnapshot(part) {
        return this.state;
    }
    applySnapshot(snapshot, part) {
        this.state = snapshot;
    }
    add() {
        ++this.state;
    }
    sub() {
        --this.state;
    }
}
