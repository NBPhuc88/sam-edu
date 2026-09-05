import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
function load(path) {
    const exports = {};
    const source = readFileSync(new URL(`../../resources/js/pages/GameRooms/${path}.ts`, import.meta.url), 'utf8');
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, Promise, String });
    return exports;
}
const { initialGameAnswer } = load('game-answer');
const { createSyncCoordinator } = load('sync-coordinator');
test('ordering can submit the initial displayed order without dragging', () => {
    for (const options of [[{ id: 'b' }, { id: 'a' }], { items: [{ id: 'b' }, { id: 'a' }] }]) {
        assert.deepEqual(Array.from(initialGameAnswer({ question_type: 9, options })), ['b', 'a']);
    }
    assert.deepEqual(Array.from(initialGameAnswer({ question_type: 9, options: ['one', 'two'] })), ['1', '2']);
    assert.equal(initialGameAnswer({ question_type: 1, options: [] }), null);
});
test('overlapping refresh callers wait for the queued latest response', async () => {
    const releases = []; let runs = 0; let finished = false;
    const refresh = createSyncCoordinator(() => { runs++; return new Promise(resolve => releases.push(resolve)); });
    const first = refresh(); await Promise.resolve();
    const second = refresh(); const third = refresh();
    assert.equal(first, second); assert.equal(second, third); assert.equal(runs, 1);
    second.then(() => { finished = true; });
    releases.shift()(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(runs, 2); assert.equal(finished, false);
    releases.shift()(); await first; assert.equal(finished, true);
});
test('a failed sync releases the lock for a later retry', async () => {
    let attempts = 0;
    const refresh = createSyncCoordinator(async () => { if (++attempts === 1) throw new Error('offline'); });
    await assert.rejects(refresh(), /offline/); await refresh(); assert.equal(attempts, 2);
});
