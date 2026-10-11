const cp = require('node:child_process');
/**
 * The `p` variable stores the platform name of the current operating system.
 *
 */
const p = require('node:os').platform().toLowerCase();

/**
 * Ping and probe a given address.
 *
 * @param {string} addr - The address to ping.
 * @param {object} config - The configuration options.#
 * @param {object} [config.log] - The log handler
 * @param {boolean} [config.numeric] - Whether to use numeric values in the output.
 * @param {number} [config.timeout] - The timeout value in seconds.
 * @param {number} [config.minReply] - The minimum number of replies.
 * @param {Array} [config.extra] - Extra arguments to pass to the ping command.
 * @param {Function} callback - The callback function to invoke after the ping is completed.
 * @returns {void}
 */
function probe(addr, config, callback) {
    config = config || {};

    let ls = null;
    const log = config.log || console.log;
    let outString = '';

    config = {
        numeric: config.numeric === undefined ? true : config.numeric,
        timeout: parseInt(config.timeout === undefined ? 2 : config.timeout, 10),
        minReply: parseInt(config.minReply === undefined ? 1 : config.minReply, 10),
        extra: config.extra || [],
    };

    let args = [];
    const xFamily = ['linux', 'sunos', 'unix'];
    const regex = /=.*[<|=]([0-9]*).*TTL|ttl..*=([0-9.]*)/;

    try {
        if (xFamily.includes(p)) {
            //linux
            args = [];
            if (config.numeric !== false) {
                args.push('-n');
            }

            if (config.timeout !== false) {
                // deadline for all packets: one packet per second plus the timeout for the last answer
                args.push('-w', String(config.timeout + Math.max(config.minReply, 1) - 1));
            }

            if (config.minReply !== false) {
                args.push('-c', String(config.minReply));
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
                args.push('-n', String(config.minReply));
            }

            if (config.timeout !== false) {
                args.push('-w', String(config.timeout * 1000));
            }

            if (config.extra !== false) {
                args = args.concat(config.extra);
            }

            args.push(addr);

            log(`System command: ping.exe ${args.join(' ')}`);
            // ping.exe is resolved via the system PATH (system32)
            ls = cp.spawn('ping.exe', args);
        } else if (p === 'darwin' || p === 'freebsd') {
            //mac osx or freebsd
            args = [];
            if (config.numeric !== false) {
                args.push('-n');
            }

            if (config.timeout !== false) {
                args.push('-t', String(config.timeout + Math.max(config.minReply, 1) - 1));
            }

            if (config.minReply !== false) {
                args.push('-c', String(config.minReply));
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
        return (
            callback &&
            callback(
                new Error(
                    `ping.probe: there was an error while executing the ping program. check the path or permissions...: ${e}`,
                ),
            )
        );
    }

    ls.on('error', e => {
        callback &&
            callback(
                new Error(
                    `ping.probe: there was an error while executing the ping program. check the path or permissions...: ${e}`,
                ),
            );
        callback = null;
    });

    if (ls.stderr) {
        ls.stderr.on('data', data => log(`STDERR: ${data}`));
        ls.stderr.on('error', e => {
            callback &&
                callback(
                    new Error(
                        `ping.probe: there was an error while executing the ping program. check the path or permissions...: ${e}`,
                    ),
                );
            callback = null;
        });
    }

    if (ls.stdout) {
        ls.stdout.on('data', data => (outString += String(data)));
        ls.stdout.on('error', e => {
            callback &&
                callback(
                    new Error(
                        `ping.probe: there was an error while executing the ping program. check the path or permissions...: ${e}`,
                    ),
                );
            callback = null;
        });
    }

    ls.on('exit', code => {
        // every answer line contains the round trip time, independent of platform and language
        const times = [];
        for (const line of outString.split('\n')) {
            const m = regex.exec(line);
            if (m) {
                const value = parseFloat(m[1] || m[2]);
                if (!isNaN(value)) {
                    times.push(value);
                }
            }
        }

        const sent = Math.max(config.minReply || 1, times.length);
        const received = times.length;
        let alive;
        if (p.match(/^win/)) {
            alive = received > 0;
        } else {
            alive = !code || received > 0;
        }

        callback &&
            callback(null, {
                host: addr,
                alive,
                ms: received ? String(times[0]) : null,
                last: received ? times[times.length - 1] : null,
                min: received ? Math.min(...times) : null,
                max: received ? Math.max(...times) : null,
                avg: received ? round(times.reduce((a, b) => a + b, 0) / received) : null,
                sent,
                received,
                packetLoss: round(((sent - received) / sent) * 100),
            });
        callback = null;
    });
}

/**
 * Rounds a number to 3 decimal places.
 *
 * @param {number} value - Value.
 * @returns {number} Rounded value.
 */
function round(value) {
    return Math.round(value * 1000) / 1000;
}

function probeAsync(addr, config) {
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
    probeAsync: probeAsync,
};
