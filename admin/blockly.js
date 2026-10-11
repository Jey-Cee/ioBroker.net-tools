'use strict';

/* global Blockly, main, systemLang, goog */

if (typeof goog !== 'undefined') {
    goog.provide('Blockly.JavaScript.Sendto');

    goog.require('Blockly.JavaScript');
}

Blockly.Translate =
    Blockly.Translate ||
    function (word, lang) {
        lang = lang || systemLang;
        if (Blockly.Words && Blockly.Words[word]) {
            return Blockly.Words[word][lang] || Blockly.Words[word].en;
        }
        return word;
    };

// --- Translations -----------------------------------------------------------
Blockly.Words['net-tools_ping'] = {
    en: 'Ping (net-tools)',
    de: 'Ping (net-tools)',
    ru: 'Пинг (net-tools)',
    pt: 'Ping (net-tools)',
    nl: 'Ping (net-tools)',
    fr: 'Ping (net-tools)',
    it: 'Ping (net-tools)',
    es: 'Ping (net-tools)',
    pl: 'Ping (net-tools)',
    uk: 'Пінг (net-tools)',
    'zh-cn': 'Ping (net-tools)',
};
Blockly.Words['net-tools_portscan'] = {
    en: 'Port scan (net-tools)',
    de: 'Port-Scan (net-tools)',
    ru: 'Сканирование портов (net-tools)',
    pt: 'Varredura de portas (net-tools)',
    nl: 'Poortscan (net-tools)',
    fr: 'Scan des ports (net-tools)',
    it: 'Scansione porte (net-tools)',
    es: 'Escaneo de puertos (net-tools)',
    pl: 'Skanowanie portów (net-tools)',
    uk: 'Сканування портів (net-tools)',
    'zh-cn': '端口扫描 (net-tools)',
};
Blockly.Words['net-tools_wol'] = {
    en: 'Wake-on-LAN (net-tools)',
    de: 'Wake-on-LAN (net-tools)',
    ru: 'Wake-on-LAN (net-tools)',
    pt: 'Wake-on-LAN (net-tools)',
    nl: 'Wake-on-LAN (net-tools)',
    fr: 'Wake-on-LAN (net-tools)',
    it: 'Wake-on-LAN (net-tools)',
    es: 'Wake-on-LAN (net-tools)',
    pl: 'Wake-on-LAN (net-tools)',
    uk: 'Wake-on-LAN (net-tools)',
    'zh-cn': '网络唤醒 (net-tools)',
};
Blockly.Words['net-tools_ip'] = {
    en: 'IP / host',
    de: 'IP / Host',
    ru: 'IP / хост',
    pt: 'IP / host',
    nl: 'IP / host',
    fr: 'IP / hôte',
    it: 'IP / host',
    es: 'IP / host',
    pl: 'IP / host',
    uk: 'IP / хост',
    'zh-cn': 'IP / 主机',
};
Blockly.Words['net-tools_ports'] = {
    en: 'ports (optional)',
    de: 'Ports (optional)',
    ru: 'порты (необязательно)',
    pt: 'portas (opcional)',
    nl: 'poorten (optioneel)',
    fr: 'ports (facultatif)',
    it: 'porte (opzionale)',
    es: 'puertos (opcional)',
    pl: 'porty (opcjonalnie)',
    uk: 'порти (необов’язково)',
    'zh-cn': '端口（可选）',
};
Blockly.Words['net-tools_mac'] = {
    en: 'MAC address',
    de: 'MAC-Adresse',
    ru: 'MAC-адрес',
    pt: 'Endereço MAC',
    nl: 'MAC-adres',
    fr: 'Adresse MAC',
    it: 'Indirizzo MAC',
    es: 'Dirección MAC',
    pl: 'Adres MAC',
    uk: 'MAC-адреса',
    'zh-cn': 'MAC 地址',
};
Blockly.Words['net-tools_then'] = {
    en: 'then',
    de: 'dann',
    ru: 'затем',
    pt: 'então',
    nl: 'dan',
    fr: 'puis',
    it: 'poi',
    es: 'entonces',
    pl: 'następnie',
    uk: 'потім',
    'zh-cn': '然后',
};
Blockly.Words['net-tools_result'] = {
    en: 'net-tools result',
    de: 'net-tools Ergebnis',
    ru: 'результат net-tools',
    pt: 'resultado net-tools',
    nl: 'net-tools resultaat',
    fr: 'résultat net-tools',
    it: 'risultato net-tools',
    es: 'resultado net-tools',
    pl: 'wynik net-tools',
    uk: 'результат net-tools',
    'zh-cn': 'net-tools 结果',
};
Blockly.Words['net-tools_result_alive'] = {
    en: 'reachable',
    de: 'erreichbar',
    ru: 'доступен',
    pt: 'acessível',
    nl: 'bereikbaar',
    fr: 'joignable',
    it: 'raggiungibile',
    es: 'alcanzable',
    pl: 'osiągalny',
    uk: 'доступний',
    'zh-cn': '可达',
};
Blockly.Words['net-tools_result_ms'] = {
    en: 'response time (ms)',
    de: 'Antwortzeit (ms)',
    ru: 'время ответа (мс)',
    pt: 'tempo de resposta (ms)',
    nl: 'responstijd (ms)',
    fr: 'temps de réponse (ms)',
    it: 'tempo di risposta (ms)',
    es: 'tiempo de respuesta (ms)',
    pl: 'czas odpowiedzi (ms)',
    uk: 'час відповіді (мс)',
    'zh-cn': '响应时间 (毫秒)',
};
Blockly.Words['net-tools_result_ports'] = {
    en: 'open ports',
    de: 'offene Ports',
    ru: 'открытые порты',
    pt: 'portas abertas',
    nl: 'open poorten',
    fr: 'ports ouverts',
    it: 'porte aperte',
    es: 'puertos abiertos',
    pl: 'otwarte porty',
    uk: 'відкриті порти',
    'zh-cn': '开放端口',
};
Blockly.Words['net-tools_result_host'] = {
    en: 'host',
    de: 'Host',
    ru: 'хост',
    pt: 'host',
    nl: 'host',
    fr: 'hôte',
    it: 'host',
    es: 'host',
    pl: 'host',
    uk: 'хост',
    'zh-cn': '主机',
};
Blockly.Words['net-tools_result_error'] = {
    en: 'error',
    de: 'Fehler',
    ru: 'ошибка',
    pt: 'erro',
    nl: 'fout',
    fr: 'erreur',
    it: 'errore',
    es: 'error',
    pl: 'błąd',
    uk: 'помилка',
    'zh-cn': '错误',
};
Blockly.Words['net-tools_ping_tooltip'] = {
    en: 'Pings an IP address or host name. Use the "net-tools result" block inside "then".',
    de: 'Pingt eine IP-Adresse oder einen Hostnamen an. Den Baustein "net-tools Ergebnis" innerhalb von "dann" verwenden.',
    ru: 'Пингует IP-адрес или имя хоста. Используйте блок "результат net-tools" внутри "затем".',
    pt: 'Faz ping a um endereço IP ou nome de host. Use o bloco "resultado net-tools" dentro de "então".',
    nl: 'Pingt een IP-adres of hostnaam. Gebruik het blok "net-tools resultaat" binnen "dan".',
    fr: 'Envoie un ping à une adresse IP ou un nom d\'hôte. Utilisez le bloc "résultat net-tools" dans "puis".',
    it: 'Esegue il ping di un indirizzo IP o nome host. Usa il blocco "risultato net-tools" dentro "poi".',
    es: 'Hace ping a una dirección IP o nombre de host. Use el bloque "resultado net-tools" dentro de "entonces".',
    pl: 'Pinguje adres IP lub nazwę hosta. Użyj bloku "wynik net-tools" wewnątrz "następnie".',
    uk: 'Пінгує IP-адресу або ім’я хоста. Використовуйте блок "результат net-tools" всередині "потім".',
    'zh-cn': 'Ping IP 地址或主机名。在"然后"中使用"net-tools 结果"块。',
};
Blockly.Words['net-tools_portscan_tooltip'] = {
    en: 'Scans the ports of an IP address or host name. Without ports the port list from the adapter settings is used. Use the "net-tools result" block inside "then".',
    de: 'Scannt die Ports einer IP-Adresse oder eines Hostnamens. Ohne Ports wird die Portliste aus den Adaptereinstellungen verwendet. Den Baustein "net-tools Ergebnis" innerhalb von "dann" verwenden.',
    ru: 'Сканирует порты IP-адреса или имени хоста. Без портов используется список портов из настроек адаптера. Используйте блок "результат net-tools" внутри "затем".',
    pt: 'Verifica as portas de um endereço IP ou nome de host. Sem portas, é usada a lista de portas das configurações do adaptador. Use o bloco "resultado net-tools" dentro de "então".',
    nl: 'Scant de poorten van een IP-adres of hostnaam. Zonder poorten wordt de poortlijst uit de adapterinstellingen gebruikt. Gebruik het blok "net-tools resultaat" binnen "dan".',
    fr: 'Analyse les ports d\'une adresse IP ou d\'un nom d\'hôte. Sans ports, la liste des ports des paramètres de l\'adaptateur est utilisée. Utilisez le bloc "résultat net-tools" dans "puis".',
    it: 'Scansiona le porte di un indirizzo IP o nome host. Senza porte viene usato l\'elenco porte delle impostazioni dell\'adattatore. Usa il blocco "risultato net-tools" dentro "poi".',
    es: 'Escanea los puertos de una dirección IP o nombre de host. Sin puertos se usa la lista de puertos de la configuración del adaptador. Use el bloque "resultado net-tools" dentro de "entonces".',
    pl: 'Skanuje porty adresu IP lub nazwy hosta. Bez portów używana jest lista portów z ustawień adaptera. Użyj bloku "wynik net-tools" wewnątrz "następnie".',
    uk: 'Сканує порти IP-адреси або імені хоста. Без портів використовується список портів із налаштувань адаптера. Використовуйте блок "результат net-tools" всередині "потім".',
    'zh-cn': '扫描 IP 地址或主机名的端口。未指定端口时使用适配器设置中的端口列表。在"然后"中使用"net-tools 结果"块。',
};
Blockly.Words['net-tools_wol_tooltip'] = {
    en: 'Sends Wake-on-LAN packets to a MAC address',
    de: 'Sendet Wake-on-LAN-Pakete an eine MAC-Adresse',
    ru: 'Отправляет пакеты Wake-on-LAN на MAC-адрес',
    pt: 'Envia pacotes Wake-on-LAN para um endereço MAC',
    nl: 'Stuurt Wake-on-LAN-pakketten naar een MAC-adres',
    fr: 'Envoie des paquets Wake-on-LAN à une adresse MAC',
    it: 'Invia pacchetti Wake-on-LAN a un indirizzo MAC',
    es: 'Envía paquetes Wake-on-LAN a una dirección MAC',
    pl: 'Wysyła pakiety Wake-on-LAN na adres MAC',
    uk: 'Надсилає пакети Wake-on-LAN на MAC-адресу',
    'zh-cn': '向 MAC 地址发送网络唤醒数据包',
};
Blockly.Words['net-tools_result_tooltip'] = {
    en: 'Result of the surrounding net-tools ping or port scan block. Only valid inside "then".',
    de: 'Ergebnis des umgebenden net-tools Ping- oder Port-Scan-Bausteins. Nur innerhalb von "dann" gültig.',
    ru: 'Результат окружающего блока пинга или сканирования портов net-tools. Действителен только внутри "затем".',
    pt: 'Resultado do bloco de ping ou varredura de portas net-tools envolvente. Válido apenas dentro de "então".',
    nl: 'Resultaat van het omringende net-tools ping- of poortscanblok. Alleen geldig binnen "dan".',
    fr: 'Résultat du bloc ping ou scan des ports net-tools englobant. Valable uniquement dans "puis".',
    it: 'Risultato del blocco ping o scansione porte net-tools circostante. Valido solo dentro "poi".',
    es: 'Resultado del bloque de ping o escaneo de puertos net-tools que lo contiene. Solo válido dentro de "entonces".',
    pl: 'Wynik otaczającego bloku ping lub skanowania portów net-tools. Ważny tylko wewnątrz "następnie".',
    uk: 'Результат зовнішнього блоку пінгу або сканування портів net-tools. Дійсний лише всередині "потім".',
    'zh-cn': '外层 net-tools Ping 或端口扫描块的结果。仅在"然后"中有效。',
};
Blockly.Words['net-tools_help'] = {
    en: 'https://github.com/Jey-Cee/ioBroker.net-tools/blob/master/README.md',
};

