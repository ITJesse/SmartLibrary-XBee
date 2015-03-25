var util = require('util');
var XBee = require('svd-xbee');
var mysql = require('./modules/mysql');

// This parser buffers data, emits chucks
// seperated by space chars (" ")
var Parser = require('./parser.js');

var xbee = new XBee.XBee({
    port: '/dev/cu.usbserial', // replace with yours
    baudrate: 9600 // 9600 is default
});

exports.init = function(callback){

    // Open COM port, read some parameters from the XBee at once.
    xbee.init();


    // Emitted when .init() is done (COM port open, parameters read)
    xbee.on("initialized", function(params) {
        console.log("XBee Parameters: %s", util.inspect(params));
        callback(xbee);
    });

    xbee.on("newNodeDiscovered", function(node) {
        console.log("XBee found: " + node.remote64.hex);
        // console.log(util.inspect(node));

        // node.on("data", function(data) {
        //     console.log("%s> %s", node.remote64.hex, util.inspect(data));
        //     node.send("pong", function(err, status) {
        //         // Transmission successful if err is null
        //     });
        // });
    });
};

exports.scan = function(){
    xbee.discover();
    console.log("Node discovery starded...");
    xbee.on("discoveryEnd", function() {
        console.log("...node discovery over");
    });
};

exports.getXbeeList = function(callback) {
    var sql = "SELECT * FROM xbee_list";
    var xbeeList = [];
    mysql.query(sql, function(err, rows){
        if(err){
            return callback(err);
        }
        for(var i in rows){
            xbeeList.push(rows[i]);
        }
        // console.log(xbeeList);
        callback(null, xbeeList);
    });
};

exports.addNode = function(mac){
    // console.log(mac);
    var macArray = [];
    for(var i=0; i<=mac.length; i=i+2){
        macArray.push(parseInt('0x' + mac.slice(i, i+2)));
    }
    // console.log(macArray);
    return xbee.addNode([0x00,0x13,0xa2,0x00,macArray[0],macArray[1],macArray[2],macArray[3]], Parser);
};

exports.getVal = function(node){
    console.log(node);
    var data = node.remote64.hex.slice(8,16).toUpperCase() + "|0\n";
    console.log("XBee send: " + data);
    node.send(data);
};
