let thisAdapter;
/**
 * Start migration
 * @param {object} adapter - The adapter Object
 * @returns {Promise<void>}
 */
async function startMigration(adapter) {
    thisAdapter = adapter;
    await localhostToDevice();
}

// Check if the localhost object is a channel and convert it to a device
async function localhostToDevice() {
    let localhost = await thisAdapter.getObjectAsync(thisAdapter.namespace + '.localhost');
    if(localhost.type === 'channel') {
        localhost.type = 'device';
    }

    await thisAdapter.setObject(thisAdapter.namespace + '.localhost', localhost);
}

module.exports = {
    startMigration: startMigration
}