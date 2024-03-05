'use strict';

/*
 * Created with @iobroker/create-adapter v2.5.0
 */

const utils = require('@iobroker/adapter-core');
const os = require('os');
const dmNetTools  = require('./lib/devicemgmt.js');
const asTools = require('@all-smart/all-smart-tools');
const arp = require('@network-utils/arp-lookup');
const wol         = require('wol');
const portscanner = require('evilscan');
const oui = require('oui');
const ping        = require('./lib/ping');
const objects = require('./lib/object_definition').object_definitions;
const { nslookup } = require('./lib/nslookup');
const { CronJob } = require('cron');
const { checkPingRights } = require('./lib/utils');
const { calculateSubnetMask } = require('./lib/ip-calculator');

let timer      = null;
let isStopping = false;
let wolTries = 3;
let wolTimer = null;
let discoverTimeout = null;
let pingTimeout = null;
/**
 * @type {Array.<Object>}
 *
 * Represents a list of tasks to be executed.
 *
 * Each element in the taskList array is an object with specific properties. It looks like:
 * ```
 * {
 *     host: '192.168.11.15', // IP of the host
 *     extendedInfo: true, // Indicates if extended information should be obtained
 *     pingInterval: 60, // Time interval in seconds between two consecutive pings
 *     retries: 0, // The number of retries already made
 *     retryCounter: 0, // Used to count the number of retries
 *     stateAlive: { channel: '84b8b87e0294', state: 'alive' }, // Information about the 'alive' state
 *     stateTime: { channel: '84b8b87e0294', state: 'time' }, // Information about 'time' state
 *     stateRps: { channel: '84b8b87e0294', state: 'rps' } // Information about 'rps' state
 * }
 * ```
 */
let taskList = [];
let cronJob = null;


