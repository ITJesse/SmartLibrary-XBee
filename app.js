var mysql = require('./modules/mysql');
var async = require('async');
var later = require('later');
var serialport = require("serialport");
var SerialPort = serialport.SerialPort;

var serialPort = new SerialPort("/dev/tty.usbserial", {
    baudrate: 9600,
    buffersize: 1024,
    parser: serialport.parsers.readline("\n")
}, false);

var xbeeList = [];

// var getListSched = {
//     schedules: [{
//         m: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
//     }]
// };
var getValSched = {
    schedules: [{
        s: [0, 15, 30, 45]
    }]
};

var sendData = function(data){
    serialPort.write(data, function(err, results) {
        if (err) {
            console.log('Failed to send data: ' + err);
        } else {
            console.log('Send: ' + data.substr(0, data.length - 1));
        }
    });
};

var sendErr = function(mac, err, info){
    var sendData = mac + '|-1|' + info;
    sendData(data);
    return console.log(err);
};

var getVal = function() {
    console.log(new Date());
    async.eachSeries(xbeeList, function(item, callback) {
        setTimeout(function() {
            var data = item.mac + "|"+ item.type + "|0\n";
            sendData(data);
            callback(null);
        }, 1000);
    });
};

var getXbeeList = function(callback) {
    var data = '1\n';
    sendData(data);
    var sql = "SELECT * FROM xbee_list";
    mysql.query(sql, function(err, rows){
        if(err){
            return callback(err);
        }
        for(var i in rows){
            xbeeList.push(rows[i]);
        }
        console.log(xbeeList);
        callback(null);
    });
};

serialPort.open(function(error) {
    if (error) {
        console.log('Failed to open: ' + error);
    } else {
        console.log('Serialport Open');

        serialPort.on('data', function(data) {
            console.log('Data received: ' + data);
            var res = data.split('|');
            switch (res[1]) {
                // case '0':
                //     if (xbeeList.indexOf(res[0]) == -1) {
                //         xbeeList.push(res[0]);
                //     }
                //     console.log(xbeeList);
                //     break;
                case '1':
                case '2':
                case '3':
                case '5':
                case '6':
                    var mac = res[0];
                    var type = res[1];
                    var value = res[2];
                    var sql = "INSERT INTO xbee_data (mac, type, value) VALUES ('"+mac+"', '"+type+"', '"+value+"')";
                    mysql.query(sql, function(err){
                        if(err) return console.log(err);
                    });
                    break;
                case '4':
                    break;
                default:
            }
        });

        getXbeeList(function(err){
            if(err) return sendErr(mac, err, 'error');
            var getValTimer = later.setInterval(getVal, getValSched);
        });
        // var getListTimer = later.setInterval(getXbeeList, getListSched);
    }
});
