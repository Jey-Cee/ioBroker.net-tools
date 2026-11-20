'use strict';

const assert = require('node:assert');
const { describe, it } = require('mocha');
const fs = require('node:fs');
const path = require('node:path');
const { COMMANDS, HELP } = require('../lib/help');

/** The commands which `onMessage` of main.js answers */
function commandsOfMain() {
    const source = fs.readFileSync(path.join(__dirname, '../main.js'), 'utf8');
    const start = source.indexOf('    async onMessage(obj) {');
    const end = source.indexOf('    scheduleDeviceListUpdate() {');
    assert.ok(start > 0 && end > start, 'onMessage found');
    const handler = source.slice(start, end);
    return [
        ...[...handler.matchAll(/obj\.command === '([^']+)'/g)].map(m => m[1]),
        ...[...handler.matchAll(/case '([^']+)':/g)].map(m => m[1]),
    ];
}

/** The commands which the Device Manager of dm-utils answers */
function commandsOfDeviceManager() {
    const file = require.resolve('@iobroker/dm-utils/build/DeviceManagement.js');
    return [...fs.readFileSync(file, 'utf8').matchAll(/case '(dm:[^']+)':/g)].map(m => m[1]);
}

describe('Message help', () => {
    it('lists exactly the commands onMessage and the Device Manager answer, each once', () => {
        const names = COMMANDS.map(c => c.command);
        assert.strictEqual(new Set(names).size, names.length);
        const answered = [...commandsOfMain(), ...commandsOfDeviceManager()];
        assert.deepStrictEqual([...names].sort(), answered.sort());
    });

    it('marks the commands with an effect as writing', () => {
        const writing = [
            'wake',
            'wol',
            'addDevice',
            'deleteDevice',
            'updateDevice',
            'dm:instanceAction',
            'dm:deviceAction',
            'dm:deviceControl',
            'dm:actionProgress',
        ];
        for (const { command, write } of COMMANDS) {
            assert.strictEqual(write, writing.includes(command), command);
        }
    });

    it('names every command', () => {
        for (const { command } of COMMANDS.filter(c => c.command !== 'help')) {
            assert.ok(HELP.includes(command), command);
        }
        assert.ok(HELP.includes('sendTo net-tools.0'));
    });

    it('keeps the lines short', () => {
        for (const line of HELP.split('\n')) {
            assert.ok(line.length <= 120, line);
        }
    });
});
