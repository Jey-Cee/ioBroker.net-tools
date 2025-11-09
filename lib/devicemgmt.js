const dmUtils = require('@iobroker/dm-utils');

class dmNetTools extends dmUtils.DeviceManagement {

	async getInstanceInfo() {
		const data = {
			...super.getInstanceInfo(),
			apiVersion: 'v1',
			actions: [
				{
					id: 'newDevice',
					icon: 'fas fa-plus',
					title: '',
					description: {
						en: 'Add new device to Net Tools',
						de: 'Neues Gerät zu Net Tools hinzufügen',
						ru: 'Добавить новое устройство в Net Tools',
						pt: 'Adicionar novo dispositivo ao Net Tools',
						nl: 'Voeg nieuw apparaat toe aan Net Tools',
						fr: 'Ajouter un nouvel appareil à Net Tools',
						it: 'Aggiungi nuovo dispositivo a Net Tools',
						es: 'Agregar nuevo dispositivo a Net Tools',
						pl: 'Dodaj nowe urządzenie do Net Tools',
						'zh-cn': '将新设备添加到Net Tools',
						uk: 'Додати новий пристрій до Net Tools'
					},
					handler: this.handleNewDevice.bind(this)
				},
				{
					id: 'discover',
					icon: 'fas fa-search',
					title: '',
					description: {
						en: 'Discover new devices',
						de: 'Neue Geräte suchen',
						ru: 'Обнаружить новые устройства',
						pt: 'Descubra novos dispositivos',
						nl: 'Ontdek nieuwe apparaten',
						fr: 'Découvrir de nouveaux appareils',
						it: 'Scopri nuovi dispositivi',
						es: 'Descubrir nuevos dispositivos',
						pl: 'Odkryj nowe urządzenia',
						'zh-cn': '发现新设备',
						uk: 'Виявити нові пристрої'
					},
					handler: this.handleDiscover.bind(this)
				}
			],
		};
		return data;
	}

