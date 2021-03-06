var util = require('util');
var XBee = require('./svd-xbee');
var config = require('./config');
// var mysql = require('./modules/mysql');

// This parser buffers data, emits chucks
// seperated by space chars (" ")

var xbee, xbeeList = [];

exports.init = function(callback, onXbeeData){

    xbee = new XBee.XBee({
        port: config.serial, // replace with yours
        baudrate: config.baudrate, // 9600 is default
        transmit_status_timeout: 3000
    });

    // Open COM port, read some parameters from the XBee at once.
    xbee.init();


    // Emitted when .init() is done (COM port open, parameters read)
    xbee.on("initialized", function(params) {
        console.log("XBee Parameters: %s".green, util.inspect(params));
        callback();
    });

    xbee.on("newNodeDiscovered", function(node) {
        console.log("XBee found: ".green + node.remote64.hex);
        // if(xbeeList.indexOf(node) == -1)
        //     xbeeList.push(node);
        // console.log(util.inspect(node));

        node.on("data", function(data) {
            console.log("XBee recived %s> %s".green, node.remote64.hex, util.inspect(data));
            onXbeeData(data);
        });
    });
};

exports.disconnect = function(callback){
    xbee.disconnect(function(){
        console.log("XBee disconnect".green);
    });
}

exports.scan = function(callback){
    xbee.discover();
    console.log("Node discovery starded...".green);
    xbee.on("discoveryEnd", function() {
        console.log("Node discovery over".green);
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

exports.getVal = function(item){
    // console.log(node);
    var data = item.mac + "|" + item.type + "|0\n";
    console.log("XBee send: %s".green, util.inspect(data));
    xbee.broadcast(data, function(err, status){
        if(err) return console.log(err);
        // console.log("Send status: " + status);
    });
};

exports.sendData = function(mac, type, value){
    // console.log(node);
    var data = mac + "|" + type + "|" + value + "\n";
    console.log("XBee send: %s".green, util.inspect(data));
    xbee.broadcast(data, function(err, status){
        if(err) return console.log(err);
        // console.log("Send status: " + status);
    });
};
