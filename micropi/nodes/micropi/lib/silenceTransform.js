var Transform = require('stream').Transform;
var util = require("util");

var iife = ( function() {
    var _isSilenced;
    var _timeout;
    var _timer;
    function IsSilence(timeout) {
        _timeout = timeout || 5000;
        Transform.call(this);

        this.startTimer = function startTimer() {

            if (!_timer) {
                console.log('new timer');
                _timer = setTimeout( () => {
                    _isSilenced = true;
                    this.emit('silence')}, _timeout);
            }
        }.bind(this);

        this.resetTimer = function resetTimer() {
            if (_timer) {
                clearTimeout(_timer);
                _timer = undefined;
            }
        };

        _isSilenced = false;
    };

    util.inherits(IsSilence, Transform);

    IsSilence.prototype.isSilenced = function () {
            return _isSilenced;
    };

    IsSilence.prototype._transform = function(chunk, encoding, callback) {
        //enable silence detection only when stream is not paused
            var i;
            var speechSample;
            var silenceLength = 0;

                for(i=0; i<chunk.length; i=i+2) {
                    if(chunk[i+1] > 128) {
                        speechSample = (chunk[i+1] - 256) * 256;
                    } else {
                        speechSample = chunk[i+1] * 256;
                    }
                    speechSample += chunk[i];

                    if(Math.abs(speechSample) > 2000) {
                        this.emit('debug', 'Found speech block');
                        this.resetTimer();

                        if(_isSilenced) {
                            _isSilenced = false;
                            this.emit('resumed');
                        }
                        break;
                    } else {
                        silenceLength++;
                    }

                }
                if(silenceLength == chunk.length/2) {
                    this.emit('debug', `Found silence block`);
                    this.startTimer();
                }


        this.push(chunk);
        callback();
    };

    return IsSilence;
})();

module.exports = iife;