// --- Helpers ----------------------------------------------------------------
/**
 * Returns the dropdown options with all net-tools instances.
 *
 * @returns {Array<Array<string>>} Dropdown options.
 */
function netToolsInstances() {
    const options = [];
    if (typeof main !== 'undefined' && main.instances) {
        for (let i = 0; i < main.instances.length; i++) {
            const m = main.instances[i].match(/^system\.adapter\.net-tools\.(\d+)$/);
            if (m) {
                const k = parseInt(m[1], 10);
                options.push([`net-tools.${k}`, `.${k}`]);
            }
        }
    }
    if (options.length === 0) {
        for (let n = 0; n <= 4; n++) {
            options.push([`net-tools.${n}`, `.${n}`]);
        }
    }
    return options;
}

/**
 * Builds a text shadow block for the toolbox XML.
 *
 * @param {string} name - Input name.
 * @param {string} text - Default text.
 * @returns {string} XML
 */
function netToolsTextShadow(name, text) {
    return `<value name="${name}"><shadow type="text"><field name="TEXT">${text}</field></shadow></value>`;
}

// --- Ping -------------------------------------------------------------------
Blockly.Sendto.blocks['net-tools_ping'] =
    `<block type="net-tools_ping"><field name="INSTANCE"></field>${netToolsTextShadow('IP', '192.168.1.1')}</block>`;

