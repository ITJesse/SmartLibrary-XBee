var net = require('net');
var async = require('async');
var later = require('later');
var xbee = require('./xbee');
var config = require('./modules/config');

var HOST = config.host;
var PORT = config.port;
var client = new net.Socket();

var xbeeList;

var getValSched = {
    schedules: [{
        s: [0, 15, 30, 45]
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

var onXbeeData = function(data){
    // console.log(data);
    var res = data.split("|");
    var json = {
        mac: res[0],
        type: res[1],
        value: res[2]
    };
    console.log(json);
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
                xbee.scan(function(list) {
                    xbeeList = list;
                    cb(null);
                });
            },
            // function(cb) {
            //     xbee.getXbeeList(function(err, list) {
            //         if (err) cb(err);
            //         cb(null, list);
            //     });
            // }, //获取XBee节点列表
            // function(list, cb) {
            //     for (var i in list) {
            //         var node = {
            //             type: list[i].type,
            //             node: xbee.addNode(list[i].mac)
            //         };
            //         xbeeList.push(node);
            //     }
            //     cb(null);
            // }, //将节点插入轮询列表
            function(cb) {
                var getValTimer = later.setInterval(getVal, getValSched);
                cb(null);
            }
        ],
        function(err) {
            // if (err) return console.log(err);
            // console.log(xbeeList);
        });
});

client.on('data', function(data) {

    console.log('DATA: ' + data);

});
