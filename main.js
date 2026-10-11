'use strict';

/*
 * Created with @iobroker/create-adapter v2.5.0
 */

const utils = require('@iobroker/adapter-core');
const os = require('node:os');
const net = require('node:net');
const dgram = require('node:dgram');
const { execFile } = require('node:child_process');
const dmNetTools = require('./lib/devicemgmt.js');
const migration = require('./lib/migration.js');
const asTools = require('@all-smart/all-smart-tools');
const arp = require('@network-utils/arp-lookup');
const wol = require('wol');
const portscanner = require('evilscan');
const ouiData = require('oui-data');
const ping = require('./lib/ping');
const objects = require('./lib/object_definition').object_definitions;
const { nslookup } = require('./lib/nslookup');
const { CronJob } = require('cron');
const { checkPingRights } = require('./lib/utils');
const { calculateSubnetMask } = require('./lib/ip-calculator');

let timer = null;
let isStopping = false;
let discoverTimeout = null;
let pingTimeout = null;
let deviceListTimeout = null;
/**
 *
 *
 * Represents a list of tasks to be executed.
 *
 * Each element in the taskList array is an object with specific properties. It looks like:
 * ```
 * {
 * 	   mac: '00:80:41:ae:fd:7e' // The mac of the device
 *     host: '192.168.11.15', // IP of the host
 *     extendedInfo: true, // Indicates if extended information should be obtained
 *     pingInterval: 60, // Time interval in seconds between two consecutive pings
 *     retries: 0, // The number of retries already made
 *     retryCounter: 0, // Used to count the number of retries
 *     stateAlive: { channel: '84b8b87e0294', state: 'alive' }, // Information about the 'alive' state
 *     stateTime: { channel: '84b8b87e0294', state: 'time' }, // Information about 'time' state
 *     stateRps: { channel: '84b8b87e0294', state: 'rps' } // Information about 'rps' state
 *     wakeWithIp: false // boolean per device
 * }
 * ```
 */
let taskList = [];
let cronJob = null;

const PRESENCE_UDP_PORT = 5353;
const PRESENCE_TCP_PORT = 62078;
const PRESENCE_ARP_TIMEOUT = 7000;

const WOL_PACKET_COUNT = 3;
const WOL_PACKET_DELAY = 750;
const WOL_SEND_TIMEOUT = 2000;

const DEFAULT_PORT_LIST =
    '20, 21, 22, 23, 25, 53, 80, 110, 119, 123, 143, 161, 162, 194, 443, 445, 3306, 3389, 5900, 6379, 8080, 8443, 9090, 9200, 9999';

