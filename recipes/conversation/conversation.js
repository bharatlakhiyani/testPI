/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var TJBot = require('tjbot');
var config = require('./config');

// obtain our credentials from config.js
var credentials = config.credentials;

// obtain user-specific config
var WORKSPACEID = config.conversationWorkspaceId;

// these are the hardware capabilities that TJ needs for this recipe
var hardware = ['microphone', 'speaker','servo'];

// set up TJBot's configuration
var tjConfig = {
    log: {
        level: 'verbose'
    }
};

var iotf = require("ibmiotf");
var config1 = require("./device.json");
var watson = require('watson-developer-cloud');
var exec = require('child_process').exec;
var fs = require('fs');
var gpio = require('mmm-gpio')

var pigpio = require('pigpio')
pigpio.initialize();

var text_to_speak = "This is a test one";

var text_to_speech = watson.text_to_speech({
    username: config1.TTSUsername,
    password: config1.TTSPassword,
    version: 'v1'
});

var params = {
    text: text_to_speak,
    voice: config.voice,
    accept: 'audio/wav'
};

var deviceClient = new iotf.IotfDevice(config1);
var mincycle = 500; var maxcycle = 2300 ;
var dutycycle = mincycle;
var iswaving = false ;
var Gpio = pigpio.Gpio;
var motor = new Gpio(7, {mode: Gpio.OUTPUT});
var interval = 700;
console.log("outputting ", JSON.stringify(config1, null, 4));

//setting the log level to trace. By default its 'warn'
deviceClient.log.setLevel('debug');

deviceClient.connect();


// instantiate our TJBot!
var tj = new TJBot(hardware, tjConfig, credentials);

console.log("You can ask me to introduce myself or tell you a joke.");
console.log("Try saying, \"" + tj.configuration.robot.name + ", please introduce yourself\" or \"" + tj.configuration.robot.name + ", who are you?\"");
console.log("You can also say, \"" + tj.configuration.robot.name + ", tell me a joke!\"");

//tj.shine("green");

var speak = function(text_to_speak) {
    params.text = text_to_speak;
    tempStream = text_to_speech.synthesize(params).pipe(fs.createWriteStream('output.wav')).on('close', function() {
        var create_audio = exec('aplay output.wav', function(error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });
    });
};

var dance = function(tjj) {
};

deviceClient.on('connect', function() {
                console.log("connected");


// listen for utterances with our attentionWord and send the result to
// the Conversation service
tj.listen(function(msg) {
    // check to see if they are talking to TJBot
    if (msg.startsWith(tj.configuration.robot.name)) {
        // remove our name from the message
        var turn = msg.toLowerCase().replace(tj.configuration.robot.name.toLowerCase(), "");
console.log("Here1");
        // send to the conversation service
        tj.converse(WORKSPACEID, turn, function(response) {
            // speak the result
console.log("Here 2");
            	tj.speak(response.description);
console.log("Here 3");
	    	deviceClient.publish('myevt', 'json', '{"value":"'+response.description+'"}', 2);
console.log("Here 4");
        });
    }
});

});


deviceClient.on("command", function(commandName, format, payload, topic) {
    console.log('payload: ', payload.toString(), ' and topic: ', topic);
    var jsonCommand = JSON.parse(payload.toString());
    if(jsonCommand && jsonCommand.action && jsonCommand.action==="talk"){
        speak("Let's Talk");
    } else if(jsonCommand && jsonCommand.action && jsonCommand.action==="music"){
        speak('Music is not cheap');
    } else if(jsonCommand && jsonCommand.action && jsonCommand.action==="wave"){
        tj.wave();
    } else if(jsonCommand && jsonCommand.action && jsonCommand.action==="anger"){
	speak('Why are you trying to make me angry?');
    } else if(jsonCommand && jsonCommand.action && jsonCommand.action==="dance"){
	exec('aplay -d 10 gangam.wav', function(error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });
    }  
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
