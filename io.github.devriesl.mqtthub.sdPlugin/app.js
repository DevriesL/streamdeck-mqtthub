/* global $SD */
$SD.on('connected', conn => connected(conn));

function connected(jsn) {
    console.log('Connected Plugin:', jsn);

    $SD.on('io.github.devriesl.mqtthub.action.didReceiveSettings', jsonObj =>
        action.onDidReceiveSettings(jsonObj)
    );
    $SD.on('io.github.devriesl.mqtthub.action.willAppear', jsonObj =>
        action.onWillAppear(jsonObj)
    );
    $SD.on('io.github.devriesl.mqtthub.action.willDisappear', jsonObj =>
        action.onWillDisappear(jsonObj)
    );
    $SD.on('io.github.devriesl.mqtthub.action.keyUp', jsonObj =>
        action.onKeyUp(jsonObj)
    );
    $SD.on('io.github.devriesl.mqtthub.action.sendToPlugin', jsonObj =>
        action.onSendToPlugin(jsonObj)
    );
}

var mqttClient = null

function mqttInit(context, settings) {
    if (mqttClient) {
        mqttClient.end();
        mqttClient = null;
    }

    if (!settings.host || !settings.port || !settings.path) {
        console.log('MQTT settings are incomplete');
        return;
    }

    let scheme = 'ws://';
    if (settings.ssl_secure.includes("enable")) {
        scheme = 'wss://';
    }

    let host = scheme + settings.host + ':' + settings.port + settings.path;

    let options = {
        keepalive: 30,
        clientId: settings.cliend_id,
        username: settings.username,
        password: settings.password,
        protocolId: 'MQTT',
        protocolVersion: 5,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        rejectUnauthorized: false
    };

    mqttClient = mqtt.connect(host, options);

    mqttClient.on('connect', () => {
        console.log('MQTT connect: ', settings.cliend_id)
        mqttClient.subscribe(settings.subscribe_topic, { qos: 0 })
    });
    mqttClient.on('error', (error) => {
        console.log('MQTT error: ', error)
    });
    mqttClient.on('message', (topic, message) => {
        console.log('MQTT receive message：', message.toString() + '\nOn topic:= ' + topic)
        drawMessage(context, message.toString())
    });
}

function drawMessage(context, message) {
    if (message.startsWith('data:image/png;base64')) {
        $SD.api.setImage(context, message);
    } else {
        canvas = document.createElement('canvas');
        canvas.width = 144;
        canvas.height = 144;
        var ctx = canvas.getContext("2d");

        ctx.fillStyle = "#cccccc";
        ctx.font = "48px Arial";
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(message, 72, 72, 144);
        $SD.api.setImage(context, canvas.toDataURL());
    }
}

var action = {
    type: 'io.github.devriesl.mqtthub.action',
    cache: {},

    onDidReceiveSettings: function (jsn) {
        console.log('onDidReceiveSettings:', jsn);
    },

    onWillAppear: function (jsn) {
        console.log('onWillAppear:', jsn);

        mqttInit(jsn.context, jsn.payload.settings)
    },

    onWillDisappear: function (jsn) {
        console.log('onWillDisappear:', jsn);

        if (mqttClient) {
            mqttClient.end();
            mqttClient = null;
        }
    },

    onKeyUp: function (jsn) {
        console.log('onKeyUp:', jsn);

        if (jsn.payload && mqttClient) {
            let setting = jsn.payload.settings;
            mqttClient.publish(setting.publish_topic, setting.message, { qos: 0, retain: setting.retain.includes('enable') });
        }
    },

    onSendToPlugin: function (jsn) {
        console.log('onDidReceiveSettings:', jsn);

        if (jsn.payload) {
            $SD.api.setSettings(jsn.context, jsn.payload);
            mqttInit(jsn.context, jsn.payload);
        }
    },
};
