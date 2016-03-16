(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

window.AudioIO = AudioIO;
exports['default'] = AudioIO;
module.exports = exports['default'];

},{"../mixins/conversions.es6":73,"../mixins/math.es6":74,"./config.es6":5,"./overrides.es6":6,"./signalCurves.es6":7}],2:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":71,"../mixins/connections.es6":72,"../mixins/setIO.es6":78,"./AudioIO.es6":1}],3:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":71,"../mixins/connections.es6":72,"../mixins/setIO.es6":78,"./AudioIO.es6":1}],4:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":71,"../mixins/connections.es6":72,"../mixins/setIO.es6":78,"./AudioIO.es6":1}],5:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = {
    curveResolution: 4096, // Must be an even number.

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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{"../mixins/Math.es6":70,"./config.es6":5}],8:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _CustomEnvelopeEs6 = require("./CustomEnvelope.es6");

var _CustomEnvelopeEs62 = _interopRequireDefault(_CustomEnvelopeEs6);

var ASDREnvelope = (function (_CustomEnvelope) {
    function ASDREnvelope(io) {
        _classCallCheck(this, ASDREnvelope);

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

    _inherits(ASDREnvelope, _CustomEnvelope);

    _createClass(ASDREnvelope, [{
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

    return ASDREnvelope;
})(_CustomEnvelopeEs62["default"]);

AudioIO.prototype.createASDREnvelope = function () {
    return new ASDREnvelope(this);
};

exports["default"] = ASDREnvelope;
module.exports = exports["default"];

},{"../core/AudioIO.es6":1,"./CustomEnvelope.es6":9}],9:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/config.es6":5,"../mixins/setIO.es6":78}],10:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],11:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../graphs/DryWetNode.es6":21}],12:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../graphs/DryWetNode.es6":21,"../mixins/cleaners.es6":71,"../mixins/connections.es6":72,"../mixins/setIO.es6":78,"./Delay.es6":11}],13:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],14:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../graphs/DryWetNode.es6":21}],15:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],16:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],17:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],18:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../mixins/setIO.es6":78}],19:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],20:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],21:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/cleaners.es6":71,"../mixins/connections.es6":72,"../mixins/setIO.es6":78}],22:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],23:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],24:[function(require,module,exports){
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

        this.envelope = options.envelope || this.io.createASDREnvelope();

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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/math.es6":74}],25:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreAudioIOEs6 = require('./core/AudioIO.es6');

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require('./core/Node.es6');

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var _coreParamEs6 = require('./core/Param.es6');

var _coreParamEs62 = _interopRequireDefault(_coreParamEs6);

require('./core/WaveShaper.es6');

// import './graphs/Crossfader.es6';

require('./fx/Delay.es6');

require('./fx/PingPongDelay.es6');

require('./fx/SineShaper.es6');

require('./fx/StereoWidth.es6');

require('./fx/StereoRotation.es6');

// import './fx/BitReduction.es6';

require('./fx/SchroederAllPass.es6');

require('./fx/DCTrap.es6');

require('./fx/filters/FilterBank.es6');

require('./generators/OscillatorGenerator.es6');

require('./instruments/GeneratorPlayer.es6');

require('./math/trigonometry/DegToRad.es6');

require('./math/trigonometry/Sin.es6');

require('./math/trigonometry/Cos.es6');

require('./math/trigonometry/Tan.es6');

require('./math/trigonometry/RadToDeg.es6');

require('./math/relational-operators/EqualTo.es6');

require('./math/relational-operators/EqualToZero.es6');

require('./math/relational-operators/GreaterThan.es6');

require('./math/relational-operators/GreaterThanZero.es6');

require('./math/relational-operators/GreaterThanEqualTo.es6');

require('./math/relational-operators/IfElse.es6');

require('./math/relational-operators/LessThan.es6');

require('./math/relational-operators/LessThanZero.es6');

require('./math/relational-operators/LessThanEqualTo.es6');

require('./math/logical-operators/LogicalOperator.es6');

require('./math/logical-operators/AND.es6');

require('./math/logical-operators/OR.es6');

require('./math/logical-operators/NOT.es6');

require('./math/logical-operators/NAND.es6');

require('./math/logical-operators/NOR.es6');

require('./math/logical-operators/XOR.es6');

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

require('./math/Lerp.es6');

require('./math/SampleDelay.es6');

require('./envelopes/CustomEnvelope.es6');

require('./envelopes/ASDREnvelope.es6');

require('./graphs/EQShelf.es6');

// import './graphs/DiffuseDelay.es6';

require('./graphs/Counter.es6');

require('./graphs/DryWetNode.es6');

require('./graphs/PhaseOffset.es6');

require('./graphs/Crossfader.es6');

require('./oscillators/OscillatorBank.es6');

require('./oscillators/NoiseOscillator.es6');

require('./oscillators/FMOscillator.es6');

require('./oscillators/SineBank.es6');

window.AudioContext = window.AudioContext || window.webkitAudioContext;

// import './graphs/Sketch.es6';

window.Param = _coreParamEs62['default'];
window.Node = _coreNodeEs62['default'];

},{"./core/AudioIO.es6":1,"./core/Node.es6":2,"./core/Param.es6":3,"./core/WaveShaper.es6":4,"./envelopes/ASDREnvelope.es6":8,"./envelopes/CustomEnvelope.es6":9,"./fx/DCTrap.es6":10,"./fx/Delay.es6":11,"./fx/PingPongDelay.es6":12,"./fx/SchroederAllPass.es6":13,"./fx/SineShaper.es6":14,"./fx/StereoRotation.es6":15,"./fx/StereoWidth.es6":16,"./fx/filters/FilterBank.es6":17,"./generators/OscillatorGenerator.es6":18,"./graphs/Counter.es6":19,"./graphs/Crossfader.es6":20,"./graphs/DryWetNode.es6":21,"./graphs/EQShelf.es6":22,"./graphs/PhaseOffset.es6":23,"./instruments/GeneratorPlayer.es6":24,"./math/Abs.es6":26,"./math/Add.es6":27,"./math/Average.es6":28,"./math/Clamp.es6":29,"./math/Constant.es6":30,"./math/Divide.es6":31,"./math/Floor.es6":32,"./math/Lerp.es6":33,"./math/Max.es6":34,"./math/Min.es6":35,"./math/Multiply.es6":36,"./math/Negate.es6":37,"./math/Pow.es6":38,"./math/Reciprocal.es6":39,"./math/Round.es6":40,"./math/SampleDelay.es6":41,"./math/Scale.es6":42,"./math/ScaleExp.es6":43,"./math/Sign.es6":44,"./math/Sqrt.es6":45,"./math/Square.es6":46,"./math/Subtract.es6":47,"./math/Switch.es6":48,"./math/logical-operators/AND.es6":49,"./math/logical-operators/LogicalOperator.es6":50,"./math/logical-operators/NAND.es6":51,"./math/logical-operators/NOR.es6":52,"./math/logical-operators/NOT.es6":53,"./math/logical-operators/OR.es6":54,"./math/logical-operators/XOR.es6":55,"./math/relational-operators/EqualTo.es6":56,"./math/relational-operators/EqualToZero.es6":57,"./math/relational-operators/GreaterThan.es6":58,"./math/relational-operators/GreaterThanEqualTo.es6":59,"./math/relational-operators/GreaterThanZero.es6":60,"./math/relational-operators/IfElse.es6":61,"./math/relational-operators/LessThan.es6":62,"./math/relational-operators/LessThanEqualTo.es6":63,"./math/relational-operators/LessThanZero.es6":64,"./math/trigonometry/Cos.es6":65,"./math/trigonometry/DegToRad.es6":66,"./math/trigonometry/RadToDeg.es6":67,"./math/trigonometry/Sin.es6":68,"./math/trigonometry/Tan.es6":69,"./oscillators/FMOscillator.es6":79,"./oscillators/NoiseOscillator.es6":80,"./oscillators/OscillatorBank.es6":81,"./oscillators/SineBank.es6":82}],26:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],27:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],28:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],29:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],30:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],31:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],32:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],33:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],34:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],35:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],36:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],37:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],38:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],39:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],40:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],41:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],42:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],43:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],44:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],45:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],46:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],47:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],48:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],49:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":50}],50:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],51:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":50}],52:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":50}],53:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":50}],54:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":50}],55:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":50}],56:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],57:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2,"./EqualTo.es6":56}],58:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],59:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],60:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],61:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],62:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],63:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],64:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],65:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],66:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],67:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],68:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],69:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],70:[function(require,module,exports){
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

},{"../core/config.es6":5}],71:[function(require,module,exports){
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

},{}],72:[function(require,module,exports){
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

},{}],73:[function(require,module,exports){
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

},{"../core/config.es6":5,"./math.es6":74,"./noteRegExp.es6":75,"./noteStrings.es6":76,"./notes.es6":77}],74:[function(require,module,exports){
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

},{"../core/config.es6":5}],75:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = /^([A|B|C|D|E|F|G]{1})([#bx]{0,2})([\-\+]?\d+)?([\+|\-]{1}\d*.\d*)?/;
module.exports = exports["default"];

},{}],76:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
module.exports = exports['default'];

},{}],77:[function(require,module,exports){
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

},{}],78:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = _setIO;

function _setIO(io) {
    this.io = io;
    this.context = io.context;
}

;
module.exports = exports["default"];

},{}],79:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../oscillators/OscillatorBank.es6":81}],80:[function(require,module,exports){
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

