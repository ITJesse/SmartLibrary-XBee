var gpio = require('rpi-gpio');

var switchPin = 7;
var beepPin = 13;

var refreshSwitchStatus = function(options){
    this.isAlarm = false;
    this.xbee = options.XBee;
    this.alarmNode = options.alarm;
    this.fanNode = options.fan;

}

refreshSwitchStatus.prototype.init = function(){
    console.log(this);
    var _this = this;

    gpio.setup(beepPin, gpio.DIR_OUT, _this.beep);
    gpio.setup(switchPin, gpio.DIR_IN);

    var readInput = function() {
        gpio.read(switchPin, function(err, value) {
            if(err) return console.log(err);
            if(_this.isAlarm != value){
                _this.isAlarm = value;
                _this.beep();
                if(!value){
                    // if(_this.fanNode)
                        _this.xbee.sendData(_this.fanNode.mac, "101", "0");
                    // if(_this.alarmNode)
                        _this.xbee.sendData(_this.alarmNode.mac, "102", "0");
                }
            }
        });
    }
    setInterval(readInput, 100);
}

refreshSwitchStatus.prototype.beep = function() {
    gpio.write(beepPin, true, function(err){
        if(err) return console.log(err);
        setTimeout(function(){
            gpio.write(beepPin, false, function(err){
                if(err) return console.log(err);
            });
        }, 500);
    })
}

refreshSwitchStatus.prototype.getIsAlarm = function(){
    return this.isAlarm;
}

module.exports = refreshSwitchStatus;
