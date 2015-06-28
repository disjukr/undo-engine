import assert from 'assert';

import AddMachine from './machine/AddMachine';

export default async function (Engine) {
    let machine = new AddMachine();
    let engine = await Engine.new(machine);
    await engine.do(::machine.add, ::machine.sub);
    assert.equal(machine.state, 1);
    await engine.undo();
    assert.equal(machine.state, 0);
    await engine.redo();
    assert.equal(machine.state, 1);
    await engine.do(::machine.sub);
    assert.equal(machine.state, 0);
    await engine.undo();
    assert.equal(machine.state, 1);
    await engine.undo();
    assert.equal(machine.state, 0);
}
