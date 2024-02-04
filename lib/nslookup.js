const { exec } = require("child_process");

/**
 * Resolves the host name for a given IP address using the nslookup command.
 *
 * @param {string} ip - The IP address to lookup.
 * @return {Promise<string>} - A promise that resolves to the host name of the IP address.
 *                            Rejected with an error message if the nslookup command fails or
 *                            if no host name is found for the given IP address.
 */
function nslookup(ip) {
    return new Promise((resolve, reject) => {
        exec(`nslookup ${ip}`, (error, stdout) => {
            if (error) {
                reject(error.message);
            } else {
                const outputLines = stdout.split("\n");
                const nameLine = outputLines.find(line => line.includes('name = '));
                if (nameLine) {
                    const name = nameLine.split('name = ')[1].replace(/\.$/g, '');
                    resolve(name);
                } else {
                    reject("No name found for given ip");
                }
            }
        });
    });
}

exports.nslookup = nslookup;