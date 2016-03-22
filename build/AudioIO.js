(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreConfigEs6 = require('../core/config.es6');

var _coreConfigEs62 = _interopRequireDefault(_coreConfigEs6);

var _mixinsMathEs6 = require('../mixins/Math.es6');

var _mixinsMathEs62 = _interopRequireDefault(_mixinsMathEs6);

var BufferGenerators = {};

BufferGenerators.SineWave = function sineWaveIterator(i, length) {
    var x = Math.PI * (i / length) - Math.PI * 0.5;
    return Math.sin(x * 2);
};

BufferGenerators.SawWave = function sawWaveIterator(i, length) {
    return i / length * 2 - 1;
};

BufferGenerators.SquareWave = function squareWaveIterator(i, length) {
    var x = i / length * 2 - 1;
    return Math.sign(x + 0.001);
};

BufferGenerators.TriangleWave = function triangleWaveIterator(i, length) {
    var x = Math.abs(i % length * 2 - length) - length * 0.5;
    return Math.sin(x / (length * 0.5));
};

BufferGenerators.WhiteNoise = function whiteNoiseIterator() {
    return Math.random() * 2 - 1;
};

BufferGenerators.GaussianNoise = function gaussianNoiseIterator() {
    return _mixinsMathEs62['default'].nrand() * 2 - 1;
};

BufferGenerators.PinkNoise = (function () {
    var hasGeneratedPinkNumber = false;

    return function pinkNoiseIterator(i, length) {
        var number;

        if (hasGeneratedPinkNumber === false) {
            _mixinsMathEs62['default'].generatePinkNumber(128, 5);
            hasGeneratedPinkNumber = true;
        }

        number = _mixinsMathEs62['default'].getNextPinkNumber() * 2 - 1;

        if (i === length - 1) {
            hasGeneratedPinkNumber = false;
        }

        return number;
    };
})();

exports['default'] = BufferGenerators;
module.exports = exports['default'];

},{"../core/config.es6":7,"../mixins/Math.es6":82}],2:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilitiesUtilsEs6 = require('../utilities/Utils.es6');

var _utilitiesUtilsEs62 = _interopRequireDefault(_utilitiesUtilsEs6);

var BufferUtils = {};
var BUFFER_STORE = {};

function generateBufferStoreKey(length, numberOfChannels, sampleRate, iterator) {
	return length + '-' + numberOfChannels + '-' + sampleRate + '-' + iterator;
}

// TODO:
// 	- It might be possible to decode the arraybuffer
// 	  using a context different from the one the
// 	  buffer will be used in.
// 	  If so, remove the `io` argument, and create
// 	  a new AudioContext before the return of the Promise,
// 	  and use that.
BufferUtils.loadBuffer = function (io, uri) {
	return new Promise(function (resolve, reject) {
		var xhr = new XMLHttpRequest();

		xhr.open('GET', uri);
		xhr.responseType = 'arraybuffer';

		xhr.onload = function () {
			if (xhr.status === 200) {
				// Do the decode dance
				io.context.decodeAudioData(xhr.response, function (buffer) {
					resolve(buffer);
				}, function (e) {
					reject(e);
				});
			} else {
				reject(Error('Status !== 200'));
			}
		};

		xhr.onerror = function () {
			reject(Error('Network error'));
		};

		xhr.send();
	});
};

BufferUtils.generateBuffer = function (io, numberOfChannels, length, sampleRate, iterator) {
	var key = generateBufferStoreKey(length, numberOfChannels, sampleRate, iterator.toString()),
	    buffer,
	    channelData;

	if (BUFFER_STORE[key]) {
		return BUFFER_STORE[key];
	}

	buffer = io.context.createBuffer(numberOfChannels, length, sampleRate);

	for (var c = 0; c < numberOfChannels; ++c) {
		channelData = buffer.getChannelData(c);

		for (var i = 0; i < length; ++i) {
			channelData[i] = iterator(i, length, c, numberOfChannels);
		}
	}

	BUFFER_STORE[key] = buffer;

	return buffer;
};

BufferUtils.fillBuffer = function (buffer, value) {
	var numChannels = buffer.numberOfChannels,
	    length = buffer.length,
	    channelData;

	for (var c = 0; c < numChannels; ++c) {
		channelData = buffer.getChannelData(c);
		channelData.fill(value);
	}
};

BufferUtils.reverseBuffer = function (buffer) {
	if (buffer instanceof AudioBuffer === false) {
		console.error('`buffer` argument must be instance of AudioBuffer');
		return;
	}

	var numChannels = buffer.numberOfChannels,
	    length = buffer.length,
	    channelData;

	for (var c = 0; c < numChannels; ++c) {
		channelData = buffer.getChannelData(c);
		channelData.reverse();
	}
};

BufferUtils.cloneBuffer = function (buffer) {
	var newBuffer = this.io.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);

	for (var c = 0; c < buffer.numberOfChannels; ++c) {
		var channelData = newBuffer.getChannelData(c),
		    sourceData = buffer.getChannelData(c);

		for (var i = 0; i < buffer.length; ++i) {
			channelData[i] = sourceData[i];
		}
	}

	return newBuffer;
};

// TODO:
// 	- Support buffers with more than 2 channels.
BufferUtils.toStereo = function (buffer) {
	var stereoBuffer, length;

	if (buffer.numChannels >= 2) {
		console.warn('BufferUtils.toStereo currently only supports mono buffers for upmixing');
		return;
	}

	length = buffer.length;
	stereoBuffer = this.io.createBuffer(2, length, buffer.sampleRate);

	for (var c = 0; c < 2; ++c) {
		var channelData = stereoBuffer.getChannelData(c),
		    sourceData = buffer.getChannelData(0);

		for (var i = 0; i < length; ++i) {
			channelData[i] = sourceData[i];
		}
	}

	return stereoBuffer;
};

// TODO:
// 	- These basic math functions. Think of
// 	  them as a buffer-version of a vector lib.
BufferUtils.addBuffer = function (a, b) {};

// add
// multiply
// subtract
//

exports['default'] = BufferUtils;
module.exports = exports['default'];

},{"../utilities/Utils.es6":96}],3:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _configEs6 = require('./config.es6');

var _configEs62 = _interopRequireDefault(_configEs6);

require('./overrides.es6');

var _signalCurvesEs6 = require('./signalCurves.es6');

var _signalCurvesEs62 = _interopRequireDefault(_signalCurvesEs6);

var _mixinsConversionsEs6 = require('../mixins/conversions.es6');

var _mixinsConversionsEs62 = _interopRequireDefault(_mixinsConversionsEs6);

var _mixinsMathEs6 = require('../mixins/math.es6');

var _mixinsMathEs62 = _interopRequireDefault(_mixinsMathEs6);

var _buffersBufferGeneratorsEs6 = require('../buffers/BufferGenerators.es6');

var _buffersBufferGeneratorsEs62 = _interopRequireDefault(_buffersBufferGeneratorsEs6);

var _buffersBufferUtilsEs6 = require('../buffers/BufferUtils.es6');

var _buffersBufferUtilsEs62 = _interopRequireDefault(_buffersBufferUtilsEs6);

var _utilitiesUtilsEs6 = require('../utilities/Utils.es6');

var _utilitiesUtilsEs62 = _interopRequireDefault(_utilitiesUtilsEs6);

var AudioIO = (function () {
    AudioIO.mixin = function mixin(target, source) {
        for (var i in source) {
            if (source.hasOwnProperty(i)) {
                target[i] = source[i];
            }
        }
    };

    AudioIO.mixinSingle = function mixinSingle(target, source, name) {
        target[name] = source;
    };

    function AudioIO() {
        var context = arguments.length <= 0 || arguments[0] === undefined ? new AudioContext() : arguments[0];

        _classCallCheck(this, AudioIO);

        this._context = context;

        this.master = this._context.destination;

        // Create an always-on 'driver' node that constantly outputs a value
        // of 1.
        //
        // It's used by a fair few nodes, so makes sense to use the same
        // driver, rather than spamming a bunch of WaveShaperNodes all about
        // the place. It can't be deleted, so no worries about breaking
        // functionality of nodes that do use it should it attempt to be
        // overwritten.
        Object.defineProperty(this, 'constantDriver', {
            writeable: false,
            get: (function () {
                var constantDriver = undefined;

                return function () {
                    if (!constantDriver || constantDriver.context !== this.context) {
                        constantDriver = null;

                        var _context = this.context,
                            buffer = _context.createBuffer(1, 4096, _context.sampleRate),
                            bufferData = buffer.getChannelData(0),
                            bufferSource = _context.createBufferSource();

                        for (var i = 0; i < bufferData.length; ++i) {
                            bufferData[i] = 1.0;
                        }

                        // for( let bufferValue of bufferData ) {
                        //     bufferValue = 1.0;
                        // }

                        bufferSource.buffer = buffer;
                        bufferSource.loop = true;
                        bufferSource.start(0);

                        constantDriver = bufferSource;
                    }

                    return constantDriver;
                };
            })()
        });
    }

    _createClass(AudioIO, [{
        key: 'context',
        get: function get() {
            return this._context;
        },
        set: function set(context) {
            if (!(context instanceof AudioContext)) {
                throw new Error("Invalid audio context given:" + context);
            }

            this._context = context;
            this.master = context.destination;
        }
    }]);

    return AudioIO;
})();

AudioIO.mixinSingle(AudioIO.prototype, _signalCurvesEs62['default'], 'curves');
AudioIO.mixinSingle(AudioIO.prototype, _mixinsConversionsEs62['default'], 'convert');
AudioIO.mixinSingle(AudioIO.prototype, _mixinsMathEs62['default'], 'math');

AudioIO.BufferUtils = _buffersBufferUtilsEs62['default'];
AudioIO.BufferGenerators = _buffersBufferGeneratorsEs62['default'];
AudioIO.Utils = _utilitiesUtilsEs62['default'];

window.AudioIO = AudioIO;
exports['default'] = AudioIO;
module.exports = exports['default'];

},{"../buffers/BufferGenerators.es6":1,"../buffers/BufferUtils.es6":2,"../mixins/conversions.es6":85,"../mixins/math.es6":86,"../utilities/Utils.es6":96,"./config.es6":7,"./overrides.es6":8,"./signalCurves.es6":9}],4:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _AudioIOEs6 = require("./AudioIO.es6");

var _AudioIOEs62 = _interopRequireDefault(_AudioIOEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var _mixinsConnectionsEs6 = require("../mixins/connections.es6");

var _mixinsConnectionsEs62 = _interopRequireDefault(_mixinsConnectionsEs6);

var _mixinsCleanersEs6 = require("../mixins/cleaners.es6");

var _mixinsCleanersEs62 = _interopRequireDefault(_mixinsCleanersEs6);

var graphs = new WeakMap();

// TODO:
//  - Possibly remove the need for only GainNodes
//    as inputs/outputs? It'll allow for subclasses
//    of Node to be more efficient...

var Node = (function () {
    function Node(io) {
        var numInputs = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
        var numOutputs = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

        _classCallCheck(this, Node);

        this._setIO(io);

        this.inputs = [];
        this.outputs = [];

        // This object will hold any values that can be
        // controlled with audio signals.
        this.controls = {};

        // Both these objects will just hold references
        // to either input or output nodes. Handy when
        // wanting to connect specific ins/outs without
        // having to use the `.connect( ..., 0, 1 )` syntax.
        this.namedInputs = {};
        this.namedOutputs = {};

        for (var i = 0; i < numInputs; ++i) {
            this.addInputChannel();
        }

        for (i = 0; i < numOutputs; ++i) {
            this.addOutputChannel();
        }
    }

    Node.prototype.setGraph = function setGraph(graph) {
        graphs.set(this, graph);
    };

    Node.prototype.getGraph = function getGraph() {
        return graphs.get(this) || {};
    };

    Node.prototype.addInputChannel = function addInputChannel() {
        this.inputs.push(this.context.createGain());
    };

    Node.prototype.addOutputChannel = function addOutputChannel() {
        this.outputs.push(this.context.createGain());
    };

    Node.prototype._cleanUpSingle = function _cleanUpSingle(item, parent, key) {
        var self = this;

        // Handle arrays by looping over them
        // and recursively calling this function with each
        // array member.
        if (Array.isArray(item)) {
            item.forEach(function (node, index) {
                self._cleanUpSingle(node, item, index);
            });

            parent[key] = null;
        }

        // AudioIO nodes...
        else if (item && typeof item.cleanUp === 'function') {
                if (typeof item.disconnect === 'function') {
                    item.disconnect();
                }

                item.cleanUp();

                if (parent) {
                    parent[key] = null;
                }
            }

            // "Native" nodes.
            else if (item && typeof item.disconnect === 'function') {
                    item.disconnect();

                    if (parent) {
                        parent[key] = null;
                    }
                }
    };

    Node.prototype.cleanUp = function cleanUp() {
        var graph = this.getGraph();
        this._cleanUpInOuts();
        this._cleanIO();

        // Find any nodes at the top level,
        // disconnect and nullify them.
        for (var i in this) {
            this._cleanUpSingle(this[i], this, i);
        }

        // Do the same for any nodes in the graph.
        for (var i in graph) {
            this._cleanUpSingle(graph[i], graph, i);
        }

        // ...and the same for any control nodes.
        for (var i in this.controls) {
            this._cleanUpSingle(this.controls[i], this.controls, i);
        }

        // Finally, attempt to disconnect this Node.
        if (typeof this.disconnect === 'function') {
            this.disconnect();
        }
    };

    _createClass(Node, [{
        key: "numberOfInputs",
        get: function get() {
            return this.inputs.length;
        }
    }, {
        key: "numberOfOutputs",
        get: function get() {
            return this.outputs.length;
        }
    }, {
        key: "inputValue",
        get: function get() {
            return this.inputs.length ? this.inputs[0].gain.value : null;
        },
        set: function set(value) {
            for (var i = 0; i < this.inputs.length; ++i) {
                this.inputs[i].gain.value = this.invertInputPhase ? -value : value;
            }
        }
    }, {
        key: "outputValue",
        get: function get() {
            return this.outputs.length ? this.outputs[0].gain.value : null;
        },
        set: function set(value) {
            for (var i = 0; i < this.outputs.length; ++i) {
                this.outputs[i].gain.value = this.invertOutputPhase ? -value : value;
            }
        }
    }, {
        key: "invertInputPhase",
        get: function get() {
            return this.inputs.length ? this.inputs[0].gain.value < 0 : null;
        },
        set: function set(inverted) {
            for (var i = 0, input, v; i < this.inputs.length; ++i) {
                input = this.inputs[i].gain;
                v = input.value;
                input.value = v < 0 ? inverted ? v : -v : inverted ? -v : v;
            }
        }
    }, {
        key: "invertOutputPhase",
        get: function get() {
            return this.outputs.length ? this.outputs[0].gain.value < 0 : null;
        },

        // TODO:
        //  - setValueAtTime?
        set: function set(inverted) {
            for (var i = 0, v; i < this.outputs.length; ++i) {
                v = this.outputs[i].gain.value;
                this.outputs[i].gain.value = v < 0 ? inverted ? v : -v : inverted ? -v : v;
            }
        }
    }]);

    return Node;
})();

_AudioIOEs62["default"].mixinSingle(Node.prototype, _mixinsSetIOEs62["default"], '_setIO');
_AudioIOEs62["default"].mixinSingle(Node.prototype, _mixinsCleanersEs62["default"].cleanUpInOuts, '_cleanUpInOuts');
_AudioIOEs62["default"].mixinSingle(Node.prototype, _mixinsCleanersEs62["default"].cleanIO, '_cleanIO');
_AudioIOEs62["default"].mixin(Node.prototype, _mixinsConnectionsEs62["default"]);

_AudioIOEs62["default"].prototype.createNode = function (numInputs, numOutputs) {
    return new Node(this, numInputs, numOutputs);
};

exports["default"] = Node;
module.exports = exports["default"];

},{"../mixins/cleaners.es6":83,"../mixins/connections.es6":84,"../mixins/setIO.es6":90,"./AudioIO.es6":3}],5:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _AudioIOEs6 = require("./AudioIO.es6");

var _AudioIOEs62 = _interopRequireDefault(_AudioIOEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var _mixinsConnectionsEs6 = require("../mixins/connections.es6");

var _mixinsConnectionsEs62 = _interopRequireDefault(_mixinsConnectionsEs6);

var _mixinsCleanersEs6 = require("../mixins/cleaners.es6");

var _mixinsCleanersEs62 = _interopRequireDefault(_mixinsCleanersEs6);

var Param = (function () {
    function Param(io, value, defaultValue) {
        _classCallCheck(this, Param);

        this._setIO(io);

        this.inputs = this.outputs = [this.context.createGain()];
        this._control = this.inputs[0];

        // Hmm... Had to put this here so Note will be able
        // to read the value...
        // TODO:
        //  - Should I create a `._value` property that will
        //    store the values that the Param should be reflecting
        //    (forgetting, of course, that all the *ValueAtTime [etc.]
        //    functions are functions of time; `._value` prop would be
        //    set immediately, whilst the real value would be ramping)
        //
        //  - Or, should I create a `._value` property that will
        //    truely reflect the internal value of the GainNode? Will
        //    require MAFFS...
        this._value = typeof value === 'number' ? value : 1.0;
        this._control.gain.value = this._value;

        this.setValueAtTime(this._value, this.context.currentTime);
        this.defaultValue = typeof defaultValue === 'number' ? defaultValue : this._control.gain.defaultValue;

        // TODO:
        //  - Should the driver always be connected?
        //  - Not sure whether Param should output 0 if value !== Number.
        if (typeof value === 'number') {
            this.io.constantDriver.connect(this._control);
        }
    }

    Param.prototype.reset = function reset() {
        this.value = this.defaultValue;
        return this;
    };

    Param.prototype.cleanUp = function cleanUp() {
        this._cleanUpInOuts();
        this._cleanIO();
        this._value = null;
        this._control = null;
        this.defaultValue = null;

        this.disconnect();
    };

    Param.prototype.setValueAtTime = function setValueAtTime(value, startTime) {
        this._value = value;
        this._control.gain.setValueAtTime(value, startTime);
        return this;
    };

    Param.prototype.linearRampToValueAtTime = function linearRampToValueAtTime(value, endTime) {
        this._value = value;
        this._control.gain.linearRampToValueAtTime(value, endTime);
        return this;
    };

    Param.prototype.exponentialRampToValueAtTime = function exponentialRampToValueAtTime(value, endTime) {
        this._value = value;
        this._control.gain.exponentialRampToValueAtTime(value, endTime);
        return this;
    };

    Param.prototype.setTargetAtTime = function setTargetAtTime(value, startTime, timeConstant) {
        this._value = value;
        this._control.gain.setTargetAtTime(value, startTime, timeConstant);
        return this;
    };

    Param.prototype.setValueCurveAtTime = function setValueCurveAtTime(values, startTime, duration) {
        this._value = value;
        this._control.gain.setValueCurveAtTime(values, startTime, duration);
        return this;
    };

    Param.prototype.cancelScheduledValues = function cancelScheduledValues(startTime) {
        this._control.gain.cancelScheduledValues(startTime);
        return this;
    };

    _createClass(Param, [{
        key: "value",
        get: function get() {
            // return this._control.gain.value;
            return this._value;
        },
        set: function set(value) {
            this._value = value;
            this.setValueAtTime(value, this.context.currentTime);
        }
    }, {
        key: "control",
        get: function get() {
            return this._control.gain;
        }
    }]);

    return Param;
})();

_AudioIOEs62["default"].mixinSingle(Param.prototype, _mixinsSetIOEs62["default"], '_setIO');
_AudioIOEs62["default"].mixinSingle(Param.prototype, _mixinsCleanersEs62["default"].cleanUpInOuts, '_cleanUpInOuts');
_AudioIOEs62["default"].mixinSingle(Param.prototype, _mixinsCleanersEs62["default"].cleanIO, '_cleanIO');
_AudioIOEs62["default"].mixin(Param.prototype, _mixinsConnectionsEs62["default"]);

_AudioIOEs62["default"].prototype.createParam = function (value, defaultValue) {
    return new Param(this, value, defaultValue);
};

exports["default"] = Param;
module.exports = exports["default"];

},{"../mixins/cleaners.es6":83,"../mixins/connections.es6":84,"../mixins/setIO.es6":90,"./AudioIO.es6":3}],6:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _AudioIOEs6 = require("./AudioIO.es6");

var _AudioIOEs62 = _interopRequireDefault(_AudioIOEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var _mixinsConnectionsEs6 = require("../mixins/connections.es6");

var _mixinsConnectionsEs62 = _interopRequireDefault(_mixinsConnectionsEs6);

var _mixinsCleanersEs6 = require("../mixins/cleaners.es6");

var _mixinsCleanersEs62 = _interopRequireDefault(_mixinsCleanersEs6);

var WaveShaper = (function () {
    function WaveShaper(io, curveOrIterator, size) {
        _classCallCheck(this, WaveShaper);

        this._setIO(io);

        this.shaper = this.context.createWaveShaper();

        // If a Float32Array is provided, use it
        // as the curve value.
        if (curveOrIterator instanceof Float32Array) {
            this.shaper.curve = curveOrIterator;
        }

        // If a function is provided, create a curve
        // using the function as an iterator.
        else if (typeof curveOrIterator === 'function') {
                size = typeof size === 'number' && size >= 2 ? size : CONFIG.curveResolution;

                var array = new Float32Array(size),
                    i = 0,
                    x = 0;

                for (i; i < size; ++i) {
                    x = i / size * 2 - 1;
                    array[i] = curveOrIterator(x, i, size);
                }

                this.shaper.curve = array;
            }

            // Otherwise, default to a Linear curve.
            else {
                    this.shaper.curve = this.io.curves.Linear;
                }

        this.inputs = this.outputs = [this.shaper];
    }

    WaveShaper.prototype.cleanUp = function cleanUp() {
        this._cleanUpInOuts();
        this._cleanIO();
        this.disconnect();
        this.shaper = null;
    };

    _createClass(WaveShaper, [{
        key: "curve",
        get: function get() {
            return this.shaper.curve;
        },
        set: function set(curve) {
            if (curve instanceof Float32Array) {
                this.shaper.curve = curve;
            }
        }
    }]);

    return WaveShaper;
})();

_AudioIOEs62["default"].mixinSingle(WaveShaper.prototype, _mixinsSetIOEs62["default"], '_setIO');
_AudioIOEs62["default"].mixinSingle(WaveShaper.prototype, _mixinsCleanersEs62["default"].cleanUpInOuts, '_cleanUpInOuts');
_AudioIOEs62["default"].mixinSingle(WaveShaper.prototype, _mixinsCleanersEs62["default"].cleanIO, '_cleanIO');
_AudioIOEs62["default"].mixin(WaveShaper.prototype, _mixinsConnectionsEs62["default"]);

_AudioIOEs62["default"].prototype.createWaveShaper = function (curve, size) {
    return new WaveShaper(this, curve, size);
};

},{"../mixins/cleaners.es6":83,"../mixins/connections.es6":84,"../mixins/setIO.es6":90,"./AudioIO.es6":3}],7:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = {
    curveResolution: 4096, // Must be an even number.
    defaultBufferSize: 8,

    // Used when converting note strings (eg. 'A#4') to MIDI values.
    // It's the octave number of the lowest C note (MIDI note 0).
    // Change this if you're used to a DAW that doesn't use -2 as the
    // lowest octave.
    lowestOctave: -2,

    // Lowest allowed number. Used by some Math
    // functions, especially when converting between
    // number formats (ie. hz -> MIDI, note -> MIDI, etc. )
    //
    // Also used in calls to AudioParam.exponentialRampToValueAtTime
    // so there's no ramping to 0 (which throws an error).
    epsilon: 0.001,

    midiNotePoolSize: 500
};
module.exports = exports["default"];

},{}],8:[function(require,module,exports){
// Need to override existing .connect and .disconnect
// functions for "native" AudioParams and AudioNodes...
// I don't like doing this, but s'gotta be done :(
"use strict";

(function () {
    var originalAudioNodeConnect = AudioNode.prototype.connect,
        originalAudioNodeDisconnect = AudioNode.prototype.disconnect,
        slice = Array.prototype.slice;

    AudioNode.prototype.connect = function (node) {
        var outputChannel = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
        var inputChannel = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

        if (node.inputs) {
            if (Array.isArray(node.inputs)) {
                this.connect(node.inputs[inputChannel]);
            } else {
                this.connect(node.inputs[0], outputChannel, inputChannel);
            }
        } else if (node instanceof AudioNode) {
            originalAudioNodeConnect.apply(this, arguments);
        } else if (node instanceof AudioParam) {
            originalAudioNodeConnect.call(this, node, outputChannel);
        }
    };

    AudioNode.prototype.disconnect = function (node) {
        var outputChannel = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
        var inputChannel = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

        if (node && node.inputs) {
            if (Array.isArray(node.inputs)) {
                this.disconnect(node.inputs[inputChannel]);
            } else {
                this.disconnect(node.inputs[0], outputChannel, inputChannel);
            }
        } else if (node instanceof AudioNode) {
            originalAudioNodeDisconnect.apply(this, arguments);
        } else if (node instanceof AudioParam) {
            originalAudioNodeDisconnect.call(this, node, outputChannel);
        } else if (node === undefined) {
            originalAudioNodeDisconnect.apply(this, arguments);
        }
    };

    AudioNode.prototype.chain = function () {
        var nodes = slice.call(arguments),
            node = this;

        for (var i = 0; i < nodes.length; ++i) {
            node.connect.call(node, nodes[i]);
            node = nodes[i];
        }
    };

    AudioNode.prototype.fan = function () {
        var nodes = slice.call(arguments),
            node = this;

        for (var i = 0; i < nodes.length; ++i) {
            node.connect.call(node, nodes[i]);
        }
    };
})();

},{}],9:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _configEs6 = require('./config.es6');

var _configEs62 = _interopRequireDefault(_configEs6);

var _mixinsMathEs6 = require('../mixins/Math.es6');

var _mixinsMathEs62 = _interopRequireDefault(_mixinsMathEs6);

var signalCurves = {};

Object.defineProperty(signalCurves, 'Constant', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution,
            curve = new Float32Array(resolution);

        for (var i = 0; i < resolution; ++i) {
            curve[i] = 1.0;
        }

        return curve;
    })()
});

Object.defineProperty(signalCurves, 'Linear', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution,
            curve = new Float32Array(resolution);

        for (var i = 0, x = undefined; i < resolution; ++i) {
            x = i / resolution * 2 - 1;
            curve[i] = x;
        }

        return curve;
    })()
});

Object.defineProperty(signalCurves, 'EqualPower', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution,
            curve = new Float32Array(resolution),
            sin = Math.sin,
            PI = Math.PI;

        for (var i = 0, x = undefined; i < resolution; ++i) {
            x = i / resolution * 2 - 1;
            curve[i] = sin(x * 0.5 * PI);
        }

        return curve;
    })()
});

Object.defineProperty(signalCurves, 'Cubed', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution,
            curve = new Float32Array(resolution),
            sin = Math.sin,
            PI = Math.PI,
            pow = Math.pow;

        for (var i = 0, x = undefined; i < resolution; ++i) {
            x = i / resolution * 2 - 1;
            x = pow(x, 3);
            curve[i] = sin(x * 0.5 * PI);
        }

        return curve;
    })()
});

Object.defineProperty(signalCurves, 'Rectify', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution,
            halfResolution = resolution * 0.5,
            curve = new Float32Array(resolution);

        for (var i = -halfResolution, x = 0; i < halfResolution; ++i) {
            x = (i > 0 ? i : -i) / halfResolution;
            curve[i + halfResolution] = x;
        }

        return curve;
    })()
});

// Math curves
Object.defineProperty(signalCurves, 'GreaterThanZero', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution,
            curve = new Float32Array(resolution);

        for (var i = 0, x = undefined; i < resolution; ++i) {
            x = i / resolution * 2 - 1;
            curve[i] = x <= 0 ? 0.0 : 1.0;
        }

        return curve;
    })()
});

Object.defineProperty(signalCurves, 'LessThanZero', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution,
            curve = new Float32Array(resolution);

        for (var i = 0, x = undefined; i < resolution; ++i) {
            x = i / resolution * 2 - 1;
            curve[i] = x >= 0 ? 0 : 1;
        }

        return curve;
    })()
});

Object.defineProperty(signalCurves, 'EqualToZero', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution,
            curve = new Float32Array(resolution);

        for (var i = 0, x = undefined; i < resolution; ++i) {
            x = i / resolution * 2 - 1;
            curve[i] = x === 0 ? 1 : 0;
        }

        return curve;
    })()
});

Object.defineProperty(signalCurves, 'Reciprocal', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = 4096 * 600,
            // Higher resolution needed here.
        curve = new Float32Array(resolution);

        for (var i = 0, x = undefined; i < resolution; ++i) {
            x = i / resolution * 2 - 1;
            // curve[ i ] = x === 0 ? 1 : 0;

            if (x !== 0) {
                x = Math.pow(x, -1);
            }

            curve[i] = x;
        }

        return curve;
    })()
});

Object.defineProperty(signalCurves, 'Sine', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution,
            curve = new Float32Array(resolution),
            sin = Math.sin;

        for (var i = 0, x = undefined; i < resolution; ++i) {
            x = i / resolution * (Math.PI * 2) - Math.PI;
            curve[i] = sin(x);
        }

        return curve;
    })()
});

Object.defineProperty(signalCurves, 'Round', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution * 50,
            curve = new Float32Array(resolution);

        for (var i = 0, x = undefined; i < resolution; ++i) {
            x = i / resolution * 2 - 1;

            if (x > 0 && x <= 0.50001 || x < 0 && x >= -0.50001) {
                x = 0;
            } else if (x > 0) {
                x = 1;
            } else {
                x = -1;
            }

            curve[i] = x;
        }

        return curve;
    })()
});

Object.defineProperty(signalCurves, 'Sign', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution * 2,
            curve = new Float32Array(resolution);

        for (var i = 0, x = undefined; i < resolution; ++i) {
            x = i / resolution * 2 - 1;
            curve[i] = Math.sign(x);
        }

        return curve;
    })()
});

Object.defineProperty(signalCurves, 'Floor', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution * 50,
            curve = new Float32Array(resolution);

        for (var i = 0, x = undefined; i < resolution; ++i) {
            x = i / resolution * 2 - 1;

            if (x >= 0.9999) {
                x = 1;
            } else if (x >= 0) {
                x = 0;
            } else if (x < 0) {
                x = -1;
            }

            curve[i] = x;
        }

        return curve;
    })()
});

Object.defineProperty(signalCurves, 'GaussianWhiteNoise', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution * 2,
            curve = new Float32Array(resolution);

        for (var i = 0, x = undefined; i < resolution; ++i) {
            curve[i] = _mixinsMathEs62['default'].nrand();
        }

        return curve;
    })()
});

Object.defineProperty(signalCurves, 'WhiteNoise', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution * 2,
            curve = new Float32Array(resolution);

        for (var i = 0, x = undefined; i < resolution; ++i) {
            curve[i] = Math.random();
        }

        return curve;
    })()
});

Object.defineProperty(signalCurves, 'PinkNoise', {
    writable: false,
    enumerable: true,
    value: (function () {
        var resolution = _configEs62['default'].curveResolution * 2,
            curve = new Float32Array(resolution);

        _mixinsMathEs62['default'].generatePinkNumber();

        for (var i = 0, x = undefined; i < resolution; ++i) {
            curve[i] = _mixinsMathEs62['default'].getNextPinkNumber() * 2 - 1;
        }

        return curve;
    })()
});

module.exports = signalCurves;

},{"../mixins/Math.es6":82,"./config.es6":7}],10:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _CustomEnvelopeEs6 = require("./CustomEnvelope.es6");

var _CustomEnvelopeEs62 = _interopRequireDefault(_CustomEnvelopeEs6);

var ADBDSREnvelope = (function (_CustomEnvelope) {
    _inherits(ADBDSREnvelope, _CustomEnvelope);

    function ADBDSREnvelope(io) {
        _classCallCheck(this, ADBDSREnvelope);

        _CustomEnvelope.call(this, io);

        this.times = {
            attack: 0.01,
            decay1: 0.5,
            decay2: 0.5,
            release: 0.5
        };

        this.levels = {
            initial: 0,
            peak: 1,
            "break": 0.5,
            sustain: 1,
            release: 0
        };

        this.addStartStep('initial', 0, this.levels.initial);
        this.addStartStep('attack', this.times.attack, this.levels.peak);
        this.addStartStep('decay1', this.times.decay1, this.levels["break"]);
        this.addStartStep('decay2', this.times.decay2, this.levels.sustain);
        this.addEndStep('release', this.times.release, this.levels.release, true);
    }

    _createClass(ADBDSREnvelope, [{
        key: "attackTime",
        get: function get() {
            return this.times.attack;
        },
        set: function set(time) {
            if (typeof time === 'number') {
                this.times.attack = time;
                this.setStepTime('attack', time);
            }
        }
    }, {
        key: "decay1Time",
        get: function get() {
            return this.times.decay1;
        },
        set: function set(time) {
            if (typeof time === 'number') {
                this.times.decay1 = time;
                this.setStepTime('decay1', time);
            }
        }
    }, {
        key: "decay2Time",
        get: function get() {
            return this.times.decay2;
        },
        set: function set(time) {
            if (typeof time === 'number') {
                this.times.decay2 = time;
                this.setStepTime('decay2', time);
            }
        }
    }, {
        key: "releaseTime",
        get: function get() {
            return this.times.release;
        },
        set: function set(time) {
            if (typeof time === 'number') {
                this.times.release = time;
                this.setStepTime('release', time);
            }
        }
    }, {
        key: "initialLevel",
        get: function get() {
            return this.levels.initial;
        },
        set: function set(level) {
            if (typeof level === 'number') {
                this.levels.initial = level;
                this.setStepLevel('initial', level);
            }
        }
    }, {
        key: "peakLevel",
        get: function get() {
            return this.levels.peak;
        },
        set: function set(level) {
            if (typeof level === 'number') {
                this.levels.peak = level;
                this.setStepLevel('attack', level);
            }
        }
    }, {
        key: "breakLevel",
        get: function get() {
            return this.levels["break"];
        },
        set: function set(level) {
            if (typeof level === 'number') {
                this.levels["break"] = level;
                this.setStepLevel('decay1', level);
            }
        }
    }, {
        key: "sustainLevel",
        get: function get() {
            return this.levels.sustain;
        },
        set: function set(level) {
            if (typeof level === 'number') {
                this.levels.sustain = level;
                this.setStepLevel('decay2', level);
            }
        }
    }, {
        key: "releaseLevel",
        get: function get() {
            return this.levels.release;
        },
        set: function set(level) {
            if (typeof level === 'number') {
                this.levels.release = level;
                this.setStepLevel('release', level);
            }
        }
    }]);

    return ADBDSREnvelope;
})(_CustomEnvelopeEs62["default"]);

AudioIO.prototype.createADBDSREnvelope = function () {
    return new ADBDSREnvelope(this);
};

exports["default"] = ADBDSREnvelope;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"./CustomEnvelope.es6":13}],11:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _CustomEnvelopeEs6 = require("./CustomEnvelope.es6");

var _CustomEnvelopeEs62 = _interopRequireDefault(_CustomEnvelopeEs6);

var ADEnvelope = (function (_CustomEnvelope) {
    _inherits(ADEnvelope, _CustomEnvelope);

    function ADEnvelope(io) {
        _classCallCheck(this, ADEnvelope);

        _CustomEnvelope.call(this, io);

        this.times = {
            attack: 0.01,
            decay: 0.5
        };

        this.levels = {
            initial: 0,
            peak: 1
        };

        this.addStartStep('initial', 0, this.levels.initial);
        this.addStartStep('attack', this.times.attack, this.levels.peak);
        this.addEndStep('decay', this.times.decay, this.levels.sustain, true);
    }

    _createClass(ADEnvelope, [{
        key: "attackTime",
        get: function get() {
            return this.times.attack;
        },
        set: function set(time) {
            if (typeof time === 'number') {
                this.times.attack = time;
                this.setStepTime('attack', time);
            }
        }
    }, {
        key: "decayTime",
        get: function get() {
            return this.times.decay;
        },
        set: function set(time) {
            if (typeof time === 'number') {
                this.times.decay = time;
                this.setStepTime('decay', time);
            }
        }
    }, {
        key: "initialLevel",
        get: function get() {
            return this.levels.initial;
        },
        set: function set(level) {
            if (typeof level === 'number') {
                this.levels.initial = level;
                this.setStepLevel('initial', level);
            }
        }
    }, {
        key: "peakLevel",
        get: function get() {
            return this.levels.peak;
        },
        set: function set(level) {
            if (typeof level === 'number') {
                this.levels.peak = level;
                this.setStepLevel('attack', level);
            }
        }
    }]);

    return ADEnvelope;
})(_CustomEnvelopeEs62["default"]);

AudioIO.prototype.createADEnvelope = function () {
    return new ADEnvelope(this);
};

exports["default"] = ADEnvelope;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"./CustomEnvelope.es6":13}],12:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _CustomEnvelopeEs6 = require("./CustomEnvelope.es6");

var _CustomEnvelopeEs62 = _interopRequireDefault(_CustomEnvelopeEs6);

var ADSREnvelope = (function (_CustomEnvelope) {
    _inherits(ADSREnvelope, _CustomEnvelope);

    function ADSREnvelope(io) {
        _classCallCheck(this, ADSREnvelope);

        _CustomEnvelope.call(this, io);

        this.times = {
            attack: 0.01,
            decay: 0.5,
            release: 0.5
        };

        this.levels = {
            initial: 0,
            peak: 1,
            sustain: 1,
            release: 0
        };

        this.addStartStep('initial', 0, this.levels.initial);
        this.addStartStep('attack', this.times.attack, this.levels.peak);
        this.addStartStep('decay', this.times.decay, this.levels.sustain);
        this.addEndStep('release', this.times.release, this.levels.release, true);
    }

    _createClass(ADSREnvelope, [{
        key: "attackTime",
        get: function get() {
            return this.times.attack;
        },
        set: function set(time) {
            if (typeof time === 'number') {
                this.times.attack = time;
                this.setStepTime('attack', time);
            }
        }
    }, {
        key: "decayTime",
        get: function get() {
            return this.times.decay;
        },
        set: function set(time) {
            if (typeof time === 'number') {
                this.times.decay = time;
                this.setStepTime('decay', time);
            }
        }
    }, {
        key: "releaseTime",
        get: function get() {
            return this.times.release;
        },
        set: function set(time) {
            if (typeof time === 'number') {
                this.times.release = time;
                this.setStepTime('release', time);
            }
        }
    }, {
        key: "initialLevel",
        get: function get() {
            return this.levels.initial;
        },
        set: function set(level) {
            if (typeof level === 'number') {
                this.levels.initial = level;
                this.setStepLevel('initial', level);
            }
        }
    }, {
        key: "peakLevel",
        get: function get() {
            return this.levels.peak;
        },
        set: function set(level) {
            if (typeof level === 'number') {
                this.levels.peak = level;
                this.setStepLevel('attack', level);
            }
        }
    }, {
        key: "sustainLevel",
        get: function get() {
            return this.levels.sustain;
        },
        set: function set(level) {
            if (typeof level === 'number') {
                this.levels.sustain = level;
                this.setStepLevel('decay', level);
            }
        }
    }, {
        key: "releaseLevel",
        get: function get() {
            return this.levels.release;
        },
        set: function set(level) {
            if (typeof level === 'number') {
                this.levels.release = level;
                this.setStepLevel('release', level);
            }
        }
    }]);

    return ADSREnvelope;
})(_CustomEnvelopeEs62["default"]);

AudioIO.prototype.createADSREnvelope = function () {
    return new ADSREnvelope(this);
};

exports["default"] = ADSREnvelope;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"./CustomEnvelope.es6":13}],13:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreConfigEs6 = require("../core/config.es6");

var _coreConfigEs62 = _interopRequireDefault(_coreConfigEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var CustomEnvelope = (function () {
    function CustomEnvelope(io) {
        _classCallCheck(this, CustomEnvelope);

        this._setIO(io);

        this.orders = {
            start: [],
            stop: []
        };

        this.steps = {
            start: {},
            stop: {}
        };
    }

    CustomEnvelope.prototype._addStep = function _addStep(section, name, time, level) {
        var isExponential = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];

        var stops = this.steps[section];

        if (stops[name]) {
            throw new Error('Stop with name "' + name + '" already exists.');
        }

        this.orders[section].push(name);

        this.steps[section][name] = {
            time: time,
            level: level,
            isExponential: isExponential
        };
    };

    CustomEnvelope.prototype.addStartStep = function addStartStep(name, time, level) {
        var isExponential = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

        this._addStep('start', name, time, level, isExponential);
        return this;
    };

    CustomEnvelope.prototype.addEndStep = function addEndStep(name, time, level) {
        var isExponential = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

        this._addStep('stop', name, time, level, isExponential);
        return this;
    };

    CustomEnvelope.prototype.setStepLevel = function setStepLevel(name, level) {
        var startIndex = this.orders.start.indexOf(name),
            endIndex = this.orders.stop.indexOf(name);

        if (startIndex === -1 && endIndex === -1) {
            console.warn('No step with name "' + name + '". No level set.');
            return;
        }

        if (startIndex !== -1) {
            this.steps.start[name].level = parseFloat(level);
        } else {
            this.steps.stop[name].level = parseFloat(level);
        }

        return this;
    };

    CustomEnvelope.prototype.setStepTime = function setStepTime(name, time) {
        var startIndex = this.orders.start.indexOf(name),
            endIndex = this.orders.stop.indexOf(name);

        if (startIndex === -1 && endIndex === -1) {
            console.warn('No step with name "' + name + '". No time set.');
            return;
        }

        if (startIndex !== -1) {
            this.steps.start[name].time = parseFloat(time);
        } else {
            this.steps.stop[name].time = parseFloat(time);
        }

        return this;
    };

    CustomEnvelope.prototype._triggerStep = function _triggerStep(param, step, startTime) {
        // if ( step.isExponential === true ) {
        // There's something amiss here!
        // console.log( Math.max( step.level, CONFIG.epsilon ), startTime + step.time );
        // param.exponentialRampToValueAtTime( Math.max( step.level, 0.01 ), startTime + step.time );
        // }
        // else {
        param.linearRampToValueAtTime(step.level, startTime + step.time);
        // }
    };

    CustomEnvelope.prototype._startSection = function _startSection(section, param, startTime, cancelScheduledValues) {
        var stopOrder = this.orders[section],
            steps = this.steps[section],
            numStops = stopOrder.length,
            step;

        param.cancelScheduledValues(startTime);
        // param.setValueAtTime( 0, startTime );

        for (var i = 0; i < numStops; ++i) {
            step = steps[stopOrder[i]];
            this._triggerStep(param, step, startTime);
            startTime += step.time;
        }
    };

    CustomEnvelope.prototype.start = function start(param) {
        var delay = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

        if (param instanceof AudioParam === false && param instanceof Param === false) {
            throw new Error('Can only start an envelope on AudioParam or Param instances.');
        }

        this._startSection('start', param, this.context.currentTime + delay);
    };

    CustomEnvelope.prototype.stop = function stop(param) {
        var delay = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

        this._startSection('stop', param, this.context.currentTime + 0.1 + delay);
    };

    CustomEnvelope.prototype.forceStop = function forceStop(param) {
        var delay = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

        param.cancelScheduledValues(this.context.currentTime + delay);
        // param.setValueAtTime( param.value, this.context.currentTime + delay );
        param.linearRampToValueAtTime(0, this.context.currentTime + 0.001);
    };

    _createClass(CustomEnvelope, [{
        key: "totalStartTime",
        get: function get() {
            var starts = this.steps.start,
                time = 0.0;

            for (var i in starts) {
                time += starts[i].time;
            }

            return time;
        }
    }, {
        key: "totalStopTime",
        get: function get() {
            var stops = this.steps.stop,
                time = 0.0;

            for (var i in stops) {
                time += stops[i].time;
            }

            return time;
        }
    }]);

    return CustomEnvelope;
})();

_coreAudioIOEs62["default"].mixinSingle(CustomEnvelope.prototype, _mixinsSetIOEs62["default"], '_setIO');

_coreAudioIOEs62["default"].prototype.createCustomEnvelope = function () {
    return new CustomEnvelope(this);
};

exports["default"] = CustomEnvelope;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"../core/config.es6":7,"../mixins/setIO.es6":90}],14:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/*
    This Node is an implementation of one of Schroeder's
    AllPass graphs. This particular graph is shown in Figure2
    in the following paper:

        M. R. Schroeder - Natural Sounding Artificial Reverberation

        Journal of the Audio Engineering Society, July 1962.
        Volume 10, Number 3.


    It's available here:
        http://www.ece.rochester.edu/~zduan/teaching/ece472/reading/Schroeder_1962.pdf


    There are three main paths an input signal can take:

    in -> -gain -> sum1 -> out
    in -> sum2 -> delay -> gain -> sum2
    in -> sum2 -> delay -> gain (1-g^2) -> sum1

    For now, the summing nodes are a part of the following class,
    but can easily be removed by connecting `-gain`, `gain`, and `1-gain^2`
    to `this.outputs[0]` and `-gain` and `in` to the delay directly.
 */

// TODO:
//  - Remove unnecessary summing nodes.

var SchroederAllPass = (function (_Node) {
    _inherits(SchroederAllPass, _Node);

    function SchroederAllPass(io, delayTime, feedback) {
        _classCallCheck(this, SchroederAllPass);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.sum1 = io.context.createGain();
        graph.sum2 = io.context.createGain();
        graph.positiveGain = io.context.createGain();
        graph.negativeGain = io.context.createGain();
        graph.negate = io.createNegate();
        graph.delay = io.context.createDelay();
        graph.oneMinusGainSquared = io.context.createGain();
        graph.minusOne = io.createSubtract(1);
        graph.gainSquared = io.createSquare();

        this.controls.feedback = io.createParam(feedback), this.controls.delayTime = io.createParam(delayTime);

        // Zero out controlled params.
        graph.positiveGain.gain.value = 0;
        graph.negativeGain.gain.value = 0;
        graph.oneMinusGainSquared.gain.value = 0;

        // Connect up gain controls
        this.controls.feedback.connect(graph.positiveGain.gain);
        this.controls.feedback.connect(graph.negate);
        graph.negate.connect(graph.negativeGain.gain);
        this.controls.feedback.connect(graph.gainSquared);
        graph.gainSquared.connect(graph.minusOne);
        graph.minusOne.connect(graph.oneMinusGainSquared.gain);

        // connect delay time control
        this.controls.delayTime.connect(graph.delay.delayTime);

        // First signal path:
        // in -> -gain -> graph.sum1 -> out
        this.inputs[0].connect(graph.negativeGain);
        graph.negativeGain.connect(graph.sum1);
        graph.sum1.connect(this.outputs[0]);

        // Second signal path:
        // (in -> graph.sum2 ->) delay -> gain -> graph.sum2
        graph.delay.connect(graph.positiveGain);
        graph.positiveGain.connect(graph.sum2);

        // Third signal path:
        // in -> graph.sum2 -> delay -> gain (1-g^2) -> graph.sum1
        this.inputs[0].connect(graph.sum2);
        graph.sum2.connect(graph.delay);
        graph.delay.connect(graph.oneMinusGainSquared);
        graph.oneMinusGainSquared.connect(graph.sum1);

        this.setGraph(graph);
    }

    return SchroederAllPass;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSchroederAllPass = function (delayTime, feedback) {
    return new SchroederAllPass(this, delayTime, feedback);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],15:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _graphsDryWetNodeEs6 = require("../../graphs/DryWetNode.es6");

var _graphsDryWetNodeEs62 = _interopRequireDefault(_graphsDryWetNodeEs6);

// TODO: Add feedbackLevel and delayTime Param instances
// to control this node.

var Delay = (function (_DryWetNode) {
    _inherits(Delay, _DryWetNode);

    function Delay(io) {
        var time = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
        var feedbackLevel = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

        _classCallCheck(this, Delay);

        _DryWetNode.call(this, io, 1, 1);

        var graph = this.getGraph();

        // Create the control nodes.
        this.controls.feedback = this.io.createParam(feedbackLevel);
        this.controls.time = this.io.createParam(time);

        // Create feedback and delay nodes
        graph.feedback = this.context.createGain();
        graph.delay = this.context.createDelay();

        // Setup the feedback loop
        graph.delay.connect(graph.feedback);
        graph.feedback.connect(graph.delay);

        // Also connect the delay to the wet output.
        graph.delay.connect(this.wet);

        // Connect input to delay
        this.inputs[0].connect(graph.delay);

        graph.delay.delayTime.value = 0;
        graph.feedback.gain.value = 0;

        this.controls.time.connect(graph.delay.delayTime);
        this.controls.feedback.connect(graph.feedback.gain);

        this.setGraph(graph);
    }

    return Delay;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createDelay = function (time, feedbackLevel) {
    return new Delay(this, time, feedbackLevel);
};

exports["default"] = Delay;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../graphs/DryWetNode.es6":33}],16:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _graphsDryWetNodeEs6 = require("../../graphs/DryWetNode.es6");

var _graphsDryWetNodeEs62 = _interopRequireDefault(_graphsDryWetNodeEs6);

// TODO:
//  - Convert this node to use Param controls
//    for time and feedback.

var PingPongDelay = (function (_DryWetNode) {
    _inherits(PingPongDelay, _DryWetNode);

    function PingPongDelay(io) {
        var time = arguments.length <= 1 || arguments[1] === undefined ? 0.25 : arguments[1];
        var feedbackLevel = arguments.length <= 2 || arguments[2] === undefined ? 0.5 : arguments[2];

        _classCallCheck(this, PingPongDelay);

        _DryWetNode.call(this, io, 1, 1);

        var graph = this.getGraph();

        // Create channel splitter and merger
        graph.splitter = this.context.createChannelSplitter(2);
        graph.merger = this.context.createChannelMerger(2);

        // Create feedback and delay nodes
        graph.feedbackL = this.context.createGain();
        graph.feedbackR = this.context.createGain();
        graph.delayL = this.context.createDelay();
        graph.delayR = this.context.createDelay();

        // Setup the feedback loop
        graph.delayL.connect(graph.feedbackL);
        graph.feedbackL.connect(graph.delayR);
        graph.delayR.connect(graph.feedbackR);
        graph.feedbackR.connect(graph.delayL);

        this.inputs[0].connect(graph.splitter);
        graph.splitter.connect(graph.delayL, 0);
        graph.feedbackL.connect(graph.merger, 0, 0);
        graph.feedbackR.connect(graph.merger, 0, 1);
        graph.merger.connect(this.wet);

        graph.delayL.delayTime.value = 0;
        graph.delayR.delayTime.value = 0;
        graph.feedbackL.gain.value = 0;
        graph.feedbackR.gain.value = 0;

        this.controls.time = this.io.createParam();
        this.controls.feedback = this.io.createParam();

        this.controls.time.connect(graph.delayL.delayTime);
        this.controls.time.connect(graph.delayR.delayTime);
        this.controls.feedback.connect(graph.feedbackL.gain);
        this.controls.feedback.connect(graph.feedbackR.gain);

        this.setGraph(graph);
    }

    return PingPongDelay;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createPingPongDelay = function (time, feedbackLevel) {
    return new PingPongDelay(this, time, feedbackLevel);
};

},{"../../core/AudioIO.es6":3,"../../graphs/DryWetNode.es6":33}],17:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _graphsDryWetNodeEs6 = require("../../graphs/DryWetNode.es6");

var _graphsDryWetNodeEs62 = _interopRequireDefault(_graphsDryWetNodeEs6);

var StereoDelay = (function (_DryWetNode) {
    _inherits(StereoDelay, _DryWetNode);

    function StereoDelay(io) {
        _classCallCheck(this, StereoDelay);

        _DryWetNode.call(this, io, 1, 1);

        var graph = this.getGraph();

        // Create the control nodes.
        this.controls.feedback = this.io.createParam();
        this.controls.timeL = this.io.createParam();
        this.controls.timeR = this.io.createParam();

        graph.splitter = this.io.createSplitter(2);
        graph.delayL = this.context.createDelay();
        graph.delayR = this.context.createDelay();
        graph.feedbackL = this.context.createGain();
        graph.feedbackR = this.context.createGain();
        graph.merger = this.io.createMerger(2);

        graph.delayL.delayTime.value = 0;
        graph.delayR.delayTime.value = 0;
        graph.feedbackL.gain.value = 0;
        graph.feedbackR.gain.value = 0;

        graph.delayL.connect(graph.feedbackL);
        graph.feedbackL.connect(graph.delayL);
        graph.delayR.connect(graph.feedbackR);
        graph.feedbackR.connect(graph.delayR);

        this.controls.feedback.connect(graph.feedbackL.gain);
        this.controls.feedback.connect(graph.feedbackR.gain);
        this.controls.timeL.connect(graph.delayL.delayTime);
        this.controls.timeR.connect(graph.delayR.delayTime);

        this.inputs[0].connect(graph.splitter);
        graph.splitter.connect(graph.delayL, 0);
        graph.splitter.connect(graph.delayR, 1);
        graph.delayL.connect(graph.merger, 0, 0);
        graph.delayR.connect(graph.merger, 0, 1);
        graph.merger.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return StereoDelay;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createStereoDelay = function () {
    return new StereoDelay(this);
};

exports["default"] = StereoDelay;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../graphs/DryWetNode.es6":33}],18:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var FILTER_STORE = new WeakMap();

function createFilter(io, type) {
    var graph = {
        filter: io.context.createBiquadFilter(),
        controls: {},
        type: undefined
    };

    graph.filter.frequency.value = 0;
    graph.filter.Q.value = 0;

    graph.controls.frequency = io.createParam();
    graph.controls.Q = io.createParam();

    graph.controls.frequency.connect(graph.filter.frequency);
    graph.controls.Q.connect(graph.filter.Q);

    graph.setType = function (type) {
        this.type = type;

        switch (type) {
            case 'LP12':
                this.filter.type = 'lowpass';
                break;

            case 'notch':
                this.filter.type = 'notch';
                break;

            case 'HP12':
                this.filter.type = 'highpass';
                break;

            // Fall through to handle those filter
            // types with `gain` AudioParams.
            case 'lowshelf':
                this.filter.type = 'lowshelf';
            case 'highshelf':
                this.filter.type = 'highshelf';
            case 'peaking':
                this.filter.type = 'peaking';
                this.filter.gain.value = 0;
                this.controls.gain = io.createParam();
                break;
        }
    };

    graph.setType(type);

    return graph;
}

var CustomEQ = (function (_Node) {
    _inherits(CustomEQ, _Node);

    function CustomEQ(io) {
        _classCallCheck(this, CustomEQ);

        _Node.call(this, io, 1, 1);

        // Initially, this Node is just a pass-through
        // until filters are added.
        this.inputs[0].connect(this.outputs[0]);
    }

    CustomEQ.prototype.addFilter = function addFilter(type) {
        var filterGraph = createFilter(this.io, type),
            filters = FILTER_STORE.get(this) || [];

        // If this is the first filter being added,
        // make sure input is connected and filter
        // is then connected to output.
        if (filters.length === 0) {
            this.inputs[0].disconnect(this.outputs[0]);
            this.inputs[0].connect(filterGraph.filter);
            filterGraph.filter.connect(this.outputs[0]);
        }

        // If there are already filters, the last filter
        // in the graph will need to be disconnected form
        // the output before the new filter is connected.
        else {
                filters[filters.length - 1].filter.disconnect(this.outputs[0]);
                filters[filters.length - 1].filter.connect(filterGraph.filter);
                filterGraph.filter.connect(this.outputs[0]);
            }

        // Store the filter and save the new filters object
        // (it needs to be saved in case this is the first
        // filter being added, and very little overhead to
        // calling `set` if it's not the first filter being
        // added).
        filters.push(filterGraph);
        FILTER_STORE.set(this, filters);

        return filterGraph;
    };

    CustomEQ.prototype.getFilter = function getFilter(index) {
        return FILTER_STORE.get(this)[index];
    };

    CustomEQ.prototype.getAllFilters = function getAllFilters() {
        return FILTER_STORE.get(this);
    };

    CustomEQ.prototype.removeFilter = function removeFilter(filterGraph) {
        var filters = FILTER_STORE.get(this),
            index = filters.indexOf(filterGraph);

        return this.removeFilterAtIndex(index);
    };

    CustomEQ.prototype.removeFilterAtIndex = function removeFilterAtIndex(index) {
        var filters = FILTER_STORE.get(this);

        if (!filters[index]) {
            console.warn('No filter at the given index:', index, filters);
            return false;
        }

        // disconnect the requested filter
        // and remove it from the filters array.
        filters[index].filter.disconnect();
        filters.splice(index, 1);

        // If all filters have been removed, connect the
        // input to the output so audio still passes through.
        if (filters.length === 0) {
            this.inputs[0].connect(this.outputs[0]);
        }

        // If the first filter has been removed, and there
        // are still filters in the array, connect the input
        // to the new first filter.
        else if (index === 0) {
                this.inputs[0].connect(filters[0].filter);
            }

            // If the last filter has been removed, the
            // new last filter must be connected to the output
            else if (index === filters.length) {
                    filters[filters.length - 1].filter.connect(this.outputs[0]);
                }

                // Otherwise, the index of the filter that's been
                // removed isn't the first, last, or only index in the
                // array, so connect the previous filter to the new
                // one at the given index.
                else {
                        filters[index - 1].filter.connect(filters[index].filter);
                    }

        FILTER_STORE.set(this, filters);

        return this;
    };

    CustomEQ.prototype.removeAllFilters = function removeAllFilters() {
        var filters = FILTER_STORE.get(this);

        for (var i = filters.length - 1; i >= 0; --i) {
            this.removeFilterAtIndex(i);
        }

        return this;
    };

    return CustomEQ;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createCustomEQ = function () {
    return new CustomEQ(this);
};

exports["default"] = CustomEQ;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],19:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var AllPassFilter = (function (_Node) {
    _inherits(AllPassFilter, _Node);

    function AllPassFilter(io) {
        _classCallCheck(this, AllPassFilter);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.crossfaderSlope = this.io.createCrossfader(2, 0);
        graph.lp12dB = this.context.createBiquadFilter();
        graph.lp24dB = this.context.createBiquadFilter();

        graph.lp12dB.type = 'allpass';
        graph.lp24dB.type = 'allpass';
        graph.lp12dB.frequency.value = 0;
        graph.lp24dB.frequency.value = 0;
        graph.lp12dB.Q.value = 0;
        graph.lp24dB.Q.value = 0;

        this.controls.slope = graph.crossfaderSlope.controls.index;
        this.controls.frequency = this.io.createParam();
        this.controls.Q = this.io.createParam();

        this.controls.frequency.connect(graph.lp12dB.frequency);
        this.controls.frequency.connect(graph.lp24dB.frequency);
        this.controls.Q.connect(graph.lp12dB.Q);
        this.controls.Q.connect(graph.lp24dB.Q);

        this.inputs[0].connect(graph.lp12dB);
        graph.lp12dB.connect(graph.crossfaderSlope, 0, 0);
        graph.lp12dB.connect(graph.lp24dB);
        graph.lp24dB.connect(graph.crossfaderSlope, 0, 1);
        graph.crossfaderSlope.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return AllPassFilter;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createAllPassFilter = function () {
    return new AllPassFilter(this);
};

exports["default"] = AllPassFilter;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],20:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var BPFilter = (function (_Node) {
    _inherits(BPFilter, _Node);

    function BPFilter(io) {
        _classCallCheck(this, BPFilter);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.crossfaderSlope = this.io.createCrossfader(2, 0);
        graph.lp12dB = this.context.createBiquadFilter();
        graph.lp24dB = this.context.createBiquadFilter();

        graph.lp12dB.type = 'bandpass';
        graph.lp24dB.type = 'bandpass';
        graph.lp12dB.frequency.value = 0;
        graph.lp24dB.frequency.value = 0;
        graph.lp12dB.Q.value = 0;
        graph.lp24dB.Q.value = 0;

        this.controls.slope = graph.crossfaderSlope.controls.index;
        this.controls.frequency = this.io.createParam();
        this.controls.Q = this.io.createParam();

        this.controls.frequency.connect(graph.lp12dB.frequency);
        this.controls.frequency.connect(graph.lp24dB.frequency);
        this.controls.Q.connect(graph.lp12dB.Q);
        this.controls.Q.connect(graph.lp24dB.Q);

        this.inputs[0].connect(graph.lp12dB);
        graph.lp12dB.connect(graph.crossfaderSlope, 0, 0);
        graph.lp12dB.connect(graph.lp24dB);
        graph.lp24dB.connect(graph.crossfaderSlope, 0, 1);
        graph.crossfaderSlope.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return BPFilter;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createBPFilter = function () {
    return new BPFilter(this);
};

exports["default"] = BPFilter;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],21:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var FILTER_TYPES = ['lowpass', 'bandpass', 'highpass', 'notch', 'lowpass'];

var FilterBank = (function (_Node) {
    _inherits(FilterBank, _Node);

    function FilterBank(io) {
        _classCallCheck(this, FilterBank);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.crossfader12dB = this.io.createCrossfader(FILTER_TYPES.length, 0);
        graph.crossfader24dB = this.io.createCrossfader(FILTER_TYPES.length, 0);
        graph.crossfaderSlope = this.io.createCrossfader(2, 0);
        graph.filters12dB = [];
        graph.filters24dB = [];

        this.controls.slope = graph.crossfaderSlope.controls.index;
        this.controls.frequency = this.io.createParam();
        this.controls.Q = this.io.createParam();
        this.controls.filterType = this.io.createParam();
        this.controls.filterType.connect(graph.crossfader12dB.controls.index);
        this.controls.filterType.connect(graph.crossfader24dB.controls.index);

        // Create the first set of 12db filters (standard issue with WebAudioAPI)
        for (var i = 0; i < FILTER_TYPES.length; ++i) {
            var filter = this.context.createBiquadFilter();

            filter.type = FILTER_TYPES[i];
            filter.frequency.value = 0;
            filter.Q.value = 0;

            this.controls.frequency.connect(filter.frequency);
            this.controls.Q.connect(filter.Q);
            this.inputs[0].connect(filter);
            filter.connect(graph.crossfader12dB, 0, i);

            graph.filters12dB.push(filter);
        }

        // Create the second set of 12db filters,
        // where the first set will be piped into so we
        // end up with double the rolloff (12dB * 2 = 24dB).
        for (var i = 0; i < FILTER_TYPES.length; ++i) {
            var filter = this.context.createBiquadFilter();

            filter.type = FILTER_TYPES[i];
            filter.frequency.value = 0;
            filter.Q.value = 0;

            console.log(filter);

            this.controls.frequency.connect(filter.frequency);
            this.controls.Q.connect(filter.Q);
            graph.filters12dB[i].connect(filter);
            filter.connect(graph.crossfader24dB, 0, i);

            graph.filters24dB.push(filter);
        }

        graph.crossfader12dB.connect(graph.crossfaderSlope, 0, 0);
        graph.crossfader24dB.connect(graph.crossfaderSlope, 0, 1);
        graph.crossfaderSlope.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return FilterBank;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createFilterBank = function () {
    return new FilterBank(this);
};

exports["default"] = FilterBank;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],22:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var HPFilter = (function (_Node) {
    _inherits(HPFilter, _Node);

    function HPFilter(io) {
        _classCallCheck(this, HPFilter);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.crossfaderSlope = this.io.createCrossfader(2, 0);
        graph.lp12dB = this.context.createBiquadFilter();
        graph.lp24dB = this.context.createBiquadFilter();

        graph.lp12dB.type = 'highpass';
        graph.lp24dB.type = 'highpass';
        graph.lp12dB.frequency.value = 0;
        graph.lp24dB.frequency.value = 0;
        graph.lp12dB.Q.value = 0;
        graph.lp24dB.Q.value = 0;

        this.controls.slope = graph.crossfaderSlope.controls.index;
        this.controls.frequency = this.io.createParam();
        this.controls.Q = this.io.createParam();

        this.controls.frequency.connect(graph.lp12dB.frequency);
        this.controls.frequency.connect(graph.lp24dB.frequency);
        this.controls.Q.connect(graph.lp12dB.Q);
        this.controls.Q.connect(graph.lp24dB.Q);

        this.inputs[0].connect(graph.lp12dB);
        graph.lp12dB.connect(graph.crossfaderSlope, 0, 0);
        graph.lp12dB.connect(graph.lp24dB);
        graph.lp24dB.connect(graph.crossfaderSlope, 0, 1);
        graph.crossfaderSlope.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return HPFilter;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createHPFilter = function () {
    return new HPFilter(this);
};

exports["default"] = HPFilter;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],23:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var LPFilter = (function (_Node) {
    _inherits(LPFilter, _Node);

    function LPFilter(io) {
        _classCallCheck(this, LPFilter);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.crossfaderSlope = this.io.createCrossfader(2, 0);
        graph.lp12dB = this.context.createBiquadFilter();
        graph.lp24dB = this.context.createBiquadFilter();

        graph.lp12dB.type = 'lowpass';
        graph.lp24dB.type = 'lowpass';
        graph.lp12dB.frequency.value = 0;
        graph.lp24dB.frequency.value = 0;
        graph.lp12dB.Q.value = 0;
        graph.lp24dB.Q.value = 0;

        this.controls.slope = graph.crossfaderSlope.controls.index;
        this.controls.frequency = this.io.createParam();
        this.controls.Q = this.io.createParam();

        this.controls.frequency.connect(graph.lp12dB.frequency);
        this.controls.frequency.connect(graph.lp24dB.frequency);
        this.controls.Q.connect(graph.lp12dB.Q);
        this.controls.Q.connect(graph.lp24dB.Q);

        this.inputs[0].connect(graph.lp12dB);
        graph.lp12dB.connect(graph.crossfaderSlope, 0, 0);
        graph.lp12dB.connect(graph.lp24dB);
        graph.lp24dB.connect(graph.crossfaderSlope, 0, 1);
        graph.crossfaderSlope.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return LPFilter;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createLPFilter = function () {
    return new LPFilter(this);
};

exports["default"] = LPFilter;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],24:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var NotchFilter = (function (_Node) {
    _inherits(NotchFilter, _Node);

    function NotchFilter(io) {
        _classCallCheck(this, NotchFilter);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.crossfaderSlope = this.io.createCrossfader(2, 0);
        graph.lp12dB = this.context.createBiquadFilter();
        graph.lp24dB = this.context.createBiquadFilter();

        graph.lp12dB.type = 'notch';
        graph.lp24dB.type = 'notch';
        graph.lp12dB.frequency.value = 0;
        graph.lp24dB.frequency.value = 0;
        graph.lp12dB.Q.value = 0;
        graph.lp24dB.Q.value = 0;

        this.controls.slope = graph.crossfaderSlope.controls.index;
        this.controls.frequency = this.io.createParam();
        this.controls.Q = this.io.createParam();

        this.controls.frequency.connect(graph.lp12dB.frequency);
        this.controls.frequency.connect(graph.lp24dB.frequency);
        this.controls.Q.connect(graph.lp12dB.Q);
        this.controls.Q.connect(graph.lp24dB.Q);

        this.inputs[0].connect(graph.lp12dB);
        graph.lp12dB.connect(graph.crossfaderSlope, 0, 0);
        graph.lp12dB.connect(graph.lp24dB);
        graph.lp24dB.connect(graph.crossfaderSlope, 0, 1);
        graph.crossfaderSlope.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return NotchFilter;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createNotchFilter = function () {
    return new NotchFilter(this);
};

exports["default"] = NotchFilter;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],25:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _graphsDryWetNodeEs6 = require("../../graphs/DryWetNode.es6");

var _graphsDryWetNodeEs62 = _interopRequireDefault(_graphsDryWetNodeEs6);

// TODO: Add feedbackLevel and delayTime Param instances
// to control this node.

var SineShaper = (function (_DryWetNode) {
    _inherits(SineShaper, _DryWetNode);

    function SineShaper(io) {
        _classCallCheck(this, SineShaper);

        _DryWetNode.call(this, io);

        this.controls.drive = this.io.createParam();
        this.shaper = this.io.createWaveShaper(this.io.curves.Sine);
        this.shaperDrive = this.context.createGain();
        this.shaperDrive.gain.value = 1;

        this.inputs[0].connect(this.shaperDrive);
        this.controls.drive.connect(this.shaperDrive.gain);
        this.shaperDrive.connect(this.shaper);
        this.shaper.connect(this.wet);
    }

    return SineShaper;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createSineShaper = function (time, feedbackLevel) {
    return new SineShaper(this, time, feedbackLevel);
};

exports["default"] = SineShaper;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../graphs/DryWetNode.es6":33}],26:[function(require,module,exports){
/*
	Graph for this node is shown in the following paper:

		Beat Frei - Digital Sound Generation (Appendix C: Miscellaneous – 1. DC Trap)
		ICST, Zurich Uni of Arts.

	Available here:
		https://courses.cs.washington.edu/courses/cse490s/11au/Readings/Digital_Sound_Generation_1.pdf



	Essentially, a DCTrap removes the DC offset or DC bias
	from the incoming signal, where a DC offset is elements
	of the signal that are at 0Hz.

	The graph is as follows:

		   |---<---<|   input
		   |		|	  |
		   -> z-1 -> -> negate -> -> out
		   |					 |
		   |<-------------- *a <-|


	The a, or alpha, value is calculated is as follows:
		`a = 2PIfg / fs`

	Where `fg` determines the 'speed' of the trap (the 'cutoff'),
	and `fs` is the sample rate. This can be expanded into the
	following to avoid a more expensive division (as the reciprocal
	of the sample rate can be calculated beforehand):
		`a = (2 * PI * fg) * (1 / fs)`


	Given an `fg` of 5, and sample rate of 48000, we get:
		`a = 2 * PI * 5 * (1 / 48000)`
		`a = 6.2831 * 5 * 2.08333e-05`
		`a = 31.4155 * 2.08333e-05`
		`a = 0.00065448853615`.
 */

"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var DCTrap = (function (_Node) {
  _inherits(DCTrap, _Node);

  function DCTrap(io) {
    var cutoff = arguments.length <= 1 || arguments[1] === undefined ? 5 : arguments[1];

    _classCallCheck(this, DCTrap);

    _Node.call(this, io, 1, 1);

    var graph = this.getGraph();

    // Create the cutoff, or `fg` constant.
    // There will rarely be a need to change this value from
    // either the given one, or it's default of 5,
    // so I'm not making this into a control.
    graph.cutoff = this.io.createConstant(cutoff);

    // Alpha calculation
    graph.PI2 = this.io.createConstantPI2();
    graph.cutoffMultiply = this.io.createMultiply();
    graph.alpha = this.io.createMultiply(1 / this.context.sampleRate);
    graph.PI2.connect(graph.cutoffMultiply, 0, 0);
    graph.cutoff.connect(graph.cutoffMultiply, 0, 1);
    graph.cutoffMultiply.connect(graph.alpha, 0, 0);

    // Main graph
    graph.negate = this.io.createNegate();
    graph.zMinusOne = this.io.createSampleDelay();
    graph.multiply = this.io.createMultiply();

    // Connect up main graph and alpha.
    this.inputs[0].connect(graph.negate);
    graph.negate.connect(graph.multiply, 0, 0);
    graph.alpha.connect(graph.multiply, 0, 1);
    graph.multiply.connect(graph.zMinusOne);
    graph.zMinusOne.connect(graph.zMinusOne);
    graph.zMinusOne.connect(graph.negate);
    graph.negate.connect(this.outputs[0]);

    this.setGraph(graph);
  }

  return DCTrap;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createDCTrap = function (cutoff) {
  return new DCTrap(this, cutoff);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],27:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var _buffersBufferUtilsEs6 = require("../../buffers/BufferUtils.es6");

var _buffersBufferUtilsEs62 = _interopRequireDefault(_buffersBufferUtilsEs6);

var _buffersBufferGeneratorsEs6 = require("../../buffers/BufferGenerators.es6");

var _buffersBufferGeneratorsEs62 = _interopRequireDefault(_buffersBufferGeneratorsEs6);

var LFO = (function (_Node) {
    _inherits(LFO, _Node);

    function LFO(io) {
        var cutoff = arguments.length <= 1 || arguments[1] === undefined ? 5 : arguments[1];

        _classCallCheck(this, LFO);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        // Create nodes.
        graph.oscillator = this.io.createOscillatorBank();
        graph.phaseOffset = this.io.createPhaseOffset();
        graph.depth = this.context.createGain();
        graph.jitterDepth = this.context.createGain();
        graph.jitterOscillator = this.context.createBufferSource();

        graph.jitterOscillator.buffer = _buffersBufferUtilsEs62["default"].generateBuffer(this.io, // context
        1, // channels
        this.context.sampleRate * 2, // length
        this.context.sampleRate, // SampleRate
        _buffersBufferGeneratorsEs62["default"].WhiteNoise // Generator function
        );

        // Zero-out the depth gain nodes so the value
        // of the depth controls aren't multiplied.
        graph.depth.gain.value = 0;
        graph.jitterDepth.gain.value = 0;

        // Set jitter oscillator settings
        graph.jitterOscillator.loop = true;
        graph.jitterOscillator.start();

        // Create controls
        this.controls.frequency = graph.oscillator.controls.frequency;
        this.controls.detune = graph.oscillator.controls.detune;
        this.controls.waveform = graph.oscillator.controls.waveform;
        this.controls.depth = this.io.createParam();
        this.controls.offset = graph.phaseOffset.controls.phase;
        this.controls.jitter = this.io.createParam();

        // Control connections.
        this.controls.frequency.connect(graph.phaseOffset.controls.frequency);
        this.controls.depth.connect(graph.depth.gain);
        this.controls.jitter.connect(graph.jitterDepth.gain);

        // Main LFO osc connections
        graph.oscillator.connect(graph.phaseOffset);
        graph.phaseOffset.connect(graph.depth);
        graph.depth.connect(this.outputs[0]);

        // Jitter connections
        graph.jitterOscillator.connect(graph.jitterDepth);
        graph.jitterDepth.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    LFO.prototype.start = function start() {
        var delay = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

        this.getGraph().oscillator.start(delay);
    };

    LFO.prototype.stop = function stop() {
        var delay = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

        this.getGraph().oscillator.stop(delay);
    };

    return LFO;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createLFO = function (cutoff) {
    return new LFO(this, cutoff);
};

},{"../../buffers/BufferGenerators.es6":1,"../../buffers/BufferUtils.es6":2,"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],28:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// Based on the following formula from Michael Gruhn:
//  - http://musicdsp.org/showArchiveComment.php?ArchiveID=255
//
// ------------------------------------------------------------
//
// Calculate transformation matrix's coefficients
// cos_coef = cos(angle);
// sin_coef = sin(angle);
//
// Do this per sample
// out_left = in_left * cos_coef - in_right * sin_coef;
// out_right = in_left * sin_coef + in_right * cos_coef;
//
// Rotation is in radians.

var StereoRotation = (function (_Node) {
    _inherits(StereoRotation, _Node);

    function StereoRotation(io, rotation) {
        _classCallCheck(this, StereoRotation);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        this.controls.rotation = this.io.createParam(rotation);

        graph.splitter = this.context.createChannelSplitter(2);
        graph.cos = this.io.createCos();
        graph.sin = this.io.createSin();

        this.controls.rotation.connect(graph.cos);
        this.controls.rotation.connect(graph.sin);

        graph.leftMultiplyCos = this.io.createMultiply();
        graph.leftMultiplySin = this.io.createMultiply();
        graph.rightMultiplyCos = this.io.createMultiply();
        graph.rightMultiplySin = this.io.createMultiply();
        graph.leftCosMinusRightSin = this.io.createSubtract();
        graph.leftSinAddRightCos = this.io.createAdd();

        graph.inputLeft = this.context.createGain();
        graph.inputRight = this.context.createGain();
        graph.merger = this.context.createChannelMerger(2);

        graph.splitter.connect(graph.inputLeft, 0);
        graph.splitter.connect(graph.inputRight, 1);

        graph.inputLeft.connect(graph.leftMultiplyCos, 0, 0);
        graph.cos.connect(graph.leftMultiplyCos, 0, 1);
        graph.inputLeft.connect(graph.leftMultiplySin, 0, 0);
        graph.sin.connect(graph.leftMultiplySin, 0, 1);

        graph.inputRight.connect(graph.rightMultiplySin, 0, 0);
        graph.sin.connect(graph.rightMultiplySin, 0, 1);
        graph.inputRight.connect(graph.rightMultiplyCos, 0, 0);
        graph.cos.connect(graph.rightMultiplyCos, 0, 1);

        graph.leftMultiplyCos.connect(graph.leftCosMinusRightSin, 0, 0);
        graph.rightMultiplySin.connect(graph.leftCosMinusRightSin, 0, 1);
        graph.leftMultiplySin.connect(graph.leftSinAddRightCos, 0, 0);
        graph.rightMultiplyCos.connect(graph.leftSinAddRightCos, 0, 1);

        graph.leftCosMinusRightSin.connect(graph.merger, 0, 0);
        graph.leftSinAddRightCos.connect(graph.merger, 0, 1);

        this.inputs[0].connect(graph.splitter);
        graph.merger.connect(this.outputs[0]);

        this.namedInputs.left = graph.inputLeft;
        this.namedInputs.right = graph.inputRight;

        this.setGraph(graph);
    }

    return StereoRotation;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createStereoRotation = function (rotation) {
    return new StereoRotation(this, rotation);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],29:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// Based on the following formula from Michael Gruhn:
//  - http://musicdsp.org/showArchiveComment.php?ArchiveID=256
//
// ------------------------------------------------------------
//
// The graph that's created is as follows:
//
//                   |-> L -> leftAddRight( ch0 ) -> |
//                   |-> R -> leftAddRight( ch1 ) -> | -> multiply( 0.5 ) ------> monoMinusStereo( 0 ) -> merger( 0 ) // outL
// input -> splitter -                                                  |-----> monoPlusStereo( 0 ) --> merger( 1 ) // outR
//                   |-> L -> rightMinusLeft( ch1 ) -> |
//                   |-> R -> rightMinusLeft( ch0 ) -> | -> multiply( coef ) ---> monoMinusStereo( 1 ) -> merger( 0 ) // outL
//
//

var StereoWidth = (function (_Node) {
    _inherits(StereoWidth, _Node);

    function StereoWidth(io, width) {
        _classCallCheck(this, StereoWidth);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.splitter = this.context.createChannelSplitter(2);
        graph.coefficient = this.io.createParam(width);
        graph.coefficientHalf = this.io.createMultiply(0.5);
        graph.inputLeft = this.context.createGain();
        graph.inputRight = this.context.createGain();
        graph.leftAddRight = this.io.createAdd();
        graph.rightMinusLeft = this.io.createSubtract();
        graph.multiplyPointFive = this.io.createMultiply(0.5);
        graph.multiplyCoefficient = this.io.createMultiply();
        graph.monoMinusStereo = this.io.createSubtract();
        graph.monoPlusStereo = this.io.createAdd();
        graph.merger = this.context.createChannelMerger(2);

        graph.coefficient.connect(graph.coefficientHalf);
        graph.coefficientHalf.connect(graph.multiplyCoefficient, 0, 1);

        graph.splitter.connect(graph.inputLeft, 0);
        graph.splitter.connect(graph.inputRight, 1);
        graph.inputLeft.connect(graph.leftAddRight, 0, 0);
        graph.inputRight.connect(graph.leftAddRight, 0, 1);
        graph.inputLeft.connect(graph.rightMinusLeft, 0, 1);
        graph.inputRight.connect(graph.rightMinusLeft, 0, 0);

        graph.leftAddRight.connect(graph.multiplyPointFive);
        graph.rightMinusLeft.connect(graph.multiplyCoefficient, 0, 0);

        graph.multiplyPointFive.connect(graph.monoMinusStereo, 0, 0);
        graph.multiplyCoefficient.connect(graph.monoMinusStereo, 0, 1);

        graph.multiplyPointFive.connect(graph.monoPlusStereo, 0, 0);
        graph.multiplyCoefficient.connect(graph.monoPlusStereo, 0, 1);

        graph.monoMinusStereo.connect(graph.merger, 0, 0);
        graph.monoPlusStereo.connect(graph.merger, 0, 1);

        this.inputs[0].connect(graph.splitter);
        graph.merger.connect(this.outputs[0]);

        this.namedInputs.left = graph.inputLeft;
        this.namedInputs.right = graph.inputRight;

        this.controls.width = graph.coefficient;

        this.setGraph(graph);
    }

    return StereoWidth;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createStereoWidth = function (width) {
    return new StereoWidth(this, width);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],30:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require("../core/AudioIO.es6");

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var OscillatorGenerator = (function () {
    function OscillatorGenerator(io, frequency, detune, velocity, glideTime, waveform) {
        _classCallCheck(this, OscillatorGenerator);

        this._setIO(io);

        this.frequency = frequency;
        this.detune = detune;
        this.velocity = velocity;
        this.glideTime = glideTime;
        this.wave = waveform || 'sine';
        this.resetTimestamp = 0.0;

        this.generator = this.context.createOscillator(), this.velocityGraph = this._makeVelocityGraph(velocity);
        this.outputs = [this.context.createGain()];
        this.reset(this.frequency, this.detune, this.velocity, this.glideTime, this.wave);

        this.generator.connect(this.velocityGraph);
        this.velocityGraph.connect(this.outputs[0]);
    }

    OscillatorGenerator.prototype._makeVelocityGraph = function _makeVelocityGraph() {
        var gain = this.context.createGain();
        return gain;
    };

    OscillatorGenerator.prototype._resetVelocityGraph = function _resetVelocityGraph(velocity) {
        this.velocityGraph.gain.value = velocity;
    };

    OscillatorGenerator.prototype._cleanUpVelocityGraph = function _cleanUpVelocityGraph() {
        this.velocityGraph.disconnect();
        this.outputs[0].disconnect();
        this.velocityGraph = null;
        this.outputs[0] = null;
        this.outputs = null;
    };

    OscillatorGenerator.prototype.lerp = function lerp(start, end, delta) {
        return start + (end - start) * delta;
    };

    OscillatorGenerator.prototype.reset = function reset(frequency, detune, velocity, glideTime, wave) {
        var now = this.context.currentTime;

        frequency = typeof frequency === 'number' ? frequency : this.frequency;
        detune = typeof detune === 'number' ? detune : this.detune;
        velocity = typeof velocity === 'number' ? velocity : this.velocity;
        wave = typeof wave === 'number' ? wave : this.wave;

        var glideTime = typeof glideTime === 'number' ? glideTime : 0;

        this._resetVelocityGraph(velocity);

        this.generator.frequency.cancelScheduledValues(now);
        this.generator.detune.cancelScheduledValues(now);

        // now += 0.1

        // if ( this.glideTime !== 0.0 ) {
        //     var startFreq = this.frequency,
        //         endFreq = frequency,
        //         freqDiff = endFreq - startFreq,
        //         startTime = this.resetTimestamp,
        //         endTime = this.resetTimestamp + this.glideTime,
        //         currentTime = now - startTime,
        //         lerpPos = currentTime / this.glideTime,
        //         currentFreq = this.lerp( this.frequency, frequency, lerpPos );

        //     if ( currentTime < glideTime ) {
        //         console.log( 'cutoff', startFreq, currentFreq );
        //         this.generator.frequency.setValueAtTime( currentFreq, now );
        //     }

        //     console.log( startTime, endTime, now, currentTime );
        // }

        // now += 0.5;

        if (glideTime !== 0) {
            this.generator.frequency.linearRampToValueAtTime(frequency, now + glideTime);
            this.generator.detune.linearRampToValueAtTime(detune, now + glideTime);
        } else {
            this.generator.frequency.setValueAtTime(frequency, now);
            this.generator.detune.setValueAtTime(detune, now);
        }

        if (typeof wave === 'string') {
            this.generator.type = wave;
        } else {
            this.generator.type = this.wave;
        }

        this.resetTimestamp = now;
        this.glideTime = glideTime;
        this.frequency = frequency;
        this.detune = detune;
        this.velocity = velocity;
        this.wave = wave;
    };

    OscillatorGenerator.prototype.start = function start(delay) {
        this.generator.start(delay);
    };

    OscillatorGenerator.prototype.stop = function stop(delay) {
        this.generator.stop(delay);
    };

    OscillatorGenerator.prototype.cleanUp = function cleanUp() {
        this.generator.disconnect();
        this.generator = null;

        this._cleanUpVelocityGraph();
    };

    return OscillatorGenerator;
})();

AudioIO.mixinSingle(OscillatorGenerator.prototype, _mixinsSetIOEs62["default"], '_setIO');

AudioIO.prototype.createOscillatorGenerator = function (frequency, detune, velocity, glideTime, wave) {
    return new OscillatorGenerator(this, frequency, detune, velocity, glideTime, wave);
};

},{"../core/AudioIO.es6":3,"../mixins/setIO.es6":90}],31:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// TODO:
//  - Turn arguments into controllable parameters;

var Counter = (function (_Node) {
    _inherits(Counter, _Node);

    function Counter(io, increment, limit, stepTime) {
        _classCallCheck(this, Counter);

        _Node.call(this, io, 0, 1);

        this.running = false;

        this.stepTime = stepTime || 1 / this.context.sampleRate;

        this.constant = this.io.createParam(increment);
        this.multiply = this.io.createMultiply();

        this.delay = this.context.createDelay();
        this.delay.delayTime.value = this.stepTime;

        this.feedback = this.context.createGain();
        this.feedback.gain.value = 0;
        this.feedback.connect(this.delay);

        this.multiply.connect(this.delay);
        this.delay.connect(this.feedback);
        this.feedback.connect(this.delay);

        this.lessThan = this.io.createLessThan(limit);
        this.delay.connect(this.lessThan);
        // this.lessThan.connect( this.feedback.gain );
        this.constant.connect(this.multiply, 0, 0);
        this.lessThan.connect(this.multiply, 0, 1);

        this.delay.connect(this.outputs[0]);
    }

    Counter.prototype.reset = function reset() {
        var self = this;

        this.stop();

        setTimeout(function () {
            self.start();
        }, 16);
    };

    Counter.prototype.start = function start() {
        if (this.running === false) {
            this.running = true;
            this.delay.delayTime.value = this.stepTime;
            this.lessThan.connect(this.feedback.gain);
        }
    };

    Counter.prototype.stop = function stop() {
        if (this.running === true) {
            this.running = false;
            this.lessThan.disconnect(this.feedback.gain);
            this.delay.delayTime.value = 0;
        }
    };

    Counter.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
    };

    return Counter;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createCounter = function (increment, limit, stepTime) {
    return new Counter(this, increment, limit, stepTime);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],32:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Crossfader = (function (_Node) {
    _inherits(Crossfader, _Node);

    function Crossfader(io) {
        var numCases = arguments.length <= 1 || arguments[1] === undefined ? 2 : arguments[1];
        var startingCase = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

        _classCallCheck(this, Crossfader);

        // Ensure startingCase is never < 0
        // and number of inputs is always >= 2 (no point
        // x-fading between less than two inputs!)
        startingCase = Math.abs(startingCase);
        numCases = Math.max(numCases, 2);

        _Node.call(this, io, numCases, 1);

        this.clamps = [];
        this.subtracts = [];
        this.xfaders = [];
        this.controls.index = this.io.createParam();

        for (var i = 0; i < numCases - 1; ++i) {
            this.xfaders[i] = this.io.createDryWetNode();
            this.subtracts[i] = this.io.createSubtract(i);
            this.clamps[i] = this.io.createClamp(0, 1);

            if (i === 0) {
                this.inputs[i].connect(this.xfaders[i].dry);
                this.inputs[i + 1].connect(this.xfaders[i].wet);
            } else {
                this.xfaders[i - 1].connect(this.xfaders[i].dry);
                this.inputs[i + 1].connect(this.xfaders[i].wet);
            }

            this.controls.index.connect(this.subtracts[i]);
            this.subtracts[i].connect(this.clamps[i]);
            this.clamps[i].connect(this.xfaders[i].controls.dryWet);
        }

        this.xfaders[this.xfaders.length - 1].connect(this.outputs[0]);
    }

    Crossfader.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
    };

    return Crossfader;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createCrossfader = function (numCases, startingCase) {
    return new Crossfader(this, numCases, startingCase);
};

exports["default"] = Crossfader;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],33:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var _mixinsConnectionsEs6 = require("../mixins/connections.es6");

var _mixinsConnectionsEs62 = _interopRequireDefault(_mixinsConnectionsEs6);

var _mixinsCleanersEs6 = require("../mixins/cleaners.es6");

var _mixinsCleanersEs62 = _interopRequireDefault(_mixinsCleanersEs6);

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// This function creates a graph that allows morphing
// between two gain nodes.
//
// It looks a little bit like this:
//
//                 dry -> ---------------------------------------------> |
//                            |                                             v
//                            v  Gain(0-1)    ->     Gain(-1)     ->     output
//                               (fader)         (invert phase)        (summing)
//                            ^
//    wet ->   Gain(-1)   -> -|
//          (invert phase)
//
// When adjusting the fader's gain value in this graph,
// input1's gain level will change from 0 to 1,
// whilst input2's gain level will change from 1 to 0.

var DryWetNode = (function (_Node) {
    _inherits(DryWetNode, _Node);

    function DryWetNode(io) {
        _classCallCheck(this, DryWetNode);

        _Node.call(this, io, 2, 1);

        this.dry = this.inputs[0];
        this.wet = this.inputs[1];

        // Invert wet signal's phase
        this.wetInputInvert = this.context.createGain();
        this.wetInputInvert.gain.value = -1;
        this.wet.connect(this.wetInputInvert);

        // Create the fader node
        this.fader = this.context.createGain();
        this.fader.gain.value = 0;

        // Create the control node. It sets the fader's value.
        this.dryWetControl = this.io.createParam();
        this.dryWetControl.connect(this.fader.gain);

        // Invert the fader node's phase
        this.faderInvert = this.context.createGain();
        this.faderInvert.gain.value = -1;

        // Connect fader to fader phase inversion,
        // and fader phase inversion to output.
        this.wetInputInvert.connect(this.fader);
        this.fader.connect(this.faderInvert);
        this.faderInvert.connect(this.outputs[0]);

        // Connect dry input to both the output and the fader node
        this.dry.connect(this.outputs[0]);
        this.dry.connect(this.fader);

        // Add a 'dryWet' property to the controls object.
        this.controls.dryWet = this.dryWetControl;
    }

    return DryWetNode;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createDryWetNode = function () {
    return new DryWetNode(this);
};

exports["default"] = DryWetNode;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"../core/Node.es6":4,"../mixins/cleaners.es6":83,"../mixins/connections.es6":84,"../mixins/setIO.es6":90}],34:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var EQShelf = (function (_Node) {
    _inherits(EQShelf, _Node);

    function EQShelf(io) {
        var highFrequency = arguments.length <= 1 || arguments[1] === undefined ? 2500 : arguments[1];
        var lowFrequency = arguments.length <= 2 || arguments[2] === undefined ? 350 : arguments[2];
        var highBoost = arguments.length <= 3 || arguments[3] === undefined ? -6 : arguments[3];
        var lowBoost = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];

        _classCallCheck(this, EQShelf);

        _Node.call(this, io, 1, 1);

        this.highFrequency = this.io.createParam(highFrequency);
        this.lowFrequency = this.io.createParam(lowFrequency);
        this.highBoost = this.io.createParam(highBoost);
        this.lowBoost = this.io.createParam(lowBoost);

        this.lowShelf = this.context.createBiquadFilter();
        this.lowShelf.type = 'lowshelf';
        this.lowShelf.frequency.value = lowFrequency;
        this.lowShelf.gain.value = lowBoost;

        this.highShelf = this.context.createBiquadFilter();
        this.highShelf.type = 'highshelf';
        this.highShelf.frequency.value = highFrequency;
        this.highShelf.gain.value = highBoost;

        this.inputs[0].connect(this.lowShelf);
        this.inputs[0].connect(this.highShelf);
        this.lowShelf.connect(this.outputs[0]);
        this.highShelf.connect(this.outputs[0]);

        // Store controllable params.
        //
        // TODO:
        //  - Should these be references to param.control? This
        //    might allow defaults to be set whilst also allowing
        //    audio signal control.
        this.controls.highFrequency = this.highFrequency;
        this.controls.lowFrequency = this.lowFrequency;
        this.controls.highBoost = this.highBoost;
        this.controls.lowBoost = this.lowBoost;
    }

    return EQShelf;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createEQShelf = function (highFrequency, lowFrequency, highBoost, lowBoost) {
    return new EQShelf(this, highFrequency, lowFrequency, highBoost, lowBoost);
};

exports["default"] = EQShelf;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],35:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var PhaseOffset = (function (_Node) {
    _inherits(PhaseOffset, _Node);

    function PhaseOffset(io) {
        _classCallCheck(this, PhaseOffset);

        _Node.call(this, io, 1, 1);

        this.reciprocal = this.io.createReciprocal(this.context.sampleRate * 0.5);
        this.delay = this.context.createDelay();
        this.multiply = this.io.createMultiply();
        this.frequency = this.io.createParam();
        this.phase = this.io.createParam();
        this.halfPhase = this.io.createMultiply(0.5);

        this.delay.delayTime.value = 0;

        this.frequency.connect(this.reciprocal);
        this.reciprocal.connect(this.multiply, 0, 0);
        this.phase.connect(this.halfPhase);
        this.halfPhase.connect(this.multiply, 0, 1);
        this.multiply.connect(this.delay.delayTime);

        // Should this be connected!? If it is, then it's
        // creating, eg. PWM if a square wave is inputted,
        // since raw input is being blended with phase-offsetted
        // input.
        this.inputs[0].connect(this.outputs[0]);

        this.inputs[0].connect(this.delay);
        this.delay.connect(this.outputs[0]);

        this.outputs[0].gain.value = 0.5;

        // Store controllable params.
        this.controls.frequency = this.frequency;
        this.controls.phase = this.phase;
    }

    return PhaseOffset;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createPhaseOffset = function () {
    return new PhaseOffset(this);
};

exports["default"] = PhaseOffset;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],36:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// import _setIO from "../mixins/setIO.es6";

var _mixinsMathEs6 = require("../mixins/math.es6");

var _mixinsMathEs62 = _interopRequireDefault(_mixinsMathEs6);

// import Note from "../note/Note.es6";
// import Chord from "../note/Chord.es6";

//  Player
//  ======
//  Takes care of requesting GeneratorNodes be created.
//
//  Has:
//      - Polyphony (param)
//      - Unison (param)
//      - Unison detune (param)
//      - Unison phase (param)
//      - Glide mode
//      - Glide time
//      - Velocity sensitivity (param)
//      - Global tuning (param)
//
//  Methods:
//      - start( freq/note, vel, delay )
//      - stop( freq/note, vel, delay )
//
//  Properties:
//      - polyphony (number, >1)
//      - unison (number, >1)
//      - unisonDetune (number, cents)
//      - unisonPhase (number, 0-1)
//      - glideMode (string)
//      - glideTime (ms, number)
//      - velocitySensitivity (0-1, number)
//      - tuning (-64, +64, semitones)
//

var GeneratorPlayer = (function (_Node) {
    _inherits(GeneratorPlayer, _Node);

    function GeneratorPlayer(io, options) {
        _classCallCheck(this, GeneratorPlayer);

        _Node.call(this, io, 0, 1);

        if (options.generator === undefined) {
            throw new Error('GeneratorPlayer requires a `generator` option to be given.');
        }

        this.generator = options.generator;

        this.polyphony = this.io.createParam(options.polyphony || 1);

        this.unison = this.io.createParam(options.unison || 1);
        this.unisonDetune = this.io.createParam(typeof options.unisonDetune === 'number' ? options.unisonDetune : 0);
        this.unisonPhase = this.io.createParam(typeof options.unisonPhase === 'number' ? options.unisonPhase : 0);
        this.unisonMode = options.unisonMode || 'centered';

        this.glideMode = options.glideMode || 'equal';
        this.glideTime = this.io.createParam(typeof options.glideTime === 'number' ? options.glideTime : 0);

        this.velocitySensitivity = this.io.createParam(typeof options.velocitySensitivity === 'number' ? options.velocitySensitivity : 0);

        this.tuning = this.io.createParam(typeof options.tuning === 'number' ? options.tuning : 0);

        this.waveform = options.waveform || 'sine';

        this.envelope = options.envelope || this.io.createADSREnvelope();

        this.activeGeneratorObjects = {};
        this.activeGeneratorObjectsFlat = [];
        this.timers = [];
    }

    // AudioIO.mixinSingle( GeneratorPlayer.prototype, _setIO, '_setIO' );

    GeneratorPlayer.prototype._createGeneratorObject = function _createGeneratorObject(frequency, detune, velocity, glideTime, waveform) {
        return this.generator.call(this.io, frequency, detune + this.tuning.value * 100, velocity, glideTime, waveform);
    };

    /**
     * Calculates the amount of detune (cents) to apply to a generator node
     * given an index between 0 and this.unison.value
     *
     * @param  {Number} unisonIndex Unison index.
     * @return {Number}             Detune value, in cents.
     */

    GeneratorPlayer.prototype._calculateDetune = function _calculateDetune(unisonIndex) {
        var detune = 0.0,
            unisonDetune = this.unisonDetune.value;

        if (this.unisonMode === 'centered') {
            var incr = unisonDetune;

            detune = incr * unisonIndex;
            detune -= incr * (this.unison.value * 0.5);
            detune += incr * 0.5;
        } else {
            var multiplier;

            // Leave the first note in the unison
            // alone, so it's detune value is the root
            // note.
            if (unisonIndex > 0) {
                // Hop down negative half the unisonIndex
                if (unisonIndex % 2 === 0) {
                    multiplier = -unisonIndex * 0.5;
                } else {
                    // Hop up n cents
                    if (unisonIndex > 1) {
                        unisonIndex = this.Math.roundToMultiple(unisonIndex, 2) - 2;
                    }

                    multiplier = unisonIndex;
                }

                // Now that we have the multiplier, calculate the detune value
                // for the given unisonIndex.
                detune = unisonDetune * multiplier;
            }
        }

        return detune;
    };

    GeneratorPlayer.prototype._calculateGlideTime = function _calculateGlideTime(oldFreq, newFreq) {
        var mode = this.glideMode,
            time = this.glideTime.value,
            glideTime,
            freqDifference;

        if (time === 0.0) {
            glideTime = 0.0;
        }

        if (mode === 'equal') {
            glideTime = time * 0.001;
        } else {
            freqDifference = Math.abs(oldFreq - newFreq);
            freqDifference = this.Math.clamp(freqDifference, 0, 500);
            glideTime = this.Math.scaleNumberExp(freqDifference, 0, 500, 0, time) * 0.001;
        }

        return glideTime;
    };

    GeneratorPlayer.prototype._storeGeneratorObject = function _storeGeneratorObject(frequency, generatorObject) {
        var objects = this.activeGeneratorObjects;

        objects[frequency] = objects[frequency] || [];
        objects[frequency].unshift(generatorObject);
        this.activeGeneratorObjectsFlat.unshift(generatorObject);
    };

    GeneratorPlayer.prototype._fetchGeneratorObject = function _fetchGeneratorObject(frequency) {
        var objects = this.activeGeneratorObjects[frequency],
            index = 0;

        if (!objects || objects.length === 0) {
            return null;
        }

        this.activeGeneratorObjectsFlat.pop();
        return objects.pop();
    };

    GeneratorPlayer.prototype._fetchGeneratorObjectToReuse = function _fetchGeneratorObjectToReuse() {
        var generator = this.activeGeneratorObjectsFlat.pop(),
            frequency;

        console.log('reuse', generator);

        if (Array.isArray(generator)) {
            frequency = generator[0].frequency;

            for (var i = 0; i < generator.length; ++i) {
                this.envelope.forceStop(generator[i].outputs[0].gain);
                clearTimeout(generator[i].timer);
            }
        } else {
            frequency = generator.frequency;
            this.envelope.forceStop(generator.outputs[0].gain);
            clearTimeout(generator.timer);
        }

        this.activeGeneratorObjects[frequency].pop();

        return generator;
    };

    GeneratorPlayer.prototype._startGeneratorObject = function _startGeneratorObject(generatorObject, delay) {
        generatorObject.outputs[0].connect(this.outputs[0]);
        this.envelope.start(generatorObject.outputs[0].gain, delay);
        generatorObject.start(delay);
    };

    GeneratorPlayer.prototype._startSingle = function _startSingle(frequency, velocity, delay) {
        var unison = this.unison.value,
            detune = 0.0,
            unisonGeneratorArray,
            generatorObject,
            activeGeneratorCount = this.activeGeneratorObjectsFlat.length,
            existingFrequency,
            glideTime = 0.0;

        if (activeGeneratorCount < this.polyphony.value) {
            if (unison === 1.0) {
                generatorObject = this._createGeneratorObject(frequency, detune, velocity, glideTime, this.waveform);
                this._startGeneratorObject(generatorObject, delay);
                this._storeGeneratorObject(frequency, generatorObject);
            } else {
                unisonGeneratorArray = [];

                for (var i = 0; i < unison; ++i) {
                    detune = this._calculateDetune(i);
                    generatorObject = this._createGeneratorObject(frequency, detune, velocity, glideTime, this.waveform);
                    this._startGeneratorObject(generatorObject, delay);
                    unisonGeneratorArray.push(generatorObject);
                }

                this._storeGeneratorObject(frequency, unisonGeneratorArray);
            }
        } else {
            if (unison === 1.0) {
                generatorObject = this._fetchGeneratorObjectToReuse();
                existingFrequency = generatorObject.frequency;
                glideTime = this._calculateGlideTime(existingFrequency, frequency);

                generatorObject.reset(frequency, detune + this.tuning.value * 100, velocity, glideTime);
                this._storeGeneratorObject(frequency, generatorObject);
            } else {
                generatorObject = this._fetchGeneratorObjectToReuse();
                existingFrequency = generatorObject[0].frequency;
                glideTime = this._calculateGlideTime(existingFrequency, frequency);

                for (var i = 0; i < unison; ++i) {
                    detune = this._calculateDetune(i);
                    generatorObject[i].reset(frequency, detune + this.tuning.value * 100, velocity, glideTime);
                }

                this._storeGeneratorObject(frequency, generatorObject);
            }
        }

        // Return the generated object(s) in case they're needed.
        return unisonGeneratorArray ? unisonGeneratorArray : generatorObject;
    };

    GeneratorPlayer.prototype.start = function start(frequency, velocity, delay) {
        var freq = 0,
            velocitySensitivity = this.velocitySensitivity.value;

        velocity = typeof velocity === 'number' ? velocity : 1;
        delay = typeof delay === 'number' ? delay : 0;

        if (velocitySensitivity !== 0) {
            velocity = this.Math.scaleNumber(velocity, 0, 1, 0.5 - velocitySensitivity * 0.5, 0.5 + velocitySensitivity * 0.5);
        } else {
            velocity = 0.5;
        }

        if (typeof frequency === 'number') {
            this._startSingle(frequency, velocity, delay);
        }
        // else if ( frequency instanceof Note ) {
        //     freq = frequency.valueHz;
        //     this._startSingle( freq, velocity, delay );
        // }
        // else if ( frequency instanceof Chord ) {
        //     for ( var i = 0; i < frequency.notes.length; ++i ) {
        //         freq = frequency.notes[ i ].valueHz;
        //         this._startSingle( freq, velocity, delay );
        //     }
        // }

        return this;
    };

    GeneratorPlayer.prototype._stopGeneratorObject = function _stopGeneratorObject(generatorObject, delay) {
        var self = this;

        this.envelope.stop(generatorObject.outputs[0].gain, delay);

        generatorObject.timer = setTimeout(function () {
            // self.activeGeneratorObjectsFlat.pop();
            generatorObject.stop(delay);
            generatorObject.cleanUp();
            generatorObject = null;
        }, delay * 1000 + this.envelope.totalStopTime * 1000 + 100);
    };

    GeneratorPlayer.prototype._stopSingle = function _stopSingle(frequency, velocity, delay) {
        var generatorObject = this._fetchGeneratorObject(frequency);

        if (generatorObject) {
            // Stop generators formed when unison was > 1 at time of start(...)
            if (Array.isArray(generatorObject)) {
                for (var i = generatorObject.length - 1; i >= 0; --i) {
                    this._stopGeneratorObject(generatorObject[i], delay);
                }
            } else {
                this._stopGeneratorObject(generatorObject, delay);
            }
        }

        generatorObject = null;
    };

    GeneratorPlayer.prototype.stop = function stop(frequency, velocity, delay) {
        velocity = typeof velocity === 'number' ? velocity : 0;
        delay = typeof delay === 'number' ? delay : 0;

        if (typeof frequency === 'number') {
            this._stopSingle(frequency, velocity, delay);
        }
        // else if ( frequency instanceof Note ) {
        //     freq = frequency.valueHz;
        //     this._stopSingle( freq, velocity, delay );
        // }
        // else if ( frequency instanceof Chord ) {
        //     for ( var i = 0; i < frequency.notes.length; ++i ) {
        //         freq = frequency.notes[ i ].valueHz;
        //         this._stopSingle( freq, velocity, delay );
        //     }
        // }

        return this;
    };

    return GeneratorPlayer;
})(_coreNodeEs62["default"]);

GeneratorPlayer.prototype.Math = _mixinsMathEs62["default"];

AudioIO.prototype.createGeneratorPlayer = function (options) {
    return new GeneratorPlayer(this, options);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4,"../mixins/math.es6":86}],37:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// Core components.

var _coreAudioIOEs6 = require('./core/AudioIO.es6');

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require('./core/Node.es6');

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var _coreParamEs6 = require('./core/Param.es6');

var _coreParamEs62 = _interopRequireDefault(_coreParamEs6);

require('./core/WaveShaper.es6');

// FX.

require('./fx/delay/Delay.es6');

require('./fx/delay/PingPongDelay.es6');

require('./fx/delay/StereoDelay.es6');

require('./fx/eq/CustomEQ.es6');

// import './fx/BitReduction.es6';

require('./fx/SchroederAllPass.es6');

require('./fx/filters/FilterBank.es6');

require('./fx/filters/LPFilter.es6');

require('./fx/filters/BPFilter.es6');

require('./fx/filters/HPFilter.es6');

require('./fx/filters/NotchFilter.es6');

require('./fx/filters/AllPassFilter.es6');

require('./fx/saturation/SineShaper.es6');

require('./fx/utility/DCTrap.es6');

require('./fx/utility/LFO.es6');

require('./fx/utility/StereoWidth.es6');

require('./fx/utility/StereoRotation.es6');

// Generators and instruments.

require('./generators/OscillatorGenerator.es6');

require('./instruments/GeneratorPlayer.es6');

// Math: Trigonometry

require('./math/trigonometry/DegToRad.es6');

require('./math/trigonometry/Sin.es6');

require('./math/trigonometry/Cos.es6');

require('./math/trigonometry/Tan.es6');

require('./math/trigonometry/RadToDeg.es6');

// Math: Relational-operators (inc. if/else)

require('./math/relational-operators/EqualTo.es6');

require('./math/relational-operators/EqualToZero.es6');

require('./math/relational-operators/GreaterThan.es6');

require('./math/relational-operators/GreaterThanZero.es6');

require('./math/relational-operators/GreaterThanEqualTo.es6');

require('./math/relational-operators/IfElse.es6');

require('./math/relational-operators/LessThan.es6');

require('./math/relational-operators/LessThanZero.es6');

require('./math/relational-operators/LessThanEqualTo.es6');

// Math: Logical operators

require('./math/logical-operators/LogicalOperator.es6');

require('./math/logical-operators/AND.es6');

require('./math/logical-operators/OR.es6');

require('./math/logical-operators/NOT.es6');

require('./math/logical-operators/NAND.es6');

require('./math/logical-operators/NOR.es6');

require('./math/logical-operators/XOR.es6');

// Math: General.

require('./math/Abs.es6');

require('./math/Add.es6');

require('./math/Average.es6');

require('./math/Clamp.es6');

require('./math/Constant.es6');

require('./math/Divide.es6');

require('./math/Floor.es6');

require('./math/Max.es6');

require('./math/Min.es6');

require('./math/Multiply.es6');

require('./math/Negate.es6');

require('./math/Pow.es6');

require('./math/Reciprocal.es6');

require('./math/Round.es6');

require('./math/Scale.es6');

require('./math/ScaleExp.es6');

require('./math/Sign.es6');

require('./math/Sqrt.es6');

require('./math/Subtract.es6');

require('./math/Switch.es6');

require('./math/Square.es6');

// Math: Special.

require('./math/Lerp.es6');

require('./math/SampleDelay.es6');

// Envelopes

require('./envelopes/CustomEnvelope.es6');

require('./envelopes/ADSREnvelope.es6');

require('./envelopes/ADEnvelope.es6');

require('./envelopes/ADBDSREnvelope.es6');

// General graphs

require('./graphs/EQShelf.es6');

require('./graphs/Counter.es6');

require('./graphs/DryWetNode.es6');

require('./graphs/PhaseOffset.es6');

require('./graphs/Crossfader.es6');

// Oscillators: Using WebAudio oscillators

require('./oscillators/OscillatorBank.es6');

require('./oscillators/NoiseOscillatorBank.es6');

require('./oscillators/FMOscillator.es6');

require('./oscillators/SineBank.es6');

// Oscillators: Buffer-based

require('./oscillators/BufferOscillator.es6');

// Utils

require('./buffers/BufferGenerators.es6');

require('./buffers/BufferUtils.es6');

require('./utilities/Utils.es6');

// import './graphs/Sketch.es6';

window.AudioContext = window.AudioContext || window.webkitAudioContext;window.Param = _coreParamEs62['default'];
window.Node = _coreNodeEs62['default'];

},{"./buffers/BufferGenerators.es6":1,"./buffers/BufferUtils.es6":2,"./core/AudioIO.es6":3,"./core/Node.es6":4,"./core/Param.es6":5,"./core/WaveShaper.es6":6,"./envelopes/ADBDSREnvelope.es6":10,"./envelopes/ADEnvelope.es6":11,"./envelopes/ADSREnvelope.es6":12,"./envelopes/CustomEnvelope.es6":13,"./fx/SchroederAllPass.es6":14,"./fx/delay/Delay.es6":15,"./fx/delay/PingPongDelay.es6":16,"./fx/delay/StereoDelay.es6":17,"./fx/eq/CustomEQ.es6":18,"./fx/filters/AllPassFilter.es6":19,"./fx/filters/BPFilter.es6":20,"./fx/filters/FilterBank.es6":21,"./fx/filters/HPFilter.es6":22,"./fx/filters/LPFilter.es6":23,"./fx/filters/NotchFilter.es6":24,"./fx/saturation/SineShaper.es6":25,"./fx/utility/DCTrap.es6":26,"./fx/utility/LFO.es6":27,"./fx/utility/StereoRotation.es6":28,"./fx/utility/StereoWidth.es6":29,"./generators/OscillatorGenerator.es6":30,"./graphs/Counter.es6":31,"./graphs/Crossfader.es6":32,"./graphs/DryWetNode.es6":33,"./graphs/EQShelf.es6":34,"./graphs/PhaseOffset.es6":35,"./instruments/GeneratorPlayer.es6":36,"./math/Abs.es6":38,"./math/Add.es6":39,"./math/Average.es6":40,"./math/Clamp.es6":41,"./math/Constant.es6":42,"./math/Divide.es6":43,"./math/Floor.es6":44,"./math/Lerp.es6":45,"./math/Max.es6":46,"./math/Min.es6":47,"./math/Multiply.es6":48,"./math/Negate.es6":49,"./math/Pow.es6":50,"./math/Reciprocal.es6":51,"./math/Round.es6":52,"./math/SampleDelay.es6":53,"./math/Scale.es6":54,"./math/ScaleExp.es6":55,"./math/Sign.es6":56,"./math/Sqrt.es6":57,"./math/Square.es6":58,"./math/Subtract.es6":59,"./math/Switch.es6":60,"./math/logical-operators/AND.es6":61,"./math/logical-operators/LogicalOperator.es6":62,"./math/logical-operators/NAND.es6":63,"./math/logical-operators/NOR.es6":64,"./math/logical-operators/NOT.es6":65,"./math/logical-operators/OR.es6":66,"./math/logical-operators/XOR.es6":67,"./math/relational-operators/EqualTo.es6":68,"./math/relational-operators/EqualToZero.es6":69,"./math/relational-operators/GreaterThan.es6":70,"./math/relational-operators/GreaterThanEqualTo.es6":71,"./math/relational-operators/GreaterThanZero.es6":72,"./math/relational-operators/IfElse.es6":73,"./math/relational-operators/LessThan.es6":74,"./math/relational-operators/LessThanEqualTo.es6":75,"./math/relational-operators/LessThanZero.es6":76,"./math/trigonometry/Cos.es6":77,"./math/trigonometry/DegToRad.es6":78,"./math/trigonometry/RadToDeg.es6":79,"./math/trigonometry/Sin.es6":80,"./math/trigonometry/Tan.es6":81,"./oscillators/BufferOscillator.es6":91,"./oscillators/FMOscillator.es6":92,"./oscillators/NoiseOscillatorBank.es6":93,"./oscillators/OscillatorBank.es6":94,"./oscillators/SineBank.es6":95,"./utilities/Utils.es6":96}],38:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var SHAPERS = {};

function generateShaperCurve(size) {
    var array = new Float32Array(size),
        i = 0,
        x = 0;

    for (i; i < size; ++i) {
        x = i / size * 2 - 1;
        array[i] = Math.abs(x);
    }

    return array;
}

var Abs = (function (_Node) {
    _inherits(Abs, _Node);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function Abs(io) {
        var accuracy = arguments.length <= 1 || arguments[1] === undefined ? 10 : arguments[1];

        _classCallCheck(this, Abs);

        _Node.call(this, io, 1, 1);

        // var gainAccuracy = accuracy * 100;
        var gainAccuracy = Math.pow(accuracy, 2),
            graph = this.getGraph(),
            size = 1024 * accuracy;

        this.inputs[0].gain.value = 1 / gainAccuracy;
        this.outputs[0].gain.value = gainAccuracy;

        // To save creating new shaper curves (that can be quite large!)
        // each time an instance of Abs is created, shaper curves
        // are stored in the SHAPERS object above. The keys to the
        // SHAPERS object are the base wavetable curve size (1024)
        // multiplied by the accuracy argument.
        if (!SHAPERS[size]) {
            SHAPERS[size] = generateShaperCurve(size);
        }

        graph.shaper = this.io.createWaveShaper(SHAPERS[size]);

        this.inputs[0].connect(graph.shaper);
        graph.shaper.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return Abs;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createAbs = function (accuracy) {
    return new Abs(this, accuracy);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],39:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * Adds two audio signals together.
 * @param {Object} io Instance of AudioIO.
 *
 * var add = io.createAdd( 2 );
 * in1.connect( add );
 *
 * var add = io.createAdd();
 * in1.connect( add, 0, 0 );
 * in2.connect( add, 0, 1 );
 */

var Add = (function (_Node) {
    _inherits(Add, _Node);

    function Add(io, value) {
        _classCallCheck(this, Add);

        _Node.call(this, io, 1, 1);

        this.inputs[1] = this.io.createParam(value);

        this.inputs[0].connect(this.outputs[0]);
        this.inputs[1].connect(this.outputs[0]);

        // Store controllable params.
        this.controls.value = this.inputs[1];
    }

    _createClass(Add, [{
        key: "value",
        get: function get() {
            return this.controls.value.value;
        },
        set: function set(value) {
            this.controls.value.value = value;
        }
    }]);

    return Add;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createAdd = function (value) {
    return new Add(this, value);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],40:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/*
    The average value of a signal is calculated
    by piping the input into a rectifier then into
    a series of DelayNodes. Each DelayNode
    has it's `delayTime` controlled by either the
    `sampleSize` argument or the incoming value of
    the `controls.sampleSize` node. The delayTime
    is therefore measured in samples.

    Each delay is connected to a GainNode that works
    as a summing node. The summing node's value is
    then divided by the number of delays used before
    being sent on its merry way to the output.

    Note:
    High values for `numSamples` will be expensive,
    as that many DelayNodes will be created. Consider
    increasing the `sampleSize` and using a low value
    for `numSamples`.

    Graph:
    ======
    input ->
        abs/rectify ->
            `numSamples` number of delays, in series ->
                sum ->
                    divide by `numSamples` ->
                        output.
 */

var Average = (function (_Node) {
    _inherits(Average, _Node);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function Average(io, numSamples, sampleSize) {
        if (numSamples === undefined) numSamples = 10;

        _classCallCheck(this, Average);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.numSamples = numSamples;

        // All DelayNodes will be stored here.
        graph.delays = [];
        graph.abs = this.io.createAbs();
        this.inputs[0].connect(graph.abs);
        graph.sampleSize = this.io.createConstant(1 / this.context.sampleRate);
        graph.multiply = this.io.createMultiply();
        this.controls.sampleSize = this.io.createParam(sampleSize);
        graph.sampleSize.connect(graph.multiply, 0, 0);
        this.controls.sampleSize.connect(graph.multiply, 0, 1);

        // This is a relatively expensive calculation
        // when compared to doing a much simpler reciprocal multiply.
        // this.divide = this.io.createDivide( numSamples, this.context.sampleRate * 0.5 );

        // Avoid the more expensive division above by
        // multiplying the sum by the reciprocal of numSamples.
        graph.divide = this.io.createMultiply(1 / numSamples);
        graph.sum = this.context.createGain();

        graph.sum.connect(graph.divide);
        graph.divide.connect(this.outputs[0]);

        this.setGraph(graph);

        // Trigger the setter for `numSamples` that will create
        // the delay series.
        this.numSamples = graph.numSamples;
    }

    _createClass(Average, [{
        key: "numSamples",
        get: function get() {
            return this.getGraph().numSamples;
        },
        set: function set(numSamples) {
            var graph = this.getGraph(),
                delays = graph.delays;

            // Disconnect and nullify any existing delay nodes.
            this._cleanUpSingle(delays);

            graph.numSamples = numSamples;
            graph.divide.value = 1 / numSamples;

            for (var i = 0, node = graph.abs; i < numSamples; ++i) {
                var delay = this.context.createDelay();
                delay.delayTime.value = 0;
                graph.multiply.connect(delay.delayTime);
                node.connect(delay);
                delay.connect(graph.sum);
                graph.delays.push(delay);
                node = delay;
            }

            this.setGraph(graph);
        }
    }]);

    return Average;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createAverage = function (numSamples, sampleSize) {
    return new Average(this, numSamples, sampleSize);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],41:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Clamp = (function (_Node) {
    _inherits(Clamp, _Node);

    function Clamp(io, minValue, maxValue) {
        _classCallCheck(this, Clamp);

        _Node.call(this, io, 1, 1); // io, 1, 1

        var graph = this.getGraph();

        graph.min = this.io.createMin(maxValue);
        graph.max = this.io.createMax(minValue);

        // this.inputs = [ graph.min ];
        // this.outputs = [ graph.max ];
        this.inputs[0].connect(graph.min);
        graph.min.connect(graph.max);
        graph.max.connect(this.outputs[0]);

        // Store controllable params.
        this.controls.min = graph.min.controls.value;
        this.controls.max = graph.max.controls.value;

        this.setGraph(graph);
    }

    _createClass(Clamp, [{
        key: "min",
        get: function get() {
            return this.getGraph().max.value;
        },
        set: function set(value) {
            this.getGraph().max.value = value;
        }
    }, {
        key: "max",
        get: function get() {
            return this.getGraph().min.value;
        },
        set: function set(value) {
            this.getGraph().min.value = value;
        }
    }]);

    return Clamp;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createClamp = function (minValue, maxValue) {
    return new Clamp(this, minValue, maxValue);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],42:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require('../core/AudioIO.es6');

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require('../core/Node.es6');

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Constant = (function (_Node) {
    _inherits(Constant, _Node);

    /**
     * A constant-rate audio signal
     * @param {Object} io    Instance of AudioIO
     * @param {Number} value Value of the constant
     */

    function Constant(io) {
        var value = arguments.length <= 1 || arguments[1] === undefined ? 0.0 : arguments[1];

        _classCallCheck(this, Constant);

        _Node.call(this, io, 0, 1);

        this.outputs[0].gain.value = typeof value === 'number' ? value : 0;
        this.io.constantDriver.connect(this.outputs[0]);
    }

    _createClass(Constant, [{
        key: 'value',
        get: function get() {
            return this.outputs[0].gain.value;
        },
        set: function set(value) {
            this.outputs[0].gain.value = value;
        }
    }]);

    return Constant;
})(_coreNodeEs62['default']);

_coreAudioIOEs62['default'].prototype.createConstant = function (value) {
    return new Constant(this, value);
};

// A bunch of preset constants.
(function () {
    var E, PI, PI2, LN10, LN2, LOG10E, LOG2E, SQRT1_2, SQRT2;

    _coreAudioIOEs62['default'].prototype.createConstantE = function () {
        var c = E || this.createConstant(Math.E);
        E = c;
        return c;
    };

    _coreAudioIOEs62['default'].prototype.createConstantPI = function () {
        var c = PI || this.createConstant(Math.PI);
        PI = c;
        return c;
    };

    _coreAudioIOEs62['default'].prototype.createConstantPI2 = function () {
        var c = PI2 || this.createConstant(Math.PI * 2);
        PI2 = c;
        return c;
    };

    _coreAudioIOEs62['default'].prototype.createConstantLN10 = function () {
        var c = LN10 || this.createConstant(Math.LN10);
        LN10 = c;
        return c;
    };

    _coreAudioIOEs62['default'].prototype.createConstantLN2 = function () {
        var c = LN2 || this.createConstant(Math.LN2);
        LN2 = c;
        return c;
    };

    _coreAudioIOEs62['default'].prototype.createConstantLOG10E = function () {
        var c = LOG10E || this.createConstant(Math.LOG10E);
        LOG10E = c;
        return c;
    };

    _coreAudioIOEs62['default'].prototype.createConstantLOG2E = function () {
        var c = LOG2E || this.createConstant(Math.LOG2E);
        LOG2E = c;
        return c;
    };

    _coreAudioIOEs62['default'].prototype.createConstantSQRT1_2 = function () {
        var c = SQRT1_2 || this.createConstant(Math.SQRT1_2);
        SQRT1_2 = c;
        return c;
    };

    _coreAudioIOEs62['default'].prototype.createConstantSQRT2 = function () {
        var c = SQRT2 || this.createConstant(Math.SQRT2);
        SQRT2 = c;
        return c;
    };
})();

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],43:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * Divides two numbers
 * @param {Object} io Instance of AudioIO.
 */

var Divide = (function (_Node) {
    _inherits(Divide, _Node);

    function Divide(io, value, maxInput) {
        _classCallCheck(this, Divide);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        this.inputs[1] = this.io.createParam(value);
        this.outputs[0].gain.value = 0.0;

        graph.reciprocal = this.io.createReciprocal(maxInput);
        this.inputs[1].connect(graph.reciprocal);

        this.inputs[0].connect(this.outputs[0]);
        graph.reciprocal.connect(this.outputs[0].gain);

        this.controls.divisor = this.inputs[1];

        this.setGraph(graph);
    }

    _createClass(Divide, [{
        key: "value",
        get: function get() {
            return this.inputs[1].value;
        },
        set: function set(value) {
            this.inputs[1].value = value;
        }
    }, {
        key: "maxInput",
        get: function get() {
            return this.reciprocal.maxInput;
        },
        set: function set(value) {
            this.reciprocal.maxInput = value;
        }
    }]);

    return Divide;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createDivide = function (value, maxInput) {
    return new Divide(this, value, maxInput);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],44:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// NOTE:
//  Only accepts values >= -1 && <= 1. Values outside
//  this range are clamped to this range.

var Floor = (function (_Node) {
    _inherits(Floor, _Node);

    function Floor(io) {
        _classCallCheck(this, Floor);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.shaper = this.io.createWaveShaper(this.io.curves.Floor);

        // This branching is because inputting `0` values
        // into the waveshaper above outputs -0.5 ;(
        graph.ifElse = this.io.createIfElse();
        graph.equalToZero = this.io.createEqualToZero();

        this.inputs[0].connect(graph.equalToZero);
        graph.equalToZero.connect(graph.ifElse["if"]);
        this.inputs[0].connect(graph.ifElse.then);
        graph.shaper.connect(graph.ifElse["else"]);

        this.inputs[0].connect(graph.shaper);
        graph.ifElse.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return Floor;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createFloor = function () {
    return new Floor(this);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],45:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Lerp = (function (_Node) {
    _inherits(Lerp, _Node);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function Lerp(io, start, end, delta) {
        _classCallCheck(this, Lerp);

        _Node.call(this, io, 3, 1);

        var graph = this.getGraph();

        graph.add = this.io.createAdd();
        graph.subtract = this.io.createSubtract();
        graph.multiply = this.io.createMultiply();

        graph.start = this.io.createParam(start);
        graph.end = this.io.createParam(end);
        graph.delta = this.io.createParam(delta);

        graph.end.connect(graph.subtract, 0, 0);
        graph.start.connect(graph.subtract, 0, 1);
        graph.subtract.connect(graph.multiply, 0, 0);
        graph.delta.connect(graph.multiply, 0, 1);

        graph.start.connect(graph.add, 0, 0);
        graph.multiply.connect(graph.add, 0, 1);

        graph.add.connect(this.outputs[0]);

        this.inputs[0].connect(graph.start);
        this.inputs[1].connect(graph.end);
        this.inputs[2].connect(graph.delta);

        this.controls.start = graph.start;
        this.controls.end = graph.end;
        this.controls.delta = graph.delta;

        this.setGraph(graph);
    }

    _createClass(Lerp, [{
        key: "start",
        get: function get() {
            return this.getGraph().start.value;
        },
        set: function set(value) {
            this.getGraph().start.value = value;
        }
    }, {
        key: "end",
        get: function get() {
            return this.getGraph().end.value;
        },
        set: function set(value) {
            this.getGraph().end.value = value;
        }
    }, {
        key: "delta",
        get: function get() {
            return this.getGraph().delta.value;
        },
        set: function set(value) {
            this.getGraph().delta.value = value;
        }
    }]);

    return Lerp;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createLerp = function (start, end, delta) {
    return new Lerp(this);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],46:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * When input is < `value`, outputs `value`, otherwise outputs input.
 * @param {AudioIO} io   AudioIO instance
 * @param {Number} value The minimum value to test against.
 */

var Max = (function (_Node) {
    _inherits(Max, _Node);

    function Max(io, value) {
        _classCallCheck(this, Max);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.greaterThan = this.io.createGreaterThan();
        graph["switch"] = this.io.createSwitch(2, 0);

        this.controls.value = this.inputs[1] = this.io.createParam(value);
        this.inputs[1].connect(graph.greaterThan);
        this.inputs[0].connect(graph.greaterThan.controls.value);

        this.inputs[0].connect(graph["switch"].inputs[0]);
        this.inputs[1].connect(graph["switch"].inputs[1]);
        graph.greaterThan.connect(graph["switch"].control);
        graph["switch"].connect(this.outputs[0]);

        this.setGraph(graph);
    }

    _createClass(Max, [{
        key: "value",
        get: function get() {
            return this.controls.value.value;
        },
        set: function set(value) {
            this.controls.value.value = value;
        }
    }]);

    return Max;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createMax = function (value) {
    return new Max(this, value);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],47:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * When input is > `value`, outputs `value`, otherwise outputs input.
 * @param {AudioIO} io   AudioIO instance
 * @param {Number} value The minimum value to test against.
 */

var Min = (function (_Node) {
    _inherits(Min, _Node);

    function Min(io, value) {
        _classCallCheck(this, Min);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.lessThan = this.io.createLessThan();
        this.controls.value = this.inputs[1] = this.io.createParam(value);
        this.inputs[1].connect(graph.lessThan);
        this.inputs[0].connect(graph.lessThan.controls.value);

        graph["switch"] = this.io.createSwitch(2, 0);

        this.inputs[0].connect(graph["switch"].inputs[0]);
        this.inputs[1].connect(graph["switch"].inputs[1]);
        graph.lessThan.connect(graph["switch"].control);
        graph["switch"].connect(this.outputs[0]);

        this.setGraph(graph);
    }

    _createClass(Min, [{
        key: "value",
        get: function get() {
            return this.controls.value.value;
        },
        set: function set(value) {
            this.controls.value.value = value;
        }
    }]);

    return Min;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createMin = function (value) {
    return new Min(this, value);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],48:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * Multiplies two audio signals together.
 * @param {Object} io Instance of AudioIO.
 */

var Multiply = (function (_Node) {
    _inherits(Multiply, _Node);

    function Multiply(io, value) {
        _classCallCheck(this, Multiply);

        _Node.call(this, io, 1, 1);

        this.inputs[1] = this.io.createParam(value);
        this.outputs[0].gain.value = 0.0;

        this.inputs[0].connect(this.outputs[0]);
        this.inputs[1].connect(this.outputs[0].gain);

        this.controls.value = this.inputs[1];
    }

    _createClass(Multiply, [{
        key: "value",
        get: function get() {
            return this.controls.value.value;
        },
        set: function set(value) {
            this.controls.value.setValueAtTime(value, this.context.currentTime);
        }
    }]);

    return Multiply;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createMultiply = function (value1, value2) {
    return new Multiply(this, value1, value2);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],49:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * Negates the incoming audio signal.
 * @param {Object} io Instance of AudioIO.
 */

var Negate = (function (_Node) {
    _inherits(Negate, _Node);

    function Negate(io) {
        _classCallCheck(this, Negate);

        _Node.call(this, io, 1, 0);

        this.inputs[0].gain.value = -1;
        this.outputs = this.inputs;
    }

    return Negate;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createNegate = function () {
    return new Negate(this);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],50:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * @param {Object} io Instance of AudioIO.
 *
 * Note: DOES NOT HANDLE NEGATIVE POWERS.
 */

var Pow = (function (_Node) {
    _inherits(Pow, _Node);

    function Pow(io, value) {
        _classCallCheck(this, Pow);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.multipliers = [];
        graph.value = value;

        for (var i = 0, node = this.inputs[0]; i < value - 1; ++i) {
            graph.multipliers[i] = this.io.createMultiply();
            this.inputs[0].connect(graph.multipliers[i].controls.value);
            node.connect(graph.multipliers[i]);
            node = graph.multipliers[i];
        }

        node.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    Pow.prototype.cleanUp = function cleanUp() {
        this.getGraph().value = null;
        _Node.prototype.cleanUp.call(this);
    };

    _createClass(Pow, [{
        key: "value",
        get: function get() {
            return this.getGraph().value;
        },
        set: function set(value) {
            var graph = this.getGraph();

            this.inputs[0].disconnect(graph.multipliers[0]);

            for (var i = graph.multipliers.length - 1; i >= 0; --i) {
                graph.multipliers[i].disconnect();
                graph.multipliers.splice(i, 1);
            }

            for (var i = 0, node = this.inputs[0]; i < value - 1; ++i) {
                graph.multipliers[i] = this.io.createMultiply();
                this.inputs[0].connect(graph.multipliers[i].controls.value);
                node.connect(graph.multipliers[i]);
                node = graph.multipliers[i];
            }

            node.connect(this.outputs[0]);

            graph.value = value;
        }
    }]);

    return Pow;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createPow = function (value) {
    return new Pow(this, value);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],51:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * Outputs the value of 1 / inputValue (or pow(inputValue, -1))
 * Will be useful for doing multiplicative division.
 *
 * TODO:
 *     - The waveshaper isn't accurate. It pumps out values differing
 *       by 1.7906793140301525e-9 or more.
 *
 * @param {Object} io Instance of AudioIO.
 */

var Reciprocal = (function (_Node) {
    _inherits(Reciprocal, _Node);

    function Reciprocal(io, maxInput) {
        _classCallCheck(this, Reciprocal);

        _Node.call(this, io, 1, 1);

        var factor = maxInput || 100,
            gain = Math.pow(factor, -1),
            graph = this.getGraph();

        graph.maxInput = this.context.createGain();
        graph.maxInput.gain.setValueAtTime(gain, this.context.currentTime);

        // this.inputs[ 0 ] = this.context.createGain();
        this.inputs[0].gain.setValueAtTime(0.0, this.context.currentTime);

        graph.shaper = this.io.createWaveShaper(this.io.curves.Reciprocal);

        // this.outputs[ 0 ] = this.context.createGain();
        this.outputs[0].gain.setValueAtTime(0.0, this.context.currentTime);

        this.io.constantDriver.connect(graph.maxInput);
        graph.maxInput.connect(this.inputs[0].gain);
        graph.maxInput.connect(this.outputs[0].gain);

        this.inputs[0].connect(graph.shaper);
        graph.shaper.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    _createClass(Reciprocal, [{
        key: "maxInput",
        get: function get() {
            return graph.maxInput.gain;
        },
        set: function set(value) {
            var graph = this.getGraph();

            if (typeof value === 'number') {
                graph.maxInput.gain.cancelScheduledValues(this.context.currentTime);
                graph.maxInput.gain.setValueAtTime(1 / value, this.context.currentTime);
            }
        }
    }]);

    return Reciprocal;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createReciprocal = function (maxInput) {
    return new Reciprocal(this, maxInput);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],52:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// NOTE:
//  Only accepts values >= -1 && <= 1. Values outside
//  this range are clamped to this range.

var Round = (function (_Node) {
    _inherits(Round, _Node);

    function Round(io) {
        _classCallCheck(this, Round);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.floor = this.io.createFloor();
        graph.add = this.io.createAdd(0.5);
        this.inputs[0].connect(graph.add);
        graph.add.connect(graph.floor);
        graph.floor.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return Round;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createRound = function () {
    return new Round(this);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],53:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/*
    Also known as z-1, this node delays the input by
    one sample.
 */

var SampleDelay = (function (_Node) {
    _inherits(SampleDelay, _Node);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function SampleDelay(io) {
        _classCallCheck(this, SampleDelay);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.delay = this.context.createDelay();
        graph.delay.delayTime.value = 1 / this.context.sampleRate;

        this.inputs[0].connect(graph.delay);
        graph.delay.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    // The factory for SampleDelay has an alias to it's more common name!
    return SampleDelay;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSampleDelay = AudioIO.prototype.createZMinusOne = function () {
    return new SampleDelay(this);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],54:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// Given an input value and its high and low bounds, scale
// that value to new high and low bounds.
//
// Formula from MaxMSP's Scale object:
//  http://www.cycling74.com/forums/topic.php?id=26593
//
// ((input-lowIn) / (highIn-lowIn)) * (highOut-lowOut) + lowOut;

// TODO:
//  - Add controls!

var Scale = (function (_Node) {
    _inherits(Scale, _Node);

    function Scale(io, lowIn, highIn, lowOut, highOut) {
        _classCallCheck(this, Scale);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        this.controls.lowIn = this.io.createParam(lowIn);
        this.controls.highIn = this.io.createParam(highIn);
        this.controls.lowOut = this.io.createParam(lowOut);
        this.controls.highOut = this.io.createParam(highOut);

        // (input-lowIn)
        graph.inputMinusLowIn = this.io.createSubtract();
        this.inputs[0].connect(graph.inputMinusLowIn, 0, 0);
        this.controls.lowIn.connect(graph.inputMinusLowIn, 0, 1);

        // (highIn-lowIn)
        graph.highInMinusLowIn = this.io.createSubtract();
        this.controls.highIn.connect(graph.highInMinusLowIn, 0, 0);
        this.controls.lowIn.connect(graph.highInMinusLowIn, 0, 1);

        // ((input-lowIn) / (highIn-lowIn))
        graph.divide = this.io.createDivide();
        graph.inputMinusLowIn.connect(graph.divide, 0, 0);
        graph.highInMinusLowIn.connect(graph.divide, 0, 1);

        // (highOut-lowOut)
        graph.highOutMinusLowOut = this.io.createSubtract();
        this.controls.highOut.connect(graph.highOutMinusLowOut, 0, 0);
        this.controls.lowOut.connect(graph.highOutMinusLowOut, 0, 1);

        // ((input-lowIn) / (highIn-lowIn)) * (highOut-lowOut)
        graph.multiply = this.io.createMultiply();
        graph.divide.connect(graph.multiply, 0, 0);
        graph.highOutMinusLowOut.connect(graph.multiply, 0, 1);

        // ((input-lowIn) / (highIn-lowIn)) * (highOut-lowOut) + lowOut
        graph.add = this.io.createAdd();
        graph.multiply.connect(graph.add, 0, 0);
        this.controls.lowOut.connect(graph.add, 0, 1);

        graph.add.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    _createClass(Scale, [{
        key: "lowIn",
        get: function get() {
            return this.controls.lowIn.value;
        },
        set: function set(value) {
            this.controls.lowIn.value = value;
        }
    }, {
        key: "highIn",
        get: function get() {
            return this.controls.highIn.value;
        },
        set: function set(value) {
            this.controls.highIn.value = value;
        }
    }, {
        key: "lowOut",
        get: function get() {
            return this.controls.lowOut.value;
        },
        set: function set(value) {
            this.controls.lowOut.value = value;
        }
    }, {
        key: "highOut",
        get: function get() {
            return this.controls.highOut.value;
        },
        set: function set(value) {
            this.controls.highOut.value = value;
        }
    }]);

    return Scale;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createScale = function (lowIn, highIn, lowOut, highOut) {
    return new Scale(this, lowIn, highIn, lowOut, highOut);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],55:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// Given an input value and its high and low bounds, scale
// that value to new high and low bounds.
//
// Formula from MaxMSP's Scale object:
//  http://www.cycling74.com/forums/topic.php?id=26593
//
// if( (input - lowIn) / (highIn - lowIn) === 0 ) {
//     return lowOut;
// }
// else if( (input - lowIn) / (highIn - lowIn) > 0 ) {
//     return lowOut + (highOut - lowOut) * Math.pow( (input - lowIn) / (highIn - lowIn), exp);
// }
// else {
//     return lowOut + (highOut - lowOut) * -(Math.pow( (-input + lowIn) / (highIn - lowIn), exp));
// }

// TODO:
//  - Add controls

var ScaleExp = (function (_Node) {
    _inherits(ScaleExp, _Node);

    function ScaleExp(io, lowIn, highIn, lowOut, highOut, exponent) {
        _classCallCheck(this, ScaleExp);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        // lowIn = typeof lowIn === 'number' ? lowIn : 0;
        // highIn = typeof highIn === 'number' ? highIn : 1;
        // lowOut = typeof lowOut === 'number' ? lowOut : 0;
        // highOut = typeof highOut === 'number' ? highOut : 10;
        // exponent = typeof exponent === 'number' ? exponent : 1;

        this.controls.lowIn = this.io.createParam(lowIn);
        this.controls.highIn = this.io.createParam(highIn);
        this.controls.lowOut = this.io.createParam(lowOut);
        this.controls.highOut = this.io.createParam(highOut);
        graph._exponent = this.io.createParam(exponent);

        // (input - lowIn)
        graph.inputMinusLowIn = this.io.createSubtract();
        this.inputs[0].connect(graph.inputMinusLowIn, 0, 0);
        this.controls.lowIn.connect(graph.inputMinusLowIn, 0, 1);

        // (-input + lowIn)
        graph.minusInput = this.io.createNegate();
        graph.minusInputPlusLowIn = this.io.createAdd();
        this.inputs[0].connect(graph.minusInput);
        graph.minusInput.connect(graph.minusInputPlusLowIn, 0, 0);
        this.controls.lowIn.connect(graph.minusInputPlusLowIn, 0, 1);

        // (highIn - lowIn)
        graph.highInMinusLowIn = this.io.createSubtract();
        this.controls.highIn.connect(graph.highInMinusLowIn, 0, 0);
        this.controls.lowIn.connect(graph.highInMinusLowIn, 0, 1);

        // ((input - lowIn) / (highIn - lowIn))
        graph.divide = this.io.createDivide();
        graph.inputMinusLowIn.connect(graph.divide, 0, 0);
        graph.highInMinusLowIn.connect(graph.divide, 0, 1);

        // (-input + lowIn) / (highIn - lowIn)
        graph.negativeDivide = this.io.createDivide();
        graph.minusInputPlusLowIn.connect(graph.negativeDivide, 0, 0);
        graph.highInMinusLowIn.connect(graph.negativeDivide, 0, 1);

        // (highOut - lowOut)
        graph.highOutMinusLowOut = this.io.createSubtract();
        this.controls.highOut.connect(graph.highOutMinusLowOut, 0, 0);
        this.controls.lowOut.connect(graph.highOutMinusLowOut, 0, 1);

        // Math.pow( (input - lowIn) / (highIn - lowIn), exp)
        graph.pow = this.io.createPow(exponent);
        graph.divide.connect(graph.pow);

        // -(Math.pow( (-input + lowIn) / (highIn - lowIn), exp))
        graph.negativePowNegate = this.io.createNegate();
        graph.negativePow = this.io.createPow(exponent);
        graph.negativeDivide.connect(graph.negativePow);
        graph.negativePow.connect(graph.negativePowNegate);

        // lowOut + (highOut - lowOut) * Math.pow( (input - lowIn) / (highIn - lowIn), exp);
        graph.elseIfBranch = this.io.createAdd();
        graph.elseIfMultiply = this.io.createMultiply();
        graph.highOutMinusLowOut.connect(graph.elseIfMultiply, 0, 0);
        graph.pow.connect(graph.elseIfMultiply, 0, 1);
        this.controls.lowOut.connect(graph.elseIfBranch, 0, 0);
        graph.elseIfMultiply.connect(graph.elseIfBranch, 0, 1);

        // lowOut + (highOut - lowOut) * -(Math.pow( (-input + lowIn) / (highIn - lowIn), exp));
        graph.elseBranch = this.io.createAdd();
        graph.elseMultiply = this.io.createMultiply();
        graph.highOutMinusLowOut.connect(graph.elseMultiply, 0, 0);
        graph.negativePowNegate.connect(graph.elseMultiply, 0, 1);
        this.controls.lowOut.connect(graph.elseBranch, 0, 0);
        graph.elseMultiply.connect(graph.elseBranch, 0, 1);

        // else if( (input - lowIn) / (highIn - lowIn) > 0 ) {
        graph.greaterThanZero = this.io.createGreaterThanZero();
        graph.ifGreaterThanZero = this.io.createIfElse();
        graph.divide.connect(graph.greaterThanZero);
        graph.greaterThanZero.connect(graph.ifGreaterThanZero["if"]);
        graph.elseIfBranch.connect(graph.ifGreaterThanZero.then);
        graph.elseBranch.connect(graph.ifGreaterThanZero["else"]);

        // if((input - lowIn) / (highIn - lowIn) === 0)
        graph.equalsZero = this.io.createEqualToZero();
        graph.ifEqualsZero = this.io.createIfElse();
        graph.divide.connect(graph.equalsZero);
        graph.equalsZero.connect(graph.ifEqualsZero["if"]);
        this.controls.lowOut.connect(graph.ifEqualsZero.then);
        graph.ifGreaterThanZero.connect(graph.ifEqualsZero["else"]);

        graph.ifEqualsZero.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    _createClass(ScaleExp, [{
        key: "lowIn",
        get: function get() {
            return this.controls.lowIn.value;
        },
        set: function set(value) {
            this.controls.lowIn.value = value;
        }
    }, {
        key: "highIn",
        get: function get() {
            return this.controls.highIn.value;
        },
        set: function set(value) {
            this.controls.highIn.value = value;
        }
    }, {
        key: "lowOut",
        get: function get() {
            return this.controls.lowOut.value;
        },
        set: function set(value) {
            this.controls.lowOut.value = value;
        }
    }, {
        key: "highOut",
        get: function get() {
            return this.controls.highOut.value;
        },
        set: function set(value) {
            this.controls.highOut.value = value;
        }
    }, {
        key: "exponent",
        get: function get() {
            return this.getGraph()._exponent.value;
        },
        set: function set(value) {
            var graph = this.getGraph();
            graph._exponent.value = value;
            graph.pow.value = value;
            graph.negativePow.value = value;
        }
    }]);

    return ScaleExp;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createScaleExp = function (lowIn, highIn, lowOut, highOut, exponent) {
    return new ScaleExp(this, lowIn, highIn, lowOut, highOut, exponent);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],56:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Sign = (function (_Node) {
    _inherits(Sign, _Node);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function Sign(io) {
        _classCallCheck(this, Sign);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.shaper = this.io.createWaveShaper(this.io.curves.Sign);

        graph.ifElse = this.io.createIfElse();
        graph.equalToZero = this.io.createEqualToZero();

        this.inputs[0].connect(graph.equalToZero);
        this.inputs[0].connect(graph.ifElse.then);
        this.inputs[0].connect(graph.shaper);

        graph.equalToZero.connect(graph.ifElse["if"]);
        graph.shaper.connect(graph.ifElse["else"]);
        graph.ifElse.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return Sign;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSign = function () {
    return new Sign(this);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],57:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Example
//
// for( var i = 0, x; i < sigFigures; ++i ) {
//      if( i === 0 ) {
//          x = sigFigures * Math.pow( 10, 2 );
//      }
//      else {
//          x = 0.5 * ( x + (input / x) );
//      }
// }

// TODO:
//  - Make sure Sqrt uses getGraph and setGraph.

var SqrtHelper = (function () {
    function SqrtHelper(io, previousStep, input, maxInput) {
        _classCallCheck(this, SqrtHelper);

        this.multiply = io.createMultiply(0.5);
        this.divide = io.createDivide(null, maxInput);
        this.add = io.createAdd();

        // input / x;
        input.connect(this.divide, 0, 0);
        previousStep.output.connect(this.divide, 0, 1);

        // x + ( input / x )
        previousStep.output.connect(this.add, 0, 0);
        this.divide.connect(this.add, 0, 1);

        // 0.5 * ( x + ( input / x ) )
        this.add.connect(this.multiply);

        this.output = this.multiply;
    }

    SqrtHelper.prototype.cleanUp = function cleanUp() {
        this.multiply.cleanUp();
        this.divide.cleanUp();
        this.add.cleanUp();

        this.multiply = null;
        this.divide = null;
        this.add = null;
        this.output = null;
    };

    return SqrtHelper;
})();

var Sqrt = (function (_Node) {
    _inherits(Sqrt, _Node);

    function Sqrt(io, significantFigures, maxInput) {
        _classCallCheck(this, Sqrt);

        _Node.call(this, io, 1, 1);

        // Default to 6 significant figures.
        significantFigures = significantFigures || 6;

        maxInput = maxInput || 100;

        this.x0 = this.io.createConstant(significantFigures * Math.pow(10, 2));

        this.steps = [{
            output: this.x0
        }];

        for (var i = 1; i < significantFigures; ++i) {
            this.steps.push(new SqrtHelper(this.io, this.steps[i - 1], this.inputs[0], maxInput));
        }

        this.steps[this.steps.length - 1].output.connect(this.outputs[0]);
    }

    // cleanUp() {
    //     super();

    //     this.x0.cleanUp();

    //     this.steps[ 0 ] = null;

    //     for( var i = this.steps.length - 1; i >= 1; --i ) {
    //         this.steps[ i ].cleanUp();
    //         this.steps[ i ] = null;
    //     }

    //     this.x0 = null;
    //     this.steps = null;
    // }
    return Sqrt;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSqrt = function (significantFigures, maxInput) {
    return new Sqrt(this, significantFigures, maxInput);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],58:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Square = (function (_Node) {
    _inherits(Square, _Node);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function Square(io) {
        _classCallCheck(this, Square);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.multiply = this.io.createMultiply();
        this.inputs[0].connect(graph.multiply, 0, 0);
        this.inputs[0].connect(graph.multiply, 0, 1);
        graph.multiply.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return Square;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createSquare = function () {
    return new Square(this);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],59:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * Subtracts the second input from the first.
 *
 * @param {Object} io Instance of AudioIO.
 */

var Subtract = (function (_Node) {
    _inherits(Subtract, _Node);

    function Subtract(io, value) {
        _classCallCheck(this, Subtract);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.negate = this.io.createNegate();

        this.inputs[1] = this.io.createParam(value);

        this.inputs[0].connect(this.outputs[0]);
        this.inputs[1].connect(graph.negate);
        graph.negate.connect(this.outputs[0]);

        this.controls.value = this.inputs[1];

        this.setGraph(graph);
    }

    _createClass(Subtract, [{
        key: "value",
        get: function get() {
            return this.controls.value.value;
        },
        set: function set(value) {
            this.controls.value.setValueAtTime(value, this.context.currentTime);
        }
    }]);

    return Subtract;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSubtract = function (value) {
    return new Subtract(this, value);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],60:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Switch = (function (_Node) {
    _inherits(Switch, _Node);

    function Switch(io, numCases, startingCase) {
        _classCallCheck(this, Switch);

        _Node.call(this, io, 1, 1);

        // Ensure startingCase is never < 0
        startingCase = typeof startingCase === 'number' ? Math.abs(startingCase) : startingCase;

        var graph = this.getGraph();

        graph.cases = [];

        this.controls.index = this.io.createParam(startingCase);

        for (var i = 0; i < numCases; ++i) {
            this.inputs[i] = this.context.createGain();
            this.inputs[i].gain.value = 0.0;
            graph.cases[i] = this.io.createEqualTo(i);
            graph.cases[i].connect(this.inputs[i].gain);
            this.controls.index.connect(graph.cases[i]);
            this.inputs[i].connect(this.outputs[0]);
        }

        this.setGraph(graph);
    }

    _createClass(Switch, [{
        key: "control",
        get: function get() {
            return this.controls.index.control;
        }
    }, {
        key: "value",
        get: function get() {
            return this.controls.index.value;
        },
        set: function set(value) {
            this.controls.index.value = value;
        }
    }]);

    return Switch;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSwitch = function (numCases, startingCase) {
    return new Switch(this, numCases, startingCase);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],61:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _LogicalOperatorEs6 = require("./LogicalOperator.es6");

var _LogicalOperatorEs62 = _interopRequireDefault(_LogicalOperatorEs6);

var AND = (function (_LogicalOperator) {
    _inherits(AND, _LogicalOperator);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function AND(io) {
        _classCallCheck(this, AND);

        _LogicalOperator.call(this, io);

        var graph = this.getGraph();

        graph.multiply = this.io.createMultiply();
        this.inputs[1] = this.io.createClamp(0, 1);

        this.inputs[0].connect(graph.multiply, 0, 0);
        this.inputs[1].connect(graph.multiply, 0, 1);

        graph.multiply.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return AND;
})(_LogicalOperatorEs62["default"]);

AudioIO.prototype.createAND = function () {
    return new AND(this);
};

exports["default"] = AND;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"./LogicalOperator.es6":62}],62:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var LogicalOperator = (function (_Node) {
    _inherits(LogicalOperator, _Node);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function LogicalOperator(io) {
        _classCallCheck(this, LogicalOperator);

        _Node.call(this, io, 0, 1);

        var graph = this.getGraph();

        graph.clamp = this.io.createClamp(0, 1);
        this.inputs[0] = graph.clamp;

        this.setGraph(graph);
    }

    return LogicalOperator;
})(_coreNodeEs62["default"]);

exports["default"] = LogicalOperator;

AudioIO.prototype.createLogicalOperator = function () {
    return new LogicalOperator(this);
};
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],63:[function(require,module,exports){
// AND -> NOT -> out
//
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _LogicalOperatorEs6 = require("./LogicalOperator.es6");

var _LogicalOperatorEs62 = _interopRequireDefault(_LogicalOperatorEs6);

var NAND = (function (_LogicalOperator) {
    _inherits(NAND, _LogicalOperator);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function NAND(io) {
        _classCallCheck(this, NAND);

        _LogicalOperator.call(this, io);

        var graph = this.getGraph();
        graph.AND = this.io.createAND();
        graph.NOT = this.io.createNOT();
        this.inputs[1] = this.context.createGain();

        this.inputs[0].connect(graph.AND, 0, 0);
        this.inputs[1].connect(graph.AND, 0, 1);
        graph.AND.connect(graph.NOT);
        graph.NOT.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return NAND;
})(_LogicalOperatorEs62["default"]);

AudioIO.prototype.createNAND = function () {
    return new NAND(this);
};

exports["default"] = NAND;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"./LogicalOperator.es6":62}],64:[function(require,module,exports){
// OR -> NOT -> out
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _LogicalOperatorEs6 = require("./LogicalOperator.es6");

var _LogicalOperatorEs62 = _interopRequireDefault(_LogicalOperatorEs6);

var NOR = (function (_LogicalOperator) {
    _inherits(NOR, _LogicalOperator);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function NOR(io) {
        _classCallCheck(this, NOR);

        _LogicalOperator.call(this, io);

        var graph = this.getGraph();
        graph.OR = this.io.createOR();
        graph.NOT = this.io.createNOT();
        this.inputs[1] = this.context.createGain();

        this.inputs[0].connect(graph.OR, 0, 0);
        this.inputs[1].connect(graph.OR, 0, 1);
        graph.OR.connect(graph.NOT);
        graph.NOT.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return NOR;
})(_LogicalOperatorEs62["default"]);

AudioIO.prototype.createNOR = function () {
    return new NOR(this);
};

exports["default"] = NOR;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"./LogicalOperator.es6":62}],65:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _LogicalOperatorEs6 = require("./LogicalOperator.es6");

var _LogicalOperatorEs62 = _interopRequireDefault(_LogicalOperatorEs6);

var NOT = (function (_LogicalOperator) {
    _inherits(NOT, _LogicalOperator);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function NOT(io) {
        _classCallCheck(this, NOT);

        _LogicalOperator.call(this, io);

        var graph = this.getGraph();

        graph.abs = this.io.createAbs(100);
        graph.subtract = this.io.createSubtract(1);
        graph.round = this.io.createRound();

        this.inputs[0].connect(graph.subtract);
        graph.subtract.connect(graph.abs);
        graph.abs.connect(graph.round);

        graph.round.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return NOT;
})(_LogicalOperatorEs62["default"]);

AudioIO.prototype.createNOT = function () {
    return new NOT(this);
};

exports["default"] = NOT;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"./LogicalOperator.es6":62}],66:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _LogicalOperatorEs6 = require("./LogicalOperator.es6");

var _LogicalOperatorEs62 = _interopRequireDefault(_LogicalOperatorEs6);

var OR = (function (_LogicalOperator) {
    _inherits(OR, _LogicalOperator);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function OR(io) {
        _classCallCheck(this, OR);

        _LogicalOperator.call(this, io);

        var graph = this.getGraph();

        graph.max = this.io.createMax();
        graph.equalTo = this.io.createEqualTo(1);
        this.inputs[1] = this.io.createClamp(0, 1);

        this.inputs[0].connect(graph.max);
        this.inputs[1].connect(graph.max.controls.value);
        graph.max.connect(graph.equalTo);
        graph.equalTo.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return OR;
})(_LogicalOperatorEs62["default"]);

AudioIO.prototype.createOR = function () {
    return new OR(this);
};

exports["default"] = OR;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"./LogicalOperator.es6":62}],67:[function(require,module,exports){
// a equalTo( b ) -> NOT -> out
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _LogicalOperatorEs6 = require("./LogicalOperator.es6");

var _LogicalOperatorEs62 = _interopRequireDefault(_LogicalOperatorEs6);

var XOR = (function (_LogicalOperator) {
    _inherits(XOR, _LogicalOperator);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function XOR(io) {
        _classCallCheck(this, XOR);

        _LogicalOperator.call(this, io);

        var graph = this.getGraph();
        graph.equalTo = this.io.createEqualTo();
        graph.NOT = this.io.createNOT();
        this.inputs[1] = this.context.createGain();

        this.inputs[0].connect(graph.equalTo);
        this.inputs[1].connect(graph.equalTo.controls.value);
        graph.equalTo.connect(graph.NOT);
        graph.NOT.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return XOR;
})(_LogicalOperatorEs62["default"]);

AudioIO.prototype.createXOR = function () {
    return new XOR(this);
};

exports["default"] = XOR;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"./LogicalOperator.es6":62}],68:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// gain(+100000) -> shaper( <= 0: 1, 1 )

var EqualTo = (function (_Node) {
    _inherits(EqualTo, _Node);

    function EqualTo(io, value) {
        _classCallCheck(this, EqualTo);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        // TODO
        //  - Rename this.
        graph.value = this.io.createParam(value), graph.inversion = this.context.createGain();

        graph.inversion.gain.value = -1;

        // This curve outputs 0.5 when input is 0,
        // so it has to be piped into a node that
        // transforms it into 1, and leaves zeros
        // alone.
        graph.shaper = this.io.createWaveShaper(this.io.curves.EqualToZero);

        graph.greaterThanZero = this.io.createGreaterThanZero();
        graph.value.connect(graph.inversion);
        graph.inversion.connect(this.inputs[0]);

        this.inputs[0].connect(graph.shaper);
        graph.shaper.connect(graph.greaterThanZero);
        graph.greaterThanZero.connect(this.outputs[0]);

        this.controls.value = graph.value;

        this.setGraph(graph);
    }

    _createClass(EqualTo, [{
        key: "value",
        get: function get() {
            return this.controls.value.value;
        },
        set: function set(value) {
            this.controls.value.setValueAtTime(value, this.context.currentTime);
        }
    }]);

    return EqualTo;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createEqualTo = function (value) {
    return new EqualTo(this, value);
};

exports["default"] = EqualTo;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],69:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var _EqualToEs6 = require("./EqualTo.es6");

var _EqualToEs62 = _interopRequireDefault(_EqualToEs6);

// Haven't quite figured out why yet, but this returns 0 when input is 0.
// It should return 1...
//
// For now, I'm just using the EqualTo node with a static 0 argument.
// --------
//
// class EqualToZero extends Node {
//     constructor( io ) {
//         super( io, 1, 0 );

//         this.inputs[ 0 ].gain.value = 100000;

//         // This outputs 0.5 when input is 0,
//         // so it has to be piped into a node that
//         // transforms it into 1, and leaves zeros
//         // alone.
//         this.shaper = this.io.createWaveShaper( this.io.curves.EqualToZero );

//         this.outputs[ 0 ] = this.io.createGreaterThan( 0 );

//         this.inputs[ 0 ].connect( this.shaper );
//         this.shaper.connect( this.outputs[ 0 ] );
//     }

//     cleanUp() {
//         super();

//         this.shaper.cleanUp();
//         this.shaper = null;
//     }
// }

AudioIO.prototype.createEqualToZero = function () {
    // return new EqualToZero( this );

    return new _EqualToEs62["default"](this, 0);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4,"./EqualTo.es6":68}],70:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var GreaterThan = (function (_Node) {
    _inherits(GreaterThan, _Node);

    function GreaterThan(io, value) {
        _classCallCheck(this, GreaterThan);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        this.controls.value = this.io.createParam(value);
        graph.inversion = this.context.createGain();

        graph.inversion.gain.value = -1;

        this.inputs[0].gain.value = 100000;
        graph.shaper = this.io.createWaveShaper(this.io.curves.GreaterThanZero);

        this.controls.value.connect(graph.inversion);
        graph.inversion.connect(this.inputs[0]);
        this.inputs[0].connect(graph.shaper);
        graph.shaper.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    _createClass(GreaterThan, [{
        key: "value",
        get: function get() {
            return this.controls.value.value;
        },
        set: function set(value) {
            this.controls.value.setValueAtTime(value, this.context.currentTime);
        }
    }]);

    return GreaterThan;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createGreaterThan = function (value) {
    return new GreaterThan(this, value);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],71:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var GreaterThanEqualTo = (function (_Node) {
    _inherits(GreaterThanEqualTo, _Node);

    function GreaterThanEqualTo(io, value) {
        _classCallCheck(this, GreaterThanEqualTo);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        this.controls.value = this.io.createParam(value);
        graph.greaterThan = this.io.createGreaterThan();
        graph.equalTo = this.io.createEqualTo();
        graph.OR = this.io.createOR();

        this.controls.value.connect(graph.greaterThan.controls.value);
        this.controls.value.connect(graph.equalTo.controls.value);

        this.inputs[0].connect(graph.greaterThan);
        this.inputs[0].connect(graph.equalTo);
        graph.greaterThan.connect(graph.OR, 0, 0);
        graph.equalTo.connect(graph.OR, 0, 1);
        graph.OR.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    _createClass(GreaterThanEqualTo, [{
        key: "value",
        get: function get() {
            return this.controls.value.value;
        },
        set: function set(value) {
            this.controls.value.setValueAtTime(value, this.context.currentTime);
        }
    }]);

    return GreaterThanEqualTo;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createGreaterThanEqualTo = function (value) {
    return new GreaterThanEqualTo(this, value);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],72:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var GreaterThanZero = (function (_Node) {
    _inherits(GreaterThanZero, _Node);

    function GreaterThanZero(io) {
        _classCallCheck(this, GreaterThanZero);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        this.inputs[0].gain.value = 100000;
        graph.shaper = this.io.createWaveShaper(this.io.curves.GreaterThanZero);
        this.inputs[0].connect(graph.shaper);
        graph.shaper.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return GreaterThanZero;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createGreaterThanZero = function () {
    return new GreaterThanZero(this);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],73:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var IfElse = (function (_Node) {
    _inherits(IfElse, _Node);

    function IfElse(io) {
        _classCallCheck(this, IfElse);

        _Node.call(this, io, 0, 0);

        var graph = this.getGraph();

        graph["switch"] = this.io.createSwitch(2, 0);

        this["if"] = this.io.createEqualToZero();
        this["if"].connect(graph["switch"].control);
        this.then = graph["switch"].inputs[0];
        this["else"] = graph["switch"].inputs[1];

        this.inputs = graph["switch"].inputs;
        this.outputs = graph["switch"].outputs;

        this.setGraph(graph);
    }

    return IfElse;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createIfElse = function () {
    return new IfElse(this);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],74:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var LessThan = (function (_Node) {
    _inherits(LessThan, _Node);

    function LessThan(io, value) {
        _classCallCheck(this, LessThan);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        this.controls.value = this.io.createParam(value);

        graph.valueInversion = this.context.createGain();
        graph.valueInversion.gain.value = -1;

        this.controls.value.connect(graph.valueInversion);

        this.inputs[0].gain.value = -100000;
        graph.shaper = this.io.createWaveShaper(this.io.curves.GreaterThanZero);

        graph.valueInversion.connect(this.inputs[0]);
        this.inputs[0].connect(graph.shaper);
        graph.shaper.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    _createClass(LessThan, [{
        key: "value",
        get: function get() {
            return this.controls.value.value;
        },
        set: function set(value) {
            this.controls.value.setValueAtTime(value, this.context.currentTime);
        }
    }]);

    return LessThan;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createLessThan = function (value) {
    return new LessThan(this, value);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],75:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var LessThanEqualTo = (function (_Node) {
    _inherits(LessThanEqualTo, _Node);

    function LessThanEqualTo(io, value) {
        _classCallCheck(this, LessThanEqualTo);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        this.controls.value = this.io.createParam(value);
        graph.lessThan = this.io.createLessThan();
        graph.equalTo = this.io.createEqualTo();
        graph.OR = this.io.createOR();

        this.controls.value.connect(graph.lessThan.controls.value);
        this.controls.value.connect(graph.equalTo.controls.value);

        this.inputs[0].connect(graph.lessThan);
        this.inputs[0].connect(graph.equalTo);
        graph.lessThan.connect(graph.OR, 0, 0);
        graph.equalTo.connect(graph.OR, 0, 1);
        graph.OR.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    _createClass(LessThanEqualTo, [{
        key: "value",
        get: function get() {
            return this.controls.value.value;
        },
        set: function set(value) {
            this.controls.value.setValueAtTime(value, this.context.currentTime);
        }
    }]);

    return LessThanEqualTo;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createLessThanEqualTo = function (value) {
    return new LessThanEqualTo(this, value);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],76:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var LessThanZero = (function (_Node) {
    _inherits(LessThanZero, _Node);

    function LessThanZero(io) {
        _classCallCheck(this, LessThanZero);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.booster = this.context.createGain();
        graph.booster.gain.value = -100000;
        this.inputs[0].connect(graph.booster);

        graph.shaper = this.io.createWaveShaper(this.io.curves.GreaterThanZero);

        graph.booster.connect(graph.shaper);
        graph.shaper.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return LessThanZero;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createLessThanZero = function () {
    return new LessThanZero(this);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],77:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// Cosine approximation!
//
// Only works in range of -Math.PI to Math.PI.

var Cos = (function (_Node) {
    _inherits(Cos, _Node);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function Cos(io, value) {
        _classCallCheck(this, Cos);

        _Node.call(this, io, 0, 1);

        var graph = this.getGraph();

        this.inputs[0] = this.io.createParam(value);

        graph.square = this.io.createSquare();
        graph.multiply1 = this.io.createMultiply(-2.605e-7);
        graph.multiply2 = this.io.createMultiply();
        graph.multiply3 = this.io.createMultiply();
        graph.multiply4 = this.io.createMultiply();
        graph.multiply5 = this.io.createMultiply();

        graph.add1 = this.io.createAdd(2.47609e-5);
        graph.add2 = this.io.createAdd(-0.00138884);
        graph.add3 = this.io.createAdd(0.0416666);
        graph.add4 = this.io.createAdd(-0.499923);
        graph.add5 = this.io.createAdd(1);

        this.inputs[0].connect(graph.square);

        // Connect multiply1's inputs
        graph.square.connect(graph.multiply1, 0, 0);

        // Connect add1's inputs
        graph.multiply1.connect(graph.add1, 0, 0);

        // Connect up multiply2's inputs
        graph.square.connect(graph.multiply2, 0, 0);
        graph.add1.connect(graph.multiply2, 0, 1);

        // Connect up add2's inputs
        graph.multiply2.connect(graph.add2, 0, 0);

        // Connect up multiply3's inputs
        graph.square.connect(graph.multiply3, 0, 0);
        graph.add2.connect(graph.multiply3, 0, 1);

        // Connect add3's inputs
        graph.multiply3.connect(graph.add3, 0, 0);

        // Connect multiply4's inputs
        graph.square.connect(graph.multiply4, 0, 0);
        graph.add3.connect(graph.multiply4, 0, 1);

        // add4's inputs
        graph.multiply4.connect(graph.add4, 0, 0);

        // multiply5's inputs
        graph.square.connect(graph.multiply5, 0, 0);
        graph.add4.connect(graph.multiply5, 0, 1);

        // add5's inputs
        graph.multiply5.connect(graph.add5, 0, 0);

        // Output (finally!!)
        graph.add5.connect(this.outputs[0]);

        // Store controllable params.
        this.controls.value = this.inputs[0];

        this.setGraph(graph);
    }

    return Cos;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createCos = function (value) {
    return new Cos(this, value);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],78:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var DegToRad = (function (_Node) {
    _inherits(DegToRad, _Node);

    function DegToRad(io) {
        _classCallCheck(this, DegToRad);

        _Node.call(this, io, 0, 0);
        this.inputs[0] = this.outputs[0] = this.io.createMultiply(Math.PI / 180);
    }

    return DegToRad;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createDegToRad = function (deg) {
    return new DegToRad(this, deg);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],79:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var RadToDeg = (function (_Node) {
    _inherits(RadToDeg, _Node);

    function RadToDeg(io) {
        _classCallCheck(this, RadToDeg);

        _Node.call(this, io, 0, 0);
        this.inputs[0] = this.outputs[0] = this.io.createMultiply(180 / Math.PI);
    }

    return RadToDeg;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createRadToDeg = function (deg) {
    return new RadToDeg(this, deg);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],80:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// Sin approximation!
//
// Only works in range of -Math.PI to Math.PI.

var Sin = (function (_Node) {
    _inherits(Sin, _Node);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function Sin(io, value) {
        _classCallCheck(this, Sin);

        _Node.call(this, io, 0, 1);

        var graph = this.getGraph();

        this.inputs[0] = this.controls.value = this.io.createParam(value);

        graph.square = this.io.createSquare();
        graph.multiply1 = this.io.createMultiply(-2.39e-8);
        graph.multiply2 = this.io.createMultiply();
        graph.multiply3 = this.io.createMultiply();
        graph.multiply4 = this.io.createMultiply();
        graph.multiply5 = this.io.createMultiply();
        graph.multiply6 = this.io.createMultiply();

        graph.add1 = this.io.createAdd(2.7526e-6);
        graph.add2 = this.io.createAdd(-0.000198409);
        graph.add3 = this.io.createAdd(0.00833333);
        graph.add4 = this.io.createAdd(-0.166667);
        graph.add5 = this.io.createAdd(1);

        this.inputs[0].connect(graph.square);

        // Connect multiply1's inputs
        graph.square.connect(graph.multiply1, 0, 0);

        // Connect add1's inputs
        graph.multiply1.connect(graph.add1, 0, 0);

        // Connect up multiply2's inputs
        graph.square.connect(graph.multiply2, 0, 0);
        graph.add1.connect(graph.multiply2, 0, 1);

        // Connect up add2's inputs
        graph.multiply2.connect(graph.add2, 0, 0);

        // Connect up multiply3's inputs
        graph.square.connect(graph.multiply3, 0, 0);
        graph.add2.connect(graph.multiply3, 0, 1);

        // Connect add3's inputs
        graph.multiply3.connect(graph.add3, 0, 0);

        // Connect multiply4's inputs
        graph.square.connect(graph.multiply4, 0, 0);
        graph.add3.connect(graph.multiply4, 0, 1);

        // add4's inputs
        graph.multiply4.connect(graph.add4, 0, 0);

        // multiply5's inputs
        graph.square.connect(graph.multiply5, 0, 0);
        graph.add4.connect(graph.multiply5, 0, 1);

        // add5's inputs
        graph.multiply5.connect(graph.add5, 0, 0);

        // multiply6's inputs
        this.inputs[0].connect(graph.multiply6, 0, 0);
        graph.add5.connect(graph.multiply6, 0, 1);

        // Output (finally!!)
        graph.multiply6.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    return Sin;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSin = function (value) {
    return new Sin(this, value);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],81:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// Tangent approximation!
//
// Only works in range of -Math.PI to Math.PI.
//
// sin( input ) / cos( input )

var Tan = (function (_Node) {
    _inherits(Tan, _Node);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function Tan(io, value) {
        _classCallCheck(this, Tan);

        _Node.call(this, io, 0, 1);

        var graph = this.getGraph();

        this.inputs[0] = this.controls.value = this.io.createParam(value);

        graph.sine = this.io.createSin();
        graph.cos = this.io.createCos();
        graph.divide = this.io.createDivide(undefined, Math.PI * 2);

        this.inputs[0].connect(graph.sine);
        this.inputs[0].connect(graph.cos);
        graph.sine.connect(graph.divide, 0, 0);
        graph.cos.connect(graph.divide, 0, 1);

        graph.divide.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    _createClass(Tan, [{
        key: "value",
        get: function get() {
            return this.controls.value.value;
        },
        set: function set(value) {
            this.controls.value.value = value;
        }
    }]);

    return Tan;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createTan = function (value) {
    return new Tan(this, value);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],82:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _coreConfigEs6 = require("../core/config.es6");

var _coreConfigEs62 = _interopRequireDefault(_coreConfigEs6);

function PinkNumber() {
	this.maxKey = 0x1f;
	this.key = 0;
	this.whiteValues = [];
	this.range = 128;
	this.limit = 5;

	this.generate = this.generate.bind(this);
	this.getNextValue = this.getNextValue.bind(this);
}

PinkNumber.prototype.generate = function (range, limit) {
	this.range = range || 128;
	this.maxKey = 0x1f;
	this.key = 0;
	this.limit = limit || 1;

	var rangeLimit = this.range / this.limit;

	for (var i = 0; i < this.limit; ++i) {
		this.whiteValues[i] = Math.random() % rangeLimit;
	}
};

PinkNumber.prototype.getNextValue = function () {
	var lastKey = this.key,
	    sum = 0;

	++this.key;

	if (this.key > this.maxKey) {
		this.key = 0;
	}

	var diff = this.lastKey ^ this.key;
	var rangeLimit = this.range / this.limit;

	for (var i = 0; i < this.limit; ++i) {
		if (diff & 1 << i) {
			this.whiteValues[i] = Math.random() % rangeLimit;
		}

		sum += this.whiteValues[i];
	}

	return sum / this.limit;
};

var pink = new PinkNumber();
pink.generate();

exports["default"] = {
	roundFromEpsilon: function roundFromEpsilon(n) {
		var rounded = Math.round(n);

		if (rounded % n < _coreConfigEs62["default"].epsilon) {
			return rounded;
		} else {
			return n;
		}
	},

	roundToMultiple: function roundToMultiple(n, multiple) {
		return Math.floor((n + multiple - 1) / multiple) * multiple;
	},

	clamp: function clamp(value, min, max) {
		return Math.min(max, Math.max(value, min));
	},

	scaleNumber: function scaleNumber(num, lowIn, highIn, lowOut, highOut) {
		return (num - lowIn) / (highIn - lowIn) * (highOut - lowOut) + lowOut;
	},

	scaleNumberExp: function scaleNumberExp(num, lowIn, highIn, lowOut, highOut, exp) {
		if (typeof exp !== 'number' || exp === 1) {
			return this.scaleNumber(num, lowIn, highIn, lowOut, highOut);
		}

		if ((num - lowIn) / (highIn - lowIn) === 0) {
			return lowOut;
		} else {
			if ((num - lowIn) / (highIn - lowIn) > 0) {
				return lowOut + (highOut - lowOut) * Math.pow((num - lowIn) / (highIn - lowIn), exp);
			} else {
				return lowOut + (highOut - lowOut) * -Math.pow((-num + lowIn) / (highIn - lowIn), exp);
			}
		}
	},

	// A very poor approximation of a gaussian random number generator!
	gaussianRandom: function gaussianRandom(cycles) {
		cycles = cycles || 10;

		var n = 0,
		    i = cycles;

		while (--i) {
			n += Math.random();
		}

		return n / cycles;
	},

	// From:
	// 	http://www.meredithdodge.com/2012/05/30/a-great-little-javascript-function-for-generating-random-gaussiannormalbell-curve-numbers/
	nrand: function nrand() {
		var x1, x2, rad, y1;

		do {
			x1 = 2 * Math.random() - 1;
			x2 = 2 * Math.random() - 1;
			rad = x1 * x1 + x2 * x2;
		} while (rad >= 1 || rad === 0);

		var c = Math.sqrt(-2 * Math.log(rad) / rad);

		return x1 * c / 5 * 0.5 + 0.5;
	},

	generatePinkNumber: pink.generate,
	getNextPinkNumber: pink.getNextValue

};
module.exports = exports["default"];

},{"../core/config.es6":7}],83:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
    cleanUpInOuts: function cleanUpInOuts() {
        var inputs, outputs;

        if (Array.isArray(this.inputs)) {
            inputs = this.inputs;

            for (var i = 0; i < inputs.length; ++i) {
                if (inputs[i] && typeof inputs[i].cleanUp === 'function') {
                    inputs[i].cleanUp();
                } else if (inputs[i]) {
                    inputs[i].disconnect();
                }

                inputs[i] = null;
            }

            this.inputs = null;
        }

        if (Array.isArray(this.outputs)) {
            outputs = this.outputs;

            for (var i = 0; i < outputs.length; ++i) {
                if (outputs[i] && typeof outputs[i].cleanUp === 'function') {
                    outputs[i].cleanUp();
                } else if (outputs[i]) {
                    outputs[i].disconnect();
                }

                outputs[i] = null;
            }

            this.outputs = null;
        }
    },

    cleanIO: function cleanIO() {
        if (this.io) {
            this.io = null;
        }

        if (this.context) {
            this.context = null;
        }
    }
};
module.exports = exports['default'];

},{}],84:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var slice = Array.prototype.slice;

exports['default'] = {
    connect: function connect(node) {
        var outputChannel = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
        var inputChannel = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

        if (node instanceof AudioParam || node instanceof AudioNode) {
            // this.outputs[ outputChannel ].connect( node );
            this.outputs[outputChannel].connect.call(this.outputs[outputChannel], node, 0, inputChannel);
        } else if (node && node.outputs && node.outputs.length) {
            // if( node.inputs[ inputChannel ] instanceof Param ) {
            // console.log( 'CONNECTING TO PARAM' );
            // node.io.constantDriver.disconnect( node.control );
            // }

            this.outputs[outputChannel].connect(node.inputs[inputChannel]);
        } else {
            console.error('ASSERT NOT REACHED');
            console.log(arguments);
            console.trace();
        }
    },

    disconnect: function disconnect(node) {
        var outputChannel = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
        var inputChannel = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

        if (node instanceof AudioParam || node instanceof AudioNode) {
            this.outputs[outputChannel].disconnect.call(this.outputs[outputChannel], node, 0, inputChannel);
        } else if (node && node.inputs && node.inputs.length) {
            this.outputs[outputChannel].disconnect(node.inputs[inputChannel]);
        } else if (node === undefined && this.outputs) {
            this.outputs.forEach(function (n) {
                if (n && typeof n.disconnect === 'function') {
                    n.disconnect();
                }
            });
        }
    },

    chain: function chain() {
        var nodes = slice.call(arguments),
            node = this;

        for (var i = 0; i < nodes.length; ++i) {
            node.connect.call(node, nodes[i]);
            node = nodes[i];
        }
    },

    fan: function fan() {
        var nodes = slice.call(arguments),
            node = this;

        for (var i = 0; i < nodes.length; ++i) {
            node.connect.call(node, nodes[i]);
        }
    }
};
module.exports = exports['default'];

},{}],85:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _mathEs6 = require("./math.es6");

var _mathEs62 = _interopRequireDefault(_mathEs6);

var _noteStringsEs6 = require("./noteStrings.es6");

var _noteStringsEs62 = _interopRequireDefault(_noteStringsEs6);

var _notesEs6 = require("./notes.es6");

var _notesEs62 = _interopRequireDefault(_notesEs6);

var _coreConfigEs6 = require("../core/config.es6");

var _coreConfigEs62 = _interopRequireDefault(_coreConfigEs6);

var _noteRegExpEs6 = require("./noteRegExp.es6");

var _noteRegExpEs62 = _interopRequireDefault(_noteRegExpEs6);

exports["default"] = {
    scalarToDb: function scalarToDb(scalar) {
        return 20 * (Math.log(scalar) / Math.LN10);
    },
    dbToScalar: function dbToScalar(db) {
        return Math.pow(2, db / 6);
    },

    hzToMIDI: function hzToMIDI(value) {
        return _mathEs62["default"].roundFromEpsilon(69 + 12 * Math.log2(value / 440));
    },

    hzToNote: function hzToNote(value) {
        return this.midiToNote(this.hzToMIDI(value));
    },

    hzToMs: function hzToMs(value) {
        if (value === 0) return 0;
        return 1000 / value;
    },

    hzToBPM: function hzToBPM(value) {
        return this.msToBPM(this.hzToMs(value));
    },

    midiToHz: function midiToHz(value) {
        return Math.pow(2, (value - 69) / 12) * 440;
    },

    midiToNote: function midiToNote(value) {
        var values = (value + '').split('.'),
            noteValue = +values[0],
            cents = (values[1] ? parseFloat('0.' + values[1], 10) : 0) * 100;

        if (Math.abs(cents) >= 100) {
            noteValue += cents % 100;
        }

        var root = noteValue % 12 | 0,
            octave = noteValue / 12 | 0,
            noteName = _noteStringsEs62["default"][root];

        return noteName + (octave + _coreConfigEs62["default"].lowestOctave) + (cents ? '+' + cents : '');
    },

    midiToMs: function midiToMs(value) {
        return this.hzToMs(this.midiToHz(value));
    },

    midiToBPM: function midiToBPM(value) {
        return this.msToBPM(this.midiToMs(value));
    },

    noteToHz: function noteToHz(value) {
        return this.midiToHz(this.noteToMIDI(value));
    },

    noteToMIDI: function noteToMIDI(value) {
        var matches = _noteRegExpEs62["default"].exec(value),
            note = undefined,
            accidental = undefined,
            octave = undefined,
            cents = undefined,
            noteValue = undefined;

        if (!matches) {
            console.warn('Invalid note format:', value);
            return;
        }

        note = matches[1];
        accidental = matches[2];
        octave = parseInt(matches[3], 10) + -_coreConfigEs62["default"].lowestOctave;
        cents = parseFloat(matches[4]) || 0;

        noteValue = _notesEs62["default"][note + accidental];

        return _mathEs62["default"].roundFromEpsilon(noteValue + octave * 12 + cents * 0.01);
    },

    noteToMs: function noteToMs(value) {
        return this.midiToMs(this.noteToMIDI(value));
    },

    noteToBPM: function noteToBPM(value) {
        return this.midiToBPM(this.noteToMIDI(value));
    },

    msToHz: function msToHz(value) {
        return this.hzToMs(value);
    },

    msToNote: function msToNote(value) {
        return this.midiToMs(this.noteToMIDI(value));
    },

    msToMIDI: function msToMIDI(value) {
        return this.hzToMIDI(this.msToHz(value));
    },

    msToBPM: function msToBPM(value) {
        return value === 0 ? 0 : 60000 / value;
    },

    bpmToHz: function bpmToHz(value) {
        return this.msToHz(this.bpmToMs(value));
    },

    bpmToNote: function bpmToNote(value) {
        return this.midiToBPM(this.noteToMIDI(value));
    },

    bpmToMIDI: function bpmToMIDI(value) {
        return this.msToMIDI(this.bpmToMs(value));
    },

    bpmToMs: function bpmToMs(value) {
        return this.msToBPM(value);
    }
};
module.exports = exports["default"];

},{"../core/config.es6":7,"./math.es6":86,"./noteRegExp.es6":87,"./noteStrings.es6":88,"./notes.es6":89}],86:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _coreConfigEs6 = require("../core/config.es6");

var _coreConfigEs62 = _interopRequireDefault(_coreConfigEs6);

function PinkNumber() {
	this.maxKey = 0x1f;
	this.key = 0;
	this.whiteValues = [];
	this.range = 128;
	this.limit = 5;

	this.generate = this.generate.bind(this);
	this.getNextValue = this.getNextValue.bind(this);
}

PinkNumber.prototype.generate = function (range, limit) {
	this.range = range || 128;
	this.maxKey = 0x1f;
	this.key = 0;
	this.limit = limit || 1;

	var rangeLimit = this.range / this.limit;

	for (var i = 0; i < this.limit; ++i) {
		this.whiteValues[i] = Math.random() % rangeLimit;
	}
};

PinkNumber.prototype.getNextValue = function () {
	var lastKey = this.key,
	    sum = 0;

	++this.key;

	if (this.key > this.maxKey) {
		this.key = 0;
	}

	var diff = this.lastKey ^ this.key;
	var rangeLimit = this.range / this.limit;

	for (var i = 0; i < this.limit; ++i) {
		if (diff & 1 << i) {
			this.whiteValues[i] = Math.random() % rangeLimit;
		}

		sum += this.whiteValues[i];
	}

	return sum / this.limit;
};

var pink = new PinkNumber();
pink.generate();

exports["default"] = {
	roundFromEpsilon: function roundFromEpsilon(n) {
		var rounded = Math.round(n);

		if (rounded % n < _coreConfigEs62["default"].epsilon) {
			return rounded;
		} else {
			return n;
		}
	},

	roundToMultiple: function roundToMultiple(n, multiple) {
		return Math.floor((n + multiple - 1) / multiple) * multiple;
	},

	clamp: function clamp(value, min, max) {
		return Math.min(max, Math.max(value, min));
	},

	scaleNumber: function scaleNumber(num, lowIn, highIn, lowOut, highOut) {
		return (num - lowIn) / (highIn - lowIn) * (highOut - lowOut) + lowOut;
	},

	scaleNumberExp: function scaleNumberExp(num, lowIn, highIn, lowOut, highOut, exp) {
		if (typeof exp !== 'number' || exp === 1) {
			return this.scaleNumber(num, lowIn, highIn, lowOut, highOut);
		}

		if ((num - lowIn) / (highIn - lowIn) === 0) {
			return lowOut;
		} else {
			if ((num - lowIn) / (highIn - lowIn) > 0) {
				return lowOut + (highOut - lowOut) * Math.pow((num - lowIn) / (highIn - lowIn), exp);
			} else {
				return lowOut + (highOut - lowOut) * -Math.pow((-num + lowIn) / (highIn - lowIn), exp);
			}
		}
	},

	// A very poor approximation of a gaussian random number generator!
	gaussianRandom: function gaussianRandom(cycles) {
		cycles = cycles || 10;

		var n = 0,
		    i = cycles;

		while (--i) {
			n += Math.random();
		}

		return n / cycles;
	},

	// From:
	// 	http://www.meredithdodge.com/2012/05/30/a-great-little-javascript-function-for-generating-random-gaussiannormalbell-curve-numbers/
	nrand: function nrand() {
		var x1, x2, rad, y1;

		do {
			x1 = 2 * Math.random() - 1;
			x2 = 2 * Math.random() - 1;
			rad = x1 * x1 + x2 * x2;
		} while (rad >= 1 || rad === 0);

		var c = Math.sqrt(-2 * Math.log(rad) / rad);

		return x1 * c / 5 * 0.5 + 0.5;
	},

	generatePinkNumber: pink.generate,
	getNextPinkNumber: pink.getNextValue

};
module.exports = exports["default"];

},{"../core/config.es6":7}],87:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = /^([A|B|C|D|E|F|G]{1})([#bx]{0,2})([\-\+]?\d+)?([\+|\-]{1}\d*.\d*)?/;
module.exports = exports["default"];

},{}],88:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
module.exports = exports['default'];

},{}],89:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
    'C': 0, 'Dbb': 0, 'B#': 0,
    'C#': 1, 'Db': 1, 'B##': 1, 'Bx': 1,
    'D': 2, 'Ebb': 2, 'C##': 2, 'Cx': 2,
    'D#': 3, 'Eb': 3, 'Fbb': 3,
    'E': 4, 'Fb': 4, 'D##': 4, 'Dx': 4,
    'F': 5, 'Gbb': 5, 'E#': 5,
    'F#': 6, 'Gb': 6, 'E##': 6, 'Ex': 6,
    'G': 7, 'Abb': 7, 'F##': 7, 'Fx': 7,
    'G#': 8, 'Ab': 8,
    'A': 9, 'Bbb': 9, 'G##': 9, 'Gx': 9,
    'A#': 10, 'Bb': 10, 'Cbb': 10,
    'B': 11, 'Cb': 11, 'A##': 11, 'Ax': 11
};
module.exports = exports['default'];

},{}],90:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = _setIO;

function _setIO(io) {
    this.io = io;
    this.context = io.context;
}

;
module.exports = exports["default"];

},{}],91:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var _buffersBufferGeneratorsEs6 = require("../buffers/BufferGenerators.es6");

var _buffersBufferGeneratorsEs62 = _interopRequireDefault(_buffersBufferGeneratorsEs6);

var _buffersBufferUtilsEs6 = require("../buffers/BufferUtils.es6");

var _buffersBufferUtilsEs62 = _interopRequireDefault(_buffersBufferUtilsEs6);

// TODO:
// 	- Issue with playback rate not having a wide enough range
// 	  to support the full frequency range.
// 	 
// 	- Fix:
// 		- Create multiple buffer sources attached to a switch.
// 		- Number of sources:
// 			Available range: 1024
// 				* -512 to +512 is a fair balance between range and
// 				artifacts on different browsers, Firefox having issues
// 				around the +800 mark, Chrome stops increasing
// 				after around +1000. Safari is just broken: playbackRate
// 				AudioParam cannot be driven by audio signal. Wat.
// 			Max freq: sampleRate * 0.5
// 			
// 			numSources: Math.ceil( maxFreq / availableRange )
// 				
// 			breakpoints: i * maxFreq
// 			initial value of playbackRate: -512.
// 			
// 		- For sampleRate of 48000:
// 			numSources: Math.ceil( (48000 * 0.5) / 1024 ) = 24.
// 			
// 			
//  - Major downside: many, many bufferSources will be created
//    each time `start()` is called.
// 			
//

var BufferOscillator = (function (_Node) {
	_inherits(BufferOscillator, _Node);

	function BufferOscillator(io, generator) {
		_classCallCheck(this, BufferOscillator);

		_Node.call(this, io, 0, 1);

		this.generator = generator;
		this.controls.frequency = this.io.createParam();
		this.controls.detune = this.io.createParam();

		this.reset();
	}

	BufferOscillator.prototype.start = function start(when, phase) {
		var buffer = _buffersBufferUtilsEs62["default"].generateBuffer(this.io, 1, this.context.sampleRate, this.context.sampleRate, this.generator),
		    bufferSource;

		this.reset();

		bufferSource = this.getGraph().bufferSource;
		bufferSource.buffer = buffer;
		bufferSource.start(when, phase);
		console.log(bufferSource);
	};

	BufferOscillator.prototype.stop = function stop(when) {
		var graph = this.getGraph(),
		    bufferSource = graph.bufferSource,
		    self = this;

		bufferSource.stop(when);
	};

	BufferOscillator.prototype.reset = function reset() {
		var graph = this.getGraph();

		graph.bufferSource = this.context.createBufferSource();
		graph.bufferSource.loop = true;
		graph.bufferSource.playbackRate.value = 0;
		graph.bufferSource.connect(this.outputs[0]);

		this.controls.frequency.connect(graph.bufferSource.playbackRate);

		if (graph.bufferSource.detune instanceof AudioParam) {
			this.controls.detune.connect(graph.bufferSource.detune);
		}

		this.setGraph(graph);
	};

	return BufferOscillator;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createBufferOscillator = function (generator) {
	return new BufferOscillator(this, generator);
};

},{"../buffers/BufferGenerators.es6":1,"../buffers/BufferUtils.es6":2,"../core/AudioIO.es6":3,"../core/Node.es6":4}],92:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _oscillatorsOscillatorBankEs6 = require("../oscillators/OscillatorBank.es6");

var _oscillatorsOscillatorBankEs62 = _interopRequireDefault(_oscillatorsOscillatorBankEs6);

var FMOscillator = (function (_OscillatorBank) {
    _inherits(FMOscillator, _OscillatorBank);

    function FMOscillator(io) {
        _classCallCheck(this, FMOscillator);

        _OscillatorBank.call(this, io);

        var graph = this.getGraph(this);

        // FM/modulator oscillator setup
        graph.fmOscillator = this.io.createOscillatorBank();
        graph.fmOscAmount = this.context.createGain();
        graph.fmOscAmountMultiplier = this.io.createMultiply();
        graph.fmOscAmount.gain.value = 0;
        graph.fmOscillator.connect(graph.fmOscAmount);
        graph.fmOscAmount.connect(graph.fmOscAmountMultiplier, 0, 0);

        this.controls.fmFrequency = this.io.createParam();
        this.controls.fmFrequency.connect(graph.fmOscillator.controls.frequency);
        this.controls.fmFrequency.connect(graph.fmOscAmountMultiplier, 0, 1);

        this.controls.fmWaveform = this.io.createParam();
        this.controls.fmWaveform.connect(graph.fmOscillator.controls.waveform);

        this.controls.fmOscAmount = this.io.createParam();
        this.controls.fmOscAmount.connect(graph.fmOscAmount.gain);

        // Self-fm setup
        graph.fmSelfAmounts = [];
        graph.fmSelfAmountMultipliers = [];
        this.controls.fmSelfAmount = this.io.createParam();

        for (var i = 0; i < graph.oscillators.length; ++i) {
            // Connect FM oscillator to the existing oscillators
            // frequency control.
            graph.fmOscAmountMultiplier.connect(graph.oscillators[i].frequency);

            // For each oscillator in the oscillator bank,
            // create a FM-self GainNode, and connect the osc
            // to it, then it to the osc's frequency.
            graph.fmSelfAmounts[i] = this.context.createGain();
            graph.fmSelfAmounts[i].gain.value = 0;

            graph.fmSelfAmountMultipliers[i] = this.io.createMultiply();
            graph.fmSelfAmounts[i].connect(graph.fmSelfAmountMultipliers[i], 0, 0);
            this.controls.frequency.connect(graph.fmSelfAmountMultipliers[i], 0, 1);

            graph.oscillators[i].connect(graph.fmSelfAmounts[i]);
            graph.fmSelfAmountMultipliers[i].connect(graph.oscillators[i].frequency);

            // Make sure the FM-self amount is controllable with one parameter.
            this.controls.fmSelfAmount.connect(graph.fmSelfAmounts[i].gain);
        }

        this.setGraph(graph);
    }

    return FMOscillator;
})(_oscillatorsOscillatorBankEs62["default"]);

AudioIO.prototype.createFMOscillator = function () {
    return new FMOscillator(this);
};

},{"../core/AudioIO.es6":3,"../oscillators/OscillatorBank.es6":94}],93:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var _buffersBufferUtilsEs6 = require("../buffers/BufferUtils.es6");

var _buffersBufferUtilsEs62 = _interopRequireDefault(_buffersBufferUtilsEs6);

var _buffersBufferGeneratorsEs6 = require("../buffers/BufferGenerators.es6");

var _buffersBufferGeneratorsEs62 = _interopRequireDefault(_buffersBufferGeneratorsEs6);

var BUFFERS = new WeakMap();

var NoiseOscillatorBank = (function (_Node) {
    _inherits(NoiseOscillatorBank, _Node);

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function NoiseOscillatorBank(io) {
        _classCallCheck(this, NoiseOscillatorBank);

        _Node.call(this, io, 0, 1);

        var graph = this.getGraph(this),
            types = this.constructor.types,
            typeKeys = Object.keys(types);

        graph.bufferSources = [];
        graph.outputGain = this.context.createGain();
        graph.crossfader = this.io.createCrossfader(Object.keys(types).length, 0);
        graph.outputGain.gain.value = 0;

        for (var i = 0; i < typeKeys.length; ++i) {
            var source = this.context.createBufferSource();

            console.log(_buffersBufferGeneratorsEs62["default"][this.constructor.generatorKeys[i]]);

            source.buffer = _buffersBufferUtilsEs62["default"].generateBuffer(this.io, // context
            1, // channels
            this.context.sampleRate * 5, // length (5 seconds)
            this.context.sampleRate, // SampleRate
            _buffersBufferGeneratorsEs62["default"][this.constructor.generatorKeys[i]] // Generator function
            );

            source.loop = true;
            source.start(0);

            source.connect(graph.crossfader, 0, i);
            graph.bufferSources.push(source);
        }

        graph.crossfader.connect(graph.outputGain);
        graph.outputGain.connect(this.outputs[0]);

        this.controls.type = graph.crossfader.controls.index;
        this.setGraph(graph);
    }

    NoiseOscillatorBank.prototype.start = function start(time) {
        var outputGain = this.getGraph(this).outputGain;

        time = time || this.context.currentTime;
        outputGain.gain.value = 1;
    };

    NoiseOscillatorBank.prototype.stop = function stop(time) {
        var outputGain = this.getGraph(this).outputGain;

        time = time || this.context.currentTime;
        outputGain.gain.value = 0;
    };

    return NoiseOscillatorBank;
})(_coreNodeEs62["default"]);

NoiseOscillatorBank.types = {
    WHITE: 0,
    GAUSSIAN_WHITE: 1,
    PINK: 2
};

NoiseOscillatorBank.generatorKeys = ['WhiteNoise', 'GaussianNoise', 'PinkNoise'];

AudioIO.prototype.createNoiseOscillatorBank = function () {
    return new NoiseOscillatorBank(this);
};

},{"../buffers/BufferGenerators.es6":1,"../buffers/BufferUtils.es6":2,"../core/AudioIO.es6":3,"../core/Node.es6":4}],94:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var OSCILLATOR_TYPES = ['sine', 'triangle', 'sawtooth', 'square'];

var OscillatorBank = (function (_Node) {
    _inherits(OscillatorBank, _Node);

    function OscillatorBank(io) {
        _classCallCheck(this, OscillatorBank);

        _Node.call(this, io, 0, 1);

        var graph = this.getGraph();

        graph.crossfader = this.io.createCrossfader(OSCILLATOR_TYPES.length, 0);
        graph.oscillators = [];

        this.controls.frequency = this.io.createParam();
        this.controls.detune = this.io.createParam();
        this.controls.waveform = graph.crossfader.controls.index;

        for (var i = 0; i < OSCILLATOR_TYPES.length; ++i) {
            var osc = this.context.createOscillator();

            osc.type = OSCILLATOR_TYPES[i];
            osc.frequency.value = 0;
            osc.start(0);

            this.controls.frequency.connect(osc.frequency);
            this.controls.detune.connect(osc.detune);
            osc.connect(graph.crossfader, 0, i);

            graph.oscillators.push(osc);
        }

        graph.outputLevel = this.context.createGain();
        graph.outputLevel.gain.value = 0;

        graph.crossfader.connect(graph.outputLevel);
        graph.outputLevel.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    OscillatorBank.prototype.start = function start() {
        var delay = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

        this.getGraph().outputLevel.gain.value = 1;
    };

    OscillatorBank.prototype.stop = function stop() {
        var delay = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

        this.getGraph().outputLevel.gain.value = 0;
    };

    return OscillatorBank;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createOscillatorBank = function () {
    return new OscillatorBank(this);
};

exports["default"] = OscillatorBank;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],95:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var SineBank = (function (_Node) {
    _inherits(SineBank, _Node);

    function SineBank(io) {
        var numSines = arguments.length <= 1 || arguments[1] === undefined ? 4 : arguments[1];

        _classCallCheck(this, SineBank);

        _Node.call(this, io, 0, 1);

        var graph = this.getGraph();

        graph.oscillators = [];
        graph.harmonicMultipliers = [];
        graph.numSines = numSines;
        graph.outputLevel = this.context.createGain();
        graph.outputLevel.gain.value = 1 / numSines;

        this.controls.frequency = this.io.createParam();
        this.controls.detune = this.io.createParam();
        this.controls.harmonics = [];

        for (var i = 0; i < numSines; ++i) {
            var osc = this.context.createOscillator(),
                harmonicControl = this.io.createParam(),
                harmonicMultiplier = this.io.createMultiply();

            osc.type = 'sine';
            osc.frequency.value = 0;

            this.controls.frequency.connect(harmonicMultiplier, 0, 0);
            harmonicControl.connect(harmonicMultiplier, 0, 1);
            harmonicMultiplier.connect(osc.frequency);
            this.controls.detune.connect(osc.detune);

            this.controls.harmonics[i] = harmonicControl;

            osc.start(0);
            osc.connect(graph.outputLevel);
            graph.oscillators.push(osc);
        }

        graph.outputLevel.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    SineBank.prototype.start = function start() {
        var delay = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

        var graph = this.getGraph();
        graph.outputLevel.gain.value = 1 / graph.numSines;
    };

    SineBank.prototype.stop = function stop() {
        var delay = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

        this.getGraph().outputLevel.gain.value = 0;
    };

    return SineBank;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createSineBank = function (numSines) {
    return new SineBank(this, numSines);
};

exports["default"] = SineBank;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],96:[function(require,module,exports){
"use strict";

exports.__esModule = true;
var Utils = {};

Utils.isTypedArray = function (array) {
	if (array !== undefined && array.buffer instanceof ArrayBuffer) {
		return true;
	}

	return false;
};

exports["default"] = Utils;
module.exports = exports["default"];

},{}]},{},[37])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2J1ZmZlcnMvQnVmZmVyR2VuZXJhdG9ycy5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2J1ZmZlcnMvQnVmZmVyVXRpbHMuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9jb3JlL0F1ZGlvSU8uZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9jb3JlL05vZGUuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9jb3JlL1BhcmFtLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvY29yZS9XYXZlU2hhcGVyLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvY29yZS9jb25maWcuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9jb3JlL292ZXJyaWRlcy5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2NvcmUvc2lnbmFsQ3VydmVzLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZW52ZWxvcGVzL0FEQkRTUkVudmVsb3BlLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZW52ZWxvcGVzL0FERW52ZWxvcGUuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9lbnZlbG9wZXMvQURTUkVudmVsb3BlLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZW52ZWxvcGVzL0N1c3RvbUVudmVsb3BlLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZngvU2Nocm9lZGVyQWxsUGFzcy5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2Z4L2RlbGF5L0RlbGF5LmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZngvZGVsYXkvUGluZ1BvbmdEZWxheS5lczYuanMiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2Z4L2RlbGF5L1N0ZXJlb0RlbGF5LmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZngvZXEvQ3VzdG9tRVEuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9meC9maWx0ZXJzL0FsbFBhc3NGaWx0ZXIuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9meC9maWx0ZXJzL0JQRmlsdGVyLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZngvZmlsdGVycy9GaWx0ZXJCYW5rLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZngvZmlsdGVycy9IUEZpbHRlci5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2Z4L2ZpbHRlcnMvTFBGaWx0ZXIuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9meC9maWx0ZXJzL05vdGNoRmlsdGVyLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZngvc2F0dXJhdGlvbi9TaW5lU2hhcGVyLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZngvdXRpbGl0eS9EQ1RyYXAuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9meC91dGlsaXR5L0xGTy5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2Z4L3V0aWxpdHkvU3RlcmVvUm90YXRpb24uZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9meC91dGlsaXR5L1N0ZXJlb1dpZHRoLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZ2VuZXJhdG9ycy9Pc2NpbGxhdG9yR2VuZXJhdG9yLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZ3JhcGhzL0NvdW50ZXIuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9ncmFwaHMvQ3Jvc3NmYWRlci5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2dyYXBocy9EcnlXZXROb2RlLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZ3JhcGhzL0VRU2hlbGYuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9ncmFwaHMvUGhhc2VPZmZzZXQuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9pbnN0cnVtZW50cy9HZW5lcmF0b3JQbGF5ZXIuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYWluLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9BYnMuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL0FkZC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvQXZlcmFnZS5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvQ2xhbXAuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL0NvbnN0YW50LmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9EaXZpZGUuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL0Zsb29yLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9MZXJwLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9NYXguZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL01pbi5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvTXVsdGlwbHkuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL05lZ2F0ZS5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvUG93LmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9SZWNpcHJvY2FsLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9Sb3VuZC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvU2FtcGxlRGVsYXkuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL1NjYWxlLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9TY2FsZUV4cC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvU2lnbi5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvU3FydC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvU3F1YXJlLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9TdWJ0cmFjdC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvU3dpdGNoLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9BTkQuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL0xvZ2ljYWxPcGVyYXRvci5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTkFORC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTk9SLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OT1QuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL09SLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9YT1IuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0VxdWFsVG8uZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0VxdWFsVG9aZXJvLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhbi5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvR3JlYXRlclRoYW5FcXVhbFRvLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhblplcm8uZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0lmRWxzZS5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvTGVzc1RoYW4uZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuRXF1YWxUby5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvTGVzc1RoYW5aZXJvLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC90cmlnb25vbWV0cnkvQ29zLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC90cmlnb25vbWV0cnkvRGVnVG9SYWQuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9SYWRUb0RlZy5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L1Npbi5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L1Rhbi5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21peGlucy9NYXRoLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWl4aW5zL2NsZWFuZXJzLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWl4aW5zL2NvbnZlcnNpb25zLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWl4aW5zL21hdGguZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9taXhpbnMvbm90ZVJlZ0V4cC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21peGlucy9ub3RlU3RyaW5ncy5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21peGlucy9ub3Rlcy5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21peGlucy9zZXRJTy5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL29zY2lsbGF0b3JzL0J1ZmZlck9zY2lsbGF0b3IuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9vc2NpbGxhdG9ycy9GTU9zY2lsbGF0b3IuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9vc2NpbGxhdG9ycy9Ob2lzZU9zY2lsbGF0b3JCYW5rLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvb3NjaWxsYXRvcnMvT3NjaWxsYXRvckJhbmsuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9vc2NpbGxhdG9ycy9TaW5lQmFuay5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL3V0aWxpdGllcy9VdGlscy5lczYiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7NkJDQW1CLG9CQUFvQjs7Ozs2QkFDdEIsb0JBQW9COzs7O0FBR3JDLElBQUksZ0JBQWdC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LENBQUMsUUFBUSxDQUFFLENBQUM7QUFDNUMsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLENBQUUsQ0FBQzs7QUFFcEMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDOzs7QUFHekMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc5QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FB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QUFFLENBQUM7O0FBRTVCLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsS0FBSyxDQUFFLENBQUM7O0FBRXRFLGFBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUN0QyxhQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFFLENBQUMsT0FBTyxDQUFFLENBQUM7QUFDckQsYUFBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQzNDLGFBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUMzQyxhQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDM0MsYUFBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQzNDLGFBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7QUFFM0MsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxTQUFTLENBQUUsQ0FBQztBQUM1QyxhQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLENBQUMsV0FBVyxDQUFFLENBQUM7QUFDL0MsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxVQUFVLENBQUUsQ0FBQztBQUM3QyxhQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDNUMsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLENBQUUsQ0FBQzs7QUFFcEMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDOzs7QUFHekMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc5QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFD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RCxXQUFPLElBQUksUUFBUSxDQUFFLElBQUksRUFBRSxRQUFRLENBQUUsQ0FBQztDQUN6QyxDQUFDOztxQkFHTSxRQUFROzs7Ozs7O0FDNURoQixJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7O0FBRWYsS0FBSyxDQUFDLFlBQVksR0FBRyxVQUFVLEtBQUssRUFBRztBQUN0QyxLQUFLLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLE1BQU0sWUFBWSxXQUFXLEVBQUc7QUFDakUsU0FBTyxJQUFJLENBQUM7RUFDWjs7QUFFRCxRQUFPLEtBQUssQ0FBQztDQUNiLENBQUM7O3FCQUVhLEtBQUsiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IENPTkZJRyBmcm9tICcuLi9jb3JlL2NvbmZpZy5lczYnO1xuaW1wb3J0IG1hdGggZnJvbSAnLi4vbWl4aW5zL01hdGguZXM2JztcblxuXG52YXIgQnVmZmVyR2VuZXJhdG9ycyA9IHt9O1xuXG5CdWZmZXJHZW5lcmF0b3JzLlNpbmVXYXZlID0gZnVuY3Rpb24gc2luZVdhdmVJdGVyYXRvciggaSwgbGVuZ3RoICkge1xuICAgIHZhciB4ID0gTWF0aC5QSSAqICggaSAvIGxlbmd0aCApIC0gTWF0aC5QSSAqIDAuNTtcbiAgICByZXR1cm4gTWF0aC5zaW4oIHggKiAyICk7XG59O1xuXG5CdWZmZXJHZW5lcmF0b3JzLlNhd1dhdmUgPSBmdW5jdGlvbiBzYXdXYXZlSXRlcmF0b3IoIGksIGxlbmd0aCApIHtcbiAgICByZXR1cm4gKCBpIC8gbGVuZ3RoICkgKiAyIC0gMTtcbn07XG5cbkJ1ZmZlckdlbmVyYXRvcnMuU3F1YXJlV2F2ZSA9IGZ1bmN0aW9uIHNxdWFyZVdhdmVJdGVyYXRvciggaSwgbGVuZ3RoICkge1xuICAgIHZhciB4ID0gKCBpIC8gbGVuZ3RoICkgKiAyIC0gMTtcbiAgICByZXR1cm4gTWF0aC5zaWduKCB4ICsgMC4wMDEgKTtcbn07XG5cbkJ1ZmZlckdlbmVyYXRvcnMuVHJpYW5nbGVXYXZlID0gZnVuY3Rpb24gdHJpYW5nbGVXYXZlSXRlcmF0b3IoIGksIGxlbmd0aCApIHtcbiAgICB2YXIgeCA9IE1hdGguYWJzKCAoIGkgJSBsZW5ndGggKiAyICkgLSBsZW5ndGggKSAtIGxlbmd0aCAqIDAuNTtcbiAgICByZXR1cm4gTWF0aC5zaW4oIHggLyAoIGxlbmd0aCAqIDAuNSApICk7XG59O1xuXG5CdWZmZXJHZW5lcmF0b3JzLldoaXRlTm9pc2UgPSBmdW5jdGlvbiB3aGl0ZU5vaXNlSXRlcmF0b3IoKSB7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiAyIC0gMTtcbn07XG5cbkJ1ZmZlckdlbmVyYXRvcnMuR2F1c3NpYW5Ob2lzZSA9IGZ1bmN0aW9uIGdhdXNzaWFuTm9pc2VJdGVyYXRvcigpIHtcbiAgICByZXR1cm4gbWF0aC5ucmFuZCgpICogMiAtIDE7XG59O1xuXG5CdWZmZXJHZW5lcmF0b3JzLlBpbmtOb2lzZSA9ICggZnVuY3Rpb24oKSB7XG4gICAgdmFyIGhhc0dlbmVyYXRlZFBpbmtOdW1iZXIgPSBmYWxzZTtcblxuICAgIHJldHVybiBmdW5jdGlvbiBwaW5rTm9pc2VJdGVyYXRvciggaSwgbGVuZ3RoICkge1xuICAgICAgICB2YXIgbnVtYmVyO1xuXG4gICAgICAgIGlmICggaGFzR2VuZXJhdGVkUGlua051bWJlciA9PT0gZmFsc2UgKSB7XG4gICAgICAgICAgICBtYXRoLmdlbmVyYXRlUGlua051bWJlciggMTI4LCA1ICk7XG4gICAgICAgICAgICBoYXNHZW5lcmF0ZWRQaW5rTnVtYmVyID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIG51bWJlciA9IG1hdGguZ2V0TmV4dFBpbmtOdW1iZXIoKSAqIDIgLSAxO1xuXG4gICAgICAgIGlmICggaSA9PT0gbGVuZ3RoIC0gMSApIHtcbiAgICAgICAgICAgIGhhc0dlbmVyYXRlZFBpbmtOdW1iZXIgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudW1iZXI7XG4gICAgfTtcbn0oKSApO1xuXG5leHBvcnQgZGVmYXVsdCBCdWZmZXJHZW5lcmF0b3JzOyIsImltcG9ydCBVdGlscyBmcm9tICcuLi91dGlsaXRpZXMvVXRpbHMuZXM2JztcblxudmFyIEJ1ZmZlclV0aWxzID0ge307XG52YXIgQlVGRkVSX1NUT1JFID0ge307XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQnVmZmVyU3RvcmVLZXkoIGxlbmd0aCwgbnVtYmVyT2ZDaGFubmVscywgc2FtcGxlUmF0ZSwgaXRlcmF0b3IgKSB7XG5cdHJldHVybiBsZW5ndGggKyAnLScgKyBudW1iZXJPZkNoYW5uZWxzICsgJy0nICsgc2FtcGxlUmF0ZSArICctJyArIGl0ZXJhdG9yO1xufVxuXG4vLyBUT0RPOlxuLy8gXHQtIEl0IG1pZ2h0IGJlIHBvc3NpYmxlIHRvIGRlY29kZSB0aGUgYXJyYXlidWZmZXJcbi8vIFx0ICB1c2luZyBhIGNvbnRleHQgZGlmZmVyZW50IGZyb20gdGhlIG9uZSB0aGUgXG4vLyBcdCAgYnVmZmVyIHdpbGwgYmUgdXNlZCBpbi5cbi8vIFx0ICBJZiBzbywgcmVtb3ZlIHRoZSBgaW9gIGFyZ3VtZW50LCBhbmQgY3JlYXRlXG4vLyBcdCAgYSBuZXcgQXVkaW9Db250ZXh0IGJlZm9yZSB0aGUgcmV0dXJuIG9mIHRoZSBQcm9taXNlLFxuLy8gXHQgIGFuZCB1c2UgdGhhdC5cbkJ1ZmZlclV0aWxzLmxvYWRCdWZmZXIgPSBmdW5jdGlvbiggaW8sIHVyaSApIHtcblx0cmV0dXJuIG5ldyBQcm9taXNlKCBmdW5jdGlvbiggcmVzb2x2ZSwgcmVqZWN0ICkge1xuXHRcdHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuXHRcdHhoci5vcGVuKCAnR0VUJywgdXJpICk7XG5cdFx0eGhyLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XG5cblx0XHR4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoIHhoci5zdGF0dXMgPT09IDIwMCApIHtcblx0XHRcdFx0Ly8gRG8gdGhlIGRlY29kZSBkYW5jZVxuXHRcdFx0XHRpby5jb250ZXh0LmRlY29kZUF1ZGlvRGF0YShcblx0XHRcdFx0XHR4aHIucmVzcG9uc2UsXG5cdFx0XHRcdFx0ZnVuY3Rpb24oIGJ1ZmZlciApIHtcblx0XHRcdFx0XHRcdHJlc29sdmUoIGJ1ZmZlciApO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ZnVuY3Rpb24oIGUgKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QoIGUgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0cmVqZWN0KCBFcnJvciggJ1N0YXR1cyAhPT0gMjAwJyApICk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHhoci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZWplY3QoIEVycm9yKCAnTmV0d29yayBlcnJvcicgKSApO1xuXHRcdH07XG5cblx0XHR4aHIuc2VuZCgpO1xuXHR9ICk7XG59O1xuXG5CdWZmZXJVdGlscy5nZW5lcmF0ZUJ1ZmZlciA9IGZ1bmN0aW9uKCBpbywgbnVtYmVyT2ZDaGFubmVscywgbGVuZ3RoLCBzYW1wbGVSYXRlLCBpdGVyYXRvciApIHtcblx0dmFyIGtleSA9IGdlbmVyYXRlQnVmZmVyU3RvcmVLZXkoIGxlbmd0aCwgbnVtYmVyT2ZDaGFubmVscywgc2FtcGxlUmF0ZSwgaXRlcmF0b3IudG9TdHJpbmcoKSApLFxuXHRcdGJ1ZmZlcixcblx0XHRjaGFubmVsRGF0YTtcblxuXHRpZiAoIEJVRkZFUl9TVE9SRVsga2V5IF0gKSB7XG5cdFx0cmV0dXJuIEJVRkZFUl9TVE9SRVsga2V5IF07XG5cdH1cblxuXHRidWZmZXIgPSBpby5jb250ZXh0LmNyZWF0ZUJ1ZmZlciggbnVtYmVyT2ZDaGFubmVscywgbGVuZ3RoLCBzYW1wbGVSYXRlICk7XG5cblx0Zm9yICggdmFyIGMgPSAwOyBjIDwgbnVtYmVyT2ZDaGFubmVsczsgKytjICkge1xuXHRcdGNoYW5uZWxEYXRhID0gYnVmZmVyLmdldENoYW5uZWxEYXRhKCBjICk7XG5cblx0XHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSApIHtcblx0XHRcdGNoYW5uZWxEYXRhWyBpIF0gPSBpdGVyYXRvciggaSwgbGVuZ3RoLCBjLCBudW1iZXJPZkNoYW5uZWxzICk7XG5cdFx0fVxuXHR9XG5cblx0QlVGRkVSX1NUT1JFWyBrZXkgXSA9IGJ1ZmZlcjtcblxuXHRyZXR1cm4gYnVmZmVyO1xufTtcblxuXG5CdWZmZXJVdGlscy5maWxsQnVmZmVyID0gZnVuY3Rpb24oIGJ1ZmZlciwgdmFsdWUgKSB7XG5cdHZhciBudW1DaGFubmVscyA9IGJ1ZmZlci5udW1iZXJPZkNoYW5uZWxzLFxuXHRcdGxlbmd0aCA9IGJ1ZmZlci5sZW5ndGgsXG5cdFx0Y2hhbm5lbERhdGE7XG5cblx0Zm9yICggdmFyIGMgPSAwOyBjIDwgbnVtQ2hhbm5lbHM7ICsrYyApIHtcblx0XHRjaGFubmVsRGF0YSA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSggYyApO1xuXHRcdGNoYW5uZWxEYXRhLmZpbGwoIHZhbHVlICk7XG5cdH1cbn07XG5cblxuQnVmZmVyVXRpbHMucmV2ZXJzZUJ1ZmZlciA9IGZ1bmN0aW9uKCBidWZmZXIgKSB7XG5cdGlmICggYnVmZmVyIGluc3RhbmNlb2YgQXVkaW9CdWZmZXIgPT09IGZhbHNlICkge1xuXHRcdGNvbnNvbGUuZXJyb3IoICdgYnVmZmVyYCBhcmd1bWVudCBtdXN0IGJlIGluc3RhbmNlIG9mIEF1ZGlvQnVmZmVyJyApO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdHZhciBudW1DaGFubmVscyA9IGJ1ZmZlci5udW1iZXJPZkNoYW5uZWxzLFxuXHRcdGxlbmd0aCA9IGJ1ZmZlci5sZW5ndGgsXG5cdFx0Y2hhbm5lbERhdGE7XG5cblx0Zm9yICggdmFyIGMgPSAwOyBjIDwgbnVtQ2hhbm5lbHM7ICsrYyApIHtcblx0XHRjaGFubmVsRGF0YSA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSggYyApO1xuXHRcdGNoYW5uZWxEYXRhLnJldmVyc2UoKTtcblx0fVxufTtcblxuQnVmZmVyVXRpbHMuY2xvbmVCdWZmZXIgPSBmdW5jdGlvbiggYnVmZmVyICkge1xuXHR2YXIgbmV3QnVmZmVyID0gdGhpcy5pby5jcmVhdGVCdWZmZXIoIGJ1ZmZlci5udW1iZXJPZkNoYW5uZWxzLCBidWZmZXIubGVuZ3RoLCBidWZmZXIuc2FtcGxlUmF0ZSApO1xuXG5cdGZvciAoIHZhciBjID0gMDsgYyA8IGJ1ZmZlci5udW1iZXJPZkNoYW5uZWxzOyArK2MgKSB7XG5cdFx0dmFyIGNoYW5uZWxEYXRhID0gbmV3QnVmZmVyLmdldENoYW5uZWxEYXRhKCBjICksXG5cdFx0XHRzb3VyY2VEYXRhID0gYnVmZmVyLmdldENoYW5uZWxEYXRhKCBjICk7XG5cblx0XHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBidWZmZXIubGVuZ3RoOyArK2kgKSB7XG5cdFx0XHRjaGFubmVsRGF0YVsgaSBdID0gc291cmNlRGF0YVsgaSBdO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBuZXdCdWZmZXI7XG59O1xuXG4vLyBUT0RPOlxuLy8gXHQtIFN1cHBvcnQgYnVmZmVycyB3aXRoIG1vcmUgdGhhbiAyIGNoYW5uZWxzLlxuQnVmZmVyVXRpbHMudG9TdGVyZW8gPSBmdW5jdGlvbiggYnVmZmVyICkge1xuXHR2YXIgc3RlcmVvQnVmZmVyLFxuXHRcdGxlbmd0aDtcblxuXHRpZiAoIGJ1ZmZlci5udW1DaGFubmVscyA+PSAyICkge1xuXHRcdGNvbnNvbGUud2FybiggJ0J1ZmZlclV0aWxzLnRvU3RlcmVvIGN1cnJlbnRseSBvbmx5IHN1cHBvcnRzIG1vbm8gYnVmZmVycyBmb3IgdXBtaXhpbmcnICk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0bGVuZ3RoID0gYnVmZmVyLmxlbmd0aDtcblx0c3RlcmVvQnVmZmVyID0gdGhpcy5pby5jcmVhdGVCdWZmZXIoIDIsIGxlbmd0aCwgYnVmZmVyLnNhbXBsZVJhdGUgKTtcblxuXHRmb3IgKCB2YXIgYyA9IDA7IGMgPCAyOyArK2MgKSB7XG5cdFx0dmFyIGNoYW5uZWxEYXRhID0gc3RlcmVvQnVmZmVyLmdldENoYW5uZWxEYXRhKCBjICksXG5cdFx0XHRzb3VyY2VEYXRhID0gYnVmZmVyLmdldENoYW5uZWxEYXRhKCAwICk7XG5cblx0XHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSApIHtcblx0XHRcdGNoYW5uZWxEYXRhWyBpIF0gPSBzb3VyY2VEYXRhWyBpIF07XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHN0ZXJlb0J1ZmZlcjtcbn07XG5cbi8vIFRPRE86XG4vLyBcdC0gVGhlc2UgYmFzaWMgbWF0aCBmdW5jdGlvbnMuIFRoaW5rIG9mIFxuLy8gXHQgIHRoZW0gYXMgYSBidWZmZXItdmVyc2lvbiBvZiBhIHZlY3RvciBsaWIuXG5CdWZmZXJVdGlscy5hZGRCdWZmZXIgPSBmdW5jdGlvbiggYSwgYiApIHt9O1xuXG5cbi8vIGFkZFxuLy8gbXVsdGlwbHlcbi8vIHN1YnRyYWN0XG4vL1xuXG5leHBvcnQgZGVmYXVsdCBCdWZmZXJVdGlsczsiLCJpbXBvcnQgQ09ORklHIGZyb20gJy4vY29uZmlnLmVzNic7XG5pbXBvcnQgJy4vb3ZlcnJpZGVzLmVzNic7XG5pbXBvcnQgc2lnbmFsQ3VydmVzIGZyb20gJy4vc2lnbmFsQ3VydmVzLmVzNic7XG5pbXBvcnQgY29udmVyc2lvbnMgZnJvbSAnLi4vbWl4aW5zL2NvbnZlcnNpb25zLmVzNic7XG5pbXBvcnQgbWF0aCBmcm9tICcuLi9taXhpbnMvbWF0aC5lczYnO1xuaW1wb3J0IEJ1ZmZlckdlbmVyYXRvcnMgZnJvbSAnLi4vYnVmZmVycy9CdWZmZXJHZW5lcmF0b3JzLmVzNic7XG5pbXBvcnQgQnVmZmVyVXRpbHMgZnJvbSAnLi4vYnVmZmVycy9CdWZmZXJVdGlscy5lczYnO1xuaW1wb3J0IFV0aWxzIGZyb20gJy4uL3V0aWxpdGllcy9VdGlscy5lczYnO1xuXG5jbGFzcyBBdWRpb0lPIHtcblxuICAgIHN0YXRpYyBtaXhpbiggdGFyZ2V0LCBzb3VyY2UgKSB7XG4gICAgICAgIGZvciAoIGxldCBpIGluIHNvdXJjZSApIHtcbiAgICAgICAgICAgIGlmICggc291cmNlLmhhc093blByb3BlcnR5KCBpICkgKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0WyBpIF0gPSBzb3VyY2VbIGkgXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBtaXhpblNpbmdsZSggdGFyZ2V0LCBzb3VyY2UsIG5hbWUgKSB7XG4gICAgICAgIHRhcmdldFsgbmFtZSBdID0gc291cmNlO1xuICAgIH1cblxuXG4gICAgY29uc3RydWN0b3IoIGNvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCkgKSB7XG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBjb250ZXh0O1xuXG4gICAgICAgIHRoaXMubWFzdGVyID0gdGhpcy5fY29udGV4dC5kZXN0aW5hdGlvbjtcblxuICAgICAgICAvLyBDcmVhdGUgYW4gYWx3YXlzLW9uICdkcml2ZXInIG5vZGUgdGhhdCBjb25zdGFudGx5IG91dHB1dHMgYSB2YWx1ZVxuICAgICAgICAvLyBvZiAxLlxuICAgICAgICAvL1xuICAgICAgICAvLyBJdCdzIHVzZWQgYnkgYSBmYWlyIGZldyBub2Rlcywgc28gbWFrZXMgc2Vuc2UgdG8gdXNlIHRoZSBzYW1lXG4gICAgICAgIC8vIGRyaXZlciwgcmF0aGVyIHRoYW4gc3BhbW1pbmcgYSBidW5jaCBvZiBXYXZlU2hhcGVyTm9kZXMgYWxsIGFib3V0XG4gICAgICAgIC8vIHRoZSBwbGFjZS4gSXQgY2FuJ3QgYmUgZGVsZXRlZCwgc28gbm8gd29ycmllcyBhYm91dCBicmVha2luZ1xuICAgICAgICAvLyBmdW5jdGlvbmFsaXR5IG9mIG5vZGVzIHRoYXQgZG8gdXNlIGl0IHNob3VsZCBpdCBhdHRlbXB0IHRvIGJlXG4gICAgICAgIC8vIG92ZXJ3cml0dGVuLlxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIHRoaXMsICdjb25zdGFudERyaXZlcicsIHtcbiAgICAgICAgICAgIHdyaXRlYWJsZTogZmFsc2UsXG4gICAgICAgICAgICBnZXQ6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbnN0YW50RHJpdmVyO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoICFjb25zdGFudERyaXZlciB8fCBjb25zdGFudERyaXZlci5jb250ZXh0ICE9PSB0aGlzLmNvbnRleHQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdGFudERyaXZlciA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjb250ZXh0ID0gdGhpcy5jb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IGNvbnRleHQuY3JlYXRlQnVmZmVyKCAxLCA0MDk2LCBjb250ZXh0LnNhbXBsZVJhdGUgKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJEYXRhID0gYnVmZmVyLmdldENoYW5uZWxEYXRhKCAwICksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyU291cmNlID0gY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgYnVmZmVyRGF0YS5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJEYXRhWyBpIF0gPSAxLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvciggbGV0IGJ1ZmZlclZhbHVlIG9mIGJ1ZmZlckRhdGEgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgYnVmZmVyVmFsdWUgPSAxLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlclNvdXJjZS5idWZmZXIgPSBidWZmZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJTb3VyY2UubG9vcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJTb3VyY2Uuc3RhcnQoIDAgKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3RhbnREcml2ZXIgPSBidWZmZXJTb3VyY2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29uc3RhbnREcml2ZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSgpIClcbiAgICAgICAgfSApO1xuICAgIH1cblxuXG5cbiAgICBnZXQgY29udGV4dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHQ7XG4gICAgfVxuXG4gICAgc2V0IGNvbnRleHQoIGNvbnRleHQgKSB7XG4gICAgICAgIGlmICggISggY29udGV4dCBpbnN0YW5jZW9mIEF1ZGlvQ29udGV4dCApICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBcIkludmFsaWQgYXVkaW8gY29udGV4dCBnaXZlbjpcIiArIGNvbnRleHQgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLm1hc3RlciA9IGNvbnRleHQuZGVzdGluYXRpb247XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBBdWRpb0lPLnByb3RvdHlwZSwgc2lnbmFsQ3VydmVzLCAnY3VydmVzJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggQXVkaW9JTy5wcm90b3R5cGUsIGNvbnZlcnNpb25zLCAnY29udmVydCcgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIEF1ZGlvSU8ucHJvdG90eXBlLCBtYXRoLCAnbWF0aCcgKTtcblxuQXVkaW9JTy5CdWZmZXJVdGlscyA9IEJ1ZmZlclV0aWxzO1xuQXVkaW9JTy5CdWZmZXJHZW5lcmF0b3JzID0gQnVmZmVyR2VuZXJhdG9ycztcbkF1ZGlvSU8uVXRpbHMgPSBVdGlscztcblxud2luZG93LkF1ZGlvSU8gPSBBdWRpb0lPO1xuZXhwb3J0IGRlZmF1bHQgQXVkaW9JTzsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcblxudmFyIGdyYXBocyA9IG5ldyBXZWFrTWFwKCk7XG5cbi8vIFRPRE86XG4vLyAgLSBQb3NzaWJseSByZW1vdmUgdGhlIG5lZWQgZm9yIG9ubHkgR2Fpbk5vZGVzXG4vLyAgICBhcyBpbnB1dHMvb3V0cHV0cz8gSXQnbGwgYWxsb3cgZm9yIHN1YmNsYXNzZXNcbi8vICAgIG9mIE5vZGUgdG8gYmUgbW9yZSBlZmZpY2llbnQuLi5cbmNsYXNzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtSW5wdXRzID0gMCwgbnVtT3V0cHV0cyA9IDAgKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gW107XG4gICAgICAgIHRoaXMub3V0cHV0cyA9IFtdO1xuXG4gICAgICAgIC8vIFRoaXMgb2JqZWN0IHdpbGwgaG9sZCBhbnkgdmFsdWVzIHRoYXQgY2FuIGJlXG4gICAgICAgIC8vIGNvbnRyb2xsZWQgd2l0aCBhdWRpbyBzaWduYWxzLlxuICAgICAgICB0aGlzLmNvbnRyb2xzID0ge307XG5cbiAgICAgICAgLy8gQm90aCB0aGVzZSBvYmplY3RzIHdpbGwganVzdCBob2xkIHJlZmVyZW5jZXNcbiAgICAgICAgLy8gdG8gZWl0aGVyIGlucHV0IG9yIG91dHB1dCBub2Rlcy4gSGFuZHkgd2hlblxuICAgICAgICAvLyB3YW50aW5nIHRvIGNvbm5lY3Qgc3BlY2lmaWMgaW5zL291dHMgd2l0aG91dFxuICAgICAgICAvLyBoYXZpbmcgdG8gdXNlIHRoZSBgLmNvbm5lY3QoIC4uLiwgMCwgMSApYCBzeW50YXguXG4gICAgICAgIHRoaXMubmFtZWRJbnB1dHMgPSB7fTtcbiAgICAgICAgdGhpcy5uYW1lZE91dHB1dHMgPSB7fTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1JbnB1dHM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuYWRkSW5wdXRDaGFubmVsKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IG51bU91dHB1dHM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuYWRkT3V0cHV0Q2hhbm5lbCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0R3JhcGgoIGdyYXBoICkge1xuICAgICAgICBncmFwaHMuc2V0KCB0aGlzLCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldEdyYXBoKCkge1xuICAgICAgICByZXR1cm4gZ3JhcGhzLmdldCggdGhpcyApIHx8IHt9O1xuICAgIH1cblxuICAgIGFkZElucHV0Q2hhbm5lbCgpIHtcbiAgICAgICAgdGhpcy5pbnB1dHMucHVzaCggdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKSApO1xuICAgIH1cblxuICAgIGFkZE91dHB1dENoYW5uZWwoKSB7XG4gICAgICAgIHRoaXMub3V0cHV0cy5wdXNoKCB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpICk7XG4gICAgfVxuXG4gICAgX2NsZWFuVXBTaW5nbGUoIGl0ZW0sIHBhcmVudCwga2V5ICkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLy8gSGFuZGxlIGFycmF5cyBieSBsb29waW5nIG92ZXIgdGhlbVxuICAgICAgICAvLyBhbmQgcmVjdXJzaXZlbHkgY2FsbGluZyB0aGlzIGZ1bmN0aW9uIHdpdGggZWFjaFxuICAgICAgICAvLyBhcnJheSBtZW1iZXIuXG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KCBpdGVtICkgKSB7XG4gICAgICAgICAgICBpdGVtLmZvckVhY2goZnVuY3Rpb24oIG5vZGUsIGluZGV4ICkge1xuICAgICAgICAgICAgICAgIHNlbGYuX2NsZWFuVXBTaW5nbGUoIG5vZGUsIGl0ZW0sIGluZGV4ICk7XG4gICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgIHBhcmVudFsga2V5IF0gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXVkaW9JTyBub2Rlcy4uLlxuICAgICAgICBlbHNlIGlmKCBpdGVtICYmIHR5cGVvZiBpdGVtLmNsZWFuVXAgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICBpZiggdHlwZW9mIGl0ZW0uZGlzY29ubmVjdCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICBpdGVtLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaXRlbS5jbGVhblVwKCk7XG5cbiAgICAgICAgICAgIGlmKCBwYXJlbnQgKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50WyBrZXkgXSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBcIk5hdGl2ZVwiIG5vZGVzLlxuICAgICAgICBlbHNlIGlmKCBpdGVtICYmIHR5cGVvZiBpdGVtLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICBpdGVtLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICAgICAgaWYoIHBhcmVudCApIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRbIGtleSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgdGhpcy5fY2xlYW5VcEluT3V0cygpO1xuICAgICAgICB0aGlzLl9jbGVhbklPKCk7XG5cbiAgICAgICAgLy8gRmluZCBhbnkgbm9kZXMgYXQgdGhlIHRvcCBsZXZlbCxcbiAgICAgICAgLy8gZGlzY29ubmVjdCBhbmQgbnVsbGlmeSB0aGVtLlxuICAgICAgICBmb3IoIHZhciBpIGluIHRoaXMgKSB7XG4gICAgICAgICAgICB0aGlzLl9jbGVhblVwU2luZ2xlKCB0aGlzWyBpIF0sIHRoaXMsIGkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERvIHRoZSBzYW1lIGZvciBhbnkgbm9kZXMgaW4gdGhlIGdyYXBoLlxuICAgICAgICBmb3IoIHZhciBpIGluIGdyYXBoICkge1xuICAgICAgICAgICAgdGhpcy5fY2xlYW5VcFNpbmdsZSggZ3JhcGhbIGkgXSwgZ3JhcGgsIGkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIC4uLmFuZCB0aGUgc2FtZSBmb3IgYW55IGNvbnRyb2wgbm9kZXMuXG4gICAgICAgIGZvciggdmFyIGkgaW4gdGhpcy5jb250cm9scyApIHtcbiAgICAgICAgICAgIHRoaXMuX2NsZWFuVXBTaW5nbGUoIHRoaXMuY29udHJvbHNbIGkgXSwgdGhpcy5jb250cm9scywgaSApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmluYWxseSwgYXR0ZW1wdCB0byBkaXNjb25uZWN0IHRoaXMgTm9kZS5cbiAgICAgICAgaWYoIHR5cGVvZiB0aGlzLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IG51bWJlck9mSW5wdXRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHMubGVuZ3RoO1xuICAgIH1cbiAgICBnZXQgbnVtYmVyT2ZPdXRwdXRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzLmxlbmd0aDtcbiAgICB9XG5cbiAgICBnZXQgaW5wdXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5wdXRzLmxlbmd0aCA/IHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA6IG51bGw7XG4gICAgfVxuICAgIHNldCBpbnB1dFZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5pbnB1dHMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgaSBdLmdhaW4udmFsdWUgPSB0aGlzLmludmVydElucHV0UGhhc2UgPyAtdmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBvdXRwdXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3V0cHV0cy5sZW5ndGggPyB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlIDogbnVsbDtcbiAgICB9XG4gICAgc2V0IG91dHB1dFZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5vdXRwdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IHRoaXMuaW52ZXJ0T3V0cHV0UGhhc2UgPyAtdmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBpbnZlcnRJbnB1dFBoYXNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHMubGVuZ3RoID9cbiAgICAgICAgICAgICggdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlIDwgMCApIDpcbiAgICAgICAgICAgIG51bGw7XG4gICAgfVxuICAgIHNldCBpbnZlcnRJbnB1dFBoYXNlKCBpbnZlcnRlZCApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBpbnB1dCwgdjsgaSA8IHRoaXMuaW5wdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgaW5wdXQgPSB0aGlzLmlucHV0c1sgaSBdLmdhaW47XG4gICAgICAgICAgICB2ID0gaW5wdXQudmFsdWU7XG4gICAgICAgICAgICBpbnB1dC52YWx1ZSA9IHYgPCAwID8gKCBpbnZlcnRlZCA/IHYgOiAtdiApIDogKCBpbnZlcnRlZCA/IC12IDogdiApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGludmVydE91dHB1dFBoYXNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzLmxlbmd0aCA/XG4gICAgICAgICAgICAoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPCAwICkgOlxuICAgICAgICAgICAgbnVsbDtcbiAgICB9XG5cbiAgICAvLyBUT0RPOlxuICAgIC8vICAtIHNldFZhbHVlQXRUaW1lP1xuICAgIHNldCBpbnZlcnRPdXRwdXRQaGFzZSggaW52ZXJ0ZWQgKSB7XG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgdjsgaSA8IHRoaXMub3V0cHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHYgPSB0aGlzLm91dHB1dHNbIGkgXS5nYWluLnZhbHVlO1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IHYgPCAwID8gKCBpbnZlcnRlZCA/IHYgOiAtdiApIDogKCBpbnZlcnRlZCA/IC12IDogdiApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBOb2RlLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggTm9kZS5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuVXBJbk91dHMsICdfY2xlYW5VcEluT3V0cycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIE5vZGUucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhbklPLCAnX2NsZWFuSU8nICk7XG5BdWRpb0lPLm1peGluKCBOb2RlLnByb3RvdHlwZSwgY29ubmVjdGlvbnMgKTtcblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOb2RlID0gZnVuY3Rpb24oIG51bUlucHV0cywgbnVtT3V0cHV0cyApIHtcbiAgICByZXR1cm4gbmV3IE5vZGUoIHRoaXMsIG51bUlucHV0cywgbnVtT3V0cHV0cyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTm9kZTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcblxuXG5jbGFzcyBQYXJhbSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSwgZGVmYXVsdFZhbHVlICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLmlucHV0cyA9IHRoaXMub3V0cHV0cyA9IFsgdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKSBdO1xuICAgICAgICB0aGlzLl9jb250cm9sID0gdGhpcy5pbnB1dHNbIDAgXTtcblxuICAgICAgICAvLyBIbW0uLi4gSGFkIHRvIHB1dCB0aGlzIGhlcmUgc28gTm90ZSB3aWxsIGJlIGFibGVcbiAgICAgICAgLy8gdG8gcmVhZCB0aGUgdmFsdWUuLi5cbiAgICAgICAgLy8gVE9ETzpcbiAgICAgICAgLy8gIC0gU2hvdWxkIEkgY3JlYXRlIGEgYC5fdmFsdWVgIHByb3BlcnR5IHRoYXQgd2lsbFxuICAgICAgICAvLyAgICBzdG9yZSB0aGUgdmFsdWVzIHRoYXQgdGhlIFBhcmFtIHNob3VsZCBiZSByZWZsZWN0aW5nXG4gICAgICAgIC8vICAgIChmb3JnZXR0aW5nLCBvZiBjb3Vyc2UsIHRoYXQgYWxsIHRoZSAqVmFsdWVBdFRpbWUgW2V0Yy5dXG4gICAgICAgIC8vICAgIGZ1bmN0aW9ucyBhcmUgZnVuY3Rpb25zIG9mIHRpbWU7IGAuX3ZhbHVlYCBwcm9wIHdvdWxkIGJlXG4gICAgICAgIC8vICAgIHNldCBpbW1lZGlhdGVseSwgd2hpbHN0IHRoZSByZWFsIHZhbHVlIHdvdWxkIGJlIHJhbXBpbmcpXG4gICAgICAgIC8vXG4gICAgICAgIC8vICAtIE9yLCBzaG91bGQgSSBjcmVhdGUgYSBgLl92YWx1ZWAgcHJvcGVydHkgdGhhdCB3aWxsXG4gICAgICAgIC8vICAgIHRydWVseSByZWZsZWN0IHRoZSBpbnRlcm5hbCB2YWx1ZSBvZiB0aGUgR2Fpbk5vZGU/IFdpbGxcbiAgICAgICAgLy8gICAgcmVxdWlyZSBNQUZGUy4uLlxuICAgICAgICB0aGlzLl92YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgPyB2YWx1ZSA6IDEuMDtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLnZhbHVlID0gdGhpcy5fdmFsdWU7XG5cbiAgICAgICAgdGhpcy5zZXRWYWx1ZUF0VGltZSggdGhpcy5fdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgICAgICB0aGlzLmRlZmF1bHRWYWx1ZSA9IHR5cGVvZiBkZWZhdWx0VmFsdWUgPT09ICdudW1iZXInID8gZGVmYXVsdFZhbHVlIDogdGhpcy5fY29udHJvbC5nYWluLmRlZmF1bHRWYWx1ZTtcblxuXG4gICAgICAgIC8vIFRPRE86XG4gICAgICAgIC8vICAtIFNob3VsZCB0aGUgZHJpdmVyIGFsd2F5cyBiZSBjb25uZWN0ZWQ/XG4gICAgICAgIC8vICAtIE5vdCBzdXJlIHdoZXRoZXIgUGFyYW0gc2hvdWxkIG91dHB1dCAwIGlmIHZhbHVlICE9PSBOdW1iZXIuXG4gICAgICAgIGlmICggdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMuaW8uY29uc3RhbnREcml2ZXIuY29ubmVjdCggdGhpcy5fY29udHJvbCApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuZGVmYXVsdFZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLl9jbGVhblVwSW5PdXRzKCk7XG4gICAgICAgIHRoaXMuX2NsZWFuSU8oKTtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLl9jb250cm9sID0gbnVsbDtcbiAgICAgICAgdGhpcy5kZWZhdWx0VmFsdWUgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgIH1cblxuICAgIHNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgc3RhcnRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4uc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSggdmFsdWUsIGVuZFRpbWUgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0VGFyZ2V0QXRUaW1lKCB2YWx1ZSwgc3RhcnRUaW1lLCB0aW1lQ29uc3RhbnQgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5zZXRUYXJnZXRBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUsIHRpbWVDb25zdGFudCApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRWYWx1ZUN1cnZlQXRUaW1lKCB2YWx1ZXMsIHN0YXJ0VGltZSwgZHVyYXRpb24gKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5zZXRWYWx1ZUN1cnZlQXRUaW1lKCB2YWx1ZXMsIHN0YXJ0VGltZSwgZHVyYXRpb24gKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCBzdGFydFRpbWUgKSB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHN0YXJ0VGltZSApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIC8vIHJldHVybiB0aGlzLl9jb250cm9sLmdhaW4udmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cblxuICAgIGdldCBjb250cm9sKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29udHJvbC5nYWluO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBQYXJhbS5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFBhcmFtLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5VcEluT3V0cywgJ19jbGVhblVwSW5PdXRzJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggUGFyYW0ucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhbklPLCAnX2NsZWFuSU8nICk7XG5BdWRpb0lPLm1peGluKCBQYXJhbS5wcm90b3R5cGUsIGNvbm5lY3Rpb25zICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBhcmFtID0gZnVuY3Rpb24oIHZhbHVlLCBkZWZhdWx0VmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBQYXJhbSggdGhpcywgdmFsdWUsIGRlZmF1bHRWYWx1ZSApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgUGFyYW07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4vQXVkaW9JTy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBjb25uZWN0aW9ucyBmcm9tIFwiLi4vbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNlwiO1xuaW1wb3J0IGNsZWFuZXJzIGZyb20gXCIuLi9taXhpbnMvY2xlYW5lcnMuZXM2XCI7XG5cbmNsYXNzIFdhdmVTaGFwZXIge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgY3VydmVPckl0ZXJhdG9yLCBzaXplICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLnNoYXBlciA9IHRoaXMuY29udGV4dC5jcmVhdGVXYXZlU2hhcGVyKCk7XG5cbiAgICAgICAgLy8gSWYgYSBGbG9hdDMyQXJyYXkgaXMgcHJvdmlkZWQsIHVzZSBpdFxuICAgICAgICAvLyBhcyB0aGUgY3VydmUgdmFsdWUuXG4gICAgICAgIGlmICggY3VydmVPckl0ZXJhdG9yIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ICkge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSBjdXJ2ZU9ySXRlcmF0b3I7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhIGZ1bmN0aW9uIGlzIHByb3ZpZGVkLCBjcmVhdGUgYSBjdXJ2ZVxuICAgICAgICAvLyB1c2luZyB0aGUgZnVuY3Rpb24gYXMgYW4gaXRlcmF0b3IuXG4gICAgICAgIGVsc2UgaWYgKCB0eXBlb2YgY3VydmVPckl0ZXJhdG9yID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgc2l6ZSA9IHR5cGVvZiBzaXplID09PSAnbnVtYmVyJyAmJiBzaXplID49IDIgPyBzaXplIDogQ09ORklHLmN1cnZlUmVzb2x1dGlvbjtcblxuICAgICAgICAgICAgdmFyIGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSggc2l6ZSApLFxuICAgICAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgICAgIHggPSAwO1xuXG4gICAgICAgICAgICBmb3IgKCBpOyBpIDwgc2l6ZTsgKytpICkge1xuICAgICAgICAgICAgICAgIHggPSAoIGkgLyBzaXplICkgKiAyIC0gMTtcbiAgICAgICAgICAgICAgICBhcnJheVsgaSBdID0gY3VydmVPckl0ZXJhdG9yKCB4LCBpLCBzaXplICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2hhcGVyLmN1cnZlID0gYXJyYXk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPdGhlcndpc2UsIGRlZmF1bHQgdG8gYSBMaW5lYXIgY3VydmUuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSB0aGlzLmlvLmN1cnZlcy5MaW5lYXI7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlucHV0cyA9IHRoaXMub3V0cHV0cyA9IFsgdGhpcy5zaGFwZXIgXTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLl9jbGVhblVwSW5PdXRzKCk7XG4gICAgICAgIHRoaXMuX2NsZWFuSU8oKTtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuc2hhcGVyID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgY3VydmUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNoYXBlci5jdXJ2ZTtcbiAgICB9XG4gICAgc2V0IGN1cnZlKCBjdXJ2ZSApIHtcbiAgICAgICAgaWYoIGN1cnZlIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ICkge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSBjdXJ2ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggV2F2ZVNoYXBlci5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFdhdmVTaGFwZXIucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhblVwSW5PdXRzLCAnX2NsZWFuVXBJbk91dHMnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBXYXZlU2hhcGVyLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5JTywgJ19jbGVhbklPJyApO1xuQXVkaW9JTy5taXhpbiggV2F2ZVNoYXBlci5wcm90b3R5cGUsIGNvbm5lY3Rpb25zICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVdhdmVTaGFwZXIgPSBmdW5jdGlvbiggY3VydmUsIHNpemUgKSB7XG4gICAgcmV0dXJuIG5ldyBXYXZlU2hhcGVyKCB0aGlzLCBjdXJ2ZSwgc2l6ZSApO1xufTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgY3VydmVSZXNvbHV0aW9uOiA0MDk2LCAvLyBNdXN0IGJlIGFuIGV2ZW4gbnVtYmVyLlxuICAgIGRlZmF1bHRCdWZmZXJTaXplOiA4LFxuXG4gICAgLy8gVXNlZCB3aGVuIGNvbnZlcnRpbmcgbm90ZSBzdHJpbmdzIChlZy4gJ0EjNCcpIHRvIE1JREkgdmFsdWVzLlxuICAgIC8vIEl0J3MgdGhlIG9jdGF2ZSBudW1iZXIgb2YgdGhlIGxvd2VzdCBDIG5vdGUgKE1JREkgbm90ZSAwKS5cbiAgICAvLyBDaGFuZ2UgdGhpcyBpZiB5b3UncmUgdXNlZCB0byBhIERBVyB0aGF0IGRvZXNuJ3QgdXNlIC0yIGFzIHRoZVxuICAgIC8vIGxvd2VzdCBvY3RhdmUuXG4gICAgbG93ZXN0T2N0YXZlOiAtMixcblxuICAgIC8vIExvd2VzdCBhbGxvd2VkIG51bWJlci4gVXNlZCBieSBzb21lIE1hdGhcbiAgICAvLyBmdW5jdGlvbnMsIGVzcGVjaWFsbHkgd2hlbiBjb252ZXJ0aW5nIGJldHdlZW5cbiAgICAvLyBudW1iZXIgZm9ybWF0cyAoaWUuIGh6IC0+IE1JREksIG5vdGUgLT4gTUlESSwgZXRjLiApXG4gICAgLy9cbiAgICAvLyBBbHNvIHVzZWQgaW4gY2FsbHMgdG8gQXVkaW9QYXJhbS5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lXG4gICAgLy8gc28gdGhlcmUncyBubyByYW1waW5nIHRvIDAgKHdoaWNoIHRocm93cyBhbiBlcnJvcikuXG4gICAgZXBzaWxvbjogMC4wMDEsXG5cbiAgICBtaWRpTm90ZVBvb2xTaXplOiA1MDBcbn07IiwiLy8gTmVlZCB0byBvdmVycmlkZSBleGlzdGluZyAuY29ubmVjdCBhbmQgLmRpc2Nvbm5lY3Rcbi8vIGZ1bmN0aW9ucyBmb3IgXCJuYXRpdmVcIiBBdWRpb1BhcmFtcyBhbmQgQXVkaW9Ob2Rlcy4uLlxuLy8gSSBkb24ndCBsaWtlIGRvaW5nIHRoaXMsIGJ1dCBzJ2dvdHRhIGJlIGRvbmUgOihcbiggZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9yaWdpbmFsQXVkaW9Ob2RlQ29ubmVjdCA9IEF1ZGlvTm9kZS5wcm90b3R5cGUuY29ubmVjdCxcbiAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVEaXNjb25uZWN0ID0gQXVkaW9Ob2RlLnByb3RvdHlwZS5kaXNjb25uZWN0LFxuICAgICAgICBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuICAgIEF1ZGlvTm9kZS5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCApIHtcbiAgICAgICAgaWYgKCBub2RlLmlucHV0cyApIHtcbiAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggbm9kZS5pbnB1dHMgKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3QoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0KCBub2RlLmlucHV0c1sgMCBdLCBvdXRwdXRDaGFubmVsLCBpbnB1dENoYW5uZWwgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9Ob2RlICkge1xuICAgICAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVDb25uZWN0LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZUNvbm5lY3QuY2FsbCggdGhpcywgbm9kZSwgb3V0cHV0Q2hhbm5lbCApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIEF1ZGlvTm9kZS5wcm90b3R5cGUuZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCApIHtcbiAgICAgICAgaWYgKCBub2RlICYmIG5vZGUuaW5wdXRzICkge1xuICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBub2RlLmlucHV0cyApICkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoIG5vZGUuaW5wdXRzWyAwIF0sIG91dHB1dENoYW5uZWwsIGlucHV0Q2hhbm5lbCApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb05vZGUgKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZURpc2Nvbm5lY3QuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9QYXJhbSApIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlRGlzY29ubmVjdC5jYWxsKCB0aGlzLCBub2RlLCBvdXRwdXRDaGFubmVsICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlRGlzY29ubmVjdC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQXVkaW9Ob2RlLnByb3RvdHlwZS5jaGFpbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZXMgPSBzbGljZS5jYWxsKCBhcmd1bWVudHMgKSxcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QuY2FsbCggbm9kZSwgbm9kZXNbIGkgXSApO1xuICAgICAgICAgICAgbm9kZSA9IG5vZGVzWyBpIF07XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQXVkaW9Ob2RlLnByb3RvdHlwZS5mYW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVzID0gc2xpY2UuY2FsbCggYXJndW1lbnRzICksXG4gICAgICAgICAgICBub2RlID0gdGhpcztcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgbm9kZS5jb25uZWN0LmNhbGwoIG5vZGUsIG5vZGVzWyBpIF0gKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0oKSApOyIsImltcG9ydCBDT05GSUcgZnJvbSAnLi9jb25maWcuZXM2JztcbmltcG9ydCBtYXRoIGZyb20gJy4uL21peGlucy9NYXRoLmVzNic7XG5cblxubGV0IHNpZ25hbEN1cnZlcyA9IHt9O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0NvbnN0YW50Jywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnTGluZWFyJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnRXF1YWxQb3dlcicsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICksXG4gICAgICAgICAgICBzaW4gPSBNYXRoLnNpbixcbiAgICAgICAgICAgIFBJID0gTWF0aC5QSTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gc2luKCB4ICogMC41ICogUEkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdDdWJlZCcsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICksXG4gICAgICAgICAgICBzaW4gPSBNYXRoLnNpbixcbiAgICAgICAgICAgIFBJID0gTWF0aC5QSSxcbiAgICAgICAgICAgIHBvdyA9IE1hdGgucG93O1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIHggPSBwb3coIHgsIDMgKTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBzaW4oIHggKiAwLjUgKiBQSSApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdSZWN0aWZ5Jywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBoYWxmUmVzb2x1dGlvbiA9IHJlc29sdXRpb24gKiAwLjUsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IC1oYWxmUmVzb2x1dGlvbiwgeCA9IDA7IGkgPCBoYWxmUmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSA+IDAgPyBpIDogLWkgKSAvIGhhbGZSZXNvbHV0aW9uO1xuICAgICAgICAgICAgY3VydmVbIGkgKyBoYWxmUmVzb2x1dGlvbiBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cblxuLy8gTWF0aCBjdXJ2ZXNcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnR3JlYXRlclRoYW5aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA8PSAwID8gMC4wIDogMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnTGVzc1RoYW5aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA+PSAwID8gMCA6IDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0VxdWFsVG9aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA9PT0gMCA/IDEgOiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdSZWNpcHJvY2FsJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IDQwOTYgKiA2MDAsIC8vIEhpZ2hlciByZXNvbHV0aW9uIG5lZWRlZCBoZXJlLlxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgLy8gY3VydmVbIGkgXSA9IHggPT09IDAgPyAxIDogMDtcblxuICAgICAgICAgICAgaWYgKCB4ICE9PSAwICkge1xuICAgICAgICAgICAgICAgIHggPSBNYXRoLnBvdyggeCwgLTEgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1NpbmUnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApLFxuICAgICAgICAgICAgc2luID0gTWF0aC5zaW47XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIChNYXRoLlBJICogMikgLSBNYXRoLlBJO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHNpbiggeCApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnUm91bmQnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDUwLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgKCB4ID4gMCAmJiB4IDw9IDAuNTAwMDEgKSB8fFxuICAgICAgICAgICAgICAgICggeCA8IDAgJiYgeCA+PSAtMC41MDAwMSApXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCB4ID4gMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gMVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgeCA9IC0xO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnU2lnbicsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogMixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBNYXRoLnNpZ24oIHggKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnRmxvb3InLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDUwLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuXG4gICAgICAgICAgICBpZiAoIHggPj0gMC45OTk5ICkge1xuICAgICAgICAgICAgICAgIHggPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIHggPj0gMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCB4IDwgMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gLTE7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdHYXVzc2lhbldoaXRlTm9pc2UnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDIsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gbWF0aC5ucmFuZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnV2hpdGVOb2lzZScsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogMixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnUGlua05vaXNlJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24gKiAyLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgbWF0aC5nZW5lcmF0ZVBpbmtOdW1iZXIoKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gbWF0aC5nZXROZXh0UGlua051bWJlcigpICogMiAtIDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gc2lnbmFsQ3VydmVzOyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBDdXN0b21FbnZlbG9wZSBmcm9tIFwiLi9DdXN0b21FbnZlbG9wZS5lczZcIjtcblxuY2xhc3MgQURCRFNSRW52ZWxvcGUgZXh0ZW5kcyBDdXN0b21FbnZlbG9wZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB0aGlzLnRpbWVzID0ge1xuICAgICAgICAgICAgYXR0YWNrOiAwLjAxLFxuICAgICAgICAgICAgZGVjYXkxOiAwLjUsXG4gICAgICAgICAgICBkZWNheTI6IDAuNSxcbiAgICAgICAgICAgIHJlbGVhc2U6IDAuNVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubGV2ZWxzID0ge1xuICAgICAgICAgICAgaW5pdGlhbDogMCxcbiAgICAgICAgICAgIHBlYWs6IDEsXG4gICAgICAgICAgICBicmVhazogMC41LFxuICAgICAgICAgICAgc3VzdGFpbjogMSxcbiAgICAgICAgICAgIHJlbGVhc2U6IDBcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2luaXRpYWwnLCAwLCB0aGlzLmxldmVscy5pbml0aWFsICk7XG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnYXR0YWNrJywgdGhpcy50aW1lcy5hdHRhY2ssIHRoaXMubGV2ZWxzLnBlYWsgKTtcbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdkZWNheTEnLCB0aGlzLnRpbWVzLmRlY2F5MSwgdGhpcy5sZXZlbHMuYnJlYWsgKTtcbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdkZWNheTInLCB0aGlzLnRpbWVzLmRlY2F5MiwgdGhpcy5sZXZlbHMuc3VzdGFpbiApO1xuICAgICAgICB0aGlzLmFkZEVuZFN0ZXAoICdyZWxlYXNlJywgdGhpcy50aW1lcy5yZWxlYXNlLCB0aGlzLmxldmVscy5yZWxlYXNlLCB0cnVlICk7XG4gICAgfVxuXG4gICAgZ2V0IGF0dGFja1RpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLmF0dGFjaztcbiAgICB9XG4gICAgc2V0IGF0dGFja1RpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5hdHRhY2sgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ2F0dGFjaycsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IGRlY2F5MVRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLmRlY2F5MTtcbiAgICB9XG4gICAgc2V0IGRlY2F5MVRpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5kZWNheTEgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ2RlY2F5MScsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IGRlY2F5MlRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLmRlY2F5MjtcbiAgICB9XG4gICAgc2V0IGRlY2F5MlRpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5kZWNheTIgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ2RlY2F5MicsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHJlbGVhc2VUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5yZWxlYXNlO1xuICAgIH1cbiAgICBzZXQgcmVsZWFzZVRpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5yZWxlYXNlID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdyZWxlYXNlJywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgaW5pdGlhbExldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMuaW5pdGlhbDtcbiAgICB9XG4gICAgc2V0IGluaXRpYWxMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLmluaXRpYWwgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnaW5pdGlhbCcsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBwZWFrTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5wZWFrO1xuICAgIH1cblxuICAgIHNldCBwZWFrTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5wZWFrID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2F0dGFjaycsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgYnJlYWtMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLmJyZWFrO1xuICAgIH1cbiAgICBzZXQgYnJlYWtMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLmJyZWFrID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2RlY2F5MScsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgZ2V0IHN1c3RhaW5MZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnN1c3RhaW47XG4gICAgfVxuICAgIHNldCBzdXN0YWluTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5zdXN0YWluID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2RlY2F5MicsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCByZWxlYXNlTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5yZWxlYXNlO1xuICAgIH1cbiAgICBzZXQgcmVsZWFzZUxldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMucmVsZWFzZSA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdyZWxlYXNlJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQURCRFNSRW52ZWxvcGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEFEQkRTUkVudmVsb3BlKCB0aGlzICk7XG59O1xuXG5leHBvcnRcbmRlZmF1bHQgQURCRFNSRW52ZWxvcGU7IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IEN1c3RvbUVudmVsb3BlIGZyb20gXCIuL0N1c3RvbUVudmVsb3BlLmVzNlwiO1xuXG5jbGFzcyBBREVudmVsb3BlIGV4dGVuZHMgQ3VzdG9tRW52ZWxvcGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdGhpcy50aW1lcyA9IHtcbiAgICAgICAgICAgIGF0dGFjazogMC4wMSxcbiAgICAgICAgICAgIGRlY2F5OiAwLjVcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxldmVscyA9IHtcbiAgICAgICAgICAgIGluaXRpYWw6IDAsXG4gICAgICAgICAgICBwZWFrOiAxXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdpbml0aWFsJywgMCwgdGhpcy5sZXZlbHMuaW5pdGlhbCApO1xuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2F0dGFjaycsIHRoaXMudGltZXMuYXR0YWNrLCB0aGlzLmxldmVscy5wZWFrICk7XG4gICAgICAgIHRoaXMuYWRkRW5kU3RlcCggJ2RlY2F5JywgdGhpcy50aW1lcy5kZWNheSwgdGhpcy5sZXZlbHMuc3VzdGFpbiwgdHJ1ZSApO1xuICAgIH1cblxuICAgIGdldCBhdHRhY2tUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5hdHRhY2s7XG4gICAgfVxuICAgIHNldCBhdHRhY2tUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuYXR0YWNrID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdhdHRhY2snLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBkZWNheVRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLmRlY2F5O1xuICAgIH1cbiAgICBzZXQgZGVjYXlUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuZGVjYXkgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ2RlY2F5JywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGluaXRpYWxMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLmluaXRpYWw7XG4gICAgfVxuICAgIHNldCBpbml0aWFsTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5pbml0aWFsID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2luaXRpYWwnLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgcGVha0xldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMucGVhaztcbiAgICB9XG5cbiAgICBzZXQgcGVha0xldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMucGVhayA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdhdHRhY2snLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBREVudmVsb3BlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBBREVudmVsb3BlKCB0aGlzICk7XG59O1xuXG5leHBvcnRcbmRlZmF1bHQgQURFbnZlbG9wZTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgQ3VzdG9tRW52ZWxvcGUgZnJvbSBcIi4vQ3VzdG9tRW52ZWxvcGUuZXM2XCI7XG5cbmNsYXNzIEFEU1JFbnZlbG9wZSBleHRlbmRzIEN1c3RvbUVudmVsb3BlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHRoaXMudGltZXMgPSB7XG4gICAgICAgICAgICBhdHRhY2s6IDAuMDEsXG4gICAgICAgICAgICBkZWNheTogMC41LFxuICAgICAgICAgICAgcmVsZWFzZTogMC41XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sZXZlbHMgPSB7XG4gICAgICAgICAgICBpbml0aWFsOiAwLFxuICAgICAgICAgICAgcGVhazogMSxcbiAgICAgICAgICAgIHN1c3RhaW46IDEsXG4gICAgICAgICAgICByZWxlYXNlOiAwXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdpbml0aWFsJywgMCwgdGhpcy5sZXZlbHMuaW5pdGlhbCApO1xuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2F0dGFjaycsIHRoaXMudGltZXMuYXR0YWNrLCB0aGlzLmxldmVscy5wZWFrICk7XG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnZGVjYXknLCB0aGlzLnRpbWVzLmRlY2F5LCB0aGlzLmxldmVscy5zdXN0YWluICk7XG4gICAgICAgIHRoaXMuYWRkRW5kU3RlcCggJ3JlbGVhc2UnLCB0aGlzLnRpbWVzLnJlbGVhc2UsIHRoaXMubGV2ZWxzLnJlbGVhc2UsIHRydWUgKTtcbiAgICB9XG5cbiAgICBnZXQgYXR0YWNrVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZXMuYXR0YWNrO1xuICAgIH1cbiAgICBzZXQgYXR0YWNrVGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLmF0dGFjayA9IHRpbWU7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBUaW1lKCAnYXR0YWNrJywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgZGVjYXlUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5kZWNheTtcbiAgICB9XG4gICAgc2V0IGRlY2F5VGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLmRlY2F5ID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdkZWNheScsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHJlbGVhc2VUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5yZWxlYXNlO1xuICAgIH1cbiAgICBzZXQgcmVsZWFzZVRpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5yZWxlYXNlID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdyZWxlYXNlJywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgaW5pdGlhbExldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMuaW5pdGlhbDtcbiAgICB9XG4gICAgc2V0IGluaXRpYWxMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLmluaXRpYWwgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnaW5pdGlhbCcsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBwZWFrTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5wZWFrO1xuICAgIH1cblxuICAgIHNldCBwZWFrTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5wZWFrID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2F0dGFjaycsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBzdXN0YWluTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5zdXN0YWluO1xuICAgIH1cbiAgICBzZXQgc3VzdGFpbkxldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMuc3VzdGFpbiA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdkZWNheScsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCByZWxlYXNlTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5yZWxlYXNlO1xuICAgIH1cbiAgICBzZXQgcmVsZWFzZUxldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMucmVsZWFzZSA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdyZWxlYXNlJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQURTUkVudmVsb3BlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBBRFNSRW52ZWxvcGUoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEFEU1JFbnZlbG9wZTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IENPTkZJRyBmcm9tIFwiLi4vY29yZS9jb25maWcuZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5cbmNsYXNzIEN1c3RvbUVudmVsb3BlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMub3JkZXJzID0ge1xuICAgICAgICAgICAgc3RhcnQ6IFtdLFxuICAgICAgICAgICAgc3RvcDogW11cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnN0ZXBzID0ge1xuICAgICAgICAgICAgc3RhcnQ6IHt9LFxuICAgICAgICAgICAgc3RvcDoge31cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBfYWRkU3RlcCggc2VjdGlvbiwgbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgPSBmYWxzZSApIHtcbiAgICAgICAgbGV0IHN0b3BzID0gdGhpcy5zdGVwc1sgc2VjdGlvbiBdO1xuXG4gICAgICAgIGlmICggc3RvcHNbIG5hbWUgXSApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ1N0b3Agd2l0aCBuYW1lIFwiJyArIG5hbWUgKyAnXCIgYWxyZWFkeSBleGlzdHMuJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vcmRlcnNbIHNlY3Rpb24gXS5wdXNoKCBuYW1lICk7XG5cbiAgICAgICAgdGhpcy5zdGVwc1sgc2VjdGlvbiBdWyBuYW1lIF0gPSB7XG4gICAgICAgICAgICB0aW1lOiB0aW1lLFxuICAgICAgICAgICAgbGV2ZWw6IGxldmVsLFxuICAgICAgICAgICAgaXNFeHBvbmVudGlhbDogaXNFeHBvbmVudGlhbFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFkZFN0YXJ0U3RlcCggbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgPSBmYWxzZSApIHtcbiAgICAgICAgdGhpcy5fYWRkU3RlcCggJ3N0YXJ0JywgbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgYWRkRW5kU3RlcCggbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgPSBmYWxzZSApIHtcbiAgICAgICAgdGhpcy5fYWRkU3RlcCggJ3N0b3AnLCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRTdGVwTGV2ZWwoIG5hbWUsIGxldmVsICkge1xuICAgICAgICBsZXQgc3RhcnRJbmRleCA9IHRoaXMub3JkZXJzLnN0YXJ0LmluZGV4T2YoIG5hbWUgKSxcbiAgICAgICAgICAgIGVuZEluZGV4ID0gdGhpcy5vcmRlcnMuc3RvcC5pbmRleE9mKCBuYW1lICk7XG5cbiAgICAgICAgaWYgKCBzdGFydEluZGV4ID09PSAtMSAmJiBlbmRJbmRleCA9PT0gLTEgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdObyBzdGVwIHdpdGggbmFtZSBcIicgKyBuYW1lICsgJ1wiLiBObyBsZXZlbCBzZXQuJyApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzdGFydEluZGV4ICE9PSAtMSApIHtcbiAgICAgICAgICAgIHRoaXMuc3RlcHMuc3RhcnRbIG5hbWUgXS5sZXZlbCA9IHBhcnNlRmxvYXQoIGxldmVsICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnN0b3BbIG5hbWUgXS5sZXZlbCA9IHBhcnNlRmxvYXQoIGxldmVsICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cblxuICAgIHNldFN0ZXBUaW1lKCBuYW1lLCB0aW1lICkge1xuICAgICAgICB2YXIgc3RhcnRJbmRleCA9IHRoaXMub3JkZXJzLnN0YXJ0LmluZGV4T2YoIG5hbWUgKSxcbiAgICAgICAgICAgIGVuZEluZGV4ID0gdGhpcy5vcmRlcnMuc3RvcC5pbmRleE9mKCBuYW1lICk7XG5cbiAgICAgICAgaWYgKCBzdGFydEluZGV4ID09PSAtMSAmJiBlbmRJbmRleCA9PT0gLTEgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdObyBzdGVwIHdpdGggbmFtZSBcIicgKyBuYW1lICsgJ1wiLiBObyB0aW1lIHNldC4nICk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggIT09IC0xICkge1xuICAgICAgICAgICAgdGhpcy5zdGVwcy5zdGFydFsgbmFtZSBdLnRpbWUgPSBwYXJzZUZsb2F0KCB0aW1lICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnN0b3BbIG5hbWUgXS50aW1lID0gcGFyc2VGbG9hdCggdGltZSApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG5cblxuICAgIF90cmlnZ2VyU3RlcCggcGFyYW0sIHN0ZXAsIHN0YXJ0VGltZSApIHtcbiAgICAgICAgLy8gaWYgKCBzdGVwLmlzRXhwb25lbnRpYWwgPT09IHRydWUgKSB7XG4gICAgICAgICAgICAvLyBUaGVyZSdzIHNvbWV0aGluZyBhbWlzcyBoZXJlIVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coIE1hdGgubWF4KCBzdGVwLmxldmVsLCBDT05GSUcuZXBzaWxvbiApLCBzdGFydFRpbWUgKyBzdGVwLnRpbWUgKTtcbiAgICAgICAgICAgIC8vIHBhcmFtLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoIE1hdGgubWF4KCBzdGVwLmxldmVsLCAwLjAxICksIHN0YXJ0VGltZSArIHN0ZXAudGltZSApO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGVsc2Uge1xuICAgICAgICAgICAgcGFyYW0ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIHN0ZXAubGV2ZWwsIHN0YXJ0VGltZSArIHN0ZXAudGltZSApO1xuICAgICAgICAvLyB9XG4gICAgfVxuXG4gICAgX3N0YXJ0U2VjdGlvbiggc2VjdGlvbiwgcGFyYW0sIHN0YXJ0VGltZSwgY2FuY2VsU2NoZWR1bGVkVmFsdWVzICkge1xuICAgICAgICB2YXIgc3RvcE9yZGVyID0gdGhpcy5vcmRlcnNbIHNlY3Rpb24gXSxcbiAgICAgICAgICAgIHN0ZXBzID0gdGhpcy5zdGVwc1sgc2VjdGlvbiBdLFxuICAgICAgICAgICAgbnVtU3RvcHMgPSBzdG9wT3JkZXIubGVuZ3RoLFxuICAgICAgICAgICAgc3RlcDtcblxuICAgICAgICBwYXJhbS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHN0YXJ0VGltZSApO1xuICAgICAgICAvLyBwYXJhbS5zZXRWYWx1ZUF0VGltZSggMCwgc3RhcnRUaW1lICk7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgbnVtU3RvcHM7ICsraSApIHtcbiAgICAgICAgICAgIHN0ZXAgPSBzdGVwc1sgc3RvcE9yZGVyWyBpIF0gXTtcbiAgICAgICAgICAgIHRoaXMuX3RyaWdnZXJTdGVwKCBwYXJhbSwgc3RlcCwgc3RhcnRUaW1lICk7XG4gICAgICAgICAgICBzdGFydFRpbWUgKz0gc3RlcC50aW1lO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBzdGFydCggcGFyYW0sIGRlbGF5ID0gMCApIHtcbiAgICAgICAgaWYgKCBwYXJhbSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gPT09IGZhbHNlICYmIHBhcmFtIGluc3RhbmNlb2YgUGFyYW0gPT09IGZhbHNlICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnQ2FuIG9ubHkgc3RhcnQgYW4gZW52ZWxvcGUgb24gQXVkaW9QYXJhbSBvciBQYXJhbSBpbnN0YW5jZXMuJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc3RhcnRTZWN0aW9uKCAnc3RhcnQnLCBwYXJhbSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgZGVsYXkgKTtcbiAgICB9XG5cbiAgICBzdG9wKCBwYXJhbSwgZGVsYXkgPSAwICkge1xuICAgICAgICB0aGlzLl9zdGFydFNlY3Rpb24oICdzdG9wJywgcGFyYW0sIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIDAuMSArIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgZm9yY2VTdG9wKCBwYXJhbSwgZGVsYXkgPSAwICkge1xuICAgICAgICBwYXJhbS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIGRlbGF5ICk7XG4gICAgICAgIC8vIHBhcmFtLnNldFZhbHVlQXRUaW1lKCBwYXJhbS52YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgZGVsYXkgKTtcbiAgICAgICAgcGFyYW0ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIDAsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIDAuMDAxICk7XG4gICAgfVxuXG4gICAgZ2V0IHRvdGFsU3RhcnRUaW1lKCkge1xuICAgICAgICB2YXIgc3RhcnRzID0gdGhpcy5zdGVwcy5zdGFydCxcbiAgICAgICAgICAgIHRpbWUgPSAwLjA7XG5cbiAgICAgICAgZm9yICggdmFyIGkgaW4gc3RhcnRzICkge1xuICAgICAgICAgICAgdGltZSArPSBzdGFydHNbIGkgXS50aW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRpbWU7XG4gICAgfVxuXG4gICAgZ2V0IHRvdGFsU3RvcFRpbWUoKSB7XG4gICAgICAgIHZhciBzdG9wcyA9IHRoaXMuc3RlcHMuc3RvcCxcbiAgICAgICAgICAgIHRpbWUgPSAwLjA7XG5cbiAgICAgICAgZm9yICggdmFyIGkgaW4gc3RvcHMgKSB7XG4gICAgICAgICAgICB0aW1lICs9IHN0b3BzWyBpIF0udGltZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aW1lO1xuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggQ3VzdG9tRW52ZWxvcGUucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUN1c3RvbUVudmVsb3BlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBDdXN0b21FbnZlbG9wZSggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQ3VzdG9tRW52ZWxvcGU7IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLypcbiAgICBUaGlzIE5vZGUgaXMgYW4gaW1wbGVtZW50YXRpb24gb2Ygb25lIG9mIFNjaHJvZWRlcidzXG4gICAgQWxsUGFzcyBncmFwaHMuIFRoaXMgcGFydGljdWxhciBncmFwaCBpcyBzaG93biBpbiBGaWd1cmUyXG4gICAgaW4gdGhlIGZvbGxvd2luZyBwYXBlcjpcblxuICAgICAgICBNLiBSLiBTY2hyb2VkZXIgLSBOYXR1cmFsIFNvdW5kaW5nIEFydGlmaWNpYWwgUmV2ZXJiZXJhdGlvblxuXG4gICAgICAgIEpvdXJuYWwgb2YgdGhlIEF1ZGlvIEVuZ2luZWVyaW5nIFNvY2lldHksIEp1bHkgMTk2Mi5cbiAgICAgICAgVm9sdW1lIDEwLCBOdW1iZXIgMy5cblxuXG4gICAgSXQncyBhdmFpbGFibGUgaGVyZTpcbiAgICAgICAgaHR0cDovL3d3dy5lY2Uucm9jaGVzdGVyLmVkdS9+emR1YW4vdGVhY2hpbmcvZWNlNDcyL3JlYWRpbmcvU2Nocm9lZGVyXzE5NjIucGRmXG5cblxuICAgIFRoZXJlIGFyZSB0aHJlZSBtYWluIHBhdGhzIGFuIGlucHV0IHNpZ25hbCBjYW4gdGFrZTpcblxuICAgIGluIC0+IC1nYWluIC0+IHN1bTEgLT4gb3V0XG4gICAgaW4gLT4gc3VtMiAtPiBkZWxheSAtPiBnYWluIC0+IHN1bTJcbiAgICBpbiAtPiBzdW0yIC0+IGRlbGF5IC0+IGdhaW4gKDEtZ14yKSAtPiBzdW0xXG5cbiAgICBGb3Igbm93LCB0aGUgc3VtbWluZyBub2RlcyBhcmUgYSBwYXJ0IG9mIHRoZSBmb2xsb3dpbmcgY2xhc3MsXG4gICAgYnV0IGNhbiBlYXNpbHkgYmUgcmVtb3ZlZCBieSBjb25uZWN0aW5nIGAtZ2FpbmAsIGBnYWluYCwgYW5kIGAxLWdhaW5eMmBcbiAgICB0byBgdGhpcy5vdXRwdXRzWzBdYCBhbmQgYC1nYWluYCBhbmQgYGluYCB0byB0aGUgZGVsYXkgZGlyZWN0bHkuXG4gKi9cblxuLy8gVE9ETzpcbi8vICAtIFJlbW92ZSB1bm5lY2Vzc2FyeSBzdW1taW5nIG5vZGVzLlxuY2xhc3MgU2Nocm9lZGVyQWxsUGFzcyBleHRlbmRzIE5vZGUge1xuXG4gICAgY29uc3RydWN0b3IoIGlvLCBkZWxheVRpbWUsIGZlZWRiYWNrICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguc3VtMSA9IGlvLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5zdW0yID0gaW8uY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLnBvc2l0aXZlR2FpbiA9IGlvLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZUdhaW4gPSBpby5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgubmVnYXRlID0gaW8uY3JlYXRlTmVnYXRlKCk7XG4gICAgICAgIGdyYXBoLmRlbGF5ID0gaW8uY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICBncmFwaC5vbmVNaW51c0dhaW5TcXVhcmVkID0gaW8uY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm1pbnVzT25lID0gaW8uY3JlYXRlU3VidHJhY3QoIDEgKTtcbiAgICAgICAgZ3JhcGguZ2FpblNxdWFyZWQgPSBpby5jcmVhdGVTcXVhcmUoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrID0gaW8uY3JlYXRlUGFyYW0oIGZlZWRiYWNrICksXG4gICAgICAgIHRoaXMuY29udHJvbHMuZGVsYXlUaW1lID0gaW8uY3JlYXRlUGFyYW0oIGRlbGF5VGltZSApO1xuXG4gICAgICAgIC8vIFplcm8gb3V0IGNvbnRyb2xsZWQgcGFyYW1zLlxuICAgICAgICBncmFwaC5wb3NpdGl2ZUdhaW4uZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlR2Fpbi5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgub25lTWludXNHYWluU3F1YXJlZC5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIGdhaW4gY29udHJvbHNcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5wb3NpdGl2ZUdhaW4uZ2FpbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrLmNvbm5lY3QoIGdyYXBoLm5lZ2F0ZSApO1xuICAgICAgICBncmFwaC5uZWdhdGUuY29ubmVjdCggZ3JhcGgubmVnYXRpdmVHYWluLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5nYWluU3F1YXJlZCApO1xuICAgICAgICBncmFwaC5nYWluU3F1YXJlZC5jb25uZWN0KCBncmFwaC5taW51c09uZSApO1xuICAgICAgICBncmFwaC5taW51c09uZS5jb25uZWN0KCBncmFwaC5vbmVNaW51c0dhaW5TcXVhcmVkLmdhaW4gKTtcblxuICAgICAgICAvLyBjb25uZWN0IGRlbGF5IHRpbWUgY29udHJvbFxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRlbGF5VGltZS5jb25uZWN0KCBncmFwaC5kZWxheS5kZWxheVRpbWUgKTtcblxuICAgICAgICAvLyBGaXJzdCBzaWduYWwgcGF0aDpcbiAgICAgICAgLy8gaW4gLT4gLWdhaW4gLT4gZ3JhcGguc3VtMSAtPiBvdXRcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5uZWdhdGl2ZUdhaW4gKTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVHYWluLmNvbm5lY3QoIGdyYXBoLnN1bTEgKTtcbiAgICAgICAgZ3JhcGguc3VtMS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIFNlY29uZCBzaWduYWwgcGF0aDpcbiAgICAgICAgLy8gKGluIC0+IGdyYXBoLnN1bTIgLT4pIGRlbGF5IC0+IGdhaW4gLT4gZ3JhcGguc3VtMlxuICAgICAgICBncmFwaC5kZWxheS5jb25uZWN0KCBncmFwaC5wb3NpdGl2ZUdhaW4gKTtcbiAgICAgICAgZ3JhcGgucG9zaXRpdmVHYWluLmNvbm5lY3QoIGdyYXBoLnN1bTIgKTtcblxuICAgICAgICAvLyBUaGlyZCBzaWduYWwgcGF0aDpcbiAgICAgICAgLy8gaW4gLT4gZ3JhcGguc3VtMiAtPiBkZWxheSAtPiBnYWluICgxLWdeMikgLT4gZ3JhcGguc3VtMVxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnN1bTIgKTtcbiAgICAgICAgZ3JhcGguc3VtMi5jb25uZWN0KCBncmFwaC5kZWxheSApO1xuICAgICAgICBncmFwaC5kZWxheS5jb25uZWN0KCBncmFwaC5vbmVNaW51c0dhaW5TcXVhcmVkICk7XG4gICAgICAgIGdyYXBoLm9uZU1pbnVzR2FpblNxdWFyZWQuY29ubmVjdCggZ3JhcGguc3VtMSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTY2hyb2VkZXJBbGxQYXNzID0gZnVuY3Rpb24oIGRlbGF5VGltZSwgZmVlZGJhY2sgKSB7XG4gICAgcmV0dXJuIG5ldyBTY2hyb2VkZXJBbGxQYXNzKCB0aGlzLCBkZWxheVRpbWUsIGZlZWRiYWNrICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgRHJ5V2V0Tm9kZSBmcm9tIFwiLi4vLi4vZ3JhcGhzL0RyeVdldE5vZGUuZXM2XCI7XG5cbi8vIFRPRE86IEFkZCBmZWVkYmFja0xldmVsIGFuZCBkZWxheVRpbWUgUGFyYW0gaW5zdGFuY2VzXG4vLyB0byBjb250cm9sIHRoaXMgbm9kZS5cbmNsYXNzIERlbGF5IGV4dGVuZHMgRHJ5V2V0Tm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB0aW1lID0gMCwgZmVlZGJhY2tMZXZlbCA9IDAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbnRyb2wgbm9kZXMuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2sgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBmZWVkYmFja0xldmVsICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudGltZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHRpbWUgKTtcblxuICAgICAgICAvLyBDcmVhdGUgZmVlZGJhY2sgYW5kIGRlbGF5IG5vZGVzXG4gICAgICAgIGdyYXBoLmZlZWRiYWNrID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcblxuICAgICAgICAvLyBTZXR1cCB0aGUgZmVlZGJhY2sgbG9vcFxuICAgICAgICBncmFwaC5kZWxheS5jb25uZWN0KCBncmFwaC5mZWVkYmFjayApO1xuICAgICAgICBncmFwaC5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5kZWxheSApO1xuXG4gICAgICAgIC8vIEFsc28gY29ubmVjdCB0aGUgZGVsYXkgdG8gdGhlIHdldCBvdXRwdXQuXG4gICAgICAgIGdyYXBoLmRlbGF5LmNvbm5lY3QoIHRoaXMud2V0ICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBpbnB1dCB0byBkZWxheVxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmRlbGF5ICk7XG5cbiAgICAgICAgZ3JhcGguZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2suZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lLmNvbm5lY3QoIGdyYXBoLmRlbGF5LmRlbGF5VGltZSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrLmNvbm5lY3QoIGdyYXBoLmZlZWRiYWNrLmdhaW4gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRGVsYXkgPSBmdW5jdGlvbiggdGltZSwgZmVlZGJhY2tMZXZlbCApIHtcbiAgICByZXR1cm4gbmV3IERlbGF5KCB0aGlzLCB0aW1lLCBmZWVkYmFja0xldmVsICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBEZWxheTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IERyeVdldE5vZGUgZnJvbSBcIi4uLy4uL2dyYXBocy9EcnlXZXROb2RlLmVzNlwiO1xuXG4vLyBUT0RPOlxuLy8gIC0gQ29udmVydCB0aGlzIG5vZGUgdG8gdXNlIFBhcmFtIGNvbnRyb2xzXG4vLyAgICBmb3IgdGltZSBhbmQgZmVlZGJhY2suXG5cbmNsYXNzIFBpbmdQb25nRGVsYXkgZXh0ZW5kcyBEcnlXZXROb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHRpbWUgPSAwLjI1LCBmZWVkYmFja0xldmVsID0gMC41ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGNoYW5uZWwgc3BsaXR0ZXIgYW5kIG1lcmdlclxuICAgICAgICBncmFwaC5zcGxpdHRlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoIDIgKTtcbiAgICAgICAgZ3JhcGgubWVyZ2VyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxNZXJnZXIoIDIgKTtcblxuICAgICAgICAvLyBDcmVhdGUgZmVlZGJhY2sgYW5kIGRlbGF5IG5vZGVzXG4gICAgICAgIGdyYXBoLmZlZWRiYWNrTCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrUiA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmRlbGF5TCA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICBncmFwaC5kZWxheVIgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcblxuICAgICAgICAvLyBTZXR1cCB0aGUgZmVlZGJhY2sgbG9vcFxuICAgICAgICBncmFwaC5kZWxheUwuY29ubmVjdCggZ3JhcGguZmVlZGJhY2tMICk7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrTC5jb25uZWN0KCBncmFwaC5kZWxheVIgKTtcbiAgICAgICAgZ3JhcGguZGVsYXlSLmNvbm5lY3QoIGdyYXBoLmZlZWRiYWNrUiApO1xuICAgICAgICBncmFwaC5mZWVkYmFja1IuY29ubmVjdCggZ3JhcGguZGVsYXlMICk7XG5cblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNwbGl0dGVyICk7XG4gICAgICAgIGdyYXBoLnNwbGl0dGVyLmNvbm5lY3QoIGdyYXBoLmRlbGF5TCwgMCApO1xuICAgICAgICBncmFwaC5mZWVkYmFja0wuY29ubmVjdCggZ3JhcGgubWVyZ2VyLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrUi5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGgubWVyZ2VyLmNvbm5lY3QoIHRoaXMud2V0ICk7XG5cbiAgICAgICAgZ3JhcGguZGVsYXlMLmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmRlbGF5Ui5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5mZWVkYmFja0wuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrUi5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnRpbWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2sgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lLmNvbm5lY3QoIGdyYXBoLmRlbGF5TC5kZWxheVRpbWUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lLmNvbm5lY3QoIGdyYXBoLmRlbGF5Ui5kZWxheVRpbWUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5mZWVkYmFja0wuZ2FpbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrLmNvbm5lY3QoIGdyYXBoLmZlZWRiYWNrUi5nYWluICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBpbmdQb25nRGVsYXkgPSBmdW5jdGlvbiggdGltZSwgZmVlZGJhY2tMZXZlbCApIHtcbiAgICByZXR1cm4gbmV3IFBpbmdQb25nRGVsYXkoIHRoaXMsIHRpbWUsIGZlZWRiYWNrTGV2ZWwgKTtcbn07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBEcnlXZXROb2RlIGZyb20gXCIuLi8uLi9ncmFwaHMvRHJ5V2V0Tm9kZS5lczZcIjtcblxuXG5jbGFzcyBTdGVyZW9EZWxheSBleHRlbmRzIERyeVdldE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgY29udHJvbCBub2Rlcy5cbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjayA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lTCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lUiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgICAgICBncmFwaC5zcGxpdHRlciA9IHRoaXMuaW8uY3JlYXRlU3BsaXR0ZXIoIDIgKTtcbiAgICAgICAgZ3JhcGguZGVsYXlMID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIGdyYXBoLmRlbGF5UiA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICBncmFwaC5mZWVkYmFja0wgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5mZWVkYmFja1IgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5tZXJnZXIgPSB0aGlzLmlvLmNyZWF0ZU1lcmdlciggMiApO1xuXG4gICAgICAgIGdyYXBoLmRlbGF5TC5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5kZWxheVIuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2tMLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5mZWVkYmFja1IuZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgZ3JhcGguZGVsYXlMLmNvbm5lY3QoIGdyYXBoLmZlZWRiYWNrTCApO1xuICAgICAgICBncmFwaC5mZWVkYmFja0wuY29ubmVjdCggZ3JhcGguZGVsYXlMICk7XG4gICAgICAgIGdyYXBoLmRlbGF5Ui5jb25uZWN0KCBncmFwaC5mZWVkYmFja1IgKTtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2tSLmNvbm5lY3QoIGdyYXBoLmRlbGF5UiApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2suY29ubmVjdCggZ3JhcGguZmVlZGJhY2tMLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5mZWVkYmFja1IuZ2FpbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnRpbWVMLmNvbm5lY3QoIGdyYXBoLmRlbGF5TC5kZWxheVRpbWUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lUi5jb25uZWN0KCBncmFwaC5kZWxheVIuZGVsYXlUaW1lICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zcGxpdHRlciApO1xuICAgICAgICBncmFwaC5zcGxpdHRlci5jb25uZWN0KCBncmFwaC5kZWxheUwsIDAgKTtcbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIuY29ubmVjdCggZ3JhcGguZGVsYXlSLCAxICk7XG4gICAgICAgIGdyYXBoLmRlbGF5TC5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguZGVsYXlSLmNvbm5lY3QoIGdyYXBoLm1lcmdlciwgMCwgMSApO1xuICAgICAgICBncmFwaC5tZXJnZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3RlcmVvRGVsYXkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFN0ZXJlb0RlbGF5KCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTdGVyZW9EZWxheTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxudmFyIEZJTFRFUl9TVE9SRSA9IG5ldyBXZWFrTWFwKCk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUZpbHRlciggaW8sIHR5cGUgKSB7XG4gICAgdmFyIGdyYXBoID0ge1xuICAgICAgICBmaWx0ZXI6IGlvLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCksXG4gICAgICAgIGNvbnRyb2xzOiB7fSxcbiAgICAgICAgdHlwZTogdW5kZWZpbmVkXG4gICAgfTtcblxuICAgIGdyYXBoLmZpbHRlci5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgIGdyYXBoLmZpbHRlci5RLnZhbHVlID0gMDtcblxuICAgIGdyYXBoLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IGlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgZ3JhcGguY29udHJvbHMuUSA9IGlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICBncmFwaC5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGguZmlsdGVyLmZyZXF1ZW5jeSApO1xuICAgIGdyYXBoLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGguZmlsdGVyLlEgKTtcblxuICAgIGdyYXBoLnNldFR5cGUgPSBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcblxuICAgICAgICBzd2l0Y2ggKCB0eXBlICkge1xuICAgICAgICAgICAgY2FzZSAnTFAxMic6XG4gICAgICAgICAgICAgICAgdGhpcy5maWx0ZXIudHlwZSA9ICdsb3dwYXNzJztcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnbm90Y2gnOlxuICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyLnR5cGUgPSAnbm90Y2gnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdIUDEyJzpcbiAgICAgICAgICAgICAgICB0aGlzLmZpbHRlci50eXBlID0gJ2hpZ2hwYXNzJztcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIC8vIEZhbGwgdGhyb3VnaCB0byBoYW5kbGUgdGhvc2UgZmlsdGVyXG4gICAgICAgICAgICAgICAgLy8gdHlwZXMgd2l0aCBgZ2FpbmAgQXVkaW9QYXJhbXMuXG4gICAgICAgICAgICBjYXNlICdsb3dzaGVsZic6XG4gICAgICAgICAgICAgICAgdGhpcy5maWx0ZXIudHlwZSA9ICdsb3dzaGVsZic7XG4gICAgICAgICAgICBjYXNlICdoaWdoc2hlbGYnOlxuICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyLnR5cGUgPSAnaGlnaHNoZWxmJztcbiAgICAgICAgICAgIGNhc2UgJ3BlYWtpbmcnOlxuICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyLnR5cGUgPSAncGVha2luZyc7XG4gICAgICAgICAgICAgICAgdGhpcy5maWx0ZXIuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250cm9scy5nYWluID0gaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBncmFwaC5zZXRUeXBlKCB0eXBlICk7XG5cbiAgICByZXR1cm4gZ3JhcGg7XG59XG5cbmNsYXNzIEN1c3RvbUVRIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyBJbml0aWFsbHksIHRoaXMgTm9kZSBpcyBqdXN0IGEgcGFzcy10aHJvdWdoXG4gICAgICAgIC8vIHVudGlsIGZpbHRlcnMgYXJlIGFkZGVkLlxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgYWRkRmlsdGVyKCB0eXBlICkge1xuICAgICAgICB2YXIgZmlsdGVyR3JhcGggPSBjcmVhdGVGaWx0ZXIoIHRoaXMuaW8sIHR5cGUgKSxcbiAgICAgICAgICAgIGZpbHRlcnMgPSBGSUxURVJfU1RPUkUuZ2V0KCB0aGlzICkgfHwgW107XG5cbiAgICAgICAgLy8gSWYgdGhpcyBpcyB0aGUgZmlyc3QgZmlsdGVyIGJlaW5nIGFkZGVkLFxuICAgICAgICAvLyBtYWtlIHN1cmUgaW5wdXQgaXMgY29ubmVjdGVkIGFuZCBmaWx0ZXJcbiAgICAgICAgLy8gaXMgdGhlbiBjb25uZWN0ZWQgdG8gb3V0cHV0LlxuICAgICAgICBpZiAoIGZpbHRlcnMubGVuZ3RoID09PSAwICkge1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5kaXNjb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBmaWx0ZXJHcmFwaC5maWx0ZXIgKTtcbiAgICAgICAgICAgIGZpbHRlckdyYXBoLmZpbHRlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIGFscmVhZHkgZmlsdGVycywgdGhlIGxhc3QgZmlsdGVyXG4gICAgICAgIC8vIGluIHRoZSBncmFwaCB3aWxsIG5lZWQgdG8gYmUgZGlzY29ubmVjdGVkIGZvcm1cbiAgICAgICAgLy8gdGhlIG91dHB1dCBiZWZvcmUgdGhlIG5ldyBmaWx0ZXIgaXMgY29ubmVjdGVkLlxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZpbHRlcnNbIGZpbHRlcnMubGVuZ3RoIC0gMSBdLmZpbHRlci5kaXNjb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICAgICAgZmlsdGVyc1sgZmlsdGVycy5sZW5ndGggLSAxIF0uZmlsdGVyLmNvbm5lY3QoIGZpbHRlckdyYXBoLmZpbHRlciApO1xuICAgICAgICAgICAgZmlsdGVyR3JhcGguZmlsdGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdG9yZSB0aGUgZmlsdGVyIGFuZCBzYXZlIHRoZSBuZXcgZmlsdGVycyBvYmplY3RcbiAgICAgICAgLy8gKGl0IG5lZWRzIHRvIGJlIHNhdmVkIGluIGNhc2UgdGhpcyBpcyB0aGUgZmlyc3RcbiAgICAgICAgLy8gZmlsdGVyIGJlaW5nIGFkZGVkLCBhbmQgdmVyeSBsaXR0bGUgb3ZlcmhlYWQgdG9cbiAgICAgICAgLy8gY2FsbGluZyBgc2V0YCBpZiBpdCdzIG5vdCB0aGUgZmlyc3QgZmlsdGVyIGJlaW5nXG4gICAgICAgIC8vIGFkZGVkKS5cbiAgICAgICAgZmlsdGVycy5wdXNoKCBmaWx0ZXJHcmFwaCApO1xuICAgICAgICBGSUxURVJfU1RPUkUuc2V0KCB0aGlzLCBmaWx0ZXJzICk7XG5cbiAgICAgICAgcmV0dXJuIGZpbHRlckdyYXBoO1xuICAgIH1cblxuICAgIGdldEZpbHRlciggaW5kZXggKSB7XG4gICAgICAgIHJldHVybiBGSUxURVJfU1RPUkUuZ2V0KCB0aGlzIClbIGluZGV4IF07XG4gICAgfVxuXG4gICAgZ2V0QWxsRmlsdGVycygpIHtcbiAgICAgICAgcmV0dXJuIEZJTFRFUl9TVE9SRS5nZXQoIHRoaXMgKTtcbiAgICB9XG5cbiAgICByZW1vdmVGaWx0ZXIoIGZpbHRlckdyYXBoICkge1xuICAgICAgICB2YXIgZmlsdGVycyA9IEZJTFRFUl9TVE9SRS5nZXQoIHRoaXMgKSxcbiAgICAgICAgICAgIGluZGV4ID0gZmlsdGVycy5pbmRleE9mKCBmaWx0ZXJHcmFwaCApO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJlbW92ZUZpbHRlckF0SW5kZXgoIGluZGV4ICk7XG4gICAgfVxuXG4gICAgcmVtb3ZlRmlsdGVyQXRJbmRleCggaW5kZXggKSB7XG4gICAgICAgIHZhciBmaWx0ZXJzID0gRklMVEVSX1NUT1JFLmdldCggdGhpcyApO1xuXG5cbiAgICAgICAgaWYgKCAhZmlsdGVyc1sgaW5kZXggXSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ05vIGZpbHRlciBhdCB0aGUgZ2l2ZW4gaW5kZXg6JywgaW5kZXgsIGZpbHRlcnMgKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRpc2Nvbm5lY3QgdGhlIHJlcXVlc3RlZCBmaWx0ZXJcbiAgICAgICAgLy8gYW5kIHJlbW92ZSBpdCBmcm9tIHRoZSBmaWx0ZXJzIGFycmF5LlxuICAgICAgICBmaWx0ZXJzWyBpbmRleCBdLmZpbHRlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIGZpbHRlcnMuc3BsaWNlKCBpbmRleCwgMSApO1xuXG4gICAgICAgIC8vIElmIGFsbCBmaWx0ZXJzIGhhdmUgYmVlbiByZW1vdmVkLCBjb25uZWN0IHRoZVxuICAgICAgICAvLyBpbnB1dCB0byB0aGUgb3V0cHV0IHNvIGF1ZGlvIHN0aWxsIHBhc3NlcyB0aHJvdWdoLlxuICAgICAgICBpZiAoIGZpbHRlcnMubGVuZ3RoID09PSAwICkge1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIGZpcnN0IGZpbHRlciBoYXMgYmVlbiByZW1vdmVkLCBhbmQgdGhlcmVcbiAgICAgICAgLy8gYXJlIHN0aWxsIGZpbHRlcnMgaW4gdGhlIGFycmF5LCBjb25uZWN0IHRoZSBpbnB1dFxuICAgICAgICAvLyB0byB0aGUgbmV3IGZpcnN0IGZpbHRlci5cbiAgICAgICAgZWxzZSBpZiAoIGluZGV4ID09PSAwICkge1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBmaWx0ZXJzWyAwIF0uZmlsdGVyICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgbGFzdCBmaWx0ZXIgaGFzIGJlZW4gcmVtb3ZlZCwgdGhlXG4gICAgICAgIC8vIG5ldyBsYXN0IGZpbHRlciBtdXN0IGJlIGNvbm5lY3RlZCB0byB0aGUgb3V0cHV0XG4gICAgICAgIGVsc2UgaWYgKCBpbmRleCA9PT0gZmlsdGVycy5sZW5ndGggKSB7XG4gICAgICAgICAgICBmaWx0ZXJzWyBmaWx0ZXJzLmxlbmd0aCAtIDEgXS5maWx0ZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE90aGVyd2lzZSwgdGhlIGluZGV4IG9mIHRoZSBmaWx0ZXIgdGhhdCdzIGJlZW5cbiAgICAgICAgLy8gcmVtb3ZlZCBpc24ndCB0aGUgZmlyc3QsIGxhc3QsIG9yIG9ubHkgaW5kZXggaW4gdGhlXG4gICAgICAgIC8vIGFycmF5LCBzbyBjb25uZWN0IHRoZSBwcmV2aW91cyBmaWx0ZXIgdG8gdGhlIG5ld1xuICAgICAgICAvLyBvbmUgYXQgdGhlIGdpdmVuIGluZGV4LlxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZpbHRlcnNbIGluZGV4IC0gMSBdLmZpbHRlci5jb25uZWN0KCBmaWx0ZXJzWyBpbmRleCBdLmZpbHRlciApO1xuICAgICAgICB9XG5cbiAgICAgICAgRklMVEVSX1NUT1JFLnNldCggdGhpcywgZmlsdGVycyApO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlbW92ZUFsbEZpbHRlcnMoKSB7XG4gICAgICAgIHZhciBmaWx0ZXJzID0gRklMVEVSX1NUT1JFLmdldCggdGhpcyApO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gZmlsdGVycy5sZW5ndGggLSAxOyBpID49IDA7IC0taSApIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRmlsdGVyQXRJbmRleCggaSApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDdXN0b21FUSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgQ3VzdG9tRVEoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEN1c3RvbUVROyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBBbGxQYXNzRmlsdGVyIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlclNsb3BlID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCAyLCAwICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgICAgICAgZ3JhcGgubHAyNGRCID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuXG4gICAgICAgIGdyYXBoLmxwMTJkQi50eXBlID0gJ2FsbHBhc3MnO1xuICAgICAgICBncmFwaC5scDI0ZEIudHlwZSA9ICdhbGxwYXNzJztcbiAgICAgICAgZ3JhcGgubHAxMmRCLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDEyZEIuUS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5RLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnNsb3BlID0gZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbnRyb2xzLmluZGV4O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmxwMTJkQi5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgubHAyNGRCLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGgubHAxMmRCLlEgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmxwMjRkQi5RICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5scDEyZEIgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5scDEyZEIuY29ubmVjdCggZ3JhcGgubHAyNGRCICk7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUFsbFBhc3NGaWx0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEFsbFBhc3NGaWx0ZXIoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEFsbFBhc3NGaWx0ZXI7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIEJQRmlsdGVyIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlclNsb3BlID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCAyLCAwICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgICAgICAgZ3JhcGgubHAyNGRCID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuXG4gICAgICAgIGdyYXBoLmxwMTJkQi50eXBlID0gJ2JhbmRwYXNzJztcbiAgICAgICAgZ3JhcGgubHAyNGRCLnR5cGUgPSAnYmFuZHBhc3MnO1xuICAgICAgICBncmFwaC5scDEyZEIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAyNGRCLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5RLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAyNGRCLlEudmFsdWUgPSAwO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuc2xvcGUgPSBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29udHJvbHMuaW5kZXg7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgubHAxMmRCLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5scDI0ZEIuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5scDEyZEIuUSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGgubHAyNGRCLlEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmxwMTJkQiApO1xuICAgICAgICBncmFwaC5scDEyZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5jb25uZWN0KCBncmFwaC5scDI0ZEIgKTtcbiAgICAgICAgZ3JhcGgubHAyNGRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMSApO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQlBGaWx0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEJQRmlsdGVyKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBCUEZpbHRlcjsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxudmFyIEZJTFRFUl9UWVBFUyA9IFtcbiAgICAnbG93cGFzcycsXG4gICAgJ2JhbmRwYXNzJyxcbiAgICAnaGlnaHBhc3MnLFxuICAgICdub3RjaCcsXG4gICAgJ2xvd3Bhc3MnXG5dO1xuXG5jbGFzcyBGaWx0ZXJCYW5rIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlcjEyZEIgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIEZJTFRFUl9UWVBFUy5sZW5ndGgsIDAgKTtcbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlcjI0ZEIgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIEZJTFRFUl9UWVBFUy5sZW5ndGgsIDAgKTtcbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlclNsb3BlID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCAyLCAwICk7XG4gICAgICAgIGdyYXBoLmZpbHRlcnMxMmRCID0gW107XG4gICAgICAgIGdyYXBoLmZpbHRlcnMyNGRCID0gW107XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5zbG9wZSA9IGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb250cm9scy5pbmRleDtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5maWx0ZXJUeXBlID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZpbHRlclR5cGUuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlcjEyZEIuY29udHJvbHMuaW5kZXggKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5maWx0ZXJUeXBlLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXIyNGRCLmNvbnRyb2xzLmluZGV4ICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBmaXJzdCBzZXQgb2YgMTJkYiBmaWx0ZXJzIChzdGFuZGFyZCBpc3N1ZSB3aXRoIFdlYkF1ZGlvQVBJKVxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBGSUxURVJfVFlQRVMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuXG4gICAgICAgICAgICBmaWx0ZXIudHlwZSA9IEZJTFRFUl9UWVBFU1sgaSBdO1xuICAgICAgICAgICAgZmlsdGVyLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgICAgICBmaWx0ZXIuUS52YWx1ZSA9IDA7XG5cbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGZpbHRlci5mcmVxdWVuY3kgKTtcbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBmaWx0ZXIuUSApO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBmaWx0ZXIgKTtcbiAgICAgICAgICAgIGZpbHRlci5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyMTJkQiwgMCwgaSApO1xuXG4gICAgICAgICAgICBncmFwaC5maWx0ZXJzMTJkQi5wdXNoKCBmaWx0ZXIgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc2Vjb25kIHNldCBvZiAxMmRiIGZpbHRlcnMsXG4gICAgICAgIC8vIHdoZXJlIHRoZSBmaXJzdCBzZXQgd2lsbCBiZSBwaXBlZCBpbnRvIHNvIHdlXG4gICAgICAgIC8vIGVuZCB1cCB3aXRoIGRvdWJsZSB0aGUgcm9sbG9mZiAoMTJkQiAqIDIgPSAyNGRCKS5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgRklMVEVSX1RZUEVTLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdmFyIGZpbHRlciA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcblxuICAgICAgICAgICAgZmlsdGVyLnR5cGUgPSBGSUxURVJfVFlQRVNbIGkgXTtcbiAgICAgICAgICAgIGZpbHRlci5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICAgICAgZmlsdGVyLlEudmFsdWUgPSAwO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggZmlsdGVyICk7XG5cbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGZpbHRlci5mcmVxdWVuY3kgKTtcbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBmaWx0ZXIuUSApO1xuICAgICAgICAgICAgZ3JhcGguZmlsdGVyczEyZEJbIGkgXS5jb25uZWN0KCBmaWx0ZXIgKTtcbiAgICAgICAgICAgIGZpbHRlci5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyMjRkQiwgMCwgaSApO1xuXG4gICAgICAgICAgICBncmFwaC5maWx0ZXJzMjRkQi5wdXNoKCBmaWx0ZXIgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIxMmRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyMjRkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUZpbHRlckJhbmsgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEZpbHRlckJhbmsoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEZpbHRlckJhbms7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIEhQRmlsdGVyIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlclNsb3BlID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCAyLCAwICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgICAgICAgZ3JhcGgubHAyNGRCID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuXG4gICAgICAgIGdyYXBoLmxwMTJkQi50eXBlID0gJ2hpZ2hwYXNzJztcbiAgICAgICAgZ3JhcGgubHAyNGRCLnR5cGUgPSAnaGlnaHBhc3MnO1xuICAgICAgICBncmFwaC5scDEyZEIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAyNGRCLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5RLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAyNGRCLlEudmFsdWUgPSAwO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuc2xvcGUgPSBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29udHJvbHMuaW5kZXg7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgubHAxMmRCLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5scDI0ZEIuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5scDEyZEIuUSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGgubHAyNGRCLlEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmxwMTJkQiApO1xuICAgICAgICBncmFwaC5scDEyZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5jb25uZWN0KCBncmFwaC5scDI0ZEIgKTtcbiAgICAgICAgZ3JhcGgubHAyNGRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMSApO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlSFBGaWx0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEhQRmlsdGVyKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBIUEZpbHRlcjsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgTFBGaWx0ZXIgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIDIsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICBncmFwaC5scDI0ZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG5cbiAgICAgICAgZ3JhcGgubHAxMmRCLnR5cGUgPSAnbG93cGFzcyc7XG4gICAgICAgIGdyYXBoLmxwMjRkQi50eXBlID0gJ2xvd3Bhc3MnO1xuICAgICAgICBncmFwaC5scDEyZEIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAyNGRCLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5RLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAyNGRCLlEudmFsdWUgPSAwO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuc2xvcGUgPSBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29udHJvbHMuaW5kZXg7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgubHAxMmRCLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5scDI0ZEIuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5scDEyZEIuUSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGgubHAyNGRCLlEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmxwMTJkQiApO1xuICAgICAgICBncmFwaC5scDEyZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5jb25uZWN0KCBncmFwaC5scDI0ZEIgKTtcbiAgICAgICAgZ3JhcGgubHAyNGRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMSApO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTFBGaWx0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IExQRmlsdGVyKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBMUEZpbHRlcjsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgTm90Y2hGaWx0ZXIgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIDIsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICBncmFwaC5scDI0ZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG5cbiAgICAgICAgZ3JhcGgubHAxMmRCLnR5cGUgPSAnbm90Y2gnO1xuICAgICAgICBncmFwaC5scDI0ZEIudHlwZSA9ICdub3RjaCc7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAxMmRCLlEudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuUS52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5zbG9wZSA9IGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb250cm9scy5pbmRleDtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5scDEyZEIuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmxwMjRkQi5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmxwMTJkQi5RICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5scDI0ZEIuUSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubHAxMmRCICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCLmNvbm5lY3QoIGdyYXBoLmxwMjRkQiApO1xuICAgICAgICBncmFwaC5scDI0ZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOb3RjaEZpbHRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTm90Y2hGaWx0ZXIoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IE5vdGNoRmlsdGVyOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgRHJ5V2V0Tm9kZSBmcm9tIFwiLi4vLi4vZ3JhcGhzL0RyeVdldE5vZGUuZXM2XCI7XG5cbi8vIFRPRE86IEFkZCBmZWVkYmFja0xldmVsIGFuZCBkZWxheVRpbWUgUGFyYW0gaW5zdGFuY2VzXG4vLyB0byBjb250cm9sIHRoaXMgbm9kZS5cbmNsYXNzIFNpbmVTaGFwZXIgZXh0ZW5kcyBEcnlXZXROb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZHJpdmUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5TaW5lICk7XG4gICAgICAgIHRoaXMuc2hhcGVyRHJpdmUgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLnNoYXBlckRyaXZlLmdhaW4udmFsdWUgPSAxO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5zaGFwZXJEcml2ZSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRyaXZlLmNvbm5lY3QoIHRoaXMuc2hhcGVyRHJpdmUuZ2FpbiApO1xuICAgICAgICB0aGlzLnNoYXBlckRyaXZlLmNvbm5lY3QoIHRoaXMuc2hhcGVyICk7XG4gICAgICAgIHRoaXMuc2hhcGVyLmNvbm5lY3QoIHRoaXMud2V0ICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTaW5lU2hhcGVyID0gZnVuY3Rpb24oIHRpbWUsIGZlZWRiYWNrTGV2ZWwgKSB7XG4gICAgcmV0dXJuIG5ldyBTaW5lU2hhcGVyKCB0aGlzLCB0aW1lLCBmZWVkYmFja0xldmVsICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTaW5lU2hhcGVyOyIsIi8qXG5cdEdyYXBoIGZvciB0aGlzIG5vZGUgaXMgc2hvd24gaW4gdGhlIGZvbGxvd2luZyBwYXBlcjpcblxuXHRcdEJlYXQgRnJlaSAtIERpZ2l0YWwgU291bmQgR2VuZXJhdGlvbiAoQXBwZW5kaXggQzogTWlzY2VsbGFuZW91cyDigJMgMS4gREMgVHJhcClcblx0XHRJQ1NULCBadXJpY2ggVW5pIG9mIEFydHMuXG5cblx0QXZhaWxhYmxlIGhlcmU6XG5cdFx0aHR0cHM6Ly9jb3Vyc2VzLmNzLndhc2hpbmd0b24uZWR1L2NvdXJzZXMvY3NlNDkwcy8xMWF1L1JlYWRpbmdzL0RpZ2l0YWxfU291bmRfR2VuZXJhdGlvbl8xLnBkZlxuXG5cblxuXHRFc3NlbnRpYWxseSwgYSBEQ1RyYXAgcmVtb3ZlcyB0aGUgREMgb2Zmc2V0IG9yIERDIGJpYXNcblx0ZnJvbSB0aGUgaW5jb21pbmcgc2lnbmFsLCB3aGVyZSBhIERDIG9mZnNldCBpcyBlbGVtZW50c1xuXHRvZiB0aGUgc2lnbmFsIHRoYXQgYXJlIGF0IDBIei5cblxuXHRUaGUgZ3JhcGggaXMgYXMgZm9sbG93czpcblxuXHRcdCAgIHwtLS08LS0tPHwgICBpbnB1dFxuXHRcdCAgIHxcdFx0fFx0ICB8XG5cdFx0ICAgLT4gei0xIC0+IC0+IG5lZ2F0ZSAtPiAtPiBvdXRcblx0XHQgICB8XHRcdFx0XHRcdCB8XG5cdFx0ICAgfDwtLS0tLS0tLS0tLS0tLSAqYSA8LXxcblxuXG5cdFRoZSBhLCBvciBhbHBoYSwgdmFsdWUgaXMgY2FsY3VsYXRlZCBpcyBhcyBmb2xsb3dzOlxuXHRcdGBhID0gMlBJZmcgLyBmc2BcblxuXHRXaGVyZSBgZmdgIGRldGVybWluZXMgdGhlICdzcGVlZCcgb2YgdGhlIHRyYXAgKHRoZSAnY3V0b2ZmJyksXG5cdGFuZCBgZnNgIGlzIHRoZSBzYW1wbGUgcmF0ZS4gVGhpcyBjYW4gYmUgZXhwYW5kZWQgaW50byB0aGVcblx0Zm9sbG93aW5nIHRvIGF2b2lkIGEgbW9yZSBleHBlbnNpdmUgZGl2aXNpb24gKGFzIHRoZSByZWNpcHJvY2FsXG5cdG9mIHRoZSBzYW1wbGUgcmF0ZSBjYW4gYmUgY2FsY3VsYXRlZCBiZWZvcmVoYW5kKTpcblx0XHRgYSA9ICgyICogUEkgKiBmZykgKiAoMSAvIGZzKWBcblxuXG5cdEdpdmVuIGFuIGBmZ2Agb2YgNSwgYW5kIHNhbXBsZSByYXRlIG9mIDQ4MDAwLCB3ZSBnZXQ6XG5cdFx0YGEgPSAyICogUEkgKiA1ICogKDEgLyA0ODAwMClgXG5cdFx0YGEgPSA2LjI4MzEgKiA1ICogMi4wODMzM2UtMDVgXG5cdFx0YGEgPSAzMS40MTU1ICogMi4wODMzM2UtMDVgXG5cdFx0YGEgPSAwLjAwMDY1NDQ4ODUzNjE1YC5cbiAqL1xuXG5pbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBEQ1RyYXAgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGN1dG9mZiA9IDUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGN1dG9mZiwgb3IgYGZnYCBjb25zdGFudC5cbiAgICAgICAgLy8gVGhlcmUgd2lsbCByYXJlbHkgYmUgYSBuZWVkIHRvIGNoYW5nZSB0aGlzIHZhbHVlIGZyb21cbiAgICAgICAgLy8gZWl0aGVyIHRoZSBnaXZlbiBvbmUsIG9yIGl0J3MgZGVmYXVsdCBvZiA1LFxuICAgICAgICAvLyBzbyBJJ20gbm90IG1ha2luZyB0aGlzIGludG8gYSBjb250cm9sLlxuICAgICAgICBncmFwaC5jdXRvZmYgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCBjdXRvZmYgKTtcblxuICAgICAgICAvLyBBbHBoYSBjYWxjdWxhdGlvblxuICAgICAgICBncmFwaC5QSTIgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50UEkyKCk7XG4gICAgICAgIGdyYXBoLmN1dG9mZk11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5hbHBoYSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIDEgLyB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSApO1xuICAgICAgICBncmFwaC5QSTIuY29ubmVjdCggZ3JhcGguY3V0b2ZmTXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguY3V0b2ZmLmNvbm5lY3QoIGdyYXBoLmN1dG9mZk11bHRpcGx5LCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmN1dG9mZk11bHRpcGx5LmNvbm5lY3QoIGdyYXBoLmFscGhhLCAwLCAwICk7XG5cbiAgICAgICAgLy8gTWFpbiBncmFwaFxuICAgICAgICBncmFwaC5uZWdhdGUgPSB0aGlzLmlvLmNyZWF0ZU5lZ2F0ZSgpO1xuICAgICAgICBncmFwaC56TWludXNPbmUgPSB0aGlzLmlvLmNyZWF0ZVNhbXBsZURlbGF5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgbWFpbiBncmFwaCBhbmQgYWxwaGEuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubmVnYXRlICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0ZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICBncmFwaC5hbHBoYS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMSApO1xuICAgICAgICBncmFwaC5tdWx0aXBseS5jb25uZWN0KCBncmFwaC56TWludXNPbmUgKTtcbiAgICAgICAgZ3JhcGguek1pbnVzT25lLmNvbm5lY3QoIGdyYXBoLnpNaW51c09uZSApO1xuICAgICAgICBncmFwaC56TWludXNPbmUuY29ubmVjdCggZ3JhcGgubmVnYXRlICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0ZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEQ1RyYXAgPSBmdW5jdGlvbiggY3V0b2ZmICkge1xuICAgIHJldHVybiBuZXcgRENUcmFwKCB0aGlzLCBjdXRvZmYgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcbmltcG9ydCBCdWZmZXJVdGlscyBmcm9tIFwiLi4vLi4vYnVmZmVycy9CdWZmZXJVdGlscy5lczZcIjtcbmltcG9ydCBCdWZmZXJHZW5lcmF0b3JzIGZyb20gXCIuLi8uLi9idWZmZXJzL0J1ZmZlckdlbmVyYXRvcnMuZXM2XCI7XG5cbmNsYXNzIExGTyBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgY3V0b2ZmID0gNSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBub2Rlcy5cbiAgICAgICAgZ3JhcGgub3NjaWxsYXRvciA9IHRoaXMuaW8uY3JlYXRlT3NjaWxsYXRvckJhbmsoKTtcbiAgICAgICAgZ3JhcGgucGhhc2VPZmZzZXQgPSB0aGlzLmlvLmNyZWF0ZVBoYXNlT2Zmc2V0KCk7XG4gICAgICAgIGdyYXBoLmRlcHRoID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguaml0dGVyRGVwdGggPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5qaXR0ZXJPc2NpbGxhdG9yID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuXG4gICAgICAgIGdyYXBoLmppdHRlck9zY2lsbGF0b3IuYnVmZmVyID0gQnVmZmVyVXRpbHMuZ2VuZXJhdGVCdWZmZXIoXG4gICAgICAgICAgICB0aGlzLmlvLCAvLyBjb250ZXh0XG4gICAgICAgICAgICAxLCAvLyBjaGFubmVsc1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKiAyLCAvLyBsZW5ndGhcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlLCAvLyBTYW1wbGVSYXRlXG4gICAgICAgICAgICBCdWZmZXJHZW5lcmF0b3JzLldoaXRlTm9pc2UgLy8gR2VuZXJhdG9yIGZ1bmN0aW9uXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gWmVyby1vdXQgdGhlIGRlcHRoIGdhaW4gbm9kZXMgc28gdGhlIHZhbHVlIFxuICAgICAgICAvLyBvZiB0aGUgZGVwdGggY29udHJvbHMgYXJlbid0IG11bHRpcGxpZWQuXG4gICAgICAgIGdyYXBoLmRlcHRoLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5qaXR0ZXJEZXB0aC5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICAvLyBTZXQgaml0dGVyIG9zY2lsbGF0b3Igc2V0dGluZ3NcbiAgICAgICAgZ3JhcGguaml0dGVyT3NjaWxsYXRvci5sb29wID0gdHJ1ZTtcbiAgICAgICAgZ3JhcGguaml0dGVyT3NjaWxsYXRvci5zdGFydCgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBjb250cm9sc1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IGdyYXBoLm9zY2lsbGF0b3IuY29udHJvbHMuZnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRldHVuZSA9IGdyYXBoLm9zY2lsbGF0b3IuY29udHJvbHMuZGV0dW5lO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLndhdmVmb3JtID0gZ3JhcGgub3NjaWxsYXRvci5jb250cm9scy53YXZlZm9ybTtcbiAgICAgICAgdGhpcy5jb250cm9scy5kZXB0aCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5vZmZzZXQgPSBncmFwaC5waGFzZU9mZnNldC5jb250cm9scy5waGFzZTtcbiAgICAgICAgdGhpcy5jb250cm9scy5qaXR0ZXIgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICAgICAgLy8gQ29udHJvbCBjb25uZWN0aW9ucy5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgucGhhc2VPZmZzZXQuY29udHJvbHMuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZGVwdGguY29ubmVjdCggZ3JhcGguZGVwdGguZ2FpbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmppdHRlci5jb25uZWN0KCBncmFwaC5qaXR0ZXJEZXB0aC5nYWluICk7XG5cbiAgICAgICAgLy8gTWFpbiBMRk8gb3NjIGNvbm5lY3Rpb25zXG4gICAgICAgIGdyYXBoLm9zY2lsbGF0b3IuY29ubmVjdCggZ3JhcGgucGhhc2VPZmZzZXQgKTtcbiAgICAgICAgZ3JhcGgucGhhc2VPZmZzZXQuY29ubmVjdCggZ3JhcGguZGVwdGggKTtcbiAgICAgICAgZ3JhcGguZGVwdGguY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBKaXR0ZXIgY29ubmVjdGlvbnNcbiAgICAgICAgZ3JhcGguaml0dGVyT3NjaWxsYXRvci5jb25uZWN0KCBncmFwaC5qaXR0ZXJEZXB0aCApO1xuICAgICAgICBncmFwaC5qaXR0ZXJEZXB0aC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBzdGFydCggZGVsYXkgPSAwICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkub3NjaWxsYXRvci5zdGFydCggZGVsYXkgKTtcbiAgICB9XG4gICAgc3RvcCggZGVsYXkgPSAwICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkub3NjaWxsYXRvci5zdG9wKCBkZWxheSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTEZPID0gZnVuY3Rpb24oIGN1dG9mZiApIHtcbiAgICByZXR1cm4gbmV3IExGTyggdGhpcywgY3V0b2ZmICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbi8vIEJhc2VkIG9uIHRoZSBmb2xsb3dpbmcgZm9ybXVsYSBmcm9tIE1pY2hhZWwgR3J1aG46XG4vLyAgLSBodHRwOi8vbXVzaWNkc3Aub3JnL3Nob3dBcmNoaXZlQ29tbWVudC5waHA/QXJjaGl2ZUlEPTI1NVxuLy9cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy9cbi8vIENhbGN1bGF0ZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXgncyBjb2VmZmljaWVudHNcbi8vIGNvc19jb2VmID0gY29zKGFuZ2xlKTtcbi8vIHNpbl9jb2VmID0gc2luKGFuZ2xlKTtcbi8vXG4vLyBEbyB0aGlzIHBlciBzYW1wbGVcbi8vIG91dF9sZWZ0ID0gaW5fbGVmdCAqIGNvc19jb2VmIC0gaW5fcmlnaHQgKiBzaW5fY29lZjtcbi8vIG91dF9yaWdodCA9IGluX2xlZnQgKiBzaW5fY29lZiArIGluX3JpZ2h0ICogY29zX2NvZWY7XG4vLyBcbi8vIFJvdGF0aW9uIGlzIGluIHJhZGlhbnMuXG5jbGFzcyBTdGVyZW9Sb3RhdGlvbiBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgcm90YXRpb24gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnJvdGF0aW9uID0gdGhpcy5pby5jcmVhdGVQYXJhbSggcm90YXRpb24gKTtcblxuICAgICAgICBncmFwaC5zcGxpdHRlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoIDIgKTtcbiAgICAgICAgZ3JhcGguY29zID0gdGhpcy5pby5jcmVhdGVDb3MoKTtcbiAgICAgICAgZ3JhcGguc2luID0gdGhpcy5pby5jcmVhdGVTaW4oKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnJvdGF0aW9uLmNvbm5lY3QoIGdyYXBoLmNvcyApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnJvdGF0aW9uLmNvbm5lY3QoIGdyYXBoLnNpbiApO1xuXG4gICAgICAgIGdyYXBoLmxlZnRNdWx0aXBseUNvcyA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubGVmdE11bHRpcGx5U2luID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5yaWdodE11bHRpcGx5Q29zID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5yaWdodE11bHRpcGx5U2luID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5sZWZ0Q29zTWludXNSaWdodFNpbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgZ3JhcGgubGVmdFNpbkFkZFJpZ2h0Q29zID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcblxuXG5cbiAgICAgICAgZ3JhcGguaW5wdXRMZWZ0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguaW5wdXRSaWdodCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm1lcmdlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsTWVyZ2VyKCAyICk7XG5cbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIuY29ubmVjdCggZ3JhcGguaW5wdXRMZWZ0LCAwICk7XG4gICAgICAgIGdyYXBoLnNwbGl0dGVyLmNvbm5lY3QoIGdyYXBoLmlucHV0UmlnaHQsIDEgKTtcblxuICAgICAgICBncmFwaC5pbnB1dExlZnQuY29ubmVjdCggZ3JhcGgubGVmdE11bHRpcGx5Q29zLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmNvcy5jb25uZWN0KCBncmFwaC5sZWZ0TXVsdGlwbHlDb3MsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguaW5wdXRMZWZ0LmNvbm5lY3QoIGdyYXBoLmxlZnRNdWx0aXBseVNpbiwgMCwgMCApO1xuICAgICAgICBncmFwaC5zaW4uY29ubmVjdCggZ3JhcGgubGVmdE11bHRpcGx5U2luLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGguaW5wdXRSaWdodC5jb25uZWN0KCBncmFwaC5yaWdodE11bHRpcGx5U2luLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLnNpbi5jb25uZWN0KCBncmFwaC5yaWdodE11bHRpcGx5U2luLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmlucHV0UmlnaHQuY29ubmVjdCggZ3JhcGgucmlnaHRNdWx0aXBseUNvcywgMCwgMCApO1xuICAgICAgICBncmFwaC5jb3MuY29ubmVjdCggZ3JhcGgucmlnaHRNdWx0aXBseUNvcywgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLmxlZnRNdWx0aXBseUNvcy5jb25uZWN0KCBncmFwaC5sZWZ0Q29zTWludXNSaWdodFNpbiwgMCwgMCApO1xuICAgICAgICBncmFwaC5yaWdodE11bHRpcGx5U2luLmNvbm5lY3QoIGdyYXBoLmxlZnRDb3NNaW51c1JpZ2h0U2luLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmxlZnRNdWx0aXBseVNpbi5jb25uZWN0KCBncmFwaC5sZWZ0U2luQWRkUmlnaHRDb3MsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgucmlnaHRNdWx0aXBseUNvcy5jb25uZWN0KCBncmFwaC5sZWZ0U2luQWRkUmlnaHRDb3MsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5sZWZ0Q29zTWludXNSaWdodFNpbi5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubGVmdFNpbkFkZFJpZ2h0Q29zLmNvbm5lY3QoIGdyYXBoLm1lcmdlciwgMCwgMSApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zcGxpdHRlciApO1xuICAgICAgICBncmFwaC5tZXJnZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLm5hbWVkSW5wdXRzLmxlZnQgPSBncmFwaC5pbnB1dExlZnQ7XG4gICAgICAgIHRoaXMubmFtZWRJbnB1dHMucmlnaHQgPSBncmFwaC5pbnB1dFJpZ2h0O1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTdGVyZW9Sb3RhdGlvbiA9IGZ1bmN0aW9uKCByb3RhdGlvbiApIHtcbiAgICByZXR1cm4gbmV3IFN0ZXJlb1JvdGF0aW9uKCB0aGlzLCByb3RhdGlvbiApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vLyBCYXNlZCBvbiB0aGUgZm9sbG93aW5nIGZvcm11bGEgZnJvbSBNaWNoYWVsIEdydWhuOlxuLy8gIC0gaHR0cDovL211c2ljZHNwLm9yZy9zaG93QXJjaGl2ZUNvbW1lbnQucGhwP0FyY2hpdmVJRD0yNTZcbi8vXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vXG4vLyBUaGUgZ3JhcGggdGhhdCdzIGNyZWF0ZWQgaXMgYXMgZm9sbG93czpcbi8vXG4vLyAgICAgICAgICAgICAgICAgICB8LT4gTCAtPiBsZWZ0QWRkUmlnaHQoIGNoMCApIC0+IHxcbi8vICAgICAgICAgICAgICAgICAgIHwtPiBSIC0+IGxlZnRBZGRSaWdodCggY2gxICkgLT4gfCAtPiBtdWx0aXBseSggMC41ICkgLS0tLS0tPiBtb25vTWludXNTdGVyZW8oIDAgKSAtPiBtZXJnZXIoIDAgKSAvLyBvdXRMXG4vLyBpbnB1dCAtPiBzcGxpdHRlciAtICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8LS0tLS0+IG1vbm9QbHVzU3RlcmVvKCAwICkgLS0+IG1lcmdlciggMSApIC8vIG91dFJcbi8vICAgICAgICAgICAgICAgICAgIHwtPiBMIC0+IHJpZ2h0TWludXNMZWZ0KCBjaDEgKSAtPiB8XG4vLyAgICAgICAgICAgICAgICAgICB8LT4gUiAtPiByaWdodE1pbnVzTGVmdCggY2gwICkgLT4gfCAtPiBtdWx0aXBseSggY29lZiApIC0tLT4gbW9ub01pbnVzU3RlcmVvKCAxICkgLT4gbWVyZ2VyKCAwICkgLy8gb3V0TFxuLy9cbi8vXG5jbGFzcyBTdGVyZW9XaWR0aCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgd2lkdGggKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5zcGxpdHRlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoIDIgKTtcbiAgICAgICAgZ3JhcGguY29lZmZpY2llbnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB3aWR0aCApO1xuICAgICAgICBncmFwaC5jb2VmZmljaWVudEhhbGYgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAwLjUgKTtcbiAgICAgICAgZ3JhcGguaW5wdXRMZWZ0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguaW5wdXRSaWdodCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmxlZnRBZGRSaWdodCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLnJpZ2h0TWludXNMZWZ0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseVBvaW50Rml2ZSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIDAuNSApO1xuICAgICAgICBncmFwaC5tdWx0aXBseUNvZWZmaWNpZW50ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tb25vTWludXNTdGVyZW8gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIGdyYXBoLm1vbm9QbHVzU3RlcmVvID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgZ3JhcGgubWVyZ2VyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxNZXJnZXIoIDIgKTtcblxuICAgICAgICBncmFwaC5jb2VmZmljaWVudC5jb25uZWN0KCBncmFwaC5jb2VmZmljaWVudEhhbGYgKTtcbiAgICAgICAgZ3JhcGguY29lZmZpY2llbnRIYWxmLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5Q29lZmZpY2llbnQsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5zcGxpdHRlci5jb25uZWN0KCBncmFwaC5pbnB1dExlZnQsIDAgKTtcbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIuY29ubmVjdCggZ3JhcGguaW5wdXRSaWdodCwgMSApO1xuICAgICAgICBncmFwaC5pbnB1dExlZnQuY29ubmVjdCggZ3JhcGgubGVmdEFkZFJpZ2h0LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmlucHV0UmlnaHQuY29ubmVjdCggZ3JhcGgubGVmdEFkZFJpZ2h0LCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmlucHV0TGVmdC5jb25uZWN0KCBncmFwaC5yaWdodE1pbnVzTGVmdCwgMCwgMSApO1xuICAgICAgICBncmFwaC5pbnB1dFJpZ2h0LmNvbm5lY3QoIGdyYXBoLnJpZ2h0TWludXNMZWZ0LCAwLCAwICk7XG5cbiAgICAgICAgZ3JhcGgubGVmdEFkZFJpZ2h0LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5UG9pbnRGaXZlICk7XG4gICAgICAgIGdyYXBoLnJpZ2h0TWludXNMZWZ0LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5Q29lZmZpY2llbnQsIDAsIDAgKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseVBvaW50Rml2ZS5jb25uZWN0KCBncmFwaC5tb25vTWludXNTdGVyZW8sIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHlDb2VmZmljaWVudC5jb25uZWN0KCBncmFwaC5tb25vTWludXNTdGVyZW8sIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseVBvaW50Rml2ZS5jb25uZWN0KCBncmFwaC5tb25vUGx1c1N0ZXJlbywgMCwgMCApO1xuICAgICAgICBncmFwaC5tdWx0aXBseUNvZWZmaWNpZW50LmNvbm5lY3QoIGdyYXBoLm1vbm9QbHVzU3RlcmVvLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGgubW9ub01pbnVzU3RlcmVvLmNvbm5lY3QoIGdyYXBoLm1lcmdlciwgMCwgMCApO1xuICAgICAgICBncmFwaC5tb25vUGx1c1N0ZXJlby5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNwbGl0dGVyICk7XG4gICAgICAgIGdyYXBoLm1lcmdlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMubmFtZWRJbnB1dHMubGVmdCA9IGdyYXBoLmlucHV0TGVmdDtcbiAgICAgICAgdGhpcy5uYW1lZElucHV0cy5yaWdodCA9IGdyYXBoLmlucHV0UmlnaHQ7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy53aWR0aCA9IGdyYXBoLmNvZWZmaWNpZW50O1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTdGVyZW9XaWR0aCA9IGZ1bmN0aW9uKCB3aWR0aCApIHtcbiAgICByZXR1cm4gbmV3IFN0ZXJlb1dpZHRoKCB0aGlzLCB3aWR0aCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5cbmNsYXNzIE9zY2lsbGF0b3JHZW5lcmF0b3Ige1xuICAgIGNvbnN0cnVjdG9yKCBpbywgZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmVmb3JtICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLmZyZXF1ZW5jeSA9IGZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5kZXR1bmUgPSBkZXR1bmU7XG4gICAgICAgIHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eTtcbiAgICAgICAgdGhpcy5nbGlkZVRpbWUgPSBnbGlkZVRpbWU7XG4gICAgICAgIHRoaXMud2F2ZSA9IHdhdmVmb3JtIHx8ICdzaW5lJztcbiAgICAgICAgdGhpcy5yZXNldFRpbWVzdGFtcCA9IDAuMDtcblxuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IHRoaXMuY29udGV4dC5jcmVhdGVPc2NpbGxhdG9yKCksXG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaCA9IHRoaXMuX21ha2VWZWxvY2l0eUdyYXBoKCB2ZWxvY2l0eSApO1xuICAgICAgICB0aGlzLm91dHB1dHMgPSBbIHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCkgXTtcbiAgICAgICAgdGhpcy5yZXNldCggdGhpcy5mcmVxdWVuY3ksIHRoaXMuZGV0dW5lLCB0aGlzLnZlbG9jaXR5LCB0aGlzLmdsaWRlVGltZSwgdGhpcy53YXZlICk7XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IuY29ubmVjdCggdGhpcy52ZWxvY2l0eUdyYXBoICk7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIF9tYWtlVmVsb2NpdHlHcmFwaCgpIHtcbiAgICAgICAgdmFyIGdhaW4gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICByZXR1cm4gZ2FpbjtcbiAgICB9XG5cbiAgICBfcmVzZXRWZWxvY2l0eUdyYXBoKCB2ZWxvY2l0eSApIHtcbiAgICAgICAgdGhpcy52ZWxvY2l0eUdyYXBoLmdhaW4udmFsdWUgPSB2ZWxvY2l0eTtcbiAgICB9XG5cbiAgICBfY2xlYW5VcFZlbG9jaXR5R3JhcGgoKSB7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaC5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eUdyYXBoID0gbnVsbDtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0gPSBudWxsO1xuICAgICAgICB0aGlzLm91dHB1dHMgPSBudWxsO1xuICAgIH1cblxuICAgIGxlcnAoIHN0YXJ0LCBlbmQsIGRlbHRhICkge1xuICAgICAgICByZXR1cm4gc3RhcnQgKyAoICggZW5kIC0gc3RhcnQgKSAqIGRlbHRhICk7XG4gICAgfVxuXG4gICAgcmVzZXQoIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlICkge1xuICAgICAgICB2YXIgbm93ID0gdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgIGZyZXF1ZW5jeSA9IHR5cGVvZiBmcmVxdWVuY3kgPT09ICdudW1iZXInID8gZnJlcXVlbmN5IDogdGhpcy5mcmVxdWVuY3k7XG4gICAgICAgIGRldHVuZSA9IHR5cGVvZiBkZXR1bmUgPT09ICdudW1iZXInID8gZGV0dW5lIDogdGhpcy5kZXR1bmU7XG4gICAgICAgIHZlbG9jaXR5ID0gdHlwZW9mIHZlbG9jaXR5ID09PSAnbnVtYmVyJyA/IHZlbG9jaXR5IDogdGhpcy52ZWxvY2l0eTtcbiAgICAgICAgd2F2ZSA9IHR5cGVvZiB3YXZlID09PSAnbnVtYmVyJyA/IHdhdmUgOiB0aGlzLndhdmU7XG5cbiAgICAgICAgdmFyIGdsaWRlVGltZSA9IHR5cGVvZiBnbGlkZVRpbWUgPT09ICdudW1iZXInID8gZ2xpZGVUaW1lIDogMDtcblxuICAgICAgICB0aGlzLl9yZXNldFZlbG9jaXR5R3JhcGgoIHZlbG9jaXR5ICk7XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IuZnJlcXVlbmN5LmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggbm93ICk7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLmRldHVuZS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIG5vdyApO1xuXG4gICAgICAgIC8vIG5vdyArPSAwLjFcblxuICAgICAgICAvLyBpZiAoIHRoaXMuZ2xpZGVUaW1lICE9PSAwLjAgKSB7XG4gICAgICAgIC8vICAgICB2YXIgc3RhcnRGcmVxID0gdGhpcy5mcmVxdWVuY3ksXG4gICAgICAgIC8vICAgICAgICAgZW5kRnJlcSA9IGZyZXF1ZW5jeSxcbiAgICAgICAgLy8gICAgICAgICBmcmVxRGlmZiA9IGVuZEZyZXEgLSBzdGFydEZyZXEsXG4gICAgICAgIC8vICAgICAgICAgc3RhcnRUaW1lID0gdGhpcy5yZXNldFRpbWVzdGFtcCxcbiAgICAgICAgLy8gICAgICAgICBlbmRUaW1lID0gdGhpcy5yZXNldFRpbWVzdGFtcCArIHRoaXMuZ2xpZGVUaW1lLFxuICAgICAgICAvLyAgICAgICAgIGN1cnJlbnRUaW1lID0gbm93IC0gc3RhcnRUaW1lLFxuICAgICAgICAvLyAgICAgICAgIGxlcnBQb3MgPSBjdXJyZW50VGltZSAvIHRoaXMuZ2xpZGVUaW1lLFxuICAgICAgICAvLyAgICAgICAgIGN1cnJlbnRGcmVxID0gdGhpcy5sZXJwKCB0aGlzLmZyZXF1ZW5jeSwgZnJlcXVlbmN5LCBsZXJwUG9zICk7XG5cbiAgICAgICAgLy8gICAgIGlmICggY3VycmVudFRpbWUgPCBnbGlkZVRpbWUgKSB7XG4gICAgICAgIC8vICAgICAgICAgY29uc29sZS5sb2coICdjdXRvZmYnLCBzdGFydEZyZXEsIGN1cnJlbnRGcmVxICk7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZnJlcXVlbmN5LnNldFZhbHVlQXRUaW1lKCBjdXJyZW50RnJlcSwgbm93ICk7XG4gICAgICAgIC8vICAgICB9XG5cblxuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coIHN0YXJ0VGltZSwgZW5kVGltZSwgbm93LCBjdXJyZW50VGltZSApO1xuICAgICAgICAvLyB9XG5cblxuICAgICAgICAvLyBub3cgKz0gMC41O1xuXG4gICAgICAgIGlmICggZ2xpZGVUaW1lICE9PSAwICkge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKCBmcmVxdWVuY3ksIG5vdyArIGdsaWRlVGltZSApO1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZGV0dW5lLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKCBkZXR1bmUsIG5vdyArIGdsaWRlVGltZSApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZnJlcXVlbmN5LnNldFZhbHVlQXRUaW1lKCBmcmVxdWVuY3ksIG5vdyApO1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZGV0dW5lLnNldFZhbHVlQXRUaW1lKCBkZXR1bmUsIG5vdyApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCB0eXBlb2Ygd2F2ZSA9PT0gJ3N0cmluZycgKSB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRvci50eXBlID0gd2F2ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLnR5cGUgPSB0aGlzLndhdmU7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlc2V0VGltZXN0YW1wID0gbm93O1xuICAgICAgICB0aGlzLmdsaWRlVGltZSA9IGdsaWRlVGltZTtcbiAgICAgICAgdGhpcy5mcmVxdWVuY3kgPSBmcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuZGV0dW5lID0gZGV0dW5lO1xuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgICAgIHRoaXMud2F2ZSA9IHdhdmU7XG4gICAgfVxuXG4gICAgc3RhcnQoIGRlbGF5ICkge1xuICAgICAgICB0aGlzLmdlbmVyYXRvci5zdGFydCggZGVsYXkgKTtcbiAgICB9XG5cbiAgICBzdG9wKCBkZWxheSApIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3Iuc3RvcCggZGVsYXkgKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLmdlbmVyYXRvci5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9jbGVhblVwVmVsb2NpdHlHcmFwaCgpO1xuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggT3NjaWxsYXRvckdlbmVyYXRvci5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlT3NjaWxsYXRvckdlbmVyYXRvciA9IGZ1bmN0aW9uKCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZSApIHtcbiAgICByZXR1cm4gbmV3IE9zY2lsbGF0b3JHZW5lcmF0b3IoIHRoaXMsIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIFRPRE86XG4vLyAgLSBUdXJuIGFyZ3VtZW50cyBpbnRvIGNvbnRyb2xsYWJsZSBwYXJhbWV0ZXJzO1xuY2xhc3MgQ291bnRlciBleHRlbmRzIE5vZGUge1xuXG4gICAgY29uc3RydWN0b3IoIGlvLCBpbmNyZW1lbnQsIGxpbWl0LCBzdGVwVGltZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5zdGVwVGltZSA9IHN0ZXBUaW1lIHx8IDEgLyB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZTtcblxuICAgICAgICB0aGlzLmNvbnN0YW50ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaW5jcmVtZW50ICk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG5cbiAgICAgICAgdGhpcy5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICB0aGlzLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IHRoaXMuc3RlcFRpbWU7XG5cbiAgICAgICAgdGhpcy5mZWVkYmFjayA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suY29ubmVjdCggdGhpcy5kZWxheSApO1xuXG4gICAgICAgIHRoaXMubXVsdGlwbHkuY29ubmVjdCggdGhpcy5kZWxheSApO1xuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMuZmVlZGJhY2sgKTtcbiAgICAgICAgdGhpcy5mZWVkYmFjay5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG5cbiAgICAgICAgdGhpcy5sZXNzVGhhbiA9IHRoaXMuaW8uY3JlYXRlTGVzc1RoYW4oIGxpbWl0ICk7XG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5sZXNzVGhhbiApO1xuICAgICAgICAvLyB0aGlzLmxlc3NUaGFuLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2suZ2FpbiApO1xuICAgICAgICB0aGlzLmNvbnN0YW50LmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5sZXNzVGhhbi5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgfVxuXG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICB0aGlzLnN0b3AoKTtcblxuICAgICAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuc3RhcnQoKTtcbiAgICAgICAgfSwgMTYgKTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgaWYoIHRoaXMucnVubmluZyA9PT0gZmFsc2UgKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSB0aGlzLnN0ZXBUaW1lO1xuICAgICAgICAgICAgdGhpcy5sZXNzVGhhbi5jb25uZWN0KCB0aGlzLmZlZWRiYWNrLmdhaW4gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0b3AoKSB7XG4gICAgICAgIGlmKCB0aGlzLnJ1bm5pbmcgPT09IHRydWUgKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMubGVzc1RoYW4uZGlzY29ubmVjdCggdGhpcy5mZWVkYmFjay5nYWluICk7XG4gICAgICAgICAgICB0aGlzLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ291bnRlciA9IGZ1bmN0aW9uKCBpbmNyZW1lbnQsIGxpbWl0LCBzdGVwVGltZSApIHtcbiAgICByZXR1cm4gbmV3IENvdW50ZXIoIHRoaXMsIGluY3JlbWVudCwgbGltaXQsIHN0ZXBUaW1lICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIENyb3NzZmFkZXIgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIG51bUNhc2VzID0gMiwgc3RhcnRpbmdDYXNlID0gMCApIHtcblxuICAgICAgICAvLyBFbnN1cmUgc3RhcnRpbmdDYXNlIGlzIG5ldmVyIDwgMFxuICAgICAgICAvLyBhbmQgbnVtYmVyIG9mIGlucHV0cyBpcyBhbHdheXMgPj0gMiAobm8gcG9pbnRcbiAgICAgICAgLy8geC1mYWRpbmcgYmV0d2VlbiBsZXNzIHRoYW4gdHdvIGlucHV0cyEpXG4gICAgICAgIHN0YXJ0aW5nQ2FzZSA9IE1hdGguYWJzKCBzdGFydGluZ0Nhc2UgKTtcbiAgICAgICAgbnVtQ2FzZXMgPSBNYXRoLm1heCggbnVtQ2FzZXMsIDIgKTtcblxuICAgICAgICBzdXBlciggaW8sIG51bUNhc2VzLCAxICk7XG5cbiAgICAgICAgdGhpcy5jbGFtcHMgPSBbXTtcbiAgICAgICAgdGhpcy5zdWJ0cmFjdHMgPSBbXTtcbiAgICAgICAgdGhpcy54ZmFkZXJzID0gW107XG4gICAgICAgIHRoaXMuY29udHJvbHMuaW5kZXggPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBudW1DYXNlcyAtIDE7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMueGZhZGVyc1sgaSBdID0gdGhpcy5pby5jcmVhdGVEcnlXZXROb2RlKCk7XG4gICAgICAgICAgICB0aGlzLnN1YnRyYWN0c1sgaSBdID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCggaSk7XG4gICAgICAgICAgICB0aGlzLmNsYW1wc1sgaSBdID0gdGhpcy5pby5jcmVhdGVDbGFtcCggMCwgMSApO1xuXG4gICAgICAgICAgICBpZiggaSA9PT0gMCApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0c1sgaSBdLmNvbm5lY3QoIHRoaXMueGZhZGVyc1sgaSBdLmRyeSApO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpICsgMSBdLmNvbm5lY3QoIHRoaXMueGZhZGVyc1sgaSBdLndldCApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy54ZmFkZXJzWyBpIC0gMSBdLmNvbm5lY3QoIHRoaXMueGZhZGVyc1sgaSBdLmRyeSApO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpICsgMSBdLmNvbm5lY3QoIHRoaXMueGZhZGVyc1sgaSBdLndldCApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4LmNvbm5lY3QoIHRoaXMuc3VidHJhY3RzWyBpIF0gKTtcbiAgICAgICAgICAgIHRoaXMuc3VidHJhY3RzWyBpIF0uY29ubmVjdCggdGhpcy5jbGFtcHNbIGkgXSApO1xuICAgICAgICAgICAgdGhpcy5jbGFtcHNbIGkgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS5jb250cm9scy5kcnlXZXQgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMueGZhZGVyc1sgdGhpcy54ZmFkZXJzLmxlbmd0aCAtIDEgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNyb3NzZmFkZXIgPSBmdW5jdGlvbiggbnVtQ2FzZXMsIHN0YXJ0aW5nQ2FzZSApIHtcbiAgICByZXR1cm4gbmV3IENyb3NzZmFkZXIoIHRoaXMsIG51bUNhc2VzLCBzdGFydGluZ0Nhc2UgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IENyb3NzZmFkZXI7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBjb25uZWN0aW9ucyBmcm9tIFwiLi4vbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNlwiO1xuaW1wb3J0IGNsZWFuZXJzIGZyb20gXCIuLi9taXhpbnMvY2xlYW5lcnMuZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbi8vIFRoaXMgZnVuY3Rpb24gY3JlYXRlcyBhIGdyYXBoIHRoYXQgYWxsb3dzIG1vcnBoaW5nXG4vLyBiZXR3ZWVuIHR3byBnYWluIG5vZGVzLlxuLy9cbi8vIEl0IGxvb2tzIGEgbGl0dGxlIGJpdCBsaWtlIHRoaXM6XG4vL1xuLy8gICAgICAgICAgICAgICAgIGRyeSAtPiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0+IHxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ICBHYWluKDAtMSkgICAgLT4gICAgIEdhaW4oLTEpICAgICAtPiAgICAgb3V0cHV0XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZmFkZXIpICAgICAgICAgKGludmVydCBwaGFzZSkgICAgICAgIChzdW1taW5nKVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgXlxuLy8gICAgd2V0IC0+ICAgR2FpbigtMSkgICAtPiAtfFxuLy8gICAgICAgICAgKGludmVydCBwaGFzZSlcbi8vXG4vLyBXaGVuIGFkanVzdGluZyB0aGUgZmFkZXIncyBnYWluIHZhbHVlIGluIHRoaXMgZ3JhcGgsXG4vLyBpbnB1dDEncyBnYWluIGxldmVsIHdpbGwgY2hhbmdlIGZyb20gMCB0byAxLFxuLy8gd2hpbHN0IGlucHV0MidzIGdhaW4gbGV2ZWwgd2lsbCBjaGFuZ2UgZnJvbSAxIHRvIDAuXG5jbGFzcyBEcnlXZXROb2RlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDIsIDEgKTtcblxuICAgICAgICB0aGlzLmRyeSA9IHRoaXMuaW5wdXRzWyAwIF07XG4gICAgICAgIHRoaXMud2V0ID0gdGhpcy5pbnB1dHNbIDEgXTtcblxuICAgICAgICAvLyBJbnZlcnQgd2V0IHNpZ25hbCdzIHBoYXNlXG4gICAgICAgIHRoaXMud2V0SW5wdXRJbnZlcnQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLndldElucHV0SW52ZXJ0LmdhaW4udmFsdWUgPSAtMTtcbiAgICAgICAgdGhpcy53ZXQuY29ubmVjdCggdGhpcy53ZXRJbnB1dEludmVydCApO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgZmFkZXIgbm9kZVxuICAgICAgICB0aGlzLmZhZGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5mYWRlci5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbnRyb2wgbm9kZS4gSXQgc2V0cyB0aGUgZmFkZXIncyB2YWx1ZS5cbiAgICAgICAgdGhpcy5kcnlXZXRDb250cm9sID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmRyeVdldENvbnRyb2wuY29ubmVjdCggdGhpcy5mYWRlci5nYWluICk7XG5cbiAgICAgICAgLy8gSW52ZXJ0IHRoZSBmYWRlciBub2RlJ3MgcGhhc2VcbiAgICAgICAgdGhpcy5mYWRlckludmVydCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZmFkZXJJbnZlcnQuZ2Fpbi52YWx1ZSA9IC0xO1xuXG4gICAgICAgIC8vIENvbm5lY3QgZmFkZXIgdG8gZmFkZXIgcGhhc2UgaW52ZXJzaW9uLFxuICAgICAgICAvLyBhbmQgZmFkZXIgcGhhc2UgaW52ZXJzaW9uIHRvIG91dHB1dC5cbiAgICAgICAgdGhpcy53ZXRJbnB1dEludmVydC5jb25uZWN0KCB0aGlzLmZhZGVyICk7XG4gICAgICAgIHRoaXMuZmFkZXIuY29ubmVjdCggdGhpcy5mYWRlckludmVydCApO1xuICAgICAgICB0aGlzLmZhZGVySW52ZXJ0LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBkcnkgaW5wdXQgdG8gYm90aCB0aGUgb3V0cHV0IGFuZCB0aGUgZmFkZXIgbm9kZVxuICAgICAgICB0aGlzLmRyeS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmRyeS5jb25uZWN0KCB0aGlzLmZhZGVyICk7XG5cbiAgICAgICAgLy8gQWRkIGEgJ2RyeVdldCcgcHJvcGVydHkgdG8gdGhlIGNvbnRyb2xzIG9iamVjdC5cbiAgICAgICAgdGhpcy5jb250cm9scy5kcnlXZXQgPSB0aGlzLmRyeVdldENvbnRyb2w7XG4gICAgfVxuXG59XG5cblxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZURyeVdldE5vZGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IERyeVdldE5vZGUoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IERyeVdldE5vZGU7XG4iLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgRVFTaGVsZiBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgaGlnaEZyZXF1ZW5jeSA9IDI1MDAsIGxvd0ZyZXF1ZW5jeSA9IDM1MCwgaGlnaEJvb3N0ID0gLTYsIGxvd0Jvb3N0ID0gMCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5oaWdoRnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaEZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmxvd0ZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd0ZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmhpZ2hCb29zdCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hCb29zdCApO1xuICAgICAgICB0aGlzLmxvd0Jvb3N0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93Qm9vc3QgKTtcblxuICAgICAgICB0aGlzLmxvd1NoZWxmID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICB0aGlzLmxvd1NoZWxmLnR5cGUgPSAnbG93c2hlbGYnO1xuICAgICAgICB0aGlzLmxvd1NoZWxmLmZyZXF1ZW5jeS52YWx1ZSA9IGxvd0ZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5sb3dTaGVsZi5nYWluLnZhbHVlID0gbG93Qm9vc3Q7XG5cbiAgICAgICAgdGhpcy5oaWdoU2hlbGYgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gICAgICAgIHRoaXMuaGlnaFNoZWxmLnR5cGUgPSAnaGlnaHNoZWxmJztcbiAgICAgICAgdGhpcy5oaWdoU2hlbGYuZnJlcXVlbmN5LnZhbHVlID0gaGlnaEZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5oaWdoU2hlbGYuZ2Fpbi52YWx1ZSA9IGhpZ2hCb29zdDtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMubG93U2hlbGYgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmhpZ2hTaGVsZiApO1xuICAgICAgICB0aGlzLmxvd1NoZWxmLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaGlnaFNoZWxmLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgLy8gU3RvcmUgY29udHJvbGxhYmxlIHBhcmFtcy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVE9ETzpcbiAgICAgICAgLy8gIC0gU2hvdWxkIHRoZXNlIGJlIHJlZmVyZW5jZXMgdG8gcGFyYW0uY29udHJvbD8gVGhpc1xuICAgICAgICAvLyAgICBtaWdodCBhbGxvdyBkZWZhdWx0cyB0byBiZSBzZXQgd2hpbHN0IGFsc28gYWxsb3dpbmdcbiAgICAgICAgLy8gICAgYXVkaW8gc2lnbmFsIGNvbnRyb2wuXG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEZyZXF1ZW5jeSA9IHRoaXMuaGlnaEZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dGcmVxdWVuY3kgPSB0aGlzLmxvd0ZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoQm9vc3QgPSB0aGlzLmhpZ2hCb29zdDtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dCb29zdCA9IHRoaXMubG93Qm9vc3Q7XG4gICAgfVxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUVRU2hlbGYgPSBmdW5jdGlvbiggaGlnaEZyZXF1ZW5jeSwgbG93RnJlcXVlbmN5LCBoaWdoQm9vc3QsIGxvd0Jvb3N0ICkge1xuICAgIHJldHVybiBuZXcgRVFTaGVsZiggdGhpcywgaGlnaEZyZXF1ZW5jeSwgbG93RnJlcXVlbmN5LCBoaWdoQm9vc3QsIGxvd0Jvb3N0ICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBFUVNoZWxmOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBQaGFzZU9mZnNldCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsID0gdGhpcy5pby5jcmVhdGVSZWNpcHJvY2FsKCB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSAqIDAuNSApO1xuICAgICAgICB0aGlzLmRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLnBoYXNlID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmhhbGZQaGFzZSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIDAuNSApO1xuXG4gICAgICAgIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmZyZXF1ZW5jeS5jb25uZWN0KCB0aGlzLnJlY2lwcm9jYWwgKTtcbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsLmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5waGFzZS5jb25uZWN0KCB0aGlzLmhhbGZQaGFzZSApO1xuICAgICAgICB0aGlzLmhhbGZQaGFzZS5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAxICk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkuY29ubmVjdCggdGhpcy5kZWxheS5kZWxheVRpbWUgKTtcblxuICAgICAgICAvLyBTaG91bGQgdGhpcyBiZSBjb25uZWN0ZWQhPyBJZiBpdCBpcywgdGhlbiBpdCdzXG4gICAgICAgIC8vIGNyZWF0aW5nLCBlZy4gUFdNIGlmIGEgc3F1YXJlIHdhdmUgaXMgaW5wdXR0ZWQsIFxuICAgICAgICAvLyBzaW5jZSByYXcgaW5wdXQgaXMgYmVpbmcgYmxlbmRlZCB3aXRoIHBoYXNlLW9mZnNldHRlZFxuICAgICAgICAvLyBpbnB1dC5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5kZWxheSApO1xuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDAuNTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuZnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnBoYXNlID0gdGhpcy5waGFzZTtcbiAgICB9XG5cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUGhhc2VPZmZzZXQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFBoYXNlT2Zmc2V0KCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBQaGFzZU9mZnNldDsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuLy8gaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IG1hdGggZnJvbSBcIi4uL21peGlucy9tYXRoLmVzNlwiO1xuLy8gaW1wb3J0IE5vdGUgZnJvbSBcIi4uL25vdGUvTm90ZS5lczZcIjtcbi8vIGltcG9ydCBDaG9yZCBmcm9tIFwiLi4vbm90ZS9DaG9yZC5lczZcIjtcblxuLy8gIFBsYXllclxuLy8gID09PT09PVxuLy8gIFRha2VzIGNhcmUgb2YgcmVxdWVzdGluZyBHZW5lcmF0b3JOb2RlcyBiZSBjcmVhdGVkLlxuLy9cbi8vICBIYXM6XG4vLyAgICAgIC0gUG9seXBob255IChwYXJhbSlcbi8vICAgICAgLSBVbmlzb24gKHBhcmFtKVxuLy8gICAgICAtIFVuaXNvbiBkZXR1bmUgKHBhcmFtKVxuLy8gICAgICAtIFVuaXNvbiBwaGFzZSAocGFyYW0pXG4vLyAgICAgIC0gR2xpZGUgbW9kZVxuLy8gICAgICAtIEdsaWRlIHRpbWVcbi8vICAgICAgLSBWZWxvY2l0eSBzZW5zaXRpdml0eSAocGFyYW0pXG4vLyAgICAgIC0gR2xvYmFsIHR1bmluZyAocGFyYW0pXG4vL1xuLy8gIE1ldGhvZHM6XG4vLyAgICAgIC0gc3RhcnQoIGZyZXEvbm90ZSwgdmVsLCBkZWxheSApXG4vLyAgICAgIC0gc3RvcCggZnJlcS9ub3RlLCB2ZWwsIGRlbGF5IClcbi8vXG4vLyAgUHJvcGVydGllczpcbi8vICAgICAgLSBwb2x5cGhvbnkgKG51bWJlciwgPjEpXG4vLyAgICAgIC0gdW5pc29uIChudW1iZXIsID4xKVxuLy8gICAgICAtIHVuaXNvbkRldHVuZSAobnVtYmVyLCBjZW50cylcbi8vICAgICAgLSB1bmlzb25QaGFzZSAobnVtYmVyLCAwLTEpXG4vLyAgICAgIC0gZ2xpZGVNb2RlIChzdHJpbmcpXG4vLyAgICAgIC0gZ2xpZGVUaW1lIChtcywgbnVtYmVyKVxuLy8gICAgICAtIHZlbG9jaXR5U2Vuc2l0aXZpdHkgKDAtMSwgbnVtYmVyKVxuLy8gICAgICAtIHR1bmluZyAoLTY0LCArNjQsIHNlbWl0b25lcylcbi8vXG5jbGFzcyBHZW5lcmF0b3JQbGF5ZXIgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIG9wdGlvbnMgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIGlmICggb3B0aW9ucy5nZW5lcmF0b3IgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ0dlbmVyYXRvclBsYXllciByZXF1aXJlcyBhIGBnZW5lcmF0b3JgIG9wdGlvbiB0byBiZSBnaXZlbi4nICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IG9wdGlvbnMuZ2VuZXJhdG9yO1xuXG4gICAgICAgIHRoaXMucG9seXBob255ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggb3B0aW9ucy5wb2x5cGhvbnkgfHwgMSApO1xuXG4gICAgICAgIHRoaXMudW5pc29uID0gdGhpcy5pby5jcmVhdGVQYXJhbSggb3B0aW9ucy51bmlzb24gfHwgMSApO1xuICAgICAgICB0aGlzLnVuaXNvbkRldHVuZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHR5cGVvZiBvcHRpb25zLnVuaXNvbkRldHVuZSA9PT0gJ251bWJlcicgPyBvcHRpb25zLnVuaXNvbkRldHVuZSA6IDAgKTtcbiAgICAgICAgdGhpcy51bmlzb25QaGFzZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHR5cGVvZiBvcHRpb25zLnVuaXNvblBoYXNlID09PSAnbnVtYmVyJyA/IG9wdGlvbnMudW5pc29uUGhhc2UgOiAwICk7XG4gICAgICAgIHRoaXMudW5pc29uTW9kZSA9IG9wdGlvbnMudW5pc29uTW9kZSB8fCAnY2VudGVyZWQnO1xuXG4gICAgICAgIHRoaXMuZ2xpZGVNb2RlID0gb3B0aW9ucy5nbGlkZU1vZGUgfHwgJ2VxdWFsJztcbiAgICAgICAgdGhpcy5nbGlkZVRpbWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy5nbGlkZVRpbWUgPT09ICdudW1iZXInID8gb3B0aW9ucy5nbGlkZVRpbWUgOiAwICk7XG5cbiAgICAgICAgdGhpcy52ZWxvY2l0eVNlbnNpdGl2aXR5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMudmVsb2NpdHlTZW5zaXRpdml0eSA9PT0gJ251bWJlcicgPyBvcHRpb25zLnZlbG9jaXR5U2Vuc2l0aXZpdHkgOiAwICk7XG5cbiAgICAgICAgdGhpcy50dW5pbmcgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy50dW5pbmcgPT09ICdudW1iZXInID8gb3B0aW9ucy50dW5pbmcgOiAwICk7XG5cbiAgICAgICAgdGhpcy53YXZlZm9ybSA9IG9wdGlvbnMud2F2ZWZvcm0gfHwgJ3NpbmUnO1xuXG4gICAgICAgIHRoaXMuZW52ZWxvcGUgPSBvcHRpb25zLmVudmVsb3BlIHx8IHRoaXMuaW8uY3JlYXRlQURTUkVudmVsb3BlKCk7XG5cbiAgICAgICAgdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzID0ge307XG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQgPSBbXTtcbiAgICAgICAgdGhpcy50aW1lcnMgPSBbXTtcbiAgICB9XG5cblxuICAgIF9jcmVhdGVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlZm9ybSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdG9yLmNhbGwoIHRoaXMuaW8sIGZyZXF1ZW5jeSwgZGV0dW5lICsgdGhpcy50dW5pbmcudmFsdWUgKiAxMDAsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmVmb3JtICk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGVzIHRoZSBhbW91bnQgb2YgZGV0dW5lIChjZW50cykgdG8gYXBwbHkgdG8gYSBnZW5lcmF0b3Igbm9kZVxuICAgICAqIGdpdmVuIGFuIGluZGV4IGJldHdlZW4gMCBhbmQgdGhpcy51bmlzb24udmFsdWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gdW5pc29uSW5kZXggVW5pc29uIGluZGV4LlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gICAgICAgICAgICAgRGV0dW5lIHZhbHVlLCBpbiBjZW50cy5cbiAgICAgKi9cbiAgICBfY2FsY3VsYXRlRGV0dW5lKCB1bmlzb25JbmRleCApIHtcbiAgICAgICAgdmFyIGRldHVuZSA9IDAuMCxcbiAgICAgICAgICAgIHVuaXNvbkRldHVuZSA9IHRoaXMudW5pc29uRGV0dW5lLnZhbHVlO1xuXG4gICAgICAgIGlmICggdGhpcy51bmlzb25Nb2RlID09PSAnY2VudGVyZWQnICkge1xuICAgICAgICAgICAgdmFyIGluY3IgPSB1bmlzb25EZXR1bmU7XG5cbiAgICAgICAgICAgIGRldHVuZSA9IGluY3IgKiB1bmlzb25JbmRleDtcbiAgICAgICAgICAgIGRldHVuZSAtPSBpbmNyICogKCB0aGlzLnVuaXNvbi52YWx1ZSAqIDAuNSApO1xuICAgICAgICAgICAgZGV0dW5lICs9IGluY3IgKiAwLjU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgbXVsdGlwbGllcjtcblxuICAgICAgICAgICAgLy8gTGVhdmUgdGhlIGZpcnN0IG5vdGUgaW4gdGhlIHVuaXNvblxuICAgICAgICAgICAgLy8gYWxvbmUsIHNvIGl0J3MgZGV0dW5lIHZhbHVlIGlzIHRoZSByb290XG4gICAgICAgICAgICAvLyBub3RlLlxuICAgICAgICAgICAgaWYgKCB1bmlzb25JbmRleCA+IDAgKSB7XG4gICAgICAgICAgICAgICAgLy8gSG9wIGRvd24gbmVnYXRpdmUgaGFsZiB0aGUgdW5pc29uSW5kZXhcbiAgICAgICAgICAgICAgICBpZiAoIHVuaXNvbkluZGV4ICUgMiA9PT0gMCApIHtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGllciA9IC11bmlzb25JbmRleCAqIDAuNTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEhvcCB1cCBuIGNlbnRzXG4gICAgICAgICAgICAgICAgICAgIGlmICggdW5pc29uSW5kZXggPiAxICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdW5pc29uSW5kZXggPSB0aGlzLk1hdGgucm91bmRUb011bHRpcGxlKCB1bmlzb25JbmRleCwgMiApIC0gMjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG11bHRpcGxpZXIgPSB1bmlzb25JbmRleDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIHRoZSBtdWx0aXBsaWVyLCBjYWxjdWxhdGUgdGhlIGRldHVuZSB2YWx1ZVxuICAgICAgICAgICAgICAgIC8vIGZvciB0aGUgZ2l2ZW4gdW5pc29uSW5kZXguXG4gICAgICAgICAgICAgICAgZGV0dW5lID0gdW5pc29uRGV0dW5lICogbXVsdGlwbGllcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZXR1bmU7XG4gICAgfVxuXG4gICAgX2NhbGN1bGF0ZUdsaWRlVGltZSggb2xkRnJlcSwgbmV3RnJlcSApIHtcbiAgICAgICAgdmFyIG1vZGUgPSB0aGlzLmdsaWRlTW9kZSxcbiAgICAgICAgICAgIHRpbWUgPSB0aGlzLmdsaWRlVGltZS52YWx1ZSxcbiAgICAgICAgICAgIGdsaWRlVGltZSxcbiAgICAgICAgICAgIGZyZXFEaWZmZXJlbmNlO1xuXG4gICAgICAgIGlmICggdGltZSA9PT0gMC4wICkge1xuICAgICAgICAgICAgZ2xpZGVUaW1lID0gMC4wO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBtb2RlID09PSAnZXF1YWwnICkge1xuICAgICAgICAgICAgZ2xpZGVUaW1lID0gdGltZSAqIDAuMDAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZnJlcURpZmZlcmVuY2UgPSBNYXRoLmFicyggb2xkRnJlcSAtIG5ld0ZyZXEgKTtcbiAgICAgICAgICAgIGZyZXFEaWZmZXJlbmNlID0gdGhpcy5NYXRoLmNsYW1wKCBmcmVxRGlmZmVyZW5jZSwgMCwgNTAwICk7XG4gICAgICAgICAgICBnbGlkZVRpbWUgPSB0aGlzLk1hdGguc2NhbGVOdW1iZXJFeHAoXG4gICAgICAgICAgICAgICAgZnJlcURpZmZlcmVuY2UsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICA1MDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICB0aW1lXG4gICAgICAgICAgICApICogMC4wMDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2xpZGVUaW1lO1xuICAgIH1cblxuXG4gICAgX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGdlbmVyYXRvck9iamVjdCApIHtcbiAgICAgICAgdmFyIG9iamVjdHMgPSB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHM7XG5cbiAgICAgICAgb2JqZWN0c1sgZnJlcXVlbmN5IF0gPSBvYmplY3RzWyBmcmVxdWVuY3kgXSB8fCBbXTtcbiAgICAgICAgb2JqZWN0c1sgZnJlcXVlbmN5IF0udW5zaGlmdCggZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQudW5zaGlmdCggZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgfVxuXG4gICAgX2ZldGNoR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3kgKSB7XG4gICAgICAgIHZhciBvYmplY3RzID0gdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzWyBmcmVxdWVuY3kgXSxcbiAgICAgICAgICAgIGluZGV4ID0gMDtcblxuICAgICAgICBpZiAoICFvYmplY3RzIHx8IG9iamVjdHMubGVuZ3RoID09PSAwICkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0LnBvcCgpO1xuICAgICAgICByZXR1cm4gb2JqZWN0cy5wb3AoKTtcbiAgICB9XG5cbiAgICBfZmV0Y2hHZW5lcmF0b3JPYmplY3RUb1JldXNlKCkge1xuICAgICAgICB2YXIgZ2VuZXJhdG9yID0gdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5wb3AoKSxcbiAgICAgICAgICAgIGZyZXF1ZW5jeTtcblxuICAgICAgICBjb25zb2xlLmxvZyggJ3JldXNlJywgZ2VuZXJhdG9yICk7XG5cbiAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBnZW5lcmF0b3IgKSApIHtcbiAgICAgICAgICAgIGZyZXF1ZW5jeSA9IGdlbmVyYXRvclsgMCBdLmZyZXF1ZW5jeTtcblxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgZ2VuZXJhdG9yLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgIHRoaXMuZW52ZWxvcGUuZm9yY2VTdG9wKCBnZW5lcmF0b3JbIGkgXS5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCggZ2VuZXJhdG9yWyBpIF0udGltZXIgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZyZXF1ZW5jeSA9IGdlbmVyYXRvci5mcmVxdWVuY3k7XG4gICAgICAgICAgICB0aGlzLmVudmVsb3BlLmZvcmNlU3RvcCggZ2VuZXJhdG9yLm91dHB1dHNbIDAgXS5nYWluICk7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoIGdlbmVyYXRvci50aW1lciApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzWyBmcmVxdWVuY3kgXS5wb3AoKTtcblxuICAgICAgICByZXR1cm4gZ2VuZXJhdG9yO1xuICAgIH1cblxuXG4gICAgX3N0YXJ0R2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICkge1xuICAgICAgICBnZW5lcmF0b3JPYmplY3Qub3V0cHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuZW52ZWxvcGUuc3RhcnQoIGdlbmVyYXRvck9iamVjdC5vdXRwdXRzWyAwIF0uZ2FpbiwgZGVsYXkgKTtcbiAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LnN0YXJ0KCBkZWxheSApO1xuICAgIH1cblxuICAgIF9zdGFydFNpbmdsZSggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKSB7XG4gICAgICAgIHZhciB1bmlzb24gPSB0aGlzLnVuaXNvbi52YWx1ZSxcbiAgICAgICAgICAgIGRldHVuZSA9IDAuMCxcbiAgICAgICAgICAgIHVuaXNvbkdlbmVyYXRvckFycmF5LFxuICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LFxuICAgICAgICAgICAgYWN0aXZlR2VuZXJhdG9yQ291bnQgPSB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0Lmxlbmd0aCxcbiAgICAgICAgICAgIGV4aXN0aW5nRnJlcXVlbmN5LFxuICAgICAgICAgICAgZ2xpZGVUaW1lID0gMC4wO1xuXG4gICAgICAgIGlmICggYWN0aXZlR2VuZXJhdG9yQ291bnQgPCB0aGlzLnBvbHlwaG9ueS52YWx1ZSApIHtcbiAgICAgICAgICAgIGlmICggdW5pc29uID09PSAxLjAgKSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fY3JlYXRlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgdGhpcy53YXZlZm9ybSApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0R2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB1bmlzb25HZW5lcmF0b3JBcnJheSA9IFtdO1xuXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdW5pc29uOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgICAgIGRldHVuZSA9IHRoaXMuX2NhbGN1bGF0ZURldHVuZSggaSApO1xuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSB0aGlzLl9jcmVhdGVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB0aGlzLndhdmVmb3JtICk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0R2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICk7XG4gICAgICAgICAgICAgICAgICAgIHVuaXNvbkdlbmVyYXRvckFycmF5LnB1c2goIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIHVuaXNvbkdlbmVyYXRvckFycmF5ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICggdW5pc29uID09PSAxLjAgKSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fZmV0Y2hHZW5lcmF0b3JPYmplY3RUb1JldXNlKCk7XG4gICAgICAgICAgICAgICAgZXhpc3RpbmdGcmVxdWVuY3kgPSBnZW5lcmF0b3JPYmplY3QuZnJlcXVlbmN5O1xuICAgICAgICAgICAgICAgIGdsaWRlVGltZSA9IHRoaXMuX2NhbGN1bGF0ZUdsaWRlVGltZSggZXhpc3RpbmdGcmVxdWVuY3ksIGZyZXF1ZW5jeSApO1xuXG4gICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LnJlc2V0KCBmcmVxdWVuY3ksIGRldHVuZSArIHRoaXMudHVuaW5nLnZhbHVlICogMTAwLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lICk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSB0aGlzLl9mZXRjaEdlbmVyYXRvck9iamVjdFRvUmV1c2UoKTtcbiAgICAgICAgICAgICAgICBleGlzdGluZ0ZyZXF1ZW5jeSA9IGdlbmVyYXRvck9iamVjdFsgMCBdLmZyZXF1ZW5jeTtcbiAgICAgICAgICAgICAgICBnbGlkZVRpbWUgPSB0aGlzLl9jYWxjdWxhdGVHbGlkZVRpbWUoIGV4aXN0aW5nRnJlcXVlbmN5LCBmcmVxdWVuY3kgKTtcblxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHVuaXNvbjsgKytpICkge1xuICAgICAgICAgICAgICAgICAgICBkZXR1bmUgPSB0aGlzLl9jYWxjdWxhdGVEZXR1bmUoIGkgKTtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0WyBpIF0ucmVzZXQoIGZyZXF1ZW5jeSwgZGV0dW5lICsgdGhpcy50dW5pbmcudmFsdWUgKiAxMDAsIHZlbG9jaXR5LCBnbGlkZVRpbWUgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJldHVybiB0aGUgZ2VuZXJhdGVkIG9iamVjdChzKSBpbiBjYXNlIHRoZXkncmUgbmVlZGVkLlxuICAgICAgICByZXR1cm4gdW5pc29uR2VuZXJhdG9yQXJyYXkgPyB1bmlzb25HZW5lcmF0b3JBcnJheSA6IGdlbmVyYXRvck9iamVjdDtcbiAgICB9XG5cbiAgICBzdGFydCggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKSB7XG4gICAgICAgIHZhciBmcmVxID0gMCxcbiAgICAgICAgICAgIHZlbG9jaXR5U2Vuc2l0aXZpdHkgPSB0aGlzLnZlbG9jaXR5U2Vuc2l0aXZpdHkudmFsdWU7XG5cbiAgICAgICAgdmVsb2NpdHkgPSB0eXBlb2YgdmVsb2NpdHkgPT09ICdudW1iZXInID8gdmVsb2NpdHkgOiAxO1xuICAgICAgICBkZWxheSA9IHR5cGVvZiBkZWxheSA9PT0gJ251bWJlcicgPyBkZWxheSA6IDA7XG5cblxuICAgICAgICBpZiAoIHZlbG9jaXR5U2Vuc2l0aXZpdHkgIT09IDAgKSB7XG4gICAgICAgICAgICB2ZWxvY2l0eSA9IHRoaXMuTWF0aC5zY2FsZU51bWJlciggdmVsb2NpdHksIDAsIDEsIDAuNSAtIHZlbG9jaXR5U2Vuc2l0aXZpdHkgKiAwLjUsIDAuNSArIHZlbG9jaXR5U2Vuc2l0aXZpdHkgKiAwLjUgKVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSAwLjU7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGlmICggdHlwZW9mIGZyZXF1ZW5jeSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGFydFNpbmdsZSggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBlbHNlIGlmICggZnJlcXVlbmN5IGluc3RhbmNlb2YgTm90ZSApIHtcbiAgICAgICAgLy8gICAgIGZyZXEgPSBmcmVxdWVuY3kudmFsdWVIejtcbiAgICAgICAgLy8gICAgIHRoaXMuX3N0YXJ0U2luZ2xlKCBmcmVxLCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBlbHNlIGlmICggZnJlcXVlbmN5IGluc3RhbmNlb2YgQ2hvcmQgKSB7XG4gICAgICAgIC8vICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBmcmVxdWVuY3kubm90ZXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgIC8vICAgICAgICAgZnJlcSA9IGZyZXF1ZW5jeS5ub3Rlc1sgaSBdLnZhbHVlSHo7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5fc3RhcnRTaW5nbGUoIGZyZXEsIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG5cblxuICAgIF9zdG9wR2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5lbnZlbG9wZS5zdG9wKCBnZW5lcmF0b3JPYmplY3Qub3V0cHV0c1sgMCBdLmdhaW4sIGRlbGF5ICk7XG5cbiAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LnRpbWVyID0gc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBzZWxmLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0LnBvcCgpO1xuICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LnN0b3AoIGRlbGF5ICk7XG4gICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QuY2xlYW5VcCgpO1xuICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gbnVsbDtcbiAgICAgICAgfSwgZGVsYXkgKiAxMDAwICsgdGhpcy5lbnZlbG9wZS50b3RhbFN0b3BUaW1lICogMTAwMCArIDEwMCApO1xuICAgIH1cblxuICAgIF9zdG9wU2luZ2xlKCBmcmVxdWVuY3ksIHZlbG9jaXR5LCBkZWxheSApIHtcbiAgICAgICAgdmFyIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2ZldGNoR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3kgKTtcblxuICAgICAgICBpZiAoIGdlbmVyYXRvck9iamVjdCApIHtcbiAgICAgICAgICAgIC8vIFN0b3AgZ2VuZXJhdG9ycyBmb3JtZWQgd2hlbiB1bmlzb24gd2FzID4gMSBhdCB0aW1lIG9mIHN0YXJ0KC4uLilcbiAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggZ2VuZXJhdG9yT2JqZWN0ICkgKSB7XG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSBnZW5lcmF0b3JPYmplY3QubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BHZW5lcmF0b3JPYmplY3QoIGdlbmVyYXRvck9iamVjdFsgaSBdLCBkZWxheSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BHZW5lcmF0b3JPYmplY3QoIGdlbmVyYXRvck9iamVjdCwgZGVsYXkgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGdlbmVyYXRvck9iamVjdCA9IG51bGw7XG4gICAgfVxuXG4gICAgc3RvcCggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKSB7XG4gICAgICAgIHZlbG9jaXR5ID0gdHlwZW9mIHZlbG9jaXR5ID09PSAnbnVtYmVyJyA/IHZlbG9jaXR5IDogMDtcbiAgICAgICAgZGVsYXkgPSB0eXBlb2YgZGVsYXkgPT09ICdudW1iZXInID8gZGVsYXkgOiAwO1xuXG4gICAgICAgIGlmICggdHlwZW9mIGZyZXF1ZW5jeSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLl9zdG9wU2luZ2xlKCBmcmVxdWVuY3ksIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGVsc2UgaWYgKCBmcmVxdWVuY3kgaW5zdGFuY2VvZiBOb3RlICkge1xuICAgICAgICAvLyAgICAgZnJlcSA9IGZyZXF1ZW5jeS52YWx1ZUh6O1xuICAgICAgICAvLyAgICAgdGhpcy5fc3RvcFNpbmdsZSggZnJlcSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gZWxzZSBpZiAoIGZyZXF1ZW5jeSBpbnN0YW5jZW9mIENob3JkICkge1xuICAgICAgICAvLyAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgZnJlcXVlbmN5Lm5vdGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAvLyAgICAgICAgIGZyZXEgPSBmcmVxdWVuY3kubm90ZXNbIGkgXS52YWx1ZUh6O1xuICAgICAgICAvLyAgICAgICAgIHRoaXMuX3N0b3BTaW5nbGUoIGZyZXEsIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5cbi8vIEF1ZGlvSU8ubWl4aW5TaW5nbGUoIEdlbmVyYXRvclBsYXllci5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkdlbmVyYXRvclBsYXllci5wcm90b3R5cGUuTWF0aCA9IG1hdGg7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUdlbmVyYXRvclBsYXllciA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuICAgIHJldHVybiBuZXcgR2VuZXJhdG9yUGxheWVyKCB0aGlzLCBvcHRpb25zICk7XG59OyIsIndpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG5cbi8vIENvcmUgY29tcG9uZW50cy5cbmltcG9ydCBBdWRpb0lPIGZyb20gJy4vY29yZS9BdWRpb0lPLmVzNic7XG5pbXBvcnQgTm9kZSBmcm9tICcuL2NvcmUvTm9kZS5lczYnO1xuaW1wb3J0IFBhcmFtIGZyb20gJy4vY29yZS9QYXJhbS5lczYnO1xuaW1wb3J0ICcuL2NvcmUvV2F2ZVNoYXBlci5lczYnO1xuXG5cbi8vIEZYLlxuaW1wb3J0ICcuL2Z4L2RlbGF5L0RlbGF5LmVzNic7XG5pbXBvcnQgJy4vZngvZGVsYXkvUGluZ1BvbmdEZWxheS5lczYnO1xuaW1wb3J0ICcuL2Z4L2RlbGF5L1N0ZXJlb0RlbGF5LmVzNic7XG5pbXBvcnQgJy4vZngvZXEvQ3VzdG9tRVEuZXM2Jztcbi8vIGltcG9ydCAnLi9meC9CaXRSZWR1Y3Rpb24uZXM2JztcbmltcG9ydCAnLi9meC9TY2hyb2VkZXJBbGxQYXNzLmVzNic7XG5pbXBvcnQgJy4vZngvZmlsdGVycy9GaWx0ZXJCYW5rLmVzNic7XG5pbXBvcnQgJy4vZngvZmlsdGVycy9MUEZpbHRlci5lczYnO1xuaW1wb3J0ICcuL2Z4L2ZpbHRlcnMvQlBGaWx0ZXIuZXM2JztcbmltcG9ydCAnLi9meC9maWx0ZXJzL0hQRmlsdGVyLmVzNic7XG5pbXBvcnQgJy4vZngvZmlsdGVycy9Ob3RjaEZpbHRlci5lczYnO1xuaW1wb3J0ICcuL2Z4L2ZpbHRlcnMvQWxsUGFzc0ZpbHRlci5lczYnO1xuaW1wb3J0ICcuL2Z4L3NhdHVyYXRpb24vU2luZVNoYXBlci5lczYnO1xuaW1wb3J0ICcuL2Z4L3V0aWxpdHkvRENUcmFwLmVzNic7XG5pbXBvcnQgJy4vZngvdXRpbGl0eS9MRk8uZXM2JztcbmltcG9ydCAnLi9meC91dGlsaXR5L1N0ZXJlb1dpZHRoLmVzNic7XG5pbXBvcnQgJy4vZngvdXRpbGl0eS9TdGVyZW9Sb3RhdGlvbi5lczYnO1xuXG4vLyBHZW5lcmF0b3JzIGFuZCBpbnN0cnVtZW50cy5cbmltcG9ydCAnLi9nZW5lcmF0b3JzL09zY2lsbGF0b3JHZW5lcmF0b3IuZXM2JztcbmltcG9ydCAnLi9pbnN0cnVtZW50cy9HZW5lcmF0b3JQbGF5ZXIuZXM2JztcblxuLy8gTWF0aDogVHJpZ29ub21ldHJ5XG5pbXBvcnQgJy4vbWF0aC90cmlnb25vbWV0cnkvRGVnVG9SYWQuZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9TaW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9Db3MuZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9UYW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9SYWRUb0RlZy5lczYnO1xuXG4vLyBNYXRoOiBSZWxhdGlvbmFsLW9wZXJhdG9ycyAoaW5jLiBpZi9lbHNlKVxuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUby5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUb1plcm8uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhblplcm8uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuRXF1YWxUby5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvSWZFbHNlLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvTGVzc1RoYW5aZXJvLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhbkVxdWFsVG8uZXM2JztcblxuLy8gTWF0aDogTG9naWNhbCBvcGVyYXRvcnNcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL0xvZ2ljYWxPcGVyYXRvci5lczYnO1xuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvQU5ELmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9PUi5lczYnO1xuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTk9ULmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OQU5ELmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OT1IuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL1hPUi5lczYnO1xuXG4vLyBNYXRoOiBHZW5lcmFsLlxuaW1wb3J0ICcuL21hdGgvQWJzLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9BZGQuZXM2JztcbmltcG9ydCAnLi9tYXRoL0F2ZXJhZ2UuZXM2JztcbmltcG9ydCAnLi9tYXRoL0NsYW1wLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9Db25zdGFudC5lczYnO1xuaW1wb3J0ICcuL21hdGgvRGl2aWRlLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9GbG9vci5lczYnO1xuaW1wb3J0ICcuL21hdGgvTWF4LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9NaW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL011bHRpcGx5LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9OZWdhdGUuZXM2JztcbmltcG9ydCAnLi9tYXRoL1Bvdy5lczYnO1xuaW1wb3J0ICcuL21hdGgvUmVjaXByb2NhbC5lczYnO1xuaW1wb3J0ICcuL21hdGgvUm91bmQuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NjYWxlLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TY2FsZUV4cC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU2lnbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3FydC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3VidHJhY3QuZXM2JztcbmltcG9ydCAnLi9tYXRoL1N3aXRjaC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3F1YXJlLmVzNic7XG5cbi8vIE1hdGg6IFNwZWNpYWwuXG5pbXBvcnQgJy4vbWF0aC9MZXJwLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TYW1wbGVEZWxheS5lczYnO1xuXG4vLyBFbnZlbG9wZXNcbmltcG9ydCAnLi9lbnZlbG9wZXMvQ3VzdG9tRW52ZWxvcGUuZXM2JztcbmltcG9ydCAnLi9lbnZlbG9wZXMvQURTUkVudmVsb3BlLmVzNic7XG5pbXBvcnQgJy4vZW52ZWxvcGVzL0FERW52ZWxvcGUuZXM2JztcbmltcG9ydCAnLi9lbnZlbG9wZXMvQURCRFNSRW52ZWxvcGUuZXM2JztcblxuLy8gR2VuZXJhbCBncmFwaHNcbmltcG9ydCAnLi9ncmFwaHMvRVFTaGVsZi5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9Db3VudGVyLmVzNic7XG5pbXBvcnQgJy4vZ3JhcGhzL0RyeVdldE5vZGUuZXM2JztcbmltcG9ydCAnLi9ncmFwaHMvUGhhc2VPZmZzZXQuZXM2JztcbmltcG9ydCAnLi9ncmFwaHMvQ3Jvc3NmYWRlci5lczYnO1xuXG4vLyBPc2NpbGxhdG9yczogVXNpbmcgV2ViQXVkaW8gb3NjaWxsYXRvcnNcbmltcG9ydCAnLi9vc2NpbGxhdG9ycy9Pc2NpbGxhdG9yQmFuay5lczYnO1xuaW1wb3J0ICcuL29zY2lsbGF0b3JzL05vaXNlT3NjaWxsYXRvckJhbmsuZXM2JztcbmltcG9ydCAnLi9vc2NpbGxhdG9ycy9GTU9zY2lsbGF0b3IuZXM2JztcbmltcG9ydCAnLi9vc2NpbGxhdG9ycy9TaW5lQmFuay5lczYnO1xuXG4vLyBPc2NpbGxhdG9yczogQnVmZmVyLWJhc2VkXG5pbXBvcnQgJy4vb3NjaWxsYXRvcnMvQnVmZmVyT3NjaWxsYXRvci5lczYnO1xuXG4vLyBVdGlsc1xuaW1wb3J0ICcuL2J1ZmZlcnMvQnVmZmVyR2VuZXJhdG9ycy5lczYnO1xuaW1wb3J0ICcuL2J1ZmZlcnMvQnVmZmVyVXRpbHMuZXM2JztcbmltcG9ydCAnLi91dGlsaXRpZXMvVXRpbHMuZXM2JztcblxuLy8gaW1wb3J0ICcuL2dyYXBocy9Ta2V0Y2guZXM2Jztcblxud2luZG93LlBhcmFtID0gUGFyYW07XG53aW5kb3cuTm9kZSA9IE5vZGU7IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxudmFyIFNIQVBFUlMgPSB7fTtcblxuZnVuY3Rpb24gZ2VuZXJhdGVTaGFwZXJDdXJ2ZSggc2l6ZSApIHtcbiAgICB2YXIgYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KCBzaXplICksXG4gICAgICAgIGkgPSAwLFxuICAgICAgICB4ID0gMDtcblxuICAgIGZvciAoIGk7IGkgPCBzaXplOyArK2kgKSB7XG4gICAgICAgIHggPSAoIGkgLyBzaXplICkgKiAyIC0gMTtcbiAgICAgICAgYXJyYXlbIGkgXSA9IE1hdGguYWJzKCB4ICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFycmF5O1xufVxuXG5jbGFzcyBBYnMgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgYWNjdXJhY3kgPSAxMCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gdmFyIGdhaW5BY2N1cmFjeSA9IGFjY3VyYWN5ICogMTAwO1xuICAgICAgICB2YXIgZ2FpbkFjY3VyYWN5ID0gTWF0aC5wb3coIGFjY3VyYWN5LCAyICksXG4gICAgICAgICAgICBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKSxcbiAgICAgICAgICAgIHNpemUgPSAxMDI0ICogYWNjdXJhY3k7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gMSAvIGdhaW5BY2N1cmFjeTtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IGdhaW5BY2N1cmFjeTtcblxuICAgICAgICAvLyBUbyBzYXZlIGNyZWF0aW5nIG5ldyBzaGFwZXIgY3VydmVzICh0aGF0IGNhbiBiZSBxdWl0ZSBsYXJnZSEpXG4gICAgICAgIC8vIGVhY2ggdGltZSBhbiBpbnN0YW5jZSBvZiBBYnMgaXMgY3JlYXRlZCwgc2hhcGVyIGN1cnZlc1xuICAgICAgICAvLyBhcmUgc3RvcmVkIGluIHRoZSBTSEFQRVJTIG9iamVjdCBhYm92ZS4gVGhlIGtleXMgdG8gdGhlXG4gICAgICAgIC8vIFNIQVBFUlMgb2JqZWN0IGFyZSB0aGUgYmFzZSB3YXZldGFibGUgY3VydmUgc2l6ZSAoMTAyNClcbiAgICAgICAgLy8gbXVsdGlwbGllZCBieSB0aGUgYWNjdXJhY3kgYXJndW1lbnQuXG4gICAgICAgIGlmKCAhU0hBUEVSU1sgc2l6ZSBdICkge1xuICAgICAgICAgICAgU0hBUEVSU1sgc2l6ZSBdID0gZ2VuZXJhdGVTaGFwZXJDdXJ2ZSggc2l6ZSApO1xuICAgICAgICB9XG5cbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCBTSEFQRVJTWyBzaXplIF0gKTtcblxuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBYnMgPSBmdW5jdGlvbiggYWNjdXJhY3kgKSB7XG4gICAgcmV0dXJuIG5ldyBBYnMoIHRoaXMsIGFjY3VyYWN5ICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogQWRkcyB0d28gYXVkaW8gc2lnbmFscyB0b2dldGhlci5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICpcbiAqIHZhciBhZGQgPSBpby5jcmVhdGVBZGQoIDIgKTtcbiAqIGluMS5jb25uZWN0KCBhZGQgKTtcbiAqXG4gKiB2YXIgYWRkID0gaW8uY3JlYXRlQWRkKCk7XG4gKiBpbjEuY29ubmVjdCggYWRkLCAwLCAwICk7XG4gKiBpbjIuY29ubmVjdCggYWRkLCAwLCAxICk7XG4gKi9cbmNsYXNzIEFkZCBleHRlbmRzIE5vZGV7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgLy8gU3RvcmUgY29udHJvbGxhYmxlIHBhcmFtcy5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW5wdXRzWyAxIF07XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgIFx0cmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgXHR0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUFkZCA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IEFkZCggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vKlxuICAgIFRoZSBhdmVyYWdlIHZhbHVlIG9mIGEgc2lnbmFsIGlzIGNhbGN1bGF0ZWRcbiAgICBieSBwaXBpbmcgdGhlIGlucHV0IGludG8gYSByZWN0aWZpZXIgdGhlbiBpbnRvXG4gICAgYSBzZXJpZXMgb2YgRGVsYXlOb2Rlcy4gRWFjaCBEZWxheU5vZGVcbiAgICBoYXMgaXQncyBgZGVsYXlUaW1lYCBjb250cm9sbGVkIGJ5IGVpdGhlciB0aGVcbiAgICBgc2FtcGxlU2l6ZWAgYXJndW1lbnQgb3IgdGhlIGluY29taW5nIHZhbHVlIG9mXG4gICAgdGhlIGBjb250cm9scy5zYW1wbGVTaXplYCBub2RlLiBUaGUgZGVsYXlUaW1lXG4gICAgaXMgdGhlcmVmb3JlIG1lYXN1cmVkIGluIHNhbXBsZXMuXG5cbiAgICBFYWNoIGRlbGF5IGlzIGNvbm5lY3RlZCB0byBhIEdhaW5Ob2RlIHRoYXQgd29ya3NcbiAgICBhcyBhIHN1bW1pbmcgbm9kZS4gVGhlIHN1bW1pbmcgbm9kZSdzIHZhbHVlIGlzXG4gICAgdGhlbiBkaXZpZGVkIGJ5IHRoZSBudW1iZXIgb2YgZGVsYXlzIHVzZWQgYmVmb3JlXG4gICAgYmVpbmcgc2VudCBvbiBpdHMgbWVycnkgd2F5IHRvIHRoZSBvdXRwdXQuXG5cbiAgICBOb3RlOlxuICAgIEhpZ2ggdmFsdWVzIGZvciBgbnVtU2FtcGxlc2Agd2lsbCBiZSBleHBlbnNpdmUsXG4gICAgYXMgdGhhdCBtYW55IERlbGF5Tm9kZXMgd2lsbCBiZSBjcmVhdGVkLiBDb25zaWRlclxuICAgIGluY3JlYXNpbmcgdGhlIGBzYW1wbGVTaXplYCBhbmQgdXNpbmcgYSBsb3cgdmFsdWVcbiAgICBmb3IgYG51bVNhbXBsZXNgLlxuXG4gICAgR3JhcGg6XG4gICAgPT09PT09XG4gICAgaW5wdXQgLT5cbiAgICAgICAgYWJzL3JlY3RpZnkgLT5cbiAgICAgICAgICAgIGBudW1TYW1wbGVzYCBudW1iZXIgb2YgZGVsYXlzLCBpbiBzZXJpZXMgLT5cbiAgICAgICAgICAgICAgICBzdW0gLT5cbiAgICAgICAgICAgICAgICAgICAgZGl2aWRlIGJ5IGBudW1TYW1wbGVzYCAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LlxuICovXG5jbGFzcyBBdmVyYWdlIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIG51bVNhbXBsZXMgPSAxMCwgc2FtcGxlU2l6ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm51bVNhbXBsZXMgPSBudW1TYW1wbGVzO1xuXG4gICAgICAgIC8vIEFsbCBEZWxheU5vZGVzIHdpbGwgYmUgc3RvcmVkIGhlcmUuXG4gICAgICAgIGdyYXBoLmRlbGF5cyA9IFtdO1xuICAgICAgICBncmFwaC5hYnMgPSB0aGlzLmlvLmNyZWF0ZUFicygpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmFicyApO1xuICAgICAgICBncmFwaC5zYW1wbGVTaXplID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggMSAvIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlICk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnNhbXBsZVNpemUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBzYW1wbGVTaXplICk7XG4gICAgICAgIGdyYXBoLnNhbXBsZVNpemUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5zYW1wbGVTaXplLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAxICk7XG5cbiAgICAgICAgLy8gVGhpcyBpcyBhIHJlbGF0aXZlbHkgZXhwZW5zaXZlIGNhbGN1bGF0aW9uXG4gICAgICAgIC8vIHdoZW4gY29tcGFyZWQgdG8gZG9pbmcgYSBtdWNoIHNpbXBsZXIgcmVjaXByb2NhbCBtdWx0aXBseS5cbiAgICAgICAgLy8gdGhpcy5kaXZpZGUgPSB0aGlzLmlvLmNyZWF0ZURpdmlkZSggbnVtU2FtcGxlcywgdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKiAwLjUgKTtcblxuICAgICAgICAvLyBBdm9pZCB0aGUgbW9yZSBleHBlbnNpdmUgZGl2aXNpb24gYWJvdmUgYnlcbiAgICAgICAgLy8gbXVsdGlwbHlpbmcgdGhlIHN1bSBieSB0aGUgcmVjaXByb2NhbCBvZiBudW1TYW1wbGVzLlxuICAgICAgICBncmFwaC5kaXZpZGUgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAxIC8gbnVtU2FtcGxlcyApO1xuICAgICAgICBncmFwaC5zdW0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuXG4gICAgICAgIGdyYXBoLnN1bS5jb25uZWN0KCBncmFwaC5kaXZpZGUgKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcblxuXG4gICAgICAgIC8vIFRyaWdnZXIgdGhlIHNldHRlciBmb3IgYG51bVNhbXBsZXNgIHRoYXQgd2lsbCBjcmVhdGVcbiAgICAgICAgLy8gdGhlIGRlbGF5IHNlcmllcy5cbiAgICAgICAgdGhpcy5udW1TYW1wbGVzID0gZ3JhcGgubnVtU2FtcGxlcztcbiAgICB9XG5cbiAgICBnZXQgbnVtU2FtcGxlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JhcGgoKS5udW1TYW1wbGVzO1xuICAgIH1cblxuICAgIHNldCBudW1TYW1wbGVzKCBudW1TYW1wbGVzICkge1xuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCksXG4gICAgICAgICAgICBkZWxheXMgPSBncmFwaC5kZWxheXM7XG5cbiAgICAgICAgLy8gRGlzY29ubmVjdCBhbmQgbnVsbGlmeSBhbnkgZXhpc3RpbmcgZGVsYXkgbm9kZXMuXG4gICAgICAgIHRoaXMuX2NsZWFuVXBTaW5nbGUoIGRlbGF5cyApO1xuXG4gICAgICAgIGdyYXBoLm51bVNhbXBsZXMgPSBudW1TYW1wbGVzO1xuICAgICAgICBncmFwaC5kaXZpZGUudmFsdWUgPSAxIC8gbnVtU2FtcGxlcztcblxuICAgICAgICBmb3IoIHZhciBpID0gMCwgbm9kZSA9IGdyYXBoLmFiczsgaSA8IG51bVNhbXBsZXM7ICsraSApIHtcbiAgICAgICAgICAgIHZhciBkZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICAgICAgZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgICAgIGdyYXBoLm11bHRpcGx5LmNvbm5lY3QoIGRlbGF5LmRlbGF5VGltZSApO1xuICAgICAgICAgICAgbm9kZS5jb25uZWN0KCBkZWxheSApO1xuICAgICAgICAgICAgZGVsYXkuY29ubmVjdCggZ3JhcGguc3VtICk7XG4gICAgICAgICAgICBncmFwaC5kZWxheXMucHVzaCggZGVsYXkgKTtcbiAgICAgICAgICAgIG5vZGUgPSBkZWxheTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBdmVyYWdlID0gZnVuY3Rpb24oIG51bVNhbXBsZXMsIHNhbXBsZVNpemUgKSB7XG4gICAgcmV0dXJuIG5ldyBBdmVyYWdlKCB0aGlzLCBudW1TYW1wbGVzLCBzYW1wbGVTaXplICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuY2xhc3MgQ2xhbXAgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIG1pblZhbHVlLCBtYXhWYWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7IC8vIGlvLCAxLCAxXG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm1pbiA9IHRoaXMuaW8uY3JlYXRlTWluKCBtYXhWYWx1ZSApO1xuICAgICAgICBncmFwaC5tYXggPSB0aGlzLmlvLmNyZWF0ZU1heCggbWluVmFsdWUgKTtcblxuICAgICAgICAvLyB0aGlzLmlucHV0cyA9IFsgZ3JhcGgubWluIF07XG4gICAgICAgIC8vIHRoaXMub3V0cHV0cyA9IFsgZ3JhcGgubWF4IF07XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubWluICk7XG4gICAgICAgIGdyYXBoLm1pbi5jb25uZWN0KCBncmFwaC5tYXggKTtcbiAgICAgICAgZ3JhcGgubWF4LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgLy8gU3RvcmUgY29udHJvbGxhYmxlIHBhcmFtcy5cbiAgICAgICAgdGhpcy5jb250cm9scy5taW4gPSBncmFwaC5taW4uY29udHJvbHMudmFsdWU7XG4gICAgICAgIHRoaXMuY29udHJvbHMubWF4ID0gZ3JhcGgubWF4LmNvbnRyb2xzLnZhbHVlO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IG1pbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JhcGgoKS5tYXgudmFsdWU7XG4gICAgfVxuICAgIHNldCBtaW4oIHZhbHVlICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkubWF4LnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IG1heCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JhcGgoKS5taW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBtYXgoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkubWluLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ2xhbXAgPSBmdW5jdGlvbiggbWluVmFsdWUsIG1heFZhbHVlICkge1xuICAgIHJldHVybiBuZXcgQ2xhbXAoIHRoaXMsIG1pblZhbHVlLCBtYXhWYWx1ZSApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tICcuLi9jb3JlL0F1ZGlvSU8uZXM2JztcbmltcG9ydCBOb2RlIGZyb20gJy4uL2NvcmUvTm9kZS5lczYnO1xuXG5jbGFzcyBDb25zdGFudCBleHRlbmRzIE5vZGUge1xuICAgIC8qKlxuICAgICAqIEEgY29uc3RhbnQtcmF0ZSBhdWRpbyBzaWduYWxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gICAgSW5zdGFuY2Ugb2YgQXVkaW9JT1xuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB2YWx1ZSBWYWx1ZSBvZiB0aGUgY29uc3RhbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlID0gMC4wICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyA/IHZhbHVlIDogMDtcbiAgICAgICAgdGhpcy5pby5jb25zdGFudERyaXZlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50ID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgQ29uc3RhbnQoIHRoaXMsIHZhbHVlICk7XG59O1xuXG5cbi8vIEEgYnVuY2ggb2YgcHJlc2V0IGNvbnN0YW50cy5cbihmdW5jdGlvbigpIHtcbiAgICB2YXIgRSxcbiAgICAgICAgUEksXG4gICAgICAgIFBJMixcbiAgICAgICAgTE4xMCxcbiAgICAgICAgTE4yLFxuICAgICAgICBMT0cxMEUsXG4gICAgICAgIExPRzJFLFxuICAgICAgICBTUVJUMV8yLFxuICAgICAgICBTUVJUMjtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50RSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IEUgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5FICk7XG4gICAgICAgIEUgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRQSSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFBJIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguUEkgKTtcbiAgICAgICAgUEkgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRQSTIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBQSTIgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5QSSAqIDIgKTtcbiAgICAgICAgUEkyID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50TE4xMCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IExOMTAgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5MTjEwICk7XG4gICAgICAgIExOMTAgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRMTjIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBMTjIgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5MTjIgKTtcbiAgICAgICAgTE4yID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50TE9HMTBFID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gTE9HMTBFIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguTE9HMTBFICk7XG4gICAgICAgIExPRzEwRSA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudExPRzJFID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gTE9HMkUgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5MT0cyRSApO1xuICAgICAgICBMT0cyRSA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudFNRUlQxXzIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBTUVJUMV8yIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguU1FSVDFfMiApO1xuICAgICAgICBTUVJUMV8yID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50U1FSVDIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBTUVJUMiB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLlNRUlQyICk7XG4gICAgICAgIFNRUlQyID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcbn0oKSk7IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBEaXZpZGVzIHR3byBudW1iZXJzXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgRGl2aWRlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSwgbWF4SW5wdXQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gMC4wO1xuXG4gICAgICAgIGdyYXBoLnJlY2lwcm9jYWwgPSB0aGlzLmlvLmNyZWF0ZVJlY2lwcm9jYWwoIG1heElucHV0ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgucmVjaXByb2NhbCApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgZ3JhcGgucmVjaXByb2NhbC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXS5nYWluICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5kaXZpc29yID0gdGhpcy5pbnB1dHNbIDEgXTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5wdXRzWyAxIF0udmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgbWF4SW5wdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlY2lwcm9jYWwubWF4SW5wdXQ7XG4gICAgfVxuICAgIHNldCBtYXhJbnB1dCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMucmVjaXByb2NhbC5tYXhJbnB1dCA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRGl2aWRlID0gZnVuY3Rpb24oIHZhbHVlLCBtYXhJbnB1dCApIHtcbiAgICByZXR1cm4gbmV3IERpdmlkZSggdGhpcywgdmFsdWUsIG1heElucHV0ICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuLy8gTk9URTpcbi8vICBPbmx5IGFjY2VwdHMgdmFsdWVzID49IC0xICYmIDw9IDEuIFZhbHVlcyBvdXRzaWRlXG4vLyAgdGhpcyByYW5nZSBhcmUgY2xhbXBlZCB0byB0aGlzIHJhbmdlLlxuY2xhc3MgRmxvb3IgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkZsb29yICk7XG5cbiAgICAgICAgLy8gVGhpcyBicmFuY2hpbmcgaXMgYmVjYXVzZSBpbnB1dHRpbmcgYDBgIHZhbHVlc1xuICAgICAgICAvLyBpbnRvIHRoZSB3YXZlc2hhcGVyIGFib3ZlIG91dHB1dHMgLTAuNSA7KFxuICAgICAgICBncmFwaC5pZkVsc2UgPSB0aGlzLmlvLmNyZWF0ZUlmRWxzZSgpO1xuICAgICAgICBncmFwaC5lcXVhbFRvWmVybyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUb1plcm8oKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmVxdWFsVG9aZXJvICk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG9aZXJvLmNvbm5lY3QoIGdyYXBoLmlmRWxzZS5pZiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmlmRWxzZS50aGVuICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCBncmFwaC5pZkVsc2UuZWxzZSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLmlmRWxzZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVGbG9vciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRmxvb3IoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgTGVycCBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCBzdGFydCwgZW5kLCBkZWx0YSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAzLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmFkZCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLnN1YnRyYWN0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICBncmFwaC5zdGFydCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHN0YXJ0ICk7XG4gICAgICAgIGdyYXBoLmVuZCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGVuZCApO1xuICAgICAgICBncmFwaC5kZWx0YSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGRlbHRhICk7XG5cbiAgICAgICAgZ3JhcGguZW5kLmNvbm5lY3QoIGdyYXBoLnN1YnRyYWN0LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLnN0YXJ0LmNvbm5lY3QoIGdyYXBoLnN1YnRyYWN0LCAwLCAxICk7XG4gICAgICAgIGdyYXBoLnN1YnRyYWN0LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmRlbHRhLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGguc3RhcnQuY29ubmVjdCggZ3JhcGguYWRkLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5LmNvbm5lY3QoIGdyYXBoLmFkZCwgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLmFkZC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc3RhcnQgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5lbmQgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDIgXS5jb25uZWN0KCBncmFwaC5kZWx0YSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuc3RhcnQgPSBncmFwaC5zdGFydDtcbiAgICAgICAgdGhpcy5jb250cm9scy5lbmQgPSBncmFwaC5lbmQ7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZGVsdGEgPSBncmFwaC5kZWx0YTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCBzdGFydCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JhcGgoKS5zdGFydC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHN0YXJ0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLnN0YXJ0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGVuZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JhcGgoKS5lbmQudmFsdWU7XG4gICAgfVxuICAgIHNldCBlbmQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkuZW5kLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGRlbHRhKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLmRlbHRhLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgZGVsdGEoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkuZGVsdGEudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxlcnAgPSBmdW5jdGlvbiggc3RhcnQsIGVuZCwgZGVsdGEgKSB7XG4gICAgcmV0dXJuIG5ldyBMZXJwKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogV2hlbiBpbnB1dCBpcyA8IGB2YWx1ZWAsIG91dHB1dHMgYHZhbHVlYCwgb3RoZXJ3aXNlIG91dHB1dHMgaW5wdXQuXG4gKiBAcGFyYW0ge0F1ZGlvSU99IGlvICAgQXVkaW9JTyBpbnN0YW5jZVxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIFRoZSBtaW5pbXVtIHZhbHVlIHRvIHRlc3QgYWdhaW5zdC5cbiAqL1xuXG5jbGFzcyBNYXggZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW4gPSB0aGlzLmlvLmNyZWF0ZUdyZWF0ZXJUaGFuKCk7XG4gICAgICAgIGdyYXBoLnN3aXRjaCA9IHRoaXMuaW8uY3JlYXRlU3dpdGNoKCAyLCAwICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLmdyZWF0ZXJUaGFuICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW4uY29udHJvbHMudmFsdWUgKTtcblxuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc3dpdGNoLmlucHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGguc3dpdGNoLmlucHV0c1sgMSBdICk7XG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuLmNvbm5lY3QoIGdyYXBoLnN3aXRjaC5jb250cm9sICk7XG4gICAgICAgIGdyYXBoLnN3aXRjaC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTWF4ID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgTWF4KCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIFdoZW4gaW5wdXQgaXMgPiBgdmFsdWVgLCBvdXRwdXRzIGB2YWx1ZWAsIG90aGVyd2lzZSBvdXRwdXRzIGlucHV0LlxuICogQHBhcmFtIHtBdWRpb0lPfSBpbyAgIEF1ZGlvSU8gaW5zdGFuY2VcbiAqIEBwYXJhbSB7TnVtYmVyfSB2YWx1ZSBUaGUgbWluaW11bSB2YWx1ZSB0byB0ZXN0IGFnYWluc3QuXG4gKi9cbmNsYXNzIE1pbiBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5sZXNzVGhhbiA9IHRoaXMuaW8uY3JlYXRlTGVzc1RoYW4oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLmxlc3NUaGFuICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubGVzc1RoYW4uY29udHJvbHMudmFsdWUgKTtcblxuICAgICAgICBncmFwaC5zd2l0Y2ggPSB0aGlzLmlvLmNyZWF0ZVN3aXRjaCggMiwgMCApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc3dpdGNoLmlucHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGguc3dpdGNoLmlucHV0c1sgMSBdICk7XG4gICAgICAgIGdyYXBoLmxlc3NUaGFuLmNvbm5lY3QoIGdyYXBoLnN3aXRjaC5jb250cm9sICk7XG4gICAgICAgIGdyYXBoLnN3aXRjaC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVNaW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBNaW4oIHRoaXMsIHZhbHVlICk7XG59OyIsIiBpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdHdvIGF1ZGlvIHNpZ25hbHMgdG9nZXRoZXIuXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgTXVsdGlwbHkgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDAuMDtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG5cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTXVsdGlwbHkgPSBmdW5jdGlvbiggdmFsdWUxLCB2YWx1ZTIgKSB7XG4gICAgcmV0dXJuIG5ldyBNdWx0aXBseSggdGhpcywgdmFsdWUxLCB2YWx1ZTIgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBOZWdhdGVzIHRoZSBpbmNvbWluZyBhdWRpbyBzaWduYWwuXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgTmVnYXRlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDAgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAtMTtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gdGhpcy5pbnB1dHM7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5lZ2F0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTmVnYXRlKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKlxuICogTm90ZTogRE9FUyBOT1QgSEFORExFIE5FR0FUSVZFIFBPV0VSUy5cbiAqL1xuY2xhc3MgUG93IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm11bHRpcGxpZXJzID0gW107XG4gICAgICAgIGdyYXBoLnZhbHVlID0gdmFsdWU7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBub2RlID0gdGhpcy5pbnB1dHNbIDAgXTsgaSA8IHZhbHVlIC0gMTsgKytpICkge1xuICAgICAgICAgICAgZ3JhcGgubXVsdGlwbGllcnNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbGllcnNbIGkgXS5jb250cm9scy52YWx1ZSApO1xuICAgICAgICAgICAgbm9kZS5jb25uZWN0KCBncmFwaC5tdWx0aXBsaWVyc1sgaSBdICk7XG4gICAgICAgICAgICBub2RlID0gZ3JhcGgubXVsdGlwbGllcnNbIGkgXTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS52YWx1ZSA9IG51bGw7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5kaXNjb25uZWN0KCBncmFwaC5tdWx0aXBsaWVyc1sgMCBdICk7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSBncmFwaC5tdWx0aXBsaWVycy5sZW5ndGggLSAxOyBpID49IDA7IC0taSApIHtcbiAgICAgICAgICAgIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgZ3JhcGgubXVsdGlwbGllcnMuc3BsaWNlKCBpLCAxICk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIG5vZGUgPSB0aGlzLmlucHV0c1sgMCBdOyBpIDwgdmFsdWUgLSAxOyArK2kgKSB7XG4gICAgICAgICAgICBncmFwaC5tdWx0aXBsaWVyc1sgaSBdID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5tdWx0aXBsaWVyc1sgaSBdLmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0gKTtcbiAgICAgICAgICAgIG5vZGUgPSBncmFwaC5tdWx0aXBsaWVyc1sgaSBdO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIGdyYXBoLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVQb3cgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBQb3coIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogT3V0cHV0cyB0aGUgdmFsdWUgb2YgMSAvIGlucHV0VmFsdWUgKG9yIHBvdyhpbnB1dFZhbHVlLCAtMSkpXG4gKiBXaWxsIGJlIHVzZWZ1bCBmb3IgZG9pbmcgbXVsdGlwbGljYXRpdmUgZGl2aXNpb24uXG4gKlxuICogVE9ETzpcbiAqICAgICAtIFRoZSB3YXZlc2hhcGVyIGlzbid0IGFjY3VyYXRlLiBJdCBwdW1wcyBvdXQgdmFsdWVzIGRpZmZlcmluZ1xuICogICAgICAgYnkgMS43OTA2NzkzMTQwMzAxNTI1ZS05IG9yIG1vcmUuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKi9cbmNsYXNzIFJlY2lwcm9jYWwgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIG1heElucHV0ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZmFjdG9yID0gbWF4SW5wdXQgfHwgMTAwLFxuICAgICAgICAgICAgZ2FpbiA9IE1hdGgucG93KCBmYWN0b3IsIC0xICksXG4gICAgICAgICAgICBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5tYXhJbnB1dCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm1heElucHV0LmdhaW4uc2V0VmFsdWVBdFRpbWUoIGdhaW4sIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuXG4gICAgICAgIC8vIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4uc2V0VmFsdWVBdFRpbWUoIDAuMCwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG5cbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5SZWNpcHJvY2FsICk7XG5cbiAgICAgICAgLy8gdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnNldFZhbHVlQXRUaW1lKCAwLjAsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuXG4gICAgICAgIHRoaXMuaW8uY29uc3RhbnREcml2ZXIuY29ubmVjdCggZ3JhcGgubWF4SW5wdXQgKTtcbiAgICAgICAgZ3JhcGgubWF4SW5wdXQuY29ubmVjdCggdGhpcy5pbnB1dHNbIDAgXS5nYWluICk7XG4gICAgICAgIGdyYXBoLm1heElucHV0LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4gKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCBtYXhJbnB1dCgpIHtcbiAgICAgICAgcmV0dXJuIGdyYXBoLm1heElucHV0LmdhaW47XG4gICAgfVxuICAgIHNldCBtYXhJbnB1dCggdmFsdWUgKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICBncmFwaC5tYXhJbnB1dC5nYWluLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgICAgICAgICBncmFwaC5tYXhJbnB1dC5nYWluLnNldFZhbHVlQXRUaW1lKCAxIC8gdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVSZWNpcHJvY2FsID0gZnVuY3Rpb24oIG1heElucHV0ICkge1xuICAgIHJldHVybiBuZXcgUmVjaXByb2NhbCggdGhpcywgbWF4SW5wdXQgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gTk9URTpcbi8vICBPbmx5IGFjY2VwdHMgdmFsdWVzID49IC0xICYmIDw9IDEuIFZhbHVlcyBvdXRzaWRlXG4vLyAgdGhpcyByYW5nZSBhcmUgY2xhbXBlZCB0byB0aGlzIHJhbmdlLlxuY2xhc3MgUm91bmQgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5mbG9vciA9IHRoaXMuaW8uY3JlYXRlRmxvb3IoKTtcbiAgICAgICAgZ3JhcGguYWRkID0gdGhpcy5pby5jcmVhdGVBZGQoIDAuNSApO1xuICAgICAgICB0aGlzLmlucHV0c1swXS5jb25uZWN0KCBncmFwaC5hZGQgKTtcbiAgICAgICAgZ3JhcGguYWRkLmNvbm5lY3QoIGdyYXBoLmZsb29yICk7XG4gICAgICAgIGdyYXBoLmZsb29yLmNvbm5lY3QoIHRoaXMub3V0cHV0c1swXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVSb3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUm91bmQoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLypcbiAgICBBbHNvIGtub3duIGFzIHotMSwgdGhpcyBub2RlIGRlbGF5cyB0aGUgaW5wdXQgYnlcbiAgICBvbmUgc2FtcGxlLlxuICovXG5jbGFzcyBTYW1wbGVEZWxheSBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgZ3JhcGguZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gMSAvIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZGVsYXkgKTtcbiAgICAgICAgZ3JhcGguZGVsYXkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuLy8gVGhlIGZhY3RvcnkgZm9yIFNhbXBsZURlbGF5IGhhcyBhbiBhbGlhcyB0byBpdCdzIG1vcmUgY29tbW9uIG5hbWUhXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTYW1wbGVEZWxheSA9IEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVpNaW51c09uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgU2FtcGxlRGVsYXkoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gR2l2ZW4gYW4gaW5wdXQgdmFsdWUgYW5kIGl0cyBoaWdoIGFuZCBsb3cgYm91bmRzLCBzY2FsZVxuLy8gdGhhdCB2YWx1ZSB0byBuZXcgaGlnaCBhbmQgbG93IGJvdW5kcy5cbi8vXG4vLyBGb3JtdWxhIGZyb20gTWF4TVNQJ3MgU2NhbGUgb2JqZWN0OlxuLy8gIGh0dHA6Ly93d3cuY3ljbGluZzc0LmNvbS9mb3J1bXMvdG9waWMucGhwP2lkPTI2NTkzXG4vL1xuLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSkgKiAoaGlnaE91dC1sb3dPdXQpICsgbG93T3V0O1xuXG5cbi8vIFRPRE86XG4vLyAgLSBBZGQgY29udHJvbHMhXG5jbGFzcyBTY2FsZSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd0luICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEluID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaEluICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93T3V0ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaE91dCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hPdXQgKTtcblxuXG4gICAgICAgIC8vIChpbnB1dC1sb3dJbilcbiAgICAgICAgZ3JhcGguaW5wdXRNaW51c0xvd0luID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmlucHV0TWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLmlucHV0TWludXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vIChoaWdoSW4tbG93SW4pXG4gICAgICAgIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEluLmNvbm5lY3QoIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbi5jb25uZWN0KCBncmFwaC5oaWdoSW5NaW51c0xvd0luLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSlcbiAgICAgICAgZ3JhcGguZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgZ3JhcGguaW5wdXRNaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5oaWdoSW5NaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIC8vIChoaWdoT3V0LWxvd091dClcbiAgICAgICAgZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQuY29ubmVjdCggZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LmNvbm5lY3QoIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dCwgMCwgMSApO1xuXG4gICAgICAgIC8vICgoaW5wdXQtbG93SW4pIC8gKGhpZ2hJbi1sb3dJbikpICogKGhpZ2hPdXQtbG93T3V0KVxuICAgICAgICBncmFwaC5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dC5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIC8vICgoaW5wdXQtbG93SW4pIC8gKGhpZ2hJbi1sb3dJbikpICogKGhpZ2hPdXQtbG93T3V0KSArIGxvd091dFxuICAgICAgICBncmFwaC5hZGQgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseS5jb25uZWN0KCBncmFwaC5hZGQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguYWRkLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGguYWRkLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgbG93SW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmxvd0luLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbG93SW4oIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGhpZ2hJbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuaGlnaEluLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgaGlnaEluKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgbG93T3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5sb3dPdXQudmFsdWU7XG4gICAgfVxuICAgIHNldCBsb3dPdXQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBoaWdoT3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5oaWdoT3V0LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgaGlnaE91dCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaE91dC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTY2FsZSA9IGZ1bmN0aW9uKCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG4gICAgcmV0dXJuIG5ldyBTY2FsZSggdGhpcywgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIEdpdmVuIGFuIGlucHV0IHZhbHVlIGFuZCBpdHMgaGlnaCBhbmQgbG93IGJvdW5kcywgc2NhbGVcbi8vIHRoYXQgdmFsdWUgdG8gbmV3IGhpZ2ggYW5kIGxvdyBib3VuZHMuXG4vL1xuLy8gRm9ybXVsYSBmcm9tIE1heE1TUCdzIFNjYWxlIG9iamVjdDpcbi8vICBodHRwOi8vd3d3LmN5Y2xpbmc3NC5jb20vZm9ydW1zL3RvcGljLnBocD9pZD0yNjU5M1xuLy9cbi8vIGlmKCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID09PSAwICkge1xuLy8gICAgIHJldHVybiBsb3dPdXQ7XG4vLyB9XG4vLyBlbHNlIGlmKCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID4gMCApIHtcbi8vICAgICByZXR1cm4gbG93T3V0ICsgKGhpZ2hPdXQgLSBsb3dPdXQpICogTWF0aC5wb3coIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cCk7XG4vLyB9XG4vLyBlbHNlIHtcbi8vICAgICByZXR1cm4gbG93T3V0ICsgKGhpZ2hPdXQgLSBsb3dPdXQpICogLShNYXRoLnBvdyggKC1pbnB1dCArIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cCkpO1xuLy8gfVxuXG4vLyBUT0RPOlxuLy8gIC0gQWRkIGNvbnRyb2xzXG5jbGFzcyBTY2FsZUV4cCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHBvbmVudCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIC8vIGxvd0luID0gdHlwZW9mIGxvd0luID09PSAnbnVtYmVyJyA/IGxvd0luIDogMDtcbiAgICAgICAgLy8gaGlnaEluID0gdHlwZW9mIGhpZ2hJbiA9PT0gJ251bWJlcicgPyBoaWdoSW4gOiAxO1xuICAgICAgICAvLyBsb3dPdXQgPSB0eXBlb2YgbG93T3V0ID09PSAnbnVtYmVyJyA/IGxvd091dCA6IDA7XG4gICAgICAgIC8vIGhpZ2hPdXQgPSB0eXBlb2YgaGlnaE91dCA9PT0gJ251bWJlcicgPyBoaWdoT3V0IDogMTA7XG4gICAgICAgIC8vIGV4cG9uZW50ID0gdHlwZW9mIGV4cG9uZW50ID09PSAnbnVtYmVyJyA/IGV4cG9uZW50IDogMTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93SW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoSW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dPdXQgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaE91dCApO1xuICAgICAgICBncmFwaC5fZXhwb25lbnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBleHBvbmVudCApO1xuXG5cbiAgICAgICAgLy8gKGlucHV0IC0gbG93SW4pXG4gICAgICAgIGdyYXBoLmlucHV0TWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5pbnB1dE1pbnVzTG93SW4sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbi5jb25uZWN0KCBncmFwaC5pbnB1dE1pbnVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoLWlucHV0ICsgbG93SW4pXG4gICAgICAgIGdyYXBoLm1pbnVzSW5wdXQgPSB0aGlzLmlvLmNyZWF0ZU5lZ2F0ZSgpO1xuICAgICAgICBncmFwaC5taW51c0lucHV0UGx1c0xvd0luID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5taW51c0lucHV0ICk7XG4gICAgICAgIGdyYXBoLm1pbnVzSW5wdXQuY29ubmVjdCggZ3JhcGgubWludXNJbnB1dFBsdXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLm1pbnVzSW5wdXRQbHVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoaGlnaEluIC0gbG93SW4pXG4gICAgICAgIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEluLmNvbm5lY3QoIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbi5jb25uZWN0KCBncmFwaC5oaWdoSW5NaW51c0xvd0luLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikpXG4gICAgICAgIGdyYXBoLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCk7XG4gICAgICAgIGdyYXBoLmlucHV0TWludXNMb3dJbi5jb25uZWN0KCBncmFwaC5kaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguaGlnaEluTWludXNMb3dJbi5jb25uZWN0KCBncmFwaC5kaXZpZGUsIDAsIDEgKTtcblxuICAgICAgICAvLyAoLWlucHV0ICsgbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKVxuICAgICAgICBncmFwaC5uZWdhdGl2ZURpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCk7XG4gICAgICAgIGdyYXBoLm1pbnVzSW5wdXRQbHVzTG93SW4uY29ubmVjdCggZ3JhcGgubmVnYXRpdmVEaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguaGlnaEluTWludXNMb3dJbi5jb25uZWN0KCBncmFwaC5uZWdhdGl2ZURpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIC8vIChoaWdoT3V0IC0gbG93T3V0KVxuICAgICAgICBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQgPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaE91dC5jb25uZWN0KCBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gTWF0aC5wb3coIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cClcbiAgICAgICAgZ3JhcGgucG93ID0gdGhpcy5pby5jcmVhdGVQb3coIGV4cG9uZW50ICk7XG4gICAgICAgIGdyYXBoLmRpdmlkZS5jb25uZWN0KCBncmFwaC5wb3cgKTtcblxuICAgICAgICAvLyAtKE1hdGgucG93KCAoLWlucHV0ICsgbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKSlcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVQb3dOZWdhdGUgPSB0aGlzLmlvLmNyZWF0ZU5lZ2F0ZSgpO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZVBvdyA9IHRoaXMuaW8uY3JlYXRlUG93KCBleHBvbmVudCApO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZURpdmlkZS5jb25uZWN0KCBncmFwaC5uZWdhdGl2ZVBvdyApO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZVBvdy5jb25uZWN0KCBncmFwaC5uZWdhdGl2ZVBvd05lZ2F0ZSApO1xuXG5cbiAgICAgICAgLy8gbG93T3V0ICsgKGhpZ2hPdXQgLSBsb3dPdXQpICogTWF0aC5wb3coIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cCk7XG4gICAgICAgIGdyYXBoLmVsc2VJZkJyYW5jaCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLmVsc2VJZk11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQuY29ubmVjdCggZ3JhcGguZWxzZUlmTXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgucG93LmNvbm5lY3QoIGdyYXBoLmVsc2VJZk11bHRpcGx5LCAwLCAxICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LmNvbm5lY3QoIGdyYXBoLmVsc2VJZkJyYW5jaCwgMCwgMCApO1xuICAgICAgICBncmFwaC5lbHNlSWZNdWx0aXBseS5jb25uZWN0KCBncmFwaC5lbHNlSWZCcmFuY2gsIDAsIDEgKTtcblxuICAgICAgICAvLyBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiAtKE1hdGgucG93KCAoLWlucHV0ICsgbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKSk7XG4gICAgICAgIGdyYXBoLmVsc2VCcmFuY2ggPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICBncmFwaC5lbHNlTXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dC5jb25uZWN0KCBncmFwaC5lbHNlTXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVQb3dOZWdhdGUuY29ubmVjdCggZ3JhcGguZWxzZU11bHRpcGx5LCAwLCAxICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LmNvbm5lY3QoIGdyYXBoLmVsc2VCcmFuY2gsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguZWxzZU11bHRpcGx5LmNvbm5lY3QoIGdyYXBoLmVsc2VCcmFuY2gsIDAsIDEgKTtcblxuXG5cbiAgICAgICAgLy8gZWxzZSBpZiggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSA+IDAgKSB7XG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuWmVybyA9IHRoaXMuaW8uY3JlYXRlR3JlYXRlclRoYW5aZXJvKCk7XG4gICAgICAgIGdyYXBoLmlmR3JlYXRlclRoYW5aZXJvID0gdGhpcy5pby5jcmVhdGVJZkVsc2UoKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlLmNvbm5lY3QoIGdyYXBoLmdyZWF0ZXJUaGFuWmVybyApO1xuICAgICAgICBncmFwaC5ncmVhdGVyVGhhblplcm8uY29ubmVjdCggZ3JhcGguaWZHcmVhdGVyVGhhblplcm8uaWYgKTtcbiAgICAgICAgZ3JhcGguZWxzZUlmQnJhbmNoLmNvbm5lY3QoIGdyYXBoLmlmR3JlYXRlclRoYW5aZXJvLnRoZW4gKTtcbiAgICAgICAgZ3JhcGguZWxzZUJyYW5jaC5jb25uZWN0KCBncmFwaC5pZkdyZWF0ZXJUaGFuWmVyby5lbHNlICk7XG5cbiAgICAgICAgLy8gaWYoKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSA9PT0gMClcbiAgICAgICAgZ3JhcGguZXF1YWxzWmVybyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUb1plcm8oKTtcbiAgICAgICAgZ3JhcGguaWZFcXVhbHNaZXJvID0gdGhpcy5pby5jcmVhdGVJZkVsc2UoKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlLmNvbm5lY3QoIGdyYXBoLmVxdWFsc1plcm8gKTtcbiAgICAgICAgZ3JhcGguZXF1YWxzWmVyby5jb25uZWN0KCBncmFwaC5pZkVxdWFsc1plcm8uaWYgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguaWZFcXVhbHNaZXJvLnRoZW4gKTtcbiAgICAgICAgZ3JhcGguaWZHcmVhdGVyVGhhblplcm8uY29ubmVjdCggZ3JhcGguaWZFcXVhbHNaZXJvLmVsc2UgKTtcblxuICAgICAgICBncmFwaC5pZkVxdWFsc1plcm8uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCBsb3dJbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMubG93SW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBsb3dJbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgaGlnaEluKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5oaWdoSW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoSW4oIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hJbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBsb3dPdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmxvd091dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd091dCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGhpZ2hPdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQudmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoT3V0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGV4cG9uZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLl9leHBvbmVudC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGV4cG9uZW50KCB2YWx1ZSApIHtcbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuICAgICAgICBncmFwaC5fZXhwb25lbnQudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgZ3JhcGgucG93LnZhbHVlID0gdmFsdWU7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlUG93LnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNjYWxlRXhwID0gZnVuY3Rpb24oIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCwgZXhwb25lbnQgKSB7XG4gICAgcmV0dXJuIG5ldyBTY2FsZUV4cCggdGhpcywgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHBvbmVudCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBTaWduIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLlNpZ24gKTtcblxuICAgICAgICBncmFwaC5pZkVsc2UgPSB0aGlzLmlvLmNyZWF0ZUlmRWxzZSgpO1xuICAgICAgICBncmFwaC5lcXVhbFRvWmVybyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUb1plcm8oKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmVxdWFsVG9aZXJvICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguaWZFbHNlLnRoZW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcblxuICAgICAgICBncmFwaC5lcXVhbFRvWmVyby5jb25uZWN0KCBncmFwaC5pZkVsc2UuaWYgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIGdyYXBoLmlmRWxzZS5lbHNlICk7XG4gICAgICAgIGdyYXBoLmlmRWxzZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTaWduID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBTaWduKCB0aGlzICk7XG59O1xuIiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTWV0aG9kc19vZl9jb21wdXRpbmdfc3F1YXJlX3Jvb3RzI0V4YW1wbGVcbi8vXG4vLyBmb3IoIHZhciBpID0gMCwgeDsgaSA8IHNpZ0ZpZ3VyZXM7ICsraSApIHtcbi8vICAgICAgaWYoIGkgPT09IDAgKSB7XG4vLyAgICAgICAgICB4ID0gc2lnRmlndXJlcyAqIE1hdGgucG93KCAxMCwgMiApO1xuLy8gICAgICB9XG4vLyAgICAgIGVsc2Uge1xuLy8gICAgICAgICAgeCA9IDAuNSAqICggeCArIChpbnB1dCAvIHgpICk7XG4vLyAgICAgIH1cbi8vIH1cblxuLy8gVE9ETzpcbi8vICAtIE1ha2Ugc3VyZSBTcXJ0IHVzZXMgZ2V0R3JhcGggYW5kIHNldEdyYXBoLlxuY2xhc3MgU3FydEhlbHBlciB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBwcmV2aW91c1N0ZXAsIGlucHV0LCBtYXhJbnB1dCApIHtcbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IGlvLmNyZWF0ZU11bHRpcGx5KCAwLjUgKTtcbiAgICAgICAgdGhpcy5kaXZpZGUgPSBpby5jcmVhdGVEaXZpZGUoIG51bGwsIG1heElucHV0ICk7XG4gICAgICAgIHRoaXMuYWRkID0gaW8uY3JlYXRlQWRkKCk7XG5cbiAgICAgICAgLy8gaW5wdXQgLyB4O1xuICAgICAgICBpbnB1dC5jb25uZWN0KCB0aGlzLmRpdmlkZSwgMCwgMCApO1xuICAgICAgICBwcmV2aW91c1N0ZXAub3V0cHV0LmNvbm5lY3QoIHRoaXMuZGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8geCArICggaW5wdXQgLyB4IClcbiAgICAgICAgcHJldmlvdXNTdGVwLm91dHB1dC5jb25uZWN0KCB0aGlzLmFkZCwgMCwgMCApO1xuICAgICAgICB0aGlzLmRpdmlkZS5jb25uZWN0KCB0aGlzLmFkZCwgMCwgMSApO1xuXG4gICAgICAgIC8vIDAuNSAqICggeCArICggaW5wdXQgLyB4ICkgKVxuICAgICAgICB0aGlzLmFkZC5jb25uZWN0KCB0aGlzLm11bHRpcGx5ICk7XG5cbiAgICAgICAgdGhpcy5vdXRwdXQgPSB0aGlzLm11bHRpcGx5O1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHRoaXMubXVsdGlwbHkuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmRpdmlkZS5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuYWRkLmNsZWFuVXAoKTtcblxuICAgICAgICB0aGlzLm11bHRpcGx5ID0gbnVsbDtcbiAgICAgICAgdGhpcy5kaXZpZGUgPSBudWxsO1xuICAgICAgICB0aGlzLmFkZCA9IG51bGw7XG4gICAgICAgIHRoaXMub3V0cHV0ID0gbnVsbDtcbiAgICB9XG59XG5cbmNsYXNzIFNxcnQgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHNpZ25pZmljYW50RmlndXJlcywgbWF4SW5wdXQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIC8vIERlZmF1bHQgdG8gNiBzaWduaWZpY2FudCBmaWd1cmVzLlxuICAgICAgICBzaWduaWZpY2FudEZpZ3VyZXMgPSBzaWduaWZpY2FudEZpZ3VyZXMgfHwgNjtcblxuICAgICAgICBtYXhJbnB1dCA9IG1heElucHV0IHx8IDEwMDtcblxuICAgICAgICB0aGlzLngwID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggc2lnbmlmaWNhbnRGaWd1cmVzICogTWF0aC5wb3coIDEwLCAyICkgKTtcblxuICAgICAgICB0aGlzLnN0ZXBzID0gWyB7XG4gICAgICAgICAgICBvdXRwdXQ6IHRoaXMueDBcbiAgICAgICAgfSBdO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMTsgaSA8IHNpZ25pZmljYW50RmlndXJlczsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5zdGVwcy5wdXNoKFxuICAgICAgICAgICAgICAgIG5ldyBTcXJ0SGVscGVyKCB0aGlzLmlvLCB0aGlzLnN0ZXBzWyBpIC0gMSBdLCB0aGlzLmlucHV0c1sgMCBdLCBtYXhJbnB1dCApXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGVwc1sgdGhpcy5zdGVwcy5sZW5ndGggLSAxIF0ub3V0cHV0LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgLy8gY2xlYW5VcCgpIHtcbiAgICAvLyAgICAgc3VwZXIoKTtcblxuICAgIC8vICAgICB0aGlzLngwLmNsZWFuVXAoKTtcblxuICAgIC8vICAgICB0aGlzLnN0ZXBzWyAwIF0gPSBudWxsO1xuXG4gICAgLy8gICAgIGZvciggdmFyIGkgPSB0aGlzLnN0ZXBzLmxlbmd0aCAtIDE7IGkgPj0gMTsgLS1pICkge1xuICAgIC8vICAgICAgICAgdGhpcy5zdGVwc1sgaSBdLmNsZWFuVXAoKTtcbiAgICAvLyAgICAgICAgIHRoaXMuc3RlcHNbIGkgXSA9IG51bGw7XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICB0aGlzLngwID0gbnVsbDtcbiAgICAvLyAgICAgdGhpcy5zdGVwcyA9IG51bGw7XG4gICAgLy8gfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNxcnQgPSBmdW5jdGlvbiggc2lnbmlmaWNhbnRGaWd1cmVzLCBtYXhJbnB1dCApIHtcbiAgICByZXR1cm4gbmV3IFNxcnQoIHRoaXMsIHNpZ25pZmljYW50RmlndXJlcywgbWF4SW5wdXQgKTtcbn07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuY2xhc3MgU3F1YXJlIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAxICk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNxdWFyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgU3F1YXJlKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogU3VidHJhY3RzIHRoZSBzZWNvbmQgaW5wdXQgZnJvbSB0aGUgZmlyc3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKi9cbmNsYXNzIFN1YnRyYWN0IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm5lZ2F0ZSA9IHRoaXMuaW8uY3JlYXRlTmVnYXRlKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLm5lZ2F0ZSApO1xuICAgICAgICBncmFwaC5uZWdhdGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVN1YnRyYWN0ID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgU3VidHJhY3QoIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIFN3aXRjaCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtQ2FzZXMsIHN0YXJ0aW5nQ2FzZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gRW5zdXJlIHN0YXJ0aW5nQ2FzZSBpcyBuZXZlciA8IDBcbiAgICAgICAgc3RhcnRpbmdDYXNlID0gdHlwZW9mIHN0YXJ0aW5nQ2FzZSA9PT0gJ251bWJlcicgPyBNYXRoLmFicyggc3RhcnRpbmdDYXNlICkgOiBzdGFydGluZ0Nhc2U7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNhc2VzID0gW107XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5pbmRleCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHN0YXJ0aW5nQ2FzZSApO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG51bUNhc2VzOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgaSBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IDAuMDtcbiAgICAgICAgICAgIGdyYXBoLmNhc2VzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG8oIGkgKTtcbiAgICAgICAgICAgIGdyYXBoLmNhc2VzWyBpIF0uY29ubmVjdCggdGhpcy5pbnB1dHNbIGkgXS5nYWluICk7XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4LmNvbm5lY3QoIGdyYXBoLmNhc2VzWyBpIF0gKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IGNvbnRyb2woKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmluZGV4LmNvbnRyb2w7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5pbmRleC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5pbmRleC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTd2l0Y2ggPSBmdW5jdGlvbiggbnVtQ2FzZXMsIHN0YXJ0aW5nQ2FzZSApIHtcbiAgICByZXR1cm4gbmV3IFN3aXRjaCggdGhpcywgbnVtQ2FzZXMsIHN0YXJ0aW5nQ2FzZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTG9naWNhbE9wZXJhdG9yIGZyb20gXCIuL0xvZ2ljYWxPcGVyYXRvci5lczZcIjtcblxuXG5jbGFzcyBBTkQgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZUNsYW1wKCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQU5EID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBBTkQoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEFORDsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbmNsYXNzIExvZ2ljYWxPcGVyYXRvciBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguY2xhbXAgPSB0aGlzLmlvLmNyZWF0ZUNsYW1wKCAwLCAxICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSBncmFwaC5jbGFtcDtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTG9naWNhbE9wZXJhdG9yO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVMb2dpY2FsT3BlcmF0b3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IExvZ2ljYWxPcGVyYXRvciggdGhpcyApO1xufTsiLCIvLyBBTkQgLT4gTk9UIC0+IG91dFxuLy9cbmltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIE5BTkQgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG4gICAgICAgIGdyYXBoLkFORCA9IHRoaXMuaW8uY3JlYXRlQU5EKCk7XG4gICAgICAgIGdyYXBoLk5PVCA9IHRoaXMuaW8uY3JlYXRlTk9UKCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguQU5ELCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGguQU5ELCAwLCAxICk7XG4gICAgICAgIGdyYXBoLkFORC5jb25uZWN0KCBncmFwaC5OT1QgKTtcbiAgICAgICAgZ3JhcGguTk9ULmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5BTkQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE5BTkQoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IE5BTkQ7IiwiLy8gT1IgLT4gTk9UIC0+IG91dFxuaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IExvZ2ljYWxPcGVyYXRvciBmcm9tIFwiLi9Mb2dpY2FsT3BlcmF0b3IuZXM2XCI7XG5cblxuY2xhc3MgTk9SIGV4dGVuZHMgTG9naWNhbE9wZXJhdG9yIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuICAgICAgICBncmFwaC5PUiA9IHRoaXMuaW8uY3JlYXRlT1IoKTtcbiAgICAgICAgZ3JhcGguTk9UID0gdGhpcy5pby5jcmVhdGVOT1QoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5PUiwgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLk9SLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLk9SLmNvbm5lY3QoIGdyYXBoLk5PVCApO1xuICAgICAgICBncmFwaC5OT1QuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTk9SID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBOT1IoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IE5PUjsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTG9naWNhbE9wZXJhdG9yIGZyb20gXCIuL0xvZ2ljYWxPcGVyYXRvci5lczZcIjtcblxuXG5jbGFzcyBOT1QgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguYWJzID0gdGhpcy5pby5jcmVhdGVBYnMoIDEwMCApO1xuICAgICAgICBncmFwaC5zdWJ0cmFjdCA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoIDEgKTtcbiAgICAgICAgZ3JhcGgucm91bmQgPSB0aGlzLmlvLmNyZWF0ZVJvdW5kKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zdWJ0cmFjdCApO1xuICAgICAgICBncmFwaC5zdWJ0cmFjdC5jb25uZWN0KCBncmFwaC5hYnMgKTtcbiAgICAgICAgZ3JhcGguYWJzLmNvbm5lY3QoIGdyYXBoLnJvdW5kIClcblxuICAgICAgICBncmFwaC5yb3VuZC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOT1QgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE5PVCggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTk9UOyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIE9SIGV4dGVuZHMgTG9naWNhbE9wZXJhdG9yIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm1heCA9IHRoaXMuaW8uY3JlYXRlTWF4KCk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG8oIDEgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm1heCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLm1heC5jb250cm9scy52YWx1ZSApO1xuICAgICAgICBncmFwaC5tYXguY29ubmVjdCggZ3JhcGguZXF1YWxUbyApO1xuICAgICAgICBncmFwaC5lcXVhbFRvLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU9SID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBPUiggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgT1I7XG4iLCIvLyBhIGVxdWFsVG8oIGIgKSAtPiBOT1QgLT4gb3V0XG5pbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTG9naWNhbE9wZXJhdG9yIGZyb20gXCIuL0xvZ2ljYWxPcGVyYXRvci5lczZcIjtcblxuXG5jbGFzcyBYT1IgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG8oKTtcbiAgICAgICAgZ3JhcGguTk9UID0gdGhpcy5pby5jcmVhdGVOT1QoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5lcXVhbFRvICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGguZXF1YWxUby5jb250cm9scy52YWx1ZSApO1xuICAgICAgICBncmFwaC5lcXVhbFRvLmNvbm5lY3QoIGdyYXBoLk5PVCApO1xuICAgICAgICBncmFwaC5OT1QuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlWE9SID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBYT1IoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFhPUjsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBnYWluKCsxMDAwMDApIC0+IHNoYXBlciggPD0gMDogMSwgMSApXG5jbGFzcyBFcXVhbFRvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIC8vIFRPRE9cbiAgICAgICAgLy8gIC0gUmVuYW1lIHRoaXMuXG4gICAgICAgIGdyYXBoLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKSxcbiAgICAgICAgZ3JhcGguaW52ZXJzaW9uID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICBncmFwaC5pbnZlcnNpb24uZ2Fpbi52YWx1ZSA9IC0xO1xuXG4gICAgICAgIC8vIFRoaXMgY3VydmUgb3V0cHV0cyAwLjUgd2hlbiBpbnB1dCBpcyAwLFxuICAgICAgICAvLyBzbyBpdCBoYXMgdG8gYmUgcGlwZWQgaW50byBhIG5vZGUgdGhhdFxuICAgICAgICAvLyB0cmFuc2Zvcm1zIGl0IGludG8gMSwgYW5kIGxlYXZlcyB6ZXJvc1xuICAgICAgICAvLyBhbG9uZS5cbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5FcXVhbFRvWmVybyApO1xuXG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuWmVybyA9IHRoaXMuaW8uY3JlYXRlR3JlYXRlclRoYW5aZXJvKCk7XG4gICAgICAgIGdyYXBoLnZhbHVlLmNvbm5lY3QoIGdyYXBoLmludmVyc2lvbiApO1xuICAgICAgICBncmFwaC5pbnZlcnNpb24uY29ubmVjdCggdGhpcy5pbnB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCBncmFwaC5ncmVhdGVyVGhhblplcm8gKTtcbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW5aZXJvLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IGdyYXBoLnZhbHVlO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRXF1YWxUbyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IEVxdWFsVG8oIHRoaXMsIHZhbHVlICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBFcXVhbFRvOyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5pbXBvcnQgRXF1YWxUbyBmcm9tIFwiLi9FcXVhbFRvLmVzNlwiO1xuXG4vLyBIYXZlbid0IHF1aXRlIGZpZ3VyZWQgb3V0IHdoeSB5ZXQsIGJ1dCB0aGlzIHJldHVybnMgMCB3aGVuIGlucHV0IGlzIDAuXG4vLyBJdCBzaG91bGQgcmV0dXJuIDEuLi5cbi8vXG4vLyBGb3Igbm93LCBJJ20ganVzdCB1c2luZyB0aGUgRXF1YWxUbyBub2RlIHdpdGggYSBzdGF0aWMgMCBhcmd1bWVudC5cbi8vIC0tLS0tLS0tXG4vL1xuLy8gY2xhc3MgRXF1YWxUb1plcm8gZXh0ZW5kcyBOb2RlIHtcbi8vICAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4vLyAgICAgICAgIHN1cGVyKCBpbywgMSwgMCApO1xuXG4vLyAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDEwMDAwMDtcblxuLy8gICAgICAgICAvLyBUaGlzIG91dHB1dHMgMC41IHdoZW4gaW5wdXQgaXMgMCxcbi8vICAgICAgICAgLy8gc28gaXQgaGFzIHRvIGJlIHBpcGVkIGludG8gYSBub2RlIHRoYXRcbi8vICAgICAgICAgLy8gdHJhbnNmb3JtcyBpdCBpbnRvIDEsIGFuZCBsZWF2ZXMgemVyb3Ncbi8vICAgICAgICAgLy8gYWxvbmUuXG4vLyAgICAgICAgIHRoaXMuc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5FcXVhbFRvWmVybyApO1xuXG4vLyAgICAgICAgIHRoaXMub3V0cHV0c1sgMCBdID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhbiggMCApO1xuXG4vLyAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5zaGFwZXIgKTtcbi8vICAgICAgICAgdGhpcy5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbi8vICAgICB9XG5cbi8vICAgICBjbGVhblVwKCkge1xuLy8gICAgICAgICBzdXBlcigpO1xuXG4vLyAgICAgICAgIHRoaXMuc2hhcGVyLmNsZWFuVXAoKTtcbi8vICAgICAgICAgdGhpcy5zaGFwZXIgPSBudWxsO1xuLy8gICAgIH1cbi8vIH1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRXF1YWxUb1plcm8gPSBmdW5jdGlvbigpIHtcbiAgICAvLyByZXR1cm4gbmV3IEVxdWFsVG9aZXJvKCB0aGlzICk7XG5cbiAgICByZXR1cm4gbmV3IEVxdWFsVG8oIHRoaXMsIDAgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgR3JlYXRlclRoYW4gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIGdyYXBoLmludmVyc2lvbiA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgZ3JhcGguaW52ZXJzaW9uLmdhaW4udmFsdWUgPSAtMTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAxMDAwMDA7XG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuR3JlYXRlclRoYW5aZXJvICk7XG5cblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNvbm5lY3QoIGdyYXBoLmludmVyc2lvbiApO1xuICAgICAgICBncmFwaC5pbnZlcnNpb24uY29ubmVjdCggdGhpcy5pbnB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUdyZWF0ZXJUaGFuID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgR3JlYXRlclRoYW4oIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIEdyZWF0ZXJUaGFuRXF1YWxUbyBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW4gPSB0aGlzLmlvLmNyZWF0ZUdyZWF0ZXJUaGFuKCk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG8oKTtcbiAgICAgICAgZ3JhcGguT1IgPSB0aGlzLmlvLmNyZWF0ZU9SKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5jb25uZWN0KCBncmFwaC5ncmVhdGVyVGhhbi5jb250cm9scy52YWx1ZSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNvbm5lY3QoIGdyYXBoLmVxdWFsVG8uY29udHJvbHMudmFsdWUgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmdyZWF0ZXJUaGFuICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZXF1YWxUbyApO1xuICAgICAgICBncmFwaC5ncmVhdGVyVGhhbi5jb25uZWN0KCBncmFwaC5PUiwgMCwgMCApO1xuICAgICAgICBncmFwaC5lcXVhbFRvLmNvbm5lY3QoIGdyYXBoLk9SLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLk9SLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVHcmVhdGVyVGhhbkVxdWFsVG8gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBHcmVhdGVyVGhhbkVxdWFsVG8oIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIEdyZWF0ZXJUaGFuWmVybyBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDEwMDAwMDtcbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5HcmVhdGVyVGhhblplcm8gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUdyZWF0ZXJUaGFuWmVybyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgR3JlYXRlclRoYW5aZXJvKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIElmRWxzZSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAwICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnN3aXRjaCA9IHRoaXMuaW8uY3JlYXRlU3dpdGNoKCAyLCAwICk7XG5cbiAgICAgICAgdGhpcy5pZiA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUb1plcm8oKTtcbiAgICAgICAgdGhpcy5pZi5jb25uZWN0KCBncmFwaC5zd2l0Y2guY29udHJvbCApO1xuICAgICAgICB0aGlzLnRoZW4gPSBncmFwaC5zd2l0Y2guaW5wdXRzWyAwIF07XG4gICAgICAgIHRoaXMuZWxzZSA9IGdyYXBoLnN3aXRjaC5pbnB1dHNbIDEgXTtcblxuICAgICAgICB0aGlzLmlucHV0cyA9IGdyYXBoLnN3aXRjaC5pbnB1dHM7XG4gICAgICAgIHRoaXMub3V0cHV0cyA9IGdyYXBoLnN3aXRjaC5vdXRwdXRzO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVJZkVsc2UgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IElmRWxzZSggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMZXNzVGhhbiBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICBncmFwaC52YWx1ZUludmVyc2lvbiA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLnZhbHVlSW52ZXJzaW9uLmdhaW4udmFsdWUgPSAtMTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNvbm5lY3QoIGdyYXBoLnZhbHVlSW52ZXJzaW9uICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gLTEwMDAwMDtcbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5HcmVhdGVyVGhhblplcm8gKTtcblxuICAgICAgICBncmFwaC52YWx1ZUludmVyc2lvbi5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVzc1RoYW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBMZXNzVGhhbiggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgTGVzc1RoYW5FcXVhbFRvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuICAgICAgICBncmFwaC5sZXNzVGhhbiA9IHRoaXMuaW8uY3JlYXRlTGVzc1RoYW4oKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUbyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbygpO1xuICAgICAgICBncmFwaC5PUiA9IHRoaXMuaW8uY3JlYXRlT1IoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNvbm5lY3QoIGdyYXBoLmxlc3NUaGFuLmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGguZXF1YWxUby5jb250cm9scy52YWx1ZSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubGVzc1RoYW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5lcXVhbFRvICk7XG4gICAgICAgIGdyYXBoLmxlc3NUaGFuLmNvbm5lY3QoIGdyYXBoLk9SLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8uY29ubmVjdCggZ3JhcGguT1IsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguT1IuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxlc3NUaGFuRXF1YWxUbyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IExlc3NUaGFuRXF1YWxUbyggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgTGVzc1RoYW5aZXJvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguYm9vc3RlciA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmJvb3N0ZXIuZ2Fpbi52YWx1ZSA9IC0xMDAwMDA7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguYm9vc3RlciApO1xuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuR3JlYXRlclRoYW5aZXJvICk7XG5cbiAgICAgICAgZ3JhcGguYm9vc3Rlci5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxlc3NUaGFuWmVybyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTGVzc1RoYW5aZXJvKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIENvc2luZSBhcHByb3hpbWF0aW9uIVxuLy9cbi8vIE9ubHkgd29ya3MgaW4gcmFuZ2Ugb2YgLU1hdGguUEkgdG8gTWF0aC5QSS5cbmNsYXNzIENvcyBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIGdyYXBoLnNxdWFyZSA9IHRoaXMuaW8uY3JlYXRlU3F1YXJlKCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5MSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIC0yLjYwNWUtNyApO1xuICAgICAgICBncmFwaC5tdWx0aXBseTIgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5MyA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk0ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTUgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG5cbiAgICAgICAgZ3JhcGguYWRkMSA9IHRoaXMuaW8uY3JlYXRlQWRkKCAyLjQ3NjA5ZS01ICk7XG4gICAgICAgIGdyYXBoLmFkZDIgPSB0aGlzLmlvLmNyZWF0ZUFkZCggLTAuMDAxMzg4ODQgKTtcbiAgICAgICAgZ3JhcGguYWRkMyA9IHRoaXMuaW8uY3JlYXRlQWRkKCAwLjA0MTY2NjYgKTtcbiAgICAgICAgZ3JhcGguYWRkNCA9IHRoaXMuaW8uY3JlYXRlQWRkKCAtMC40OTk5MjMgKTtcbiAgICAgICAgZ3JhcGguYWRkNSA9IHRoaXMuaW8uY3JlYXRlQWRkKCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zcXVhcmUgKTtcblxuICAgICAgICAvLyBDb25uZWN0IG11bHRpcGx5MSdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkxLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBhZGQxJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5MS5jb25uZWN0KCBncmFwaC5hZGQxLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBtdWx0aXBseTIncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MiwgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQxLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MiwgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgYWRkMidzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTIuY29ubmVjdCggZ3JhcGguYWRkMiwgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgbXVsdGlwbHkzJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTMsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkMi5jb25uZWN0KCBncmFwaC5tdWx0aXBseTMsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGFkZDMncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkzLmNvbm5lY3QoIGdyYXBoLmFkZDMsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IG11bHRpcGx5NCdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk0LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDMuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNCdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTQuY29ubmVjdCggZ3JhcGguYWRkNCwgMCwgMCApO1xuXG4gICAgICAgIC8vIG11bHRpcGx5NSdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk1LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDQuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk1LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNSdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTUuY29ubmVjdCggZ3JhcGguYWRkNSwgMCwgMCApO1xuXG4gICAgICAgIC8vIE91dHB1dCAoZmluYWxseSEhKVxuICAgICAgICBncmFwaC5hZGQ1LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgLy8gU3RvcmUgY29udHJvbGxhYmxlIHBhcmFtcy5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW5wdXRzWyAwIF07XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvcyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IENvcyggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgRGVnVG9SYWQgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCBNYXRoLlBJIC8gMTgwICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEZWdUb1JhZCA9IGZ1bmN0aW9uKCBkZWcgKSB7XG4gICAgcmV0dXJuIG5ldyBEZWdUb1JhZCggdGhpcywgZGVnICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIFJhZFRvRGVnIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMub3V0cHV0c1sgMCBdID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggMTgwIC8gTWF0aC5QSSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUmFkVG9EZWcgPSBmdW5jdGlvbiggZGVnICkge1xuICAgIHJldHVybiBuZXcgUmFkVG9EZWcoIHRoaXMsIGRlZyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBTaW4gYXBwcm94aW1hdGlvbiFcbi8vXG4vLyBPbmx5IHdvcmtzIGluIHJhbmdlIG9mIC1NYXRoLlBJIHRvIE1hdGguUEkuXG5jbGFzcyBTaW4gZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgZ3JhcGguc3F1YXJlID0gdGhpcy5pby5jcmVhdGVTcXVhcmUoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkxID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggLTIuMzllLTggKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkyID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTMgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5NCA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk1ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTYgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG5cbiAgICAgICAgZ3JhcGguYWRkMSA9IHRoaXMuaW8uY3JlYXRlQWRkKCAyLjc1MjZlLTYgKTtcbiAgICAgICAgZ3JhcGguYWRkMiA9IHRoaXMuaW8uY3JlYXRlQWRkKCAtMC4wMDAxOTg0MDkgKTtcbiAgICAgICAgZ3JhcGguYWRkMyA9IHRoaXMuaW8uY3JlYXRlQWRkKCAwLjAwODMzMzMzICk7XG4gICAgICAgIGdyYXBoLmFkZDQgPSB0aGlzLmlvLmNyZWF0ZUFkZCggLTAuMTY2NjY3ICk7XG4gICAgICAgIGdyYXBoLmFkZDUgPSB0aGlzLmlvLmNyZWF0ZUFkZCggMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc3F1YXJlICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBtdWx0aXBseTEncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MSwgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgYWRkMSdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTEuY29ubmVjdCggZ3JhcGguYWRkMSwgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgbXVsdGlwbHkyJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTIsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkMS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTIsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIGFkZDIncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkyLmNvbm5lY3QoIGdyYXBoLmFkZDIsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIG11bHRpcGx5MydzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkzLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDIuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkzLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBhZGQzJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5My5jb25uZWN0KCBncmFwaC5hZGQzLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBtdWx0aXBseTQncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5NCwgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQzLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5NCwgMCwgMSApO1xuXG4gICAgICAgIC8vIGFkZDQncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk0LmNvbm5lY3QoIGdyYXBoLmFkZDQsIDAsIDAgKTtcblxuICAgICAgICAvLyBtdWx0aXBseTUncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5NSwgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQ0LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5NSwgMCwgMSApO1xuXG4gICAgICAgIC8vIGFkZDUncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk1LmNvbm5lY3QoIGdyYXBoLmFkZDUsIDAsIDAgKTtcblxuICAgICAgICAvLyBtdWx0aXBseTYncyBpbnB1dHNcbiAgICAgICAgdGhpcy5pbnB1dHNbMF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbHk2LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk2LCAwLCAxICk7XG5cbiAgICAgICAgLy8gT3V0cHV0IChmaW5hbGx5ISEpXG4gICAgICAgIGdyYXBoLm11bHRpcGx5Ni5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTaW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBTaW4oIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIFRhbmdlbnQgYXBwcm94aW1hdGlvbiFcbi8vXG4vLyBPbmx5IHdvcmtzIGluIHJhbmdlIG9mIC1NYXRoLlBJIHRvIE1hdGguUEkuXG4vL1xuLy8gc2luKCBpbnB1dCApIC8gY29zKCBpbnB1dCApXG5jbGFzcyBUYW4gZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgZ3JhcGguc2luZSA9IHRoaXMuaW8uY3JlYXRlU2luKCk7XG4gICAgICAgIGdyYXBoLmNvcyA9IHRoaXMuaW8uY3JlYXRlQ29zKCk7XG4gICAgICAgIGdyYXBoLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCB1bmRlZmluZWQsIE1hdGguUEkgKiAyICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaW5lICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguY29zICk7XG4gICAgICAgIGdyYXBoLnNpbmUuY29ubmVjdCggZ3JhcGguZGl2aWRlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmNvcy5jb25uZWN0KCBncmFwaC5kaXZpZGUsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlVGFuID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgVGFuKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgQ09ORklHIGZyb20gXCIuLi9jb3JlL2NvbmZpZy5lczZcIjtcblxuZnVuY3Rpb24gUGlua051bWJlcigpIHtcbiAgICB0aGlzLm1heEtleSA9IDB4MWY7XG4gICAgdGhpcy5rZXkgPSAwO1xuICAgIHRoaXMud2hpdGVWYWx1ZXMgPSBbXTtcbiAgICB0aGlzLnJhbmdlID0gMTI4O1xuICAgIHRoaXMubGltaXQgPSA1O1xuXG4gICAgdGhpcy5nZW5lcmF0ZSA9IHRoaXMuZ2VuZXJhdGUuYmluZCggdGhpcyApO1xuICAgIHRoaXMuZ2V0TmV4dFZhbHVlID0gdGhpcy5nZXROZXh0VmFsdWUuYmluZCggdGhpcyApO1xufVxuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZW5lcmF0ZSA9IGZ1bmN0aW9uKCByYW5nZSwgbGltaXQgKSB7XG4gICAgdGhpcy5yYW5nZSA9IHJhbmdlIHx8IDEyODtcbiAgICB0aGlzLm1heEtleSA9IDB4MWY7XG4gICAgdGhpcy5rZXkgPSAwO1xuICAgIHRoaXMubGltaXQgPSBsaW1pdCB8fCAxO1xuXG5cdHZhciByYW5nZUxpbWl0ID0gdGhpcy5yYW5nZSAvIHRoaXMubGltaXQ7XG5cbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubGltaXQ7ICsraSApIHtcbiAgICAgICAgdGhpcy53aGl0ZVZhbHVlc1sgaSBdID0gTWF0aC5yYW5kb20oKSAlIHJhbmdlTGltaXQ7XG4gICAgfVxufTtcblxuUGlua051bWJlci5wcm90b3R5cGUuZ2V0TmV4dFZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxhc3RLZXkgPSB0aGlzLmtleSxcbiAgICAgICAgc3VtID0gMDtcblxuICAgICsrdGhpcy5rZXk7XG5cbiAgICBpZiggdGhpcy5rZXkgPiB0aGlzLm1heEtleSApIHtcbiAgICAgICAgdGhpcy5rZXkgPSAwO1xuICAgIH1cblxuICAgIHZhciBkaWZmID0gdGhpcy5sYXN0S2V5IF4gdGhpcy5rZXk7XG4gICAgdmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICBpZiggZGlmZiAmICgxIDw8IGkpICkge1xuICAgICAgICAgICAgdGhpcy53aGl0ZVZhbHVlc1sgaSBdID0gTWF0aC5yYW5kb20oKSAlIHJhbmdlTGltaXQ7XG4gICAgICAgIH1cblxuICAgICAgICBzdW0gKz0gdGhpcy53aGl0ZVZhbHVlc1sgaSBdO1xuICAgIH1cblxuICAgIHJldHVybiBzdW0gLyB0aGlzLmxpbWl0O1xufTtcblxudmFyIHBpbmsgPSBuZXcgUGlua051bWJlcigpO1xucGluay5nZW5lcmF0ZSgpO1xuXG5cblxuXG5cbmV4cG9ydCBkZWZhdWx0IHtcblx0cm91bmRGcm9tRXBzaWxvbjogZnVuY3Rpb24oIG4gKSB7XG5cdFx0bGV0IHJvdW5kZWQgPSBNYXRoLnJvdW5kKCBuICk7XG5cblx0XHRpZiAoIHJvdW5kZWQgJSBuIDwgQ09ORklHLmVwc2lsb24gKSB7XG5cdFx0XHRyZXR1cm4gcm91bmRlZFxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiBuO1xuXHRcdH1cblx0fSxcblxuXHRyb3VuZFRvTXVsdGlwbGU6IGZ1bmN0aW9uKCBuLCBtdWx0aXBsZSApIHtcblx0XHRyZXR1cm4gTWF0aC5mbG9vciggKCBuICsgbXVsdGlwbGUgLSAxICkgLyBtdWx0aXBsZSApICogbXVsdGlwbGU7XG5cdH0sXG5cblx0Y2xhbXA6IGZ1bmN0aW9uKCB2YWx1ZSwgbWluLCBtYXggKSB7XG5cdFx0cmV0dXJuIE1hdGgubWluKCBtYXgsIE1hdGgubWF4KCB2YWx1ZSwgbWluICkgKTtcblx0fSxcblxuXHRzY2FsZU51bWJlcjogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICkge1xuXHRcdHJldHVybiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSApICogKCBoaWdoT3V0IC0gbG93T3V0ICkgKyBsb3dPdXQ7XG5cdH0sXG5cblx0c2NhbGVOdW1iZXJFeHA6IGZ1bmN0aW9uKCBudW0sIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCwgZXhwICkge1xuXHRcdGlmICggdHlwZW9mIGV4cCAhPT0gJ251bWJlcicgfHwgZXhwID09PSAxICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc2NhbGVOdW1iZXIoIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICk7XG5cdFx0fVxuXG5cdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPT09IDAgKSB7XG5cdFx0XHRyZXR1cm4gbG93T3V0O1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApID4gMCApIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiBNYXRoLnBvdyggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApLCBleHAgKSApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHJldHVybiAoIGxvd091dCArICggaGlnaE91dCAtIGxvd091dCApICogLSggTWF0aC5wb3coICggKCAtbnVtICsgbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSApLCBleHAgKSApICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdC8vIEEgdmVyeSBwb29yIGFwcHJveGltYXRpb24gb2YgYSBnYXVzc2lhbiByYW5kb20gbnVtYmVyIGdlbmVyYXRvciFcblx0Z2F1c3NpYW5SYW5kb206IGZ1bmN0aW9uKCBjeWNsZXMgKSB7XG5cdFx0Y3ljbGVzID0gY3ljbGVzIHx8IDEwO1xuXG5cdFx0dmFyIG4gPSAwLFxuXHRcdFx0aSA9IGN5Y2xlcztcblxuXHRcdHdoaWxlKCAtLWkgKSB7XG5cdFx0XHRuICs9IE1hdGgucmFuZG9tKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG4gLyBjeWNsZXM7XG5cdH0sXG5cblx0Ly8gRnJvbTpcblx0Ly8gXHRodHRwOi8vd3d3Lm1lcmVkaXRoZG9kZ2UuY29tLzIwMTIvMDUvMzAvYS1ncmVhdC1saXR0bGUtamF2YXNjcmlwdC1mdW5jdGlvbi1mb3ItZ2VuZXJhdGluZy1yYW5kb20tZ2F1c3NpYW5ub3JtYWxiZWxsLWN1cnZlLW51bWJlcnMvXG5cdG5yYW5kOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgeDEsXG5cdFx0XHR4Mixcblx0XHRcdHJhZCxcblx0XHRcdHkxO1xuXG5cdFx0ZG8ge1xuXHRcdFx0eDEgPSAyICogTWF0aC5yYW5kb20oKSAtIDE7XG5cdFx0XHR4MiA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHJhZCA9IHgxICogeDEgKyB4MiAqIHgyO1xuXHRcdH0gd2hpbGUoIHJhZCA+PSAxIHx8IHJhZCA9PT0gMCApO1xuXG5cdFx0dmFyIGMgPSBNYXRoLnNxcnQoIC0yICogTWF0aC5sb2coIHJhZCApIC8gcmFkICk7XG5cblx0XHRyZXR1cm4gKCh4MSAqIGMpIC8gNSkgKiAwLjUgKyAwLjU7XG5cdH0sXG5cblx0Z2VuZXJhdGVQaW5rTnVtYmVyOiBwaW5rLmdlbmVyYXRlLFxuXHRnZXROZXh0UGlua051bWJlcjogcGluay5nZXROZXh0VmFsdWUsXG5cbn07IiwiZXhwb3J0IGRlZmF1bHQge1xuICAgIGNsZWFuVXBJbk91dHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaW5wdXRzLFxuICAgICAgICAgICAgb3V0cHV0cztcblxuICAgICAgICBpZiggQXJyYXkuaXNBcnJheSggdGhpcy5pbnB1dHMgKSApIHtcbiAgICAgICAgICAgIGlucHV0cyA9IHRoaXMuaW5wdXRzO1xuXG4gICAgICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgICAgICBpZiggaW5wdXRzWyBpIF0gJiYgdHlwZW9mIGlucHV0c1sgaSBdLmNsZWFuVXAgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0c1sgaSBdLmNsZWFuVXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiggaW5wdXRzWyBpIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0c1sgaSBdLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpbnB1dHNbIGkgXSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuaW5wdXRzID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KCB0aGlzLm91dHB1dHMgKSApIHtcbiAgICAgICAgICAgIG91dHB1dHMgPSB0aGlzLm91dHB1dHM7XG5cbiAgICAgICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgb3V0cHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgICAgICBpZiggb3V0cHV0c1sgaSBdICYmIHR5cGVvZiBvdXRwdXRzWyBpIF0uY2xlYW5VcCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0c1sgaSBdLmNsZWFuVXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiggb3V0cHV0c1sgaSBdICkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRzWyBpIF0uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG91dHB1dHNbIGkgXSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMub3V0cHV0cyA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY2xlYW5JTzogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmKCB0aGlzLmlvICkge1xuICAgICAgICAgICAgdGhpcy5pbyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiggdGhpcy5jb250ZXh0ICkge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn07IiwidmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgY29ubmVjdDogZnVuY3Rpb24oIG5vZGUsIG91dHB1dENoYW5uZWwgPSAwLCBpbnB1dENoYW5uZWwgPSAwICkge1xuICAgICAgICBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb1BhcmFtIHx8IG5vZGUgaW5zdGFuY2VvZiBBdWRpb05vZGUgKSB7XG4gICAgICAgICAgICAvLyB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXS5jb25uZWN0KCBub2RlICk7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXS5jb25uZWN0LmNhbGwoIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLCBub2RlLCAwLCBpbnB1dENoYW5uZWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKCBub2RlICYmIG5vZGUub3V0cHV0cyAmJiBub2RlLm91dHB1dHMubGVuZ3RoICkge1xuICAgICAgICAgICAgLy8gaWYoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSBpbnN0YW5jZW9mIFBhcmFtICkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coICdDT05ORUNUSU5HIFRPIFBBUkFNJyApO1xuICAgICAgICAgICAgLy8gbm9kZS5pby5jb25zdGFudERyaXZlci5kaXNjb25uZWN0KCBub2RlLmNvbnRyb2wgKTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0uY29ubmVjdCggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdICk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdBU1NFUlQgTk9UIFJFQUNIRUQnICk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyggYXJndW1lbnRzICk7XG4gICAgICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZGlzY29ubmVjdDogZnVuY3Rpb24oIG5vZGUsIG91dHB1dENoYW5uZWwgPSAwLCBpbnB1dENoYW5uZWwgPSAwICkge1xuICAgICAgICBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb1BhcmFtIHx8IG5vZGUgaW5zdGFuY2VvZiBBdWRpb05vZGUgKSB7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXS5kaXNjb25uZWN0LmNhbGwoIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLCBub2RlLCAwLCBpbnB1dENoYW5uZWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKCBub2RlICYmIG5vZGUuaW5wdXRzICYmIG5vZGUuaW5wdXRzLmxlbmd0aCApIHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmRpc2Nvbm5lY3QoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgPT09IHVuZGVmaW5lZCAmJiB0aGlzLm91dHB1dHMgKSB7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHMuZm9yRWFjaCggZnVuY3Rpb24oIG4gKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBuICYmIHR5cGVvZiBuLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgICAgICAgIG4uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjaGFpbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub2RlcyA9IHNsaWNlLmNhbGwoIGFyZ3VtZW50cyApLFxuICAgICAgICAgICAgbm9kZSA9IHRoaXM7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QuY2FsbCggbm9kZSwgbm9kZXNbIGkgXSApO1xuICAgICAgICAgICAgbm9kZSA9IG5vZGVzWyBpIF07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZmFuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVzID0gc2xpY2UuY2FsbCggYXJndW1lbnRzICksXG4gICAgICAgICAgICBub2RlID0gdGhpcztcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdC5jYWxsKCBub2RlLCBub2Rlc1sgaSBdICk7XG4gICAgICAgIH1cbiAgICB9XG59OyIsImltcG9ydCBtYXRoIGZyb20gXCIuL21hdGguZXM2XCI7XG5pbXBvcnQgbm90ZVN0cmluZ3MgZnJvbSBcIi4vbm90ZVN0cmluZ3MuZXM2XCI7XG5pbXBvcnQgbm90ZXMgZnJvbSBcIi4vbm90ZXMuZXM2XCI7XG5pbXBvcnQgQ09ORklHIGZyb20gXCIuLi9jb3JlL2NvbmZpZy5lczZcIjtcbmltcG9ydCBub3RlUmVnRXhwIGZyb20gXCIuL25vdGVSZWdFeHAuZXM2XCI7XG5cblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHNjYWxhclRvRGI6IGZ1bmN0aW9uKCBzY2FsYXIgKSB7XG4gICAgICAgIHJldHVybiAyMCAqICggTWF0aC5sb2coIHNjYWxhciApIC8gTWF0aC5MTjEwICk7XG4gICAgfSxcbiAgICBkYlRvU2NhbGFyOiBmdW5jdGlvbiggZGIgKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnBvdyggMiwgZGIgLyA2ICk7XG4gICAgfSxcblxuICAgIGh6VG9NSURJOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiBtYXRoLnJvdW5kRnJvbUVwc2lsb24oIDY5ICsgMTIgKiBNYXRoLmxvZzIoIHZhbHVlIC8gNDQwICkgKTtcbiAgICB9LFxuXG4gICAgaHpUb05vdGU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvTm90ZSggdGhpcy5oelRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBoelRvTXM6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgaWYgKCB2YWx1ZSA9PT0gMCApIHJldHVybiAwO1xuICAgICAgICByZXR1cm4gMTAwMCAvIHZhbHVlO1xuICAgIH0sXG5cbiAgICBoelRvQlBNOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zVG9CUE0oIHRoaXMuaHpUb01zKCB2YWx1ZSApICk7XG4gICAgfSxcblxuXG5cbiAgICBtaWRpVG9IejogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gTWF0aC5wb3coIDIsICggdmFsdWUgLSA2OSApIC8gMTIgKSAqIDQ0MDtcbiAgICB9LFxuXG4gICAgbWlkaVRvTm90ZTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICBsZXQgdmFsdWVzID0gKCB2YWx1ZSArICcnICkuc3BsaXQoICcuJyApLFxuICAgICAgICAgICAgbm90ZVZhbHVlID0gK3ZhbHVlc1sgMCBdLFxuICAgICAgICAgICAgY2VudHMgPSAoIHZhbHVlc1sgMSBdID8gcGFyc2VGbG9hdCggJzAuJyArIHZhbHVlc1sgMSBdLCAxMCApIDogMCApICogMTAwO1xuXG4gICAgICAgIGlmICggTWF0aC5hYnMoIGNlbnRzICkgPj0gMTAwICkge1xuICAgICAgICAgICAgbm90ZVZhbHVlICs9IGNlbnRzICUgMTAwO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJvb3QgPSBub3RlVmFsdWUgJSAxMiB8IDAsXG4gICAgICAgICAgICBvY3RhdmUgPSBub3RlVmFsdWUgLyAxMiB8IDAsXG4gICAgICAgICAgICBub3RlTmFtZSA9IG5vdGVTdHJpbmdzWyByb290IF07XG5cbiAgICAgICAgcmV0dXJuIG5vdGVOYW1lICsgKCBvY3RhdmUgKyBDT05GSUcubG93ZXN0T2N0YXZlICkgKyAoIGNlbnRzID8gJysnICsgY2VudHMgOiAnJyApO1xuICAgIH0sXG5cbiAgICBtaWRpVG9NczogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5oelRvTXMoIHRoaXMubWlkaVRvSHooIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbWlkaVRvQlBNOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zVG9CUE0oIHRoaXMubWlkaVRvTXMoIHZhbHVlICkgKTtcbiAgICB9LFxuXG5cblxuICAgIG5vdGVUb0h6OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb0h6KCB0aGlzLm5vdGVUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbm90ZVRvTUlESTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICBsZXQgbWF0Y2hlcyA9IG5vdGVSZWdFeHAuZXhlYyggdmFsdWUgKSxcbiAgICAgICAgICAgIG5vdGUsIGFjY2lkZW50YWwsIG9jdGF2ZSwgY2VudHMsXG4gICAgICAgICAgICBub3RlVmFsdWU7XG5cbiAgICAgICAgaWYgKCAhbWF0Y2hlcyApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ0ludmFsaWQgbm90ZSBmb3JtYXQ6JywgdmFsdWUgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vdGUgPSBtYXRjaGVzWyAxIF07XG4gICAgICAgIGFjY2lkZW50YWwgPSBtYXRjaGVzWyAyIF07XG4gICAgICAgIG9jdGF2ZSA9IHBhcnNlSW50KCBtYXRjaGVzWyAzIF0sIDEwICkgKyAtQ09ORklHLmxvd2VzdE9jdGF2ZTtcbiAgICAgICAgY2VudHMgPSBwYXJzZUZsb2F0KCBtYXRjaGVzWyA0IF0gKSB8fCAwO1xuXG4gICAgICAgIG5vdGVWYWx1ZSA9IG5vdGVzWyBub3RlICsgYWNjaWRlbnRhbCBdO1xuXG4gICAgICAgIHJldHVybiBtYXRoLnJvdW5kRnJvbUVwc2lsb24oIG5vdGVWYWx1ZSArICggb2N0YXZlICogMTIgKSArICggY2VudHMgKiAwLjAxICkgKTtcbiAgICB9LFxuXG4gICAgbm90ZVRvTXM6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvTXMoIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBub3RlVG9CUE06IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvQlBNKCB0aGlzLm5vdGVUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG5cblxuICAgIG1zVG9IejogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5oelRvTXMoIHZhbHVlICk7XG4gICAgfSxcblxuICAgIG1zVG9Ob3RlOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb01zKCB0aGlzLm5vdGVUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbXNUb01JREk6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaHpUb01JREkoIHRoaXMubXNUb0h6KCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIG1zVG9CUE06IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSAwID8gMCA6IDYwMDAwIC8gdmFsdWU7XG4gICAgfSxcblxuXG5cbiAgICBicG1Ub0h6OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zVG9IeiggdGhpcy5icG1Ub01zKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGJwbVRvTm90ZTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9CUE0oIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBicG1Ub01JREk6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb01JREkoIHRoaXMuYnBtVG9NcyggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBicG1Ub01zOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zVG9CUE0oIHZhbHVlICk7XG4gICAgfVxufTsiLCJpbXBvcnQgQ09ORklHIGZyb20gXCIuLi9jb3JlL2NvbmZpZy5lczZcIjtcblxuZnVuY3Rpb24gUGlua051bWJlcigpIHtcbiAgICB0aGlzLm1heEtleSA9IDB4MWY7XG4gICAgdGhpcy5rZXkgPSAwO1xuICAgIHRoaXMud2hpdGVWYWx1ZXMgPSBbXTtcbiAgICB0aGlzLnJhbmdlID0gMTI4O1xuICAgIHRoaXMubGltaXQgPSA1O1xuXG4gICAgdGhpcy5nZW5lcmF0ZSA9IHRoaXMuZ2VuZXJhdGUuYmluZCggdGhpcyApO1xuICAgIHRoaXMuZ2V0TmV4dFZhbHVlID0gdGhpcy5nZXROZXh0VmFsdWUuYmluZCggdGhpcyApO1xufVxuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZW5lcmF0ZSA9IGZ1bmN0aW9uKCByYW5nZSwgbGltaXQgKSB7XG4gICAgdGhpcy5yYW5nZSA9IHJhbmdlIHx8IDEyODtcbiAgICB0aGlzLm1heEtleSA9IDB4MWY7XG4gICAgdGhpcy5rZXkgPSAwO1xuICAgIHRoaXMubGltaXQgPSBsaW1pdCB8fCAxO1xuXG5cdHZhciByYW5nZUxpbWl0ID0gdGhpcy5yYW5nZSAvIHRoaXMubGltaXQ7XG5cbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubGltaXQ7ICsraSApIHtcbiAgICAgICAgdGhpcy53aGl0ZVZhbHVlc1sgaSBdID0gTWF0aC5yYW5kb20oKSAlIHJhbmdlTGltaXQ7XG4gICAgfVxufTtcblxuUGlua051bWJlci5wcm90b3R5cGUuZ2V0TmV4dFZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxhc3RLZXkgPSB0aGlzLmtleSxcbiAgICAgICAgc3VtID0gMDtcblxuICAgICsrdGhpcy5rZXk7XG5cbiAgICBpZiggdGhpcy5rZXkgPiB0aGlzLm1heEtleSApIHtcbiAgICAgICAgdGhpcy5rZXkgPSAwO1xuICAgIH1cblxuICAgIHZhciBkaWZmID0gdGhpcy5sYXN0S2V5IF4gdGhpcy5rZXk7XG4gICAgdmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICBpZiggZGlmZiAmICgxIDw8IGkpICkge1xuICAgICAgICAgICAgdGhpcy53aGl0ZVZhbHVlc1sgaSBdID0gTWF0aC5yYW5kb20oKSAlIHJhbmdlTGltaXQ7XG4gICAgICAgIH1cblxuICAgICAgICBzdW0gKz0gdGhpcy53aGl0ZVZhbHVlc1sgaSBdO1xuICAgIH1cblxuICAgIHJldHVybiBzdW0gLyB0aGlzLmxpbWl0O1xufTtcblxudmFyIHBpbmsgPSBuZXcgUGlua051bWJlcigpO1xucGluay5nZW5lcmF0ZSgpO1xuXG5cblxuXG5cbmV4cG9ydCBkZWZhdWx0IHtcblx0cm91bmRGcm9tRXBzaWxvbjogZnVuY3Rpb24oIG4gKSB7XG5cdFx0bGV0IHJvdW5kZWQgPSBNYXRoLnJvdW5kKCBuICk7XG5cblx0XHRpZiAoIHJvdW5kZWQgJSBuIDwgQ09ORklHLmVwc2lsb24gKSB7XG5cdFx0XHRyZXR1cm4gcm91bmRlZFxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiBuO1xuXHRcdH1cblx0fSxcblxuXHRyb3VuZFRvTXVsdGlwbGU6IGZ1bmN0aW9uKCBuLCBtdWx0aXBsZSApIHtcblx0XHRyZXR1cm4gTWF0aC5mbG9vciggKCBuICsgbXVsdGlwbGUgLSAxICkgLyBtdWx0aXBsZSApICogbXVsdGlwbGU7XG5cdH0sXG5cblx0Y2xhbXA6IGZ1bmN0aW9uKCB2YWx1ZSwgbWluLCBtYXggKSB7XG5cdFx0cmV0dXJuIE1hdGgubWluKCBtYXgsIE1hdGgubWF4KCB2YWx1ZSwgbWluICkgKTtcblx0fSxcblxuXHRzY2FsZU51bWJlcjogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICkge1xuXHRcdHJldHVybiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSApICogKCBoaWdoT3V0IC0gbG93T3V0ICkgKyBsb3dPdXQ7XG5cdH0sXG5cblx0c2NhbGVOdW1iZXJFeHA6IGZ1bmN0aW9uKCBudW0sIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCwgZXhwICkge1xuXHRcdGlmICggdHlwZW9mIGV4cCAhPT0gJ251bWJlcicgfHwgZXhwID09PSAxICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc2NhbGVOdW1iZXIoIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICk7XG5cdFx0fVxuXG5cdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPT09IDAgKSB7XG5cdFx0XHRyZXR1cm4gbG93T3V0O1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApID4gMCApIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiBNYXRoLnBvdyggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApLCBleHAgKSApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHJldHVybiAoIGxvd091dCArICggaGlnaE91dCAtIGxvd091dCApICogLSggTWF0aC5wb3coICggKCAtbnVtICsgbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSApLCBleHAgKSApICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdC8vIEEgdmVyeSBwb29yIGFwcHJveGltYXRpb24gb2YgYSBnYXVzc2lhbiByYW5kb20gbnVtYmVyIGdlbmVyYXRvciFcblx0Z2F1c3NpYW5SYW5kb206IGZ1bmN0aW9uKCBjeWNsZXMgKSB7XG5cdFx0Y3ljbGVzID0gY3ljbGVzIHx8IDEwO1xuXG5cdFx0dmFyIG4gPSAwLFxuXHRcdFx0aSA9IGN5Y2xlcztcblxuXHRcdHdoaWxlKCAtLWkgKSB7XG5cdFx0XHRuICs9IE1hdGgucmFuZG9tKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG4gLyBjeWNsZXM7XG5cdH0sXG5cblx0Ly8gRnJvbTpcblx0Ly8gXHRodHRwOi8vd3d3Lm1lcmVkaXRoZG9kZ2UuY29tLzIwMTIvMDUvMzAvYS1ncmVhdC1saXR0bGUtamF2YXNjcmlwdC1mdW5jdGlvbi1mb3ItZ2VuZXJhdGluZy1yYW5kb20tZ2F1c3NpYW5ub3JtYWxiZWxsLWN1cnZlLW51bWJlcnMvXG5cdG5yYW5kOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgeDEsXG5cdFx0XHR4Mixcblx0XHRcdHJhZCxcblx0XHRcdHkxO1xuXG5cdFx0ZG8ge1xuXHRcdFx0eDEgPSAyICogTWF0aC5yYW5kb20oKSAtIDE7XG5cdFx0XHR4MiA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHJhZCA9IHgxICogeDEgKyB4MiAqIHgyO1xuXHRcdH0gd2hpbGUoIHJhZCA+PSAxIHx8IHJhZCA9PT0gMCApO1xuXG5cdFx0dmFyIGMgPSBNYXRoLnNxcnQoIC0yICogTWF0aC5sb2coIHJhZCApIC8gcmFkICk7XG5cblx0XHRyZXR1cm4gKCh4MSAqIGMpIC8gNSkgKiAwLjUgKyAwLjU7XG5cdH0sXG5cblx0Z2VuZXJhdGVQaW5rTnVtYmVyOiBwaW5rLmdlbmVyYXRlLFxuXHRnZXROZXh0UGlua051bWJlcjogcGluay5nZXROZXh0VmFsdWUsXG5cbn07IiwiZXhwb3J0IGRlZmF1bHQgL14oW0F8QnxDfER8RXxGfEddezF9KShbI2J4XXswLDJ9KShbXFwtXFwrXT9cXGQrKT8oW1xcK3xcXC1dezF9XFxkKi5cXGQqKT8vOyIsImV4cG9ydCBkZWZhdWx0IFsgJ0MnLCAnQyMnLCAnRCcsICdEIycsICdFJywgJ0YnLCAnRiMnLCAnRycsICdHIycsICdBJywgJ0EjJywgJ0InIF07IiwiZXhwb3J0IGRlZmF1bHQge1xuICAgICdDJzogMCwgICAgICdEYmInOiAwLCAgICdCIyc6IDAsXG4gICAgJ0MjJzogMSwgICAgJ0RiJzogMSwgICAgJ0IjIyc6IDEsICAgJ0J4JzogMSxcbiAgICAnRCc6IDIsICAgICAnRWJiJzogMiwgICAnQyMjJzogMiwgICAnQ3gnOiAyLFxuICAgICdEIyc6IDMsICAgICdFYic6IDMsICAgICdGYmInOiAzLFxuICAgICdFJzogNCwgICAgICdGYic6IDQsICAgICdEIyMnOiA0LCAgICdEeCc6IDQsXG4gICAgJ0YnOiA1LCAgICAgJ0diYic6IDUsICAgJ0UjJzogNSxcbiAgICAnRiMnOiA2LCAgICAnR2InOiA2LCAgICAnRSMjJzogNiwgICAnRXgnOiA2LFxuICAgICdHJzogNywgICAgICdBYmInOiA3LCAgICdGIyMnOiA3LCAgJ0Z4JzogNyxcbiAgICAnRyMnOiA4LCAgICAnQWInOiA4LFxuICAgICdBJzogOSwgICAgICdCYmInOiA5LCAgICdHIyMnOiA5LCAgJ0d4JzogOSxcbiAgICAnQSMnOiAxMCwgICAnQmInOiAxMCwgICAnQ2JiJzogMTAsXG4gICAgJ0InOiAxMSwgICAgJ0NiJzogMTEsICAgJ0EjIyc6IDExLCAnQXgnOiAxMVxufTsiLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBfc2V0SU8oIGlvICkge1xuICAgIHRoaXMuaW8gPSBpbztcbiAgICB0aGlzLmNvbnRleHQgPSBpby5jb250ZXh0O1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcbmltcG9ydCBCdWZmZXJHZW5lcmF0b3JzIGZyb20gXCIuLi9idWZmZXJzL0J1ZmZlckdlbmVyYXRvcnMuZXM2XCI7XG5pbXBvcnQgQnVmZmVyVXRpbHMgZnJvbSBcIi4uL2J1ZmZlcnMvQnVmZmVyVXRpbHMuZXM2XCI7XG5cbi8vIFRPRE86XG4vLyBcdC0gSXNzdWUgd2l0aCBwbGF5YmFjayByYXRlIG5vdCBoYXZpbmcgYSB3aWRlIGVub3VnaCByYW5nZVxuLy8gXHQgIHRvIHN1cHBvcnQgdGhlIGZ1bGwgZnJlcXVlbmN5IHJhbmdlLlxuLy8gXHQgIFxuLy8gXHQtIEZpeDpcbi8vIFx0XHQtIENyZWF0ZSBtdWx0aXBsZSBidWZmZXIgc291cmNlcyBhdHRhY2hlZCB0byBhIHN3aXRjaC5cbi8vIFx0XHQtIE51bWJlciBvZiBzb3VyY2VzOiBcbi8vIFx0XHRcdEF2YWlsYWJsZSByYW5nZTogMTAyNCBcbi8vIFx0XHRcdFx0KiAtNTEyIHRvICs1MTIgaXMgYSBmYWlyIGJhbGFuY2UgYmV0d2VlbiByYW5nZSBhbmQgXG4vLyBcdFx0XHRcdGFydGlmYWN0cyBvbiBkaWZmZXJlbnQgYnJvd3NlcnMsIEZpcmVmb3ggaGF2aW5nIGlzc3Vlc1xuLy8gXHRcdFx0XHRhcm91bmQgdGhlICs4MDAgbWFyaywgQ2hyb21lIHN0b3BzIGluY3JlYXNpbmcgXG4vLyBcdFx0XHRcdGFmdGVyIGFyb3VuZCArMTAwMC4gU2FmYXJpIGlzIGp1c3QgYnJva2VuOiBwbGF5YmFja1JhdGUgXG4vLyBcdFx0XHRcdEF1ZGlvUGFyYW0gY2Fubm90IGJlIGRyaXZlbiBieSBhdWRpbyBzaWduYWwuIFdhdC5cbi8vIFx0XHRcdE1heCBmcmVxOiBzYW1wbGVSYXRlICogMC41XG4vLyBcdFx0XHRcbi8vIFx0XHRcdG51bVNvdXJjZXM6IE1hdGguY2VpbCggbWF4RnJlcSAvIGF2YWlsYWJsZVJhbmdlIClcbi8vIFx0XHRcdFx0XG4vLyBcdFx0XHRicmVha3BvaW50czogaSAqIG1heEZyZXFcbi8vIFx0XHRcdGluaXRpYWwgdmFsdWUgb2YgcGxheWJhY2tSYXRlOiAtNTEyLlxuLy8gXHRcdFx0XG4vLyBcdFx0LSBGb3Igc2FtcGxlUmF0ZSBvZiA0ODAwMDpcbi8vIFx0XHRcdG51bVNvdXJjZXM6IE1hdGguY2VpbCggKDQ4MDAwICogMC41KSAvIDEwMjQgKSA9IDI0LlxuLy8gXHRcdFx0XG4vLyBcdFx0XHRcbi8vICAtIE1ham9yIGRvd25zaWRlOiBtYW55LCBtYW55IGJ1ZmZlclNvdXJjZXMgd2lsbCBiZSBjcmVhdGVkXG4vLyAgICBlYWNoIHRpbWUgYHN0YXJ0KClgIGlzIGNhbGxlZC4gXG4vLyBcdFx0XHRcbi8vXG5jbGFzcyBCdWZmZXJPc2NpbGxhdG9yIGV4dGVuZHMgTm9kZSB7XG5cdGNvbnN0cnVjdG9yKCBpbywgZ2VuZXJhdG9yICkge1xuXHRcdHN1cGVyKCBpbywgMCwgMSApO1xuXG5cdFx0dGhpcy5nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG5cdFx0dGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cdFx0dGhpcy5jb250cm9scy5kZXR1bmUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cblx0XHR0aGlzLnJlc2V0KCk7XG5cdH1cblxuXHRzdGFydCggd2hlbiwgcGhhc2UgKSB7XG5cdFx0dmFyIGJ1ZmZlciA9IEJ1ZmZlclV0aWxzLmdlbmVyYXRlQnVmZmVyKFxuXHRcdFx0XHR0aGlzLmlvLFxuXHRcdFx0XHQxLFxuXHRcdFx0XHR0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSxcblx0XHRcdFx0dGhpcy5jb250ZXh0LnNhbXBsZVJhdGUsXG5cdFx0XHRcdHRoaXMuZ2VuZXJhdG9yXG5cdFx0XHQpLFxuXHRcdFx0YnVmZmVyU291cmNlO1xuXG5cdFx0dGhpcy5yZXNldCgpO1xuXG5cdFx0YnVmZmVyU291cmNlID0gdGhpcy5nZXRHcmFwaCgpLmJ1ZmZlclNvdXJjZTtcblx0XHRidWZmZXJTb3VyY2UuYnVmZmVyID0gYnVmZmVyO1xuXHRcdGJ1ZmZlclNvdXJjZS5zdGFydCggd2hlbiwgcGhhc2UgKTtcblx0XHRjb25zb2xlLmxvZyggYnVmZmVyU291cmNlICk7XG5cdH1cblxuXHRzdG9wKCB3aGVuICkge1xuXHRcdHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKSxcblx0XHRcdGJ1ZmZlclNvdXJjZSA9IGdyYXBoLmJ1ZmZlclNvdXJjZSxcblx0XHRcdHNlbGYgPSB0aGlzO1xuXG5cdFx0YnVmZmVyU291cmNlLnN0b3AoIHdoZW4gKTtcblx0fVxuXG5cdHJlc2V0KCkge1xuXHRcdHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuXHRcdGdyYXBoLmJ1ZmZlclNvdXJjZSA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcblx0XHRncmFwaC5idWZmZXJTb3VyY2UubG9vcCA9IHRydWU7XG5cdFx0Z3JhcGguYnVmZmVyU291cmNlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IDA7XG5cdFx0Z3JhcGguYnVmZmVyU291cmNlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cblx0XHR0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5idWZmZXJTb3VyY2UucGxheWJhY2tSYXRlICk7XG5cblx0XHRpZiAoIGdyYXBoLmJ1ZmZlclNvdXJjZS5kZXR1bmUgaW5zdGFuY2VvZiBBdWRpb1BhcmFtICkge1xuXHRcdFx0dGhpcy5jb250cm9scy5kZXR1bmUuY29ubmVjdCggZ3JhcGguYnVmZmVyU291cmNlLmRldHVuZSApO1xuXHRcdH1cblxuXHRcdHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG5cdH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQnVmZmVyT3NjaWxsYXRvciA9IGZ1bmN0aW9uKCBnZW5lcmF0b3IgKSB7XG5cdHJldHVybiBuZXcgQnVmZmVyT3NjaWxsYXRvciggdGhpcywgZ2VuZXJhdG9yICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBPc2NpbGxhdG9yQmFuayBmcm9tIFwiLi4vb3NjaWxsYXRvcnMvT3NjaWxsYXRvckJhbmsuZXM2XCI7XG5cbmNsYXNzIEZNT3NjaWxsYXRvciBleHRlbmRzIE9zY2lsbGF0b3JCYW5rIHtcblxuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCggdGhpcyApO1xuXG4gICAgICAgIC8vIEZNL21vZHVsYXRvciBvc2NpbGxhdG9yIHNldHVwXG4gICAgICAgIGdyYXBoLmZtT3NjaWxsYXRvciA9IHRoaXMuaW8uY3JlYXRlT3NjaWxsYXRvckJhbmsoKTtcbiAgICAgICAgZ3JhcGguZm1Pc2NBbW91bnQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5mbU9zY0Ftb3VudE11bHRpcGxpZXIgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLmZtT3NjQW1vdW50LmdhaW4udmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5mbU9zY2lsbGF0b3IuY29ubmVjdCggZ3JhcGguZm1Pc2NBbW91bnQgKTtcbiAgICAgICAgZ3JhcGguZm1Pc2NBbW91bnQuY29ubmVjdCggZ3JhcGguZm1Pc2NBbW91bnRNdWx0aXBsaWVyLCAwLCAwICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mbUZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mbUZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5mbU9zY2lsbGF0b3IuY29udHJvbHMuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1GcmVxdWVuY3kuY29ubmVjdCggZ3JhcGguZm1Pc2NBbW91bnRNdWx0aXBsaWVyLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mbVdhdmVmb3JtID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtV2F2ZWZvcm0uY29ubmVjdCggZ3JhcGguZm1Pc2NpbGxhdG9yLmNvbnRyb2xzLndhdmVmb3JtICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mbU9zY0Ftb3VudCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mbU9zY0Ftb3VudC5jb25uZWN0KCBncmFwaC5mbU9zY0Ftb3VudC5nYWluICk7XG5cblxuICAgICAgICAvLyBTZWxmLWZtIHNldHVwXG4gICAgICAgIGdyYXBoLmZtU2VsZkFtb3VudHMgPSBbXTtcbiAgICAgICAgZ3JhcGguZm1TZWxmQW1vdW50TXVsdGlwbGllcnMgPSBbXTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mbVNlbGZBbW91bnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBncmFwaC5vc2NpbGxhdG9ycy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgXHQvLyBDb25uZWN0IEZNIG9zY2lsbGF0b3IgdG8gdGhlIGV4aXN0aW5nIG9zY2lsbGF0b3JzXG4gICAgICAgIFx0Ly8gZnJlcXVlbmN5IGNvbnRyb2wuXG4gICAgICAgIFx0Z3JhcGguZm1Pc2NBbW91bnRNdWx0aXBsaWVyLmNvbm5lY3QoIGdyYXBoLm9zY2lsbGF0b3JzWyBpIF0uZnJlcXVlbmN5ICk7XG5cblxuICAgICAgICBcdC8vIEZvciBlYWNoIG9zY2lsbGF0b3IgaW4gdGhlIG9zY2lsbGF0b3IgYmFuayxcbiAgICAgICAgXHQvLyBjcmVhdGUgYSBGTS1zZWxmIEdhaW5Ob2RlLCBhbmQgY29ubmVjdCB0aGUgb3NjXG4gICAgICAgIFx0Ly8gdG8gaXQsIHRoZW4gaXQgdG8gdGhlIG9zYydzIGZyZXF1ZW5jeS5cbiAgICAgICAgXHRncmFwaC5mbVNlbGZBbW91bnRzWyBpIF0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBcdGdyYXBoLmZtU2VsZkFtb3VudHNbIGkgXS5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICBcdGdyYXBoLmZtU2VsZkFtb3VudE11bHRpcGxpZXJzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIFx0Z3JhcGguZm1TZWxmQW1vdW50c1sgaSBdLmNvbm5lY3QoIGdyYXBoLmZtU2VsZkFtb3VudE11bHRpcGxpZXJzWyBpIF0sIDAsIDAgKTtcbiAgICAgICAgXHR0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5mbVNlbGZBbW91bnRNdWx0aXBsaWVyc1sgaSBdLCAwLCAxICk7XG5cbiAgICAgICAgXHRncmFwaC5vc2NpbGxhdG9yc1sgaSBdLmNvbm5lY3QoIGdyYXBoLmZtU2VsZkFtb3VudHNbIGkgXSApO1xuICAgICAgICBcdGdyYXBoLmZtU2VsZkFtb3VudE11bHRpcGxpZXJzWyBpIF0uY29ubmVjdCggZ3JhcGgub3NjaWxsYXRvcnNbIGkgXS5mcmVxdWVuY3kgKTtcblxuICAgICAgICBcdC8vIE1ha2Ugc3VyZSB0aGUgRk0tc2VsZiBhbW91bnQgaXMgY29udHJvbGxhYmxlIHdpdGggb25lIHBhcmFtZXRlci5cbiAgICAgICAgXHR0aGlzLmNvbnRyb2xzLmZtU2VsZkFtb3VudC5jb25uZWN0KCBncmFwaC5mbVNlbGZBbW91bnRzWyBpIF0uZ2FpbiApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUZNT3NjaWxsYXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRk1Pc2NpbGxhdG9yKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5pbXBvcnQgQnVmZmVyVXRpbHMgZnJvbSBcIi4uL2J1ZmZlcnMvQnVmZmVyVXRpbHMuZXM2XCI7XG5pbXBvcnQgQnVmZmVyR2VuZXJhdG9ycyBmcm9tIFwiLi4vYnVmZmVycy9CdWZmZXJHZW5lcmF0b3JzLmVzNlwiO1xuXG5cbnZhciBCVUZGRVJTID0gbmV3IFdlYWtNYXAoKTtcblxuY2xhc3MgTm9pc2VPc2NpbGxhdG9yQmFuayBleHRlbmRzIE5vZGUge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCggdGhpcyApLFxuICAgICAgICAgICAgdHlwZXMgPSB0aGlzLmNvbnN0cnVjdG9yLnR5cGVzLFxuICAgICAgICAgICAgdHlwZUtleXMgPSBPYmplY3Qua2V5cyggdHlwZXMgKTtcblxuICAgICAgICBncmFwaC5idWZmZXJTb3VyY2VzID0gW107XG4gICAgICAgIGdyYXBoLm91dHB1dEdhaW4gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCBPYmplY3Qua2V5cyggdHlwZXMgKS5sZW5ndGgsIDAgKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0R2Fpbi5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0eXBlS2V5cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBCdWZmZXJHZW5lcmF0b3JzWyB0aGlzLmNvbnN0cnVjdG9yLmdlbmVyYXRvcktleXNbIGkgXSBdICk7XG5cbiAgICAgICAgICAgIHNvdXJjZS5idWZmZXIgPSBCdWZmZXJVdGlscy5nZW5lcmF0ZUJ1ZmZlcihcbiAgICAgICAgICAgICAgICB0aGlzLmlvLCAvLyBjb250ZXh0XG4gICAgICAgICAgICAgICAgMSwgLy8gY2hhbm5lbHNcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSAqIDUsIC8vIGxlbmd0aCAoNSBzZWNvbmRzKVxuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlLCAvLyBTYW1wbGVSYXRlXG4gICAgICAgICAgICAgICAgQnVmZmVyR2VuZXJhdG9yc1sgdGhpcy5jb25zdHJ1Y3Rvci5nZW5lcmF0b3JLZXlzWyBpIF0gXSAvLyBHZW5lcmF0b3IgZnVuY3Rpb25cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHNvdXJjZS5sb29wID0gdHJ1ZTtcbiAgICAgICAgICAgIHNvdXJjZS5zdGFydCggMCApO1xuXG4gICAgICAgICAgICBzb3VyY2UuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlciwgMCwgaSApO1xuICAgICAgICAgICAgZ3JhcGguYnVmZmVyU291cmNlcy5wdXNoKCBzb3VyY2UgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIuY29ubmVjdCggZ3JhcGgub3V0cHV0R2FpbiApO1xuICAgICAgICBncmFwaC5vdXRwdXRHYWluLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy50eXBlID0gZ3JhcGguY3Jvc3NmYWRlci5jb250cm9scy5pbmRleDtcbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBzdGFydCggdGltZSApIHtcbiAgICAgICAgdmFyIG91dHB1dEdhaW4gPSB0aGlzLmdldEdyYXBoKCB0aGlzICkub3V0cHV0R2FpbjtcblxuICAgICAgICB0aW1lID0gdGltZSB8fCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWU7XG4gICAgICAgIG91dHB1dEdhaW4uZ2Fpbi52YWx1ZSA9IDE7XG4gICAgfVxuXG4gICAgc3RvcCggdGltZSApIHtcbiAgICAgICAgdmFyIG91dHB1dEdhaW4gPSB0aGlzLmdldEdyYXBoKCB0aGlzICkub3V0cHV0R2FpbjtcblxuICAgICAgICB0aW1lID0gdGltZSB8fCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWU7XG4gICAgICAgIG91dHB1dEdhaW4uZ2Fpbi52YWx1ZSA9IDA7XG4gICAgfVxufVxuXG5cbk5vaXNlT3NjaWxsYXRvckJhbmsudHlwZXMgPSB7XG4gICAgV0hJVEU6IDAsXG4gICAgR0FVU1NJQU5fV0hJVEU6IDEsXG4gICAgUElOSzogMlxufTtcblxuTm9pc2VPc2NpbGxhdG9yQmFuay5nZW5lcmF0b3JLZXlzID0gW1xuICAgICdXaGl0ZU5vaXNlJyxcbiAgICAnR2F1c3NpYW5Ob2lzZScsXG4gICAgJ1BpbmtOb2lzZSdcbl07XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTm9pc2VPc2NpbGxhdG9yQmFuayA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTm9pc2VPc2NpbGxhdG9yQmFuayggdGhpcyApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxudmFyIE9TQ0lMTEFUT1JfVFlQRVMgPSBbXG4gICAgJ3NpbmUnLFxuICAgICd0cmlhbmdsZScsXG4gICAgJ3Nhd3Rvb3RoJyxcbiAgICAnc3F1YXJlJ1xuXTtcblxuY2xhc3MgT3NjaWxsYXRvckJhbmsgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCBPU0NJTExBVE9SX1RZUEVTLmxlbmd0aCwgMCApO1xuICAgICAgICBncmFwaC5vc2NpbGxhdG9ycyA9IFtdO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRldHVuZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy53YXZlZm9ybSA9IGdyYXBoLmNyb3NzZmFkZXIuY29udHJvbHMuaW5kZXg7XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBPU0NJTExBVE9SX1RZUEVTLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdmFyIG9zYyA9IHRoaXMuY29udGV4dC5jcmVhdGVPc2NpbGxhdG9yKCk7XG5cbiAgICAgICAgICAgIG9zYy50eXBlID0gT1NDSUxMQVRPUl9UWVBFU1sgaSBdO1xuICAgICAgICAgICAgb3NjLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgICAgICBvc2Muc3RhcnQoIDAgKTtcblxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggb3NjLmZyZXF1ZW5jeSApO1xuICAgICAgICAgICAgdGhpcy5jb250cm9scy5kZXR1bmUuY29ubmVjdCggb3NjLmRldHVuZSApO1xuICAgICAgICAgICAgb3NjLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXIsIDAsIGkgKTtcblxuICAgICAgICAgICAgZ3JhcGgub3NjaWxsYXRvcnMucHVzaCggb3NjICk7XG4gICAgICAgIH1cblxuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIuY29ubmVjdCggZ3JhcGgub3V0cHV0TGV2ZWwgKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0TGV2ZWwuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIHN0YXJ0KCBkZWxheSA9IDAgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5vdXRwdXRMZXZlbC5nYWluLnZhbHVlID0gMTtcbiAgICB9XG5cbiAgICBzdG9wKCBkZWxheSA9IDAgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5vdXRwdXRMZXZlbC5nYWluLnZhbHVlID0gMDtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU9zY2lsbGF0b3JCYW5rID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBPc2NpbGxhdG9yQmFuayggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgT3NjaWxsYXRvckJhbms7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuY2xhc3MgU2luZUJhbmsgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIG51bVNpbmVzID0gNCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm9zY2lsbGF0b3JzID0gW107XG4gICAgICAgIGdyYXBoLmhhcm1vbmljTXVsdGlwbGllcnMgPSBbXTtcbiAgICAgICAgZ3JhcGgubnVtU2luZXMgPSBudW1TaW5lcztcbiAgICAgICAgZ3JhcGgub3V0cHV0TGV2ZWwgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbC5nYWluLnZhbHVlID0gMSAvIG51bVNpbmVzO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRldHVuZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oYXJtb25pY3MgPSBbXTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1TaW5lczsgKytpICkge1xuICAgICAgICAgICAgdmFyIG9zYyA9IHRoaXMuY29udGV4dC5jcmVhdGVPc2NpbGxhdG9yKCksXG4gICAgICAgICAgICAgICAgaGFybW9uaWNDb250cm9sID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpLFxuICAgICAgICAgICAgICAgIGhhcm1vbmljTXVsdGlwbGllciA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICAgICAgb3NjLnR5cGUgPSAnc2luZSc7XG4gICAgICAgICAgICBvc2MuZnJlcXVlbmN5LnZhbHVlID0gMDtcblxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggaGFybW9uaWNNdWx0aXBsaWVyLCAwLCAwICk7XG4gICAgICAgICAgICBoYXJtb25pY0NvbnRyb2wuY29ubmVjdCggaGFybW9uaWNNdWx0aXBsaWVyLCAwLCAxICk7XG4gICAgICAgICAgICBoYXJtb25pY011bHRpcGxpZXIuY29ubmVjdCggb3NjLmZyZXF1ZW5jeSApO1xuICAgICAgICAgICAgdGhpcy5jb250cm9scy5kZXR1bmUuY29ubmVjdCggb3NjLmRldHVuZSApO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmhhcm1vbmljc1sgaSBdID0gaGFybW9uaWNDb250cm9sO1xuXG4gICAgICAgICAgICBvc2Muc3RhcnQoIDAgKTtcbiAgICAgICAgICAgIG9zYy5jb25uZWN0KCBncmFwaC5vdXRwdXRMZXZlbCApO1xuICAgICAgICAgICAgZ3JhcGgub3NjaWxsYXRvcnMucHVzaCggb3NjICk7XG4gICAgICAgIH1cblxuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgc3RhcnQoIGRlbGF5ID0gMCApIHtcbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbC5nYWluLnZhbHVlID0gMSAvIGdyYXBoLm51bVNpbmVzO1xuICAgIH1cblxuICAgIHN0b3AoIGRlbGF5ID0gMCApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAwO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2luZUJhbmsgPSBmdW5jdGlvbiggbnVtU2luZXMgKSB7XG4gICAgcmV0dXJuIG5ldyBTaW5lQmFuayggdGhpcywgbnVtU2luZXMgKTtcbn07XG5cbmV4cG9ydFxuZGVmYXVsdCBTaW5lQmFuazsiLCJ2YXIgVXRpbHMgPSB7fTtcblxuVXRpbHMuaXNUeXBlZEFycmF5ID0gZnVuY3Rpb24oIGFycmF5ICkge1xuXHRpZiAoIGFycmF5ICE9PSB1bmRlZmluZWQgJiYgYXJyYXkuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRyZXR1cm4gZmFsc2U7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBVdGlsczsiXX0=