const FORBIDDEN_CHARS = /[\]\[*,;'"`<>\\?]/g;

class NetTools extends utils.Adapter {
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
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
		this.asTools = new asTools(this);
		if (!this.config.licenseKey) {
			this.log.error(
				'License Key is not set! Enter a valid license key in the adapter settings.'
			);
		} else {

			this.extendHostInformation();
			await this.asTools.checkObjectsUpdate();
			if(this.asTools.isLxc) {
				checkPingRights();
			}
			this.config.pingInterval = parseInt(this.config.pingInterval, 10);

			if (this.config.pingInterval < 5) {
				this.log.warn('Poll interval is too short. Reset to 5s.');
				this.config.pingInterval = 5;
			}

			const preparedObjects = await this.prepareObjectsByConfig();
			this.pingAll();

			if(this.config.autoSearch === true && this.config.searchSchedule !== ''){
				this.log.info('Auto search is enabled');
				cronJob = new CronJob(this.config.searchSchedule, () => {
					this.log.debug('Start auto search');
                    this.discover();
                });
                cronJob.start();
			}

			this.subscribeStates('*discover');
			this.subscribeStates('*wol');
			this.subscribeStates('*scan');
			this.subscribeObjects('*');

		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			if (wolTimer) {
				clearTimeout(wolTimer);
				wolTimer = null;
			}
			if (discoverTimeout) {
				clearTimeout(discoverTimeout);
				discoverTimeout = null;
			}
			if(pingTimeout) {
				clearTimeout(pingTimeout);
				pingTimeout = null;
			}
			isStopping = true;
			if(cronJob){
				cronJob.stop();
			}

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	/**
	 * Is called if a subscribed object changes
	 * @param {string} id
	 * @param {ioBroker.Object | null | undefined} obj
	 */
	onObjectChange(id, obj) {
		if (obj) {
			// The object was changed

			if (obj.type === 'device') {
				// Look if ther is a host entry in taskList for the ip
				const hostEntry = taskList.find(entry => entry.host === obj.native.ip);
                if (hostEntry) {
                    hostEntry.pingInterval = obj.native.pingInterval;
                    hostEntry.retries = obj.native.retries;
                }
				taskList = taskList.map(entry => entry.host === hostEntry.host ? hostEntry : entry);
            }
		} else {
			// The object was deleted
			//this.log.info(`object ${id} deleted`);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	async onStateChange(id, state) {
		if (state) {
			const tmp = id.split('.');
			const dp = tmp.pop();
			switch (dp) {
				case 'discover':
					if (state.val) {
						this.discover();
					}
					break;
				case 'wol':
					if (state.val) {
						const parentId = await this.getParentId(id);
						const obj = await this.getObjectAsync(parentId);
						if(obj === null || obj === undefined){
							this.log.warn(`Object ${parentId} not found`);
							return;
						}
						this.wake(obj.native.mac);
					}
					break;
				case 'scan':
					if (state.val) {
						const parentId = await this.getParentId(id);
						const obj = await this.getObjectAsync(parentId);
						if(obj === null || obj === undefined){
							this.log.warn(`Object ${parentId} not found`);
							return;
						}
						let ports = await this.getStateAsync(`${id}.portList`);
						if (!ports) {
							ports = this.config.portList;
						}

						this.portScan(parentId, obj.native.ip, ports);
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
		if (typeof obj === 'object' && obj.message && !obj.command.includes('dm:')) {
			if (obj.command === 'send') {
				switch (obj.command) {
					case 'ping': {
						// Try to ping one IP or name
						if (obj.callback && obj.message) {
							//ping.probe(obj.message, {log: this.log.debug}, (err, result) =>
							ping.probe(obj.message, {}, (err, result) =>
								this.sendTo(obj.from, obj.command, {result}, obj.callback));
						}
						break;
					}
					case 'getMac': {
						if (obj.callback && obj.message) {
							this.sendTo(obj.from, obj.command, await arp.toMAC(obj.message), obj.callback);
						}
						break;
					}
					case 'wol': {
						if (obj.callback && obj.message) {
							this.wake(obj.message);
							this.sendTo(obj.from, obj.command, null , obj.callback);
						}
						break;
					}
					case 'deleteDevice': {
						await this.delDevice(obj.message)
							.then( () => {
								if (obj.callback) this.sendTo(obj.from, obj.command, 'Device deleted', obj.callback);
							});
						break;
					}
					case 'addDevice': {
						await this.addDevice(obj.message.ip, obj.message.name, obj.message.enabled, obj.message.mac)
							.then( () => {
								if (obj.callback) this.sendTo(obj.from, obj.command, 'Device added', obj.callback);
							});
						break;
					}
					case 'updateDevice': {
						await this.updateDevices(obj.message);
						break;
					}
				}
			}
		}
	}

	/**
	 *
	 * @param {string} id - object id for host
	 * @param {string} ip - ip address like 127.0.0.1
	 * @param {string} ports - string of ports to scan e.g. '80,443,8080'
	 */
	async portScan(id, ip, ports){
		const alive = await this.getStateAsync(id + '.alive');
		if (id === 'localhost' || alive?.val === true) {
			this.log.info(`Scanning for open ports (${ports ? ports : '0-65535'}) at ${id}, please wait`);
			await this.setStateAsync(id + '.ports', {val: 'Scanning, please wait', ack: true});
			let openPorts = [];
			let options = {
				target: ip,
				port: ports ? ports : '0-65535',
				status: 'O', // Timeout, Refused, Open, Unreachable
				banner: false,
				reverse: false
			};

			const scanner = new portscanner(options);

			scanner.on('result', function (data) {
				// fired when item is matching options
				if (data.status !== 'closed (refused)') {
					openPorts.push(JSON.stringify(data.port));
				}

			});

			scanner.on('error', (err) => {
				this.log.error(err.toString());
			});

			scanner.on('done',  () => {
				// finished !
				this.setState(id + '.ports', {val: JSON.stringify(openPorts), ack: true});
				this.log.info('Port scan finished');
			});

			scanner.run();
		} else {
			await this.setStateAsync(id + '.ports', {val: `Port scan aborted, device ${id} is not alive`, ack: true})
			this.log.info(`Port scan aborted, device ${id} is not alive`);
		}
	}

	async getParentId(id){
		let parentId = id.replace(this.namespace + '.', '');
		parentId = parentId.replace(/\..*/g, '');
		return this.namespace + '.' + parentId;
	}

	wake(mac){
		wol.wake(mac, (err, res) => {
			wolTries = wolTries - 1;
			if (err) {
				this.log.debug('Wake-on-LAN error: ' + err);
				wolTries = 3;
			}
			if (wolTries > 0){
				wolTimer = setTimeout(() => {
					this.wake(mac);
				}, 750);
			} else if (wolTries === 0){
				wolTries = 3;
			}
			this.log.debug('Wake on LAN trie ' + (wolTries + 1) + ': ' + res);
		});
	}

	async discover(){
		const oldDevices = await this.getDevicesAsync();

		try {
			const ips = this.getIpRange();
			const decimalSeparator = getDecimalSeparator();
			const promises = [];
			for (let i = 0; i < ips.length; i += 10){
				for(let j = 0; j < 10; j++) {
					if (i + j < ips.length) {
						promises.push(this.handleDiscoveryProbe(ips[i+j], oldDevices, decimalSeparator));
					}
				}
				await Promise.all(promises);
			}
			this.log.info('Discovery finished')
			return true;
		} catch (err) {
			this.log.warn('Discovery faild: ' + err);
			return false;
		}
	}

	async handleDiscoveryProbe(ip, oldDevices, decimalSeparator){
		return new Promise(async (resolve) => {
			ping.probe(ip, {timeout: parseFloat(`0${decimalSeparator}25`), log: this.log.info}, async (error, result) => {
				if (result.alive === true) {
					result.mac = await arp.toMAC(result.host);
					if (result.mac !== undefined && result.mac !== null) {
						result.vendor = oui(result.mac)
					} else {
						return;
					}
					try {
						result.name = await nslookup(result.host);
					} catch (error) {
						result.name = result.host;
					}
					let exists = false;

					for (const entry of oldDevices) {
						if (entry.native !== undefined && entry.native.mac === result.mac) {
							exists = true;
						}
						if (exists === true && entry.native !== undefined && entry.native.ip !== result.host) {
							const idName = result.mac.replace(/:/g, '');
							await this.extendObjectAsync(this.namespace + '.' + idName, {
								native: {
									ip: result.host,
									vendor: result.vendor
								}
							});
						}
					}
					if (!exists) {
						await this.addDevice(result.host, result.name, true, result.mac);
					}
				}
				resolve(true);
			});
		})
	}

	/**
	 * Retrieves the range of IP addresses based on the given configuration.
	 *
	 * @returns {Array} - An array of IP addresses in the specified range.
	 */
	getIpRange(){
		const nets = os.networkInterfaces();
		let iface;
		let ips = [];
		let startIP, endIP;
		if(nets[this.config.interface] && this.config.startIp === '' && this.config.endIp === '') {
			iface = nets[this.config.interface].filter(net => net.family === 'IPv4');
			const cidr = iface[0].cidr.split('/');
			const subnetRange = calculateSubnetMask(cidr[0], parseInt(cidr[1]));
			startIP = subnetRange.ipLowStr.split(".").map(Number);
            endIP = subnetRange.ipHighStr.split(".").map(Number);
		} else {
			// Use defined range from config
			startIP = this.config.startIp.split(".").map(Number);
			endIP = this.config.endIp.split(".").map(Number);
		}

		while(!(startIP[0] > endIP[0] || (startIP[0] === endIP[0] && (startIP[1] > endIP[1] || (startIP[1] === endIP[1] && (startIP[2] > endIP[2] || (startIP[2] === endIP[2] && startIP[3] > endIP[3]))))))){
			ips.push(startIP.join('.'));
			startIP[3]++;
			for(let i = 3; i > 0; i--){
				if(startIP[i] > 254){
					startIP[i] = 0;
					startIP[i-1]++;
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
	async addDevice(ip, name, enabled, mac, pingInterval, retries){
		let idName, vendor = '';
		if (!mac || mac === '') {
			mac = await arp.toMAC(ip);

			this.log.info(`MAC address for ${ip}: ${mac}`);

			if(!mac) {
				return;
			}
			mac = mac.toLowerCase();

			if (mac === '(unvollständig)' || mac === undefined) {
				this.log.info(`Could not find the mac address for ${ip}`);
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



		await this.extendObjectAsync(this.namespace + '.' + idName, {
			type: 'device',
			common: {
				name: name || ip
			},
			native: {
				enabled: enabled,
				pingInterval: pingInterval ? pingInterval : this.config.pingInterval,
				retries: retries ? retries : 0,
				ip: ip,
				mac: mac,
				vendor: vendor
			}
		});

		for (const obj in objects){
			await this.extendObjectAsync(idName + '.' + obj, objects[obj]);
		}


		const preparedObjects = await this.prepareObjectsByConfig();
		this.pingAll();
	}

	/**
	 * Delete device
	 * @param {string} deviceId
	 * @return {Promise<boolean>}
	 */
	async delDevice(deviceId) {
		const name = deviceId.replace(/net-tools\.\d\./, '');
		const res = await this.deleteDeviceAsync(name);
		if(res !== null) {
			this.log.info(`${name} deleted`);
			// Delete device from taskList
			for(const i in taskList){
				if(taskList[i] === null){
					continue;
				}
				if(taskList[i].stateAlive.channel === name){
					taskList.splice(parseInt(i), 1, null);
				}
			}

			return true;
		} else {
			this.log.error(`Can not delete device ${name}: ${JSON.stringify(res)}`);
			return false;
		}
	}

	/**
	 * Update devices
	 * @param {object} devices - array of devices
	 * @return {Promise<void>}
	 */
	async updateDevices(devices){
		for(const i in devices){
			const mac = devices[i].mac.replace(/:/g, '').toLowerCase();
			const allDevices = await this.getDevicesAsync();
			let deleted = true;
			for(const d in allDevices){
				if(`${this.namespace}.${mac}` !== allDevices[d]._id){
					deleted = true;
				} else {
					deleted = false;
					break;
				}
			}
			if(deleted === true){
				this.log.info(`Delete device ${mac}`);
				await this.delDevice(mac);
			} else {
				await this.extendObjectAsync(`${this.namespace}.${mac}`, {
					common: {
						name: devices[i].name
					},
					native: devices[i]
				});
			}
		}
	}


	pingAll() {
		for(const host in taskList) {
			this.pingDevice(host);
		}
	}

	/**
	 * Pings a device to check its availability.
	 *
	 * @param {string} host - The hostname or IP address of the device to ping.
	 *
	 * @return {undefined}
	 */
	pingDevice(host) {
		if(!taskList[host]) {
			return;
		}
		ping.probe(taskList[host].host, { log: this.log.debug }, (err, result) => {
			err && this.log.error(err);

			if(taskList.length === 0 || taskList[host] === null || taskList[host] === undefined){
				return;
			}

			if (result) {
				if (result.alive === true) {
						this.setState(taskList[host].stateAlive.channel + '.alive', {val: true, ack: true});
						this.setState(taskList[host].stateTime.channel + '.time', {
							val: result.ms === null ? 0 : result.ms / 1000,
							ack: true
						});
						let rps = 0;
						if (result.alive && result.ms !== null && result.ms > 0) {
							rps = result.ms <= 1 ? 1000 : 1000.0 / result.ms;
						}
						this.setState(taskList[host].stateRps.channel + '.rps', {val: rps, ack: true});
						taskList[host].retryCounter = 0;
				} else if(taskList[host].retryCounter <= taskList[host].retries) {
					taskList[host].retryCounter++;
				} else {
					this.setState(taskList[host].stateAlive.channel + '.alive', { val: false, ack: true });
					taskList[host].retryCounter = 0;
				}
			}

			if(!isStopping) {
				// Planen Sie den nächsten Ping basierend auf dem Intervall
				pingTimeout = setTimeout(() => this.pingDevice(host), taskList[host].pingInterval * 1000);
			}
		});
	}


	/**
	 * Prepare objects for host
	 * @param {object} config - config object
	 * @return {{ping_task: {stateTime: {channel: (string|*), state: string}, stateRps: {channel: (string|*), state: string}, host: *, extendedInfo: boolean, pingInterval: number, retries: number, retryCounter: number, stateAlive: {channel: (string|*), state: string}}}}
	 */
	prepareObjectsForHost(config) {
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
				pingInterval: config.pingInterval ? config.pingInterval : this.config.pingInterval,
				retries: config.retries ? config.retries : 0,
				retryCounter: 0,
				stateAlive: stateAliveID,
				stateTime: stateTimeID,
				stateRps: stateRpsID
			}
		};
	}

	/**
	 * Get all devices
	 * @return {Promise<{}>}
	 */
	async prepareObjectsByConfig() {
		taskList = [];
		const objs = await this.getDevicesAsync();

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

			const config = this.prepareObjectsForHost(device);

			taskList.push(config.ping_task);
		});

		return true;
	}

	extendHostInformation(){
		if (this.config.portScan === true){
			const ports = this.config.portList;
			this.portScan('localhost', '127.0.0.1', ports);
		}
	}

}

function getDecimalSeparator() {
	const numberWithDecimalSeparator = 1.1;
	return Intl.NumberFormat().format(numberWithDecimalSeparator).substring(1, 2);
}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new NetTools(options);
} else {
	// otherwise start the instance directly
	new NetTools();
}
