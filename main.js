/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */

'use strict';
const utils       = require('@iobroker/adapter-core'); // Get common adapter utils
const arp         = require('node-arp');
const wol         = require('wol');
const portscanner = require('evilscan');
const ping        = require('./lib/ping');
const adapterName = require('./package.json').name.split('.').pop();
const objects = require('./lib/object_definition').object_definitions;
const oui = require('oui');
let adapter;

let timer      = null;
let stopTimer  = null;
let isStopping = false;
let wolTries = 3;
let wolTimer = null;
let discoverTimeout = null;

const FORBIDDEN_CHARS = /[\]\[*,;'"`<>\\?]/g;

function startAdapter(options) {
    options = options || {};
    Object.assign(options, {name: adapterName});

    adapter = new utils.Adapter(options);

    adapter.on('message', obj => obj && processMessage(obj));

    adapter.on('stateChange', (id, state)  => handleStateChange(id, state));

    adapter.on('ready', () => main(adapter));

    adapter.on('unload', () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        if (stopTimer) {
            clearTimeout(stopTimer);
            stopTimer = null;
        }
        if (wolTimer) {
            clearTimeout(wolTimer);
            wolTimer = null;
        }
        if (discoverTimeout) {
            clearTimeout(discoverTimeout);
            discoverTimeout = null;
        }
        isStopping = true;
    });
    return adapter;
}

async function processMessage(obj) {
    if (!obj || !obj.command) {
        return;
    }

    switch (obj.command) {
        case 'ping': {
            // Try to ping one IP or name
            if (obj.callback && obj.message) {
                ping.probe(obj.message, {log: adapter.log.debug}, (err, result) =>
                    adapter.sendTo(obj.from, obj.command, {result}, obj.callback));
            }
            break;
        }
        case 'getMac': {
            if (obj.callback && obj.message) {
                adapter.sendTo(obj.from, obj.command, await getMac(obj.message), obj.callback);
            }
            break;
        }
        case 'wol': {
            if (obj.callback && obj.message) {
                adapter.sendTo(obj.from, obj.command, await wake(obj.message), obj.callback);
            }
            break;
        }
        case 'deleteDevice': {
            await delDevice(obj.message)
                .then(result => {
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Device deleted', obj.callback);
                })
            break;
        }
        case 'addDevice': {
            await addDevice(obj.message.ip, obj.message.name, obj.message.enabled, obj.message.mac)
                .then(result => {
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Device added', obj.callback);
                })
            break;
        }
    }
}

async function handleStateChange(id, state) {
    let tmp = id.split('.');
    let dp = tmp.pop();
    if (state !== null) {
        switch (dp) {
            case 'discover':
                if (state.val) {
                    discover();
                }
                break;
            case 'wol':
                if (state.val) {
                    let parentId = await getParentId(id);
                    let obj = await adapter.getObjectAsync(parentId);
                    wake(obj.native.mac);
                }
                break;
            case 'scan':
                if (state.val) {
                    let parentId = await getParentId(id);
                    let obj = await adapter.getObjectAsync(parentId);
                    portScan(parentId, obj.native.ip);
                }
                break;
        }
    }
}

/**
 *
 * @param {string} id - object id for host
 * @param {string} ip - ip address like 127.0.0.1
 */
async function portScan(id, ip){
    const alive = await adapter.getStateAsync(id + '.alive');
    if (id === 'localhost' || alive.val === true) {
        adapter.log.info(`Scanning for open ports at ${id}, please wait`);
        await adapter.setStateAsync(id + '.ports', {val: 'Scanning, please wait', ack: true})
        let openPorts = [];
        let options = {
            target: ip,
            port: '0-65535',
            status: 'O', // Timeout, Refused, Open, Unreachable
            banner: false,
            reverse: false
        };

        let scanner = new portscanner(options);

        scanner.on('result', function (data) {
            // fired when item is matching options
            if (data.status !== 'closed (refused)') {
                openPorts.push(JSON.stringify(data.port));
            }

        });

        scanner.on('error', function (err) {
            adapter.log.error(err.toString());
        });

        scanner.on('done', function () {
            // finished !
            adapter.setState(id + '.ports', {val: openPorts, ack: true});
            adapter.log.info('Port scan finished');
        });

        scanner.run();
    } else {
        await adapter.setStateAsync(id + '.ports', {val: `Port scan aborted, device ${id} is not alive`, ack: true})
        adapter.log.info(`Port scan aborted, device ${id} is not alive`);
    }
}

