// engine
import CommandPattern from '../impl/command-pattern';
import MementoPattern from '../impl/memento-pattern';
import OneSnapshotAndReplay from '../impl/one-snapshot-and-replay';

// spec
import testBasic from '../spec/basic';
import testAmend from '../spec/amend';
import testRollbackIsOptional from '../spec/rollback-is-optional';
import testMultiUser from '../spec/multi-user';

describe('command pattern', () => {
    it('basic', async () => {
        await testBasic(CommandPattern);
    });
    it('amend', async () => {
        await testAmend(CommandPattern);
    });
});

describe('memento pattern', () => {
    it('basic', async () => {
        await testBasic(MementoPattern);
    });
    it('amend', async () => {
        await testAmend(MementoPattern);
    });
    it('rollback is optional', async () => {
        await testRollbackIsOptional(MementoPattern);
    });
});

describe('one snapshot and replay', () => {
    it('basic', async () => {
        await testBasic(OneSnapshotAndReplay);
    });
    it('amend', async () => {
        await testAmend(OneSnapshotAndReplay);
    });
    it('rollback is optional', async () => {
        await testRollbackIsOptional(OneSnapshotAndReplay);
    });
    it('multi user', async () => {
        await testMultiUser(OneSnapshotAndReplay);
    });
});
