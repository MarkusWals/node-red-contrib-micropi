module.exports = function(RED) {
  function FileWriterNode(config) {

    RED.nodes.createNode(this, config);

    var name = config.name;
    var path = config.path;

    var options = config;
    delete config.name;
    delete config.path;

    const wav = require('wav');
    const node = this;
    let file;
    const msg = {file: path};

    //define default states
    const nodeStatusWriting = {fill: "green", shape: "dot", text: "writing"};
    const nodeStatusPaused = {fill: "green", shape: "ring", text: "paused writing"};

    //listens for incoming messages
    //if file is undefined create a new FileWriter (stream) from wav-module
    //if msgIn has a property "payload" then content of payload is written to file
    //if msgIn has property "closeFileStream" then node state is cleared and the stream is flushed
    //sets file to undefined, preparing it to get instantiated again for next recording cycle
    this.on('input', function(msgIn) {

      switch (msgIn.status) {
          case 'data':
            file.write(msgIn.payload);
            break;
          case 'startRecording':
            file = new wav.FileWriter(path,options);
            node.status(nodeStatusWriting);
            break;
          case 'silence':
            node.status()
            break;
          case 'resumeRecording':
            node.status(nodeStatusWriting);
            break;
          case 'stopRecording':
            if (file !== undefined) {
                file.end();
                file = undefined;
                node.status({});
                node.send(msg);
            }
            break;
          default:
            this.error('No compatible status found in msgIn.');
      }
    });

    this.on('error', function(err) {
      node.error(err);
    });

    //close the write-stream to free resources
    this.on('close', function(done) {
      if (file !== undefined) {
        file.end();
        file = undefined;
      }
      node.status({}); //clear status if any is set

      done();
    });

  }
  RED.nodes.registerType('wav-filewriter', FileWriterNode);
}