Blockly.Blocks['net-tools_ping'] = {
    init: function () {
        this.appendDummyInput('INSTANCE')
            .appendField(Blockly.Translate('net-tools_ping'))
            .appendField(new Blockly.FieldDropdown(netToolsInstances()), 'INSTANCE');
        this.appendValueInput('IP').setCheck('String').appendField(Blockly.Translate('net-tools_ip'));
        this.appendStatementInput('DO').appendField(Blockly.Translate('net-tools_then'));

        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(Blockly.Sendto.HUE);
        this.setTooltip(Blockly.Translate('net-tools_ping_tooltip'));
        this.setHelpUrl(Blockly.Translate('net-tools_help'));
    },
};

Blockly.JavaScript['net-tools_ping'] = function (block) {
    const instance = block.getFieldValue('INSTANCE');
    const ip = Blockly.JavaScript.valueToCode(block, 'IP', Blockly.JavaScript.ORDER_ATOMIC) || "''";
    const statements = Blockly.JavaScript.statementToCode(block, 'DO');
    return (
        `sendTo('net-tools${instance}', 'ping', ${ip}, async function (res) {\n` +
        `  const netToolsResult = (res && res.result) || { host: ${ip}, alive: false, ms: null };\n` +
        `  netToolsResult.ports = [];\n` +
        `${statements}});\n`
    );
};