	async handleNewDevice(context) {
		this.adapter.log.info('handleNewDevice');
		const result = await context.showForm({
			type : 'panel',
			items: {
				name: {
					type: 'text',
					trim: false,
					label: {
						en: 'Name',
						de: 'Name',
						ru: 'Имя',
						pt: 'Nome',
						nl: 'Naam',
						fr: 'Nom',
						it: 'Nome',
						es: 'Nombre',
						pl: 'Nazwa',
						'zh-cn': '名称',
						uk: 'Ім\'я'
					}
				},
				ip: {
					type: 'text',
					trim: true,
					placeholder: '192.168.0.1',
					label: {
						en: 'IP address',
						de: 'IP-Adresse',
						ru: 'IP адрес',
						pt: 'Endereço de IP',
						nl: 'IP adres',
						fr: 'Adresse IP',
						it: 'Indirizzo IP',
						es: 'Dirección IP',
						pl: 'Adres IP',
						'zh-cn': 'IP地址',
						uk: 'IP адреса'
					}
				},
				mac: {
					type: 'text',
					trim: true,
					placeholder: '00:00:00:00:00:00',
					label: {
						en: 'MAC address',
						de: 'MAC-Adresse',
						ru: 'MAC адрес',
						pt: 'Endereço MAC',
						nl: 'MAC adres',
						fr: 'Adresse MAC',
						it: 'Indirizzo MAC',
						es: 'Dirección MAC',
						pl: 'Adres MAC',
						'zh-cn': 'MAC地址',
						uk: 'MAC адреса'
					},
				},
				pingInterval: {
					type: 'number',
					min: 5,
					unit: 's',
					label: {
						en: 'Ping interval',
						de: 'Ping-Intervall',
						ru: 'Интервал пинга',
						pt: 'Intervalo de ping',
						nl: 'Ping-interval',
						fr: 'Intervalle de ping',
						it: 'Intervallo di ping',
						es: 'Intervalo de ping',
						pl: 'Interwał ping',
						'zh-cn': 'Ping间隔',
						uk: 'Інтервал пінгу'
					}
				},
				retries: {
					type: 'number',
					label: {
						en: 'Retries',
						de: 'Wiederholungen',
						ru: 'Повторы',
						pt: 'Tentativas',
						nl: 'Pogingen',
						fr: 'Essais',
						it: 'Tentativi',
						es: 'Intentos',
						pl: 'Próby',
						'zh-cn': '重试',
						uk: 'Повтори'
					},
				},
				enabled: {
					type: 'checkbox',
					label: {
						en: 'Ping Enabled',
						de: 'Ping aktiviert',
						ru: 'Ping включен',
						pt: 'Ping ativado',
						nl: 'Ping ingeschakeld',
						fr: 'Ping activé',
						it: 'Ping abilitato',
						es: 'Ping habilitado',
						pl: 'Ping włączony',
						'zh-cn': 'Ping已启用',
						uk: 'Ping увімкнено'
					}
				}
			}
		},
		{
			data: {
				name: '',
				ip: '',
				mac: '',
				pingInterval: this.adapter.config.pingInterval,
				retries: 0,
				enabled: true
			},
			title: {
				en: 'Add new device',
				de: 'Neues Gerät hinzufügen',
				ru: 'Добавить новое устройство',
				pt: 'Adicionar novo dispositivo',
				nl: 'Voeg nieuw apparaat toe',
				fr: 'Ajouter un nouvel appareil',
				it: 'Aggiungi nuovo dispositivo',
				es: 'Agregar nuevo dispositivo',
				pl: 'Dodaj nowe urządzenie',
				'zh-cn': '添加新设备',
				uk: 'Додати новий пристрій'
			}
		}
		);
		if(result === null || result === undefined) {
			return { refresh: false };
		}
		// Check if mac is valid
		if(result.mac !== '') {
			// Check mac has the right format
			if(!result.mac.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)) {
				await context.showMessage({
					en: `MAC address ${result.mac} is not valid`,
					de: `MAC-Adresse ${result.mac} ist ungültig`,
					ru: `MAC адрес ${result.mac} недействителен`,
					pt: `Endereço MAC ${result.mac} não é válido`,
					nl: `MAC-adres ${result.mac} is ongeldig`,
					fr: `L'adresse MAC ${result.mac} n'est pas valide`,
					it: `L'indirizzo MAC ${result.mac} non è valido`,
					es: `La dirección MAC ${result.mac} no es válida`,
					pl: `Adres MAC ${result.mac} jest nieprawidłowy`,
					'zh-cn': `MAC地址 ${result.mac} 无效`,
					uk: `MAC адреса ${result.mac} недійсна`
				});
				return { refresh: false };
			}
		}
		// Check if ip was entered
		if(result.ip === '') {
			await context.showMessage({
				en: `Please enter an IP address`,
				de: `Bitte geben Sie eine IP-Adresse ein`,
				ru: `Пожалуйста, введите IP адрес`,
				pt: `Por favor, digite um endereço de IP`,
				nl: `Voer een IP-adres in`,
				fr: `Veuillez saisir une adresse IP`,
				it: `Inserisci un indirizzo IP`,
				es: `Por favor ingrese una dirección IP`,
				pl: `Proszę wprowadzić adres IP`,
				'zh-cn': `请输入IP地址`,
				uk: `Будь ласка, введіть IP адресу`
			});
			return { refresh: false };
		}
		// Check if ip is valid
		if(result.ip !== '') {
			// Check ip has the right format
			if(!result.ip.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
				await context.showMessage({
					en: `IP address ${result.ip} is not valid`,
					de: `IP-Adresse ${result.ip} ist ungültig`,
					ru: `IP адрес ${result.ip} недействителен`,
					pt: `Endereço de IP ${result.ip} não é válido`,
					nl: `IP-adres ${result.ip} is ongeldig`,
					fr: `L'adresse IP ${result.ip} n'est pas valide`,
					it: `L'indirizzo IP ${result.ip} non è valido`,
					es: `La dirección IP ${result.ip} no es válida`,
					pl: `Adres IP ${result.ip} jest nieprawidłowy`,
					'zh-cn': `IP地址 ${result.ip} 无效`,
					uk: `IP адреса ${result.ip} недійсна`
				});
				return { refresh: false };
			}
		}
		this.adapter.addDevice(result.ip, result.name, result.enabled, result.mac, result.pingInterval, result.retries);
		return { refresh: true };
	}

	async handleDiscover(context) {
		context.showMessage(
			'Dicovery started. This process will take a few minutes until all devices are discovered. You can close this dialog and continue working in the meantime.');
		this.adapter.discover();
		return { refresh: false };
	}

	async listDevices() {
		const devices = await this.adapter.getDevicesAsync();
		const arrDevices = [];
		for (const i in devices) {
			const status = {};

			let hasDetails = false;
			if(devices[i].native.ip || devices[i].native.mac || devices[i].native.vendor || devices[i]._id.includes('localhost')) {
				hasDetails = true;
			}
			const alive = await this.adapter.getStateAsync(`${devices[i]._id}.alive`);
			if(alive !== null && alive !== undefined) {
				status.connection = alive.val ? 'connected' : 'disconnected';
			}

			const actions = [
				{
					id: 'delete',
					icon: 'fa-solid fa-trash-can',
					description: {
						en: 'Delete this device',
						de: 'Gerät löschen',
						ru: 'Удалить это устройство',
						pt: 'Excluir este dispositivo',
						nl: 'Verwijder dit apparaat',
						fr: 'Supprimer cet appareil',
						it: 'Elimina questo dispositivo',
						es: 'Eliminar este dispositivo',
						pl: 'Usuń to urządzenie',
						'zh-cn': '删除此设备',
						uk: 'Видалити цей пристрій'
					},
					handler: this.handleDeleteDevice.bind(this)
				},
				{
					id: 'rename',
					icon: 'fa-solid fa-pen',
					description: {
						en: 'Rename this device',
						de: 'Gerät umbenennen',
						ru: 'Переименовать это устройство',
						pt: 'Renomear este dispositivo',
						nl: 'Hernoem dit apparaat',
						fr: 'Renommer cet appareil',
						it: 'Rinomina questo dispositivo',
						es: 'Renombrar este dispositivo',
						pl: 'Zmień nazwę tego urządzenia',
						'zh-cn': '重命名此设备',
						uk: 'Перейменуйте цей пристрій'
					},
					handler: this.handleRenameDevice.bind(this)
				},
				{
					id: 'settings',
					icon: 'settings',
					description: {
						en: 'Settings',
						de: 'Einstellungen',
						ru: 'Настройки',
						pt: 'Configurações',
						nl: 'Instellingen',
						fr: 'Paramètres',
						it: 'Impostazioni',
						es: 'Configuraciones',
						pl: 'Ustawienia',
						'zh-cn': '设定值',
						uk: 'Налаштування'
					},
					handler: this.handleSettingsDevice.bind(this)
				}
			];

			const res = {
				id: devices[i]._id,
				name: devices[i].common.name,
				icon: devices[i].common.icon ? devices[i].common.icon : null,
				manufacturer: devices[i].native.manufacturer ? devices[i].native.manufacturer : '',
				model: devices[i].native.name ? devices[i].native.name : '',
				status: status,
				hasDetails: hasDetails,
				actions: actions
			};

			if(devices[i]._id.includes('localhost')) {
				res.actions = [];
			}
			arrDevices.push(res);
		}
		return arrDevices;
	}

	/**
	 * Handle delete device
	 * @param {string} id - id of device
	 * @param {object} context - context object
	 * @returns {Promise<{refresh: boolean}>}
	 */
	async handleDeleteDevice(id, context) {
		// Remove namespace from context
		const name = id.replace(/net-tools\.\d\./, '');

		const response = await context.showConfirmation({
			en: `Do you really want to delete the device ${name}?`,
			de: `Möchten Sie das Gerät ${name} wirklich löschen?`,
			ru: `Вы действительно хотите удалить устройство ${name}?`,
			pt: `Você realmente deseja excluir o dispositivo ${name}?`,
			nl: `Weet u zeker dat u het apparaat ${name} wilt verwijderen?`,
			fr: `Voulez-vous vraiment supprimer l'appareil ${name} ?`,
			it: `Vuoi davvero eliminare il dispositivo ${name}?`,
			es: `¿Realmente desea eliminar el dispositivo ${name}?`,
			pl: `Czy na pewno chcesz usunąć urządzenie ${name}?`,
			'zh-cn': `您真的要删除设备 ${name} 吗？`,
			uk: `Ви дійсно бажаєте видалити пристрій ${name}?`
		});

		// delete device
		if(response === false) {
			return {refresh: false};
		}
		const result = this.adapter.delDevice(name);
		if(result === false) {
			await context.showMessage({
				en: `Can not delete device ${name}`,
				de: `Gerät ${name} kann nicht gelöscht werden`,
				ru: `Невозможно удалить устройство ${name}`,
				pt: `Não é possível excluir o dispositivo ${name}`,
				nl: `Kan apparaat ${name} niet verwijderen`,
				fr: `Impossible de supprimer l'appareil ${name}`,
				it: `Impossibile eliminare il dispositivo ${name}`,
				es: `No se puede eliminar el dispositivo ${name}`,
				pl: `Nie można usunąć urządzenia ${name}`,
				'zh-cn': `无法删除设备 ${name}`,
				uk: `Не вдалося видалити пристрій ${name}`
			});
			return {refresh: false};
		} else {
			return {refresh: true};
		}
	}

	async handleRenameDevice(id, context) {
		const result = await context.showForm({
			type : 'panel',
			items: {
				newName: {
					type: 'text',
					trim: false,
					placeholder: '',
				}
			}}, {
			data: {
				newName: ''
			},
			title: {
				en: 'Enter new name',
				de: 'Neuen Namen eingeben',
				ru: 'Введите новое имя',
				pt: 'Digite um novo nome',
				nl: 'Voer een nieuwe naam in',
				fr: 'Entrez un nouveau nom',
				it: 'Inserisci un nuovo nome',
				es: 'Ingrese un nuevo nombre',
				pl: 'Wpisz nowe imię',
				'zh-cn': '输入新名称',
				uk: 'Введіть нове ім\'я'
			}
		});
		if(result === null || result === undefined) {
			return {refresh: false};
		}
		if(result.newName === undefined || result.newName === '') {
			return {refresh: false};
		}
		const obj = {
			common: {
				name: result.newName
			}
		};
		const res = await this.adapter.extendObject(id, obj);
		this.adapter.log.info(JSON.stringify(res));
		if(res === null) {
			this.adapter.log.warn(`Can not rename device ${context.id}: ${JSON.stringify(res)}`);
			return {refresh: false};
		}
		return {refresh: true};
	}


	async handleSettingsDevice(id, context) {
		// Get settings from device native object
		const device = await this.adapter.getObjectAsync(id);
		if(device === null) {
			this.adapter.log.warn(`Can not find device ${id}`);
			return {refresh: false};
		}
		this.log.info(JSON.stringify(device));
		const result = await context.showForm({
			type : 'panel',
			style: {width: '200px'},
			items: {
				ip: {
					type: 'text',
					newLine: true,
					label: {
						en: 'IP address',
						de: 'IP-Adresse',
						ru: 'IP адрес',
						pt: 'Endereço de IP',
						nl: 'IP adres',
						fr: 'Adresse IP',
						it: 'Indirizzo IP',
						es: 'Dirección IP',
						pl: 'Adres IP',
						'zh-cn': 'IP地址',
						uk: 'IP адреса'
					}
				},
				pingInterval: {
					type: 'number',
					min: 5,
					unit: 's',
					newLine: true,
					label: {
						en: 'Ping interval',
						de: 'Ping-Intervall',
						ru: 'Интервал пинга',
						pt: 'Intervalo de ping',
						nl: 'Ping-interval',
						fr: 'Intervalle de ping',
						it: 'Intervallo di ping',
						es: 'Intervalo de ping',
						pl: 'Interwał ping',
						'zh-cn': 'Ping间隔',
						uk: 'Інтервал пінгу'
					}
				},
				retries: {
					type: 'number',
					newLine: true,
					label: {
						en: 'Retries',
						de: 'Wiederholungen',
						ru: 'Повторы',
						pt: 'Tentativas',
						nl: 'Pogingen',
						fr: 'Essais',
						it: 'Tentativi',
						es: 'Intentos',
						pl: 'Próby',
						'zh-cn': '重试',
						uk: 'Повтори'
					},
					tooltip: {
						en: 'Retries before set alive to false',
						de: 'Wiederholungen, bevor alive auf false gesetzt wird',
						ru: 'Повторы перед установкой alive в false',
						pt: 'Tentativas antes de definir vivo como falso',
						nl: 'Pogingen voordat alive op false wordt ingesteld',
						fr: 'Essais avant de définir en vie sur faux',
						it: 'Tentativi prima di impostare vivo su falso',
						es: 'Intentos antes de establecer vivo como falso',
						pl: 'Próby przed ustawieniem żywego na fałszywe',
						'zh-cn': '重试之前将活动设置为false',
						uk: 'Повтори перед встановленням alive в false'
					}
				},
				wakeWithIp: {
					type: 'checkbox',
					newLine: true,
					label: {
						en: 'Wake-on-LAN with IP',
						de: 'Wake-on-LAN mit IP',
						ru: 'Пробуждение по локальной сети с помощью IP',
						pt: 'Wake-on-LAN com IP',
						nl: 'Wake-on-LAN met IP',
						fr: 'Wake-on-LAN avec IP',
						it: 'Wake-on-LAN con IP',
						es: 'Wake-on-LAN con IP',
						pl: 'Wake-on-LAN z IP',
						'zh-cn': 'IP 网络唤醒',
						uk: 'Wake-on-LAN з IP'
					},
					tooltip: {
						en: 'Use this for devices on other subnets then the host.',
						de: 'Verwenden Sie dies für Geräte in anderen Subnetzen als dem des Hosts.',
						ru: 'Используйте этот параметр для устройств, находящихся в других подсетях, чем хост.',
						pt: 'Utilize esta opção para dispositivos noutras sub-redes que não a do anfitrião.',
						nl: 'Gebruik dit voor apparaten op andere subnetten dan de host.',
						fr: 'A utiliser pour les appareils situés sur d\'autres sous-réseaux que celui de l\'hôte.',
						it: 'Utilizzare questa opzione per i dispositivi che si trovano su altre sottoreti rispetto all\'host.',
						es: 'Utilícelo para dispositivos que se encuentren en otras subredes distintas a la del host.',
						pl: 'Użyj tego dla urządzeń w innych podsieciach niż host.',
						'zh-cn': '用于主机以外其他子网的设备。',
						uk: 'Використовуйте цей параметр для пристроїв в інших підмережах, ніж хост.'
					}
				},
				note: {
					type: 'staticText',
					text: {
						en: 'The changed settings only have an effect after the next ping.',
						de: 'Die geänderten Einstellungen haben erst einen Effekt nachdem nächsten Ping.'
					}
				}
			}
		}, {
			data: {
				ip: device.native.ip ? device.native.ip : '',
				pingInterval: device.native.pingInterval ? device.native.pingInterval : this.adapter.config.pingInterval,
				retries: device.native.retries ? device.native.retries : 0,
				wakeWithIp: device.native.wakeWithIp ? device.native.wakeWithIp : false
			},
			title: {
				en: 'Settings',
				de: 'Einstellungen',
				ru: 'Настройки',
				pt: 'Configurações',
				nl: 'Instellingen',
				fr: 'Paramètres',
				it: 'Impostazioni',
				es: 'Configuraciones',
				pl: 'Ustawienia',
				'zh-cn': '设定值',
				uk: 'Налаштування'
			}
		}
		);

		if(result === null || result === undefined) {
			return {refresh: false};
		}

		// Set settings to device native object if changed
		if(result.ip !== device.native.ip || result.pingInterval !== device.native.pingInterval || result.retries !== device.native.retries || result.wakeWithIp !== device.native.wakeWithIp) {
			const obj = {
				native: {
					ip: result.ip,
					pingInterval: result.pingInterval,
					retries: result.retries,
					wakeWithIp: result.wakeWithIp
				}
			};
			const res = await this.adapter.extendObject(id, obj);
			if(res === null) {
				this.adapter.log.warn(`Can not set settings for device ${context.id}: ${JSON.stringify(res)}`);
				return {refresh: false};
			}
			return {refresh: true};
		} else {
			return {refresh: false};
		}
	}

	async getDeviceDetails(id, action, context) {
		const devices = await this.adapter.getDevicesAsync();
		const device = devices.find(d => d._id === id);
		if(!device) {
			return {error: 'Device not found'};
		}
		const data = {
			id: device._id,
			schema: {
				type: 'panel',
				items: {
					mac: {
						type: 'staticText',
						text: device.native.mac ?  `<b>MAC:</b> ${device.native.mac}` : ``,
						newLine: true
					},
					vendor: {
						type: 'staticText',
						text: device.native.vendor ?  `<b>Vendor:</b> ${device.native.vendor}` : ``,
						newLine: true
					}
				}
			}

		};

		if(device._id.includes('localhost')) {
			const interfaces = await this.adapter.getLocalNetworkInterfaces();
			const items = transformNetworkInterfaces(interfaces).items;
			data.schema = {
				type: 'tabs',
				items: items,
			};
		}

		return data;
	}
}

