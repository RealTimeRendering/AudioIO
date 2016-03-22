(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreConfigEs6 = require('../core/config.es6');

var _coreConfigEs62 = _interopRequireDefault(_coreConfigEs6);

var _mixinsMathEs6 = require('../mixins/Math.es6');

var _mixinsMathEs62 = _interopRequireDefault(_mixinsMathEs6);

var BUFFER_STORE = {};
var BufferGenerators = {};

function generateBufferStoreKey(length, numberOfChannels, sampleRate) {
    return length + '-' + numberOfChannels + '-' + sampleRate;
}

BufferGenerators.SineWave = function (io, numberOfChannels, length, sampleRate) {
    var key = generateBufferStoreKey(length, numberOfChannels, sampleRate),
        buffer,
        channelData;

    if (BUFFER_STORE[key]) {
        return BUFFER_STORE[key];
    }

    buffer = io.context.createBuffer(numberOfChannels, length, sampleRate);

    for (var c = 0; c < numberOfChannels; ++c) {
        channelData = buffer.getChannelData(c);

        for (var i = 0; i < length; ++i) {
            var x = Math.PI * (i / length) - Math.PI * 0.5;
            x *= 2;
            channelData[i] = Math.sin(x);
        }
    }

    BUFFER_STORE[key] = buffer;

    return buffer;
};

BufferGenerators.SawWave = function (io, numberOfChannels, length, sampleRate) {
    var key = generateBufferStoreKey(length, numberOfChannels, sampleRate),
        buffer,
        channelData;

    if (BUFFER_STORE[key]) {
        return BUFFER_STORE[key];
    }

    buffer = io.context.createBuffer(numberOfChannels, length, sampleRate);

    for (var c = 0; c < numberOfChannels; ++c) {
        channelData = buffer.getChannelData(c);

        for (var i = 0; i < length; ++i) {
            var x = i / length * 2 - 1;
            channelData[i] = x;
        }
    }

    BUFFER_STORE[key] = buffer;

    return buffer;
};

BufferGenerators.SquareWave = function (io, numberOfChannels, length, sampleRate) {
    var key = generateBufferStoreKey(length, numberOfChannels, sampleRate),
        buffer,
        channelData;

    if (BUFFER_STORE[key]) {
        return BUFFER_STORE[key];
    }

    buffer = io.context.createBuffer(numberOfChannels, length, sampleRate);

    for (var c = 0; c < numberOfChannels; ++c) {
        channelData = buffer.getChannelData(c);

        for (var i = 0; i < length; ++i) {
            var x = i / length * 2 - 1;
            channelData[i] = Math.sign(x + 0.001);
        }
    }

    BUFFER_STORE[key] = buffer;

    return buffer;
};

BufferGenerators.TriangleWave = function (io, numberOfChannels, length, sampleRate) {
    var key = generateBufferStoreKey(length, numberOfChannels, sampleRate),
        buffer,
        channelData;

    if (BUFFER_STORE[key]) {
        return BUFFER_STORE[key];
    }

    buffer = io.context.createBuffer(numberOfChannels, length, sampleRate);

    for (var c = 0; c < numberOfChannels; ++c) {
        channelData = buffer.getChannelData(c);

        for (var i = 0; i < length; ++i) {
            var x = Math.abs(i % length * 2 - length) - length * 0.5;
            x /= length * 0.5;
            channelData[i] = Math.sin(x);
        }
    }

    BUFFER_STORE[key] = buffer;

    return buffer;
};

module.exports = BufferGenerators;

},{"../core/config.es6":6,"../mixins/Math.es6":79}],2:[function(require,module,exports){
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

var _utilitiesBufferUtilsEs6 = require('../utilities/BufferUtils.es6');

var _utilitiesBufferUtilsEs62 = _interopRequireDefault(_utilitiesBufferUtilsEs6);

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

AudioIO.BufferUtils = _utilitiesBufferUtilsEs62['default'];
AudioIO.Utils = _utilitiesUtilsEs62['default'];
AudioIO.BufferGenerators = _buffersBufferGeneratorsEs62['default'];

window.AudioIO = AudioIO;
exports['default'] = AudioIO;
module.exports = exports['default'];

},{"../buffers/BufferGenerators.es6":1,"../mixins/conversions.es6":82,"../mixins/math.es6":83,"../utilities/BufferUtils.es6":93,"../utilities/Utils.es6":94,"./config.es6":6,"./overrides.es6":7,"./signalCurves.es6":8}],3:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":80,"../mixins/connections.es6":81,"../mixins/setIO.es6":87,"./AudioIO.es6":2}],4:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":80,"../mixins/connections.es6":81,"../mixins/setIO.es6":87,"./AudioIO.es6":2}],5:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":80,"../mixins/connections.es6":81,"../mixins/setIO.es6":87,"./AudioIO.es6":2}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{"../mixins/Math.es6":79,"./config.es6":6}],9:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"./CustomEnvelope.es6":12}],10:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"./CustomEnvelope.es6":12}],11:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"./CustomEnvelope.es6":12}],12:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/config.es6":6,"../mixins/setIO.es6":87}],13:[function(require,module,exports){
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

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],14:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _graphsDryWetNodeEs6 = require("../graphs/DryWetNode.es6");

var _graphsDryWetNodeEs62 = _interopRequireDefault(_graphsDryWetNodeEs6);

// TODO: Add feedbackLevel and delayTime Param instances
// to control this node.

var Delay = (function (_DryWetNode) {
    function Delay(io) {
        var time = arguments[1] === undefined ? 0 : arguments[1];
        var feedbackLevel = arguments[2] === undefined ? 0 : arguments[2];

        _classCallCheck(this, Delay);

        _DryWetNode.call(this, io, 1, 1);

        // Create the control nodes.
        this.controls.feedback = this.io.createParam(feedbackLevel);
        this.controls.time = this.io.createParam(time);

        // Create feedback and delay nodes
        this.feedback = this.context.createGain();
        this.delay = this.context.createDelay();

        // Setup the feedback loop
        this.delay.connect(this.feedback);
        this.feedback.connect(this.delay);

        // Also connect the delay to the wet output.
        this.delay.connect(this.wet);

        // Connect input to delay
        this.inputs[0].connect(this.delay);

        this.delay.delayTime.value = 0;
        this.feedback.gain.value = 0;

        this.controls.time.connect(this.delay.delayTime);
        this.controls.feedback.connect(this.feedback.gain);
    }

    _inherits(Delay, _DryWetNode);

    return Delay;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createDelay = function (time, feedbackLevel) {
    return new Delay(this, time, feedbackLevel);
};

exports["default"] = Delay;
module.exports = exports["default"];

},{"../core/AudioIO.es6":2,"../graphs/DryWetNode.es6":30}],15:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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

var _graphsDryWetNodeEs6 = require("../graphs/DryWetNode.es6");

var _graphsDryWetNodeEs62 = _interopRequireDefault(_graphsDryWetNodeEs6);

var _DelayEs6 = require("./Delay.es6");

var _DelayEs62 = _interopRequireDefault(_DelayEs6);

// TODO:
//  - Convert this node to use Param controls
//    for time and feedback.

var PingPongDelay = (function (_DryWetNode) {
    function PingPongDelay(io) {
        var time = arguments[1] === undefined ? 0.25 : arguments[1];
        var feedbackLevel = arguments[2] === undefined ? 0.5 : arguments[2];

        _classCallCheck(this, PingPongDelay);

        _DryWetNode.call(this, io, 1, 1);

        // Create channel splitter and merger
        this.splitter = this.context.createChannelSplitter(2);
        this.merger = this.context.createChannelMerger(2);

        // Create feedback and delay nodes
        this.feedbackL = this.context.createGain();
        this.feedbackR = this.context.createGain();
        this.delayL = this.context.createDelay();
        this.delayR = this.context.createDelay();

        // Setup the feedback loop
        this.delayL.connect(this.feedbackL);
        this.feedbackL.connect(this.delayR);
        this.delayR.connect(this.feedbackR);
        this.feedbackR.connect(this.delayL);

        this.inputs[0].connect(this.splitter);
        this.splitter.connect(this.delayL, 0);
        this.feedbackL.connect(this.merger, 0, 0);
        this.feedbackR.connect(this.merger, 0, 1);
        this.merger.connect(this.wet);

        this.time = time;
        this.feedbackLevel = feedbackLevel;
    }

    _inherits(PingPongDelay, _DryWetNode);

    _createClass(PingPongDelay, [{
        key: "time",
        get: function get() {
            return this.delayL.delayTime;
        },
        set: function set(value) {
            this.delayL.delayTime.linearRampToValueAtTime(value, this.context.currentTime + 0.5);

            this.delayR.delayTime.linearRampToValueAtTime(value, this.context.currentTime + 0.5);
        }
    }, {
        key: "feedbackLevel",
        get: function get() {
            return this.feedbackL.gain.value;
        },
        set: function set(level) {
            this.feedbackL.gain.value = level;
            this.feedbackR.gain.value = level;
        }
    }]);

    return PingPongDelay;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].mixinSingle(PingPongDelay.prototype, _mixinsSetIOEs62["default"], "_setIO");
_coreAudioIOEs62["default"].mixin(PingPongDelay.prototype, _mixinsConnectionsEs62["default"]);
_coreAudioIOEs62["default"].mixin(PingPongDelay.prototype, _mixinsCleanersEs62["default"]);

_coreAudioIOEs62["default"].prototype.createPingPongDelay = function (time, feedbackLevel) {
    return new PingPongDelay(this, time, feedbackLevel);
};

},{"../core/AudioIO.es6":2,"../graphs/DryWetNode.es6":30,"../mixins/cleaners.es6":80,"../mixins/connections.es6":81,"../mixins/setIO.es6":87,"./Delay.es6":14}],16:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],17:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _graphsDryWetNodeEs6 = require("../graphs/DryWetNode.es6");

var _graphsDryWetNodeEs62 = _interopRequireDefault(_graphsDryWetNodeEs6);

// TODO: Add feedbackLevel and delayTime Param instances
// to control this node.

var SineShaper = (function (_DryWetNode) {
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

    _inherits(SineShaper, _DryWetNode);

    return SineShaper;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createSineShaper = function (time, feedbackLevel) {
    return new SineShaper(this, time, feedbackLevel);
};

exports["default"] = SineShaper;
module.exports = exports["default"];

},{"../core/AudioIO.es6":2,"../graphs/DryWetNode.es6":30}],18:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// Based on the following formula from Michael Gruhn:
//  - http://musicdsp.org/showArchiveComment.php?ArchiveID=255
//
// ------------------------------------------------------------
//
// Calculate transformation matrix's coefficients
// cos_coef = cos(angle);
// sin_coef = sin(angle);

// Do this per sample
// out_left = in_left * cos_coef - in_right * sin_coef;
// out_right = in_left * sin_coef + in_right * cos_coef;

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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],19:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../core/Node.es6");

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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],20:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],21:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],22:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],23:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],24:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],25:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],26:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],27:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../mixins/setIO.es6":87}],28:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],29:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],30:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3,"../mixins/cleaners.es6":80,"../mixins/connections.es6":81,"../mixins/setIO.es6":87}],31:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],32:[function(require,module,exports){
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

        this.inputs[0].connect(this.outputs[0]);
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],33:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3,"../mixins/math.es6":83}],34:[function(require,module,exports){
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

require('./fx/Delay.es6');

require('./fx/PingPongDelay.es6');

require('./fx/SineShaper.es6');

require('./fx/StereoWidth.es6');

require('./fx/StereoRotation.es6');

// import './fx/BitReduction.es6';

require('./fx/SchroederAllPass.es6');

require('./fx/DCTrap.es6');

require('./fx/filters/FilterBank.es6');

require('./fx/filters/LPFilter.es6');

require('./fx/filters/BPFilter.es6');

require('./fx/filters/HPFilter.es6');

require('./fx/filters/NotchFilter.es6');

require('./fx/filters/AllPassFilter.es6');

require('./fx/eq/CustomEQ.es6');

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

window.AudioContext = window.AudioContext || window.webkitAudioContext;

// import './graphs/Sketch.es6';

window.Param = _coreParamEs62['default'];
window.Node = _coreNodeEs62['default'];

},{"./core/AudioIO.es6":2,"./core/Node.es6":3,"./core/Param.es6":4,"./core/WaveShaper.es6":5,"./envelopes/ADBDSREnvelope.es6":9,"./envelopes/ADEnvelope.es6":10,"./envelopes/ADSREnvelope.es6":11,"./envelopes/CustomEnvelope.es6":12,"./fx/DCTrap.es6":13,"./fx/Delay.es6":14,"./fx/PingPongDelay.es6":15,"./fx/SchroederAllPass.es6":16,"./fx/SineShaper.es6":17,"./fx/StereoRotation.es6":18,"./fx/StereoWidth.es6":19,"./fx/eq/CustomEQ.es6":20,"./fx/filters/AllPassFilter.es6":21,"./fx/filters/BPFilter.es6":22,"./fx/filters/FilterBank.es6":23,"./fx/filters/HPFilter.es6":24,"./fx/filters/LPFilter.es6":25,"./fx/filters/NotchFilter.es6":26,"./generators/OscillatorGenerator.es6":27,"./graphs/Counter.es6":28,"./graphs/Crossfader.es6":29,"./graphs/DryWetNode.es6":30,"./graphs/EQShelf.es6":31,"./graphs/PhaseOffset.es6":32,"./instruments/GeneratorPlayer.es6":33,"./math/Abs.es6":35,"./math/Add.es6":36,"./math/Average.es6":37,"./math/Clamp.es6":38,"./math/Constant.es6":39,"./math/Divide.es6":40,"./math/Floor.es6":41,"./math/Lerp.es6":42,"./math/Max.es6":43,"./math/Min.es6":44,"./math/Multiply.es6":45,"./math/Negate.es6":46,"./math/Pow.es6":47,"./math/Reciprocal.es6":48,"./math/Round.es6":49,"./math/SampleDelay.es6":50,"./math/Scale.es6":51,"./math/ScaleExp.es6":52,"./math/Sign.es6":53,"./math/Sqrt.es6":54,"./math/Square.es6":55,"./math/Subtract.es6":56,"./math/Switch.es6":57,"./math/logical-operators/AND.es6":58,"./math/logical-operators/LogicalOperator.es6":59,"./math/logical-operators/NAND.es6":60,"./math/logical-operators/NOR.es6":61,"./math/logical-operators/NOT.es6":62,"./math/logical-operators/OR.es6":63,"./math/logical-operators/XOR.es6":64,"./math/relational-operators/EqualTo.es6":65,"./math/relational-operators/EqualToZero.es6":66,"./math/relational-operators/GreaterThan.es6":67,"./math/relational-operators/GreaterThanEqualTo.es6":68,"./math/relational-operators/GreaterThanZero.es6":69,"./math/relational-operators/IfElse.es6":70,"./math/relational-operators/LessThan.es6":71,"./math/relational-operators/LessThanEqualTo.es6":72,"./math/relational-operators/LessThanZero.es6":73,"./math/trigonometry/Cos.es6":74,"./math/trigonometry/DegToRad.es6":75,"./math/trigonometry/RadToDeg.es6":76,"./math/trigonometry/Sin.es6":77,"./math/trigonometry/Tan.es6":78,"./oscillators/BufferOscillator.es6":88,"./oscillators/FMOscillator.es6":89,"./oscillators/NoiseOscillatorBank.es6":90,"./oscillators/OscillatorBank.es6":91,"./oscillators/SineBank.es6":92}],35:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],36:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],37:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],38:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],39:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],40:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],41:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],42:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],43:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],44:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],45:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],46:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],47:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],48:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],49:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],50:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],51:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],52:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],53:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],54:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],55:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],56:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],57:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],58:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"./LogicalOperator.es6":59}],59:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],60:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"./LogicalOperator.es6":59}],61:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"./LogicalOperator.es6":59}],62:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"./LogicalOperator.es6":59}],63:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"./LogicalOperator.es6":59}],64:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"./LogicalOperator.es6":59}],65:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],66:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3,"./EqualTo.es6":65}],67:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],68:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],69:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],70:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],71:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],72:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],73:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],74:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],75:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],76:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],77:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],78:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],79:[function(require,module,exports){
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

},{"../core/config.es6":6}],80:[function(require,module,exports){
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

},{}],81:[function(require,module,exports){
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

},{}],82:[function(require,module,exports){
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

},{"../core/config.es6":6,"./math.es6":83,"./noteRegExp.es6":84,"./noteStrings.es6":85,"./notes.es6":86}],83:[function(require,module,exports){
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

},{"../core/config.es6":6}],84:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = /^([A|B|C|D|E|F|G]{1})([#bx]{0,2})([\-\+]?\d+)?([\+|\-]{1}\d*.\d*)?/;
module.exports = exports["default"];

},{}],85:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
module.exports = exports['default'];

},{}],86:[function(require,module,exports){
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

},{}],87:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = _setIO;

function _setIO(io) {
    this.io = io;
    this.context = io.context;
}

;
module.exports = exports["default"];

},{}],88:[function(require,module,exports){
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
		var buffer = this.generator(this.io, 1, this.context.sampleRate, this.context.sampleRate),
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

},{"../buffers/BufferGenerators.es6":1,"../core/AudioIO.es6":2,"../core/Node.es6":3}],89:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../oscillators/OscillatorBank.es6":91}],90:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var _mixinsMathEs6 = require("../mixins/math.es6");

var _mixinsMathEs62 = _interopRequireDefault(_mixinsMathEs6);

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
            typeKeys = Object.keys(types),
            buffers = this._getBuffers();

        graph.bufferSources = [];
        graph.outputGain = this.context.createGain();
        graph.crossfader = this.io.createCrossfader(Object.keys(types).length, 0);
        graph.outputGain.gain.value = 0;

        for (var i = 0; i < typeKeys.length; ++i) {
            var source = this.context.createBufferSource(),
                buffer = buffers[typeKeys[i]];

            source.buffer = buffer;
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

    NoiseOscillatorBank.prototype._createSingleBuffer = function _createSingleBuffer(type) {
        var sampleRate = this.context.sampleRate,
            buffer = this.context.createBuffer(1, sampleRate, sampleRate),
            channel = buffer.getChannelData(0),
            fn;

        switch (type) {
            case "WHITE":
                fn = Math.random;
                break;

            case "GAUSSIAN_WHITE":
                fn = _mixinsMathEs62["default"].nrand;
                break;

            case "PINK":
                _mixinsMathEs62["default"].generatePinkNumber(128, 5);
                fn = _mixinsMathEs62["default"].getNextPinkNumber;
                break;
        }

        for (var i = 0; i < sampleRate; ++i) {
            channel[i] = fn() * 2 - 1;
        }

        console.log(type, Math.min.apply(Math, channel), Math.max.apply(Math, channel));

        return buffer;
    };

    NoiseOscillatorBank.prototype._createBuffers = function _createBuffers() {
        var buffers = {},
            keys = Object.keys(buffers),
            types = this.constructor.types,
            typeKeys = Object.keys(types),
            buffer;

        // Buffers already created. Stop here.
        if (keys.length !== 0) {
            return;
        }

        for (var i = 0; i < typeKeys.length; ++i) {
            buffers[typeKeys[i]] = this._createSingleBuffer(typeKeys[i]);
        }

        this._setBuffers(buffers);
    };

    NoiseOscillatorBank.prototype._getBuffers = function _getBuffers() {
        var buffers = BUFFERS.get(this.io);

        if (buffers === undefined) {
            this._createBuffers();
            buffers = BUFFERS.get(this.io);
        }

        return buffers;
    };

    NoiseOscillatorBank.prototype._setBuffers = function _setBuffers(buffers) {
        BUFFERS.set(this.io, buffers);
    };

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

    NoiseOscillatorBank.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
    };

    return NoiseOscillatorBank;
})(_coreNodeEs62["default"]);

NoiseOscillatorBank.types = {
    WHITE: 0,
    GAUSSIAN_WHITE: 1,
    PINK: 2
};

AudioIO.prototype.createNoiseOscillatorBank = function () {
    return new NoiseOscillatorBank(this);
};

},{"../core/AudioIO.es6":2,"../core/Node.es6":3,"../mixins/math.es6":83}],91:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],92:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],93:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _UtilsEs6 = require('./Utils.es6');

var _UtilsEs62 = _interopRequireDefault(_UtilsEs6);

var BufferUtils = {};

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

},{"./Utils.es6":94}],94:[function(require,module,exports){
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

},{}]},{},[34])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9idWZmZXJzL0J1ZmZlckdlbmVyYXRvcnMuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvY29yZS9BdWRpb0lPLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvTm9kZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9jb3JlL1BhcmFtLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvV2F2ZVNoYXBlci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9jb3JlL2NvbmZpZy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9jb3JlL292ZXJyaWRlcy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9jb3JlL3NpZ25hbEN1cnZlcy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9lbnZlbG9wZXMvQURCRFNSRW52ZWxvcGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZW52ZWxvcGVzL0FERW52ZWxvcGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZW52ZWxvcGVzL0FEU1JFbnZlbG9wZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9lbnZlbG9wZXMvQ3VzdG9tRW52ZWxvcGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZngvRENUcmFwLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L0RlbGF5LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L1BpbmdQb25nRGVsYXkuZXM2LmpzIiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZngvU2Nocm9lZGVyQWxsUGFzcy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9TaW5lU2hhcGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L1N0ZXJlb1JvdGF0aW9uLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L1N0ZXJlb1dpZHRoLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L2VxL0N1c3RvbUVRLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L2ZpbHRlcnMvQWxsUGFzc0ZpbHRlci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9maWx0ZXJzL0JQRmlsdGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L2ZpbHRlcnMvRmlsdGVyQmFuay5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9maWx0ZXJzL0hQRmlsdGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L2ZpbHRlcnMvTFBGaWx0ZXIuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZngvZmlsdGVycy9Ob3RjaEZpbHRlci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9nZW5lcmF0b3JzL09zY2lsbGF0b3JHZW5lcmF0b3IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL0NvdW50ZXIuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL0Nyb3NzZmFkZXIuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL0RyeVdldE5vZGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL0VRU2hlbGYuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL1BoYXNlT2Zmc2V0LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2luc3RydW1lbnRzL0dlbmVyYXRvclBsYXllci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYWluLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvQWJzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvQWRkLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvQXZlcmFnZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0NsYW1wLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvQ29uc3RhbnQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9EaXZpZGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9GbG9vci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0xlcnAuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9NYXguZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9NaW4uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9NdWx0aXBseS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL05lZ2F0ZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1Bvdy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1JlY2lwcm9jYWwuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9Sb3VuZC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1NhbXBsZURlbGF5LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU2NhbGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TY2FsZUV4cC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1NpZ24uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TcXJ0LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU3F1YXJlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU3VidHJhY3QuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9Td2l0Y2guZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9BTkQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9Mb2dpY2FsT3BlcmF0b3IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OQU5ELmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTk9SLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTk9ULmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvT1IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9YT1IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9FcXVhbFRvLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUb1plcm8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuRXF1YWxUby5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuWmVyby5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0lmRWxzZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvTGVzc1RoYW5FcXVhbFRvLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvTGVzc1RoYW5aZXJvLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L0Nvcy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9EZWdUb1JhZC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9SYWRUb0RlZy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9TaW4uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC90cmlnb25vbWV0cnkvVGFuLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9NYXRoLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9jbGVhbmVycy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvY29ubmVjdGlvbnMuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL2NvbnZlcnNpb25zLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9tYXRoLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9ub3RlUmVnRXhwLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9ub3RlU3RyaW5ncy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvbm90ZXMuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL3NldElPLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL29zY2lsbGF0b3JzL0J1ZmZlck9zY2lsbGF0b3IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvb3NjaWxsYXRvcnMvRk1Pc2NpbGxhdG9yLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL29zY2lsbGF0b3JzL05vaXNlT3NjaWxsYXRvckJhbmsuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvb3NjaWxsYXRvcnMvT3NjaWxsYXRvckJhbmsuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvb3NjaWxsYXRvcnMvU2luZUJhbmsuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvdXRpbGl0aWVzL0J1ZmZlclV0aWxzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL3V0aWxpdGllcy9VdGlscy5lczYiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OzZCQ0FtQixvQkFBb0I7Ozs7NkJBQ3RCLG9CQUFvQjs7OztBQUVyQyxJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7QUFDdEIsSUFBSSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7O0FBRTFCLFNBQVMsc0JBQXNCLENBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFLFVBQVUsRUFBRztBQUNwRSxXQUFPLE1BQU0sR0FBRyxHQUFHLEdBQUcsZ0JBQWdCLEdBQUcsR0FBRyxHQUFHLFVBQVUsQ0FBQztDQUM3RDs7QUFHRCxnQkFBZ0IsQ0FBQyxRQUFRLEdBQUcsVUFBVSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRztBQUM3RSxRQUFJLEdBQUcsR0FBRyxzQkFBc0IsQ0FBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxDQUFFO1FBQ3BFLE1BQU07UUFDTixXQUFXLENBQUM7O0FB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LFVBQVUsQ0FBRSxDQUFDO0FBQzdDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxVQUFVLENBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLFNBQVMsQ0FBRSxDQUFDO0FBQzVDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxRQUFRLENBQUUsQ0FBQztBQUM1QyxhQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVwQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFFLENBQUM7OztBQUd6QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzlDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxJ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LENBQUMsU0FBUyxDQUFFLENBQUMsV0FBVyxDQUFFLENBQUM7QUFDL0MsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxVQUFVLENBQUUsQ0FBQztBQUM3QyxhQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDNUMsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLENBQUUsQ0FBQzs7QUFFcEMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDOzs7QUFHekMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc5QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxZQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNoRCxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFN0MsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7Y0F0RUMsR0FB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LFdBQVc7Ozs7Ozs7QUM3SDFCLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQzs7QUFFZixLQUFLLENBQUMsWUFBWSxHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQ3RDLEtBQUssS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLENBQUMsTUFBTSxZQUFZLFdBQVcsRUFBRztBQUNqRSxTQUFPLElBQUksQ0FBQztFQUNaOztBQUVELFFBQU8sS0FBSyxDQUFDO0NBQ2IsQ0FBQzs7cUJBRWEsS0FBSyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgQ09ORklHIGZyb20gJy4uL2NvcmUvY29uZmlnLmVzNic7XG5pbXBvcnQgbWF0aCBmcm9tICcuLi9taXhpbnMvTWF0aC5lczYnO1xuXG52YXIgQlVGRkVSX1NUT1JFID0ge307XG52YXIgQnVmZmVyR2VuZXJhdG9ycyA9IHt9O1xuXG5mdW5jdGlvbiBnZW5lcmF0ZUJ1ZmZlclN0b3JlS2V5KCBsZW5ndGgsIG51bWJlck9mQ2hhbm5lbHMsIHNhbXBsZVJhdGUgKSB7XG4gICAgcmV0dXJuIGxlbmd0aCArICctJyArIG51bWJlck9mQ2hhbm5lbHMgKyAnLScgKyBzYW1wbGVSYXRlO1xufVxuXG5cbkJ1ZmZlckdlbmVyYXRvcnMuU2luZVdhdmUgPSBmdW5jdGlvbiggaW8sIG51bWJlck9mQ2hhbm5lbHMsIGxlbmd0aCwgc2FtcGxlUmF0ZSApIHtcbiAgICB2YXIga2V5ID0gZ2VuZXJhdGVCdWZmZXJTdG9yZUtleSggbGVuZ3RoLCBudW1iZXJPZkNoYW5uZWxzLCBzYW1wbGVSYXRlICksXG4gICAgICAgIGJ1ZmZlcixcbiAgICAgICAgY2hhbm5lbERhdGE7XG5cbiAgICBpZiAoIEJVRkZFUl9TVE9SRVsga2V5IF0gKSB7XG4gICAgICAgIHJldHVybiBCVUZGRVJfU1RPUkVbIGtleSBdO1xuICAgIH1cblxuICAgIGJ1ZmZlciA9IGlvLmNvbnRleHQuY3JlYXRlQnVmZmVyKCBudW1iZXJPZkNoYW5uZWxzLCBsZW5ndGgsIHNhbXBsZVJhdGUgKTtcblxuICAgIGZvciAoIHZhciBjID0gMDsgYyA8IG51bWJlck9mQ2hhbm5lbHM7ICsrYyApIHtcbiAgICAgICAgY2hhbm5lbERhdGEgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIGMgKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHZhciB4ID0gTWF0aC5QSSAqICggaSAvIGxlbmd0aCApIC0gTWF0aC5QSSAqIDAuNTtcbiAgICAgICAgICAgIHggKj0gMjtcbiAgICAgICAgICAgIGNoYW5uZWxEYXRhWyBpIF0gPSBNYXRoLnNpbiggeCApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQlVGRkVSX1NUT1JFWyBrZXkgXSA9IGJ1ZmZlcjtcblxuICAgIHJldHVybiBidWZmZXI7XG59O1xuXG5CdWZmZXJHZW5lcmF0b3JzLlNhd1dhdmUgPSBmdW5jdGlvbiggaW8sIG51bWJlck9mQ2hhbm5lbHMsIGxlbmd0aCwgc2FtcGxlUmF0ZSApIHtcbiAgICB2YXIga2V5ID0gZ2VuZXJhdGVCdWZmZXJTdG9yZUtleSggbGVuZ3RoLCBudW1iZXJPZkNoYW5uZWxzLCBzYW1wbGVSYXRlICksXG4gICAgICAgIGJ1ZmZlcixcbiAgICAgICAgY2hhbm5lbERhdGE7XG5cbiAgICBpZiAoIEJVRkZFUl9TVE9SRVsga2V5IF0gKSB7XG4gICAgICAgIHJldHVybiBCVUZGRVJfU1RPUkVbIGtleSBdO1xuICAgIH1cblxuICAgIGJ1ZmZlciA9IGlvLmNvbnRleHQuY3JlYXRlQnVmZmVyKCBudW1iZXJPZkNoYW5uZWxzLCBsZW5ndGgsIHNhbXBsZVJhdGUgKTtcblxuICAgIGZvciAoIHZhciBjID0gMDsgYyA8IG51bWJlck9mQ2hhbm5lbHM7ICsrYyApIHtcbiAgICAgICAgY2hhbm5lbERhdGEgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIGMgKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHZhciB4ID0gKCBpIC8gbGVuZ3RoICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGNoYW5uZWxEYXRhWyBpIF0gPSB4O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQlVGRkVSX1NUT1JFWyBrZXkgXSA9IGJ1ZmZlcjtcblxuICAgIHJldHVybiBidWZmZXI7XG59O1xuXG5CdWZmZXJHZW5lcmF0b3JzLlNxdWFyZVdhdmUgPSBmdW5jdGlvbiggaW8sIG51bWJlck9mQ2hhbm5lbHMsIGxlbmd0aCwgc2FtcGxlUmF0ZSApIHtcbiAgICB2YXIga2V5ID0gZ2VuZXJhdGVCdWZmZXJTdG9yZUtleSggbGVuZ3RoLCBudW1iZXJPZkNoYW5uZWxzLCBzYW1wbGVSYXRlICksXG4gICAgICAgIGJ1ZmZlcixcbiAgICAgICAgY2hhbm5lbERhdGE7XG5cbiAgICBpZiAoIEJVRkZFUl9TVE9SRVsga2V5IF0gKSB7XG4gICAgICAgIHJldHVybiBCVUZGRVJfU1RPUkVbIGtleSBdO1xuICAgIH1cblxuICAgIGJ1ZmZlciA9IGlvLmNvbnRleHQuY3JlYXRlQnVmZmVyKCBudW1iZXJPZkNoYW5uZWxzLCBsZW5ndGgsIHNhbXBsZVJhdGUgKTtcblxuICAgIGZvciAoIHZhciBjID0gMDsgYyA8IG51bWJlck9mQ2hhbm5lbHM7ICsrYyApIHtcbiAgICAgICAgY2hhbm5lbERhdGEgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIGMgKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHZhciB4ID0gKCBpIC8gbGVuZ3RoICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGNoYW5uZWxEYXRhWyBpIF0gPSBNYXRoLnNpZ24oIHggKyAwLjAwMSApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQlVGRkVSX1NUT1JFWyBrZXkgXSA9IGJ1ZmZlcjtcblxuICAgIHJldHVybiBidWZmZXI7XG59O1xuXG5CdWZmZXJHZW5lcmF0b3JzLlRyaWFuZ2xlV2F2ZSA9IGZ1bmN0aW9uKCBpbywgbnVtYmVyT2ZDaGFubmVscywgbGVuZ3RoLCBzYW1wbGVSYXRlICkge1xuICAgIHZhciBrZXkgPSBnZW5lcmF0ZUJ1ZmZlclN0b3JlS2V5KCBsZW5ndGgsIG51bWJlck9mQ2hhbm5lbHMsIHNhbXBsZVJhdGUgKSxcbiAgICAgICAgYnVmZmVyLFxuICAgICAgICBjaGFubmVsRGF0YTtcblxuICAgIGlmICggQlVGRkVSX1NUT1JFWyBrZXkgXSApIHtcbiAgICAgICAgcmV0dXJuIEJVRkZFUl9TVE9SRVsga2V5IF07XG4gICAgfVxuXG4gICAgYnVmZmVyID0gaW8uY29udGV4dC5jcmVhdGVCdWZmZXIoIG51bWJlck9mQ2hhbm5lbHMsIGxlbmd0aCwgc2FtcGxlUmF0ZSApO1xuXG4gICAgZm9yICggdmFyIGMgPSAwOyBjIDwgbnVtYmVyT2ZDaGFubmVsczsgKytjICkge1xuICAgICAgICBjaGFubmVsRGF0YSA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSggYyApO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdmFyIHggPSBNYXRoLmFicyggKCBpICUgbGVuZ3RoICogMiApIC0gbGVuZ3RoICkgLSBsZW5ndGggKiAwLjU7XG4gICAgICAgICAgICB4IC89IGxlbmd0aCAqIDAuNTtcbiAgICAgICAgICAgIGNoYW5uZWxEYXRhWyBpIF0gPSBNYXRoLnNpbiggeCApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQlVGRkVSX1NUT1JFWyBrZXkgXSA9IGJ1ZmZlcjtcblxuICAgIHJldHVybiBidWZmZXI7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQnVmZmVyR2VuZXJhdG9yczsiLCJpbXBvcnQgQ09ORklHIGZyb20gJy4vY29uZmlnLmVzNic7XG5pbXBvcnQgJy4vb3ZlcnJpZGVzLmVzNic7XG5pbXBvcnQgc2lnbmFsQ3VydmVzIGZyb20gJy4vc2lnbmFsQ3VydmVzLmVzNic7XG5pbXBvcnQgY29udmVyc2lvbnMgZnJvbSAnLi4vbWl4aW5zL2NvbnZlcnNpb25zLmVzNic7XG5pbXBvcnQgbWF0aCBmcm9tICcuLi9taXhpbnMvbWF0aC5lczYnO1xuaW1wb3J0IEJ1ZmZlckdlbmVyYXRvcnMgZnJvbSAnLi4vYnVmZmVycy9CdWZmZXJHZW5lcmF0b3JzLmVzNic7XG5pbXBvcnQgQnVmZmVyVXRpbHMgZnJvbSAnLi4vdXRpbGl0aWVzL0J1ZmZlclV0aWxzLmVzNic7XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vdXRpbGl0aWVzL1V0aWxzLmVzNic7XG5cbmNsYXNzIEF1ZGlvSU8ge1xuXG4gICAgc3RhdGljIG1peGluKCB0YXJnZXQsIHNvdXJjZSApIHtcbiAgICAgICAgZm9yICggbGV0IGkgaW4gc291cmNlICkge1xuICAgICAgICAgICAgaWYgKCBzb3VyY2UuaGFzT3duUHJvcGVydHkoIGkgKSApIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRbIGkgXSA9IHNvdXJjZVsgaSBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIG1peGluU2luZ2xlKCB0YXJnZXQsIHNvdXJjZSwgbmFtZSApIHtcbiAgICAgICAgdGFyZ2V0WyBuYW1lIF0gPSBzb3VyY2U7XG4gICAgfVxuXG5cbiAgICBjb25zdHJ1Y3RvciggY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKSApIHtcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7XG5cbiAgICAgICAgdGhpcy5tYXN0ZXIgPSB0aGlzLl9jb250ZXh0LmRlc3RpbmF0aW9uO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhbiBhbHdheXMtb24gJ2RyaXZlcicgbm9kZSB0aGF0IGNvbnN0YW50bHkgb3V0cHV0cyBhIHZhbHVlXG4gICAgICAgIC8vIG9mIDEuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEl0J3MgdXNlZCBieSBhIGZhaXIgZmV3IG5vZGVzLCBzbyBtYWtlcyBzZW5zZSB0byB1c2UgdGhlIHNhbWVcbiAgICAgICAgLy8gZHJpdmVyLCByYXRoZXIgdGhhbiBzcGFtbWluZyBhIGJ1bmNoIG9mIFdhdmVTaGFwZXJOb2RlcyBhbGwgYWJvdXRcbiAgICAgICAgLy8gdGhlIHBsYWNlLiBJdCBjYW4ndCBiZSBkZWxldGVkLCBzbyBubyB3b3JyaWVzIGFib3V0IGJyZWFraW5nXG4gICAgICAgIC8vIGZ1bmN0aW9uYWxpdHkgb2Ygbm9kZXMgdGhhdCBkbyB1c2UgaXQgc2hvdWxkIGl0IGF0dGVtcHQgdG8gYmVcbiAgICAgICAgLy8gb3ZlcndyaXR0ZW4uXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdGhpcywgJ2NvbnN0YW50RHJpdmVyJywge1xuICAgICAgICAgICAgd3JpdGVhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGdldDogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBsZXQgY29uc3RhbnREcml2ZXI7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggIWNvbnN0YW50RHJpdmVyIHx8IGNvbnN0YW50RHJpdmVyLmNvbnRleHQgIT09IHRoaXMuY29udGV4dCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0YW50RHJpdmVyID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gY29udGV4dC5jcmVhdGVCdWZmZXIoIDEsIDQwOTYsIGNvbnRleHQuc2FtcGxlUmF0ZSApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlckRhdGEgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIDAgKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJTb3VyY2UgPSBjb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBidWZmZXJEYXRhLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlckRhdGFbIGkgXSA9IDEuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yKCBsZXQgYnVmZmVyVmFsdWUgb2YgYnVmZmVyRGF0YSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBidWZmZXJWYWx1ZSA9IDEuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyU291cmNlLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlclNvdXJjZS5sb29wID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlclNvdXJjZS5zdGFydCggMCApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdGFudERyaXZlciA9IGJ1ZmZlclNvdXJjZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb25zdGFudERyaXZlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KCkgKVxuICAgICAgICB9ICk7XG4gICAgfVxuXG5cblxuICAgIGdldCBjb250ZXh0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dDtcbiAgICB9XG5cbiAgICBzZXQgY29udGV4dCggY29udGV4dCApIHtcbiAgICAgICAgaWYgKCAhKCBjb250ZXh0IGluc3RhbmNlb2YgQXVkaW9Db250ZXh0ICkgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIFwiSW52YWxpZCBhdWRpbyBjb250ZXh0IGdpdmVuOlwiICsgY29udGV4dCApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMubWFzdGVyID0gY29udGV4dC5kZXN0aW5hdGlvbjtcbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIEF1ZGlvSU8ucHJvdG90eXBlLCBzaWduYWxDdXJ2ZXMsICdjdXJ2ZXMnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBBdWRpb0lPLnByb3RvdHlwZSwgY29udmVyc2lvbnMsICdjb252ZXJ0JyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggQXVkaW9JTy5wcm90b3R5cGUsIG1hdGgsICdtYXRoJyApO1xuXG5BdWRpb0lPLkJ1ZmZlclV0aWxzID0gQnVmZmVyVXRpbHM7XG5BdWRpb0lPLlV0aWxzID0gVXRpbHM7XG5BdWRpb0lPLkJ1ZmZlckdlbmVyYXRvcnMgPSBCdWZmZXJHZW5lcmF0b3JzO1xuXG53aW5kb3cuQXVkaW9JTyA9IEF1ZGlvSU87XG5leHBvcnQgZGVmYXVsdCBBdWRpb0lPOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5pbXBvcnQgY29ubmVjdGlvbnMgZnJvbSBcIi4uL21peGlucy9jb25uZWN0aW9ucy5lczZcIjtcbmltcG9ydCBjbGVhbmVycyBmcm9tIFwiLi4vbWl4aW5zL2NsZWFuZXJzLmVzNlwiO1xuXG52YXIgZ3JhcGhzID0gbmV3IFdlYWtNYXAoKTtcblxuLy8gVE9ETzpcbi8vICAtIFBvc3NpYmx5IHJlbW92ZSB0aGUgbmVlZCBmb3Igb25seSBHYWluTm9kZXNcbi8vICAgIGFzIGlucHV0cy9vdXRwdXRzPyBJdCdsbCBhbGxvdyBmb3Igc3ViY2xhc3Nlc1xuLy8gICAgb2YgTm9kZSB0byBiZSBtb3JlIGVmZmljaWVudC4uLlxuY2xhc3MgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1JbnB1dHMgPSAwLCBudW1PdXRwdXRzID0gMCApIHtcbiAgICAgICAgdGhpcy5fc2V0SU8oIGlvICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHMgPSBbXTtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gW107XG5cbiAgICAgICAgLy8gVGhpcyBvYmplY3Qgd2lsbCBob2xkIGFueSB2YWx1ZXMgdGhhdCBjYW4gYmVcbiAgICAgICAgLy8gY29udHJvbGxlZCB3aXRoIGF1ZGlvIHNpZ25hbHMuXG4gICAgICAgIHRoaXMuY29udHJvbHMgPSB7fTtcblxuICAgICAgICAvLyBCb3RoIHRoZXNlIG9iamVjdHMgd2lsbCBqdXN0IGhvbGQgcmVmZXJlbmNlc1xuICAgICAgICAvLyB0byBlaXRoZXIgaW5wdXQgb3Igb3V0cHV0IG5vZGVzLiBIYW5keSB3aGVuXG4gICAgICAgIC8vIHdhbnRpbmcgdG8gY29ubmVjdCBzcGVjaWZpYyBpbnMvb3V0cyB3aXRob3V0XG4gICAgICAgIC8vIGhhdmluZyB0byB1c2UgdGhlIGAuY29ubmVjdCggLi4uLCAwLCAxIClgIHN5bnRheC5cbiAgICAgICAgdGhpcy5uYW1lZElucHV0cyA9IHt9O1xuICAgICAgICB0aGlzLm5hbWVkT3V0cHV0cyA9IHt9O1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG51bUlucHV0czsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5hZGRJbnB1dENoYW5uZWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgbnVtT3V0cHV0czsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5hZGRPdXRwdXRDaGFubmVsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRHcmFwaCggZ3JhcGggKSB7XG4gICAgICAgIGdyYXBocy5zZXQoIHRoaXMsIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0R3JhcGgoKSB7XG4gICAgICAgIHJldHVybiBncmFwaHMuZ2V0KCB0aGlzICkgfHwge307XG4gICAgfVxuXG4gICAgYWRkSW5wdXRDaGFubmVsKCkge1xuICAgICAgICB0aGlzLmlucHV0cy5wdXNoKCB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpICk7XG4gICAgfVxuXG4gICAgYWRkT3V0cHV0Q2hhbm5lbCgpIHtcbiAgICAgICAgdGhpcy5vdXRwdXRzLnB1c2goIHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCkgKTtcbiAgICB9XG5cbiAgICBfY2xlYW5VcFNpbmdsZSggaXRlbSwgcGFyZW50LCBrZXkgKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAvLyBIYW5kbGUgYXJyYXlzIGJ5IGxvb3Bpbmcgb3ZlciB0aGVtXG4gICAgICAgIC8vIGFuZCByZWN1cnNpdmVseSBjYWxsaW5nIHRoaXMgZnVuY3Rpb24gd2l0aCBlYWNoXG4gICAgICAgIC8vIGFycmF5IG1lbWJlci5cbiAgICAgICAgaWYoIEFycmF5LmlzQXJyYXkoIGl0ZW0gKSApIHtcbiAgICAgICAgICAgIGl0ZW0uZm9yRWFjaChmdW5jdGlvbiggbm9kZSwgaW5kZXggKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fY2xlYW5VcFNpbmdsZSggbm9kZSwgaXRlbSwgaW5kZXggKTtcbiAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgcGFyZW50WyBrZXkgXSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdWRpb0lPIG5vZGVzLi4uXG4gICAgICAgIGVsc2UgaWYoIGl0ZW0gJiYgdHlwZW9mIGl0ZW0uY2xlYW5VcCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgaXRlbS5kaXNjb25uZWN0ID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgIGl0ZW0uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpdGVtLmNsZWFuVXAoKTtcblxuICAgICAgICAgICAgaWYoIHBhcmVudCApIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRbIGtleSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFwiTmF0aXZlXCIgbm9kZXMuXG4gICAgICAgIGVsc2UgaWYoIGl0ZW0gJiYgdHlwZW9mIGl0ZW0uZGlzY29ubmVjdCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgIGl0ZW0uZGlzY29ubmVjdCgpO1xuXG4gICAgICAgICAgICBpZiggcGFyZW50ICkge1xuICAgICAgICAgICAgICAgIHBhcmVudFsga2V5IF0gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuICAgICAgICB0aGlzLl9jbGVhblVwSW5PdXRzKCk7XG4gICAgICAgIHRoaXMuX2NsZWFuSU8oKTtcblxuICAgICAgICAvLyBGaW5kIGFueSBub2RlcyBhdCB0aGUgdG9wIGxldmVsLFxuICAgICAgICAvLyBkaXNjb25uZWN0IGFuZCBudWxsaWZ5IHRoZW0uXG4gICAgICAgIGZvciggdmFyIGkgaW4gdGhpcyApIHtcbiAgICAgICAgICAgIHRoaXMuX2NsZWFuVXBTaW5nbGUoIHRoaXNbIGkgXSwgdGhpcywgaSApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRG8gdGhlIHNhbWUgZm9yIGFueSBub2RlcyBpbiB0aGUgZ3JhcGguXG4gICAgICAgIGZvciggdmFyIGkgaW4gZ3JhcGggKSB7XG4gICAgICAgICAgICB0aGlzLl9jbGVhblVwU2luZ2xlKCBncmFwaFsgaSBdLCBncmFwaCwgaSApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gLi4uYW5kIHRoZSBzYW1lIGZvciBhbnkgY29udHJvbCBub2Rlcy5cbiAgICAgICAgZm9yKCB2YXIgaSBpbiB0aGlzLmNvbnRyb2xzICkge1xuICAgICAgICAgICAgdGhpcy5fY2xlYW5VcFNpbmdsZSggdGhpcy5jb250cm9sc1sgaSBdLCB0aGlzLmNvbnRyb2xzLCBpICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGaW5hbGx5LCBhdHRlbXB0IHRvIGRpc2Nvbm5lY3QgdGhpcyBOb2RlLlxuICAgICAgICBpZiggdHlwZW9mIHRoaXMuZGlzY29ubmVjdCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgbnVtYmVyT2ZJbnB1dHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlucHV0cy5sZW5ndGg7XG4gICAgfVxuICAgIGdldCBudW1iZXJPZk91dHB1dHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm91dHB1dHMubGVuZ3RoO1xuICAgIH1cblxuICAgIGdldCBpbnB1dFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHMubGVuZ3RoID8gdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlIDogbnVsbDtcbiAgICB9XG4gICAgc2V0IGlucHV0VmFsdWUoIHZhbHVlICkge1xuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmlucHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IHRoaXMuaW52ZXJ0SW5wdXRQaGFzZSA/IC12YWx1ZSA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IG91dHB1dFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzLmxlbmd0aCA/IHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgOiBudWxsO1xuICAgIH1cbiAgICBzZXQgb3V0cHV0VmFsdWUoIHZhbHVlICkge1xuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLm91dHB1dHMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIGkgXS5nYWluLnZhbHVlID0gdGhpcy5pbnZlcnRPdXRwdXRQaGFzZSA/IC12YWx1ZSA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGludmVydElucHV0UGhhc2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlucHV0cy5sZW5ndGggP1xuICAgICAgICAgICAgKCB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPCAwICkgOlxuICAgICAgICAgICAgbnVsbDtcbiAgICB9XG4gICAgc2V0IGludmVydElucHV0UGhhc2UoIGludmVydGVkICkge1xuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGlucHV0LCB2OyBpIDwgdGhpcy5pbnB1dHMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICBpbnB1dCA9IHRoaXMuaW5wdXRzWyBpIF0uZ2FpbjtcbiAgICAgICAgICAgIHYgPSBpbnB1dC52YWx1ZTtcbiAgICAgICAgICAgIGlucHV0LnZhbHVlID0gdiA8IDAgPyAoIGludmVydGVkID8gdiA6IC12ICkgOiAoIGludmVydGVkID8gLXYgOiB2ICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgaW52ZXJ0T3V0cHV0UGhhc2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm91dHB1dHMubGVuZ3RoID9cbiAgICAgICAgICAgICggdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA8IDAgKSA6XG4gICAgICAgICAgICBudWxsO1xuICAgIH1cblxuICAgIC8vIFRPRE86XG4gICAgLy8gIC0gc2V0VmFsdWVBdFRpbWU/XG4gICAgc2V0IGludmVydE91dHB1dFBoYXNlKCBpbnZlcnRlZCApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCB2OyBpIDwgdGhpcy5vdXRwdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdiA9IHRoaXMub3V0cHV0c1sgaSBdLmdhaW4udmFsdWU7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIGkgXS5nYWluLnZhbHVlID0gdiA8IDAgPyAoIGludmVydGVkID8gdiA6IC12ICkgOiAoIGludmVydGVkID8gLXYgOiB2ICk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIE5vZGUucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBOb2RlLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5VcEluT3V0cywgJ19jbGVhblVwSW5PdXRzJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggTm9kZS5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuSU8sICdfY2xlYW5JTycgKTtcbkF1ZGlvSU8ubWl4aW4oIE5vZGUucHJvdG90eXBlLCBjb25uZWN0aW9ucyApO1xuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5vZGUgPSBmdW5jdGlvbiggbnVtSW5wdXRzLCBudW1PdXRwdXRzICkge1xuICAgIHJldHVybiBuZXcgTm9kZSggdGhpcywgbnVtSW5wdXRzLCBudW1PdXRwdXRzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOb2RlOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5pbXBvcnQgY29ubmVjdGlvbnMgZnJvbSBcIi4uL21peGlucy9jb25uZWN0aW9ucy5lczZcIjtcbmltcG9ydCBjbGVhbmVycyBmcm9tIFwiLi4vbWl4aW5zL2NsZWFuZXJzLmVzNlwiO1xuXG5cbmNsYXNzIFBhcmFtIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlLCBkZWZhdWx0VmFsdWUgKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gdGhpcy5vdXRwdXRzID0gWyB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpIF07XG4gICAgICAgIHRoaXMuX2NvbnRyb2wgPSB0aGlzLmlucHV0c1sgMCBdO1xuXG4gICAgICAgIC8vIEhtbS4uLiBIYWQgdG8gcHV0IHRoaXMgaGVyZSBzbyBOb3RlIHdpbGwgYmUgYWJsZVxuICAgICAgICAvLyB0byByZWFkIHRoZSB2YWx1ZS4uLlxuICAgICAgICAvLyBUT0RPOlxuICAgICAgICAvLyAgLSBTaG91bGQgSSBjcmVhdGUgYSBgLl92YWx1ZWAgcHJvcGVydHkgdGhhdCB3aWxsXG4gICAgICAgIC8vICAgIHN0b3JlIHRoZSB2YWx1ZXMgdGhhdCB0aGUgUGFyYW0gc2hvdWxkIGJlIHJlZmxlY3RpbmdcbiAgICAgICAgLy8gICAgKGZvcmdldHRpbmcsIG9mIGNvdXJzZSwgdGhhdCBhbGwgdGhlICpWYWx1ZUF0VGltZSBbZXRjLl1cbiAgICAgICAgLy8gICAgZnVuY3Rpb25zIGFyZSBmdW5jdGlvbnMgb2YgdGltZTsgYC5fdmFsdWVgIHByb3Agd291bGQgYmVcbiAgICAgICAgLy8gICAgc2V0IGltbWVkaWF0ZWx5LCB3aGlsc3QgdGhlIHJlYWwgdmFsdWUgd291bGQgYmUgcmFtcGluZylcbiAgICAgICAgLy9cbiAgICAgICAgLy8gIC0gT3IsIHNob3VsZCBJIGNyZWF0ZSBhIGAuX3ZhbHVlYCBwcm9wZXJ0eSB0aGF0IHdpbGxcbiAgICAgICAgLy8gICAgdHJ1ZWx5IHJlZmxlY3QgdGhlIGludGVybmFsIHZhbHVlIG9mIHRoZSBHYWluTm9kZT8gV2lsbFxuICAgICAgICAvLyAgICByZXF1aXJlIE1BRkZTLi4uXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyA/IHZhbHVlIDogMS4wO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4udmFsdWUgPSB0aGlzLl92YWx1ZTtcblxuICAgICAgICB0aGlzLnNldFZhbHVlQXRUaW1lKCB0aGlzLl92YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgICAgIHRoaXMuZGVmYXVsdFZhbHVlID0gdHlwZW9mIGRlZmF1bHRWYWx1ZSA9PT0gJ251bWJlcicgPyBkZWZhdWx0VmFsdWUgOiB0aGlzLl9jb250cm9sLmdhaW4uZGVmYXVsdFZhbHVlO1xuXG5cbiAgICAgICAgLy8gVE9ETzpcbiAgICAgICAgLy8gIC0gU2hvdWxkIHRoZSBkcml2ZXIgYWx3YXlzIGJlIGNvbm5lY3RlZD9cbiAgICAgICAgLy8gIC0gTm90IHN1cmUgd2hldGhlciBQYXJhbSBzaG91bGQgb3V0cHV0IDAgaWYgdmFsdWUgIT09IE51bWJlci5cbiAgICAgICAgaWYgKCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5pby5jb25zdGFudERyaXZlci5jb25uZWN0KCB0aGlzLl9jb250cm9sICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5kZWZhdWx0VmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHRoaXMuX2NsZWFuVXBJbk91dHMoKTtcbiAgICAgICAgdGhpcy5fY2xlYW5JTygpO1xuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wgPSBudWxsO1xuICAgICAgICB0aGlzLmRlZmF1bHRWYWx1ZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgfVxuXG4gICAgc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHN0YXJ0VGltZSApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBsaW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggdmFsdWUsIGVuZFRpbWUgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggdmFsdWUsIGVuZFRpbWUgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSggdmFsdWUsIGVuZFRpbWUgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKCB2YWx1ZSwgZW5kVGltZSApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRUYXJnZXRBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUsIHRpbWVDb25zdGFudCApIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLnNldFRhcmdldEF0VGltZSggdmFsdWUsIHN0YXJ0VGltZSwgdGltZUNvbnN0YW50ICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFZhbHVlQ3VydmVBdFRpbWUoIHZhbHVlcywgc3RhcnRUaW1lLCBkdXJhdGlvbiApIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLnNldFZhbHVlQ3VydmVBdFRpbWUoIHZhbHVlcywgc3RhcnRUaW1lLCBkdXJhdGlvbiApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHN0YXJ0VGltZSApIHtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggc3RhcnRUaW1lICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgLy8gcmV0dXJuIHRoaXMuX2NvbnRyb2wuZ2Fpbi52YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxuXG4gICAgZ2V0IGNvbnRyb2woKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250cm9sLmdhaW47XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFBhcmFtLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggUGFyYW0ucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhblVwSW5PdXRzLCAnX2NsZWFuVXBJbk91dHMnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBQYXJhbS5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuSU8sICdfY2xlYW5JTycgKTtcbkF1ZGlvSU8ubWl4aW4oIFBhcmFtLnByb3RvdHlwZSwgY29ubmVjdGlvbnMgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUGFyYW0gPSBmdW5jdGlvbiggdmFsdWUsIGRlZmF1bHRWYWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFBhcmFtKCB0aGlzLCB2YWx1ZSwgZGVmYXVsdFZhbHVlICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBQYXJhbTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcblxuY2xhc3MgV2F2ZVNoYXBlciB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBjdXJ2ZU9ySXRlcmF0b3IsIHNpemUgKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMuc2hhcGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZVdhdmVTaGFwZXIoKTtcblxuICAgICAgICAvLyBJZiBhIEZsb2F0MzJBcnJheSBpcyBwcm92aWRlZCwgdXNlIGl0XG4gICAgICAgIC8vIGFzIHRoZSBjdXJ2ZSB2YWx1ZS5cbiAgICAgICAgaWYgKCBjdXJ2ZU9ySXRlcmF0b3IgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgKSB7XG4gICAgICAgICAgICB0aGlzLnNoYXBlci5jdXJ2ZSA9IGN1cnZlT3JJdGVyYXRvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGEgZnVuY3Rpb24gaXMgcHJvdmlkZWQsIGNyZWF0ZSBhIGN1cnZlXG4gICAgICAgIC8vIHVzaW5nIHRoZSBmdW5jdGlvbiBhcyBhbiBpdGVyYXRvci5cbiAgICAgICAgZWxzZSBpZiAoIHR5cGVvZiBjdXJ2ZU9ySXRlcmF0b3IgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICBzaXplID0gdHlwZW9mIHNpemUgPT09ICdudW1iZXInICYmIHNpemUgPj0gMiA/IHNpemUgOiBDT05GSUcuY3VydmVSZXNvbHV0aW9uO1xuXG4gICAgICAgICAgICB2YXIgYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KCBzaXplICksXG4gICAgICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICAgICAgeCA9IDA7XG5cbiAgICAgICAgICAgIGZvciAoIGk7IGkgPCBzaXplOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgeCA9ICggaSAvIHNpemUgKSAqIDIgLSAxO1xuICAgICAgICAgICAgICAgIGFycmF5WyBpIF0gPSBjdXJ2ZU9ySXRlcmF0b3IoIHgsIGksIHNpemUgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSBhcnJheTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE90aGVyd2lzZSwgZGVmYXVsdCB0byBhIExpbmVhciBjdXJ2ZS5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNoYXBlci5jdXJ2ZSA9IHRoaXMuaW8uY3VydmVzLkxpbmVhcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gdGhpcy5vdXRwdXRzID0gWyB0aGlzLnNoYXBlciBdO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHRoaXMuX2NsZWFuVXBJbk91dHMoKTtcbiAgICAgICAgdGhpcy5fY2xlYW5JTygpO1xuICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5zaGFwZXIgPSBudWxsO1xuICAgIH1cblxuICAgIGdldCBjdXJ2ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2hhcGVyLmN1cnZlO1xuICAgIH1cbiAgICBzZXQgY3VydmUoIGN1cnZlICkge1xuICAgICAgICBpZiggY3VydmUgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgKSB7XG4gICAgICAgICAgICB0aGlzLnNoYXBlci5jdXJ2ZSA9IGN1cnZlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBXYXZlU2hhcGVyLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggV2F2ZVNoYXBlci5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuVXBJbk91dHMsICdfY2xlYW5VcEluT3V0cycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFdhdmVTaGFwZXIucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhbklPLCAnX2NsZWFuSU8nICk7XG5BdWRpb0lPLm1peGluKCBXYXZlU2hhcGVyLnByb3RvdHlwZSwgY29ubmVjdGlvbnMgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlV2F2ZVNoYXBlciA9IGZ1bmN0aW9uKCBjdXJ2ZSwgc2l6ZSApIHtcbiAgICByZXR1cm4gbmV3IFdhdmVTaGFwZXIoIHRoaXMsIGN1cnZlLCBzaXplICk7XG59OyIsImV4cG9ydCBkZWZhdWx0IHtcbiAgICBjdXJ2ZVJlc29sdXRpb246IDQwOTYsIC8vIE11c3QgYmUgYW4gZXZlbiBudW1iZXIuXG4gICAgZGVmYXVsdEJ1ZmZlclNpemU6IDgsXG5cbiAgICAvLyBVc2VkIHdoZW4gY29udmVydGluZyBub3RlIHN0cmluZ3MgKGVnLiAnQSM0JykgdG8gTUlESSB2YWx1ZXMuXG4gICAgLy8gSXQncyB0aGUgb2N0YXZlIG51bWJlciBvZiB0aGUgbG93ZXN0IEMgbm90ZSAoTUlESSBub3RlIDApLlxuICAgIC8vIENoYW5nZSB0aGlzIGlmIHlvdSdyZSB1c2VkIHRvIGEgREFXIHRoYXQgZG9lc24ndCB1c2UgLTIgYXMgdGhlXG4gICAgLy8gbG93ZXN0IG9jdGF2ZS5cbiAgICBsb3dlc3RPY3RhdmU6IC0yLFxuXG4gICAgLy8gTG93ZXN0IGFsbG93ZWQgbnVtYmVyLiBVc2VkIGJ5IHNvbWUgTWF0aFxuICAgIC8vIGZ1bmN0aW9ucywgZXNwZWNpYWxseSB3aGVuIGNvbnZlcnRpbmcgYmV0d2VlblxuICAgIC8vIG51bWJlciBmb3JtYXRzIChpZS4gaHogLT4gTUlESSwgbm90ZSAtPiBNSURJLCBldGMuIClcbiAgICAvL1xuICAgIC8vIEFsc28gdXNlZCBpbiBjYWxscyB0byBBdWRpb1BhcmFtLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWVcbiAgICAvLyBzbyB0aGVyZSdzIG5vIHJhbXBpbmcgdG8gMCAod2hpY2ggdGhyb3dzIGFuIGVycm9yKS5cbiAgICBlcHNpbG9uOiAwLjAwMSxcblxuICAgIG1pZGlOb3RlUG9vbFNpemU6IDUwMFxufTsiLCIvLyBOZWVkIHRvIG92ZXJyaWRlIGV4aXN0aW5nIC5jb25uZWN0IGFuZCAuZGlzY29ubmVjdFxuLy8gZnVuY3Rpb25zIGZvciBcIm5hdGl2ZVwiIEF1ZGlvUGFyYW1zIGFuZCBBdWRpb05vZGVzLi4uXG4vLyBJIGRvbid0IGxpa2UgZG9pbmcgdGhpcywgYnV0IHMnZ290dGEgYmUgZG9uZSA6KFxuKCBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3JpZ2luYWxBdWRpb05vZGVDb25uZWN0ID0gQXVkaW9Ob2RlLnByb3RvdHlwZS5jb25uZWN0LFxuICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZURpc2Nvbm5lY3QgPSBBdWRpb05vZGUucHJvdG90eXBlLmRpc2Nvbm5lY3QsXG4gICAgICAgIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuXG4gICAgQXVkaW9Ob2RlLnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24oIG5vZGUsIG91dHB1dENoYW5uZWwgPSAwLCBpbnB1dENoYW5uZWwgPSAwICkge1xuICAgICAgICBpZiAoIG5vZGUuaW5wdXRzICkge1xuICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBub2RlLmlucHV0cyApICkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdCggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3QoIG5vZGUuaW5wdXRzWyAwIF0sIG91dHB1dENoYW5uZWwsIGlucHV0Q2hhbm5lbCApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb05vZGUgKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZUNvbm5lY3QuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9QYXJhbSApIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlQ29ubmVjdC5jYWxsKCB0aGlzLCBub2RlLCBvdXRwdXRDaGFubmVsICk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQXVkaW9Ob2RlLnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24oIG5vZGUsIG91dHB1dENoYW5uZWwgPSAwLCBpbnB1dENoYW5uZWwgPSAwICkge1xuICAgICAgICBpZiAoIG5vZGUgJiYgbm9kZS5pbnB1dHMgKSB7XG4gICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIG5vZGUuaW5wdXRzICkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0KCBub2RlLmlucHV0c1sgaW5wdXRDaGFubmVsIF0gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCggbm9kZS5pbnB1dHNbIDAgXSwgb3V0cHV0Q2hhbm5lbCwgaW5wdXRDaGFubmVsICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvTm9kZSApIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlRGlzY29ubmVjdC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb1BhcmFtICkge1xuICAgICAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVEaXNjb25uZWN0LmNhbGwoIHRoaXMsIG5vZGUsIG91dHB1dENoYW5uZWwgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICggbm9kZSA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVEaXNjb25uZWN0LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBBdWRpb05vZGUucHJvdG90eXBlLmNoYWluID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub2RlcyA9IHNsaWNlLmNhbGwoIGFyZ3VtZW50cyApLFxuICAgICAgICAgICAgbm9kZSA9IHRoaXM7XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdC5jYWxsKCBub2RlLCBub2Rlc1sgaSBdICk7XG4gICAgICAgICAgICBub2RlID0gbm9kZXNbIGkgXTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBBdWRpb05vZGUucHJvdG90eXBlLmZhbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZXMgPSBzbGljZS5jYWxsKCBhcmd1bWVudHMgKSxcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QuY2FsbCggbm9kZSwgbm9kZXNbIGkgXSApO1xuICAgICAgICB9XG4gICAgfTtcblxufSgpICk7IiwiaW1wb3J0IENPTkZJRyBmcm9tICcuL2NvbmZpZy5lczYnO1xuaW1wb3J0IG1hdGggZnJvbSAnLi4vbWl4aW5zL01hdGguZXM2JztcblxuXG5sZXQgc2lnbmFsQ3VydmVzID0ge307XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnQ29uc3RhbnQnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSAxLjA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdMaW5lYXInLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdFcXVhbFBvd2VyJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKSxcbiAgICAgICAgICAgIHNpbiA9IE1hdGguc2luLFxuICAgICAgICAgICAgUEkgPSBNYXRoLlBJO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBzaW4oIHggKiAwLjUgKiBQSSApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0N1YmVkJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKSxcbiAgICAgICAgICAgIHNpbiA9IE1hdGguc2luLFxuICAgICAgICAgICAgUEkgPSBNYXRoLlBJLFxuICAgICAgICAgICAgcG93ID0gTWF0aC5wb3c7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgeCA9IHBvdyggeCwgMyApO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHNpbiggeCAqIDAuNSAqIFBJICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1JlY3RpZnknLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGhhbGZSZXNvbHV0aW9uID0gcmVzb2x1dGlvbiAqIDAuNSxcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gLWhhbGZSZXNvbHV0aW9uLCB4ID0gMDsgaSA8IGhhbGZSZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpID4gMCA/IGkgOiAtaSApIC8gaGFsZlJlc29sdXRpb247XG4gICAgICAgICAgICBjdXJ2ZVsgaSArIGhhbGZSZXNvbHV0aW9uIF0gPSB4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuXG4vLyBNYXRoIGN1cnZlc1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdHcmVhdGVyVGhhblplcm8nLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4IDw9IDAgPyAwLjAgOiAxLjA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdMZXNzVGhhblplcm8nLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4ID49IDAgPyAwIDogMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnRXF1YWxUb1plcm8nLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4ID09PSAwID8gMSA6IDA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1JlY2lwcm9jYWwnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gNDA5NiAqIDYwMCwgLy8gSGlnaGVyIHJlc29sdXRpb24gbmVlZGVkIGhlcmUuXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICAvLyBjdXJ2ZVsgaSBdID0geCA9PT0gMCA/IDEgOiAwO1xuXG4gICAgICAgICAgICBpZiAoIHggIT09IDAgKSB7XG4gICAgICAgICAgICAgICAgeCA9IE1hdGgucG93KCB4LCAtMSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnU2luZScsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICksXG4gICAgICAgICAgICBzaW4gPSBNYXRoLnNpbjtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogKE1hdGguUEkgKiAyKSAtIE1hdGguUEk7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gc2luKCB4ICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdSb3VuZCcsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogNTAsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAoIHggPiAwICYmIHggPD0gMC41MDAwMSApIHx8XG4gICAgICAgICAgICAgICAgKCB4IDwgMCAmJiB4ID49IC0wLjUwMDAxIClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIHggPiAwICkge1xuICAgICAgICAgICAgICAgIHggPSAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB4ID0gLTE7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdTaWduJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24gKiAyLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IE1hdGguc2lnbiggeCApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdGbG9vcicsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogNTAsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG5cbiAgICAgICAgICAgIGlmICggeCA+PSAwLjk5OTkgKSB7XG4gICAgICAgICAgICAgICAgeCA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICggeCA+PSAwICkge1xuICAgICAgICAgICAgICAgIHggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIHggPCAwICkge1xuICAgICAgICAgICAgICAgIHggPSAtMTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0dhdXNzaWFuV2hpdGVOb2lzZScsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogMixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBtYXRoLm5yYW5kKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdXaGl0ZU5vaXNlJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24gKiAyLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IE1hdGgucmFuZG9tKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdQaW5rTm9pc2UnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDIsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBtYXRoLmdlbmVyYXRlUGlua051bWJlcigpO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBtYXRoLmdldE5leHRQaW5rTnVtYmVyKCkgKiAyIC0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBzaWduYWxDdXJ2ZXM7IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IEN1c3RvbUVudmVsb3BlIGZyb20gXCIuL0N1c3RvbUVudmVsb3BlLmVzNlwiO1xuXG5jbGFzcyBBREJEU1JFbnZlbG9wZSBleHRlbmRzIEN1c3RvbUVudmVsb3BlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHRoaXMudGltZXMgPSB7XG4gICAgICAgICAgICBhdHRhY2s6IDAuMDEsXG4gICAgICAgICAgICBkZWNheTE6IDAuNSxcbiAgICAgICAgICAgIGRlY2F5MjogMC41LFxuICAgICAgICAgICAgcmVsZWFzZTogMC41XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sZXZlbHMgPSB7XG4gICAgICAgICAgICBpbml0aWFsOiAwLFxuICAgICAgICAgICAgcGVhazogMSxcbiAgICAgICAgICAgIGJyZWFrOiAwLjUsXG4gICAgICAgICAgICBzdXN0YWluOiAxLFxuICAgICAgICAgICAgcmVsZWFzZTogMFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnaW5pdGlhbCcsIDAsIHRoaXMubGV2ZWxzLmluaXRpYWwgKTtcbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdhdHRhY2snLCB0aGlzLnRpbWVzLmF0dGFjaywgdGhpcy5sZXZlbHMucGVhayApO1xuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2RlY2F5MScsIHRoaXMudGltZXMuZGVjYXkxLCB0aGlzLmxldmVscy5icmVhayApO1xuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2RlY2F5MicsIHRoaXMudGltZXMuZGVjYXkyLCB0aGlzLmxldmVscy5zdXN0YWluICk7XG4gICAgICAgIHRoaXMuYWRkRW5kU3RlcCggJ3JlbGVhc2UnLCB0aGlzLnRpbWVzLnJlbGVhc2UsIHRoaXMubGV2ZWxzLnJlbGVhc2UsIHRydWUgKTtcbiAgICB9XG5cbiAgICBnZXQgYXR0YWNrVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZXMuYXR0YWNrO1xuICAgIH1cbiAgICBzZXQgYXR0YWNrVGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLmF0dGFjayA9IHRpbWU7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBUaW1lKCAnYXR0YWNrJywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgZGVjYXkxVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZXMuZGVjYXkxO1xuICAgIH1cbiAgICBzZXQgZGVjYXkxVGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLmRlY2F5MSA9IHRpbWU7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBUaW1lKCAnZGVjYXkxJywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgZGVjYXkyVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZXMuZGVjYXkyO1xuICAgIH1cbiAgICBzZXQgZGVjYXkyVGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLmRlY2F5MiA9IHRpbWU7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBUaW1lKCAnZGVjYXkyJywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgcmVsZWFzZVRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLnJlbGVhc2U7XG4gICAgfVxuICAgIHNldCByZWxlYXNlVGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLnJlbGVhc2UgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ3JlbGVhc2UnLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBpbml0aWFsTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5pbml0aWFsO1xuICAgIH1cbiAgICBzZXQgaW5pdGlhbExldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMuaW5pdGlhbCA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdpbml0aWFsJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHBlYWtMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnBlYWs7XG4gICAgfVxuXG4gICAgc2V0IHBlYWtMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLnBlYWsgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnYXR0YWNrJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBicmVha0xldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMuYnJlYWs7XG4gICAgfVxuICAgIHNldCBicmVha0xldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMuYnJlYWsgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnZGVjYXkxJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBnZXQgc3VzdGFpbkxldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMuc3VzdGFpbjtcbiAgICB9XG4gICAgc2V0IHN1c3RhaW5MZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLnN1c3RhaW4gPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnZGVjYXkyJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHJlbGVhc2VMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnJlbGVhc2U7XG4gICAgfVxuICAgIHNldCByZWxlYXNlTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5yZWxlYXNlID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ3JlbGVhc2UnLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBREJEU1JFbnZlbG9wZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgQURCRFNSRW52ZWxvcGUoIHRoaXMgKTtcbn07XG5cbmV4cG9ydFxuZGVmYXVsdCBBREJEU1JFbnZlbG9wZTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgQ3VzdG9tRW52ZWxvcGUgZnJvbSBcIi4vQ3VzdG9tRW52ZWxvcGUuZXM2XCI7XG5cbmNsYXNzIEFERW52ZWxvcGUgZXh0ZW5kcyBDdXN0b21FbnZlbG9wZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB0aGlzLnRpbWVzID0ge1xuICAgICAgICAgICAgYXR0YWNrOiAwLjAxLFxuICAgICAgICAgICAgZGVjYXk6IDAuNVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubGV2ZWxzID0ge1xuICAgICAgICAgICAgaW5pdGlhbDogMCxcbiAgICAgICAgICAgIHBlYWs6IDFcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2luaXRpYWwnLCAwLCB0aGlzLmxldmVscy5pbml0aWFsICk7XG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnYXR0YWNrJywgdGhpcy50aW1lcy5hdHRhY2ssIHRoaXMubGV2ZWxzLnBlYWsgKTtcbiAgICAgICAgdGhpcy5hZGRFbmRTdGVwKCAnZGVjYXknLCB0aGlzLnRpbWVzLmRlY2F5LCB0aGlzLmxldmVscy5zdXN0YWluLCB0cnVlICk7XG4gICAgfVxuXG4gICAgZ2V0IGF0dGFja1RpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLmF0dGFjaztcbiAgICB9XG4gICAgc2V0IGF0dGFja1RpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5hdHRhY2sgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ2F0dGFjaycsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IGRlY2F5VGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZXMuZGVjYXk7XG4gICAgfVxuICAgIHNldCBkZWNheVRpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5kZWNheSA9IHRpbWU7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBUaW1lKCAnZGVjYXknLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgaW5pdGlhbExldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMuaW5pdGlhbDtcbiAgICB9XG4gICAgc2V0IGluaXRpYWxMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLmluaXRpYWwgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnaW5pdGlhbCcsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBwZWFrTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5wZWFrO1xuICAgIH1cblxuICAgIHNldCBwZWFrTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5wZWFrID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2F0dGFjaycsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUFERW52ZWxvcGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEFERW52ZWxvcGUoIHRoaXMgKTtcbn07XG5cbmV4cG9ydFxuZGVmYXVsdCBBREVudmVsb3BlOyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBDdXN0b21FbnZlbG9wZSBmcm9tIFwiLi9DdXN0b21FbnZlbG9wZS5lczZcIjtcblxuY2xhc3MgQURTUkVudmVsb3BlIGV4dGVuZHMgQ3VzdG9tRW52ZWxvcGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdGhpcy50aW1lcyA9IHtcbiAgICAgICAgICAgIGF0dGFjazogMC4wMSxcbiAgICAgICAgICAgIGRlY2F5OiAwLjUsXG4gICAgICAgICAgICByZWxlYXNlOiAwLjVcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxldmVscyA9IHtcbiAgICAgICAgICAgIGluaXRpYWw6IDAsXG4gICAgICAgICAgICBwZWFrOiAxLFxuICAgICAgICAgICAgc3VzdGFpbjogMSxcbiAgICAgICAgICAgIHJlbGVhc2U6IDBcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2luaXRpYWwnLCAwLCB0aGlzLmxldmVscy5pbml0aWFsICk7XG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnYXR0YWNrJywgdGhpcy50aW1lcy5hdHRhY2ssIHRoaXMubGV2ZWxzLnBlYWsgKTtcbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdkZWNheScsIHRoaXMudGltZXMuZGVjYXksIHRoaXMubGV2ZWxzLnN1c3RhaW4gKTtcbiAgICAgICAgdGhpcy5hZGRFbmRTdGVwKCAncmVsZWFzZScsIHRoaXMudGltZXMucmVsZWFzZSwgdGhpcy5sZXZlbHMucmVsZWFzZSwgdHJ1ZSApO1xuICAgIH1cblxuICAgIGdldCBhdHRhY2tUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5hdHRhY2s7XG4gICAgfVxuICAgIHNldCBhdHRhY2tUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuYXR0YWNrID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdhdHRhY2snLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBkZWNheVRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLmRlY2F5O1xuICAgIH1cbiAgICBzZXQgZGVjYXlUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuZGVjYXkgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ2RlY2F5JywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgcmVsZWFzZVRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLnJlbGVhc2U7XG4gICAgfVxuICAgIHNldCByZWxlYXNlVGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLnJlbGVhc2UgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ3JlbGVhc2UnLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBpbml0aWFsTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5pbml0aWFsO1xuICAgIH1cbiAgICBzZXQgaW5pdGlhbExldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMuaW5pdGlhbCA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdpbml0aWFsJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHBlYWtMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnBlYWs7XG4gICAgfVxuXG4gICAgc2V0IHBlYWtMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLnBlYWsgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnYXR0YWNrJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHN1c3RhaW5MZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnN1c3RhaW47XG4gICAgfVxuICAgIHNldCBzdXN0YWluTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5zdXN0YWluID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2RlY2F5JywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHJlbGVhc2VMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnJlbGVhc2U7XG4gICAgfVxuICAgIHNldCByZWxlYXNlTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5yZWxlYXNlID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ3JlbGVhc2UnLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBRFNSRW52ZWxvcGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEFEU1JFbnZlbG9wZSggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQURTUkVudmVsb3BlOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgQ09ORklHIGZyb20gXCIuLi9jb3JlL2NvbmZpZy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcblxuY2xhc3MgQ3VzdG9tRW52ZWxvcGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgdGhpcy5fc2V0SU8oIGlvICk7XG5cbiAgICAgICAgdGhpcy5vcmRlcnMgPSB7XG4gICAgICAgICAgICBzdGFydDogW10sXG4gICAgICAgICAgICBzdG9wOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc3RlcHMgPSB7XG4gICAgICAgICAgICBzdGFydDoge30sXG4gICAgICAgICAgICBzdG9wOiB7fVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9hZGRTdGVwKCBzZWN0aW9uLCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCA9IGZhbHNlICkge1xuICAgICAgICBsZXQgc3RvcHMgPSB0aGlzLnN0ZXBzWyBzZWN0aW9uIF07XG5cbiAgICAgICAgaWYgKCBzdG9wc1sgbmFtZSBdICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnU3RvcCB3aXRoIG5hbWUgXCInICsgbmFtZSArICdcIiBhbHJlYWR5IGV4aXN0cy4nICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9yZGVyc1sgc2VjdGlvbiBdLnB1c2goIG5hbWUgKTtcblxuICAgICAgICB0aGlzLnN0ZXBzWyBzZWN0aW9uIF1bIG5hbWUgXSA9IHtcbiAgICAgICAgICAgIHRpbWU6IHRpbWUsXG4gICAgICAgICAgICBsZXZlbDogbGV2ZWwsXG4gICAgICAgICAgICBpc0V4cG9uZW50aWFsOiBpc0V4cG9uZW50aWFsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYWRkU3RhcnRTdGVwKCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCA9IGZhbHNlICkge1xuICAgICAgICB0aGlzLl9hZGRTdGVwKCAnc3RhcnQnLCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBhZGRFbmRTdGVwKCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCA9IGZhbHNlICkge1xuICAgICAgICB0aGlzLl9hZGRTdGVwKCAnc3RvcCcsIG5hbWUsIHRpbWUsIGxldmVsLCBpc0V4cG9uZW50aWFsICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFN0ZXBMZXZlbCggbmFtZSwgbGV2ZWwgKSB7XG4gICAgICAgIGxldCBzdGFydEluZGV4ID0gdGhpcy5vcmRlcnMuc3RhcnQuaW5kZXhPZiggbmFtZSApLFxuICAgICAgICAgICAgZW5kSW5kZXggPSB0aGlzLm9yZGVycy5zdG9wLmluZGV4T2YoIG5hbWUgKTtcblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggPT09IC0xICYmIGVuZEluZGV4ID09PSAtMSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ05vIHN0ZXAgd2l0aCBuYW1lIFwiJyArIG5hbWUgKyAnXCIuIE5vIGxldmVsIHNldC4nICk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggIT09IC0xICkge1xuICAgICAgICAgICAgdGhpcy5zdGVwcy5zdGFydFsgbmFtZSBdLmxldmVsID0gcGFyc2VGbG9hdCggbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RlcHMuc3RvcFsgbmFtZSBdLmxldmVsID0gcGFyc2VGbG9hdCggbGV2ZWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG4gICAgc2V0U3RlcFRpbWUoIG5hbWUsIHRpbWUgKSB7XG4gICAgICAgIHZhciBzdGFydEluZGV4ID0gdGhpcy5vcmRlcnMuc3RhcnQuaW5kZXhPZiggbmFtZSApLFxuICAgICAgICAgICAgZW5kSW5kZXggPSB0aGlzLm9yZGVycy5zdG9wLmluZGV4T2YoIG5hbWUgKTtcblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggPT09IC0xICYmIGVuZEluZGV4ID09PSAtMSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ05vIHN0ZXAgd2l0aCBuYW1lIFwiJyArIG5hbWUgKyAnXCIuIE5vIHRpbWUgc2V0LicgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc3RhcnRJbmRleCAhPT0gLTEgKSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnN0YXJ0WyBuYW1lIF0udGltZSA9IHBhcnNlRmxvYXQoIHRpbWUgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RlcHMuc3RvcFsgbmFtZSBdLnRpbWUgPSBwYXJzZUZsb2F0KCB0aW1lICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cblxuXG4gICAgX3RyaWdnZXJTdGVwKCBwYXJhbSwgc3RlcCwgc3RhcnRUaW1lICkge1xuICAgICAgICAvLyBpZiAoIHN0ZXAuaXNFeHBvbmVudGlhbCA9PT0gdHJ1ZSApIHtcbiAgICAgICAgICAgIC8vIFRoZXJlJ3Mgc29tZXRoaW5nIGFtaXNzIGhlcmUhXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggTWF0aC5tYXgoIHN0ZXAubGV2ZWwsIENPTkZJRy5lcHNpbG9uICksIHN0YXJ0VGltZSArIHN0ZXAudGltZSApO1xuICAgICAgICAgICAgLy8gcGFyYW0uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSggTWF0aC5tYXgoIHN0ZXAubGV2ZWwsIDAuMDEgKSwgc3RhcnRUaW1lICsgc3RlcC50aW1lICk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gZWxzZSB7XG4gICAgICAgICAgICBwYXJhbS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggc3RlcC5sZXZlbCwgc3RhcnRUaW1lICsgc3RlcC50aW1lICk7XG4gICAgICAgIC8vIH1cbiAgICB9XG5cbiAgICBfc3RhcnRTZWN0aW9uKCBzZWN0aW9uLCBwYXJhbSwgc3RhcnRUaW1lLCBjYW5jZWxTY2hlZHVsZWRWYWx1ZXMgKSB7XG4gICAgICAgIHZhciBzdG9wT3JkZXIgPSB0aGlzLm9yZGVyc1sgc2VjdGlvbiBdLFxuICAgICAgICAgICAgc3RlcHMgPSB0aGlzLnN0ZXBzWyBzZWN0aW9uIF0sXG4gICAgICAgICAgICBudW1TdG9wcyA9IHN0b3BPcmRlci5sZW5ndGgsXG4gICAgICAgICAgICBzdGVwO1xuXG4gICAgICAgIHBhcmFtLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggc3RhcnRUaW1lICk7XG4gICAgICAgIC8vIHBhcmFtLnNldFZhbHVlQXRUaW1lKCAwLCBzdGFydFRpbWUgKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1TdG9wczsgKytpICkge1xuICAgICAgICAgICAgc3RlcCA9IHN0ZXBzWyBzdG9wT3JkZXJbIGkgXSBdO1xuICAgICAgICAgICAgdGhpcy5fdHJpZ2dlclN0ZXAoIHBhcmFtLCBzdGVwLCBzdGFydFRpbWUgKTtcbiAgICAgICAgICAgIHN0YXJ0VGltZSArPSBzdGVwLnRpbWU7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHN0YXJ0KCBwYXJhbSwgZGVsYXkgPSAwICkge1xuICAgICAgICBpZiAoIHBhcmFtIGluc3RhbmNlb2YgQXVkaW9QYXJhbSA9PT0gZmFsc2UgJiYgcGFyYW0gaW5zdGFuY2VvZiBQYXJhbSA9PT0gZmFsc2UgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdDYW4gb25seSBzdGFydCBhbiBlbnZlbG9wZSBvbiBBdWRpb1BhcmFtIG9yIFBhcmFtIGluc3RhbmNlcy4nICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zdGFydFNlY3Rpb24oICdzdGFydCcsIHBhcmFtLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyBkZWxheSApO1xuICAgIH1cblxuICAgIHN0b3AoIHBhcmFtLCBkZWxheSA9IDAgKSB7XG4gICAgICAgIHRoaXMuX3N0YXJ0U2VjdGlvbiggJ3N0b3AnLCBwYXJhbSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgMC4xICsgZGVsYXkgKTtcbiAgICB9XG5cbiAgICBmb3JjZVN0b3AoIHBhcmFtLCBkZWxheSA9IDAgKSB7XG4gICAgICAgIHBhcmFtLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgZGVsYXkgKTtcbiAgICAgICAgLy8gcGFyYW0uc2V0VmFsdWVBdFRpbWUoIHBhcmFtLnZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyBkZWxheSApO1xuICAgICAgICBwYXJhbS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggMCwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgMC4wMDEgKTtcbiAgICB9XG5cbiAgICBnZXQgdG90YWxTdGFydFRpbWUoKSB7XG4gICAgICAgIHZhciBzdGFydHMgPSB0aGlzLnN0ZXBzLnN0YXJ0LFxuICAgICAgICAgICAgdGltZSA9IDAuMDtcblxuICAgICAgICBmb3IgKCB2YXIgaSBpbiBzdGFydHMgKSB7XG4gICAgICAgICAgICB0aW1lICs9IHN0YXJ0c1sgaSBdLnRpbWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGltZTtcbiAgICB9XG5cbiAgICBnZXQgdG90YWxTdG9wVGltZSgpIHtcbiAgICAgICAgdmFyIHN0b3BzID0gdGhpcy5zdGVwcy5zdG9wLFxuICAgICAgICAgICAgdGltZSA9IDAuMDtcblxuICAgICAgICBmb3IgKCB2YXIgaSBpbiBzdG9wcyApIHtcbiAgICAgICAgICAgIHRpbWUgKz0gc3RvcHNbIGkgXS50aW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRpbWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBDdXN0b21FbnZlbG9wZS5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ3VzdG9tRW52ZWxvcGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEN1c3RvbUVudmVsb3BlKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDdXN0b21FbnZlbG9wZTsiLCIvKlxuXHRHcmFwaCBmb3IgdGhpcyBub2RlIGlzIHNob3duIGluIHRoZSBmb2xsb3dpbmcgcGFwZXI6XG5cblx0XHRCZWF0IEZyZWkgLSBEaWdpdGFsIFNvdW5kIEdlbmVyYXRpb24gKEFwcGVuZGl4IEM6IE1pc2NlbGxhbmVvdXMg4oCTIDEuIERDIFRyYXApXG5cdFx0SUNTVCwgWnVyaWNoIFVuaSBvZiBBcnRzLlxuXG5cdEF2YWlsYWJsZSBoZXJlOlxuXHRcdGh0dHBzOi8vY291cnNlcy5jcy53YXNoaW5ndG9uLmVkdS9jb3Vyc2VzL2NzZTQ5MHMvMTFhdS9SZWFkaW5ncy9EaWdpdGFsX1NvdW5kX0dlbmVyYXRpb25fMS5wZGZcblxuXG5cblx0RXNzZW50aWFsbHksIGEgRENUcmFwIHJlbW92ZXMgdGhlIERDIG9mZnNldCBvciBEQyBiaWFzXG5cdGZyb20gdGhlIGluY29taW5nIHNpZ25hbCwgd2hlcmUgYSBEQyBvZmZzZXQgaXMgZWxlbWVudHNcblx0b2YgdGhlIHNpZ25hbCB0aGF0IGFyZSBhdCAwSHouXG5cblx0VGhlIGdyYXBoIGlzIGFzIGZvbGxvd3M6XG5cblx0XHQgICB8LS0tPC0tLTx8ICAgaW5wdXRcblx0XHQgICB8XHRcdHxcdCAgfFxuXHRcdCAgIC0+IHotMSAtPiAtPiBuZWdhdGUgLT4gLT4gb3V0XG5cdFx0ICAgfFx0XHRcdFx0XHQgfFxuXHRcdCAgIHw8LS0tLS0tLS0tLS0tLS0gKmEgPC18XG5cblxuXHRUaGUgYSwgb3IgYWxwaGEsIHZhbHVlIGlzIGNhbGN1bGF0ZWQgaXMgYXMgZm9sbG93czpcblx0XHRgYSA9IDJQSWZnIC8gZnNgXG5cblx0V2hlcmUgYGZnYCBkZXRlcm1pbmVzIHRoZSAnc3BlZWQnIG9mIHRoZSB0cmFwICh0aGUgJ2N1dG9mZicpLFxuXHRhbmQgYGZzYCBpcyB0aGUgc2FtcGxlIHJhdGUuIFRoaXMgY2FuIGJlIGV4cGFuZGVkIGludG8gdGhlXG5cdGZvbGxvd2luZyB0byBhdm9pZCBhIG1vcmUgZXhwZW5zaXZlIGRpdmlzaW9uIChhcyB0aGUgcmVjaXByb2NhbFxuXHRvZiB0aGUgc2FtcGxlIHJhdGUgY2FuIGJlIGNhbGN1bGF0ZWQgYmVmb3JlaGFuZCk6XG5cdFx0YGEgPSAoMiAqIFBJICogZmcpICogKDEgLyBmcylgXG5cblxuXHRHaXZlbiBhbiBgZmdgIG9mIDUsIGFuZCBzYW1wbGUgcmF0ZSBvZiA0ODAwMCwgd2UgZ2V0OlxuXHRcdGBhID0gMiAqIFBJICogNSAqICgxIC8gNDgwMDApYFxuXHRcdGBhID0gNi4yODMxICogNSAqIDIuMDgzMzNlLTA1YFxuXHRcdGBhID0gMzEuNDE1NSAqIDIuMDgzMzNlLTA1YFxuXHRcdGBhID0gMC4wMDA2NTQ0ODg1MzYxNWAuXG4gKi9cblxuaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgRENUcmFwIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBjdXRvZmYgPSA1ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBjdXRvZmYsIG9yIGBmZ2AgY29uc3RhbnQuXG4gICAgICAgIC8vIFRoZXJlIHdpbGwgcmFyZWx5IGJlIGEgbmVlZCB0byBjaGFuZ2UgdGhpcyB2YWx1ZSBmcm9tXG4gICAgICAgIC8vIGVpdGhlciB0aGUgZ2l2ZW4gb25lLCBvciBpdCdzIGRlZmF1bHQgb2YgNSxcbiAgICAgICAgLy8gc28gSSdtIG5vdCBtYWtpbmcgdGhpcyBpbnRvIGEgY29udHJvbC5cbiAgICAgICAgZ3JhcGguY3V0b2ZmID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggY3V0b2ZmICk7XG5cbiAgICAgICAgLy8gQWxwaGEgY2FsY3VsYXRpb25cbiAgICAgICAgZ3JhcGguUEkyID0gdGhpcy5pby5jcmVhdGVDb25zdGFudFBJMigpO1xuICAgICAgICBncmFwaC5jdXRvZmZNdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGguYWxwaGEgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKTtcbiAgICAgICAgZ3JhcGguUEkyLmNvbm5lY3QoIGdyYXBoLmN1dG9mZk11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmN1dG9mZi5jb25uZWN0KCBncmFwaC5jdXRvZmZNdWx0aXBseSwgMCwgMSApO1xuICAgICAgICBncmFwaC5jdXRvZmZNdWx0aXBseS5jb25uZWN0KCBncmFwaC5hbHBoYSwgMCwgMCApO1xuXG4gICAgICAgIC8vIE1haW4gZ3JhcGhcbiAgICAgICAgZ3JhcGgubmVnYXRlID0gdGhpcy5pby5jcmVhdGVOZWdhdGUoKTtcbiAgICAgICAgZ3JhcGguek1pbnVzT25lID0gdGhpcy5pby5jcmVhdGVTYW1wbGVEZWxheSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIG1haW4gZ3JhcGggYW5kIGFscGhhLlxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm5lZ2F0ZSApO1xuICAgICAgICBncmFwaC5uZWdhdGUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWxwaGEuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggZ3JhcGguek1pbnVzT25lICk7XG4gICAgICAgIGdyYXBoLnpNaW51c09uZS5jb25uZWN0KCBncmFwaC56TWludXNPbmUgKTtcbiAgICAgICAgZ3JhcGguek1pbnVzT25lLmNvbm5lY3QoIGdyYXBoLm5lZ2F0ZSApO1xuICAgICAgICBncmFwaC5uZWdhdGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRENUcmFwID0gZnVuY3Rpb24oIGN1dG9mZiApIHtcbiAgICByZXR1cm4gbmV3IERDVHJhcCggdGhpcywgY3V0b2ZmICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgRHJ5V2V0Tm9kZSBmcm9tIFwiLi4vZ3JhcGhzL0RyeVdldE5vZGUuZXM2XCI7XG5cbi8vIFRPRE86IEFkZCBmZWVkYmFja0xldmVsIGFuZCBkZWxheVRpbWUgUGFyYW0gaW5zdGFuY2VzXG4vLyB0byBjb250cm9sIHRoaXMgbm9kZS5cbmNsYXNzIERlbGF5IGV4dGVuZHMgRHJ5V2V0Tm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB0aW1lID0gMCwgZmVlZGJhY2tMZXZlbCA9IDAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgY29udHJvbCBub2Rlcy5cbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjayA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGZlZWRiYWNrTGV2ZWwgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdGltZSApO1xuXG4gICAgICAgIC8vIENyZWF0ZSBmZWVkYmFjayBhbmQgZGVsYXkgbm9kZXNcbiAgICAgICAgdGhpcy5mZWVkYmFjayA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcblxuICAgICAgICAvLyBTZXR1cCB0aGUgZmVlZGJhY2sgbG9vcFxuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMuZmVlZGJhY2sgKTtcbiAgICAgICAgdGhpcy5mZWVkYmFjay5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG5cbiAgICAgICAgLy8gQWxzbyBjb25uZWN0IHRoZSBkZWxheSB0byB0aGUgd2V0IG91dHB1dC5cbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLndldCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgaW5wdXQgdG8gZGVsYXlcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG5cbiAgICAgICAgdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudGltZS5jb25uZWN0KCB0aGlzLmRlbGF5LmRlbGF5VGltZSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2suZ2FpbiApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRGVsYXkgPSBmdW5jdGlvbiggdGltZSwgZmVlZGJhY2tMZXZlbCApIHtcbiAgICByZXR1cm4gbmV3IERlbGF5KCB0aGlzLCB0aW1lLCBmZWVkYmFja0xldmVsICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBEZWxheTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcbmltcG9ydCBEcnlXZXROb2RlIGZyb20gXCIuLi9ncmFwaHMvRHJ5V2V0Tm9kZS5lczZcIjtcbmltcG9ydCBEZWxheSBmcm9tIFwiLi9EZWxheS5lczZcIjtcblxuLy8gVE9ETzpcbi8vICAtIENvbnZlcnQgdGhpcyBub2RlIHRvIHVzZSBQYXJhbSBjb250cm9sc1xuLy8gICAgZm9yIHRpbWUgYW5kIGZlZWRiYWNrLlxuXG5jbGFzcyBQaW5nUG9uZ0RlbGF5IGV4dGVuZHMgRHJ5V2V0Tm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB0aW1lID0gMC4yNSwgZmVlZGJhY2tMZXZlbCA9IDAuNSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGNoYW5uZWwgc3BsaXR0ZXIgYW5kIG1lcmdlclxuICAgICAgICB0aGlzLnNwbGl0dGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxTcGxpdHRlciggMiApO1xuICAgICAgICB0aGlzLm1lcmdlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsTWVyZ2VyKCAyICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGZlZWRiYWNrIGFuZCBkZWxheSBub2Rlc1xuICAgICAgICB0aGlzLmZlZWRiYWNrTCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tSID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5kZWxheUwgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgdGhpcy5kZWxheVIgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcblxuICAgICAgICAvLyBTZXR1cCB0aGUgZmVlZGJhY2sgbG9vcFxuICAgICAgICB0aGlzLmRlbGF5TC5jb25uZWN0KCB0aGlzLmZlZWRiYWNrTCApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrTC5jb25uZWN0KCB0aGlzLmRlbGF5UiApO1xuICAgICAgICB0aGlzLmRlbGF5Ui5jb25uZWN0KCB0aGlzLmZlZWRiYWNrUiApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrUi5jb25uZWN0KCB0aGlzLmRlbGF5TCApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnNwbGl0dGVyICk7XG4gICAgICAgIHRoaXMuc3BsaXR0ZXIuY29ubmVjdCggdGhpcy5kZWxheUwsIDAgKTtcbiAgICAgICAgdGhpcy5mZWVkYmFja0wuY29ubmVjdCggdGhpcy5tZXJnZXIsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5mZWVkYmFja1IuY29ubmVjdCggdGhpcy5tZXJnZXIsIDAsIDEgKTtcbiAgICAgICAgdGhpcy5tZXJnZXIuY29ubmVjdCggdGhpcy53ZXQgKTtcblxuICAgICAgICB0aGlzLnRpbWUgPSB0aW1lO1xuICAgICAgICB0aGlzLmZlZWRiYWNrTGV2ZWwgPSBmZWVkYmFja0xldmVsO1xuICAgIH1cblxuICAgIGdldCB0aW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWxheUwuZGVsYXlUaW1lO1xuICAgIH1cblxuICAgIHNldCB0aW1lKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5kZWxheUwuZGVsYXlUaW1lLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyAwLjVcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLmRlbGF5Ui5kZWxheVRpbWUubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIDAuNVxuICAgICAgICApO1xuICAgIH1cblxuICAgIGdldCBmZWVkYmFja0xldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5mZWVkYmFja0wuZ2Fpbi52YWx1ZTtcbiAgICB9XG5cbiAgICBzZXQgZmVlZGJhY2tMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tMLmdhaW4udmFsdWUgPSBsZXZlbDtcbiAgICAgICAgdGhpcy5mZWVkYmFja1IuZ2Fpbi52YWx1ZSA9IGxldmVsO1xuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggUGluZ1BvbmdEZWxheS5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkF1ZGlvSU8ubWl4aW4oIFBpbmdQb25nRGVsYXkucHJvdG90eXBlLCBjb25uZWN0aW9ucyApO1xuQXVkaW9JTy5taXhpbiggUGluZ1BvbmdEZWxheS5wcm90b3R5cGUsIGNsZWFuZXJzICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBpbmdQb25nRGVsYXkgPSBmdW5jdGlvbiggdGltZSwgZmVlZGJhY2tMZXZlbCApIHtcbiAgICByZXR1cm4gbmV3IFBpbmdQb25nRGVsYXkoIHRoaXMsIHRpbWUsIGZlZWRiYWNrTGV2ZWwgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLypcbiAgICBUaGlzIE5vZGUgaXMgYW4gaW1wbGVtZW50YXRpb24gb2Ygb25lIG9mIFNjaHJvZWRlcidzXG4gICAgQWxsUGFzcyBncmFwaHMuIFRoaXMgcGFydGljdWxhciBncmFwaCBpcyBzaG93biBpbiBGaWd1cmUyXG4gICAgaW4gdGhlIGZvbGxvd2luZyBwYXBlcjpcblxuICAgICAgICBNLiBSLiBTY2hyb2VkZXIgLSBOYXR1cmFsIFNvdW5kaW5nIEFydGlmaWNpYWwgUmV2ZXJiZXJhdGlvblxuXG4gICAgICAgIEpvdXJuYWwgb2YgdGhlIEF1ZGlvIEVuZ2luZWVyaW5nIFNvY2lldHksIEp1bHkgMTk2Mi5cbiAgICAgICAgVm9sdW1lIDEwLCBOdW1iZXIgMy5cblxuXG4gICAgSXQncyBhdmFpbGFibGUgaGVyZTpcbiAgICAgICAgaHR0cDovL3d3dy5lY2Uucm9jaGVzdGVyLmVkdS9+emR1YW4vdGVhY2hpbmcvZWNlNDcyL3JlYWRpbmcvU2Nocm9lZGVyXzE5NjIucGRmXG5cblxuICAgIFRoZXJlIGFyZSB0aHJlZSBtYWluIHBhdGhzIGFuIGlucHV0IHNpZ25hbCBjYW4gdGFrZTpcblxuICAgIGluIC0+IC1nYWluIC0+IHN1bTEgLT4gb3V0XG4gICAgaW4gLT4gc3VtMiAtPiBkZWxheSAtPiBnYWluIC0+IHN1bTJcbiAgICBpbiAtPiBzdW0yIC0+IGRlbGF5IC0+IGdhaW4gKDEtZ14yKSAtPiBzdW0xXG5cbiAgICBGb3Igbm93LCB0aGUgc3VtbWluZyBub2RlcyBhcmUgYSBwYXJ0IG9mIHRoZSBmb2xsb3dpbmcgY2xhc3MsXG4gICAgYnV0IGNhbiBlYXNpbHkgYmUgcmVtb3ZlZCBieSBjb25uZWN0aW5nIGAtZ2FpbmAsIGBnYWluYCwgYW5kIGAxLWdhaW5eMmBcbiAgICB0byBgdGhpcy5vdXRwdXRzWzBdYCBhbmQgYC1nYWluYCBhbmQgYGluYCB0byB0aGUgZGVsYXkgZGlyZWN0bHkuXG4gKi9cblxuLy8gVE9ETzpcbi8vICAtIFJlbW92ZSB1bm5lY2Vzc2FyeSBzdW1taW5nIG5vZGVzLlxuY2xhc3MgU2Nocm9lZGVyQWxsUGFzcyBleHRlbmRzIE5vZGUge1xuXG4gICAgY29uc3RydWN0b3IoIGlvLCBkZWxheVRpbWUsIGZlZWRiYWNrICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguc3VtMSA9IGlvLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5zdW0yID0gaW8uY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLnBvc2l0aXZlR2FpbiA9IGlvLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZUdhaW4gPSBpby5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgubmVnYXRlID0gaW8uY3JlYXRlTmVnYXRlKCk7XG4gICAgICAgIGdyYXBoLmRlbGF5ID0gaW8uY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICBncmFwaC5vbmVNaW51c0dhaW5TcXVhcmVkID0gaW8uY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm1pbnVzT25lID0gaW8uY3JlYXRlU3VidHJhY3QoIDEgKTtcbiAgICAgICAgZ3JhcGguZ2FpblNxdWFyZWQgPSBpby5jcmVhdGVTcXVhcmUoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrID0gaW8uY3JlYXRlUGFyYW0oIGZlZWRiYWNrICksXG4gICAgICAgIHRoaXMuY29udHJvbHMuZGVsYXlUaW1lID0gaW8uY3JlYXRlUGFyYW0oIGRlbGF5VGltZSApO1xuXG4gICAgICAgIC8vIFplcm8gb3V0IGNvbnRyb2xsZWQgcGFyYW1zLlxuICAgICAgICBncmFwaC5wb3NpdGl2ZUdhaW4uZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlR2Fpbi5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgub25lTWludXNHYWluU3F1YXJlZC5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIGdhaW4gY29udHJvbHNcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5wb3NpdGl2ZUdhaW4uZ2FpbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrLmNvbm5lY3QoIGdyYXBoLm5lZ2F0ZSApO1xuICAgICAgICBncmFwaC5uZWdhdGUuY29ubmVjdCggZ3JhcGgubmVnYXRpdmVHYWluLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5nYWluU3F1YXJlZCApO1xuICAgICAgICBncmFwaC5nYWluU3F1YXJlZC5jb25uZWN0KCBncmFwaC5taW51c09uZSApO1xuICAgICAgICBncmFwaC5taW51c09uZS5jb25uZWN0KCBncmFwaC5vbmVNaW51c0dhaW5TcXVhcmVkLmdhaW4gKTtcblxuICAgICAgICAvLyBjb25uZWN0IGRlbGF5IHRpbWUgY29udHJvbFxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRlbGF5VGltZS5jb25uZWN0KCBncmFwaC5kZWxheS5kZWxheVRpbWUgKTtcblxuICAgICAgICAvLyBGaXJzdCBzaWduYWwgcGF0aDpcbiAgICAgICAgLy8gaW4gLT4gLWdhaW4gLT4gZ3JhcGguc3VtMSAtPiBvdXRcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5uZWdhdGl2ZUdhaW4gKTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVHYWluLmNvbm5lY3QoIGdyYXBoLnN1bTEgKTtcbiAgICAgICAgZ3JhcGguc3VtMS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIFNlY29uZCBzaWduYWwgcGF0aDpcbiAgICAgICAgLy8gKGluIC0+IGdyYXBoLnN1bTIgLT4pIGRlbGF5IC0+IGdhaW4gLT4gZ3JhcGguc3VtMlxuICAgICAgICBncmFwaC5kZWxheS5jb25uZWN0KCBncmFwaC5wb3NpdGl2ZUdhaW4gKTtcbiAgICAgICAgZ3JhcGgucG9zaXRpdmVHYWluLmNvbm5lY3QoIGdyYXBoLnN1bTIgKTtcblxuICAgICAgICAvLyBUaGlyZCBzaWduYWwgcGF0aDpcbiAgICAgICAgLy8gaW4gLT4gZ3JhcGguc3VtMiAtPiBkZWxheSAtPiBnYWluICgxLWdeMikgLT4gZ3JhcGguc3VtMVxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnN1bTIgKTtcbiAgICAgICAgZ3JhcGguc3VtMi5jb25uZWN0KCBncmFwaC5kZWxheSApO1xuICAgICAgICBncmFwaC5kZWxheS5jb25uZWN0KCBncmFwaC5vbmVNaW51c0dhaW5TcXVhcmVkICk7XG4gICAgICAgIGdyYXBoLm9uZU1pbnVzR2FpblNxdWFyZWQuY29ubmVjdCggZ3JhcGguc3VtMSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTY2hyb2VkZXJBbGxQYXNzID0gZnVuY3Rpb24oIGRlbGF5VGltZSwgZmVlZGJhY2sgKSB7XG4gICAgcmV0dXJuIG5ldyBTY2hyb2VkZXJBbGxQYXNzKCB0aGlzLCBkZWxheVRpbWUsIGZlZWRiYWNrICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgRHJ5V2V0Tm9kZSBmcm9tIFwiLi4vZ3JhcGhzL0RyeVdldE5vZGUuZXM2XCI7XG5cbi8vIFRPRE86IEFkZCBmZWVkYmFja0xldmVsIGFuZCBkZWxheVRpbWUgUGFyYW0gaW5zdGFuY2VzXG4vLyB0byBjb250cm9sIHRoaXMgbm9kZS5cbmNsYXNzIFNpbmVTaGFwZXIgZXh0ZW5kcyBEcnlXZXROb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZHJpdmUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5TaW5lICk7XG4gICAgICAgIHRoaXMuc2hhcGVyRHJpdmUgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLnNoYXBlckRyaXZlLmdhaW4udmFsdWUgPSAxO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5zaGFwZXJEcml2ZSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRyaXZlLmNvbm5lY3QoIHRoaXMuc2hhcGVyRHJpdmUuZ2FpbiApO1xuICAgICAgICB0aGlzLnNoYXBlckRyaXZlLmNvbm5lY3QoIHRoaXMuc2hhcGVyICk7XG4gICAgICAgIHRoaXMuc2hhcGVyLmNvbm5lY3QoIHRoaXMud2V0ICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTaW5lU2hhcGVyID0gZnVuY3Rpb24oIHRpbWUsIGZlZWRiYWNrTGV2ZWwgKSB7XG4gICAgcmV0dXJuIG5ldyBTaW5lU2hhcGVyKCB0aGlzLCB0aW1lLCBmZWVkYmFja0xldmVsICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTaW5lU2hhcGVyOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbi8vIEJhc2VkIG9uIHRoZSBmb2xsb3dpbmcgZm9ybXVsYSBmcm9tIE1pY2hhZWwgR3J1aG46XG4vLyAgLSBodHRwOi8vbXVzaWNkc3Aub3JnL3Nob3dBcmNoaXZlQ29tbWVudC5waHA/QXJjaGl2ZUlEPTI1NVxuLy9cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy9cbi8vIENhbGN1bGF0ZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXgncyBjb2VmZmljaWVudHNcbi8vIGNvc19jb2VmID0gY29zKGFuZ2xlKTtcbi8vIHNpbl9jb2VmID0gc2luKGFuZ2xlKTtcblxuLy8gRG8gdGhpcyBwZXIgc2FtcGxlXG4vLyBvdXRfbGVmdCA9IGluX2xlZnQgKiBjb3NfY29lZiAtIGluX3JpZ2h0ICogc2luX2NvZWY7XG4vLyBvdXRfcmlnaHQgPSBpbl9sZWZ0ICogc2luX2NvZWYgKyBpbl9yaWdodCAqIGNvc19jb2VmO1xuY2xhc3MgU3RlcmVvUm90YXRpb24gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHJvdGF0aW9uICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5yb3RhdGlvbiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHJvdGF0aW9uICk7XG5cbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKCAyICk7XG4gICAgICAgIGdyYXBoLmNvcyA9IHRoaXMuaW8uY3JlYXRlQ29zKCk7XG4gICAgICAgIGdyYXBoLnNpbiA9IHRoaXMuaW8uY3JlYXRlU2luKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5yb3RhdGlvbi5jb25uZWN0KCBncmFwaC5jb3MgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5yb3RhdGlvbi5jb25uZWN0KCBncmFwaC5zaW4gKTtcblxuICAgICAgICBncmFwaC5sZWZ0TXVsdGlwbHlDb3MgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLmxlZnRNdWx0aXBseVNpbiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgucmlnaHRNdWx0aXBseUNvcyA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgucmlnaHRNdWx0aXBseVNpbiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubGVmdENvc01pbnVzUmlnaHRTaW4gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIGdyYXBoLmxlZnRTaW5BZGRSaWdodENvcyA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG5cblxuXG4gICAgICAgIGdyYXBoLmlucHV0TGVmdCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmlucHV0UmlnaHQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5tZXJnZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQ2hhbm5lbE1lcmdlciggMiApO1xuXG4gICAgICAgIGdyYXBoLnNwbGl0dGVyLmNvbm5lY3QoIGdyYXBoLmlucHV0TGVmdCwgMCApO1xuICAgICAgICBncmFwaC5zcGxpdHRlci5jb25uZWN0KCBncmFwaC5pbnB1dFJpZ2h0LCAxICk7XG5cbiAgICAgICAgZ3JhcGguaW5wdXRMZWZ0LmNvbm5lY3QoIGdyYXBoLmxlZnRNdWx0aXBseUNvcywgMCwgMCApO1xuICAgICAgICBncmFwaC5jb3MuY29ubmVjdCggZ3JhcGgubGVmdE11bHRpcGx5Q29zLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmlucHV0TGVmdC5jb25uZWN0KCBncmFwaC5sZWZ0TXVsdGlwbHlTaW4sIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguc2luLmNvbm5lY3QoIGdyYXBoLmxlZnRNdWx0aXBseVNpbiwgMCwgMSk7XG5cbiAgICAgICAgZ3JhcGguaW5wdXRSaWdodC5jb25uZWN0KCBncmFwaC5yaWdodE11bHRpcGx5U2luLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLnNpbi5jb25uZWN0KCBncmFwaC5yaWdodE11bHRpcGx5U2luLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmlucHV0UmlnaHQuY29ubmVjdCggZ3JhcGgucmlnaHRNdWx0aXBseUNvcywgMCwgMCApO1xuICAgICAgICBncmFwaC5jb3MuY29ubmVjdCggZ3JhcGgucmlnaHRNdWx0aXBseUNvcywgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLmxlZnRNdWx0aXBseUNvcy5jb25uZWN0KCBncmFwaC5sZWZ0Q29zTWludXNSaWdodFNpbiwgMCwgMCApO1xuICAgICAgICBncmFwaC5yaWdodE11bHRpcGx5U2luLmNvbm5lY3QoIGdyYXBoLmxlZnRDb3NNaW51c1JpZ2h0U2luLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmxlZnRNdWx0aXBseVNpbi5jb25uZWN0KCBncmFwaC5sZWZ0U2luQWRkUmlnaHRDb3MsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgucmlnaHRNdWx0aXBseUNvcy5jb25uZWN0KCBncmFwaC5sZWZ0U2luQWRkUmlnaHRDb3MsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5sZWZ0Q29zTWludXNSaWdodFNpbi5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubGVmdFNpbkFkZFJpZ2h0Q29zLmNvbm5lY3QoIGdyYXBoLm1lcmdlciwgMCwgMSApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zcGxpdHRlciApO1xuICAgICAgICBncmFwaC5tZXJnZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLm5hbWVkSW5wdXRzLmxlZnQgPSBncmFwaC5pbnB1dExlZnQ7XG4gICAgICAgIHRoaXMubmFtZWRJbnB1dHMucmlnaHQgPSBncmFwaC5pbnB1dFJpZ2h0O1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTdGVyZW9Sb3RhdGlvbiA9IGZ1bmN0aW9uKCByb3RhdGlvbiApIHtcbiAgICByZXR1cm4gbmV3IFN0ZXJlb1JvdGF0aW9uKCB0aGlzLCByb3RhdGlvbiApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vLyBCYXNlZCBvbiB0aGUgZm9sbG93aW5nIGZvcm11bGEgZnJvbSBNaWNoYWVsIEdydWhuOlxuLy8gIC0gaHR0cDovL211c2ljZHNwLm9yZy9zaG93QXJjaGl2ZUNvbW1lbnQucGhwP0FyY2hpdmVJRD0yNTZcbi8vXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vXG4vLyBUaGUgZ3JhcGggdGhhdCdzIGNyZWF0ZWQgaXMgYXMgZm9sbG93czpcbi8vXG4vLyAgICAgICAgICAgICAgICAgICB8LT4gTCAtPiBsZWZ0QWRkUmlnaHQoIGNoMCApIC0+IHxcbi8vICAgICAgICAgICAgICAgICAgIHwtPiBSIC0+IGxlZnRBZGRSaWdodCggY2gxICkgLT4gfCAtPiBtdWx0aXBseSggMC41ICkgLS0tLS0tPiBtb25vTWludXNTdGVyZW8oIDAgKSAtPiBtZXJnZXIoIDAgKSAvLyBvdXRMXG4vLyBpbnB1dCAtPiBzcGxpdHRlciAtICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8LS0tLS0+IG1vbm9QbHVzU3RlcmVvKCAwICkgLS0+IG1lcmdlciggMSApIC8vIG91dFJcbi8vICAgICAgICAgICAgICAgICAgIHwtPiBMIC0+IHJpZ2h0TWludXNMZWZ0KCBjaDEgKSAtPiB8XG4vLyAgICAgICAgICAgICAgICAgICB8LT4gUiAtPiByaWdodE1pbnVzTGVmdCggY2gwICkgLT4gfCAtPiBtdWx0aXBseSggY29lZiApIC0tLT4gbW9ub01pbnVzU3RlcmVvKCAxICkgLT4gbWVyZ2VyKCAwICkgLy8gb3V0TFxuLy9cbi8vXG5jbGFzcyBTdGVyZW9XaWR0aCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgd2lkdGggKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5zcGxpdHRlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoIDIgKTtcbiAgICAgICAgZ3JhcGguY29lZmZpY2llbnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB3aWR0aCApO1xuICAgICAgICBncmFwaC5jb2VmZmljaWVudEhhbGYgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAwLjUgKTtcbiAgICAgICAgZ3JhcGguaW5wdXRMZWZ0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguaW5wdXRSaWdodCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmxlZnRBZGRSaWdodCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLnJpZ2h0TWludXNMZWZ0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseVBvaW50Rml2ZSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIDAuNSApO1xuICAgICAgICBncmFwaC5tdWx0aXBseUNvZWZmaWNpZW50ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tb25vTWludXNTdGVyZW8gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIGdyYXBoLm1vbm9QbHVzU3RlcmVvID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgZ3JhcGgubWVyZ2VyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxNZXJnZXIoIDIgKTtcblxuICAgICAgICBncmFwaC5jb2VmZmljaWVudC5jb25uZWN0KCBncmFwaC5jb2VmZmljaWVudEhhbGYgKTtcbiAgICAgICAgZ3JhcGguY29lZmZpY2llbnRIYWxmLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5Q29lZmZpY2llbnQsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5zcGxpdHRlci5jb25uZWN0KCBncmFwaC5pbnB1dExlZnQsIDAgKTtcbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIuY29ubmVjdCggZ3JhcGguaW5wdXRSaWdodCwgMSApO1xuICAgICAgICBncmFwaC5pbnB1dExlZnQuY29ubmVjdCggZ3JhcGgubGVmdEFkZFJpZ2h0LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmlucHV0UmlnaHQuY29ubmVjdCggZ3JhcGgubGVmdEFkZFJpZ2h0LCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmlucHV0TGVmdC5jb25uZWN0KCBncmFwaC5yaWdodE1pbnVzTGVmdCwgMCwgMSApO1xuICAgICAgICBncmFwaC5pbnB1dFJpZ2h0LmNvbm5lY3QoIGdyYXBoLnJpZ2h0TWludXNMZWZ0LCAwLCAwICk7XG5cbiAgICAgICAgZ3JhcGgubGVmdEFkZFJpZ2h0LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5UG9pbnRGaXZlICk7XG4gICAgICAgIGdyYXBoLnJpZ2h0TWludXNMZWZ0LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5Q29lZmZpY2llbnQsIDAsIDAgKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseVBvaW50Rml2ZS5jb25uZWN0KCBncmFwaC5tb25vTWludXNTdGVyZW8sIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHlDb2VmZmljaWVudC5jb25uZWN0KCBncmFwaC5tb25vTWludXNTdGVyZW8sIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseVBvaW50Rml2ZS5jb25uZWN0KCBncmFwaC5tb25vUGx1c1N0ZXJlbywgMCwgMCApO1xuICAgICAgICBncmFwaC5tdWx0aXBseUNvZWZmaWNpZW50LmNvbm5lY3QoIGdyYXBoLm1vbm9QbHVzU3RlcmVvLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGgubW9ub01pbnVzU3RlcmVvLmNvbm5lY3QoIGdyYXBoLm1lcmdlciwgMCwgMCApO1xuICAgICAgICBncmFwaC5tb25vUGx1c1N0ZXJlby5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNwbGl0dGVyICk7XG4gICAgICAgIGdyYXBoLm1lcmdlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMubmFtZWRJbnB1dHMubGVmdCA9IGdyYXBoLmlucHV0TGVmdDtcbiAgICAgICAgdGhpcy5uYW1lZElucHV0cy5yaWdodCA9IGdyYXBoLmlucHV0UmlnaHQ7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy53aWR0aCA9IGdyYXBoLmNvZWZmaWNpZW50O1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTdGVyZW9XaWR0aCA9IGZ1bmN0aW9uKCB3aWR0aCApIHtcbiAgICByZXR1cm4gbmV3IFN0ZXJlb1dpZHRoKCB0aGlzLCB3aWR0aCApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxudmFyIEZJTFRFUl9TVE9SRSA9IG5ldyBXZWFrTWFwKCk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUZpbHRlciggaW8sIHR5cGUgKSB7XG4gICAgdmFyIGdyYXBoID0ge1xuICAgICAgICBmaWx0ZXI6IGlvLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCksXG4gICAgICAgIGNvbnRyb2xzOiB7fSxcbiAgICAgICAgdHlwZTogdW5kZWZpbmVkXG4gICAgfTtcblxuICAgIGdyYXBoLmZpbHRlci5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgIGdyYXBoLmZpbHRlci5RLnZhbHVlID0gMDtcblxuICAgIGdyYXBoLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IGlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgZ3JhcGguY29udHJvbHMuUSA9IGlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICBncmFwaC5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGguZmlsdGVyLmZyZXF1ZW5jeSApO1xuICAgIGdyYXBoLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGguZmlsdGVyLlEgKTtcblxuICAgIGdyYXBoLnNldFR5cGUgPSBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcblxuICAgICAgICBzd2l0Y2goIHR5cGUgKSB7XG4gICAgICAgICAgICBjYXNlICdMUDEyJzpcbiAgICAgICAgICAgICAgICB0aGlzLmZpbHRlci50eXBlID0gJ2xvd3Bhc3MnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdub3RjaCc6XG4gICAgICAgICAgICAgICAgdGhpcy5maWx0ZXIudHlwZSA9ICdub3RjaCc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0hQMTInOlxuICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyLnR5cGUgPSAnaGlnaHBhc3MnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAvLyBGYWxsIHRocm91Z2ggdG8gaGFuZGxlIHRob3NlIGZpbHRlclxuICAgICAgICAgICAgLy8gdHlwZXMgd2l0aCBgZ2FpbmAgQXVkaW9QYXJhbXMuXG4gICAgICAgICAgICBjYXNlICdsb3dzaGVsZic6XG4gICAgICAgICAgICAgICAgdGhpcy5maWx0ZXIudHlwZSA9ICdsb3dzaGVsZic7XG4gICAgICAgICAgICBjYXNlICdoaWdoc2hlbGYnOlxuICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyLnR5cGUgPSAnaGlnaHNoZWxmJztcbiAgICAgICAgICAgIGNhc2UgJ3BlYWtpbmcnOlxuICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyLnR5cGUgPSAncGVha2luZyc7XG4gICAgICAgICAgICAgICAgdGhpcy5maWx0ZXIuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250cm9scy5nYWluID0gaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBncmFwaC5zZXRUeXBlKCB0eXBlICk7XG5cbiAgICByZXR1cm4gZ3JhcGg7XG59XG5cbmNsYXNzIEN1c3RvbUVRIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyBJbml0aWFsbHksIHRoaXMgTm9kZSBpcyBqdXN0IGEgcGFzcy10aHJvdWdoXG4gICAgICAgIC8vIHVudGlsIGZpbHRlcnMgYXJlIGFkZGVkLlxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgYWRkRmlsdGVyKCB0eXBlICkge1xuICAgICAgICB2YXIgZmlsdGVyR3JhcGggPSBjcmVhdGVGaWx0ZXIoIHRoaXMuaW8sIHR5cGUgKSxcbiAgICAgICAgICAgIGZpbHRlcnMgPSBGSUxURVJfU1RPUkUuZ2V0KCB0aGlzICkgfHwgW107XG5cbiAgICAgICAgLy8gSWYgdGhpcyBpcyB0aGUgZmlyc3QgZmlsdGVyIGJlaW5nIGFkZGVkLFxuICAgICAgICAvLyBtYWtlIHN1cmUgaW5wdXQgaXMgY29ubmVjdGVkIGFuZCBmaWx0ZXJcbiAgICAgICAgLy8gaXMgdGhlbiBjb25uZWN0ZWQgdG8gb3V0cHV0LlxuICAgICAgICBpZiggZmlsdGVycy5sZW5ndGggPT09IDAgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmRpc2Nvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGZpbHRlckdyYXBoLmZpbHRlciApO1xuICAgICAgICAgICAgZmlsdGVyR3JhcGguZmlsdGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGVyZSBhcmUgYWxyZWFkeSBmaWx0ZXJzLCB0aGUgbGFzdCBmaWx0ZXJcbiAgICAgICAgLy8gaW4gdGhlIGdyYXBoIHdpbGwgbmVlZCB0byBiZSBkaXNjb25uZWN0ZWQgZm9ybVxuICAgICAgICAvLyB0aGUgb3V0cHV0IGJlZm9yZSB0aGUgbmV3IGZpbHRlciBpcyBjb25uZWN0ZWQuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZmlsdGVyc1sgZmlsdGVycy5sZW5ndGggLSAxIF0uZmlsdGVyLmRpc2Nvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgICAgICBmaWx0ZXJzWyBmaWx0ZXJzLmxlbmd0aCAtIDEgXS5maWx0ZXIuY29ubmVjdCggZmlsdGVyR3JhcGguZmlsdGVyICk7XG4gICAgICAgICAgICBmaWx0ZXJHcmFwaC5maWx0ZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZpbHRlcnMucHVzaCggZmlsdGVyR3JhcGggKTtcbiAgICAgICAgRklMVEVSX1NUT1JFLnNldCggdGhpcywgZmlsdGVycyApO1xuXG4gICAgICAgIHJldHVybiBmaWx0ZXJHcmFwaDtcbiAgICB9XG5cbiAgICBnZXRGaWx0ZXIoIGluZGV4ICkge1xuICAgICAgICByZXR1cm4gRklMVEVSX1NUT1JFLmdldCggdGhpcyApWyBpbmRleCBdO1xuICAgIH1cblxuICAgIGdldEFsbEZpbHRlcnMoKSB7XG4gICAgICAgIHJldHVybiBGSUxURVJfU1RPUkUuZ2V0KCB0aGlzICk7XG4gICAgfVxuXG4gICAgcmVtb3ZlRmlsdGVyKCBmaWx0ZXJHcmFwaCApIHtcbiAgICAgICAgdmFyIGZpbHRlcnMgPSBGSUxURVJfU1RPUkUuZ2V0KCB0aGlzICksXG4gICAgICAgICAgICBpbmRleCA9IGZpbHRlcnMuaW5kZXhPZiggZmlsdGVyR3JhcGggKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5yZW1vdmVGaWx0ZXJBdEluZGV4KCBpbmRleCApO1xuICAgIH1cblxuICAgIHJlbW92ZUZpbHRlckF0SW5kZXgoIGluZGV4ICkge1xuICAgICAgICB2YXIgZmlsdGVycyA9IEZJTFRFUl9TVE9SRS5nZXQoIHRoaXMgKTtcblxuXG4gICAgICAgIGlmKCAhZmlsdGVyc1sgaW5kZXggXSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ05vIGZpbHRlciBhdCB0aGUgZ2l2ZW4gaW5kZXg6JywgaW5kZXgsIGZpbHRlcnMgKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRpc2Nvbm5lY3QgdGhlIHJlcXVlc3RlZCBmaWx0ZXJcbiAgICAgICAgLy8gYW5kIHJlbW92ZSBpdCBmcm9tIHRoZSBmaWx0ZXJzIGFycmF5LlxuICAgICAgICBmaWx0ZXJzWyBpbmRleCBdLmZpbHRlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIGZpbHRlcnMuc3BsaWNlKCBpbmRleCwgMSApO1xuXG4gICAgICAgIC8vIElmIGFsbCBmaWx0ZXJzIGhhdmUgYmVlbiByZW1vdmVkLCBjb25uZWN0IHRoZVxuICAgICAgICAvLyBpbnB1dCB0byB0aGUgb3V0cHV0IHNvIGF1ZGlvIHN0aWxsIHBhc3NlcyB0aHJvdWdoLlxuICAgICAgICBpZiggZmlsdGVycy5sZW5ndGggPT09IDAgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgZmlyc3QgZmlsdGVyIGhhcyBiZWVuIHJlbW92ZWQsIGFuZCB0aGVyZVxuICAgICAgICAvLyBhcmUgc3RpbGwgZmlsdGVycyBpbiB0aGUgYXJyYXksIGNvbm5lY3QgdGhlIGlucHV0XG4gICAgICAgIC8vIHRvIHRoZSBuZXcgZmlyc3QgZmlsdGVyLlxuICAgICAgICBlbHNlIGlmKCBpbmRleCA9PT0gMCApIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZmlsdGVyc1sgMCBdLmZpbHRlciApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIGxhc3QgZmlsdGVyIGhhcyBiZWVuIHJlbW92ZWQsIHRoZVxuICAgICAgICAvLyBuZXcgbGFzdCBmaWx0ZXIgbXVzdCBiZSBjb25uZWN0ZWQgdG8gdGhlIG91dHB1dFxuICAgICAgICBlbHNlIGlmKCBpbmRleCA9PT0gZmlsdGVycy5sZW5ndGggKSB7XG4gICAgICAgICAgICBmaWx0ZXJzWyBmaWx0ZXJzLmxlbmd0aCAtIDEgXS5maWx0ZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE90aGVyd2lzZSwgdGhlIGluZGV4IG9mIHRoZSBmaWx0ZXIgdGhhdCdzIGJlZW5cbiAgICAgICAgLy8gcmVtb3ZlZCBpc24ndCB0aGUgZmlyc3QsIGxhc3QsIG9yIG9ubHkgaW5kZXggaW4gdGhlXG4gICAgICAgIC8vIGFycmF5LCBzbyBjb25uZWN0IHRoZSBwcmV2aW91cyBmaWx0ZXIgdG8gdGhlIG5ld1xuICAgICAgICAvLyBvbmUgYXQgdGhlIGdpdmVuIGluZGV4LlxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZpbHRlcnNbIGluZGV4IC0gMSBdLmZpbHRlci5jb25uZWN0KCBmaWx0ZXJzWyBpbmRleCBdLmZpbHRlciApO1xuICAgICAgICB9XG5cbiAgICAgICAgRklMVEVSX1NUT1JFLnNldCggdGhpcywgZmlsdGVycyApO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlbW92ZUFsbEZpbHRlcnMoKSB7XG4gICAgICAgIHZhciBmaWx0ZXJzID0gRklMVEVSX1NUT1JFLmdldCggdGhpcyApO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSBmaWx0ZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVGaWx0ZXJBdEluZGV4KCBpICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUN1c3RvbUVRID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBDdXN0b21FUSggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQ3VzdG9tRVE7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIEFsbFBhc3NGaWx0ZXIgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIDIsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICBncmFwaC5scDI0ZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG5cbiAgICAgICAgZ3JhcGgubHAxMmRCLnR5cGUgPSAnYWxscGFzcyc7XG4gICAgICAgIGdyYXBoLmxwMjRkQi50eXBlID0gJ2FsbHBhc3MnO1xuICAgICAgICBncmFwaC5scDEyZEIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAyNGRCLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5RLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAyNGRCLlEudmFsdWUgPSAwO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuc2xvcGUgPSBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29udHJvbHMuaW5kZXg7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgubHAxMmRCLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5scDI0ZEIuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5scDEyZEIuUSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGgubHAyNGRCLlEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmxwMTJkQiApO1xuICAgICAgICBncmFwaC5scDEyZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5jb25uZWN0KCBncmFwaC5scDI0ZEIgKTtcbiAgICAgICAgZ3JhcGgubHAyNGRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMSApO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQWxsUGFzc0ZpbHRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgQWxsUGFzc0ZpbHRlciggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQWxsUGFzc0ZpbHRlcjsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgQlBGaWx0ZXIgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIDIsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICBncmFwaC5scDI0ZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG5cbiAgICAgICAgZ3JhcGgubHAxMmRCLnR5cGUgPSAnYmFuZHBhc3MnO1xuICAgICAgICBncmFwaC5scDI0ZEIudHlwZSA9ICdiYW5kcGFzcyc7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAxMmRCLlEudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuUS52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5zbG9wZSA9IGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb250cm9scy5pbmRleDtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5scDEyZEIuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmxwMjRkQi5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmxwMTJkQi5RICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5scDI0ZEIuUSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubHAxMmRCICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCLmNvbm5lY3QoIGdyYXBoLmxwMjRkQiApO1xuICAgICAgICBncmFwaC5scDI0ZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVCUEZpbHRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgQlBGaWx0ZXIoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEJQRmlsdGVyOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG52YXIgRklMVEVSX1RZUEVTID0gW1xuICAgICdsb3dwYXNzJyxcbiAgICAnYmFuZHBhc3MnLFxuICAgICdoaWdocGFzcycsXG4gICAgJ25vdGNoJyxcbiAgICAnbG93cGFzcydcbl07XG5cbmNsYXNzIEZpbHRlckJhbmsgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyMTJkQiA9IHRoaXMuaW8uY3JlYXRlQ3Jvc3NmYWRlciggRklMVEVSX1RZUEVTLmxlbmd0aCwgMCApO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyMjRkQiA9IHRoaXMuaW8uY3JlYXRlQ3Jvc3NmYWRlciggRklMVEVSX1RZUEVTLmxlbmd0aCwgMCApO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIDIsIDAgKTtcbiAgICAgICAgZ3JhcGguZmlsdGVyczEyZEIgPSBbXTtcbiAgICAgICAgZ3JhcGguZmlsdGVyczI0ZEIgPSBbXTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnNsb3BlID0gZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbnRyb2xzLmluZGV4O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZpbHRlclR5cGUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmlsdGVyVHlwZS5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyMTJkQi5jb250cm9scy5pbmRleCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZpbHRlclR5cGUuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlcjI0ZEIuY29udHJvbHMuaW5kZXggKTtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGZpcnN0IHNldCBvZiAxMmRiIGZpbHRlcnMgKHN0YW5kYXJkIGlzc3VlIHdpdGggV2ViQXVkaW9BUEkpXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IEZJTFRFUl9UWVBFUy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHZhciBmaWx0ZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG5cbiAgICAgICAgICAgIGZpbHRlci50eXBlID0gRklMVEVSX1RZUEVTWyBpIF07XG4gICAgICAgICAgICBmaWx0ZXIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgICAgIGZpbHRlci5RLnZhbHVlID0gMDtcblxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZmlsdGVyLmZyZXF1ZW5jeSApO1xuICAgICAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGZpbHRlci5RICk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGZpbHRlciApO1xuICAgICAgICAgICAgZmlsdGVyLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXIxMmRCLCAwLCBpICk7XG5cbiAgICAgICAgICAgIGdyYXBoLmZpbHRlcnMxMmRCLnB1c2goIGZpbHRlciApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBzZWNvbmQgc2V0IG9mIDEyZGIgZmlsdGVycyxcbiAgICAgICAgLy8gd2hlcmUgdGhlIGZpcnN0IHNldCB3aWxsIGJlIHBpcGVkIGludG8gc28gd2VcbiAgICAgICAgLy8gZW5kIHVwIHdpdGggZG91YmxlIHRoZSByb2xsb2ZmICgxMmRCICogMiA9IDI0ZEIpLlxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBGSUxURVJfVFlQRVMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuXG4gICAgICAgICAgICBmaWx0ZXIudHlwZSA9IEZJTFRFUl9UWVBFU1sgaSBdO1xuICAgICAgICAgICAgZmlsdGVyLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgICAgICBmaWx0ZXIuUS52YWx1ZSA9IDA7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBmaWx0ZXIgKTtcblxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZmlsdGVyLmZyZXF1ZW5jeSApO1xuICAgICAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGZpbHRlci5RICk7XG4gICAgICAgICAgICBncmFwaC5maWx0ZXJzMTJkQlsgaSBdLmNvbm5lY3QoIGZpbHRlciApO1xuICAgICAgICAgICAgZmlsdGVyLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXIyNGRCLCAwLCBpICk7XG5cbiAgICAgICAgICAgIGdyYXBoLmZpbHRlcnMyNGRCLnB1c2goIGZpbHRlciApO1xuICAgICAgICB9XG5cbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlcjEyZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIyNGRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMSApO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRmlsdGVyQmFuayA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRmlsdGVyQmFuayggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRmlsdGVyQmFuazsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgSFBGaWx0ZXIgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIDIsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICBncmFwaC5scDI0ZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG5cbiAgICAgICAgZ3JhcGgubHAxMmRCLnR5cGUgPSAnaGlnaHBhc3MnO1xuICAgICAgICBncmFwaC5scDI0ZEIudHlwZSA9ICdoaWdocGFzcyc7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAxMmRCLlEudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuUS52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5zbG9wZSA9IGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb250cm9scy5pbmRleDtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5scDEyZEIuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmxwMjRkQi5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmxwMTJkQi5RICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5scDI0ZEIuUSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubHAxMmRCICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCLmNvbm5lY3QoIGdyYXBoLmxwMjRkQiApO1xuICAgICAgICBncmFwaC5scDI0ZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVIUEZpbHRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSFBGaWx0ZXIoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEhQRmlsdGVyOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMUEZpbHRlciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSA9IHRoaXMuaW8uY3JlYXRlQ3Jvc3NmYWRlciggMiwgMCApO1xuICAgICAgICBncmFwaC5scDEyZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gICAgICAgIGdyYXBoLmxwMjRkQiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcblxuICAgICAgICBncmFwaC5scDEyZEIudHlwZSA9ICdsb3dwYXNzJztcbiAgICAgICAgZ3JhcGgubHAyNGRCLnR5cGUgPSAnbG93cGFzcyc7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAxMmRCLlEudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuUS52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5zbG9wZSA9IGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb250cm9scy5pbmRleDtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5scDEyZEIuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmxwMjRkQi5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmxwMTJkQi5RICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5scDI0ZEIuUSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubHAxMmRCICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCLmNvbm5lY3QoIGdyYXBoLmxwMjRkQiApO1xuICAgICAgICBncmFwaC5scDI0ZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVMUEZpbHRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTFBGaWx0ZXIoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IExQRmlsdGVyOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBOb3RjaEZpbHRlciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSA9IHRoaXMuaW8uY3JlYXRlQ3Jvc3NmYWRlciggMiwgMCApO1xuICAgICAgICBncmFwaC5scDEyZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gICAgICAgIGdyYXBoLmxwMjRkQiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcblxuICAgICAgICBncmFwaC5scDEyZEIudHlwZSA9ICdub3RjaCc7XG4gICAgICAgIGdyYXBoLmxwMjRkQi50eXBlID0gJ25vdGNoJztcbiAgICAgICAgZ3JhcGgubHAxMmRCLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDEyZEIuUS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5RLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnNsb3BlID0gZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbnRyb2xzLmluZGV4O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmxwMTJkQi5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgubHAyNGRCLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGgubHAxMmRCLlEgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmxwMjRkQi5RICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5scDEyZEIgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5scDEyZEIuY29ubmVjdCggZ3JhcGgubHAyNGRCICk7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5vdGNoRmlsdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBOb3RjaEZpbHRlciggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTm90Y2hGaWx0ZXI7IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuXG5jbGFzcyBPc2NpbGxhdG9yR2VuZXJhdG9yIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlZm9ybSApIHtcbiAgICAgICAgdGhpcy5fc2V0SU8oIGlvICk7XG5cbiAgICAgICAgdGhpcy5mcmVxdWVuY3kgPSBmcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuZGV0dW5lID0gZGV0dW5lO1xuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgICAgIHRoaXMuZ2xpZGVUaW1lID0gZ2xpZGVUaW1lO1xuICAgICAgICB0aGlzLndhdmUgPSB3YXZlZm9ybSB8fCAnc2luZSc7XG4gICAgICAgIHRoaXMucmVzZXRUaW1lc3RhbXAgPSAwLjA7XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSB0aGlzLmNvbnRleHQuY3JlYXRlT3NjaWxsYXRvcigpLFxuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGggPSB0aGlzLl9tYWtlVmVsb2NpdHlHcmFwaCggdmVsb2NpdHkgKTtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gWyB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpIF07XG4gICAgICAgIHRoaXMucmVzZXQoIHRoaXMuZnJlcXVlbmN5LCB0aGlzLmRldHVuZSwgdGhpcy52ZWxvY2l0eSwgdGhpcy5nbGlkZVRpbWUsIHRoaXMud2F2ZSApO1xuXG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLmNvbm5lY3QoIHRoaXMudmVsb2NpdHlHcmFwaCApO1xuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGguY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBfbWFrZVZlbG9jaXR5R3JhcGgoKSB7XG4gICAgICAgIHZhciBnYWluID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgcmV0dXJuIGdhaW47XG4gICAgfVxuXG4gICAgX3Jlc2V0VmVsb2NpdHlHcmFwaCggdmVsb2NpdHkgKSB7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaC5nYWluLnZhbHVlID0gdmVsb2NpdHk7XG4gICAgfVxuXG4gICAgX2NsZWFuVXBWZWxvY2l0eUdyYXBoKCkge1xuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGguZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaCA9IG51bGw7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdID0gbnVsbDtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gbnVsbDtcbiAgICB9XG5cbiAgICBsZXJwKCBzdGFydCwgZW5kLCBkZWx0YSApIHtcbiAgICAgICAgcmV0dXJuIHN0YXJ0ICsgKCAoIGVuZCAtIHN0YXJ0ICkgKiBkZWx0YSApO1xuICAgIH1cblxuICAgIHJlc2V0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZSApIHtcbiAgICAgICAgdmFyIG5vdyA9IHRoaXMuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICBmcmVxdWVuY3kgPSB0eXBlb2YgZnJlcXVlbmN5ID09PSAnbnVtYmVyJyA/IGZyZXF1ZW5jeSA6IHRoaXMuZnJlcXVlbmN5O1xuICAgICAgICBkZXR1bmUgPSB0eXBlb2YgZGV0dW5lID09PSAnbnVtYmVyJyA/IGRldHVuZSA6IHRoaXMuZGV0dW5lO1xuICAgICAgICB2ZWxvY2l0eSA9IHR5cGVvZiB2ZWxvY2l0eSA9PT0gJ251bWJlcicgPyB2ZWxvY2l0eSA6IHRoaXMudmVsb2NpdHk7XG4gICAgICAgIHdhdmUgPSB0eXBlb2Ygd2F2ZSA9PT0gJ251bWJlcicgPyB3YXZlIDogdGhpcy53YXZlO1xuXG4gICAgICAgIHZhciBnbGlkZVRpbWUgPSB0eXBlb2YgZ2xpZGVUaW1lID09PSAnbnVtYmVyJyA/IGdsaWRlVGltZSA6IDA7XG5cbiAgICAgICAgdGhpcy5fcmVzZXRWZWxvY2l0eUdyYXBoKCB2ZWxvY2l0eSApO1xuXG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIG5vdyApO1xuICAgICAgICB0aGlzLmdlbmVyYXRvci5kZXR1bmUuY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCBub3cgKTtcblxuICAgICAgICAvLyBub3cgKz0gMC4xXG5cbiAgICAgICAgLy8gaWYgKCB0aGlzLmdsaWRlVGltZSAhPT0gMC4wICkge1xuICAgICAgICAvLyAgICAgdmFyIHN0YXJ0RnJlcSA9IHRoaXMuZnJlcXVlbmN5LFxuICAgICAgICAvLyAgICAgICAgIGVuZEZyZXEgPSBmcmVxdWVuY3ksXG4gICAgICAgIC8vICAgICAgICAgZnJlcURpZmYgPSBlbmRGcmVxIC0gc3RhcnRGcmVxLFxuICAgICAgICAvLyAgICAgICAgIHN0YXJ0VGltZSA9IHRoaXMucmVzZXRUaW1lc3RhbXAsXG4gICAgICAgIC8vICAgICAgICAgZW5kVGltZSA9IHRoaXMucmVzZXRUaW1lc3RhbXAgKyB0aGlzLmdsaWRlVGltZSxcbiAgICAgICAgLy8gICAgICAgICBjdXJyZW50VGltZSA9IG5vdyAtIHN0YXJ0VGltZSxcbiAgICAgICAgLy8gICAgICAgICBsZXJwUG9zID0gY3VycmVudFRpbWUgLyB0aGlzLmdsaWRlVGltZSxcbiAgICAgICAgLy8gICAgICAgICBjdXJyZW50RnJlcSA9IHRoaXMubGVycCggdGhpcy5mcmVxdWVuY3ksIGZyZXF1ZW5jeSwgbGVycFBvcyApO1xuXG4gICAgICAgIC8vICAgICBpZiAoIGN1cnJlbnRUaW1lIDwgZ2xpZGVUaW1lICkge1xuICAgICAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKCAnY3V0b2ZmJywgc3RhcnRGcmVxLCBjdXJyZW50RnJlcSApO1xuICAgICAgICAvLyAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZSggY3VycmVudEZyZXEsIG5vdyApO1xuICAgICAgICAvLyAgICAgfVxuXG5cbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKCBzdGFydFRpbWUsIGVuZFRpbWUsIG5vdywgY3VycmVudFRpbWUgKTtcbiAgICAgICAgLy8gfVxuXG5cbiAgICAgICAgLy8gbm93ICs9IDAuNTtcblxuICAgICAgICBpZiAoIGdsaWRlVGltZSAhPT0gMCApIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggZnJlcXVlbmN5LCBub3cgKyBnbGlkZVRpbWUgKTtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmRldHVuZS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggZGV0dW5lLCBub3cgKyBnbGlkZVRpbWUgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZSggZnJlcXVlbmN5LCBub3cgKTtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmRldHVuZS5zZXRWYWx1ZUF0VGltZSggZGV0dW5lLCBub3cgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggdHlwZW9mIHdhdmUgPT09ICdzdHJpbmcnICkge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IudHlwZSA9IHdhdmU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRvci50eXBlID0gdGhpcy53YXZlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXNldFRpbWVzdGFtcCA9IG5vdztcbiAgICAgICAgdGhpcy5nbGlkZVRpbWUgPSBnbGlkZVRpbWU7XG4gICAgICAgIHRoaXMuZnJlcXVlbmN5ID0gZnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmRldHVuZSA9IGRldHVuZTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgICAgICB0aGlzLndhdmUgPSB3YXZlO1xuICAgIH1cblxuICAgIHN0YXJ0KCBkZWxheSApIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3Iuc3RhcnQoIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgc3RvcCggZGVsYXkgKSB7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLnN0b3AoIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3IuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fY2xlYW5VcFZlbG9jaXR5R3JhcGgoKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIE9zY2lsbGF0b3JHZW5lcmF0b3IucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU9zY2lsbGF0b3JHZW5lcmF0b3IgPSBmdW5jdGlvbiggZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmUgKSB7XG4gICAgcmV0dXJuIG5ldyBPc2NpbGxhdG9yR2VuZXJhdG9yKCB0aGlzLCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBUT0RPOlxuLy8gIC0gVHVybiBhcmd1bWVudHMgaW50byBjb250cm9sbGFibGUgcGFyYW1ldGVycztcbmNsYXNzIENvdW50ZXIgZXh0ZW5kcyBOb2RlIHtcblxuICAgIGNvbnN0cnVjdG9yKCBpbywgaW5jcmVtZW50LCBsaW1pdCwgc3RlcFRpbWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuc3RlcFRpbWUgPSBzdGVwVGltZSB8fCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGU7XG5cbiAgICAgICAgdGhpcy5jb25zdGFudCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGluY3JlbWVudCApO1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIHRoaXMuZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSB0aGlzLnN0ZXBUaW1lO1xuXG4gICAgICAgIHRoaXMuZmVlZGJhY2sgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcblxuICAgICAgICB0aGlzLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLmZlZWRiYWNrICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suY29ubmVjdCggdGhpcy5kZWxheSApO1xuXG4gICAgICAgIHRoaXMubGVzc1RoYW4gPSB0aGlzLmlvLmNyZWF0ZUxlc3NUaGFuKCBsaW1pdCApO1xuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMubGVzc1RoYW4gKTtcbiAgICAgICAgLy8gdGhpcy5sZXNzVGhhbi5jb25uZWN0KCB0aGlzLmZlZWRiYWNrLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb25zdGFudC5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMubGVzc1RoYW4uY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgIH1cblxuICAgIHJlc2V0KCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5zdG9wKCk7XG5cbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLnN0YXJ0KCk7XG4gICAgICAgIH0sIDE2ICk7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGlmKCB0aGlzLnJ1bm5pbmcgPT09IGZhbHNlICkge1xuICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gdGhpcy5zdGVwVGltZTtcbiAgICAgICAgICAgIHRoaXMubGVzc1RoYW4uY29ubmVjdCggdGhpcy5mZWVkYmFjay5nYWluICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdG9wKCkge1xuICAgICAgICBpZiggdGhpcy5ydW5uaW5nID09PSB0cnVlICkge1xuICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmxlc3NUaGFuLmRpc2Nvbm5lY3QoIHRoaXMuZmVlZGJhY2suZ2FpbiApO1xuICAgICAgICAgICAgdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvdW50ZXIgPSBmdW5jdGlvbiggaW5jcmVtZW50LCBsaW1pdCwgc3RlcFRpbWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDb3VudGVyKCB0aGlzLCBpbmNyZW1lbnQsIGxpbWl0LCBzdGVwVGltZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBDcm9zc2ZhZGVyIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1DYXNlcyA9IDIsIHN0YXJ0aW5nQ2FzZSA9IDAgKSB7XG5cbiAgICAgICAgLy8gRW5zdXJlIHN0YXJ0aW5nQ2FzZSBpcyBuZXZlciA8IDBcbiAgICAgICAgLy8gYW5kIG51bWJlciBvZiBpbnB1dHMgaXMgYWx3YXlzID49IDIgKG5vIHBvaW50XG4gICAgICAgIC8vIHgtZmFkaW5nIGJldHdlZW4gbGVzcyB0aGFuIHR3byBpbnB1dHMhKVxuICAgICAgICBzdGFydGluZ0Nhc2UgPSBNYXRoLmFicyggc3RhcnRpbmdDYXNlICk7XG4gICAgICAgIG51bUNhc2VzID0gTWF0aC5tYXgoIG51bUNhc2VzLCAyICk7XG5cbiAgICAgICAgc3VwZXIoIGlvLCBudW1DYXNlcywgMSApO1xuXG4gICAgICAgIHRoaXMuY2xhbXBzID0gW107XG4gICAgICAgIHRoaXMuc3VidHJhY3RzID0gW107XG4gICAgICAgIHRoaXMueGZhZGVycyA9IFtdO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgbnVtQ2FzZXMgLSAxOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLnhmYWRlcnNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlRHJ5V2V0Tm9kZSgpO1xuICAgICAgICAgICAgdGhpcy5zdWJ0cmFjdHNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoIGkpO1xuICAgICAgICAgICAgdGhpcy5jbGFtcHNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAsIDEgKTtcblxuICAgICAgICAgICAgaWYoIGkgPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS5kcnkgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0c1sgaSArIDEgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS53ZXQgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMueGZhZGVyc1sgaSAtIDEgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS5kcnkgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0c1sgaSArIDEgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS53ZXQgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5pbmRleC5jb25uZWN0KCB0aGlzLnN1YnRyYWN0c1sgaSBdICk7XG4gICAgICAgICAgICB0aGlzLnN1YnRyYWN0c1sgaSBdLmNvbm5lY3QoIHRoaXMuY2xhbXBzWyBpIF0gKTtcbiAgICAgICAgICAgIHRoaXMuY2xhbXBzWyBpIF0uY29ubmVjdCggdGhpcy54ZmFkZXJzWyBpIF0uY29udHJvbHMuZHJ5V2V0ICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnhmYWRlcnNbIHRoaXMueGZhZGVycy5sZW5ndGggLSAxIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDcm9zc2ZhZGVyID0gZnVuY3Rpb24oIG51bUNhc2VzLCBzdGFydGluZ0Nhc2UgKSB7XG4gICAgcmV0dXJuIG5ldyBDcm9zc2ZhZGVyKCB0aGlzLCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDcm9zc2ZhZGVyOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5pbXBvcnQgY29ubmVjdGlvbnMgZnJvbSBcIi4uL21peGlucy9jb25uZWN0aW9ucy5lczZcIjtcbmltcG9ydCBjbGVhbmVycyBmcm9tIFwiLi4vbWl4aW5zL2NsZWFuZXJzLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vLyBUaGlzIGZ1bmN0aW9uIGNyZWF0ZXMgYSBncmFwaCB0aGF0IGFsbG93cyBtb3JwaGluZ1xuLy8gYmV0d2VlbiB0d28gZ2FpbiBub2Rlcy5cbi8vXG4vLyBJdCBsb29rcyBhIGxpdHRsZSBiaXQgbGlrZSB0aGlzOlxuLy9cbi8vICAgICAgICAgICAgICAgICBkcnkgLT4gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tPiB8XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdlxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgdiAgR2FpbigwLTEpICAgIC0+ICAgICBHYWluKC0xKSAgICAgLT4gICAgIG91dHB1dFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGZhZGVyKSAgICAgICAgIChpbnZlcnQgcGhhc2UpICAgICAgICAoc3VtbWluZylcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgIF5cbi8vICAgIHdldCAtPiAgIEdhaW4oLTEpICAgLT4gLXxcbi8vICAgICAgICAgIChpbnZlcnQgcGhhc2UpXG4vL1xuLy8gV2hlbiBhZGp1c3RpbmcgdGhlIGZhZGVyJ3MgZ2FpbiB2YWx1ZSBpbiB0aGlzIGdyYXBoLFxuLy8gaW5wdXQxJ3MgZ2FpbiBsZXZlbCB3aWxsIGNoYW5nZSBmcm9tIDAgdG8gMSxcbi8vIHdoaWxzdCBpbnB1dDIncyBnYWluIGxldmVsIHdpbGwgY2hhbmdlIGZyb20gMSB0byAwLlxuY2xhc3MgRHJ5V2V0Tm9kZSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAyLCAxICk7XG5cbiAgICAgICAgdGhpcy5kcnkgPSB0aGlzLmlucHV0c1sgMCBdO1xuICAgICAgICB0aGlzLndldCA9IHRoaXMuaW5wdXRzWyAxIF07XG5cbiAgICAgICAgLy8gSW52ZXJ0IHdldCBzaWduYWwncyBwaGFzZVxuICAgICAgICB0aGlzLndldElucHV0SW52ZXJ0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy53ZXRJbnB1dEludmVydC5nYWluLnZhbHVlID0gLTE7XG4gICAgICAgIHRoaXMud2V0LmNvbm5lY3QoIHRoaXMud2V0SW5wdXRJbnZlcnQgKTtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGZhZGVyIG5vZGVcbiAgICAgICAgdGhpcy5mYWRlciA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZmFkZXIuZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb250cm9sIG5vZGUuIEl0IHNldHMgdGhlIGZhZGVyJ3MgdmFsdWUuXG4gICAgICAgIHRoaXMuZHJ5V2V0Q29udHJvbCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5kcnlXZXRDb250cm9sLmNvbm5lY3QoIHRoaXMuZmFkZXIuZ2FpbiApO1xuXG4gICAgICAgIC8vIEludmVydCB0aGUgZmFkZXIgbm9kZSdzIHBoYXNlXG4gICAgICAgIHRoaXMuZmFkZXJJbnZlcnQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmZhZGVySW52ZXJ0LmdhaW4udmFsdWUgPSAtMTtcblxuICAgICAgICAvLyBDb25uZWN0IGZhZGVyIHRvIGZhZGVyIHBoYXNlIGludmVyc2lvbixcbiAgICAgICAgLy8gYW5kIGZhZGVyIHBoYXNlIGludmVyc2lvbiB0byBvdXRwdXQuXG4gICAgICAgIHRoaXMud2V0SW5wdXRJbnZlcnQuY29ubmVjdCggdGhpcy5mYWRlciApO1xuICAgICAgICB0aGlzLmZhZGVyLmNvbm5lY3QoIHRoaXMuZmFkZXJJbnZlcnQgKTtcbiAgICAgICAgdGhpcy5mYWRlckludmVydC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgZHJ5IGlucHV0IHRvIGJvdGggdGhlIG91dHB1dCBhbmQgdGhlIGZhZGVyIG5vZGVcbiAgICAgICAgdGhpcy5kcnkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5kcnkuY29ubmVjdCggdGhpcy5mYWRlciApO1xuXG4gICAgICAgIC8vIEFkZCBhICdkcnlXZXQnIHByb3BlcnR5IHRvIHRoZSBjb250cm9scyBvYmplY3QuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZHJ5V2V0ID0gdGhpcy5kcnlXZXRDb250cm9sO1xuICAgIH1cblxufVxuXG5cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEcnlXZXROb2RlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBEcnlXZXROb2RlKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBEcnlXZXROb2RlO1xuIiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIEVRU2hlbGYgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGhpZ2hGcmVxdWVuY3kgPSAyNTAwLCBsb3dGcmVxdWVuY3kgPSAzNTAsIGhpZ2hCb29zdCA9IC02LCBsb3dCb29zdCA9IDAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuaGlnaEZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hGcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5sb3dGcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dGcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5oaWdoQm9vc3QgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoQm9vc3QgKTtcbiAgICAgICAgdGhpcy5sb3dCb29zdCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd0Jvb3N0ICk7XG5cbiAgICAgICAgdGhpcy5sb3dTaGVsZiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgICAgICAgdGhpcy5sb3dTaGVsZi50eXBlID0gJ2xvd3NoZWxmJztcbiAgICAgICAgdGhpcy5sb3dTaGVsZi5mcmVxdWVuY3kudmFsdWUgPSBsb3dGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMubG93U2hlbGYuZ2Fpbi52YWx1ZSA9IGxvd0Jvb3N0O1xuXG4gICAgICAgIHRoaXMuaGlnaFNoZWxmID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICB0aGlzLmhpZ2hTaGVsZi50eXBlID0gJ2hpZ2hzaGVsZic7XG4gICAgICAgIHRoaXMuaGlnaFNoZWxmLmZyZXF1ZW5jeS52YWx1ZSA9IGhpZ2hGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuaGlnaFNoZWxmLmdhaW4udmFsdWUgPSBoaWdoQm9vc3Q7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmxvd1NoZWxmICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5oaWdoU2hlbGYgKTtcbiAgICAgICAgdGhpcy5sb3dTaGVsZi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmhpZ2hTaGVsZi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIFN0b3JlIGNvbnRyb2xsYWJsZSBwYXJhbXMuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRPRE86XG4gICAgICAgIC8vICAtIFNob3VsZCB0aGVzZSBiZSByZWZlcmVuY2VzIHRvIHBhcmFtLmNvbnRyb2w/IFRoaXNcbiAgICAgICAgLy8gICAgbWlnaHQgYWxsb3cgZGVmYXVsdHMgdG8gYmUgc2V0IHdoaWxzdCBhbHNvIGFsbG93aW5nXG4gICAgICAgIC8vICAgIGF1ZGlvIHNpZ25hbCBjb250cm9sLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hGcmVxdWVuY3kgPSB0aGlzLmhpZ2hGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93RnJlcXVlbmN5ID0gdGhpcy5sb3dGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEJvb3N0ID0gdGhpcy5oaWdoQm9vc3Q7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93Qm9vc3QgPSB0aGlzLmxvd0Jvb3N0O1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVFUVNoZWxmID0gZnVuY3Rpb24oIGhpZ2hGcmVxdWVuY3ksIGxvd0ZyZXF1ZW5jeSwgaGlnaEJvb3N0LCBsb3dCb29zdCApIHtcbiAgICByZXR1cm4gbmV3IEVRU2hlbGYoIHRoaXMsIGhpZ2hGcmVxdWVuY3ksIGxvd0ZyZXF1ZW5jeSwgaGlnaEJvb3N0LCBsb3dCb29zdCApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRVFTaGVsZjsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgUGhhc2VPZmZzZXQgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMucmVjaXByb2NhbCA9IHRoaXMuaW8uY3JlYXRlUmVjaXByb2NhbCggdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKiAwLjUgKTtcbiAgICAgICAgdGhpcy5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5waGFzZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5oYWxmUGhhc2UgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAwLjUgKTtcblxuICAgICAgICB0aGlzLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5mcmVxdWVuY3kuY29ubmVjdCggdGhpcy5yZWNpcHJvY2FsICk7XG4gICAgICAgIHRoaXMucmVjaXByb2NhbC5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMucGhhc2UuY29ubmVjdCggdGhpcy5oYWxmUGhhc2UgKTtcbiAgICAgICAgdGhpcy5oYWxmUGhhc2UuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMSApO1xuICAgICAgICB0aGlzLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMuZGVsYXkuZGVsYXlUaW1lICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSAwLjU7XG5cbiAgICAgICAgLy8gU3RvcmUgY29udHJvbGxhYmxlIHBhcmFtcy5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5jb250cm9scy5waGFzZSA9IHRoaXMucGhhc2U7XG4gICAgfVxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBoYXNlT2Zmc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQaGFzZU9mZnNldCggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgUGhhc2VPZmZzZXQ7IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcbi8vIGltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBtYXRoIGZyb20gXCIuLi9taXhpbnMvbWF0aC5lczZcIjtcbi8vIGltcG9ydCBOb3RlIGZyb20gXCIuLi9ub3RlL05vdGUuZXM2XCI7XG4vLyBpbXBvcnQgQ2hvcmQgZnJvbSBcIi4uL25vdGUvQ2hvcmQuZXM2XCI7XG5cbi8vICBQbGF5ZXJcbi8vICA9PT09PT1cbi8vICBUYWtlcyBjYXJlIG9mIHJlcXVlc3RpbmcgR2VuZXJhdG9yTm9kZXMgYmUgY3JlYXRlZC5cbi8vXG4vLyAgSGFzOlxuLy8gICAgICAtIFBvbHlwaG9ueSAocGFyYW0pXG4vLyAgICAgIC0gVW5pc29uIChwYXJhbSlcbi8vICAgICAgLSBVbmlzb24gZGV0dW5lIChwYXJhbSlcbi8vICAgICAgLSBVbmlzb24gcGhhc2UgKHBhcmFtKVxuLy8gICAgICAtIEdsaWRlIG1vZGVcbi8vICAgICAgLSBHbGlkZSB0aW1lXG4vLyAgICAgIC0gVmVsb2NpdHkgc2Vuc2l0aXZpdHkgKHBhcmFtKVxuLy8gICAgICAtIEdsb2JhbCB0dW5pbmcgKHBhcmFtKVxuLy9cbi8vICBNZXRob2RzOlxuLy8gICAgICAtIHN0YXJ0KCBmcmVxL25vdGUsIHZlbCwgZGVsYXkgKVxuLy8gICAgICAtIHN0b3AoIGZyZXEvbm90ZSwgdmVsLCBkZWxheSApXG4vL1xuLy8gIFByb3BlcnRpZXM6XG4vLyAgICAgIC0gcG9seXBob255IChudW1iZXIsID4xKVxuLy8gICAgICAtIHVuaXNvbiAobnVtYmVyLCA+MSlcbi8vICAgICAgLSB1bmlzb25EZXR1bmUgKG51bWJlciwgY2VudHMpXG4vLyAgICAgIC0gdW5pc29uUGhhc2UgKG51bWJlciwgMC0xKVxuLy8gICAgICAtIGdsaWRlTW9kZSAoc3RyaW5nKVxuLy8gICAgICAtIGdsaWRlVGltZSAobXMsIG51bWJlcilcbi8vICAgICAgLSB2ZWxvY2l0eVNlbnNpdGl2aXR5ICgwLTEsIG51bWJlcilcbi8vICAgICAgLSB0dW5pbmcgKC02NCwgKzY0LCBzZW1pdG9uZXMpXG4vL1xuY2xhc3MgR2VuZXJhdG9yUGxheWVyIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBvcHRpb25zICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICBpZiAoIG9wdGlvbnMuZ2VuZXJhdG9yID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdHZW5lcmF0b3JQbGF5ZXIgcmVxdWlyZXMgYSBgZ2VuZXJhdG9yYCBvcHRpb24gdG8gYmUgZ2l2ZW4uJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSBvcHRpb25zLmdlbmVyYXRvcjtcblxuICAgICAgICB0aGlzLnBvbHlwaG9ueSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIG9wdGlvbnMucG9seXBob255IHx8IDEgKTtcblxuICAgICAgICB0aGlzLnVuaXNvbiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIG9wdGlvbnMudW5pc29uIHx8IDEgKTtcbiAgICAgICAgdGhpcy51bmlzb25EZXR1bmUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy51bmlzb25EZXR1bmUgPT09ICdudW1iZXInID8gb3B0aW9ucy51bmlzb25EZXR1bmUgOiAwICk7XG4gICAgICAgIHRoaXMudW5pc29uUGhhc2UgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy51bmlzb25QaGFzZSA9PT0gJ251bWJlcicgPyBvcHRpb25zLnVuaXNvblBoYXNlIDogMCApO1xuICAgICAgICB0aGlzLnVuaXNvbk1vZGUgPSBvcHRpb25zLnVuaXNvbk1vZGUgfHwgJ2NlbnRlcmVkJztcblxuICAgICAgICB0aGlzLmdsaWRlTW9kZSA9IG9wdGlvbnMuZ2xpZGVNb2RlIHx8ICdlcXVhbCc7XG4gICAgICAgIHRoaXMuZ2xpZGVUaW1lID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMuZ2xpZGVUaW1lID09PSAnbnVtYmVyJyA/IG9wdGlvbnMuZ2xpZGVUaW1lIDogMCApO1xuXG4gICAgICAgIHRoaXMudmVsb2NpdHlTZW5zaXRpdml0eSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHR5cGVvZiBvcHRpb25zLnZlbG9jaXR5U2Vuc2l0aXZpdHkgPT09ICdudW1iZXInID8gb3B0aW9ucy52ZWxvY2l0eVNlbnNpdGl2aXR5IDogMCApO1xuXG4gICAgICAgIHRoaXMudHVuaW5nID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMudHVuaW5nID09PSAnbnVtYmVyJyA/IG9wdGlvbnMudHVuaW5nIDogMCApO1xuXG4gICAgICAgIHRoaXMud2F2ZWZvcm0gPSBvcHRpb25zLndhdmVmb3JtIHx8ICdzaW5lJztcblxuICAgICAgICB0aGlzLmVudmVsb3BlID0gb3B0aW9ucy5lbnZlbG9wZSB8fCB0aGlzLmlvLmNyZWF0ZUFEU1JFbnZlbG9wZSgpO1xuXG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0cyA9IHt9O1xuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0ID0gW107XG4gICAgICAgIHRoaXMudGltZXJzID0gW107XG4gICAgfVxuXG5cbiAgICBfY3JlYXRlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZWZvcm0gKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRvci5jYWxsKCB0aGlzLmlvLCBmcmVxdWVuY3ksIGRldHVuZSArIHRoaXMudHVuaW5nLnZhbHVlICogMTAwLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlZm9ybSApO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogQ2FsY3VsYXRlcyB0aGUgYW1vdW50IG9mIGRldHVuZSAoY2VudHMpIHRvIGFwcGx5IHRvIGEgZ2VuZXJhdG9yIG5vZGVcbiAgICAgKiBnaXZlbiBhbiBpbmRleCBiZXR3ZWVuIDAgYW5kIHRoaXMudW5pc29uLnZhbHVlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHVuaXNvbkluZGV4IFVuaXNvbiBpbmRleC5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICAgICAgICAgIERldHVuZSB2YWx1ZSwgaW4gY2VudHMuXG4gICAgICovXG4gICAgX2NhbGN1bGF0ZURldHVuZSggdW5pc29uSW5kZXggKSB7XG4gICAgICAgIHZhciBkZXR1bmUgPSAwLjAsXG4gICAgICAgICAgICB1bmlzb25EZXR1bmUgPSB0aGlzLnVuaXNvbkRldHVuZS52YWx1ZTtcblxuICAgICAgICBpZiAoIHRoaXMudW5pc29uTW9kZSA9PT0gJ2NlbnRlcmVkJyApIHtcbiAgICAgICAgICAgIHZhciBpbmNyID0gdW5pc29uRGV0dW5lO1xuXG4gICAgICAgICAgICBkZXR1bmUgPSBpbmNyICogdW5pc29uSW5kZXg7XG4gICAgICAgICAgICBkZXR1bmUgLT0gaW5jciAqICggdGhpcy51bmlzb24udmFsdWUgKiAwLjUgKTtcbiAgICAgICAgICAgIGRldHVuZSArPSBpbmNyICogMC41O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIG11bHRpcGxpZXI7XG5cbiAgICAgICAgICAgIC8vIExlYXZlIHRoZSBmaXJzdCBub3RlIGluIHRoZSB1bmlzb25cbiAgICAgICAgICAgIC8vIGFsb25lLCBzbyBpdCdzIGRldHVuZSB2YWx1ZSBpcyB0aGUgcm9vdFxuICAgICAgICAgICAgLy8gbm90ZS5cbiAgICAgICAgICAgIGlmICggdW5pc29uSW5kZXggPiAwICkge1xuICAgICAgICAgICAgICAgIC8vIEhvcCBkb3duIG5lZ2F0aXZlIGhhbGYgdGhlIHVuaXNvbkluZGV4XG4gICAgICAgICAgICAgICAgaWYgKCB1bmlzb25JbmRleCAlIDIgPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIG11bHRpcGxpZXIgPSAtdW5pc29uSW5kZXggKiAwLjU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBIb3AgdXAgbiBjZW50c1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHVuaXNvbkluZGV4ID4gMSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXNvbkluZGV4ID0gdGhpcy5NYXRoLnJvdW5kVG9NdWx0aXBsZSggdW5pc29uSW5kZXgsIDIgKSAtIDI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBtdWx0aXBsaWVyID0gdW5pc29uSW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSB0aGUgbXVsdGlwbGllciwgY2FsY3VsYXRlIHRoZSBkZXR1bmUgdmFsdWVcbiAgICAgICAgICAgICAgICAvLyBmb3IgdGhlIGdpdmVuIHVuaXNvbkluZGV4LlxuICAgICAgICAgICAgICAgIGRldHVuZSA9IHVuaXNvbkRldHVuZSAqIG11bHRpcGxpZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGV0dW5lO1xuICAgIH1cblxuICAgIF9jYWxjdWxhdGVHbGlkZVRpbWUoIG9sZEZyZXEsIG5ld0ZyZXEgKSB7XG4gICAgICAgIHZhciBtb2RlID0gdGhpcy5nbGlkZU1vZGUsXG4gICAgICAgICAgICB0aW1lID0gdGhpcy5nbGlkZVRpbWUudmFsdWUsXG4gICAgICAgICAgICBnbGlkZVRpbWUsXG4gICAgICAgICAgICBmcmVxRGlmZmVyZW5jZTtcblxuICAgICAgICBpZiAoIHRpbWUgPT09IDAuMCApIHtcbiAgICAgICAgICAgIGdsaWRlVGltZSA9IDAuMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggbW9kZSA9PT0gJ2VxdWFsJyApIHtcbiAgICAgICAgICAgIGdsaWRlVGltZSA9IHRpbWUgKiAwLjAwMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZyZXFEaWZmZXJlbmNlID0gTWF0aC5hYnMoIG9sZEZyZXEgLSBuZXdGcmVxICk7XG4gICAgICAgICAgICBmcmVxRGlmZmVyZW5jZSA9IHRoaXMuTWF0aC5jbGFtcCggZnJlcURpZmZlcmVuY2UsIDAsIDUwMCApO1xuICAgICAgICAgICAgZ2xpZGVUaW1lID0gdGhpcy5NYXRoLnNjYWxlTnVtYmVyRXhwKFxuICAgICAgICAgICAgICAgIGZyZXFEaWZmZXJlbmNlLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgNTAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgdGltZVxuICAgICAgICAgICAgKSAqIDAuMDAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdsaWRlVGltZTtcbiAgICB9XG5cblxuICAgIF9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBnZW5lcmF0b3JPYmplY3QgKSB7XG4gICAgICAgIHZhciBvYmplY3RzID0gdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzO1xuXG4gICAgICAgIG9iamVjdHNbIGZyZXF1ZW5jeSBdID0gb2JqZWN0c1sgZnJlcXVlbmN5IF0gfHwgW107XG4gICAgICAgIG9iamVjdHNbIGZyZXF1ZW5jeSBdLnVuc2hpZnQoIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0LnVuc2hpZnQoIGdlbmVyYXRvck9iamVjdCApO1xuICAgIH1cblxuICAgIF9mZXRjaEdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5ICkge1xuICAgICAgICB2YXIgb2JqZWN0cyA9IHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c1sgZnJlcXVlbmN5IF0sXG4gICAgICAgICAgICBpbmRleCA9IDA7XG5cbiAgICAgICAgaWYgKCAhb2JqZWN0cyB8fCBvYmplY3RzLmxlbmd0aCA9PT0gMCApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5wb3AoKTtcbiAgICAgICAgcmV0dXJuIG9iamVjdHMucG9wKCk7XG4gICAgfVxuXG4gICAgX2ZldGNoR2VuZXJhdG9yT2JqZWN0VG9SZXVzZSgpIHtcbiAgICAgICAgdmFyIGdlbmVyYXRvciA9IHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQucG9wKCksXG4gICAgICAgICAgICBmcmVxdWVuY3k7XG5cbiAgICAgICAgY29uc29sZS5sb2coICdyZXVzZScsIGdlbmVyYXRvciApO1xuXG4gICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggZ2VuZXJhdG9yICkgKSB7XG4gICAgICAgICAgICBmcmVxdWVuY3kgPSBnZW5lcmF0b3JbIDAgXS5mcmVxdWVuY3k7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGdlbmVyYXRvci5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVudmVsb3BlLmZvcmNlU3RvcCggZ2VuZXJhdG9yWyBpIF0ub3V0cHV0c1sgMCBdLmdhaW4gKTtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoIGdlbmVyYXRvclsgaSBdLnRpbWVyICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmcmVxdWVuY3kgPSBnZW5lcmF0b3IuZnJlcXVlbmN5O1xuICAgICAgICAgICAgdGhpcy5lbnZlbG9wZS5mb3JjZVN0b3AoIGdlbmVyYXRvci5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KCBnZW5lcmF0b3IudGltZXIgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c1sgZnJlcXVlbmN5IF0ucG9wKCk7XG5cbiAgICAgICAgcmV0dXJuIGdlbmVyYXRvcjtcbiAgICB9XG5cblxuICAgIF9zdGFydEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApIHtcbiAgICAgICAgZ2VuZXJhdG9yT2JqZWN0Lm91dHB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmVudmVsb3BlLnN0YXJ0KCBnZW5lcmF0b3JPYmplY3Qub3V0cHV0c1sgMCBdLmdhaW4sIGRlbGF5ICk7XG4gICAgICAgIGdlbmVyYXRvck9iamVjdC5zdGFydCggZGVsYXkgKTtcbiAgICB9XG5cbiAgICBfc3RhcnRTaW5nbGUoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICkge1xuICAgICAgICB2YXIgdW5pc29uID0gdGhpcy51bmlzb24udmFsdWUsXG4gICAgICAgICAgICBkZXR1bmUgPSAwLjAsXG4gICAgICAgICAgICB1bmlzb25HZW5lcmF0b3JBcnJheSxcbiAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCxcbiAgICAgICAgICAgIGFjdGl2ZUdlbmVyYXRvckNvdW50ID0gdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5sZW5ndGgsXG4gICAgICAgICAgICBleGlzdGluZ0ZyZXF1ZW5jeSxcbiAgICAgICAgICAgIGdsaWRlVGltZSA9IDAuMDtcblxuICAgICAgICBpZiAoIGFjdGl2ZUdlbmVyYXRvckNvdW50IDwgdGhpcy5wb2x5cGhvbnkudmFsdWUgKSB7XG4gICAgICAgICAgICBpZiAoIHVuaXNvbiA9PT0gMS4wICkge1xuICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2NyZWF0ZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHRoaXMud2F2ZWZvcm0gKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdW5pc29uR2VuZXJhdG9yQXJyYXkgPSBbXTtcblxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHVuaXNvbjsgKytpICkge1xuICAgICAgICAgICAgICAgICAgICBkZXR1bmUgPSB0aGlzLl9jYWxjdWxhdGVEZXR1bmUoIGkgKTtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fY3JlYXRlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgdGhpcy53YXZlZm9ybSApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApO1xuICAgICAgICAgICAgICAgICAgICB1bmlzb25HZW5lcmF0b3JBcnJheS5wdXNoKCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCB1bmlzb25HZW5lcmF0b3JBcnJheSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoIHVuaXNvbiA9PT0gMS4wICkge1xuICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2ZldGNoR2VuZXJhdG9yT2JqZWN0VG9SZXVzZSgpO1xuICAgICAgICAgICAgICAgIGV4aXN0aW5nRnJlcXVlbmN5ID0gZ2VuZXJhdG9yT2JqZWN0LmZyZXF1ZW5jeTtcbiAgICAgICAgICAgICAgICBnbGlkZVRpbWUgPSB0aGlzLl9jYWxjdWxhdGVHbGlkZVRpbWUoIGV4aXN0aW5nRnJlcXVlbmN5LCBmcmVxdWVuY3kgKTtcblxuICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdC5yZXNldCggZnJlcXVlbmN5LCBkZXR1bmUgKyB0aGlzLnR1bmluZy52YWx1ZSAqIDEwMCwgdmVsb2NpdHksIGdsaWRlVGltZSApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fZmV0Y2hHZW5lcmF0b3JPYmplY3RUb1JldXNlKCk7XG4gICAgICAgICAgICAgICAgZXhpc3RpbmdGcmVxdWVuY3kgPSBnZW5lcmF0b3JPYmplY3RbIDAgXS5mcmVxdWVuY3k7XG4gICAgICAgICAgICAgICAgZ2xpZGVUaW1lID0gdGhpcy5fY2FsY3VsYXRlR2xpZGVUaW1lKCBleGlzdGluZ0ZyZXF1ZW5jeSwgZnJlcXVlbmN5ICk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB1bmlzb247ICsraSApIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0dW5lID0gdGhpcy5fY2FsY3VsYXRlRGV0dW5lKCBpICk7XG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdFsgaSBdLnJlc2V0KCBmcmVxdWVuY3ksIGRldHVuZSArIHRoaXMudHVuaW5nLnZhbHVlICogMTAwLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXR1cm4gdGhlIGdlbmVyYXRlZCBvYmplY3QocykgaW4gY2FzZSB0aGV5J3JlIG5lZWRlZC5cbiAgICAgICAgcmV0dXJuIHVuaXNvbkdlbmVyYXRvckFycmF5ID8gdW5pc29uR2VuZXJhdG9yQXJyYXkgOiBnZW5lcmF0b3JPYmplY3Q7XG4gICAgfVxuXG4gICAgc3RhcnQoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICkge1xuICAgICAgICB2YXIgZnJlcSA9IDAsXG4gICAgICAgICAgICB2ZWxvY2l0eVNlbnNpdGl2aXR5ID0gdGhpcy52ZWxvY2l0eVNlbnNpdGl2aXR5LnZhbHVlO1xuXG4gICAgICAgIHZlbG9jaXR5ID0gdHlwZW9mIHZlbG9jaXR5ID09PSAnbnVtYmVyJyA/IHZlbG9jaXR5IDogMTtcbiAgICAgICAgZGVsYXkgPSB0eXBlb2YgZGVsYXkgPT09ICdudW1iZXInID8gZGVsYXkgOiAwO1xuXG5cbiAgICAgICAgaWYgKCB2ZWxvY2l0eVNlbnNpdGl2aXR5ICE9PSAwICkge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSB0aGlzLk1hdGguc2NhbGVOdW1iZXIoIHZlbG9jaXR5LCAwLCAxLCAwLjUgLSB2ZWxvY2l0eVNlbnNpdGl2aXR5ICogMC41LCAwLjUgKyB2ZWxvY2l0eVNlbnNpdGl2aXR5ICogMC41IClcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gMC41O1xuICAgICAgICB9XG5cblxuICAgICAgICBpZiAoIHR5cGVvZiBmcmVxdWVuY3kgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5fc3RhcnRTaW5nbGUoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZWxzZSBpZiAoIGZyZXF1ZW5jeSBpbnN0YW5jZW9mIE5vdGUgKSB7XG4gICAgICAgIC8vICAgICBmcmVxID0gZnJlcXVlbmN5LnZhbHVlSHo7XG4gICAgICAgIC8vICAgICB0aGlzLl9zdGFydFNpbmdsZSggZnJlcSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gZWxzZSBpZiAoIGZyZXF1ZW5jeSBpbnN0YW5jZW9mIENob3JkICkge1xuICAgICAgICAvLyAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgZnJlcXVlbmN5Lm5vdGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAvLyAgICAgICAgIGZyZXEgPSBmcmVxdWVuY3kubm90ZXNbIGkgXS52YWx1ZUh6O1xuICAgICAgICAvLyAgICAgICAgIHRoaXMuX3N0YXJ0U2luZ2xlKCBmcmVxLCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG5cbiAgICBfc3RvcEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuZW52ZWxvcGUuc3RvcCggZ2VuZXJhdG9yT2JqZWN0Lm91dHB1dHNbIDAgXS5nYWluLCBkZWxheSApO1xuXG4gICAgICAgIGdlbmVyYXRvck9iamVjdC50aW1lciA9IHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gc2VsZi5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5wb3AoKTtcbiAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdC5zdG9wKCBkZWxheSApO1xuICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LmNsZWFuVXAoKTtcbiAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IG51bGw7XG4gICAgICAgIH0sIGRlbGF5ICogMTAwMCArIHRoaXMuZW52ZWxvcGUudG90YWxTdG9wVGltZSAqIDEwMDAgKyAxMDAgKTtcbiAgICB9XG5cbiAgICBfc3RvcFNpbmdsZSggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKSB7XG4gICAgICAgIHZhciBnZW5lcmF0b3JPYmplY3QgPSB0aGlzLl9mZXRjaEdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5ICk7XG5cbiAgICAgICAgaWYgKCBnZW5lcmF0b3JPYmplY3QgKSB7XG4gICAgICAgICAgICAvLyBTdG9wIGdlbmVyYXRvcnMgZm9ybWVkIHdoZW4gdW5pc29uIHdhcyA+IDEgYXQgdGltZSBvZiBzdGFydCguLi4pXG4gICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGdlbmVyYXRvck9iamVjdCApICkge1xuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gZ2VuZXJhdG9yT2JqZWN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdG9wR2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3RbIGkgXSwgZGVsYXkgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9wR2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSBudWxsO1xuICAgIH1cblxuICAgIHN0b3AoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICkge1xuICAgICAgICB2ZWxvY2l0eSA9IHR5cGVvZiB2ZWxvY2l0eSA9PT0gJ251bWJlcicgPyB2ZWxvY2l0eSA6IDA7XG4gICAgICAgIGRlbGF5ID0gdHlwZW9mIGRlbGF5ID09PSAnbnVtYmVyJyA/IGRlbGF5IDogMDtcblxuICAgICAgICBpZiAoIHR5cGVvZiBmcmVxdWVuY3kgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5fc3RvcFNpbmdsZSggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBlbHNlIGlmICggZnJlcXVlbmN5IGluc3RhbmNlb2YgTm90ZSApIHtcbiAgICAgICAgLy8gICAgIGZyZXEgPSBmcmVxdWVuY3kudmFsdWVIejtcbiAgICAgICAgLy8gICAgIHRoaXMuX3N0b3BTaW5nbGUoIGZyZXEsIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGVsc2UgaWYgKCBmcmVxdWVuY3kgaW5zdGFuY2VvZiBDaG9yZCApIHtcbiAgICAgICAgLy8gICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGZyZXF1ZW5jeS5ub3Rlcy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgLy8gICAgICAgICBmcmVxID0gZnJlcXVlbmN5Lm5vdGVzWyBpIF0udmFsdWVIejtcbiAgICAgICAgLy8gICAgICAgICB0aGlzLl9zdG9wU2luZ2xlKCBmcmVxLCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuXG4vLyBBdWRpb0lPLm1peGluU2luZ2xlKCBHZW5lcmF0b3JQbGF5ZXIucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5HZW5lcmF0b3JQbGF5ZXIucHJvdG90eXBlLk1hdGggPSBtYXRoO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVHZW5lcmF0b3JQbGF5ZXIgPSBmdW5jdGlvbiggb3B0aW9ucyApIHtcbiAgICByZXR1cm4gbmV3IEdlbmVyYXRvclBsYXllciggdGhpcywgb3B0aW9ucyApO1xufTsiLCJ3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuXG4vLyBDb3JlIGNvbXBvbmVudHMuXG5pbXBvcnQgQXVkaW9JTyBmcm9tICcuL2NvcmUvQXVkaW9JTy5lczYnO1xuaW1wb3J0IE5vZGUgZnJvbSAnLi9jb3JlL05vZGUuZXM2JztcbmltcG9ydCBQYXJhbSBmcm9tICcuL2NvcmUvUGFyYW0uZXM2JztcbmltcG9ydCAnLi9jb3JlL1dhdmVTaGFwZXIuZXM2JztcblxuXG4vLyBGWC5cbmltcG9ydCAnLi9meC9EZWxheS5lczYnO1xuaW1wb3J0ICcuL2Z4L1BpbmdQb25nRGVsYXkuZXM2JztcbmltcG9ydCAnLi9meC9TaW5lU2hhcGVyLmVzNic7XG5pbXBvcnQgJy4vZngvU3RlcmVvV2lkdGguZXM2JztcbmltcG9ydCAnLi9meC9TdGVyZW9Sb3RhdGlvbi5lczYnO1xuLy8gaW1wb3J0ICcuL2Z4L0JpdFJlZHVjdGlvbi5lczYnO1xuaW1wb3J0ICcuL2Z4L1NjaHJvZWRlckFsbFBhc3MuZXM2JztcbmltcG9ydCAnLi9meC9EQ1RyYXAuZXM2JztcblxuaW1wb3J0ICcuL2Z4L2ZpbHRlcnMvRmlsdGVyQmFuay5lczYnO1xuaW1wb3J0ICcuL2Z4L2ZpbHRlcnMvTFBGaWx0ZXIuZXM2JztcbmltcG9ydCAnLi9meC9maWx0ZXJzL0JQRmlsdGVyLmVzNic7XG5pbXBvcnQgJy4vZngvZmlsdGVycy9IUEZpbHRlci5lczYnO1xuaW1wb3J0ICcuL2Z4L2ZpbHRlcnMvTm90Y2hGaWx0ZXIuZXM2JztcbmltcG9ydCAnLi9meC9maWx0ZXJzL0FsbFBhc3NGaWx0ZXIuZXM2JztcblxuaW1wb3J0ICcuL2Z4L2VxL0N1c3RvbUVRLmVzNic7XG5cbi8vIEdlbmVyYXRvcnMgYW5kIGluc3RydW1lbnRzLlxuaW1wb3J0ICcuL2dlbmVyYXRvcnMvT3NjaWxsYXRvckdlbmVyYXRvci5lczYnO1xuaW1wb3J0ICcuL2luc3RydW1lbnRzL0dlbmVyYXRvclBsYXllci5lczYnO1xuXG4vLyBNYXRoOiBUcmlnb25vbWV0cnlcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9EZWdUb1JhZC5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L1Npbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L0Nvcy5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L1Rhbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L1JhZFRvRGVnLmVzNic7XG5cbi8vIE1hdGg6IFJlbGF0aW9uYWwtb3BlcmF0b3JzIChpbmMuIGlmL2Vsc2UpXG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9FcXVhbFRvLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9FcXVhbFRvWmVyby5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvR3JlYXRlclRoYW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuWmVyby5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvR3JlYXRlclRoYW5FcXVhbFRvLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9JZkVsc2UuZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhblplcm8uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuRXF1YWxUby5lczYnO1xuXG4vLyBNYXRoOiBMb2dpY2FsIG9wZXJhdG9yc1xuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTG9naWNhbE9wZXJhdG9yLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9BTkQuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL09SLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OT1QuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL05BTkQuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL05PUi5lczYnO1xuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvWE9SLmVzNic7XG5cbi8vIE1hdGg6IEdlbmVyYWwuXG5pbXBvcnQgJy4vbWF0aC9BYnMuZXM2JztcbmltcG9ydCAnLi9tYXRoL0FkZC5lczYnO1xuaW1wb3J0ICcuL21hdGgvQXZlcmFnZS5lczYnO1xuaW1wb3J0ICcuL21hdGgvQ2xhbXAuZXM2JztcbmltcG9ydCAnLi9tYXRoL0NvbnN0YW50LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9EaXZpZGUuZXM2JztcbmltcG9ydCAnLi9tYXRoL0Zsb29yLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9NYXguZXM2JztcbmltcG9ydCAnLi9tYXRoL01pbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvTXVsdGlwbHkuZXM2JztcbmltcG9ydCAnLi9tYXRoL05lZ2F0ZS5lczYnO1xuaW1wb3J0ICcuL21hdGgvUG93LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9SZWNpcHJvY2FsLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9Sb3VuZC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU2NhbGUuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NjYWxlRXhwLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TaWduLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TcXJ0LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TdWJ0cmFjdC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3dpdGNoLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TcXVhcmUuZXM2JztcblxuLy8gTWF0aDogU3BlY2lhbC5cbmltcG9ydCAnLi9tYXRoL0xlcnAuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NhbXBsZURlbGF5LmVzNic7XG5cbi8vIEVudmVsb3Blc1xuaW1wb3J0ICcuL2VudmVsb3Blcy9DdXN0b21FbnZlbG9wZS5lczYnO1xuaW1wb3J0ICcuL2VudmVsb3Blcy9BRFNSRW52ZWxvcGUuZXM2JztcbmltcG9ydCAnLi9lbnZlbG9wZXMvQURFbnZlbG9wZS5lczYnO1xuaW1wb3J0ICcuL2VudmVsb3Blcy9BREJEU1JFbnZlbG9wZS5lczYnO1xuXG4vLyBHZW5lcmFsIGdyYXBoc1xuaW1wb3J0ICcuL2dyYXBocy9FUVNoZWxmLmVzNic7XG5pbXBvcnQgJy4vZ3JhcGhzL0NvdW50ZXIuZXM2JztcbmltcG9ydCAnLi9ncmFwaHMvRHJ5V2V0Tm9kZS5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9QaGFzZU9mZnNldC5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9Dcm9zc2ZhZGVyLmVzNic7XG5cbi8vIE9zY2lsbGF0b3JzOiBVc2luZyBXZWJBdWRpbyBvc2NpbGxhdG9yc1xuaW1wb3J0ICcuL29zY2lsbGF0b3JzL09zY2lsbGF0b3JCYW5rLmVzNic7XG5pbXBvcnQgJy4vb3NjaWxsYXRvcnMvTm9pc2VPc2NpbGxhdG9yQmFuay5lczYnO1xuaW1wb3J0ICcuL29zY2lsbGF0b3JzL0ZNT3NjaWxsYXRvci5lczYnO1xuaW1wb3J0ICcuL29zY2lsbGF0b3JzL1NpbmVCYW5rLmVzNic7XG5cbi8vIE9zY2lsbGF0b3JzOiBCdWZmZXItYmFzZWRcbmltcG9ydCAnLi9vc2NpbGxhdG9ycy9CdWZmZXJPc2NpbGxhdG9yLmVzNic7XG5cbi8vIGltcG9ydCAnLi9ncmFwaHMvU2tldGNoLmVzNic7XG5cbndpbmRvdy5QYXJhbSA9IFBhcmFtO1xud2luZG93Lk5vZGUgPSBOb2RlOyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbnZhciBTSEFQRVJTID0ge307XG5cbmZ1bmN0aW9uIGdlbmVyYXRlU2hhcGVyQ3VydmUoIHNpemUgKSB7XG4gICAgdmFyIGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSggc2l6ZSApLFxuICAgICAgICBpID0gMCxcbiAgICAgICAgeCA9IDA7XG5cbiAgICBmb3IgKCBpOyBpIDwgc2l6ZTsgKytpICkge1xuICAgICAgICB4ID0gKCBpIC8gc2l6ZSApICogMiAtIDE7XG4gICAgICAgIGFycmF5WyBpIF0gPSBNYXRoLmFicyggeCApO1xuICAgIH1cblxuICAgIHJldHVybiBhcnJheTtcbn1cblxuY2xhc3MgQWJzIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIGFjY3VyYWN5ID0gMTAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIC8vIHZhciBnYWluQWNjdXJhY3kgPSBhY2N1cmFjeSAqIDEwMDtcbiAgICAgICAgdmFyIGdhaW5BY2N1cmFjeSA9IE1hdGgucG93KCBhY2N1cmFjeSwgMiApLFxuICAgICAgICAgICAgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCksXG4gICAgICAgICAgICBzaXplID0gMTAyNCAqIGFjY3VyYWN5O1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDEgLyBnYWluQWNjdXJhY3k7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSBnYWluQWNjdXJhY3k7XG5cbiAgICAgICAgLy8gVG8gc2F2ZSBjcmVhdGluZyBuZXcgc2hhcGVyIGN1cnZlcyAodGhhdCBjYW4gYmUgcXVpdGUgbGFyZ2UhKVxuICAgICAgICAvLyBlYWNoIHRpbWUgYW4gaW5zdGFuY2Ugb2YgQWJzIGlzIGNyZWF0ZWQsIHNoYXBlciBjdXJ2ZXNcbiAgICAgICAgLy8gYXJlIHN0b3JlZCBpbiB0aGUgU0hBUEVSUyBvYmplY3QgYWJvdmUuIFRoZSBrZXlzIHRvIHRoZVxuICAgICAgICAvLyBTSEFQRVJTIG9iamVjdCBhcmUgdGhlIGJhc2Ugd2F2ZXRhYmxlIGN1cnZlIHNpemUgKDEwMjQpXG4gICAgICAgIC8vIG11bHRpcGxpZWQgYnkgdGhlIGFjY3VyYWN5IGFyZ3VtZW50LlxuICAgICAgICBpZiggIVNIQVBFUlNbIHNpemUgXSApIHtcbiAgICAgICAgICAgIFNIQVBFUlNbIHNpemUgXSA9IGdlbmVyYXRlU2hhcGVyQ3VydmUoIHNpemUgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggU0hBUEVSU1sgc2l6ZSBdICk7XG5cblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQWJzID0gZnVuY3Rpb24oIGFjY3VyYWN5ICkge1xuICAgIHJldHVybiBuZXcgQWJzKCB0aGlzLCBhY2N1cmFjeSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIEFkZHMgdHdvIGF1ZGlvIHNpZ25hbHMgdG9nZXRoZXIuXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqXG4gKiB2YXIgYWRkID0gaW8uY3JlYXRlQWRkKCAyICk7XG4gKiBpbjEuY29ubmVjdCggYWRkICk7XG4gKlxuICogdmFyIGFkZCA9IGlvLmNyZWF0ZUFkZCgpO1xuICogaW4xLmNvbm5lY3QoIGFkZCwgMCwgMCApO1xuICogaW4yLmNvbm5lY3QoIGFkZCwgMCwgMSApO1xuICovXG5jbGFzcyBBZGQgZXh0ZW5kcyBOb2Rle1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIFN0b3JlIGNvbnRyb2xsYWJsZSBwYXJhbXMuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICBcdHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgIFx0dGhpcy5jb250cm9scy52YWx1ZS52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBZGQgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBBZGQoIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuLypcbiAgICBUaGUgYXZlcmFnZSB2YWx1ZSBvZiBhIHNpZ25hbCBpcyBjYWxjdWxhdGVkXG4gICAgYnkgcGlwaW5nIHRoZSBpbnB1dCBpbnRvIGEgcmVjdGlmaWVyIHRoZW4gaW50b1xuICAgIGEgc2VyaWVzIG9mIERlbGF5Tm9kZXMuIEVhY2ggRGVsYXlOb2RlXG4gICAgaGFzIGl0J3MgYGRlbGF5VGltZWAgY29udHJvbGxlZCBieSBlaXRoZXIgdGhlXG4gICAgYHNhbXBsZVNpemVgIGFyZ3VtZW50IG9yIHRoZSBpbmNvbWluZyB2YWx1ZSBvZlxuICAgIHRoZSBgY29udHJvbHMuc2FtcGxlU2l6ZWAgbm9kZS4gVGhlIGRlbGF5VGltZVxuICAgIGlzIHRoZXJlZm9yZSBtZWFzdXJlZCBpbiBzYW1wbGVzLlxuXG4gICAgRWFjaCBkZWxheSBpcyBjb25uZWN0ZWQgdG8gYSBHYWluTm9kZSB0aGF0IHdvcmtzXG4gICAgYXMgYSBzdW1taW5nIG5vZGUuIFRoZSBzdW1taW5nIG5vZGUncyB2YWx1ZSBpc1xuICAgIHRoZW4gZGl2aWRlZCBieSB0aGUgbnVtYmVyIG9mIGRlbGF5cyB1c2VkIGJlZm9yZVxuICAgIGJlaW5nIHNlbnQgb24gaXRzIG1lcnJ5IHdheSB0byB0aGUgb3V0cHV0LlxuXG4gICAgTm90ZTpcbiAgICBIaWdoIHZhbHVlcyBmb3IgYG51bVNhbXBsZXNgIHdpbGwgYmUgZXhwZW5zaXZlLFxuICAgIGFzIHRoYXQgbWFueSBEZWxheU5vZGVzIHdpbGwgYmUgY3JlYXRlZC4gQ29uc2lkZXJcbiAgICBpbmNyZWFzaW5nIHRoZSBgc2FtcGxlU2l6ZWAgYW5kIHVzaW5nIGEgbG93IHZhbHVlXG4gICAgZm9yIGBudW1TYW1wbGVzYC5cblxuICAgIEdyYXBoOlxuICAgID09PT09PVxuICAgIGlucHV0IC0+XG4gICAgICAgIGFicy9yZWN0aWZ5IC0+XG4gICAgICAgICAgICBgbnVtU2FtcGxlc2AgbnVtYmVyIG9mIGRlbGF5cywgaW4gc2VyaWVzIC0+XG4gICAgICAgICAgICAgICAgc3VtIC0+XG4gICAgICAgICAgICAgICAgICAgIGRpdmlkZSBieSBgbnVtU2FtcGxlc2AgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5cbiAqL1xuY2xhc3MgQXZlcmFnZSBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1TYW1wbGVzID0gMTAsIHNhbXBsZVNpemUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5udW1TYW1wbGVzID0gbnVtU2FtcGxlcztcblxuICAgICAgICAvLyBBbGwgRGVsYXlOb2RlcyB3aWxsIGJlIHN0b3JlZCBoZXJlLlxuICAgICAgICBncmFwaC5kZWxheXMgPSBbXTtcbiAgICAgICAgZ3JhcGguYWJzID0gdGhpcy5pby5jcmVhdGVBYnMoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5hYnMgKTtcbiAgICAgICAgZ3JhcGguc2FtcGxlU2l6ZSA9IHRoaXMuaW8uY3JlYXRlQ29uc3RhbnQoIDEgLyB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSApO1xuICAgICAgICBncmFwaC5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5zYW1wbGVTaXplID0gdGhpcy5pby5jcmVhdGVQYXJhbSggc2FtcGxlU2l6ZSApO1xuICAgICAgICBncmFwaC5zYW1wbGVTaXplLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuc2FtcGxlU2l6ZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIC8vIFRoaXMgaXMgYSByZWxhdGl2ZWx5IGV4cGVuc2l2ZSBjYWxjdWxhdGlvblxuICAgICAgICAvLyB3aGVuIGNvbXBhcmVkIHRvIGRvaW5nIGEgbXVjaCBzaW1wbGVyIHJlY2lwcm9jYWwgbXVsdGlwbHkuXG4gICAgICAgIC8vIHRoaXMuZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoIG51bVNhbXBsZXMsIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlICogMC41ICk7XG5cbiAgICAgICAgLy8gQXZvaWQgdGhlIG1vcmUgZXhwZW5zaXZlIGRpdmlzaW9uIGFib3ZlIGJ5XG4gICAgICAgIC8vIG11bHRpcGx5aW5nIHRoZSBzdW0gYnkgdGhlIHJlY2lwcm9jYWwgb2YgbnVtU2FtcGxlcy5cbiAgICAgICAgZ3JhcGguZGl2aWRlID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggMSAvIG51bVNhbXBsZXMgKTtcbiAgICAgICAgZ3JhcGguc3VtID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICBncmFwaC5zdW0uY29ubmVjdCggZ3JhcGguZGl2aWRlICk7XG4gICAgICAgIGdyYXBoLmRpdmlkZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG5cblxuICAgICAgICAvLyBUcmlnZ2VyIHRoZSBzZXR0ZXIgZm9yIGBudW1TYW1wbGVzYCB0aGF0IHdpbGwgY3JlYXRlXG4gICAgICAgIC8vIHRoZSBkZWxheSBzZXJpZXMuXG4gICAgICAgIHRoaXMubnVtU2FtcGxlcyA9IGdyYXBoLm51bVNhbXBsZXM7XG4gICAgfVxuXG4gICAgZ2V0IG51bVNhbXBsZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkubnVtU2FtcGxlcztcbiAgICB9XG5cbiAgICBzZXQgbnVtU2FtcGxlcyggbnVtU2FtcGxlcyApIHtcbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpLFxuICAgICAgICAgICAgZGVsYXlzID0gZ3JhcGguZGVsYXlzO1xuXG4gICAgICAgIC8vIERpc2Nvbm5lY3QgYW5kIG51bGxpZnkgYW55IGV4aXN0aW5nIGRlbGF5IG5vZGVzLlxuICAgICAgICB0aGlzLl9jbGVhblVwU2luZ2xlKCBkZWxheXMgKTtcblxuICAgICAgICBncmFwaC5udW1TYW1wbGVzID0gbnVtU2FtcGxlcztcbiAgICAgICAgZ3JhcGguZGl2aWRlLnZhbHVlID0gMSAvIG51bVNhbXBsZXM7XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDAsIG5vZGUgPSBncmFwaC5hYnM7IGkgPCBudW1TYW1wbGVzOyArK2kgKSB7XG4gICAgICAgICAgICB2YXIgZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgICAgIGRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgICAgICBncmFwaC5tdWx0aXBseS5jb25uZWN0KCBkZWxheS5kZWxheVRpbWUgKTtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdCggZGVsYXkgKTtcbiAgICAgICAgICAgIGRlbGF5LmNvbm5lY3QoIGdyYXBoLnN1bSApO1xuICAgICAgICAgICAgZ3JhcGguZGVsYXlzLnB1c2goIGRlbGF5ICk7XG4gICAgICAgICAgICBub2RlID0gZGVsYXk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQXZlcmFnZSA9IGZ1bmN0aW9uKCBudW1TYW1wbGVzLCBzYW1wbGVTaXplICkge1xuICAgIHJldHVybiBuZXcgQXZlcmFnZSggdGhpcywgbnVtU2FtcGxlcywgc2FtcGxlU2l6ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbmNsYXNzIENsYW1wIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBtaW5WYWx1ZSwgbWF4VmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApOyAvLyBpbywgMSwgMVxuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5taW4gPSB0aGlzLmlvLmNyZWF0ZU1pbiggbWF4VmFsdWUgKTtcbiAgICAgICAgZ3JhcGgubWF4ID0gdGhpcy5pby5jcmVhdGVNYXgoIG1pblZhbHVlICk7XG5cbiAgICAgICAgLy8gdGhpcy5pbnB1dHMgPSBbIGdyYXBoLm1pbiBdO1xuICAgICAgICAvLyB0aGlzLm91dHB1dHMgPSBbIGdyYXBoLm1heCBdO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm1pbiApO1xuICAgICAgICBncmFwaC5taW4uY29ubmVjdCggZ3JhcGgubWF4ICk7XG4gICAgICAgIGdyYXBoLm1heC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIFN0b3JlIGNvbnRyb2xsYWJsZSBwYXJhbXMuXG4gICAgICAgIHRoaXMuY29udHJvbHMubWluID0gZ3JhcGgubWluLmNvbnRyb2xzLnZhbHVlO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLm1heCA9IGdyYXBoLm1heC5jb250cm9scy52YWx1ZTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCBtaW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkubWF4LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbWluKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLm1heC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBtYXgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkubWluLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbWF4KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLm1pbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNsYW1wID0gZnVuY3Rpb24oIG1pblZhbHVlLCBtYXhWYWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IENsYW1wKCB0aGlzLCBtaW5WYWx1ZSwgbWF4VmFsdWUgKTtcbn07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSAnLi4vY29yZS9BdWRpb0lPLmVzNic7XG5pbXBvcnQgTm9kZSBmcm9tICcuLi9jb3JlL05vZGUuZXM2JztcblxuY2xhc3MgQ29uc3RhbnQgZXh0ZW5kcyBOb2RlIHtcbiAgICAvKipcbiAgICAgKiBBIGNvbnN0YW50LXJhdGUgYXVkaW8gc2lnbmFsXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvICAgIEluc3RhbmNlIG9mIEF1ZGlvSU9cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgVmFsdWUgb2YgdGhlIGNvbnN0YW50XG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSA9IDAuMCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgPyB2YWx1ZSA6IDA7XG4gICAgICAgIHRoaXMuaW8uY29uc3RhbnREcml2ZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudCA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IENvbnN0YW50KCB0aGlzLCB2YWx1ZSApO1xufTtcblxuXG4vLyBBIGJ1bmNoIG9mIHByZXNldCBjb25zdGFudHMuXG4oZnVuY3Rpb24oKSB7XG4gICAgdmFyIEUsXG4gICAgICAgIFBJLFxuICAgICAgICBQSTIsXG4gICAgICAgIExOMTAsXG4gICAgICAgIExOMixcbiAgICAgICAgTE9HMTBFLFxuICAgICAgICBMT0cyRSxcbiAgICAgICAgU1FSVDFfMixcbiAgICAgICAgU1FSVDI7XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudEUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBFIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguRSApO1xuICAgICAgICBFID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50UEkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBQSSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLlBJICk7XG4gICAgICAgIFBJID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50UEkyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gUEkyIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguUEkgKiAyICk7XG4gICAgICAgIFBJMiA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudExOMTAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBMTjEwIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguTE4xMCApO1xuICAgICAgICBMTjEwID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50TE4yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gTE4yIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguTE4yICk7XG4gICAgICAgIExOMiA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudExPRzEwRSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IExPRzEwRSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxPRzEwRSApO1xuICAgICAgICBMT0cxMEUgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRMT0cyRSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IExPRzJFIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguTE9HMkUgKTtcbiAgICAgICAgTE9HMkUgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRTUVJUMV8yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gU1FSVDFfMiB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLlNRUlQxXzIgKTtcbiAgICAgICAgU1FSVDFfMiA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudFNRUlQyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gU1FSVDIgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5TUVJUMiApO1xuICAgICAgICBTUVJUMiA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG59KCkpOyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogRGl2aWRlcyB0d28gbnVtYmVyc1xuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKi9cbmNsYXNzIERpdmlkZSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUsIG1heElucHV0ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cblxuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDAuMDtcblxuICAgICAgICBncmFwaC5yZWNpcHJvY2FsID0gdGhpcy5pby5jcmVhdGVSZWNpcHJvY2FsKCBtYXhJbnB1dCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLnJlY2lwcm9jYWwgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIGdyYXBoLnJlY2lwcm9jYWwuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZGl2aXNvciA9IHRoaXMuaW5wdXRzWyAxIF07XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlucHV0c1sgMSBdLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IG1heElucHV0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWNpcHJvY2FsLm1heElucHV0O1xuICAgIH1cbiAgICBzZXQgbWF4SW5wdXQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLnJlY2lwcm9jYWwubWF4SW5wdXQgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZURpdmlkZSA9IGZ1bmN0aW9uKCB2YWx1ZSwgbWF4SW5wdXQgKSB7XG4gICAgcmV0dXJuIG5ldyBEaXZpZGUoIHRoaXMsIHZhbHVlLCBtYXhJbnB1dCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbi8vIE5PVEU6XG4vLyAgT25seSBhY2NlcHRzIHZhbHVlcyA+PSAtMSAmJiA8PSAxLiBWYWx1ZXMgb3V0c2lkZVxuLy8gIHRoaXMgcmFuZ2UgYXJlIGNsYW1wZWQgdG8gdGhpcyByYW5nZS5cbmNsYXNzIEZsb29yIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5GbG9vciApO1xuXG4gICAgICAgIC8vIFRoaXMgYnJhbmNoaW5nIGlzIGJlY2F1c2UgaW5wdXR0aW5nIGAwYCB2YWx1ZXNcbiAgICAgICAgLy8gaW50byB0aGUgd2F2ZXNoYXBlciBhYm92ZSBvdXRwdXRzIC0wLjUgOyhcbiAgICAgICAgZ3JhcGguaWZFbHNlID0gdGhpcy5pby5jcmVhdGVJZkVsc2UoKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUb1plcm8gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG9aZXJvKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5lcXVhbFRvWmVybyApO1xuICAgICAgICBncmFwaC5lcXVhbFRvWmVyby5jb25uZWN0KCBncmFwaC5pZkVsc2UuaWYgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5pZkVsc2UudGhlbiApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggZ3JhcGguaWZFbHNlLmVsc2UgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5pZkVsc2UuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRmxvb3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEZsb29yKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIExlcnAgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgc3RhcnQsIGVuZCwgZGVsdGEgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMywgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5hZGQgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICBncmFwaC5zdWJ0cmFjdCA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG5cbiAgICAgICAgZ3JhcGguc3RhcnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBzdGFydCApO1xuICAgICAgICBncmFwaC5lbmQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBlbmQgKTtcbiAgICAgICAgZ3JhcGguZGVsdGEgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBkZWx0YSApO1xuXG4gICAgICAgIGdyYXBoLmVuZC5jb25uZWN0KCBncmFwaC5zdWJ0cmFjdCwgMCwgMCApO1xuICAgICAgICBncmFwaC5zdGFydC5jb25uZWN0KCBncmFwaC5zdWJ0cmFjdCwgMCwgMSApO1xuICAgICAgICBncmFwaC5zdWJ0cmFjdC5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICBncmFwaC5kZWx0YS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLnN0YXJ0LmNvbm5lY3QoIGdyYXBoLmFkZCwgMCwgMCApO1xuICAgICAgICBncmFwaC5tdWx0aXBseS5jb25uZWN0KCBncmFwaC5hZGQsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5hZGQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnN0YXJ0ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGguZW5kICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAyIF0uY29ubmVjdCggZ3JhcGguZGVsdGEgKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnN0YXJ0ID0gZ3JhcGguc3RhcnQ7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZW5kID0gZ3JhcGguZW5kO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRlbHRhID0gZ3JhcGguZGVsdGE7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgc3RhcnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkuc3RhcnQudmFsdWU7XG4gICAgfVxuICAgIHNldCBzdGFydCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5zdGFydC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBlbmQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkuZW5kLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgZW5kKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLmVuZC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBkZWx0YSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JhcGgoKS5kZWx0YS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGRlbHRhKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLmRlbHRhLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVMZXJwID0gZnVuY3Rpb24oIHN0YXJ0LCBlbmQsIGRlbHRhICkge1xuICAgIHJldHVybiBuZXcgTGVycCggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIFdoZW4gaW5wdXQgaXMgPCBgdmFsdWVgLCBvdXRwdXRzIGB2YWx1ZWAsIG90aGVyd2lzZSBvdXRwdXRzIGlucHV0LlxuICogQHBhcmFtIHtBdWRpb0lPfSBpbyAgIEF1ZGlvSU8gaW5zdGFuY2VcbiAqIEBwYXJhbSB7TnVtYmVyfSB2YWx1ZSBUaGUgbWluaW11bSB2YWx1ZSB0byB0ZXN0IGFnYWluc3QuXG4gKi9cblxuY2xhc3MgTWF4IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhbigpO1xuICAgICAgICBncmFwaC5zd2l0Y2ggPSB0aGlzLmlvLmNyZWF0ZVN3aXRjaCggMiwgMCApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5ncmVhdGVyVGhhbiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmdyZWF0ZXJUaGFuLmNvbnRyb2xzLnZhbHVlICk7XG5cblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnN3aXRjaC5pbnB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLnN3aXRjaC5pbnB1dHNbIDEgXSApO1xuICAgICAgICBncmFwaC5ncmVhdGVyVGhhbi5jb25uZWN0KCBncmFwaC5zd2l0Y2guY29udHJvbCApO1xuICAgICAgICBncmFwaC5zd2l0Y2guY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU1heCA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IE1heCggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBXaGVuIGlucHV0IGlzID4gYHZhbHVlYCwgb3V0cHV0cyBgdmFsdWVgLCBvdGhlcndpc2Ugb3V0cHV0cyBpbnB1dC5cbiAqIEBwYXJhbSB7QXVkaW9JT30gaW8gICBBdWRpb0lPIGluc3RhbmNlXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgVGhlIG1pbmltdW0gdmFsdWUgdG8gdGVzdCBhZ2FpbnN0LlxuICovXG5jbGFzcyBNaW4gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubGVzc1RoYW4gPSB0aGlzLmlvLmNyZWF0ZUxlc3NUaGFuKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5sZXNzVGhhbiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmxlc3NUaGFuLmNvbnRyb2xzLnZhbHVlICk7XG5cbiAgICAgICAgZ3JhcGguc3dpdGNoID0gdGhpcy5pby5jcmVhdGVTd2l0Y2goIDIsIDAgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnN3aXRjaC5pbnB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLnN3aXRjaC5pbnB1dHNbIDEgXSApO1xuICAgICAgICBncmFwaC5sZXNzVGhhbi5jb25uZWN0KCBncmFwaC5zd2l0Y2guY29udHJvbCApO1xuICAgICAgICBncmFwaC5zd2l0Y2guY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTWluID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgTWluKCB0aGlzLCB2YWx1ZSApO1xufTsiLCIgaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byBhdWRpbyBzaWduYWxzIHRvZ2V0aGVyLlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKi9cbmNsYXNzIE11bHRpcGx5IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSAwLjA7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU11bHRpcGx5ID0gZnVuY3Rpb24oIHZhbHVlMSwgdmFsdWUyICkge1xuICAgIHJldHVybiBuZXcgTXVsdGlwbHkoIHRoaXMsIHZhbHVlMSwgdmFsdWUyICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogTmVnYXRlcyB0aGUgaW5jb21pbmcgYXVkaW8gc2lnbmFsLlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKi9cbmNsYXNzIE5lZ2F0ZSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAwICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gLTE7XG4gICAgICAgIHRoaXMub3V0cHV0cyA9IHRoaXMuaW5wdXRzO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOZWdhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE5lZ2F0ZSggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICpcbiAqIE5vdGU6IERPRVMgTk9UIEhBTkRMRSBORUdBVElWRSBQT1dFUlMuXG4gKi9cbmNsYXNzIFBvdyBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBsaWVycyA9IFtdO1xuICAgICAgICBncmFwaC52YWx1ZSA9IHZhbHVlO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgbm9kZSA9IHRoaXMuaW5wdXRzWyAwIF07IGkgPCB2YWx1ZSAtIDE7ICsraSApIHtcbiAgICAgICAgICAgIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0uY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdCggZ3JhcGgubXVsdGlwbGllcnNbIGkgXSApO1xuICAgICAgICAgICAgbm9kZSA9IGdyYXBoLm11bHRpcGxpZXJzWyBpIF07XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkudmFsdWUgPSBudWxsO1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JhcGgoKS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZGlzY29ubmVjdCggZ3JhcGgubXVsdGlwbGllcnNbIDAgXSApO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gZ3JhcGgubXVsdGlwbGllcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICAgICAgICBncmFwaC5tdWx0aXBsaWVyc1sgaSBdLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIGdyYXBoLm11bHRpcGxpZXJzLnNwbGljZSggaSwgMSApO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBub2RlID0gdGhpcy5pbnB1dHNbIDAgXTsgaSA8IHZhbHVlIC0gMTsgKytpICkge1xuICAgICAgICAgICAgZ3JhcGgubXVsdGlwbGllcnNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbGllcnNbIGkgXS5jb250cm9scy52YWx1ZSApO1xuICAgICAgICAgICAgbm9kZS5jb25uZWN0KCBncmFwaC5tdWx0aXBsaWVyc1sgaSBdICk7XG4gICAgICAgICAgICBub2RlID0gZ3JhcGgubXVsdGlwbGllcnNbIGkgXTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICBncmFwaC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUG93ID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgUG93KCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIE91dHB1dHMgdGhlIHZhbHVlIG9mIDEgLyBpbnB1dFZhbHVlIChvciBwb3coaW5wdXRWYWx1ZSwgLTEpKVxuICogV2lsbCBiZSB1c2VmdWwgZm9yIGRvaW5nIG11bHRpcGxpY2F0aXZlIGRpdmlzaW9uLlxuICpcbiAqIFRPRE86XG4gKiAgICAgLSBUaGUgd2F2ZXNoYXBlciBpc24ndCBhY2N1cmF0ZS4gSXQgcHVtcHMgb3V0IHZhbHVlcyBkaWZmZXJpbmdcbiAqICAgICAgIGJ5IDEuNzkwNjc5MzE0MDMwMTUyNWUtOSBvciBtb3JlLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBSZWNpcHJvY2FsIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBtYXhJbnB1dCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGZhY3RvciA9IG1heElucHV0IHx8IDEwMCxcbiAgICAgICAgICAgIGdhaW4gPSBNYXRoLnBvdyggZmFjdG9yLCAtMSApLFxuICAgICAgICAgICAgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubWF4SW5wdXQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5tYXhJbnB1dC5nYWluLnNldFZhbHVlQXRUaW1lKCBnYWluLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcblxuICAgICAgICAvLyB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnNldFZhbHVlQXRUaW1lKCAwLjAsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuUmVjaXByb2NhbCApO1xuXG4gICAgICAgIC8vIHRoaXMub3V0cHV0c1sgMCBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi5zZXRWYWx1ZUF0VGltZSggMC4wLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcblxuICAgICAgICB0aGlzLmlvLmNvbnN0YW50RHJpdmVyLmNvbm5lY3QoIGdyYXBoLm1heElucHV0ICk7XG4gICAgICAgIGdyYXBoLm1heElucHV0LmNvbm5lY3QoIHRoaXMuaW5wdXRzWyAwIF0uZ2FpbiApO1xuICAgICAgICBncmFwaC5tYXhJbnB1dC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXS5nYWluICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgbWF4SW5wdXQoKSB7XG4gICAgICAgIHJldHVybiBncmFwaC5tYXhJbnB1dC5nYWluO1xuICAgIH1cbiAgICBzZXQgbWF4SW5wdXQoIHZhbHVlICkge1xuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgaWYgKCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgZ3JhcGgubWF4SW5wdXQuZ2Fpbi5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgICAgICAgICAgZ3JhcGgubWF4SW5wdXQuZ2Fpbi5zZXRWYWx1ZUF0VGltZSggMSAvIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUmVjaXByb2NhbCA9IGZ1bmN0aW9uKCBtYXhJbnB1dCApIHtcbiAgICByZXR1cm4gbmV3IFJlY2lwcm9jYWwoIHRoaXMsIG1heElucHV0ICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIE5PVEU6XG4vLyAgT25seSBhY2NlcHRzIHZhbHVlcyA+PSAtMSAmJiA8PSAxLiBWYWx1ZXMgb3V0c2lkZVxuLy8gIHRoaXMgcmFuZ2UgYXJlIGNsYW1wZWQgdG8gdGhpcyByYW5nZS5cbmNsYXNzIFJvdW5kIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguZmxvb3IgPSB0aGlzLmlvLmNyZWF0ZUZsb29yKCk7XG4gICAgICAgIGdyYXBoLmFkZCA9IHRoaXMuaW8uY3JlYXRlQWRkKCAwLjUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbMF0uY29ubmVjdCggZ3JhcGguYWRkICk7XG4gICAgICAgIGdyYXBoLmFkZC5jb25uZWN0KCBncmFwaC5mbG9vciApO1xuICAgICAgICBncmFwaC5mbG9vci5jb25uZWN0KCB0aGlzLm91dHB1dHNbMF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUm91bmQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFJvdW5kKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qXG4gICAgQWxzbyBrbm93biBhcyB6LTEsIHRoaXMgbm9kZSBkZWxheXMgdGhlIGlucHV0IGJ5XG4gICAgb25lIHNhbXBsZS5cbiAqL1xuY2xhc3MgU2FtcGxlRGVsYXkgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIGdyYXBoLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDEgLyB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmRlbGF5ICk7XG4gICAgICAgIGdyYXBoLmRlbGF5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbi8vIFRoZSBmYWN0b3J5IGZvciBTYW1wbGVEZWxheSBoYXMgYW4gYWxpYXMgdG8gaXQncyBtb3JlIGNvbW1vbiBuYW1lIVxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2FtcGxlRGVsYXkgPSBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVaTWludXNPbmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFNhbXBsZURlbGF5KCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIEdpdmVuIGFuIGlucHV0IHZhbHVlIGFuZCBpdHMgaGlnaCBhbmQgbG93IGJvdW5kcywgc2NhbGVcbi8vIHRoYXQgdmFsdWUgdG8gbmV3IGhpZ2ggYW5kIGxvdyBib3VuZHMuXG4vL1xuLy8gRm9ybXVsYSBmcm9tIE1heE1TUCdzIFNjYWxlIG9iamVjdDpcbi8vICBodHRwOi8vd3d3LmN5Y2xpbmc3NC5jb20vZm9ydW1zL3RvcGljLnBocD9pZD0yNjU5M1xuLy9cbi8vICgoaW5wdXQtbG93SW4pIC8gKGhpZ2hJbi1sb3dJbikpICogKGhpZ2hPdXQtbG93T3V0KSArIGxvd091dDtcblxuXG4vLyBUT0RPOlxuLy8gIC0gQWRkIGNvbnRyb2xzIVxuY2xhc3MgU2NhbGUgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dJbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hJbiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hJbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd091dCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoT3V0ICk7XG5cblxuICAgICAgICAvLyAoaW5wdXQtbG93SW4pXG4gICAgICAgIGdyYXBoLmlucHV0TWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5pbnB1dE1pbnVzTG93SW4sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbi5jb25uZWN0KCBncmFwaC5pbnB1dE1pbnVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoaGlnaEluLWxvd0luKVxuICAgICAgICBncmFwaC5oaWdoSW5NaW51c0xvd0luID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hJbi5jb25uZWN0KCBncmFwaC5oaWdoSW5NaW51c0xvd0luLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4uY29ubmVjdCggZ3JhcGguaGlnaEluTWludXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vICgoaW5wdXQtbG93SW4pIC8gKGhpZ2hJbi1sb3dJbikpXG4gICAgICAgIGdyYXBoLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCk7XG4gICAgICAgIGdyYXBoLmlucHV0TWludXNMb3dJbi5jb25uZWN0KCBncmFwaC5kaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguaGlnaEluTWludXNMb3dJbi5jb25uZWN0KCBncmFwaC5kaXZpZGUsIDAsIDEgKTtcblxuICAgICAgICAvLyAoaGlnaE91dC1sb3dPdXQpXG4gICAgICAgIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dCA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0LmNvbm5lY3QoIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dCwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQsIDAsIDEgKTtcblxuICAgICAgICAvLyAoKGlucHV0LWxvd0luKSAvIChoaWdoSW4tbG93SW4pKSAqIChoaWdoT3V0LWxvd091dClcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLmRpdmlkZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICAvLyAoKGlucHV0LWxvd0luKSAvIChoaWdoSW4tbG93SW4pKSAqIChoaWdoT3V0LWxvd091dCkgKyBsb3dPdXRcbiAgICAgICAgZ3JhcGguYWRkID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggZ3JhcGguYWRkLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LmNvbm5lY3QoIGdyYXBoLmFkZCwgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLmFkZC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IGxvd0luKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5sb3dJbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd0luKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBoaWdoSW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmhpZ2hJbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGhpZ2hJbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEluLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGxvd091dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMubG93T3V0LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbG93T3V0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgaGlnaE91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuaGlnaE91dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGhpZ2hPdXQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2NhbGUgPSBmdW5jdGlvbiggbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICkge1xuICAgIHJldHVybiBuZXcgU2NhbGUoIHRoaXMsIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBHaXZlbiBhbiBpbnB1dCB2YWx1ZSBhbmQgaXRzIGhpZ2ggYW5kIGxvdyBib3VuZHMsIHNjYWxlXG4vLyB0aGF0IHZhbHVlIHRvIG5ldyBoaWdoIGFuZCBsb3cgYm91bmRzLlxuLy9cbi8vIEZvcm11bGEgZnJvbSBNYXhNU1AncyBTY2FsZSBvYmplY3Q6XG4vLyAgaHR0cDovL3d3dy5jeWNsaW5nNzQuY29tL2ZvcnVtcy90b3BpYy5waHA/aWQ9MjY1OTNcbi8vXG4vLyBpZiggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSA9PT0gMCApIHtcbi8vICAgICByZXR1cm4gbG93T3V0O1xuLy8gfVxuLy8gZWxzZSBpZiggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSA+IDAgKSB7XG4vLyAgICAgcmV0dXJuIGxvd091dCArIChoaWdoT3V0IC0gbG93T3V0KSAqIE1hdGgucG93KCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApO1xuLy8gfVxuLy8gZWxzZSB7XG4vLyAgICAgcmV0dXJuIGxvd091dCArIChoaWdoT3V0IC0gbG93T3V0KSAqIC0oTWF0aC5wb3coICgtaW5wdXQgKyBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApKTtcbi8vIH1cblxuLy8gVE9ETzpcbi8vICAtIEFkZCBjb250cm9sc1xuY2xhc3MgU2NhbGVFeHAgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCwgZXhwb25lbnQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICAvLyBsb3dJbiA9IHR5cGVvZiBsb3dJbiA9PT0gJ251bWJlcicgPyBsb3dJbiA6IDA7XG4gICAgICAgIC8vIGhpZ2hJbiA9IHR5cGVvZiBoaWdoSW4gPT09ICdudW1iZXInID8gaGlnaEluIDogMTtcbiAgICAgICAgLy8gbG93T3V0ID0gdHlwZW9mIGxvd091dCA9PT0gJ251bWJlcicgPyBsb3dPdXQgOiAwO1xuICAgICAgICAvLyBoaWdoT3V0ID0gdHlwZW9mIGhpZ2hPdXQgPT09ICdudW1iZXInID8gaGlnaE91dCA6IDEwO1xuICAgICAgICAvLyBleHBvbmVudCA9IHR5cGVvZiBleHBvbmVudCA9PT0gJ251bWJlcicgPyBleHBvbmVudCA6IDE7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd0luICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEluID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaEluICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93T3V0ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaE91dCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hPdXQgKTtcbiAgICAgICAgZ3JhcGguX2V4cG9uZW50ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggZXhwb25lbnQgKTtcblxuXG4gICAgICAgIC8vIChpbnB1dCAtIGxvd0luKVxuICAgICAgICBncmFwaC5pbnB1dE1pbnVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguaW5wdXRNaW51c0xvd0luLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4uY29ubmVjdCggZ3JhcGguaW5wdXRNaW51c0xvd0luLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKC1pbnB1dCArIGxvd0luKVxuICAgICAgICBncmFwaC5taW51c0lucHV0ID0gdGhpcy5pby5jcmVhdGVOZWdhdGUoKTtcbiAgICAgICAgZ3JhcGgubWludXNJbnB1dFBsdXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubWludXNJbnB1dCApO1xuICAgICAgICBncmFwaC5taW51c0lucHV0LmNvbm5lY3QoIGdyYXBoLm1pbnVzSW5wdXRQbHVzTG93SW4sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbi5jb25uZWN0KCBncmFwaC5taW51c0lucHV0UGx1c0xvd0luLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hJbiAtIGxvd0luKVxuICAgICAgICBncmFwaC5oaWdoSW5NaW51c0xvd0luID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hJbi5jb25uZWN0KCBncmFwaC5oaWdoSW5NaW51c0xvd0luLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4uY29ubmVjdCggZ3JhcGguaGlnaEluTWludXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vICgoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pKVxuICAgICAgICBncmFwaC5kaXZpZGUgPSB0aGlzLmlvLmNyZWF0ZURpdmlkZSgpO1xuICAgICAgICBncmFwaC5pbnB1dE1pbnVzTG93SW4uY29ubmVjdCggZ3JhcGguZGl2aWRlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4uY29ubmVjdCggZ3JhcGguZGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKC1pbnB1dCArIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbilcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVEaXZpZGUgPSB0aGlzLmlvLmNyZWF0ZURpdmlkZSgpO1xuICAgICAgICBncmFwaC5taW51c0lucHV0UGx1c0xvd0luLmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlRGl2aWRlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4uY29ubmVjdCggZ3JhcGgubmVnYXRpdmVEaXZpZGUsIDAsIDEgKTtcblxuICAgICAgICAvLyAoaGlnaE91dCAtIGxvd091dClcbiAgICAgICAgZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQuY29ubmVjdCggZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LmNvbm5lY3QoIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dCwgMCwgMSApO1xuXG4gICAgICAgIC8vIE1hdGgucG93KCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApXG4gICAgICAgIGdyYXBoLnBvdyA9IHRoaXMuaW8uY3JlYXRlUG93KCBleHBvbmVudCApO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggZ3JhcGgucG93ICk7XG5cbiAgICAgICAgLy8gLShNYXRoLnBvdyggKC1pbnB1dCArIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cCkpXG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlUG93TmVnYXRlID0gdGhpcy5pby5jcmVhdGVOZWdhdGUoKTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVQb3cgPSB0aGlzLmlvLmNyZWF0ZVBvdyggZXhwb25lbnQgKTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVEaXZpZGUuY29ubmVjdCggZ3JhcGgubmVnYXRpdmVQb3cgKTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVQb3cuY29ubmVjdCggZ3JhcGgubmVnYXRpdmVQb3dOZWdhdGUgKTtcblxuXG4gICAgICAgIC8vIGxvd091dCArIChoaWdoT3V0IC0gbG93T3V0KSAqIE1hdGgucG93KCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApO1xuICAgICAgICBncmFwaC5lbHNlSWZCcmFuY2ggPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICBncmFwaC5lbHNlSWZNdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LmNvbm5lY3QoIGdyYXBoLmVsc2VJZk11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLnBvdy5jb25uZWN0KCBncmFwaC5lbHNlSWZNdWx0aXBseSwgMCwgMSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5lbHNlSWZCcmFuY2gsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguZWxzZUlmTXVsdGlwbHkuY29ubmVjdCggZ3JhcGguZWxzZUlmQnJhbmNoLCAwLCAxICk7XG5cbiAgICAgICAgLy8gbG93T3V0ICsgKGhpZ2hPdXQgLSBsb3dPdXQpICogLShNYXRoLnBvdyggKC1pbnB1dCArIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cCkpO1xuICAgICAgICBncmFwaC5lbHNlQnJhbmNoID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgZ3JhcGguZWxzZU11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQuY29ubmVjdCggZ3JhcGguZWxzZU11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlUG93TmVnYXRlLmNvbm5lY3QoIGdyYXBoLmVsc2VNdWx0aXBseSwgMCwgMSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5lbHNlQnJhbmNoLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmVsc2VNdWx0aXBseS5jb25uZWN0KCBncmFwaC5lbHNlQnJhbmNoLCAwLCAxICk7XG5cblxuXG4gICAgICAgIC8vIGVsc2UgaWYoIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikgPiAwICkge1xuICAgICAgICBncmFwaC5ncmVhdGVyVGhhblplcm8gPSB0aGlzLmlvLmNyZWF0ZUdyZWF0ZXJUaGFuWmVybygpO1xuICAgICAgICBncmFwaC5pZkdyZWF0ZXJUaGFuWmVybyA9IHRoaXMuaW8uY3JlYXRlSWZFbHNlKCk7XG4gICAgICAgIGdyYXBoLmRpdmlkZS5jb25uZWN0KCBncmFwaC5ncmVhdGVyVGhhblplcm8gKTtcbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW5aZXJvLmNvbm5lY3QoIGdyYXBoLmlmR3JlYXRlclRoYW5aZXJvLmlmICk7XG4gICAgICAgIGdyYXBoLmVsc2VJZkJyYW5jaC5jb25uZWN0KCBncmFwaC5pZkdyZWF0ZXJUaGFuWmVyby50aGVuICk7XG4gICAgICAgIGdyYXBoLmVsc2VCcmFuY2guY29ubmVjdCggZ3JhcGguaWZHcmVhdGVyVGhhblplcm8uZWxzZSApO1xuXG4gICAgICAgIC8vIGlmKChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikgPT09IDApXG4gICAgICAgIGdyYXBoLmVxdWFsc1plcm8gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG9aZXJvKCk7XG4gICAgICAgIGdyYXBoLmlmRXF1YWxzWmVybyA9IHRoaXMuaW8uY3JlYXRlSWZFbHNlKCk7XG4gICAgICAgIGdyYXBoLmRpdmlkZS5jb25uZWN0KCBncmFwaC5lcXVhbHNaZXJvICk7XG4gICAgICAgIGdyYXBoLmVxdWFsc1plcm8uY29ubmVjdCggZ3JhcGguaWZFcXVhbHNaZXJvLmlmICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LmNvbm5lY3QoIGdyYXBoLmlmRXF1YWxzWmVyby50aGVuICk7XG4gICAgICAgIGdyYXBoLmlmR3JlYXRlclRoYW5aZXJvLmNvbm5lY3QoIGdyYXBoLmlmRXF1YWxzWmVyby5lbHNlICk7XG5cbiAgICAgICAgZ3JhcGguaWZFcXVhbHNaZXJvLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgbG93SW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmxvd0luLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbG93SW4oIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGhpZ2hJbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuaGlnaEluLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgaGlnaEluKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgbG93T3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5sb3dPdXQudmFsdWU7XG4gICAgfVxuICAgIHNldCBsb3dPdXQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBoaWdoT3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5oaWdoT3V0LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgaGlnaE91dCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaE91dC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBleHBvbmVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JhcGgoKS5fZXhwb25lbnQudmFsdWU7XG4gICAgfVxuICAgIHNldCBleHBvbmVudCggdmFsdWUgKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgZ3JhcGguX2V4cG9uZW50LnZhbHVlID0gdmFsdWU7XG4gICAgICAgIGdyYXBoLnBvdy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZVBvdy52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTY2FsZUV4cCA9IGZ1bmN0aW9uKCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQsIGV4cG9uZW50ICkge1xuICAgIHJldHVybiBuZXcgU2NhbGVFeHAoIHRoaXMsIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCwgZXhwb25lbnQgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgU2lnbiBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5TaWduICk7XG5cbiAgICAgICAgZ3JhcGguaWZFbHNlID0gdGhpcy5pby5jcmVhdGVJZkVsc2UoKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUb1plcm8gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG9aZXJvKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5lcXVhbFRvWmVybyApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmlmRWxzZS50aGVuICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG5cbiAgICAgICAgZ3JhcGguZXF1YWxUb1plcm8uY29ubmVjdCggZ3JhcGguaWZFbHNlLmlmICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCBncmFwaC5pZkVsc2UuZWxzZSApO1xuICAgICAgICBncmFwaC5pZkVsc2UuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2lnbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgU2lnbiggdGhpcyApO1xufTtcbiIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL01ldGhvZHNfb2ZfY29tcHV0aW5nX3NxdWFyZV9yb290cyNFeGFtcGxlXG4vL1xuLy8gZm9yKCB2YXIgaSA9IDAsIHg7IGkgPCBzaWdGaWd1cmVzOyArK2kgKSB7XG4vLyAgICAgIGlmKCBpID09PSAwICkge1xuLy8gICAgICAgICAgeCA9IHNpZ0ZpZ3VyZXMgKiBNYXRoLnBvdyggMTAsIDIgKTtcbi8vICAgICAgfVxuLy8gICAgICBlbHNlIHtcbi8vICAgICAgICAgIHggPSAwLjUgKiAoIHggKyAoaW5wdXQgLyB4KSApO1xuLy8gICAgICB9XG4vLyB9XG5cbi8vIFRPRE86XG4vLyAgLSBNYWtlIHN1cmUgU3FydCB1c2VzIGdldEdyYXBoIGFuZCBzZXRHcmFwaC5cbmNsYXNzIFNxcnRIZWxwZXIge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgcHJldmlvdXNTdGVwLCBpbnB1dCwgbWF4SW5wdXQgKSB7XG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSBpby5jcmVhdGVNdWx0aXBseSggMC41ICk7XG4gICAgICAgIHRoaXMuZGl2aWRlID0gaW8uY3JlYXRlRGl2aWRlKCBudWxsLCBtYXhJbnB1dCApO1xuICAgICAgICB0aGlzLmFkZCA9IGlvLmNyZWF0ZUFkZCgpO1xuXG4gICAgICAgIC8vIGlucHV0IC8geDtcbiAgICAgICAgaW5wdXQuY29ubmVjdCggdGhpcy5kaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgcHJldmlvdXNTdGVwLm91dHB1dC5jb25uZWN0KCB0aGlzLmRpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIC8vIHggKyAoIGlucHV0IC8geCApXG4gICAgICAgIHByZXZpb3VzU3RlcC5vdXRwdXQuY29ubmVjdCggdGhpcy5hZGQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5kaXZpZGUuY29ubmVjdCggdGhpcy5hZGQsIDAsIDEgKTtcblxuICAgICAgICAvLyAwLjUgKiAoIHggKyAoIGlucHV0IC8geCApIClcbiAgICAgICAgdGhpcy5hZGQuY29ubmVjdCggdGhpcy5tdWx0aXBseSApO1xuXG4gICAgICAgIHRoaXMub3V0cHV0ID0gdGhpcy5tdWx0aXBseTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLm11bHRpcGx5LmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5kaXZpZGUuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmFkZC5jbGVhblVwKCk7XG5cbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IG51bGw7XG4gICAgICAgIHRoaXMuZGl2aWRlID0gbnVsbDtcbiAgICAgICAgdGhpcy5hZGQgPSBudWxsO1xuICAgICAgICB0aGlzLm91dHB1dCA9IG51bGw7XG4gICAgfVxufVxuXG5jbGFzcyBTcXJ0IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBzaWduaWZpY2FudEZpZ3VyZXMsIG1heElucHV0ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyBEZWZhdWx0IHRvIDYgc2lnbmlmaWNhbnQgZmlndXJlcy5cbiAgICAgICAgc2lnbmlmaWNhbnRGaWd1cmVzID0gc2lnbmlmaWNhbnRGaWd1cmVzIHx8IDY7XG5cbiAgICAgICAgbWF4SW5wdXQgPSBtYXhJbnB1dCB8fCAxMDA7XG5cbiAgICAgICAgdGhpcy54MCA9IHRoaXMuaW8uY3JlYXRlQ29uc3RhbnQoIHNpZ25pZmljYW50RmlndXJlcyAqIE1hdGgucG93KCAxMCwgMiApICk7XG5cbiAgICAgICAgdGhpcy5zdGVwcyA9IFsge1xuICAgICAgICAgICAgb3V0cHV0OiB0aGlzLngwXG4gICAgICAgIH0gXTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDE7IGkgPCBzaWduaWZpY2FudEZpZ3VyZXM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuc3RlcHMucHVzaChcbiAgICAgICAgICAgICAgICBuZXcgU3FydEhlbHBlciggdGhpcy5pbywgdGhpcy5zdGVwc1sgaSAtIDEgXSwgdGhpcy5pbnB1dHNbIDAgXSwgbWF4SW5wdXQgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RlcHNbIHRoaXMuc3RlcHMubGVuZ3RoIC0gMSBdLm91dHB1dC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIC8vIGNsZWFuVXAoKSB7XG4gICAgLy8gICAgIHN1cGVyKCk7XG5cbiAgICAvLyAgICAgdGhpcy54MC5jbGVhblVwKCk7XG5cbiAgICAvLyAgICAgdGhpcy5zdGVwc1sgMCBdID0gbnVsbDtcblxuICAgIC8vICAgICBmb3IoIHZhciBpID0gdGhpcy5zdGVwcy5sZW5ndGggLSAxOyBpID49IDE7IC0taSApIHtcbiAgICAvLyAgICAgICAgIHRoaXMuc3RlcHNbIGkgXS5jbGVhblVwKCk7XG4gICAgLy8gICAgICAgICB0aGlzLnN0ZXBzWyBpIF0gPSBudWxsO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgdGhpcy54MCA9IG51bGw7XG4gICAgLy8gICAgIHRoaXMuc3RlcHMgPSBudWxsO1xuICAgIC8vIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTcXJ0ID0gZnVuY3Rpb24oIHNpZ25pZmljYW50RmlndXJlcywgbWF4SW5wdXQgKSB7XG4gICAgcmV0dXJuIG5ldyBTcXJ0KCB0aGlzLCBzaWduaWZpY2FudEZpZ3VyZXMsIG1heElucHV0ICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbmNsYXNzIFNxdWFyZSBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMSApO1xuICAgICAgICBncmFwaC5tdWx0aXBseS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTcXVhcmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFNxdWFyZSggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIFN1YnRyYWN0cyB0aGUgc2Vjb25kIGlucHV0IGZyb20gdGhlIGZpcnN0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBTdWJ0cmFjdCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5uZWdhdGUgPSB0aGlzLmlvLmNyZWF0ZU5lZ2F0ZSgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5uZWdhdGUgKTtcbiAgICAgICAgZ3JhcGgubmVnYXRlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW5wdXRzWyAxIF07XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTdWJ0cmFjdCA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFN1YnRyYWN0KCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBTd2l0Y2ggZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIG51bUNhc2VzLCBzdGFydGluZ0Nhc2UgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIC8vIEVuc3VyZSBzdGFydGluZ0Nhc2UgaXMgbmV2ZXIgPCAwXG4gICAgICAgIHN0YXJ0aW5nQ2FzZSA9IHR5cGVvZiBzdGFydGluZ0Nhc2UgPT09ICdudW1iZXInID8gTWF0aC5hYnMoIHN0YXJ0aW5nQ2FzZSApIDogc3RhcnRpbmdDYXNlO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jYXNlcyA9IFtdO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuaW5kZXggPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBzdGFydGluZ0Nhc2UgKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1DYXNlczsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgaSBdLmdhaW4udmFsdWUgPSAwLjA7XG4gICAgICAgICAgICBncmFwaC5jYXNlc1sgaSBdID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvKCBpICk7XG4gICAgICAgICAgICBncmFwaC5jYXNlc1sgaSBdLmNvbm5lY3QoIHRoaXMuaW5wdXRzWyBpIF0uZ2FpbiApO1xuICAgICAgICAgICAgdGhpcy5jb250cm9scy5pbmRleC5jb25uZWN0KCBncmFwaC5jYXNlc1sgaSBdICk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgaSBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCBjb250cm9sKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5pbmRleC5jb250cm9sO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuaW5kZXgudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaW5kZXgudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3dpdGNoID0gZnVuY3Rpb24oIG51bUNhc2VzLCBzdGFydGluZ0Nhc2UgKSB7XG4gICAgcmV0dXJuIG5ldyBTd2l0Y2goIHRoaXMsIG51bUNhc2VzLCBzdGFydGluZ0Nhc2UgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IExvZ2ljYWxPcGVyYXRvciBmcm9tIFwiLi9Mb2dpY2FsT3BlcmF0b3IuZXM2XCI7XG5cblxuY2xhc3MgQU5EIGV4dGVuZHMgTG9naWNhbE9wZXJhdG9yIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVDbGFtcCggMCwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUFORCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgQU5EKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBBTkQ7IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBMb2dpY2FsT3BlcmF0b3IgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNsYW1wID0gdGhpcy5pby5jcmVhdGVDbGFtcCggMCwgMSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gZ3JhcGguY2xhbXA7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExvZ2ljYWxPcGVyYXRvcjtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTG9naWNhbE9wZXJhdG9yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBMb2dpY2FsT3BlcmF0b3IoIHRoaXMgKTtcbn07IiwiLy8gQU5EIC0+IE5PVCAtPiBvdXRcbi8vXG5pbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTG9naWNhbE9wZXJhdG9yIGZyb20gXCIuL0xvZ2ljYWxPcGVyYXRvci5lczZcIjtcblxuXG5jbGFzcyBOQU5EIGV4dGVuZHMgTG9naWNhbE9wZXJhdG9yIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuICAgICAgICBncmFwaC5BTkQgPSB0aGlzLmlvLmNyZWF0ZUFORCgpO1xuICAgICAgICBncmFwaC5OT1QgPSB0aGlzLmlvLmNyZWF0ZU5PVCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLkFORCwgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLkFORCwgMCwgMSApO1xuICAgICAgICBncmFwaC5BTkQuY29ubmVjdCggZ3JhcGguTk9UICk7XG4gICAgICAgIGdyYXBoLk5PVC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOQU5EID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBOQU5EKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOQU5EOyIsIi8vIE9SIC0+IE5PVCAtPiBvdXRcbmltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIE5PUiBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgZ3JhcGguT1IgPSB0aGlzLmlvLmNyZWF0ZU9SKCk7XG4gICAgICAgIGdyYXBoLk5PVCA9IHRoaXMuaW8uY3JlYXRlTk9UKCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguT1IsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5PUiwgMCwgMSApO1xuICAgICAgICBncmFwaC5PUi5jb25uZWN0KCBncmFwaC5OT1QgKTtcbiAgICAgICAgZ3JhcGguTk9ULmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5PUiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTk9SKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOT1I7IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IExvZ2ljYWxPcGVyYXRvciBmcm9tIFwiLi9Mb2dpY2FsT3BlcmF0b3IuZXM2XCI7XG5cblxuY2xhc3MgTk9UIGV4dGVuZHMgTG9naWNhbE9wZXJhdG9yIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmFicyA9IHRoaXMuaW8uY3JlYXRlQWJzKCAxMDAgKTtcbiAgICAgICAgZ3JhcGguc3VidHJhY3QgPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCAxICk7XG4gICAgICAgIGdyYXBoLnJvdW5kID0gdGhpcy5pby5jcmVhdGVSb3VuZCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc3VidHJhY3QgKTtcbiAgICAgICAgZ3JhcGguc3VidHJhY3QuY29ubmVjdCggZ3JhcGguYWJzICk7XG4gICAgICAgIGdyYXBoLmFicy5jb25uZWN0KCBncmFwaC5yb3VuZCApXG5cbiAgICAgICAgZ3JhcGgucm91bmQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTk9UID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBOT1QoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IE5PVDsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTG9naWNhbE9wZXJhdG9yIGZyb20gXCIuL0xvZ2ljYWxPcGVyYXRvci5lczZcIjtcblxuXG5jbGFzcyBPUiBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5tYXggPSB0aGlzLmlvLmNyZWF0ZU1heCgpO1xuICAgICAgICBncmFwaC5lcXVhbFRvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvKCAxICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZUNsYW1wKCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5tYXggKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5tYXguY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgZ3JhcGgubWF4LmNvbm5lY3QoIGdyYXBoLmVxdWFsVG8gKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUby5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVPUiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT1IoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IE9SO1xuIiwiLy8gYSBlcXVhbFRvKCBiICkgLT4gTk9UIC0+IG91dFxuaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IExvZ2ljYWxPcGVyYXRvciBmcm9tIFwiLi9Mb2dpY2FsT3BlcmF0b3IuZXM2XCI7XG5cblxuY2xhc3MgWE9SIGV4dGVuZHMgTG9naWNhbE9wZXJhdG9yIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuICAgICAgICBncmFwaC5lcXVhbFRvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvKCk7XG4gICAgICAgIGdyYXBoLk5PVCA9IHRoaXMuaW8uY3JlYXRlTk9UKCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZXF1YWxUbyApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLmVxdWFsVG8uY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUby5jb25uZWN0KCBncmFwaC5OT1QgKTtcbiAgICAgICAgZ3JhcGguTk9ULmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVhPUiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgWE9SKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBYT1I7IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gZ2FpbigrMTAwMDAwKSAtPiBzaGFwZXIoIDw9IDA6IDEsIDEgKVxuY2xhc3MgRXF1YWxUbyBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICAvLyBUT0RPXG4gICAgICAgIC8vICAtIFJlbmFtZSB0aGlzLlxuICAgICAgICBncmFwaC52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICksXG4gICAgICAgIGdyYXBoLmludmVyc2lvbiA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgZ3JhcGguaW52ZXJzaW9uLmdhaW4udmFsdWUgPSAtMTtcblxuICAgICAgICAvLyBUaGlzIGN1cnZlIG91dHB1dHMgMC41IHdoZW4gaW5wdXQgaXMgMCxcbiAgICAgICAgLy8gc28gaXQgaGFzIHRvIGJlIHBpcGVkIGludG8gYSBub2RlIHRoYXRcbiAgICAgICAgLy8gdHJhbnNmb3JtcyBpdCBpbnRvIDEsIGFuZCBsZWF2ZXMgemVyb3NcbiAgICAgICAgLy8gYWxvbmUuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuRXF1YWxUb1plcm8gKTtcblxuICAgICAgICBncmFwaC5ncmVhdGVyVGhhblplcm8gPSB0aGlzLmlvLmNyZWF0ZUdyZWF0ZXJUaGFuWmVybygpO1xuICAgICAgICBncmFwaC52YWx1ZS5jb25uZWN0KCBncmFwaC5pbnZlcnNpb24gKTtcbiAgICAgICAgZ3JhcGguaW52ZXJzaW9uLmNvbm5lY3QoIHRoaXMuaW5wdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW5aZXJvICk7XG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuWmVyby5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSBncmFwaC52YWx1ZTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUVxdWFsVG8gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBFcXVhbFRvKCB0aGlzLCB2YWx1ZSApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRXF1YWxUbzsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuaW1wb3J0IEVxdWFsVG8gZnJvbSBcIi4vRXF1YWxUby5lczZcIjtcblxuLy8gSGF2ZW4ndCBxdWl0ZSBmaWd1cmVkIG91dCB3aHkgeWV0LCBidXQgdGhpcyByZXR1cm5zIDAgd2hlbiBpbnB1dCBpcyAwLlxuLy8gSXQgc2hvdWxkIHJldHVybiAxLi4uXG4vL1xuLy8gRm9yIG5vdywgSSdtIGp1c3QgdXNpbmcgdGhlIEVxdWFsVG8gbm9kZSB3aXRoIGEgc3RhdGljIDAgYXJndW1lbnQuXG4vLyAtLS0tLS0tLVxuLy9cbi8vIGNsYXNzIEVxdWFsVG9aZXJvIGV4dGVuZHMgTm9kZSB7XG4vLyAgICAgY29uc3RydWN0b3IoIGlvICkge1xuLy8gICAgICAgICBzdXBlciggaW8sIDEsIDAgKTtcblxuLy8gICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAxMDAwMDA7XG5cbi8vICAgICAgICAgLy8gVGhpcyBvdXRwdXRzIDAuNSB3aGVuIGlucHV0IGlzIDAsXG4vLyAgICAgICAgIC8vIHNvIGl0IGhhcyB0byBiZSBwaXBlZCBpbnRvIGEgbm9kZSB0aGF0XG4vLyAgICAgICAgIC8vIHRyYW5zZm9ybXMgaXQgaW50byAxLCBhbmQgbGVhdmVzIHplcm9zXG4vLyAgICAgICAgIC8vIGFsb25lLlxuLy8gICAgICAgICB0aGlzLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuRXF1YWxUb1plcm8gKTtcblxuLy8gICAgICAgICB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlR3JlYXRlclRoYW4oIDAgKTtcblxuLy8gICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc2hhcGVyICk7XG4vLyAgICAgICAgIHRoaXMuc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4vLyAgICAgfVxuXG4vLyAgICAgY2xlYW5VcCgpIHtcbi8vICAgICAgICAgc3VwZXIoKTtcblxuLy8gICAgICAgICB0aGlzLnNoYXBlci5jbGVhblVwKCk7XG4vLyAgICAgICAgIHRoaXMuc2hhcGVyID0gbnVsbDtcbi8vICAgICB9XG4vLyB9XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUVxdWFsVG9aZXJvID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gcmV0dXJuIG5ldyBFcXVhbFRvWmVybyggdGhpcyApO1xuXG4gICAgcmV0dXJuIG5ldyBFcXVhbFRvKCB0aGlzLCAwICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIEdyZWF0ZXJUaGFuIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuICAgICAgICBncmFwaC5pbnZlcnNpb24gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuXG4gICAgICAgIGdyYXBoLmludmVyc2lvbi5nYWluLnZhbHVlID0gLTE7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gMTAwMDAwO1xuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkdyZWF0ZXJUaGFuWmVybyApO1xuXG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5jb25uZWN0KCBncmFwaC5pbnZlcnNpb24gKTtcbiAgICAgICAgZ3JhcGguaW52ZXJzaW9uLmNvbm5lY3QoIHRoaXMuaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVHcmVhdGVyVGhhbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IEdyZWF0ZXJUaGFuKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBHcmVhdGVyVGhhbkVxdWFsVG8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhbigpO1xuICAgICAgICBncmFwaC5lcXVhbFRvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvKCk7XG4gICAgICAgIGdyYXBoLk9SID0gdGhpcy5pby5jcmVhdGVPUigpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW4uY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5jb25uZWN0KCBncmFwaC5lcXVhbFRvLmNvbnRyb2xzLnZhbHVlICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5ncmVhdGVyVGhhbiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmVxdWFsVG8gKTtcbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW4uY29ubmVjdCggZ3JhcGguT1IsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUby5jb25uZWN0KCBncmFwaC5PUiwgMCwgMSApO1xuICAgICAgICBncmFwaC5PUi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlR3JlYXRlclRoYW5FcXVhbFRvID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgR3JlYXRlclRoYW5FcXVhbFRvKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBHcmVhdGVyVGhhblplcm8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAxMDAwMDA7XG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuR3JlYXRlclRoYW5aZXJvICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVHcmVhdGVyVGhhblplcm8gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEdyZWF0ZXJUaGFuWmVybyggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBJZkVsc2UgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMCApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5zd2l0Y2ggPSB0aGlzLmlvLmNyZWF0ZVN3aXRjaCggMiwgMCApO1xuXG4gICAgICAgIHRoaXMuaWYgPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG9aZXJvKCk7XG4gICAgICAgIHRoaXMuaWYuY29ubmVjdCggZ3JhcGguc3dpdGNoLmNvbnRyb2wgKTtcbiAgICAgICAgdGhpcy50aGVuID0gZ3JhcGguc3dpdGNoLmlucHV0c1sgMCBdO1xuICAgICAgICB0aGlzLmVsc2UgPSBncmFwaC5zd2l0Y2guaW5wdXRzWyAxIF07XG5cbiAgICAgICAgdGhpcy5pbnB1dHMgPSBncmFwaC5zd2l0Y2guaW5wdXRzO1xuICAgICAgICB0aGlzLm91dHB1dHMgPSBncmFwaC5zd2l0Y2gub3V0cHV0cztcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlSWZFbHNlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJZkVsc2UoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgTGVzc1RoYW4gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgZ3JhcGgudmFsdWVJbnZlcnNpb24gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC52YWx1ZUludmVyc2lvbi5nYWluLnZhbHVlID0gLTE7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5jb25uZWN0KCBncmFwaC52YWx1ZUludmVyc2lvbiApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IC0xMDAwMDA7XG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuR3JlYXRlclRoYW5aZXJvICk7XG5cbiAgICAgICAgZ3JhcGgudmFsdWVJbnZlcnNpb24uY29ubmVjdCggdGhpcy5pbnB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxlc3NUaGFuID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgTGVzc1RoYW4oIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIExlc3NUaGFuRXF1YWxUbyBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgZ3JhcGgubGVzc1RoYW4gPSB0aGlzLmlvLmNyZWF0ZUxlc3NUaGFuKCk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG8oKTtcbiAgICAgICAgZ3JhcGguT1IgPSB0aGlzLmlvLmNyZWF0ZU9SKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5jb25uZWN0KCBncmFwaC5sZXNzVGhhbi5jb250cm9scy52YWx1ZSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNvbm5lY3QoIGdyYXBoLmVxdWFsVG8uY29udHJvbHMudmFsdWUgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmxlc3NUaGFuICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZXF1YWxUbyApO1xuICAgICAgICBncmFwaC5sZXNzVGhhbi5jb25uZWN0KCBncmFwaC5PUiwgMCwgMCApO1xuICAgICAgICBncmFwaC5lcXVhbFRvLmNvbm5lY3QoIGdyYXBoLk9SLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLk9SLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVMZXNzVGhhbkVxdWFsVG8gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBMZXNzVGhhbkVxdWFsVG8oIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIExlc3NUaGFuWmVybyBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmJvb3N0ZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5ib29zdGVyLmdhaW4udmFsdWUgPSAtMTAwMDAwO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmJvb3N0ZXIgKTtcblxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkdyZWF0ZXJUaGFuWmVybyApO1xuXG4gICAgICAgIGdyYXBoLmJvb3N0ZXIuY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVMZXNzVGhhblplcm8gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IExlc3NUaGFuWmVybyggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBDb3NpbmUgYXBwcm94aW1hdGlvbiFcbi8vXG4vLyBPbmx5IHdvcmtzIGluIHJhbmdlIG9mIC1NYXRoLlBJIHRvIE1hdGguUEkuXG5jbGFzcyBDb3MgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICBncmFwaC5zcXVhcmUgPSB0aGlzLmlvLmNyZWF0ZVNxdWFyZSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTEgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAtMi42MDVlLTcgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkyID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTMgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5NCA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk1ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIGdyYXBoLmFkZDEgPSB0aGlzLmlvLmNyZWF0ZUFkZCggMi40NzYwOWUtNSApO1xuICAgICAgICBncmFwaC5hZGQyID0gdGhpcy5pby5jcmVhdGVBZGQoIC0wLjAwMTM4ODg0ICk7XG4gICAgICAgIGdyYXBoLmFkZDMgPSB0aGlzLmlvLmNyZWF0ZUFkZCggMC4wNDE2NjY2ICk7XG4gICAgICAgIGdyYXBoLmFkZDQgPSB0aGlzLmlvLmNyZWF0ZUFkZCggLTAuNDk5OTIzICk7XG4gICAgICAgIGdyYXBoLmFkZDUgPSB0aGlzLmlvLmNyZWF0ZUFkZCggMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc3F1YXJlICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBtdWx0aXBseTEncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MSwgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgYWRkMSdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTEuY29ubmVjdCggZ3JhcGguYWRkMSwgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgbXVsdGlwbHkyJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTIsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkMS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTIsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIGFkZDIncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkyLmNvbm5lY3QoIGdyYXBoLmFkZDIsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIG11bHRpcGx5MydzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkzLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDIuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkzLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBhZGQzJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5My5jb25uZWN0KCBncmFwaC5hZGQzLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBtdWx0aXBseTQncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5NCwgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQzLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5NCwgMCwgMSApO1xuXG4gICAgICAgIC8vIGFkZDQncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk0LmNvbm5lY3QoIGdyYXBoLmFkZDQsIDAsIDAgKTtcblxuICAgICAgICAvLyBtdWx0aXBseTUncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5NSwgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQ0LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5NSwgMCwgMSApO1xuXG4gICAgICAgIC8vIGFkZDUncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk1LmNvbm5lY3QoIGdyYXBoLmFkZDUsIDAsIDAgKTtcblxuICAgICAgICAvLyBPdXRwdXQgKGZpbmFsbHkhISlcbiAgICAgICAgZ3JhcGguYWRkNS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIFN0b3JlIGNvbnRyb2xsYWJsZSBwYXJhbXMuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMCBdO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb3MgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDb3MoIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIERlZ1RvUmFkIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMub3V0cHV0c1sgMCBdID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggTWF0aC5QSSAvIDE4MCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRGVnVG9SYWQgPSBmdW5jdGlvbiggZGVnICkge1xuICAgIHJldHVybiBuZXcgRGVnVG9SYWQoIHRoaXMsIGRlZyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBSYWRUb0RlZyBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIDE4MCAvIE1hdGguUEkgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVJhZFRvRGVnID0gZnVuY3Rpb24oIGRlZyApIHtcbiAgICByZXR1cm4gbmV3IFJhZFRvRGVnKCB0aGlzLCBkZWcgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gU2luIGFwcHJveGltYXRpb24hXG4vL1xuLy8gT25seSB3b3JrcyBpbiByYW5nZSBvZiAtTWF0aC5QSSB0byBNYXRoLlBJLlxuY2xhc3MgU2luIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIGdyYXBoLnNxdWFyZSA9IHRoaXMuaW8uY3JlYXRlU3F1YXJlKCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5MSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIC0yLjM5ZS04ICk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5MiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkzID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTQgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5NSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk2ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIGdyYXBoLmFkZDEgPSB0aGlzLmlvLmNyZWF0ZUFkZCggMi43NTI2ZS02ICk7XG4gICAgICAgIGdyYXBoLmFkZDIgPSB0aGlzLmlvLmNyZWF0ZUFkZCggLTAuMDAwMTk4NDA5ICk7XG4gICAgICAgIGdyYXBoLmFkZDMgPSB0aGlzLmlvLmNyZWF0ZUFkZCggMC4wMDgzMzMzMyApO1xuICAgICAgICBncmFwaC5hZGQ0ID0gdGhpcy5pby5jcmVhdGVBZGQoIC0wLjE2NjY2NyApO1xuICAgICAgICBncmFwaC5hZGQ1ID0gdGhpcy5pby5jcmVhdGVBZGQoIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNxdWFyZSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgbXVsdGlwbHkxJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTEsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGFkZDEncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkxLmNvbm5lY3QoIGdyYXBoLmFkZDEsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIG11bHRpcGx5MidzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkyLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDEuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkyLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBhZGQyJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5Mi5jb25uZWN0KCBncmFwaC5hZGQyLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBtdWx0aXBseTMncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MywgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQyLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MywgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgYWRkMydzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTMuY29ubmVjdCggZ3JhcGguYWRkMywgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgbXVsdGlwbHk0J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTQsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkMy5jb25uZWN0KCBncmFwaC5tdWx0aXBseTQsIDAsIDEgKTtcblxuICAgICAgICAvLyBhZGQ0J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5NC5jb25uZWN0KCBncmFwaC5hZGQ0LCAwLCAwICk7XG5cbiAgICAgICAgLy8gbXVsdGlwbHk1J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkNC5jb25uZWN0KCBncmFwaC5tdWx0aXBseTUsIDAsIDEgKTtcblxuICAgICAgICAvLyBhZGQ1J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5NS5jb25uZWN0KCBncmFwaC5hZGQ1LCAwLCAwICk7XG5cbiAgICAgICAgLy8gbXVsdGlwbHk2J3MgaW5wdXRzXG4gICAgICAgIHRoaXMuaW5wdXRzWzBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5NiwgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQ1LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5NiwgMCwgMSApO1xuXG4gICAgICAgIC8vIE91dHB1dCAoZmluYWxseSEhKVxuICAgICAgICBncmFwaC5tdWx0aXBseTYuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2luID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgU2luKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBUYW5nZW50IGFwcHJveGltYXRpb24hXG4vL1xuLy8gT25seSB3b3JrcyBpbiByYW5nZSBvZiAtTWF0aC5QSSB0byBNYXRoLlBJLlxuLy9cbi8vIHNpbiggaW5wdXQgKSAvIGNvcyggaW5wdXQgKVxuY2xhc3MgVGFuIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIGdyYXBoLnNpbmUgPSB0aGlzLmlvLmNyZWF0ZVNpbigpO1xuICAgICAgICBncmFwaC5jb3MgPSB0aGlzLmlvLmNyZWF0ZUNvcygpO1xuICAgICAgICBncmFwaC5kaXZpZGUgPSB0aGlzLmlvLmNyZWF0ZURpdmlkZSggdW5kZWZpbmVkLCBNYXRoLlBJICogMiApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2luZSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmNvcyApO1xuICAgICAgICBncmFwaC5zaW5lLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5jb3MuY29ubmVjdCggZ3JhcGguZGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGguZGl2aWRlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cblxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVRhbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFRhbiggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IENPTkZJRyBmcm9tIFwiLi4vY29yZS9jb25maWcuZXM2XCI7XG5cbmZ1bmN0aW9uIFBpbmtOdW1iZXIoKSB7XG4gICAgdGhpcy5tYXhLZXkgPSAweDFmO1xuICAgIHRoaXMua2V5ID0gMDtcbiAgICB0aGlzLndoaXRlVmFsdWVzID0gW107XG4gICAgdGhpcy5yYW5nZSA9IDEyODtcbiAgICB0aGlzLmxpbWl0ID0gNTtcblxuICAgIHRoaXMuZ2VuZXJhdGUgPSB0aGlzLmdlbmVyYXRlLmJpbmQoIHRoaXMgKTtcbiAgICB0aGlzLmdldE5leHRWYWx1ZSA9IHRoaXMuZ2V0TmV4dFZhbHVlLmJpbmQoIHRoaXMgKTtcbn1cblxuUGlua051bWJlci5wcm90b3R5cGUuZ2VuZXJhdGUgPSBmdW5jdGlvbiggcmFuZ2UsIGxpbWl0ICkge1xuICAgIHRoaXMucmFuZ2UgPSByYW5nZSB8fCAxMjg7XG4gICAgdGhpcy5tYXhLZXkgPSAweDFmO1xuICAgIHRoaXMua2V5ID0gMDtcbiAgICB0aGlzLmxpbWl0ID0gbGltaXQgfHwgMTtcblxuXHR2YXIgcmFuZ2VMaW1pdCA9IHRoaXMucmFuZ2UgLyB0aGlzLmxpbWl0O1xuXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbWl0OyArK2kgKSB7XG4gICAgICAgIHRoaXMud2hpdGVWYWx1ZXNbIGkgXSA9IE1hdGgucmFuZG9tKCkgJSByYW5nZUxpbWl0O1xuICAgIH1cbn07XG5cblBpbmtOdW1iZXIucHJvdG90eXBlLmdldE5leHRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsYXN0S2V5ID0gdGhpcy5rZXksXG4gICAgICAgIHN1bSA9IDA7XG5cbiAgICArK3RoaXMua2V5O1xuXG4gICAgaWYoIHRoaXMua2V5ID4gdGhpcy5tYXhLZXkgKSB7XG4gICAgICAgIHRoaXMua2V5ID0gMDtcbiAgICB9XG5cbiAgICB2YXIgZGlmZiA9IHRoaXMubGFzdEtleSBeIHRoaXMua2V5O1xuICAgIHZhciByYW5nZUxpbWl0ID0gdGhpcy5yYW5nZSAvIHRoaXMubGltaXQ7XG5cbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubGltaXQ7ICsraSApIHtcbiAgICAgICAgaWYoIGRpZmYgJiAoMSA8PCBpKSApIHtcbiAgICAgICAgICAgIHRoaXMud2hpdGVWYWx1ZXNbIGkgXSA9IE1hdGgucmFuZG9tKCkgJSByYW5nZUxpbWl0O1xuICAgICAgICB9XG5cbiAgICAgICAgc3VtICs9IHRoaXMud2hpdGVWYWx1ZXNbIGkgXTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3VtIC8gdGhpcy5saW1pdDtcbn07XG5cbnZhciBwaW5rID0gbmV3IFBpbmtOdW1iZXIoKTtcbnBpbmsuZ2VuZXJhdGUoKTtcblxuXG5cblxuXG5leHBvcnQgZGVmYXVsdCB7XG5cdHJvdW5kRnJvbUVwc2lsb246IGZ1bmN0aW9uKCBuICkge1xuXHRcdGxldCByb3VuZGVkID0gTWF0aC5yb3VuZCggbiApO1xuXG5cdFx0aWYgKCByb3VuZGVkICUgbiA8IENPTkZJRy5lcHNpbG9uICkge1xuXHRcdFx0cmV0dXJuIHJvdW5kZWRcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4gbjtcblx0XHR9XG5cdH0sXG5cblx0cm91bmRUb011bHRpcGxlOiBmdW5jdGlvbiggbiwgbXVsdGlwbGUgKSB7XG5cdFx0cmV0dXJuIE1hdGguZmxvb3IoICggbiArIG11bHRpcGxlIC0gMSApIC8gbXVsdGlwbGUgKSAqIG11bHRpcGxlO1xuXHR9LFxuXG5cdGNsYW1wOiBmdW5jdGlvbiggdmFsdWUsIG1pbiwgbWF4ICkge1xuXHRcdHJldHVybiBNYXRoLm1pbiggbWF4LCBNYXRoLm1heCggdmFsdWUsIG1pbiApICk7XG5cdH0sXG5cblx0c2NhbGVOdW1iZXI6IGZ1bmN0aW9uKCBudW0sIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCApIHtcblx0XHRyZXR1cm4gKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgKSAqICggaGlnaE91dCAtIGxvd091dCApICsgbG93T3V0O1xuXHR9LFxuXG5cdHNjYWxlTnVtYmVyRXhwOiBmdW5jdGlvbiggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQsIGV4cCApIHtcblx0XHRpZiAoIHR5cGVvZiBleHAgIT09ICdudW1iZXInIHx8IGV4cCA9PT0gMSApIHtcblx0XHRcdHJldHVybiB0aGlzLnNjYWxlTnVtYmVyKCBudW0sIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCApO1xuXHRcdH1cblxuXHRcdGlmICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApID09PSAwICkge1xuXHRcdFx0cmV0dXJuIGxvd091dDtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSA+IDAgKSB7XG5cdFx0XHRcdHJldHVybiAoIGxvd091dCArICggaGlnaE91dCAtIGxvd091dCApICogTWF0aC5wb3coICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSwgZXhwICkgKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gKCBsb3dPdXQgKyAoIGhpZ2hPdXQgLSBsb3dPdXQgKSAqIC0oIE1hdGgucG93KCAoICggLW51bSArIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgKSwgZXhwICkgKSApO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHQvLyBBIHZlcnkgcG9vciBhcHByb3hpbWF0aW9uIG9mIGEgZ2F1c3NpYW4gcmFuZG9tIG51bWJlciBnZW5lcmF0b3IhXG5cdGdhdXNzaWFuUmFuZG9tOiBmdW5jdGlvbiggY3ljbGVzICkge1xuXHRcdGN5Y2xlcyA9IGN5Y2xlcyB8fCAxMDtcblxuXHRcdHZhciBuID0gMCxcblx0XHRcdGkgPSBjeWNsZXM7XG5cblx0XHR3aGlsZSggLS1pICkge1xuXHRcdFx0biArPSBNYXRoLnJhbmRvbSgpO1xuXHRcdH1cblxuXHRcdHJldHVybiBuIC8gY3ljbGVzO1xuXHR9LFxuXG5cdC8vIEZyb206XG5cdC8vIFx0aHR0cDovL3d3dy5tZXJlZGl0aGRvZGdlLmNvbS8yMDEyLzA1LzMwL2EtZ3JlYXQtbGl0dGxlLWphdmFzY3JpcHQtZnVuY3Rpb24tZm9yLWdlbmVyYXRpbmctcmFuZG9tLWdhdXNzaWFubm9ybWFsYmVsbC1jdXJ2ZS1udW1iZXJzL1xuXHRucmFuZDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHgxLFxuXHRcdFx0eDIsXG5cdFx0XHRyYWQsXG5cdFx0XHR5MTtcblxuXHRcdGRvIHtcblx0XHRcdHgxID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuXHRcdFx0eDIgPSAyICogTWF0aC5yYW5kb20oKSAtIDE7XG5cdFx0XHRyYWQgPSB4MSAqIHgxICsgeDIgKiB4Mjtcblx0XHR9IHdoaWxlKCByYWQgPj0gMSB8fCByYWQgPT09IDAgKTtcblxuXHRcdHZhciBjID0gTWF0aC5zcXJ0KCAtMiAqIE1hdGgubG9nKCByYWQgKSAvIHJhZCApO1xuXG5cdFx0cmV0dXJuICgoeDEgKiBjKSAvIDUpICogMC41ICsgMC41O1xuXHR9LFxuXG5cdGdlbmVyYXRlUGlua051bWJlcjogcGluay5nZW5lcmF0ZSxcblx0Z2V0TmV4dFBpbmtOdW1iZXI6IHBpbmsuZ2V0TmV4dFZhbHVlLFxuXG59OyIsImV4cG9ydCBkZWZhdWx0IHtcbiAgICBjbGVhblVwSW5PdXRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlucHV0cyxcbiAgICAgICAgICAgIG91dHB1dHM7XG5cbiAgICAgICAgaWYoIEFycmF5LmlzQXJyYXkoIHRoaXMuaW5wdXRzICkgKSB7XG4gICAgICAgICAgICBpbnB1dHMgPSB0aGlzLmlucHV0cztcblxuICAgICAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgaWYoIGlucHV0c1sgaSBdICYmIHR5cGVvZiBpbnB1dHNbIGkgXS5jbGVhblVwID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgICAgICBpbnB1dHNbIGkgXS5jbGVhblVwKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYoIGlucHV0c1sgaSBdICkge1xuICAgICAgICAgICAgICAgICAgICBpbnB1dHNbIGkgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaW5wdXRzWyBpIF0gPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmlucHV0cyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiggQXJyYXkuaXNBcnJheSggdGhpcy5vdXRwdXRzICkgKSB7XG4gICAgICAgICAgICBvdXRwdXRzID0gdGhpcy5vdXRwdXRzO1xuXG4gICAgICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IG91dHB1dHMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgaWYoIG91dHB1dHNbIGkgXSAmJiB0eXBlb2Ygb3V0cHV0c1sgaSBdLmNsZWFuVXAgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dHNbIGkgXS5jbGVhblVwKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYoIG91dHB1dHNbIGkgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0c1sgaSBdLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBvdXRwdXRzWyBpIF0gPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLm91dHB1dHMgPSBudWxsO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNsZWFuSU86IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiggdGhpcy5pbyApIHtcbiAgICAgICAgICAgIHRoaXMuaW8gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIHRoaXMuY29udGV4dCApIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59OyIsInZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIGNvbm5lY3Q6IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCApIHtcbiAgICAgICAgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9QYXJhbSB8fCBub2RlIGluc3RhbmNlb2YgQXVkaW9Ob2RlICkge1xuICAgICAgICAgICAgLy8gdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0uY29ubmVjdCggbm9kZSApO1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0uY29ubmVjdC5jYWxsKCB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXSwgbm9kZSwgMCwgaW5wdXRDaGFubmVsICk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICggbm9kZSAmJiBub2RlLm91dHB1dHMgJiYgbm9kZS5vdXRwdXRzLmxlbmd0aCApIHtcbiAgICAgICAgICAgIC8vIGlmKCBub2RlLmlucHV0c1sgaW5wdXRDaGFubmVsIF0gaW5zdGFuY2VvZiBQYXJhbSApIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAnQ09OTkVDVElORyBUTyBQQVJBTScgKTtcbiAgICAgICAgICAgIC8vIG5vZGUuaW8uY29uc3RhbnREcml2ZXIuZGlzY29ubmVjdCggbm9kZS5jb250cm9sICk7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmNvbm5lY3QoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnQVNTRVJUIE5PVCBSRUFDSEVEJyApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGRpc2Nvbm5lY3Q6IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCApIHtcbiAgICAgICAgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9QYXJhbSB8fCBub2RlIGluc3RhbmNlb2YgQXVkaW9Ob2RlICkge1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0uZGlzY29ubmVjdC5jYWxsKCB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXSwgbm9kZSwgMCwgaW5wdXRDaGFubmVsICk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICggbm9kZSAmJiBub2RlLmlucHV0cyAmJiBub2RlLmlucHV0cy5sZW5ndGggKSB7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXS5kaXNjb25uZWN0KCBub2RlLmlucHV0c1sgaW5wdXRDaGFubmVsIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKCBub2RlID09PSB1bmRlZmluZWQgJiYgdGhpcy5vdXRwdXRzICkge1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzLmZvckVhY2goIGZ1bmN0aW9uKCBuICkge1xuICAgICAgICAgICAgICAgIGlmICggbiAmJiB0eXBlb2Ygbi5kaXNjb25uZWN0ID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgICAgICBuLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9ICk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY2hhaW46IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZXMgPSBzbGljZS5jYWxsKCBhcmd1bWVudHMgKSxcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgbm9kZS5jb25uZWN0LmNhbGwoIG5vZGUsIG5vZGVzWyBpIF0gKTtcbiAgICAgICAgICAgIG5vZGUgPSBub2Rlc1sgaSBdO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGZhbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub2RlcyA9IHNsaWNlLmNhbGwoIGFyZ3VtZW50cyApLFxuICAgICAgICAgICAgbm9kZSA9IHRoaXM7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QuY2FsbCggbm9kZSwgbm9kZXNbIGkgXSApO1xuICAgICAgICB9XG4gICAgfVxufTsiLCJpbXBvcnQgbWF0aCBmcm9tIFwiLi9tYXRoLmVzNlwiO1xuaW1wb3J0IG5vdGVTdHJpbmdzIGZyb20gXCIuL25vdGVTdHJpbmdzLmVzNlwiO1xuaW1wb3J0IG5vdGVzIGZyb20gXCIuL25vdGVzLmVzNlwiO1xuaW1wb3J0IENPTkZJRyBmcm9tIFwiLi4vY29yZS9jb25maWcuZXM2XCI7XG5pbXBvcnQgbm90ZVJlZ0V4cCBmcm9tIFwiLi9ub3RlUmVnRXhwLmVzNlwiO1xuXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBzY2FsYXJUb0RiOiBmdW5jdGlvbiggc2NhbGFyICkge1xuICAgICAgICByZXR1cm4gMjAgKiAoIE1hdGgubG9nKCBzY2FsYXIgKSAvIE1hdGguTE4xMCApO1xuICAgIH0sXG4gICAgZGJUb1NjYWxhcjogZnVuY3Rpb24oIGRiICkge1xuICAgICAgICByZXR1cm4gTWF0aC5wb3coIDIsIGRiIC8gNiApO1xuICAgIH0sXG5cbiAgICBoelRvTUlESTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gbWF0aC5yb3VuZEZyb21FcHNpbG9uKCA2OSArIDEyICogTWF0aC5sb2cyKCB2YWx1ZSAvIDQ0MCApICk7XG4gICAgfSxcblxuICAgIGh6VG9Ob3RlOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb05vdGUoIHRoaXMuaHpUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgaHpUb01zOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIGlmICggdmFsdWUgPT09IDAgKSByZXR1cm4gMDtcbiAgICAgICAgcmV0dXJuIDEwMDAgLyB2YWx1ZTtcbiAgICB9LFxuXG4gICAgaHpUb0JQTTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5tc1RvQlBNKCB0aGlzLmh6VG9NcyggdmFsdWUgKSApO1xuICAgIH0sXG5cblxuXG4gICAgbWlkaVRvSHo6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KCAyLCAoIHZhbHVlIC0gNjkgKSAvIDEyICkgKiA0NDA7XG4gICAgfSxcblxuICAgIG1pZGlUb05vdGU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgbGV0IHZhbHVlcyA9ICggdmFsdWUgKyAnJyApLnNwbGl0KCAnLicgKSxcbiAgICAgICAgICAgIG5vdGVWYWx1ZSA9ICt2YWx1ZXNbIDAgXSxcbiAgICAgICAgICAgIGNlbnRzID0gKCB2YWx1ZXNbIDEgXSA/IHBhcnNlRmxvYXQoICcwLicgKyB2YWx1ZXNbIDEgXSwgMTAgKSA6IDAgKSAqIDEwMDtcblxuICAgICAgICBpZiAoIE1hdGguYWJzKCBjZW50cyApID49IDEwMCApIHtcbiAgICAgICAgICAgIG5vdGVWYWx1ZSArPSBjZW50cyAlIDEwMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByb290ID0gbm90ZVZhbHVlICUgMTIgfCAwLFxuICAgICAgICAgICAgb2N0YXZlID0gbm90ZVZhbHVlIC8gMTIgfCAwLFxuICAgICAgICAgICAgbm90ZU5hbWUgPSBub3RlU3RyaW5nc1sgcm9vdCBdO1xuXG4gICAgICAgIHJldHVybiBub3RlTmFtZSArICggb2N0YXZlICsgQ09ORklHLmxvd2VzdE9jdGF2ZSApICsgKCBjZW50cyA/ICcrJyArIGNlbnRzIDogJycgKTtcbiAgICB9LFxuXG4gICAgbWlkaVRvTXM6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaHpUb01zKCB0aGlzLm1pZGlUb0h6KCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIG1pZGlUb0JQTTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5tc1RvQlBNKCB0aGlzLm1pZGlUb01zKCB2YWx1ZSApICk7XG4gICAgfSxcblxuXG5cbiAgICBub3RlVG9IejogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9IeiggdGhpcy5ub3RlVG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIG5vdGVUb01JREk6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgbGV0IG1hdGNoZXMgPSBub3RlUmVnRXhwLmV4ZWMoIHZhbHVlICksXG4gICAgICAgICAgICBub3RlLCBhY2NpZGVudGFsLCBvY3RhdmUsIGNlbnRzLFxuICAgICAgICAgICAgbm90ZVZhbHVlO1xuXG4gICAgICAgIGlmICggIW1hdGNoZXMgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdJbnZhbGlkIG5vdGUgZm9ybWF0OicsIHZhbHVlICk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBub3RlID0gbWF0Y2hlc1sgMSBdO1xuICAgICAgICBhY2NpZGVudGFsID0gbWF0Y2hlc1sgMiBdO1xuICAgICAgICBvY3RhdmUgPSBwYXJzZUludCggbWF0Y2hlc1sgMyBdLCAxMCApICsgLUNPTkZJRy5sb3dlc3RPY3RhdmU7XG4gICAgICAgIGNlbnRzID0gcGFyc2VGbG9hdCggbWF0Y2hlc1sgNCBdICkgfHwgMDtcblxuICAgICAgICBub3RlVmFsdWUgPSBub3Rlc1sgbm90ZSArIGFjY2lkZW50YWwgXTtcblxuICAgICAgICByZXR1cm4gbWF0aC5yb3VuZEZyb21FcHNpbG9uKCBub3RlVmFsdWUgKyAoIG9jdGF2ZSAqIDEyICkgKyAoIGNlbnRzICogMC4wMSApICk7XG4gICAgfSxcblxuICAgIG5vdGVUb01zOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb01zKCB0aGlzLm5vdGVUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbm90ZVRvQlBNOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb0JQTSggdGhpcy5ub3RlVG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuXG5cbiAgICBtc1RvSHo6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaHpUb01zKCB2YWx1ZSApO1xuICAgIH0sXG5cbiAgICBtc1RvTm90ZTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9NcyggdGhpcy5ub3RlVG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIG1zVG9NSURJOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmh6VG9NSURJKCB0aGlzLm1zVG9IeiggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBtc1RvQlBNOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IDAgOiA2MDAwMCAvIHZhbHVlO1xuICAgIH0sXG5cblxuXG4gICAgYnBtVG9IejogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5tc1RvSHooIHRoaXMuYnBtVG9NcyggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBicG1Ub05vdGU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvQlBNKCB0aGlzLm5vdGVUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgYnBtVG9NSURJOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zVG9NSURJKCB0aGlzLmJwbVRvTXMoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgYnBtVG9NczogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5tc1RvQlBNKCB2YWx1ZSApO1xuICAgIH1cbn07IiwiaW1wb3J0IENPTkZJRyBmcm9tIFwiLi4vY29yZS9jb25maWcuZXM2XCI7XG5cbmZ1bmN0aW9uIFBpbmtOdW1iZXIoKSB7XG4gICAgdGhpcy5tYXhLZXkgPSAweDFmO1xuICAgIHRoaXMua2V5ID0gMDtcbiAgICB0aGlzLndoaXRlVmFsdWVzID0gW107XG4gICAgdGhpcy5yYW5nZSA9IDEyODtcbiAgICB0aGlzLmxpbWl0ID0gNTtcblxuICAgIHRoaXMuZ2VuZXJhdGUgPSB0aGlzLmdlbmVyYXRlLmJpbmQoIHRoaXMgKTtcbiAgICB0aGlzLmdldE5leHRWYWx1ZSA9IHRoaXMuZ2V0TmV4dFZhbHVlLmJpbmQoIHRoaXMgKTtcbn1cblxuUGlua051bWJlci5wcm90b3R5cGUuZ2VuZXJhdGUgPSBmdW5jdGlvbiggcmFuZ2UsIGxpbWl0ICkge1xuICAgIHRoaXMucmFuZ2UgPSByYW5nZSB8fCAxMjg7XG4gICAgdGhpcy5tYXhLZXkgPSAweDFmO1xuICAgIHRoaXMua2V5ID0gMDtcbiAgICB0aGlzLmxpbWl0ID0gbGltaXQgfHwgMTtcblxuXHR2YXIgcmFuZ2VMaW1pdCA9IHRoaXMucmFuZ2UgLyB0aGlzLmxpbWl0O1xuXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbWl0OyArK2kgKSB7XG4gICAgICAgIHRoaXMud2hpdGVWYWx1ZXNbIGkgXSA9IE1hdGgucmFuZG9tKCkgJSByYW5nZUxpbWl0O1xuICAgIH1cbn07XG5cblBpbmtOdW1iZXIucHJvdG90eXBlLmdldE5leHRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsYXN0S2V5ID0gdGhpcy5rZXksXG4gICAgICAgIHN1bSA9IDA7XG5cbiAgICArK3RoaXMua2V5O1xuXG4gICAgaWYoIHRoaXMua2V5ID4gdGhpcy5tYXhLZXkgKSB7XG4gICAgICAgIHRoaXMua2V5ID0gMDtcbiAgICB9XG5cbiAgICB2YXIgZGlmZiA9IHRoaXMubGFzdEtleSBeIHRoaXMua2V5O1xuICAgIHZhciByYW5nZUxpbWl0ID0gdGhpcy5yYW5nZSAvIHRoaXMubGltaXQ7XG5cbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubGltaXQ7ICsraSApIHtcbiAgICAgICAgaWYoIGRpZmYgJiAoMSA8PCBpKSApIHtcbiAgICAgICAgICAgIHRoaXMud2hpdGVWYWx1ZXNbIGkgXSA9IE1hdGgucmFuZG9tKCkgJSByYW5nZUxpbWl0O1xuICAgICAgICB9XG5cbiAgICAgICAgc3VtICs9IHRoaXMud2hpdGVWYWx1ZXNbIGkgXTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3VtIC8gdGhpcy5saW1pdDtcbn07XG5cbnZhciBwaW5rID0gbmV3IFBpbmtOdW1iZXIoKTtcbnBpbmsuZ2VuZXJhdGUoKTtcblxuXG5cblxuXG5leHBvcnQgZGVmYXVsdCB7XG5cdHJvdW5kRnJvbUVwc2lsb246IGZ1bmN0aW9uKCBuICkge1xuXHRcdGxldCByb3VuZGVkID0gTWF0aC5yb3VuZCggbiApO1xuXG5cdFx0aWYgKCByb3VuZGVkICUgbiA8IENPTkZJRy5lcHNpbG9uICkge1xuXHRcdFx0cmV0dXJuIHJvdW5kZWRcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4gbjtcblx0XHR9XG5cdH0sXG5cblx0cm91bmRUb011bHRpcGxlOiBmdW5jdGlvbiggbiwgbXVsdGlwbGUgKSB7XG5cdFx0cmV0dXJuIE1hdGguZmxvb3IoICggbiArIG11bHRpcGxlIC0gMSApIC8gbXVsdGlwbGUgKSAqIG11bHRpcGxlO1xuXHR9LFxuXG5cdGNsYW1wOiBmdW5jdGlvbiggdmFsdWUsIG1pbiwgbWF4ICkge1xuXHRcdHJldHVybiBNYXRoLm1pbiggbWF4LCBNYXRoLm1heCggdmFsdWUsIG1pbiApICk7XG5cdH0sXG5cblx0c2NhbGVOdW1iZXI6IGZ1bmN0aW9uKCBudW0sIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCApIHtcblx0XHRyZXR1cm4gKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgKSAqICggaGlnaE91dCAtIGxvd091dCApICsgbG93T3V0O1xuXHR9LFxuXG5cdHNjYWxlTnVtYmVyRXhwOiBmdW5jdGlvbiggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQsIGV4cCApIHtcblx0XHRpZiAoIHR5cGVvZiBleHAgIT09ICdudW1iZXInIHx8IGV4cCA9PT0gMSApIHtcblx0XHRcdHJldHVybiB0aGlzLnNjYWxlTnVtYmVyKCBudW0sIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCApO1xuXHRcdH1cblxuXHRcdGlmICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApID09PSAwICkge1xuXHRcdFx0cmV0dXJuIGxvd091dDtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSA+IDAgKSB7XG5cdFx0XHRcdHJldHVybiAoIGxvd091dCArICggaGlnaE91dCAtIGxvd091dCApICogTWF0aC5wb3coICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSwgZXhwICkgKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gKCBsb3dPdXQgKyAoIGhpZ2hPdXQgLSBsb3dPdXQgKSAqIC0oIE1hdGgucG93KCAoICggLW51bSArIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgKSwgZXhwICkgKSApO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHQvLyBBIHZlcnkgcG9vciBhcHByb3hpbWF0aW9uIG9mIGEgZ2F1c3NpYW4gcmFuZG9tIG51bWJlciBnZW5lcmF0b3IhXG5cdGdhdXNzaWFuUmFuZG9tOiBmdW5jdGlvbiggY3ljbGVzICkge1xuXHRcdGN5Y2xlcyA9IGN5Y2xlcyB8fCAxMDtcblxuXHRcdHZhciBuID0gMCxcblx0XHRcdGkgPSBjeWNsZXM7XG5cblx0XHR3aGlsZSggLS1pICkge1xuXHRcdFx0biArPSBNYXRoLnJhbmRvbSgpO1xuXHRcdH1cblxuXHRcdHJldHVybiBuIC8gY3ljbGVzO1xuXHR9LFxuXG5cdC8vIEZyb206XG5cdC8vIFx0aHR0cDovL3d3dy5tZXJlZGl0aGRvZGdlLmNvbS8yMDEyLzA1LzMwL2EtZ3JlYXQtbGl0dGxlLWphdmFzY3JpcHQtZnVuY3Rpb24tZm9yLWdlbmVyYXRpbmctcmFuZG9tLWdhdXNzaWFubm9ybWFsYmVsbC1jdXJ2ZS1udW1iZXJzL1xuXHRucmFuZDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHgxLFxuXHRcdFx0eDIsXG5cdFx0XHRyYWQsXG5cdFx0XHR5MTtcblxuXHRcdGRvIHtcblx0XHRcdHgxID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuXHRcdFx0eDIgPSAyICogTWF0aC5yYW5kb20oKSAtIDE7XG5cdFx0XHRyYWQgPSB4MSAqIHgxICsgeDIgKiB4Mjtcblx0XHR9IHdoaWxlKCByYWQgPj0gMSB8fCByYWQgPT09IDAgKTtcblxuXHRcdHZhciBjID0gTWF0aC5zcXJ0KCAtMiAqIE1hdGgubG9nKCByYWQgKSAvIHJhZCApO1xuXG5cdFx0cmV0dXJuICgoeDEgKiBjKSAvIDUpICogMC41ICsgMC41O1xuXHR9LFxuXG5cdGdlbmVyYXRlUGlua051bWJlcjogcGluay5nZW5lcmF0ZSxcblx0Z2V0TmV4dFBpbmtOdW1iZXI6IHBpbmsuZ2V0TmV4dFZhbHVlLFxuXG59OyIsImV4cG9ydCBkZWZhdWx0IC9eKFtBfEJ8Q3xEfEV8RnxHXXsxfSkoWyNieF17MCwyfSkoW1xcLVxcK10/XFxkKyk/KFtcXCt8XFwtXXsxfVxcZCouXFxkKik/LzsiLCJleHBvcnQgZGVmYXVsdCBbICdDJywgJ0MjJywgJ0QnLCAnRCMnLCAnRScsICdGJywgJ0YjJywgJ0cnLCAnRyMnLCAnQScsICdBIycsICdCJyBdOyIsImV4cG9ydCBkZWZhdWx0IHtcbiAgICAnQyc6IDAsICAgICAnRGJiJzogMCwgICAnQiMnOiAwLFxuICAgICdDIyc6IDEsICAgICdEYic6IDEsICAgICdCIyMnOiAxLCAgICdCeCc6IDEsXG4gICAgJ0QnOiAyLCAgICAgJ0ViYic6IDIsICAgJ0MjIyc6IDIsICAgJ0N4JzogMixcbiAgICAnRCMnOiAzLCAgICAnRWInOiAzLCAgICAnRmJiJzogMyxcbiAgICAnRSc6IDQsICAgICAnRmInOiA0LCAgICAnRCMjJzogNCwgICAnRHgnOiA0LFxuICAgICdGJzogNSwgICAgICdHYmInOiA1LCAgICdFIyc6IDUsXG4gICAgJ0YjJzogNiwgICAgJ0diJzogNiwgICAgJ0UjIyc6IDYsICAgJ0V4JzogNixcbiAgICAnRyc6IDcsICAgICAnQWJiJzogNywgICAnRiMjJzogNywgICdGeCc6IDcsXG4gICAgJ0cjJzogOCwgICAgJ0FiJzogOCxcbiAgICAnQSc6IDksICAgICAnQmJiJzogOSwgICAnRyMjJzogOSwgICdHeCc6IDksXG4gICAgJ0EjJzogMTAsICAgJ0JiJzogMTAsICAgJ0NiYic6IDEwLFxuICAgICdCJzogMTEsICAgICdDYic6IDExLCAgICdBIyMnOiAxMSwgJ0F4JzogMTFcbn07IiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gX3NldElPKCBpbyApIHtcbiAgICB0aGlzLmlvID0gaW87XG4gICAgdGhpcy5jb250ZXh0ID0gaW8uY29udGV4dDtcbn07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5pbXBvcnQgQnVmZmVyR2VuZXJhdG9ycyBmcm9tIFwiLi4vYnVmZmVycy9CdWZmZXJHZW5lcmF0b3JzLmVzNlwiO1xuXG4vLyBUT0RPOlxuLy8gXHQtIElzc3VlIHdpdGggcGxheWJhY2sgcmF0ZSBub3QgaGF2aW5nIGEgd2lkZSBlbm91Z2ggcmFuZ2Vcbi8vIFx0ICB0byBzdXBwb3J0IHRoZSBmdWxsIGZyZXF1ZW5jeSByYW5nZS5cbi8vIFx0ICBcbi8vIFx0LSBGaXg6XG4vLyBcdFx0LSBDcmVhdGUgbXVsdGlwbGUgYnVmZmVyIHNvdXJjZXMgYXR0YWNoZWQgdG8gYSBzd2l0Y2guXG4vLyBcdFx0LSBOdW1iZXIgb2Ygc291cmNlczogXG4vLyBcdFx0XHRBdmFpbGFibGUgcmFuZ2U6IDEwMjQgXG4vLyBcdFx0XHRcdCogLTUxMiB0byArNTEyIGlzIGEgZmFpciBiYWxhbmNlIGJldHdlZW4gcmFuZ2UgYW5kIFxuLy8gXHRcdFx0XHRhcnRpZmFjdHMgb24gZGlmZmVyZW50IGJyb3dzZXJzLCBGaXJlZm94IGhhdmluZyBpc3N1ZXNcbi8vIFx0XHRcdFx0YXJvdW5kIHRoZSArODAwIG1hcmssIENocm9tZSBzdG9wcyBpbmNyZWFzaW5nIFxuLy8gXHRcdFx0XHRhZnRlciBhcm91bmQgKzEwMDAuIFNhZmFyaSBpcyBqdXN0IGJyb2tlbjogcGxheWJhY2tSYXRlIFxuLy8gXHRcdFx0XHRBdWRpb1BhcmFtIGNhbm5vdCBiZSBkcml2ZW4gYnkgYXVkaW8gc2lnbmFsLiBXYXQuXG4vLyBcdFx0XHRNYXggZnJlcTogc2FtcGxlUmF0ZSAqIDAuNVxuLy8gXHRcdFx0XG4vLyBcdFx0XHRudW1Tb3VyY2VzOiBNYXRoLmNlaWwoIG1heEZyZXEgLyBhdmFpbGFibGVSYW5nZSApXG4vLyBcdFx0XHRcdFxuLy8gXHRcdFx0YnJlYWtwb2ludHM6IGkgKiBtYXhGcmVxXG4vLyBcdFx0XHRpbml0aWFsIHZhbHVlIG9mIHBsYXliYWNrUmF0ZTogLTUxMi5cbi8vIFx0XHRcdFxuLy8gXHRcdC0gRm9yIHNhbXBsZVJhdGUgb2YgNDgwMDA6XG4vLyBcdFx0XHRudW1Tb3VyY2VzOiBNYXRoLmNlaWwoICg0ODAwMCAqIDAuNSkgLyAxMDI0ICkgPSAyNC5cbi8vIFx0XHRcdFxuLy8gXHRcdFx0XG4vLyAgLSBNYWpvciBkb3duc2lkZTogbWFueSwgbWFueSBidWZmZXJTb3VyY2VzIHdpbGwgYmUgY3JlYXRlZFxuLy8gICAgZWFjaCB0aW1lIGBzdGFydCgpYCBpcyBjYWxsZWQuIFxuLy8gXHRcdFx0XG4vL1xuY2xhc3MgQnVmZmVyT3NjaWxsYXRvciBleHRlbmRzIE5vZGUge1xuXHRjb25zdHJ1Y3RvciggaW8sIGdlbmVyYXRvciApIHtcblx0XHRzdXBlciggaW8sIDAsIDEgKTtcblxuXHRcdHRoaXMuZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuXHRcdHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXHRcdHRoaXMuY29udHJvbHMuZGV0dW5lID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG5cdFx0dGhpcy5yZXNldCgpO1xuXHR9XG5cblx0c3RhcnQoIHdoZW4sIHBoYXNlICkge1xuXHRcdHZhciBidWZmZXIgPSB0aGlzLmdlbmVyYXRvciggdGhpcy5pbywgMSwgdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUsIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlICksXG5cdFx0XHRidWZmZXJTb3VyY2U7XG5cblx0XHR0aGlzLnJlc2V0KCk7XG5cblx0XHRidWZmZXJTb3VyY2UgPSB0aGlzLmdldEdyYXBoKCkuYnVmZmVyU291cmNlO1xuXHRcdGJ1ZmZlclNvdXJjZS5idWZmZXIgPSBidWZmZXI7XG5cdFx0YnVmZmVyU291cmNlLnN0YXJ0KCB3aGVuLCBwaGFzZSApO1xuXHRcdGNvbnNvbGUubG9nKCBidWZmZXJTb3VyY2UgKTtcblx0fVxuXG5cdHN0b3AoIHdoZW4gKSB7XG5cdFx0dmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpLFxuXHRcdFx0YnVmZmVyU291cmNlID0gZ3JhcGguYnVmZmVyU291cmNlLFxuXHRcdFx0c2VsZiA9IHRoaXM7XG5cblx0XHRidWZmZXJTb3VyY2Uuc3RvcCggd2hlbiApO1xuXHR9XG5cblx0cmVzZXQoKSB7XG5cdFx0dmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG5cdFx0Z3JhcGguYnVmZmVyU291cmNlID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuXHRcdGdyYXBoLmJ1ZmZlclNvdXJjZS5sb29wID0gdHJ1ZTtcblx0XHRncmFwaC5idWZmZXJTb3VyY2UucGxheWJhY2tSYXRlLnZhbHVlID0gMDtcblx0XHRncmFwaC5idWZmZXJTb3VyY2UuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuXHRcdHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmJ1ZmZlclNvdXJjZS5wbGF5YmFja1JhdGUgKTtcblxuXHRcdGlmICggZ3JhcGguYnVmZmVyU291cmNlLmRldHVuZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gKSB7XG5cdFx0XHR0aGlzLmNvbnRyb2xzLmRldHVuZS5jb25uZWN0KCBncmFwaC5idWZmZXJTb3VyY2UuZGV0dW5lICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcblx0fVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVCdWZmZXJPc2NpbGxhdG9yID0gZnVuY3Rpb24oIGdlbmVyYXRvciApIHtcblx0cmV0dXJuIG5ldyBCdWZmZXJPc2NpbGxhdG9yKCB0aGlzLCBnZW5lcmF0b3IgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE9zY2lsbGF0b3JCYW5rIGZyb20gXCIuLi9vc2NpbGxhdG9ycy9Pc2NpbGxhdG9yQmFuay5lczZcIjtcblxuY2xhc3MgRk1Pc2NpbGxhdG9yIGV4dGVuZHMgT3NjaWxsYXRvckJhbmsge1xuXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCB0aGlzICk7XG5cbiAgICAgICAgLy8gRk0vbW9kdWxhdG9yIG9zY2lsbGF0b3Igc2V0dXBcbiAgICAgICAgZ3JhcGguZm1Pc2NpbGxhdG9yID0gdGhpcy5pby5jcmVhdGVPc2NpbGxhdG9yQmFuaygpO1xuICAgICAgICBncmFwaC5mbU9zY0Ftb3VudCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmZtT3NjQW1vdW50TXVsdGlwbGllciA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGguZm1Pc2NBbW91bnQuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmZtT3NjaWxsYXRvci5jb25uZWN0KCBncmFwaC5mbU9zY0Ftb3VudCApO1xuICAgICAgICBncmFwaC5mbU9zY0Ftb3VudC5jb25uZWN0KCBncmFwaC5mbU9zY0Ftb3VudE11bHRpcGxpZXIsIDAsIDAgKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtRnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtRnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmZtT3NjaWxsYXRvci5jb250cm9scy5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mbUZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5mbU9zY0Ftb3VudE11bHRpcGxpZXIsIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtV2F2ZWZvcm0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1XYXZlZm9ybS5jb25uZWN0KCBncmFwaC5mbU9zY2lsbGF0b3IuY29udHJvbHMud2F2ZWZvcm0gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtT3NjQW1vdW50ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtT3NjQW1vdW50LmNvbm5lY3QoIGdyYXBoLmZtT3NjQW1vdW50LmdhaW4gKTtcblxuXG4gICAgICAgIC8vIFNlbGYtZm0gc2V0dXBcbiAgICAgICAgZ3JhcGguZm1TZWxmQW1vdW50cyA9IFtdO1xuICAgICAgICBncmFwaC5mbVNlbGZBbW91bnRNdWx0aXBsaWVycyA9IFtdO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtU2VsZkFtb3VudCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IGdyYXBoLm9zY2lsbGF0b3JzLmxlbmd0aDsgKytpICkge1xuICAgICAgICBcdC8vIENvbm5lY3QgRk0gb3NjaWxsYXRvciB0byB0aGUgZXhpc3Rpbmcgb3NjaWxsYXRvcnNcbiAgICAgICAgXHQvLyBmcmVxdWVuY3kgY29udHJvbC5cbiAgICAgICAgXHRncmFwaC5mbU9zY0Ftb3VudE11bHRpcGxpZXIuY29ubmVjdCggZ3JhcGgub3NjaWxsYXRvcnNbIGkgXS5mcmVxdWVuY3kgKTtcblxuXG4gICAgICAgIFx0Ly8gRm9yIGVhY2ggb3NjaWxsYXRvciBpbiB0aGUgb3NjaWxsYXRvciBiYW5rLFxuICAgICAgICBcdC8vIGNyZWF0ZSBhIEZNLXNlbGYgR2Fpbk5vZGUsIGFuZCBjb25uZWN0IHRoZSBvc2NcbiAgICAgICAgXHQvLyB0byBpdCwgdGhlbiBpdCB0byB0aGUgb3NjJ3MgZnJlcXVlbmN5LlxuICAgICAgICBcdGdyYXBoLmZtU2VsZkFtb3VudHNbIGkgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIFx0Z3JhcGguZm1TZWxmQW1vdW50c1sgaSBdLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIFx0Z3JhcGguZm1TZWxmQW1vdW50TXVsdGlwbGllcnNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgXHRncmFwaC5mbVNlbGZBbW91bnRzWyBpIF0uY29ubmVjdCggZ3JhcGguZm1TZWxmQW1vdW50TXVsdGlwbGllcnNbIGkgXSwgMCwgMCApO1xuICAgICAgICBcdHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmZtU2VsZkFtb3VudE11bHRpcGxpZXJzWyBpIF0sIDAsIDEgKTtcblxuICAgICAgICBcdGdyYXBoLm9zY2lsbGF0b3JzWyBpIF0uY29ubmVjdCggZ3JhcGguZm1TZWxmQW1vdW50c1sgaSBdICk7XG4gICAgICAgIFx0Z3JhcGguZm1TZWxmQW1vdW50TXVsdGlwbGllcnNbIGkgXS5jb25uZWN0KCBncmFwaC5vc2NpbGxhdG9yc1sgaSBdLmZyZXF1ZW5jeSApO1xuXG4gICAgICAgIFx0Ly8gTWFrZSBzdXJlIHRoZSBGTS1zZWxmIGFtb3VudCBpcyBjb250cm9sbGFibGUgd2l0aCBvbmUgcGFyYW1ldGVyLlxuICAgICAgICBcdHRoaXMuY29udHJvbHMuZm1TZWxmQW1vdW50LmNvbm5lY3QoIGdyYXBoLmZtU2VsZkFtb3VudHNbIGkgXS5nYWluICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRk1Pc2NpbGxhdG9yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBGTU9zY2lsbGF0b3IoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcbmltcG9ydCBtYXRoIGZyb20gXCIuLi9taXhpbnMvbWF0aC5lczZcIjtcblxuXG52YXIgQlVGRkVSUyA9IG5ldyBXZWFrTWFwKCk7XG5cbmNsYXNzIE5vaXNlT3NjaWxsYXRvckJhbmsgZXh0ZW5kcyBOb2RlIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoIHRoaXMgKSxcbiAgICAgICAgICAgIHR5cGVzID0gdGhpcy5jb25zdHJ1Y3Rvci50eXBlcyxcbiAgICAgICAgICAgIHR5cGVLZXlzID0gT2JqZWN0LmtleXMoIHR5cGVzICksXG4gICAgICAgICAgICBidWZmZXJzID0gdGhpcy5fZ2V0QnVmZmVycygpO1xuXG4gICAgICAgIGdyYXBoLmJ1ZmZlclNvdXJjZXMgPSBbXTtcbiAgICAgICAgZ3JhcGgub3V0cHV0R2FpbiA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIE9iamVjdC5rZXlzKCB0eXBlcyApLmxlbmd0aCwgMCApO1xuICAgICAgICBncmFwaC5vdXRwdXRHYWluLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHR5cGVLZXlzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKSxcbiAgICAgICAgICAgICAgICBidWZmZXIgPSBidWZmZXJzWyB0eXBlS2V5c1sgaSBdIF07XG5cbiAgICAgICAgICAgIHNvdXJjZS5idWZmZXIgPSBidWZmZXI7XG4gICAgICAgICAgICBzb3VyY2UubG9vcCA9IHRydWU7XG4gICAgICAgICAgICBzb3VyY2Uuc3RhcnQoIDAgKTtcblxuICAgICAgICAgICAgc291cmNlLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXIsIDAsIGkgKTtcbiAgICAgICAgICAgIGdyYXBoLmJ1ZmZlclNvdXJjZXMucHVzaCggc291cmNlICk7XG4gICAgICAgIH1cblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyLmNvbm5lY3QoIGdyYXBoLm91dHB1dEdhaW4gKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0R2Fpbi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudHlwZSA9IGdyYXBoLmNyb3NzZmFkZXIuY29udHJvbHMuaW5kZXg7XG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgX2NyZWF0ZVNpbmdsZUJ1ZmZlciggdHlwZSApIHtcbiAgICAgICAgdmFyIHNhbXBsZVJhdGUgPSB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSxcbiAgICAgICAgICAgIGJ1ZmZlciA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIoIDEsIHNhbXBsZVJhdGUsIHNhbXBsZVJhdGUgKSxcbiAgICAgICAgICAgIGNoYW5uZWwgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIDAgKSxcbiAgICAgICAgICAgIGZuO1xuXG4gICAgICAgIHN3aXRjaCAoIHR5cGUgKSB7XG4gICAgICAgICAgICBjYXNlICdXSElURSc6XG4gICAgICAgICAgICAgICAgZm4gPSBNYXRoLnJhbmRvbTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnR0FVU1NJQU5fV0hJVEUnOlxuICAgICAgICAgICAgICAgIGZuID0gbWF0aC5ucmFuZDtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnUElOSyc6XG4gICAgICAgICAgICAgICAgbWF0aC5nZW5lcmF0ZVBpbmtOdW1iZXIoIDEyOCwgNSApO1xuICAgICAgICAgICAgICAgIGZuID0gbWF0aC5nZXROZXh0UGlua051bWJlcjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHNhbXBsZVJhdGU7ICsraSApIHtcbiAgICAgICAgICAgIGNoYW5uZWxbIGkgXSA9IGZuKCkgKiAyIC0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCB0eXBlLCBNYXRoLm1pbi5hcHBseSggTWF0aCwgY2hhbm5lbCApLCBNYXRoLm1heC5hcHBseSggTWF0aCwgY2hhbm5lbCApICk7XG5cbiAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcbiAgICB9XG5cbiAgICBfY3JlYXRlQnVmZmVycygpIHtcbiAgICAgICAgdmFyIGJ1ZmZlcnMgPSB7fSxcbiAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyggYnVmZmVycyApLFxuICAgICAgICAgICAgdHlwZXMgPSB0aGlzLmNvbnN0cnVjdG9yLnR5cGVzLFxuICAgICAgICAgICAgdHlwZUtleXMgPSBPYmplY3Qua2V5cyggdHlwZXMgKSxcbiAgICAgICAgICAgIGJ1ZmZlcjtcblxuICAgICAgICAvLyBCdWZmZXJzIGFscmVhZHkgY3JlYXRlZC4gU3RvcCBoZXJlLlxuICAgICAgICBpZiAoIGtleXMubGVuZ3RoICE9PSAwICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdHlwZUtleXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICBidWZmZXJzWyB0eXBlS2V5c1sgaSBdIF0gPSB0aGlzLl9jcmVhdGVTaW5nbGVCdWZmZXIoIHR5cGVLZXlzWyBpIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3NldEJ1ZmZlcnMoIGJ1ZmZlcnMgKTtcbiAgICB9XG5cbiAgICBfZ2V0QnVmZmVycygpIHtcbiAgICAgICAgdmFyIGJ1ZmZlcnMgPSBCVUZGRVJTLmdldCggdGhpcy5pbyApO1xuXG4gICAgICAgIGlmICggYnVmZmVycyA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgdGhpcy5fY3JlYXRlQnVmZmVycygpO1xuICAgICAgICAgICAgYnVmZmVycyA9IEJVRkZFUlMuZ2V0KCB0aGlzLmlvICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYnVmZmVycztcbiAgICB9XG5cbiAgICBfc2V0QnVmZmVycyggYnVmZmVycyApIHtcbiAgICAgICAgQlVGRkVSUy5zZXQoIHRoaXMuaW8sIGJ1ZmZlcnMgKTtcbiAgICB9XG5cbiAgICBzdGFydCggdGltZSApIHtcbiAgICAgICAgdmFyIG91dHB1dEdhaW4gPSB0aGlzLmdldEdyYXBoKCB0aGlzICkub3V0cHV0R2FpbjtcblxuICAgICAgICB0aW1lID0gdGltZSB8fCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWU7XG4gICAgICAgIG91dHB1dEdhaW4uZ2Fpbi52YWx1ZSA9IDE7XG4gICAgfVxuXG4gICAgc3RvcCggdGltZSApIHtcbiAgICAgICAgdmFyIG91dHB1dEdhaW4gPSB0aGlzLmdldEdyYXBoKCB0aGlzICkub3V0cHV0R2FpbjtcblxuICAgICAgICB0aW1lID0gdGltZSB8fCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWU7XG4gICAgICAgIG91dHB1dEdhaW4uZ2Fpbi52YWx1ZSA9IDA7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG59XG5cblxuTm9pc2VPc2NpbGxhdG9yQmFuay50eXBlcyA9IHtcbiAgICBXSElURTogMCxcbiAgICBHQVVTU0lBTl9XSElURTogMSxcbiAgICBQSU5LOiAyXG59O1xuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5vaXNlT3NjaWxsYXRvckJhbmsgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE5vaXNlT3NjaWxsYXRvckJhbmsoIHRoaXMgKTtcbn07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbnZhciBPU0NJTExBVE9SX1RZUEVTID0gW1xuICAgICdzaW5lJyxcbiAgICAndHJpYW5nbGUnLFxuICAgICdzYXd0b290aCcsXG4gICAgJ3NxdWFyZSdcbl07XG5cbmNsYXNzIE9zY2lsbGF0b3JCYW5rIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlciA9IHRoaXMuaW8uY3JlYXRlQ3Jvc3NmYWRlciggT1NDSUxMQVRPUl9UWVBFUy5sZW5ndGgsIDAgKTtcbiAgICAgICAgZ3JhcGgub3NjaWxsYXRvcnMgPSBbXTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5kZXR1bmUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMud2F2ZWZvcm0gPSBncmFwaC5jcm9zc2ZhZGVyLmNvbnRyb2xzLmluZGV4O1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgT1NDSUxMQVRPUl9UWVBFUy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHZhciBvc2MgPSB0aGlzLmNvbnRleHQuY3JlYXRlT3NjaWxsYXRvcigpO1xuXG4gICAgICAgICAgICBvc2MudHlwZSA9IE9TQ0lMTEFUT1JfVFlQRVNbIGkgXTtcbiAgICAgICAgICAgIG9zYy5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICAgICAgb3NjLnN0YXJ0KCAwICk7XG5cbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIG9zYy5mcmVxdWVuY3kgKTtcbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuZGV0dW5lLmNvbm5lY3QoIG9zYy5kZXR1bmUgKTtcbiAgICAgICAgICAgIG9zYy5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyLCAwLCBpICk7XG5cbiAgICAgICAgICAgIGdyYXBoLm9zY2lsbGF0b3JzLnB1c2goIG9zYyApO1xuICAgICAgICB9XG5cbiAgICAgICAgZ3JhcGgub3V0cHV0TGV2ZWwgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbC5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyLmNvbm5lY3QoIGdyYXBoLm91dHB1dExldmVsICk7XG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBzdGFydCggZGVsYXkgPSAwICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkub3V0cHV0TGV2ZWwuZ2Fpbi52YWx1ZSA9IDE7XG4gICAgfVxuXG4gICAgc3RvcCggZGVsYXkgPSAwICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkub3V0cHV0TGV2ZWwuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVPc2NpbGxhdG9yQmFuayA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT3NjaWxsYXRvckJhbmsoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IE9zY2lsbGF0b3JCYW5rOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbmNsYXNzIFNpbmVCYW5rIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1TaW5lcyA9IDQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5vc2NpbGxhdG9ycyA9IFtdO1xuICAgICAgICBncmFwaC5oYXJtb25pY011bHRpcGxpZXJzID0gW107XG4gICAgICAgIGdyYXBoLm51bVNpbmVzID0gbnVtU2luZXM7XG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0TGV2ZWwuZ2Fpbi52YWx1ZSA9IDEgLyBudW1TaW5lcztcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5kZXR1bmUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGFybW9uaWNzID0gW107XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgbnVtU2luZXM7ICsraSApIHtcbiAgICAgICAgICAgIHZhciBvc2MgPSB0aGlzLmNvbnRleHQuY3JlYXRlT3NjaWxsYXRvcigpLFxuICAgICAgICAgICAgICAgIGhhcm1vbmljQ29udHJvbCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKSxcbiAgICAgICAgICAgICAgICBoYXJtb25pY011bHRpcGxpZXIgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG5cbiAgICAgICAgICAgIG9zYy50eXBlID0gJ3NpbmUnO1xuICAgICAgICAgICAgb3NjLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG5cbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGhhcm1vbmljTXVsdGlwbGllciwgMCwgMCApO1xuICAgICAgICAgICAgaGFybW9uaWNDb250cm9sLmNvbm5lY3QoIGhhcm1vbmljTXVsdGlwbGllciwgMCwgMSApO1xuICAgICAgICAgICAgaGFybW9uaWNNdWx0aXBsaWVyLmNvbm5lY3QoIG9zYy5mcmVxdWVuY3kgKTtcbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuZGV0dW5lLmNvbm5lY3QoIG9zYy5kZXR1bmUgKTtcblxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5oYXJtb25pY3NbIGkgXSA9IGhhcm1vbmljQ29udHJvbDtcblxuICAgICAgICAgICAgb3NjLnN0YXJ0KCAwICk7XG4gICAgICAgICAgICBvc2MuY29ubmVjdCggZ3JhcGgub3V0cHV0TGV2ZWwgKTtcbiAgICAgICAgICAgIGdyYXBoLm9zY2lsbGF0b3JzLnB1c2goIG9zYyApO1xuICAgICAgICB9XG5cbiAgICAgICAgZ3JhcGgub3V0cHV0TGV2ZWwuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIHN0YXJ0KCBkZWxheSA9IDAgKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0TGV2ZWwuZ2Fpbi52YWx1ZSA9IDEgLyBncmFwaC5udW1TaW5lcztcbiAgICB9XG5cbiAgICBzdG9wKCBkZWxheSA9IDAgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5vdXRwdXRMZXZlbC5nYWluLnZhbHVlID0gMDtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNpbmVCYW5rID0gZnVuY3Rpb24oIG51bVNpbmVzICkge1xuICAgIHJldHVybiBuZXcgU2luZUJhbmsoIHRoaXMsIG51bVNpbmVzICk7XG59O1xuXG5leHBvcnRcbmRlZmF1bHQgU2luZUJhbms7IiwiaW1wb3J0IFV0aWxzIGZyb20gJy4vVXRpbHMuZXM2JztcblxudmFyIEJ1ZmZlclV0aWxzID0ge307XG5cbi8vIFRPRE86XG4vLyBcdC0gSXQgbWlnaHQgYmUgcG9zc2libGUgdG8gZGVjb2RlIHRoZSBhcnJheWJ1ZmZlclxuLy8gXHQgIHVzaW5nIGEgY29udGV4dCBkaWZmZXJlbnQgZnJvbSB0aGUgb25lIHRoZSBcbi8vIFx0ICBidWZmZXIgd2lsbCBiZSB1c2VkIGluLlxuLy8gXHQgIElmIHNvLCByZW1vdmUgdGhlIGBpb2AgYXJndW1lbnQsIGFuZCBjcmVhdGVcbi8vIFx0ICBhIG5ldyBBdWRpb0NvbnRleHQgYmVmb3JlIHRoZSByZXR1cm4gb2YgdGhlIFByb21pc2UsXG4vLyBcdCAgYW5kIHVzZSB0aGF0LlxuQnVmZmVyVXRpbHMubG9hZEJ1ZmZlciA9IGZ1bmN0aW9uKCBpbywgdXJpICkge1xuXHRyZXR1cm4gbmV3IFByb21pc2UoIGZ1bmN0aW9uKCByZXNvbHZlLCByZWplY3QgKSB7XG5cdFx0dmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG5cdFx0eGhyLm9wZW4oICdHRVQnLCB1cmkgKTtcblx0XHR4aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcblxuXHRcdHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggeGhyLnN0YXR1cyA9PT0gMjAwICkge1xuXHRcdFx0XHQvLyBEbyB0aGUgZGVjb2RlIGRhbmNlXG5cdFx0XHRcdGlvLmNvbnRleHQuZGVjb2RlQXVkaW9EYXRhKFxuXHRcdFx0XHRcdHhoci5yZXNwb25zZSxcblx0XHRcdFx0XHRmdW5jdGlvbiggYnVmZmVyICkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZSggYnVmZmVyICk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRmdW5jdGlvbiggZSApIHtcblx0XHRcdFx0XHRcdHJlamVjdCggZSApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRyZWplY3QoIEVycm9yKCAnU3RhdHVzICE9PSAyMDAnICkgKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0eGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJlamVjdCggRXJyb3IoICdOZXR3b3JrIGVycm9yJyApICk7XG5cdFx0fTtcblxuXHRcdHhoci5zZW5kKCk7XG5cdH0gKTtcbn07XG5cblxuQnVmZmVyVXRpbHMuZmlsbEJ1ZmZlciA9IGZ1bmN0aW9uKCBidWZmZXIsIHZhbHVlICkge1xuXHR2YXIgbnVtQ2hhbm5lbHMgPSBidWZmZXIubnVtYmVyT2ZDaGFubmVscyxcblx0XHRsZW5ndGggPSBidWZmZXIubGVuZ3RoLFxuXHRcdGNoYW5uZWxEYXRhO1xuXG5cdGZvciAoIHZhciBjID0gMDsgYyA8IG51bUNoYW5uZWxzOyArK2MgKSB7XG5cdFx0Y2hhbm5lbERhdGEgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIGMgKTtcblx0XHRjaGFubmVsRGF0YS5maWxsKCB2YWx1ZSApO1xuXHR9XG59O1xuXG5cbkJ1ZmZlclV0aWxzLnJldmVyc2VCdWZmZXIgPSBmdW5jdGlvbiggYnVmZmVyICkge1xuXHRpZiAoIGJ1ZmZlciBpbnN0YW5jZW9mIEF1ZGlvQnVmZmVyID09PSBmYWxzZSApIHtcblx0XHRjb25zb2xlLmVycm9yKCAnYGJ1ZmZlcmAgYXJndW1lbnQgbXVzdCBiZSBpbnN0YW5jZSBvZiBBdWRpb0J1ZmZlcicgKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgbnVtQ2hhbm5lbHMgPSBidWZmZXIubnVtYmVyT2ZDaGFubmVscyxcblx0XHRsZW5ndGggPSBidWZmZXIubGVuZ3RoLFxuXHRcdGNoYW5uZWxEYXRhO1xuXG5cdGZvciAoIHZhciBjID0gMDsgYyA8IG51bUNoYW5uZWxzOyArK2MgKSB7XG5cdFx0Y2hhbm5lbERhdGEgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIGMgKTtcblx0XHRjaGFubmVsRGF0YS5yZXZlcnNlKCk7XG5cdH1cbn07XG5cbkJ1ZmZlclV0aWxzLmNsb25lQnVmZmVyID0gZnVuY3Rpb24oIGJ1ZmZlciApIHtcblx0dmFyIG5ld0J1ZmZlciA9IHRoaXMuaW8uY3JlYXRlQnVmZmVyKCBidWZmZXIubnVtYmVyT2ZDaGFubmVscywgYnVmZmVyLmxlbmd0aCwgYnVmZmVyLnNhbXBsZVJhdGUgKTtcblxuXHRmb3IgKCB2YXIgYyA9IDA7IGMgPCBidWZmZXIubnVtYmVyT2ZDaGFubmVsczsgKytjICkge1xuXHRcdHZhciBjaGFubmVsRGF0YSA9IG5ld0J1ZmZlci5nZXRDaGFubmVsRGF0YSggYyApLFxuXHRcdFx0c291cmNlRGF0YSA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSggYyApO1xuXG5cdFx0Zm9yICggdmFyIGkgPSAwOyBpIDwgYnVmZmVyLmxlbmd0aDsgKytpICkge1xuXHRcdFx0Y2hhbm5lbERhdGFbIGkgXSA9IHNvdXJjZURhdGFbIGkgXTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gbmV3QnVmZmVyO1xufTtcblxuLy8gVE9ETzpcbi8vIFx0LSBTdXBwb3J0IGJ1ZmZlcnMgd2l0aCBtb3JlIHRoYW4gMiBjaGFubmVscy5cbkJ1ZmZlclV0aWxzLnRvU3RlcmVvID0gZnVuY3Rpb24oIGJ1ZmZlciApIHtcblx0dmFyIHN0ZXJlb0J1ZmZlcixcblx0XHRsZW5ndGg7XG5cblx0aWYgKCBidWZmZXIubnVtQ2hhbm5lbHMgPj0gMiApIHtcblx0XHRjb25zb2xlLndhcm4oICdCdWZmZXJVdGlscy50b1N0ZXJlbyBjdXJyZW50bHkgb25seSBzdXBwb3J0cyBtb25vIGJ1ZmZlcnMgZm9yIHVwbWl4aW5nJyApO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGxlbmd0aCA9IGJ1ZmZlci5sZW5ndGg7XG5cdHN0ZXJlb0J1ZmZlciA9IHRoaXMuaW8uY3JlYXRlQnVmZmVyKCAyLCBsZW5ndGgsIGJ1ZmZlci5zYW1wbGVSYXRlICk7XG5cblx0Zm9yICggdmFyIGMgPSAwOyBjIDwgMjsgKytjICkge1xuXHRcdHZhciBjaGFubmVsRGF0YSA9IHN0ZXJlb0J1ZmZlci5nZXRDaGFubmVsRGF0YSggYyApLFxuXHRcdFx0c291cmNlRGF0YSA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSggMCApO1xuXG5cdFx0Zm9yICggdmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kgKSB7XG5cdFx0XHRjaGFubmVsRGF0YVsgaSBdID0gc291cmNlRGF0YVsgaSBdO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBzdGVyZW9CdWZmZXI7XG59O1xuXG4vLyBUT0RPOlxuLy8gXHQtIFRoZXNlIGJhc2ljIG1hdGggZnVuY3Rpb25zLiBUaGluayBvZiBcbi8vIFx0ICB0aGVtIGFzIGEgYnVmZmVyLXZlcnNpb24gb2YgYSB2ZWN0b3IgbGliLlxuQnVmZmVyVXRpbHMuYWRkQnVmZmVyID0gZnVuY3Rpb24oIGEsIGIgKSB7fTtcblxuXG4vLyBhZGRcbi8vIG11bHRpcGx5XG4vLyBzdWJ0cmFjdFxuLy9cblxuZXhwb3J0IGRlZmF1bHQgQnVmZmVyVXRpbHM7IiwidmFyIFV0aWxzID0ge307XG5cblV0aWxzLmlzVHlwZWRBcnJheSA9IGZ1bmN0aW9uKCBhcnJheSApIHtcblx0aWYgKCBhcnJheSAhPT0gdW5kZWZpbmVkICYmIGFycmF5LmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyICkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0cmV0dXJuIGZhbHNlO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgVXRpbHM7Il19