// --- Port scan --------------------------------------------------------------
Blockly.Sendto.blocks['net-tools_portscan'] =
    `<block type="net-tools_portscan"><field name="INSTANCE"></field>${netToolsTextShadow(
        'IP',
        '192.168.1.1',
    )}${netToolsTextShadow('PORTS', '22,80,443')}</block>`;

Blockly.Blocks['net-tools_portscan'] = {
    init: function () {
        this.appendDummyInput('INSTANCE')
            .appendField(Blockly.Translate('net-tools_portscan'))
            .appendField(new Blockly.FieldDropdown(netToolsInstances()), 'INSTANCE');
        this.appendValueInput('IP').setCheck('String').appendField(Blockly.Translate('net-tools_ip'));
        const inputPorts = this.appendValueInput('PORTS')
            .setCheck('String')
            .appendField(Blockly.Translate('net-tools_ports'));
        if (inputPorts.connection) {
            inputPorts.connection._optional = true;
        }
        this.appendStatementInput('DO').appendField(Blockly.Translate('net-tools_then'));

        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(Blockly.Sendto.HUE);
        this.setTooltip(Blockly.Translate('net-tools_portscan_tooltip'));
        this.setHelpUrl(Blockly.Translate('net-tools_help'));
    },
};

Blockly.JavaScript['net-tools_portscan'] = function (block) {
    const instance = block.getFieldValue('INSTANCE');
    const ip = Blockly.JavaScript.valueToCode(block, 'IP', Blockly.JavaScript.ORDER_ATOMIC) || "''";
    const ports = Blockly.JavaScript.valueToCode(block, 'PORTS', Blockly.JavaScript.ORDER_ATOMIC) || "''";
    const statements = Blockly.JavaScript.statementToCode(block, 'DO');
    return (
        `sendTo('net-tools${instance}', 'portScan', { ip: ${ip}, ports: ${ports} }, async function (res) {\n` +
        `  const netToolsResult = res || { host: ${ip}, ports: [], error: 'no response' };\n` +
        `  netToolsResult.alive = netToolsResult.ports && netToolsResult.ports.length > 0;\n` +
        `${statements}});\n`
    );
};