async function getParentId(id){
    let parentId = id.replace(adapter.namespace + '.', '');
    parentId = parentId.replace(/\..*/g, '');
    return adapter.namespace + '.' + parentId;
}

function wake(mac){
    wol.wake(mac, function (err, res) {
        wolTries = wolTries - 1;
        if (err) {
            adapter.log.debug(err);
            wolTries = 3;
        }
        if (wolTries > 0){
            wolTimer = setTimeout(() => {
                wake(mac);
            }, 750)
        } else if (wolTries === 0){
            wolTries = 3;
        }
        adapter.log.debug('Wake on LAN trie ' + (wolTries + 1) + ': ' + res);
    });
}

async function discover(){
    let oldDevices = await adapter.getDevicesAsync();
    let discovery = await adapter.getForeignStateAsync('system.adapter.discovery.0.alive');
    let discoveryEnabled = true;

    if(!discovery.val){
        discoveryEnabled = false;
        await adapter.extendForeignObjectAsync('system.adapter.discovery.0', {
            common: {
                enabled: true
            }
        })
    }
    discoverTimeout = setTimeout( async() => {
    try {
        let result = await adapter.sendToAsync('discovery.0', 'browse', ['ping']);
        if(!discoveryEnabled){
            await adapter.extendForeignObjectAsync('system.adapter.discovery.0', {
                common: {
                    enabled: false
                }
            })
        }
        for (const device of result.devices) {
            if (device._addr !== '127.0.0.1' && device._addr !== '0.0.0.0') {
                const mac = await getMac(device._addr);
                const vendor = oui(mac);
                let exists = false;

                for (const entry of oldDevices) {
                    if (entry.native !== undefined && entry.native.mac === device.mac) {
                        exists = true;
                    }
                    if (exists === true && entry.native !== undefined && entry.native.ip !== device._addr) {
                        const idName = mac.replace(/:/g, '');
                        await adapter.extendObjectAsync(adapter.namespace + '.' + idName, {
                            native: {
                                ip: device._addr,
                                vendor: vendor
                            }
                        })
                    }
                }

                if (!exists) {
                    await addDevice(device._addr, device._name, true, mac);
                }


            }
        }
        const preparedObjects = await prepareObjectsByConfig();
        pingAll(preparedObjects.pingTaskList, 0);
    } catch (err) {
        adapter.log.warn('Discovery faild: ' + err);
    }
    }, 1000)
}

function getMac(ip){
    return new Promise(resolve => {
        arp.getMAC(ip, (err, mac) => {
            if(err){
                adapter.log.error(err);
                resolve(undefined);
            } else {
                resolve(mac);
            }


        });
    })
}

async function addDevice(ip, name, enabled, mac){
    let idName, vendor = '';

    if (!mac) {
        mac = await getMac(ip);

        if (mac === '(unvollständig)' || mac === undefined) {
            adapter.log.info(`Could not find the mac address for ${ip}`);
            idName = name;
        } else {
            idName = mac.replace(/:/g, '');
            vendor = oui(mac);
            if (vendor) {
                vendor = vendor.replace(/\n/g, ', ');
            }
        }
    } else {
        idName = mac.replace(/:/g, '');
        vendor = oui(mac);
        if (vendor){
            vendor = vendor.replace(/\n/g, ', ');
        }
    }



    await adapter.extendObjectAsync(adapter.namespace + '.' + idName, {
        type: "device",
        common: {
            name: name || ip
        },
        native: {
            enabled: enabled,
            ip: ip,
            mac: mac,
            vendor: vendor
        }
    })

    for (const obj in objects){
        await adapter.extendObjectAsync(idName + '.' + obj, objects[obj]);
    }

    clearTimeout(stopTimer);

    const preparedObjects = await prepareObjectsByConfig();
    pingAll(preparedObjects.pingTaskList, 0);
}

