const dmUtils = require('@iobroker/dm-utils');

class dmNetTools extends dmUtils.DeviceManagement {
    /**
     * Creates the device management instance.
     */
    constructor(adapter) {
        super(adapter);
        this.activeScans = new Map();
    }

    /**
     * Returns instance information and global actions for the device manager.
     */
    async getInstanceInfo() {
        const data = {
            ...super.getInstanceInfo(),
            apiVersion: 'v3',
            actions: [
                {
                    id: 'newDevice',
                    icon: 'newDevice',
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
                        uk: 'Додати новий пристрій до Net Tools',
                    },
                    handler: this.handleNewDevice.bind(this),
                },
                {
                    id: 'discover',
                    icon: 'discover',
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
                        uk: 'Виявити нові пристрої',
                    },
                    handler: this.handleDiscover.bind(this),
                },
            ],
        };
        return data;
    }

    /**
     * Handles the "new device" action and shows the form to add a device manually.
     */
    async handleNewDevice(context) {
        this.adapter.log.info('handleNewDevice');
        const result = await context.showForm(
            {
                type: 'panel',
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
                            uk: "Ім'я",
                        },
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
                            uk: 'IP адреса',
                        },
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
                            uk: 'MAC адреса',
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
                            uk: 'Інтервал пінгу',
                        },
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
                            uk: 'Повтори',
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
                            uk: 'Ping увімкнено',
                        },
                    },
                },
            },
            {
                data: {
                    name: '',
                    ip: '',
                    mac: '',
                    pingInterval: this.adapter.config.pingInterval,
                    retries: 0,
                    enabled: true,
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
                    uk: 'Додати новий пристрій',
                },
            },
        );
        if (result === null || result === undefined) {
            return { refresh: false };
        }
        // Check if mac is valid
        if (result.mac !== '') {
            // Check mac has the right format
            if (!result.mac.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)) {
                await context.showMessage('Please enter a valid MAC address');
                return { refresh: false };
            }
        }
        // Check if ip was entered
        if (result.ip === '') {
            await context.showMessage('Please enter an IP address');
            return { refresh: false };
        }
        // Check if ip is valid
        if (result.ip !== '') {
            // Check ip has the right format (IPv4 or IPv6)
            const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
            const ipv6Regex =
                /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

            if (!ipv4Regex.test(result.ip) && !ipv6Regex.test(result.ip)) {
                await context.showMessage('Please enter a valid IP address');
                return { refresh: false };
            }
        }

        this.adapter.addDevice(result.ip, result.name, result.enabled, result.mac, result.pingInterval, result.retries);
        return { refresh: true };
    }

    /**
     * Handles the "discover" action and starts the network discovery.
     */
    async handleDiscover(context) {
        context.showMessage(
            'Dicovery started. This process will take a few minutes until all devices are discovered. You can close this dialog and continue working in the meantime.',
        );
        this.adapter.discover();
        return { refresh: false };
    }

    /**
     * Loads all devices and adds them to the device manager.
     */
    async loadDevices(context) {
        const devices = await this.adapter.getDevicesAsync();
        for (const i in devices) {
            const status = {};

            let hasDetails = false;
            if (
                devices[i].native.ip ||
                devices[i].native.mac ||
                devices[i].native.vendor ||
                devices[i]._id.includes('localhost')
            ) {
                hasDetails = true;
            }
            const alive = await this.adapter.getStateAsync(`${devices[i]._id}.alive`);
            if (alive !== null && alive !== undefined) {
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
                        uk: 'Видалити цей пристрій',
                    },
                    handler: this.handleDeleteDevice.bind(this),
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
                        uk: 'Перейменуйте цей пристрій',
                    },
                    handler: this.handleRenameDevice.bind(this),
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
                        uk: 'Налаштування',
                    },
                    handler: this.handleSettingsDevice.bind(this),
                },
                {
                    id: 'scan',
                    icon: 'discover',
                    description: {
                        en: 'Scan Ports',
                        de: 'Ports scannen',
                        ru: 'Сканировать порты',
                        pt: 'Escanear portas',
                        nl: 'Poorten scannen',
                        fr: 'Scanner les ports',
                        it: 'Scansiona le porte',
                        es: 'Escanear puertos',
                        pl: 'Skanuj porty',
                        'zh-cn': '扫描端口',
                        uk: 'Сканувати порти',
                    },
                    handler: this.handleScanDevice.bind(this),
                },
            ];

            const res = {
                id: devices[i]._id,
                identifier: devices[i]._id,
                name: devices[i].common.name,
                icon: devices[i].common.icon ? devices[i].common.icon : null,
                manufacturer: devices[i].native.vendor ? devices[i].native.vendor.split(',')[0].trim() : '',
                model: '',
                status: status,
                hasDetails: hasDetails,
                actions: actions,
            };

            if (devices[i]._id.includes('localhost')) {
                res.actions = [];
            }
            context.addDevice(res);
        }
    }

    /**
     * Returns the connection status of a device.
     */
    async getDeviceStatus(id) {
        const alive = await this.adapter.getStateAsync(`${id}.alive`);
        const status = {
            connection: 'disconnected',
        };
        if (alive !== null && alive !== undefined) {
            status.connection = alive.val ? 'connected' : 'disconnected';
        }

        return {
            status: status,
        };
    }

    /**
     * Handle delete device
     *
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
            uk: `Ви дійсно бажаєте видалити пристрій ${name}?`,
        });

        // delete device
        if (response === false) {
            return { refresh: false };
        }
        const result = this.adapter.delDevice(name);
        if (result === false) {
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
                uk: `Не вдалося видалити пристрій ${name}`,
            });
            return { refresh: false };
        }
        return { refresh: true };
    }

    /**
     * Handles the "rename" action of a device.
     */
    async handleRenameDevice(id, context) {
        const result = await context.showForm(
            {
                type: 'panel',
                items: {
                    newName: {
                        type: 'text',
                        trim: false,
                        placeholder: '',
                    },
                },
            },
            {
                data: {
                    newName: '',
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
                    uk: "Введіть нове ім'я",
                },
            },
        );
        if (result === null || result === undefined) {
            return { refresh: false };
        }
        if (result.newName === undefined || result.newName === '') {
            return { refresh: false };
        }
        const obj = {
            common: {
                name: result.newName,
            },
        };
        const res = await this.adapter.extendObject(id, obj);
        this.adapter.log.info(JSON.stringify(res));
        if (res === null) {
            this.adapter.log.warn(`Can not rename device ${context.id}: ${JSON.stringify(res)}`);
            return { refresh: false };
        }
        return { refresh: true };
    }

    /**
     * Handles the "settings" action of a device.
     */
    async handleSettingsDevice(id, context) {
        // Get settings from device native object
        const device = await this.adapter.getObjectAsync(id);
        if (device === null) {
            this.adapter.log.warn(`Can not find device ${id}`);
            return { refresh: false };
        }
        this.log.info(JSON.stringify(device));
        const result = await context.showForm(
            {
                type: 'panel',
                style: { width: '200px' },
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
                            uk: 'IP адреса',
                        },
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
                            uk: 'Інтервал пінгу',
                        },
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
                            uk: 'Повтори',
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
                            uk: 'Повтори перед встановленням alive в false',
                        },
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
                            uk: 'Wake-on-LAN з IP',
                        },
                        tooltip: {
                            en: 'Use this for devices on other subnets then the host.',
                            de: 'Verwenden Sie dies für Geräte in anderen Subnetzen als dem des Hosts.',
                            ru: 'Используйте этот параметр для устройств, находящихся в других подсетях, чем хост.',
                            pt: 'Utilize esta opção para dispositivos noutras sub-redes que não a do anfitrião.',
                            nl: 'Gebruik dit voor apparaten op andere subnetten dan de host.',
                            fr: "A utiliser pour les appareils situés sur d'autres sous-réseaux que celui de l'hôte.",
                            it: "Utilizzare questa opzione per i dispositivi che si trovano su altre sottoreti rispetto all'host.",
                            es: 'Utilícelo para dispositivos que se encuentren en otras subredes distintas a la del host.',
                            pl: 'Użyj tego dla urządzeń w innych podsieciach niż host.',
                            'zh-cn': '用于主机以外其他子网的设备。',
                            uk: 'Використовуйте цей параметр для пристроїв в інших підмережах, ніж хост.',
                        },
                    },
                    extendedDetection: {
                        type: 'checkbox',
                        newLine: true,
                        label: {
                            en: 'Extended detection (smartphones)',
                            de: 'Erweiterte Erkennung (Smartphones)',
                            ru: 'Расширенное обнаружение (смартфоны)',
                            pt: 'Deteção avançada (smartphones)',
                            nl: 'Uitgebreide detectie (smartphones)',
                            fr: 'Détection étendue (smartphones)',
                            it: 'Rilevamento esteso (smartphone)',
                            es: 'Detección ampliada (smartphones)',
                            pl: 'Rozszerzone wykrywanie (smartfony)',
                            'zh-cn': '扩展检测（智能手机）',
                            uk: 'Розширене виявлення (смартфони)',
                        },
                        tooltip: {
                            en: 'If the device does not answer the ping, it is woken up and detected via ARP. For devices like iPhones that do not answer pings while sleeping. Only works in the subnet of the ioBroker host.',
                            de: 'Antwortet das Gerät nicht auf den Ping, wird es geweckt und per ARP erkannt. Für Geräte wie iPhones, die im Ruhezustand nicht auf Pings antworten. Funktioniert nur im Subnetz des ioBroker-Hosts.',
                            ru: 'Если устройство не отвечает на пинг, оно пробуждается и обнаруживается через ARP. Для устройств, таких как iPhone, которые не отвечают на пинг в спящем режиме. Работает только в подсети хоста ioBroker.',
                            pt: 'Se o dispositivo não responder ao ping, é acordado e detetado via ARP. Para dispositivos como iPhones que não respondem a pings em repouso. Só funciona na sub-rede do anfitrião ioBroker.',
                            nl: 'Als het apparaat niet op de ping reageert, wordt het gewekt en via ARP gedetecteerd. Voor apparaten zoals iPhones die in slaapstand niet op pings reageren. Werkt alleen in het subnet van de ioBroker-host.',
                            fr: "Si l'appareil ne répond pas au ping, il est réveillé et détecté via ARP. Pour les appareils comme les iPhone qui ne répondent pas aux pings en veille. Fonctionne uniquement dans le sous-réseau de l'hôte ioBroker.",
                            it: "Se il dispositivo non risponde al ping, viene risvegliato e rilevato tramite ARP. Per dispositivi come gli iPhone che non rispondono ai ping in standby. Funziona solo nella sottorete dell'host ioBroker.",
                            es: 'Si el dispositivo no responde al ping, se despierta y se detecta mediante ARP. Para dispositivos como iPhones que no responden a pings en reposo. Solo funciona en la subred del host de ioBroker.',
                            pl: 'Jeśli urządzenie nie odpowiada na ping, jest wybudzane i wykrywane przez ARP. Dla urządzeń takich jak iPhone, które w uśpieniu nie odpowiadają na ping. Działa tylko w podsieci hosta ioBroker.',
                            'zh-cn':
                                '如果设备不响应 ping，则会将其唤醒并通过 ARP 检测。适用于 iPhone 等休眠时不响应 ping 的设备。仅在 ioBroker 主机所在子网内有效。',
                            uk: 'Якщо пристрій не відповідає на пінг, його пробуджують і виявляють через ARP. Для пристроїв, як-от iPhone, які в режимі сну не відповідають на пінг. Працює лише в підмережі хоста ioBroker.',
                        },
                    },
                    services: {
                        type: 'table',
                        newLine: true,
                        sm: 12,
                        label: {
                            en: 'Services (TCP ports)',
                            de: 'Dienste (TCP-Ports)',
                            ru: 'Сервисы (TCP-порты)',
                            pt: 'Serviços (portas TCP)',
                            nl: 'Diensten (TCP-poorten)',
                            fr: 'Services (ports TCP)',
                            it: 'Servizi (porte TCP)',
                            es: 'Servicios (puertos TCP)',
                            pl: 'Usługi (porty TCP)',
                            'zh-cn': '服务（TCP 端口）',
                            uk: 'Сервіси (TCP-порти)',
                        },
                        help: {
                            en: 'For each port the state services.port_<port> shows if the service is reachable. Empty interval = ping interval of the device. Tolerance = failed checks in a row that are ignored.',
                            de: 'Für jeden Port zeigt der State services.port_<Port>, ob der Dienst erreichbar ist. Leeres Intervall = Ping-Intervall des Geräts. Toleranz = Anzahl Fehlversuche in Folge, die ignoriert werden.',
                            ru: 'Для каждого порта состояние services.port_<порт> показывает, доступен ли сервис. Пустой интервал = интервал пинга устройства. Допуск = количество неудачных проверок подряд, которые игнорируются.',
                            pt: 'Para cada porta, o estado services.port_<porta> indica se o serviço está acessível. Intervalo vazio = intervalo de ping do dispositivo. Tolerância = verificações falhadas seguidas que são ignoradas.',
                            nl: 'Per poort geeft de state services.port_<poort> aan of de dienst bereikbaar is. Leeg interval = ping-interval van het apparaat. Tolerantie = aantal mislukte controles op rij dat wordt genegeerd.',
                            fr: "Pour chaque port, l'état services.port_<port> indique si le service est joignable. Intervalle vide = intervalle de ping de l'appareil. Tolérance = nombre d'échecs consécutifs ignorés.",
                            it: 'Per ogni porta lo stato services.port_<porta> indica se il servizio è raggiungibile. Intervallo vuoto = intervallo di ping del dispositivo. Tolleranza = controlli falliti consecutivi ignorati.',
                            es: 'Para cada puerto, el estado services.port_<puerto> indica si el servicio es accesible. Intervalo vacío = intervalo de ping del dispositivo. Tolerancia = comprobaciones fallidas seguidas que se ignoran.',
                            pl: 'Dla każdego portu stan services.port_<port> pokazuje, czy usługa jest osiągalna. Pusty interwał = interwał ping urządzenia. Tolerancja = liczba kolejnych nieudanych prób, które są ignorowane.',
                            'zh-cn':
                                '每个端口的状态 services.port_<端口> 显示服务是否可达。间隔为空 = 设备的 ping 间隔。容错 = 忽略的连续失败检查次数。',
                            uk: 'Для кожного порту стан services.port_<порт> показує, чи доступний сервіс. Порожній інтервал = інтервал пінгу пристрою. Допуск = кількість невдалих перевірок поспіль, які ігноруються.',
                        },
                        items: [
                            {
                                type: 'number',
                                attr: 'port',
                                width: '30%',
                                min: 1,
                                max: 65535,
                                title: {
                                    en: 'Port',
                                    de: 'Port',
                                    ru: 'Порт',
                                    pt: 'Porta',
                                    nl: 'Poort',
                                    fr: 'Port',
                                    it: 'Porta',
                                    es: 'Puerto',
                                    pl: 'Port',
                                    'zh-cn': '端口',
                                    uk: 'Порт',
                                },
                            },
                            {
                                type: 'number',
                                attr: 'interval',
                                width: '35%',
                                min: 5,
                                title: {
                                    en: 'Interval (s)',
                                    de: 'Intervall (s)',
                                    ru: 'Интервал (с)',
                                    pt: 'Intervalo (s)',
                                    nl: 'Interval (s)',
                                    fr: 'Intervalle (s)',
                                    it: 'Intervallo (s)',
                                    es: 'Intervalo (s)',
                                    pl: 'Interwał (s)',
                                    'zh-cn': '间隔（秒）',
                                    uk: 'Інтервал (с)',
                                },
                            },
                            {
                                type: 'number',
                                attr: 'retries',
                                width: '35%',
                                min: 0,
                                default: 0,
                                title: {
                                    en: 'Tolerance (failures)',
                                    de: 'Toleranz (Fehlversuche)',
                                    ru: 'Допуск (сбои)',
                                    pt: 'Tolerância (falhas)',
                                    nl: 'Tolerantie (fouten)',
                                    fr: 'Tolérance (échecs)',
                                    it: 'Tolleranza (errori)',
                                    es: 'Tolerancia (fallos)',
                                    pl: 'Tolerancja (błędy)',
                                    'zh-cn': '容错（失败次数）',
                                    uk: 'Допуск (збої)',
                                },
                            },
                        ],
                    },
                    note: {
                        type: 'staticText',
                        text: {
                            en: 'The changed settings only have an effect after the next ping.',
                            de: 'Die geänderten Einstellungen haben erst einen Effekt nachdem nächsten Ping.',
                        },
                    },
                },
            },
            {
                data: {
                    ip: device.native.ip ? device.native.ip : '',
                    pingInterval: device.native.pingInterval
                        ? device.native.pingInterval
                        : this.adapter.config.pingInterval,
                    retries: device.native.retries ? device.native.retries : 0,
                    wakeWithIp: device.native.wakeWithIp ? device.native.wakeWithIp : false,
                    extendedDetection: device.native.extendedDetection === true,
                    services: Array.isArray(device.native.services) ? device.native.services : [],
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
                    uk: 'Налаштування',
                },
            },
        );

        if (result === null || result === undefined) {
            return { refresh: false };
        }

        // Set settings to device native object if changed
        if (
            result.ip !== device.native.ip ||
            result.pingInterval !== device.native.pingInterval ||
            result.retries !== device.native.retries ||
            result.wakeWithIp !== device.native.wakeWithIp ||
            result.extendedDetection !== (device.native.extendedDetection === true) ||
            JSON.stringify(result.services || []) !== JSON.stringify(device.native.services || [])
        ) {
            const obj = {
                native: {
                    ip: result.ip,
                    pingInterval: result.pingInterval,
                    retries: result.retries,
                    wakeWithIp: result.wakeWithIp,
                    extendedDetection: result.extendedDetection === true,
                    services: Array.isArray(result.services)
                        ? result.services.map(s => ({
                              port: s.port,
                              interval: s.interval === undefined || s.interval === '' ? null : s.interval,
                              retries: s.retries === undefined || s.retries === '' ? 0 : s.retries,
                          }))
                        : [],
                },
            };
            // write the whole object: extendObject could merge the services array instead of replacing it
            const current = await this.adapter.getObjectAsync(id);
            const res = current
                ? await this.adapter.setObjectAsync(id, { ...current, native: { ...current.native, ...obj.native } })
                : null;
            if (res === null) {
                this.adapter.log.warn(`Can not set settings for device ${context.id}: ${JSON.stringify(res)}`);
                return { refresh: false };
            }
            return { refresh: true };
        }
        return { refresh: false };
    }

    /**
     * Handles the "scan ports" action of a device and shows the result.
     */
    async handleScanDevice(id, context) {
        const device = await this.adapter.getObjectAsync(id);
        if (!device || !device.native || !device.native.ip) {
            return {
                refresh: false,
                error: {
                    en: 'Device has no IP address',
                    de: 'Gerät hat keine IP-Adresse',
                    ru: 'У устройства нет IP-адреса',
                    pt: 'O dispositivo não tem endereço IP',
                    nl: 'Apparaat heeft geen IP-adres',
                    fr: "L'appareil n'a pas d'adresse IP",
                    it: 'Il dispositivo non ha un indirizzo IP',
                    es: 'El dispositivo no tiene dirección IP',
                    pl: 'Urządzenie nie ma adresu IP',
                    'zh-cn': '设备没有 IP 地址',
                    uk: 'Пристрій не має IP-адреси',
                },
            };
        }

        const progress = await context.openProgress(
            {
                en: 'Port scan in progress...',
                de: 'Port-Scan läuft...',
                ru: 'Идет сканирование портов...',
                pt: 'Varredura de porta em andamento...',
                nl: 'Poortscan bezig...',
                fr: 'Scan des ports en cours...',
                it: 'Scansione delle porte in corso...',
                es: 'Escaneo de puertos en progreso...',
                pl: 'Skanowanie portów w toku...',
                'zh-cn': '端口扫描正在进行中...',
                uk: 'Триває сканування портів...',
            },
            { indeterminate: true },
        );

        // Create a promise that resolves when the scan is finished
        const scanFinished = new Promise(resolve => {
            this.activeScans.set(id, resolve);
        });

        // Start the scan
        await this.adapter.setStateAsync(`${id}.scan`, { val: true, ack: false });

        // Wait for completion
        await scanFinished;
        this.activeScans.delete(id);

        // Close progress dialog
        await progress.close();

        const portsState = await this.adapter.getStateAsync(`${id}.ports`);
        const ports = getPortsList(portsState && portsState.val);

        await context.showForm(
            {
                type: 'panel',
                items: {
                    header: {
                        type: 'header',
                        text: {
                            en: 'Open ports',
                            de: 'Offene Ports',
                            ru: 'Открытые порты',
                            pt: 'Portas abertas',
                            nl: 'Open poorten',
                            fr: 'Ports ouverts',
                            it: 'Porte aperte',
                            es: 'Puertos abiertos',
                            pl: 'Otwarte porty',
                            'zh-cn': '开放端口',
                            uk: 'Відкриті порти',
                        },
                        size: 2,
                    },
                    ports: {
                        type: 'staticText',
                        text: ports.length ? `<b>${ports.join(', ')}</b>` : '-',
                        newLine: true,
                    },
                },
            },
            {
                title: {
                    en: 'Port scan finished',
                    de: 'Port-Scan abgeschlossen',
                    ru: 'Сканирование портов завершено',
                    pt: 'Varredura de porta concluída',
                    nl: 'Poortscan voltooid',
                    fr: 'Scan des ports terminé',
                    it: 'Scansione delle porte terminata',
                    es: 'Escaneo de puertos finalizado',
                    pl: 'Skanowanie portów zakończone',
                    'zh-cn': '端口扫描已完成',
                    uk: 'Сканування портів завершено',
                },
                buttons: ['close'],
            },
        );

        return {
            refresh: true,
        };
    }

    /**
     * Resolves a pending port scan of a device.
     */
    handleScanFinished(id) {
        const resolve = this.activeScans.get(id);
        if (resolve) {
            resolve();
        }
    }

    /**
     * Returns the details dialog schema of a device.
     */
    async getDeviceDetails(id, _action, _context) {
        const devices = await this.adapter.getDevicesAsync();
        const device = devices.find(d => d._id === id);
        if (!device) {
            return { error: 'Device not found' };
        }
        const portsState = await this.adapter.getStateAsync(`${id}.ports`);
        const portsList = getPortsList(portsState && portsState.val);
        const data = {
            id: device._id,
            schema: {
                type: 'panel',
                items: {
                    ip: {
                        type: 'staticText',
                        text: device.native.ip ? buildTranslatedText(TEXT_IP_ADDRESS, device.native.ip) : ``,
                        newLine: true,
                    },
                    ports: {
                        type: 'staticText',
                        text: portsList.length ? buildTranslatedText(TEXT_OPEN_PORTS, portsList.join(', ')) : ``,
                        newLine: true,
                    },
                    mac: {
                        type: 'staticText',
                        text: device.native.mac ? buildTranslatedText(TEXT_MAC, device.native.mac) : ``,
                        newLine: true,
                    },
                    vendor: {
                        type: 'staticText',
                        text: device.native.vendor ? buildTranslatedText(TEXT_VENDOR, device.native.vendor) : ``,
                        newLine: true,
                    },
                },
            },
        };

        if (device._id.includes('localhost')) {
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

const TEXT_IP_ADDRESS = {
    en: 'IP address',
    de: 'IP-Adresse',
    ru: 'IP-адрес',
    pt: 'Endereço IP',
    nl: 'IP-adres',
    fr: 'Adresse IP',
    it: 'Indirizzo IP',
    es: 'Dirección IP',
    pl: 'Adres IP',
    'zh-cn': 'IP 地址',
    uk: 'IP-адреса',
};

const TEXT_OPEN_PORTS = {
    en: 'Open ports',
    de: 'Offene Ports',
    ru: 'Открытые порты',
    pt: 'Portas abertas',
    nl: 'Open poorten',
    fr: 'Ports ouverts',
    it: 'Porte aperte',
    es: 'Puertos abiertos',
    pl: 'Otwarte porty',
    'zh-cn': '开放端口',
    uk: 'Відкриті порти',
};

const TEXT_MAC = {
    en: 'MAC',
    de: 'MAC',
    ru: 'MAC',
    pt: 'MAC',
    nl: 'MAC',
    fr: 'MAC',
    it: 'MAC',
    es: 'MAC',
    pl: 'MAC',
    'zh-cn': 'MAC',
    uk: 'MAC',
};

const TEXT_VENDOR = {
    en: 'Vendor',
    de: 'Hersteller',
    ru: 'Производитель',
    pt: 'Fabricante',
    nl: 'Fabrikant',
    fr: 'Fabricant',
    it: 'Produttore',
    es: 'Fabricante',
    pl: 'Producent',
    'zh-cn': '制造商',
    uk: 'Виробник',
};

/**
 * Builds a translated text object in the form "<b>label:</b> value" for every language.
 *
 * @param {Record<string, string>} label - Translated label.
 * @param {string} value - Value appended to each label.
 * @returns {Record<string, string>} Translated text.
 */
function buildTranslatedText(label, value) {
    const result = {};
    for (const lang of Object.keys(label)) {
        result[lang] = `<b>${label[lang]}:</b> ${value}`;
    }
    return result;
}

/**
 * Converts the value of the ports state into an array of ports.
 *
 * @param {any} value - Value of the ports state.
 * @returns {string[]} Array of open ports.
 */
function getPortsList(value) {
    if (value === null || value === undefined || value === '') {
        return [];
    }
    const text = String(value);
    if (text.includes('wait')) {
        return [];
    }
    return text
        .split(',')
        .map(port => port.trim())
        .filter(port => port !== '');
}

function transformNetworkInterfaces(networkInterfaces) {
    const items = {};

    for (const interfaceName in networkInterfaces) {
        const addresses = networkInterfaces[interfaceName];

        // Erstellen eines neuen Panel-Tabs für jedes Interface
        items[interfaceName] = {
            type: 'panel',
            label: interfaceName,
            items: {},
        };

        for (const addressInfo of addresses) {
            items[interfaceName].items[`family_${interfaceName}_${addressInfo.family}`] = {
                type: 'header',
                text: `${addressInfo.family}`,
                size: 2,
            };

            items[interfaceName].items[`mac_${interfaceName}_${addressInfo.family}`] = {
                type: 'staticText',
                text: `<b>MAC:</b> ${addressInfo.mac}`,
                newLine: true,
            };

            items[interfaceName].items[`ip_${interfaceName}_${addressInfo.family}`] = {
                type: 'staticText',
                text: `<b>IP-Adresse:</b> ${addressInfo.address}`,
                newLine: true,
            };

            items[interfaceName].items[`netmask_${interfaceName}_${addressInfo.family}`] = {
                type: 'staticText',
                text: `<b>Netmask:</b> ${addressInfo.netmask}`,
                newLine: true,
            };

            items[interfaceName].items[`cidr_${interfaceName}_${addressInfo.family}`] = {
                type: 'staticText',
                text: `<b>CIDR:</b> ${addressInfo.cidr}`,
                newLine: true,
            };
        }
    }

    return { items };
}

module.exports = dmNetTools;
