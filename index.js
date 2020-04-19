'use strict';
var Service, Characteristic;

const mqtt = require('mqtt');

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

    this.services.tv = new Service.Television(this.config.name, 'Television');

    this.services.tv
      .setCharacteristic(Characteristic.ConfiguredName,
        this.config.name);

    this.services.tv
      .setCharacteristic(Characteristic.SleepDiscoveryMode,
        Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
      );

    this.services.tv
      .getCharacteristic(Characteristic.Active)


    this.services.speaker = new Service.TelevisionSpeaker();

    this.services.speaker
      .setCharacteristic(Characteristic.Active, Characteristic.Active.ACTIVE);

    this.services.speaker
      .setCharacteristic(Characteristic.VolumeControlType, Characteristic.VolumeControlType.ABSOLUTE);

    this.services.speaker
      .setCharacteristic(Characteristic.Volume)
      .on('set', (x) => this.log.info(`Volume ${x}`))
      .on('get', (x) => 100);
  }

  getServices() {
    return Object.keys(this.services).map((key) => this.services[key]);
  }
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
    process.env['DEBUG'] = 'mqttjs*'

    this.mqtt = mqtt.connect(options);

    this.mqtt.publish('/remoteapp/tv/remote_service/XX:XX:XX:XX:XX:XY$normal/actions/sendkey', 'KEY_MENU');
  }
}
