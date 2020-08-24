const object_definitions = {
    'alive': {
        'type': 'state',
        'common': {
            'name': 'Alive',
            'def': false,
            'type': 'boolean',
            'read': true,
            'write': false,
            'role': 'indicator.reachable'
        },
        'native': {}
    },
    'time': {
        'type': 'state',
        'common': {
            'name': 'Time',
            'def': 0,
            'type': 'number',
            'unit': 'sec',
            'read': true,
            'write': false,
            'role': 'value.interval'
        },
        'native': {}
    },
    'rps': {
        'type': 'state',
        'common': {
            'name': 'Round trips per seconds',
            'def': 0,
            'min': 0,
            'max': 1000,
            'type': 'number',
            'unit': 'hz',
            'read': true,
            'write': false,
            'role': 'value'
        },
        'native': {}
    },
    'wol': {
        'type': 'state',
        'common': {
            'name': 'Wake on LAN',
            'def': false,
            'type': 'boolean',
            'read': false,
            'write': true,
            'role': 'button'
        },
        'native': {}
    },
    'scan': {
        'type': 'state',
        'common': {
            'name': 'Scan ports',
            'def': false,
            'type': 'boolean',
            'read': false,
            'write': true,
            'role': 'button'
        },
        'native': {}
    },
    'ports': {
        'type': 'state',
        'common': {
            'name': 'Open ports',
            'type': 'array',
            'role': "list",
            'read': true,
            'write': false
        },
        'native': {}
    }
}

module.exports = {object_definitions};
