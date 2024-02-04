const cp = require('child_process');
/**
 * The `p` variable stores the platform name of the current operating system.
 *
 * @type {string}
 */
const p  = require('os').platform().toLowerCase();

/**
 * Ping and probe a given address.
 *
 * @param {string} addr - The address to ping.
 * @param {Object} config - The configuration options.
 * @param {boolean} [config.numeric=true] - Whether to use numeric values in the output.
 * @param {number} [config.timeout=2] - The timeout value in seconds.
 * @param {number} [config.minReply=1] - The minimum number of replies.
 * @param {Array} [config.extra=[]] - Extra arguments to pass to the ping command.
 * @param {function} callback - The callback function to invoke after the ping is completed.
 *
 * @return {void}
 */
function probe(addr, config, callback) {
	config = config || {};

	let ls  = null;
	const log = config.log || console.log;
	let outString = '';

	config = {
		numeric:  config.numeric  === undefined ? true : config.numeric,
		timeout:  parseInt(config.timeout  === undefined ? 2 : config.timeout, 10),
		minReply: parseInt(config.minReply === undefined ? 1 : config.minReply, 10),
		extra:    config.extra || []
	};

	let args    = [];
	const xFamily = ['linux', 'sunos', 'unix'];
	const regex   = /=.*[<|=]([0-9]*).*TTL|ttl..*=([0-9\.]*)/;

	try {
		if (xFamily.includes(p)) {
			//linux
			args = [];
			if (config.numeric !== false) {
				args.push('-n');
			}

			if (config.timeout !== false) {
				args.push('-w', config.timeout);
			}

			if (config.minReply !== false) {
				args.push('-c', config.minReply);
			}

			if (config.extra !== false) {
				args = args.concat(config.extra);
			}

			args.push(addr);
			// log(`System command: /bin/ping ${args.join(' ')}`);
			ls = cp.spawn('/bin/ping', args);
		} else if (p.match(/^win/)) {
			//windows
			args = [];
			if (config.minReply !== false) {
				args.push(`-n ${config.minReply}`);
			}

			if (config.timeout !== false) {
				args.push(`-w ${config.timeout * 1000}`);
			}

			if (config.extra !== false) {
				args = args.concat(config.extra);
			}

			args.push(addr);

			const allArgs = [
				'/s', // leave quotes as they are
				'/c', // run and exit
				// !!! the order of c and s is important - c must come last!!!
				'"', // enforce starting quote
				process.env.SystemRoot + '\\system32\\ping.exe' // command itself. Notice that you'll have to pass it quoted if it contains spaces
			].concat(args)
				.concat('"'); // enforce closing quote

			log(`System command: ${process.env.comspec || 'cmd.exe'} ${allArgs.join(' ')}`);
			// switch the command to cmd shell instead of the original command
			ls = cp.spawn(process.env.comspec || 'cmd.exe', allArgs, {windowsVerbatimArguments: true});
		} else if (p === 'darwin' || p === 'freebsd') {
			//mac osx or freebsd
			args = [];
			if (config.numeric !== false) {
				args.push('-n');
			}

			if (config.timeout !== false) {
				args.push('-t ' + config.timeout);
			}

			if (config.minReply !== false) {
				args.push('-c ' + config.minReply);
			}

			if (config.extra !== false) {
				args = args.concat(config.extra);
			}

			args.push(addr);
			log(`System command: /sbin/ping ${args.join(' ')}`);
			ls = cp.spawn('/sbin/ping', args);
		} else {
			return callback && callback(`Your platform "${p}" is not supported`);
		}
	} catch (e) {
		return callback && callback(new Error(`ping.probe: there was an error while executing the ping program. check the path or permissions...: ${e}`));
	}

	ls.on('error', e => {
		callback && callback(new Error(`ping.probe: there was an error while executing the ping program. check the path or permissions...: ${e}`));
		callback = null;
	});

	if (ls.stderr) {
		ls.stderr.on('data', data => log(`STDERR: ${data}`));
		ls.stderr.on('error', e => {
			callback && callback(new Error(`ping.probe: there was an error while executing the ping program. check the path or permissions...: ${e}`));
			callback = null;
		});
	}

	if (ls.stdout) {
		ls.stdout.on('data', data => outString += String(data));
		ls.stdout.on('error', e => {
			callback && callback(new Error(`ping.probe: there was an error while executing the ping program. check the path or permissions...: ${e}`));
			callback = null;
		});
	}

	ls.on('exit', code => {
		const lines  = outString.split('\n');
		let ms     = null;
		let result = 1;

		for (let t = 0; t < lines.length; t++) {
			const m = regex.exec(lines[t]) || '';
			if (m !== '') {
				ms = m[1] || m[2];
				result = 0;
				break;
			}
		}

		if (p.match(/^win/)) {
			result = (ms !== null);
		} else {
			result = !code;
		}

		callback && callback(null, {
			host:  addr,
			alive: result,
			ms
		});
		callback = null;
	});
}

function probeAsync(addr, config){
	return new Promise((resolve, reject) => {
      probe(addr, config, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
}

module.exports = {
	probe: probe,
	probeAsync: probeAsync
};