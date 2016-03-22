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

},{"../core/config.es6":6,"../mixins/Math.es6":81}],2:[function(require,module,exports){
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

AudioIO.BufferUtils = _utilitiesBufferUtilsEs62['default'];
AudioIO.Utils = _utilitiesUtilsEs62['default'];
AudioIO.BufferGenerators = _buffersBufferGeneratorsEs62['default'];

window.AudioIO = AudioIO;
exports['default'] = AudioIO;
module.exports = exports['default'];

},{"../buffers/BufferGenerators.es6":1,"../mixins/conversions.es6":84,"../mixins/math.es6":85,"../utilities/BufferUtils.es6":95,"../utilities/Utils.es6":96,"./config.es6":6,"./overrides.es6":7,"./signalCurves.es6":8}],3:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":82,"../mixins/connections.es6":83,"../mixins/setIO.es6":89,"./AudioIO.es6":2}],4:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":82,"../mixins/connections.es6":83,"../mixins/setIO.es6":89,"./AudioIO.es6":2}],5:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":82,"../mixins/connections.es6":83,"../mixins/setIO.es6":89,"./AudioIO.es6":2}],6:[function(require,module,exports){
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

},{"../mixins/Math.es6":81,"./config.es6":6}],9:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"./CustomEnvelope.es6":12}],10:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"./CustomEnvelope.es6":12}],11:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/config.es6":6,"../mixins/setIO.es6":89}],13:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],14:[function(require,module,exports){
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

    return Delay;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createDelay = function (time, feedbackLevel) {
    return new Delay(this, time, feedbackLevel);
};

exports["default"] = Delay;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":2,"../../graphs/DryWetNode.es6":32}],15:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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

_coreAudioIOEs62["default"].prototype.createPingPongDelay = function (time, feedbackLevel) {
    return new PingPongDelay(this, time, feedbackLevel);
};

},{"../../core/AudioIO.es6":2,"../../graphs/DryWetNode.es6":32}],16:[function(require,module,exports){
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

        // Create the control nodes.
        this.controls.feedback = this.io.createParam();
        this.controls.timeL = this.io.createParam();
        this.controls.timeR = this.io.createParam();

        this.splitter = this.io.createSplitter(2);
        this.delayL = this.context.createDelay();
        this.delayR = this.context.createDelay();
        this.feedbackL = this.context.createGain();
        this.feedbackR = this.context.createGain();
        this.merger = this.io.createMerger(2);

        this.delayL.delayTime.value = 0;
        this.delayR.delayTime.value = 0;
        this.feedbackL.gain.value = 0;
        this.feedbackR.gain.value = 0;

        this.delayL.connect(this.feedbackL);
        this.feedbackL.connect(this.delayL);
        this.delayR.connect(this.feedbackR);
        this.feedbackR.connect(this.delayR);

        this.controls.feedback.connect(this.feedbackL.gain);
        this.controls.feedback.connect(this.feedbackR.gain);
        this.controls.timeL.connect(this.delayL.delayTime);
        this.controls.timeR.connect(this.delayR.delayTime);

        this.inputs[0].connect(this.splitter);
        this.splitter.connect(this.delayL, 0);
        this.splitter.connect(this.delayR, 1);
        this.delayL.connect(this.merger, 0, 0);
        this.delayR.connect(this.merger, 0, 1);
        this.merger.connect(this.outputs[0]);
    }

    return StereoDelay;
})(_graphsDryWetNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createStereoDelay = function () {
    return new StereoDelay(this);
};

exports["default"] = StereoDelay;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":2,"../../graphs/DryWetNode.es6":32}],17:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],18:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],19:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],20:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],21:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],22:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],23:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],24:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../graphs/DryWetNode.es6":32}],25:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],26:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

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
        // graph.jitterOscillator = this.io.createWhiteNoiseOscillator();

        // Zero-out the depth gain nodes so the value
        // of the depth controls aren't multiplied.
        graph.depth.gain.value = 0;
        graph.jitterDepth.gain.value = 0;

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
        // graph.jitterOscillator.connect( graph.jitterDepth );
        // graph.jitterDepth.connect( this.outputs[ 0 ] );

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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],27:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],28:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],29:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../mixins/setIO.es6":89}],30:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],31:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],32:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3,"../mixins/cleaners.es6":82,"../mixins/connections.es6":83,"../mixins/setIO.es6":89}],33:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],34:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],35:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3,"../mixins/math.es6":85}],36:[function(require,module,exports){
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

require('./utilities/BufferUtils.es6');

require('./utilities/Utils.es6');

// import './graphs/Sketch.es6';

window.AudioContext = window.AudioContext || window.webkitAudioContext;window.Param = _coreParamEs62['default'];
window.Node = _coreNodeEs62['default'];

},{"./buffers/BufferGenerators.es6":1,"./core/AudioIO.es6":2,"./core/Node.es6":3,"./core/Param.es6":4,"./core/WaveShaper.es6":5,"./envelopes/ADBDSREnvelope.es6":9,"./envelopes/ADEnvelope.es6":10,"./envelopes/ADSREnvelope.es6":11,"./envelopes/CustomEnvelope.es6":12,"./fx/SchroederAllPass.es6":13,"./fx/delay/Delay.es6":14,"./fx/delay/PingPongDelay.es6":15,"./fx/delay/StereoDelay.es6":16,"./fx/eq/CustomEQ.es6":17,"./fx/filters/AllPassFilter.es6":18,"./fx/filters/BPFilter.es6":19,"./fx/filters/FilterBank.es6":20,"./fx/filters/HPFilter.es6":21,"./fx/filters/LPFilter.es6":22,"./fx/filters/NotchFilter.es6":23,"./fx/saturation/SineShaper.es6":24,"./fx/utility/DCTrap.es6":25,"./fx/utility/LFO.es6":26,"./fx/utility/StereoRotation.es6":27,"./fx/utility/StereoWidth.es6":28,"./generators/OscillatorGenerator.es6":29,"./graphs/Counter.es6":30,"./graphs/Crossfader.es6":31,"./graphs/DryWetNode.es6":32,"./graphs/EQShelf.es6":33,"./graphs/PhaseOffset.es6":34,"./instruments/GeneratorPlayer.es6":35,"./math/Abs.es6":37,"./math/Add.es6":38,"./math/Average.es6":39,"./math/Clamp.es6":40,"./math/Constant.es6":41,"./math/Divide.es6":42,"./math/Floor.es6":43,"./math/Lerp.es6":44,"./math/Max.es6":45,"./math/Min.es6":46,"./math/Multiply.es6":47,"./math/Negate.es6":48,"./math/Pow.es6":49,"./math/Reciprocal.es6":50,"./math/Round.es6":51,"./math/SampleDelay.es6":52,"./math/Scale.es6":53,"./math/ScaleExp.es6":54,"./math/Sign.es6":55,"./math/Sqrt.es6":56,"./math/Square.es6":57,"./math/Subtract.es6":58,"./math/Switch.es6":59,"./math/logical-operators/AND.es6":60,"./math/logical-operators/LogicalOperator.es6":61,"./math/logical-operators/NAND.es6":62,"./math/logical-operators/NOR.es6":63,"./math/logical-operators/NOT.es6":64,"./math/logical-operators/OR.es6":65,"./math/logical-operators/XOR.es6":66,"./math/relational-operators/EqualTo.es6":67,"./math/relational-operators/EqualToZero.es6":68,"./math/relational-operators/GreaterThan.es6":69,"./math/relational-operators/GreaterThanEqualTo.es6":70,"./math/relational-operators/GreaterThanZero.es6":71,"./math/relational-operators/IfElse.es6":72,"./math/relational-operators/LessThan.es6":73,"./math/relational-operators/LessThanEqualTo.es6":74,"./math/relational-operators/LessThanZero.es6":75,"./math/trigonometry/Cos.es6":76,"./math/trigonometry/DegToRad.es6":77,"./math/trigonometry/RadToDeg.es6":78,"./math/trigonometry/Sin.es6":79,"./math/trigonometry/Tan.es6":80,"./oscillators/BufferOscillator.es6":90,"./oscillators/FMOscillator.es6":91,"./oscillators/NoiseOscillatorBank.es6":92,"./oscillators/OscillatorBank.es6":93,"./oscillators/SineBank.es6":94,"./utilities/BufferUtils.es6":95,"./utilities/Utils.es6":96}],37:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],38:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],39:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],40:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],41:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],42:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],43:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],44:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],45:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],46:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],47:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],48:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],49:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],50:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],51:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],52:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],53:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],54:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],55:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],56:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],57:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],58:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],59:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],60:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"./LogicalOperator.es6":61}],61:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],62:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"./LogicalOperator.es6":61}],63:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"./LogicalOperator.es6":61}],64:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"./LogicalOperator.es6":61}],65:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"./LogicalOperator.es6":61}],66:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"./LogicalOperator.es6":61}],67:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],68:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3,"./EqualTo.es6":67}],69:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],70:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],71:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],72:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],73:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],74:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],75:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],76:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],77:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],78:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],79:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],80:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":2,"../../core/Node.es6":3}],81:[function(require,module,exports){
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

},{"../core/config.es6":6}],82:[function(require,module,exports){
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

},{}],83:[function(require,module,exports){
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

},{}],84:[function(require,module,exports){
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

},{"../core/config.es6":6,"./math.es6":85,"./noteRegExp.es6":86,"./noteStrings.es6":87,"./notes.es6":88}],85:[function(require,module,exports){
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

},{"../core/config.es6":6}],86:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = /^([A|B|C|D|E|F|G]{1})([#bx]{0,2})([\-\+]?\d+)?([\+|\-]{1}\d*.\d*)?/;
module.exports = exports["default"];

},{}],87:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
module.exports = exports['default'];

},{}],88:[function(require,module,exports){
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

},{}],89:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = _setIO;

function _setIO(io) {
    this.io = io;
    this.context = io.context;
}

;
module.exports = exports["default"];

},{}],90:[function(require,module,exports){
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

var _utilitiesBufferUtilsEs6 = require("../utilities/BufferUtils.es6");

var _utilitiesBufferUtilsEs62 = _interopRequireDefault(_utilitiesBufferUtilsEs6);

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
		var buffer = _utilitiesBufferUtilsEs62["default"].generateBuffer(this.io, 1, this.context.sampleRate, this.context.sampleRate, this.generator),
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

},{"../buffers/BufferGenerators.es6":1,"../core/AudioIO.es6":2,"../core/Node.es6":3,"../utilities/BufferUtils.es6":95}],91:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../oscillators/OscillatorBank.es6":93}],92:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var _utilitiesBufferUtilsEs6 = require("../utilities/BufferUtils.es6");

var _utilitiesBufferUtilsEs62 = _interopRequireDefault(_utilitiesBufferUtilsEs6);

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

            source.buffer = _utilitiesBufferUtilsEs62["default"].generateBuffer(this.io, // context
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

},{"../buffers/BufferGenerators.es6":1,"../core/AudioIO.es6":2,"../core/Node.es6":3,"../utilities/BufferUtils.es6":95}],93:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],94:[function(require,module,exports){
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

},{"../core/AudioIO.es6":2,"../core/Node.es6":3}],95:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _UtilsEs6 = require('./Utils.es6');

var _UtilsEs62 = _interopRequireDefault(_UtilsEs6);

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

},{"./Utils.es6":96}],96:[function(require,module,exports){
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

},{}]},{},[36])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2J1ZmZlcnMvQnVmZmVyR2VuZXJhdG9ycy5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2NvcmUvQXVkaW9JTy5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2NvcmUvTm9kZS5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2NvcmUvUGFyYW0uZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9jb3JlL1dhdmVTaGFwZXIuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9jb3JlL2NvbmZpZy5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2NvcmUvb3ZlcnJpZGVzLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvY29yZS9zaWduYWxDdXJ2ZXMuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9lbnZlbG9wZXMvQURCRFNSRW52ZWxvcGUuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9lbnZlbG9wZXMvQURFbnZlbG9wZS5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2VudmVsb3Blcy9BRFNSRW52ZWxvcGUuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9lbnZlbG9wZXMvQ3VzdG9tRW52ZWxvcGUuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9meC9TY2hyb2VkZXJBbGxQYXNzLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZngvZGVsYXkvRGVsYXkuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9meC9kZWxheS9QaW5nUG9uZ0RlbGF5LmVzNi5qcyIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZngvZGVsYXkvU3RlcmVvRGVsYXkuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9meC9lcS9DdXN0b21FUS5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2Z4L2ZpbHRlcnMvQWxsUGFzc0ZpbHRlci5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2Z4L2ZpbHRlcnMvQlBGaWx0ZXIuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9meC9maWx0ZXJzL0ZpbHRlckJhbmsuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9meC9maWx0ZXJzL0hQRmlsdGVyLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZngvZmlsdGVycy9MUEZpbHRlci5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2Z4L2ZpbHRlcnMvTm90Y2hGaWx0ZXIuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9meC9zYXR1cmF0aW9uL1NpbmVTaGFwZXIuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9meC91dGlsaXR5L0RDVHJhcC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2Z4L3V0aWxpdHkvTEZPLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZngvdXRpbGl0eS9TdGVyZW9Sb3RhdGlvbi5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2Z4L3V0aWxpdHkvU3RlcmVvV2lkdGguZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9nZW5lcmF0b3JzL09zY2lsbGF0b3JHZW5lcmF0b3IuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9ncmFwaHMvQ291bnRlci5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2dyYXBocy9Dcm9zc2ZhZGVyLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvZ3JhcGhzL0RyeVdldE5vZGUuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9ncmFwaHMvRVFTaGVsZi5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2dyYXBocy9QaGFzZU9mZnNldC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL2luc3RydW1lbnRzL0dlbmVyYXRvclBsYXllci5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21haW4uZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL0Ficy5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvQWRkLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9BdmVyYWdlLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9DbGFtcC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvQ29uc3RhbnQuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL0RpdmlkZS5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvRmxvb3IuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL0xlcnAuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL01heC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvTWluLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9NdWx0aXBseS5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvTmVnYXRlLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9Qb3cuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL1JlY2lwcm9jYWwuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL1JvdW5kLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9TYW1wbGVEZWxheS5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvU2NhbGUuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL1NjYWxlRXhwLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9TaWduLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9TcXJ0LmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9TcXVhcmUuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL1N1YnRyYWN0LmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9Td2l0Y2guZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL0FORC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTG9naWNhbE9wZXJhdG9yLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OQU5ELmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OT1IuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL05PVC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvT1IuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL1hPUi5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUby5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUb1plcm8uZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhbkVxdWFsVG8uZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuWmVyby5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvSWZFbHNlLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhbi5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvTGVzc1RoYW5FcXVhbFRvLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhblplcm8uZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9Db3MuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9EZWdUb1JhZC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L1JhZFRvRGVnLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC90cmlnb25vbWV0cnkvU2luLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWF0aC90cmlnb25vbWV0cnkvVGFuLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWl4aW5zL01hdGguZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9taXhpbnMvY2xlYW5lcnMuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9taXhpbnMvY29ubmVjdGlvbnMuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9taXhpbnMvY29udmVyc2lvbnMuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9taXhpbnMvbWF0aC5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL21peGlucy9ub3RlUmVnRXhwLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWl4aW5zL25vdGVTdHJpbmdzLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWl4aW5zL25vdGVzLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvbWl4aW5zL3NldElPLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvb3NjaWxsYXRvcnMvQnVmZmVyT3NjaWxsYXRvci5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL29zY2lsbGF0b3JzL0ZNT3NjaWxsYXRvci5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL29zY2lsbGF0b3JzL05vaXNlT3NjaWxsYXRvckJhbmsuZXM2IiwiL1VzZXJzL0x1a2UvRG9jdW1lbnRzL0Rldi9Gcm9udEVuZC9Qcm9qZWN0cy9BdWRpb0lPL3NyYy9vc2NpbGxhdG9ycy9Pc2NpbGxhdG9yQmFuay5lczYiLCIvVXNlcnMvTHVrZS9Eb2N1bWVudHMvRGV2L0Zyb250RW5kL1Byb2plY3RzL0F1ZGlvSU8vc3JjL29zY2lsbGF0b3JzL1NpbmVCYW5rLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvdXRpbGl0aWVzL0J1ZmZlclV0aWxzLmVzNiIsIi9Vc2Vycy9MdWtlL0RvY3VtZW50cy9EZXYvRnJvbnRFbmQvUHJvamVjdHMvQXVkaW9JTy9zcmMvdXRpbGl0aWVzL1V0aWxzLmVzNiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs2QkNBbUIsb0JBQW9COzs7OzZCQUN0QixvQkFBb0I7Ozs7QUFHckMsSUFBSSxnQkFB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LElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUU5QixZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDdEMsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDO0FBQ3RDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUN0QyxZQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUM7O0FBRXRDLFlBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBRSxDQUFDO0FBQ3RELFlBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBRSxDQUFDO0FBQ3RELFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQ3JELFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBRSxDQUFDOztBQUVyRCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN4QyxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3hDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3pDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3pDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztLQUM1Qzs7V0FyQ0MsV0FBVzs7O0FBd0NqQiw0QkFBUSxTQUFTLENBQUMsaUJBQWlCLEdBQUcsWUFBVztBQUM3QyxXQUFPLElBQUksV0FBVyxDQUFFLElBQUksQ0FBRSxDQUFDO0NBQ2xDLENBQUM7O3FCQUVhLFdBQVc7Ozs7Ozs7Ozs7Ozs7OzhCQ2hETix3QkFBd0I7Ozs7MkJBQzNCLHFCQUFxQjs7OztBQUV0QyxJQUFJLFlBQVksR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDOztBQUVqQyxTQUFTLFlBQVksQ0FBRSxFQUFFLEVBQUUsSUFBSSxFQUFHO0FBQzlCLFFBQUksS0FBSyxHQUFHO0FBQ1IsY0FBTSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUU7QUFDdkMsZ0JBQVEsRUFBRSxFQUFFO0FBQ1osWUFBSSxFQUFFLFNBQVM7S0FDbEIsQ0FBQzs7QUFFRixTQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2pDLFNBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7O0FBRXpCLFNBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUM1QyxTQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7O0FBRXBDLFNBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQzNELFNBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBRSxDQUFDOztBQUUzQyxTQUFLLENBQUMsT0FBTyxHQUFHLFVBQVUsSUFBSSxFQUFHO0FBQzdCLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUVqQixnQkFBUyxJQUFJO0FBQ1QsaUJBQUssTUFBTTtBQUNQLG9CQUFJLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUM7QUFDN0Isc0JBQU07O0FBQUEsQUFFVixpQkFBSyxPQUFPO0FBQ1Isb0JBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUMzQixzQkFBTTs7QUFBQSxBQUVWLGlCQUFLLE1BQU07QUFDUCxvQkFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO0FBQzlCLHNCQUFNOztBQUFBOztBQUlWLGlCQUFLLFVBQVU7QUFDWCxvQkFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO0FBQUEsQUFDbEMsaUJBQUssV0FBVztBQUNaLG9CQUFJLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxXQUFXLENBQUM7QUFBQSxBQUNuQyxpQkFBSyxTQUFTO0FBQ1Ysb0JBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQztBQUM3QixvQkFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUMzQixvQkFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3RDLHNCQUFNO0FBQUEsU0FDYjtLQUNKLENBQUM7O0FBRUYsU0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUUsQ0FBQzs7QUFFdEIsV0FBTyxLQUFLLENBQUM7Q0FDaEI7O0lBRUssUUFBUTtjQUFSLFFBQVE7O0FBQ0MsYUFEVCxRQUFRLENBQ0csRUFBRSxFQUFHOzhCQURoQixRQUFROztBQUVOLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7Ozs7QUFJbEIsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0tBQ2pEOztBQVBDLFlBQVEsV0FTVixTQUFTLEdBQUEsbUJBQUUsSUFBSSxFQUFHO0FBQ2QsWUFBSSxXQUFXLEdBQUcsWUFBWSxDQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFFO1lBQzNDLE9BQU8sR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFFLElBQUksQ0FBRSxJQUFJLEVBQUUsQ0FBQzs7Ozs7QUFLN0MsWUFBSyxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRztBQUN4QixnQkFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxVQUFVLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0FBQ2pELGdCQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxXQUFXLENBQUMsTUFBTSxDQUFFLENBQUM7QUFDL0MsdUJBQVcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztTQUNuRDs7Ozs7YUFLSTtBQUNELHVCQUFPLENBQUUsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztBQUNyRSx1QkFBTyxDQUFFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxXQUFXLENBQUMsTUFBTSxDQUFFLENBQUM7QUFDbkUsMkJBQVcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzthQUNuRDs7Ozs7OztBQU9ELGVBQU8sQ0FBQyxJQUFJLENBQUUsV0FBVyxDQUFFLENBQUM7QUFDNUIsb0JBQVksQ0FBQyxHQUFHLENBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBRSxDQUFDOztBQUVsQyxlQUFPLFdBQVcsQ0FBQztLQUN0Qjs7QUF4Q0MsWUFBUSxXQTBDVixTQUFTLEdBQUEsbUJBQUUsS0FBSyxFQUFHO0FBQ2YsZUFBTyxZQUFZLENBQUMsR0FBRyxDQUFFLElBQUksQ0FBRSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQzVDOztBQTVDQyxZQUFRLFdBOENWLGFBQWEsR0FBQSx5QkFBRztBQUNaLGVBQU8sWUFBWSxDQUFDLEdBQUcsQ0FBRSxJQUFJLENBQUUsQ0FBQztLQUNuQzs7QUFoREMsWUFBUSxXQWtEVixZQUFZLEdBQUEsc0JBQUUsV0FBVyxFQUFHO0FBQ3hCLFlBQUksT0FBTyxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUUsSUFBSSxDQUFFO1lBQ2xDLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFFLFdBQVcsQ0FBRSxDQUFDOztBQUUzQyxlQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUM1Qzs7QUF2REMsWUFBUSxXQXlEVixtQkFBbUIsR0FBQSw2QkFBRSxLQUFLLEVBQUc7QUFDekIsWUFBSSxPQUFPLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBRSxJQUFJLENBQUUsQ0FBQzs7QUFHdkMsWUFBSyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUUsRUFBRztBQUNyQixtQkFBTyxDQUFDLElBQUksQ0FBRSwrQkFBK0IsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFFLENBQUM7QUFDaEUsbUJBQU8sS0FBSyxDQUFDO1NBQ2hCOzs7O0FBSUQsZUFBTyxDQUFFLEtBQUssQ0FBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNyQyxlQUFPLENBQUMsTUFBTSxDQUFFLEtBQUssRUFBRSxDQUFDLENBQUUsQ0FBQzs7OztBQUkzQixZQUFLLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFHO0FBQ3hCLGdCQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7U0FDakQ7Ozs7O2FBS0ksSUFBSyxLQUFLLEtBQUssQ0FBQyxFQUFHO0FBQ3BCLG9CQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsTUFBTSxDQUFFLENBQUM7YUFDbkQ7Ozs7aUJBSUksSUFBSyxLQUFLLEtBQUssT0FBTyxDQUFDLE1BQU0sRUFBRztBQUNqQywyQkFBTyxDQUFFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7aUJBQ3JFOzs7Ozs7cUJBTUk7QUFDRCwrQkFBTyxDQUFFLEtBQUssR0FBRyxDQUFDLENBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLE9BQU8sQ0FBRSxLQUFLLENBQUUsQ0FBQyxNQUFNLENBQUUsQ0FBQztxQkFDbEU7O0FBRUQsb0JBQVksQ0FBQyxHQUFHLENBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBRSxDQUFDOztBQUVsQyxlQUFPLElBQUksQ0FBQztLQUNmOztBQXJHQyxZQUFRLFdBdUdWLGdCQUFnQixHQUFBLDRCQUFHO0FBQ2YsWUFBSSxPQUFPLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBRSxJQUFJLENBQUUsQ0FBQzs7QUFFdkMsYUFBTSxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQzVDLGdCQUFJLENBQUMsbUJBQW1CLENBQUUsQ0FBQyxDQUFFLENBQUM7U0FDakM7O0FBRUQsZUFBTyxJQUFJLENBQUM7S0FDZjs7V0EvR0MsUUFBUTs7O0FBa0hkLDRCQUFRLFNBQVMsQ0FBQyxjQUFjLEdBQUcsWUFBVztBQUMxQyxXQUFPLElBQUksUUFBUSxDQUFFLElBQUksQ0FBRSxDQUFDO0NBQy9CLENBQUM7O3FCQUVhLFFBQVE7Ozs7Ozs7Ozs7Ozs7OzhCQzlLSCx3QkFBd0I7Ozs7MkJBQzNCLHFCQUFxQjs7OztJQUVoQyxhQUFhO2NBQWIsYUFBYTs7QUFDSixhQURULGFBQWEsQ0FDRixFQUFFLEVBQUc7OEJBRGhCLGFBQWE7O0FBRVgseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3pELGFBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0FBQ2pELGFBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDOztBQUVqRCxhQUFLLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUM7QUFDOUIsYUFBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDO0FBQzlCLGFBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDakMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNqQyxhQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ3pCLGFBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7O0FBRXpCLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztBQUMzRCxZQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2hELFlBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7O0FBRXhDLFlBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQzFELFlBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQzFELFlBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBRSxDQUFDOztBQUUxQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFFLENBQUM7QUFDekMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDcEQsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDO0FBQ3JDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3BELGFBQUssQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFbkQsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7V0FqQ0MsYUFBYTs7O0FBb0NuQiw0QkFBUSxTQUFTLENBQUMsbUJBQW1CLEdBQUcsWUFBVztBQUMvQyxXQUFPLElBQUksYUFBYSxDQUFFLElBQUksQ0FBRSxDQUFDO0NBQ3BDLENBQUM7O3FCQUVhLGFBQWE7Ozs7Ozs7Ozs7Ozs7OzhCQzNDUix3QkFBd0I7Ozs7MkJBQzNCLHFCQUFxQjs7OztJQUVoQyxRQUFRO2NBQVIsUUFBUTs7QUFDQyxhQURULFFBQVEsQ0FDRyxFQUFFLEVBQUc7OEJBRGhCLFFBQVE7O0FBRU4seUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3pELGFBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0FBQ2pELGFBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDOztBQUVqRCxhQUFLLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUM7QUFDL0IsYUFBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO0FBQy9CLGFBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDakMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNqQyxhQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ3pCLGFBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7O0FBRXpCLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztBQUMzRCxZQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2hELFlBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7O0FBRXhDLFlBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQzFELFlBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQzFELFlBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBRSxDQUFDOztBQUUxQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFFLENBQUM7QUFDekMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDcEQsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDO0FBQ3JDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3BELGFBQUssQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFbkQsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7V0FqQ0MsUUFBUTs7O0FBb0NkLDRCQUFRLFNBQVMsQ0FBQyxjQUFjLEdBQUcsWUFBVztBQUMxQyxXQUFPLElBQUksUUFBUSxDQUFFLElBQUksQ0FBRSxDQUFDO0NBQy9CLENBQUM7O3FCQUVhLFFBQVE7Ozs7Ozs7Ozs7Ozs7OzhCQzNDSCx3QkFBd0I7Ozs7MkJBQzNCLHFCQUFxQjs7OztBQUV0QyxJQUFJLFlBQVksR0FBRyxDQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsVUFBVSxFQUNWLE9BQU8sRUFDUCxTQUFTLENBQ1osQ0FBQzs7SUFFSSxVQUFVO2NBQVYsVUFBVTs7QUFDRCxhQURULFVBQVUsQ0FDQyxFQUFFLEVBQUc7OEJBRGhCLFVBQVU7O0FBRVIseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUUsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMxRSxhQUFLLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUUsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMxRSxhQUFLLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3pELGFBQUssQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ3ZCLGFBQUssQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDOztBQUV2QixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDM0QsWUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3hDLFlBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDakQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBRSxDQUFDO0FBQ3hFLFlBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUUsQ0FBQzs7O0FBR3hFLGFBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQzVDLGdCQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7O0FBRS9DLGtCQUFNLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBRSxDQUFDLENBQUUsQ0FBQztBQUNoQyxrQkFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLGtCQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7O0FBRW5CLGdCQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQ3BELGdCQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsTUFBTSxDQUFDLENBQUMsQ0FBRSxDQUFDO0FBQ3BDLGdCQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxNQUFNLENBQUUsQ0FBQztBQUNuQyxrQkFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFN0MsaUJBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1NBQ3BDOzs7OztBQUtELGFBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQzVDLGdCQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7O0FBRS9DLGtCQUFNLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBRSxDQUFDLENBQUUsQ0FBQztBQUNoQyxrQkFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLGtCQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7O0FBRW5CLG1CQUFPLENBQUMsR0FBRyxDQUFFLE1BQU0sQ0FBRSxDQUFDOztBQUV0QixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUNwRCxnQkFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUUsQ0FBQztBQUNwQyxpQkFBSyxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsTUFBTSxDQUFFLENBQUM7QUFDekMsa0JBQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRTdDLGlCQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBRSxNQUFNLENBQUUsQ0FBQztTQUNwQzs7QUFFRCxhQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1RCxhQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1RCxhQUFLLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRW5ELFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O1dBNURDLFVBQVU7OztBQStEaEIsNEJBQVEsU0FBUyxDQUFDLGdCQUFnQixHQUFHLFlBQVc7QUFDNUMsV0FBTyxJQUFJLFVBQVUsQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUNqQyxDQUFDOztxQkFFYSxVQUFVOzs7Ozs7Ozs7Ozs7Ozs4QkM5RUwsd0JBQXdCOzs7OzJCQUMzQixxQkFBcUI7Ozs7SUFFaEMsUUFBUTtjQUFSLFFBQVE7O0FBQ0MsYUFEVCxRQUFRLENBQ0csRUFBRSxFQUFHOzhCQURoQixRQUFROztBQUVOLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsYUFBSyxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN6RCxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztBQUNqRCxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQzs7QUFFakQsYUFBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO0FBQy9CLGFBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQztBQUMvQixhQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2pDLGFBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDakMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUN6QixhQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUV6QixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDM0QsWUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUV4QyxZQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUMxRCxZQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUMxRCxZQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUUsQ0FBQzs7QUFFMUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDO0FBQ3pDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3BELGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUNyQyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNwRCxhQUFLLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRW5ELFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O1dBakNDLFFBQVE7OztBQW9DZCw0QkFBUSxTQUFTLENBQUMsY0FBYyxHQUFHLFlBQVc7QUFDMUMsV0FBTyxJQUFJLFFBQVEsQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUMvQixDQUFDOztxQkFFYSxRQUFROzs7Ozs7Ozs7Ozs7Ozs4QkMzQ0gsd0JBQXdCOzs7OzJCQUMzQixxQkFBcUI7Ozs7SUFFaEMsUUFBUTtjQUFSLFFBQVE7O0FBQ0MsYUFEVCxRQUFRLENBQ0csRUFBRSxFQUFHOzhCQURoQixRQUFROztBQUVOLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsYUFBSyxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN6RCxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztBQUNqRCxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQzs7QUFFakQsYUFBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDO0FBQzlCLGFBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQztBQUM5QixhQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2pDLGFBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDakMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUN6QixhQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUV6QixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDM0QsWUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUV4QyxZQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUMxRCxZQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUMxRCxZQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUUsQ0FBQzs7QUFFMUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDO0FBQ3pDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3BELGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUNyQyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNwRCxhQUFLLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRW5ELFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O1dBakNDLFFBQVE7OztBQW9DZCw0QkFBUSxTQUFTLENBQUMsY0FBYyxHQUFHLFlBQVc7QUFDMUMsV0FBTyxJQUFJLFFBQVEsQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUMvQixDQUFDOztxQkFFYSxRQUFROzs7Ozs7Ozs7Ozs7Ozs4QkMzQ0gsd0JBQXdCOzs7OzJCQUMzQixxQkFBcUI7Ozs7SUFFaEMsV0FBVztjQUFYLFdBQVc7O0FBQ0YsYUFEVCxXQUFXLENBQ0EsRUFBRSxFQUFHOzhCQURoQixXQUFXOztBQUVULHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsYUFBSyxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN6RCxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztBQUNqRCxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQzs7QUFFakQsYUFBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO0FBQzVCLGFBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUM1QixhQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2pDLGFBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDakMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUN6QixhQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUV6QixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDM0QsWUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUV4QyxZQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUMxRCxZQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUMxRCxZQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUUsQ0FBQzs7QUFFMUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDO0FBQ3pDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3BELGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUNyQyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNwRCxhQUFLLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRW5ELFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O1dBakNDLFdBQVc7OztBQW9DakIsNEJBQVEsU0FBUyxDQUFDLGlCQUFpQixHQUFHLFlBQVc7QUFDN0MsV0FBTyxJQUFJLFdBQVcsQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUNsQyxDQUFDOztxQkFFYSxXQUFXOzs7Ozs7Ozs7Ozs7Ozs4QkMzQ04sd0JBQXdCOzs7O21DQUNyQiw2QkFBNkI7Ozs7Ozs7SUFJOUMsVUFBVTtjQUFWLFVBQVU7O0FBQ0QsYUFEVCxVQUFVLENBQ0MsRUFBRSxFQUFHOzhCQURoQixVQUFVOztBQUVSLCtCQUFPLEVBQUUsQ0FBRSxDQUFDOztBQUVaLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDNUMsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBRSxDQUFDO0FBQzlELFlBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUM3QyxZQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUVoQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsV0FBVyxDQUFFLENBQUM7QUFDN0MsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFFLENBQUM7QUFDckQsWUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDO0FBQ3hDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQztLQUNuQzs7V0FiQyxVQUFVOzs7QUFnQmhCLDRCQUFRLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxVQUFVLElBQUksRUFBRSxhQUFhLEVBQUc7QUFDakUsV0FBTyxJQUFJLFVBQVUsQ0FBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLGFBQWEsQ0FBRSxDQUFDO0NBQ3RELENBQUM7O3FCQUVhLFVBQVU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FDZ0JsQix3QkFBd0I7OzJCQUNkLHFCQUFxQjs7OztJQUVoQyxNQUFNO1lBQU4sTUFBTTs7QUFDRyxXQURULE1BQU0sQ0FDSyxFQUFFLEVBQWU7UUFBYixNQUFNLHlEQUFHLENBQUM7OzBCQUR6QixNQUFNOztBQUVKLHFCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFFBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7Ozs7O0FBTTVCLFNBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUUsTUFBTSxDQUFFLENBQUM7OztBQUdoRCxTQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztBQUN4QyxTQUFLLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDaEQsU0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUUsQ0FBQztBQUNwRSxTQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNoRCxTQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNuRCxTQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBR2xELFNBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUN0QyxTQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztBQUM5QyxTQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7OztBQUcxQyxRQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFFLENBQUM7QUFDekMsU0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDN0MsU0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDNUMsU0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQzFDLFNBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUMzQyxTQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFFLENBQUM7QUFDeEMsU0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUUxQyxRQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0dBQzFCOztTQW5DQyxNQUFNOzs7QUFzQ1osT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsVUFBVSxNQUFNLEVBQUc7QUFDaEQsU0FBTyxJQUFJLE1BQU0sQ0FBRSxJQUFJLEVBQUUsTUFBTSxDQUFFLENBQUM7Q0FDckMsQ0FBQzs7Ozs7Ozs7Ozs7UUNwRkssd0JBQXdCOzsyQkFDZCxxQkFBcUI7Ozs7SUFFaEMsR0FBRztjQUFILEdBQUc7O0FBQ00sYUFEVCxHQUFHLENBQ1EsRUFBRSxFQUFlO1lBQWIsTUFBTSx5REFBRyxDQUFDOzs4QkFEekIsR0FBRzs7QUFFRCx5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7OztBQUc1QixhQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztBQUNsRCxhQUFLLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztBQUNoRCxhQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDeEMsYUFBSyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDOzs7OztBQUs5QyxhQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLGFBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7OztBQUdqQyxZQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7QUFDOUQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO0FBQ3hELFlBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztBQUM1RCxZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztBQUN4RCxZQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDOzs7QUFHN0MsWUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQ3hFLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBRSxDQUFDO0FBQ2hELFlBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBRSxDQUFDOzs7QUFHdkQsYUFBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUN6QyxhQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7Ozs7OztBQU96QyxZQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQzFCOztBQTFDQyxPQUFHLFdBNENMLEtBQUssR0FBQSxpQkFBYztZQUFaLEtBQUsseURBQUcsQ0FBQzs7QUFDWixZQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUM3Qzs7QUE5Q0MsT0FBRyxXQStDTCxJQUFJLEdBQUEsZ0JBQWM7WUFBWixLQUFLLHlEQUFHLENBQUM7O0FBQ1gsWUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDNUM7O1dBakRDLEdBQUc7OztBQW9EVCxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFVLE1BQU0sRUFBRztBQUM3QyxXQUFPLElBQUksR0FBRyxDQUFFLElBQUksRUFBRSxNQUFNLENBQUUsQ0FBQztDQUNsQyxDQUFDOzs7Ozs7Ozs7Ozs4QkN6RGtCLHdCQUF3Qjs7OzsyQkFDM0IscUJBQXFCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBaUJoQyxjQUFjO2NBQWQsY0FBYzs7QUFDTCxhQURULGNBQWMsQ0FDSCxFQUFFLEVBQUUsUUFBUSxFQUFHOzhCQUQxQixjQUFjOztBQUVaLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsUUFBUSxDQUFFLENBQUM7O0FBRXpELGFBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBRSxDQUFDLENBQUUsQ0FBQztBQUN6RCxhQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDaEMsYUFBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDOztBQUVoQyxZQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBRSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsR0FBRyxDQUFFLENBQUM7O0FBRTVDLGFBQUssQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUNqRCxhQUFLLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDakQsYUFBSyxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDbEQsYUFBSyxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDbEQsYUFBSyxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDdEQsYUFBSyxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7O0FBSS9DLGFBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUM1QyxhQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDN0MsYUFBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVyRCxhQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzdDLGFBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRTlDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3ZELGFBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ2pELGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3ZELGFBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVqRCxhQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3pELGFBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDbEQsYUFBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN6RCxhQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsRCxhQUFLLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ2xFLGFBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLG9CQUFvQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNuRSxhQUFLLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ2hFLGFBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLGtCQUFrQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFakUsYUFBSyxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN6RCxhQUFLLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUd2RCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDM0MsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUUxQyxZQUFJLENBQUMsV0FBVyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO0FBQ3hDLFlBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7O0FBRTFDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O1dBekRDLGNBQWM7OztBQTREcEIsNEJBQVEsU0FBUyxDQUFDLG9CQUFvQixHQUFHLFVBQVUsUUFBUSxFQUFHO0FBQzFELFdBQU8sSUFBSSxjQUFjLENBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBRSxDQUFDO0NBQy9DLENBQUM7Ozs7Ozs7Ozs7OzhCQ2hGa0Isd0JBQXdCOzs7OzJCQUMzQixxQkFBcUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFpQmhDLFdBQVc7Y0FBWCxXQUFXOztBQUNGLGFBRFQsV0FBVyxDQUNBLEVBQUUsRUFBRSxLQUFLLEVBQUc7OEJBRHZCLFdBQVc7O0FBRVQseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUUsQ0FBQyxDQUFFLENBQUM7QUFDekQsYUFBSyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUUsQ0FBQztBQUNqRCxhQUFLLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFFLEdBQUcsQ0FBRSxDQUFDO0FBQ3RELGFBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUM1QyxhQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDN0MsYUFBSyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ3pDLGFBQUssQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUNoRCxhQUFLLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUUsR0FBRyxDQUFFLENBQUM7QUFDeEQsYUFBSyxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDckQsYUFBSyxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ2pELGFBQUssQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUMzQyxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXJELGFBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxlQUFlLENBQUUsQ0FBQztBQUNuRCxhQUFLLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVqRSxhQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzdDLGFBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDcEQsYUFBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDckQsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDdEQsYUFBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXZELGFBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxpQkFBaUIsQ0FBRSxDQUFDO0FBQ3RELGFBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWhFLGFBQUssQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDL0QsYUFBSyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFakUsYUFBSyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5RCxhQUFLLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVoRSxhQUFLLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNwRCxhQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbkQsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBRSxDQUFDO0FBQzNDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFMUMsWUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztBQUN4QyxZQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDOztBQUUxQyxZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDOztBQUV4QyxZQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQzFCOztXQWxEQyxXQUFXOzs7QUFxRGpCLDRCQUFRLFNBQVMsQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLEtBQUssRUFBRztBQUNwRCxXQUFPLElBQUksV0FBVyxDQUFFLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQztDQUN6QyxDQUFDOzs7Ozs7Ozs7UUN6RUsscUJBQXFCOzs4QkFDVCxxQkFBcUI7Ozs7SUFFbEMsbUJBQW1CO0FBQ1YsYUFEVCxtQkFBbUIsQ0FDUixFQUFFLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRzs4QkFEbEUsbUJBQW1COztBQUVqQixZQUFJLENBQUMsTUFBTSxDQUFFLEVBQUUsQ0FBRSxDQUFDOztBQUVsQixZQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUMzQixZQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztBQUNyQixZQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUN6QixZQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUMzQixZQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsSUFBSSxNQUFNLENBQUM7QUFDL0IsWUFBSSxDQUFDLGNBQWMsR0FBRyxHQUFHLENBQUM7O0FBRTFCLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxFQUNoRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBRSxRQUFRLENBQUUsQ0FBQztBQUN6RCxZQUFJLENBQUMsT0FBTyxHQUFHLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBRSxDQUFDO0FBQzdDLFlBQUksQ0FBQyxLQUFLLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFFLENBQUM7O0FBRXBGLFlBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxhQUFhLENBQUUsQ0FBQztBQUM3QyxZQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7S0FDbkQ7O0FBbEJDLHVCQUFtQixXQW9CckIsa0JBQWtCLEdBQUEsOEJBQUc7QUFDakIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNyQyxlQUFPLElBQUksQ0FBQztLQUNmOztBQXZCQyx1QkFBbUIsV0F5QnJCLG1CQUFtQixHQUFBLDZCQUFFLFFBQVEsRUFBRztBQUM1QixZQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO0tBQzVDOztBQTNCQyx1QkFBbUIsV0E2QnJCLHFCQUFxQixHQUFBLGlDQUFHO0FBQ3BCLFlBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDaEMsWUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUMvQixZQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztBQUMxQixZQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQztBQUN6QixZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztLQUN2Qjs7QUFuQ0MsdUJBQW1CLFdBcUNyQixJQUFJLEdBQUEsY0FBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRztBQUN0QixlQUFPLEtBQUssR0FBSyxDQUFFLEdBQUcsR0FBRyxLQUFLLENBQUEsR0FBSyxLQUFLLEFBQUUsQ0FBQztLQUM5Qzs7QUF2Q0MsdUJBQW1CLFdBeUNyQixLQUFLLEdBQUEsZUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFHO0FBQ2xELFlBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDOztBQUVuQyxpQkFBUyxHQUFHLE9BQU8sU0FBUyxLQUFLLFFBQVEsR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUN2RSxjQUFNLEdBQUcsT0FBTyxNQUFNLEtBQUssUUFBUSxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQzNELGdCQUFRLEdBQUcsT0FBTyxRQUFRLEtBQUssUUFBUSxHQUFHLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ25FLFlBQUksR0FBRyxPQUFPLElBQUksS0FBSyxRQUFRLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7O0FBRW5ELFlBQUksU0FBUyxHQUFHLE9BQU8sU0FBUyxLQUFLLFFBQVEsR0FBRyxTQUFTLEdBQUcsQ0FBQyxDQUFDOztBQUU5RCxZQUFJLENBQUMsbUJBQW1CLENBQUUsUUFBUSxDQUFFLENBQUM7O0FBRXJDLFlBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFFLEdBQUcsQ0FBRSxDQUFDO0FBQ3RELFlBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLHFCQUFxQixDQUFFLEdBQUcsQ0FBRSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwQm5ELFlBQUssU0FBUyxLQUFLLENBQUMsRUFBRztBQUNuQixnQkFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUUsU0FBUyxFQUFFLEdBQUcsR0FBRyxTQUFTLENBQUUsQ0FBQztBQUMvRSxnQkFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsdUJBQXVCLENBQUUsTUFBTSxFQUFFLEdBQUcsR0FBRyxTQUFTLENBQUUsQ0FBQztTQUM1RSxNQUNJO0FBQ0QsZ0JBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBRSxTQUFTLEVBQUUsR0FBRyxDQUFFLENBQUM7QUFDMUQsZ0JBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBRSxNQUFNLEVBQUUsR0FBRyxDQUFFLENBQUM7U0FDdkQ7O0FBRUQsWUFBSyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUc7QUFDNUIsZ0JBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztTQUM5QixNQUNJO0FBQ0QsZ0JBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7U0FDbkM7O0FBRUQsWUFBSSxDQUFDLGNBQWMsR0FBRyxHQUFHLENBQUM7QUFDMUIsWUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7QUFDM0IsWUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7QUFDM0IsWUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDckIsWUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7QUFDekIsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7S0FDcEI7O0FBdEdDLHVCQUFtQixXQXdHckIsS0FBSyxHQUFBLGVBQUUsS0FBSyxFQUFHO0FBQ1gsWUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDakM7O0FBMUdDLHVCQUFtQixXQTRHckIsSUFBSSxHQUFBLGNBQUUsS0FBSyxFQUFHO0FBQ1YsWUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDaEM7O0FBOUdDLHVCQUFtQixXQWdIckIsT0FBTyxHQUFBLG1CQUFHO0FBQ04sWUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUM1QixZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQzs7QUFFdEIsWUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7S0FDaEM7O1dBckhDLG1CQUFtQjs7O0FBd0h6QixPQUFPLENBQUMsV0FBVyxDQUFFLG1CQUFtQixDQUFDLFNBQVMsK0JBQVUsUUFBUSxDQUFFLENBQUM7O0FBRXZFLE9BQU8sQ0FBQyxTQUFTLENBQUMseUJBQXlCLEdBQUcsVUFBVSxTQUFTLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFHO0FBQ25HLFdBQU8sSUFBSSxtQkFBbUIsQ0FBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBRSxDQUFDO0NBQ3hGLENBQUM7Ozs7Ozs7Ozs7O1FDL0hLLHFCQUFxQjs7MkJBQ1gsa0JBQWtCOzs7Ozs7O0lBSTdCLE9BQU87Y0FBUCxPQUFPOztBQUVFLGFBRlQsT0FBTyxDQUVJLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRzs4QkFGNUMsT0FBTzs7QUFHTCx5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQzs7QUFFckIsWUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDOztBQUV4RCxZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLFNBQVMsQ0FBRSxDQUFDO0FBQ2pELFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7QUFFekMsWUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3hDLFlBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDOztBQUUzQyxZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUM3QixZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFFLENBQUM7O0FBRXBDLFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUNwQyxZQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDcEMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDOztBQUVwQyxZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFFLEtBQUssQ0FBRSxDQUFDO0FBQ2hELFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQzs7QUFFcEMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDN0MsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRTdDLFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztLQUUzQzs7QUEvQkMsV0FBTyxXQWlDVCxLQUFLLEdBQUEsaUJBQUc7QUFDSixZQUFJLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWhCLFlBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7QUFFWixrQkFBVSxDQUFFLFlBQVc7QUFDbkIsZ0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNoQixFQUFFLEVBQUUsQ0FBRSxDQUFDO0tBQ1g7O0FBekNDLFdBQU8sV0EyQ1QsS0FBSyxHQUFBLGlCQUFHO0FBQ0osWUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLEtBQUssRUFBRztBQUN6QixnQkFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDcEIsZ0JBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQzNDLGdCQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBRSxDQUFDO1NBQy9DO0tBQ0o7O0FBakRDLFdBQU8sV0FtRFQsSUFBSSxHQUFBLGdCQUFHO0FBQ0gsWUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRztBQUN4QixnQkFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDckIsZ0JBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFFLENBQUM7QUFDL0MsZ0JBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7U0FDbEM7S0FDSjs7QUF6REMsV0FBTyxXQTJEVCxPQUFPLEdBQUEsbUJBQUc7QUFDTix3QkFESixPQUFPLFdBQ0ksQ0FBQztLQUNYOztXQTdEQyxPQUFPOzs7QUFnRWIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEdBQUcsVUFBVSxTQUFTLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRztBQUNyRSxXQUFPLElBQUksT0FBTyxDQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBRSxDQUFDO0NBQzFELENBQUM7Ozs7Ozs7Ozs7Ozs7UUN2RUsscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7SUFFN0IsVUFBVTtjQUFWLFVBQVU7O0FBQ0QsYUFEVCxVQUFVLENBQ0MsRUFBRSxFQUFtQztZQUFqQyxRQUFRLHlEQUFHLENBQUM7WUFBRSxZQUFZLHlEQUFHLENBQUM7OzhCQUQ3QyxVQUFVOzs7OztBQU1SLG9CQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxZQUFZLENBQUUsQ0FBQztBQUN4QyxnQkFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsUUFBUSxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVuQyx5QkFBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUV6QixZQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNqQixZQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUNwQixZQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNsQixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUU1QyxhQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRztBQUNwQyxnQkFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDL0MsZ0JBQUksQ0FBQyxTQUFTLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUUsQ0FBQyxDQUFDLENBQUM7QUFDakQsZ0JBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUUvQyxnQkFBSSxDQUFDLEtBQUssQ0FBQyxFQUFHO0FBQ1Ysb0JBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsR0FBRyxDQUFFLENBQUM7QUFDbEQsb0JBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLEdBQUcsQ0FBRSxDQUFDO2FBQ3pELE1BQ0k7QUFDRCxvQkFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsR0FBRyxDQUFFLENBQUM7QUFDdkQsb0JBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLEdBQUcsQ0FBRSxDQUFDO2FBQ3pEOztBQUVELGdCQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0FBQ25ELGdCQUFJLENBQUMsU0FBUyxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDaEQsZ0JBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBRSxDQUFDO1NBQ2pFOztBQUVELFlBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztLQUN4RTs7QUFwQ0MsY0FBVSxXQXNDWixPQUFPLEdBQUEsbUJBQUc7QUFDTix3QkFESixPQUFPLFdBQ0ksQ0FBQztLQUNYOztXQXhDQyxVQUFVOzs7QUE0Q2hCLE9BQU8sQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxRQUFRLEVBQUUsWUFBWSxFQUFHO0FBQ3BFLFdBQU8sSUFBSSxVQUFVLENBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUUsQ0FBQztDQUN6RCxDQUFDOztxQkFFYSxVQUFVOzs7Ozs7Ozs7Ozs7Ozs4QkNuREwscUJBQXFCOzs7OzhCQUN0QixxQkFBcUI7Ozs7b0NBQ2hCLDJCQUEyQjs7OztpQ0FDOUIsd0JBQXdCOzs7OzJCQUM1QixrQkFBa0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW1CN0IsVUFBVTtjQUFWLFVBQVU7O0FBQ0QsYUFEVCxVQUFVLENBQ0MsRUFBRSxFQUFHOzhCQURoQixVQUFVOztBQUVSLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQztBQUM1QixZQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QixZQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDaEQsWUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLFlBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxjQUFjLENBQUUsQ0FBQzs7O0FBR3hDLFlBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUN2QyxZQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDOzs7QUFHMUIsWUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQzNDLFlBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFFLENBQUM7OztBQUc5QyxZQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDN0MsWUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDOzs7O0FBSWpDLFlBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsV0FBVyxDQUFFLENBQUM7QUFDdkMsWUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOzs7QUFHOUMsWUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0FBQ3RDLFlBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQzs7O0FBRy9CLFlBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7S0FDN0M7O1dBcENDLFVBQVU7OztBQTJDaEIsNEJBQVEsU0FBUyxDQUFDLGdCQUFnQixHQUFHLFlBQVc7QUFDNUMsV0FBTyxJQUFJLFVBQVUsQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUNqQyxDQUFDOztxQkFFYSxVQUFVOzs7Ozs7Ozs7Ozs7Ozs4QkN0RUwscUJBQXFCOzs7OzJCQUN4QixrQkFBa0I7Ozs7SUFFN0IsT0FBTztjQUFQLE9BQU87O0FBQ0UsYUFEVCxPQUFPLENBQ0ksRUFBRSxFQUEyRTtZQUF6RSxhQUFhLHlEQUFHLElBQUk7WUFBRSxZQUFZLHlEQUFHLEdBQUc7WUFBRSxTQUFTLHlEQUFHLENBQUMsQ0FBQztZQUFFLFFBQVEseURBQUcsQ0FBQzs7OEJBRHJGLE9BQU87O0FBRUwseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxhQUFhLENBQUUsQ0FBQztBQUMxRCxZQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLFlBQVksQ0FBRSxDQUFDO0FBQ3hELFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsU0FBUyxDQUFFLENBQUM7QUFDbEQsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQzs7QUFFaEQsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7QUFDbEQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO0FBQ2hDLFlBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUM7QUFDN0MsWUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQzs7QUFFcEMsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7QUFDbkQsWUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDO0FBQ2xDLFlBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUM7QUFDL0MsWUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQzs7QUFFdEMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUMzQyxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDM0MsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOzs7Ozs7OztBQVE1QyxZQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO0FBQ2pELFlBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDL0MsWUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUN6QyxZQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0tBQzFDOztXQWxDQyxPQUFPOzs7QUFzQ2IsNEJBQVEsU0FBUyxDQUFDLGFBQWEsR0FBRyxVQUFVLGFBQWEsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRztBQUMzRixXQUFPLElBQUksT0FBTyxDQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUUsQ0FBQztDQUNoRixDQUFDOztxQkFFYSxPQUFPOzs7Ozs7Ozs7Ozs7Ozs4QkM3Q0YscUJBQXFCOzs7OzJCQUN4QixrQkFBa0I7Ozs7SUFFN0IsV0FBVztjQUFYLFdBQVc7O0FBQ0YsYUFEVCxXQUFXLENBQ0EsRUFBRSxFQUFHOzhCQURoQixXQUFXOztBQUVULHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUUsQ0FBQztBQUM1RSxZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDeEMsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3pDLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDbkMsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBRSxHQUFHLENBQUUsQ0FBQzs7QUFFL0MsWUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQzs7QUFFL0IsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQy9DLFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUNyQyxZQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5QyxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBRSxDQUFDOzs7Ozs7QUFNOUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUU5QyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFFLENBQUM7QUFDdkMsWUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUV4QyxZQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDOzs7QUFHbkMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUN6QyxZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0tBQ3BDOztXQWpDQyxXQUFXOzs7QUFxQ2pCLDRCQUFRLFNBQVMsQ0FBQyxpQkFBaUIsR0FBRyxZQUFXO0FBQzdDLFdBQU8sSUFBSSxXQUFXLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDbEMsQ0FBQzs7cUJBRWEsV0FBVzs7Ozs7Ozs7Ozs7O1FDNUNuQixxQkFBcUI7OzJCQUNYLGtCQUFrQjs7Ozs7OzZCQUVsQixvQkFBb0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWdDL0IsZUFBZTtjQUFmLGVBQWU7O0FBQ04sYUFEVCxlQUFlLENBQ0osRUFBRSxFQUFFLE9BQU8sRUFBRzs4QkFEekIsZUFBZTs7QUFFYix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFLLE9BQU8sQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFHO0FBQ25DLGtCQUFNLElBQUksS0FBSyxDQUFFLDREQUE0RCxDQUFFLENBQUM7U0FDbkY7O0FBRUQsWUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDOztBQUVuQyxZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLE9BQU8sQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFFLENBQUM7O0FBRS9ELFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUUsQ0FBQztBQUN6RCxZQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLE9BQU8sT0FBTyxDQUFDLFlBQVksS0FBSyxRQUFRLEdBQUcsT0FBTyxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUUsQ0FBQztBQUMvRyxZQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLE9BQU8sT0FBTyxDQUFDLFdBQVcsS0FBSyxRQUFRLEdBQUcsT0FBTyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUUsQ0FBQztBQUM1RyxZQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLElBQUksVUFBVSxDQUFDOztBQUVuRCxZQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDO0FBQzlDLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsT0FBTyxPQUFPLENBQUMsU0FBUyxLQUFLLFFBQVEsR0FBRyxPQUFPLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBRSxDQUFDOztBQUV0RyxZQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsT0FBTyxPQUFPLENBQUMsbUJBQW1CLEtBQUssUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLENBQUUsQ0FBQzs7QUFFcEksWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxPQUFPLE9BQU8sQ0FBQyxNQUFNLEtBQUssUUFBUSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFFLENBQUM7O0FBRTdGLFlBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsSUFBSSxNQUFNLENBQUM7O0FBRTNDLFlBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLGtCQUFrQixFQUFFLENBQUM7O0FBRWpFLFlBQUksQ0FBQyxzQkFBc0IsR0FBRyxFQUFFLENBQUM7QUFDakMsWUFBSSxDQUFDLDBCQUEwQixHQUFHLEVBQUUsQ0FBQztBQUNyQyxZQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztLQUNwQjs7OztBQS9CQyxtQkFBZSxXQWtDakIsc0JBQXNCLEdBQUEsZ0NBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRztBQUN2RSxlQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxHQUFHLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUUsQ0FBQztLQUNySDs7Ozs7Ozs7OztBQXBDQyxtQkFBZSxXQThDakIsZ0JBQWdCLEdBQUEsMEJBQUUsV0FBVyxFQUFHO0FBQzVCLFlBQUksTUFBTSxHQUFHLEdBQUc7WUFDWixZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7O0FBRTNDLFlBQUssSUFBSSxDQUFDLFVBQVUsS0FBSyxVQUFVLEVBQUc7QUFDbEMsZ0JBQUksSUFBSSxHQUFHLFlBQVksQ0FBQzs7QUFFeEIsa0JBQU0sR0FBRyxJQUFJLEdBQUcsV0FBVyxDQUFDO0FBQzVCLGtCQUFNLElBQUksSUFBSSxJQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQSxBQUFFLENBQUM7QUFDN0Msa0JBQU0sSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDO1NBQ3hCLE1BQ0k7QUFDRCxnQkFBSSxVQUFVLENBQUM7Ozs7O0FBS2YsZ0JBQUssV0FBVyxHQUFHLENBQUMsRUFBRzs7QUFFbkIsb0JBQUssV0FBVyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUc7QUFDekIsOEJBQVUsR0FBRyxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUM7aUJBQ25DLE1BQ0k7O0FBRUQsd0JBQUssV0FBVyxHQUFHLENBQUMsRUFBRztBQUNuQixtQ0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFFLFdBQVcsRUFBRSxDQUFDLENBQUUsR0FBRyxDQUFDLENBQUM7cUJBQ2pFOztBQUVELDhCQUFVLEdBQUcsV0FBVyxDQUFDO2lCQUM1Qjs7OztBQUlELHNCQUFNLEdBQUcsWUFBWSxHQUFHLFVBQVUsQ0FBQzthQUN0QztTQUNKOztBQUVELGVBQU8sTUFBTSxDQUFDO0tBQ2pCOztBQXBGQyxtQkFBZSxXQXNGakIsbUJBQW1CLEdBQUEsNkJBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRztBQUNwQyxZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUztZQUNyQixJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLO1lBQzNCLFNBQVM7WUFDVCxjQUFjLENBQUM7O0FBRW5CLFlBQUssSUFBSSxLQUFLLEdBQUcsRUFBRztBQUNoQixxQkFBUyxHQUFHLEdBQUcsQ0FBQztTQUNuQjs7QUFFRCxZQUFLLElBQUksS0FBSyxPQUFPLEVBQUc7QUFDcEIscUJBQVMsR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDO1NBQzVCLE1BQ0k7QUFDRCwwQkFBYyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsT0FBTyxHQUFHLE9BQU8sQ0FBRSxDQUFDO0FBQy9DLDBCQUFjLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUUsY0FBYyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUUsQ0FBQztBQUMzRCxxQkFBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUNoQyxjQUFjLEVBQ2QsQ0FBQyxFQUNELEdBQUcsRUFDSCxDQUFDLEVBQ0QsSUFBSSxDQUNQLEdBQUcsS0FBSyxDQUFDO1NBQ2I7O0FBRUQsZUFBTyxTQUFTLENBQUM7S0FDcEI7O0FBaEhDLG1CQUFlLFdBbUhqQixxQkFBcUIsR0FBQSwrQkFBRSxTQUFTLEVBQUUsZUFBZSxFQUFHO0FBQ2hELFlBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQzs7QUFFMUMsZUFBTyxDQUFFLFNBQVMsQ0FBRSxHQUFHLE9BQU8sQ0FBRSxTQUFTLENBQUUsSUFBSSxFQUFFLENBQUM7QUFDbEQsZUFBTyxDQUFFLFNBQVMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxlQUFlLENBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsMEJBQTBCLENBQUMsT0FBTyxDQUFFLGVBQWUsQ0FBRSxDQUFDO0tBQzlEOztBQXpIQyxtQkFBZSxXQTJIakIscUJBQXFCLEdBQUEsK0JBQUUsU0FBUyxFQUFHO0FBQy9CLFlBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBRSxTQUFTLENBQUU7WUFDbEQsS0FBSyxHQUFHLENBQUMsQ0FBQzs7QUFFZCxZQUFLLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFHO0FBQ3BDLG1CQUFPLElBQUksQ0FBQztTQUNmOztBQUVELFlBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUN0QyxlQUFPLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztLQUN4Qjs7QUFySUMsbUJBQWUsV0F1SWpCLDRCQUE0QixHQUFBLHdDQUFHO0FBQzNCLFlBQUksU0FBUyxHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLEVBQUU7WUFDakQsU0FBUyxDQUFDOztBQUVkLGVBQU8sQ0FBQyxHQUFHLENBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBRSxDQUFDOztBQUVsQyxZQUFLLEtBQUssQ0FBQyxPQUFPLENBQUUsU0FBUyxDQUFFLEVBQUc7QUFDOUIscUJBQVMsR0FBRyxTQUFTLENBQUUsQ0FBQyxDQUFFLENBQUMsU0FBUyxDQUFDOztBQUVyQyxpQkFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDekMsb0JBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFFLFNBQVMsQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFFLENBQUM7QUFDNUQsNEJBQVksQ0FBRSxTQUFTLENBQUUsQ0FBQyxDQUFFLENBQUMsS0FBSyxDQUFFLENBQUM7YUFDeEM7U0FDSixNQUNJO0FBQ0QscUJBQVMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDO0FBQ2hDLGdCQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBRSxTQUFTLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBRSxDQUFDO0FBQ3ZELHdCQUFZLENBQUUsU0FBUyxDQUFDLEtBQUssQ0FBRSxDQUFDO1NBQ25DOztBQUVELFlBQUksQ0FBQyxzQkFBc0IsQ0FBRSxTQUFTLENBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7QUFFL0MsZUFBTyxTQUFTLENBQUM7S0FDcEI7O0FBOUpDLG1CQUFlLFdBaUtqQixxQkFBcUIsR0FBQSwrQkFBRSxlQUFlLEVBQUUsS0FBSyxFQUFHO0FBQzVDLHVCQUFlLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDMUQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUUsZUFBZSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUM7QUFDaEUsdUJBQWUsQ0FBQyxLQUFLLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDbEM7O0FBcktDLG1CQUFlLFdBdUtqQixZQUFZLEdBQUEsc0JBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUc7QUFDdkMsWUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLO1lBQzFCLE1BQU0sR0FBRyxHQUFHO1lBQ1osb0JBQW9CO1lBQ3BCLGVBQWU7WUFDZixvQkFBb0IsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsTUFBTTtZQUM3RCxpQkFBaUI7WUFDakIsU0FBUyxHQUFHLEdBQUcsQ0FBQzs7QUFFcEIsWUFBSyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRztBQUMvQyxnQkFBSyxNQUFNLEtBQUssR0FBRyxFQUFHO0FBQ2xCLCtCQUFlLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDdkcsb0JBQUksQ0FBQyxxQkFBcUIsQ0FBRSxlQUFlLEVBQUUsS0FBSyxDQUFFLENBQUM7QUFDckQsb0JBQUksQ0FBQyxxQkFBcUIsQ0FBRSxTQUFTLEVBQUUsZUFBZSxDQUFFLENBQUM7YUFDNUQsTUFDSTtBQUNELG9DQUFvQixHQUFHLEVBQUUsQ0FBQzs7QUFFMUIscUJBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDL0IsMEJBQU0sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUUsQ0FBQyxDQUFFLENBQUM7QUFDcEMsbUNBQWUsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQztBQUN2Ryx3QkFBSSxDQUFDLHFCQUFxQixDQUFFLGVBQWUsRUFBRSxLQUFLLENBQUUsQ0FBQztBQUNyRCx3Q0FBb0IsQ0FBQyxJQUFJLENBQUUsZUFBZSxDQUFFLENBQUM7aUJBQ2hEOztBQUVELG9CQUFJLENBQUMscUJBQXFCLENBQUUsU0FBUyxFQUFFLG9CQUFvQixDQUFFLENBQUM7YUFDakU7U0FDSixNQUVJO0FBQ0QsZ0JBQUssTUFBTSxLQUFLLEdBQUcsRUFBRztBQUNsQiwrQkFBZSxHQUFHLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO0FBQ3RELGlDQUFpQixHQUFHLGVBQWUsQ0FBQyxTQUFTLENBQUM7QUFDOUMseUJBQVMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUUsaUJBQWlCLEVBQUUsU0FBUyxDQUFFLENBQUM7O0FBRXJFLCtCQUFlLENBQUMsS0FBSyxDQUFFLFNBQVMsRUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsR0FBRyxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUUsQ0FBQztBQUMxRixvQkFBSSxDQUFDLHFCQUFxQixDQUFFLFNBQVMsRUFBRSxlQUFlLENBQUUsQ0FBQzthQUM1RCxNQUNJO0FBQ0QsK0JBQWUsR0FBRyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztBQUN0RCxpQ0FBaUIsR0FBRyxlQUFlLENBQUUsQ0FBQyxDQUFFLENBQUMsU0FBUyxDQUFDO0FBQ25ELHlCQUFTLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFFLGlCQUFpQixFQUFFLFNBQVMsQ0FBRSxDQUFDOztBQUVyRSxxQkFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRztBQUMvQiwwQkFBTSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztBQUNwQyxtQ0FBZSxDQUFFLENBQUMsQ0FBRSxDQUFDLEtBQUssQ0FBRSxTQUFTLEVBQUUsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEdBQUcsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFFLENBQUM7aUJBQ2xHOztBQUVELG9CQUFJLENBQUMscUJBQXFCLENBQUUsU0FBUyxFQUFFLGVBQWUsQ0FBRSxDQUFDO2FBQzVEO1NBQ0o7OztBQUdELGVBQU8sb0JBQW9CLEdBQUcsb0JBQW9CLEdBQUcsZUFBZSxDQUFDO0tBQ3hFOztBQTdOQyxtQkFBZSxXQStOakIsS0FBSyxHQUFBLGVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUc7QUFDaEMsWUFBSSxJQUFJLEdBQUcsQ0FBQztZQUNSLG1CQUFtQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7O0FBRXpELGdCQUFRLEdBQUcsT0FBTyxRQUFRLEtBQUssUUFBUSxHQUFHLFFBQVEsR0FBRyxDQUFDLENBQUM7QUFDdkQsYUFBSyxHQUFHLE9BQU8sS0FBSyxLQUFLLFFBQVEsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUc5QyxZQUFLLG1CQUFtQixLQUFLLENBQUMsRUFBRztBQUM3QixvQkFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxtQkFBbUIsR0FBRyxHQUFHLEVBQUUsR0FBRyxHQUFHLG1CQUFtQixHQUFHLEdBQUcsQ0FBRSxDQUFBO1NBQ3ZILE1BQ0k7QUFDRCxvQkFBUSxHQUFHLEdBQUcsQ0FBQztTQUNsQjs7QUFHRCxZQUFLLE9BQU8sU0FBUyxLQUFLLFFBQVEsRUFBRztBQUNqQyxnQkFBSSxDQUFDLFlBQVksQ0FBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBRSxDQUFDO1NBQ25EOzs7Ozs7Ozs7Ozs7QUFZRCxlQUFPLElBQUksQ0FBQztLQUNmOztBQTlQQyxtQkFBZSxXQWtRakIsb0JBQW9CLEdBQUEsOEJBQUUsZUFBZSxFQUFFLEtBQUssRUFBRztBQUMzQyxZQUFJLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWhCLFlBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFFLGVBQWUsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDOztBQUUvRCx1QkFBZSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUUsWUFBVzs7QUFFM0MsMkJBQWUsQ0FBQyxJQUFJLENBQUUsS0FBSyxDQUFFLENBQUM7QUFDOUIsMkJBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUMxQiwyQkFBZSxHQUFHLElBQUksQ0FBQztTQUMxQixFQUFFLEtBQUssR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBRSxDQUFDO0tBQ2hFOztBQTdRQyxtQkFBZSxXQStRakIsV0FBVyxHQUFBLHFCQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFHO0FBQ3RDLFlBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBRSxTQUFTLENBQUUsQ0FBQzs7QUFFOUQsWUFBSyxlQUFlLEVBQUc7O0FBRW5CLGdCQUFLLEtBQUssQ0FBQyxPQUFPLENBQUUsZUFBZSxDQUFFLEVBQUc7QUFDcEMscUJBQU0sSUFBSSxDQUFDLEdBQUcsZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRztBQUNwRCx3QkFBSSxDQUFDLG9CQUFvQixDQUFFLGVBQWUsQ0FBRSxDQUFDLENBQUUsRUFBRSxLQUFLLENBQUUsQ0FBQztpQkFDNUQ7YUFDSixNQUNJO0FBQ0Qsb0JBQUksQ0FBQyxvQkFBb0IsQ0FBRSxlQUFlLEVBQUUsS0FBSyxDQUFFLENBQUM7YUFDdkQ7U0FDSjs7QUFFRCx1QkFBZSxHQUFHLElBQUksQ0FBQztLQUMxQjs7QUEvUkMsbUJBQWUsV0FpU2pCLElBQUksR0FBQSxjQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFHO0FBQy9CLGdCQUFRLEdBQUcsT0FBTyxRQUFRLEtBQUssUUFBUSxHQUFHLFFBQVEsR0FBRyxDQUFDLENBQUM7QUFDdkQsYUFBSyxHQUFHLE9BQU8sS0FBSyxLQUFLLFFBQVEsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUU5QyxZQUFLLE9BQU8sU0FBUyxLQUFLLFFBQVEsRUFBRztBQUNqQyxnQkFBSSxDQUFDLFdBQVcsQ0FBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBRSxDQUFDO1NBQ2xEOzs7Ozs7Ozs7Ozs7QUFZRCxlQUFPLElBQUksQ0FBQztLQUNmOztXQXBUQyxlQUFlOzs7QUF5VHJCLGVBQWUsQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBTyxDQUFDOztBQUV0QyxPQUFPLENBQUMsU0FBUyxDQUFDLHFCQUFxQixHQUFHLFVBQVUsT0FBTyxFQUFHO0FBQzFELFdBQU8sSUFBSSxlQUFlLENBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBRSxDQUFDO0NBQy9DLENBQUM7Ozs7Ozs7Ozs4QkM3VmtCLG9CQUFvQjs7OzsyQkFDdkIsaUJBQWlCOzs7OzRCQUNoQixrQkFBa0I7Ozs7UUFDN0IsdUJBQXVCOzs7O1FBSXZCLHNCQUFzQjs7UUFDdEIsOEJBQThCOztRQUM5Qiw0QkFBNEI7O1FBQzVCLHNCQUFzQjs7OztRQUV0QiwyQkFBMkI7O1FBQzNCLDZCQUE2Qjs7UUFDN0IsMkJBQTJCOztRQUMzQiwyQkFBMkI7O1FBQzNCLDJCQUEyQjs7UUFDM0IsOEJBQThCOztRQUM5QixnQ0FBZ0M7O1FBQ2hDLGdDQUFnQzs7UUFDaEMseUJBQXlCOztRQUN6QixzQkFBc0I7O1FBQ3RCLDhCQUE4Qjs7UUFDOUIsaUNBQWlDOzs7O1FBR2pDLHNDQUFzQzs7UUFDdEMsbUNBQW1DOzs7O1FBR25DLGtDQUFrQzs7UUFDbEMsNkJBQTZCOztRQUM3Qiw2QkFBNkI7O1FBQzdCLDZCQUE2Qjs7UUFDN0Isa0NBQWtDOzs7O1FBR2xDLHlDQUF5Qzs7UUFDekMsNkNBQTZDOztRQUM3Qyw2Q0FBNkM7O1FBQzdDLGlEQUFpRDs7UUFDakQsb0RBQW9EOztRQUNwRCx3Q0FBd0M7O1FBQ3hDLDBDQUEwQzs7UUFDMUMsOENBQThDOztRQUM5QyxpREFBaUQ7Ozs7UUFHakQsOENBQThDOztRQUM5QyxrQ0FBa0M7O1FBQ2xDLGlDQUFpQzs7UUFDakMsa0NBQWtDOztRQUNsQyxtQ0FBbUM7O1FBQ25DLGtDQUFrQzs7UUFDbEMsa0NBQWtDOzs7O1FBR2xDLGdCQUFnQjs7UUFDaEIsZ0JBQWdCOztRQUNoQixvQkFBb0I7O1FBQ3BCLGtCQUFrQjs7UUFDbEIscUJBQXFCOztRQUNyQixtQkFBbUI7O1FBQ25CLGtCQUFrQjs7UUFDbEIsZ0JBQWdCOztRQUNoQixnQkFBZ0I7O1FBQ2hCLHFCQUFxQjs7UUFDckIsbUJBQW1COztRQUNuQixnQkFBZ0I7O1FBQ2hCLHVCQUF1Qjs7UUFDdkIsa0JBQWtCOztRQUNsQixrQkFBa0I7O1FBQ2xCLHFCQUFxQjs7UUFDckIsaUJBQWlCOztRQUNqQixpQkFBaUI7O1FBQ2pCLHFCQUFxQjs7UUFDckIsbUJBQW1COztRQUNuQixtQkFBbUI7Ozs7UUFHbkIsaUJBQWlCOztRQUNqQix3QkFBd0I7Ozs7UUFHeEIsZ0NBQWdDOztRQUNoQyw4QkFBOEI7O1FBQzlCLDRCQUE0Qjs7UUFDNUIsZ0NBQWdDOzs7O1FBR2hDLHNCQUFzQjs7UUFDdEIsc0JBQXNCOztRQUN0Qix5QkFBeUI7O1FBQ3pCLDBCQUEwQjs7UUFDMUIseUJBQXlCOzs7O1FBR3pCLGtDQUFrQzs7UUFDbEMsdUNBQXVDOztRQUN2QyxnQ0FBZ0M7O1FBQ2hDLDRCQUE0Qjs7OztRQUc1QixvQ0FBb0M7Ozs7UUFHcEMsZ0NBQWdDOztRQUNoQyw2QkFBNkI7O1FBQzdCLHVCQUF1Qjs7OztBQS9HOUIsTUFBTSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxJQUFJLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxBQW1IdkUsTUFBTSxDQUFDLEtBQUssNEJBQVEsQ0FBQztBQUNyQixNQUFNLENBQUMsSUFBSSwyQkFBTyxDQUFDOzs7Ozs7Ozs7OztRQ3BIWixxQkFBcUI7OzJCQUNYLGtCQUFrQjs7OztBQUVuQyxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7O0FBRWpCLFNBQVMsbUJBQW1CLENBQUUsSUFBSSxFQUFHO0FBQ2pDLFFBQUksS0FBSyxHQUFHLElBQUksWUFBWSxDQUFFLElBQUksQ0FBRTtRQUNoQyxDQUFDLEdBQUcsQ0FBQztRQUNMLENBQUMsR0FBRyxDQUFDLENBQUM7O0FBRVYsU0FBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRztBQUNyQixTQUFDLEdBQUcsQUFBRSxDQUFDLEdBQUcsSUFBSSxHQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekIsYUFBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQyxDQUFFLENBQUM7S0FDOUI7O0FBRUQsV0FBTyxLQUFLLENBQUM7Q0FDaEI7O0lBRUssR0FBRztjQUFILEdBQUc7Ozs7OztBQUtNLGFBTFQsR0FBRyxDQUtRLEVBQUUsRUFBa0I7WUFBaEIsUUFBUSx5REFBRyxFQUFFOzs4QkFMNUIsR0FBRzs7QUFNRCx5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHbEIsWUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxDQUFFO1lBQ3RDLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ3ZCLElBQUksR0FBRyxJQUFJLEdBQUcsUUFBUSxDQUFDOztBQUUzQixZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLFlBQVksQ0FBQztBQUMvQyxZQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsWUFBWSxDQUFDOzs7Ozs7O0FBTzVDLFlBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFFLEVBQUc7QUFDbkIsbUJBQU8sQ0FBRSxJQUFJLENBQUUsR0FBRyxtQkFBbUIsQ0FBRSxJQUFJLENBQUUsQ0FBQztTQUNqRDs7QUFFRCxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUUsT0FBTyxDQUFFLElBQUksQ0FBRSxDQUFFLENBQUM7O0FBRzNELFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUN6QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRTFDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O1dBaENDLEdBQUc7OztBQW1DVCxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFVLFFBQVEsRUFBRztBQUMvQyxXQUFPLElBQUksR0FBRyxDQUFFLElBQUksRUFBRSxRQUFRLENBQUUsQ0FBQztDQUNwQyxDQUFDOzs7Ozs7Ozs7Ozs7O1FDdkRLLHFCQUFxQjs7MkJBQ1gsa0JBQWtCOzs7Ozs7Ozs7Ozs7Ozs7O0lBYTdCLEdBQUc7Y0FBSCxHQUFHOztBQUNNLGFBRFQsR0FBRyxDQUNRLEVBQUUsRUFBRSxLQUFLLEVBQUc7OEJBRHZCLEdBQUc7O0FBRUQseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUUsQ0FBQzs7QUFFaEQsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0FBQzlDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7O0FBRzlDLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUM7S0FDMUM7O2lCQVhDLEdBQUc7O2FBYUksZUFBRztBQUNYLG1CQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztTQUNqQzthQUNRLGFBQUUsS0FBSyxFQUFHO0FBQ2xCLGdCQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQ2xDOzs7V0FsQkMsR0FBRzs7O0FBc0JULE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQzVDLFdBQU8sSUFBSSxHQUFHLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0NBQ2pDLENBQUM7Ozs7Ozs7Ozs7Ozs7UUN0Q0sscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFnQzdCLE9BQU87Y0FBUCxPQUFPOzs7Ozs7QUFLRSxhQUxULE9BQU8sQ0FLSSxFQUFFLEVBQUUsVUFBVSxFQUFPLFVBQVUsRUFBRztZQUE5QixVQUFVLGdCQUFWLFVBQVUsR0FBRyxFQUFFOzs4QkFMOUIsT0FBTzs7QUFNTCx5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7O0FBRTVCLGFBQUssQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDOzs7QUFHOUIsYUFBSyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDbEIsYUFBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ2hDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxHQUFHLENBQUUsQ0FBQztBQUN0QyxhQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBRSxDQUFDO0FBQ3pFLGFBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxVQUFVLENBQUUsQ0FBQztBQUM3RCxhQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNqRCxZQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7Ozs7Ozs7O0FBUXpELGFBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBRSxDQUFDO0FBQ3hELGFBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7QUFFdEMsYUFBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDO0FBQ2xDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFMUMsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQzs7OztBQUt2QixZQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7S0FDdEM7O2lCQXhDQyxPQUFPOzthQTBDSyxlQUFHO0FBQ2IsbUJBQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLFVBQVUsQ0FBQztTQUNyQzthQUVhLGFBQUUsVUFBVSxFQUFHO0FBQ3pCLGdCQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUN2QixNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQzs7O0FBRzFCLGdCQUFJLENBQUMsY0FBYyxDQUFFLE1BQU0sQ0FBRSxDQUFDOztBQUU5QixpQkFBSyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7QUFDOUIsaUJBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxVQUFVLENBQUM7O0FBRXBDLGlCQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3BELG9CQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZDLHFCQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDMUIscUJBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUMxQyxvQkFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUUsQ0FBQztBQUN0QixxQkFBSyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsR0FBRyxDQUFFLENBQUM7QUFDM0IscUJBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFFLEtBQUssQ0FBRSxDQUFDO0FBQzNCLG9CQUFJLEdBQUcsS0FBSyxDQUFDO2FBQ2hCOztBQUVELGdCQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO1NBQzFCOzs7V0FuRUMsT0FBTzs7O0FBc0ViLE9BQU8sQ0FBQyxTQUFTLENBQUMsYUFBYSxHQUFHLFVBQVUsVUFBVSxFQUFFLFVBQVUsRUFBRztBQUNqRSxXQUFPLElBQUksT0FBTyxDQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFFLENBQUM7Q0FDdEQsQ0FBQzs7Ozs7Ozs7Ozs7OztRQ3pHSyxxQkFBcUI7OzJCQUNYLGtCQUFrQjs7OztJQUc3QixLQUFLO2NBQUwsS0FBSzs7QUFDSSxhQURULEtBQUssQ0FDTSxFQUFFLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRzs4QkFEcEMsS0FBSzs7QUFFSCx5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7O0FBRTVCLGFBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsUUFBUSxDQUFFLENBQUM7QUFDMUMsYUFBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxRQUFRLENBQUUsQ0FBQzs7OztBQUkxQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsR0FBRyxDQUFFLENBQUM7QUFDdEMsYUFBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBRSxDQUFDO0FBQy9CLGFBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7O0FBR3ZDLFlBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztBQUM3QyxZQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7O0FBRTdDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O2lCQXBCQyxLQUFLOzthQXNCQSxlQUFHO0FBQ04sbUJBQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7U0FDcEM7YUFDTSxhQUFFLEtBQUssRUFBRztBQUNiLGdCQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDckM7OzthQUVNLGVBQUc7QUFDTixtQkFBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztTQUNwQzthQUNNLGFBQUUsS0FBSyxFQUFHO0FBQ2IsZ0JBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUNyQzs7O1dBbENDLEtBQUs7OztBQXVDWCxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxVQUFVLFFBQVEsRUFBRSxRQUFRLEVBQUc7QUFDM0QsV0FBTyxJQUFJLEtBQUssQ0FBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBRSxDQUFDO0NBQ2hELENBQUM7Ozs7Ozs7Ozs7Ozs7OEJDN0NrQixxQkFBcUI7Ozs7MkJBQ3hCLGtCQUFrQjs7OztJQUU3QixRQUFRO2NBQVIsUUFBUTs7Ozs7Ozs7QUFNQyxhQU5ULFFBQVEsQ0FNRyxFQUFFLEVBQWdCO1lBQWQsS0FBSyx5REFBRyxHQUFHOzs4QkFOMUIsUUFBUTs7QUFPTix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxLQUFLLEtBQUssUUFBUSxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDckUsWUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztLQUN2RDs7aUJBWEMsUUFBUTs7YUFhRCxlQUFHO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1NBQ3ZDO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUN4Qzs7O1dBbEJDLFFBQVE7OztBQXFCZCw0QkFBUSxTQUFTLENBQUMsY0FBYyxHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQ2pELFdBQU8sSUFBSSxRQUFRLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0NBQ3RDLENBQUM7OztBQUlGLEFBQUMsQ0FBQSxZQUFXO0FBQ1IsUUFBSSxDQUFDLEVBQ0QsRUFBRSxFQUNGLEdBQUcsRUFDSCxJQUFJLEVBQ0osR0FBRyxFQUNILE1BQU0sRUFDTixLQUFLLEVBQ0wsT0FBTyxFQUNQLEtBQUssQ0FBQzs7QUFFVixnQ0FBUSxTQUFTLENBQUMsZUFBZSxHQUFHLFlBQVc7QUFDM0MsWUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUUsSUFBSSxDQUFDLENBQUMsQ0FBRSxDQUFDO0FBQzNDLFNBQUMsR0FBRyxDQUFDLENBQUM7QUFDTixlQUFPLENBQUMsQ0FBQztLQUNaLENBQUM7O0FBRUYsZ0NBQVEsU0FBUyxDQUFDLGdCQUFnQixHQUFHLFlBQVc7QUFDNUMsWUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBRSxDQUFDO0FBQzdDLFVBQUUsR0FBRyxDQUFDLENBQUM7QUFDUCxlQUFPLENBQUMsQ0FBQztLQUNaLENBQUM7O0FBRUYsZ0NBQVEsU0FBUyxDQUFDLGlCQUFpQixHQUFHLFlBQVc7QUFDN0MsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUUsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUUsQ0FBQztBQUNsRCxXQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ1IsZUFBTyxDQUFDLENBQUM7S0FDWixDQUFDOztBQUVGLGdDQUFRLFNBQVMsQ0FBQyxrQkFBa0IsR0FBRyxZQUFXO0FBQzlDLFlBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFFLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQztBQUNqRCxZQUFJLEdBQUcsQ0FBQyxDQUFDO0FBQ1QsZUFBTyxDQUFDLENBQUM7S0FDWixDQUFDOztBQUVGLGdDQUFRLFNBQVMsQ0FBQyxpQkFBaUIsR0FBRyxZQUFXO0FBQzdDLFlBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFFLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQztBQUMvQyxXQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ1IsZUFBTyxDQUFDLENBQUM7S0FDWixDQUFDOztBQUVGLGdDQUFRLFNBQVMsQ0FBQyxvQkFBb0IsR0FBRyxZQUFXO0FBQ2hELFlBQUksQ0FBQyxHQUFHLE1BQU0sSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUNyRCxjQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ1gsZUFBTyxDQUFDLENBQUM7S0FDWixDQUFDOztBQUVGLGdDQUFRLFNBQVMsQ0FBQyxtQkFBbUIsR0FBRyxZQUFXO0FBQy9DLFlBQUksQ0FBQyxHQUFHLEtBQUssSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUNuRCxhQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ1YsZUFBTyxDQUFDLENBQUM7S0FDWixDQUFDOztBQUVGLGdDQUFRLFNBQVMsQ0FBQyxxQkFBcUIsR0FBRyxZQUFXO0FBQ2pELFlBQUksQ0FBQyxHQUFHLE9BQU8sSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQztBQUN2RCxlQUFPLEdBQUcsQ0FBQyxDQUFDO0FBQ1osZUFBTyxDQUFDLENBQUM7S0FDWixDQUFDOztBQUVGLGdDQUFRLFNBQVMsQ0FBQyxtQkFBbUIsR0FBRyxZQUFXO0FBQy9DLFlBQUksQ0FBQyxHQUFHLEtBQUssSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUNuRCxhQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ1YsZUFBTyxDQUFDLENBQUM7S0FDWixDQUFDO0NBQ0wsQ0FBQSxFQUFFLENBQUU7Ozs7Ozs7Ozs7Ozs7UUM5RkUscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7OztJQU03QixNQUFNO2NBQU4sTUFBTTs7QUFDRyxhQURULE1BQU0sQ0FDSyxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRzs4QkFEakMsTUFBTTs7QUFFSix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7O0FBRzVCLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsS0FBSyxDQUFFLENBQUM7QUFDaEQsWUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQzs7QUFFbkMsYUFBSyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFFLFFBQVEsQ0FBRSxDQUFDO0FBQ3hELFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxVQUFVLENBQUUsQ0FBQzs7QUFFN0MsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFFLENBQUM7O0FBRW5ELFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXpDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O2lCQW5CQyxNQUFNOzthQXFCQyxlQUFHO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxLQUFLLENBQUM7U0FDakM7YUFDUSxhQUFFLEtBQUssRUFBRztBQUNmLGdCQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDbEM7OzthQUVXLGVBQUc7QUFDWCxtQkFBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztTQUNuQzthQUNXLGFBQUUsS0FBSyxFQUFHO0FBQ2xCLGdCQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7U0FDcEM7OztXQWpDQyxNQUFNOzs7QUFvQ1osT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsVUFBVSxLQUFLLEVBQUUsUUFBUSxFQUFHO0FBQ3pELFdBQU8sSUFBSSxNQUFNLENBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUUsQ0FBQztDQUM5QyxDQUFDOzs7Ozs7Ozs7OztRQzdDSyxxQkFBcUI7OzJCQUNYLGtCQUFrQjs7Ozs7Ozs7SUFNN0IsS0FBSztjQUFMLEtBQUs7O0FBQ0ksYUFEVCxLQUFLLENBQ00sRUFBRSxFQUFHOzhCQURoQixLQUFLOztBQUVILHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsYUFBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBRSxDQUFDOzs7O0FBSWhFLGFBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUN0QyxhQUFLLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzs7QUFFaEQsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLE1BQUcsQ0FBRSxDQUFDO0FBQzdDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sUUFBSyxDQUFFLENBQUM7O0FBRTFDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUN6QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRTFDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O1dBdEJDLEtBQUs7OztBQXlCWCxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxZQUFXO0FBQ3ZDLFdBQU8sSUFBSSxLQUFLLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDNUIsQ0FBQzs7Ozs7Ozs7Ozs7OztRQ2xDSyxxQkFBcUI7OzJCQUNYLGtCQUFrQjs7OztJQUU3QixJQUFJO2NBQUosSUFBSTs7Ozs7O0FBS0ssYUFMVCxJQUFJLENBS08sRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFHOzhCQUxuQyxJQUFJOztBQU1GLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsYUFBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ2hDLGFBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUMxQyxhQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7O0FBRTFDLGFBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsS0FBSyxDQUFFLENBQUM7QUFDM0MsYUFBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxHQUFHLENBQUUsQ0FBQztBQUN2QyxhQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBRSxDQUFDOztBQUUzQyxhQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMxQyxhQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1QyxhQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMvQyxhQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFNUMsYUFBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDdkMsYUFBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRTFDLGFBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFdkMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLEtBQUssQ0FBRSxDQUFDO0FBQ3hDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxHQUFHLENBQUUsQ0FBQztBQUN0QyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsS0FBSyxDQUFFLENBQUM7O0FBRXhDLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDbEMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM5QixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDOztBQUVsQyxZQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQzFCOztpQkFyQ0MsSUFBSTs7YUF1Q0csZUFBRztBQUNSLG1CQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1NBQ3RDO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQ3ZDOzs7YUFFTSxlQUFHO0FBQ04sbUJBQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7U0FDcEM7YUFDTSxhQUFFLEtBQUssRUFBRztBQUNiLGdCQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDckM7OzthQUVRLGVBQUc7QUFDUixtQkFBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztTQUN0QzthQUNRLGFBQUUsS0FBSyxFQUFHO0FBQ2YsZ0JBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUN2Qzs7O1dBMURDLElBQUk7OztBQTZEVixPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxVQUFVLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFHO0FBQ3pELFdBQU8sSUFBSSxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDM0IsQ0FBQzs7Ozs7Ozs7Ozs7OztRQ2xFSyxxQkFBcUI7OzJCQUNYLGtCQUFrQjs7Ozs7Ozs7OztJQVE3QixHQUFHO2NBQUgsR0FBRzs7QUFDTSxhQURULEdBQUcsQ0FDUSxFQUFFLEVBQUUsS0FBSyxFQUFHOzhCQUR2QixHQUFHOztBQUVELHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsYUFBSyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLENBQUM7QUFDaEQsYUFBSyxVQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUU1QyxZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBRSxDQUFDO0FBQ3RFLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxXQUFXLENBQUUsQ0FBQztBQUM5QyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUUsQ0FBQzs7QUFHN0QsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxVQUFPLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDckQsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxVQUFPLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDckQsYUFBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUUsS0FBSyxVQUFPLENBQUMsT0FBTyxDQUFFLENBQUM7QUFDbEQsYUFBSyxVQUFPLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFMUMsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7aUJBcEJDLEdBQUc7O2FBc0JJLGVBQUc7QUFDUixtQkFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7U0FDcEM7YUFDUSxhQUFFLEtBQUssRUFBRztBQUNmLGdCQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQ3JDOzs7V0EzQkMsR0FBRzs7O0FBOEJULE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQzVDLFdBQU8sSUFBSSxHQUFHLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0NBQ2pDLENBQUM7Ozs7Ozs7Ozs7Ozs7UUN6Q0sscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7Ozs7SUFPN0IsR0FBRztjQUFILEdBQUc7O0FBQ00sYUFEVCxHQUFHLENBQ1EsRUFBRSxFQUFFLEtBQUssRUFBRzs4QkFEdkIsR0FBRzs7QUFFRCx5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7O0FBRTVCLGFBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBRSxDQUFDO0FBQ3RFLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxRQUFRLENBQUUsQ0FBQztBQUMzQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUUsQ0FBQzs7QUFFMUQsYUFBSyxVQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUU1QyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLFVBQU8sQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztBQUNyRCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLFVBQU8sQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztBQUNyRCxhQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxLQUFLLFVBQU8sQ0FBQyxPQUFPLENBQUUsQ0FBQztBQUMvQyxhQUFLLFVBQU8sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUUxQyxZQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQzFCOztpQkFuQkMsR0FBRzs7YUFxQkksZUFBRztBQUNSLG1CQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztTQUNwQzthQUNRLGFBQUUsS0FBSyxFQUFHO0FBQ2YsZ0JBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDckM7OztXQTFCQyxHQUFHOzs7QUE4QlQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsVUFBVSxLQUFLLEVBQUc7QUFDNUMsV0FBTyxJQUFJLEdBQUcsQ0FBRSxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUM7Q0FDakMsQ0FBQzs7Ozs7Ozs7Ozs7OztRQ3hDTSxxQkFBcUI7OzJCQUNaLGtCQUFrQjs7Ozs7Ozs7O0lBTTdCLFFBQVE7Y0FBUixRQUFROztBQUNDLGFBRFQsUUFBUSxDQUNHLEVBQUUsRUFBRSxLQUFLLEVBQUc7OEJBRHZCLFFBQVE7O0FBRU4seUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDOztBQUVuQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDOUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUUsQ0FBQzs7QUFFbkQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQztLQUMxQzs7aUJBWEMsUUFBUTs7YUFhRCxlQUFHO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1NBQ3BDO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDO1NBQ3pFOzs7V0FsQkMsUUFBUTs7O0FBc0JkLE9BQU8sQ0FBQyxTQUFTLENBQUMsY0FBYyxHQUFHLFVBQVUsTUFBTSxFQUFFLE1BQU0sRUFBRztBQUMxRCxXQUFPLElBQUksUUFBUSxDQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFFLENBQUM7Q0FDL0MsQ0FBQzs7Ozs7Ozs7Ozs7UUMvQksscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7OztJQU03QixNQUFNO2NBQU4sTUFBTTs7QUFDRyxhQURULE1BQU0sQ0FDSyxFQUFFLEVBQUc7OEJBRGhCLE1BQU07O0FBRUoseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztLQUM5Qjs7V0FOQyxNQUFNOzs7QUFVWixPQUFPLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxZQUFXO0FBQ3hDLFdBQU8sSUFBSSxNQUFNLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDN0IsQ0FBQzs7Ozs7Ozs7Ozs7OztRQ25CSyxxQkFBcUI7OzJCQUNYLGtCQUFrQjs7Ozs7Ozs7OztJQU83QixHQUFHO2NBQUgsR0FBRzs7QUFDTSxhQURULEdBQUcsQ0FDUSxFQUFFLEVBQUUsS0FBSyxFQUFHOzhCQUR2QixHQUFHOztBQUVELHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsYUFBSyxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDdkIsYUFBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7O0FBRXBCLGFBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxFQUFFLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQzNELGlCQUFLLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDbEQsZ0JBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxXQUFXLENBQUUsQ0FBQyxDQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBRSxDQUFDO0FBQ2xFLGdCQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxXQUFXLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztBQUN2QyxnQkFBSSxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUUsQ0FBQyxDQUFFLENBQUM7U0FDakM7O0FBRUQsWUFBSSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRWxDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O0FBbkJDLE9BQUcsV0FxQkwsT0FBTyxHQUFBLG1CQUFHO0FBQ04sWUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDN0Isd0JBRkosT0FBTyxXQUVJLENBQUM7S0FDWDs7aUJBeEJDLEdBQUc7O2FBMEJJLGVBQUc7QUFDUixtQkFBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDO1NBQ2hDO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixnQkFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxVQUFVLENBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUV0RCxpQkFBTSxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRztBQUN0RCxxQkFBSyxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNwQyxxQkFBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO2FBQ3BDOztBQUVELGlCQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsRUFBRSxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRztBQUMzRCxxQkFBSyxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ2xELG9CQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUNsRSxvQkFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDdkMsb0JBQUksR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFDO2FBQ2pDOztBQUVELGdCQUFJLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFbEMsaUJBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQ3ZCOzs7V0FqREMsR0FBRzs7O0FBb0RULE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQzVDLFdBQU8sSUFBSSxHQUFHLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0NBQ2pDLENBQUM7Ozs7Ozs7Ozs7Ozs7UUM5REsscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7Ozs7Ozs7OztJQVk3QixVQUFVO2NBQVYsVUFBVTs7QUFDRCxhQURULFVBQVUsQ0FDQyxFQUFFLEVBQUUsUUFBUSxFQUFHOzhCQUQxQixVQUFVOztBQUVSLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksTUFBTSxHQUFHLFFBQVEsSUFBSSxHQUFHO1lBQ3hCLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBRTtZQUM3QixLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDM0MsYUFBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFFLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDOzs7QUFHckUsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDOztBQUV0RSxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFFLENBQUM7OztBQUdyRSxZQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFFLENBQUM7O0FBRXZFLFlBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDakQsYUFBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUUsQ0FBQztBQUNoRCxhQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBRSxDQUFDOztBQUVqRCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFFLENBQUM7QUFDekMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUUxQyxZQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQzFCOztpQkEzQkMsVUFBVTs7YUE2QkEsZUFBRztBQUNYLG1CQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO1NBQzlCO2FBQ1csYUFBRSxLQUFLLEVBQUc7QUFDbEIsZ0JBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsZ0JBQUssT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFHO0FBQzdCLHFCQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDO0FBQ3RFLHFCQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDO2FBQzdFO1NBQ0o7OztXQXZDQyxVQUFVOzs7QUEwQ2hCLE9BQU8sQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxRQUFRLEVBQUc7QUFDdEQsV0FBTyxJQUFJLFVBQVUsQ0FBRSxJQUFJLEVBQUUsUUFBUSxDQUFFLENBQUM7Q0FDM0MsQ0FBQzs7Ozs7Ozs7Ozs7UUN6REsscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7O0lBSzdCLEtBQUs7Y0FBTCxLQUFLOztBQUNJLGFBRFQsS0FBSyxDQUNNLEVBQUUsRUFBRzs4QkFEaEIsS0FBSzs7QUFFSCx5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7O0FBRTVCLGFBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNwQyxhQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLEdBQUcsQ0FBRSxDQUFDO0FBQ3JDLFlBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxHQUFHLENBQUUsQ0FBQztBQUNwQyxhQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsS0FBSyxDQUFFLENBQUM7QUFDakMsYUFBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDOztBQUV2QyxZQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQzFCOztXQWJDLEtBQUs7OztBQWdCWCxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxZQUFXO0FBQ3ZDLFdBQU8sSUFBSSxLQUFLLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDNUIsQ0FBQzs7Ozs7Ozs7Ozs7UUN4QksscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7OztJQU03QixXQUFXO2NBQVgsV0FBVzs7Ozs7O0FBS0YsYUFMVCxXQUFXLENBS0EsRUFBRSxFQUFHOzhCQUxoQixXQUFXOztBQU1ULHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsYUFBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3pDLGFBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7O0FBRTFELFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUN4QyxhQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRXpDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7OztXQWpCQyxXQUFXOzs7QUFxQmpCLE9BQU8sQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxlQUFlLEdBQUcsWUFBVztBQUNqRixXQUFPLElBQUksV0FBVyxDQUFFLElBQUksQ0FBRSxDQUFDO0NBQ2xDLENBQUM7Ozs7Ozs7Ozs7Ozs7UUM5QksscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7Ozs7Ozs7OztJQWE3QixLQUFLO2NBQUwsS0FBSzs7QUFDSSxhQURULEtBQUssQ0FDTSxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFHOzhCQURoRCxLQUFLOztBQUVILHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsS0FBSyxDQUFFLENBQUM7QUFDbkQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsTUFBTSxDQUFFLENBQUM7QUFDckQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsTUFBTSxDQUFFLENBQUM7QUFDckQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsT0FBTyxDQUFFLENBQUM7OztBQUl2RCxhQUFLLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDakQsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDeEQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHM0QsYUFBSyxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDbEQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDN0QsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1RCxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDdEMsYUFBSyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDcEQsYUFBSyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBR3JELGFBQUssQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3BELFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ2hFLFlBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHL0QsYUFBSyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQzFDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzdDLGFBQUssQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUd6RCxhQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDaEMsYUFBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVoRCxhQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRXZDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O2lCQTdDQyxLQUFLOzthQStDRSxlQUFHO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1NBQ3BDO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUNyQzs7O2FBRVMsZUFBRztBQUNULG1CQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztTQUNyQzthQUNTLGFBQUUsS0FBSyxFQUFHO0FBQ2hCLGdCQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQ3RDOzs7YUFFUyxlQUFHO0FBQ1QsbUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1NBQ3JDO2FBQ1MsYUFBRSxLQUFLLEVBQUc7QUFDaEIsZ0JBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDdEM7OzthQUVVLGVBQUc7QUFDVixtQkFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7U0FDdEM7YUFDVSxhQUFFLEtBQUssRUFBRztBQUNqQixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUN2Qzs7O1dBekVDLEtBQUs7OztBQTZFWCxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxVQUFVLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRztBQUN2RSxXQUFPLElBQUksS0FBSyxDQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUUsQ0FBQztDQUM1RCxDQUFDOzs7Ozs7Ozs7Ozs7O1FDN0ZLLHFCQUFxQjs7MkJBQ1gsa0JBQWtCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW9CN0IsUUFBUTtjQUFSLFFBQVE7O0FBQ0MsYUFEVCxRQUFRLENBQ0csRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUc7OEJBRDFELFFBQVE7O0FBRU4seUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOzs7Ozs7OztBQVE1QixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUUsQ0FBQztBQUNuRCxZQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQztBQUNyRCxZQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQztBQUNyRCxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxPQUFPLENBQUUsQ0FBQztBQUN2RCxhQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLFFBQVEsQ0FBRSxDQUFDOzs7QUFJbEQsYUFBSyxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ2pELFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3hELFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzNELGFBQUssQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUMxQyxhQUFLLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsVUFBVSxDQUFFLENBQUM7QUFDN0MsYUFBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLG1CQUFtQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1RCxZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLG1CQUFtQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRy9ELGFBQUssQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ2xELFlBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzdELFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUQsYUFBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ3RDLGFBQUssQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3BELGFBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUdyRCxhQUFLLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNoRSxhQUFLLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHN0QsYUFBSyxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDcEQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDaEUsWUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUcvRCxhQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLFFBQVEsQ0FBRSxDQUFDO0FBQzFDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxHQUFHLENBQUUsQ0FBQzs7O0FBR2xDLGFBQUssQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ2pELGFBQUssQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsUUFBUSxDQUFFLENBQUM7QUFDbEQsYUFBSyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBRSxDQUFDO0FBQ2xELGFBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxpQkFBaUIsQ0FBRSxDQUFDOzs7QUFJckQsYUFBSyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ3pDLGFBQUssQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUNoRCxhQUFLLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQy9ELGFBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ2hELFlBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN6RCxhQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBR3pELGFBQUssQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUN2QyxhQUFLLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM3RCxhQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzVELFlBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN2RCxhQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBS3JELGFBQUssQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0FBQ3hELGFBQUssQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ2pELGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxlQUFlLENBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsaUJBQWlCLE1BQUcsQ0FBRSxDQUFDO0FBQzVELGFBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUUsQ0FBQztBQUMzRCxhQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsaUJBQWlCLFFBQUssQ0FBRSxDQUFDOzs7QUFHekQsYUFBSyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLENBQUM7QUFDL0MsYUFBSyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQzVDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxVQUFVLENBQUUsQ0FBQztBQUN6QyxhQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsWUFBWSxNQUFHLENBQUUsQ0FBQztBQUNsRCxZQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUUsQ0FBQztBQUN4RCxhQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxZQUFZLFFBQUssQ0FBRSxDQUFDOztBQUUzRCxhQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRWhELFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O2lCQW5HQyxRQUFROzthQXFHRCxlQUFHO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1NBQ3BDO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUNyQzs7O2FBRVMsZUFBRztBQUNULG1CQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztTQUNyQzthQUNTLGFBQUUsS0FBSyxFQUFHO0FBQ2hCLGdCQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQ3RDOzs7YUFFUyxlQUFHO0FBQ1QsbUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1NBQ3JDO2FBQ1MsYUFBRSxLQUFLLEVBQUc7QUFDaEIsZ0JBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDdEM7OzthQUVVLGVBQUc7QUFDVixtQkFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7U0FDdEM7YUFDVSxhQUFFLEtBQUssRUFBRztBQUNqQixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUN2Qzs7O2FBRVcsZUFBRztBQUNYLG1CQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO1NBQzFDO2FBQ1csYUFBRSxLQUFLLEVBQUc7QUFDbEIsZ0JBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUM1QixpQkFBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQzlCLGlCQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7QUFDeEIsaUJBQUssQ0FBQyxXQUFXLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUNuQzs7O1dBeklDLFFBQVE7OztBQTZJZCxPQUFPLENBQUMsU0FBUyxDQUFDLGNBQWMsR0FBRyxVQUFVLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUc7QUFDcEYsV0FBTyxJQUFJLFFBQVEsQ0FBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBRSxDQUFDO0NBQ3pFLENBQUM7Ozs7Ozs7Ozs7O1FDcEtLLHFCQUFxQjs7MkJBQ1gsa0JBQWtCOzs7O0lBRTdCLElBQUk7Y0FBSixJQUFJOzs7Ozs7QUFLSyxhQUxULElBQUksQ0FLTyxFQUFFLEVBQUc7OEJBTGhCLElBQUk7O0FBTUYseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFFLENBQUM7O0FBRS9ELGFBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUN0QyxhQUFLLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzs7QUFFaEQsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBRSxDQUFDO0FBQzlDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFFLENBQUM7QUFDOUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDOztBQUV6QyxhQUFLLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxNQUFHLENBQUUsQ0FBQztBQUM3QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxRQUFLLENBQUUsQ0FBQztBQUMxQyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRTFDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O1dBeEJDLElBQUk7OztBQTJCVixPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxZQUFXO0FBQ3RDLFdBQU8sSUFBSSxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDM0IsQ0FBQzs7Ozs7Ozs7Ozs7UUNoQ0sscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWU3QixVQUFVO0FBQ0QsYUFEVCxVQUFVLENBQ0MsRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFHOzhCQUQvQyxVQUFVOztBQUVSLFlBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBRSxHQUFHLENBQUUsQ0FBQztBQUN6QyxZQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBRSxDQUFDO0FBQ2hELFlBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDOzs7QUFHMUIsYUFBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNuQyxvQkFBWSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUdqRCxvQkFBWSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUd0QyxZQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUM7O0FBRWxDLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztLQUMvQjs7QUFsQkMsY0FBVSxXQW9CWixPQUFPLEdBQUEsbUJBQUc7QUFDTixZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3hCLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDdEIsWUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFbkIsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDckIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDaEIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7S0FDdEI7O1dBN0JDLFVBQVU7OztJQWdDVixJQUFJO2NBQUosSUFBSTs7QUFDSyxhQURULElBQUksQ0FDTyxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsUUFBUSxFQUFHOzhCQUQ5QyxJQUFJOztBQUVGLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUdsQiwwQkFBa0IsR0FBRyxrQkFBa0IsSUFBSSxDQUFDLENBQUM7O0FBRTdDLGdCQUFRLEdBQUcsUUFBUSxJQUFJLEdBQUcsQ0FBQzs7QUFFM0IsWUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBRSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLEVBQUUsRUFBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUUzRSxZQUFJLENBQUMsS0FBSyxHQUFHLENBQUU7QUFDWCxrQkFBTSxFQUFFLElBQUksQ0FBQyxFQUFFO1NBQ2xCLENBQUUsQ0FBQzs7QUFFSixhQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsa0JBQWtCLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDM0MsZ0JBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUNYLElBQUksVUFBVSxDQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsRUFBRSxRQUFRLENBQUUsQ0FDN0UsQ0FBQztTQUNMOztBQUVELFlBQUksQ0FBQyxLQUFLLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7S0FDM0U7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBdEJDLElBQUk7OztBQTBDVixPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxVQUFVLGtCQUFrQixFQUFFLFFBQVEsRUFBRztBQUNwRSxXQUFPLElBQUksSUFBSSxDQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxRQUFRLENBQUUsQ0FBQztDQUN6RCxDQUFDOzs7Ozs7Ozs7Ozs4QkM1RmtCLHFCQUFxQjs7OzsyQkFDeEIsa0JBQWtCOzs7O0lBRzdCLE1BQU07Y0FBTixNQUFNOzs7Ozs7QUFLRyxhQUxULE1BQU0sQ0FLSyxFQUFFLEVBQUc7OEJBTGhCLE1BQU07O0FBTUoseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDakQsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDakQsYUFBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUU1QyxZQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQzFCOztXQWhCQyxNQUFNOzs7QUFtQlosNEJBQVEsU0FBUyxDQUFDLFlBQVksR0FBRyxZQUFXO0FBQ3hDLFdBQU8sSUFBSSxNQUFNLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDN0IsQ0FBQzs7Ozs7Ozs7Ozs7OztRQ3pCSyxxQkFBcUI7OzJCQUNYLGtCQUFrQjs7Ozs7Ozs7OztJQU83QixRQUFRO2NBQVIsUUFBUTs7QUFDQyxhQURULFFBQVEsQ0FDRyxFQUFFLEVBQUUsS0FBSyxFQUFHOzhCQUR2QixRQUFROztBQUVOLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsYUFBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDOztBQUV0QyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBRSxDQUFDOztBQUVoRCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDOUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDO0FBQ3pDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFMUMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQzs7QUFFdkMsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7aUJBakJDLFFBQVE7O2FBbUJELGVBQUc7QUFDUixtQkFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7U0FDcEM7YUFDUSxhQUFFLEtBQUssRUFBRztBQUNmLGdCQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFFLENBQUM7U0FDekU7OztXQXhCQyxRQUFROzs7QUEyQmQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEdBQUcsVUFBVSxLQUFLLEVBQUc7QUFDakQsV0FBTyxJQUFJLFFBQVEsQ0FBRSxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUM7Q0FDdEMsQ0FBQzs7Ozs7Ozs7Ozs7OztRQ3JDSyxxQkFBcUI7OzJCQUNYLGtCQUFrQjs7OztJQUU3QixNQUFNO2NBQU4sTUFBTTs7QUFDRyxhQURULE1BQU0sQ0FDSyxFQUFFLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRzs4QkFEeEMsTUFBTTs7QUFFSix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHbEIsb0JBQVksR0FBRyxPQUFPLFlBQVksS0FBSyxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxZQUFZLENBQUUsR0FBRyxZQUFZLENBQUM7O0FBRTFGLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsYUFBSyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7O0FBRWpCLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLFlBQVksQ0FBRSxDQUFDOztBQUUxRCxhQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ2pDLGdCQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDN0MsZ0JBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDbEMsaUJBQUssQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsaUJBQUssQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFFLENBQUM7QUFDbEQsZ0JBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDaEQsZ0JBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztTQUNqRDs7QUFFRCxZQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQzFCOztpQkF2QkMsTUFBTTs7YUF5QkcsZUFBRztBQUNWLG1CQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztTQUN0Qzs7O2FBRVEsZUFBRztBQUNSLG1CQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztTQUNwQzthQUNRLGFBQUUsS0FBSyxFQUFHO0FBQ2YsZ0JBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDckM7OztXQWxDQyxNQUFNOzs7QUFzQ1osT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsVUFBVSxRQUFRLEVBQUUsWUFBWSxFQUFHO0FBQ2hFLFdBQU8sSUFBSSxNQUFNLENBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUUsQ0FBQztDQUNyRCxDQUFDOzs7Ozs7Ozs7Ozs7O1FDM0NLLHdCQUF3Qjs7a0NBQ0gsdUJBQXVCOzs7O0lBRzdDLEdBQUc7Y0FBSCxHQUFHOzs7Ozs7QUFLTSxhQUxULEdBQUcsQ0FLUSxFQUFFLEVBQUc7OEJBTGhCLEdBQUc7O0FBTUQsb0NBQU8sRUFBRSxDQUFFLENBQUM7O0FBRVosWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRS9DLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ2pELFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVqRCxhQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRTVDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O1dBbkJDLEdBQUc7OztBQXNCVCxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxZQUFXO0FBQ3JDLFdBQU8sSUFBSSxHQUFHLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDMUIsQ0FBQzs7cUJBRWEsR0FBRzs7Ozs7Ozs7Ozs7Ozs7UUM5Qlgsd0JBQXdCOzsyQkFDZCxxQkFBcUI7Ozs7SUFHaEMsZUFBZTtjQUFmLGVBQWU7Ozs7OztBQUtOLGFBTFQsZUFBZSxDQUtKLEVBQUUsRUFBRzs4QkFMaEIsZUFBZTs7QUFNYix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7O0FBRTVCLGFBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQzs7QUFFL0IsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7V0FkQyxlQUFlOzs7cUJBaUJOLGVBQWU7O0FBRTlCLE9BQU8sQ0FBQyxTQUFTLENBQUMscUJBQXFCLEdBQUcsWUFBVztBQUNqRCxXQUFPLElBQUksZUFBZSxDQUFFLElBQUksQ0FBRSxDQUFDO0NBQ3RDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7UUN2Qkssd0JBQXdCOztrQ0FDSCx1QkFBdUI7Ozs7SUFHN0MsSUFBSTtjQUFKLElBQUk7Ozs7OztBQUtLLGFBTFQsSUFBSSxDQUtPLEVBQUUsRUFBRzs4QkFMaEIsSUFBSTs7QUFNRixvQ0FBTyxFQUFFLENBQUUsQ0FBQzs7QUFFWixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDNUIsYUFBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ2hDLGFBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNoQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7O0FBRTdDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzVDLGFBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxHQUFHLENBQUUsQ0FBQztBQUMvQixhQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRXZDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O1dBbkJDLElBQUk7OztBQXNCVixPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxZQUFXO0FBQ3RDLFdBQU8sSUFBSSxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDM0IsQ0FBQzs7cUJBRWEsSUFBSTs7Ozs7Ozs7Ozs7Ozs7O1FDL0JaLHdCQUF3Qjs7a0NBQ0gsdUJBQXVCOzs7O0lBRzdDLEdBQUc7Y0FBSCxHQUFHOzs7Ozs7QUFLTSxhQUxULEdBQUcsQ0FLUSxFQUFFLEVBQUc7OEJBTGhCLEdBQUc7O0FBTUQsb0NBQU8sRUFBRSxDQUFFLENBQUM7O0FBRVosWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQzVCLGFBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUM5QixhQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDaEMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDOztBQUU3QyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMzQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMzQyxhQUFLLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsR0FBRyxDQUFFLENBQUM7QUFDOUIsYUFBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUV2QyxZQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQzFCOztXQW5CQyxHQUFHOzs7QUFzQlQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsWUFBVztBQUNyQyxXQUFPLElBQUksR0FBRyxDQUFFLElBQUksQ0FBRSxDQUFDO0NBQzFCLENBQUM7O3FCQUVhLEdBQUc7Ozs7Ozs7Ozs7Ozs7O1FDL0JYLHdCQUF3Qjs7a0NBQ0gsdUJBQXVCOzs7O0lBRzdDLEdBQUc7Y0FBSCxHQUFHOzs7Ozs7QUFLTSxhQUxULEdBQUcsQ0FLUSxFQUFFLEVBQUc7OEJBTGhCLEdBQUc7O0FBTUQsb0NBQU8sRUFBRSxDQUFFLENBQUM7O0FBRVosWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLEdBQUcsQ0FBRSxDQUFDO0FBQ3JDLGFBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUUsQ0FBQyxDQUFFLENBQUM7QUFDN0MsYUFBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUVwQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDM0MsYUFBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBRSxDQUFDO0FBQ3BDLGFBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxLQUFLLENBQUUsQ0FBQTs7QUFFaEMsYUFBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUV6QyxZQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQzFCOztXQXJCQyxHQUFHOzs7QUF3QlQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsWUFBVztBQUNyQyxXQUFPLElBQUksR0FBRyxDQUFFLElBQUksQ0FBRSxDQUFDO0NBQzFCLENBQUM7O3FCQUVhLEdBQUc7Ozs7Ozs7Ozs7Ozs7O1FDaENYLHdCQUF3Qjs7a0NBQ0gsdUJBQXVCOzs7O0lBRzdDLEVBQUU7Y0FBRixFQUFFOzs7Ozs7QUFLTyxhQUxULEVBQUUsQ0FLUyxFQUFFLEVBQUc7OEJBTGhCLEVBQUU7O0FBTUEsb0NBQU8sRUFBRSxDQUFFLENBQUM7O0FBRVosWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDaEMsYUFBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBRSxDQUFDLENBQUUsQ0FBQztBQUMzQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFL0MsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBRSxDQUFDO0FBQ3RDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBRSxDQUFDO0FBQ3JELGFBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxPQUFPLENBQUUsQ0FBQztBQUNuQyxhQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRTNDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O1dBcEJDLEVBQUU7OztBQXVCUixPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBRyxZQUFXO0FBQ3BDLFdBQU8sSUFBSSxFQUFFLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDekIsQ0FBQzs7cUJBRWEsRUFBRTs7Ozs7Ozs7Ozs7Ozs7O1FDOUJWLHdCQUF3Qjs7a0NBQ0gsdUJBQXVCOzs7O0lBRzdDLEdBQUc7Y0FBSCxHQUFHOzs7Ozs7QUFLTSxhQUxULEdBQUcsQ0FLUSxFQUFFLEVBQUc7OEJBTGhCLEdBQUc7O0FBTUQsb0NBQU8sRUFBRSxDQUFFLENBQUM7O0FBRVosWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQzVCLGFBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUN4QyxhQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDaEMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDOztBQUU3QyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsT0FBTyxDQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFFLENBQUM7QUFDekQsYUFBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBRSxDQUFDO0FBQ25DLGFBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFdkMsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7V0FuQkMsR0FBRzs7O0FBc0JULE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFlBQVc7QUFDckMsV0FBTyxJQUFJLEdBQUcsQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUMxQixDQUFDOztxQkFFYSxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7O1FDL0JYLHdCQUF3Qjs7MkJBQ2QscUJBQXFCOzs7Ozs7SUFHaEMsT0FBTztjQUFQLE9BQU87O0FBQ0UsYUFEVCxPQUFPLENBQ0ksRUFBRSxFQUFFLEtBQUssRUFBRzs4QkFEdkIsT0FBTzs7QUFFTCx5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Ozs7QUFJNUIsYUFBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUUsRUFDMUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDOztBQUU1QyxhQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7Ozs7OztBQU1oQyxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFFLENBQUM7O0FBRXRFLGFBQUssQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0FBQ3hELGFBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUN2QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRTVDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUN6QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsZUFBZSxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUVuRCxZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDOztBQUVsQyxZQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQzFCOztpQkE5QkMsT0FBTzs7YUFnQ0EsZUFBRztBQUNSLG1CQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztTQUNwQzthQUNRLGFBQUUsS0FBSyxFQUFHO0FBQ2YsZ0JBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUUsQ0FBQztTQUN6RTs7O1dBckNDLE9BQU87OztBQXdDYixPQUFPLENBQUMsU0FBUyxDQUFDLGFBQWEsR0FBRyxVQUFVLEtBQUssRUFBRztBQUNoRCxXQUFPLElBQUksT0FBTyxDQUFFLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQztDQUNyQyxDQUFDOztxQkFFYSxPQUFPOzs7Ozs7OztRQ2hEZix3QkFBd0I7OzJCQUNkLHFCQUFxQjs7OzswQkFDbEIsZUFBZTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0NuQyxPQUFPLENBQUMsU0FBUyxDQUFDLGlCQUFpQixHQUFHLFlBQVc7OztBQUc3QyxXQUFPLDRCQUFhLElBQUksRUFBRSxDQUFDLENBQUUsQ0FBQztDQUNqQyxDQUFDOzs7Ozs7Ozs7Ozs7O1FDeENLLHdCQUF3Qjs7MkJBQ2QscUJBQXFCOzs7O0lBRWhDLFdBQVc7Y0FBWCxXQUFXOztBQUNGLGFBRFQsV0FBVyxDQUNBLEVBQUUsRUFBRSxLQUFLLEVBQUc7OEJBRHZCLFdBQVc7O0FBRVQseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUUsQ0FBQztBQUNuRCxhQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7O0FBRTVDLGFBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQzs7QUFFaEMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztBQUNyQyxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFFLENBQUM7O0FBRzFFLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDL0MsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUN6QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRTFDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O2lCQXJCQyxXQUFXOzthQXVCSixlQUFHO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1NBQ3BDO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDO1NBQ3pFOzs7V0E1QkMsV0FBVzs7O0FBK0JqQixPQUFPLENBQUMsU0FBUyxDQUFDLGlCQUFpQixHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQ3BELFdBQU8sSUFBSSxXQUFXLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0NBQ3pDLENBQUM7Ozs7Ozs7Ozs7Ozs7UUNwQ0ssd0JBQXdCOzsyQkFDZCxxQkFBcUI7Ozs7SUFFaEMsa0JBQWtCO2NBQWxCLGtCQUFrQjs7QUFDVCxhQURULGtCQUFrQixDQUNQLEVBQUUsRUFBRSxLQUFLLEVBQUc7OEJBRHZCLGtCQUFrQjs7QUFFaEIseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUUsQ0FBQztBQUNuRCxhQUFLLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztBQUNoRCxhQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7QUFDeEMsYUFBSyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU5QixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFFLENBQUM7QUFDaEUsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBRSxDQUFDOztBQUU1RCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsV0FBVyxDQUFFLENBQUM7QUFDOUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBRSxDQUFDO0FBQzFDLGFBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzVDLGFBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3hDLGFBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFdEMsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7aUJBckJDLGtCQUFrQjs7YUF1QlgsZUFBRztBQUNSLG1CQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztTQUNwQzthQUNRLGFBQUUsS0FBSyxFQUFHO0FBQ2YsZ0JBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUUsQ0FBQztTQUN6RTs7O1dBNUJDLGtCQUFrQjs7O0FBK0J4QixPQUFPLENBQUMsU0FBUyxDQUFDLHdCQUF3QixHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQzNELFdBQU8sSUFBSSxrQkFBa0IsQ0FBRSxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUM7Q0FDaEQsQ0FBQzs7Ozs7Ozs7Ozs7UUNwQ0ssd0JBQXdCOzsyQkFDZCxxQkFBcUI7Ozs7SUFFaEMsZUFBZTtjQUFmLGVBQWU7O0FBQ04sYUFEVCxlQUFlLENBQ0osRUFBRSxFQUFHOzhCQURoQixlQUFlOztBQUViLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztBQUNyQyxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFFLENBQUM7QUFDMUUsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDO0FBQ3pDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFMUMsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7V0FaQyxlQUFlOzs7QUFlckIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsR0FBRyxZQUFXO0FBQ2pELFdBQU8sSUFBSSxlQUFlLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDdEMsQ0FBQzs7Ozs7Ozs7Ozs7UUNwQkssd0JBQXdCOzsyQkFDZCxxQkFBcUI7Ozs7SUFFaEMsTUFBTTtjQUFOLE1BQU07O0FBQ0csYUFEVCxNQUFNLENBQ0ssRUFBRSxFQUFHOzhCQURoQixNQUFNOztBQUVKLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsYUFBSyxVQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUU1QyxZQUFJLE1BQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLENBQUM7QUFDdEMsWUFBSSxNQUFHLENBQUMsT0FBTyxDQUFFLEtBQUssVUFBTyxDQUFDLE9BQU8sQ0FBRSxDQUFDO0FBQ3hDLFlBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxVQUFPLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3JDLFlBQUksUUFBSyxHQUFHLEtBQUssVUFBTyxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQzs7QUFFckMsWUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLFVBQU8sQ0FBQyxNQUFNLENBQUM7QUFDbEMsWUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLFVBQU8sQ0FBQyxPQUFPLENBQUM7O0FBRXBDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O1dBakJDLE1BQU07OztBQW9CWixPQUFPLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxZQUFXO0FBQ3hDLFdBQU8sSUFBSSxNQUFNLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDN0IsQ0FBQzs7Ozs7Ozs7Ozs7OztRQ3pCSyx3QkFBd0I7OzJCQUNkLHFCQUFxQjs7OztJQUVoQyxRQUFRO2NBQVIsUUFBUTs7QUFDQyxhQURULFFBQVEsQ0FDRyxFQUFFLEVBQUUsS0FBSyxFQUFHOzhCQUR2QixRQUFROztBQUVOLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsS0FBSyxDQUFFLENBQUM7O0FBRW5ELGFBQUssQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNqRCxhQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7O0FBRXJDLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsY0FBYyxDQUFFLENBQUM7O0FBRXBELFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUN0QyxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFFLENBQUM7O0FBRTFFLGFBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztBQUNqRCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFFLENBQUM7QUFDekMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUUxQyxZQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQzFCOztpQkFyQkMsUUFBUTs7YUF1QkQsZUFBRztBQUNSLG1CQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztTQUNwQzthQUNRLGFBQUUsS0FBSyxFQUFHO0FBQ2YsZ0JBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUUsQ0FBQztTQUN6RTs7O1dBNUJDLFFBQVE7OztBQStCZCxPQUFPLENBQUMsU0FBUyxDQUFDLGNBQWMsR0FBRyxVQUFVLEtBQUssRUFBRztBQUNqRCxXQUFPLElBQUksUUFBUSxDQUFFLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQztDQUN0QyxDQUFDOzs7Ozs7Ozs7Ozs7O1FDcENLLHdCQUF3Qjs7MkJBQ2QscUJBQXFCOzs7O0lBRWhDLGVBQWU7Y0FBZixlQUFlOztBQUNOLGFBRFQsZUFBZSxDQUNKLEVBQUUsRUFBRSxLQUFLLEVBQUc7OEJBRHZCLGVBQWU7O0FBRWIseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUUsQ0FBQztBQUNuRCxhQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDMUMsYUFBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDO0FBQ3hDLGFBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFOUIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBRSxDQUFDO0FBQzdELFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUUsQ0FBQzs7QUFFNUQsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBRSxDQUFDO0FBQzNDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxPQUFPLENBQUUsQ0FBQztBQUMxQyxhQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN6QyxhQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN4QyxhQUFLLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRXRDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O2lCQXJCQyxlQUFlOzthQXVCUixlQUFHO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1NBQ3BDO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDO1NBQ3pFOzs7V0E1QkMsZUFBZTs7O0FBK0JyQixPQUFPLENBQUMsU0FBUyxDQUFDLHFCQUFxQixHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQ3hELFdBQU8sSUFBSSxlQUFlLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0NBQzdDLENBQUM7Ozs7Ozs7Ozs7O1FDcENLLHdCQUF3Qjs7MkJBQ2QscUJBQXFCOzs7O0lBRWhDLFlBQVk7Y0FBWixZQUFZOztBQUNILGFBRFQsWUFBWSxDQUNELEVBQUUsRUFBRzs4QkFEaEIsWUFBWTs7QUFFVix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7O0FBRTVCLGFBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUMxQyxhQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDbkMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBRSxDQUFDOztBQUUxQyxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFFLENBQUM7O0FBRTFFLGFBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUN0QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRTFDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O1dBaEJDLFlBQVk7OztBQW1CbEIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsR0FBRyxZQUFXO0FBQzlDLFdBQU8sSUFBSSxZQUFZLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDbkMsQ0FBQzs7Ozs7Ozs7Ozs7UUN4Qkssd0JBQXdCOzsyQkFDZCxxQkFBcUI7Ozs7Ozs7O0lBS2hDLEdBQUc7Y0FBSCxHQUFHOzs7Ozs7QUFLTSxhQUxULEdBQUcsQ0FLUSxFQUFFLEVBQUUsS0FBSyxFQUFHOzhCQUx2QixHQUFHOztBQU1ELHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUUsQ0FBQzs7QUFFaEQsYUFBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ3RDLGFBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUUsQ0FBQyxRQUFRLENBQUUsQ0FBQztBQUN0RCxhQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDM0MsYUFBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQzNDLGFBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUMzQyxhQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7O0FBRTNDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsVUFBVSxDQUFFLENBQUM7QUFDN0MsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLFVBQVUsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsU0FBUyxDQUFFLENBQUM7QUFDNUMsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLFFBQVEsQ0FBRSxDQUFDO0FBQzVDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXBDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUUsQ0FBQzs7O0FBR3pDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHOUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxD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OztBQUU1QixZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBRSxDQUFDOztBQUV0RSxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDdEMsYUFBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxDQUFDO0FBQ3JELGFBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUMzQyxhQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDM0MsYUFBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQzNDLGFBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUMzQyxhQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7O0FBRTNDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsU0FBUyxDQUFFLENBQUM7QUFDNUMsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxDQUFDO0FBQy9DLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsVUFBVSxDQUFFLENBQUM7QUFDN0MsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLFFBQVEsQ0FBRSxDQUFDO0FBQzVDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXBDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUUsQ0FBQzs7O0FBR3pDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHOUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDaEQsYUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRTdDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O1dBdEVDLEdBQUc7OztBQXlFVCxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFVLEtBQUssRUFBRztBQUM1QyxXQUFPLElBQUksR0FBRyxDQUFFLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQztDQUNqQyxDQUFDOzs7Ozs7Ozs7Ozs7O1FDakZLLHdCQUF3Qjs7MkJBQ2QscUJBQXFCOzs7Ozs7Ozs7O0lBT2hDLEdBQUc7Y0FBSCxHQUFHOzs7Ozs7QUFLTSxhQUxULEdBQUcsQ0FLUSxFQUFFLEVBQUUsS0FBSyxFQUFHOzhCQUx2QixHQUFHOztBQU1ELHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUUsQ0FBQzs7QUFFdEUsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ2pDLGFBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNoQyxhQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBRSxDQUFDOztBQUU5RCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxDQUFFLENBQUM7QUFDdkMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBRSxDQUFDO0FBQ3RDLGFBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3pDLGFBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUV4QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRTFDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O2lCQXhCQyxHQUFHOzthQTBCSSxlQUFHO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1NBQ3BDO2FBRVEsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUNyQzs7O1dBaENDLEdBQUc7OztBQW1DVCxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFVLEtBQUssRUFBRztBQUM1QyxXQUFPLElBQUksR0FBRyxDQUFFLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQztDQUNqQyxDQUFDOzs7Ozs7Ozs7NkJDN0NpQixvQkFBb0I7Ozs7QUFFdkMsU0FBUyxVQUFVLEdBQUc7QUFDbEIsS0FBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsS0FBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDYixLQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztBQUN0QixLQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUNqQixLQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQzs7QUFFZixLQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBRSxDQUFDO0FBQzNDLEtBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDdEQ7O0FBRUQsVUFBVSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsVUFBVSxLQUFLLEVBQUUsS0FBSyxFQUFHO0FBQ3JELEtBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxJQUFJLEdBQUcsQ0FBQztBQUMxQixLQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztBQUNuQixLQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUNiLEtBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQzs7QUFFM0IsS0FBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDOztBQUV0QyxNQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsRUFBRztBQUNsQyxNQUFJLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxVQUFVLENBQUM7RUFDdEQ7Q0FDSixDQUFDOztBQUVGLFVBQVUsQ0FBQyxTQUFTLENBQUMsWUFBWSxHQUFHLFlBQVc7QUFDM0MsS0FBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUc7S0FDbEIsR0FBRyxHQUFHLENBQUMsQ0FBQzs7QUFFWixHQUFFLElBQUksQ0FBQyxHQUFHLENBQUM7O0FBRVgsS0FBSSxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUc7QUFDekIsTUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7RUFDaEI7O0FBRUQsS0FBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQ25DLEtBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQzs7QUFFekMsTUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDbEMsTUFBSSxJQUFJLEdBQUksQ0FBQyxJQUFJLENBQUMsQUFBQyxFQUFHO0FBQ2xCLE9BQUksQ0FBQyxXQUFXLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQztHQUN0RDs7QUFFRCxLQUFHLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsQ0FBQztFQUNoQzs7QUFFRCxRQUFPLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0NBQzNCLENBQUM7O0FBRUYsSUFBSSxJQUFJLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQztBQUM1QixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7O3FCQU1EO0FBQ2QsaUJBQWdCLEVBQUUsMEJBQVUsQ0FBQyxFQUFHO0FBQy9CLE1BQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRTlCLE1BQUssT0FBTyxHQUFHLENBQUMsR0FBRywyQkFBTyxPQUFPLEVBQUc7QUFDbkMsVUFBTyxPQUFPLENBQUE7R0FDZCxNQUNJO0FBQ0osVUFBTyxDQUFDLENBQUM7R0FDVDtFQUNEOztBQUVELGdCQUFlLEVBQUUseUJBQVUsQ0FBQyxFQUFFLFFBQVEsRUFBRztBQUN4QyxTQUFPLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBRSxDQUFDLEdBQUcsUUFBUSxHQUFHLENBQUMsQ0FBQSxHQUFLLFFBQVEsQ0FBRSxHQUFHLFFBQVEsQ0FBQztFQUNoRTs7QUFFRCxNQUFLLEVBQUUsZUFBVSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRztBQUNsQyxTQUFPLElBQUksQ0FBQyxHQUFHLENBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBRSxDQUFFLENBQUM7RUFDL0M7O0FBRUQsWUFBVyxFQUFFLHFCQUFVLEdBQUcsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUc7QUFDNUQsU0FBTyxBQUFFLENBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQSxJQUFPLE1BQU0sR0FBRyxLQUFLLENBQUEsQUFBRSxJQUFPLE9BQU8sR0FBRyxNQUFNLENBQUEsQUFBRSxHQUFHLE1BQU0sQ0FBQztFQUNoRjs7QUFFRCxlQUFjLEVBQUUsd0JBQVUsR0FBRyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUc7QUFDcEUsTUFBSyxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRztBQUMzQyxVQUFPLElBQUksQ0FBQyxXQUFXLENBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBRSxDQUFDO0dBQy9EOztBQUVELE1BQUssQ0FBRSxHQUFHLEdBQUcsS0FBSyxDQUFBLElBQU8sTUFBTSxHQUFHLEtBQUssQ0FBQSxBQUFFLEtBQUssQ0FBQyxFQUFHO0FBQ2pELFVBQU8sTUFBTSxDQUFDO0dBQ2QsTUFDSTtBQUNKLE9BQUssQ0FBRSxHQUFHLEdBQUcsS0FBSyxDQUFBLElBQU8sTUFBTSxHQUFHLEtBQUssQ0FBQSxBQUFFLEdBQUcsQ0FBQyxFQUFHO0FBQy9DLFdBQVMsTUFBTSxHQUFHLENBQUUsT0FBTyxHQUFHLE1BQU0sQ0FBQSxHQUFLLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBRSxHQUFHLEdBQUcsS0FBSyxDQUFBLElBQU8sTUFBTSxHQUFHLEtBQUssQ0FBQSxBQUFFLEVBQUUsR0FBRyxDQUFFLENBQUc7SUFDakcsTUFDSTtBQUNKLFdBQVMsTUFBTSxHQUFHLENBQUUsT0FBTyxHQUFHLE1BQU0sQ0FBQSxHQUFLLENBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBSSxDQUFFLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQSxJQUFPLE1BQU0sR0FBRyxLQUFLLENBQUEsQUFBRSxFQUFJLEdBQUcsQ0FBRSxBQUFFLENBQUc7SUFDM0c7R0FDRDtFQUNEOzs7QUFHRCxlQUFjLEVBQUUsd0JBQVUsTUFBTSxFQUFHO0FBQ2xDLFFBQU0sR0FBRyxNQUFNLElBQUksRUFBRSxDQUFDOztBQUV0QixNQUFJLENBQUMsR0FBRyxDQUFDO01BQ1IsQ0FBQyxHQUFHLE1BQU0sQ0FBQzs7QUFFWixTQUFPLEVBQUUsQ0FBQyxFQUFHO0FBQ1osSUFBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztHQUNuQjs7QUFFRCxTQUFPLENBQUMsR0FBRyxNQUFNLENBQUM7RUFDbEI7Ozs7QUFJRCxNQUFLLEVBQUUsaUJBQVc7QUFDakIsTUFBSSxFQUFFLEVBQ0wsRUFBRSxFQUNGLEdBQUcsRUFDSCxFQUFFLENBQUM7O0FBRUosS0FBRztBQUNGLEtBQUUsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMzQixLQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDM0IsTUFBRyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztHQUN4QixRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRzs7QUFFakMsTUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLEdBQUcsQ0FBRSxHQUFHLEdBQUcsQ0FBRSxDQUFDOztBQUVoRCxTQUFPLEFBQUMsQUFBQyxFQUFFLEdBQUcsQ0FBQyxHQUFJLENBQUMsR0FBSSxHQUFHLEdBQUcsR0FBRyxDQUFDO0VBQ2xDOztBQUVELG1CQUFrQixFQUFFLElBQUksQ0FBQyxRQUFRO0FBQ2pDLGtCQUFpQixFQUFFLElBQUksQ0FBQyxZQUFZOztDQUVwQzs7Ozs7OztxQkN2SWM7QUFDWCxpQkFBYSxFQUFFLHlCQUFXO0FBQ3RCLFlBQUksTUFBTSxFQUNOLE9BQU8sQ0FBQzs7QUFFWixZQUFJLEtBQUssQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxFQUFHO0FBQy9CLGtCQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQzs7QUFFckIsaUJBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3JDLG9CQUFJLE1BQU0sQ0FBRSxDQUFDLENBQUUsSUFBSSxPQUFPLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLEtBQUssVUFBVSxFQUFHO0FBQzNELDBCQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ3pCLE1BQ0ksSUFBSSxNQUFNLENBQUUsQ0FBQyxDQUFFLEVBQUc7QUFDbkIsMEJBQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztpQkFDNUI7O0FBRUQsc0JBQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUM7YUFDdEI7O0FBRUQsZ0JBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1NBQ3RCOztBQUVELFlBQUksS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLEVBQUc7QUFDaEMsbUJBQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDOztBQUV2QixpQkFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDdEMsb0JBQUksT0FBTyxDQUFFLENBQUMsQ0FBRSxJQUFJLE9BQU8sT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sS0FBSyxVQUFVLEVBQUc7QUFDN0QsMkJBQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztpQkFDMUIsTUFDSSxJQUFJLE9BQU8sQ0FBRSxDQUFDLENBQUUsRUFBRztBQUNwQiwyQkFBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO2lCQUM3Qjs7QUFFRCx1QkFBTyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQzthQUN2Qjs7QUFFRCxnQkFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7U0FDdkI7S0FDSjs7QUFFRCxXQUFPLEVBQUUsbUJBQVc7QUFDaEIsWUFBSSxJQUFJLENBQUMsRUFBRSxFQUFHO0FBQ1YsZ0JBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO1NBQ2xCOztBQUVELFlBQUksSUFBSSxDQUFDLE9BQU8sRUFBRztBQUNmLGdCQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztTQUN2QjtLQUNKO0NBQ0o7Ozs7Ozs7QUNqREQsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7O3FCQUVuQjtBQUNYLFdBQU8sRUFBRSxpQkFBVSxJQUFJLEVBQXdDO1lBQXRDLGFBQWEseURBQUcsQ0FBQztZQUFFLFlBQVkseURBQUcsQ0FBQzs7QUFDeEQsWUFBSyxJQUFJLFlBQVksVUFBVSxJQUFJLElBQUksWUFBWSxTQUFTLEVBQUc7O0FBRTNELGdCQUFJLENBQUMsT0FBTyxDQUFFLGFBQWEsQ0FBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxhQUFhLENBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBRSxDQUFDO1NBQ3RHLE1BRUksSUFBSyxJQUFJLElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRzs7Ozs7O0FBTXBELGdCQUFJLENBQUMsT0FBTyxDQUFFLGFBQWEsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFFLFlBQVksQ0FBRSxDQUFFLENBQUM7U0FDeEUsTUFFSTtBQUNELG1CQUFPLENBQUMsS0FBSyxDQUFFLG9CQUFvQixDQUFFLENBQUM7QUFDdEMsbUJBQU8sQ0FBQyxHQUFHLENBQUUsU0FBUyxDQUFFLENBQUM7QUFDekIsbUJBQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNuQjtLQUNKOztBQUVELGNBQVUsRUFBRSxvQkFBVSxJQUFJLEVBQXdDO1lBQXRDLGFBQWEseURBQUcsQ0FBQztZQUFFLFlBQVkseURBQUcsQ0FBQzs7QUFDM0QsWUFBSyxJQUFJLFlBQVksVUFBVSxJQUFJLElBQUksWUFBWSxTQUFTLEVBQUc7QUFDM0QsZ0JBQUksQ0FBQyxPQUFPLENBQUUsYUFBYSxDQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLGFBQWEsQ0FBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsWUFBWSxDQUFFLENBQUM7U0FDekcsTUFFSSxJQUFLLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFHO0FBQ2xELGdCQUFJLENBQUMsT0FBTyxDQUFFLGFBQWEsQ0FBRSxDQUFDLFVBQVUsQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFFLFlBQVksQ0FBRSxDQUFFLENBQUM7U0FDM0UsTUFFSSxJQUFLLElBQUksS0FBSyxTQUFTLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRztBQUMzQyxnQkFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUUsVUFBVSxDQUFDLEVBQUc7QUFDaEMsb0JBQUssQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLFVBQVUsS0FBSyxVQUFVLEVBQUc7QUFDM0MscUJBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztpQkFDbEI7YUFDSixDQUFFLENBQUM7U0FDUDtLQUNKOztBQUVELFNBQUssRUFBRSxpQkFBVztBQUNkLFlBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUUsU0FBUyxDQUFFO1lBQy9CLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWhCLGFBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3JDLGdCQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBRSxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDdEMsZ0JBQUksR0FBRyxLQUFLLENBQUUsQ0FBQyxDQUFFLENBQUM7U0FDckI7S0FDSjs7QUFFRCxPQUFHLEVBQUUsZUFBVztBQUNaLFlBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUUsU0FBUyxDQUFFO1lBQy9CLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWhCLGFBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3JDLGdCQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBRSxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7U0FDekM7S0FDSjtDQUNKOzs7Ozs7Ozs7O3VCQzdEZ0IsWUFBWTs7Ozs4QkFDTCxtQkFBbUI7Ozs7d0JBQ3pCLGFBQWE7Ozs7NkJBQ1osb0JBQW9COzs7OzZCQUNoQixrQkFBa0I7Ozs7cUJBRzFCO0FBQ1gsY0FBVSxFQUFFLG9CQUFVLE1BQU0sRUFBRztBQUMzQixlQUFPLEVBQUUsSUFBSyxJQUFJLENBQUMsR0FBRyxDQUFFLE1BQU0sQ0FBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUEsQUFBRSxDQUFDO0tBQ2xEO0FBQ0QsY0FBVSxFQUFFLG9CQUFVLEVBQUUsRUFBRztBQUN2QixlQUFPLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUUsQ0FBQztLQUNoQzs7QUFFRCxZQUFRLEVBQUUsa0JBQVUsS0FBSyxFQUFHO0FBQ3hCLGVBQU8scUJBQUssZ0JBQWdCLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFFLEtBQUssR0FBRyxHQUFHLENBQUUsQ0FBRSxDQUFDO0tBQ3RFOztBQUVELFlBQVEsRUFBRSxrQkFBVSxLQUFLLEVBQUc7QUFDeEIsZUFBTyxJQUFJLENBQUMsVUFBVSxDQUFFLElBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUUsQ0FBQztLQUNwRDs7QUFFRCxVQUFNLEVBQUUsZ0JBQVUsS0FBSyxFQUFHO0FBQ3RCLFlBQUssS0FBSyxLQUFLLENBQUMsRUFBRyxPQUFPLENBQUMsQ0FBQztBQUM1QixlQUFPLElBQUksR0FBRyxLQUFLLENBQUM7S0FDdkI7O0FBRUQsV0FBTyxFQUFFLGlCQUFVLEtBQUssRUFBRztBQUN2QixlQUFPLElBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxLQUFLLENBQUUsQ0FBRSxDQUFDO0tBQy9DOztBQUlELFlBQVEsRUFBRSxrQkFBVSxLQUFLLEVBQUc7QUFDeEIsZUFBTyxJQUFJLENBQUMsR0FBRyxDQUFFLENBQUMsRUFBRSxDQUFFLEtBQUssR0FBRyxFQUFFLENBQUEsR0FBSyxFQUFFLENBQUUsR0FBRyxHQUFHLENBQUM7S0FDbkQ7O0FBRUQsY0FBVSxFQUFFLG9CQUFVLEtBQUssRUFBRztBQUMxQixZQUFJLE1BQU0sR0FBRyxDQUFFLEtBQUssR0FBRyxFQUFFLENBQUEsQ0FBRyxLQUFLLENBQUUsR0FBRyxDQUFFO1lBQ3BDLFNBQVMsR0FBRyxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUU7WUFDeEIsS0FBSyxHQUFHLENBQUUsTUFBTSxDQUFFLENBQUMsQ0FBRSxHQUFHLFVBQVUsQ0FBRSxJQUFJLEdBQUcsTUFBTSxDQUFFLENBQUMsQ0FBRSxFQUFFLEVBQUUsQ0FBRSxHQUFHLENBQUMsQ0FBQSxHQUFLLEdBQUcsQ0FBQzs7QUFFN0UsWUFBSyxJQUFJLENBQUMsR0FBRyxDQUFFLEtBQUssQ0FBRSxJQUFJLEdBQUcsRUFBRztBQUM1QixxQkFBUyxJQUFJLEtBQUssR0FBRyxHQUFHLENBQUM7U0FDNUI7O0FBRUQsWUFBSSxJQUFJLEdBQUcsU0FBUyxHQUFHLEVBQUUsR0FBRyxDQUFDO1lBQ3pCLE1BQU0sR0FBRyxTQUFTLEdBQUcsRUFBRSxHQUFHLENBQUM7WUFDM0IsUUFBUSxHQUFHLDRCQUFhLElBQUksQ0FBRSxDQUFDOztBQUVuQyxlQUFPLFFBQVEsSUFBSyxNQUFNLEdBQUcsMkJBQU8sWUFBWSxDQUFBLEFBQUUsSUFBSyxLQUFLLEdBQUcsR0FBRyxHQUFHLEtBQUssR0FBRyxFQUFFLENBQUEsQUFBRSxDQUFDO0tBQ3JGOztBQUVELFlBQVEsRUFBRSxrQkFBVSxLQUFLLEVBQUc7QUFDeEIsZUFBTyxJQUFJLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUUsQ0FBQztLQUNoRDs7QUFFRCxhQUFTLEVBQUUsbUJBQVUsS0FBSyxFQUFHO0FBQ3pCLGVBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFFLENBQUM7S0FDakQ7O0FBSUQsWUFBUSxFQUFFLGtCQUFVLEtBQUssRUFBRztBQUN4QixlQUFPLElBQUksQ0FBQyxRQUFRLENBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBRSxLQUFLLENBQUUsQ0FBRSxDQUFDO0tBQ3BEOztBQUVELGNBQVUsRUFBRSxvQkFBVSxLQUFLLEVBQUc7QUFDMUIsWUFBSSxPQUFPLEdBQUcsMkJBQVcsSUFBSSxDQUFFLEtBQUssQ0FBRTtZQUNsQyxJQUFJLFlBQUE7WUFBRSxVQUFVLFlBQUE7WUFBRSxNQUFNLFlBQUE7WUFBRSxLQUFLLFlBQUE7WUFDL0IsU0FBUyxZQUFBLENBQUM7O0FBRWQsWUFBSyxDQUFDLE9BQU8sRUFBRztBQUNaLG1CQUFPLENBQUMsSUFBSSxDQUFFLHNCQUFzQixFQUFFLEtBQUssQ0FBRSxDQUFDO0FBQzlDLG1CQUFPO1NBQ1Y7O0FBRUQsWUFBSSxHQUFHLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQztBQUNwQixrQkFBVSxHQUFHLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQztBQUMxQixjQUFNLEdBQUcsUUFBUSxDQUFFLE9BQU8sQ0FBRSxDQUFDLENBQUUsRUFBRSxFQUFFLENBQUUsR0FBRyxDQUFDLDJCQUFPLFlBQVksQ0FBQztBQUM3RCxhQUFLLEdBQUcsVUFBVSxDQUFFLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxJQUFJLENBQUMsQ0FBQzs7QUFFeEMsaUJBQVMsR0FBRyxzQkFBTyxJQUFJLEdBQUcsVUFBVSxDQUFFLENBQUM7O0FBRXZDLGVBQU8scUJBQUssZ0JBQWdCLENBQUUsU0FBUyxHQUFLLE1BQU0sR0FBRyxFQUFFLEFBQUUsR0FBSyxLQUFLLEdBQUcsSUFBSSxBQUFFLENBQUUsQ0FBQztLQUNsRjs7QUFFRCxZQUFRLEVBQUUsa0JBQVUsS0FBSyxFQUFHO0FBQ3hCLGVBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBRSxJQUFJLENBQUMsVUFBVSxDQUFFLEtBQUssQ0FBRSxDQUFFLENBQUM7S0FDcEQ7O0FBRUQsYUFBUyxFQUFFLG1CQUFVLEtBQUssRUFBRztBQUN6QixlQUFPLElBQUksQ0FBQyxTQUFTLENBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBRSxLQUFLLENBQUUsQ0FBRSxDQUFDO0tBQ3JEOztBQUlELFVBQU0sRUFBRSxnQkFBVSxLQUFLLEVBQUc7QUFDdEIsZUFBTyxJQUFJLENBQUMsTUFBTSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQy9COztBQUVELFlBQVEsRUFBRSxrQkFBVSxLQUFLLEVBQUc7QUFDeEIsZUFBTyxJQUFJLENBQUMsUUFBUSxDQUFFLElBQUksQ0FBQyxVQUFVLENBQUUsS0FBSyxDQUFFLENBQUUsQ0FBQztLQUNwRDs7QUFFRCxZQUFRLEVBQUUsa0JBQVUsS0FBSyxFQUFHO0FBQ3hCLGVBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFFLEtBQUssQ0FBRSxDQUFFLENBQUM7S0FDaEQ7O0FBRUQsV0FBTyxFQUFFLGlCQUFVLEtBQUssRUFBRztBQUN2QixlQUFPLEtBQUssS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUM7S0FDMUM7O0FBSUQsV0FBTyxFQUFFLGlCQUFVLEtBQUssRUFBRztBQUN2QixlQUFPLElBQUksQ0FBQyxNQUFNLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUUsQ0FBRSxDQUFDO0tBQy9DOztBQUVELGFBQVMsRUFBRSxtQkFBVSxLQUFLLEVBQUc7QUFDekIsZUFBTyxJQUFJLENBQUMsU0FBUyxDQUFFLElBQUksQ0FBQyxVQUFVLENBQUUsS0FBSyxDQUFFLENBQUUsQ0FBQztLQUNyRDs7QUFFRCxhQUFTLEVBQUUsbUJBQVUsS0FBSyxFQUFHO0FBQ3pCLGVBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBRSxDQUFFLENBQUM7S0FDakQ7O0FBRUQsV0FBTyxFQUFFLGlCQUFVLEtBQUssRUFBRztBQUN2QixlQUFPLElBQUksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDaEM7Q0FDSjs7Ozs7Ozs7Ozs2QkNuSWtCLG9CQUFvQjs7OztBQUV2QyxTQUFTLFVBQVUsR0FBRztBQUNsQixLQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztBQUNuQixLQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUNiLEtBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ3RCLEtBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO0FBQ2pCLEtBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUVmLEtBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7QUFDM0MsS0FBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUN0RDs7QUFFRCxVQUFVLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBRyxVQUFVLEtBQUssRUFBRSxLQUFLLEVBQUc7QUFDckQsS0FBSSxDQUFDLEtBQUssR0FBRyxLQUFLLElBQUksR0FBRyxDQUFDO0FBQzFCLEtBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ25CLEtBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ2IsS0FBSSxDQUFDLEtBQUssR0FBRyxLQUFLLElBQUksQ0FBQyxDQUFDOztBQUUzQixLQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7O0FBRXRDLE1BQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ2xDLE1BQUksQ0FBQyxXQUFXLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQztFQUN0RDtDQUNKLENBQUM7O0FBRUYsVUFBVSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsWUFBVztBQUMzQyxLQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRztLQUNsQixHQUFHLEdBQUcsQ0FBQyxDQUFDOztBQUVaLEdBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQzs7QUFFWCxLQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRztBQUN6QixNQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztFQUNoQjs7QUFFRCxLQUFJLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDbkMsS0FBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDOztBQUV6QyxNQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsRUFBRztBQUNsQyxNQUFJLElBQUksR0FBSSxDQUFDLElBQUksQ0FBQyxBQUFDLEVBQUc7QUFDbEIsT0FBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsVUFBVSxDQUFDO0dBQ3REOztBQUVELEtBQUcsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFDO0VBQ2hDOztBQUVELFFBQU8sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7Q0FDM0IsQ0FBQzs7QUFFRixJQUFJLElBQUksR0FBRyxJQUFJLFVBQVUsRUFBRSxDQUFDO0FBQzVCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7cUJBTUQ7QUFDZCxpQkFBZ0IsRUFBRSwwQkFBVSxDQUFDLEVBQUc7QUFDL0IsTUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDLENBQUUsQ0FBQzs7QUFFOUIsTUFBSyxPQUFPLEdBQUcsQ0FBQyxHQUFHLDJCQUFPLE9BQU8sRUFBRztBQUNuQyxVQUFPLE9BQU8sQ0FBQTtHQUNkLE1BQ0k7QUFDSixVQUFPLENBQUMsQ0FBQztHQUNUO0VBQ0Q7O0FBRUQsZ0JBQWUsRUFBRSx5QkFBVSxDQUFDLEVBQUUsUUFBUSxFQUFHO0FBQ3hDLFNBQU8sSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFFLENBQUMsR0FBRyxRQUFRLEdBQUcsQ0FBQyxDQUFBLEdBQUssUUFBUSxDQUFFLEdBQUcsUUFBUSxDQUFDO0VBQ2hFOztBQUVELE1BQUssRUFBRSxlQUFVLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFHO0FBQ2xDLFNBQU8sSUFBSSxDQUFDLEdBQUcsQ0FBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBRSxLQUFLLEVBQUUsR0FBRyxDQUFFLENBQUUsQ0FBQztFQUMvQzs7QUFFRCxZQUFXLEVBQUUscUJBQVUsR0FBRyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRztBQUM1RCxTQUFPLEFBQUUsQ0FBRSxHQUFHLEdBQUcsS0FBSyxDQUFBLElBQU8sTUFBTSxHQUFHLEtBQUssQ0FBQSxBQUFFLElBQU8sT0FBTyxHQUFHLE1BQU0sQ0FBQSxBQUFFLEdBQUcsTUFBTSxDQUFDO0VBQ2hGOztBQUVELGVBQWMsRUFBRSx3QkFBVSxHQUFHLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRztBQUNwRSxNQUFLLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFHO0FBQzNDLFVBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFFLENBQUM7R0FDL0Q7O0FBRUQsTUFBSyxDQUFFLEdBQUcsR0FBRyxLQUFLLENBQUEsSUFBTyxNQUFNLEdBQUcsS0FBSyxDQUFBLEFBQUUsS0FBSyxDQUFDLEVBQUc7QUFDakQsVUFBTyxNQUFNLENBQUM7R0FDZCxNQUNJO0FBQ0osT0FBSyxDQUFFLEdBQUcsR0FBRyxLQUFLLENBQUEsSUFBTyxNQUFNLEdBQUcsS0FBSyxDQUFBLEFBQUUsR0FBRyxDQUFDLEVBQUc7QUFDL0MsV0FBUyxNQUFNLEdBQUcsQ0FBRSxPQUFPLEdBQUcsTUFBTSxDQUFBLEdBQUssSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFFLEdBQUcsR0FBRyxLQUFLLENBQUEsSUFBTyxNQUFNLEdBQUcsS0FBSyxDQUFBLEFBQUUsRUFBRSxHQUFHLENBQUUsQ0FBRztJQUNqRyxNQUNJO0FBQ0osV0FBUyxNQUFNLEdBQUcsQ0FBRSxPQUFPLEdBQUcsTUFBTSxDQUFBLEdBQUssQ0FBRyxJQUFJLENBQUMsR0FBRyxDQUFJLENBQUUsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFBLElBQU8sTUFBTSxHQUFHLEtBQUssQ0FBQSxBQUFFLEVBQUksR0FBRyxDQUFFLEFBQUUsQ0FBRztJQUMzRztHQUNEO0VBQ0Q7OztBQUdELGVBQWMsRUFBRSx3QkFBVSxNQUFNLEVBQUc7QUFDbEMsUUFBTSxHQUFHLE1BQU0sSUFBSSxFQUFFLENBQUM7O0FBRXRCLE1BQUksQ0FBQyxHQUFHLENBQUM7TUFDUixDQUFDLEdBQUcsTUFBTSxDQUFDOztBQUVaLFNBQU8sRUFBRSxDQUFDLEVBQUc7QUFDWixJQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0dBQ25COztBQUVELFNBQU8sQ0FBQyxHQUFHLE1BQU0sQ0FBQztFQUNsQjs7OztBQUlELE1BQUssRUFBRSxpQkFBVztBQUNqQixNQUFJLEVBQUUsRUFDTCxFQUFFLEVBQ0YsR0FBRyxFQUNILEVBQUUsQ0FBQzs7QUFFSixLQUFHO0FBQ0YsS0FBRSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLEtBQUUsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMzQixNQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO0dBQ3hCLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFHOztBQUVqQyxNQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsR0FBRyxDQUFFLEdBQUcsR0FBRyxDQUFFLENBQUM7O0FBRWhELFNBQU8sQUFBQyxBQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUksQ0FBQyxHQUFJLEdBQUcsR0FBRyxHQUFHLENBQUM7RUFDbEM7O0FBRUQsbUJBQWtCLEVBQUUsSUFBSSxDQUFDLFFBQVE7QUFDakMsa0JBQWlCLEVBQUUsSUFBSSxDQUFDLFlBQVk7O0NBRXBDOzs7Ozs7O3FCQ3ZJYyxvRUFBb0U7Ozs7Ozs7cUJDQXBFLENBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLENBQUU7Ozs7Ozs7cUJDQW5FO0FBQ1gsT0FBRyxFQUFFLENBQUMsRUFBTSxLQUFLLEVBQUUsQ0FBQyxFQUFJLElBQUksRUFBRSxDQUFDO0FBQy9CLFFBQUksRUFBRSxDQUFDLEVBQUssSUFBSSxFQUFFLENBQUMsRUFBSyxLQUFLLEVBQUUsQ0FBQyxFQUFJLElBQUksRUFBRSxDQUFDO0FBQzNDLE9BQUcsRUFBRSxDQUFDLEVBQU0sS0FBSyxFQUFFLENBQUMsRUFBSSxLQUFLLEVBQUUsQ0FBQyxFQUFJLElBQUksRUFBRSxDQUFDO0FBQzNDLFFBQUksRUFBRSxDQUFDLEVBQUssSUFBSSxFQUFFLENBQUMsRUFBSyxLQUFLLEVBQUUsQ0FBQztBQUNoQyxPQUFHLEVBQUUsQ0FBQyxFQUFNLElBQUksRUFBRSxDQUFDLEVBQUssS0FBSyxFQUFFLENBQUMsRUFBSSxJQUFJLEVBQUUsQ0FBQztBQUMzQyxPQUFHLEVBQUUsQ0FBQyxFQUFNLEtBQUssRUFBRSxDQUFDLEVBQUksSUFBSSxFQUFFLENBQUM7QUFDL0IsUUFBSSxFQUFFLENBQUMsRUFBSyxJQUFJLEVBQUUsQ0FBQyxFQUFLLEtBQUssRUFBRSxDQUFDLEVBQUksSUFBSSxFQUFFLENBQUM7QUFDM0MsT0FBRyxFQUFFLENBQUMsRUFBTSxLQUFLLEVBQUUsQ0FBQyxFQUFJLEtBQUssRUFBRSxDQUFDLEVBQUcsSUFBSSxFQUFFLENBQUM7QUFDMUMsUUFBSSxFQUFFLENBQUMsRUFBSyxJQUFJLEVBQUUsQ0FBQztBQUNuQixPQUFHLEVBQUUsQ0FBQyxFQUFNLEtBQUssRUFBRSxDQUFDLEVBQUksS0FBSyxFQUFFLENBQUMsRUFBRyxJQUFJLEVBQUUsQ0FBQztBQUMxQyxRQUFJLEVBQUUsRUFBRSxFQUFJLElBQUksRUFBRSxFQUFFLEVBQUksS0FBSyxFQUFFLEVBQUU7QUFDakMsT0FBRyxFQUFFLEVBQUUsRUFBSyxJQUFJLEVBQUUsRUFBRSxFQUFJLEtBQUssRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUU7Q0FDOUM7Ozs7Ozs7cUJDYnVCLE1BQU07O0FBQWYsU0FBUyxNQUFNLENBQUUsRUFBRSxFQUFHO0FBQ2pDLFFBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0FBQ2IsUUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO0NBQzdCOztBQUFBLENBQUM7Ozs7Ozs7Ozs7Ozs4QkNIa0IscUJBQXFCOzs7OzJCQUN4QixrQkFBa0I7Ozs7MENBQ04saUNBQWlDOzs7O3VDQUN0Qyw4QkFBOEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQThCaEQsZ0JBQWdCO1dBQWhCLGdCQUFnQjs7QUFDVixVQUROLGdCQUFnQixDQUNSLEVBQUUsRUFBRSxTQUFTLEVBQUc7d0JBRHhCLGdCQUFnQjs7QUFFcEIsbUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsTUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7QUFDM0IsTUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNoRCxNQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUU3QyxNQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7RUFDYjs7QUFUSSxpQkFBZ0IsV0FXckIsS0FBSyxHQUFBLGVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRztBQUNwQixNQUFJLE1BQU0sR0FBRyxxQ0FBWSxjQUFjLENBQ3JDLElBQUksQ0FBQyxFQUFFLEVBQ1AsQ0FBQyxFQUNELElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FDZDtNQUNELFlBQVksQ0FBQzs7QUFFZCxNQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRWIsY0FBWSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxZQUFZLENBQUM7QUFDNUMsY0FBWSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDN0IsY0FBWSxDQUFDLEtBQUssQ0FBRSxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUM7QUFDbEMsU0FBTyxDQUFDLEdBQUcsQ0FBRSxZQUFZLENBQUUsQ0FBQztFQUM1Qjs7QUEzQkksaUJBQWdCLFdBNkJyQixJQUFJLEdBQUEsY0FBRSxJQUFJLEVBQUc7QUFDWixNQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFO01BQzFCLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWTtNQUNqQyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUViLGNBQVksQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7RUFDMUI7O0FBbkNJLGlCQUFnQixXQXFDckIsS0FBSyxHQUFBLGlCQUFHO0FBQ1AsTUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixPQUFLLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztBQUN2RCxPQUFLLENBQUMsWUFBWSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDL0IsT0FBSyxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUMxQyxPQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRWhELE1BQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBRSxDQUFDOztBQUVuRSxNQUFLLEtBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxZQUFZLFVBQVUsRUFBRztBQUN0RCxPQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUUsQ0FBQztHQUMxRDs7QUFFRCxNQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0VBQ3ZCOztRQXBESSxnQkFBZ0I7OztBQXVEdEIsNEJBQVEsU0FBUyxDQUFDLHNCQUFzQixHQUFHLFVBQVUsU0FBUyxFQUFHO0FBQ2hFLFFBQU8sSUFBSSxnQkFBZ0IsQ0FBRSxJQUFJLEVBQUUsU0FBUyxDQUFFLENBQUM7Q0FDL0MsQ0FBQzs7Ozs7Ozs7Ozs7UUMxRksscUJBQXFCOzs0Q0FDRCxtQ0FBbUM7Ozs7SUFFeEQsWUFBWTtjQUFaLFlBQVk7O0FBRUgsYUFGVCxZQUFZLENBRUQsRUFBRSxFQUFHOzhCQUZoQixZQUFZOztBQUdWLG1DQUFPLEVBQUUsQ0FBRSxDQUFDOztBQUVaLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUUsSUFBSSxDQUFFLENBQUM7OztBQUdsQyxhQUFLLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztBQUNwRCxhQUFLLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDdkQsYUFBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNqQyxhQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsV0FBVyxDQUFFLENBQUM7QUFDaEQsYUFBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLHFCQUFxQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFL0QsWUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNsRCxZQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDM0UsWUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXZFLFlBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDakQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBRSxDQUFDOztBQUV6RSxZQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2xELFlBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBRSxDQUFDOzs7QUFJNUQsYUFBSyxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7QUFDekIsYUFBSyxDQUFDLHVCQUF1QixHQUFHLEVBQUUsQ0FBQztBQUNuQyxZQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUVuRCxhQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUc7OztBQUduRCxpQkFBSyxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDOzs7OztBQU14RSxpQkFBSyxDQUFDLGFBQWEsQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ3JELGlCQUFLLENBQUMsYUFBYSxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUV4QyxpQkFBSyxDQUFDLHVCQUF1QixDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDOUQsaUJBQUssQ0FBQyxhQUFhLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyx1QkFBdUIsQ0FBRSxDQUFDLENBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDN0UsZ0JBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsdUJBQXVCLENBQUUsQ0FBQyxDQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUU1RSxpQkFBSyxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0FBQzNELGlCQUFLLENBQUMsdUJBQXVCLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxXQUFXLENBQUUsQ0FBQyxDQUFFLENBQUMsU0FBUyxDQUFFLENBQUM7OztBQUcvRSxnQkFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxhQUFhLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFFLENBQUM7U0FDcEU7O0FBRUQsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7V0F2REMsWUFBWTs7O0FBMERsQixPQUFPLENBQUMsU0FBUyxDQUFDLGtCQUFrQixHQUFHLFlBQVc7QUFDOUMsV0FBTyxJQUFJLFlBQVksQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUNuQyxDQUFDOzs7Ozs7Ozs7OztRQy9ESyxxQkFBcUI7OzJCQUNYLGtCQUFrQjs7Ozt1Q0FDWCw4QkFBOEI7Ozs7MENBQ3pCLGlDQUFpQzs7OztBQUc5RCxJQUFJLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDOztJQUV0QixtQkFBbUI7Y0FBbkIsbUJBQW1COzs7Ozs7QUFJVixhQUpULG1CQUFtQixDQUlSLEVBQUUsRUFBRzs4QkFKaEIsbUJBQW1COztBQUtqQix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLElBQUksQ0FBRTtZQUM3QixLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLO1lBQzlCLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFFLEtBQUssQ0FBRSxDQUFDOztBQUVwQyxhQUFLLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztBQUN6QixhQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDN0MsYUFBSyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUUsS0FBSyxDQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzlFLGFBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7O0FBRWhDLGFBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3hDLGdCQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7O0FBRS9DLG1CQUFPLENBQUMsR0FBRyxDQUFFLHdDQUFrQixJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFFLENBQUM7O0FBRXZFLGtCQUFNLENBQUMsTUFBTSxHQUFHLHFDQUFZLGNBQWMsQ0FDdEMsSUFBSSxDQUFDLEVBQUU7QUFDUCxhQUFDO0FBQ0QsZ0JBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHLENBQUM7QUFDM0IsZ0JBQUksQ0FBQyxPQUFPLENBQUMsVUFBVTtBQUN2QixvREFBa0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUUsQ0FBQyxDQUFFLENBQUU7YUFDMUQsQ0FBQzs7QUFFRixrQkFBTSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDbkIsa0JBQU0sQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLGtCQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3pDLGlCQUFLLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBRSxNQUFNLENBQUUsQ0FBQztTQUN0Qzs7QUFFRCxhQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsVUFBVSxDQUFFLENBQUM7QUFDN0MsYUFBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUU5QyxZQUFJLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDckQsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7QUF6Q0MsdUJBQW1CLFdBMkNyQixLQUFLLEdBQUEsZUFBRSxJQUFJLEVBQUc7QUFDVixZQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLElBQUksQ0FBRSxDQUFDLFVBQVUsQ0FBQzs7QUFFbEQsWUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQztBQUN4QyxrQkFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0tBQzdCOztBQWhEQyx1QkFBbUIsV0FrRHJCLElBQUksR0FBQSxjQUFFLElBQUksRUFBRztBQUNULFlBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUUsSUFBSSxDQUFFLENBQUMsVUFBVSxDQUFDOztBQUVsRCxZQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDO0FBQ3hDLGtCQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7S0FDN0I7O1dBdkRDLG1CQUFtQjs7O0FBMkR6QixtQkFBbUIsQ0FBQyxLQUFLLEdBQUc7QUFDeEIsU0FBSyxFQUFFLENBQUM7QUFDUixrQkFBYyxFQUFFLENBQUM7QUFDakIsUUFBSSxFQUFFLENBQUM7Q0FDVixDQUFDOztBQUVGLG1CQUFtQixDQUFDLGFBQWEsR0FBRyxDQUNoQyxZQUFZLEVBQ1osZUFBZSxFQUNmLFdBQVcsQ0FDZCxDQUFDOztBQUdGLE9BQU8sQ0FBQyxTQUFTLENBQUMseUJBQXlCLEdBQUcsWUFBVztBQUNyRCxXQUFPLElBQUksbUJBQW1CLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDMUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs4QkNsRmtCLHFCQUFxQjs7OzsyQkFDeEIsa0JBQWtCOzs7O0FBRW5DLElBQUksZ0JBQWdCLEdBQUcsQ0FDbkIsTUFBTSxFQUNOLFVBQVUsRUFDVixVQUFVLEVBQ1YsUUFBUSxDQUNYLENBQUM7O0lBRUksY0FBYztjQUFkLGNBQWM7O0FBQ0wsYUFEVCxjQUFjLENBQ0gsRUFBRSxFQUFHOzhCQURoQixjQUFjOztBQUVaLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsYUFBSyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFFLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMxRSxhQUFLLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQzs7QUFFdkIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQzdDLFlBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQzs7QUFFekQsYUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRztBQUMvQyxnQkFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDOztBQUUxQyxlQUFHLENBQUMsSUFBSSxHQUFHLGdCQUFnQixDQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ2pDLGVBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUN4QixlQUFHLENBQUMsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVmLGdCQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQ2pELGdCQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBRSxDQUFDO0FBQzNDLGVBQUcsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXRDLGlCQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBRSxHQUFHLENBQUUsQ0FBQztTQUNqQzs7QUFFRCxhQUFLLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQzs7QUFFakMsYUFBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFL0MsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7QUFsQ0Msa0JBQWMsV0FvQ2hCLEtBQUssR0FBQSxpQkFBYztZQUFaLEtBQUsseURBQUcsQ0FBQzs7QUFDWixZQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0tBQzlDOztBQXRDQyxrQkFBYyxXQXdDaEIsSUFBSSxHQUFBLGdCQUFjO1lBQVosS0FBSyx5REFBRyxDQUFDOztBQUNYLFlBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7S0FDOUM7O1dBMUNDLGNBQWM7OztBQTZDcEIsNEJBQVEsU0FBUyxDQUFDLG9CQUFvQixHQUFHLFlBQVc7QUFDaEQsV0FBTyxJQUFJLGNBQWMsQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUNyQyxDQUFDOztxQkFFYSxjQUFjOzs7Ozs7Ozs7Ozs7Ozs4QkMzRFQscUJBQXFCOzs7OzJCQUN4QixrQkFBa0I7Ozs7SUFHN0IsUUFBUTtjQUFSLFFBQVE7O0FBQ0MsYUFEVCxRQUFRLENBQ0csRUFBRSxFQUFpQjtZQUFmLFFBQVEseURBQUcsQ0FBQzs7OEJBRDNCLFFBQVE7O0FBRU4seUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztBQUN2QixhQUFLLENBQUMsbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0FBQy9CLGFBQUssQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQzFCLGFBQUssQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQzs7QUFFNUMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQzdDLFlBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQzs7QUFFN0IsYUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRztBQUNqQyxnQkFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDckMsZUFBZSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFO2dCQUN2QyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDOztBQUVsRCxlQUFHLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztBQUNsQixlQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7O0FBRXhCLGdCQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsa0JBQWtCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzVELDJCQUFlLENBQUMsT0FBTyxDQUFFLGtCQUFrQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNwRCw4QkFBa0IsQ0FBQyxPQUFPLENBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQzVDLGdCQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBRSxDQUFDOztBQUUzQyxnQkFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUUsQ0FBQyxDQUFFLEdBQUcsZUFBZSxDQUFDOztBQUUvQyxlQUFHLENBQUMsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ2YsZUFBRyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsV0FBVyxDQUFFLENBQUM7QUFDakMsaUJBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFFLEdBQUcsQ0FBRSxDQUFDO1NBQ2pDOztBQUVELGFBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFL0MsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7QUF2Q0MsWUFBUSxXQXlDVixLQUFLLEdBQUEsaUJBQWM7WUFBWixLQUFLLHlEQUFHLENBQUM7O0FBQ1osWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQzVCLGFBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztLQUNyRDs7QUE1Q0MsWUFBUSxXQThDVixJQUFJLEdBQUEsZ0JBQWM7WUFBWixLQUFLLHlEQUFHLENBQUM7O0FBQ1gsWUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztLQUM5Qzs7V0FoREMsUUFBUTs7O0FBbURkLDRCQUFRLFNBQVMsQ0FBQyxjQUFjLEdBQUcsVUFBVSxRQUFRLEVBQUc7QUFDcEQsV0FBTyxJQUFJLFFBQVEsQ0FBRSxJQUFJLEVBQUUsUUFBUSxDQUFFLENBQUM7Q0FDekMsQ0FBQzs7cUJBR00sUUFBUTs7Ozs7Ozs7Ozt3QkM1REUsYUFBYTs7OztBQUUvQixJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDckIsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDOztBQUV0QixTQUFTLHNCQUFzQixDQUFFLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFHO0FBQ2pGLFFBQU8sTUFBTSxHQUFHLEdBQUcsR0FBRyxnQkFBZ0IsR0FBRyxHQUFHLEdBQUcsVUFBVSxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUM7Q0FDM0U7Ozs7Ozs7OztBQVNELFdBQVcsQ0FBQyxVQUFVLEdBQUcsVUFBVSxFQUFFLEVBQUUsR0FBRyxFQUFHO0FBQzVDLFFBQU8sSUFBSSxPQUFPLENBQUUsVUFBVSxPQUFPLEVBQUUsTUFBTSxFQUFHO0FBQy9DLE1BQUksR0FBRyxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7O0FBRS9CLEtBQUcsQ0FBQyxJQUFJLENBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBRSxDQUFDO0FBQ3ZCLEtBQUcsQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDOztBQUVqQyxLQUFHLENBQUMsTUFBTSxHQUFHLFlBQVc7QUFDdkIsT0FBSyxHQUFHLENBQUMsTUFBTSxLQUFLLEdBQUcsRUFBRzs7QUFFekIsTUFBRSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQ3pCLEdBQUcsQ0FBQyxRQUFRLEVBQ1osVUFBVSxNQUFNLEVBQUc7QUFDbEIsWUFBTyxDQUFFLE1BQU0sQ0FBRSxDQUFDO0tBQ2xCLEVBQ0QsVUFBVSxDQUFDLEVBQUc7QUFDYixXQUFNLENBQUUsQ0FBQyxDQUFFLENBQUM7S0FDWixDQUNELENBQUM7SUFDRixNQUNJO0FBQ0osVUFBTSxDQUFFLEtBQUssQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFFLENBQUM7SUFDcEM7R0FDRCxDQUFDOztBQUVGLEtBQUcsQ0FBQyxPQUFPLEdBQUcsWUFBVztBQUN4QixTQUFNLENBQUUsS0FBSyxDQUFFLGVBQWUsQ0FBRSxDQUFFLENBQUM7R0FDbkMsQ0FBQzs7QUFFRixLQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7RUFDWCxDQUFFLENBQUM7Q0FDSixDQUFDOztBQUVGLFdBQVcsQ0FBQyxjQUFjLEdBQUcsVUFBVSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUc7QUFDM0YsS0FBSSxHQUFHLEdBQUcsc0JBQXNCLENBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUU7S0FDNUYsTUFBTTtLQUNOLFdBQVcsQ0FBQzs7QUFFYixLQUFLLFlBQVksQ0FBRSxHQUFHLENBQUUsRUFBRztBQUMxQixTQUFPLFlBQVksQ0FBRSxHQUFHLENBQUUsQ0FBQztFQUMzQjs7QUFFRCxPQUFNLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBRSxDQUFDOztBQUV6RSxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDNUMsYUFBVyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXpDLE9BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDbEMsY0FBVyxDQUFFLENBQUMsQ0FBRSxHQUFHLFFBQVEsQ0FBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsQ0FBRSxDQUFDO0dBQzlEO0VBQ0Q7O0FBRUQsYUFBWSxDQUFFLEdBQUcsQ0FBRSxHQUFHLE1BQU0sQ0FBQzs7QUFFN0IsUUFBTyxNQUFNLENBQUM7Q0FDZCxDQUFDOztBQUdGLFdBQVcsQ0FBQyxVQUFVLEdBQUcsVUFBVSxNQUFNLEVBQUUsS0FBSyxFQUFHO0FBQ2xELEtBQUksV0FBVyxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0I7S0FDeEMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNO0tBQ3RCLFdBQVcsQ0FBQzs7QUFFYixNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3ZDLGFBQVcsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3pDLGFBQVcsQ0FBQyxJQUFJLENBQUUsS0FBSyxDQUFFLENBQUM7RUFDMUI7Q0FDRCxDQUFDOztBQUdGLFdBQVcsQ0FBQyxhQUFhLEdBQUcsVUFBVSxNQUFNLEVBQUc7QUFDOUMsS0FBSyxNQUFNLFlBQVksV0FBVyxLQUFLLEtBQUssRUFBRztBQUM5QyxTQUFPLENBQUMsS0FBSyxDQUFFLG1EQUFtRCxDQUFFLENBQUM7QUFDckUsU0FBTztFQUNQOztBQUVELEtBQUksV0FBVyxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0I7S0FDeEMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNO0tBQ3RCLFdBQVcsQ0FBQzs7QUFFYixNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3ZDLGFBQVcsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3pDLGFBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztFQUN0QjtDQUNELENBQUM7O0FBRUYsV0FBVyxDQUFDLFdBQVcsR0FBRyxVQUFVLE1BQU0sRUFBRztBQUM1QyxLQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFFLENBQUM7O0FBRWxHLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDbkQsTUFBSSxXQUFXLEdBQUcsU0FBUyxDQUFDLGNBQWMsQ0FBRSxDQUFDLENBQUU7TUFDOUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXpDLE9BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3pDLGNBQVcsQ0FBRSxDQUFDLENBQUUsR0FBRyxVQUFVLENBQUUsQ0FBQyxDQUFFLENBQUM7R0FDbkM7RUFDRDs7QUFFRCxRQUFPLFNBQVMsQ0FBQztDQUNqQixDQUFDOzs7O0FBSUYsV0FBVyxDQUFDLFFBQVEsR0FBRyxVQUFVLE1BQU0sRUFBRztBQUN6QyxLQUFJLFlBQVksRUFDZixNQUFNLENBQUM7O0FBRVIsS0FBSyxNQUFNLENBQUMsV0FBVyxJQUFJLENBQUMsRUFBRztBQUM5QixTQUFPLENBQUMsSUFBSSxDQUFFLHdFQUF3RSxDQUFFLENBQUM7QUFDekYsU0FBTztFQUNQOztBQUVELE9BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ3ZCLGFBQVksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUUsQ0FBQzs7QUFFcEUsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRztBQUM3QixNQUFJLFdBQVcsR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFFLENBQUMsQ0FBRTtNQUNqRCxVQUFVLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBRSxDQUFDLENBQUUsQ0FBQzs7QUFFekMsT0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRztBQUNsQyxjQUFXLENBQUUsQ0FBQyxDQUFFLEdBQUcsVUFBVSxDQUFFLENBQUMsQ0FBRSxDQUFDO0dBQ25DO0VBQ0Q7O0FBRUQsUUFBTyxZQUFZLENBQUM7Q0FDcEIsQ0FBQzs7Ozs7QUFLRixXQUFXLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRyxFQUFFLENBQUM7Ozs7Ozs7cUJBUTdCLFdBQVc7Ozs7Ozs7QUMxSjFCLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQzs7QUFFZixLQUFLLENBQUMsWUFBWSxHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQ3RDLEtBQUssS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLENBQUMsTUFBTSxZQUFZLFdBQVcsRUFBRztBQUNqRSxTQUFPLElBQUksQ0FBQztFQUNaOztBQUVELFFBQU8sS0FBSyxDQUFDO0NBQ2IsQ0FBQzs7cUJBRWEsS0FBSyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgQ09ORklHIGZyb20gJy4uL2NvcmUvY29uZmlnLmVzNic7XG5pbXBvcnQgbWF0aCBmcm9tICcuLi9taXhpbnMvTWF0aC5lczYnO1xuXG5cbnZhciBCdWZmZXJHZW5lcmF0b3JzID0ge307XG5cbkJ1ZmZlckdlbmVyYXRvcnMuU2luZVdhdmUgPSBmdW5jdGlvbiBzaW5lV2F2ZUl0ZXJhdG9yKCBpLCBsZW5ndGggKSB7XG4gICAgdmFyIHggPSBNYXRoLlBJICogKCBpIC8gbGVuZ3RoICkgLSBNYXRoLlBJICogMC41O1xuICAgIHJldHVybiBNYXRoLnNpbiggeCAqIDIgKTtcbn07XG5cbkJ1ZmZlckdlbmVyYXRvcnMuU2F3V2F2ZSA9IGZ1bmN0aW9uIHNhd1dhdmVJdGVyYXRvciggaSwgbGVuZ3RoICkge1xuICAgIHJldHVybiAoIGkgLyBsZW5ndGggKSAqIDIgLSAxO1xufTtcblxuQnVmZmVyR2VuZXJhdG9ycy5TcXVhcmVXYXZlID0gZnVuY3Rpb24gc3F1YXJlV2F2ZUl0ZXJhdG9yKCBpLCBsZW5ndGggKSB7XG4gICAgdmFyIHggPSAoIGkgLyBsZW5ndGggKSAqIDIgLSAxO1xuICAgIHJldHVybiBNYXRoLnNpZ24oIHggKyAwLjAwMSApO1xufTtcblxuQnVmZmVyR2VuZXJhdG9ycy5UcmlhbmdsZVdhdmUgPSBmdW5jdGlvbiB0cmlhbmdsZVdhdmVJdGVyYXRvciggaSwgbGVuZ3RoICkge1xuICAgIHZhciB4ID0gTWF0aC5hYnMoICggaSAlIGxlbmd0aCAqIDIgKSAtIGxlbmd0aCApIC0gbGVuZ3RoICogMC41O1xuICAgIHJldHVybiBNYXRoLnNpbiggeCAvICggbGVuZ3RoICogMC41ICkgKTtcbn07XG5cbkJ1ZmZlckdlbmVyYXRvcnMuV2hpdGVOb2lzZSA9IGZ1bmN0aW9uIHdoaXRlTm9pc2VJdGVyYXRvcigpIHtcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKSAqIDIgLSAxO1xufTtcblxuQnVmZmVyR2VuZXJhdG9ycy5HYXVzc2lhbk5vaXNlID0gZnVuY3Rpb24gZ2F1c3NpYW5Ob2lzZUl0ZXJhdG9yKCkge1xuICAgIHJldHVybiBtYXRoLm5yYW5kKCkgKiAyIC0gMTtcbn07XG5cbkJ1ZmZlckdlbmVyYXRvcnMuUGlua05vaXNlID0gKCBmdW5jdGlvbigpIHtcbiAgICB2YXIgaGFzR2VuZXJhdGVkUGlua051bWJlciA9IGZhbHNlO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHBpbmtOb2lzZUl0ZXJhdG9yKCBpLCBsZW5ndGggKSB7XG4gICAgICAgIHZhciBudW1iZXI7XG5cbiAgICAgICAgaWYgKCBoYXNHZW5lcmF0ZWRQaW5rTnVtYmVyID09PSBmYWxzZSApIHtcbiAgICAgICAgICAgIG1hdGguZ2VuZXJhdGVQaW5rTnVtYmVyKCAxMjgsIDUgKTtcbiAgICAgICAgICAgIGhhc0dlbmVyYXRlZFBpbmtOdW1iZXIgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgbnVtYmVyID0gbWF0aC5nZXROZXh0UGlua051bWJlcigpICogMiAtIDE7XG5cbiAgICAgICAgaWYgKCBpID09PSBsZW5ndGggLSAxICkge1xuICAgICAgICAgICAgaGFzR2VuZXJhdGVkUGlua051bWJlciA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bWJlcjtcbiAgICB9O1xufSgpICk7XG5cbmV4cG9ydCBkZWZhdWx0IEJ1ZmZlckdlbmVyYXRvcnM7IiwiaW1wb3J0IENPTkZJRyBmcm9tICcuL2NvbmZpZy5lczYnO1xuaW1wb3J0ICcuL292ZXJyaWRlcy5lczYnO1xuaW1wb3J0IHNpZ25hbEN1cnZlcyBmcm9tICcuL3NpZ25hbEN1cnZlcy5lczYnO1xuaW1wb3J0IGNvbnZlcnNpb25zIGZyb20gJy4uL21peGlucy9jb252ZXJzaW9ucy5lczYnO1xuaW1wb3J0IG1hdGggZnJvbSAnLi4vbWl4aW5zL21hdGguZXM2JztcbmltcG9ydCBCdWZmZXJHZW5lcmF0b3JzIGZyb20gJy4uL2J1ZmZlcnMvQnVmZmVyR2VuZXJhdG9ycy5lczYnO1xuaW1wb3J0IEJ1ZmZlclV0aWxzIGZyb20gJy4uL3V0aWxpdGllcy9CdWZmZXJVdGlscy5lczYnO1xuaW1wb3J0IFV0aWxzIGZyb20gJy4uL3V0aWxpdGllcy9VdGlscy5lczYnO1xuXG5jbGFzcyBBdWRpb0lPIHtcblxuICAgIHN0YXRpYyBtaXhpbiggdGFyZ2V0LCBzb3VyY2UgKSB7XG4gICAgICAgIGZvciAoIGxldCBpIGluIHNvdXJjZSApIHtcbiAgICAgICAgICAgIGlmICggc291cmNlLmhhc093blByb3BlcnR5KCBpICkgKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0WyBpIF0gPSBzb3VyY2VbIGkgXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBtaXhpblNpbmdsZSggdGFyZ2V0LCBzb3VyY2UsIG5hbWUgKSB7XG4gICAgICAgIHRhcmdldFsgbmFtZSBdID0gc291cmNlO1xuICAgIH1cblxuXG4gICAgY29uc3RydWN0b3IoIGNvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCkgKSB7XG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBjb250ZXh0O1xuXG4gICAgICAgIHRoaXMubWFzdGVyID0gdGhpcy5fY29udGV4dC5kZXN0aW5hdGlvbjtcblxuICAgICAgICAvLyBDcmVhdGUgYW4gYWx3YXlzLW9uICdkcml2ZXInIG5vZGUgdGhhdCBjb25zdGFudGx5IG91dHB1dHMgYSB2YWx1ZVxuICAgICAgICAvLyBvZiAxLlxuICAgICAgICAvL1xuICAgICAgICAvLyBJdCdzIHVzZWQgYnkgYSBmYWlyIGZldyBub2Rlcywgc28gbWFrZXMgc2Vuc2UgdG8gdXNlIHRoZSBzYW1lXG4gICAgICAgIC8vIGRyaXZlciwgcmF0aGVyIHRoYW4gc3BhbW1pbmcgYSBidW5jaCBvZiBXYXZlU2hhcGVyTm9kZXMgYWxsIGFib3V0XG4gICAgICAgIC8vIHRoZSBwbGFjZS4gSXQgY2FuJ3QgYmUgZGVsZXRlZCwgc28gbm8gd29ycmllcyBhYm91dCBicmVha2luZ1xuICAgICAgICAvLyBmdW5jdGlvbmFsaXR5IG9mIG5vZGVzIHRoYXQgZG8gdXNlIGl0IHNob3VsZCBpdCBhdHRlbXB0IHRvIGJlXG4gICAgICAgIC8vIG92ZXJ3cml0dGVuLlxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIHRoaXMsICdjb25zdGFudERyaXZlcicsIHtcbiAgICAgICAgICAgIHdyaXRlYWJsZTogZmFsc2UsXG4gICAgICAgICAgICBnZXQ6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbnN0YW50RHJpdmVyO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoICFjb25zdGFudERyaXZlciB8fCBjb25zdGFudERyaXZlci5jb250ZXh0ICE9PSB0aGlzLmNvbnRleHQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdGFudERyaXZlciA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjb250ZXh0ID0gdGhpcy5jb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IGNvbnRleHQuY3JlYXRlQnVmZmVyKCAxLCA0MDk2LCBjb250ZXh0LnNhbXBsZVJhdGUgKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJEYXRhID0gYnVmZmVyLmdldENoYW5uZWxEYXRhKCAwICksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyU291cmNlID0gY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgYnVmZmVyRGF0YS5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJEYXRhWyBpIF0gPSAxLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvciggbGV0IGJ1ZmZlclZhbHVlIG9mIGJ1ZmZlckRhdGEgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgYnVmZmVyVmFsdWUgPSAxLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlclNvdXJjZS5idWZmZXIgPSBidWZmZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJTb3VyY2UubG9vcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJTb3VyY2Uuc3RhcnQoIDAgKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3RhbnREcml2ZXIgPSBidWZmZXJTb3VyY2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29uc3RhbnREcml2ZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSgpIClcbiAgICAgICAgfSApO1xuICAgIH1cblxuXG5cbiAgICBnZXQgY29udGV4dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHQ7XG4gICAgfVxuXG4gICAgc2V0IGNvbnRleHQoIGNvbnRleHQgKSB7XG4gICAgICAgIGlmICggISggY29udGV4dCBpbnN0YW5jZW9mIEF1ZGlvQ29udGV4dCApICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBcIkludmFsaWQgYXVkaW8gY29udGV4dCBnaXZlbjpcIiArIGNvbnRleHQgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLm1hc3RlciA9IGNvbnRleHQuZGVzdGluYXRpb247XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBBdWRpb0lPLnByb3RvdHlwZSwgc2lnbmFsQ3VydmVzLCAnY3VydmVzJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggQXVkaW9JTy5wcm90b3R5cGUsIGNvbnZlcnNpb25zLCAnY29udmVydCcgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIEF1ZGlvSU8ucHJvdG90eXBlLCBtYXRoLCAnbWF0aCcgKTtcblxuQXVkaW9JTy5CdWZmZXJVdGlscyA9IEJ1ZmZlclV0aWxzO1xuQXVkaW9JTy5VdGlscyA9IFV0aWxzO1xuQXVkaW9JTy5CdWZmZXJHZW5lcmF0b3JzID0gQnVmZmVyR2VuZXJhdG9ycztcblxud2luZG93LkF1ZGlvSU8gPSBBdWRpb0lPO1xuZXhwb3J0IGRlZmF1bHQgQXVkaW9JTzsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcblxudmFyIGdyYXBocyA9IG5ldyBXZWFrTWFwKCk7XG5cbi8vIFRPRE86XG4vLyAgLSBQb3NzaWJseSByZW1vdmUgdGhlIG5lZWQgZm9yIG9ubHkgR2Fpbk5vZGVzXG4vLyAgICBhcyBpbnB1dHMvb3V0cHV0cz8gSXQnbGwgYWxsb3cgZm9yIHN1YmNsYXNzZXNcbi8vICAgIG9mIE5vZGUgdG8gYmUgbW9yZSBlZmZpY2llbnQuLi5cbmNsYXNzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtSW5wdXRzID0gMCwgbnVtT3V0cHV0cyA9IDAgKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gW107XG4gICAgICAgIHRoaXMub3V0cHV0cyA9IFtdO1xuXG4gICAgICAgIC8vIFRoaXMgb2JqZWN0IHdpbGwgaG9sZCBhbnkgdmFsdWVzIHRoYXQgY2FuIGJlXG4gICAgICAgIC8vIGNvbnRyb2xsZWQgd2l0aCBhdWRpbyBzaWduYWxzLlxuICAgICAgICB0aGlzLmNvbnRyb2xzID0ge307XG5cbiAgICAgICAgLy8gQm90aCB0aGVzZSBvYmplY3RzIHdpbGwganVzdCBob2xkIHJlZmVyZW5jZXNcbiAgICAgICAgLy8gdG8gZWl0aGVyIGlucHV0IG9yIG91dHB1dCBub2Rlcy4gSGFuZHkgd2hlblxuICAgICAgICAvLyB3YW50aW5nIHRvIGNvbm5lY3Qgc3BlY2lmaWMgaW5zL291dHMgd2l0aG91dFxuICAgICAgICAvLyBoYXZpbmcgdG8gdXNlIHRoZSBgLmNvbm5lY3QoIC4uLiwgMCwgMSApYCBzeW50YXguXG4gICAgICAgIHRoaXMubmFtZWRJbnB1dHMgPSB7fTtcbiAgICAgICAgdGhpcy5uYW1lZE91dHB1dHMgPSB7fTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1JbnB1dHM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuYWRkSW5wdXRDaGFubmVsKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IG51bU91dHB1dHM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuYWRkT3V0cHV0Q2hhbm5lbCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0R3JhcGgoIGdyYXBoICkge1xuICAgICAgICBncmFwaHMuc2V0KCB0aGlzLCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldEdyYXBoKCkge1xuICAgICAgICByZXR1cm4gZ3JhcGhzLmdldCggdGhpcyApIHx8IHt9O1xuICAgIH1cblxuICAgIGFkZElucHV0Q2hhbm5lbCgpIHtcbiAgICAgICAgdGhpcy5pbnB1dHMucHVzaCggdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKSApO1xuICAgIH1cblxuICAgIGFkZE91dHB1dENoYW5uZWwoKSB7XG4gICAgICAgIHRoaXMub3V0cHV0cy5wdXNoKCB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpICk7XG4gICAgfVxuXG4gICAgX2NsZWFuVXBTaW5nbGUoIGl0ZW0sIHBhcmVudCwga2V5ICkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLy8gSGFuZGxlIGFycmF5cyBieSBsb29waW5nIG92ZXIgdGhlbVxuICAgICAgICAvLyBhbmQgcmVjdXJzaXZlbHkgY2FsbGluZyB0aGlzIGZ1bmN0aW9uIHdpdGggZWFjaFxuICAgICAgICAvLyBhcnJheSBtZW1iZXIuXG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KCBpdGVtICkgKSB7XG4gICAgICAgICAgICBpdGVtLmZvckVhY2goZnVuY3Rpb24oIG5vZGUsIGluZGV4ICkge1xuICAgICAgICAgICAgICAgIHNlbGYuX2NsZWFuVXBTaW5nbGUoIG5vZGUsIGl0ZW0sIGluZGV4ICk7XG4gICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgIHBhcmVudFsga2V5IF0gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXVkaW9JTyBub2Rlcy4uLlxuICAgICAgICBlbHNlIGlmKCBpdGVtICYmIHR5cGVvZiBpdGVtLmNsZWFuVXAgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICBpZiggdHlwZW9mIGl0ZW0uZGlzY29ubmVjdCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICBpdGVtLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaXRlbS5jbGVhblVwKCk7XG5cbiAgICAgICAgICAgIGlmKCBwYXJlbnQgKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50WyBrZXkgXSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBcIk5hdGl2ZVwiIG5vZGVzLlxuICAgICAgICBlbHNlIGlmKCBpdGVtICYmIHR5cGVvZiBpdGVtLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICBpdGVtLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICAgICAgaWYoIHBhcmVudCApIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRbIGtleSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgdGhpcy5fY2xlYW5VcEluT3V0cygpO1xuICAgICAgICB0aGlzLl9jbGVhbklPKCk7XG5cbiAgICAgICAgLy8gRmluZCBhbnkgbm9kZXMgYXQgdGhlIHRvcCBsZXZlbCxcbiAgICAgICAgLy8gZGlzY29ubmVjdCBhbmQgbnVsbGlmeSB0aGVtLlxuICAgICAgICBmb3IoIHZhciBpIGluIHRoaXMgKSB7XG4gICAgICAgICAgICB0aGlzLl9jbGVhblVwU2luZ2xlKCB0aGlzWyBpIF0sIHRoaXMsIGkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERvIHRoZSBzYW1lIGZvciBhbnkgbm9kZXMgaW4gdGhlIGdyYXBoLlxuICAgICAgICBmb3IoIHZhciBpIGluIGdyYXBoICkge1xuICAgICAgICAgICAgdGhpcy5fY2xlYW5VcFNpbmdsZSggZ3JhcGhbIGkgXSwgZ3JhcGgsIGkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIC4uLmFuZCB0aGUgc2FtZSBmb3IgYW55IGNvbnRyb2wgbm9kZXMuXG4gICAgICAgIGZvciggdmFyIGkgaW4gdGhpcy5jb250cm9scyApIHtcbiAgICAgICAgICAgIHRoaXMuX2NsZWFuVXBTaW5nbGUoIHRoaXMuY29udHJvbHNbIGkgXSwgdGhpcy5jb250cm9scywgaSApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmluYWxseSwgYXR0ZW1wdCB0byBkaXNjb25uZWN0IHRoaXMgTm9kZS5cbiAgICAgICAgaWYoIHR5cGVvZiB0aGlzLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IG51bWJlck9mSW5wdXRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHMubGVuZ3RoO1xuICAgIH1cbiAgICBnZXQgbnVtYmVyT2ZPdXRwdXRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzLmxlbmd0aDtcbiAgICB9XG5cbiAgICBnZXQgaW5wdXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5wdXRzLmxlbmd0aCA/IHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA6IG51bGw7XG4gICAgfVxuICAgIHNldCBpbnB1dFZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5pbnB1dHMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgaSBdLmdhaW4udmFsdWUgPSB0aGlzLmludmVydElucHV0UGhhc2UgPyAtdmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBvdXRwdXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3V0cHV0cy5sZW5ndGggPyB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlIDogbnVsbDtcbiAgICB9XG4gICAgc2V0IG91dHB1dFZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5vdXRwdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IHRoaXMuaW52ZXJ0T3V0cHV0UGhhc2UgPyAtdmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBpbnZlcnRJbnB1dFBoYXNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHMubGVuZ3RoID9cbiAgICAgICAgICAgICggdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlIDwgMCApIDpcbiAgICAgICAgICAgIG51bGw7XG4gICAgfVxuICAgIHNldCBpbnZlcnRJbnB1dFBoYXNlKCBpbnZlcnRlZCApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBpbnB1dCwgdjsgaSA8IHRoaXMuaW5wdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgaW5wdXQgPSB0aGlzLmlucHV0c1sgaSBdLmdhaW47XG4gICAgICAgICAgICB2ID0gaW5wdXQudmFsdWU7XG4gICAgICAgICAgICBpbnB1dC52YWx1ZSA9IHYgPCAwID8gKCBpbnZlcnRlZCA/IHYgOiAtdiApIDogKCBpbnZlcnRlZCA/IC12IDogdiApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGludmVydE91dHB1dFBoYXNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzLmxlbmd0aCA/XG4gICAgICAgICAgICAoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPCAwICkgOlxuICAgICAgICAgICAgbnVsbDtcbiAgICB9XG5cbiAgICAvLyBUT0RPOlxuICAgIC8vICAtIHNldFZhbHVlQXRUaW1lP1xuICAgIHNldCBpbnZlcnRPdXRwdXRQaGFzZSggaW52ZXJ0ZWQgKSB7XG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgdjsgaSA8IHRoaXMub3V0cHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHYgPSB0aGlzLm91dHB1dHNbIGkgXS5nYWluLnZhbHVlO1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IHYgPCAwID8gKCBpbnZlcnRlZCA/IHYgOiAtdiApIDogKCBpbnZlcnRlZCA/IC12IDogdiApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBOb2RlLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggTm9kZS5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuVXBJbk91dHMsICdfY2xlYW5VcEluT3V0cycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIE5vZGUucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhbklPLCAnX2NsZWFuSU8nICk7XG5BdWRpb0lPLm1peGluKCBOb2RlLnByb3RvdHlwZSwgY29ubmVjdGlvbnMgKTtcblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOb2RlID0gZnVuY3Rpb24oIG51bUlucHV0cywgbnVtT3V0cHV0cyApIHtcbiAgICByZXR1cm4gbmV3IE5vZGUoIHRoaXMsIG51bUlucHV0cywgbnVtT3V0cHV0cyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTm9kZTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcblxuXG5jbGFzcyBQYXJhbSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSwgZGVmYXVsdFZhbHVlICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLmlucHV0cyA9IHRoaXMub3V0cHV0cyA9IFsgdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKSBdO1xuICAgICAgICB0aGlzLl9jb250cm9sID0gdGhpcy5pbnB1dHNbIDAgXTtcblxuICAgICAgICAvLyBIbW0uLi4gSGFkIHRvIHB1dCB0aGlzIGhlcmUgc28gTm90ZSB3aWxsIGJlIGFibGVcbiAgICAgICAgLy8gdG8gcmVhZCB0aGUgdmFsdWUuLi5cbiAgICAgICAgLy8gVE9ETzpcbiAgICAgICAgLy8gIC0gU2hvdWxkIEkgY3JlYXRlIGEgYC5fdmFsdWVgIHByb3BlcnR5IHRoYXQgd2lsbFxuICAgICAgICAvLyAgICBzdG9yZSB0aGUgdmFsdWVzIHRoYXQgdGhlIFBhcmFtIHNob3VsZCBiZSByZWZsZWN0aW5nXG4gICAgICAgIC8vICAgIChmb3JnZXR0aW5nLCBvZiBjb3Vyc2UsIHRoYXQgYWxsIHRoZSAqVmFsdWVBdFRpbWUgW2V0Yy5dXG4gICAgICAgIC8vICAgIGZ1bmN0aW9ucyBhcmUgZnVuY3Rpb25zIG9mIHRpbWU7IGAuX3ZhbHVlYCBwcm9wIHdvdWxkIGJlXG4gICAgICAgIC8vICAgIHNldCBpbW1lZGlhdGVseSwgd2hpbHN0IHRoZSByZWFsIHZhbHVlIHdvdWxkIGJlIHJhbXBpbmcpXG4gICAgICAgIC8vXG4gICAgICAgIC8vICAtIE9yLCBzaG91bGQgSSBjcmVhdGUgYSBgLl92YWx1ZWAgcHJvcGVydHkgdGhhdCB3aWxsXG4gICAgICAgIC8vICAgIHRydWVseSByZWZsZWN0IHRoZSBpbnRlcm5hbCB2YWx1ZSBvZiB0aGUgR2Fpbk5vZGU/IFdpbGxcbiAgICAgICAgLy8gICAgcmVxdWlyZSBNQUZGUy4uLlxuICAgICAgICB0aGlzLl92YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgPyB2YWx1ZSA6IDEuMDtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLnZhbHVlID0gdGhpcy5fdmFsdWU7XG5cbiAgICAgICAgdGhpcy5zZXRWYWx1ZUF0VGltZSggdGhpcy5fdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgICAgICB0aGlzLmRlZmF1bHRWYWx1ZSA9IHR5cGVvZiBkZWZhdWx0VmFsdWUgPT09ICdudW1iZXInID8gZGVmYXVsdFZhbHVlIDogdGhpcy5fY29udHJvbC5nYWluLmRlZmF1bHRWYWx1ZTtcblxuXG4gICAgICAgIC8vIFRPRE86XG4gICAgICAgIC8vICAtIFNob3VsZCB0aGUgZHJpdmVyIGFsd2F5cyBiZSBjb25uZWN0ZWQ/XG4gICAgICAgIC8vICAtIE5vdCBzdXJlIHdoZXRoZXIgUGFyYW0gc2hvdWxkIG91dHB1dCAwIGlmIHZhbHVlICE9PSBOdW1iZXIuXG4gICAgICAgIGlmICggdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMuaW8uY29uc3RhbnREcml2ZXIuY29ubmVjdCggdGhpcy5fY29udHJvbCApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuZGVmYXVsdFZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLl9jbGVhblVwSW5PdXRzKCk7XG4gICAgICAgIHRoaXMuX2NsZWFuSU8oKTtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLl9jb250cm9sID0gbnVsbDtcbiAgICAgICAgdGhpcy5kZWZhdWx0VmFsdWUgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgIH1cblxuICAgIHNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgc3RhcnRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4uc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSggdmFsdWUsIGVuZFRpbWUgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0VGFyZ2V0QXRUaW1lKCB2YWx1ZSwgc3RhcnRUaW1lLCB0aW1lQ29uc3RhbnQgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5zZXRUYXJnZXRBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUsIHRpbWVDb25zdGFudCApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRWYWx1ZUN1cnZlQXRUaW1lKCB2YWx1ZXMsIHN0YXJ0VGltZSwgZHVyYXRpb24gKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5zZXRWYWx1ZUN1cnZlQXRUaW1lKCB2YWx1ZXMsIHN0YXJ0VGltZSwgZHVyYXRpb24gKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCBzdGFydFRpbWUgKSB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHN0YXJ0VGltZSApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIC8vIHJldHVybiB0aGlzLl9jb250cm9sLmdhaW4udmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cblxuICAgIGdldCBjb250cm9sKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29udHJvbC5nYWluO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBQYXJhbS5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFBhcmFtLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5VcEluT3V0cywgJ19jbGVhblVwSW5PdXRzJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggUGFyYW0ucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhbklPLCAnX2NsZWFuSU8nICk7XG5BdWRpb0lPLm1peGluKCBQYXJhbS5wcm90b3R5cGUsIGNvbm5lY3Rpb25zICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBhcmFtID0gZnVuY3Rpb24oIHZhbHVlLCBkZWZhdWx0VmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBQYXJhbSggdGhpcywgdmFsdWUsIGRlZmF1bHRWYWx1ZSApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgUGFyYW07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4vQXVkaW9JTy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBjb25uZWN0aW9ucyBmcm9tIFwiLi4vbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNlwiO1xuaW1wb3J0IGNsZWFuZXJzIGZyb20gXCIuLi9taXhpbnMvY2xlYW5lcnMuZXM2XCI7XG5cbmNsYXNzIFdhdmVTaGFwZXIge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgY3VydmVPckl0ZXJhdG9yLCBzaXplICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLnNoYXBlciA9IHRoaXMuY29udGV4dC5jcmVhdGVXYXZlU2hhcGVyKCk7XG5cbiAgICAgICAgLy8gSWYgYSBGbG9hdDMyQXJyYXkgaXMgcHJvdmlkZWQsIHVzZSBpdFxuICAgICAgICAvLyBhcyB0aGUgY3VydmUgdmFsdWUuXG4gICAgICAgIGlmICggY3VydmVPckl0ZXJhdG9yIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ICkge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSBjdXJ2ZU9ySXRlcmF0b3I7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhIGZ1bmN0aW9uIGlzIHByb3ZpZGVkLCBjcmVhdGUgYSBjdXJ2ZVxuICAgICAgICAvLyB1c2luZyB0aGUgZnVuY3Rpb24gYXMgYW4gaXRlcmF0b3IuXG4gICAgICAgIGVsc2UgaWYgKCB0eXBlb2YgY3VydmVPckl0ZXJhdG9yID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgc2l6ZSA9IHR5cGVvZiBzaXplID09PSAnbnVtYmVyJyAmJiBzaXplID49IDIgPyBzaXplIDogQ09ORklHLmN1cnZlUmVzb2x1dGlvbjtcblxuICAgICAgICAgICAgdmFyIGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSggc2l6ZSApLFxuICAgICAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgICAgIHggPSAwO1xuXG4gICAgICAgICAgICBmb3IgKCBpOyBpIDwgc2l6ZTsgKytpICkge1xuICAgICAgICAgICAgICAgIHggPSAoIGkgLyBzaXplICkgKiAyIC0gMTtcbiAgICAgICAgICAgICAgICBhcnJheVsgaSBdID0gY3VydmVPckl0ZXJhdG9yKCB4LCBpLCBzaXplICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2hhcGVyLmN1cnZlID0gYXJyYXk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPdGhlcndpc2UsIGRlZmF1bHQgdG8gYSBMaW5lYXIgY3VydmUuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSB0aGlzLmlvLmN1cnZlcy5MaW5lYXI7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlucHV0cyA9IHRoaXMub3V0cHV0cyA9IFsgdGhpcy5zaGFwZXIgXTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLl9jbGVhblVwSW5PdXRzKCk7XG4gICAgICAgIHRoaXMuX2NsZWFuSU8oKTtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuc2hhcGVyID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgY3VydmUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNoYXBlci5jdXJ2ZTtcbiAgICB9XG4gICAgc2V0IGN1cnZlKCBjdXJ2ZSApIHtcbiAgICAgICAgaWYoIGN1cnZlIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ICkge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSBjdXJ2ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggV2F2ZVNoYXBlci5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFdhdmVTaGFwZXIucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhblVwSW5PdXRzLCAnX2NsZWFuVXBJbk91dHMnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBXYXZlU2hhcGVyLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5JTywgJ19jbGVhbklPJyApO1xuQXVkaW9JTy5taXhpbiggV2F2ZVNoYXBlci5wcm90b3R5cGUsIGNvbm5lY3Rpb25zICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVdhdmVTaGFwZXIgPSBmdW5jdGlvbiggY3VydmUsIHNpemUgKSB7XG4gICAgcmV0dXJuIG5ldyBXYXZlU2hhcGVyKCB0aGlzLCBjdXJ2ZSwgc2l6ZSApO1xufTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgY3VydmVSZXNvbHV0aW9uOiA0MDk2LCAvLyBNdXN0IGJlIGFuIGV2ZW4gbnVtYmVyLlxuICAgIGRlZmF1bHRCdWZmZXJTaXplOiA4LFxuXG4gICAgLy8gVXNlZCB3aGVuIGNvbnZlcnRpbmcgbm90ZSBzdHJpbmdzIChlZy4gJ0EjNCcpIHRvIE1JREkgdmFsdWVzLlxuICAgIC8vIEl0J3MgdGhlIG9jdGF2ZSBudW1iZXIgb2YgdGhlIGxvd2VzdCBDIG5vdGUgKE1JREkgbm90ZSAwKS5cbiAgICAvLyBDaGFuZ2UgdGhpcyBpZiB5b3UncmUgdXNlZCB0byBhIERBVyB0aGF0IGRvZXNuJ3QgdXNlIC0yIGFzIHRoZVxuICAgIC8vIGxvd2VzdCBvY3RhdmUuXG4gICAgbG93ZXN0T2N0YXZlOiAtMixcblxuICAgIC8vIExvd2VzdCBhbGxvd2VkIG51bWJlci4gVXNlZCBieSBzb21lIE1hdGhcbiAgICAvLyBmdW5jdGlvbnMsIGVzcGVjaWFsbHkgd2hlbiBjb252ZXJ0aW5nIGJldHdlZW5cbiAgICAvLyBudW1iZXIgZm9ybWF0cyAoaWUuIGh6IC0+IE1JREksIG5vdGUgLT4gTUlESSwgZXRjLiApXG4gICAgLy9cbiAgICAvLyBBbHNvIHVzZWQgaW4gY2FsbHMgdG8gQXVkaW9QYXJhbS5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lXG4gICAgLy8gc28gdGhlcmUncyBubyByYW1waW5nIHRvIDAgKHdoaWNoIHRocm93cyBhbiBlcnJvcikuXG4gICAgZXBzaWxvbjogMC4wMDEsXG5cbiAgICBtaWRpTm90ZVBvb2xTaXplOiA1MDBcbn07IiwiLy8gTmVlZCB0byBvdmVycmlkZSBleGlzdGluZyAuY29ubmVjdCBhbmQgLmRpc2Nvbm5lY3Rcbi8vIGZ1bmN0aW9ucyBmb3IgXCJuYXRpdmVcIiBBdWRpb1BhcmFtcyBhbmQgQXVkaW9Ob2Rlcy4uLlxuLy8gSSBkb24ndCBsaWtlIGRvaW5nIHRoaXMsIGJ1dCBzJ2dvdHRhIGJlIGRvbmUgOihcbiggZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9yaWdpbmFsQXVkaW9Ob2RlQ29ubmVjdCA9IEF1ZGlvTm9kZS5wcm90b3R5cGUuY29ubmVjdCxcbiAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVEaXNjb25uZWN0ID0gQXVkaW9Ob2RlLnByb3RvdHlwZS5kaXNjb25uZWN0LFxuICAgICAgICBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuICAgIEF1ZGlvTm9kZS5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCApIHtcbiAgICAgICAgaWYgKCBub2RlLmlucHV0cyApIHtcbiAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggbm9kZS5pbnB1dHMgKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3QoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0KCBub2RlLmlucHV0c1sgMCBdLCBvdXRwdXRDaGFubmVsLCBpbnB1dENoYW5uZWwgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9Ob2RlICkge1xuICAgICAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVDb25uZWN0LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZUNvbm5lY3QuY2FsbCggdGhpcywgbm9kZSwgb3V0cHV0Q2hhbm5lbCApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIEF1ZGlvTm9kZS5wcm90b3R5cGUuZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCApIHtcbiAgICAgICAgaWYgKCBub2RlICYmIG5vZGUuaW5wdXRzICkge1xuICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBub2RlLmlucHV0cyApICkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoIG5vZGUuaW5wdXRzWyAwIF0sIG91dHB1dENoYW5uZWwsIGlucHV0Q2hhbm5lbCApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb05vZGUgKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZURpc2Nvbm5lY3QuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9QYXJhbSApIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlRGlzY29ubmVjdC5jYWxsKCB0aGlzLCBub2RlLCBvdXRwdXRDaGFubmVsICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlRGlzY29ubmVjdC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQXVkaW9Ob2RlLnByb3RvdHlwZS5jaGFpbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZXMgPSBzbGljZS5jYWxsKCBhcmd1bWVudHMgKSxcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QuY2FsbCggbm9kZSwgbm9kZXNbIGkgXSApO1xuICAgICAgICAgICAgbm9kZSA9IG5vZGVzWyBpIF07XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQXVkaW9Ob2RlLnByb3RvdHlwZS5mYW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVzID0gc2xpY2UuY2FsbCggYXJndW1lbnRzICksXG4gICAgICAgICAgICBub2RlID0gdGhpcztcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgbm9kZS5jb25uZWN0LmNhbGwoIG5vZGUsIG5vZGVzWyBpIF0gKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0oKSApOyIsImltcG9ydCBDT05GSUcgZnJvbSAnLi9jb25maWcuZXM2JztcbmltcG9ydCBtYXRoIGZyb20gJy4uL21peGlucy9NYXRoLmVzNic7XG5cblxubGV0IHNpZ25hbEN1cnZlcyA9IHt9O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0NvbnN0YW50Jywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnTGluZWFyJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnRXF1YWxQb3dlcicsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICksXG4gICAgICAgICAgICBzaW4gPSBNYXRoLnNpbixcbiAgICAgICAgICAgIFBJID0gTWF0aC5QSTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gc2luKCB4ICogMC41ICogUEkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdDdWJlZCcsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICksXG4gICAgICAgICAgICBzaW4gPSBNYXRoLnNpbixcbiAgICAgICAgICAgIFBJID0gTWF0aC5QSSxcbiAgICAgICAgICAgIHBvdyA9IE1hdGgucG93O1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIHggPSBwb3coIHgsIDMgKTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBzaW4oIHggKiAwLjUgKiBQSSApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdSZWN0aWZ5Jywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBoYWxmUmVzb2x1dGlvbiA9IHJlc29sdXRpb24gKiAwLjUsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IC1oYWxmUmVzb2x1dGlvbiwgeCA9IDA7IGkgPCBoYWxmUmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSA+IDAgPyBpIDogLWkgKSAvIGhhbGZSZXNvbHV0aW9uO1xuICAgICAgICAgICAgY3VydmVbIGkgKyBoYWxmUmVzb2x1dGlvbiBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cblxuLy8gTWF0aCBjdXJ2ZXNcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnR3JlYXRlclRoYW5aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA8PSAwID8gMC4wIDogMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnTGVzc1RoYW5aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA+PSAwID8gMCA6IDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0VxdWFsVG9aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA9PT0gMCA/IDEgOiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdSZWNpcHJvY2FsJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IDQwOTYgKiA2MDAsIC8vIEhpZ2hlciByZXNvbHV0aW9uIG5lZWRlZCBoZXJlLlxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgLy8gY3VydmVbIGkgXSA9IHggPT09IDAgPyAxIDogMDtcblxuICAgICAgICAgICAgaWYgKCB4ICE9PSAwICkge1xuICAgICAgICAgICAgICAgIHggPSBNYXRoLnBvdyggeCwgLTEgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1NpbmUnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApLFxuICAgICAgICAgICAgc2luID0gTWF0aC5zaW47XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIChNYXRoLlBJICogMikgLSBNYXRoLlBJO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHNpbiggeCApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnUm91bmQnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDUwLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgKCB4ID4gMCAmJiB4IDw9IDAuNTAwMDEgKSB8fFxuICAgICAgICAgICAgICAgICggeCA8IDAgJiYgeCA+PSAtMC41MDAwMSApXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCB4ID4gMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gMVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgeCA9IC0xO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnU2lnbicsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogMixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBNYXRoLnNpZ24oIHggKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnRmxvb3InLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDUwLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuXG4gICAgICAgICAgICBpZiAoIHggPj0gMC45OTk5ICkge1xuICAgICAgICAgICAgICAgIHggPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIHggPj0gMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCB4IDwgMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gLTE7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdHYXVzc2lhbldoaXRlTm9pc2UnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDIsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gbWF0aC5ucmFuZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnV2hpdGVOb2lzZScsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogMixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnUGlua05vaXNlJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24gKiAyLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgbWF0aC5nZW5lcmF0ZVBpbmtOdW1iZXIoKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gbWF0aC5nZXROZXh0UGlua051bWJlcigpICogMiAtIDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gc2lnbmFsQ3VydmVzOyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBDdXN0b21FbnZlbG9wZSBmcm9tIFwiLi9DdXN0b21FbnZlbG9wZS5lczZcIjtcblxuY2xhc3MgQURCRFNSRW52ZWxvcGUgZXh0ZW5kcyBDdXN0b21FbnZlbG9wZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB0aGlzLnRpbWVzID0ge1xuICAgICAgICAgICAgYXR0YWNrOiAwLjAxLFxuICAgICAgICAgICAgZGVjYXkxOiAwLjUsXG4gICAgICAgICAgICBkZWNheTI6IDAuNSxcbiAgICAgICAgICAgIHJlbGVhc2U6IDAuNVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubGV2ZWxzID0ge1xuICAgICAgICAgICAgaW5pdGlhbDogMCxcbiAgICAgICAgICAgIHBlYWs6IDEsXG4gICAgICAgICAgICBicmVhazogMC41LFxuICAgICAgICAgICAgc3VzdGFpbjogMSxcbiAgICAgICAgICAgIHJlbGVhc2U6IDBcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2luaXRpYWwnLCAwLCB0aGlzLmxldmVscy5pbml0aWFsICk7XG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnYXR0YWNrJywgdGhpcy50aW1lcy5hdHRhY2ssIHRoaXMubGV2ZWxzLnBlYWsgKTtcbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdkZWNheTEnLCB0aGlzLnRpbWVzLmRlY2F5MSwgdGhpcy5sZXZlbHMuYnJlYWsgKTtcbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdkZWNheTInLCB0aGlzLnRpbWVzLmRlY2F5MiwgdGhpcy5sZXZlbHMuc3VzdGFpbiApO1xuICAgICAgICB0aGlzLmFkZEVuZFN0ZXAoICdyZWxlYXNlJywgdGhpcy50aW1lcy5yZWxlYXNlLCB0aGlzLmxldmVscy5yZWxlYXNlLCB0cnVlICk7XG4gICAgfVxuXG4gICAgZ2V0IGF0dGFja1RpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLmF0dGFjaztcbiAgICB9XG4gICAgc2V0IGF0dGFja1RpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5hdHRhY2sgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ2F0dGFjaycsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IGRlY2F5MVRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLmRlY2F5MTtcbiAgICB9XG4gICAgc2V0IGRlY2F5MVRpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5kZWNheTEgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ2RlY2F5MScsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IGRlY2F5MlRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLmRlY2F5MjtcbiAgICB9XG4gICAgc2V0IGRlY2F5MlRpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5kZWNheTIgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ2RlY2F5MicsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHJlbGVhc2VUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5yZWxlYXNlO1xuICAgIH1cbiAgICBzZXQgcmVsZWFzZVRpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5yZWxlYXNlID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdyZWxlYXNlJywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgaW5pdGlhbExldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMuaW5pdGlhbDtcbiAgICB9XG4gICAgc2V0IGluaXRpYWxMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLmluaXRpYWwgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnaW5pdGlhbCcsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBwZWFrTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5wZWFrO1xuICAgIH1cblxuICAgIHNldCBwZWFrTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5wZWFrID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2F0dGFjaycsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgYnJlYWtMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLmJyZWFrO1xuICAgIH1cbiAgICBzZXQgYnJlYWtMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLmJyZWFrID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2RlY2F5MScsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgZ2V0IHN1c3RhaW5MZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnN1c3RhaW47XG4gICAgfVxuICAgIHNldCBzdXN0YWluTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5zdXN0YWluID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2RlY2F5MicsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCByZWxlYXNlTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5yZWxlYXNlO1xuICAgIH1cbiAgICBzZXQgcmVsZWFzZUxldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMucmVsZWFzZSA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdyZWxlYXNlJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQURCRFNSRW52ZWxvcGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEFEQkRTUkVudmVsb3BlKCB0aGlzICk7XG59O1xuXG5leHBvcnRcbmRlZmF1bHQgQURCRFNSRW52ZWxvcGU7IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IEN1c3RvbUVudmVsb3BlIGZyb20gXCIuL0N1c3RvbUVudmVsb3BlLmVzNlwiO1xuXG5jbGFzcyBBREVudmVsb3BlIGV4dGVuZHMgQ3VzdG9tRW52ZWxvcGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdGhpcy50aW1lcyA9IHtcbiAgICAgICAgICAgIGF0dGFjazogMC4wMSxcbiAgICAgICAgICAgIGRlY2F5OiAwLjVcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxldmVscyA9IHtcbiAgICAgICAgICAgIGluaXRpYWw6IDAsXG4gICAgICAgICAgICBwZWFrOiAxXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdpbml0aWFsJywgMCwgdGhpcy5sZXZlbHMuaW5pdGlhbCApO1xuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2F0dGFjaycsIHRoaXMudGltZXMuYXR0YWNrLCB0aGlzLmxldmVscy5wZWFrICk7XG4gICAgICAgIHRoaXMuYWRkRW5kU3RlcCggJ2RlY2F5JywgdGhpcy50aW1lcy5kZWNheSwgdGhpcy5sZXZlbHMuc3VzdGFpbiwgdHJ1ZSApO1xuICAgIH1cblxuICAgIGdldCBhdHRhY2tUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5hdHRhY2s7XG4gICAgfVxuICAgIHNldCBhdHRhY2tUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuYXR0YWNrID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdhdHRhY2snLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBkZWNheVRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLmRlY2F5O1xuICAgIH1cbiAgICBzZXQgZGVjYXlUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuZGVjYXkgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ2RlY2F5JywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGluaXRpYWxMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLmluaXRpYWw7XG4gICAgfVxuICAgIHNldCBpbml0aWFsTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5pbml0aWFsID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2luaXRpYWwnLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgcGVha0xldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMucGVhaztcbiAgICB9XG5cbiAgICBzZXQgcGVha0xldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMucGVhayA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdhdHRhY2snLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBREVudmVsb3BlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBBREVudmVsb3BlKCB0aGlzICk7XG59O1xuXG5leHBvcnRcbmRlZmF1bHQgQURFbnZlbG9wZTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgQ3VzdG9tRW52ZWxvcGUgZnJvbSBcIi4vQ3VzdG9tRW52ZWxvcGUuZXM2XCI7XG5cbmNsYXNzIEFEU1JFbnZlbG9wZSBleHRlbmRzIEN1c3RvbUVudmVsb3BlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHRoaXMudGltZXMgPSB7XG4gICAgICAgICAgICBhdHRhY2s6IDAuMDEsXG4gICAgICAgICAgICBkZWNheTogMC41LFxuICAgICAgICAgICAgcmVsZWFzZTogMC41XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sZXZlbHMgPSB7XG4gICAgICAgICAgICBpbml0aWFsOiAwLFxuICAgICAgICAgICAgcGVhazogMSxcbiAgICAgICAgICAgIHN1c3RhaW46IDEsXG4gICAgICAgICAgICByZWxlYXNlOiAwXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdpbml0aWFsJywgMCwgdGhpcy5sZXZlbHMuaW5pdGlhbCApO1xuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2F0dGFjaycsIHRoaXMudGltZXMuYXR0YWNrLCB0aGlzLmxldmVscy5wZWFrICk7XG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnZGVjYXknLCB0aGlzLnRpbWVzLmRlY2F5LCB0aGlzLmxldmVscy5zdXN0YWluICk7XG4gICAgICAgIHRoaXMuYWRkRW5kU3RlcCggJ3JlbGVhc2UnLCB0aGlzLnRpbWVzLnJlbGVhc2UsIHRoaXMubGV2ZWxzLnJlbGVhc2UsIHRydWUgKTtcbiAgICB9XG5cbiAgICBnZXQgYXR0YWNrVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZXMuYXR0YWNrO1xuICAgIH1cbiAgICBzZXQgYXR0YWNrVGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLmF0dGFjayA9IHRpbWU7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBUaW1lKCAnYXR0YWNrJywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgZGVjYXlUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5kZWNheTtcbiAgICB9XG4gICAgc2V0IGRlY2F5VGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLmRlY2F5ID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdkZWNheScsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHJlbGVhc2VUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5yZWxlYXNlO1xuICAgIH1cbiAgICBzZXQgcmVsZWFzZVRpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5yZWxlYXNlID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdyZWxlYXNlJywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgaW5pdGlhbExldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMuaW5pdGlhbDtcbiAgICB9XG4gICAgc2V0IGluaXRpYWxMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLmluaXRpYWwgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnaW5pdGlhbCcsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBwZWFrTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5wZWFrO1xuICAgIH1cblxuICAgIHNldCBwZWFrTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5wZWFrID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2F0dGFjaycsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBzdXN0YWluTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5zdXN0YWluO1xuICAgIH1cbiAgICBzZXQgc3VzdGFpbkxldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMuc3VzdGFpbiA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdkZWNheScsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCByZWxlYXNlTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5yZWxlYXNlO1xuICAgIH1cbiAgICBzZXQgcmVsZWFzZUxldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMucmVsZWFzZSA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdyZWxlYXNlJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQURTUkVudmVsb3BlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBBRFNSRW52ZWxvcGUoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEFEU1JFbnZlbG9wZTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IENPTkZJRyBmcm9tIFwiLi4vY29yZS9jb25maWcuZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5cbmNsYXNzIEN1c3RvbUVudmVsb3BlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMub3JkZXJzID0ge1xuICAgICAgICAgICAgc3RhcnQ6IFtdLFxuICAgICAgICAgICAgc3RvcDogW11cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnN0ZXBzID0ge1xuICAgICAgICAgICAgc3RhcnQ6IHt9LFxuICAgICAgICAgICAgc3RvcDoge31cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBfYWRkU3RlcCggc2VjdGlvbiwgbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgPSBmYWxzZSApIHtcbiAgICAgICAgbGV0IHN0b3BzID0gdGhpcy5zdGVwc1sgc2VjdGlvbiBdO1xuXG4gICAgICAgIGlmICggc3RvcHNbIG5hbWUgXSApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ1N0b3Agd2l0aCBuYW1lIFwiJyArIG5hbWUgKyAnXCIgYWxyZWFkeSBleGlzdHMuJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vcmRlcnNbIHNlY3Rpb24gXS5wdXNoKCBuYW1lICk7XG5cbiAgICAgICAgdGhpcy5zdGVwc1sgc2VjdGlvbiBdWyBuYW1lIF0gPSB7XG4gICAgICAgICAgICB0aW1lOiB0aW1lLFxuICAgICAgICAgICAgbGV2ZWw6IGxldmVsLFxuICAgICAgICAgICAgaXNFeHBvbmVudGlhbDogaXNFeHBvbmVudGlhbFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFkZFN0YXJ0U3RlcCggbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgPSBmYWxzZSApIHtcbiAgICAgICAgdGhpcy5fYWRkU3RlcCggJ3N0YXJ0JywgbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgYWRkRW5kU3RlcCggbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgPSBmYWxzZSApIHtcbiAgICAgICAgdGhpcy5fYWRkU3RlcCggJ3N0b3AnLCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRTdGVwTGV2ZWwoIG5hbWUsIGxldmVsICkge1xuICAgICAgICBsZXQgc3RhcnRJbmRleCA9IHRoaXMub3JkZXJzLnN0YXJ0LmluZGV4T2YoIG5hbWUgKSxcbiAgICAgICAgICAgIGVuZEluZGV4ID0gdGhpcy5vcmRlcnMuc3RvcC5pbmRleE9mKCBuYW1lICk7XG5cbiAgICAgICAgaWYgKCBzdGFydEluZGV4ID09PSAtMSAmJiBlbmRJbmRleCA9PT0gLTEgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdObyBzdGVwIHdpdGggbmFtZSBcIicgKyBuYW1lICsgJ1wiLiBObyBsZXZlbCBzZXQuJyApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzdGFydEluZGV4ICE9PSAtMSApIHtcbiAgICAgICAgICAgIHRoaXMuc3RlcHMuc3RhcnRbIG5hbWUgXS5sZXZlbCA9IHBhcnNlRmxvYXQoIGxldmVsICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnN0b3BbIG5hbWUgXS5sZXZlbCA9IHBhcnNlRmxvYXQoIGxldmVsICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cblxuICAgIHNldFN0ZXBUaW1lKCBuYW1lLCB0aW1lICkge1xuICAgICAgICB2YXIgc3RhcnRJbmRleCA9IHRoaXMub3JkZXJzLnN0YXJ0LmluZGV4T2YoIG5hbWUgKSxcbiAgICAgICAgICAgIGVuZEluZGV4ID0gdGhpcy5vcmRlcnMuc3RvcC5pbmRleE9mKCBuYW1lICk7XG5cbiAgICAgICAgaWYgKCBzdGFydEluZGV4ID09PSAtMSAmJiBlbmRJbmRleCA9PT0gLTEgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdObyBzdGVwIHdpdGggbmFtZSBcIicgKyBuYW1lICsgJ1wiLiBObyB0aW1lIHNldC4nICk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggIT09IC0xICkge1xuICAgICAgICAgICAgdGhpcy5zdGVwcy5zdGFydFsgbmFtZSBdLnRpbWUgPSBwYXJzZUZsb2F0KCB0aW1lICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnN0b3BbIG5hbWUgXS50aW1lID0gcGFyc2VGbG9hdCggdGltZSApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG5cblxuICAgIF90cmlnZ2VyU3RlcCggcGFyYW0sIHN0ZXAsIHN0YXJ0VGltZSApIHtcbiAgICAgICAgLy8gaWYgKCBzdGVwLmlzRXhwb25lbnRpYWwgPT09IHRydWUgKSB7XG4gICAgICAgICAgICAvLyBUaGVyZSdzIHNvbWV0aGluZyBhbWlzcyBoZXJlIVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coIE1hdGgubWF4KCBzdGVwLmxldmVsLCBDT05GSUcuZXBzaWxvbiApLCBzdGFydFRpbWUgKyBzdGVwLnRpbWUgKTtcbiAgICAgICAgICAgIC8vIHBhcmFtLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoIE1hdGgubWF4KCBzdGVwLmxldmVsLCAwLjAxICksIHN0YXJ0VGltZSArIHN0ZXAudGltZSApO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGVsc2Uge1xuICAgICAgICAgICAgcGFyYW0ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIHN0ZXAubGV2ZWwsIHN0YXJ0VGltZSArIHN0ZXAudGltZSApO1xuICAgICAgICAvLyB9XG4gICAgfVxuXG4gICAgX3N0YXJ0U2VjdGlvbiggc2VjdGlvbiwgcGFyYW0sIHN0YXJ0VGltZSwgY2FuY2VsU2NoZWR1bGVkVmFsdWVzICkge1xuICAgICAgICB2YXIgc3RvcE9yZGVyID0gdGhpcy5vcmRlcnNbIHNlY3Rpb24gXSxcbiAgICAgICAgICAgIHN0ZXBzID0gdGhpcy5zdGVwc1sgc2VjdGlvbiBdLFxuICAgICAgICAgICAgbnVtU3RvcHMgPSBzdG9wT3JkZXIubGVuZ3RoLFxuICAgICAgICAgICAgc3RlcDtcblxuICAgICAgICBwYXJhbS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHN0YXJ0VGltZSApO1xuICAgICAgICAvLyBwYXJhbS5zZXRWYWx1ZUF0VGltZSggMCwgc3RhcnRUaW1lICk7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgbnVtU3RvcHM7ICsraSApIHtcbiAgICAgICAgICAgIHN0ZXAgPSBzdGVwc1sgc3RvcE9yZGVyWyBpIF0gXTtcbiAgICAgICAgICAgIHRoaXMuX3RyaWdnZXJTdGVwKCBwYXJhbSwgc3RlcCwgc3RhcnRUaW1lICk7XG4gICAgICAgICAgICBzdGFydFRpbWUgKz0gc3RlcC50aW1lO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBzdGFydCggcGFyYW0sIGRlbGF5ID0gMCApIHtcbiAgICAgICAgaWYgKCBwYXJhbSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gPT09IGZhbHNlICYmIHBhcmFtIGluc3RhbmNlb2YgUGFyYW0gPT09IGZhbHNlICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnQ2FuIG9ubHkgc3RhcnQgYW4gZW52ZWxvcGUgb24gQXVkaW9QYXJhbSBvciBQYXJhbSBpbnN0YW5jZXMuJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc3RhcnRTZWN0aW9uKCAnc3RhcnQnLCBwYXJhbSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgZGVsYXkgKTtcbiAgICB9XG5cbiAgICBzdG9wKCBwYXJhbSwgZGVsYXkgPSAwICkge1xuICAgICAgICB0aGlzLl9zdGFydFNlY3Rpb24oICdzdG9wJywgcGFyYW0sIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIDAuMSArIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgZm9yY2VTdG9wKCBwYXJhbSwgZGVsYXkgPSAwICkge1xuICAgICAgICBwYXJhbS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIGRlbGF5ICk7XG4gICAgICAgIC8vIHBhcmFtLnNldFZhbHVlQXRUaW1lKCBwYXJhbS52YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgZGVsYXkgKTtcbiAgICAgICAgcGFyYW0ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIDAsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIDAuMDAxICk7XG4gICAgfVxuXG4gICAgZ2V0IHRvdGFsU3RhcnRUaW1lKCkge1xuICAgICAgICB2YXIgc3RhcnRzID0gdGhpcy5zdGVwcy5zdGFydCxcbiAgICAgICAgICAgIHRpbWUgPSAwLjA7XG5cbiAgICAgICAgZm9yICggdmFyIGkgaW4gc3RhcnRzICkge1xuICAgICAgICAgICAgdGltZSArPSBzdGFydHNbIGkgXS50aW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRpbWU7XG4gICAgfVxuXG4gICAgZ2V0IHRvdGFsU3RvcFRpbWUoKSB7XG4gICAgICAgIHZhciBzdG9wcyA9IHRoaXMuc3RlcHMuc3RvcCxcbiAgICAgICAgICAgIHRpbWUgPSAwLjA7XG5cbiAgICAgICAgZm9yICggdmFyIGkgaW4gc3RvcHMgKSB7XG4gICAgICAgICAgICB0aW1lICs9IHN0b3BzWyBpIF0udGltZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aW1lO1xuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggQ3VzdG9tRW52ZWxvcGUucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUN1c3RvbUVudmVsb3BlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBDdXN0b21FbnZlbG9wZSggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQ3VzdG9tRW52ZWxvcGU7IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLypcbiAgICBUaGlzIE5vZGUgaXMgYW4gaW1wbGVtZW50YXRpb24gb2Ygb25lIG9mIFNjaHJvZWRlcidzXG4gICAgQWxsUGFzcyBncmFwaHMuIFRoaXMgcGFydGljdWxhciBncmFwaCBpcyBzaG93biBpbiBGaWd1cmUyXG4gICAgaW4gdGhlIGZvbGxvd2luZyBwYXBlcjpcblxuICAgICAgICBNLiBSLiBTY2hyb2VkZXIgLSBOYXR1cmFsIFNvdW5kaW5nIEFydGlmaWNpYWwgUmV2ZXJiZXJhdGlvblxuXG4gICAgICAgIEpvdXJuYWwgb2YgdGhlIEF1ZGlvIEVuZ2luZWVyaW5nIFNvY2lldHksIEp1bHkgMTk2Mi5cbiAgICAgICAgVm9sdW1lIDEwLCBOdW1iZXIgMy5cblxuXG4gICAgSXQncyBhdmFpbGFibGUgaGVyZTpcbiAgICAgICAgaHR0cDovL3d3dy5lY2Uucm9jaGVzdGVyLmVkdS9+emR1YW4vdGVhY2hpbmcvZWNlNDcyL3JlYWRpbmcvU2Nocm9lZGVyXzE5NjIucGRmXG5cblxuICAgIFRoZXJlIGFyZSB0aHJlZSBtYWluIHBhdGhzIGFuIGlucHV0IHNpZ25hbCBjYW4gdGFrZTpcblxuICAgIGluIC0+IC1nYWluIC0+IHN1bTEgLT4gb3V0XG4gICAgaW4gLT4gc3VtMiAtPiBkZWxheSAtPiBnYWluIC0+IHN1bTJcbiAgICBpbiAtPiBzdW0yIC0+IGRlbGF5IC0+IGdhaW4gKDEtZ14yKSAtPiBzdW0xXG5cbiAgICBGb3Igbm93LCB0aGUgc3VtbWluZyBub2RlcyBhcmUgYSBwYXJ0IG9mIHRoZSBmb2xsb3dpbmcgY2xhc3MsXG4gICAgYnV0IGNhbiBlYXNpbHkgYmUgcmVtb3ZlZCBieSBjb25uZWN0aW5nIGAtZ2FpbmAsIGBnYWluYCwgYW5kIGAxLWdhaW5eMmBcbiAgICB0byBgdGhpcy5vdXRwdXRzWzBdYCBhbmQgYC1nYWluYCBhbmQgYGluYCB0byB0aGUgZGVsYXkgZGlyZWN0bHkuXG4gKi9cblxuLy8gVE9ETzpcbi8vICAtIFJlbW92ZSB1bm5lY2Vzc2FyeSBzdW1taW5nIG5vZGVzLlxuY2xhc3MgU2Nocm9lZGVyQWxsUGFzcyBleHRlbmRzIE5vZGUge1xuXG4gICAgY29uc3RydWN0b3IoIGlvLCBkZWxheVRpbWUsIGZlZWRiYWNrICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguc3VtMSA9IGlvLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5zdW0yID0gaW8uY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLnBvc2l0aXZlR2FpbiA9IGlvLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZUdhaW4gPSBpby5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgubmVnYXRlID0gaW8uY3JlYXRlTmVnYXRlKCk7XG4gICAgICAgIGdyYXBoLmRlbGF5ID0gaW8uY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICBncmFwaC5vbmVNaW51c0dhaW5TcXVhcmVkID0gaW8uY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm1pbnVzT25lID0gaW8uY3JlYXRlU3VidHJhY3QoIDEgKTtcbiAgICAgICAgZ3JhcGguZ2FpblNxdWFyZWQgPSBpby5jcmVhdGVTcXVhcmUoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrID0gaW8uY3JlYXRlUGFyYW0oIGZlZWRiYWNrICksXG4gICAgICAgIHRoaXMuY29udHJvbHMuZGVsYXlUaW1lID0gaW8uY3JlYXRlUGFyYW0oIGRlbGF5VGltZSApO1xuXG4gICAgICAgIC8vIFplcm8gb3V0IGNvbnRyb2xsZWQgcGFyYW1zLlxuICAgICAgICBncmFwaC5wb3NpdGl2ZUdhaW4uZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlR2Fpbi5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgub25lTWludXNHYWluU3F1YXJlZC5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIGdhaW4gY29udHJvbHNcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5wb3NpdGl2ZUdhaW4uZ2FpbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrLmNvbm5lY3QoIGdyYXBoLm5lZ2F0ZSApO1xuICAgICAgICBncmFwaC5uZWdhdGUuY29ubmVjdCggZ3JhcGgubmVnYXRpdmVHYWluLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5nYWluU3F1YXJlZCApO1xuICAgICAgICBncmFwaC5nYWluU3F1YXJlZC5jb25uZWN0KCBncmFwaC5taW51c09uZSApO1xuICAgICAgICBncmFwaC5taW51c09uZS5jb25uZWN0KCBncmFwaC5vbmVNaW51c0dhaW5TcXVhcmVkLmdhaW4gKTtcblxuICAgICAgICAvLyBjb25uZWN0IGRlbGF5IHRpbWUgY29udHJvbFxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRlbGF5VGltZS5jb25uZWN0KCBncmFwaC5kZWxheS5kZWxheVRpbWUgKTtcblxuICAgICAgICAvLyBGaXJzdCBzaWduYWwgcGF0aDpcbiAgICAgICAgLy8gaW4gLT4gLWdhaW4gLT4gZ3JhcGguc3VtMSAtPiBvdXRcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5uZWdhdGl2ZUdhaW4gKTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVHYWluLmNvbm5lY3QoIGdyYXBoLnN1bTEgKTtcbiAgICAgICAgZ3JhcGguc3VtMS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIFNlY29uZCBzaWduYWwgcGF0aDpcbiAgICAgICAgLy8gKGluIC0+IGdyYXBoLnN1bTIgLT4pIGRlbGF5IC0+IGdhaW4gLT4gZ3JhcGguc3VtMlxuICAgICAgICBncmFwaC5kZWxheS5jb25uZWN0KCBncmFwaC5wb3NpdGl2ZUdhaW4gKTtcbiAgICAgICAgZ3JhcGgucG9zaXRpdmVHYWluLmNvbm5lY3QoIGdyYXBoLnN1bTIgKTtcblxuICAgICAgICAvLyBUaGlyZCBzaWduYWwgcGF0aDpcbiAgICAgICAgLy8gaW4gLT4gZ3JhcGguc3VtMiAtPiBkZWxheSAtPiBnYWluICgxLWdeMikgLT4gZ3JhcGguc3VtMVxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnN1bTIgKTtcbiAgICAgICAgZ3JhcGguc3VtMi5jb25uZWN0KCBncmFwaC5kZWxheSApO1xuICAgICAgICBncmFwaC5kZWxheS5jb25uZWN0KCBncmFwaC5vbmVNaW51c0dhaW5TcXVhcmVkICk7XG4gICAgICAgIGdyYXBoLm9uZU1pbnVzR2FpblNxdWFyZWQuY29ubmVjdCggZ3JhcGguc3VtMSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTY2hyb2VkZXJBbGxQYXNzID0gZnVuY3Rpb24oIGRlbGF5VGltZSwgZmVlZGJhY2sgKSB7XG4gICAgcmV0dXJuIG5ldyBTY2hyb2VkZXJBbGxQYXNzKCB0aGlzLCBkZWxheVRpbWUsIGZlZWRiYWNrICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgRHJ5V2V0Tm9kZSBmcm9tIFwiLi4vLi4vZ3JhcGhzL0RyeVdldE5vZGUuZXM2XCI7XG5cbi8vIFRPRE86IEFkZCBmZWVkYmFja0xldmVsIGFuZCBkZWxheVRpbWUgUGFyYW0gaW5zdGFuY2VzXG4vLyB0byBjb250cm9sIHRoaXMgbm9kZS5cbmNsYXNzIERlbGF5IGV4dGVuZHMgRHJ5V2V0Tm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB0aW1lID0gMCwgZmVlZGJhY2tMZXZlbCA9IDAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgY29udHJvbCBub2Rlcy5cbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjayA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGZlZWRiYWNrTGV2ZWwgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdGltZSApO1xuXG4gICAgICAgIC8vIENyZWF0ZSBmZWVkYmFjayBhbmQgZGVsYXkgbm9kZXNcbiAgICAgICAgdGhpcy5mZWVkYmFjayA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcblxuICAgICAgICAvLyBTZXR1cCB0aGUgZmVlZGJhY2sgbG9vcFxuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMuZmVlZGJhY2sgKTtcbiAgICAgICAgdGhpcy5mZWVkYmFjay5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG5cbiAgICAgICAgLy8gQWxzbyBjb25uZWN0IHRoZSBkZWxheSB0byB0aGUgd2V0IG91dHB1dC5cbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLndldCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgaW5wdXQgdG8gZGVsYXlcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG5cbiAgICAgICAgdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudGltZS5jb25uZWN0KCB0aGlzLmRlbGF5LmRlbGF5VGltZSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2suZ2FpbiApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRGVsYXkgPSBmdW5jdGlvbiggdGltZSwgZmVlZGJhY2tMZXZlbCApIHtcbiAgICByZXR1cm4gbmV3IERlbGF5KCB0aGlzLCB0aW1lLCBmZWVkYmFja0xldmVsICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBEZWxheTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IERyeVdldE5vZGUgZnJvbSBcIi4uLy4uL2dyYXBocy9EcnlXZXROb2RlLmVzNlwiO1xuXG4vLyBUT0RPOlxuLy8gIC0gQ29udmVydCB0aGlzIG5vZGUgdG8gdXNlIFBhcmFtIGNvbnRyb2xzXG4vLyAgICBmb3IgdGltZSBhbmQgZmVlZGJhY2suXG5cbmNsYXNzIFBpbmdQb25nRGVsYXkgZXh0ZW5kcyBEcnlXZXROb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHRpbWUgPSAwLjI1LCBmZWVkYmFja0xldmVsID0gMC41ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyBDcmVhdGUgY2hhbm5lbCBzcGxpdHRlciBhbmQgbWVyZ2VyXG4gICAgICAgIHRoaXMuc3BsaXR0ZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKCAyICk7XG4gICAgICAgIHRoaXMubWVyZ2VyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxNZXJnZXIoIDIgKTtcblxuICAgICAgICAvLyBDcmVhdGUgZmVlZGJhY2sgYW5kIGRlbGF5IG5vZGVzXG4gICAgICAgIHRoaXMuZmVlZGJhY2tMID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5mZWVkYmFja1IgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmRlbGF5TCA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICB0aGlzLmRlbGF5UiA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuXG4gICAgICAgIC8vIFNldHVwIHRoZSBmZWVkYmFjayBsb29wXG4gICAgICAgIHRoaXMuZGVsYXlMLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2tMICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tMLmNvbm5lY3QoIHRoaXMuZGVsYXlSICk7XG4gICAgICAgIHRoaXMuZGVsYXlSLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2tSICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tSLmNvbm5lY3QoIHRoaXMuZGVsYXlMICk7XG5cblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc3BsaXR0ZXIgKTtcbiAgICAgICAgdGhpcy5zcGxpdHRlci5jb25uZWN0KCB0aGlzLmRlbGF5TCwgMCApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrTC5jb25uZWN0KCB0aGlzLm1lcmdlciwgMCwgMCApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrUi5jb25uZWN0KCB0aGlzLm1lcmdlciwgMCwgMSApO1xuICAgICAgICB0aGlzLm1lcmdlci5jb25uZWN0KCB0aGlzLndldCApO1xuXG4gICAgICAgIHRoaXMudGltZSA9IHRpbWU7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tMZXZlbCA9IGZlZWRiYWNrTGV2ZWw7XG4gICAgfVxuXG4gICAgZ2V0IHRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlbGF5TC5kZWxheVRpbWU7XG4gICAgfVxuXG4gICAgc2V0IHRpbWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmRlbGF5TC5kZWxheVRpbWUubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIDAuNVxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuZGVsYXlSLmRlbGF5VGltZS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZShcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgMC41XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZ2V0IGZlZWRiYWNrTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZlZWRiYWNrTC5nYWluLnZhbHVlO1xuICAgIH1cblxuICAgIHNldCBmZWVkYmFja0xldmVsKCBsZXZlbCApIHtcbiAgICAgICAgdGhpcy5mZWVkYmFja0wuZ2Fpbi52YWx1ZSA9IGxldmVsO1xuICAgICAgICB0aGlzLmZlZWRiYWNrUi5nYWluLnZhbHVlID0gbGV2ZWw7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVQaW5nUG9uZ0RlbGF5ID0gZnVuY3Rpb24oIHRpbWUsIGZlZWRiYWNrTGV2ZWwgKSB7XG4gICAgcmV0dXJuIG5ldyBQaW5nUG9uZ0RlbGF5KCB0aGlzLCB0aW1lLCBmZWVkYmFja0xldmVsICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgRHJ5V2V0Tm9kZSBmcm9tIFwiLi4vLi4vZ3JhcGhzL0RyeVdldE5vZGUuZXM2XCI7XG5cblxuY2xhc3MgU3RlcmVvRGVsYXkgZXh0ZW5kcyBEcnlXZXROb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgY29udHJvbCBub2Rlcy5cbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjayA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lTCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lUiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgICAgICB0aGlzLnNwbGl0dGVyID0gdGhpcy5pby5jcmVhdGVTcGxpdHRlciggMiApO1xuICAgICAgICB0aGlzLmRlbGF5TCA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICB0aGlzLmRlbGF5UiA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICB0aGlzLmZlZWRiYWNrTCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tSID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5tZXJnZXIgPSB0aGlzLmlvLmNyZWF0ZU1lcmdlciggMiApO1xuXG4gICAgICAgIHRoaXMuZGVsYXlMLmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgIHRoaXMuZGVsYXlSLmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tMLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICB0aGlzLmZlZWRiYWNrUi5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmRlbGF5TC5jb25uZWN0KCB0aGlzLmZlZWRiYWNrTCApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrTC5jb25uZWN0KCB0aGlzLmRlbGF5TCApO1xuICAgICAgICB0aGlzLmRlbGF5Ui5jb25uZWN0KCB0aGlzLmZlZWRiYWNrUiApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrUi5jb25uZWN0KCB0aGlzLmRlbGF5UiApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2suY29ubmVjdCggdGhpcy5mZWVkYmFja0wuZ2FpbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2tSLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lTC5jb25uZWN0KCB0aGlzLmRlbGF5TC5kZWxheVRpbWUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lUi5jb25uZWN0KCB0aGlzLmRlbGF5Ui5kZWxheVRpbWUgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc3BsaXR0ZXIgKTtcbiAgICAgICAgdGhpcy5zcGxpdHRlci5jb25uZWN0KCB0aGlzLmRlbGF5TCwgMCApO1xuICAgICAgICB0aGlzLnNwbGl0dGVyLmNvbm5lY3QoIHRoaXMuZGVsYXlSLCAxICk7XG4gICAgICAgIHRoaXMuZGVsYXlMLmNvbm5lY3QoIHRoaXMubWVyZ2VyLCAwLCAwICk7XG4gICAgICAgIHRoaXMuZGVsYXlSLmNvbm5lY3QoIHRoaXMubWVyZ2VyLCAwLCAxICk7XG4gICAgICAgIHRoaXMubWVyZ2VyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTdGVyZW9EZWxheSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgU3RlcmVvRGVsYXkoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFN0ZXJlb0RlbGF5OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG52YXIgRklMVEVSX1NUT1JFID0gbmV3IFdlYWtNYXAoKTtcblxuZnVuY3Rpb24gY3JlYXRlRmlsdGVyKCBpbywgdHlwZSApIHtcbiAgICB2YXIgZ3JhcGggPSB7XG4gICAgICAgIGZpbHRlcjogaW8uY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKSxcbiAgICAgICAgY29udHJvbHM6IHt9LFxuICAgICAgICB0eXBlOiB1bmRlZmluZWRcbiAgICB9O1xuXG4gICAgZ3JhcGguZmlsdGVyLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgZ3JhcGguZmlsdGVyLlEudmFsdWUgPSAwO1xuXG4gICAgZ3JhcGguY29udHJvbHMuZnJlcXVlbmN5ID0gaW8uY3JlYXRlUGFyYW0oKTtcbiAgICBncmFwaC5jb250cm9scy5RID0gaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgIGdyYXBoLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5maWx0ZXIuZnJlcXVlbmN5ICk7XG4gICAgZ3JhcGguY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5maWx0ZXIuUSApO1xuXG4gICAgZ3JhcGguc2V0VHlwZSA9IGZ1bmN0aW9uKCB0eXBlICkge1xuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuXG4gICAgICAgIHN3aXRjaCAoIHR5cGUgKSB7XG4gICAgICAgICAgICBjYXNlICdMUDEyJzpcbiAgICAgICAgICAgICAgICB0aGlzLmZpbHRlci50eXBlID0gJ2xvd3Bhc3MnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdub3RjaCc6XG4gICAgICAgICAgICAgICAgdGhpcy5maWx0ZXIudHlwZSA9ICdub3RjaCc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0hQMTInOlxuICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyLnR5cGUgPSAnaGlnaHBhc3MnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgLy8gRmFsbCB0aHJvdWdoIHRvIGhhbmRsZSB0aG9zZSBmaWx0ZXJcbiAgICAgICAgICAgICAgICAvLyB0eXBlcyB3aXRoIGBnYWluYCBBdWRpb1BhcmFtcy5cbiAgICAgICAgICAgIGNhc2UgJ2xvd3NoZWxmJzpcbiAgICAgICAgICAgICAgICB0aGlzLmZpbHRlci50eXBlID0gJ2xvd3NoZWxmJztcbiAgICAgICAgICAgIGNhc2UgJ2hpZ2hzaGVsZic6XG4gICAgICAgICAgICAgICAgdGhpcy5maWx0ZXIudHlwZSA9ICdoaWdoc2hlbGYnO1xuICAgICAgICAgICAgY2FzZSAncGVha2luZyc6XG4gICAgICAgICAgICAgICAgdGhpcy5maWx0ZXIudHlwZSA9ICdwZWFraW5nJztcbiAgICAgICAgICAgICAgICB0aGlzLmZpbHRlci5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmdhaW4gPSBpby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGdyYXBoLnNldFR5cGUoIHR5cGUgKTtcblxuICAgIHJldHVybiBncmFwaDtcbn1cblxuY2xhc3MgQ3VzdG9tRVEgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIC8vIEluaXRpYWxseSwgdGhpcyBOb2RlIGlzIGp1c3QgYSBwYXNzLXRocm91Z2hcbiAgICAgICAgLy8gdW50aWwgZmlsdGVycyBhcmUgYWRkZWQuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBhZGRGaWx0ZXIoIHR5cGUgKSB7XG4gICAgICAgIHZhciBmaWx0ZXJHcmFwaCA9IGNyZWF0ZUZpbHRlciggdGhpcy5pbywgdHlwZSApLFxuICAgICAgICAgICAgZmlsdGVycyA9IEZJTFRFUl9TVE9SRS5nZXQoIHRoaXMgKSB8fCBbXTtcblxuICAgICAgICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCBmaWx0ZXIgYmVpbmcgYWRkZWQsXG4gICAgICAgIC8vIG1ha2Ugc3VyZSBpbnB1dCBpcyBjb25uZWN0ZWQgYW5kIGZpbHRlclxuICAgICAgICAvLyBpcyB0aGVuIGNvbm5lY3RlZCB0byBvdXRwdXQuXG4gICAgICAgIGlmICggZmlsdGVycy5sZW5ndGggPT09IDAgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmRpc2Nvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGZpbHRlckdyYXBoLmZpbHRlciApO1xuICAgICAgICAgICAgZmlsdGVyR3JhcGguZmlsdGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGVyZSBhcmUgYWxyZWFkeSBmaWx0ZXJzLCB0aGUgbGFzdCBmaWx0ZXJcbiAgICAgICAgLy8gaW4gdGhlIGdyYXBoIHdpbGwgbmVlZCB0byBiZSBkaXNjb25uZWN0ZWQgZm9ybVxuICAgICAgICAvLyB0aGUgb3V0cHV0IGJlZm9yZSB0aGUgbmV3IGZpbHRlciBpcyBjb25uZWN0ZWQuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZmlsdGVyc1sgZmlsdGVycy5sZW5ndGggLSAxIF0uZmlsdGVyLmRpc2Nvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgICAgICBmaWx0ZXJzWyBmaWx0ZXJzLmxlbmd0aCAtIDEgXS5maWx0ZXIuY29ubmVjdCggZmlsdGVyR3JhcGguZmlsdGVyICk7XG4gICAgICAgICAgICBmaWx0ZXJHcmFwaC5maWx0ZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0b3JlIHRoZSBmaWx0ZXIgYW5kIHNhdmUgdGhlIG5ldyBmaWx0ZXJzIG9iamVjdFxuICAgICAgICAvLyAoaXQgbmVlZHMgdG8gYmUgc2F2ZWQgaW4gY2FzZSB0aGlzIGlzIHRoZSBmaXJzdFxuICAgICAgICAvLyBmaWx0ZXIgYmVpbmcgYWRkZWQsIGFuZCB2ZXJ5IGxpdHRsZSBvdmVyaGVhZCB0b1xuICAgICAgICAvLyBjYWxsaW5nIGBzZXRgIGlmIGl0J3Mgbm90IHRoZSBmaXJzdCBmaWx0ZXIgYmVpbmdcbiAgICAgICAgLy8gYWRkZWQpLlxuICAgICAgICBmaWx0ZXJzLnB1c2goIGZpbHRlckdyYXBoICk7XG4gICAgICAgIEZJTFRFUl9TVE9SRS5zZXQoIHRoaXMsIGZpbHRlcnMgKTtcblxuICAgICAgICByZXR1cm4gZmlsdGVyR3JhcGg7XG4gICAgfVxuXG4gICAgZ2V0RmlsdGVyKCBpbmRleCApIHtcbiAgICAgICAgcmV0dXJuIEZJTFRFUl9TVE9SRS5nZXQoIHRoaXMgKVsgaW5kZXggXTtcbiAgICB9XG5cbiAgICBnZXRBbGxGaWx0ZXJzKCkge1xuICAgICAgICByZXR1cm4gRklMVEVSX1NUT1JFLmdldCggdGhpcyApO1xuICAgIH1cblxuICAgIHJlbW92ZUZpbHRlciggZmlsdGVyR3JhcGggKSB7XG4gICAgICAgIHZhciBmaWx0ZXJzID0gRklMVEVSX1NUT1JFLmdldCggdGhpcyApLFxuICAgICAgICAgICAgaW5kZXggPSBmaWx0ZXJzLmluZGV4T2YoIGZpbHRlckdyYXBoICk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlRmlsdGVyQXRJbmRleCggaW5kZXggKTtcbiAgICB9XG5cbiAgICByZW1vdmVGaWx0ZXJBdEluZGV4KCBpbmRleCApIHtcbiAgICAgICAgdmFyIGZpbHRlcnMgPSBGSUxURVJfU1RPUkUuZ2V0KCB0aGlzICk7XG5cblxuICAgICAgICBpZiAoICFmaWx0ZXJzWyBpbmRleCBdICkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCAnTm8gZmlsdGVyIGF0IHRoZSBnaXZlbiBpbmRleDonLCBpbmRleCwgZmlsdGVycyApO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGlzY29ubmVjdCB0aGUgcmVxdWVzdGVkIGZpbHRlclxuICAgICAgICAvLyBhbmQgcmVtb3ZlIGl0IGZyb20gdGhlIGZpbHRlcnMgYXJyYXkuXG4gICAgICAgIGZpbHRlcnNbIGluZGV4IF0uZmlsdGVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgZmlsdGVycy5zcGxpY2UoIGluZGV4LCAxICk7XG5cbiAgICAgICAgLy8gSWYgYWxsIGZpbHRlcnMgaGF2ZSBiZWVuIHJlbW92ZWQsIGNvbm5lY3QgdGhlXG4gICAgICAgIC8vIGlucHV0IHRvIHRoZSBvdXRwdXQgc28gYXVkaW8gc3RpbGwgcGFzc2VzIHRocm91Z2guXG4gICAgICAgIGlmICggZmlsdGVycy5sZW5ndGggPT09IDAgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgZmlyc3QgZmlsdGVyIGhhcyBiZWVuIHJlbW92ZWQsIGFuZCB0aGVyZVxuICAgICAgICAvLyBhcmUgc3RpbGwgZmlsdGVycyBpbiB0aGUgYXJyYXksIGNvbm5lY3QgdGhlIGlucHV0XG4gICAgICAgIC8vIHRvIHRoZSBuZXcgZmlyc3QgZmlsdGVyLlxuICAgICAgICBlbHNlIGlmICggaW5kZXggPT09IDAgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGZpbHRlcnNbIDAgXS5maWx0ZXIgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSBsYXN0IGZpbHRlciBoYXMgYmVlbiByZW1vdmVkLCB0aGVcbiAgICAgICAgLy8gbmV3IGxhc3QgZmlsdGVyIG11c3QgYmUgY29ubmVjdGVkIHRvIHRoZSBvdXRwdXRcbiAgICAgICAgZWxzZSBpZiAoIGluZGV4ID09PSBmaWx0ZXJzLmxlbmd0aCApIHtcbiAgICAgICAgICAgIGZpbHRlcnNbIGZpbHRlcnMubGVuZ3RoIC0gMSBdLmZpbHRlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT3RoZXJ3aXNlLCB0aGUgaW5kZXggb2YgdGhlIGZpbHRlciB0aGF0J3MgYmVlblxuICAgICAgICAvLyByZW1vdmVkIGlzbid0IHRoZSBmaXJzdCwgbGFzdCwgb3Igb25seSBpbmRleCBpbiB0aGVcbiAgICAgICAgLy8gYXJyYXksIHNvIGNvbm5lY3QgdGhlIHByZXZpb3VzIGZpbHRlciB0byB0aGUgbmV3XG4gICAgICAgIC8vIG9uZSBhdCB0aGUgZ2l2ZW4gaW5kZXguXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZmlsdGVyc1sgaW5kZXggLSAxIF0uZmlsdGVyLmNvbm5lY3QoIGZpbHRlcnNbIGluZGV4IF0uZmlsdGVyICk7XG4gICAgICAgIH1cblxuICAgICAgICBGSUxURVJfU1RPUkUuc2V0KCB0aGlzLCBmaWx0ZXJzICk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmVtb3ZlQWxsRmlsdGVycygpIHtcbiAgICAgICAgdmFyIGZpbHRlcnMgPSBGSUxURVJfU1RPUkUuZ2V0KCB0aGlzICk7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSBmaWx0ZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVGaWx0ZXJBdEluZGV4KCBpICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUN1c3RvbUVRID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBDdXN0b21FUSggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQ3VzdG9tRVE7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIEFsbFBhc3NGaWx0ZXIgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIDIsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICBncmFwaC5scDI0ZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG5cbiAgICAgICAgZ3JhcGgubHAxMmRCLnR5cGUgPSAnYWxscGFzcyc7XG4gICAgICAgIGdyYXBoLmxwMjRkQi50eXBlID0gJ2FsbHBhc3MnO1xuICAgICAgICBncmFwaC5scDEyZEIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAyNGRCLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5RLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAyNGRCLlEudmFsdWUgPSAwO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuc2xvcGUgPSBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29udHJvbHMuaW5kZXg7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgubHAxMmRCLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5scDI0ZEIuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5scDEyZEIuUSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGgubHAyNGRCLlEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmxwMTJkQiApO1xuICAgICAgICBncmFwaC5scDEyZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5jb25uZWN0KCBncmFwaC5scDI0ZEIgKTtcbiAgICAgICAgZ3JhcGgubHAyNGRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMSApO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQWxsUGFzc0ZpbHRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgQWxsUGFzc0ZpbHRlciggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQWxsUGFzc0ZpbHRlcjsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgQlBGaWx0ZXIgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIDIsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICBncmFwaC5scDI0ZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG5cbiAgICAgICAgZ3JhcGgubHAxMmRCLnR5cGUgPSAnYmFuZHBhc3MnO1xuICAgICAgICBncmFwaC5scDI0ZEIudHlwZSA9ICdiYW5kcGFzcyc7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAxMmRCLlEudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuUS52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5zbG9wZSA9IGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb250cm9scy5pbmRleDtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5scDEyZEIuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmxwMjRkQi5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmxwMTJkQi5RICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5scDI0ZEIuUSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubHAxMmRCICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCLmNvbm5lY3QoIGdyYXBoLmxwMjRkQiApO1xuICAgICAgICBncmFwaC5scDI0ZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVCUEZpbHRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgQlBGaWx0ZXIoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEJQRmlsdGVyOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG52YXIgRklMVEVSX1RZUEVTID0gW1xuICAgICdsb3dwYXNzJyxcbiAgICAnYmFuZHBhc3MnLFxuICAgICdoaWdocGFzcycsXG4gICAgJ25vdGNoJyxcbiAgICAnbG93cGFzcydcbl07XG5cbmNsYXNzIEZpbHRlckJhbmsgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyMTJkQiA9IHRoaXMuaW8uY3JlYXRlQ3Jvc3NmYWRlciggRklMVEVSX1RZUEVTLmxlbmd0aCwgMCApO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyMjRkQiA9IHRoaXMuaW8uY3JlYXRlQ3Jvc3NmYWRlciggRklMVEVSX1RZUEVTLmxlbmd0aCwgMCApO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIDIsIDAgKTtcbiAgICAgICAgZ3JhcGguZmlsdGVyczEyZEIgPSBbXTtcbiAgICAgICAgZ3JhcGguZmlsdGVyczI0ZEIgPSBbXTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnNsb3BlID0gZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbnRyb2xzLmluZGV4O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZpbHRlclR5cGUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmlsdGVyVHlwZS5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyMTJkQi5jb250cm9scy5pbmRleCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZpbHRlclR5cGUuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlcjI0ZEIuY29udHJvbHMuaW5kZXggKTtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGZpcnN0IHNldCBvZiAxMmRiIGZpbHRlcnMgKHN0YW5kYXJkIGlzc3VlIHdpdGggV2ViQXVkaW9BUEkpXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IEZJTFRFUl9UWVBFUy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHZhciBmaWx0ZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG5cbiAgICAgICAgICAgIGZpbHRlci50eXBlID0gRklMVEVSX1RZUEVTWyBpIF07XG4gICAgICAgICAgICBmaWx0ZXIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgICAgIGZpbHRlci5RLnZhbHVlID0gMDtcblxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZmlsdGVyLmZyZXF1ZW5jeSApO1xuICAgICAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGZpbHRlci5RICk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGZpbHRlciApO1xuICAgICAgICAgICAgZmlsdGVyLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXIxMmRCLCAwLCBpICk7XG5cbiAgICAgICAgICAgIGdyYXBoLmZpbHRlcnMxMmRCLnB1c2goIGZpbHRlciApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBzZWNvbmQgc2V0IG9mIDEyZGIgZmlsdGVycyxcbiAgICAgICAgLy8gd2hlcmUgdGhlIGZpcnN0IHNldCB3aWxsIGJlIHBpcGVkIGludG8gc28gd2VcbiAgICAgICAgLy8gZW5kIHVwIHdpdGggZG91YmxlIHRoZSByb2xsb2ZmICgxMmRCICogMiA9IDI0ZEIpLlxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBGSUxURVJfVFlQRVMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuXG4gICAgICAgICAgICBmaWx0ZXIudHlwZSA9IEZJTFRFUl9UWVBFU1sgaSBdO1xuICAgICAgICAgICAgZmlsdGVyLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgICAgICBmaWx0ZXIuUS52YWx1ZSA9IDA7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBmaWx0ZXIgKTtcblxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZmlsdGVyLmZyZXF1ZW5jeSApO1xuICAgICAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGZpbHRlci5RICk7XG4gICAgICAgICAgICBncmFwaC5maWx0ZXJzMTJkQlsgaSBdLmNvbm5lY3QoIGZpbHRlciApO1xuICAgICAgICAgICAgZmlsdGVyLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXIyNGRCLCAwLCBpICk7XG5cbiAgICAgICAgICAgIGdyYXBoLmZpbHRlcnMyNGRCLnB1c2goIGZpbHRlciApO1xuICAgICAgICB9XG5cbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlcjEyZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIyNGRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMSApO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRmlsdGVyQmFuayA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRmlsdGVyQmFuayggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRmlsdGVyQmFuazsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgSFBGaWx0ZXIgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyU2xvcGUgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIDIsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICBncmFwaC5scDI0ZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG5cbiAgICAgICAgZ3JhcGgubHAxMmRCLnR5cGUgPSAnaGlnaHBhc3MnO1xuICAgICAgICBncmFwaC5scDI0ZEIudHlwZSA9ICdoaWdocGFzcyc7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAxMmRCLlEudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuUS52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5zbG9wZSA9IGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb250cm9scy5pbmRleDtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5scDEyZEIuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmxwMjRkQi5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmxwMTJkQi5RICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5scDI0ZEIuUSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubHAxMmRCICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCLmNvbm5lY3QoIGdyYXBoLmxwMjRkQiApO1xuICAgICAgICBncmFwaC5scDI0ZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVIUEZpbHRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSFBGaWx0ZXIoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEhQRmlsdGVyOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMUEZpbHRlciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSA9IHRoaXMuaW8uY3JlYXRlQ3Jvc3NmYWRlciggMiwgMCApO1xuICAgICAgICBncmFwaC5scDEyZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gICAgICAgIGdyYXBoLmxwMjRkQiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcblxuICAgICAgICBncmFwaC5scDEyZEIudHlwZSA9ICdsb3dwYXNzJztcbiAgICAgICAgZ3JhcGgubHAyNGRCLnR5cGUgPSAnbG93cGFzcyc7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGgubHAxMmRCLlEudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDI0ZEIuUS52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5zbG9wZSA9IGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb250cm9scy5pbmRleDtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBncmFwaC5scDEyZEIuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmxwMjRkQi5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmxwMTJkQi5RICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuUS5jb25uZWN0KCBncmFwaC5scDI0ZEIuUSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubHAxMmRCICk7XG4gICAgICAgIGdyYXBoLmxwMTJkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCLmNvbm5lY3QoIGdyYXBoLmxwMjRkQiApO1xuICAgICAgICBncmFwaC5scDI0ZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVMUEZpbHRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTFBGaWx0ZXIoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IExQRmlsdGVyOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBOb3RjaEZpbHRlciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSA9IHRoaXMuaW8uY3JlYXRlQ3Jvc3NmYWRlciggMiwgMCApO1xuICAgICAgICBncmFwaC5scDEyZEIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gICAgICAgIGdyYXBoLmxwMjRkQiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcblxuICAgICAgICBncmFwaC5scDEyZEIudHlwZSA9ICdub3RjaCc7XG4gICAgICAgIGdyYXBoLmxwMjRkQi50eXBlID0gJ25vdGNoJztcbiAgICAgICAgZ3JhcGgubHAxMmRCLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5scDEyZEIuUS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5RLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnNsb3BlID0gZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbnRyb2xzLmluZGV4O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmxwMTJkQi5mcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgubHAyNGRCLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZ3JhcGgubHAxMmRCLlEgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5RLmNvbm5lY3QoIGdyYXBoLmxwMjRkQi5RICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5scDEyZEIgKTtcbiAgICAgICAgZ3JhcGgubHAxMmRCLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5scDEyZEIuY29ubmVjdCggZ3JhcGgubHAyNGRCICk7XG4gICAgICAgIGdyYXBoLmxwMjRkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlclNsb3BlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5vdGNoRmlsdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBOb3RjaEZpbHRlciggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTm90Y2hGaWx0ZXI7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBEcnlXZXROb2RlIGZyb20gXCIuLi8uLi9ncmFwaHMvRHJ5V2V0Tm9kZS5lczZcIjtcblxuLy8gVE9ETzogQWRkIGZlZWRiYWNrTGV2ZWwgYW5kIGRlbGF5VGltZSBQYXJhbSBpbnN0YW5jZXNcbi8vIHRvIGNvbnRyb2wgdGhpcyBub2RlLlxuY2xhc3MgU2luZVNoYXBlciBleHRlbmRzIERyeVdldE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5kcml2ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLlNpbmUgKTtcbiAgICAgICAgdGhpcy5zaGFwZXJEcml2ZSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuc2hhcGVyRHJpdmUuZ2Fpbi52YWx1ZSA9IDE7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnNoYXBlckRyaXZlICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZHJpdmUuY29ubmVjdCggdGhpcy5zaGFwZXJEcml2ZS5nYWluICk7XG4gICAgICAgIHRoaXMuc2hhcGVyRHJpdmUuY29ubmVjdCggdGhpcy5zaGFwZXIgKTtcbiAgICAgICAgdGhpcy5zaGFwZXIuY29ubmVjdCggdGhpcy53ZXQgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNpbmVTaGFwZXIgPSBmdW5jdGlvbiggdGltZSwgZmVlZGJhY2tMZXZlbCApIHtcbiAgICByZXR1cm4gbmV3IFNpbmVTaGFwZXIoIHRoaXMsIHRpbWUsIGZlZWRiYWNrTGV2ZWwgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFNpbmVTaGFwZXI7IiwiLypcblx0R3JhcGggZm9yIHRoaXMgbm9kZSBpcyBzaG93biBpbiB0aGUgZm9sbG93aW5nIHBhcGVyOlxuXG5cdFx0QmVhdCBGcmVpIC0gRGlnaXRhbCBTb3VuZCBHZW5lcmF0aW9uIChBcHBlbmRpeCBDOiBNaXNjZWxsYW5lb3VzIOKAkyAxLiBEQyBUcmFwKVxuXHRcdElDU1QsIFp1cmljaCBVbmkgb2YgQXJ0cy5cblxuXHRBdmFpbGFibGUgaGVyZTpcblx0XHRodHRwczovL2NvdXJzZXMuY3Mud2FzaGluZ3Rvbi5lZHUvY291cnNlcy9jc2U0OTBzLzExYXUvUmVhZGluZ3MvRGlnaXRhbF9Tb3VuZF9HZW5lcmF0aW9uXzEucGRmXG5cblxuXG5cdEVzc2VudGlhbGx5LCBhIERDVHJhcCByZW1vdmVzIHRoZSBEQyBvZmZzZXQgb3IgREMgYmlhc1xuXHRmcm9tIHRoZSBpbmNvbWluZyBzaWduYWwsIHdoZXJlIGEgREMgb2Zmc2V0IGlzIGVsZW1lbnRzXG5cdG9mIHRoZSBzaWduYWwgdGhhdCBhcmUgYXQgMEh6LlxuXG5cdFRoZSBncmFwaCBpcyBhcyBmb2xsb3dzOlxuXG5cdFx0ICAgfC0tLTwtLS08fCAgIGlucHV0XG5cdFx0ICAgfFx0XHR8XHQgIHxcblx0XHQgICAtPiB6LTEgLT4gLT4gbmVnYXRlIC0+IC0+IG91dFxuXHRcdCAgIHxcdFx0XHRcdFx0IHxcblx0XHQgICB8PC0tLS0tLS0tLS0tLS0tICphIDwtfFxuXG5cblx0VGhlIGEsIG9yIGFscGhhLCB2YWx1ZSBpcyBjYWxjdWxhdGVkIGlzIGFzIGZvbGxvd3M6XG5cdFx0YGEgPSAyUElmZyAvIGZzYFxuXG5cdFdoZXJlIGBmZ2AgZGV0ZXJtaW5lcyB0aGUgJ3NwZWVkJyBvZiB0aGUgdHJhcCAodGhlICdjdXRvZmYnKSxcblx0YW5kIGBmc2AgaXMgdGhlIHNhbXBsZSByYXRlLiBUaGlzIGNhbiBiZSBleHBhbmRlZCBpbnRvIHRoZVxuXHRmb2xsb3dpbmcgdG8gYXZvaWQgYSBtb3JlIGV4cGVuc2l2ZSBkaXZpc2lvbiAoYXMgdGhlIHJlY2lwcm9jYWxcblx0b2YgdGhlIHNhbXBsZSByYXRlIGNhbiBiZSBjYWxjdWxhdGVkIGJlZm9yZWhhbmQpOlxuXHRcdGBhID0gKDIgKiBQSSAqIGZnKSAqICgxIC8gZnMpYFxuXG5cblx0R2l2ZW4gYW4gYGZnYCBvZiA1LCBhbmQgc2FtcGxlIHJhdGUgb2YgNDgwMDAsIHdlIGdldDpcblx0XHRgYSA9IDIgKiBQSSAqIDUgKiAoMSAvIDQ4MDAwKWBcblx0XHRgYSA9IDYuMjgzMSAqIDUgKiAyLjA4MzMzZS0wNWBcblx0XHRgYSA9IDMxLjQxNTUgKiAyLjA4MzMzZS0wNWBcblx0XHRgYSA9IDAuMDAwNjU0NDg4NTM2MTVgLlxuICovXG5cbmltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIERDVHJhcCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgY3V0b2ZmID0gNSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgY3V0b2ZmLCBvciBgZmdgIGNvbnN0YW50LlxuICAgICAgICAvLyBUaGVyZSB3aWxsIHJhcmVseSBiZSBhIG5lZWQgdG8gY2hhbmdlIHRoaXMgdmFsdWUgZnJvbVxuICAgICAgICAvLyBlaXRoZXIgdGhlIGdpdmVuIG9uZSwgb3IgaXQncyBkZWZhdWx0IG9mIDUsXG4gICAgICAgIC8vIHNvIEknbSBub3QgbWFraW5nIHRoaXMgaW50byBhIGNvbnRyb2wuXG4gICAgICAgIGdyYXBoLmN1dG9mZiA9IHRoaXMuaW8uY3JlYXRlQ29uc3RhbnQoIGN1dG9mZiApO1xuXG4gICAgICAgIC8vIEFscGhhIGNhbGN1bGF0aW9uXG4gICAgICAgIGdyYXBoLlBJMiA9IHRoaXMuaW8uY3JlYXRlQ29uc3RhbnRQSTIoKTtcbiAgICAgICAgZ3JhcGguY3V0b2ZmTXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLmFscGhhID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggMSAvIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlICk7XG4gICAgICAgIGdyYXBoLlBJMi5jb25uZWN0KCBncmFwaC5jdXRvZmZNdWx0aXBseSwgMCwgMCApO1xuICAgICAgICBncmFwaC5jdXRvZmYuY29ubmVjdCggZ3JhcGguY3V0b2ZmTXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguY3V0b2ZmTXVsdGlwbHkuY29ubmVjdCggZ3JhcGguYWxwaGEsIDAsIDAgKTtcblxuICAgICAgICAvLyBNYWluIGdyYXBoXG4gICAgICAgIGdyYXBoLm5lZ2F0ZSA9IHRoaXMuaW8uY3JlYXRlTmVnYXRlKCk7XG4gICAgICAgIGdyYXBoLnpNaW51c09uZSA9IHRoaXMuaW8uY3JlYXRlU2FtcGxlRGVsYXkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBtYWluIGdyYXBoIGFuZCBhbHBoYS5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5uZWdhdGUgKTtcbiAgICAgICAgZ3JhcGgubmVnYXRlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFscGhhLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAxICk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5LmNvbm5lY3QoIGdyYXBoLnpNaW51c09uZSApO1xuICAgICAgICBncmFwaC56TWludXNPbmUuY29ubmVjdCggZ3JhcGguek1pbnVzT25lICk7XG4gICAgICAgIGdyYXBoLnpNaW51c09uZS5jb25uZWN0KCBncmFwaC5uZWdhdGUgKTtcbiAgICAgICAgZ3JhcGgubmVnYXRlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZURDVHJhcCA9IGZ1bmN0aW9uKCBjdXRvZmYgKSB7XG4gICAgcmV0dXJuIG5ldyBEQ1RyYXAoIHRoaXMsIGN1dG9mZiApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMRk8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGN1dG9mZiA9IDUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICAvLyBDcmVhdGUgbm9kZXMuXG4gICAgICAgIGdyYXBoLm9zY2lsbGF0b3IgPSB0aGlzLmlvLmNyZWF0ZU9zY2lsbGF0b3JCYW5rKCk7XG4gICAgICAgIGdyYXBoLnBoYXNlT2Zmc2V0ID0gdGhpcy5pby5jcmVhdGVQaGFzZU9mZnNldCgpO1xuICAgICAgICBncmFwaC5kZXB0aCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmppdHRlckRlcHRoID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgLy8gZ3JhcGguaml0dGVyT3NjaWxsYXRvciA9IHRoaXMuaW8uY3JlYXRlV2hpdGVOb2lzZU9zY2lsbGF0b3IoKTtcblxuICAgICAgICAvLyBaZXJvLW91dCB0aGUgZGVwdGggZ2FpbiBub2RlcyBzbyB0aGUgdmFsdWUgXG4gICAgICAgIC8vIG9mIHRoZSBkZXB0aCBjb250cm9scyBhcmVuJ3QgbXVsdGlwbGllZC5cbiAgICAgICAgZ3JhcGguZGVwdGguZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLmppdHRlckRlcHRoLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIC8vIENyZWF0ZSBjb250cm9sc1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IGdyYXBoLm9zY2lsbGF0b3IuY29udHJvbHMuZnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRldHVuZSA9IGdyYXBoLm9zY2lsbGF0b3IuY29udHJvbHMuZGV0dW5lO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLndhdmVmb3JtID0gZ3JhcGgub3NjaWxsYXRvci5jb250cm9scy53YXZlZm9ybTtcbiAgICAgICAgdGhpcy5jb250cm9scy5kZXB0aCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5vZmZzZXQgPSBncmFwaC5waGFzZU9mZnNldC5jb250cm9scy5waGFzZTtcbiAgICAgICAgdGhpcy5jb250cm9scy5qaXR0ZXIgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICAgICAgLy8gQ29udHJvbCBjb25uZWN0aW9ucy5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGgucGhhc2VPZmZzZXQuY29udHJvbHMuZnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZGVwdGguY29ubmVjdCggZ3JhcGguZGVwdGguZ2FpbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmppdHRlci5jb25uZWN0KCBncmFwaC5qaXR0ZXJEZXB0aC5nYWluICk7XG5cbiAgICAgICAgLy8gTWFpbiBMRk8gb3NjIGNvbm5lY3Rpb25zXG4gICAgICAgIGdyYXBoLm9zY2lsbGF0b3IuY29ubmVjdCggZ3JhcGgucGhhc2VPZmZzZXQgKTtcbiAgICAgICAgZ3JhcGgucGhhc2VPZmZzZXQuY29ubmVjdCggZ3JhcGguZGVwdGggKTtcbiAgICAgICAgZ3JhcGguZGVwdGguY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBKaXR0ZXIgY29ubmVjdGlvbnNcbiAgICAgICAgLy8gZ3JhcGguaml0dGVyT3NjaWxsYXRvci5jb25uZWN0KCBncmFwaC5qaXR0ZXJEZXB0aCApO1xuICAgICAgICAvLyBncmFwaC5qaXR0ZXJEZXB0aC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBzdGFydCggZGVsYXkgPSAwICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkub3NjaWxsYXRvci5zdGFydCggZGVsYXkgKTtcbiAgICB9XG4gICAgc3RvcCggZGVsYXkgPSAwICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkub3NjaWxsYXRvci5zdG9wKCBkZWxheSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTEZPID0gZnVuY3Rpb24oIGN1dG9mZiApIHtcbiAgICByZXR1cm4gbmV3IExGTyggdGhpcywgY3V0b2ZmICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbi8vIEJhc2VkIG9uIHRoZSBmb2xsb3dpbmcgZm9ybXVsYSBmcm9tIE1pY2hhZWwgR3J1aG46XG4vLyAgLSBodHRwOi8vbXVzaWNkc3Aub3JnL3Nob3dBcmNoaXZlQ29tbWVudC5waHA/QXJjaGl2ZUlEPTI1NVxuLy9cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy9cbi8vIENhbGN1bGF0ZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXgncyBjb2VmZmljaWVudHNcbi8vIGNvc19jb2VmID0gY29zKGFuZ2xlKTtcbi8vIHNpbl9jb2VmID0gc2luKGFuZ2xlKTtcbi8vXG4vLyBEbyB0aGlzIHBlciBzYW1wbGVcbi8vIG91dF9sZWZ0ID0gaW5fbGVmdCAqIGNvc19jb2VmIC0gaW5fcmlnaHQgKiBzaW5fY29lZjtcbi8vIG91dF9yaWdodCA9IGluX2xlZnQgKiBzaW5fY29lZiArIGluX3JpZ2h0ICogY29zX2NvZWY7XG4vLyBcbi8vIFJvdGF0aW9uIGlzIGluIHJhZGlhbnMuXG5jbGFzcyBTdGVyZW9Sb3RhdGlvbiBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgcm90YXRpb24gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnJvdGF0aW9uID0gdGhpcy5pby5jcmVhdGVQYXJhbSggcm90YXRpb24gKTtcblxuICAgICAgICBncmFwaC5zcGxpdHRlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoIDIgKTtcbiAgICAgICAgZ3JhcGguY29zID0gdGhpcy5pby5jcmVhdGVDb3MoKTtcbiAgICAgICAgZ3JhcGguc2luID0gdGhpcy5pby5jcmVhdGVTaW4oKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnJvdGF0aW9uLmNvbm5lY3QoIGdyYXBoLmNvcyApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnJvdGF0aW9uLmNvbm5lY3QoIGdyYXBoLnNpbiApO1xuXG4gICAgICAgIGdyYXBoLmxlZnRNdWx0aXBseUNvcyA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubGVmdE11bHRpcGx5U2luID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5yaWdodE11bHRpcGx5Q29zID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5yaWdodE11bHRpcGx5U2luID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5sZWZ0Q29zTWludXNSaWdodFNpbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgZ3JhcGgubGVmdFNpbkFkZFJpZ2h0Q29zID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcblxuXG5cbiAgICAgICAgZ3JhcGguaW5wdXRMZWZ0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguaW5wdXRSaWdodCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm1lcmdlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsTWVyZ2VyKCAyICk7XG5cbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIuY29ubmVjdCggZ3JhcGguaW5wdXRMZWZ0LCAwICk7XG4gICAgICAgIGdyYXBoLnNwbGl0dGVyLmNvbm5lY3QoIGdyYXBoLmlucHV0UmlnaHQsIDEgKTtcblxuICAgICAgICBncmFwaC5pbnB1dExlZnQuY29ubmVjdCggZ3JhcGgubGVmdE11bHRpcGx5Q29zLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmNvcy5jb25uZWN0KCBncmFwaC5sZWZ0TXVsdGlwbHlDb3MsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguaW5wdXRMZWZ0LmNvbm5lY3QoIGdyYXBoLmxlZnRNdWx0aXBseVNpbiwgMCwgMCApO1xuICAgICAgICBncmFwaC5zaW4uY29ubmVjdCggZ3JhcGgubGVmdE11bHRpcGx5U2luLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGguaW5wdXRSaWdodC5jb25uZWN0KCBncmFwaC5yaWdodE11bHRpcGx5U2luLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLnNpbi5jb25uZWN0KCBncmFwaC5yaWdodE11bHRpcGx5U2luLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmlucHV0UmlnaHQuY29ubmVjdCggZ3JhcGgucmlnaHRNdWx0aXBseUNvcywgMCwgMCApO1xuICAgICAgICBncmFwaC5jb3MuY29ubmVjdCggZ3JhcGgucmlnaHRNdWx0aXBseUNvcywgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLmxlZnRNdWx0aXBseUNvcy5jb25uZWN0KCBncmFwaC5sZWZ0Q29zTWludXNSaWdodFNpbiwgMCwgMCApO1xuICAgICAgICBncmFwaC5yaWdodE11bHRpcGx5U2luLmNvbm5lY3QoIGdyYXBoLmxlZnRDb3NNaW51c1JpZ2h0U2luLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmxlZnRNdWx0aXBseVNpbi5jb25uZWN0KCBncmFwaC5sZWZ0U2luQWRkUmlnaHRDb3MsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgucmlnaHRNdWx0aXBseUNvcy5jb25uZWN0KCBncmFwaC5sZWZ0U2luQWRkUmlnaHRDb3MsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5sZWZ0Q29zTWludXNSaWdodFNpbi5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubGVmdFNpbkFkZFJpZ2h0Q29zLmNvbm5lY3QoIGdyYXBoLm1lcmdlciwgMCwgMSApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zcGxpdHRlciApO1xuICAgICAgICBncmFwaC5tZXJnZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLm5hbWVkSW5wdXRzLmxlZnQgPSBncmFwaC5pbnB1dExlZnQ7XG4gICAgICAgIHRoaXMubmFtZWRJbnB1dHMucmlnaHQgPSBncmFwaC5pbnB1dFJpZ2h0O1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTdGVyZW9Sb3RhdGlvbiA9IGZ1bmN0aW9uKCByb3RhdGlvbiApIHtcbiAgICByZXR1cm4gbmV3IFN0ZXJlb1JvdGF0aW9uKCB0aGlzLCByb3RhdGlvbiApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vLyBCYXNlZCBvbiB0aGUgZm9sbG93aW5nIGZvcm11bGEgZnJvbSBNaWNoYWVsIEdydWhuOlxuLy8gIC0gaHR0cDovL211c2ljZHNwLm9yZy9zaG93QXJjaGl2ZUNvbW1lbnQucGhwP0FyY2hpdmVJRD0yNTZcbi8vXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vXG4vLyBUaGUgZ3JhcGggdGhhdCdzIGNyZWF0ZWQgaXMgYXMgZm9sbG93czpcbi8vXG4vLyAgICAgICAgICAgICAgICAgICB8LT4gTCAtPiBsZWZ0QWRkUmlnaHQoIGNoMCApIC0+IHxcbi8vICAgICAgICAgICAgICAgICAgIHwtPiBSIC0+IGxlZnRBZGRSaWdodCggY2gxICkgLT4gfCAtPiBtdWx0aXBseSggMC41ICkgLS0tLS0tPiBtb25vTWludXNTdGVyZW8oIDAgKSAtPiBtZXJnZXIoIDAgKSAvLyBvdXRMXG4vLyBpbnB1dCAtPiBzcGxpdHRlciAtICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8LS0tLS0+IG1vbm9QbHVzU3RlcmVvKCAwICkgLS0+IG1lcmdlciggMSApIC8vIG91dFJcbi8vICAgICAgICAgICAgICAgICAgIHwtPiBMIC0+IHJpZ2h0TWludXNMZWZ0KCBjaDEgKSAtPiB8XG4vLyAgICAgICAgICAgICAgICAgICB8LT4gUiAtPiByaWdodE1pbnVzTGVmdCggY2gwICkgLT4gfCAtPiBtdWx0aXBseSggY29lZiApIC0tLT4gbW9ub01pbnVzU3RlcmVvKCAxICkgLT4gbWVyZ2VyKCAwICkgLy8gb3V0TFxuLy9cbi8vXG5jbGFzcyBTdGVyZW9XaWR0aCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgd2lkdGggKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5zcGxpdHRlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoIDIgKTtcbiAgICAgICAgZ3JhcGguY29lZmZpY2llbnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB3aWR0aCApO1xuICAgICAgICBncmFwaC5jb2VmZmljaWVudEhhbGYgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAwLjUgKTtcbiAgICAgICAgZ3JhcGguaW5wdXRMZWZ0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguaW5wdXRSaWdodCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmxlZnRBZGRSaWdodCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLnJpZ2h0TWludXNMZWZ0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseVBvaW50Rml2ZSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIDAuNSApO1xuICAgICAgICBncmFwaC5tdWx0aXBseUNvZWZmaWNpZW50ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tb25vTWludXNTdGVyZW8gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIGdyYXBoLm1vbm9QbHVzU3RlcmVvID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgZ3JhcGgubWVyZ2VyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxNZXJnZXIoIDIgKTtcblxuICAgICAgICBncmFwaC5jb2VmZmljaWVudC5jb25uZWN0KCBncmFwaC5jb2VmZmljaWVudEhhbGYgKTtcbiAgICAgICAgZ3JhcGguY29lZmZpY2llbnRIYWxmLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5Q29lZmZpY2llbnQsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5zcGxpdHRlci5jb25uZWN0KCBncmFwaC5pbnB1dExlZnQsIDAgKTtcbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIuY29ubmVjdCggZ3JhcGguaW5wdXRSaWdodCwgMSApO1xuICAgICAgICBncmFwaC5pbnB1dExlZnQuY29ubmVjdCggZ3JhcGgubGVmdEFkZFJpZ2h0LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmlucHV0UmlnaHQuY29ubmVjdCggZ3JhcGgubGVmdEFkZFJpZ2h0LCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmlucHV0TGVmdC5jb25uZWN0KCBncmFwaC5yaWdodE1pbnVzTGVmdCwgMCwgMSApO1xuICAgICAgICBncmFwaC5pbnB1dFJpZ2h0LmNvbm5lY3QoIGdyYXBoLnJpZ2h0TWludXNMZWZ0LCAwLCAwICk7XG5cbiAgICAgICAgZ3JhcGgubGVmdEFkZFJpZ2h0LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5UG9pbnRGaXZlICk7XG4gICAgICAgIGdyYXBoLnJpZ2h0TWludXNMZWZ0LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5Q29lZmZpY2llbnQsIDAsIDAgKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseVBvaW50Rml2ZS5jb25uZWN0KCBncmFwaC5tb25vTWludXNTdGVyZW8sIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHlDb2VmZmljaWVudC5jb25uZWN0KCBncmFwaC5tb25vTWludXNTdGVyZW8sIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseVBvaW50Rml2ZS5jb25uZWN0KCBncmFwaC5tb25vUGx1c1N0ZXJlbywgMCwgMCApO1xuICAgICAgICBncmFwaC5tdWx0aXBseUNvZWZmaWNpZW50LmNvbm5lY3QoIGdyYXBoLm1vbm9QbHVzU3RlcmVvLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGgubW9ub01pbnVzU3RlcmVvLmNvbm5lY3QoIGdyYXBoLm1lcmdlciwgMCwgMCApO1xuICAgICAgICBncmFwaC5tb25vUGx1c1N0ZXJlby5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNwbGl0dGVyICk7XG4gICAgICAgIGdyYXBoLm1lcmdlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMubmFtZWRJbnB1dHMubGVmdCA9IGdyYXBoLmlucHV0TGVmdDtcbiAgICAgICAgdGhpcy5uYW1lZElucHV0cy5yaWdodCA9IGdyYXBoLmlucHV0UmlnaHQ7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy53aWR0aCA9IGdyYXBoLmNvZWZmaWNpZW50O1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTdGVyZW9XaWR0aCA9IGZ1bmN0aW9uKCB3aWR0aCApIHtcbiAgICByZXR1cm4gbmV3IFN0ZXJlb1dpZHRoKCB0aGlzLCB3aWR0aCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5cbmNsYXNzIE9zY2lsbGF0b3JHZW5lcmF0b3Ige1xuICAgIGNvbnN0cnVjdG9yKCBpbywgZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmVmb3JtICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLmZyZXF1ZW5jeSA9IGZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5kZXR1bmUgPSBkZXR1bmU7XG4gICAgICAgIHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eTtcbiAgICAgICAgdGhpcy5nbGlkZVRpbWUgPSBnbGlkZVRpbWU7XG4gICAgICAgIHRoaXMud2F2ZSA9IHdhdmVmb3JtIHx8ICdzaW5lJztcbiAgICAgICAgdGhpcy5yZXNldFRpbWVzdGFtcCA9IDAuMDtcblxuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IHRoaXMuY29udGV4dC5jcmVhdGVPc2NpbGxhdG9yKCksXG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaCA9IHRoaXMuX21ha2VWZWxvY2l0eUdyYXBoKCB2ZWxvY2l0eSApO1xuICAgICAgICB0aGlzLm91dHB1dHMgPSBbIHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCkgXTtcbiAgICAgICAgdGhpcy5yZXNldCggdGhpcy5mcmVxdWVuY3ksIHRoaXMuZGV0dW5lLCB0aGlzLnZlbG9jaXR5LCB0aGlzLmdsaWRlVGltZSwgdGhpcy53YXZlICk7XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IuY29ubmVjdCggdGhpcy52ZWxvY2l0eUdyYXBoICk7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIF9tYWtlVmVsb2NpdHlHcmFwaCgpIHtcbiAgICAgICAgdmFyIGdhaW4gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICByZXR1cm4gZ2FpbjtcbiAgICB9XG5cbiAgICBfcmVzZXRWZWxvY2l0eUdyYXBoKCB2ZWxvY2l0eSApIHtcbiAgICAgICAgdGhpcy52ZWxvY2l0eUdyYXBoLmdhaW4udmFsdWUgPSB2ZWxvY2l0eTtcbiAgICB9XG5cbiAgICBfY2xlYW5VcFZlbG9jaXR5R3JhcGgoKSB7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaC5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eUdyYXBoID0gbnVsbDtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0gPSBudWxsO1xuICAgICAgICB0aGlzLm91dHB1dHMgPSBudWxsO1xuICAgIH1cblxuICAgIGxlcnAoIHN0YXJ0LCBlbmQsIGRlbHRhICkge1xuICAgICAgICByZXR1cm4gc3RhcnQgKyAoICggZW5kIC0gc3RhcnQgKSAqIGRlbHRhICk7XG4gICAgfVxuXG4gICAgcmVzZXQoIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlICkge1xuICAgICAgICB2YXIgbm93ID0gdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgIGZyZXF1ZW5jeSA9IHR5cGVvZiBmcmVxdWVuY3kgPT09ICdudW1iZXInID8gZnJlcXVlbmN5IDogdGhpcy5mcmVxdWVuY3k7XG4gICAgICAgIGRldHVuZSA9IHR5cGVvZiBkZXR1bmUgPT09ICdudW1iZXInID8gZGV0dW5lIDogdGhpcy5kZXR1bmU7XG4gICAgICAgIHZlbG9jaXR5ID0gdHlwZW9mIHZlbG9jaXR5ID09PSAnbnVtYmVyJyA/IHZlbG9jaXR5IDogdGhpcy52ZWxvY2l0eTtcbiAgICAgICAgd2F2ZSA9IHR5cGVvZiB3YXZlID09PSAnbnVtYmVyJyA/IHdhdmUgOiB0aGlzLndhdmU7XG5cbiAgICAgICAgdmFyIGdsaWRlVGltZSA9IHR5cGVvZiBnbGlkZVRpbWUgPT09ICdudW1iZXInID8gZ2xpZGVUaW1lIDogMDtcblxuICAgICAgICB0aGlzLl9yZXNldFZlbG9jaXR5R3JhcGgoIHZlbG9jaXR5ICk7XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IuZnJlcXVlbmN5LmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggbm93ICk7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLmRldHVuZS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIG5vdyApO1xuXG4gICAgICAgIC8vIG5vdyArPSAwLjFcblxuICAgICAgICAvLyBpZiAoIHRoaXMuZ2xpZGVUaW1lICE9PSAwLjAgKSB7XG4gICAgICAgIC8vICAgICB2YXIgc3RhcnRGcmVxID0gdGhpcy5mcmVxdWVuY3ksXG4gICAgICAgIC8vICAgICAgICAgZW5kRnJlcSA9IGZyZXF1ZW5jeSxcbiAgICAgICAgLy8gICAgICAgICBmcmVxRGlmZiA9IGVuZEZyZXEgLSBzdGFydEZyZXEsXG4gICAgICAgIC8vICAgICAgICAgc3RhcnRUaW1lID0gdGhpcy5yZXNldFRpbWVzdGFtcCxcbiAgICAgICAgLy8gICAgICAgICBlbmRUaW1lID0gdGhpcy5yZXNldFRpbWVzdGFtcCArIHRoaXMuZ2xpZGVUaW1lLFxuICAgICAgICAvLyAgICAgICAgIGN1cnJlbnRUaW1lID0gbm93IC0gc3RhcnRUaW1lLFxuICAgICAgICAvLyAgICAgICAgIGxlcnBQb3MgPSBjdXJyZW50VGltZSAvIHRoaXMuZ2xpZGVUaW1lLFxuICAgICAgICAvLyAgICAgICAgIGN1cnJlbnRGcmVxID0gdGhpcy5sZXJwKCB0aGlzLmZyZXF1ZW5jeSwgZnJlcXVlbmN5LCBsZXJwUG9zICk7XG5cbiAgICAgICAgLy8gICAgIGlmICggY3VycmVudFRpbWUgPCBnbGlkZVRpbWUgKSB7XG4gICAgICAgIC8vICAgICAgICAgY29uc29sZS5sb2coICdjdXRvZmYnLCBzdGFydEZyZXEsIGN1cnJlbnRGcmVxICk7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZnJlcXVlbmN5LnNldFZhbHVlQXRUaW1lKCBjdXJyZW50RnJlcSwgbm93ICk7XG4gICAgICAgIC8vICAgICB9XG5cblxuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coIHN0YXJ0VGltZSwgZW5kVGltZSwgbm93LCBjdXJyZW50VGltZSApO1xuICAgICAgICAvLyB9XG5cblxuICAgICAgICAvLyBub3cgKz0gMC41O1xuXG4gICAgICAgIGlmICggZ2xpZGVUaW1lICE9PSAwICkge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKCBmcmVxdWVuY3ksIG5vdyArIGdsaWRlVGltZSApO1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZGV0dW5lLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKCBkZXR1bmUsIG5vdyArIGdsaWRlVGltZSApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZnJlcXVlbmN5LnNldFZhbHVlQXRUaW1lKCBmcmVxdWVuY3ksIG5vdyApO1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZGV0dW5lLnNldFZhbHVlQXRUaW1lKCBkZXR1bmUsIG5vdyApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCB0eXBlb2Ygd2F2ZSA9PT0gJ3N0cmluZycgKSB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRvci50eXBlID0gd2F2ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLnR5cGUgPSB0aGlzLndhdmU7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlc2V0VGltZXN0YW1wID0gbm93O1xuICAgICAgICB0aGlzLmdsaWRlVGltZSA9IGdsaWRlVGltZTtcbiAgICAgICAgdGhpcy5mcmVxdWVuY3kgPSBmcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuZGV0dW5lID0gZGV0dW5lO1xuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgICAgIHRoaXMud2F2ZSA9IHdhdmU7XG4gICAgfVxuXG4gICAgc3RhcnQoIGRlbGF5ICkge1xuICAgICAgICB0aGlzLmdlbmVyYXRvci5zdGFydCggZGVsYXkgKTtcbiAgICB9XG5cbiAgICBzdG9wKCBkZWxheSApIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3Iuc3RvcCggZGVsYXkgKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLmdlbmVyYXRvci5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9jbGVhblVwVmVsb2NpdHlHcmFwaCgpO1xuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggT3NjaWxsYXRvckdlbmVyYXRvci5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlT3NjaWxsYXRvckdlbmVyYXRvciA9IGZ1bmN0aW9uKCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZSApIHtcbiAgICByZXR1cm4gbmV3IE9zY2lsbGF0b3JHZW5lcmF0b3IoIHRoaXMsIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIFRPRE86XG4vLyAgLSBUdXJuIGFyZ3VtZW50cyBpbnRvIGNvbnRyb2xsYWJsZSBwYXJhbWV0ZXJzO1xuY2xhc3MgQ291bnRlciBleHRlbmRzIE5vZGUge1xuXG4gICAgY29uc3RydWN0b3IoIGlvLCBpbmNyZW1lbnQsIGxpbWl0LCBzdGVwVGltZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5zdGVwVGltZSA9IHN0ZXBUaW1lIHx8IDEgLyB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZTtcblxuICAgICAgICB0aGlzLmNvbnN0YW50ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaW5jcmVtZW50ICk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG5cbiAgICAgICAgdGhpcy5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICB0aGlzLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IHRoaXMuc3RlcFRpbWU7XG5cbiAgICAgICAgdGhpcy5mZWVkYmFjayA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suY29ubmVjdCggdGhpcy5kZWxheSApO1xuXG4gICAgICAgIHRoaXMubXVsdGlwbHkuY29ubmVjdCggdGhpcy5kZWxheSApO1xuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMuZmVlZGJhY2sgKTtcbiAgICAgICAgdGhpcy5mZWVkYmFjay5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG5cbiAgICAgICAgdGhpcy5sZXNzVGhhbiA9IHRoaXMuaW8uY3JlYXRlTGVzc1RoYW4oIGxpbWl0ICk7XG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5sZXNzVGhhbiApO1xuICAgICAgICAvLyB0aGlzLmxlc3NUaGFuLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2suZ2FpbiApO1xuICAgICAgICB0aGlzLmNvbnN0YW50LmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5sZXNzVGhhbi5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgfVxuXG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICB0aGlzLnN0b3AoKTtcblxuICAgICAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuc3RhcnQoKTtcbiAgICAgICAgfSwgMTYgKTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgaWYoIHRoaXMucnVubmluZyA9PT0gZmFsc2UgKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSB0aGlzLnN0ZXBUaW1lO1xuICAgICAgICAgICAgdGhpcy5sZXNzVGhhbi5jb25uZWN0KCB0aGlzLmZlZWRiYWNrLmdhaW4gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0b3AoKSB7XG4gICAgICAgIGlmKCB0aGlzLnJ1bm5pbmcgPT09IHRydWUgKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMubGVzc1RoYW4uZGlzY29ubmVjdCggdGhpcy5mZWVkYmFjay5nYWluICk7XG4gICAgICAgICAgICB0aGlzLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ291bnRlciA9IGZ1bmN0aW9uKCBpbmNyZW1lbnQsIGxpbWl0LCBzdGVwVGltZSApIHtcbiAgICByZXR1cm4gbmV3IENvdW50ZXIoIHRoaXMsIGluY3JlbWVudCwgbGltaXQsIHN0ZXBUaW1lICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIENyb3NzZmFkZXIgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIG51bUNhc2VzID0gMiwgc3RhcnRpbmdDYXNlID0gMCApIHtcblxuICAgICAgICAvLyBFbnN1cmUgc3RhcnRpbmdDYXNlIGlzIG5ldmVyIDwgMFxuICAgICAgICAvLyBhbmQgbnVtYmVyIG9mIGlucHV0cyBpcyBhbHdheXMgPj0gMiAobm8gcG9pbnRcbiAgICAgICAgLy8geC1mYWRpbmcgYmV0d2VlbiBsZXNzIHRoYW4gdHdvIGlucHV0cyEpXG4gICAgICAgIHN0YXJ0aW5nQ2FzZSA9IE1hdGguYWJzKCBzdGFydGluZ0Nhc2UgKTtcbiAgICAgICAgbnVtQ2FzZXMgPSBNYXRoLm1heCggbnVtQ2FzZXMsIDIgKTtcblxuICAgICAgICBzdXBlciggaW8sIG51bUNhc2VzLCAxICk7XG5cbiAgICAgICAgdGhpcy5jbGFtcHMgPSBbXTtcbiAgICAgICAgdGhpcy5zdWJ0cmFjdHMgPSBbXTtcbiAgICAgICAgdGhpcy54ZmFkZXJzID0gW107XG4gICAgICAgIHRoaXMuY29udHJvbHMuaW5kZXggPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBudW1DYXNlcyAtIDE7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMueGZhZGVyc1sgaSBdID0gdGhpcy5pby5jcmVhdGVEcnlXZXROb2RlKCk7XG4gICAgICAgICAgICB0aGlzLnN1YnRyYWN0c1sgaSBdID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCggaSk7XG4gICAgICAgICAgICB0aGlzLmNsYW1wc1sgaSBdID0gdGhpcy5pby5jcmVhdGVDbGFtcCggMCwgMSApO1xuXG4gICAgICAgICAgICBpZiggaSA9PT0gMCApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0c1sgaSBdLmNvbm5lY3QoIHRoaXMueGZhZGVyc1sgaSBdLmRyeSApO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpICsgMSBdLmNvbm5lY3QoIHRoaXMueGZhZGVyc1sgaSBdLndldCApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy54ZmFkZXJzWyBpIC0gMSBdLmNvbm5lY3QoIHRoaXMueGZhZGVyc1sgaSBdLmRyeSApO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpICsgMSBdLmNvbm5lY3QoIHRoaXMueGZhZGVyc1sgaSBdLndldCApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4LmNvbm5lY3QoIHRoaXMuc3VidHJhY3RzWyBpIF0gKTtcbiAgICAgICAgICAgIHRoaXMuc3VidHJhY3RzWyBpIF0uY29ubmVjdCggdGhpcy5jbGFtcHNbIGkgXSApO1xuICAgICAgICAgICAgdGhpcy5jbGFtcHNbIGkgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS5jb250cm9scy5kcnlXZXQgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMueGZhZGVyc1sgdGhpcy54ZmFkZXJzLmxlbmd0aCAtIDEgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNyb3NzZmFkZXIgPSBmdW5jdGlvbiggbnVtQ2FzZXMsIHN0YXJ0aW5nQ2FzZSApIHtcbiAgICByZXR1cm4gbmV3IENyb3NzZmFkZXIoIHRoaXMsIG51bUNhc2VzLCBzdGFydGluZ0Nhc2UgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IENyb3NzZmFkZXI7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBjb25uZWN0aW9ucyBmcm9tIFwiLi4vbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNlwiO1xuaW1wb3J0IGNsZWFuZXJzIGZyb20gXCIuLi9taXhpbnMvY2xlYW5lcnMuZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbi8vIFRoaXMgZnVuY3Rpb24gY3JlYXRlcyBhIGdyYXBoIHRoYXQgYWxsb3dzIG1vcnBoaW5nXG4vLyBiZXR3ZWVuIHR3byBnYWluIG5vZGVzLlxuLy9cbi8vIEl0IGxvb2tzIGEgbGl0dGxlIGJpdCBsaWtlIHRoaXM6XG4vL1xuLy8gICAgICAgICAgICAgICAgIGRyeSAtPiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0+IHxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ICBHYWluKDAtMSkgICAgLT4gICAgIEdhaW4oLTEpICAgICAtPiAgICAgb3V0cHV0XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZmFkZXIpICAgICAgICAgKGludmVydCBwaGFzZSkgICAgICAgIChzdW1taW5nKVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgXlxuLy8gICAgd2V0IC0+ICAgR2FpbigtMSkgICAtPiAtfFxuLy8gICAgICAgICAgKGludmVydCBwaGFzZSlcbi8vXG4vLyBXaGVuIGFkanVzdGluZyB0aGUgZmFkZXIncyBnYWluIHZhbHVlIGluIHRoaXMgZ3JhcGgsXG4vLyBpbnB1dDEncyBnYWluIGxldmVsIHdpbGwgY2hhbmdlIGZyb20gMCB0byAxLFxuLy8gd2hpbHN0IGlucHV0MidzIGdhaW4gbGV2ZWwgd2lsbCBjaGFuZ2UgZnJvbSAxIHRvIDAuXG5jbGFzcyBEcnlXZXROb2RlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDIsIDEgKTtcblxuICAgICAgICB0aGlzLmRyeSA9IHRoaXMuaW5wdXRzWyAwIF07XG4gICAgICAgIHRoaXMud2V0ID0gdGhpcy5pbnB1dHNbIDEgXTtcblxuICAgICAgICAvLyBJbnZlcnQgd2V0IHNpZ25hbCdzIHBoYXNlXG4gICAgICAgIHRoaXMud2V0SW5wdXRJbnZlcnQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLndldElucHV0SW52ZXJ0LmdhaW4udmFsdWUgPSAtMTtcbiAgICAgICAgdGhpcy53ZXQuY29ubmVjdCggdGhpcy53ZXRJbnB1dEludmVydCApO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgZmFkZXIgbm9kZVxuICAgICAgICB0aGlzLmZhZGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5mYWRlci5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbnRyb2wgbm9kZS4gSXQgc2V0cyB0aGUgZmFkZXIncyB2YWx1ZS5cbiAgICAgICAgdGhpcy5kcnlXZXRDb250cm9sID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmRyeVdldENvbnRyb2wuY29ubmVjdCggdGhpcy5mYWRlci5nYWluICk7XG5cbiAgICAgICAgLy8gSW52ZXJ0IHRoZSBmYWRlciBub2RlJ3MgcGhhc2VcbiAgICAgICAgdGhpcy5mYWRlckludmVydCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZmFkZXJJbnZlcnQuZ2Fpbi52YWx1ZSA9IC0xO1xuXG4gICAgICAgIC8vIENvbm5lY3QgZmFkZXIgdG8gZmFkZXIgcGhhc2UgaW52ZXJzaW9uLFxuICAgICAgICAvLyBhbmQgZmFkZXIgcGhhc2UgaW52ZXJzaW9uIHRvIG91dHB1dC5cbiAgICAgICAgdGhpcy53ZXRJbnB1dEludmVydC5jb25uZWN0KCB0aGlzLmZhZGVyICk7XG4gICAgICAgIHRoaXMuZmFkZXIuY29ubmVjdCggdGhpcy5mYWRlckludmVydCApO1xuICAgICAgICB0aGlzLmZhZGVySW52ZXJ0LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBkcnkgaW5wdXQgdG8gYm90aCB0aGUgb3V0cHV0IGFuZCB0aGUgZmFkZXIgbm9kZVxuICAgICAgICB0aGlzLmRyeS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmRyeS5jb25uZWN0KCB0aGlzLmZhZGVyICk7XG5cbiAgICAgICAgLy8gQWRkIGEgJ2RyeVdldCcgcHJvcGVydHkgdG8gdGhlIGNvbnRyb2xzIG9iamVjdC5cbiAgICAgICAgdGhpcy5jb250cm9scy5kcnlXZXQgPSB0aGlzLmRyeVdldENvbnRyb2w7XG4gICAgfVxuXG59XG5cblxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZURyeVdldE5vZGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IERyeVdldE5vZGUoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IERyeVdldE5vZGU7XG4iLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgRVFTaGVsZiBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgaGlnaEZyZXF1ZW5jeSA9IDI1MDAsIGxvd0ZyZXF1ZW5jeSA9IDM1MCwgaGlnaEJvb3N0ID0gLTYsIGxvd0Jvb3N0ID0gMCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5oaWdoRnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaEZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmxvd0ZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd0ZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmhpZ2hCb29zdCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hCb29zdCApO1xuICAgICAgICB0aGlzLmxvd0Jvb3N0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93Qm9vc3QgKTtcblxuICAgICAgICB0aGlzLmxvd1NoZWxmID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICB0aGlzLmxvd1NoZWxmLnR5cGUgPSAnbG93c2hlbGYnO1xuICAgICAgICB0aGlzLmxvd1NoZWxmLmZyZXF1ZW5jeS52YWx1ZSA9IGxvd0ZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5sb3dTaGVsZi5nYWluLnZhbHVlID0gbG93Qm9vc3Q7XG5cbiAgICAgICAgdGhpcy5oaWdoU2hlbGYgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gICAgICAgIHRoaXMuaGlnaFNoZWxmLnR5cGUgPSAnaGlnaHNoZWxmJztcbiAgICAgICAgdGhpcy5oaWdoU2hlbGYuZnJlcXVlbmN5LnZhbHVlID0gaGlnaEZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5oaWdoU2hlbGYuZ2Fpbi52YWx1ZSA9IGhpZ2hCb29zdDtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMubG93U2hlbGYgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmhpZ2hTaGVsZiApO1xuICAgICAgICB0aGlzLmxvd1NoZWxmLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaGlnaFNoZWxmLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgLy8gU3RvcmUgY29udHJvbGxhYmxlIHBhcmFtcy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVE9ETzpcbiAgICAgICAgLy8gIC0gU2hvdWxkIHRoZXNlIGJlIHJlZmVyZW5jZXMgdG8gcGFyYW0uY29udHJvbD8gVGhpc1xuICAgICAgICAvLyAgICBtaWdodCBhbGxvdyBkZWZhdWx0cyB0byBiZSBzZXQgd2hpbHN0IGFsc28gYWxsb3dpbmdcbiAgICAgICAgLy8gICAgYXVkaW8gc2lnbmFsIGNvbnRyb2wuXG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEZyZXF1ZW5jeSA9IHRoaXMuaGlnaEZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dGcmVxdWVuY3kgPSB0aGlzLmxvd0ZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoQm9vc3QgPSB0aGlzLmhpZ2hCb29zdDtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dCb29zdCA9IHRoaXMubG93Qm9vc3Q7XG4gICAgfVxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUVRU2hlbGYgPSBmdW5jdGlvbiggaGlnaEZyZXF1ZW5jeSwgbG93RnJlcXVlbmN5LCBoaWdoQm9vc3QsIGxvd0Jvb3N0ICkge1xuICAgIHJldHVybiBuZXcgRVFTaGVsZiggdGhpcywgaGlnaEZyZXF1ZW5jeSwgbG93RnJlcXVlbmN5LCBoaWdoQm9vc3QsIGxvd0Jvb3N0ICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBFUVNoZWxmOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBQaGFzZU9mZnNldCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsID0gdGhpcy5pby5jcmVhdGVSZWNpcHJvY2FsKCB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSAqIDAuNSApO1xuICAgICAgICB0aGlzLmRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLnBoYXNlID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmhhbGZQaGFzZSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIDAuNSApO1xuXG4gICAgICAgIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmZyZXF1ZW5jeS5jb25uZWN0KCB0aGlzLnJlY2lwcm9jYWwgKTtcbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsLmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5waGFzZS5jb25uZWN0KCB0aGlzLmhhbGZQaGFzZSApO1xuICAgICAgICB0aGlzLmhhbGZQaGFzZS5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAxICk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkuY29ubmVjdCggdGhpcy5kZWxheS5kZWxheVRpbWUgKTtcblxuICAgICAgICAvLyBTaG91bGQgdGhpcyBiZSBjb25uZWN0ZWQhPyBJZiBpdCBpcywgdGhlbiBpdCdzXG4gICAgICAgIC8vIGNyZWF0aW5nLCBlZy4gUFdNIGlmIGEgc3F1YXJlIHdhdmUgaXMgaW5wdXR0ZWQsIFxuICAgICAgICAvLyBzaW5jZSByYXcgaW5wdXQgaXMgYmVpbmcgYmxlbmRlZCB3aXRoIHBoYXNlLW9mZnNldHRlZFxuICAgICAgICAvLyBpbnB1dC5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5kZWxheSApO1xuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDAuNTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuZnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnBoYXNlID0gdGhpcy5waGFzZTtcbiAgICB9XG5cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUGhhc2VPZmZzZXQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFBoYXNlT2Zmc2V0KCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBQaGFzZU9mZnNldDsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuLy8gaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IG1hdGggZnJvbSBcIi4uL21peGlucy9tYXRoLmVzNlwiO1xuLy8gaW1wb3J0IE5vdGUgZnJvbSBcIi4uL25vdGUvTm90ZS5lczZcIjtcbi8vIGltcG9ydCBDaG9yZCBmcm9tIFwiLi4vbm90ZS9DaG9yZC5lczZcIjtcblxuLy8gIFBsYXllclxuLy8gID09PT09PVxuLy8gIFRha2VzIGNhcmUgb2YgcmVxdWVzdGluZyBHZW5lcmF0b3JOb2RlcyBiZSBjcmVhdGVkLlxuLy9cbi8vICBIYXM6XG4vLyAgICAgIC0gUG9seXBob255IChwYXJhbSlcbi8vICAgICAgLSBVbmlzb24gKHBhcmFtKVxuLy8gICAgICAtIFVuaXNvbiBkZXR1bmUgKHBhcmFtKVxuLy8gICAgICAtIFVuaXNvbiBwaGFzZSAocGFyYW0pXG4vLyAgICAgIC0gR2xpZGUgbW9kZVxuLy8gICAgICAtIEdsaWRlIHRpbWVcbi8vICAgICAgLSBWZWxvY2l0eSBzZW5zaXRpdml0eSAocGFyYW0pXG4vLyAgICAgIC0gR2xvYmFsIHR1bmluZyAocGFyYW0pXG4vL1xuLy8gIE1ldGhvZHM6XG4vLyAgICAgIC0gc3RhcnQoIGZyZXEvbm90ZSwgdmVsLCBkZWxheSApXG4vLyAgICAgIC0gc3RvcCggZnJlcS9ub3RlLCB2ZWwsIGRlbGF5IClcbi8vXG4vLyAgUHJvcGVydGllczpcbi8vICAgICAgLSBwb2x5cGhvbnkgKG51bWJlciwgPjEpXG4vLyAgICAgIC0gdW5pc29uIChudW1iZXIsID4xKVxuLy8gICAgICAtIHVuaXNvbkRldHVuZSAobnVtYmVyLCBjZW50cylcbi8vICAgICAgLSB1bmlzb25QaGFzZSAobnVtYmVyLCAwLTEpXG4vLyAgICAgIC0gZ2xpZGVNb2RlIChzdHJpbmcpXG4vLyAgICAgIC0gZ2xpZGVUaW1lIChtcywgbnVtYmVyKVxuLy8gICAgICAtIHZlbG9jaXR5U2Vuc2l0aXZpdHkgKDAtMSwgbnVtYmVyKVxuLy8gICAgICAtIHR1bmluZyAoLTY0LCArNjQsIHNlbWl0b25lcylcbi8vXG5jbGFzcyBHZW5lcmF0b3JQbGF5ZXIgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIG9wdGlvbnMgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIGlmICggb3B0aW9ucy5nZW5lcmF0b3IgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ0dlbmVyYXRvclBsYXllciByZXF1aXJlcyBhIGBnZW5lcmF0b3JgIG9wdGlvbiB0byBiZSBnaXZlbi4nICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IG9wdGlvbnMuZ2VuZXJhdG9yO1xuXG4gICAgICAgIHRoaXMucG9seXBob255ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggb3B0aW9ucy5wb2x5cGhvbnkgfHwgMSApO1xuXG4gICAgICAgIHRoaXMudW5pc29uID0gdGhpcy5pby5jcmVhdGVQYXJhbSggb3B0aW9ucy51bmlzb24gfHwgMSApO1xuICAgICAgICB0aGlzLnVuaXNvbkRldHVuZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHR5cGVvZiBvcHRpb25zLnVuaXNvbkRldHVuZSA9PT0gJ251bWJlcicgPyBvcHRpb25zLnVuaXNvbkRldHVuZSA6IDAgKTtcbiAgICAgICAgdGhpcy51bmlzb25QaGFzZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHR5cGVvZiBvcHRpb25zLnVuaXNvblBoYXNlID09PSAnbnVtYmVyJyA/IG9wdGlvbnMudW5pc29uUGhhc2UgOiAwICk7XG4gICAgICAgIHRoaXMudW5pc29uTW9kZSA9IG9wdGlvbnMudW5pc29uTW9kZSB8fCAnY2VudGVyZWQnO1xuXG4gICAgICAgIHRoaXMuZ2xpZGVNb2RlID0gb3B0aW9ucy5nbGlkZU1vZGUgfHwgJ2VxdWFsJztcbiAgICAgICAgdGhpcy5nbGlkZVRpbWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy5nbGlkZVRpbWUgPT09ICdudW1iZXInID8gb3B0aW9ucy5nbGlkZVRpbWUgOiAwICk7XG5cbiAgICAgICAgdGhpcy52ZWxvY2l0eVNlbnNpdGl2aXR5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMudmVsb2NpdHlTZW5zaXRpdml0eSA9PT0gJ251bWJlcicgPyBvcHRpb25zLnZlbG9jaXR5U2Vuc2l0aXZpdHkgOiAwICk7XG5cbiAgICAgICAgdGhpcy50dW5pbmcgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy50dW5pbmcgPT09ICdudW1iZXInID8gb3B0aW9ucy50dW5pbmcgOiAwICk7XG5cbiAgICAgICAgdGhpcy53YXZlZm9ybSA9IG9wdGlvbnMud2F2ZWZvcm0gfHwgJ3NpbmUnO1xuXG4gICAgICAgIHRoaXMuZW52ZWxvcGUgPSBvcHRpb25zLmVudmVsb3BlIHx8IHRoaXMuaW8uY3JlYXRlQURTUkVudmVsb3BlKCk7XG5cbiAgICAgICAgdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzID0ge307XG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQgPSBbXTtcbiAgICAgICAgdGhpcy50aW1lcnMgPSBbXTtcbiAgICB9XG5cblxuICAgIF9jcmVhdGVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlZm9ybSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdG9yLmNhbGwoIHRoaXMuaW8sIGZyZXF1ZW5jeSwgZGV0dW5lICsgdGhpcy50dW5pbmcudmFsdWUgKiAxMDAsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmVmb3JtICk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGVzIHRoZSBhbW91bnQgb2YgZGV0dW5lIChjZW50cykgdG8gYXBwbHkgdG8gYSBnZW5lcmF0b3Igbm9kZVxuICAgICAqIGdpdmVuIGFuIGluZGV4IGJldHdlZW4gMCBhbmQgdGhpcy51bmlzb24udmFsdWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gdW5pc29uSW5kZXggVW5pc29uIGluZGV4LlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gICAgICAgICAgICAgRGV0dW5lIHZhbHVlLCBpbiBjZW50cy5cbiAgICAgKi9cbiAgICBfY2FsY3VsYXRlRGV0dW5lKCB1bmlzb25JbmRleCApIHtcbiAgICAgICAgdmFyIGRldHVuZSA9IDAuMCxcbiAgICAgICAgICAgIHVuaXNvbkRldHVuZSA9IHRoaXMudW5pc29uRGV0dW5lLnZhbHVlO1xuXG4gICAgICAgIGlmICggdGhpcy51bmlzb25Nb2RlID09PSAnY2VudGVyZWQnICkge1xuICAgICAgICAgICAgdmFyIGluY3IgPSB1bmlzb25EZXR1bmU7XG5cbiAgICAgICAgICAgIGRldHVuZSA9IGluY3IgKiB1bmlzb25JbmRleDtcbiAgICAgICAgICAgIGRldHVuZSAtPSBpbmNyICogKCB0aGlzLnVuaXNvbi52YWx1ZSAqIDAuNSApO1xuICAgICAgICAgICAgZGV0dW5lICs9IGluY3IgKiAwLjU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgbXVsdGlwbGllcjtcblxuICAgICAgICAgICAgLy8gTGVhdmUgdGhlIGZpcnN0IG5vdGUgaW4gdGhlIHVuaXNvblxuICAgICAgICAgICAgLy8gYWxvbmUsIHNvIGl0J3MgZGV0dW5lIHZhbHVlIGlzIHRoZSByb290XG4gICAgICAgICAgICAvLyBub3RlLlxuICAgICAgICAgICAgaWYgKCB1bmlzb25JbmRleCA+IDAgKSB7XG4gICAgICAgICAgICAgICAgLy8gSG9wIGRvd24gbmVnYXRpdmUgaGFsZiB0aGUgdW5pc29uSW5kZXhcbiAgICAgICAgICAgICAgICBpZiAoIHVuaXNvbkluZGV4ICUgMiA9PT0gMCApIHtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGllciA9IC11bmlzb25JbmRleCAqIDAuNTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEhvcCB1cCBuIGNlbnRzXG4gICAgICAgICAgICAgICAgICAgIGlmICggdW5pc29uSW5kZXggPiAxICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdW5pc29uSW5kZXggPSB0aGlzLk1hdGgucm91bmRUb011bHRpcGxlKCB1bmlzb25JbmRleCwgMiApIC0gMjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG11bHRpcGxpZXIgPSB1bmlzb25JbmRleDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIHRoZSBtdWx0aXBsaWVyLCBjYWxjdWxhdGUgdGhlIGRldHVuZSB2YWx1ZVxuICAgICAgICAgICAgICAgIC8vIGZvciB0aGUgZ2l2ZW4gdW5pc29uSW5kZXguXG4gICAgICAgICAgICAgICAgZGV0dW5lID0gdW5pc29uRGV0dW5lICogbXVsdGlwbGllcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZXR1bmU7XG4gICAgfVxuXG4gICAgX2NhbGN1bGF0ZUdsaWRlVGltZSggb2xkRnJlcSwgbmV3RnJlcSApIHtcbiAgICAgICAgdmFyIG1vZGUgPSB0aGlzLmdsaWRlTW9kZSxcbiAgICAgICAgICAgIHRpbWUgPSB0aGlzLmdsaWRlVGltZS52YWx1ZSxcbiAgICAgICAgICAgIGdsaWRlVGltZSxcbiAgICAgICAgICAgIGZyZXFEaWZmZXJlbmNlO1xuXG4gICAgICAgIGlmICggdGltZSA9PT0gMC4wICkge1xuICAgICAgICAgICAgZ2xpZGVUaW1lID0gMC4wO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBtb2RlID09PSAnZXF1YWwnICkge1xuICAgICAgICAgICAgZ2xpZGVUaW1lID0gdGltZSAqIDAuMDAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZnJlcURpZmZlcmVuY2UgPSBNYXRoLmFicyggb2xkRnJlcSAtIG5ld0ZyZXEgKTtcbiAgICAgICAgICAgIGZyZXFEaWZmZXJlbmNlID0gdGhpcy5NYXRoLmNsYW1wKCBmcmVxRGlmZmVyZW5jZSwgMCwgNTAwICk7XG4gICAgICAgICAgICBnbGlkZVRpbWUgPSB0aGlzLk1hdGguc2NhbGVOdW1iZXJFeHAoXG4gICAgICAgICAgICAgICAgZnJlcURpZmZlcmVuY2UsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICA1MDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICB0aW1lXG4gICAgICAgICAgICApICogMC4wMDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2xpZGVUaW1lO1xuICAgIH1cblxuXG4gICAgX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGdlbmVyYXRvck9iamVjdCApIHtcbiAgICAgICAgdmFyIG9iamVjdHMgPSB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHM7XG5cbiAgICAgICAgb2JqZWN0c1sgZnJlcXVlbmN5IF0gPSBvYmplY3RzWyBmcmVxdWVuY3kgXSB8fCBbXTtcbiAgICAgICAgb2JqZWN0c1sgZnJlcXVlbmN5IF0udW5zaGlmdCggZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQudW5zaGlmdCggZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgfVxuXG4gICAgX2ZldGNoR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3kgKSB7XG4gICAgICAgIHZhciBvYmplY3RzID0gdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzWyBmcmVxdWVuY3kgXSxcbiAgICAgICAgICAgIGluZGV4ID0gMDtcblxuICAgICAgICBpZiAoICFvYmplY3RzIHx8IG9iamVjdHMubGVuZ3RoID09PSAwICkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0LnBvcCgpO1xuICAgICAgICByZXR1cm4gb2JqZWN0cy5wb3AoKTtcbiAgICB9XG5cbiAgICBfZmV0Y2hHZW5lcmF0b3JPYmplY3RUb1JldXNlKCkge1xuICAgICAgICB2YXIgZ2VuZXJhdG9yID0gdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5wb3AoKSxcbiAgICAgICAgICAgIGZyZXF1ZW5jeTtcblxuICAgICAgICBjb25zb2xlLmxvZyggJ3JldXNlJywgZ2VuZXJhdG9yICk7XG5cbiAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBnZW5lcmF0b3IgKSApIHtcbiAgICAgICAgICAgIGZyZXF1ZW5jeSA9IGdlbmVyYXRvclsgMCBdLmZyZXF1ZW5jeTtcblxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgZ2VuZXJhdG9yLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgIHRoaXMuZW52ZWxvcGUuZm9yY2VTdG9wKCBnZW5lcmF0b3JbIGkgXS5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCggZ2VuZXJhdG9yWyBpIF0udGltZXIgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZyZXF1ZW5jeSA9IGdlbmVyYXRvci5mcmVxdWVuY3k7XG4gICAgICAgICAgICB0aGlzLmVudmVsb3BlLmZvcmNlU3RvcCggZ2VuZXJhdG9yLm91dHB1dHNbIDAgXS5nYWluICk7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoIGdlbmVyYXRvci50aW1lciApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzWyBmcmVxdWVuY3kgXS5wb3AoKTtcblxuICAgICAgICByZXR1cm4gZ2VuZXJhdG9yO1xuICAgIH1cblxuXG4gICAgX3N0YXJ0R2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICkge1xuICAgICAgICBnZW5lcmF0b3JPYmplY3Qub3V0cHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuZW52ZWxvcGUuc3RhcnQoIGdlbmVyYXRvck9iamVjdC5vdXRwdXRzWyAwIF0uZ2FpbiwgZGVsYXkgKTtcbiAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LnN0YXJ0KCBkZWxheSApO1xuICAgIH1cblxuICAgIF9zdGFydFNpbmdsZSggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKSB7XG4gICAgICAgIHZhciB1bmlzb24gPSB0aGlzLnVuaXNvbi52YWx1ZSxcbiAgICAgICAgICAgIGRldHVuZSA9IDAuMCxcbiAgICAgICAgICAgIHVuaXNvbkdlbmVyYXRvckFycmF5LFxuICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LFxuICAgICAgICAgICAgYWN0aXZlR2VuZXJhdG9yQ291bnQgPSB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0Lmxlbmd0aCxcbiAgICAgICAgICAgIGV4aXN0aW5nRnJlcXVlbmN5LFxuICAgICAgICAgICAgZ2xpZGVUaW1lID0gMC4wO1xuXG4gICAgICAgIGlmICggYWN0aXZlR2VuZXJhdG9yQ291bnQgPCB0aGlzLnBvbHlwaG9ueS52YWx1ZSApIHtcbiAgICAgICAgICAgIGlmICggdW5pc29uID09PSAxLjAgKSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fY3JlYXRlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgdGhpcy53YXZlZm9ybSApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0R2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB1bmlzb25HZW5lcmF0b3JBcnJheSA9IFtdO1xuXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdW5pc29uOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgICAgIGRldHVuZSA9IHRoaXMuX2NhbGN1bGF0ZURldHVuZSggaSApO1xuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSB0aGlzLl9jcmVhdGVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB0aGlzLndhdmVmb3JtICk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0R2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICk7XG4gICAgICAgICAgICAgICAgICAgIHVuaXNvbkdlbmVyYXRvckFycmF5LnB1c2goIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIHVuaXNvbkdlbmVyYXRvckFycmF5ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICggdW5pc29uID09PSAxLjAgKSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fZmV0Y2hHZW5lcmF0b3JPYmplY3RUb1JldXNlKCk7XG4gICAgICAgICAgICAgICAgZXhpc3RpbmdGcmVxdWVuY3kgPSBnZW5lcmF0b3JPYmplY3QuZnJlcXVlbmN5O1xuICAgICAgICAgICAgICAgIGdsaWRlVGltZSA9IHRoaXMuX2NhbGN1bGF0ZUdsaWRlVGltZSggZXhpc3RpbmdGcmVxdWVuY3ksIGZyZXF1ZW5jeSApO1xuXG4gICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LnJlc2V0KCBmcmVxdWVuY3ksIGRldHVuZSArIHRoaXMudHVuaW5nLnZhbHVlICogMTAwLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lICk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSB0aGlzLl9mZXRjaEdlbmVyYXRvck9iamVjdFRvUmV1c2UoKTtcbiAgICAgICAgICAgICAgICBleGlzdGluZ0ZyZXF1ZW5jeSA9IGdlbmVyYXRvck9iamVjdFsgMCBdLmZyZXF1ZW5jeTtcbiAgICAgICAgICAgICAgICBnbGlkZVRpbWUgPSB0aGlzLl9jYWxjdWxhdGVHbGlkZVRpbWUoIGV4aXN0aW5nRnJlcXVlbmN5LCBmcmVxdWVuY3kgKTtcblxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHVuaXNvbjsgKytpICkge1xuICAgICAgICAgICAgICAgICAgICBkZXR1bmUgPSB0aGlzLl9jYWxjdWxhdGVEZXR1bmUoIGkgKTtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0WyBpIF0ucmVzZXQoIGZyZXF1ZW5jeSwgZGV0dW5lICsgdGhpcy50dW5pbmcudmFsdWUgKiAxMDAsIHZlbG9jaXR5LCBnbGlkZVRpbWUgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJldHVybiB0aGUgZ2VuZXJhdGVkIG9iamVjdChzKSBpbiBjYXNlIHRoZXkncmUgbmVlZGVkLlxuICAgICAgICByZXR1cm4gdW5pc29uR2VuZXJhdG9yQXJyYXkgPyB1bmlzb25HZW5lcmF0b3JBcnJheSA6IGdlbmVyYXRvck9iamVjdDtcbiAgICB9XG5cbiAgICBzdGFydCggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKSB7XG4gICAgICAgIHZhciBmcmVxID0gMCxcbiAgICAgICAgICAgIHZlbG9jaXR5U2Vuc2l0aXZpdHkgPSB0aGlzLnZlbG9jaXR5U2Vuc2l0aXZpdHkudmFsdWU7XG5cbiAgICAgICAgdmVsb2NpdHkgPSB0eXBlb2YgdmVsb2NpdHkgPT09ICdudW1iZXInID8gdmVsb2NpdHkgOiAxO1xuICAgICAgICBkZWxheSA9IHR5cGVvZiBkZWxheSA9PT0gJ251bWJlcicgPyBkZWxheSA6IDA7XG5cblxuICAgICAgICBpZiAoIHZlbG9jaXR5U2Vuc2l0aXZpdHkgIT09IDAgKSB7XG4gICAgICAgICAgICB2ZWxvY2l0eSA9IHRoaXMuTWF0aC5zY2FsZU51bWJlciggdmVsb2NpdHksIDAsIDEsIDAuNSAtIHZlbG9jaXR5U2Vuc2l0aXZpdHkgKiAwLjUsIDAuNSArIHZlbG9jaXR5U2Vuc2l0aXZpdHkgKiAwLjUgKVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSAwLjU7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGlmICggdHlwZW9mIGZyZXF1ZW5jeSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGFydFNpbmdsZSggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBlbHNlIGlmICggZnJlcXVlbmN5IGluc3RhbmNlb2YgTm90ZSApIHtcbiAgICAgICAgLy8gICAgIGZyZXEgPSBmcmVxdWVuY3kudmFsdWVIejtcbiAgICAgICAgLy8gICAgIHRoaXMuX3N0YXJ0U2luZ2xlKCBmcmVxLCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBlbHNlIGlmICggZnJlcXVlbmN5IGluc3RhbmNlb2YgQ2hvcmQgKSB7XG4gICAgICAgIC8vICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBmcmVxdWVuY3kubm90ZXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgIC8vICAgICAgICAgZnJlcSA9IGZyZXF1ZW5jeS5ub3Rlc1sgaSBdLnZhbHVlSHo7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5fc3RhcnRTaW5nbGUoIGZyZXEsIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG5cblxuICAgIF9zdG9wR2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5lbnZlbG9wZS5zdG9wKCBnZW5lcmF0b3JPYmplY3Qub3V0cHV0c1sgMCBdLmdhaW4sIGRlbGF5ICk7XG5cbiAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LnRpbWVyID0gc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBzZWxmLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0LnBvcCgpO1xuICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LnN0b3AoIGRlbGF5ICk7XG4gICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QuY2xlYW5VcCgpO1xuICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gbnVsbDtcbiAgICAgICAgfSwgZGVsYXkgKiAxMDAwICsgdGhpcy5lbnZlbG9wZS50b3RhbFN0b3BUaW1lICogMTAwMCArIDEwMCApO1xuICAgIH1cblxuICAgIF9zdG9wU2luZ2xlKCBmcmVxdWVuY3ksIHZlbG9jaXR5LCBkZWxheSApIHtcbiAgICAgICAgdmFyIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2ZldGNoR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3kgKTtcblxuICAgICAgICBpZiAoIGdlbmVyYXRvck9iamVjdCApIHtcbiAgICAgICAgICAgIC8vIFN0b3AgZ2VuZXJhdG9ycyBmb3JtZWQgd2hlbiB1bmlzb24gd2FzID4gMSBhdCB0aW1lIG9mIHN0YXJ0KC4uLilcbiAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggZ2VuZXJhdG9yT2JqZWN0ICkgKSB7XG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSBnZW5lcmF0b3JPYmplY3QubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BHZW5lcmF0b3JPYmplY3QoIGdlbmVyYXRvck9iamVjdFsgaSBdLCBkZWxheSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BHZW5lcmF0b3JPYmplY3QoIGdlbmVyYXRvck9iamVjdCwgZGVsYXkgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGdlbmVyYXRvck9iamVjdCA9IG51bGw7XG4gICAgfVxuXG4gICAgc3RvcCggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKSB7XG4gICAgICAgIHZlbG9jaXR5ID0gdHlwZW9mIHZlbG9jaXR5ID09PSAnbnVtYmVyJyA/IHZlbG9jaXR5IDogMDtcbiAgICAgICAgZGVsYXkgPSB0eXBlb2YgZGVsYXkgPT09ICdudW1iZXInID8gZGVsYXkgOiAwO1xuXG4gICAgICAgIGlmICggdHlwZW9mIGZyZXF1ZW5jeSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLl9zdG9wU2luZ2xlKCBmcmVxdWVuY3ksIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGVsc2UgaWYgKCBmcmVxdWVuY3kgaW5zdGFuY2VvZiBOb3RlICkge1xuICAgICAgICAvLyAgICAgZnJlcSA9IGZyZXF1ZW5jeS52YWx1ZUh6O1xuICAgICAgICAvLyAgICAgdGhpcy5fc3RvcFNpbmdsZSggZnJlcSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gZWxzZSBpZiAoIGZyZXF1ZW5jeSBpbnN0YW5jZW9mIENob3JkICkge1xuICAgICAgICAvLyAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgZnJlcXVlbmN5Lm5vdGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAvLyAgICAgICAgIGZyZXEgPSBmcmVxdWVuY3kubm90ZXNbIGkgXS52YWx1ZUh6O1xuICAgICAgICAvLyAgICAgICAgIHRoaXMuX3N0b3BTaW5nbGUoIGZyZXEsIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5cbi8vIEF1ZGlvSU8ubWl4aW5TaW5nbGUoIEdlbmVyYXRvclBsYXllci5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkdlbmVyYXRvclBsYXllci5wcm90b3R5cGUuTWF0aCA9IG1hdGg7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUdlbmVyYXRvclBsYXllciA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuICAgIHJldHVybiBuZXcgR2VuZXJhdG9yUGxheWVyKCB0aGlzLCBvcHRpb25zICk7XG59OyIsIndpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG5cbi8vIENvcmUgY29tcG9uZW50cy5cbmltcG9ydCBBdWRpb0lPIGZyb20gJy4vY29yZS9BdWRpb0lPLmVzNic7XG5pbXBvcnQgTm9kZSBmcm9tICcuL2NvcmUvTm9kZS5lczYnO1xuaW1wb3J0IFBhcmFtIGZyb20gJy4vY29yZS9QYXJhbS5lczYnO1xuaW1wb3J0ICcuL2NvcmUvV2F2ZVNoYXBlci5lczYnO1xuXG5cbi8vIEZYLlxuaW1wb3J0ICcuL2Z4L2RlbGF5L0RlbGF5LmVzNic7XG5pbXBvcnQgJy4vZngvZGVsYXkvUGluZ1BvbmdEZWxheS5lczYnO1xuaW1wb3J0ICcuL2Z4L2RlbGF5L1N0ZXJlb0RlbGF5LmVzNic7XG5pbXBvcnQgJy4vZngvZXEvQ3VzdG9tRVEuZXM2Jztcbi8vIGltcG9ydCAnLi9meC9CaXRSZWR1Y3Rpb24uZXM2JztcbmltcG9ydCAnLi9meC9TY2hyb2VkZXJBbGxQYXNzLmVzNic7XG5pbXBvcnQgJy4vZngvZmlsdGVycy9GaWx0ZXJCYW5rLmVzNic7XG5pbXBvcnQgJy4vZngvZmlsdGVycy9MUEZpbHRlci5lczYnO1xuaW1wb3J0ICcuL2Z4L2ZpbHRlcnMvQlBGaWx0ZXIuZXM2JztcbmltcG9ydCAnLi9meC9maWx0ZXJzL0hQRmlsdGVyLmVzNic7XG5pbXBvcnQgJy4vZngvZmlsdGVycy9Ob3RjaEZpbHRlci5lczYnO1xuaW1wb3J0ICcuL2Z4L2ZpbHRlcnMvQWxsUGFzc0ZpbHRlci5lczYnO1xuaW1wb3J0ICcuL2Z4L3NhdHVyYXRpb24vU2luZVNoYXBlci5lczYnO1xuaW1wb3J0ICcuL2Z4L3V0aWxpdHkvRENUcmFwLmVzNic7XG5pbXBvcnQgJy4vZngvdXRpbGl0eS9MRk8uZXM2JztcbmltcG9ydCAnLi9meC91dGlsaXR5L1N0ZXJlb1dpZHRoLmVzNic7XG5pbXBvcnQgJy4vZngvdXRpbGl0eS9TdGVyZW9Sb3RhdGlvbi5lczYnO1xuXG4vLyBHZW5lcmF0b3JzIGFuZCBpbnN0cnVtZW50cy5cbmltcG9ydCAnLi9nZW5lcmF0b3JzL09zY2lsbGF0b3JHZW5lcmF0b3IuZXM2JztcbmltcG9ydCAnLi9pbnN0cnVtZW50cy9HZW5lcmF0b3JQbGF5ZXIuZXM2JztcblxuLy8gTWF0aDogVHJpZ29ub21ldHJ5XG5pbXBvcnQgJy4vbWF0aC90cmlnb25vbWV0cnkvRGVnVG9SYWQuZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9TaW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9Db3MuZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9UYW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9SYWRUb0RlZy5lczYnO1xuXG4vLyBNYXRoOiBSZWxhdGlvbmFsLW9wZXJhdG9ycyAoaW5jLiBpZi9lbHNlKVxuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUby5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUb1plcm8uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhblplcm8uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuRXF1YWxUby5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvSWZFbHNlLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvTGVzc1RoYW5aZXJvLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhbkVxdWFsVG8uZXM2JztcblxuLy8gTWF0aDogTG9naWNhbCBvcGVyYXRvcnNcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL0xvZ2ljYWxPcGVyYXRvci5lczYnO1xuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvQU5ELmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9PUi5lczYnO1xuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTk9ULmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OQU5ELmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OT1IuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL1hPUi5lczYnO1xuXG4vLyBNYXRoOiBHZW5lcmFsLlxuaW1wb3J0ICcuL21hdGgvQWJzLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9BZGQuZXM2JztcbmltcG9ydCAnLi9tYXRoL0F2ZXJhZ2UuZXM2JztcbmltcG9ydCAnLi9tYXRoL0NsYW1wLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9Db25zdGFudC5lczYnO1xuaW1wb3J0ICcuL21hdGgvRGl2aWRlLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9GbG9vci5lczYnO1xuaW1wb3J0ICcuL21hdGgvTWF4LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9NaW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL011bHRpcGx5LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9OZWdhdGUuZXM2JztcbmltcG9ydCAnLi9tYXRoL1Bvdy5lczYnO1xuaW1wb3J0ICcuL21hdGgvUmVjaXByb2NhbC5lczYnO1xuaW1wb3J0ICcuL21hdGgvUm91bmQuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NjYWxlLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TY2FsZUV4cC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU2lnbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3FydC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3VidHJhY3QuZXM2JztcbmltcG9ydCAnLi9tYXRoL1N3aXRjaC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3F1YXJlLmVzNic7XG5cbi8vIE1hdGg6IFNwZWNpYWwuXG5pbXBvcnQgJy4vbWF0aC9MZXJwLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TYW1wbGVEZWxheS5lczYnO1xuXG4vLyBFbnZlbG9wZXNcbmltcG9ydCAnLi9lbnZlbG9wZXMvQ3VzdG9tRW52ZWxvcGUuZXM2JztcbmltcG9ydCAnLi9lbnZlbG9wZXMvQURTUkVudmVsb3BlLmVzNic7XG5pbXBvcnQgJy4vZW52ZWxvcGVzL0FERW52ZWxvcGUuZXM2JztcbmltcG9ydCAnLi9lbnZlbG9wZXMvQURCRFNSRW52ZWxvcGUuZXM2JztcblxuLy8gR2VuZXJhbCBncmFwaHNcbmltcG9ydCAnLi9ncmFwaHMvRVFTaGVsZi5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9Db3VudGVyLmVzNic7XG5pbXBvcnQgJy4vZ3JhcGhzL0RyeVdldE5vZGUuZXM2JztcbmltcG9ydCAnLi9ncmFwaHMvUGhhc2VPZmZzZXQuZXM2JztcbmltcG9ydCAnLi9ncmFwaHMvQ3Jvc3NmYWRlci5lczYnO1xuXG4vLyBPc2NpbGxhdG9yczogVXNpbmcgV2ViQXVkaW8gb3NjaWxsYXRvcnNcbmltcG9ydCAnLi9vc2NpbGxhdG9ycy9Pc2NpbGxhdG9yQmFuay5lczYnO1xuaW1wb3J0ICcuL29zY2lsbGF0b3JzL05vaXNlT3NjaWxsYXRvckJhbmsuZXM2JztcbmltcG9ydCAnLi9vc2NpbGxhdG9ycy9GTU9zY2lsbGF0b3IuZXM2JztcbmltcG9ydCAnLi9vc2NpbGxhdG9ycy9TaW5lQmFuay5lczYnO1xuXG4vLyBPc2NpbGxhdG9yczogQnVmZmVyLWJhc2VkXG5pbXBvcnQgJy4vb3NjaWxsYXRvcnMvQnVmZmVyT3NjaWxsYXRvci5lczYnO1xuXG4vLyBVdGlsc1xuaW1wb3J0ICcuL2J1ZmZlcnMvQnVmZmVyR2VuZXJhdG9ycy5lczYnO1xuaW1wb3J0ICcuL3V0aWxpdGllcy9CdWZmZXJVdGlscy5lczYnO1xuaW1wb3J0ICcuL3V0aWxpdGllcy9VdGlscy5lczYnO1xuXG4vLyBpbXBvcnQgJy4vZ3JhcGhzL1NrZXRjaC5lczYnO1xuXG53aW5kb3cuUGFyYW0gPSBQYXJhbTtcbndpbmRvdy5Ob2RlID0gTm9kZTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG52YXIgU0hBUEVSUyA9IHt9O1xuXG5mdW5jdGlvbiBnZW5lcmF0ZVNoYXBlckN1cnZlKCBzaXplICkge1xuICAgIHZhciBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoIHNpemUgKSxcbiAgICAgICAgaSA9IDAsXG4gICAgICAgIHggPSAwO1xuXG4gICAgZm9yICggaTsgaSA8IHNpemU7ICsraSApIHtcbiAgICAgICAgeCA9ICggaSAvIHNpemUgKSAqIDIgLSAxO1xuICAgICAgICBhcnJheVsgaSBdID0gTWF0aC5hYnMoIHggKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJyYXk7XG59XG5cbmNsYXNzIEFicyBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCBhY2N1cmFjeSA9IDEwICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyB2YXIgZ2FpbkFjY3VyYWN5ID0gYWNjdXJhY3kgKiAxMDA7XG4gICAgICAgIHZhciBnYWluQWNjdXJhY3kgPSBNYXRoLnBvdyggYWNjdXJhY3ksIDIgKSxcbiAgICAgICAgICAgIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpLFxuICAgICAgICAgICAgc2l6ZSA9IDEwMjQgKiBhY2N1cmFjeTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAxIC8gZ2FpbkFjY3VyYWN5O1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gZ2FpbkFjY3VyYWN5O1xuXG4gICAgICAgIC8vIFRvIHNhdmUgY3JlYXRpbmcgbmV3IHNoYXBlciBjdXJ2ZXMgKHRoYXQgY2FuIGJlIHF1aXRlIGxhcmdlISlcbiAgICAgICAgLy8gZWFjaCB0aW1lIGFuIGluc3RhbmNlIG9mIEFicyBpcyBjcmVhdGVkLCBzaGFwZXIgY3VydmVzXG4gICAgICAgIC8vIGFyZSBzdG9yZWQgaW4gdGhlIFNIQVBFUlMgb2JqZWN0IGFib3ZlLiBUaGUga2V5cyB0byB0aGVcbiAgICAgICAgLy8gU0hBUEVSUyBvYmplY3QgYXJlIHRoZSBiYXNlIHdhdmV0YWJsZSBjdXJ2ZSBzaXplICgxMDI0KVxuICAgICAgICAvLyBtdWx0aXBsaWVkIGJ5IHRoZSBhY2N1cmFjeSBhcmd1bWVudC5cbiAgICAgICAgaWYoICFTSEFQRVJTWyBzaXplIF0gKSB7XG4gICAgICAgICAgICBTSEFQRVJTWyBzaXplIF0gPSBnZW5lcmF0ZVNoYXBlckN1cnZlKCBzaXplICk7XG4gICAgICAgIH1cblxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIFNIQVBFUlNbIHNpemUgXSApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUFicyA9IGZ1bmN0aW9uKCBhY2N1cmFjeSApIHtcbiAgICByZXR1cm4gbmV3IEFicyggdGhpcywgYWNjdXJhY3kgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBBZGRzIHR3byBhdWRpbyBzaWduYWxzIHRvZ2V0aGVyLlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKlxuICogdmFyIGFkZCA9IGlvLmNyZWF0ZUFkZCggMiApO1xuICogaW4xLmNvbm5lY3QoIGFkZCApO1xuICpcbiAqIHZhciBhZGQgPSBpby5jcmVhdGVBZGQoKTtcbiAqIGluMS5jb25uZWN0KCBhZGQsIDAsIDAgKTtcbiAqIGluMi5jb25uZWN0KCBhZGQsIDAsIDEgKTtcbiAqL1xuY2xhc3MgQWRkIGV4dGVuZHMgTm9kZXtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgXHRyZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICBcdHRoaXMuY29udHJvbHMudmFsdWUudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQWRkID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgQWRkKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbi8qXG4gICAgVGhlIGF2ZXJhZ2UgdmFsdWUgb2YgYSBzaWduYWwgaXMgY2FsY3VsYXRlZFxuICAgIGJ5IHBpcGluZyB0aGUgaW5wdXQgaW50byBhIHJlY3RpZmllciB0aGVuIGludG9cbiAgICBhIHNlcmllcyBvZiBEZWxheU5vZGVzLiBFYWNoIERlbGF5Tm9kZVxuICAgIGhhcyBpdCdzIGBkZWxheVRpbWVgIGNvbnRyb2xsZWQgYnkgZWl0aGVyIHRoZVxuICAgIGBzYW1wbGVTaXplYCBhcmd1bWVudCBvciB0aGUgaW5jb21pbmcgdmFsdWUgb2ZcbiAgICB0aGUgYGNvbnRyb2xzLnNhbXBsZVNpemVgIG5vZGUuIFRoZSBkZWxheVRpbWVcbiAgICBpcyB0aGVyZWZvcmUgbWVhc3VyZWQgaW4gc2FtcGxlcy5cblxuICAgIEVhY2ggZGVsYXkgaXMgY29ubmVjdGVkIHRvIGEgR2Fpbk5vZGUgdGhhdCB3b3Jrc1xuICAgIGFzIGEgc3VtbWluZyBub2RlLiBUaGUgc3VtbWluZyBub2RlJ3MgdmFsdWUgaXNcbiAgICB0aGVuIGRpdmlkZWQgYnkgdGhlIG51bWJlciBvZiBkZWxheXMgdXNlZCBiZWZvcmVcbiAgICBiZWluZyBzZW50IG9uIGl0cyBtZXJyeSB3YXkgdG8gdGhlIG91dHB1dC5cblxuICAgIE5vdGU6XG4gICAgSGlnaCB2YWx1ZXMgZm9yIGBudW1TYW1wbGVzYCB3aWxsIGJlIGV4cGVuc2l2ZSxcbiAgICBhcyB0aGF0IG1hbnkgRGVsYXlOb2RlcyB3aWxsIGJlIGNyZWF0ZWQuIENvbnNpZGVyXG4gICAgaW5jcmVhc2luZyB0aGUgYHNhbXBsZVNpemVgIGFuZCB1c2luZyBhIGxvdyB2YWx1ZVxuICAgIGZvciBgbnVtU2FtcGxlc2AuXG5cbiAgICBHcmFwaDpcbiAgICA9PT09PT1cbiAgICBpbnB1dCAtPlxuICAgICAgICBhYnMvcmVjdGlmeSAtPlxuICAgICAgICAgICAgYG51bVNhbXBsZXNgIG51bWJlciBvZiBkZWxheXMsIGluIHNlcmllcyAtPlxuICAgICAgICAgICAgICAgIHN1bSAtPlxuICAgICAgICAgICAgICAgICAgICBkaXZpZGUgYnkgYG51bVNhbXBsZXNgIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuXG4gKi9cbmNsYXNzIEF2ZXJhZ2UgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtU2FtcGxlcyA9IDEwLCBzYW1wbGVTaXplICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubnVtU2FtcGxlcyA9IG51bVNhbXBsZXM7XG5cbiAgICAgICAgLy8gQWxsIERlbGF5Tm9kZXMgd2lsbCBiZSBzdG9yZWQgaGVyZS5cbiAgICAgICAgZ3JhcGguZGVsYXlzID0gW107XG4gICAgICAgIGdyYXBoLmFicyA9IHRoaXMuaW8uY3JlYXRlQWJzKCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguYWJzICk7XG4gICAgICAgIGdyYXBoLnNhbXBsZVNpemUgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuc2FtcGxlU2l6ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHNhbXBsZVNpemUgKTtcbiAgICAgICAgZ3JhcGguc2FtcGxlU2l6ZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnNhbXBsZVNpemUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICAvLyBUaGlzIGlzIGEgcmVsYXRpdmVseSBleHBlbnNpdmUgY2FsY3VsYXRpb25cbiAgICAgICAgLy8gd2hlbiBjb21wYXJlZCB0byBkb2luZyBhIG11Y2ggc2ltcGxlciByZWNpcHJvY2FsIG11bHRpcGx5LlxuICAgICAgICAvLyB0aGlzLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCBudW1TYW1wbGVzLCB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSAqIDAuNSApO1xuXG4gICAgICAgIC8vIEF2b2lkIHRoZSBtb3JlIGV4cGVuc2l2ZSBkaXZpc2lvbiBhYm92ZSBieVxuICAgICAgICAvLyBtdWx0aXBseWluZyB0aGUgc3VtIGJ5IHRoZSByZWNpcHJvY2FsIG9mIG51bVNhbXBsZXMuXG4gICAgICAgIGdyYXBoLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIDEgLyBudW1TYW1wbGVzICk7XG4gICAgICAgIGdyYXBoLnN1bSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgZ3JhcGguc3VtLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSApO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuXG5cbiAgICAgICAgLy8gVHJpZ2dlciB0aGUgc2V0dGVyIGZvciBgbnVtU2FtcGxlc2AgdGhhdCB3aWxsIGNyZWF0ZVxuICAgICAgICAvLyB0aGUgZGVsYXkgc2VyaWVzLlxuICAgICAgICB0aGlzLm51bVNhbXBsZXMgPSBncmFwaC5udW1TYW1wbGVzO1xuICAgIH1cblxuICAgIGdldCBudW1TYW1wbGVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLm51bVNhbXBsZXM7XG4gICAgfVxuXG4gICAgc2V0IG51bVNhbXBsZXMoIG51bVNhbXBsZXMgKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKSxcbiAgICAgICAgICAgIGRlbGF5cyA9IGdyYXBoLmRlbGF5cztcblxuICAgICAgICAvLyBEaXNjb25uZWN0IGFuZCBudWxsaWZ5IGFueSBleGlzdGluZyBkZWxheSBub2Rlcy5cbiAgICAgICAgdGhpcy5fY2xlYW5VcFNpbmdsZSggZGVsYXlzICk7XG5cbiAgICAgICAgZ3JhcGgubnVtU2FtcGxlcyA9IG51bVNhbXBsZXM7XG4gICAgICAgIGdyYXBoLmRpdmlkZS52YWx1ZSA9IDEgLyBudW1TYW1wbGVzO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwLCBub2RlID0gZ3JhcGguYWJzOyBpIDwgbnVtU2FtcGxlczsgKytpICkge1xuICAgICAgICAgICAgdmFyIGRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgICAgICBkZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggZGVsYXkuZGVsYXlUaW1lICk7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QoIGRlbGF5ICk7XG4gICAgICAgICAgICBkZWxheS5jb25uZWN0KCBncmFwaC5zdW0gKTtcbiAgICAgICAgICAgIGdyYXBoLmRlbGF5cy5wdXNoKCBkZWxheSApO1xuICAgICAgICAgICAgbm9kZSA9IGRlbGF5O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUF2ZXJhZ2UgPSBmdW5jdGlvbiggbnVtU2FtcGxlcywgc2FtcGxlU2l6ZSApIHtcbiAgICByZXR1cm4gbmV3IEF2ZXJhZ2UoIHRoaXMsIG51bVNhbXBsZXMsIHNhbXBsZVNpemUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBDbGFtcCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbWluVmFsdWUsIG1heFZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTsgLy8gaW8sIDEsIDFcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubWluID0gdGhpcy5pby5jcmVhdGVNaW4oIG1heFZhbHVlICk7XG4gICAgICAgIGdyYXBoLm1heCA9IHRoaXMuaW8uY3JlYXRlTWF4KCBtaW5WYWx1ZSApO1xuXG4gICAgICAgIC8vIHRoaXMuaW5wdXRzID0gWyBncmFwaC5taW4gXTtcbiAgICAgICAgLy8gdGhpcy5vdXRwdXRzID0gWyBncmFwaC5tYXggXTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5taW4gKTtcbiAgICAgICAgZ3JhcGgubWluLmNvbm5lY3QoIGdyYXBoLm1heCApO1xuICAgICAgICBncmFwaC5tYXguY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLm1pbiA9IGdyYXBoLm1pbi5jb250cm9scy52YWx1ZTtcbiAgICAgICAgdGhpcy5jb250cm9scy5tYXggPSBncmFwaC5tYXguY29udHJvbHMudmFsdWU7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgbWluKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLm1heC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IG1pbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5tYXgudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgbWF4KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLm1pbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IG1heCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5taW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDbGFtcCA9IGZ1bmN0aW9uKCBtaW5WYWx1ZSwgbWF4VmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDbGFtcCggdGhpcywgbWluVmFsdWUsIG1heFZhbHVlICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gJy4uL2NvcmUvQXVkaW9JTy5lczYnO1xuaW1wb3J0IE5vZGUgZnJvbSAnLi4vY29yZS9Ob2RlLmVzNic7XG5cbmNsYXNzIENvbnN0YW50IGV4dGVuZHMgTm9kZSB7XG4gICAgLyoqXG4gICAgICogQSBjb25zdGFudC1yYXRlIGF1ZGlvIHNpZ25hbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyAgICBJbnN0YW5jZSBvZiBBdWRpb0lPXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIFZhbHVlIG9mIHRoZSBjb25zdGFudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgPSAwLjAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInID8gdmFsdWUgOiAwO1xuICAgICAgICB0aGlzLmlvLmNvbnN0YW50RHJpdmVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnQgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDb25zdGFudCggdGhpcywgdmFsdWUgKTtcbn07XG5cblxuLy8gQSBidW5jaCBvZiBwcmVzZXQgY29uc3RhbnRzLlxuKGZ1bmN0aW9uKCkge1xuICAgIHZhciBFLFxuICAgICAgICBQSSxcbiAgICAgICAgUEkyLFxuICAgICAgICBMTjEwLFxuICAgICAgICBMTjIsXG4gICAgICAgIExPRzEwRSxcbiAgICAgICAgTE9HMkUsXG4gICAgICAgIFNRUlQxXzIsXG4gICAgICAgIFNRUlQyO1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRFID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gRSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkUgKTtcbiAgICAgICAgRSA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudFBJID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gUEkgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5QSSApO1xuICAgICAgICBQSSA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudFBJMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFBJMiB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLlBJICogMiApO1xuICAgICAgICBQSTIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRMTjEwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gTE4xMCB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxOMTAgKTtcbiAgICAgICAgTE4xMCA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudExOMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IExOMiB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxOMiApO1xuICAgICAgICBMTjIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRMT0cxMEUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBMT0cxMEUgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5MT0cxMEUgKTtcbiAgICAgICAgTE9HMTBFID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50TE9HMkUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBMT0cyRSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxPRzJFICk7XG4gICAgICAgIExPRzJFID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50U1FSVDFfMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFNRUlQxXzIgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5TUVJUMV8yICk7XG4gICAgICAgIFNRUlQxXzIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRTUVJUMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFNRUlQyIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguU1FSVDIgKTtcbiAgICAgICAgU1FSVDIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xufSgpKTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIERpdmlkZXMgdHdvIG51bWJlcnNcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBEaXZpZGUgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlLCBtYXhJbnB1dCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSAwLjA7XG5cbiAgICAgICAgZ3JhcGgucmVjaXByb2NhbCA9IHRoaXMuaW8uY3JlYXRlUmVjaXByb2NhbCggbWF4SW5wdXQgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5yZWNpcHJvY2FsICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICBncmFwaC5yZWNpcHJvY2FsLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRpdmlzb3IgPSB0aGlzLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHNbIDEgXS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBtYXhJbnB1dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVjaXByb2NhbC5tYXhJbnB1dDtcbiAgICB9XG4gICAgc2V0IG1heElucHV0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsLm1heElucHV0ID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEaXZpZGUgPSBmdW5jdGlvbiggdmFsdWUsIG1heElucHV0ICkge1xuICAgIHJldHVybiBuZXcgRGl2aWRlKCB0aGlzLCB2YWx1ZSwgbWF4SW5wdXQgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vLyBOT1RFOlxuLy8gIE9ubHkgYWNjZXB0cyB2YWx1ZXMgPj0gLTEgJiYgPD0gMS4gVmFsdWVzIG91dHNpZGVcbi8vICB0aGlzIHJhbmdlIGFyZSBjbGFtcGVkIHRvIHRoaXMgcmFuZ2UuXG5jbGFzcyBGbG9vciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuRmxvb3IgKTtcblxuICAgICAgICAvLyBUaGlzIGJyYW5jaGluZyBpcyBiZWNhdXNlIGlucHV0dGluZyBgMGAgdmFsdWVzXG4gICAgICAgIC8vIGludG8gdGhlIHdhdmVzaGFwZXIgYWJvdmUgb3V0cHV0cyAtMC41IDsoXG4gICAgICAgIGdyYXBoLmlmRWxzZSA9IHRoaXMuaW8uY3JlYXRlSWZFbHNlKCk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG9aZXJvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZXF1YWxUb1plcm8gKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUb1plcm8uY29ubmVjdCggZ3JhcGguaWZFbHNlLmlmICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguaWZFbHNlLnRoZW4gKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIGdyYXBoLmlmRWxzZS5lbHNlICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguaWZFbHNlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUZsb29yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBGbG9vciggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMZXJwIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIHN0YXJ0LCBlbmQsIGRlbHRhICkge1xuICAgICAgICBzdXBlciggaW8sIDMsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguYWRkID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgZ3JhcGguc3VidHJhY3QgPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIGdyYXBoLnN0YXJ0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggc3RhcnQgKTtcbiAgICAgICAgZ3JhcGguZW5kID0gdGhpcy5pby5jcmVhdGVQYXJhbSggZW5kICk7XG4gICAgICAgIGdyYXBoLmRlbHRhID0gdGhpcy5pby5jcmVhdGVQYXJhbSggZGVsdGEgKTtcblxuICAgICAgICBncmFwaC5lbmQuY29ubmVjdCggZ3JhcGguc3VidHJhY3QsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguc3RhcnQuY29ubmVjdCggZ3JhcGguc3VidHJhY3QsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguc3VidHJhY3QuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguZGVsdGEuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5zdGFydC5jb25uZWN0KCBncmFwaC5hZGQsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggZ3JhcGguYWRkLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGguYWRkLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zdGFydCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLmVuZCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMiBdLmNvbm5lY3QoIGdyYXBoLmRlbHRhICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5zdGFydCA9IGdyYXBoLnN0YXJ0O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmVuZCA9IGdyYXBoLmVuZDtcbiAgICAgICAgdGhpcy5jb250cm9scy5kZWx0YSA9IGdyYXBoLmRlbHRhO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHN0YXJ0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLnN0YXJ0LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgc3RhcnQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkuc3RhcnQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgZW5kKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLmVuZC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGVuZCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5lbmQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgZGVsdGEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkuZGVsdGEudmFsdWU7XG4gICAgfVxuICAgIHNldCBkZWx0YSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5kZWx0YS52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVycCA9IGZ1bmN0aW9uKCBzdGFydCwgZW5kLCBkZWx0YSApIHtcbiAgICByZXR1cm4gbmV3IExlcnAoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBXaGVuIGlucHV0IGlzIDwgYHZhbHVlYCwgb3V0cHV0cyBgdmFsdWVgLCBvdGhlcndpc2Ugb3V0cHV0cyBpbnB1dC5cbiAqIEBwYXJhbSB7QXVkaW9JT30gaW8gICBBdWRpb0lPIGluc3RhbmNlXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgVGhlIG1pbmltdW0gdmFsdWUgdG8gdGVzdCBhZ2FpbnN0LlxuICovXG5cbmNsYXNzIE1heCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5ncmVhdGVyVGhhbiA9IHRoaXMuaW8uY3JlYXRlR3JlYXRlclRoYW4oKTtcbiAgICAgICAgZ3JhcGguc3dpdGNoID0gdGhpcy5pby5jcmVhdGVTd2l0Y2goIDIsIDAgKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5ncmVhdGVyVGhhbi5jb250cm9scy52YWx1ZSApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAxIF0gKTtcbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW4uY29ubmVjdCggZ3JhcGguc3dpdGNoLmNvbnRyb2wgKTtcbiAgICAgICAgZ3JhcGguc3dpdGNoLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVNYXggPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBNYXgoIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogV2hlbiBpbnB1dCBpcyA+IGB2YWx1ZWAsIG91dHB1dHMgYHZhbHVlYCwgb3RoZXJ3aXNlIG91dHB1dHMgaW5wdXQuXG4gKiBAcGFyYW0ge0F1ZGlvSU99IGlvICAgQXVkaW9JTyBpbnN0YW5jZVxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIFRoZSBtaW5pbXVtIHZhbHVlIHRvIHRlc3QgYWdhaW5zdC5cbiAqL1xuY2xhc3MgTWluIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmxlc3NUaGFuID0gdGhpcy5pby5jcmVhdGVMZXNzVGhhbigpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubGVzc1RoYW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5sZXNzVGhhbi5jb250cm9scy52YWx1ZSApO1xuXG4gICAgICAgIGdyYXBoLnN3aXRjaCA9IHRoaXMuaW8uY3JlYXRlU3dpdGNoKCAyLCAwICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAxIF0gKTtcbiAgICAgICAgZ3JhcGgubGVzc1RoYW4uY29ubmVjdCggZ3JhcGguc3dpdGNoLmNvbnRyb2wgKTtcbiAgICAgICAgZ3JhcGguc3dpdGNoLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU1pbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IE1pbiggdGhpcywgdmFsdWUgKTtcbn07IiwiIGltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gYXVkaW8gc2lnbmFscyB0b2dldGhlci5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBNdWx0aXBseSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gMC4wO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXS5nYWluICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW5wdXRzWyAxIF07XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVNdWx0aXBseSA9IGZ1bmN0aW9uKCB2YWx1ZTEsIHZhbHVlMiApIHtcbiAgICByZXR1cm4gbmV3IE11bHRpcGx5KCB0aGlzLCB2YWx1ZTEsIHZhbHVlMiApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIE5lZ2F0ZXMgdGhlIGluY29taW5nIGF1ZGlvIHNpZ25hbC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBOZWdhdGUgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMCApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICB0aGlzLm91dHB1dHMgPSB0aGlzLmlucHV0cztcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTmVnYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBOZWdhdGUoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqXG4gKiBOb3RlOiBET0VTIE5PVCBIQU5ETEUgTkVHQVRJVkUgUE9XRVJTLlxuICovXG5jbGFzcyBQb3cgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbGllcnMgPSBbXTtcbiAgICAgICAgZ3JhcGgudmFsdWUgPSB2YWx1ZTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIG5vZGUgPSB0aGlzLmlucHV0c1sgMCBdOyBpIDwgdmFsdWUgLSAxOyArK2kgKSB7XG4gICAgICAgICAgICBncmFwaC5tdWx0aXBsaWVyc1sgaSBdID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5tdWx0aXBsaWVyc1sgaSBdLmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0gKTtcbiAgICAgICAgICAgIG5vZGUgPSBncmFwaC5tdWx0aXBsaWVyc1sgaSBdO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLnZhbHVlID0gbnVsbDtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmRpc2Nvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyAwIF0gKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IGdyYXBoLm11bHRpcGxpZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgICAgZ3JhcGgubXVsdGlwbGllcnNbIGkgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICBncmFwaC5tdWx0aXBsaWVycy5zcGxpY2UoIGksIDEgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgbm9kZSA9IHRoaXMuaW5wdXRzWyAwIF07IGkgPCB2YWx1ZSAtIDE7ICsraSApIHtcbiAgICAgICAgICAgIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0uY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdCggZ3JhcGgubXVsdGlwbGllcnNbIGkgXSApO1xuICAgICAgICAgICAgbm9kZSA9IGdyYXBoLm11bHRpcGxpZXJzWyBpIF07XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgZ3JhcGgudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBvdyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFBvdyggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBPdXRwdXRzIHRoZSB2YWx1ZSBvZiAxIC8gaW5wdXRWYWx1ZSAob3IgcG93KGlucHV0VmFsdWUsIC0xKSlcbiAqIFdpbGwgYmUgdXNlZnVsIGZvciBkb2luZyBtdWx0aXBsaWNhdGl2ZSBkaXZpc2lvbi5cbiAqXG4gKiBUT0RPOlxuICogICAgIC0gVGhlIHdhdmVzaGFwZXIgaXNuJ3QgYWNjdXJhdGUuIEl0IHB1bXBzIG91dCB2YWx1ZXMgZGlmZmVyaW5nXG4gKiAgICAgICBieSAxLjc5MDY3OTMxNDAzMDE1MjVlLTkgb3IgbW9yZS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgUmVjaXByb2NhbCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbWF4SW5wdXQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBmYWN0b3IgPSBtYXhJbnB1dCB8fCAxMDAsXG4gICAgICAgICAgICBnYWluID0gTWF0aC5wb3coIGZhY3RvciwgLTEgKSxcbiAgICAgICAgICAgIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm1heElucHV0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgubWF4SW5wdXQuZ2Fpbi5zZXRWYWx1ZUF0VGltZSggZ2FpbiwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG5cbiAgICAgICAgLy8gdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi5zZXRWYWx1ZUF0VGltZSggMC4wLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcblxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLlJlY2lwcm9jYWwgKTtcblxuICAgICAgICAvLyB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4uc2V0VmFsdWVBdFRpbWUoIDAuMCwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG5cbiAgICAgICAgdGhpcy5pby5jb25zdGFudERyaXZlci5jb25uZWN0KCBncmFwaC5tYXhJbnB1dCApO1xuICAgICAgICBncmFwaC5tYXhJbnB1dC5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdLmdhaW4gKTtcbiAgICAgICAgZ3JhcGgubWF4SW5wdXQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IG1heElucHV0KCkge1xuICAgICAgICByZXR1cm4gZ3JhcGgubWF4SW5wdXQuZ2FpbjtcbiAgICB9XG4gICAgc2V0IG1heElucHV0KCB2YWx1ZSApIHtcbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGlmICggdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIGdyYXBoLm1heElucHV0LmdhaW4uY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICAgICAgICAgIGdyYXBoLm1heElucHV0LmdhaW4uc2V0VmFsdWVBdFRpbWUoIDEgLyB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVJlY2lwcm9jYWwgPSBmdW5jdGlvbiggbWF4SW5wdXQgKSB7XG4gICAgcmV0dXJuIG5ldyBSZWNpcHJvY2FsKCB0aGlzLCBtYXhJbnB1dCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBOT1RFOlxuLy8gIE9ubHkgYWNjZXB0cyB2YWx1ZXMgPj0gLTEgJiYgPD0gMS4gVmFsdWVzIG91dHNpZGVcbi8vICB0aGlzIHJhbmdlIGFyZSBjbGFtcGVkIHRvIHRoaXMgcmFuZ2UuXG5jbGFzcyBSb3VuZCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmZsb29yID0gdGhpcy5pby5jcmVhdGVGbG9vcigpO1xuICAgICAgICBncmFwaC5hZGQgPSB0aGlzLmlvLmNyZWF0ZUFkZCggMC41ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWzBdLmNvbm5lY3QoIGdyYXBoLmFkZCApO1xuICAgICAgICBncmFwaC5hZGQuY29ubmVjdCggZ3JhcGguZmxvb3IgKTtcbiAgICAgICAgZ3JhcGguZmxvb3IuY29ubmVjdCggdGhpcy5vdXRwdXRzWzBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVJvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSb3VuZCggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKlxuICAgIEFsc28ga25vd24gYXMgei0xLCB0aGlzIG5vZGUgZGVsYXlzIHRoZSBpbnB1dCBieVxuICAgIG9uZSBzYW1wbGUuXG4gKi9cbmNsYXNzIFNhbXBsZURlbGF5IGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICBncmFwaC5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGU7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5kZWxheSApO1xuICAgICAgICBncmFwaC5kZWxheS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG4vLyBUaGUgZmFjdG9yeSBmb3IgU2FtcGxlRGVsYXkgaGFzIGFuIGFsaWFzIHRvIGl0J3MgbW9yZSBjb21tb24gbmFtZSFcbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNhbXBsZURlbGF5ID0gQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlWk1pbnVzT25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBTYW1wbGVEZWxheSggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBHaXZlbiBhbiBpbnB1dCB2YWx1ZSBhbmQgaXRzIGhpZ2ggYW5kIGxvdyBib3VuZHMsIHNjYWxlXG4vLyB0aGF0IHZhbHVlIHRvIG5ldyBoaWdoIGFuZCBsb3cgYm91bmRzLlxuLy9cbi8vIEZvcm11bGEgZnJvbSBNYXhNU1AncyBTY2FsZSBvYmplY3Q6XG4vLyAgaHR0cDovL3d3dy5jeWNsaW5nNzQuY29tL2ZvcnVtcy90b3BpYy5waHA/aWQ9MjY1OTNcbi8vXG4vLyAoKGlucHV0LWxvd0luKSAvIChoaWdoSW4tbG93SW4pKSAqIChoaWdoT3V0LWxvd091dCkgKyBsb3dPdXQ7XG5cblxuLy8gVE9ETzpcbi8vICAtIEFkZCBjb250cm9scyFcbmNsYXNzIFNjYWxlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93SW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoSW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dPdXQgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaE91dCApO1xuXG5cbiAgICAgICAgLy8gKGlucHV0LWxvd0luKVxuICAgICAgICBncmFwaC5pbnB1dE1pbnVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguaW5wdXRNaW51c0xvd0luLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4uY29ubmVjdCggZ3JhcGguaW5wdXRNaW51c0xvd0luLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hJbi1sb3dJbilcbiAgICAgICAgZ3JhcGguaGlnaEluTWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4uY29ubmVjdCggZ3JhcGguaGlnaEluTWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoKGlucHV0LWxvd0luKSAvIChoaWdoSW4tbG93SW4pKVxuICAgICAgICBncmFwaC5kaXZpZGUgPSB0aGlzLmlvLmNyZWF0ZURpdmlkZSgpO1xuICAgICAgICBncmFwaC5pbnB1dE1pbnVzTG93SW4uY29ubmVjdCggZ3JhcGguZGl2aWRlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4uY29ubmVjdCggZ3JhcGguZGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hPdXQtbG93T3V0KVxuICAgICAgICBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQgPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaE91dC5jb25uZWN0KCBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSkgKiAoaGlnaE91dC1sb3dPdXQpXG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSkgKiAoaGlnaE91dC1sb3dPdXQpICsgbG93T3V0XG4gICAgICAgIGdyYXBoLmFkZCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5LmNvbm5lY3QoIGdyYXBoLmFkZCwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5hZGQsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5hZGQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCBsb3dJbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMubG93SW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBsb3dJbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgaGlnaEluKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5oaWdoSW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoSW4oIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hJbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBsb3dPdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmxvd091dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd091dCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGhpZ2hPdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQudmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoT3V0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNjYWxlID0gZnVuY3Rpb24oIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCApIHtcbiAgICByZXR1cm4gbmV3IFNjYWxlKCB0aGlzLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gR2l2ZW4gYW4gaW5wdXQgdmFsdWUgYW5kIGl0cyBoaWdoIGFuZCBsb3cgYm91bmRzLCBzY2FsZVxuLy8gdGhhdCB2YWx1ZSB0byBuZXcgaGlnaCBhbmQgbG93IGJvdW5kcy5cbi8vXG4vLyBGb3JtdWxhIGZyb20gTWF4TVNQJ3MgU2NhbGUgb2JqZWN0OlxuLy8gIGh0dHA6Ly93d3cuY3ljbGluZzc0LmNvbS9mb3J1bXMvdG9waWMucGhwP2lkPTI2NTkzXG4vL1xuLy8gaWYoIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikgPT09IDAgKSB7XG4vLyAgICAgcmV0dXJuIGxvd091dDtcbi8vIH1cbi8vIGVsc2UgaWYoIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikgPiAwICkge1xuLy8gICAgIHJldHVybiBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiBNYXRoLnBvdyggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKTtcbi8vIH1cbi8vIGVsc2Uge1xuLy8gICAgIHJldHVybiBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiAtKE1hdGgucG93KCAoLWlucHV0ICsgbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKSk7XG4vLyB9XG5cbi8vIFRPRE86XG4vLyAgLSBBZGQgY29udHJvbHNcbmNsYXNzIFNjYWxlRXhwIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQsIGV4cG9uZW50ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgLy8gbG93SW4gPSB0eXBlb2YgbG93SW4gPT09ICdudW1iZXInID8gbG93SW4gOiAwO1xuICAgICAgICAvLyBoaWdoSW4gPSB0eXBlb2YgaGlnaEluID09PSAnbnVtYmVyJyA/IGhpZ2hJbiA6IDE7XG4gICAgICAgIC8vIGxvd091dCA9IHR5cGVvZiBsb3dPdXQgPT09ICdudW1iZXInID8gbG93T3V0IDogMDtcbiAgICAgICAgLy8gaGlnaE91dCA9IHR5cGVvZiBoaWdoT3V0ID09PSAnbnVtYmVyJyA/IGhpZ2hPdXQgOiAxMDtcbiAgICAgICAgLy8gZXhwb25lbnQgPSB0eXBlb2YgZXhwb25lbnQgPT09ICdudW1iZXInID8gZXhwb25lbnQgOiAxO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dJbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hJbiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hJbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd091dCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoT3V0ICk7XG4gICAgICAgIGdyYXBoLl9leHBvbmVudCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGV4cG9uZW50ICk7XG5cblxuICAgICAgICAvLyAoaW5wdXQgLSBsb3dJbilcbiAgICAgICAgZ3JhcGguaW5wdXRNaW51c0xvd0luID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmlucHV0TWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLmlucHV0TWludXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vICgtaW5wdXQgKyBsb3dJbilcbiAgICAgICAgZ3JhcGgubWludXNJbnB1dCA9IHRoaXMuaW8uY3JlYXRlTmVnYXRlKCk7XG4gICAgICAgIGdyYXBoLm1pbnVzSW5wdXRQbHVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm1pbnVzSW5wdXQgKTtcbiAgICAgICAgZ3JhcGgubWludXNJbnB1dC5jb25uZWN0KCBncmFwaC5taW51c0lucHV0UGx1c0xvd0luLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4uY29ubmVjdCggZ3JhcGgubWludXNJbnB1dFBsdXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vIChoaWdoSW4gLSBsb3dJbilcbiAgICAgICAgZ3JhcGguaGlnaEluTWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4uY29ubmVjdCggZ3JhcGguaGlnaEluTWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSlcbiAgICAgICAgZ3JhcGguZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgZ3JhcGguaW5wdXRNaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5oaWdoSW5NaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIC8vICgtaW5wdXQgKyBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pXG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlRGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgZ3JhcGgubWludXNJbnB1dFBsdXNMb3dJbi5jb25uZWN0KCBncmFwaC5uZWdhdGl2ZURpdmlkZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5oaWdoSW5NaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlRGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hPdXQgLSBsb3dPdXQpXG4gICAgICAgIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dCA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0LmNvbm5lY3QoIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dCwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQsIDAsIDEgKTtcblxuICAgICAgICAvLyBNYXRoLnBvdyggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKVxuICAgICAgICBncmFwaC5wb3cgPSB0aGlzLmlvLmNyZWF0ZVBvdyggZXhwb25lbnQgKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlLmNvbm5lY3QoIGdyYXBoLnBvdyApO1xuXG4gICAgICAgIC8vIC0oTWF0aC5wb3coICgtaW5wdXQgKyBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApKVxuICAgICAgICBncmFwaC5uZWdhdGl2ZVBvd05lZ2F0ZSA9IHRoaXMuaW8uY3JlYXRlTmVnYXRlKCk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlUG93ID0gdGhpcy5pby5jcmVhdGVQb3coIGV4cG9uZW50ICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlRGl2aWRlLmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlUG93ICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlUG93LmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlUG93TmVnYXRlICk7XG5cblxuICAgICAgICAvLyBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiBNYXRoLnBvdyggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKTtcbiAgICAgICAgZ3JhcGguZWxzZUlmQnJhbmNoID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgZ3JhcGguZWxzZUlmTXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dC5jb25uZWN0KCBncmFwaC5lbHNlSWZNdWx0aXBseSwgMCwgMCApO1xuICAgICAgICBncmFwaC5wb3cuY29ubmVjdCggZ3JhcGguZWxzZUlmTXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguZWxzZUlmQnJhbmNoLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmVsc2VJZk11bHRpcGx5LmNvbm5lY3QoIGdyYXBoLmVsc2VJZkJyYW5jaCwgMCwgMSApO1xuXG4gICAgICAgIC8vIGxvd091dCArIChoaWdoT3V0IC0gbG93T3V0KSAqIC0oTWF0aC5wb3coICgtaW5wdXQgKyBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApKTtcbiAgICAgICAgZ3JhcGguZWxzZUJyYW5jaCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLmVsc2VNdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LmNvbm5lY3QoIGdyYXBoLmVsc2VNdWx0aXBseSwgMCwgMCApO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZVBvd05lZ2F0ZS5jb25uZWN0KCBncmFwaC5lbHNlTXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguZWxzZUJyYW5jaCwgMCwgMCApO1xuICAgICAgICBncmFwaC5lbHNlTXVsdGlwbHkuY29ubmVjdCggZ3JhcGguZWxzZUJyYW5jaCwgMCwgMSApO1xuXG5cblxuICAgICAgICAvLyBlbHNlIGlmKCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID4gMCApIHtcbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW5aZXJvID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhblplcm8oKTtcbiAgICAgICAgZ3JhcGguaWZHcmVhdGVyVGhhblplcm8gPSB0aGlzLmlvLmNyZWF0ZUlmRWxzZSgpO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW5aZXJvICk7XG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuWmVyby5jb25uZWN0KCBncmFwaC5pZkdyZWF0ZXJUaGFuWmVyby5pZiApO1xuICAgICAgICBncmFwaC5lbHNlSWZCcmFuY2guY29ubmVjdCggZ3JhcGguaWZHcmVhdGVyVGhhblplcm8udGhlbiApO1xuICAgICAgICBncmFwaC5lbHNlQnJhbmNoLmNvbm5lY3QoIGdyYXBoLmlmR3JlYXRlclRoYW5aZXJvLmVsc2UgKTtcblxuICAgICAgICAvLyBpZigoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID09PSAwKVxuICAgICAgICBncmFwaC5lcXVhbHNaZXJvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuICAgICAgICBncmFwaC5pZkVxdWFsc1plcm8gPSB0aGlzLmlvLmNyZWF0ZUlmRWxzZSgpO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggZ3JhcGguZXF1YWxzWmVybyApO1xuICAgICAgICBncmFwaC5lcXVhbHNaZXJvLmNvbm5lY3QoIGdyYXBoLmlmRXF1YWxzWmVyby5pZiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5pZkVxdWFsc1plcm8udGhlbiApO1xuICAgICAgICBncmFwaC5pZkdyZWF0ZXJUaGFuWmVyby5jb25uZWN0KCBncmFwaC5pZkVxdWFsc1plcm8uZWxzZSApO1xuXG4gICAgICAgIGdyYXBoLmlmRXF1YWxzWmVyby5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IGxvd0luKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5sb3dJbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd0luKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBoaWdoSW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmhpZ2hJbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGhpZ2hJbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEluLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGxvd091dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMubG93T3V0LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbG93T3V0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgaGlnaE91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuaGlnaE91dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGhpZ2hPdXQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgZXhwb25lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkuX2V4cG9uZW50LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgZXhwb25lbnQoIHZhbHVlICkge1xuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG4gICAgICAgIGdyYXBoLl9leHBvbmVudC52YWx1ZSA9IHZhbHVlO1xuICAgICAgICBncmFwaC5wb3cudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVQb3cudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2NhbGVFeHAgPSBmdW5jdGlvbiggbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHBvbmVudCApIHtcbiAgICByZXR1cm4gbmV3IFNjYWxlRXhwKCB0aGlzLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQsIGV4cG9uZW50ICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIFNpZ24gZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuU2lnbiApO1xuXG4gICAgICAgIGdyYXBoLmlmRWxzZSA9IHRoaXMuaW8uY3JlYXRlSWZFbHNlKCk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG9aZXJvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZXF1YWxUb1plcm8gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5pZkVsc2UudGhlbiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuXG4gICAgICAgIGdyYXBoLmVxdWFsVG9aZXJvLmNvbm5lY3QoIGdyYXBoLmlmRWxzZS5pZiApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggZ3JhcGguaWZFbHNlLmVsc2UgKTtcbiAgICAgICAgZ3JhcGguaWZFbHNlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNpZ24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFNpZ24oIHRoaXMgKTtcbn07XG4iLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NZXRob2RzX29mX2NvbXB1dGluZ19zcXVhcmVfcm9vdHMjRXhhbXBsZVxuLy9cbi8vIGZvciggdmFyIGkgPSAwLCB4OyBpIDwgc2lnRmlndXJlczsgKytpICkge1xuLy8gICAgICBpZiggaSA9PT0gMCApIHtcbi8vICAgICAgICAgIHggPSBzaWdGaWd1cmVzICogTWF0aC5wb3coIDEwLCAyICk7XG4vLyAgICAgIH1cbi8vICAgICAgZWxzZSB7XG4vLyAgICAgICAgICB4ID0gMC41ICogKCB4ICsgKGlucHV0IC8geCkgKTtcbi8vICAgICAgfVxuLy8gfVxuXG4vLyBUT0RPOlxuLy8gIC0gTWFrZSBzdXJlIFNxcnQgdXNlcyBnZXRHcmFwaCBhbmQgc2V0R3JhcGguXG5jbGFzcyBTcXJ0SGVscGVyIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHByZXZpb3VzU3RlcCwgaW5wdXQsIG1heElucHV0ICkge1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gaW8uY3JlYXRlTXVsdGlwbHkoIDAuNSApO1xuICAgICAgICB0aGlzLmRpdmlkZSA9IGlvLmNyZWF0ZURpdmlkZSggbnVsbCwgbWF4SW5wdXQgKTtcbiAgICAgICAgdGhpcy5hZGQgPSBpby5jcmVhdGVBZGQoKTtcblxuICAgICAgICAvLyBpbnB1dCAvIHg7XG4gICAgICAgIGlucHV0LmNvbm5lY3QoIHRoaXMuZGl2aWRlLCAwLCAwICk7XG4gICAgICAgIHByZXZpb3VzU3RlcC5vdXRwdXQuY29ubmVjdCggdGhpcy5kaXZpZGUsIDAsIDEgKTtcblxuICAgICAgICAvLyB4ICsgKCBpbnB1dCAvIHggKVxuICAgICAgICBwcmV2aW91c1N0ZXAub3V0cHV0LmNvbm5lY3QoIHRoaXMuYWRkLCAwLCAwICk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNvbm5lY3QoIHRoaXMuYWRkLCAwLCAxICk7XG5cbiAgICAgICAgLy8gMC41ICogKCB4ICsgKCBpbnB1dCAvIHggKSApXG4gICAgICAgIHRoaXMuYWRkLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkgKTtcblxuICAgICAgICB0aGlzLm91dHB1dCA9IHRoaXMubXVsdGlwbHk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5tdWx0aXBseS5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5hZGQuY2xlYW5VcCgpO1xuXG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSBudWxsO1xuICAgICAgICB0aGlzLmRpdmlkZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYWRkID0gbnVsbDtcbiAgICAgICAgdGhpcy5vdXRwdXQgPSBudWxsO1xuICAgIH1cbn1cblxuY2xhc3MgU3FydCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgc2lnbmlmaWNhbnRGaWd1cmVzLCBtYXhJbnB1dCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gRGVmYXVsdCB0byA2IHNpZ25pZmljYW50IGZpZ3VyZXMuXG4gICAgICAgIHNpZ25pZmljYW50RmlndXJlcyA9IHNpZ25pZmljYW50RmlndXJlcyB8fCA2O1xuXG4gICAgICAgIG1heElucHV0ID0gbWF4SW5wdXQgfHwgMTAwO1xuXG4gICAgICAgIHRoaXMueDAgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCBzaWduaWZpY2FudEZpZ3VyZXMgKiBNYXRoLnBvdyggMTAsIDIgKSApO1xuXG4gICAgICAgIHRoaXMuc3RlcHMgPSBbIHtcbiAgICAgICAgICAgIG91dHB1dDogdGhpcy54MFxuICAgICAgICB9IF07XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAxOyBpIDwgc2lnbmlmaWNhbnRGaWd1cmVzOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnB1c2goXG4gICAgICAgICAgICAgICAgbmV3IFNxcnRIZWxwZXIoIHRoaXMuaW8sIHRoaXMuc3RlcHNbIGkgLSAxIF0sIHRoaXMuaW5wdXRzWyAwIF0sIG1heElucHV0IClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0ZXBzWyB0aGlzLnN0ZXBzLmxlbmd0aCAtIDEgXS5vdXRwdXQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICAvLyBjbGVhblVwKCkge1xuICAgIC8vICAgICBzdXBlcigpO1xuXG4gICAgLy8gICAgIHRoaXMueDAuY2xlYW5VcCgpO1xuXG4gICAgLy8gICAgIHRoaXMuc3RlcHNbIDAgXSA9IG51bGw7XG5cbiAgICAvLyAgICAgZm9yKCB2YXIgaSA9IHRoaXMuc3RlcHMubGVuZ3RoIC0gMTsgaSA+PSAxOyAtLWkgKSB7XG4gICAgLy8gICAgICAgICB0aGlzLnN0ZXBzWyBpIF0uY2xlYW5VcCgpO1xuICAgIC8vICAgICAgICAgdGhpcy5zdGVwc1sgaSBdID0gbnVsbDtcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIHRoaXMueDAgPSBudWxsO1xuICAgIC8vICAgICB0aGlzLnN0ZXBzID0gbnVsbDtcbiAgICAvLyB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3FydCA9IGZ1bmN0aW9uKCBzaWduaWZpY2FudEZpZ3VyZXMsIG1heElucHV0ICkge1xuICAgIHJldHVybiBuZXcgU3FydCggdGhpcywgc2lnbmlmaWNhbnRGaWd1cmVzLCBtYXhJbnB1dCApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBTcXVhcmUgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3F1YXJlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBTcXVhcmUoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBTdWJ0cmFjdHMgdGhlIHNlY29uZCBpbnB1dCBmcm9tIHRoZSBmaXJzdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgU3VidHJhY3QgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubmVnYXRlID0gdGhpcy5pby5jcmVhdGVOZWdhdGUoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubmVnYXRlICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0ZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3VidHJhY3QgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBTdWJ0cmFjdCggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgU3dpdGNoIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyBFbnN1cmUgc3RhcnRpbmdDYXNlIGlzIG5ldmVyIDwgMFxuICAgICAgICBzdGFydGluZ0Nhc2UgPSB0eXBlb2Ygc3RhcnRpbmdDYXNlID09PSAnbnVtYmVyJyA/IE1hdGguYWJzKCBzdGFydGluZ0Nhc2UgKSA6IHN0YXJ0aW5nQ2FzZTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguY2FzZXMgPSBbXTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggc3RhcnRpbmdDYXNlICk7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgbnVtQ2FzZXM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXS5nYWluLnZhbHVlID0gMC4wO1xuICAgICAgICAgICAgZ3JhcGguY2FzZXNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbyggaSApO1xuICAgICAgICAgICAgZ3JhcGguY2FzZXNbIGkgXS5jb25uZWN0KCB0aGlzLmlucHV0c1sgaSBdLmdhaW4gKTtcbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuaW5kZXguY29ubmVjdCggZ3JhcGguY2FzZXNbIGkgXSApO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgY29udHJvbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuaW5kZXguY29udHJvbDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmluZGV4LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4LnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVN3aXRjaCA9IGZ1bmN0aW9uKCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICkge1xuICAgIHJldHVybiBuZXcgU3dpdGNoKCB0aGlzLCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIEFORCBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBTkQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEFORCggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQU5EOyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuY2xhc3MgTG9naWNhbE9wZXJhdG9yIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jbGFtcCA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAsIDEgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IGdyYXBoLmNsYW1wO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMb2dpY2FsT3BlcmF0b3I7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxvZ2ljYWxPcGVyYXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTG9naWNhbE9wZXJhdG9yKCB0aGlzICk7XG59OyIsIi8vIEFORCAtPiBOT1QgLT4gb3V0XG4vL1xuaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IExvZ2ljYWxPcGVyYXRvciBmcm9tIFwiLi9Mb2dpY2FsT3BlcmF0b3IuZXM2XCI7XG5cblxuY2xhc3MgTkFORCBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgZ3JhcGguQU5EID0gdGhpcy5pby5jcmVhdGVBTkQoKTtcbiAgICAgICAgZ3JhcGguTk9UID0gdGhpcy5pby5jcmVhdGVOT1QoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5BTkQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5BTkQsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguQU5ELmNvbm5lY3QoIGdyYXBoLk5PVCApO1xuICAgICAgICBncmFwaC5OT1QuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTkFORCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTkFORCggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTkFORDsiLCIvLyBPUiAtPiBOT1QgLT4gb3V0XG5pbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTG9naWNhbE9wZXJhdG9yIGZyb20gXCIuL0xvZ2ljYWxPcGVyYXRvci5lczZcIjtcblxuXG5jbGFzcyBOT1IgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG4gICAgICAgIGdyYXBoLk9SID0gdGhpcy5pby5jcmVhdGVPUigpO1xuICAgICAgICBncmFwaC5OT1QgPSB0aGlzLmlvLmNyZWF0ZU5PVCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLk9SLCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGguT1IsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguT1IuY29ubmVjdCggZ3JhcGguTk9UICk7XG4gICAgICAgIGdyYXBoLk5PVC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOT1IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE5PUiggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTk9SOyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIE5PVCBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5hYnMgPSB0aGlzLmlvLmNyZWF0ZUFicyggMTAwICk7XG4gICAgICAgIGdyYXBoLnN1YnRyYWN0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCggMSApO1xuICAgICAgICBncmFwaC5yb3VuZCA9IHRoaXMuaW8uY3JlYXRlUm91bmQoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnN1YnRyYWN0ICk7XG4gICAgICAgIGdyYXBoLnN1YnRyYWN0LmNvbm5lY3QoIGdyYXBoLmFicyApO1xuICAgICAgICBncmFwaC5hYnMuY29ubmVjdCggZ3JhcGgucm91bmQgKVxuXG4gICAgICAgIGdyYXBoLnJvdW5kLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5PVCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTk9UKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOT1Q7IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IExvZ2ljYWxPcGVyYXRvciBmcm9tIFwiLi9Mb2dpY2FsT3BlcmF0b3IuZXM2XCI7XG5cblxuY2xhc3MgT1IgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubWF4ID0gdGhpcy5pby5jcmVhdGVNYXgoKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUbyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbyggMSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVDbGFtcCggMCwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubWF4ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubWF4LmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgIGdyYXBoLm1heC5jb25uZWN0KCBncmFwaC5lcXVhbFRvICk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlT1IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9SKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBPUjtcbiIsIi8vIGEgZXF1YWxUbyggYiApIC0+IE5PVCAtPiBvdXRcbmltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIFhPUiBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUbyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbygpO1xuICAgICAgICBncmFwaC5OT1QgPSB0aGlzLmlvLmNyZWF0ZU5PVCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmVxdWFsVG8gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5lcXVhbFRvLmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8uY29ubmVjdCggZ3JhcGguTk9UICk7XG4gICAgICAgIGdyYXBoLk5PVC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVYT1IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFhPUiggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgWE9SOyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIGdhaW4oKzEwMDAwMCkgLT4gc2hhcGVyKCA8PSAwOiAxLCAxIClcbmNsYXNzIEVxdWFsVG8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgLy8gVE9ET1xuICAgICAgICAvLyAgLSBSZW5hbWUgdGhpcy5cbiAgICAgICAgZ3JhcGgudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApLFxuICAgICAgICBncmFwaC5pbnZlcnNpb24gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuXG4gICAgICAgIGdyYXBoLmludmVyc2lvbi5nYWluLnZhbHVlID0gLTE7XG5cbiAgICAgICAgLy8gVGhpcyBjdXJ2ZSBvdXRwdXRzIDAuNSB3aGVuIGlucHV0IGlzIDAsXG4gICAgICAgIC8vIHNvIGl0IGhhcyB0byBiZSBwaXBlZCBpbnRvIGEgbm9kZSB0aGF0XG4gICAgICAgIC8vIHRyYW5zZm9ybXMgaXQgaW50byAxLCBhbmQgbGVhdmVzIHplcm9zXG4gICAgICAgIC8vIGFsb25lLlxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkVxdWFsVG9aZXJvICk7XG5cbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW5aZXJvID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhblplcm8oKTtcbiAgICAgICAgZ3JhcGgudmFsdWUuY29ubmVjdCggZ3JhcGguaW52ZXJzaW9uICk7XG4gICAgICAgIGdyYXBoLmludmVyc2lvbi5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIGdyYXBoLmdyZWF0ZXJUaGFuWmVybyApO1xuICAgICAgICBncmFwaC5ncmVhdGVyVGhhblplcm8uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gZ3JhcGgudmFsdWU7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVFcXVhbFRvID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgRXF1YWxUbyggdGhpcywgdmFsdWUgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEVxdWFsVG87IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcbmltcG9ydCBFcXVhbFRvIGZyb20gXCIuL0VxdWFsVG8uZXM2XCI7XG5cbi8vIEhhdmVuJ3QgcXVpdGUgZmlndXJlZCBvdXQgd2h5IHlldCwgYnV0IHRoaXMgcmV0dXJucyAwIHdoZW4gaW5wdXQgaXMgMC5cbi8vIEl0IHNob3VsZCByZXR1cm4gMS4uLlxuLy9cbi8vIEZvciBub3csIEknbSBqdXN0IHVzaW5nIHRoZSBFcXVhbFRvIG5vZGUgd2l0aCBhIHN0YXRpYyAwIGFyZ3VtZW50LlxuLy8gLS0tLS0tLS1cbi8vXG4vLyBjbGFzcyBFcXVhbFRvWmVybyBleHRlbmRzIE5vZGUge1xuLy8gICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbi8vICAgICAgICAgc3VwZXIoIGlvLCAxLCAwICk7XG5cbi8vICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gMTAwMDAwO1xuXG4vLyAgICAgICAgIC8vIFRoaXMgb3V0cHV0cyAwLjUgd2hlbiBpbnB1dCBpcyAwLFxuLy8gICAgICAgICAvLyBzbyBpdCBoYXMgdG8gYmUgcGlwZWQgaW50byBhIG5vZGUgdGhhdFxuLy8gICAgICAgICAvLyB0cmFuc2Zvcm1zIGl0IGludG8gMSwgYW5kIGxlYXZlcyB6ZXJvc1xuLy8gICAgICAgICAvLyBhbG9uZS5cbi8vICAgICAgICAgdGhpcy5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkVxdWFsVG9aZXJvICk7XG5cbi8vICAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZUdyZWF0ZXJUaGFuKCAwICk7XG5cbi8vICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnNoYXBlciApO1xuLy8gICAgICAgICB0aGlzLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuLy8gICAgIH1cblxuLy8gICAgIGNsZWFuVXAoKSB7XG4vLyAgICAgICAgIHN1cGVyKCk7XG5cbi8vICAgICAgICAgdGhpcy5zaGFwZXIuY2xlYW5VcCgpO1xuLy8gICAgICAgICB0aGlzLnNoYXBlciA9IG51bGw7XG4vLyAgICAgfVxuLy8gfVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVFcXVhbFRvWmVybyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIHJldHVybiBuZXcgRXF1YWxUb1plcm8oIHRoaXMgKTtcblxuICAgIHJldHVybiBuZXcgRXF1YWxUbyggdGhpcywgMCApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBHcmVhdGVyVGhhbiBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgZ3JhcGguaW52ZXJzaW9uID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICBncmFwaC5pbnZlcnNpb24uZ2Fpbi52YWx1ZSA9IC0xO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDEwMDAwMDtcbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5HcmVhdGVyVGhhblplcm8gKTtcblxuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGguaW52ZXJzaW9uICk7XG4gICAgICAgIGdyYXBoLmludmVyc2lvbi5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlR3JlYXRlclRoYW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBHcmVhdGVyVGhhbiggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgR3JlYXRlclRoYW5FcXVhbFRvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuICAgICAgICBncmFwaC5ncmVhdGVyVGhhbiA9IHRoaXMuaW8uY3JlYXRlR3JlYXRlclRoYW4oKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUbyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbygpO1xuICAgICAgICBncmFwaC5PUiA9IHRoaXMuaW8uY3JlYXRlT1IoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNvbm5lY3QoIGdyYXBoLmdyZWF0ZXJUaGFuLmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGguZXF1YWxUby5jb250cm9scy52YWx1ZSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5lcXVhbFRvICk7XG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuLmNvbm5lY3QoIGdyYXBoLk9SLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8uY29ubmVjdCggZ3JhcGguT1IsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguT1IuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUdyZWF0ZXJUaGFuRXF1YWxUbyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IEdyZWF0ZXJUaGFuRXF1YWxUbyggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgR3JlYXRlclRoYW5aZXJvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gMTAwMDAwO1xuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkdyZWF0ZXJUaGFuWmVybyApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlR3JlYXRlclRoYW5aZXJvID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBHcmVhdGVyVGhhblplcm8oIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgSWZFbHNlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDAgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguc3dpdGNoID0gdGhpcy5pby5jcmVhdGVTd2l0Y2goIDIsIDAgKTtcblxuICAgICAgICB0aGlzLmlmID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuICAgICAgICB0aGlzLmlmLmNvbm5lY3QoIGdyYXBoLnN3aXRjaC5jb250cm9sICk7XG4gICAgICAgIHRoaXMudGhlbiA9IGdyYXBoLnN3aXRjaC5pbnB1dHNbIDAgXTtcbiAgICAgICAgdGhpcy5lbHNlID0gZ3JhcGguc3dpdGNoLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gZ3JhcGguc3dpdGNoLmlucHV0cztcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gZ3JhcGguc3dpdGNoLm91dHB1dHM7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUlmRWxzZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSWZFbHNlKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIExlc3NUaGFuIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIGdyYXBoLnZhbHVlSW52ZXJzaW9uID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgudmFsdWVJbnZlcnNpb24uZ2Fpbi52YWx1ZSA9IC0xO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGgudmFsdWVJbnZlcnNpb24gKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAtMTAwMDAwO1xuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkdyZWF0ZXJUaGFuWmVybyApO1xuXG4gICAgICAgIGdyYXBoLnZhbHVlSW52ZXJzaW9uLmNvbm5lY3QoIHRoaXMuaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVMZXNzVGhhbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IExlc3NUaGFuKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMZXNzVGhhbkVxdWFsVG8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIGdyYXBoLmxlc3NUaGFuID0gdGhpcy5pby5jcmVhdGVMZXNzVGhhbigpO1xuICAgICAgICBncmFwaC5lcXVhbFRvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvKCk7XG4gICAgICAgIGdyYXBoLk9SID0gdGhpcy5pby5jcmVhdGVPUigpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGgubGVzc1RoYW4uY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5jb25uZWN0KCBncmFwaC5lcXVhbFRvLmNvbnRyb2xzLnZhbHVlICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5sZXNzVGhhbiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmVxdWFsVG8gKTtcbiAgICAgICAgZ3JhcGgubGVzc1RoYW4uY29ubmVjdCggZ3JhcGguT1IsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUby5jb25uZWN0KCBncmFwaC5PUiwgMCwgMSApO1xuICAgICAgICBncmFwaC5PUi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVzc1RoYW5FcXVhbFRvID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgTGVzc1RoYW5FcXVhbFRvKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMZXNzVGhhblplcm8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5ib29zdGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguYm9vc3Rlci5nYWluLnZhbHVlID0gLTEwMDAwMDtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5ib29zdGVyICk7XG5cbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5HcmVhdGVyVGhhblplcm8gKTtcblxuICAgICAgICBncmFwaC5ib29zdGVyLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVzc1RoYW5aZXJvID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBMZXNzVGhhblplcm8oIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gQ29zaW5lIGFwcHJveGltYXRpb24hXG4vL1xuLy8gT25seSB3b3JrcyBpbiByYW5nZSBvZiAtTWF0aC5QSSB0byBNYXRoLlBJLlxuY2xhc3MgQ29zIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgZ3JhcGguc3F1YXJlID0gdGhpcy5pby5jcmVhdGVTcXVhcmUoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkxID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggLTIuNjA1ZS03ICk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5MiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkzID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTQgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5NSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICBncmFwaC5hZGQxID0gdGhpcy5pby5jcmVhdGVBZGQoIDIuNDc2MDllLTUgKTtcbiAgICAgICAgZ3JhcGguYWRkMiA9IHRoaXMuaW8uY3JlYXRlQWRkKCAtMC4wMDEzODg4NCApO1xuICAgICAgICBncmFwaC5hZGQzID0gdGhpcy5pby5jcmVhdGVBZGQoIDAuMDQxNjY2NiApO1xuICAgICAgICBncmFwaC5hZGQ0ID0gdGhpcy5pby5jcmVhdGVBZGQoIC0wLjQ5OTkyMyApO1xuICAgICAgICBncmFwaC5hZGQ1ID0gdGhpcy5pby5jcmVhdGVBZGQoIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNxdWFyZSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgbXVsdGlwbHkxJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTEsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGFkZDEncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkxLmNvbm5lY3QoIGdyYXBoLmFkZDEsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIG11bHRpcGx5MidzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkyLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDEuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkyLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBhZGQyJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5Mi5jb25uZWN0KCBncmFwaC5hZGQyLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBtdWx0aXBseTMncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MywgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQyLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MywgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgYWRkMydzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTMuY29ubmVjdCggZ3JhcGguYWRkMywgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgbXVsdGlwbHk0J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTQsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkMy5jb25uZWN0KCBncmFwaC5tdWx0aXBseTQsIDAsIDEgKTtcblxuICAgICAgICAvLyBhZGQ0J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5NC5jb25uZWN0KCBncmFwaC5hZGQ0LCAwLCAwICk7XG5cbiAgICAgICAgLy8gbXVsdGlwbHk1J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkNC5jb25uZWN0KCBncmFwaC5tdWx0aXBseTUsIDAsIDEgKTtcblxuICAgICAgICAvLyBhZGQ1J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5NS5jb25uZWN0KCBncmFwaC5hZGQ1LCAwLCAwICk7XG5cbiAgICAgICAgLy8gT3V0cHV0IChmaW5hbGx5ISEpXG4gICAgICAgIGdyYXBoLmFkZDUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDAgXTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29zID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgQ29zKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBEZWdUb1JhZCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIE1hdGguUEkgLyAxODAgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZURlZ1RvUmFkID0gZnVuY3Rpb24oIGRlZyApIHtcbiAgICByZXR1cm4gbmV3IERlZ1RvUmFkKCB0aGlzLCBkZWcgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgUmFkVG9EZWcgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAxODAgLyBNYXRoLlBJICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVSYWRUb0RlZyA9IGZ1bmN0aW9uKCBkZWcgKSB7XG4gICAgcmV0dXJuIG5ldyBSYWRUb0RlZyggdGhpcywgZGVnICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIFNpbiBhcHByb3hpbWF0aW9uIVxuLy9cbi8vIE9ubHkgd29ya3MgaW4gcmFuZ2Ugb2YgLU1hdGguUEkgdG8gTWF0aC5QSS5cbmNsYXNzIFNpbiBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICBncmFwaC5zcXVhcmUgPSB0aGlzLmlvLmNyZWF0ZVNxdWFyZSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTEgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAtMi4zOWUtOCApO1xuICAgICAgICBncmFwaC5tdWx0aXBseTIgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5MyA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk0ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTUgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5NiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICBncmFwaC5hZGQxID0gdGhpcy5pby5jcmVhdGVBZGQoIDIuNzUyNmUtNiApO1xuICAgICAgICBncmFwaC5hZGQyID0gdGhpcy5pby5jcmVhdGVBZGQoIC0wLjAwMDE5ODQwOSApO1xuICAgICAgICBncmFwaC5hZGQzID0gdGhpcy5pby5jcmVhdGVBZGQoIDAuMDA4MzMzMzMgKTtcbiAgICAgICAgZ3JhcGguYWRkNCA9IHRoaXMuaW8uY3JlYXRlQWRkKCAtMC4xNjY2NjcgKTtcbiAgICAgICAgZ3JhcGguYWRkNSA9IHRoaXMuaW8uY3JlYXRlQWRkKCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zcXVhcmUgKTtcblxuICAgICAgICAvLyBDb25uZWN0IG11bHRpcGx5MSdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkxLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBhZGQxJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5MS5jb25uZWN0KCBncmFwaC5hZGQxLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBtdWx0aXBseTIncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MiwgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQxLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MiwgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgYWRkMidzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTIuY29ubmVjdCggZ3JhcGguYWRkMiwgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgbXVsdGlwbHkzJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTMsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkMi5jb25uZWN0KCBncmFwaC5tdWx0aXBseTMsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGFkZDMncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkzLmNvbm5lY3QoIGdyYXBoLmFkZDMsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IG11bHRpcGx5NCdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk0LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDMuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNCdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTQuY29ubmVjdCggZ3JhcGguYWRkNCwgMCwgMCApO1xuXG4gICAgICAgIC8vIG11bHRpcGx5NSdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk1LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDQuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk1LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNSdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTUuY29ubmVjdCggZ3JhcGguYWRkNSwgMCwgMCApO1xuXG4gICAgICAgIC8vIG11bHRpcGx5NidzIGlucHV0c1xuICAgICAgICB0aGlzLmlucHV0c1swXS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTYsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkNS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTYsIDAsIDEgKTtcblxuICAgICAgICAvLyBPdXRwdXQgKGZpbmFsbHkhISlcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk2LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNpbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFNpbiggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gVGFuZ2VudCBhcHByb3hpbWF0aW9uIVxuLy9cbi8vIE9ubHkgd29ya3MgaW4gcmFuZ2Ugb2YgLU1hdGguUEkgdG8gTWF0aC5QSS5cbi8vXG4vLyBzaW4oIGlucHV0ICkgLyBjb3MoIGlucHV0IClcbmNsYXNzIFRhbiBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICBncmFwaC5zaW5lID0gdGhpcy5pby5jcmVhdGVTaW4oKTtcbiAgICAgICAgZ3JhcGguY29zID0gdGhpcy5pby5jcmVhdGVDb3MoKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoIHVuZGVmaW5lZCwgTWF0aC5QSSAqIDIgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNpbmUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5jb3MgKTtcbiAgICAgICAgZ3JhcGguc2luZS5jb25uZWN0KCBncmFwaC5kaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguY29zLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLmRpdmlkZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVUYW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBUYW4oIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBDT05GSUcgZnJvbSBcIi4uL2NvcmUvY29uZmlnLmVzNlwiO1xuXG5mdW5jdGlvbiBQaW5rTnVtYmVyKCkge1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy53aGl0ZVZhbHVlcyA9IFtdO1xuICAgIHRoaXMucmFuZ2UgPSAxMjg7XG4gICAgdGhpcy5saW1pdCA9IDU7XG5cbiAgICB0aGlzLmdlbmVyYXRlID0gdGhpcy5nZW5lcmF0ZS5iaW5kKCB0aGlzICk7XG4gICAgdGhpcy5nZXROZXh0VmFsdWUgPSB0aGlzLmdldE5leHRWYWx1ZS5iaW5kKCB0aGlzICk7XG59XG5cblBpbmtOdW1iZXIucHJvdG90eXBlLmdlbmVyYXRlID0gZnVuY3Rpb24oIHJhbmdlLCBsaW1pdCApIHtcbiAgICB0aGlzLnJhbmdlID0gcmFuZ2UgfHwgMTI4O1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy5saW1pdCA9IGxpbWl0IHx8IDE7XG5cblx0dmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICB9XG59O1xuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZXROZXh0VmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGFzdEtleSA9IHRoaXMua2V5LFxuICAgICAgICBzdW0gPSAwO1xuXG4gICAgKyt0aGlzLmtleTtcblxuICAgIGlmKCB0aGlzLmtleSA+IHRoaXMubWF4S2V5ICkge1xuICAgICAgICB0aGlzLmtleSA9IDA7XG4gICAgfVxuXG4gICAgdmFyIGRpZmYgPSB0aGlzLmxhc3RLZXkgXiB0aGlzLmtleTtcbiAgICB2YXIgcmFuZ2VMaW1pdCA9IHRoaXMucmFuZ2UgLyB0aGlzLmxpbWl0O1xuXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbWl0OyArK2kgKSB7XG4gICAgICAgIGlmKCBkaWZmICYgKDEgPDwgaSkgKSB7XG4gICAgICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1bSArPSB0aGlzLndoaXRlVmFsdWVzWyBpIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bSAvIHRoaXMubGltaXQ7XG59O1xuXG52YXIgcGluayA9IG5ldyBQaW5rTnVtYmVyKCk7XG5waW5rLmdlbmVyYXRlKCk7XG5cblxuXG5cblxuZXhwb3J0IGRlZmF1bHQge1xuXHRyb3VuZEZyb21FcHNpbG9uOiBmdW5jdGlvbiggbiApIHtcblx0XHRsZXQgcm91bmRlZCA9IE1hdGgucm91bmQoIG4gKTtcblxuXHRcdGlmICggcm91bmRlZCAlIG4gPCBDT05GSUcuZXBzaWxvbiApIHtcblx0XHRcdHJldHVybiByb3VuZGVkXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIG47XG5cdFx0fVxuXHR9LFxuXG5cdHJvdW5kVG9NdWx0aXBsZTogZnVuY3Rpb24oIG4sIG11bHRpcGxlICkge1xuXHRcdHJldHVybiBNYXRoLmZsb29yKCAoIG4gKyBtdWx0aXBsZSAtIDEgKSAvIG11bHRpcGxlICkgKiBtdWx0aXBsZTtcblx0fSxcblxuXHRjbGFtcDogZnVuY3Rpb24oIHZhbHVlLCBtaW4sIG1heCApIHtcblx0XHRyZXR1cm4gTWF0aC5taW4oIG1heCwgTWF0aC5tYXgoIHZhbHVlLCBtaW4gKSApO1xuXHR9LFxuXG5cdHNjYWxlTnVtYmVyOiBmdW5jdGlvbiggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG5cdFx0cmV0dXJuICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICkgKiAoIGhpZ2hPdXQgLSBsb3dPdXQgKSArIGxvd091dDtcblx0fSxcblxuXHRzY2FsZU51bWJlckV4cDogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHAgKSB7XG5cdFx0aWYgKCB0eXBlb2YgZXhwICE9PSAnbnVtYmVyJyB8fCBleHAgPT09IDEgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5zY2FsZU51bWJlciggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKTtcblx0XHR9XG5cblx0XHRpZiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSA9PT0gMCApIHtcblx0XHRcdHJldHVybiBsb3dPdXQ7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPiAwICkge1xuXHRcdFx0XHRyZXR1cm4gKCBsb3dPdXQgKyAoIGhpZ2hPdXQgLSBsb3dPdXQgKSAqIE1hdGgucG93KCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICksIGV4cCApICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiAtKCBNYXRoLnBvdyggKCAoIC1udW0gKyBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICksIGV4cCApICkgKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Ly8gQSB2ZXJ5IHBvb3IgYXBwcm94aW1hdGlvbiBvZiBhIGdhdXNzaWFuIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yIVxuXHRnYXVzc2lhblJhbmRvbTogZnVuY3Rpb24oIGN5Y2xlcyApIHtcblx0XHRjeWNsZXMgPSBjeWNsZXMgfHwgMTA7XG5cblx0XHR2YXIgbiA9IDAsXG5cdFx0XHRpID0gY3ljbGVzO1xuXG5cdFx0d2hpbGUoIC0taSApIHtcblx0XHRcdG4gKz0gTWF0aC5yYW5kb20oKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbiAvIGN5Y2xlcztcblx0fSxcblxuXHQvLyBGcm9tOlxuXHQvLyBcdGh0dHA6Ly93d3cubWVyZWRpdGhkb2RnZS5jb20vMjAxMi8wNS8zMC9hLWdyZWF0LWxpdHRsZS1qYXZhc2NyaXB0LWZ1bmN0aW9uLWZvci1nZW5lcmF0aW5nLXJhbmRvbS1nYXVzc2lhbm5vcm1hbGJlbGwtY3VydmUtbnVtYmVycy9cblx0bnJhbmQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB4MSxcblx0XHRcdHgyLFxuXHRcdFx0cmFkLFxuXHRcdFx0eTE7XG5cblx0XHRkbyB7XG5cdFx0XHR4MSA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHgyID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuXHRcdFx0cmFkID0geDEgKiB4MSArIHgyICogeDI7XG5cdFx0fSB3aGlsZSggcmFkID49IDEgfHwgcmFkID09PSAwICk7XG5cblx0XHR2YXIgYyA9IE1hdGguc3FydCggLTIgKiBNYXRoLmxvZyggcmFkICkgLyByYWQgKTtcblxuXHRcdHJldHVybiAoKHgxICogYykgLyA1KSAqIDAuNSArIDAuNTtcblx0fSxcblxuXHRnZW5lcmF0ZVBpbmtOdW1iZXI6IHBpbmsuZ2VuZXJhdGUsXG5cdGdldE5leHRQaW5rTnVtYmVyOiBwaW5rLmdldE5leHRWYWx1ZSxcblxufTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgY2xlYW5VcEluT3V0czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbnB1dHMsXG4gICAgICAgICAgICBvdXRwdXRzO1xuXG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KCB0aGlzLmlucHV0cyApICkge1xuICAgICAgICAgICAgaW5wdXRzID0gdGhpcy5pbnB1dHM7XG5cbiAgICAgICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgIGlmKCBpbnB1dHNbIGkgXSAmJiB0eXBlb2YgaW5wdXRzWyBpIF0uY2xlYW5VcCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRzWyBpIF0uY2xlYW5VcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBpbnB1dHNbIGkgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRzWyBpIF0uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlucHV0c1sgaSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5pbnB1dHMgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIEFycmF5LmlzQXJyYXkoIHRoaXMub3V0cHV0cyApICkge1xuICAgICAgICAgICAgb3V0cHV0cyA9IHRoaXMub3V0cHV0cztcblxuICAgICAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBvdXRwdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgIGlmKCBvdXRwdXRzWyBpIF0gJiYgdHlwZW9mIG91dHB1dHNbIGkgXS5jbGVhblVwID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRzWyBpIF0uY2xlYW5VcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBvdXRwdXRzWyBpIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dHNbIGkgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb3V0cHV0c1sgaSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5vdXRwdXRzID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjbGVhbklPOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYoIHRoaXMuaW8gKSB7XG4gICAgICAgICAgICB0aGlzLmlvID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCB0aGlzLmNvbnRleHQgKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufTsiLCJ2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBjb25uZWN0OiBmdW5jdGlvbiggbm9kZSwgb3V0cHV0Q2hhbm5lbCA9IDAsIGlucHV0Q2hhbm5lbCA9IDAgKSB7XG4gICAgICAgIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gfHwgbm9kZSBpbnN0YW5jZW9mIEF1ZGlvTm9kZSApIHtcbiAgICAgICAgICAgIC8vIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmNvbm5lY3QoIG5vZGUgKTtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmNvbm5lY3QuY2FsbCggdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0sIG5vZGUsIDAsIGlucHV0Q2hhbm5lbCApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgJiYgbm9kZS5vdXRwdXRzICYmIG5vZGUub3V0cHV0cy5sZW5ndGggKSB7XG4gICAgICAgICAgICAvLyBpZiggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdIGluc3RhbmNlb2YgUGFyYW0gKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggJ0NPTk5FQ1RJTkcgVE8gUEFSQU0nICk7XG4gICAgICAgICAgICAvLyBub2RlLmlvLmNvbnN0YW50RHJpdmVyLmRpc2Nvbm5lY3QoIG5vZGUuY29udHJvbCApO1xuICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXS5jb25uZWN0KCBub2RlLmlucHV0c1sgaW5wdXRDaGFubmVsIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvciggJ0FTU0VSVCBOT1QgUkVBQ0hFRCcgKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkaXNjb25uZWN0OiBmdW5jdGlvbiggbm9kZSwgb3V0cHV0Q2hhbm5lbCA9IDAsIGlucHV0Q2hhbm5lbCA9IDAgKSB7XG4gICAgICAgIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gfHwgbm9kZSBpbnN0YW5jZW9mIEF1ZGlvTm9kZSApIHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmRpc2Nvbm5lY3QuY2FsbCggdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0sIG5vZGUsIDAsIGlucHV0Q2hhbm5lbCApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgJiYgbm9kZS5pbnB1dHMgJiYgbm9kZS5pbnB1dHMubGVuZ3RoICkge1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0uZGlzY29ubmVjdCggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdICk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICggbm9kZSA9PT0gdW5kZWZpbmVkICYmIHRoaXMub3V0cHV0cyApIHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0cy5mb3JFYWNoKCBmdW5jdGlvbiggbiApIHtcbiAgICAgICAgICAgICAgICBpZiAoIG4gJiYgdHlwZW9mIG4uZGlzY29ubmVjdCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICAgICAgbi5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNoYWluOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVzID0gc2xpY2UuY2FsbCggYXJndW1lbnRzICksXG4gICAgICAgICAgICBub2RlID0gdGhpcztcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdC5jYWxsKCBub2RlLCBub2Rlc1sgaSBdICk7XG4gICAgICAgICAgICBub2RlID0gbm9kZXNbIGkgXTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBmYW46IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZXMgPSBzbGljZS5jYWxsKCBhcmd1bWVudHMgKSxcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgbm9kZS5jb25uZWN0LmNhbGwoIG5vZGUsIG5vZGVzWyBpIF0gKTtcbiAgICAgICAgfVxuICAgIH1cbn07IiwiaW1wb3J0IG1hdGggZnJvbSBcIi4vbWF0aC5lczZcIjtcbmltcG9ydCBub3RlU3RyaW5ncyBmcm9tIFwiLi9ub3RlU3RyaW5ncy5lczZcIjtcbmltcG9ydCBub3RlcyBmcm9tIFwiLi9ub3Rlcy5lczZcIjtcbmltcG9ydCBDT05GSUcgZnJvbSBcIi4uL2NvcmUvY29uZmlnLmVzNlwiO1xuaW1wb3J0IG5vdGVSZWdFeHAgZnJvbSBcIi4vbm90ZVJlZ0V4cC5lczZcIjtcblxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgc2NhbGFyVG9EYjogZnVuY3Rpb24oIHNjYWxhciApIHtcbiAgICAgICAgcmV0dXJuIDIwICogKCBNYXRoLmxvZyggc2NhbGFyICkgLyBNYXRoLkxOMTAgKTtcbiAgICB9LFxuICAgIGRiVG9TY2FsYXI6IGZ1bmN0aW9uKCBkYiApIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KCAyLCBkYiAvIDYgKTtcbiAgICB9LFxuXG4gICAgaHpUb01JREk6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIG1hdGgucm91bmRGcm9tRXBzaWxvbiggNjkgKyAxMiAqIE1hdGgubG9nMiggdmFsdWUgLyA0NDAgKSApO1xuICAgIH0sXG5cbiAgICBoelRvTm90ZTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9Ob3RlKCB0aGlzLmh6VG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGh6VG9NczogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICBpZiAoIHZhbHVlID09PSAwICkgcmV0dXJuIDA7XG4gICAgICAgIHJldHVybiAxMDAwIC8gdmFsdWU7XG4gICAgfSxcblxuICAgIGh6VG9CUE06IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0JQTSggdGhpcy5oelRvTXMoIHZhbHVlICkgKTtcbiAgICB9LFxuXG5cblxuICAgIG1pZGlUb0h6OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnBvdyggMiwgKCB2YWx1ZSAtIDY5ICkgLyAxMiApICogNDQwO1xuICAgIH0sXG5cbiAgICBtaWRpVG9Ob3RlOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIGxldCB2YWx1ZXMgPSAoIHZhbHVlICsgJycgKS5zcGxpdCggJy4nICksXG4gICAgICAgICAgICBub3RlVmFsdWUgPSArdmFsdWVzWyAwIF0sXG4gICAgICAgICAgICBjZW50cyA9ICggdmFsdWVzWyAxIF0gPyBwYXJzZUZsb2F0KCAnMC4nICsgdmFsdWVzWyAxIF0sIDEwICkgOiAwICkgKiAxMDA7XG5cbiAgICAgICAgaWYgKCBNYXRoLmFicyggY2VudHMgKSA+PSAxMDAgKSB7XG4gICAgICAgICAgICBub3RlVmFsdWUgKz0gY2VudHMgJSAxMDA7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcm9vdCA9IG5vdGVWYWx1ZSAlIDEyIHwgMCxcbiAgICAgICAgICAgIG9jdGF2ZSA9IG5vdGVWYWx1ZSAvIDEyIHwgMCxcbiAgICAgICAgICAgIG5vdGVOYW1lID0gbm90ZVN0cmluZ3NbIHJvb3QgXTtcblxuICAgICAgICByZXR1cm4gbm90ZU5hbWUgKyAoIG9jdGF2ZSArIENPTkZJRy5sb3dlc3RPY3RhdmUgKSArICggY2VudHMgPyAnKycgKyBjZW50cyA6ICcnICk7XG4gICAgfSxcblxuICAgIG1pZGlUb01zOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmh6VG9NcyggdGhpcy5taWRpVG9IeiggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBtaWRpVG9CUE06IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0JQTSggdGhpcy5taWRpVG9NcyggdmFsdWUgKSApO1xuICAgIH0sXG5cblxuXG4gICAgbm90ZVRvSHo6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvSHooIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBub3RlVG9NSURJOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIGxldCBtYXRjaGVzID0gbm90ZVJlZ0V4cC5leGVjKCB2YWx1ZSApLFxuICAgICAgICAgICAgbm90ZSwgYWNjaWRlbnRhbCwgb2N0YXZlLCBjZW50cyxcbiAgICAgICAgICAgIG5vdGVWYWx1ZTtcblxuICAgICAgICBpZiAoICFtYXRjaGVzICkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCAnSW52YWxpZCBub3RlIGZvcm1hdDonLCB2YWx1ZSApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbm90ZSA9IG1hdGNoZXNbIDEgXTtcbiAgICAgICAgYWNjaWRlbnRhbCA9IG1hdGNoZXNbIDIgXTtcbiAgICAgICAgb2N0YXZlID0gcGFyc2VJbnQoIG1hdGNoZXNbIDMgXSwgMTAgKSArIC1DT05GSUcubG93ZXN0T2N0YXZlO1xuICAgICAgICBjZW50cyA9IHBhcnNlRmxvYXQoIG1hdGNoZXNbIDQgXSApIHx8IDA7XG5cbiAgICAgICAgbm90ZVZhbHVlID0gbm90ZXNbIG5vdGUgKyBhY2NpZGVudGFsIF07XG5cbiAgICAgICAgcmV0dXJuIG1hdGgucm91bmRGcm9tRXBzaWxvbiggbm90ZVZhbHVlICsgKCBvY3RhdmUgKiAxMiApICsgKCBjZW50cyAqIDAuMDEgKSApO1xuICAgIH0sXG5cbiAgICBub3RlVG9NczogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9NcyggdGhpcy5ub3RlVG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIG5vdGVUb0JQTTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9CUE0oIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cblxuXG4gICAgbXNUb0h6OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmh6VG9NcyggdmFsdWUgKTtcbiAgICB9LFxuXG4gICAgbXNUb05vdGU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvTXMoIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBtc1RvTUlESTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5oelRvTUlESSggdGhpcy5tc1RvSHooIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbXNUb0JQTTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IDAgPyAwIDogNjAwMDAgLyB2YWx1ZTtcbiAgICB9LFxuXG5cblxuICAgIGJwbVRvSHo6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0h6KCB0aGlzLmJwbVRvTXMoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgYnBtVG9Ob3RlOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb0JQTSggdGhpcy5ub3RlVG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGJwbVRvTUlESTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5tc1RvTUlESSggdGhpcy5icG1Ub01zKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGJwbVRvTXM6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0JQTSggdmFsdWUgKTtcbiAgICB9XG59OyIsImltcG9ydCBDT05GSUcgZnJvbSBcIi4uL2NvcmUvY29uZmlnLmVzNlwiO1xuXG5mdW5jdGlvbiBQaW5rTnVtYmVyKCkge1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy53aGl0ZVZhbHVlcyA9IFtdO1xuICAgIHRoaXMucmFuZ2UgPSAxMjg7XG4gICAgdGhpcy5saW1pdCA9IDU7XG5cbiAgICB0aGlzLmdlbmVyYXRlID0gdGhpcy5nZW5lcmF0ZS5iaW5kKCB0aGlzICk7XG4gICAgdGhpcy5nZXROZXh0VmFsdWUgPSB0aGlzLmdldE5leHRWYWx1ZS5iaW5kKCB0aGlzICk7XG59XG5cblBpbmtOdW1iZXIucHJvdG90eXBlLmdlbmVyYXRlID0gZnVuY3Rpb24oIHJhbmdlLCBsaW1pdCApIHtcbiAgICB0aGlzLnJhbmdlID0gcmFuZ2UgfHwgMTI4O1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy5saW1pdCA9IGxpbWl0IHx8IDE7XG5cblx0dmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICB9XG59O1xuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZXROZXh0VmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGFzdEtleSA9IHRoaXMua2V5LFxuICAgICAgICBzdW0gPSAwO1xuXG4gICAgKyt0aGlzLmtleTtcblxuICAgIGlmKCB0aGlzLmtleSA+IHRoaXMubWF4S2V5ICkge1xuICAgICAgICB0aGlzLmtleSA9IDA7XG4gICAgfVxuXG4gICAgdmFyIGRpZmYgPSB0aGlzLmxhc3RLZXkgXiB0aGlzLmtleTtcbiAgICB2YXIgcmFuZ2VMaW1pdCA9IHRoaXMucmFuZ2UgLyB0aGlzLmxpbWl0O1xuXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbWl0OyArK2kgKSB7XG4gICAgICAgIGlmKCBkaWZmICYgKDEgPDwgaSkgKSB7XG4gICAgICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1bSArPSB0aGlzLndoaXRlVmFsdWVzWyBpIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bSAvIHRoaXMubGltaXQ7XG59O1xuXG52YXIgcGluayA9IG5ldyBQaW5rTnVtYmVyKCk7XG5waW5rLmdlbmVyYXRlKCk7XG5cblxuXG5cblxuZXhwb3J0IGRlZmF1bHQge1xuXHRyb3VuZEZyb21FcHNpbG9uOiBmdW5jdGlvbiggbiApIHtcblx0XHRsZXQgcm91bmRlZCA9IE1hdGgucm91bmQoIG4gKTtcblxuXHRcdGlmICggcm91bmRlZCAlIG4gPCBDT05GSUcuZXBzaWxvbiApIHtcblx0XHRcdHJldHVybiByb3VuZGVkXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIG47XG5cdFx0fVxuXHR9LFxuXG5cdHJvdW5kVG9NdWx0aXBsZTogZnVuY3Rpb24oIG4sIG11bHRpcGxlICkge1xuXHRcdHJldHVybiBNYXRoLmZsb29yKCAoIG4gKyBtdWx0aXBsZSAtIDEgKSAvIG11bHRpcGxlICkgKiBtdWx0aXBsZTtcblx0fSxcblxuXHRjbGFtcDogZnVuY3Rpb24oIHZhbHVlLCBtaW4sIG1heCApIHtcblx0XHRyZXR1cm4gTWF0aC5taW4oIG1heCwgTWF0aC5tYXgoIHZhbHVlLCBtaW4gKSApO1xuXHR9LFxuXG5cdHNjYWxlTnVtYmVyOiBmdW5jdGlvbiggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG5cdFx0cmV0dXJuICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICkgKiAoIGhpZ2hPdXQgLSBsb3dPdXQgKSArIGxvd091dDtcblx0fSxcblxuXHRzY2FsZU51bWJlckV4cDogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHAgKSB7XG5cdFx0aWYgKCB0eXBlb2YgZXhwICE9PSAnbnVtYmVyJyB8fCBleHAgPT09IDEgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5zY2FsZU51bWJlciggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKTtcblx0XHR9XG5cblx0XHRpZiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSA9PT0gMCApIHtcblx0XHRcdHJldHVybiBsb3dPdXQ7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPiAwICkge1xuXHRcdFx0XHRyZXR1cm4gKCBsb3dPdXQgKyAoIGhpZ2hPdXQgLSBsb3dPdXQgKSAqIE1hdGgucG93KCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICksIGV4cCApICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiAtKCBNYXRoLnBvdyggKCAoIC1udW0gKyBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICksIGV4cCApICkgKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Ly8gQSB2ZXJ5IHBvb3IgYXBwcm94aW1hdGlvbiBvZiBhIGdhdXNzaWFuIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yIVxuXHRnYXVzc2lhblJhbmRvbTogZnVuY3Rpb24oIGN5Y2xlcyApIHtcblx0XHRjeWNsZXMgPSBjeWNsZXMgfHwgMTA7XG5cblx0XHR2YXIgbiA9IDAsXG5cdFx0XHRpID0gY3ljbGVzO1xuXG5cdFx0d2hpbGUoIC0taSApIHtcblx0XHRcdG4gKz0gTWF0aC5yYW5kb20oKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbiAvIGN5Y2xlcztcblx0fSxcblxuXHQvLyBGcm9tOlxuXHQvLyBcdGh0dHA6Ly93d3cubWVyZWRpdGhkb2RnZS5jb20vMjAxMi8wNS8zMC9hLWdyZWF0LWxpdHRsZS1qYXZhc2NyaXB0LWZ1bmN0aW9uLWZvci1nZW5lcmF0aW5nLXJhbmRvbS1nYXVzc2lhbm5vcm1hbGJlbGwtY3VydmUtbnVtYmVycy9cblx0bnJhbmQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB4MSxcblx0XHRcdHgyLFxuXHRcdFx0cmFkLFxuXHRcdFx0eTE7XG5cblx0XHRkbyB7XG5cdFx0XHR4MSA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHgyID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuXHRcdFx0cmFkID0geDEgKiB4MSArIHgyICogeDI7XG5cdFx0fSB3aGlsZSggcmFkID49IDEgfHwgcmFkID09PSAwICk7XG5cblx0XHR2YXIgYyA9IE1hdGguc3FydCggLTIgKiBNYXRoLmxvZyggcmFkICkgLyByYWQgKTtcblxuXHRcdHJldHVybiAoKHgxICogYykgLyA1KSAqIDAuNSArIDAuNTtcblx0fSxcblxuXHRnZW5lcmF0ZVBpbmtOdW1iZXI6IHBpbmsuZ2VuZXJhdGUsXG5cdGdldE5leHRQaW5rTnVtYmVyOiBwaW5rLmdldE5leHRWYWx1ZSxcblxufTsiLCJleHBvcnQgZGVmYXVsdCAvXihbQXxCfEN8RHxFfEZ8R117MX0pKFsjYnhdezAsMn0pKFtcXC1cXCtdP1xcZCspPyhbXFwrfFxcLV17MX1cXGQqLlxcZCopPy87IiwiZXhwb3J0IGRlZmF1bHQgWyAnQycsICdDIycsICdEJywgJ0QjJywgJ0UnLCAnRicsICdGIycsICdHJywgJ0cjJywgJ0EnLCAnQSMnLCAnQicgXTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgJ0MnOiAwLCAgICAgJ0RiYic6IDAsICAgJ0IjJzogMCxcbiAgICAnQyMnOiAxLCAgICAnRGInOiAxLCAgICAnQiMjJzogMSwgICAnQngnOiAxLFxuICAgICdEJzogMiwgICAgICdFYmInOiAyLCAgICdDIyMnOiAyLCAgICdDeCc6IDIsXG4gICAgJ0QjJzogMywgICAgJ0ViJzogMywgICAgJ0ZiYic6IDMsXG4gICAgJ0UnOiA0LCAgICAgJ0ZiJzogNCwgICAgJ0QjIyc6IDQsICAgJ0R4JzogNCxcbiAgICAnRic6IDUsICAgICAnR2JiJzogNSwgICAnRSMnOiA1LFxuICAgICdGIyc6IDYsICAgICdHYic6IDYsICAgICdFIyMnOiA2LCAgICdFeCc6IDYsXG4gICAgJ0cnOiA3LCAgICAgJ0FiYic6IDcsICAgJ0YjIyc6IDcsICAnRngnOiA3LFxuICAgICdHIyc6IDgsICAgICdBYic6IDgsXG4gICAgJ0EnOiA5LCAgICAgJ0JiYic6IDksICAgJ0cjIyc6IDksICAnR3gnOiA5LFxuICAgICdBIyc6IDEwLCAgICdCYic6IDEwLCAgICdDYmInOiAxMCxcbiAgICAnQic6IDExLCAgICAnQ2InOiAxMSwgICAnQSMjJzogMTEsICdBeCc6IDExXG59OyIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIF9zZXRJTyggaW8gKSB7XG4gICAgdGhpcy5pbyA9IGlvO1xuICAgIHRoaXMuY29udGV4dCA9IGlvLmNvbnRleHQ7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuaW1wb3J0IEJ1ZmZlckdlbmVyYXRvcnMgZnJvbSBcIi4uL2J1ZmZlcnMvQnVmZmVyR2VuZXJhdG9ycy5lczZcIjtcbmltcG9ydCBCdWZmZXJVdGlscyBmcm9tIFwiLi4vdXRpbGl0aWVzL0J1ZmZlclV0aWxzLmVzNlwiO1xuXG4vLyBUT0RPOlxuLy8gXHQtIElzc3VlIHdpdGggcGxheWJhY2sgcmF0ZSBub3QgaGF2aW5nIGEgd2lkZSBlbm91Z2ggcmFuZ2Vcbi8vIFx0ICB0byBzdXBwb3J0IHRoZSBmdWxsIGZyZXF1ZW5jeSByYW5nZS5cbi8vIFx0ICBcbi8vIFx0LSBGaXg6XG4vLyBcdFx0LSBDcmVhdGUgbXVsdGlwbGUgYnVmZmVyIHNvdXJjZXMgYXR0YWNoZWQgdG8gYSBzd2l0Y2guXG4vLyBcdFx0LSBOdW1iZXIgb2Ygc291cmNlczogXG4vLyBcdFx0XHRBdmFpbGFibGUgcmFuZ2U6IDEwMjQgXG4vLyBcdFx0XHRcdCogLTUxMiB0byArNTEyIGlzIGEgZmFpciBiYWxhbmNlIGJldHdlZW4gcmFuZ2UgYW5kIFxuLy8gXHRcdFx0XHRhcnRpZmFjdHMgb24gZGlmZmVyZW50IGJyb3dzZXJzLCBGaXJlZm94IGhhdmluZyBpc3N1ZXNcbi8vIFx0XHRcdFx0YXJvdW5kIHRoZSArODAwIG1hcmssIENocm9tZSBzdG9wcyBpbmNyZWFzaW5nIFxuLy8gXHRcdFx0XHRhZnRlciBhcm91bmQgKzEwMDAuIFNhZmFyaSBpcyBqdXN0IGJyb2tlbjogcGxheWJhY2tSYXRlIFxuLy8gXHRcdFx0XHRBdWRpb1BhcmFtIGNhbm5vdCBiZSBkcml2ZW4gYnkgYXVkaW8gc2lnbmFsLiBXYXQuXG4vLyBcdFx0XHRNYXggZnJlcTogc2FtcGxlUmF0ZSAqIDAuNVxuLy8gXHRcdFx0XG4vLyBcdFx0XHRudW1Tb3VyY2VzOiBNYXRoLmNlaWwoIG1heEZyZXEgLyBhdmFpbGFibGVSYW5nZSApXG4vLyBcdFx0XHRcdFxuLy8gXHRcdFx0YnJlYWtwb2ludHM6IGkgKiBtYXhGcmVxXG4vLyBcdFx0XHRpbml0aWFsIHZhbHVlIG9mIHBsYXliYWNrUmF0ZTogLTUxMi5cbi8vIFx0XHRcdFxuLy8gXHRcdC0gRm9yIHNhbXBsZVJhdGUgb2YgNDgwMDA6XG4vLyBcdFx0XHRudW1Tb3VyY2VzOiBNYXRoLmNlaWwoICg0ODAwMCAqIDAuNSkgLyAxMDI0ICkgPSAyNC5cbi8vIFx0XHRcdFxuLy8gXHRcdFx0XG4vLyAgLSBNYWpvciBkb3duc2lkZTogbWFueSwgbWFueSBidWZmZXJTb3VyY2VzIHdpbGwgYmUgY3JlYXRlZFxuLy8gICAgZWFjaCB0aW1lIGBzdGFydCgpYCBpcyBjYWxsZWQuIFxuLy8gXHRcdFx0XG4vL1xuY2xhc3MgQnVmZmVyT3NjaWxsYXRvciBleHRlbmRzIE5vZGUge1xuXHRjb25zdHJ1Y3RvciggaW8sIGdlbmVyYXRvciApIHtcblx0XHRzdXBlciggaW8sIDAsIDEgKTtcblxuXHRcdHRoaXMuZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuXHRcdHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXHRcdHRoaXMuY29udHJvbHMuZGV0dW5lID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG5cdFx0dGhpcy5yZXNldCgpO1xuXHR9XG5cblx0c3RhcnQoIHdoZW4sIHBoYXNlICkge1xuXHRcdHZhciBidWZmZXIgPSBCdWZmZXJVdGlscy5nZW5lcmF0ZUJ1ZmZlcihcblx0XHRcdFx0dGhpcy5pbyxcblx0XHRcdFx0MSxcblx0XHRcdFx0dGhpcy5jb250ZXh0LnNhbXBsZVJhdGUsXG5cdFx0XHRcdHRoaXMuY29udGV4dC5zYW1wbGVSYXRlLFxuXHRcdFx0XHR0aGlzLmdlbmVyYXRvclxuXHRcdFx0KSxcblx0XHRcdGJ1ZmZlclNvdXJjZTtcblxuXHRcdHRoaXMucmVzZXQoKTtcblxuXHRcdGJ1ZmZlclNvdXJjZSA9IHRoaXMuZ2V0R3JhcGgoKS5idWZmZXJTb3VyY2U7XG5cdFx0YnVmZmVyU291cmNlLmJ1ZmZlciA9IGJ1ZmZlcjtcblx0XHRidWZmZXJTb3VyY2Uuc3RhcnQoIHdoZW4sIHBoYXNlICk7XG5cdFx0Y29uc29sZS5sb2coIGJ1ZmZlclNvdXJjZSApO1xuXHR9XG5cblx0c3RvcCggd2hlbiApIHtcblx0XHR2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCksXG5cdFx0XHRidWZmZXJTb3VyY2UgPSBncmFwaC5idWZmZXJTb3VyY2UsXG5cdFx0XHRzZWxmID0gdGhpcztcblxuXHRcdGJ1ZmZlclNvdXJjZS5zdG9wKCB3aGVuICk7XG5cdH1cblxuXHRyZXNldCgpIHtcblx0XHR2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cblx0XHRncmFwaC5idWZmZXJTb3VyY2UgPSB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG5cdFx0Z3JhcGguYnVmZmVyU291cmNlLmxvb3AgPSB0cnVlO1xuXHRcdGdyYXBoLmJ1ZmZlclNvdXJjZS5wbGF5YmFja1JhdGUudmFsdWUgPSAwO1xuXHRcdGdyYXBoLmJ1ZmZlclNvdXJjZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG5cdFx0dGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGguYnVmZmVyU291cmNlLnBsYXliYWNrUmF0ZSApO1xuXG5cdFx0aWYgKCBncmFwaC5idWZmZXJTb3VyY2UuZGV0dW5lIGluc3RhbmNlb2YgQXVkaW9QYXJhbSApIHtcblx0XHRcdHRoaXMuY29udHJvbHMuZGV0dW5lLmNvbm5lY3QoIGdyYXBoLmJ1ZmZlclNvdXJjZS5kZXR1bmUgKTtcblx0XHR9XG5cblx0XHR0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuXHR9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUJ1ZmZlck9zY2lsbGF0b3IgPSBmdW5jdGlvbiggZ2VuZXJhdG9yICkge1xuXHRyZXR1cm4gbmV3IEJ1ZmZlck9zY2lsbGF0b3IoIHRoaXMsIGdlbmVyYXRvciApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgT3NjaWxsYXRvckJhbmsgZnJvbSBcIi4uL29zY2lsbGF0b3JzL09zY2lsbGF0b3JCYW5rLmVzNlwiO1xuXG5jbGFzcyBGTU9zY2lsbGF0b3IgZXh0ZW5kcyBPc2NpbGxhdG9yQmFuayB7XG5cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoIHRoaXMgKTtcblxuICAgICAgICAvLyBGTS9tb2R1bGF0b3Igb3NjaWxsYXRvciBzZXR1cFxuICAgICAgICBncmFwaC5mbU9zY2lsbGF0b3IgPSB0aGlzLmlvLmNyZWF0ZU9zY2lsbGF0b3JCYW5rKCk7XG4gICAgICAgIGdyYXBoLmZtT3NjQW1vdW50ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguZm1Pc2NBbW91bnRNdWx0aXBsaWVyID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5mbU9zY0Ftb3VudC5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGguZm1Pc2NpbGxhdG9yLmNvbm5lY3QoIGdyYXBoLmZtT3NjQW1vdW50ICk7XG4gICAgICAgIGdyYXBoLmZtT3NjQW1vdW50LmNvbm5lY3QoIGdyYXBoLmZtT3NjQW1vdW50TXVsdGlwbGllciwgMCwgMCApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1GcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1GcmVxdWVuY3kuY29ubmVjdCggZ3JhcGguZm1Pc2NpbGxhdG9yLmNvbnRyb2xzLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtRnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmZtT3NjQW1vdW50TXVsdGlwbGllciwgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1XYXZlZm9ybSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mbVdhdmVmb3JtLmNvbm5lY3QoIGdyYXBoLmZtT3NjaWxsYXRvci5jb250cm9scy53YXZlZm9ybSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1Pc2NBbW91bnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1Pc2NBbW91bnQuY29ubmVjdCggZ3JhcGguZm1Pc2NBbW91bnQuZ2FpbiApO1xuXG5cbiAgICAgICAgLy8gU2VsZi1mbSBzZXR1cFxuICAgICAgICBncmFwaC5mbVNlbGZBbW91bnRzID0gW107XG4gICAgICAgIGdyYXBoLmZtU2VsZkFtb3VudE11bHRpcGxpZXJzID0gW107XG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1TZWxmQW1vdW50ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgZ3JhcGgub3NjaWxsYXRvcnMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgIFx0Ly8gQ29ubmVjdCBGTSBvc2NpbGxhdG9yIHRvIHRoZSBleGlzdGluZyBvc2NpbGxhdG9yc1xuICAgICAgICBcdC8vIGZyZXF1ZW5jeSBjb250cm9sLlxuICAgICAgICBcdGdyYXBoLmZtT3NjQW1vdW50TXVsdGlwbGllci5jb25uZWN0KCBncmFwaC5vc2NpbGxhdG9yc1sgaSBdLmZyZXF1ZW5jeSApO1xuXG5cbiAgICAgICAgXHQvLyBGb3IgZWFjaCBvc2NpbGxhdG9yIGluIHRoZSBvc2NpbGxhdG9yIGJhbmssXG4gICAgICAgIFx0Ly8gY3JlYXRlIGEgRk0tc2VsZiBHYWluTm9kZSwgYW5kIGNvbm5lY3QgdGhlIG9zY1xuICAgICAgICBcdC8vIHRvIGl0LCB0aGVuIGl0IHRvIHRoZSBvc2MncyBmcmVxdWVuY3kuXG4gICAgICAgIFx0Z3JhcGguZm1TZWxmQW1vdW50c1sgaSBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgXHRncmFwaC5mbVNlbGZBbW91bnRzWyBpIF0uZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgXHRncmFwaC5mbVNlbGZBbW91bnRNdWx0aXBsaWVyc1sgaSBdID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBcdGdyYXBoLmZtU2VsZkFtb3VudHNbIGkgXS5jb25uZWN0KCBncmFwaC5mbVNlbGZBbW91bnRNdWx0aXBsaWVyc1sgaSBdLCAwLCAwICk7XG4gICAgICAgIFx0dGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGguZm1TZWxmQW1vdW50TXVsdGlwbGllcnNbIGkgXSwgMCwgMSApO1xuXG4gICAgICAgIFx0Z3JhcGgub3NjaWxsYXRvcnNbIGkgXS5jb25uZWN0KCBncmFwaC5mbVNlbGZBbW91bnRzWyBpIF0gKTtcbiAgICAgICAgXHRncmFwaC5mbVNlbGZBbW91bnRNdWx0aXBsaWVyc1sgaSBdLmNvbm5lY3QoIGdyYXBoLm9zY2lsbGF0b3JzWyBpIF0uZnJlcXVlbmN5ICk7XG5cbiAgICAgICAgXHQvLyBNYWtlIHN1cmUgdGhlIEZNLXNlbGYgYW1vdW50IGlzIGNvbnRyb2xsYWJsZSB3aXRoIG9uZSBwYXJhbWV0ZXIuXG4gICAgICAgIFx0dGhpcy5jb250cm9scy5mbVNlbGZBbW91bnQuY29ubmVjdCggZ3JhcGguZm1TZWxmQW1vdW50c1sgaSBdLmdhaW4gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVGTU9zY2lsbGF0b3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEZNT3NjaWxsYXRvciggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuaW1wb3J0IEJ1ZmZlclV0aWxzIGZyb20gXCIuLi91dGlsaXRpZXMvQnVmZmVyVXRpbHMuZXM2XCI7XG5pbXBvcnQgQnVmZmVyR2VuZXJhdG9ycyBmcm9tIFwiLi4vYnVmZmVycy9CdWZmZXJHZW5lcmF0b3JzLmVzNlwiO1xuXG5cbnZhciBCVUZGRVJTID0gbmV3IFdlYWtNYXAoKTtcblxuY2xhc3MgTm9pc2VPc2NpbGxhdG9yQmFuayBleHRlbmRzIE5vZGUge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCggdGhpcyApLFxuICAgICAgICAgICAgdHlwZXMgPSB0aGlzLmNvbnN0cnVjdG9yLnR5cGVzLFxuICAgICAgICAgICAgdHlwZUtleXMgPSBPYmplY3Qua2V5cyggdHlwZXMgKTtcblxuICAgICAgICBncmFwaC5idWZmZXJTb3VyY2VzID0gW107XG4gICAgICAgIGdyYXBoLm91dHB1dEdhaW4gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCBPYmplY3Qua2V5cyggdHlwZXMgKS5sZW5ndGgsIDAgKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0R2Fpbi5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0eXBlS2V5cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBCdWZmZXJHZW5lcmF0b3JzWyB0aGlzLmNvbnN0cnVjdG9yLmdlbmVyYXRvcktleXNbIGkgXSBdICk7XG5cbiAgICAgICAgICAgIHNvdXJjZS5idWZmZXIgPSBCdWZmZXJVdGlscy5nZW5lcmF0ZUJ1ZmZlcihcbiAgICAgICAgICAgICAgICB0aGlzLmlvLCAvLyBjb250ZXh0XG4gICAgICAgICAgICAgICAgMSwgLy8gY2hhbm5lbHNcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSAqIDUsIC8vIGxlbmd0aCAoNSBzZWNvbmRzKVxuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlLCAvLyBTYW1wbGVSYXRlXG4gICAgICAgICAgICAgICAgQnVmZmVyR2VuZXJhdG9yc1sgdGhpcy5jb25zdHJ1Y3Rvci5nZW5lcmF0b3JLZXlzWyBpIF0gXSAvLyBHZW5lcmF0b3IgZnVuY3Rpb25cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHNvdXJjZS5sb29wID0gdHJ1ZTtcbiAgICAgICAgICAgIHNvdXJjZS5zdGFydCggMCApO1xuXG4gICAgICAgICAgICBzb3VyY2UuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlciwgMCwgaSApO1xuICAgICAgICAgICAgZ3JhcGguYnVmZmVyU291cmNlcy5wdXNoKCBzb3VyY2UgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIuY29ubmVjdCggZ3JhcGgub3V0cHV0R2FpbiApO1xuICAgICAgICBncmFwaC5vdXRwdXRHYWluLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy50eXBlID0gZ3JhcGguY3Jvc3NmYWRlci5jb250cm9scy5pbmRleDtcbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBzdGFydCggdGltZSApIHtcbiAgICAgICAgdmFyIG91dHB1dEdhaW4gPSB0aGlzLmdldEdyYXBoKCB0aGlzICkub3V0cHV0R2FpbjtcblxuICAgICAgICB0aW1lID0gdGltZSB8fCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWU7XG4gICAgICAgIG91dHB1dEdhaW4uZ2Fpbi52YWx1ZSA9IDE7XG4gICAgfVxuXG4gICAgc3RvcCggdGltZSApIHtcbiAgICAgICAgdmFyIG91dHB1dEdhaW4gPSB0aGlzLmdldEdyYXBoKCB0aGlzICkub3V0cHV0R2FpbjtcblxuICAgICAgICB0aW1lID0gdGltZSB8fCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWU7XG4gICAgICAgIG91dHB1dEdhaW4uZ2Fpbi52YWx1ZSA9IDA7XG4gICAgfVxufVxuXG5cbk5vaXNlT3NjaWxsYXRvckJhbmsudHlwZXMgPSB7XG4gICAgV0hJVEU6IDAsXG4gICAgR0FVU1NJQU5fV0hJVEU6IDEsXG4gICAgUElOSzogMlxufTtcblxuTm9pc2VPc2NpbGxhdG9yQmFuay5nZW5lcmF0b3JLZXlzID0gW1xuICAgICdXaGl0ZU5vaXNlJyxcbiAgICAnR2F1c3NpYW5Ob2lzZScsXG4gICAgJ1BpbmtOb2lzZSdcbl07XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTm9pc2VPc2NpbGxhdG9yQmFuayA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTm9pc2VPc2NpbGxhdG9yQmFuayggdGhpcyApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxudmFyIE9TQ0lMTEFUT1JfVFlQRVMgPSBbXG4gICAgJ3NpbmUnLFxuICAgICd0cmlhbmdsZScsXG4gICAgJ3Nhd3Rvb3RoJyxcbiAgICAnc3F1YXJlJ1xuXTtcblxuY2xhc3MgT3NjaWxsYXRvckJhbmsgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCBPU0NJTExBVE9SX1RZUEVTLmxlbmd0aCwgMCApO1xuICAgICAgICBncmFwaC5vc2NpbGxhdG9ycyA9IFtdO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRldHVuZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy53YXZlZm9ybSA9IGdyYXBoLmNyb3NzZmFkZXIuY29udHJvbHMuaW5kZXg7XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBPU0NJTExBVE9SX1RZUEVTLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdmFyIG9zYyA9IHRoaXMuY29udGV4dC5jcmVhdGVPc2NpbGxhdG9yKCk7XG5cbiAgICAgICAgICAgIG9zYy50eXBlID0gT1NDSUxMQVRPUl9UWVBFU1sgaSBdO1xuICAgICAgICAgICAgb3NjLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgICAgICBvc2Muc3RhcnQoIDAgKTtcblxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggb3NjLmZyZXF1ZW5jeSApO1xuICAgICAgICAgICAgdGhpcy5jb250cm9scy5kZXR1bmUuY29ubmVjdCggb3NjLmRldHVuZSApO1xuICAgICAgICAgICAgb3NjLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXIsIDAsIGkgKTtcblxuICAgICAgICAgICAgZ3JhcGgub3NjaWxsYXRvcnMucHVzaCggb3NjICk7XG4gICAgICAgIH1cblxuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIuY29ubmVjdCggZ3JhcGgub3V0cHV0TGV2ZWwgKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0TGV2ZWwuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIHN0YXJ0KCBkZWxheSA9IDAgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5vdXRwdXRMZXZlbC5nYWluLnZhbHVlID0gMTtcbiAgICB9XG5cbiAgICBzdG9wKCBkZWxheSA9IDAgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5vdXRwdXRMZXZlbC5nYWluLnZhbHVlID0gMDtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU9zY2lsbGF0b3JCYW5rID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBPc2NpbGxhdG9yQmFuayggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgT3NjaWxsYXRvckJhbms7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuY2xhc3MgU2luZUJhbmsgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIG51bVNpbmVzID0gNCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm9zY2lsbGF0b3JzID0gW107XG4gICAgICAgIGdyYXBoLmhhcm1vbmljTXVsdGlwbGllcnMgPSBbXTtcbiAgICAgICAgZ3JhcGgubnVtU2luZXMgPSBudW1TaW5lcztcbiAgICAgICAgZ3JhcGgub3V0cHV0TGV2ZWwgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbC5nYWluLnZhbHVlID0gMSAvIG51bVNpbmVzO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRldHVuZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oYXJtb25pY3MgPSBbXTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1TaW5lczsgKytpICkge1xuICAgICAgICAgICAgdmFyIG9zYyA9IHRoaXMuY29udGV4dC5jcmVhdGVPc2NpbGxhdG9yKCksXG4gICAgICAgICAgICAgICAgaGFybW9uaWNDb250cm9sID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpLFxuICAgICAgICAgICAgICAgIGhhcm1vbmljTXVsdGlwbGllciA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICAgICAgb3NjLnR5cGUgPSAnc2luZSc7XG4gICAgICAgICAgICBvc2MuZnJlcXVlbmN5LnZhbHVlID0gMDtcblxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggaGFybW9uaWNNdWx0aXBsaWVyLCAwLCAwICk7XG4gICAgICAgICAgICBoYXJtb25pY0NvbnRyb2wuY29ubmVjdCggaGFybW9uaWNNdWx0aXBsaWVyLCAwLCAxICk7XG4gICAgICAgICAgICBoYXJtb25pY011bHRpcGxpZXIuY29ubmVjdCggb3NjLmZyZXF1ZW5jeSApO1xuICAgICAgICAgICAgdGhpcy5jb250cm9scy5kZXR1bmUuY29ubmVjdCggb3NjLmRldHVuZSApO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmhhcm1vbmljc1sgaSBdID0gaGFybW9uaWNDb250cm9sO1xuXG4gICAgICAgICAgICBvc2Muc3RhcnQoIDAgKTtcbiAgICAgICAgICAgIG9zYy5jb25uZWN0KCBncmFwaC5vdXRwdXRMZXZlbCApO1xuICAgICAgICAgICAgZ3JhcGgub3NjaWxsYXRvcnMucHVzaCggb3NjICk7XG4gICAgICAgIH1cblxuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgc3RhcnQoIGRlbGF5ID0gMCApIHtcbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbC5nYWluLnZhbHVlID0gMSAvIGdyYXBoLm51bVNpbmVzO1xuICAgIH1cblxuICAgIHN0b3AoIGRlbGF5ID0gMCApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAwO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2luZUJhbmsgPSBmdW5jdGlvbiggbnVtU2luZXMgKSB7XG4gICAgcmV0dXJuIG5ldyBTaW5lQmFuayggdGhpcywgbnVtU2luZXMgKTtcbn07XG5cbmV4cG9ydFxuZGVmYXVsdCBTaW5lQmFuazsiLCJpbXBvcnQgVXRpbHMgZnJvbSAnLi9VdGlscy5lczYnO1xuXG52YXIgQnVmZmVyVXRpbHMgPSB7fTtcbnZhciBCVUZGRVJfU1RPUkUgPSB7fTtcblxuZnVuY3Rpb24gZ2VuZXJhdGVCdWZmZXJTdG9yZUtleSggbGVuZ3RoLCBudW1iZXJPZkNoYW5uZWxzLCBzYW1wbGVSYXRlLCBpdGVyYXRvciApIHtcblx0cmV0dXJuIGxlbmd0aCArICctJyArIG51bWJlck9mQ2hhbm5lbHMgKyAnLScgKyBzYW1wbGVSYXRlICsgJy0nICsgaXRlcmF0b3I7XG59XG5cbi8vIFRPRE86XG4vLyBcdC0gSXQgbWlnaHQgYmUgcG9zc2libGUgdG8gZGVjb2RlIHRoZSBhcnJheWJ1ZmZlclxuLy8gXHQgIHVzaW5nIGEgY29udGV4dCBkaWZmZXJlbnQgZnJvbSB0aGUgb25lIHRoZSBcbi8vIFx0ICBidWZmZXIgd2lsbCBiZSB1c2VkIGluLlxuLy8gXHQgIElmIHNvLCByZW1vdmUgdGhlIGBpb2AgYXJndW1lbnQsIGFuZCBjcmVhdGVcbi8vIFx0ICBhIG5ldyBBdWRpb0NvbnRleHQgYmVmb3JlIHRoZSByZXR1cm4gb2YgdGhlIFByb21pc2UsXG4vLyBcdCAgYW5kIHVzZSB0aGF0LlxuQnVmZmVyVXRpbHMubG9hZEJ1ZmZlciA9IGZ1bmN0aW9uKCBpbywgdXJpICkge1xuXHRyZXR1cm4gbmV3IFByb21pc2UoIGZ1bmN0aW9uKCByZXNvbHZlLCByZWplY3QgKSB7XG5cdFx0dmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG5cdFx0eGhyLm9wZW4oICdHRVQnLCB1cmkgKTtcblx0XHR4aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcblxuXHRcdHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggeGhyLnN0YXR1cyA9PT0gMjAwICkge1xuXHRcdFx0XHQvLyBEbyB0aGUgZGVjb2RlIGRhbmNlXG5cdFx0XHRcdGlvLmNvbnRleHQuZGVjb2RlQXVkaW9EYXRhKFxuXHRcdFx0XHRcdHhoci5yZXNwb25zZSxcblx0XHRcdFx0XHRmdW5jdGlvbiggYnVmZmVyICkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZSggYnVmZmVyICk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRmdW5jdGlvbiggZSApIHtcblx0XHRcdFx0XHRcdHJlamVjdCggZSApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRyZWplY3QoIEVycm9yKCAnU3RhdHVzICE9PSAyMDAnICkgKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0eGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJlamVjdCggRXJyb3IoICdOZXR3b3JrIGVycm9yJyApICk7XG5cdFx0fTtcblxuXHRcdHhoci5zZW5kKCk7XG5cdH0gKTtcbn07XG5cbkJ1ZmZlclV0aWxzLmdlbmVyYXRlQnVmZmVyID0gZnVuY3Rpb24oIGlvLCBudW1iZXJPZkNoYW5uZWxzLCBsZW5ndGgsIHNhbXBsZVJhdGUsIGl0ZXJhdG9yICkge1xuXHR2YXIga2V5ID0gZ2VuZXJhdGVCdWZmZXJTdG9yZUtleSggbGVuZ3RoLCBudW1iZXJPZkNoYW5uZWxzLCBzYW1wbGVSYXRlLCBpdGVyYXRvci50b1N0cmluZygpICksXG5cdFx0YnVmZmVyLFxuXHRcdGNoYW5uZWxEYXRhO1xuXG5cdGlmICggQlVGRkVSX1NUT1JFWyBrZXkgXSApIHtcblx0XHRyZXR1cm4gQlVGRkVSX1NUT1JFWyBrZXkgXTtcblx0fVxuXG5cdGJ1ZmZlciA9IGlvLmNvbnRleHQuY3JlYXRlQnVmZmVyKCBudW1iZXJPZkNoYW5uZWxzLCBsZW5ndGgsIHNhbXBsZVJhdGUgKTtcblxuXHRmb3IgKCB2YXIgYyA9IDA7IGMgPCBudW1iZXJPZkNoYW5uZWxzOyArK2MgKSB7XG5cdFx0Y2hhbm5lbERhdGEgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIGMgKTtcblxuXHRcdGZvciAoIHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpICkge1xuXHRcdFx0Y2hhbm5lbERhdGFbIGkgXSA9IGl0ZXJhdG9yKCBpLCBsZW5ndGgsIGMsIG51bWJlck9mQ2hhbm5lbHMgKTtcblx0XHR9XG5cdH1cblxuXHRCVUZGRVJfU1RPUkVbIGtleSBdID0gYnVmZmVyO1xuXG5cdHJldHVybiBidWZmZXI7XG59O1xuXG5cbkJ1ZmZlclV0aWxzLmZpbGxCdWZmZXIgPSBmdW5jdGlvbiggYnVmZmVyLCB2YWx1ZSApIHtcblx0dmFyIG51bUNoYW5uZWxzID0gYnVmZmVyLm51bWJlck9mQ2hhbm5lbHMsXG5cdFx0bGVuZ3RoID0gYnVmZmVyLmxlbmd0aCxcblx0XHRjaGFubmVsRGF0YTtcblxuXHRmb3IgKCB2YXIgYyA9IDA7IGMgPCBudW1DaGFubmVsczsgKytjICkge1xuXHRcdGNoYW5uZWxEYXRhID0gYnVmZmVyLmdldENoYW5uZWxEYXRhKCBjICk7XG5cdFx0Y2hhbm5lbERhdGEuZmlsbCggdmFsdWUgKTtcblx0fVxufTtcblxuXG5CdWZmZXJVdGlscy5yZXZlcnNlQnVmZmVyID0gZnVuY3Rpb24oIGJ1ZmZlciApIHtcblx0aWYgKCBidWZmZXIgaW5zdGFuY2VvZiBBdWRpb0J1ZmZlciA9PT0gZmFsc2UgKSB7XG5cdFx0Y29uc29sZS5lcnJvciggJ2BidWZmZXJgIGFyZ3VtZW50IG11c3QgYmUgaW5zdGFuY2Ugb2YgQXVkaW9CdWZmZXInICk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0dmFyIG51bUNoYW5uZWxzID0gYnVmZmVyLm51bWJlck9mQ2hhbm5lbHMsXG5cdFx0bGVuZ3RoID0gYnVmZmVyLmxlbmd0aCxcblx0XHRjaGFubmVsRGF0YTtcblxuXHRmb3IgKCB2YXIgYyA9IDA7IGMgPCBudW1DaGFubmVsczsgKytjICkge1xuXHRcdGNoYW5uZWxEYXRhID0gYnVmZmVyLmdldENoYW5uZWxEYXRhKCBjICk7XG5cdFx0Y2hhbm5lbERhdGEucmV2ZXJzZSgpO1xuXHR9XG59O1xuXG5CdWZmZXJVdGlscy5jbG9uZUJ1ZmZlciA9IGZ1bmN0aW9uKCBidWZmZXIgKSB7XG5cdHZhciBuZXdCdWZmZXIgPSB0aGlzLmlvLmNyZWF0ZUJ1ZmZlciggYnVmZmVyLm51bWJlck9mQ2hhbm5lbHMsIGJ1ZmZlci5sZW5ndGgsIGJ1ZmZlci5zYW1wbGVSYXRlICk7XG5cblx0Zm9yICggdmFyIGMgPSAwOyBjIDwgYnVmZmVyLm51bWJlck9mQ2hhbm5lbHM7ICsrYyApIHtcblx0XHR2YXIgY2hhbm5lbERhdGEgPSBuZXdCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoIGMgKSxcblx0XHRcdHNvdXJjZURhdGEgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIGMgKTtcblxuXHRcdGZvciAoIHZhciBpID0gMDsgaSA8IGJ1ZmZlci5sZW5ndGg7ICsraSApIHtcblx0XHRcdGNoYW5uZWxEYXRhWyBpIF0gPSBzb3VyY2VEYXRhWyBpIF07XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIG5ld0J1ZmZlcjtcbn07XG5cbi8vIFRPRE86XG4vLyBcdC0gU3VwcG9ydCBidWZmZXJzIHdpdGggbW9yZSB0aGFuIDIgY2hhbm5lbHMuXG5CdWZmZXJVdGlscy50b1N0ZXJlbyA9IGZ1bmN0aW9uKCBidWZmZXIgKSB7XG5cdHZhciBzdGVyZW9CdWZmZXIsXG5cdFx0bGVuZ3RoO1xuXG5cdGlmICggYnVmZmVyLm51bUNoYW5uZWxzID49IDIgKSB7XG5cdFx0Y29uc29sZS53YXJuKCAnQnVmZmVyVXRpbHMudG9TdGVyZW8gY3VycmVudGx5IG9ubHkgc3VwcG9ydHMgbW9ubyBidWZmZXJzIGZvciB1cG1peGluZycgKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRsZW5ndGggPSBidWZmZXIubGVuZ3RoO1xuXHRzdGVyZW9CdWZmZXIgPSB0aGlzLmlvLmNyZWF0ZUJ1ZmZlciggMiwgbGVuZ3RoLCBidWZmZXIuc2FtcGxlUmF0ZSApO1xuXG5cdGZvciAoIHZhciBjID0gMDsgYyA8IDI7ICsrYyApIHtcblx0XHR2YXIgY2hhbm5lbERhdGEgPSBzdGVyZW9CdWZmZXIuZ2V0Q2hhbm5lbERhdGEoIGMgKSxcblx0XHRcdHNvdXJjZURhdGEgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIDAgKTtcblxuXHRcdGZvciAoIHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpICkge1xuXHRcdFx0Y2hhbm5lbERhdGFbIGkgXSA9IHNvdXJjZURhdGFbIGkgXTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gc3RlcmVvQnVmZmVyO1xufTtcblxuLy8gVE9ETzpcbi8vIFx0LSBUaGVzZSBiYXNpYyBtYXRoIGZ1bmN0aW9ucy4gVGhpbmsgb2YgXG4vLyBcdCAgdGhlbSBhcyBhIGJ1ZmZlci12ZXJzaW9uIG9mIGEgdmVjdG9yIGxpYi5cbkJ1ZmZlclV0aWxzLmFkZEJ1ZmZlciA9IGZ1bmN0aW9uKCBhLCBiICkge307XG5cblxuLy8gYWRkXG4vLyBtdWx0aXBseVxuLy8gc3VidHJhY3Rcbi8vXG5cbmV4cG9ydCBkZWZhdWx0IEJ1ZmZlclV0aWxzOyIsInZhciBVdGlscyA9IHt9O1xuXG5VdGlscy5pc1R5cGVkQXJyYXkgPSBmdW5jdGlvbiggYXJyYXkgKSB7XG5cdGlmICggYXJyYXkgIT09IHVuZGVmaW5lZCAmJiBhcnJheS5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciApIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdHJldHVybiBmYWxzZTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFV0aWxzOyJdfQ==