const FORBIDDEN_CHARS = /[\][*,;'"`<>\\?]/g;

class NetTools extends utils.Adapter {
    /**
     * @param {Partial<utils.AdapterOptions>} [options]
     */
    constructor(options) {
        super({
            ...options,
            name: 'net-tools',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));

        this.deviceManagement = new dmNetTools(this);

        this.arpScanInstalled = false;
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        await migration.startMigration(this);
        this.asTools = new asTools(this);
        if (!this.config.licenseKey) {
            const adapterObject = await this.getForeignObjectAsync(`system.adapter.net-tools`);
            if (adapterObject && adapterObject.native && adapterObject.native.licenseKey === '') {
                this.log.error('License Key is not set! Enter a valid license key in the adapter settings.');
            } else if (adapterObject && adapterObject.native && adapterObject.native.licenseKey) {
                await this.extendForeignObjectAsync(`system.adapter.net-tools.${this.instance}`, {
                    native: {
                        licenseKey: adapterObject.native.licenseKey,
                    },
                });
            }
        } else {
            const adapterObject = await this.getForeignObjectAsync(`system.adapter.net-tools`);
            if (adapterObject && adapterObject.native && adapterObject.native.licenseKey !== this.config.licenseKey) {
                await this.extendForeignObjectAsync(`system.adapter.net-tools`, {
                    native: { licenseKey: this.config.licenseKey },
                });
            }
            this.extendHostInformation();
            await this.asTools.checkObjectsUpdate();
            if (this.asTools.isLxc) {
                checkPingRights();
            }
            this.config.pingInterval = parseInt(this.config.pingInterval, 10);

            if (this.config.pingInterval < 5) {
                this.log.warn('Poll interval is too short. Reset to 5s.');
                this.config.pingInterval = 5;
            }

            await this.prepareObjectsByConfig();
            this.pingAll();
            await this.updateDeviceList();

            if (this.config.autoSearch === true && this.config.searchSchedule !== '') {
                this.log.info('Auto search is enabled');
                cronJob = new CronJob(this.config.searchSchedule, () => {
                    this.log.debug('Start auto search');
                    this.discover();
                });
                cronJob.start();
            }

            console.log(JSON.stringify(await this.getLocalNetworkInterfaces()));

            this.subscribeStates('*discover');
            this.subscribeStates('*wol');
            this.subscribeStates('*scan');
            this.subscribeObjects('*');
        }
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     *
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            if (discoverTimeout) {
                clearTimeout(discoverTimeout);
                discoverTimeout = null;
            }
            if (deviceListTimeout) {
                clearTimeout(deviceListTimeout);
                deviceListTimeout = null;
            }
            if (pingTimeout) {
                clearTimeout(pingTimeout);
                pingTimeout = null;
            }
            isStopping = true;
            if (cronJob) {
                cronJob.stop();
            }

            callback();
        } catch {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    /**
     * Is called if a subscribed object changes
     *
     * @param {string} id
     * @param {ioBroker.Object | null | undefined} obj
     */
    onObjectChange(id, obj) {
        // A device was added, changed or deleted: update the device list for Blockly
        if (id.startsWith(`${this.namespace}.`) && !id.slice(this.namespace.length + 1).includes('.')) {
            this.scheduleDeviceListUpdate();
        }

        if (obj) {
            // The object was changed

            if (obj.type === 'device') {
                // Look if there is a host entry in taskList for the ip
                const hostEntry = taskList.find(entry => entry?.mac === obj.native.mac);
                if (hostEntry) {
                    if (hostEntry.host !== obj.native.ip) {
                        // IP changed, update quicklinks
                        this.getStateAsync(`${id}.ports`).then(portsState => {
                            if (portsState && typeof portsState.val === 'string') {
                                const openPorts = portsState.val.split(',').map(p => p.trim());
                                this.updateQuicklinks(id, obj.native.ip, openPorts);
                            }
                        });
                    }
                    hostEntry.host = obj.native.ip;
                    hostEntry.pingInterval = obj.native.pingInterval;
                    hostEntry.retries = obj.native.retries;
                    hostEntry.wakeWithIp = obj.native.wakeWithIp === true;
                    hostEntry.extendedDetection = obj.native.extendedDetection === true;
                }
            }
        } else {
            // The object was deleted
            //this.log.info(`object ${id} deleted`);
        }
    }

    /**
     * Is called if a subscribed state changes
     *
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    async onStateChange(id, state) {
        if (state) {
            const tmp = id.split('.');
            const dp = tmp.pop();
            switch (dp) {
                case 'discover':
                    if (state.val && !state.ack) {
                        this.discover();
                        this.setState(id, { val: state.val, ack: true });
                    }
                    break;
                case 'wol':
                    if (state.val && state.ack === false) {
                        const parentId = await this.getParentId(id);
                        const obj = await this.getObjectAsync(parentId);
                        if (obj === null || obj === undefined) {
                            this.log.warn(`Object ${parentId} not found`);
                            return;
                        }
                        this.wake(obj.native.mac);
                        this.setState(id, { val: state.val, ack: true });
                    }
                    break;
                case 'scan':
                    if (state.val && !state.ack) {
                        this.setState(id, { val: state.val, ack: true });
                        const parentId = await this.getParentId(id);
                        try {
                            const obj = await this.getObjectAsync(parentId);
                            if (obj === null || obj === undefined) {
                                this.log.warn(`Object ${parentId} not found`);
                                return;
                            }
                            const portsState = await this.getStateAsync(`${parentId}.portList`);
                            await this.scanPortsInBatches(parentId, obj.native.ip, portsState ? portsState.val : null);
                        } catch (err) {
                            this.log.error(`Port scan for ${parentId} failed: ${err}`);
                        } finally {
                            // Always close a waiting progress dialog in the device manager
                            if (this.deviceManagement) {
                                this.deviceManagement.handleScanFinished(parentId);
                            }
                        }
                    }
                    break;
            }
        } else {
            // The state was deleted
            //this.log.info(`state ${id} deleted`);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    async onMessage(obj) {
        this.log.debug(`Message received: ${JSON.stringify(obj)}`);
        if (typeof obj === 'object' && obj.message && !obj.command.includes('dm:')) {
            switch (obj.command) {
                case 'ping': {
                    // Try to ping one IP or name
                    if (obj.callback && obj.message) {
                        ping.probe(String(obj.message), {}, (err, result) => {
                            if (err) {
                                this.log.warn(`Ping of ${obj.message} failed: ${err}`);
                                result = { host: obj.message, alive: false, ms: null, error: String(err) };
                            }
                            this.sendTo(obj.from, obj.command, { result }, obj.callback);
                        });
                    }
                    break;
                }
                case 'portScan': {
                    // Scan ports of one IP or name: message = 'IP' or { ip: 'IP', ports: '22,80,443' }
                    const ip = typeof obj.message === 'object' ? obj.message.ip : obj.message;
                    const requestedPorts = typeof obj.message === 'object' ? obj.message.ports : null;
                    const result = { host: ip, ports: [] };
                    if (!ip || typeof ip !== 'string') {
                        result.error = 'No IP address given';
                    } else {
                        const portList =
                            typeof requestedPorts === 'string' && requestedPorts.trim()
                                ? requestedPorts
                                      .split(',')
                                      .map(p => p.trim())
                                      .filter(p => p !== '')
                                      .join(',')
                                : Array.isArray(requestedPorts) && requestedPorts.length
                                  ? requestedPorts.join(',')
                                  : this.getConfiguredPorts().join(',');
                        try {
                            this.log.info(`Scanning for open ports (${portList}) at ${ip} (requested by ${obj.from})`);
                            result.ports = await this.runPortScan(ip.trim(), portList);
                        } catch (err) {
                            result.error = err && err.message ? err.message : String(err);
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, result, obj.callback);
                    }
                    break;
                }
                case 'getMac': {
                    if (obj.callback && obj.message) {
                        this.sendTo(obj.from, obj.command, await arp.toMAC(obj.message), obj.callback);
                    }
                    break;
                }
                case 'wol':
                case 'wake': {
                    const sent = await this.wake(obj.message);
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, sent, obj.callback);
                    }
                    break;
                }
                case 'deleteDevice': {
                    await this.delDevice(obj.message).then(() => {
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, 'Device deleted', obj.callback);
                        }
                    });
                    break;
                }
                case 'addDevice': {
                    await this.addDevice(obj.message.ip, obj.message.name, obj.message.enabled, obj.message.mac).then(
                        () => {
                            if (obj.callback) {
                                this.sendTo(obj.from, obj.command, 'Device added', obj.callback);
                            }
                        },
                    );
                    break;
                }
                case 'updateDevice': {
                    await this.updateDevices(obj.message);
                    break;
                }
            }
        }
    }

    /**
     * Updates the device list (used by the Blockly blocks) after a short delay,
     * so multiple object changes in a row result in one update.
     */
    scheduleDeviceListUpdate() {
        if (deviceListTimeout) {
            clearTimeout(deviceListTimeout);
        }
        deviceListTimeout = setTimeout(() => {
            deviceListTimeout = null;
            this.updateDeviceList().catch(err => this.log.warn(`Cannot update device list: ${err}`));
        }, 2000);
    }

    /**
     * Writes all devices (id, name, ip, mac) as JSON to the state info.devices.
     */
    async updateDeviceList() {
        const devices = await this.getDevicesAsync();
        const list = devices
            .filter(d => d && d._id && !d._id.endsWith('.localhost'))
            .map(d => {
                const name = d.common && d.common.name;
                return {
                    id: d._id,
                    // keep translated names as object, Blockly shows the language of the editor
                    name: name && typeof name === 'object' ? name : name ? String(name) : '',
                    ip: (d.native && d.native.ip) || '',
                    mac: (d.native && d.native.mac) || '',
                };
            })
            .sort((a, b) => netToolsSortName(a.name).localeCompare(netToolsSortName(b.name)));

        await this.setObjectNotExistsAsync('info.devices', {
            type: 'state',
            common: {
                name: 'Devices found by net-tools',
                type: 'string',
                role: 'json',
                read: true,
                write: false,
                def: '[]',
            },
            native: {},
        });
        await this.setStateAsync('info.devices', { val: JSON.stringify(list), ack: true });
    }

    /**
     * Scans specified ports on a given IP address in batches.
     *
     * @param {string} id - Object id.
     * @param {string} ip - The IP address to scan.
     * @param {number[]|string} ports - An array of port numbers or a comma-separated string of ports to be scanned.
     * @returns {Promise<void>} A promise that resolves when all port scans are completed.
     */
    async scanPortsInBatches(id, ip, ports) {
        // Ensure ports is an array
        if (typeof ports === 'string' && ports.length > 0) {
            ports = ports.split(',').map(p => p.trim());
        } else if (!ports) {
            ports = this.getConfiguredPorts();
        } else if (!Array.isArray(ports)) {
            this.log.error('Invalid ports parameter: expected array or string');
            return;
        }

        const batchSize = 10;
        let portArrays = [];

        for (let i = 0; i < ports.length; i += batchSize) {
            portArrays.push(ports.slice(i, i + batchSize));
        }

        let foundPorts = [];

        for (const portBatch of portArrays) {
            const result = await this.portScan(id, ip, portBatch.join(','));
            if (result && result.length >= 1) {
                foundPorts.push(result);
            }
        }
        this.log.info(`Found open ports: ${foundPorts}`);
        await this.setState(`${id}.ports`, { val: foundPorts.flat().toString(), ack: true });

        // Update quicklinks in common object
        await this.updateQuicklinks(id, ip, foundPorts.flat());

        this.log.info('Port scan finished');
    }

    /**
     * Returns the ports from the adapter configuration as array.
     * Falls back to the default port list if the configuration is missing or empty.
     *
     * @returns {string[]} Array of ports.
     */
    getConfiguredPorts() {
        const portList = typeof this.config.portList === 'string' ? this.config.portList : '';
        const ports = portList
            .split(',')
            .map(p => p.trim())
            .filter(p => p !== '');
        return ports.length ? ports : DEFAULT_PORT_LIST.split(',').map(p => p.trim());
    }

    /**
     * Updates the quicklinks in the common object for a device.
     *
     * @param {string} id - Object id.
     * @param {string} ip - IP address of the device.
     * @param {string[]} openPorts - Array of open ports.
     */
    async updateQuicklinks(id, ip, openPorts) {
        if (!ip) {
            return;
        }
        const quicklinks = [];
        const otherPorts = ['8080', '8081', '8443', '8888'];
        for (const port of openPorts) {
            const portStr = String(port);
            if (portStr === '80') {
                quicklinks.push({
                    name: 'Web HTTP',
                    url: `http://${ip}`,
                });
            } else if (portStr === '443') {
                quicklinks.push({
                    name: 'Web HTTPS',
                    url: `https://${ip}`,
                });
            } else if (otherPorts.includes(portStr)) {
                const protocol = portStr.endsWith('443') ? 'https' : 'http';
                quicklinks.push({
                    name: `Web Port ${portStr}`,
                    url: `${protocol}://${ip}:${portStr}`,
                });
            }
        }

        const obj = await this.getObjectAsync(id);
        if (obj && obj.common) {
            if (JSON.stringify(obj.common.quicklink) !== JSON.stringify(quicklinks)) {
                this.log.debug(`Updating quicklinks for ${id}: ${JSON.stringify(quicklinks)}`);
                await this.extendObject(id, {
                    common: {
                        quicklink: quicklinks,
                    },
                });
            }
        }
    }

    /**
     *
     * @param {string} id - object id for host
     * @param {string} ip - ip address like 127.0.0.1
     * @param {string} ports - string of ports to scan e.g. '80,443,8080'
     */
    async portScan(id, ip, ports) {
        const alive = await this.getStateAsync(`${id}.alive`);
        if (!(id === 'localhost' || alive?.val === true)) {
            return [];
        }

        const portList =
            ports && String(ports).trim()
                ? String(ports)
                      .split(',')
                      .map(p => p.trim())
                      .join(',')
                : '80,443';

        this.log.info(`Scanning for open ports (${portList}) at ${id}, please wait`);
        await this.setState(`${id}.ports`, { val: 'Scanning, please wait', ack: true });

        try {
            return await this.runPortScan(ip, portList, id);
        } catch (err) {
            const msg = err && err.message ? err.message : String(err);
            this.log.error(`Port scan failed for ${id}: ${msg}`);
            await this.setState(`${id}.ports`, { val: `Scan failed: ${msg}`, ack: true });
            return [];
        }
    }

    /**
     * Scans the given ports of an IP address without touching any states.
     *
     * @param {string} ip - IP address or host name to scan.
     * @param {string} portList - Comma separated ports or ranges, e.g. "22,80,443" or "20-30".
     * @param {string} [label] - Name used in log messages.
     * @returns {Promise<number[]>} Open ports.
     */
    async runPortScan(ip, portList, label = ip) {
        const openPorts = [];

        const options = {
            target: ip,
            port: portList,
            status: 'TROU', // filtered on "open" below
            banner: false,
            reverse: false,
            timeout: 3000, // per port
            concurrency: 500,
        };

        const scanner = new portscanner(options);

        await new Promise((resolve, reject) => {
            const timeoutGuard = setTimeout(() => {
                try {
                    scanner.destroy && scanner.destroy();
                } catch {
                    // ignore errors while destroying the scanner
                }
                reject(new Error('Port scan timeout after 30 seconds'));
            }, 30000);

            scanner.on('result', data => {
                this.log.debug(`Port scan result for ${label}: ${data.port} (${data.status})`);
                if (data.status === 'open') {
                    openPorts.push(data.port);
                }
            });

            scanner.on('error', err => {
                clearTimeout(timeoutGuard);
                this.log.error(`Port scan error for ${label}: ${err.message}`);
                reject(err);
            });

            scanner.on('done', () => {
                clearTimeout(timeoutGuard);
                resolve();
            });

            scanner.run();
        });

        return openPorts;
    }

    async getParentId(id) {
        let parentId = id.replace(`${this.namespace}.`, '');
        parentId = parentId.replace(/\..*/g, '');
        return `${this.namespace}.${parentId}`;
    }

    /**
     * Sends Wake-on-LAN magic packets to a device.
     * Sends WOL_PACKET_COUNT packets to every target address with a pause of WOL_PACKET_DELAY ms.
     *
     * @param {string} mac - MAC address of the device.
     * @returns {Promise<boolean>} true if at least one packet was sent successfully.
     */
    async wake(mac) {
        if (typeof mac !== 'string' || !mac.trim()) {
            this.log.warn('Wake-on-LAN: no MAC address given');
            return false;
        }
        const normalizedMac = normalizeMac(mac);
        const device = taskList.find(entry => entry?.mac && normalizeMac(entry.mac) === normalizedMac);
        const addresses = this.getWolAddresses(device);

        let sent = false;
        for (let i = 1; i <= WOL_PACKET_COUNT; i++) {
            for (const address of addresses) {
                try {
                    await sendMagicPacket(mac, address);
                    sent = true;
                    this.log.debug(`Wake-on-LAN packet ${i}/${WOL_PACKET_COUNT} sent to ${mac} via ${address}`);
                } catch (err) {
                    this.log.warn(`Wake-on-LAN packet to ${mac} via ${address} failed: ${err}`);
                }
            }
            if (i < WOL_PACKET_COUNT) {
                if (isStopping) {
                    break;
                }
                await new Promise(resolve => {
                    // setTimeout returns undefined if the adapter is stopping
                    if (!this.setTimeout(resolve, WOL_PACKET_DELAY)) {
                        resolve();
                    }
                });
            }
        }

        if (sent) {
            this.log.info(`Wake-on-LAN packets sent to ${mac} via ${addresses.join(', ')}`);
        }
        return sent;
    }

    /**
     * Determines the target addresses for Wake-on-LAN packets of a device.
     *
     * @param {object} [device] - Entry of the taskList.
     * @returns {string[]} Target addresses.
     */
    getWolAddresses(device) {
        const host = device?.host;
        const addresses = [];

        if (device?.wakeWithIp && host) {
            // Device in another subnet: send to the device itself and to the directed broadcast of its subnet
            addresses.push(host);
            if (net.isIPv4(host)) {
                addresses.push(getLocalBroadcast(host) || `${host.split('.').slice(0, 3).join('.')}.255`);
            }
        } else {
            addresses.push('255.255.255.255');
            // With multiple network interfaces the limited broadcast only leaves via the default route,
            // so additionally send to the broadcast address of the interface in the device subnet
            const broadcast = host && net.isIPv4(host) ? getLocalBroadcast(host) : null;
            if (broadcast) {
                addresses.push(broadcast);
            }
        }

        return [...new Set(addresses)];
    }

    async discover() {
        let oldDevices = await this.getDevicesAsync();
        let devices = [];
        for (let device in oldDevices) {
            let newDevice = { mac: '', ip: '' };
            if (oldDevices[device].native?.mac) {
                newDevice.mac = oldDevices[device].native.mac;
            }
            if (oldDevices[device].native?.ip) {
                newDevice.ip = oldDevices[device].native.ip;
            }
            // Check if device is on ignore list, if not add it to array

            const ignore = await this.checkIgnore(newDevice.mac);
            if (!ignore) {
                devices.push(newDevice);
            }
        }

        oldDevices = [];

        try {
            const ips = this.getIpRange();
            const decimalSeparator = getDecimalSeparator();

            for (let i = 0; i < ips.length; i += 10) {
                let promises = [];
                for (let j = 0; j < 10; j++) {
                    if (i + j < ips.length) {
                        promises.push(this.handleDiscoveryProbe(ips[i + j], devices, decimalSeparator));
                    }
                }

                await Promise.all(promises);
            }

            this.log.info('Discovery finished');
            return true;
        } catch (err) {
            this.log.warn(`Discovery faild: ${err}`);
            return false;
        }
    }

    async checkIgnore(mac) {
        if (!this.config.ignoreListTable) {
            return false;
        }
        return this.config.ignoreListTable.find(entry => entry.mac === mac);
    }

    async handleDiscoveryProbe(ip, oldDevices, decimalSeparator) {
        return new Promise((resolve, reject) => {
            try {
                ping.probe(
                    ip,
                    {
                        timeout: parseFloat(`0${decimalSeparator}25`),
                        log: this.log.info,
                    },
                    async (error, result) => {
                        if (error) {
                            reject(false);
                        }
                        if (result.alive === true) {
                            result.mac = await arp.toMAC(result.host);
                            if (result.mac !== undefined && result.mac !== null) {
                                result.vendor = this.getVendor(result.mac);
                                if (result.vendor) {
                                    result.vendor = result.vendor.replace(/\n/g, ', ');
                                }
                            } else {
                                this.log.info(`Can not get mac for ${result.host}. Going to next IP.`);
                                resolve(true);
                            }
                            try {
                                result.name = await nslookup(result.host);
                            } catch {
                                result.name = result.host;
                            }
                            let exists = false;

                            for (const entry of oldDevices) {
                                if (entry.mac !== '' && entry.mac !== undefined && entry.mac === result.mac) {
                                    exists = true;
                                }
                                if (
                                    exists === true &&
                                    entry.ip !== '' &&
                                    entry.ip !== undefined &&
                                    entry.ip !== result.host &&
                                    entry.mac === result.mac
                                ) {
                                    const idName = result.mac.replace(/:/g, '');
                                    const fullId = `${this.namespace}.${idName}`;
                                    await this.extendObject(fullId, {
                                        native: {
                                            ip: result.host,
                                            vendor: result.vendor,
                                        },
                                    });

                                    // Update quicklinks if IP changed
                                    const portsState = await this.getStateAsync(`${fullId}.ports`);
                                    if (portsState && typeof portsState.val === 'string') {
                                        const openPorts = portsState.val.split(',').map(p => p.trim());
                                        await this.updateQuicklinks(fullId, result.host, openPorts);
                                    }
                                }
                            }
                            const ignore = await this.checkIgnore(result.mac);
                            if (!exists && !ignore) {
                                await this.addDevice(result.host, result.name, true, result.mac);
                            }
                        }
                        resolve(true);
                    },
                );
            } catch (error) {
                this.log.warn(`Error in handleDiscoveryProbe: ${error}`);
                reject(false);
            }
        });
    }

    /**
     * Retrieves the range of IP addresses based on the given configuration.
     *
     * @returns {Array} - An array of IP addresses in the specified range.
     */
    getIpRange() {
        const nets = os.networkInterfaces();
        let iface;
        let ips = [];
        let startIP, endIP;
        if (nets[this.config.interface] && this.config.startIp === '' && this.config.endIp === '') {
            iface = nets[this.config.interface].filter(net => net.family === 'IPv4');
            const cidr = iface[0].cidr.split('/');
            const subnetRange = calculateSubnetMask(cidr[0], parseInt(cidr[1]));
            startIP = subnetRange.ipLowStr.split('.').map(Number);
            endIP = subnetRange.ipHighStr.split('.').map(Number);
        } else {
            // Use defined range from config
            startIP = this.config.startIp.split('.').map(Number);
            endIP = this.config.endIp.split('.').map(Number);
        }

        while (
            !(
                startIP[0] > endIP[0] ||
                (startIP[0] === endIP[0] &&
                    (startIP[1] > endIP[1] ||
                        (startIP[1] === endIP[1] &&
                            (startIP[2] > endIP[2] || (startIP[2] === endIP[2] && startIP[3] > endIP[3])))))
            )
        ) {
            ips.push(startIP.join('.'));
            startIP[3]++;
            for (let i = 3; i > 0; i--) {
                if (startIP[i] > 254) {
                    startIP[i] = 0;
                    startIP[i - 1]++;
                }
            }
        }

        return ips;
    }

    /**
     * @param {string} ip
     * @param {string} name
     * @param {boolean} enabled
     * @param {string | null | undefined} mac
     * @param {number} [pingInterval]
     * @param {number} [retries]
     */
    async addDevice(ip, name, enabled, mac, pingInterval, retries) {
        let idName,
            vendor = '';
        if (!mac || mac === '') {
            mac = await arp.toMAC(ip);

            this.log.info(`MAC address for ${ip}: ${mac}`);

            if (!mac) {
                return;
            }
            mac = mac.toLowerCase();

            if (mac === '(unvollständig)' || mac === undefined) {
                this.log.info(`Could not find the mac address for ${ip}`);
                idName = name;
            } else {
                idName = mac.replace(/:/g, '');
                vendor = this.getVendor(mac);
                if (vendor) {
                    vendor = vendor.replace(/\n/g, ', ');
                }
            }
        } else {
            idName = mac.replace(/:/g, '');
            vendor = this.getVendor(mac);
            if (vendor) {
                vendor = vendor.replace(/\n/g, ', ');
            }
        }

        await this.extendObject(`${this.namespace}.${idName}`, {
            type: 'device',
            common: {
                name: name || ip,
            },
            native: {
                enabled: enabled,
                pingInterval: pingInterval ? pingInterval : this.config.pingInterval,
                retries: retries ? retries : 0,
                wakeWithIp: false,
                ip: ip,
                mac: mac,
                vendor: vendor,
            },
        });

        for (const obj in objects) {
            await this.extendObject(`${idName}.${obj}`, objects[obj]);
        }

        await this.prepareObjectsByConfig();
        this.pingAll();
    }

    /**
     * Delete device
     *
     * @param {string} deviceId
     * @returns {Promise<boolean>}
     */
    async delDevice(deviceId) {
        const name = deviceId.replace(/net-tools\.\d\./, '');
        const res = await this.deleteDeviceAsync(name);
        if (res !== null) {
            this.log.info(`${name} deleted`);
            // Delete device from taskList
            for (const i in taskList) {
                if (taskList[i] === null) {
                    continue;
                }
                if (taskList[i].stateAlive.channel === name) {
                    taskList.splice(parseInt(i), 1);
                }
            }

            return true;
        }
        this.log.error(`Can not delete device ${name}: ${JSON.stringify(res)}`);
        return false;
    }

    /**
     * Update devices
     *
     * @param {object} devices - array of devices
     * @returns {Promise<void>}
     */
    async updateDevices(devices) {
        for (const i in devices) {
            const mac = devices[i].mac.replace(/:/g, '').toLowerCase();
            const allDevices = await this.getDevicesAsync();
            let deleted = true;
            for (const d in allDevices) {
                if (`${this.namespace}.${mac}` !== allDevices[d]._id) {
                    deleted = true;
                } else {
                    deleted = false;
                    break;
                }
            }
            if (deleted === true) {
                this.log.info(`Delete device ${mac}`);
                await this.delDevice(mac);
            } else {
                await this.extendObject(`${this.namespace}.${mac}`, {
                    common: {
                        name: devices[i].name,
                    },
                    native: devices[i],
                });
            }
        }
    }

    pingAll() {
        for (const host in taskList) {
            this.pingDevice(host);
        }
    }

    /**
     * Pings a device to check its availability.
     *
     * @param {string} host - The hostname or IP address of the device to ping.
     * @returns {undefined}
     */
    pingDevice(host) {
        if (!taskList[host]) {
            return;
        }
        ping.probe(taskList[host].host, { log: this.log.debug }, async (err, result) => {
            err && this.log.error(err);

            if (taskList.length === 0 || taskList[host] === null || taskList[host] === undefined) {
                return;
            }

            // Devices like smartphones do not answer pings while sleeping: check presence via ARP
            if (result && result.alive !== true && taskList[host].extendedDetection && taskList[host].mac) {
                const task = taskList[host];
                try {
                    if (await this.detectPresence(task.host, task.mac)) {
                        this.log.debug(`${task.host} does not answer ping, but was detected via ARP`);
                        result = { ...result, alive: true, ms: null };
                    }
                } catch (e) {
                    this.log.debug(`Extended detection of ${task.host} failed: ${e}`);
                }
                if (taskList[host] !== task) {
                    return;
                }
            }

            if (result) {
                if (result.alive === true) {
                    this.setState(`${taskList[host].stateAlive.channel}.alive`, { val: true, ack: true });
                    this.setState(`${taskList[host].stateTime.channel}.time`, {
                        val: result.ms === null ? 0 : result.ms / 1000,
                        ack: true,
                    });
                    let rps = 0;
                    if (result.alive && result.ms !== null && result.ms > 0) {
                        rps = result.ms <= 1 ? 1000 : 1000.0 / result.ms;
                    }
                    this.setState(`${taskList[host].stateRps.channel}.rps`, { val: rps, ack: true });
                    taskList[host].retryCounter = 0;
                } else if (taskList[host].retryCounter <= taskList[host].retries) {
                    taskList[host].retryCounter++;
                } else {
                    this.setState(`${taskList[host].stateAlive.channel}.alive`, { val: false, ack: true });
                    taskList[host].retryCounter = 0;
                }
            }

            if (!isStopping) {
                // Planen Sie den nächsten Ping basierend auf dem Intervall
                pingTimeout = setTimeout(() => this.pingDevice(host), taskList[host].pingInterval * 1000);
            }
        });
    }

    /**
     * Detects a device that does not answer pings (e.g. a sleeping smartphone).
     * Sends a UDP packet to port 5353 (mDNS) and tries a TCP connection to port 62078 (iOS sync service),
     * which wakes up the WLAN of the device, and checks if the device answers ARP.
     *
     * @param {string} ip - IPv4 address of the device.
     * @param {string} mac - MAC address of the device.
     * @returns {Promise<boolean>} true if the device is present.
     */
    async detectPresence(ip, mac) {
        if (!ip || !net.isIPv4(ip)) {
            return false;
        }

        const expectedMac = normalizeMac(mac);

        sendUdpPacket(ip, PRESENCE_UDP_PORT);
        // A TCP answer (connected or refused) proves that a device with this IP is present.
        // Check the MAC, the IP may belong to another device by now.
        if (await tcpAnswers(ip, PRESENCE_TCP_PORT, 1000)) {
            const neighbour = os.platform() === 'linux' ? await getNeighbour(ip) : null;
            const foundMac = neighbour && neighbour.mac ? neighbour.mac : await arp.toMAC(ip);
            return !foundMac || normalizeMac(foundMac) === expectedMac;
        }

        if (os.platform() === 'linux') {
            // Only a REACHABLE entry was confirmed just now. STALE/DELAY/PROBE entries are old and
            // are either confirmed or set to FAILED by the kernel within a few seconds.
            let ipCommandAvailable = true;
            const end = Date.now() + PRESENCE_ARP_TIMEOUT;
            while (Date.now() < end && !isStopping) {
                const neighbour = await getNeighbour(ip);
                if (neighbour === null) {
                    ipCommandAvailable = false;
                    break;
                }
                // no entry: not in a local subnet; FAILED: no ARP answer. INCOMPLETE: request still running
                if (!neighbour.state || neighbour.state === 'FAILED') {
                    return false;
                }
                if (neighbour.mac && normalizeMac(neighbour.mac) !== expectedMac) {
                    return false;
                }
                if (neighbour.state === 'REACHABLE' || neighbour.state === 'PERMANENT') {
                    return true;
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            if (ipCommandAvailable) {
                return false;
            }
        }

        // Other platforms or no "ip" command: check the ARP table (entries may be outdated for some time)
        await new Promise(resolve => setTimeout(resolve, 1500));
        const foundMac = await arp.toMAC(ip);
        return !!foundMac && normalizeMac(foundMac) === expectedMac;
    }

    /**
     * Prepare objects for host
     *
     * @param {object} config - config object
     * @returns {{ping_task: {stateTime: {channel: (string|*), state: string}, stateRps: {channel: (string|*), state: string}, mac: string, host: string, extendedInfo: boolean, pingInterval: number, retries: number, retryCounter: number, wakeWithIp: boolean, stateAlive: {channel: (string|*), state: string}}}}
     */
    prepareObjectsForHost(config) {
        const host = config.ip;
        const mac = config.mac;
        const idName = mac ? mac.replace(FORBIDDEN_CHARS, '_').replace(/:/g, '') : config.name;

        const stateAliveID = { channel: idName, state: 'alive' };
        const stateTimeID = { channel: idName, state: 'time' };
        const stateRpsID = { channel: idName, state: 'rps' };

        return {
            ping_task: {
                mac: mac,
                host: host,
                extendedInfo: true,
                pingInterval: config.pingInterval ? config.pingInterval : this.config.pingInterval,
                retries: config.retries ? config.retries : 0,
                retryCounter: 0,
                wakeWithIp: config.wakeWithIp ? config.wakeWithIp : false,
                extendedDetection: config.extendedDetection === true,
                stateAlive: stateAliveID,
                stateTime: stateTimeID,
                stateRps: stateRpsID,
            },
        };
    }

    /**
     * Get all devices
     *
     * @returns {Promise<{}>}
     */
    async prepareObjectsByConfig() {
        taskList = [];
        const objs = await this.getDevicesAsync();

        let devices = [];
        for (const d in objs) {
            if (objs[d]._id.includes('localhost')) {
                continue;
            }
            let json = objs[d].native;
            json.name = objs[d].common.name;
            devices.push(json);
        }

        devices.forEach(device => {
            if (device.enabled === false) {
                return;
            }

            const config = this.prepareObjectsForHost(device);
            if (config) {
                taskList.push(config.ping_task);
            }
        });

        return true;
    }

    async extendHostInformation() {
        if (this.config.portScan === true) {
            await this.scanPortsInBatches('localhost', '127.0.0.1', this.getConfiguredPorts());
        }
    }

    async getLocalNetworkInterfaces() {
        const networkInterfaces = os.networkInterfaces();
        return networkInterfaces;
    }

    /**
     * Get vendor from MAC address
     *
     * @param {string} mac
     * @returns {string}
     */
    getVendor(mac) {
        if (!mac || typeof mac !== 'string') {
            return '';
        }
        const prefix = mac.replace(/[:.-]/g, '').toUpperCase().slice(0, 6);
        return ouiData[prefix] || '';
    }
}

function getDecimalSeparator() {
    const numberWithDecimalSeparator = 1.1;
    return Intl.NumberFormat().format(numberWithDecimalSeparator).substring(1, 2);
}

/**
 * Sends one Wake-on-LAN magic packet. Rejects on error or if sending takes too long.
 *
 * @param {string} mac - MAC address of the device.
 * @param {string} address - Target address.
 * @returns {Promise<void>}
 */
function sendMagicPacket(mac, address) {
    return new Promise((resolve, reject) => {
        const guard = setTimeout(() => reject(new Error('timeout')), WOL_SEND_TIMEOUT);
        wol.wake(mac, { address }).then(
            () => {
                clearTimeout(guard);
                resolve();
            },
            err => {
                clearTimeout(guard);
                reject(err);
            },
        );
    });
}

/**
 * Sends a small UDP packet, errors are ignored.
 *
 * @param {string} ip - Target IP.
 * @param {number} port - Target port.
 */
function sendUdpPacket(ip, port) {
    try {
        const socket = dgram.createSocket('udp4');
        socket.on('error', () => socket.close());
        socket.send(Buffer.from([0]), port, ip, () => socket.close());
    } catch {
        // ignore
    }
}

/**
 * Checks if a host answers a TCP connection attempt (connected or refused).
 *
 * @param {string} ip - Target IP.
 * @param {number} port - Target port.
 * @param {number} timeout - Timeout in ms.
 * @returns {Promise<boolean>} true if the host answered.
 */
function tcpAnswers(ip, port, timeout) {
    return new Promise(resolve => {
        const socket = new net.Socket();
        let done = false;
        const finish = answered => {
            if (!done) {
                done = true;
                socket.destroy();
                resolve(answered);
            }
        };
        socket.setTimeout(timeout);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', err => finish(err && err.code === 'ECONNREFUSED'));
        socket.connect(port, ip);
    });
}

/**
 * Reads the neighbour (ARP) entry of an IP with "ip neigh show" (Linux).
 *
 * @param {string} ip - IPv4 address.
 * @returns {Promise<{state: string, mac: string} | null>} Entry (state is '' if there is none) or null if the command is not available.
 */
function getNeighbour(ip) {
    return new Promise(resolve => {
        execFile('ip', ['neigh', 'show', ip], { timeout: 2000 }, (err, stdout) => {
            if (err) {
                resolve(null);
                return;
            }
            const line = String(stdout)
                .split('\n')
                .find(l => l.trim().startsWith(`${ip} `));
            if (!line) {
                resolve({ state: '', mac: '' });
                return;
            }
            const macMatch = line.match(/lladdr\s+([0-9a-fA-F:]+)/);
            const tokens = line.trim().split(/\s+/);
            resolve({ state: tokens[tokens.length - 1].toUpperCase(), mac: macMatch ? macMatch[1] : '' });
        });
    });
}

/**
 * Returns a device name as string for sorting.
 *
 * @param {string | Record<string, string>} name - Name or translated name.
 * @returns {string} Name.
 */
function netToolsSortName(name) {
    if (name && typeof name === 'object') {
        return String(name.en || Object.values(name)[0] || '');
    }
    return String(name || '');
}

/**
 * Normalizes a MAC address for comparison (lower case, without separators).
 *
 * @param {string} mac - MAC address.
 * @returns {string} Normalized MAC address.
 */
function normalizeMac(mac) {
    return String(mac)
        .replace(/[^0-9a-fA-F]/g, '')
        .toLowerCase();
}

/**
 * Converts an IPv4 address into a 32-bit number.
 *
 * @param {string} ip - IPv4 address.
 * @returns {number} IP as number.
 */
function ipv4ToNumber(ip) {
    return ip.split('.').reduce((acc, part) => ((acc << 8) + parseInt(part, 10)) >>> 0, 0);
}

/**
 * Returns the broadcast address of the local network interface whose subnet contains the given IP.
 *
 * @param {string} ip - IPv4 address of the target device.
 * @returns {string | null} Broadcast address or null if no local interface matches.
 */
function getLocalBroadcast(ip) {
    const target = ipv4ToNumber(ip);
    for (const addresses of Object.values(os.networkInterfaces())) {
        for (const iface of addresses || []) {
            if (iface.family !== 'IPv4' || iface.internal || !iface.netmask) {
                continue;
            }
            const mask = ipv4ToNumber(iface.netmask);
            if ((ipv4ToNumber(iface.address) & mask) >>> 0 === (target & mask) >>> 0) {
                const broadcast = ((target & mask) | (~mask >>> 0)) >>> 0;
                return [24, 16, 8, 0].map(shift => (broadcast >>> shift) & 255).join('.');
            }
        }
    }
    return null;
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options]
     */
    module.exports = options => new NetTools(options);
} else {
    // otherwise start the instance directly
    new NetTools();
}