function transformNetworkInterfaces(networkInterfaces) {
	const items = {};

	for (const interfaceName in networkInterfaces) {
		const addresses = networkInterfaces[interfaceName];

		// Erstellen eines neuen Panel-Tabs für jedes Interface
		items[interfaceName] = {
			type: 'panel',
			label: interfaceName,
			items: {}
		};

		for (const addressInfo of addresses) {
			items[interfaceName].items[`family_${interfaceName}_${addressInfo.family}`] = {
				type: 'header',
				text: `${addressInfo.family}`,
				size: 2
			};


			items[interfaceName].items[`mac_${interfaceName}_${addressInfo.family}`] = {
				type: 'staticText',
				text: `<b>MAC:</b> ${addressInfo.mac}`,
				newLine: true
			};

			items[interfaceName].items[`ip_${interfaceName}_${addressInfo.family}`] = {
				type: 'staticText',
				text: `<b>IP-Adresse:</b> ${addressInfo.address}`,
				newLine: true
			};

			items[interfaceName].items[`netmask_${interfaceName}_${addressInfo.family}`] = {
				type: 'staticText',
				text: `<b>Netmask:</b> ${addressInfo.netmask}`,
				newLine: true
			};

			items[interfaceName].items[`cidr_${interfaceName}_${addressInfo.family}`] = {
				type: 'staticText',
				text: `<b>CIDR:</b> ${addressInfo.cidr}`,
				newLine: true
			};
		}
	}

	return { items };
}



module.exports = dmNetTools;
