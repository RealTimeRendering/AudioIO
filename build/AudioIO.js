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

},{"../mixins/conversions.es6":66,"../mixins/math.es6":67,"./config.es6":5,"./overrides.es6":6,"./signalCurves.es6":7}],2:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":64,"../mixins/connections.es6":65,"../mixins/setIO.es6":71,"./AudioIO.es6":1}],3:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":64,"../mixins/connections.es6":65,"../mixins/setIO.es6":71,"./AudioIO.es6":1}],4:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":64,"../mixins/connections.es6":65,"../mixins/setIO.es6":71,"./AudioIO.es6":1}],5:[function(require,module,exports){
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
        originalAudioNodeDisconnect = AudioNode.prototype.disconnect;

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

module.exports = signalCurves;

},{"../mixins/Math.es6":63,"./config.es6":5}],8:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/config.es6":5,"../mixins/setIO.es6":71}],10:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../graphs/DryWetNode.es6":19}],11:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../graphs/DryWetNode.es6":19,"../mixins/cleaners.es6":64,"../mixins/connections.es6":65,"../mixins/setIO.es6":71,"./Delay.es6":10}],12:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],13:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../graphs/DryWetNode.es6":19}],14:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],15:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],16:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../mixins/setIO.es6":71}],17:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],18:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],19:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/cleaners.es6":64,"../mixins/connections.es6":65,"../mixins/setIO.es6":71}],20:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],21:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],22:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/math.es6":67}],23:[function(require,module,exports){
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

require('./math/relational-operators/IfElse.es6');

require('./math/relational-operators/LessThan.es6');

require('./math/relational-operators/LessThanZero.es6');

require('./math/logical-operators/LogicalOperator.es6');

require('./math/logical-operators/AND.es6');

require('./math/logical-operators/OR.es6');

require('./math/logical-operators/NOT.es6');

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

},{"./core/AudioIO.es6":1,"./core/Node.es6":2,"./core/Param.es6":3,"./core/WaveShaper.es6":4,"./envelopes/ASDREnvelope.es6":8,"./envelopes/CustomEnvelope.es6":9,"./fx/Delay.es6":10,"./fx/PingPongDelay.es6":11,"./fx/SchroederAllPass.es6":12,"./fx/SineShaper.es6":13,"./fx/StereoRotation.es6":14,"./fx/StereoWidth.es6":15,"./generators/OscillatorGenerator.es6":16,"./graphs/Counter.es6":17,"./graphs/Crossfader.es6":18,"./graphs/DryWetNode.es6":19,"./graphs/EQShelf.es6":20,"./graphs/PhaseOffset.es6":21,"./instruments/GeneratorPlayer.es6":22,"./math/Abs.es6":24,"./math/Add.es6":25,"./math/Average.es6":26,"./math/Clamp.es6":27,"./math/Constant.es6":28,"./math/Divide.es6":29,"./math/Floor.es6":30,"./math/Lerp.es6":31,"./math/Max.es6":32,"./math/Min.es6":33,"./math/Multiply.es6":34,"./math/Negate.es6":35,"./math/Pow.es6":36,"./math/Reciprocal.es6":37,"./math/Round.es6":38,"./math/SampleDelay.es6":39,"./math/Scale.es6":40,"./math/ScaleExp.es6":41,"./math/Sign.es6":42,"./math/Sqrt.es6":43,"./math/Square.es6":44,"./math/Subtract.es6":45,"./math/Switch.es6":46,"./math/logical-operators/AND.es6":47,"./math/logical-operators/LogicalOperator.es6":48,"./math/logical-operators/NOT.es6":49,"./math/logical-operators/OR.es6":50,"./math/relational-operators/EqualTo.es6":51,"./math/relational-operators/EqualToZero.es6":52,"./math/relational-operators/GreaterThan.es6":53,"./math/relational-operators/GreaterThanZero.es6":54,"./math/relational-operators/IfElse.es6":55,"./math/relational-operators/LessThan.es6":56,"./math/relational-operators/LessThanZero.es6":57,"./math/trigonometry/Cos.es6":58,"./math/trigonometry/DegToRad.es6":59,"./math/trigonometry/RadToDeg.es6":60,"./math/trigonometry/Sin.es6":61,"./math/trigonometry/Tan.es6":62,"./oscillators/FMOscillator.es6":72,"./oscillators/NoiseOscillator.es6":73,"./oscillators/OscillatorBank.es6":74,"./oscillators/SineBank.es6":75}],24:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],25:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],26:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],27:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],28:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],29:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],30:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],31:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],32:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],33:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],35:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],37:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],38:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],39:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var SampleDelay = (function (_Node) {

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function SampleDelay(io, numSamples) {
        _classCallCheck(this, SampleDelay);

        _Node.call(this, io, 1, 1);

        var graph = this.getGraph();

        graph.sampleSize = this.io.createConstant(1 / this.context.sampleRate);
        graph.multiply = this.io.createMultiply();
        this.controls.samples = this.io.createParam(numSamples);

        graph.sampleSize.connect(graph.multiply, 0, 0);
        this.controls.samples.connect(graph.multiply, 0, 1);

        graph.delay = this.context.createDelay();
        graph.delay.delayTime.value = 0;
        graph.multiply.connect(graph.delay.delayTime);
        this.inputs[0].connect(graph.delay);
        graph.delay.connect(this.outputs[0]);

        this.setGraph(graph);
    }

    _inherits(SampleDelay, _Node);

    _createClass(SampleDelay, [{
        key: "samples",
        get: function get() {
            return this.controls.samples.value;
        },
        set: function set(value) {
            this.controls.samples.value = value;
        }
    }]);

    return SampleDelay;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSampleDelay = function (numSamples) {
    return new SampleDelay(this, numSamples);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],40:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],41:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],42:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],43:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],44:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],45:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],46:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],47:[function(require,module,exports){
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

exports["default"] = AND;

AudioIO.prototype.createAND = function () {
    return new AND(this);
};
module.exports = exports["default"];

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":48}],48:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],49:[function(require,module,exports){
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

exports["default"] = NOT;

AudioIO.prototype.createNOT = function () {
    return new NOT(this);
};
module.exports = exports["default"];

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":48}],50:[function(require,module,exports){
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

exports["default"] = OR;

AudioIO.prototype.createOR = function () {
    return new OR(this);
};
module.exports = exports["default"];

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":48}],51:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],52:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2,"./EqualTo.es6":51}],53:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],54:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],55:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],56:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],57:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],58:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],59:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],60:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],61:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],62:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],63:[function(require,module,exports){
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

},{"../core/config.es6":5}],64:[function(require,module,exports){
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

},{}],65:[function(require,module,exports){
'use strict';

exports.__esModule = true;
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
    }
};
module.exports = exports['default'];

},{}],66:[function(require,module,exports){
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

},{"../core/config.es6":5,"./math.es6":67,"./noteRegExp.es6":68,"./noteStrings.es6":69,"./notes.es6":70}],67:[function(require,module,exports){
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

},{"../core/config.es6":5}],68:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = /^([A|B|C|D|E|F|G]{1})([#bx]{0,2})([\-\+]?\d+)?([\+|\-]{1}\d*.\d*)?/;
module.exports = exports["default"];

},{}],69:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
module.exports = exports['default'];

},{}],70:[function(require,module,exports){
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

},{}],71:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = _setIO;

function _setIO(io) {
    this.io = io;
    this.context = io.context;
}

