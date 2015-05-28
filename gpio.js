var gpio = require('rpi-gpio');

var switchPin = 7;
var beepPin = 13;

var refreshSwitchStatus = function(xbee){
    this.isAlarm = false;
    this.xbee = xbee;

    var beep = function() {
        gpio.write(13, true, function(err){
            if(err) return console.log(err);
            setTimeout(function(){
                gpio.write(13, false, function(err){
                    if(err) return console.log(err);
                });
            }, 500);
        })
    }

    var readInput = function() {
        gpio.read(7, function(err, value) {
            if(err) return console.log(err);
            if(this.isAlarm != value){
                this.isAlarm = value;
                beep();
                if(!value){
                    this.xbee.sendData(fanNode.mac, "101", "0");
                    this.xbee.sendData(alarmNode.mac, "102", "0");
                }
            }
        });
    }

    gpio.setup(beepPin, gpio.DIR_OUT);
    gpio.setup(switchPin, gpio.DIR_IN, readInput);

    setInterval(readInput, 100);
}

refreshSwitchStatus.prototype.getIsAlarm = function(){
    return this.isAlarm;
}

module.exports = refreshSwitchStatus;
