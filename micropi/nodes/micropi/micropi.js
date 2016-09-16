module.exports = function(RED) {
    function micropiNode(config) {

        RED.nodes.createNode(this, config);

        var name = config.name;
        var options = config;
        delete options.name;
        var timeout = (config.silence * 1000) || 5000;
        
		const Mic = require('./lib/mic');
        const mic = new Mic(options);
        
		var wav = require('wav');
        var node = this;
        
		var filename = options.filename;
    
		var audioStream = function(audioData) {
			msgOut.stream=audioData;
			this.send(msgOut);
		}.bind(this);

		var infoStream = function(infoData) {
			
		}.bind(this);

		var errorStream = function(audioData) {
			
		}.bind(this);
		
		function startRecord() {
			node.status({fill:"red",shape:"dot",text:"recording"});
			msgOut.status="recording";
			this.send(msgOut);
			mic.startRecording(errorStream, audioStream, infoStream);
		}

		function stopRecord(){
			node.status({fill:"red",shape:"dot",text:"stopped"});
			msgOut.status="stopped";
			this.send(msgOut);
			mic.stopRecording();
			node.status({}); //remove status
		}
		
		this.on('input', function(msg) {
			if(msg.payload == true  || msg.record == true) {
				if (msg.path) {
					path = msg.path;
				} else {
					path = "/home/pi/audio/";
				}
				if (msg.filename) {
					filename = msg.filename
				} else {
					filename = "test.wav";
				}
				node.log("filename set to: " + filename);
				node.log("path set to: " + path);
				startRecord();
			} else if (msg.payload == false || msg.record == false) {
				stopRecord();
			}
			
		});
			/*
            if(msg.payload == true) {
                node.log("msg received");
				if (msg.path) {
					path = msg.path;
				} else {
					path = "/home/pi/audio/";
				}
                node.log("path set to: " + path);
				if (msg.filename) {
					filename = msg.filename
				} else {
					filename = "test.wav";
				}
                node.log("filename set to: " + filename);
				
				http://stackoverflow.com/questions/34364583/how-to-use-the-write-function-for-wav-module-in-nodejs
				
				mic.startCapture();
				node.log("started recording");
                this.send([ {payload:"recording"} , {payload:"recording"} ]);
				node.status({fill:"red",shape:"dot",text:"recording"});
				
				mic.audioStream.on('data', function(data) {
					
                    node.log(data);
					var writer = new wav.FileWriter(path + filename, {
						channels: 2,
						sampleRate: 44100,
						bitDepth: 16
					});
                    
                    node.log("file metadata set to: 2Ch 16Bit 44.1kHz");
                    
					writer.write(String(data));
                    node.log("writing data");
                    
                    if (writer.closeFileStream || data.closeFileStream) {
                        node.status({}); //remove status
                        writer.end();
                        writer = null;
                        node.log("writer.end() called");
                        node.send(msg);
                        node.status({}); //remove status
                        var msg1 = {payload:writer};
                        var msg2 = {file:path + filename};
                        node.log("sending response message");
                        node.send([ msg1 , msg2 ]);
                    }
				});				
				
				this.on('error', function(err) {
					node.error('Error in microPi');
					writer.end
                    writer = null;
					node.status({}); //remove status
					msg1 = {payload:"error!"};
				});
				
            } else if (msg.payload == false) {
				mic.stopCapture();
                node.log("stopped recording");
                
                //writer.end
                //writer = undefined;
				node.status({}); //remove status
				//file.end();
				
				var msg1 = {payload:"stopped"};
				var msg2 = {file:path + filename};
				
				node.log("sending response message");
				this.send([ msg1 , msg2 ]);
			}
        });*/
    }
    RED.nodes.registerType('microPi', micropiNode);
}