async function delDevice(deviceId) {
    await adapter.getObjectListAsync({startkey: 'ping.' + adapter.instance + '.' + deviceId, endkey: 'ping.' + adapter.instance + '.' + deviceId + '.\u9999'})
        .then(async result => {
            for (const r in result.rows) {
                await adapter.delObjectAsync(result.rows[r].id)
                    .then(result => {
                        //console.log(result);
                    }, reject => {
                        console.log(reject);
                    });
            }
        }, reject => {
            console.log(reject);
        });
}

function pingAll(taskList, index) {
    stopTimer && clearTimeout(stopTimer);
    stopTimer = null;

    if (index >= taskList.length) {
        timer = setTimeout(() => pingAll(taskList, 0), adapter.config.interval);
        return;
    }

    const task = taskList[index];
    index++;
    adapter.log.debug('Pinging ' + task.host);

    ping.probe(task.host, {log: adapter.log.debug}, (err, result) => {
        err && adapter.log.error(err);

        if (result) {
            adapter.log.debug('Ping result for ' + result.host + ': ' + result.alive + ' in ' + (result.ms === null ? '-' : result.ms) + 'ms');

            if (task.extendedInfo) {
                adapter.setState(task.stateAlive, {val: result.alive, ack: true});
                adapter.setState(task.stateTime, {val: result.ms === null ? '-' : result.ms / 1000, ack: true});

                let rps = 0;
                if (result.alive && result.ms !== null && result.ms > 0) {
                    rps = result.ms <= 1 ? 1000 : 1000.0 / result.ms;
                }
                adapter.setState(task.stateRps, { val: rps, ack: true });
            } else {
                adapter.setState(task.stateAlive, { val: result.alive, ack: true });
            }
        }

        !isStopping && setImmediate(() => pingAll(taskList, index));
    });
}

function prepareObjectsForHost(config) {
    const host = config.ip;
    const mac = config.mac;
    const idName = mac ? mac.replace(FORBIDDEN_CHARS, '_').replace(/:/g, '') : config.name;

    const stateAliveID = {channel: idName, state: 'alive'};
    const stateTimeID = {channel: idName, state: 'time'};
    const stateRpsID = {channel: idName, state: 'rps'};

    return {
        ping_task: {
            host: host,
            extendedInfo: true,
            stateAlive: stateAliveID,
            stateTime: stateTimeID,
            stateRps: stateRpsID
        }
    };
}

async function prepareObjectsByConfig() {
    const result = {};

    const pingTaskList = [];
    const objs = await adapter.getDevicesAsync();

    let devices = [];
    for (const d in objs){
        let json = objs[d].native;
        json.name = objs[d].common.name;
        devices.push(json);
    }

    devices.forEach( device => {
        if (device.enabled === false) {
            return;
        }

        const config = prepareObjectsForHost(device);

        pingTaskList.push(config.ping_task);
    });

    result.pingTaskList = pingTaskList;
    return result;
}

function extendHostInformation(){
    if (adapter.config.portScan === true){
        portScan('localhost', '127.0.0.1');
    }
}

async function main(adapter) {
    //TODO: check on startup if IP addresses has changed. Look on the MAC list?
    extendHostInformation();

    adapter.config.interval = parseInt(adapter.config.interval, 10);

    if (adapter.config.interval < 5000) {
        adapter.log.warn('Poll interval is too short. Reset to 5000 ms.');
        adapter.config.interval = 5000;
    }

    const preparedObjects = await prepareObjectsByConfig();
    pingAll(preparedObjects.pingTaskList, 0);

    adapter.subscribeStates('*discover');
    adapter.subscribeStates('*wol');
    adapter.subscribeStates('*scan');
}

// If started as allInOne/compact mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}
