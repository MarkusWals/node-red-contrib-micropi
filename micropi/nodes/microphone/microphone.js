module.exports = function(RED) {
  function MicroPhoneNode(config) {

    RED.nodes.createNode(this, config);

    var name = config.name;
    var options = config;
    delete options.name;
    this.active = config.active;
    var timeout = (options.silence * 1000) || 5000;

    //options.debug forwards a string instead of boolean, so we need to convert...
    if (options.debug === "true") {
        options.debug = true;
    } else {
        options.debug = false;
    }

    const node = this;
    const Mic = require('./lib/mic');
    const mic = new Mic(options);
    let audioStream = undefined;

    //define state recording and set it to node
    const nodeStatusRecording = {fill: "red", shape: "ring", text: "recording"};
    const nodeStatusPaused = {fill: "red", shape: "dot", text: "paused"};
    const nodeStatusSilence = {fill: "green", shape: "dot", text: "silence.."};

    this.on('input', (msgIn) => {
        //it's important to know that javascript will make a conversion to boolean for msg.payload
        //e.g. "true" becomes true, "false" becomes true and so on
        //this can lead to unexpected behaviour
        if (msgIn.payload) {
            timeout = msgIn.silence || timeout;
            this.startRecord(timeout);
        } else {
            this.stopRecord();
        }
    });

    this.startRecord = function(timeout) {
        mic.start(node, timeout);
    }

    //new stream was set up and is now available for binding events
    node.on('streamAvailable', (_audioStream) => {
        audioStream = _audioStream;

        audioStream.on('startComplete', () => {
            node.send({status: 'startRecording', payload: '', meta: options});
            node.status(nodeStatusRecording);
        });

        audioStream.on('stopComplete', () => {
            node.send({status: 'stopRecording', payload: ''});
            node.status({});

            //remove all listeners preventing a memory leaks
            audioStream.removeAllListeners();
        });

        audioStream.on('silence', () => {
            console.log('event silence in microphone');
            node.send({status: 'silence', payload: ''});
            node.status(nodeStatusSilence);
        });

        audioStream.on('resumed', () => {
            node.send({status: 'resumeRecording', payload: ''});
            node.status(nodeStatusRecording);
        });

        audioStream.on('debug', (message) => {
            if (options.debug) {
                node.warn(message);
            }
        });

        audioStream.on('data', (data) => {
            if(!audioStream.isSilenced()) {
                node.send({status: 'data', payload: data});
            }
        });

    });

    this.stopRecord = function (){
        mic.stop();
    }
  }
  RED.nodes.registerType('microphone', MicroPhoneNode);

  RED.httpAdmin.post("/microphone/:id/:state", RED.auth.needsPermission("debug.write"), function(req,res) {
        var node = RED.nodes.getNode(req.params.id);
        var state = req.params.state;
        console.log(req.params.state);
        if (node !== null && typeof node !== "undefined" ) {
            if (state === "enable") {
                this.active = true;
                node.startRecord();
                res.sendStatus(200);
            } else if (state === "disable") {
                node.stopRecord();
                this.active = false;
                res.sendStatus(201);
            } else {
                res.sendStatus(404);
            }
        } else {
            res.sendStatus(404);
        }
    });
}
