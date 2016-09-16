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
        var timeout = (config.silence * 1000) || 5000;

        var msgOut;
        
        //define state recording and set it to node
        const nodeStatusRecording = {fill: "red", shape: "ring", text: "recording"};
        const nodeStatusPaused = {fill: "red", shape: "dot", text: "paused"};
        const nodeStatusSilence = {fill: "green", shape: "dot", text: "silence.."};
    
		var audioStream = function(audioData) {
			msgOut.stream=audioData;
			this.send(msgOut);
		}.bind(this);

		var infoStream = function(infoData) {
			
		}.bind(this);

		var errorStream = function(audioData) {
			
		}.bind(this);
		
		function startRecord() {
			msgOut.status="recording";
			this.send(msgOut);
            mic.start(node, timeout);
			//mic.startRecording(errorStream, audioStream, infoStream);
		}

		function stopRecord(){
			msgOut.status="stopped";
			this.send(msgOut);
            mic.stop();
			//mic.stopRecording();
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
    }
    RED.nodes.registerType('microPi', micropiNode);
}