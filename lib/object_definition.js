const object_definitions = {
	'alive': {
		'type': 'state',
		'common': {
			'name': {
				'en': 'Alive',
				'de': 'Erreichbar',
				'ru': 'Живой',
				'pt': 'Vivo',
				'nl': 'Levend',
				'fr': 'Vivant',
				'it': 'Vivo',
				'es': 'Vivo',
				'pl': 'Żywy',
				'zh-cn': '活着',
				'uk': 'Живий'
			},
			'def': false,
			'type': 'boolean',
			'read': true,
			'write': false,
			'role': 'indicator.reachable',
			'desc': {
				'en': 'Is the host alive?',
				'de': 'Ist der Host erreichbar?',
				'ru': 'Жив ли хост?',
				'pt': 'O host está vivo?',
				'nl': 'Is de host in leven?',
				'fr': 'L\'hôte est-il vivant?',
				'it': 'L\'host è vivo?',
				'es': '¿Está vivo el host?',
				'pl': 'Czy host żyje?',
				'zh-cn': '主机还活着吗？',
				'uk': 'Чи живий хост?'
			}
		},
		'native': {}
	},
	'time': {
		'type': 'state',
		'common': {
			'name': {
				'en': 'Time',
				'de': 'Zeit',
				'ru': 'Время',
				'pt': 'Tempo',
				'nl': 'Tijd',
				'fr': 'Temps',
				'it': 'Tempo',
				'es': 'Hora',
				'pl': 'Czas',
				'zh-cn': '时间',
				'uk': 'Час'
			},
			'def': 0,
			'type': 'number',
			'unit': 'sec',
			'read': true,
			'write': false,
			'role': 'value.interval',
			'desc': {
				'en': 'Time in seconds for the ping',
				'de': 'Zeit in Sekunden für den Ping',
				'ru': 'Время в секундах для пинга',
				'pt': 'Tempo em segundos para o ping',
				'nl': 'Tijd in seconden voor de ping',
				'fr': 'Temps en secondes pour le ping',
				'it': 'Tempo in secondi per il ping',
				'es': 'Tiempo en segundos para el ping',
				'pl': 'Czas w sekundach dla pinga',
				'zh-cn': 'ping的时间（以秒为单位）',
				'uk': 'Час в секундах для пінгу'
			}
		},
		'native': {}
	},
	'rps': {
		'type': 'state',
		'common': {
			'name': {
				'en': 'Round trips per seconds'
			},
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
			'role': 'button',
			'desc': {
				'en': 'Send a Wake on LAN packet to the host',
				'de': 'Senden Sie ein Wake on LAN-Paket an den Host',
				'ru': 'Отправить пакет Wake on LAN на хост',
				'pt': 'Envie um pacote Wake on LAN para o host',
				'nl': 'Stuur een Wake on LAN-pakket naar de host',
				'fr': 'Envoyer un paquet Wake on LAN à l\'hôte',
				'it': 'Invia un pacchetto Wake on LAN all\'host',
				'es': 'Enviar un paquete Wake on LAN al host',
				'pl': 'Wyślij pakiet Wake on LAN do hosta',
				'zh-cn': '向主机发送唤醒包',
				'uk': 'Надіслати пакет Wake on LAN на хост'
			}
		},
		'native': {}
	},
	'scan': {
		'type': 'state',
		'common': {
			'name': {
				'en': 'Scan ports',
				'de': 'Ports scannen',
				'ru': 'Сканировать порты',
				'pt': 'Portas de digitalização',
				'nl': 'Scanpoorten',
				'fr': 'Analyser les ports',
				'it': 'Scansione delle porte',
				'es': 'Puertos de escaneo',
				'pl': 'Skanowanie portów',
				'zh-cn': '扫描端口',
				'uk': 'Сканування портів'
			},
			'def': false,
			'type': 'boolean',
			'read': false,
			'write': true,
			'role': 'button',
			'desc': {
				'en': 'Scan the ports of the host',
				'de': 'Scannen Sie die Ports des Hosts',
				'ru': 'Сканировать порты хоста',
				'pt': 'Digitalize as portas do host',
				'nl': 'Scan de poorten van de host',
				'fr': 'Analysez les ports de l\'hôte',
				'it': 'Scansiona le porte dell\'host',
				'es': 'Escanee los puertos del host',
				'pl': 'Skanuj porty hosta',
				'zh-cn': '扫描主机的端口',
				'uk': 'Скануйте порти хоста'
			}
		},
		'native': {}
	},
	'ports': {
		'type': 'state',
		'common': {
			'name': {
				'en': 'Open ports',
				'de': 'Offene Ports',
				'ru': 'Открытые порты',
				'pt': 'Portas abertas',
				'nl': 'Open poorten',
				'fr': 'Ports ouverts',
				'it': 'Porte aperte',
				'es': 'Puertos abiertos',
				'pl': 'Otwarte porty',
				'zh-cn': '打开端口',
				'uk': 'Відкриті порти'
			},
			'type': 'mixed',
			'role': 'list',
			'read': true,
			'write': false,
			'desc': {
				'en': 'List of open ports that where found',
				'de': 'Liste der gefundenen offenen Ports',
				'ru': 'Список открытых портов, которые были найдены',
				'pt': 'Lista de portas abertas que foram encontradas',
				'nl': 'Lijst met open poorten die zijn gevonden',
				'fr': 'Liste des ports ouverts trouvés',
				'it': 'Elenco delle porte aperte trovate',
				'es': 'Lista de puertos abiertos que se encontraron',
				'pl': 'Lista otwartych portów, które zostały znalezione',
				'zh-cn': '找到的打开端口列表',
				'uk': 'Список відкритих портів, які були знайдені'
			}
		},
		'native': {}
	},
	'portList': {
		'type': 'state',
		'common': {
			'name': {
				'en': 'List of ports to scan',
				'de': 'Liste der zu scannenden Ports',
				'ru': 'Список портов для сканирования',
				'pt': 'Lista de portas para digitalizar',
				'nl': 'Lijst met poorten om te scannen',
				'fr': 'Liste des ports à analyser',
				'it': 'Elenco delle porte da scansionare',
				'es': 'Lista de puertos para escanear',
				'pl': 'Lista portów do skanowania',
				'zh-cn': '要扫描的端口列表',
				'uk': 'Список портів для сканування'
			},
			'type': 'string',
			'role': 'list',
			'read': true,
			'write': true
		},
		'native': {}
	}
};

module.exports = {object_definitions};
