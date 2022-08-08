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

const host = 'ws://192.168.0.1:1883/mqtt'

const options = {
    keepalive: 30,
    clientId: "Stream Deck",
    protocolId: 'MQTT',
    protocolVersion: 5,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    rejectUnauthorized: false
}

var action = {
    type: 'io.github.devriesl.mqtthub.action',
    cache: {},

    onDidReceiveSettings: function (jsn) {
        console.log('onDidReceiveSettings:', jsn);
    },

    onWillAppear: function (jsn) {
        console.log('onWillAppear:', jsn);

        const client = mqtt.connect(host, options)
        client.on('reconnect', (error) => {
            console.log('reconnecting:', error)
        })
        client.on('error', (error) => {
            console.log('Connection failed:', error)
        })
        client.on('message', (topic, message) => {
            console.log('receive message：', topic, message.toString())
        })
    },

    onWillDisappear: function (jsn) {
        console.log('onWillDisappear:', jsn);
    },

    onKeyUp: function (jsn) {
        console.log('onKeyUp:', jsn);
    },

    onSendToPlugin: function (jsn) {
        console.log('onDidReceiveSettings:', jsn);

        if (jsn.payload) {
            $SD.api.setSettings(jsn.context, jsn.payload);
        }
    },
};
