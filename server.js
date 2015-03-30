var net = require('net');
var util = require('util');
var async = require('async');
var later = require('later');
var fs = require('fs');
var xbee = require('./xbee');
var config = require('./modules/config');

var HOST = config.host;
var PORT = config.port;
var client = new net.Socket();

var xbeeList = [];

var getValSched = {
    schedules: [{
        s: [0, 15, 30, 45]
    }]
};

var getRaspiSched = {
    schedules: [{
        s: [10, 25, 45, 55]
    }]
};

var getVal = function() {
    console.log(new Date());
    async.eachSeries(xbeeList, function(item, callback) {
        setTimeout(function() {
            xbee.getVal(item);
            callback(null);
        }, 1000);
    });
};

var getRaspi = function() {
    var file = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp", "utf8");
    var temp = (parseFloat(file) / 1000).toFixed(1);
    var item = {
        mac: 'E84E061C187B',
        type: '1',
        value: temp
    }
    console.log("CPU: " + temp);
    client.write(JSON.stringify(item));
}

var onXbeeData = function(data){
    // console.log(data);
    data = data.slice(0, data.length - 1);
    var res = data.split("|");
    var json = {
        mac: res[0],
        type: res[1],
        value: res[2]
    };
    console.log("Socket send: " + util.inspect(json));
    client.write(JSON.stringify(json));
};

client.connect(PORT, HOST, function() {

    console.log('CONNECTED TO: ' + HOST + ':' + PORT);

    async.waterfall([
            function(cb) {
                xbee.init(function() {
                    cb(null);
                }, onXbeeData);
            }, //初始化XBee
            function(cb) {
                xbee.scan(function() {
                    cb(null);
                });
            },
            function(cb) {
                var json = { type: "100" };
                client.write(JSON.stringify(json));
                cb(null);
            } //获取XBee节点列表
        ],
        function(err) {
            // if (err) return console.log(err);
            // console.log(xbeeList);
        });
});

client.on('data', function(data) {
    console.log('Socket data recived: ' + data);

    var json = JSON.parse(data);
    var mac = json.mac;
    var type = json.type;
    var value = json.value;

    switch(type){
        case "8":
            setTimeout(function(){
                xbee.sendData(mac, type, value);
            }, 1000);
            break;
        case "100":
            for (var i in value) {
                var node = {
                    mac: value[i].mac,
                    type: value[i].type,
                    node: xbee.addNode(value[i].mac)
                };
                xbeeList.push(node);
            }
            //将节点插入轮询列表
            var getValTimer = later.setInterval(getVal, getValSched);
            break;
        default:
    }

    var getRaspiTimer = later.setInterval(getRaspi, getRaspiSched);

});
