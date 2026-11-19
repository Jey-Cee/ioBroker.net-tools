/**
 * The answer of the message `help`: what the instance answers, written for an AI agent (e.g. ioBroker.pi-agent, or
 * the MCP server with `send_to`) and for script authors. Keep it in sync with `onMessage` in main.js, the README and
 * the Device Manager (dm-utils answers the `dm:` commands itself).
 */

/** The commands the instance answers (`dm:*` by the Device Manager of dm-utils); `write` = it changes something */
const COMMANDS = [
    { command: 'help', write: false },
    { command: 'ping', write: false },
    { command: 'portScan', write: false },
    { command: 'getMac', write: false },
    { command: 'wake', write: true },
    { command: 'wol', write: true },
    { command: 'addDevice', write: true },
    { command: 'deleteDevice', write: true },
    { command: 'updateDevice', write: true },
    { command: 'dm:instanceInfo', write: false },
    { command: 'dm:loadDevices', write: false },
    { command: 'dm:deviceInfo', write: false },
    { command: 'dm:deviceStatus', write: false },
    { command: 'dm:deviceDetails', write: false },
    { command: 'dm:instanceAction', write: true },
    { command: 'dm:deviceAction', write: true },
    { command: 'dm:deviceControl', write: true },
    { command: 'dm:deviceControlState', write: false },
    { command: 'dm:deviceLoadProgress', write: false },
    { command: 'dm:actionProgress', write: true },
];

const HELP = `ioBroker.net-tools: watches devices in the network. Every device (found by the discovery or added) is pinged in
an interval and gets the states alive, latency and packet loss; it can scan open TCP ports, watch services (TCP
ports) and switch computers on with Wake-on-LAN. Needs a license key in the settings for the cyclic part; the
commands below answer also without it. An agent can check an address on demand, scan its ports, find the MAC of
an IP, wake a computer and add or remove watched devices.

Commands (sendTo net-tools.0):
- ping "<ip or host name>": one ping now (one packet): {result: {host, alive, ms (round trip of the first answer
  in ms, as a text), last, min, max, avg (ms), sent, received, packetLoss (%)}}; if ping could not run:
  {result: {host, alive: false, ms: null, error}}.
- portScan "<ip>" or {ip, ports?}: the open TCP ports, without touching states: {host, ports: [open port numbers],
  error?}. ports: "22,80,443" or a range "20-30" (text) or an array; default the port list of the settings.
  Takes up to 30 s.
- getMac "<ip>": the MAC address of an IP from the ARP table of the ioBroker host (only its own subnet): the MAC
  as a text, or null if not known.
- wake "<mac>" (wol is the same): sends Wake-on-LAN 3 times, 750 ms apart, to 255.255.255.255 and the broadcast
  address of the subnet of the device (with "Wake-on-LAN with IP" of a known device: to its IP and the broadcast
  of its subnet): true if a packet was sent, false (no MAC given, or sending failed).
- addDevice {ip, name?, enabled?, mac?}: watches a new device (object net-tools.0.<mac without colons>); without
  mac it is taken from ARP and nothing is created if none is found. enabled true = ping it. Answer "Device added"
  (also when nothing was created: check info.devices).
- deleteDevice "<device id>" (net-tools.0.aabbccddeeff or aabbccddeeff): deletes the device and all its states.
  Answer "Device deleted".
- updateDevice (gives no answer) and the Device Manager of the admin (answered by dm-utils): dm:instanceInfo,
  dm:loadDevices, dm:deviceInfo, dm:deviceStatus, dm:deviceDetails, dm:deviceControlState, dm:deviceLoadProgress
  (read) and dm:instanceAction, dm:deviceAction, dm:deviceControl, dm:actionProgress (add, discover, rename,
  change, delete devices, scan ports): for the settings, not for agents.

States (net-tools.0.*):
- info.devices: JSON [{id, name, ip, mac}] of all watched devices; the ids are the device objects below.
- <device>.alive: true = answers (ping, or ARP with "Extended detection"); time (s), ping, pingMin, pingMax,
  pingAvg (ms), packetLoss (%), rps; services.port_<port>: a watched TCP service is reachable.
- <device>.wol (button): true sends Wake-on-LAN to the device. <device>.scan (button): true scans the ports of
  <device>.portList (or the settings) if the device is alive and writes the open ones into <device>.ports.
- discover (button): true searches the subnet of the ioBroker host for new devices and adds them (takes a while).

How to talk to the user:
- Name devices by their name (info.devices), not by MAC or ID.
- A device that does not answer may still be on (firewall, a phone asleep): say "does not answer", not "off".
- Only on the user's request: wake / wol (switches a computer on), addDevice, deleteDevice (ask for confirmation,
  the states and their history go), discover.
- Port scans only of devices of the user's own network.`;

module.exports = {
    COMMANDS,
    HELP,
};
