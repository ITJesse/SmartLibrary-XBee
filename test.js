var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var iconv = require('iconv-lite');

var serialPort = new SerialPort("/dev/cu.wchusbserial1410", {
    baudrate: 9600,
    // buffersize: 1024,
    // parser: serialport.parsers.readline(new Buffer(['0d']))
    // parser: serialport.parsers.raw,
    parser: serialport.parsers.readline("\n")
}, false);

serialPort.open(function(error) {
    if (error) {
        console.log('Failed to open: ' + error);
    } else {
        console.log('Serialport Open');

        serialPort.on('data', function(data) {
            console.log(data.toString());
        });
    }
});
