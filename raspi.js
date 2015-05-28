var fs = require('fs');
var os = require('os');
var async = require('async');

module.exports = function() {
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
