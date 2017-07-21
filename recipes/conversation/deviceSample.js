var iotf = require("../");
var config = require("./device.json");
var watson = require('watson-developer-cloud');
var exec = require('child_process').exec;
var fs = require('fs');
var gpio = require('mmm-gpio')

var pigpio = require('pigpio')
pigpio.initialize();

var text_to_speak = "This is a test one";

var text_to_speech = watson.text_to_speech({
    username: config.TTSUsername,
    password: config.TTSPassword,
    version: 'v1'
});

var params = {
    text: text_to_speak,
    voice: config.voice,
    accept: 'audio/wav'
};

var deviceClient = new iotf.IotfDevice(config);

//setting the log level to trace. By default its 'warn'
deviceClient.log.setLevel('debug');

deviceClient.connect();

deviceClient.on('connect', function(){ 
    var i=0;
    console.log("connected");
    setInterval(function function_name () {
    	i++;
    	deviceClient.publish('myevt', 'json', '{"value":'+i+', "name":"DMITRI and BIBI"}', 2);
    },2000);
});

deviceClient.on('reconnect', function(){ 

	console.log("Reconnected!!!");
});

deviceClient.on('disconnect', function(){
  console.log('Disconnected from IoTF');
});

deviceClient.on('error', function (argument) {
	console.log(argument);
});

var mincycle = 500; var maxcycle = 2300 ;
var dutycycle = mincycle;
var iswaving = false ;
var Gpio = pigpio.Gpio;
var motor = new Gpio(7, {mode: Gpio.OUTPUT});   
var interval = 700 ;

deviceClient.on("command", function(commandName, format, payload, topic) {
    console.log('payload: ', payload.toString(), ' and topic: ', topic);
    var jsonCommand = JSON.parse(payload.toString());
    if(jsonCommand && jsonCommand.action && jsonCommand.action=="talk"){
    	speak("Let's Talk");
    } else if(jsonCommand && jsonCommand.action && jsonCommand.action=="music"){
	speak('Music is not cheap');
    } else if(jsonCommand && jsonCommand.action && jsonCommand.action=="wave"){
            var pulse = setInterval(function() {
     	        motor.servoWrite(maxcycle);
      	       	setTimeout(function(){
                  if (motor != null) {
                  motor.servoWrite(mincycle);
               }
             }, interval/3);
           }); 		
 	 }
});

var speak = function(text_to_speak) {
    params.text = text_to_speak;
    tempStream = text_to_speech.synthesize(params).pipe(fs.createWriteStream('output.wav')).on('close', function() {
        var create_audio = exec('aplay output.wav', function(error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });
    });
}