;
module.exports = exports["default"];

},{}],72:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../oscillators/OscillatorBank.es6":74}],73:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/math.es6":67}],74:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],75:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}]},{},[23])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9jb3JlL0F1ZGlvSU8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvY29yZS9Ob2RlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvUGFyYW0uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvY29yZS9XYXZlU2hhcGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvY29uZmlnLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvb3ZlcnJpZGVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvc2lnbmFsQ3VydmVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2VudmVsb3Blcy9BU0RSRW52ZWxvcGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZW52ZWxvcGVzL0N1c3RvbUVudmVsb3BlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L0RlbGF5LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L1BpbmdQb25nRGVsYXkuZXM2LmpzIiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZngvU2Nocm9lZGVyQWxsUGFzcy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9meC9TaW5lU2hhcGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L1N0ZXJlb1JvdGF0aW9uLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L1N0ZXJlb1dpZHRoLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dlbmVyYXRvcnMvT3NjaWxsYXRvckdlbmVyYXRvci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9ncmFwaHMvQ291bnRlci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9ncmFwaHMvQ3Jvc3NmYWRlci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9ncmFwaHMvRHJ5V2V0Tm9kZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9ncmFwaHMvRVFTaGVsZi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9ncmFwaHMvUGhhc2VPZmZzZXQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvaW5zdHJ1bWVudHMvR2VuZXJhdG9yUGxheWVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21haW4uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9BYnMuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9BZGQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9BdmVyYWdlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvQ2xhbXAuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9Db25zdGFudC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0RpdmlkZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0Zsb29yLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvTGVycC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL01heC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL01pbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL011bHRpcGx5LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvTmVnYXRlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvUG93LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvUmVjaXByb2NhbC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1JvdW5kLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU2FtcGxlRGVsYXkuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TY2FsZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1NjYWxlRXhwLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU2lnbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1NxcnQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TcXVhcmUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TdWJ0cmFjdC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1N3aXRjaC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL0FORC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL0xvZ2ljYWxPcGVyYXRvci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL05PVC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL09SLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUby5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0VxdWFsVG9aZXJvLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvR3JlYXRlclRoYW4uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhblplcm8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9JZkVsc2UuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuWmVyby5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9Db3MuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC90cmlnb25vbWV0cnkvRGVnVG9SYWQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC90cmlnb25vbWV0cnkvUmFkVG9EZWcuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC90cmlnb25vbWV0cnkvU2luLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L1Rhbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvTWF0aC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvY2xlYW5lcnMuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9jb252ZXJzaW9ucy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvbWF0aC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvbm90ZVJlZ0V4cC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvbm90ZVN0cmluZ3MuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL25vdGVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9zZXRJTy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9vc2NpbGxhdG9ycy9GTU9zY2lsbGF0b3IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvb3NjaWxsYXRvcnMvTm9pc2VPc2NpbGxhdG9yLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL29zY2lsbGF0b3JzL09zY2lsbGF0b3JCYW5rLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL29zY2lsbGF0b3JzL1NpbmVCYW5rLmVzNiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7eUJDQW1CLGNBQWM7Ozs7UUFDMUIs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SSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLFVBQVUsQ0FBRSxDQUFDO0FBQzdDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxVQUFVLENBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLFNBQVMsQ0FBRSxDQUFDO0FBQzVDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxRQUFRLENBQUUsQ0FBQztBQUM1QyxhQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVwQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFFLENBQUM7OztBQUd6QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzlDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxF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QyxhQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLENBQUMsV0FBVyxDQUFFLENBQUM7QUFDL0MsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxVQUFVLENBQUUsQ0FBQztBQUM3QyxhQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDNUMsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLENBQUUsQ0FBQzs7QUFFcEMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDOzs7QUFHekMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc5QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxZQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNoRCxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFN0MsWUFBSSxDQUFDLFFBQVEs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QyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7S0FDckQ7O0FBNUNDLFlBQVEsV0E4Q1YsSUFBSSxHQUFBLGdCQUFjO1lBQVosS0FBSyxnQ0FBRyxDQUFDOztBQUNYLFlBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7S0FDOUM7O1dBaERDLFFBQVE7OztBQW1EZCw0QkFBUSxTQUFTLENBQUMsY0FBYyxHQUFHLFVBQVUsUUFBUSxFQUFHO0FBQ3BELFdBQU8sSUFBSSxRQUFRLENBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBRSxDQUFDO0NBQ3pDLENBQUM7O3FCQUdNLFFBQVEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IENPTkZJRyBmcm9tICcuL2NvbmZpZy5lczYnO1xuaW1wb3J0ICcuL292ZXJyaWRlcy5lczYnO1xuaW1wb3J0IHNpZ25hbEN1cnZlcyBmcm9tICcuL3NpZ25hbEN1cnZlcy5lczYnO1xuaW1wb3J0IGNvbnZlcnNpb25zIGZyb20gJy4uL21peGlucy9jb252ZXJzaW9ucy5lczYnO1xuaW1wb3J0IG1hdGggZnJvbSAnLi4vbWl4aW5zL21hdGguZXM2JztcblxuY2xhc3MgQXVkaW9JTyB7XG5cbiAgICBzdGF0aWMgbWl4aW4oIHRhcmdldCwgc291cmNlICkge1xuICAgICAgICBmb3IgKCBsZXQgaSBpbiBzb3VyY2UgKSB7XG4gICAgICAgICAgICBpZiAoIHNvdXJjZS5oYXNPd25Qcm9wZXJ0eSggaSApICkge1xuICAgICAgICAgICAgICAgIHRhcmdldFsgaSBdID0gc291cmNlWyBpIF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgbWl4aW5TaW5nbGUoIHRhcmdldCwgc291cmNlLCBuYW1lICkge1xuICAgICAgICB0YXJnZXRbIG5hbWUgXSA9IHNvdXJjZTtcbiAgICB9XG5cblxuICAgIGNvbnN0cnVjdG9yKCBjb250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpICkge1xuICAgICAgICB0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcblxuICAgICAgICB0aGlzLm1hc3RlciA9IHRoaXMuX2NvbnRleHQuZGVzdGluYXRpb247XG5cbiAgICAgICAgLy8gQ3JlYXRlIGFuIGFsd2F5cy1vbiAnZHJpdmVyJyBub2RlIHRoYXQgY29uc3RhbnRseSBvdXRwdXRzIGEgdmFsdWVcbiAgICAgICAgLy8gb2YgMS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gSXQncyB1c2VkIGJ5IGEgZmFpciBmZXcgbm9kZXMsIHNvIG1ha2VzIHNlbnNlIHRvIHVzZSB0aGUgc2FtZVxuICAgICAgICAvLyBkcml2ZXIsIHJhdGhlciB0aGFuIHNwYW1taW5nIGEgYnVuY2ggb2YgV2F2ZVNoYXBlck5vZGVzIGFsbCBhYm91dFxuICAgICAgICAvLyB0aGUgcGxhY2UuIEl0IGNhbid0IGJlIGRlbGV0ZWQsIHNvIG5vIHdvcnJpZXMgYWJvdXQgYnJlYWtpbmdcbiAgICAgICAgLy8gZnVuY3Rpb25hbGl0eSBvZiBub2RlcyB0aGF0IGRvIHVzZSBpdCBzaG91bGQgaXQgYXR0ZW1wdCB0byBiZVxuICAgICAgICAvLyBvdmVyd3JpdHRlbi5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCB0aGlzLCAnY29uc3RhbnREcml2ZXInLCB7XG4gICAgICAgICAgICB3cml0ZWFibGU6IGZhbHNlLFxuICAgICAgICAgICAgZ2V0OiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGxldCBjb25zdGFudERyaXZlcjtcblxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhY29uc3RhbnREcml2ZXIgfHwgY29uc3RhbnREcml2ZXIuY29udGV4dCAhPT0gdGhpcy5jb250ZXh0ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3RhbnREcml2ZXIgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29udGV4dCA9IHRoaXMuY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSBjb250ZXh0LmNyZWF0ZUJ1ZmZlciggMSwgNDA5NiwgY29udGV4dC5zYW1wbGVSYXRlICksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyRGF0YSA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSggMCApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlclNvdXJjZSA9IGNvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGJ1ZmZlckRhdGEubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyRGF0YVsgaSBdID0gMS4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3IoIGxldCBidWZmZXJWYWx1ZSBvZiBidWZmZXJEYXRhICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGJ1ZmZlclZhbHVlID0gMS4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJTb3VyY2UuYnVmZmVyID0gYnVmZmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyU291cmNlLmxvb3AgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyU291cmNlLnN0YXJ0KCAwICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0YW50RHJpdmVyID0gYnVmZmVyU291cmNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnN0YW50RHJpdmVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0oKSApXG4gICAgICAgIH0gKTtcbiAgICB9XG5cblxuXG4gICAgZ2V0IGNvbnRleHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0O1xuICAgIH1cblxuICAgIHNldCBjb250ZXh0KCBjb250ZXh0ICkge1xuICAgICAgICBpZiAoICEoIGNvbnRleHQgaW5zdGFuY2VvZiBBdWRpb0NvbnRleHQgKSApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggXCJJbnZhbGlkIGF1ZGlvIGNvbnRleHQgZ2l2ZW46XCIgKyBjb250ZXh0ICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5tYXN0ZXIgPSBjb250ZXh0LmRlc3RpbmF0aW9uO1xuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggQXVkaW9JTy5wcm90b3R5cGUsIHNpZ25hbEN1cnZlcywgJ2N1cnZlcycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIEF1ZGlvSU8ucHJvdG90eXBlLCBjb252ZXJzaW9ucywgJ2NvbnZlcnQnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBBdWRpb0lPLnByb3RvdHlwZSwgbWF0aCwgJ21hdGgnICk7XG5cblxuXG53aW5kb3cuQXVkaW9JTyA9IEF1ZGlvSU87XG5leHBvcnQgZGVmYXVsdCBBdWRpb0lPOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5pbXBvcnQgY29ubmVjdGlvbnMgZnJvbSBcIi4uL21peGlucy9jb25uZWN0aW9ucy5lczZcIjtcbmltcG9ydCBjbGVhbmVycyBmcm9tIFwiLi4vbWl4aW5zL2NsZWFuZXJzLmVzNlwiO1xuXG52YXIgZ3JhcGhzID0gbmV3IFdlYWtNYXAoKTtcblxuY2xhc3MgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1JbnB1dHMgPSAwLCBudW1PdXRwdXRzID0gMCApIHtcbiAgICAgICAgdGhpcy5fc2V0SU8oIGlvICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHMgPSBbXTtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gW107XG5cbiAgICAgICAgLy8gVGhpcyBvYmplY3Qgd2lsbCBob2xkIGFueSB2YWx1ZXMgdGhhdCBjYW4gYmVcbiAgICAgICAgLy8gY29udHJvbGxlZCB3aXRoIGF1ZGlvIHNpZ25hbHMuXG4gICAgICAgIHRoaXMuY29udHJvbHMgPSB7fTtcblxuICAgICAgICAvLyBCb3RoIHRoZXNlIG9iamVjdHMgd2lsbCBqdXN0IGhvbGQgcmVmZXJlbmNlc1xuICAgICAgICAvLyB0byBlaXRoZXIgaW5wdXQgb3Igb3V0cHV0IG5vZGVzLiBIYW5keSB3aGVuXG4gICAgICAgIC8vIHdhbnRpbmcgdG8gY29ubmVjdCBzcGVjaWZpYyBpbnMvb3V0cyB3aXRob3V0XG4gICAgICAgIC8vIGhhdmluZyB0byB1c2UgdGhlIGAuY29ubmVjdCggLi4uLCAwLCAxIClgIHN5bnRheC5cbiAgICAgICAgdGhpcy5uYW1lZElucHV0cyA9IHt9O1xuICAgICAgICB0aGlzLm5hbWVkT3V0cHV0cyA9IHt9O1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG51bUlucHV0czsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5hZGRJbnB1dENoYW5uZWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgbnVtT3V0cHV0czsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5hZGRPdXRwdXRDaGFubmVsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRHcmFwaCggZ3JhcGggKSB7XG4gICAgICAgIGdyYXBocy5zZXQoIHRoaXMsIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0R3JhcGgoKSB7XG4gICAgICAgIHJldHVybiBncmFwaHMuZ2V0KCB0aGlzICkgfHwge307XG4gICAgfVxuXG4gICAgYWRkSW5wdXRDaGFubmVsKCkge1xuICAgICAgICB0aGlzLmlucHV0cy5wdXNoKCB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpICk7XG4gICAgfVxuXG4gICAgYWRkT3V0cHV0Q2hhbm5lbCgpIHtcbiAgICAgICAgdGhpcy5vdXRwdXRzLnB1c2goIHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCkgKTtcbiAgICB9XG5cbiAgICBfY2xlYW5VcFNpbmdsZSggaXRlbSwgcGFyZW50LCBrZXkgKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAvLyBIYW5kbGUgYXJyYXlzIGJ5IGxvb3Bpbmcgb3ZlciB0aGVtXG4gICAgICAgIC8vIGFuZCByZWN1cnNpdmVseSBjYWxsaW5nIHRoaXMgZnVuY3Rpb24gd2l0aCBlYWNoXG4gICAgICAgIC8vIGFycmF5IG1lbWJlci5cbiAgICAgICAgaWYoIEFycmF5LmlzQXJyYXkoIGl0ZW0gKSApIHtcbiAgICAgICAgICAgIGl0ZW0uZm9yRWFjaChmdW5jdGlvbiggbm9kZSwgaW5kZXggKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fY2xlYW5VcFNpbmdsZSggbm9kZSwgaXRlbSwgaW5kZXggKTtcbiAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgcGFyZW50WyBrZXkgXSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdWRpb0lPIG5vZGVzLi4uXG4gICAgICAgIGVsc2UgaWYoIGl0ZW0gJiYgdHlwZW9mIGl0ZW0uY2xlYW5VcCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgaXRlbS5kaXNjb25uZWN0ID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgIGl0ZW0uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpdGVtLmNsZWFuVXAoKTtcblxuICAgICAgICAgICAgaWYoIHBhcmVudCApIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRbIGtleSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFwiTmF0aXZlXCIgbm9kZXMuXG4gICAgICAgIGVsc2UgaWYoIGl0ZW0gJiYgdHlwZW9mIGl0ZW0uZGlzY29ubmVjdCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgIGl0ZW0uZGlzY29ubmVjdCgpO1xuXG4gICAgICAgICAgICBpZiggcGFyZW50ICkge1xuICAgICAgICAgICAgICAgIHBhcmVudFsga2V5IF0gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuICAgICAgICB0aGlzLl9jbGVhblVwSW5PdXRzKCk7XG4gICAgICAgIHRoaXMuX2NsZWFuSU8oKTtcblxuICAgICAgICAvLyBGaW5kIGFueSBub2RlcyBhdCB0aGUgdG9wIGxldmVsLFxuICAgICAgICAvLyBkaXNjb25uZWN0IGFuZCBudWxsaWZ5IHRoZW0uXG4gICAgICAgIGZvciggdmFyIGkgaW4gdGhpcyApIHtcbiAgICAgICAgICAgIHRoaXMuX2NsZWFuVXBTaW5nbGUoIHRoaXNbIGkgXSwgdGhpcywgaSApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRG8gdGhlIHNhbWUgZm9yIGFueSBub2RlcyBpbiB0aGUgZ3JhcGguXG4gICAgICAgIGZvciggdmFyIGkgaW4gZ3JhcGggKSB7XG4gICAgICAgICAgICB0aGlzLl9jbGVhblVwU2luZ2xlKCBncmFwaFsgaSBdLCBncmFwaCwgaSApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gLi4uYW5kIHRoZSBzYW1lIGZvciBhbnkgY29udHJvbCBub2Rlcy5cbiAgICAgICAgZm9yKCB2YXIgaSBpbiB0aGlzLmNvbnRyb2xzICkge1xuICAgICAgICAgICAgdGhpcy5fY2xlYW5VcFNpbmdsZSggdGhpcy5jb250cm9sc1sgaSBdLCB0aGlzLmNvbnRyb2xzLCBpICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGaW5hbGx5LCBhdHRlbXB0IHRvIGRpc2Nvbm5lY3QgdGhpcyBOb2RlLlxuICAgICAgICBpZiggdHlwZW9mIHRoaXMuZGlzY29ubmVjdCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgbnVtYmVyT2ZJbnB1dHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlucHV0cy5sZW5ndGg7XG4gICAgfVxuICAgIGdldCBudW1iZXJPZk91dHB1dHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm91dHB1dHMubGVuZ3RoO1xuICAgIH1cblxuICAgIGdldCBpbnB1dFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHMubGVuZ3RoID8gdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlIDogbnVsbDtcbiAgICB9XG4gICAgc2V0IGlucHV0VmFsdWUoIHZhbHVlICkge1xuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmlucHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IHRoaXMuaW52ZXJ0SW5wdXRQaGFzZSA/IC12YWx1ZSA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IG91dHB1dFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzLmxlbmd0aCA/IHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgOiBudWxsO1xuICAgIH1cbiAgICBzZXQgb3V0cHV0VmFsdWUoIHZhbHVlICkge1xuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLm91dHB1dHMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIGkgXS5nYWluLnZhbHVlID0gdGhpcy5pbnZlcnRPdXRwdXRQaGFzZSA/IC12YWx1ZSA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGludmVydElucHV0UGhhc2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlucHV0cy5sZW5ndGggP1xuICAgICAgICAgICAgKCB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPCAwICkgOlxuICAgICAgICAgICAgbnVsbDtcbiAgICB9XG4gICAgc2V0IGludmVydElucHV0UGhhc2UoIGludmVydGVkICkge1xuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGlucHV0LCB2OyBpIDwgdGhpcy5pbnB1dHMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICBpbnB1dCA9IHRoaXMuaW5wdXRzWyBpIF0uZ2FpbjtcbiAgICAgICAgICAgIHYgPSBpbnB1dC52YWx1ZTtcbiAgICAgICAgICAgIGlucHV0LnZhbHVlID0gdiA8IDAgPyAoIGludmVydGVkID8gdiA6IC12ICkgOiAoIGludmVydGVkID8gLXYgOiB2ICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgaW52ZXJ0T3V0cHV0UGhhc2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm91dHB1dHMubGVuZ3RoID9cbiAgICAgICAgICAgICggdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA8IDAgKSA6XG4gICAgICAgICAgICBudWxsO1xuICAgIH1cblxuICAgIC8vIFRPRE86XG4gICAgLy8gIC0gc2V0VmFsdWVBdFRpbWU/XG4gICAgc2V0IGludmVydE91dHB1dFBoYXNlKCBpbnZlcnRlZCApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCB2OyBpIDwgdGhpcy5vdXRwdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdiA9IHRoaXMub3V0cHV0c1sgaSBdLmdhaW4udmFsdWU7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIGkgXS5nYWluLnZhbHVlID0gdiA8IDAgPyAoIGludmVydGVkID8gdiA6IC12ICkgOiAoIGludmVydGVkID8gLXYgOiB2ICk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIE5vZGUucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBOb2RlLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5VcEluT3V0cywgJ19jbGVhblVwSW5PdXRzJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggTm9kZS5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuSU8sICdfY2xlYW5JTycgKTtcbkF1ZGlvSU8ubWl4aW4oIE5vZGUucHJvdG90eXBlLCBjb25uZWN0aW9ucyApO1xuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5vZGUgPSBmdW5jdGlvbiggbnVtSW5wdXRzLCBudW1PdXRwdXRzICkge1xuICAgIHJldHVybiBuZXcgTm9kZSggdGhpcywgbnVtSW5wdXRzLCBudW1PdXRwdXRzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOb2RlOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5pbXBvcnQgY29ubmVjdGlvbnMgZnJvbSBcIi4uL21peGlucy9jb25uZWN0aW9ucy5lczZcIjtcbmltcG9ydCBjbGVhbmVycyBmcm9tIFwiLi4vbWl4aW5zL2NsZWFuZXJzLmVzNlwiO1xuXG5cbmNsYXNzIFBhcmFtIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlLCBkZWZhdWx0VmFsdWUgKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gdGhpcy5vdXRwdXRzID0gWyB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpIF07XG4gICAgICAgIHRoaXMuX2NvbnRyb2wgPSB0aGlzLmlucHV0c1sgMCBdO1xuXG4gICAgICAgIC8vIEhtbS4uLiBIYWQgdG8gcHV0IHRoaXMgaGVyZSBzbyBOb3RlIHdpbGwgYmUgYWJsZVxuICAgICAgICAvLyB0byByZWFkIHRoZSB2YWx1ZS4uLlxuICAgICAgICAvLyBUT0RPOlxuICAgICAgICAvLyAgLSBTaG91bGQgSSBjcmVhdGUgYSBgLl92YWx1ZWAgcHJvcGVydHkgdGhhdCB3aWxsXG4gICAgICAgIC8vICAgIHN0b3JlIHRoZSB2YWx1ZXMgdGhhdCB0aGUgUGFyYW0gc2hvdWxkIGJlIHJlZmxlY3RpbmdcbiAgICAgICAgLy8gICAgKGZvcmdldHRpbmcsIG9mIGNvdXJzZSwgdGhhdCBhbGwgdGhlICpWYWx1ZUF0VGltZSBbZXRjLl1cbiAgICAgICAgLy8gICAgZnVuY3Rpb25zIGFyZSBmdW5jdGlvbnMgb2YgdGltZTsgYC5fdmFsdWVgIHByb3Agd291bGQgYmVcbiAgICAgICAgLy8gICAgc2V0IGltbWVkaWF0ZWx5LCB3aGlsc3QgdGhlIHJlYWwgdmFsdWUgd291bGQgYmUgcmFtcGluZylcbiAgICAgICAgLy9cbiAgICAgICAgLy8gIC0gT3IsIHNob3VsZCBJIGNyZWF0ZSBhIGAuX3ZhbHVlYCBwcm9wZXJ0eSB0aGF0IHdpbGxcbiAgICAgICAgLy8gICAgdHJ1ZWx5IHJlZmxlY3QgdGhlIGludGVybmFsIHZhbHVlIG9mIHRoZSBHYWluTm9kZT8gV2lsbFxuICAgICAgICAvLyAgICByZXF1aXJlIE1BRkZTLi4uXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyA/IHZhbHVlIDogMS4wO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4udmFsdWUgPSB0aGlzLl92YWx1ZTtcblxuICAgICAgICB0aGlzLnNldFZhbHVlQXRUaW1lKCB0aGlzLl92YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgICAgIHRoaXMuZGVmYXVsdFZhbHVlID0gdHlwZW9mIGRlZmF1bHRWYWx1ZSA9PT0gJ251bWJlcicgPyBkZWZhdWx0VmFsdWUgOiB0aGlzLl9jb250cm9sLmdhaW4uZGVmYXVsdFZhbHVlO1xuXG5cbiAgICAgICAgLy8gVE9ETzpcbiAgICAgICAgLy8gIC0gU2hvdWxkIHRoZSBkcml2ZXIgYWx3YXlzIGJlIGNvbm5lY3RlZD9cbiAgICAgICAgLy8gIC0gTm90IHN1cmUgd2hldGhlciBQYXJhbSBzaG91bGQgb3V0cHV0IDAgaWYgdmFsdWUgIT09IE51bWJlci5cbiAgICAgICAgaWYgKCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5pby5jb25zdGFudERyaXZlci5jb25uZWN0KCB0aGlzLl9jb250cm9sICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5kZWZhdWx0VmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHRoaXMuX2NsZWFuVXBJbk91dHMoKTtcbiAgICAgICAgdGhpcy5fY2xlYW5JTygpO1xuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wgPSBudWxsO1xuICAgICAgICB0aGlzLmRlZmF1bHRWYWx1ZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgfVxuXG4gICAgc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHN0YXJ0VGltZSApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBsaW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggdmFsdWUsIGVuZFRpbWUgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggdmFsdWUsIGVuZFRpbWUgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSggdmFsdWUsIGVuZFRpbWUgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKCB2YWx1ZSwgZW5kVGltZSApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRUYXJnZXRBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUsIHRpbWVDb25zdGFudCApIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLnNldFRhcmdldEF0VGltZSggdmFsdWUsIHN0YXJ0VGltZSwgdGltZUNvbnN0YW50ICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFZhbHVlQ3VydmVBdFRpbWUoIHZhbHVlcywgc3RhcnRUaW1lLCBkdXJhdGlvbiApIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLnNldFZhbHVlQ3VydmVBdFRpbWUoIHZhbHVlcywgc3RhcnRUaW1lLCBkdXJhdGlvbiApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHN0YXJ0VGltZSApIHtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggc3RhcnRUaW1lICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgLy8gcmV0dXJuIHRoaXMuX2NvbnRyb2wuZ2Fpbi52YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxuXG4gICAgZ2V0IGNvbnRyb2woKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250cm9sLmdhaW47XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFBhcmFtLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggUGFyYW0ucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhblVwSW5PdXRzLCAnX2NsZWFuVXBJbk91dHMnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBQYXJhbS5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuSU8sICdfY2xlYW5JTycgKTtcbkF1ZGlvSU8ubWl4aW4oIFBhcmFtLnByb3RvdHlwZSwgY29ubmVjdGlvbnMgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUGFyYW0gPSBmdW5jdGlvbiggdmFsdWUsIGRlZmF1bHRWYWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFBhcmFtKCB0aGlzLCB2YWx1ZSwgZGVmYXVsdFZhbHVlICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBQYXJhbTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcblxuY2xhc3MgV2F2ZVNoYXBlciB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBjdXJ2ZU9ySXRlcmF0b3IsIHNpemUgKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMuc2hhcGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZVdhdmVTaGFwZXIoKTtcblxuICAgICAgICAvLyBJZiBhIEZsb2F0MzJBcnJheSBpcyBwcm92aWRlZCwgdXNlIGl0XG4gICAgICAgIC8vIGFzIHRoZSBjdXJ2ZSB2YWx1ZS5cbiAgICAgICAgaWYgKCBjdXJ2ZU9ySXRlcmF0b3IgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgKSB7XG4gICAgICAgICAgICB0aGlzLnNoYXBlci5jdXJ2ZSA9IGN1cnZlT3JJdGVyYXRvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGEgZnVuY3Rpb24gaXMgcHJvdmlkZWQsIGNyZWF0ZSBhIGN1cnZlXG4gICAgICAgIC8vIHVzaW5nIHRoZSBmdW5jdGlvbiBhcyBhbiBpdGVyYXRvci5cbiAgICAgICAgZWxzZSBpZiAoIHR5cGVvZiBjdXJ2ZU9ySXRlcmF0b3IgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICBzaXplID0gdHlwZW9mIHNpemUgPT09ICdudW1iZXInICYmIHNpemUgPj0gMiA/IHNpemUgOiBDT05GSUcuY3VydmVSZXNvbHV0aW9uO1xuXG4gICAgICAgICAgICB2YXIgYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KCBzaXplICksXG4gICAgICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICAgICAgeCA9IDA7XG5cbiAgICAgICAgICAgIGZvciAoIGk7IGkgPCBzaXplOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgeCA9ICggaSAvIHNpemUgKSAqIDIgLSAxO1xuICAgICAgICAgICAgICAgIGFycmF5WyBpIF0gPSBjdXJ2ZU9ySXRlcmF0b3IoIHgsIGksIHNpemUgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSBhcnJheTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE90aGVyd2lzZSwgZGVmYXVsdCB0byBhIExpbmVhciBjdXJ2ZS5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNoYXBlci5jdXJ2ZSA9IHRoaXMuaW8uY3VydmVzLkxpbmVhcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gdGhpcy5vdXRwdXRzID0gWyB0aGlzLnNoYXBlciBdO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHRoaXMuX2NsZWFuVXBJbk91dHMoKTtcbiAgICAgICAgdGhpcy5fY2xlYW5JTygpO1xuICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5zaGFwZXIgPSBudWxsO1xuICAgIH1cblxuICAgIGdldCBjdXJ2ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2hhcGVyLmN1cnZlO1xuICAgIH1cbiAgICBzZXQgY3VydmUoIGN1cnZlICkge1xuICAgICAgICBpZiggY3VydmUgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgKSB7XG4gICAgICAgICAgICB0aGlzLnNoYXBlci5jdXJ2ZSA9IGN1cnZlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBXYXZlU2hhcGVyLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggV2F2ZVNoYXBlci5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuVXBJbk91dHMsICdfY2xlYW5VcEluT3V0cycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFdhdmVTaGFwZXIucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhbklPLCAnX2NsZWFuSU8nICk7XG5BdWRpb0lPLm1peGluKCBXYXZlU2hhcGVyLnByb3RvdHlwZSwgY29ubmVjdGlvbnMgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlV2F2ZVNoYXBlciA9IGZ1bmN0aW9uKCBjdXJ2ZSwgc2l6ZSApIHtcbiAgICByZXR1cm4gbmV3IFdhdmVTaGFwZXIoIHRoaXMsIGN1cnZlLCBzaXplICk7XG59OyIsImV4cG9ydCBkZWZhdWx0IHtcbiAgICBjdXJ2ZVJlc29sdXRpb246IDQwOTYsIC8vIE11c3QgYmUgYW4gZXZlbiBudW1iZXIuXG5cbiAgICAvLyBVc2VkIHdoZW4gY29udmVydGluZyBub3RlIHN0cmluZ3MgKGVnLiAnQSM0JykgdG8gTUlESSB2YWx1ZXMuXG4gICAgLy8gSXQncyB0aGUgb2N0YXZlIG51bWJlciBvZiB0aGUgbG93ZXN0IEMgbm90ZSAoTUlESSBub3RlIDApLlxuICAgIC8vIENoYW5nZSB0aGlzIGlmIHlvdSdyZSB1c2VkIHRvIGEgREFXIHRoYXQgZG9lc24ndCB1c2UgLTIgYXMgdGhlXG4gICAgLy8gbG93ZXN0IG9jdGF2ZS5cbiAgICBsb3dlc3RPY3RhdmU6IC0yLFxuXG4gICAgLy8gTG93ZXN0IGFsbG93ZWQgbnVtYmVyLiBVc2VkIGJ5IHNvbWUgTWF0aFxuICAgIC8vIGZ1bmN0aW9ucywgZXNwZWNpYWxseSB3aGVuIGNvbnZlcnRpbmcgYmV0d2VlblxuICAgIC8vIG51bWJlciBmb3JtYXRzIChpZS4gaHogLT4gTUlESSwgbm90ZSAtPiBNSURJLCBldGMuIClcbiAgICAvL1xuICAgIC8vIEFsc28gdXNlZCBpbiBjYWxscyB0byBBdWRpb1BhcmFtLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWVcbiAgICAvLyBzbyB0aGVyZSdzIG5vIHJhbXBpbmcgdG8gMCAod2hpY2ggdGhyb3dzIGFuIGVycm9yKS5cbiAgICBlcHNpbG9uOiAwLjAwMSxcblxuICAgIG1pZGlOb3RlUG9vbFNpemU6IDUwMFxufTsiLCIvLyBOZWVkIHRvIG92ZXJyaWRlIGV4aXN0aW5nIC5jb25uZWN0IGFuZCAuZGlzY29ubmVjdFxuLy8gZnVuY3Rpb25zIGZvciBcIm5hdGl2ZVwiIEF1ZGlvUGFyYW1zIGFuZCBBdWRpb05vZGVzLi4uXG4vLyBJIGRvbid0IGxpa2UgZG9pbmcgdGhpcywgYnV0IHMnZ290dGEgYmUgZG9uZSA6KFxuKCBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3JpZ2luYWxBdWRpb05vZGVDb25uZWN0ID0gQXVkaW9Ob2RlLnByb3RvdHlwZS5jb25uZWN0LFxuICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZURpc2Nvbm5lY3QgPSBBdWRpb05vZGUucHJvdG90eXBlLmRpc2Nvbm5lY3Q7XG5cbiAgICBBdWRpb05vZGUucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiggbm9kZSwgb3V0cHV0Q2hhbm5lbCA9IDAsIGlucHV0Q2hhbm5lbCA9IDAgKSB7XG4gICAgICAgIGlmICggbm9kZS5pbnB1dHMgKSB7XG4gICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIG5vZGUuaW5wdXRzICkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0KCBub2RlLmlucHV0c1sgaW5wdXRDaGFubmVsIF0gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdCggbm9kZS5pbnB1dHNbIDAgXSwgb3V0cHV0Q2hhbm5lbCwgaW5wdXRDaGFubmVsICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvTm9kZSApIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlQ29ubmVjdC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb1BhcmFtICkge1xuICAgICAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVDb25uZWN0LmNhbGwoIHRoaXMsIG5vZGUsIG91dHB1dENoYW5uZWwgKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBBdWRpb05vZGUucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiggbm9kZSwgb3V0cHV0Q2hhbm5lbCA9IDAsIGlucHV0Q2hhbm5lbCA9IDAgKSB7XG4gICAgICAgIGlmICggbm9kZSAmJiBub2RlLmlucHV0cyApIHtcbiAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggbm9kZS5pbnB1dHMgKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0KCBub2RlLmlucHV0c1sgMCBdLCBvdXRwdXRDaGFubmVsLCBpbnB1dENoYW5uZWwgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9Ob2RlICkge1xuICAgICAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVEaXNjb25uZWN0LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZURpc2Nvbm5lY3QuY2FsbCggdGhpcywgbm9kZSwgb3V0cHV0Q2hhbm5lbCApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCBub2RlID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZURpc2Nvbm5lY3QuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICB9XG4gICAgfTtcbn0oKSApOyIsImltcG9ydCBDT05GSUcgZnJvbSAnLi9jb25maWcuZXM2JztcbmltcG9ydCBtYXRoIGZyb20gJy4uL21peGlucy9NYXRoLmVzNic7XG5cblxubGV0IHNpZ25hbEN1cnZlcyA9IHt9O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0NvbnN0YW50Jywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnTGluZWFyJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnRXF1YWxQb3dlcicsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICksXG4gICAgICAgICAgICBzaW4gPSBNYXRoLnNpbixcbiAgICAgICAgICAgIFBJID0gTWF0aC5QSTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gc2luKCB4ICogMC41ICogUEkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdDdWJlZCcsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICksXG4gICAgICAgICAgICBzaW4gPSBNYXRoLnNpbixcbiAgICAgICAgICAgIFBJID0gTWF0aC5QSSxcbiAgICAgICAgICAgIHBvdyA9IE1hdGgucG93O1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIHggPSBwb3coIHgsIDMgKTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBzaW4oIHggKiAwLjUgKiBQSSApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdSZWN0aWZ5Jywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBoYWxmUmVzb2x1dGlvbiA9IHJlc29sdXRpb24gKiAwLjUsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IC1oYWxmUmVzb2x1dGlvbiwgeCA9IDA7IGkgPCBoYWxmUmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSA+IDAgPyBpIDogLWkgKSAvIGhhbGZSZXNvbHV0aW9uO1xuICAgICAgICAgICAgY3VydmVbIGkgKyBoYWxmUmVzb2x1dGlvbiBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cblxuLy8gTWF0aCBjdXJ2ZXNcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnR3JlYXRlclRoYW5aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA8PSAwID8gMC4wIDogMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnTGVzc1RoYW5aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA+PSAwID8gMCA6IDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0VxdWFsVG9aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA9PT0gMCA/IDEgOiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdSZWNpcHJvY2FsJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IDQwOTYgKiA2MDAsIC8vIEhpZ2hlciByZXNvbHV0aW9uIG5lZWRlZCBoZXJlLlxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgLy8gY3VydmVbIGkgXSA9IHggPT09IDAgPyAxIDogMDtcblxuICAgICAgICAgICAgaWYgKCB4ICE9PSAwICkge1xuICAgICAgICAgICAgICAgIHggPSBNYXRoLnBvdyggeCwgLTEgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1NpbmUnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApLFxuICAgICAgICAgICAgc2luID0gTWF0aC5zaW47XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIChNYXRoLlBJICogMikgLSBNYXRoLlBJO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHNpbiggeCApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnUm91bmQnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDUwLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgKCB4ID4gMCAmJiB4IDw9IDAuNTAwMDEgKSB8fFxuICAgICAgICAgICAgICAgICggeCA8IDAgJiYgeCA+PSAtMC41MDAwMSApXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCB4ID4gMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gMVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgeCA9IC0xO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdGbG9vcicsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogNTAsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG5cbiAgICAgICAgICAgIGlmICggeCA+PSAwLjk5OTkgKSB7XG4gICAgICAgICAgICAgICAgeCA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICggeCA+PSAwICkge1xuICAgICAgICAgICAgICAgIHggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIHggPCAwICkge1xuICAgICAgICAgICAgICAgIHggPSAtMTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0dhdXNzaWFuV2hpdGVOb2lzZScsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogMixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBtYXRoLm5yYW5kKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdXaGl0ZU5vaXNlJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24gKiAyLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IE1hdGgucmFuZG9tKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdQaW5rTm9pc2UnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDIsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBtYXRoLmdlbmVyYXRlUGlua051bWJlcigpO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBtYXRoLmdldE5leHRQaW5rTnVtYmVyKCkgKiAyIC0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnU2lnbicsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogMixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBNYXRoLnNpZ24oIHggKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gc2lnbmFsQ3VydmVzOyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBDdXN0b21FbnZlbG9wZSBmcm9tIFwiLi9DdXN0b21FbnZlbG9wZS5lczZcIjtcblxuY2xhc3MgQVNEUkVudmVsb3BlIGV4dGVuZHMgQ3VzdG9tRW52ZWxvcGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdGhpcy50aW1lcyA9IHtcbiAgICAgICAgICAgIGF0dGFjazogMC4wMSxcbiAgICAgICAgICAgIGRlY2F5OiAwLjUsXG4gICAgICAgICAgICByZWxlYXNlOiAwLjVcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxldmVscyA9IHtcbiAgICAgICAgICAgIGluaXRpYWw6IDAsXG4gICAgICAgICAgICBwZWFrOiAxLFxuICAgICAgICAgICAgc3VzdGFpbjogMSxcbiAgICAgICAgICAgIHJlbGVhc2U6IDBcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2luaXRpYWwnLCAwLCB0aGlzLmxldmVscy5pbml0aWFsICk7XG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnYXR0YWNrJywgdGhpcy50aW1lcy5hdHRhY2ssIHRoaXMubGV2ZWxzLnBlYWsgKTtcbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdkZWNheScsIHRoaXMudGltZXMuZGVjYXksIHRoaXMubGV2ZWxzLnN1c3RhaW4gKTtcbiAgICAgICAgdGhpcy5hZGRFbmRTdGVwKCAncmVsZWFzZScsIHRoaXMudGltZXMucmVsZWFzZSwgdGhpcy5sZXZlbHMucmVsZWFzZSwgdHJ1ZSApO1xuICAgIH1cblxuICAgIGdldCBhdHRhY2tUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5hdHRhY2s7XG4gICAgfVxuICAgIHNldCBhdHRhY2tUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuYXR0YWNrID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdhdHRhY2snLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBkZWNheVRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLmRlY2F5O1xuICAgIH1cbiAgICBzZXQgZGVjYXlUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuZGVjYXkgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ2RlY2F5JywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgcmVsZWFzZVRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLnJlbGVhc2U7XG4gICAgfVxuICAgIHNldCByZWxlYXNlVGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLnJlbGVhc2UgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ3JlbGVhc2UnLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBpbml0aWFsTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5pbml0aWFsO1xuICAgIH1cbiAgICBzZXQgaW5pdGlhbExldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMuaW5pdGlhbCA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdpbml0aWFsJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHBlYWtMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnBlYWs7XG4gICAgfVxuXG4gICAgc2V0IHBlYWtMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLnBlYWsgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnYXR0YWNrJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHN1c3RhaW5MZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnN1c3RhaW47XG4gICAgfVxuICAgIHNldCBzdXN0YWluTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5zdXN0YWluID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2RlY2F5JywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHJlbGVhc2VMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnJlbGVhc2U7XG4gICAgfVxuICAgIHNldCByZWxlYXNlTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5yZWxlYXNlID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ3JlbGVhc2UnLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBU0RSRW52ZWxvcGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEFTRFJFbnZlbG9wZSggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQVNEUkVudmVsb3BlOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgQ09ORklHIGZyb20gXCIuLi9jb3JlL2NvbmZpZy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcblxuY2xhc3MgQ3VzdG9tRW52ZWxvcGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgdGhpcy5fc2V0SU8oIGlvICk7XG5cbiAgICAgICAgdGhpcy5vcmRlcnMgPSB7XG4gICAgICAgICAgICBzdGFydDogW10sXG4gICAgICAgICAgICBzdG9wOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc3RlcHMgPSB7XG4gICAgICAgICAgICBzdGFydDoge30sXG4gICAgICAgICAgICBzdG9wOiB7fVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9hZGRTdGVwKCBzZWN0aW9uLCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCA9IGZhbHNlICkge1xuICAgICAgICBsZXQgc3RvcHMgPSB0aGlzLnN0ZXBzWyBzZWN0aW9uIF07XG5cbiAgICAgICAgaWYgKCBzdG9wc1sgbmFtZSBdICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnU3RvcCB3aXRoIG5hbWUgXCInICsgbmFtZSArICdcIiBhbHJlYWR5IGV4aXN0cy4nICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9yZGVyc1sgc2VjdGlvbiBdLnB1c2goIG5hbWUgKTtcblxuICAgICAgICB0aGlzLnN0ZXBzWyBzZWN0aW9uIF1bIG5hbWUgXSA9IHtcbiAgICAgICAgICAgIHRpbWU6IHRpbWUsXG4gICAgICAgICAgICBsZXZlbDogbGV2ZWwsXG4gICAgICAgICAgICBpc0V4cG9uZW50aWFsOiBpc0V4cG9uZW50aWFsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYWRkU3RhcnRTdGVwKCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCA9IGZhbHNlICkge1xuICAgICAgICB0aGlzLl9hZGRTdGVwKCAnc3RhcnQnLCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBhZGRFbmRTdGVwKCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCA9IGZhbHNlICkge1xuICAgICAgICB0aGlzLl9hZGRTdGVwKCAnc3RvcCcsIG5hbWUsIHRpbWUsIGxldmVsLCBpc0V4cG9uZW50aWFsICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFN0ZXBMZXZlbCggbmFtZSwgbGV2ZWwgKSB7XG4gICAgICAgIGxldCBzdGFydEluZGV4ID0gdGhpcy5vcmRlcnMuc3RhcnQuaW5kZXhPZiggbmFtZSApLFxuICAgICAgICAgICAgZW5kSW5kZXggPSB0aGlzLm9yZGVycy5zdG9wLmluZGV4T2YoIG5hbWUgKTtcblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggPT09IC0xICYmIGVuZEluZGV4ID09PSAtMSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ05vIHN0ZXAgd2l0aCBuYW1lIFwiJyArIG5hbWUgKyAnXCIuIE5vIGxldmVsIHNldC4nICk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggIT09IC0xICkge1xuICAgICAgICAgICAgdGhpcy5zdGVwcy5zdGFydFsgbmFtZSBdLmxldmVsID0gcGFyc2VGbG9hdCggbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RlcHMuc3RvcFsgbmFtZSBdLmxldmVsID0gcGFyc2VGbG9hdCggbGV2ZWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG4gICAgc2V0U3RlcFRpbWUoIG5hbWUsIHRpbWUgKSB7XG4gICAgICAgIHZhciBzdGFydEluZGV4ID0gdGhpcy5vcmRlcnMuc3RhcnQuaW5kZXhPZiggbmFtZSApLFxuICAgICAgICAgICAgZW5kSW5kZXggPSB0aGlzLm9yZGVycy5zdG9wLmluZGV4T2YoIG5hbWUgKTtcblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggPT09IC0xICYmIGVuZEluZGV4ID09PSAtMSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ05vIHN0ZXAgd2l0aCBuYW1lIFwiJyArIG5hbWUgKyAnXCIuIE5vIHRpbWUgc2V0LicgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc3RhcnRJbmRleCAhPT0gLTEgKSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnN0YXJ0WyBuYW1lIF0udGltZSA9IHBhcnNlRmxvYXQoIHRpbWUgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RlcHMuc3RvcFsgbmFtZSBdLnRpbWUgPSBwYXJzZUZsb2F0KCB0aW1lICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cblxuXG4gICAgX3RyaWdnZXJTdGVwKCBwYXJhbSwgc3RlcCwgc3RhcnRUaW1lICkge1xuICAgICAgICAvLyBpZiAoIHN0ZXAuaXNFeHBvbmVudGlhbCA9PT0gdHJ1ZSApIHtcbiAgICAgICAgICAgIC8vIFRoZXJlJ3Mgc29tZXRoaW5nIGFtaXNzIGhlcmUhXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggTWF0aC5tYXgoIHN0ZXAubGV2ZWwsIENPTkZJRy5lcHNpbG9uICksIHN0YXJ0VGltZSArIHN0ZXAudGltZSApO1xuICAgICAgICAgICAgLy8gcGFyYW0uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSggTWF0aC5tYXgoIHN0ZXAubGV2ZWwsIDAuMDEgKSwgc3RhcnRUaW1lICsgc3RlcC50aW1lICk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gZWxzZSB7XG4gICAgICAgICAgICBwYXJhbS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggc3RlcC5sZXZlbCwgc3RhcnRUaW1lICsgc3RlcC50aW1lICk7XG4gICAgICAgIC8vIH1cbiAgICB9XG5cbiAgICBfc3RhcnRTZWN0aW9uKCBzZWN0aW9uLCBwYXJhbSwgc3RhcnRUaW1lLCBjYW5jZWxTY2hlZHVsZWRWYWx1ZXMgKSB7XG4gICAgICAgIHZhciBzdG9wT3JkZXIgPSB0aGlzLm9yZGVyc1sgc2VjdGlvbiBdLFxuICAgICAgICAgICAgc3RlcHMgPSB0aGlzLnN0ZXBzWyBzZWN0aW9uIF0sXG4gICAgICAgICAgICBudW1TdG9wcyA9IHN0b3BPcmRlci5sZW5ndGgsXG4gICAgICAgICAgICBzdGVwO1xuXG4gICAgICAgIHBhcmFtLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggc3RhcnRUaW1lICk7XG4gICAgICAgIC8vIHBhcmFtLnNldFZhbHVlQXRUaW1lKCAwLCBzdGFydFRpbWUgKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1TdG9wczsgKytpICkge1xuICAgICAgICAgICAgc3RlcCA9IHN0ZXBzWyBzdG9wT3JkZXJbIGkgXSBdO1xuICAgICAgICAgICAgdGhpcy5fdHJpZ2dlclN0ZXAoIHBhcmFtLCBzdGVwLCBzdGFydFRpbWUgKTtcbiAgICAgICAgICAgIHN0YXJ0VGltZSArPSBzdGVwLnRpbWU7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHN0YXJ0KCBwYXJhbSwgZGVsYXkgPSAwICkge1xuICAgICAgICBpZiAoIHBhcmFtIGluc3RhbmNlb2YgQXVkaW9QYXJhbSA9PT0gZmFsc2UgJiYgcGFyYW0gaW5zdGFuY2VvZiBQYXJhbSA9PT0gZmFsc2UgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdDYW4gb25seSBzdGFydCBhbiBlbnZlbG9wZSBvbiBBdWRpb1BhcmFtIG9yIFBhcmFtIGluc3RhbmNlcy4nICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zdGFydFNlY3Rpb24oICdzdGFydCcsIHBhcmFtLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyBkZWxheSApO1xuICAgIH1cblxuICAgIHN0b3AoIHBhcmFtLCBkZWxheSA9IDAgKSB7XG4gICAgICAgIHRoaXMuX3N0YXJ0U2VjdGlvbiggJ3N0b3AnLCBwYXJhbSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgMC4xICsgZGVsYXkgKTtcbiAgICB9XG5cbiAgICBmb3JjZVN0b3AoIHBhcmFtLCBkZWxheSA9IDAgKSB7XG4gICAgICAgIHBhcmFtLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgZGVsYXkgKTtcbiAgICAgICAgLy8gcGFyYW0uc2V0VmFsdWVBdFRpbWUoIHBhcmFtLnZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyBkZWxheSApO1xuICAgICAgICBwYXJhbS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggMCwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgMC4wMDEgKTtcbiAgICB9XG5cbiAgICBnZXQgdG90YWxTdGFydFRpbWUoKSB7XG4gICAgICAgIHZhciBzdGFydHMgPSB0aGlzLnN0ZXBzLnN0YXJ0LFxuICAgICAgICAgICAgdGltZSA9IDAuMDtcblxuICAgICAgICBmb3IgKCB2YXIgaSBpbiBzdGFydHMgKSB7XG4gICAgICAgICAgICB0aW1lICs9IHN0YXJ0c1sgaSBdLnRpbWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGltZTtcbiAgICB9XG5cbiAgICBnZXQgdG90YWxTdG9wVGltZSgpIHtcbiAgICAgICAgdmFyIHN0b3BzID0gdGhpcy5zdGVwcy5zdG9wLFxuICAgICAgICAgICAgdGltZSA9IDAuMDtcblxuICAgICAgICBmb3IgKCB2YXIgaSBpbiBzdG9wcyApIHtcbiAgICAgICAgICAgIHRpbWUgKz0gc3RvcHNbIGkgXS50aW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRpbWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBDdXN0b21FbnZlbG9wZS5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ3VzdG9tRW52ZWxvcGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEN1c3RvbUVudmVsb3BlKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDdXN0b21FbnZlbG9wZTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IERyeVdldE5vZGUgZnJvbSBcIi4uL2dyYXBocy9EcnlXZXROb2RlLmVzNlwiO1xuXG4vLyBUT0RPOiBBZGQgZmVlZGJhY2tMZXZlbCBhbmQgZGVsYXlUaW1lIFBhcmFtIGluc3RhbmNlc1xuLy8gdG8gY29udHJvbCB0aGlzIG5vZGUuXG5jbGFzcyBEZWxheSBleHRlbmRzIERyeVdldE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdGltZSA9IDAsIGZlZWRiYWNrTGV2ZWwgPSAwICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbnRyb2wgbm9kZXMuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2sgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBmZWVkYmFja0xldmVsICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudGltZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHRpbWUgKTtcblxuICAgICAgICAvLyBDcmVhdGUgZmVlZGJhY2sgYW5kIGRlbGF5IG5vZGVzXG4gICAgICAgIHRoaXMuZmVlZGJhY2sgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG5cbiAgICAgICAgLy8gU2V0dXAgdGhlIGZlZWRiYWNrIGxvb3BcbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLmZlZWRiYWNrICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suY29ubmVjdCggdGhpcy5kZWxheSApO1xuXG4gICAgICAgIC8vIEFsc28gY29ubmVjdCB0aGUgZGVsYXkgdG8gdGhlIHdldCBvdXRwdXQuXG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy53ZXQgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGlucHV0IHRvIGRlbGF5XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5kZWxheSApO1xuXG4gICAgICAgIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgdGhpcy5mZWVkYmFjay5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnRpbWUuY29ubmVjdCggdGhpcy5kZWxheS5kZWxheVRpbWUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCB0aGlzLmZlZWRiYWNrLmdhaW4gKTtcbiAgICB9XG5cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEZWxheSA9IGZ1bmN0aW9uKCB0aW1lLCBmZWVkYmFja0xldmVsICkge1xuICAgIHJldHVybiBuZXcgRGVsYXkoIHRoaXMsIHRpbWUsIGZlZWRiYWNrTGV2ZWwgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IERlbGF5OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5pbXBvcnQgY29ubmVjdGlvbnMgZnJvbSBcIi4uL21peGlucy9jb25uZWN0aW9ucy5lczZcIjtcbmltcG9ydCBjbGVhbmVycyBmcm9tIFwiLi4vbWl4aW5zL2NsZWFuZXJzLmVzNlwiO1xuaW1wb3J0IERyeVdldE5vZGUgZnJvbSBcIi4uL2dyYXBocy9EcnlXZXROb2RlLmVzNlwiO1xuaW1wb3J0IERlbGF5IGZyb20gXCIuL0RlbGF5LmVzNlwiO1xuXG4vLyBUT0RPOlxuLy8gIC0gQ29udmVydCB0aGlzIG5vZGUgdG8gdXNlIFBhcmFtIGNvbnRyb2xzXG4vLyAgICBmb3IgdGltZSBhbmQgZmVlZGJhY2suXG5cbmNsYXNzIFBpbmdQb25nRGVsYXkgZXh0ZW5kcyBEcnlXZXROb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHRpbWUgPSAwLjI1LCBmZWVkYmFja0xldmVsID0gMC41ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyBDcmVhdGUgY2hhbm5lbCBzcGxpdHRlciBhbmQgbWVyZ2VyXG4gICAgICAgIHRoaXMuc3BsaXR0ZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKCAyICk7XG4gICAgICAgIHRoaXMubWVyZ2VyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxNZXJnZXIoIDIgKTtcblxuICAgICAgICAvLyBDcmVhdGUgZmVlZGJhY2sgYW5kIGRlbGF5IG5vZGVzXG4gICAgICAgIHRoaXMuZmVlZGJhY2tMID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5mZWVkYmFja1IgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmRlbGF5TCA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICB0aGlzLmRlbGF5UiA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuXG4gICAgICAgIC8vIFNldHVwIHRoZSBmZWVkYmFjayBsb29wXG4gICAgICAgIHRoaXMuZGVsYXlMLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2tMICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tMLmNvbm5lY3QoIHRoaXMuZGVsYXlSICk7XG4gICAgICAgIHRoaXMuZGVsYXlSLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2tSICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tSLmNvbm5lY3QoIHRoaXMuZGVsYXlMICk7XG5cblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc3BsaXR0ZXIgKTtcbiAgICAgICAgdGhpcy5zcGxpdHRlci5jb25uZWN0KCB0aGlzLmRlbGF5TCwgMCApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrTC5jb25uZWN0KCB0aGlzLm1lcmdlciwgMCwgMCApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrUi5jb25uZWN0KCB0aGlzLm1lcmdlciwgMCwgMSApO1xuICAgICAgICB0aGlzLm1lcmdlci5jb25uZWN0KCB0aGlzLndldCApO1xuXG4gICAgICAgIHRoaXMudGltZSA9IHRpbWU7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tMZXZlbCA9IGZlZWRiYWNrTGV2ZWw7XG4gICAgfVxuXG4gICAgZ2V0IHRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlbGF5TC5kZWxheVRpbWU7XG4gICAgfVxuXG4gICAgc2V0IHRpbWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmRlbGF5TC5kZWxheVRpbWUubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIDAuNVxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuZGVsYXlSLmRlbGF5VGltZS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZShcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgMC41XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZ2V0IGZlZWRiYWNrTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZlZWRiYWNrTC5nYWluLnZhbHVlO1xuICAgIH1cblxuICAgIHNldCBmZWVkYmFja0xldmVsKCBsZXZlbCApIHtcbiAgICAgICAgdGhpcy5mZWVkYmFja0wuZ2Fpbi52YWx1ZSA9IGxldmVsO1xuICAgICAgICB0aGlzLmZlZWRiYWNrUi5nYWluLnZhbHVlID0gbGV2ZWw7XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBQaW5nUG9uZ0RlbGF5LnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuQXVkaW9JTy5taXhpbiggUGluZ1BvbmdEZWxheS5wcm90b3R5cGUsIGNvbm5lY3Rpb25zICk7XG5BdWRpb0lPLm1peGluKCBQaW5nUG9uZ0RlbGF5LnByb3RvdHlwZSwgY2xlYW5lcnMgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUGluZ1BvbmdEZWxheSA9IGZ1bmN0aW9uKCB0aW1lLCBmZWVkYmFja0xldmVsICkge1xuICAgIHJldHVybiBuZXcgUGluZ1BvbmdEZWxheSggdGhpcywgdGltZSwgZmVlZGJhY2tMZXZlbCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKlxuICAgIFRoaXMgTm9kZSBpcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiBvbmUgb2YgU2Nocm9lZGVyJ3NcbiAgICBBbGxQYXNzIGdyYXBocy4gVGhpcyBwYXJ0aWN1bGFyIGdyYXBoIGlzIHNob3duIGluIEZpZ3VyZTJcbiAgICBpbiB0aGUgZm9sbG93aW5nIHBhcGVyOlxuXG4gICAgTS4gUi4gU2Nocm9lZGVyIC0gTmF0dXJhbCBTb3VuZGluZyBBcnRpZmljaWFsIFJldmVyYmVyYXRpb25cblxuICAgIEpvdXJuYWwgb2YgdGhlIEF1ZGlvIEVuZ2luZWVyaW5nIFNvY2lldHksIEp1bHkgMTk2Mi5cbiAgICBWb2x1bWUgMTAsIE51bWJlciAzLlxuXG5cbiAgICBJdCdzIGF2YWlsYWJsZSBoZXJlOlxuICAgIGh0dHA6Ly93d3cuZWNlLnJvY2hlc3Rlci5lZHUvfnpkdWFuL3RlYWNoaW5nL2VjZTQ3Mi9yZWFkaW5nL1NjaHJvZWRlcl8xOTYyLnBkZlxuXG5cbiAgICBUaGVyZSBhcmUgdGhyZWUgbWFpbiBwYXRocyBhbiBpbnB1dCBzaWduYWwgY2FuIHRha2U6XG5cbiAgICBpbiAtPiAtZ2FpbiAtPiBzdW0xIC0+IG91dFxuICAgIGluIC0+IHN1bTIgLT4gZGVsYXkgLT4gZ2FpbiAtPiBzdW0yXG4gICAgaW4gLT4gc3VtMiAtPiBkZWxheSAtPiBnYWluICgxLWdeMikgLT4gc3VtMVxuXG4gICAgRm9yIG5vdywgdGhlIHN1bW1pbmcgbm9kZXMgYXJlIGEgcGFydCBvZiB0aGUgZm9sbG93aW5nIGNsYXNzLFxuICAgIGJ1dCBjYW4gZWFzaWx5IGJlIHJlbW92ZWQgYnkgY29ubmVjdGluZyBgLWdhaW5gLCBgZ2FpbmAsIGFuZCBgMS1nYWluXjJgXG4gICAgdG8gYHRoaXMub3V0cHV0c1swXWAgYW5kIGAtZ2FpbmAgYW5kIGBpbmAgdG8gdGhlIGRlbGF5IGRpcmVjdGx5LlxuICovXG5cbi8vIFRPRE86XG4vLyAgLSBSZW1vdmUgdW5uZWNlc3Nhcnkgc3VtbWluZyBub2Rlcy5cbmNsYXNzIFNjaHJvZWRlckFsbFBhc3MgZXh0ZW5kcyBOb2RlIHtcblxuICAgIGNvbnN0cnVjdG9yKCBpbywgZGVsYXlUaW1lLCBmZWVkYmFjayApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnN1bTEgPSBpby5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguc3VtMiA9IGlvLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5wb3NpdGl2ZUdhaW4gPSBpby5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVHYWluID0gaW8uY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm5lZ2F0ZSA9IGlvLmNyZWF0ZU5lZ2F0ZSgpO1xuICAgICAgICBncmFwaC5kZWxheSA9IGlvLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgZ3JhcGgub25lTWludXNHYWluU3F1YXJlZCA9IGlvLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5taW51c09uZSA9IGlvLmNyZWF0ZVN1YnRyYWN0KCAxICk7XG4gICAgICAgIGdyYXBoLmdhaW5TcXVhcmVkID0gaW8uY3JlYXRlU3F1YXJlKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjayA9IGlvLmNyZWF0ZVBhcmFtKCBmZWVkYmFjayApLFxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRlbGF5VGltZSA9IGlvLmNyZWF0ZVBhcmFtKCBkZWxheVRpbWUgKTtcblxuICAgICAgICAvLyBaZXJvIG91dCBjb250cm9sbGVkIHBhcmFtcy5cbiAgICAgICAgZ3JhcGgucG9zaXRpdmVHYWluLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZUdhaW4uZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLm9uZU1pbnVzR2FpblNxdWFyZWQuZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBnYWluIGNvbnRyb2xzXG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2suY29ubmVjdCggZ3JhcGgucG9zaXRpdmVHYWluLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCBncmFwaC5uZWdhdGUgKTtcbiAgICAgICAgZ3JhcGgubmVnYXRlLmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlR2Fpbi5nYWluICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2suY29ubmVjdCggZ3JhcGguZ2FpblNxdWFyZWQgKTtcbiAgICAgICAgZ3JhcGguZ2FpblNxdWFyZWQuY29ubmVjdCggZ3JhcGgubWludXNPbmUgKTtcbiAgICAgICAgZ3JhcGgubWludXNPbmUuY29ubmVjdCggZ3JhcGgub25lTWludXNHYWluU3F1YXJlZC5nYWluICk7XG5cbiAgICAgICAgLy8gY29ubmVjdCBkZWxheSB0aW1lIGNvbnRyb2xcbiAgICAgICAgdGhpcy5jb250cm9scy5kZWxheVRpbWUuY29ubmVjdCggZ3JhcGguZGVsYXkuZGVsYXlUaW1lICk7XG5cbiAgICAgICAgLy8gRmlyc3Qgc2lnbmFsIHBhdGg6XG4gICAgICAgIC8vIGluIC0+IC1nYWluIC0+IGdyYXBoLnN1bTEgLT4gb3V0XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubmVnYXRpdmVHYWluICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlR2Fpbi5jb25uZWN0KCBncmFwaC5zdW0xICk7XG4gICAgICAgIGdyYXBoLnN1bTEuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTZWNvbmQgc2lnbmFsIHBhdGg6XG4gICAgICAgIC8vIChpbiAtPiBncmFwaC5zdW0yIC0+KSBkZWxheSAtPiBnYWluIC0+IGdyYXBoLnN1bTJcbiAgICAgICAgZ3JhcGguZGVsYXkuY29ubmVjdCggZ3JhcGgucG9zaXRpdmVHYWluICk7XG4gICAgICAgIGdyYXBoLnBvc2l0aXZlR2Fpbi5jb25uZWN0KCBncmFwaC5zdW0yICk7XG5cbiAgICAgICAgLy8gVGhpcmQgc2lnbmFsIHBhdGg6XG4gICAgICAgIC8vIGluIC0+IGdyYXBoLnN1bTIgLT4gZGVsYXkgLT4gZ2FpbiAoMS1nXjIpIC0+IGdyYXBoLnN1bTFcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zdW0yICk7XG4gICAgICAgIGdyYXBoLnN1bTIuY29ubmVjdCggZ3JhcGguZGVsYXkgKTtcbiAgICAgICAgZ3JhcGguZGVsYXkuY29ubmVjdCggZ3JhcGgub25lTWludXNHYWluU3F1YXJlZCApO1xuICAgICAgICBncmFwaC5vbmVNaW51c0dhaW5TcXVhcmVkLmNvbm5lY3QoIGdyYXBoLnN1bTEgKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2Nocm9lZGVyQWxsUGFzcyA9IGZ1bmN0aW9uKCBkZWxheVRpbWUsIGZlZWRiYWNrICkge1xuICAgIHJldHVybiBuZXcgU2Nocm9lZGVyQWxsUGFzcyggdGhpcywgZGVsYXlUaW1lLCBmZWVkYmFjayApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IERyeVdldE5vZGUgZnJvbSBcIi4uL2dyYXBocy9EcnlXZXROb2RlLmVzNlwiO1xuXG4vLyBUT0RPOiBBZGQgZmVlZGJhY2tMZXZlbCBhbmQgZGVsYXlUaW1lIFBhcmFtIGluc3RhbmNlc1xuLy8gdG8gY29udHJvbCB0aGlzIG5vZGUuXG5jbGFzcyBTaW5lU2hhcGVyIGV4dGVuZHMgRHJ5V2V0Tm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRyaXZlID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuU2luZSApO1xuICAgICAgICB0aGlzLnNoYXBlckRyaXZlID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5zaGFwZXJEcml2ZS5nYWluLnZhbHVlID0gMTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc2hhcGVyRHJpdmUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5kcml2ZS5jb25uZWN0KCB0aGlzLnNoYXBlckRyaXZlLmdhaW4gKTtcbiAgICAgICAgdGhpcy5zaGFwZXJEcml2ZS5jb25uZWN0KCB0aGlzLnNoYXBlciApO1xuICAgICAgICB0aGlzLnNoYXBlci5jb25uZWN0KCB0aGlzLndldCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2luZVNoYXBlciA9IGZ1bmN0aW9uKCB0aW1lLCBmZWVkYmFja0xldmVsICkge1xuICAgIHJldHVybiBuZXcgU2luZVNoYXBlciggdGhpcywgdGltZSwgZmVlZGJhY2tMZXZlbCApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2luZVNoYXBlcjsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vLyBCYXNlZCBvbiB0aGUgZm9sbG93aW5nIGZvcm11bGEgZnJvbSBNaWNoYWVsIEdydWhuOlxuLy8gIC0gaHR0cDovL211c2ljZHNwLm9yZy9zaG93QXJjaGl2ZUNvbW1lbnQucGhwP0FyY2hpdmVJRD0yNTVcbi8vXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vXG4vLyBDYWxjdWxhdGUgdHJhbnNmb3JtYXRpb24gbWF0cml4J3MgY29lZmZpY2llbnRzXG4vLyBjb3NfY29lZiA9IGNvcyhhbmdsZSk7XG4vLyBzaW5fY29lZiA9IHNpbihhbmdsZSk7XG5cbi8vIERvIHRoaXMgcGVyIHNhbXBsZVxuLy8gb3V0X2xlZnQgPSBpbl9sZWZ0ICogY29zX2NvZWYgLSBpbl9yaWdodCAqIHNpbl9jb2VmO1xuLy8gb3V0X3JpZ2h0ID0gaW5fbGVmdCAqIHNpbl9jb2VmICsgaW5fcmlnaHQgKiBjb3NfY29lZjtcbmNsYXNzIFN0ZXJlb1JvdGF0aW9uIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCByb3RhdGlvbiApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMucm90YXRpb24gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCByb3RhdGlvbiApO1xuXG4gICAgICAgIGdyYXBoLnNwbGl0dGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxTcGxpdHRlciggMiApO1xuICAgICAgICBncmFwaC5jb3MgPSB0aGlzLmlvLmNyZWF0ZUNvcygpO1xuICAgICAgICBncmFwaC5zaW4gPSB0aGlzLmlvLmNyZWF0ZVNpbigpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMucm90YXRpb24uY29ubmVjdCggZ3JhcGguY29zICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMucm90YXRpb24uY29ubmVjdCggZ3JhcGguc2luICk7XG5cbiAgICAgICAgZ3JhcGgubGVmdE11bHRpcGx5Q29zID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5sZWZ0TXVsdGlwbHlTaW4gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLnJpZ2h0TXVsdGlwbHlDb3MgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLnJpZ2h0TXVsdGlwbHlTaW4gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLmxlZnRDb3NNaW51c1JpZ2h0U2luID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICBncmFwaC5sZWZ0U2luQWRkUmlnaHRDb3MgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuXG5cblxuICAgICAgICBncmFwaC5pbnB1dExlZnQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5pbnB1dFJpZ2h0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgubWVyZ2VyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxNZXJnZXIoIDIgKTtcblxuICAgICAgICBncmFwaC5zcGxpdHRlci5jb25uZWN0KCBncmFwaC5pbnB1dExlZnQsIDAgKTtcbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIuY29ubmVjdCggZ3JhcGguaW5wdXRSaWdodCwgMSApO1xuXG4gICAgICAgIGdyYXBoLmlucHV0TGVmdC5jb25uZWN0KCBncmFwaC5sZWZ0TXVsdGlwbHlDb3MsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguY29zLmNvbm5lY3QoIGdyYXBoLmxlZnRNdWx0aXBseUNvcywgMCwgMSApO1xuICAgICAgICBncmFwaC5pbnB1dExlZnQuY29ubmVjdCggZ3JhcGgubGVmdE11bHRpcGx5U2luLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLnNpbi5jb25uZWN0KCBncmFwaC5sZWZ0TXVsdGlwbHlTaW4sIDAsIDEpO1xuXG4gICAgICAgIGdyYXBoLmlucHV0UmlnaHQuY29ubmVjdCggZ3JhcGgucmlnaHRNdWx0aXBseVNpbiwgMCwgMCApO1xuICAgICAgICBncmFwaC5zaW4uY29ubmVjdCggZ3JhcGgucmlnaHRNdWx0aXBseVNpbiwgMCwgMSApO1xuICAgICAgICBncmFwaC5pbnB1dFJpZ2h0LmNvbm5lY3QoIGdyYXBoLnJpZ2h0TXVsdGlwbHlDb3MsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguY29zLmNvbm5lY3QoIGdyYXBoLnJpZ2h0TXVsdGlwbHlDb3MsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5sZWZ0TXVsdGlwbHlDb3MuY29ubmVjdCggZ3JhcGgubGVmdENvc01pbnVzUmlnaHRTaW4sIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgucmlnaHRNdWx0aXBseVNpbi5jb25uZWN0KCBncmFwaC5sZWZ0Q29zTWludXNSaWdodFNpbiwgMCwgMSApO1xuICAgICAgICBncmFwaC5sZWZ0TXVsdGlwbHlTaW4uY29ubmVjdCggZ3JhcGgubGVmdFNpbkFkZFJpZ2h0Q29zLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLnJpZ2h0TXVsdGlwbHlDb3MuY29ubmVjdCggZ3JhcGgubGVmdFNpbkFkZFJpZ2h0Q29zLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGgubGVmdENvc01pbnVzUmlnaHRTaW4uY29ubmVjdCggZ3JhcGgubWVyZ2VyLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmxlZnRTaW5BZGRSaWdodENvcy5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDEgKTtcblxuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc3BsaXR0ZXIgKTtcbiAgICAgICAgZ3JhcGgubWVyZ2VyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5uYW1lZElucHV0cy5sZWZ0ID0gZ3JhcGguaW5wdXRMZWZ0O1xuICAgICAgICB0aGlzLm5hbWVkSW5wdXRzLnJpZ2h0ID0gZ3JhcGguaW5wdXRSaWdodDtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3RlcmVvUm90YXRpb24gPSBmdW5jdGlvbiggcm90YXRpb24gKSB7XG4gICAgcmV0dXJuIG5ldyBTdGVyZW9Sb3RhdGlvbiggdGhpcywgcm90YXRpb24gKTtcbn07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuLy8gQmFzZWQgb24gdGhlIGZvbGxvd2luZyBmb3JtdWxhIGZyb20gTWljaGFlbCBHcnVobjpcbi8vICAtIGh0dHA6Ly9tdXNpY2RzcC5vcmcvc2hvd0FyY2hpdmVDb21tZW50LnBocD9BcmNoaXZlSUQ9MjU2XG4vL1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vL1xuLy8gVGhlIGdyYXBoIHRoYXQncyBjcmVhdGVkIGlzIGFzIGZvbGxvd3M6XG4vL1xuLy8gICAgICAgICAgICAgICAgICAgfC0+IEwgLT4gbGVmdEFkZFJpZ2h0KCBjaDAgKSAtPiB8XG4vLyAgICAgICAgICAgICAgICAgICB8LT4gUiAtPiBsZWZ0QWRkUmlnaHQoIGNoMSApIC0+IHwgLT4gbXVsdGlwbHkoIDAuNSApIC0tLS0tLT4gbW9ub01pbnVzU3RlcmVvKCAwICkgLT4gbWVyZ2VyKCAwICkgLy8gb3V0TFxuLy8gaW5wdXQgLT4gc3BsaXR0ZXIgLSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfC0tLS0tPiBtb25vUGx1c1N0ZXJlbyggMCApIC0tPiBtZXJnZXIoIDEgKSAvLyBvdXRSXG4vLyAgICAgICAgICAgICAgICAgICB8LT4gTCAtPiByaWdodE1pbnVzTGVmdCggY2gxICkgLT4gfFxuLy8gICAgICAgICAgICAgICAgICAgfC0+IFIgLT4gcmlnaHRNaW51c0xlZnQoIGNoMCApIC0+IHwgLT4gbXVsdGlwbHkoIGNvZWYgKSAtLS0+IG1vbm9NaW51c1N0ZXJlbyggMSApIC0+IG1lcmdlciggMCApIC8vIG91dExcbi8vXG4vL1xuY2xhc3MgU3RlcmVvV2lkdGggZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHdpZHRoICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKCAyICk7XG4gICAgICAgIGdyYXBoLmNvZWZmaWNpZW50ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggd2lkdGggKTtcbiAgICAgICAgZ3JhcGguY29lZmZpY2llbnRIYWxmID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggMC41ICk7XG4gICAgICAgIGdyYXBoLmlucHV0TGVmdCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmlucHV0UmlnaHQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5sZWZ0QWRkUmlnaHQgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICBncmFwaC5yaWdodE1pbnVzTGVmdCA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHlQb2ludEZpdmUgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAwLjUgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHlDb2VmZmljaWVudCA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubW9ub01pbnVzU3RlcmVvID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICBncmFwaC5tb25vUGx1c1N0ZXJlbyA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLm1lcmdlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsTWVyZ2VyKCAyICk7XG5cbiAgICAgICAgZ3JhcGguY29lZmZpY2llbnQuY29ubmVjdCggZ3JhcGguY29lZmZpY2llbnRIYWxmICk7XG4gICAgICAgIGdyYXBoLmNvZWZmaWNpZW50SGFsZi5jb25uZWN0KCBncmFwaC5tdWx0aXBseUNvZWZmaWNpZW50LCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGguc3BsaXR0ZXIuY29ubmVjdCggZ3JhcGguaW5wdXRMZWZ0LCAwICk7XG4gICAgICAgIGdyYXBoLnNwbGl0dGVyLmNvbm5lY3QoIGdyYXBoLmlucHV0UmlnaHQsIDEgKTtcbiAgICAgICAgZ3JhcGguaW5wdXRMZWZ0LmNvbm5lY3QoIGdyYXBoLmxlZnRBZGRSaWdodCwgMCwgMCApO1xuICAgICAgICBncmFwaC5pbnB1dFJpZ2h0LmNvbm5lY3QoIGdyYXBoLmxlZnRBZGRSaWdodCwgMCwgMSApO1xuICAgICAgICBncmFwaC5pbnB1dExlZnQuY29ubmVjdCggZ3JhcGgucmlnaHRNaW51c0xlZnQsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguaW5wdXRSaWdodC5jb25uZWN0KCBncmFwaC5yaWdodE1pbnVzTGVmdCwgMCwgMCApO1xuXG4gICAgICAgIGdyYXBoLmxlZnRBZGRSaWdodC5jb25uZWN0KCBncmFwaC5tdWx0aXBseVBvaW50Rml2ZSApO1xuICAgICAgICBncmFwaC5yaWdodE1pbnVzTGVmdC5jb25uZWN0KCBncmFwaC5tdWx0aXBseUNvZWZmaWNpZW50LCAwLCAwICk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbHlQb2ludEZpdmUuY29ubmVjdCggZ3JhcGgubW9ub01pbnVzU3RlcmVvLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5Q29lZmZpY2llbnQuY29ubmVjdCggZ3JhcGgubW9ub01pbnVzU3RlcmVvLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbHlQb2ludEZpdmUuY29ubmVjdCggZ3JhcGgubW9ub1BsdXNTdGVyZW8sIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHlDb2VmZmljaWVudC5jb25uZWN0KCBncmFwaC5tb25vUGx1c1N0ZXJlbywgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLm1vbm9NaW51c1N0ZXJlby5jb25uZWN0KCBncmFwaC5tZXJnZXIsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubW9ub1BsdXNTdGVyZW8uY29ubmVjdCggZ3JhcGgubWVyZ2VyLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zcGxpdHRlciApO1xuICAgICAgICBncmFwaC5tZXJnZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLm5hbWVkSW5wdXRzLmxlZnQgPSBncmFwaC5pbnB1dExlZnQ7XG4gICAgICAgIHRoaXMubmFtZWRJbnB1dHMucmlnaHQgPSBncmFwaC5pbnB1dFJpZ2h0O1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMud2lkdGggPSBncmFwaC5jb2VmZmljaWVudDtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3RlcmVvV2lkdGggPSBmdW5jdGlvbiggd2lkdGggKSB7XG4gICAgcmV0dXJuIG5ldyBTdGVyZW9XaWR0aCggdGhpcywgd2lkdGggKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuXG5jbGFzcyBPc2NpbGxhdG9yR2VuZXJhdG9yIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlZm9ybSApIHtcbiAgICAgICAgdGhpcy5fc2V0SU8oIGlvICk7XG5cbiAgICAgICAgdGhpcy5mcmVxdWVuY3kgPSBmcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuZGV0dW5lID0gZGV0dW5lO1xuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgICAgIHRoaXMuZ2xpZGVUaW1lID0gZ2xpZGVUaW1lO1xuICAgICAgICB0aGlzLndhdmUgPSB3YXZlZm9ybSB8fCAnc2luZSc7XG4gICAgICAgIHRoaXMucmVzZXRUaW1lc3RhbXAgPSAwLjA7XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSB0aGlzLmNvbnRleHQuY3JlYXRlT3NjaWxsYXRvcigpLFxuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGggPSB0aGlzLl9tYWtlVmVsb2NpdHlHcmFwaCggdmVsb2NpdHkgKTtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gWyB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpIF07XG4gICAgICAgIHRoaXMucmVzZXQoIHRoaXMuZnJlcXVlbmN5LCB0aGlzLmRldHVuZSwgdGhpcy52ZWxvY2l0eSwgdGhpcy5nbGlkZVRpbWUsIHRoaXMud2F2ZSApO1xuXG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLmNvbm5lY3QoIHRoaXMudmVsb2NpdHlHcmFwaCApO1xuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGguY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBfbWFrZVZlbG9jaXR5R3JhcGgoKSB7XG4gICAgICAgIHZhciBnYWluID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgcmV0dXJuIGdhaW47XG4gICAgfVxuXG4gICAgX3Jlc2V0VmVsb2NpdHlHcmFwaCggdmVsb2NpdHkgKSB7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaC5nYWluLnZhbHVlID0gdmVsb2NpdHk7XG4gICAgfVxuXG4gICAgX2NsZWFuVXBWZWxvY2l0eUdyYXBoKCkge1xuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGguZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaCA9IG51bGw7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdID0gbnVsbDtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gbnVsbDtcbiAgICB9XG5cbiAgICBsZXJwKCBzdGFydCwgZW5kLCBkZWx0YSApIHtcbiAgICAgICAgcmV0dXJuIHN0YXJ0ICsgKCAoIGVuZCAtIHN0YXJ0ICkgKiBkZWx0YSApO1xuICAgIH1cblxuICAgIHJlc2V0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZSApIHtcbiAgICAgICAgdmFyIG5vdyA9IHRoaXMuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICBmcmVxdWVuY3kgPSB0eXBlb2YgZnJlcXVlbmN5ID09PSAnbnVtYmVyJyA/IGZyZXF1ZW5jeSA6IHRoaXMuZnJlcXVlbmN5O1xuICAgICAgICBkZXR1bmUgPSB0eXBlb2YgZGV0dW5lID09PSAnbnVtYmVyJyA/IGRldHVuZSA6IHRoaXMuZGV0dW5lO1xuICAgICAgICB2ZWxvY2l0eSA9IHR5cGVvZiB2ZWxvY2l0eSA9PT0gJ251bWJlcicgPyB2ZWxvY2l0eSA6IHRoaXMudmVsb2NpdHk7XG4gICAgICAgIHdhdmUgPSB0eXBlb2Ygd2F2ZSA9PT0gJ251bWJlcicgPyB3YXZlIDogdGhpcy53YXZlO1xuXG4gICAgICAgIHZhciBnbGlkZVRpbWUgPSB0eXBlb2YgZ2xpZGVUaW1lID09PSAnbnVtYmVyJyA/IGdsaWRlVGltZSA6IDA7XG5cbiAgICAgICAgdGhpcy5fcmVzZXRWZWxvY2l0eUdyYXBoKCB2ZWxvY2l0eSApO1xuXG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIG5vdyApO1xuICAgICAgICB0aGlzLmdlbmVyYXRvci5kZXR1bmUuY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCBub3cgKTtcblxuICAgICAgICAvLyBub3cgKz0gMC4xXG5cbiAgICAgICAgLy8gaWYgKCB0aGlzLmdsaWRlVGltZSAhPT0gMC4wICkge1xuICAgICAgICAvLyAgICAgdmFyIHN0YXJ0RnJlcSA9IHRoaXMuZnJlcXVlbmN5LFxuICAgICAgICAvLyAgICAgICAgIGVuZEZyZXEgPSBmcmVxdWVuY3ksXG4gICAgICAgIC8vICAgICAgICAgZnJlcURpZmYgPSBlbmRGcmVxIC0gc3RhcnRGcmVxLFxuICAgICAgICAvLyAgICAgICAgIHN0YXJ0VGltZSA9IHRoaXMucmVzZXRUaW1lc3RhbXAsXG4gICAgICAgIC8vICAgICAgICAgZW5kVGltZSA9IHRoaXMucmVzZXRUaW1lc3RhbXAgKyB0aGlzLmdsaWRlVGltZSxcbiAgICAgICAgLy8gICAgICAgICBjdXJyZW50VGltZSA9IG5vdyAtIHN0YXJ0VGltZSxcbiAgICAgICAgLy8gICAgICAgICBsZXJwUG9zID0gY3VycmVudFRpbWUgLyB0aGlzLmdsaWRlVGltZSxcbiAgICAgICAgLy8gICAgICAgICBjdXJyZW50RnJlcSA9IHRoaXMubGVycCggdGhpcy5mcmVxdWVuY3ksIGZyZXF1ZW5jeSwgbGVycFBvcyApO1xuXG4gICAgICAgIC8vICAgICBpZiAoIGN1cnJlbnRUaW1lIDwgZ2xpZGVUaW1lICkge1xuICAgICAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKCAnY3V0b2ZmJywgc3RhcnRGcmVxLCBjdXJyZW50RnJlcSApO1xuICAgICAgICAvLyAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZSggY3VycmVudEZyZXEsIG5vdyApO1xuICAgICAgICAvLyAgICAgfVxuXG5cbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKCBzdGFydFRpbWUsIGVuZFRpbWUsIG5vdywgY3VycmVudFRpbWUgKTtcbiAgICAgICAgLy8gfVxuXG5cbiAgICAgICAgLy8gbm93ICs9IDAuNTtcblxuICAgICAgICBpZiAoIGdsaWRlVGltZSAhPT0gMCApIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggZnJlcXVlbmN5LCBub3cgKyBnbGlkZVRpbWUgKTtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmRldHVuZS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggZGV0dW5lLCBub3cgKyBnbGlkZVRpbWUgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZSggZnJlcXVlbmN5LCBub3cgKTtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmRldHVuZS5zZXRWYWx1ZUF0VGltZSggZGV0dW5lLCBub3cgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggdHlwZW9mIHdhdmUgPT09ICdzdHJpbmcnICkge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IudHlwZSA9IHdhdmU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRvci50eXBlID0gdGhpcy53YXZlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXNldFRpbWVzdGFtcCA9IG5vdztcbiAgICAgICAgdGhpcy5nbGlkZVRpbWUgPSBnbGlkZVRpbWU7XG4gICAgICAgIHRoaXMuZnJlcXVlbmN5ID0gZnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmRldHVuZSA9IGRldHVuZTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgICAgICB0aGlzLndhdmUgPSB3YXZlO1xuICAgIH1cblxuICAgIHN0YXJ0KCBkZWxheSApIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3Iuc3RhcnQoIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgc3RvcCggZGVsYXkgKSB7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLnN0b3AoIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3IuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fY2xlYW5VcFZlbG9jaXR5R3JhcGgoKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIE9zY2lsbGF0b3JHZW5lcmF0b3IucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU9zY2lsbGF0b3JHZW5lcmF0b3IgPSBmdW5jdGlvbiggZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmUgKSB7XG4gICAgcmV0dXJuIG5ldyBPc2NpbGxhdG9yR2VuZXJhdG9yKCB0aGlzLCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBUT0RPOlxuLy8gIC0gVHVybiBhcmd1bWVudHMgaW50byBjb250cm9sbGFibGUgcGFyYW1ldGVycztcbmNsYXNzIENvdW50ZXIgZXh0ZW5kcyBOb2RlIHtcblxuICAgIGNvbnN0cnVjdG9yKCBpbywgaW5jcmVtZW50LCBsaW1pdCwgc3RlcFRpbWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuc3RlcFRpbWUgPSBzdGVwVGltZSB8fCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGU7XG5cbiAgICAgICAgdGhpcy5jb25zdGFudCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGluY3JlbWVudCApO1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIHRoaXMuZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSB0aGlzLnN0ZXBUaW1lO1xuXG4gICAgICAgIHRoaXMuZmVlZGJhY2sgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcblxuICAgICAgICB0aGlzLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLmZlZWRiYWNrICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suY29ubmVjdCggdGhpcy5kZWxheSApO1xuXG4gICAgICAgIHRoaXMubGVzc1RoYW4gPSB0aGlzLmlvLmNyZWF0ZUxlc3NUaGFuKCBsaW1pdCApO1xuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMubGVzc1RoYW4gKTtcbiAgICAgICAgLy8gdGhpcy5sZXNzVGhhbi5jb25uZWN0KCB0aGlzLmZlZWRiYWNrLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb25zdGFudC5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMubGVzc1RoYW4uY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgIH1cblxuICAgIHJlc2V0KCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5zdG9wKCk7XG5cbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLnN0YXJ0KCk7XG4gICAgICAgIH0sIDE2ICk7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGlmKCB0aGlzLnJ1bm5pbmcgPT09IGZhbHNlICkge1xuICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gdGhpcy5zdGVwVGltZTtcbiAgICAgICAgICAgIHRoaXMubGVzc1RoYW4uY29ubmVjdCggdGhpcy5mZWVkYmFjay5nYWluICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdG9wKCkge1xuICAgICAgICBpZiggdGhpcy5ydW5uaW5nID09PSB0cnVlICkge1xuICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmxlc3NUaGFuLmRpc2Nvbm5lY3QoIHRoaXMuZmVlZGJhY2suZ2FpbiApO1xuICAgICAgICAgICAgdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvdW50ZXIgPSBmdW5jdGlvbiggaW5jcmVtZW50LCBsaW1pdCwgc3RlcFRpbWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDb3VudGVyKCB0aGlzLCBpbmNyZW1lbnQsIGxpbWl0LCBzdGVwVGltZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBDcm9zc2ZhZGVyIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1DYXNlcyA9IDIsIHN0YXJ0aW5nQ2FzZSA9IDAgKSB7XG5cbiAgICAgICAgLy8gRW5zdXJlIHN0YXJ0aW5nQ2FzZSBpcyBuZXZlciA8IDBcbiAgICAgICAgLy8gYW5kIG51bWJlciBvZiBpbnB1dHMgaXMgYWx3YXlzID49IDIgKG5vIHBvaW50XG4gICAgICAgIC8vIHgtZmFkaW5nIGJldHdlZW4gbGVzcyB0aGFuIHR3byBpbnB1dHMhKVxuICAgICAgICBzdGFydGluZ0Nhc2UgPSBNYXRoLmFicyggc3RhcnRpbmdDYXNlICk7XG4gICAgICAgIG51bUNhc2VzID0gTWF0aC5tYXgoIG51bUNhc2VzLCAyICk7XG5cbiAgICAgICAgc3VwZXIoIGlvLCBudW1DYXNlcywgMSApO1xuXG4gICAgICAgIHRoaXMuY2xhbXBzID0gW107XG4gICAgICAgIHRoaXMuc3VidHJhY3RzID0gW107XG4gICAgICAgIHRoaXMueGZhZGVycyA9IFtdO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgbnVtQ2FzZXMgLSAxOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLnhmYWRlcnNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlRHJ5V2V0Tm9kZSgpO1xuICAgICAgICAgICAgdGhpcy5zdWJ0cmFjdHNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoIGkpO1xuICAgICAgICAgICAgdGhpcy5jbGFtcHNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAsIDEgKTtcblxuICAgICAgICAgICAgaWYoIGkgPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS5kcnkgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0c1sgaSArIDEgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS53ZXQgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMueGZhZGVyc1sgaSAtIDEgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS5kcnkgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0c1sgaSArIDEgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS53ZXQgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5pbmRleC5jb25uZWN0KCB0aGlzLnN1YnRyYWN0c1sgaSBdICk7XG4gICAgICAgICAgICB0aGlzLnN1YnRyYWN0c1sgaSBdLmNvbm5lY3QoIHRoaXMuY2xhbXBzWyBpIF0gKTtcbiAgICAgICAgICAgIHRoaXMuY2xhbXBzWyBpIF0uY29ubmVjdCggdGhpcy54ZmFkZXJzWyBpIF0uY29udHJvbHMuZHJ5V2V0ICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnhmYWRlcnNbIHRoaXMueGZhZGVycy5sZW5ndGggLSAxIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDcm9zc2ZhZGVyID0gZnVuY3Rpb24oIG51bUNhc2VzLCBzdGFydGluZ0Nhc2UgKSB7XG4gICAgcmV0dXJuIG5ldyBDcm9zc2ZhZGVyKCB0aGlzLCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDcm9zc2ZhZGVyOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5pbXBvcnQgY29ubmVjdGlvbnMgZnJvbSBcIi4uL21peGlucy9jb25uZWN0aW9ucy5lczZcIjtcbmltcG9ydCBjbGVhbmVycyBmcm9tIFwiLi4vbWl4aW5zL2NsZWFuZXJzLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vLyBUaGlzIGZ1bmN0aW9uIGNyZWF0ZXMgYSBncmFwaCB0aGF0IGFsbG93cyBtb3JwaGluZ1xuLy8gYmV0d2VlbiB0d28gZ2FpbiBub2Rlcy5cbi8vXG4vLyBJdCBsb29rcyBhIGxpdHRsZSBiaXQgbGlrZSB0aGlzOlxuLy9cbi8vICAgICAgICAgICAgICAgICBkcnkgLT4gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tPiB8XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdlxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgdiAgR2FpbigwLTEpICAgIC0+ICAgICBHYWluKC0xKSAgICAgLT4gICAgIG91dHB1dFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGZhZGVyKSAgICAgICAgIChpbnZlcnQgcGhhc2UpICAgICAgICAoc3VtbWluZylcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgIF5cbi8vICAgIHdldCAtPiAgIEdhaW4oLTEpICAgLT4gLXxcbi8vICAgICAgICAgIChpbnZlcnQgcGhhc2UpXG4vL1xuLy8gV2hlbiBhZGp1c3RpbmcgdGhlIGZhZGVyJ3MgZ2FpbiB2YWx1ZSBpbiB0aGlzIGdyYXBoLFxuLy8gaW5wdXQxJ3MgZ2FpbiBsZXZlbCB3aWxsIGNoYW5nZSBmcm9tIDAgdG8gMSxcbi8vIHdoaWxzdCBpbnB1dDIncyBnYWluIGxldmVsIHdpbGwgY2hhbmdlIGZyb20gMSB0byAwLlxuY2xhc3MgRHJ5V2V0Tm9kZSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAyLCAxICk7XG5cbiAgICAgICAgdGhpcy5kcnkgPSB0aGlzLmlucHV0c1sgMCBdO1xuICAgICAgICB0aGlzLndldCA9IHRoaXMuaW5wdXRzWyAxIF07XG5cbiAgICAgICAgLy8gSW52ZXJ0IHdldCBzaWduYWwncyBwaGFzZVxuICAgICAgICB0aGlzLndldElucHV0SW52ZXJ0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy53ZXRJbnB1dEludmVydC5nYWluLnZhbHVlID0gLTE7XG4gICAgICAgIHRoaXMud2V0LmNvbm5lY3QoIHRoaXMud2V0SW5wdXRJbnZlcnQgKTtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGZhZGVyIG5vZGVcbiAgICAgICAgdGhpcy5mYWRlciA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZmFkZXIuZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb250cm9sIG5vZGUuIEl0IHNldHMgdGhlIGZhZGVyJ3MgdmFsdWUuXG4gICAgICAgIHRoaXMuZHJ5V2V0Q29udHJvbCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5kcnlXZXRDb250cm9sLmNvbm5lY3QoIHRoaXMuZmFkZXIuZ2FpbiApO1xuXG4gICAgICAgIC8vIEludmVydCB0aGUgZmFkZXIgbm9kZSdzIHBoYXNlXG4gICAgICAgIHRoaXMuZmFkZXJJbnZlcnQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmZhZGVySW52ZXJ0LmdhaW4udmFsdWUgPSAtMTtcblxuICAgICAgICAvLyBDb25uZWN0IGZhZGVyIHRvIGZhZGVyIHBoYXNlIGludmVyc2lvbixcbiAgICAgICAgLy8gYW5kIGZhZGVyIHBoYXNlIGludmVyc2lvbiB0byBvdXRwdXQuXG4gICAgICAgIHRoaXMud2V0SW5wdXRJbnZlcnQuY29ubmVjdCggdGhpcy5mYWRlciApO1xuICAgICAgICB0aGlzLmZhZGVyLmNvbm5lY3QoIHRoaXMuZmFkZXJJbnZlcnQgKTtcbiAgICAgICAgdGhpcy5mYWRlckludmVydC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgZHJ5IGlucHV0IHRvIGJvdGggdGhlIG91dHB1dCBhbmQgdGhlIGZhZGVyIG5vZGVcbiAgICAgICAgdGhpcy5kcnkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5kcnkuY29ubmVjdCggdGhpcy5mYWRlciApO1xuXG4gICAgICAgIC8vIEFkZCBhICdkcnlXZXQnIHByb3BlcnR5IHRvIHRoZSBjb250cm9scyBvYmplY3QuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZHJ5V2V0ID0gdGhpcy5kcnlXZXRDb250cm9sO1xuICAgIH1cblxufVxuXG5cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEcnlXZXROb2RlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBEcnlXZXROb2RlKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBEcnlXZXROb2RlO1xuIiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIEVRU2hlbGYgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGhpZ2hGcmVxdWVuY3kgPSAyNTAwLCBsb3dGcmVxdWVuY3kgPSAzNTAsIGhpZ2hCb29zdCA9IC02LCBsb3dCb29zdCA9IDAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuaGlnaEZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hGcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5sb3dGcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dGcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5oaWdoQm9vc3QgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoQm9vc3QgKTtcbiAgICAgICAgdGhpcy5sb3dCb29zdCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd0Jvb3N0ICk7XG5cbiAgICAgICAgdGhpcy5sb3dTaGVsZiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgICAgICAgdGhpcy5sb3dTaGVsZi50eXBlID0gJ2xvd3NoZWxmJztcbiAgICAgICAgdGhpcy5sb3dTaGVsZi5mcmVxdWVuY3kudmFsdWUgPSBsb3dGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMubG93U2hlbGYuZ2Fpbi52YWx1ZSA9IGxvd0Jvb3N0O1xuXG4gICAgICAgIHRoaXMuaGlnaFNoZWxmID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICB0aGlzLmhpZ2hTaGVsZi50eXBlID0gJ2hpZ2hzaGVsZic7XG4gICAgICAgIHRoaXMuaGlnaFNoZWxmLmZyZXF1ZW5jeS52YWx1ZSA9IGhpZ2hGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuaGlnaFNoZWxmLmdhaW4udmFsdWUgPSBoaWdoQm9vc3Q7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmxvd1NoZWxmICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5oaWdoU2hlbGYgKTtcbiAgICAgICAgdGhpcy5sb3dTaGVsZi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmhpZ2hTaGVsZi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIFN0b3JlIGNvbnRyb2xsYWJsZSBwYXJhbXMuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRPRE86XG4gICAgICAgIC8vICAtIFNob3VsZCB0aGVzZSBiZSByZWZlcmVuY2VzIHRvIHBhcmFtLmNvbnRyb2w/IFRoaXNcbiAgICAgICAgLy8gICAgbWlnaHQgYWxsb3cgZGVmYXVsdHMgdG8gYmUgc2V0IHdoaWxzdCBhbHNvIGFsbG93aW5nXG4gICAgICAgIC8vICAgIGF1ZGlvIHNpZ25hbCBjb250cm9sLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hGcmVxdWVuY3kgPSB0aGlzLmhpZ2hGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93RnJlcXVlbmN5ID0gdGhpcy5sb3dGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEJvb3N0ID0gdGhpcy5oaWdoQm9vc3Q7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93Qm9vc3QgPSB0aGlzLmxvd0Jvb3N0O1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVFUVNoZWxmID0gZnVuY3Rpb24oIGhpZ2hGcmVxdWVuY3ksIGxvd0ZyZXF1ZW5jeSwgaGlnaEJvb3N0LCBsb3dCb29zdCApIHtcbiAgICByZXR1cm4gbmV3IEVRU2hlbGYoIHRoaXMsIGhpZ2hGcmVxdWVuY3ksIGxvd0ZyZXF1ZW5jeSwgaGlnaEJvb3N0LCBsb3dCb29zdCApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRVFTaGVsZjsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgUGhhc2VPZmZzZXQgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMucmVjaXByb2NhbCA9IHRoaXMuaW8uY3JlYXRlUmVjaXByb2NhbCggdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKiAwLjUgKTtcbiAgICAgICAgdGhpcy5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5waGFzZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5oYWxmUGhhc2UgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAwLjUgKTtcblxuICAgICAgICB0aGlzLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5mcmVxdWVuY3kuY29ubmVjdCggdGhpcy5yZWNpcHJvY2FsICk7XG4gICAgICAgIHRoaXMucmVjaXByb2NhbC5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMucGhhc2UuY29ubmVjdCggdGhpcy5oYWxmUGhhc2UgKTtcbiAgICAgICAgdGhpcy5oYWxmUGhhc2UuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMSApO1xuICAgICAgICB0aGlzLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMuZGVsYXkuZGVsYXlUaW1lICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSAwLjU7XG5cbiAgICAgICAgLy8gU3RvcmUgY29udHJvbGxhYmxlIHBhcmFtcy5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5jb250cm9scy5waGFzZSA9IHRoaXMucGhhc2U7XG4gICAgfVxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBoYXNlT2Zmc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQaGFzZU9mZnNldCggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgUGhhc2VPZmZzZXQ7IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcbi8vIGltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBtYXRoIGZyb20gXCIuLi9taXhpbnMvbWF0aC5lczZcIjtcbi8vIGltcG9ydCBOb3RlIGZyb20gXCIuLi9ub3RlL05vdGUuZXM2XCI7XG4vLyBpbXBvcnQgQ2hvcmQgZnJvbSBcIi4uL25vdGUvQ2hvcmQuZXM2XCI7XG5cbi8vICBQbGF5ZXJcbi8vICA9PT09PT1cbi8vICBUYWtlcyBjYXJlIG9mIHJlcXVlc3RpbmcgR2VuZXJhdG9yTm9kZXMgYmUgY3JlYXRlZC5cbi8vXG4vLyAgSGFzOlxuLy8gICAgICAtIFBvbHlwaG9ueSAocGFyYW0pXG4vLyAgICAgIC0gVW5pc29uIChwYXJhbSlcbi8vICAgICAgLSBVbmlzb24gZGV0dW5lIChwYXJhbSlcbi8vICAgICAgLSBVbmlzb24gcGhhc2UgKHBhcmFtKVxuLy8gICAgICAtIEdsaWRlIG1vZGVcbi8vICAgICAgLSBHbGlkZSB0aW1lXG4vLyAgICAgIC0gVmVsb2NpdHkgc2Vuc2l0aXZpdHkgKHBhcmFtKVxuLy8gICAgICAtIEdsb2JhbCB0dW5pbmcgKHBhcmFtKVxuLy9cbi8vICBNZXRob2RzOlxuLy8gICAgICAtIHN0YXJ0KCBmcmVxL25vdGUsIHZlbCwgZGVsYXkgKVxuLy8gICAgICAtIHN0b3AoIGZyZXEvbm90ZSwgdmVsLCBkZWxheSApXG4vL1xuLy8gIFByb3BlcnRpZXM6XG4vLyAgICAgIC0gcG9seXBob255IChudW1iZXIsID4xKVxuLy8gICAgICAtIHVuaXNvbiAobnVtYmVyLCA+MSlcbi8vICAgICAgLSB1bmlzb25EZXR1bmUgKG51bWJlciwgY2VudHMpXG4vLyAgICAgIC0gdW5pc29uUGhhc2UgKG51bWJlciwgMC0xKVxuLy8gICAgICAtIGdsaWRlTW9kZSAoc3RyaW5nKVxuLy8gICAgICAtIGdsaWRlVGltZSAobXMsIG51bWJlcilcbi8vICAgICAgLSB2ZWxvY2l0eVNlbnNpdGl2aXR5ICgwLTEsIG51bWJlcilcbi8vICAgICAgLSB0dW5pbmcgKC02NCwgKzY0LCBzZW1pdG9uZXMpXG4vL1xuY2xhc3MgR2VuZXJhdG9yUGxheWVyIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBvcHRpb25zICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICBpZiAoIG9wdGlvbnMuZ2VuZXJhdG9yID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdHZW5lcmF0b3JQbGF5ZXIgcmVxdWlyZXMgYSBgZ2VuZXJhdG9yYCBvcHRpb24gdG8gYmUgZ2l2ZW4uJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSBvcHRpb25zLmdlbmVyYXRvcjtcblxuICAgICAgICB0aGlzLnBvbHlwaG9ueSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIG9wdGlvbnMucG9seXBob255IHx8IDEgKTtcblxuICAgICAgICB0aGlzLnVuaXNvbiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIG9wdGlvbnMudW5pc29uIHx8IDEgKTtcbiAgICAgICAgdGhpcy51bmlzb25EZXR1bmUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy51bmlzb25EZXR1bmUgPT09ICdudW1iZXInID8gb3B0aW9ucy51bmlzb25EZXR1bmUgOiAwICk7XG4gICAgICAgIHRoaXMudW5pc29uUGhhc2UgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy51bmlzb25QaGFzZSA9PT0gJ251bWJlcicgPyBvcHRpb25zLnVuaXNvblBoYXNlIDogMCApO1xuICAgICAgICB0aGlzLnVuaXNvbk1vZGUgPSBvcHRpb25zLnVuaXNvbk1vZGUgfHwgJ2NlbnRlcmVkJztcblxuICAgICAgICB0aGlzLmdsaWRlTW9kZSA9IG9wdGlvbnMuZ2xpZGVNb2RlIHx8ICdlcXVhbCc7XG4gICAgICAgIHRoaXMuZ2xpZGVUaW1lID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMuZ2xpZGVUaW1lID09PSAnbnVtYmVyJyA/IG9wdGlvbnMuZ2xpZGVUaW1lIDogMCApO1xuXG4gICAgICAgIHRoaXMudmVsb2NpdHlTZW5zaXRpdml0eSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHR5cGVvZiBvcHRpb25zLnZlbG9jaXR5U2Vuc2l0aXZpdHkgPT09ICdudW1iZXInID8gb3B0aW9ucy52ZWxvY2l0eVNlbnNpdGl2aXR5IDogMCApO1xuXG4gICAgICAgIHRoaXMudHVuaW5nID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMudHVuaW5nID09PSAnbnVtYmVyJyA/IG9wdGlvbnMudHVuaW5nIDogMCApO1xuXG4gICAgICAgIHRoaXMud2F2ZWZvcm0gPSBvcHRpb25zLndhdmVmb3JtIHx8ICdzaW5lJztcblxuICAgICAgICB0aGlzLmVudmVsb3BlID0gb3B0aW9ucy5lbnZlbG9wZSB8fCB0aGlzLmlvLmNyZWF0ZUFTRFJFbnZlbG9wZSgpO1xuXG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0cyA9IHt9O1xuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0ID0gW107XG4gICAgICAgIHRoaXMudGltZXJzID0gW107XG4gICAgfVxuXG5cbiAgICBfY3JlYXRlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZWZvcm0gKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRvci5jYWxsKCB0aGlzLmlvLCBmcmVxdWVuY3ksIGRldHVuZSArIHRoaXMudHVuaW5nLnZhbHVlICogMTAwLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlZm9ybSApO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogQ2FsY3VsYXRlcyB0aGUgYW1vdW50IG9mIGRldHVuZSAoY2VudHMpIHRvIGFwcGx5IHRvIGEgZ2VuZXJhdG9yIG5vZGVcbiAgICAgKiBnaXZlbiBhbiBpbmRleCBiZXR3ZWVuIDAgYW5kIHRoaXMudW5pc29uLnZhbHVlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHVuaXNvbkluZGV4IFVuaXNvbiBpbmRleC5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICAgICAgICAgIERldHVuZSB2YWx1ZSwgaW4gY2VudHMuXG4gICAgICovXG4gICAgX2NhbGN1bGF0ZURldHVuZSggdW5pc29uSW5kZXggKSB7XG4gICAgICAgIHZhciBkZXR1bmUgPSAwLjAsXG4gICAgICAgICAgICB1bmlzb25EZXR1bmUgPSB0aGlzLnVuaXNvbkRldHVuZS52YWx1ZTtcblxuICAgICAgICBpZiAoIHRoaXMudW5pc29uTW9kZSA9PT0gJ2NlbnRlcmVkJyApIHtcbiAgICAgICAgICAgIHZhciBpbmNyID0gdW5pc29uRGV0dW5lO1xuXG4gICAgICAgICAgICBkZXR1bmUgPSBpbmNyICogdW5pc29uSW5kZXg7XG4gICAgICAgICAgICBkZXR1bmUgLT0gaW5jciAqICggdGhpcy51bmlzb24udmFsdWUgKiAwLjUgKTtcbiAgICAgICAgICAgIGRldHVuZSArPSBpbmNyICogMC41O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIG11bHRpcGxpZXI7XG5cbiAgICAgICAgICAgIC8vIExlYXZlIHRoZSBmaXJzdCBub3RlIGluIHRoZSB1bmlzb25cbiAgICAgICAgICAgIC8vIGFsb25lLCBzbyBpdCdzIGRldHVuZSB2YWx1ZSBpcyB0aGUgcm9vdFxuICAgICAgICAgICAgLy8gbm90ZS5cbiAgICAgICAgICAgIGlmICggdW5pc29uSW5kZXggPiAwICkge1xuICAgICAgICAgICAgICAgIC8vIEhvcCBkb3duIG5lZ2F0aXZlIGhhbGYgdGhlIHVuaXNvbkluZGV4XG4gICAgICAgICAgICAgICAgaWYgKCB1bmlzb25JbmRleCAlIDIgPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIG11bHRpcGxpZXIgPSAtdW5pc29uSW5kZXggKiAwLjU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBIb3AgdXAgbiBjZW50c1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHVuaXNvbkluZGV4ID4gMSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXNvbkluZGV4ID0gdGhpcy5NYXRoLnJvdW5kVG9NdWx0aXBsZSggdW5pc29uSW5kZXgsIDIgKSAtIDI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBtdWx0aXBsaWVyID0gdW5pc29uSW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSB0aGUgbXVsdGlwbGllciwgY2FsY3VsYXRlIHRoZSBkZXR1bmUgdmFsdWVcbiAgICAgICAgICAgICAgICAvLyBmb3IgdGhlIGdpdmVuIHVuaXNvbkluZGV4LlxuICAgICAgICAgICAgICAgIGRldHVuZSA9IHVuaXNvbkRldHVuZSAqIG11bHRpcGxpZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGV0dW5lO1xuICAgIH1cblxuICAgIF9jYWxjdWxhdGVHbGlkZVRpbWUoIG9sZEZyZXEsIG5ld0ZyZXEgKSB7XG4gICAgICAgIHZhciBtb2RlID0gdGhpcy5nbGlkZU1vZGUsXG4gICAgICAgICAgICB0aW1lID0gdGhpcy5nbGlkZVRpbWUudmFsdWUsXG4gICAgICAgICAgICBnbGlkZVRpbWUsXG4gICAgICAgICAgICBmcmVxRGlmZmVyZW5jZTtcblxuICAgICAgICBpZiAoIHRpbWUgPT09IDAuMCApIHtcbiAgICAgICAgICAgIGdsaWRlVGltZSA9IDAuMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggbW9kZSA9PT0gJ2VxdWFsJyApIHtcbiAgICAgICAgICAgIGdsaWRlVGltZSA9IHRpbWUgKiAwLjAwMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZyZXFEaWZmZXJlbmNlID0gTWF0aC5hYnMoIG9sZEZyZXEgLSBuZXdGcmVxICk7XG4gICAgICAgICAgICBmcmVxRGlmZmVyZW5jZSA9IHRoaXMuTWF0aC5jbGFtcCggZnJlcURpZmZlcmVuY2UsIDAsIDUwMCApO1xuICAgICAgICAgICAgZ2xpZGVUaW1lID0gdGhpcy5NYXRoLnNjYWxlTnVtYmVyRXhwKFxuICAgICAgICAgICAgICAgIGZyZXFEaWZmZXJlbmNlLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgNTAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgdGltZVxuICAgICAgICAgICAgKSAqIDAuMDAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdsaWRlVGltZTtcbiAgICB9XG5cblxuICAgIF9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBnZW5lcmF0b3JPYmplY3QgKSB7XG4gICAgICAgIHZhciBvYmplY3RzID0gdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzO1xuXG4gICAgICAgIG9iamVjdHNbIGZyZXF1ZW5jeSBdID0gb2JqZWN0c1sgZnJlcXVlbmN5IF0gfHwgW107XG4gICAgICAgIG9iamVjdHNbIGZyZXF1ZW5jeSBdLnVuc2hpZnQoIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0LnVuc2hpZnQoIGdlbmVyYXRvck9iamVjdCApO1xuICAgIH1cblxuICAgIF9mZXRjaEdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5ICkge1xuICAgICAgICB2YXIgb2JqZWN0cyA9IHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c1sgZnJlcXVlbmN5IF0sXG4gICAgICAgICAgICBpbmRleCA9IDA7XG5cbiAgICAgICAgaWYgKCAhb2JqZWN0cyB8fCBvYmplY3RzLmxlbmd0aCA9PT0gMCApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5wb3AoKTtcbiAgICAgICAgcmV0dXJuIG9iamVjdHMucG9wKCk7XG4gICAgfVxuXG4gICAgX2ZldGNoR2VuZXJhdG9yT2JqZWN0VG9SZXVzZSgpIHtcbiAgICAgICAgdmFyIGdlbmVyYXRvciA9IHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQucG9wKCksXG4gICAgICAgICAgICBmcmVxdWVuY3k7XG5cbiAgICAgICAgY29uc29sZS5sb2coICdyZXVzZScsIGdlbmVyYXRvciApO1xuXG4gICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggZ2VuZXJhdG9yICkgKSB7XG4gICAgICAgICAgICBmcmVxdWVuY3kgPSBnZW5lcmF0b3JbIDAgXS5mcmVxdWVuY3k7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGdlbmVyYXRvci5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVudmVsb3BlLmZvcmNlU3RvcCggZ2VuZXJhdG9yWyBpIF0ub3V0cHV0c1sgMCBdLmdhaW4gKTtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoIGdlbmVyYXRvclsgaSBdLnRpbWVyICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmcmVxdWVuY3kgPSBnZW5lcmF0b3IuZnJlcXVlbmN5O1xuICAgICAgICAgICAgdGhpcy5lbnZlbG9wZS5mb3JjZVN0b3AoIGdlbmVyYXRvci5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KCBnZW5lcmF0b3IudGltZXIgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c1sgZnJlcXVlbmN5IF0ucG9wKCk7XG5cbiAgICAgICAgcmV0dXJuIGdlbmVyYXRvcjtcbiAgICB9XG5cblxuICAgIF9zdGFydEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApIHtcbiAgICAgICAgZ2VuZXJhdG9yT2JqZWN0Lm91dHB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmVudmVsb3BlLnN0YXJ0KCBnZW5lcmF0b3JPYmplY3Qub3V0cHV0c1sgMCBdLmdhaW4sIGRlbGF5ICk7XG4gICAgICAgIGdlbmVyYXRvck9iamVjdC5zdGFydCggZGVsYXkgKTtcbiAgICB9XG5cbiAgICBfc3RhcnRTaW5nbGUoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICkge1xuICAgICAgICB2YXIgdW5pc29uID0gdGhpcy51bmlzb24udmFsdWUsXG4gICAgICAgICAgICBkZXR1bmUgPSAwLjAsXG4gICAgICAgICAgICB1bmlzb25HZW5lcmF0b3JBcnJheSxcbiAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCxcbiAgICAgICAgICAgIGFjdGl2ZUdlbmVyYXRvckNvdW50ID0gdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5sZW5ndGgsXG4gICAgICAgICAgICBleGlzdGluZ0ZyZXF1ZW5jeSxcbiAgICAgICAgICAgIGdsaWRlVGltZSA9IDAuMDtcblxuICAgICAgICBpZiAoIGFjdGl2ZUdlbmVyYXRvckNvdW50IDwgdGhpcy5wb2x5cGhvbnkudmFsdWUgKSB7XG4gICAgICAgICAgICBpZiAoIHVuaXNvbiA9PT0gMS4wICkge1xuICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2NyZWF0ZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHRoaXMud2F2ZWZvcm0gKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdW5pc29uR2VuZXJhdG9yQXJyYXkgPSBbXTtcblxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHVuaXNvbjsgKytpICkge1xuICAgICAgICAgICAgICAgICAgICBkZXR1bmUgPSB0aGlzLl9jYWxjdWxhdGVEZXR1bmUoIGkgKTtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fY3JlYXRlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgdGhpcy53YXZlZm9ybSApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApO1xuICAgICAgICAgICAgICAgICAgICB1bmlzb25HZW5lcmF0b3JBcnJheS5wdXNoKCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCB1bmlzb25HZW5lcmF0b3JBcnJheSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoIHVuaXNvbiA9PT0gMS4wICkge1xuICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2ZldGNoR2VuZXJhdG9yT2JqZWN0VG9SZXVzZSgpO1xuICAgICAgICAgICAgICAgIGV4aXN0aW5nRnJlcXVlbmN5ID0gZ2VuZXJhdG9yT2JqZWN0LmZyZXF1ZW5jeTtcbiAgICAgICAgICAgICAgICBnbGlkZVRpbWUgPSB0aGlzLl9jYWxjdWxhdGVHbGlkZVRpbWUoIGV4aXN0aW5nRnJlcXVlbmN5LCBmcmVxdWVuY3kgKTtcblxuICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdC5yZXNldCggZnJlcXVlbmN5LCBkZXR1bmUgKyB0aGlzLnR1bmluZy52YWx1ZSAqIDEwMCwgdmVsb2NpdHksIGdsaWRlVGltZSApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fZmV0Y2hHZW5lcmF0b3JPYmplY3RUb1JldXNlKCk7XG4gICAgICAgICAgICAgICAgZXhpc3RpbmdGcmVxdWVuY3kgPSBnZW5lcmF0b3JPYmplY3RbIDAgXS5mcmVxdWVuY3k7XG4gICAgICAgICAgICAgICAgZ2xpZGVUaW1lID0gdGhpcy5fY2FsY3VsYXRlR2xpZGVUaW1lKCBleGlzdGluZ0ZyZXF1ZW5jeSwgZnJlcXVlbmN5ICk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB1bmlzb247ICsraSApIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0dW5lID0gdGhpcy5fY2FsY3VsYXRlRGV0dW5lKCBpICk7XG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdFsgaSBdLnJlc2V0KCBmcmVxdWVuY3ksIGRldHVuZSArIHRoaXMudHVuaW5nLnZhbHVlICogMTAwLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXR1cm4gdGhlIGdlbmVyYXRlZCBvYmplY3QocykgaW4gY2FzZSB0aGV5J3JlIG5lZWRlZC5cbiAgICAgICAgcmV0dXJuIHVuaXNvbkdlbmVyYXRvckFycmF5ID8gdW5pc29uR2VuZXJhdG9yQXJyYXkgOiBnZW5lcmF0b3JPYmplY3Q7XG4gICAgfVxuXG4gICAgc3RhcnQoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICkge1xuICAgICAgICB2YXIgZnJlcSA9IDAsXG4gICAgICAgICAgICB2ZWxvY2l0eVNlbnNpdGl2aXR5ID0gdGhpcy52ZWxvY2l0eVNlbnNpdGl2aXR5LnZhbHVlO1xuXG4gICAgICAgIHZlbG9jaXR5ID0gdHlwZW9mIHZlbG9jaXR5ID09PSAnbnVtYmVyJyA/IHZlbG9jaXR5IDogMTtcbiAgICAgICAgZGVsYXkgPSB0eXBlb2YgZGVsYXkgPT09ICdudW1iZXInID8gZGVsYXkgOiAwO1xuXG5cbiAgICAgICAgaWYgKCB2ZWxvY2l0eVNlbnNpdGl2aXR5ICE9PSAwICkge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSB0aGlzLk1hdGguc2NhbGVOdW1iZXIoIHZlbG9jaXR5LCAwLCAxLCAwLjUgLSB2ZWxvY2l0eVNlbnNpdGl2aXR5ICogMC41LCAwLjUgKyB2ZWxvY2l0eVNlbnNpdGl2aXR5ICogMC41IClcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gMC41O1xuICAgICAgICB9XG5cblxuICAgICAgICBpZiAoIHR5cGVvZiBmcmVxdWVuY3kgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5fc3RhcnRTaW5nbGUoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZWxzZSBpZiAoIGZyZXF1ZW5jeSBpbnN0YW5jZW9mIE5vdGUgKSB7XG4gICAgICAgIC8vICAgICBmcmVxID0gZnJlcXVlbmN5LnZhbHVlSHo7XG4gICAgICAgIC8vICAgICB0aGlzLl9zdGFydFNpbmdsZSggZnJlcSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gZWxzZSBpZiAoIGZyZXF1ZW5jeSBpbnN0YW5jZW9mIENob3JkICkge1xuICAgICAgICAvLyAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgZnJlcXVlbmN5Lm5vdGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAvLyAgICAgICAgIGZyZXEgPSBmcmVxdWVuY3kubm90ZXNbIGkgXS52YWx1ZUh6O1xuICAgICAgICAvLyAgICAgICAgIHRoaXMuX3N0YXJ0U2luZ2xlKCBmcmVxLCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG5cbiAgICBfc3RvcEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuZW52ZWxvcGUuc3RvcCggZ2VuZXJhdG9yT2JqZWN0Lm91dHB1dHNbIDAgXS5nYWluLCBkZWxheSApO1xuXG4gICAgICAgIGdlbmVyYXRvck9iamVjdC50aW1lciA9IHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gc2VsZi5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5wb3AoKTtcbiAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdC5zdG9wKCBkZWxheSApO1xuICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LmNsZWFuVXAoKTtcbiAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IG51bGw7XG4gICAgICAgIH0sIGRlbGF5ICogMTAwMCArIHRoaXMuZW52ZWxvcGUudG90YWxTdG9wVGltZSAqIDEwMDAgKyAxMDAgKTtcbiAgICB9XG5cbiAgICBfc3RvcFNpbmdsZSggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKSB7XG4gICAgICAgIHZhciBnZW5lcmF0b3JPYmplY3QgPSB0aGlzLl9mZXRjaEdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5ICk7XG5cbiAgICAgICAgaWYgKCBnZW5lcmF0b3JPYmplY3QgKSB7XG4gICAgICAgICAgICAvLyBTdG9wIGdlbmVyYXRvcnMgZm9ybWVkIHdoZW4gdW5pc29uIHdhcyA+IDEgYXQgdGltZSBvZiBzdGFydCguLi4pXG4gICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGdlbmVyYXRvck9iamVjdCApICkge1xuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gZ2VuZXJhdG9yT2JqZWN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdG9wR2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3RbIGkgXSwgZGVsYXkgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9wR2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSBudWxsO1xuICAgIH1cblxuICAgIHN0b3AoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICkge1xuICAgICAgICB2ZWxvY2l0eSA9IHR5cGVvZiB2ZWxvY2l0eSA9PT0gJ251bWJlcicgPyB2ZWxvY2l0eSA6IDA7XG4gICAgICAgIGRlbGF5ID0gdHlwZW9mIGRlbGF5ID09PSAnbnVtYmVyJyA/IGRlbGF5IDogMDtcblxuICAgICAgICBpZiAoIHR5cGVvZiBmcmVxdWVuY3kgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5fc3RvcFNpbmdsZSggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBlbHNlIGlmICggZnJlcXVlbmN5IGluc3RhbmNlb2YgTm90ZSApIHtcbiAgICAgICAgLy8gICAgIGZyZXEgPSBmcmVxdWVuY3kudmFsdWVIejtcbiAgICAgICAgLy8gICAgIHRoaXMuX3N0b3BTaW5nbGUoIGZyZXEsIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGVsc2UgaWYgKCBmcmVxdWVuY3kgaW5zdGFuY2VvZiBDaG9yZCApIHtcbiAgICAgICAgLy8gICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGZyZXF1ZW5jeS5ub3Rlcy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgLy8gICAgICAgICBmcmVxID0gZnJlcXVlbmN5Lm5vdGVzWyBpIF0udmFsdWVIejtcbiAgICAgICAgLy8gICAgICAgICB0aGlzLl9zdG9wU2luZ2xlKCBmcmVxLCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuXG4vLyBBdWRpb0lPLm1peGluU2luZ2xlKCBHZW5lcmF0b3JQbGF5ZXIucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5HZW5lcmF0b3JQbGF5ZXIucHJvdG90eXBlLk1hdGggPSBtYXRoO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVHZW5lcmF0b3JQbGF5ZXIgPSBmdW5jdGlvbiggb3B0aW9ucyApIHtcbiAgICByZXR1cm4gbmV3IEdlbmVyYXRvclBsYXllciggdGhpcywgb3B0aW9ucyApO1xufTsiLCJ3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuXG5pbXBvcnQgQXVkaW9JTyBmcm9tICcuL2NvcmUvQXVkaW9JTy5lczYnO1xuXG5pbXBvcnQgTm9kZSBmcm9tICcuL2NvcmUvTm9kZS5lczYnO1xuaW1wb3J0IFBhcmFtIGZyb20gJy4vY29yZS9QYXJhbS5lczYnO1xuaW1wb3J0ICcuL2NvcmUvV2F2ZVNoYXBlci5lczYnO1xuXG5cbi8vIGltcG9ydCAnLi9ncmFwaHMvQ3Jvc3NmYWRlci5lczYnO1xuXG5pbXBvcnQgJy4vZngvRGVsYXkuZXM2JztcbmltcG9ydCAnLi9meC9QaW5nUG9uZ0RlbGF5LmVzNic7XG5pbXBvcnQgJy4vZngvU2luZVNoYXBlci5lczYnO1xuaW1wb3J0ICcuL2Z4L1N0ZXJlb1dpZHRoLmVzNic7XG5pbXBvcnQgJy4vZngvU3RlcmVvUm90YXRpb24uZXM2Jztcbi8vIGltcG9ydCAnLi9meC9CaXRSZWR1Y3Rpb24uZXM2JztcbmltcG9ydCAnLi9meC9TY2hyb2VkZXJBbGxQYXNzLmVzNic7XG5cbmltcG9ydCAnLi9nZW5lcmF0b3JzL09zY2lsbGF0b3JHZW5lcmF0b3IuZXM2JztcbmltcG9ydCAnLi9pbnN0cnVtZW50cy9HZW5lcmF0b3JQbGF5ZXIuZXM2JztcblxuXG5pbXBvcnQgJy4vbWF0aC90cmlnb25vbWV0cnkvRGVnVG9SYWQuZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9TaW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9Db3MuZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9UYW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9SYWRUb0RlZy5lczYnO1xuXG5cbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0VxdWFsVG8uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0VxdWFsVG9aZXJvLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvR3JlYXRlclRoYW5aZXJvLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9JZkVsc2UuZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhblplcm8uZXM2JztcblxuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTG9naWNhbE9wZXJhdG9yLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9BTkQuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL09SLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OT1QuZXM2JztcblxuaW1wb3J0ICcuL21hdGgvQWJzLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9BZGQuZXM2JztcbmltcG9ydCAnLi9tYXRoL0F2ZXJhZ2UuZXM2JztcbmltcG9ydCAnLi9tYXRoL0NsYW1wLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9Db25zdGFudC5lczYnO1xuaW1wb3J0ICcuL21hdGgvRGl2aWRlLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9GbG9vci5lczYnO1xuaW1wb3J0ICcuL21hdGgvTWF4LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9NaW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL011bHRpcGx5LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9OZWdhdGUuZXM2JztcbmltcG9ydCAnLi9tYXRoL1Bvdy5lczYnO1xuaW1wb3J0ICcuL21hdGgvUmVjaXByb2NhbC5lczYnO1xuaW1wb3J0ICcuL21hdGgvUm91bmQuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NjYWxlLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TY2FsZUV4cC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU2lnbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3FydC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3VidHJhY3QuZXM2JztcbmltcG9ydCAnLi9tYXRoL1N3aXRjaC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3F1YXJlLmVzNic7XG5cbmltcG9ydCAnLi9tYXRoL0xlcnAuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NhbXBsZURlbGF5LmVzNic7XG5cbmltcG9ydCAnLi9lbnZlbG9wZXMvQ3VzdG9tRW52ZWxvcGUuZXM2JztcbmltcG9ydCAnLi9lbnZlbG9wZXMvQVNEUkVudmVsb3BlLmVzNic7XG5cbmltcG9ydCAnLi9ncmFwaHMvRVFTaGVsZi5lczYnO1xuLy8gaW1wb3J0ICcuL2dyYXBocy9EaWZmdXNlRGVsYXkuZXM2JztcbmltcG9ydCAnLi9ncmFwaHMvQ291bnRlci5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9EcnlXZXROb2RlLmVzNic7XG5pbXBvcnQgJy4vZ3JhcGhzL1BoYXNlT2Zmc2V0LmVzNic7XG5pbXBvcnQgJy4vZ3JhcGhzL0Nyb3NzZmFkZXIuZXM2JztcblxuXG5pbXBvcnQgJy4vb3NjaWxsYXRvcnMvT3NjaWxsYXRvckJhbmsuZXM2JztcbmltcG9ydCAnLi9vc2NpbGxhdG9ycy9Ob2lzZU9zY2lsbGF0b3IuZXM2JztcbmltcG9ydCAnLi9vc2NpbGxhdG9ycy9GTU9zY2lsbGF0b3IuZXM2JztcbmltcG9ydCAnLi9vc2NpbGxhdG9ycy9TaW5lQmFuay5lczYnO1xuXG4vLyBpbXBvcnQgJy4vZ3JhcGhzL1NrZXRjaC5lczYnO1xuXG53aW5kb3cuUGFyYW0gPSBQYXJhbTtcbndpbmRvdy5Ob2RlID0gTm9kZTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG52YXIgU0hBUEVSUyA9IHt9O1xuXG5mdW5jdGlvbiBnZW5lcmF0ZVNoYXBlckN1cnZlKCBzaXplICkge1xuICAgIHZhciBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoIHNpemUgKSxcbiAgICAgICAgaSA9IDAsXG4gICAgICAgIHggPSAwO1xuXG4gICAgZm9yICggaTsgaSA8IHNpemU7ICsraSApIHtcbiAgICAgICAgeCA9ICggaSAvIHNpemUgKSAqIDIgLSAxO1xuICAgICAgICBhcnJheVsgaSBdID0gTWF0aC5hYnMoIHggKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJyYXk7XG59XG5cbmNsYXNzIEFicyBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCBhY2N1cmFjeSA9IDEwICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyB2YXIgZ2FpbkFjY3VyYWN5ID0gYWNjdXJhY3kgKiAxMDA7XG4gICAgICAgIHZhciBnYWluQWNjdXJhY3kgPSBNYXRoLnBvdyggYWNjdXJhY3ksIDIgKSxcbiAgICAgICAgICAgIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpLFxuICAgICAgICAgICAgc2l6ZSA9IDEwMjQgKiBhY2N1cmFjeTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAxIC8gZ2FpbkFjY3VyYWN5O1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gZ2FpbkFjY3VyYWN5O1xuXG4gICAgICAgIC8vIFRvIHNhdmUgY3JlYXRpbmcgbmV3IHNoYXBlciBjdXJ2ZXMgKHRoYXQgY2FuIGJlIHF1aXRlIGxhcmdlISlcbiAgICAgICAgLy8gZWFjaCB0aW1lIGFuIGluc3RhbmNlIG9mIEFicyBpcyBjcmVhdGVkLCBzaGFwZXIgY3VydmVzXG4gICAgICAgIC8vIGFyZSBzdG9yZWQgaW4gdGhlIFNIQVBFUlMgb2JqZWN0IGFib3ZlLiBUaGUga2V5cyB0byB0aGVcbiAgICAgICAgLy8gU0hBUEVSUyBvYmplY3QgYXJlIHRoZSBiYXNlIHdhdmV0YWJsZSBjdXJ2ZSBzaXplICgxMDI0KVxuICAgICAgICAvLyBtdWx0aXBsaWVkIGJ5IHRoZSBhY2N1cmFjeSBhcmd1bWVudC5cbiAgICAgICAgaWYoICFTSEFQRVJTWyBzaXplIF0gKSB7XG4gICAgICAgICAgICBTSEFQRVJTWyBzaXplIF0gPSBnZW5lcmF0ZVNoYXBlckN1cnZlKCBzaXplICk7XG4gICAgICAgIH1cblxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIFNIQVBFUlNbIHNpemUgXSApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUFicyA9IGZ1bmN0aW9uKCBhY2N1cmFjeSApIHtcbiAgICByZXR1cm4gbmV3IEFicyggdGhpcywgYWNjdXJhY3kgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBBZGRzIHR3byBhdWRpbyBzaWduYWxzIHRvZ2V0aGVyLlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKlxuICogdmFyIGFkZCA9IGlvLmNyZWF0ZUFkZCggMiApO1xuICogaW4xLmNvbm5lY3QoIGFkZCApO1xuICpcbiAqIHZhciBhZGQgPSBpby5jcmVhdGVBZGQoKTtcbiAqIGluMS5jb25uZWN0KCBhZGQsIDAsIDAgKTtcbiAqIGluMi5jb25uZWN0KCBhZGQsIDAsIDEgKTtcbiAqL1xuY2xhc3MgQWRkIGV4dGVuZHMgTm9kZXtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgXHRyZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICBcdHRoaXMuY29udHJvbHMudmFsdWUudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQWRkID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgQWRkKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbi8qXG4gICAgVGhlIGF2ZXJhZ2UgdmFsdWUgb2YgYSBzaWduYWwgaXMgY2FsY3VsYXRlZFxuICAgIGJ5IHBpcGluZyB0aGUgaW5wdXQgaW50byBhIHJlY3RpZmllciB0aGVuIGludG9cbiAgICBhIHNlcmllcyBvZiBEZWxheU5vZGVzLiBFYWNoIERlbGF5Tm9kZVxuICAgIGhhcyBpdCdzIGBkZWxheVRpbWVgIGNvbnRyb2xsZWQgYnkgZWl0aGVyIHRoZVxuICAgIGBzYW1wbGVTaXplYCBhcmd1bWVudCBvciB0aGUgaW5jb21pbmcgdmFsdWUgb2ZcbiAgICB0aGUgYGNvbnRyb2xzLnNhbXBsZVNpemVgIG5vZGUuIFRoZSBkZWxheVRpbWVcbiAgICBpcyB0aGVyZWZvcmUgbWVhc3VyZWQgaW4gc2FtcGxlcy5cblxuICAgIEVhY2ggZGVsYXkgaXMgY29ubmVjdGVkIHRvIGEgR2Fpbk5vZGUgdGhhdCB3b3Jrc1xuICAgIGFzIGEgc3VtbWluZyBub2RlLiBUaGUgc3VtbWluZyBub2RlJ3MgdmFsdWUgaXNcbiAgICB0aGVuIGRpdmlkZWQgYnkgdGhlIG51bWJlciBvZiBkZWxheXMgdXNlZCBiZWZvcmVcbiAgICBiZWluZyBzZW50IG9uIGl0cyBtZXJyeSB3YXkgdG8gdGhlIG91dHB1dC5cblxuICAgIE5vdGU6XG4gICAgSGlnaCB2YWx1ZXMgZm9yIGBudW1TYW1wbGVzYCB3aWxsIGJlIGV4cGVuc2l2ZSxcbiAgICBhcyB0aGF0IG1hbnkgRGVsYXlOb2RlcyB3aWxsIGJlIGNyZWF0ZWQuIENvbnNpZGVyXG4gICAgaW5jcmVhc2luZyB0aGUgYHNhbXBsZVNpemVgIGFuZCB1c2luZyBhIGxvdyB2YWx1ZVxuICAgIGZvciBgbnVtU2FtcGxlc2AuXG5cbiAgICBHcmFwaDpcbiAgICA9PT09PT1cbiAgICBpbnB1dCAtPlxuICAgICAgICBhYnMvcmVjdGlmeSAtPlxuICAgICAgICAgICAgYG51bVNhbXBsZXNgIG51bWJlciBvZiBkZWxheXMsIGluIHNlcmllcyAtPlxuICAgICAgICAgICAgICAgIHN1bSAtPlxuICAgICAgICAgICAgICAgICAgICBkaXZpZGUgYnkgYG51bVNhbXBsZXNgIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuXG4gKi9cbmNsYXNzIEF2ZXJhZ2UgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtU2FtcGxlcyA9IDEwLCBzYW1wbGVTaXplICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubnVtU2FtcGxlcyA9IG51bVNhbXBsZXM7XG5cbiAgICAgICAgLy8gQWxsIERlbGF5Tm9kZXMgd2lsbCBiZSBzdG9yZWQgaGVyZS5cbiAgICAgICAgZ3JhcGguZGVsYXlzID0gW107XG4gICAgICAgIGdyYXBoLmFicyA9IHRoaXMuaW8uY3JlYXRlQWJzKCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguYWJzICk7XG4gICAgICAgIGdyYXBoLnNhbXBsZVNpemUgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuc2FtcGxlU2l6ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHNhbXBsZVNpemUgKTtcbiAgICAgICAgZ3JhcGguc2FtcGxlU2l6ZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnNhbXBsZVNpemUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICAvLyBUaGlzIGlzIGEgcmVsYXRpdmVseSBleHBlbnNpdmUgY2FsY3VsYXRpb25cbiAgICAgICAgLy8gd2hlbiBjb21wYXJlZCB0byBkb2luZyBhIG11Y2ggc2ltcGxlciByZWNpcHJvY2FsIG11bHRpcGx5LlxuICAgICAgICAvLyB0aGlzLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCBudW1TYW1wbGVzLCB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSAqIDAuNSApO1xuXG4gICAgICAgIC8vIEF2b2lkIHRoZSBtb3JlIGV4cGVuc2l2ZSBkaXZpc2lvbiBhYm92ZSBieVxuICAgICAgICAvLyBtdWx0aXBseWluZyB0aGUgc3VtIGJ5IHRoZSByZWNpcHJvY2FsIG9mIG51bVNhbXBsZXMuXG4gICAgICAgIGdyYXBoLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIDEgLyBudW1TYW1wbGVzICk7XG4gICAgICAgIGdyYXBoLnN1bSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgZ3JhcGguc3VtLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSApO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuXG5cbiAgICAgICAgLy8gVHJpZ2dlciB0aGUgc2V0dGVyIGZvciBgbnVtU2FtcGxlc2AgdGhhdCB3aWxsIGNyZWF0ZVxuICAgICAgICAvLyB0aGUgZGVsYXkgc2VyaWVzLlxuICAgICAgICB0aGlzLm51bVNhbXBsZXMgPSBncmFwaC5udW1TYW1wbGVzO1xuICAgIH1cblxuICAgIGdldCBudW1TYW1wbGVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLm51bVNhbXBsZXM7XG4gICAgfVxuXG4gICAgc2V0IG51bVNhbXBsZXMoIG51bVNhbXBsZXMgKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKSxcbiAgICAgICAgICAgIGRlbGF5cyA9IGdyYXBoLmRlbGF5cztcblxuICAgICAgICAvLyBEaXNjb25uZWN0IGFuZCBudWxsaWZ5IGFueSBleGlzdGluZyBkZWxheSBub2Rlcy5cbiAgICAgICAgdGhpcy5fY2xlYW5VcFNpbmdsZSggZGVsYXlzICk7XG5cbiAgICAgICAgZ3JhcGgubnVtU2FtcGxlcyA9IG51bVNhbXBsZXM7XG4gICAgICAgIGdyYXBoLmRpdmlkZS52YWx1ZSA9IDEgLyBudW1TYW1wbGVzO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwLCBub2RlID0gZ3JhcGguYWJzOyBpIDwgbnVtU2FtcGxlczsgKytpICkge1xuICAgICAgICAgICAgdmFyIGRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgICAgICBkZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggZGVsYXkuZGVsYXlUaW1lICk7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QoIGRlbGF5ICk7XG4gICAgICAgICAgICBkZWxheS5jb25uZWN0KCBncmFwaC5zdW0gKTtcbiAgICAgICAgICAgIGdyYXBoLmRlbGF5cy5wdXNoKCBkZWxheSApO1xuICAgICAgICAgICAgbm9kZSA9IGRlbGF5O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUF2ZXJhZ2UgPSBmdW5jdGlvbiggbnVtU2FtcGxlcywgc2FtcGxlU2l6ZSApIHtcbiAgICByZXR1cm4gbmV3IEF2ZXJhZ2UoIHRoaXMsIG51bVNhbXBsZXMsIHNhbXBsZVNpemUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBDbGFtcCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbWluVmFsdWUsIG1heFZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTsgLy8gaW8sIDEsIDFcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubWluID0gdGhpcy5pby5jcmVhdGVNaW4oIG1heFZhbHVlICk7XG4gICAgICAgIGdyYXBoLm1heCA9IHRoaXMuaW8uY3JlYXRlTWF4KCBtaW5WYWx1ZSApO1xuXG4gICAgICAgIC8vIHRoaXMuaW5wdXRzID0gWyBncmFwaC5taW4gXTtcbiAgICAgICAgLy8gdGhpcy5vdXRwdXRzID0gWyBncmFwaC5tYXggXTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5taW4gKTtcbiAgICAgICAgZ3JhcGgubWluLmNvbm5lY3QoIGdyYXBoLm1heCApO1xuICAgICAgICBncmFwaC5tYXguY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLm1pbiA9IGdyYXBoLm1pbi5jb250cm9scy52YWx1ZTtcbiAgICAgICAgdGhpcy5jb250cm9scy5tYXggPSBncmFwaC5tYXguY29udHJvbHMudmFsdWU7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgbWluKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLm1heC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IG1pbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5tYXgudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgbWF4KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLm1pbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IG1heCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5taW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDbGFtcCA9IGZ1bmN0aW9uKCBtaW5WYWx1ZSwgbWF4VmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDbGFtcCggdGhpcywgbWluVmFsdWUsIG1heFZhbHVlICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gJy4uL2NvcmUvQXVkaW9JTy5lczYnO1xuaW1wb3J0IE5vZGUgZnJvbSAnLi4vY29yZS9Ob2RlLmVzNic7XG5cbmNsYXNzIENvbnN0YW50IGV4dGVuZHMgTm9kZSB7XG4gICAgLyoqXG4gICAgICogQSBjb25zdGFudC1yYXRlIGF1ZGlvIHNpZ25hbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyAgICBJbnN0YW5jZSBvZiBBdWRpb0lPXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIFZhbHVlIG9mIHRoZSBjb25zdGFudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgPSAwLjAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInID8gdmFsdWUgOiAwO1xuICAgICAgICB0aGlzLmlvLmNvbnN0YW50RHJpdmVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnQgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDb25zdGFudCggdGhpcywgdmFsdWUgKTtcbn07XG5cblxuLy8gQSBidW5jaCBvZiBwcmVzZXQgY29uc3RhbnRzLlxuKGZ1bmN0aW9uKCkge1xuICAgIHZhciBFLFxuICAgICAgICBQSSxcbiAgICAgICAgUEkyLFxuICAgICAgICBMTjEwLFxuICAgICAgICBMTjIsXG4gICAgICAgIExPRzEwRSxcbiAgICAgICAgTE9HMkUsXG4gICAgICAgIFNRUlQxXzIsXG4gICAgICAgIFNRUlQyO1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRFID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gRSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkUgKTtcbiAgICAgICAgRSA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudFBJID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gUEkgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5QSSApO1xuICAgICAgICBQSSA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudFBJMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFBJMiB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLlBJICogMiApO1xuICAgICAgICBQSTIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRMTjEwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gTE4xMCB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxOMTAgKTtcbiAgICAgICAgTE4xMCA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudExOMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IExOMiB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxOMiApO1xuICAgICAgICBMTjIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRMT0cxMEUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBMT0cxMEUgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5MT0cxMEUgKTtcbiAgICAgICAgTE9HMTBFID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50TE9HMkUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBMT0cyRSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxPRzJFICk7XG4gICAgICAgIExPRzJFID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50U1FSVDFfMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFNRUlQxXzIgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5TUVJUMV8yICk7XG4gICAgICAgIFNRUlQxXzIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRTUVJUMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFNRUlQyIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguU1FSVDIgKTtcbiAgICAgICAgU1FSVDIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xufSgpKTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIERpdmlkZXMgdHdvIG51bWJlcnNcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBEaXZpZGUgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlLCBtYXhJbnB1dCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSAwLjA7XG5cbiAgICAgICAgZ3JhcGgucmVjaXByb2NhbCA9IHRoaXMuaW8uY3JlYXRlUmVjaXByb2NhbCggbWF4SW5wdXQgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5yZWNpcHJvY2FsICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICBncmFwaC5yZWNpcHJvY2FsLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRpdmlzb3IgPSB0aGlzLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHNbIDEgXS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBtYXhJbnB1dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVjaXByb2NhbC5tYXhJbnB1dDtcbiAgICB9XG4gICAgc2V0IG1heElucHV0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsLm1heElucHV0ID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEaXZpZGUgPSBmdW5jdGlvbiggdmFsdWUsIG1heElucHV0ICkge1xuICAgIHJldHVybiBuZXcgRGl2aWRlKCB0aGlzLCB2YWx1ZSwgbWF4SW5wdXQgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vLyBOT1RFOlxuLy8gIE9ubHkgYWNjZXB0cyB2YWx1ZXMgPj0gLTEgJiYgPD0gMS4gVmFsdWVzIG91dHNpZGVcbi8vICB0aGlzIHJhbmdlIGFyZSBjbGFtcGVkIHRvIHRoaXMgcmFuZ2UuXG5jbGFzcyBGbG9vciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuRmxvb3IgKTtcblxuICAgICAgICAvLyBUaGlzIGJyYW5jaGluZyBpcyBiZWNhdXNlIGlucHV0dGluZyBgMGAgdmFsdWVzXG4gICAgICAgIC8vIGludG8gdGhlIHdhdmVzaGFwZXIgYWJvdmUgb3V0cHV0cyAtMC41IDsoXG4gICAgICAgIGdyYXBoLmlmRWxzZSA9IHRoaXMuaW8uY3JlYXRlSWZFbHNlKCk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG9aZXJvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZXF1YWxUb1plcm8gKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUb1plcm8uY29ubmVjdCggZ3JhcGguaWZFbHNlLmlmICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguaWZFbHNlLnRoZW4gKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIGdyYXBoLmlmRWxzZS5lbHNlICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguaWZFbHNlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUZsb29yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBGbG9vciggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMZXJwIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIHN0YXJ0LCBlbmQsIGRlbHRhICkge1xuICAgICAgICBzdXBlciggaW8sIDMsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguYWRkID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgZ3JhcGguc3VidHJhY3QgPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIGdyYXBoLnN0YXJ0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggc3RhcnQgKTtcbiAgICAgICAgZ3JhcGguZW5kID0gdGhpcy5pby5jcmVhdGVQYXJhbSggZW5kICk7XG4gICAgICAgIGdyYXBoLmRlbHRhID0gdGhpcy5pby5jcmVhdGVQYXJhbSggZGVsdGEgKTtcblxuICAgICAgICBncmFwaC5lbmQuY29ubmVjdCggZ3JhcGguc3VidHJhY3QsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguc3RhcnQuY29ubmVjdCggZ3JhcGguc3VidHJhY3QsIDAsIDEgKTtcbiAgICAgICAgZ3JhcGguc3VidHJhY3QuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguZGVsdGEuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5zdGFydC5jb25uZWN0KCBncmFwaC5hZGQsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggZ3JhcGguYWRkLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGguYWRkLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zdGFydCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLmVuZCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMiBdLmNvbm5lY3QoIGdyYXBoLmRlbHRhICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5zdGFydCA9IGdyYXBoLnN0YXJ0O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmVuZCA9IGdyYXBoLmVuZDtcbiAgICAgICAgdGhpcy5jb250cm9scy5kZWx0YSA9IGdyYXBoLmRlbHRhO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHN0YXJ0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLnN0YXJ0LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgc3RhcnQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkuc3RhcnQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgZW5kKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLmVuZC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGVuZCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5lbmQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgZGVsdGEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkuZGVsdGEudmFsdWU7XG4gICAgfVxuICAgIHNldCBkZWx0YSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5kZWx0YS52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVycCA9IGZ1bmN0aW9uKCBzdGFydCwgZW5kLCBkZWx0YSApIHtcbiAgICByZXR1cm4gbmV3IExlcnAoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBXaGVuIGlucHV0IGlzIDwgYHZhbHVlYCwgb3V0cHV0cyBgdmFsdWVgLCBvdGhlcndpc2Ugb3V0cHV0cyBpbnB1dC5cbiAqIEBwYXJhbSB7QXVkaW9JT30gaW8gICBBdWRpb0lPIGluc3RhbmNlXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgVGhlIG1pbmltdW0gdmFsdWUgdG8gdGVzdCBhZ2FpbnN0LlxuICovXG5cbmNsYXNzIE1heCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5ncmVhdGVyVGhhbiA9IHRoaXMuaW8uY3JlYXRlR3JlYXRlclRoYW4oKTtcbiAgICAgICAgZ3JhcGguc3dpdGNoID0gdGhpcy5pby5jcmVhdGVTd2l0Y2goIDIsIDAgKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5ncmVhdGVyVGhhbi5jb250cm9scy52YWx1ZSApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAxIF0gKTtcbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW4uY29ubmVjdCggZ3JhcGguc3dpdGNoLmNvbnRyb2wgKTtcbiAgICAgICAgZ3JhcGguc3dpdGNoLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVNYXggPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBNYXgoIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogV2hlbiBpbnB1dCBpcyA+IGB2YWx1ZWAsIG91dHB1dHMgYHZhbHVlYCwgb3RoZXJ3aXNlIG91dHB1dHMgaW5wdXQuXG4gKiBAcGFyYW0ge0F1ZGlvSU99IGlvICAgQXVkaW9JTyBpbnN0YW5jZVxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIFRoZSBtaW5pbXVtIHZhbHVlIHRvIHRlc3QgYWdhaW5zdC5cbiAqL1xuY2xhc3MgTWluIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmxlc3NUaGFuID0gdGhpcy5pby5jcmVhdGVMZXNzVGhhbigpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubGVzc1RoYW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5sZXNzVGhhbi5jb250cm9scy52YWx1ZSApO1xuXG4gICAgICAgIGdyYXBoLnN3aXRjaCA9IHRoaXMuaW8uY3JlYXRlU3dpdGNoKCAyLCAwICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5zd2l0Y2guaW5wdXRzWyAxIF0gKTtcbiAgICAgICAgZ3JhcGgubGVzc1RoYW4uY29ubmVjdCggZ3JhcGguc3dpdGNoLmNvbnRyb2wgKTtcbiAgICAgICAgZ3JhcGguc3dpdGNoLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU1pbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IE1pbiggdGhpcywgdmFsdWUgKTtcbn07IiwiIGltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gYXVkaW8gc2lnbmFscyB0b2dldGhlci5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBNdWx0aXBseSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gMC4wO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXS5nYWluICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW5wdXRzWyAxIF07XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVNdWx0aXBseSA9IGZ1bmN0aW9uKCB2YWx1ZTEsIHZhbHVlMiApIHtcbiAgICByZXR1cm4gbmV3IE11bHRpcGx5KCB0aGlzLCB2YWx1ZTEsIHZhbHVlMiApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIE5lZ2F0ZXMgdGhlIGluY29taW5nIGF1ZGlvIHNpZ25hbC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBOZWdhdGUgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMCApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICB0aGlzLm91dHB1dHMgPSB0aGlzLmlucHV0cztcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTmVnYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBOZWdhdGUoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqXG4gKiBOb3RlOiBET0VTIE5PVCBIQU5ETEUgTkVHQVRJVkUgUE9XRVJTLlxuICovXG5jbGFzcyBQb3cgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbGllcnMgPSBbXTtcbiAgICAgICAgZ3JhcGgudmFsdWUgPSB2YWx1ZTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIG5vZGUgPSB0aGlzLmlucHV0c1sgMCBdOyBpIDwgdmFsdWUgLSAxOyArK2kgKSB7XG4gICAgICAgICAgICBncmFwaC5tdWx0aXBsaWVyc1sgaSBdID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5tdWx0aXBsaWVyc1sgaSBdLmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0gKTtcbiAgICAgICAgICAgIG5vZGUgPSBncmFwaC5tdWx0aXBsaWVyc1sgaSBdO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLnZhbHVlID0gbnVsbDtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmRpc2Nvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyAwIF0gKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IGdyYXBoLm11bHRpcGxpZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgICAgZ3JhcGgubXVsdGlwbGllcnNbIGkgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICBncmFwaC5tdWx0aXBsaWVycy5zcGxpY2UoIGksIDEgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgbm9kZSA9IHRoaXMuaW5wdXRzWyAwIF07IGkgPCB2YWx1ZSAtIDE7ICsraSApIHtcbiAgICAgICAgICAgIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0uY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdCggZ3JhcGgubXVsdGlwbGllcnNbIGkgXSApO1xuICAgICAgICAgICAgbm9kZSA9IGdyYXBoLm11bHRpcGxpZXJzWyBpIF07XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgZ3JhcGgudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBvdyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFBvdyggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBPdXRwdXRzIHRoZSB2YWx1ZSBvZiAxIC8gaW5wdXRWYWx1ZSAob3IgcG93KGlucHV0VmFsdWUsIC0xKSlcbiAqIFdpbGwgYmUgdXNlZnVsIGZvciBkb2luZyBtdWx0aXBsaWNhdGl2ZSBkaXZpc2lvbi5cbiAqXG4gKiBUT0RPOlxuICogICAgIC0gVGhlIHdhdmVzaGFwZXIgaXNuJ3QgYWNjdXJhdGUuIEl0IHB1bXBzIG91dCB2YWx1ZXMgZGlmZmVyaW5nXG4gKiAgICAgICBieSAxLjc5MDY3OTMxNDAzMDE1MjVlLTkgb3IgbW9yZS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgUmVjaXByb2NhbCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbWF4SW5wdXQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBmYWN0b3IgPSBtYXhJbnB1dCB8fCAxMDAsXG4gICAgICAgICAgICBnYWluID0gTWF0aC5wb3coIGZhY3RvciwgLTEgKSxcbiAgICAgICAgICAgIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm1heElucHV0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgubWF4SW5wdXQuZ2Fpbi5zZXRWYWx1ZUF0VGltZSggZ2FpbiwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG5cbiAgICAgICAgLy8gdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi5zZXRWYWx1ZUF0VGltZSggMC4wLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcblxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLlJlY2lwcm9jYWwgKTtcblxuICAgICAgICAvLyB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4uc2V0VmFsdWVBdFRpbWUoIDAuMCwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG5cbiAgICAgICAgdGhpcy5pby5jb25zdGFudERyaXZlci5jb25uZWN0KCBncmFwaC5tYXhJbnB1dCApO1xuICAgICAgICBncmFwaC5tYXhJbnB1dC5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdLmdhaW4gKTtcbiAgICAgICAgZ3JhcGgubWF4SW5wdXQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IG1heElucHV0KCkge1xuICAgICAgICByZXR1cm4gZ3JhcGgubWF4SW5wdXQuZ2FpbjtcbiAgICB9XG4gICAgc2V0IG1heElucHV0KCB2YWx1ZSApIHtcbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGlmICggdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIGdyYXBoLm1heElucHV0LmdhaW4uY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICAgICAgICAgIGdyYXBoLm1heElucHV0LmdhaW4uc2V0VmFsdWVBdFRpbWUoIDEgLyB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVJlY2lwcm9jYWwgPSBmdW5jdGlvbiggbWF4SW5wdXQgKSB7XG4gICAgcmV0dXJuIG5ldyBSZWNpcHJvY2FsKCB0aGlzLCBtYXhJbnB1dCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBOT1RFOlxuLy8gIE9ubHkgYWNjZXB0cyB2YWx1ZXMgPj0gLTEgJiYgPD0gMS4gVmFsdWVzIG91dHNpZGVcbi8vICB0aGlzIHJhbmdlIGFyZSBjbGFtcGVkIHRvIHRoaXMgcmFuZ2UuXG5jbGFzcyBSb3VuZCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmZsb29yID0gdGhpcy5pby5jcmVhdGVGbG9vcigpO1xuICAgICAgICBncmFwaC5hZGQgPSB0aGlzLmlvLmNyZWF0ZUFkZCggMC41ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWzBdLmNvbm5lY3QoIGdyYXBoLmFkZCApO1xuICAgICAgICBncmFwaC5hZGQuY29ubmVjdCggZ3JhcGguZmxvb3IgKTtcbiAgICAgICAgZ3JhcGguZmxvb3IuY29ubmVjdCggdGhpcy5vdXRwdXRzWzBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVJvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSb3VuZCggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbmNsYXNzIFNhbXBsZURlbGF5IGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIG51bVNhbXBsZXMgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5zYW1wbGVTaXplID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggMSAvIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlICk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnNhbXBsZXMgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBudW1TYW1wbGVzICk7XG5cbiAgICAgICAgZ3JhcGguc2FtcGxlU2l6ZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnNhbXBsZXMuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICBncmFwaC5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICBncmFwaC5tdWx0aXBseS5jb25uZWN0KCBncmFwaC5kZWxheS5kZWxheVRpbWUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5kZWxheSApO1xuICAgICAgICBncmFwaC5kZWxheS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHNhbXBsZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnNhbXBsZXMudmFsdWU7XG4gICAgfVxuICAgIHNldCBzYW1wbGVzKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5zYW1wbGVzLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTYW1wbGVEZWxheSA9IGZ1bmN0aW9uKCBudW1TYW1wbGVzICkge1xuICAgIHJldHVybiBuZXcgU2FtcGxlRGVsYXkoIHRoaXMsIG51bVNhbXBsZXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gR2l2ZW4gYW4gaW5wdXQgdmFsdWUgYW5kIGl0cyBoaWdoIGFuZCBsb3cgYm91bmRzLCBzY2FsZVxuLy8gdGhhdCB2YWx1ZSB0byBuZXcgaGlnaCBhbmQgbG93IGJvdW5kcy5cbi8vXG4vLyBGb3JtdWxhIGZyb20gTWF4TVNQJ3MgU2NhbGUgb2JqZWN0OlxuLy8gIGh0dHA6Ly93d3cuY3ljbGluZzc0LmNvbS9mb3J1bXMvdG9waWMucGhwP2lkPTI2NTkzXG4vL1xuLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSkgKiAoaGlnaE91dC1sb3dPdXQpICsgbG93T3V0O1xuXG5cbi8vIFRPRE86XG4vLyAgLSBBZGQgY29udHJvbHMhXG5jbGFzcyBTY2FsZSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd0luICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEluID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaEluICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93T3V0ICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaE91dCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hPdXQgKTtcblxuXG4gICAgICAgIC8vIChpbnB1dC1sb3dJbilcbiAgICAgICAgZ3JhcGguaW5wdXRNaW51c0xvd0luID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmlucHV0TWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLmlucHV0TWludXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vIChoaWdoSW4tbG93SW4pXG4gICAgICAgIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEluLmNvbm5lY3QoIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbi5jb25uZWN0KCBncmFwaC5oaWdoSW5NaW51c0xvd0luLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSlcbiAgICAgICAgZ3JhcGguZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgZ3JhcGguaW5wdXRNaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5oaWdoSW5NaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIC8vIChoaWdoT3V0LWxvd091dClcbiAgICAgICAgZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQuY29ubmVjdCggZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LmNvbm5lY3QoIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dCwgMCwgMSApO1xuXG4gICAgICAgIC8vICgoaW5wdXQtbG93SW4pIC8gKGhpZ2hJbi1sb3dJbikpICogKGhpZ2hPdXQtbG93T3V0KVxuICAgICAgICBncmFwaC5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dC5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIC8vICgoaW5wdXQtbG93SW4pIC8gKGhpZ2hJbi1sb3dJbikpICogKGhpZ2hPdXQtbG93T3V0KSArIGxvd091dFxuICAgICAgICBncmFwaC5hZGQgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseS5jb25uZWN0KCBncmFwaC5hZGQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguYWRkLCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGguYWRkLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgbG93SW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmxvd0luLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbG93SW4oIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGhpZ2hJbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuaGlnaEluLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgaGlnaEluKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgbG93T3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5sb3dPdXQudmFsdWU7XG4gICAgfVxuICAgIHNldCBsb3dPdXQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBoaWdoT3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5oaWdoT3V0LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgaGlnaE91dCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaE91dC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTY2FsZSA9IGZ1bmN0aW9uKCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG4gICAgcmV0dXJuIG5ldyBTY2FsZSggdGhpcywgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIEdpdmVuIGFuIGlucHV0IHZhbHVlIGFuZCBpdHMgaGlnaCBhbmQgbG93IGJvdW5kcywgc2NhbGVcbi8vIHRoYXQgdmFsdWUgdG8gbmV3IGhpZ2ggYW5kIGxvdyBib3VuZHMuXG4vL1xuLy8gRm9ybXVsYSBmcm9tIE1heE1TUCdzIFNjYWxlIG9iamVjdDpcbi8vICBodHRwOi8vd3d3LmN5Y2xpbmc3NC5jb20vZm9ydW1zL3RvcGljLnBocD9pZD0yNjU5M1xuLy9cbi8vIGlmKCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID09PSAwICkge1xuLy8gICAgIHJldHVybiBsb3dPdXQ7XG4vLyB9XG4vLyBlbHNlIGlmKCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID4gMCApIHtcbi8vICAgICByZXR1cm4gbG93T3V0ICsgKGhpZ2hPdXQgLSBsb3dPdXQpICogTWF0aC5wb3coIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cCk7XG4vLyB9XG4vLyBlbHNlIHtcbi8vICAgICByZXR1cm4gbG93T3V0ICsgKGhpZ2hPdXQgLSBsb3dPdXQpICogLShNYXRoLnBvdyggKC1pbnB1dCArIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cCkpO1xuLy8gfVxuXG4vLyBUT0RPOlxuLy8gIC0gQWRkIGNvbnRyb2xzXG5jbGFzcyBTY2FsZUV4cCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHBvbmVudCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIC8vIGxvd0luID0gdHlwZW9mIGxvd0luID09PSAnbnVtYmVyJyA/IGxvd0luIDogMDtcbiAgICAgICAgLy8gaGlnaEluID0gdHlwZW9mIGhpZ2hJbiA9PT0gJ251bWJlcicgPyBoaWdoSW4gOiAxO1xuICAgICAgICAvLyBsb3dPdXQgPSB0eXBlb2YgbG93T3V0ID09PSAnbnVtYmVyJyA/IGxvd091dCA6IDA7XG4gICAgICAgIC8vIGhpZ2hPdXQgPSB0eXBlb2YgaGlnaE91dCA9PT0gJ251bWJlcicgPyBoaWdoT3V0IDogMTA7XG4gICAgICAgIC8vIGV4cG9uZW50ID0gdHlwZW9mIGV4cG9uZW50ID09PSAnbnVtYmVyJyA/IGV4cG9uZW50IDogMTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93SW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoSW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dPdXQgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaE91dCApO1xuICAgICAgICBncmFwaC5fZXhwb25lbnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBleHBvbmVudCApO1xuXG5cbiAgICAgICAgLy8gKGlucHV0IC0gbG93SW4pXG4gICAgICAgIGdyYXBoLmlucHV0TWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5pbnB1dE1pbnVzTG93SW4sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbi5jb25uZWN0KCBncmFwaC5pbnB1dE1pbnVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoLWlucHV0ICsgbG93SW4pXG4gICAgICAgIGdyYXBoLm1pbnVzSW5wdXQgPSB0aGlzLmlvLmNyZWF0ZU5lZ2F0ZSgpO1xuICAgICAgICBncmFwaC5taW51c0lucHV0UGx1c0xvd0luID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5taW51c0lucHV0ICk7XG4gICAgICAgIGdyYXBoLm1pbnVzSW5wdXQuY29ubmVjdCggZ3JhcGgubWludXNJbnB1dFBsdXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLm1pbnVzSW5wdXRQbHVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoaGlnaEluIC0gbG93SW4pXG4gICAgICAgIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEluLmNvbm5lY3QoIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbi5jb25uZWN0KCBncmFwaC5oaWdoSW5NaW51c0xvd0luLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikpXG4gICAgICAgIGdyYXBoLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCk7XG4gICAgICAgIGdyYXBoLmlucHV0TWludXNMb3dJbi5jb25uZWN0KCBncmFwaC5kaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguaGlnaEluTWludXNMb3dJbi5jb25uZWN0KCBncmFwaC5kaXZpZGUsIDAsIDEgKTtcblxuICAgICAgICAvLyAoLWlucHV0ICsgbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKVxuICAgICAgICBncmFwaC5uZWdhdGl2ZURpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCk7XG4gICAgICAgIGdyYXBoLm1pbnVzSW5wdXRQbHVzTG93SW4uY29ubmVjdCggZ3JhcGgubmVnYXRpdmVEaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguaGlnaEluTWludXNMb3dJbi5jb25uZWN0KCBncmFwaC5uZWdhdGl2ZURpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIC8vIChoaWdoT3V0IC0gbG93T3V0KVxuICAgICAgICBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQgPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaE91dC5jb25uZWN0KCBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gTWF0aC5wb3coIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cClcbiAgICAgICAgZ3JhcGgucG93ID0gdGhpcy5pby5jcmVhdGVQb3coIGV4cG9uZW50ICk7XG4gICAgICAgIGdyYXBoLmRpdmlkZS5jb25uZWN0KCBncmFwaC5wb3cgKTtcblxuICAgICAgICAvLyAtKE1hdGgucG93KCAoLWlucHV0ICsgbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKSlcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVQb3dOZWdhdGUgPSB0aGlzLmlvLmNyZWF0ZU5lZ2F0ZSgpO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZVBvdyA9IHRoaXMuaW8uY3JlYXRlUG93KCBleHBvbmVudCApO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZURpdmlkZS5jb25uZWN0KCBncmFwaC5uZWdhdGl2ZVBvdyApO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZVBvdy5jb25uZWN0KCBncmFwaC5uZWdhdGl2ZVBvd05lZ2F0ZSApO1xuXG5cbiAgICAgICAgLy8gbG93T3V0ICsgKGhpZ2hPdXQgLSBsb3dPdXQpICogTWF0aC5wb3coIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cCk7XG4gICAgICAgIGdyYXBoLmVsc2VJZkJyYW5jaCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLmVsc2VJZk11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQuY29ubmVjdCggZ3JhcGguZWxzZUlmTXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgucG93LmNvbm5lY3QoIGdyYXBoLmVsc2VJZk11bHRpcGx5LCAwLCAxICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LmNvbm5lY3QoIGdyYXBoLmVsc2VJZkJyYW5jaCwgMCwgMCApO1xuICAgICAgICBncmFwaC5lbHNlSWZNdWx0aXBseS5jb25uZWN0KCBncmFwaC5lbHNlSWZCcmFuY2gsIDAsIDEgKTtcblxuICAgICAgICAvLyBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiAtKE1hdGgucG93KCAoLWlucHV0ICsgbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKSk7XG4gICAgICAgIGdyYXBoLmVsc2VCcmFuY2ggPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICBncmFwaC5lbHNlTXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dC5jb25uZWN0KCBncmFwaC5lbHNlTXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVQb3dOZWdhdGUuY29ubmVjdCggZ3JhcGguZWxzZU11bHRpcGx5LCAwLCAxICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LmNvbm5lY3QoIGdyYXBoLmVsc2VCcmFuY2gsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguZWxzZU11bHRpcGx5LmNvbm5lY3QoIGdyYXBoLmVsc2VCcmFuY2gsIDAsIDEgKTtcblxuXG5cbiAgICAgICAgLy8gZWxzZSBpZiggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSA+IDAgKSB7XG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuWmVybyA9IHRoaXMuaW8uY3JlYXRlR3JlYXRlclRoYW5aZXJvKCk7XG4gICAgICAgIGdyYXBoLmlmR3JlYXRlclRoYW5aZXJvID0gdGhpcy5pby5jcmVhdGVJZkVsc2UoKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlLmNvbm5lY3QoIGdyYXBoLmdyZWF0ZXJUaGFuWmVybyApO1xuICAgICAgICBncmFwaC5ncmVhdGVyVGhhblplcm8uY29ubmVjdCggZ3JhcGguaWZHcmVhdGVyVGhhblplcm8uaWYgKTtcbiAgICAgICAgZ3JhcGguZWxzZUlmQnJhbmNoLmNvbm5lY3QoIGdyYXBoLmlmR3JlYXRlclRoYW5aZXJvLnRoZW4gKTtcbiAgICAgICAgZ3JhcGguZWxzZUJyYW5jaC5jb25uZWN0KCBncmFwaC5pZkdyZWF0ZXJUaGFuWmVyby5lbHNlICk7XG5cbiAgICAgICAgLy8gaWYoKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSA9PT0gMClcbiAgICAgICAgZ3JhcGguZXF1YWxzWmVybyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUb1plcm8oKTtcbiAgICAgICAgZ3JhcGguaWZFcXVhbHNaZXJvID0gdGhpcy5pby5jcmVhdGVJZkVsc2UoKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlLmNvbm5lY3QoIGdyYXBoLmVxdWFsc1plcm8gKTtcbiAgICAgICAgZ3JhcGguZXF1YWxzWmVyby5jb25uZWN0KCBncmFwaC5pZkVxdWFsc1plcm8uaWYgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguaWZFcXVhbHNaZXJvLnRoZW4gKTtcbiAgICAgICAgZ3JhcGguaWZHcmVhdGVyVGhhblplcm8uY29ubmVjdCggZ3JhcGguaWZFcXVhbHNaZXJvLmVsc2UgKTtcblxuICAgICAgICBncmFwaC5pZkVxdWFsc1plcm8uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCBsb3dJbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMubG93SW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBsb3dJbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgaGlnaEluKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5oaWdoSW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoSW4oIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hJbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBsb3dPdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmxvd091dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd091dCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGhpZ2hPdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQudmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoT3V0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGV4cG9uZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFwaCgpLl9leHBvbmVudC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGV4cG9uZW50KCB2YWx1ZSApIHtcbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuICAgICAgICBncmFwaC5fZXhwb25lbnQudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgZ3JhcGgucG93LnZhbHVlID0gdmFsdWU7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlUG93LnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNjYWxlRXhwID0gZnVuY3Rpb24oIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCwgZXhwb25lbnQgKSB7XG4gICAgcmV0dXJuIG5ldyBTY2FsZUV4cCggdGhpcywgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHBvbmVudCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBTaWduIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLlNpZ24gKTtcblxuICAgICAgICBncmFwaC5pZkVsc2UgPSB0aGlzLmlvLmNyZWF0ZUlmRWxzZSgpO1xuICAgICAgICBncmFwaC5lcXVhbFRvWmVybyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUb1plcm8oKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmVxdWFsVG9aZXJvICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguaWZFbHNlLnRoZW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcblxuICAgICAgICBncmFwaC5lcXVhbFRvWmVyby5jb25uZWN0KCBncmFwaC5pZkVsc2UuaWYgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIGdyYXBoLmlmRWxzZS5lbHNlICk7XG4gICAgICAgIGdyYXBoLmlmRWxzZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTaWduID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBTaWduKCB0aGlzICk7XG59O1xuIiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTWV0aG9kc19vZl9jb21wdXRpbmdfc3F1YXJlX3Jvb3RzI0V4YW1wbGVcbi8vXG4vLyBmb3IoIHZhciBpID0gMCwgeDsgaSA8IHNpZ0ZpZ3VyZXM7ICsraSApIHtcbi8vICAgICAgaWYoIGkgPT09IDAgKSB7XG4vLyAgICAgICAgICB4ID0gc2lnRmlndXJlcyAqIE1hdGgucG93KCAxMCwgMiApO1xuLy8gICAgICB9XG4vLyAgICAgIGVsc2Uge1xuLy8gICAgICAgICAgeCA9IDAuNSAqICggeCArIChpbnB1dCAvIHgpICk7XG4vLyAgICAgIH1cbi8vIH1cblxuLy8gVE9ETzpcbi8vICAtIE1ha2Ugc3VyZSBTcXJ0IHVzZXMgZ2V0R3JhcGggYW5kIHNldEdyYXBoLlxuY2xhc3MgU3FydEhlbHBlciB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBwcmV2aW91c1N0ZXAsIGlucHV0LCBtYXhJbnB1dCApIHtcbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IGlvLmNyZWF0ZU11bHRpcGx5KCAwLjUgKTtcbiAgICAgICAgdGhpcy5kaXZpZGUgPSBpby5jcmVhdGVEaXZpZGUoIG51bGwsIG1heElucHV0ICk7XG4gICAgICAgIHRoaXMuYWRkID0gaW8uY3JlYXRlQWRkKCk7XG5cbiAgICAgICAgLy8gaW5wdXQgLyB4O1xuICAgICAgICBpbnB1dC5jb25uZWN0KCB0aGlzLmRpdmlkZSwgMCwgMCApO1xuICAgICAgICBwcmV2aW91c1N0ZXAub3V0cHV0LmNvbm5lY3QoIHRoaXMuZGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8geCArICggaW5wdXQgLyB4IClcbiAgICAgICAgcHJldmlvdXNTdGVwLm91dHB1dC5jb25uZWN0KCB0aGlzLmFkZCwgMCwgMCApO1xuICAgICAgICB0aGlzLmRpdmlkZS5jb25uZWN0KCB0aGlzLmFkZCwgMCwgMSApO1xuXG4gICAgICAgIC8vIDAuNSAqICggeCArICggaW5wdXQgLyB4ICkgKVxuICAgICAgICB0aGlzLmFkZC5jb25uZWN0KCB0aGlzLm11bHRpcGx5ICk7XG5cbiAgICAgICAgdGhpcy5vdXRwdXQgPSB0aGlzLm11bHRpcGx5O1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHRoaXMubXVsdGlwbHkuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmRpdmlkZS5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuYWRkLmNsZWFuVXAoKTtcblxuICAgICAgICB0aGlzLm11bHRpcGx5ID0gbnVsbDtcbiAgICAgICAgdGhpcy5kaXZpZGUgPSBudWxsO1xuICAgICAgICB0aGlzLmFkZCA9IG51bGw7XG4gICAgICAgIHRoaXMub3V0cHV0ID0gbnVsbDtcbiAgICB9XG59XG5cbmNsYXNzIFNxcnQgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHNpZ25pZmljYW50RmlndXJlcywgbWF4SW5wdXQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIC8vIERlZmF1bHQgdG8gNiBzaWduaWZpY2FudCBmaWd1cmVzLlxuICAgICAgICBzaWduaWZpY2FudEZpZ3VyZXMgPSBzaWduaWZpY2FudEZpZ3VyZXMgfHwgNjtcblxuICAgICAgICBtYXhJbnB1dCA9IG1heElucHV0IHx8IDEwMDtcblxuICAgICAgICB0aGlzLngwID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggc2lnbmlmaWNhbnRGaWd1cmVzICogTWF0aC5wb3coIDEwLCAyICkgKTtcblxuICAgICAgICB0aGlzLnN0ZXBzID0gWyB7XG4gICAgICAgICAgICBvdXRwdXQ6IHRoaXMueDBcbiAgICAgICAgfSBdO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMTsgaSA8IHNpZ25pZmljYW50RmlndXJlczsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5zdGVwcy5wdXNoKFxuICAgICAgICAgICAgICAgIG5ldyBTcXJ0SGVscGVyKCB0aGlzLmlvLCB0aGlzLnN0ZXBzWyBpIC0gMSBdLCB0aGlzLmlucHV0c1sgMCBdLCBtYXhJbnB1dCApXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGVwc1sgdGhpcy5zdGVwcy5sZW5ndGggLSAxIF0ub3V0cHV0LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgLy8gY2xlYW5VcCgpIHtcbiAgICAvLyAgICAgc3VwZXIoKTtcblxuICAgIC8vICAgICB0aGlzLngwLmNsZWFuVXAoKTtcblxuICAgIC8vICAgICB0aGlzLnN0ZXBzWyAwIF0gPSBudWxsO1xuXG4gICAgLy8gICAgIGZvciggdmFyIGkgPSB0aGlzLnN0ZXBzLmxlbmd0aCAtIDE7IGkgPj0gMTsgLS1pICkge1xuICAgIC8vICAgICAgICAgdGhpcy5zdGVwc1sgaSBdLmNsZWFuVXAoKTtcbiAgICAvLyAgICAgICAgIHRoaXMuc3RlcHNbIGkgXSA9IG51bGw7XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICB0aGlzLngwID0gbnVsbDtcbiAgICAvLyAgICAgdGhpcy5zdGVwcyA9IG51bGw7XG4gICAgLy8gfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNxcnQgPSBmdW5jdGlvbiggc2lnbmlmaWNhbnRGaWd1cmVzLCBtYXhJbnB1dCApIHtcbiAgICByZXR1cm4gbmV3IFNxcnQoIHRoaXMsIHNpZ25pZmljYW50RmlndXJlcywgbWF4SW5wdXQgKTtcbn07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuY2xhc3MgU3F1YXJlIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAxICk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNxdWFyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgU3F1YXJlKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogU3VidHJhY3RzIHRoZSBzZWNvbmQgaW5wdXQgZnJvbSB0aGUgZmlyc3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKi9cbmNsYXNzIFN1YnRyYWN0IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm5lZ2F0ZSA9IHRoaXMuaW8uY3JlYXRlTmVnYXRlKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLm5lZ2F0ZSApO1xuICAgICAgICBncmFwaC5uZWdhdGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVN1YnRyYWN0ID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgU3VidHJhY3QoIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIFN3aXRjaCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtQ2FzZXMsIHN0YXJ0aW5nQ2FzZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gRW5zdXJlIHN0YXJ0aW5nQ2FzZSBpcyBuZXZlciA8IDBcbiAgICAgICAgc3RhcnRpbmdDYXNlID0gdHlwZW9mIHN0YXJ0aW5nQ2FzZSA9PT0gJ251bWJlcicgPyBNYXRoLmFicyggc3RhcnRpbmdDYXNlICkgOiBzdGFydGluZ0Nhc2U7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNhc2VzID0gW107XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5pbmRleCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHN0YXJ0aW5nQ2FzZSApO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG51bUNhc2VzOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgaSBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IDAuMDtcbiAgICAgICAgICAgIGdyYXBoLmNhc2VzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG8oIGkgKTtcbiAgICAgICAgICAgIGdyYXBoLmNhc2VzWyBpIF0uY29ubmVjdCggdGhpcy5pbnB1dHNbIGkgXS5nYWluICk7XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4LmNvbm5lY3QoIGdyYXBoLmNhc2VzWyBpIF0gKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IGNvbnRyb2woKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmluZGV4LmNvbnRyb2w7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5pbmRleC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5pbmRleC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTd2l0Y2ggPSBmdW5jdGlvbiggbnVtQ2FzZXMsIHN0YXJ0aW5nQ2FzZSApIHtcbiAgICByZXR1cm4gbmV3IFN3aXRjaCggdGhpcywgbnVtQ2FzZXMsIHN0YXJ0aW5nQ2FzZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTG9naWNhbE9wZXJhdG9yIGZyb20gXCIuL0xvZ2ljYWxPcGVyYXRvci5lczZcIjtcblxuXG5jbGFzcyBBTkQgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZUNsYW1wKCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQU5EO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBTkQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEFORCggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbmNsYXNzIExvZ2ljYWxPcGVyYXRvciBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguY2xhbXAgPSB0aGlzLmlvLmNyZWF0ZUNsYW1wKCAwLCAxICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSBncmFwaC5jbGFtcDtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTG9naWNhbE9wZXJhdG9yO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVMb2dpY2FsT3BlcmF0b3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IExvZ2ljYWxPcGVyYXRvciggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTG9naWNhbE9wZXJhdG9yIGZyb20gXCIuL0xvZ2ljYWxPcGVyYXRvci5lczZcIjtcblxuXG5jbGFzcyBOT1QgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguYWJzID0gdGhpcy5pby5jcmVhdGVBYnMoIDEwMCApO1xuICAgICAgICBncmFwaC5zdWJ0cmFjdCA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoIDEgKTtcbiAgICAgICAgZ3JhcGgucm91bmQgPSB0aGlzLmlvLmNyZWF0ZVJvdW5kKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zdWJ0cmFjdCApO1xuICAgICAgICBncmFwaC5zdWJ0cmFjdC5jb25uZWN0KCBncmFwaC5hYnMgKTtcbiAgICAgICAgZ3JhcGguYWJzLmNvbm5lY3QoIGdyYXBoLnJvdW5kIClcblxuICAgICAgICBncmFwaC5yb3VuZC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBOT1Q7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5PVCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTk9UKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIE9SIGV4dGVuZHMgTG9naWNhbE9wZXJhdG9yIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm1heCA9IHRoaXMuaW8uY3JlYXRlTWF4KCk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG8oIDEgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm1heCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLm1heC5jb250cm9scy52YWx1ZSApO1xuICAgICAgICBncmFwaC5tYXguY29ubmVjdCggZ3JhcGguZXF1YWxUbyApO1xuICAgICAgICBncmFwaC5lcXVhbFRvLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE9SO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVPUiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT1IoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gZ2FpbigrMTAwMDAwKSAtPiBzaGFwZXIoIDw9IDA6IDEsIDEgKVxuY2xhc3MgRXF1YWxUbyBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICAvLyBUT0RPXG4gICAgICAgIC8vICAtIFJlbmFtZSB0aGlzLlxuICAgICAgICBncmFwaC52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICksXG4gICAgICAgIGdyYXBoLmludmVyc2lvbiA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgZ3JhcGguaW52ZXJzaW9uLmdhaW4udmFsdWUgPSAtMTtcblxuICAgICAgICAvLyBUaGlzIGN1cnZlIG91dHB1dHMgMC41IHdoZW4gaW5wdXQgaXMgMCxcbiAgICAgICAgLy8gc28gaXQgaGFzIHRvIGJlIHBpcGVkIGludG8gYSBub2RlIHRoYXRcbiAgICAgICAgLy8gdHJhbnNmb3JtcyBpdCBpbnRvIDEsIGFuZCBsZWF2ZXMgemVyb3NcbiAgICAgICAgLy8gYWxvbmUuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuRXF1YWxUb1plcm8gKTtcblxuICAgICAgICBncmFwaC5ncmVhdGVyVGhhblplcm8gPSB0aGlzLmlvLmNyZWF0ZUdyZWF0ZXJUaGFuWmVybygpO1xuICAgICAgICBncmFwaC52YWx1ZS5jb25uZWN0KCBncmFwaC5pbnZlcnNpb24gKTtcbiAgICAgICAgZ3JhcGguaW52ZXJzaW9uLmNvbm5lY3QoIHRoaXMuaW5wdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW5aZXJvICk7XG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuWmVyby5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSBncmFwaC52YWx1ZTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuXG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRXF1YWxUbyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IEVxdWFsVG8oIHRoaXMsIHZhbHVlICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBFcXVhbFRvOyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5pbXBvcnQgRXF1YWxUbyBmcm9tIFwiLi9FcXVhbFRvLmVzNlwiO1xuXG4vLyBIYXZlbid0IHF1aXRlIGZpZ3VyZWQgb3V0IHdoeSB5ZXQsIGJ1dCB0aGlzIHJldHVybnMgMCB3aGVuIGlucHV0IGlzIDAuXG4vLyBJdCBzaG91bGQgcmV0dXJuIDEuLi5cbi8vXG4vLyBGb3Igbm93LCBJJ20ganVzdCB1c2luZyB0aGUgRXF1YWxUbyBub2RlIHdpdGggYSBzdGF0aWMgMCBhcmd1bWVudC5cbi8vIC0tLS0tLS0tXG4vL1xuLy8gY2xhc3MgRXF1YWxUb1plcm8gZXh0ZW5kcyBOb2RlIHtcbi8vICAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4vLyAgICAgICAgIHN1cGVyKCBpbywgMSwgMCApO1xuXG4vLyAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDEwMDAwMDtcblxuLy8gICAgICAgICAvLyBUaGlzIG91dHB1dHMgMC41IHdoZW4gaW5wdXQgaXMgMCxcbi8vICAgICAgICAgLy8gc28gaXQgaGFzIHRvIGJlIHBpcGVkIGludG8gYSBub2RlIHRoYXRcbi8vICAgICAgICAgLy8gdHJhbnNmb3JtcyBpdCBpbnRvIDEsIGFuZCBsZWF2ZXMgemVyb3Ncbi8vICAgICAgICAgLy8gYWxvbmUuXG4vLyAgICAgICAgIHRoaXMuc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5FcXVhbFRvWmVybyApO1xuXG4vLyAgICAgICAgIHRoaXMub3V0cHV0c1sgMCBdID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhbiggMCApO1xuXG4vLyAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5zaGFwZXIgKTtcbi8vICAgICAgICAgdGhpcy5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbi8vICAgICB9XG5cbi8vICAgICBjbGVhblVwKCkge1xuLy8gICAgICAgICBzdXBlcigpO1xuXG4vLyAgICAgICAgIHRoaXMuc2hhcGVyLmNsZWFuVXAoKTtcbi8vICAgICAgICAgdGhpcy5zaGFwZXIgPSBudWxsO1xuLy8gICAgIH1cbi8vIH1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRXF1YWxUb1plcm8gPSBmdW5jdGlvbigpIHtcbiAgICAvLyByZXR1cm4gbmV3IEVxdWFsVG9aZXJvKCB0aGlzICk7XG5cbiAgICByZXR1cm4gbmV3IEVxdWFsVG8oIHRoaXMsIDAgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgR3JlYXRlclRoYW4gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIGdyYXBoLmludmVyc2lvbiA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgZ3JhcGguaW52ZXJzaW9uLmdhaW4udmFsdWUgPSAtMTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAxMDAwMDA7XG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuR3JlYXRlclRoYW5aZXJvICk7XG5cblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNvbm5lY3QoIGdyYXBoLmludmVyc2lvbiApO1xuICAgICAgICBncmFwaC5pbnZlcnNpb24uY29ubmVjdCggdGhpcy5pbnB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUdyZWF0ZXJUaGFuID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgR3JlYXRlclRoYW4oIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIEdyZWF0ZXJUaGFuWmVybyBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDEwMDAwMDtcbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5HcmVhdGVyVGhhblplcm8gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUdyZWF0ZXJUaGFuWmVybyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgR3JlYXRlclRoYW5aZXJvKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIElmRWxzZSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAwICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnN3aXRjaCA9IHRoaXMuaW8uY3JlYXRlU3dpdGNoKCAyLCAwICk7XG5cbiAgICAgICAgdGhpcy5pZiA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUb1plcm8oKTtcbiAgICAgICAgdGhpcy5pZi5jb25uZWN0KCBncmFwaC5zd2l0Y2guY29udHJvbCApO1xuICAgICAgICB0aGlzLnRoZW4gPSBncmFwaC5zd2l0Y2guaW5wdXRzWyAwIF07XG4gICAgICAgIHRoaXMuZWxzZSA9IGdyYXBoLnN3aXRjaC5pbnB1dHNbIDEgXTtcblxuICAgICAgICB0aGlzLmlucHV0cyA9IGdyYXBoLnN3aXRjaC5pbnB1dHM7XG4gICAgICAgIHRoaXMub3V0cHV0cyA9IGdyYXBoLnN3aXRjaC5vdXRwdXRzO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVJZkVsc2UgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IElmRWxzZSggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMZXNzVGhhbiBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICBncmFwaC52YWx1ZUludmVyc2lvbiA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLnZhbHVlSW52ZXJzaW9uLmdhaW4udmFsdWUgPSAtMTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNvbm5lY3QoIGdyYXBoLnZhbHVlSW52ZXJzaW9uICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gLTEwMDAwMDtcbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5HcmVhdGVyVGhhblplcm8gKTtcblxuICAgICAgICBncmFwaC52YWx1ZUludmVyc2lvbi5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVzc1RoYW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBMZXNzVGhhbiggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgTGVzc1RoYW5aZXJvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguYm9vc3RlciA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLmJvb3N0ZXIuZ2Fpbi52YWx1ZSA9IC0xMDAwMDA7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguYm9vc3RlciApO1xuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuR3JlYXRlclRoYW5aZXJvICk7XG5cbiAgICAgICAgZ3JhcGguYm9vc3Rlci5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxlc3NUaGFuWmVybyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTGVzc1RoYW5aZXJvKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIENvc2luZSBhcHByb3hpbWF0aW9uIVxuLy9cbi8vIE9ubHkgd29ya3MgaW4gcmFuZ2Ugb2YgLU1hdGguUEkgdG8gTWF0aC5QSS5cbmNsYXNzIENvcyBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIGdyYXBoLnNxdWFyZSA9IHRoaXMuaW8uY3JlYXRlU3F1YXJlKCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5MSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIC0yLjYwNWUtNyApO1xuICAgICAgICBncmFwaC5tdWx0aXBseTIgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5MyA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk0ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTUgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG5cbiAgICAgICAgZ3JhcGguYWRkMSA9IHRoaXMuaW8uY3JlYXRlQWRkKCAyLjQ3NjA5ZS01ICk7XG4gICAgICAgIGdyYXBoLmFkZDIgPSB0aGlzLmlvLmNyZWF0ZUFkZCggLTAuMDAxMzg4ODQgKTtcbiAgICAgICAgZ3JhcGguYWRkMyA9IHRoaXMuaW8uY3JlYXRlQWRkKCAwLjA0MTY2NjYgKTtcbiAgICAgICAgZ3JhcGguYWRkNCA9IHRoaXMuaW8uY3JlYXRlQWRkKCAtMC40OTk5MjMgKTtcbiAgICAgICAgZ3JhcGguYWRkNSA9IHRoaXMuaW8uY3JlYXRlQWRkKCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zcXVhcmUgKTtcblxuICAgICAgICAvLyBDb25uZWN0IG11bHRpcGx5MSdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkxLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBhZGQxJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5MS5jb25uZWN0KCBncmFwaC5hZGQxLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBtdWx0aXBseTIncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MiwgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQxLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MiwgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgYWRkMidzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTIuY29ubmVjdCggZ3JhcGguYWRkMiwgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgbXVsdGlwbHkzJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTMsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkMi5jb25uZWN0KCBncmFwaC5tdWx0aXBseTMsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGFkZDMncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkzLmNvbm5lY3QoIGdyYXBoLmFkZDMsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IG11bHRpcGx5NCdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk0LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDMuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNCdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTQuY29ubmVjdCggZ3JhcGguYWRkNCwgMCwgMCApO1xuXG4gICAgICAgIC8vIG11bHRpcGx5NSdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk1LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDQuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk1LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNSdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTUuY29ubmVjdCggZ3JhcGguYWRkNSwgMCwgMCApO1xuXG4gICAgICAgIC8vIE91dHB1dCAoZmluYWxseSEhKVxuICAgICAgICBncmFwaC5hZGQ1LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgLy8gU3RvcmUgY29udHJvbGxhYmxlIHBhcmFtcy5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW5wdXRzWyAwIF07XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvcyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IENvcyggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgRGVnVG9SYWQgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCBNYXRoLlBJIC8gMTgwICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEZWdUb1JhZCA9IGZ1bmN0aW9uKCBkZWcgKSB7XG4gICAgcmV0dXJuIG5ldyBEZWdUb1JhZCggdGhpcywgZGVnICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIFJhZFRvRGVnIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMub3V0cHV0c1sgMCBdID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggMTgwIC8gTWF0aC5QSSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUmFkVG9EZWcgPSBmdW5jdGlvbiggZGVnICkge1xuICAgIHJldHVybiBuZXcgUmFkVG9EZWcoIHRoaXMsIGRlZyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBTaW4gYXBwcm94aW1hdGlvbiFcbi8vXG4vLyBPbmx5IHdvcmtzIGluIHJhbmdlIG9mIC1NYXRoLlBJIHRvIE1hdGguUEkuXG5jbGFzcyBTaW4gZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgZ3JhcGguc3F1YXJlID0gdGhpcy5pby5jcmVhdGVTcXVhcmUoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkxID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggLTIuMzllLTggKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkyID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTMgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5NCA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk1ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTYgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG5cbiAgICAgICAgZ3JhcGguYWRkMSA9IHRoaXMuaW8uY3JlYXRlQWRkKCAyLjc1MjZlLTYgKTtcbiAgICAgICAgZ3JhcGguYWRkMiA9IHRoaXMuaW8uY3JlYXRlQWRkKCAtMC4wMDAxOTg0MDkgKTtcbiAgICAgICAgZ3JhcGguYWRkMyA9IHRoaXMuaW8uY3JlYXRlQWRkKCAwLjAwODMzMzMzICk7XG4gICAgICAgIGdyYXBoLmFkZDQgPSB0aGlzLmlvLmNyZWF0ZUFkZCggLTAuMTY2NjY3ICk7XG4gICAgICAgIGdyYXBoLmFkZDUgPSB0aGlzLmlvLmNyZWF0ZUFkZCggMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc3F1YXJlICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBtdWx0aXBseTEncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MSwgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgYWRkMSdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTEuY29ubmVjdCggZ3JhcGguYWRkMSwgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgbXVsdGlwbHkyJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTIsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkMS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTIsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIGFkZDIncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkyLmNvbm5lY3QoIGdyYXBoLmFkZDIsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIG11bHRpcGx5MydzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkzLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDIuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkzLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBhZGQzJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5My5jb25uZWN0KCBncmFwaC5hZGQzLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBtdWx0aXBseTQncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5NCwgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQzLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5NCwgMCwgMSApO1xuXG4gICAgICAgIC8vIGFkZDQncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk0LmNvbm5lY3QoIGdyYXBoLmFkZDQsIDAsIDAgKTtcblxuICAgICAgICAvLyBtdWx0aXBseTUncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5NSwgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQ0LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5NSwgMCwgMSApO1xuXG4gICAgICAgIC8vIGFkZDUncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk1LmNvbm5lY3QoIGdyYXBoLmFkZDUsIDAsIDAgKTtcblxuICAgICAgICAvLyBtdWx0aXBseTYncyBpbnB1dHNcbiAgICAgICAgdGhpcy5pbnB1dHNbMF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbHk2LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk2LCAwLCAxICk7XG5cbiAgICAgICAgLy8gT3V0cHV0IChmaW5hbGx5ISEpXG4gICAgICAgIGdyYXBoLm11bHRpcGx5Ni5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTaW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBTaW4oIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIFRhbmdlbnQgYXBwcm94aW1hdGlvbiFcbi8vXG4vLyBPbmx5IHdvcmtzIGluIHJhbmdlIG9mIC1NYXRoLlBJIHRvIE1hdGguUEkuXG4vL1xuLy8gc2luKCBpbnB1dCApIC8gY29zKCBpbnB1dCApXG5jbGFzcyBUYW4gZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgZ3JhcGguc2luZSA9IHRoaXMuaW8uY3JlYXRlU2luKCk7XG4gICAgICAgIGdyYXBoLmNvcyA9IHRoaXMuaW8uY3JlYXRlQ29zKCk7XG4gICAgICAgIGdyYXBoLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCB1bmRlZmluZWQsIE1hdGguUEkgKiAyICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaW5lICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguY29zICk7XG4gICAgICAgIGdyYXBoLnNpbmUuY29ubmVjdCggZ3JhcGguZGl2aWRlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmNvcy5jb25uZWN0KCBncmFwaC5kaXZpZGUsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlVGFuID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgVGFuKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgQ09ORklHIGZyb20gXCIuLi9jb3JlL2NvbmZpZy5lczZcIjtcblxuZnVuY3Rpb24gUGlua051bWJlcigpIHtcbiAgICB0aGlzLm1heEtleSA9IDB4MWY7XG4gICAgdGhpcy5rZXkgPSAwO1xuICAgIHRoaXMud2hpdGVWYWx1ZXMgPSBbXTtcbiAgICB0aGlzLnJhbmdlID0gMTI4O1xuICAgIHRoaXMubGltaXQgPSA1O1xuXG4gICAgdGhpcy5nZW5lcmF0ZSA9IHRoaXMuZ2VuZXJhdGUuYmluZCggdGhpcyApO1xuICAgIHRoaXMuZ2V0TmV4dFZhbHVlID0gdGhpcy5nZXROZXh0VmFsdWUuYmluZCggdGhpcyApO1xufVxuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZW5lcmF0ZSA9IGZ1bmN0aW9uKCByYW5nZSwgbGltaXQgKSB7XG4gICAgdGhpcy5yYW5nZSA9IHJhbmdlIHx8IDEyODtcbiAgICB0aGlzLm1heEtleSA9IDB4MWY7XG4gICAgdGhpcy5rZXkgPSAwO1xuICAgIHRoaXMubGltaXQgPSBsaW1pdCB8fCAxO1xuXG5cdHZhciByYW5nZUxpbWl0ID0gdGhpcy5yYW5nZSAvIHRoaXMubGltaXQ7XG5cbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubGltaXQ7ICsraSApIHtcbiAgICAgICAgdGhpcy53aGl0ZVZhbHVlc1sgaSBdID0gTWF0aC5yYW5kb20oKSAlIHJhbmdlTGltaXQ7XG4gICAgfVxufTtcblxuUGlua051bWJlci5wcm90b3R5cGUuZ2V0TmV4dFZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxhc3RLZXkgPSB0aGlzLmtleSxcbiAgICAgICAgc3VtID0gMDtcblxuICAgICsrdGhpcy5rZXk7XG5cbiAgICBpZiggdGhpcy5rZXkgPiB0aGlzLm1heEtleSApIHtcbiAgICAgICAgdGhpcy5rZXkgPSAwO1xuICAgIH1cblxuICAgIHZhciBkaWZmID0gdGhpcy5sYXN0S2V5IF4gdGhpcy5rZXk7XG4gICAgdmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICBpZiggZGlmZiAmICgxIDw8IGkpICkge1xuICAgICAgICAgICAgdGhpcy53aGl0ZVZhbHVlc1sgaSBdID0gTWF0aC5yYW5kb20oKSAlIHJhbmdlTGltaXQ7XG4gICAgICAgIH1cblxuICAgICAgICBzdW0gKz0gdGhpcy53aGl0ZVZhbHVlc1sgaSBdO1xuICAgIH1cblxuICAgIHJldHVybiBzdW0gLyB0aGlzLmxpbWl0O1xufTtcblxudmFyIHBpbmsgPSBuZXcgUGlua051bWJlcigpO1xucGluay5nZW5lcmF0ZSgpO1xuXG5cblxuXG5cbmV4cG9ydCBkZWZhdWx0IHtcblx0cm91bmRGcm9tRXBzaWxvbjogZnVuY3Rpb24oIG4gKSB7XG5cdFx0bGV0IHJvdW5kZWQgPSBNYXRoLnJvdW5kKCBuICk7XG5cblx0XHRpZiAoIHJvdW5kZWQgJSBuIDwgQ09ORklHLmVwc2lsb24gKSB7XG5cdFx0XHRyZXR1cm4gcm91bmRlZFxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiBuO1xuXHRcdH1cblx0fSxcblxuXHRyb3VuZFRvTXVsdGlwbGU6IGZ1bmN0aW9uKCBuLCBtdWx0aXBsZSApIHtcblx0XHRyZXR1cm4gTWF0aC5mbG9vciggKCBuICsgbXVsdGlwbGUgLSAxICkgLyBtdWx0aXBsZSApICogbXVsdGlwbGU7XG5cdH0sXG5cblx0Y2xhbXA6IGZ1bmN0aW9uKCB2YWx1ZSwgbWluLCBtYXggKSB7XG5cdFx0cmV0dXJuIE1hdGgubWluKCBtYXgsIE1hdGgubWF4KCB2YWx1ZSwgbWluICkgKTtcblx0fSxcblxuXHRzY2FsZU51bWJlcjogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICkge1xuXHRcdHJldHVybiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSApICogKCBoaWdoT3V0IC0gbG93T3V0ICkgKyBsb3dPdXQ7XG5cdH0sXG5cblx0c2NhbGVOdW1iZXJFeHA6IGZ1bmN0aW9uKCBudW0sIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCwgZXhwICkge1xuXHRcdGlmICggdHlwZW9mIGV4cCAhPT0gJ251bWJlcicgfHwgZXhwID09PSAxICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc2NhbGVOdW1iZXIoIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICk7XG5cdFx0fVxuXG5cdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPT09IDAgKSB7XG5cdFx0XHRyZXR1cm4gbG93T3V0O1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApID4gMCApIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiBNYXRoLnBvdyggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApLCBleHAgKSApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHJldHVybiAoIGxvd091dCArICggaGlnaE91dCAtIGxvd091dCApICogLSggTWF0aC5wb3coICggKCAtbnVtICsgbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSApLCBleHAgKSApICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdC8vIEEgdmVyeSBwb29yIGFwcHJveGltYXRpb24gb2YgYSBnYXVzc2lhbiByYW5kb20gbnVtYmVyIGdlbmVyYXRvciFcblx0Z2F1c3NpYW5SYW5kb206IGZ1bmN0aW9uKCBjeWNsZXMgKSB7XG5cdFx0Y3ljbGVzID0gY3ljbGVzIHx8IDEwO1xuXG5cdFx0dmFyIG4gPSAwLFxuXHRcdFx0aSA9IGN5Y2xlcztcblxuXHRcdHdoaWxlKCAtLWkgKSB7XG5cdFx0XHRuICs9IE1hdGgucmFuZG9tKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG4gLyBjeWNsZXM7XG5cdH0sXG5cblx0Ly8gRnJvbTpcblx0Ly8gXHRodHRwOi8vd3d3Lm1lcmVkaXRoZG9kZ2UuY29tLzIwMTIvMDUvMzAvYS1ncmVhdC1saXR0bGUtamF2YXNjcmlwdC1mdW5jdGlvbi1mb3ItZ2VuZXJhdGluZy1yYW5kb20tZ2F1c3NpYW5ub3JtYWxiZWxsLWN1cnZlLW51bWJlcnMvXG5cdG5yYW5kOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgeDEsXG5cdFx0XHR4Mixcblx0XHRcdHJhZCxcblx0XHRcdHkxO1xuXG5cdFx0ZG8ge1xuXHRcdFx0eDEgPSAyICogTWF0aC5yYW5kb20oKSAtIDE7XG5cdFx0XHR4MiA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHJhZCA9IHgxICogeDEgKyB4MiAqIHgyO1xuXHRcdH0gd2hpbGUoIHJhZCA+PSAxIHx8IHJhZCA9PT0gMCApO1xuXG5cdFx0dmFyIGMgPSBNYXRoLnNxcnQoIC0yICogTWF0aC5sb2coIHJhZCApIC8gcmFkICk7XG5cblx0XHRyZXR1cm4gKCh4MSAqIGMpIC8gNSkgKiAwLjUgKyAwLjU7XG5cdH0sXG5cblx0Z2VuZXJhdGVQaW5rTnVtYmVyOiBwaW5rLmdlbmVyYXRlLFxuXHRnZXROZXh0UGlua051bWJlcjogcGluay5nZXROZXh0VmFsdWUsXG5cbn07IiwiZXhwb3J0IGRlZmF1bHQge1xuICAgIGNsZWFuVXBJbk91dHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaW5wdXRzLFxuICAgICAgICAgICAgb3V0cHV0cztcblxuICAgICAgICBpZiggQXJyYXkuaXNBcnJheSggdGhpcy5pbnB1dHMgKSApIHtcbiAgICAgICAgICAgIGlucHV0cyA9IHRoaXMuaW5wdXRzO1xuXG4gICAgICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgICAgICBpZiggaW5wdXRzWyBpIF0gJiYgdHlwZW9mIGlucHV0c1sgaSBdLmNsZWFuVXAgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0c1sgaSBdLmNsZWFuVXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiggaW5wdXRzWyBpIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0c1sgaSBdLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpbnB1dHNbIGkgXSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuaW5wdXRzID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KCB0aGlzLm91dHB1dHMgKSApIHtcbiAgICAgICAgICAgIG91dHB1dHMgPSB0aGlzLm91dHB1dHM7XG5cbiAgICAgICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgb3V0cHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgICAgICBpZiggb3V0cHV0c1sgaSBdICYmIHR5cGVvZiBvdXRwdXRzWyBpIF0uY2xlYW5VcCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0c1sgaSBdLmNsZWFuVXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiggb3V0cHV0c1sgaSBdICkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRzWyBpIF0uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG91dHB1dHNbIGkgXSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMub3V0cHV0cyA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY2xlYW5JTzogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmKCB0aGlzLmlvICkge1xuICAgICAgICAgICAgdGhpcy5pbyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiggdGhpcy5jb250ZXh0ICkge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn07IiwiZXhwb3J0IGRlZmF1bHQge1xuICAgIGNvbm5lY3Q6IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCApIHtcbiAgICAgICAgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9QYXJhbSB8fCBub2RlIGluc3RhbmNlb2YgQXVkaW9Ob2RlICkge1xuICAgICAgICAgICAgLy8gdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0uY29ubmVjdCggbm9kZSApO1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0uY29ubmVjdC5jYWxsKCB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXSwgbm9kZSwgMCwgaW5wdXRDaGFubmVsICk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICggbm9kZSAmJiBub2RlLm91dHB1dHMgJiYgbm9kZS5vdXRwdXRzLmxlbmd0aCApIHtcbiAgICAgICAgICAgIC8vIGlmKCBub2RlLmlucHV0c1sgaW5wdXRDaGFubmVsIF0gaW5zdGFuY2VvZiBQYXJhbSApIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAnQ09OTkVDVElORyBUTyBQQVJBTScgKTtcbiAgICAgICAgICAgIC8vIG5vZGUuaW8uY29uc3RhbnREcml2ZXIuZGlzY29ubmVjdCggbm9kZS5jb250cm9sICk7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmNvbm5lY3QoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnQVNTRVJUIE5PVCBSRUFDSEVEJyApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGRpc2Nvbm5lY3Q6IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCkge1xuICAgICAgICBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb1BhcmFtIHx8IG5vZGUgaW5zdGFuY2VvZiBBdWRpb05vZGUgKSB7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXS5kaXNjb25uZWN0LmNhbGwoIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLCBub2RlLCAwLCBpbnB1dENoYW5uZWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKCBub2RlICYmIG5vZGUuaW5wdXRzICYmIG5vZGUuaW5wdXRzLmxlbmd0aCApIHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmRpc2Nvbm5lY3QoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiggbm9kZSA9PT0gdW5kZWZpbmVkICYmIHRoaXMub3V0cHV0cyApIHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0cy5mb3JFYWNoKCBmdW5jdGlvbiggbiApIHtcbiAgICAgICAgICAgICAgICBpZiggbiAmJiB0eXBlb2Ygbi5kaXNjb25uZWN0ID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgICAgICBuLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9ICk7XG4gICAgICAgIH1cbiAgICB9XG59OyIsImltcG9ydCBtYXRoIGZyb20gXCIuL21hdGguZXM2XCI7XG5pbXBvcnQgbm90ZVN0cmluZ3MgZnJvbSBcIi4vbm90ZVN0cmluZ3MuZXM2XCI7XG5pbXBvcnQgbm90ZXMgZnJvbSBcIi4vbm90ZXMuZXM2XCI7XG5pbXBvcnQgQ09ORklHIGZyb20gXCIuLi9jb3JlL2NvbmZpZy5lczZcIjtcbmltcG9ydCBub3RlUmVnRXhwIGZyb20gXCIuL25vdGVSZWdFeHAuZXM2XCI7XG5cblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHNjYWxhclRvRGI6IGZ1bmN0aW9uKCBzY2FsYXIgKSB7XG4gICAgICAgIHJldHVybiAyMCAqICggTWF0aC5sb2coIHNjYWxhciApIC8gTWF0aC5MTjEwICk7XG4gICAgfSxcbiAgICBkYlRvU2NhbGFyOiBmdW5jdGlvbiggZGIgKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnBvdyggMiwgZGIgLyA2ICk7XG4gICAgfSxcblxuICAgIGh6VG9NSURJOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiBtYXRoLnJvdW5kRnJvbUVwc2lsb24oIDY5ICsgMTIgKiBNYXRoLmxvZzIoIHZhbHVlIC8gNDQwICkgKTtcbiAgICB9LFxuXG4gICAgaHpUb05vdGU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvTm90ZSggdGhpcy5oelRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBoelRvTXM6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgaWYgKCB2YWx1ZSA9PT0gMCApIHJldHVybiAwO1xuICAgICAgICByZXR1cm4gMTAwMCAvIHZhbHVlO1xuICAgIH0sXG5cbiAgICBoelRvQlBNOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zVG9CUE0oIHRoaXMuaHpUb01zKCB2YWx1ZSApICk7XG4gICAgfSxcblxuXG5cbiAgICBtaWRpVG9IejogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gTWF0aC5wb3coIDIsICggdmFsdWUgLSA2OSApIC8gMTIgKSAqIDQ0MDtcbiAgICB9LFxuXG4gICAgbWlkaVRvTm90ZTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICBsZXQgdmFsdWVzID0gKCB2YWx1ZSArICcnICkuc3BsaXQoICcuJyApLFxuICAgICAgICAgICAgbm90ZVZhbHVlID0gK3ZhbHVlc1sgMCBdLFxuICAgICAgICAgICAgY2VudHMgPSAoIHZhbHVlc1sgMSBdID8gcGFyc2VGbG9hdCggJzAuJyArIHZhbHVlc1sgMSBdLCAxMCApIDogMCApICogMTAwO1xuXG4gICAgICAgIGlmICggTWF0aC5hYnMoIGNlbnRzICkgPj0gMTAwICkge1xuICAgICAgICAgICAgbm90ZVZhbHVlICs9IGNlbnRzICUgMTAwO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJvb3QgPSBub3RlVmFsdWUgJSAxMiB8IDAsXG4gICAgICAgICAgICBvY3RhdmUgPSBub3RlVmFsdWUgLyAxMiB8IDAsXG4gICAgICAgICAgICBub3RlTmFtZSA9IG5vdGVTdHJpbmdzWyByb290IF07XG5cbiAgICAgICAgcmV0dXJuIG5vdGVOYW1lICsgKCBvY3RhdmUgKyBDT05GSUcubG93ZXN0T2N0YXZlICkgKyAoIGNlbnRzID8gJysnICsgY2VudHMgOiAnJyApO1xuICAgIH0sXG5cbiAgICBtaWRpVG9NczogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5oelRvTXMoIHRoaXMubWlkaVRvSHooIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbWlkaVRvQlBNOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zVG9CUE0oIHRoaXMubWlkaVRvTXMoIHZhbHVlICkgKTtcbiAgICB9LFxuXG5cblxuICAgIG5vdGVUb0h6OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb0h6KCB0aGlzLm5vdGVUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbm90ZVRvTUlESTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICBsZXQgbWF0Y2hlcyA9IG5vdGVSZWdFeHAuZXhlYyggdmFsdWUgKSxcbiAgICAgICAgICAgIG5vdGUsIGFjY2lkZW50YWwsIG9jdGF2ZSwgY2VudHMsXG4gICAgICAgICAgICBub3RlVmFsdWU7XG5cbiAgICAgICAgaWYgKCAhbWF0Y2hlcyApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ0ludmFsaWQgbm90ZSBmb3JtYXQ6JywgdmFsdWUgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vdGUgPSBtYXRjaGVzWyAxIF07XG4gICAgICAgIGFjY2lkZW50YWwgPSBtYXRjaGVzWyAyIF07XG4gICAgICAgIG9jdGF2ZSA9IHBhcnNlSW50KCBtYXRjaGVzWyAzIF0sIDEwICkgKyAtQ09ORklHLmxvd2VzdE9jdGF2ZTtcbiAgICAgICAgY2VudHMgPSBwYXJzZUZsb2F0KCBtYXRjaGVzWyA0IF0gKSB8fCAwO1xuXG4gICAgICAgIG5vdGVWYWx1ZSA9IG5vdGVzWyBub3RlICsgYWNjaWRlbnRhbCBdO1xuXG4gICAgICAgIHJldHVybiBtYXRoLnJvdW5kRnJvbUVwc2lsb24oIG5vdGVWYWx1ZSArICggb2N0YXZlICogMTIgKSArICggY2VudHMgKiAwLjAxICkgKTtcbiAgICB9LFxuXG4gICAgbm90ZVRvTXM6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvTXMoIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBub3RlVG9CUE06IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvQlBNKCB0aGlzLm5vdGVUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG5cblxuICAgIG1zVG9IejogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5oelRvTXMoIHZhbHVlICk7XG4gICAgfSxcblxuICAgIG1zVG9Ob3RlOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb01zKCB0aGlzLm5vdGVUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbXNUb01JREk6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaHpUb01JREkoIHRoaXMubXNUb0h6KCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIG1zVG9CUE06IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSAwID8gMCA6IDYwMDAwIC8gdmFsdWU7XG4gICAgfSxcblxuXG5cbiAgICBicG1Ub0h6OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zVG9IeiggdGhpcy5icG1Ub01zKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGJwbVRvTm90ZTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9CUE0oIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBicG1Ub01JREk6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb01JREkoIHRoaXMuYnBtVG9NcyggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBicG1Ub01zOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zVG9CUE0oIHZhbHVlICk7XG4gICAgfVxufTsiLCJpbXBvcnQgQ09ORklHIGZyb20gXCIuLi9jb3JlL2NvbmZpZy5lczZcIjtcblxuZnVuY3Rpb24gUGlua051bWJlcigpIHtcbiAgICB0aGlzLm1heEtleSA9IDB4MWY7XG4gICAgdGhpcy5rZXkgPSAwO1xuICAgIHRoaXMud2hpdGVWYWx1ZXMgPSBbXTtcbiAgICB0aGlzLnJhbmdlID0gMTI4O1xuICAgIHRoaXMubGltaXQgPSA1O1xuXG4gICAgdGhpcy5nZW5lcmF0ZSA9IHRoaXMuZ2VuZXJhdGUuYmluZCggdGhpcyApO1xuICAgIHRoaXMuZ2V0TmV4dFZhbHVlID0gdGhpcy5nZXROZXh0VmFsdWUuYmluZCggdGhpcyApO1xufVxuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZW5lcmF0ZSA9IGZ1bmN0aW9uKCByYW5nZSwgbGltaXQgKSB7XG4gICAgdGhpcy5yYW5nZSA9IHJhbmdlIHx8IDEyODtcbiAgICB0aGlzLm1heEtleSA9IDB4MWY7XG4gICAgdGhpcy5rZXkgPSAwO1xuICAgIHRoaXMubGltaXQgPSBsaW1pdCB8fCAxO1xuXG5cdHZhciByYW5nZUxpbWl0ID0gdGhpcy5yYW5nZSAvIHRoaXMubGltaXQ7XG5cbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubGltaXQ7ICsraSApIHtcbiAgICAgICAgdGhpcy53aGl0ZVZhbHVlc1sgaSBdID0gTWF0aC5yYW5kb20oKSAlIHJhbmdlTGltaXQ7XG4gICAgfVxufTtcblxuUGlua051bWJlci5wcm90b3R5cGUuZ2V0TmV4dFZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxhc3RLZXkgPSB0aGlzLmtleSxcbiAgICAgICAgc3VtID0gMDtcblxuICAgICsrdGhpcy5rZXk7XG5cbiAgICBpZiggdGhpcy5rZXkgPiB0aGlzLm1heEtleSApIHtcbiAgICAgICAgdGhpcy5rZXkgPSAwO1xuICAgIH1cblxuICAgIHZhciBkaWZmID0gdGhpcy5sYXN0S2V5IF4gdGhpcy5rZXk7XG4gICAgdmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICBpZiggZGlmZiAmICgxIDw8IGkpICkge1xuICAgICAgICAgICAgdGhpcy53aGl0ZVZhbHVlc1sgaSBdID0gTWF0aC5yYW5kb20oKSAlIHJhbmdlTGltaXQ7XG4gICAgICAgIH1cblxuICAgICAgICBzdW0gKz0gdGhpcy53aGl0ZVZhbHVlc1sgaSBdO1xuICAgIH1cblxuICAgIHJldHVybiBzdW0gLyB0aGlzLmxpbWl0O1xufTtcblxudmFyIHBpbmsgPSBuZXcgUGlua051bWJlcigpO1xucGluay5nZW5lcmF0ZSgpO1xuXG5cblxuXG5cbmV4cG9ydCBkZWZhdWx0IHtcblx0cm91bmRGcm9tRXBzaWxvbjogZnVuY3Rpb24oIG4gKSB7XG5cdFx0bGV0IHJvdW5kZWQgPSBNYXRoLnJvdW5kKCBuICk7XG5cblx0XHRpZiAoIHJvdW5kZWQgJSBuIDwgQ09ORklHLmVwc2lsb24gKSB7XG5cdFx0XHRyZXR1cm4gcm91bmRlZFxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiBuO1xuXHRcdH1cblx0fSxcblxuXHRyb3VuZFRvTXVsdGlwbGU6IGZ1bmN0aW9uKCBuLCBtdWx0aXBsZSApIHtcblx0XHRyZXR1cm4gTWF0aC5mbG9vciggKCBuICsgbXVsdGlwbGUgLSAxICkgLyBtdWx0aXBsZSApICogbXVsdGlwbGU7XG5cdH0sXG5cblx0Y2xhbXA6IGZ1bmN0aW9uKCB2YWx1ZSwgbWluLCBtYXggKSB7XG5cdFx0cmV0dXJuIE1hdGgubWluKCBtYXgsIE1hdGgubWF4KCB2YWx1ZSwgbWluICkgKTtcblx0fSxcblxuXHRzY2FsZU51bWJlcjogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICkge1xuXHRcdHJldHVybiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSApICogKCBoaWdoT3V0IC0gbG93T3V0ICkgKyBsb3dPdXQ7XG5cdH0sXG5cblx0c2NhbGVOdW1iZXJFeHA6IGZ1bmN0aW9uKCBudW0sIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCwgZXhwICkge1xuXHRcdGlmICggdHlwZW9mIGV4cCAhPT0gJ251bWJlcicgfHwgZXhwID09PSAxICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc2NhbGVOdW1iZXIoIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICk7XG5cdFx0fVxuXG5cdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPT09IDAgKSB7XG5cdFx0XHRyZXR1cm4gbG93T3V0O1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApID4gMCApIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiBNYXRoLnBvdyggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApLCBleHAgKSApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHJldHVybiAoIGxvd091dCArICggaGlnaE91dCAtIGxvd091dCApICogLSggTWF0aC5wb3coICggKCAtbnVtICsgbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSApLCBleHAgKSApICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdC8vIEEgdmVyeSBwb29yIGFwcHJveGltYXRpb24gb2YgYSBnYXVzc2lhbiByYW5kb20gbnVtYmVyIGdlbmVyYXRvciFcblx0Z2F1c3NpYW5SYW5kb206IGZ1bmN0aW9uKCBjeWNsZXMgKSB7XG5cdFx0Y3ljbGVzID0gY3ljbGVzIHx8IDEwO1xuXG5cdFx0dmFyIG4gPSAwLFxuXHRcdFx0aSA9IGN5Y2xlcztcblxuXHRcdHdoaWxlKCAtLWkgKSB7XG5cdFx0XHRuICs9IE1hdGgucmFuZG9tKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG4gLyBjeWNsZXM7XG5cdH0sXG5cblx0Ly8gRnJvbTpcblx0Ly8gXHRodHRwOi8vd3d3Lm1lcmVkaXRoZG9kZ2UuY29tLzIwMTIvMDUvMzAvYS1ncmVhdC1saXR0bGUtamF2YXNjcmlwdC1mdW5jdGlvbi1mb3ItZ2VuZXJhdGluZy1yYW5kb20tZ2F1c3NpYW5ub3JtYWxiZWxsLWN1cnZlLW51bWJlcnMvXG5cdG5yYW5kOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgeDEsXG5cdFx0XHR4Mixcblx0XHRcdHJhZCxcblx0XHRcdHkxO1xuXG5cdFx0ZG8ge1xuXHRcdFx0eDEgPSAyICogTWF0aC5yYW5kb20oKSAtIDE7XG5cdFx0XHR4MiA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHJhZCA9IHgxICogeDEgKyB4MiAqIHgyO1xuXHRcdH0gd2hpbGUoIHJhZCA+PSAxIHx8IHJhZCA9PT0gMCApO1xuXG5cdFx0dmFyIGMgPSBNYXRoLnNxcnQoIC0yICogTWF0aC5sb2coIHJhZCApIC8gcmFkICk7XG5cblx0XHRyZXR1cm4gKCh4MSAqIGMpIC8gNSkgKiAwLjUgKyAwLjU7XG5cdH0sXG5cblx0Z2VuZXJhdGVQaW5rTnVtYmVyOiBwaW5rLmdlbmVyYXRlLFxuXHRnZXROZXh0UGlua051bWJlcjogcGluay5nZXROZXh0VmFsdWUsXG5cbn07IiwiZXhwb3J0IGRlZmF1bHQgL14oW0F8QnxDfER8RXxGfEddezF9KShbI2J4XXswLDJ9KShbXFwtXFwrXT9cXGQrKT8oW1xcK3xcXC1dezF9XFxkKi5cXGQqKT8vOyIsImV4cG9ydCBkZWZhdWx0IFsgJ0MnLCAnQyMnLCAnRCcsICdEIycsICdFJywgJ0YnLCAnRiMnLCAnRycsICdHIycsICdBJywgJ0EjJywgJ0InIF07IiwiZXhwb3J0IGRlZmF1bHQge1xuICAgICdDJzogMCwgICAgICdEYmInOiAwLCAgICdCIyc6IDAsXG4gICAgJ0MjJzogMSwgICAgJ0RiJzogMSwgICAgJ0IjIyc6IDEsICAgJ0J4JzogMSxcbiAgICAnRCc6IDIsICAgICAnRWJiJzogMiwgICAnQyMjJzogMiwgICAnQ3gnOiAyLFxuICAgICdEIyc6IDMsICAgICdFYic6IDMsICAgICdGYmInOiAzLFxuICAgICdFJzogNCwgICAgICdGYic6IDQsICAgICdEIyMnOiA0LCAgICdEeCc6IDQsXG4gICAgJ0YnOiA1LCAgICAgJ0diYic6IDUsICAgJ0UjJzogNSxcbiAgICAnRiMnOiA2LCAgICAnR2InOiA2LCAgICAnRSMjJzogNiwgICAnRXgnOiA2LFxuICAgICdHJzogNywgICAgICdBYmInOiA3LCAgICdGIyMnOiA3LCAgJ0Z4JzogNyxcbiAgICAnRyMnOiA4LCAgICAnQWInOiA4LFxuICAgICdBJzogOSwgICAgICdCYmInOiA5LCAgICdHIyMnOiA5LCAgJ0d4JzogOSxcbiAgICAnQSMnOiAxMCwgICAnQmInOiAxMCwgICAnQ2JiJzogMTAsXG4gICAgJ0InOiAxMSwgICAgJ0NiJzogMTEsICAgJ0EjIyc6IDExLCAnQXgnOiAxMVxufTsiLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBfc2V0SU8oIGlvICkge1xuICAgIHRoaXMuaW8gPSBpbztcbiAgICB0aGlzLmNvbnRleHQgPSBpby5jb250ZXh0O1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgT3NjaWxsYXRvckJhbmsgZnJvbSBcIi4uL29zY2lsbGF0b3JzL09zY2lsbGF0b3JCYW5rLmVzNlwiO1xuXG5jbGFzcyBGTU9zY2lsbGF0b3IgZXh0ZW5kcyBPc2NpbGxhdG9yQmFuayB7XG5cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoIHRoaXMgKTtcblxuICAgICAgICAvLyBGTS9tb2R1bGF0b3Igb3NjaWxsYXRvciBzZXR1cFxuICAgICAgICBncmFwaC5mbU9zY2lsbGF0b3IgPSB0aGlzLmlvLmNyZWF0ZU9zY2lsbGF0b3JCYW5rKCk7XG4gICAgICAgIGdyYXBoLmZtT3NjQW1vdW50ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguZm1Pc2NBbW91bnRNdWx0aXBsaWVyID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5mbU9zY0Ftb3VudC5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgZ3JhcGguZm1Pc2NpbGxhdG9yLmNvbm5lY3QoIGdyYXBoLmZtT3NjQW1vdW50ICk7XG4gICAgICAgIGdyYXBoLmZtT3NjQW1vdW50LmNvbm5lY3QoIGdyYXBoLmZtT3NjQW1vdW50TXVsdGlwbGllciwgMCwgMCApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1GcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1GcmVxdWVuY3kuY29ubmVjdCggZ3JhcGguZm1Pc2NpbGxhdG9yLmNvbnRyb2xzLmZyZXF1ZW5jeSApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZtRnJlcXVlbmN5LmNvbm5lY3QoIGdyYXBoLmZtT3NjQW1vdW50TXVsdGlwbGllciwgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1XYXZlZm9ybSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mbVdhdmVmb3JtLmNvbm5lY3QoIGdyYXBoLmZtT3NjaWxsYXRvci5jb250cm9scy53YXZlZm9ybSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1Pc2NBbW91bnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1Pc2NBbW91bnQuY29ubmVjdCggZ3JhcGguZm1Pc2NBbW91bnQuZ2FpbiApO1xuXG5cbiAgICAgICAgLy8gU2VsZi1mbSBzZXR1cFxuICAgICAgICBncmFwaC5mbVNlbGZBbW91bnRzID0gW107XG4gICAgICAgIGdyYXBoLmZtU2VsZkFtb3VudE11bHRpcGxpZXJzID0gW107XG4gICAgICAgIHRoaXMuY29udHJvbHMuZm1TZWxmQW1vdW50ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgZ3JhcGgub3NjaWxsYXRvcnMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgIFx0Ly8gQ29ubmVjdCBGTSBvc2NpbGxhdG9yIHRvIHRoZSBleGlzdGluZyBvc2NpbGxhdG9yc1xuICAgICAgICBcdC8vIGZyZXF1ZW5jeSBjb250cm9sLlxuICAgICAgICBcdGdyYXBoLmZtT3NjQW1vdW50TXVsdGlwbGllci5jb25uZWN0KCBncmFwaC5vc2NpbGxhdG9yc1sgaSBdLmZyZXF1ZW5jeSApO1xuXG5cbiAgICAgICAgXHQvLyBGb3IgZWFjaCBvc2NpbGxhdG9yIGluIHRoZSBvc2NpbGxhdG9yIGJhbmssXG4gICAgICAgIFx0Ly8gY3JlYXRlIGEgRk0tc2VsZiBHYWluTm9kZSwgYW5kIGNvbm5lY3QgdGhlIG9zY1xuICAgICAgICBcdC8vIHRvIGl0LCB0aGVuIGl0IHRvIHRoZSBvc2MncyBmcmVxdWVuY3kuXG4gICAgICAgIFx0Z3JhcGguZm1TZWxmQW1vdW50c1sgaSBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgXHRncmFwaC5mbVNlbGZBbW91bnRzWyBpIF0uZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgXHRncmFwaC5mbVNlbGZBbW91bnRNdWx0aXBsaWVyc1sgaSBdID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBcdGdyYXBoLmZtU2VsZkFtb3VudHNbIGkgXS5jb25uZWN0KCBncmFwaC5mbVNlbGZBbW91bnRNdWx0aXBsaWVyc1sgaSBdLCAwLCAwICk7XG4gICAgICAgIFx0dGhpcy5jb250cm9scy5mcmVxdWVuY3kuY29ubmVjdCggZ3JhcGguZm1TZWxmQW1vdW50TXVsdGlwbGllcnNbIGkgXSwgMCwgMSApO1xuXG4gICAgICAgIFx0Z3JhcGgub3NjaWxsYXRvcnNbIGkgXS5jb25uZWN0KCBncmFwaC5mbVNlbGZBbW91bnRzWyBpIF0gKTtcbiAgICAgICAgXHRncmFwaC5mbVNlbGZBbW91bnRNdWx0aXBsaWVyc1sgaSBdLmNvbm5lY3QoIGdyYXBoLm9zY2lsbGF0b3JzWyBpIF0uZnJlcXVlbmN5ICk7XG5cbiAgICAgICAgXHQvLyBNYWtlIHN1cmUgdGhlIEZNLXNlbGYgYW1vdW50IGlzIGNvbnRyb2xsYWJsZSB3aXRoIG9uZSBwYXJhbWV0ZXIuXG4gICAgICAgIFx0dGhpcy5jb250cm9scy5mbVNlbGZBbW91bnQuY29ubmVjdCggZ3JhcGguZm1TZWxmQW1vdW50c1sgaSBdLmdhaW4gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVGTU9zY2lsbGF0b3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEZNT3NjaWxsYXRvciggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuaW1wb3J0IG1hdGggZnJvbSBcIi4uL21peGlucy9tYXRoLmVzNlwiO1xuXG5cbnZhciBCVUZGRVJTID0gbmV3IFdlYWtNYXAoKTtcblxuY2xhc3MgTm9pc2VPc2NpbGxhdG9yIGV4dGVuZHMgTm9kZSB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCB0aGlzICksXG4gICAgICAgICAgICB0eXBlcyA9IHRoaXMuY29uc3RydWN0b3IudHlwZXMsXG4gICAgICAgICAgICB0eXBlS2V5cyA9IE9iamVjdC5rZXlzKCB0eXBlcyApLFxuICAgICAgICAgICAgYnVmZmVycyA9IHRoaXMuX2dldEJ1ZmZlcnMoKTtcblxuICAgICAgICBncmFwaC5idWZmZXJTb3VyY2VzID0gW107XG4gICAgICAgIGdyYXBoLm91dHB1dEdhaW4gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyID0gdGhpcy5pby5jcmVhdGVDcm9zc2ZhZGVyKCBPYmplY3Qua2V5cyggdHlwZXMgKS5sZW5ndGgsIDAgKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0R2Fpbi5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IHR5cGVLZXlzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKSxcbiAgICAgICAgICAgICAgICBidWZmZXIgPSBidWZmZXJzWyB0eXBlS2V5c1sgaSBdIF07XG5cbiAgICAgICAgICAgIHNvdXJjZS5idWZmZXIgPSBidWZmZXI7XG4gICAgICAgICAgICBzb3VyY2UubG9vcCA9IHRydWU7XG4gICAgICAgICAgICBzb3VyY2Uuc3RhcnQoIDAgKTtcblxuICAgICAgICAgICAgc291cmNlLmNvbm5lY3QoIGdyYXBoLmNyb3NzZmFkZXIsIDAsIGkgKTtcbiAgICAgICAgICAgIGdyYXBoLmJ1ZmZlclNvdXJjZXMucHVzaCggc291cmNlICk7XG4gICAgICAgIH1cblxuICAgICAgICBncmFwaC5jcm9zc2ZhZGVyLmNvbm5lY3QoIGdyYXBoLm91dHB1dEdhaW4gKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0R2Fpbi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudHlwZSA9IGdyYXBoLmNyb3NzZmFkZXIuY29udHJvbHMuaW5kZXg7XG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgX2NyZWF0ZVNpbmdsZUJ1ZmZlciggdHlwZSApIHtcbiAgICAgICAgdmFyIHNhbXBsZVJhdGUgPSB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSxcbiAgICAgICAgICAgIGJ1ZmZlciA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIoIDEsIHNhbXBsZVJhdGUsIHNhbXBsZVJhdGUgKSxcbiAgICAgICAgICAgIGNoYW5uZWwgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIDAgKSxcbiAgICAgICAgICAgIGZuO1xuXG4gICAgICAgIHN3aXRjaCggdHlwZSApIHtcbiAgICAgICAgICAgIGNhc2UgJ1dISVRFJzpcbiAgICAgICAgICAgICAgICBmbiA9IE1hdGgucmFuZG9tO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdHQVVTU0lBTl9XSElURSc6XG4gICAgICAgICAgICAgICAgZm4gPSBtYXRoLm5yYW5kO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdQSU5LJzpcbiAgICAgICAgICAgICAgICBtYXRoLmdlbmVyYXRlUGlua051bWJlciggMTI4LCA1ICk7XG4gICAgICAgICAgICAgICAgZm4gPSBtYXRoLmdldE5leHRQaW5rTnVtYmVyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBzYW1wbGVSYXRlOyArK2kgKSB7XG4gICAgICAgICAgICBjaGFubmVsWyBpIF0gPSBmbigpICogMiAtIDE7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyggdHlwZSwgTWF0aC5taW4uYXBwbHkoIE1hdGgsIGNoYW5uZWwgKSwgTWF0aC5tYXguYXBwbHkoIE1hdGgsIGNoYW5uZWwgKSApO1xuXG4gICAgICAgIHJldHVybiBidWZmZXI7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUJ1ZmZlcnMoKSB7XG4gICAgICAgIHZhciBidWZmZXJzID0ge30sXG4gICAgICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMoIGJ1ZmZlcnMgKSxcbiAgICAgICAgICAgIHR5cGVzID0gdGhpcy5jb25zdHJ1Y3Rvci50eXBlcyxcbiAgICAgICAgICAgIHR5cGVLZXlzID0gT2JqZWN0LmtleXMoIHR5cGVzICksXG4gICAgICAgICAgICBidWZmZXI7XG5cbiAgICAgICAgLy8gQnVmZmVycyBhbHJlYWR5IGNyZWF0ZWQuIFN0b3AgaGVyZS5cbiAgICAgICAgaWYoIGtleXMubGVuZ3RoICE9PSAwICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0eXBlS2V5cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIGJ1ZmZlcnNbIHR5cGVLZXlzWyBpIF0gXSA9IHRoaXMuX2NyZWF0ZVNpbmdsZUJ1ZmZlciggdHlwZUtleXNbIGkgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2V0QnVmZmVycyggYnVmZmVycyApO1xuICAgIH1cblxuICAgIF9nZXRCdWZmZXJzKCkge1xuICAgICAgICB2YXIgYnVmZmVycyA9IEJVRkZFUlMuZ2V0KCB0aGlzLmlvICk7XG5cbiAgICAgICAgaWYoIGJ1ZmZlcnMgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZUJ1ZmZlcnMoKTtcbiAgICAgICAgICAgIGJ1ZmZlcnMgPSBCVUZGRVJTLmdldCggdGhpcy5pbyApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJ1ZmZlcnM7XG4gICAgfVxuXG4gICAgX3NldEJ1ZmZlcnMoIGJ1ZmZlcnMgKSB7XG4gICAgICAgIEJVRkZFUlMuc2V0KCB0aGlzLmlvLCBidWZmZXJzICk7XG4gICAgfVxuXG4gICAgc3RhcnQoIHRpbWUgKSB7XG4gICAgICAgIHZhciBvdXRwdXRHYWluID0gdGhpcy5nZXRHcmFwaCggdGhpcyApLm91dHB1dEdhaW47XG5cbiAgICAgICAgdGltZSA9IHRpbWUgfHwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lO1xuICAgICAgICBvdXRwdXRHYWluLmdhaW4udmFsdWUgPSAxO1xuICAgIH1cblxuICAgIHN0b3AoIHRpbWUgKSB7XG4gICAgICAgIHZhciBvdXRwdXRHYWluID0gdGhpcy5nZXRHcmFwaCggdGhpcyApLm91dHB1dEdhaW47XG5cbiAgICAgICAgdGltZSA9IHRpbWUgfHwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lO1xuICAgICAgICBvdXRwdXRHYWluLmdhaW4udmFsdWUgPSAwO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxufVxuXG5cbk5vaXNlT3NjaWxsYXRvci50eXBlcyA9IHtcbiAgICBXSElURTogMCxcbiAgICBHQVVTU0lBTl9XSElURTogMSxcbiAgICBQSU5LOiAyXG59O1xuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5vaXNlT3NjaWxsYXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTm9pc2VPc2NpbGxhdG9yKCB0aGlzICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG52YXIgT1NDSUxMQVRPUl9UWVBFUyA9IFtcbiAgICAnc2luZScsXG4gICAgJ3RyaWFuZ2xlJyxcbiAgICAnc2F3dG9vdGgnLFxuICAgICdzcXVhcmUnXG5dO1xuXG5jbGFzcyBPc2NpbGxhdG9yQmFuayBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNyb3NzZmFkZXIgPSB0aGlzLmlvLmNyZWF0ZUNyb3NzZmFkZXIoIE9TQ0lMTEFUT1JfVFlQRVMubGVuZ3RoLCAwICk7XG4gICAgICAgIGdyYXBoLm9zY2lsbGF0b3JzID0gW107XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZGV0dW5lID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLndhdmVmb3JtID0gZ3JhcGguY3Jvc3NmYWRlci5jb250cm9scy5pbmRleDtcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IE9TQ0lMTEFUT1JfVFlQRVMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB2YXIgb3NjID0gdGhpcy5jb250ZXh0LmNyZWF0ZU9zY2lsbGF0b3IoKTtcblxuICAgICAgICAgICAgb3NjLnR5cGUgPSBPU0NJTExBVE9SX1RZUEVTWyBpIF07XG4gICAgICAgICAgICBvc2MuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgICAgIG9zYy5zdGFydCggMCApO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBvc2MuZnJlcXVlbmN5ICk7XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmRldHVuZS5jb25uZWN0KCBvc2MuZGV0dW5lICk7XG4gICAgICAgICAgICBvc2MuY29ubmVjdCggZ3JhcGguY3Jvc3NmYWRlciwgMCwgaSApO1xuXG4gICAgICAgICAgICBncmFwaC5vc2NpbGxhdG9ycy5wdXNoKCBvc2MgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0TGV2ZWwuZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgZ3JhcGguY3Jvc3NmYWRlci5jb25uZWN0KCBncmFwaC5vdXRwdXRMZXZlbCApO1xuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgc3RhcnQoIGRlbGF5ID0gMCApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAxO1xuICAgIH1cblxuICAgIHN0b3AoIGRlbGF5ID0gMCApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAwO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlT3NjaWxsYXRvckJhbmsgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9zY2lsbGF0b3JCYW5rKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBPc2NpbGxhdG9yQmFuazsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBTaW5lQmFuayBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtU2luZXMgPSA0ICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgub3NjaWxsYXRvcnMgPSBbXTtcbiAgICAgICAgZ3JhcGguaGFybW9uaWNNdWx0aXBsaWVycyA9IFtdO1xuICAgICAgICBncmFwaC5udW1TaW5lcyA9IG51bVNpbmVzO1xuICAgICAgICBncmFwaC5vdXRwdXRMZXZlbCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAxIC8gbnVtU2luZXM7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZGV0dW5lID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhhcm1vbmljcyA9IFtdO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG51bVNpbmVzOyArK2kgKSB7XG4gICAgICAgICAgICB2YXIgb3NjID0gdGhpcy5jb250ZXh0LmNyZWF0ZU9zY2lsbGF0b3IoKSxcbiAgICAgICAgICAgICAgICBoYXJtb25pY0NvbnRyb2wgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCksXG4gICAgICAgICAgICAgICAgaGFybW9uaWNNdWx0aXBsaWVyID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgICAgICBvc2MudHlwZSA9ICdzaW5lJztcbiAgICAgICAgICAgIG9zYy5mcmVxdWVuY3kudmFsdWUgPSAwO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeS5jb25uZWN0KCBoYXJtb25pY011bHRpcGxpZXIsIDAsIDAgKTtcbiAgICAgICAgICAgIGhhcm1vbmljQ29udHJvbC5jb25uZWN0KCBoYXJtb25pY011bHRpcGxpZXIsIDAsIDEgKTtcbiAgICAgICAgICAgIGhhcm1vbmljTXVsdGlwbGllci5jb25uZWN0KCBvc2MuZnJlcXVlbmN5ICk7XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLmRldHVuZS5jb25uZWN0KCBvc2MuZGV0dW5lICk7XG5cbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuaGFybW9uaWNzWyBpIF0gPSBoYXJtb25pY0NvbnRyb2w7XG5cbiAgICAgICAgICAgIG9zYy5zdGFydCggMCApO1xuICAgICAgICAgICAgb3NjLmNvbm5lY3QoIGdyYXBoLm91dHB1dExldmVsICk7XG4gICAgICAgICAgICBncmFwaC5vc2NpbGxhdG9ycy5wdXNoKCBvc2MgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBzdGFydCggZGVsYXkgPSAwICkge1xuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG4gICAgICAgIGdyYXBoLm91dHB1dExldmVsLmdhaW4udmFsdWUgPSAxIC8gZ3JhcGgubnVtU2luZXM7XG4gICAgfVxuXG4gICAgc3RvcCggZGVsYXkgPSAwICkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkub3V0cHV0TGV2ZWwuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTaW5lQmFuayA9IGZ1bmN0aW9uKCBudW1TaW5lcyApIHtcbiAgICByZXR1cm4gbmV3IFNpbmVCYW5rKCB0aGlzLCBudW1TaW5lcyApO1xufTtcblxuZXhwb3J0XG5kZWZhdWx0IFNpbmVCYW5rOyJdfQ==
