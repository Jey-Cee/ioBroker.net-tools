const os = require('os');
const { exec } = require('child_process');


function checkPingRights() {
    if (os.type() === 'Linux') {
        exec('setcap -v cap_net_raw+p /bin/ping', (error, stdout, stderr) => {

            if (stdout) {
                if (stdout.includes('differs in [p]')) {
                    exec('sudo setcap cap_net_raw+p /bin/ping', (error, stdout, stderr) => {
                        if (stderr) {
                            console.error(`Error setting permissions: ${error}`);
                        } else {
                            console.log('Permission set for pinging.');
                        }
                    });
                }
            }
        });
    }
}

module.exports = {
    checkPingRights: checkPingRights
}