var net = require('net');
var util = require('util');
var async = require('async');
var later = require('later');
var fs = require('fs');
var os = require('os');
var xbee = require('./xbee');
var config = require('./modules/config');

var socket = require('socket.io-client')(config.host);

var xbeeList = [];

var getValSched = {
    schedules: [{
        s: [0, 30]
    }]
};

var getRaspiSched = {
    schedules: [{
        s: [15, 50]
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
    var task = [];

    var file = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp", "utf8");
    var temp = (parseFloat(file) / 1000).toFixed(1);
    var tempJson = {
        mac: 'E84E061C',
        type: '1',
        value: temp
    };
    task.push(tempJson);
    console.log("CPU: " + temp);

    var file = fs.readFileSync("/proc/loadavg", "utf8");
    var load = parseFloat(file.slice(0, 4));
    var loadJson = {
        mac: 'E84E061C',
        type: '13',
        value: load
    };
    task.push(loadJson);
    console.log("LOAD: " + load);

    var mem = Math.floor((os.totalmem() - os.freemem()) / 1024 / 1024);
    var memJson = {
        mac: 'E84E061C',
        type: '12',
        value: mem
    };
    task.push(memJson);
    console.log("MEM: " + mem);

    async.eachSeries(task, function(item, callback) {
        setTimeout(function() {
            socket.emit('data', item);
            callback(null);
        }, 1000);
    });
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
    socket.emit('data', json);
};

socket.on('connect', function(){
    console.log('Connected to the Server!');
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
            socket.emit('data', json);
            cb(null);
        } //获取XBee节点列表
    ],
    function(err) {
        if (err) console.log(err);
        // console.log(xbeeList);
    });
});

socket.on('data', function(data){
    console.log('Socket data recived: ' + JSON.stringify(data));

    var mac = data.mac;
    var type = data.type;
    var value = data.value;

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
            var getRaspiTimer = later.setInterval(getRaspi, getRaspiSched);
            break;
        default:
            setTimeout(function(){
                xbee.sendData(mac, type, value);
            }, 1000);
            break;
    }

});

socket.on('disconnect', function(){
    console.log('Disconnect to the Server!');
});

socket.on('reconnect', function() {
    console.log('Reconnect to the Server!');
})
