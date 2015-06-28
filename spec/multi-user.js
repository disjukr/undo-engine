import assert from 'assert';
import throws from './util/throws';

import PushMachine from './machine/PushMachine';

export default async function (Engine) {
    let machine = new PushMachine();
    let engine = await Engine.new(machine);
    let userA = new User('A', machine, engine);
    let userB = new User('B', machine, engine);
    await userA.action();
    assert.equal(machine.state + '', 'A');
    await userB.action();
    assert.equal(machine.state + '', 'A,B');
    await engine.undo(userA);
    assert.equal(machine.state + '', 'B');
    await engine.redo(userA);
    assert.equal(machine.state + '', 'A,B');
    await engine.undo(userB);
    assert.equal(machine.state + '', 'A');
    await engine.redo(userB);
    assert.equal(machine.state + '', 'A,B');
    await engine.undo();
    assert.equal(machine.state + '', 'A');
    await engine.redo();
    assert.equal(machine.state + '', 'A,B');
    await engine.undo(userA);
    await engine.undo(userB);
    assert.equal(machine.state + '', '');
    await engine.do(machine.push.bind(machine, 'global'), ::machine.pop);
    assert.equal(machine.state + '', 'global');
    await throws(engine.redo.bind(engine, userA));
    await throws(engine.redo.bind(engine, userB));
    assert.equal(machine.state + '', 'global');
    await userA.action();
    assert.equal(machine.state + '', 'global,A');
    await userB.action();
    assert.equal(machine.state + '', 'global,A,B');
    await engine.undo(userA);
    assert.equal(machine.state + '', 'global,B');
    await engine.redo();
    assert.equal(machine.state + '', 'global,A,B');
}

class User {
    constructor(name, machine, engine) {
        this.name = name;
        this.machine = machine;
        this.engine = engine;
    }
    async action() {
        await this.engine.do(
            this.machine.push.bind(this.machine, this.name),
            ::this.machine.pop,
            false,
            this
        );
    }
}
