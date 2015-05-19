var net = require('net');
var util = require('util');
var async = require('async');
var later = require('later');
var fs = require('fs');
var os = require('os');
var colors = require('colors');

var xbee = require('./xbee');
var config = require('./modules/config');

var socket = require('socket.io-client')(config.host);

var xbeeList = [];
var getValTimer, getRaspiTimer;

var getValSched = {
    schedules: [{
        s: [0, 30]
    }]
};

var getRaspiSched = {
    schedules: [{
        s: [15, 45]
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

    fs.exists("/sys/class/thermal/thermal_zone0/temp", function(exists){
        if(exists){
            var file = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp", "utf8");
            var temp = (parseFloat(file) / 1000).toFixed(1);
            var tempJson = {
                mac: 'E84E061C',
                type: '1',
                value: temp
            };
            task.push(tempJson);
            console.log("CPU: " + temp);
        }
    });

    fs.exists("/proc/loadavg", function(exists){
        if(exists){
            var file = fs.readFileSync("/proc/loadavg", "utf8");
            var load = parseFloat(file.slice(0, 4));
            var loadJson = {
                mac: 'E84E061C',
                type: '13',
                value: load
            };
            task.push(loadJson);
            console.log("LOAD: " + load);
        }
    });

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
            console.log("Socket send: ".blue + util.inspect(item));
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
    console.log("Socket send: ".blue + util.inspect(json));
    socket.emit('data', json);
};

socket.on('connect', function(){
    console.log('Connected to the Server!'.yellow);

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
        }, //扫描节点
        function(cb) {
            var json = { type: "100" };
            socket.emit('data', json);
            cb(null);
        }, //获取XBee节点列表
        function(cb) {
            getValTimer = later.setInterval(getVal, getValSched);
            getRaspiTimer = later.setInterval(getRaspi, getRaspiSched);
        } //开启计划任务
    ],
    function(err) {
        if (err) console.log(err);
        // console.log(xbeeList);
    });
});

socket.on('data', function(data){
    console.log('Socket data recived: '.blue + JSON.stringify(data));

    var mac = data.mac;
    var type = data.type;
    var value = data.value;

    switch(type){
        case "100":
            xbeeList = [];
            for (var i in value) {
                var node = {
                    mac: value[i].mac,
                    type: value[i].type,
                    node: xbee.addNode(value[i].mac)
                };
                xbeeList.push(node);
            }
            break;
        case "201":
            request.get('http://192.168.2.117/decoder_control.cgi?command=2', function(error, response, body){
                console.log(body);
            }).auth('admin', '123456', true);
            setTimeout(function(){
                request.get('http://192.168.2.117/decoder_control.cgi?command=1', function(error, response, body){
                    console.log(body);
                }).auth('admin', '123456', true);
            }, 1000);
            break;
        case "202":
            request.get('http://192.168.2.117/decoder_control.cgi?command=0', function(error, response, body){
                console.log(body);
            }).auth('admin', '123456', true);
            setTimeout(function(){
                request.get('http://192.168.2.117/decoder_control.cgi?command=1', function(error, response, body){
                    console.log(body);
                }).auth('admin', '123456', true);
            }, 1000);
            break;
        case "203":
            request.get('http://192.168.2.117/decoder_control.cgi?command=6', function(error, response, body){
                console.log(body);
            }).auth('admin', '123456', true);
            setTimeout(function(){
                request.get('http://192.168.2.117/decoder_control.cgi?command=1', function(error, response, body){
                    console.log(body);
                }).auth('admin', '123456', true);
            }, 1000);
            break;
        case "204":
            request.get('http://192.168.2.117/decoder_control.cgi?command=4', function(error, response, body){
                console.log(body);
            }).auth('admin', '123456', true);
            setTimeout(function(){
                request.get('http://192.168.2.117/decoder_control.cgi?command=1', function(error, response, body){
                    console.log(body);
                }).auth('admin', '123456', true);
            }, 1000);
            break;
        default:
            setTimeout(function(){
                xbee.sendData(mac, type, value);
            }, 1000);
            break;
    }

});

socket.on('disconnect', function(){
    getValTimer.clear();
    getRaspiTimer.clear();
    xbee.disconnect();
    console.log('Disconnect to the Server!'.yellow);
});

socket.on('reconnect', function() {
    console.log('Reconnect to the Server!'.yellow);
});
