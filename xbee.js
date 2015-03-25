var util = require('util');
var XBee = require('svd-xbee');
var config = require('./modules/config');
// var mysql = require('./modules/mysql');

// This parser buffers data, emits chucks
// seperated by space chars (" ")

var xbee = new XBee.XBee({
    port: config.serial, // replace with yours
    baudrate: config.baudrate // 9600 is default
});

var xbeeList = [];

exports.init = function(callback, onXbeeData){

    // Open COM port, read some parameters from the XBee at once.
    xbee.init();


    // Emitted when .init() is done (COM port open, parameters read)
    xbee.on("initialized", function(params) {
        console.log("XBee Parameters: %s", util.inspect(params));
        callback();
    });

    xbee.on("newNodeDiscovered", function(node) {
        console.log("XBee found: " + node.remote64.hex);
        if(xbeeList.indexOf(node) == -1)
            xbeeList.push(node);
        // console.log(util.inspect(node));

        node.on("data", function(data) {
            console.log("XBee recived %s> %s", node.remote64.hex, util.inspect(data));
            onXbeeData(data);
        });
    });
};

exports.scan = function(callback){
    xbee.discover();
    console.log("Node discovery starded...");
    xbee.on("discoveryEnd", function() {
        console.log("Node discovery over");
        callback(xbeeList);
    });
};

// exports.getXbeeList = function() {
//     return xbeeList;
// };

// exports.getXbeeList = function(callback) {
//     var sql = "SELECT * FROM xbee_list";
//     var xbeeList = [];
//     mysql.query(sql, function(err, rows){
//         if(err){
//             return callback(err);
//         }
//         for(var i in rows){
//             xbeeList.push(rows[i]);
//         }
//         // console.log(xbeeList);
//         callback(null, xbeeList);
//     });
// };

exports.addNode = function(mac){
    // console.log(mac);
    var macArray = [];
    for(var i=0; i<=mac.length; i=i+2){
        macArray.push(parseInt('0x' + mac.slice(i, i+2)));
    }
    // console.log(macArray);
    return xbee.addNode([0x00,0x13,0xa2,0x00,macArray[0],macArray[1],macArray[2],macArray[3]]);
};

exports.getVal = function(node){
    // console.log(node);
    var data = node.remote64.hex.slice(8,16).toUpperCase() + "|0\n";
    console.log("XBee send: " + data.slice(1, data.length - 1));
    xbee.broadcast(data, function(err, status){
        if(err) return console.log(err);
        // console.log("Send status: " + status);
    });
};
