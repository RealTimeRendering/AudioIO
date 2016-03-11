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

},{"../mixins/conversions.es6":64,"../mixins/math.es6":65,"./config.es6":5,"./overrides.es6":6,"./signalCurves.es6":7}],2:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":62,"../mixins/connections.es6":63,"../mixins/setIO.es6":69,"./AudioIO.es6":1}],3:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":62,"../mixins/connections.es6":63,"../mixins/setIO.es6":69,"./AudioIO.es6":1}],4:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":62,"../mixins/connections.es6":63,"../mixins/setIO.es6":69,"./AudioIO.es6":1}],5:[function(require,module,exports){
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
            x = i / resolution * 2 - 1;
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

},{"../mixins/Math.es6":61,"./config.es6":5}],8:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/config.es6":5,"../mixins/setIO.es6":69}],10:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../graphs/DryWetNode.es6":16}],11:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../graphs/DryWetNode.es6":16,"../mixins/cleaners.es6":62,"../mixins/connections.es6":63,"../mixins/setIO.es6":69,"./Delay.es6":10}],12:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../mixins/setIO.es6":69}],13:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],14:[function(require,module,exports){
"use strict";

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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],15:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var DiffuseDelay = (function (_Node) {
    function DiffuseDelay(io) {
        _classCallCheck(this, DiffuseDelay);

        _Node.call(this, io, 1, 1);

        this.controls = {
            diffusion: this.io.createParam(),
            time: this.io.createParam()
        };

        this.feedbackAdder = this.io.createAdd();
        this.delay = this.context.createDelay();
        this.negate = this.io.createNegate();
        this.multiply1 = this.io.createMultiply();
        this.multiply2 = this.io.createMultiply();
        this.sum = this.io.createAdd();
        this.shelf = this.io.createEQShelf();

        this.delay.delayTime.value = 0;
        this.controls.time.connect(this.delay.delayTime);

        this.controls.diffusion.connect(this.negate);
        this.inputs[0].connect(this.multiply1, 0, 0);
        this.negate.connect(this.multiply1, 0, 1);
        this.multiply1.connect(this.sum, 0, 1);

        this.inputs[0].connect(this.feedbackAdder, 0, 0);
        this.multiply2.connect(this.feedbackAdder, 0, 1);

        this.feedbackAdder.connect(this.delay);
        this.delay.connect(this.shelf);

        this.shelf.connect(this.sum, 0, 0);

        this.controls.diffusion.connect(this.multiply2, 0, 1);
        this.sum.connect(this.multiply2, 0, 1);
        this.sum.connect(this.outputs[0]);
    }

    _inherits(DiffuseDelay, _Node);

    return DiffuseDelay;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createDiffuseDelay = function () {
    return new DiffuseDelay(this);
};

exports["default"] = DiffuseDelay;
module.exports = exports["default"];

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],16:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/cleaners.es6":62,"../mixins/connections.es6":63,"../mixins/setIO.es6":69}],17:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],18:[function(require,module,exports){
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

        this.frequency = this.io.createParam();
        this["switch"] = this.io.createSwitch(OSCILLATOR_TYPES.length);

        this.oscillators = [];

        for (var i = 0; i < OSCILLATOR_TYPES.length; ++i) {
            var osc = this.context.createOscillator();
            osc.type = OSCILLATOR_TYPES[i];
            osc.frequency.value = 0;
            this.frequency.connect(osc.frequency);
            osc.start(0);
            osc.connect(this["switch"], 0, i);
            this.oscillators.push(osc);
        }

        this["switch"].connect(this.outputs[0]);

        // Store controllable params.
        this.controls.waveform = this["switch"].control;
        this.controls.frequency = this.frequency;
    }

    _inherits(OscillatorBank, _Node);

    return OscillatorBank;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createOscillatorBank = function () {
    return new OscillatorBank(this);
};

exports["default"] = OscillatorBank;
module.exports = exports["default"];

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],19:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],20:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/math.es6":65}],21:[function(require,module,exports){
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

require('./graphs/DiffuseDelay.es6');

require('./graphs/OscillatorBank.es6');

require('./graphs/Counter.es6');

require('./graphs/DryWetNode.es6');

require('./graphs/PhaseOffset.es6');

require('./graphs/Crossfader.es6');

require('./oscillators/NoiseOscillator.es6');

window.AudioContext = window.AudioContext || window.webkitAudioContext;

// import './graphs/Sketch.es6';

window.Param = _coreParamEs62['default'];
window.Node = _coreNodeEs62['default'];

},{"./core/AudioIO.es6":1,"./core/Node.es6":2,"./core/Param.es6":3,"./core/WaveShaper.es6":4,"./envelopes/ASDREnvelope.es6":8,"./envelopes/CustomEnvelope.es6":9,"./fx/Delay.es6":10,"./fx/PingPongDelay.es6":11,"./generators/OscillatorGenerator.es6":12,"./graphs/Counter.es6":13,"./graphs/Crossfader.es6":14,"./graphs/DiffuseDelay.es6":15,"./graphs/DryWetNode.es6":16,"./graphs/EQShelf.es6":17,"./graphs/OscillatorBank.es6":18,"./graphs/PhaseOffset.es6":19,"./instruments/GeneratorPlayer.es6":20,"./math/Abs.es6":22,"./math/Add.es6":23,"./math/Average.es6":24,"./math/Clamp.es6":25,"./math/Constant.es6":26,"./math/Divide.es6":27,"./math/Floor.es6":28,"./math/Lerp.es6":29,"./math/Max.es6":30,"./math/Min.es6":31,"./math/Multiply.es6":32,"./math/Negate.es6":33,"./math/Pow.es6":34,"./math/Reciprocal.es6":35,"./math/Round.es6":36,"./math/SampleDelay.es6":37,"./math/Scale.es6":38,"./math/ScaleExp.es6":39,"./math/Sign.es6":40,"./math/Sqrt.es6":41,"./math/Square.es6":42,"./math/Subtract.es6":43,"./math/Switch.es6":44,"./math/logical-operators/AND.es6":45,"./math/logical-operators/LogicalOperator.es6":46,"./math/logical-operators/NOT.es6":47,"./math/logical-operators/OR.es6":48,"./math/relational-operators/EqualTo.es6":49,"./math/relational-operators/EqualToZero.es6":50,"./math/relational-operators/GreaterThan.es6":51,"./math/relational-operators/GreaterThanZero.es6":52,"./math/relational-operators/IfElse.es6":53,"./math/relational-operators/LessThan.es6":54,"./math/relational-operators/LessThanZero.es6":55,"./math/trigonometry/Cos.es6":56,"./math/trigonometry/DegToRad.es6":57,"./math/trigonometry/RadToDeg.es6":58,"./math/trigonometry/Sin.es6":59,"./math/trigonometry/Tan.es6":60,"./oscillators/NoiseOscillator.es6":70}],22:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],23:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],24:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],25:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],26:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],28:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],29:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],30:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],33:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],36:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],37:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],38:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],39:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],40:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],41:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],42:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],43:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],44:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],45:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":46}],46:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],47:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":46}],48:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":46}],49:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],50:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2,"./EqualTo.es6":49}],51:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],52:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],53:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],54:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],55:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],56:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],57:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],58:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],59:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],60:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],61:[function(require,module,exports){
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

},{"../core/config.es6":5}],62:[function(require,module,exports){
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

},{}],63:[function(require,module,exports){
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

},{}],64:[function(require,module,exports){
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

},{"../core/config.es6":5,"./math.es6":65,"./noteRegExp.es6":66,"./noteStrings.es6":67,"./notes.es6":68}],65:[function(require,module,exports){
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

},{"../core/config.es6":5}],66:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = /^([A|B|C|D|E|F|G]{1})([#bx]{0,2})([\-\+]?\d+)?([\+|\-]{1}\d*.\d*)?/;
module.exports = exports["default"];

},{}],67:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
module.exports = exports['default'];

},{}],68:[function(require,module,exports){
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

},{}],69:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = _setIO;

function _setIO(io) {
    this.io = io;
    this.context = io.context;
}

