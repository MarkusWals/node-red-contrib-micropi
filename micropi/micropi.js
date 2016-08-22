//https://github.com/ashishbajaj99/mic
//https://www.npmjs.com/package/mic
//http://www.linuxcircle.com/2013/05/08/raspberry-pi-microphone-setup-with-usb-sound-card/
//https://subvisual.co/blog/posts/39-tutorial-html-audio-capture-streaming-to-node-js-no-browser-extensions
//http://nodered.org/docs/creating-nodes/node-js
//http://stackoverflow.com/questions/34364583/how-to-use-the-write-function-for-wav-module-in-nodejs
//http://noderedguide.com/index.php/2015/10/28/node-red-lecture-3-basic-nodes-and-flows/#h.5zaw60nvfsyj

//TODO raw output, msg.channels, .samplerate, input fields, silence status

module.exports = function(RED) {
    function micropiNode(config) {

        RED.nodes.createNode(this, config);

		var mic = require('mic');
		var fs = require('fs');
		var wav = require('wav');
        var node = this;
		var path;
		var filename;
		var msgOut;
        
        // Access the node's context object
        var context = this.context().global;

        var recording = context.get('recording') || false;
        recording = false;
        context.set('recording',recording);
		
        var micInstance = mic({ 'rate': config.samplerate, 'channels': config.channels, 'bitwidth' : config.bitdepth , 'debug': true, 'exitOnSilence': 6 });
		var micInputStream = micInstance.getAudioStream();
		var outputFileStream;
		
		micInputStream.on('data', function(data) {
			console.log("Recieved Input Stream: " + data.length);
			node.send([null, {audiostream:data}]);
		});

		micInputStream.on('error', function(err) {
			console.log("Error in Input Stream: " + err);
			node.send([null, {payload:"Error: " + err}]);
		});

		micInputStream.on('startComplete', function() {
			
				recording = true;
				context.set('recording',recording);
			
				console.log("Got SIGNAL startComplete");
				node.status({fill:"green",shape:"dot",text:"recording"});
				
				setTimeout(function() {
						micInstance.pause();
					}, (config.silence * 1000));
				
				return [null, {payload:"started"}];
			});

		micInputStream.on('stopComplete', function() {
			
				node.send([null, {payload:"stopped"}]);
				
				console.log("Got SIGNAL stopComplete");
				node.status({fill:"red",shape:"dot",text:"stopped"});
			});

		micInputStream.on('pauseComplete', function() {
				console.log("Got SIGNAL pauseComplete");
				node.status({fill:"yellow",shape:"ring",text:"paused"});
				
				node.send([null, {payload:"paused"}]);
				
				setTimeout(function() {
						micInstance.resume();
					}, 5000);
			});

		micInputStream.on('resumeComplete', function() {
				console.log("Got SIGNAL resumeComplete");
				node.status({fill:"green",shape:"dot",text:"recording"});

				recording = true;
				context.set('recording',recording);
				
				node.send([null, {payload:"resumed"}]);
				
				console.log("Got SIGNAL startComplete");
				node.status({fill:"green",shape:"dot",text:"recording"});
				
				setTimeout(function() {
						micInstance.stop();
					}, 5000);
			});

		micInputStream.on('silence', function() {
				console.log("Got SIGNAL silence");
				node.send([null, {payload:"silence"}]);
			});

		micInputStream.on('processExitComplete', function() {
				console.log("Got SIGNAL processExitComplete");
				recording = false;
                context.set('recording',recording);
				node.send([null, {payload:"processExitComplete"}]);
			});
		
		this.on('input', function(msg) {
			
			if(msg.payload == true  || msg.record == true) {
				
                recording = context.get('recording') || false;
                if(recording == false) {
		
                    if (config.filename) {
                        filename = config.filename;
                    } 
                    if (msg.filename) {
                        filename = msg.filename
                    } 
                    if(filename = "undefined"){
                        filename = "/home/pi/audio/demo.wav";
                    }
                    node.log("filename set to: " + filename);
                    node.log("path set to: " + path);		

                    micInstance = mic({ 'rate': config.samplerate, 'channels': config.channels, 'debug': true, 'exitOnSilence': 6 });
                    micInputStream = micInstance.getAudioStream();

                    outputRawFileStream = fs.WriteStream(filename+".raw");
                    outputFileStream = new wav.FileWriter(filename, {  channels: config.channels,
                                                                            sampleRate: config.samplerate,
                                                                            bitdepth: config.bitdepth });

                    micInputStream.pipe(outputRawFileStream);
                    micInputStream.pipe(outputFileStream);
                    micInstance.start();
					node.send([null, {payload:"started"}]);
                }
								
			} else if (msg.payload == false || msg.record == false) {
		
				micInstance.stop();
			
				/*if (micInputStream.closeFileStream) {
					node.status({}); //remove status
					outputFileStream.end();
				}*/
				
				var outMsg = {payload: config.domain + "/getAudio"};
					//outMsg.file = outputFileStream;
					//outMsg.raw = outputRawFileStream;
					outMsg.filename = filename;
                    outMsg.channels = config.channels;
                    outMsg.samplerate = config.samplerate;
					outMsg.bits = config.bitdepth;
                    
					node.send([outMsg, {payload:"stopped"}]);
					
				node.status({}); //remove status
			}
			
		});
			
    }
    RED.nodes.registerType('microPi', micropiNode);
}