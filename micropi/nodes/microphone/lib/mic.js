var spawn = require('child_process').spawn;
var isMac = require('os').type() == 'Darwin' || require('os').type().indexOf('Windows') > -1;
var IsSilence = require('./silenceTransform.js');
var PassThrough = require('stream').PassThrough;

//IIFE
var Mic = (function () {
    //private variables
    var _endian;
    var _bitwidth;
    var _rate;
    var _channels;
    var _device;
    var _exitOnSilence;
    var _debug;
    var _format;
    var _audioProcessOptions;
    var _formatEndian;
    var _formatEncoding;
    var _audioProcess = null;
    var _audioStream;
    var _infoStream;

    var demiter = function (dmessage) {
        _audioStream.emit('debug', dmessage);
    }.bind(Mic);

    //closure gets exported
    function Mic(options) {
        options = options || {};

        _endian = options.endian || 'little';
        _bitwidth = options.bitwidth || '16';
        _encoding = options.encoding || 'signed-integer';
        _rate = options.rate || '16000';
        _channels = options.channels || '1';
        _device = options.device || 'plughw:1,0';
        _exitOnSilence = options.exitOnSilence || 50;
        _debug = options.debug || false;
        _format, _formatEndian, _formatEncoding;

        _audioProcessOptions = {
            stdio: ['ignore', 'pipe', 'pipe'] //only listen to stdout and stderr of child process
        };

        // Setup format variable for arecord call
        if(_endian === 'big') {
            _formatEndian = 'BE';
        } else {
            _formatEndian = 'LE';
        }
        if(_encoding === 'unsigned-integer') {
            _formatEncoding = 'U';
        } else {
            _formatEncoding = 'S';
        }
        _format = _formatEncoding + _bitwidth + '_' + _formatEndian;
    }

    Mic.prototype.start = function(node, timeout) {
        if(_audioProcess === null) {
            _infoStream = new PassThrough;
            _audioStream = new IsSilence(timeout);
            //informs node that the stream is available, this is necessary because node needs to listen for events before the whole start method has completed
            node.emit('streamAvailable', _audioStream);


            _audioProcess = isMac
            ? spawn('rec', ['-b', _bitwidth, '--endian', _endian, '-c', _channels, '-r', _rate, '-e', _encoding, '-t', 'raw', '-'], _audioProcessOptions)
            : spawn('arecord', ['-c', _channels, '-r', _rate, '-f', _format, '-D', _device], _audioProcessOptions);

            _audioProcess.on('exit', (code, sig) => {
                    _audioStream.emit('audioProcessExitComplete');
                    demiter(`Process exits due to signal code ${sig} with code ${code}`);
                });

            _audioProcess.stdout.pipe(_audioStream);
            _audioProcess.stderr.pipe(_infoStream);

            _infoStream.on('data', (data) => {
                        demiter('Received data from stderr: ' + data);
                    });
            _infoStream.on('error', (error) => {
                        demiter('Error in stderr: ' + data);
                    });

            _audioStream.emit('startComplete');
            demiter('Microphone started');

        } else {
            demiter('Microphone already started.');
        }
    };

    Mic.prototype.stop = function() {
        if(_audioProcess != null) {
            _audioStream.resetTimer();
            _audioProcess.kill('SIGKILL');
            _audioProcess = null;
            _audioStream.emit('stopComplete');
            demiter('Microphone stopped');
        } else {
            demiter('Microphone already stopped.');
        }
    };

    Mic.prototype.getAudioStream = function getAudioStream() {
        return _audioStream;
    };

    return Mic;
})();

module.exports = Mic;