;
module.exports = exports["default"];

},{}],70:[function(require,module,exports){
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
        graph["switch"] = this.io.createSwitch(Object.keys(types).length, 0);
        graph.outputGain.gain.value = 0;

        for (var i = 0; i < typeKeys.length; ++i) {
            var source = this.context.createBufferSource(),
                buffer = buffers[typeKeys[i]];

            source.buffer = buffer;
            source.loop = true;
            source.start(0);

            source.connect(graph["switch"], 0, i);
            graph.bufferSources.push(source);
        }

        graph["switch"].connect(graph.outputGain);
        graph.outputGain.connect(this.outputs[0]);

        this.controls.type = graph["switch"].control;
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/math.es6":65}]},{},[21])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9jb3JlL0F1ZGlvSU8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvY29yZS9Ob2RlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvUGFyYW0uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvY29yZS9XYXZlU2hhcGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvY29uZmlnLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvb3ZlcnJpZGVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvc2lnbmFsQ3VydmVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2VudmVsb3Blcy9BU0RSRW52ZWxvcGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZW52ZWxvcGVzL0N1c3RvbUVudmVsb3BlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L0RlbGF5LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L1BpbmdQb25nRGVsYXkuZXM2LmpzIiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ2VuZXJhdG9ycy9Pc2NpbGxhdG9yR2VuZXJhdG9yLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9Db3VudGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9Dcm9zc2ZhZGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9EaWZmdXNlRGVsYXkuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL0RyeVdldE5vZGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL0VRU2hlbGYuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL09zY2lsbGF0b3JCYW5rLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9QaGFzZU9mZnNldC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9pbnN0cnVtZW50cy9HZW5lcmF0b3JQbGF5ZXIuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWFpbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0Ficy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0FkZC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0F2ZXJhZ2UuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9DbGFtcC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0NvbnN0YW50LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvRGl2aWRlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvRmxvb3IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9MZXJwLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvTWF4LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvTWluLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvTXVsdGlwbHkuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9OZWdhdGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9Qb3cuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9SZWNpcHJvY2FsLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvUm91bmQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TYW1wbGVEZWxheS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1NjYWxlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU2NhbGVFeHAuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TaWduLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU3FydC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1NxdWFyZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1N1YnRyYWN0LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU3dpdGNoLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvQU5ELmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTG9naWNhbE9wZXJhdG9yLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTk9ULmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvT1IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9FcXVhbFRvLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUb1plcm8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuWmVyby5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0lmRWxzZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvTGVzc1RoYW5aZXJvLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L0Nvcy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9EZWdUb1JhZC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9SYWRUb0RlZy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9TaW4uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC90cmlnb25vbWV0cnkvVGFuLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9NYXRoLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9jbGVhbmVycy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvY29ubmVjdGlvbnMuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL2NvbnZlcnNpb25zLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9tYXRoLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9ub3RlUmVnRXhwLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9ub3RlU3RyaW5ncy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvbm90ZXMuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL3NldElPLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL29zY2lsbGF0b3JzL05vaXNlT3NjaWxsYXRvci5lczYiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7O3lCQ0FtQixjQUFjOzs7O1FBQzFCLGlCQUFpQjs7K0JBQ0Msb0JBQW9COzs7O29DQUNyQiwyQkFBMkI7Ozs7NkJBQ2xDLG9CQUFvQjs7OztJQUUvQixPQUFPO0FBZUUsYUFmVCxPQUFPLEdBZW1DO1lBQS9CLE9BQU8sZ0NBQUcsSUFBSSxZQUFZLEVBQUU7OzhCQWZ2QyxPQUFPOztBQWdCTCxZQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQzs7QUFFeEIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQzs7Ozs7Ozs7OztBQVV4QyxjQUFNLENBQUMsY0FBYyxDQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtBQUMzQyxxQkFBUyxFQUFFLEtBQUs7QUFDaEIsZUFBRyxFQUFJLENBQUEsWUFBVztBQUNkLG9CQUFJLGNBQWMsWUFB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R0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7O0FBRTVCLGFBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNoQyxhQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDMUMsYUFBSyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDOztBQUUxQyxhQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBRSxDQUFDO0FBQzNDLGFBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsR0FBRyxDQUFFLENBQUM7QUFDdkMsYUFBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUUsQ0FBQzs7QUFFM0MsYUFBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDMUMsYUFBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDNUMsYUFBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDL0MsYUFBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRTVDLGFBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3ZDLGFBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFF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LENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLFVBQVUsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsU0FBUyxDQUFFLENBQUM7QUFDNUMsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLFFBQVEsQ0FBRSxDQUFDO0FBQzVDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXBDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxNQUFNLENBQUUsQ0FBQzs7O0FBR3pDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHOUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5QyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVB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LENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLFVBQVUsQ0FBRSxDQUFDO0FBQzdDLGFBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxRQUFRLENBQUUsQ0FBQztBQUM1QyxhQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVwQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFFLENBQUM7OztBQUd6QyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzlDLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsYUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUc1QyxhQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzlDLGFBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUs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QixlQUFlLENBQUMsS0FBSyxHQUFHO0FBQ3BCLFNBQUssRUFBRSxDQUFDO0FBQ1Isa0JBQWMsRUFBRSxDQUFDO0FBQ2pCLFFBQUksRUFBRSxDQUFDO0NBQ1YsQ0FBQzs7QUFHRixPQUFPLENBQUMsU0FBUyxDQUFDLHFCQUFxQixHQUFHLFlBQVc7QUFDakQsV0FBTyxJQUFJLGVBQWUsQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUN0QyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBDT05GSUcgZnJvbSAnLi9jb25maWcuZXM2JztcbmltcG9ydCAnLi9vdmVycmlkZXMuZXM2JztcbmltcG9ydCBzaWduYWxDdXJ2ZXMgZnJvbSAnLi9zaWduYWxDdXJ2ZXMuZXM2JztcbmltcG9ydCBjb252ZXJzaW9ucyBmcm9tICcuLi9taXhpbnMvY29udmVyc2lvbnMuZXM2JztcbmltcG9ydCBtYXRoIGZyb20gJy4uL21peGlucy9tYXRoLmVzNic7XG5cbmNsYXNzIEF1ZGlvSU8ge1xuXG4gICAgc3RhdGljIG1peGluKCB0YXJnZXQsIHNvdXJjZSApIHtcbiAgICAgICAgZm9yICggbGV0IGkgaW4gc291cmNlICkge1xuICAgICAgICAgICAgaWYgKCBzb3VyY2UuaGFzT3duUHJvcGVydHkoIGkgKSApIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRbIGkgXSA9IHNvdXJjZVsgaSBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIG1peGluU2luZ2xlKCB0YXJnZXQsIHNvdXJjZSwgbmFtZSApIHtcbiAgICAgICAgdGFyZ2V0WyBuYW1lIF0gPSBzb3VyY2U7XG4gICAgfVxuXG5cbiAgICBjb25zdHJ1Y3RvciggY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKSApIHtcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7XG5cbiAgICAgICAgdGhpcy5tYXN0ZXIgPSB0aGlzLl9jb250ZXh0LmRlc3RpbmF0aW9uO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhbiBhbHdheXMtb24gJ2RyaXZlcicgbm9kZSB0aGF0IGNvbnN0YW50bHkgb3V0cHV0cyBhIHZhbHVlXG4gICAgICAgIC8vIG9mIDEuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEl0J3MgdXNlZCBieSBhIGZhaXIgZmV3IG5vZGVzLCBzbyBtYWtlcyBzZW5zZSB0byB1c2UgdGhlIHNhbWVcbiAgICAgICAgLy8gZHJpdmVyLCByYXRoZXIgdGhhbiBzcGFtbWluZyBhIGJ1bmNoIG9mIFdhdmVTaGFwZXJOb2RlcyBhbGwgYWJvdXRcbiAgICAgICAgLy8gdGhlIHBsYWNlLiBJdCBjYW4ndCBiZSBkZWxldGVkLCBzbyBubyB3b3JyaWVzIGFib3V0IGJyZWFraW5nXG4gICAgICAgIC8vIGZ1bmN0aW9uYWxpdHkgb2Ygbm9kZXMgdGhhdCBkbyB1c2UgaXQgc2hvdWxkIGl0IGF0dGVtcHQgdG8gYmVcbiAgICAgICAgLy8gb3ZlcndyaXR0ZW4uXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdGhpcywgJ2NvbnN0YW50RHJpdmVyJywge1xuICAgICAgICAgICAgd3JpdGVhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGdldDogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBsZXQgY29uc3RhbnREcml2ZXI7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggIWNvbnN0YW50RHJpdmVyIHx8IGNvbnN0YW50RHJpdmVyLmNvbnRleHQgIT09IHRoaXMuY29udGV4dCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0YW50RHJpdmVyID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gY29udGV4dC5jcmVhdGVCdWZmZXIoIDEsIDQwOTYsIGNvbnRleHQuc2FtcGxlUmF0ZSApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlckRhdGEgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIDAgKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJTb3VyY2UgPSBjb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBidWZmZXJEYXRhLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlckRhdGFbIGkgXSA9IDEuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yKCBsZXQgYnVmZmVyVmFsdWUgb2YgYnVmZmVyRGF0YSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBidWZmZXJWYWx1ZSA9IDEuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyU291cmNlLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlclNvdXJjZS5sb29wID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlclNvdXJjZS5zdGFydCggMCApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdGFudERyaXZlciA9IGJ1ZmZlclNvdXJjZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb25zdGFudERyaXZlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KCkgKVxuICAgICAgICB9ICk7XG4gICAgfVxuXG5cblxuICAgIGdldCBjb250ZXh0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dDtcbiAgICB9XG5cbiAgICBzZXQgY29udGV4dCggY29udGV4dCApIHtcbiAgICAgICAgaWYgKCAhKCBjb250ZXh0IGluc3RhbmNlb2YgQXVkaW9Db250ZXh0ICkgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIFwiSW52YWxpZCBhdWRpbyBjb250ZXh0IGdpdmVuOlwiICsgY29udGV4dCApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMubWFzdGVyID0gY29udGV4dC5kZXN0aW5hdGlvbjtcbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIEF1ZGlvSU8ucHJvdG90eXBlLCBzaWduYWxDdXJ2ZXMsICdjdXJ2ZXMnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBBdWRpb0lPLnByb3RvdHlwZSwgY29udmVyc2lvbnMsICdjb252ZXJ0JyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggQXVkaW9JTy5wcm90b3R5cGUsIG1hdGgsICdtYXRoJyApO1xuXG5cblxud2luZG93LkF1ZGlvSU8gPSBBdWRpb0lPO1xuZXhwb3J0IGRlZmF1bHQgQXVkaW9JTzsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcblxudmFyIGdyYXBocyA9IG5ldyBXZWFrTWFwKCk7XG5cbmNsYXNzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtSW5wdXRzID0gMCwgbnVtT3V0cHV0cyA9IDAgKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gW107XG4gICAgICAgIHRoaXMub3V0cHV0cyA9IFtdO1xuXG4gICAgICAgIC8vIFRoaXMgb2JqZWN0IHdpbGwgaG9sZCBhbnkgdmFsdWVzIHRoYXQgY2FuIGJlXG4gICAgICAgIC8vIGNvbnRyb2xsZWQgd2l0aCBhdWRpbyBzaWduYWxzLlxuICAgICAgICB0aGlzLmNvbnRyb2xzID0ge307XG5cbiAgICAgICAgLy8gQm90aCB0aGVzZSBvYmplY3RzIHdpbGwganVzdCBob2xkIHJlZmVyZW5jZXNcbiAgICAgICAgLy8gdG8gZWl0aGVyIGlucHV0IG9yIG91dHB1dCBub2Rlcy4gSGFuZHkgd2hlblxuICAgICAgICAvLyB3YW50aW5nIHRvIGNvbm5lY3Qgc3BlY2lmaWMgaW5zL291dHMgd2l0aG91dFxuICAgICAgICAvLyBoYXZpbmcgdG8gdXNlIHRoZSBgLmNvbm5lY3QoIC4uLiwgMCwgMSApYCBzeW50YXguXG4gICAgICAgIHRoaXMubmFtZWRJbnB1dHMgPSB7fTtcbiAgICAgICAgdGhpcy5uYW1lZE91dHB1dHMgPSB7fTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1JbnB1dHM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuYWRkSW5wdXRDaGFubmVsKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IG51bU91dHB1dHM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuYWRkT3V0cHV0Q2hhbm5lbCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0R3JhcGgoIGdyYXBoICkge1xuICAgICAgICBncmFwaHMuc2V0KCB0aGlzLCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldEdyYXBoKCkge1xuICAgICAgICByZXR1cm4gZ3JhcGhzLmdldCggdGhpcyApIHx8IHt9O1xuICAgIH1cblxuICAgIGFkZElucHV0Q2hhbm5lbCgpIHtcbiAgICAgICAgdGhpcy5pbnB1dHMucHVzaCggdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKSApO1xuICAgIH1cblxuICAgIGFkZE91dHB1dENoYW5uZWwoKSB7XG4gICAgICAgIHRoaXMub3V0cHV0cy5wdXNoKCB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpICk7XG4gICAgfVxuXG4gICAgX2NsZWFuVXBTaW5nbGUoIGl0ZW0sIHBhcmVudCwga2V5ICkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLy8gSGFuZGxlIGFycmF5cyBieSBsb29waW5nIG92ZXIgdGhlbVxuICAgICAgICAvLyBhbmQgcmVjdXJzaXZlbHkgY2FsbGluZyB0aGlzIGZ1bmN0aW9uIHdpdGggZWFjaFxuICAgICAgICAvLyBhcnJheSBtZW1iZXIuXG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KCBpdGVtICkgKSB7XG4gICAgICAgICAgICBpdGVtLmZvckVhY2goZnVuY3Rpb24oIG5vZGUsIGluZGV4ICkge1xuICAgICAgICAgICAgICAgIHNlbGYuX2NsZWFuVXBTaW5nbGUoIG5vZGUsIGl0ZW0sIGluZGV4ICk7XG4gICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgIHBhcmVudFsga2V5IF0gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXVkaW9JTyBub2Rlcy4uLlxuICAgICAgICBlbHNlIGlmKCBpdGVtICYmIHR5cGVvZiBpdGVtLmNsZWFuVXAgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICBpZiggdHlwZW9mIGl0ZW0uZGlzY29ubmVjdCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICBpdGVtLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaXRlbS5jbGVhblVwKCk7XG5cbiAgICAgICAgICAgIGlmKCBwYXJlbnQgKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50WyBrZXkgXSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBcIk5hdGl2ZVwiIG5vZGVzLlxuICAgICAgICBlbHNlIGlmKCBpdGVtICYmIHR5cGVvZiBpdGVtLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICBpdGVtLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICAgICAgaWYoIHBhcmVudCApIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRbIGtleSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgdGhpcy5fY2xlYW5VcEluT3V0cygpO1xuICAgICAgICB0aGlzLl9jbGVhbklPKCk7XG5cbiAgICAgICAgLy8gRmluZCBhbnkgbm9kZXMgYXQgdGhlIHRvcCBsZXZlbCxcbiAgICAgICAgLy8gZGlzY29ubmVjdCBhbmQgbnVsbGlmeSB0aGVtLlxuICAgICAgICBmb3IoIHZhciBpIGluIHRoaXMgKSB7XG4gICAgICAgICAgICB0aGlzLl9jbGVhblVwU2luZ2xlKCB0aGlzWyBpIF0sIHRoaXMsIGkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERvIHRoZSBzYW1lIGZvciBhbnkgbm9kZXMgaW4gdGhlIGdyYXBoLlxuICAgICAgICBmb3IoIHZhciBpIGluIGdyYXBoICkge1xuICAgICAgICAgICAgdGhpcy5fY2xlYW5VcFNpbmdsZSggZ3JhcGhbIGkgXSwgZ3JhcGgsIGkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIC4uLmFuZCB0aGUgc2FtZSBmb3IgYW55IGNvbnRyb2wgbm9kZXMuXG4gICAgICAgIGZvciggdmFyIGkgaW4gdGhpcy5jb250cm9scyApIHtcbiAgICAgICAgICAgIHRoaXMuX2NsZWFuVXBTaW5nbGUoIHRoaXMuY29udHJvbHNbIGkgXSwgdGhpcy5jb250cm9scywgaSApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmluYWxseSwgYXR0ZW1wdCB0byBkaXNjb25uZWN0IHRoaXMgTm9kZS5cbiAgICAgICAgaWYoIHR5cGVvZiB0aGlzLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IG51bWJlck9mSW5wdXRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHMubGVuZ3RoO1xuICAgIH1cbiAgICBnZXQgbnVtYmVyT2ZPdXRwdXRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzLmxlbmd0aDtcbiAgICB9XG5cbiAgICBnZXQgaW5wdXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5wdXRzLmxlbmd0aCA/IHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA6IG51bGw7XG4gICAgfVxuICAgIHNldCBpbnB1dFZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5pbnB1dHMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgaSBdLmdhaW4udmFsdWUgPSB0aGlzLmludmVydElucHV0UGhhc2UgPyAtdmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBvdXRwdXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3V0cHV0cy5sZW5ndGggPyB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlIDogbnVsbDtcbiAgICB9XG4gICAgc2V0IG91dHB1dFZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5vdXRwdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IHRoaXMuaW52ZXJ0T3V0cHV0UGhhc2UgPyAtdmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBpbnZlcnRJbnB1dFBoYXNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHMubGVuZ3RoID9cbiAgICAgICAgICAgICggdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlIDwgMCApIDpcbiAgICAgICAgICAgIG51bGw7XG4gICAgfVxuICAgIHNldCBpbnZlcnRJbnB1dFBoYXNlKCBpbnZlcnRlZCApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBpbnB1dCwgdjsgaSA8IHRoaXMuaW5wdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgaW5wdXQgPSB0aGlzLmlucHV0c1sgaSBdLmdhaW47XG4gICAgICAgICAgICB2ID0gaW5wdXQudmFsdWU7XG4gICAgICAgICAgICBpbnB1dC52YWx1ZSA9IHYgPCAwID8gKCBpbnZlcnRlZCA/IHYgOiAtdiApIDogKCBpbnZlcnRlZCA/IC12IDogdiApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGludmVydE91dHB1dFBoYXNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzLmxlbmd0aCA/XG4gICAgICAgICAgICAoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPCAwICkgOlxuICAgICAgICAgICAgbnVsbDtcbiAgICB9XG5cbiAgICAvLyBUT0RPOlxuICAgIC8vICAtIHNldFZhbHVlQXRUaW1lP1xuICAgIHNldCBpbnZlcnRPdXRwdXRQaGFzZSggaW52ZXJ0ZWQgKSB7XG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgdjsgaSA8IHRoaXMub3V0cHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHYgPSB0aGlzLm91dHB1dHNbIGkgXS5nYWluLnZhbHVlO1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IHYgPCAwID8gKCBpbnZlcnRlZCA/IHYgOiAtdiApIDogKCBpbnZlcnRlZCA/IC12IDogdiApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBOb2RlLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggTm9kZS5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuVXBJbk91dHMsICdfY2xlYW5VcEluT3V0cycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIE5vZGUucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhbklPLCAnX2NsZWFuSU8nICk7XG5BdWRpb0lPLm1peGluKCBOb2RlLnByb3RvdHlwZSwgY29ubmVjdGlvbnMgKTtcblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOb2RlID0gZnVuY3Rpb24oIG51bUlucHV0cywgbnVtT3V0cHV0cyApIHtcbiAgICByZXR1cm4gbmV3IE5vZGUoIHRoaXMsIG51bUlucHV0cywgbnVtT3V0cHV0cyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTm9kZTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcblxuXG5jbGFzcyBQYXJhbSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSwgZGVmYXVsdFZhbHVlICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLmlucHV0cyA9IHRoaXMub3V0cHV0cyA9IFsgdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKSBdO1xuICAgICAgICB0aGlzLl9jb250cm9sID0gdGhpcy5pbnB1dHNbIDAgXTtcblxuICAgICAgICAvLyBIbW0uLi4gSGFkIHRvIHB1dCB0aGlzIGhlcmUgc28gTm90ZSB3aWxsIGJlIGFibGVcbiAgICAgICAgLy8gdG8gcmVhZCB0aGUgdmFsdWUuLi5cbiAgICAgICAgLy8gVE9ETzpcbiAgICAgICAgLy8gIC0gU2hvdWxkIEkgY3JlYXRlIGEgYC5fdmFsdWVgIHByb3BlcnR5IHRoYXQgd2lsbFxuICAgICAgICAvLyAgICBzdG9yZSB0aGUgdmFsdWVzIHRoYXQgdGhlIFBhcmFtIHNob3VsZCBiZSByZWZsZWN0aW5nXG4gICAgICAgIC8vICAgIChmb3JnZXR0aW5nLCBvZiBjb3Vyc2UsIHRoYXQgYWxsIHRoZSAqVmFsdWVBdFRpbWUgW2V0Yy5dXG4gICAgICAgIC8vICAgIGZ1bmN0aW9ucyBhcmUgZnVuY3Rpb25zIG9mIHRpbWU7IGAuX3ZhbHVlYCBwcm9wIHdvdWxkIGJlXG4gICAgICAgIC8vICAgIHNldCBpbW1lZGlhdGVseSwgd2hpbHN0IHRoZSByZWFsIHZhbHVlIHdvdWxkIGJlIHJhbXBpbmcpXG4gICAgICAgIC8vXG4gICAgICAgIC8vICAtIE9yLCBzaG91bGQgSSBjcmVhdGUgYSBgLl92YWx1ZWAgcHJvcGVydHkgdGhhdCB3aWxsXG4gICAgICAgIC8vICAgIHRydWVseSByZWZsZWN0IHRoZSBpbnRlcm5hbCB2YWx1ZSBvZiB0aGUgR2Fpbk5vZGU/IFdpbGxcbiAgICAgICAgLy8gICAgcmVxdWlyZSBNQUZGUy4uLlxuICAgICAgICB0aGlzLl92YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgPyB2YWx1ZSA6IDEuMDtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLnZhbHVlID0gdGhpcy5fdmFsdWU7XG5cbiAgICAgICAgdGhpcy5zZXRWYWx1ZUF0VGltZSggdGhpcy5fdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgICAgICB0aGlzLmRlZmF1bHRWYWx1ZSA9IHR5cGVvZiBkZWZhdWx0VmFsdWUgPT09ICdudW1iZXInID8gZGVmYXVsdFZhbHVlIDogdGhpcy5fY29udHJvbC5nYWluLmRlZmF1bHRWYWx1ZTtcblxuXG4gICAgICAgIC8vIFRPRE86XG4gICAgICAgIC8vICAtIFNob3VsZCB0aGUgZHJpdmVyIGFsd2F5cyBiZSBjb25uZWN0ZWQ/XG4gICAgICAgIC8vICAtIE5vdCBzdXJlIHdoZXRoZXIgUGFyYW0gc2hvdWxkIG91dHB1dCAwIGlmIHZhbHVlICE9PSBOdW1iZXIuXG4gICAgICAgIGlmICggdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMuaW8uY29uc3RhbnREcml2ZXIuY29ubmVjdCggdGhpcy5fY29udHJvbCApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuZGVmYXVsdFZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLl9jbGVhblVwSW5PdXRzKCk7XG4gICAgICAgIHRoaXMuX2NsZWFuSU8oKTtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLl9jb250cm9sID0gbnVsbDtcbiAgICAgICAgdGhpcy5kZWZhdWx0VmFsdWUgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgIH1cblxuICAgIHNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgc3RhcnRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4uc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSggdmFsdWUsIGVuZFRpbWUgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0VGFyZ2V0QXRUaW1lKCB2YWx1ZSwgc3RhcnRUaW1lLCB0aW1lQ29uc3RhbnQgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5zZXRUYXJnZXRBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUsIHRpbWVDb25zdGFudCApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRWYWx1ZUN1cnZlQXRUaW1lKCB2YWx1ZXMsIHN0YXJ0VGltZSwgZHVyYXRpb24gKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5zZXRWYWx1ZUN1cnZlQXRUaW1lKCB2YWx1ZXMsIHN0YXJ0VGltZSwgZHVyYXRpb24gKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCBzdGFydFRpbWUgKSB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHN0YXJ0VGltZSApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIC8vIHJldHVybiB0aGlzLl9jb250cm9sLmdhaW4udmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cblxuICAgIGdldCBjb250cm9sKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29udHJvbC5nYWluO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBQYXJhbS5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFBhcmFtLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5VcEluT3V0cywgJ19jbGVhblVwSW5PdXRzJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggUGFyYW0ucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhbklPLCAnX2NsZWFuSU8nICk7XG5BdWRpb0lPLm1peGluKCBQYXJhbS5wcm90b3R5cGUsIGNvbm5lY3Rpb25zICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBhcmFtID0gZnVuY3Rpb24oIHZhbHVlLCBkZWZhdWx0VmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBQYXJhbSggdGhpcywgdmFsdWUsIGRlZmF1bHRWYWx1ZSApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgUGFyYW07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4vQXVkaW9JTy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBjb25uZWN0aW9ucyBmcm9tIFwiLi4vbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNlwiO1xuaW1wb3J0IGNsZWFuZXJzIGZyb20gXCIuLi9taXhpbnMvY2xlYW5lcnMuZXM2XCI7XG5cbmNsYXNzIFdhdmVTaGFwZXIge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgY3VydmVPckl0ZXJhdG9yLCBzaXplICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLnNoYXBlciA9IHRoaXMuY29udGV4dC5jcmVhdGVXYXZlU2hhcGVyKCk7XG5cbiAgICAgICAgLy8gSWYgYSBGbG9hdDMyQXJyYXkgaXMgcHJvdmlkZWQsIHVzZSBpdFxuICAgICAgICAvLyBhcyB0aGUgY3VydmUgdmFsdWUuXG4gICAgICAgIGlmICggY3VydmVPckl0ZXJhdG9yIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ICkge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSBjdXJ2ZU9ySXRlcmF0b3I7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhIGZ1bmN0aW9uIGlzIHByb3ZpZGVkLCBjcmVhdGUgYSBjdXJ2ZVxuICAgICAgICAvLyB1c2luZyB0aGUgZnVuY3Rpb24gYXMgYW4gaXRlcmF0b3IuXG4gICAgICAgIGVsc2UgaWYgKCB0eXBlb2YgY3VydmVPckl0ZXJhdG9yID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgc2l6ZSA9IHR5cGVvZiBzaXplID09PSAnbnVtYmVyJyAmJiBzaXplID49IDIgPyBzaXplIDogQ09ORklHLmN1cnZlUmVzb2x1dGlvbjtcblxuICAgICAgICAgICAgdmFyIGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSggc2l6ZSApLFxuICAgICAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgICAgIHggPSAwO1xuXG4gICAgICAgICAgICBmb3IgKCBpOyBpIDwgc2l6ZTsgKytpICkge1xuICAgICAgICAgICAgICAgIHggPSAoIGkgLyBzaXplICkgKiAyIC0gMTtcbiAgICAgICAgICAgICAgICBhcnJheVsgaSBdID0gY3VydmVPckl0ZXJhdG9yKCB4LCBpLCBzaXplICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2hhcGVyLmN1cnZlID0gYXJyYXk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPdGhlcndpc2UsIGRlZmF1bHQgdG8gYSBMaW5lYXIgY3VydmUuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSB0aGlzLmlvLmN1cnZlcy5MaW5lYXI7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlucHV0cyA9IHRoaXMub3V0cHV0cyA9IFsgdGhpcy5zaGFwZXIgXTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLl9jbGVhblVwSW5PdXRzKCk7XG4gICAgICAgIHRoaXMuX2NsZWFuSU8oKTtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuc2hhcGVyID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgY3VydmUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNoYXBlci5jdXJ2ZTtcbiAgICB9XG4gICAgc2V0IGN1cnZlKCBjdXJ2ZSApIHtcbiAgICAgICAgaWYoIGN1cnZlIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ICkge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSBjdXJ2ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggV2F2ZVNoYXBlci5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFdhdmVTaGFwZXIucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhblVwSW5PdXRzLCAnX2NsZWFuVXBJbk91dHMnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBXYXZlU2hhcGVyLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5JTywgJ19jbGVhbklPJyApO1xuQXVkaW9JTy5taXhpbiggV2F2ZVNoYXBlci5wcm90b3R5cGUsIGNvbm5lY3Rpb25zICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVdhdmVTaGFwZXIgPSBmdW5jdGlvbiggY3VydmUsIHNpemUgKSB7XG4gICAgcmV0dXJuIG5ldyBXYXZlU2hhcGVyKCB0aGlzLCBjdXJ2ZSwgc2l6ZSApO1xufTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgY3VydmVSZXNvbHV0aW9uOiA0MDk2LCAvLyBNdXN0IGJlIGFuIGV2ZW4gbnVtYmVyLlxuXG4gICAgLy8gVXNlZCB3aGVuIGNvbnZlcnRpbmcgbm90ZSBzdHJpbmdzIChlZy4gJ0EjNCcpIHRvIE1JREkgdmFsdWVzLlxuICAgIC8vIEl0J3MgdGhlIG9jdGF2ZSBudW1iZXIgb2YgdGhlIGxvd2VzdCBDIG5vdGUgKE1JREkgbm90ZSAwKS5cbiAgICAvLyBDaGFuZ2UgdGhpcyBpZiB5b3UncmUgdXNlZCB0byBhIERBVyB0aGF0IGRvZXNuJ3QgdXNlIC0yIGFzIHRoZVxuICAgIC8vIGxvd2VzdCBvY3RhdmUuXG4gICAgbG93ZXN0T2N0YXZlOiAtMixcblxuICAgIC8vIExvd2VzdCBhbGxvd2VkIG51bWJlci4gVXNlZCBieSBzb21lIE1hdGhcbiAgICAvLyBmdW5jdGlvbnMsIGVzcGVjaWFsbHkgd2hlbiBjb252ZXJ0aW5nIGJldHdlZW5cbiAgICAvLyBudW1iZXIgZm9ybWF0cyAoaWUuIGh6IC0+IE1JREksIG5vdGUgLT4gTUlESSwgZXRjLiApXG4gICAgLy9cbiAgICAvLyBBbHNvIHVzZWQgaW4gY2FsbHMgdG8gQXVkaW9QYXJhbS5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lXG4gICAgLy8gc28gdGhlcmUncyBubyByYW1waW5nIHRvIDAgKHdoaWNoIHRocm93cyBhbiBlcnJvcikuXG4gICAgZXBzaWxvbjogMC4wMDEsXG5cbiAgICBtaWRpTm90ZVBvb2xTaXplOiA1MDBcbn07IiwiLy8gTmVlZCB0byBvdmVycmlkZSBleGlzdGluZyAuY29ubmVjdCBhbmQgLmRpc2Nvbm5lY3Rcbi8vIGZ1bmN0aW9ucyBmb3IgXCJuYXRpdmVcIiBBdWRpb1BhcmFtcyBhbmQgQXVkaW9Ob2Rlcy4uLlxuLy8gSSBkb24ndCBsaWtlIGRvaW5nIHRoaXMsIGJ1dCBzJ2dvdHRhIGJlIGRvbmUgOihcbiggZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9yaWdpbmFsQXVkaW9Ob2RlQ29ubmVjdCA9IEF1ZGlvTm9kZS5wcm90b3R5cGUuY29ubmVjdCxcbiAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVEaXNjb25uZWN0ID0gQXVkaW9Ob2RlLnByb3RvdHlwZS5kaXNjb25uZWN0O1xuXG4gICAgQXVkaW9Ob2RlLnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24oIG5vZGUsIG91dHB1dENoYW5uZWwgPSAwLCBpbnB1dENoYW5uZWwgPSAwICkge1xuICAgICAgICBpZiAoIG5vZGUuaW5wdXRzICkge1xuICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBub2RlLmlucHV0cyApICkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdCggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3QoIG5vZGUuaW5wdXRzWyAwIF0sIG91dHB1dENoYW5uZWwsIGlucHV0Q2hhbm5lbCApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb05vZGUgKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZUNvbm5lY3QuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9QYXJhbSApIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlQ29ubmVjdC5jYWxsKCB0aGlzLCBub2RlLCBvdXRwdXRDaGFubmVsICk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQXVkaW9Ob2RlLnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24oIG5vZGUsIG91dHB1dENoYW5uZWwgPSAwLCBpbnB1dENoYW5uZWwgPSAwICkge1xuICAgICAgICBpZiAoIG5vZGUgJiYgbm9kZS5pbnB1dHMgKSB7XG4gICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIG5vZGUuaW5wdXRzICkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0KCBub2RlLmlucHV0c1sgaW5wdXRDaGFubmVsIF0gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCggbm9kZS5pbnB1dHNbIDAgXSwgb3V0cHV0Q2hhbm5lbCwgaW5wdXRDaGFubmVsICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvTm9kZSApIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlRGlzY29ubmVjdC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb1BhcmFtICkge1xuICAgICAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVEaXNjb25uZWN0LmNhbGwoIHRoaXMsIG5vZGUsIG91dHB1dENoYW5uZWwgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICggbm9kZSA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVEaXNjb25uZWN0LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfVxuICAgIH07XG59KCkgKTsiLCJpbXBvcnQgQ09ORklHIGZyb20gJy4vY29uZmlnLmVzNic7XG5pbXBvcnQgbWF0aCBmcm9tICcuLi9taXhpbnMvTWF0aC5lczYnO1xuXG5cbmxldCBzaWduYWxDdXJ2ZXMgPSB7fTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdDb25zdGFudCcsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IDEuMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0xpbmVhcicsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0VxdWFsUG93ZXInLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApLFxuICAgICAgICAgICAgc2luID0gTWF0aC5zaW4sXG4gICAgICAgICAgICBQSSA9IE1hdGguUEk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHNpbiggeCAqIDAuNSAqIFBJICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnQ3ViZWQnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApLFxuICAgICAgICAgICAgc2luID0gTWF0aC5zaW4sXG4gICAgICAgICAgICBQSSA9IE1hdGguUEksXG4gICAgICAgICAgICBwb3cgPSBNYXRoLnBvdztcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICB4ID0gcG93KCB4LCAzICk7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gc2luKCB4ICogMC41ICogUEkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnUmVjdGlmeScsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgaGFsZlJlc29sdXRpb24gPSByZXNvbHV0aW9uICogMC41LFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAtaGFsZlJlc29sdXRpb24sIHggPSAwOyBpIDwgaGFsZlJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgPiAwID8gaSA6IC1pICkgLyBoYWxmUmVzb2x1dGlvbjtcbiAgICAgICAgICAgIGN1cnZlWyBpICsgaGFsZlJlc29sdXRpb24gXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5cbi8vIE1hdGggY3VydmVzXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0dyZWF0ZXJUaGFuWmVybycsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHggPD0gMCA/IDAuMCA6IDEuMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0xlc3NUaGFuWmVybycsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHggPj0gMCA/IDAgOiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdFcXVhbFRvWmVybycsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHggPT09IDAgPyAxIDogMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnUmVjaXByb2NhbCcsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSA0MDk2ICogNjAwLCAvLyBIaWdoZXIgcmVzb2x1dGlvbiBuZWVkZWQgaGVyZS5cbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIC8vIGN1cnZlWyBpIF0gPSB4ID09PSAwID8gMSA6IDA7XG5cbiAgICAgICAgICAgIGlmICggeCAhPT0gMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gTWF0aC5wb3coIHgsIC0xICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdTaW5lJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKSxcbiAgICAgICAgICAgIHNpbiA9IE1hdGguc2luO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBzaW4oIHggKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1JvdW5kJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24gKiA1MCxcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICggeCA+IDAgJiYgeCA8PSAwLjUwMDAxICkgfHxcbiAgICAgICAgICAgICAgICAoIHggPCAwICYmIHggPj0gLTAuNTAwMDEgKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgeCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICggeCA+IDAgKSB7XG4gICAgICAgICAgICAgICAgeCA9IDFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHggPSAtMTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnRmxvb3InLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDUwLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuXG4gICAgICAgICAgICBpZiAoIHggPj0gMC45OTk5ICkge1xuICAgICAgICAgICAgICAgIHggPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIHggPj0gMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCB4IDwgMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gLTE7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdHYXVzc2lhbldoaXRlTm9pc2UnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDIsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gbWF0aC5ucmFuZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnV2hpdGVOb2lzZScsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogMixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnUGlua05vaXNlJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24gKiAyLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgbWF0aC5nZW5lcmF0ZVBpbmtOdW1iZXIoKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gbWF0aC5nZXROZXh0UGlua051bWJlcigpICogMiAtIDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1NpZ24nLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDIsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gTWF0aC5zaWduKCB4ICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHNpZ25hbEN1cnZlczsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgQ3VzdG9tRW52ZWxvcGUgZnJvbSBcIi4vQ3VzdG9tRW52ZWxvcGUuZXM2XCI7XG5cbmNsYXNzIEFTRFJFbnZlbG9wZSBleHRlbmRzIEN1c3RvbUVudmVsb3BlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHRoaXMudGltZXMgPSB7XG4gICAgICAgICAgICBhdHRhY2s6IDAuMDEsXG4gICAgICAgICAgICBkZWNheTogMC41LFxuICAgICAgICAgICAgcmVsZWFzZTogMC41XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sZXZlbHMgPSB7XG4gICAgICAgICAgICBpbml0aWFsOiAwLFxuICAgICAgICAgICAgcGVhazogMSxcbiAgICAgICAgICAgIHN1c3RhaW46IDEsXG4gICAgICAgICAgICByZWxlYXNlOiAwXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdpbml0aWFsJywgMCwgdGhpcy5sZXZlbHMuaW5pdGlhbCApO1xuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2F0dGFjaycsIHRoaXMudGltZXMuYXR0YWNrLCB0aGlzLmxldmVscy5wZWFrICk7XG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnZGVjYXknLCB0aGlzLnRpbWVzLmRlY2F5LCB0aGlzLmxldmVscy5zdXN0YWluICk7XG4gICAgICAgIHRoaXMuYWRkRW5kU3RlcCggJ3JlbGVhc2UnLCB0aGlzLnRpbWVzLnJlbGVhc2UsIHRoaXMubGV2ZWxzLnJlbGVhc2UsIHRydWUgKTtcbiAgICB9XG5cbiAgICBnZXQgYXR0YWNrVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZXMuYXR0YWNrO1xuICAgIH1cbiAgICBzZXQgYXR0YWNrVGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLmF0dGFjayA9IHRpbWU7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBUaW1lKCAnYXR0YWNrJywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgZGVjYXlUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5kZWNheTtcbiAgICB9XG4gICAgc2V0IGRlY2F5VGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLmRlY2F5ID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdkZWNheScsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHJlbGVhc2VUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5yZWxlYXNlO1xuICAgIH1cbiAgICBzZXQgcmVsZWFzZVRpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5yZWxlYXNlID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdyZWxlYXNlJywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgaW5pdGlhbExldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMuaW5pdGlhbDtcbiAgICB9XG4gICAgc2V0IGluaXRpYWxMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLmluaXRpYWwgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnaW5pdGlhbCcsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBwZWFrTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5wZWFrO1xuICAgIH1cblxuICAgIHNldCBwZWFrTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5wZWFrID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2F0dGFjaycsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBzdXN0YWluTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5zdXN0YWluO1xuICAgIH1cbiAgICBzZXQgc3VzdGFpbkxldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMuc3VzdGFpbiA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdkZWNheScsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCByZWxlYXNlTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5yZWxlYXNlO1xuICAgIH1cbiAgICBzZXQgcmVsZWFzZUxldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMucmVsZWFzZSA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdyZWxlYXNlJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQVNEUkVudmVsb3BlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBBU0RSRW52ZWxvcGUoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEFTRFJFbnZlbG9wZTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IENPTkZJRyBmcm9tIFwiLi4vY29yZS9jb25maWcuZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5cbmNsYXNzIEN1c3RvbUVudmVsb3BlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMub3JkZXJzID0ge1xuICAgICAgICAgICAgc3RhcnQ6IFtdLFxuICAgICAgICAgICAgc3RvcDogW11cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnN0ZXBzID0ge1xuICAgICAgICAgICAgc3RhcnQ6IHt9LFxuICAgICAgICAgICAgc3RvcDoge31cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBfYWRkU3RlcCggc2VjdGlvbiwgbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgPSBmYWxzZSApIHtcbiAgICAgICAgbGV0IHN0b3BzID0gdGhpcy5zdGVwc1sgc2VjdGlvbiBdO1xuXG4gICAgICAgIGlmICggc3RvcHNbIG5hbWUgXSApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ1N0b3Agd2l0aCBuYW1lIFwiJyArIG5hbWUgKyAnXCIgYWxyZWFkeSBleGlzdHMuJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vcmRlcnNbIHNlY3Rpb24gXS5wdXNoKCBuYW1lICk7XG5cbiAgICAgICAgdGhpcy5zdGVwc1sgc2VjdGlvbiBdWyBuYW1lIF0gPSB7XG4gICAgICAgICAgICB0aW1lOiB0aW1lLFxuICAgICAgICAgICAgbGV2ZWw6IGxldmVsLFxuICAgICAgICAgICAgaXNFeHBvbmVudGlhbDogaXNFeHBvbmVudGlhbFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFkZFN0YXJ0U3RlcCggbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgPSBmYWxzZSApIHtcbiAgICAgICAgdGhpcy5fYWRkU3RlcCggJ3N0YXJ0JywgbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgYWRkRW5kU3RlcCggbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgPSBmYWxzZSApIHtcbiAgICAgICAgdGhpcy5fYWRkU3RlcCggJ3N0b3AnLCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRTdGVwTGV2ZWwoIG5hbWUsIGxldmVsICkge1xuICAgICAgICBsZXQgc3RhcnRJbmRleCA9IHRoaXMub3JkZXJzLnN0YXJ0LmluZGV4T2YoIG5hbWUgKSxcbiAgICAgICAgICAgIGVuZEluZGV4ID0gdGhpcy5vcmRlcnMuc3RvcC5pbmRleE9mKCBuYW1lICk7XG5cbiAgICAgICAgaWYgKCBzdGFydEluZGV4ID09PSAtMSAmJiBlbmRJbmRleCA9PT0gLTEgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdObyBzdGVwIHdpdGggbmFtZSBcIicgKyBuYW1lICsgJ1wiLiBObyBsZXZlbCBzZXQuJyApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzdGFydEluZGV4ICE9PSAtMSApIHtcbiAgICAgICAgICAgIHRoaXMuc3RlcHMuc3RhcnRbIG5hbWUgXS5sZXZlbCA9IHBhcnNlRmxvYXQoIGxldmVsICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnN0b3BbIG5hbWUgXS5sZXZlbCA9IHBhcnNlRmxvYXQoIGxldmVsICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cblxuICAgIHNldFN0ZXBUaW1lKCBuYW1lLCB0aW1lICkge1xuICAgICAgICB2YXIgc3RhcnRJbmRleCA9IHRoaXMub3JkZXJzLnN0YXJ0LmluZGV4T2YoIG5hbWUgKSxcbiAgICAgICAgICAgIGVuZEluZGV4ID0gdGhpcy5vcmRlcnMuc3RvcC5pbmRleE9mKCBuYW1lICk7XG5cbiAgICAgICAgaWYgKCBzdGFydEluZGV4ID09PSAtMSAmJiBlbmRJbmRleCA9PT0gLTEgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdObyBzdGVwIHdpdGggbmFtZSBcIicgKyBuYW1lICsgJ1wiLiBObyB0aW1lIHNldC4nICk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggIT09IC0xICkge1xuICAgICAgICAgICAgdGhpcy5zdGVwcy5zdGFydFsgbmFtZSBdLnRpbWUgPSBwYXJzZUZsb2F0KCB0aW1lICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnN0b3BbIG5hbWUgXS50aW1lID0gcGFyc2VGbG9hdCggdGltZSApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG5cblxuICAgIF90cmlnZ2VyU3RlcCggcGFyYW0sIHN0ZXAsIHN0YXJ0VGltZSApIHtcbiAgICAgICAgLy8gaWYgKCBzdGVwLmlzRXhwb25lbnRpYWwgPT09IHRydWUgKSB7XG4gICAgICAgICAgICAvLyBUaGVyZSdzIHNvbWV0aGluZyBhbWlzcyBoZXJlIVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coIE1hdGgubWF4KCBzdGVwLmxldmVsLCBDT05GSUcuZXBzaWxvbiApLCBzdGFydFRpbWUgKyBzdGVwLnRpbWUgKTtcbiAgICAgICAgICAgIC8vIHBhcmFtLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoIE1hdGgubWF4KCBzdGVwLmxldmVsLCAwLjAxICksIHN0YXJ0VGltZSArIHN0ZXAudGltZSApO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGVsc2Uge1xuICAgICAgICAgICAgcGFyYW0ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIHN0ZXAubGV2ZWwsIHN0YXJ0VGltZSArIHN0ZXAudGltZSApO1xuICAgICAgICAvLyB9XG4gICAgfVxuXG4gICAgX3N0YXJ0U2VjdGlvbiggc2VjdGlvbiwgcGFyYW0sIHN0YXJ0VGltZSwgY2FuY2VsU2NoZWR1bGVkVmFsdWVzICkge1xuICAgICAgICB2YXIgc3RvcE9yZGVyID0gdGhpcy5vcmRlcnNbIHNlY3Rpb24gXSxcbiAgICAgICAgICAgIHN0ZXBzID0gdGhpcy5zdGVwc1sgc2VjdGlvbiBdLFxuICAgICAgICAgICAgbnVtU3RvcHMgPSBzdG9wT3JkZXIubGVuZ3RoLFxuICAgICAgICAgICAgc3RlcDtcblxuICAgICAgICBwYXJhbS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHN0YXJ0VGltZSApO1xuICAgICAgICAvLyBwYXJhbS5zZXRWYWx1ZUF0VGltZSggMCwgc3RhcnRUaW1lICk7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgbnVtU3RvcHM7ICsraSApIHtcbiAgICAgICAgICAgIHN0ZXAgPSBzdGVwc1sgc3RvcE9yZGVyWyBpIF0gXTtcbiAgICAgICAgICAgIHRoaXMuX3RyaWdnZXJTdGVwKCBwYXJhbSwgc3RlcCwgc3RhcnRUaW1lICk7XG4gICAgICAgICAgICBzdGFydFRpbWUgKz0gc3RlcC50aW1lO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBzdGFydCggcGFyYW0sIGRlbGF5ID0gMCApIHtcbiAgICAgICAgaWYgKCBwYXJhbSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gPT09IGZhbHNlICYmIHBhcmFtIGluc3RhbmNlb2YgUGFyYW0gPT09IGZhbHNlICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnQ2FuIG9ubHkgc3RhcnQgYW4gZW52ZWxvcGUgb24gQXVkaW9QYXJhbSBvciBQYXJhbSBpbnN0YW5jZXMuJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc3RhcnRTZWN0aW9uKCAnc3RhcnQnLCBwYXJhbSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgZGVsYXkgKTtcbiAgICB9XG5cbiAgICBzdG9wKCBwYXJhbSwgZGVsYXkgPSAwICkge1xuICAgICAgICB0aGlzLl9zdGFydFNlY3Rpb24oICdzdG9wJywgcGFyYW0sIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIDAuMSArIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgZm9yY2VTdG9wKCBwYXJhbSwgZGVsYXkgPSAwICkge1xuICAgICAgICBwYXJhbS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIGRlbGF5ICk7XG4gICAgICAgIC8vIHBhcmFtLnNldFZhbHVlQXRUaW1lKCBwYXJhbS52YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgZGVsYXkgKTtcbiAgICAgICAgcGFyYW0ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIDAsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIDAuMDAxICk7XG4gICAgfVxuXG4gICAgZ2V0IHRvdGFsU3RhcnRUaW1lKCkge1xuICAgICAgICB2YXIgc3RhcnRzID0gdGhpcy5zdGVwcy5zdGFydCxcbiAgICAgICAgICAgIHRpbWUgPSAwLjA7XG5cbiAgICAgICAgZm9yICggdmFyIGkgaW4gc3RhcnRzICkge1xuICAgICAgICAgICAgdGltZSArPSBzdGFydHNbIGkgXS50aW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRpbWU7XG4gICAgfVxuXG4gICAgZ2V0IHRvdGFsU3RvcFRpbWUoKSB7XG4gICAgICAgIHZhciBzdG9wcyA9IHRoaXMuc3RlcHMuc3RvcCxcbiAgICAgICAgICAgIHRpbWUgPSAwLjA7XG5cbiAgICAgICAgZm9yICggdmFyIGkgaW4gc3RvcHMgKSB7XG4gICAgICAgICAgICB0aW1lICs9IHN0b3BzWyBpIF0udGltZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aW1lO1xuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggQ3VzdG9tRW52ZWxvcGUucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUN1c3RvbUVudmVsb3BlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBDdXN0b21FbnZlbG9wZSggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQ3VzdG9tRW52ZWxvcGU7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBEcnlXZXROb2RlIGZyb20gXCIuLi9ncmFwaHMvRHJ5V2V0Tm9kZS5lczZcIjtcblxuLy8gVE9ETzogQWRkIGZlZWRiYWNrTGV2ZWwgYW5kIGRlbGF5VGltZSBQYXJhbSBpbnN0YW5jZXNcbi8vIHRvIGNvbnRyb2wgdGhpcyBub2RlLlxuY2xhc3MgRGVsYXkgZXh0ZW5kcyBEcnlXZXROb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHRpbWUgPSAwLCBmZWVkYmFja0xldmVsID0gMCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb250cm9sIG5vZGVzLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrID0gdGhpcy5pby5jcmVhdGVQYXJhbSggZmVlZGJhY2tMZXZlbCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnRpbWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0aW1lICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGZlZWRiYWNrIGFuZCBkZWxheSBub2Rlc1xuICAgICAgICB0aGlzLmZlZWRiYWNrID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuXG4gICAgICAgIC8vIFNldHVwIHRoZSBmZWVkYmFjayBsb29wXG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5mZWVkYmFjayApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcblxuICAgICAgICAvLyBBbHNvIGNvbm5lY3QgdGhlIGRlbGF5IHRvIHRoZSB3ZXQgb3V0cHV0LlxuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMud2V0ICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBpbnB1dCB0byBkZWxheVxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcblxuICAgICAgICB0aGlzLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lLmNvbm5lY3QoIHRoaXMuZGVsYXkuZGVsYXlUaW1lICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2suY29ubmVjdCggdGhpcy5mZWVkYmFjay5nYWluICk7XG4gICAgfVxuXG5cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRGVsYXkgPSBmdW5jdGlvbiggdGltZSwgZmVlZGJhY2tMZXZlbCApIHtcbiAgICByZXR1cm4gbmV3IERlbGF5KCB0aGlzLCB0aW1lLCBmZWVkYmFja0xldmVsICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBEZWxheTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcbmltcG9ydCBEcnlXZXROb2RlIGZyb20gXCIuLi9ncmFwaHMvRHJ5V2V0Tm9kZS5lczZcIjtcbmltcG9ydCBEZWxheSBmcm9tIFwiLi9EZWxheS5lczZcIjtcblxuLy8gVE9ETzpcbi8vICAtIENvbnZlcnQgdGhpcyBub2RlIHRvIHVzZSBQYXJhbSBjb250cm9sc1xuLy8gICAgZm9yIHRpbWUgYW5kIGZlZWRiYWNrLlxuXG5jbGFzcyBQaW5nUG9uZ0RlbGF5IGV4dGVuZHMgRHJ5V2V0Tm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB0aW1lID0gMC4yNSwgZmVlZGJhY2tMZXZlbCA9IDAuNSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGNoYW5uZWwgc3BsaXR0ZXIgYW5kIG1lcmdlclxuICAgICAgICB0aGlzLnNwbGl0dGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxTcGxpdHRlciggMiApO1xuICAgICAgICB0aGlzLm1lcmdlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsTWVyZ2VyKCAyICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGZlZWRiYWNrIGFuZCBkZWxheSBub2Rlc1xuICAgICAgICB0aGlzLmZlZWRiYWNrTCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tSID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5kZWxheUwgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgdGhpcy5kZWxheVIgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcblxuICAgICAgICAvLyBTZXR1cCB0aGUgZmVlZGJhY2sgbG9vcFxuICAgICAgICB0aGlzLmRlbGF5TC5jb25uZWN0KCB0aGlzLmZlZWRiYWNrTCApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrTC5jb25uZWN0KCB0aGlzLmRlbGF5UiApO1xuICAgICAgICB0aGlzLmRlbGF5Ui5jb25uZWN0KCB0aGlzLmZlZWRiYWNrUiApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrUi5jb25uZWN0KCB0aGlzLmRlbGF5TCApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnNwbGl0dGVyICk7XG4gICAgICAgIHRoaXMuc3BsaXR0ZXIuY29ubmVjdCggdGhpcy5kZWxheUwsIDAgKTtcbiAgICAgICAgdGhpcy5mZWVkYmFja0wuY29ubmVjdCggdGhpcy5tZXJnZXIsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5mZWVkYmFja1IuY29ubmVjdCggdGhpcy5tZXJnZXIsIDAsIDEgKTtcbiAgICAgICAgdGhpcy5tZXJnZXIuY29ubmVjdCggdGhpcy53ZXQgKTtcblxuICAgICAgICB0aGlzLnRpbWUgPSB0aW1lO1xuICAgICAgICB0aGlzLmZlZWRiYWNrTGV2ZWwgPSBmZWVkYmFja0xldmVsO1xuICAgIH1cblxuICAgIGdldCB0aW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWxheUwuZGVsYXlUaW1lO1xuICAgIH1cblxuICAgIHNldCB0aW1lKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5kZWxheUwuZGVsYXlUaW1lLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyAwLjVcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLmRlbGF5Ui5kZWxheVRpbWUubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIDAuNVxuICAgICAgICApO1xuICAgIH1cblxuICAgIGdldCBmZWVkYmFja0xldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5mZWVkYmFja0wuZ2Fpbi52YWx1ZTtcbiAgICB9XG5cbiAgICBzZXQgZmVlZGJhY2tMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tMLmdhaW4udmFsdWUgPSBsZXZlbDtcbiAgICAgICAgdGhpcy5mZWVkYmFja1IuZ2Fpbi52YWx1ZSA9IGxldmVsO1xuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggUGluZ1BvbmdEZWxheS5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkF1ZGlvSU8ubWl4aW4oIFBpbmdQb25nRGVsYXkucHJvdG90eXBlLCBjb25uZWN0aW9ucyApO1xuQXVkaW9JTy5taXhpbiggUGluZ1BvbmdEZWxheS5wcm90b3R5cGUsIGNsZWFuZXJzICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBpbmdQb25nRGVsYXkgPSBmdW5jdGlvbiggdGltZSwgZmVlZGJhY2tMZXZlbCApIHtcbiAgICByZXR1cm4gbmV3IFBpbmdQb25nRGVsYXkoIHRoaXMsIHRpbWUsIGZlZWRiYWNrTGV2ZWwgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuXG5jbGFzcyBPc2NpbGxhdG9yR2VuZXJhdG9yIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlZm9ybSApIHtcbiAgICAgICAgdGhpcy5fc2V0SU8oIGlvICk7XG5cbiAgICAgICAgdGhpcy5mcmVxdWVuY3kgPSBmcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuZGV0dW5lID0gZGV0dW5lO1xuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgICAgIHRoaXMuZ2xpZGVUaW1lID0gZ2xpZGVUaW1lO1xuICAgICAgICB0aGlzLndhdmUgPSB3YXZlZm9ybSB8fCAnc2luZSc7XG4gICAgICAgIHRoaXMucmVzZXRUaW1lc3RhbXAgPSAwLjA7XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSB0aGlzLmNvbnRleHQuY3JlYXRlT3NjaWxsYXRvcigpLFxuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGggPSB0aGlzLl9tYWtlVmVsb2NpdHlHcmFwaCggdmVsb2NpdHkgKTtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gWyB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpIF07XG4gICAgICAgIHRoaXMucmVzZXQoIHRoaXMuZnJlcXVlbmN5LCB0aGlzLmRldHVuZSwgdGhpcy52ZWxvY2l0eSwgdGhpcy5nbGlkZVRpbWUsIHRoaXMud2F2ZSApO1xuXG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLmNvbm5lY3QoIHRoaXMudmVsb2NpdHlHcmFwaCApO1xuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGguY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBfbWFrZVZlbG9jaXR5R3JhcGgoKSB7XG4gICAgICAgIHZhciBnYWluID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgcmV0dXJuIGdhaW47XG4gICAgfVxuXG4gICAgX3Jlc2V0VmVsb2NpdHlHcmFwaCggdmVsb2NpdHkgKSB7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaC5nYWluLnZhbHVlID0gdmVsb2NpdHk7XG4gICAgfVxuXG4gICAgX2NsZWFuVXBWZWxvY2l0eUdyYXBoKCkge1xuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGguZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaCA9IG51bGw7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdID0gbnVsbDtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gbnVsbDtcbiAgICB9XG5cbiAgICBsZXJwKCBzdGFydCwgZW5kLCBkZWx0YSApIHtcbiAgICAgICAgcmV0dXJuIHN0YXJ0ICsgKCAoIGVuZCAtIHN0YXJ0ICkgKiBkZWx0YSApO1xuICAgIH1cblxuICAgIHJlc2V0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZSApIHtcbiAgICAgICAgdmFyIG5vdyA9IHRoaXMuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICBmcmVxdWVuY3kgPSB0eXBlb2YgZnJlcXVlbmN5ID09PSAnbnVtYmVyJyA/IGZyZXF1ZW5jeSA6IHRoaXMuZnJlcXVlbmN5O1xuICAgICAgICBkZXR1bmUgPSB0eXBlb2YgZGV0dW5lID09PSAnbnVtYmVyJyA/IGRldHVuZSA6IHRoaXMuZGV0dW5lO1xuICAgICAgICB2ZWxvY2l0eSA9IHR5cGVvZiB2ZWxvY2l0eSA9PT0gJ251bWJlcicgPyB2ZWxvY2l0eSA6IHRoaXMudmVsb2NpdHk7XG4gICAgICAgIHdhdmUgPSB0eXBlb2Ygd2F2ZSA9PT0gJ251bWJlcicgPyB3YXZlIDogdGhpcy53YXZlO1xuXG4gICAgICAgIHZhciBnbGlkZVRpbWUgPSB0eXBlb2YgZ2xpZGVUaW1lID09PSAnbnVtYmVyJyA/IGdsaWRlVGltZSA6IDA7XG5cbiAgICAgICAgdGhpcy5fcmVzZXRWZWxvY2l0eUdyYXBoKCB2ZWxvY2l0eSApO1xuXG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIG5vdyApO1xuICAgICAgICB0aGlzLmdlbmVyYXRvci5kZXR1bmUuY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCBub3cgKTtcblxuICAgICAgICAvLyBub3cgKz0gMC4xXG5cbiAgICAgICAgLy8gaWYgKCB0aGlzLmdsaWRlVGltZSAhPT0gMC4wICkge1xuICAgICAgICAvLyAgICAgdmFyIHN0YXJ0RnJlcSA9IHRoaXMuZnJlcXVlbmN5LFxuICAgICAgICAvLyAgICAgICAgIGVuZEZyZXEgPSBmcmVxdWVuY3ksXG4gICAgICAgIC8vICAgICAgICAgZnJlcURpZmYgPSBlbmRGcmVxIC0gc3RhcnRGcmVxLFxuICAgICAgICAvLyAgICAgICAgIHN0YXJ0VGltZSA9IHRoaXMucmVzZXRUaW1lc3RhbXAsXG4gICAgICAgIC8vICAgICAgICAgZW5kVGltZSA9IHRoaXMucmVzZXRUaW1lc3RhbXAgKyB0aGlzLmdsaWRlVGltZSxcbiAgICAgICAgLy8gICAgICAgICBjdXJyZW50VGltZSA9IG5vdyAtIHN0YXJ0VGltZSxcbiAgICAgICAgLy8gICAgICAgICBsZXJwUG9zID0gY3VycmVudFRpbWUgLyB0aGlzLmdsaWRlVGltZSxcbiAgICAgICAgLy8gICAgICAgICBjdXJyZW50RnJlcSA9IHRoaXMubGVycCggdGhpcy5mcmVxdWVuY3ksIGZyZXF1ZW5jeSwgbGVycFBvcyApO1xuXG4gICAgICAgIC8vICAgICBpZiAoIGN1cnJlbnRUaW1lIDwgZ2xpZGVUaW1lICkge1xuICAgICAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKCAnY3V0b2ZmJywgc3RhcnRGcmVxLCBjdXJyZW50RnJlcSApO1xuICAgICAgICAvLyAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZSggY3VycmVudEZyZXEsIG5vdyApO1xuICAgICAgICAvLyAgICAgfVxuXG5cbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKCBzdGFydFRpbWUsIGVuZFRpbWUsIG5vdywgY3VycmVudFRpbWUgKTtcbiAgICAgICAgLy8gfVxuXG5cbiAgICAgICAgLy8gbm93ICs9IDAuNTtcblxuICAgICAgICBpZiAoIGdsaWRlVGltZSAhPT0gMCApIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggZnJlcXVlbmN5LCBub3cgKyBnbGlkZVRpbWUgKTtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmRldHVuZS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggZGV0dW5lLCBub3cgKyBnbGlkZVRpbWUgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZSggZnJlcXVlbmN5LCBub3cgKTtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmRldHVuZS5zZXRWYWx1ZUF0VGltZSggZGV0dW5lLCBub3cgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggdHlwZW9mIHdhdmUgPT09ICdzdHJpbmcnICkge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IudHlwZSA9IHdhdmU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRvci50eXBlID0gdGhpcy53YXZlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXNldFRpbWVzdGFtcCA9IG5vdztcbiAgICAgICAgdGhpcy5nbGlkZVRpbWUgPSBnbGlkZVRpbWU7XG4gICAgICAgIHRoaXMuZnJlcXVlbmN5ID0gZnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmRldHVuZSA9IGRldHVuZTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgICAgICB0aGlzLndhdmUgPSB3YXZlO1xuICAgIH1cblxuICAgIHN0YXJ0KCBkZWxheSApIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3Iuc3RhcnQoIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgc3RvcCggZGVsYXkgKSB7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLnN0b3AoIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3IuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fY2xlYW5VcFZlbG9jaXR5R3JhcGgoKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIE9zY2lsbGF0b3JHZW5lcmF0b3IucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU9zY2lsbGF0b3JHZW5lcmF0b3IgPSBmdW5jdGlvbiggZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmUgKSB7XG4gICAgcmV0dXJuIG5ldyBPc2NpbGxhdG9yR2VuZXJhdG9yKCB0aGlzLCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBUT0RPOlxuLy8gIC0gVHVybiBhcmd1bWVudHMgaW50byBjb250cm9sbGFibGUgcGFyYW1ldGVycztcbmNsYXNzIENvdW50ZXIgZXh0ZW5kcyBOb2RlIHtcblxuICAgIGNvbnN0cnVjdG9yKCBpbywgaW5jcmVtZW50LCBsaW1pdCwgc3RlcFRpbWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuc3RlcFRpbWUgPSBzdGVwVGltZSB8fCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGU7XG5cbiAgICAgICAgdGhpcy5jb25zdGFudCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGluY3JlbWVudCApO1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIHRoaXMuZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSB0aGlzLnN0ZXBUaW1lO1xuXG4gICAgICAgIHRoaXMuZmVlZGJhY2sgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcblxuICAgICAgICB0aGlzLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLmZlZWRiYWNrICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suY29ubmVjdCggdGhpcy5kZWxheSApO1xuXG4gICAgICAgIHRoaXMubGVzc1RoYW4gPSB0aGlzLmlvLmNyZWF0ZUxlc3NUaGFuKCBsaW1pdCApO1xuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMubGVzc1RoYW4gKTtcbiAgICAgICAgLy8gdGhpcy5sZXNzVGhhbi5jb25uZWN0KCB0aGlzLmZlZWRiYWNrLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb25zdGFudC5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMubGVzc1RoYW4uY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgIH1cblxuICAgIHJlc2V0KCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5zdG9wKCk7XG5cbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLnN0YXJ0KCk7XG4gICAgICAgIH0sIDE2ICk7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGlmKCB0aGlzLnJ1bm5pbmcgPT09IGZhbHNlICkge1xuICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gdGhpcy5zdGVwVGltZTtcbiAgICAgICAgICAgIHRoaXMubGVzc1RoYW4uY29ubmVjdCggdGhpcy5mZWVkYmFjay5nYWluICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdG9wKCkge1xuICAgICAgICBpZiggdGhpcy5ydW5uaW5nID09PSB0cnVlICkge1xuICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmxlc3NUaGFuLmRpc2Nvbm5lY3QoIHRoaXMuZmVlZGJhY2suZ2FpbiApO1xuICAgICAgICAgICAgdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvdW50ZXIgPSBmdW5jdGlvbiggaW5jcmVtZW50LCBsaW1pdCwgc3RlcFRpbWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDb3VudGVyKCB0aGlzLCBpbmNyZW1lbnQsIGxpbWl0LCBzdGVwVGltZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBDcm9zc2ZhZGVyIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1DYXNlcyA9IDIsIHN0YXJ0aW5nQ2FzZSA9IDAgKSB7XG5cbiAgICAgICAgLy8gRW5zdXJlIHN0YXJ0aW5nQ2FzZSBpcyBuZXZlciA8IDBcbiAgICAgICAgLy8gYW5kIG51bWJlciBvZiBpbnB1dHMgaXMgYWx3YXlzID49IDIgKG5vIHBvaW50XG4gICAgICAgIC8vIHgtZmFkaW5nIGJldHdlZW4gbGVzcyB0aGFuIHR3byBpbnB1dHMhKVxuICAgICAgICBzdGFydGluZ0Nhc2UgPSBNYXRoLmFicyggc3RhcnRpbmdDYXNlICk7XG4gICAgICAgIG51bUNhc2VzID0gTWF0aC5tYXgoIG51bUNhc2VzLCAyICk7XG5cbiAgICAgICAgc3VwZXIoIGlvLCBudW1DYXNlcywgMSApO1xuXG4gICAgICAgIHRoaXMuY2xhbXBzID0gW107XG4gICAgICAgIHRoaXMuc3VidHJhY3RzID0gW107XG4gICAgICAgIHRoaXMueGZhZGVycyA9IFtdO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgbnVtQ2FzZXMgLSAxOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLnhmYWRlcnNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlRHJ5V2V0Tm9kZSgpO1xuICAgICAgICAgICAgdGhpcy5zdWJ0cmFjdHNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoIGkpO1xuICAgICAgICAgICAgdGhpcy5jbGFtcHNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAsIDEgKTtcblxuICAgICAgICAgICAgaWYoIGkgPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS5kcnkgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0c1sgaSArIDEgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS53ZXQgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMueGZhZGVyc1sgaSAtIDEgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS5kcnkgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0c1sgaSArIDEgXS5jb25uZWN0KCB0aGlzLnhmYWRlcnNbIGkgXS53ZXQgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5pbmRleC5jb25uZWN0KCB0aGlzLnN1YnRyYWN0c1sgaSBdICk7XG4gICAgICAgICAgICB0aGlzLnN1YnRyYWN0c1sgaSBdLmNvbm5lY3QoIHRoaXMuY2xhbXBzWyBpIF0gKTtcbiAgICAgICAgICAgIHRoaXMuY2xhbXBzWyBpIF0uY29ubmVjdCggdGhpcy54ZmFkZXJzWyBpIF0uY29udHJvbHMuZHJ5V2V0ICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnhmYWRlcnNbIHRoaXMueGZhZGVycy5sZW5ndGggLSAxIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDcm9zc2ZhZGVyID0gZnVuY3Rpb24oIG51bUNhc2VzLCBzdGFydGluZ0Nhc2UgKSB7XG4gICAgcmV0dXJuIG5ldyBDcm9zc2ZhZGVyKCB0aGlzLCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBEaWZmdXNlRGVsYXkgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMgPSB7XG4gICAgICAgICAgICBkaWZmdXNpb246IHRoaXMuaW8uY3JlYXRlUGFyYW0oKSxcbiAgICAgICAgICAgIHRpbWU6IHRoaXMuaW8uY3JlYXRlUGFyYW0oKVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZmVlZGJhY2tBZGRlciA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgdGhpcy5uZWdhdGUgPSB0aGlzLmlvLmNyZWF0ZU5lZ2F0ZSgpO1xuICAgICAgICB0aGlzLm11bHRpcGx5MSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseTIgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuc3VtID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgdGhpcy5zaGVsZiA9IHRoaXMuaW8uY3JlYXRlRVFTaGVsZigpO1xuXG4gICAgICAgIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lLmNvbm5lY3QoIHRoaXMuZGVsYXkuZGVsYXlUaW1lICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5kaWZmdXNpb24uY29ubmVjdCggdGhpcy5uZWdhdGUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MSwgMCwgMCApO1xuICAgICAgICB0aGlzLm5lZ2F0ZS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MSwgMCwgMSApO1xuICAgICAgICB0aGlzLm11bHRpcGx5MS5jb25uZWN0KCB0aGlzLnN1bSwgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWzBdLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2tBZGRlciwgMCwgMCApO1xuICAgICAgICB0aGlzLm11bHRpcGx5Mi5jb25uZWN0KCB0aGlzLmZlZWRiYWNrQWRkZXIsIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmZlZWRiYWNrQWRkZXIuY29ubmVjdCggdGhpcy5kZWxheSApO1xuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMuc2hlbGYgKTtcblxuICAgICAgICB0aGlzLnNoZWxmLmNvbm5lY3QoIHRoaXMuc3VtLCAwLCAwICk7XG5cblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRpZmZ1c2lvbi5jb25uZWN0KCB0aGlzLm11bHRpcGx5MiwgMCwgMSApO1xuICAgICAgICB0aGlzLnN1bS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MiwgMCwgMSApO1xuICAgICAgICB0aGlzLnN1bS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEaWZmdXNlRGVsYXkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IERpZmZ1c2VEZWxheSggdGhpcyApO1xufTtcblxuZXhwb3J0XG5kZWZhdWx0IERpZmZ1c2VEZWxheTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuLy8gVGhpcyBmdW5jdGlvbiBjcmVhdGVzIGEgZ3JhcGggdGhhdCBhbGxvd3MgbW9ycGhpbmdcbi8vIGJldHdlZW4gdHdvIGdhaW4gbm9kZXMuXG4vL1xuLy8gSXQgbG9va3MgYSBsaXR0bGUgYml0IGxpa2UgdGhpczpcbi8vXG4vLyAgICAgICAgICAgICAgICAgZHJ5IC0+IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLT4gfFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYgIEdhaW4oMC0xKSAgICAtPiAgICAgR2FpbigtMSkgICAgIC0+ICAgICBvdXRwdXRcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChmYWRlcikgICAgICAgICAoaW52ZXJ0IHBoYXNlKSAgICAgICAgKHN1bW1pbmcpXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICBeXG4vLyAgICB3ZXQgLT4gICBHYWluKC0xKSAgIC0+IC18XG4vLyAgICAgICAgICAoaW52ZXJ0IHBoYXNlKVxuLy9cbi8vIFdoZW4gYWRqdXN0aW5nIHRoZSBmYWRlcidzIGdhaW4gdmFsdWUgaW4gdGhpcyBncmFwaCxcbi8vIGlucHV0MSdzIGdhaW4gbGV2ZWwgd2lsbCBjaGFuZ2UgZnJvbSAwIHRvIDEsXG4vLyB3aGlsc3QgaW5wdXQyJ3MgZ2FpbiBsZXZlbCB3aWxsIGNoYW5nZSBmcm9tIDEgdG8gMC5cbmNsYXNzIERyeVdldE5vZGUgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMiwgMSApO1xuXG4gICAgICAgIHRoaXMuZHJ5ID0gdGhpcy5pbnB1dHNbIDAgXTtcbiAgICAgICAgdGhpcy53ZXQgPSB0aGlzLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIC8vIEludmVydCB3ZXQgc2lnbmFsJ3MgcGhhc2VcbiAgICAgICAgdGhpcy53ZXRJbnB1dEludmVydCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMud2V0SW5wdXRJbnZlcnQuZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICB0aGlzLndldC5jb25uZWN0KCB0aGlzLndldElucHV0SW52ZXJ0ICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBmYWRlciBub2RlXG4gICAgICAgIHRoaXMuZmFkZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmZhZGVyLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgY29udHJvbCBub2RlLiBJdCBzZXRzIHRoZSBmYWRlcidzIHZhbHVlLlxuICAgICAgICB0aGlzLmRyeVdldENvbnRyb2wgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuZHJ5V2V0Q29udHJvbC5jb25uZWN0KCB0aGlzLmZhZGVyLmdhaW4gKTtcblxuICAgICAgICAvLyBJbnZlcnQgdGhlIGZhZGVyIG5vZGUncyBwaGFzZVxuICAgICAgICB0aGlzLmZhZGVySW52ZXJ0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5mYWRlckludmVydC5nYWluLnZhbHVlID0gLTE7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBmYWRlciB0byBmYWRlciBwaGFzZSBpbnZlcnNpb24sXG4gICAgICAgIC8vIGFuZCBmYWRlciBwaGFzZSBpbnZlcnNpb24gdG8gb3V0cHV0LlxuICAgICAgICB0aGlzLndldElucHV0SW52ZXJ0LmNvbm5lY3QoIHRoaXMuZmFkZXIgKTtcbiAgICAgICAgdGhpcy5mYWRlci5jb25uZWN0KCB0aGlzLmZhZGVySW52ZXJ0ICk7XG4gICAgICAgIHRoaXMuZmFkZXJJbnZlcnQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBDb25uZWN0IGRyeSBpbnB1dCB0byBib3RoIHRoZSBvdXRwdXQgYW5kIHRoZSBmYWRlciBub2RlXG4gICAgICAgIHRoaXMuZHJ5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuZHJ5LmNvbm5lY3QoIHRoaXMuZmFkZXIgKTtcblxuICAgICAgICAvLyBBZGQgYSAnZHJ5V2V0JyBwcm9wZXJ0eSB0byB0aGUgY29udHJvbHMgb2JqZWN0LlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRyeVdldCA9IHRoaXMuZHJ5V2V0Q29udHJvbDtcbiAgICB9XG5cbn1cblxuXG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRHJ5V2V0Tm9kZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRHJ5V2V0Tm9kZSggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRHJ5V2V0Tm9kZTtcbiIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBFUVNoZWxmIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBoaWdoRnJlcXVlbmN5ID0gMjUwMCwgbG93RnJlcXVlbmN5ID0gMzUwLCBoaWdoQm9vc3QgPSAtNiwgbG93Qm9vc3QgPSAwICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLmhpZ2hGcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoRnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMubG93RnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93RnJlcXVlbmN5ICk7XG4gICAgICAgIHRoaXMuaGlnaEJvb3N0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaEJvb3N0ICk7XG4gICAgICAgIHRoaXMubG93Qm9vc3QgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dCb29zdCApO1xuXG4gICAgICAgIHRoaXMubG93U2hlbGYgPSB0aGlzLmNvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gICAgICAgIHRoaXMubG93U2hlbGYudHlwZSA9ICdsb3dzaGVsZic7XG4gICAgICAgIHRoaXMubG93U2hlbGYuZnJlcXVlbmN5LnZhbHVlID0gbG93RnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmxvd1NoZWxmLmdhaW4udmFsdWUgPSBsb3dCb29zdDtcblxuICAgICAgICB0aGlzLmhpZ2hTaGVsZiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgICAgICAgdGhpcy5oaWdoU2hlbGYudHlwZSA9ICdoaWdoc2hlbGYnO1xuICAgICAgICB0aGlzLmhpZ2hTaGVsZi5mcmVxdWVuY3kudmFsdWUgPSBoaWdoRnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmhpZ2hTaGVsZi5nYWluLnZhbHVlID0gaGlnaEJvb3N0O1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5sb3dTaGVsZiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuaGlnaFNoZWxmICk7XG4gICAgICAgIHRoaXMubG93U2hlbGYuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5oaWdoU2hlbGYuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICAvL1xuICAgICAgICAvLyBUT0RPOlxuICAgICAgICAvLyAgLSBTaG91bGQgdGhlc2UgYmUgcmVmZXJlbmNlcyB0byBwYXJhbS5jb250cm9sPyBUaGlzXG4gICAgICAgIC8vICAgIG1pZ2h0IGFsbG93IGRlZmF1bHRzIHRvIGJlIHNldCB3aGlsc3QgYWxzbyBhbGxvd2luZ1xuICAgICAgICAvLyAgICBhdWRpbyBzaWduYWwgY29udHJvbC5cbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoRnJlcXVlbmN5ID0gdGhpcy5oaWdoRnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0ZyZXF1ZW5jeSA9IHRoaXMubG93RnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hCb29zdCA9IHRoaXMuaGlnaEJvb3N0O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0Jvb3N0ID0gdGhpcy5sb3dCb29zdDtcbiAgICB9XG5cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRVFTaGVsZiA9IGZ1bmN0aW9uKCBoaWdoRnJlcXVlbmN5LCBsb3dGcmVxdWVuY3ksIGhpZ2hCb29zdCwgbG93Qm9vc3QgKSB7XG4gICAgcmV0dXJuIG5ldyBFUVNoZWxmKCB0aGlzLCBoaWdoRnJlcXVlbmN5LCBsb3dGcmVxdWVuY3ksIGhpZ2hCb29zdCwgbG93Qm9vc3QgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEVRU2hlbGY7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbnZhciBPU0NJTExBVE9SX1RZUEVTID0gW1xuICAgICdzaW5lJyxcbiAgICAndHJpYW5nbGUnLFxuICAgICdzYXd0b290aCcsXG4gICAgJ3NxdWFyZSdcbl07XG5cbmNsYXNzIE9zY2lsbGF0b3JCYW5rIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5zd2l0Y2ggPSB0aGlzLmlvLmNyZWF0ZVN3aXRjaCggT1NDSUxMQVRPUl9UWVBFUy5sZW5ndGggKTtcblxuICAgICAgICB0aGlzLm9zY2lsbGF0b3JzID0gW107XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBPU0NJTExBVE9SX1RZUEVTLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdmFyIG9zYyA9IHRoaXMuY29udGV4dC5jcmVhdGVPc2NpbGxhdG9yKCk7XG4gICAgICAgICAgICBvc2MudHlwZSA9IE9TQ0lMTEFUT1JfVFlQRVNbIGkgXTtcbiAgICAgICAgICAgIG9zYy5mcmVxdWVuY3kudmFsdWUgPSAwO1xuICAgICAgICAgICAgdGhpcy5mcmVxdWVuY3kuY29ubmVjdCggb3NjLmZyZXF1ZW5jeSApO1xuICAgICAgICAgICAgb3NjLnN0YXJ0KCAwICk7XG4gICAgICAgICAgICBvc2MuY29ubmVjdCggdGhpcy5zd2l0Y2gsIDAsIGkgKTtcbiAgICAgICAgICAgIHRoaXMub3NjaWxsYXRvcnMucHVzaCggb3NjICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN3aXRjaC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIFN0b3JlIGNvbnRyb2xsYWJsZSBwYXJhbXMuXG4gICAgICAgIHRoaXMuY29udHJvbHMud2F2ZWZvcm0gPSB0aGlzLnN3aXRjaC5jb250cm9sO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuZnJlcXVlbmN5O1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVPc2NpbGxhdG9yQmFuayA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT3NjaWxsYXRvckJhbmsoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IE9zY2lsbGF0b3JCYW5rOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBQaGFzZU9mZnNldCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsID0gdGhpcy5pby5jcmVhdGVSZWNpcHJvY2FsKCB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSAqIDAuNSApO1xuICAgICAgICB0aGlzLmRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLnBoYXNlID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmhhbGZQaGFzZSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIDAuNSApO1xuXG4gICAgICAgIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmZyZXF1ZW5jeS5jb25uZWN0KCB0aGlzLnJlY2lwcm9jYWwgKTtcbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsLmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5waGFzZS5jb25uZWN0KCB0aGlzLmhhbGZQaGFzZSApO1xuICAgICAgICB0aGlzLmhhbGZQaGFzZS5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAxICk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkuY29ubmVjdCggdGhpcy5kZWxheS5kZWxheVRpbWUgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5kZWxheSApO1xuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDAuNTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZyZXF1ZW5jeSA9IHRoaXMuZnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnBoYXNlID0gdGhpcy5waGFzZTtcbiAgICB9XG5cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUGhhc2VPZmZzZXQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFBoYXNlT2Zmc2V0KCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBQaGFzZU9mZnNldDsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuLy8gaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IG1hdGggZnJvbSBcIi4uL21peGlucy9tYXRoLmVzNlwiO1xuLy8gaW1wb3J0IE5vdGUgZnJvbSBcIi4uL25vdGUvTm90ZS5lczZcIjtcbi8vIGltcG9ydCBDaG9yZCBmcm9tIFwiLi4vbm90ZS9DaG9yZC5lczZcIjtcblxuLy8gIFBsYXllclxuLy8gID09PT09PVxuLy8gIFRha2VzIGNhcmUgb2YgcmVxdWVzdGluZyBHZW5lcmF0b3JOb2RlcyBiZSBjcmVhdGVkLlxuLy9cbi8vICBIYXM6XG4vLyAgICAgIC0gUG9seXBob255IChwYXJhbSlcbi8vICAgICAgLSBVbmlzb24gKHBhcmFtKVxuLy8gICAgICAtIFVuaXNvbiBkZXR1bmUgKHBhcmFtKVxuLy8gICAgICAtIFVuaXNvbiBwaGFzZSAocGFyYW0pXG4vLyAgICAgIC0gR2xpZGUgbW9kZVxuLy8gICAgICAtIEdsaWRlIHRpbWVcbi8vICAgICAgLSBWZWxvY2l0eSBzZW5zaXRpdml0eSAocGFyYW0pXG4vLyAgICAgIC0gR2xvYmFsIHR1bmluZyAocGFyYW0pXG4vL1xuLy8gIE1ldGhvZHM6XG4vLyAgICAgIC0gc3RhcnQoIGZyZXEvbm90ZSwgdmVsLCBkZWxheSApXG4vLyAgICAgIC0gc3RvcCggZnJlcS9ub3RlLCB2ZWwsIGRlbGF5IClcbi8vXG4vLyAgUHJvcGVydGllczpcbi8vICAgICAgLSBwb2x5cGhvbnkgKG51bWJlciwgPjEpXG4vLyAgICAgIC0gdW5pc29uIChudW1iZXIsID4xKVxuLy8gICAgICAtIHVuaXNvbkRldHVuZSAobnVtYmVyLCBjZW50cylcbi8vICAgICAgLSB1bmlzb25QaGFzZSAobnVtYmVyLCAwLTEpXG4vLyAgICAgIC0gZ2xpZGVNb2RlIChzdHJpbmcpXG4vLyAgICAgIC0gZ2xpZGVUaW1lIChtcywgbnVtYmVyKVxuLy8gICAgICAtIHZlbG9jaXR5U2Vuc2l0aXZpdHkgKDAtMSwgbnVtYmVyKVxuLy8gICAgICAtIHR1bmluZyAoLTY0LCArNjQsIHNlbWl0b25lcylcbi8vXG5jbGFzcyBHZW5lcmF0b3JQbGF5ZXIgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIG9wdGlvbnMgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIGlmICggb3B0aW9ucy5nZW5lcmF0b3IgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ0dlbmVyYXRvclBsYXllciByZXF1aXJlcyBhIGBnZW5lcmF0b3JgIG9wdGlvbiB0byBiZSBnaXZlbi4nICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IG9wdGlvbnMuZ2VuZXJhdG9yO1xuXG4gICAgICAgIHRoaXMucG9seXBob255ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggb3B0aW9ucy5wb2x5cGhvbnkgfHwgMSApO1xuXG4gICAgICAgIHRoaXMudW5pc29uID0gdGhpcy5pby5jcmVhdGVQYXJhbSggb3B0aW9ucy51bmlzb24gfHwgMSApO1xuICAgICAgICB0aGlzLnVuaXNvbkRldHVuZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHR5cGVvZiBvcHRpb25zLnVuaXNvbkRldHVuZSA9PT0gJ251bWJlcicgPyBvcHRpb25zLnVuaXNvbkRldHVuZSA6IDAgKTtcbiAgICAgICAgdGhpcy51bmlzb25QaGFzZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHR5cGVvZiBvcHRpb25zLnVuaXNvblBoYXNlID09PSAnbnVtYmVyJyA/IG9wdGlvbnMudW5pc29uUGhhc2UgOiAwICk7XG4gICAgICAgIHRoaXMudW5pc29uTW9kZSA9IG9wdGlvbnMudW5pc29uTW9kZSB8fCAnY2VudGVyZWQnO1xuXG4gICAgICAgIHRoaXMuZ2xpZGVNb2RlID0gb3B0aW9ucy5nbGlkZU1vZGUgfHwgJ2VxdWFsJztcbiAgICAgICAgdGhpcy5nbGlkZVRpbWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy5nbGlkZVRpbWUgPT09ICdudW1iZXInID8gb3B0aW9ucy5nbGlkZVRpbWUgOiAwICk7XG5cbiAgICAgICAgdGhpcy52ZWxvY2l0eVNlbnNpdGl2aXR5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMudmVsb2NpdHlTZW5zaXRpdml0eSA9PT0gJ251bWJlcicgPyBvcHRpb25zLnZlbG9jaXR5U2Vuc2l0aXZpdHkgOiAwICk7XG5cbiAgICAgICAgdGhpcy50dW5pbmcgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy50dW5pbmcgPT09ICdudW1iZXInID8gb3B0aW9ucy50dW5pbmcgOiAwICk7XG5cbiAgICAgICAgdGhpcy53YXZlZm9ybSA9IG9wdGlvbnMud2F2ZWZvcm0gfHwgJ3NpbmUnO1xuXG4gICAgICAgIHRoaXMuZW52ZWxvcGUgPSBvcHRpb25zLmVudmVsb3BlIHx8IHRoaXMuaW8uY3JlYXRlQVNEUkVudmVsb3BlKCk7XG5cbiAgICAgICAgdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzID0ge307XG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQgPSBbXTtcbiAgICAgICAgdGhpcy50aW1lcnMgPSBbXTtcbiAgICB9XG5cblxuICAgIF9jcmVhdGVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlZm9ybSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdG9yLmNhbGwoIHRoaXMuaW8sIGZyZXF1ZW5jeSwgZGV0dW5lICsgdGhpcy50dW5pbmcudmFsdWUgKiAxMDAsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmVmb3JtICk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGVzIHRoZSBhbW91bnQgb2YgZGV0dW5lIChjZW50cykgdG8gYXBwbHkgdG8gYSBnZW5lcmF0b3Igbm9kZVxuICAgICAqIGdpdmVuIGFuIGluZGV4IGJldHdlZW4gMCBhbmQgdGhpcy51bmlzb24udmFsdWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gdW5pc29uSW5kZXggVW5pc29uIGluZGV4LlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gICAgICAgICAgICAgRGV0dW5lIHZhbHVlLCBpbiBjZW50cy5cbiAgICAgKi9cbiAgICBfY2FsY3VsYXRlRGV0dW5lKCB1bmlzb25JbmRleCApIHtcbiAgICAgICAgdmFyIGRldHVuZSA9IDAuMCxcbiAgICAgICAgICAgIHVuaXNvbkRldHVuZSA9IHRoaXMudW5pc29uRGV0dW5lLnZhbHVlO1xuXG4gICAgICAgIGlmICggdGhpcy51bmlzb25Nb2RlID09PSAnY2VudGVyZWQnICkge1xuICAgICAgICAgICAgdmFyIGluY3IgPSB1bmlzb25EZXR1bmU7XG5cbiAgICAgICAgICAgIGRldHVuZSA9IGluY3IgKiB1bmlzb25JbmRleDtcbiAgICAgICAgICAgIGRldHVuZSAtPSBpbmNyICogKCB0aGlzLnVuaXNvbi52YWx1ZSAqIDAuNSApO1xuICAgICAgICAgICAgZGV0dW5lICs9IGluY3IgKiAwLjU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgbXVsdGlwbGllcjtcblxuICAgICAgICAgICAgLy8gTGVhdmUgdGhlIGZpcnN0IG5vdGUgaW4gdGhlIHVuaXNvblxuICAgICAgICAgICAgLy8gYWxvbmUsIHNvIGl0J3MgZGV0dW5lIHZhbHVlIGlzIHRoZSByb290XG4gICAgICAgICAgICAvLyBub3RlLlxuICAgICAgICAgICAgaWYgKCB1bmlzb25JbmRleCA+IDAgKSB7XG4gICAgICAgICAgICAgICAgLy8gSG9wIGRvd24gbmVnYXRpdmUgaGFsZiB0aGUgdW5pc29uSW5kZXhcbiAgICAgICAgICAgICAgICBpZiAoIHVuaXNvbkluZGV4ICUgMiA9PT0gMCApIHtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGllciA9IC11bmlzb25JbmRleCAqIDAuNTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEhvcCB1cCBuIGNlbnRzXG4gICAgICAgICAgICAgICAgICAgIGlmICggdW5pc29uSW5kZXggPiAxICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdW5pc29uSW5kZXggPSB0aGlzLk1hdGgucm91bmRUb011bHRpcGxlKCB1bmlzb25JbmRleCwgMiApIC0gMjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG11bHRpcGxpZXIgPSB1bmlzb25JbmRleDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIHRoZSBtdWx0aXBsaWVyLCBjYWxjdWxhdGUgdGhlIGRldHVuZSB2YWx1ZVxuICAgICAgICAgICAgICAgIC8vIGZvciB0aGUgZ2l2ZW4gdW5pc29uSW5kZXguXG4gICAgICAgICAgICAgICAgZGV0dW5lID0gdW5pc29uRGV0dW5lICogbXVsdGlwbGllcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZXR1bmU7XG4gICAgfVxuXG4gICAgX2NhbGN1bGF0ZUdsaWRlVGltZSggb2xkRnJlcSwgbmV3RnJlcSApIHtcbiAgICAgICAgdmFyIG1vZGUgPSB0aGlzLmdsaWRlTW9kZSxcbiAgICAgICAgICAgIHRpbWUgPSB0aGlzLmdsaWRlVGltZS52YWx1ZSxcbiAgICAgICAgICAgIGdsaWRlVGltZSxcbiAgICAgICAgICAgIGZyZXFEaWZmZXJlbmNlO1xuXG4gICAgICAgIGlmICggdGltZSA9PT0gMC4wICkge1xuICAgICAgICAgICAgZ2xpZGVUaW1lID0gMC4wO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBtb2RlID09PSAnZXF1YWwnICkge1xuICAgICAgICAgICAgZ2xpZGVUaW1lID0gdGltZSAqIDAuMDAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZnJlcURpZmZlcmVuY2UgPSBNYXRoLmFicyggb2xkRnJlcSAtIG5ld0ZyZXEgKTtcbiAgICAgICAgICAgIGZyZXFEaWZmZXJlbmNlID0gdGhpcy5NYXRoLmNsYW1wKCBmcmVxRGlmZmVyZW5jZSwgMCwgNTAwICk7XG4gICAgICAgICAgICBnbGlkZVRpbWUgPSB0aGlzLk1hdGguc2NhbGVOdW1iZXJFeHAoXG4gICAgICAgICAgICAgICAgZnJlcURpZmZlcmVuY2UsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICA1MDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICB0aW1lXG4gICAgICAgICAgICApICogMC4wMDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2xpZGVUaW1lO1xuICAgIH1cblxuXG4gICAgX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGdlbmVyYXRvck9iamVjdCApIHtcbiAgICAgICAgdmFyIG9iamVjdHMgPSB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHM7XG5cbiAgICAgICAgb2JqZWN0c1sgZnJlcXVlbmN5IF0gPSBvYmplY3RzWyBmcmVxdWVuY3kgXSB8fCBbXTtcbiAgICAgICAgb2JqZWN0c1sgZnJlcXVlbmN5IF0udW5zaGlmdCggZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQudW5zaGlmdCggZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgfVxuXG4gICAgX2ZldGNoR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3kgKSB7XG4gICAgICAgIHZhciBvYmplY3RzID0gdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzWyBmcmVxdWVuY3kgXSxcbiAgICAgICAgICAgIGluZGV4ID0gMDtcblxuICAgICAgICBpZiAoICFvYmplY3RzIHx8IG9iamVjdHMubGVuZ3RoID09PSAwICkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0LnBvcCgpO1xuICAgICAgICByZXR1cm4gb2JqZWN0cy5wb3AoKTtcbiAgICB9XG5cbiAgICBfZmV0Y2hHZW5lcmF0b3JPYmplY3RUb1JldXNlKCkge1xuICAgICAgICB2YXIgZ2VuZXJhdG9yID0gdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5wb3AoKSxcbiAgICAgICAgICAgIGZyZXF1ZW5jeTtcblxuICAgICAgICBjb25zb2xlLmxvZyggJ3JldXNlJywgZ2VuZXJhdG9yICk7XG5cbiAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBnZW5lcmF0b3IgKSApIHtcbiAgICAgICAgICAgIGZyZXF1ZW5jeSA9IGdlbmVyYXRvclsgMCBdLmZyZXF1ZW5jeTtcblxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgZ2VuZXJhdG9yLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgIHRoaXMuZW52ZWxvcGUuZm9yY2VTdG9wKCBnZW5lcmF0b3JbIGkgXS5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCggZ2VuZXJhdG9yWyBpIF0udGltZXIgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZyZXF1ZW5jeSA9IGdlbmVyYXRvci5mcmVxdWVuY3k7XG4gICAgICAgICAgICB0aGlzLmVudmVsb3BlLmZvcmNlU3RvcCggZ2VuZXJhdG9yLm91dHB1dHNbIDAgXS5nYWluICk7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoIGdlbmVyYXRvci50aW1lciApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzWyBmcmVxdWVuY3kgXS5wb3AoKTtcblxuICAgICAgICByZXR1cm4gZ2VuZXJhdG9yO1xuICAgIH1cblxuXG4gICAgX3N0YXJ0R2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICkge1xuICAgICAgICBnZW5lcmF0b3JPYmplY3Qub3V0cHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuZW52ZWxvcGUuc3RhcnQoIGdlbmVyYXRvck9iamVjdC5vdXRwdXRzWyAwIF0uZ2FpbiwgZGVsYXkgKTtcbiAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LnN0YXJ0KCBkZWxheSApO1xuICAgIH1cblxuICAgIF9zdGFydFNpbmdsZSggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKSB7XG4gICAgICAgIHZhciB1bmlzb24gPSB0aGlzLnVuaXNvbi52YWx1ZSxcbiAgICAgICAgICAgIGRldHVuZSA9IDAuMCxcbiAgICAgICAgICAgIHVuaXNvbkdlbmVyYXRvckFycmF5LFxuICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LFxuICAgICAgICAgICAgYWN0aXZlR2VuZXJhdG9yQ291bnQgPSB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0Lmxlbmd0aCxcbiAgICAgICAgICAgIGV4aXN0aW5nRnJlcXVlbmN5LFxuICAgICAgICAgICAgZ2xpZGVUaW1lID0gMC4wO1xuXG4gICAgICAgIGlmICggYWN0aXZlR2VuZXJhdG9yQ291bnQgPCB0aGlzLnBvbHlwaG9ueS52YWx1ZSApIHtcbiAgICAgICAgICAgIGlmICggdW5pc29uID09PSAxLjAgKSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fY3JlYXRlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgdGhpcy53YXZlZm9ybSApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0R2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB1bmlzb25HZW5lcmF0b3JBcnJheSA9IFtdO1xuXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdW5pc29uOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgICAgIGRldHVuZSA9IHRoaXMuX2NhbGN1bGF0ZURldHVuZSggaSApO1xuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSB0aGlzLl9jcmVhdGVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB0aGlzLndhdmVmb3JtICk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0R2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICk7XG4gICAgICAgICAgICAgICAgICAgIHVuaXNvbkdlbmVyYXRvckFycmF5LnB1c2goIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIHVuaXNvbkdlbmVyYXRvckFycmF5ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICggdW5pc29uID09PSAxLjAgKSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fZmV0Y2hHZW5lcmF0b3JPYmplY3RUb1JldXNlKCk7XG4gICAgICAgICAgICAgICAgZXhpc3RpbmdGcmVxdWVuY3kgPSBnZW5lcmF0b3JPYmplY3QuZnJlcXVlbmN5O1xuICAgICAgICAgICAgICAgIGdsaWRlVGltZSA9IHRoaXMuX2NhbGN1bGF0ZUdsaWRlVGltZSggZXhpc3RpbmdGcmVxdWVuY3ksIGZyZXF1ZW5jeSApO1xuXG4gICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LnJlc2V0KCBmcmVxdWVuY3ksIGRldHVuZSArIHRoaXMudHVuaW5nLnZhbHVlICogMTAwLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lICk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSB0aGlzLl9mZXRjaEdlbmVyYXRvck9iamVjdFRvUmV1c2UoKTtcbiAgICAgICAgICAgICAgICBleGlzdGluZ0ZyZXF1ZW5jeSA9IGdlbmVyYXRvck9iamVjdFsgMCBdLmZyZXF1ZW5jeTtcbiAgICAgICAgICAgICAgICBnbGlkZVRpbWUgPSB0aGlzLl9jYWxjdWxhdGVHbGlkZVRpbWUoIGV4aXN0aW5nRnJlcXVlbmN5LCBmcmVxdWVuY3kgKTtcblxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHVuaXNvbjsgKytpICkge1xuICAgICAgICAgICAgICAgICAgICBkZXR1bmUgPSB0aGlzLl9jYWxjdWxhdGVEZXR1bmUoIGkgKTtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0WyBpIF0ucmVzZXQoIGZyZXF1ZW5jeSwgZGV0dW5lICsgdGhpcy50dW5pbmcudmFsdWUgKiAxMDAsIHZlbG9jaXR5LCBnbGlkZVRpbWUgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJldHVybiB0aGUgZ2VuZXJhdGVkIG9iamVjdChzKSBpbiBjYXNlIHRoZXkncmUgbmVlZGVkLlxuICAgICAgICByZXR1cm4gdW5pc29uR2VuZXJhdG9yQXJyYXkgPyB1bmlzb25HZW5lcmF0b3JBcnJheSA6IGdlbmVyYXRvck9iamVjdDtcbiAgICB9XG5cbiAgICBzdGFydCggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKSB7XG4gICAgICAgIHZhciBmcmVxID0gMCxcbiAgICAgICAgICAgIHZlbG9jaXR5U2Vuc2l0aXZpdHkgPSB0aGlzLnZlbG9jaXR5U2Vuc2l0aXZpdHkudmFsdWU7XG5cbiAgICAgICAgdmVsb2NpdHkgPSB0eXBlb2YgdmVsb2NpdHkgPT09ICdudW1iZXInID8gdmVsb2NpdHkgOiAxO1xuICAgICAgICBkZWxheSA9IHR5cGVvZiBkZWxheSA9PT0gJ251bWJlcicgPyBkZWxheSA6IDA7XG5cblxuICAgICAgICBpZiAoIHZlbG9jaXR5U2Vuc2l0aXZpdHkgIT09IDAgKSB7XG4gICAgICAgICAgICB2ZWxvY2l0eSA9IHRoaXMuTWF0aC5zY2FsZU51bWJlciggdmVsb2NpdHksIDAsIDEsIDAuNSAtIHZlbG9jaXR5U2Vuc2l0aXZpdHkgKiAwLjUsIDAuNSArIHZlbG9jaXR5U2Vuc2l0aXZpdHkgKiAwLjUgKVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSAwLjU7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGlmICggdHlwZW9mIGZyZXF1ZW5jeSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGFydFNpbmdsZSggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBlbHNlIGlmICggZnJlcXVlbmN5IGluc3RhbmNlb2YgTm90ZSApIHtcbiAgICAgICAgLy8gICAgIGZyZXEgPSBmcmVxdWVuY3kudmFsdWVIejtcbiAgICAgICAgLy8gICAgIHRoaXMuX3N0YXJ0U2luZ2xlKCBmcmVxLCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBlbHNlIGlmICggZnJlcXVlbmN5IGluc3RhbmNlb2YgQ2hvcmQgKSB7XG4gICAgICAgIC8vICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBmcmVxdWVuY3kubm90ZXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgIC8vICAgICAgICAgZnJlcSA9IGZyZXF1ZW5jeS5ub3Rlc1sgaSBdLnZhbHVlSHo7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5fc3RhcnRTaW5nbGUoIGZyZXEsIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG5cblxuICAgIF9zdG9wR2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5lbnZlbG9wZS5zdG9wKCBnZW5lcmF0b3JPYmplY3Qub3V0cHV0c1sgMCBdLmdhaW4sIGRlbGF5ICk7XG5cbiAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LnRpbWVyID0gc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBzZWxmLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0LnBvcCgpO1xuICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LnN0b3AoIGRlbGF5ICk7XG4gICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QuY2xlYW5VcCgpO1xuICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gbnVsbDtcbiAgICAgICAgfSwgZGVsYXkgKiAxMDAwICsgdGhpcy5lbnZlbG9wZS50b3RhbFN0b3BUaW1lICogMTAwMCArIDEwMCApO1xuICAgIH1cblxuICAgIF9zdG9wU2luZ2xlKCBmcmVxdWVuY3ksIHZlbG9jaXR5LCBkZWxheSApIHtcbiAgICAgICAgdmFyIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2ZldGNoR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3kgKTtcblxuICAgICAgICBpZiAoIGdlbmVyYXRvck9iamVjdCApIHtcbiAgICAgICAgICAgIC8vIFN0b3AgZ2VuZXJhdG9ycyBmb3JtZWQgd2hlbiB1bmlzb24gd2FzID4gMSBhdCB0aW1lIG9mIHN0YXJ0KC4uLilcbiAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggZ2VuZXJhdG9yT2JqZWN0ICkgKSB7XG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSBnZW5lcmF0b3JPYmplY3QubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BHZW5lcmF0b3JPYmplY3QoIGdlbmVyYXRvck9iamVjdFsgaSBdLCBkZWxheSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BHZW5lcmF0b3JPYmplY3QoIGdlbmVyYXRvck9iamVjdCwgZGVsYXkgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGdlbmVyYXRvck9iamVjdCA9IG51bGw7XG4gICAgfVxuXG4gICAgc3RvcCggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKSB7XG4gICAgICAgIHZlbG9jaXR5ID0gdHlwZW9mIHZlbG9jaXR5ID09PSAnbnVtYmVyJyA/IHZlbG9jaXR5IDogMDtcbiAgICAgICAgZGVsYXkgPSB0eXBlb2YgZGVsYXkgPT09ICdudW1iZXInID8gZGVsYXkgOiAwO1xuXG4gICAgICAgIGlmICggdHlwZW9mIGZyZXF1ZW5jeSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLl9zdG9wU2luZ2xlKCBmcmVxdWVuY3ksIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGVsc2UgaWYgKCBmcmVxdWVuY3kgaW5zdGFuY2VvZiBOb3RlICkge1xuICAgICAgICAvLyAgICAgZnJlcSA9IGZyZXF1ZW5jeS52YWx1ZUh6O1xuICAgICAgICAvLyAgICAgdGhpcy5fc3RvcFNpbmdsZSggZnJlcSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gZWxzZSBpZiAoIGZyZXF1ZW5jeSBpbnN0YW5jZW9mIENob3JkICkge1xuICAgICAgICAvLyAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgZnJlcXVlbmN5Lm5vdGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAvLyAgICAgICAgIGZyZXEgPSBmcmVxdWVuY3kubm90ZXNbIGkgXS52YWx1ZUh6O1xuICAgICAgICAvLyAgICAgICAgIHRoaXMuX3N0b3BTaW5nbGUoIGZyZXEsIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5cbi8vIEF1ZGlvSU8ubWl4aW5TaW5nbGUoIEdlbmVyYXRvclBsYXllci5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkdlbmVyYXRvclBsYXllci5wcm90b3R5cGUuTWF0aCA9IG1hdGg7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUdlbmVyYXRvclBsYXllciA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuICAgIHJldHVybiBuZXcgR2VuZXJhdG9yUGxheWVyKCB0aGlzLCBvcHRpb25zICk7XG59OyIsIndpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG5cbmltcG9ydCBBdWRpb0lPIGZyb20gJy4vY29yZS9BdWRpb0lPLmVzNic7XG5cbmltcG9ydCBOb2RlIGZyb20gJy4vY29yZS9Ob2RlLmVzNic7XG5pbXBvcnQgUGFyYW0gZnJvbSAnLi9jb3JlL1BhcmFtLmVzNic7XG5pbXBvcnQgJy4vY29yZS9XYXZlU2hhcGVyLmVzNic7XG5cblxuLy8gaW1wb3J0ICcuL2dyYXBocy9Dcm9zc2ZhZGVyLmVzNic7XG5cbmltcG9ydCAnLi9meC9EZWxheS5lczYnO1xuaW1wb3J0ICcuL2Z4L1BpbmdQb25nRGVsYXkuZXM2JztcblxuaW1wb3J0ICcuL2dlbmVyYXRvcnMvT3NjaWxsYXRvckdlbmVyYXRvci5lczYnO1xuaW1wb3J0ICcuL2luc3RydW1lbnRzL0dlbmVyYXRvclBsYXllci5lczYnO1xuXG5cbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9EZWdUb1JhZC5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L1Npbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L0Nvcy5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L1Rhbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L1JhZFRvRGVnLmVzNic7XG5cblxuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUby5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUb1plcm8uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhblplcm8uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0lmRWxzZS5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvTGVzc1RoYW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuWmVyby5lczYnO1xuXG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9Mb2dpY2FsT3BlcmF0b3IuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL0FORC5lczYnO1xuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvT1IuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL05PVC5lczYnO1xuXG5pbXBvcnQgJy4vbWF0aC9BYnMuZXM2JztcbmltcG9ydCAnLi9tYXRoL0FkZC5lczYnO1xuaW1wb3J0ICcuL21hdGgvQXZlcmFnZS5lczYnO1xuaW1wb3J0ICcuL21hdGgvQ2xhbXAuZXM2JztcbmltcG9ydCAnLi9tYXRoL0NvbnN0YW50LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9EaXZpZGUuZXM2JztcbmltcG9ydCAnLi9tYXRoL0Zsb29yLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9NYXguZXM2JztcbmltcG9ydCAnLi9tYXRoL01pbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvTXVsdGlwbHkuZXM2JztcbmltcG9ydCAnLi9tYXRoL05lZ2F0ZS5lczYnO1xuaW1wb3J0ICcuL21hdGgvUG93LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9SZWNpcHJvY2FsLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9Sb3VuZC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU2NhbGUuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NjYWxlRXhwLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TaWduLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TcXJ0LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TdWJ0cmFjdC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3dpdGNoLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TcXVhcmUuZXM2JztcblxuaW1wb3J0ICcuL21hdGgvTGVycC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU2FtcGxlRGVsYXkuZXM2JztcblxuaW1wb3J0ICcuL2VudmVsb3Blcy9DdXN0b21FbnZlbG9wZS5lczYnO1xuaW1wb3J0ICcuL2VudmVsb3Blcy9BU0RSRW52ZWxvcGUuZXM2JztcblxuaW1wb3J0ICcuL2dyYXBocy9FUVNoZWxmLmVzNic7XG5pbXBvcnQgJy4vZ3JhcGhzL0RpZmZ1c2VEZWxheS5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9Pc2NpbGxhdG9yQmFuay5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9Db3VudGVyLmVzNic7XG5pbXBvcnQgJy4vZ3JhcGhzL0RyeVdldE5vZGUuZXM2JztcbmltcG9ydCAnLi9ncmFwaHMvUGhhc2VPZmZzZXQuZXM2JztcbmltcG9ydCAnLi9ncmFwaHMvQ3Jvc3NmYWRlci5lczYnO1xuXG5pbXBvcnQgJy4vb3NjaWxsYXRvcnMvTm9pc2VPc2NpbGxhdG9yLmVzNic7XG5cbi8vIGltcG9ydCAnLi9ncmFwaHMvU2tldGNoLmVzNic7XG5cbndpbmRvdy5QYXJhbSA9IFBhcmFtO1xud2luZG93Lk5vZGUgPSBOb2RlOyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbnZhciBTSEFQRVJTID0ge307XG5cbmZ1bmN0aW9uIGdlbmVyYXRlU2hhcGVyQ3VydmUoIHNpemUgKSB7XG4gICAgdmFyIGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSggc2l6ZSApLFxuICAgICAgICBpID0gMCxcbiAgICAgICAgeCA9IDA7XG5cbiAgICBmb3IgKCBpOyBpIDwgc2l6ZTsgKytpICkge1xuICAgICAgICB4ID0gKCBpIC8gc2l6ZSApICogMiAtIDE7XG4gICAgICAgIGFycmF5WyBpIF0gPSBNYXRoLmFicyggeCApO1xuICAgIH1cblxuICAgIHJldHVybiBhcnJheTtcbn1cblxuY2xhc3MgQWJzIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIGFjY3VyYWN5ID0gMTAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIC8vIHZhciBnYWluQWNjdXJhY3kgPSBhY2N1cmFjeSAqIDEwMDtcbiAgICAgICAgdmFyIGdhaW5BY2N1cmFjeSA9IE1hdGgucG93KCBhY2N1cmFjeSwgMiApLFxuICAgICAgICAgICAgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCksXG4gICAgICAgICAgICBzaXplID0gMTAyNCAqIGFjY3VyYWN5O1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDEgLyBnYWluQWNjdXJhY3k7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSBnYWluQWNjdXJhY3k7XG5cbiAgICAgICAgLy8gVG8gc2F2ZSBjcmVhdGluZyBuZXcgc2hhcGVyIGN1cnZlcyAodGhhdCBjYW4gYmUgcXVpdGUgbGFyZ2UhKVxuICAgICAgICAvLyBlYWNoIHRpbWUgYW4gaW5zdGFuY2Ugb2YgQWJzIGlzIGNyZWF0ZWQsIHNoYXBlciBjdXJ2ZXNcbiAgICAgICAgLy8gYXJlIHN0b3JlZCBpbiB0aGUgU0hBUEVSUyBvYmplY3QgYWJvdmUuIFRoZSBrZXlzIHRvIHRoZVxuICAgICAgICAvLyBTSEFQRVJTIG9iamVjdCBhcmUgdGhlIGJhc2Ugd2F2ZXRhYmxlIGN1cnZlIHNpemUgKDEwMjQpXG4gICAgICAgIC8vIG11bHRpcGxpZWQgYnkgdGhlIGFjY3VyYWN5IGFyZ3VtZW50LlxuICAgICAgICBpZiggIVNIQVBFUlNbIHNpemUgXSApIHtcbiAgICAgICAgICAgIFNIQVBFUlNbIHNpemUgXSA9IGdlbmVyYXRlU2hhcGVyQ3VydmUoIHNpemUgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggU0hBUEVSU1sgc2l6ZSBdICk7XG5cblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQWJzID0gZnVuY3Rpb24oIGFjY3VyYWN5ICkge1xuICAgIHJldHVybiBuZXcgQWJzKCB0aGlzLCBhY2N1cmFjeSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIEFkZHMgdHdvIGF1ZGlvIHNpZ25hbHMgdG9nZXRoZXIuXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqXG4gKiB2YXIgYWRkID0gaW8uY3JlYXRlQWRkKCAyICk7XG4gKiBpbjEuY29ubmVjdCggYWRkICk7XG4gKlxuICogdmFyIGFkZCA9IGlvLmNyZWF0ZUFkZCgpO1xuICogaW4xLmNvbm5lY3QoIGFkZCwgMCwgMCApO1xuICogaW4yLmNvbm5lY3QoIGFkZCwgMCwgMSApO1xuICovXG5jbGFzcyBBZGQgZXh0ZW5kcyBOb2Rle1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIFN0b3JlIGNvbnRyb2xsYWJsZSBwYXJhbXMuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICBcdHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgIFx0dGhpcy5jb250cm9scy52YWx1ZS52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBZGQgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBBZGQoIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuLypcbiAgICBUaGUgYXZlcmFnZSB2YWx1ZSBvZiBhIHNpZ25hbCBpcyBjYWxjdWxhdGVkXG4gICAgYnkgcGlwaW5nIHRoZSBpbnB1dCBpbnRvIGEgcmVjdGlmaWVyIHRoZW4gaW50b1xuICAgIGEgc2VyaWVzIG9mIERlbGF5Tm9kZXMuIEVhY2ggRGVsYXlOb2RlXG4gICAgaGFzIGl0J3MgYGRlbGF5VGltZWAgY29udHJvbGxlZCBieSBlaXRoZXIgdGhlXG4gICAgYHNhbXBsZVNpemVgIGFyZ3VtZW50IG9yIHRoZSBpbmNvbWluZyB2YWx1ZSBvZlxuICAgIHRoZSBgY29udHJvbHMuc2FtcGxlU2l6ZWAgbm9kZS4gVGhlIGRlbGF5VGltZVxuICAgIGlzIHRoZXJlZm9yZSBtZWFzdXJlZCBpbiBzYW1wbGVzLlxuXG4gICAgRWFjaCBkZWxheSBpcyBjb25uZWN0ZWQgdG8gYSBHYWluTm9kZSB0aGF0IHdvcmtzXG4gICAgYXMgYSBzdW1taW5nIG5vZGUuIFRoZSBzdW1taW5nIG5vZGUncyB2YWx1ZSBpc1xuICAgIHRoZW4gZGl2aWRlZCBieSB0aGUgbnVtYmVyIG9mIGRlbGF5cyB1c2VkIGJlZm9yZVxuICAgIGJlaW5nIHNlbnQgb24gaXRzIG1lcnJ5IHdheSB0byB0aGUgb3V0cHV0LlxuXG4gICAgTm90ZTpcbiAgICBIaWdoIHZhbHVlcyBmb3IgYG51bVNhbXBsZXNgIHdpbGwgYmUgZXhwZW5zaXZlLFxuICAgIGFzIHRoYXQgbWFueSBEZWxheU5vZGVzIHdpbGwgYmUgY3JlYXRlZC4gQ29uc2lkZXJcbiAgICBpbmNyZWFzaW5nIHRoZSBgc2FtcGxlU2l6ZWAgYW5kIHVzaW5nIGEgbG93IHZhbHVlXG4gICAgZm9yIGBudW1TYW1wbGVzYC5cblxuICAgIEdyYXBoOlxuICAgID09PT09PVxuICAgIGlucHV0IC0+XG4gICAgICAgIGFicy9yZWN0aWZ5IC0+XG4gICAgICAgICAgICBgbnVtU2FtcGxlc2AgbnVtYmVyIG9mIGRlbGF5cywgaW4gc2VyaWVzIC0+XG4gICAgICAgICAgICAgICAgc3VtIC0+XG4gICAgICAgICAgICAgICAgICAgIGRpdmlkZSBieSBgbnVtU2FtcGxlc2AgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5cbiAqL1xuY2xhc3MgQXZlcmFnZSBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1TYW1wbGVzID0gMTAsIHNhbXBsZVNpemUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5udW1TYW1wbGVzID0gbnVtU2FtcGxlcztcblxuICAgICAgICAvLyBBbGwgRGVsYXlOb2RlcyB3aWxsIGJlIHN0b3JlZCBoZXJlLlxuICAgICAgICBncmFwaC5kZWxheXMgPSBbXTtcbiAgICAgICAgZ3JhcGguYWJzID0gdGhpcy5pby5jcmVhdGVBYnMoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5hYnMgKTtcbiAgICAgICAgZ3JhcGguc2FtcGxlU2l6ZSA9IHRoaXMuaW8uY3JlYXRlQ29uc3RhbnQoIDEgLyB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSApO1xuICAgICAgICBncmFwaC5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5zYW1wbGVTaXplID0gdGhpcy5pby5jcmVhdGVQYXJhbSggc2FtcGxlU2l6ZSApO1xuICAgICAgICBncmFwaC5zYW1wbGVTaXplLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuc2FtcGxlU2l6ZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIC8vIFRoaXMgaXMgYSByZWxhdGl2ZWx5IGV4cGVuc2l2ZSBjYWxjdWxhdGlvblxuICAgICAgICAvLyB3aGVuIGNvbXBhcmVkIHRvIGRvaW5nIGEgbXVjaCBzaW1wbGVyIHJlY2lwcm9jYWwgbXVsdGlwbHkuXG4gICAgICAgIC8vIHRoaXMuZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoIG51bVNhbXBsZXMsIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlICogMC41ICk7XG5cbiAgICAgICAgLy8gQXZvaWQgdGhlIG1vcmUgZXhwZW5zaXZlIGRpdmlzaW9uIGFib3ZlIGJ5XG4gICAgICAgIC8vIG11bHRpcGx5aW5nIHRoZSBzdW0gYnkgdGhlIHJlY2lwcm9jYWwgb2YgbnVtU2FtcGxlcy5cbiAgICAgICAgZ3JhcGguZGl2aWRlID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggMSAvIG51bVNhbXBsZXMgKTtcbiAgICAgICAgZ3JhcGguc3VtID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICBncmFwaC5zdW0uY29ubmVjdCggZ3JhcGguZGl2aWRlICk7XG4gICAgICAgIGdyYXBoLmRpdmlkZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG5cblxuICAgICAgICAvLyBUcmlnZ2VyIHRoZSBzZXR0ZXIgZm9yIGBudW1TYW1wbGVzYCB0aGF0IHdpbGwgY3JlYXRlXG4gICAgICAgIC8vIHRoZSBkZWxheSBzZXJpZXMuXG4gICAgICAgIHRoaXMubnVtU2FtcGxlcyA9IGdyYXBoLm51bVNhbXBsZXM7XG4gICAgfVxuXG4gICAgZ2V0IG51bVNhbXBsZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkubnVtU2FtcGxlcztcbiAgICB9XG5cbiAgICBzZXQgbnVtU2FtcGxlcyggbnVtU2FtcGxlcyApIHtcbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpLFxuICAgICAgICAgICAgZGVsYXlzID0gZ3JhcGguZGVsYXlzO1xuXG4gICAgICAgIC8vIERpc2Nvbm5lY3QgYW5kIG51bGxpZnkgYW55IGV4aXN0aW5nIGRlbGF5IG5vZGVzLlxuICAgICAgICB0aGlzLl9jbGVhblVwU2luZ2xlKCBkZWxheXMgKTtcblxuICAgICAgICBncmFwaC5udW1TYW1wbGVzID0gbnVtU2FtcGxlcztcbiAgICAgICAgZ3JhcGguZGl2aWRlLnZhbHVlID0gMSAvIG51bVNhbXBsZXM7XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDAsIG5vZGUgPSBncmFwaC5hYnM7IGkgPCBudW1TYW1wbGVzOyArK2kgKSB7XG4gICAgICAgICAgICB2YXIgZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgICAgIGRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgICAgICBncmFwaC5tdWx0aXBseS5jb25uZWN0KCBkZWxheS5kZWxheVRpbWUgKTtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdCggZGVsYXkgKTtcbiAgICAgICAgICAgIGRlbGF5LmNvbm5lY3QoIGdyYXBoLnN1bSApO1xuICAgICAgICAgICAgZ3JhcGguZGVsYXlzLnB1c2goIGRlbGF5ICk7XG4gICAgICAgICAgICBub2RlID0gZGVsYXk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQXZlcmFnZSA9IGZ1bmN0aW9uKCBudW1TYW1wbGVzLCBzYW1wbGVTaXplICkge1xuICAgIHJldHVybiBuZXcgQXZlcmFnZSggdGhpcywgbnVtU2FtcGxlcywgc2FtcGxlU2l6ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbmNsYXNzIENsYW1wIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBtaW5WYWx1ZSwgbWF4VmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApOyAvLyBpbywgMSwgMVxuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5taW4gPSB0aGlzLmlvLmNyZWF0ZU1pbiggbWF4VmFsdWUgKTtcbiAgICAgICAgZ3JhcGgubWF4ID0gdGhpcy5pby5jcmVhdGVNYXgoIG1pblZhbHVlICk7XG5cbiAgICAgICAgLy8gdGhpcy5pbnB1dHMgPSBbIGdyYXBoLm1pbiBdO1xuICAgICAgICAvLyB0aGlzLm91dHB1dHMgPSBbIGdyYXBoLm1heCBdO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm1pbiApO1xuICAgICAgICBncmFwaC5taW4uY29ubmVjdCggZ3JhcGgubWF4ICk7XG4gICAgICAgIGdyYXBoLm1heC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIFN0b3JlIGNvbnRyb2xsYWJsZSBwYXJhbXMuXG4gICAgICAgIHRoaXMuY29udHJvbHMubWluID0gZ3JhcGgubWluLmNvbnRyb2xzLnZhbHVlO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLm1heCA9IGdyYXBoLm1heC5jb250cm9scy52YWx1ZTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCBtaW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkubWF4LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbWluKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLm1heC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBtYXgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkubWluLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbWF4KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLm1pbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNsYW1wID0gZnVuY3Rpb24oIG1pblZhbHVlLCBtYXhWYWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IENsYW1wKCB0aGlzLCBtaW5WYWx1ZSwgbWF4VmFsdWUgKTtcbn07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSAnLi4vY29yZS9BdWRpb0lPLmVzNic7XG5pbXBvcnQgTm9kZSBmcm9tICcuLi9jb3JlL05vZGUuZXM2JztcblxuY2xhc3MgQ29uc3RhbnQgZXh0ZW5kcyBOb2RlIHtcbiAgICAvKipcbiAgICAgKiBBIGNvbnN0YW50LXJhdGUgYXVkaW8gc2lnbmFsXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvICAgIEluc3RhbmNlIG9mIEF1ZGlvSU9cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgVmFsdWUgb2YgdGhlIGNvbnN0YW50XG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSA9IDAuMCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgPyB2YWx1ZSA6IDA7XG4gICAgICAgIHRoaXMuaW8uY29uc3RhbnREcml2ZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudCA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IENvbnN0YW50KCB0aGlzLCB2YWx1ZSApO1xufTtcblxuXG4vLyBBIGJ1bmNoIG9mIHByZXNldCBjb25zdGFudHMuXG4oZnVuY3Rpb24oKSB7XG4gICAgdmFyIEUsXG4gICAgICAgIFBJLFxuICAgICAgICBQSTIsXG4gICAgICAgIExOMTAsXG4gICAgICAgIExOMixcbiAgICAgICAgTE9HMTBFLFxuICAgICAgICBMT0cyRSxcbiAgICAgICAgU1FSVDFfMixcbiAgICAgICAgU1FSVDI7XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudEUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBFIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguRSApO1xuICAgICAgICBFID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50UEkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBQSSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLlBJICk7XG4gICAgICAgIFBJID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50UEkyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gUEkyIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguUEkgKiAyICk7XG4gICAgICAgIFBJMiA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudExOMTAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBMTjEwIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguTE4xMCApO1xuICAgICAgICBMTjEwID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50TE4yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gTE4yIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguTE4yICk7XG4gICAgICAgIExOMiA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudExPRzEwRSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IExPRzEwRSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxPRzEwRSApO1xuICAgICAgICBMT0cxMEUgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRMT0cyRSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IExPRzJFIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguTE9HMkUgKTtcbiAgICAgICAgTE9HMkUgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRTUVJUMV8yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gU1FSVDFfMiB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLlNRUlQxXzIgKTtcbiAgICAgICAgU1FSVDFfMiA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudFNRUlQyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gU1FSVDIgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5TUVJUMiApO1xuICAgICAgICBTUVJUMiA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG59KCkpOyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogRGl2aWRlcyB0d28gbnVtYmVyc1xuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKi9cbmNsYXNzIERpdmlkZSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUsIG1heElucHV0ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cblxuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDAuMDtcblxuICAgICAgICBncmFwaC5yZWNpcHJvY2FsID0gdGhpcy5pby5jcmVhdGVSZWNpcHJvY2FsKCBtYXhJbnB1dCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLnJlY2lwcm9jYWwgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIGdyYXBoLnJlY2lwcm9jYWwuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZGl2aXNvciA9IHRoaXMuaW5wdXRzWyAxIF07XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlucHV0c1sgMSBdLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IG1heElucHV0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWNpcHJvY2FsLm1heElucHV0O1xuICAgIH1cbiAgICBzZXQgbWF4SW5wdXQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLnJlY2lwcm9jYWwubWF4SW5wdXQgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZURpdmlkZSA9IGZ1bmN0aW9uKCB2YWx1ZSwgbWF4SW5wdXQgKSB7XG4gICAgcmV0dXJuIG5ldyBEaXZpZGUoIHRoaXMsIHZhbHVlLCBtYXhJbnB1dCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbi8vIE5PVEU6XG4vLyAgT25seSBhY2NlcHRzIHZhbHVlcyA+PSAtMSAmJiA8PSAxLiBWYWx1ZXMgb3V0c2lkZVxuLy8gIHRoaXMgcmFuZ2UgYXJlIGNsYW1wZWQgdG8gdGhpcyByYW5nZS5cbmNsYXNzIEZsb29yIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5GbG9vciApO1xuXG4gICAgICAgIC8vIFRoaXMgYnJhbmNoaW5nIGlzIGJlY2F1c2UgaW5wdXR0aW5nIGAwYCB2YWx1ZXNcbiAgICAgICAgLy8gaW50byB0aGUgd2F2ZXNoYXBlciBhYm92ZSBvdXRwdXRzIC0wLjUgOyhcbiAgICAgICAgZ3JhcGguaWZFbHNlID0gdGhpcy5pby5jcmVhdGVJZkVsc2UoKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUb1plcm8gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG9aZXJvKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5lcXVhbFRvWmVybyApO1xuICAgICAgICBncmFwaC5lcXVhbFRvWmVyby5jb25uZWN0KCBncmFwaC5pZkVsc2UuaWYgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5pZkVsc2UudGhlbiApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggZ3JhcGguaWZFbHNlLmVsc2UgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5pZkVsc2UuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRmxvb3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEZsb29yKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIExlcnAgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgc3RhcnQsIGVuZCwgZGVsdGEgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMywgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5hZGQgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICBncmFwaC5zdWJ0cmFjdCA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG5cbiAgICAgICAgZ3JhcGguc3RhcnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBzdGFydCApO1xuICAgICAgICBncmFwaC5lbmQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBlbmQgKTtcbiAgICAgICAgZ3JhcGguZGVsdGEgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBkZWx0YSApO1xuXG4gICAgICAgIGdyYXBoLmVuZC5jb25uZWN0KCBncmFwaC5zdWJ0cmFjdCwgMCwgMCApO1xuICAgICAgICBncmFwaC5zdGFydC5jb25uZWN0KCBncmFwaC5zdWJ0cmFjdCwgMCwgMSApO1xuICAgICAgICBncmFwaC5zdWJ0cmFjdC5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICBncmFwaC5kZWx0YS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLnN0YXJ0LmNvbm5lY3QoIGdyYXBoLmFkZCwgMCwgMCApO1xuICAgICAgICBncmFwaC5tdWx0aXBseS5jb25uZWN0KCBncmFwaC5hZGQsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5hZGQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnN0YXJ0ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGguZW5kICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAyIF0uY29ubmVjdCggZ3JhcGguZGVsdGEgKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnN0YXJ0ID0gZ3JhcGguc3RhcnQ7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZW5kID0gZ3JhcGguZW5kO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRlbHRhID0gZ3JhcGguZGVsdGE7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgc3RhcnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkuc3RhcnQudmFsdWU7XG4gICAgfVxuICAgIHNldCBzdGFydCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuZ2V0R3JhcGgoKS5zdGFydC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBlbmQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkuZW5kLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgZW5kKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLmVuZC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBkZWx0YSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JhcGgoKS5kZWx0YS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGRlbHRhKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5nZXRHcmFwaCgpLmRlbHRhLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVMZXJwID0gZnVuY3Rpb24oIHN0YXJ0LCBlbmQsIGRlbHRhICkge1xuICAgIHJldHVybiBuZXcgTGVycCggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIFdoZW4gaW5wdXQgaXMgPCBgdmFsdWVgLCBvdXRwdXRzIGB2YWx1ZWAsIG90aGVyd2lzZSBvdXRwdXRzIGlucHV0LlxuICogQHBhcmFtIHtBdWRpb0lPfSBpbyAgIEF1ZGlvSU8gaW5zdGFuY2VcbiAqIEBwYXJhbSB7TnVtYmVyfSB2YWx1ZSBUaGUgbWluaW11bSB2YWx1ZSB0byB0ZXN0IGFnYWluc3QuXG4gKi9cblxuY2xhc3MgTWF4IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhbigpO1xuICAgICAgICBncmFwaC5zd2l0Y2ggPSB0aGlzLmlvLmNyZWF0ZVN3aXRjaCggMiwgMCApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5ncmVhdGVyVGhhbiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmdyZWF0ZXJUaGFuLmNvbnRyb2xzLnZhbHVlICk7XG5cblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnN3aXRjaC5pbnB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLnN3aXRjaC5pbnB1dHNbIDEgXSApO1xuICAgICAgICBncmFwaC5ncmVhdGVyVGhhbi5jb25uZWN0KCBncmFwaC5zd2l0Y2guY29udHJvbCApO1xuICAgICAgICBncmFwaC5zd2l0Y2guY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU1heCA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IE1heCggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBXaGVuIGlucHV0IGlzID4gYHZhbHVlYCwgb3V0cHV0cyBgdmFsdWVgLCBvdGhlcndpc2Ugb3V0cHV0cyBpbnB1dC5cbiAqIEBwYXJhbSB7QXVkaW9JT30gaW8gICBBdWRpb0lPIGluc3RhbmNlXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgVGhlIG1pbmltdW0gdmFsdWUgdG8gdGVzdCBhZ2FpbnN0LlxuICovXG5jbGFzcyBNaW4gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubGVzc1RoYW4gPSB0aGlzLmlvLmNyZWF0ZUxlc3NUaGFuKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5sZXNzVGhhbiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmxlc3NUaGFuLmNvbnRyb2xzLnZhbHVlICk7XG5cbiAgICAgICAgZ3JhcGguc3dpdGNoID0gdGhpcy5pby5jcmVhdGVTd2l0Y2goIDIsIDAgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnN3aXRjaC5pbnB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLnN3aXRjaC5pbnB1dHNbIDEgXSApO1xuICAgICAgICBncmFwaC5sZXNzVGhhbi5jb25uZWN0KCBncmFwaC5zd2l0Y2guY29udHJvbCApO1xuICAgICAgICBncmFwaC5zd2l0Y2guY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTWluID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgTWluKCB0aGlzLCB2YWx1ZSApO1xufTsiLCIgaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byBhdWRpbyBzaWduYWxzIHRvZ2V0aGVyLlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKi9cbmNsYXNzIE11bHRpcGx5IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSAwLjA7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU11bHRpcGx5ID0gZnVuY3Rpb24oIHZhbHVlMSwgdmFsdWUyICkge1xuICAgIHJldHVybiBuZXcgTXVsdGlwbHkoIHRoaXMsIHZhbHVlMSwgdmFsdWUyICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogTmVnYXRlcyB0aGUgaW5jb21pbmcgYXVkaW8gc2lnbmFsLlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKi9cbmNsYXNzIE5lZ2F0ZSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAwICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gLTE7XG4gICAgICAgIHRoaXMub3V0cHV0cyA9IHRoaXMuaW5wdXRzO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOZWdhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE5lZ2F0ZSggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICpcbiAqIE5vdGU6IERPRVMgTk9UIEhBTkRMRSBORUdBVElWRSBQT1dFUlMuXG4gKi9cbmNsYXNzIFBvdyBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBsaWVycyA9IFtdO1xuICAgICAgICBncmFwaC52YWx1ZSA9IHZhbHVlO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgbm9kZSA9IHRoaXMuaW5wdXRzWyAwIF07IGkgPCB2YWx1ZSAtIDE7ICsraSApIHtcbiAgICAgICAgICAgIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGxpZXJzWyBpIF0uY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdCggZ3JhcGgubXVsdGlwbGllcnNbIGkgXSApO1xuICAgICAgICAgICAgbm9kZSA9IGdyYXBoLm11bHRpcGxpZXJzWyBpIF07XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLmdldEdyYXBoKCkudmFsdWUgPSBudWxsO1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JhcGgoKS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZGlzY29ubmVjdCggZ3JhcGgubXVsdGlwbGllcnNbIDAgXSApO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gZ3JhcGgubXVsdGlwbGllcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICAgICAgICBncmFwaC5tdWx0aXBsaWVyc1sgaSBdLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIGdyYXBoLm11bHRpcGxpZXJzLnNwbGljZSggaSwgMSApO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBub2RlID0gdGhpcy5pbnB1dHNbIDAgXTsgaSA8IHZhbHVlIC0gMTsgKytpICkge1xuICAgICAgICAgICAgZ3JhcGgubXVsdGlwbGllcnNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbGllcnNbIGkgXS5jb250cm9scy52YWx1ZSApO1xuICAgICAgICAgICAgbm9kZS5jb25uZWN0KCBncmFwaC5tdWx0aXBsaWVyc1sgaSBdICk7XG4gICAgICAgICAgICBub2RlID0gZ3JhcGgubXVsdGlwbGllcnNbIGkgXTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICBncmFwaC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUG93ID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgUG93KCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIE91dHB1dHMgdGhlIHZhbHVlIG9mIDEgLyBpbnB1dFZhbHVlIChvciBwb3coaW5wdXRWYWx1ZSwgLTEpKVxuICogV2lsbCBiZSB1c2VmdWwgZm9yIGRvaW5nIG11bHRpcGxpY2F0aXZlIGRpdmlzaW9uLlxuICpcbiAqIFRPRE86XG4gKiAgICAgLSBUaGUgd2F2ZXNoYXBlciBpc24ndCBhY2N1cmF0ZS4gSXQgcHVtcHMgb3V0IHZhbHVlcyBkaWZmZXJpbmdcbiAqICAgICAgIGJ5IDEuNzkwNjc5MzE0MDMwMTUyNWUtOSBvciBtb3JlLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBSZWNpcHJvY2FsIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBtYXhJbnB1dCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGZhY3RvciA9IG1heElucHV0IHx8IDEwMCxcbiAgICAgICAgICAgIGdhaW4gPSBNYXRoLnBvdyggZmFjdG9yLCAtMSApLFxuICAgICAgICAgICAgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubWF4SW5wdXQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICBncmFwaC5tYXhJbnB1dC5nYWluLnNldFZhbHVlQXRUaW1lKCBnYWluLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcblxuICAgICAgICAvLyB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnNldFZhbHVlQXRUaW1lKCAwLjAsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuUmVjaXByb2NhbCApO1xuXG4gICAgICAgIC8vIHRoaXMub3V0cHV0c1sgMCBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi5zZXRWYWx1ZUF0VGltZSggMC4wLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcblxuICAgICAgICB0aGlzLmlvLmNvbnN0YW50RHJpdmVyLmNvbm5lY3QoIGdyYXBoLm1heElucHV0ICk7XG4gICAgICAgIGdyYXBoLm1heElucHV0LmNvbm5lY3QoIHRoaXMuaW5wdXRzWyAwIF0uZ2FpbiApO1xuICAgICAgICBncmFwaC5tYXhJbnB1dC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXS5nYWluICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgbWF4SW5wdXQoKSB7XG4gICAgICAgIHJldHVybiBncmFwaC5tYXhJbnB1dC5nYWluO1xuICAgIH1cbiAgICBzZXQgbWF4SW5wdXQoIHZhbHVlICkge1xuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgaWYgKCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgZ3JhcGgubWF4SW5wdXQuZ2Fpbi5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgICAgICAgICAgZ3JhcGgubWF4SW5wdXQuZ2Fpbi5zZXRWYWx1ZUF0VGltZSggMSAvIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUmVjaXByb2NhbCA9IGZ1bmN0aW9uKCBtYXhJbnB1dCApIHtcbiAgICByZXR1cm4gbmV3IFJlY2lwcm9jYWwoIHRoaXMsIG1heElucHV0ICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIE5PVEU6XG4vLyAgT25seSBhY2NlcHRzIHZhbHVlcyA+PSAtMSAmJiA8PSAxLiBWYWx1ZXMgb3V0c2lkZVxuLy8gIHRoaXMgcmFuZ2UgYXJlIGNsYW1wZWQgdG8gdGhpcyByYW5nZS5cbmNsYXNzIFJvdW5kIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguZmxvb3IgPSB0aGlzLmlvLmNyZWF0ZUZsb29yKCk7XG4gICAgICAgIGdyYXBoLmFkZCA9IHRoaXMuaW8uY3JlYXRlQWRkKCAwLjUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbMF0uY29ubmVjdCggZ3JhcGguYWRkICk7XG4gICAgICAgIGdyYXBoLmFkZC5jb25uZWN0KCBncmFwaC5mbG9vciApO1xuICAgICAgICBncmFwaC5mbG9vci5jb25uZWN0KCB0aGlzLm91dHB1dHNbMF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUm91bmQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFJvdW5kKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuY2xhc3MgU2FtcGxlRGVsYXkgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtU2FtcGxlcyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnNhbXBsZVNpemUgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuc2FtcGxlcyA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIG51bVNhbXBsZXMgKTtcblxuICAgICAgICBncmFwaC5zYW1wbGVTaXplLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuc2FtcGxlcy5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLmRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIGdyYXBoLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5LmNvbm5lY3QoIGdyYXBoLmRlbGF5LmRlbGF5VGltZSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmRlbGF5ICk7XG4gICAgICAgIGdyYXBoLmRlbGF5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgc2FtcGxlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuc2FtcGxlcy52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHNhbXBsZXMoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnNhbXBsZXMudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNhbXBsZURlbGF5ID0gZnVuY3Rpb24oIG51bVNhbXBsZXMgKSB7XG4gICAgcmV0dXJuIG5ldyBTYW1wbGVEZWxheSggdGhpcywgbnVtU2FtcGxlcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBHaXZlbiBhbiBpbnB1dCB2YWx1ZSBhbmQgaXRzIGhpZ2ggYW5kIGxvdyBib3VuZHMsIHNjYWxlXG4vLyB0aGF0IHZhbHVlIHRvIG5ldyBoaWdoIGFuZCBsb3cgYm91bmRzLlxuLy9cbi8vIEZvcm11bGEgZnJvbSBNYXhNU1AncyBTY2FsZSBvYmplY3Q6XG4vLyAgaHR0cDovL3d3dy5jeWNsaW5nNzQuY29tL2ZvcnVtcy90b3BpYy5waHA/aWQ9MjY1OTNcbi8vXG4vLyAoKGlucHV0LWxvd0luKSAvIChoaWdoSW4tbG93SW4pKSAqIChoaWdoT3V0LWxvd091dCkgKyBsb3dPdXQ7XG5cblxuLy8gVE9ETzpcbi8vICAtIEFkZCBjb250cm9scyFcbmNsYXNzIFNjYWxlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93SW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoSW4gKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dPdXQgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaE91dCApO1xuXG5cbiAgICAgICAgLy8gKGlucHV0LWxvd0luKVxuICAgICAgICBncmFwaC5pbnB1dE1pbnVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguaW5wdXRNaW51c0xvd0luLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4uY29ubmVjdCggZ3JhcGguaW5wdXRNaW51c0xvd0luLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hJbi1sb3dJbilcbiAgICAgICAgZ3JhcGguaGlnaEluTWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4uY29ubmVjdCggZ3JhcGguaGlnaEluTWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoKGlucHV0LWxvd0luKSAvIChoaWdoSW4tbG93SW4pKVxuICAgICAgICBncmFwaC5kaXZpZGUgPSB0aGlzLmlvLmNyZWF0ZURpdmlkZSgpO1xuICAgICAgICBncmFwaC5pbnB1dE1pbnVzTG93SW4uY29ubmVjdCggZ3JhcGguZGl2aWRlLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4uY29ubmVjdCggZ3JhcGguZGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hPdXQtbG93T3V0KVxuICAgICAgICBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQgPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaE91dC5jb25uZWN0KCBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSkgKiAoaGlnaE91dC1sb3dPdXQpXG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSkgKiAoaGlnaE91dC1sb3dPdXQpICsgbG93T3V0XG4gICAgICAgIGdyYXBoLmFkZCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5LmNvbm5lY3QoIGdyYXBoLmFkZCwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5hZGQsIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5hZGQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldCBsb3dJbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMubG93SW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBsb3dJbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgaGlnaEluKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5oaWdoSW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoSW4oIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hJbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBsb3dPdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmxvd091dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd091dCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93T3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGhpZ2hPdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQudmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoT3V0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNjYWxlID0gZnVuY3Rpb24oIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCApIHtcbiAgICByZXR1cm4gbmV3IFNjYWxlKCB0aGlzLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gR2l2ZW4gYW4gaW5wdXQgdmFsdWUgYW5kIGl0cyBoaWdoIGFuZCBsb3cgYm91bmRzLCBzY2FsZVxuLy8gdGhhdCB2YWx1ZSB0byBuZXcgaGlnaCBhbmQgbG93IGJvdW5kcy5cbi8vXG4vLyBGb3JtdWxhIGZyb20gTWF4TVNQJ3MgU2NhbGUgb2JqZWN0OlxuLy8gIGh0dHA6Ly93d3cuY3ljbGluZzc0LmNvbS9mb3J1bXMvdG9waWMucGhwP2lkPTI2NTkzXG4vL1xuLy8gaWYoIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikgPT09IDAgKSB7XG4vLyAgICAgcmV0dXJuIGxvd091dDtcbi8vIH1cbi8vIGVsc2UgaWYoIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikgPiAwICkge1xuLy8gICAgIHJldHVybiBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiBNYXRoLnBvdyggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKTtcbi8vIH1cbi8vIGVsc2Uge1xuLy8gICAgIHJldHVybiBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiAtKE1hdGgucG93KCAoLWlucHV0ICsgbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKSk7XG4vLyB9XG5cbi8vIFRPRE86XG4vLyAgLSBBZGQgY29udHJvbHNcbmNsYXNzIFNjYWxlRXhwIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQsIGV4cG9uZW50ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgLy8gbG93SW4gPSB0eXBlb2YgbG93SW4gPT09ICdudW1iZXInID8gbG93SW4gOiAwO1xuICAgICAgICAvLyBoaWdoSW4gPSB0eXBlb2YgaGlnaEluID09PSAnbnVtYmVyJyA/IGhpZ2hJbiA6IDE7XG4gICAgICAgIC8vIGxvd091dCA9IHR5cGVvZiBsb3dPdXQgPT09ICdudW1iZXInID8gbG93T3V0IDogMDtcbiAgICAgICAgLy8gaGlnaE91dCA9IHR5cGVvZiBoaWdoT3V0ID09PSAnbnVtYmVyJyA/IGhpZ2hPdXQgOiAxMDtcbiAgICAgICAgLy8gZXhwb25lbnQgPSB0eXBlb2YgZXhwb25lbnQgPT09ICdudW1iZXInID8gZXhwb25lbnQgOiAxO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dJbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hJbiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hJbiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd091dCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoT3V0ICk7XG4gICAgICAgIGdyYXBoLl9leHBvbmVudCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGV4cG9uZW50ICk7XG5cblxuICAgICAgICAvLyAoaW5wdXQgLSBsb3dJbilcbiAgICAgICAgZ3JhcGguaW5wdXRNaW51c0xvd0luID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLmlucHV0TWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLmlucHV0TWludXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vICgtaW5wdXQgKyBsb3dJbilcbiAgICAgICAgZ3JhcGgubWludXNJbnB1dCA9IHRoaXMuaW8uY3JlYXRlTmVnYXRlKCk7XG4gICAgICAgIGdyYXBoLm1pbnVzSW5wdXRQbHVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm1pbnVzSW5wdXQgKTtcbiAgICAgICAgZ3JhcGgubWludXNJbnB1dC5jb25uZWN0KCBncmFwaC5taW51c0lucHV0UGx1c0xvd0luLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93SW4uY29ubmVjdCggZ3JhcGgubWludXNJbnB1dFBsdXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vIChoaWdoSW4gLSBsb3dJbilcbiAgICAgICAgZ3JhcGguaGlnaEluTWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoSW4uY29ubmVjdCggZ3JhcGguaGlnaEluTWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd0luLmNvbm5lY3QoIGdyYXBoLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSlcbiAgICAgICAgZ3JhcGguZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgZ3JhcGguaW5wdXRNaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5oaWdoSW5NaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIC8vICgtaW5wdXQgKyBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pXG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlRGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgZ3JhcGgubWludXNJbnB1dFBsdXNMb3dJbi5jb25uZWN0KCBncmFwaC5uZWdhdGl2ZURpdmlkZSwgMCwgMCApO1xuICAgICAgICBncmFwaC5oaWdoSW5NaW51c0xvd0luLmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlRGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hPdXQgLSBsb3dPdXQpXG4gICAgICAgIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dCA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5oaWdoT3V0LmNvbm5lY3QoIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dCwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5oaWdoT3V0TWludXNMb3dPdXQsIDAsIDEgKTtcblxuICAgICAgICAvLyBNYXRoLnBvdyggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKVxuICAgICAgICBncmFwaC5wb3cgPSB0aGlzLmlvLmNyZWF0ZVBvdyggZXhwb25lbnQgKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlLmNvbm5lY3QoIGdyYXBoLnBvdyApO1xuXG4gICAgICAgIC8vIC0oTWF0aC5wb3coICgtaW5wdXQgKyBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApKVxuICAgICAgICBncmFwaC5uZWdhdGl2ZVBvd05lZ2F0ZSA9IHRoaXMuaW8uY3JlYXRlTmVnYXRlKCk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlUG93ID0gdGhpcy5pby5jcmVhdGVQb3coIGV4cG9uZW50ICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlRGl2aWRlLmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlUG93ICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0aXZlUG93LmNvbm5lY3QoIGdyYXBoLm5lZ2F0aXZlUG93TmVnYXRlICk7XG5cblxuICAgICAgICAvLyBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiBNYXRoLnBvdyggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKTtcbiAgICAgICAgZ3JhcGguZWxzZUlmQnJhbmNoID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgZ3JhcGguZWxzZUlmTXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLmhpZ2hPdXRNaW51c0xvd091dC5jb25uZWN0KCBncmFwaC5lbHNlSWZNdWx0aXBseSwgMCwgMCApO1xuICAgICAgICBncmFwaC5wb3cuY29ubmVjdCggZ3JhcGguZWxzZUlmTXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguZWxzZUlmQnJhbmNoLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmVsc2VJZk11bHRpcGx5LmNvbm5lY3QoIGdyYXBoLmVsc2VJZkJyYW5jaCwgMCwgMSApO1xuXG4gICAgICAgIC8vIGxvd091dCArIChoaWdoT3V0IC0gbG93T3V0KSAqIC0oTWF0aC5wb3coICgtaW5wdXQgKyBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApKTtcbiAgICAgICAgZ3JhcGguZWxzZUJyYW5jaCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIGdyYXBoLmVsc2VNdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGguaGlnaE91dE1pbnVzTG93T3V0LmNvbm5lY3QoIGdyYXBoLmVsc2VNdWx0aXBseSwgMCwgMCApO1xuICAgICAgICBncmFwaC5uZWdhdGl2ZVBvd05lZ2F0ZS5jb25uZWN0KCBncmFwaC5lbHNlTXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQuY29ubmVjdCggZ3JhcGguZWxzZUJyYW5jaCwgMCwgMCApO1xuICAgICAgICBncmFwaC5lbHNlTXVsdGlwbHkuY29ubmVjdCggZ3JhcGguZWxzZUJyYW5jaCwgMCwgMSApO1xuXG5cblxuICAgICAgICAvLyBlbHNlIGlmKCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID4gMCApIHtcbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW5aZXJvID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhblplcm8oKTtcbiAgICAgICAgZ3JhcGguaWZHcmVhdGVyVGhhblplcm8gPSB0aGlzLmlvLmNyZWF0ZUlmRWxzZSgpO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggZ3JhcGguZ3JlYXRlclRoYW5aZXJvICk7XG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuWmVyby5jb25uZWN0KCBncmFwaC5pZkdyZWF0ZXJUaGFuWmVyby5pZiApO1xuICAgICAgICBncmFwaC5lbHNlSWZCcmFuY2guY29ubmVjdCggZ3JhcGguaWZHcmVhdGVyVGhhblplcm8udGhlbiApO1xuICAgICAgICBncmFwaC5lbHNlQnJhbmNoLmNvbm5lY3QoIGdyYXBoLmlmR3JlYXRlclRoYW5aZXJvLmVsc2UgKTtcblxuICAgICAgICAvLyBpZigoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID09PSAwKVxuICAgICAgICBncmFwaC5lcXVhbHNaZXJvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuICAgICAgICBncmFwaC5pZkVxdWFsc1plcm8gPSB0aGlzLmlvLmNyZWF0ZUlmRWxzZSgpO1xuICAgICAgICBncmFwaC5kaXZpZGUuY29ubmVjdCggZ3JhcGguZXF1YWxzWmVybyApO1xuICAgICAgICBncmFwaC5lcXVhbHNaZXJvLmNvbm5lY3QoIGdyYXBoLmlmRXF1YWxzWmVyby5pZiApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmxvd091dC5jb25uZWN0KCBncmFwaC5pZkVxdWFsc1plcm8udGhlbiApO1xuICAgICAgICBncmFwaC5pZkdyZWF0ZXJUaGFuWmVyby5jb25uZWN0KCBncmFwaC5pZkVxdWFsc1plcm8uZWxzZSApO1xuXG4gICAgICAgIGdyYXBoLmlmRXF1YWxzWmVyby5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IGxvd0luKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5sb3dJbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd0luKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dJbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBoaWdoSW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmhpZ2hJbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGhpZ2hJbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEluLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGxvd091dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMubG93T3V0LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbG93T3V0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5sb3dPdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgaGlnaE91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuaGlnaE91dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGhpZ2hPdXQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hPdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgZXhwb25lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkuX2V4cG9uZW50LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgZXhwb25lbnQoIHZhbHVlICkge1xuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG4gICAgICAgIGdyYXBoLl9leHBvbmVudC52YWx1ZSA9IHZhbHVlO1xuICAgICAgICBncmFwaC5wb3cudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgZ3JhcGgubmVnYXRpdmVQb3cudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2NhbGVFeHAgPSBmdW5jdGlvbiggbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHBvbmVudCApIHtcbiAgICByZXR1cm4gbmV3IFNjYWxlRXhwKCB0aGlzLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQsIGV4cG9uZW50ICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIFNpZ24gZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuU2lnbiApO1xuXG4gICAgICAgIGdyYXBoLmlmRWxzZSA9IHRoaXMuaW8uY3JlYXRlSWZFbHNlKCk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG9aZXJvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguZXF1YWxUb1plcm8gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5pZkVsc2UudGhlbiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuXG4gICAgICAgIGdyYXBoLmVxdWFsVG9aZXJvLmNvbm5lY3QoIGdyYXBoLmlmRWxzZS5pZiApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggZ3JhcGguaWZFbHNlLmVsc2UgKTtcbiAgICAgICAgZ3JhcGguaWZFbHNlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNpZ24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFNpZ24oIHRoaXMgKTtcbn07XG4iLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NZXRob2RzX29mX2NvbXB1dGluZ19zcXVhcmVfcm9vdHMjRXhhbXBsZVxuLy9cbi8vIGZvciggdmFyIGkgPSAwLCB4OyBpIDwgc2lnRmlndXJlczsgKytpICkge1xuLy8gICAgICBpZiggaSA9PT0gMCApIHtcbi8vICAgICAgICAgIHggPSBzaWdGaWd1cmVzICogTWF0aC5wb3coIDEwLCAyICk7XG4vLyAgICAgIH1cbi8vICAgICAgZWxzZSB7XG4vLyAgICAgICAgICB4ID0gMC41ICogKCB4ICsgKGlucHV0IC8geCkgKTtcbi8vICAgICAgfVxuLy8gfVxuXG4vLyBUT0RPOlxuLy8gIC0gTWFrZSBzdXJlIFNxcnQgdXNlcyBnZXRHcmFwaCBhbmQgc2V0R3JhcGguXG5jbGFzcyBTcXJ0SGVscGVyIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHByZXZpb3VzU3RlcCwgaW5wdXQsIG1heElucHV0ICkge1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gaW8uY3JlYXRlTXVsdGlwbHkoIDAuNSApO1xuICAgICAgICB0aGlzLmRpdmlkZSA9IGlvLmNyZWF0ZURpdmlkZSggbnVsbCwgbWF4SW5wdXQgKTtcbiAgICAgICAgdGhpcy5hZGQgPSBpby5jcmVhdGVBZGQoKTtcblxuICAgICAgICAvLyBpbnB1dCAvIHg7XG4gICAgICAgIGlucHV0LmNvbm5lY3QoIHRoaXMuZGl2aWRlLCAwLCAwICk7XG4gICAgICAgIHByZXZpb3VzU3RlcC5vdXRwdXQuY29ubmVjdCggdGhpcy5kaXZpZGUsIDAsIDEgKTtcblxuICAgICAgICAvLyB4ICsgKCBpbnB1dCAvIHggKVxuICAgICAgICBwcmV2aW91c1N0ZXAub3V0cHV0LmNvbm5lY3QoIHRoaXMuYWRkLCAwLCAwICk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNvbm5lY3QoIHRoaXMuYWRkLCAwLCAxICk7XG5cbiAgICAgICAgLy8gMC41ICogKCB4ICsgKCBpbnB1dCAvIHggKSApXG4gICAgICAgIHRoaXMuYWRkLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkgKTtcblxuICAgICAgICB0aGlzLm91dHB1dCA9IHRoaXMubXVsdGlwbHk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5tdWx0aXBseS5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5hZGQuY2xlYW5VcCgpO1xuXG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSBudWxsO1xuICAgICAgICB0aGlzLmRpdmlkZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYWRkID0gbnVsbDtcbiAgICAgICAgdGhpcy5vdXRwdXQgPSBudWxsO1xuICAgIH1cbn1cblxuY2xhc3MgU3FydCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgc2lnbmlmaWNhbnRGaWd1cmVzLCBtYXhJbnB1dCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gRGVmYXVsdCB0byA2IHNpZ25pZmljYW50IGZpZ3VyZXMuXG4gICAgICAgIHNpZ25pZmljYW50RmlndXJlcyA9IHNpZ25pZmljYW50RmlndXJlcyB8fCA2O1xuXG4gICAgICAgIG1heElucHV0ID0gbWF4SW5wdXQgfHwgMTAwO1xuXG4gICAgICAgIHRoaXMueDAgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCBzaWduaWZpY2FudEZpZ3VyZXMgKiBNYXRoLnBvdyggMTAsIDIgKSApO1xuXG4gICAgICAgIHRoaXMuc3RlcHMgPSBbIHtcbiAgICAgICAgICAgIG91dHB1dDogdGhpcy54MFxuICAgICAgICB9IF07XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAxOyBpIDwgc2lnbmlmaWNhbnRGaWd1cmVzOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnB1c2goXG4gICAgICAgICAgICAgICAgbmV3IFNxcnRIZWxwZXIoIHRoaXMuaW8sIHRoaXMuc3RlcHNbIGkgLSAxIF0sIHRoaXMuaW5wdXRzWyAwIF0sIG1heElucHV0IClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0ZXBzWyB0aGlzLnN0ZXBzLmxlbmd0aCAtIDEgXS5vdXRwdXQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICAvLyBjbGVhblVwKCkge1xuICAgIC8vICAgICBzdXBlcigpO1xuXG4gICAgLy8gICAgIHRoaXMueDAuY2xlYW5VcCgpO1xuXG4gICAgLy8gICAgIHRoaXMuc3RlcHNbIDAgXSA9IG51bGw7XG5cbiAgICAvLyAgICAgZm9yKCB2YXIgaSA9IHRoaXMuc3RlcHMubGVuZ3RoIC0gMTsgaSA+PSAxOyAtLWkgKSB7XG4gICAgLy8gICAgICAgICB0aGlzLnN0ZXBzWyBpIF0uY2xlYW5VcCgpO1xuICAgIC8vICAgICAgICAgdGhpcy5zdGVwc1sgaSBdID0gbnVsbDtcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIHRoaXMueDAgPSBudWxsO1xuICAgIC8vICAgICB0aGlzLnN0ZXBzID0gbnVsbDtcbiAgICAvLyB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3FydCA9IGZ1bmN0aW9uKCBzaWduaWZpY2FudEZpZ3VyZXMsIG1heElucHV0ICkge1xuICAgIHJldHVybiBuZXcgU3FydCggdGhpcywgc2lnbmlmaWNhbnRGaWd1cmVzLCBtYXhJbnB1dCApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBTcXVhcmUgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3F1YXJlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBTcXVhcmUoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBTdWJ0cmFjdHMgdGhlIHNlY29uZCBpbnB1dCBmcm9tIHRoZSBmaXJzdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgU3VidHJhY3QgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubmVnYXRlID0gdGhpcy5pby5jcmVhdGVOZWdhdGUoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubmVnYXRlICk7XG4gICAgICAgIGdyYXBoLm5lZ2F0ZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3VidHJhY3QgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBTdWJ0cmFjdCggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgU3dpdGNoIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyBFbnN1cmUgc3RhcnRpbmdDYXNlIGlzIG5ldmVyIDwgMFxuICAgICAgICBzdGFydGluZ0Nhc2UgPSB0eXBlb2Ygc3RhcnRpbmdDYXNlID09PSAnbnVtYmVyJyA/IE1hdGguYWJzKCBzdGFydGluZ0Nhc2UgKSA6IHN0YXJ0aW5nQ2FzZTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguY2FzZXMgPSBbXTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggc3RhcnRpbmdDYXNlICk7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgbnVtQ2FzZXM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXS5nYWluLnZhbHVlID0gMC4wO1xuICAgICAgICAgICAgZ3JhcGguY2FzZXNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbyggaSApO1xuICAgICAgICAgICAgZ3JhcGguY2FzZXNbIGkgXS5jb25uZWN0KCB0aGlzLmlucHV0c1sgaSBdLmdhaW4gKTtcbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuaW5kZXguY29ubmVjdCggZ3JhcGguY2FzZXNbIGkgXSApO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgY29udHJvbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuaW5kZXguY29udHJvbDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmluZGV4LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4LnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVN3aXRjaCA9IGZ1bmN0aW9uKCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICkge1xuICAgIHJldHVybiBuZXcgU3dpdGNoKCB0aGlzLCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIEFORCBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBBTkQ7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUFORCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgQU5EKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuY2xhc3MgTG9naWNhbE9wZXJhdG9yIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5jbGFtcCA9IHRoaXMuaW8uY3JlYXRlQ2xhbXAoIDAsIDEgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IGdyYXBoLmNsYW1wO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMb2dpY2FsT3BlcmF0b3I7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxvZ2ljYWxPcGVyYXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTG9naWNhbE9wZXJhdG9yKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIE5PVCBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5hYnMgPSB0aGlzLmlvLmNyZWF0ZUFicyggMTAwICk7XG4gICAgICAgIGdyYXBoLnN1YnRyYWN0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCggMSApO1xuICAgICAgICBncmFwaC5yb3VuZCA9IHRoaXMuaW8uY3JlYXRlUm91bmQoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnN1YnRyYWN0ICk7XG4gICAgICAgIGdyYXBoLnN1YnRyYWN0LmNvbm5lY3QoIGdyYXBoLmFicyApO1xuICAgICAgICBncmFwaC5hYnMuY29ubmVjdCggZ3JhcGgucm91bmQgKVxuXG4gICAgICAgIGdyYXBoLnJvdW5kLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE5PVDtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTk9UID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBOT1QoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IExvZ2ljYWxPcGVyYXRvciBmcm9tIFwiLi9Mb2dpY2FsT3BlcmF0b3IuZXM2XCI7XG5cblxuY2xhc3MgT1IgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubWF4ID0gdGhpcy5pby5jcmVhdGVNYXgoKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUbyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbyggMSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVDbGFtcCggMCwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubWF4ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubWF4LmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgIGdyYXBoLm1heC5jb25uZWN0KCBncmFwaC5lcXVhbFRvICk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgT1I7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU9SID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBPUiggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBnYWluKCsxMDAwMDApIC0+IHNoYXBlciggPD0gMDogMSwgMSApXG5jbGFzcyBFcXVhbFRvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIC8vIFRPRE9cbiAgICAgICAgLy8gIC0gUmVuYW1lIHRoaXMuXG4gICAgICAgIGdyYXBoLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKSxcbiAgICAgICAgZ3JhcGguaW52ZXJzaW9uID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICBncmFwaC5pbnZlcnNpb24uZ2Fpbi52YWx1ZSA9IC0xO1xuXG4gICAgICAgIC8vIFRoaXMgY3VydmUgb3V0cHV0cyAwLjUgd2hlbiBpbnB1dCBpcyAwLFxuICAgICAgICAvLyBzbyBpdCBoYXMgdG8gYmUgcGlwZWQgaW50byBhIG5vZGUgdGhhdFxuICAgICAgICAvLyB0cmFuc2Zvcm1zIGl0IGludG8gMSwgYW5kIGxlYXZlcyB6ZXJvc1xuICAgICAgICAvLyBhbG9uZS5cbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5FcXVhbFRvWmVybyApO1xuXG4gICAgICAgIGdyYXBoLmdyZWF0ZXJUaGFuWmVybyA9IHRoaXMuaW8uY3JlYXRlR3JlYXRlclRoYW5aZXJvKCk7XG4gICAgICAgIGdyYXBoLnZhbHVlLmNvbm5lY3QoIGdyYXBoLmludmVyc2lvbiApO1xuICAgICAgICBncmFwaC5pbnZlcnNpb24uY29ubmVjdCggdGhpcy5pbnB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCBncmFwaC5ncmVhdGVyVGhhblplcm8gKTtcbiAgICAgICAgZ3JhcGguZ3JlYXRlclRoYW5aZXJvLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IGdyYXBoLnZhbHVlO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG5cbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVFcXVhbFRvID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgRXF1YWxUbyggdGhpcywgdmFsdWUgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEVxdWFsVG87IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcbmltcG9ydCBFcXVhbFRvIGZyb20gXCIuL0VxdWFsVG8uZXM2XCI7XG5cbi8vIEhhdmVuJ3QgcXVpdGUgZmlndXJlZCBvdXQgd2h5IHlldCwgYnV0IHRoaXMgcmV0dXJucyAwIHdoZW4gaW5wdXQgaXMgMC5cbi8vIEl0IHNob3VsZCByZXR1cm4gMS4uLlxuLy9cbi8vIEZvciBub3csIEknbSBqdXN0IHVzaW5nIHRoZSBFcXVhbFRvIG5vZGUgd2l0aCBhIHN0YXRpYyAwIGFyZ3VtZW50LlxuLy8gLS0tLS0tLS1cbi8vXG4vLyBjbGFzcyBFcXVhbFRvWmVybyBleHRlbmRzIE5vZGUge1xuLy8gICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbi8vICAgICAgICAgc3VwZXIoIGlvLCAxLCAwICk7XG5cbi8vICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gMTAwMDAwO1xuXG4vLyAgICAgICAgIC8vIFRoaXMgb3V0cHV0cyAwLjUgd2hlbiBpbnB1dCBpcyAwLFxuLy8gICAgICAgICAvLyBzbyBpdCBoYXMgdG8gYmUgcGlwZWQgaW50byBhIG5vZGUgdGhhdFxuLy8gICAgICAgICAvLyB0cmFuc2Zvcm1zIGl0IGludG8gMSwgYW5kIGxlYXZlcyB6ZXJvc1xuLy8gICAgICAgICAvLyBhbG9uZS5cbi8vICAgICAgICAgdGhpcy5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkVxdWFsVG9aZXJvICk7XG5cbi8vICAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZUdyZWF0ZXJUaGFuKCAwICk7XG5cbi8vICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnNoYXBlciApO1xuLy8gICAgICAgICB0aGlzLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuLy8gICAgIH1cblxuLy8gICAgIGNsZWFuVXAoKSB7XG4vLyAgICAgICAgIHN1cGVyKCk7XG5cbi8vICAgICAgICAgdGhpcy5zaGFwZXIuY2xlYW5VcCgpO1xuLy8gICAgICAgICB0aGlzLnNoYXBlciA9IG51bGw7XG4vLyAgICAgfVxuLy8gfVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVFcXVhbFRvWmVybyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIHJldHVybiBuZXcgRXF1YWxUb1plcm8oIHRoaXMgKTtcblxuICAgIHJldHVybiBuZXcgRXF1YWxUbyggdGhpcywgMCApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBHcmVhdGVyVGhhbiBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgZ3JhcGguaW52ZXJzaW9uID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICBncmFwaC5pbnZlcnNpb24uZ2Fpbi52YWx1ZSA9IC0xO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDEwMDAwMDtcbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5HcmVhdGVyVGhhblplcm8gKTtcblxuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGguaW52ZXJzaW9uICk7XG4gICAgICAgIGdyYXBoLmludmVyc2lvbi5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGguc2hhcGVyICk7XG4gICAgICAgIGdyYXBoLnNoYXBlci5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlR3JlYXRlclRoYW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBHcmVhdGVyVGhhbiggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgR3JlYXRlclRoYW5aZXJvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gMTAwMDAwO1xuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkdyZWF0ZXJUaGFuWmVybyApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlR3JlYXRlclRoYW5aZXJvID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBHcmVhdGVyVGhhblplcm8oIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgSWZFbHNlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDAgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguc3dpdGNoID0gdGhpcy5pby5jcmVhdGVTd2l0Y2goIDIsIDAgKTtcblxuICAgICAgICB0aGlzLmlmID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuICAgICAgICB0aGlzLmlmLmNvbm5lY3QoIGdyYXBoLnN3aXRjaC5jb250cm9sICk7XG4gICAgICAgIHRoaXMudGhlbiA9IGdyYXBoLnN3aXRjaC5pbnB1dHNbIDAgXTtcbiAgICAgICAgdGhpcy5lbHNlID0gZ3JhcGguc3dpdGNoLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gZ3JhcGguc3dpdGNoLmlucHV0cztcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gZ3JhcGguc3dpdGNoLm91dHB1dHM7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUlmRWxzZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSWZFbHNlKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIExlc3NUaGFuIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIGdyYXBoLnZhbHVlSW52ZXJzaW9uID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGgudmFsdWVJbnZlcnNpb24uZ2Fpbi52YWx1ZSA9IC0xO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggZ3JhcGgudmFsdWVJbnZlcnNpb24gKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAtMTAwMDAwO1xuICAgICAgICBncmFwaC5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkdyZWF0ZXJUaGFuWmVybyApO1xuXG4gICAgICAgIGdyYXBoLnZhbHVlSW52ZXJzaW9uLmNvbm5lY3QoIHRoaXMuaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zaGFwZXIgKTtcbiAgICAgICAgZ3JhcGguc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVMZXNzVGhhbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IExlc3NUaGFuKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMZXNzVGhhblplcm8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5ib29zdGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguYm9vc3Rlci5nYWluLnZhbHVlID0gLTEwMDAwMDtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5ib29zdGVyICk7XG5cbiAgICAgICAgZ3JhcGguc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5HcmVhdGVyVGhhblplcm8gKTtcblxuICAgICAgICBncmFwaC5ib29zdGVyLmNvbm5lY3QoIGdyYXBoLnNoYXBlciApO1xuICAgICAgICBncmFwaC5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVzc1RoYW5aZXJvID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBMZXNzVGhhblplcm8oIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gQ29zaW5lIGFwcHJveGltYXRpb24hXG4vL1xuLy8gT25seSB3b3JrcyBpbiByYW5nZSBvZiAtTWF0aC5QSSB0byBNYXRoLlBJLlxuY2xhc3MgQ29zIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgZ3JhcGguc3F1YXJlID0gdGhpcy5pby5jcmVhdGVTcXVhcmUoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkxID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggLTIuNjA1ZS03ICk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5MiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkzID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTQgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5NSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICBncmFwaC5hZGQxID0gdGhpcy5pby5jcmVhdGVBZGQoIDIuNDc2MDllLTUgKTtcbiAgICAgICAgZ3JhcGguYWRkMiA9IHRoaXMuaW8uY3JlYXRlQWRkKCAtMC4wMDEzODg4NCApO1xuICAgICAgICBncmFwaC5hZGQzID0gdGhpcy5pby5jcmVhdGVBZGQoIDAuMDQxNjY2NiApO1xuICAgICAgICBncmFwaC5hZGQ0ID0gdGhpcy5pby5jcmVhdGVBZGQoIC0wLjQ5OTkyMyApO1xuICAgICAgICBncmFwaC5hZGQ1ID0gdGhpcy5pby5jcmVhdGVBZGQoIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNxdWFyZSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgbXVsdGlwbHkxJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTEsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGFkZDEncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkxLmNvbm5lY3QoIGdyYXBoLmFkZDEsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIG11bHRpcGx5MidzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkyLCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDEuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkyLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBhZGQyJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5Mi5jb25uZWN0KCBncmFwaC5hZGQyLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBtdWx0aXBseTMncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MywgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQyLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MywgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgYWRkMydzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTMuY29ubmVjdCggZ3JhcGguYWRkMywgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgbXVsdGlwbHk0J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTQsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkMy5jb25uZWN0KCBncmFwaC5tdWx0aXBseTQsIDAsIDEgKTtcblxuICAgICAgICAvLyBhZGQ0J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5NC5jb25uZWN0KCBncmFwaC5hZGQ0LCAwLCAwICk7XG5cbiAgICAgICAgLy8gbXVsdGlwbHk1J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkNC5jb25uZWN0KCBncmFwaC5tdWx0aXBseTUsIDAsIDEgKTtcblxuICAgICAgICAvLyBhZGQ1J3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5NS5jb25uZWN0KCBncmFwaC5hZGQ1LCAwLCAwICk7XG5cbiAgICAgICAgLy8gT3V0cHV0IChmaW5hbGx5ISEpXG4gICAgICAgIGdyYXBoLmFkZDUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDAgXTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29zID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgQ29zKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBEZWdUb1JhZCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIE1hdGguUEkgLyAxODAgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZURlZ1RvUmFkID0gZnVuY3Rpb24oIGRlZyApIHtcbiAgICByZXR1cm4gbmV3IERlZ1RvUmFkKCB0aGlzLCBkZWcgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgUmFkVG9EZWcgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAxODAgLyBNYXRoLlBJICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVSYWRUb0RlZyA9IGZ1bmN0aW9uKCBkZWcgKSB7XG4gICAgcmV0dXJuIG5ldyBSYWRUb0RlZyggdGhpcywgZGVnICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIFNpbiBhcHByb3hpbWF0aW9uIVxuLy9cbi8vIE9ubHkgd29ya3MgaW4gcmFuZ2Ugb2YgLU1hdGguUEkgdG8gTWF0aC5QSS5cbmNsYXNzIFNpbiBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICBncmFwaC5zcXVhcmUgPSB0aGlzLmlvLmNyZWF0ZVNxdWFyZSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTEgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAtMi4zOWUtOCApO1xuICAgICAgICBncmFwaC5tdWx0aXBseTIgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5MyA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk0ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICBncmFwaC5tdWx0aXBseTUgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5NiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICBncmFwaC5hZGQxID0gdGhpcy5pby5jcmVhdGVBZGQoIDIuNzUyNmUtNiApO1xuICAgICAgICBncmFwaC5hZGQyID0gdGhpcy5pby5jcmVhdGVBZGQoIC0wLjAwMDE5ODQwOSApO1xuICAgICAgICBncmFwaC5hZGQzID0gdGhpcy5pby5jcmVhdGVBZGQoIDAuMDA4MzMzMzMgKTtcbiAgICAgICAgZ3JhcGguYWRkNCA9IHRoaXMuaW8uY3JlYXRlQWRkKCAtMC4xNjY2NjcgKTtcbiAgICAgICAgZ3JhcGguYWRkNSA9IHRoaXMuaW8uY3JlYXRlQWRkKCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zcXVhcmUgKTtcblxuICAgICAgICAvLyBDb25uZWN0IG11bHRpcGx5MSdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHkxLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBhZGQxJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLm11bHRpcGx5MS5jb25uZWN0KCBncmFwaC5hZGQxLCAwLCAwICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBtdWx0aXBseTIncyBpbnB1dHNcbiAgICAgICAgZ3JhcGguc3F1YXJlLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MiwgMCwgMCApO1xuICAgICAgICBncmFwaC5hZGQxLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5MiwgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgYWRkMidzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTIuY29ubmVjdCggZ3JhcGguYWRkMiwgMCwgMCApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgbXVsdGlwbHkzJ3MgaW5wdXRzXG4gICAgICAgIGdyYXBoLnNxdWFyZS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTMsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkMi5jb25uZWN0KCBncmFwaC5tdWx0aXBseTMsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGFkZDMncyBpbnB1dHNcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkzLmNvbm5lY3QoIGdyYXBoLmFkZDMsIDAsIDAgKTtcblxuICAgICAgICAvLyBDb25uZWN0IG11bHRpcGx5NCdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk0LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDMuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNCdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTQuY29ubmVjdCggZ3JhcGguYWRkNCwgMCwgMCApO1xuXG4gICAgICAgIC8vIG11bHRpcGx5NSdzIGlucHV0c1xuICAgICAgICBncmFwaC5zcXVhcmUuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk1LCAwLCAwICk7XG4gICAgICAgIGdyYXBoLmFkZDQuY29ubmVjdCggZ3JhcGgubXVsdGlwbHk1LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNSdzIGlucHV0c1xuICAgICAgICBncmFwaC5tdWx0aXBseTUuY29ubmVjdCggZ3JhcGguYWRkNSwgMCwgMCApO1xuXG4gICAgICAgIC8vIG11bHRpcGx5NidzIGlucHV0c1xuICAgICAgICB0aGlzLmlucHV0c1swXS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTYsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguYWRkNS5jb25uZWN0KCBncmFwaC5tdWx0aXBseTYsIDAsIDEgKTtcblxuICAgICAgICAvLyBPdXRwdXQgKGZpbmFsbHkhISlcbiAgICAgICAgZ3JhcGgubXVsdGlwbHk2LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNpbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFNpbiggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gVGFuZ2VudCBhcHByb3hpbWF0aW9uIVxuLy9cbi8vIE9ubHkgd29ya3MgaW4gcmFuZ2Ugb2YgLU1hdGguUEkgdG8gTWF0aC5QSS5cbi8vXG4vLyBzaW4oIGlucHV0ICkgLyBjb3MoIGlucHV0IClcbmNsYXNzIFRhbiBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICBncmFwaC5zaW5lID0gdGhpcy5pby5jcmVhdGVTaW4oKTtcbiAgICAgICAgZ3JhcGguY29zID0gdGhpcy5pby5jcmVhdGVDb3MoKTtcbiAgICAgICAgZ3JhcGguZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoIHVuZGVmaW5lZCwgTWF0aC5QSSAqIDIgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnNpbmUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5jb3MgKTtcbiAgICAgICAgZ3JhcGguc2luZS5jb25uZWN0KCBncmFwaC5kaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgZ3JhcGguY29zLmNvbm5lY3QoIGdyYXBoLmRpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLmRpdmlkZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVUYW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBUYW4oIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBDT05GSUcgZnJvbSBcIi4uL2NvcmUvY29uZmlnLmVzNlwiO1xuXG5mdW5jdGlvbiBQaW5rTnVtYmVyKCkge1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy53aGl0ZVZhbHVlcyA9IFtdO1xuICAgIHRoaXMucmFuZ2UgPSAxMjg7XG4gICAgdGhpcy5saW1pdCA9IDU7XG5cbiAgICB0aGlzLmdlbmVyYXRlID0gdGhpcy5nZW5lcmF0ZS5iaW5kKCB0aGlzICk7XG4gICAgdGhpcy5nZXROZXh0VmFsdWUgPSB0aGlzLmdldE5leHRWYWx1ZS5iaW5kKCB0aGlzICk7XG59XG5cblBpbmtOdW1iZXIucHJvdG90eXBlLmdlbmVyYXRlID0gZnVuY3Rpb24oIHJhbmdlLCBsaW1pdCApIHtcbiAgICB0aGlzLnJhbmdlID0gcmFuZ2UgfHwgMTI4O1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy5saW1pdCA9IGxpbWl0IHx8IDE7XG5cblx0dmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICB9XG59O1xuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZXROZXh0VmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGFzdEtleSA9IHRoaXMua2V5LFxuICAgICAgICBzdW0gPSAwO1xuXG4gICAgKyt0aGlzLmtleTtcblxuICAgIGlmKCB0aGlzLmtleSA+IHRoaXMubWF4S2V5ICkge1xuICAgICAgICB0aGlzLmtleSA9IDA7XG4gICAgfVxuXG4gICAgdmFyIGRpZmYgPSB0aGlzLmxhc3RLZXkgXiB0aGlzLmtleTtcbiAgICB2YXIgcmFuZ2VMaW1pdCA9IHRoaXMucmFuZ2UgLyB0aGlzLmxpbWl0O1xuXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbWl0OyArK2kgKSB7XG4gICAgICAgIGlmKCBkaWZmICYgKDEgPDwgaSkgKSB7XG4gICAgICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1bSArPSB0aGlzLndoaXRlVmFsdWVzWyBpIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bSAvIHRoaXMubGltaXQ7XG59O1xuXG52YXIgcGluayA9IG5ldyBQaW5rTnVtYmVyKCk7XG5waW5rLmdlbmVyYXRlKCk7XG5cblxuXG5cblxuZXhwb3J0IGRlZmF1bHQge1xuXHRyb3VuZEZyb21FcHNpbG9uOiBmdW5jdGlvbiggbiApIHtcblx0XHRsZXQgcm91bmRlZCA9IE1hdGgucm91bmQoIG4gKTtcblxuXHRcdGlmICggcm91bmRlZCAlIG4gPCBDT05GSUcuZXBzaWxvbiApIHtcblx0XHRcdHJldHVybiByb3VuZGVkXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIG47XG5cdFx0fVxuXHR9LFxuXG5cdHJvdW5kVG9NdWx0aXBsZTogZnVuY3Rpb24oIG4sIG11bHRpcGxlICkge1xuXHRcdHJldHVybiBNYXRoLmZsb29yKCAoIG4gKyBtdWx0aXBsZSAtIDEgKSAvIG11bHRpcGxlICkgKiBtdWx0aXBsZTtcblx0fSxcblxuXHRjbGFtcDogZnVuY3Rpb24oIHZhbHVlLCBtaW4sIG1heCApIHtcblx0XHRyZXR1cm4gTWF0aC5taW4oIG1heCwgTWF0aC5tYXgoIHZhbHVlLCBtaW4gKSApO1xuXHR9LFxuXG5cdHNjYWxlTnVtYmVyOiBmdW5jdGlvbiggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG5cdFx0cmV0dXJuICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICkgKiAoIGhpZ2hPdXQgLSBsb3dPdXQgKSArIGxvd091dDtcblx0fSxcblxuXHRzY2FsZU51bWJlckV4cDogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHAgKSB7XG5cdFx0aWYgKCB0eXBlb2YgZXhwICE9PSAnbnVtYmVyJyB8fCBleHAgPT09IDEgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5zY2FsZU51bWJlciggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKTtcblx0XHR9XG5cblx0XHRpZiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSA9PT0gMCApIHtcblx0XHRcdHJldHVybiBsb3dPdXQ7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPiAwICkge1xuXHRcdFx0XHRyZXR1cm4gKCBsb3dPdXQgKyAoIGhpZ2hPdXQgLSBsb3dPdXQgKSAqIE1hdGgucG93KCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICksIGV4cCApICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiAtKCBNYXRoLnBvdyggKCAoIC1udW0gKyBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICksIGV4cCApICkgKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Ly8gQSB2ZXJ5IHBvb3IgYXBwcm94aW1hdGlvbiBvZiBhIGdhdXNzaWFuIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yIVxuXHRnYXVzc2lhblJhbmRvbTogZnVuY3Rpb24oIGN5Y2xlcyApIHtcblx0XHRjeWNsZXMgPSBjeWNsZXMgfHwgMTA7XG5cblx0XHR2YXIgbiA9IDAsXG5cdFx0XHRpID0gY3ljbGVzO1xuXG5cdFx0d2hpbGUoIC0taSApIHtcblx0XHRcdG4gKz0gTWF0aC5yYW5kb20oKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbiAvIGN5Y2xlcztcblx0fSxcblxuXHQvLyBGcm9tOlxuXHQvLyBcdGh0dHA6Ly93d3cubWVyZWRpdGhkb2RnZS5jb20vMjAxMi8wNS8zMC9hLWdyZWF0LWxpdHRsZS1qYXZhc2NyaXB0LWZ1bmN0aW9uLWZvci1nZW5lcmF0aW5nLXJhbmRvbS1nYXVzc2lhbm5vcm1hbGJlbGwtY3VydmUtbnVtYmVycy9cblx0bnJhbmQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB4MSxcblx0XHRcdHgyLFxuXHRcdFx0cmFkLFxuXHRcdFx0eTE7XG5cblx0XHRkbyB7XG5cdFx0XHR4MSA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHgyID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuXHRcdFx0cmFkID0geDEgKiB4MSArIHgyICogeDI7XG5cdFx0fSB3aGlsZSggcmFkID49IDEgfHwgcmFkID09PSAwICk7XG5cblx0XHR2YXIgYyA9IE1hdGguc3FydCggLTIgKiBNYXRoLmxvZyggcmFkICkgLyByYWQgKTtcblxuXHRcdHJldHVybiAoKHgxICogYykgLyA1KSAqIDAuNSArIDAuNTtcblx0fSxcblxuXHRnZW5lcmF0ZVBpbmtOdW1iZXI6IHBpbmsuZ2VuZXJhdGUsXG5cdGdldE5leHRQaW5rTnVtYmVyOiBwaW5rLmdldE5leHRWYWx1ZSxcblxufTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgY2xlYW5VcEluT3V0czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbnB1dHMsXG4gICAgICAgICAgICBvdXRwdXRzO1xuXG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KCB0aGlzLmlucHV0cyApICkge1xuICAgICAgICAgICAgaW5wdXRzID0gdGhpcy5pbnB1dHM7XG5cbiAgICAgICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgIGlmKCBpbnB1dHNbIGkgXSAmJiB0eXBlb2YgaW5wdXRzWyBpIF0uY2xlYW5VcCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRzWyBpIF0uY2xlYW5VcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBpbnB1dHNbIGkgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRzWyBpIF0uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlucHV0c1sgaSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5pbnB1dHMgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIEFycmF5LmlzQXJyYXkoIHRoaXMub3V0cHV0cyApICkge1xuICAgICAgICAgICAgb3V0cHV0cyA9IHRoaXMub3V0cHV0cztcblxuICAgICAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBvdXRwdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgIGlmKCBvdXRwdXRzWyBpIF0gJiYgdHlwZW9mIG91dHB1dHNbIGkgXS5jbGVhblVwID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRzWyBpIF0uY2xlYW5VcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBvdXRwdXRzWyBpIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dHNbIGkgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb3V0cHV0c1sgaSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5vdXRwdXRzID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjbGVhbklPOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYoIHRoaXMuaW8gKSB7XG4gICAgICAgICAgICB0aGlzLmlvID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCB0aGlzLmNvbnRleHQgKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgY29ubmVjdDogZnVuY3Rpb24oIG5vZGUsIG91dHB1dENoYW5uZWwgPSAwLCBpbnB1dENoYW5uZWwgPSAwICkge1xuICAgICAgICBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb1BhcmFtIHx8IG5vZGUgaW5zdGFuY2VvZiBBdWRpb05vZGUgKSB7XG4gICAgICAgICAgICAvLyB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXS5jb25uZWN0KCBub2RlICk7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXS5jb25uZWN0LmNhbGwoIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLCBub2RlLCAwLCBpbnB1dENoYW5uZWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKCBub2RlICYmIG5vZGUub3V0cHV0cyAmJiBub2RlLm91dHB1dHMubGVuZ3RoICkge1xuICAgICAgICAgICAgLy8gaWYoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSBpbnN0YW5jZW9mIFBhcmFtICkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coICdDT05ORUNUSU5HIFRPIFBBUkFNJyApO1xuICAgICAgICAgICAgLy8gbm9kZS5pby5jb25zdGFudERyaXZlci5kaXNjb25uZWN0KCBub2RlLmNvbnRyb2wgKTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0uY29ubmVjdCggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdICk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdBU1NFUlQgTk9UIFJFQUNIRUQnICk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyggYXJndW1lbnRzICk7XG4gICAgICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZGlzY29ubmVjdDogZnVuY3Rpb24oIG5vZGUsIG91dHB1dENoYW5uZWwgPSAwLCBpbnB1dENoYW5uZWwgPSAwKSB7XG4gICAgICAgIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gfHwgbm9kZSBpbnN0YW5jZW9mIEF1ZGlvTm9kZSApIHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmRpc2Nvbm5lY3QuY2FsbCggdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0sIG5vZGUsIDAsIGlucHV0Q2hhbm5lbCApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgJiYgbm9kZS5pbnB1dHMgJiYgbm9kZS5pbnB1dHMubGVuZ3RoICkge1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0uZGlzY29ubmVjdCggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdICk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmKCBub2RlID09PSB1bmRlZmluZWQgJiYgdGhpcy5vdXRwdXRzICkge1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzLmZvckVhY2goIGZ1bmN0aW9uKCBuICkge1xuICAgICAgICAgICAgICAgIGlmKCBuICYmIHR5cGVvZiBuLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgICAgICAgIG4uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gKTtcbiAgICAgICAgfVxuICAgIH1cbn07IiwiaW1wb3J0IG1hdGggZnJvbSBcIi4vbWF0aC5lczZcIjtcbmltcG9ydCBub3RlU3RyaW5ncyBmcm9tIFwiLi9ub3RlU3RyaW5ncy5lczZcIjtcbmltcG9ydCBub3RlcyBmcm9tIFwiLi9ub3Rlcy5lczZcIjtcbmltcG9ydCBDT05GSUcgZnJvbSBcIi4uL2NvcmUvY29uZmlnLmVzNlwiO1xuaW1wb3J0IG5vdGVSZWdFeHAgZnJvbSBcIi4vbm90ZVJlZ0V4cC5lczZcIjtcblxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgc2NhbGFyVG9EYjogZnVuY3Rpb24oIHNjYWxhciApIHtcbiAgICAgICAgcmV0dXJuIDIwICogKCBNYXRoLmxvZyggc2NhbGFyICkgLyBNYXRoLkxOMTAgKTtcbiAgICB9LFxuICAgIGRiVG9TY2FsYXI6IGZ1bmN0aW9uKCBkYiApIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KCAyLCBkYiAvIDYgKTtcbiAgICB9LFxuXG4gICAgaHpUb01JREk6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIG1hdGgucm91bmRGcm9tRXBzaWxvbiggNjkgKyAxMiAqIE1hdGgubG9nMiggdmFsdWUgLyA0NDAgKSApO1xuICAgIH0sXG5cbiAgICBoelRvTm90ZTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9Ob3RlKCB0aGlzLmh6VG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGh6VG9NczogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICBpZiAoIHZhbHVlID09PSAwICkgcmV0dXJuIDA7XG4gICAgICAgIHJldHVybiAxMDAwIC8gdmFsdWU7XG4gICAgfSxcblxuICAgIGh6VG9CUE06IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0JQTSggdGhpcy5oelRvTXMoIHZhbHVlICkgKTtcbiAgICB9LFxuXG5cblxuICAgIG1pZGlUb0h6OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnBvdyggMiwgKCB2YWx1ZSAtIDY5ICkgLyAxMiApICogNDQwO1xuICAgIH0sXG5cbiAgICBtaWRpVG9Ob3RlOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIGxldCB2YWx1ZXMgPSAoIHZhbHVlICsgJycgKS5zcGxpdCggJy4nICksXG4gICAgICAgICAgICBub3RlVmFsdWUgPSArdmFsdWVzWyAwIF0sXG4gICAgICAgICAgICBjZW50cyA9ICggdmFsdWVzWyAxIF0gPyBwYXJzZUZsb2F0KCAnMC4nICsgdmFsdWVzWyAxIF0sIDEwICkgOiAwICkgKiAxMDA7XG5cbiAgICAgICAgaWYgKCBNYXRoLmFicyggY2VudHMgKSA+PSAxMDAgKSB7XG4gICAgICAgICAgICBub3RlVmFsdWUgKz0gY2VudHMgJSAxMDA7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcm9vdCA9IG5vdGVWYWx1ZSAlIDEyIHwgMCxcbiAgICAgICAgICAgIG9jdGF2ZSA9IG5vdGVWYWx1ZSAvIDEyIHwgMCxcbiAgICAgICAgICAgIG5vdGVOYW1lID0gbm90ZVN0cmluZ3NbIHJvb3QgXTtcblxuICAgICAgICByZXR1cm4gbm90ZU5hbWUgKyAoIG9jdGF2ZSArIENPTkZJRy5sb3dlc3RPY3RhdmUgKSArICggY2VudHMgPyAnKycgKyBjZW50cyA6ICcnICk7XG4gICAgfSxcblxuICAgIG1pZGlUb01zOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmh6VG9NcyggdGhpcy5taWRpVG9IeiggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBtaWRpVG9CUE06IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0JQTSggdGhpcy5taWRpVG9NcyggdmFsdWUgKSApO1xuICAgIH0sXG5cblxuXG4gICAgbm90ZVRvSHo6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvSHooIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBub3RlVG9NSURJOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIGxldCBtYXRjaGVzID0gbm90ZVJlZ0V4cC5leGVjKCB2YWx1ZSApLFxuICAgICAgICAgICAgbm90ZSwgYWNjaWRlbnRhbCwgb2N0YXZlLCBjZW50cyxcbiAgICAgICAgICAgIG5vdGVWYWx1ZTtcblxuICAgICAgICBpZiAoICFtYXRjaGVzICkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCAnSW52YWxpZCBub3RlIGZvcm1hdDonLCB2YWx1ZSApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbm90ZSA9IG1hdGNoZXNbIDEgXTtcbiAgICAgICAgYWNjaWRlbnRhbCA9IG1hdGNoZXNbIDIgXTtcbiAgICAgICAgb2N0YXZlID0gcGFyc2VJbnQoIG1hdGNoZXNbIDMgXSwgMTAgKSArIC1DT05GSUcubG93ZXN0T2N0YXZlO1xuICAgICAgICBjZW50cyA9IHBhcnNlRmxvYXQoIG1hdGNoZXNbIDQgXSApIHx8IDA7XG5cbiAgICAgICAgbm90ZVZhbHVlID0gbm90ZXNbIG5vdGUgKyBhY2NpZGVudGFsIF07XG5cbiAgICAgICAgcmV0dXJuIG1hdGgucm91bmRGcm9tRXBzaWxvbiggbm90ZVZhbHVlICsgKCBvY3RhdmUgKiAxMiApICsgKCBjZW50cyAqIDAuMDEgKSApO1xuICAgIH0sXG5cbiAgICBub3RlVG9NczogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9NcyggdGhpcy5ub3RlVG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIG5vdGVUb0JQTTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9CUE0oIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cblxuXG4gICAgbXNUb0h6OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmh6VG9NcyggdmFsdWUgKTtcbiAgICB9LFxuXG4gICAgbXNUb05vdGU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvTXMoIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBtc1RvTUlESTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5oelRvTUlESSggdGhpcy5tc1RvSHooIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbXNUb0JQTTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IDAgPyAwIDogNjAwMDAgLyB2YWx1ZTtcbiAgICB9LFxuXG5cblxuICAgIGJwbVRvSHo6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0h6KCB0aGlzLmJwbVRvTXMoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgYnBtVG9Ob3RlOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb0JQTSggdGhpcy5ub3RlVG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGJwbVRvTUlESTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5tc1RvTUlESSggdGhpcy5icG1Ub01zKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGJwbVRvTXM6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0JQTSggdmFsdWUgKTtcbiAgICB9XG59OyIsImltcG9ydCBDT05GSUcgZnJvbSBcIi4uL2NvcmUvY29uZmlnLmVzNlwiO1xuXG5mdW5jdGlvbiBQaW5rTnVtYmVyKCkge1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy53aGl0ZVZhbHVlcyA9IFtdO1xuICAgIHRoaXMucmFuZ2UgPSAxMjg7XG4gICAgdGhpcy5saW1pdCA9IDU7XG5cbiAgICB0aGlzLmdlbmVyYXRlID0gdGhpcy5nZW5lcmF0ZS5iaW5kKCB0aGlzICk7XG4gICAgdGhpcy5nZXROZXh0VmFsdWUgPSB0aGlzLmdldE5leHRWYWx1ZS5iaW5kKCB0aGlzICk7XG59XG5cblBpbmtOdW1iZXIucHJvdG90eXBlLmdlbmVyYXRlID0gZnVuY3Rpb24oIHJhbmdlLCBsaW1pdCApIHtcbiAgICB0aGlzLnJhbmdlID0gcmFuZ2UgfHwgMTI4O1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy5saW1pdCA9IGxpbWl0IHx8IDE7XG5cblx0dmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICB9XG59O1xuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZXROZXh0VmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGFzdEtleSA9IHRoaXMua2V5LFxuICAgICAgICBzdW0gPSAwO1xuXG4gICAgKyt0aGlzLmtleTtcblxuICAgIGlmKCB0aGlzLmtleSA+IHRoaXMubWF4S2V5ICkge1xuICAgICAgICB0aGlzLmtleSA9IDA7XG4gICAgfVxuXG4gICAgdmFyIGRpZmYgPSB0aGlzLmxhc3RLZXkgXiB0aGlzLmtleTtcbiAgICB2YXIgcmFuZ2VMaW1pdCA9IHRoaXMucmFuZ2UgLyB0aGlzLmxpbWl0O1xuXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbWl0OyArK2kgKSB7XG4gICAgICAgIGlmKCBkaWZmICYgKDEgPDwgaSkgKSB7XG4gICAgICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1bSArPSB0aGlzLndoaXRlVmFsdWVzWyBpIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bSAvIHRoaXMubGltaXQ7XG59O1xuXG52YXIgcGluayA9IG5ldyBQaW5rTnVtYmVyKCk7XG5waW5rLmdlbmVyYXRlKCk7XG5cblxuXG5cblxuZXhwb3J0IGRlZmF1bHQge1xuXHRyb3VuZEZyb21FcHNpbG9uOiBmdW5jdGlvbiggbiApIHtcblx0XHRsZXQgcm91bmRlZCA9IE1hdGgucm91bmQoIG4gKTtcblxuXHRcdGlmICggcm91bmRlZCAlIG4gPCBDT05GSUcuZXBzaWxvbiApIHtcblx0XHRcdHJldHVybiByb3VuZGVkXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIG47XG5cdFx0fVxuXHR9LFxuXG5cdHJvdW5kVG9NdWx0aXBsZTogZnVuY3Rpb24oIG4sIG11bHRpcGxlICkge1xuXHRcdHJldHVybiBNYXRoLmZsb29yKCAoIG4gKyBtdWx0aXBsZSAtIDEgKSAvIG11bHRpcGxlICkgKiBtdWx0aXBsZTtcblx0fSxcblxuXHRjbGFtcDogZnVuY3Rpb24oIHZhbHVlLCBtaW4sIG1heCApIHtcblx0XHRyZXR1cm4gTWF0aC5taW4oIG1heCwgTWF0aC5tYXgoIHZhbHVlLCBtaW4gKSApO1xuXHR9LFxuXG5cdHNjYWxlTnVtYmVyOiBmdW5jdGlvbiggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG5cdFx0cmV0dXJuICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICkgKiAoIGhpZ2hPdXQgLSBsb3dPdXQgKSArIGxvd091dDtcblx0fSxcblxuXHRzY2FsZU51bWJlckV4cDogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHAgKSB7XG5cdFx0aWYgKCB0eXBlb2YgZXhwICE9PSAnbnVtYmVyJyB8fCBleHAgPT09IDEgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5zY2FsZU51bWJlciggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKTtcblx0XHR9XG5cblx0XHRpZiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSA9PT0gMCApIHtcblx0XHRcdHJldHVybiBsb3dPdXQ7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPiAwICkge1xuXHRcdFx0XHRyZXR1cm4gKCBsb3dPdXQgKyAoIGhpZ2hPdXQgLSBsb3dPdXQgKSAqIE1hdGgucG93KCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICksIGV4cCApICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiAtKCBNYXRoLnBvdyggKCAoIC1udW0gKyBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICksIGV4cCApICkgKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Ly8gQSB2ZXJ5IHBvb3IgYXBwcm94aW1hdGlvbiBvZiBhIGdhdXNzaWFuIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yIVxuXHRnYXVzc2lhblJhbmRvbTogZnVuY3Rpb24oIGN5Y2xlcyApIHtcblx0XHRjeWNsZXMgPSBjeWNsZXMgfHwgMTA7XG5cblx0XHR2YXIgbiA9IDAsXG5cdFx0XHRpID0gY3ljbGVzO1xuXG5cdFx0d2hpbGUoIC0taSApIHtcblx0XHRcdG4gKz0gTWF0aC5yYW5kb20oKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbiAvIGN5Y2xlcztcblx0fSxcblxuXHQvLyBGcm9tOlxuXHQvLyBcdGh0dHA6Ly93d3cubWVyZWRpdGhkb2RnZS5jb20vMjAxMi8wNS8zMC9hLWdyZWF0LWxpdHRsZS1qYXZhc2NyaXB0LWZ1bmN0aW9uLWZvci1nZW5lcmF0aW5nLXJhbmRvbS1nYXVzc2lhbm5vcm1hbGJlbGwtY3VydmUtbnVtYmVycy9cblx0bnJhbmQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB4MSxcblx0XHRcdHgyLFxuXHRcdFx0cmFkLFxuXHRcdFx0eTE7XG5cblx0XHRkbyB7XG5cdFx0XHR4MSA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHgyID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuXHRcdFx0cmFkID0geDEgKiB4MSArIHgyICogeDI7XG5cdFx0fSB3aGlsZSggcmFkID49IDEgfHwgcmFkID09PSAwICk7XG5cblx0XHR2YXIgYyA9IE1hdGguc3FydCggLTIgKiBNYXRoLmxvZyggcmFkICkgLyByYWQgKTtcblxuXHRcdHJldHVybiAoKHgxICogYykgLyA1KSAqIDAuNSArIDAuNTtcblx0fSxcblxuXHRnZW5lcmF0ZVBpbmtOdW1iZXI6IHBpbmsuZ2VuZXJhdGUsXG5cdGdldE5leHRQaW5rTnVtYmVyOiBwaW5rLmdldE5leHRWYWx1ZSxcblxufTsiLCJleHBvcnQgZGVmYXVsdCAvXihbQXxCfEN8RHxFfEZ8R117MX0pKFsjYnhdezAsMn0pKFtcXC1cXCtdP1xcZCspPyhbXFwrfFxcLV17MX1cXGQqLlxcZCopPy87IiwiZXhwb3J0IGRlZmF1bHQgWyAnQycsICdDIycsICdEJywgJ0QjJywgJ0UnLCAnRicsICdGIycsICdHJywgJ0cjJywgJ0EnLCAnQSMnLCAnQicgXTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgJ0MnOiAwLCAgICAgJ0RiYic6IDAsICAgJ0IjJzogMCxcbiAgICAnQyMnOiAxLCAgICAnRGInOiAxLCAgICAnQiMjJzogMSwgICAnQngnOiAxLFxuICAgICdEJzogMiwgICAgICdFYmInOiAyLCAgICdDIyMnOiAyLCAgICdDeCc6IDIsXG4gICAgJ0QjJzogMywgICAgJ0ViJzogMywgICAgJ0ZiYic6IDMsXG4gICAgJ0UnOiA0LCAgICAgJ0ZiJzogNCwgICAgJ0QjIyc6IDQsICAgJ0R4JzogNCxcbiAgICAnRic6IDUsICAgICAnR2JiJzogNSwgICAnRSMnOiA1LFxuICAgICdGIyc6IDYsICAgICdHYic6IDYsICAgICdFIyMnOiA2LCAgICdFeCc6IDYsXG4gICAgJ0cnOiA3LCAgICAgJ0FiYic6IDcsICAgJ0YjIyc6IDcsICAnRngnOiA3LFxuICAgICdHIyc6IDgsICAgICdBYic6IDgsXG4gICAgJ0EnOiA5LCAgICAgJ0JiYic6IDksICAgJ0cjIyc6IDksICAnR3gnOiA5LFxuICAgICdBIyc6IDEwLCAgICdCYic6IDEwLCAgICdDYmInOiAxMCxcbiAgICAnQic6IDExLCAgICAnQ2InOiAxMSwgICAnQSMjJzogMTEsICdBeCc6IDExXG59OyIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIF9zZXRJTyggaW8gKSB7XG4gICAgdGhpcy5pbyA9IGlvO1xuICAgIHRoaXMuY29udGV4dCA9IGlvLmNvbnRleHQ7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5pbXBvcnQgbWF0aCBmcm9tIFwiLi4vbWl4aW5zL21hdGguZXM2XCI7XG5cblxudmFyIEJVRkZFUlMgPSBuZXcgV2Vha01hcCgpO1xuXG5jbGFzcyBOb2lzZU9zY2lsbGF0b3IgZXh0ZW5kcyBOb2RlIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoIHRoaXMgKSxcbiAgICAgICAgICAgIHR5cGVzID0gdGhpcy5jb25zdHJ1Y3Rvci50eXBlcyxcbiAgICAgICAgICAgIHR5cGVLZXlzID0gT2JqZWN0LmtleXMoIHR5cGVzICksXG4gICAgICAgICAgICBidWZmZXJzID0gdGhpcy5fZ2V0QnVmZmVycygpO1xuXG4gICAgICAgIGdyYXBoLmJ1ZmZlclNvdXJjZXMgPSBbXTtcbiAgICAgICAgZ3JhcGgub3V0cHV0R2FpbiA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIGdyYXBoLnN3aXRjaCA9IHRoaXMuaW8uY3JlYXRlU3dpdGNoKCBPYmplY3Qua2V5cyggdHlwZXMgKS5sZW5ndGgsIDAgKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0R2Fpbi5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IHR5cGVLZXlzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKSxcbiAgICAgICAgICAgICAgICBidWZmZXIgPSBidWZmZXJzWyB0eXBlS2V5c1sgaSBdIF07XG5cbiAgICAgICAgICAgIHNvdXJjZS5idWZmZXIgPSBidWZmZXI7XG4gICAgICAgICAgICBzb3VyY2UubG9vcCA9IHRydWU7XG4gICAgICAgICAgICBzb3VyY2Uuc3RhcnQoIDAgKTtcblxuICAgICAgICAgICAgc291cmNlLmNvbm5lY3QoIGdyYXBoLnN3aXRjaCwgMCwgaSApO1xuICAgICAgICAgICAgZ3JhcGguYnVmZmVyU291cmNlcy5wdXNoKCBzb3VyY2UgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyYXBoLnN3aXRjaC5jb25uZWN0KCBncmFwaC5vdXRwdXRHYWluICk7XG4gICAgICAgIGdyYXBoLm91dHB1dEdhaW4uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnR5cGUgPSBncmFwaC5zd2l0Y2guY29udHJvbDtcbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBfY3JlYXRlU2luZ2xlQnVmZmVyKCB0eXBlICkge1xuICAgICAgICB2YXIgc2FtcGxlUmF0ZSA9IHRoaXMuY29udGV4dC5zYW1wbGVSYXRlLFxuICAgICAgICAgICAgYnVmZmVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlciggMSwgc2FtcGxlUmF0ZSwgc2FtcGxlUmF0ZSApLFxuICAgICAgICAgICAgY2hhbm5lbCA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSggMCApLFxuICAgICAgICAgICAgZm47XG5cbiAgICAgICAgc3dpdGNoKCB0eXBlICkge1xuICAgICAgICAgICAgY2FzZSAnV0hJVEUnOlxuICAgICAgICAgICAgICAgIGZuID0gTWF0aC5yYW5kb207XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0dBVVNTSUFOX1dISVRFJzpcbiAgICAgICAgICAgICAgICBmbiA9IG1hdGgubnJhbmQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ1BJTksnOlxuICAgICAgICAgICAgICAgIG1hdGguZ2VuZXJhdGVQaW5rTnVtYmVyKCAxMjgsIDUgKTtcbiAgICAgICAgICAgICAgICBmbiA9IG1hdGguZ2V0TmV4dFBpbmtOdW1iZXI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IHNhbXBsZVJhdGU7ICsraSApIHtcbiAgICAgICAgICAgIGNoYW5uZWxbIGkgXSA9IGZuKCkgKiAyIC0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCB0eXBlLCBNYXRoLm1pbi5hcHBseSggTWF0aCwgY2hhbm5lbCApLCBNYXRoLm1heC5hcHBseSggTWF0aCwgY2hhbm5lbCApICk7XG5cbiAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcbiAgICB9XG5cbiAgICBfY3JlYXRlQnVmZmVycygpIHtcbiAgICAgICAgdmFyIGJ1ZmZlcnMgPSB7fSxcbiAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyggYnVmZmVycyApLFxuICAgICAgICAgICAgdHlwZXMgPSB0aGlzLmNvbnN0cnVjdG9yLnR5cGVzLFxuICAgICAgICAgICAgdHlwZUtleXMgPSBPYmplY3Qua2V5cyggdHlwZXMgKSxcbiAgICAgICAgICAgIGJ1ZmZlcjtcblxuICAgICAgICAvLyBCdWZmZXJzIGFscmVhZHkgY3JlYXRlZC4gU3RvcCBoZXJlLlxuICAgICAgICBpZigga2V5cy5sZW5ndGggIT09IDAgKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IHR5cGVLZXlzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgYnVmZmVyc1sgdHlwZUtleXNbIGkgXSBdID0gdGhpcy5fY3JlYXRlU2luZ2xlQnVmZmVyKCB0eXBlS2V5c1sgaSBdICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zZXRCdWZmZXJzKCBidWZmZXJzICk7XG4gICAgfVxuXG4gICAgX2dldEJ1ZmZlcnMoKSB7XG4gICAgICAgIHZhciBidWZmZXJzID0gQlVGRkVSUy5nZXQoIHRoaXMuaW8gKTtcblxuICAgICAgICBpZiggYnVmZmVycyA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgdGhpcy5fY3JlYXRlQnVmZmVycygpO1xuICAgICAgICAgICAgYnVmZmVycyA9IEJVRkZFUlMuZ2V0KCB0aGlzLmlvICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYnVmZmVycztcbiAgICB9XG5cbiAgICBfc2V0QnVmZmVycyggYnVmZmVycyApIHtcbiAgICAgICAgQlVGRkVSUy5zZXQoIHRoaXMuaW8sIGJ1ZmZlcnMgKTtcbiAgICB9XG5cbiAgICBzdGFydCggdGltZSApIHtcbiAgICAgICAgdmFyIG91dHB1dEdhaW4gPSB0aGlzLmdldEdyYXBoKCB0aGlzICkub3V0cHV0R2FpbjtcblxuICAgICAgICB0aW1lID0gdGltZSB8fCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWU7XG4gICAgICAgIG91dHB1dEdhaW4uZ2Fpbi52YWx1ZSA9IDE7XG4gICAgfVxuXG4gICAgc3RvcCggdGltZSApIHtcbiAgICAgICAgdmFyIG91dHB1dEdhaW4gPSB0aGlzLmdldEdyYXBoKCB0aGlzICkub3V0cHV0R2FpbjtcblxuICAgICAgICB0aW1lID0gdGltZSB8fCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWU7XG4gICAgICAgIG91dHB1dEdhaW4uZ2Fpbi52YWx1ZSA9IDA7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG59XG5cblxuTm9pc2VPc2NpbGxhdG9yLnR5cGVzID0ge1xuICAgIFdISVRFOiAwLFxuICAgIEdBVVNTSUFOX1dISVRFOiAxLFxuICAgIFBJTks6IDJcbn07XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTm9pc2VPc2NpbGxhdG9yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBOb2lzZU9zY2lsbGF0b3IoIHRoaXMgKTtcbn07Il19