var NoiseOscillator = (function (_Node) {
    /**
     * @param {Object} io Instance of AudioIO.
     */

    function NoiseOscillator(io) {
        _classCallCheck(this, NoiseOscillator);

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

    _inherits(NoiseOscillator, _Node);

    NoiseOscillator.prototype._createSingleBuffer = function _createSingleBuffer(type) {
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

    NoiseOscillator.prototype._createBuffers = function _createBuffers() {
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

    NoiseOscillator.prototype._getBuffers = function _getBuffers() {
        var buffers = BUFFERS.get(this.io);

        if (buffers === undefined) {
            this._createBuffers();
            buffers = BUFFERS.get(this.io);
        }

        return buffers;
    };

    NoiseOscillator.prototype._setBuffers = function _setBuffers(buffers) {
        BUFFERS.set(this.io, buffers);
    };

    NoiseOscillator.prototype.start = function start(time) {
        var outputGain = this.getGraph(this).outputGain;

        time = time || this.context.currentTime;
        outputGain.gain.value = 1;
    };

    NoiseOscillator.prototype.stop = function stop(time) {
        var outputGain = this.getGraph(this).outputGain;

        time = time || this.context.currentTime;
        outputGain.gain.value = 0;
    };

    NoiseOscillator.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
    };

    return NoiseOscillator;
})(_coreNodeEs62["default"]);

NoiseOscillator.types = {
    WHITE: 0,
    GAUSSIAN_WHITE: 1,
    PINK: 2
};

AudioIO.prototype.createNoiseOscillator = function () {
    return new NoiseOscillator(this);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/math.es6":74}],81:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],82:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}]},{},[25])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9jb3JlL0F1ZGlvSU8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvY29yZS9Ob2RlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvUGFyYW0uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvY29yZS9XYXZlU2hhcGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvY29uZmlnLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvb3ZlcnJpZGVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvc2lnbmFsQ3VydmVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2VudmVsb3Blcy9BU0RSRW52ZWxvcGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZW52ZWxvcGVzL0N1c3RvbUVudmVsb3BlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L0RDVHJhcC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9EZWxheS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9QaW5nUG9uZ0RlbGF5LmVzNi5qcyIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L1NjaHJvZWRlckFsbFBhc3MuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZngvU2luZVNoYXBlci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9TdGVyZW9Sb3RhdGlvbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9TdGVyZW9XaWR0aC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9maWx0ZXJzL0ZpbHRlckJhbmsuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ2VuZXJhdG9ycy9Pc2NpbGxhdG9yR2VuZXJhdG9yLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9Db3VudGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9Dcm9zc2ZhZGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9EcnlXZXROb2RlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9FUVNoZWxmLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9QaGFzZU9mZnNldC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9pbnN0cnVtZW50cy9HZW5lcmF0b3JQbGF5ZXIuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWFpbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0Ficy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0FkZC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0F2ZXJhZ2UuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9DbGFtcC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0NvbnN0YW50LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvRGl2aWRlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvRmxvb3IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9MZXJwLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvTWF4LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvTWluLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvTXVsdGlwbHkuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9OZWdhdGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9Qb3cuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9SZWNpcHJvY2FsLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvUm91bmQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TYW1wbGVEZWxheS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1NjYWxlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU2NhbGVFeHAuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TaWduLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU3FydC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1NxdWFyZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1N1YnRyYWN0LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU3dpdGNoLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvQU5ELmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTG9naWNhbE9wZXJhdG9yLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTkFORC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL05PUi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL05PVC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL09SLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvWE9SLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUby5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0VxdWFsVG9aZXJvLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvR3JlYXRlclRoYW4uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhbkVxdWFsVG8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhblplcm8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9JZkVsc2UuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuRXF1YWxUby5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuWmVyby5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9Db3MuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC90cmlnb25vbWV0cnkvRGVnVG9SYWQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC90cmlnb25vbWV0cnkvUmFkVG9EZWcuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC90cmlnb25vbWV0cnkvU2luLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L1Rhbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvTWF0aC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvY2xlYW5lcnMuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9jb252ZXJzaW9ucy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvbWF0aC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvbm90ZVJlZ0V4cC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvbm90ZVN0cmluZ3MuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL25vdGVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9zZXRJTy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9vc2NpbGxhdG9ycy9GTU9zY2lsbGF0b3IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvb3NjaWxsYXRvcnMvTm9pc2VPc2NpbGxhdG9yLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL29zY2lsbGF0b3JzL09zY2lsbGF0b3JCYW5rLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL29zY2lsbGF0b3JzL1NpbmVCYW5rLmVzNiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7eUJDQW1CLGNBQWM7Ozs7UUFDMUIsaUJBQWlCOzsrQkFDQyxvQkFBb0I7Ozs7b0NBQ3JCLDJCQUEyQjs7Ozs2QkFDbEMsb0JBQW9COzs7O0lBRS9CLE9BQU87QUFlRSxhQWZULE9BQU8sR0FlbUM7WUFBL0IsT0FBTyxnQ0FBRyxJQUFJLFlBQVksRUFBRTs7OEJBZnZDLE9BQU87O0FBZ0JMLFlBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDOztBQUV4QixZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDOzs7Ozs7Ozs7O0FBVXhDLGNBQU0sQ0FBQyxjQUFjLENBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFO0FBQzNDLHFCQUFTLEVBQUUsS0FBSztBQUNoQixlQUFHLEVBQUksQ0FBQSxZQUFXO0FBQ2Qsb0JB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LFVBQVUsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsU0FBUyxDQUFFLENBQUM7QUFDNUMsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLFFBQVEsQ0FBRSxDQUFDO0FBQzVDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXBDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUUsQ0FBQzs7O0FBR3pDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHOUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFL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LENBQUMsU0FBUyxDQUFFLFVBQVUsQ0FBRSxDQUFDO0FBQzdDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxRQUFRLENBQUUsQ0FBQztBQUM1QyxhQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVwQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFFLENBQUM7OztBQUd6QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzlDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUs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QUFDLE1BQU0sQ0FBRSxDQUFDOztBQUUzQyxnQkFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUUsQ0FBQyxDQUFFLEdBQUcsZUFBZSxDQUFDOztBQUUvQyxlQUFHLENBQUMsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ2YsZUFBRyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsV0FBVyxDQUFFLENBQUM7QUFDakMsaUJBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFFLEdBQUcsQ0FBRSxDQUFDO1NBQ2pDOztBQUVELGFBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFL0MsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7Y0F2Q0MsUUFBUTs7QUFBUixZQUFRLFdBeUNWLEtBQUssR0FBQSxpQkFBYztZQUFaLEtBQUssZ0NBQUcsQ0FBQzs7QUFDWixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDNUIsYUFBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO0tBQ3JEOztBQTVDQyxZQUFRLFdBOENWLElBQUksR0FBQSxnQkFBYztZQUFaLEtBQUssZ0NBQUcsQ0FBQzs7QUFDWCxZQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0tBQzlDOztXQWhEQyxRQUFROzs7QUFtRGQsNEJBQVEsU0FBUyxDQUFDLGNBQWMsR0FBRyxVQUFVLFFBQVEsRUFBRztBQUNwRCxXQUFPLElBQUksUUFBUSxDQUFFLElBQUksRUFBRSxRQUFRLENBQUUsQ0FBQztDQUN6QyxDQUFDOztxQkFHTSxRQUFRIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBDT05GSUcgZnJvbSAnLi9jb25maWcuZXM2JztcbmltcG9ydCAnLi9vdmVycmlkZXMuZXM2JztcbmltcG9ydCBzaWduYWxDdXJ2ZXMgZnJvbSAnLi9zaWduYWxDdXJ2ZXMuZXM2JztcbmltcG9ydCBjb252ZXJzaW9ucyBmcm9tICcuLi9taXhpbnMvY29udmVyc2lvbnMuZXM2JztcbmltcG9ydCBtYXRoIGZyb20gJy4uL21peGlucy9tYXRoLmVzNic7XG5cbmNsYXNzIEF1ZGlvSU8ge1xuXG4gICAgc3RhdGljIG1peGluKCB0YXJnZXQsIHNvdXJjZSApIHtcbiAgICAgICAgZm9yICggbGV0IGkgaW4gc291cmNlICkge1xuICAgICAgICAgICAgaWYgKCBzb3VyY2UuaGFzT3duUHJvcGVydHkoIGkgKSApIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRbIGkgXSA9IHNvdXJjZVsgaSBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIG1peGluU2luZ2xlKCB0YXJnZXQsIHNvdXJjZSwgbmFtZSApIHtcbiAgICAgICAgdGFyZ2V0WyBuYW1lIF0gPSBzb3VyY2U7XG4gICAgfVxuXG5cbiAgICBjb25zdHJ1Y3RvciggY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKSApIHtcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7XG5cbiAgICAgICAgdGhpcy5tYXN0ZXIgPSB0aGlzLl9jb250ZXh0LmRlc3RpbmF0aW9uO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhbiBhbHdheXMtb24gJ2RyaXZlcicgbm9kZSB0aGF0IGNvbnN0YW50bHkgb3V0cHV0cyBhIHZhbHVlXG4gICAgICAgIC8vIG9mIDEuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEl0J3MgdXNlZCBieSBhIGZhaXIgZmV3IG5vZGVzLCBzbyBtYWtlcyBzZW5zZSB0byB1c2UgdGhlIHNhbWVcbiAgICAgICAgLy8gZHJpdmVyLCByYXRoZXIgdGhhbiBzcGFtbWluZyBhIGJ1bmNoIG9mIFdhdmVTaGFwZXJOb2RlcyBhbGwgYWJvdXRcbiAgICAgICAgLy8gdGhlIHBsYWNlLiBJdCBjYW4ndCBiZSBkZWxldGVkLCBzbyBubyB3b3JyaWVzIGFib3V0IGJyZWFraW5nXG4gICAgICAgIC8vIGZ1bmN0aW9uYWxpdHkgb2Ygbm9kZXMgdGhhdCBkbyB1c2UgaXQgc2hvdWxkIGl0IGF0dGVtcHQgdG8gYmVcbiAgICAgICAgLy8gb3ZlcndyaXR0ZW4uXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdGhpcywgJ2NvbnN0YW50RHJpdmVyJywge1xuICAgICAgICAgICAgd3JpdGVhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGdldDogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBsZXQgY29uc3RhbnREcml2ZXI7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggIWNvbnN0YW50RHJpdmVyIHx8IGNvbnN0YW50RHJpdmVyLmNvbnRleHQgIT09IHRoaXMuY29udGV4dCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0YW50RHJpdmVyID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gY29udGV4dC5jcmVhdGVCdWZmZXIoIDEsIDQwOTYsIGNvbnRleHQuc2FtcGxlUmF0ZSApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlckRhdGEgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIDAgKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJTb3VyY2UgPSBjb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBidWZmZXJEYXRhLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlckRhdGFbIGkgXSA9IDEuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yKCBsZXQgYnVmZmVyVmFsdWUgb2YgYnVmZmVyRGF0YSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBidWZmZXJWYWx1ZSA9IDEuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyU291cmNlLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlclNvdXJjZS5sb29wID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlclNvdXJjZS5zdGFydCggMCApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdGFudERyaXZlciA9IGJ1ZmZlclNvdXJjZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb25zdGFudERyaXZlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KCkgKVxuICAgICAgICB9ICk7XG4gICAgfVxuXG5cblxuICAgIGdldCBjb250ZXh0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dDtcbiAgICB9XG5cbiAgICBzZXQgY29udGV4dCggY29udGV4dCApIHtcbiAgICAgICAgaWYgKCAhKCBjb250ZXh0IGluc3RhbmNlb2YgQXVkaW9Db250ZXh0ICkgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIFwiSW52YWxpZCBhdWRpbyBjb250ZXh0IGdpdmVuOlwiICsgY29udGV4dCApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMubWFzdGVyID0gY29udGV4dC5kZXN0aW5hdGlvbjtcbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIEF1ZGlvSU8ucHJvdG90eXBlLCBzaWduYWxDdXJ2ZXMsICdjdXJ2ZXMnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBBdWRpb0lPLnByb3RvdHlwZSwgY29udmVyc2lvbnMsICdjb252ZXJ0JyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggQXVkaW9JTy5wcm90b3R5cGUsIG1hdGgsICdtYXRoJyApO1xuXG5cblxud2luZG93LkF1ZGlvSU8gPSBBdWRpb0lPO1xuZXhwb3J0IGRlZmF1bHQgQXVkaW9JTzsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcblxudmFyIGdyYXBocyA9IG5ldyBXZWFrTWFwKCk7XG5cbi8vIFRPRE86XG4vLyAgLSBQb3NzaWJseSByZW1vdmUgdGhlIG5lZWQgZm9yIG9ubHkgR2Fpbk5vZGVzXG4vLyAgICBhcyBpbnB1dHMvb3V0cHV0cz8gSXQnbGwgYWxsb3cgZm9yIHN1YmNsYXNzZXNcbi8vICAgIG9mIE5vZGUgdG8gYmUgbW9yZSBlZmZpY2llbnQuLi5cbmNsYXNzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtSW5wdXRzID0gMCwgbnVtT3V0cHV0cyA9IDAgKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gW107XG4gICAgICAgIHRoaXMub3V0cHV0cyA9IFtdO1xuXG4gICAgICAgIC8vIFRoaXMgb2JqZWN0IHdpbGwgaG9sZCBhbnkgdmFsdWVzIHRoYXQgY2FuIGJlXG4gICAgICAgIC8vIGNvbnRyb2xsZWQgd2l0aCBhdWRpbyBzaWduYWxzLlxuICAgICAgICB0aGlzLmNvbnRyb2xzID0ge307XG5cbiAgICAgICAgLy8gQm90aCB0aGVzZSBvYmplY3RzIHdpbGwganVzdCBob2xkIHJlZmVyZW5jZXNcbiAgICAgICAgLy8gdG8gZWl0aGVyIGlucHV0IG9yIG91dHB1dCBub2Rlcy4gSGFuZHkgd2hlblxuICAgICAgICAvLyB3YW50aW5nIHRvIGNvbm5lY3Qgc3BlY2lmaWMgaW5zL291dHMgd2l0aG91dFxuICAgICAgICAvLyBoYXZpbmcgdG8gdXNlIHRoZSBgLmNvbm5lY3QoIC4uLiwgMCwgMSApYCBzeW50YXguXG4gICAgICAgIHRoaXMubmFtZWRJbnB1dHMgPSB7fTtcbiAgICAgICAgdGhpcy5uYW1lZE91dHB1dHMgPSB7fTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1JbnB1dHM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuYWRkSW5wdXRDaGFubmVsKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IG51bU91dHB1dHM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuYWRkT3V0cHV0Q2hhbm5lbCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0R3JhcGgoIGdyYXBoICkge1xuICAgICAgICBncmFwaHMuc2V0KCB0aGlzLCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldEdyYXBoKCkge1xuICAgICAgICByZXR1cm4gZ3JhcGhzLmdldCggdGhpcyApIHx8IHt9O1xuICAgIH1cblxuICAgIGFkZElucHV0Q2hhbm5lbCgpIHtcbiAgICAgICAgdGhpcy5pbnB1dHMucHVzaCggdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKSApO1xuICAgIH1cblxuICAgIGFkZE91dHB1dENoYW5uZWwoKSB7XG4gICAgICAgIHRoaXMub3V0cHV0cy5wdXNoKCB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpICk7XG4gICAgfVxuXG4gICAgX2NsZWFuVXBTaW5nbGUoIGl0ZW0sIHBhcmVudCwga2V5ICkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLy8gSGFuZGxlIGFycmF5cyBieSBsb29waW5nIG92ZXIgdGhlbVxuICAgICAgICAvLyBhbmQgcmVjdXJzaXZlbHkgY2FsbGluZyB0aGlzIGZ1bmN0aW9uIHdpdGggZWFjaFxuICAgICAgICAvLyBhcnJheSBtZW1iZXIuXG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KCBpdGVtICkgKSB7XG4gICAgICAgICAgICBpdGVtLmZvckVhY2goZnVuY3Rpb24oIG5vZGUsIGluZGV4ICkge1xuICAgICAgICAgICAgICAgIHNlbGYuX2NsZWFuVXBTaW5nbGUoIG5vZGUsIGl0ZW0sIGluZGV4ICk7XG4gICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgIHBhcmVudFsga2V5IF0gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXVkaW9JTyBub2Rlcy4uLlxuICAgICAgICBlbHNlIGlmKCBpdGVtICYmIHR5cGVvZiBpdGVtLmNsZWFuVXAgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICBpZiggdHlwZW9mIGl0ZW0uZGlzY29ubmVjdCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICBpdGVtLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaXRlbS5jbGVhblVwKCk7XG5cbiAgICAgICAgICAgIGlmKCBwYXJlbnQgKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50WyBrZXkgXSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBcIk5hdGl2ZVwiIG5vZGVzLlxuICAgICAgICBlbHNlIGlmKCBpdGVtICYmIHR5cGVvZiBpdGVtLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICBpdGVtLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICAgICAgaWYoIHBhcmVudCApIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRbIGtleSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgdGhpcy5fY2xlYW5VcEluT3V0cygpO1xuICAgICAgICB0aGlzLl9jbGVhbklPKCk7XG5cbiAgICAgICAgLy8gRmluZCBhbnkgbm9kZXMgYXQgdGhlIHRvcCBsZXZlbCxcbiAgICAgICAgLy8gZGlzY29ubmVjdCBhbmQgbnVsbGlmeSB0aGVtLlxuICAgICAgICBmb3IoIHZhciBpIGluIHRoaXMgKSB7XG4gICAgICAgICAgICB0aGlzLl9jbGVhblVwU2luZ2xlKCB0aGlzWyBpIF0sIHRoaXMsIGkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERvIHRoZSBzYW1lIGZvciBhbnkgbm9kZXMgaW4gdGhlIGdyYXBoLlxuICAgICAgICBmb3IoIHZhciBpIGluIGdyYXBoICkge1xuICAgICAgICAgICAgdGhpcy5fY2xlYW5VcFNpbmdsZSggZ3JhcGhbIGkgXSwgZ3JhcGgsIGkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIC4uLmFuZCB0aGUgc2FtZSBmb3IgYW55IGNvbnRyb2wgbm9kZXMuXG4gICAgICAgIGZvciggdmFyIGkgaW4gdGhpcy5jb250cm9scyApIHtcbiAgICAgICAgICAgIHRoaXMuX2NsZWFuVXBTaW5nbGUoIHRoaXMuY29udHJvbHNbIGkgXSwgdGhpcy5jb250cm9scywgaSApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmluYWxseSwgYXR0ZW1wdCB0byBkaXNjb25uZWN0IHRoaXMgTm9kZS5cbiAgICAgICAgaWYoIHR5cGVvZiB0aGlzLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IG51bWJlck9mSW5wdXRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHMubGVuZ3RoO1xuICAgIH1cbiAgICBnZXQgbnVtYmVyT2ZPdXRwdXRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzLmxlbmd0aDtcbiAgICB9XG5cbiAgICBnZXQgaW5wdXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5wdXRzLmxlbmd0aCA/IHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA6IG51bGw7XG4gICAgfVxuICAgIHNldCBpbnB1dFZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5pbnB1dHMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgaSBdLmdhaW4udmFsdWUgPSB0aGlzLmludmVydElucHV0UGhhc2UgPyAtdmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBvdXRwdXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3V0cHV0cy5sZW5ndGggPyB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlIDogbnVsbDtcbiAgICB9XG4gICAgc2V0IG91dHB1dFZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5vdXRwdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IHRoaXMuaW52ZXJ0T3V0cHV0UGhhc2UgPyAtdmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBpbnZlcnRJbnB1dFBoYXNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHMubGVuZ3RoID9cbiAgICAgICAgICAgICggdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlIDwgMCApIDpcbiAgICAgICAgICAgIG51bGw7XG4gICAgfVxuICAgIHNldCBpbnZlcnRJbnB1dFBoYXNlKCBpbnZlcnRlZCApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBpbnB1dCwgdjsgaSA8IHRoaXMuaW5wdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgaW5wdXQgPSB0aGlzLmlucHV0c1sgaSBdLmdhaW47XG4gICAgICAgICAgICB2ID0gaW5wdXQudmFsdWU7XG4gICAgICAgICAgICBpbnB1dC52YWx1ZSA9IHYgPCAwID8gKCBpbnZlcnRlZCA/IHYgOiAtdiApIDogKCBpbnZlcnRlZCA/IC12IDogdiApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGludmVydE91dHB1dFBoYXNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzLmxlbmd0aCA/XG4gICAgICAgICAgICAoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPCAwICkgOlxuICAgICAgICAgICAgbnVsbDtcbiAgICB9XG5cbiAgICAvLyBUT0RPOlxuICAgIC8vICAtIHNldFZhbHVlQXRUaW1lP1xuICAgIHNldCBpbnZlcnRPdXRwdXRQaGFzZSggaW52ZXJ0ZWQgKSB7XG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgdjsgaSA8IHRoaXMub3V0cHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHYgPSB0aGlzLm91dHB1dHNbIGkgXS5nYWluLnZhbHVlO1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IHYgPCAwID8gKCBpbnZlcnRlZCA/IHYgOiAtdiApIDogKCBpbnZlcnRlZCA/IC12IDogdiApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBOb2RlLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggTm9kZS5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuVXBJbk91dHMsICdfY2xlYW5VcEluT3V0cycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIE5vZGUucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhbklPLCAnX2NsZWFuSU8nICk7XG5BdWRpb0lPLm1peGluKCBOb2RlLnByb3RvdHlwZSwgY29ubmVjdGlvbnMgKTtcblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOb2RlID0gZnVuY3Rpb24oIG51bUlucHV0cywgbnVtT3V0cHV0cyApIHtcbiAgICByZXR1cm4gbmV3IE5vZGUoIHRoaXMsIG51bUlucHV0cywgbnVtT3V0cHV0cyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTm9kZTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcblxuXG5jbGFzcyBQYXJhbSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSwgZGVmYXVsdFZhbHVlICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLmlucHV0cyA9IHRoaXMub3V0cHV0cyA9IFsgdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKSBdO1xuICAgICAgICB0aGlzLl9jb250cm9sID0gdGhpcy5pbnB1dHNbIDAgXTtcblxuICAgICAgICAvLyBIbW0uLi4gSGFkIHRvIHB1dCB0aGlzIGhlcmUgc28gTm90ZSB3aWxsIGJlIGFibGVcbiAgICAgICAgLy8gdG8gcmVhZCB0aGUgdmFsdWUuLi5cbiAgICAgICAgLy8gVE9ETzpcbiAgICAgICAgLy8gIC0gU2hvdWxkIEkgY3JlYXRlIGEgYC5fdmFsdWVgIHByb3BlcnR5IHRoYXQgd2lsbFxuICAgICAgICAvLyAgICBzdG9yZSB0aGUgdmFsdWVzIHRoYXQgdGhlIFBhcmFtIHNob3VsZCBiZSByZWZsZWN0aW5nXG4gICAgICAgIC8vICAgIChmb3JnZXR0aW5nLCBvZiBjb3Vyc2UsIHRoYXQgYWxsIHRoZSAqVmFsdWVBdFRpbWUgW2V0Yy5dXG4gICAgICAgIC8vICAgIGZ1bmN0aW9ucyBhcmUgZnVuY3Rpb25zIG9mIHRpbWU7IGAuX3ZhbHVlYCBwcm9wIHdvdWxkIGJlXG4gICAgICAgIC8vICAgIHNldCBpbW1lZGlhdGVseSwgd2hpbHN0IHRoZSByZWFsIHZhbHVlIHdvdWxkIGJlIHJhbXBpbmcpXG4gICAgICAgIC8vXG4gICAgICAgIC8vICAtIE9yLCBzaG91bGQgSSBjcmVhdGUgYSBgLl92YWx1ZWAgcHJvcGVydHkgdGhhdCB3aWxsXG4gICAgICAgIC8vICAgIHRydWVseSByZWZsZWN0IHRoZSBpbnRlcm5hbCB2YWx1ZSBvZiB0aGUgR2Fpbk5vZGU/IFdpbGxcbiAgICAgICAgLy8gICAgcmVxdWlyZSBNQUZGUy4uLlxuICAgICAgICB0aGlzLl92YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgPyB2YWx1ZSA6IDEuMDtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLnZhbHVlID0gdGhpcy5fdmFsdWU7XG5cbiAgICAgICAgdGhpcy5zZXRWYWx1ZUF0VGltZSggdGhpcy5fdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgICAgICB0aGlzLmRlZmF1bHRWYWx1ZSA9IHR5cGVvZiBkZWZhdWx0VmFsdWUgPT09ICdudW1iZXInID8gZGVmYXVsdFZhbHVlIDogdGhpcy5fY29udHJvbC5nYWluLmRlZmF1bHRWYWx1ZTtcblxuXG4gICAgICAgIC8vIFRPRE86XG4gICAgICAgIC8vICAtIFNob3VsZCB0aGUgZHJpdmVyIGFsd2F5cyBiZSBjb25uZWN0ZWQ/XG4gICAgICAgIC8vICAtIE5vdCBzdXJlIHdoZXRoZXIgUGFyYW0gc2hvdWxkIG91dHB1dCAwIGlmIHZhbHVlICE9PSBOdW1iZXIuXG4gICAgICAgIGlmICggdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMuaW8uY29uc3RhbnREcml2ZXIuY29ubmVjdCggdGhpcy5fY29udHJvbCApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuZGVmYXVsdFZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLl9jbGVhblVwSW5PdXRzKCk7XG4gICAgICAgIHRoaXMuX2NsZWFuSU8oKTtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLl9jb250cm9sID0gbnVsbDtcbiAgICAgICAgdGhpcy5kZWZhdWx0VmFsdWUgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgIH1cblxuICAgIHNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgc3RhcnRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4uc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSggdmFsdWUsIGVuZFRpbWUgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0VGFyZ2V0QXRUaW1lKCB2YWx1ZSwgc3RhcnRUaW1lLCB0aW1lQ29uc3RhbnQgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5zZXRUYXJnZXRBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUsIHRpbWVDb25zdGFudCApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRWYWx1ZUN1cnZlQXRUaW1lKCB2YWx1ZXMsIHN0YXJ0VGltZSwgZHVyYXRpb24gKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5zZXRWYWx1ZUN1cnZlQXRUaW1lKCB2YWx1ZXMsIHN0YXJ0VGltZSwgZHVyYXRpb24gKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCBzdGFydFRpbWUgKSB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHN0YXJ0VGltZSApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIC8vIHJldHVybiB0aGlzLl9jb250cm9sLmdhaW4udmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cblxuICAgIGdldCBjb250cm9sKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29udHJvbC5nYWluO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBQYXJhbS5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFBhcmFtLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5VcEluT3V0cywgJ19jbGVhblVwSW5PdXRzJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggUGFyYW0ucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhbklPLCAnX2NsZWFuSU8nICk7XG5BdWRpb0lPLm1peGluKCBQYXJhbS5wcm90b3R5cGUsIGNvbm5lY3Rpb25zICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBhcmFtID0gZnVuY3Rpb24oIHZhbHVlLCBkZWZhdWx0VmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBQYXJhbSggdGhpcywgdmFsdWUsIGRlZmF1bHRWYWx1ZSApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgUGFyYW07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4vQXVkaW9JTy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBjb25uZWN0aW9ucyBmcm9tIFwiLi4vbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNlwiO1xuaW1wb3J0IGNsZWFuZXJzIGZyb20gXCIuLi9taXhpbnMvY2xlYW5lcnMuZXM2XCI7XG5cbmNsYXNzIFdhdmVTaGFwZXIge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgY3VydmVPckl0ZXJhdG9yLCBzaXplICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLnNoYXBlciA9IHRoaXMuY29udGV4dC5jcmVhdGVXYXZlU2hhcGVyKCk7XG5cbiAgICAgICAgLy8gSWYgYSBGbG9hdDMyQXJyYXkgaXMgcHJvdmlkZWQsIHVzZSBpdFxuICAgICAgICAvLyBhcyB0aGUgY3VydmUgdmFsdWUuXG4gICAgICAgIGlmICggY3VydmVPckl0ZXJhdG9yIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ICkge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSBjdXJ2ZU9ySXRlcmF0b3I7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhIGZ1bmN0aW9uIGlzIHByb3ZpZGVkLCBjcmVhdGUgYSBjdXJ2ZVxuICAgICAgICAvLyB1c2luZyB0aGUgZnVuY3Rpb24gYXMgYW4gaXRlcmF0b3IuXG4gICAgICAgIGVsc2UgaWYgKCB0eXBlb2YgY3VydmVPckl0ZXJhdG9yID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgc2l6ZSA9IHR5cGVvZiBzaXplID09PSAnbnVtYmVyJyAmJiBzaXplID49IDIgPyBzaXplIDogQ09ORklHLmN1cnZlUmVzb2x1dGlvbjtcblxuICAgICAgICAgICAgdmFyIGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSggc2l6ZSApLFxuICAgICAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgICAgIHggPSAwO1xuXG4gICAgICAgICAgICBmb3IgKCBpOyBpIDwgc2l6ZTsgKytpICkge1xuICAgICAgICAgICAgICAgIHggPSAoIGkgLyBzaXplICkgKiAyIC0gMTtcbiAgICAgICAgICAgICAgICBhcnJheVsgaSBdID0gY3VydmVPckl0ZXJhdG9yKCB4LCBpLCBzaXplICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2hhcGVyLmN1cnZlID0gYXJyYXk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPdGhlcndpc2UsIGRlZmF1bHQgdG8gYSBMaW5lYXIgY3VydmUuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSB0aGlzLmlvLmN1cnZlcy5MaW5lYXI7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlucHV0cyA9IHRoaXMub3V0cHV0cyA9IFsgdGhpcy5zaGFwZXIgXTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLl9jbGVhblVwSW5PdXRzKCk7XG4gICAgICAgIHRoaXMuX2NsZWFuSU8oKTtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuc2hhcGVyID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgY3VydmUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNoYXBlci5jdXJ2ZTtcbiAgICB9XG4gICAgc2V0IGN1cnZlKCBjdXJ2ZSApIHtcbiAgICAgICAgaWYoIGN1cnZlIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ICkge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSBjdXJ2ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggV2F2ZVNoYXBlci5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFdhdmVTaGFwZXIucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhblVwSW5PdXRzLCAnX2NsZWFuVXBJbk91dHMnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBXYXZlU2hhcGVyLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5JTywgJ19jbGVhbklPJyApO1xuQXVkaW9JTy5taXhpbiggV2F2ZVNoYXBlci5wcm90b3R5cGUsIGNvbm5lY3Rpb25zICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVdhdmVTaGFwZXIgPSBmdW5jdGlvbiggY3VydmUsIHNpemUgKSB7XG4gICAgcmV0dXJuIG5ldyBXYXZlU2hhcGVyKCB0aGlzLCBjdXJ2ZSwgc2l6ZSApO1xufTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgY3VydmVSZXNvbHV0aW9uOiA0MDk2LCAvLyBNdXN0IGJlIGFuIGV2ZW4gbnVtYmVyLlxuXG4gICAgLy8gVXNlZCB3aGVuIGNvbnZlcnRpbmcgbm90ZSBzdHJpbmdzIChlZy4gJ0EjNCcpIHRvIE1JREkgdmFsdWVzLlxuICAgIC8vIEl0J3MgdGhlIG9jdGF2ZSBudW1iZXIgb2YgdGhlIGxvd2VzdCBDIG5vdGUgKE1JREkgbm90ZSAwKS5cbiAgICAvLyBDaGFuZ2UgdGhpcyBpZiB5b3UncmUgdXNlZCB0byBhIERBVyB0aGF0IGRvZXNuJ3QgdXNlIC0yIGFzIHRoZVxuICAgIC8vIGxvd2VzdCBvY3RhdmUuXG4gICAgbG93ZXN0T2N0YXZlOiAtMixcblxuICAgIC8vIExvd2VzdCBhbGxvd2VkIG51bWJlci4gVXNlZCBieSBzb21lIE1hdGhcbiAgICAvLyBmdW5jdGlvbnMsIGVzcGVjaWFsbHkgd2hlbiBjb252ZXJ0aW5nIGJldHdlZW5cbiAgICAvLyBudW1iZXIgZm9ybWF0cyAoaWUuIGh6IC0+IE1JREksIG5vdGUgLT4gTUlESSwgZXRjLiApXG4gICAgLy9cbiAgICAvLyBBbHNvIHVzZWQgaW4gY2FsbHMgdG8gQXVkaW9QYXJhbS5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lXG4gICAgLy8gc28gdGhlcmUncyBubyByYW1waW5nIHRvIDAgKHdoaWNoIHRocm93cyBhbiBlcnJvcikuXG4gICAgZXBzaWxvbjogMC4wMDEsXG5cbiAgICBtaWRpTm90ZVBvb2xTaXplOiA1MDBcbn07IiwiLy8gTmVlZCB0byBvdmVycmlkZSBleGlzdGluZyAuY29ubmVjdCBhbmQgLmRpc2Nvbm5lY3Rcbi8vIGZ1bmN0aW9ucyBmb3IgXCJuYXRpdmVcIiBBdWRpb1BhcmFtcyBhbmQgQXVkaW9Ob2Rlcy4uLlxuLy8gSSBkb24ndCBsaWtlIGRvaW5nIHRoaXMsIGJ1dCBzJ2dvdHRhIGJlIGRvbmUgOihcbiggZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9yaWdpbmFsQXVkaW9Ob2RlQ29ubmVjdCA9IEF1ZGlvTm9kZS5wcm90b3R5cGUuY29ubmVjdCxcbiAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVEaXNjb25uZWN0ID0gQXVkaW9Ob2RlLnByb3RvdHlwZS5kaXNjb25uZWN0LFxuICAgICAgICBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuICAgIEF1ZGlvTm9kZS5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCApIHtcbiAgICAgICAgaWYgKCBub2RlLmlucHV0cyApIHtcbiAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggbm9kZS5pbnB1dHMgKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3QoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0KCBub2RlLmlucHV0c1sgMCBdLCBvdXRwdXRDaGFubmVsLCBpbnB1dENoYW5uZWwgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9Ob2RlICkge1xuICAgICAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVDb25uZWN0LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZUNvbm5lY3QuY2FsbCggdGhpcywgbm9kZSwgb3V0cHV0Q2hhbm5lbCApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIEF1ZGlvTm9kZS5wcm90b3R5cGUuZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCApIHtcbiAgICAgICAgaWYgKCBub2RlICYmIG5vZGUuaW5wdXRzICkge1xuICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBub2RlLmlucHV0cyApICkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoIG5vZGUuaW5wdXRzWyAwIF0sIG91dHB1dENoYW5uZWwsIGlucHV0Q2hhbm5lbCApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb05vZGUgKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZURpc2Nvbm5lY3QuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9QYXJhbSApIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlRGlzY29ubmVjdC5jYWxsKCB0aGlzLCBub2RlLCBvdXRwdXRDaGFubmVsICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlRGlzY29ubmVjdC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQXVkaW9Ob2RlLnByb3RvdHlwZS5jaGFpbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZXMgPSBzbGljZS5jYWxsKCBhcmd1bWVudHMgKSxcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QuY2FsbCggbm9kZSwgbm9kZXNbIGkgXSApO1xuICAgICAgICAgICAgbm9kZSA9IG5vZGVzWyBpIF07XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQXVkaW9Ob2RlLnByb3RvdHlwZS5mYW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVzID0gc2xpY2UuY2FsbCggYXJndW1lbnRzICksXG4gICAgICAgICAgICBub2RlID0gdGhpcztcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgbm9kZS5jb25uZWN0LmNhbGwoIG5vZGUsIG5vZGVzWyBpIF0gKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0oKSApOyIsImltcG9ydCBDT05GSUcgZnJvbSAnLi9jb25maWcuZXM2JztcbmltcG9ydCBtYXRoIGZyb20gJy4uL21peGlucy9NYXRoLmVzNic7XG5cblxubGV0IHNpZ25hbEN1cnZlcyA9IHt9O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0NvbnN0YW50Jywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnTGluZWFyJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnRXF1YWxQb3dlcicsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICksXG4gICAgICAgICAgICBzaW4gPSBNYXRoLnNpbixcbiAgICAgICAgICAgIFBJID0gTWF0aC5QSTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gc2luKCB4ICogMC41ICogUEkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdDdWJlZCcsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICksXG4gICAgICAgICAgICBzaW4gPSBNYXRoLnNpbixcbiAgICAgICAgICAgIFBJID0gTWF0aC5QSSxcbiAgICAgICAgICAgIHBvdyA9IE1hdGgucG93O1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIHggPSBwb3coIHgsIDMgKTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBzaW4oIHggKiAwLjUgKiBQSSApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdSZWN0aWZ5Jywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBoYWxmUmVzb2x1dGlvbiA9IHJlc29sdXRpb24gKiAwLjUsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IC1oYWxmUmVzb2x1dGlvbiwgeCA9IDA7IGkgPCBoYWxmUmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSA+IDAgPyBpIDogLWkgKSAvIGhhbGZSZXNvbHV0aW9uO1xuICAgICAgICAgICAgY3VydmVbIGkgKyBoYWxmUmVzb2x1dGlvbiBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cblxuLy8gTWF0aCBjdXJ2ZXNcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnR3JlYXRlclRoYW5aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA8PSAwID8gMC4wIDogMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnTGVzc1RoYW5aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA+PSAwID8gMCA6IDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0VxdWFsVG9aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA9PT0gMCA/IDEgOiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdSZWNpcHJvY2FsJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IDQwOTYgKiA2MDAsIC8vIEhpZ2hlciByZXNvbHV0aW9uIG5lZWRlZCBoZXJlLlxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgLy8gY3VydmVbIGkgXSA9IHggPT09IDAgPyAxIDogMDtcblxuICAgICAgICAgICAgaWYgKCB4ICE9PSAwICkge1xuICAgICAgICAgICAgICAgIHggPSBNYXRoLnBvdyggeCwgLTEgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1NpbmUnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApLFxuICAgICAgICAgICAgc2luID0gTWF0aC5zaW47XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIChNYXRoLlBJICogMikgLSBNYXRoLlBJO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHNpbiggeCApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnUm91bmQnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDUwLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgKCB4ID4gMCAmJiB4IDw9IDAuNTAwMDEgKSB8fFxuICAgICAgICAgICAgICAgICggeCA8IDAgJiYgeCA+PSAtMC41MDAwMSApXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCB4ID4gMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gMVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgeCA9IC0xO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnU2lnbicsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogMixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBNYXRoLnNpZ24oIHggKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnRmxvb3InLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDUwLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuXG4gICAgICAgICAgICBpZiAoIHggPj0gMC45OTk5ICkge1xuICAgICAgICAgICAgICAgIHggPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIHggPj0gMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCB4IDwgMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gLTE7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdHYXVzc2lhbldoaXRlTm9pc2UnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDIsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gbWF0aC5ucmFuZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnV2hpdGVOb2lzZScsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogMixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnUGlua05vaXNlJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24gKiAyLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgbWF0aC5nZW5lcmF0ZVBpbmtOdW1iZXIoKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gbWF0aC5nZXROZXh0UGlua051bWJlcigpICogMiAtIDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gc2lnbmFsQ3VydmVzOyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBDdXN0b21FbnZlbG9wZSBmcm9tIFwiLi9DdXN0b21FbnZlbG9wZS5lczZcIjtcblxuY2xhc3MgQVNEUkVudmVsb3BlIGV4dGVuZHMgQ3VzdG9tRW52ZWxvcGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdGhpcy50aW1lcyA9IHtcbiAgICAgICAgICAgIGF0dGFjazogMC4wMSxcbiAgICAgICAgICAgIGRlY2F5OiAwLjUsXG4gICAgICAgICAgICByZWxlYXNlOiAwLjVcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxldmVscyA9IHtcbiAgICAgICAgICAgIGluaXRpYWw6IDAsXG4gICAgICAgICAgICBwZWFrOiAxLFxuICAgICAgICAgICAgc3VzdGFpbjogMSxcbiAgICAgICAgICAgIHJlbGVhc2U6IDBcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2luaXRpYWwnLCAwLCB0aGlzLmxldmVscy5pbml0aWFsICk7XG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnYXR0YWNrJywgdGhpcy50aW1lcy5hdHRhY2ssIHRoaXMubGV2ZWxzLnBlYWsgKTtcbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdkZWNheScsIHRoaXMudGltZXMuZGVjYXksIHRoaXMubGV2ZWxzLnN1c3RhaW4gKTtcbiAgICAgICAgdGhpcy5hZGRFbmRTdGVwKCAncmVsZWFzZScsIHRoaXMudGltZXMucmVsZWFzZSwgdGhpcy5sZXZlbHMucmVsZWFzZSwgdHJ1ZSApO1xuICAgIH1cblxuICAgIGdldCBhdHRhY2tUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5hdHRhY2s7XG4gICAgfVxuICAgIHNldCBhdHRhY2tUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuYXR0YWNrID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdhdHRhY2snLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBkZWNheVRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLmRlY2F5O1xuICAgIH1cbiAgICBzZXQgZGVjYXlUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuZGVjYXkgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ2RlY2F5JywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgcmVsZWFzZVRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLnJlbGVhc2U7XG4gICAgfVxuICAgIHNldCByZWxlYXNlVGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLnJlbGVhc2UgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ3JlbGVhc2UnLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBpbml0aWFsTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5pbml0aWFsO1xuICAgIH1cbiAgICBzZXQgaW5pdGlhbExldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMuaW5pdGlhbCA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdpbml0aWFsJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHBlYWtMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnBlYWs7XG4gICAgfVxuXG4gICAgc2V0IHBlYWtMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLnBlYWsgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnYXR0YWNrJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHN1c3RhaW5MZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnN1c3RhaW47XG4gICAgfVxuICAgIHNldCBzdXN0YWluTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5zdXN0YWluID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2RlY2F5JywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHJlbGVhc2VMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnJlbGVhc2U7XG4gICAgfVxuICAgIHNldCByZWxlYXNlTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5yZWxlYXNlID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ3JlbGVhc2UnLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBU0RSRW52ZWxvcGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEFTRFJFbnZlbG9wZSggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQVNEUkVudmVsb3BlOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgQ09ORklHIGZyb20gXCIuLi9jb3JlL2NvbmZpZy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcblxuY2xhc3MgQ3VzdG9tRW52ZWxvcGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgdGhpcy5fc2V0SU8oIGlvICk7XG5cbiAgICAgICAgdGhpcy5vcmRlcnMgPSB7XG4gICAgICAgICAgICBzdGFydDogW10sXG4gICAgICAgICAgICBzdG9wOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc3RlcHMgPSB7XG4gICAgICAgICAgICBzdGFydDoge30sXG4gICAgICAgICAgICBzdG9wOiB7fVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9hZGRTdGVwKCBzZWN0aW9uLCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCA9IGZhbHNlICkge1xuICAgICAgICBsZXQgc3RvcHMgPSB0aGlzLnN0ZXBzWyBzZWN0aW9uIF07XG5cbiAgICAgICAgaWYgKCBzdG9wc1sgbmFtZSBdICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnU3RvcCB3aXRoIG5hbWUgXCInICsgbmFtZSArICdcIiBhbHJlYWR5IGV4aXN0cy4nICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9yZGVyc1sgc2VjdGlvbiBdLnB1c2goIG5hbWUgKTtcblxuICAgICAgICB0aGlzLnN0ZXBzWyBzZWN0aW9uIF1bIG5hbWUgXSA9IHtcbiAgICAgICAgICAgIHRpbWU6IHRpbWUsXG4gICAgICAgICAgICBsZXZlbDogbGV2ZWwsXG4gICAgICAgICAgICBpc0V4cG9uZW50aWFsOiBpc0V4cG9uZW50aWFsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYWRkU3RhcnRTdGVwKCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCA9IGZhbHNlICkge1xuICAgICAgICB0aGlzLl9hZGRTdGVwKCAnc3RhcnQnLCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBhZGRFbmRTdGVwKCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCA9IGZhbHNlICkge1xuICAgICAgICB0aGlzLl9hZGRTdGVwKCAnc3RvcCcsIG5hbWUsIHRpbWUsIGxldmVsLCBpc0V4cG9uZW50aWFsICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFN0ZXBMZXZlbCggbmFtZSwgbGV2ZWwgKSB7XG4gICAgICAgIGxldCBzdGFydEluZGV4ID0gdGhpcy5vcmRlcnMuc3RhcnQuaW5kZXhPZiggbmFtZSApLFxuICAgICAgICAgICAgZW5kSW5kZXggPSB0aGlzLm9yZGVycy5zdG9wLmluZGV4T2YoIG5hbWUgKTtcblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggPT09IC0xICYmIGVuZEluZGV4ID09PSAtMSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ05vIHN0ZXAgd2l0aCBuYW1lIFwiJyArIG5hbWUgKyAnXCIuIE5vIGxldmVsIHNldC4nICk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggIT09IC0xICkge1xuICAgICAgICAgICAgdGhpcy5zdGVwcy5zdGFydFsgbmFtZSBdLmxldmVsID0gcGFyc2VGbG9hdCggbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RlcHMuc3RvcFsgbmFtZSBdLmxldmVsID0gcGFyc2VGbG9hdCggbGV2ZWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG4gICAgc2V0U3RlcFRpbWUoIG5hbWUsIHRpbWUgKSB7XG4gICAgICAgIHZhciBzdGFydEluZGV4ID0gdGhpcy5vcmRlcnMuc3RhcnQuaW5kZXhPZiggbmFtZSApLFxuICAgICAgICAgICAgZW5kSW5kZXggPSB0aGlzLm9yZGVycy5zdG9wLmluZGV4T2YoIG5hbWUgKTtcblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggPT09IC0xICYmIGVuZEluZGV4ID09PSAtMSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ05vIHN0ZXAgd2l0aCBuYW1lIFwiJyArIG5hbWUgKyAnXCIuIE5vIHRpbWUgc2V0LicgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc3RhcnRJbmRleCAhPT0gLTEgKSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnN0YXJ0WyBuYW1lIF0udGltZSA9IHBhcnNlRmxvYXQoIHRpbWUgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RlcHMuc3RvcFsgbmFtZSBdLnRpbWUgPSBwYXJzZUZsb2F0KCB0aW1lICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cblxuXG4gICAgX3RyaWdnZXJTdGVwKCBwYXJhbSwgc3RlcCwgc3RhcnRUaW1lICkge1xuICAgICAgICAvLyBpZiAoIHN0ZXAuaXNFeHBvbmVudGlhbCA9PT0gdHJ1ZSApIHtcbiAgICAgICAgICAgIC8vIFRoZXJlJ3Mgc29tZXRoaW5nIGFtaXNzIGhlcmUhXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggTWF0aC5tYXgoIHN0ZXAubGV2ZWwsIENPTkZJRy5lcHNpbG9uICksIHN0YXJ0VGltZSArIHN0ZXAudGltZSApO1xuICAgICAgICAgICAgLy8gcGFyYW0uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSggTWF0aC5tYXgoIHN0ZXAubGV2ZWwsIDAuMDEgKSwgc3RhcnRUaW1lICsgc3RlcC50aW1lICk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gZWxzZSB7XG4gICAgICAgICAgICBwYXJhbS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggc3RlcC5sZXZlbCwgc3RhcnRUaW1lICsgc3RlcC50aW1lICk7XG4gICAgICAgIC8vIH1cbiAgICB9XG5cbiAgICBfc3RhcnRTZWN0aW9uKCBzZWN0aW9uLCBwYXJhbSwgc3RhcnRUaW1lLCBjYW5jZWxTY2hlZHVsZWRWYWx1ZXMgKSB7XG4gICAgICAgIHZhciBzdG9wT3JkZXIgPSB0aGlzLm9yZGVyc1sgc2VjdGlvbiBdLFxuICAgICAgICAgICAgc3RlcHMgPSB0aGlzLnN0ZXBzWyBzZWN0aW9uIF0sXG4gICAgICAgICAgICBudW1TdG9wcyA9IHN0b3BPcmRlci5sZW5ndGgsXG4gICAgICAgICAgICBzdGVwO1xuXG4gICAgICAgIHBhcmFtLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggc3RhcnRUaW1lICk7XG4gICAgICAgIC8vIHBhcmFtLnNldFZhbHVlQXRUaW1lKCAwLCBzdGFydFRpbWUgKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1TdG9wczsgKytpICkge1xuICAgICAgICAgICAgc3RlcCA9IHN0ZXBzWyBzdG9wT3JkZXJbIGkgXSBdO1xuICAgICAgICAgICAgdGhpcy5fdHJpZ2dlclN0ZXAoIHBhcmFtLCBzdGVwLCBzdGFydFRpbWUgKTtcbiAgICAgICAgICAgIHN0YXJ0VGltZSArPSBzdGVwLnRpbWU7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHN0YXJ0KCBwYXJhbSwgZGVsYXkgPSAwICkge1xuICAgICAgICBpZiAoIHBhcmFtIGluc3RhbmNlb2YgQXVkaW9QYXJhbSA9PT0gZmFsc2UgJiYgcGFyYW0gaW5zdGFuY2VvZiBQYXJhbSA9PT0gZmFsc2UgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdDYW4gb25seSBzdGFydCBhbiBlbnZlbG9wZSBvbiBBdWRpb1BhcmFtIG9yIFBhcmFtIGluc3RhbmNlcy4nICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zdGFydFNlY3Rpb24oICdzdGFydCcsIHBhcmFtLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyBkZWxheSApO1xuICAgIH1cblxuICAgIHN0b3AoIHBhcmFtLCBkZWxheSA9IDAgKSB7XG4gICAgICAgIHRoaXMuX3N0YXJ0U2VjdGlvbiggJ3N0b3AnLCBwYXJhbSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgMC4xICsgZGVsYXkgKTtcbiAgICB9XG5cbiAgICBmb3JjZVN0b3AoIHBhcmFtLCBkZWxheSA9IDAgKSB7XG4gICAgICAgIHBhcmFtLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgZGVsYXkgKTtcbiAgICAgICAgLy8gcGFyYW0uc2V0VmFsdWVBdFRpbWUoIHBhcmFtLnZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyBkZWxheSApO1xuICAgICAgICBwYXJhbS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggMCwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgMC4wMDEgKTtcbiAgICB9XG5cbiAgICBnZXQgdG90YWxTdGFydFRpbWUoKSB7XG4gICAgICAgIHZhciBzdGFydHMgPSB0aGlzLnN0ZXBzLnN0YXJ0LFxuICAgICAgICAgICAgdGltZSA9IDAuMDtcblxuICAgICAgICBmb3IgKCB2YXIgaSBpbiBzdGFydHMgKSB7XG4gICAgICAgICAgICB0aW1lICs9IHN0YXJ0c1sgaSBdLnRpbWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGltZTtcbiAgICB9XG5cbiAgICBnZXQgdG90YWxTdG9wVGltZSgpIHtcbiAgICAgICAgdmFyIHN0b3BzID0gdGhpcy5zdGVwcy5zdG9wLFxuICAgICAgICAgICAgdGltZSA9IDAuMDtcblxuICAgICAgICBmb3IgKCB2YXIgaSBpbiBzdG9wcyApIHtcbiAgICAgICAgICAgIHRpbWUgKz0gc3RvcHNbIGkgXS50aW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRpbWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBDdXN0b21FbnZlbG9wZS5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ3VzdG9tRW52ZWxvcGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEN1c3RvbUVudmVsb3BlKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDdXN0b21FbnZlbG9wZTsiLCIvKlxuXHRHcmFwaCBmb3IgdGhpcyBub2RlIGlzIHNob3duIGluIHRoZSBmb2xsb3dpbmcgcGFwZXI6XG5cblx0XHRCZWF0IEZyZWkgLSBEaWdpdGFsIFNvdW5kIEdlbmVyYXRpb24gKEFwcGVuZGl4IEM6IE1pc2NlbGxhbmVvdXMg4oCTIDEuIERDIFRyYXApXG5cdFx0SUNTVCwgWnVyaWNoIFVuaSBvZiBBcnRzLlxuXG5cdEF2YWlsYWJsZSBoZXJlOlxuXHRcdGh0dHBzOi8vY291cnNlcy5jcy53YXNoaW5ndG9uLmVkdS9jb3Vyc2VzL2NzZTQ5MHMvMTFhdS9SZWFkaW5ncy9EaWdpdGFsX1NvdW5kX0dlbmVyYXRpb25fMS5wZGZcblxuXG5cblx0RXNzZW50aWFsbHksIGEgRENUcmFwIHJlbW92ZXMgdGhlIERDIG9mZnNldCBvciBEQyBiaWFzXG5cdGZyb20gdGhlIGluY29taW5nIHNpZ25hbCwgd2hlcmUgYSBEQyBvZmZzZXQgaXMgZWxlbWVudHNcblx0b2YgdGhlIHNpZ25hbCB0aGF0IGFyZSBhdCAwSHouXG5cblx0VGhlIGdyYXBoIGlzIGFzIGZvbGxvd3M6XG5cblx0XHQgICB8LS0tPC0tLTx8ICAgaW5wdXRcblx0XHQgICB8XHRcdHxcdCAgfFxuXHRcdCAgIC0+IHotMSAtPiAtPiBuZWdhdGUgLT4gLT4gb3V0XG5cdFx0ICAgfFx0XHRcdFx0XHQgfFxuXHRcdCAgIHw8LS0tLS0tLS0tLS0tLS0gKmEgPC18XG5cblxuXHRUaGUgYSwgb3IgYWxwaGEsIHZhbHVlIGlzIGNhbGN1bGF0ZWQgaXMgYXMgZm9sbG93czpcblx0XHRgYSA9IDJQSWZnIC8gZnNgXG5cblx0V2hlcmUgYGZnYCBkZXRlcm1pbmVzIHRoZSAnc3BlZWQnIG9mIHRoZSB0cmFwICh0aGUgJ2N1dG9mZicpLFxuXHRhbmQgYGZzYCBpcyB0aGUgc2FtcGxlIHJhdGUuIFRoaXMgY2FuIGJlIGV4cGFuZGVkIGludG8gdGhlXG5cdGZvbGxvd2luZyB0byBhdm9pZCBhIG1vcmUgZXhwZW5zaXZlIGRpdmlzaW9uIChhcyB0aGUgcmVjaXByb2NhbFxuXHRvZiB0aGUgc2FtcGxlIHJhdGUgY2FuIGJlIGNhbGN1bGF0ZWQgYmVmb3JlaGFuZCk6XG5cdFx0YGEgPSAoMiAqIFBJICogZmcpICogKDEgLyBmcylgXG5cblxuXHRHaXZlbiBhbiBgZmdgIG9mIDUsIGFuZCBzYW1wbGUgcmF0ZSBvZiA0ODAwMCwgd2UgZ2V0OlxuXHRcdGBhID0gMiAqIFBJICogNSAqICgxIC8gNDgwMDApYFxuXHRcdGBhID0gNi4yODMxICogNSAqIDIuMDgzMzNlLTA1YFxuXHRcdGBhID0gMzEuNDE1NSAqIDIuMDgzMzNlLTA1YFxuXHRcdGBhID0gMC4wMDA2NTQ0ODg1MzYxNWAuXG4gKi9cblxuaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgRENUcmFwIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBjdXRvZmYgPSA1ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBjdXRvZmYsIG9yIGBmZ2AgY29uc3RhbnQuXG4gICAgICAgIC8vIFRoZXJlIHdpbGwgcmFyZWx5IGJlIGEgbmVlZCB0byBjaGFuZ2UgdGhpcyB2YWx1ZSBmcm9tXG4gICAgICAgIC8vIGVpdGhlciB0aGUgZ2l2ZW4gb25lLCBvciBpdCdzIGRlZmF1bHQgb2YgNSxcbiAgICAgICAgLy8gc28gSSdtIG5vdCBtYWtpbmcgdGhpcyBpbnRvIGEgY29udHJvbC5cbiAgICAgICAgZ3JhcGguY3V0b2ZmID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggY3V0b2ZmICk7XG5cbiAgICAgICAgLy8gQWxwaGEgY2FsY3VsYXRpb25cbiAgICAgICAgZ3JhcGguUEkyID0gdGhpcy5pby5jcmVhdGVDb25zdGFudFBJMigpO1xuICAgICAgICBncmFwaC5jdXRvZmZNdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGguYWxwaGEgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKTtcbiAgICAgICAgZ3JhcGguUEkyLmNvbm5lY3QoIGdyYXBoLmN1dG9mZk11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmN1dG9mZi5jb25uZWN0KCBncmFwaC5jdXRvZmZNdWx0aXBseSwgMCwgMSApO1xuICAgICAgICBncmFwaC5jdXRvZmZNdWx0aXBseS5jb25uZWN0KCBncmFwaC5hbHBoYSwgMCwgMCApO1xuXG4gICAgICAgIC8vIE1haW4gZ3JhcGhcbiAgICAgICAgZ3JhcGgubmVnYXRlID0gdGhpcy5pby5jcmVhdGVOZWdhdGUoKTtcbiAgICAgICAgZ3JhcGguek1pbnVzT25lID0gdGhpcy5pby5jcmVhdGVTYW1wbGVEZWxheSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIG1haW4gZ3JhcGggYW5kIGFscGhhLlxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm5lZ2F0ZSApO1xuICAgICAgICBncmFwaC5uZWdhdGUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWxwaGEuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggZ3JhcGguek1pbnVzT25lICk7XG4gICAgICAgIGdyYXBoLnpNaW51c09uZS5jb25uZWN0KCBncmFwaC56TWludXNPbmUgKTtcbiAgICAgICAgZ3JhcGguek1pbnVzT25lLmNvbm5lY3QoIGdyYXBoLm5lZ2F0ZSApO1xuICAgICAgICBncmFwaC5uZWdhdGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRENUcmFwID0gZnVuY3Rpb24oIGN1dG9mZiApIHtcbiAgICByZXR1cm4gbmV3IERDVHJhcCggdGhpcywgY3V0b2ZmICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgRHJ5V2V0Tm9kZSBmcm9tIFwiLi4vZ3JhcGhzL0RyeVdldE5vZGUuZXM2XCI7XG5cbi8vIFRPRE86IEFkZCBmZWVkYmFja0xldmVsIGFuZCBkZWxheVRpbWUgUGFyYW0gaW5zdGFuY2VzXG4vLyB0byBjb250cm9sIHRoaXMgbm9kZS5cbmNsYXNzIERlbGF5IGV4dGVuZHMgRHJ5V2V0Tm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB0aW1lID0gMCwgZmVlZGJhY2tMZXZlbCA9IDAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgY29udHJvbCBub2Rlcy5cbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjayA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGZlZWRiYWNrTGV2ZWwgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdGltZSApO1xuXG4gICAgICAgIC8vIENyZWF0ZSBmZWVkYmFjayBhbmQgZGVsYXkgbm9kZXNcbiAgICAgICAgdGhpcy5mZWVkYmFjayA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcblxuICAgICAgICAvLyBTZXR1cCB0aGUgZmVlZGJhY2sgbG9vcFxuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMuZmVlZGJhY2sgKTtcbiAgICAgICAgdGhpcy5mZWVkYmFjay5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG5cbiAgICAgICAgLy8gQWxzbyBjb25uZWN0IHRoZSBkZWxheSB0byB0aGUgd2V0IG91dHB1dC5cbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLndldCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgaW5wdXQgdG8gZGVsYXlcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG5cbiAgICAgICAgdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudGltZS5jb25uZWN0KCB0aGlzLmRlbGF5LmRlbGF5VGltZSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2suZ2FpbiApO1xuICAgIH1cblxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZURlbGF5ID0gZnVuY3Rpb24oIHRpbWUsIGZlZWRiYWNrTGV2ZWwgKSB7XG4gICAgcmV0dXJuIG5ldyBEZWxheSggdGhpcywgdGltZSwgZmVlZGJhY2tMZXZlbCApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRGVsYXk7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBjb25uZWN0aW9ucyBmcm9tIFwiLi4vbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNlwiO1xuaW1wb3J0IGNsZWFuZXJzIGZyb20gXCIuLi9taXhpbnMvY2xlYW5lcnMuZXM2XCI7XG5pbXBvcnQgRHJ5V2V0Tm9kZSBmcm9tIFwiLi4vZ3JhcGhzL0RyeVdldE5vZGUuZXM2XCI7XG5pbXBvcnQgRGVsYXkgZnJvbSBcIi4vRGVsYXkuZXM2XCI7XG5cbi8vIFRPRE86XG4vLyAgLSBDb252ZXJ0IHRoaXMgbm9kZSB0byB1c2UgUGFyYW0gY29udHJvbHNcbi8vICAgIGZvciB0aW1lIGFuZCBmZWVkYmFjay5cblxuY2xhc3MgUGluZ1BvbmdEZWxheSBleHRlbmRzIERyeVdldE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdGltZSA9IDAuMjUsIGZlZWRiYWNrTGV2ZWwgPSAwLjUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIC8vIENyZWF0ZSBjaGFubmVsIHNwbGl0dGVyIGFuZCBtZXJnZXJcbiAgICAgICAgdGhpcy5zcGxpdHRlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoIDIgKTtcbiAgICAgICAgdGhpcy5tZXJnZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQ2hhbm5lbE1lcmdlciggMiApO1xuXG4gICAgICAgIC8vIENyZWF0ZSBmZWVkYmFjayBhbmQgZGVsYXkgbm9kZXNcbiAgICAgICAgdGhpcy5mZWVkYmFja0wgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmZlZWRiYWNrUiA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZGVsYXlMID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIHRoaXMuZGVsYXlSID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG5cbiAgICAgICAgLy8gU2V0dXAgdGhlIGZlZWRiYWNrIGxvb3BcbiAgICAgICAgdGhpcy5kZWxheUwuY29ubmVjdCggdGhpcy5mZWVkYmFja0wgKTtcbiAgICAgICAgdGhpcy5mZWVkYmFja0wuY29ubmVjdCggdGhpcy5kZWxheVIgKTtcbiAgICAgICAgdGhpcy5kZWxheVIuY29ubmVjdCggdGhpcy5mZWVkYmFja1IgKTtcbiAgICAgICAgdGhpcy5mZWVkYmFja1IuY29ubmVjdCggdGhpcy5kZWxheUwgKTtcblxuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5zcGxpdHRlciApO1xuICAgICAgICB0aGlzLnNwbGl0dGVyLmNvbm5lY3QoIHRoaXMuZGVsYXlMLCAwICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tMLmNvbm5lY3QoIHRoaXMubWVyZ2VyLCAwLCAwICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tSLmNvbm5lY3QoIHRoaXMubWVyZ2VyLCAwLCAxICk7XG4gICAgICAgIHRoaXMubWVyZ2VyLmNvbm5lY3QoIHRoaXMud2V0ICk7XG5cbiAgICAgICAgdGhpcy50aW1lID0gdGltZTtcbiAgICAgICAgdGhpcy5mZWVkYmFja0xldmVsID0gZmVlZGJhY2tMZXZlbDtcbiAgICB9XG5cbiAgICBnZXQgdGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVsYXlMLmRlbGF5VGltZTtcbiAgICB9XG5cbiAgICBzZXQgdGltZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZGVsYXlMLmRlbGF5VGltZS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZShcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgMC41XG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5kZWxheVIuZGVsYXlUaW1lLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyAwLjVcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBnZXQgZmVlZGJhY2tMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmVlZGJhY2tMLmdhaW4udmFsdWU7XG4gICAgfVxuXG4gICAgc2V0IGZlZWRiYWNrTGV2ZWwoIGxldmVsICkge1xuICAgICAgICB0aGlzLmZlZWRiYWNrTC5nYWluLnZhbHVlID0gbGV2ZWw7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tSLmdhaW4udmFsdWUgPSBsZXZlbDtcbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFBpbmdQb25nRGVsYXkucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5BdWRpb0lPLm1peGluKCBQaW5nUG9uZ0RlbGF5LnByb3RvdHlwZSwgY29ubmVjdGlvbnMgKTtcbkF1ZGlvSU8ubWl4aW4oIFBpbmdQb25nRGVsYXkucHJvdG90eXBlLCBjbGVhbmVycyApO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVQaW5nUG9uZ0RlbGF5ID0gZnVuY3Rpb24oIHRpbWUsIGZlZWRiYWNrTGV2ZWwgKSB7XG4gICAgcmV0dXJuIG5ldyBQaW5nUG9uZ0RlbGF5KCB0aGlzLCB0aW1lLCBmZWVkYmFja0xldmVsICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qXG4gICAgVGhpcyBOb2RlIGlzIGFuIGltcGxlbWVudGF0aW9uIG9mIG9uZSBvZiBTY2hyb2VkZXInc1xuICAgIEFsbFBhc3MgZ3JhcGhzLiBUaGlzIHBhcnRpY3VsYXIgZ3JhcGggaXMgc2hvd24gaW4gRmlndXJlMlxuICAgIGluIHRoZSBmb2xsb3dpbmcgcGFwZXI6XG5cbiAgICAgICAgTS4gUi4gU2Nocm9lZGVyIC0gTmF0dXJhbCBTb3VuZGluZyBBcnRpZmljaWFsIFJldmVyYmVyYXRpb25cblxuICAgICAgICBKb3VybmFsIG9mIHRoZSBBdWRpbyBFbmdpbmVlcmluZyBTb2NpZXR5LCBKdWx5IDE5NjIuXG4gICAgICAgIFZvbHVtZSAxMCwgTnVtYmVyIDMuXG5cblxuICAgIEl0J3MgYXZhaWxhYmxlIGhlcmU6XG4gICAgICAgIGh0dHA6Ly93d3cuZWNlLnJvY2hlc3Rlci5lZHUvfnpkdWFuL3RlYWNoaW5nL2VjZTQ3Mi9yZWFkaW5nL1NjaHJvZWRlcl8xOTYyLnBkZlxuXG5cbiAgICBUaGVyZSBhcmUgdGhyZWUgbWFpbiBwYXRocyBhbiBpbnB1dCBzaWduYWwgY2FuIHRha2U6XG5cbiAgICBpbiAtPiAtZ2FpbiAtPiBzdW0xIC0+IG91dFxuICAgIGluIC0+IHN1bTIgLT4gZGVsYXkgLT4gZ2FpbiAtPiBzdW0yXG4gICAgaW4gLT4gc3VtMiAtPiBkZWxheSAtPiBnYWluICgxLWdeMikgLT4gc3VtMVxuXG4gICAgRm9yIG5vdywgdGhlIHN1bW1pbmcgbm9kZXMgYXJlIGEgcGFydCBvZiB0aGUgZm9sbG93aW5nIGNsYXNzLFxuICAgIGJ1dCBjYW4gZWFzaWx5IGJlIHJlbW92ZWQgYnkgY29ubmVjdGluZyBgLWdhaW5gLCBgZ2FpbmAsIGFuZCBgMS1nYWluXjJgXG4gICAgdG8gYHRoaXMub3V0cHV0c1swXWAgYW5kIGAtZ2FpbmAgYW5kIGBpbmAgdG8gdGhlIGRlbGF5IGRpcmVjdGx5LlxuICovXG5cbi8vIFRPRE86XG4vLyAgLSBSZW1vdmUgdW5uZWNlc3Nhcnkgc3VtbWluZyBub2Rlcy5cbmNsYXNzIFNjaHJvZWRlckFsbFBhc3MgZXh0ZW5kcyBOb2RlIHtcblxuICAgIGNvbnN0cnVjdG9yKCBpbywgZGVsYXlUaW1lLCBmZWVkYmFjayApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnN1bTEgPSBpby5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguc3VtMiA9IGlvLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5wb3NpdGl2ZUdhaW4gPSBpby5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVHYWluID0gaW8uY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm5lZ2F0ZSA9IGlvLmNyZWF0ZU5lZ2F0ZSgpO1xuICAgICAgICBncmFwaC5kZWxheSA9IGlvLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgZ3JhcGgub25lTWludXNHYWluU3F1YXJlZCA9IGlvLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5taW51c09uZSA9IGlvLmNyZWF0ZVN1YnRyYWN0KCAxICk7XG4gICAgICAgIGdyYXBoLmdhaW5TcXVhcmVkID0gaW8uY3JlYXRlU3F1YXJlKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjayA9IGlvLmNyZWF0ZVBhcmFtKCBmZWVkYmFjayApLFxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRlbGF5VGltZSA9IGlvLmNyZWF0ZVBhcmFtKCBkZWxheVRpbWUgKTtcblxuICAgICAgICAvLyBaZXJvIG91dCBjb250cm9sbGVkIHBhcmFtcy5cbiAgICAgICAgZ3JhcGgucG9zaXRpdmVHYWluLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZUdhaW4uZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLm9uZU1pbnVzR2FpblNxdWFyZWQuZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBnYWluIGNvbnRyb2xzXG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2suY29ubmVjdCggZ3JhcGgucG9zaXRpdmVHYWluLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5uZWdhdGUgKTtcbiAgICAgICAgZ3JhcGgubmVnYXRlLmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlR2Fpbi5nYWluICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2suY29ubmVjdCggZ3JhcGguZ2FpblNxdWFyZWQgKTtcbiAgICAgICAgZ3JhcGguZ2FpblNxdWFyZWQuY29ubmVjdCggZ3JhcGgubWludXNPbmUgKTtcbiAgICAgICAgZ3JhcGgubWludXNPbmUuY29ubmVjdCggZ3JhcGgub25lTWludXNHYWluU3F1YXJlZC5nYWluICk7XG5cbiAgICAgICAgLy8gY29ubmVjdCBkZWxheSB0aW1lIGNvbnRyb2xcbiAgICAgICAgdGhpcy5jb250cm9scy5kZWxheVRpbWUuY29ubmVjdCggZ3JhcGguZGVsYXkuZGVsYXlUaW1lICk7XG5cbiAgICAgICAgLy8gRmlyc3Qgc2lnbmFsIHBhdGg6XG4gICAgICAgIC8vIGluIC0+IC1nYWluIC0+IGdyYXBoLnN1bTEgLT4gb3V0XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubmVnYXRpdmVHYWluICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlR2Fpbi5jb25uZWN0KCBncmFwaC5zdW0xICk7XG4gICAgICAgIGdyYXBoLnN1bTEuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTZWNvbmQgc2lnbmFsIHBhdGg6XG4gICAgICAgIC8vIChpbiAtPiBncmFwaC5zdW0yIC0+KSBkZWxheSAtPiBnYWluIC0+IGdyYXBoLnN1bTJcbiAgICAgICAgZ3JhcGguZGVsYXkuY29ubmVjdCggZ3JhcGgucG9zaXRpdmVHYWluICk7XG4gICAgICAgIGdyYXBoLnBvc2l0aXZlR2Fpbi5jb25uZWN0KCBncmFwaC5zdW0yICk7XG5cbiAgICAgICAgLy8gVGhpcmQgc2lnbmFsIHBhdGg6XG4gICAgICAgIC8vIGluIC0+IGdyYXBoLnN1bTIgLT4gZGVsYXkgLT4gZ2FpbiAoMS1nXjIpIC0+IGdyYXBoLnN1bTFcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zdW0yICk7XG4gICAgICAgIGdyYXBoLnN1bTIuY29ubmVjdCggZ3JhcGguZGVsYXkgKTtcbiAgICAgICAgZ3JhcGguZGVsYXkuY29ubmVjdCggZ3JhcGgub25lTWludXNHYWluU3F1YXJlZCApO1xuICAgICAgICBncmFwaC5vbmVNaW51c0dhaW5TcXVhcmVkLmNvbm5lY3QoIGdyYXBoLnN1bTEgKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2Nocm9lZGVyQWxsUGFzcyA9IGZ1bmN0aW9uKCBkZWxheVRpbWUsIGZlZWRiYWNrICkge1xuICAgIHJldHVybiBuZXcgU2Nocm9lZGVyQWxsUGFzcyggdGhpcywgZGVsYXlUaW1lLCBmZWVkYmFjayApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IERyeVdldE5vZGUgZnJvbSBcIi4uL2dyYXBocy9EcnlXZXROb2RlLmVzNlwiO1xuXG4vLyBUT0RPOiBBZGQgZmVlZGJhY2tMZXZlbCBhbmQgZGVsYXlUaW1lIFBhcmFtIGluc3RhbmNlc1xuLy8gdG8gY29udHJvbCB0aGlzIG5vZGUuXG5jbGFzcyBTaW5lU2hhcGVyIGV4dGVuZHMgRHJ5V2V0Tm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRyaXZlID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuU2luZSApO1xuICAgICAgICB0aGlzLnNoYXBlckRyaXZlID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5zaGFwZXJEcml2ZS5nYWluLnZhbHVlID0gMTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc2hhcGVyRHJpdmUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5kcml2ZS5jb25uZWN0KCB0aGlzLnNoYXBlckRyaXZlLmdhaW4gKTtcbiAgICAgICAgdGhpcy5zaGFwZXJEcml2ZS5jb25uZWN0KCB0aGlzLnNoYXBlciApO1xuICAgICAgICB0aGlzLnNoYXBlci5jb25uZWN0KCB0aGlzLndldCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2luZVNoYXBlciA9IGZ1bmN0aW9uKCB0aW1lLCBmZWVkYmFja0xldmVsICkge1xuICAgIHJldHVybiBuZXcgU2luZVNoYXBlciggdGhpcywgdGltZSwgZmVlZGJhY2tMZXZlbCApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2luZVNoYXBlcjsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vLyBCYXNlZCBvbiB0aGUgZm9sbG93aW5nIGZvcm11bGEgZnJvbSBNaWNoYWVsIEdydWhuOlxuLy8gIC0gaHR0cDovL211c2ljZHNwLm9yZy9zaG93QXJjaGl2ZUNvbW1lbnQucGhwP0FyY2hpdmVJRD0yNTVcbi8vXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vXG4vLyBDYWxjdWxhdGUgdHJhbnNmb3JtYXRpb24gbWF0cml4J3MgY29lZmZpY2llbnRzXG4vLyBjb3NfY29lZiA9IGNvcyhhbmdsZSk7XG4vLyBzaW5fY29lZiA9IHNpbihhbmdsZSk7XG5cbi8vIERvIHRoaXMgcGVyIHNhbXBsZVxuLy8gb3V0X2xlZnQgPSBpbl9sZWZ0ICogY29zX2NvZWYgLSBpbl9yaWdodCAqIHNpbl9jb2VmO1xuLy8gb3V0X3JpZ2h0ID0gaW5fbGVmdCAqIHNpbl9jb2VmICsgaW5fcmlnaHQgKiBjb3NfY29lZjtcbmNsYXNzIFN0ZXJlb1JvdGF0aW9uIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCByb3RhdGlvbiApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMucm90YXRpb24gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCByb3RhdGlvbiApO1xuXG4gICAgICAgIGdyYXBoLnNwbGl0dGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxTcGxpdHRlciggMiApO1xuICAgICAgICBncmFwaC5jb3MgPSB0aGlzLmlvLmNyZWF0ZUNvcygpO1xuICAgICAgICBncmFwaC5zaW4gPSB0aGlzLmlvLmNyZWF0ZVNpbigpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMucm90YXRpb24uY29ubmVjdCggZ3JhcGguY29zICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMucm90YXRpb24uY29ubmVjdCggZ3JhcGguc2luICk7XG5cbiAgICAgICAgZ3JhcGgubGVmdE11bHRpcGx5Q29zID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5sZWZ0TXVsdGlwbHlTaW4gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLnJpZ2h0TXVsdGlwbHlDb3MgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLnJpZ2h0TXVsdGlwbHlTaW4gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLmxlZnRDb3NNaW51c1JpZ2h0U2luID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICBncmFwaC5sZWZ0U2luQWRkUmlnaHRDb3MgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuXG5cblxuICAgICAgICBncmFwaC5pbnB1dExlZnQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5pbnB1dFJpZ2h0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgubWVyZ2VyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxNZXJnZXIoIDIgKTtcblxuICAgICAgICBncmFwaC5zcGxpdHRlci5jb25uZWN0KCBncmFwaC5pbnB1dExlZnQsIDAgKTtcbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIuY29ubmVjdCggZ3JhcGguaW5wdXRSaWdodCwgMSApO1xuXG4gICAgICAgIGdyYXBoLmlucHV0TGVmdC5jb25uZWN0KCBncmFwaC5sZWZ0TXVsdGlwbHlDb3MsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguY29zLmNvbm5lY3QoIGdyYXBoLmxlZnRNdWx0aXBseUNvcywgMCwgMSApO1xuICAgICAgICBncmFwaC5pbnB1dExlZnQuY29ubmVjdCggZ3JhcGgubGVmdE11bHRpcGx5U2luLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLnNpbi5jb25uZWN0KCBncmFwaC5sZWZ0TXVsdGlwbHlTaW4sIDAsIDEpO1xuXG4gICAgICAgIGdyYXBoLmlucHV0UmlnaHQuY29ubmVjdCggZ3JhcGgucmlnaHRNdWx0aXBseVNpbiwgMCwgMCApO1xuICAgICAgICBncmFwaC5zaW4uY29ubmVjdCggZ3JhcGgucmlnaHRNdWx0aXBseVNpbiwgMCwgMSApO1xuICAgICAgICBncmFwaC5pbnB1dFJpZ2h0LmNvbm5lY3QoIGdyYXBoLnJpZ2h0TXVsdGlwbHlDb3MsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguY29zLmNvbm5lY3QoIGdyYXBoLnJpZ2h0TXVsdGlwbHlDb3MsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5sZWZ0TXVsdGlwbHlDb3MuY29ubmVjdCggZ3JhcGgubGVmdENvc01pbnVzUmlnaHRTaW4sIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgucmlnaHRNdWx0aXBseVNpbi5jb25uZWN0KCBncmFwaC5sZWZ0Q29zTWludXNSaWdodFNpbiwgMCwgMSApO1xuICAgICAgICBncmFwaC5sZWZ0TXVsdGlwbHlTaW4uY29ubmVjdCggZ3JhcGgubGVmdFNpbkFkZFJpZ2h0Q29zLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLnJpZ2h0TXVsdGlwbHlDb3MuY29ubmVjdCggZ3JhcGgubGVmdFNpbkFkZFJpZ2h0Q29zLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGgubGVmdENvc01pbnVzUmlnaHRTaW4uY29ubmVjdCggZ3JhcGgubWVyZ2VyLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmxlZnRTaW5BZGRSaWdodENvcy5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDEgKTtcblxuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc3BsaXR0ZXIgKTtcbiAgICAgICAgZ3JhcGgubWVyZ2VyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5uYW1lZElucHV0cy5sZWZ0ID0gZ3JhcGguaW5wdXRMZWZ0O1xuICAgICAgICB0aGlzLm5hbWVkSW5wdXRzLnJpZ2h0ID0gZ3JhcGguaW5wdXRSaWdodDtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3RlcmVvUm90YXRpb24gPSBmdW5jdGlvbiggcm90YXRpb24gKSB7XG4gICAgcmV0dXJuIG5ldyBTdGVyZW9Sb3RhdGlvbiggdGhpcywgcm90YXRpb24gKTtcbn07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuLy8gQmFzZWQgb24gdGhlIGZvbGxvd2luZyBmb3JtdWxhIGZyb20gTWljaGFlbCBHcnVobjpcbi8vICAtIGh0dHA6Ly9tdXNpY2RzcC5vcmcvc2hvd0FyY2hpdmVDb21tZW50LnBocD9BcmNoaXZlSUQ9MjU2XG4vL1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vL1xuLy8gVGhlIGdyYXBoIHRoYXQncyBjcmVhdGVkIGlzIGFzIGZvbGxvd3M6XG4vL1xuLy8gICAgICAgICAgICAgICAgICAgfC0+IEwgLT4gbGVmdEFkZFJpZ2h0KCBjaDAgKSAtPiB8XG4vLyAgICAgICAgICAgICAgICAgICB8LT4gUiAtPiBsZWZ0QWRkUmlnaHQoIGNoMSApIC0+IHwgLT4gbXVsdGlwbHkoIDAuNSApIC0tLS0tLT4gbW9ub01pbnVzU3RlcmVvKCAwICkgLT4gbWVyZ2VyKCAwICkgLy8gb3V0TFxuLy8gaW5wdXQgLT4gc3BsaXR0ZXIgLSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfC0tLS0tPiBtb25vUGx1c1N0ZXJlbyggMCApIC0tPiBtZXJnZXIoIDEgKSAvLyBvdXRSXG4vLyAgICAgICAgICAgICAgICAgICB8LT4gTCAtPiByaWdodE1pbnVzTGVmdCggY2gxICkgLT4gfFxuLy8gICAgICAgICAgICAgICAgICAgfC0+IFIgLT4gcmlnaHRNaW51c0xlZnQoIGNoMCApIC0+IHwgLT4gbXVsdGlwbHkoIGNvZWYgKSAtLS0+IG1vbm9NaW51c1N0ZXJlbyggMSApIC0+IG1lcmdlciggMCApIC8vIG91dExcbi8vXG4vL1xuY2xhc3MgU3RlcmVvV2lkdGggZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHdpZHRoICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKCAyICk7XG4gICAgICAgIGdyYXBoLmNvZWZmaWNpZW50ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggd2lkdGggKTtcbiAgICAgICAgZ3JhcGguY29lZmZpY2llbnRIYWxmID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggMC41ICk7XG4gICAgICAgIGdyYXBoLmlucHV0TGVmdCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmlucHV0UmlnaHQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5sZWZ0QWRkUmlnaHQgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICBncmFwaC5yaWdodE1pbnVzTGVmdCA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHlQb2ludEZpdmUgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAwLjUgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHlDb2VmZmljaWVudCA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubW9ub01pbnVzU3RlcmVvID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICBncmFwaC5tb25vUGx1c1N0ZXJlbyA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLm1lcmdlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsTWVyZ2VyKCAyICk7XG5cbiAgICAgICAgZ3JhcGguY29lZmZpY2llbnQuY29ubmVjdCggZ3JhcGguY29lZmZpY2llbnRIYWxmICk7XG4gICAgICAgIGdyYXBoLmNvZWZmaWNpZW50SGFsZi5jb25uZWN0KCBncmFwaC5tdWx0aXBseUNvZWZmaWNpZW50LCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIuY29ubmVjdCggZ3JhcGguaW5wdXRMZWZ0LCAwICk7XG4gICAgICAgIGdyYXBoLnNwbGl0dGVyLmNvbm5lY3QoIGdyYXBoLmlucHV0UmlnaHQsIDEgKTtcbiAgICAgICAgZ3JhcGguaW5wdXRMZWZ0LmNvbm5lY3QoIGdyYXBoLmxlZnRBZGRSaWdodCwgMCwgMCApO1xuICAgICAgICBncmFwaC5pbnB1dFJpZ2h0LmNvbm5lY3QoIGdyYXBoLmxlZnRBZGRSaWdodCwgMCwgMSApO1xuICAgICAgICBncmFwaC5pbnB1dExlZnQuY29ubmVjdCggZ3JhcGgucmlnaHRNaW51c0xlZnQsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguaW5wdXRSaWdodC5jb25uZWN0KCBncmFwaC5yaWdodE1pbnVzTGVmdCwgMCwgMCApO1xuXG4gICAgICAgIGdyYXBoLmxlZnRBZGRSaWdodC5jb25uZWN0KCBncmFwaC5tdWx0aXBseVBvaW50Rml2ZSApO1xuICAgICAgICBncmFwaC5yaWdodE1pbnVzTGVmdC5jb25uZWN0KCBncmFwaC5tdWx0aXBseUNvZWZmaWNpZW50LCAwLCAwICk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbHlQb2ludEZpdmUuY29ubmVjdCggZ3JhcGgubW9ub01pbnVzU3RlcmVvLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5Q29lZmZpY2llbnQuY29ubmVjdCggZ3JhcGgubW9ub01pbnVzU3RlcmVvLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbHlQb2ludEZpdmUuY29ubmVjdCggZ3JhcGgubW9ub1BsdXNTdGVyZW8sIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHlDb2VmZmljaWVudC5jb25uZWN0KCBncmFwaC5tb25vUGx1c1N0ZXJlbywgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLm1vbm9NaW51c1N0ZXJlby5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubW9ub1BsdXNTdGVyZW8uY29ubmVjdCggZ3JhcGgubWVyZ2VyLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zcGxpdHRlciApO1xuICAgICAgICBncmFwaC5tZXJnZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLm5hbWVkSW5wdXRzLmxlZnQgPSBncmFwaC5pbnB1dExlZnQ7XG4gICAgICAgIHRoaXMubmFtZWRJbnB1dHMucmlnaHQgPSBncmFwaC5pbnB1dFJpZ2h0O1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMud2lkdGggPSBncmFwaC5jb2VmZmljaWVudDtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3RlcmVvV2lkdGggPSBmdW5jdGlvbiggd2lkdGggKSB7XG4gICAgcmV0dXJuIG5ldyBTdGVyZW9XaWR0aCggdGhpcywgd2lkdGggKTtcbn07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbnZhciBGSUxURVJfVFlQRVMgPSBbXG4gICAgJ2xvd3Bhc3MnLFxuICAgICdiYW5kcGFzcycsXG4gICAgJ2hpZ2hwYXNzJyxcbiAgICAnbm90Y2gnLFxuICAgICdsb3dwYXNzJ1xuXTtcblxuY2xhc3MgRmlsdGVyQmFuayBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIxMmRCID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCBGSUxURVJfVFlQRVMubGVuZ3RoLCAwICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIyNGRCID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCBGSUxURVJfVFlQRVMubGVuZ3RoLCAwICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZSA9IHRoaXMuaW8uY3JlYXRlQ3Jvc3NmYWRlciggMiwgMCApO1xuICAgICAgICBncmFwaC5maWx0ZXJzMTJkQiA9IFtdO1xuICAgICAgICBncmFwaC5maWx0ZXJzMjRkQiA9IFtdO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuc2xvcGUgPSBncmFwaC5jcm9zc2ZhZGVyU2xvcGUuY29udHJvbHMuaW5kZXg7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLlEgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmlsdGVyVHlwZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5maWx0ZXJUeXBlLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXIxMmRCLmNvbnRyb2xzLmluZGV4ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmlsdGVyVHlwZS5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyMjRkQi5jb250cm9scy5pbmRleCApO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgZmlyc3Qgc2V0IG9mIDEyZGIgZmlsdGVycyAoc3RhbmRhcmQgaXNzdWUgd2l0aCBXZWJBdWRpb0FQSSlcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgRklMVEVSX1RZUEVTLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdmFyIGZpbHRlciA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcblxuICAgICAgICAgICAgZmlsdGVyLnR5cGUgPSBGSUxURVJfVFlQRVNbIGkgXTtcbiAgICAgICAgICAgIGZpbHRlci5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICAgICAgZmlsdGVyLlEudmFsdWUgPSAwO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBmaWx0ZXIuZnJlcXVlbmN5ICk7XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZmlsdGVyLlEgKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZmlsdGVyICk7XG4gICAgICAgICAgICBmaWx0ZXIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlcjEyZEIsIDAsIGkgKTtcblxuICAgICAgICAgICAgZ3JhcGguZmlsdGVyczEyZEIucHVzaCggZmlsdGVyICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgdGhlIHNlY29uZCBzZXQgb2YgMTJkYiBmaWx0ZXJzLFxuICAgICAgICAvLyB3aGVyZSB0aGUgZmlyc3Qgc2V0IHdpbGwgYmUgcGlwZWQgaW50byBzbyB3ZVxuICAgICAgICAvLyBlbmQgdXAgd2l0aCBkb3VibGUgdGhlIHJvbGxvZmYgKDEyZEIgKiAyID0gMjRkQikuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IEZJTFRFUl9UWVBFUy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHZhciBmaWx0ZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG5cbiAgICAgICAgICAgIGZpbHRlci50eXBlID0gRklMVEVSX1RZUEVTWyBpIF07XG4gICAgICAgICAgICBmaWx0ZXIuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgICAgIGZpbHRlci5RLnZhbHVlID0gMDtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coIGZpbHRlciApO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBmaWx0ZXIuZnJlcXVlbmN5ICk7XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLlEuY29ubmVjdCggZmlsdGVyLlEgKTtcbiAgICAgICAgICAgIGdyYXBoLmZpbHRlcnMxMmRCWyBpIF0uY29ubmVjdCggZmlsdGVyICk7XG4gICAgICAgICAgICBmaWx0ZXIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlcjI0ZEIsIDAsIGkgKTtcblxuICAgICAgICAgICAgZ3JhcGguZmlsdGVyczI0ZEIucHVzaCggZmlsdGVyICk7XG4gICAgICAgIH1cblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyMTJkQi5jb25uZWN0KCBncmFwaC5jcm9zc2ZhZGVyU2xvcGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlcjI0ZEIuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlclNsb3BlLCAwLCAxICk7XG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXJTbG9wZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVGaWx0ZXJCYW5rID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBGaWx0ZXJCYW5rKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBGaWx0ZXJCYW5rOyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcblxuY2xhc3MgT3NjaWxsYXRvckdlbmVyYXRvciB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZWZvcm0gKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMuZnJlcXVlbmN5ID0gZnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmRldHVuZSA9IGRldHVuZTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgICAgICB0aGlzLmdsaWRlVGltZSA9IGdsaWRlVGltZTtcbiAgICAgICAgdGhpcy53YXZlID0gd2F2ZWZvcm0gfHwgJ3NpbmUnO1xuICAgICAgICB0aGlzLnJlc2V0VGltZXN0YW1wID0gMC4wO1xuXG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yID0gdGhpcy5jb250ZXh0LmNyZWF0ZU9zY2lsbGF0b3IoKSxcbiAgICAgICAgdGhpcy52ZWxvY2l0eUdyYXBoID0gdGhpcy5fbWFrZVZlbG9jaXR5R3JhcGgoIHZlbG9jaXR5ICk7XG4gICAgICAgIHRoaXMub3V0cHV0cyA9IFsgdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKSBdO1xuICAgICAgICB0aGlzLnJlc2V0KCB0aGlzLmZyZXF1ZW5jeSwgdGhpcy5kZXR1bmUsIHRoaXMudmVsb2NpdHksIHRoaXMuZ2xpZGVUaW1lLCB0aGlzLndhdmUgKTtcblxuICAgICAgICB0aGlzLmdlbmVyYXRvci5jb25uZWN0KCB0aGlzLnZlbG9jaXR5R3JhcGggKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eUdyYXBoLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgX21ha2VWZWxvY2l0eUdyYXBoKCkge1xuICAgICAgICB2YXIgZ2FpbiA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHJldHVybiBnYWluO1xuICAgIH1cblxuICAgIF9yZXNldFZlbG9jaXR5R3JhcGgoIHZlbG9jaXR5ICkge1xuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGguZ2Fpbi52YWx1ZSA9IHZlbG9jaXR5O1xuICAgIH1cblxuICAgIF9jbGVhblVwVmVsb2NpdHlHcmFwaCgpIHtcbiAgICAgICAgdGhpcy52ZWxvY2l0eUdyYXBoLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGggPSBudWxsO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXSA9IG51bGw7XG4gICAgICAgIHRoaXMub3V0cHV0cyA9IG51bGw7XG4gICAgfVxuXG4gICAgbGVycCggc3RhcnQsIGVuZCwgZGVsdGEgKSB7XG4gICAgICAgIHJldHVybiBzdGFydCArICggKCBlbmQgLSBzdGFydCApICogZGVsdGEgKTtcbiAgICB9XG5cbiAgICByZXNldCggZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmUgKSB7XG4gICAgICAgIHZhciBub3cgPSB0aGlzLmNvbnRleHQuY3VycmVudFRpbWU7XG5cbiAgICAgICAgZnJlcXVlbmN5ID0gdHlwZW9mIGZyZXF1ZW5jeSA9PT0gJ251bWJlcicgPyBmcmVxdWVuY3kgOiB0aGlzLmZyZXF1ZW5jeTtcbiAgICAgICAgZGV0dW5lID0gdHlwZW9mIGRldHVuZSA9PT0gJ251bWJlcicgPyBkZXR1bmUgOiB0aGlzLmRldHVuZTtcbiAgICAgICAgdmVsb2NpdHkgPSB0eXBlb2YgdmVsb2NpdHkgPT09ICdudW1iZXInID8gdmVsb2NpdHkgOiB0aGlzLnZlbG9jaXR5O1xuICAgICAgICB3YXZlID0gdHlwZW9mIHdhdmUgPT09ICdudW1iZXInID8gd2F2ZSA6IHRoaXMud2F2ZTtcblxuICAgICAgICB2YXIgZ2xpZGVUaW1lID0gdHlwZW9mIGdsaWRlVGltZSA9PT0gJ251bWJlcicgPyBnbGlkZVRpbWUgOiAwO1xuXG4gICAgICAgIHRoaXMuX3Jlc2V0VmVsb2NpdHlHcmFwaCggdmVsb2NpdHkgKTtcblxuICAgICAgICB0aGlzLmdlbmVyYXRvci5mcmVxdWVuY3kuY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCBub3cgKTtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3IuZGV0dW5lLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggbm93ICk7XG5cbiAgICAgICAgLy8gbm93ICs9IDAuMVxuXG4gICAgICAgIC8vIGlmICggdGhpcy5nbGlkZVRpbWUgIT09IDAuMCApIHtcbiAgICAgICAgLy8gICAgIHZhciBzdGFydEZyZXEgPSB0aGlzLmZyZXF1ZW5jeSxcbiAgICAgICAgLy8gICAgICAgICBlbmRGcmVxID0gZnJlcXVlbmN5LFxuICAgICAgICAvLyAgICAgICAgIGZyZXFEaWZmID0gZW5kRnJlcSAtIHN0YXJ0RnJlcSxcbiAgICAgICAgLy8gICAgICAgICBzdGFydFRpbWUgPSB0aGlzLnJlc2V0VGltZXN0YW1wLFxuICAgICAgICAvLyAgICAgICAgIGVuZFRpbWUgPSB0aGlzLnJlc2V0VGltZXN0YW1wICsgdGhpcy5nbGlkZVRpbWUsXG4gICAgICAgIC8vICAgICAgICAgY3VycmVudFRpbWUgPSBub3cgLSBzdGFydFRpbWUsXG4gICAgICAgIC8vICAgICAgICAgbGVycFBvcyA9IGN1cnJlbnRUaW1lIC8gdGhpcy5nbGlkZVRpbWUsXG4gICAgICAgIC8vICAgICAgICAgY3VycmVudEZyZXEgPSB0aGlzLmxlcnAoIHRoaXMuZnJlcXVlbmN5LCBmcmVxdWVuY3ksIGxlcnBQb3MgKTtcblxuICAgICAgICAvLyAgICAgaWYgKCBjdXJyZW50VGltZSA8IGdsaWRlVGltZSApIHtcbiAgICAgICAgLy8gICAgICAgICBjb25zb2xlLmxvZyggJ2N1dG9mZicsIHN0YXJ0RnJlcSwgY3VycmVudEZyZXEgKTtcbiAgICAgICAgLy8gICAgICAgICB0aGlzLmdlbmVyYXRvci5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoIGN1cnJlbnRGcmVxLCBub3cgKTtcbiAgICAgICAgLy8gICAgIH1cblxuXG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyggc3RhcnRUaW1lLCBlbmRUaW1lLCBub3csIGN1cnJlbnRUaW1lICk7XG4gICAgICAgIC8vIH1cblxuXG4gICAgICAgIC8vIG5vdyArPSAwLjU7XG5cbiAgICAgICAgaWYgKCBnbGlkZVRpbWUgIT09IDAgKSB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRvci5mcmVxdWVuY3kubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIGZyZXF1ZW5jeSwgbm93ICsgZ2xpZGVUaW1lICk7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRvci5kZXR1bmUubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIGRldHVuZSwgbm93ICsgZ2xpZGVUaW1lICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRvci5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoIGZyZXF1ZW5jeSwgbm93ICk7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRvci5kZXR1bmUuc2V0VmFsdWVBdFRpbWUoIGRldHVuZSwgbm93ICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHR5cGVvZiB3YXZlID09PSAnc3RyaW5nJyApIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLnR5cGUgPSB3YXZlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IudHlwZSA9IHRoaXMud2F2ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVzZXRUaW1lc3RhbXAgPSBub3c7XG4gICAgICAgIHRoaXMuZ2xpZGVUaW1lID0gZ2xpZGVUaW1lO1xuICAgICAgICB0aGlzLmZyZXF1ZW5jeSA9IGZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5kZXR1bmUgPSBkZXR1bmU7XG4gICAgICAgIHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eTtcbiAgICAgICAgdGhpcy53YXZlID0gd2F2ZTtcbiAgICB9XG5cbiAgICBzdGFydCggZGVsYXkgKSB7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLnN0YXJ0KCBkZWxheSApO1xuICAgIH1cblxuICAgIHN0b3AoIGRlbGF5ICkge1xuICAgICAgICB0aGlzLmdlbmVyYXRvci5zdG9wKCBkZWxheSApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX2NsZWFuVXBWZWxvY2l0eUdyYXBoKCk7XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBPc2NpbGxhdG9yR2VuZXJhdG9yLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVPc2NpbGxhdG9yR2VuZXJhdG9yID0gZnVuY3Rpb24oIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlICkge1xuICAgIHJldHVybiBuZXcgT3NjaWxsYXRvckdlbmVyYXRvciggdGhpcywgZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gVE9ETzpcbi8vICAtIFR1cm4gYXJndW1lbnRzIGludG8gY29udHJvbGxhYmxlIHBhcmFtZXRlcnM7XG5jbGFzcyBDb3VudGVyIGV4dGVuZHMgTm9kZSB7XG5cbiAgICBjb25zdHJ1Y3RvciggaW8sIGluY3JlbWVudCwgbGltaXQsIHN0ZXBUaW1lICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLnN0ZXBUaW1lID0gc3RlcFRpbWUgfHwgMSAvIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlO1xuXG4gICAgICAgIHRoaXMuY29uc3RhbnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBpbmNyZW1lbnQgKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICB0aGlzLmRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gdGhpcy5zdGVwVGltZTtcblxuICAgICAgICB0aGlzLmZlZWRiYWNrID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5mZWVkYmFjay5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgdGhpcy5mZWVkYmFjay5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG5cbiAgICAgICAgdGhpcy5tdWx0aXBseS5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5mZWVkYmFjayApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcblxuICAgICAgICB0aGlzLmxlc3NUaGFuID0gdGhpcy5pby5jcmVhdGVMZXNzVGhhbiggbGltaXQgKTtcbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLmxlc3NUaGFuICk7XG4gICAgICAgIC8vIHRoaXMubGVzc1RoYW4uY29ubmVjdCggdGhpcy5mZWVkYmFjay5nYWluICk7XG4gICAgICAgIHRoaXMuY29uc3RhbnQuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmxlc3NUaGFuLmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICB9XG5cbiAgICByZXNldCgpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5zdGFydCgpO1xuICAgICAgICB9LCAxNiApO1xuICAgIH1cblxuICAgIHN0YXJ0KCkge1xuICAgICAgICBpZiggdGhpcy5ydW5uaW5nID09PSBmYWxzZSApIHtcbiAgICAgICAgICAgIHRoaXMucnVubmluZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IHRoaXMuc3RlcFRpbWU7XG4gICAgICAgICAgICB0aGlzLmxlc3NUaGFuLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2suZ2FpbiApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RvcCgpIHtcbiAgICAgICAgaWYoIHRoaXMucnVubmluZyA9PT0gdHJ1ZSApIHtcbiAgICAgICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5sZXNzVGhhbi5kaXNjb25uZWN0KCB0aGlzLmZlZWRiYWNrLmdhaW4gKTtcbiAgICAgICAgICAgIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb3VudGVyID0gZnVuY3Rpb24oIGluY3JlbWVudCwgbGltaXQsIHN0ZXBUaW1lICkge1xuICAgIHJldHVybiBuZXcgQ291bnRlciggdGhpcywgaW5jcmVtZW50LCBsaW1pdCwgc3RlcFRpbWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgQ3Jvc3NmYWRlciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtQ2FzZXMgPSAyLCBzdGFydGluZ0Nhc2UgPSAwICkge1xuXG4gICAgICAgIC8vIEVuc3VyZSBzdGFydGluZ0Nhc2UgaXMgbmV2ZXIgPCAwXG4gICAgICAgIC8vIGFuZCBudW1iZXIgb2YgaW5wdXRzIGlzIGFsd2F5cyA+PSAyIChubyBwb2ludFxuICAgICAgICAvLyB4LWZhZGluZyBiZXR3ZWVuIGxlc3MgdGhhbiB0d28gaW5wdXRzISlcbiAgICAgICAgc3RhcnRpbmdDYXNlID0gTWF0aC5hYnMoIHN0YXJ0aW5nQ2FzZSApO1xuICAgICAgICBudW1DYXNlcyA9IE1hdGgubWF4KCBudW1DYXNlcywgMiApO1xuXG4gICAgICAgIHN1cGVyKCBpbywgbnVtQ2FzZXMsIDEgKTtcblxuICAgICAgICB0aGlzLmNsYW1wcyA9IFtdO1xuICAgICAgICB0aGlzLnN1YnRyYWN0cyA9IFtdO1xuICAgICAgICB0aGlzLnhmYWRlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5jb250cm9scy5pbmRleCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IG51bUNhc2VzIC0gMTsgKytpICkge1xuICAgICAgICAgICAgdGhpcy54ZmFkZXJzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZURyeVdldE5vZGUoKTtcbiAgICAgICAgICAgIHRoaXMuc3VidHJhY3RzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCBpKTtcbiAgICAgICAgICAgIHRoaXMuY2xhbXBzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZUNsYW1wKCAwLCAxICk7XG5cbiAgICAgICAgICAgIGlmKCBpID09PSAwICkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0uY29ubmVjdCggdGhpcy54ZmFkZXJzWyBpIF0uZHJ5ICk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgKyAxIF0uY29ubmVjdCggdGhpcy54ZmFkZXJzWyBpIF0ud2V0ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnhmYWRlcnNbIGkgLSAxIF0uY29ubmVjdCggdGhpcy54ZmFkZXJzWyBpIF0uZHJ5ICk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgKyAxIF0uY29ubmVjdCggdGhpcy54ZmFkZXJzWyBpIF0ud2V0ICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuaW5kZXguY29ubmVjdCggdGhpcy5zdWJ0cmFjdHNbIGkgXSApO1xuICAgICAgICAgICAgdGhpcy5zdWJ0cmFjdHNbIGkgXS5jb25uZWN0KCB0aGlzLmNsYW1wc1sgaSBdICk7XG4gICAgICAgICAgICB0aGlzLmNsYW1wc1sgaSBdLmNvbm5lY3QoIHRoaXMueGZhZGVyc1sgaSBdLmNvbnRyb2xzLmRyeVdldCApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy54ZmFkZXJzWyB0aGlzLnhmYWRlcnMubGVuZ3RoIC0gMSBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ3Jvc3NmYWRlciA9IGZ1bmN0aW9uKCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICkge1xuICAgIHJldHVybiBuZXcgQ3Jvc3NmYWRlciggdGhpcywgbnVtQ2FzZXMsIHN0YXJ0aW5nQ2FzZSApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQ3Jvc3NmYWRlcjsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuLy8gVGhpcyBmdW5jdGlvbiBjcmVhdGVzIGEgZ3JhcGggdGhhdCBhbGxvd3MgbW9ycGhpbmdcbi8vIGJldHdlZW4gdHdvIGdhaW4gbm9kZXMuXG4vL1xuLy8gSXQgbG9va3MgYSBsaXR0bGUgYml0IGxpa2UgdGhpczpcbi8vXG4vLyAgICAgICAgICAgICAgICAgZHJ5IC0+IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLT4gfFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYgIEdhaW4oMC0xKSAgICAtPiAgICAgR2FpbigtMSkgICAgIC0+ICAgICBvdXRwdXRcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChmYWRlcikgICAgICAgICAoaW52ZXJ0IHBoYXNlKSAgICAgICAgKHN1bW1pbmcpXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICBeXG4vLyAgICB3ZXQgLT4gICBHYWluKC0xKSAgIC0+IC18XG4vLyAgICAgICAgICAoaW52ZXJ0IHBoYXNlKVxuLy9cbi8vIFdoZW4gYWRqdXN0aW5nIHRoZSBmYWRlcidzIGdhaW4gdmFsdWUgaW4gdGhpcyBncmFwaCxcbi8vIGlucHV0MSdzIGdhaW4gbGV2ZWwgd2lsbCBjaGFuZ2UgZnJvbSAwIHRvIDEsXG4vLyB3aGlsc3QgaW5wdXQyJ3MgZ2FpbiBsZXZlbCB3aWxsIGNoYW5nZSBmcm9tIDEgdG8gMC5cbmNsYXNzIERyeVdldE5vZGUgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMiwgMSApO1xuXG4gICAgICAgIHRoaXMuZHJ5ID0gdGhpcy5pbnB1dHNbIDAgXTtcbiAgICAgICAgdGhpcy53ZXQgPSB0aGlzLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIC8vIEludmVydCB3ZXQgc2lnbmFsJ3MgcGhhc2VcbiAgICAgICAgdGhpcy53ZXRJbnB1dEludmVydCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMud2V0SW5wdXRJbnZlcnQuZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICB0aGlzLndldC5jb25uZWN0KCB0aGlzLndldElucHV0SW52ZXJ0ICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBmYWRlciBub2RlXG4gICAgICAgIHRoaXMuZmFkZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmZhZGVyLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgY29udHJvbCBub2RlLiBJdCBzZXRzIHRoZSBmYWRlcidzIHZhbHVlLlxuICAgICAgICB0aGlzLmRyeVdldENvbnRyb2wgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuZHJ5V2V0Q29udHJvbC5jb25uZWN0KCB0aGlzLmZhZGVyLmdhaW4gKTtcblxuICAgICAgICAvLyBJbnZlcnQgdGhlIGZhZGVyIG5vZGUncyBwaGFzZVxuICAgICAgICB0aGlzLmZhZGVySW52ZXJ0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5mYWRlckludmVydC5nYWluLnZhbHVlID0gLTE7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBmYWRlciB0byBmYWRlciBwaGFzZSBpbnZlcnNpb24sXG4gICAgICAgIC8vIGFuZCBmYWRlciBwaGFzZSBpbnZlcnNpb24gdG8gb3V0cHV0LlxuICAgICAgICB0aGlzLndldElucHV0SW52ZXJ0LmNvbm5lY3QoIHRoaXMuZmFkZXIgKTtcbiAgICAgICAgdGhpcy5mYWRlci5jb25uZWN0KCB0aGlzLmZhZGVySW52ZXJ0ICk7XG4gICAgICAgIHRoaXMuZmFkZXJJbnZlcnQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBDb25uZWN0IGRyeSBpbnB1dCB0byBib3RoIHRoZSBvdXRwdXQgYW5kIHRoZSBmYWRlciBub2RlXG4gICAgICAgIHRoaXMuZHJ5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuZHJ5LmNvbm5lY3QoIHRoaXMuZmFkZXIgKTtcblxuICAgICAgICAvLyBBZGQgYSAnZHJ5V2V0JyBwcm9wZXJ0eSB0byB0aGUgY29udHJvbHMgb2JqZWN0LlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRyeVdldCA9IHRoaXMuZHJ5V2V0Q29udHJvbDtcbiAgICB9XG5cbn1cblxuXG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRHJ5V2V0Tm9kZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRHJ5V2V0Tm9kZSggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRHJ5V2V0Tm9kZTtcbiIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBFUVNoZWxmIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBoaWdoRnJlcXVlbmN5ID0gMjUwMCwgbG93RnJlcXVlbmN5ID0gMzUwLCBoaWdoQm9vc3QgPSAtNiwgbG93Qm9vc3QgPSAwICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLmhpZ2hGcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoRnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMubG93RnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93RnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuaGlnaEJvb3N0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaEJvb3N0ICk7XG4gICAgICAgIHRoaXMubG93Qm9vc3QgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dCb29zdCApO1xuXG4gICAgICAgIHRoaXMubG93U2hlbGYgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gICAgICAgIHRoaXMubG93U2hlbGYudHlwZSA9ICdsb3dzaGVsZic7XG4gICAgICAgIHRoaXMubG93U2hlbGYuZnJlcXVlbmN5LnZhbHVlID0gbG93RnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmxvd1NoZWxmLmdhaW4udmFsdWUgPSBsb3dCb29zdDtcblxuICAgICAgICB0aGlzLmhpZ2hTaGVsZiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgICAgICAgdGhpcy5oaWdoU2hlbGYudHlwZSA9ICdoaWdoc2hlbGYnO1xuICAgICAgICB0aGlzLmhpZ2hTaGVsZi5mcmVxdWVuY3kudmFsdWUgPSBoaWdoRnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmhpZ2hTaGVsZi5nYWluLnZhbHVlID0gaGlnaEJvb3N0O1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5sb3dTaGVsZiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuaGlnaFNoZWxmICk7XG4gICAgICAgIHRoaXMubG93U2hlbGYuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5oaWdoU2hlbGYuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICAvL1xuICAgICAgICAvLyBUT0RPOlxuICAgICAgICAvLyAgLSBTaG91bGQgdGhlc2UgYmUgcmVmZXJlbmNlcyB0byBwYXJhbS5jb250cm9sPyBUaGlzXG4gICAgICAgIC8vICAgIG1pZ2h0IGFsbG93IGRlZmF1bHRzIHRvIGJlIHNldCB3aGlsc3QgYWxzbyBhbGxvd2luZ1xuICAgICAgICAvLyAgICBhdWRpbyBzaWduYWwgY29udHJvbC5cbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoRnJlcXVlbmN5ID0gdGhpcy5oaWdoRnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0ZyZXF1ZW5jeSA9IHRoaXMubG93RnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hCb29zdCA9IHRoaXMuaGlnaEJvb3N0O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0Jvb3N0ID0gdGhpcy5sb3dCb29zdDtcbiAgICB9XG5cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRVFTaGVsZiA9IGZ1bmN0aW9uKCBoaWdoRnJlcXVlbmN5LCBsb3dGcmVxdWVuY3ksIGhpZ2hCb29zdCwgbG93Qm9vc3QgKSB7XG4gICAgcmV0dXJuIG5ldyBFUVNoZWxmKCB0aGlzLCBoaWdoRnJlcXVlbmN5LCBsb3dGcmVxdWVuY3ksIGhpZ2hCb29zdCwgbG93Qm9vc3QgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEVRU2hlbGY7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIFBoYXNlT2Zmc2V0IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLnJlY2lwcm9jYWwgPSB0aGlzLmlvLmNyZWF0ZVJlY2lwcm9jYWwoIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlICogMC41ICk7XG4gICAgICAgIHRoaXMuZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMucGhhc2UgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuaGFsZlBoYXNlID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggMC41ICk7XG5cbiAgICAgICAgdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuXG4gICAgICAgIHRoaXMuZnJlcXVlbmN5LmNvbm5lY3QoIHRoaXMucmVjaXByb2NhbCApO1xuICAgICAgICB0aGlzLnJlY2lwcm9jYWwuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLnBoYXNlLmNvbm5lY3QoIHRoaXMuaGFsZlBoYXNlICk7XG4gICAgICAgIHRoaXMuaGFsZlBoYXNlLmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseS5jb25uZWN0KCB0aGlzLmRlbGF5LmRlbGF5VGltZSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gMC41O1xuXG4gICAgICAgIC8vIFN0b3JlIGNvbnRyb2xsYWJsZSBwYXJhbXMuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5mcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuY29udHJvbHMucGhhc2UgPSB0aGlzLnBoYXNlO1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVQaGFzZU9mZnNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUGhhc2VPZmZzZXQoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFBoYXNlT2Zmc2V0OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG4vLyBpbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5pbXBvcnQgbWF0aCBmcm9tIFwiLi4vbWl4aW5zL21hdGguZXM2XCI7XG4vLyBpbXBvcnQgTm90ZSBmcm9tIFwiLi4vbm90ZS9Ob3RlLmVzNlwiO1xuLy8gaW1wb3J0IENob3JkIGZyb20gXCIuLi9ub3RlL0Nob3JkLmVzNlwiO1xuXG4vLyAgUGxheWVyXG4vLyAgPT09PT09XG4vLyAgVGFrZXMgY2FyZSBvZiByZXF1ZXN0aW5nIEdlbmVyYXRvck5vZGVzIGJlIGNyZWF0ZWQuXG4vL1xuLy8gIEhhczpcbi8vICAgICAgLSBQb2x5cGhvbnkgKHBhcmFtKVxuLy8gICAgICAtIFVuaXNvbiAocGFyYW0pXG4vLyAgICAgIC0gVW5pc29uIGRldHVuZSAocGFyYW0pXG4vLyAgICAgIC0gVW5pc29uIHBoYXNlIChwYXJhbSlcbi8vICAgICAgLSBHbGlkZSBtb2RlXG4vLyAgICAgIC0gR2xpZGUgdGltZVxuLy8gICAgICAtIFZlbG9jaXR5IHNlbnNpdGl2aXR5IChwYXJhbSlcbi8vICAgICAgLSBHbG9iYWwgdHVuaW5nIChwYXJhbSlcbi8vXG4vLyAgTWV0aG9kczpcbi8vICAgICAgLSBzdGFydCggZnJlcS9ub3RlLCB2ZWwsIGRlbGF5IClcbi8vICAgICAgLSBzdG9wKCBmcmVxL25vdGUsIHZlbCwgZGVsYXkgKVxuLy9cbi8vICBQcm9wZXJ0aWVzOlxuLy8gICAgICAtIHBvbHlwaG9ueSAobnVtYmVyLCA+MSlcbi8vICAgICAgLSB1bmlzb24gKG51bWJlciwgPjEpXG4vLyAgICAgIC0gdW5pc29uRGV0dW5lIChudW1iZXIsIGNlbnRzKVxuLy8gICAgICAtIHVuaXNvblBoYXNlIChudW1iZXIsIDAtMSlcbi8vICAgICAgLSBnbGlkZU1vZGUgKHN0cmluZylcbi8vICAgICAgLSBnbGlkZVRpbWUgKG1zLCBudW1iZXIpXG4vLyAgICAgIC0gdmVsb2NpdHlTZW5zaXRpdml0eSAoMC0xLCBudW1iZXIpXG4vLyAgICAgIC0gdHVuaW5nICgtNjQsICs2NCwgc2VtaXRvbmVzKVxuLy9cbmNsYXNzIEdlbmVyYXRvclBsYXllciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgb3B0aW9ucyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmdlbmVyYXRvciA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnR2VuZXJhdG9yUGxheWVyIHJlcXVpcmVzIGEgYGdlbmVyYXRvcmAgb3B0aW9uIHRvIGJlIGdpdmVuLicgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yID0gb3B0aW9ucy5nZW5lcmF0b3I7XG5cbiAgICAgICAgdGhpcy5wb2x5cGhvbnkgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBvcHRpb25zLnBvbHlwaG9ueSB8fCAxICk7XG5cbiAgICAgICAgdGhpcy51bmlzb24gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBvcHRpb25zLnVuaXNvbiB8fCAxICk7XG4gICAgICAgIHRoaXMudW5pc29uRGV0dW5lID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMudW5pc29uRGV0dW5lID09PSAnbnVtYmVyJyA/IG9wdGlvbnMudW5pc29uRGV0dW5lIDogMCApO1xuICAgICAgICB0aGlzLnVuaXNvblBoYXNlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMudW5pc29uUGhhc2UgPT09ICdudW1iZXInID8gb3B0aW9ucy51bmlzb25QaGFzZSA6IDAgKTtcbiAgICAgICAgdGhpcy51bmlzb25Nb2RlID0gb3B0aW9ucy51bmlzb25Nb2RlIHx8ICdjZW50ZXJlZCc7XG5cbiAgICAgICAgdGhpcy5nbGlkZU1vZGUgPSBvcHRpb25zLmdsaWRlTW9kZSB8fCAnZXF1YWwnO1xuICAgICAgICB0aGlzLmdsaWRlVGltZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHR5cGVvZiBvcHRpb25zLmdsaWRlVGltZSA9PT0gJ251bWJlcicgPyBvcHRpb25zLmdsaWRlVGltZSA6IDAgKTtcblxuICAgICAgICB0aGlzLnZlbG9jaXR5U2Vuc2l0aXZpdHkgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy52ZWxvY2l0eVNlbnNpdGl2aXR5ID09PSAnbnVtYmVyJyA/IG9wdGlvbnMudmVsb2NpdHlTZW5zaXRpdml0eSA6IDAgKTtcblxuICAgICAgICB0aGlzLnR1bmluZyA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHR5cGVvZiBvcHRpb25zLnR1bmluZyA9PT0gJ251bWJlcicgPyBvcHRpb25zLnR1bmluZyA6IDAgKTtcblxuICAgICAgICB0aGlzLndhdmVmb3JtID0gb3B0aW9ucy53YXZlZm9ybSB8fCAnc2luZSc7XG5cbiAgICAgICAgdGhpcy5lbnZlbG9wZSA9IG9wdGlvbnMuZW52ZWxvcGUgfHwgdGhpcy5pby5jcmVhdGVBU0RSRW52ZWxvcGUoKTtcblxuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHMgPSB7fTtcbiAgICAgICAgdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdCA9IFtdO1xuICAgICAgICB0aGlzLnRpbWVycyA9IFtdO1xuICAgIH1cblxuXG4gICAgX2NyZWF0ZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmVmb3JtICkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0b3IuY2FsbCggdGhpcy5pbywgZnJlcXVlbmN5LCBkZXR1bmUgKyB0aGlzLnR1bmluZy52YWx1ZSAqIDEwMCwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZWZvcm0gKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZXMgdGhlIGFtb3VudCBvZiBkZXR1bmUgKGNlbnRzKSB0byBhcHBseSB0byBhIGdlbmVyYXRvciBub2RlXG4gICAgICogZ2l2ZW4gYW4gaW5kZXggYmV0d2VlbiAwIGFuZCB0aGlzLnVuaXNvbi52YWx1ZVxuICAgICAqXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSB1bmlzb25JbmRleCBVbmlzb24gaW5kZXguXG4gICAgICogQHJldHVybiB7TnVtYmVyfSAgICAgICAgICAgICBEZXR1bmUgdmFsdWUsIGluIGNlbnRzLlxuICAgICAqL1xuICAgIF9jYWxjdWxhdGVEZXR1bmUoIHVuaXNvbkluZGV4ICkge1xuICAgICAgICB2YXIgZGV0dW5lID0gMC4wLFxuICAgICAgICAgICAgdW5pc29uRGV0dW5lID0gdGhpcy51bmlzb25EZXR1bmUudmFsdWU7XG5cbiAgICAgICAgaWYgKCB0aGlzLnVuaXNvbk1vZGUgPT09ICdjZW50ZXJlZCcgKSB7XG4gICAgICAgICAgICB2YXIgaW5jciA9IHVuaXNvbkRldHVuZTtcblxuICAgICAgICAgICAgZGV0dW5lID0gaW5jciAqIHVuaXNvbkluZGV4O1xuICAgICAgICAgICAgZGV0dW5lIC09IGluY3IgKiAoIHRoaXMudW5pc29uLnZhbHVlICogMC41ICk7XG4gICAgICAgICAgICBkZXR1bmUgKz0gaW5jciAqIDAuNTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBtdWx0aXBsaWVyO1xuXG4gICAgICAgICAgICAvLyBMZWF2ZSB0aGUgZmlyc3Qgbm90ZSBpbiB0aGUgdW5pc29uXG4gICAgICAgICAgICAvLyBhbG9uZSwgc28gaXQncyBkZXR1bmUgdmFsdWUgaXMgdGhlIHJvb3RcbiAgICAgICAgICAgIC8vIG5vdGUuXG4gICAgICAgICAgICBpZiAoIHVuaXNvbkluZGV4ID4gMCApIHtcbiAgICAgICAgICAgICAgICAvLyBIb3AgZG93biBuZWdhdGl2ZSBoYWxmIHRoZSB1bmlzb25JbmRleFxuICAgICAgICAgICAgICAgIGlmICggdW5pc29uSW5kZXggJSAyID09PSAwICkge1xuICAgICAgICAgICAgICAgICAgICBtdWx0aXBsaWVyID0gLXVuaXNvbkluZGV4ICogMC41O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSG9wIHVwIG4gY2VudHNcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB1bmlzb25JbmRleCA+IDEgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1bmlzb25JbmRleCA9IHRoaXMuTWF0aC5yb3VuZFRvTXVsdGlwbGUoIHVuaXNvbkluZGV4LCAyICkgLSAyO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGllciA9IHVuaXNvbkluZGV4O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgdGhlIG11bHRpcGxpZXIsIGNhbGN1bGF0ZSB0aGUgZGV0dW5lIHZhbHVlXG4gICAgICAgICAgICAgICAgLy8gZm9yIHRoZSBnaXZlbiB1bmlzb25JbmRleC5cbiAgICAgICAgICAgICAgICBkZXR1bmUgPSB1bmlzb25EZXR1bmUgKiBtdWx0aXBsaWVyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRldHVuZTtcbiAgICB9XG5cbiAgICBfY2FsY3VsYXRlR2xpZGVUaW1lKCBvbGRGcmVxLCBuZXdGcmVxICkge1xuICAgICAgICB2YXIgbW9kZSA9IHRoaXMuZ2xpZGVNb2RlLFxuICAgICAgICAgICAgdGltZSA9IHRoaXMuZ2xpZGVUaW1lLnZhbHVlLFxuICAgICAgICAgICAgZ2xpZGVUaW1lLFxuICAgICAgICAgICAgZnJlcURpZmZlcmVuY2U7XG5cbiAgICAgICAgaWYgKCB0aW1lID09PSAwLjAgKSB7XG4gICAgICAgICAgICBnbGlkZVRpbWUgPSAwLjA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG1vZGUgPT09ICdlcXVhbCcgKSB7XG4gICAgICAgICAgICBnbGlkZVRpbWUgPSB0aW1lICogMC4wMDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmcmVxRGlmZmVyZW5jZSA9IE1hdGguYWJzKCBvbGRGcmVxIC0gbmV3RnJlcSApO1xuICAgICAgICAgICAgZnJlcURpZmZlcmVuY2UgPSB0aGlzLk1hdGguY2xhbXAoIGZyZXFEaWZmZXJlbmNlLCAwLCA1MDAgKTtcbiAgICAgICAgICAgIGdsaWRlVGltZSA9IHRoaXMuTWF0aC5zY2FsZU51bWJlckV4cChcbiAgICAgICAgICAgICAgICBmcmVxRGlmZmVyZW5jZSxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDUwMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIHRpbWVcbiAgICAgICAgICAgICkgKiAwLjAwMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnbGlkZVRpbWU7XG4gICAgfVxuXG5cbiAgICBfc3RvcmVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZ2VuZXJhdG9yT2JqZWN0ICkge1xuICAgICAgICB2YXIgb2JqZWN0cyA9IHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0cztcblxuICAgICAgICBvYmplY3RzWyBmcmVxdWVuY3kgXSA9IG9iamVjdHNbIGZyZXF1ZW5jeSBdIHx8IFtdO1xuICAgICAgICBvYmplY3RzWyBmcmVxdWVuY3kgXS51bnNoaWZ0KCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICAgICAgdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC51bnNoaWZ0KCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICB9XG5cbiAgICBfZmV0Y2hHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSApIHtcbiAgICAgICAgdmFyIG9iamVjdHMgPSB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNbIGZyZXF1ZW5jeSBdLFxuICAgICAgICAgICAgaW5kZXggPSAwO1xuXG4gICAgICAgIGlmICggIW9iamVjdHMgfHwgb2JqZWN0cy5sZW5ndGggPT09IDAgKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQucG9wKCk7XG4gICAgICAgIHJldHVybiBvYmplY3RzLnBvcCgpO1xuICAgIH1cblxuICAgIF9mZXRjaEdlbmVyYXRvck9iamVjdFRvUmV1c2UoKSB7XG4gICAgICAgIHZhciBnZW5lcmF0b3IgPSB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0LnBvcCgpLFxuICAgICAgICAgICAgZnJlcXVlbmN5O1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCAncmV1c2UnLCBnZW5lcmF0b3IgKTtcblxuICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGdlbmVyYXRvciApICkge1xuICAgICAgICAgICAgZnJlcXVlbmN5ID0gZ2VuZXJhdG9yWyAwIF0uZnJlcXVlbmN5O1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBnZW5lcmF0b3IubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbnZlbG9wZS5mb3JjZVN0b3AoIGdlbmVyYXRvclsgaSBdLm91dHB1dHNbIDAgXS5nYWluICk7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KCBnZW5lcmF0b3JbIGkgXS50aW1lciApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZnJlcXVlbmN5ID0gZ2VuZXJhdG9yLmZyZXF1ZW5jeTtcbiAgICAgICAgICAgIHRoaXMuZW52ZWxvcGUuZm9yY2VTdG9wKCBnZW5lcmF0b3Iub3V0cHV0c1sgMCBdLmdhaW4gKTtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCggZ2VuZXJhdG9yLnRpbWVyICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNbIGZyZXF1ZW5jeSBdLnBvcCgpO1xuXG4gICAgICAgIHJldHVybiBnZW5lcmF0b3I7XG4gICAgfVxuXG5cbiAgICBfc3RhcnRHZW5lcmF0b3JPYmplY3QoIGdlbmVyYXRvck9iamVjdCwgZGVsYXkgKSB7XG4gICAgICAgIGdlbmVyYXRvck9iamVjdC5vdXRwdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5lbnZlbG9wZS5zdGFydCggZ2VuZXJhdG9yT2JqZWN0Lm91dHB1dHNbIDAgXS5nYWluLCBkZWxheSApO1xuICAgICAgICBnZW5lcmF0b3JPYmplY3Quc3RhcnQoIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgX3N0YXJ0U2luZ2xlKCBmcmVxdWVuY3ksIHZlbG9jaXR5LCBkZWxheSApIHtcbiAgICAgICAgdmFyIHVuaXNvbiA9IHRoaXMudW5pc29uLnZhbHVlLFxuICAgICAgICAgICAgZGV0dW5lID0gMC4wLFxuICAgICAgICAgICAgdW5pc29uR2VuZXJhdG9yQXJyYXksXG4gICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QsXG4gICAgICAgICAgICBhY3RpdmVHZW5lcmF0b3JDb3VudCA9IHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQubGVuZ3RoLFxuICAgICAgICAgICAgZXhpc3RpbmdGcmVxdWVuY3ksXG4gICAgICAgICAgICBnbGlkZVRpbWUgPSAwLjA7XG5cbiAgICAgICAgaWYgKCBhY3RpdmVHZW5lcmF0b3JDb3VudCA8IHRoaXMucG9seXBob255LnZhbHVlICkge1xuICAgICAgICAgICAgaWYgKCB1bmlzb24gPT09IDEuMCApIHtcbiAgICAgICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSB0aGlzLl9jcmVhdGVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB0aGlzLndhdmVmb3JtICk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRHZW5lcmF0b3JPYmplY3QoIGdlbmVyYXRvck9iamVjdCwgZGVsYXkgKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHVuaXNvbkdlbmVyYXRvckFycmF5ID0gW107XG5cbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB1bmlzb247ICsraSApIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0dW5lID0gdGhpcy5fY2FsY3VsYXRlRGV0dW5lKCBpICk7XG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2NyZWF0ZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHRoaXMud2F2ZWZvcm0gKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRHZW5lcmF0b3JPYmplY3QoIGdlbmVyYXRvck9iamVjdCwgZGVsYXkgKTtcbiAgICAgICAgICAgICAgICAgICAgdW5pc29uR2VuZXJhdG9yQXJyYXkucHVzaCggZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgdW5pc29uR2VuZXJhdG9yQXJyYXkgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCB1bmlzb24gPT09IDEuMCApIHtcbiAgICAgICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSB0aGlzLl9mZXRjaEdlbmVyYXRvck9iamVjdFRvUmV1c2UoKTtcbiAgICAgICAgICAgICAgICBleGlzdGluZ0ZyZXF1ZW5jeSA9IGdlbmVyYXRvck9iamVjdC5mcmVxdWVuY3k7XG4gICAgICAgICAgICAgICAgZ2xpZGVUaW1lID0gdGhpcy5fY2FsY3VsYXRlR2xpZGVUaW1lKCBleGlzdGluZ0ZyZXF1ZW5jeSwgZnJlcXVlbmN5ICk7XG5cbiAgICAgICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QucmVzZXQoIGZyZXF1ZW5jeSwgZGV0dW5lICsgdGhpcy50dW5pbmcudmFsdWUgKiAxMDAsIHZlbG9jaXR5LCBnbGlkZVRpbWUgKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2ZldGNoR2VuZXJhdG9yT2JqZWN0VG9SZXVzZSgpO1xuICAgICAgICAgICAgICAgIGV4aXN0aW5nRnJlcXVlbmN5ID0gZ2VuZXJhdG9yT2JqZWN0WyAwIF0uZnJlcXVlbmN5O1xuICAgICAgICAgICAgICAgIGdsaWRlVGltZSA9IHRoaXMuX2NhbGN1bGF0ZUdsaWRlVGltZSggZXhpc3RpbmdGcmVxdWVuY3ksIGZyZXF1ZW5jeSApO1xuXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdW5pc29uOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgICAgIGRldHVuZSA9IHRoaXMuX2NhbGN1bGF0ZURldHVuZSggaSApO1xuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0b3JPYmplY3RbIGkgXS5yZXNldCggZnJlcXVlbmN5LCBkZXR1bmUgKyB0aGlzLnR1bmluZy52YWx1ZSAqIDEwMCwgdmVsb2NpdHksIGdsaWRlVGltZSApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmV0dXJuIHRoZSBnZW5lcmF0ZWQgb2JqZWN0KHMpIGluIGNhc2UgdGhleSdyZSBuZWVkZWQuXG4gICAgICAgIHJldHVybiB1bmlzb25HZW5lcmF0b3JBcnJheSA/IHVuaXNvbkdlbmVyYXRvckFycmF5IDogZ2VuZXJhdG9yT2JqZWN0O1xuICAgIH1cblxuICAgIHN0YXJ0KCBmcmVxdWVuY3ksIHZlbG9jaXR5LCBkZWxheSApIHtcbiAgICAgICAgdmFyIGZyZXEgPSAwLFxuICAgICAgICAgICAgdmVsb2NpdHlTZW5zaXRpdml0eSA9IHRoaXMudmVsb2NpdHlTZW5zaXRpdml0eS52YWx1ZTtcblxuICAgICAgICB2ZWxvY2l0eSA9IHR5cGVvZiB2ZWxvY2l0eSA9PT0gJ251bWJlcicgPyB2ZWxvY2l0eSA6IDE7XG4gICAgICAgIGRlbGF5ID0gdHlwZW9mIGRlbGF5ID09PSAnbnVtYmVyJyA/IGRlbGF5IDogMDtcblxuXG4gICAgICAgIGlmICggdmVsb2NpdHlTZW5zaXRpdml0eSAhPT0gMCApIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gdGhpcy5NYXRoLnNjYWxlTnVtYmVyKCB2ZWxvY2l0eSwgMCwgMSwgMC41IC0gdmVsb2NpdHlTZW5zaXRpdml0eSAqIDAuNSwgMC41ICsgdmVsb2NpdHlTZW5zaXRpdml0eSAqIDAuNSApXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2ZWxvY2l0eSA9IDAuNTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgaWYgKCB0eXBlb2YgZnJlcXVlbmN5ID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0U2luZ2xlKCBmcmVxdWVuY3ksIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGVsc2UgaWYgKCBmcmVxdWVuY3kgaW5zdGFuY2VvZiBOb3RlICkge1xuICAgICAgICAvLyAgICAgZnJlcSA9IGZyZXF1ZW5jeS52YWx1ZUh6O1xuICAgICAgICAvLyAgICAgdGhpcy5fc3RhcnRTaW5nbGUoIGZyZXEsIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGVsc2UgaWYgKCBmcmVxdWVuY3kgaW5zdGFuY2VvZiBDaG9yZCApIHtcbiAgICAgICAgLy8gICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGZyZXF1ZW5jeS5ub3Rlcy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgLy8gICAgICAgICBmcmVxID0gZnJlcXVlbmN5Lm5vdGVzWyBpIF0udmFsdWVIejtcbiAgICAgICAgLy8gICAgICAgICB0aGlzLl9zdGFydFNpbmdsZSggZnJlcSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cblxuXG4gICAgX3N0b3BHZW5lcmF0b3JPYmplY3QoIGdlbmVyYXRvck9iamVjdCwgZGVsYXkgKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICB0aGlzLmVudmVsb3BlLnN0b3AoIGdlbmVyYXRvck9iamVjdC5vdXRwdXRzWyAwIF0uZ2FpbiwgZGVsYXkgKTtcblxuICAgICAgICBnZW5lcmF0b3JPYmplY3QudGltZXIgPSBzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIHNlbGYuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQucG9wKCk7XG4gICAgICAgICAgICBnZW5lcmF0b3JPYmplY3Quc3RvcCggZGVsYXkgKTtcbiAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdC5jbGVhblVwKCk7XG4gICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSBudWxsO1xuICAgICAgICB9LCBkZWxheSAqIDEwMDAgKyB0aGlzLmVudmVsb3BlLnRvdGFsU3RvcFRpbWUgKiAxMDAwICsgMTAwICk7XG4gICAgfVxuXG4gICAgX3N0b3BTaW5nbGUoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICkge1xuICAgICAgICB2YXIgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fZmV0Y2hHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSApO1xuXG4gICAgICAgIGlmICggZ2VuZXJhdG9yT2JqZWN0ICkge1xuICAgICAgICAgICAgLy8gU3RvcCBnZW5lcmF0b3JzIGZvcm1lZCB3aGVuIHVuaXNvbiB3YXMgPiAxIGF0IHRpbWUgb2Ygc3RhcnQoLi4uKVxuICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBnZW5lcmF0b3JPYmplY3QgKSApIHtcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IGdlbmVyYXRvck9iamVjdC5sZW5ndGggLSAxOyBpID49IDA7IC0taSApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RvcEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0WyBpIF0sIGRlbGF5ICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBzdG9wKCBmcmVxdWVuY3ksIHZlbG9jaXR5LCBkZWxheSApIHtcbiAgICAgICAgdmVsb2NpdHkgPSB0eXBlb2YgdmVsb2NpdHkgPT09ICdudW1iZXInID8gdmVsb2NpdHkgOiAwO1xuICAgICAgICBkZWxheSA9IHR5cGVvZiBkZWxheSA9PT0gJ251bWJlcicgPyBkZWxheSA6IDA7XG5cbiAgICAgICAgaWYgKCB0eXBlb2YgZnJlcXVlbmN5ID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMuX3N0b3BTaW5nbGUoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZWxzZSBpZiAoIGZyZXF1ZW5jeSBpbnN0YW5jZW9mIE5vdGUgKSB7XG4gICAgICAgIC8vICAgICBmcmVxID0gZnJlcXVlbmN5LnZhbHVlSHo7XG4gICAgICAgIC8vICAgICB0aGlzLl9zdG9wU2luZ2xlKCBmcmVxLCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBlbHNlIGlmICggZnJlcXVlbmN5IGluc3RhbmNlb2YgQ2hvcmQgKSB7XG4gICAgICAgIC8vICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBmcmVxdWVuY3kubm90ZXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgIC8vICAgICAgICAgZnJlcSA9IGZyZXF1ZW5jeS5ub3Rlc1sgaSBdLnZhbHVlSHo7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5fc3RvcFNpbmdsZSggZnJlcSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cblxuLy8gQXVkaW9JTy5taXhpblNpbmdsZSggR2VuZXJhdG9yUGxheWVyLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuR2VuZXJhdG9yUGxheWVyLnByb3RvdHlwZS5NYXRoID0gbWF0aDtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlR2VuZXJhdG9yUGxheWVyID0gZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG4gICAgcmV0dXJuIG5ldyBHZW5lcmF0b3JQbGF5ZXIoIHRoaXMsIG9wdGlvbnMgKTtcbn07Iiwid2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcblxuaW1wb3J0IEF1ZGlvSU8gZnJvbSAnLi9jb3JlL0F1ZGlvSU8uZXM2JztcblxuaW1wb3J0IE5vZGUgZnJvbSAnLi9jb3JlL05vZGUuZXM2JztcbmltcG9ydCBQYXJhbSBmcm9tICcuL2NvcmUvUGFyYW0uZXM2JztcbmltcG9ydCAnLi9jb3JlL1dhdmVTaGFwZXIuZXM2JztcblxuXG4vLyBpbXBvcnQgJy4vZ3JhcGhzL0Nyb3NzZmFkZXIuZXM2JztcblxuaW1wb3J0ICcuL2Z4L0RlbGF5LmVzNic7XG5pbXBvcnQgJy4vZngvUGluZ1BvbmdEZWxheS5lczYnO1xuaW1wb3J0ICcuL2Z4L1NpbmVTaGFwZXIuZXM2JztcbmltcG9ydCAnLi9meC9TdGVyZW9XaWR0aC5lczYnO1xuaW1wb3J0ICcuL2Z4L1N0ZXJlb1JvdGF0aW9uLmVzNic7XG4vLyBpbXBvcnQgJy4vZngvQml0UmVkdWN0aW9uLmVzNic7XG5pbXBvcnQgJy4vZngvU2Nocm9lZGVyQWxsUGFzcy5lczYnO1xuaW1wb3J0ICcuL2Z4L0RDVHJhcC5lczYnO1xuaW1wb3J0ICcuL2Z4L2ZpbHRlcnMvRmlsdGVyQmFuay5lczYnO1xuXG5pbXBvcnQgJy4vZ2VuZXJhdG9ycy9Pc2NpbGxhdG9yR2VuZXJhdG9yLmVzNic7XG5pbXBvcnQgJy4vaW5zdHJ1bWVudHMvR2VuZXJhdG9yUGxheWVyLmVzNic7XG5cblxuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L0RlZ1RvUmFkLmVzNic7XG5pbXBvcnQgJy4vbWF0aC90cmlnb25vbWV0cnkvU2luLmVzNic7XG5pbXBvcnQgJy4vbWF0aC90cmlnb25vbWV0cnkvQ29zLmVzNic7XG5pbXBvcnQgJy4vbWF0aC90cmlnb25vbWV0cnkvVGFuLmVzNic7XG5pbXBvcnQgJy4vbWF0aC90cmlnb25vbWV0cnkvUmFkVG9EZWcuZXM2JztcblxuXG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9FcXVhbFRvLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9FcXVhbFRvWmVyby5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvR3JlYXRlclRoYW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuWmVyby5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvR3JlYXRlclRoYW5FcXVhbFRvLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9JZkVsc2UuZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhblplcm8uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuRXF1YWxUby5lczYnO1xuXG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9Mb2dpY2FsT3BlcmF0b3IuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL0FORC5lczYnO1xuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvT1IuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL05PVC5lczYnO1xuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTkFORC5lczYnO1xuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTk9SLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9YT1IuZXM2JztcblxuaW1wb3J0ICcuL21hdGgvQWJzLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9BZGQuZXM2JztcbmltcG9ydCAnLi9tYXRoL0F2ZXJhZ2UuZXM2JztcbmltcG9ydCAnLi9tYXRoL0NsYW1wLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9Db25zdGFudC5lczYnO1xuaW1wb3J0ICcuL21hdGgvRGl2aWRlLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9GbG9vci5lczYnO1xuaW1wb3J0ICcuL21hdGgvTWF4LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9NaW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL011bHRpcGx5LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9OZWdhdGUuZXM2JztcbmltcG9ydCAnLi9tYXRoL1Bvdy5lczYnO1xuaW1wb3J0ICcuL21hdGgvUmVjaXByb2NhbC5lczYnO1xuaW1wb3J0ICcuL21hdGgvUm91bmQuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NjYWxlLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TY2FsZUV4cC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU2lnbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3FydC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3VidHJhY3QuZXM2JztcbmltcG9ydCAnLi9tYXRoL1N3aXRjaC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3F1YXJlLmVzNic7XG5cbmltcG9ydCAnLi9tYXRoL0xlcnAuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NhbXBsZURlbGF5LmVzNic7XG5cbmltcG9ydCAnLi9lbnZlbG9wZXMvQ3VzdG9tRW52ZWxvcGUuZXM2JztcbmltcG9ydCAnLi9lbnZlbG9wZXMvQVNEUkVudmVsb3BlLmVzNic7XG5cbmltcG9ydCAnLi9ncmFwaHMvRVFTaGVsZi5lczYnO1xuLy8gaW1wb3J0ICcuL2dyYXBocy9EaWZmdXNlRGVsYXkuZXM2JztcbmltcG9ydCAnLi9ncmFwaHMvQ291bnRlci5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9EcnlXZXROb2RlLmVzNic7XG5pbXBvcnQgJy4vZ3JhcGhzL1BoYXNlT2Zmc2V0LmVzNic7XG5pbXBvcnQgJy4vZ3JhcGhzL0Nyb3NzZmFkZXIuZXM2JztcblxuXG5pbXBvcnQgJy4vb3NjaWxsYXRvcnMvT3NjaWxsYXRvckJhbmsuZXM2JztcbmltcG9ydCAnLi9vc2NpbGxhdG9ycy9Ob2lzZU9zY2lsbGF0b3IuZXM2JztcbmltcG9ydCAnLi9vc2NpbGxhdG9ycy9GTU9zY2lsbGF0b3IuZXM2JztcbmltcG9ydCAnLi9vc2NpbGxhdG9ycy9TaW5lQmFuay5lczYnO1xuXG4vLyBpbXBvcnQgJy4vZ3JhcGhzL1NrZXRjaC5lczYnO1xuXG53aW5kb3cuUGFyYW0gPSBQYXJhbTtcbndpbmRvdy5Ob2RlID0gTm9kZTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG52YXIgU0hBUEVSUyA9IHt9O1xuXG5mdW5jdGlvbiBnZW5lcmF0ZVNoYXBlckN1cnZlKCBzaXplICkge1xuICAgIHZhciBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoIHNpemUgKSxcbiAgICAgICAgaSA9IDAsXG4gICAgICAgIHggPSAwO1xuXG4gICAgZm9yICggaTsgaSA8IHNpemU7ICsraSApIHtcbiAgICAgICAgeCA9ICggaSAvIHNpemUgKSAqIDIgLSAxO1xuICAgICAgICBhcnJheVsgaSBdID0gTWF0aC5hYnMoIHggKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJyYXk7XG59XG5cbmNsYXNzIEFicyBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCBhY2N1cmFjeSA9IDEwICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyB2YXIgZ2FpbkFjY3VyYWN5ID0gYWNjdXJhY3kgKiAxMDA7XG4gICAgICAgIHZhciBnYWluQWNjdXJhY3kgPSBNYXRoLnBvdyggYWNjdXJhY3ksIDIgKSxcbiAgICAgICAgICAgIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpLFxuICAgICAgICAgICAgc2l6ZSA9IDEwMjQgKiBhY2N1cmFjeTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAxIC8gZ2FpbkFjY3VyYWN5O1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gZ2FpbkFjY3VyYWN5O1xuXG4gICAgICAgIC8vIFRvIHNhdmUgY3JlYXRpbmcgbmV3IHNoYXBlciBjdXJ2ZXMgKHRoYXQgY2FuIGJlIHF1aXRlIGxhcmdlISlcbiAgICAgICAgLy8gZWFjaCB0aW1lIGFuIGluc3RhbmNlIG9mIEFicyBpcyBjcmVhdGVkLCBzaGFwZXIgY3VydmVzXG4gICAgICAgIC8vIGFyZSBzdG9yZWQgaW4gdGhlIFNIQVBFUlMgb2JqZWN0IGFib3ZlLiBUaGUga2V5cyB0byB0aGVcbiAgICAgICAgLy8gU0hBUEVSUyBvYmplY3QgYXJlIHRoZSBiYXNlIHdhdmV0YWJsZSBjdXJ2ZSBzaXplICgxMDI0KVxuICAgICAgICAvLyBtdWx0aXBsaWVkIGJ5IHRoZSBhY2N1cmFjeSBhcmd1bWVudC5cbiAgICAgICAgaWYoICFTSEFQRVJTWyBzaXplIF0gKSB7XG4gICAgICAgICAgICBTSEFQRVJTWyBzaXplIF0gPSBnZW5lcmF0ZVNoYXBlckN1cnZlKCBzaXplICk7XG4gICAgICAgIH1cblxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIFNIQVBFUlNbIHNpemUgXSApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUFicyA9IGZ1bmN0aW9uKCBhY2N1cmFjeSApIHtcbiAgICByZXR1cm4gbmV3IEFicyggdGhpcywgYWNjdXJhY3kgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBBZGRzIHR3byBhdWRpbyBzaWduYWxzIHRvZ2V0aGVyLlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKlxuICogdmFyIGFkZCA9IGlvLmNyZWF0ZUFkZCggMiApO1xuICogaW4xLmNvbm5lY3QoIGFkZCApO1xuICpcbiAqIHZhciBhZGQgPSBpby5jcmVhdGVBZGQoKTtcbiAqIGluMS5jb25uZWN0KCBhZGQsIDAsIDAgKTtcbiAqIGluMi5jb25uZWN0KCBhZGQsIDAsIDEgKTtcbiAqL1xuY2xhc3MgQWRkIGV4dGVuZHMgTm9kZXtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgXHRyZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICBcdHRoaXMuY29udHJvbHMudmFsdWUudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQWRkID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgQWRkKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbi8qXG4gICAgVGhlIGF2ZXJhZ2UgdmFsdWUgb2YgYSBzaWduYWwgaXMgY2FsY3VsYXRlZFxuICAgIGJ5IHBpcGluZyB0aGUgaW5wdXQgaW50byBhIHJlY3RpZmllciB0aGVuIGludG9cbiAgICBhIHNlcmllcyBvZiBEZWxheU5vZGVzLiBFYWNoIERlbGF5Tm9kZVxuICAgIGhhcyBpdCdzIGBkZWxheVRpbWVgIGNvbnRyb2xsZWQgYnkgZWl0aGVyIHRoZVxuICAgIGBzYW1wbGVTaXplYCBhcmd1bWVudCBvciB0aGUgaW5jb21pbmcgdmFsdWUgb2ZcbiAgICB0aGUgYGNvbnRyb2xzLnNhbXBsZVNpemVgIG5vZGUuIFRoZSBkZWxheVRpbWVcbiAgICBpcyB0aGVyZWZvcmUgbWVhc3VyZWQgaW4gc2FtcGxlcy5cblxuICAgIEVhY2ggZGVsYXkgaXMgY29ubmVjdGVkIHRvIGEgR2Fpbk5vZGUgdGhhdCB3b3Jrc1xuICAgIGFzIGEgc3VtbWluZyBub2RlLiBUaGUgc3VtbWluZyBub2RlJ3MgdmFsdWUgaXNcbiAgICB0aGVuIGRpdmlkZWQgYnkgdGhlIG51bWJlciBvZiBkZWxheXMgdXNlZCBiZWZvcmVcbiAgICBiZWluZyBzZW50IG9uIGl0cyBtZXJyeSB3YXkgdG8gdGhlIG91dHB1dC5cblxuICAgIE5vdGU6XG4gICAgSGlnaCB2YWx1ZXMgZm9yIGBudW1TYW1wbGVzYCB3aWxsIGJlIGV4cGVuc2l2ZSxcbiAgICBhcyB0aGF0IG1hbnkgRGVsYXlOb2RlcyB3aWxsIGJlIGNyZWF0ZWQuIENvbnNpZGVyXG4gICAgaW5jcmVhc2luZyB0aGUgYHNhbXBsZVNpemVgIGFuZCB1c2luZyBhIGxvdyB2YWx1ZVxuICAgIGZvciBgbnVtU2FtcGxlc2AuXG5cbiAgICBHcmFwaDpcbiAgICA9PT09PT1cbiAgICBpbnB1dCAtPlxuICAgICAgICBhYnMvcmVjdGlmeSAtPlxuICAgICAgICAgICAgYG51bVNhbXBsZXNgIG51bWJlciBvZiBkZWxheXMsIGluIHNlcmllcyAtPlxuICAgICAgICAgICAgICAgIHN1bSAtPlxuICAgICAgICAgICAgICAgICAgICBkaXZpZGUgYnkgYG51bVNhbXBsZXNgIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuXG4gKi9cbmNsYXNzIEF2ZXJhZ2UgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtU2FtcGxlcyA9IDEwLCBzYW1wbGVTaXplICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubnVtU2FtcGxlcyA9IG51bVNhbXBsZXM7XG5cbiAgICAgICAgLy8gQWxsIERlbGF5Tm9kZXMgd2lsbCBiZSBzdG9yZWQgaGVyZS5cbiAgICAgICAgZ3JhcGguZGVsYXlzID0gW107XG4gICAgICAgIGdyYXBoLmFicyA9IHRoaXMuaW8uY3JlYXRlQWJzKCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguYWJzICk7XG4gICAgICAgIGdyYXBoLnNhbXBsZVNpemUgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuc2FtcGxlU2l6ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHNhbXBsZVNpemUgKTtcbiAgICAgICAgZ3JhcGguc2FtcGxlU2l6ZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnNhbXBsZVNpemUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICAvLyBUaGlzIGlzIGEgcmVsYXRpdmVseSBleHBlbnNpdmUgY2FsY3VsYXRpb25cbiAgICAgICAgLy8gd2hlbiBjb21wYXJlZCB0byBkb2luZyBhIG11Y2ggc2ltcGxlciByZWNpcHJvY2FsIG11bHRpcGx5LlxuICAgICAgICAvLyB0aGlzLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCBudW1TYW1wbGVzLCB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSAqIDAuNSApO1xuXG4gICAgICAgIC8vIEF2b2lkIHRoZSBtb3JlIGV4cGVuc2l2ZSBkaXZpc2lvbiBhYm92ZSBieVxuICAgICAgICAvLyBtdWx0aXBseWluZyB0aGUgc3VtIGJ5IHRoZSByZWNpcHJvY2FsIG9mIG51bVNhbXBsZXMuXG4gICAgICAgIGdyYXBoLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIDEgLyBudW1TYW1wbGVzICk7XG4gICAgICAgIGdyYXBoLnN1bSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgZ3JhcGguc3VtLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSApO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuXG5cbiAgICAgICAgLy8gVHJpZ2dlciB0aGUgc2V0dGVyIGZvciBgbnVtU2FtcGxlc2AgdGhhdCB3aWxsIGNyZWF0ZVxuICAgICAgICAvLyB0aGUgZGVsYXkgc2VyaWVzLlxuICAgICAgICB0aGlzLm51bVNhbXBsZXMgPSBncmFwaC5udW1TYW1wbGVzO1xuICAgIH1cblxuICAgIGdldCBudW1TYW1wbGVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLm51bVNhbXBsZXM7XG4gICAgfVxuXG4gICAgc2V0IG51bVNhbXBsZXMoIG51bVNhbXBsZXMgKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKSxcbiAgICAgICAgICAgIGRlbGF5cyA9IGdyYXBoLmRlbGF5cztcblxuICAgICAgICAvLyBEaXNjb25uZWN0IGFuZCBudWxsaWZ5IGFueSBleGlzdGluZyBkZWxheSBub2Rlcy5cbiAgICAgICAgdGhpcy5fY2xlYW5VcFNpbmdsZSggZGVsYXlzICk7XG5cbiAgICAgICAgZ3JhcGgubnVtU2FtcGxlcyA9IG51bVNhbXBsZXM7XG4gICAgICAgIGdyYXBoLmRpdmlkZS52YWx1ZSA9IDEgLyBudW1TYW1wbGVzO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwLCBub2RlID0gZ3JhcGguYWJzOyBpIDwgbnVtU2FtcGxlczsgKytpICkge1xuICAgICAgICAgICAgdmFyIGRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgICAgICBkZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggZGVsYXkuZGVsYXlUaW1lICk7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QoIGRlbGF5ICk7XG4gICAgICAgICAgICBkZWxheS5jb25uZWN0KCBncmFwaC5zdW0gKTtcbiAgICAgICAgICAgIGdyYXBoLmRlbGF5cy5wdXNoKCBkZWxheSApO1xuICAgICAgICAgICAgbm9kZSA9IGRlbGF5O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUF2ZXJhZ2UgPSBmdW5jdGlvbiggbnVtU2FtcGxlcywgc2FtcGxlU2l6ZSApIHtcbiAgICByZXR1cm4gbmV3IEF2ZXJhZ2UoIHRoaXMsIG51bVNhbXBsZXMsIHNhbXBsZVNpemUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBDbGFtcCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbWluVmFsdWUsIG1heFZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTsgLy8gaW8sIDEsIDFcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubWluID0gdGhpcy5pby5jcmVhdGVNaW4oIG1heFZhbHVlICk7XG4gICAgICAgIGdyYXBoLm1heCA9IHRoaXMuaW8uY3JlYXRlTWF4KCBtaW5WYWx1ZSApO1xuXG4gICAgICAgIC8vIHRoaXMuaW5wdXRzID0gWyBncmFwaC5taW4gXTtcbiAgICAgICAgLy8gdGhpcy5vdXRwdXRzID0gWyBncmFwaC5tYXggXTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5taW4gKTtcbiAgICAgICAgZ3JhcGgubWluLmNvbm5lY3QoIGdyYXBoLm1heCApO1xuICAgICAgICBncmFwaC5tYXguY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLm1pbiA9IGdyYXBoLm1pbi5jb250cm9scy52YWx1ZTtcbiAgICAgICAgdGhpcy5jb250cm9scy5tYXggPSBncmFwaC5tYXguY29udHJvbHMudmFsdWU7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgbWluKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLm1heC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IG1pbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5tYXgudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgbWF4KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLm1pbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IG1heCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5taW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDbGFtcCA9IGZ1bmN0aW9uKCBtaW5WYWx1ZSwgbWF4VmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDbGFtcCggdGhpcywgbWluVmFsdWUsIG1heFZhbHVlICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gJy4uL2NvcmUvQXVkaW9JTy5lczYnO1xuaW1wb3J0IE5vZGUgZnJvbSAnLi4vY29yZS9Ob2RlLmVzNic7XG5cbmNsYXNzIENvbnN0YW50IGV4dGVuZHMgTm9kZSB7XG4gICAgLyoqXG4gICAgICogQSBjb25zdGFudC1yYXRlIGF1ZGlvIHNpZ25hbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyAgICBJbnN0YW5jZSBvZiBBdWRpb0lPXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIFZhbHVlIG9mIHRoZSBjb25zdGFudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgPSAwLjAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInID8gdmFsdWUgOiAwO1xuICAgICAgICB0aGlzLmlvLmNvbnN0YW50RHJpdmVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnQgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDb25zdGFudCggdGhpcywgdmFsdWUgKTtcbn07XG5cblxuLy8gQSBidW5jaCBvZiBwcmVzZXQgY29uc3RhbnRzLlxuKGZ1bmN0aW9uKCkge1xuICAgIHZhciBFLFxuICAgICAgICBQSSxcbiAgICAgICAgUEkyLFxuICAgICAgICBMTjEwLFxuICAgICAgICBMTjIsXG4gICAgICAgIExPRzEwRSxcbiAgICAgICAgTE9HMkUsXG4gICAgICAgIFNRUlQxXzIsXG4gICAgICAgIFNRUlQyO1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRFID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gRSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkUgKTtcbiAgICAgICAgRSA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudFBJID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gUEkgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5QSSApO1xuICAgICAgICBQSSA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudFBJMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFBJMiB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLlBJICogMiApO1xuICAgICAgICBQSTIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRMTjEwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gTE4xMCB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxOMTAgKTtcbiAgICAgICAgTE4xMCA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudExOMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IExOMiB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxOMiApO1xuICAgICAgICBMTjIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRMT0cxMEUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBMT0cxMEUgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5MT0cxMEUgKTtcbiAgICAgICAgTE9HMTBFID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50TE9HMkUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBMT0cyRSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxPRzJFICk7XG4gICAgICAgIExPRzJFID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50U1FSVDFfMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFNRUlQxXzIgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5TUVJUMV8yICk7XG4gICAgICAgIFNRUlQxXzIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRTUVJUMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFNRUlQyIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguU1FSVDIgKTtcbiAgICAgICAgU1FSVDIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xufSgpKTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIERpdmlkZXMgdHdvIG51bWJlcnNcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBEaXZpZGUgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlLCBtYXhJbnB1dCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSAwLjA7XG5cbiAgICAgICAgZ3JhcGgucmVjaXByb2NhbCA9IHRoaXMuaW8uY3JlYXRlUmVjaXByb2NhbCggbWF4SW5wdXQgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5yZWNpcHJvY2FsICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICBncmFwaC5yZWNpcHJvY2FsLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRpdmlzb3IgPSB0aGlzLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHNbIDEgXS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBtYXhJbnB1dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVjaXByb2NhbC5tYXhJbnB1dDtcbiAgICB9XG4gICAgc2V0IG1heElucHV0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsLm1heElucHV0ID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEaXZpZGUgPSBmdW5jdGlvbiggdmFsdWUsIG1heElucHV0ICkge1xuICAgIHJldHVybiBuZXcgRGl2aWRlKCB0aGlzLCB2YWx1ZSwgbWF4SW5wdXQgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vLyBOT1RFOlxuLy8gIE9ubHkgYWNjZXB0cyB2YWx1ZXMgPj0gLTEgJiYgPD0gMS4gVmFsdWVzIG91dHNpZGVcbi8vICB0aGlzIHJhbmdlIGFyZSBjbGFtcGVkIHRvIHRoaXMgcmFuZ2UuXG5jbGFzcyBGbG9vciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuRmxvb3IgKTtcblxuICAgICAgICAvLyBUaGlzIGJyYW5jaGluZyBpcyBiZWNhdXNlIGlucHV0dGluZyBgMGAgdmFsdWVzXG4gICAgICAgIC8vIGludG8gdGhlIHdhdmVzaGFwZXIgYWJvdmUgb3V0cHV0cyAtMC41IDsoXG4gICAgICAgIGdyYXBoLmlmRWxzZSA9IHRoaXMuaW8uY3JlYXRlSWZFbHNlKCk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG9aZXJvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZXF1YWxUb1plcm8gKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUb1plcm8uY29ubmVjdCggZ3JhcGguaWZFbHNlLmlmICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguaWZFbHNlLnRoZW4gKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIGdyYXBoLmlmRWxzZS5lbHNlICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguaWZFbHNlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUZsb29yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBGbG9vciggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMZXJwIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIHN0YXJ0LCBlbmQsIGRlbHRhICkge1xuICAgICAgICBzdXBlciggaW8sIDMsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguYWRkID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgZ3JhcGguc3VidHJhY3QgPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIGdyYXBoLnN0YXJ0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggc3RhcnQgKTtcbiAgICAgICAgZ3JhcGguZW5kID0gdGhpcy5pby5jcmVhdGVQYXJhbSggZW5kICk7XG4gICAgICAgIGdyYXBoLmRlbHRhID0gdGhpcy5pby5jcmVhdGVQYXJhbSggZGVsdGEgKTtcblxuICAgICAgICBncmFwaC5lbmQuY29ubmVjdCggZ3JhcGguc3VidHJhY3QsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguc3RhcnQuY29ubmVjdCggZ3JhcGguc3VidHJhY3QsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguc3VidHJhY3QuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguZGVsdGEuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5zdGFydC5jb25uZWN0KCBncmFwaC5hZGQsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggZ3JhcGguYWRkLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGguYWRkLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zdGFydCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLmVuZCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMiBdLmNvbm5lY3QoIGdyYXBoLmRlbHRhICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5zdGFydCA9IGdyYXBoLnN0YXJ0O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmVuZCA9IGdyYXBoLmVuZDtcbiAgICAgICAgdGhpcy5jb250cm9scy5kZWx0YSA9IGdyYXBoLmRlbHRhO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHN0YXJ0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLnN0YXJ0LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgc3RhcnQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkuc3RhcnQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgZW5kKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLmVuZC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGVuZCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5lbmQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgZGVsdGEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkuZGVsdGEudmFsdWU7XG4gICAgfVxuICAgIHNldCBkZWx0YSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5kZWx0YS52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVycCA9IGZ1bmN0aW9uKCBzdGFydCwgZW5kLCBkZWx0YSApIHtcbiAgICByZXR1cm4gbmV3IExlcnAoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBXaGVuIGlucHV0IGlzIDwgYHZhbHVlYCwgb3V0cHV0cyBgdmFsdWVgLCBvdGhlcndpc2Ugb3V0cHV0cyBpbnB1dC5cbiAqIEBwYXJhbSB7QXVkaW9JT30gaW8gICBBdWRpb0lPIGluc3RhbmNlXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgVGhlIG1pbmltdW0gdmFsdWUgdG8gdGVzdCBhZ2FpbnN0LlxuICovXG5cbmNsYXNzIE1heCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5ncmVhdGVyVGhhbiA9IHRoaXMuaW8uY3JlYXRlR3JlYXRlclRoYW4oKTtcbiAgICAgICAgZ3JhcGguc3dpdGNoID0gdGhpcy5pby5jcmVhdGVTd2l0Y2goIDIsIDAgKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5ncmVhdGVyVGhhbi5jb250cm9scy52YWx1ZSApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAxIF0gKTtcbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW4uY29ubmVjdCggZ3JhcGguc3dpdGNoLmNvbnRyb2wgKTtcbiAgICAgICAgZ3JhcGguc3dpdGNoLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVNYXggPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBNYXgoIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogV2hlbiBpbnB1dCBpcyA+IGB2YWx1ZWAsIG91dHB1dHMgYHZhbHVlYCwgb3RoZXJ3aXNlIG91dHB1dHMgaW5wdXQuXG4gKiBAcGFyYW0ge0F1ZGlvSU99IGlvICAgQXVkaW9JTyBpbnN0YW5jZVxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIFRoZSBtaW5pbXVtIHZhbHVlIHRvIHRlc3QgYWdhaW5zdC5cbiAqL1xuY2xhc3MgTWluIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmxlc3NUaGFuID0gdGhpcy5pby5jcmVhdGVMZXNzVGhhbigpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubGVzc1RoYW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5sZXNzVGhhbi5jb250cm9scy52YWx1ZSApO1xuXG4gICAgICAgIGdyYXBoLnN3aXRjaCA9IHRoaXMuaW8uY3JlYXRlU3dpdGNoKCAyLCAwICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAxIF0gKTtcbiAgICAgICAgZ3JhcGgubGVzc1RoYW4uY29ubmVjdCggZ3JhcGguc3dpdGNoLmNvbnRyb2wgKTtcbiAgICAgICAgZ3JhcGguc3dpdGNoLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU1pbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IE1pbiggdGhpcywgdmFsdWUgKTtcbn07IiwiIGltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gYXVkaW8gc2lnbmFscyB0b2dldGhlci5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBNdWx0aXBseSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gMC4wO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXS5nYWluICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW5wdXRzWyAxIF07XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVNdWx0aXBseSA9IGZ1bmN0aW9uKCB2YWx1ZTEsIHZhbHVlMiApIHtcbiAgICByZXR1cm4gbmV3IE11bHRpcGx5KCB0aGlzLCB2YWx1ZTEsIHZhbHVlMiApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIE5lZ2F0ZXMgdGhlIGluY29taW5nIGF1ZGlvIHNpZ25hbC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBOZWdhdGUgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMCApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICB0aGlzLm91dHB1dHMgPSB0aGlzLmlucHV0cztcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTmVnYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBOZWdhdGUoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqXG4gKiBOb3RlOiBET0VTIE5PVCBIQU5ETEUgTkVHQVRJVkUgUE9XRVJTLlxuICovXG5jbGFzcyBQb3cgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbGllcnMgPSBbXTtcbiAgICAgICAgZ3JhcGgudmFsdWUgPSB2YWx1ZTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIG5vZGUgPSB0aGlzLmlucHV0c1sgMCBdOyBpIDwgdmFsdWUgLSAxOyArK2kgKSB7XG4gICAgICAgICAgICBncmFwaC5tdWx0aXBsaWVyc1sgaSBdID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5tdWx0aXBsaWVyc1sgaSBdLmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0gKTtcbiAgICAgICAgICAgIG5vZGUgPSBncmFwaC5tdWx0aXBsaWVyc1sgaSBdO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLnZhbHVlID0gbnVsbDtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmRpc2Nvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyAwIF0gKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IGdyYXBoLm11bHRpcGxpZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgICAgZ3JhcGgubXVsdGlwbGllcnNbIGkgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICBncmFwaC5tdWx0aXBsaWVycy5zcGxpY2UoIGksIDEgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgbm9kZSA9IHRoaXMuaW5wdXRzWyAwIF07IGkgPCB2YWx1ZSAtIDE7ICsraSApIHtcbiAgICAgICAgICAgIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0uY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdCggZ3JhcGgubXVsdGlwbGllcnNbIGkgXSApO1xuICAgICAgICAgICAgbm9kZSA9IGdyYXBoLm11bHRpcGxpZXJzWyBpIF07XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgZ3JhcGgudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBvdyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFBvdyggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBPdXRwdXRzIHRoZSB2YWx1ZSBvZiAxIC8gaW5wdXRWYWx1ZSAob3IgcG93KGlucHV0VmFsdWUsIC0xKSlcbiAqIFdpbGwgYmUgdXNlZnVsIGZvciBkb2luZyBtdWx0aXBsaWNhdGl2ZSBkaXZpc2lvbi5cbiAqXG4gKiBUT0RPOlxuICogICAgIC0gVGhlIHdhdmVzaGFwZXIgaXNuJ3QgYWNjdXJhdGUuIEl0IHB1bXBzIG91dCB2YWx1ZXMgZGlmZmVyaW5nXG4gKiAgICAgICBieSAxLjc5MDY3OTMxNDAzMDE1MjVlLTkgb3IgbW9yZS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgUmVjaXByb2NhbCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbWF4SW5wdXQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBmYWN0b3IgPSBtYXhJbnB1dCB8fCAxMDAsXG4gICAgICAgICAgICBnYWluID0gTWF0aC5wb3coIGZhY3RvciwgLTEgKSxcbiAgICAgICAgICAgIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm1heElucHV0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgubWF4SW5wdXQuZ2Fpbi5zZXRWYWx1ZUF0VGltZSggZ2FpbiwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG5cbiAgICAgICAgLy8gdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi5zZXRWYWx1ZUF0VGltZSggMC4wLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcblxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLlJlY2lwcm9jYWwgKTtcblxuICAgICAgICAvLyB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4uc2V0VmFsdWVBdFRpbWUoIDAuMCwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG5cbiAgICAgICAgdGhpcy5pby5jb25zdGFudERyaXZlci5jb25uZWN0KCBncmFwaC5tYXhJbnB1dCApO1xuICAgICAgICBncmFwaC5tYXhJbnB1dC5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdLmdhaW4gKTtcbiAgICAgICAgZ3JhcGgubWF4SW5wdXQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IG1heElucHV0KCkge1xuICAgICAgICByZXR1cm4gZ3JhcGgubWF4SW5wdXQuZ2FpbjtcbiAgICB9XG4gICAgc2V0IG1heElucHV0KCB2YWx1ZSApIHtcbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGlmICggdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIGdyYXBoLm1heElucHV0LmdhaW4uY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICAgICAgICAgIGdyYXBoLm1heElucHV0LmdhaW4uc2V0VmFsdWVBdFRpbWUoIDEgLyB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVJlY2lwcm9jYWwgPSBmdW5jdGlvbiggbWF4SW5wdXQgKSB7XG4gICAgcmV0dXJuIG5ldyBSZWNpcHJvY2FsKCB0aGlzLCBtYXhJbnB1dCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBOT1RFOlxuLy8gIE9ubHkgYWNjZXB0cyB2YWx1ZXMgPj0gLTEgJiYgPD0gMS4gVmFsdWVzIG91dHNpZGVcbi8vICB0aGlzIHJhbmdlIGFyZSBjbGFtcGVkIHRvIHRoaXMgcmFuZ2UuXG5jbGFzcyBSb3VuZCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmZsb29yID0gdGhpcy5pby5jcmVhdGVGbG9vcigpO1xuICAgICAgICBncmFwaC5hZGQgPSB0aGlzLmlvLmNyZWF0ZUFkZCggMC41ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWzBdLmNvbm5lY3QoIGdyYXBoLmFkZCApO1xuICAgICAgICBncmFwaC5hZGQuY29ubmVjdCggZ3JhcGguZmxvb3IgKTtcbiAgICAgICAgZ3JhcGguZmxvb3IuY29ubmVjdCggdGhpcy5vdXRwdXRzWzBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVJvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSb3VuZCggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKlxuICAgIEFsc28ga25vd24gYXMgei0xLCB0aGlzIG5vZGUgZGVsYXlzIHRoZSBpbnB1dCBieVxuICAgIG9uZSBzYW1wbGUuXG4gKi9cbmNsYXNzIFNhbXBsZURlbGF5IGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICBncmFwaC5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGU7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5kZWxheSApO1xuICAgICAgICBncmFwaC5kZWxheS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG4vLyBUaGUgZmFjdG9yeSBmb3IgU2FtcGxlRGVsYXkgaGFzIGFuIGFsaWFzIHRvIGl0J3MgbW9yZSBjb21tb24gbmFtZSFcbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNhbXBsZURlbGF5ID0gQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlWk1pbnVzT25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBTYW1wbGVEZWxheSggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBHaXZlbiBhbiBpbnB1dCB2YWx1ZSBhbmQgaXRzIGhpZ2ggYW5kIGxvdyBib3VuZHMsIHNjYWxlXG4vLyB0aGF0IHZhbHVlIHRvIG5ldyBoaWdoIGFuZCBsb3cgYm91bmRzLlxuLy9cbi8vIEZvcm11bGEgZnJvbSBNYXhNU1AncyBTY2FsZSBvYmplY3Q6XG4vLyAgaHR0cDovL3d3dy5jeWNsaW5nNzQuY29tL2ZvcnVtcy90b3BpYy5waHA/aWQ9MjY1OTNcbi8vXG4vLyAoKGlucHV0LWxvd0luKSAvIChoaWdoSW4tbG93SW4pKSAqIChoaWdoT3V0LWxvd091dCkgKyBsb3dPdXQ7XG5cblxuLy8gVE9ETzpcbi8vICAtIEFkZCBjb250cm9scyFcbmNsYXNzIFNjYWxlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93SW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoSW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dPdXQgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaE91dCApO1xuXG5cbiAgICAgICAgLy8gKGlucHV0LWxvd0luKVxuICAgICAgICBncmFwaC5pbnB1dE1pbnVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguaW5wdXRNaW51c0xvd0luLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4uY29ubmVjdCggZ3JhcGguaW5wdXRNaW51c0xvd0luLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hJbi1sb3dJbilcbiAgICAgICAgZ3JhcGguaGlnaEluTWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4uY29ubmVjdCggZ3JhcGguaGlnaEluTWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoKGlucHV0LWxvd0luKSAvIChoaWdoSW4tbG93SW4pKVxuICAgICAgICBncmFwaC5kaXZpZGUgPSB0aGlzLmlvLmNyZWF0ZURpdmlkZSgpO1xuICAgICAgICBncmFwaC5pbnB1dE1pbnVzTG93SW4uY29ubmVjdCggZ3JhcGguZGl2aWRlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4uY29ubmVjdCggZ3JhcGguZGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hPdXQtbG93T3V0KVxuICAgICAgICBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQgPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaE91dC5jb25uZWN0KCBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSkgKiAoaGlnaE91dC1sb3dPdXQpXG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSkgKiAoaGlnaE91dC1sb3dPdXQpICsgbG93T3V0XG4gICAgICAgIGdyYXBoLmFkZCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5LmNvbm5lY3QoIGdyYXBoLmFkZCwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5hZGQsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5hZGQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCBsb3dJbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMubG93SW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBsb3dJbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgaGlnaEluKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5oaWdoSW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoSW4oIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hJbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBsb3dPdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmxvd091dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd091dCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGhpZ2hPdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQudmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoT3V0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNjYWxlID0gZnVuY3Rpb24oIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCApIHtcbiAgICByZXR1cm4gbmV3IFNjYWxlKCB0aGlzLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gR2l2ZW4gYW4gaW5wdXQgdmFsdWUgYW5kIGl0cyBoaWdoIGFuZCBsb3cgYm91bmRzLCBzY2FsZVxuLy8gdGhhdCB2YWx1ZSB0byBuZXcgaGlnaCBhbmQgbG93IGJvdW5kcy5cbi8vXG4vLyBGb3JtdWxhIGZyb20gTWF4TVNQJ3MgU2NhbGUgb2JqZWN0OlxuLy8gIGh0dHA6Ly93d3cuY3ljbGluZzc0LmNvbS9mb3J1bXMvdG9waWMucGhwP2lkPTI2NTkzXG4vL1xuLy8gaWYoIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikgPT09IDAgKSB7XG4vLyAgICAgcmV0dXJuIGxvd091dDtcbi8vIH1cbi8vIGVsc2UgaWYoIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikgPiAwICkge1xuLy8gICAgIHJldHVybiBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiBNYXRoLnBvdyggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKTtcbi8vIH1cbi8vIGVsc2Uge1xuLy8gICAgIHJldHVybiBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiAtKE1hdGgucG93KCAoLWlucHV0ICsgbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKSk7XG4vLyB9XG5cbi8vIFRPRE86XG4vLyAgLSBBZGQgY29udHJvbHNcbmNsYXNzIFNjYWxlRXhwIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQsIGV4cG9uZW50ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgLy8gbG93SW4gPSB0eXBlb2YgbG93SW4gPT09ICdudW1iZXInID8gbG93SW4gOiAwO1xuICAgICAgICAvLyBoaWdoSW4gPSB0eXBlb2YgaGlnaEluID09PSAnbnVtYmVyJyA/IGhpZ2hJbiA6IDE7XG4gICAgICAgIC8vIGxvd091dCA9IHR5cGVvZiBsb3dPdXQgPT09ICdudW1iZXInID8gbG93T3V0IDogMDtcbiAgICAgICAgLy8gaGlnaE91dCA9IHR5cGVvZiBoaWdoT3V0ID09PSAnbnVtYmVyJyA/IGhpZ2hPdXQgOiAxMDtcbiAgICAgICAgLy8gZXhwb25lbnQgPSB0eXBlb2YgZXhwb25lbnQgPT09ICdudW1iZXInID8gZXhwb25lbnQgOiAxO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dJbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hJbiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hJbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd091dCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoT3V0ICk7XG4gICAgICAgIGdyYXBoLl9leHBvbmVudCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGV4cG9uZW50ICk7XG5cblxuICAgICAgICAvLyAoaW5wdXQgLSBsb3dJbilcbiAgICAgICAgZ3JhcGguaW5wdXRNaW51c0xvd0luID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmlucHV0TWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLmlucHV0TWludXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vICgtaW5wdXQgKyBsb3dJbilcbiAgICAgICAgZ3JhcGgubWludXNJbnB1dCA9IHRoaXMuaW8uY3JlYXRlTmVnYXRlKCk7XG4gICAgICAgIGdyYXBoLm1pbnVzSW5wdXRQbHVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm1pbnVzSW5wdXQgKTtcbiAgICAgICAgZ3JhcGgubWludXNJbnB1dC5jb25uZWN0KCBncmFwaC5taW51c0lucHV0UGx1c0xvd0luLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4uY29ubmVjdCggZ3JhcGgubWludXNJbnB1dFBsdXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vIChoaWdoSW4gLSBsb3dJbilcbiAgICAgICAgZ3JhcGguaGlnaEluTWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4uY29ubmVjdCggZ3JhcGguaGlnaEluTWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSlcbiAgICAgICAgZ3JhcGguZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgZ3JhcGguaW5wdXRNaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5oaWdoSW5NaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIC8vICgtaW5wdXQgKyBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pXG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlRGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgZ3JhcGgubWludXNJbnB1dFBsdXNMb3dJbi5jb25uZWN0KCBncmFwaC5uZWdhdGl2ZURpdmlkZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5oaWdoSW5NaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlRGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hPdXQgLSBsb3dPdXQpXG4gICAgICAgIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dCA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0LmNvbm5lY3QoIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dCwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQsIDAsIDEgKTtcblxuICAgICAgICAvLyBNYXRoLnBvdyggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKVxuICAgICAgICBncmFwaC5wb3cgPSB0aGlzLmlvLmNyZWF0ZVBvdyggZXhwb25lbnQgKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlLmNvbm5lY3QoIGdyYXBoLnBvdyApO1xuXG4gICAgICAgIC8vIC0oTWF0aC5wb3coICgtaW5wdXQgKyBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApKVxuICAgICAgICBncmFwaC5uZWdhdGl2ZVBvd05lZ2F0ZSA9IHRoaXMuaW8uY3JlYXRlTmVnYXRlKCk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlUG93ID0gdGhpcy5pby5jcmVhdGVQb3coIGV4cG9uZW50ICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlRGl2aWRlLmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlUG93ICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlUG93LmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlUG93TmVnYXRlICk7XG5cblxuICAgICAgICAvLyBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiBNYXRoLnBvdyggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKTtcbiAgICAgICAgZ3JhcGguZWxzZUlmQnJhbmNoID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgZ3JhcGguZWxzZUlmTXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dC5jb25uZWN0KCBncmFwaC5lbHNlSWZNdWx0aXBseSwgMCwgMCApO1xuICAgICAgICBncmFwaC5wb3cuY29ubmVjdCggZ3JhcGguZWxzZUlmTXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguZWxzZUlmQnJhbmNoLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmVsc2VJZk11bHRpcGx5LmNvbm5lY3QoIGdyYXBoLmVsc2VJZkJyYW5jaCwgMCwgMSApO1xuXG4gICAgICAgIC8vIGxvd091dCArIChoaWdoT3V0IC0gbG93T3V0KSAqIC0oTWF0aC5wb3coICgtaW5wdXQgKyBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApKTtcbiAgICAgICAgZ3JhcGguZWxzZUJyYW5jaCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLmVsc2VNdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LmNvbm5lY3QoIGdyYXBoLmVsc2VNdWx0aXBseSwgMCwgMCApO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZVBvd05lZ2F0ZS5jb25uZWN0KCBncmFwaC5lbHNlTXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguZWxzZUJyYW5jaCwgMCwgMCApO1xuICAgICAgICBncmFwaC5lbHNlTXVsdGlwbHkuY29ubmVjdCggZ3JhcGguZWxzZUJyYW5jaCwgMCwgMSApO1xuXG5cblxuICAgICAgICAvLyBlbHNlIGlmKCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID4gMCApIHtcbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW5aZXJvID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhblplcm8oKTtcbiAgICAgICAgZ3JhcGguaWZHcmVhdGVyVGhhblplcm8gPSB0aGlzLmlvLmNyZWF0ZUlmRWxzZSgpO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW5aZXJvICk7XG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuWmVyby5jb25uZWN0KCBncmFwaC5pZkdyZWF0ZXJUaGFuWmVyby5pZiApO1xuICAgICAgICBncmFwaC5lbHNlSWZCcmFuY2guY29ubmVjdCggZ3JhcGguaWZHcmVhdGVyVGhhblplcm8udGhlbiApO1xuICAgICAgICBncmFwaC5lbHNlQnJhbmNoLmNvbm5lY3QoIGdyYXBoLmlmR3JlYXRlclRoYW5aZXJvLmVsc2UgKTtcblxuICAgICAgICAvLyBpZigoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID09PSAwKVxuICAgICAgICBncmFwaC5lcXVhbHNaZXJvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuICAgICAgICBncmFwaC5pZkVxdWFsc1plcm8gPSB0aGlzLmlvLmNyZWF0ZUlmRWxzZSgpO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggZ3JhcGguZXF1YWxzWmVybyApO1xuICAgICAgICBncmFwaC5lcXVhbHNaZXJvLmNvbm5lY3QoIGdyYXBoLmlmRXF1YWxzWmVyby5pZiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5pZkVxdWFsc1plcm8udGhlbiApO1xuICAgICAgICBncmFwaC5pZkdyZWF0ZXJUaGFuWmVyby5jb25uZWN0KCBncmFwaC5pZkVxdWFsc1plcm8uZWxzZSApO1xuXG4gICAgICAgIGdyYXBoLmlmRXF1YWxzWmVyby5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IGxvd0luKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5sb3dJbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd0luKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBoaWdoSW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmhpZ2hJbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGhpZ2hJbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEluLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGxvd091dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMubG93T3V0LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbG93T3V0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgaGlnaE91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuaGlnaE91dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGhpZ2hPdXQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgZXhwb25lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkuX2V4cG9uZW50LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgZXhwb25lbnQoIHZhbHVlICkge1xuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG4gICAgICAgIGdyYXBoLl9leHBvbmVudC52YWx1ZSA9IHZhbHVlO1xuICAgICAgICBncmFwaC5wb3cudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVQb3cudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2NhbGVFeHAgPSBmdW5jdGlvbiggbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHBvbmVudCApIHtcbiAgICByZXR1cm4gbmV3IFNjYWxlRXhwKCB0aGlzLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQsIGV4cG9uZW50ICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIFNpZ24gZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuU2lnbiApO1xuXG4gICAgICAgIGdyYXBoLmlmRWxzZSA9IHRoaXMuaW8uY3JlYXRlSWZFbHNlKCk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG9aZXJvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZXF1YWxUb1plcm8gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5pZkVsc2UudGhlbiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuXG4gICAgICAgIGdyYXBoLmVxdWFsVG9aZXJvLmNvbm5lY3QoIGdyYXBoLmlmRWxzZS5pZiApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggZ3JhcGguaWZFbHNlLmVsc2UgKTtcbiAgICAgICAgZ3JhcGguaWZFbHNlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNpZ24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFNpZ24oIHRoaXMgKTtcbn07XG4iLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NZXRob2RzX29mX2NvbXB1dGluZ19zcXVhcmVfcm9vdHMjRXhhbXBsZVxuLy9cbi8vIGZvciggdmFyIGkgPSAwLCB4OyBpIDwgc2lnRmlndXJlczsgKytpICkge1xuLy8gICAgICBpZiggaSA9PT0gMCApIHtcbi8vICAgICAgICAgIHggPSBzaWdGaWd1cmVzICogTWF0aC5wb3coIDEwLCAyICk7XG4vLyAgICAgIH1cbi8vICAgICAgZWxzZSB7XG4vLyAgICAgICAgICB4ID0gMC41ICogKCB4ICsgKGlucHV0IC8geCkgKTtcbi8vICAgICAgfVxuLy8gfVxuXG4vLyBUT0RPOlxuLy8gIC0gTWFrZSBzdXJlIFNxcnQgdXNlcyBnZXRHcmFwaCBhbmQgc2V0R3JhcGguXG5jbGFzcyBTcXJ0SGVscGVyIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHByZXZpb3VzU3RlcCwgaW5wdXQsIG1heElucHV0ICkge1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gaW8uY3JlYXRlTXVsdGlwbHkoIDAuNSApO1xuICAgICAgICB0aGlzLmRpdmlkZSA9IGlvLmNyZWF0ZURpdmlkZSggbnVsbCwgbWF4SW5wdXQgKTtcbiAgICAgICAgdGhpcy5hZGQgPSBpby5jcmVhdGVBZGQoKTtcblxuICAgICAgICAvLyBpbnB1dCAvIHg7XG4gICAgICAgIGlucHV0LmNvbm5lY3QoIHRoaXMuZGl2aWRlLCAwLCAwICk7XG4gICAgICAgIHByZXZpb3VzU3RlcC5vdXRwdXQuY29ubmVjdCggdGhpcy5kaXZpZGUsIDAsIDEgKTtcblxuICAgICAgICAvLyB4ICsgKCBpbnB1dCAvIHggKVxuICAgICAgICBwcmV2aW91c1N0ZXAub3V0cHV0LmNvbm5lY3QoIHRoaXMuYWRkLCAwLCAwICk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNvbm5lY3QoIHRoaXMuYWRkLCAwLCAxICk7XG5cbiAgICAgICAgLy8gMC41ICogKCB4ICsgKCBpbnB1dCAvIHggKSApXG4gICAgICAgIHRoaXMuYWRkLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkgKTtcblxuICAgICAgICB0aGlzLm91dHB1dCA9IHRoaXMubXVsdGlwbHk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5tdWx0aXBseS5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5hZGQuY2xlYW5VcCgpO1xuXG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSBudWxsO1xuICAgICAgICB0aGlzLmRpdmlkZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYWRkID0gbnVsbDtcbiAgICAgICAgdGhpcy5vdXRwdXQgPSBudWxsO1xuICAgIH1cbn1cblxuY2xhc3MgU3FydCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgc2lnbmlmaWNhbnRGaWd1cmVzLCBtYXhJbnB1dCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gRGVmYXVsdCB0byA2IHNpZ25pZmljYW50IGZpZ3VyZXMuXG4gICAgICAgIHNpZ25pZmljYW50RmlndXJlcyA9IHNpZ25pZmljYW50RmlndXJlcyB8fCA2O1xuXG4gICAgICAgIG1heElucHV0ID0gbWF4SW5wdXQgfHwgMTAwO1xuXG4gICAgICAgIHRoaXMueDAgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCBzaWduaWZpY2FudEZpZ3VyZXMgKiBNYXRoLnBvdyggMTAsIDIgKSApO1xuXG4gICAgICAgIHRoaXMuc3RlcHMgPSBbIHtcbiAgICAgICAgICAgIG91dHB1dDogdGhpcy54MFxuICAgICAgICB9IF07XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAxOyBpIDwgc2lnbmlmaWNhbnRGaWd1cmVzOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnB1c2goXG4gICAgICAgICAgICAgICAgbmV3IFNxcnRIZWxwZXIoIHRoaXMuaW8sIHRoaXMuc3RlcHNbIGkgLSAxIF0sIHRoaXMuaW5wdXRzWyAwIF0sIG1heElucHV0IClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0ZXBzWyB0aGlzLnN0ZXBzLmxlbmd0aCAtIDEgXS5vdXRwdXQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICAvLyBjbGVhblVwKCkge1xuICAgIC8vICAgICBzdXBlcigpO1xuXG4gICAgLy8gICAgIHRoaXMueDAuY2xlYW5VcCgpO1xuXG4gICAgLy8gICAgIHRoaXMuc3RlcHNbIDAgXSA9IG51bGw7XG5cbiAgICAvLyAgICAgZm9yKCB2YXIgaSA9IHRoaXMuc3RlcHMubGVuZ3RoIC0gMTsgaSA+PSAxOyAtLWkgKSB7XG4gICAgLy8gICAgICAgICB0aGlzLnN0ZXBzWyBpIF0uY2xlYW5VcCgpO1xuICAgIC8vICAgICAgICAgdGhpcy5zdGVwc1sgaSBdID0gbnVsbDtcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIHRoaXMueDAgPSBudWxsO1xuICAgIC8vICAgICB0aGlzLnN0ZXBzID0gbnVsbDtcbiAgICAvLyB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3FydCA9IGZ1bmN0aW9uKCBzaWduaWZpY2FudEZpZ3VyZXMsIG1heElucHV0ICkge1xuICAgIHJldHVybiBuZXcgU3FydCggdGhpcywgc2lnbmlmaWNhbnRGaWd1cmVzLCBtYXhJbnB1dCApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBTcXVhcmUgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3F1YXJlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBTcXVhcmUoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBTdWJ0cmFjdHMgdGhlIHNlY29uZCBpbnB1dCBmcm9tIHRoZSBmaXJzdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgU3VidHJhY3QgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubmVnYXRlID0gdGhpcy5pby5jcmVhdGVOZWdhdGUoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubmVnYXRlICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0ZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3VidHJhY3QgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBTdWJ0cmFjdCggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgU3dpdGNoIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyBFbnN1cmUgc3RhcnRpbmdDYXNlIGlzIG5ldmVyIDwgMFxuICAgICAgICBzdGFydGluZ0Nhc2UgPSB0eXBlb2Ygc3RhcnRpbmdDYXNlID09PSAnbnVtYmVyJyA/IE1hdGguYWJzKCBzdGFydGluZ0Nhc2UgKSA6IHN0YXJ0aW5nQ2FzZTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguY2FzZXMgPSBbXTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggc3RhcnRpbmdDYXNlICk7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgbnVtQ2FzZXM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXS5nYWluLnZhbHVlID0gMC4wO1xuICAgICAgICAgICAgZ3JhcGguY2FzZXNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbyggaSApO1xuICAgICAgICAgICAgZ3JhcGguY2FzZXNbIGkgXS5jb25uZWN0KCB0aGlzLmlucHV0c1sgaSBdLmdhaW4gKTtcbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuaW5kZXguY29ubmVjdCggZ3JhcGguY2FzZXNbIGkgXSApO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgY29udHJvbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuaW5kZXguY29udHJvbDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmluZGV4LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4LnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVN3aXRjaCA9IGZ1bmN0aW9uKCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICkge1xuICAgIHJldHVybiBuZXcgU3dpdGNoKCB0aGlzLCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIEFORCBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBTkQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEFORCggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQU5EOyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuY2xhc3MgTG9naWNhbE9wZXJhdG9yIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jbGFtcCA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAsIDEgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IGdyYXBoLmNsYW1wO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMb2dpY2FsT3BlcmF0b3I7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxvZ2ljYWxPcGVyYXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTG9naWNhbE9wZXJhdG9yKCB0aGlzICk7XG59OyIsIi8vIEFORCAtPiBOT1QgLT4gb3V0XG4vL1xuaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IExvZ2ljYWxPcGVyYXRvciBmcm9tIFwiLi9Mb2dpY2FsT3BlcmF0b3IuZXM2XCI7XG5cblxuY2xhc3MgTkFORCBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgZ3JhcGguQU5EID0gdGhpcy5pby5jcmVhdGVBTkQoKTtcbiAgICAgICAgZ3JhcGguTk9UID0gdGhpcy5pby5jcmVhdGVOT1QoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5BTkQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5BTkQsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguQU5ELmNvbm5lY3QoIGdyYXBoLk5PVCApO1xuICAgICAgICBncmFwaC5OT1QuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTkFORCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTkFORCggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTkFORDsiLCIvLyBPUiAtPiBOT1QgLT4gb3V0XG5pbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTG9naWNhbE9wZXJhdG9yIGZyb20gXCIuL0xvZ2ljYWxPcGVyYXRvci5lczZcIjtcblxuXG5jbGFzcyBOT1IgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG4gICAgICAgIGdyYXBoLk9SID0gdGhpcy5pby5jcmVhdGVPUigpO1xuICAgICAgICBncmFwaC5OT1QgPSB0aGlzLmlvLmNyZWF0ZU5PVCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLk9SLCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGguT1IsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguT1IuY29ubmVjdCggZ3JhcGguTk9UICk7XG4gICAgICAgIGdyYXBoLk5PVC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOT1IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE5PUiggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTk9SOyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIE5PVCBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5hYnMgPSB0aGlzLmlvLmNyZWF0ZUFicyggMTAwICk7XG4gICAgICAgIGdyYXBoLnN1YnRyYWN0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCggMSApO1xuICAgICAgICBncmFwaC5yb3VuZCA9IHRoaXMuaW8uY3JlYXRlUm91bmQoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnN1YnRyYWN0ICk7XG4gICAgICAgIGdyYXBoLnN1YnRyYWN0LmNvbm5lY3QoIGdyYXBoLmFicyApO1xuICAgICAgICBncmFwaC5hYnMuY29ubmVjdCggZ3JhcGgucm91bmQgKVxuXG4gICAgICAgIGdyYXBoLnJvdW5kLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5PVCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTk9UKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOT1Q7IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IExvZ2ljYWxPcGVyYXRvciBmcm9tIFwiLi9Mb2dpY2FsT3BlcmF0b3IuZXM2XCI7XG5cblxuY2xhc3MgT1IgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubWF4ID0gdGhpcy5pby5jcmVhdGVNYXgoKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUbyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbyggMSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVDbGFtcCggMCwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubWF4ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubWF4LmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgIGdyYXBoLm1heC5jb25uZWN0KCBncmFwaC5lcXVhbFRvICk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlT1IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9SKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBPUjtcbiIsIi8vIGEgZXF1YWxUbyggYiApIC0+IE5PVCAtPiBvdXRcbmltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIFhPUiBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUbyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbygpO1xuICAgICAgICBncmFwaC5OT1QgPSB0aGlzLmlvLmNyZWF0ZU5PVCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmVxdWFsVG8gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5lcXVhbFRvLmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8uY29ubmVjdCggZ3JhcGguTk9UICk7XG4gICAgICAgIGdyYXBoLk5PVC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVYT1IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFhPUiggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgWE9SOyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIGdhaW4oKzEwMDAwMCkgLT4gc2hhcGVyKCA8PSAwOiAxLCAxIClcbmNsYXNzIEVxdWFsVG8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgLy8gVE9ET1xuICAgICAgICAvLyAgLSBSZW5hbWUgdGhpcy5cbiAgICAgICAgZ3JhcGgudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApLFxuICAgICAgICBncmFwaC5pbnZlcnNpb24gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuXG4gICAgICAgIGdyYXBoLmludmVyc2lvbi5nYWluLnZhbHVlID0gLTE7XG5cbiAgICAgICAgLy8gVGhpcyBjdXJ2ZSBvdXRwdXRzIDAuNSB3aGVuIGlucHV0IGlzIDAsXG4gICAgICAgIC8vIHNvIGl0IGhhcyB0byBiZSBwaXBlZCBpbnRvIGEgbm9kZSB0aGF0XG4gICAgICAgIC8vIHRyYW5zZm9ybXMgaXQgaW50byAxLCBhbmQgbGVhdmVzIHplcm9zXG4gICAgICAgIC8vIGFsb25lLlxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkVxdWFsVG9aZXJvICk7XG5cbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW5aZXJvID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhblplcm8oKTtcbiAgICAgICAgZ3JhcGgudmFsdWUuY29ubmVjdCggZ3JhcGguaW52ZXJzaW9uICk7XG4gICAgICAgIGdyYXBoLmludmVyc2lvbi5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIGdyYXBoLmdyZWF0ZXJUaGFuWmVybyApO1xuICAgICAgICBncmFwaC5ncmVhdGVyVGhhblplcm8uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gZ3JhcGgudmFsdWU7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVFcXVhbFRvID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgRXF1YWxUbyggdGhpcywgdmFsdWUgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEVxdWFsVG87IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcbmltcG9ydCBFcXVhbFRvIGZyb20gXCIuL0VxdWFsVG8uZXM2XCI7XG5cbi8vIEhhdmVuJ3QgcXVpdGUgZmlndXJlZCBvdXQgd2h5IHlldCwgYnV0IHRoaXMgcmV0dXJucyAwIHdoZW4gaW5wdXQgaXMgMC5cbi8vIEl0IHNob3VsZCByZXR1cm4gMS4uLlxuLy9cbi8vIEZvciBub3csIEknbSBqdXN0IHVzaW5nIHRoZSBFcXVhbFRvIG5vZGUgd2l0aCBhIHN0YXRpYyAwIGFyZ3VtZW50LlxuLy8gLS0tLS0tLS1cbi8vXG4vLyBjbGFzcyBFcXVhbFRvWmVybyBleHRlbmRzIE5vZGUge1xuLy8gICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbi8vICAgICAgICAgc3VwZXIoIGlvLCAxLCAwICk7XG5cbi8vICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gMTAwMDAwO1xuXG4vLyAgICAgICAgIC8vIFRoaXMgb3V0cHV0cyAwLjUgd2hlbiBpbnB1dCBpcyAwLFxuLy8gICAgICAgICAvLyBzbyBpdCBoYXMgdG8gYmUgcGlwZWQgaW50byBhIG5vZGUgdGhhdFxuLy8gICAgICAgICAvLyB0cmFuc2Zvcm1zIGl0IGludG8gMSwgYW5kIGxlYXZlcyB6ZXJvc1xuLy8gICAgICAgICAvLyBhbG9uZS5cbi8vICAgICAgICAgdGhpcy5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkVxdWFsVG9aZXJvICk7XG5cbi8vICAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZUdyZWF0ZXJUaGFuKCAwICk7XG5cbi8vICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnNoYXBlciApO1xuLy8gICAgICAgICB0aGlzLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuLy8gICAgIH1cblxuLy8gICAgIGNsZWFuVXAoKSB7XG4vLyAgICAgICAgIHN1cGVyKCk7XG5cbi8vICAgICAgICAgdGhpcy5zaGFwZXIuY2xlYW5VcCgpO1xuLy8gICAgICAgICB0aGlzLnNoYXBlciA9IG51bGw7XG4vLyAgICAgfVxuLy8gfVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVFcXVhbFRvWmVybyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIHJldHVybiBuZXcgRXF1YWxUb1plcm8oIHRoaXMgKTtcblxuICAgIHJldHVybiBuZXcgRXF1YWxUbyggdGhpcywgMCApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBHcmVhdGVyVGhhbiBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgZ3JhcGguaW52ZXJzaW9uID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICBncmFwaC5pbnZlcnNpb24uZ2Fpbi52YWx1ZSA9IC0xO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDEwMDAwMDtcbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5HcmVhdGVyVGhhblplcm8gKTtcblxuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGguaW52ZXJzaW9uICk7XG4gICAgICAgIGdyYXBoLmludmVyc2lvbi5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlR3JlYXRlclRoYW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBHcmVhdGVyVGhhbiggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgR3JlYXRlclRoYW5FcXVhbFRvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuICAgICAgICBncmFwaC5ncmVhdGVyVGhhbiA9IHRoaXMuaW8uY3JlYXRlR3JlYXRlclRoYW4oKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUbyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbygpO1xuICAgICAgICBncmFwaC5PUiA9IHRoaXMuaW8uY3JlYXRlT1IoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNvbm5lY3QoIGdyYXBoLmdyZWF0ZXJUaGFuLmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGguZXF1YWxUby5jb250cm9scy52YWx1ZSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5lcXVhbFRvICk7XG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuLmNvbm5lY3QoIGdyYXBoLk9SLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8uY29ubmVjdCggZ3JhcGguT1IsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguT1IuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUdyZWF0ZXJUaGFuRXF1YWxUbyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IEdyZWF0ZXJUaGFuRXF1YWxUbyggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgR3JlYXRlclRoYW5aZXJvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gMTAwMDAwO1xuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkdyZWF0ZXJUaGFuWmVybyApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlR3JlYXRlclRoYW5aZXJvID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBHcmVhdGVyVGhhblplcm8oIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgSWZFbHNlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDAgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguc3dpdGNoID0gdGhpcy5pby5jcmVhdGVTd2l0Y2goIDIsIDAgKTtcblxuICAgICAgICB0aGlzLmlmID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuICAgICAgICB0aGlzLmlmLmNvbm5lY3QoIGdyYXBoLnN3aXRjaC5jb250cm9sICk7XG4gICAgICAgIHRoaXMudGhlbiA9IGdyYXBoLnN3aXRjaC5pbnB1dHNbIDAgXTtcbiAgICAgICAgdGhpcy5lbHNlID0gZ3JhcGguc3dpdGNoLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gZ3JhcGguc3dpdGNoLmlucHV0cztcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gZ3JhcGguc3dpdGNoLm91dHB1dHM7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUlmRWxzZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSWZFbHNlKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIExlc3NUaGFuIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIGdyYXBoLnZhbHVlSW52ZXJzaW9uID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgudmFsdWVJbnZlcnNpb24uZ2Fpbi52YWx1ZSA9IC0xO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGgudmFsdWVJbnZlcnNpb24gKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAtMTAwMDAwO1xuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkdyZWF0ZXJUaGFuWmVybyApO1xuXG4gICAgICAgIGdyYXBoLnZhbHVlSW52ZXJzaW9uLmNvbm5lY3QoIHRoaXMuaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVMZXNzVGhhbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IExlc3NUaGFuKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMZXNzVGhhbkVxdWFsVG8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIGdyYXBoLmxlc3NUaGFuID0gdGhpcy5pby5jcmVhdGVMZXNzVGhhbigpO1xuICAgICAgICBncmFwaC5lcXVhbFRvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvKCk7XG4gICAgICAgIGdyYXBoLk9SID0gdGhpcy5pby5jcmVhdGVPUigpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGgubGVzc1RoYW4uY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5jb25uZWN0KCBncmFwaC5lcXVhbFRvLmNvbnRyb2xzLnZhbHVlICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5sZXNzVGhhbiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmVxdWFsVG8gKTtcbiAgICAgICAgZ3JhcGgubGVzc1RoYW4uY29ubmVjdCggZ3JhcGguT1IsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUby5jb25uZWN0KCBncmFwaC5PUiwgMCwgMSApO1xuICAgICAgICBncmFwaC5PUi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVzc1RoYW5FcXVhbFRvID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgTGVzc1RoYW5FcXVhbFRvKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMZXNzVGhhblplcm8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5ib29zdGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguYm9vc3Rlci5nYWluLnZhbHVlID0gLTEwMDAwMDtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5ib29zdGVyICk7XG5cbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5HcmVhdGVyVGhhblplcm8gKTtcblxuICAgICAgICBncmFwaC5ib29zdGVyLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVzc1RoYW5aZXJvID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBMZXNzVGhhblplcm8oIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gQ29zaW5lIGFwcHJveGltYXRpb24hXG4vL1xuLy8gT25seSB3b3JrcyBpbiByYW5nZSBvZiAtTWF0aC5QSSB0byBNYXRoLlBJLlxuY2xhc3MgQ29zIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgZ3JhcGguc3F1YXJlID0gdGhpcy5pby5jcmVhdGVTcXVhcmUoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkxID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggLTIuNjA1ZS03ICk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5MiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkzID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTQgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5NSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICBncmFwaC5hZGQxID0gdGhpcy5pby5jcmVhdGVBZGQoIDIuNDc2MDllLTUgKTtcbiAgICAgICAgZ3JhcGguYWRkMiA9IHRoaXMuaW8uY3JlYXRlQWRkKCAtMC4wMDEzODg4NCApO1xuICAgICAgICBncmFwaC5hZGQzID0gdGhpcy5pby5jcmVhdGVBZGQoIDAuMDQxNjY2NiApO1xuICAgICAgICBncmFwaC5hZGQ0ID0gdGhpcy5pby5jcmVhdGVBZGQoIC0wLjQ5OTkyMyApO1xuICAgICAgICBncmFwaC5hZGQ1ID0gdGhpcy5pby5jcmVhdGVBZGQoIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNxdWFyZSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgbXVsdGlwbHkxJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTEsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGFkZDEncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkxLmNvbm5lY3QoIGdyYXBoLmFkZDEsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIG11bHRpcGx5MidzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkyLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDEuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkyLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBhZGQyJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5Mi5jb25uZWN0KCBncmFwaC5hZGQyLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBtdWx0aXBseTMncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MywgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQyLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MywgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgYWRkMydzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTMuY29ubmVjdCggZ3JhcGguYWRkMywgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgbXVsdGlwbHk0J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTQsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkMy5jb25uZWN0KCBncmFwaC5tdWx0aXBseTQsIDAsIDEgKTtcblxuICAgICAgICAvLyBhZGQ0J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5NC5jb25uZWN0KCBncmFwaC5hZGQ0LCAwLCAwICk7XG5cbiAgICAgICAgLy8gbXVsdGlwbHk1J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkNC5jb25uZWN0KCBncmFwaC5tdWx0aXBseTUsIDAsIDEgKTtcblxuICAgICAgICAvLyBhZGQ1J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5NS5jb25uZWN0KCBncmFwaC5hZGQ1LCAwLCAwICk7XG5cbiAgICAgICAgLy8gT3V0cHV0IChmaW5hbGx5ISEpXG4gICAgICAgIGdyYXBoLmFkZDUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDAgXTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29zID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgQ29zKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBEZWdUb1JhZCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIE1hdGguUEkgLyAxODAgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZURlZ1RvUmFkID0gZnVuY3Rpb24oIGRlZyApIHtcbiAgICByZXR1cm4gbmV3IERlZ1RvUmFkKCB0aGlzLCBkZWcgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgUmFkVG9EZWcgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAxODAgLyBNYXRoLlBJICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVSYWRUb0RlZyA9IGZ1bmN0aW9uKCBkZWcgKSB7XG4gICAgcmV0dXJuIG5ldyBSYWRUb0RlZyggdGhpcywgZGVnICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIFNpbiBhcHByb3hpbWF0aW9uIVxuLy9cbi8vIE9ubHkgd29ya3MgaW4gcmFuZ2Ugb2YgLU1hdGguUEkgdG8gTWF0aC5QSS5cbmNsYXNzIFNpbiBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICBncmFwaC5zcXVhcmUgPSB0aGlzLmlvLmNyZWF0ZVNxdWFyZSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTEgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAtMi4zOWUtOCApO1xuICAgICAgICBncmFwaC5tdWx0aXBseTIgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5MyA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk0ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTUgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5NiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICBncmFwaC5hZGQxID0gdGhpcy5pby5jcmVhdGVBZGQoIDIuNzUyNmUtNiApO1xuICAgICAgICBncmFwaC5hZGQyID0gdGhpcy5pby5jcmVhdGVBZGQoIC0wLjAwMDE5ODQwOSApO1xuICAgICAgICBncmFwaC5hZGQzID0gdGhpcy5pby5jcmVhdGVBZGQoIDAuMDA4MzMzMzMgKTtcbiAgICAgICAgZ3JhcGguYWRkNCA9IHRoaXMuaW8uY3JlYXRlQWRkKCAtMC4xNjY2NjcgKTtcbiAgICAgICAgZ3JhcGguYWRkNSA9IHRoaXMuaW8uY3JlYXRlQWRkKCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zcXVhcmUgKTtcblxuICAgICAgICAvLyBDb25uZWN0IG11bHRpcGx5MSdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkxLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBhZGQxJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5MS5jb25uZWN0KCBncmFwaC5hZGQxLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBtdWx0aXBseTIncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MiwgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQxLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MiwgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgYWRkMidzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTIuY29ubmVjdCggZ3JhcGguYWRkMiwgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgbXVsdGlwbHkzJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTMsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkMi5jb25uZWN0KCBncmFwaC5tdWx0aXBseTMsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGFkZDMncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkzLmNvbm5lY3QoIGdyYXBoLmFkZDMsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IG11bHRpcGx5NCdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk0LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDMuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNCdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTQuY29ubmVjdCggZ3JhcGguYWRkNCwgMCwgMCApO1xuXG4gICAgICAgIC8vIG11bHRpcGx5NSdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk1LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDQuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk1LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNSdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTUuY29ubmVjdCggZ3JhcGguYWRkNSwgMCwgMCApO1xuXG4gICAgICAgIC8vIG11bHRpcGx5NidzIGlucHV0c1xuICAgICAgICB0aGlzLmlucHV0c1swXS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTYsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkNS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTYsIDAsIDEgKTtcblxuICAgICAgICAvLyBPdXRwdXQgKGZpbmFsbHkhISlcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk2LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNpbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFNpbiggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gVGFuZ2VudCBhcHByb3hpbWF0aW9uIVxuLy9cbi8vIE9ubHkgd29ya3MgaW4gcmFuZ2Ugb2YgLU1hdGguUEkgdG8gTWF0aC5QSS5cbi8vXG4vLyBzaW4oIGlucHV0ICkgLyBjb3MoIGlucHV0IClcbmNsYXNzIFRhbiBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICBncmFwaC5zaW5lID0gdGhpcy5pby5jcmVhdGVTaW4oKTtcbiAgICAgICAgZ3JhcGguY29zID0gdGhpcy5pby5jcmVhdGVDb3MoKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoIHVuZGVmaW5lZCwgTWF0aC5QSSAqIDIgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNpbmUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5jb3MgKTtcbiAgICAgICAgZ3JhcGguc2luZS5jb25uZWN0KCBncmFwaC5kaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguY29zLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLmRpdmlkZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVUYW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBUYW4oIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBDT05GSUcgZnJvbSBcIi4uL2NvcmUvY29uZmlnLmVzNlwiO1xuXG5mdW5jdGlvbiBQaW5rTnVtYmVyKCkge1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy53aGl0ZVZhbHVlcyA9IFtdO1xuICAgIHRoaXMucmFuZ2UgPSAxMjg7XG4gICAgdGhpcy5saW1pdCA9IDU7XG5cbiAgICB0aGlzLmdlbmVyYXRlID0gdGhpcy5nZW5lcmF0ZS5iaW5kKCB0aGlzICk7XG4gICAgdGhpcy5nZXROZXh0VmFsdWUgPSB0aGlzLmdldE5leHRWYWx1ZS5iaW5kKCB0aGlzICk7XG59XG5cblBpbmtOdW1iZXIucHJvdG90eXBlLmdlbmVyYXRlID0gZnVuY3Rpb24oIHJhbmdlLCBsaW1pdCApIHtcbiAgICB0aGlzLnJhbmdlID0gcmFuZ2UgfHwgMTI4O1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy5saW1pdCA9IGxpbWl0IHx8IDE7XG5cblx0dmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICB9XG59O1xuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZXROZXh0VmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGFzdEtleSA9IHRoaXMua2V5LFxuICAgICAgICBzdW0gPSAwO1xuXG4gICAgKyt0aGlzLmtleTtcblxuICAgIGlmKCB0aGlzLmtleSA+IHRoaXMubWF4S2V5ICkge1xuICAgICAgICB0aGlzLmtleSA9IDA7XG4gICAgfVxuXG4gICAgdmFyIGRpZmYgPSB0aGlzLmxhc3RLZXkgXiB0aGlzLmtleTtcbiAgICB2YXIgcmFuZ2VMaW1pdCA9IHRoaXMucmFuZ2UgLyB0aGlzLmxpbWl0O1xuXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbWl0OyArK2kgKSB7XG4gICAgICAgIGlmKCBkaWZmICYgKDEgPDwgaSkgKSB7XG4gICAgICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1bSArPSB0aGlzLndoaXRlVmFsdWVzWyBpIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bSAvIHRoaXMubGltaXQ7XG59O1xuXG52YXIgcGluayA9IG5ldyBQaW5rTnVtYmVyKCk7XG5waW5rLmdlbmVyYXRlKCk7XG5cblxuXG5cblxuZXhwb3J0IGRlZmF1bHQge1xuXHRyb3VuZEZyb21FcHNpbG9uOiBmdW5jdGlvbiggbiApIHtcblx0XHRsZXQgcm91bmRlZCA9IE1hdGgucm91bmQoIG4gKTtcblxuXHRcdGlmICggcm91bmRlZCAlIG4gPCBDT05GSUcuZXBzaWxvbiApIHtcblx0XHRcdHJldHVybiByb3VuZGVkXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIG47XG5cdFx0fVxuXHR9LFxuXG5cdHJvdW5kVG9NdWx0aXBsZTogZnVuY3Rpb24oIG4sIG11bHRpcGxlICkge1xuXHRcdHJldHVybiBNYXRoLmZsb29yKCAoIG4gKyBtdWx0aXBsZSAtIDEgKSAvIG11bHRpcGxlICkgKiBtdWx0aXBsZTtcblx0fSxcblxuXHRjbGFtcDogZnVuY3Rpb24oIHZhbHVlLCBtaW4sIG1heCApIHtcblx0XHRyZXR1cm4gTWF0aC5taW4oIG1heCwgTWF0aC5tYXgoIHZhbHVlLCBtaW4gKSApO1xuXHR9LFxuXG5cdHNjYWxlTnVtYmVyOiBmdW5jdGlvbiggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG5cdFx0cmV0dXJuICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICkgKiAoIGhpZ2hPdXQgLSBsb3dPdXQgKSArIGxvd091dDtcblx0fSxcblxuXHRzY2FsZU51bWJlckV4cDogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHAgKSB7XG5cdFx0aWYgKCB0eXBlb2YgZXhwICE9PSAnbnVtYmVyJyB8fCBleHAgPT09IDEgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5zY2FsZU51bWJlciggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKTtcblx0XHR9XG5cblx0XHRpZiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSA9PT0gMCApIHtcblx0XHRcdHJldHVybiBsb3dPdXQ7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPiAwICkge1xuXHRcdFx0XHRyZXR1cm4gKCBsb3dPdXQgKyAoIGhpZ2hPdXQgLSBsb3dPdXQgKSAqIE1hdGgucG93KCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICksIGV4cCApICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiAtKCBNYXRoLnBvdyggKCAoIC1udW0gKyBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICksIGV4cCApICkgKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Ly8gQSB2ZXJ5IHBvb3IgYXBwcm94aW1hdGlvbiBvZiBhIGdhdXNzaWFuIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yIVxuXHRnYXVzc2lhblJhbmRvbTogZnVuY3Rpb24oIGN5Y2xlcyApIHtcblx0XHRjeWNsZXMgPSBjeWNsZXMgfHwgMTA7XG5cblx0XHR2YXIgbiA9IDAsXG5cdFx0XHRpID0gY3ljbGVzO1xuXG5cdFx0d2hpbGUoIC0taSApIHtcblx0XHRcdG4gKz0gTWF0aC5yYW5kb20oKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbiAvIGN5Y2xlcztcblx0fSxcblxuXHQvLyBGcm9tOlxuXHQvLyBcdGh0dHA6Ly93d3cubWVyZWRpdGhkb2RnZS5jb20vMjAxMi8wNS8zMC9hLWdyZWF0LWxpdHRsZS1qYXZhc2NyaXB0LWZ1bmN0aW9uLWZvci1nZW5lcmF0aW5nLXJhbmRvbS1nYXVzc2lhbm5vcm1hbGJlbGwtY3VydmUtbnVtYmVycy9cblx0bnJhbmQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB4MSxcblx0XHRcdHgyLFxuXHRcdFx0cmFkLFxuXHRcdFx0eTE7XG5cblx0XHRkbyB7XG5cdFx0XHR4MSA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHgyID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuXHRcdFx0cmFkID0geDEgKiB4MSArIHgyICogeDI7XG5cdFx0fSB3aGlsZSggcmFkID49IDEgfHwgcmFkID09PSAwICk7XG5cblx0XHR2YXIgYyA9IE1hdGguc3FydCggLTIgKiBNYXRoLmxvZyggcmFkICkgLyByYWQgKTtcblxuXHRcdHJldHVybiAoKHgxICogYykgLyA1KSAqIDAuNSArIDAuNTtcblx0fSxcblxuXHRnZW5lcmF0ZVBpbmtOdW1iZXI6IHBpbmsuZ2VuZXJhdGUsXG5cdGdldE5leHRQaW5rTnVtYmVyOiBwaW5rLmdldE5leHRWYWx1ZSxcblxufTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgY2xlYW5VcEluT3V0czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbnB1dHMsXG4gICAgICAgICAgICBvdXRwdXRzO1xuXG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KCB0aGlzLmlucHV0cyApICkge1xuICAgICAgICAgICAgaW5wdXRzID0gdGhpcy5pbnB1dHM7XG5cbiAgICAgICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgIGlmKCBpbnB1dHNbIGkgXSAmJiB0eXBlb2YgaW5wdXRzWyBpIF0uY2xlYW5VcCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRzWyBpIF0uY2xlYW5VcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBpbnB1dHNbIGkgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRzWyBpIF0uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlucHV0c1sgaSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5pbnB1dHMgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIEFycmF5LmlzQXJyYXkoIHRoaXMub3V0cHV0cyApICkge1xuICAgICAgICAgICAgb3V0cHV0cyA9IHRoaXMub3V0cHV0cztcblxuICAgICAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBvdXRwdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgIGlmKCBvdXRwdXRzWyBpIF0gJiYgdHlwZW9mIG91dHB1dHNbIGkgXS5jbGVhblVwID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRzWyBpIF0uY2xlYW5VcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBvdXRwdXRzWyBpIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dHNbIGkgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb3V0cHV0c1sgaSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5vdXRwdXRzID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjbGVhbklPOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYoIHRoaXMuaW8gKSB7XG4gICAgICAgICAgICB0aGlzLmlvID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCB0aGlzLmNvbnRleHQgKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufTsiLCJ2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBjb25uZWN0OiBmdW5jdGlvbiggbm9kZSwgb3V0cHV0Q2hhbm5lbCA9IDAsIGlucHV0Q2hhbm5lbCA9IDAgKSB7XG4gICAgICAgIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gfHwgbm9kZSBpbnN0YW5jZW9mIEF1ZGlvTm9kZSApIHtcbiAgICAgICAgICAgIC8vIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmNvbm5lY3QoIG5vZGUgKTtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmNvbm5lY3QuY2FsbCggdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0sIG5vZGUsIDAsIGlucHV0Q2hhbm5lbCApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgJiYgbm9kZS5vdXRwdXRzICYmIG5vZGUub3V0cHV0cy5sZW5ndGggKSB7XG4gICAgICAgICAgICAvLyBpZiggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdIGluc3RhbmNlb2YgUGFyYW0gKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggJ0NPTk5FQ1RJTkcgVE8gUEFSQU0nICk7XG4gICAgICAgICAgICAvLyBub2RlLmlvLmNvbnN0YW50RHJpdmVyLmRpc2Nvbm5lY3QoIG5vZGUuY29udHJvbCApO1xuICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXS5jb25uZWN0KCBub2RlLmlucHV0c1sgaW5wdXRDaGFubmVsIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvciggJ0FTU0VSVCBOT1QgUkVBQ0hFRCcgKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkaXNjb25uZWN0OiBmdW5jdGlvbiggbm9kZSwgb3V0cHV0Q2hhbm5lbCA9IDAsIGlucHV0Q2hhbm5lbCA9IDApIHtcbiAgICAgICAgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9QYXJhbSB8fCBub2RlIGluc3RhbmNlb2YgQXVkaW9Ob2RlICkge1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0uZGlzY29ubmVjdC5jYWxsKCB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXSwgbm9kZSwgMCwgaW5wdXRDaGFubmVsICk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICggbm9kZSAmJiBub2RlLmlucHV0cyAmJiBub2RlLmlucHV0cy5sZW5ndGggKSB7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXS5kaXNjb25uZWN0KCBub2RlLmlucHV0c1sgaW5wdXRDaGFubmVsIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYoIG5vZGUgPT09IHVuZGVmaW5lZCAmJiB0aGlzLm91dHB1dHMgKSB7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHMuZm9yRWFjaCggZnVuY3Rpb24oIG4gKSB7XG4gICAgICAgICAgICAgICAgaWYoIG4gJiYgdHlwZW9mIG4uZGlzY29ubmVjdCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICAgICAgbi5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNoYWluOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVzID0gc2xpY2UuY2FsbCggYXJndW1lbnRzICksXG4gICAgICAgICAgICBub2RlID0gdGhpcztcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgbm9kZS5jb25uZWN0LmNhbGwoIG5vZGUsIG5vZGVzWyBpIF0gKTtcbiAgICAgICAgICAgIG5vZGUgPSBub2Rlc1sgaSBdO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGZhbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub2RlcyA9IHNsaWNlLmNhbGwoIGFyZ3VtZW50cyApLFxuICAgICAgICAgICAgbm9kZSA9IHRoaXM7XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdC5jYWxsKCBub2RlLCBub2Rlc1sgaSBdICk7XG4gICAgICAgIH1cbiAgICB9XG59OyIsImltcG9ydCBtYXRoIGZyb20gXCIuL21hdGguZXM2XCI7XG5pbXBvcnQgbm90ZVN0cmluZ3MgZnJvbSBcIi4vbm90ZVN0cmluZ3MuZXM2XCI7XG5pbXBvcnQgbm90ZXMgZnJvbSBcIi4vbm90ZXMuZXM2XCI7XG5pbXBvcnQgQ09ORklHIGZyb20gXCIuLi9jb3JlL2NvbmZpZy5lczZcIjtcbmltcG9ydCBub3RlUmVnRXhwIGZyb20gXCIuL25vdGVSZWdFeHAuZXM2XCI7XG5cblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHNjYWxhclRvRGI6IGZ1bmN0aW9uKCBzY2FsYXIgKSB7XG4gICAgICAgIHJldHVybiAyMCAqICggTWF0aC5sb2coIHNjYWxhciApIC8gTWF0aC5MTjEwICk7XG4gICAgfSxcbiAgICBkYlRvU2NhbGFyOiBmdW5jdGlvbiggZGIgKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnBvdyggMiwgZGIgLyA2ICk7XG4gICAgfSxcblxuICAgIGh6VG9NSURJOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiBtYXRoLnJvdW5kRnJvbUVwc2lsb24oIDY5ICsgMTIgKiBNYXRoLmxvZzIoIHZhbHVlIC8gNDQwICkgKTtcbiAgICB9LFxuXG4gICAgaHpUb05vdGU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvTm90ZSggdGhpcy5oelRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBoelRvTXM6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgaWYgKCB2YWx1ZSA9PT0gMCApIHJldHVybiAwO1xuICAgICAgICByZXR1cm4gMTAwMCAvIHZhbHVlO1xuICAgIH0sXG5cbiAgICBoelRvQlBNOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zVG9CUE0oIHRoaXMuaHpUb01zKCB2YWx1ZSApICk7XG4gICAgfSxcblxuXG5cbiAgICBtaWRpVG9IejogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gTWF0aC5wb3coIDIsICggdmFsdWUgLSA2OSApIC8gMTIgKSAqIDQ0MDtcbiAgICB9LFxuXG4gICAgbWlkaVRvTm90ZTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICBsZXQgdmFsdWVzID0gKCB2YWx1ZSArICcnICkuc3BsaXQoICcuJyApLFxuICAgICAgICAgICAgbm90ZVZhbHVlID0gK3ZhbHVlc1sgMCBdLFxuICAgICAgICAgICAgY2VudHMgPSAoIHZhbHVlc1sgMSBdID8gcGFyc2VGbG9hdCggJzAuJyArIHZhbHVlc1sgMSBdLCAxMCApIDogMCApICogMTAwO1xuXG4gICAgICAgIGlmICggTWF0aC5hYnMoIGNlbnRzICkgPj0gMTAwICkge1xuICAgICAgICAgICAgbm90ZVZhbHVlICs9IGNlbnRzICUgMTAwO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJvb3QgPSBub3RlVmFsdWUgJSAxMiB8IDAsXG4gICAgICAgICAgICBvY3RhdmUgPSBub3RlVmFsdWUgLyAxMiB8IDAsXG4gICAgICAgICAgICBub3RlTmFtZSA9IG5vdGVTdHJpbmdzWyByb290IF07XG5cbiAgICAgICAgcmV0dXJuIG5vdGVOYW1lICsgKCBvY3RhdmUgKyBDT05GSUcubG93ZXN0T2N0YXZlICkgKyAoIGNlbnRzID8gJysnICsgY2VudHMgOiAnJyApO1xuICAgIH0sXG5cbiAgICBtaWRpVG9NczogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5oelRvTXMoIHRoaXMubWlkaVRvSHooIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbWlkaVRvQlBNOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zVG9CUE0oIHRoaXMubWlkaVRvTXMoIHZhbHVlICkgKTtcbiAgICB9LFxuXG5cblxuICAgIG5vdGVUb0h6OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb0h6KCB0aGlzLm5vdGVUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbm90ZVRvTUlESTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICBsZXQgbWF0Y2hlcyA9IG5vdGVSZWdFeHAuZXhlYyggdmFsdWUgKSxcbiAgICAgICAgICAgIG5vdGUsIGFjY2lkZW50YWwsIG9jdGF2ZSwgY2VudHMsXG4gICAgICAgICAgICBub3RlVmFsdWU7XG5cbiAgICAgICAgaWYgKCAhbWF0Y2hlcyApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ0ludmFsaWQgbm90ZSBmb3JtYXQ6JywgdmFsdWUgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vdGUgPSBtYXRjaGVzWyAxIF07XG4gICAgICAgIGFjY2lkZW50YWwgPSBtYXRjaGVzWyAyIF07XG4gICAgICAgIG9jdGF2ZSA9IHBhcnNlSW50KCBtYXRjaGVzWyAzIF0sIDEwICkgKyAtQ09ORklHLmxvd2VzdE9jdGF2ZTtcbiAgICAgICAgY2VudHMgPSBwYXJzZUZsb2F0KCBtYXRjaGVzWyA0IF0gKSB8fCAwO1xuXG4gICAgICAgIG5vdGVWYWx1ZSA9IG5vdGVzWyBub3RlICsgYWNjaWRlbnRhbCBdO1xuXG4gICAgICAgIHJldHVybiBtYXRoLnJvdW5kRnJvbUVwc2lsb24oIG5vdGVWYWx1ZSArICggb2N0YXZlICogMTIgKSArICggY2VudHMgKiAwLjAxICkgKTtcbiAgICB9LFxuXG4gICAgbm90ZVRvTXM6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvTXMoIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBub3RlVG9CUE06IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvQlBNKCB0aGlzLm5vdGVUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG5cblxuICAgIG1zVG9IejogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5oelRvTXMoIHZhbHVlICk7XG4gICAgfSxcblxuICAgIG1zVG9Ob3RlOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb01zKCB0aGlzLm5vdGVUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbXNUb01JREk6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaHpUb01JREkoIHRoaXMubXNUb0h6KCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIG1zVG9CUE06IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSAwID8gMCA6IDYwMDAwIC8gdmFsdWU7XG4gICAgfSxcblxuXG5cbiAgICBicG1Ub0h6OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zVG9IeiggdGhpcy5icG1Ub01zKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGJwbVRvTm90ZTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9CUE0oIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBicG1Ub01JREk6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb01JREkoIHRoaXMuYnBtVG9NcyggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBicG1Ub01zOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zVG9CUE0oIHZhbHVlICk7XG4gICAgfVxufTsiLCJpbXBvcnQgQ09ORklHIGZyb20gXCIuLi9jb3JlL2NvbmZpZy5lczZcIjtcblxuZnVuY3Rpb24gUGlua051bWJlcigpIHtcbiAgICB0aGlzLm1heEtleSA9IDB4MWY7XG4gICAgdGhpcy5rZXkgPSAwO1xuICAgIHRoaXMud2hpdGVWYWx1ZXMgPSBbXTtcbiAgICB0aGlzLnJhbmdlID0gMTI4O1xuICAgIHRoaXMubGltaXQgPSA1O1xuXG4gICAgdGhpcy5nZW5lcmF0ZSA9IHRoaXMuZ2VuZXJhdGUuYmluZCggdGhpcyApO1xuICAgIHRoaXMuZ2V0TmV4dFZhbHVlID0gdGhpcy5nZXROZXh0VmFsdWUuYmluZCggdGhpcyApO1xufVxuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZW5lcmF0ZSA9IGZ1bmN0aW9uKCByYW5nZSwgbGltaXQgKSB7XG4gICAgdGhpcy5yYW5nZSA9IHJhbmdlIHx8IDEyODtcbiAgICB0aGlzLm1heEtleSA9IDB4MWY7XG4gICAgdGhpcy5rZXkgPSAwO1xuICAgIHRoaXMubGltaXQgPSBsaW1pdCB8fCAxO1xuXG5cdHZhciByYW5nZUxpbWl0ID0gdGhpcy5yYW5nZSAvIHRoaXMubGltaXQ7XG5cbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubGltaXQ7ICsraSApIHtcbiAgICAgICAgdGhpcy53aGl0ZVZhbHVlc1sgaSBdID0gTWF0aC5yYW5kb20oKSAlIHJhbmdlTGltaXQ7XG4gICAgfVxufTtcblxuUGlua051bWJlci5wcm90b3R5cGUuZ2V0TmV4dFZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxhc3RLZXkgPSB0aGlzLmtleSxcbiAgICAgICAgc3VtID0gMDtcblxuICAgICsrdGhpcy5rZXk7XG5cbiAgICBpZiggdGhpcy5rZXkgPiB0aGlzLm1heEtleSApIHtcbiAgICAgICAgdGhpcy5rZXkgPSAwO1xuICAgIH1cblxuICAgIHZhciBkaWZmID0gdGhpcy5sYXN0S2V5IF4gdGhpcy5rZXk7XG4gICAgdmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICBpZiggZGlmZiAmICgxIDw8IGkpICkge1xuICAgICAgICAgICAgdGhpcy53aGl0ZVZhbHVlc1sgaSBdID0gTWF0aC5yYW5kb20oKSAlIHJhbmdlTGltaXQ7XG4gICAgICAgIH1cblxuICAgICAgICBzdW0gKz0gdGhpcy53aGl0ZVZhbHVlc1sgaSBdO1xuICAgIH1cblxuICAgIHJldHVybiBzdW0gLyB0aGlzLmxpbWl0O1xufTtcblxudmFyIHBpbmsgPSBuZXcgUGlua051bWJlcigpO1xucGluay5nZW5lcmF0ZSgpO1xuXG5cblxuXG5cbmV4cG9ydCBkZWZhdWx0IHtcblx0cm91bmRGcm9tRXBzaWxvbjogZnVuY3Rpb24oIG4gKSB7XG5cdFx0bGV0IHJvdW5kZWQgPSBNYXRoLnJvdW5kKCBuICk7XG5cblx0XHRpZiAoIHJvdW5kZWQgJSBuIDwgQ09ORklHLmVwc2lsb24gKSB7XG5cdFx0XHRyZXR1cm4gcm91bmRlZFxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiBuO1xuXHRcdH1cblx0fSxcblxuXHRyb3VuZFRvTXVsdGlwbGU6IGZ1bmN0aW9uKCBuLCBtdWx0aXBsZSApIHtcblx0XHRyZXR1cm4gTWF0aC5mbG9vciggKCBuICsgbXVsdGlwbGUgLSAxICkgLyBtdWx0aXBsZSApICogbXVsdGlwbGU7XG5cdH0sXG5cblx0Y2xhbXA6IGZ1bmN0aW9uKCB2YWx1ZSwgbWluLCBtYXggKSB7XG5cdFx0cmV0dXJuIE1hdGgubWluKCBtYXgsIE1hdGgubWF4KCB2YWx1ZSwgbWluICkgKTtcblx0fSxcblxuXHRzY2FsZU51bWJlcjogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICkge1xuXHRcdHJldHVybiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSApICogKCBoaWdoT3V0IC0gbG93T3V0ICkgKyBsb3dPdXQ7XG5cdH0sXG5cblx0c2NhbGVOdW1iZXJFeHA6IGZ1bmN0aW9uKCBudW0sIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCwgZXhwICkge1xuXHRcdGlmICggdHlwZW9mIGV4cCAhPT0gJ251bWJlcicgfHwgZXhwID09PSAxICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc2NhbGVOdW1iZXIoIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICk7XG5cdFx0fVxuXG5cdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPT09IDAgKSB7XG5cdFx0XHRyZXR1cm4gbG93T3V0O1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApID4gMCApIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiBNYXRoLnBvdyggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApLCBleHAgKSApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHJldHVybiAoIGxvd091dCArICggaGlnaE91dCAtIGxvd091dCApICogLSggTWF0aC5wb3coICggKCAtbnVtICsgbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSApLCBleHAgKSApICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdC8vIEEgdmVyeSBwb29yIGFwcHJveGltYXRpb24gb2YgYSBnYXVzc2lhbiByYW5kb20gbnVtYmVyIGdlbmVyYXRvciFcblx0Z2F1c3NpYW5SYW5kb206IGZ1bmN0aW9uKCBjeWNsZXMgKSB7XG5cdFx0Y3ljbGVzID0gY3ljbGVzIHx8IDEwO1xuXG5cdFx0dmFyIG4gPSAwLFxuXHRcdFx0aSA9IGN5Y2xlcztcblxuXHRcdHdoaWxlKCAtLWkgKSB7XG5cdFx0XHRuICs9IE1hdGgucmFuZG9tKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG4gLyBjeWNsZXM7XG5cdH0sXG5cblx0Ly8gRnJvbTpcblx0Ly8gXHRodHRwOi8vd3d3Lm1lcmVkaXRoZG9kZ2UuY29tLzIwMTIvMDUvMzAvYS1ncmVhdC1saXR0bGUtamF2YXNjcmlwdC1mdW5jdGlvbi1mb3ItZ2VuZXJhdGluZy1yYW5kb20tZ2F1c3NpYW5ub3JtYWxiZWxsLWN1cnZlLW51bWJlcnMvXG5cdG5yYW5kOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgeDEsXG5cdFx0XHR4Mixcblx0XHRcdHJhZCxcblx0XHRcdHkxO1xuXG5cdFx0ZG8ge1xuXHRcdFx0eDEgPSAyICogTWF0aC5yYW5kb20oKSAtIDE7XG5cdFx0XHR4MiA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHJhZCA9IHgxICogeDEgKyB4MiAqIHgyO1xuXHRcdH0gd2hpbGUoIHJhZCA+PSAxIHx8IHJhZCA9PT0gMCApO1xuXG5cdFx0dmFyIGMgPSBNYXRoLnNxcnQoIC0yICogTWF0aC5sb2coIHJhZCApIC8gcmFkICk7XG5cblx0XHRyZXR1cm4gKCh4MSAqIGMpIC8gNSkgKiAwLjUgKyAwLjU7XG5cdH0sXG5cblx0Z2VuZXJhdGVQaW5rTnVtYmVyOiBwaW5rLmdlbmVyYXRlLFxuXHRnZXROZXh0UGlua051bWJlcjogcGluay5nZXROZXh0VmFsdWUsXG5cbn07IiwiZXhwb3J0IGRlZmF1bHQgL14oW0F8QnxDfER8RXxGfEddezF9KShbI2J4XXswLDJ9KShbXFwtXFwrXT9cXGQrKT8oW1xcK3xcXC1dezF9XFxkKi5cXGQqKT8vOyIsImV4cG9ydCBkZWZhdWx0IFsgJ0MnLCAnQyMnLCAnRCcsICdEIycsICdFJywgJ0YnLCAnRiMnLCAnRycsICdHIycsICdBJywgJ0EjJywgJ0InIF07IiwiZXhwb3J0IGRlZmF1bHQge1xuICAgICdDJzogMCwgICAgICdEYmInOiAwLCAgICdCIyc6IDAsXG4gICAgJ0MjJzogMSwgICAgJ0RiJzogMSwgICAgJ0IjIyc6IDEsICAgJ0J4JzogMSxcbiAgICAnRCc6IDIsICAgICAnRWJiJzogMiwgICAnQyMjJzogMiwgICAnQ3gnOiAyLFxuICAgICdEIyc6IDMsICAgICdFYic6IDMsICAgICdGYmInOiAzLFxuICAgICdFJzogNCwgICAgICdGYic6IDQsICAgICdEIyMnOiA0LCAgICdEeCc6IDQsXG4gICAgJ0YnOiA1LCAgICAgJ0diYic6IDUsICAgJ0UjJzogNSxcbiAgICAnRiMnOiA2LCAgICAnR2InOiA2LCAgICAnRSMjJzogNiwgICAnRXgnOiA2LFxuICAgICdHJzogNywgICAgICdBYmInOiA3LCAgICdGIyMnOiA3LCAgJ0Z4JzogNyxcbiAgICAnRyMnOiA4LCAgICAnQWInOiA4LFxuICAgICdBJzogOSwgICAgICdCYmInOiA5LCAgICdHIyMnOiA5LCAgJ0d4JzogOSxcbiAgICAnQSMnOiAxMCwgICAnQmInOiAxMCwgICAnQ2JiJzogMTAsXG4gICAgJ0InOiAxMSwgICAgJ0NiJzogMTEsICAgJ0EjIyc6IDExLCAnQXgnOiAxMVxufTsiLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBfc2V0SU8oIGlvICkge1xuICAgIHRoaXMuaW8gPSBpbztcbiAgICB0aGlzLmNvbnRleHQgPSBpby5jb250ZXh0O1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgT3NjaWxsYXRvckJhbmsgZnJvbSBcIi4uL29zY2lsbGF0b3JzL09zY2lsbGF0b3JCYW5rLmVzNlwiO1xuXG5jbGFzcyBGTU9zY2lsbGF0b3IgZXh0ZW5kcyBPc2NpbGxhdG9yQmFuayB7XG5cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoIHRoaXMgKTtcblxuICAgICAgICAvLyBGTS9tb2R1bGF0b3Igb3NjaWxsYXRvciBzZXR1cFxuICAgICAgICBncmFwaC5mbU9zY2lsbGF0b3IgPSB0aGlzLmlvLmNyZWF0ZU9zY2lsbGF0b3JCYW5rKCk7XG4gICAgICAgIGdyYXBoLmZtT3NjQW1vdW50ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguZm1Pc2NBbW91bnRNdWx0aXBsaWVyID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5mbU9zY0Ftb3VudC5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGguZm1Pc2NpbGxhdG9yLmNvbm5lY3QoIGdyYXBoLmZtT3NjQW1vdW50ICk7XG4gICAgICAgIGdyYXBoLmZtT3NjQW1vdW50LmNvbm5lY3QoIGdyYXBoLmZtT3NjQW1vdW50TXVsdGlwbGllciwgMCwgMCApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1GcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1GcmVxdWVuY3kuY29ubmVjdCggZ3JhcGguZm1Pc2NpbGxhdG9yLmNvbnRyb2xzLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtRnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmZtT3NjQW1vdW50TXVsdGlwbGllciwgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1XYXZlZm9ybSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mbVdhdmVmb3JtLmNvbm5lY3QoIGdyYXBoLmZtT3NjaWxsYXRvci5jb250cm9scy53YXZlZm9ybSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1Pc2NBbW91bnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1Pc2NBbW91bnQuY29ubmVjdCggZ3JhcGguZm1Pc2NBbW91bnQuZ2FpbiApO1xuXG5cbiAgICAgICAgLy8gU2VsZi1mbSBzZXR1cFxuICAgICAgICBncmFwaC5mbVNlbGZBbW91bnRzID0gW107XG4gICAgICAgIGdyYXBoLmZtU2VsZkFtb3VudE11bHRpcGxpZXJzID0gW107XG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1TZWxmQW1vdW50ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgZ3JhcGgub3NjaWxsYXRvcnMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgIFx0Ly8gQ29ubmVjdCBGTSBvc2NpbGxhdG9yIHRvIHRoZSBleGlzdGluZyBvc2NpbGxhdG9yc1xuICAgICAgICBcdC8vIGZyZXF1ZW5jeSBjb250cm9sLlxuICAgICAgICBcdGdyYXBoLmZtT3NjQW1vdW50TXVsdGlwbGllci5jb25uZWN0KCBncmFwaC5vc2NpbGxhdG9yc1sgaSBdLmZyZXF1ZW5jeSApO1xuXG5cbiAgICAgICAgXHQvLyBGb3IgZWFjaCBvc2NpbGxhdG9yIGluIHRoZSBvc2NpbGxhdG9yIGJhbmssXG4gICAgICAgIFx0Ly8gY3JlYXRlIGEgRk0tc2VsZiBHYWluTm9kZSwgYW5kIGNvbm5lY3QgdGhlIG9zY1xuICAgICAgICBcdC8vIHRvIGl0LCB0aGVuIGl0IHRvIHRoZSBvc2MncyBmcmVxdWVuY3kuXG4gICAgICAgIFx0Z3JhcGguZm1TZWxmQW1vdW50c1sgaSBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgXHRncmFwaC5mbVNlbGZBbW91bnRzWyBpIF0uZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgXHRncmFwaC5mbVNlbGZBbW91bnRNdWx0aXBsaWVyc1sgaSBdID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBcdGdyYXBoLmZtU2VsZkFtb3VudHNbIGkgXS5jb25uZWN0KCBncmFwaC5mbVNlbGZBbW91bnRNdWx0aXBsaWVyc1sgaSBdLCAwLCAwICk7XG4gICAgICAgIFx0dGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGguZm1TZWxmQW1vdW50TXVsdGlwbGllcnNbIGkgXSwgMCwgMSApO1xuXG4gICAgICAgIFx0Z3JhcGgub3NjaWxsYXRvcnNbIGkgXS5jb25uZWN0KCBncmFwaC5mbVNlbGZBbW91bnRzWyBpIF0gKTtcbiAgICAgICAgXHRncmFwaC5mbVNlbGZBbW91bnRNdWx0aXBsaWVyc1sgaSBdLmNvbm5lY3QoIGdyYXBoLm9zY2lsbGF0b3JzWyBpIF0uZnJlcXVlbmN5ICk7XG5cbiAgICAgICAgXHQvLyBNYWtlIHN1cmUgdGhlIEZNLXNlbGYgYW1vdW50IGlzIGNvbnRyb2xsYWJsZSB3aXRoIG9uZSBwYXJhbWV0ZXIuXG4gICAgICAgIFx0dGhpcy5jb250cm9scy5mbVNlbGZBbW91bnQuY29ubmVjdCggZ3JhcGguZm1TZWxmQW1vdW50c1sgaSBdLmdhaW4gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVGTU9zY2lsbGF0b3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEZNT3NjaWxsYXRvciggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuaW1wb3J0IG1hdGggZnJvbSBcIi4uL21peGlucy9tYXRoLmVzNlwiO1xuXG5cbnZhciBCVUZGRVJTID0gbmV3IFdlYWtNYXAoKTtcblxuY2xhc3MgTm9pc2VPc2NpbGxhdG9yIGV4dGVuZHMgTm9kZSB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCB0aGlzICksXG4gICAgICAgICAgICB0eXBlcyA9IHRoaXMuY29uc3RydWN0b3IudHlwZXMsXG4gICAgICAgICAgICB0eXBlS2V5cyA9IE9iamVjdC5rZXlzKCB0eXBlcyApLFxuICAgICAgICAgICAgYnVmZmVycyA9IHRoaXMuX2dldEJ1ZmZlcnMoKTtcblxuICAgICAgICBncmFwaC5idWZmZXJTb3VyY2VzID0gW107XG4gICAgICAgIGdyYXBoLm91dHB1dEdhaW4gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCBPYmplY3Qua2V5cyggdHlwZXMgKS5sZW5ndGgsIDAgKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0R2Fpbi5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IHR5cGVLZXlzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKSxcbiAgICAgICAgICAgICAgICBidWZmZXIgPSBidWZmZXJzWyB0eXBlS2V5c1sgaSBdIF07XG5cbiAgICAgICAgICAgIHNvdXJjZS5idWZmZXIgPSBidWZmZXI7XG4gICAgICAgICAgICBzb3VyY2UubG9vcCA9IHRydWU7XG4gICAgICAgICAgICBzb3VyY2Uuc3RhcnQoIDAgKTtcblxuICAgICAgICAgICAgc291cmNlLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXIsIDAsIGkgKTtcbiAgICAgICAgICAgIGdyYXBoLmJ1ZmZlclNvdXJjZXMucHVzaCggc291cmNlICk7XG4gICAgICAgIH1cblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyLmNvbm5lY3QoIGdyYXBoLm91dHB1dEdhaW4gKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0R2Fpbi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudHlwZSA9IGdyYXBoLmNyb3NzZmFkZXIuY29udHJvbHMuaW5kZXg7XG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgX2NyZWF0ZVNpbmdsZUJ1ZmZlciggdHlwZSApIHtcbiAgICAgICAgdmFyIHNhbXBsZVJhdGUgPSB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSxcbiAgICAgICAgICAgIGJ1ZmZlciA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIoIDEsIHNhbXBsZVJhdGUsIHNhbXBsZVJhdGUgKSxcbiAgICAgICAgICAgIGNoYW5uZWwgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIDAgKSxcbiAgICAgICAgICAgIGZuO1xuXG4gICAgICAgIHN3aXRjaCggdHlwZSApIHtcbiAgICAgICAgICAgIGNhc2UgJ1dISVRFJzpcbiAgICAgICAgICAgICAgICBmbiA9IE1hdGgucmFuZG9tO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdHQVVTU0lBTl9XSElURSc6XG4gICAgICAgICAgICAgICAgZm4gPSBtYXRoLm5yYW5kO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdQSU5LJzpcbiAgICAgICAgICAgICAgICBtYXRoLmdlbmVyYXRlUGlua051bWJlciggMTI4LCA1ICk7XG4gICAgICAgICAgICAgICAgZm4gPSBtYXRoLmdldE5leHRQaW5rTnVtYmVyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBzYW1wbGVSYXRlOyArK2kgKSB7XG4gICAgICAgICAgICBjaGFubmVsWyBpIF0gPSBmbigpICogMiAtIDE7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyggdHlwZSwgTWF0aC5taW4uYXBwbHkoIE1hdGgsIGNoYW5uZWwgKSwgTWF0aC5tYXguYXBwbHkoIE1hdGgsIGNoYW5uZWwgKSApO1xuXG4gICAgICAgIHJldHVybiBidWZmZXI7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUJ1ZmZlcnMoKSB7XG4gICAgICAgIHZhciBidWZmZXJzID0ge30sXG4gICAgICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMoIGJ1ZmZlcnMgKSxcbiAgICAgICAgICAgIHR5cGVzID0gdGhpcy5jb25zdHJ1Y3Rvci50eXBlcyxcbiAgICAgICAgICAgIHR5cGVLZXlzID0gT2JqZWN0LmtleXMoIHR5cGVzICksXG4gICAgICAgICAgICBidWZmZXI7XG5cbiAgICAgICAgLy8gQnVmZmVycyBhbHJlYWR5IGNyZWF0ZWQuIFN0b3AgaGVyZS5cbiAgICAgICAgaWYoIGtleXMubGVuZ3RoICE9PSAwICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0eXBlS2V5cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIGJ1ZmZlcnNbIHR5cGVLZXlzWyBpIF0gXSA9IHRoaXMuX2NyZWF0ZVNpbmdsZUJ1ZmZlciggdHlwZUtleXNbIGkgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2V0QnVmZmVycyggYnVmZmVycyApO1xuICAgIH1cblxuICAgIF9nZXRCdWZmZXJzKCkge1xuICAgICAgICB2YXIgYnVmZmVycyA9IEJVRkZFUlMuZ2V0KCB0aGlzLmlvICk7XG5cbiAgICAgICAgaWYoIGJ1ZmZlcnMgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZUJ1ZmZlcnMoKTtcbiAgICAgICAgICAgIGJ1ZmZlcnMgPSBCVUZGRVJTLmdldCggdGhpcy5pbyApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJ1ZmZlcnM7XG4gICAgfVxuXG4gICAgX3NldEJ1ZmZlcnMoIGJ1ZmZlcnMgKSB7XG4gICAgICAgIEJVRkZFUlMuc2V0KCB0aGlzLmlvLCBidWZmZXJzICk7XG4gICAgfVxuXG4gICAgc3RhcnQoIHRpbWUgKSB7XG4gICAgICAgIHZhciBvdXRwdXRHYWluID0gdGhpcy5nZXRHcmFwaCggdGhpcyApLm91dHB1dEdhaW47XG5cbiAgICAgICAgdGltZSA9IHRpbWUgfHwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lO1xuICAgICAgICBvdXRwdXRHYWluLmdhaW4udmFsdWUgPSAxO1xuICAgIH1cblxuICAgIHN0b3AoIHRpbWUgKSB7XG4gICAgICAgIHZhciBvdXRwdXRHYWluID0gdGhpcy5nZXRHcmFwaCggdGhpcyApLm91dHB1dEdhaW47XG5cbiAgICAgICAgdGltZSA9IHRpbWUgfHwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lO1xuICAgICAgICBvdXRwdXRHYWluLmdhaW4udmFsdWUgPSAwO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxufVxuXG5cbk5vaXNlT3NjaWxsYXRvci50eXBlcyA9IHtcbiAgICBXSElURTogMCxcbiAgICBHQVVTU0lBTl9XSElURTogMSxcbiAgICBQSU5LOiAyXG59O1xuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5vaXNlT3NjaWxsYXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTm9pc2VPc2NpbGxhdG9yKCB0aGlzICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG52YXIgT1NDSUxMQVRPUl9UWVBFUyA9IFtcbiAgICAnc2luZScsXG4gICAgJ3RyaWFuZ2xlJyxcbiAgICAnc2F3dG9vdGgnLFxuICAgICdzcXVhcmUnXG5dO1xuXG5jbGFzcyBPc2NpbGxhdG9yQmFuayBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIE9TQ0lMTEFUT1JfVFlQRVMubGVuZ3RoLCAwICk7XG4gICAgICAgIGdyYXBoLm9zY2lsbGF0b3JzID0gW107XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZGV0dW5lID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLndhdmVmb3JtID0gZ3JhcGguY3Jvc3NmYWRlci5jb250cm9scy5pbmRleDtcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IE9TQ0lMTEFUT1JfVFlQRVMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB2YXIgb3NjID0gdGhpcy5jb250ZXh0LmNyZWF0ZU9zY2lsbGF0b3IoKTtcblxuICAgICAgICAgICAgb3NjLnR5cGUgPSBPU0NJTExBVE9SX1RZUEVTWyBpIF07XG4gICAgICAgICAgICBvc2MuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgICAgIG9zYy5zdGFydCggMCApO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBvc2MuZnJlcXVlbmN5ICk7XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmRldHVuZS5jb25uZWN0KCBvc2MuZGV0dW5lICk7XG4gICAgICAgICAgICBvc2MuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlciwgMCwgaSApO1xuXG4gICAgICAgICAgICBncmFwaC5vc2NpbGxhdG9ycy5wdXNoKCBvc2MgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0TGV2ZWwuZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlci5jb25uZWN0KCBncmFwaC5vdXRwdXRMZXZlbCApO1xuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgc3RhcnQoIGRlbGF5ID0gMCApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAxO1xuICAgIH1cblxuICAgIHN0b3AoIGRlbGF5ID0gMCApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAwO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlT3NjaWxsYXRvckJhbmsgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9zY2lsbGF0b3JCYW5rKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBPc2NpbGxhdG9yQmFuazsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBTaW5lQmFuayBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtU2luZXMgPSA0ICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgub3NjaWxsYXRvcnMgPSBbXTtcbiAgICAgICAgZ3JhcGguaGFybW9uaWNNdWx0aXBsaWVycyA9IFtdO1xuICAgICAgICBncmFwaC5udW1TaW5lcyA9IG51bVNpbmVzO1xuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAxIC8gbnVtU2luZXM7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZGV0dW5lID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhhcm1vbmljcyA9IFtdO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG51bVNpbmVzOyArK2kgKSB7XG4gICAgICAgICAgICB2YXIgb3NjID0gdGhpcy5jb250ZXh0LmNyZWF0ZU9zY2lsbGF0b3IoKSxcbiAgICAgICAgICAgICAgICBoYXJtb25pY0NvbnRyb2wgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCksXG4gICAgICAgICAgICAgICAgaGFybW9uaWNNdWx0aXBsaWVyID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgICAgICBvc2MudHlwZSA9ICdzaW5lJztcbiAgICAgICAgICAgIG9zYy5mcmVxdWVuY3kudmFsdWUgPSAwO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBoYXJtb25pY011bHRpcGxpZXIsIDAsIDAgKTtcbiAgICAgICAgICAgIGhhcm1vbmljQ29udHJvbC5jb25uZWN0KCBoYXJtb25pY011bHRpcGxpZXIsIDAsIDEgKTtcbiAgICAgICAgICAgIGhhcm1vbmljTXVsdGlwbGllci5jb25uZWN0KCBvc2MuZnJlcXVlbmN5ICk7XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmRldHVuZS5jb25uZWN0KCBvc2MuZGV0dW5lICk7XG5cbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuaGFybW9uaWNzWyBpIF0gPSBoYXJtb25pY0NvbnRyb2w7XG5cbiAgICAgICAgICAgIG9zYy5zdGFydCggMCApO1xuICAgICAgICAgICAgb3NjLmNvbm5lY3QoIGdyYXBoLm91dHB1dExldmVsICk7XG4gICAgICAgICAgICBncmFwaC5vc2NpbGxhdG9ycy5wdXNoKCBvc2MgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBzdGFydCggZGVsYXkgPSAwICkge1xuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAxIC8gZ3JhcGgubnVtU2luZXM7XG4gICAgfVxuXG4gICAgc3RvcCggZGVsYXkgPSAwICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkub3V0cHV0TGV2ZWwuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTaW5lQmFuayA9IGZ1bmN0aW9uKCBudW1TaW5lcyApIHtcbiAgICByZXR1cm4gbmV3IFNpbmVCYW5rKCB0aGlzLCBudW1TaW5lcyApO1xufTtcblxuZXhwb3J0XG5kZWZhdWx0IFNpbmVCYW5rOyJdfQ==