// --- Wake-on-LAN ------------------------------------------------------------
Blockly.Sendto.blocks['net-tools_wol'] =
    `<block type="net-tools_wol"><field name="INSTANCE"></field>${netToolsTextShadow('MAC', '00:11:22:33:44:55')}</block>`;

Blockly.Blocks['net-tools_wol'] = {
    init: function () {
        this.appendDummyInput('INSTANCE')
            .appendField(Blockly.Translate('net-tools_wol'))
            .appendField(new Blockly.FieldDropdown(netToolsInstances()), 'INSTANCE');
        this.appendValueInput('MAC').setCheck('String').appendField(Blockly.Translate('net-tools_mac'));

        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(Blockly.Sendto.HUE);
        this.setTooltip(Blockly.Translate('net-tools_wol_tooltip'));
        this.setHelpUrl(Blockly.Translate('net-tools_help'));
    },
};

Blockly.JavaScript['net-tools_wol'] = function (block) {
    const instance = block.getFieldValue('INSTANCE');
    const mac = Blockly.JavaScript.valueToCode(block, 'MAC', Blockly.JavaScript.ORDER_ATOMIC) || "''";
    return `sendTo('net-tools${instance}', 'wake', ${mac});\n`;
};

// --- Result -----------------------------------------------------------------
Blockly.Sendto.blocks['net-tools_result'] = '<block type="net-tools_result"><field name="ATTR">alive</field></block>';

Blockly.Blocks['net-tools_result'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(Blockly.Translate('net-tools_result'))
            .appendField(
                new Blockly.FieldDropdown([
                    [Blockly.Translate('net-tools_result_alive'), 'alive'],
                    [Blockly.Translate('net-tools_result_ms'), 'ms'],
                    [Blockly.Translate('net-tools_result_ports'), 'ports'],
                    [Blockly.Translate('net-tools_result_host'), 'host'],
                    [Blockly.Translate('net-tools_result_error'), 'error'],
                ]),
                'ATTR',
            );

        this.setInputsInline(true);
        this.setOutput(true);
        this.setColour(Blockly.Sendto.HUE);
        this.setTooltip(Blockly.Translate('net-tools_result_tooltip'));
        this.setHelpUrl(Blockly.Translate('net-tools_help'));
    },
};

Blockly.JavaScript['net-tools_result'] = function (block) {
    const attr = block.getFieldValue('ATTR');
    let code;
    switch (attr) {
        case 'alive':
            code = '!!netToolsResult.alive';
            break;
        case 'ms':
            code =
                '(netToolsResult.ms !== null && netToolsResult.ms !== undefined ? parseFloat(netToolsResult.ms) : null)';
            break;
        case 'ports':
            code = "(netToolsResult.ports || []).join(', ')";
            break;
        case 'host':
            code = "(netToolsResult.host || '')";
            break;
        default:
            code = "(netToolsResult.error || '')";
    }
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
};
