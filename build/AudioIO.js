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

},{"../core/config.es6":7,"../mixins/Math.es6":86}],2:[function(require,module,exports){
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

},{"../utilities/Utils.es6":100}],3:[function(require,module,exports){
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
    function AudioIO() {
        var context = arguments[0] === undefined ? new AudioContext() : arguments[0];

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

    _createClass(AudioIO, [{
        key: 'context',
        get: function get() {
            return this._context;
        },
        set: function set(context) {
            if (!(context instanceof AudioContext)) {
                throw new Error('Invalid audio context given:' + context);
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

},{"../buffers/BufferGenerators.es6":1,"../buffers/BufferUtils.es6":2,"../mixins/conversions.es6":89,"../mixins/math.es6":90,"../utilities/Utils.es6":100,"./config.es6":7,"./overrides.es6":8,"./signalCurves.es6":9}],4:[function(require,module,exports){
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
        var numInputs = arguments[1] === undefined ? 0 : arguments[1];
        var numOutputs = arguments[2] === undefined ? 0 : arguments[2];

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
        else if (item && typeof item.cleanUp === "function") {
            if (typeof item.disconnect === "function") {
                item.disconnect();
            }

            item.cleanUp();

            if (parent) {
                parent[key] = null;
            }
        }

        // "Native" nodes.
        else if (item && typeof item.disconnect === "function") {
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
        if (typeof this.disconnect === "function") {
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

_AudioIOEs62["default"].mixinSingle(Node.prototype, _mixinsSetIOEs62["default"], "_setIO");
_AudioIOEs62["default"].mixinSingle(Node.prototype, _mixinsCleanersEs62["default"].cleanUpInOuts, "_cleanUpInOuts");
_AudioIOEs62["default"].mixinSingle(Node.prototype, _mixinsCleanersEs62["default"].cleanIO, "_cleanIO");
_AudioIOEs62["default"].mixin(Node.prototype, _mixinsConnectionsEs62["default"]);

_AudioIOEs62["default"].prototype.createNode = function (numInputs, numOutputs) {
    return new Node(this, numInputs, numOutputs);
};

exports["default"] = Node;
module.exports = exports["default"];

},{"../mixins/cleaners.es6":87,"../mixins/connections.es6":88,"../mixins/setIO.es6":94,"./AudioIO.es6":3}],5:[function(require,module,exports){
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
        this._value = typeof value === "number" ? value : 1.0;
        this._control.gain.value = this._value;

        this.setValueAtTime(this._value, this.context.currentTime);
        this.defaultValue = typeof defaultValue === "number" ? defaultValue : this._control.gain.defaultValue;

        // TODO:
        //  - Should the driver always be connected?
        //  - Not sure whether Param should output 0 if value !== Number.
        if (typeof value === "number") {
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

_AudioIOEs62["default"].mixinSingle(Param.prototype, _mixinsSetIOEs62["default"], "_setIO");
_AudioIOEs62["default"].mixinSingle(Param.prototype, _mixinsCleanersEs62["default"].cleanUpInOuts, "_cleanUpInOuts");
_AudioIOEs62["default"].mixinSingle(Param.prototype, _mixinsCleanersEs62["default"].cleanIO, "_cleanIO");
_AudioIOEs62["default"].mixin(Param.prototype, _mixinsConnectionsEs62["default"]);

_AudioIOEs62["default"].prototype.createParam = function (value, defaultValue) {
    return new Param(this, value, defaultValue);
};

exports["default"] = Param;
module.exports = exports["default"];

},{"../mixins/cleaners.es6":87,"../mixins/connections.es6":88,"../mixins/setIO.es6":94,"./AudioIO.es6":3}],6:[function(require,module,exports){
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
        else if (typeof curveOrIterator === "function") {
            size = typeof size === "number" && size >= 2 ? size : CONFIG.curveResolution;

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

_AudioIOEs62["default"].mixinSingle(WaveShaper.prototype, _mixinsSetIOEs62["default"], "_setIO");
_AudioIOEs62["default"].mixinSingle(WaveShaper.prototype, _mixinsCleanersEs62["default"].cleanUpInOuts, "_cleanUpInOuts");
_AudioIOEs62["default"].mixinSingle(WaveShaper.prototype, _mixinsCleanersEs62["default"].cleanIO, "_cleanIO");
_AudioIOEs62["default"].mixin(WaveShaper.prototype, _mixinsConnectionsEs62["default"]);

_AudioIOEs62["default"].prototype.createWaveShaper = function (curve, size) {
    return new WaveShaper(this, curve, size);
};

},{"../mixins/cleaners.es6":87,"../mixins/connections.es6":88,"../mixins/setIO.es6":94,"./AudioIO.es6":3}],7:[function(require,module,exports){
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
        var outputChannel = arguments[1] === undefined ? 0 : arguments[1];
        var inputChannel = arguments[2] === undefined ? 0 : arguments[2];

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
        var outputChannel = arguments[1] === undefined ? 0 : arguments[1];
        var inputChannel = arguments[2] === undefined ? 0 : arguments[2];

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

},{"../mixins/Math.es6":86,"./config.es6":7}],10:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _CustomEnvelopeEs6 = require("./CustomEnvelope.es6");

var _CustomEnvelopeEs62 = _interopRequireDefault(_CustomEnvelopeEs6);

var ADBDSREnvelope = (function (_CustomEnvelope) {
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

        this.addStartStep("initial", 0, this.levels.initial);
        this.addStartStep("attack", this.times.attack, this.levels.peak);
        this.addStartStep("decay1", this.times.decay1, this.levels["break"]);
        this.addStartStep("decay2", this.times.decay2, this.levels.sustain);
        this.addEndStep("release", this.times.release, this.levels.release, true);
    }

    _inherits(ADBDSREnvelope, _CustomEnvelope);

    _createClass(ADBDSREnvelope, [{
        key: "attackTime",
        get: function get() {
            return this.times.attack;
        },
        set: function set(time) {
            if (typeof time === "number") {
                this.times.attack = time;
                this.setStepTime("attack", time);
            }
        }
    }, {
        key: "decay1Time",
        get: function get() {
            return this.times.decay1;
        },
        set: function set(time) {
            if (typeof time === "number") {
                this.times.decay1 = time;
                this.setStepTime("decay1", time);
            }
        }
    }, {
        key: "decay2Time",
        get: function get() {
            return this.times.decay2;
        },
        set: function set(time) {
            if (typeof time === "number") {
                this.times.decay2 = time;
                this.setStepTime("decay2", time);
            }
        }
    }, {
        key: "releaseTime",
        get: function get() {
            return this.times.release;
        },
        set: function set(time) {
            if (typeof time === "number") {
                this.times.release = time;
                this.setStepTime("release", time);
            }
        }
    }, {
        key: "initialLevel",
        get: function get() {
            return this.levels.initial;
        },
        set: function set(level) {
            if (typeof level === "number") {
                this.levels.initial = level;
                this.setStepLevel("initial", level);
            }
        }
    }, {
        key: "peakLevel",
        get: function get() {
            return this.levels.peak;
        },
        set: function set(level) {
            if (typeof level === "number") {
                this.levels.peak = level;
                this.setStepLevel("attack", level);
            }
        }
    }, {
        key: "breakLevel",
        get: function get() {
            return this.levels["break"];
        },
        set: function set(level) {
            if (typeof level === "number") {
                this.levels["break"] = level;
                this.setStepLevel("decay1", level);
            }
        }
    }, {
        key: "sustainLevel",
        get: function get() {
            return this.levels.sustain;
        },
        set: function set(level) {
            if (typeof level === "number") {
                this.levels.sustain = level;
                this.setStepLevel("decay2", level);
            }
        }
    }, {
        key: "releaseLevel",
        get: function get() {
            return this.levels.release;
        },
        set: function set(level) {
            if (typeof level === "number") {
                this.levels.release = level;
                this.setStepLevel("release", level);
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

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _CustomEnvelopeEs6 = require("./CustomEnvelope.es6");

var _CustomEnvelopeEs62 = _interopRequireDefault(_CustomEnvelopeEs6);

var ADEnvelope = (function (_CustomEnvelope) {
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

        this.addStartStep("initial", 0, this.levels.initial);
        this.addStartStep("attack", this.times.attack, this.levels.peak);
        this.addEndStep("decay", this.times.decay, this.levels.sustain, true);
    }

    _inherits(ADEnvelope, _CustomEnvelope);

    _createClass(ADEnvelope, [{
        key: "attackTime",
        get: function get() {
            return this.times.attack;
        },
        set: function set(time) {
            if (typeof time === "number") {
                this.times.attack = time;
                this.setStepTime("attack", time);
            }
        }
    }, {
        key: "decayTime",
        get: function get() {
            return this.times.decay;
        },
        set: function set(time) {
            if (typeof time === "number") {
                this.times.decay = time;
                this.setStepTime("decay", time);
            }
        }
    }, {
        key: "initialLevel",
        get: function get() {
            return this.levels.initial;
        },
        set: function set(level) {
            if (typeof level === "number") {
                this.levels.initial = level;
                this.setStepLevel("initial", level);
            }
        }
    }, {
        key: "peakLevel",
        get: function get() {
            return this.levels.peak;
        },
        set: function set(level) {
            if (typeof level === "number") {
                this.levels.peak = level;
                this.setStepLevel("attack", level);
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

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _CustomEnvelopeEs6 = require("./CustomEnvelope.es6");

var _CustomEnvelopeEs62 = _interopRequireDefault(_CustomEnvelopeEs6);

var ADSREnvelope = (function (_CustomEnvelope) {
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

        this.addStartStep("initial", 0, this.levels.initial);
        this.addStartStep("attack", this.times.attack, this.levels.peak);
        this.addStartStep("decay", this.times.decay, this.levels.sustain);
        this.addEndStep("release", this.times.release, this.levels.release, true);
    }

    _inherits(ADSREnvelope, _CustomEnvelope);

    _createClass(ADSREnvelope, [{
        key: "attackTime",
        get: function get() {
            return this.times.attack;
        },
        set: function set(time) {
            if (typeof time === "number") {
                this.times.attack = time;
                this.setStepTime("attack", time);
            }
        }
    }, {
        key: "decayTime",
        get: function get() {
            return this.times.decay;
        },
        set: function set(time) {
            if (typeof time === "number") {
                this.times.decay = time;
                this.setStepTime("decay", time);
            }
        }
    }, {
        key: "releaseTime",
        get: function get() {
            return this.times.release;
        },
        set: function set(time) {
            if (typeof time === "number") {
                this.times.release = time;
                this.setStepTime("release", time);
            }
        }
    }, {
        key: "initialLevel",
        get: function get() {
            return this.levels.initial;
        },
        set: function set(level) {
            if (typeof level === "number") {
                this.levels.initial = level;
                this.setStepLevel("initial", level);
            }
        }
    }, {
        key: "peakLevel",
        get: function get() {
            return this.levels.peak;
        },
        set: function set(level) {
            if (typeof level === "number") {
                this.levels.peak = level;
                this.setStepLevel("attack", level);
            }
        }
    }, {
        key: "sustainLevel",
        get: function get() {
            return this.levels.sustain;
        },
        set: function set(level) {
            if (typeof level === "number") {
                this.levels.sustain = level;
                this.setStepLevel("decay", level);
            }
        }
    }, {
        key: "releaseLevel",
        get: function get() {
            return this.levels.release;
        },
        set: function set(level) {
            if (typeof level === "number") {
                this.levels.release = level;
                this.setStepLevel("release", level);
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
        var isExponential = arguments[4] === undefined ? false : arguments[4];

        var stops = this.steps[section];

        if (stops[name]) {
            throw new Error("Stop with name \"" + name + "\" already exists.");
        }

        this.orders[section].push(name);

        this.steps[section][name] = {
            time: time,
            level: level,
            isExponential: isExponential
        };
    };

    CustomEnvelope.prototype.addStartStep = function addStartStep(name, time, level) {
        var isExponential = arguments[3] === undefined ? false : arguments[3];

        this._addStep("start", name, time, level, isExponential);
        return this;
    };

    CustomEnvelope.prototype.addEndStep = function addEndStep(name, time, level) {
        var isExponential = arguments[3] === undefined ? false : arguments[3];

        this._addStep("stop", name, time, level, isExponential);
        return this;
    };

    CustomEnvelope.prototype.setStepLevel = function setStepLevel(name, level) {
        var startIndex = this.orders.start.indexOf(name),
            endIndex = this.orders.stop.indexOf(name);

        if (startIndex === -1 && endIndex === -1) {
            console.warn("No step with name \"" + name + "\". No level set.");
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
            console.warn("No step with name \"" + name + "\". No time set.");
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
        var delay = arguments[1] === undefined ? 0 : arguments[1];

        if (param instanceof AudioParam === false && param instanceof Param === false) {
            throw new Error("Can only start an envelope on AudioParam or Param instances.");
        }

        this._startSection("start", param, this.context.currentTime + delay);
    };

    CustomEnvelope.prototype.stop = function stop(param) {
        var delay = arguments[1] === undefined ? 0 : arguments[1];

        this._startSection("stop", param, this.context.currentTime + 0.1 + delay);
    };

    CustomEnvelope.prototype.forceStop = function forceStop(param) {
        var delay = arguments[1] === undefined ? 0 : arguments[1];

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

_coreAudioIOEs62["default"].mixinSingle(CustomEnvelope.prototype, _mixinsSetIOEs62["default"], "_setIO");

_coreAudioIOEs62["default"].prototype.createCustomEnvelope = function () {
    return new CustomEnvelope(this);
};

exports["default"] = CustomEnvelope;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"../core/config.es6":7,"../mixins/setIO.es6":94}],14:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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

    _inherits(SchroederAllPass, _Node);

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

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _graphsDryWetNodeEs6 = require("../../graphs/DryWetNode.es6");

var _graphsDryWetNodeEs62 = _interopRequireDefault(_graphsDryWetNodeEs6);

// TODO: Add feedbackLevel and delayTime Param instances
// to control this node.

var Delay = (function (_DryWetNode) {
    function Delay(io) {
        _classCallCheck(this, Delay);

        _DryWetNode.call(this, io, 1, 1);

        var graph = this.getGraph();

        // Create the control nodes.
        this.controls.feedback = this.io.createParam();
        this.controls.time = this.io.createParam();

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

    _inherits(Delay, _DryWetNode);

    return Delay;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createDelay = function () {
    return new Delay(this);
};

exports["default"] = Delay;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../graphs/DryWetNode.es6":37}],16:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _graphsDryWetNodeEs6 = require("../../graphs/DryWetNode.es6");

var _graphsDryWetNodeEs62 = _interopRequireDefault(_graphsDryWetNodeEs6);

// TODO:
//  - Convert this node to use Param controls
//    for time and feedback.

var PingPongDelay = (function (_DryWetNode) {
    function PingPongDelay(io) {
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

    _inherits(PingPongDelay, _DryWetNode);

    return PingPongDelay;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createPingPongDelay = function () {
    return new PingPongDelay(this);
};

},{"../../core/AudioIO.es6":3,"../../graphs/DryWetNode.es6":37}],17:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _graphsDryWetNodeEs6 = require("../../graphs/DryWetNode.es6");

var _graphsDryWetNodeEs62 = _interopRequireDefault(_graphsDryWetNodeEs6);

var StereoDelay = (function (_DryWetNode) {
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
        graph.merger.connect(this.wet);

        this.setGraph(graph);
    }

    _inherits(StereoDelay, _DryWetNode);

    return StereoDelay;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createStereoDelay = function () {
    return new StereoDelay(this);
};

exports["default"] = StereoDelay;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../graphs/DryWetNode.es6":37}],18:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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
            case "LP12":
                this.filter.type = "lowpass";
                break;

            case "notch":
                this.filter.type = "notch";
                break;

            case "HP12":
                this.filter.type = "highpass";
                break;

            // Fall through to handle those filter
            // types with `gain` AudioParams.
            case "lowshelf":
                this.filter.type = "lowshelf";
            case "highshelf":
                this.filter.type = "highshelf";
            case "peaking":
                this.filter.type = "peaking";
                this.filter.gain.value = 0;
                this.controls.gain = io.createParam();
                break;
        }
    };

    graph.setType(type);

    return graph;
}

var CustomEQ = (function (_Node) {
    function CustomEQ(io) {
        _classCallCheck(this, CustomEQ);

        _Node.call(this, io, 1, 1);

        // Initially, this Node is just a pass-through
        // until filters are added.
        this.inputs[0].connect(this.outputs[0]);
    }

    _inherits(CustomEQ, _Node);

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
            console.warn("No filter at the given index:", index, filters);
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _CustomEQEs6 = require("./CustomEQ.es6");

var _CustomEQEs62 = _interopRequireDefault(_CustomEQEs6);

var EQ2Band = (function (_CustomEQ) {
	function EQ2Band(io) {
		_classCallCheck(this, EQ2Band);

		_CustomEQ.call(this, io);

		var lowshelf = this.addFilter("lowshelf"),
		    highshelf = this.addFilter("highshelf");

		this.controls.crossoverFrequency = this.io.createParam();
		this.controls.crossoverFrequency.connect(lowshelf.controls.frequency);
		this.controls.crossoverFrequency.connect(highshelf.controls.frequency);

		this.controls.Q = this.io.createParam();
		this.controls.Q.connect(lowshelf.controls.Q);
		this.controls.Q.connect(highshelf.controls.Q);

		this.controls.lowGain = this.io.createParam();
		this.controls.lowGain.connect(lowshelf.controls.gain);

		this.controls.highGain = this.io.createParam();
		this.controls.highGain.connect(highshelf.controls.gain);
	}

	_inherits(EQ2Band, _CustomEQ);

	return EQ2Band;
})(_CustomEQEs62["default"]);

_coreAudioIOEs62["default"].prototype.createEQ2Band = function () {
	return new EQ2Band(this);
};

},{"../../core/AudioIO.es6":3,"./CustomEQ.es6":18}],20:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var AllPassFilter = (function (_Node) {
    function AllPassFilter(io) {
        _classCallCheck(this, AllPassFilter);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.crossfaderSlope = this.io.createCrossfader(2, 0);
        graph.lp12dB = this.context.createBiquadFilter();
        graph.lp24dB = this.context.createBiquadFilter();

        graph.lp12dB.type = "allpass";
        graph.lp24dB.type = "allpass";
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

    _inherits(AllPassFilter, _Node);

    return AllPassFilter;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createAllPassFilter = function () {
    return new AllPassFilter(this);
};

exports["default"] = AllPassFilter;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],21:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var BPFilter = (function (_Node) {
    function BPFilter(io) {
        _classCallCheck(this, BPFilter);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.crossfaderSlope = this.io.createCrossfader(2, 0);
        graph.lp12dB = this.context.createBiquadFilter();
        graph.lp24dB = this.context.createBiquadFilter();

        graph.lp12dB.type = "bandpass";
        graph.lp24dB.type = "bandpass";
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

    _inherits(BPFilter, _Node);

    return BPFilter;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createBPFilter = function () {
    return new BPFilter(this);
};

exports["default"] = BPFilter;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],22:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// Frequency of a comb filter is calculated as follows:
//  delayTime = (1 / freq)
//
// E.g:
//  - For 200hz frequency
//      delayTime = (1 / 200) = 0.005s
//
// This is currently a feedback comb filter.

var CombFilter = (function (_Node) {
    function CombFilter(io) {
        _classCallCheck(this, CombFilter);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.delay = this.context.createDelay();
        graph.feedback = this.context.createGain();
        graph.reciprocal = this.io.createReciprocal(this.context.sampleRate * 0.5);

        graph.delay.delayTime.value = 0;
        graph.feedback.gain.value = 0;

        this.inputs[0].connect(graph.delay);
        graph.delay.connect(graph.feedback);
        graph.feedback.connect(graph.delay);
        graph.delay.connect(this.outputs[0]);

        this.controls.frequency = this.io.createParam();
        this.controls.Q = this.io.createParam();
        this.controls.frequency.connect(graph.reciprocal);
        graph.reciprocal.connect(graph.delay.delayTime);
        this.controls.Q.connect(graph.feedback.gain);

        this.setGraph(graph);
    }

    _inherits(CombFilter, _Node);

    return CombFilter;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createCombFilter = function () {
    return new CombFilter(this);
};

exports["default"] = CombFilter;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],23:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var FILTER_TYPES = ["lowpass", "bandpass", "highpass", "notch", "lowpass"];

var FilterBank = (function (_Node) {
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

    _inherits(FilterBank, _Node);

    return FilterBank;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createFilterBank = function () {
    return new FilterBank(this);
};

exports["default"] = FilterBank;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],24:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var HPFilter = (function (_Node) {
    function HPFilter(io) {
        _classCallCheck(this, HPFilter);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.crossfaderSlope = this.io.createCrossfader(2, 0);
        graph.lp12dB = this.context.createBiquadFilter();
        graph.lp24dB = this.context.createBiquadFilter();

        graph.lp12dB.type = "highpass";
        graph.lp24dB.type = "highpass";
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

    _inherits(HPFilter, _Node);

    return HPFilter;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createHPFilter = function () {
    return new HPFilter(this);
};

exports["default"] = HPFilter;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],25:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var LPFilter = (function (_Node) {
    function LPFilter(io) {
        _classCallCheck(this, LPFilter);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.crossfaderSlope = this.io.createCrossfader(2, 0);
        graph.lp12dB = this.context.createBiquadFilter();
        graph.lp24dB = this.context.createBiquadFilter();

        graph.lp12dB.type = "lowpass";
        graph.lp24dB.type = "lowpass";
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

    _inherits(LPFilter, _Node);

    return LPFilter;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createLPFilter = function () {
    return new LPFilter(this);
};

exports["default"] = LPFilter;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],26:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var NotchFilter = (function (_Node) {
    function NotchFilter(io) {
        _classCallCheck(this, NotchFilter);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.crossfaderSlope = this.io.createCrossfader(2, 0);
        graph.lp12dB = this.context.createBiquadFilter();
        graph.lp24dB = this.context.createBiquadFilter();

        graph.lp12dB.type = "notch";
        graph.lp24dB.type = "notch";
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

    _inherits(NotchFilter, _Node);

    return NotchFilter;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createNotchFilter = function () {
    return new NotchFilter(this);
};

exports["default"] = NotchFilter;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],27:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _graphsDryWetNodeEs6 = require("../../graphs/DryWetNode.es6");

var _graphsDryWetNodeEs62 = _interopRequireDefault(_graphsDryWetNodeEs6);

var DualChorus = (function (_DryWetNode) {
    function DualChorus(io) {
        _classCallCheck(this, DualChorus);

        _DryWetNode.call(this, io, 1, 1);

        var graph = this.getGraph();

        // Create nodes.
        graph.ensureStereoInput = this.context.createChannelMerger(2);
        graph.splitter = this.context.createChannelSplitter(2);
        graph.delay1L = this.context.createDelay();
        graph.delay1R = this.context.createDelay();
        graph.feedback1L = this.context.createGain();
        graph.feedback1R = this.context.createGain();
        graph.delay2L = this.context.createDelay();
        graph.delay2R = this.context.createDelay();
        graph.feedback2L = this.context.createGain();
        graph.feedback2R = this.context.createGain();
        graph.merger = this.context.createChannelMerger(2);
        graph.mod = this.context.createOscillator();
        graph.mod1Amount = this.context.createGain();
        graph.mod2Amount = this.context.createGain();
        graph.mod1Phase = this.io.createPhaseOffset();
        graph.mod2Phase = this.io.createPhaseOffset();
        graph.highpassFilterL = this.context.createBiquadFilter();
        graph.highpassFilterR = this.context.createBiquadFilter();

        // Zero out param values that will be controled
        // by Param instances.
        graph.delay1L.delayTime.value = 0;
        graph.delay1R.delayTime.value = 0;
        graph.feedback1L.gain.value = 0;
        graph.feedback1R.gain.value = 0;
        graph.delay2L.delayTime.value = 0;
        graph.delay2R.delayTime.value = 0;
        graph.feedback2L.gain.value = 0;
        graph.feedback2R.gain.value = 0;
        graph.mod.frequency.value = 0;
        graph.mod1Amount.gain.value = 0;
        graph.mod2Amount.gain.value = 0;
        graph.highpassFilterL.frequency.value = 0;
        graph.highpassFilterL.Q.value = 1;
        graph.highpassFilterR.frequency.value = 0;
        graph.highpassFilterR.Q.value = 1;
        graph.highpassFilterL.type = "highpass";
        graph.highpassFilterR.type = "highpass";

        // Main graph.
        this.inputs[0].connect(graph.ensureStereoInput, 0, 0);
        this.inputs[0].connect(graph.ensureStereoInput, 0, 1);
        graph.ensureStereoInput.connect(graph.splitter);
        graph.splitter.connect(graph.highpassFilterL, 0);
        graph.splitter.connect(graph.highpassFilterR, 1);
        graph.highpassFilterL.connect(graph.delay1L);
        graph.highpassFilterR.connect(graph.delay1R);
        graph.splitter.connect(graph.delay2L, 0);
        graph.splitter.connect(graph.delay2R, 1);

        graph.delay1L.connect(graph.feedback1L);
        graph.delay1R.connect(graph.feedback1R);
        graph.feedback1L.connect(graph.delay1R);
        graph.feedback1R.connect(graph.delay1L);
        graph.delay1L.connect(graph.merger, 0, 0);
        graph.delay1R.connect(graph.merger, 0, 1);

        graph.delay2L.connect(graph.feedback1L);
        graph.delay2R.connect(graph.feedback1R);
        graph.feedback2L.connect(graph.delay2R);
        graph.feedback2R.connect(graph.delay2L);
        graph.delay2L.connect(graph.merger, 0, 0);
        graph.delay2R.connect(graph.merger, 0, 1);

        graph.merger.connect(this.wet);

        // Modulation graph
        graph.mod.connect(graph.mod1Amount);
        graph.mod.connect(graph.mod2Amount);
        graph.mod1Amount.connect(graph.delay1L.delayTime);
        graph.mod2Amount.connect(graph.delay2L.delayTime);
        graph.mod1Amount.connect(graph.mod1Phase);
        graph.mod2Amount.connect(graph.mod2Phase);
        graph.mod1Phase.connect(graph.delay1R.delayTime);
        graph.mod2Phase.connect(graph.delay2R.delayTime);
        graph.mod.start();

        // Create controls
        this.controls.delay1Time = this.io.createParam();
        this.controls.delay2Time = this.io.createParam();
        this.controls.feedback = this.io.createParam();
        this.controls.highpassFrequency = this.io.createParam();
        this.controls.modFrequency = this.io.createParam();
        this.controls.mod1Amount = this.io.createParam();
        this.controls.mod2Amount = this.io.createParam();
        this.controls.mod1Phase = graph.mod1Phase.controls.phase;
        this.controls.mod2Phase = graph.mod2Phase.controls.phase;

        // Connect controls.
        this.controls.delay1Time.connect(graph.delay1L.delayTime);
        this.controls.delay1Time.connect(graph.delay1R.delayTime);
        this.controls.delay2Time.connect(graph.delay2L.delayTime);
        this.controls.delay2Time.connect(graph.delay2R.delayTime);
        this.controls.feedback.connect(graph.feedback1L.gain);
        this.controls.feedback.connect(graph.feedback1R.gain);
        this.controls.feedback.connect(graph.feedback2L.gain);
        this.controls.feedback.connect(graph.feedback2R.gain);
        this.controls.highpassFrequency.connect(graph.highpassFilterL.frequency);
        this.controls.highpassFrequency.connect(graph.highpassFilterR.frequency);
        this.controls.modFrequency.connect(graph.mod.frequency);
        this.controls.modFrequency.connect(graph.mod1Phase.controls.frequency);
        this.controls.modFrequency.connect(graph.mod2Phase.controls.frequency);
        this.controls.mod1Phase.connect(graph.mod1Phase.controls.phase);
        this.controls.mod2Phase.connect(graph.mod2Phase.controls.phase);
        this.controls.mod1Amount.connect(graph.mod1Amount.gain);
        this.controls.mod2Amount.connect(graph.mod2Amount.gain);

        this.setGraph(graph);
    }

    _inherits(DualChorus, _DryWetNode);

    return DualChorus;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createDualChorus = function () {
    return new DualChorus(this);
};

exports["default"] = DualChorus;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../graphs/DryWetNode.es6":37}],28:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _graphsDryWetNodeEs6 = require("../../graphs/DryWetNode.es6");

var _graphsDryWetNodeEs62 = _interopRequireDefault(_graphsDryWetNodeEs6);

var SimpleChorus = (function (_DryWetNode) {
    function SimpleChorus(io) {
        _classCallCheck(this, SimpleChorus);

        _DryWetNode.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.ensureStereoInput = this.context.createChannelMerger(2);
        graph.splitter = this.context.createChannelSplitter(2);
        graph.delayL = this.context.createDelay();
        graph.delayR = this.context.createDelay();
        graph.feedbackL = this.context.createGain();
        graph.feedbackR = this.context.createGain();
        graph.merger = this.context.createChannelMerger(2);
        graph.mod = this.context.createOscillator();
        graph.modAmount = this.context.createGain();
        graph.modPhase = this.io.createPhaseOffset();

        graph.delayL.delayTime.value = 0;
        graph.delayR.delayTime.value = 0;
        graph.feedbackL.gain.value = 0;
        graph.feedbackR.gain.value = 0;
        graph.mod.frequency.value = 0;
        graph.modAmount.gain.value = 0;

        this.inputs[0].connect(graph.ensureStereoInput, 0, 0);
        this.inputs[0].connect(graph.ensureStereoInput, 0, 1);
        graph.ensureStereoInput.connect(graph.splitter);
        graph.splitter.connect(graph.delayL, 0);
        graph.splitter.connect(graph.delayR, 1);
        graph.delayL.connect(graph.feedbackL);
        graph.delayR.connect(graph.feedbackR);
        graph.feedbackL.connect(graph.delayR);
        graph.feedbackR.connect(graph.delayL);
        graph.delayL.connect(graph.merger, 0, 0);
        graph.delayR.connect(graph.merger, 0, 1);
        graph.merger.connect(this.wet);

        // Modulation graph
        graph.mod.connect(graph.modAmount);
        graph.modAmount.connect(graph.delayL.delayTime);
        graph.modAmount.connect(graph.modPhase);
        graph.modPhase.connect(graph.delayR.delayTime);
        graph.mod.start();

        // Create controls
        this.controls.delayTime = this.io.createParam();
        this.controls.feedback = this.io.createParam();
        this.controls.modFrequency = this.io.createParam();
        this.controls.modAmount = this.io.createParam();
        this.controls.modPhase = graph.modPhase.controls.phase;

        this.controls.delayTime.connect(graph.delayL.delayTime);
        this.controls.delayTime.connect(graph.delayR.delayTime);
        this.controls.feedback.connect(graph.feedbackL.gain);
        this.controls.feedback.connect(graph.feedbackR.gain);
        this.controls.modFrequency.connect(graph.mod.frequency);
        this.controls.modFrequency.connect(graph.modPhase.controls.frequency);
        this.controls.modAmount.connect(graph.modAmount.gain);

        this.setGraph(graph);
    }

    _inherits(SimpleChorus, _DryWetNode);

    return SimpleChorus;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createSimpleChorus = function () {
    return new SimpleChorus(this);
};

exports["default"] = SimpleChorus;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../graphs/DryWetNode.es6":37}],29:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _graphsDryWetNodeEs6 = require("../../graphs/DryWetNode.es6");

var _graphsDryWetNodeEs62 = _interopRequireDefault(_graphsDryWetNodeEs6);

// TODO: Add feedbackLevel and delayTime Param instances
// to control this node.

var SineShaper = (function (_DryWetNode) {
    function SineShaper(io) {
        _classCallCheck(this, SineShaper);

        _DryWetNode.call(this, io);

        var graph = this.getGraph();

        this.controls.drive = this.io.createParam();
        graph.shaper = this.io.createWaveShaper(this.io.curves.Sine);
        graph.shaperDrive = this.context.createGain();
        graph.shaperDrive.gain.value = 1;

        this.inputs[0].connect(graph.shaperDrive);
        this.controls.drive.connect(graph.shaperDrive.gain);
        graph.shaperDrive.connect(graph.shaper);
        graph.shaper.connect(this.wet);

        this.setGraph(graph);
    }

    _inherits(SineShaper, _DryWetNode);

    return SineShaper;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createSineShaper = function (time, feedbackLevel) {
    return new SineShaper(this, time, feedbackLevel);
};

exports["default"] = SineShaper;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../graphs/DryWetNode.es6":37}],30:[function(require,module,exports){
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

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var DCTrap = (function (_Node) {
  function DCTrap(io) {
    var cutoff = arguments[1] === undefined ? 5 : arguments[1];

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

  _inherits(DCTrap, _Node);

  return DCTrap;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createDCTrap = function (cutoff) {
  return new DCTrap(this, cutoff);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],31:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var _buffersBufferUtilsEs6 = require("../../buffers/BufferUtils.es6");

var _buffersBufferUtilsEs62 = _interopRequireDefault(_buffersBufferUtilsEs6);

var _buffersBufferGeneratorsEs6 = require("../../buffers/BufferGenerators.es6");

var _buffersBufferGeneratorsEs62 = _interopRequireDefault(_buffersBufferGeneratorsEs6);

var LFO = (function (_Node) {
    function LFO(io) {
        var cutoff = arguments[1] === undefined ? 5 : arguments[1];

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

    _inherits(LFO, _Node);

    LFO.prototype.start = function start() {
        var delay = arguments[0] === undefined ? 0 : arguments[0];

        this.getGraph().oscillator.start(delay);
    };

    LFO.prototype.stop = function stop() {
        var delay = arguments[0] === undefined ? 0 : arguments[0];

        this.getGraph().oscillator.stop(delay);
    };

    return LFO;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createLFO = function (cutoff) {
    return new LFO(this, cutoff);
};

},{"../../buffers/BufferGenerators.es6":1,"../../buffers/BufferUtils.es6":2,"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],32:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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

    _inherits(StereoRotation, _Node);

    return StereoRotation;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createStereoRotation = function (rotation) {
    return new StereoRotation(this, rotation);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],33:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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

    _inherits(StereoWidth, _Node);

    return StereoWidth;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createStereoWidth = function (width) {
    return new StereoWidth(this, width);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],34:[function(require,module,exports){
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
        this.wave = waveform || "sine";
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

        frequency = typeof frequency === "number" ? frequency : this.frequency;
        detune = typeof detune === "number" ? detune : this.detune;
        velocity = typeof velocity === "number" ? velocity : this.velocity;
        wave = typeof wave === "number" ? wave : this.wave;

        var glideTime = typeof glideTime === "number" ? glideTime : 0;

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

        if (typeof wave === "string") {
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

AudioIO.mixinSingle(OscillatorGenerator.prototype, _mixinsSetIOEs62["default"], "_setIO");

AudioIO.prototype.createOscillatorGenerator = function (frequency, detune, velocity, glideTime, wave) {
    return new OscillatorGenerator(this, frequency, detune, velocity, glideTime, wave);
};

},{"../core/AudioIO.es6":3,"../mixins/setIO.es6":94}],35:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// TODO:
//  - Turn arguments into controllable parameters;

var Counter = (function (_Node) {
    function Counter(io, increment, limit, stepTime) {
        _classCallCheck(this, Counter);

        _Node.call(this, io, 0, 1);

        this.running = false;

        // this.stepTime = stepTime || 1 / this.context.sampleRate;

        this.controls.increment = this.io.createParam(increment);
        this.controls.limit = this.io.createParam(limit);
        this.controls.stepTime = this.io.createParam(stepTime || 1 / this.context.sampleRate);

        this.multiply = this.io.createMultiply();

        this.delay = this.context.createDelay();
        this.controls.stepTime.connect(this.delay.delayTime);

        this.feedback = this.context.createGain();
        this.feedback.gain.value = 0;
        this.feedback.connect(this.delay);

        this.multiply.connect(this.delay);
        this.delay.connect(this.feedback);
        this.feedback.connect(this.delay);

        this.lessThan = this.io.createLessThan();
        this.controls.limit.connect(this.lessThan.controls.value);
        this.delay.connect(this.lessThan);
        // this.lessThan.connect( this.feedback.gain );
        this.controls.increment.connect(this.multiply, 0, 0);
        this.lessThan.connect(this.multiply, 0, 1);

        // Clamp from 0 to `limit` value.
        // this.clamp = this.io.createClamp( 0 );
        // this.controls.limit.connect( this.clamp.controls.max );

        this.delay.connect(this.outputs[0]);
    }

    _inherits(Counter, _Node);

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
            // this.delay.delayTime.value = this.stepTime;
            this.lessThan.connect(this.feedback.gain);
        }
    };

    Counter.prototype.stop = function stop() {
        if (this.running === true) {
            this.running = false;
            this.lessThan.disconnect(this.feedback.gain);
            // this.delay.delayTime.value = 0;
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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],36:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Crossfader = (function (_Node) {
    function Crossfader(io) {
        var numCases = arguments[1] === undefined ? 2 : arguments[1];
        var startingCase = arguments[2] === undefined ? 0 : arguments[2];

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

    _inherits(Crossfader, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],37:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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

    _inherits(DryWetNode, _Node);

    return DryWetNode;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createDryWetNode = function () {
    return new DryWetNode(this);
};

exports["default"] = DryWetNode;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"../core/Node.es6":4,"../mixins/cleaners.es6":87,"../mixins/connections.es6":88,"../mixins/setIO.es6":94}],38:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var EQShelf = (function (_Node) {
    function EQShelf(io) {
        var highFrequency = arguments[1] === undefined ? 2500 : arguments[1];
        var lowFrequency = arguments[2] === undefined ? 350 : arguments[2];
        var highBoost = arguments[3] === undefined ? -6 : arguments[3];
        var lowBoost = arguments[4] === undefined ? 0 : arguments[4];

        _classCallCheck(this, EQShelf);

        _Node.call(this, io, 1, 1);

        this.highFrequency = this.io.createParam(highFrequency);
        this.lowFrequency = this.io.createParam(lowFrequency);
        this.highBoost = this.io.createParam(highBoost);
        this.lowBoost = this.io.createParam(lowBoost);

        this.lowShelf = this.context.createBiquadFilter();
        this.lowShelf.type = "lowshelf";
        this.lowShelf.frequency.value = lowFrequency;
        this.lowShelf.gain.value = lowBoost;

        this.highShelf = this.context.createBiquadFilter();
        this.highShelf.type = "highshelf";
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

    _inherits(EQShelf, _Node);

    return EQShelf;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createEQShelf = function (highFrequency, lowFrequency, highBoost, lowBoost) {
    return new EQShelf(this, highFrequency, lowFrequency, highBoost, lowBoost);
};

exports["default"] = EQShelf;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],39:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var PhaseOffset = (function (_Node) {
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
        // this.inputs[ 0 ].connect( this.outputs[ 0 ] );

        this.inputs[0].connect(this.delay);
        this.delay.connect(this.outputs[0]);

        this.outputs[0].gain.value = 0.5;

        // Store controllable params.
        this.controls.frequency = this.frequency;
        this.controls.phase = this.phase;
    }

    _inherits(PhaseOffset, _Node);

    return PhaseOffset;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createPhaseOffset = function () {
    return new PhaseOffset(this);
};

exports["default"] = PhaseOffset;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],40:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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
    function GeneratorPlayer(io, options) {
        _classCallCheck(this, GeneratorPlayer);

        _Node.call(this, io, 0, 1);

        if (options.generator === undefined) {
            throw new Error("GeneratorPlayer requires a `generator` option to be given.");
        }

        this.generator = options.generator;

        this.polyphony = this.io.createParam(options.polyphony || 1);

        this.unison = this.io.createParam(options.unison || 1);
        this.unisonDetune = this.io.createParam(typeof options.unisonDetune === "number" ? options.unisonDetune : 0);
        this.unisonPhase = this.io.createParam(typeof options.unisonPhase === "number" ? options.unisonPhase : 0);
        this.unisonMode = options.unisonMode || "centered";

        this.glideMode = options.glideMode || "equal";
        this.glideTime = this.io.createParam(typeof options.glideTime === "number" ? options.glideTime : 0);

        this.velocitySensitivity = this.io.createParam(typeof options.velocitySensitivity === "number" ? options.velocitySensitivity : 0);

        this.tuning = this.io.createParam(typeof options.tuning === "number" ? options.tuning : 0);

        this.waveform = options.waveform || "sine";

        this.envelope = options.envelope || this.io.createADSREnvelope();

        this.activeGeneratorObjects = {};
        this.activeGeneratorObjectsFlat = [];
        this.timers = [];
    }

    _inherits(GeneratorPlayer, _Node);

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

        if (this.unisonMode === "centered") {
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

        if (mode === "equal") {
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

        console.log("reuse", generator);

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

        velocity = typeof velocity === "number" ? velocity : 1;
        delay = typeof delay === "number" ? delay : 0;

        if (velocitySensitivity !== 0) {
            velocity = this.Math.scaleNumber(velocity, 0, 1, 0.5 - velocitySensitivity * 0.5, 0.5 + velocitySensitivity * 0.5);
        } else {
            velocity = 0.5;
        }

        if (typeof frequency === "number") {
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
        velocity = typeof velocity === "number" ? velocity : 0;
        delay = typeof delay === "number" ? delay : 0;

        if (typeof frequency === "number") {
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

// AudioIO.mixinSingle( GeneratorPlayer.prototype, _setIO, '_setIO' );
GeneratorPlayer.prototype.Math = _mixinsMathEs62["default"];

AudioIO.prototype.createGeneratorPlayer = function (options) {
    return new GeneratorPlayer(this, options);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4,"../mixins/math.es6":90}],41:[function(require,module,exports){
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

require('./fx/general/DualChorus.es6');

require('./fx/general/SimpleChorus.es6');

require('./fx/eq/CustomEQ.es6');

require('./fx/eq/EQ2Band.es6');

// import './fx/BitReduction.es6';

require('./fx/SchroederAllPass.es6');

require('./fx/filters/FilterBank.es6');

require('./fx/filters/LPFilter.es6');

require('./fx/filters/BPFilter.es6');

require('./fx/filters/HPFilter.es6');

require('./fx/filters/NotchFilter.es6');

require('./fx/filters/AllPassFilter.es6');

require('./fx/filters/CombFilter.es6');

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

window.AudioContext = window.AudioContext || window.webkitAudioContext;

// import './graphs/Sketch.es6';

window.Param = _coreParamEs62['default'];
window.Node = _coreNodeEs62['default'];

},{"./buffers/BufferGenerators.es6":1,"./buffers/BufferUtils.es6":2,"./core/AudioIO.es6":3,"./core/Node.es6":4,"./core/Param.es6":5,"./core/WaveShaper.es6":6,"./envelopes/ADBDSREnvelope.es6":10,"./envelopes/ADEnvelope.es6":11,"./envelopes/ADSREnvelope.es6":12,"./envelopes/CustomEnvelope.es6":13,"./fx/SchroederAllPass.es6":14,"./fx/delay/Delay.es6":15,"./fx/delay/PingPongDelay.es6":16,"./fx/delay/StereoDelay.es6":17,"./fx/eq/CustomEQ.es6":18,"./fx/eq/EQ2Band.es6":19,"./fx/filters/AllPassFilter.es6":20,"./fx/filters/BPFilter.es6":21,"./fx/filters/CombFilter.es6":22,"./fx/filters/FilterBank.es6":23,"./fx/filters/HPFilter.es6":24,"./fx/filters/LPFilter.es6":25,"./fx/filters/NotchFilter.es6":26,"./fx/general/DualChorus.es6":27,"./fx/general/SimpleChorus.es6":28,"./fx/saturation/SineShaper.es6":29,"./fx/utility/DCTrap.es6":30,"./fx/utility/LFO.es6":31,"./fx/utility/StereoRotation.es6":32,"./fx/utility/StereoWidth.es6":33,"./generators/OscillatorGenerator.es6":34,"./graphs/Counter.es6":35,"./graphs/Crossfader.es6":36,"./graphs/DryWetNode.es6":37,"./graphs/EQShelf.es6":38,"./graphs/PhaseOffset.es6":39,"./instruments/GeneratorPlayer.es6":40,"./math/Abs.es6":42,"./math/Add.es6":43,"./math/Average.es6":44,"./math/Clamp.es6":45,"./math/Constant.es6":46,"./math/Divide.es6":47,"./math/Floor.es6":48,"./math/Lerp.es6":49,"./math/Max.es6":50,"./math/Min.es6":51,"./math/Multiply.es6":52,"./math/Negate.es6":53,"./math/Pow.es6":54,"./math/Reciprocal.es6":55,"./math/Round.es6":56,"./math/SampleDelay.es6":57,"./math/Scale.es6":58,"./math/ScaleExp.es6":59,"./math/Sign.es6":60,"./math/Sqrt.es6":61,"./math/Square.es6":62,"./math/Subtract.es6":63,"./math/Switch.es6":64,"./math/logical-operators/AND.es6":65,"./math/logical-operators/LogicalOperator.es6":66,"./math/logical-operators/NAND.es6":67,"./math/logical-operators/NOR.es6":68,"./math/logical-operators/NOT.es6":69,"./math/logical-operators/OR.es6":70,"./math/logical-operators/XOR.es6":71,"./math/relational-operators/EqualTo.es6":72,"./math/relational-operators/EqualToZero.es6":73,"./math/relational-operators/GreaterThan.es6":74,"./math/relational-operators/GreaterThanEqualTo.es6":75,"./math/relational-operators/GreaterThanZero.es6":76,"./math/relational-operators/IfElse.es6":77,"./math/relational-operators/LessThan.es6":78,"./math/relational-operators/LessThanEqualTo.es6":79,"./math/relational-operators/LessThanZero.es6":80,"./math/trigonometry/Cos.es6":81,"./math/trigonometry/DegToRad.es6":82,"./math/trigonometry/RadToDeg.es6":83,"./math/trigonometry/Sin.es6":84,"./math/trigonometry/Tan.es6":85,"./oscillators/BufferOscillator.es6":95,"./oscillators/FMOscillator.es6":96,"./oscillators/NoiseOscillatorBank.es6":97,"./oscillators/OscillatorBank.es6":98,"./oscillators/SineBank.es6":99,"./utilities/Utils.es6":100}],42:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function Abs(io) {
        var accuracy = arguments[1] === undefined ? 10 : arguments[1];

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

    _inherits(Abs, _Node);

    return Abs;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createAbs = function (accuracy) {
    return new Abs(this, accuracy);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],43:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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
    function Add(io, value) {
        _classCallCheck(this, Add);

        _Node.call(this, io, 1, 1);

        this.inputs[1] = this.io.createParam(value);

        this.inputs[0].connect(this.outputs[0]);
        this.inputs[1].connect(this.outputs[0]);

        // Store controllable params.
        this.controls.value = this.inputs[1];
    }

    _inherits(Add, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],44:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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

    _inherits(Average, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],45:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Clamp = (function (_Node) {
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

    _inherits(Clamp, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],46:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require('../core/AudioIO.es6');

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require('../core/Node.es6');

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Constant = (function (_Node) {
    /**
     * A constant-rate audio signal
     * @param {Object} io    Instance of AudioIO
     * @param {Number} value Value of the constant
     */

    function Constant(io) {
        var value = arguments[1] === undefined ? 0.0 : arguments[1];

        _classCallCheck(this, Constant);

        _Node.call(this, io, 0, 1);

        this.outputs[0].gain.value = typeof value === 'number' ? value : 0;
        this.io.constantDriver.connect(this.outputs[0]);
    }

    _inherits(Constant, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],47:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * Divides two numbers
 * @param {Object} io Instance of AudioIO.
 */

var Divide = (function (_Node) {
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

    _inherits(Divide, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],48:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// NOTE:
//  Only accepts values >= -1 && <= 1. Values outside
//  this range are clamped to this range.

var Floor = (function (_Node) {
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

    _inherits(Floor, _Node);

    return Floor;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createFloor = function () {
    return new Floor(this);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],49:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Lerp = (function (_Node) {

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

    _inherits(Lerp, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],50:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * When input is < `value`, outputs `value`, otherwise outputs input.
 * @param {AudioIO} io   AudioIO instance
 * @param {Number} value The minimum value to test against.
 */

var Max = (function (_Node) {
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

    _inherits(Max, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],51:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * When input is > `value`, outputs `value`, otherwise outputs input.
 * @param {AudioIO} io   AudioIO instance
 * @param {Number} value The minimum value to test against.
 */

var Min = (function (_Node) {
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

    _inherits(Min, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],52:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * Multiplies two audio signals together.
 * @param {Object} io Instance of AudioIO.
 */

var Multiply = (function (_Node) {
    function Multiply(io, value) {
        _classCallCheck(this, Multiply);

        _Node.call(this, io, 1, 1);

        this.inputs[1] = this.io.createParam(value);
        this.outputs[0].gain.value = 0.0;

        this.inputs[0].connect(this.outputs[0]);
        this.inputs[1].connect(this.outputs[0].gain);

        this.controls.value = this.inputs[1];
    }

    _inherits(Multiply, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],53:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * Negates the incoming audio signal.
 * @param {Object} io Instance of AudioIO.
 */

var Negate = (function (_Node) {
    function Negate(io) {
        _classCallCheck(this, Negate);

        _Node.call(this, io, 1, 0);

        this.inputs[0].gain.value = -1;
        this.outputs = this.inputs;
    }

    _inherits(Negate, _Node);

    return Negate;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createNegate = function () {
    return new Negate(this);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],54:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * @param {Object} io Instance of AudioIO.
 *
 * Note: DOES NOT HANDLE NEGATIVE POWERS.
 */

var Pow = (function (_Node) {
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

    _inherits(Pow, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],55:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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

    _inherits(Reciprocal, _Node);

    _createClass(Reciprocal, [{
        key: "maxInput",
        get: function get() {
            return graph.maxInput.gain;
        },
        set: function set(value) {
            var graph = this.getGraph();

            if (typeof value === "number") {
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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],56:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// NOTE:
//  Only accepts values >= -1 && <= 1. Values outside
//  this range are clamped to this range.

var Round = (function (_Node) {
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

    _inherits(Round, _Node);

    return Round;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createRound = function () {
    return new Round(this);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],57:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/*
    Also known as z-1, this node delays the input by
    one sample.
 */

var SampleDelay = (function (_Node) {

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

    _inherits(SampleDelay, _Node);

    return SampleDelay;
})(_coreNodeEs62["default"]);

// The factory for SampleDelay has an alias to it's more common name!
AudioIO.prototype.createSampleDelay = AudioIO.prototype.createZMinusOne = function () {
    return new SampleDelay(this);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],58:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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

    _inherits(Scale, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],59:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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

    _inherits(ScaleExp, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],60:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Sign = (function (_Node) {

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

    _inherits(Sign, _Node);

    return Sign;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSign = function () {
    return new Sign(this);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],61:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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

    _inherits(Sqrt, _Node);

    return Sqrt;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSqrt = function (significantFigures, maxInput) {
    return new Sqrt(this, significantFigures, maxInput);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],62:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Square = (function (_Node) {

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

    _inherits(Square, _Node);

    return Square;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createSquare = function () {
    return new Square(this);
};

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],63:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * Subtracts the second input from the first.
 *
 * @param {Object} io Instance of AudioIO.
 */

var Subtract = (function (_Node) {
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

    _inherits(Subtract, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],64:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Switch = (function (_Node) {
    function Switch(io, numCases, startingCase) {
        _classCallCheck(this, Switch);

        _Node.call(this, io, 1, 1);

        // Ensure startingCase is never < 0
        startingCase = typeof startingCase === "number" ? Math.abs(startingCase) : startingCase;

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

    _inherits(Switch, _Node);

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

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],65:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _LogicalOperatorEs6 = require("./LogicalOperator.es6");

var _LogicalOperatorEs62 = _interopRequireDefault(_LogicalOperatorEs6);

var AND = (function (_LogicalOperator) {

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

    _inherits(AND, _LogicalOperator);

    return AND;
})(_LogicalOperatorEs62["default"]);

AudioIO.prototype.createAND = function () {
    return new AND(this);
};

exports["default"] = AND;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"./LogicalOperator.es6":66}],66:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var LogicalOperator = (function (_Node) {

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

    _inherits(LogicalOperator, _Node);

    return LogicalOperator;
})(_coreNodeEs62["default"]);

exports["default"] = LogicalOperator;

AudioIO.prototype.createLogicalOperator = function () {
    return new LogicalOperator(this);
};
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],67:[function(require,module,exports){
// AND -> NOT -> out
//
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _LogicalOperatorEs6 = require("./LogicalOperator.es6");

var _LogicalOperatorEs62 = _interopRequireDefault(_LogicalOperatorEs6);

var NAND = (function (_LogicalOperator) {

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

    _inherits(NAND, _LogicalOperator);

    return NAND;
})(_LogicalOperatorEs62["default"]);

AudioIO.prototype.createNAND = function () {
    return new NAND(this);
};

exports["default"] = NAND;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"./LogicalOperator.es6":66}],68:[function(require,module,exports){
// OR -> NOT -> out
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _LogicalOperatorEs6 = require("./LogicalOperator.es6");

var _LogicalOperatorEs62 = _interopRequireDefault(_LogicalOperatorEs6);

var NOR = (function (_LogicalOperator) {

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

    _inherits(NOR, _LogicalOperator);

    return NOR;
})(_LogicalOperatorEs62["default"]);

AudioIO.prototype.createNOR = function () {
    return new NOR(this);
};

exports["default"] = NOR;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"./LogicalOperator.es6":66}],69:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _LogicalOperatorEs6 = require("./LogicalOperator.es6");

var _LogicalOperatorEs62 = _interopRequireDefault(_LogicalOperatorEs6);

var NOT = (function (_LogicalOperator) {

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

    _inherits(NOT, _LogicalOperator);

    return NOT;
})(_LogicalOperatorEs62["default"]);

AudioIO.prototype.createNOT = function () {
    return new NOT(this);
};

exports["default"] = NOT;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"./LogicalOperator.es6":66}],70:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _LogicalOperatorEs6 = require("./LogicalOperator.es6");

var _LogicalOperatorEs62 = _interopRequireDefault(_LogicalOperatorEs6);

var OR = (function (_LogicalOperator) {

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

    _inherits(OR, _LogicalOperator);

    return OR;
})(_LogicalOperatorEs62["default"]);

AudioIO.prototype.createOR = function () {
    return new OR(this);
};

exports["default"] = OR;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"./LogicalOperator.es6":66}],71:[function(require,module,exports){
// a equalTo( b ) -> NOT -> out
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _LogicalOperatorEs6 = require("./LogicalOperator.es6");

var _LogicalOperatorEs62 = _interopRequireDefault(_LogicalOperatorEs6);

var XOR = (function (_LogicalOperator) {

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

    _inherits(XOR, _LogicalOperator);

    return XOR;
})(_LogicalOperatorEs62["default"]);

AudioIO.prototype.createXOR = function () {
    return new XOR(this);
};

exports["default"] = XOR;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":3,"./LogicalOperator.es6":66}],72:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// gain(+100000) -> shaper( <= 0: 1, 1 )

var EqualTo = (function (_Node) {
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

    _inherits(EqualTo, _Node);

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

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],73:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4,"./EqualTo.es6":72}],74:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var GreaterThan = (function (_Node) {
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

    _inherits(GreaterThan, _Node);

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

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],75:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var GreaterThanEqualTo = (function (_Node) {
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

    _inherits(GreaterThanEqualTo, _Node);

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

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],76:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var GreaterThanZero = (function (_Node) {
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

    _inherits(GreaterThanZero, _Node);

    return GreaterThanZero;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createGreaterThanZero = function () {
    return new GreaterThanZero(this);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],77:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var IfElse = (function (_Node) {
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

    _inherits(IfElse, _Node);

    return IfElse;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createIfElse = function () {
    return new IfElse(this);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],78:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var LessThan = (function (_Node) {
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

    _inherits(LessThan, _Node);

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

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],79:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var LessThanEqualTo = (function (_Node) {
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

    _inherits(LessThanEqualTo, _Node);

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

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],80:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var LessThanZero = (function (_Node) {
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

    _inherits(LessThanZero, _Node);

    return LessThanZero;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createLessThanZero = function () {
    return new LessThanZero(this);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],81:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// Cosine approximation!
//
// Only works in range of -Math.PI to Math.PI.

var Cos = (function (_Node) {

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

    _inherits(Cos, _Node);

    return Cos;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createCos = function (value) {
    return new Cos(this, value);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],82:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var DegToRad = (function (_Node) {
    function DegToRad(io) {
        _classCallCheck(this, DegToRad);

        _Node.call(this, io, 0, 0);
        this.inputs[0] = this.outputs[0] = this.io.createMultiply(Math.PI / 180);
    }

    _inherits(DegToRad, _Node);

    return DegToRad;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createDegToRad = function (deg) {
    return new DegToRad(this, deg);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],83:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var RadToDeg = (function (_Node) {
    function RadToDeg(io) {
        _classCallCheck(this, RadToDeg);

        _Node.call(this, io, 0, 0);
        this.inputs[0] = this.outputs[0] = this.io.createMultiply(180 / Math.PI);
    }

    _inherits(RadToDeg, _Node);

    return RadToDeg;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createRadToDeg = function (deg) {
    return new RadToDeg(this, deg);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],84:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// Sin approximation!
//
// Only works in range of -Math.PI to Math.PI.

var Sin = (function (_Node) {

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

    _inherits(Sin, _Node);

    return Sin;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSin = function (value) {
    return new Sin(this, value);
};

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],85:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// Tangent approximation!
//
// Only works in range of -Math.PI to Math.PI.
//
// sin( input ) / cos( input )

var Tan = (function (_Node) {

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

    _inherits(Tan, _Node);

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

},{"../../core/AudioIO.es6":3,"../../core/Node.es6":4}],86:[function(require,module,exports){
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
		if (typeof exp !== "number" || exp === 1) {
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

},{}],88:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var slice = Array.prototype.slice;

exports['default'] = {
    connect: function connect(node) {
        var outputChannel = arguments[1] === undefined ? 0 : arguments[1];
        var inputChannel = arguments[2] === undefined ? 0 : arguments[2];

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
        var outputChannel = arguments[1] === undefined ? 0 : arguments[1];
        var inputChannel = arguments[2] === undefined ? 0 : arguments[2];

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

},{}],89:[function(require,module,exports){
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
        var values = (value + "").split("."),
            noteValue = +values[0],
            cents = (values[1] ? parseFloat("0." + values[1], 10) : 0) * 100;

        if (Math.abs(cents) >= 100) {
            noteValue += cents % 100;
        }

        var root = noteValue % 12 | 0,
            octave = noteValue / 12 | 0,
            noteName = _noteStringsEs62["default"][root];

        return noteName + (octave + _coreConfigEs62["default"].lowestOctave) + (cents ? "+" + cents : "");
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
            console.warn("Invalid note format:", value);
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

},{"../core/config.es6":7,"./math.es6":90,"./noteRegExp.es6":91,"./noteStrings.es6":92,"./notes.es6":93}],90:[function(require,module,exports){
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
		if (typeof exp !== "number" || exp === 1) {
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

},{"../core/config.es6":7}],91:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = /^([A|B|C|D|E|F|G]{1})([#bx]{0,2})([\-\+]?\d+)?([\+|\-]{1}\d*.\d*)?/;
module.exports = exports["default"];

},{}],92:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
module.exports = exports['default'];

},{}],93:[function(require,module,exports){
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

},{}],94:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = _setIO;

function _setIO(io) {
    this.io = io;
    this.context = io.context;
}

;
module.exports = exports["default"];

},{}],95:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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
	function BufferOscillator(io, generator) {
		_classCallCheck(this, BufferOscillator);

		_Node.call(this, io, 0, 1);

		this.generator = generator;
		this.controls.frequency = this.io.createParam();
		this.controls.detune = this.io.createParam();

		this.reset();
	}

	_inherits(BufferOscillator, _Node);

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

},{"../buffers/BufferGenerators.es6":1,"../buffers/BufferUtils.es6":2,"../core/AudioIO.es6":3,"../core/Node.es6":4}],96:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _oscillatorsOscillatorBankEs6 = require("../oscillators/OscillatorBank.es6");

var _oscillatorsOscillatorBankEs62 = _interopRequireDefault(_oscillatorsOscillatorBankEs6);

var FMOscillator = (function (_OscillatorBank) {
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

    _inherits(FMOscillator, _OscillatorBank);

    return FMOscillator;
})(_oscillatorsOscillatorBankEs62["default"]);

AudioIO.prototype.createFMOscillator = function () {
    return new FMOscillator(this);
};

},{"../core/AudioIO.es6":3,"../oscillators/OscillatorBank.es6":98}],97:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var _buffersBufferUtilsEs6 = require("../buffers/BufferUtils.es6");

var _buffersBufferUtilsEs62 = _interopRequireDefault(_buffersBufferUtilsEs6);

var _buffersBufferGeneratorsEs6 = require("../buffers/BufferGenerators.es6");

var _buffersBufferGeneratorsEs62 = _interopRequireDefault(_buffersBufferGeneratorsEs6);

var BUFFERS = new WeakMap();

var NoiseOscillatorBank = (function (_Node) {
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

    _inherits(NoiseOscillatorBank, _Node);

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

NoiseOscillatorBank.generatorKeys = ["WhiteNoise", "GaussianNoise", "PinkNoise"];

AudioIO.prototype.createNoiseOscillatorBank = function () {
    return new NoiseOscillatorBank(this);
};

},{"../buffers/BufferGenerators.es6":1,"../buffers/BufferUtils.es6":2,"../core/AudioIO.es6":3,"../core/Node.es6":4}],98:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var OSCILLATOR_TYPES = ["sine", "triangle", "sawtooth", "square"];

var OscillatorBank = (function (_Node) {
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

    _inherits(OscillatorBank, _Node);

    OscillatorBank.prototype.start = function start() {
        var delay = arguments[0] === undefined ? 0 : arguments[0];

        this.getGraph().outputLevel.gain.value = 1;
    };

    OscillatorBank.prototype.stop = function stop() {
        var delay = arguments[0] === undefined ? 0 : arguments[0];

        this.getGraph().outputLevel.gain.value = 0;
    };

    return OscillatorBank;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createOscillatorBank = function () {
    return new OscillatorBank(this);
};

exports["default"] = OscillatorBank;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],99:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var SineBank = (function (_Node) {
    function SineBank(io) {
        var numSines = arguments[1] === undefined ? 4 : arguments[1];

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

            osc.type = "sine";
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

    _inherits(SineBank, _Node);

    SineBank.prototype.start = function start() {
        var delay = arguments[0] === undefined ? 0 : arguments[0];

        var graph = this.getGraph();
        graph.outputLevel.gain.value = 1 / graph.numSines;
    };

    SineBank.prototype.stop = function stop() {
        var delay = arguments[0] === undefined ? 0 : arguments[0];

        this.getGraph().outputLevel.gain.value = 0;
    };

    return SineBank;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createSineBank = function (numSines) {
    return new SineBank(this, numSines);
};

exports["default"] = SineBank;
module.exports = exports["default"];

},{"../core/AudioIO.es6":3,"../core/Node.es6":4}],100:[function(require,module,exports){
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

},{}]},{},[41])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9idWZmZXJzL0J1ZmZlckdlbmVyYXRvcnMuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvYnVmZmVycy9CdWZmZXJVdGlscy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9jb3JlL0F1ZGlvSU8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvY29yZS9Ob2RlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvUGFyYW0uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvY29yZS9XYXZlU2hhcGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvY29uZmlnLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvb3ZlcnJpZGVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvc2lnbmFsQ3VydmVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2VudmVsb3Blcy9BREJEU1JFbnZlbG9wZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9lbnZlbG9wZXMvQURFbnZlbG9wZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9lbnZlbG9wZXMvQURTUkVudmVsb3BlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2VudmVsb3Blcy9DdXN0b21FbnZlbG9wZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9TY2hyb2VkZXJBbGxQYXNzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L2RlbGF5L0RlbGF5LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L2RlbGF5L1BpbmdQb25nRGVsYXkuZXM2LmpzIiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZngvZGVsYXkvU3RlcmVvRGVsYXkuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZngvZXEvQ3VzdG9tRVEuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZngvZXEvRVEyQmFuZC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9maWx0ZXJzL0FsbFBhc3NGaWx0ZXIuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZngvZmlsdGVycy9CUEZpbHRlci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9maWx0ZXJzL0NvbWJGaWx0ZXIuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZngvZmlsdGVycy9GaWx0ZXJCYW5rLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L2ZpbHRlcnMvSFBGaWx0ZXIuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZngvZmlsdGVycy9MUEZpbHRlci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9maWx0ZXJzL05vdGNoRmlsdGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L2dlbmVyYWwvRHVhbENob3J1cy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9nZW5lcmFsL1NpbXBsZUNob3J1cy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9zYXR1cmF0aW9uL1NpbmVTaGFwZXIuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZngvdXRpbGl0eS9EQ1RyYXAuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZngvdXRpbGl0eS9MRk8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZngvdXRpbGl0eS9TdGVyZW9Sb3RhdGlvbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC91dGlsaXR5L1N0ZXJlb1dpZHRoLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dlbmVyYXRvcnMvT3NjaWxsYXRvckdlbmVyYXRvci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9ncmFwaHMvQ291bnRlci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9ncmFwaHMvQ3Jvc3NmYWRlci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9ncmFwaHMvRHJ5V2V0Tm9kZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9ncmFwaHMvRVFTaGVsZi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9ncmFwaHMvUGhhc2VPZmZzZXQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvaW5zdHJ1bWVudHMvR2VuZXJhdG9yUGxheWVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21haW4uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9BYnMuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9BZGQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9BdmVyYWdlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvQ2xhbXAuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9Db25zdGFudC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0RpdmlkZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0Zsb29yLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvTGVycC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL01heC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL01pbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL011bHRpcGx5LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvTmVnYXRlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvUG93LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvUmVjaXByb2NhbC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1JvdW5kLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU2FtcGxlRGVsYXkuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TY2FsZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1NjYWxlRXhwLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU2lnbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1NxcnQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TcXVhcmUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TdWJ0cmFjdC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1N3aXRjaC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL0FORC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL0xvZ2ljYWxPcGVyYXRvci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL05BTkQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OT1IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OT1QuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9PUi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL1hPUi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0VxdWFsVG8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9FcXVhbFRvWmVyby5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvR3JlYXRlclRoYW5FcXVhbFRvLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvR3JlYXRlclRoYW5aZXJvLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvSWZFbHNlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvTGVzc1RoYW4uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhbkVxdWFsVG8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhblplcm8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC90cmlnb25vbWV0cnkvQ29zLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L0RlZ1RvUmFkLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L1JhZFRvRGVnLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L1Npbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9UYW4uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL01hdGguZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL2NsZWFuZXJzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9jb25uZWN0aW9ucy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvY29udmVyc2lvbnMuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL21hdGguZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL25vdGVSZWdFeHAuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL25vdGVTdHJpbmdzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9ub3Rlcy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvc2V0SU8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvb3NjaWxsYXRvcnMvQnVmZmVyT3NjaWxsYXRvci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9vc2NpbGxhdG9ycy9GTU9zY2lsbGF0b3IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvb3NjaWxsYXRvcnMvTm9pc2VPc2NpbGxhdG9yQmFuay5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9vc2NpbGxhdG9ycy9Pc2NpbGxhdG9yQmFuay5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9vc2NpbGxhdG9ycy9TaW5lQmFuay5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9h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QyxhQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFNUMsYUFBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBRSxDQUFDO0FBQzFDLGFBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxVQUFVLENBQUUsQ0FBQztBQUMxQyxhQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsT0FBTyxDQUFFLENBQUM7QUFDMUMsYUFBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBRSxDQUFDO0FBQzFDLGFBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzVDLGFBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUU1QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsR0FBRyxDQUFFLENBQUM7OztBQUdqQyxhQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsVUFBVSxDQUFFLENBQUM7QUFDdEMsYUFBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBRSxDQUFDO0FBQ3RDLGFBQUssQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDcEQsYUFBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUNwRCxhQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDNUMsYUFBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQzVDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDbkQsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUNuRCxhQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDOzs7QUFHbEIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNqRCxZQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2pELFlBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDL0MsWUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3hELFlBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDbkQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNqRCxZQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2pELFlBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztBQUN6RCxZQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7OztBQUd6RCxZQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUM1RCxZQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUM1RCxZQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUM1RCxZQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUM1RCxZQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUUsQ0FBQztBQUN4RCxZQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUUsQ0FBQztBQUN4RCxZQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUUsQ0FBQztBQUN4RCxZQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUUsQ0FBQztBQUN4RCxZQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQzNFLFlBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDM0UsWUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDMUQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENB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QUksQ0FBQyxHQUFHLENBQUUsQ0FBQzs7O0FBR2pDLGFBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUNyQyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQ2xELGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxRQUFRLENBQUUsQ0FBQztBQUMxQyxhQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQ2pELGFBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7OztBQUdsQixZQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2hELFlBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDL0MsWUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNuRCxZQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2hELFlBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQzs7QUFFdkQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDMUQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDMUQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFF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QUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxTQUFTLENBQUUsQ0FBQztBQUM1QyxhQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDNUMsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLENBQUUsQ0FBQzs7QUFFcEMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDOzs7QUFHekMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc5QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtB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QUM7QUFDN0MsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLFFBQVEsQ0FBRSxDQUFDO0FBQzVDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXBDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUUsQ0FBQzs7O0FBR3pDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHOUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUss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LFFBQVEsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztLQUM5Qzs7V0FoREMsUUFBUTs7O0FBbURkLDRCQUFRLFNBQVMsQ0FBQyxjQUFjLEdBQUcsVUFBVSxRQUFRLEVBQUc7QUFDcEQsV0FBTyxJQUFJLFFBQVEsQ0FBRSxJQUFJLEVBQUUsUUFBUSxDQUFFLENBQUM7Q0FDekMsQ0FBQzs7cUJBR00sUUFBUTs7Ozs7OztBQzVEaEIsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDOztBQUVmLEtBQUssQ0FBQyxZQUFZLEdBQUcsVUFBVSxLQUFLLEVBQUc7QUFDdEMsS0FBSyxLQUFLLEtBQUssU0FBUyxJQUFJLEtBQUssQ0FBQyxNQUFNLFlBQVksV0FBVyxFQUFHO0FBQ2pFLFNBQU8sSUFBSSxDQUFDO0VBQ1o7O0FBRUQsUUFBTyxLQUFLLENBQUM7Q0FDYixDQUFDOztxQkFFYSxLQUFLIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBDT05GSUcgZnJvbSAnLi4vY29yZS9jb25maWcuZXM2JztcbmltcG9ydCBtYXRoIGZyb20gJy4uL21peGlucy9NYXRoLmVzNic7XG5cblxudmFyIEJ1ZmZlckdlbmVyYXRvcnMgPSB7fTtcblxuQnVmZmVyR2VuZXJhdG9ycy5TaW5lV2F2ZSA9IGZ1bmN0aW9uIHNpbmVXYXZlSXRlcmF0b3IoIGksIGxlbmd0aCApIHtcbiAgICB2YXIgeCA9IE1hdGguUEkgKiAoIGkgLyBsZW5ndGggKSAtIE1hdGguUEkgKiAwLjU7XG4gICAgcmV0dXJuIE1hdGguc2luKCB4ICogMiApO1xufTtcblxuQnVmZmVyR2VuZXJhdG9ycy5TYXdXYXZlID0gZnVuY3Rpb24gc2F3V2F2ZUl0ZXJhdG9yKCBpLCBsZW5ndGggKSB7XG4gICAgcmV0dXJuICggaSAvIGxlbmd0aCApICogMiAtIDE7XG59O1xuXG5CdWZmZXJHZW5lcmF0b3JzLlNxdWFyZVdhdmUgPSBmdW5jdGlvbiBzcXVhcmVXYXZlSXRlcmF0b3IoIGksIGxlbmd0aCApIHtcbiAgICB2YXIgeCA9ICggaSAvIGxlbmd0aCApICogMiAtIDE7XG4gICAgcmV0dXJuIE1hdGguc2lnbiggeCArIDAuMDAxICk7XG59O1xuXG5CdWZmZXJHZW5lcmF0b3JzLlRyaWFuZ2xlV2F2ZSA9IGZ1bmN0aW9uIHRyaWFuZ2xlV2F2ZUl0ZXJhdG9yKCBpLCBsZW5ndGggKSB7XG4gICAgdmFyIHggPSBNYXRoLmFicyggKCBpICUgbGVuZ3RoICogMiApIC0gbGVuZ3RoICkgLSBsZW5ndGggKiAwLjU7XG4gICAgcmV0dXJuIE1hdGguc2luKCB4IC8gKCBsZW5ndGggKiAwLjUgKSApO1xufTtcblxuQnVmZmVyR2VuZXJhdG9ycy5XaGl0ZU5vaXNlID0gZnVuY3Rpb24gd2hpdGVOb2lzZUl0ZXJhdG9yKCkge1xuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpICogMiAtIDE7XG59O1xuXG5CdWZmZXJHZW5lcmF0b3JzLkdhdXNzaWFuTm9pc2UgPSBmdW5jdGlvbiBnYXVzc2lhbk5vaXNlSXRlcmF0b3IoKSB7XG4gICAgcmV0dXJuIG1hdGgubnJhbmQoKSAqIDIgLSAxO1xufTtcblxuQnVmZmVyR2VuZXJhdG9ycy5QaW5rTm9pc2UgPSAoIGZ1bmN0aW9uKCkge1xuICAgIHZhciBoYXNHZW5lcmF0ZWRQaW5rTnVtYmVyID0gZmFsc2U7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gcGlua05vaXNlSXRlcmF0b3IoIGksIGxlbmd0aCApIHtcbiAgICAgICAgdmFyIG51bWJlcjtcblxuICAgICAgICBpZiAoIGhhc0dlbmVyYXRlZFBpbmtOdW1iZXIgPT09IGZhbHNlICkge1xuICAgICAgICAgICAgbWF0aC5nZW5lcmF0ZVBpbmtOdW1iZXIoIDEyOCwgNSApO1xuICAgICAgICAgICAgaGFzR2VuZXJhdGVkUGlua051bWJlciA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBudW1iZXIgPSBtYXRoLmdldE5leHRQaW5rTnVtYmVyKCkgKiAyIC0gMTtcblxuICAgICAgICBpZiAoIGkgPT09IGxlbmd0aCAtIDEgKSB7XG4gICAgICAgICAgICBoYXNHZW5lcmF0ZWRQaW5rTnVtYmVyID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVtYmVyO1xuICAgIH07XG59KCkgKTtcblxuZXhwb3J0IGRlZmF1bHQgQnVmZmVyR2VuZXJhdG9yczsiLCJpbXBvcnQgVXRpbHMgZnJvbSAnLi4vdXRpbGl0aWVzL1V0aWxzLmVzNic7XG5cbnZhciBCdWZmZXJVdGlscyA9IHt9O1xudmFyIEJVRkZFUl9TVE9SRSA9IHt9O1xuXG5mdW5jdGlvbiBnZW5lcmF0ZUJ1ZmZlclN0b3JlS2V5KCBsZW5ndGgsIG51bWJlck9mQ2hhbm5lbHMsIHNhbXBsZVJhdGUsIGl0ZXJhdG9yICkge1xuXHRyZXR1cm4gbGVuZ3RoICsgJy0nICsgbnVtYmVyT2ZDaGFubmVscyArICctJyArIHNhbXBsZVJhdGUgKyAnLScgKyBpdGVyYXRvcjtcbn1cblxuLy8gVE9ETzpcbi8vIFx0LSBJdCBtaWdodCBiZSBwb3NzaWJsZSB0byBkZWNvZGUgdGhlIGFycmF5YnVmZmVyXG4vLyBcdCAgdXNpbmcgYSBjb250ZXh0IGRpZmZlcmVudCBmcm9tIHRoZSBvbmUgdGhlIFxuLy8gXHQgIGJ1ZmZlciB3aWxsIGJlIHVzZWQgaW4uXG4vLyBcdCAgSWYgc28sIHJlbW92ZSB0aGUgYGlvYCBhcmd1bWVudCwgYW5kIGNyZWF0ZVxuLy8gXHQgIGEgbmV3IEF1ZGlvQ29udGV4dCBiZWZvcmUgdGhlIHJldHVybiBvZiB0aGUgUHJvbWlzZSxcbi8vIFx0ICBhbmQgdXNlIHRoYXQuXG5CdWZmZXJVdGlscy5sb2FkQnVmZmVyID0gZnVuY3Rpb24oIGlvLCB1cmkgKSB7XG5cdHJldHVybiBuZXcgUHJvbWlzZSggZnVuY3Rpb24oIHJlc29sdmUsIHJlamVjdCApIHtcblx0XHR2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cblx0XHR4aHIub3BlbiggJ0dFVCcsIHVyaSApO1xuXHRcdHhoci5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuXG5cdFx0eGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCB4aHIuc3RhdHVzID09PSAyMDAgKSB7XG5cdFx0XHRcdC8vIERvIHRoZSBkZWNvZGUgZGFuY2Vcblx0XHRcdFx0aW8uY29udGV4dC5kZWNvZGVBdWRpb0RhdGEoXG5cdFx0XHRcdFx0eGhyLnJlc3BvbnNlLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCBidWZmZXIgKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKCBidWZmZXIgKTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCBlICkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KCBlICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHJlamVjdCggRXJyb3IoICdTdGF0dXMgIT09IDIwMCcgKSApO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmVqZWN0KCBFcnJvciggJ05ldHdvcmsgZXJyb3InICkgKTtcblx0XHR9O1xuXG5cdFx0eGhyLnNlbmQoKTtcblx0fSApO1xufTtcblxuQnVmZmVyVXRpbHMuZ2VuZXJhdGVCdWZmZXIgPSBmdW5jdGlvbiggaW8sIG51bWJlck9mQ2hhbm5lbHMsIGxlbmd0aCwgc2FtcGxlUmF0ZSwgaXRlcmF0b3IgKSB7XG5cdHZhciBrZXkgPSBnZW5lcmF0ZUJ1ZmZlclN0b3JlS2V5KCBsZW5ndGgsIG51bWJlck9mQ2hhbm5lbHMsIHNhbXBsZVJhdGUsIGl0ZXJhdG9yLnRvU3RyaW5nKCkgKSxcblx0XHRidWZmZXIsXG5cdFx0Y2hhbm5lbERhdGE7XG5cblx0aWYgKCBCVUZGRVJfU1RPUkVbIGtleSBdICkge1xuXHRcdHJldHVybiBCVUZGRVJfU1RPUkVbIGtleSBdO1xuXHR9XG5cblx0YnVmZmVyID0gaW8uY29udGV4dC5jcmVhdGVCdWZmZXIoIG51bWJlck9mQ2hhbm5lbHMsIGxlbmd0aCwgc2FtcGxlUmF0ZSApO1xuXG5cdGZvciAoIHZhciBjID0gMDsgYyA8IG51bWJlck9mQ2hhbm5lbHM7ICsrYyApIHtcblx0XHRjaGFubmVsRGF0YSA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSggYyApO1xuXG5cdFx0Zm9yICggdmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kgKSB7XG5cdFx0XHRjaGFubmVsRGF0YVsgaSBdID0gaXRlcmF0b3IoIGksIGxlbmd0aCwgYywgbnVtYmVyT2ZDaGFubmVscyApO1xuXHRcdH1cblx0fVxuXG5cdEJVRkZFUl9TVE9SRVsga2V5IF0gPSBidWZmZXI7XG5cblx0cmV0dXJuIGJ1ZmZlcjtcbn07XG5cblxuQnVmZmVyVXRpbHMuZmlsbEJ1ZmZlciA9IGZ1bmN0aW9uKCBidWZmZXIsIHZhbHVlICkge1xuXHR2YXIgbnVtQ2hhbm5lbHMgPSBidWZmZXIubnVtYmVyT2ZDaGFubmVscyxcblx0XHRsZW5ndGggPSBidWZmZXIubGVuZ3RoLFxuXHRcdGNoYW5uZWxEYXRhO1xuXG5cdGZvciAoIHZhciBjID0gMDsgYyA8IG51bUNoYW5uZWxzOyArK2MgKSB7XG5cdFx0Y2hhbm5lbERhdGEgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIGMgKTtcblx0XHRjaGFubmVsRGF0YS5maWxsKCB2YWx1ZSApO1xuXHR9XG59O1xuXG5cbkJ1ZmZlclV0aWxzLnJldmVyc2VCdWZmZXIgPSBmdW5jdGlvbiggYnVmZmVyICkge1xuXHRpZiAoIGJ1ZmZlciBpbnN0YW5jZW9mIEF1ZGlvQnVmZmVyID09PSBmYWxzZSApIHtcblx0XHRjb25zb2xlLmVycm9yKCAnYGJ1ZmZlcmAgYXJndW1lbnQgbXVzdCBiZSBpbnN0YW5jZSBvZiBBdWRpb0J1ZmZlcicgKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgbnVtQ2hhbm5lbHMgPSBidWZmZXIubnVtYmVyT2ZDaGFubmVscyxcblx0XHRsZW5ndGggPSBidWZmZXIubGVuZ3RoLFxuXHRcdGNoYW5uZWxEYXRhO1xuXG5cdGZvciAoIHZhciBjID0gMDsgYyA8IG51bUNoYW5uZWxzOyArK2MgKSB7XG5cdFx0Y2hhbm5lbERhdGEgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIGMgKTtcblx0XHRjaGFubmVsRGF0YS5yZXZlcnNlKCk7XG5cdH1cbn07XG5cbkJ1ZmZlclV0aWxzLmNsb25lQnVmZmVyID0gZnVuY3Rpb24oIGJ1ZmZlciApIHtcblx0dmFyIG5ld0J1ZmZlciA9IHRoaXMuaW8uY3JlYXRlQnVmZmVyKCBidWZmZXIubnVtYmVyT2ZDaGFubmVscywgYnVmZmVyLmxlbmd0aCwgYnVmZmVyLnNhbXBsZVJhdGUgKTtcblxuXHRmb3IgKCB2YXIgYyA9IDA7IGMgPCBidWZmZXIubnVtYmVyT2ZDaGFubmVsczsgKytjICkge1xuXHRcdHZhciBjaGFubmVsRGF0YSA9IG5ld0J1ZmZlci5nZXRDaGFubmVsRGF0YSggYyApLFxuXHRcdFx0c291cmNlRGF0YSA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSggYyApO1xuXG5cdFx0Zm9yICggdmFyIGkgPSAwOyBpIDwgYnVmZmVyLmxlbmd0aDsgKytpICkge1xuXHRcdFx0Y2hhbm5lbERhdGFbIGkgXSA9IHNvdXJjZURhdGFbIGkgXTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gbmV3QnVmZmVyO1xufTtcblxuLy8gVE9ETzpcbi8vIFx0LSBTdXBwb3J0IGJ1ZmZlcnMgd2l0aCBtb3JlIHRoYW4gMiBjaGFubmVscy5cbkJ1ZmZlclV0aWxzLnRvU3RlcmVvID0gZnVuY3Rpb24oIGJ1ZmZlciApIHtcblx0dmFyIHN0ZXJlb0J1ZmZlcixcblx0XHRsZW5ndGg7XG5cblx0aWYgKCBidWZmZXIubnVtQ2hhbm5lbHMgPj0gMiApIHtcblx0XHRjb25zb2xlLndhcm4oICdCdWZmZXJVdGlscy50b1N0ZXJlbyBjdXJyZW50bHkgb25seSBzdXBwb3J0cyBtb25vIGJ1ZmZlcnMgZm9yIHVwbWl4aW5nJyApO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGxlbmd0aCA9IGJ1ZmZlci5sZW5ndGg7XG5cdHN0ZXJlb0J1ZmZlciA9IHRoaXMuaW8uY3JlYXRlQnVmZmVyKCAyLCBsZW5ndGgsIGJ1ZmZlci5zYW1wbGVSYXRlICk7XG5cblx0Zm9yICggdmFyIGMgPSAwOyBjIDwgMjsgKytjICkge1xuXHRcdHZhciBjaGFubmVsRGF0YSA9IHN0ZXJlb0J1ZmZlci5nZXRDaGFubmVsRGF0YSggYyApLFxuXHRcdFx0c291cmNlRGF0YSA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSggMCApO1xuXG5cdFx0Zm9yICggdmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kgKSB7XG5cdFx0XHRjaGFubmVsRGF0YVsgaSBdID0gc291cmNlRGF0YVsgaSBdO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBzdGVyZW9CdWZmZXI7XG59O1xuXG4vLyBUT0RPOlxuLy8gXHQtIFRoZXNlIGJhc2ljIG1hdGggZnVuY3Rpb25zLiBUaGluayBvZiBcbi8vIFx0ICB0aGVtIGFzIGEgYnVmZmVyLXZlcnNpb24gb2YgYSB2ZWN0b3IgbGliLlxuQnVmZmVyVXRpbHMuYWRkQnVmZmVyID0gZnVuY3Rpb24oIGEsIGIgKSB7fTtcblxuXG4vLyBhZGRcbi8vIG11bHRpcGx5XG4vLyBzdWJ0cmFjdFxuLy9cblxuZXhwb3J0IGRlZmF1bHQgQnVmZmVyVXRpbHM7IiwiaW1wb3J0IENPTkZJRyBmcm9tICcuL2NvbmZpZy5lczYnO1xuaW1wb3J0ICcuL292ZXJyaWRlcy5lczYnO1xuaW1wb3J0IHNpZ25hbEN1cnZlcyBmcm9tICcuL3NpZ25hbEN1cnZlcy5lczYnO1xuaW1wb3J0IGNvbnZlcnNpb25zIGZyb20gJy4uL21peGlucy9jb252ZXJzaW9ucy5lczYnO1xuaW1wb3J0IG1hdGggZnJvbSAnLi4vbWl4aW5zL21hdGguZXM2JztcbmltcG9ydCBCdWZmZXJHZW5lcmF0b3JzIGZyb20gJy4uL2J1ZmZlcnMvQnVmZmVyR2VuZXJhdG9ycy5lczYnO1xuaW1wb3J0IEJ1ZmZlclV0aWxzIGZyb20gJy4uL2J1ZmZlcnMvQnVmZmVyVXRpbHMuZXM2JztcbmltcG9ydCBVdGlscyBmcm9tICcuLi91dGlsaXRpZXMvVXRpbHMuZXM2JztcblxuY2xhc3MgQXVkaW9JTyB7XG5cbiAgICBzdGF0aWMgbWl4aW4oIHRhcmdldCwgc291cmNlICkge1xuICAgICAgICBmb3IgKCBsZXQgaSBpbiBzb3VyY2UgKSB7XG4gICAgICAgICAgICBpZiAoIHNvdXJjZS5oYXNPd25Qcm9wZXJ0eSggaSApICkge1xuICAgICAgICAgICAgICAgIHRhcmdldFsgaSBdID0gc291cmNlWyBpIF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgbWl4aW5TaW5nbGUoIHRhcmdldCwgc291cmNlLCBuYW1lICkge1xuICAgICAgICB0YXJnZXRbIG5hbWUgXSA9IHNvdXJjZTtcbiAgICB9XG5cblxuICAgIGNvbnN0cnVjdG9yKCBjb250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpICkge1xuICAgICAgICB0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcblxuICAgICAgICB0aGlzLm1hc3RlciA9IHRoaXMuX2NvbnRleHQuZGVzdGluYXRpb247XG5cbiAgICAgICAgLy8gQ3JlYXRlIGFuIGFsd2F5cy1vbiAnZHJpdmVyJyBub2RlIHRoYXQgY29uc3RhbnRseSBvdXRwdXRzIGEgdmFsdWVcbiAgICAgICAgLy8gb2YgMS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gSXQncyB1c2VkIGJ5IGEgZmFpciBmZXcgbm9kZXMsIHNvIG1ha2VzIHNlbnNlIHRvIHVzZSB0aGUgc2FtZVxuICAgICAgICAvLyBkcml2ZXIsIHJhdGhlciB0aGFuIHNwYW1taW5nIGEgYnVuY2ggb2YgV2F2ZVNoYXBlck5vZGVzIGFsbCBhYm91dFxuICAgICAgICAvLyB0aGUgcGxhY2UuIEl0IGNhbid0IGJlIGRlbGV0ZWQsIHNvIG5vIHdvcnJpZXMgYWJvdXQgYnJlYWtpbmdcbiAgICAgICAgLy8gZnVuY3Rpb25hbGl0eSBvZiBub2RlcyB0aGF0IGRvIHVzZSBpdCBzaG91bGQgaXQgYXR0ZW1wdCB0byBiZVxuICAgICAgICAvLyBvdmVyd3JpdHRlbi5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCB0aGlzLCAnY29uc3RhbnREcml2ZXInLCB7XG4gICAgICAgICAgICB3cml0ZWFibGU6IGZhbHNlLFxuICAgICAgICAgICAgZ2V0OiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGxldCBjb25zdGFudERyaXZlcjtcblxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhY29uc3RhbnREcml2ZXIgfHwgY29uc3RhbnREcml2ZXIuY29udGV4dCAhPT0gdGhpcy5jb250ZXh0ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3RhbnREcml2ZXIgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29udGV4dCA9IHRoaXMuY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSBjb250ZXh0LmNyZWF0ZUJ1ZmZlciggMSwgNDA5NiwgY29udGV4dC5zYW1wbGVSYXRlICksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyRGF0YSA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSggMCApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlclNvdXJjZSA9IGNvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGJ1ZmZlckRhdGEubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyRGF0YVsgaSBdID0gMS4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3IoIGxldCBidWZmZXJWYWx1ZSBvZiBidWZmZXJEYXRhICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGJ1ZmZlclZhbHVlID0gMS4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJTb3VyY2UuYnVmZmVyID0gYnVmZmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyU291cmNlLmxvb3AgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyU291cmNlLnN0YXJ0KCAwICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0YW50RHJpdmVyID0gYnVmZmVyU291cmNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnN0YW50RHJpdmVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0oKSApXG4gICAgICAgIH0gKTtcbiAgICB9XG5cblxuXG4gICAgZ2V0IGNvbnRleHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0O1xuICAgIH1cblxuICAgIHNldCBjb250ZXh0KCBjb250ZXh0ICkge1xuICAgICAgICBpZiAoICEoIGNvbnRleHQgaW5zdGFuY2VvZiBBdWRpb0NvbnRleHQgKSApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggXCJJbnZhbGlkIGF1ZGlvIGNvbnRleHQgZ2l2ZW46XCIgKyBjb250ZXh0ICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5tYXN0ZXIgPSBjb250ZXh0LmRlc3RpbmF0aW9uO1xuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggQXVkaW9JTy5wcm90b3R5cGUsIHNpZ25hbEN1cnZlcywgJ2N1cnZlcycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIEF1ZGlvSU8ucHJvdG90eXBlLCBjb252ZXJzaW9ucywgJ2NvbnZlcnQnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBBdWRpb0lPLnByb3RvdHlwZSwgbWF0aCwgJ21hdGgnICk7XG5cbkF1ZGlvSU8uQnVmZmVyVXRpbHMgPSBCdWZmZXJVdGlscztcbkF1ZGlvSU8uQnVmZmVyR2VuZXJhdG9ycyA9IEJ1ZmZlckdlbmVyYXRvcnM7XG5BdWRpb0lPLlV0aWxzID0gVXRpbHM7XG5cbndpbmRvdy5BdWRpb0lPID0gQXVkaW9JTztcbmV4cG9ydCBkZWZhdWx0IEF1ZGlvSU87IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4vQXVkaW9JTy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBjb25uZWN0aW9ucyBmcm9tIFwiLi4vbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNlwiO1xuaW1wb3J0IGNsZWFuZXJzIGZyb20gXCIuLi9taXhpbnMvY2xlYW5lcnMuZXM2XCI7XG5cbnZhciBncmFwaHMgPSBuZXcgV2Vha01hcCgpO1xuXG4vLyBUT0RPOlxuLy8gIC0gUG9zc2libHkgcmVtb3ZlIHRoZSBuZWVkIGZvciBvbmx5IEdhaW5Ob2Rlc1xuLy8gICAgYXMgaW5wdXRzL291dHB1dHM/IEl0J2xsIGFsbG93IGZvciBzdWJjbGFzc2VzXG4vLyAgICBvZiBOb2RlIHRvIGJlIG1vcmUgZWZmaWNpZW50Li4uXG5jbGFzcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIG51bUlucHV0cyA9IDAsIG51bU91dHB1dHMgPSAwICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLmlucHV0cyA9IFtdO1xuICAgICAgICB0aGlzLm91dHB1dHMgPSBbXTtcblxuICAgICAgICAvLyBUaGlzIG9iamVjdCB3aWxsIGhvbGQgYW55IHZhbHVlcyB0aGF0IGNhbiBiZVxuICAgICAgICAvLyBjb250cm9sbGVkIHdpdGggYXVkaW8gc2lnbmFscy5cbiAgICAgICAgdGhpcy5jb250cm9scyA9IHt9O1xuXG4gICAgICAgIC8vIEJvdGggdGhlc2Ugb2JqZWN0cyB3aWxsIGp1c3QgaG9sZCByZWZlcmVuY2VzXG4gICAgICAgIC8vIHRvIGVpdGhlciBpbnB1dCBvciBvdXRwdXQgbm9kZXMuIEhhbmR5IHdoZW5cbiAgICAgICAgLy8gd2FudGluZyB0byBjb25uZWN0IHNwZWNpZmljIGlucy9vdXRzIHdpdGhvdXRcbiAgICAgICAgLy8gaGF2aW5nIHRvIHVzZSB0aGUgYC5jb25uZWN0KCAuLi4sIDAsIDEgKWAgc3ludGF4LlxuICAgICAgICB0aGlzLm5hbWVkSW5wdXRzID0ge307XG4gICAgICAgIHRoaXMubmFtZWRPdXRwdXRzID0ge307XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgbnVtSW5wdXRzOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLmFkZElucHV0Q2hhbm5lbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICggaSA9IDA7IGkgPCBudW1PdXRwdXRzOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE91dHB1dENoYW5uZWwoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldEdyYXBoKCBncmFwaCApIHtcbiAgICAgICAgZ3JhcGhzLnNldCggdGhpcywgZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXRHcmFwaCgpIHtcbiAgICAgICAgcmV0dXJuIGdyYXBocy5nZXQoIHRoaXMgKSB8fCB7fTtcbiAgICB9XG5cbiAgICBhZGRJbnB1dENoYW5uZWwoKSB7XG4gICAgICAgIHRoaXMuaW5wdXRzLnB1c2goIHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCkgKTtcbiAgICB9XG5cbiAgICBhZGRPdXRwdXRDaGFubmVsKCkge1xuICAgICAgICB0aGlzLm91dHB1dHMucHVzaCggdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKSApO1xuICAgIH1cblxuICAgIF9jbGVhblVwU2luZ2xlKCBpdGVtLCBwYXJlbnQsIGtleSApIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIC8vIEhhbmRsZSBhcnJheXMgYnkgbG9vcGluZyBvdmVyIHRoZW1cbiAgICAgICAgLy8gYW5kIHJlY3Vyc2l2ZWx5IGNhbGxpbmcgdGhpcyBmdW5jdGlvbiB3aXRoIGVhY2hcbiAgICAgICAgLy8gYXJyYXkgbWVtYmVyLlxuICAgICAgICBpZiggQXJyYXkuaXNBcnJheSggaXRlbSApICkge1xuICAgICAgICAgICAgaXRlbS5mb3JFYWNoKGZ1bmN0aW9uKCBub2RlLCBpbmRleCApIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9jbGVhblVwU2luZ2xlKCBub2RlLCBpdGVtLCBpbmRleCApO1xuICAgICAgICAgICAgfSApO1xuXG4gICAgICAgICAgICBwYXJlbnRbIGtleSBdID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF1ZGlvSU8gbm9kZXMuLi5cbiAgICAgICAgZWxzZSBpZiggaXRlbSAmJiB0eXBlb2YgaXRlbS5jbGVhblVwID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgaWYoIHR5cGVvZiBpdGVtLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGl0ZW0uY2xlYW5VcCgpO1xuXG4gICAgICAgICAgICBpZiggcGFyZW50ICkge1xuICAgICAgICAgICAgICAgIHBhcmVudFsga2V5IF0gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gXCJOYXRpdmVcIiBub2Rlcy5cbiAgICAgICAgZWxzZSBpZiggaXRlbSAmJiB0eXBlb2YgaXRlbS5kaXNjb25uZWN0ID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgaXRlbS5kaXNjb25uZWN0KCk7XG5cbiAgICAgICAgICAgIGlmKCBwYXJlbnQgKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50WyBrZXkgXSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG4gICAgICAgIHRoaXMuX2NsZWFuVXBJbk91dHMoKTtcbiAgICAgICAgdGhpcy5fY2xlYW5JTygpO1xuXG4gICAgICAgIC8vIEZpbmQgYW55IG5vZGVzIGF0IHRoZSB0b3AgbGV2ZWwsXG4gICAgICAgIC8vIGRpc2Nvbm5lY3QgYW5kIG51bGxpZnkgdGhlbS5cbiAgICAgICAgZm9yKCB2YXIgaSBpbiB0aGlzICkge1xuICAgICAgICAgICAgdGhpcy5fY2xlYW5VcFNpbmdsZSggdGhpc1sgaSBdLCB0aGlzLCBpICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEbyB0aGUgc2FtZSBmb3IgYW55IG5vZGVzIGluIHRoZSBncmFwaC5cbiAgICAgICAgZm9yKCB2YXIgaSBpbiBncmFwaCApIHtcbiAgICAgICAgICAgIHRoaXMuX2NsZWFuVXBTaW5nbGUoIGdyYXBoWyBpIF0sIGdyYXBoLCBpICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyAuLi5hbmQgdGhlIHNhbWUgZm9yIGFueSBjb250cm9sIG5vZGVzLlxuICAgICAgICBmb3IoIHZhciBpIGluIHRoaXMuY29udHJvbHMgKSB7XG4gICAgICAgICAgICB0aGlzLl9jbGVhblVwU2luZ2xlKCB0aGlzLmNvbnRyb2xzWyBpIF0sIHRoaXMuY29udHJvbHMsIGkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZpbmFsbHksIGF0dGVtcHQgdG8gZGlzY29ubmVjdCB0aGlzIE5vZGUuXG4gICAgICAgIGlmKCB0eXBlb2YgdGhpcy5kaXNjb25uZWN0ID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBudW1iZXJPZklucHV0cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5wdXRzLmxlbmd0aDtcbiAgICB9XG4gICAgZ2V0IG51bWJlck9mT3V0cHV0cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3V0cHV0cy5sZW5ndGg7XG4gICAgfVxuXG4gICAgZ2V0IGlucHV0VmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlucHV0cy5sZW5ndGggPyB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgOiBudWxsO1xuICAgIH1cbiAgICBzZXQgaW5wdXRWYWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHRoaXMuaW5wdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXS5nYWluLnZhbHVlID0gdGhpcy5pbnZlcnRJbnB1dFBoYXNlID8gLXZhbHVlIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgb3V0cHV0VmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm91dHB1dHMubGVuZ3RoID8gdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA6IG51bGw7XG4gICAgfVxuICAgIHNldCBvdXRwdXRWYWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHRoaXMub3V0cHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0c1sgaSBdLmdhaW4udmFsdWUgPSB0aGlzLmludmVydE91dHB1dFBoYXNlID8gLXZhbHVlIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgaW52ZXJ0SW5wdXRQaGFzZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5wdXRzLmxlbmd0aCA/XG4gICAgICAgICAgICAoIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA8IDAgKSA6XG4gICAgICAgICAgICBudWxsO1xuICAgIH1cbiAgICBzZXQgaW52ZXJ0SW5wdXRQaGFzZSggaW52ZXJ0ZWQgKSB7XG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgaW5wdXQsIHY7IGkgPCB0aGlzLmlucHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIGlucHV0ID0gdGhpcy5pbnB1dHNbIGkgXS5nYWluO1xuICAgICAgICAgICAgdiA9IGlucHV0LnZhbHVlO1xuICAgICAgICAgICAgaW5wdXQudmFsdWUgPSB2IDwgMCA/ICggaW52ZXJ0ZWQgPyB2IDogLXYgKSA6ICggaW52ZXJ0ZWQgPyAtdiA6IHYgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBpbnZlcnRPdXRwdXRQaGFzZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3V0cHV0cy5sZW5ndGggP1xuICAgICAgICAgICAgKCB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlIDwgMCApIDpcbiAgICAgICAgICAgIG51bGw7XG4gICAgfVxuXG4gICAgLy8gVE9ETzpcbiAgICAvLyAgLSBzZXRWYWx1ZUF0VGltZT9cbiAgICBzZXQgaW52ZXJ0T3V0cHV0UGhhc2UoIGludmVydGVkICkge1xuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIHY7IGkgPCB0aGlzLm91dHB1dHMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB2ID0gdGhpcy5vdXRwdXRzWyBpIF0uZ2Fpbi52YWx1ZTtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0c1sgaSBdLmdhaW4udmFsdWUgPSB2IDwgMCA/ICggaW52ZXJ0ZWQgPyB2IDogLXYgKSA6ICggaW52ZXJ0ZWQgPyAtdiA6IHYgKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggTm9kZS5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIE5vZGUucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhblVwSW5PdXRzLCAnX2NsZWFuVXBJbk91dHMnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBOb2RlLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5JTywgJ19jbGVhbklPJyApO1xuQXVkaW9JTy5taXhpbiggTm9kZS5wcm90b3R5cGUsIGNvbm5lY3Rpb25zICk7XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTm9kZSA9IGZ1bmN0aW9uKCBudW1JbnB1dHMsIG51bU91dHB1dHMgKSB7XG4gICAgcmV0dXJuIG5ldyBOb2RlKCB0aGlzLCBudW1JbnB1dHMsIG51bU91dHB1dHMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IE5vZGU7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4vQXVkaW9JTy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBjb25uZWN0aW9ucyBmcm9tIFwiLi4vbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNlwiO1xuaW1wb3J0IGNsZWFuZXJzIGZyb20gXCIuLi9taXhpbnMvY2xlYW5lcnMuZXM2XCI7XG5cblxuY2xhc3MgUGFyYW0ge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUsIGRlZmF1bHRWYWx1ZSApIHtcbiAgICAgICAgdGhpcy5fc2V0SU8oIGlvICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHMgPSB0aGlzLm91dHB1dHMgPSBbIHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCkgXTtcbiAgICAgICAgdGhpcy5fY29udHJvbCA9IHRoaXMuaW5wdXRzWyAwIF07XG5cbiAgICAgICAgLy8gSG1tLi4uIEhhZCB0byBwdXQgdGhpcyBoZXJlIHNvIE5vdGUgd2lsbCBiZSBhYmxlXG4gICAgICAgIC8vIHRvIHJlYWQgdGhlIHZhbHVlLi4uXG4gICAgICAgIC8vIFRPRE86XG4gICAgICAgIC8vICAtIFNob3VsZCBJIGNyZWF0ZSBhIGAuX3ZhbHVlYCBwcm9wZXJ0eSB0aGF0IHdpbGxcbiAgICAgICAgLy8gICAgc3RvcmUgdGhlIHZhbHVlcyB0aGF0IHRoZSBQYXJhbSBzaG91bGQgYmUgcmVmbGVjdGluZ1xuICAgICAgICAvLyAgICAoZm9yZ2V0dGluZywgb2YgY291cnNlLCB0aGF0IGFsbCB0aGUgKlZhbHVlQXRUaW1lIFtldGMuXVxuICAgICAgICAvLyAgICBmdW5jdGlvbnMgYXJlIGZ1bmN0aW9ucyBvZiB0aW1lOyBgLl92YWx1ZWAgcHJvcCB3b3VsZCBiZVxuICAgICAgICAvLyAgICBzZXQgaW1tZWRpYXRlbHksIHdoaWxzdCB0aGUgcmVhbCB2YWx1ZSB3b3VsZCBiZSByYW1waW5nKVxuICAgICAgICAvL1xuICAgICAgICAvLyAgLSBPciwgc2hvdWxkIEkgY3JlYXRlIGEgYC5fdmFsdWVgIHByb3BlcnR5IHRoYXQgd2lsbFxuICAgICAgICAvLyAgICB0cnVlbHkgcmVmbGVjdCB0aGUgaW50ZXJuYWwgdmFsdWUgb2YgdGhlIEdhaW5Ob2RlPyBXaWxsXG4gICAgICAgIC8vICAgIHJlcXVpcmUgTUFGRlMuLi5cbiAgICAgICAgdGhpcy5fdmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInID8gdmFsdWUgOiAxLjA7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi52YWx1ZSA9IHRoaXMuX3ZhbHVlO1xuXG4gICAgICAgIHRoaXMuc2V0VmFsdWVBdFRpbWUoIHRoaXMuX3ZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICAgICAgdGhpcy5kZWZhdWx0VmFsdWUgPSB0eXBlb2YgZGVmYXVsdFZhbHVlID09PSAnbnVtYmVyJyA/IGRlZmF1bHRWYWx1ZSA6IHRoaXMuX2NvbnRyb2wuZ2Fpbi5kZWZhdWx0VmFsdWU7XG5cblxuICAgICAgICAvLyBUT0RPOlxuICAgICAgICAvLyAgLSBTaG91bGQgdGhlIGRyaXZlciBhbHdheXMgYmUgY29ubmVjdGVkP1xuICAgICAgICAvLyAgLSBOb3Qgc3VyZSB3aGV0aGVyIFBhcmFtIHNob3VsZCBvdXRwdXQgMCBpZiB2YWx1ZSAhPT0gTnVtYmVyLlxuICAgICAgICBpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmlvLmNvbnN0YW50RHJpdmVyLmNvbm5lY3QoIHRoaXMuX2NvbnRyb2wgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmRlZmF1bHRWYWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5fY2xlYW5VcEluT3V0cygpO1xuICAgICAgICB0aGlzLl9jbGVhbklPKCk7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fY29udHJvbCA9IG51bGw7XG4gICAgICAgIHRoaXMuZGVmYXVsdFZhbHVlID0gbnVsbDtcblxuICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICB9XG5cbiAgICBzZXRWYWx1ZUF0VGltZSggdmFsdWUsIHN0YXJ0VGltZSApIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgc3RhcnRUaW1lICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKCB2YWx1ZSwgZW5kVGltZSApIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKCB2YWx1ZSwgZW5kVGltZSApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBleHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKCB2YWx1ZSwgZW5kVGltZSApIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFRhcmdldEF0VGltZSggdmFsdWUsIHN0YXJ0VGltZSwgdGltZUNvbnN0YW50ICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4uc2V0VGFyZ2V0QXRUaW1lKCB2YWx1ZSwgc3RhcnRUaW1lLCB0aW1lQ29uc3RhbnQgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0VmFsdWVDdXJ2ZUF0VGltZSggdmFsdWVzLCBzdGFydFRpbWUsIGR1cmF0aW9uICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4uc2V0VmFsdWVDdXJ2ZUF0VGltZSggdmFsdWVzLCBzdGFydFRpbWUsIGR1cmF0aW9uICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNhbmNlbFNjaGVkdWxlZFZhbHVlcyggc3RhcnRUaW1lICkge1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4uY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCBzdGFydFRpbWUgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICAvLyByZXR1cm4gdGhpcy5fY29udHJvbC5nYWluLnZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG5cbiAgICBnZXQgY29udHJvbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRyb2wuZ2FpbjtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5taXhpblNpbmdsZSggUGFyYW0ucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBQYXJhbS5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuVXBJbk91dHMsICdfY2xlYW5VcEluT3V0cycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFBhcmFtLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5JTywgJ19jbGVhbklPJyApO1xuQXVkaW9JTy5taXhpbiggUGFyYW0ucHJvdG90eXBlLCBjb25uZWN0aW9ucyApO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVQYXJhbSA9IGZ1bmN0aW9uKCB2YWx1ZSwgZGVmYXVsdFZhbHVlICkge1xuICAgIHJldHVybiBuZXcgUGFyYW0oIHRoaXMsIHZhbHVlLCBkZWZhdWx0VmFsdWUgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFBhcmFtOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5pbXBvcnQgY29ubmVjdGlvbnMgZnJvbSBcIi4uL21peGlucy9jb25uZWN0aW9ucy5lczZcIjtcbmltcG9ydCBjbGVhbmVycyBmcm9tIFwiLi4vbWl4aW5zL2NsZWFuZXJzLmVzNlwiO1xuXG5jbGFzcyBXYXZlU2hhcGVyIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGN1cnZlT3JJdGVyYXRvciwgc2l6ZSApIHtcbiAgICAgICAgdGhpcy5fc2V0SU8oIGlvICk7XG5cbiAgICAgICAgdGhpcy5zaGFwZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlV2F2ZVNoYXBlcigpO1xuXG4gICAgICAgIC8vIElmIGEgRmxvYXQzMkFycmF5IGlzIHByb3ZpZGVkLCB1c2UgaXRcbiAgICAgICAgLy8gYXMgdGhlIGN1cnZlIHZhbHVlLlxuICAgICAgICBpZiAoIGN1cnZlT3JJdGVyYXRvciBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSApIHtcbiAgICAgICAgICAgIHRoaXMuc2hhcGVyLmN1cnZlID0gY3VydmVPckl0ZXJhdG9yO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYSBmdW5jdGlvbiBpcyBwcm92aWRlZCwgY3JlYXRlIGEgY3VydmVcbiAgICAgICAgLy8gdXNpbmcgdGhlIGZ1bmN0aW9uIGFzIGFuIGl0ZXJhdG9yLlxuICAgICAgICBlbHNlIGlmICggdHlwZW9mIGN1cnZlT3JJdGVyYXRvciA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgIHNpemUgPSB0eXBlb2Ygc2l6ZSA9PT0gJ251bWJlcicgJiYgc2l6ZSA+PSAyID8gc2l6ZSA6IENPTkZJRy5jdXJ2ZVJlc29sdXRpb247XG5cbiAgICAgICAgICAgIHZhciBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoIHNpemUgKSxcbiAgICAgICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgICAgICB4ID0gMDtcblxuICAgICAgICAgICAgZm9yICggaTsgaSA8IHNpemU7ICsraSApIHtcbiAgICAgICAgICAgICAgICB4ID0gKCBpIC8gc2l6ZSApICogMiAtIDE7XG4gICAgICAgICAgICAgICAgYXJyYXlbIGkgXSA9IGN1cnZlT3JJdGVyYXRvciggeCwgaSwgc2l6ZSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnNoYXBlci5jdXJ2ZSA9IGFycmF5O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT3RoZXJ3aXNlLCBkZWZhdWx0IHRvIGEgTGluZWFyIGN1cnZlLlxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2hhcGVyLmN1cnZlID0gdGhpcy5pby5jdXJ2ZXMuTGluZWFyO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbnB1dHMgPSB0aGlzLm91dHB1dHMgPSBbIHRoaXMuc2hhcGVyIF07XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5fY2xlYW5VcEluT3V0cygpO1xuICAgICAgICB0aGlzLl9jbGVhbklPKCk7XG4gICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLnNoYXBlciA9IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IGN1cnZlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zaGFwZXIuY3VydmU7XG4gICAgfVxuICAgIHNldCBjdXJ2ZSggY3VydmUgKSB7XG4gICAgICAgIGlmKCBjdXJ2ZSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSApIHtcbiAgICAgICAgICAgIHRoaXMuc2hhcGVyLmN1cnZlID0gY3VydmU7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFdhdmVTaGFwZXIucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBXYXZlU2hhcGVyLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5VcEluT3V0cywgJ19jbGVhblVwSW5PdXRzJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggV2F2ZVNoYXBlci5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuSU8sICdfY2xlYW5JTycgKTtcbkF1ZGlvSU8ubWl4aW4oIFdhdmVTaGFwZXIucHJvdG90eXBlLCBjb25uZWN0aW9ucyApO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVXYXZlU2hhcGVyID0gZnVuY3Rpb24oIGN1cnZlLCBzaXplICkge1xuICAgIHJldHVybiBuZXcgV2F2ZVNoYXBlciggdGhpcywgY3VydmUsIHNpemUgKTtcbn07IiwiZXhwb3J0IGRlZmF1bHQge1xuICAgIGN1cnZlUmVzb2x1dGlvbjogNDA5NiwgLy8gTXVzdCBiZSBhbiBldmVuIG51bWJlci5cbiAgICBkZWZhdWx0QnVmZmVyU2l6ZTogOCxcblxuICAgIC8vIFVzZWQgd2hlbiBjb252ZXJ0aW5nIG5vdGUgc3RyaW5ncyAoZWcuICdBIzQnKSB0byBNSURJIHZhbHVlcy5cbiAgICAvLyBJdCdzIHRoZSBvY3RhdmUgbnVtYmVyIG9mIHRoZSBsb3dlc3QgQyBub3RlIChNSURJIG5vdGUgMCkuXG4gICAgLy8gQ2hhbmdlIHRoaXMgaWYgeW91J3JlIHVzZWQgdG8gYSBEQVcgdGhhdCBkb2Vzbid0IHVzZSAtMiBhcyB0aGVcbiAgICAvLyBsb3dlc3Qgb2N0YXZlLlxuICAgIGxvd2VzdE9jdGF2ZTogLTIsXG5cbiAgICAvLyBMb3dlc3QgYWxsb3dlZCBudW1iZXIuIFVzZWQgYnkgc29tZSBNYXRoXG4gICAgLy8gZnVuY3Rpb25zLCBlc3BlY2lhbGx5IHdoZW4gY29udmVydGluZyBiZXR3ZWVuXG4gICAgLy8gbnVtYmVyIGZvcm1hdHMgKGllLiBoeiAtPiBNSURJLCBub3RlIC0+IE1JREksIGV0Yy4gKVxuICAgIC8vXG4gICAgLy8gQWxzbyB1c2VkIGluIGNhbGxzIHRvIEF1ZGlvUGFyYW0uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZVxuICAgIC8vIHNvIHRoZXJlJ3Mgbm8gcmFtcGluZyB0byAwICh3aGljaCB0aHJvd3MgYW4gZXJyb3IpLlxuICAgIGVwc2lsb246IDAuMDAxLFxuXG4gICAgbWlkaU5vdGVQb29sU2l6ZTogNTAwXG59OyIsIi8vIE5lZWQgdG8gb3ZlcnJpZGUgZXhpc3RpbmcgLmNvbm5lY3QgYW5kIC5kaXNjb25uZWN0XG4vLyBmdW5jdGlvbnMgZm9yIFwibmF0aXZlXCIgQXVkaW9QYXJhbXMgYW5kIEF1ZGlvTm9kZXMuLi5cbi8vIEkgZG9uJ3QgbGlrZSBkb2luZyB0aGlzLCBidXQgcydnb3R0YSBiZSBkb25lIDooXG4oIGZ1bmN0aW9uKCkge1xuICAgIHZhciBvcmlnaW5hbEF1ZGlvTm9kZUNvbm5lY3QgPSBBdWRpb05vZGUucHJvdG90eXBlLmNvbm5lY3QsXG4gICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlRGlzY29ubmVjdCA9IEF1ZGlvTm9kZS5wcm90b3R5cGUuZGlzY29ubmVjdCxcbiAgICAgICAgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cbiAgICBBdWRpb05vZGUucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiggbm9kZSwgb3V0cHV0Q2hhbm5lbCA9IDAsIGlucHV0Q2hhbm5lbCA9IDAgKSB7XG4gICAgICAgIGlmICggbm9kZS5pbnB1dHMgKSB7XG4gICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIG5vZGUuaW5wdXRzICkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0KCBub2RlLmlucHV0c1sgaW5wdXRDaGFubmVsIF0gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdCggbm9kZS5pbnB1dHNbIDAgXSwgb3V0cHV0Q2hhbm5lbCwgaW5wdXRDaGFubmVsICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvTm9kZSApIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlQ29ubmVjdC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb1BhcmFtICkge1xuICAgICAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVDb25uZWN0LmNhbGwoIHRoaXMsIG5vZGUsIG91dHB1dENoYW5uZWwgKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBBdWRpb05vZGUucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiggbm9kZSwgb3V0cHV0Q2hhbm5lbCA9IDAsIGlucHV0Q2hhbm5lbCA9IDAgKSB7XG4gICAgICAgIGlmICggbm9kZSAmJiBub2RlLmlucHV0cyApIHtcbiAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggbm9kZS5pbnB1dHMgKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0KCBub2RlLmlucHV0c1sgMCBdLCBvdXRwdXRDaGFubmVsLCBpbnB1dENoYW5uZWwgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9Ob2RlICkge1xuICAgICAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVEaXNjb25uZWN0LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZURpc2Nvbm5lY3QuY2FsbCggdGhpcywgbm9kZSwgb3V0cHV0Q2hhbm5lbCApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCBub2RlID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZURpc2Nvbm5lY3QuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIEF1ZGlvTm9kZS5wcm90b3R5cGUuY2hhaW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVzID0gc2xpY2UuY2FsbCggYXJndW1lbnRzICksXG4gICAgICAgICAgICBub2RlID0gdGhpcztcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgbm9kZS5jb25uZWN0LmNhbGwoIG5vZGUsIG5vZGVzWyBpIF0gKTtcbiAgICAgICAgICAgIG5vZGUgPSBub2Rlc1sgaSBdO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIEF1ZGlvTm9kZS5wcm90b3R5cGUuZmFuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub2RlcyA9IHNsaWNlLmNhbGwoIGFyZ3VtZW50cyApLFxuICAgICAgICAgICAgbm9kZSA9IHRoaXM7XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdC5jYWxsKCBub2RlLCBub2Rlc1sgaSBdICk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KCkgKTsiLCJpbXBvcnQgQ09ORklHIGZyb20gJy4vY29uZmlnLmVzNic7XG5pbXBvcnQgbWF0aCBmcm9tICcuLi9taXhpbnMvTWF0aC5lczYnO1xuXG5cbmxldCBzaWduYWxDdXJ2ZXMgPSB7fTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdDb25zdGFudCcsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IDEuMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0xpbmVhcicsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0VxdWFsUG93ZXInLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApLFxuICAgICAgICAgICAgc2luID0gTWF0aC5zaW4sXG4gICAgICAgICAgICBQSSA9IE1hdGguUEk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHNpbiggeCAqIDAuNSAqIFBJICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnQ3ViZWQnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApLFxuICAgICAgICAgICAgc2luID0gTWF0aC5zaW4sXG4gICAgICAgICAgICBQSSA9IE1hdGguUEksXG4gICAgICAgICAgICBwb3cgPSBNYXRoLnBvdztcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICB4ID0gcG93KCB4LCAzICk7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gc2luKCB4ICogMC41ICogUEkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnUmVjdGlmeScsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgaGFsZlJlc29sdXRpb24gPSByZXNvbHV0aW9uICogMC41LFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAtaGFsZlJlc29sdXRpb24sIHggPSAwOyBpIDwgaGFsZlJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgPiAwID8gaSA6IC1pICkgLyBoYWxmUmVzb2x1dGlvbjtcbiAgICAgICAgICAgIGN1cnZlWyBpICsgaGFsZlJlc29sdXRpb24gXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5cbi8vIE1hdGggY3VydmVzXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0dyZWF0ZXJUaGFuWmVybycsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHggPD0gMCA/IDAuMCA6IDEuMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0xlc3NUaGFuWmVybycsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHggPj0gMCA/IDAgOiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdFcXVhbFRvWmVybycsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHggPT09IDAgPyAxIDogMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnUmVjaXByb2NhbCcsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSA0MDk2ICogNjAwLCAvLyBIaWdoZXIgcmVzb2x1dGlvbiBuZWVkZWQgaGVyZS5cbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIC8vIGN1cnZlWyBpIF0gPSB4ID09PSAwID8gMSA6IDA7XG5cbiAgICAgICAgICAgIGlmICggeCAhPT0gMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gTWF0aC5wb3coIHgsIC0xICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdTaW5lJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKSxcbiAgICAgICAgICAgIHNpbiA9IE1hdGguc2luO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAoTWF0aC5QSSAqIDIpIC0gTWF0aC5QSTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBzaW4oIHggKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1JvdW5kJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24gKiA1MCxcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICggeCA+IDAgJiYgeCA8PSAwLjUwMDAxICkgfHxcbiAgICAgICAgICAgICAgICAoIHggPCAwICYmIHggPj0gLTAuNTAwMDEgKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgeCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICggeCA+IDAgKSB7XG4gICAgICAgICAgICAgICAgeCA9IDFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHggPSAtMTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1NpZ24nLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDIsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gTWF0aC5zaWduKCB4ICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0Zsb29yJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24gKiA1MCxcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcblxuICAgICAgICAgICAgaWYgKCB4ID49IDAuOTk5OSApIHtcbiAgICAgICAgICAgICAgICB4ID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCB4ID49IDAgKSB7XG4gICAgICAgICAgICAgICAgeCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICggeCA8IDAgKSB7XG4gICAgICAgICAgICAgICAgeCA9IC0xO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnR2F1c3NpYW5XaGl0ZU5vaXNlJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24gKiAyLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IG1hdGgubnJhbmQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1doaXRlTm9pc2UnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDIsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gTWF0aC5yYW5kb20oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1BpbmtOb2lzZScsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogMixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIG1hdGguZ2VuZXJhdGVQaW5rTnVtYmVyKCk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IG1hdGguZ2V0TmV4dFBpbmtOdW1iZXIoKSAqIDIgLSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IHNpZ25hbEN1cnZlczsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgQ3VzdG9tRW52ZWxvcGUgZnJvbSBcIi4vQ3VzdG9tRW52ZWxvcGUuZXM2XCI7XG5cbmNsYXNzIEFEQkRTUkVudmVsb3BlIGV4dGVuZHMgQ3VzdG9tRW52ZWxvcGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdGhpcy50aW1lcyA9IHtcbiAgICAgICAgICAgIGF0dGFjazogMC4wMSxcbiAgICAgICAgICAgIGRlY2F5MTogMC41LFxuICAgICAgICAgICAgZGVjYXkyOiAwLjUsXG4gICAgICAgICAgICByZWxlYXNlOiAwLjVcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxldmVscyA9IHtcbiAgICAgICAgICAgIGluaXRpYWw6IDAsXG4gICAgICAgICAgICBwZWFrOiAxLFxuICAgICAgICAgICAgYnJlYWs6IDAuNSxcbiAgICAgICAgICAgIHN1c3RhaW46IDEsXG4gICAgICAgICAgICByZWxlYXNlOiAwXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdpbml0aWFsJywgMCwgdGhpcy5sZXZlbHMuaW5pdGlhbCApO1xuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2F0dGFjaycsIHRoaXMudGltZXMuYXR0YWNrLCB0aGlzLmxldmVscy5wZWFrICk7XG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnZGVjYXkxJywgdGhpcy50aW1lcy5kZWNheTEsIHRoaXMubGV2ZWxzLmJyZWFrICk7XG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnZGVjYXkyJywgdGhpcy50aW1lcy5kZWNheTIsIHRoaXMubGV2ZWxzLnN1c3RhaW4gKTtcbiAgICAgICAgdGhpcy5hZGRFbmRTdGVwKCAncmVsZWFzZScsIHRoaXMudGltZXMucmVsZWFzZSwgdGhpcy5sZXZlbHMucmVsZWFzZSwgdHJ1ZSApO1xuICAgIH1cblxuICAgIGdldCBhdHRhY2tUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5hdHRhY2s7XG4gICAgfVxuICAgIHNldCBhdHRhY2tUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuYXR0YWNrID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdhdHRhY2snLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBkZWNheTFUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5kZWNheTE7XG4gICAgfVxuICAgIHNldCBkZWNheTFUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuZGVjYXkxID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdkZWNheTEnLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBkZWNheTJUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5kZWNheTI7XG4gICAgfVxuICAgIHNldCBkZWNheTJUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuZGVjYXkyID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdkZWNheTInLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCByZWxlYXNlVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZXMucmVsZWFzZTtcbiAgICB9XG4gICAgc2V0IHJlbGVhc2VUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMucmVsZWFzZSA9IHRpbWU7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBUaW1lKCAncmVsZWFzZScsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IGluaXRpYWxMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLmluaXRpYWw7XG4gICAgfVxuICAgIHNldCBpbml0aWFsTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5pbml0aWFsID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2luaXRpYWwnLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgcGVha0xldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMucGVhaztcbiAgICB9XG5cbiAgICBzZXQgcGVha0xldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMucGVhayA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdhdHRhY2snLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGJyZWFrTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5icmVhaztcbiAgICB9XG4gICAgc2V0IGJyZWFrTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5icmVhayA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdkZWNheTEnLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIGdldCBzdXN0YWluTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5zdXN0YWluO1xuICAgIH1cbiAgICBzZXQgc3VzdGFpbkxldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMuc3VzdGFpbiA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdkZWNheTInLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgcmVsZWFzZUxldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMucmVsZWFzZTtcbiAgICB9XG4gICAgc2V0IHJlbGVhc2VMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLnJlbGVhc2UgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAncmVsZWFzZScsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUFEQkRTUkVudmVsb3BlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBBREJEU1JFbnZlbG9wZSggdGhpcyApO1xufTtcblxuZXhwb3J0XG5kZWZhdWx0IEFEQkRTUkVudmVsb3BlOyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBDdXN0b21FbnZlbG9wZSBmcm9tIFwiLi9DdXN0b21FbnZlbG9wZS5lczZcIjtcblxuY2xhc3MgQURFbnZlbG9wZSBleHRlbmRzIEN1c3RvbUVudmVsb3BlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHRoaXMudGltZXMgPSB7XG4gICAgICAgICAgICBhdHRhY2s6IDAuMDEsXG4gICAgICAgICAgICBkZWNheTogMC41XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sZXZlbHMgPSB7XG4gICAgICAgICAgICBpbml0aWFsOiAwLFxuICAgICAgICAgICAgcGVhazogMVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnaW5pdGlhbCcsIDAsIHRoaXMubGV2ZWxzLmluaXRpYWwgKTtcbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdhdHRhY2snLCB0aGlzLnRpbWVzLmF0dGFjaywgdGhpcy5sZXZlbHMucGVhayApO1xuICAgICAgICB0aGlzLmFkZEVuZFN0ZXAoICdkZWNheScsIHRoaXMudGltZXMuZGVjYXksIHRoaXMubGV2ZWxzLnN1c3RhaW4sIHRydWUgKTtcbiAgICB9XG5cbiAgICBnZXQgYXR0YWNrVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZXMuYXR0YWNrO1xuICAgIH1cbiAgICBzZXQgYXR0YWNrVGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLmF0dGFjayA9IHRpbWU7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBUaW1lKCAnYXR0YWNrJywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgZGVjYXlUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5kZWNheTtcbiAgICB9XG4gICAgc2V0IGRlY2F5VGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLmRlY2F5ID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdkZWNheScsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBpbml0aWFsTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5pbml0aWFsO1xuICAgIH1cbiAgICBzZXQgaW5pdGlhbExldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMuaW5pdGlhbCA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdpbml0aWFsJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHBlYWtMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnBlYWs7XG4gICAgfVxuXG4gICAgc2V0IHBlYWtMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLnBlYWsgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnYXR0YWNrJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQURFbnZlbG9wZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgQURFbnZlbG9wZSggdGhpcyApO1xufTtcblxuZXhwb3J0XG5kZWZhdWx0IEFERW52ZWxvcGU7IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IEN1c3RvbUVudmVsb3BlIGZyb20gXCIuL0N1c3RvbUVudmVsb3BlLmVzNlwiO1xuXG5jbGFzcyBBRFNSRW52ZWxvcGUgZXh0ZW5kcyBDdXN0b21FbnZlbG9wZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB0aGlzLnRpbWVzID0ge1xuICAgICAgICAgICAgYXR0YWNrOiAwLjAxLFxuICAgICAgICAgICAgZGVjYXk6IDAuNSxcbiAgICAgICAgICAgIHJlbGVhc2U6IDAuNVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubGV2ZWxzID0ge1xuICAgICAgICAgICAgaW5pdGlhbDogMCxcbiAgICAgICAgICAgIHBlYWs6IDEsXG4gICAgICAgICAgICBzdXN0YWluOiAxLFxuICAgICAgICAgICAgcmVsZWFzZTogMFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnaW5pdGlhbCcsIDAsIHRoaXMubGV2ZWxzLmluaXRpYWwgKTtcbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdhdHRhY2snLCB0aGlzLnRpbWVzLmF0dGFjaywgdGhpcy5sZXZlbHMucGVhayApO1xuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2RlY2F5JywgdGhpcy50aW1lcy5kZWNheSwgdGhpcy5sZXZlbHMuc3VzdGFpbiApO1xuICAgICAgICB0aGlzLmFkZEVuZFN0ZXAoICdyZWxlYXNlJywgdGhpcy50aW1lcy5yZWxlYXNlLCB0aGlzLmxldmVscy5yZWxlYXNlLCB0cnVlICk7XG4gICAgfVxuXG4gICAgZ2V0IGF0dGFja1RpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLmF0dGFjaztcbiAgICB9XG4gICAgc2V0IGF0dGFja1RpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5hdHRhY2sgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ2F0dGFjaycsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IGRlY2F5VGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZXMuZGVjYXk7XG4gICAgfVxuICAgIHNldCBkZWNheVRpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5kZWNheSA9IHRpbWU7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBUaW1lKCAnZGVjYXknLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCByZWxlYXNlVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZXMucmVsZWFzZTtcbiAgICB9XG4gICAgc2V0IHJlbGVhc2VUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMucmVsZWFzZSA9IHRpbWU7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBUaW1lKCAncmVsZWFzZScsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IGluaXRpYWxMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLmluaXRpYWw7XG4gICAgfVxuICAgIHNldCBpbml0aWFsTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5pbml0aWFsID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2luaXRpYWwnLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgcGVha0xldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMucGVhaztcbiAgICB9XG5cbiAgICBzZXQgcGVha0xldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMucGVhayA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdhdHRhY2snLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgc3VzdGFpbkxldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMuc3VzdGFpbjtcbiAgICB9XG4gICAgc2V0IHN1c3RhaW5MZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLnN1c3RhaW4gPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnZGVjYXknLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgcmVsZWFzZUxldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMucmVsZWFzZTtcbiAgICB9XG4gICAgc2V0IHJlbGVhc2VMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLnJlbGVhc2UgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAncmVsZWFzZScsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUFEU1JFbnZlbG9wZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgQURTUkVudmVsb3BlKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBBRFNSRW52ZWxvcGU7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBDT05GSUcgZnJvbSBcIi4uL2NvcmUvY29uZmlnLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuXG5jbGFzcyBDdXN0b21FbnZlbG9wZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLm9yZGVycyA9IHtcbiAgICAgICAgICAgIHN0YXJ0OiBbXSxcbiAgICAgICAgICAgIHN0b3A6IFtdXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zdGVwcyA9IHtcbiAgICAgICAgICAgIHN0YXJ0OiB7fSxcbiAgICAgICAgICAgIHN0b3A6IHt9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgX2FkZFN0ZXAoIHNlY3Rpb24sIG5hbWUsIHRpbWUsIGxldmVsLCBpc0V4cG9uZW50aWFsID0gZmFsc2UgKSB7XG4gICAgICAgIGxldCBzdG9wcyA9IHRoaXMuc3RlcHNbIHNlY3Rpb24gXTtcblxuICAgICAgICBpZiAoIHN0b3BzWyBuYW1lIF0gKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdTdG9wIHdpdGggbmFtZSBcIicgKyBuYW1lICsgJ1wiIGFscmVhZHkgZXhpc3RzLicgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub3JkZXJzWyBzZWN0aW9uIF0ucHVzaCggbmFtZSApO1xuXG4gICAgICAgIHRoaXMuc3RlcHNbIHNlY3Rpb24gXVsgbmFtZSBdID0ge1xuICAgICAgICAgICAgdGltZTogdGltZSxcbiAgICAgICAgICAgIGxldmVsOiBsZXZlbCxcbiAgICAgICAgICAgIGlzRXhwb25lbnRpYWw6IGlzRXhwb25lbnRpYWxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhZGRTdGFydFN0ZXAoIG5hbWUsIHRpbWUsIGxldmVsLCBpc0V4cG9uZW50aWFsID0gZmFsc2UgKSB7XG4gICAgICAgIHRoaXMuX2FkZFN0ZXAoICdzdGFydCcsIG5hbWUsIHRpbWUsIGxldmVsLCBpc0V4cG9uZW50aWFsICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGFkZEVuZFN0ZXAoIG5hbWUsIHRpbWUsIGxldmVsLCBpc0V4cG9uZW50aWFsID0gZmFsc2UgKSB7XG4gICAgICAgIHRoaXMuX2FkZFN0ZXAoICdzdG9wJywgbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0U3RlcExldmVsKCBuYW1lLCBsZXZlbCApIHtcbiAgICAgICAgbGV0IHN0YXJ0SW5kZXggPSB0aGlzLm9yZGVycy5zdGFydC5pbmRleE9mKCBuYW1lICksXG4gICAgICAgICAgICBlbmRJbmRleCA9IHRoaXMub3JkZXJzLnN0b3AuaW5kZXhPZiggbmFtZSApO1xuXG4gICAgICAgIGlmICggc3RhcnRJbmRleCA9PT0gLTEgJiYgZW5kSW5kZXggPT09IC0xICkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCAnTm8gc3RlcCB3aXRoIG5hbWUgXCInICsgbmFtZSArICdcIi4gTm8gbGV2ZWwgc2V0LicgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc3RhcnRJbmRleCAhPT0gLTEgKSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnN0YXJ0WyBuYW1lIF0ubGV2ZWwgPSBwYXJzZUZsb2F0KCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdGVwcy5zdG9wWyBuYW1lIF0ubGV2ZWwgPSBwYXJzZUZsb2F0KCBsZXZlbCApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG5cbiAgICBzZXRTdGVwVGltZSggbmFtZSwgdGltZSApIHtcbiAgICAgICAgdmFyIHN0YXJ0SW5kZXggPSB0aGlzLm9yZGVycy5zdGFydC5pbmRleE9mKCBuYW1lICksXG4gICAgICAgICAgICBlbmRJbmRleCA9IHRoaXMub3JkZXJzLnN0b3AuaW5kZXhPZiggbmFtZSApO1xuXG4gICAgICAgIGlmICggc3RhcnRJbmRleCA9PT0gLTEgJiYgZW5kSW5kZXggPT09IC0xICkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCAnTm8gc3RlcCB3aXRoIG5hbWUgXCInICsgbmFtZSArICdcIi4gTm8gdGltZSBzZXQuJyApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzdGFydEluZGV4ICE9PSAtMSApIHtcbiAgICAgICAgICAgIHRoaXMuc3RlcHMuc3RhcnRbIG5hbWUgXS50aW1lID0gcGFyc2VGbG9hdCggdGltZSApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdGVwcy5zdG9wWyBuYW1lIF0udGltZSA9IHBhcnNlRmxvYXQoIHRpbWUgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG5cbiAgICBfdHJpZ2dlclN0ZXAoIHBhcmFtLCBzdGVwLCBzdGFydFRpbWUgKSB7XG4gICAgICAgIC8vIGlmICggc3RlcC5pc0V4cG9uZW50aWFsID09PSB0cnVlICkge1xuICAgICAgICAgICAgLy8gVGhlcmUncyBzb21ldGhpbmcgYW1pc3MgaGVyZSFcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCBNYXRoLm1heCggc3RlcC5sZXZlbCwgQ09ORklHLmVwc2lsb24gKSwgc3RhcnRUaW1lICsgc3RlcC50aW1lICk7XG4gICAgICAgICAgICAvLyBwYXJhbS5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKCBNYXRoLm1heCggc3RlcC5sZXZlbCwgMC4wMSApLCBzdGFydFRpbWUgKyBzdGVwLnRpbWUgKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBlbHNlIHtcbiAgICAgICAgICAgIHBhcmFtLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKCBzdGVwLmxldmVsLCBzdGFydFRpbWUgKyBzdGVwLnRpbWUgKTtcbiAgICAgICAgLy8gfVxuICAgIH1cblxuICAgIF9zdGFydFNlY3Rpb24oIHNlY3Rpb24sIHBhcmFtLCBzdGFydFRpbWUsIGNhbmNlbFNjaGVkdWxlZFZhbHVlcyApIHtcbiAgICAgICAgdmFyIHN0b3BPcmRlciA9IHRoaXMub3JkZXJzWyBzZWN0aW9uIF0sXG4gICAgICAgICAgICBzdGVwcyA9IHRoaXMuc3RlcHNbIHNlY3Rpb24gXSxcbiAgICAgICAgICAgIG51bVN0b3BzID0gc3RvcE9yZGVyLmxlbmd0aCxcbiAgICAgICAgICAgIHN0ZXA7XG5cbiAgICAgICAgcGFyYW0uY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCBzdGFydFRpbWUgKTtcbiAgICAgICAgLy8gcGFyYW0uc2V0VmFsdWVBdFRpbWUoIDAsIHN0YXJ0VGltZSApO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG51bVN0b3BzOyArK2kgKSB7XG4gICAgICAgICAgICBzdGVwID0gc3RlcHNbIHN0b3BPcmRlclsgaSBdIF07XG4gICAgICAgICAgICB0aGlzLl90cmlnZ2VyU3RlcCggcGFyYW0sIHN0ZXAsIHN0YXJ0VGltZSApO1xuICAgICAgICAgICAgc3RhcnRUaW1lICs9IHN0ZXAudGltZTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgc3RhcnQoIHBhcmFtLCBkZWxheSA9IDAgKSB7XG4gICAgICAgIGlmICggcGFyYW0gaW5zdGFuY2VvZiBBdWRpb1BhcmFtID09PSBmYWxzZSAmJiBwYXJhbSBpbnN0YW5jZW9mIFBhcmFtID09PSBmYWxzZSApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ0NhbiBvbmx5IHN0YXJ0IGFuIGVudmVsb3BlIG9uIEF1ZGlvUGFyYW0gb3IgUGFyYW0gaW5zdGFuY2VzLicgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3N0YXJ0U2VjdGlvbiggJ3N0YXJ0JywgcGFyYW0sIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgc3RvcCggcGFyYW0sIGRlbGF5ID0gMCApIHtcbiAgICAgICAgdGhpcy5fc3RhcnRTZWN0aW9uKCAnc3RvcCcsIHBhcmFtLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyAwLjEgKyBkZWxheSApO1xuICAgIH1cblxuICAgIGZvcmNlU3RvcCggcGFyYW0sIGRlbGF5ID0gMCApIHtcbiAgICAgICAgcGFyYW0uY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyBkZWxheSApO1xuICAgICAgICAvLyBwYXJhbS5zZXRWYWx1ZUF0VGltZSggcGFyYW0udmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIGRlbGF5ICk7XG4gICAgICAgIHBhcmFtLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKCAwLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyAwLjAwMSApO1xuICAgIH1cblxuICAgIGdldCB0b3RhbFN0YXJ0VGltZSgpIHtcbiAgICAgICAgdmFyIHN0YXJ0cyA9IHRoaXMuc3RlcHMuc3RhcnQsXG4gICAgICAgICAgICB0aW1lID0gMC4wO1xuXG4gICAgICAgIGZvciAoIHZhciBpIGluIHN0YXJ0cyApIHtcbiAgICAgICAgICAgIHRpbWUgKz0gc3RhcnRzWyBpIF0udGltZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aW1lO1xuICAgIH1cblxuICAgIGdldCB0b3RhbFN0b3BUaW1lKCkge1xuICAgICAgICB2YXIgc3RvcHMgPSB0aGlzLnN0ZXBzLnN0b3AsXG4gICAgICAgICAgICB0aW1lID0gMC4wO1xuXG4gICAgICAgIGZvciAoIHZhciBpIGluIHN0b3BzICkge1xuICAgICAgICAgICAgdGltZSArPSBzdG9wc1sgaSBdLnRpbWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGltZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIEN1c3RvbUVudmVsb3BlLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDdXN0b21FbnZlbG9wZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgQ3VzdG9tRW52ZWxvcGUoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEN1c3RvbUVudmVsb3BlOyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qXG4gICAgVGhpcyBOb2RlIGlzIGFuIGltcGxlbWVudGF0aW9uIG9mIG9uZSBvZiBTY2hyb2VkZXInc1xuICAgIEFsbFBhc3MgZ3JhcGhzLiBUaGlzIHBhcnRpY3VsYXIgZ3JhcGggaXMgc2hvd24gaW4gRmlndXJlMlxuICAgIGluIHRoZSBmb2xsb3dpbmcgcGFwZXI6XG5cbiAgICAgICAgTS4gUi4gU2Nocm9lZGVyIC0gTmF0dXJhbCBTb3VuZGluZyBBcnRpZmljaWFsIFJldmVyYmVyYXRpb25cblxuICAgICAgICBKb3VybmFsIG9mIHRoZSBBdWRpbyBFbmdpbmVlcmluZyBTb2NpZXR5LCBKdWx5IDE5NjIuXG4gICAgICAgIFZvbHVtZSAxMCwgTnVtYmVyIDMuXG5cblxuICAgIEl0J3MgYXZhaWxhYmxlIGhlcmU6XG4gICAgICAgIGh0dHA6Ly93d3cuZWNlLnJvY2hlc3Rlci5lZHUvfnpkdWFuL3RlYWNoaW5nL2VjZTQ3Mi9yZWFkaW5nL1NjaHJvZWRlcl8xOTYyLnBkZlxuXG5cbiAgICBUaGVyZSBhcmUgdGhyZWUgbWFpbiBwYXRocyBhbiBpbnB1dCBzaWduYWwgY2FuIHRha2U6XG5cbiAgICBpbiAtPiAtZ2FpbiAtPiBzdW0xIC0+IG91dFxuICAgIGluIC0+IHN1bTIgLT4gZGVsYXkgLT4gZ2FpbiAtPiBzdW0yXG4gICAgaW4gLT4gc3VtMiAtPiBkZWxheSAtPiBnYWluICgxLWdeMikgLT4gc3VtMVxuXG4gICAgRm9yIG5vdywgdGhlIHN1bW1pbmcgbm9kZXMgYXJlIGEgcGFydCBvZiB0aGUgZm9sbG93aW5nIGNsYXNzLFxuICAgIGJ1dCBjYW4gZWFzaWx5IGJlIHJlbW92ZWQgYnkgY29ubmVjdGluZyBgLWdhaW5gLCBgZ2FpbmAsIGFuZCBgMS1nYWluXjJgXG4gICAgdG8gYHRoaXMub3V0cHV0c1swXWAgYW5kIGAtZ2FpbmAgYW5kIGBpbmAgdG8gdGhlIGRlbGF5IGRpcmVjdGx5LlxuICovXG5cbi8vIFRPRE86XG4vLyAgLSBSZW1vdmUgdW5uZWNlc3Nhcnkgc3VtbWluZyBub2Rlcy5cbmNsYXNzIFNjaHJvZWRlckFsbFBhc3MgZXh0ZW5kcyBOb2RlIHtcblxuICAgIGNvbnN0cnVjdG9yKCBpbywgZGVsYXlUaW1lLCBmZWVkYmFjayApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnN1bTEgPSBpby5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguc3VtMiA9IGlvLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5wb3NpdGl2ZUdhaW4gPSBpby5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVHYWluID0gaW8uY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm5lZ2F0ZSA9IGlvLmNyZWF0ZU5lZ2F0ZSgpO1xuICAgICAgICBncmFwaC5kZWxheSA9IGlvLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgZ3JhcGgub25lTWludXNHYWluU3F1YXJlZCA9IGlvLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5taW51c09uZSA9IGlvLmNyZWF0ZVN1YnRyYWN0KCAxICk7XG4gICAgICAgIGdyYXBoLmdhaW5TcXVhcmVkID0gaW8uY3JlYXRlU3F1YXJlKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjayA9IGlvLmNyZWF0ZVBhcmFtKCBmZWVkYmFjayApLFxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRlbGF5VGltZSA9IGlvLmNyZWF0ZVBhcmFtKCBkZWxheVRpbWUgKTtcblxuICAgICAgICAvLyBaZXJvIG91dCBjb250cm9sbGVkIHBhcmFtcy5cbiAgICAgICAgZ3JhcGgucG9zaXRpdmVHYWluLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZUdhaW4uZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLm9uZU1pbnVzR2FpblNxdWFyZWQuZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBnYWluIGNvbnRyb2xzXG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2suY29ubmVjdCggZ3JhcGgucG9zaXRpdmVHYWluLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5uZWdhdGUgKTtcbiAgICAgICAgZ3JhcGgubmVnYXRlLmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlR2Fpbi5nYWluICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2suY29ubmVjdCggZ3JhcGguZ2FpblNxdWFyZWQgKTtcbiAgICAgICAgZ3JhcGguZ2FpblNxdWFyZWQuY29ubmVjdCggZ3JhcGgubWludXNPbmUgKTtcbiAgICAgICAgZ3JhcGgubWludXNPbmUuY29ubmVjdCggZ3JhcGgub25lTWludXNHYWluU3F1YXJlZC5nYWluICk7XG5cbiAgICAgICAgLy8gY29ubmVjdCBkZWxheSB0aW1lIGNvbnRyb2xcbiAgICAgICAgdGhpcy5jb250cm9scy5kZWxheVRpbWUuY29ubmVjdCggZ3JhcGguZGVsYXkuZGVsYXlUaW1lICk7XG5cbiAgICAgICAgLy8gRmlyc3Qgc2lnbmFsIHBhdGg6XG4gICAgICAgIC8vIGluIC0+IC1nYWluIC0+IGdyYXBoLnN1bTEgLT4gb3V0XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubmVnYXRpdmVHYWluICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlR2Fpbi5jb25uZWN0KCBncmFwaC5zdW0xICk7XG4gICAgICAgIGdyYXBoLnN1bTEuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTZWNvbmQgc2lnbmFsIHBhdGg6XG4gICAgICAgIC8vIChpbiAtPiBncmFwaC5zdW0yIC0+KSBkZWxheSAtPiBnYWluIC0+IGdyYXBoLnN1bTJcbiAgICAgICAgZ3JhcGguZGVsYXkuY29ubmVjdCggZ3JhcGgucG9zaXRpdmVHYWluICk7XG4gICAgICAgIGdyYXBoLnBvc2l0aXZlR2Fpbi5jb25uZWN0KCBncmFwaC5zdW0yICk7XG5cbiAgICAgICAgLy8gVGhpcmQgc2lnbmFsIHBhdGg6XG4gICAgICAgIC8vIGluIC0+IGdyYXBoLnN1bTIgLT4gZGVsYXkgLT4gZ2FpbiAoMS1nXjIpIC0+IGdyYXBoLnN1bTFcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zdW0yICk7XG4gICAgICAgIGdyYXBoLnN1bTIuY29ubmVjdCggZ3JhcGguZGVsYXkgKTtcbiAgICAgICAgZ3JhcGguZGVsYXkuY29ubmVjdCggZ3JhcGgub25lTWludXNHYWluU3F1YXJlZCApO1xuICAgICAgICBncmFwaC5vbmVNaW51c0dhaW5TcXVhcmVkLmNvbm5lY3QoIGdyYXBoLnN1bTEgKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2Nocm9lZGVyQWxsUGFzcyA9IGZ1bmN0aW9uKCBkZWxheVRpbWUsIGZlZWRiYWNrICkge1xuICAgIHJldHVybiBuZXcgU2Nocm9lZGVyQWxsUGFzcyggdGhpcywgZGVsYXlUaW1lLCBmZWVkYmFjayApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IERyeVdldE5vZGUgZnJvbSBcIi4uLy4uL2dyYXBocy9EcnlXZXROb2RlLmVzNlwiO1xuXG4vLyBUT0RPOiBBZGQgZmVlZGJhY2tMZXZlbCBhbmQgZGVsYXlUaW1lIFBhcmFtIGluc3RhbmNlc1xuLy8gdG8gY29udHJvbCB0aGlzIG5vZGUuXG5jbGFzcyBEZWxheSBleHRlbmRzIERyeVdldE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgY29udHJvbCBub2Rlcy5cbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjayA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBmZWVkYmFjayBhbmQgZGVsYXkgbm9kZXNcbiAgICAgICAgZ3JhcGguZmVlZGJhY2sgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuXG4gICAgICAgIC8vIFNldHVwIHRoZSBmZWVkYmFjayBsb29wXG4gICAgICAgIGdyYXBoLmRlbGF5LmNvbm5lY3QoIGdyYXBoLmZlZWRiYWNrICk7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrLmNvbm5lY3QoIGdyYXBoLmRlbGF5ICk7XG5cbiAgICAgICAgLy8gQWxzbyBjb25uZWN0IHRoZSBkZWxheSB0byB0aGUgd2V0IG91dHB1dC5cbiAgICAgICAgZ3JhcGguZGVsYXkuY29ubmVjdCggdGhpcy53ZXQgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGlucHV0IHRvIGRlbGF5XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZGVsYXkgKTtcblxuICAgICAgICBncmFwaC5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5mZWVkYmFjay5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnRpbWUuY29ubmVjdCggZ3JhcGguZGVsYXkuZGVsYXlUaW1lICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2suY29ubmVjdCggZ3JhcGguZmVlZGJhY2suZ2FpbiApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEZWxheSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRGVsYXkoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IERlbGF5OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgRHJ5V2V0Tm9kZSBmcm9tIFwiLi4vLi4vZ3JhcGhzL0RyeVdldE5vZGUuZXM2XCI7XG5cbi8vIFRPRE86XG4vLyAgLSBDb252ZXJ0IHRoaXMgbm9kZSB0byB1c2UgUGFyYW0gY29udHJvbHNcbi8vICAgIGZvciB0aW1lIGFuZCBmZWVkYmFjay5cblxuY2xhc3MgUGluZ1BvbmdEZWxheSBleHRlbmRzIERyeVdldE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBjaGFubmVsIHNwbGl0dGVyIGFuZCBtZXJnZXJcbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKCAyICk7XG4gICAgICAgIGdyYXBoLm1lcmdlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsTWVyZ2VyKCAyICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGZlZWRiYWNrIGFuZCBkZWxheSBub2Rlc1xuICAgICAgICBncmFwaC5mZWVkYmFja0wgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5mZWVkYmFja1IgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5kZWxheUwgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgZ3JhcGguZGVsYXlSID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG5cbiAgICAgICAgLy8gU2V0dXAgdGhlIGZlZWRiYWNrIGxvb3BcbiAgICAgICAgZ3JhcGguZGVsYXlMLmNvbm5lY3QoIGdyYXBoLmZlZWRiYWNrTCApO1xuICAgICAgICBncmFwaC5mZWVkYmFja0wuY29ubmVjdCggZ3JhcGguZGVsYXlSICk7XG4gICAgICAgIGdyYXBoLmRlbGF5Ui5jb25uZWN0KCBncmFwaC5mZWVkYmFja1IgKTtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2tSLmNvbm5lY3QoIGdyYXBoLmRlbGF5TCApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zcGxpdHRlciApO1xuICAgICAgICBncmFwaC5zcGxpdHRlci5jb25uZWN0KCBncmFwaC5kZWxheUwsIDAgKTtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2tMLmNvbm5lY3QoIGdyYXBoLm1lcmdlciwgMCwgMCApO1xuICAgICAgICBncmFwaC5mZWVkYmFja1IuY29ubmVjdCggZ3JhcGgubWVyZ2VyLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLm1lcmdlci5jb25uZWN0KCB0aGlzLndldCApO1xuXG4gICAgICAgIGdyYXBoLmRlbGF5TC5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5kZWxheVIuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2tMLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5mZWVkYmFja1IuZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudGltZS5jb25uZWN0KCBncmFwaC5kZWxheUwuZGVsYXlUaW1lICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudGltZS5jb25uZWN0KCBncmFwaC5kZWxheVIuZGVsYXlUaW1lICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2suY29ubmVjdCggZ3JhcGguZmVlZGJhY2tMLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5mZWVkYmFja1IuZ2FpbiApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVQaW5nUG9uZ0RlbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQaW5nUG9uZ0RlbGF5KCB0aGlzICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgRHJ5V2V0Tm9kZSBmcm9tIFwiLi4vLi4vZ3JhcGhzL0RyeVdldE5vZGUuZXM2XCI7XG5cblxuY2xhc3MgU3RlcmVvRGVsYXkgZXh0ZW5kcyBEcnlXZXROb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbnRyb2wgbm9kZXMuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2sgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudGltZUwgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudGltZVIgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIgPSB0aGlzLmlvLmNyZWF0ZVNwbGl0dGVyKCAyICk7XG4gICAgICAgIGdyYXBoLmRlbGF5TCA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICBncmFwaC5kZWxheVIgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2tMID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2tSID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgubWVyZ2VyID0gdGhpcy5pby5jcmVhdGVNZXJnZXIoIDIgKTtcblxuICAgICAgICBncmFwaC5kZWxheUwuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGguZGVsYXlSLmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrTC5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2tSLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIGdyYXBoLmRlbGF5TC5jb25uZWN0KCBncmFwaC5mZWVkYmFja0wgKTtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2tMLmNvbm5lY3QoIGdyYXBoLmRlbGF5TCApO1xuICAgICAgICBncmFwaC5kZWxheVIuY29ubmVjdCggZ3JhcGguZmVlZGJhY2tSICk7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrUi5jb25uZWN0KCBncmFwaC5kZWxheVIgKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrLmNvbm5lY3QoIGdyYXBoLmZlZWRiYWNrTC5nYWluICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2suY29ubmVjdCggZ3JhcGguZmVlZGJhY2tSLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lTC5jb25uZWN0KCBncmFwaC5kZWxheUwuZGVsYXlUaW1lICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudGltZVIuY29ubmVjdCggZ3JhcGguZGVsYXlSLmRlbGF5VGltZSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc3BsaXR0ZXIgKTtcbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIuY29ubmVjdCggZ3JhcGguZGVsYXlMLCAwICk7XG4gICAgICAgIGdyYXBoLnNwbGl0dGVyLmNvbm5lY3QoIGdyYXBoLmRlbGF5UiwgMSApO1xuICAgICAgICBncmFwaC5kZWxheUwuY29ubmVjdCggZ3JhcGgubWVyZ2VyLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmRlbGF5Ui5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGgubWVyZ2VyLmNvbm5lY3QoIHRoaXMud2V0ICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVN0ZXJlb0RlbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBTdGVyZW9EZWxheSggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU3RlcmVvRGVsYXk7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbnZhciBGSUxURVJfU1RPUkUgPSBuZXcgV2Vha01hcCgpO1xuXG5mdW5jdGlvbiBjcmVhdGVGaWx0ZXIoIGlvLCB0eXBlICkge1xuICAgIHZhciBncmFwaCA9IHtcbiAgICAgICAgZmlsdGVyOiBpby5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpLFxuICAgICAgICBjb250cm9sczoge30sXG4gICAgICAgIHR5cGU6IHVuZGVmaW5lZFxuICAgIH07XG5cbiAgICBncmFwaC5maWx0ZXIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICBncmFwaC5maWx0ZXIuUS52YWx1ZSA9IDA7XG5cbiAgICBncmFwaC5jb250cm9scy5mcmVxdWVuY3kgPSBpby5jcmVhdGVQYXJhbSgpO1xuICAgIGdyYXBoLmNvbnRyb2xzLlEgPSBpby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgZ3JhcGguY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmZpbHRlci5mcmVxdWVuY3kgKTtcbiAgICBncmFwaC5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmZpbHRlci5RICk7XG5cbiAgICBncmFwaC5zZXRUeXBlID0gZnVuY3Rpb24oIHR5cGUgKSB7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG5cbiAgICAgICAgc3dpdGNoICggdHlwZSApIHtcbiAgICAgICAgICAgIGNhc2UgJ0xQMTInOlxuICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyLnR5cGUgPSAnbG93cGFzcyc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ25vdGNoJzpcbiAgICAgICAgICAgICAgICB0aGlzLmZpbHRlci50eXBlID0gJ25vdGNoJztcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnSFAxMic6XG4gICAgICAgICAgICAgICAgdGhpcy5maWx0ZXIudHlwZSA9ICdoaWdocGFzcyc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAvLyBGYWxsIHRocm91Z2ggdG8gaGFuZGxlIHRob3NlIGZpbHRlclxuICAgICAgICAgICAgICAgIC8vIHR5cGVzIHdpdGggYGdhaW5gIEF1ZGlvUGFyYW1zLlxuICAgICAgICAgICAgY2FzZSAnbG93c2hlbGYnOlxuICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyLnR5cGUgPSAnbG93c2hlbGYnO1xuICAgICAgICAgICAgY2FzZSAnaGlnaHNoZWxmJzpcbiAgICAgICAgICAgICAgICB0aGlzLmZpbHRlci50eXBlID0gJ2hpZ2hzaGVsZic7XG4gICAgICAgICAgICBjYXNlICdwZWFraW5nJzpcbiAgICAgICAgICAgICAgICB0aGlzLmZpbHRlci50eXBlID0gJ3BlYWtpbmcnO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udHJvbHMuZ2FpbiA9IGlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ3JhcGguc2V0VHlwZSggdHlwZSApO1xuXG4gICAgcmV0dXJuIGdyYXBoO1xufVxuXG5jbGFzcyBDdXN0b21FUSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGx5LCB0aGlzIE5vZGUgaXMganVzdCBhIHBhc3MtdGhyb3VnaFxuICAgICAgICAvLyB1bnRpbCBmaWx0ZXJzIGFyZSBhZGRlZC5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIGFkZEZpbHRlciggdHlwZSApIHtcbiAgICAgICAgdmFyIGZpbHRlckdyYXBoID0gY3JlYXRlRmlsdGVyKCB0aGlzLmlvLCB0eXBlICksXG4gICAgICAgICAgICBmaWx0ZXJzID0gRklMVEVSX1NUT1JFLmdldCggdGhpcyApIHx8IFtdO1xuXG4gICAgICAgIC8vIElmIHRoaXMgaXMgdGhlIGZpcnN0IGZpbHRlciBiZWluZyBhZGRlZCxcbiAgICAgICAgLy8gbWFrZSBzdXJlIGlucHV0IGlzIGNvbm5lY3RlZCBhbmQgZmlsdGVyXG4gICAgICAgIC8vIGlzIHRoZW4gY29ubmVjdGVkIHRvIG91dHB1dC5cbiAgICAgICAgaWYgKCBmaWx0ZXJzLmxlbmd0aCA9PT0gMCApIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZGlzY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZmlsdGVyR3JhcGguZmlsdGVyICk7XG4gICAgICAgICAgICBmaWx0ZXJHcmFwaC5maWx0ZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZXJlIGFyZSBhbHJlYWR5IGZpbHRlcnMsIHRoZSBsYXN0IGZpbHRlclxuICAgICAgICAvLyBpbiB0aGUgZ3JhcGggd2lsbCBuZWVkIHRvIGJlIGRpc2Nvbm5lY3RlZCBmb3JtXG4gICAgICAgIC8vIHRoZSBvdXRwdXQgYmVmb3JlIHRoZSBuZXcgZmlsdGVyIGlzIGNvbm5lY3RlZC5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmaWx0ZXJzWyBmaWx0ZXJzLmxlbmd0aCAtIDEgXS5maWx0ZXIuZGlzY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgICAgIGZpbHRlcnNbIGZpbHRlcnMubGVuZ3RoIC0gMSBdLmZpbHRlci5jb25uZWN0KCBmaWx0ZXJHcmFwaC5maWx0ZXIgKTtcbiAgICAgICAgICAgIGZpbHRlckdyYXBoLmZpbHRlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RvcmUgdGhlIGZpbHRlciBhbmQgc2F2ZSB0aGUgbmV3IGZpbHRlcnMgb2JqZWN0XG4gICAgICAgIC8vIChpdCBuZWVkcyB0byBiZSBzYXZlZCBpbiBjYXNlIHRoaXMgaXMgdGhlIGZpcnN0XG4gICAgICAgIC8vIGZpbHRlciBiZWluZyBhZGRlZCwgYW5kIHZlcnkgbGl0dGxlIG92ZXJoZWFkIHRvXG4gICAgICAgIC8vIGNhbGxpbmcgYHNldGAgaWYgaXQncyBub3QgdGhlIGZpcnN0IGZpbHRlciBiZWluZ1xuICAgICAgICAvLyBhZGRlZCkuXG4gICAgICAgIGZpbHRlcnMucHVzaCggZmlsdGVyR3JhcGggKTtcbiAgICAgICAgRklMVEVSX1NUT1JFLnNldCggdGhpcywgZmlsdGVycyApO1xuXG4gICAgICAgIHJldHVybiBmaWx0ZXJHcmFwaDtcbiAgICB9XG5cbiAgICBnZXRGaWx0ZXIoIGluZGV4ICkge1xuICAgICAgICByZXR1cm4gRklMVEVSX1NUT1JFLmdldCggdGhpcyApWyBpbmRleCBdO1xuICAgIH1cblxuICAgIGdldEFsbEZpbHRlcnMoKSB7XG4gICAgICAgIHJldHVybiBGSUxURVJfU1RPUkUuZ2V0KCB0aGlzICk7XG4gICAgfVxuXG4gICAgcmVtb3ZlRmlsdGVyKCBmaWx0ZXJHcmFwaCApIHtcbiAgICAgICAgdmFyIGZpbHRlcnMgPSBGSUxURVJfU1RPUkUuZ2V0KCB0aGlzICksXG4gICAgICAgICAgICBpbmRleCA9IGZpbHRlcnMuaW5kZXhPZiggZmlsdGVyR3JhcGggKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5yZW1vdmVGaWx0ZXJBdEluZGV4KCBpbmRleCApO1xuICAgIH1cblxuICAgIHJlbW92ZUZpbHRlckF0SW5kZXgoIGluZGV4ICkge1xuICAgICAgICB2YXIgZmlsdGVycyA9IEZJTFRFUl9TVE9SRS5nZXQoIHRoaXMgKTtcblxuXG4gICAgICAgIGlmICggIWZpbHRlcnNbIGluZGV4IF0gKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdObyBmaWx0ZXIgYXQgdGhlIGdpdmVuIGluZGV4OicsIGluZGV4LCBmaWx0ZXJzICk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkaXNjb25uZWN0IHRoZSByZXF1ZXN0ZWQgZmlsdGVyXG4gICAgICAgIC8vIGFuZCByZW1vdmUgaXQgZnJvbSB0aGUgZmlsdGVycyBhcnJheS5cbiAgICAgICAgZmlsdGVyc1sgaW5kZXggXS5maWx0ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICBmaWx0ZXJzLnNwbGljZSggaW5kZXgsIDEgKTtcblxuICAgICAgICAvLyBJZiBhbGwgZmlsdGVycyBoYXZlIGJlZW4gcmVtb3ZlZCwgY29ubmVjdCB0aGVcbiAgICAgICAgLy8gaW5wdXQgdG8gdGhlIG91dHB1dCBzbyBhdWRpbyBzdGlsbCBwYXNzZXMgdGhyb3VnaC5cbiAgICAgICAgaWYgKCBmaWx0ZXJzLmxlbmd0aCA9PT0gMCApIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSBmaXJzdCBmaWx0ZXIgaGFzIGJlZW4gcmVtb3ZlZCwgYW5kIHRoZXJlXG4gICAgICAgIC8vIGFyZSBzdGlsbCBmaWx0ZXJzIGluIHRoZSBhcnJheSwgY29ubmVjdCB0aGUgaW5wdXRcbiAgICAgICAgLy8gdG8gdGhlIG5ldyBmaXJzdCBmaWx0ZXIuXG4gICAgICAgIGVsc2UgaWYgKCBpbmRleCA9PT0gMCApIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZmlsdGVyc1sgMCBdLmZpbHRlciApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIGxhc3QgZmlsdGVyIGhhcyBiZWVuIHJlbW92ZWQsIHRoZVxuICAgICAgICAvLyBuZXcgbGFzdCBmaWx0ZXIgbXVzdCBiZSBjb25uZWN0ZWQgdG8gdGhlIG91dHB1dFxuICAgICAgICBlbHNlIGlmICggaW5kZXggPT09IGZpbHRlcnMubGVuZ3RoICkge1xuICAgICAgICAgICAgZmlsdGVyc1sgZmlsdGVycy5sZW5ndGggLSAxIF0uZmlsdGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPdGhlcndpc2UsIHRoZSBpbmRleCBvZiB0aGUgZmlsdGVyIHRoYXQncyBiZWVuXG4gICAgICAgIC8vIHJlbW92ZWQgaXNuJ3QgdGhlIGZpcnN0LCBsYXN0LCBvciBvbmx5IGluZGV4IGluIHRoZVxuICAgICAgICAvLyBhcnJheSwgc28gY29ubmVjdCB0aGUgcHJldmlvdXMgZmlsdGVyIHRvIHRoZSBuZXdcbiAgICAgICAgLy8gb25lIGF0IHRoZSBnaXZlbiBpbmRleC5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmaWx0ZXJzWyBpbmRleCAtIDEgXS5maWx0ZXIuY29ubmVjdCggZmlsdGVyc1sgaW5kZXggXS5maWx0ZXIgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIEZJTFRFUl9TVE9SRS5zZXQoIHRoaXMsIGZpbHRlcnMgKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZW1vdmVBbGxGaWx0ZXJzKCkge1xuICAgICAgICB2YXIgZmlsdGVycyA9IEZJTFRFUl9TVE9SRS5nZXQoIHRoaXMgKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IGZpbHRlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUZpbHRlckF0SW5kZXgoIGkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ3VzdG9tRVEgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEN1c3RvbUVRKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDdXN0b21FUTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IEN1c3RvbUVRIGZyb20gXCIuL0N1c3RvbUVRLmVzNlwiO1xuXG5cbmNsYXNzIEVRMkJhbmQgZXh0ZW5kcyBDdXN0b21FUSB7XG5cdGNvbnN0cnVjdG9yKCBpbyApIHtcblx0XHRzdXBlciggaW8gKTtcblxuXHRcdHZhciBsb3dzaGVsZiA9IHRoaXMuYWRkRmlsdGVyKCAnbG93c2hlbGYnICksXG5cdFx0XHRoaWdoc2hlbGYgPSB0aGlzLmFkZEZpbHRlciggJ2hpZ2hzaGVsZicgKTtcblxuXHRcdHRoaXMuY29udHJvbHMuY3Jvc3NvdmVyRnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXHRcdHRoaXMuY29udHJvbHMuY3Jvc3NvdmVyRnJlcXVlbmN5LmNvbm5lY3QoIGxvd3NoZWxmLmNvbnRyb2xzLmZyZXF1ZW5jeSApO1xuXHRcdHRoaXMuY29udHJvbHMuY3Jvc3NvdmVyRnJlcXVlbmN5LmNvbm5lY3QoIGhpZ2hzaGVsZi5jb250cm9scy5mcmVxdWVuY3kgKTtcblxuXHRcdHRoaXMuY29udHJvbHMuUSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblx0XHR0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggbG93c2hlbGYuY29udHJvbHMuUSApO1xuXHRcdHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBoaWdoc2hlbGYuY29udHJvbHMuUSApO1xuXG5cdFx0dGhpcy5jb250cm9scy5sb3dHYWluID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXHRcdHRoaXMuY29udHJvbHMubG93R2Fpbi5jb25uZWN0KCBsb3dzaGVsZi5jb250cm9scy5nYWluICk7XG5cblx0XHR0aGlzLmNvbnRyb2xzLmhpZ2hHYWluID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXHRcdHRoaXMuY29udHJvbHMuaGlnaEdhaW4uY29ubmVjdCggaGlnaHNoZWxmLmNvbnRyb2xzLmdhaW4gKTtcblx0fVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUVRMkJhbmQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEVRMkJhbmQoIHRoaXMgKTtcbn07XG4iLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgQWxsUGFzc0ZpbHRlciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSA9IHRoaXMuaW8uY3JlYXRlQ3Jvc3NmYWRlciggMiwgMCApO1xuICAgICAgICBncmFwaC5scDEyZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gICAgICAgIGdyYXBoLmxwMjRkQiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcblxuICAgICAgICBncmFwaC5scDEyZEIudHlwZSA9ICdhbGxwYXNzJztcbiAgICAgICAgZ3JhcGgubHAyNGRCLnR5cGUgPSAnYWxscGFzcyc7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAxMmRCLlEudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuUS52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5zbG9wZSA9IGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb250cm9scy5pbmRleDtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5scDEyZEIuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmxwMjRkQi5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmxwMTJkQi5RICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5scDI0ZEIuUSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubHAxMmRCICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCLmNvbm5lY3QoIGdyYXBoLmxwMjRkQiApO1xuICAgICAgICBncmFwaC5scDI0ZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBbGxQYXNzRmlsdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBBbGxQYXNzRmlsdGVyKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBBbGxQYXNzRmlsdGVyOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBCUEZpbHRlciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSA9IHRoaXMuaW8uY3JlYXRlQ3Jvc3NmYWRlciggMiwgMCApO1xuICAgICAgICBncmFwaC5scDEyZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gICAgICAgIGdyYXBoLmxwMjRkQiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcblxuICAgICAgICBncmFwaC5scDEyZEIudHlwZSA9ICdiYW5kcGFzcyc7XG4gICAgICAgIGdyYXBoLmxwMjRkQi50eXBlID0gJ2JhbmRwYXNzJztcbiAgICAgICAgZ3JhcGgubHAxMmRCLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDEyZEIuUS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5RLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnNsb3BlID0gZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbnRyb2xzLmluZGV4O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmxwMTJkQi5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgubHAyNGRCLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGgubHAxMmRCLlEgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmxwMjRkQi5RICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5scDEyZEIgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5scDEyZEIuY29ubmVjdCggZ3JhcGgubHAyNGRCICk7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUJQRmlsdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBCUEZpbHRlciggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQlBGaWx0ZXI7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIEZyZXF1ZW5jeSBvZiBhIGNvbWIgZmlsdGVyIGlzIGNhbGN1bGF0ZWQgYXMgZm9sbG93czpcbi8vICBkZWxheVRpbWUgPSAoMSAvIGZyZXEpXG4vL1xuLy8gRS5nOlxuLy8gIC0gRm9yIDIwMGh6IGZyZXF1ZW5jeVxuLy8gICAgICBkZWxheVRpbWUgPSAoMSAvIDIwMCkgPSAwLjAwNXNcbi8vXG4vLyBUaGlzIGlzIGN1cnJlbnRseSBhIGZlZWRiYWNrIGNvbWIgZmlsdGVyLlxuY2xhc3MgQ29tYkZpbHRlciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgucmVjaXByb2NhbCA9IHRoaXMuaW8uY3JlYXRlUmVjaXByb2NhbCggdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKiAwLjUgKTtcblxuICAgICAgICBncmFwaC5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5mZWVkYmFjay5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmRlbGF5ICk7XG4gICAgICAgIGdyYXBoLmRlbGF5LmNvbm5lY3QoIGdyYXBoLmZlZWRiYWNrICk7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrLmNvbm5lY3QoIGdyYXBoLmRlbGF5ICk7XG4gICAgICAgIGdyYXBoLmRlbGF5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgucmVjaXByb2NhbCApO1xuICAgICAgICBncmFwaC5yZWNpcHJvY2FsLmNvbm5lY3QoIGdyYXBoLmRlbGF5LmRlbGF5VGltZSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGguZmVlZGJhY2suZ2FpbiApO1xuXG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbWJGaWx0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IENvbWJGaWx0ZXIoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IENvbWJGaWx0ZXI7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbnZhciBGSUxURVJfVFlQRVMgPSBbXG4gICAgJ2xvd3Bhc3MnLFxuICAgICdiYW5kcGFzcycsXG4gICAgJ2hpZ2hwYXNzJyxcbiAgICAnbm90Y2gnLFxuICAgICdsb3dwYXNzJ1xuXTtcblxuY2xhc3MgRmlsdGVyQmFuayBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIxMmRCID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCBGSUxURVJfVFlQRVMubGVuZ3RoLCAwICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIyNGRCID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCBGSUxURVJfVFlQRVMubGVuZ3RoLCAwICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSA9IHRoaXMuaW8uY3JlYXRlQ3Jvc3NmYWRlciggMiwgMCApO1xuICAgICAgICBncmFwaC5maWx0ZXJzMTJkQiA9IFtdO1xuICAgICAgICBncmFwaC5maWx0ZXJzMjRkQiA9IFtdO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuc2xvcGUgPSBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29udHJvbHMuaW5kZXg7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmlsdGVyVHlwZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5maWx0ZXJUeXBlLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXIxMmRCLmNvbnRyb2xzLmluZGV4ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmlsdGVyVHlwZS5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyMjRkQi5jb250cm9scy5pbmRleCApO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgZmlyc3Qgc2V0IG9mIDEyZGIgZmlsdGVycyAoc3RhbmRhcmQgaXNzdWUgd2l0aCBXZWJBdWRpb0FQSSlcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgRklMVEVSX1RZUEVTLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdmFyIGZpbHRlciA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcblxuICAgICAgICAgICAgZmlsdGVyLnR5cGUgPSBGSUxURVJfVFlQRVNbIGkgXTtcbiAgICAgICAgICAgIGZpbHRlci5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICAgICAgZmlsdGVyLlEudmFsdWUgPSAwO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBmaWx0ZXIuZnJlcXVlbmN5ICk7XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZmlsdGVyLlEgKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZmlsdGVyICk7XG4gICAgICAgICAgICBmaWx0ZXIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlcjEyZEIsIDAsIGkgKTtcblxuICAgICAgICAgICAgZ3JhcGguZmlsdGVyczEyZEIucHVzaCggZmlsdGVyICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgdGhlIHNlY29uZCBzZXQgb2YgMTJkYiBmaWx0ZXJzLFxuICAgICAgICAvLyB3aGVyZSB0aGUgZmlyc3Qgc2V0IHdpbGwgYmUgcGlwZWQgaW50byBzbyB3ZVxuICAgICAgICAvLyBlbmQgdXAgd2l0aCBkb3VibGUgdGhlIHJvbGxvZmYgKDEyZEIgKiAyID0gMjRkQikuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IEZJTFRFUl9UWVBFUy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHZhciBmaWx0ZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG5cbiAgICAgICAgICAgIGZpbHRlci50eXBlID0gRklMVEVSX1RZUEVTWyBpIF07XG4gICAgICAgICAgICBmaWx0ZXIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgICAgIGZpbHRlci5RLnZhbHVlID0gMDtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coIGZpbHRlciApO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBmaWx0ZXIuZnJlcXVlbmN5ICk7XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZmlsdGVyLlEgKTtcbiAgICAgICAgICAgIGdyYXBoLmZpbHRlcnMxMmRCWyBpIF0uY29ubmVjdCggZmlsdGVyICk7XG4gICAgICAgICAgICBmaWx0ZXIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlcjI0ZEIsIDAsIGkgKTtcblxuICAgICAgICAgICAgZ3JhcGguZmlsdGVyczI0ZEIucHVzaCggZmlsdGVyICk7XG4gICAgICAgIH1cblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyMTJkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlcjI0ZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVGaWx0ZXJCYW5rID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBGaWx0ZXJCYW5rKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBGaWx0ZXJCYW5rOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBIUEZpbHRlciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSA9IHRoaXMuaW8uY3JlYXRlQ3Jvc3NmYWRlciggMiwgMCApO1xuICAgICAgICBncmFwaC5scDEyZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gICAgICAgIGdyYXBoLmxwMjRkQiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcblxuICAgICAgICBncmFwaC5scDEyZEIudHlwZSA9ICdoaWdocGFzcyc7XG4gICAgICAgIGdyYXBoLmxwMjRkQi50eXBlID0gJ2hpZ2hwYXNzJztcbiAgICAgICAgZ3JhcGgubHAxMmRCLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDEyZEIuUS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5RLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnNsb3BlID0gZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbnRyb2xzLmluZGV4O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmxwMTJkQi5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgubHAyNGRCLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGgubHAxMmRCLlEgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmxwMjRkQi5RICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5scDEyZEIgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5scDEyZEIuY29ubmVjdCggZ3JhcGgubHAyNGRCICk7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUhQRmlsdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBIUEZpbHRlciggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgSFBGaWx0ZXI7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIExQRmlsdGVyIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlclNsb3BlID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCAyLCAwICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgICAgICAgZ3JhcGgubHAyNGRCID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuXG4gICAgICAgIGdyYXBoLmxwMTJkQi50eXBlID0gJ2xvd3Bhc3MnO1xuICAgICAgICBncmFwaC5scDI0ZEIudHlwZSA9ICdsb3dwYXNzJztcbiAgICAgICAgZ3JhcGgubHAxMmRCLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDEyZEIuUS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5RLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnNsb3BlID0gZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbnRyb2xzLmluZGV4O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmxwMTJkQi5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgubHAyNGRCLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGgubHAxMmRCLlEgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmxwMjRkQi5RICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5scDEyZEIgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5scDEyZEIuY29ubmVjdCggZ3JhcGgubHAyNGRCICk7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxQRmlsdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBMUEZpbHRlciggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTFBGaWx0ZXI7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIE5vdGNoRmlsdGVyIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlclNsb3BlID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCAyLCAwICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgICAgICAgZ3JhcGgubHAyNGRCID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuXG4gICAgICAgIGdyYXBoLmxwMTJkQi50eXBlID0gJ25vdGNoJztcbiAgICAgICAgZ3JhcGgubHAyNGRCLnR5cGUgPSAnbm90Y2gnO1xuICAgICAgICBncmFwaC5scDEyZEIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAyNGRCLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5RLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAyNGRCLlEudmFsdWUgPSAwO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuc2xvcGUgPSBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29udHJvbHMuaW5kZXg7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgubHAxMmRCLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5scDI0ZEIuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5scDEyZEIuUSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGgubHAyNGRCLlEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmxwMTJkQiApO1xuICAgICAgICBncmFwaC5scDEyZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5jb25uZWN0KCBncmFwaC5scDI0ZEIgKTtcbiAgICAgICAgZ3JhcGgubHAyNGRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMSApO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTm90Y2hGaWx0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE5vdGNoRmlsdGVyKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOb3RjaEZpbHRlcjsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IERyeVdldE5vZGUgZnJvbSBcIi4uLy4uL2dyYXBocy9EcnlXZXROb2RlLmVzNlwiO1xuXG5jbGFzcyBEdWFsQ2hvcnVzIGV4dGVuZHMgRHJ5V2V0Tm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIG5vZGVzLlxuICAgICAgICBncmFwaC5lbnN1cmVTdGVyZW9JbnB1dCA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsTWVyZ2VyKCAyICk7XG4gICAgICAgIGdyYXBoLnNwbGl0dGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxTcGxpdHRlciggMiApO1xuICAgICAgICBncmFwaC5kZWxheTFMID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIGdyYXBoLmRlbGF5MVIgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2sxTCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrMVIgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5kZWxheTJMID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIGdyYXBoLmRlbGF5MlIgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2syTCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrMlIgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5tZXJnZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQ2hhbm5lbE1lcmdlciggMiApO1xuICAgICAgICBncmFwaC5tb2QgPSB0aGlzLmNvbnRleHQuY3JlYXRlT3NjaWxsYXRvcigpO1xuICAgICAgICBncmFwaC5tb2QxQW1vdW50ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgubW9kMkFtb3VudCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm1vZDFQaGFzZSA9IHRoaXMuaW8uY3JlYXRlUGhhc2VPZmZzZXQoKTtcbiAgICAgICAgZ3JhcGgubW9kMlBoYXNlID0gdGhpcy5pby5jcmVhdGVQaGFzZU9mZnNldCgpO1xuICAgICAgICBncmFwaC5oaWdocGFzc0ZpbHRlckwgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gICAgICAgIGdyYXBoLmhpZ2hwYXNzRmlsdGVyUiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcblxuICAgICAgICAvLyBaZXJvIG91dCBwYXJhbSB2YWx1ZXMgdGhhdCB3aWxsIGJlIGNvbnRyb2xlZFxuICAgICAgICAvLyBieSBQYXJhbSBpbnN0YW5jZXMuXG4gICAgICAgIGdyYXBoLmRlbGF5MUwuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGguZGVsYXkxUi5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5mZWVkYmFjazFMLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5mZWVkYmFjazFSLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5kZWxheTJMLmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmRlbGF5MlIuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2syTC5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2syUi5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubW9kLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLm1vZDFBbW91bnQuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLm1vZDJBbW91bnQuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmhpZ2hwYXNzRmlsdGVyTC5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5oaWdocGFzc0ZpbHRlckwuUS52YWx1ZSA9IDE7XG4gICAgICAgIGdyYXBoLmhpZ2hwYXNzRmlsdGVyUi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5oaWdocGFzc0ZpbHRlclIuUS52YWx1ZSA9IDE7XG4gICAgICAgIGdyYXBoLmhpZ2hwYXNzRmlsdGVyTC50eXBlID0gJ2hpZ2hwYXNzJztcbiAgICAgICAgZ3JhcGguaGlnaHBhc3NGaWx0ZXJSLnR5cGUgPSAnaGlnaHBhc3MnO1xuXG4gICAgICAgIC8vIE1haW4gZ3JhcGguXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZW5zdXJlU3RlcmVvSW5wdXQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5lbnN1cmVTdGVyZW9JbnB1dCwgMCwgMSApO1xuICAgICAgICBncmFwaC5lbnN1cmVTdGVyZW9JbnB1dC5jb25uZWN0KCBncmFwaC5zcGxpdHRlciApO1xuICAgICAgICBncmFwaC5zcGxpdHRlci5jb25uZWN0KCBncmFwaC5oaWdocGFzc0ZpbHRlckwsIDAgKTtcbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIuY29ubmVjdCggZ3JhcGguaGlnaHBhc3NGaWx0ZXJSLCAxICk7XG4gICAgICAgIGdyYXBoLmhpZ2hwYXNzRmlsdGVyTC5jb25uZWN0KCBncmFwaC5kZWxheTFMICk7XG4gICAgICAgIGdyYXBoLmhpZ2hwYXNzRmlsdGVyUi5jb25uZWN0KCBncmFwaC5kZWxheTFSICk7XG4gICAgICAgIGdyYXBoLnNwbGl0dGVyLmNvbm5lY3QoIGdyYXBoLmRlbGF5MkwsIDAgKTtcbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIuY29ubmVjdCggZ3JhcGguZGVsYXkyUiwgMSApO1xuXG4gICAgICAgIGdyYXBoLmRlbGF5MUwuY29ubmVjdCggZ3JhcGguZmVlZGJhY2sxTCApO1xuICAgICAgICBncmFwaC5kZWxheTFSLmNvbm5lY3QoIGdyYXBoLmZlZWRiYWNrMVIgKTtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2sxTC5jb25uZWN0KCBncmFwaC5kZWxheTFSICk7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrMVIuY29ubmVjdCggZ3JhcGguZGVsYXkxTCApO1xuICAgICAgICBncmFwaC5kZWxheTFMLmNvbm5lY3QoIGdyYXBoLm1lcmdlciwgMCwgMCApO1xuICAgICAgICBncmFwaC5kZWxheTFSLmNvbm5lY3QoIGdyYXBoLm1lcmdlciwgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLmRlbGF5MkwuY29ubmVjdCggZ3JhcGguZmVlZGJhY2sxTCApO1xuICAgICAgICBncmFwaC5kZWxheTJSLmNvbm5lY3QoIGdyYXBoLmZlZWRiYWNrMVIgKTtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2syTC5jb25uZWN0KCBncmFwaC5kZWxheTJSICk7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrMlIuY29ubmVjdCggZ3JhcGguZGVsYXkyTCApO1xuICAgICAgICBncmFwaC5kZWxheTJMLmNvbm5lY3QoIGdyYXBoLm1lcmdlciwgMCwgMCApO1xuICAgICAgICBncmFwaC5kZWxheTJSLmNvbm5lY3QoIGdyYXBoLm1lcmdlciwgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLm1lcmdlci5jb25uZWN0KCB0aGlzLndldCApO1xuXG4gICAgICAgIC8vIE1vZHVsYXRpb24gZ3JhcGhcbiAgICAgICAgZ3JhcGgubW9kLmNvbm5lY3QoIGdyYXBoLm1vZDFBbW91bnQgKTtcbiAgICAgICAgZ3JhcGgubW9kLmNvbm5lY3QoIGdyYXBoLm1vZDJBbW91bnQgKTtcbiAgICAgICAgZ3JhcGgubW9kMUFtb3VudC5jb25uZWN0KCBncmFwaC5kZWxheTFMLmRlbGF5VGltZSApO1xuICAgICAgICBncmFwaC5tb2QyQW1vdW50LmNvbm5lY3QoIGdyYXBoLmRlbGF5MkwuZGVsYXlUaW1lICk7XG4gICAgICAgIGdyYXBoLm1vZDFBbW91bnQuY29ubmVjdCggZ3JhcGgubW9kMVBoYXNlICk7XG4gICAgICAgIGdyYXBoLm1vZDJBbW91bnQuY29ubmVjdCggZ3JhcGgubW9kMlBoYXNlICk7XG4gICAgICAgIGdyYXBoLm1vZDFQaGFzZS5jb25uZWN0KCBncmFwaC5kZWxheTFSLmRlbGF5VGltZSApO1xuICAgICAgICBncmFwaC5tb2QyUGhhc2UuY29ubmVjdCggZ3JhcGguZGVsYXkyUi5kZWxheVRpbWUgKTtcbiAgICAgICAgZ3JhcGgubW9kLnN0YXJ0KCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGNvbnRyb2xzXG4gICAgICAgIHRoaXMuY29udHJvbHMuZGVsYXkxVGltZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5kZWxheTJUaW1lID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hwYXNzRnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLm1vZEZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5tb2QxQW1vdW50ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLm1vZDJBbW91bnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubW9kMVBoYXNlID0gZ3JhcGgubW9kMVBoYXNlLmNvbnRyb2xzLnBoYXNlO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLm1vZDJQaGFzZSA9IGdyYXBoLm1vZDJQaGFzZS5jb250cm9scy5waGFzZTtcblxuICAgICAgICAvLyBDb25uZWN0IGNvbnRyb2xzLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRlbGF5MVRpbWUuY29ubmVjdCggZ3JhcGguZGVsYXkxTC5kZWxheVRpbWUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5kZWxheTFUaW1lLmNvbm5lY3QoIGdyYXBoLmRlbGF5MVIuZGVsYXlUaW1lICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZGVsYXkyVGltZS5jb25uZWN0KCBncmFwaC5kZWxheTJMLmRlbGF5VGltZSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRlbGF5MlRpbWUuY29ubmVjdCggZ3JhcGguZGVsYXkyUi5kZWxheVRpbWUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5mZWVkYmFjazFMLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5mZWVkYmFjazFSLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5mZWVkYmFjazJMLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5mZWVkYmFjazJSLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdocGFzc0ZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5oaWdocGFzc0ZpbHRlckwuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaHBhc3NGcmVxdWVuY3kuY29ubmVjdCggZ3JhcGguaGlnaHBhc3NGaWx0ZXJSLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLm1vZEZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5tb2QuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubW9kRnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLm1vZDFQaGFzZS5jb250cm9scy5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5tb2RGcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgubW9kMlBoYXNlLmNvbnRyb2xzLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLm1vZDFQaGFzZS5jb25uZWN0KCBncmFwaC5tb2QxUGhhc2UuY29udHJvbHMucGhhc2UgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5tb2QyUGhhc2UuY29ubmVjdCggZ3JhcGgubW9kMlBoYXNlLmNvbnRyb2xzLnBoYXNlICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubW9kMUFtb3VudC5jb25uZWN0KCBncmFwaC5tb2QxQW1vdW50LmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5tb2QyQW1vdW50LmNvbm5lY3QoIGdyYXBoLm1vZDJBbW91bnQuZ2FpbiApO1xuXG5cblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRHVhbENob3J1cyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRHVhbENob3J1cyggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRHVhbENob3J1czsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IERyeVdldE5vZGUgZnJvbSBcIi4uLy4uL2dyYXBocy9EcnlXZXROb2RlLmVzNlwiO1xuXG5jbGFzcyBTaW1wbGVDaG9ydXMgZXh0ZW5kcyBEcnlXZXROb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5lbnN1cmVTdGVyZW9JbnB1dCA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsTWVyZ2VyKCAyICk7XG4gICAgICAgIGdyYXBoLnNwbGl0dGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxTcGxpdHRlciggMiApO1xuICAgICAgICBncmFwaC5kZWxheUwgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgZ3JhcGguZGVsYXlSID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrTCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrUiA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm1lcmdlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsTWVyZ2VyKCAyICk7XG4gICAgICAgIGdyYXBoLm1vZCA9IHRoaXMuY29udGV4dC5jcmVhdGVPc2NpbGxhdG9yKCk7XG4gICAgICAgIGdyYXBoLm1vZEFtb3VudCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm1vZFBoYXNlID0gdGhpcy5pby5jcmVhdGVQaGFzZU9mZnNldCgpO1xuXG4gICAgICAgIGdyYXBoLmRlbGF5TC5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5kZWxheVIuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2tMLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5mZWVkYmFja1IuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLm1vZC5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5tb2RBbW91bnQuZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5lbnN1cmVTdGVyZW9JbnB1dCwgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmVuc3VyZVN0ZXJlb0lucHV0LCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmVuc3VyZVN0ZXJlb0lucHV0LmNvbm5lY3QoIGdyYXBoLnNwbGl0dGVyICk7XG4gICAgICAgIGdyYXBoLnNwbGl0dGVyLmNvbm5lY3QoIGdyYXBoLmRlbGF5TCwgMCApO1xuICAgICAgICBncmFwaC5zcGxpdHRlci5jb25uZWN0KCBncmFwaC5kZWxheVIsIDEgKTtcbiAgICAgICAgZ3JhcGguZGVsYXlMLmNvbm5lY3QoIGdyYXBoLmZlZWRiYWNrTCApO1xuICAgICAgICBncmFwaC5kZWxheVIuY29ubmVjdCggZ3JhcGguZmVlZGJhY2tSICk7XG4gICAgICAgIGdyYXBoLmZlZWRiYWNrTC5jb25uZWN0KCBncmFwaC5kZWxheVIgKTtcbiAgICAgICAgZ3JhcGguZmVlZGJhY2tSLmNvbm5lY3QoIGdyYXBoLmRlbGF5TCApO1xuICAgICAgICBncmFwaC5kZWxheUwuY29ubmVjdCggZ3JhcGgubWVyZ2VyLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmRlbGF5Ui5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGgubWVyZ2VyLmNvbm5lY3QoIHRoaXMud2V0ICk7XG5cbiAgICAgICAgLy8gTW9kdWxhdGlvbiBncmFwaFxuICAgICAgICBncmFwaC5tb2QuY29ubmVjdCggZ3JhcGgubW9kQW1vdW50ICk7XG4gICAgICAgIGdyYXBoLm1vZEFtb3VudC5jb25uZWN0KCBncmFwaC5kZWxheUwuZGVsYXlUaW1lICk7XG4gICAgICAgIGdyYXBoLm1vZEFtb3VudC5jb25uZWN0KCBncmFwaC5tb2RQaGFzZSApO1xuICAgICAgICBncmFwaC5tb2RQaGFzZS5jb25uZWN0KCBncmFwaC5kZWxheVIuZGVsYXlUaW1lICk7XG4gICAgICAgIGdyYXBoLm1vZC5zdGFydCgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBjb250cm9sc1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRlbGF5VGltZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjayA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5tb2RGcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubW9kQW1vdW50ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLm1vZFBoYXNlID0gZ3JhcGgubW9kUGhhc2UuY29udHJvbHMucGhhc2U7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5kZWxheVRpbWUuY29ubmVjdCggZ3JhcGguZGVsYXlMLmRlbGF5VGltZSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRlbGF5VGltZS5jb25uZWN0KCBncmFwaC5kZWxheVIuZGVsYXlUaW1lICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2suY29ubmVjdCggZ3JhcGguZmVlZGJhY2tMLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5mZWVkYmFja1IuZ2FpbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLm1vZEZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5tb2QuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubW9kRnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLm1vZFBoYXNlLmNvbnRyb2xzLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLm1vZEFtb3VudC5jb25uZWN0KCBncmFwaC5tb2RBbW91bnQuZ2FpbiApO1xuXG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNpbXBsZUNob3J1cyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgU2ltcGxlQ2hvcnVzKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTaW1wbGVDaG9ydXM7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBEcnlXZXROb2RlIGZyb20gXCIuLi8uLi9ncmFwaHMvRHJ5V2V0Tm9kZS5lczZcIjtcblxuLy8gVE9ETzogQWRkIGZlZWRiYWNrTGV2ZWwgYW5kIGRlbGF5VGltZSBQYXJhbSBpbnN0YW5jZXNcbi8vIHRvIGNvbnRyb2wgdGhpcyBub2RlLlxuY2xhc3MgU2luZVNoYXBlciBleHRlbmRzIERyeVdldE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZHJpdmUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuU2luZSApO1xuICAgICAgICBncmFwaC5zaGFwZXJEcml2ZSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLnNoYXBlckRyaXZlLmdhaW4udmFsdWUgPSAxO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyRHJpdmUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5kcml2ZS5jb25uZWN0KCBncmFwaC5zaGFwZXJEcml2ZS5nYWluICk7XG4gICAgICAgIGdyYXBoLnNoYXBlckRyaXZlLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy53ZXQgKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2luZVNoYXBlciA9IGZ1bmN0aW9uKCB0aW1lLCBmZWVkYmFja0xldmVsICkge1xuICAgIHJldHVybiBuZXcgU2luZVNoYXBlciggdGhpcywgdGltZSwgZmVlZGJhY2tMZXZlbCApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2luZVNoYXBlcjsiLCIvKlxuXHRHcmFwaCBmb3IgdGhpcyBub2RlIGlzIHNob3duIGluIHRoZSBmb2xsb3dpbmcgcGFwZXI6XG5cblx0XHRCZWF0IEZyZWkgLSBEaWdpdGFsIFNvdW5kIEdlbmVyYXRpb24gKEFwcGVuZGl4IEM6IE1pc2NlbGxhbmVvdXMg4oCTIDEuIERDIFRyYXApXG5cdFx0SUNTVCwgWnVyaWNoIFVuaSBvZiBBcnRzLlxuXG5cdEF2YWlsYWJsZSBoZXJlOlxuXHRcdGh0dHBzOi8vY291cnNlcy5jcy53YXNoaW5ndG9uLmVkdS9jb3Vyc2VzL2NzZTQ5MHMvMTFhdS9SZWFkaW5ncy9EaWdpdGFsX1NvdW5kX0dlbmVyYXRpb25fMS5wZGZcblxuXG5cblx0RXNzZW50aWFsbHksIGEgRENUcmFwIHJlbW92ZXMgdGhlIERDIG9mZnNldCBvciBEQyBiaWFzXG5cdGZyb20gdGhlIGluY29taW5nIHNpZ25hbCwgd2hlcmUgYSBEQyBvZmZzZXQgaXMgZWxlbWVudHNcblx0b2YgdGhlIHNpZ25hbCB0aGF0IGFyZSBhdCAwSHouXG5cblx0VGhlIGdyYXBoIGlzIGFzIGZvbGxvd3M6XG5cblx0XHQgICB8LS0tPC0tLTx8ICAgaW5wdXRcblx0XHQgICB8XHRcdHxcdCAgfFxuXHRcdCAgIC0+IHotMSAtPiAtPiBuZWdhdGUgLT4gLT4gb3V0XG5cdFx0ICAgfFx0XHRcdFx0XHQgfFxuXHRcdCAgIHw8LS0tLS0tLS0tLS0tLS0gKmEgPC18XG5cblxuXHRUaGUgYSwgb3IgYWxwaGEsIHZhbHVlIGlzIGNhbGN1bGF0ZWQgaXMgYXMgZm9sbG93czpcblx0XHRgYSA9IDJQSWZnIC8gZnNgXG5cblx0V2hlcmUgYGZnYCBkZXRlcm1pbmVzIHRoZSAnc3BlZWQnIG9mIHRoZSB0cmFwICh0aGUgJ2N1dG9mZicpLFxuXHRhbmQgYGZzYCBpcyB0aGUgc2FtcGxlIHJhdGUuIFRoaXMgY2FuIGJlIGV4cGFuZGVkIGludG8gdGhlXG5cdGZvbGxvd2luZyB0byBhdm9pZCBhIG1vcmUgZXhwZW5zaXZlIGRpdmlzaW9uIChhcyB0aGUgcmVjaXByb2NhbFxuXHRvZiB0aGUgc2FtcGxlIHJhdGUgY2FuIGJlIGNhbGN1bGF0ZWQgYmVmb3JlaGFuZCk6XG5cdFx0YGEgPSAoMiAqIFBJICogZmcpICogKDEgLyBmcylgXG5cblxuXHRHaXZlbiBhbiBgZmdgIG9mIDUsIGFuZCBzYW1wbGUgcmF0ZSBvZiA0ODAwMCwgd2UgZ2V0OlxuXHRcdGBhID0gMiAqIFBJICogNSAqICgxIC8gNDgwMDApYFxuXHRcdGBhID0gNi4yODMxICogNSAqIDIuMDgzMzNlLTA1YFxuXHRcdGBhID0gMzEuNDE1NSAqIDIuMDgzMzNlLTA1YFxuXHRcdGBhID0gMC4wMDA2NTQ0ODg1MzYxNWAuXG4gKi9cblxuaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgRENUcmFwIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBjdXRvZmYgPSA1ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBjdXRvZmYsIG9yIGBmZ2AgY29uc3RhbnQuXG4gICAgICAgIC8vIFRoZXJlIHdpbGwgcmFyZWx5IGJlIGEgbmVlZCB0byBjaGFuZ2UgdGhpcyB2YWx1ZSBmcm9tXG4gICAgICAgIC8vIGVpdGhlciB0aGUgZ2l2ZW4gb25lLCBvciBpdCdzIGRlZmF1bHQgb2YgNSxcbiAgICAgICAgLy8gc28gSSdtIG5vdCBtYWtpbmcgdGhpcyBpbnRvIGEgY29udHJvbC5cbiAgICAgICAgZ3JhcGguY3V0b2ZmID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggY3V0b2ZmICk7XG5cbiAgICAgICAgLy8gQWxwaGEgY2FsY3VsYXRpb25cbiAgICAgICAgZ3JhcGguUEkyID0gdGhpcy5pby5jcmVhdGVDb25zdGFudFBJMigpO1xuICAgICAgICBncmFwaC5jdXRvZmZNdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGguYWxwaGEgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKTtcbiAgICAgICAgZ3JhcGguUEkyLmNvbm5lY3QoIGdyYXBoLmN1dG9mZk11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmN1dG9mZi5jb25uZWN0KCBncmFwaC5jdXRvZmZNdWx0aXBseSwgMCwgMSApO1xuICAgICAgICBncmFwaC5jdXRvZmZNdWx0aXBseS5jb25uZWN0KCBncmFwaC5hbHBoYSwgMCwgMCApO1xuXG4gICAgICAgIC8vIE1haW4gZ3JhcGhcbiAgICAgICAgZ3JhcGgubmVnYXRlID0gdGhpcy5pby5jcmVhdGVOZWdhdGUoKTtcbiAgICAgICAgZ3JhcGguek1pbnVzT25lID0gdGhpcy5pby5jcmVhdGVTYW1wbGVEZWxheSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIG1haW4gZ3JhcGggYW5kIGFscGhhLlxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm5lZ2F0ZSApO1xuICAgICAgICBncmFwaC5uZWdhdGUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWxwaGEuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggZ3JhcGguek1pbnVzT25lICk7XG4gICAgICAgIGdyYXBoLnpNaW51c09uZS5jb25uZWN0KCBncmFwaC56TWludXNPbmUgKTtcbiAgICAgICAgZ3JhcGguek1pbnVzT25lLmNvbm5lY3QoIGdyYXBoLm5lZ2F0ZSApO1xuICAgICAgICBncmFwaC5uZWdhdGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRENUcmFwID0gZnVuY3Rpb24oIGN1dG9mZiApIHtcbiAgICByZXR1cm4gbmV3IERDVHJhcCggdGhpcywgY3V0b2ZmICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5pbXBvcnQgQnVmZmVyVXRpbHMgZnJvbSBcIi4uLy4uL2J1ZmZlcnMvQnVmZmVyVXRpbHMuZXM2XCI7XG5pbXBvcnQgQnVmZmVyR2VuZXJhdG9ycyBmcm9tIFwiLi4vLi4vYnVmZmVycy9CdWZmZXJHZW5lcmF0b3JzLmVzNlwiO1xuXG5jbGFzcyBMRk8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGN1dG9mZiA9IDUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICAvLyBDcmVhdGUgbm9kZXMuXG4gICAgICAgIGdyYXBoLm9zY2lsbGF0b3IgPSB0aGlzLmlvLmNyZWF0ZU9zY2lsbGF0b3JCYW5rKCk7XG4gICAgICAgIGdyYXBoLnBoYXNlT2Zmc2V0ID0gdGhpcy5pby5jcmVhdGVQaGFzZU9mZnNldCgpO1xuICAgICAgICBncmFwaC5kZXB0aCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmppdHRlckRlcHRoID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguaml0dGVyT3NjaWxsYXRvciA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcblxuICAgICAgICBncmFwaC5qaXR0ZXJPc2NpbGxhdG9yLmJ1ZmZlciA9IEJ1ZmZlclV0aWxzLmdlbmVyYXRlQnVmZmVyKFxuICAgICAgICAgICAgdGhpcy5pbywgLy8gY29udGV4dFxuICAgICAgICAgICAgMSwgLy8gY2hhbm5lbHNcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlICogMiwgLy8gbGVuZ3RoXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSwgLy8gU2FtcGxlUmF0ZVxuICAgICAgICAgICAgQnVmZmVyR2VuZXJhdG9ycy5XaGl0ZU5vaXNlIC8vIEdlbmVyYXRvciBmdW5jdGlvblxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFplcm8tb3V0IHRoZSBkZXB0aCBnYWluIG5vZGVzIHNvIHRoZSB2YWx1ZSBcbiAgICAgICAgLy8gb2YgdGhlIGRlcHRoIGNvbnRyb2xzIGFyZW4ndCBtdWx0aXBsaWVkLlxuICAgICAgICBncmFwaC5kZXB0aC5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGguaml0dGVyRGVwdGguZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgLy8gU2V0IGppdHRlciBvc2NpbGxhdG9yIHNldHRpbmdzXG4gICAgICAgIGdyYXBoLmppdHRlck9zY2lsbGF0b3IubG9vcCA9IHRydWU7XG4gICAgICAgIGdyYXBoLmppdHRlck9zY2lsbGF0b3Iuc3RhcnQoKTtcblxuICAgICAgICAvLyBDcmVhdGUgY29udHJvbHNcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSBncmFwaC5vc2NpbGxhdG9yLmNvbnRyb2xzLmZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5jb250cm9scy5kZXR1bmUgPSBncmFwaC5vc2NpbGxhdG9yLmNvbnRyb2xzLmRldHVuZTtcbiAgICAgICAgdGhpcy5jb250cm9scy53YXZlZm9ybSA9IGdyYXBoLm9zY2lsbGF0b3IuY29udHJvbHMud2F2ZWZvcm07XG4gICAgICAgIHRoaXMuY29udHJvbHMuZGVwdGggPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMub2Zmc2V0ID0gZ3JhcGgucGhhc2VPZmZzZXQuY29udHJvbHMucGhhc2U7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaml0dGVyID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIC8vIENvbnRyb2wgY29ubmVjdGlvbnMuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLnBoYXNlT2Zmc2V0LmNvbnRyb2xzLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRlcHRoLmNvbm5lY3QoIGdyYXBoLmRlcHRoLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5qaXR0ZXIuY29ubmVjdCggZ3JhcGguaml0dGVyRGVwdGguZ2FpbiApO1xuXG4gICAgICAgIC8vIE1haW4gTEZPIG9zYyBjb25uZWN0aW9uc1xuICAgICAgICBncmFwaC5vc2NpbGxhdG9yLmNvbm5lY3QoIGdyYXBoLnBoYXNlT2Zmc2V0ICk7XG4gICAgICAgIGdyYXBoLnBoYXNlT2Zmc2V0LmNvbm5lY3QoIGdyYXBoLmRlcHRoICk7XG4gICAgICAgIGdyYXBoLmRlcHRoLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgLy8gSml0dGVyIGNvbm5lY3Rpb25zXG4gICAgICAgIGdyYXBoLmppdHRlck9zY2lsbGF0b3IuY29ubmVjdCggZ3JhcGguaml0dGVyRGVwdGggKTtcbiAgICAgICAgZ3JhcGguaml0dGVyRGVwdGguY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgc3RhcnQoIGRlbGF5ID0gMCApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLm9zY2lsbGF0b3Iuc3RhcnQoIGRlbGF5ICk7XG4gICAgfVxuICAgIHN0b3AoIGRlbGF5ID0gMCApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLm9zY2lsbGF0b3Iuc3RvcCggZGVsYXkgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxGTyA9IGZ1bmN0aW9uKCBjdXRvZmYgKSB7XG4gICAgcmV0dXJuIG5ldyBMRk8oIHRoaXMsIGN1dG9mZiApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vLyBCYXNlZCBvbiB0aGUgZm9sbG93aW5nIGZvcm11bGEgZnJvbSBNaWNoYWVsIEdydWhuOlxuLy8gIC0gaHR0cDovL211c2ljZHNwLm9yZy9zaG93QXJjaGl2ZUNvbW1lbnQucGhwP0FyY2hpdmVJRD0yNTVcbi8vXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vXG4vLyBDYWxjdWxhdGUgdHJhbnNmb3JtYXRpb24gbWF0cml4J3MgY29lZmZpY2llbnRzXG4vLyBjb3NfY29lZiA9IGNvcyhhbmdsZSk7XG4vLyBzaW5fY29lZiA9IHNpbihhbmdsZSk7XG4vL1xuLy8gRG8gdGhpcyBwZXIgc2FtcGxlXG4vLyBvdXRfbGVmdCA9IGluX2xlZnQgKiBjb3NfY29lZiAtIGluX3JpZ2h0ICogc2luX2NvZWY7XG4vLyBvdXRfcmlnaHQgPSBpbl9sZWZ0ICogc2luX2NvZWYgKyBpbl9yaWdodCAqIGNvc19jb2VmO1xuLy8gXG4vLyBSb3RhdGlvbiBpcyBpbiByYWRpYW5zLlxuY2xhc3MgU3RlcmVvUm90YXRpb24gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHJvdGF0aW9uICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5yb3RhdGlvbiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHJvdGF0aW9uICk7XG5cbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKCAyICk7XG4gICAgICAgIGdyYXBoLmNvcyA9IHRoaXMuaW8uY3JlYXRlQ29zKCk7XG4gICAgICAgIGdyYXBoLnNpbiA9IHRoaXMuaW8uY3JlYXRlU2luKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5yb3RhdGlvbi5jb25uZWN0KCBncmFwaC5jb3MgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5yb3RhdGlvbi5jb25uZWN0KCBncmFwaC5zaW4gKTtcblxuICAgICAgICBncmFwaC5sZWZ0TXVsdGlwbHlDb3MgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLmxlZnRNdWx0aXBseVNpbiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgucmlnaHRNdWx0aXBseUNvcyA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgucmlnaHRNdWx0aXBseVNpbiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubGVmdENvc01pbnVzUmlnaHRTaW4gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIGdyYXBoLmxlZnRTaW5BZGRSaWdodENvcyA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG5cblxuXG4gICAgICAgIGdyYXBoLmlucHV0TGVmdCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmlucHV0UmlnaHQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5tZXJnZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQ2hhbm5lbE1lcmdlciggMiApO1xuXG4gICAgICAgIGdyYXBoLnNwbGl0dGVyLmNvbm5lY3QoIGdyYXBoLmlucHV0TGVmdCwgMCApO1xuICAgICAgICBncmFwaC5zcGxpdHRlci5jb25uZWN0KCBncmFwaC5pbnB1dFJpZ2h0LCAxICk7XG5cbiAgICAgICAgZ3JhcGguaW5wdXRMZWZ0LmNvbm5lY3QoIGdyYXBoLmxlZnRNdWx0aXBseUNvcywgMCwgMCApO1xuICAgICAgICBncmFwaC5jb3MuY29ubmVjdCggZ3JhcGgubGVmdE11bHRpcGx5Q29zLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmlucHV0TGVmdC5jb25uZWN0KCBncmFwaC5sZWZ0TXVsdGlwbHlTaW4sIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguc2luLmNvbm5lY3QoIGdyYXBoLmxlZnRNdWx0aXBseVNpbiwgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLmlucHV0UmlnaHQuY29ubmVjdCggZ3JhcGgucmlnaHRNdWx0aXBseVNpbiwgMCwgMCApO1xuICAgICAgICBncmFwaC5zaW4uY29ubmVjdCggZ3JhcGgucmlnaHRNdWx0aXBseVNpbiwgMCwgMSApO1xuICAgICAgICBncmFwaC5pbnB1dFJpZ2h0LmNvbm5lY3QoIGdyYXBoLnJpZ2h0TXVsdGlwbHlDb3MsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguY29zLmNvbm5lY3QoIGdyYXBoLnJpZ2h0TXVsdGlwbHlDb3MsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5sZWZ0TXVsdGlwbHlDb3MuY29ubmVjdCggZ3JhcGgubGVmdENvc01pbnVzUmlnaHRTaW4sIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgucmlnaHRNdWx0aXBseVNpbi5jb25uZWN0KCBncmFwaC5sZWZ0Q29zTWludXNSaWdodFNpbiwgMCwgMSApO1xuICAgICAgICBncmFwaC5sZWZ0TXVsdGlwbHlTaW4uY29ubmVjdCggZ3JhcGgubGVmdFNpbkFkZFJpZ2h0Q29zLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLnJpZ2h0TXVsdGlwbHlDb3MuY29ubmVjdCggZ3JhcGgubGVmdFNpbkFkZFJpZ2h0Q29zLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGgubGVmdENvc01pbnVzUmlnaHRTaW4uY29ubmVjdCggZ3JhcGgubWVyZ2VyLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmxlZnRTaW5BZGRSaWdodENvcy5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDEgKTtcblxuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc3BsaXR0ZXIgKTtcbiAgICAgICAgZ3JhcGgubWVyZ2VyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5uYW1lZElucHV0cy5sZWZ0ID0gZ3JhcGguaW5wdXRMZWZ0O1xuICAgICAgICB0aGlzLm5hbWVkSW5wdXRzLnJpZ2h0ID0gZ3JhcGguaW5wdXRSaWdodDtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3RlcmVvUm90YXRpb24gPSBmdW5jdGlvbiggcm90YXRpb24gKSB7XG4gICAgcmV0dXJuIG5ldyBTdGVyZW9Sb3RhdGlvbiggdGhpcywgcm90YXRpb24gKTtcbn07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuLy8gQmFzZWQgb24gdGhlIGZvbGxvd2luZyBmb3JtdWxhIGZyb20gTWljaGFlbCBHcnVobjpcbi8vICAtIGh0dHA6Ly9tdXNpY2RzcC5vcmcvc2hvd0FyY2hpdmVDb21tZW50LnBocD9BcmNoaXZlSUQ9MjU2XG4vL1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vL1xuLy8gVGhlIGdyYXBoIHRoYXQncyBjcmVhdGVkIGlzIGFzIGZvbGxvd3M6XG4vL1xuLy8gICAgICAgICAgICAgICAgICAgfC0+IEwgLT4gbGVmdEFkZFJpZ2h0KCBjaDAgKSAtPiB8XG4vLyAgICAgICAgICAgICAgICAgICB8LT4gUiAtPiBsZWZ0QWRkUmlnaHQoIGNoMSApIC0+IHwgLT4gbXVsdGlwbHkoIDAuNSApIC0tLS0tLT4gbW9ub01pbnVzU3RlcmVvKCAwICkgLT4gbWVyZ2VyKCAwICkgLy8gb3V0TFxuLy8gaW5wdXQgLT4gc3BsaXR0ZXIgLSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfC0tLS0tPiBtb25vUGx1c1N0ZXJlbyggMCApIC0tPiBtZXJnZXIoIDEgKSAvLyBvdXRSXG4vLyAgICAgICAgICAgICAgICAgICB8LT4gTCAtPiByaWdodE1pbnVzTGVmdCggY2gxICkgLT4gfFxuLy8gICAgICAgICAgICAgICAgICAgfC0+IFIgLT4gcmlnaHRNaW51c0xlZnQoIGNoMCApIC0+IHwgLT4gbXVsdGlwbHkoIGNvZWYgKSAtLS0+IG1vbm9NaW51c1N0ZXJlbyggMSApIC0+IG1lcmdlciggMCApIC8vIG91dExcbi8vXG4vL1xuY2xhc3MgU3RlcmVvV2lkdGggZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHdpZHRoICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKCAyICk7XG4gICAgICAgIGdyYXBoLmNvZWZmaWNpZW50ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggd2lkdGggKTtcbiAgICAgICAgZ3JhcGguY29lZmZpY2llbnRIYWxmID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggMC41ICk7XG4gICAgICAgIGdyYXBoLmlucHV0TGVmdCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmlucHV0UmlnaHQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5sZWZ0QWRkUmlnaHQgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICBncmFwaC5yaWdodE1pbnVzTGVmdCA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHlQb2ludEZpdmUgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAwLjUgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHlDb2VmZmljaWVudCA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubW9ub01pbnVzU3RlcmVvID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICBncmFwaC5tb25vUGx1c1N0ZXJlbyA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLm1lcmdlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsTWVyZ2VyKCAyICk7XG5cbiAgICAgICAgZ3JhcGguY29lZmZpY2llbnQuY29ubmVjdCggZ3JhcGguY29lZmZpY2llbnRIYWxmICk7XG4gICAgICAgIGdyYXBoLmNvZWZmaWNpZW50SGFsZi5jb25uZWN0KCBncmFwaC5tdWx0aXBseUNvZWZmaWNpZW50LCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIuY29ubmVjdCggZ3JhcGguaW5wdXRMZWZ0LCAwICk7XG4gICAgICAgIGdyYXBoLnNwbGl0dGVyLmNvbm5lY3QoIGdyYXBoLmlucHV0UmlnaHQsIDEgKTtcbiAgICAgICAgZ3JhcGguaW5wdXRMZWZ0LmNvbm5lY3QoIGdyYXBoLmxlZnRBZGRSaWdodCwgMCwgMCApO1xuICAgICAgICBncmFwaC5pbnB1dFJpZ2h0LmNvbm5lY3QoIGdyYXBoLmxlZnRBZGRSaWdodCwgMCwgMSApO1xuICAgICAgICBncmFwaC5pbnB1dExlZnQuY29ubmVjdCggZ3JhcGgucmlnaHRNaW51c0xlZnQsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguaW5wdXRSaWdodC5jb25uZWN0KCBncmFwaC5yaWdodE1pbnVzTGVmdCwgMCwgMCApO1xuXG4gICAgICAgIGdyYXBoLmxlZnRBZGRSaWdodC5jb25uZWN0KCBncmFwaC5tdWx0aXBseVBvaW50Rml2ZSApO1xuICAgICAgICBncmFwaC5yaWdodE1pbnVzTGVmdC5jb25uZWN0KCBncmFwaC5tdWx0aXBseUNvZWZmaWNpZW50LCAwLCAwICk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbHlQb2ludEZpdmUuY29ubmVjdCggZ3JhcGgubW9ub01pbnVzU3RlcmVvLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5Q29lZmZpY2llbnQuY29ubmVjdCggZ3JhcGgubW9ub01pbnVzU3RlcmVvLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbHlQb2ludEZpdmUuY29ubmVjdCggZ3JhcGgubW9ub1BsdXNTdGVyZW8sIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHlDb2VmZmljaWVudC5jb25uZWN0KCBncmFwaC5tb25vUGx1c1N0ZXJlbywgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLm1vbm9NaW51c1N0ZXJlby5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubW9ub1BsdXNTdGVyZW8uY29ubmVjdCggZ3JhcGgubWVyZ2VyLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zcGxpdHRlciApO1xuICAgICAgICBncmFwaC5tZXJnZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLm5hbWVkSW5wdXRzLmxlZnQgPSBncmFwaC5pbnB1dExlZnQ7XG4gICAgICAgIHRoaXMubmFtZWRJbnB1dHMucmlnaHQgPSBncmFwaC5pbnB1dFJpZ2h0O1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMud2lkdGggPSBncmFwaC5jb2VmZmljaWVudDtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3RlcmVvV2lkdGggPSBmdW5jdGlvbiggd2lkdGggKSB7XG4gICAgcmV0dXJuIG5ldyBTdGVyZW9XaWR0aCggdGhpcywgd2lkdGggKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuXG5jbGFzcyBPc2NpbGxhdG9yR2VuZXJhdG9yIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlZm9ybSApIHtcbiAgICAgICAgdGhpcy5fc2V0SU8oIGlvICk7XG5cbiAgICAgICAgdGhpcy5mcmVxdWVuY3kgPSBmcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuZGV0dW5lID0gZGV0dW5lO1xuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgICAgIHRoaXMuZ2xpZGVUaW1lID0gZ2xpZGVUaW1lO1xuICAgICAgICB0aGlzLndhdmUgPSB3YXZlZm9ybSB8fCAnc2luZSc7XG4gICAgICAgIHRoaXMucmVzZXRUaW1lc3RhbXAgPSAwLjA7XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSB0aGlzLmNvbnRleHQuY3JlYXRlT3NjaWxsYXRvcigpLFxuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGggPSB0aGlzLl9tYWtlVmVsb2NpdHlHcmFwaCggdmVsb2NpdHkgKTtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gWyB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpIF07XG4gICAgICAgIHRoaXMucmVzZXQoIHRoaXMuZnJlcXVlbmN5LCB0aGlzLmRldHVuZSwgdGhpcy52ZWxvY2l0eSwgdGhpcy5nbGlkZVRpbWUsIHRoaXMud2F2ZSApO1xuXG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLmNvbm5lY3QoIHRoaXMudmVsb2NpdHlHcmFwaCApO1xuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGguY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBfbWFrZVZlbG9jaXR5R3JhcGgoKSB7XG4gICAgICAgIHZhciBnYWluID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgcmV0dXJuIGdhaW47XG4gICAgfVxuXG4gICAgX3Jlc2V0VmVsb2NpdHlHcmFwaCggdmVsb2NpdHkgKSB7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaC5nYWluLnZhbHVlID0gdmVsb2NpdHk7XG4gICAgfVxuXG4gICAgX2NsZWFuVXBWZWxvY2l0eUdyYXBoKCkge1xuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGguZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaCA9IG51bGw7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdID0gbnVsbDtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gbnVsbDtcbiAgICB9XG5cbiAgICBsZXJwKCBzdGFydCwgZW5kLCBkZWx0YSApIHtcbiAgICAgICAgcmV0dXJuIHN0YXJ0ICsgKCAoIGVuZCAtIHN0YXJ0ICkgKiBkZWx0YSApO1xuICAgIH1cblxuICAgIHJlc2V0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZSApIHtcbiAgICAgICAgdmFyIG5vdyA9IHRoaXMuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICBmcmVxdWVuY3kgPSB0eXBlb2YgZnJlcXVlbmN5ID09PSAnbnVtYmVyJyA/IGZyZXF1ZW5jeSA6IHRoaXMuZnJlcXVlbmN5O1xuICAgICAgICBkZXR1bmUgPSB0eXBlb2YgZGV0dW5lID09PSAnbnVtYmVyJyA/IGRldHVuZSA6IHRoaXMuZGV0dW5lO1xuICAgICAgICB2ZWxvY2l0eSA9IHR5cGVvZiB2ZWxvY2l0eSA9PT0gJ251bWJlcicgPyB2ZWxvY2l0eSA6IHRoaXMudmVsb2NpdHk7XG4gICAgICAgIHdhdmUgPSB0eXBlb2Ygd2F2ZSA9PT0gJ251bWJlcicgPyB3YXZlIDogdGhpcy53YXZlO1xuXG4gICAgICAgIHZhciBnbGlkZVRpbWUgPSB0eXBlb2YgZ2xpZGVUaW1lID09PSAnbnVtYmVyJyA/IGdsaWRlVGltZSA6IDA7XG5cbiAgICAgICAgdGhpcy5fcmVzZXRWZWxvY2l0eUdyYXBoKCB2ZWxvY2l0eSApO1xuXG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIG5vdyApO1xuICAgICAgICB0aGlzLmdlbmVyYXRvci5kZXR1bmUuY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCBub3cgKTtcblxuICAgICAgICAvLyBub3cgKz0gMC4xXG5cbiAgICAgICAgLy8gaWYgKCB0aGlzLmdsaWRlVGltZSAhPT0gMC4wICkge1xuICAgICAgICAvLyAgICAgdmFyIHN0YXJ0RnJlcSA9IHRoaXMuZnJlcXVlbmN5LFxuICAgICAgICAvLyAgICAgICAgIGVuZEZyZXEgPSBmcmVxdWVuY3ksXG4gICAgICAgIC8vICAgICAgICAgZnJlcURpZmYgPSBlbmRGcmVxIC0gc3RhcnRGcmVxLFxuICAgICAgICAvLyAgICAgICAgIHN0YXJ0VGltZSA9IHRoaXMucmVzZXRUaW1lc3RhbXAsXG4gICAgICAgIC8vICAgICAgICAgZW5kVGltZSA9IHRoaXMucmVzZXRUaW1lc3RhbXAgKyB0aGlzLmdsaWRlVGltZSxcbiAgICAgICAgLy8gICAgICAgICBjdXJyZW50VGltZSA9IG5vdyAtIHN0YXJ0VGltZSxcbiAgICAgICAgLy8gICAgICAgICBsZXJwUG9zID0gY3VycmVudFRpbWUgLyB0aGlzLmdsaWRlVGltZSxcbiAgICAgICAgLy8gICAgICAgICBjdXJyZW50RnJlcSA9IHRoaXMubGVycCggdGhpcy5mcmVxdWVuY3ksIGZyZXF1ZW5jeSwgbGVycFBvcyApO1xuXG4gICAgICAgIC8vICAgICBpZiAoIGN1cnJlbnRUaW1lIDwgZ2xpZGVUaW1lICkge1xuICAgICAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKCAnY3V0b2ZmJywgc3RhcnRGcmVxLCBjdXJyZW50RnJlcSApO1xuICAgICAgICAvLyAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZSggY3VycmVudEZyZXEsIG5vdyApO1xuICAgICAgICAvLyAgICAgfVxuXG5cbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKCBzdGFydFRpbWUsIGVuZFRpbWUsIG5vdywgY3VycmVudFRpbWUgKTtcbiAgICAgICAgLy8gfVxuXG5cbiAgICAgICAgLy8gbm93ICs9IDAuNTtcblxuICAgICAgICBpZiAoIGdsaWRlVGltZSAhPT0gMCApIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggZnJlcXVlbmN5LCBub3cgKyBnbGlkZVRpbWUgKTtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmRldHVuZS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggZGV0dW5lLCBub3cgKyBnbGlkZVRpbWUgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZSggZnJlcXVlbmN5LCBub3cgKTtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmRldHVuZS5zZXRWYWx1ZUF0VGltZSggZGV0dW5lLCBub3cgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggdHlwZW9mIHdhdmUgPT09ICdzdHJpbmcnICkge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IudHlwZSA9IHdhdmU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRvci50eXBlID0gdGhpcy53YXZlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXNldFRpbWVzdGFtcCA9IG5vdztcbiAgICAgICAgdGhpcy5nbGlkZVRpbWUgPSBnbGlkZVRpbWU7XG4gICAgICAgIHRoaXMuZnJlcXVlbmN5ID0gZnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmRldHVuZSA9IGRldHVuZTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgICAgICB0aGlzLndhdmUgPSB3YXZlO1xuICAgIH1cblxuICAgIHN0YXJ0KCBkZWxheSApIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3Iuc3RhcnQoIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgc3RvcCggZGVsYXkgKSB7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLnN0b3AoIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3IuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fY2xlYW5VcFZlbG9jaXR5R3JhcGgoKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIE9zY2lsbGF0b3JHZW5lcmF0b3IucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU9zY2lsbGF0b3JHZW5lcmF0b3IgPSBmdW5jdGlvbiggZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmUgKSB7XG4gICAgcmV0dXJuIG5ldyBPc2NpbGxhdG9yR2VuZXJhdG9yKCB0aGlzLCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBUT0RPOlxuLy8gIC0gVHVybiBhcmd1bWVudHMgaW50byBjb250cm9sbGFibGUgcGFyYW1ldGVycztcbmNsYXNzIENvdW50ZXIgZXh0ZW5kcyBOb2RlIHtcblxuICAgIGNvbnN0cnVjdG9yKCBpbywgaW5jcmVtZW50LCBsaW1pdCwgc3RlcFRpbWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIHRoaXMuc3RlcFRpbWUgPSBzdGVwVGltZSB8fCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGU7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5pbmNyZW1lbnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBpbmNyZW1lbnQgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5saW1pdCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxpbWl0ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuc3RlcFRpbWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBzdGVwVGltZSB8fCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKTtcblxuICAgICAgICB0aGlzLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIHRoaXMuZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5zdGVwVGltZS5jb25uZWN0KCB0aGlzLmRlbGF5LmRlbGF5VGltZSApO1xuXG4gICAgICAgIHRoaXMuZmVlZGJhY2sgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcblxuICAgICAgICB0aGlzLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLmZlZWRiYWNrICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suY29ubmVjdCggdGhpcy5kZWxheSApO1xuXG4gICAgICAgIHRoaXMubGVzc1RoYW4gPSB0aGlzLmlvLmNyZWF0ZUxlc3NUaGFuKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubGltaXQuY29ubmVjdCggdGhpcy5sZXNzVGhhbi5jb250cm9scy52YWx1ZSApO1xuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMubGVzc1RoYW4gKTtcbiAgICAgICAgLy8gdGhpcy5sZXNzVGhhbi5jb25uZWN0KCB0aGlzLmZlZWRiYWNrLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5pbmNyZW1lbnQuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmxlc3NUaGFuLmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICAvLyBDbGFtcCBmcm9tIDAgdG8gYGxpbWl0YCB2YWx1ZS5cbiAgICAgICAgLy8gdGhpcy5jbGFtcCA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAgKTtcbiAgICAgICAgLy8gdGhpcy5jb250cm9scy5saW1pdC5jb25uZWN0KCB0aGlzLmNsYW1wLmNvbnRyb2xzLm1heCApO1xuXG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgIH1cblxuICAgIHJlc2V0KCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5zdG9wKCk7XG5cbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLnN0YXJ0KCk7XG4gICAgICAgIH0sIDE2ICk7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGlmKCB0aGlzLnJ1bm5pbmcgPT09IGZhbHNlICkge1xuICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIC8vIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gdGhpcy5zdGVwVGltZTtcbiAgICAgICAgICAgIHRoaXMubGVzc1RoYW4uY29ubmVjdCggdGhpcy5mZWVkYmFjay5nYWluICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdG9wKCkge1xuICAgICAgICBpZiggdGhpcy5ydW5uaW5nID09PSB0cnVlICkge1xuICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmxlc3NUaGFuLmRpc2Nvbm5lY3QoIHRoaXMuZmVlZGJhY2suZ2FpbiApO1xuICAgICAgICAgICAgLy8gdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvdW50ZXIgPSBmdW5jdGlvbiggaW5jcmVtZW50LCBsaW1pdCwgc3RlcFRpbWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDb3VudGVyKCB0aGlzLCBpbmNyZW1lbnQsIGxpbWl0LCBzdGVwVGltZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBDcm9zc2ZhZGVyIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1DYXNlcyA9IDIsIHN0YXJ0aW5nQ2FzZSA9IDAgKSB7XG5cbiAgICAgICAgLy8gRW5zdXJlIHN0YXJ0aW5nQ2FzZSBpcyBuZXZlciA8IDBcbiAgICAgICAgLy8gYW5kIG51bWJlciBvZiBpbnB1dHMgaXMgYWx3YXlzID49IDIgKG5vIHBvaW50XG4gICAgICAgIC8vIHgtZmFkaW5nIGJldHdlZW4gbGVzcyB0aGFuIHR3byBpbnB1dHMhKVxuICAgICAgICBzdGFydGluZ0Nhc2UgPSBNYXRoLmFicyggc3RhcnRpbmdDYXNlICk7XG4gICAgICAgIG51bUNhc2VzID0gTWF0aC5tYXgoIG51bUNhc2VzLCAyICk7XG5cbiAgICAgICAgc3VwZXIoIGlvLCBudW1DYXNlcywgMSApO1xuXG4gICAgICAgIHRoaXMuY2xhbXBzID0gW107XG4gICAgICAgIHRoaXMuc3VidHJhY3RzID0gW107XG4gICAgICAgIHRoaXMueGZhZGVycyA9IFtdO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgbnVtQ2FzZXMgLSAxOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLnhmYWRlcnNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlRHJ5V2V0Tm9kZSgpO1xuICAgICAgICAgICAgdGhpcy5zdWJ0cmFjdHNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoIGkpO1xuICAgICAgICAgICAgdGhpcy5jbGFtcHNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAsIDEgKTtcblxuICAgICAgICAgICAgaWYoIGkgPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS5kcnkgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0c1sgaSArIDEgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS53ZXQgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMueGZhZGVyc1sgaSAtIDEgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS5kcnkgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0c1sgaSArIDEgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS53ZXQgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5pbmRleC5jb25uZWN0KCB0aGlzLnN1YnRyYWN0c1sgaSBdICk7XG4gICAgICAgICAgICB0aGlzLnN1YnRyYWN0c1sgaSBdLmNvbm5lY3QoIHRoaXMuY2xhbXBzWyBpIF0gKTtcbiAgICAgICAgICAgIHRoaXMuY2xhbXBzWyBpIF0uY29ubmVjdCggdGhpcy54ZmFkZXJzWyBpIF0uY29udHJvbHMuZHJ5V2V0ICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnhmYWRlcnNbIHRoaXMueGZhZGVycy5sZW5ndGggLSAxIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDcm9zc2ZhZGVyID0gZnVuY3Rpb24oIG51bUNhc2VzLCBzdGFydGluZ0Nhc2UgKSB7XG4gICAgcmV0dXJuIG5ldyBDcm9zc2ZhZGVyKCB0aGlzLCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDcm9zc2ZhZGVyOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5pbXBvcnQgY29ubmVjdGlvbnMgZnJvbSBcIi4uL21peGlucy9jb25uZWN0aW9ucy5lczZcIjtcbmltcG9ydCBjbGVhbmVycyBmcm9tIFwiLi4vbWl4aW5zL2NsZWFuZXJzLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vLyBUaGlzIGZ1bmN0aW9uIGNyZWF0ZXMgYSBncmFwaCB0aGF0IGFsbG93cyBtb3JwaGluZ1xuLy8gYmV0d2VlbiB0d28gZ2FpbiBub2Rlcy5cbi8vXG4vLyBJdCBsb29rcyBhIGxpdHRsZSBiaXQgbGlrZSB0aGlzOlxuLy9cbi8vICAgICAgICAgICAgICAgICBkcnkgLT4gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tPiB8XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdlxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgdiAgR2FpbigwLTEpICAgIC0+ICAgICBHYWluKC0xKSAgICAgLT4gICAgIG91dHB1dFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGZhZGVyKSAgICAgICAgIChpbnZlcnQgcGhhc2UpICAgICAgICAoc3VtbWluZylcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgIF5cbi8vICAgIHdldCAtPiAgIEdhaW4oLTEpICAgLT4gLXxcbi8vICAgICAgICAgIChpbnZlcnQgcGhhc2UpXG4vL1xuLy8gV2hlbiBhZGp1c3RpbmcgdGhlIGZhZGVyJ3MgZ2FpbiB2YWx1ZSBpbiB0aGlzIGdyYXBoLFxuLy8gaW5wdXQxJ3MgZ2FpbiBsZXZlbCB3aWxsIGNoYW5nZSBmcm9tIDAgdG8gMSxcbi8vIHdoaWxzdCBpbnB1dDIncyBnYWluIGxldmVsIHdpbGwgY2hhbmdlIGZyb20gMSB0byAwLlxuY2xhc3MgRHJ5V2V0Tm9kZSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAyLCAxICk7XG5cbiAgICAgICAgdGhpcy5kcnkgPSB0aGlzLmlucHV0c1sgMCBdO1xuICAgICAgICB0aGlzLndldCA9IHRoaXMuaW5wdXRzWyAxIF07XG5cbiAgICAgICAgLy8gSW52ZXJ0IHdldCBzaWduYWwncyBwaGFzZVxuICAgICAgICB0aGlzLndldElucHV0SW52ZXJ0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy53ZXRJbnB1dEludmVydC5nYWluLnZhbHVlID0gLTE7XG4gICAgICAgIHRoaXMud2V0LmNvbm5lY3QoIHRoaXMud2V0SW5wdXRJbnZlcnQgKTtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGZhZGVyIG5vZGVcbiAgICAgICAgdGhpcy5mYWRlciA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZmFkZXIuZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb250cm9sIG5vZGUuIEl0IHNldHMgdGhlIGZhZGVyJ3MgdmFsdWUuXG4gICAgICAgIHRoaXMuZHJ5V2V0Q29udHJvbCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5kcnlXZXRDb250cm9sLmNvbm5lY3QoIHRoaXMuZmFkZXIuZ2FpbiApO1xuXG4gICAgICAgIC8vIEludmVydCB0aGUgZmFkZXIgbm9kZSdzIHBoYXNlXG4gICAgICAgIHRoaXMuZmFkZXJJbnZlcnQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmZhZGVySW52ZXJ0LmdhaW4udmFsdWUgPSAtMTtcblxuICAgICAgICAvLyBDb25uZWN0IGZhZGVyIHRvIGZhZGVyIHBoYXNlIGludmVyc2lvbixcbiAgICAgICAgLy8gYW5kIGZhZGVyIHBoYXNlIGludmVyc2lvbiB0byBvdXRwdXQuXG4gICAgICAgIHRoaXMud2V0SW5wdXRJbnZlcnQuY29ubmVjdCggdGhpcy5mYWRlciApO1xuICAgICAgICB0aGlzLmZhZGVyLmNvbm5lY3QoIHRoaXMuZmFkZXJJbnZlcnQgKTtcbiAgICAgICAgdGhpcy5mYWRlckludmVydC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgZHJ5IGlucHV0IHRvIGJvdGggdGhlIG91dHB1dCBhbmQgdGhlIGZhZGVyIG5vZGVcbiAgICAgICAgdGhpcy5kcnkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5kcnkuY29ubmVjdCggdGhpcy5mYWRlciApO1xuXG4gICAgICAgIC8vIEFkZCBhICdkcnlXZXQnIHByb3BlcnR5IHRvIHRoZSBjb250cm9scyBvYmplY3QuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZHJ5V2V0ID0gdGhpcy5kcnlXZXRDb250cm9sO1xuICAgIH1cblxufVxuXG5cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEcnlXZXROb2RlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBEcnlXZXROb2RlKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBEcnlXZXROb2RlO1xuIiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIEVRU2hlbGYgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGhpZ2hGcmVxdWVuY3kgPSAyNTAwLCBsb3dGcmVxdWVuY3kgPSAzNTAsIGhpZ2hCb29zdCA9IC02LCBsb3dCb29zdCA9IDAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuaGlnaEZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hGcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5sb3dGcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dGcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5oaWdoQm9vc3QgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoQm9vc3QgKTtcbiAgICAgICAgdGhpcy5sb3dCb29zdCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd0Jvb3N0ICk7XG5cbiAgICAgICAgdGhpcy5sb3dTaGVsZiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgICAgICAgdGhpcy5sb3dTaGVsZi50eXBlID0gJ2xvd3NoZWxmJztcbiAgICAgICAgdGhpcy5sb3dTaGVsZi5mcmVxdWVuY3kudmFsdWUgPSBsb3dGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMubG93U2hlbGYuZ2Fpbi52YWx1ZSA9IGxvd0Jvb3N0O1xuXG4gICAgICAgIHRoaXMuaGlnaFNoZWxmID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICB0aGlzLmhpZ2hTaGVsZi50eXBlID0gJ2hpZ2hzaGVsZic7XG4gICAgICAgIHRoaXMuaGlnaFNoZWxmLmZyZXF1ZW5jeS52YWx1ZSA9IGhpZ2hGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuaGlnaFNoZWxmLmdhaW4udmFsdWUgPSBoaWdoQm9vc3Q7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmxvd1NoZWxmICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5oaWdoU2hlbGYgKTtcbiAgICAgICAgdGhpcy5sb3dTaGVsZi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmhpZ2hTaGVsZi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIFN0b3JlIGNvbnRyb2xsYWJsZSBwYXJhbXMuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRPRE86XG4gICAgICAgIC8vICAtIFNob3VsZCB0aGVzZSBiZSByZWZlcmVuY2VzIHRvIHBhcmFtLmNvbnRyb2w/IFRoaXNcbiAgICAgICAgLy8gICAgbWlnaHQgYWxsb3cgZGVmYXVsdHMgdG8gYmUgc2V0IHdoaWxzdCBhbHNvIGFsbG93aW5nXG4gICAgICAgIC8vICAgIGF1ZGlvIHNpZ25hbCBjb250cm9sLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hGcmVxdWVuY3kgPSB0aGlzLmhpZ2hGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93RnJlcXVlbmN5ID0gdGhpcy5sb3dGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEJvb3N0ID0gdGhpcy5oaWdoQm9vc3Q7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93Qm9vc3QgPSB0aGlzLmxvd0Jvb3N0O1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVFUVNoZWxmID0gZnVuY3Rpb24oIGhpZ2hGcmVxdWVuY3ksIGxvd0ZyZXF1ZW5jeSwgaGlnaEJvb3N0LCBsb3dCb29zdCApIHtcbiAgICByZXR1cm4gbmV3IEVRU2hlbGYoIHRoaXMsIGhpZ2hGcmVxdWVuY3ksIGxvd0ZyZXF1ZW5jeSwgaGlnaEJvb3N0LCBsb3dCb29zdCApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRVFTaGVsZjsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgUGhhc2VPZmZzZXQgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMucmVjaXByb2NhbCA9IHRoaXMuaW8uY3JlYXRlUmVjaXByb2NhbCggdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKiAwLjUgKTtcbiAgICAgICAgdGhpcy5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5waGFzZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5oYWxmUGhhc2UgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAwLjUgKTtcblxuICAgICAgICB0aGlzLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5mcmVxdWVuY3kuY29ubmVjdCggdGhpcy5yZWNpcHJvY2FsICk7XG4gICAgICAgIHRoaXMucmVjaXByb2NhbC5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMucGhhc2UuY29ubmVjdCggdGhpcy5oYWxmUGhhc2UgKTtcbiAgICAgICAgdGhpcy5oYWxmUGhhc2UuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMSApO1xuICAgICAgICB0aGlzLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMuZGVsYXkuZGVsYXlUaW1lICk7XG5cbiAgICAgICAgLy8gU2hvdWxkIHRoaXMgYmUgY29ubmVjdGVkIT8gSWYgaXQgaXMsIHRoZW4gaXQnc1xuICAgICAgICAvLyBjcmVhdGluZywgZWcuIFBXTSBpZiBhIHNxdWFyZSB3YXZlIGlzIGlucHV0dGVkLCBcbiAgICAgICAgLy8gc2luY2UgcmF3IGlucHV0IGlzIGJlaW5nIGJsZW5kZWQgd2l0aCBwaGFzZS1vZmZzZXR0ZWRcbiAgICAgICAgLy8gaW5wdXQuXG4gICAgICAgIC8vIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSAwLjU7XG5cbiAgICAgICAgLy8gU3RvcmUgY29udHJvbGxhYmxlIHBhcmFtcy5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5jb250cm9scy5waGFzZSA9IHRoaXMucGhhc2U7XG4gICAgfVxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBoYXNlT2Zmc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQaGFzZU9mZnNldCggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgUGhhc2VPZmZzZXQ7IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcbi8vIGltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBtYXRoIGZyb20gXCIuLi9taXhpbnMvbWF0aC5lczZcIjtcbi8vIGltcG9ydCBOb3RlIGZyb20gXCIuLi9ub3RlL05vdGUuZXM2XCI7XG4vLyBpbXBvcnQgQ2hvcmQgZnJvbSBcIi4uL25vdGUvQ2hvcmQuZXM2XCI7XG5cbi8vICBQbGF5ZXJcbi8vICA9PT09PT1cbi8vICBUYWtlcyBjYXJlIG9mIHJlcXVlc3RpbmcgR2VuZXJhdG9yTm9kZXMgYmUgY3JlYXRlZC5cbi8vXG4vLyAgSGFzOlxuLy8gICAgICAtIFBvbHlwaG9ueSAocGFyYW0pXG4vLyAgICAgIC0gVW5pc29uIChwYXJhbSlcbi8vICAgICAgLSBVbmlzb24gZGV0dW5lIChwYXJhbSlcbi8vICAgICAgLSBVbmlzb24gcGhhc2UgKHBhcmFtKVxuLy8gICAgICAtIEdsaWRlIG1vZGVcbi8vICAgICAgLSBHbGlkZSB0aW1lXG4vLyAgICAgIC0gVmVsb2NpdHkgc2Vuc2l0aXZpdHkgKHBhcmFtKVxuLy8gICAgICAtIEdsb2JhbCB0dW5pbmcgKHBhcmFtKVxuLy9cbi8vICBNZXRob2RzOlxuLy8gICAgICAtIHN0YXJ0KCBmcmVxL25vdGUsIHZlbCwgZGVsYXkgKVxuLy8gICAgICAtIHN0b3AoIGZyZXEvbm90ZSwgdmVsLCBkZWxheSApXG4vL1xuLy8gIFByb3BlcnRpZXM6XG4vLyAgICAgIC0gcG9seXBob255IChudW1iZXIsID4xKVxuLy8gICAgICAtIHVuaXNvbiAobnVtYmVyLCA+MSlcbi8vICAgICAgLSB1bmlzb25EZXR1bmUgKG51bWJlciwgY2VudHMpXG4vLyAgICAgIC0gdW5pc29uUGhhc2UgKG51bWJlciwgMC0xKVxuLy8gICAgICAtIGdsaWRlTW9kZSAoc3RyaW5nKVxuLy8gICAgICAtIGdsaWRlVGltZSAobXMsIG51bWJlcilcbi8vICAgICAgLSB2ZWxvY2l0eVNlbnNpdGl2aXR5ICgwLTEsIG51bWJlcilcbi8vICAgICAgLSB0dW5pbmcgKC02NCwgKzY0LCBzZW1pdG9uZXMpXG4vL1xuY2xhc3MgR2VuZXJhdG9yUGxheWVyIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBvcHRpb25zICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICBpZiAoIG9wdGlvbnMuZ2VuZXJhdG9yID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdHZW5lcmF0b3JQbGF5ZXIgcmVxdWlyZXMgYSBgZ2VuZXJhdG9yYCBvcHRpb24gdG8gYmUgZ2l2ZW4uJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSBvcHRpb25zLmdlbmVyYXRvcjtcblxuICAgICAgICB0aGlzLnBvbHlwaG9ueSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIG9wdGlvbnMucG9seXBob255IHx8IDEgKTtcblxuICAgICAgICB0aGlzLnVuaXNvbiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIG9wdGlvbnMudW5pc29uIHx8IDEgKTtcbiAgICAgICAgdGhpcy51bmlzb25EZXR1bmUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy51bmlzb25EZXR1bmUgPT09ICdudW1iZXInID8gb3B0aW9ucy51bmlzb25EZXR1bmUgOiAwICk7XG4gICAgICAgIHRoaXMudW5pc29uUGhhc2UgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy51bmlzb25QaGFzZSA9PT0gJ251bWJlcicgPyBvcHRpb25zLnVuaXNvblBoYXNlIDogMCApO1xuICAgICAgICB0aGlzLnVuaXNvbk1vZGUgPSBvcHRpb25zLnVuaXNvbk1vZGUgfHwgJ2NlbnRlcmVkJztcblxuICAgICAgICB0aGlzLmdsaWRlTW9kZSA9IG9wdGlvbnMuZ2xpZGVNb2RlIHx8ICdlcXVhbCc7XG4gICAgICAgIHRoaXMuZ2xpZGVUaW1lID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMuZ2xpZGVUaW1lID09PSAnbnVtYmVyJyA/IG9wdGlvbnMuZ2xpZGVUaW1lIDogMCApO1xuXG4gICAgICAgIHRoaXMudmVsb2NpdHlTZW5zaXRpdml0eSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHR5cGVvZiBvcHRpb25zLnZlbG9jaXR5U2Vuc2l0aXZpdHkgPT09ICdudW1iZXInID8gb3B0aW9ucy52ZWxvY2l0eVNlbnNpdGl2aXR5IDogMCApO1xuXG4gICAgICAgIHRoaXMudHVuaW5nID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMudHVuaW5nID09PSAnbnVtYmVyJyA/IG9wdGlvbnMudHVuaW5nIDogMCApO1xuXG4gICAgICAgIHRoaXMud2F2ZWZvcm0gPSBvcHRpb25zLndhdmVmb3JtIHx8ICdzaW5lJztcblxuICAgICAgICB0aGlzLmVudmVsb3BlID0gb3B0aW9ucy5lbnZlbG9wZSB8fCB0aGlzLmlvLmNyZWF0ZUFEU1JFbnZlbG9wZSgpO1xuXG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0cyA9IHt9O1xuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0ID0gW107XG4gICAgICAgIHRoaXMudGltZXJzID0gW107XG4gICAgfVxuXG5cbiAgICBfY3JlYXRlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZWZvcm0gKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRvci5jYWxsKCB0aGlzLmlvLCBmcmVxdWVuY3ksIGRldHVuZSArIHRoaXMudHVuaW5nLnZhbHVlICogMTAwLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlZm9ybSApO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogQ2FsY3VsYXRlcyB0aGUgYW1vdW50IG9mIGRldHVuZSAoY2VudHMpIHRvIGFwcGx5IHRvIGEgZ2VuZXJhdG9yIG5vZGVcbiAgICAgKiBnaXZlbiBhbiBpbmRleCBiZXR3ZWVuIDAgYW5kIHRoaXMudW5pc29uLnZhbHVlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHVuaXNvbkluZGV4IFVuaXNvbiBpbmRleC5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICAgICAgICAgIERldHVuZSB2YWx1ZSwgaW4gY2VudHMuXG4gICAgICovXG4gICAgX2NhbGN1bGF0ZURldHVuZSggdW5pc29uSW5kZXggKSB7XG4gICAgICAgIHZhciBkZXR1bmUgPSAwLjAsXG4gICAgICAgICAgICB1bmlzb25EZXR1bmUgPSB0aGlzLnVuaXNvbkRldHVuZS52YWx1ZTtcblxuICAgICAgICBpZiAoIHRoaXMudW5pc29uTW9kZSA9PT0gJ2NlbnRlcmVkJyApIHtcbiAgICAgICAgICAgIHZhciBpbmNyID0gdW5pc29uRGV0dW5lO1xuXG4gICAgICAgICAgICBkZXR1bmUgPSBpbmNyICogdW5pc29uSW5kZXg7XG4gICAgICAgICAgICBkZXR1bmUgLT0gaW5jciAqICggdGhpcy51bmlzb24udmFsdWUgKiAwLjUgKTtcbiAgICAgICAgICAgIGRldHVuZSArPSBpbmNyICogMC41O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIG11bHRpcGxpZXI7XG5cbiAgICAgICAgICAgIC8vIExlYXZlIHRoZSBmaXJzdCBub3RlIGluIHRoZSB1bmlzb25cbiAgICAgICAgICAgIC8vIGFsb25lLCBzbyBpdCdzIGRldHVuZSB2YWx1ZSBpcyB0aGUgcm9vdFxuICAgICAgICAgICAgLy8gbm90ZS5cbiAgICAgICAgICAgIGlmICggdW5pc29uSW5kZXggPiAwICkge1xuICAgICAgICAgICAgICAgIC8vIEhvcCBkb3duIG5lZ2F0aXZlIGhhbGYgdGhlIHVuaXNvbkluZGV4XG4gICAgICAgICAgICAgICAgaWYgKCB1bmlzb25JbmRleCAlIDIgPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIG11bHRpcGxpZXIgPSAtdW5pc29uSW5kZXggKiAwLjU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBIb3AgdXAgbiBjZW50c1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHVuaXNvbkluZGV4ID4gMSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXNvbkluZGV4ID0gdGhpcy5NYXRoLnJvdW5kVG9NdWx0aXBsZSggdW5pc29uSW5kZXgsIDIgKSAtIDI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBtdWx0aXBsaWVyID0gdW5pc29uSW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSB0aGUgbXVsdGlwbGllciwgY2FsY3VsYXRlIHRoZSBkZXR1bmUgdmFsdWVcbiAgICAgICAgICAgICAgICAvLyBmb3IgdGhlIGdpdmVuIHVuaXNvbkluZGV4LlxuICAgICAgICAgICAgICAgIGRldHVuZSA9IHVuaXNvbkRldHVuZSAqIG11bHRpcGxpZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGV0dW5lO1xuICAgIH1cblxuICAgIF9jYWxjdWxhdGVHbGlkZVRpbWUoIG9sZEZyZXEsIG5ld0ZyZXEgKSB7XG4gICAgICAgIHZhciBtb2RlID0gdGhpcy5nbGlkZU1vZGUsXG4gICAgICAgICAgICB0aW1lID0gdGhpcy5nbGlkZVRpbWUudmFsdWUsXG4gICAgICAgICAgICBnbGlkZVRpbWUsXG4gICAgICAgICAgICBmcmVxRGlmZmVyZW5jZTtcblxuICAgICAgICBpZiAoIHRpbWUgPT09IDAuMCApIHtcbiAgICAgICAgICAgIGdsaWRlVGltZSA9IDAuMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggbW9kZSA9PT0gJ2VxdWFsJyApIHtcbiAgICAgICAgICAgIGdsaWRlVGltZSA9IHRpbWUgKiAwLjAwMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZyZXFEaWZmZXJlbmNlID0gTWF0aC5hYnMoIG9sZEZyZXEgLSBuZXdGcmVxICk7XG4gICAgICAgICAgICBmcmVxRGlmZmVyZW5jZSA9IHRoaXMuTWF0aC5jbGFtcCggZnJlcURpZmZlcmVuY2UsIDAsIDUwMCApO1xuICAgICAgICAgICAgZ2xpZGVUaW1lID0gdGhpcy5NYXRoLnNjYWxlTnVtYmVyRXhwKFxuICAgICAgICAgICAgICAgIGZyZXFEaWZmZXJlbmNlLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgNTAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgdGltZVxuICAgICAgICAgICAgKSAqIDAuMDAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdsaWRlVGltZTtcbiAgICB9XG5cblxuICAgIF9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBnZW5lcmF0b3JPYmplY3QgKSB7XG4gICAgICAgIHZhciBvYmplY3RzID0gdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzO1xuXG4gICAgICAgIG9iamVjdHNbIGZyZXF1ZW5jeSBdID0gb2JqZWN0c1sgZnJlcXVlbmN5IF0gfHwgW107XG4gICAgICAgIG9iamVjdHNbIGZyZXF1ZW5jeSBdLnVuc2hpZnQoIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0LnVuc2hpZnQoIGdlbmVyYXRvck9iamVjdCApO1xuICAgIH1cblxuICAgIF9mZXRjaEdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5ICkge1xuICAgICAgICB2YXIgb2JqZWN0cyA9IHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c1sgZnJlcXVlbmN5IF0sXG4gICAgICAgICAgICBpbmRleCA9IDA7XG5cbiAgICAgICAgaWYgKCAhb2JqZWN0cyB8fCBvYmplY3RzLmxlbmd0aCA9PT0gMCApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5wb3AoKTtcbiAgICAgICAgcmV0dXJuIG9iamVjdHMucG9wKCk7XG4gICAgfVxuXG4gICAgX2ZldGNoR2VuZXJhdG9yT2JqZWN0VG9SZXVzZSgpIHtcbiAgICAgICAgdmFyIGdlbmVyYXRvciA9IHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQucG9wKCksXG4gICAgICAgICAgICBmcmVxdWVuY3k7XG5cbiAgICAgICAgY29uc29sZS5sb2coICdyZXVzZScsIGdlbmVyYXRvciApO1xuXG4gICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggZ2VuZXJhdG9yICkgKSB7XG4gICAgICAgICAgICBmcmVxdWVuY3kgPSBnZW5lcmF0b3JbIDAgXS5mcmVxdWVuY3k7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGdlbmVyYXRvci5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVudmVsb3BlLmZvcmNlU3RvcCggZ2VuZXJhdG9yWyBpIF0ub3V0cHV0c1sgMCBdLmdhaW4gKTtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoIGdlbmVyYXRvclsgaSBdLnRpbWVyICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmcmVxdWVuY3kgPSBnZW5lcmF0b3IuZnJlcXVlbmN5O1xuICAgICAgICAgICAgdGhpcy5lbnZlbG9wZS5mb3JjZVN0b3AoIGdlbmVyYXRvci5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KCBnZW5lcmF0b3IudGltZXIgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c1sgZnJlcXVlbmN5IF0ucG9wKCk7XG5cbiAgICAgICAgcmV0dXJuIGdlbmVyYXRvcjtcbiAgICB9XG5cblxuICAgIF9zdGFydEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApIHtcbiAgICAgICAgZ2VuZXJhdG9yT2JqZWN0Lm91dHB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmVudmVsb3BlLnN0YXJ0KCBnZW5lcmF0b3JPYmplY3Qub3V0cHV0c1sgMCBdLmdhaW4sIGRlbGF5ICk7XG4gICAgICAgIGdlbmVyYXRvck9iamVjdC5zdGFydCggZGVsYXkgKTtcbiAgICB9XG5cbiAgICBfc3RhcnRTaW5nbGUoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICkge1xuICAgICAgICB2YXIgdW5pc29uID0gdGhpcy51bmlzb24udmFsdWUsXG4gICAgICAgICAgICBkZXR1bmUgPSAwLjAsXG4gICAgICAgICAgICB1bmlzb25HZW5lcmF0b3JBcnJheSxcbiAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCxcbiAgICAgICAgICAgIGFjdGl2ZUdlbmVyYXRvckNvdW50ID0gdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5sZW5ndGgsXG4gICAgICAgICAgICBleGlzdGluZ0ZyZXF1ZW5jeSxcbiAgICAgICAgICAgIGdsaWRlVGltZSA9IDAuMDtcblxuICAgICAgICBpZiAoIGFjdGl2ZUdlbmVyYXRvckNvdW50IDwgdGhpcy5wb2x5cGhvbnkudmFsdWUgKSB7XG4gICAgICAgICAgICBpZiAoIHVuaXNvbiA9PT0gMS4wICkge1xuICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2NyZWF0ZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHRoaXMud2F2ZWZvcm0gKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdW5pc29uR2VuZXJhdG9yQXJyYXkgPSBbXTtcblxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHVuaXNvbjsgKytpICkge1xuICAgICAgICAgICAgICAgICAgICBkZXR1bmUgPSB0aGlzLl9jYWxjdWxhdGVEZXR1bmUoIGkgKTtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fY3JlYXRlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgdGhpcy53YXZlZm9ybSApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApO1xuICAgICAgICAgICAgICAgICAgICB1bmlzb25HZW5lcmF0b3JBcnJheS5wdXNoKCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCB1bmlzb25HZW5lcmF0b3JBcnJheSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoIHVuaXNvbiA9PT0gMS4wICkge1xuICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2ZldGNoR2VuZXJhdG9yT2JqZWN0VG9SZXVzZSgpO1xuICAgICAgICAgICAgICAgIGV4aXN0aW5nRnJlcXVlbmN5ID0gZ2VuZXJhdG9yT2JqZWN0LmZyZXF1ZW5jeTtcbiAgICAgICAgICAgICAgICBnbGlkZVRpbWUgPSB0aGlzLl9jYWxjdWxhdGVHbGlkZVRpbWUoIGV4aXN0aW5nRnJlcXVlbmN5LCBmcmVxdWVuY3kgKTtcblxuICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdC5yZXNldCggZnJlcXVlbmN5LCBkZXR1bmUgKyB0aGlzLnR1bmluZy52YWx1ZSAqIDEwMCwgdmVsb2NpdHksIGdsaWRlVGltZSApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fZmV0Y2hHZW5lcmF0b3JPYmplY3RUb1JldXNlKCk7XG4gICAgICAgICAgICAgICAgZXhpc3RpbmdGcmVxdWVuY3kgPSBnZW5lcmF0b3JPYmplY3RbIDAgXS5mcmVxdWVuY3k7XG4gICAgICAgICAgICAgICAgZ2xpZGVUaW1lID0gdGhpcy5fY2FsY3VsYXRlR2xpZGVUaW1lKCBleGlzdGluZ0ZyZXF1ZW5jeSwgZnJlcXVlbmN5ICk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB1bmlzb247ICsraSApIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0dW5lID0gdGhpcy5fY2FsY3VsYXRlRGV0dW5lKCBpICk7XG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdFsgaSBdLnJlc2V0KCBmcmVxdWVuY3ksIGRldHVuZSArIHRoaXMudHVuaW5nLnZhbHVlICogMTAwLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXR1cm4gdGhlIGdlbmVyYXRlZCBvYmplY3QocykgaW4gY2FzZSB0aGV5J3JlIG5lZWRlZC5cbiAgICAgICAgcmV0dXJuIHVuaXNvbkdlbmVyYXRvckFycmF5ID8gdW5pc29uR2VuZXJhdG9yQXJyYXkgOiBnZW5lcmF0b3JPYmplY3Q7XG4gICAgfVxuXG4gICAgc3RhcnQoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICkge1xuICAgICAgICB2YXIgZnJlcSA9IDAsXG4gICAgICAgICAgICB2ZWxvY2l0eVNlbnNpdGl2aXR5ID0gdGhpcy52ZWxvY2l0eVNlbnNpdGl2aXR5LnZhbHVlO1xuXG4gICAgICAgIHZlbG9jaXR5ID0gdHlwZW9mIHZlbG9jaXR5ID09PSAnbnVtYmVyJyA/IHZlbG9jaXR5IDogMTtcbiAgICAgICAgZGVsYXkgPSB0eXBlb2YgZGVsYXkgPT09ICdudW1iZXInID8gZGVsYXkgOiAwO1xuXG5cbiAgICAgICAgaWYgKCB2ZWxvY2l0eVNlbnNpdGl2aXR5ICE9PSAwICkge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSB0aGlzLk1hdGguc2NhbGVOdW1iZXIoIHZlbG9jaXR5LCAwLCAxLCAwLjUgLSB2ZWxvY2l0eVNlbnNpdGl2aXR5ICogMC41LCAwLjUgKyB2ZWxvY2l0eVNlbnNpdGl2aXR5ICogMC41IClcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gMC41O1xuICAgICAgICB9XG5cblxuICAgICAgICBpZiAoIHR5cGVvZiBmcmVxdWVuY3kgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5fc3RhcnRTaW5nbGUoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZWxzZSBpZiAoIGZyZXF1ZW5jeSBpbnN0YW5jZW9mIE5vdGUgKSB7XG4gICAgICAgIC8vICAgICBmcmVxID0gZnJlcXVlbmN5LnZhbHVlSHo7XG4gICAgICAgIC8vICAgICB0aGlzLl9zdGFydFNpbmdsZSggZnJlcSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gZWxzZSBpZiAoIGZyZXF1ZW5jeSBpbnN0YW5jZW9mIENob3JkICkge1xuICAgICAgICAvLyAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgZnJlcXVlbmN5Lm5vdGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAvLyAgICAgICAgIGZyZXEgPSBmcmVxdWVuY3kubm90ZXNbIGkgXS52YWx1ZUh6O1xuICAgICAgICAvLyAgICAgICAgIHRoaXMuX3N0YXJ0U2luZ2xlKCBmcmVxLCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG5cbiAgICBfc3RvcEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuZW52ZWxvcGUuc3RvcCggZ2VuZXJhdG9yT2JqZWN0Lm91dHB1dHNbIDAgXS5nYWluLCBkZWxheSApO1xuXG4gICAgICAgIGdlbmVyYXRvck9iamVjdC50aW1lciA9IHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gc2VsZi5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5wb3AoKTtcbiAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdC5zdG9wKCBkZWxheSApO1xuICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LmNsZWFuVXAoKTtcbiAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IG51bGw7XG4gICAgICAgIH0sIGRlbGF5ICogMTAwMCArIHRoaXMuZW52ZWxvcGUudG90YWxTdG9wVGltZSAqIDEwMDAgKyAxMDAgKTtcbiAgICB9XG5cbiAgICBfc3RvcFNpbmdsZSggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKSB7XG4gICAgICAgIHZhciBnZW5lcmF0b3JPYmplY3QgPSB0aGlzLl9mZXRjaEdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5ICk7XG5cbiAgICAgICAgaWYgKCBnZW5lcmF0b3JPYmplY3QgKSB7XG4gICAgICAgICAgICAvLyBTdG9wIGdlbmVyYXRvcnMgZm9ybWVkIHdoZW4gdW5pc29uIHdhcyA+IDEgYXQgdGltZSBvZiBzdGFydCguLi4pXG4gICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGdlbmVyYXRvck9iamVjdCApICkge1xuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gZ2VuZXJhdG9yT2JqZWN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdG9wR2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3RbIGkgXSwgZGVsYXkgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9wR2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSBudWxsO1xuICAgIH1cblxuICAgIHN0b3AoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICkge1xuICAgICAgICB2ZWxvY2l0eSA9IHR5cGVvZiB2ZWxvY2l0eSA9PT0gJ251bWJlcicgPyB2ZWxvY2l0eSA6IDA7XG4gICAgICAgIGRlbGF5ID0gdHlwZW9mIGRlbGF5ID09PSAnbnVtYmVyJyA/IGRlbGF5IDogMDtcblxuICAgICAgICBpZiAoIHR5cGVvZiBmcmVxdWVuY3kgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5fc3RvcFNpbmdsZSggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBlbHNlIGlmICggZnJlcXVlbmN5IGluc3RhbmNlb2YgTm90ZSApIHtcbiAgICAgICAgLy8gICAgIGZyZXEgPSBmcmVxdWVuY3kudmFsdWVIejtcbiAgICAgICAgLy8gICAgIHRoaXMuX3N0b3BTaW5nbGUoIGZyZXEsIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGVsc2UgaWYgKCBmcmVxdWVuY3kgaW5zdGFuY2VvZiBDaG9yZCApIHtcbiAgICAgICAgLy8gICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGZyZXF1ZW5jeS5ub3Rlcy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgLy8gICAgICAgICBmcmVxID0gZnJlcXVlbmN5Lm5vdGVzWyBpIF0udmFsdWVIejtcbiAgICAgICAgLy8gICAgICAgICB0aGlzLl9zdG9wU2luZ2xlKCBmcmVxLCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuXG4vLyBBdWRpb0lPLm1peGluU2luZ2xlKCBHZW5lcmF0b3JQbGF5ZXIucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5HZW5lcmF0b3JQbGF5ZXIucHJvdG90eXBlLk1hdGggPSBtYXRoO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVHZW5lcmF0b3JQbGF5ZXIgPSBmdW5jdGlvbiggb3B0aW9ucyApIHtcbiAgICByZXR1cm4gbmV3IEdlbmVyYXRvclBsYXllciggdGhpcywgb3B0aW9ucyApO1xufTsiLCJ3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuXG4vLyBDb3JlIGNvbXBvbmVudHMuXG5pbXBvcnQgQXVkaW9JTyBmcm9tICcuL2NvcmUvQXVkaW9JTy5lczYnO1xuaW1wb3J0IE5vZGUgZnJvbSAnLi9jb3JlL05vZGUuZXM2JztcbmltcG9ydCBQYXJhbSBmcm9tICcuL2NvcmUvUGFyYW0uZXM2JztcbmltcG9ydCAnLi9jb3JlL1dhdmVTaGFwZXIuZXM2JztcblxuXG4vLyBGWC5cbmltcG9ydCAnLi9meC9kZWxheS9EZWxheS5lczYnO1xuaW1wb3J0ICcuL2Z4L2RlbGF5L1BpbmdQb25nRGVsYXkuZXM2JztcbmltcG9ydCAnLi9meC9kZWxheS9TdGVyZW9EZWxheS5lczYnO1xuXG5pbXBvcnQgJy4vZngvZ2VuZXJhbC9EdWFsQ2hvcnVzLmVzNic7XG5pbXBvcnQgJy4vZngvZ2VuZXJhbC9TaW1wbGVDaG9ydXMuZXM2JztcblxuaW1wb3J0ICcuL2Z4L2VxL0N1c3RvbUVRLmVzNic7XG5pbXBvcnQgJy4vZngvZXEvRVEyQmFuZC5lczYnO1xuLy8gaW1wb3J0ICcuL2Z4L0JpdFJlZHVjdGlvbi5lczYnO1xuaW1wb3J0ICcuL2Z4L1NjaHJvZWRlckFsbFBhc3MuZXM2JztcbmltcG9ydCAnLi9meC9maWx0ZXJzL0ZpbHRlckJhbmsuZXM2JztcbmltcG9ydCAnLi9meC9maWx0ZXJzL0xQRmlsdGVyLmVzNic7XG5pbXBvcnQgJy4vZngvZmlsdGVycy9CUEZpbHRlci5lczYnO1xuaW1wb3J0ICcuL2Z4L2ZpbHRlcnMvSFBGaWx0ZXIuZXM2JztcbmltcG9ydCAnLi9meC9maWx0ZXJzL05vdGNoRmlsdGVyLmVzNic7XG5pbXBvcnQgJy4vZngvZmlsdGVycy9BbGxQYXNzRmlsdGVyLmVzNic7XG5pbXBvcnQgJy4vZngvZmlsdGVycy9Db21iRmlsdGVyLmVzNic7XG5pbXBvcnQgJy4vZngvc2F0dXJhdGlvbi9TaW5lU2hhcGVyLmVzNic7XG5pbXBvcnQgJy4vZngvdXRpbGl0eS9EQ1RyYXAuZXM2JztcbmltcG9ydCAnLi9meC91dGlsaXR5L0xGTy5lczYnO1xuaW1wb3J0ICcuL2Z4L3V0aWxpdHkvU3RlcmVvV2lkdGguZXM2JztcbmltcG9ydCAnLi9meC91dGlsaXR5L1N0ZXJlb1JvdGF0aW9uLmVzNic7XG5cbi8vIEdlbmVyYXRvcnMgYW5kIGluc3RydW1lbnRzLlxuaW1wb3J0ICcuL2dlbmVyYXRvcnMvT3NjaWxsYXRvckdlbmVyYXRvci5lczYnO1xuaW1wb3J0ICcuL2luc3RydW1lbnRzL0dlbmVyYXRvclBsYXllci5lczYnO1xuXG4vLyBNYXRoOiBUcmlnb25vbWV0cnlcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9EZWdUb1JhZC5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L1Npbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L0Nvcy5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L1Rhbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L1JhZFRvRGVnLmVzNic7XG5cbi8vIE1hdGg6IFJlbGF0aW9uYWwtb3BlcmF0b3JzIChpbmMuIGlmL2Vsc2UpXG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9FcXVhbFRvLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9FcXVhbFRvWmVyby5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvR3JlYXRlclRoYW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuWmVyby5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvR3JlYXRlclRoYW5FcXVhbFRvLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9JZkVsc2UuZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhblplcm8uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuRXF1YWxUby5lczYnO1xuXG4vLyBNYXRoOiBMb2dpY2FsIG9wZXJhdG9yc1xuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTG9naWNhbE9wZXJhdG9yLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9BTkQuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL09SLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OT1QuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL05BTkQuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL05PUi5lczYnO1xuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvWE9SLmVzNic7XG5cbi8vIE1hdGg6IEdlbmVyYWwuXG5pbXBvcnQgJy4vbWF0aC9BYnMuZXM2JztcbmltcG9ydCAnLi9tYXRoL0FkZC5lczYnO1xuaW1wb3J0ICcuL21hdGgvQXZlcmFnZS5lczYnO1xuaW1wb3J0ICcuL21hdGgvQ2xhbXAuZXM2JztcbmltcG9ydCAnLi9tYXRoL0NvbnN0YW50LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9EaXZpZGUuZXM2JztcbmltcG9ydCAnLi9tYXRoL0Zsb29yLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9NYXguZXM2JztcbmltcG9ydCAnLi9tYXRoL01pbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvTXVsdGlwbHkuZXM2JztcbmltcG9ydCAnLi9tYXRoL05lZ2F0ZS5lczYnO1xuaW1wb3J0ICcuL21hdGgvUG93LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9SZWNpcHJvY2FsLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9Sb3VuZC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU2NhbGUuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NjYWxlRXhwLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TaWduLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TcXJ0LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TdWJ0cmFjdC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3dpdGNoLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TcXVhcmUuZXM2JztcblxuLy8gTWF0aDogU3BlY2lhbC5cbmltcG9ydCAnLi9tYXRoL0xlcnAuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NhbXBsZURlbGF5LmVzNic7XG5cbi8vIEVudmVsb3Blc1xuaW1wb3J0ICcuL2VudmVsb3Blcy9DdXN0b21FbnZlbG9wZS5lczYnO1xuaW1wb3J0ICcuL2VudmVsb3Blcy9BRFNSRW52ZWxvcGUuZXM2JztcbmltcG9ydCAnLi9lbnZlbG9wZXMvQURFbnZlbG9wZS5lczYnO1xuaW1wb3J0ICcuL2VudmVsb3Blcy9BREJEU1JFbnZlbG9wZS5lczYnO1xuXG4vLyBHZW5lcmFsIGdyYXBoc1xuaW1wb3J0ICcuL2dyYXBocy9FUVNoZWxmLmVzNic7XG5pbXBvcnQgJy4vZ3JhcGhzL0NvdW50ZXIuZXM2JztcbmltcG9ydCAnLi9ncmFwaHMvRHJ5V2V0Tm9kZS5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9QaGFzZU9mZnNldC5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9Dcm9zc2ZhZGVyLmVzNic7XG5cbi8vIE9zY2lsbGF0b3JzOiBVc2luZyBXZWJBdWRpbyBvc2NpbGxhdG9yc1xuaW1wb3J0ICcuL29zY2lsbGF0b3JzL09zY2lsbGF0b3JCYW5rLmVzNic7XG5pbXBvcnQgJy4vb3NjaWxsYXRvcnMvTm9pc2VPc2NpbGxhdG9yQmFuay5lczYnO1xuaW1wb3J0ICcuL29zY2lsbGF0b3JzL0ZNT3NjaWxsYXRvci5lczYnO1xuaW1wb3J0ICcuL29zY2lsbGF0b3JzL1NpbmVCYW5rLmVzNic7XG5cbi8vIE9zY2lsbGF0b3JzOiBCdWZmZXItYmFzZWRcbmltcG9ydCAnLi9vc2NpbGxhdG9ycy9CdWZmZXJPc2NpbGxhdG9yLmVzNic7XG5cbi8vIFV0aWxzXG5pbXBvcnQgJy4vYnVmZmVycy9CdWZmZXJHZW5lcmF0b3JzLmVzNic7XG5pbXBvcnQgJy4vYnVmZmVycy9CdWZmZXJVdGlscy5lczYnO1xuaW1wb3J0ICcuL3V0aWxpdGllcy9VdGlscy5lczYnO1xuXG4vLyBpbXBvcnQgJy4vZ3JhcGhzL1NrZXRjaC5lczYnO1xuXG53aW5kb3cuUGFyYW0gPSBQYXJhbTtcbndpbmRvdy5Ob2RlID0gTm9kZTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG52YXIgU0hBUEVSUyA9IHt9O1xuXG5mdW5jdGlvbiBnZW5lcmF0ZVNoYXBlckN1cnZlKCBzaXplICkge1xuICAgIHZhciBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoIHNpemUgKSxcbiAgICAgICAgaSA9IDAsXG4gICAgICAgIHggPSAwO1xuXG4gICAgZm9yICggaTsgaSA8IHNpemU7ICsraSApIHtcbiAgICAgICAgeCA9ICggaSAvIHNpemUgKSAqIDIgLSAxO1xuICAgICAgICBhcnJheVsgaSBdID0gTWF0aC5hYnMoIHggKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJyYXk7XG59XG5cbmNsYXNzIEFicyBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCBhY2N1cmFjeSA9IDEwICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyB2YXIgZ2FpbkFjY3VyYWN5ID0gYWNjdXJhY3kgKiAxMDA7XG4gICAgICAgIHZhciBnYWluQWNjdXJhY3kgPSBNYXRoLnBvdyggYWNjdXJhY3ksIDIgKSxcbiAgICAgICAgICAgIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpLFxuICAgICAgICAgICAgc2l6ZSA9IDEwMjQgKiBhY2N1cmFjeTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAxIC8gZ2FpbkFjY3VyYWN5O1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gZ2FpbkFjY3VyYWN5O1xuXG4gICAgICAgIC8vIFRvIHNhdmUgY3JlYXRpbmcgbmV3IHNoYXBlciBjdXJ2ZXMgKHRoYXQgY2FuIGJlIHF1aXRlIGxhcmdlISlcbiAgICAgICAgLy8gZWFjaCB0aW1lIGFuIGluc3RhbmNlIG9mIEFicyBpcyBjcmVhdGVkLCBzaGFwZXIgY3VydmVzXG4gICAgICAgIC8vIGFyZSBzdG9yZWQgaW4gdGhlIFNIQVBFUlMgb2JqZWN0IGFib3ZlLiBUaGUga2V5cyB0byB0aGVcbiAgICAgICAgLy8gU0hBUEVSUyBvYmplY3QgYXJlIHRoZSBiYXNlIHdhdmV0YWJsZSBjdXJ2ZSBzaXplICgxMDI0KVxuICAgICAgICAvLyBtdWx0aXBsaWVkIGJ5IHRoZSBhY2N1cmFjeSBhcmd1bWVudC5cbiAgICAgICAgaWYoICFTSEFQRVJTWyBzaXplIF0gKSB7XG4gICAgICAgICAgICBTSEFQRVJTWyBzaXplIF0gPSBnZW5lcmF0ZVNoYXBlckN1cnZlKCBzaXplICk7XG4gICAgICAgIH1cblxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIFNIQVBFUlNbIHNpemUgXSApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUFicyA9IGZ1bmN0aW9uKCBhY2N1cmFjeSApIHtcbiAgICByZXR1cm4gbmV3IEFicyggdGhpcywgYWNjdXJhY3kgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBBZGRzIHR3byBhdWRpbyBzaWduYWxzIHRvZ2V0aGVyLlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKlxuICogdmFyIGFkZCA9IGlvLmNyZWF0ZUFkZCggMiApO1xuICogaW4xLmNvbm5lY3QoIGFkZCApO1xuICpcbiAqIHZhciBhZGQgPSBpby5jcmVhdGVBZGQoKTtcbiAqIGluMS5jb25uZWN0KCBhZGQsIDAsIDAgKTtcbiAqIGluMi5jb25uZWN0KCBhZGQsIDAsIDEgKTtcbiAqL1xuY2xhc3MgQWRkIGV4dGVuZHMgTm9kZXtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgXHRyZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICBcdHRoaXMuY29udHJvbHMudmFsdWUudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQWRkID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgQWRkKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbi8qXG4gICAgVGhlIGF2ZXJhZ2UgdmFsdWUgb2YgYSBzaWduYWwgaXMgY2FsY3VsYXRlZFxuICAgIGJ5IHBpcGluZyB0aGUgaW5wdXQgaW50byBhIHJlY3RpZmllciB0aGVuIGludG9cbiAgICBhIHNlcmllcyBvZiBEZWxheU5vZGVzLiBFYWNoIERlbGF5Tm9kZVxuICAgIGhhcyBpdCdzIGBkZWxheVRpbWVgIGNvbnRyb2xsZWQgYnkgZWl0aGVyIHRoZVxuICAgIGBzYW1wbGVTaXplYCBhcmd1bWVudCBvciB0aGUgaW5jb21pbmcgdmFsdWUgb2ZcbiAgICB0aGUgYGNvbnRyb2xzLnNhbXBsZVNpemVgIG5vZGUuIFRoZSBkZWxheVRpbWVcbiAgICBpcyB0aGVyZWZvcmUgbWVhc3VyZWQgaW4gc2FtcGxlcy5cblxuICAgIEVhY2ggZGVsYXkgaXMgY29ubmVjdGVkIHRvIGEgR2Fpbk5vZGUgdGhhdCB3b3Jrc1xuICAgIGFzIGEgc3VtbWluZyBub2RlLiBUaGUgc3VtbWluZyBub2RlJ3MgdmFsdWUgaXNcbiAgICB0aGVuIGRpdmlkZWQgYnkgdGhlIG51bWJlciBvZiBkZWxheXMgdXNlZCBiZWZvcmVcbiAgICBiZWluZyBzZW50IG9uIGl0cyBtZXJyeSB3YXkgdG8gdGhlIG91dHB1dC5cblxuICAgIE5vdGU6XG4gICAgSGlnaCB2YWx1ZXMgZm9yIGBudW1TYW1wbGVzYCB3aWxsIGJlIGV4cGVuc2l2ZSxcbiAgICBhcyB0aGF0IG1hbnkgRGVsYXlOb2RlcyB3aWxsIGJlIGNyZWF0ZWQuIENvbnNpZGVyXG4gICAgaW5jcmVhc2luZyB0aGUgYHNhbXBsZVNpemVgIGFuZCB1c2luZyBhIGxvdyB2YWx1ZVxuICAgIGZvciBgbnVtU2FtcGxlc2AuXG5cbiAgICBHcmFwaDpcbiAgICA9PT09PT1cbiAgICBpbnB1dCAtPlxuICAgICAgICBhYnMvcmVjdGlmeSAtPlxuICAgICAgICAgICAgYG51bVNhbXBsZXNgIG51bWJlciBvZiBkZWxheXMsIGluIHNlcmllcyAtPlxuICAgICAgICAgICAgICAgIHN1bSAtPlxuICAgICAgICAgICAgICAgICAgICBkaXZpZGUgYnkgYG51bVNhbXBsZXNgIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuXG4gKi9cbmNsYXNzIEF2ZXJhZ2UgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtU2FtcGxlcyA9IDEwLCBzYW1wbGVTaXplICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubnVtU2FtcGxlcyA9IG51bVNhbXBsZXM7XG5cbiAgICAgICAgLy8gQWxsIERlbGF5Tm9kZXMgd2lsbCBiZSBzdG9yZWQgaGVyZS5cbiAgICAgICAgZ3JhcGguZGVsYXlzID0gW107XG4gICAgICAgIGdyYXBoLmFicyA9IHRoaXMuaW8uY3JlYXRlQWJzKCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguYWJzICk7XG4gICAgICAgIGdyYXBoLnNhbXBsZVNpemUgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuc2FtcGxlU2l6ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHNhbXBsZVNpemUgKTtcbiAgICAgICAgZ3JhcGguc2FtcGxlU2l6ZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnNhbXBsZVNpemUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICAvLyBUaGlzIGlzIGEgcmVsYXRpdmVseSBleHBlbnNpdmUgY2FsY3VsYXRpb25cbiAgICAgICAgLy8gd2hlbiBjb21wYXJlZCB0byBkb2luZyBhIG11Y2ggc2ltcGxlciByZWNpcHJvY2FsIG11bHRpcGx5LlxuICAgICAgICAvLyB0aGlzLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCBudW1TYW1wbGVzLCB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSAqIDAuNSApO1xuXG4gICAgICAgIC8vIEF2b2lkIHRoZSBtb3JlIGV4cGVuc2l2ZSBkaXZpc2lvbiBhYm92ZSBieVxuICAgICAgICAvLyBtdWx0aXBseWluZyB0aGUgc3VtIGJ5IHRoZSByZWNpcHJvY2FsIG9mIG51bVNhbXBsZXMuXG4gICAgICAgIGdyYXBoLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIDEgLyBudW1TYW1wbGVzICk7XG4gICAgICAgIGdyYXBoLnN1bSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgZ3JhcGguc3VtLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSApO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuXG5cbiAgICAgICAgLy8gVHJpZ2dlciB0aGUgc2V0dGVyIGZvciBgbnVtU2FtcGxlc2AgdGhhdCB3aWxsIGNyZWF0ZVxuICAgICAgICAvLyB0aGUgZGVsYXkgc2VyaWVzLlxuICAgICAgICB0aGlzLm51bVNhbXBsZXMgPSBncmFwaC5udW1TYW1wbGVzO1xuICAgIH1cblxuICAgIGdldCBudW1TYW1wbGVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLm51bVNhbXBsZXM7XG4gICAgfVxuXG4gICAgc2V0IG51bVNhbXBsZXMoIG51bVNhbXBsZXMgKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKSxcbiAgICAgICAgICAgIGRlbGF5cyA9IGdyYXBoLmRlbGF5cztcblxuICAgICAgICAvLyBEaXNjb25uZWN0IGFuZCBudWxsaWZ5IGFueSBleGlzdGluZyBkZWxheSBub2Rlcy5cbiAgICAgICAgdGhpcy5fY2xlYW5VcFNpbmdsZSggZGVsYXlzICk7XG5cbiAgICAgICAgZ3JhcGgubnVtU2FtcGxlcyA9IG51bVNhbXBsZXM7XG4gICAgICAgIGdyYXBoLmRpdmlkZS52YWx1ZSA9IDEgLyBudW1TYW1wbGVzO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwLCBub2RlID0gZ3JhcGguYWJzOyBpIDwgbnVtU2FtcGxlczsgKytpICkge1xuICAgICAgICAgICAgdmFyIGRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgICAgICBkZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggZGVsYXkuZGVsYXlUaW1lICk7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QoIGRlbGF5ICk7XG4gICAgICAgICAgICBkZWxheS5jb25uZWN0KCBncmFwaC5zdW0gKTtcbiAgICAgICAgICAgIGdyYXBoLmRlbGF5cy5wdXNoKCBkZWxheSApO1xuICAgICAgICAgICAgbm9kZSA9IGRlbGF5O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUF2ZXJhZ2UgPSBmdW5jdGlvbiggbnVtU2FtcGxlcywgc2FtcGxlU2l6ZSApIHtcbiAgICByZXR1cm4gbmV3IEF2ZXJhZ2UoIHRoaXMsIG51bVNhbXBsZXMsIHNhbXBsZVNpemUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBDbGFtcCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbWluVmFsdWUsIG1heFZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTsgLy8gaW8sIDEsIDFcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubWluID0gdGhpcy5pby5jcmVhdGVNaW4oIG1heFZhbHVlICk7XG4gICAgICAgIGdyYXBoLm1heCA9IHRoaXMuaW8uY3JlYXRlTWF4KCBtaW5WYWx1ZSApO1xuXG4gICAgICAgIC8vIHRoaXMuaW5wdXRzID0gWyBncmFwaC5taW4gXTtcbiAgICAgICAgLy8gdGhpcy5vdXRwdXRzID0gWyBncmFwaC5tYXggXTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5taW4gKTtcbiAgICAgICAgZ3JhcGgubWluLmNvbm5lY3QoIGdyYXBoLm1heCApO1xuICAgICAgICBncmFwaC5tYXguY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLm1pbiA9IGdyYXBoLm1pbi5jb250cm9scy52YWx1ZTtcbiAgICAgICAgdGhpcy5jb250cm9scy5tYXggPSBncmFwaC5tYXguY29udHJvbHMudmFsdWU7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgbWluKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLm1heC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IG1pbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5tYXgudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgbWF4KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLm1pbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IG1heCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5taW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDbGFtcCA9IGZ1bmN0aW9uKCBtaW5WYWx1ZSwgbWF4VmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDbGFtcCggdGhpcywgbWluVmFsdWUsIG1heFZhbHVlICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gJy4uL2NvcmUvQXVkaW9JTy5lczYnO1xuaW1wb3J0IE5vZGUgZnJvbSAnLi4vY29yZS9Ob2RlLmVzNic7XG5cbmNsYXNzIENvbnN0YW50IGV4dGVuZHMgTm9kZSB7XG4gICAgLyoqXG4gICAgICogQSBjb25zdGFudC1yYXRlIGF1ZGlvIHNpZ25hbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyAgICBJbnN0YW5jZSBvZiBBdWRpb0lPXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIFZhbHVlIG9mIHRoZSBjb25zdGFudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgPSAwLjAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInID8gdmFsdWUgOiAwO1xuICAgICAgICB0aGlzLmlvLmNvbnN0YW50RHJpdmVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnQgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDb25zdGFudCggdGhpcywgdmFsdWUgKTtcbn07XG5cblxuLy8gQSBidW5jaCBvZiBwcmVzZXQgY29uc3RhbnRzLlxuKGZ1bmN0aW9uKCkge1xuICAgIHZhciBFLFxuICAgICAgICBQSSxcbiAgICAgICAgUEkyLFxuICAgICAgICBMTjEwLFxuICAgICAgICBMTjIsXG4gICAgICAgIExPRzEwRSxcbiAgICAgICAgTE9HMkUsXG4gICAgICAgIFNRUlQxXzIsXG4gICAgICAgIFNRUlQyO1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRFID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gRSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkUgKTtcbiAgICAgICAgRSA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudFBJID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gUEkgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5QSSApO1xuICAgICAgICBQSSA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudFBJMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFBJMiB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLlBJICogMiApO1xuICAgICAgICBQSTIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRMTjEwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gTE4xMCB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxOMTAgKTtcbiAgICAgICAgTE4xMCA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudExOMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IExOMiB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxOMiApO1xuICAgICAgICBMTjIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRMT0cxMEUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBMT0cxMEUgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5MT0cxMEUgKTtcbiAgICAgICAgTE9HMTBFID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50TE9HMkUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBMT0cyRSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxPRzJFICk7XG4gICAgICAgIExPRzJFID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50U1FSVDFfMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFNRUlQxXzIgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5TUVJUMV8yICk7XG4gICAgICAgIFNRUlQxXzIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRTUVJUMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFNRUlQyIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguU1FSVDIgKTtcbiAgICAgICAgU1FSVDIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xufSgpKTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIERpdmlkZXMgdHdvIG51bWJlcnNcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBEaXZpZGUgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlLCBtYXhJbnB1dCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSAwLjA7XG5cbiAgICAgICAgZ3JhcGgucmVjaXByb2NhbCA9IHRoaXMuaW8uY3JlYXRlUmVjaXByb2NhbCggbWF4SW5wdXQgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5yZWNpcHJvY2FsICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICBncmFwaC5yZWNpcHJvY2FsLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRpdmlzb3IgPSB0aGlzLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHNbIDEgXS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBtYXhJbnB1dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVjaXByb2NhbC5tYXhJbnB1dDtcbiAgICB9XG4gICAgc2V0IG1heElucHV0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsLm1heElucHV0ID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEaXZpZGUgPSBmdW5jdGlvbiggdmFsdWUsIG1heElucHV0ICkge1xuICAgIHJldHVybiBuZXcgRGl2aWRlKCB0aGlzLCB2YWx1ZSwgbWF4SW5wdXQgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vLyBOT1RFOlxuLy8gIE9ubHkgYWNjZXB0cyB2YWx1ZXMgPj0gLTEgJiYgPD0gMS4gVmFsdWVzIG91dHNpZGVcbi8vICB0aGlzIHJhbmdlIGFyZSBjbGFtcGVkIHRvIHRoaXMgcmFuZ2UuXG5jbGFzcyBGbG9vciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuRmxvb3IgKTtcblxuICAgICAgICAvLyBUaGlzIGJyYW5jaGluZyBpcyBiZWNhdXNlIGlucHV0dGluZyBgMGAgdmFsdWVzXG4gICAgICAgIC8vIGludG8gdGhlIHdhdmVzaGFwZXIgYWJvdmUgb3V0cHV0cyAtMC41IDsoXG4gICAgICAgIGdyYXBoLmlmRWxzZSA9IHRoaXMuaW8uY3JlYXRlSWZFbHNlKCk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG9aZXJvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZXF1YWxUb1plcm8gKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUb1plcm8uY29ubmVjdCggZ3JhcGguaWZFbHNlLmlmICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguaWZFbHNlLnRoZW4gKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIGdyYXBoLmlmRWxzZS5lbHNlICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguaWZFbHNlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUZsb29yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBGbG9vciggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMZXJwIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIHN0YXJ0LCBlbmQsIGRlbHRhICkge1xuICAgICAgICBzdXBlciggaW8sIDMsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguYWRkID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgZ3JhcGguc3VidHJhY3QgPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIGdyYXBoLnN0YXJ0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggc3RhcnQgKTtcbiAgICAgICAgZ3JhcGguZW5kID0gdGhpcy5pby5jcmVhdGVQYXJhbSggZW5kICk7XG4gICAgICAgIGdyYXBoLmRlbHRhID0gdGhpcy5pby5jcmVhdGVQYXJhbSggZGVsdGEgKTtcblxuICAgICAgICBncmFwaC5lbmQuY29ubmVjdCggZ3JhcGguc3VidHJhY3QsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguc3RhcnQuY29ubmVjdCggZ3JhcGguc3VidHJhY3QsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguc3VidHJhY3QuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguZGVsdGEuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5zdGFydC5jb25uZWN0KCBncmFwaC5hZGQsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggZ3JhcGguYWRkLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGguYWRkLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zdGFydCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLmVuZCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMiBdLmNvbm5lY3QoIGdyYXBoLmRlbHRhICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5zdGFydCA9IGdyYXBoLnN0YXJ0O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmVuZCA9IGdyYXBoLmVuZDtcbiAgICAgICAgdGhpcy5jb250cm9scy5kZWx0YSA9IGdyYXBoLmRlbHRhO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHN0YXJ0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLnN0YXJ0LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgc3RhcnQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkuc3RhcnQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgZW5kKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLmVuZC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGVuZCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5lbmQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgZGVsdGEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkuZGVsdGEudmFsdWU7XG4gICAgfVxuICAgIHNldCBkZWx0YSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5kZWx0YS52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVycCA9IGZ1bmN0aW9uKCBzdGFydCwgZW5kLCBkZWx0YSApIHtcbiAgICByZXR1cm4gbmV3IExlcnAoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBXaGVuIGlucHV0IGlzIDwgYHZhbHVlYCwgb3V0cHV0cyBgdmFsdWVgLCBvdGhlcndpc2Ugb3V0cHV0cyBpbnB1dC5cbiAqIEBwYXJhbSB7QXVkaW9JT30gaW8gICBBdWRpb0lPIGluc3RhbmNlXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgVGhlIG1pbmltdW0gdmFsdWUgdG8gdGVzdCBhZ2FpbnN0LlxuICovXG5cbmNsYXNzIE1heCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5ncmVhdGVyVGhhbiA9IHRoaXMuaW8uY3JlYXRlR3JlYXRlclRoYW4oKTtcbiAgICAgICAgZ3JhcGguc3dpdGNoID0gdGhpcy5pby5jcmVhdGVTd2l0Y2goIDIsIDAgKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5ncmVhdGVyVGhhbi5jb250cm9scy52YWx1ZSApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAxIF0gKTtcbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW4uY29ubmVjdCggZ3JhcGguc3dpdGNoLmNvbnRyb2wgKTtcbiAgICAgICAgZ3JhcGguc3dpdGNoLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVNYXggPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBNYXgoIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogV2hlbiBpbnB1dCBpcyA+IGB2YWx1ZWAsIG91dHB1dHMgYHZhbHVlYCwgb3RoZXJ3aXNlIG91dHB1dHMgaW5wdXQuXG4gKiBAcGFyYW0ge0F1ZGlvSU99IGlvICAgQXVkaW9JTyBpbnN0YW5jZVxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIFRoZSBtaW5pbXVtIHZhbHVlIHRvIHRlc3QgYWdhaW5zdC5cbiAqL1xuY2xhc3MgTWluIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmxlc3NUaGFuID0gdGhpcy5pby5jcmVhdGVMZXNzVGhhbigpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubGVzc1RoYW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5sZXNzVGhhbi5jb250cm9scy52YWx1ZSApO1xuXG4gICAgICAgIGdyYXBoLnN3aXRjaCA9IHRoaXMuaW8uY3JlYXRlU3dpdGNoKCAyLCAwICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAxIF0gKTtcbiAgICAgICAgZ3JhcGgubGVzc1RoYW4uY29ubmVjdCggZ3JhcGguc3dpdGNoLmNvbnRyb2wgKTtcbiAgICAgICAgZ3JhcGguc3dpdGNoLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU1pbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IE1pbiggdGhpcywgdmFsdWUgKTtcbn07IiwiIGltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gYXVkaW8gc2lnbmFscyB0b2dldGhlci5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBNdWx0aXBseSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gMC4wO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXS5nYWluICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW5wdXRzWyAxIF07XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVNdWx0aXBseSA9IGZ1bmN0aW9uKCB2YWx1ZTEsIHZhbHVlMiApIHtcbiAgICByZXR1cm4gbmV3IE11bHRpcGx5KCB0aGlzLCB2YWx1ZTEsIHZhbHVlMiApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIE5lZ2F0ZXMgdGhlIGluY29taW5nIGF1ZGlvIHNpZ25hbC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBOZWdhdGUgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMCApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICB0aGlzLm91dHB1dHMgPSB0aGlzLmlucHV0cztcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTmVnYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBOZWdhdGUoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqXG4gKiBOb3RlOiBET0VTIE5PVCBIQU5ETEUgTkVHQVRJVkUgUE9XRVJTLlxuICovXG5jbGFzcyBQb3cgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbGllcnMgPSBbXTtcbiAgICAgICAgZ3JhcGgudmFsdWUgPSB2YWx1ZTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIG5vZGUgPSB0aGlzLmlucHV0c1sgMCBdOyBpIDwgdmFsdWUgLSAxOyArK2kgKSB7XG4gICAgICAgICAgICBncmFwaC5tdWx0aXBsaWVyc1sgaSBdID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5tdWx0aXBsaWVyc1sgaSBdLmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0gKTtcbiAgICAgICAgICAgIG5vZGUgPSBncmFwaC5tdWx0aXBsaWVyc1sgaSBdO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLnZhbHVlID0gbnVsbDtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmRpc2Nvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyAwIF0gKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IGdyYXBoLm11bHRpcGxpZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgICAgZ3JhcGgubXVsdGlwbGllcnNbIGkgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICBncmFwaC5tdWx0aXBsaWVycy5zcGxpY2UoIGksIDEgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgbm9kZSA9IHRoaXMuaW5wdXRzWyAwIF07IGkgPCB2YWx1ZSAtIDE7ICsraSApIHtcbiAgICAgICAgICAgIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0uY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdCggZ3JhcGgubXVsdGlwbGllcnNbIGkgXSApO1xuICAgICAgICAgICAgbm9kZSA9IGdyYXBoLm11bHRpcGxpZXJzWyBpIF07XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgZ3JhcGgudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBvdyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFBvdyggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBPdXRwdXRzIHRoZSB2YWx1ZSBvZiAxIC8gaW5wdXRWYWx1ZSAob3IgcG93KGlucHV0VmFsdWUsIC0xKSlcbiAqIFdpbGwgYmUgdXNlZnVsIGZvciBkb2luZyBtdWx0aXBsaWNhdGl2ZSBkaXZpc2lvbi5cbiAqXG4gKiBUT0RPOlxuICogICAgIC0gVGhlIHdhdmVzaGFwZXIgaXNuJ3QgYWNjdXJhdGUuIEl0IHB1bXBzIG91dCB2YWx1ZXMgZGlmZmVyaW5nXG4gKiAgICAgICBieSAxLjc5MDY3OTMxNDAzMDE1MjVlLTkgb3IgbW9yZS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgUmVjaXByb2NhbCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbWF4SW5wdXQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBmYWN0b3IgPSBtYXhJbnB1dCB8fCAxMDAsXG4gICAgICAgICAgICBnYWluID0gTWF0aC5wb3coIGZhY3RvciwgLTEgKSxcbiAgICAgICAgICAgIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm1heElucHV0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgubWF4SW5wdXQuZ2Fpbi5zZXRWYWx1ZUF0VGltZSggZ2FpbiwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG5cbiAgICAgICAgLy8gdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi5zZXRWYWx1ZUF0VGltZSggMC4wLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcblxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLlJlY2lwcm9jYWwgKTtcblxuICAgICAgICAvLyB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4uc2V0VmFsdWVBdFRpbWUoIDAuMCwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG5cbiAgICAgICAgdGhpcy5pby5jb25zdGFudERyaXZlci5jb25uZWN0KCBncmFwaC5tYXhJbnB1dCApO1xuICAgICAgICBncmFwaC5tYXhJbnB1dC5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdLmdhaW4gKTtcbiAgICAgICAgZ3JhcGgubWF4SW5wdXQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IG1heElucHV0KCkge1xuICAgICAgICByZXR1cm4gZ3JhcGgubWF4SW5wdXQuZ2FpbjtcbiAgICB9XG4gICAgc2V0IG1heElucHV0KCB2YWx1ZSApIHtcbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGlmICggdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIGdyYXBoLm1heElucHV0LmdhaW4uY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICAgICAgICAgIGdyYXBoLm1heElucHV0LmdhaW4uc2V0VmFsdWVBdFRpbWUoIDEgLyB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVJlY2lwcm9jYWwgPSBmdW5jdGlvbiggbWF4SW5wdXQgKSB7XG4gICAgcmV0dXJuIG5ldyBSZWNpcHJvY2FsKCB0aGlzLCBtYXhJbnB1dCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBOT1RFOlxuLy8gIE9ubHkgYWNjZXB0cyB2YWx1ZXMgPj0gLTEgJiYgPD0gMS4gVmFsdWVzIG91dHNpZGVcbi8vICB0aGlzIHJhbmdlIGFyZSBjbGFtcGVkIHRvIHRoaXMgcmFuZ2UuXG5jbGFzcyBSb3VuZCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmZsb29yID0gdGhpcy5pby5jcmVhdGVGbG9vcigpO1xuICAgICAgICBncmFwaC5hZGQgPSB0aGlzLmlvLmNyZWF0ZUFkZCggMC41ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWzBdLmNvbm5lY3QoIGdyYXBoLmFkZCApO1xuICAgICAgICBncmFwaC5hZGQuY29ubmVjdCggZ3JhcGguZmxvb3IgKTtcbiAgICAgICAgZ3JhcGguZmxvb3IuY29ubmVjdCggdGhpcy5vdXRwdXRzWzBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVJvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSb3VuZCggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKlxuICAgIEFsc28ga25vd24gYXMgei0xLCB0aGlzIG5vZGUgZGVsYXlzIHRoZSBpbnB1dCBieVxuICAgIG9uZSBzYW1wbGUuXG4gKi9cbmNsYXNzIFNhbXBsZURlbGF5IGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICBncmFwaC5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGU7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5kZWxheSApO1xuICAgICAgICBncmFwaC5kZWxheS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG4vLyBUaGUgZmFjdG9yeSBmb3IgU2FtcGxlRGVsYXkgaGFzIGFuIGFsaWFzIHRvIGl0J3MgbW9yZSBjb21tb24gbmFtZSFcbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNhbXBsZURlbGF5ID0gQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlWk1pbnVzT25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBTYW1wbGVEZWxheSggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBHaXZlbiBhbiBpbnB1dCB2YWx1ZSBhbmQgaXRzIGhpZ2ggYW5kIGxvdyBib3VuZHMsIHNjYWxlXG4vLyB0aGF0IHZhbHVlIHRvIG5ldyBoaWdoIGFuZCBsb3cgYm91bmRzLlxuLy9cbi8vIEZvcm11bGEgZnJvbSBNYXhNU1AncyBTY2FsZSBvYmplY3Q6XG4vLyAgaHR0cDovL3d3dy5jeWNsaW5nNzQuY29tL2ZvcnVtcy90b3BpYy5waHA/aWQ9MjY1OTNcbi8vXG4vLyAoKGlucHV0LWxvd0luKSAvIChoaWdoSW4tbG93SW4pKSAqIChoaWdoT3V0LWxvd091dCkgKyBsb3dPdXQ7XG5cblxuLy8gVE9ETzpcbi8vICAtIEFkZCBjb250cm9scyFcbmNsYXNzIFNjYWxlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93SW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoSW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dPdXQgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaE91dCApO1xuXG5cbiAgICAgICAgLy8gKGlucHV0LWxvd0luKVxuICAgICAgICBncmFwaC5pbnB1dE1pbnVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguaW5wdXRNaW51c0xvd0luLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4uY29ubmVjdCggZ3JhcGguaW5wdXRNaW51c0xvd0luLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hJbi1sb3dJbilcbiAgICAgICAgZ3JhcGguaGlnaEluTWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4uY29ubmVjdCggZ3JhcGguaGlnaEluTWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoKGlucHV0LWxvd0luKSAvIChoaWdoSW4tbG93SW4pKVxuICAgICAgICBncmFwaC5kaXZpZGUgPSB0aGlzLmlvLmNyZWF0ZURpdmlkZSgpO1xuICAgICAgICBncmFwaC5pbnB1dE1pbnVzTG93SW4uY29ubmVjdCggZ3JhcGguZGl2aWRlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4uY29ubmVjdCggZ3JhcGguZGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hPdXQtbG93T3V0KVxuICAgICAgICBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQgPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaE91dC5jb25uZWN0KCBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSkgKiAoaGlnaE91dC1sb3dPdXQpXG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSkgKiAoaGlnaE91dC1sb3dPdXQpICsgbG93T3V0XG4gICAgICAgIGdyYXBoLmFkZCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5LmNvbm5lY3QoIGdyYXBoLmFkZCwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5hZGQsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5hZGQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCBsb3dJbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMubG93SW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBsb3dJbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgaGlnaEluKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5oaWdoSW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoSW4oIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hJbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBsb3dPdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmxvd091dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd091dCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGhpZ2hPdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQudmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoT3V0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNjYWxlID0gZnVuY3Rpb24oIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCApIHtcbiAgICByZXR1cm4gbmV3IFNjYWxlKCB0aGlzLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gR2l2ZW4gYW4gaW5wdXQgdmFsdWUgYW5kIGl0cyBoaWdoIGFuZCBsb3cgYm91bmRzLCBzY2FsZVxuLy8gdGhhdCB2YWx1ZSB0byBuZXcgaGlnaCBhbmQgbG93IGJvdW5kcy5cbi8vXG4vLyBGb3JtdWxhIGZyb20gTWF4TVNQJ3MgU2NhbGUgb2JqZWN0OlxuLy8gIGh0dHA6Ly93d3cuY3ljbGluZzc0LmNvbS9mb3J1bXMvdG9waWMucGhwP2lkPTI2NTkzXG4vL1xuLy8gaWYoIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikgPT09IDAgKSB7XG4vLyAgICAgcmV0dXJuIGxvd091dDtcbi8vIH1cbi8vIGVsc2UgaWYoIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikgPiAwICkge1xuLy8gICAgIHJldHVybiBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiBNYXRoLnBvdyggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKTtcbi8vIH1cbi8vIGVsc2Uge1xuLy8gICAgIHJldHVybiBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiAtKE1hdGgucG93KCAoLWlucHV0ICsgbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKSk7XG4vLyB9XG5cbi8vIFRPRE86XG4vLyAgLSBBZGQgY29udHJvbHNcbmNsYXNzIFNjYWxlRXhwIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQsIGV4cG9uZW50ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgLy8gbG93SW4gPSB0eXBlb2YgbG93SW4gPT09ICdudW1iZXInID8gbG93SW4gOiAwO1xuICAgICAgICAvLyBoaWdoSW4gPSB0eXBlb2YgaGlnaEluID09PSAnbnVtYmVyJyA/IGhpZ2hJbiA6IDE7XG4gICAgICAgIC8vIGxvd091dCA9IHR5cGVvZiBsb3dPdXQgPT09ICdudW1iZXInID8gbG93T3V0IDogMDtcbiAgICAgICAgLy8gaGlnaE91dCA9IHR5cGVvZiBoaWdoT3V0ID09PSAnbnVtYmVyJyA/IGhpZ2hPdXQgOiAxMDtcbiAgICAgICAgLy8gZXhwb25lbnQgPSB0eXBlb2YgZXhwb25lbnQgPT09ICdudW1iZXInID8gZXhwb25lbnQgOiAxO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dJbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hJbiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hJbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd091dCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoT3V0ICk7XG4gICAgICAgIGdyYXBoLl9leHBvbmVudCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGV4cG9uZW50ICk7XG5cblxuICAgICAgICAvLyAoaW5wdXQgLSBsb3dJbilcbiAgICAgICAgZ3JhcGguaW5wdXRNaW51c0xvd0luID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmlucHV0TWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLmlucHV0TWludXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vICgtaW5wdXQgKyBsb3dJbilcbiAgICAgICAgZ3JhcGgubWludXNJbnB1dCA9IHRoaXMuaW8uY3JlYXRlTmVnYXRlKCk7XG4gICAgICAgIGdyYXBoLm1pbnVzSW5wdXRQbHVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm1pbnVzSW5wdXQgKTtcbiAgICAgICAgZ3JhcGgubWludXNJbnB1dC5jb25uZWN0KCBncmFwaC5taW51c0lucHV0UGx1c0xvd0luLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4uY29ubmVjdCggZ3JhcGgubWludXNJbnB1dFBsdXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vIChoaWdoSW4gLSBsb3dJbilcbiAgICAgICAgZ3JhcGguaGlnaEluTWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4uY29ubmVjdCggZ3JhcGguaGlnaEluTWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSlcbiAgICAgICAgZ3JhcGguZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgZ3JhcGguaW5wdXRNaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5oaWdoSW5NaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIC8vICgtaW5wdXQgKyBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pXG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlRGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgZ3JhcGgubWludXNJbnB1dFBsdXNMb3dJbi5jb25uZWN0KCBncmFwaC5uZWdhdGl2ZURpdmlkZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5oaWdoSW5NaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlRGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hPdXQgLSBsb3dPdXQpXG4gICAgICAgIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dCA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0LmNvbm5lY3QoIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dCwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQsIDAsIDEgKTtcblxuICAgICAgICAvLyBNYXRoLnBvdyggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKVxuICAgICAgICBncmFwaC5wb3cgPSB0aGlzLmlvLmNyZWF0ZVBvdyggZXhwb25lbnQgKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlLmNvbm5lY3QoIGdyYXBoLnBvdyApO1xuXG4gICAgICAgIC8vIC0oTWF0aC5wb3coICgtaW5wdXQgKyBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApKVxuICAgICAgICBncmFwaC5uZWdhdGl2ZVBvd05lZ2F0ZSA9IHRoaXMuaW8uY3JlYXRlTmVnYXRlKCk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlUG93ID0gdGhpcy5pby5jcmVhdGVQb3coIGV4cG9uZW50ICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlRGl2aWRlLmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlUG93ICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlUG93LmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlUG93TmVnYXRlICk7XG5cblxuICAgICAgICAvLyBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiBNYXRoLnBvdyggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKTtcbiAgICAgICAgZ3JhcGguZWxzZUlmQnJhbmNoID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgZ3JhcGguZWxzZUlmTXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dC5jb25uZWN0KCBncmFwaC5lbHNlSWZNdWx0aXBseSwgMCwgMCApO1xuICAgICAgICBncmFwaC5wb3cuY29ubmVjdCggZ3JhcGguZWxzZUlmTXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguZWxzZUlmQnJhbmNoLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmVsc2VJZk11bHRpcGx5LmNvbm5lY3QoIGdyYXBoLmVsc2VJZkJyYW5jaCwgMCwgMSApO1xuXG4gICAgICAgIC8vIGxvd091dCArIChoaWdoT3V0IC0gbG93T3V0KSAqIC0oTWF0aC5wb3coICgtaW5wdXQgKyBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApKTtcbiAgICAgICAgZ3JhcGguZWxzZUJyYW5jaCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLmVsc2VNdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LmNvbm5lY3QoIGdyYXBoLmVsc2VNdWx0aXBseSwgMCwgMCApO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZVBvd05lZ2F0ZS5jb25uZWN0KCBncmFwaC5lbHNlTXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguZWxzZUJyYW5jaCwgMCwgMCApO1xuICAgICAgICBncmFwaC5lbHNlTXVsdGlwbHkuY29ubmVjdCggZ3JhcGguZWxzZUJyYW5jaCwgMCwgMSApO1xuXG5cblxuICAgICAgICAvLyBlbHNlIGlmKCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID4gMCApIHtcbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW5aZXJvID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhblplcm8oKTtcbiAgICAgICAgZ3JhcGguaWZHcmVhdGVyVGhhblplcm8gPSB0aGlzLmlvLmNyZWF0ZUlmRWxzZSgpO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW5aZXJvICk7XG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuWmVyby5jb25uZWN0KCBncmFwaC5pZkdyZWF0ZXJUaGFuWmVyby5pZiApO1xuICAgICAgICBncmFwaC5lbHNlSWZCcmFuY2guY29ubmVjdCggZ3JhcGguaWZHcmVhdGVyVGhhblplcm8udGhlbiApO1xuICAgICAgICBncmFwaC5lbHNlQnJhbmNoLmNvbm5lY3QoIGdyYXBoLmlmR3JlYXRlclRoYW5aZXJvLmVsc2UgKTtcblxuICAgICAgICAvLyBpZigoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID09PSAwKVxuICAgICAgICBncmFwaC5lcXVhbHNaZXJvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuICAgICAgICBncmFwaC5pZkVxdWFsc1plcm8gPSB0aGlzLmlvLmNyZWF0ZUlmRWxzZSgpO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggZ3JhcGguZXF1YWxzWmVybyApO1xuICAgICAgICBncmFwaC5lcXVhbHNaZXJvLmNvbm5lY3QoIGdyYXBoLmlmRXF1YWxzWmVyby5pZiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5pZkVxdWFsc1plcm8udGhlbiApO1xuICAgICAgICBncmFwaC5pZkdyZWF0ZXJUaGFuWmVyby5jb25uZWN0KCBncmFwaC5pZkVxdWFsc1plcm8uZWxzZSApO1xuXG4gICAgICAgIGdyYXBoLmlmRXF1YWxzWmVyby5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IGxvd0luKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5sb3dJbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd0luKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBoaWdoSW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmhpZ2hJbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGhpZ2hJbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEluLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGxvd091dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMubG93T3V0LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbG93T3V0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgaGlnaE91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuaGlnaE91dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGhpZ2hPdXQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgZXhwb25lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkuX2V4cG9uZW50LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgZXhwb25lbnQoIHZhbHVlICkge1xuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG4gICAgICAgIGdyYXBoLl9leHBvbmVudC52YWx1ZSA9IHZhbHVlO1xuICAgICAgICBncmFwaC5wb3cudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVQb3cudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2NhbGVFeHAgPSBmdW5jdGlvbiggbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHBvbmVudCApIHtcbiAgICByZXR1cm4gbmV3IFNjYWxlRXhwKCB0aGlzLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQsIGV4cG9uZW50ICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIFNpZ24gZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuU2lnbiApO1xuXG4gICAgICAgIGdyYXBoLmlmRWxzZSA9IHRoaXMuaW8uY3JlYXRlSWZFbHNlKCk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG9aZXJvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZXF1YWxUb1plcm8gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5pZkVsc2UudGhlbiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuXG4gICAgICAgIGdyYXBoLmVxdWFsVG9aZXJvLmNvbm5lY3QoIGdyYXBoLmlmRWxzZS5pZiApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggZ3JhcGguaWZFbHNlLmVsc2UgKTtcbiAgICAgICAgZ3JhcGguaWZFbHNlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNpZ24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFNpZ24oIHRoaXMgKTtcbn07XG4iLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NZXRob2RzX29mX2NvbXB1dGluZ19zcXVhcmVfcm9vdHMjRXhhbXBsZVxuLy9cbi8vIGZvciggdmFyIGkgPSAwLCB4OyBpIDwgc2lnRmlndXJlczsgKytpICkge1xuLy8gICAgICBpZiggaSA9PT0gMCApIHtcbi8vICAgICAgICAgIHggPSBzaWdGaWd1cmVzICogTWF0aC5wb3coIDEwLCAyICk7XG4vLyAgICAgIH1cbi8vICAgICAgZWxzZSB7XG4vLyAgICAgICAgICB4ID0gMC41ICogKCB4ICsgKGlucHV0IC8geCkgKTtcbi8vICAgICAgfVxuLy8gfVxuXG4vLyBUT0RPOlxuLy8gIC0gTWFrZSBzdXJlIFNxcnQgdXNlcyBnZXRHcmFwaCBhbmQgc2V0R3JhcGguXG5jbGFzcyBTcXJ0SGVscGVyIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHByZXZpb3VzU3RlcCwgaW5wdXQsIG1heElucHV0ICkge1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gaW8uY3JlYXRlTXVsdGlwbHkoIDAuNSApO1xuICAgICAgICB0aGlzLmRpdmlkZSA9IGlvLmNyZWF0ZURpdmlkZSggbnVsbCwgbWF4SW5wdXQgKTtcbiAgICAgICAgdGhpcy5hZGQgPSBpby5jcmVhdGVBZGQoKTtcblxuICAgICAgICAvLyBpbnB1dCAvIHg7XG4gICAgICAgIGlucHV0LmNvbm5lY3QoIHRoaXMuZGl2aWRlLCAwLCAwICk7XG4gICAgICAgIHByZXZpb3VzU3RlcC5vdXRwdXQuY29ubmVjdCggdGhpcy5kaXZpZGUsIDAsIDEgKTtcblxuICAgICAgICAvLyB4ICsgKCBpbnB1dCAvIHggKVxuICAgICAgICBwcmV2aW91c1N0ZXAub3V0cHV0LmNvbm5lY3QoIHRoaXMuYWRkLCAwLCAwICk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNvbm5lY3QoIHRoaXMuYWRkLCAwLCAxICk7XG5cbiAgICAgICAgLy8gMC41ICogKCB4ICsgKCBpbnB1dCAvIHggKSApXG4gICAgICAgIHRoaXMuYWRkLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkgKTtcblxuICAgICAgICB0aGlzLm91dHB1dCA9IHRoaXMubXVsdGlwbHk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5tdWx0aXBseS5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5hZGQuY2xlYW5VcCgpO1xuXG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSBudWxsO1xuICAgICAgICB0aGlzLmRpdmlkZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYWRkID0gbnVsbDtcbiAgICAgICAgdGhpcy5vdXRwdXQgPSBudWxsO1xuICAgIH1cbn1cblxuY2xhc3MgU3FydCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgc2lnbmlmaWNhbnRGaWd1cmVzLCBtYXhJbnB1dCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gRGVmYXVsdCB0byA2IHNpZ25pZmljYW50IGZpZ3VyZXMuXG4gICAgICAgIHNpZ25pZmljYW50RmlndXJlcyA9IHNpZ25pZmljYW50RmlndXJlcyB8fCA2O1xuXG4gICAgICAgIG1heElucHV0ID0gbWF4SW5wdXQgfHwgMTAwO1xuXG4gICAgICAgIHRoaXMueDAgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCBzaWduaWZpY2FudEZpZ3VyZXMgKiBNYXRoLnBvdyggMTAsIDIgKSApO1xuXG4gICAgICAgIHRoaXMuc3RlcHMgPSBbIHtcbiAgICAgICAgICAgIG91dHB1dDogdGhpcy54MFxuICAgICAgICB9IF07XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAxOyBpIDwgc2lnbmlmaWNhbnRGaWd1cmVzOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnB1c2goXG4gICAgICAgICAgICAgICAgbmV3IFNxcnRIZWxwZXIoIHRoaXMuaW8sIHRoaXMuc3RlcHNbIGkgLSAxIF0sIHRoaXMuaW5wdXRzWyAwIF0sIG1heElucHV0IClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0ZXBzWyB0aGlzLnN0ZXBzLmxlbmd0aCAtIDEgXS5vdXRwdXQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICAvLyBjbGVhblVwKCkge1xuICAgIC8vICAgICBzdXBlcigpO1xuXG4gICAgLy8gICAgIHRoaXMueDAuY2xlYW5VcCgpO1xuXG4gICAgLy8gICAgIHRoaXMuc3RlcHNbIDAgXSA9IG51bGw7XG5cbiAgICAvLyAgICAgZm9yKCB2YXIgaSA9IHRoaXMuc3RlcHMubGVuZ3RoIC0gMTsgaSA+PSAxOyAtLWkgKSB7XG4gICAgLy8gICAgICAgICB0aGlzLnN0ZXBzWyBpIF0uY2xlYW5VcCgpO1xuICAgIC8vICAgICAgICAgdGhpcy5zdGVwc1sgaSBdID0gbnVsbDtcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIHRoaXMueDAgPSBudWxsO1xuICAgIC8vICAgICB0aGlzLnN0ZXBzID0gbnVsbDtcbiAgICAvLyB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3FydCA9IGZ1bmN0aW9uKCBzaWduaWZpY2FudEZpZ3VyZXMsIG1heElucHV0ICkge1xuICAgIHJldHVybiBuZXcgU3FydCggdGhpcywgc2lnbmlmaWNhbnRGaWd1cmVzLCBtYXhJbnB1dCApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBTcXVhcmUgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3F1YXJlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBTcXVhcmUoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBTdWJ0cmFjdHMgdGhlIHNlY29uZCBpbnB1dCBmcm9tIHRoZSBmaXJzdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgU3VidHJhY3QgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubmVnYXRlID0gdGhpcy5pby5jcmVhdGVOZWdhdGUoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubmVnYXRlICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0ZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3VidHJhY3QgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBTdWJ0cmFjdCggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgU3dpdGNoIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyBFbnN1cmUgc3RhcnRpbmdDYXNlIGlzIG5ldmVyIDwgMFxuICAgICAgICBzdGFydGluZ0Nhc2UgPSB0eXBlb2Ygc3RhcnRpbmdDYXNlID09PSAnbnVtYmVyJyA/IE1hdGguYWJzKCBzdGFydGluZ0Nhc2UgKSA6IHN0YXJ0aW5nQ2FzZTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguY2FzZXMgPSBbXTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggc3RhcnRpbmdDYXNlICk7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgbnVtQ2FzZXM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXS5nYWluLnZhbHVlID0gMC4wO1xuICAgICAgICAgICAgZ3JhcGguY2FzZXNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbyggaSApO1xuICAgICAgICAgICAgZ3JhcGguY2FzZXNbIGkgXS5jb25uZWN0KCB0aGlzLmlucHV0c1sgaSBdLmdhaW4gKTtcbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuaW5kZXguY29ubmVjdCggZ3JhcGguY2FzZXNbIGkgXSApO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgY29udHJvbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuaW5kZXguY29udHJvbDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmluZGV4LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4LnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVN3aXRjaCA9IGZ1bmN0aW9uKCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICkge1xuICAgIHJldHVybiBuZXcgU3dpdGNoKCB0aGlzLCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIEFORCBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBTkQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEFORCggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQU5EOyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuY2xhc3MgTG9naWNhbE9wZXJhdG9yIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jbGFtcCA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAsIDEgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IGdyYXBoLmNsYW1wO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMb2dpY2FsT3BlcmF0b3I7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxvZ2ljYWxPcGVyYXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTG9naWNhbE9wZXJhdG9yKCB0aGlzICk7XG59OyIsIi8vIEFORCAtPiBOT1QgLT4gb3V0XG4vL1xuaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IExvZ2ljYWxPcGVyYXRvciBmcm9tIFwiLi9Mb2dpY2FsT3BlcmF0b3IuZXM2XCI7XG5cblxuY2xhc3MgTkFORCBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgZ3JhcGguQU5EID0gdGhpcy5pby5jcmVhdGVBTkQoKTtcbiAgICAgICAgZ3JhcGguTk9UID0gdGhpcy5pby5jcmVhdGVOT1QoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5BTkQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5BTkQsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguQU5ELmNvbm5lY3QoIGdyYXBoLk5PVCApO1xuICAgICAgICBncmFwaC5OT1QuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTkFORCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTkFORCggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTkFORDsiLCIvLyBPUiAtPiBOT1QgLT4gb3V0XG5pbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTG9naWNhbE9wZXJhdG9yIGZyb20gXCIuL0xvZ2ljYWxPcGVyYXRvci5lczZcIjtcblxuXG5jbGFzcyBOT1IgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG4gICAgICAgIGdyYXBoLk9SID0gdGhpcy5pby5jcmVhdGVPUigpO1xuICAgICAgICBncmFwaC5OT1QgPSB0aGlzLmlvLmNyZWF0ZU5PVCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLk9SLCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGguT1IsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguT1IuY29ubmVjdCggZ3JhcGguTk9UICk7XG4gICAgICAgIGdyYXBoLk5PVC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOT1IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE5PUiggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTk9SOyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIE5PVCBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5hYnMgPSB0aGlzLmlvLmNyZWF0ZUFicyggMTAwICk7XG4gICAgICAgIGdyYXBoLnN1YnRyYWN0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCggMSApO1xuICAgICAgICBncmFwaC5yb3VuZCA9IHRoaXMuaW8uY3JlYXRlUm91bmQoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnN1YnRyYWN0ICk7XG4gICAgICAgIGdyYXBoLnN1YnRyYWN0LmNvbm5lY3QoIGdyYXBoLmFicyApO1xuICAgICAgICBncmFwaC5hYnMuY29ubmVjdCggZ3JhcGgucm91bmQgKVxuXG4gICAgICAgIGdyYXBoLnJvdW5kLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5PVCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTk9UKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOT1Q7IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IExvZ2ljYWxPcGVyYXRvciBmcm9tIFwiLi9Mb2dpY2FsT3BlcmF0b3IuZXM2XCI7XG5cblxuY2xhc3MgT1IgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubWF4ID0gdGhpcy5pby5jcmVhdGVNYXgoKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUbyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbyggMSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVDbGFtcCggMCwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubWF4ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubWF4LmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgIGdyYXBoLm1heC5jb25uZWN0KCBncmFwaC5lcXVhbFRvICk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlT1IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9SKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBPUjtcbiIsIi8vIGEgZXF1YWxUbyggYiApIC0+IE5PVCAtPiBvdXRcbmltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIFhPUiBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUbyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbygpO1xuICAgICAgICBncmFwaC5OT1QgPSB0aGlzLmlvLmNyZWF0ZU5PVCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmVxdWFsVG8gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5lcXVhbFRvLmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8uY29ubmVjdCggZ3JhcGguTk9UICk7XG4gICAgICAgIGdyYXBoLk5PVC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVYT1IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFhPUiggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgWE9SOyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIGdhaW4oKzEwMDAwMCkgLT4gc2hhcGVyKCA8PSAwOiAxLCAxIClcbmNsYXNzIEVxdWFsVG8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgLy8gVE9ET1xuICAgICAgICAvLyAgLSBSZW5hbWUgdGhpcy5cbiAgICAgICAgZ3JhcGgudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApLFxuICAgICAgICBncmFwaC5pbnZlcnNpb24gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuXG4gICAgICAgIGdyYXBoLmludmVyc2lvbi5nYWluLnZhbHVlID0gLTE7XG5cbiAgICAgICAgLy8gVGhpcyBjdXJ2ZSBvdXRwdXRzIDAuNSB3aGVuIGlucHV0IGlzIDAsXG4gICAgICAgIC8vIHNvIGl0IGhhcyB0byBiZSBwaXBlZCBpbnRvIGEgbm9kZSB0aGF0XG4gICAgICAgIC8vIHRyYW5zZm9ybXMgaXQgaW50byAxLCBhbmQgbGVhdmVzIHplcm9zXG4gICAgICAgIC8vIGFsb25lLlxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkVxdWFsVG9aZXJvICk7XG5cbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW5aZXJvID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhblplcm8oKTtcbiAgICAgICAgZ3JhcGgudmFsdWUuY29ubmVjdCggZ3JhcGguaW52ZXJzaW9uICk7XG4gICAgICAgIGdyYXBoLmludmVyc2lvbi5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIGdyYXBoLmdyZWF0ZXJUaGFuWmVybyApO1xuICAgICAgICBncmFwaC5ncmVhdGVyVGhhblplcm8uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gZ3JhcGgudmFsdWU7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVFcXVhbFRvID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgRXF1YWxUbyggdGhpcywgdmFsdWUgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEVxdWFsVG87IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcbmltcG9ydCBFcXVhbFRvIGZyb20gXCIuL0VxdWFsVG8uZXM2XCI7XG5cbi8vIEhhdmVuJ3QgcXVpdGUgZmlndXJlZCBvdXQgd2h5IHlldCwgYnV0IHRoaXMgcmV0dXJucyAwIHdoZW4gaW5wdXQgaXMgMC5cbi8vIEl0IHNob3VsZCByZXR1cm4gMS4uLlxuLy9cbi8vIEZvciBub3csIEknbSBqdXN0IHVzaW5nIHRoZSBFcXVhbFRvIG5vZGUgd2l0aCBhIHN0YXRpYyAwIGFyZ3VtZW50LlxuLy8gLS0tLS0tLS1cbi8vXG4vLyBjbGFzcyBFcXVhbFRvWmVybyBleHRlbmRzIE5vZGUge1xuLy8gICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbi8vICAgICAgICAgc3VwZXIoIGlvLCAxLCAwICk7XG5cbi8vICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gMTAwMDAwO1xuXG4vLyAgICAgICAgIC8vIFRoaXMgb3V0cHV0cyAwLjUgd2hlbiBpbnB1dCBpcyAwLFxuLy8gICAgICAgICAvLyBzbyBpdCBoYXMgdG8gYmUgcGlwZWQgaW50byBhIG5vZGUgdGhhdFxuLy8gICAgICAgICAvLyB0cmFuc2Zvcm1zIGl0IGludG8gMSwgYW5kIGxlYXZlcyB6ZXJvc1xuLy8gICAgICAgICAvLyBhbG9uZS5cbi8vICAgICAgICAgdGhpcy5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkVxdWFsVG9aZXJvICk7XG5cbi8vICAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZUdyZWF0ZXJUaGFuKCAwICk7XG5cbi8vICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnNoYXBlciApO1xuLy8gICAgICAgICB0aGlzLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuLy8gICAgIH1cblxuLy8gICAgIGNsZWFuVXAoKSB7XG4vLyAgICAgICAgIHN1cGVyKCk7XG5cbi8vICAgICAgICAgdGhpcy5zaGFwZXIuY2xlYW5VcCgpO1xuLy8gICAgICAgICB0aGlzLnNoYXBlciA9IG51bGw7XG4vLyAgICAgfVxuLy8gfVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVFcXVhbFRvWmVybyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIHJldHVybiBuZXcgRXF1YWxUb1plcm8oIHRoaXMgKTtcblxuICAgIHJldHVybiBuZXcgRXF1YWxUbyggdGhpcywgMCApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBHcmVhdGVyVGhhbiBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgZ3JhcGguaW52ZXJzaW9uID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICBncmFwaC5pbnZlcnNpb24uZ2Fpbi52YWx1ZSA9IC0xO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDEwMDAwMDtcbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5HcmVhdGVyVGhhblplcm8gKTtcblxuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGguaW52ZXJzaW9uICk7XG4gICAgICAgIGdyYXBoLmludmVyc2lvbi5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlR3JlYXRlclRoYW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBHcmVhdGVyVGhhbiggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgR3JlYXRlclRoYW5FcXVhbFRvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuICAgICAgICBncmFwaC5ncmVhdGVyVGhhbiA9IHRoaXMuaW8uY3JlYXRlR3JlYXRlclRoYW4oKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUbyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbygpO1xuICAgICAgICBncmFwaC5PUiA9IHRoaXMuaW8uY3JlYXRlT1IoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNvbm5lY3QoIGdyYXBoLmdyZWF0ZXJUaGFuLmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGguZXF1YWxUby5jb250cm9scy52YWx1ZSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5lcXVhbFRvICk7XG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuLmNvbm5lY3QoIGdyYXBoLk9SLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8uY29ubmVjdCggZ3JhcGguT1IsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguT1IuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUdyZWF0ZXJUaGFuRXF1YWxUbyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IEdyZWF0ZXJUaGFuRXF1YWxUbyggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgR3JlYXRlclRoYW5aZXJvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gMTAwMDAwO1xuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkdyZWF0ZXJUaGFuWmVybyApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlR3JlYXRlclRoYW5aZXJvID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBHcmVhdGVyVGhhblplcm8oIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgSWZFbHNlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDAgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguc3dpdGNoID0gdGhpcy5pby5jcmVhdGVTd2l0Y2goIDIsIDAgKTtcblxuICAgICAgICB0aGlzLmlmID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuICAgICAgICB0aGlzLmlmLmNvbm5lY3QoIGdyYXBoLnN3aXRjaC5jb250cm9sICk7XG4gICAgICAgIHRoaXMudGhlbiA9IGdyYXBoLnN3aXRjaC5pbnB1dHNbIDAgXTtcbiAgICAgICAgdGhpcy5lbHNlID0gZ3JhcGguc3dpdGNoLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gZ3JhcGguc3dpdGNoLmlucHV0cztcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gZ3JhcGguc3dpdGNoLm91dHB1dHM7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUlmRWxzZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSWZFbHNlKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIExlc3NUaGFuIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIGdyYXBoLnZhbHVlSW52ZXJzaW9uID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgudmFsdWVJbnZlcnNpb24uZ2Fpbi52YWx1ZSA9IC0xO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGgudmFsdWVJbnZlcnNpb24gKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAtMTAwMDAwO1xuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkdyZWF0ZXJUaGFuWmVybyApO1xuXG4gICAgICAgIGdyYXBoLnZhbHVlSW52ZXJzaW9uLmNvbm5lY3QoIHRoaXMuaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVMZXNzVGhhbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IExlc3NUaGFuKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMZXNzVGhhbkVxdWFsVG8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIGdyYXBoLmxlc3NUaGFuID0gdGhpcy5pby5jcmVhdGVMZXNzVGhhbigpO1xuICAgICAgICBncmFwaC5lcXVhbFRvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvKCk7XG4gICAgICAgIGdyYXBoLk9SID0gdGhpcy5pby5jcmVhdGVPUigpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGgubGVzc1RoYW4uY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5jb25uZWN0KCBncmFwaC5lcXVhbFRvLmNvbnRyb2xzLnZhbHVlICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5sZXNzVGhhbiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmVxdWFsVG8gKTtcbiAgICAgICAgZ3JhcGgubGVzc1RoYW4uY29ubmVjdCggZ3JhcGguT1IsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUby5jb25uZWN0KCBncmFwaC5PUiwgMCwgMSApO1xuICAgICAgICBncmFwaC5PUi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVzc1RoYW5FcXVhbFRvID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgTGVzc1RoYW5FcXVhbFRvKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMZXNzVGhhblplcm8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5ib29zdGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguYm9vc3Rlci5nYWluLnZhbHVlID0gLTEwMDAwMDtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5ib29zdGVyICk7XG5cbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5HcmVhdGVyVGhhblplcm8gKTtcblxuICAgICAgICBncmFwaC5ib29zdGVyLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVzc1RoYW5aZXJvID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBMZXNzVGhhblplcm8oIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gQ29zaW5lIGFwcHJveGltYXRpb24hXG4vL1xuLy8gT25seSB3b3JrcyBpbiByYW5nZSBvZiAtTWF0aC5QSSB0byBNYXRoLlBJLlxuY2xhc3MgQ29zIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgZ3JhcGguc3F1YXJlID0gdGhpcy5pby5jcmVhdGVTcXVhcmUoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkxID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggLTIuNjA1ZS03ICk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5MiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkzID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTQgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5NSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICBncmFwaC5hZGQxID0gdGhpcy5pby5jcmVhdGVBZGQoIDIuNDc2MDllLTUgKTtcbiAgICAgICAgZ3JhcGguYWRkMiA9IHRoaXMuaW8uY3JlYXRlQWRkKCAtMC4wMDEzODg4NCApO1xuICAgICAgICBncmFwaC5hZGQzID0gdGhpcy5pby5jcmVhdGVBZGQoIDAuMDQxNjY2NiApO1xuICAgICAgICBncmFwaC5hZGQ0ID0gdGhpcy5pby5jcmVhdGVBZGQoIC0wLjQ5OTkyMyApO1xuICAgICAgICBncmFwaC5hZGQ1ID0gdGhpcy5pby5jcmVhdGVBZGQoIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNxdWFyZSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgbXVsdGlwbHkxJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTEsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGFkZDEncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkxLmNvbm5lY3QoIGdyYXBoLmFkZDEsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIG11bHRpcGx5MidzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkyLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDEuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkyLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBhZGQyJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5Mi5jb25uZWN0KCBncmFwaC5hZGQyLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBtdWx0aXBseTMncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MywgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQyLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MywgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgYWRkMydzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTMuY29ubmVjdCggZ3JhcGguYWRkMywgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgbXVsdGlwbHk0J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTQsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkMy5jb25uZWN0KCBncmFwaC5tdWx0aXBseTQsIDAsIDEgKTtcblxuICAgICAgICAvLyBhZGQ0J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5NC5jb25uZWN0KCBncmFwaC5hZGQ0LCAwLCAwICk7XG5cbiAgICAgICAgLy8gbXVsdGlwbHk1J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkNC5jb25uZWN0KCBncmFwaC5tdWx0aXBseTUsIDAsIDEgKTtcblxuICAgICAgICAvLyBhZGQ1J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5NS5jb25uZWN0KCBncmFwaC5hZGQ1LCAwLCAwICk7XG5cbiAgICAgICAgLy8gT3V0cHV0IChmaW5hbGx5ISEpXG4gICAgICAgIGdyYXBoLmFkZDUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDAgXTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29zID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgQ29zKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBEZWdUb1JhZCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIE1hdGguUEkgLyAxODAgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZURlZ1RvUmFkID0gZnVuY3Rpb24oIGRlZyApIHtcbiAgICByZXR1cm4gbmV3IERlZ1RvUmFkKCB0aGlzLCBkZWcgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgUmFkVG9EZWcgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAxODAgLyBNYXRoLlBJICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVSYWRUb0RlZyA9IGZ1bmN0aW9uKCBkZWcgKSB7XG4gICAgcmV0dXJuIG5ldyBSYWRUb0RlZyggdGhpcywgZGVnICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIFNpbiBhcHByb3hpbWF0aW9uIVxuLy9cbi8vIE9ubHkgd29ya3MgaW4gcmFuZ2Ugb2YgLU1hdGguUEkgdG8gTWF0aC5QSS5cbmNsYXNzIFNpbiBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICBncmFwaC5zcXVhcmUgPSB0aGlzLmlvLmNyZWF0ZVNxdWFyZSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTEgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAtMi4zOWUtOCApO1xuICAgICAgICBncmFwaC5tdWx0aXBseTIgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5MyA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk0ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTUgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5NiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICBncmFwaC5hZGQxID0gdGhpcy5pby5jcmVhdGVBZGQoIDIuNzUyNmUtNiApO1xuICAgICAgICBncmFwaC5hZGQyID0gdGhpcy5pby5jcmVhdGVBZGQoIC0wLjAwMDE5ODQwOSApO1xuICAgICAgICBncmFwaC5hZGQzID0gdGhpcy5pby5jcmVhdGVBZGQoIDAuMDA4MzMzMzMgKTtcbiAgICAgICAgZ3JhcGguYWRkNCA9IHRoaXMuaW8uY3JlYXRlQWRkKCAtMC4xNjY2NjcgKTtcbiAgICAgICAgZ3JhcGguYWRkNSA9IHRoaXMuaW8uY3JlYXRlQWRkKCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zcXVhcmUgKTtcblxuICAgICAgICAvLyBDb25uZWN0IG11bHRpcGx5MSdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkxLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBhZGQxJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5MS5jb25uZWN0KCBncmFwaC5hZGQxLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBtdWx0aXBseTIncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MiwgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQxLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MiwgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgYWRkMidzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTIuY29ubmVjdCggZ3JhcGguYWRkMiwgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgbXVsdGlwbHkzJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTMsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkMi5jb25uZWN0KCBncmFwaC5tdWx0aXBseTMsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGFkZDMncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkzLmNvbm5lY3QoIGdyYXBoLmFkZDMsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IG11bHRpcGx5NCdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk0LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDMuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNCdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTQuY29ubmVjdCggZ3JhcGguYWRkNCwgMCwgMCApO1xuXG4gICAgICAgIC8vIG11bHRpcGx5NSdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk1LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDQuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk1LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNSdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTUuY29ubmVjdCggZ3JhcGguYWRkNSwgMCwgMCApO1xuXG4gICAgICAgIC8vIG11bHRpcGx5NidzIGlucHV0c1xuICAgICAgICB0aGlzLmlucHV0c1swXS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTYsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkNS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTYsIDAsIDEgKTtcblxuICAgICAgICAvLyBPdXRwdXQgKGZpbmFsbHkhISlcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk2LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNpbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFNpbiggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gVGFuZ2VudCBhcHByb3hpbWF0aW9uIVxuLy9cbi8vIE9ubHkgd29ya3MgaW4gcmFuZ2Ugb2YgLU1hdGguUEkgdG8gTWF0aC5QSS5cbi8vXG4vLyBzaW4oIGlucHV0ICkgLyBjb3MoIGlucHV0IClcbmNsYXNzIFRhbiBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICBncmFwaC5zaW5lID0gdGhpcy5pby5jcmVhdGVTaW4oKTtcbiAgICAgICAgZ3JhcGguY29zID0gdGhpcy5pby5jcmVhdGVDb3MoKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoIHVuZGVmaW5lZCwgTWF0aC5QSSAqIDIgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNpbmUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5jb3MgKTtcbiAgICAgICAgZ3JhcGguc2luZS5jb25uZWN0KCBncmFwaC5kaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguY29zLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLmRpdmlkZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVUYW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBUYW4oIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBDT05GSUcgZnJvbSBcIi4uL2NvcmUvY29uZmlnLmVzNlwiO1xuXG5mdW5jdGlvbiBQaW5rTnVtYmVyKCkge1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy53aGl0ZVZhbHVlcyA9IFtdO1xuICAgIHRoaXMucmFuZ2UgPSAxMjg7XG4gICAgdGhpcy5saW1pdCA9IDU7XG5cbiAgICB0aGlzLmdlbmVyYXRlID0gdGhpcy5nZW5lcmF0ZS5iaW5kKCB0aGlzICk7XG4gICAgdGhpcy5nZXROZXh0VmFsdWUgPSB0aGlzLmdldE5leHRWYWx1ZS5iaW5kKCB0aGlzICk7XG59XG5cblBpbmtOdW1iZXIucHJvdG90eXBlLmdlbmVyYXRlID0gZnVuY3Rpb24oIHJhbmdlLCBsaW1pdCApIHtcbiAgICB0aGlzLnJhbmdlID0gcmFuZ2UgfHwgMTI4O1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy5saW1pdCA9IGxpbWl0IHx8IDE7XG5cblx0dmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICB9XG59O1xuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZXROZXh0VmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGFzdEtleSA9IHRoaXMua2V5LFxuICAgICAgICBzdW0gPSAwO1xuXG4gICAgKyt0aGlzLmtleTtcblxuICAgIGlmKCB0aGlzLmtleSA+IHRoaXMubWF4S2V5ICkge1xuICAgICAgICB0aGlzLmtleSA9IDA7XG4gICAgfVxuXG4gICAgdmFyIGRpZmYgPSB0aGlzLmxhc3RLZXkgXiB0aGlzLmtleTtcbiAgICB2YXIgcmFuZ2VMaW1pdCA9IHRoaXMucmFuZ2UgLyB0aGlzLmxpbWl0O1xuXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbWl0OyArK2kgKSB7XG4gICAgICAgIGlmKCBkaWZmICYgKDEgPDwgaSkgKSB7XG4gICAgICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1bSArPSB0aGlzLndoaXRlVmFsdWVzWyBpIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bSAvIHRoaXMubGltaXQ7XG59O1xuXG52YXIgcGluayA9IG5ldyBQaW5rTnVtYmVyKCk7XG5waW5rLmdlbmVyYXRlKCk7XG5cblxuXG5cblxuZXhwb3J0IGRlZmF1bHQge1xuXHRyb3VuZEZyb21FcHNpbG9uOiBmdW5jdGlvbiggbiApIHtcblx0XHRsZXQgcm91bmRlZCA9IE1hdGgucm91bmQoIG4gKTtcblxuXHRcdGlmICggcm91bmRlZCAlIG4gPCBDT05GSUcuZXBzaWxvbiApIHtcblx0XHRcdHJldHVybiByb3VuZGVkXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIG47XG5cdFx0fVxuXHR9LFxuXG5cdHJvdW5kVG9NdWx0aXBsZTogZnVuY3Rpb24oIG4sIG11bHRpcGxlICkge1xuXHRcdHJldHVybiBNYXRoLmZsb29yKCAoIG4gKyBtdWx0aXBsZSAtIDEgKSAvIG11bHRpcGxlICkgKiBtdWx0aXBsZTtcblx0fSxcblxuXHRjbGFtcDogZnVuY3Rpb24oIHZhbHVlLCBtaW4sIG1heCApIHtcblx0XHRyZXR1cm4gTWF0aC5taW4oIG1heCwgTWF0aC5tYXgoIHZhbHVlLCBtaW4gKSApO1xuXHR9LFxuXG5cdHNjYWxlTnVtYmVyOiBmdW5jdGlvbiggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG5cdFx0cmV0dXJuICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICkgKiAoIGhpZ2hPdXQgLSBsb3dPdXQgKSArIGxvd091dDtcblx0fSxcblxuXHRzY2FsZU51bWJlckV4cDogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHAgKSB7XG5cdFx0aWYgKCB0eXBlb2YgZXhwICE9PSAnbnVtYmVyJyB8fCBleHAgPT09IDEgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5zY2FsZU51bWJlciggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKTtcblx0XHR9XG5cblx0XHRpZiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSA9PT0gMCApIHtcblx0XHRcdHJldHVybiBsb3dPdXQ7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPiAwICkge1xuXHRcdFx0XHRyZXR1cm4gKCBsb3dPdXQgKyAoIGhpZ2hPdXQgLSBsb3dPdXQgKSAqIE1hdGgucG93KCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICksIGV4cCApICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiAtKCBNYXRoLnBvdyggKCAoIC1udW0gKyBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICksIGV4cCApICkgKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Ly8gQSB2ZXJ5IHBvb3IgYXBwcm94aW1hdGlvbiBvZiBhIGdhdXNzaWFuIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yIVxuXHRnYXVzc2lhblJhbmRvbTogZnVuY3Rpb24oIGN5Y2xlcyApIHtcblx0XHRjeWNsZXMgPSBjeWNsZXMgfHwgMTA7XG5cblx0XHR2YXIgbiA9IDAsXG5cdFx0XHRpID0gY3ljbGVzO1xuXG5cdFx0d2hpbGUoIC0taSApIHtcblx0XHRcdG4gKz0gTWF0aC5yYW5kb20oKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbiAvIGN5Y2xlcztcblx0fSxcblxuXHQvLyBGcm9tOlxuXHQvLyBcdGh0dHA6Ly93d3cubWVyZWRpdGhkb2RnZS5jb20vMjAxMi8wNS8zMC9hLWdyZWF0LWxpdHRsZS1qYXZhc2NyaXB0LWZ1bmN0aW9uLWZvci1nZW5lcmF0aW5nLXJhbmRvbS1nYXVzc2lhbm5vcm1hbGJlbGwtY3VydmUtbnVtYmVycy9cblx0bnJhbmQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB4MSxcblx0XHRcdHgyLFxuXHRcdFx0cmFkLFxuXHRcdFx0eTE7XG5cblx0XHRkbyB7XG5cdFx0XHR4MSA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHgyID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuXHRcdFx0cmFkID0geDEgKiB4MSArIHgyICogeDI7XG5cdFx0fSB3aGlsZSggcmFkID49IDEgfHwgcmFkID09PSAwICk7XG5cblx0XHR2YXIgYyA9IE1hdGguc3FydCggLTIgKiBNYXRoLmxvZyggcmFkICkgLyByYWQgKTtcblxuXHRcdHJldHVybiAoKHgxICogYykgLyA1KSAqIDAuNSArIDAuNTtcblx0fSxcblxuXHRnZW5lcmF0ZVBpbmtOdW1iZXI6IHBpbmsuZ2VuZXJhdGUsXG5cdGdldE5leHRQaW5rTnVtYmVyOiBwaW5rLmdldE5leHRWYWx1ZSxcblxufTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgY2xlYW5VcEluT3V0czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbnB1dHMsXG4gICAgICAgICAgICBvdXRwdXRzO1xuXG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KCB0aGlzLmlucHV0cyApICkge1xuICAgICAgICAgICAgaW5wdXRzID0gdGhpcy5pbnB1dHM7XG5cbiAgICAgICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgIGlmKCBpbnB1dHNbIGkgXSAmJiB0eXBlb2YgaW5wdXRzWyBpIF0uY2xlYW5VcCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRzWyBpIF0uY2xlYW5VcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBpbnB1dHNbIGkgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRzWyBpIF0uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlucHV0c1sgaSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5pbnB1dHMgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIEFycmF5LmlzQXJyYXkoIHRoaXMub3V0cHV0cyApICkge1xuICAgICAgICAgICAgb3V0cHV0cyA9IHRoaXMub3V0cHV0cztcblxuICAgICAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBvdXRwdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgIGlmKCBvdXRwdXRzWyBpIF0gJiYgdHlwZW9mIG91dHB1dHNbIGkgXS5jbGVhblVwID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRzWyBpIF0uY2xlYW5VcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBvdXRwdXRzWyBpIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dHNbIGkgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb3V0cHV0c1sgaSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5vdXRwdXRzID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjbGVhbklPOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYoIHRoaXMuaW8gKSB7XG4gICAgICAgICAgICB0aGlzLmlvID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCB0aGlzLmNvbnRleHQgKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufTsiLCJ2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBjb25uZWN0OiBmdW5jdGlvbiggbm9kZSwgb3V0cHV0Q2hhbm5lbCA9IDAsIGlucHV0Q2hhbm5lbCA9IDAgKSB7XG4gICAgICAgIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gfHwgbm9kZSBpbnN0YW5jZW9mIEF1ZGlvTm9kZSApIHtcbiAgICAgICAgICAgIC8vIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmNvbm5lY3QoIG5vZGUgKTtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmNvbm5lY3QuY2FsbCggdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0sIG5vZGUsIDAsIGlucHV0Q2hhbm5lbCApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgJiYgbm9kZS5vdXRwdXRzICYmIG5vZGUub3V0cHV0cy5sZW5ndGggKSB7XG4gICAgICAgICAgICAvLyBpZiggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdIGluc3RhbmNlb2YgUGFyYW0gKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggJ0NPTk5FQ1RJTkcgVE8gUEFSQU0nICk7XG4gICAgICAgICAgICAvLyBub2RlLmlvLmNvbnN0YW50RHJpdmVyLmRpc2Nvbm5lY3QoIG5vZGUuY29udHJvbCApO1xuICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXS5jb25uZWN0KCBub2RlLmlucHV0c1sgaW5wdXRDaGFubmVsIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvciggJ0FTU0VSVCBOT1QgUkVBQ0hFRCcgKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkaXNjb25uZWN0OiBmdW5jdGlvbiggbm9kZSwgb3V0cHV0Q2hhbm5lbCA9IDAsIGlucHV0Q2hhbm5lbCA9IDAgKSB7XG4gICAgICAgIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gfHwgbm9kZSBpbnN0YW5jZW9mIEF1ZGlvTm9kZSApIHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmRpc2Nvbm5lY3QuY2FsbCggdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0sIG5vZGUsIDAsIGlucHV0Q2hhbm5lbCApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgJiYgbm9kZS5pbnB1dHMgJiYgbm9kZS5pbnB1dHMubGVuZ3RoICkge1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0uZGlzY29ubmVjdCggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdICk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICggbm9kZSA9PT0gdW5kZWZpbmVkICYmIHRoaXMub3V0cHV0cyApIHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0cy5mb3JFYWNoKCBmdW5jdGlvbiggbiApIHtcbiAgICAgICAgICAgICAgICBpZiAoIG4gJiYgdHlwZW9mIG4uZGlzY29ubmVjdCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICAgICAgbi5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNoYWluOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVzID0gc2xpY2UuY2FsbCggYXJndW1lbnRzICksXG4gICAgICAgICAgICBub2RlID0gdGhpcztcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdC5jYWxsKCBub2RlLCBub2Rlc1sgaSBdICk7XG4gICAgICAgICAgICBub2RlID0gbm9kZXNbIGkgXTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBmYW46IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZXMgPSBzbGljZS5jYWxsKCBhcmd1bWVudHMgKSxcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgbm9kZS5jb25uZWN0LmNhbGwoIG5vZGUsIG5vZGVzWyBpIF0gKTtcbiAgICAgICAgfVxuICAgIH1cbn07IiwiaW1wb3J0IG1hdGggZnJvbSBcIi4vbWF0aC5lczZcIjtcbmltcG9ydCBub3RlU3RyaW5ncyBmcm9tIFwiLi9ub3RlU3RyaW5ncy5lczZcIjtcbmltcG9ydCBub3RlcyBmcm9tIFwiLi9ub3Rlcy5lczZcIjtcbmltcG9ydCBDT05GSUcgZnJvbSBcIi4uL2NvcmUvY29uZmlnLmVzNlwiO1xuaW1wb3J0IG5vdGVSZWdFeHAgZnJvbSBcIi4vbm90ZVJlZ0V4cC5lczZcIjtcblxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgc2NhbGFyVG9EYjogZnVuY3Rpb24oIHNjYWxhciApIHtcbiAgICAgICAgcmV0dXJuIDIwICogKCBNYXRoLmxvZyggc2NhbGFyICkgLyBNYXRoLkxOMTAgKTtcbiAgICB9LFxuICAgIGRiVG9TY2FsYXI6IGZ1bmN0aW9uKCBkYiApIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KCAyLCBkYiAvIDYgKTtcbiAgICB9LFxuXG4gICAgaHpUb01JREk6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIG1hdGgucm91bmRGcm9tRXBzaWxvbiggNjkgKyAxMiAqIE1hdGgubG9nMiggdmFsdWUgLyA0NDAgKSApO1xuICAgIH0sXG5cbiAgICBoelRvTm90ZTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9Ob3RlKCB0aGlzLmh6VG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGh6VG9NczogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICBpZiAoIHZhbHVlID09PSAwICkgcmV0dXJuIDA7XG4gICAgICAgIHJldHVybiAxMDAwIC8gdmFsdWU7XG4gICAgfSxcblxuICAgIGh6VG9CUE06IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0JQTSggdGhpcy5oelRvTXMoIHZhbHVlICkgKTtcbiAgICB9LFxuXG5cblxuICAgIG1pZGlUb0h6OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnBvdyggMiwgKCB2YWx1ZSAtIDY5ICkgLyAxMiApICogNDQwO1xuICAgIH0sXG5cbiAgICBtaWRpVG9Ob3RlOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIGxldCB2YWx1ZXMgPSAoIHZhbHVlICsgJycgKS5zcGxpdCggJy4nICksXG4gICAgICAgICAgICBub3RlVmFsdWUgPSArdmFsdWVzWyAwIF0sXG4gICAgICAgICAgICBjZW50cyA9ICggdmFsdWVzWyAxIF0gPyBwYXJzZUZsb2F0KCAnMC4nICsgdmFsdWVzWyAxIF0sIDEwICkgOiAwICkgKiAxMDA7XG5cbiAgICAgICAgaWYgKCBNYXRoLmFicyggY2VudHMgKSA+PSAxMDAgKSB7XG4gICAgICAgICAgICBub3RlVmFsdWUgKz0gY2VudHMgJSAxMDA7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcm9vdCA9IG5vdGVWYWx1ZSAlIDEyIHwgMCxcbiAgICAgICAgICAgIG9jdGF2ZSA9IG5vdGVWYWx1ZSAvIDEyIHwgMCxcbiAgICAgICAgICAgIG5vdGVOYW1lID0gbm90ZVN0cmluZ3NbIHJvb3QgXTtcblxuICAgICAgICByZXR1cm4gbm90ZU5hbWUgKyAoIG9jdGF2ZSArIENPTkZJRy5sb3dlc3RPY3RhdmUgKSArICggY2VudHMgPyAnKycgKyBjZW50cyA6ICcnICk7XG4gICAgfSxcblxuICAgIG1pZGlUb01zOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmh6VG9NcyggdGhpcy5taWRpVG9IeiggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBtaWRpVG9CUE06IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0JQTSggdGhpcy5taWRpVG9NcyggdmFsdWUgKSApO1xuICAgIH0sXG5cblxuXG4gICAgbm90ZVRvSHo6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvSHooIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBub3RlVG9NSURJOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIGxldCBtYXRjaGVzID0gbm90ZVJlZ0V4cC5leGVjKCB2YWx1ZSApLFxuICAgICAgICAgICAgbm90ZSwgYWNjaWRlbnRhbCwgb2N0YXZlLCBjZW50cyxcbiAgICAgICAgICAgIG5vdGVWYWx1ZTtcblxuICAgICAgICBpZiAoICFtYXRjaGVzICkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCAnSW52YWxpZCBub3RlIGZvcm1hdDonLCB2YWx1ZSApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbm90ZSA9IG1hdGNoZXNbIDEgXTtcbiAgICAgICAgYWNjaWRlbnRhbCA9IG1hdGNoZXNbIDIgXTtcbiAgICAgICAgb2N0YXZlID0gcGFyc2VJbnQoIG1hdGNoZXNbIDMgXSwgMTAgKSArIC1DT05GSUcubG93ZXN0T2N0YXZlO1xuICAgICAgICBjZW50cyA9IHBhcnNlRmxvYXQoIG1hdGNoZXNbIDQgXSApIHx8IDA7XG5cbiAgICAgICAgbm90ZVZhbHVlID0gbm90ZXNbIG5vdGUgKyBhY2NpZGVudGFsIF07XG5cbiAgICAgICAgcmV0dXJuIG1hdGgucm91bmRGcm9tRXBzaWxvbiggbm90ZVZhbHVlICsgKCBvY3RhdmUgKiAxMiApICsgKCBjZW50cyAqIDAuMDEgKSApO1xuICAgIH0sXG5cbiAgICBub3RlVG9NczogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9NcyggdGhpcy5ub3RlVG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIG5vdGVUb0JQTTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9CUE0oIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cblxuXG4gICAgbXNUb0h6OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmh6VG9NcyggdmFsdWUgKTtcbiAgICB9LFxuXG4gICAgbXNUb05vdGU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvTXMoIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBtc1RvTUlESTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5oelRvTUlESSggdGhpcy5tc1RvSHooIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbXNUb0JQTTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IDAgPyAwIDogNjAwMDAgLyB2YWx1ZTtcbiAgICB9LFxuXG5cblxuICAgIGJwbVRvSHo6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0h6KCB0aGlzLmJwbVRvTXMoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgYnBtVG9Ob3RlOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb0JQTSggdGhpcy5ub3RlVG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGJwbVRvTUlESTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5tc1RvTUlESSggdGhpcy5icG1Ub01zKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGJwbVRvTXM6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0JQTSggdmFsdWUgKTtcbiAgICB9XG59OyIsImltcG9ydCBDT05GSUcgZnJvbSBcIi4uL2NvcmUvY29uZmlnLmVzNlwiO1xuXG5mdW5jdGlvbiBQaW5rTnVtYmVyKCkge1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy53aGl0ZVZhbHVlcyA9IFtdO1xuICAgIHRoaXMucmFuZ2UgPSAxMjg7XG4gICAgdGhpcy5saW1pdCA9IDU7XG5cbiAgICB0aGlzLmdlbmVyYXRlID0gdGhpcy5nZW5lcmF0ZS5iaW5kKCB0aGlzICk7XG4gICAgdGhpcy5nZXROZXh0VmFsdWUgPSB0aGlzLmdldE5leHRWYWx1ZS5iaW5kKCB0aGlzICk7XG59XG5cblBpbmtOdW1iZXIucHJvdG90eXBlLmdlbmVyYXRlID0gZnVuY3Rpb24oIHJhbmdlLCBsaW1pdCApIHtcbiAgICB0aGlzLnJhbmdlID0gcmFuZ2UgfHwgMTI4O1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy5saW1pdCA9IGxpbWl0IHx8IDE7XG5cblx0dmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICB9XG59O1xuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZXROZXh0VmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGFzdEtleSA9IHRoaXMua2V5LFxuICAgICAgICBzdW0gPSAwO1xuXG4gICAgKyt0aGlzLmtleTtcblxuICAgIGlmKCB0aGlzLmtleSA+IHRoaXMubWF4S2V5ICkge1xuICAgICAgICB0aGlzLmtleSA9IDA7XG4gICAgfVxuXG4gICAgdmFyIGRpZmYgPSB0aGlzLmxhc3RLZXkgXiB0aGlzLmtleTtcbiAgICB2YXIgcmFuZ2VMaW1pdCA9IHRoaXMucmFuZ2UgLyB0aGlzLmxpbWl0O1xuXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbWl0OyArK2kgKSB7XG4gICAgICAgIGlmKCBkaWZmICYgKDEgPDwgaSkgKSB7XG4gICAgICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1bSArPSB0aGlzLndoaXRlVmFsdWVzWyBpIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bSAvIHRoaXMubGltaXQ7XG59O1xuXG52YXIgcGluayA9IG5ldyBQaW5rTnVtYmVyKCk7XG5waW5rLmdlbmVyYXRlKCk7XG5cblxuXG5cblxuZXhwb3J0IGRlZmF1bHQge1xuXHRyb3VuZEZyb21FcHNpbG9uOiBmdW5jdGlvbiggbiApIHtcblx0XHRsZXQgcm91bmRlZCA9IE1hdGgucm91bmQoIG4gKTtcblxuXHRcdGlmICggcm91bmRlZCAlIG4gPCBDT05GSUcuZXBzaWxvbiApIHtcblx0XHRcdHJldHVybiByb3VuZGVkXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIG47XG5cdFx0fVxuXHR9LFxuXG5cdHJvdW5kVG9NdWx0aXBsZTogZnVuY3Rpb24oIG4sIG11bHRpcGxlICkge1xuXHRcdHJldHVybiBNYXRoLmZsb29yKCAoIG4gKyBtdWx0aXBsZSAtIDEgKSAvIG11bHRpcGxlICkgKiBtdWx0aXBsZTtcblx0fSxcblxuXHRjbGFtcDogZnVuY3Rpb24oIHZhbHVlLCBtaW4sIG1heCApIHtcblx0XHRyZXR1cm4gTWF0aC5taW4oIG1heCwgTWF0aC5tYXgoIHZhbHVlLCBtaW4gKSApO1xuXHR9LFxuXG5cdHNjYWxlTnVtYmVyOiBmdW5jdGlvbiggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG5cdFx0cmV0dXJuICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICkgKiAoIGhpZ2hPdXQgLSBsb3dPdXQgKSArIGxvd091dDtcblx0fSxcblxuXHRzY2FsZU51bWJlckV4cDogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHAgKSB7XG5cdFx0aWYgKCB0eXBlb2YgZXhwICE9PSAnbnVtYmVyJyB8fCBleHAgPT09IDEgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5zY2FsZU51bWJlciggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKTtcblx0XHR9XG5cblx0XHRpZiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSA9PT0gMCApIHtcblx0XHRcdHJldHVybiBsb3dPdXQ7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPiAwICkge1xuXHRcdFx0XHRyZXR1cm4gKCBsb3dPdXQgKyAoIGhpZ2hPdXQgLSBsb3dPdXQgKSAqIE1hdGgucG93KCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICksIGV4cCApICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiAtKCBNYXRoLnBvdyggKCAoIC1udW0gKyBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICksIGV4cCApICkgKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Ly8gQSB2ZXJ5IHBvb3IgYXBwcm94aW1hdGlvbiBvZiBhIGdhdXNzaWFuIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yIVxuXHRnYXVzc2lhblJhbmRvbTogZnVuY3Rpb24oIGN5Y2xlcyApIHtcblx0XHRjeWNsZXMgPSBjeWNsZXMgfHwgMTA7XG5cblx0XHR2YXIgbiA9IDAsXG5cdFx0XHRpID0gY3ljbGVzO1xuXG5cdFx0d2hpbGUoIC0taSApIHtcblx0XHRcdG4gKz0gTWF0aC5yYW5kb20oKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbiAvIGN5Y2xlcztcblx0fSxcblxuXHQvLyBGcm9tOlxuXHQvLyBcdGh0dHA6Ly93d3cubWVyZWRpdGhkb2RnZS5jb20vMjAxMi8wNS8zMC9hLWdyZWF0LWxpdHRsZS1qYXZhc2NyaXB0LWZ1bmN0aW9uLWZvci1nZW5lcmF0aW5nLXJhbmRvbS1nYXVzc2lhbm5vcm1hbGJlbGwtY3VydmUtbnVtYmVycy9cblx0bnJhbmQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB4MSxcblx0XHRcdHgyLFxuXHRcdFx0cmFkLFxuXHRcdFx0eTE7XG5cblx0XHRkbyB7XG5cdFx0XHR4MSA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHgyID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuXHRcdFx0cmFkID0geDEgKiB4MSArIHgyICogeDI7XG5cdFx0fSB3aGlsZSggcmFkID49IDEgfHwgcmFkID09PSAwICk7XG5cblx0XHR2YXIgYyA9IE1hdGguc3FydCggLTIgKiBNYXRoLmxvZyggcmFkICkgLyByYWQgKTtcblxuXHRcdHJldHVybiAoKHgxICogYykgLyA1KSAqIDAuNSArIDAuNTtcblx0fSxcblxuXHRnZW5lcmF0ZVBpbmtOdW1iZXI6IHBpbmsuZ2VuZXJhdGUsXG5cdGdldE5leHRQaW5rTnVtYmVyOiBwaW5rLmdldE5leHRWYWx1ZSxcblxufTsiLCJleHBvcnQgZGVmYXVsdCAvXihbQXxCfEN8RHxFfEZ8R117MX0pKFsjYnhdezAsMn0pKFtcXC1cXCtdP1xcZCspPyhbXFwrfFxcLV17MX1cXGQqLlxcZCopPy87IiwiZXhwb3J0IGRlZmF1bHQgWyAnQycsICdDIycsICdEJywgJ0QjJywgJ0UnLCAnRicsICdGIycsICdHJywgJ0cjJywgJ0EnLCAnQSMnLCAnQicgXTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgJ0MnOiAwLCAgICAgJ0RiYic6IDAsICAgJ0IjJzogMCxcbiAgICAnQyMnOiAxLCAgICAnRGInOiAxLCAgICAnQiMjJzogMSwgICAnQngnOiAxLFxuICAgICdEJzogMiwgICAgICdFYmInOiAyLCAgICdDIyMnOiAyLCAgICdDeCc6IDIsXG4gICAgJ0QjJzogMywgICAgJ0ViJzogMywgICAgJ0ZiYic6IDMsXG4gICAgJ0UnOiA0LCAgICAgJ0ZiJzogNCwgICAgJ0QjIyc6IDQsICAgJ0R4JzogNCxcbiAgICAnRic6IDUsICAgICAnR2JiJzogNSwgICAnRSMnOiA1LFxuICAgICdGIyc6IDYsICAgICdHYic6IDYsICAgICdFIyMnOiA2LCAgICdFeCc6IDYsXG4gICAgJ0cnOiA3LCAgICAgJ0FiYic6IDcsICAgJ0YjIyc6IDcsICAnRngnOiA3LFxuICAgICdHIyc6IDgsICAgICdBYic6IDgsXG4gICAgJ0EnOiA5LCAgICAgJ0JiYic6IDksICAgJ0cjIyc6IDksICAnR3gnOiA5LFxuICAgICdBIyc6IDEwLCAgICdCYic6IDEwLCAgICdDYmInOiAxMCxcbiAgICAnQic6IDExLCAgICAnQ2InOiAxMSwgICAnQSMjJzogMTEsICdBeCc6IDExXG59OyIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIF9zZXRJTyggaW8gKSB7XG4gICAgdGhpcy5pbyA9IGlvO1xuICAgIHRoaXMuY29udGV4dCA9IGlvLmNvbnRleHQ7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuaW1wb3J0IEJ1ZmZlckdlbmVyYXRvcnMgZnJvbSBcIi4uL2J1ZmZlcnMvQnVmZmVyR2VuZXJhdG9ycy5lczZcIjtcbmltcG9ydCBCdWZmZXJVdGlscyBmcm9tIFwiLi4vYnVmZmVycy9CdWZmZXJVdGlscy5lczZcIjtcblxuLy8gVE9ETzpcbi8vIFx0LSBJc3N1ZSB3aXRoIHBsYXliYWNrIHJhdGUgbm90IGhhdmluZyBhIHdpZGUgZW5vdWdoIHJhbmdlXG4vLyBcdCAgdG8gc3VwcG9ydCB0aGUgZnVsbCBmcmVxdWVuY3kgcmFuZ2UuXG4vLyBcdCAgXG4vLyBcdC0gRml4OlxuLy8gXHRcdC0gQ3JlYXRlIG11bHRpcGxlIGJ1ZmZlciBzb3VyY2VzIGF0dGFjaGVkIHRvIGEgc3dpdGNoLlxuLy8gXHRcdC0gTnVtYmVyIG9mIHNvdXJjZXM6IFxuLy8gXHRcdFx0QXZhaWxhYmxlIHJhbmdlOiAxMDI0IFxuLy8gXHRcdFx0XHQqIC01MTIgdG8gKzUxMiBpcyBhIGZhaXIgYmFsYW5jZSBiZXR3ZWVuIHJhbmdlIGFuZCBcbi8vIFx0XHRcdFx0YXJ0aWZhY3RzIG9uIGRpZmZlcmVudCBicm93c2VycywgRmlyZWZveCBoYXZpbmcgaXNzdWVzXG4vLyBcdFx0XHRcdGFyb3VuZCB0aGUgKzgwMCBtYXJrLCBDaHJvbWUgc3RvcHMgaW5jcmVhc2luZyBcbi8vIFx0XHRcdFx0YWZ0ZXIgYXJvdW5kICsxMDAwLiBTYWZhcmkgaXMganVzdCBicm9rZW46IHBsYXliYWNrUmF0ZSBcbi8vIFx0XHRcdFx0QXVkaW9QYXJhbSBjYW5ub3QgYmUgZHJpdmVuIGJ5IGF1ZGlvIHNpZ25hbC4gV2F0LlxuLy8gXHRcdFx0TWF4IGZyZXE6IHNhbXBsZVJhdGUgKiAwLjVcbi8vIFx0XHRcdFxuLy8gXHRcdFx0bnVtU291cmNlczogTWF0aC5jZWlsKCBtYXhGcmVxIC8gYXZhaWxhYmxlUmFuZ2UgKVxuLy8gXHRcdFx0XHRcbi8vIFx0XHRcdGJyZWFrcG9pbnRzOiBpICogbWF4RnJlcVxuLy8gXHRcdFx0aW5pdGlhbCB2YWx1ZSBvZiBwbGF5YmFja1JhdGU6IC01MTIuXG4vLyBcdFx0XHRcbi8vIFx0XHQtIEZvciBzYW1wbGVSYXRlIG9mIDQ4MDAwOlxuLy8gXHRcdFx0bnVtU291cmNlczogTWF0aC5jZWlsKCAoNDgwMDAgKiAwLjUpIC8gMTAyNCApID0gMjQuXG4vLyBcdFx0XHRcbi8vIFx0XHRcdFxuLy8gIC0gTWFqb3IgZG93bnNpZGU6IG1hbnksIG1hbnkgYnVmZmVyU291cmNlcyB3aWxsIGJlIGNyZWF0ZWRcbi8vICAgIGVhY2ggdGltZSBgc3RhcnQoKWAgaXMgY2FsbGVkLiBcbi8vIFx0XHRcdFxuLy9cbmNsYXNzIEJ1ZmZlck9zY2lsbGF0b3IgZXh0ZW5kcyBOb2RlIHtcblx0Y29uc3RydWN0b3IoIGlvLCBnZW5lcmF0b3IgKSB7XG5cdFx0c3VwZXIoIGlvLCAwLCAxICk7XG5cblx0XHR0aGlzLmdlbmVyYXRvciA9IGdlbmVyYXRvcjtcblx0XHR0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblx0XHR0aGlzLmNvbnRyb2xzLmRldHVuZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuXHRcdHRoaXMucmVzZXQoKTtcblx0fVxuXG5cdHN0YXJ0KCB3aGVuLCBwaGFzZSApIHtcblx0XHR2YXIgYnVmZmVyID0gQnVmZmVyVXRpbHMuZ2VuZXJhdGVCdWZmZXIoXG5cdFx0XHRcdHRoaXMuaW8sXG5cdFx0XHRcdDEsXG5cdFx0XHRcdHRoaXMuY29udGV4dC5zYW1wbGVSYXRlLFxuXHRcdFx0XHR0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSxcblx0XHRcdFx0dGhpcy5nZW5lcmF0b3Jcblx0XHRcdCksXG5cdFx0XHRidWZmZXJTb3VyY2U7XG5cblx0XHR0aGlzLnJlc2V0KCk7XG5cblx0XHRidWZmZXJTb3VyY2UgPSB0aGlzLmdldEdyYXBoKCkuYnVmZmVyU291cmNlO1xuXHRcdGJ1ZmZlclNvdXJjZS5idWZmZXIgPSBidWZmZXI7XG5cdFx0YnVmZmVyU291cmNlLnN0YXJ0KCB3aGVuLCBwaGFzZSApO1xuXHRcdGNvbnNvbGUubG9nKCBidWZmZXJTb3VyY2UgKTtcblx0fVxuXG5cdHN0b3AoIHdoZW4gKSB7XG5cdFx0dmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpLFxuXHRcdFx0YnVmZmVyU291cmNlID0gZ3JhcGguYnVmZmVyU291cmNlLFxuXHRcdFx0c2VsZiA9IHRoaXM7XG5cblx0XHRidWZmZXJTb3VyY2Uuc3RvcCggd2hlbiApO1xuXHR9XG5cblx0cmVzZXQoKSB7XG5cdFx0dmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG5cdFx0Z3JhcGguYnVmZmVyU291cmNlID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuXHRcdGdyYXBoLmJ1ZmZlclNvdXJjZS5sb29wID0gdHJ1ZTtcblx0XHRncmFwaC5idWZmZXJTb3VyY2UucGxheWJhY2tSYXRlLnZhbHVlID0gMDtcblx0XHRncmFwaC5idWZmZXJTb3VyY2UuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuXHRcdHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmJ1ZmZlclNvdXJjZS5wbGF5YmFja1JhdGUgKTtcblxuXHRcdGlmICggZ3JhcGguYnVmZmVyU291cmNlLmRldHVuZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gKSB7XG5cdFx0XHR0aGlzLmNvbnRyb2xzLmRldHVuZS5jb25uZWN0KCBncmFwaC5idWZmZXJTb3VyY2UuZGV0dW5lICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcblx0fVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVCdWZmZXJPc2NpbGxhdG9yID0gZnVuY3Rpb24oIGdlbmVyYXRvciApIHtcblx0cmV0dXJuIG5ldyBCdWZmZXJPc2NpbGxhdG9yKCB0aGlzLCBnZW5lcmF0b3IgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE9zY2lsbGF0b3JCYW5rIGZyb20gXCIuLi9vc2NpbGxhdG9ycy9Pc2NpbGxhdG9yQmFuay5lczZcIjtcblxuY2xhc3MgRk1Pc2NpbGxhdG9yIGV4dGVuZHMgT3NjaWxsYXRvckJhbmsge1xuXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCB0aGlzICk7XG5cbiAgICAgICAgLy8gRk0vbW9kdWxhdG9yIG9zY2lsbGF0b3Igc2V0dXBcbiAgICAgICAgZ3JhcGguZm1Pc2NpbGxhdG9yID0gdGhpcy5pby5jcmVhdGVPc2NpbGxhdG9yQmFuaygpO1xuICAgICAgICBncmFwaC5mbU9zY0Ftb3VudCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmZtT3NjQW1vdW50TXVsdGlwbGllciA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGguZm1Pc2NBbW91bnQuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmZtT3NjaWxsYXRvci5jb25uZWN0KCBncmFwaC5mbU9zY0Ftb3VudCApO1xuICAgICAgICBncmFwaC5mbU9zY0Ftb3VudC5jb25uZWN0KCBncmFwaC5mbU9zY0Ftb3VudE11bHRpcGxpZXIsIDAsIDAgKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtRnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtRnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmZtT3NjaWxsYXRvci5jb250cm9scy5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mbUZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5mbU9zY0Ftb3VudE11bHRpcGxpZXIsIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtV2F2ZWZvcm0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1XYXZlZm9ybS5jb25uZWN0KCBncmFwaC5mbU9zY2lsbGF0b3IuY29udHJvbHMud2F2ZWZvcm0gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtT3NjQW1vdW50ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtT3NjQW1vdW50LmNvbm5lY3QoIGdyYXBoLmZtT3NjQW1vdW50LmdhaW4gKTtcblxuXG4gICAgICAgIC8vIFNlbGYtZm0gc2V0dXBcbiAgICAgICAgZ3JhcGguZm1TZWxmQW1vdW50cyA9IFtdO1xuICAgICAgICBncmFwaC5mbVNlbGZBbW91bnRNdWx0aXBsaWVycyA9IFtdO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtU2VsZkFtb3VudCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IGdyYXBoLm9zY2lsbGF0b3JzLmxlbmd0aDsgKytpICkge1xuICAgICAgICBcdC8vIENvbm5lY3QgRk0gb3NjaWxsYXRvciB0byB0aGUgZXhpc3Rpbmcgb3NjaWxsYXRvcnNcbiAgICAgICAgXHQvLyBmcmVxdWVuY3kgY29udHJvbC5cbiAgICAgICAgXHRncmFwaC5mbU9zY0Ftb3VudE11bHRpcGxpZXIuY29ubmVjdCggZ3JhcGgub3NjaWxsYXRvcnNbIGkgXS5mcmVxdWVuY3kgKTtcblxuXG4gICAgICAgIFx0Ly8gRm9yIGVhY2ggb3NjaWxsYXRvciBpbiB0aGUgb3NjaWxsYXRvciBiYW5rLFxuICAgICAgICBcdC8vIGNyZWF0ZSBhIEZNLXNlbGYgR2Fpbk5vZGUsIGFuZCBjb25uZWN0IHRoZSBvc2NcbiAgICAgICAgXHQvLyB0byBpdCwgdGhlbiBpdCB0byB0aGUgb3NjJ3MgZnJlcXVlbmN5LlxuICAgICAgICBcdGdyYXBoLmZtU2VsZkFtb3VudHNbIGkgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIFx0Z3JhcGguZm1TZWxmQW1vdW50c1sgaSBdLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIFx0Z3JhcGguZm1TZWxmQW1vdW50TXVsdGlwbGllcnNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgXHRncmFwaC5mbVNlbGZBbW91bnRzWyBpIF0uY29ubmVjdCggZ3JhcGguZm1TZWxmQW1vdW50TXVsdGlwbGllcnNbIGkgXSwgMCwgMCApO1xuICAgICAgICBcdHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmZtU2VsZkFtb3VudE11bHRpcGxpZXJzWyBpIF0sIDAsIDEgKTtcblxuICAgICAgICBcdGdyYXBoLm9zY2lsbGF0b3JzWyBpIF0uY29ubmVjdCggZ3JhcGguZm1TZWxmQW1vdW50c1sgaSBdICk7XG4gICAgICAgIFx0Z3JhcGguZm1TZWxmQW1vdW50TXVsdGlwbGllcnNbIGkgXS5jb25uZWN0KCBncmFwaC5vc2NpbGxhdG9yc1sgaSBdLmZyZXF1ZW5jeSApO1xuXG4gICAgICAgIFx0Ly8gTWFrZSBzdXJlIHRoZSBGTS1zZWxmIGFtb3VudCBpcyBjb250cm9sbGFibGUgd2l0aCBvbmUgcGFyYW1ldGVyLlxuICAgICAgICBcdHRoaXMuY29udHJvbHMuZm1TZWxmQW1vdW50LmNvbm5lY3QoIGdyYXBoLmZtU2VsZkFtb3VudHNbIGkgXS5nYWluICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRk1Pc2NpbGxhdG9yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBGTU9zY2lsbGF0b3IoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcbmltcG9ydCBCdWZmZXJVdGlscyBmcm9tIFwiLi4vYnVmZmVycy9CdWZmZXJVdGlscy5lczZcIjtcbmltcG9ydCBCdWZmZXJHZW5lcmF0b3JzIGZyb20gXCIuLi9idWZmZXJzL0J1ZmZlckdlbmVyYXRvcnMuZXM2XCI7XG5cblxudmFyIEJVRkZFUlMgPSBuZXcgV2Vha01hcCgpO1xuXG5jbGFzcyBOb2lzZU9zY2lsbGF0b3JCYW5rIGV4dGVuZHMgTm9kZSB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCB0aGlzICksXG4gICAgICAgICAgICB0eXBlcyA9IHRoaXMuY29uc3RydWN0b3IudHlwZXMsXG4gICAgICAgICAgICB0eXBlS2V5cyA9IE9iamVjdC5rZXlzKCB0eXBlcyApO1xuXG4gICAgICAgIGdyYXBoLmJ1ZmZlclNvdXJjZXMgPSBbXTtcbiAgICAgICAgZ3JhcGgub3V0cHV0R2FpbiA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIE9iamVjdC5rZXlzKCB0eXBlcyApLmxlbmd0aCwgMCApO1xuICAgICAgICBncmFwaC5vdXRwdXRHYWluLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHR5cGVLZXlzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coIEJ1ZmZlckdlbmVyYXRvcnNbIHRoaXMuY29uc3RydWN0b3IuZ2VuZXJhdG9yS2V5c1sgaSBdIF0gKTtcblxuICAgICAgICAgICAgc291cmNlLmJ1ZmZlciA9IEJ1ZmZlclV0aWxzLmdlbmVyYXRlQnVmZmVyKFxuICAgICAgICAgICAgICAgIHRoaXMuaW8sIC8vIGNvbnRleHRcbiAgICAgICAgICAgICAgICAxLCAvLyBjaGFubmVsc1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlICogNSwgLy8gbGVuZ3RoICg1IHNlY29uZHMpXG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUsIC8vIFNhbXBsZVJhdGVcbiAgICAgICAgICAgICAgICBCdWZmZXJHZW5lcmF0b3JzWyB0aGlzLmNvbnN0cnVjdG9yLmdlbmVyYXRvcktleXNbIGkgXSBdIC8vIEdlbmVyYXRvciBmdW5jdGlvblxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgc291cmNlLmxvb3AgPSB0cnVlO1xuICAgICAgICAgICAgc291cmNlLnN0YXJ0KCAwICk7XG5cbiAgICAgICAgICAgIHNvdXJjZS5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyLCAwLCBpICk7XG4gICAgICAgICAgICBncmFwaC5idWZmZXJTb3VyY2VzLnB1c2goIHNvdXJjZSApO1xuICAgICAgICB9XG5cbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlci5jb25uZWN0KCBncmFwaC5vdXRwdXRHYWluICk7XG4gICAgICAgIGdyYXBoLm91dHB1dEdhaW4uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnR5cGUgPSBncmFwaC5jcm9zc2ZhZGVyLmNvbnRyb2xzLmluZGV4O1xuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIHN0YXJ0KCB0aW1lICkge1xuICAgICAgICB2YXIgb3V0cHV0R2FpbiA9IHRoaXMuZ2V0R3JhcGgoIHRoaXMgKS5vdXRwdXRHYWluO1xuXG4gICAgICAgIHRpbWUgPSB0aW1lIHx8IHRoaXMuY29udGV4dC5jdXJyZW50VGltZTtcbiAgICAgICAgb3V0cHV0R2Fpbi5nYWluLnZhbHVlID0gMTtcbiAgICB9XG5cbiAgICBzdG9wKCB0aW1lICkge1xuICAgICAgICB2YXIgb3V0cHV0R2FpbiA9IHRoaXMuZ2V0R3JhcGgoIHRoaXMgKS5vdXRwdXRHYWluO1xuXG4gICAgICAgIHRpbWUgPSB0aW1lIHx8IHRoaXMuY29udGV4dC5jdXJyZW50VGltZTtcbiAgICAgICAgb3V0cHV0R2Fpbi5nYWluLnZhbHVlID0gMDtcbiAgICB9XG59XG5cblxuTm9pc2VPc2NpbGxhdG9yQmFuay50eXBlcyA9IHtcbiAgICBXSElURTogMCxcbiAgICBHQVVTU0lBTl9XSElURTogMSxcbiAgICBQSU5LOiAyXG59O1xuXG5Ob2lzZU9zY2lsbGF0b3JCYW5rLmdlbmVyYXRvcktleXMgPSBbXG4gICAgJ1doaXRlTm9pc2UnLFxuICAgICdHYXVzc2lhbk5vaXNlJyxcbiAgICAnUGlua05vaXNlJ1xuXTtcblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOb2lzZU9zY2lsbGF0b3JCYW5rID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBOb2lzZU9zY2lsbGF0b3JCYW5rKCB0aGlzICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG52YXIgT1NDSUxMQVRPUl9UWVBFUyA9IFtcbiAgICAnc2luZScsXG4gICAgJ3RyaWFuZ2xlJyxcbiAgICAnc2F3dG9vdGgnLFxuICAgICdzcXVhcmUnXG5dO1xuXG5jbGFzcyBPc2NpbGxhdG9yQmFuayBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIE9TQ0lMTEFUT1JfVFlQRVMubGVuZ3RoLCAwICk7XG4gICAgICAgIGdyYXBoLm9zY2lsbGF0b3JzID0gW107XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZGV0dW5lID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLndhdmVmb3JtID0gZ3JhcGguY3Jvc3NmYWRlci5jb250cm9scy5pbmRleDtcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IE9TQ0lMTEFUT1JfVFlQRVMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB2YXIgb3NjID0gdGhpcy5jb250ZXh0LmNyZWF0ZU9zY2lsbGF0b3IoKTtcblxuICAgICAgICAgICAgb3NjLnR5cGUgPSBPU0NJTExBVE9SX1RZUEVTWyBpIF07XG4gICAgICAgICAgICBvc2MuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgICAgIG9zYy5zdGFydCggMCApO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBvc2MuZnJlcXVlbmN5ICk7XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmRldHVuZS5jb25uZWN0KCBvc2MuZGV0dW5lICk7XG4gICAgICAgICAgICBvc2MuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlciwgMCwgaSApO1xuXG4gICAgICAgICAgICBncmFwaC5vc2NpbGxhdG9ycy5wdXNoKCBvc2MgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0TGV2ZWwuZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlci5jb25uZWN0KCBncmFwaC5vdXRwdXRMZXZlbCApO1xuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgc3RhcnQoIGRlbGF5ID0gMCApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAxO1xuICAgIH1cblxuICAgIHN0b3AoIGRlbGF5ID0gMCApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAwO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlT3NjaWxsYXRvckJhbmsgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9zY2lsbGF0b3JCYW5rKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBPc2NpbGxhdG9yQmFuazsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBTaW5lQmFuayBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtU2luZXMgPSA0ICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgub3NjaWxsYXRvcnMgPSBbXTtcbiAgICAgICAgZ3JhcGguaGFybW9uaWNNdWx0aXBsaWVycyA9IFtdO1xuICAgICAgICBncmFwaC5udW1TaW5lcyA9IG51bVNpbmVzO1xuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAxIC8gbnVtU2luZXM7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZGV0dW5lID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhhcm1vbmljcyA9IFtdO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG51bVNpbmVzOyArK2kgKSB7XG4gICAgICAgICAgICB2YXIgb3NjID0gdGhpcy5jb250ZXh0LmNyZWF0ZU9zY2lsbGF0b3IoKSxcbiAgICAgICAgICAgICAgICBoYXJtb25pY0NvbnRyb2wgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCksXG4gICAgICAgICAgICAgICAgaGFybW9uaWNNdWx0aXBsaWVyID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgICAgICBvc2MudHlwZSA9ICdzaW5lJztcbiAgICAgICAgICAgIG9zYy5mcmVxdWVuY3kudmFsdWUgPSAwO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBoYXJtb25pY011bHRpcGxpZXIsIDAsIDAgKTtcbiAgICAgICAgICAgIGhhcm1vbmljQ29udHJvbC5jb25uZWN0KCBoYXJtb25pY011bHRpcGxpZXIsIDAsIDEgKTtcbiAgICAgICAgICAgIGhhcm1vbmljTXVsdGlwbGllci5jb25uZWN0KCBvc2MuZnJlcXVlbmN5ICk7XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmRldHVuZS5jb25uZWN0KCBvc2MuZGV0dW5lICk7XG5cbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuaGFybW9uaWNzWyBpIF0gPSBoYXJtb25pY0NvbnRyb2w7XG5cbiAgICAgICAgICAgIG9zYy5zdGFydCggMCApO1xuICAgICAgICAgICAgb3NjLmNvbm5lY3QoIGdyYXBoLm91dHB1dExldmVsICk7XG4gICAgICAgICAgICBncmFwaC5vc2NpbGxhdG9ycy5wdXNoKCBvc2MgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBzdGFydCggZGVsYXkgPSAwICkge1xuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAxIC8gZ3JhcGgubnVtU2luZXM7XG4gICAgfVxuXG4gICAgc3RvcCggZGVsYXkgPSAwICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkub3V0cHV0TGV2ZWwuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTaW5lQmFuayA9IGZ1bmN0aW9uKCBudW1TaW5lcyApIHtcbiAgICByZXR1cm4gbmV3IFNpbmVCYW5rKCB0aGlzLCBudW1TaW5lcyApO1xufTtcblxuZXhwb3J0XG5kZWZhdWx0IFNpbmVCYW5rOyIsInZhciBVdGlscyA9IHt9O1xuXG5VdGlscy5pc1R5cGVkQXJyYXkgPSBmdW5jdGlvbiggYXJyYXkgKSB7XG5cdGlmICggYXJyYXkgIT09IHVuZGVmaW5lZCAmJiBhcnJheS5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciApIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdHJldHVybiBmYWxzZTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFV0aWxzOyJdfQ==
