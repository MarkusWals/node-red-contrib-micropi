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
		
		var micInstance;
		var micInputStream;
		var outputFileStream;
		
		micInputStream.on('data', function(data) {
			console.log("Recieved Input Stream: " + data.length);
		});

		micInputStream.on('error', function(err) {
			cosole.log("Error in Input Stream: " + err);
		});

		micInputStream.on('startComplete', function() {
				console.log("Got SIGNAL startComplete");
				setTimeout(function() {
						micInstance.pause();
					}, 50000);
			});

		micInputStream.on('stopComplete', function() {
				console.log("Got SIGNAL stopComplete");
			});

		micInputStream.on('pauseComplete', function() {
				console.log("Got SIGNAL pauseComplete");
				setTimeout(function() {
						micInstance.resume();
					}, 5000);
			});

		micInputStream.on('resumeComplete', function() {
				console.log("Got SIGNAL resumeComplete");
				setTimeout(function() {
						micInstance.stop();
					}, 5000);
			});

		micInputStream.on('silence', function() {
				console.log("Got SIGNAL silence");
			});

		micInputStream.on('processExitComplete', function() {
				console.log("Got SIGNAL processExitComplete");
			});
		
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

				micInstance = mic({ 'rate': '16000', 'channels': '1', 'debug': true, 'exitOnSilence': 6 });
				micInputStream = micInstance.getAudioStream();
				outputRawFileStream = fs.WriteStream(path+"test.raw");
				outputFileStream = new wav.FileWriter(path+filename, {
																		channels: 1,
																		sampleRate: 16000,
																		bitDepth: 16
																	  });

				micInputStream.pipe(outputRawFileStream);
				outputFileStream.write(micInputStream)
				micInstance.start();
				
				node.status({fill:"red",shape:"dot",text:"recording"});
				node.send({status:"recording"});
				
			} else if (msg.payload == false || msg.record == false) {
				node.status({fill:"red",shape:"dot",text:"stopped"});
				node.send({status:"stopped"});
				
				if (micInputStream.closeFileStream) {
					node.status({}); //remove status

					outputFileStream.end();

					node.send(msg);
				}
				micInstance.stop();
				node.status({}); //remove status
			}
			
		});
			
    }
    RED.nodes.registerType('microPi', micropiNode);
}

        /*
		config:		
		this.url = config.url;
        this.format = config.format;
        this.user = config.user;
        this.password = config.password;
        
        status:
        this.status({fill:"red",shape:"ring",text:"disconnected"});
        
        logging:
        
        this.log("Something");
        this.warn("Something happened you should know about");
        this.error("Oh no, something bad happened");
        */
		
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
                    
                    if (writer.closeFileStream || data.closeFileStream) {
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