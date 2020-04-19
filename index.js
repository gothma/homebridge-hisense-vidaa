'use strict';
var Service, Characteristic;

const mqtt = require('async-mqtt');

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-hisense-vidaa", "HisenseVidaa", Accessory);
};

class Accessory {
  constructor(log, config) {
    this.log = log;

    // Default config
    this.config = config;
    this.config.name = config.name || "Hisense TV"

    this.services = {};

    this.client = new Remote(this.config.ip, this.log);

    this.tv = new Service.Television(this.config.name, 'Television');

    this.tv
      .setCharacteristic(Characteristic.ConfiguredName,
        this.config.name);

    this.tv
      .getCharacteristic(Characteristic.Active)
      //.on('set', (x) => x)
      //.on('get', this.remote.get_on.bind(this));

    this.tv
      .setCharacteristic(Characteristic.SleepDiscoveryMode,
        Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
      );

    this.tv.getCharacteristic(Characteristic.RemoteKey)
      .on('set', this.setRemoteKey);


    this.speaker = new Service.TelevisionSpeaker();

    this.speaker
      .setCharacteristic(Characteristic.Active, Characteristic.Active.ACTIVE);

    this.speaker
      .setCharacteristic(Characteristic.VolumeControlType, Characteristic.VolumeControlType.ABSOLUTE);

    this.speaker
      .setCharacteristic(Characteristic.Volume)
      .on('set', (x) => this.log.info(`Volume ${x}`))
      .on('get', (x) => 100);
  }

  getServices() {
    return [this.tv, this.speaker];
  }

  setRemoteKey = async key => {
    let bindings = {
      [Characteristic.RemoteKey.REWIND]: 'KEY_BACKS',
      [Characteristic.RemoteKey.FAST_FORWARD]: 'KEY_FORWARDS',
      [Characteristic.RemoteKey.NEXT_TRACK]: 'KEY_MENU',
      [Characteristic.RemoteKey.PREVIOUS_TRACK]: 'KEY_MENU',
      [Characteristic.RemoteKey.ARROW_UP]: 'KEY_UP',
      [Characteristic.RemoteKey.ARROW_DOWN]: 'KEY_DOWN',
      [Characteristic.RemoteKey.ARROW_LEFT]: 'KEY_LEFT',
      [Characteristic.RemoteKey.ARROW_RIGHT]: 'KEY_RIGHT',
      [Characteristic.RemoteKey.SELECT]: 'KEY_OK',
      [Characteristic.RemoteKey.BACK]: 'KEY_RETURNS',
      [Characteristic.RemoteKey.EXIT]: 'KEY_EXIT',
      [Characteristic.RemoteKey.PLAY_PAUSE]: 'KEY_PAUSE',
      [Characteristic.RemoteKey.INFORMATION]: 'KEY_MENU'
    };
    const message = bindings[key];
    this.log.info(`Will send ${message}`);
    return this.client.send('remote_service', 'sendkey', message);
  };
}

class Remote {
  constructor(ip, log) {
    this.log = log;
    //  mosquitto_pub -h 192.168.3.150 -p 36669 -u hisenseservice -P multimqttservice -d --psk 0 --psk-identity 0 -t /remoteapp/tv/remote_service/XX:XX:XX:XX:XX:XY$normal/actions/sendkey -m KEY_MENU
    let options = {
      'host': ip,
      'port': 36669,
      'protocol': 'mqtts',
      'rejectUnauthorized': false,
      'username': 'hisenseservice',
      'password': 'multimqttservice',
      'connectTimeout': 5000,
    };

    this.mqtt = mqtt.connect(options);
  }

  async send(service, action, message) {
    return this.mqtt.publish(`/remoteapp/tv/${service}/XX:XX:XX:XX:XX:XY$normal/actions/${action}`, message);
  }
}
