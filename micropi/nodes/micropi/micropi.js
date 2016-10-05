module.exports = function(RED) {
  function MicroPi(config) {

    RED.nodes.createNode(this, config);

    var options = config;
    var name = options.name;
    delete options.name;
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
    const wav = require('wav');
    const fs = require('fs');
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

        //prepare speech to text with meta data
        node.send({status: 'startRecording', payload: '', meta: options});

        audioStream.on('startComplete', () => {
            node.status(nodeStatusRecording);
        });

        audioStream.on('stopComplete', () => {
            node.send({status: 'stopRecording', payload: ''});
            node.status({});
            var reader = new wav.Reader();
            var file = fs.createReadStream(options.filename);

            var bufferArray = new Array();
            var cbData = (data) => {
              bufferArray.push(data);
            };
            reader.on('data', cbData);

            reader.once('end', () => {
              const buffer = Buffer.concat(bufferArray);
              node.send([null, {payload:buffer}]);

              reader.removeListener('data', cbData) //remove listener to prevent memory leak
          });

          file.pipe(reader);

          //remove all listeners of audioStream to prevent memory leak
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

        //currently, debug/status messages are only sent when options.debug is true
        audioStream.on('debug', (message) => {
            if (options.debug) {
                node.send([null, null, {payload: message}]);
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
  RED.nodes.registerType('microPi', MicroPi);
 }
