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

},{"../mixins/conversions.es6":65,"../mixins/math.es6":66,"./config.es6":5,"./overrides.es6":6,"./signalCurves.es6":7}],2:[function(require,module,exports){
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

    Node.prototype.cleanUp = function cleanUp() {
        this._cleanUpInOuts();
        this._cleanIO();
        this.disconnect();
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

},{"../mixins/cleaners.es6":63,"../mixins/connections.es6":64,"../mixins/setIO.es6":70,"./AudioIO.es6":1}],3:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":63,"../mixins/connections.es6":64,"../mixins/setIO.es6":70,"./AudioIO.es6":1}],4:[function(require,module,exports){
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

},{"../mixins/cleaners.es6":63,"../mixins/connections.es6":64,"../mixins/setIO.es6":70,"./AudioIO.es6":1}],5:[function(require,module,exports){
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
// Need to override existing .connect functions
// for native AudioParams and AudioNodes...
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

        console.log(arguments);
        if (node.inputs) {
            if (Array.isArray(node.inputs)) {
                this.disconnect(node.inputs[inputChannel]);
            } else {
                this.disconnect(node.inputs[0], outputChannel, inputChannel);
            }
        } else if (node instanceof AudioNode) {
            originalAudioNodeDisconnect.apply(this, arguments);
        } else if (node instanceof AudioParam) {
            originalAudioNodeDisconnect.call(this, node, outputChannel);
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

        console.log(Math.min.apply(Math, curve));
        console.log(Math.max.apply(Math, curve));

        return curve;
    })()
});

module.exports = signalCurves;

},{"../mixins/Math.es6":62,"./config.es6":5}],8:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/config.es6":5,"../mixins/setIO.es6":70}],10:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../graphs/DryWetNode.es6":16,"../mixins/cleaners.es6":63,"../mixins/connections.es6":64,"../mixins/setIO.es6":70,"./Delay.es6":10}],12:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../mixins/setIO.es6":70}],13:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Counter = (function (_Node) {
    function Counter(io, increment, limit, stepTime) {
        _classCallCheck(this, Counter);

        _Node.call(this, io, 0, 1);

        this.constant = this.io.createParam(increment);
        this.multiply = this.io.createMultiply();

        this.delay = this.context.createDelay();
        this.delay.delayTime.value = stepTime || 1 / this.context.sampleRate;

        this.feedback = this.context.createGain();
        this.feedback.gain.value = 0;
        this.feedback.connect(this.delay);

        this.multiply.connect(this.delay);
        this.delay.connect(this.feedback);
        this.feedback.connect(this.delay);

        this.lessThan = this.io.createLessThan(limit);
        this.delay.connect(this.lessThan);
        this.lessThan.connect(this.feedback.gain);
        this.constant.connect(this.multiply, 0, 0);
        this.lessThan.connect(this.multiply, 0, 1);

        this.delay.connect(this.outputs[0]);
    }

    _inherits(Counter, _Node);

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
        var dryWetValue = arguments[1] === undefined ? 0 : arguments[1];

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

_coreAudioIOEs62["default"].prototype.createDryWetNode = function (value) {
    return new DryWetNode(this, value);
};

exports["default"] = DryWetNode;
module.exports = exports["default"];

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/cleaners.es6":63,"../mixins/connections.es6":64,"../mixins/setIO.es6":70}],17:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/math.es6":66}],21:[function(require,module,exports){
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

require('./math/trigonometry/Sine.es6');

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

require('./math/Average2.es6');

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

},{"./core/AudioIO.es6":1,"./core/Node.es6":2,"./core/Param.es6":3,"./core/WaveShaper.es6":4,"./envelopes/ASDREnvelope.es6":8,"./envelopes/CustomEnvelope.es6":9,"./fx/Delay.es6":10,"./fx/PingPongDelay.es6":11,"./generators/OscillatorGenerator.es6":12,"./graphs/Counter.es6":13,"./graphs/Crossfader.es6":14,"./graphs/DiffuseDelay.es6":15,"./graphs/DryWetNode.es6":16,"./graphs/EQShelf.es6":17,"./graphs/OscillatorBank.es6":18,"./graphs/PhaseOffset.es6":19,"./instruments/GeneratorPlayer.es6":20,"./math/Abs.es6":22,"./math/Add.es6":23,"./math/Average.es6":24,"./math/Average2.es6":25,"./math/Clamp.es6":26,"./math/Constant.es6":27,"./math/Divide.es6":28,"./math/Floor.es6":29,"./math/Lerp.es6":30,"./math/Max.es6":31,"./math/Min.es6":32,"./math/Multiply.es6":33,"./math/Negate.es6":34,"./math/Pow.es6":35,"./math/Reciprocal.es6":36,"./math/Round.es6":37,"./math/SampleDelay.es6":38,"./math/Scale.es6":39,"./math/ScaleExp.es6":40,"./math/Sign.es6":41,"./math/Sqrt.es6":42,"./math/Square.es6":43,"./math/Subtract.es6":44,"./math/Switch.es6":45,"./math/logical-operators/AND.es6":46,"./math/logical-operators/LogicalOperator.es6":47,"./math/logical-operators/NOT.es6":48,"./math/logical-operators/OR.es6":49,"./math/relational-operators/EqualTo.es6":50,"./math/relational-operators/EqualToZero.es6":51,"./math/relational-operators/GreaterThan.es6":52,"./math/relational-operators/GreaterThanZero.es6":53,"./math/relational-operators/IfElse.es6":54,"./math/relational-operators/LessThan.es6":55,"./math/relational-operators/LessThanZero.es6":56,"./math/trigonometry/Cos.es6":57,"./math/trigonometry/DegToRad.es6":58,"./math/trigonometry/RadToDeg.es6":59,"./math/trigonometry/Sine.es6":60,"./math/trigonometry/Tan.es6":61,"./oscillators/NoiseOscillator.es6":71}],22:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Abs = (function (_Node) {

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function Abs(io) {
        var accuracy = arguments[1] === undefined ? 10 : arguments[1];

        _classCallCheck(this, Abs);

        _Node.call(this, io, 1, 1);

        // var gainAccuracy = accuracy * 100;
        var gainAccuracy = Math.pow(accuracy, 2);

        this.inputs[0].gain.value = 1 / gainAccuracy;
        this.outputs[0].gain.value = gainAccuracy;

        this.shaper = this.io.createWaveShaper(function (x) {
            return Math.abs(x);
        }, 8192 * accuracy);

        this.inputs[0].connect(this.shaper);
        this.shaper.connect(this.outputs[0]);
    }

    _inherits(Abs, _Node);

    Abs.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
        this.shaper.cleanUp();
        this.shaper = null;
    };

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

    Add.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
        this.control = null;
    };

    _createClass(Add, [{
        key: "value",
        get: function get() {
            return this.controls.value;
        },
        set: function set(value) {
            this.controls.value.setValueAtTime(value, this.context.currentTime);
        }
    }]);

    return Add;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createAdd = function (value) {
    return new Add(this, value);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],24:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Average = (function (_Node) {

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function Average(io, numSamples) {
        var sampleSize = arguments[2] === undefined ? 1 : arguments[2];

        _classCallCheck(this, Average);

        _Node.call(this, io, 1, 1);

        var oneSample = 1 / this.context.sampleRate * sampleSize,
            node = this.inputs[0];

        this.sampleSize = this.io.createConstant(1 / this.context.sampleRate);
        this.multiply = this.io.createMultiply();
        this.controls.sampleSize = this.io.createParam();
        this.sampleSize.connect(this.multiply, 0, 0);
        this.controls.sampleSize.connect(this.multiply, 0, 1);

        this.divide = this.io.createDivide(numSamples, this.context.sampleRate * 0.5);

        this.sum = this.context.createGain();
        // this.sum.gain.value = 1 / numSamples;

        for (var i = 0; i < numSamples; ++i) {
            var delay = this.context.createDelay();
            delay.delayTime.value = 0;
            this.multiply.connect(delay.delayTime);
            node.connect(delay);
            delay.connect(this.sum);
            node = delay;
        }

        // this.inputs[ 0 ].connect( this.outputs[ 0 ] );
        this.sum.connect(this.divide);
        this.divide.connect(this.outputs[0]);

        // var oneSample = (1 / this.context.sampleRate);

        // this.delay = this.context.createDelay();
        // this.delay.delayTime.value = oneSample;
        // this.sum = this.context.createGain();
        // this.decay = this.context.createGain();
        // this.decay.gain.value = sampleSize;
        // this.divide = this.io.createDivide( numSamples, this.context.sampleRate * 0.5 );

        // this.inputs[ 0 ].connect( this.delay );
        // this.delay.connect( this.sum );
        // this.sum.connect( this.divide );
        // this.sum.connect( this.decay );
        // this.decay.connect( this.delay );
        // this.divide.connect( this.outputs[ 0 ] );
    }

    _inherits(Average, _Node);

    Average.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
        this.shaper.cleanUp();
        this.shaper = null;
    };

    return Average;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createAverage = function (numSamples, sampleSize) {
    return new Average(this, numSamples, sampleSize);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],25:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Average2 = (function (_Node) {

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function Average2(io, sampleSize) {
        _classCallCheck(this, Average2);

        _Node.call(this, io, 1, 1);

        this.sampleSize = this.io.createConstant(1 / this.context.sampleRate);
        this.multiply = this.io.createMultiply();
        this.controls.sampleSize = this.io.createParam(sampleSize);
        this.sampleSize.connect(this.multiply, 0, 0);
        this.controls.sampleSize.connect(this.multiply, 0, 1);

        this.divide = this.io.createMultiply(0.5);
        this.sum = this.context.createGain();

        var delay = this.context.createDelay();
        delay.delayTime.value = 0;
        this.multiply.connect(delay.delayTime);
        this.inputs[0].connect(delay);
        delay.connect(this.sum);

        var delay2 = this.context.createDelay();
        delay2.delayTime.value = 0;
        this.multiply.connect(delay2.delayTime);
        delay.connect(delay2);
        delay2.connect(this.sum);

        this.sum.connect(this.divide);
        this.divide.connect(this.outputs[0]);
    }

    _inherits(Average2, _Node);

    Average2.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
        this.shaper.cleanUp();
        this.shaper = null;
    };

    return Average2;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createAverage2 = function (sampleSize) {
    return new Average2(this, sampleSize);
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

/**
 * [Clamp description]
 * @param {[type]} io       [description]
 * @param {[type]} minValue [description]
 * @param {[type]} maxValue [description]
 */

var Clamp = (function (_Node) {
    function Clamp(io, minValue, maxValue) {
        _classCallCheck(this, Clamp);

        _Node.call(this, io, 0, 0); // io, 1, 1

        this.min = this.io.createMin(maxValue);
        this.max = this.io.createMax(minValue);

        this.min.connect(this.max);

        this.inputs = [this.min];
        this.outputs = [this.max];

        // Store controllable params.
        this.controls.min = this.min.controls.value;
        this.controls.max = this.max.controls.value;
    }

    _inherits(Clamp, _Node);

    Clamp.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
        this.min = null;
        this.max = null;
    };

    _createClass(Clamp, [{
        key: "minValue",
        get: function get() {
            return this.min.value;
        },
        set: function set(value) {
            this.min.value = value;
        }
    }, {
        key: "maxValue",
        get: function get() {
            return this.max.value;
        },
        set: function set(value) {
            this.max.value = value;
        }
    }]);

    return Clamp;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createClamp = function (minValue, maxValue) {
    return new Clamp(this, minValue, maxValue);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],27:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],28:[function(require,module,exports){
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

        this.inputs[1] = this.io.createParam(value);

        this._value = this.inputs[1].value;

        this.outputs[0].gain.value = 0.0;

        this.reciprocal = this.io.createReciprocal(maxInput);
        this.inputs[1].connect(this.reciprocal);

        this.inputs[0].connect(this.outputs[0]);
        this.reciprocal.connect(this.outputs[0].gain);

        this.controls.divisor = this.inputs[1];
    }

    _inherits(Divide, _Node);

    Divide.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
        this.reciprocal.cleanUp();
        this.reciprocal = null;
        this._value = null;
    };

    _createClass(Divide, [{
        key: "value",
        get: function get() {
            return this._value;
        },
        set: function set(value) {
            if (typeof value === "number") {
                this._value = value;

                // if( this.inputs[ 0 ] instanceof Constant ) {
                this.inputs[1].value = this._value;
                // }
            }
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],29:[function(require,module,exports){
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

        this.shaper = this.io.createWaveShaper(this.io.curves.Floor);

        // This branching is because inputting `0` values
        // into the waveshaper above outputs -0.5 ;(
        this.ifElse = this.io.createIfElse();
        this.equalToZero = this.io.createEqualToZero();

        this.inputs[0].connect(this.equalToZero);
        this.equalToZero.connect(this.ifElse["if"]);
        this.inputs[0].connect(this.ifElse.then);
        this.shaper.connect(this.ifElse["else"]);

        this.inputs[0].connect(this.shaper);
        this.ifElse.connect(this.outputs[0]);
    }

    _inherits(Floor, _Node);

    Floor.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        this.shaper.cleanUp();
        this.ifElse.cleanUp();
        this.equalToZero.cleanUp();

        this.shaper = null;
        this.ifElse = null;
        this.equalToZero = null;
    };

    return Floor;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createFloor = function () {
    return new Floor(this);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],30:[function(require,module,exports){
"use strict";

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

    function Lerp(io) {
        _classCallCheck(this, Lerp);

        _Node.call(this, io, 3, 1);

        this.add = this.io.createAdd();
        this.subtract = this.io.createSubtract();
        this.multiply = this.io.createMultiply();

        this.start = this.io.createParam();
        this.end = this.io.createParam();
        this.delta = this.io.createParam();

        this.end.connect(this.subtract, 0, 0);
        this.start.connect(this.subtract, 0, 1);
        this.subtract.connect(this.multiply, 0, 0);
        this.delta.connect(this.multiply, 0, 1);

        this.start.connect(this.add, 0, 0);
        this.multiply.connect(this.add, 0, 1);

        this.add.connect(this.outputs[0]);

        this.inputs[0].connect(this.start);
        this.inputs[1].connect(this.end);
        this.inputs[2].connect(this.delta);

        this.controls.start = this.start;
        this.controls.end = this.end;
        this.controls.delta = this.delta;
    }

    _inherits(Lerp, _Node);

    Lerp.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        // TODO..!
    };

    return Lerp;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createLerp = function () {
    return new Lerp(this);
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
 * When input is < `value`, outputs `value`, otherwise outputs input.
 * @param {AudioIO} io   AudioIO instance
 * @param {Number} value The minimum value to test against.
 */

var Max = (function (_Node) {
    function Max(io, value) {
        _classCallCheck(this, Max);

        _Node.call(this, io, 1, 1);

        this.greaterThan = this.io.createGreaterThan();
        this.controls.value = this.inputs[1] = this.io.createParam(value);
        this.inputs[1].connect(this.greaterThan);
        this.inputs[0].connect(this.greaterThan.controls.value);

        this["switch"] = this.io.createSwitch(2, 0);

        this.inputs[0].connect(this["switch"].inputs[0]);
        this.inputs[1].connect(this["switch"].inputs[1]);
        this.greaterThan.connect(this["switch"].control);
        this["switch"].connect(this.outputs[0]);
    }

    _inherits(Max, _Node);

    Max.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        this.controls.value.cleanUp();
        this.greaterThan.cleanUp();
        this["switch"].cleanUp();

        this.controls.value = null;
        this.greaterThan = null;
        this["switch"] = null;
    };

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
 * When input is > `value`, outputs `value`, otherwise outputs input.
 * @param {AudioIO} io   AudioIO instance
 * @param {Number} value The minimum value to test against.
 */

var Min = (function (_Node) {
    function Min(io, value) {
        _classCallCheck(this, Min);

        _Node.call(this, io, 1, 1);

        this.lessThan = this.io.createLessThan();
        this.controls.value = this.inputs[1] = this.io.createParam(value);
        this.inputs[1].connect(this.lessThan);
        this.inputs[0].connect(this.lessThan.controls.value);

        this["switch"] = this.io.createSwitch(2, 0);

        this.inputs[0].connect(this["switch"].inputs[0]);
        this.inputs[1].connect(this["switch"].inputs[1]);
        this.lessThan.connect(this["switch"].control);
        this["switch"].connect(this.outputs[0]);
    }

    _inherits(Min, _Node);

    Min.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        this.controls.value.cleanUp();
        this.lessThan.cleanUp();
        this["switch"].cleanUp();

        this.controls.value = null;
        this.lessThan = null;
        this["switch"] = null;
    };

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

    Multiply.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
        this.control = null;
    };

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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],34:[function(require,module,exports){
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
 * @param {Object} io Instance of AudioIO.
 *
 * Note: DOES NOT HANDLE NEGATIVE POWERS.
 */

var Pow = (function (_Node) {
    function Pow(io, value) {
        _classCallCheck(this, Pow);

        _Node.call(this, io, 1, 1);

        this.multipliers = [];
        this._value = value;

        for (var i = 0, node = this.inputs[0]; i < value - 1; ++i) {
            this.multipliers[i] = this.io.createMultiply();
            this.inputs[0].connect(this.multipliers[i].controls.value);
            node.connect(this.multipliers[i]);
            node = this.multipliers[i];
        }

        node.connect(this.outputs[0]);
    }

    _inherits(Pow, _Node);

    Pow.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        for (var i = this.multipliers.length - 1; i >= 0; --i) {
            this.multipliers[i].cleanUp();
            this.multipliers[i] = null;
        }

        this.multipliers = null;

        this._value = null;
    };

    _createClass(Pow, [{
        key: "value",
        get: function get() {
            return this._value;
        },
        set: function set(value) {
            for (var i = this.multipliers.length - 1; i >= 0; --i) {
                this.multipliers[i].disconnect();
                this.multipliers.splice(i, 1);
            }

            this.inputs[0].disconnect();

            for (var i = 0, node = this.inputs[0]; i < value - 1; ++i) {
                this.multipliers[i] = this.io.createMultiply();
                this.inputs[0].connect(this.multipliers[i].controls.value);
                node.connect(this.multipliers[i]);
                node = this.multipliers[i];
            }

            node.connect(this.outputs[0]);

            this._value = value;
        }
    }]);

    return Pow;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createPow = function (value) {
    return new Pow(this, value);
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
            gain = Math.pow(factor, -1);

        this._maxInput = this.context.createGain();
        this._maxInput.gain.setValueAtTime(gain, this.context.currentTime);

        // this.inputs[ 0 ] = this.context.createGain();
        this.inputs[0].gain.setValueAtTime(0.0, this.context.currentTime);

        this.shaper = this.io.createWaveShaper(this.io.curves.Reciprocal);

        // this.outputs[ 0 ] = this.context.createGain();
        this.outputs[0].gain.setValueAtTime(0.0, this.context.currentTime);

        this.io.constantDriver.connect(this._maxInput);
        this._maxInput.connect(this.inputs[0].gain);
        this._maxInput.connect(this.outputs[0].gain);

        this.inputs[0].connect(this.shaper);
        this.shaper.connect(this.outputs[0]);
    }

    _inherits(Reciprocal, _Node);

    Reciprocal.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
        this.shaper.cleanUp();
        this._maxInput.disconnect();
        this.shaper = null;
        this._maxInput = null;
    };

    _createClass(Reciprocal, [{
        key: "maxInput",
        get: function get() {
            return this._maxInput.gain;
        },
        set: function set(value) {
            if (typeof value === "number") {
                this._maxInput.gain.cancelScheduledValues(this.context.currentTime);
                this._maxInput.gain.setValueAtTime(1 / value, this.context.currentTime);
            }
        }
    }]);

    return Reciprocal;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createReciprocal = function (maxInput) {
    return new Reciprocal(this, maxInput);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],37:[function(require,module,exports){
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

        // this.shaper = this.io.createWaveShaper( this.io.curves.Round );

        // This branching is because inputting `0` values
        // into the waveshaper above outputs -0.5 ;(
        // this.ifElse = this.io.createIfElse();
        // this.equalToZero = this.io.createEqualToZero();

        // this.inputs[ 0 ].connect( this.equalToZero );
        // this.equalToZero.connect( this.ifElse.if );
        // this.inputs[ 0 ].connect( this.ifElse.then );
        // this.shaper.connect( this.ifElse.else );
        // this.inputs[ 0 ].connect( this.shaper );
        // this.ifElse.connect( this.outputs[ 0 ] );

        this.floor = this.io.createFloor();
        this.add = this.io.createAdd(0.5);
        this.inputs[0].connect(this.add);
        this.add.connect(this.floor);
        this.floor.connect(this.outputs[0]);
    }

    _inherits(Round, _Node);

    Round.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        this.floor.cleanUp();
        this.add.cleanUp();

        this.floor = null;
        this.add = null;

        // this.ifElse.cleanUp();
        // this.equalToZero.cleanUp();
        // this.shaper.cleanUp();

        // this.ifElse = null;
        // this.equalToZero = null;
        // this.shaper = null;
    };

    return Round;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createRound = function () {
    return new Round(this);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],38:[function(require,module,exports){
"use strict";

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

    function SampleDelay(io) {
        var numSamples = arguments[1] === undefined ? 1 : arguments[1];

        _classCallCheck(this, SampleDelay);

        _Node.call(this, io, 1, 1);

        this.sampleSize = this.io.createConstant(1 / this.context.sampleRate);
        this.multiply = this.io.createMultiply();
        this.controls.samples = this.io.createParam(numSamples);

        this.sampleSize.connect(this.multiply, 0, 0);
        this.controls.samples.connect(this.multiply, 0, 1);

        this.delay = this.context.createDelay();
        this.delay.delayTime.value = 0;
        this.multiply.connect(this.delay.delayTime);
        this.inputs[0].connect(this.delay);
        this.delay.connect(this.outputs[0]);
    }

    _inherits(SampleDelay, _Node);

    SampleDelay.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
        this.delay.cleanUp();
        this.delay = null;
    };

    return SampleDelay;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSampleDelay = function (numSamples) {
    return new SampleDelay(this, numSamples);
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
// ((input-lowIn) / (highIn-lowIn)) * (highOut-lowOut) + lowOut;

// TODO:
//  - Add controls!

var Scale = (function (_Node) {
    function Scale(io, lowIn, highIn, lowOut, highOut) {
        _classCallCheck(this, Scale);

        _Node.call(this, io, 1, 1);

        lowIn = typeof lowIn === "number" ? lowIn : 0;
        highIn = typeof highIn === "number" ? highIn : 1;
        lowOut = typeof lowOut === "number" ? lowOut : 0;
        highOut = typeof highOut === "number" ? highOut : 10;

        this._lowIn = this.io.createParam(lowIn);
        this._highIn = this.io.createParam(highIn);
        this._lowOut = this.io.createParam(lowOut);
        this._highOut = this.io.createParam(highOut);

        // this.inputs = [ this.context.createGain() ];

        // (input-lowIn)
        this.inputMinusLowIn = this.io.createSubtract();
        this.inputs[0].connect(this.inputMinusLowIn, 0, 0);
        this._lowIn.connect(this.inputMinusLowIn, 0, 1);

        // (highIn-lowIn)
        this.highInMinusLowIn = this.io.createSubtract();
        this._highIn.connect(this.highInMinusLowIn, 0, 0);
        this._lowIn.connect(this.highInMinusLowIn, 0, 1);

        // ((input-lowIn) / (highIn-lowIn))
        this.divide = this.io.createDivide();
        this.inputMinusLowIn.connect(this.divide, 0, 0);
        this.highInMinusLowIn.connect(this.divide, 0, 1);

        // (highOut-lowOut)
        this.highOutMinusLowOut = this.io.createSubtract();
        this._highOut.connect(this.highOutMinusLowOut, 0, 0);
        this._lowOut.connect(this.highOutMinusLowOut, 0, 1);

        // ((input-lowIn) / (highIn-lowIn)) * (highOut-lowOut)
        this.multiply = this.io.createMultiply();
        this.divide.connect(this.multiply, 0, 0);
        this.highOutMinusLowOut.connect(this.multiply, 0, 1);

        // ((input-lowIn) / (highIn-lowIn)) * (highOut-lowOut) + lowOut
        this.add = this.io.createAdd();
        this.multiply.connect(this.add, 0, 0);
        this._lowOut.connect(this.add, 0, 1);

        this.add.connect(this.outputs[0]);
    }

    _inherits(Scale, _Node);

    Scale.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        this._lowIn.cleanUp();
        this._highIn.cleanUp();
        this._lowOut.cleanUp();
        this._highOut.cleanUp();
        this.inputMinusLowIn.cleanUp();
        this.highInMinusLowIn.cleanUp();
        this.divide.cleanUp();
        this.highOutMinusLowOut.cleanUp();
        this.multiply.cleanUp();

        this._lowIn = null;
        this._highIn = null;
        this._lowOut = null;
        this._highOut = null;
        this.inputMinusLowIn = null;
        this.highInMinusLowIn = null;
        this.divide = null;
        this.highOutMinusLowOut = null;
        this.multiply = null;
        this.add = null;
    };

    _createClass(Scale, [{
        key: "lowIn",
        get: function get() {
            return this._lowIn.value;
        },
        set: function set(value) {
            this._lowIn.value = value;
        }
    }, {
        key: "highIn",
        get: function get() {
            return this._highIn.value;
        },
        set: function set(value) {
            this._highIn.value = value;
        }
    }, {
        key: "lowOut",
        get: function get() {
            return this._lowOut.value;
        },
        set: function set(value) {
            this._lowOut.value = value;
        }
    }, {
        key: "highOut",
        get: function get() {
            return this._highOut.value;
        },
        set: function set(value) {
            this._highOut.value = value;
        }
    }]);

    return Scale;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createScale = function (lowIn, highIn, lowOut, highOut) {
    return new Scale(this, lowIn, highIn, lowOut, highOut);
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

        lowIn = typeof lowIn === "number" ? lowIn : 0;
        highIn = typeof highIn === "number" ? highIn : 1;
        lowOut = typeof lowOut === "number" ? lowOut : 0;
        highOut = typeof highOut === "number" ? highOut : 10;
        exponent = typeof exponent === "number" ? exponent : 1;

        this._lowIn = this.io.createParam(lowIn);
        this._highIn = this.io.createParam(highIn);
        this._lowOut = this.io.createParam(lowOut);
        this._highOut = this.io.createParam(highOut);
        this._exponent = this.io.createParam(exponent);

        // (input - lowIn)
        this.inputMinusLowIn = this.io.createSubtract();
        this.inputs[0].connect(this.inputMinusLowIn, 0, 0);
        this._lowIn.connect(this.inputMinusLowIn, 0, 1);

        // (-input + lowIn)
        this.minusInput = this.io.createNegate();
        this.minusInputPlusLowIn = this.io.createAdd();
        this.inputs[0].connect(this.minusInput);
        this.minusInput.connect(this.minusInputPlusLowIn, 0, 0);
        this._lowIn.connect(this.minusInputPlusLowIn, 0, 1);

        // (highIn - lowIn)
        this.highInMinusLowIn = this.io.createSubtract();
        this._highIn.connect(this.highInMinusLowIn, 0, 0);
        this._lowIn.connect(this.highInMinusLowIn, 0, 1);

        // ((input - lowIn) / (highIn - lowIn))
        this.divide = this.io.createDivide();
        this.inputMinusLowIn.connect(this.divide, 0, 0);
        this.highInMinusLowIn.connect(this.divide, 0, 1);

        // (-input + lowIn) / (highIn - lowIn)
        this.negativeDivide = this.io.createDivide();
        this.minusInputPlusLowIn.connect(this.negativeDivide, 0, 0);
        this.highInMinusLowIn.connect(this.negativeDivide, 0, 1);

        // (highOut - lowOut)
        this.highOutMinusLowOut = this.io.createSubtract();
        this._highOut.connect(this.highOutMinusLowOut, 0, 0);
        this._lowOut.connect(this.highOutMinusLowOut, 0, 1);

        // Math.pow( (input - lowIn) / (highIn - lowIn), exp)
        this.pow = this.io.createPow(exponent);
        this.divide.connect(this.pow);

        // -(Math.pow( (-input + lowIn) / (highIn - lowIn), exp))
        this.negativePowNegate = this.io.createNegate();
        this.negativePow = this.io.createPow(exponent);
        this.negativeDivide.connect(this.negativePow);
        this.negativePow.connect(this.negativePowNegate);

        // lowOut + (highOut - lowOut) * Math.pow( (input - lowIn) / (highIn - lowIn), exp);
        this.elseIfBranch = this.io.createAdd();
        this.elseIfMultiply = this.io.createMultiply();
        this.highOutMinusLowOut.connect(this.elseIfMultiply, 0, 0);
        this.pow.connect(this.elseIfMultiply, 0, 1);
        this._lowOut.connect(this.elseIfBranch, 0, 0);
        this.elseIfMultiply.connect(this.elseIfBranch, 0, 1);

        // lowOut + (highOut - lowOut) * -(Math.pow( (-input + lowIn) / (highIn - lowIn), exp));
        this.elseBranch = this.io.createAdd();
        this.elseMultiply = this.io.createMultiply();
        this.highOutMinusLowOut.connect(this.elseMultiply, 0, 0);
        this.negativePowNegate.connect(this.elseMultiply, 0, 1);
        this._lowOut.connect(this.elseBranch, 0, 0);
        this.elseMultiply.connect(this.elseBranch, 0, 1);

        // else if( (input - lowIn) / (highIn - lowIn) > 0 ) {
        this.greaterThanZero = this.io.createGreaterThanZero();
        this.ifGreaterThanZero = this.io.createIfElse();
        this.divide.connect(this.greaterThanZero);
        this.greaterThanZero.connect(this.ifGreaterThanZero["if"]);
        this.elseIfBranch.connect(this.ifGreaterThanZero.then);
        this.elseBranch.connect(this.ifGreaterThanZero["else"]);

        // if((input - lowIn) / (highIn - lowIn) === 0)
        this.equalsZero = this.io.createEqualToZero();
        this.ifEqualsZero = this.io.createIfElse();
        this.divide.connect(this.equalsZero);
        this.equalsZero.connect(this.ifEqualsZero["if"]);
        this._lowOut.connect(this.ifEqualsZero.then);
        this.ifGreaterThanZero.connect(this.ifEqualsZero["else"]);

        this.ifEqualsZero.connect(this.outputs[0]);
    }

    _inherits(ScaleExp, _Node);

    ScaleExp.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        this._lowIn.cleanUp();
        this._highIn.cleanUp();
        this._lowOut.cleanUp();
        this._highOut.cleanUp();
        this._exponent.cleanUp();
        this.inputMinusLowIn.cleanUp();
        this.minusInput.cleanUp();
        this.minusInputPlusLowIn.cleanUp();
        this.highInMinusLowIn.cleanUp();
        this.divide.cleanUp();
        this.negativeDivide.cleanUp();
        this.highOutMinusLowOut.cleanUp();
        this.pow.cleanUp();
        this.negativePowNegate.cleanUp();
        this.negativePow.cleanUp();
        this.elseIfBranch.cleanUp();
        this.elseIfMultiply.cleanUp();
        this.elseBranch.cleanUp();
        this.greaterThanZero.cleanUp();
        this.ifGreaterThanZero.cleanUp();
        this.equalsZero.cleanUp();
        this.ifEqualsZero.cleanUp();

        this._lowIn = null;
        this._highIn = null;
        this._lowOut = null;
        this._highOut = null;
        this._exponent = null;
        this.inputMinusLowIn = null;
        this.minusInput = null;
        this.minusInputPlusLowIn = null;
        this.highInMinusLowIn = null;
        this.divide = null;
        this.negativeDivide = null;
        this.highOutMinusLowOut = null;
        this.pow = null;
        this.negativePowNegate = null;
        this.negativePow = null;
        this.elseIfBranch = null;
        this.elseIfMultiply = null;
        this.elseBranch = null;
        this.greaterThanZero = null;
        this.ifGreaterThanZero = null;
        this.equalsZero = null;
        this.ifEqualsZero = null;
    };

    _createClass(ScaleExp, [{
        key: "lowIn",
        get: function get() {
            return this._lowIn.value;
        },
        set: function set(value) {
            this._lowIn.value = value;
        }
    }, {
        key: "highIn",
        get: function get() {
            return this._highIn.value;
        },
        set: function set(value) {
            this._highIn.value = value;
        }
    }, {
        key: "lowOut",
        get: function get() {
            return this._lowOut.value;
        },
        set: function set(value) {
            this._lowOut.value = value;
        }
    }, {
        key: "highOut",
        get: function get() {
            return this._highOut.value;
        },
        set: function set(value) {
            this._highOut.value = value;
        }
    }, {
        key: "exponent",
        get: function get() {
            return this._exponent.value;
        },
        set: function set(value) {
            this._exponent.value = value;
            this.pow.value = value;
            this.negativePow.value = value;
        }
    }]);

    return ScaleExp;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createScaleExp = function (lowIn, highIn, lowOut, highOut, exponent) {
    return new ScaleExp(this, lowIn, highIn, lowOut, highOut, exponent);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],41:[function(require,module,exports){
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

        this.shaper = this.io.createWaveShaper(function (x) {
            return Math.sign(x);
        }, 4096);

        this.ifElse = this.io.createIfElse();
        this.equalToZero = this.io.createEqualToZero();

        this.inputs[0].connect(this.equalToZero);
        this.inputs[0].connect(this.ifElse.then);
        this.inputs[0].connect(this.shaper);

        this.equalToZero.connect(this.ifElse["if"]);
        this.shaper.connect(this.ifElse["else"]);
        this.ifElse.connect(this.outputs[0]);
    }

    _inherits(Sign, _Node);

    Sign.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
        this.shaper.cleanUp();
        this.shaper = null;
    };

    return Sign;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSign = function (accuracy) {
    return new Sign(this, accuracy);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],42:[function(require,module,exports){
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

    _inherits(Sqrt, _Node);

    Sqrt.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        this.x0.cleanUp();

        this.steps[0] = null;

        for (var i = this.steps.length - 1; i >= 1; --i) {
            this.steps[i].cleanUp();
            this.steps[i] = null;
        }

        this.x0 = null;
        this.steps = null;
    };

    return Sqrt;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSqrt = function (significantFigures, maxInput) {
    return new Sqrt(this, significantFigures, maxInput);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],43:[function(require,module,exports){
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

        this.multiply = this.io.createMultiply();
        this.inputs[0].connect(this.multiply, 0, 0);
        this.inputs[0].connect(this.multiply, 0, 1);
        this.multiply.connect(this.outputs[0]);
    }

    _inherits(Square, _Node);

    Square.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
        this.multiply.cleanUp();
        this.multiply = null;
    };

    return Square;
})(_coreNodeEs62["default"]);

_coreAudioIOEs62["default"].prototype.createSquare = function () {
    return new Square(this);
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

/**
 * Subtracts the second input from the first.
 *
 * @param {Object} io Instance of AudioIO.
 */

var Subtract = (function (_Node) {
    function Subtract(io, value) {
        _classCallCheck(this, Subtract);

        _Node.call(this, io, 1, 1);

        this.negate = this.io.createNegate();

        this.inputs[1] = this.io.createParam(value);

        this.inputs[0].connect(this.outputs[0]);
        this.inputs[1].connect(this.negate);
        this.negate.connect(this.outputs[0]);

        this.controls.value = this.inputs[1];
    }

    _inherits(Subtract, _Node);

    Subtract.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
        this.negate.cleanUp();

        this.controls.value = null;
        this.negate = null;
    };

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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],45:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var Switch = (function (_Node) {
    function Switch(io, numCases) {
        var startingCase = arguments[2] === undefined ? 0 : arguments[2];

        _classCallCheck(this, Switch);

        _Node.call(this, io, 1, 1);

        // Ensure startingCase is never < 0
        startingCase = Math.abs(startingCase);

        this.cases = [];
        this.controls.index = this.io.createParam(startingCase);

        for (var i = 0; i < numCases; ++i) {
            this.inputs[i] = this.context.createGain();
            this.inputs[i].gain.value = 0.0;
            this.cases[i] = this.io.createEqualTo(i);
            this.cases[i].connect(this.inputs[i].gain);
            this.controls.index.connect(this.cases[i]);
            this.inputs[i].connect(this.outputs[0]);
        }
    }

    _inherits(Switch, _Node);

    Switch.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        for (var i = this.cases.length - 1; i >= 0; --i) {
            this.cases[i].cleanUp();
            this.cases[i] = null;
        }

        this.controls.index.cleanUp();
        this.controls.index = null;
        this.cases = null;
    };

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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],46:[function(require,module,exports){
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

    AND.prototype.cleanUp = function cleanUp() {
        _LogicalOperator.prototype.cleanUp.call(this);

        var graph = this.getGraph(this);

        graph.multiply.cleanUp();
        graph.multiply = null;
    };

    return AND;
})(_LogicalOperatorEs62["default"]);

exports["default"] = AND;

AudioIO.prototype.createAND = function () {
    return new AND(this);
};
module.exports = exports["default"];

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":47}],47:[function(require,module,exports){
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

    LogicalOperator.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        var graph = this.getGraph();
        graph.clamp.cleanUp();
        graph.clamp = null;
    };

    return LogicalOperator;
})(_coreNodeEs62["default"]);

exports["default"] = LogicalOperator;

AudioIO.prototype.createLogicalOperator = function () {
    return new LogicalOperator(this);
};
module.exports = exports["default"];

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],48:[function(require,module,exports){
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
        console.log(this, graph);

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

    NOT.prototype.cleanUp = function cleanUp() {
        _LogicalOperator.prototype.cleanUp.call(this);
        // this.abs.cleanUp();
        // this.abs = null;

        var graph = this.getGraph();

        graph.subtract.cleanUp();
        graph.abs.cleanUp();
        graph.round.cleanUp();
        graph.subtract = null;
        graph.abs = null;
        graph.round = null;
    };

    return NOT;
})(_LogicalOperatorEs62["default"]);

exports["default"] = NOT;

AudioIO.prototype.createNOT = function () {
    return new NOT(this);
};
module.exports = exports["default"];

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":47}],49:[function(require,module,exports){
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

    OR.prototype.cleanUp = function cleanUp() {
        _LogicalOperator.prototype.cleanUp.call(this);

        var graph = this.getGraph();

        graph.equalTo.cleanUp();
        graph.equalTo = null;

        graph.max.cleanUp();
        graph.max = null;
    };

    return OR;
})(_LogicalOperatorEs62["default"]);

exports["default"] = OR;

AudioIO.prototype.createOR = function () {
    return new OR(this);
};
module.exports = exports["default"];

},{"../../core/AudioIO.es6":1,"./LogicalOperator.es6":47}],50:[function(require,module,exports){
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

        _Node.call(this, io, 1, 0);

        // TODO
        //  - Rename this.
        this.control = this.io.createParam(value), this.inversion = this.context.createGain();

        this.inversion.gain.value = -1;

        // This curve outputs 0.5 when input is 0,
        // so it has to be piped into a node that
        // transforms it into 1, and leaves zeros
        // alone.
        this.shaper = this.io.createWaveShaper(this.io.curves.EqualToZero);

        this.outputs[0] = this.io.createGreaterThanZero();
        this.control.connect(this.inversion);
        this.inversion.connect(this.inputs[0]);

        this.inputs[0].connect(this.shaper);
        this.shaper.connect(this.outputs[0]);

        this.controls.value = this.control;
    }

    _inherits(EqualTo, _Node);

    EqualTo.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        this.shaper.cleanUp();
        this.control.cleanUp();

        this.inversion.disconnect();
        this.inversion = null;
        this.shaper = null;
        this.control = null;
    };

    _createClass(EqualTo, [{
        key: "value",
        get: function get() {
            return this.control.value;
        },
        set: function set(value) {
            this.control.setValueAtTime(value, this.context.currentTime);
        }
    }]);

    return EqualTo;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createEqualTo = function (value) {
    return new EqualTo(this, value);
};

exports["default"] = EqualTo;
module.exports = exports["default"];

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],51:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2,"./EqualTo.es6":50}],52:[function(require,module,exports){
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

        _Node.call(this, io, 1, 0);

        this.controls.value = this.io.createParam(value);
        this.inversion = this.context.createGain();

        this.inversion.gain.value = -1;

        this.inputs[0].gain.value = 100000;
        this.outputs[0] = this.io.createWaveShaper(this.io.curves.GreaterThanZero);

        this.controls.value.connect(this.inversion);
        this.inversion.connect(this.inputs[0]);
        this.inputs[0].connect(this.outputs[0]);
    }

    _inherits(GreaterThan, _Node);

    GreaterThan.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        this.controls.value.cleanUp();
        this.controls.value = null;

        this.inversion.disconnect();
        this.inversion = null;
    };

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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],53:[function(require,module,exports){
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

        _Node.call(this, io, 1, 0);
        this.inputs[0].gain.value = 100000;
        this.outputs[0] = this.io.createWaveShaper(this.io.curves.GreaterThanZero);
        this.inputs[0].connect(this.outputs[0]);
    }

    _inherits(GreaterThanZero, _Node);

    return GreaterThanZero;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createGreaterThanZero = function () {
    return new GreaterThanZero(this);
};

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],54:[function(require,module,exports){
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

        this["switch"] = this.io.createSwitch(2, 0);

        this["if"] = this.io.createEqualToZero();
        this["if"].connect(this["switch"].control);
        this.then = this["switch"].inputs[0];
        this["else"] = this["switch"].inputs[1];

        this.inputs = this["switch"].inputs;
        this.outputs = this["switch"].outputs;
    }

    _inherits(IfElse, _Node);

    IfElse.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        this["switch"].cleanUp();
        this["if"].cleanUp();

        this["if"] = null;
        this.then = null;
        this["else"] = null;
        this.inputs = null;
        this.outputs = null;
        this["switch"] = null;
    };

    return IfElse;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createIfElse = function () {
    return new IfElse(this);
};

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],55:[function(require,module,exports){
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

        _Node.call(this, io, 1, 0);

        this.controls.value = this.io.createParam(value);

        this.valueInversion = this.context.createGain();
        this.valueInversion.gain.value = -1;

        this.controls.value.connect(this.valueInversion);

        this.inputs[0].gain.value = -100000;
        this.outputs[0] = this.io.createWaveShaper(this.io.curves.GreaterThanZero);

        this.valueInversion.connect(this.inputs[0]);
        this.inputs[0].connect(this.outputs[0]);
    }

    _inherits(LessThan, _Node);

    LessThan.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
        this.controls.value.cleanUp();
        this.controls.value = null;
    };

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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],56:[function(require,module,exports){
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

        _Node.call(this, io, 1, 0);

        this.inputs[0].gain.value = -100000;
        this.outputs[0] = this.io.createWaveShaper(this.io.curves.GreaterThanZero);

        this.inputs[0].connect(this.outputs[0]);
    }

    _inherits(LessThanZero, _Node);

    return LessThanZero;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createLessThanZero = function () {
    return new LessThanZero(this);
};

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],57:[function(require,module,exports){
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

        this.inputs[0] = this.io.createParam(value);

        this.square = this.io.createSquare();

        this.const1 = this.io.createConstant(-2.605e-7);
        this.const2 = this.io.createConstant(2.47609e-5);
        this.const3 = this.io.createConstant(-0.00138884);
        this.const4 = this.io.createConstant(0.0416666);
        this.const5 = this.io.createConstant(-0.499923);
        this.const6 = this.io.createConstant(1);

        this.multiply1 = this.io.createMultiply();
        this.multiply2 = this.io.createMultiply();
        this.multiply3 = this.io.createMultiply();
        this.multiply4 = this.io.createMultiply();
        this.multiply5 = this.io.createMultiply();

        this.add1 = this.io.createAdd();
        this.add2 = this.io.createAdd();
        this.add3 = this.io.createAdd();
        this.add4 = this.io.createAdd();
        this.add5 = this.io.createAdd();

        this.inputs[0].connect(this.square);

        this.const5.connect(this.add4, 0, 1);
        this.const6.connect(this.add5, 0, 1);

        // Connect multiply1's inputs
        this.square.connect(this.multiply1, 0, 0);
        this.const1.connect(this.multiply1, 0, 1);

        // Connect add1's inputs
        this.multiply1.connect(this.add1, 0, 0);
        this.const2.connect(this.add1, 0, 1);

        // Connect up multiply2's inputs
        this.square.connect(this.multiply2, 0, 0);
        this.add1.connect(this.multiply2, 0, 1);

        // Connect up add2's inputs
        this.multiply2.connect(this.add2, 0, 0);
        this.const3.connect(this.add2, 0, 1);

        // Connect up multiply3's inputs
        this.square.connect(this.multiply3, 0, 0);
        this.add2.connect(this.multiply3, 0, 1);

        // Connect add3's inputs
        this.multiply3.connect(this.add3, 0, 0);
        this.const4.connect(this.add3, 0, 1);

        // Connect multiply4's inputs
        this.square.connect(this.multiply4, 0, 0);
        this.add3.connect(this.multiply4, 0, 1);

        // add4's inputs
        this.multiply4.connect(this.add4, 0, 0);
        this.const5.connect(this.add4, 0, 1);

        // multiply5's inputs
        this.square.connect(this.multiply5, 0, 0);
        this.add4.connect(this.multiply5, 0, 1);

        // add5's inputs
        this.multiply5.connect(this.add5, 0, 0);
        this.const6.connect(this.add5, 0, 1);

        // Output (finally!!)
        this.add5.connect(this.outputs[0]);

        // Store controllable params.
        this.controls.value = this.inputs[0];
    }

    _inherits(Cos, _Node);

    Cos.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
    };

    return Cos;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createCos = function (value) {
    return new Cos(this, value);
};

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],58:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],59:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],60:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../../core/AudioIO.es6");

var _coreNodeEs6 = require("../../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// Sine approximation!
//
// Only works in range of -Math.PI to Math.PI.

var Sine = (function (_Node) {

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function Sine(io, value) {
        _classCallCheck(this, Sine);

        _Node.call(this, io, 0, 1);

        this.inputs[0] = this.controls.value = this.io.createParam(value);

        this.square = this.io.createSquare();

        this.const1 = this.io.createConstant(-2.39e-8);
        this.const2 = this.io.createConstant(2.7526e-6);
        this.const3 = this.io.createConstant(-0.000198409);
        this.const4 = this.io.createConstant(0.00833333);
        this.const5 = this.io.createConstant(-0.166667);
        this.const6 = this.io.createConstant(1);

        this.multiply1 = this.io.createMultiply();
        this.multiply2 = this.io.createMultiply();
        this.multiply3 = this.io.createMultiply();
        this.multiply4 = this.io.createMultiply();
        this.multiply5 = this.io.createMultiply();
        this.multiply6 = this.io.createMultiply();

        this.add1 = this.io.createAdd();
        this.add2 = this.io.createAdd();
        this.add3 = this.io.createAdd();
        this.add4 = this.io.createAdd();
        this.add5 = this.io.createAdd();

        this.inputs[0].connect(this.square);

        this.const5.connect(this.add4, 0, 1);
        this.const6.connect(this.add5, 0, 1);

        // Connect multiply1's inputs
        this.square.connect(this.multiply1, 0, 0);
        this.const1.connect(this.multiply1, 0, 1);

        // Connect add1's inputs
        this.multiply1.connect(this.add1, 0, 0);
        this.const2.connect(this.add1, 0, 1);

        // Connect up multiply2's inputs
        this.square.connect(this.multiply2, 0, 0);
        this.add1.connect(this.multiply2, 0, 1);

        // Connect up add2's inputs
        this.multiply2.connect(this.add2, 0, 0);
        this.const3.connect(this.add2, 0, 1);

        // Connect up multiply3's inputs
        this.square.connect(this.multiply3, 0, 0);
        this.add2.connect(this.multiply3, 0, 1);

        // Connect add3's inputs
        this.multiply3.connect(this.add3, 0, 0);
        this.const4.connect(this.add3, 0, 1);

        // Connect multiply4's inputs
        this.square.connect(this.multiply4, 0, 0);
        this.add3.connect(this.multiply4, 0, 1);

        // add4's inputs
        this.multiply4.connect(this.add4, 0, 0);
        this.const5.connect(this.add4, 0, 1);

        // multiply5's inputs
        this.square.connect(this.multiply5, 0, 0);
        this.add4.connect(this.multiply5, 0, 1);

        // add5's inputs
        this.multiply5.connect(this.add5, 0, 0);
        this.const6.connect(this.add5, 0, 1);

        // multiply6's inputs
        this.inputs[0].connect(this.multiply6, 0, 0);
        this.add5.connect(this.multiply6, 0, 1);

        // Output (finally!!)
        this.multiply6.connect(this.outputs[0]);
    }

    _inherits(Sine, _Node);

    Sine.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
    };

    return Sine;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createSine = function (value) {
    return new Sine(this, value);
};

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],61:[function(require,module,exports){
"use strict";

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

        this.inputs[0] = this.controls.value = this.io.createParam(value);

        this.sine = this.io.createSine();
        this.cos = this.io.createCos();
        this.divide = this.io.createDivide(undefined, Math.PI * 2);

        this.inputs[0].connect(this.sine);
        this.inputs[0].connect(this.cos);
        this.sine.connect(this.divide, 0, 0);
        this.cos.connect(this.divide, 0, 1);

        this.divide.connect(this.outputs[0]);

        // this.square = this.io.createSquare();
        // this.inputs[ 0 ].connect( this.square );

        // this.multiply1 = this.io.createMultiply();
        // this.multiplyThird = this.io.createMultiply( 0.333333 );
        // this.multiply2 = this.io.createMultiply();
        // this.multiplyOneThree = this.io.createMultiply( 0.133333 );
        // this.add1 = this.io.createAdd();
        // this.add2 = this.io.createAdd();

        // this.square.connect( this.multiply1, 0, 0 );
        // this.inputs[ 0 ].connect( this.multiply1, 0, 1 );

        // this.square.connect( this.multiply2, 0, 0 );
        // this.multiply1.connect( this.multiply2, 0, 1 );

        // this.multiply1.connect( this.multiplyThird );
        // this.multiply2.connect( this.multiplyOneThree );

        // this.multiplyThird.connect( this.add1, 0, 0 );
        // this.multiplyOneThree.connect( this.add1, 0, 1 );

        // this.add1.connect( this.add2, 0, 0 );
        // this.inputs[ 0 ].connect( this.add2, 0, 1 );

        // this.add2.connect( this.outputs[ 0 ] );
    }

    _inherits(Tan, _Node);

    Tan.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);

        this.controls.value.cleanUp();
        this.controls.value = null;
    };

    return Tan;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createTan = function (value) {
    return new Tan(this, value);
};

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],62:[function(require,module,exports){
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

},{"../core/config.es6":5}],63:[function(require,module,exports){
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

},{}],64:[function(require,module,exports){
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
        } else {
            console.error('ASSERT NOT REACHED');
            console.log(arguments);
            console.trace();
        }
    }
};
module.exports = exports['default'];

},{}],65:[function(require,module,exports){
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

},{"../core/config.es6":5,"./math.es6":66,"./noteRegExp.es6":67,"./noteStrings.es6":68,"./notes.es6":69}],66:[function(require,module,exports){
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

},{"../core/config.es6":5}],67:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = /^([A|B|C|D|E|F|G]{1})([#bx]{0,2})([\-\+]?\d+)?([\+|\-]{1}\d*.\d*)?/;
module.exports = exports["default"];

},{}],68:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
module.exports = exports['default'];

},{}],69:[function(require,module,exports){
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

},{}],70:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = _setIO;

function _setIO(io) {
    this.io = io;
    this.context = io.context;
}

;
module.exports = exports["default"];

},{}],71:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/math.es6":66}]},{},[21])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9jb3JlL0F1ZGlvSU8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvY29yZS9Ob2RlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvUGFyYW0uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvY29yZS9XYXZlU2hhcGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvY29uZmlnLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvb3ZlcnJpZGVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvc2lnbmFsQ3VydmVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2VudmVsb3Blcy9BU0RSRW52ZWxvcGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZW52ZWxvcGVzL0N1c3RvbUVudmVsb3BlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L0RlbGF5LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L1BpbmdQb25nRGVsYXkuZXM2LmpzIiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ2VuZXJhdG9ycy9Pc2NpbGxhdG9yR2VuZXJhdG9yLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9Db3VudGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9Dcm9zc2ZhZGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9EaWZmdXNlRGVsYXkuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL0RyeVdldE5vZGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL0VRU2hlbGYuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL09zY2lsbGF0b3JCYW5rLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9QaGFzZU9mZnNldC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9pbnN0cnVtZW50cy9HZW5lcmF0b3JQbGF5ZXIuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWFpbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0Ficy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0FkZC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0F2ZXJhZ2UuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9BdmVyYWdlMi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0NsYW1wLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvQ29uc3RhbnQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9EaXZpZGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9GbG9vci5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0xlcnAuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9NYXguZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9NaW4uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9NdWx0aXBseS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL05lZ2F0ZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1Bvdy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1JlY2lwcm9jYWwuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9Sb3VuZC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1NhbXBsZURlbGF5LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU2NhbGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TY2FsZUV4cC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1NpZ24uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TcXJ0LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU3F1YXJlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU3VidHJhY3QuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9Td2l0Y2guZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9BTkQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9Mb2dpY2FsT3BlcmF0b3IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OT1QuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9PUi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0VxdWFsVG8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9FcXVhbFRvWmVyby5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvR3JlYXRlclRoYW5aZXJvLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvSWZFbHNlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvTGVzc1RoYW4uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhblplcm8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC90cmlnb25vbWV0cnkvQ29zLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L0RlZ1RvUmFkLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L1JhZFRvRGVnLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L1NpbmUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC90cmlnb25vbWV0cnkvVGFuLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9NYXRoLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9jbGVhbmVycy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvY29ubmVjdGlvbnMuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL2NvbnZlcnNpb25zLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9tYXRoLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9ub3RlUmVnRXhwLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9ub3RlU3RyaW5ncy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvbm90ZXMuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL3NldElPLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL29zY2lsbGF0b3JzL05vaXNlT3NjaWxsYXRvci5lczYiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7O3lCQ0FtQixjQUFjOzs7O1FBQzFCLGlCQUFpQjs7K0JBQ0Msb0JBQW9COzs7O29DQUNyQiwyQkFBMkI7Ozs7NkJBQ2xDLG9CQUFvQjs7OztJQUUvQixPQUFPO0FBZUUsYUFmVCxPQUFPLEdBZW1DO1lBQS9CLE9BQU8sZ0NBQUcsSUFBSSxZQUFZLEVBQUU7OzhCQWZ2QyxPQUFPOztBQWdCTCxZQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQzs7QUFFeEIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQzs7Ozs7Ozs7OztBQVV4QyxjQUFNLENBQUMsY0FBYyxDQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtBQUMzQyxxQkFBUyxFQUFFLEtBQUs7QUFDaEIsZUFBRyxFQUFJLENBQUEsWUFBVztBQUNkLG9CQUFJLGNBQWMsWUFBQSxDQUFDOztBQUVuQix1QkFBTyxZQUFXO0FBQ2Qsd0JBQUssQ0FBQyxjQUFjLElBQUksY0FBYyxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUMsT0FBTyxFQUFHO0FBQzlELHNDQUFjLEdBQUcsSUFBSSxDQUFDOztBQUV0Qiw0QkFBSSxRQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU87NEJBQ3RCLE1BQU0sR0FBRyxRQUFPLENBQUMsWUFBWSxDQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBTyxDQUFDLFVBQVUsQ0FBRTs0QkFDNUQsVUFBVSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUUsQ0FBQyxDQUFFOzRCQUN2QyxZQUFZLEdBQUcsUUFBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7O0FBRWhELDZCQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRztBQUMxQyxzQ0FBVSxDQUFFLENBQUMsQ0FBRSxHQUFHLEdBQUcsQ0FBQzt5QkFDekI7Ozs7OztBQU1ELG9DQUFZLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztBQUM3QixvQ0FBWSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDekIsb0NBQVksQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXhCLHNDQUFjLEdBQUcsWUFBWSxDQUFDO3FCQUNqQzs7QUFFRCwyQkFBTyxjQUFjLENBQUM7aUJBQ3pCLENBQUE7YUFDSixDQUFBLEVBQUUsQUFBRTtTQUNSLENBQUUsQ0FBQztLQUNQOztBQTdEQyxXQUFPLENBRUYsS0FBSyxHQUFBLGVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRztBQUMzQixhQUFNLElBQUksQ0FBQyxJQUFJLE1BQU0sRUFBRztBQUNwQixnQkFBSyxNQUFNLENBQUMsY0FBYyxDQUFFLENBQUMsQ0FBRSxFQUFHO0FBQzlCLHNCQUFNLENBQUUsQ0FBQyxDQUFFLEdBQUcsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDO2FBQzdCO1NBQ0o7S0FDSjs7QUFSQyxXQUFPLENBVUYsV0FBVyxHQUFBLHFCQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFHO0FBQ3ZDLGNBQU0sQ0FBRSxJQUFJLENBQUUsR0FBRyxNQUFNLENBQUM7S0FDM0I7O2lCQVpDLE9BQU87O2FBaUVFLGVBQUc7QUFDVixtQkFBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1NBQ3hCO2FBRVUsYUFBRSxPQUFPLEVBQUc7QUFDbkIsZ0JBQUssRUFBRyxPQUFPLFlBQVksWUFBWSxDQUFBLEFBQUUsRUFBRztBQUN4QyxzQkFBTSxJQUFJLEtBQUssQ0FBRSw4QkFBOEIsR0FBRyxPQUFPLENBQUUsQ0FBQzthQUMvRDs7QUFFRCxnQkFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7QUFDeEIsZ0JBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQztTQUNyQzs7O1dBNUVDLE9BQU87OztBQStFYixPQUFPLENBQUMsV0FBVyxDQUFFLE9BQU8sQ0FBQyxTQUFTLGdDQUFnQixRQUFRLENBQUUsQ0FBQztBQUNqRSxPQUFPLENBQUMsV0FBVyxDQUFFLE9BQU8sQ0FBQyxTQUFTLHFDQUFlLFNBQVMsQ0FBRSxDQUFDO0FBQ2pFLE9BQU8sQ0FBQyxXQUFXLENBQUUsT0FBTyxDQUFDLFNBQVMsOEJBQVEsTUFBTSxDQUFFLENBQUM7O0FBSXZELE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO3FCQUNWLE9BQU87Ozs7Ozs7Ozs7Ozs7OzBCQzVGRixlQUFlOzs7OzhCQUNoQixxQkFBcUI7Ozs7b0NBQ2hCLDJCQUEyQjs7OztpQ0FDOUIsd0JBQXdCOzs7O0FBRTdDLElBQUksTUFBTSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7O0lBRXJCLElBQUk7QUFDSyxhQURULElBQUksQ0FDTyxFQUFFLEVBQWtDO1lBQWhDLFNBQVMsZ0NBQUcsQ0FBQztZQUFFLFVBQVUsZ0NBQUcsQ0FBQzs7OEJBRDVDLElBQUk7O0FBRUYsWUFBSSxDQUFDLE1BQU0sQ0FBRSxFQUFFLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDakIsWUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Ozs7QUFJbEIsWUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7Ozs7OztBQU1uQixZQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztBQUN0QixZQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQzs7QUFFdkIsYUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRztBQUNsQyxnQkFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1NBQzFCOztBQUVELGFBQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQy9CLGdCQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztTQUMzQjtLQUNKOztBQXpCQyxRQUFJLFdBMkJOLFFBQVEsR0FBQSxrQkFBRSxLQUFLLEVBQUc7QUFDZCxjQUFNLENBQUMsR0FBRyxDQUFFLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQztLQUM3Qjs7QUE3QkMsUUFBSSxXQStCTixRQUFRLEdBQUEsb0JBQUc7QUFDUCxlQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUUsSUFBSSxDQUFFLElBQUksRUFBRSxDQUFDO0tBQ25DOztBQWpDQyxRQUFJLFdBbUNOLGVBQWUsR0FBQSwyQkFBRztBQUNkLFlBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUUsQ0FBQztLQUNqRDs7QUFyQ0MsUUFBSSxXQXVDTixnQkFBZ0IsR0FBQSw0QkFBRztBQUNmLFlBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUUsQ0FBQztLQUNsRDs7QUF6Q0MsUUFBSSxXQTJDTixPQUFPLEdBQUEsbUJBQUc7QUFDTixZQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDdEIsWUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2hCLFlBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztLQUNyQjs7aUJBL0NDLElBQUk7O2FBa0RZLGVBQUc7QUFDakIsbUJBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7U0FDN0I7OzthQUNrQixlQUFHO0FBQ2xCLG1CQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1NBQzlCOzs7YUFFYSxlQUFHO0FBQ2IsbUJBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztTQUNsRTthQUNhLGFBQUUsS0FBSyxFQUFHO0FBQ3BCLGlCQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDM0Msb0JBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO2FBQ3hFO1NBQ0o7OzthQUVjLGVBQUc7QUFDZCxtQkFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1NBQ3BFO2FBQ2MsYUFBRSxLQUFLLEVBQUc7QUFDckIsaUJBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRztBQUM1QyxvQkFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7YUFDMUU7U0FDSjs7O2FBRW1CLGVBQUc7QUFDbkIsbUJBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQ25CLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQ2pDLElBQUksQ0FBQztTQUNaO2FBQ21CLGFBQUUsUUFBUSxFQUFHO0FBQzdCLGlCQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRztBQUNyRCxxQkFBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDO0FBQzlCLGlCQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztBQUNoQixxQkFBSyxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFLLFFBQVEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQU8sUUFBUSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQUFBRSxDQUFDO2FBQ3ZFO1NBQ0o7OzthQUVvQixlQUFHO0FBQ3BCLG1CQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUNwQixJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUNsQyxJQUFJLENBQUM7U0FDWjs7OzthQUlvQixhQUFFLFFBQVEsRUFBRztBQUM5QixpQkFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRztBQUMvQyxpQkFBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUNqQyxvQkFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUssUUFBUSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBTyxRQUFRLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxBQUFFLENBQUM7YUFDeEY7U0FDSjs7O1dBckdDLElBQUk7OztBQXdHVix3QkFBUSxXQUFXLENBQUUsSUFBSSxDQUFDLFNBQVMsK0JBQVUsUUFBUSxDQUFFLENBQUM7QUFDeEQsd0JBQVEsV0FBVyxDQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsK0JBQVMsYUFBYSxFQUFFLGdCQUFnQixDQUFFLENBQUM7QUFDaEYsd0JBQVEsV0FBVyxDQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsK0JBQVMsT0FBTyxFQUFFLFVBQVUsQ0FBRSxDQUFDO0FBQ3BFLHdCQUFRLEtBQUssQ0FBRSxJQUFJLENBQUMsU0FBUyxvQ0FBZSxDQUFDOztBQUc3Qyx3QkFBUSxTQUFTLENBQUMsVUFBVSxHQUFHLFVBQVUsU0FBUyxFQUFFLFVBQVUsRUFBRztBQUM3RCxXQUFPLElBQUksSUFBSSxDQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFFLENBQUM7Q0FDbEQsQ0FBQzs7cUJBRWEsSUFBSTs7Ozs7Ozs7Ozs7Ozs7MEJDekhDLGVBQWU7Ozs7OEJBQ2hCLHFCQUFxQjs7OztvQ0FDaEIsMkJBQTJCOzs7O2lDQUM5Qix3QkFBd0I7Ozs7SUFHdkMsS0FBSztBQUNJLGFBRFQsS0FBSyxDQUNNLEVBQUUsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFHOzhCQURyQyxLQUFLOztBQUVILFlBQUksQ0FBQyxNQUFNLENBQUUsRUFBRSxDQUFFLENBQUM7O0FBRWxCLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUUsQ0FBQztBQUMzRCxZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBY2pDLFlBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxLQUFLLEtBQUssUUFBUSxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDdEQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7O0FBRXZDLFlBQUksQ0FBQyxjQUFjLENBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDO0FBQzdELFlBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxZQUFZLEtBQUssUUFBUSxHQUFHLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7Ozs7O0FBTXRHLFlBQUssT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFHO0FBQzdCLGdCQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBRSxDQUFDO1NBQ25EO0tBQ0o7O0FBaENDLFNBQUssV0FtQ1AsS0FBSyxHQUFBLGlCQUFHO0FBQ0osWUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQy9CLGVBQU8sSUFBSSxDQUFDO0tBQ2Y7O0FBdENDLFNBQUssV0F3Q1AsT0FBTyxHQUFBLG1CQUFHO0FBQ04sWUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3RCLFlBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNoQixZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztBQUNuQixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztBQUNyQixZQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQzs7QUFFekIsWUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0tBQ3JCOztBQWhEQyxTQUFLLFdBa0RQLGNBQWMsR0FBQSx3QkFBRSxLQUFLLEVBQUUsU0FBUyxFQUFHO0FBQy9CLFlBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0FBQ3BCLFlBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBRSxLQUFLLEVBQUUsU0FBUyxDQUFFLENBQUM7QUFDdEQsZUFBTyxJQUFJLENBQUM7S0FDZjs7QUF0REMsU0FBSyxXQXdEUCx1QkFBdUIsR0FBQSxpQ0FBRSxLQUFLLEVBQUUsT0FBTyxFQUFHO0FBQ3RDLFlBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0FBQ3BCLFlBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFFLEtBQUssRUFBRSxPQUFPLENBQUUsQ0FBQztBQUM3RCxlQUFPLElBQUksQ0FBQztLQUNmOztBQTVEQyxTQUFLLFdBOERQLDRCQUE0QixHQUFBLHNDQUFFLEtBQUssRUFBRSxPQUFPLEVBQUc7QUFDM0MsWUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7QUFDcEIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBRSxDQUFDO0FBQ2xFLGVBQU8sSUFBSSxDQUFDO0tBQ2Y7O0FBbEVDLFNBQUssV0FvRVAsZUFBZSxHQUFBLHlCQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFHO0FBQzlDLFlBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0FBQ3BCLFlBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFlBQVksQ0FBRSxDQUFDO0FBQ3JFLGVBQU8sSUFBSSxDQUFDO0tBQ2Y7O0FBeEVDLFNBQUssV0EwRVAsbUJBQW1CLEdBQUEsNkJBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUc7QUFDL0MsWUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7QUFDcEIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUUsQ0FBQztBQUN0RSxlQUFPLElBQUksQ0FBQztLQUNmOztBQTlFQyxTQUFLLFdBZ0ZQLHFCQUFxQixHQUFBLCtCQUFFLFNBQVMsRUFBRztBQUMvQixZQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBRSxTQUFTLENBQUUsQ0FBQztBQUN0RCxlQUFPLElBQUksQ0FBQztLQUNmOztpQkFuRkMsS0FBSzs7YUFxRkUsZUFBRzs7QUFFUixtQkFBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1NBQ3RCO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7QUFDcEIsZ0JBQUksQ0FBQyxjQUFjLENBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFFLENBQUM7U0FDMUQ7OzthQUVVLGVBQUc7QUFDVixtQkFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztTQUM3Qjs7O1dBaEdDLEtBQUs7OztBQW9HWCx3QkFBUSxXQUFXLENBQUUsS0FBSyxDQUFDLFNBQVMsK0JBQVUsUUFBUSxDQUFFLENBQUM7QUFDekQsd0JBQVEsV0FBVyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsK0JBQVMsYUFBYSxFQUFFLGdCQUFnQixDQUFFLENBQUM7QUFDakYsd0JBQVEsV0FBVyxDQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsK0JBQVMsT0FBTyxFQUFFLFVBQVUsQ0FBRSxDQUFDO0FBQ3JFLHdCQUFRLEtBQUssQ0FBRSxLQUFLLENBQUMsU0FBUyxvQ0FBZSxDQUFDOztBQUU5Qyx3QkFBUSxTQUFTLENBQUMsV0FBVyxHQUFHLFVBQVUsS0FBSyxFQUFFLFlBQVksRUFBRztBQUM1RCxXQUFPLElBQUksS0FBSyxDQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFFLENBQUM7Q0FDakQsQ0FBQzs7cUJBRWEsS0FBSzs7Ozs7Ozs7Ozs7OzBCQ25IQSxlQUFlOzs7OzhCQUNoQixxQkFBcUI7Ozs7b0NBQ2hCLDJCQUEyQjs7OztpQ0FDOUIsd0JBQXdCOzs7O0lBRXZDLFVBQVU7QUFDRCxhQURULFVBQVUsQ0FDQyxFQUFFLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRzs4QkFEdkMsVUFBVTs7QUFFUixZQUFJLENBQUMsTUFBTSxDQUFFLEVBQUUsQ0FBRSxDQUFDOztBQUVsQixZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQzs7OztBQUk5QyxZQUFLLGVBQWUsWUFBWSxZQUFZLEVBQUc7QUFDM0MsZ0JBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLGVBQWUsQ0FBQztTQUN2Qzs7OzthQUlJLElBQUssT0FBTyxlQUFlLEtBQUssVUFBVSxFQUFHO0FBQzlDLGdCQUFJLEdBQUcsT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUM7O0FBRTdFLGdCQUFJLEtBQUssR0FBRyxJQUFJLFlBQVksQ0FBRSxJQUFJLENBQUU7Z0JBQ2hDLENBQUMsR0FBRyxDQUFDO2dCQUNMLENBQUMsR0FBRyxDQUFDLENBQUM7O0FBRVYsaUJBQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDckIsaUJBQUMsR0FBRyxBQUFFLENBQUMsR0FBRyxJQUFJLEdBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN6QixxQkFBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLGVBQWUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBRSxDQUFDO2FBQzlDOztBQUVELGdCQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDN0I7OzthQUdJO0FBQ0QsZ0JBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztTQUM3Qzs7QUFFRCxZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUM7S0FDaEQ7O0FBbkNDLGNBQVUsV0FxQ1osT0FBTyxHQUFBLG1CQUFHO0FBQ04sWUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3RCLFlBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNoQixZQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDbEIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7S0FDdEI7O2lCQTFDQyxVQUFVOzthQTRDSCxlQUFHO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7U0FDNUI7YUFDUSxhQUFFLEtBQUssRUFBRztBQUNmLGdCQUFJLEtBQUssWUFBWSxZQUFZLEVBQUc7QUFDaEMsb0JBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQzthQUM3QjtTQUNKOzs7V0FuREMsVUFBVTs7O0FBc0RoQix3QkFBUSxXQUFXLENBQUUsVUFBVSxDQUFDLFNBQVMsK0JBQVUsUUFBUSxDQUFFLENBQUM7QUFDOUQsd0JBQVEsV0FBVyxDQUFFLFVBQVUsQ0FBQyxTQUFTLEVBQUUsK0JBQVMsYUFBYSxFQUFFLGdCQUFnQixDQUFFLENBQUM7QUFDdEYsd0JBQVEsV0FBVyxDQUFFLFVBQVUsQ0FBQyxTQUFTLEVBQUUsK0JBQVMsT0FBTyxFQUFFLFVBQVUsQ0FBRSxDQUFDO0FBQzFFLHdCQUFRLEtBQUssQ0FBRSxVQUFVLENBQUMsU0FBUyxvQ0FBZSxDQUFDOztBQUVuRCx3QkFBUSxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxLQUFLLEVBQUUsSUFBSSxFQUFHO0FBQ3pELFdBQU8sSUFBSSxVQUFVLENBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUUsQ0FBQztDQUM5QyxDQUFDOzs7Ozs7cUJDbEVhO0FBQ1gsbUJBQWUsRUFBRSxJQUFJOzs7Ozs7QUFNckIsZ0JBQVksRUFBRSxDQUFDLENBQUM7Ozs7Ozs7O0FBUWhCLFdBQU8sRUFBRSxLQUFLOztBQUVkLG9CQUFnQixFQUFFLEdBQUc7Q0FDeEI7Ozs7Ozs7OztBQ2ZELEFBQUUsQ0FBQSxZQUFXO0FBQ1QsUUFBSSx3QkFBd0IsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLE9BQU87UUFDdEQsMkJBQTJCLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7O0FBRWpFLGFBQVMsQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFHLFVBQVUsSUFBSSxFQUF3QztZQUF0QyxhQUFhLGdDQUFHLENBQUM7WUFBRSxZQUFZLGdDQUFHLENBQUM7O0FBQzdFLFlBQUssSUFBSSxDQUFDLE1BQU0sRUFBRztBQUNmLGdCQUFLLEtBQUssQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxFQUFHO0FBQ2hDLG9CQUFJLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsWUFBWSxDQUFFLENBQUUsQ0FBQzthQUMvQyxNQUNJO0FBQ0Qsb0JBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsRUFBRSxhQUFhLEVBQUUsWUFBWSxDQUFFLENBQUM7YUFDakU7U0FDSixNQUVJLElBQUssSUFBSSxZQUFZLFNBQVMsRUFBRztBQUNsQyxvQ0FBd0IsQ0FBQyxLQUFLLENBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBRSxDQUFDO1NBQ3JELE1BQ0ksSUFBSyxJQUFJLFlBQVksVUFBVSxFQUFHO0FBQ25DLG9DQUF3QixDQUFDLElBQUksQ0FBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLGFBQWEsQ0FBRSxDQUFDO1NBQzlEO0tBQ0osQ0FBQzs7QUFFRixhQUFTLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxVQUFVLElBQUksRUFBd0M7WUFBdEMsYUFBYSxnQ0FBRyxDQUFDO1lBQUUsWUFBWSxnQ0FBRyxDQUFDOztBQUNoRixlQUFPLENBQUMsR0FBRyxDQUFFLFNBQVMsQ0FBRSxDQUFDO0FBQ3pCLFlBQUssSUFBSSxDQUFDLE1BQU0sRUFBRztBQUNmLGdCQUFLLEtBQUssQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxFQUFHO0FBQ2hDLG9CQUFJLENBQUMsVUFBVSxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsWUFBWSxDQUFFLENBQUUsQ0FBQzthQUNsRCxNQUNJO0FBQ0Qsb0JBQUksQ0FBQyxVQUFVLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsRUFBRSxhQUFhLEVBQUUsWUFBWSxDQUFFLENBQUM7YUFDcEU7U0FDSixNQUVJLElBQUssSUFBSSxZQUFZLFNBQVMsRUFBRztBQUNsQyx1Q0FBMkIsQ0FBQyxLQUFLLENBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBRSxDQUFDO1NBQ3hELE1BQ0ksSUFBSyxJQUFJLFlBQVksVUFBVSxFQUFHO0FBQ25DLHVDQUEyQixDQUFDLElBQUksQ0FBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLGFBQWEsQ0FBRSxDQUFDO1NBQ2pFO0tBQ0osQ0FBQztDQUNMLENBQUEsRUFBRSxDQUFHOzs7Ozs7O3lCQzNDYSxjQUFjOzs7OzZCQUNoQixvQkFBb0I7Ozs7QUFHckMsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDOztBQUV0QixNQUFNLENBQUMsY0FBYyxDQUFFLFlBQVksRUFBRSxVQUFVLEVBQUU7QUFDN0MsWUFBUSxFQUFFLEtBQUs7QUFDZixjQUFVLEVBQUUsSUFBSTtBQUNoQixTQUFLLEVBQUksQ0FBQSxZQUFXO0FBQ2hCLFlBQUksVUFBVSxHQUFHLHVCQUFPLGVBQWU7WUFDbkMsS0FBSyxHQUFHLElBQUksWUFBWSxDQUFFLFVBQVUsQ0FBRSxDQUFDOztBQUUzQyxhQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ25DLGlCQUFLLENBQUUsQ0FBQyxDQUFFLEdBQUcsR0FBRyxDQUFDO1NBQ3BCOztBQUVELGVBQU8sS0FBSyxDQUFDO0tBQ2hCLENBQUEsRUFBRSxBQUFFO0NBQ1IsQ0FBRSxDQUFDOztBQUVKLE1BQU0sQ0FBQyxjQUFjLENBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRTtBQUMzQyxZQUFRLEVBQUUsS0FBSztBQUNmLGNBQVUsRUFBRSxJQUFJO0FBQ2hCLFNBQUssRUFBSSxDQUFBLFlBQVc7QUFDaEIsWUFBSSxVQUFVLEdBQUcsdUJBQU8sZUFBZTtZQUNuQyxLQUFLLEdBQUcsSUFBSSxZQUFZLENBQUUsVUFBVSxDQUFFLENBQUM7O0FBRTNDLGFBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBQSxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDdEMsYUFBQyxHQUFHLEFBQUUsQ0FBQyxHQUFHLFVBQVUsR0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLGlCQUFLLENBQUUsQ0FBQyxDQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ2xCOztBQUVELGVBQU8sS0FBSyxDQUFDO0tBQ2hCLENBQUEsRUFBRSxBQUFFO0NBQ1IsQ0FBRSxDQUFDOztBQUdKLE1BQU0sQ0FBQyxjQUFjLENBQUUsWUFBWSxFQUFFLFlBQVksRUFBRTtBQUMvQyxZQUFRLEVBQUUsS0FBSztBQUNmLGNBQVUsRUFBRSxJQUFJO0FBQ2hCLFNBQUssRUFBSSxDQUFBLFlBQVc7QUFDaEIsWUFBSSxVQUFVLEdBQUcsdUJBQU8sZUFBZTtZQUNuQyxLQUFLLEdBQUcsSUFBSSxZQUFZLENBQUUsVUFBVSxDQUFFO1lBQ3RDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRztZQUNkLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDOztBQUVqQixhQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQUEsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3RDLGFBQUMsR0FBRyxBQUFFLENBQUMsR0FBRyxVQUFVLEdBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMvQixpQkFBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLEdBQUcsQ0FBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBRSxDQUFDO1NBQ3BDOztBQUVELGVBQU8sS0FBSyxDQUFDO0tBQ2hCLENBQUEsRUFBRSxBQUFFO0NBQ1IsQ0FBRSxDQUFDOztBQUlKLE1BQU0sQ0FBQyxjQUFjLENBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRTtBQUMxQyxZQUFRLEVBQUUsS0FBSztBQUNmLGNBQVUsRUFBRSxJQUFJO0FBQ2hCLFNBQUssRUFBSSxDQUFBLFlBQVc7QUFDaEIsWUFBSSxVQUFVLEdBQUcsdUJBQU8sZUFBZTtZQUNuQyxLQUFLLEdBQUcsSUFBSSxZQUFZLENBQUUsVUFBVSxDQUFFO1lBQ3RDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRztZQUNkLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRTtZQUNaLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDOztBQUVuQixhQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQUEsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3RDLGFBQUMsR0FBRyxBQUFFLENBQUMsR0FBRyxVQUFVLEdBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMvQixhQUFDLEdBQUcsR0FBRyxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNoQixpQkFBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLEdBQUcsQ0FBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBRSxDQUFDO1NBQ3BDOztBQUVELGVBQU8sS0FBSyxDQUFDO0tBQ2hCLENBQUEsRUFBRSxBQUFFO0NBQ1IsQ0FBRSxDQUFDOztBQUdKLE1BQU0sQ0FBQyxjQUFjLENBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRTtBQUM1QyxZQUFRLEVBQUUsS0FBSztBQUNmLGNBQVUsRUFBRSxJQUFJO0FBQ2hCLFNBQUssRUFBSSxDQUFBLFlBQVc7QUFDaEIsWUFBSSxVQUFVLEdBQUcsdUJBQU8sZUFBZTtZQUNuQyxjQUFjLEdBQUcsVUFBVSxHQUFHLEdBQUc7WUFDakMsS0FBSyxHQUFHLElBQUksWUFBWSxDQUFFLFVBQVUsQ0FBRSxDQUFDOztBQUUzQyxhQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGNBQWMsRUFBRSxFQUFFLENBQUMsRUFBRztBQUM1RCxhQUFDLEdBQUcsQ0FBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQSxHQUFLLGNBQWMsQ0FBQztBQUN4QyxpQkFBSyxDQUFFLENBQUMsR0FBRyxjQUFjLENBQUUsR0FBRyxDQUFDLENBQUM7U0FDbkM7O0FBRUQsZUFBTyxLQUFLLENBQUM7S0FDaEIsQ0FBQSxFQUFFLEFBQUU7Q0FDUixDQUFFLENBQUM7OztBQUtKLE1BQU0sQ0FBQyxjQUFjLENBQUUsWUFBWSxFQUFFLGlCQUFpQixFQUFFO0FBQ3BELFlBQVEsRUFBRSxLQUFLO0FBQ2YsY0FBVSxFQUFFLElBQUk7QUFDaEIsU0FBSyxFQUFJLENBQUEsWUFBVztBQUNoQixZQUFJLFVBQVUsR0FBRyx1QkFBTyxlQUFlO1lBQ25DLEtBQUssR0FBRyxJQUFJLFlBQVksQ0FBRSxVQUFVLENBQUUsQ0FBQzs7QUFFM0MsYUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxZQUFBLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxFQUFFLENBQUMsRUFBRztBQUN0QyxhQUFDLEdBQUcsQUFBRSxDQUFDLEdBQUcsVUFBVSxHQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDL0IsaUJBQUssQ0FBRSxDQUFDLENBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7U0FDbkM7O0FBRUQsZUFBTyxLQUFLLENBQUM7S0FDaEIsQ0FBQSxFQUFFLEFBQUU7Q0FDUixDQUFFLENBQUM7O0FBRUosTUFBTSxDQUFDLGNBQWMsQ0FBRSxZQUFZLEVBQUUsY0FBYyxFQUFFO0FBQ2pELFlBQVEsRUFBRSxLQUFLO0FBQ2YsY0FBVSxFQUFFLElBQUk7QUFDaEIsU0FBSyxFQUFJLENBQUEsWUFBVztBQUNoQixZQUFJLFVBQVUsR0FBRyx1QkFBTyxlQUFlO1lBQ25DLEtBQUssR0FBRyxJQUFJLFlBQVksQ0FBRSxVQUFVLENBQUUsQ0FBQzs7QUFFM0MsYUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxZQUFBLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxFQUFFLENBQUMsRUFBRztBQUN0QyxhQUFDLEdBQUcsQUFBRSxDQUFDLEdBQUcsVUFBVSxHQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDL0IsaUJBQUssQ0FBRSxDQUFDLENBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDL0I7O0FBRUQsZUFBTyxLQUFLLENBQUM7S0FDaEIsQ0FBQSxFQUFFLEFBQUU7Q0FDUixDQUFFLENBQUM7O0FBR0osTUFBTSxDQUFDLGNBQWMsQ0FBRSxZQUFZLEVBQUUsYUFBYSxFQUFFO0FBQ2hELFlBQVEsRUFBRSxLQUFLO0FBQ2YsY0FBVSxFQUFFLElBQUk7QUFDaEIsU0FBSyxFQUFJLENBQUEsWUFBVztBQUNoQixZQUFJLFVBQVUsR0FBRyx1QkFBTyxlQUFlO1lBQ25DLEtBQUssR0FBRyxJQUFJLFlBQVksQ0FBRSxVQUFVLENBQUUsQ0FBQzs7QUFFM0MsYUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxZQUFBLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxFQUFFLENBQUMsRUFBRztBQUN0QyxhQUFDLEdBQUcsQUFBRSxDQUFDLEdBQUcsVUFBVSxHQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDL0IsaUJBQUssQ0FBRSxDQUFDLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDaEM7O0FBRUQsZUFBTyxLQUFLLENBQUM7S0FDaEIsQ0FBQSxFQUFFLEFBQUU7Q0FDUixDQUFFLENBQUM7O0FBR0osTUFBTSxDQUFDLGNBQWMsQ0FBRSxZQUFZLEVBQUUsWUFBWSxFQUFFO0FBQy9DLFlBQVEsRUFBRSxLQUFLO0FBQ2YsY0FBVSxFQUFFLElBQUk7QUFDaEIsU0FBSyxFQUFJLENBQUEsWUFBVztBQUNoQixZQUFJLFVBQVUsR0FBRyxJQUFJLEdBQUcsR0FBRzs7QUFDdkIsYUFBSyxHQUFHLElBQUksWUFBWSxDQUFFLFVBQVUsQ0FBRSxDQUFDOztBQUUzQyxhQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQUEsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3RDLGFBQUMsR0FBRyxBQUFFLENBQUMsR0FBRyxVQUFVLEdBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzs7O0FBRy9CLGdCQUFLLENBQUMsS0FBSyxDQUFDLEVBQUc7QUFDWCxpQkFBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFFLENBQUM7YUFDekI7O0FBRUQsaUJBQUssQ0FBRSxDQUFDLENBQUUsR0FBRyxDQUFDLENBQUM7U0FDbEI7O0FBRUQsZUFBTyxLQUFLLENBQUM7S0FDaEIsQ0FBQSxFQUFFLEFBQUU7Q0FDUixDQUFFLENBQUM7O0FBR0osTUFBTSxDQUFDLGNBQWMsQ0FBRSxZQUFZLEVBQUUsTUFBTSxFQUFFO0FBQ3pDLFlBQVEsRUFBRSxLQUFLO0FBQ2YsY0FBVSxFQUFFLElBQUk7QUFDaEIsU0FBSyxFQUFJLENBQUEsWUFBVztBQUNoQixZQUFJLFVBQVUsR0FBRyx1QkFBTyxlQUFlO1lBQ25DLEtBQUssR0FBRyxJQUFJLFlBQVksQ0FBRSxVQUFVLENBQUU7WUFDdEMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7O0FBRW5CLGFBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBQSxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDdEMsYUFBQyxHQUFHLEFBQUUsQ0FBQyxHQUFHLFVBQVUsR0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLGlCQUFLLENBQUUsQ0FBQyxDQUFFLEdBQUcsR0FBRyxDQUFFLENBQUMsQ0FBRSxDQUFDO1NBQ3pCOztBQUVELGVBQU8sS0FBSyxDQUFDO0tBQ2hCLENBQUEsRUFBRSxBQUFFO0NBQ1IsQ0FBRSxDQUFDOztBQUVKLE1BQU0sQ0FBQyxjQUFjLENBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRTtBQUMxQyxZQUFRLEVBQUUsS0FBSztBQUNmLGNBQVUsRUFBRSxJQUFJO0FBQ2hCLFNBQUssRUFBSSxDQUFBLFlBQVc7QUFDaEIsWUFBSSxVQUFVLEdBQUcsdUJBQU8sZUFBZSxHQUFHLEVBQUU7WUFDeEMsS0FBSyxHQUFHLElBQUksWUFBWSxDQUFFLFVBQVUsQ0FBRSxDQUFDOztBQUUzQyxhQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQUEsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3RDLGFBQUMsR0FBRyxBQUFFLENBQUMsR0FBRyxVQUFVLEdBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFL0IsZ0JBQ0ksQUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxPQUFPLElBQ3JCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxBQUFFLEVBQzVCO0FBQ0UsaUJBQUMsR0FBRyxDQUFDLENBQUM7YUFDVCxNQUNJLElBQUssQ0FBQyxHQUFHLENBQUMsRUFBRztBQUNkLGlCQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQ1IsTUFDSTtBQUNELGlCQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDVjs7QUFHRCxpQkFBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLENBQUMsQ0FBQztTQUNsQjs7QUFFRCxlQUFPLEtBQUssQ0FBQztLQUNoQixDQUFBLEVBQUUsQUFBRTtDQUNSLENBQUUsQ0FBQzs7QUFHSixNQUFNLENBQUMsY0FBYyxDQUFFLFlBQVksRUFBRSxPQUFPLEVBQUU7QUFDMUMsWUFBUSxFQUFFLEtBQUs7QUFDZixjQUFVLEVBQUUsSUFBSTtBQUNoQixTQUFLLEVBQUksQ0FBQSxZQUFXO0FBQ2hCLFlBQUksVUFBVSxHQUFHLHVCQUFPLGVBQWUsR0FBRyxFQUFFO1lBQ3hDLEtBQUssR0FBRyxJQUFJLFlBQVksQ0FBRSxVQUFVLENBQUUsQ0FBQzs7QUFFM0MsYUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxZQUFBLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxFQUFFLENBQUMsRUFBRztBQUN0QyxhQUFDLEdBQUcsQUFBRSxDQUFDLEdBQUcsVUFBVSxHQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7O0FBRS9CLGdCQUFLLENBQUMsSUFBSSxNQUFNLEVBQUc7QUFDZixpQkFBQyxHQUFHLENBQUMsQ0FBQzthQUNULE1BQ0ksSUFBSyxDQUFDLElBQUksQ0FBQyxFQUFHO0FBQ2YsaUJBQUMsR0FBRyxDQUFDLENBQUM7YUFDVCxNQUNJLElBQUssQ0FBQyxHQUFHLENBQUMsRUFBRztBQUNkLGlCQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDVjs7QUFHRCxpQkFBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLENBQUMsQ0FBQztTQUNsQjs7QUFFRCxlQUFPLEtBQUssQ0FBQztLQUNoQixDQUFBLEVBQUUsQUFBRTtDQUNSLENBQUUsQ0FBQzs7QUFFSixNQUFNLENBQUMsY0FBYyxDQUFFLFlBQVksRUFBRSxvQkFBb0IsRUFBRTtBQUN2RCxZQUFRLEVBQUUsS0FBSztBQUNmLGNBQVUsRUFBRSxJQUFJO0FBQ2hCLFNBQUssRUFBSSxDQUFBLFlBQVc7QUFDaEIsWUFBSSxVQUFVLEdBQUcsdUJBQU8sZUFBZSxHQUFHLENBQUM7WUFDdkMsS0FBSyxHQUFHLElBQUksWUFBWSxDQUFFLFVBQVUsQ0FBRSxDQUFDOztBQUUzQyxhQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQUEsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3RDLGlCQUFLLENBQUUsQ0FBQyxDQUFFLEdBQUcsMkJBQUssS0FBSyxFQUFFLENBQUM7U0FDN0I7O0FBRUQsZUFBTyxLQUFLLENBQUM7S0FDaEIsQ0FBQSxFQUFFLEFBQUU7Q0FDUixDQUFFLENBQUM7O0FBRUosTUFBTSxDQUFDLGNBQWMsQ0FBRSxZQUFZLEVBQUUsWUFBWSxFQUFFO0FBQy9DLFlBQVEsRUFBRSxLQUFLO0FBQ2YsY0FBVSxFQUFFLElBQUk7QUFDaEIsU0FBSyxFQUFJLENBQUEsWUFBVztBQUNoQixZQUFJLFVBQVUsR0FBRyx1QkFBTyxlQUFlLEdBQUcsQ0FBQztZQUN2QyxLQUFLLEdBQUcsSUFBSSxZQUFZLENBQUUsVUFBVSxDQUFFLENBQUM7O0FBRTNDLGFBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBQSxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDdEMsaUJBQUssQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDOUI7O0FBRUQsZUFBTyxLQUFLLENBQUM7S0FDaEIsQ0FBQSxFQUFFLEFBQUU7Q0FDUixDQUFFLENBQUM7O0FBRUosTUFBTSxDQUFDLGNBQWMsQ0FBRSxZQUFZLEVBQUUsV0FBVyxFQUFFO0FBQzlDLFlBQVEsRUFBRSxLQUFLO0FBQ2YsY0FBVSxFQUFFLElBQUk7QUFDaEIsU0FBSyxFQUFJLENBQUEsWUFBVztBQUNoQixZQUFJLFVBQVUsR0FBRyx1QkFBTyxlQUFlLEdBQUcsQ0FBQztZQUN2QyxLQUFLLEdBQUcsSUFBSSxZQUFZLENBQUUsVUFBVSxDQUFFLENBQUM7O0FBRTNDLG1DQUFLLGtCQUFrQixFQUFFLENBQUM7O0FBRTFCLGFBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBQSxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDdEMsaUJBQUssQ0FBRSxDQUFDLENBQUUsR0FBRywyQkFBSyxpQkFBaUIsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDakQ7O0FBRUQsZUFBTyxDQUFDLEdBQUcsQ0FBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBRSxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUUsQ0FBQztBQUM3QyxlQUFPLENBQUMsR0FBRyxDQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFFLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBRSxDQUFDOztBQUU3QyxlQUFPLEtBQUssQ0FBQztLQUNoQixDQUFBLEVBQUUsQUFBRTtDQUNSLENBQUUsQ0FBQzs7QUFHSixNQUFNLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O1FDNVN2QixxQkFBcUI7O2lDQUNELHNCQUFzQjs7OztJQUUzQyxZQUFZO0FBQ0gsYUFEVCxZQUFZLENBQ0QsRUFBRSxFQUFHOzhCQURoQixZQUFZOztBQUVWLG1DQUFPLEVBQUUsQ0FBRSxDQUFDOztBQUVaLFlBQUksQ0FBQyxLQUFLLEdBQUc7QUFDVCxrQkFBTSxFQUFFLElBQUk7QUFDWixpQkFBSyxFQUFFLEdBQUc7QUFDVixtQkFBTyxFQUFFLEdBQUc7U0FDZixDQUFDOztBQUVGLFlBQUksQ0FBQyxNQUFNLEdBQUc7QUFDVixtQkFBTyxFQUFFLENBQUM7QUFDVixnQkFBSSxFQUFFLENBQUM7QUFDUCxtQkFBTyxFQUFFLENBQUM7QUFDVixtQkFBTyxFQUFFLENBQUM7U0FDYixDQUFDOztBQUVGLFlBQUksQ0FBQyxZQUFZLENBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxDQUFDO0FBQ3ZELFlBQUksQ0FBQyxZQUFZLENBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFFLENBQUM7QUFDbkUsWUFBSSxDQUFDLFlBQVksQ0FBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsQ0FBQztBQUNwRSxZQUFJLENBQUMsVUFBVSxDQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUUsQ0FBQztLQUMvRTs7Y0FyQkMsWUFBWTs7aUJBQVosWUFBWTs7YUF1QkEsZUFBRztBQUNiLG1CQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1NBQzVCO2FBQ2EsYUFBRSxJQUFJLEVBQUc7QUFDbkIsZ0JBQUssT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFHO0FBQzVCLG9CQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDekIsb0JBQUksQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLElBQUksQ0FBRSxDQUFDO2FBQ3RDO1NBQ0o7OzthQUdZLGVBQUc7QUFDWixtQkFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztTQUMzQjthQUNZLGFBQUUsSUFBSSxFQUFHO0FBQ2xCLGdCQUFLLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRztBQUM1QixvQkFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ3hCLG9CQUFJLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxJQUFJLENBQUUsQ0FBQzthQUNyQztTQUNKOzs7YUFHYyxlQUFHO0FBQ2QsbUJBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7U0FDN0I7YUFDYyxhQUFFLElBQUksRUFBRztBQUNwQixnQkFBSyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUc7QUFDNUIsb0JBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUMxQixvQkFBSSxDQUFDLFdBQVcsQ0FBRSxTQUFTLEVBQUUsSUFBSSxDQUFFLENBQUM7YUFDdkM7U0FDSjs7O2FBR2UsZUFBRztBQUNmLG1CQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO1NBQzlCO2FBQ2UsYUFBRSxLQUFLLEVBQUc7QUFDdEIsZ0JBQUssT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFHO0FBQzdCLG9CQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDNUIsb0JBQUksQ0FBQyxZQUFZLENBQUUsU0FBUyxFQUFFLEtBQUssQ0FBRSxDQUFDO2FBQ3pDO1NBQ0o7OzthQUdZLGVBQUc7QUFDWixtQkFBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztTQUMzQjthQUVZLGFBQUUsS0FBSyxFQUFHO0FBQ25CLGdCQUFLLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRztBQUM3QixvQkFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO0FBQ3pCLG9CQUFJLENBQUMsWUFBWSxDQUFFLFFBQVEsRUFBRSxLQUFLLENBQUUsQ0FBQzthQUN4QztTQUNKOzs7YUFHZSxlQUFHO0FBQ2YsbUJBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7U0FDOUI7YUFDZSxhQUFFLEtBQUssRUFBRztBQUN0QixnQkFBSyxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUc7QUFDN0Isb0JBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUM1QixvQkFBSSxDQUFDLFlBQVksQ0FBRSxPQUFPLEVBQUUsS0FBSyxDQUFFLENBQUM7YUFDdkM7U0FDSjs7O2FBR2UsZUFBRztBQUNmLG1CQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO1NBQzlCO2FBQ2UsYUFBRSxLQUFLLEVBQUc7QUFDdEIsZ0JBQUssT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFHO0FBQzdCLG9CQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDNUIsb0JBQUksQ0FBQyxZQUFZLENBQUUsU0FBUyxFQUFFLEtBQUssQ0FBRSxDQUFDO2FBQ3pDO1NBQ0o7OztXQWxHQyxZQUFZOzs7QUFxR2xCLE9BQU8sQ0FBQyxTQUFTLENBQUMsa0JBQWtCLEdBQUcsWUFBVztBQUM5QyxXQUFPLElBQUksWUFBWSxDQUFFLElBQUksQ0FBRSxDQUFDO0NBQ25DLENBQUM7O3FCQUVhLFlBQVk7Ozs7Ozs7Ozs7Ozs7OzhCQzVHUCxxQkFBcUI7Ozs7NkJBQ3RCLG9CQUFvQjs7Ozs4QkFDcEIscUJBQXFCOzs7O0lBRWxDLGNBQWM7QUFDTCxhQURULGNBQWMsQ0FDSCxFQUFFLEVBQUc7OEJBRGhCLGNBQWM7O0FBRVosWUFBSSxDQUFDLE1BQU0sQ0FBRSxFQUFFLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLE1BQU0sR0FBRztBQUNWLGlCQUFLLEVBQUUsRUFBRTtBQUNULGdCQUFJLEVBQUUsRUFBRTtTQUNYLENBQUM7O0FBRUYsWUFBSSxDQUFDLEtBQUssR0FBRztBQUNULGlCQUFLLEVBQUUsRUFBRTtBQUNULGdCQUFJLEVBQUUsRUFBRTtTQUNYLENBQUM7S0FDTDs7QUFiQyxrQkFBYyxXQWVoQixRQUFRLEdBQUEsa0JBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUEwQjtZQUF4QixhQUFhLGdDQUFHLEtBQUs7O0FBQ3ZELFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsT0FBTyxDQUFFLENBQUM7O0FBRWxDLFlBQUssS0FBSyxDQUFFLElBQUksQ0FBRSxFQUFHO0FBQ2pCLGtCQUFNLElBQUksS0FBSyxDQUFFLG1CQUFrQixHQUFHLElBQUksR0FBRyxvQkFBbUIsQ0FBRSxDQUFDO1NBQ3RFOztBQUVELFlBQUksQ0FBQyxNQUFNLENBQUUsT0FBTyxDQUFFLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBRSxDQUFDOztBQUVwQyxZQUFJLENBQUMsS0FBSyxDQUFFLE9BQU8sQ0FBRSxDQUFFLElBQUksQ0FBRSxHQUFHO0FBQzVCLGdCQUFJLEVBQUUsSUFBSTtBQUNWLGlCQUFLLEVBQUUsS0FBSztBQUNaLHlCQUFhLEVBQUUsYUFBYTtTQUMvQixDQUFDO0tBQ0w7O0FBN0JDLGtCQUFjLFdBK0JoQixZQUFZLEdBQUEsc0JBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQTBCO1lBQXhCLGFBQWEsZ0NBQUcsS0FBSzs7QUFDbEQsWUFBSSxDQUFDLFFBQVEsQ0FBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsYUFBYSxDQUFFLENBQUM7QUFDM0QsZUFBTyxJQUFJLENBQUM7S0FDZjs7QUFsQ0Msa0JBQWMsV0FvQ2hCLFVBQVUsR0FBQSxvQkFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBMEI7WUFBeEIsYUFBYSxnQ0FBRyxLQUFLOztBQUNoRCxZQUFJLENBQUMsUUFBUSxDQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxhQUFhLENBQUUsQ0FBQztBQUMxRCxlQUFPLElBQUksQ0FBQztLQUNmOztBQXZDQyxrQkFBYyxXQXlDaEIsWUFBWSxHQUFBLHNCQUFFLElBQUksRUFBRSxLQUFLLEVBQUc7QUFDeEIsWUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBRTtZQUM5QyxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBRSxDQUFDOztBQUVoRCxZQUFLLFVBQVUsS0FBSyxDQUFDLENBQUMsSUFBSSxRQUFRLEtBQUssQ0FBQyxDQUFDLEVBQUc7QUFDeEMsbUJBQU8sQ0FBQyxJQUFJLENBQUUsc0JBQXFCLEdBQUcsSUFBSSxHQUFHLG1CQUFrQixDQUFFLENBQUM7QUFDbEUsbUJBQU87U0FDVjs7QUFFRCxZQUFLLFVBQVUsS0FBSyxDQUFDLENBQUMsRUFBRztBQUNyQixnQkFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUUsSUFBSSxDQUFFLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBRSxLQUFLLENBQUUsQ0FBQztTQUN4RCxNQUNJO0FBQ0QsZ0JBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBRSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUUsS0FBSyxDQUFFLENBQUM7U0FDdkQ7O0FBRUQsZUFBTyxJQUFJLENBQUM7S0FDZjs7QUExREMsa0JBQWMsV0E2RGhCLFdBQVcsR0FBQSxxQkFBRSxJQUFJLEVBQUUsSUFBSSxFQUFHO0FBQ3RCLFlBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUU7WUFDOUMsUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUUsQ0FBQzs7QUFFaEQsWUFBSyxVQUFVLEtBQUssQ0FBQyxDQUFDLElBQUksUUFBUSxLQUFLLENBQUMsQ0FBQyxFQUFHO0FBQ3hDLG1CQUFPLENBQUMsSUFBSSxDQUFFLHNCQUFxQixHQUFHLElBQUksR0FBRyxrQkFBaUIsQ0FBRSxDQUFDO0FBQ2pFLG1CQUFPO1NBQ1Y7O0FBRUQsWUFBSyxVQUFVLEtBQUssQ0FBQyxDQUFDLEVBQUc7QUFDckIsZ0JBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFFLElBQUksQ0FBRSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUUsSUFBSSxDQUFFLENBQUM7U0FDdEQsTUFDSTtBQUNELGdCQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUUsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFFLElBQUksQ0FBRSxDQUFDO1NBQ3JEOztBQUVELGVBQU8sSUFBSSxDQUFDO0tBQ2Y7O0FBOUVDLGtCQUFjLFdBa0ZoQixZQUFZLEdBQUEsc0JBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUc7Ozs7Ozs7QUFPL0IsYUFBSyxDQUFDLHVCQUF1QixDQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQzs7S0FFMUU7O0FBM0ZDLGtCQUFjLFdBNkZoQixhQUFhLEdBQUEsdUJBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUscUJBQXFCLEVBQUc7QUFDOUQsWUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRSxPQUFPLENBQUU7WUFDbEMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsT0FBTyxDQUFFO1lBQzdCLFFBQVEsR0FBRyxTQUFTLENBQUMsTUFBTTtZQUMzQixJQUFJLENBQUM7O0FBRVQsYUFBSyxDQUFDLHFCQUFxQixDQUFFLFNBQVMsQ0FBRSxDQUFDOzs7QUFHekMsYUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRztBQUNqQyxnQkFBSSxHQUFHLEtBQUssQ0FBRSxTQUFTLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztBQUMvQixnQkFBSSxDQUFDLFlBQVksQ0FBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBRSxDQUFDO0FBQzVDLHFCQUFTLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQztTQUMxQjtLQUNKOztBQTNHQyxrQkFBYyxXQThHaEIsS0FBSyxHQUFBLGVBQUUsS0FBSyxFQUFjO1lBQVosS0FBSyxnQ0FBRyxDQUFDOztBQUNuQixZQUFLLEtBQUssWUFBWSxVQUFVLEtBQUssS0FBSyxJQUFJLEtBQUssWUFBWSxLQUFLLEtBQUssS0FBSyxFQUFHO0FBQzdFLGtCQUFNLElBQUksS0FBSyxDQUFFLDhEQUE4RCxDQUFFLENBQUM7U0FDckY7O0FBRUQsWUFBSSxDQUFDLGFBQWEsQ0FBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBRSxDQUFDO0tBQzFFOztBQXBIQyxrQkFBYyxXQXNIaEIsSUFBSSxHQUFBLGNBQUUsS0FBSyxFQUFjO1lBQVosS0FBSyxnQ0FBRyxDQUFDOztBQUNsQixZQUFJLENBQUMsYUFBYSxDQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBRSxDQUFDO0tBQy9FOztBQXhIQyxrQkFBYyxXQTBIaEIsU0FBUyxHQUFBLG1CQUFFLEtBQUssRUFBYztZQUFaLEtBQUssZ0NBQUcsQ0FBQzs7QUFDdkIsYUFBSyxDQUFDLHFCQUFxQixDQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBRSxDQUFDOztBQUVoRSxhQUFLLENBQUMsdUJBQXVCLENBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBRSxDQUFDO0tBQ3hFOztpQkE5SEMsY0FBYzs7YUFnSUUsZUFBRztBQUNqQixnQkFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLO2dCQUN6QixJQUFJLEdBQUcsR0FBRyxDQUFDOztBQUVmLGlCQUFNLElBQUksQ0FBQyxJQUFJLE1BQU0sRUFBRztBQUNwQixvQkFBSSxJQUFJLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUM7YUFDNUI7O0FBRUQsbUJBQU8sSUFBSSxDQUFDO1NBQ2Y7OzthQUVnQixlQUFHO0FBQ2hCLGdCQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUk7Z0JBQ3ZCLElBQUksR0FBRyxHQUFHLENBQUM7O0FBRWYsaUJBQU0sSUFBSSxDQUFDLElBQUksS0FBSyxFQUFHO0FBQ25CLG9CQUFJLElBQUksS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQzthQUMzQjs7QUFFRCxtQkFBTyxJQUFJLENBQUM7U0FDZjs7O1dBcEpDLGNBQWM7OztBQXVKcEIsNEJBQVEsV0FBVyxDQUFFLGNBQWMsQ0FBQyxTQUFTLCtCQUFVLFFBQVEsQ0FBRSxDQUFDOztBQUVsRSw0QkFBUSxTQUFTLENBQUMsb0JBQW9CLEdBQUcsWUFBVztBQUNoRCxXQUFPLElBQUksY0FBYyxDQUFFLElBQUksQ0FBRSxDQUFDO0NBQ3JDLENBQUM7O3FCQUVhLGNBQWM7Ozs7Ozs7Ozs7Ozs7OzhCQ2pLVCxxQkFBcUI7Ozs7bUNBQ2xCLDBCQUEwQjs7Ozs7OztJQUkzQyxLQUFLO0FBQ0ksYUFEVCxLQUFLLENBQ00sRUFBRSxFQUFnQztZQUE5QixJQUFJLGdDQUFHLENBQUM7WUFBRSxhQUFhLGdDQUFHLENBQUM7OzhCQUQxQyxLQUFLOztBQUVILCtCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUdsQixZQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxhQUFhLENBQUUsQ0FBQztBQUM5RCxZQUFJLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxJQUFJLENBQUUsQ0FBQzs7O0FBR2pELFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7OztBQUd4QyxZQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDcEMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDOzs7QUFHcEMsWUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDOzs7QUFHL0IsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDOztBQUV2QyxZQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLFlBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7O0FBRTdCLFlBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQ25ELFlBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBRSxDQUFDO0tBQ3hEOztjQTNCQyxLQUFLOztXQUFMLEtBQUs7OztBQWdDWCw0QkFBUSxTQUFTLENBQUMsV0FBVyxHQUFHLFVBQVUsSUFBSSxFQUFFLGFBQWEsRUFBRztBQUM1RCxXQUFPLElBQUksS0FBSyxDQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsYUFBYSxDQUFFLENBQUM7Q0FDakQsQ0FBQzs7cUJBRWEsS0FBSzs7Ozs7Ozs7Ozs7Ozs7OEJDekNBLHFCQUFxQjs7Ozs4QkFDdEIscUJBQXFCOzs7O29DQUNoQiwyQkFBMkI7Ozs7aUNBQzlCLHdCQUF3Qjs7OzttQ0FDdEIsMEJBQTBCOzs7O3dCQUMvQixhQUFhOzs7Ozs7OztJQU16QixhQUFhO0FBQ0osYUFEVCxhQUFhLENBQ0YsRUFBRSxFQUFxQztZQUFuQyxJQUFJLGdDQUFHLElBQUk7WUFBRSxhQUFhLGdDQUFHLEdBQUc7OzhCQUQvQyxhQUFhOztBQUVYLCtCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUdsQixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUUsQ0FBQyxDQUFFLENBQUM7QUFDeEQsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHcEQsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzNDLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUMzQyxZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDekMsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDOzs7QUFHekMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQ3RDLFlBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUN0QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDdEMsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDOztBQUd0QyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN4QyxZQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1QyxZQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsR0FBRyxDQUFFLENBQUM7O0FBRWhDLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLFlBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO0tBQ3RDOztjQTdCQyxhQUFhOztpQkFBYixhQUFhOzthQStCUCxlQUFHO0FBQ1AsbUJBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7U0FDaEM7YUFFTyxhQUFFLEtBQUssRUFBRztBQUNkLGdCQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FDekMsS0FBSyxFQUNMLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FDakMsQ0FBQzs7QUFFRixnQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQ3pDLEtBQUssRUFDTCxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQ2pDLENBQUM7U0FDTDs7O2FBRWdCLGVBQUc7QUFDaEIsbUJBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1NBQ3BDO2FBRWdCLGFBQUUsS0FBSyxFQUFHO0FBQ3ZCLGdCQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ2xDLGdCQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQ3JDOzs7V0F0REMsYUFBYTs7O0FBeURuQiw0QkFBUSxXQUFXLENBQUUsYUFBYSxDQUFDLFNBQVMsK0JBQVUsUUFBUSxDQUFFLENBQUM7QUFDakUsNEJBQVEsS0FBSyxDQUFFLGFBQWEsQ0FBQyxTQUFTLG9DQUFlLENBQUM7QUFDdEQsNEJBQVEsS0FBSyxDQUFFLGFBQWEsQ0FBQyxTQUFTLGlDQUFZLENBQUM7O0FBRW5ELDRCQUFRLFNBQVMsQ0FBQyxtQkFBbUIsR0FBRyxVQUFVLElBQUksRUFBRSxhQUFhLEVBQUc7QUFDcEUsV0FBTyxJQUFJLGFBQWEsQ0FBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLGFBQWEsQ0FBRSxDQUFDO0NBQ3pELENBQUM7Ozs7Ozs7OztRQzFFSyxxQkFBcUI7OzhCQUNULHFCQUFxQjs7OztJQUVsQyxtQkFBbUI7QUFDVixhQURULG1CQUFtQixDQUNSLEVBQUUsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFHOzhCQURsRSxtQkFBbUI7O0FBRWpCLFlBQUksQ0FBQyxNQUFNLENBQUUsRUFBRSxDQUFFLENBQUM7O0FBRWxCLFlBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0FBQzNCLFlBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ3JCLFlBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQ3pCLFlBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0FBQzNCLFlBQUksQ0FBQyxJQUFJLEdBQUcsUUFBUSxJQUFJLE1BQU0sQ0FBQztBQUMvQixZQUFJLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQzs7QUFFMUIsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLEVBQ2hELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFFLFFBQVEsQ0FBRSxDQUFDO0FBQ3pELFlBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFFLENBQUM7QUFDN0MsWUFBSSxDQUFDLEtBQUssQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQzs7QUFFcEYsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBRSxDQUFDO0FBQzdDLFlBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztLQUNuRDs7QUFsQkMsdUJBQW1CLFdBb0JyQixrQkFBa0IsR0FBQSw4QkFBRztBQUNqQixZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ3JDLGVBQU8sSUFBSSxDQUFDO0tBQ2Y7O0FBdkJDLHVCQUFtQixXQXlCckIsbUJBQW1CLEdBQUEsNkJBQUUsUUFBUSxFQUFHO0FBQzVCLFlBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7S0FDNUM7O0FBM0JDLHVCQUFtQixXQTZCckIscUJBQXFCLEdBQUEsaUNBQUc7QUFDcEIsWUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNoQyxZQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQy9CLFlBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0FBQzFCLFlBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLFlBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0tBQ3ZCOztBQW5DQyx1QkFBbUIsV0FxQ3JCLElBQUksR0FBQSxjQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFHO0FBQ3RCLGVBQU8sS0FBSyxHQUFLLENBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQSxHQUFLLEtBQUssQUFBRSxDQUFDO0tBQzlDOztBQXZDQyx1QkFBbUIsV0F5Q3JCLEtBQUssR0FBQSxlQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUc7QUFDbEQsWUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7O0FBRW5DLGlCQUFTLEdBQUcsT0FBTyxTQUFTLEtBQUssUUFBUSxHQUFHLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQ3ZFLGNBQU0sR0FBRyxPQUFPLE1BQU0sS0FBSyxRQUFRLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDM0QsZ0JBQVEsR0FBRyxPQUFPLFFBQVEsS0FBSyxRQUFRLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDbkUsWUFBSSxHQUFHLE9BQU8sSUFBSSxLQUFLLFFBQVEsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQzs7QUFFbkQsWUFBSSxTQUFTLEdBQUcsT0FBTyxTQUFTLEtBQUssUUFBUSxHQUFHLFNBQVMsR0FBRyxDQUFDLENBQUM7O0FBRTlELFlBQUksQ0FBQyxtQkFBbUIsQ0FBRSxRQUFRLENBQUUsQ0FBQzs7QUFFckMsWUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUUsR0FBRyxDQUFFLENBQUM7QUFDdEQsWUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQUUsR0FBRyxDQUFFLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTBCbkQsWUFBSyxTQUFTLEtBQUssQ0FBQyxFQUFHO0FBQ25CLGdCQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBRSxTQUFTLEVBQUUsR0FBRyxHQUFHLFNBQVMsQ0FBRSxDQUFDO0FBQy9FLGdCQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBRSxNQUFNLEVBQUUsR0FBRyxHQUFHLFNBQVMsQ0FBRSxDQUFDO1NBQzVFLE1BQ0k7QUFDRCxnQkFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFFLFNBQVMsRUFBRSxHQUFHLENBQUUsQ0FBQztBQUMxRCxnQkFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFFLE1BQU0sRUFBRSxHQUFHLENBQUUsQ0FBQztTQUN2RDs7QUFFRCxZQUFLLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRztBQUM1QixnQkFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1NBQzlCLE1BQ0k7QUFDRCxnQkFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztTQUNuQzs7QUFFRCxZQUFJLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQztBQUMxQixZQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUMzQixZQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUMzQixZQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztBQUNyQixZQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUN6QixZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztLQUNwQjs7QUF0R0MsdUJBQW1CLFdBd0dyQixLQUFLLEdBQUEsZUFBRSxLQUFLLEVBQUc7QUFDWCxZQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUNqQzs7QUExR0MsdUJBQW1CLFdBNEdyQixJQUFJLEdBQUEsY0FBRSxLQUFLLEVBQUc7QUFDVixZQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUNoQzs7QUE5R0MsdUJBQW1CLFdBZ0hyQixPQUFPLEdBQUEsbUJBQUc7QUFDTixZQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzVCLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDOztBQUV0QixZQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztLQUNoQzs7V0FySEMsbUJBQW1COzs7QUF3SHpCLE9BQU8sQ0FBQyxXQUFXLENBQUUsbUJBQW1CLENBQUMsU0FBUywrQkFBVSxRQUFRLENBQUUsQ0FBQzs7QUFFdkUsT0FBTyxDQUFDLFNBQVMsQ0FBQyx5QkFBeUIsR0FBRyxVQUFVLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUc7QUFDbkcsV0FBTyxJQUFJLG1CQUFtQixDQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFFLENBQUM7Q0FDeEYsQ0FBQzs7Ozs7Ozs7Ozs7UUMvSEsscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7SUFHN0IsT0FBTztBQUVFLGFBRlQsT0FBTyxDQUVJLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRzs4QkFGNUMsT0FBTzs7QUFHTCx5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLFNBQVMsQ0FBRSxDQUFDO0FBQ2pELFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7QUFFekMsWUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3hDLFlBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxRQUFRLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDOztBQUVyRSxZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUM3QixZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFFLENBQUM7O0FBRXBDLFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUNwQyxZQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDcEMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDOztBQUVwQyxZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFFLEtBQUssQ0FBRSxDQUFDO0FBQ2hELFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQztBQUNwQyxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBRSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzdDLFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUU3QyxZQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7S0FDM0M7O2NBMUJDLE9BQU87O0FBQVAsV0FBTyxXQTRCVCxPQUFPLEdBQUEsbUJBQUc7QUFDTix3QkFESixPQUFPLFdBQ0ksQ0FBQztLQUNYOztXQTlCQyxPQUFPOzs7QUFpQ2IsT0FBTyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEdBQUcsVUFBVSxTQUFTLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRztBQUNyRSxXQUFPLElBQUksT0FBTyxDQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBRSxDQUFDO0NBQzFELENBQUM7Ozs7Ozs7Ozs7O1FDdkNLLHFCQUFxQjs7MkJBQ1gsa0JBQWtCOzs7O0lBRTdCLFVBQVU7QUFDRCxhQURULFVBQVUsQ0FDQyxFQUFFLEVBQW1DO1lBQWpDLFFBQVEsZ0NBQUcsQ0FBQztZQUFFLFlBQVksZ0NBQUcsQ0FBQzs7OEJBRDdDLFVBQVU7Ozs7O0FBTVIsb0JBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLFlBQVksQ0FBRSxDQUFDO0FBQ3hDLGdCQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRW5DLHlCQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXpCLFlBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2pCLFlBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQ3BCLFlBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7O0FBRTVDLGFBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3BDLGdCQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUMvQyxnQkFBSSxDQUFDLFNBQVMsQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBRSxDQUFDLENBQUMsQ0FBQztBQUNqRCxnQkFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRS9DLGdCQUFJLENBQUMsS0FBSyxDQUFDLEVBQUc7QUFDVixvQkFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxHQUFHLENBQUUsQ0FBQztBQUNsRCxvQkFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsR0FBRyxDQUFFLENBQUM7YUFDekQsTUFDSTtBQUNELG9CQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxHQUFHLENBQUUsQ0FBQztBQUN2RCxvQkFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsR0FBRyxDQUFFLENBQUM7YUFDekQ7O0FBRUQsZ0JBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDbkQsZ0JBQUksQ0FBQyxTQUFTLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztBQUNoRCxnQkFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFFLENBQUM7U0FDakU7O0FBRUQsWUFBSSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0tBQ3hFOztjQXBDQyxVQUFVOztBQUFWLGNBQVUsV0FzQ1osT0FBTyxHQUFBLG1CQUFHO0FBQ04sd0JBREosT0FBTyxXQUNJLENBQUM7S0FDWDs7V0F4Q0MsVUFBVTs7O0FBNENoQixPQUFPLENBQUMsU0FBUyxDQUFDLGdCQUFnQixHQUFHLFVBQVUsUUFBUSxFQUFFLFlBQVksRUFBRztBQUNwRSxXQUFPLElBQUksVUFBVSxDQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFFLENBQUM7Q0FDekQsQ0FBQzs7Ozs7Ozs7Ozs7Ozs4QkNqRGtCLHFCQUFxQjs7OzsyQkFDeEIsa0JBQWtCOzs7O0lBRTdCLFlBQVk7QUFDSCxhQURULFlBQVksQ0FDRCxFQUFFLEVBQUc7OEJBRGhCLFlBQVk7O0FBRVYseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLFFBQVEsR0FBRztBQUNaLHFCQUFTLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUU7QUFDaEMsZ0JBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUM5QixDQUFDOztBQUVGLFlBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUN6QyxZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDeEMsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ3JDLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQy9CLFlBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQzs7QUFFckMsWUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUMvQixZQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUUsQ0FBQzs7QUFFbkQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUMvQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNqRCxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1QyxZQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFekMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDbkQsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRW5ELFlBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUN6QyxZQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFFLENBQUM7O0FBRWpDLFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUdyQyxZQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDeEQsWUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDekMsWUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0tBQ3pDOztjQXJDQyxZQUFZOztXQUFaLFlBQVk7OztBQXlDbEIsNEJBQVEsU0FBUyxDQUFDLGtCQUFrQixHQUFHLFlBQVc7QUFDOUMsV0FBTyxJQUFJLFlBQVksQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUNuQyxDQUFDOztxQkFHTSxZQUFZOzs7Ozs7Ozs7Ozs7Ozs4QkNqREEscUJBQXFCOzs7OzhCQUN0QixxQkFBcUI7Ozs7b0NBQ2hCLDJCQUEyQjs7OztpQ0FDOUIsd0JBQXdCOzs7OzJCQUM1QixrQkFBa0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW1CN0IsVUFBVTtBQUNELGFBRFQsVUFBVSxDQUNDLEVBQUUsRUFBb0I7WUFBbEIsV0FBVyxnQ0FBRyxDQUFDOzs4QkFEOUIsVUFBVTs7QUFFUix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUM7QUFDNUIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUIsWUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2hELFlBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNwQyxZQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsY0FBYyxDQUFFLENBQUM7OztBQUd4QyxZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDdkMsWUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQzs7O0FBRzFCLFlBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUMzQyxZQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBRSxDQUFDOzs7QUFHOUMsWUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzdDLFlBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQzs7OztBQUlqQyxZQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDO0FBQ3ZDLFlBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7O0FBRzlDLFlBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztBQUN0QyxZQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFFLENBQUM7OztBQUcvQixZQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO0tBQzdDOztjQXBDQyxVQUFVOztXQUFWLFVBQVU7OztBQTJDaEIsNEJBQVEsU0FBUyxDQUFDLGdCQUFnQixHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQ25ELFdBQU8sSUFBSSxVQUFVLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0NBQ3hDLENBQUM7O3FCQUVhLFVBQVU7Ozs7Ozs7Ozs7Ozs7OzhCQ3RFTCxxQkFBcUI7Ozs7MkJBQ3hCLGtCQUFrQjs7OztJQUU3QixPQUFPO0FBQ0UsYUFEVCxPQUFPLENBQ0ksRUFBRSxFQUEyRTtZQUF6RSxhQUFhLGdDQUFHLElBQUk7WUFBRSxZQUFZLGdDQUFHLEdBQUc7WUFBRSxTQUFTLGdDQUFHLENBQUMsQ0FBQztZQUFFLFFBQVEsZ0NBQUcsQ0FBQzs7OEJBRHJGLE9BQU87O0FBRUwseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxhQUFhLENBQUUsQ0FBQztBQUMxRCxZQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLFlBQVksQ0FBRSxDQUFDO0FBQ3hELFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsU0FBUyxDQUFFLENBQUM7QUFDbEQsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQzs7QUFFaEQsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7QUFDbEQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO0FBQ2hDLFlBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUM7QUFDN0MsWUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQzs7QUFFcEMsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7QUFDbkQsWUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDO0FBQ2xDLFlBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUM7QUFDL0MsWUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQzs7QUFFdEMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUMzQyxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDM0MsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOzs7Ozs7OztBQVE1QyxZQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO0FBQ2pELFlBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDL0MsWUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUN6QyxZQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0tBQzFDOztjQWxDQyxPQUFPOztXQUFQLE9BQU87OztBQXNDYiw0QkFBUSxTQUFTLENBQUMsYUFBYSxHQUFHLFVBQVUsYUFBYSxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFHO0FBQzNGLFdBQU8sSUFBSSxPQUFPLENBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBRSxDQUFDO0NBQ2hGLENBQUM7O3FCQUVhLE9BQU87Ozs7Ozs7Ozs7Ozs7OzhCQzdDRixxQkFBcUI7Ozs7MkJBQ3hCLGtCQUFrQjs7OztBQUVuQyxJQUFJLGdCQUFnQixHQUFHLENBQ25CLE1BQU0sRUFDTixVQUFVLEVBQ1YsVUFBVSxFQUNWLFFBQVEsQ0FDWCxDQUFDOztJQUVJLGNBQWM7QUFDTCxhQURULGNBQWMsQ0FDSCxFQUFFLEVBQUc7OEJBRGhCLGNBQWM7O0FBRVoseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZDLFlBQUksVUFBTyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFFLGdCQUFnQixDQUFDLE1BQU0sQ0FBRSxDQUFDOztBQUU5RCxZQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQzs7QUFFdEIsYUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRztBQUMvQyxnQkFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBQzFDLGVBQUcsQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUUsQ0FBQyxDQUFFLENBQUM7QUFDakMsZUFBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ3hCLGdCQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxHQUFHLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDeEMsZUFBRyxDQUFDLEtBQUssQ0FBRSxDQUFDLENBQUUsQ0FBQztBQUNmLGVBQUcsQ0FBQyxPQUFPLENBQUUsSUFBSSxVQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ2pDLGdCQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBRSxHQUFHLENBQUUsQ0FBQztTQUNoQzs7QUFFRCxZQUFJLFVBQU8sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOzs7QUFHekMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEdBQUcsSUFBSSxVQUFPLENBQUMsT0FBTyxDQUFDO0FBQzdDLFlBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7S0FDNUM7O2NBeEJDLGNBQWM7O1dBQWQsY0FBYzs7O0FBNEJwQiw0QkFBUSxTQUFTLENBQUMsb0JBQW9CLEdBQUcsWUFBVztBQUNoRCxXQUFPLElBQUksY0FBYyxDQUFFLElBQUksQ0FBRSxDQUFDO0NBQ3JDLENBQUM7O3FCQUVhLGNBQWM7Ozs7Ozs7Ozs7Ozs7OzhCQzFDVCxxQkFBcUI7Ozs7MkJBQ3hCLGtCQUFrQjs7OztJQUU3QixXQUFXO0FBQ0YsYUFEVCxXQUFXLENBQ0EsRUFBRSxFQUFHOzhCQURoQixXQUFXOztBQUVULHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUUsQ0FBQztBQUM1RSxZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDeEMsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3pDLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDbkMsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBRSxHQUFHLENBQUUsQ0FBQzs7QUFFL0MsWUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQzs7QUFFL0IsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQy9DLFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUNyQyxZQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5QyxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBRSxDQUFDOztBQUU5QyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDOUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDO0FBQ3ZDLFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFeEMsWUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQzs7O0FBR25DLFlBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDekMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztLQUNwQzs7Y0E1QkMsV0FBVzs7V0FBWCxXQUFXOzs7QUFnQ2pCLDRCQUFRLFNBQVMsQ0FBQyxpQkFBaUIsR0FBRyxZQUFXO0FBQzdDLFdBQU8sSUFBSSxXQUFXLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDbEMsQ0FBQzs7cUJBRWEsV0FBVzs7Ozs7Ozs7Ozs7O1FDdkNuQixxQkFBcUI7OzJCQUNYLGtCQUFrQjs7Ozs7OzZCQUVsQixvQkFBb0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWdDL0IsZUFBZTtBQUNOLGFBRFQsZUFBZSxDQUNKLEVBQUUsRUFBRSxPQUFPLEVBQUc7OEJBRHpCLGVBQWU7O0FBRWIseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSyxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRztBQUNuQyxrQkFBTSxJQUFJLEtBQUssQ0FBRSw0REFBNEQsQ0FBRSxDQUFDO1NBQ25GOztBQUVELFlBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQzs7QUFFbkMsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxPQUFPLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBRSxDQUFDOztBQUUvRCxZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFFLENBQUM7QUFDekQsWUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxPQUFPLE9BQU8sQ0FBQyxZQUFZLEtBQUssUUFBUSxHQUFHLE9BQU8sQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFFLENBQUM7QUFDL0csWUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxPQUFPLE9BQU8sQ0FBQyxXQUFXLEtBQUssUUFBUSxHQUFHLE9BQU8sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFFLENBQUM7QUFDNUcsWUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxJQUFJLFVBQVUsQ0FBQzs7QUFFbkQsWUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQztBQUM5QyxZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLE9BQU8sT0FBTyxDQUFDLFNBQVMsS0FBSyxRQUFRLEdBQUcsT0FBTyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUUsQ0FBQzs7QUFFdEcsWUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLE9BQU8sT0FBTyxDQUFDLG1CQUFtQixLQUFLLFFBQVEsR0FBRyxPQUFPLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxDQUFFLENBQUM7O0FBRXBJLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsT0FBTyxPQUFPLENBQUMsTUFBTSxLQUFLLFFBQVEsR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBRSxDQUFDOztBQUU3RixZQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksTUFBTSxDQUFDOztBQUUzQyxZQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDOztBQUVqRSxZQUFJLENBQUMsc0JBQXNCLEdBQUcsRUFBRSxDQUFDO0FBQ2pDLFlBQUksQ0FBQywwQkFBMEIsR0FBRyxFQUFFLENBQUM7QUFDckMsWUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7S0FDcEI7O2NBL0JDLGVBQWU7O0FBQWYsbUJBQWUsV0FrQ2pCLHNCQUFzQixHQUFBLGdDQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUc7QUFDdkUsZUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsR0FBRyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFFLENBQUM7S0FDckg7Ozs7Ozs7Ozs7QUFwQ0MsbUJBQWUsV0E4Q2pCLGdCQUFnQixHQUFBLDBCQUFFLFdBQVcsRUFBRztBQUM1QixZQUFJLE1BQU0sR0FBRyxHQUFHO1lBQ1osWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDOztBQUUzQyxZQUFLLElBQUksQ0FBQyxVQUFVLEtBQUssVUFBVSxFQUFHO0FBQ2xDLGdCQUFJLElBQUksR0FBRyxZQUFZLENBQUM7O0FBRXhCLGtCQUFNLEdBQUcsSUFBSSxHQUFHLFdBQVcsQ0FBQztBQUM1QixrQkFBTSxJQUFJLElBQUksSUFBSyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUEsQUFBRSxDQUFDO0FBQzdDLGtCQUFNLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQztTQUN4QixNQUNJO0FBQ0QsZ0JBQUksVUFBVSxDQUFDOzs7OztBQUtmLGdCQUFLLFdBQVcsR0FBRyxDQUFDLEVBQUc7O0FBRW5CLG9CQUFLLFdBQVcsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFHO0FBQ3pCLDhCQUFVLEdBQUcsQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDO2lCQUNuQyxNQUNJOztBQUVELHdCQUFLLFdBQVcsR0FBRyxDQUFDLEVBQUc7QUFDbkIsbUNBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBRSxXQUFXLEVBQUUsQ0FBQyxDQUFFLEdBQUcsQ0FBQyxDQUFDO3FCQUNqRTs7QUFFRCw4QkFBVSxHQUFHLFdBQVcsQ0FBQztpQkFDNUI7Ozs7QUFJRCxzQkFBTSxHQUFHLFlBQVksR0FBRyxVQUFVLENBQUM7YUFDdEM7U0FDSjs7QUFFRCxlQUFPLE1BQU0sQ0FBQztLQUNqQjs7QUFwRkMsbUJBQWUsV0FzRmpCLG1CQUFtQixHQUFBLDZCQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUc7QUFDcEMsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVM7WUFDckIsSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSztZQUMzQixTQUFTO1lBQ1QsY0FBYyxDQUFDOztBQUVuQixZQUFLLElBQUksS0FBSyxHQUFHLEVBQUc7QUFDaEIscUJBQVMsR0FBRyxHQUFHLENBQUM7U0FDbkI7O0FBRUQsWUFBSyxJQUFJLEtBQUssT0FBTyxFQUFHO0FBQ3BCLHFCQUFTLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQztTQUM1QixNQUNJO0FBQ0QsMEJBQWMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLE9BQU8sR0FBRyxPQUFPLENBQUUsQ0FBQztBQUMvQywwQkFBYyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFFLGNBQWMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFFLENBQUM7QUFDM0QscUJBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FDaEMsY0FBYyxFQUNkLENBQUMsRUFDRCxHQUFHLEVBQ0gsQ0FBQyxFQUNELElBQUksQ0FDUCxHQUFHLEtBQUssQ0FBQztTQUNiOztBQUVELGVBQU8sU0FBUyxDQUFDO0tBQ3BCOztBQWhIQyxtQkFBZSxXQW1IakIscUJBQXFCLEdBQUEsK0JBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRztBQUNoRCxZQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUM7O0FBRTFDLGVBQU8sQ0FBRSxTQUFTLENBQUUsR0FBRyxPQUFPLENBQUUsU0FBUyxDQUFFLElBQUksRUFBRSxDQUFDO0FBQ2xELGVBQU8sQ0FBRSxTQUFTLENBQUUsQ0FBQyxPQUFPLENBQUUsZUFBZSxDQUFFLENBQUM7QUFDaEQsWUFBSSxDQUFDLDBCQUEwQixDQUFDLE9BQU8sQ0FBRSxlQUFlLENBQUUsQ0FBQztLQUM5RDs7QUF6SEMsbUJBQWUsV0EySGpCLHFCQUFxQixHQUFBLCtCQUFFLFNBQVMsRUFBRztBQUMvQixZQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUUsU0FBUyxDQUFFO1lBQ2xELEtBQUssR0FBRyxDQUFDLENBQUM7O0FBRWQsWUFBSyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRztBQUNwQyxtQkFBTyxJQUFJLENBQUM7U0FDZjs7QUFFRCxZQUFJLENBQUMsMEJBQTBCLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDdEMsZUFBTyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7S0FDeEI7O0FBcklDLG1CQUFlLFdBdUlqQiw0QkFBNEIsR0FBQSx3Q0FBRztBQUMzQixZQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsR0FBRyxFQUFFO1lBQ2pELFNBQVMsQ0FBQzs7QUFFZCxlQUFPLENBQUMsR0FBRyxDQUFFLE9BQU8sRUFBRSxTQUFTLENBQUUsQ0FBQzs7QUFFbEMsWUFBSyxLQUFLLENBQUMsT0FBTyxDQUFFLFNBQVMsQ0FBRSxFQUFHO0FBQzlCLHFCQUFTLEdBQUcsU0FBUyxDQUFFLENBQUMsQ0FBRSxDQUFDLFNBQVMsQ0FBQzs7QUFFckMsaUJBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3pDLG9CQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBRSxTQUFTLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBRSxDQUFDO0FBQzVELDRCQUFZLENBQUUsU0FBUyxDQUFFLENBQUMsQ0FBRSxDQUFDLEtBQUssQ0FBRSxDQUFDO2FBQ3hDO1NBQ0osTUFDSTtBQUNELHFCQUFTLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQztBQUNoQyxnQkFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUUsQ0FBQztBQUN2RCx3QkFBWSxDQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUUsQ0FBQztTQUNuQzs7QUFFRCxZQUFJLENBQUMsc0JBQXNCLENBQUUsU0FBUyxDQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRS9DLGVBQU8sU0FBUyxDQUFDO0tBQ3BCOztBQTlKQyxtQkFBZSxXQWlLakIscUJBQXFCLEdBQUEsK0JBQUUsZUFBZSxFQUFFLEtBQUssRUFBRztBQUM1Qyx1QkFBZSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0FBQzFELFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFFLGVBQWUsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0FBQ2hFLHVCQUFlLENBQUMsS0FBSyxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQ2xDOztBQXJLQyxtQkFBZSxXQXVLakIsWUFBWSxHQUFBLHNCQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFHO0FBQ3ZDLFlBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSztZQUMxQixNQUFNLEdBQUcsR0FBRztZQUNaLG9CQUFvQjtZQUNwQixlQUFlO1lBQ2Ysb0JBQW9CLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLE1BQU07WUFDN0QsaUJBQWlCO1lBQ2pCLFNBQVMsR0FBRyxHQUFHLENBQUM7O0FBRXBCLFlBQUssb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUc7QUFDL0MsZ0JBQUssTUFBTSxLQUFLLEdBQUcsRUFBRztBQUNsQiwrQkFBZSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBRSxDQUFDO0FBQ3ZHLG9CQUFJLENBQUMscUJBQXFCLENBQUUsZUFBZSxFQUFFLEtBQUssQ0FBRSxDQUFDO0FBQ3JELG9CQUFJLENBQUMscUJBQXFCLENBQUUsU0FBUyxFQUFFLGVBQWUsQ0FBRSxDQUFDO2FBQzVELE1BQ0k7QUFDRCxvQ0FBb0IsR0FBRyxFQUFFLENBQUM7O0FBRTFCLHFCQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQy9CLDBCQUFNLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3BDLG1DQUFlLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDdkcsd0JBQUksQ0FBQyxxQkFBcUIsQ0FBRSxlQUFlLEVBQUUsS0FBSyxDQUFFLENBQUM7QUFDckQsd0NBQW9CLENBQUMsSUFBSSxDQUFFLGVBQWUsQ0FBRSxDQUFDO2lCQUNoRDs7QUFFRCxvQkFBSSxDQUFDLHFCQUFxQixDQUFFLFNBQVMsRUFBRSxvQkFBb0IsQ0FBRSxDQUFDO2FBQ2pFO1NBQ0osTUFFSTtBQUNELGdCQUFLLE1BQU0sS0FBSyxHQUFHLEVBQUc7QUFDbEIsK0JBQWUsR0FBRyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztBQUN0RCxpQ0FBaUIsR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFDO0FBQzlDLHlCQUFTLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFFLGlCQUFpQixFQUFFLFNBQVMsQ0FBRSxDQUFDOztBQUVyRSwrQkFBZSxDQUFDLEtBQUssQ0FBRSxTQUFTLEVBQUUsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEdBQUcsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFFLENBQUM7QUFDMUYsb0JBQUksQ0FBQyxxQkFBcUIsQ0FBRSxTQUFTLEVBQUUsZUFBZSxDQUFFLENBQUM7YUFDNUQsTUFDSTtBQUNELCtCQUFlLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7QUFDdEQsaUNBQWlCLEdBQUcsZUFBZSxDQUFFLENBQUMsQ0FBRSxDQUFDLFNBQVMsQ0FBQztBQUNuRCx5QkFBUyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBRSxpQkFBaUIsRUFBRSxTQUFTLENBQUUsQ0FBQzs7QUFFckUscUJBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDL0IsMEJBQU0sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUUsQ0FBQyxDQUFFLENBQUM7QUFDcEMsbUNBQWUsQ0FBRSxDQUFDLENBQUUsQ0FBQyxLQUFLLENBQUUsU0FBUyxFQUFFLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxHQUFHLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBRSxDQUFDO2lCQUNsRzs7QUFFRCxvQkFBSSxDQUFDLHFCQUFxQixDQUFFLFNBQVMsRUFBRSxlQUFlLENBQUUsQ0FBQzthQUM1RDtTQUNKOzs7QUFHRCxlQUFPLG9CQUFvQixHQUFHLG9CQUFvQixHQUFHLGVBQWUsQ0FBQztLQUN4RTs7QUE3TkMsbUJBQWUsV0ErTmpCLEtBQUssR0FBQSxlQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFHO0FBQ2hDLFlBQUksSUFBSSxHQUFHLENBQUM7WUFDUixtQkFBbUIsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDOztBQUV6RCxnQkFBUSxHQUFHLE9BQU8sUUFBUSxLQUFLLFFBQVEsR0FBRyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZELGFBQUssR0FBRyxPQUFPLEtBQUssS0FBSyxRQUFRLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQzs7QUFHOUMsWUFBSyxtQkFBbUIsS0FBSyxDQUFDLEVBQUc7QUFDN0Isb0JBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsbUJBQW1CLEdBQUcsR0FBRyxFQUFFLEdBQUcsR0FBRyxtQkFBbUIsR0FBRyxHQUFHLENBQUUsQ0FBQTtTQUN2SCxNQUNJO0FBQ0Qsb0JBQVEsR0FBRyxHQUFHLENBQUM7U0FDbEI7O0FBR0QsWUFBSyxPQUFPLFNBQVMsS0FBSyxRQUFRLEVBQUc7QUFDakMsZ0JBQUksQ0FBQyxZQUFZLENBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUUsQ0FBQztTQUNuRDs7Ozs7Ozs7Ozs7O0FBWUQsZUFBTyxJQUFJLENBQUM7S0FDZjs7QUE5UEMsbUJBQWUsV0FrUWpCLG9CQUFvQixHQUFBLDhCQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUc7QUFDM0MsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUVoQixZQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBRSxlQUFlLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQzs7QUFFL0QsdUJBQWUsQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFFLFlBQVc7O0FBRTNDLDJCQUFlLENBQUMsSUFBSSxDQUFFLEtBQUssQ0FBRSxDQUFDO0FBQzlCLDJCQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDMUIsMkJBQWUsR0FBRyxJQUFJLENBQUM7U0FDMUIsRUFBRSxLQUFLLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxHQUFHLElBQUksR0FBRyxHQUFHLENBQUUsQ0FBQztLQUNoRTs7QUE3UUMsbUJBQWUsV0ErUWpCLFdBQVcsR0FBQSxxQkFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRztBQUN0QyxZQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUUsU0FBUyxDQUFFLENBQUM7O0FBRTlELFlBQUssZUFBZSxFQUFHOztBQUVuQixnQkFBSyxLQUFLLENBQUMsT0FBTyxDQUFFLGVBQWUsQ0FBRSxFQUFHO0FBQ3BDLHFCQUFNLElBQUksQ0FBQyxHQUFHLGVBQWUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDcEQsd0JBQUksQ0FBQyxvQkFBb0IsQ0FBRSxlQUFlLENBQUUsQ0FBQyxDQUFFLEVBQUUsS0FBSyxDQUFFLENBQUM7aUJBQzVEO2FBQ0osTUFDSTtBQUNELG9CQUFJLENBQUMsb0JBQW9CLENBQUUsZUFBZSxFQUFFLEtBQUssQ0FBRSxDQUFDO2FBQ3ZEO1NBQ0o7O0FBRUQsdUJBQWUsR0FBRyxJQUFJLENBQUM7S0FDMUI7O0FBL1JDLG1CQUFlLFdBaVNqQixJQUFJLEdBQUEsY0FBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRztBQUMvQixnQkFBUSxHQUFHLE9BQU8sUUFBUSxLQUFLLFFBQVEsR0FBRyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZELGFBQUssR0FBRyxPQUFPLEtBQUssS0FBSyxRQUFRLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQzs7QUFFOUMsWUFBSyxPQUFPLFNBQVMsS0FBSyxRQUFRLEVBQUc7QUFDakMsZ0JBQUksQ0FBQyxXQUFXLENBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUUsQ0FBQztTQUNsRDs7Ozs7Ozs7Ozs7O0FBWUQsZUFBTyxJQUFJLENBQUM7S0FDZjs7V0FwVEMsZUFBZTs7OztBQXlUckIsZUFBZSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFPLENBQUM7O0FBRXRDLE9BQU8sQ0FBQyxTQUFTLENBQUMscUJBQXFCLEdBQUcsVUFBVSxPQUFPLEVBQUc7QUFDMUQsV0FBTyxJQUFJLGVBQWUsQ0FBRSxJQUFJLEVBQUUsT0FBTyxDQUFFLENBQUM7Q0FDL0MsQ0FBQzs7Ozs7Ozs4QkM5VmtCLG9CQUFvQjs7OzsyQkFFdkIsaUJBQWlCOzs7OzRCQUNoQixrQkFBa0I7Ozs7UUFDN0IsdUJBQXVCOzs7O1FBS3ZCLGdCQUFnQjs7UUFDaEIsd0JBQXdCOztRQUV4QixzQ0FBc0M7O1FBQ3RDLG1DQUFtQzs7UUFHbkMsa0NBQWtDOztRQUNsQyw4QkFBOEI7O1FBQzlCLDZCQUE2Qjs7UUFDN0IsNkJBQTZCOztRQUM3QixrQ0FBa0M7O1FBR2xDLHlDQUF5Qzs7UUFDekMsNkNBQTZDOztRQUM3Qyw2Q0FBNkM7O1FBQzdDLGlEQUFpRDs7UUFDakQsd0NBQXdDOztRQUN4QywwQ0FBMEM7O1FBQzFDLDhDQUE4Qzs7UUFFOUMsOENBQThDOztRQUM5QyxrQ0FBa0M7O1FBQ2xDLGlDQUFpQzs7UUFDakMsa0NBQWtDOztRQUVsQyxnQkFBZ0I7O1FBQ2hCLGdCQUFnQjs7UUFDaEIsb0JBQW9COztRQUNwQixxQkFBcUI7O1FBQ3JCLGtCQUFrQjs7UUFDbEIscUJBQXFCOztRQUNyQixtQkFBbUI7O1FBQ25CLGtCQUFrQjs7UUFDbEIsZ0JBQWdCOztRQUNoQixnQkFBZ0I7O1FBQ2hCLHFCQUFxQjs7UUFDckIsbUJBQW1COztRQUNuQixnQkFBZ0I7O1FBQ2hCLHVCQUF1Qjs7UUFDdkIsa0JBQWtCOztRQUNsQixrQkFBa0I7O1FBQ2xCLHFCQUFxQjs7UUFDckIsaUJBQWlCOztRQUNqQixpQkFBaUI7O1FBQ2pCLHFCQUFxQjs7UUFDckIsbUJBQW1COztRQUNuQixtQkFBbUI7O1FBRW5CLGlCQUFpQjs7UUFDakIsd0JBQXdCOztRQUV4QixnQ0FBZ0M7O1FBQ2hDLDhCQUE4Qjs7UUFFOUIsc0JBQXNCOztRQUN0QiwyQkFBMkI7O1FBQzNCLDZCQUE2Qjs7UUFDN0Isc0JBQXNCOztRQUN0Qix5QkFBeUI7O1FBQ3pCLDBCQUEwQjs7UUFDMUIseUJBQXlCOztRQUV6QixtQ0FBbUM7O0FBM0UxQyxNQUFNLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxZQUFZLElBQUksTUFBTSxDQUFDLGtCQUFrQixDQUFDOzs7O0FBK0V2RSxNQUFNLENBQUMsS0FBSyw0QkFBUSxDQUFDO0FBQ3JCLE1BQU0sQ0FBQyxJQUFJLDJCQUFPLENBQUM7Ozs7Ozs7Ozs7O1FDaEZaLHFCQUFxQjs7MkJBQ1gsa0JBQWtCOzs7O0lBRzdCLEdBQUc7Ozs7OztBQUtNLGFBTFQsR0FBRyxDQUtRLEVBQUUsRUFBa0I7WUFBaEIsUUFBUSxnQ0FBRyxFQUFFOzs4QkFMNUIsR0FBRzs7QUFNRCx5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHbEIsWUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRTNDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsWUFBWSxDQUFDO0FBQy9DLFlBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUM7O0FBRTVDLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBRSxVQUFVLENBQUMsRUFBRztBQUNsRCxtQkFBTyxJQUFJLENBQUMsR0FBRyxDQUFFLENBQUMsQ0FBRSxDQUFDO1NBQ3hCLEVBQUUsSUFBSSxHQUFHLFFBQVEsQ0FBRSxDQUFDOztBQUdyQixZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUM7QUFDeEMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0tBQzVDOztjQXJCQyxHQUFHOztBQUFILE9BQUcsV0F1QkwsT0FBTyxHQUFBLG1CQUFHO0FBQ04sd0JBREosT0FBTyxXQUNJLENBQUM7QUFDUixZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3RCLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0tBQ3RCOztXQTNCQyxHQUFHOzs7QUE4QlQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsVUFBVSxRQUFRLEVBQUc7QUFDL0MsV0FBTyxJQUFJLEdBQUcsQ0FBRSxJQUFJLEVBQUUsUUFBUSxDQUFFLENBQUM7Q0FDcEMsQ0FBQzs7Ozs7Ozs7Ozs7OztRQ3BDSyxxQkFBcUI7OzJCQUNYLGtCQUFrQjs7Ozs7Ozs7Ozs7Ozs7OztJQWE3QixHQUFHO0FBQ00sYUFEVCxHQUFHLENBQ1EsRUFBRSxFQUFFLEtBQUssRUFBRzs4QkFEdkIsR0FBRzs7QUFFRCx5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBRSxDQUFDOztBQUVoRCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDOUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOzs7QUFHOUMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQztLQUMxQzs7Y0FYQyxHQUFHOztBQUFILE9BQUcsV0FvQkwsT0FBTyxHQUFBLG1CQUFHO0FBQ04sd0JBREosT0FBTyxXQUNJLENBQUM7QUFDUixZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztLQUN2Qjs7aUJBdkJDLEdBQUc7O2FBYUksZUFBRztBQUNSLG1CQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1NBQzlCO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDO1NBQ3pFOzs7V0FsQkMsR0FBRzs7O0FBMkJULE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQzVDLFdBQU8sSUFBSSxHQUFHLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0NBQ2pDLENBQUM7Ozs7Ozs7Ozs7O1FDM0NLLHFCQUFxQjs7MkJBQ1gsa0JBQWtCOzs7O0lBRzdCLE9BQU87Ozs7OztBQUtFLGFBTFQsT0FBTyxDQUtJLEVBQUUsRUFBRSxVQUFVLEVBQW1CO1lBQWpCLFVBQVUsZ0NBQUcsQ0FBQzs7OEJBTHpDLE9BQU87O0FBTUwseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxTQUFTLEdBQUcsQUFBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUksVUFBVTtZQUN0RCxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQzs7QUFFNUIsWUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUUsQ0FBQztBQUN4RSxZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDekMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNqRCxZQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMvQyxZQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXhELFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBRSxDQUFDOztBQUVoRixZQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7OztBQUdyQyxhQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ2xDLGdCQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZDLGlCQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDMUIsZ0JBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUN6QyxnQkFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUUsQ0FBQztBQUN0QixpQkFBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsR0FBRyxDQUFFLENBQUM7QUFDMUIsZ0JBQUksR0FBRyxLQUFLLENBQUM7U0FDaEI7OztBQUdELFlBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUNoQyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBbUI1Qzs7Y0FwREMsT0FBTzs7QUFBUCxXQUFPLFdBc0RULE9BQU8sR0FBQSxtQkFBRztBQUNOLHdCQURKLE9BQU8sV0FDSSxDQUFDO0FBQ1IsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN0QixZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztLQUN0Qjs7V0ExREMsT0FBTzs7O0FBNkRiLE9BQU8sQ0FBQyxTQUFTLENBQUMsYUFBYSxHQUFHLFVBQVUsVUFBVSxFQUFFLFVBQVUsRUFBRztBQUNqRSxXQUFPLElBQUksT0FBTyxDQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFFLENBQUM7Q0FDdEQsQ0FBQzs7Ozs7Ozs7Ozs7UUNuRUsscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7SUFHN0IsUUFBUTs7Ozs7O0FBS0MsYUFMVCxRQUFRLENBS0csRUFBRSxFQUFFLFVBQVUsRUFBRzs4QkFMNUIsUUFBUTs7QUFNTix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBRSxDQUFDO0FBQ3hFLFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUN6QyxZQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxVQUFVLENBQUUsQ0FBQztBQUM3RCxZQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMvQyxZQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXhELFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUUsR0FBRyxDQUFFLENBQUM7QUFDNUMsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDOztBQUVyQyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZDLGFBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUMxQixZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDekMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFFLENBQUM7QUFDbEMsYUFBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsR0FBRyxDQUFFLENBQUM7O0FBRTFCLFlBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDeEMsY0FBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUMxQyxhQUFLLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBRSxDQUFDO0FBQ3hCLGNBQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDOztBQUUzQixZQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUM7QUFDaEMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0tBQzVDOztjQS9CQyxRQUFROztBQUFSLFlBQVEsV0FpQ1YsT0FBTyxHQUFBLG1CQUFHO0FBQ04sd0JBREosT0FBTyxXQUNJLENBQUM7QUFDUixZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3RCLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0tBQ3RCOztXQXJDQyxRQUFROzs7QUF3Q2QsT0FBTyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEdBQUcsVUFBVSxVQUFVLEVBQUc7QUFDdEQsV0FBTyxJQUFJLFFBQVEsQ0FBRSxJQUFJLEVBQUUsVUFBVSxDQUFFLENBQUM7Q0FDM0MsQ0FBQzs7Ozs7Ozs7Ozs7OztRQzlDSyxxQkFBcUI7OzJCQUNYLGtCQUFrQjs7Ozs7Ozs7Ozs7SUFRN0IsS0FBSztBQUNJLGFBRFQsS0FBSyxDQUNNLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFHOzhCQURwQyxLQUFLOztBQUVILHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsUUFBUSxDQUFFLENBQUM7QUFDekMsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxRQUFRLENBQUUsQ0FBQzs7QUFFekMsWUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDOztBQUU3QixZQUFJLENBQUMsTUFBTSxHQUFHLENBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDO0FBQzNCLFlBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBRSxJQUFJLENBQUMsR0FBRyxDQUFFLENBQUM7OztBQUc1QixZQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDNUMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO0tBQy9DOztjQWZDLEtBQUs7O0FBQUwsU0FBSyxXQWlCUCxPQUFPLEdBQUEsbUJBQUc7QUFDTix3QkFESixPQUFPLFdBQ0ksQ0FBQztBQUNSLFlBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO0FBQ2hCLFlBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO0tBQ25COztpQkFyQkMsS0FBSzs7YUF1QkssZUFBRztBQUNYLG1CQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO1NBQ3pCO2FBQ1csYUFBRSxLQUFLLEVBQUc7QUFDbEIsZ0JBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUMxQjs7O2FBRVcsZUFBRztBQUNYLG1CQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO1NBQ3pCO2FBQ1csYUFBRSxLQUFLLEVBQUc7QUFDbEIsZ0JBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUMxQjs7O1dBbkNDLEtBQUs7OztBQXdDWCxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxVQUFVLFFBQVEsRUFBRSxRQUFRLEVBQUc7QUFDM0QsV0FBTyxJQUFJLEtBQUssQ0FBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBRSxDQUFDO0NBQ2hELENBQUM7Ozs7Ozs7Ozs7Ozs7OEJDbkRrQixxQkFBcUI7Ozs7MkJBQ3hCLGtCQUFrQjs7OztJQUU3QixRQUFROzs7Ozs7O0FBTUMsYUFOVCxRQUFRLENBTUcsRUFBRSxFQUFnQjtZQUFkLEtBQUssZ0NBQUcsR0FBRzs7OEJBTjFCLFFBQVE7O0FBT04seUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sS0FBSyxLQUFLLFFBQVEsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ3JFLFlBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7S0FDdkQ7O2NBWEMsUUFBUTs7aUJBQVIsUUFBUTs7YUFhRCxlQUFHO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1NBQ3ZDO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUN4Qzs7O1dBbEJDLFFBQVE7OztBQXFCZCw0QkFBUSxTQUFTLENBQUMsY0FBYyxHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQ2pELFdBQU8sSUFBSSxRQUFRLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0NBQ3RDLENBQUM7OztBQUlGLEFBQUMsQ0FBQSxZQUFXO0FBQ1IsUUFBSSxDQUFDLEVBQ0QsRUFBRSxFQUNGLEdBQUcsRUFDSCxJQUFJLEVBQ0osR0FBRyxFQUNILE1BQU0sRUFDTixLQUFLLEVBQ0wsT0FBTyxFQUNQLEtBQUssQ0FBQzs7QUFFVixnQ0FBUSxTQUFTLENBQUMsZUFBZSxHQUFHLFlBQVc7QUFDM0MsWUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUUsSUFBSSxDQUFDLENBQUMsQ0FBRSxDQUFDO0FBQzNDLFNBQUMsR0FBRyxDQUFDLENBQUM7QUFDTixlQUFPLENBQUMsQ0FBQztLQUNaLENBQUM7O0FBRUYsZ0NBQVEsU0FBUyxDQUFDLGdCQUFnQixHQUFHLFlBQVc7QUFDNUMsWUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBRSxDQUFDO0FBQzdDLFVBQUUsR0FBRyxDQUFDLENBQUM7QUFDUCxlQUFPLENBQUMsQ0FBQztLQUNaLENBQUM7O0FBRUYsZ0NBQVEsU0FBUyxDQUFDLGlCQUFpQixHQUFHLFlBQVc7QUFDN0MsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUUsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUUsQ0FBQztBQUNsRCxXQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ1IsZUFBTyxDQUFDLENBQUM7S0FDWixDQUFDOztBQUVGLGdDQUFRLFNBQVMsQ0FBQyxrQkFBa0IsR0FBRyxZQUFXO0FBQzlDLFlBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFFLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQztBQUNqRCxZQUFJLEdBQUcsQ0FBQyxDQUFDO0FBQ1QsZUFBTyxDQUFDLENBQUM7S0FDWixDQUFDOztBQUVGLGdDQUFRLFNBQVMsQ0FBQyxpQkFBaUIsR0FBRyxZQUFXO0FBQzdDLFlBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFFLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQztBQUMvQyxXQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ1IsZUFBTyxDQUFDLENBQUM7S0FDWixDQUFDOztBQUVGLGdDQUFRLFNBQVMsQ0FBQyxvQkFBb0IsR0FBRyxZQUFXO0FBQ2hELFlBQUksQ0FBQyxHQUFHLE1BQU0sSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUNyRCxjQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ1gsZUFBTyxDQUFDLENBQUM7S0FDWixDQUFDOztBQUVGLGdDQUFRLFNBQVMsQ0FBQyxtQkFBbUIsR0FBRyxZQUFXO0FBQy9DLFlBQUksQ0FBQyxHQUFHLEtBQUssSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUNuRCxhQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ1YsZUFBTyxDQUFDLENBQUM7S0FDWixDQUFDOztBQUVGLGdDQUFRLFNBQVMsQ0FBQyxxQkFBcUIsR0FBRyxZQUFXO0FBQ2pELFlBQUksQ0FBQyxHQUFHLE9BQU8sSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQztBQUN2RCxlQUFPLEdBQUcsQ0FBQyxDQUFDO0FBQ1osZUFBTyxDQUFDLENBQUM7S0FDWixDQUFDOztBQUVGLGdDQUFRLFNBQVMsQ0FBQyxtQkFBbUIsR0FBRyxZQUFXO0FBQy9DLFlBQUksQ0FBQyxHQUFHLEtBQUssSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUNuRCxhQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ1YsZUFBTyxDQUFDLENBQUM7S0FDWixDQUFDO0NBQ0wsQ0FBQSxFQUFFLENBQUU7Ozs7Ozs7Ozs7Ozs7UUM5RkUscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7OztJQU03QixNQUFNO0FBQ0csYUFEVCxNQUFNLENBQ0ssRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUc7OEJBRGpDLE1BQU07O0FBRUoseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUUsQ0FBQzs7QUFFaEQsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLEtBQUssQ0FBQzs7QUFFckMsWUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQzs7QUFFbkMsWUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFFLFFBQVEsQ0FBRSxDQUFDO0FBQ3ZELFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxVQUFVLENBQUUsQ0FBQzs7QUFFNUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0FBQzlDLFlBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFFLENBQUM7O0FBRWxELFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUM7S0FDNUM7O2NBakJDLE1BQU07O0FBQU4sVUFBTSxXQW1CUixPQUFPLEdBQUEsbUJBQUc7QUFDTix3QkFESixPQUFPLFdBQ0ksQ0FBQztBQUNSLFlBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDMUIsWUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDdkIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7S0FDdEI7O2lCQXhCQyxNQUFNOzthQTBCQyxlQUFHO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztTQUN0QjthQUNRLGFBQUUsS0FBSyxFQUFHO0FBQ2YsZ0JBQUssT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFHO0FBQzdCLG9CQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQzs7O0FBR3BCLG9CQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDOzthQUV4QztTQUNKOzs7YUFFVyxlQUFHO0FBQ1gsbUJBQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7U0FDbkM7YUFDVyxhQUFFLEtBQUssRUFBRztBQUNsQixnQkFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1NBQ3BDOzs7V0E1Q0MsTUFBTTs7O0FBK0NaLE9BQU8sQ0FBQyxTQUFTLENBQUMsWUFBWSxHQUFHLFVBQVUsS0FBSyxFQUFFLFFBQVEsRUFBRztBQUN6RCxXQUFPLElBQUksTUFBTSxDQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFFLENBQUM7Q0FDOUMsQ0FBQzs7Ozs7Ozs7Ozs7UUN4REsscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7O0lBTTdCLEtBQUs7QUFDSSxhQURULEtBQUssQ0FDTSxFQUFFLEVBQUc7OEJBRGhCLEtBQUs7O0FBRUgseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBRSxDQUFDOzs7O0FBSS9ELFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNyQyxZQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzs7QUFFL0MsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDO0FBQzdDLFlBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLE1BQUcsQ0FBRSxDQUFDO0FBQzNDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFFLENBQUM7QUFDN0MsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sUUFBSyxDQUFFLENBQUM7O0FBRXhDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUN4QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7S0FDNUM7O2NBbEJDLEtBQUs7O0FBQUwsU0FBSyxXQW9CUCxPQUFPLEdBQUEsbUJBQUc7QUFDTix3QkFESixPQUFPLFdBQ0ksQ0FBQzs7QUFFUixZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3RCLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDdEIsWUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFM0IsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7S0FDM0I7O1dBOUJDLEtBQUs7OztBQWlDWCxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxZQUFXO0FBQ3ZDLFdBQU8sSUFBSSxLQUFLLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDNUIsQ0FBQzs7Ozs7Ozs7Ozs7UUMxQ0sscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7SUFFN0IsSUFBSTs7Ozs7O0FBS0ssYUFMVCxJQUFJLENBS08sRUFBRSxFQUFHOzhCQUxoQixJQUFJOztBQU1GLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUMvQixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDekMsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDOztBQUV6QyxZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDbkMsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7QUFFbkMsWUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDeEMsWUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDN0MsWUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRTFDLFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3JDLFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUV4QyxZQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRXRDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUN2QyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsR0FBRyxDQUFFLENBQUM7QUFDckMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDOztBQUV2QyxZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDN0IsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztLQUNwQzs7Y0FqQ0MsSUFBSTs7QUFBSixRQUFJLFdBbUNOLE9BQU8sR0FBQSxtQkFBRztBQUNOLHdCQURKLE9BQU8sV0FDSSxDQUFDOzs7S0FHWDs7V0F2Q0MsSUFBSTs7O0FBMENWLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFHLFlBQVc7QUFDdEMsV0FBTyxJQUFJLElBQUksQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUMzQixDQUFDOzs7Ozs7Ozs7Ozs7O1FDL0NLLHFCQUFxQjs7MkJBQ1gsa0JBQWtCOzs7Ozs7Ozs7O0lBUTdCLEdBQUc7QUFDTSxhQURULEdBQUcsQ0FDUSxFQUFFLEVBQUUsS0FBSyxFQUFHOzhCQUR2QixHQUFHOztBQUVELHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0FBQy9DLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsS0FBSyxDQUFFLENBQUM7QUFDdEUsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDO0FBQzdDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBRSxDQUFDOztBQUU1RCxZQUFJLFVBQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRTNDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksVUFBTyxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0FBQ3BELFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksVUFBTyxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0FBQ3BELFlBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFFLElBQUksVUFBTyxDQUFDLE9BQU8sQ0FBRSxDQUFDO0FBQ2hELFlBQUksVUFBTyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7S0FDNUM7O2NBZkMsR0FBRzs7QUFBSCxPQUFHLFdBaUJMLE9BQU8sR0FBQSxtQkFBRztBQUNOLHdCQURKLE9BQU8sV0FDSSxDQUFDOztBQUVSLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzlCLFlBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDM0IsWUFBSSxVQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRXRCLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztBQUMzQixZQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztBQUN4QixZQUFJLFVBQU8sR0FBRyxJQUFJLENBQUM7S0FDdEI7O2lCQTNCQyxHQUFHOzthQTZCSSxlQUFHO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1NBQ3BDO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUNyQzs7O1dBbENDLEdBQUc7OztBQXFDVCxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFVLEtBQUssRUFBRztBQUM1QyxXQUFPLElBQUksR0FBRyxDQUFFLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQztDQUNqQyxDQUFDOzs7Ozs7Ozs7Ozs7O1FDaERLLHFCQUFxQjs7MkJBQ1gsa0JBQWtCOzs7Ozs7Ozs7O0lBTzdCLEdBQUc7QUFDTSxhQURULEdBQUcsQ0FDUSxFQUFFLEVBQUUsS0FBSyxFQUFHOzhCQUR2QixHQUFHOztBQUVELHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBR2xCLFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUN6QyxZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBRSxDQUFDO0FBQ3RFLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUUsQ0FBQzs7QUFFekQsWUFBSSxVQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUUzQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLFVBQU8sQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztBQUNwRCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLFVBQU8sQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztBQUNwRCxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLFVBQU8sQ0FBQyxPQUFPLENBQUUsQ0FBQztBQUM3QyxZQUFJLFVBQU8sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0tBQzVDOztjQWhCQyxHQUFHOztBQUFILE9BQUcsV0FtQkwsT0FBTyxHQUFBLG1CQUFHO0FBQ04sd0JBREosT0FBTyxXQUNJLENBQUM7O0FBRVIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDOUIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN4QixZQUFJLFVBQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFdEIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQzNCLFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLFlBQUksVUFBTyxHQUFHLElBQUksQ0FBQztLQUN0Qjs7aUJBN0JDLEdBQUc7O2FBK0JJLGVBQUc7QUFDUixtQkFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7U0FDcEM7YUFDUSxhQUFFLEtBQUssRUFBRztBQUNmLGdCQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQ3JDOzs7V0FwQ0MsR0FBRzs7O0FBd0NULE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQzVDLFdBQU8sSUFBSSxHQUFHLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0NBQ2pDLENBQUM7Ozs7Ozs7Ozs7Ozs7UUNsREsscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7OztJQU03QixRQUFRO0FBQ0MsYUFEVCxRQUFRLENBQ0csRUFBRSxFQUFFLEtBQUssRUFBRzs4QkFEdkIsUUFBUTs7QUFFTix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBRSxDQUFDO0FBQ2hELFlBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7O0FBRW5DLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztBQUM5QyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBRSxDQUFDOztBQUVuRCxZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDO0tBQzFDOztjQVhDLFFBQVE7O0FBQVIsWUFBUSxXQWFWLE9BQU8sR0FBQSxtQkFBRztBQUNOLHdCQURKLE9BQU8sV0FDSSxDQUFDO0FBQ1IsWUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7S0FDdkI7O2lCQWhCQyxRQUFROzthQWtCRCxlQUFHO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1NBQ3BDO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDO1NBQ3pFOzs7V0F2QkMsUUFBUTs7O0FBMkJkLE9BQU8sQ0FBQyxTQUFTLENBQUMsY0FBYyxHQUFHLFVBQVUsTUFBTSxFQUFFLE1BQU0sRUFBRztBQUMxRCxXQUFPLElBQUksUUFBUSxDQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFFLENBQUM7Q0FDL0MsQ0FBQzs7Ozs7Ozs7Ozs7UUNwQ0sscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7OztJQU03QixNQUFNO0FBQ0csYUFEVCxNQUFNLENBQ0ssRUFBRSxFQUFHOzhCQURoQixNQUFNOztBQUVKLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNqQyxZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7S0FDOUI7O2NBTkMsTUFBTTs7V0FBTixNQUFNOzs7QUFVWixPQUFPLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxZQUFXO0FBQ3hDLFdBQU8sSUFBSSxNQUFNLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDN0IsQ0FBQzs7Ozs7Ozs7Ozs7OztRQ25CSyxxQkFBcUI7OzJCQUNYLGtCQUFrQjs7Ozs7Ozs7OztJQU83QixHQUFHO0FBQ00sYUFEVCxHQUFHLENBQ1EsRUFBRSxFQUFFLEtBQUssRUFBRzs4QkFEdkIsR0FBRzs7QUFFRCx5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztBQUN0QixZQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQzs7QUFFcEIsYUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLEVBQUUsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDM0QsZ0JBQUksQ0FBQyxXQUFXLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUNqRCxnQkFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFFLENBQUM7QUFDakUsZ0JBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0FBQ3RDLGdCQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsQ0FBQztTQUNoQzs7QUFFRCxZQUFJLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztLQUNyQzs7Y0FmQyxHQUFHOztBQUFILE9BQUcsV0FpQkwsT0FBTyxHQUFBLG1CQUFHO0FBQ04sd0JBREosT0FBTyxXQUNJLENBQUM7O0FBRVIsYUFBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRztBQUNwRCxnQkFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNoQyxnQkFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUM7U0FDaEM7O0FBRUQsWUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7O0FBRXhCLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0tBQ3RCOztpQkE1QkMsR0FBRzs7YUE4QkksZUFBRztBQUNSLG1CQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7U0FDdEI7YUFDUSxhQUFFLEtBQUssRUFBRztBQUNmLGlCQUFNLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQ3JELG9CQUFJLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ25DLG9CQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7YUFDbkM7O0FBRUQsZ0JBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsVUFBVSxFQUFFLENBQUM7O0FBRTlCLGlCQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsRUFBRSxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRztBQUMzRCxvQkFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ2pELG9CQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUNqRSxvQkFBSSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDdEMsb0JBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFDO2FBQ2hDOztBQUVELGdCQUFJLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFbEMsZ0JBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1NBQ3ZCOzs7V0FuREMsR0FBRzs7O0FBc0RULE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQzVDLFdBQU8sSUFBSSxHQUFHLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0NBQ2pDLENBQUM7Ozs7Ozs7Ozs7Ozs7UUNoRUsscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7Ozs7Ozs7OztJQVk3QixVQUFVO0FBQ0QsYUFEVCxVQUFVLENBQ0MsRUFBRSxFQUFFLFFBQVEsRUFBRzs4QkFEMUIsVUFBVTs7QUFFUix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLE1BQU0sR0FBRyxRQUFRLElBQUksR0FBRztZQUN4QixJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUUsQ0FBQzs7QUFFbEMsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzNDLFlBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUUsQ0FBQzs7O0FBR3JFLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUUsQ0FBQzs7QUFFdEUsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBRSxDQUFDOzs7QUFHcEUsWUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDOztBQUV2RSxZQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQ2pELFlBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFFLENBQUM7QUFDaEQsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUUsQ0FBQzs7QUFFakQsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDO0FBQ3hDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztLQUM1Qzs7Y0F4QkMsVUFBVTs7QUFBVixjQUFVLFdBMEJaLE9BQU8sR0FBQSxtQkFBRztBQUNOLHdCQURKLE9BQU8sV0FDSSxDQUFDO0FBQ1IsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN0QixZQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzVCLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ25CLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0tBQ3pCOztpQkFoQ0MsVUFBVTs7YUFrQ0EsZUFBRztBQUNYLG1CQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO1NBQzlCO2FBQ1csYUFBRSxLQUFLLEVBQUc7QUFDbEIsZ0JBQUssT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFHO0FBQzdCLG9CQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDO0FBQ3RFLG9CQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDO2FBQzdFO1NBQ0o7OztXQTFDQyxVQUFVOzs7QUE2Q2hCLE9BQU8sQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxRQUFRLEVBQUc7QUFDdEQsV0FBTyxJQUFJLFVBQVUsQ0FBRSxJQUFJLEVBQUUsUUFBUSxDQUFFLENBQUM7Q0FDM0MsQ0FBQzs7Ozs7Ozs7Ozs7UUM1REsscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7O0lBSzdCLEtBQUs7QUFDSSxhQURULEtBQUssQ0FDTSxFQUFFLEVBQUc7OEJBRGhCLEtBQUs7O0FBRUgseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQWdCbEIsWUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ25DLFlBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsR0FBRyxDQUFFLENBQUM7QUFDcEMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDO0FBQ25DLFlBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUMvQixZQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7S0FDekM7O2NBdkJDLEtBQUs7O0FBQUwsU0FBSyxXQXlCUCxPQUFPLEdBQUEsbUJBQUc7QUFDTix3QkFESixPQUFPLFdBQ0ksQ0FBQzs7QUFFUixZQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3JCLFlBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRW5CLFlBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2xCLFlBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDOzs7Ozs7Ozs7S0FTbkI7O1dBekNDLEtBQUs7OztBQTRDWCxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxZQUFXO0FBQ3ZDLFdBQU8sSUFBSSxLQUFLLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDNUIsQ0FBQzs7Ozs7Ozs7Ozs7UUNwREsscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7SUFHN0IsV0FBVzs7Ozs7O0FBS0YsYUFMVCxXQUFXLENBS0EsRUFBRSxFQUFtQjtZQUFqQixVQUFVLGdDQUFHLENBQUM7OzhCQUw3QixXQUFXOztBQU1ULHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFFLENBQUM7QUFDeEUsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3pDLFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLFVBQVUsQ0FBRSxDQUFDOztBQUUxRCxZQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMvQyxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXJELFlBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN4QyxZQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDOUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDO0FBQ3ZDLFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztLQUMzQzs7Y0FwQkMsV0FBVzs7QUFBWCxlQUFXLFdBc0JiLE9BQU8sR0FBQSxtQkFBRztBQUNOLHdCQURKLE9BQU8sV0FDSSxDQUFDO0FBQ1IsWUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNyQixZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztLQUNyQjs7V0ExQkMsV0FBVzs7O0FBNkJqQixPQUFPLENBQUMsU0FBUyxDQUFDLGlCQUFpQixHQUFHLFVBQVUsVUFBVSxFQUFHO0FBQ3pELFdBQU8sSUFBSSxXQUFXLENBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBRSxDQUFDO0NBQzlDLENBQUM7Ozs7Ozs7Ozs7Ozs7UUNuQ0sscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7Ozs7Ozs7OztJQWE3QixLQUFLO0FBQ0ksYUFEVCxLQUFLLENBQ00sRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRzs4QkFEaEQsS0FBSzs7QUFFSCx5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixhQUFLLEdBQUcsT0FBTyxLQUFLLEtBQUssUUFBUSxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDOUMsY0FBTSxHQUFHLE9BQU8sTUFBTSxLQUFLLFFBQVEsR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ2pELGNBQU0sR0FBRyxPQUFPLE1BQU0sS0FBSyxRQUFRLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUNqRCxlQUFPLEdBQUcsT0FBTyxPQUFPLEtBQUssUUFBUSxHQUFHLE9BQU8sR0FBRyxFQUFFLENBQUM7O0FBRXJELFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsS0FBSyxDQUFFLENBQUM7QUFDM0MsWUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQztBQUM3QyxZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO0FBQzdDLFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsT0FBTyxDQUFFLENBQUM7Ozs7O0FBSy9DLFlBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN2RCxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBR2xELFlBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ2pELFlBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDcEQsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBR25ELFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNyQyxZQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNsRCxZQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHbkQsWUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDbkQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN2RCxZQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHdEQsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3pDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzNDLFlBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUd2RCxZQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDL0IsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDeEMsWUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXZDLFlBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztLQUN6Qzs7Y0EvQ0MsS0FBSzs7QUFBTCxTQUFLLFdBaURQLE9BQU8sR0FBQSxtQkFBRztBQUNOLHdCQURKLE9BQU8sV0FDSSxDQUFDOztBQUVSLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDdEIsWUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN2QixZQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3ZCLFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDeEIsWUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUMvQixZQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDaEMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN0QixZQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbEMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFeEIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDcEIsWUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDcEIsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDckIsWUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7QUFDNUIsWUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztBQUM3QixZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztBQUNuQixZQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO0FBQy9CLFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLFlBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO0tBQ25COztpQkF4RUMsS0FBSzs7YUEwRUUsZUFBRztBQUNSLG1CQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1NBQzVCO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQzdCOzs7YUFHUyxlQUFHO0FBQ1QsbUJBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7U0FDN0I7YUFDUyxhQUFFLEtBQUssRUFBRztBQUNoQixnQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQzlCOzs7YUFFUyxlQUFHO0FBQ1QsbUJBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7U0FDN0I7YUFDUyxhQUFFLEtBQUssRUFBRztBQUNoQixnQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQzlCOzs7YUFJVSxlQUFHO0FBQ1YsbUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7U0FDOUI7YUFDVSxhQUFFLEtBQUssRUFBRztBQUNqQixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQy9COzs7V0F2R0MsS0FBSzs7O0FBMkdYLE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVyxHQUFHLFVBQVUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFHO0FBQ3ZFLFdBQU8sSUFBSSxLQUFLLENBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBRSxDQUFDO0NBQzVELENBQUM7Ozs7Ozs7Ozs7Ozs7UUMzSEsscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBb0I3QixRQUFRO0FBQ0MsYUFEVCxRQUFRLENBQ0csRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUc7OEJBRDFELFFBQVE7O0FBRU4seUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsYUFBSyxHQUFHLE9BQU8sS0FBSyxLQUFLLFFBQVEsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQzlDLGNBQU0sR0FBRyxPQUFPLE1BQU0sS0FBSyxRQUFRLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUNqRCxjQUFNLEdBQUcsT0FBTyxNQUFNLEtBQUssUUFBUSxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUM7QUFDakQsZUFBTyxHQUFHLE9BQU8sT0FBTyxLQUFLLFFBQVEsR0FBRyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ3JELGdCQUFRLEdBQUcsT0FBTyxRQUFRLEtBQUssUUFBUSxHQUFHLFFBQVEsR0FBRyxDQUFDLENBQUM7O0FBRXZELFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsS0FBSyxDQUFFLENBQUM7QUFDM0MsWUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQztBQUM3QyxZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO0FBQzdDLFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsT0FBTyxDQUFFLENBQUM7QUFDL0MsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQzs7O0FBSWpELFlBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN2RCxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBR2xELFlBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUN6QyxZQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUMvQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsVUFBVSxDQUFFLENBQUM7QUFDNUMsWUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMxRCxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHdEQsWUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDakQsWUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNwRCxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHbkQsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ3JDLFlBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ2xELFlBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUduRCxZQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDN0MsWUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5RCxZQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHM0QsWUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDbkQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN2RCxZQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHdEQsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxRQUFRLENBQUUsQ0FBQztBQUN6QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsR0FBRyxDQUFFLENBQUM7OztBQUdoQyxZQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLFFBQVEsQ0FBRSxDQUFDO0FBQ2pELFlBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxXQUFXLENBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsaUJBQWlCLENBQUUsQ0FBQzs7O0FBSW5ELFlBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUN4QyxZQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDL0MsWUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM3RCxZQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM5QyxZQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBR3ZELFlBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUN0QyxZQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDN0MsWUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMzRCxZQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzFELFlBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzlDLFlBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFLbkQsWUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLENBQUM7QUFDdkQsWUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDaEQsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBRSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxpQkFBaUIsTUFBRyxDQUFFLENBQUM7QUFDMUQsWUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBRSxDQUFDO0FBQ3pELFlBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxpQkFBaUIsUUFBSyxDQUFFLENBQUM7OztBQUd2RCxZQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztBQUM5QyxZQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDM0MsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBRSxDQUFDO0FBQ3ZDLFlBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxZQUFZLE1BQUcsQ0FBRSxDQUFDO0FBQ2hELFlBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFFLENBQUM7QUFDL0MsWUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsWUFBWSxRQUFLLENBQUUsQ0FBQzs7QUFFekQsWUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0tBQ2xEOztjQS9GQyxRQUFROztBQUFSLFlBQVEsV0FpR1YsT0FBTyxHQUFBLG1CQUFHO0FBQ04sd0JBREosT0FBTyxXQUNJLENBQUM7O0FBRVIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN0QixZQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3ZCLFlBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDdkIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN4QixZQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3pCLFlBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDL0IsWUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUMxQixZQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbkMsWUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2hDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDdEIsWUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUM5QixZQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbEMsWUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNuQixZQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDakMsWUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUMzQixZQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzVCLFlBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDOUIsWUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUMxQixZQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQy9CLFlBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNqQyxZQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzFCLFlBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRTVCLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ25CLFlBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFlBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ3RCLFlBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO0FBQzVCLFlBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQ3ZCLFlBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7QUFDaEMsWUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztBQUM3QixZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztBQUNuQixZQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztBQUMzQixZQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO0FBQy9CLFlBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO0FBQ2hCLFlBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7QUFDOUIsWUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7QUFDeEIsWUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDekIsWUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFDM0IsWUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDdkIsWUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7QUFDNUIsWUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztBQUM5QixZQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztBQUN2QixZQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztLQUM1Qjs7aUJBakpDLFFBQVE7O2FBb0pELGVBQUc7QUFDUixtQkFBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztTQUM1QjthQUNRLGFBQUUsS0FBSyxFQUFHO0FBQ2YsZ0JBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUM3Qjs7O2FBRVMsZUFBRztBQUNULG1CQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1NBQzdCO2FBQ1MsYUFBRSxLQUFLLEVBQUc7QUFDaEIsZ0JBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUM5Qjs7O2FBRVMsZUFBRztBQUNULG1CQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1NBQzdCO2FBQ1MsYUFBRSxLQUFLLEVBQUc7QUFDaEIsZ0JBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUM5Qjs7O2FBRVUsZUFBRztBQUNWLG1CQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1NBQzlCO2FBQ1UsYUFBRSxLQUFLLEVBQUc7QUFDakIsZ0JBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUMvQjs7O2FBRVcsZUFBRztBQUNYLG1CQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO1NBQy9CO2FBQ1csYUFBRSxLQUFLLEVBQUc7QUFDbEIsZ0JBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUM3QixnQkFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ3ZCLGdCQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDbEM7OztXQXZMQyxRQUFROzs7QUEyTGQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEdBQUcsVUFBVSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFHO0FBQ3BGLFdBQU8sSUFBSSxRQUFRLENBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUUsQ0FBQztDQUN6RSxDQUFDOzs7Ozs7Ozs7OztRQ2xOSyxxQkFBcUI7OzJCQUNYLGtCQUFrQjs7OztJQUc3QixJQUFJOzs7Ozs7QUFLSyxhQUxULElBQUksQ0FLTyxFQUFFLEVBQUc7OEJBTGhCLElBQUk7O0FBTUYseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFFLFVBQVUsQ0FBQyxFQUFHO0FBQ2xELG1CQUFPLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQyxDQUFFLENBQUM7U0FDekIsRUFBRSxJQUFJLENBQUUsQ0FBQzs7QUFFVixZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDckMsWUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLENBQUM7O0FBRS9DLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxXQUFXLENBQUUsQ0FBQztBQUM3QyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBRSxDQUFDO0FBQzdDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQzs7QUFFeEMsWUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sTUFBRyxDQUFFLENBQUM7QUFDM0MsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sUUFBSyxDQUFFLENBQUM7QUFDeEMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0tBQzVDOztjQXRCQyxJQUFJOztBQUFKLFFBQUksV0F5Qk4sT0FBTyxHQUFBLG1CQUFHO0FBQ04sd0JBREosT0FBTyxXQUNJLENBQUM7QUFDUixZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3RCLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0tBQ3RCOztXQTdCQyxJQUFJOzs7QUFnQ1YsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsVUFBVSxRQUFRLEVBQUc7QUFDaEQsV0FBTyxJQUFJLElBQUksQ0FBRSxJQUFJLEVBQUUsUUFBUSxDQUFFLENBQUM7Q0FDckMsQ0FBQzs7Ozs7Ozs7Ozs7UUN0Q0sscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7Ozs7Ozs7OztJQVk3QixVQUFVO0FBQ0QsYUFEVCxVQUFVLENBQ0MsRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFHOzhCQUQvQyxVQUFVOztBQUVSLFlBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBRSxHQUFHLENBQUUsQ0FBQztBQUN6QyxZQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBRSxDQUFDO0FBQ2hELFlBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDOzs7QUFHMUIsYUFBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNuQyxvQkFBWSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUdqRCxvQkFBWSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUd0QyxZQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUM7O0FBRWxDLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztLQUMvQjs7QUFsQkMsY0FBVSxXQW9CWixPQUFPLEdBQUEsbUJBQUc7QUFDTixZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3hCLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDdEIsWUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFbkIsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDckIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDaEIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7S0FDdEI7O1dBN0JDLFVBQVU7OztJQWdDVixJQUFJO0FBQ0ssYUFEVCxJQUFJLENBQ08sRUFBRSxFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRzs4QkFEOUMsSUFBSTs7QUFFRix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHbEIsMEJBQWtCLEdBQUcsa0JBQWtCLElBQUksQ0FBQyxDQUFDOztBQUU3QyxnQkFBUSxHQUFHLFFBQVEsSUFBSSxHQUFHLENBQUM7O0FBRTNCLFlBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUUsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxFQUFFLEVBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFM0UsWUFBSSxDQUFDLEtBQUssR0FBRyxDQUFFO0FBQ1gsa0JBQU0sRUFBRSxJQUFJLENBQUMsRUFBRTtTQUNsQixDQUFFLENBQUM7O0FBRUosYUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxFQUFHO0FBQzNDLGdCQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FDWCxJQUFJLFVBQVUsQ0FBRSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBRSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLEVBQUUsUUFBUSxDQUFFLENBQzdFLENBQUM7U0FDTDs7QUFFRCxZQUFJLENBQUMsS0FBSyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0tBQzNFOztjQXRCQyxJQUFJOztBQUFKLFFBQUksV0F3Qk4sT0FBTyxHQUFBLG1CQUFHO0FBQ04sd0JBREosT0FBTyxXQUNJLENBQUM7O0FBRVIsWUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUM7O0FBRXZCLGFBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDOUMsZ0JBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDMUIsZ0JBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDO1NBQzFCOztBQUVELFlBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ2YsWUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7S0FDckI7O1dBdENDLElBQUk7OztBQTBDVixPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxVQUFVLGtCQUFrQixFQUFFLFFBQVEsRUFBRztBQUNwRSxXQUFPLElBQUksSUFBSSxDQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxRQUFRLENBQUUsQ0FBQztDQUN6RCxDQUFDOzs7Ozs7Ozs7Ozs4QkN6RmtCLHFCQUFxQjs7OzsyQkFDeEIsa0JBQWtCOzs7O0lBRzdCLE1BQU07Ozs7OztBQUtHLGFBTFQsTUFBTSxDQUtLLEVBQUUsRUFBRzs4QkFMaEIsTUFBTTs7QUFNSix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDekMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDaEQsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDaEQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0tBQzlDOztjQVpDLE1BQU07O0FBQU4sVUFBTSxXQWNSLE9BQU8sR0FBQSxtQkFBRztBQUNOLHdCQURKLE9BQU8sV0FDSSxDQUFDO0FBQ1IsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN4QixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztLQUN4Qjs7V0FsQkMsTUFBTTs7O0FBcUJaLDRCQUFRLFNBQVMsQ0FBQyxZQUFZLEdBQUcsWUFBVztBQUN4QyxXQUFPLElBQUksTUFBTSxDQUFFLElBQUksQ0FBRSxDQUFDO0NBQzdCLENBQUM7Ozs7Ozs7Ozs7Ozs7UUMzQksscUJBQXFCOzsyQkFDWCxrQkFBa0I7Ozs7Ozs7Ozs7SUFPN0IsUUFBUTtBQUNDLGFBRFQsUUFBUSxDQUNHLEVBQUUsRUFBRSxLQUFLLEVBQUc7OEJBRHZCLFFBQVE7O0FBRU4seUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDOztBQUVyQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBRSxDQUFDOztBQUVoRCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDOUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDO0FBQ3hDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFekMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQztLQUMxQzs7Y0FiQyxRQUFROztBQUFSLFlBQVEsV0FlVixPQUFPLEdBQUEsbUJBQUc7QUFDTix3QkFESixPQUFPLFdBQ0ksQ0FBQztBQUNSLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRXRCLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztBQUMzQixZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztLQUN0Qjs7aUJBckJDLFFBQVE7O2FBdUJELGVBQUc7QUFDUixtQkFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7U0FDcEM7YUFDUSxhQUFFLEtBQUssRUFBRztBQUNmLGdCQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFFLENBQUM7U0FDekU7OztXQTVCQyxRQUFROzs7QUErQmQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEdBQUcsVUFBVSxLQUFLLEVBQUc7QUFDakQsV0FBTyxJQUFJLFFBQVEsQ0FBRSxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUM7Q0FDdEMsQ0FBQzs7Ozs7Ozs7Ozs7OztRQ3pDSyxxQkFBcUI7OzJCQUNYLGtCQUFrQjs7OztJQUU3QixNQUFNO0FBQ0csYUFEVCxNQUFNLENBQ0ssRUFBRSxFQUFFLFFBQVEsRUFBcUI7WUFBbkIsWUFBWSxnQ0FBRyxDQUFDOzs4QkFEekMsTUFBTTs7QUFFSix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHbEIsb0JBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLFlBQVksQ0FBRSxDQUFDOztBQUV4QyxZQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNoQixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxZQUFZLENBQUUsQ0FBQzs7QUFFMUQsYUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRztBQUNqQyxnQkFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzdDLGdCQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO0FBQ2xDLGdCQUFJLENBQUMsS0FBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzdDLGdCQUFJLENBQUMsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBRSxDQUFDO0FBQ2pELGdCQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO0FBQy9DLGdCQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7U0FDakQ7S0FDSjs7Y0FsQkMsTUFBTTs7QUFBTixVQUFNLFdBb0JSLE9BQU8sR0FBQSxtQkFBRztBQUNOLHdCQURKLE9BQU8sV0FDSSxDQUFDOztBQUVSLGFBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUc7QUFDOUMsZ0JBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDMUIsZ0JBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDO1NBQzFCOztBQUVELFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzlCLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztBQUMzQixZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztLQUNyQjs7aUJBL0JDLE1BQU07O2FBaUNHLGVBQUc7QUFDVixtQkFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7U0FDdEM7OzthQUVRLGVBQUc7QUFDUixtQkFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7U0FDcEM7YUFDUSxhQUFFLEtBQUssRUFBRztBQUNmLGdCQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQ3JDOzs7V0ExQ0MsTUFBTTs7O0FBOENaLE9BQU8sQ0FBQyxTQUFTLENBQUMsWUFBWSxHQUFHLFVBQVUsUUFBUSxFQUFFLFlBQVksRUFBRztBQUNoRSxXQUFPLElBQUksTUFBTSxDQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFFLENBQUM7Q0FDckQsQ0FBQzs7Ozs7Ozs7Ozs7OztRQ25ESyx3QkFBd0I7O2tDQUNILHVCQUF1Qjs7OztJQUc3QyxHQUFHOzs7Ozs7QUFLTSxhQUxULEdBQUcsQ0FLUSxFQUFFLEVBQUc7OEJBTGhCLEdBQUc7O0FBTUQsb0NBQU8sRUFBRSxDQUFFLENBQUM7O0FBRVosWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRS9DLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ2pELFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVqRCxhQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7O0FBRTVDLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O2NBbkJDLEdBQUc7O0FBQUgsT0FBRyxXQXFCTCxPQUFPLEdBQUEsbUJBQUc7QUFDTixtQ0FESixPQUFPLFdBQ0ksQ0FBQzs7QUFFUixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLElBQUksQ0FBRSxDQUFDOztBQUVsQyxhQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3pCLGFBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0tBQ3pCOztXQTVCQyxHQUFHOzs7cUJBK0JNLEdBQUc7O0FBRWxCLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFlBQVc7QUFDckMsV0FBTyxJQUFJLEdBQUcsQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUMxQixDQUFDOzs7Ozs7Ozs7Ozs7OztRQ3ZDSyx3QkFBd0I7OzJCQUNkLHFCQUFxQjs7OztJQUdoQyxlQUFlOzs7Ozs7QUFLTixhQUxULGVBQWUsQ0FLSixFQUFFLEVBQUc7OEJBTGhCLGVBQWU7O0FBTWIseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7O0FBRS9CLFlBQUksQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLENBQUM7S0FDMUI7O2NBZEMsZUFBZTs7QUFBZixtQkFBZSxXQWdCakIsT0FBTyxHQUFBLG1CQUFHO0FBQ04sd0JBREosT0FBTyxXQUNJLENBQUM7O0FBRVIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQzVCLGFBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDdEIsYUFBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7S0FDdEI7O1dBdEJDLGVBQWU7OztxQkF5Qk4sZUFBZTs7QUFFOUIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsR0FBRyxZQUFXO0FBQ2pELFdBQU8sSUFBSSxlQUFlLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDdEMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7UUNqQ0ssd0JBQXdCOztrQ0FDSCx1QkFBdUI7Ozs7SUFHN0MsR0FBRzs7Ozs7O0FBS00sYUFMVCxHQUFHLENBS1EsRUFBRSxFQUFHOzhCQUxoQixHQUFHOztBQU1ELG9DQUFPLEVBQUUsQ0FBRSxDQUFDOztBQUVaLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUM1QixlQUFPLENBQUMsR0FBRyxDQUFFLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQzs7QUFFM0IsYUFBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxHQUFHLENBQUUsQ0FBQztBQUNyQyxhQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzdDLGFBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7QUFFcEMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBRSxDQUFDO0FBQzNDLGFBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxHQUFHLENBQUUsQ0FBQztBQUNwQyxhQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsS0FBSyxDQUFFLENBQUE7O0FBRWhDLGFBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFekMsWUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBQztLQUMxQjs7Y0F0QkMsR0FBRzs7QUFBSCxPQUFHLFdBd0JMLE9BQU8sR0FBQSxtQkFBRztBQUNOLG1DQURKLE9BQU8sV0FDSSxDQUFDOzs7O0FBSVIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3pCLGFBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDcEIsYUFBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN0QixhQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztBQUN0QixhQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztBQUNqQixhQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztLQUN0Qjs7V0FyQ0MsR0FBRzs7O3FCQXdDTSxHQUFHOztBQUVsQixPQUFPLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxZQUFXO0FBQ3JDLFdBQU8sSUFBSSxHQUFHLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDMUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7UUNoREssd0JBQXdCOztrQ0FDSCx1QkFBdUI7Ozs7SUFHN0MsRUFBRTs7Ozs7O0FBS08sYUFMVCxFQUFFLENBS1MsRUFBRSxFQUFHOzhCQUxoQixFQUFFOztBQU1BLG9DQUFPLEVBQUUsQ0FBRSxDQUFDOztBQUVaLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFNUIsYUFBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ2hDLGFBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUUsQ0FBQyxDQUFFLENBQUM7QUFDM0MsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRS9DLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxHQUFHLENBQUUsQ0FBQztBQUN0QyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUNyRCxhQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsT0FBTyxDQUFFLENBQUM7QUFDbkMsYUFBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUUzQyxZQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxDQUFDO0tBQzFCOztjQXBCQyxFQUFFOztBQUFGLE1BQUUsV0FzQkosT0FBTyxHQUFBLG1CQUFHO0FBQ04sbUNBREosT0FBTyxXQUNJLENBQUM7O0FBRVIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUU1QixhQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3hCLGFBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDOztBQUVyQixhQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3BCLGFBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO0tBQ3BCOztXQWhDQyxFQUFFOzs7cUJBbUNPLEVBQUU7O0FBRWpCLE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFHLFlBQVc7QUFDcEMsV0FBTyxJQUFJLEVBQUUsQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUN6QixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O1FDM0NLLHdCQUF3Qjs7MkJBQ2QscUJBQXFCOzs7Ozs7SUFHaEMsT0FBTztBQUNFLGFBRFQsT0FBTyxDQUNJLEVBQUUsRUFBRSxLQUFLLEVBQUc7OEJBRHZCLE9BQU87O0FBRUwseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7OztBQUlsQixZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBRSxFQUMzQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7O0FBRTNDLFlBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQzs7Ozs7O0FBTS9CLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUUsQ0FBQzs7QUFFckUsWUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLENBQUM7QUFDcEQsWUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQ3ZDLFlBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFM0MsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDO0FBQ3hDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFekMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztLQUV0Qzs7Y0ExQkMsT0FBTzs7QUFBUCxXQUFPLFdBNEJULE9BQU8sR0FBQSxtQkFBRztBQUNOLHdCQURKLE9BQU8sV0FDSSxDQUFDOztBQUVSLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDdEIsWUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFdkIsWUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUM1QixZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztBQUN0QixZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztBQUNuQixZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztLQUN2Qjs7aUJBdENDLE9BQU87O2FBd0NBLGVBQUc7QUFDUixtQkFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztTQUM3QjthQUNRLGFBQUUsS0FBSyxFQUFHO0FBQ2YsZ0JBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDO1NBQ2xFOzs7V0E3Q0MsT0FBTzs7O0FBZ0RiLE9BQU8sQ0FBQyxTQUFTLENBQUMsYUFBYSxHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQ2hELFdBQU8sSUFBSSxPQUFPLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0NBQ3JDLENBQUM7O3FCQUVhLE9BQU87Ozs7Ozs7O1FDeERmLHdCQUF3Qjs7MkJBQ2QscUJBQXFCOzs7OzBCQUNsQixlQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQ25DLE9BQU8sQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEdBQUcsWUFBVzs7O0FBRzdDLFdBQU8sNEJBQWEsSUFBSSxFQUFFLENBQUMsQ0FBRSxDQUFDO0NBQ2pDLENBQUM7Ozs7Ozs7Ozs7Ozs7UUN4Q0ssd0JBQXdCOzsyQkFDZCxxQkFBcUI7Ozs7SUFFaEMsV0FBVztBQUNGLGFBRFQsV0FBVyxDQUNBLEVBQUUsRUFBRSxLQUFLLEVBQUc7OEJBRHZCLFdBQVc7O0FBRVQseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsS0FBSyxDQUFFLENBQUM7QUFDbkQsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDOztBQUUzQyxZQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7O0FBRS9CLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7QUFDckMsWUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBRSxDQUFDOztBQUcvRSxZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQzlDLFlBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztBQUMzQyxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7S0FDakQ7O2NBaEJDLFdBQVc7O0FBQVgsZUFBVyxXQW1CYixPQUFPLEdBQUEsbUJBQUc7QUFDTix3QkFESixPQUFPLFdBQ0ksQ0FBQzs7QUFFUixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUM5QixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7O0FBRTNCLFlBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDNUIsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7S0FDekI7O2lCQTNCQyxXQUFXOzthQTZCSixlQUFHO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1NBQ3BDO2FBQ1EsYUFBRSxLQUFLLEVBQUc7QUFDZixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFDO1NBQ3pFOzs7V0FsQ0MsV0FBVzs7O0FBcUNqQixPQUFPLENBQUMsU0FBUyxDQUFDLGlCQUFpQixHQUFHLFVBQVUsS0FBSyxFQUFHO0FBQ3BELFdBQU8sSUFBSSxXQUFXLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0NBQ3pDLENBQUM7Ozs7Ozs7Ozs7O1FDMUNLLHdCQUF3Qjs7MkJBQ2QscUJBQXFCOzs7O0lBRWhDLGVBQWU7QUFDTixhQURULGVBQWUsQ0FDSixFQUFFLEVBQUc7OEJBRGhCLGVBQWU7O0FBRWIseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNsQixZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDO0FBQ3JDLFlBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUUsQ0FBQztBQUMvRSxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7S0FDakQ7O2NBTkMsZUFBZTs7V0FBZixlQUFlOzs7QUFTckIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsR0FBRyxZQUFXO0FBQ2pELFdBQU8sSUFBSSxlQUFlLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDdEMsQ0FBQzs7Ozs7Ozs7Ozs7UUNkSyx3QkFBd0I7OzJCQUNkLHFCQUFxQjs7OztJQUVoQyxNQUFNO0FBQ0csYUFEVCxNQUFNLENBQ0ssRUFBRSxFQUFHOzhCQURoQixNQUFNOztBQUVKLHlCQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRWxCLFlBQUksVUFBTyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFM0MsWUFBSSxNQUFHLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0FBQ3RDLFlBQUksTUFBRyxDQUFDLE9BQU8sQ0FBRSxJQUFJLFVBQU8sQ0FBQyxPQUFPLENBQUUsQ0FBQztBQUN2QyxZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksVUFBTyxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQztBQUNwQyxZQUFJLFFBQUssR0FBRyxJQUFJLFVBQU8sQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXBDLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxVQUFPLENBQUMsTUFBTSxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxVQUFPLENBQUMsT0FBTyxDQUFDO0tBQ3RDOztjQWJDLE1BQU07O0FBQU4sVUFBTSxXQWVSLE9BQU8sR0FBQSxtQkFBRztBQUNOLHdCQURKLE9BQU8sV0FDSSxDQUFDOztBQUVSLFlBQUksVUFBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3RCLFlBQUksTUFBRyxDQUFDLE9BQU8sRUFBRSxDQUFDOztBQUVsQixZQUFJLE1BQUcsR0FBRyxJQUFJLENBQUM7QUFDZixZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUNqQixZQUFJLFFBQUssR0FBRyxJQUFJLENBQUM7QUFDakIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDcEIsWUFBSSxVQUFPLEdBQUcsSUFBSSxDQUFDO0tBRXRCOztXQTVCQyxNQUFNOzs7QUErQlosT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsWUFBVztBQUN4QyxXQUFPLElBQUksTUFBTSxDQUFFLElBQUksQ0FBRSxDQUFDO0NBQzdCLENBQUM7Ozs7Ozs7Ozs7Ozs7UUNwQ0ssd0JBQXdCOzsyQkFDZCxxQkFBcUI7Ozs7SUFFaEMsUUFBUTtBQUNDLGFBRFQsUUFBUSxDQUNHLEVBQUUsRUFBRSxLQUFLLEVBQUc7OEJBRHZCLFFBQVE7O0FBRU4seUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsS0FBSyxDQUFFLENBQUM7O0FBRW5ELFlBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7O0FBRXBDLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsY0FBYyxDQUFFLENBQUM7O0FBRW5ELFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUN0QyxZQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFFLENBQUM7O0FBRS9FLFlBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztBQUNoRCxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7S0FDakQ7O2NBaEJDLFFBQVE7O0FBQVIsWUFBUSxXQWtCVixPQUFPLEdBQUEsbUJBQUc7QUFDTix3QkFESixPQUFPLFdBQ0ksQ0FBQztBQUNSLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzlCLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztLQUM5Qjs7aUJBdEJDLFFBQVE7O2FBd0JELGVBQUc7QUFDUixtQkFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7U0FDcEM7YUFDUSxhQUFFLEtBQUssRUFBRztBQUNmLGdCQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFFLENBQUM7U0FDekU7OztXQTdCQyxRQUFROzs7QUFnQ2QsT0FBTyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEdBQUcsVUFBVSxLQUFLLEVBQUc7QUFDakQsV0FBTyxJQUFJLFFBQVEsQ0FBRSxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUM7Q0FDdEMsQ0FBQzs7Ozs7Ozs7Ozs7UUNyQ0ssd0JBQXdCOzsyQkFDZCxxQkFBcUI7Ozs7SUFFaEMsWUFBWTtBQUNILGFBRFQsWUFBWSxDQUNELEVBQUUsRUFBRzs4QkFEaEIsWUFBWTs7QUFFVix5QkFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVsQixZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDdEMsWUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBRSxDQUFDOztBQUUvRSxZQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7S0FDakQ7O2NBUkMsWUFBWTs7V0FBWixZQUFZOzs7QUFXbEIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsR0FBRyxZQUFXO0FBQzlDLFdBQU8sSUFBSSxZQUFZLENBQUUsSUFBSSxDQUFFLENBQUM7Q0FDbkMsQ0FBQzs7Ozs7Ozs7Ozs7UUNoQkssd0JBQXdCOzsyQkFDZCxxQkFBcUI7Ozs7Ozs7O0lBS2hDLEdBQUc7Ozs7OztBQUtNLGFBTFQsR0FBRyxDQUtRLEVBQUUsRUFBRSxLQUFLLEVBQUc7OEJBTHZCLEdBQUc7O0FBTUQseUJBQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUUsQ0FBQzs7QUFFaEQsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDOztBQUVyQyxZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFFLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDbEQsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBRSxVQUFVLENBQUUsQ0FBQztBQUNuRCxZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFFLENBQUMsVUFBVSxDQUFFLENBQUM7QUFDcEQsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBRSxTQUFTLENBQUUsQ0FBQztBQUNsRCxZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFFLENBQUMsUUFBUSxDQUFFLENBQUM7QUFDbEQsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBRSxDQUFDLENBQUUsQ0FBQzs7QUFFMUMsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7QUFFMUMsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ2hDLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNoQyxZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDaEMsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ2hDLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQzs7QUFFaEMsWUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDOztBQUd4QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUN2QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBR3ZDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUd2QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1QyxZQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzFDLFlBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHdkMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDNUMsWUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUcxQyxZQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBR3ZDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHMUMsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUd2QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1QyxZQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzFDLFlBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FB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QUFFLENBQUM7O0FBRWhDLFlBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQzs7QUFHeEMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDdkMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUd2QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLFlBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHdkMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDNUMsWUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUcxQyxZQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBR3ZDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHMUMsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUd2QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1QyxZQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzFDLFlBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHdkMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDNUMsWUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUcxQyxZQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENB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LENBQUM7S0FDN0I7O0FBekdDLG1CQUFlLFdBMkdqQixJQUFJLEdBQUEsY0FBRSxJQUFJLEVBQUc7QUFDVCxZQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLElBQUksQ0FBRSxDQUFDLFVBQVUsQ0FBQzs7QUFFbEQsWUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQztBQUN4QyxrQkFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0tBQzdCOztBQWhIQyxtQkFBZSxXQWtIakIsT0FBTyxHQUFBLG1CQUFHO0FBQ04sd0JBREosT0FBTyxXQUNJLENBQUM7S0FDWDs7V0FwSEMsZUFBZTs7O0FBd0hyQixlQUFlLENBQUMsS0FBSyxHQUFHO0FBQ3BCLFNBQUssRUFBRSxDQUFDO0FBQ1Isa0JBQWMsRUFBRSxDQUFDO0FBQ2pCLFFBQUksRUFBRSxDQUFDO0NBQ1YsQ0FBQzs7QUFHRixPQUFPLENBQUMsU0FBUyxDQUFDLHFCQUFxQixHQUFHLFlBQVc7QUFDakQsV0FBTyxJQUFJLGVBQWUsQ0FBRSxJQUFJLENBQUUsQ0FBQztDQUN0QyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBDT05GSUcgZnJvbSAnLi9jb25maWcuZXM2JztcbmltcG9ydCAnLi9vdmVycmlkZXMuZXM2JztcbmltcG9ydCBzaWduYWxDdXJ2ZXMgZnJvbSAnLi9zaWduYWxDdXJ2ZXMuZXM2JztcbmltcG9ydCBjb252ZXJzaW9ucyBmcm9tICcuLi9taXhpbnMvY29udmVyc2lvbnMuZXM2JztcbmltcG9ydCBtYXRoIGZyb20gJy4uL21peGlucy9tYXRoLmVzNic7XG5cbmNsYXNzIEF1ZGlvSU8ge1xuXG4gICAgc3RhdGljIG1peGluKCB0YXJnZXQsIHNvdXJjZSApIHtcbiAgICAgICAgZm9yICggbGV0IGkgaW4gc291cmNlICkge1xuICAgICAgICAgICAgaWYgKCBzb3VyY2UuaGFzT3duUHJvcGVydHkoIGkgKSApIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRbIGkgXSA9IHNvdXJjZVsgaSBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIG1peGluU2luZ2xlKCB0YXJnZXQsIHNvdXJjZSwgbmFtZSApIHtcbiAgICAgICAgdGFyZ2V0WyBuYW1lIF0gPSBzb3VyY2U7XG4gICAgfVxuXG5cbiAgICBjb25zdHJ1Y3RvciggY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKSApIHtcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7XG5cbiAgICAgICAgdGhpcy5tYXN0ZXIgPSB0aGlzLl9jb250ZXh0LmRlc3RpbmF0aW9uO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhbiBhbHdheXMtb24gJ2RyaXZlcicgbm9kZSB0aGF0IGNvbnN0YW50bHkgb3V0cHV0cyBhIHZhbHVlXG4gICAgICAgIC8vIG9mIDEuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEl0J3MgdXNlZCBieSBhIGZhaXIgZmV3IG5vZGVzLCBzbyBtYWtlcyBzZW5zZSB0byB1c2UgdGhlIHNhbWVcbiAgICAgICAgLy8gZHJpdmVyLCByYXRoZXIgdGhhbiBzcGFtbWluZyBhIGJ1bmNoIG9mIFdhdmVTaGFwZXJOb2RlcyBhbGwgYWJvdXRcbiAgICAgICAgLy8gdGhlIHBsYWNlLiBJdCBjYW4ndCBiZSBkZWxldGVkLCBzbyBubyB3b3JyaWVzIGFib3V0IGJyZWFraW5nXG4gICAgICAgIC8vIGZ1bmN0aW9uYWxpdHkgb2Ygbm9kZXMgdGhhdCBkbyB1c2UgaXQgc2hvdWxkIGl0IGF0dGVtcHQgdG8gYmVcbiAgICAgICAgLy8gb3ZlcndyaXR0ZW4uXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdGhpcywgJ2NvbnN0YW50RHJpdmVyJywge1xuICAgICAgICAgICAgd3JpdGVhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGdldDogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBsZXQgY29uc3RhbnREcml2ZXI7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggIWNvbnN0YW50RHJpdmVyIHx8IGNvbnN0YW50RHJpdmVyLmNvbnRleHQgIT09IHRoaXMuY29udGV4dCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0YW50RHJpdmVyID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gY29udGV4dC5jcmVhdGVCdWZmZXIoIDEsIDQwOTYsIGNvbnRleHQuc2FtcGxlUmF0ZSApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlckRhdGEgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoIDAgKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJTb3VyY2UgPSBjb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBidWZmZXJEYXRhLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlckRhdGFbIGkgXSA9IDEuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yKCBsZXQgYnVmZmVyVmFsdWUgb2YgYnVmZmVyRGF0YSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBidWZmZXJWYWx1ZSA9IDEuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyU291cmNlLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlclNvdXJjZS5sb29wID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlclNvdXJjZS5zdGFydCggMCApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdGFudERyaXZlciA9IGJ1ZmZlclNvdXJjZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb25zdGFudERyaXZlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KCkgKVxuICAgICAgICB9ICk7XG4gICAgfVxuXG5cblxuICAgIGdldCBjb250ZXh0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dDtcbiAgICB9XG5cbiAgICBzZXQgY29udGV4dCggY29udGV4dCApIHtcbiAgICAgICAgaWYgKCAhKCBjb250ZXh0IGluc3RhbmNlb2YgQXVkaW9Db250ZXh0ICkgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIFwiSW52YWxpZCBhdWRpbyBjb250ZXh0IGdpdmVuOlwiICsgY29udGV4dCApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMubWFzdGVyID0gY29udGV4dC5kZXN0aW5hdGlvbjtcbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIEF1ZGlvSU8ucHJvdG90eXBlLCBzaWduYWxDdXJ2ZXMsICdjdXJ2ZXMnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBBdWRpb0lPLnByb3RvdHlwZSwgY29udmVyc2lvbnMsICdjb252ZXJ0JyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggQXVkaW9JTy5wcm90b3R5cGUsIG1hdGgsICdtYXRoJyApO1xuXG5cblxud2luZG93LkF1ZGlvSU8gPSBBdWRpb0lPO1xuZXhwb3J0IGRlZmF1bHQgQXVkaW9JTzsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcblxudmFyIGdyYXBocyA9IG5ldyBXZWFrTWFwKCk7XG5cbmNsYXNzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtSW5wdXRzID0gMCwgbnVtT3V0cHV0cyA9IDAgKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gW107XG4gICAgICAgIHRoaXMub3V0cHV0cyA9IFtdO1xuXG4gICAgICAgIC8vIFRoaXMgb2JqZWN0IHdpbGwgaG9sZCBhbnkgdmFsdWVzIHRoYXQgY2FuIGJlXG4gICAgICAgIC8vIGNvbnRyb2xsZWQgd2l0aCBhdWRpbyBzaWduYWxzLlxuICAgICAgICB0aGlzLmNvbnRyb2xzID0ge307XG5cbiAgICAgICAgLy8gQm90aCB0aGVzZSBvYmplY3RzIHdpbGwganVzdCBob2xkIHJlZmVyZW5jZXNcbiAgICAgICAgLy8gdG8gZWl0aGVyIGlucHV0IG9yIG91dHB1dCBub2Rlcy4gSGFuZHkgd2hlblxuICAgICAgICAvLyB3YW50aW5nIHRvIGNvbm5lY3Qgc3BlY2lmaWMgaW5zL291dHMgd2l0aG91dFxuICAgICAgICAvLyBoYXZpbmcgdG8gdXNlIHRoZSBgLmNvbm5lY3QoIC4uLiwgMCwgMSApYCBzeW50YXguXG4gICAgICAgIHRoaXMubmFtZWRJbnB1dHMgPSB7fTtcbiAgICAgICAgdGhpcy5uYW1lZE91dHB1dHMgPSB7fTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1JbnB1dHM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuYWRkSW5wdXRDaGFubmVsKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IG51bU91dHB1dHM7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuYWRkT3V0cHV0Q2hhbm5lbCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0R3JhcGgoIGdyYXBoICkge1xuICAgICAgICBncmFwaHMuc2V0KCB0aGlzLCBncmFwaCApO1xuICAgIH1cblxuICAgIGdldEdyYXBoKCkge1xuICAgICAgICByZXR1cm4gZ3JhcGhzLmdldCggdGhpcyApIHx8IHt9O1xuICAgIH1cblxuICAgIGFkZElucHV0Q2hhbm5lbCgpIHtcbiAgICAgICAgdGhpcy5pbnB1dHMucHVzaCggdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKSApO1xuICAgIH1cblxuICAgIGFkZE91dHB1dENoYW5uZWwoKSB7XG4gICAgICAgIHRoaXMub3V0cHV0cy5wdXNoKCB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5fY2xlYW5VcEluT3V0cygpO1xuICAgICAgICB0aGlzLl9jbGVhbklPKCk7XG4gICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgIH1cblxuXG4gICAgZ2V0IG51bWJlck9mSW5wdXRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHMubGVuZ3RoO1xuICAgIH1cbiAgICBnZXQgbnVtYmVyT2ZPdXRwdXRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzLmxlbmd0aDtcbiAgICB9XG5cbiAgICBnZXQgaW5wdXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5wdXRzLmxlbmd0aCA/IHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA6IG51bGw7XG4gICAgfVxuICAgIHNldCBpbnB1dFZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5pbnB1dHMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgaSBdLmdhaW4udmFsdWUgPSB0aGlzLmludmVydElucHV0UGhhc2UgPyAtdmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBvdXRwdXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3V0cHV0cy5sZW5ndGggPyB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlIDogbnVsbDtcbiAgICB9XG4gICAgc2V0IG91dHB1dFZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5vdXRwdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IHRoaXMuaW52ZXJ0T3V0cHV0UGhhc2UgPyAtdmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBpbnZlcnRJbnB1dFBoYXNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHMubGVuZ3RoID9cbiAgICAgICAgICAgICggdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlIDwgMCApIDpcbiAgICAgICAgICAgIG51bGw7XG4gICAgfVxuICAgIHNldCBpbnZlcnRJbnB1dFBoYXNlKCBpbnZlcnRlZCApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBpbnB1dCwgdjsgaSA8IHRoaXMuaW5wdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgaW5wdXQgPSB0aGlzLmlucHV0c1sgaSBdLmdhaW47XG4gICAgICAgICAgICB2ID0gaW5wdXQudmFsdWU7XG4gICAgICAgICAgICBpbnB1dC52YWx1ZSA9IHYgPCAwID8gKCBpbnZlcnRlZCA/IHYgOiAtdiApIDogKCBpbnZlcnRlZCA/IC12IDogdiApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGludmVydE91dHB1dFBoYXNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzLmxlbmd0aCA/XG4gICAgICAgICAgICAoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPCAwICkgOlxuICAgICAgICAgICAgbnVsbDtcbiAgICB9XG5cbiAgICAvLyBUT0RPOlxuICAgIC8vICAtIHNldFZhbHVlQXRUaW1lP1xuICAgIHNldCBpbnZlcnRPdXRwdXRQaGFzZSggaW52ZXJ0ZWQgKSB7XG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgdjsgaSA8IHRoaXMub3V0cHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHYgPSB0aGlzLm91dHB1dHNbIGkgXS5nYWluLnZhbHVlO1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IHYgPCAwID8gKCBpbnZlcnRlZCA/IHYgOiAtdiApIDogKCBpbnZlcnRlZCA/IC12IDogdiApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBOb2RlLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggTm9kZS5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuVXBJbk91dHMsICdfY2xlYW5VcEluT3V0cycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIE5vZGUucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhbklPLCAnX2NsZWFuSU8nICk7XG5BdWRpb0lPLm1peGluKCBOb2RlLnByb3RvdHlwZSwgY29ubmVjdGlvbnMgKTtcblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOb2RlID0gZnVuY3Rpb24oIG51bUlucHV0cywgbnVtT3V0cHV0cyApIHtcbiAgICByZXR1cm4gbmV3IE5vZGUoIHRoaXMsIG51bUlucHV0cywgbnVtT3V0cHV0cyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTm9kZTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcblxuXG5jbGFzcyBQYXJhbSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSwgZGVmYXVsdFZhbHVlICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLmlucHV0cyA9IHRoaXMub3V0cHV0cyA9IFsgdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKSBdO1xuICAgICAgICB0aGlzLl9jb250cm9sID0gdGhpcy5pbnB1dHNbIDAgXTtcblxuICAgICAgICAvLyBIbW0uLi4gSGFkIHRvIHB1dCB0aGlzIGhlcmUgc28gTm90ZSB3aWxsIGJlIGFibGVcbiAgICAgICAgLy8gdG8gcmVhZCB0aGUgdmFsdWUuLi5cbiAgICAgICAgLy8gVE9ETzpcbiAgICAgICAgLy8gIC0gU2hvdWxkIEkgY3JlYXRlIGEgYC5fdmFsdWVgIHByb3BlcnR5IHRoYXQgd2lsbFxuICAgICAgICAvLyAgICBzdG9yZSB0aGUgdmFsdWVzIHRoYXQgdGhlIFBhcmFtIHNob3VsZCBiZSByZWZsZWN0aW5nXG4gICAgICAgIC8vICAgIChmb3JnZXR0aW5nLCBvZiBjb3Vyc2UsIHRoYXQgYWxsIHRoZSAqVmFsdWVBdFRpbWUgW2V0Yy5dXG4gICAgICAgIC8vICAgIGZ1bmN0aW9ucyBhcmUgZnVuY3Rpb25zIG9mIHRpbWU7IGAuX3ZhbHVlYCBwcm9wIHdvdWxkIGJlXG4gICAgICAgIC8vICAgIHNldCBpbW1lZGlhdGVseSwgd2hpbHN0IHRoZSByZWFsIHZhbHVlIHdvdWxkIGJlIHJhbXBpbmcpXG4gICAgICAgIC8vXG4gICAgICAgIC8vICAtIE9yLCBzaG91bGQgSSBjcmVhdGUgYSBgLl92YWx1ZWAgcHJvcGVydHkgdGhhdCB3aWxsXG4gICAgICAgIC8vICAgIHRydWVseSByZWZsZWN0IHRoZSBpbnRlcm5hbCB2YWx1ZSBvZiB0aGUgR2Fpbk5vZGU/IFdpbGxcbiAgICAgICAgLy8gICAgcmVxdWlyZSBNQUZGUy4uLlxuICAgICAgICB0aGlzLl92YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgPyB2YWx1ZSA6IDEuMDtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLnZhbHVlID0gdGhpcy5fdmFsdWU7XG5cbiAgICAgICAgdGhpcy5zZXRWYWx1ZUF0VGltZSggdGhpcy5fdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgICAgICB0aGlzLmRlZmF1bHRWYWx1ZSA9IHR5cGVvZiBkZWZhdWx0VmFsdWUgPT09ICdudW1iZXInID8gZGVmYXVsdFZhbHVlIDogdGhpcy5fY29udHJvbC5nYWluLmRlZmF1bHRWYWx1ZTtcblxuXG4gICAgICAgIC8vIFRPRE86XG4gICAgICAgIC8vICAtIFNob3VsZCB0aGUgZHJpdmVyIGFsd2F5cyBiZSBjb25uZWN0ZWQ/XG4gICAgICAgIC8vICAtIE5vdCBzdXJlIHdoZXRoZXIgUGFyYW0gc2hvdWxkIG91dHB1dCAwIGlmIHZhbHVlICE9PSBOdW1iZXIuXG4gICAgICAgIGlmICggdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMuaW8uY29uc3RhbnREcml2ZXIuY29ubmVjdCggdGhpcy5fY29udHJvbCApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuZGVmYXVsdFZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLl9jbGVhblVwSW5PdXRzKCk7XG4gICAgICAgIHRoaXMuX2NsZWFuSU8oKTtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLl9jb250cm9sID0gbnVsbDtcbiAgICAgICAgdGhpcy5kZWZhdWx0VmFsdWUgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgIH1cblxuICAgIHNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgc3RhcnRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4uc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoIHZhbHVlLCBlbmRUaW1lICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSggdmFsdWUsIGVuZFRpbWUgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0VGFyZ2V0QXRUaW1lKCB2YWx1ZSwgc3RhcnRUaW1lLCB0aW1lQ29uc3RhbnQgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5zZXRUYXJnZXRBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUsIHRpbWVDb25zdGFudCApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRWYWx1ZUN1cnZlQXRUaW1lKCB2YWx1ZXMsIHN0YXJ0VGltZSwgZHVyYXRpb24gKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5zZXRWYWx1ZUN1cnZlQXRUaW1lKCB2YWx1ZXMsIHN0YXJ0VGltZSwgZHVyYXRpb24gKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCBzdGFydFRpbWUgKSB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHN0YXJ0VGltZSApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIC8vIHJldHVybiB0aGlzLl9jb250cm9sLmdhaW4udmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cblxuICAgIGdldCBjb250cm9sKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29udHJvbC5nYWluO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBQYXJhbS5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFBhcmFtLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5VcEluT3V0cywgJ19jbGVhblVwSW5PdXRzJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggUGFyYW0ucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhbklPLCAnX2NsZWFuSU8nICk7XG5BdWRpb0lPLm1peGluKCBQYXJhbS5wcm90b3R5cGUsIGNvbm5lY3Rpb25zICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBhcmFtID0gZnVuY3Rpb24oIHZhbHVlLCBkZWZhdWx0VmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBQYXJhbSggdGhpcywgdmFsdWUsIGRlZmF1bHRWYWx1ZSApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgUGFyYW07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4vQXVkaW9JTy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBjb25uZWN0aW9ucyBmcm9tIFwiLi4vbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNlwiO1xuaW1wb3J0IGNsZWFuZXJzIGZyb20gXCIuLi9taXhpbnMvY2xlYW5lcnMuZXM2XCI7XG5cbmNsYXNzIFdhdmVTaGFwZXIge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgY3VydmVPckl0ZXJhdG9yLCBzaXplICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLnNoYXBlciA9IHRoaXMuY29udGV4dC5jcmVhdGVXYXZlU2hhcGVyKCk7XG5cbiAgICAgICAgLy8gSWYgYSBGbG9hdDMyQXJyYXkgaXMgcHJvdmlkZWQsIHVzZSBpdFxuICAgICAgICAvLyBhcyB0aGUgY3VydmUgdmFsdWUuXG4gICAgICAgIGlmICggY3VydmVPckl0ZXJhdG9yIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ICkge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSBjdXJ2ZU9ySXRlcmF0b3I7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhIGZ1bmN0aW9uIGlzIHByb3ZpZGVkLCBjcmVhdGUgYSBjdXJ2ZVxuICAgICAgICAvLyB1c2luZyB0aGUgZnVuY3Rpb24gYXMgYW4gaXRlcmF0b3IuXG4gICAgICAgIGVsc2UgaWYgKCB0eXBlb2YgY3VydmVPckl0ZXJhdG9yID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgc2l6ZSA9IHR5cGVvZiBzaXplID09PSAnbnVtYmVyJyAmJiBzaXplID49IDIgPyBzaXplIDogQ09ORklHLmN1cnZlUmVzb2x1dGlvbjtcblxuICAgICAgICAgICAgdmFyIGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSggc2l6ZSApLFxuICAgICAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgICAgIHggPSAwO1xuXG4gICAgICAgICAgICBmb3IgKCBpOyBpIDwgc2l6ZTsgKytpICkge1xuICAgICAgICAgICAgICAgIHggPSAoIGkgLyBzaXplICkgKiAyIC0gMTtcbiAgICAgICAgICAgICAgICBhcnJheVsgaSBdID0gY3VydmVPckl0ZXJhdG9yKCB4LCBpLCBzaXplICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2hhcGVyLmN1cnZlID0gYXJyYXk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPdGhlcndpc2UsIGRlZmF1bHQgdG8gYSBMaW5lYXIgY3VydmUuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSB0aGlzLmlvLmN1cnZlcy5MaW5lYXI7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlucHV0cyA9IHRoaXMub3V0cHV0cyA9IFsgdGhpcy5zaGFwZXIgXTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLl9jbGVhblVwSW5PdXRzKCk7XG4gICAgICAgIHRoaXMuX2NsZWFuSU8oKTtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuc2hhcGVyID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgY3VydmUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNoYXBlci5jdXJ2ZTtcbiAgICB9XG4gICAgc2V0IGN1cnZlKCBjdXJ2ZSApIHtcbiAgICAgICAgaWYoIGN1cnZlIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ICkge1xuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSBjdXJ2ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggV2F2ZVNoYXBlci5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFdhdmVTaGFwZXIucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhblVwSW5PdXRzLCAnX2NsZWFuVXBJbk91dHMnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBXYXZlU2hhcGVyLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5JTywgJ19jbGVhbklPJyApO1xuQXVkaW9JTy5taXhpbiggV2F2ZVNoYXBlci5wcm90b3R5cGUsIGNvbm5lY3Rpb25zICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVdhdmVTaGFwZXIgPSBmdW5jdGlvbiggY3VydmUsIHNpemUgKSB7XG4gICAgcmV0dXJuIG5ldyBXYXZlU2hhcGVyKCB0aGlzLCBjdXJ2ZSwgc2l6ZSApO1xufTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgY3VydmVSZXNvbHV0aW9uOiA0MDk2LCAvLyBNdXN0IGJlIGFuIGV2ZW4gbnVtYmVyLlxuXG4gICAgLy8gVXNlZCB3aGVuIGNvbnZlcnRpbmcgbm90ZSBzdHJpbmdzIChlZy4gJ0EjNCcpIHRvIE1JREkgdmFsdWVzLlxuICAgIC8vIEl0J3MgdGhlIG9jdGF2ZSBudW1iZXIgb2YgdGhlIGxvd2VzdCBDIG5vdGUgKE1JREkgbm90ZSAwKS5cbiAgICAvLyBDaGFuZ2UgdGhpcyBpZiB5b3UncmUgdXNlZCB0byBhIERBVyB0aGF0IGRvZXNuJ3QgdXNlIC0yIGFzIHRoZVxuICAgIC8vIGxvd2VzdCBvY3RhdmUuXG4gICAgbG93ZXN0T2N0YXZlOiAtMixcblxuICAgIC8vIExvd2VzdCBhbGxvd2VkIG51bWJlci4gVXNlZCBieSBzb21lIE1hdGhcbiAgICAvLyBmdW5jdGlvbnMsIGVzcGVjaWFsbHkgd2hlbiBjb252ZXJ0aW5nIGJldHdlZW5cbiAgICAvLyBudW1iZXIgZm9ybWF0cyAoaWUuIGh6IC0+IE1JREksIG5vdGUgLT4gTUlESSwgZXRjLiApXG4gICAgLy9cbiAgICAvLyBBbHNvIHVzZWQgaW4gY2FsbHMgdG8gQXVkaW9QYXJhbS5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lXG4gICAgLy8gc28gdGhlcmUncyBubyByYW1waW5nIHRvIDAgKHdoaWNoIHRocm93cyBhbiBlcnJvcikuXG4gICAgZXBzaWxvbjogMC4wMDEsXG5cbiAgICBtaWRpTm90ZVBvb2xTaXplOiA1MDBcbn07IiwiLy8gTmVlZCB0byBvdmVycmlkZSBleGlzdGluZyAuY29ubmVjdCBmdW5jdGlvbnNcbi8vIGZvciBuYXRpdmUgQXVkaW9QYXJhbXMgYW5kIEF1ZGlvTm9kZXMuLi5cbi8vIEkgZG9uJ3QgbGlrZSBkb2luZyB0aGlzLCBidXQgcydnb3R0YSBiZSBkb25lIDooXG4oIGZ1bmN0aW9uKCkge1xuICAgIHZhciBvcmlnaW5hbEF1ZGlvTm9kZUNvbm5lY3QgPSBBdWRpb05vZGUucHJvdG90eXBlLmNvbm5lY3QsXG4gICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlRGlzY29ubmVjdCA9IEF1ZGlvTm9kZS5wcm90b3R5cGUuZGlzY29ubmVjdDtcblxuICAgIEF1ZGlvTm9kZS5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCApIHtcbiAgICAgICAgaWYgKCBub2RlLmlucHV0cyApIHtcbiAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggbm9kZS5pbnB1dHMgKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3QoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0KCBub2RlLmlucHV0c1sgMCBdLCBvdXRwdXRDaGFubmVsLCBpbnB1dENoYW5uZWwgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9Ob2RlICkge1xuICAgICAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVDb25uZWN0LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZUNvbm5lY3QuY2FsbCggdGhpcywgbm9kZSwgb3V0cHV0Q2hhbm5lbCApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIEF1ZGlvTm9kZS5wcm90b3R5cGUuZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCApIHtcbiAgICAgICAgY29uc29sZS5sb2coIGFyZ3VtZW50cyApO1xuICAgICAgICBpZiAoIG5vZGUuaW5wdXRzICkge1xuICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBub2RlLmlucHV0cyApICkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoIG5vZGUuaW5wdXRzWyAwIF0sIG91dHB1dENoYW5uZWwsIGlucHV0Q2hhbm5lbCApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb05vZGUgKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZURpc2Nvbm5lY3QuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9QYXJhbSApIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQXVkaW9Ob2RlRGlzY29ubmVjdC5jYWxsKCB0aGlzLCBub2RlLCBvdXRwdXRDaGFubmVsICk7XG4gICAgICAgIH1cbiAgICB9O1xufSgpICk7IiwiaW1wb3J0IENPTkZJRyBmcm9tICcuL2NvbmZpZy5lczYnO1xuaW1wb3J0IG1hdGggZnJvbSAnLi4vbWl4aW5zL01hdGguZXM2JztcblxuXG5sZXQgc2lnbmFsQ3VydmVzID0ge307XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnQ29uc3RhbnQnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSAxLjA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdMaW5lYXInLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdFcXVhbFBvd2VyJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKSxcbiAgICAgICAgICAgIHNpbiA9IE1hdGguc2luLFxuICAgICAgICAgICAgUEkgPSBNYXRoLlBJO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBzaW4oIHggKiAwLjUgKiBQSSApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0N1YmVkJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKSxcbiAgICAgICAgICAgIHNpbiA9IE1hdGguc2luLFxuICAgICAgICAgICAgUEkgPSBNYXRoLlBJLFxuICAgICAgICAgICAgcG93ID0gTWF0aC5wb3c7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgeCA9IHBvdyggeCwgMyApO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHNpbiggeCAqIDAuNSAqIFBJICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1JlY3RpZnknLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGhhbGZSZXNvbHV0aW9uID0gcmVzb2x1dGlvbiAqIDAuNSxcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gLWhhbGZSZXNvbHV0aW9uLCB4ID0gMDsgaSA8IGhhbGZSZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpID4gMCA/IGkgOiAtaSApIC8gaGFsZlJlc29sdXRpb247XG4gICAgICAgICAgICBjdXJ2ZVsgaSArIGhhbGZSZXNvbHV0aW9uIF0gPSB4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuXG4vLyBNYXRoIGN1cnZlc1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdHcmVhdGVyVGhhblplcm8nLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4IDw9IDAgPyAwLjAgOiAxLjA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdMZXNzVGhhblplcm8nLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4ID49IDAgPyAwIDogMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnRXF1YWxUb1plcm8nLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4ID09PSAwID8gMSA6IDA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1JlY2lwcm9jYWwnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gNDA5NiAqIDYwMCwgLy8gSGlnaGVyIHJlc29sdXRpb24gbmVlZGVkIGhlcmUuXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICAvLyBjdXJ2ZVsgaSBdID0geCA9PT0gMCA/IDEgOiAwO1xuXG4gICAgICAgICAgICBpZiAoIHggIT09IDAgKSB7XG4gICAgICAgICAgICAgICAgeCA9IE1hdGgucG93KCB4LCAtMSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnU2luZScsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICksXG4gICAgICAgICAgICBzaW4gPSBNYXRoLnNpbjtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gc2luKCB4ICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdSb3VuZCcsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogNTAsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAoIHggPiAwICYmIHggPD0gMC41MDAwMSApIHx8XG4gICAgICAgICAgICAgICAgKCB4IDwgMCAmJiB4ID49IC0wLjUwMDAxIClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIHggPiAwICkge1xuICAgICAgICAgICAgICAgIHggPSAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB4ID0gLTE7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0Zsb29yJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24gKiA1MCxcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcblxuICAgICAgICAgICAgaWYgKCB4ID49IDAuOTk5OSApIHtcbiAgICAgICAgICAgICAgICB4ID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCB4ID49IDAgKSB7XG4gICAgICAgICAgICAgICAgeCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICggeCA8IDAgKSB7XG4gICAgICAgICAgICAgICAgeCA9IC0xO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnR2F1c3NpYW5XaGl0ZU5vaXNlJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24gKiAyLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IG1hdGgubnJhbmQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1doaXRlTm9pc2UnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDIsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gTWF0aC5yYW5kb20oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1BpbmtOb2lzZScsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogMixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIG1hdGguZ2VuZXJhdGVQaW5rTnVtYmVyKCk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IG1hdGguZ2V0TmV4dFBpbmtOdW1iZXIoKSAqIDIgLSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coIE1hdGgubWluLmFwcGx5KCBNYXRoLCBjdXJ2ZSApICk7XG4gICAgICAgIGNvbnNvbGUubG9nKCBNYXRoLm1heC5hcHBseSggTWF0aCwgY3VydmUgKSApO1xuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gc2lnbmFsQ3VydmVzOyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBDdXN0b21FbnZlbG9wZSBmcm9tIFwiLi9DdXN0b21FbnZlbG9wZS5lczZcIjtcblxuY2xhc3MgQVNEUkVudmVsb3BlIGV4dGVuZHMgQ3VzdG9tRW52ZWxvcGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdGhpcy50aW1lcyA9IHtcbiAgICAgICAgICAgIGF0dGFjazogMC4wMSxcbiAgICAgICAgICAgIGRlY2F5OiAwLjUsXG4gICAgICAgICAgICByZWxlYXNlOiAwLjVcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxldmVscyA9IHtcbiAgICAgICAgICAgIGluaXRpYWw6IDAsXG4gICAgICAgICAgICBwZWFrOiAxLFxuICAgICAgICAgICAgc3VzdGFpbjogMSxcbiAgICAgICAgICAgIHJlbGVhc2U6IDBcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2luaXRpYWwnLCAwLCB0aGlzLmxldmVscy5pbml0aWFsICk7XG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnYXR0YWNrJywgdGhpcy50aW1lcy5hdHRhY2ssIHRoaXMubGV2ZWxzLnBlYWsgKTtcbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdkZWNheScsIHRoaXMudGltZXMuZGVjYXksIHRoaXMubGV2ZWxzLnN1c3RhaW4gKTtcbiAgICAgICAgdGhpcy5hZGRFbmRTdGVwKCAncmVsZWFzZScsIHRoaXMudGltZXMucmVsZWFzZSwgdGhpcy5sZXZlbHMucmVsZWFzZSwgdHJ1ZSApO1xuICAgIH1cblxuICAgIGdldCBhdHRhY2tUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5hdHRhY2s7XG4gICAgfVxuICAgIHNldCBhdHRhY2tUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuYXR0YWNrID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdhdHRhY2snLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBkZWNheVRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLmRlY2F5O1xuICAgIH1cbiAgICBzZXQgZGVjYXlUaW1lKCB0aW1lICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMudGltZXMuZGVjYXkgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ2RlY2F5JywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgcmVsZWFzZVRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVzLnJlbGVhc2U7XG4gICAgfVxuICAgIHNldCByZWxlYXNlVGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLnJlbGVhc2UgPSB0aW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwVGltZSggJ3JlbGVhc2UnLCB0aW1lICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBpbml0aWFsTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5pbml0aWFsO1xuICAgIH1cbiAgICBzZXQgaW5pdGlhbExldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMuaW5pdGlhbCA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdpbml0aWFsJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHBlYWtMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnBlYWs7XG4gICAgfVxuXG4gICAgc2V0IHBlYWtMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLnBlYWsgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnYXR0YWNrJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHN1c3RhaW5MZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnN1c3RhaW47XG4gICAgfVxuICAgIHNldCBzdXN0YWluTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5zdXN0YWluID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2RlY2F5JywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHJlbGVhc2VMZXZlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLnJlbGVhc2U7XG4gICAgfVxuICAgIHNldCByZWxlYXNlTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5yZWxlYXNlID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ3JlbGVhc2UnLCBsZXZlbCApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBU0RSRW52ZWxvcGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEFTRFJFbnZlbG9wZSggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQVNEUkVudmVsb3BlOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgQ09ORklHIGZyb20gXCIuLi9jb3JlL2NvbmZpZy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcblxuY2xhc3MgQ3VzdG9tRW52ZWxvcGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgdGhpcy5fc2V0SU8oIGlvICk7XG5cbiAgICAgICAgdGhpcy5vcmRlcnMgPSB7XG4gICAgICAgICAgICBzdGFydDogW10sXG4gICAgICAgICAgICBzdG9wOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc3RlcHMgPSB7XG4gICAgICAgICAgICBzdGFydDoge30sXG4gICAgICAgICAgICBzdG9wOiB7fVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9hZGRTdGVwKCBzZWN0aW9uLCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCA9IGZhbHNlICkge1xuICAgICAgICBsZXQgc3RvcHMgPSB0aGlzLnN0ZXBzWyBzZWN0aW9uIF07XG5cbiAgICAgICAgaWYgKCBzdG9wc1sgbmFtZSBdICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnU3RvcCB3aXRoIG5hbWUgXCInICsgbmFtZSArICdcIiBhbHJlYWR5IGV4aXN0cy4nICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9yZGVyc1sgc2VjdGlvbiBdLnB1c2goIG5hbWUgKTtcblxuICAgICAgICB0aGlzLnN0ZXBzWyBzZWN0aW9uIF1bIG5hbWUgXSA9IHtcbiAgICAgICAgICAgIHRpbWU6IHRpbWUsXG4gICAgICAgICAgICBsZXZlbDogbGV2ZWwsXG4gICAgICAgICAgICBpc0V4cG9uZW50aWFsOiBpc0V4cG9uZW50aWFsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYWRkU3RhcnRTdGVwKCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCA9IGZhbHNlICkge1xuICAgICAgICB0aGlzLl9hZGRTdGVwKCAnc3RhcnQnLCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBhZGRFbmRTdGVwKCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCA9IGZhbHNlICkge1xuICAgICAgICB0aGlzLl9hZGRTdGVwKCAnc3RvcCcsIG5hbWUsIHRpbWUsIGxldmVsLCBpc0V4cG9uZW50aWFsICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFN0ZXBMZXZlbCggbmFtZSwgbGV2ZWwgKSB7XG4gICAgICAgIGxldCBzdGFydEluZGV4ID0gdGhpcy5vcmRlcnMuc3RhcnQuaW5kZXhPZiggbmFtZSApLFxuICAgICAgICAgICAgZW5kSW5kZXggPSB0aGlzLm9yZGVycy5zdG9wLmluZGV4T2YoIG5hbWUgKTtcblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggPT09IC0xICYmIGVuZEluZGV4ID09PSAtMSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ05vIHN0ZXAgd2l0aCBuYW1lIFwiJyArIG5hbWUgKyAnXCIuIE5vIGxldmVsIHNldC4nICk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggIT09IC0xICkge1xuICAgICAgICAgICAgdGhpcy5zdGVwcy5zdGFydFsgbmFtZSBdLmxldmVsID0gcGFyc2VGbG9hdCggbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RlcHMuc3RvcFsgbmFtZSBdLmxldmVsID0gcGFyc2VGbG9hdCggbGV2ZWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG4gICAgc2V0U3RlcFRpbWUoIG5hbWUsIHRpbWUgKSB7XG4gICAgICAgIHZhciBzdGFydEluZGV4ID0gdGhpcy5vcmRlcnMuc3RhcnQuaW5kZXhPZiggbmFtZSApLFxuICAgICAgICAgICAgZW5kSW5kZXggPSB0aGlzLm9yZGVycy5zdG9wLmluZGV4T2YoIG5hbWUgKTtcblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggPT09IC0xICYmIGVuZEluZGV4ID09PSAtMSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ05vIHN0ZXAgd2l0aCBuYW1lIFwiJyArIG5hbWUgKyAnXCIuIE5vIHRpbWUgc2V0LicgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc3RhcnRJbmRleCAhPT0gLTEgKSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnN0YXJ0WyBuYW1lIF0udGltZSA9IHBhcnNlRmxvYXQoIHRpbWUgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RlcHMuc3RvcFsgbmFtZSBdLnRpbWUgPSBwYXJzZUZsb2F0KCB0aW1lICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cblxuXG4gICAgX3RyaWdnZXJTdGVwKCBwYXJhbSwgc3RlcCwgc3RhcnRUaW1lICkge1xuICAgICAgICAvLyBpZiAoIHN0ZXAuaXNFeHBvbmVudGlhbCA9PT0gdHJ1ZSApIHtcbiAgICAgICAgICAgIC8vIFRoZXJlJ3Mgc29tZXRoaW5nIGFtaXNzIGhlcmUhXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggTWF0aC5tYXgoIHN0ZXAubGV2ZWwsIENPTkZJRy5lcHNpbG9uICksIHN0YXJ0VGltZSArIHN0ZXAudGltZSApO1xuICAgICAgICAgICAgLy8gcGFyYW0uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSggTWF0aC5tYXgoIHN0ZXAubGV2ZWwsIDAuMDEgKSwgc3RhcnRUaW1lICsgc3RlcC50aW1lICk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gZWxzZSB7XG4gICAgICAgICAgICBwYXJhbS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggc3RlcC5sZXZlbCwgc3RhcnRUaW1lICsgc3RlcC50aW1lICk7XG4gICAgICAgIC8vIH1cbiAgICB9XG5cbiAgICBfc3RhcnRTZWN0aW9uKCBzZWN0aW9uLCBwYXJhbSwgc3RhcnRUaW1lLCBjYW5jZWxTY2hlZHVsZWRWYWx1ZXMgKSB7XG4gICAgICAgIHZhciBzdG9wT3JkZXIgPSB0aGlzLm9yZGVyc1sgc2VjdGlvbiBdLFxuICAgICAgICAgICAgc3RlcHMgPSB0aGlzLnN0ZXBzWyBzZWN0aW9uIF0sXG4gICAgICAgICAgICBudW1TdG9wcyA9IHN0b3BPcmRlci5sZW5ndGgsXG4gICAgICAgICAgICBzdGVwO1xuXG4gICAgICAgIHBhcmFtLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggc3RhcnRUaW1lICk7XG4gICAgICAgIC8vIHBhcmFtLnNldFZhbHVlQXRUaW1lKCAwLCBzdGFydFRpbWUgKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1TdG9wczsgKytpICkge1xuICAgICAgICAgICAgc3RlcCA9IHN0ZXBzWyBzdG9wT3JkZXJbIGkgXSBdO1xuICAgICAgICAgICAgdGhpcy5fdHJpZ2dlclN0ZXAoIHBhcmFtLCBzdGVwLCBzdGFydFRpbWUgKTtcbiAgICAgICAgICAgIHN0YXJ0VGltZSArPSBzdGVwLnRpbWU7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHN0YXJ0KCBwYXJhbSwgZGVsYXkgPSAwICkge1xuICAgICAgICBpZiAoIHBhcmFtIGluc3RhbmNlb2YgQXVkaW9QYXJhbSA9PT0gZmFsc2UgJiYgcGFyYW0gaW5zdGFuY2VvZiBQYXJhbSA9PT0gZmFsc2UgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdDYW4gb25seSBzdGFydCBhbiBlbnZlbG9wZSBvbiBBdWRpb1BhcmFtIG9yIFBhcmFtIGluc3RhbmNlcy4nICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zdGFydFNlY3Rpb24oICdzdGFydCcsIHBhcmFtLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyBkZWxheSApO1xuICAgIH1cblxuICAgIHN0b3AoIHBhcmFtLCBkZWxheSA9IDAgKSB7XG4gICAgICAgIHRoaXMuX3N0YXJ0U2VjdGlvbiggJ3N0b3AnLCBwYXJhbSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgMC4xICsgZGVsYXkgKTtcbiAgICB9XG5cbiAgICBmb3JjZVN0b3AoIHBhcmFtLCBkZWxheSA9IDAgKSB7XG4gICAgICAgIHBhcmFtLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgZGVsYXkgKTtcbiAgICAgICAgLy8gcGFyYW0uc2V0VmFsdWVBdFRpbWUoIHBhcmFtLnZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyBkZWxheSApO1xuICAgICAgICBwYXJhbS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggMCwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgMC4wMDEgKTtcbiAgICB9XG5cbiAgICBnZXQgdG90YWxTdGFydFRpbWUoKSB7XG4gICAgICAgIHZhciBzdGFydHMgPSB0aGlzLnN0ZXBzLnN0YXJ0LFxuICAgICAgICAgICAgdGltZSA9IDAuMDtcblxuICAgICAgICBmb3IgKCB2YXIgaSBpbiBzdGFydHMgKSB7XG4gICAgICAgICAgICB0aW1lICs9IHN0YXJ0c1sgaSBdLnRpbWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGltZTtcbiAgICB9XG5cbiAgICBnZXQgdG90YWxTdG9wVGltZSgpIHtcbiAgICAgICAgdmFyIHN0b3BzID0gdGhpcy5zdGVwcy5zdG9wLFxuICAgICAgICAgICAgdGltZSA9IDAuMDtcblxuICAgICAgICBmb3IgKCB2YXIgaSBpbiBzdG9wcyApIHtcbiAgICAgICAgICAgIHRpbWUgKz0gc3RvcHNbIGkgXS50aW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRpbWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBDdXN0b21FbnZlbG9wZS5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ3VzdG9tRW52ZWxvcGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEN1c3RvbUVudmVsb3BlKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDdXN0b21FbnZlbG9wZTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IERyeVdldE5vZGUgZnJvbSBcIi4uL2dyYXBocy9EcnlXZXROb2RlLmVzNlwiO1xuXG4vLyBUT0RPOiBBZGQgZmVlZGJhY2tMZXZlbCBhbmQgZGVsYXlUaW1lIFBhcmFtIGluc3RhbmNlc1xuLy8gdG8gY29udHJvbCB0aGlzIG5vZGUuXG5jbGFzcyBEZWxheSBleHRlbmRzIERyeVdldE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdGltZSA9IDAsIGZlZWRiYWNrTGV2ZWwgPSAwICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbnRyb2wgbm9kZXMuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2sgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBmZWVkYmFja0xldmVsICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudGltZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHRpbWUgKTtcblxuICAgICAgICAvLyBDcmVhdGUgZmVlZGJhY2sgYW5kIGRlbGF5IG5vZGVzXG4gICAgICAgIHRoaXMuZmVlZGJhY2sgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG5cbiAgICAgICAgLy8gU2V0dXAgdGhlIGZlZWRiYWNrIGxvb3BcbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLmZlZWRiYWNrICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suY29ubmVjdCggdGhpcy5kZWxheSApO1xuXG4gICAgICAgIC8vIEFsc28gY29ubmVjdCB0aGUgZGVsYXkgdG8gdGhlIHdldCBvdXRwdXQuXG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy53ZXQgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGlucHV0IHRvIGRlbGF5XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5kZWxheSApO1xuXG4gICAgICAgIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgdGhpcy5mZWVkYmFjay5nYWluLnZhbHVlID0gMDtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnRpbWUuY29ubmVjdCggdGhpcy5kZWxheS5kZWxheVRpbWUgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5mZWVkYmFjay5jb25uZWN0KCB0aGlzLmZlZWRiYWNrLmdhaW4gKTtcbiAgICB9XG5cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEZWxheSA9IGZ1bmN0aW9uKCB0aW1lLCBmZWVkYmFja0xldmVsICkge1xuICAgIHJldHVybiBuZXcgRGVsYXkoIHRoaXMsIHRpbWUsIGZlZWRiYWNrTGV2ZWwgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IERlbGF5OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5pbXBvcnQgY29ubmVjdGlvbnMgZnJvbSBcIi4uL21peGlucy9jb25uZWN0aW9ucy5lczZcIjtcbmltcG9ydCBjbGVhbmVycyBmcm9tIFwiLi4vbWl4aW5zL2NsZWFuZXJzLmVzNlwiO1xuaW1wb3J0IERyeVdldE5vZGUgZnJvbSBcIi4uL2dyYXBocy9EcnlXZXROb2RlLmVzNlwiO1xuaW1wb3J0IERlbGF5IGZyb20gXCIuL0RlbGF5LmVzNlwiO1xuXG4vLyBUT0RPOlxuLy8gIC0gQ29udmVydCB0aGlzIG5vZGUgdG8gdXNlIFBhcmFtIGNvbnRyb2xzXG4vLyAgICBmb3IgdGltZSBhbmQgZmVlZGJhY2suXG5cbmNsYXNzIFBpbmdQb25nRGVsYXkgZXh0ZW5kcyBEcnlXZXROb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHRpbWUgPSAwLjI1LCBmZWVkYmFja0xldmVsID0gMC41ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyBDcmVhdGUgY2hhbm5lbCBzcGxpdHRlciBhbmQgbWVyZ2VyXG4gICAgICAgIHRoaXMuc3BsaXR0ZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKCAyICk7XG4gICAgICAgIHRoaXMubWVyZ2VyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxNZXJnZXIoIDIgKTtcblxuICAgICAgICAvLyBDcmVhdGUgZmVlZGJhY2sgYW5kIGRlbGF5IG5vZGVzXG4gICAgICAgIHRoaXMuZmVlZGJhY2tMID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5mZWVkYmFja1IgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmRlbGF5TCA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICB0aGlzLmRlbGF5UiA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuXG4gICAgICAgIC8vIFNldHVwIHRoZSBmZWVkYmFjayBsb29wXG4gICAgICAgIHRoaXMuZGVsYXlMLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2tMICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tMLmNvbm5lY3QoIHRoaXMuZGVsYXlSICk7XG4gICAgICAgIHRoaXMuZGVsYXlSLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2tSICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tSLmNvbm5lY3QoIHRoaXMuZGVsYXlMICk7XG5cblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc3BsaXR0ZXIgKTtcbiAgICAgICAgdGhpcy5zcGxpdHRlci5jb25uZWN0KCB0aGlzLmRlbGF5TCwgMCApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrTC5jb25uZWN0KCB0aGlzLm1lcmdlciwgMCwgMCApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrUi5jb25uZWN0KCB0aGlzLm1lcmdlciwgMCwgMSApO1xuICAgICAgICB0aGlzLm1lcmdlci5jb25uZWN0KCB0aGlzLndldCApO1xuXG4gICAgICAgIHRoaXMudGltZSA9IHRpbWU7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tMZXZlbCA9IGZlZWRiYWNrTGV2ZWw7XG4gICAgfVxuXG4gICAgZ2V0IHRpbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlbGF5TC5kZWxheVRpbWU7XG4gICAgfVxuXG4gICAgc2V0IHRpbWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmRlbGF5TC5kZWxheVRpbWUubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIDAuNVxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuZGVsYXlSLmRlbGF5VGltZS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZShcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgMC41XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZ2V0IGZlZWRiYWNrTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZlZWRiYWNrTC5nYWluLnZhbHVlO1xuICAgIH1cblxuICAgIHNldCBmZWVkYmFja0xldmVsKCBsZXZlbCApIHtcbiAgICAgICAgdGhpcy5mZWVkYmFja0wuZ2Fpbi52YWx1ZSA9IGxldmVsO1xuICAgICAgICB0aGlzLmZlZWRiYWNrUi5nYWluLnZhbHVlID0gbGV2ZWw7XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBQaW5nUG9uZ0RlbGF5LnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuQXVkaW9JTy5taXhpbiggUGluZ1BvbmdEZWxheS5wcm90b3R5cGUsIGNvbm5lY3Rpb25zICk7XG5BdWRpb0lPLm1peGluKCBQaW5nUG9uZ0RlbGF5LnByb3RvdHlwZSwgY2xlYW5lcnMgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUGluZ1BvbmdEZWxheSA9IGZ1bmN0aW9uKCB0aW1lLCBmZWVkYmFja0xldmVsICkge1xuICAgIHJldHVybiBuZXcgUGluZ1BvbmdEZWxheSggdGhpcywgdGltZSwgZmVlZGJhY2tMZXZlbCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5cbmNsYXNzIE9zY2lsbGF0b3JHZW5lcmF0b3Ige1xuICAgIGNvbnN0cnVjdG9yKCBpbywgZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmVmb3JtICkge1xuICAgICAgICB0aGlzLl9zZXRJTyggaW8gKTtcblxuICAgICAgICB0aGlzLmZyZXF1ZW5jeSA9IGZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5kZXR1bmUgPSBkZXR1bmU7XG4gICAgICAgIHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eTtcbiAgICAgICAgdGhpcy5nbGlkZVRpbWUgPSBnbGlkZVRpbWU7XG4gICAgICAgIHRoaXMud2F2ZSA9IHdhdmVmb3JtIHx8ICdzaW5lJztcbiAgICAgICAgdGhpcy5yZXNldFRpbWVzdGFtcCA9IDAuMDtcblxuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IHRoaXMuY29udGV4dC5jcmVhdGVPc2NpbGxhdG9yKCksXG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaCA9IHRoaXMuX21ha2VWZWxvY2l0eUdyYXBoKCB2ZWxvY2l0eSApO1xuICAgICAgICB0aGlzLm91dHB1dHMgPSBbIHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCkgXTtcbiAgICAgICAgdGhpcy5yZXNldCggdGhpcy5mcmVxdWVuY3ksIHRoaXMuZGV0dW5lLCB0aGlzLnZlbG9jaXR5LCB0aGlzLmdsaWRlVGltZSwgdGhpcy53YXZlICk7XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IuY29ubmVjdCggdGhpcy52ZWxvY2l0eUdyYXBoICk7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIF9tYWtlVmVsb2NpdHlHcmFwaCgpIHtcbiAgICAgICAgdmFyIGdhaW4gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICByZXR1cm4gZ2FpbjtcbiAgICB9XG5cbiAgICBfcmVzZXRWZWxvY2l0eUdyYXBoKCB2ZWxvY2l0eSApIHtcbiAgICAgICAgdGhpcy52ZWxvY2l0eUdyYXBoLmdhaW4udmFsdWUgPSB2ZWxvY2l0eTtcbiAgICB9XG5cbiAgICBfY2xlYW5VcFZlbG9jaXR5R3JhcGgoKSB7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaC5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eUdyYXBoID0gbnVsbDtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0gPSBudWxsO1xuICAgICAgICB0aGlzLm91dHB1dHMgPSBudWxsO1xuICAgIH1cblxuICAgIGxlcnAoIHN0YXJ0LCBlbmQsIGRlbHRhICkge1xuICAgICAgICByZXR1cm4gc3RhcnQgKyAoICggZW5kIC0gc3RhcnQgKSAqIGRlbHRhICk7XG4gICAgfVxuXG4gICAgcmVzZXQoIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlICkge1xuICAgICAgICB2YXIgbm93ID0gdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgIGZyZXF1ZW5jeSA9IHR5cGVvZiBmcmVxdWVuY3kgPT09ICdudW1iZXInID8gZnJlcXVlbmN5IDogdGhpcy5mcmVxdWVuY3k7XG4gICAgICAgIGRldHVuZSA9IHR5cGVvZiBkZXR1bmUgPT09ICdudW1iZXInID8gZGV0dW5lIDogdGhpcy5kZXR1bmU7XG4gICAgICAgIHZlbG9jaXR5ID0gdHlwZW9mIHZlbG9jaXR5ID09PSAnbnVtYmVyJyA/IHZlbG9jaXR5IDogdGhpcy52ZWxvY2l0eTtcbiAgICAgICAgd2F2ZSA9IHR5cGVvZiB3YXZlID09PSAnbnVtYmVyJyA/IHdhdmUgOiB0aGlzLndhdmU7XG5cbiAgICAgICAgdmFyIGdsaWRlVGltZSA9IHR5cGVvZiBnbGlkZVRpbWUgPT09ICdudW1iZXInID8gZ2xpZGVUaW1lIDogMDtcblxuICAgICAgICB0aGlzLl9yZXNldFZlbG9jaXR5R3JhcGgoIHZlbG9jaXR5ICk7XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IuZnJlcXVlbmN5LmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggbm93ICk7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLmRldHVuZS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIG5vdyApO1xuXG4gICAgICAgIC8vIG5vdyArPSAwLjFcblxuICAgICAgICAvLyBpZiAoIHRoaXMuZ2xpZGVUaW1lICE9PSAwLjAgKSB7XG4gICAgICAgIC8vICAgICB2YXIgc3RhcnRGcmVxID0gdGhpcy5mcmVxdWVuY3ksXG4gICAgICAgIC8vICAgICAgICAgZW5kRnJlcSA9IGZyZXF1ZW5jeSxcbiAgICAgICAgLy8gICAgICAgICBmcmVxRGlmZiA9IGVuZEZyZXEgLSBzdGFydEZyZXEsXG4gICAgICAgIC8vICAgICAgICAgc3RhcnRUaW1lID0gdGhpcy5yZXNldFRpbWVzdGFtcCxcbiAgICAgICAgLy8gICAgICAgICBlbmRUaW1lID0gdGhpcy5yZXNldFRpbWVzdGFtcCArIHRoaXMuZ2xpZGVUaW1lLFxuICAgICAgICAvLyAgICAgICAgIGN1cnJlbnRUaW1lID0gbm93IC0gc3RhcnRUaW1lLFxuICAgICAgICAvLyAgICAgICAgIGxlcnBQb3MgPSBjdXJyZW50VGltZSAvIHRoaXMuZ2xpZGVUaW1lLFxuICAgICAgICAvLyAgICAgICAgIGN1cnJlbnRGcmVxID0gdGhpcy5sZXJwKCB0aGlzLmZyZXF1ZW5jeSwgZnJlcXVlbmN5LCBsZXJwUG9zICk7XG5cbiAgICAgICAgLy8gICAgIGlmICggY3VycmVudFRpbWUgPCBnbGlkZVRpbWUgKSB7XG4gICAgICAgIC8vICAgICAgICAgY29uc29sZS5sb2coICdjdXRvZmYnLCBzdGFydEZyZXEsIGN1cnJlbnRGcmVxICk7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZnJlcXVlbmN5LnNldFZhbHVlQXRUaW1lKCBjdXJyZW50RnJlcSwgbm93ICk7XG4gICAgICAgIC8vICAgICB9XG5cblxuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coIHN0YXJ0VGltZSwgZW5kVGltZSwgbm93LCBjdXJyZW50VGltZSApO1xuICAgICAgICAvLyB9XG5cblxuICAgICAgICAvLyBub3cgKz0gMC41O1xuXG4gICAgICAgIGlmICggZ2xpZGVUaW1lICE9PSAwICkge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKCBmcmVxdWVuY3ksIG5vdyArIGdsaWRlVGltZSApO1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZGV0dW5lLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKCBkZXR1bmUsIG5vdyArIGdsaWRlVGltZSApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZnJlcXVlbmN5LnNldFZhbHVlQXRUaW1lKCBmcmVxdWVuY3ksIG5vdyApO1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IuZGV0dW5lLnNldFZhbHVlQXRUaW1lKCBkZXR1bmUsIG5vdyApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCB0eXBlb2Ygd2F2ZSA9PT0gJ3N0cmluZycgKSB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRvci50eXBlID0gd2F2ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLnR5cGUgPSB0aGlzLndhdmU7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlc2V0VGltZXN0YW1wID0gbm93O1xuICAgICAgICB0aGlzLmdsaWRlVGltZSA9IGdsaWRlVGltZTtcbiAgICAgICAgdGhpcy5mcmVxdWVuY3kgPSBmcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuZGV0dW5lID0gZGV0dW5lO1xuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgICAgIHRoaXMud2F2ZSA9IHdhdmU7XG4gICAgfVxuXG4gICAgc3RhcnQoIGRlbGF5ICkge1xuICAgICAgICB0aGlzLmdlbmVyYXRvci5zdGFydCggZGVsYXkgKTtcbiAgICB9XG5cbiAgICBzdG9wKCBkZWxheSApIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3Iuc3RvcCggZGVsYXkgKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLmdlbmVyYXRvci5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9jbGVhblVwVmVsb2NpdHlHcmFwaCgpO1xuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggT3NjaWxsYXRvckdlbmVyYXRvci5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlT3NjaWxsYXRvckdlbmVyYXRvciA9IGZ1bmN0aW9uKCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZSApIHtcbiAgICByZXR1cm4gbmV3IE9zY2lsbGF0b3JHZW5lcmF0b3IoIHRoaXMsIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuY2xhc3MgQ291bnRlciBleHRlbmRzIE5vZGUge1xuXG4gICAgY29uc3RydWN0b3IoIGlvLCBpbmNyZW1lbnQsIGxpbWl0LCBzdGVwVGltZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5jb25zdGFudCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGluY3JlbWVudCApO1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIHRoaXMuZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSBzdGVwVGltZSB8fCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGU7XG5cbiAgICAgICAgdGhpcy5mZWVkYmFjayA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suY29ubmVjdCggdGhpcy5kZWxheSApO1xuXG4gICAgICAgIHRoaXMubXVsdGlwbHkuY29ubmVjdCggdGhpcy5kZWxheSApO1xuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMuZmVlZGJhY2sgKTtcbiAgICAgICAgdGhpcy5mZWVkYmFjay5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG5cbiAgICAgICAgdGhpcy5sZXNzVGhhbiA9IHRoaXMuaW8uY3JlYXRlTGVzc1RoYW4oIGxpbWl0ICk7XG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5sZXNzVGhhbiApO1xuICAgICAgICB0aGlzLmxlc3NUaGFuLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2suZ2FpbiApO1xuICAgICAgICB0aGlzLmNvbnN0YW50LmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5sZXNzVGhhbi5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb3VudGVyID0gZnVuY3Rpb24oIGluY3JlbWVudCwgbGltaXQsIHN0ZXBUaW1lICkge1xuICAgIHJldHVybiBuZXcgQ291bnRlciggdGhpcywgaW5jcmVtZW50LCBsaW1pdCwgc3RlcFRpbWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgQ3Jvc3NmYWRlciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtQ2FzZXMgPSAyLCBzdGFydGluZ0Nhc2UgPSAwICkge1xuXG4gICAgICAgIC8vIEVuc3VyZSBzdGFydGluZ0Nhc2UgaXMgbmV2ZXIgPCAwXG4gICAgICAgIC8vIGFuZCBudW1iZXIgb2YgaW5wdXRzIGlzIGFsd2F5cyA+PSAyIChubyBwb2ludFxuICAgICAgICAvLyB4LWZhZGluZyBiZXR3ZWVuIGxlc3MgdGhhbiB0d28gaW5wdXRzISlcbiAgICAgICAgc3RhcnRpbmdDYXNlID0gTWF0aC5hYnMoIHN0YXJ0aW5nQ2FzZSApO1xuICAgICAgICBudW1DYXNlcyA9IE1hdGgubWF4KCBudW1DYXNlcywgMiApO1xuXG4gICAgICAgIHN1cGVyKCBpbywgbnVtQ2FzZXMsIDEgKTtcblxuICAgICAgICB0aGlzLmNsYW1wcyA9IFtdO1xuICAgICAgICB0aGlzLnN1YnRyYWN0cyA9IFtdO1xuICAgICAgICB0aGlzLnhmYWRlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5jb250cm9scy5pbmRleCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IG51bUNhc2VzIC0gMTsgKytpICkge1xuICAgICAgICAgICAgdGhpcy54ZmFkZXJzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZURyeVdldE5vZGUoKTtcbiAgICAgICAgICAgIHRoaXMuc3VidHJhY3RzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCBpKTtcbiAgICAgICAgICAgIHRoaXMuY2xhbXBzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZUNsYW1wKCAwLCAxICk7XG5cbiAgICAgICAgICAgIGlmKCBpID09PSAwICkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0uY29ubmVjdCggdGhpcy54ZmFkZXJzWyBpIF0uZHJ5ICk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgKyAxIF0uY29ubmVjdCggdGhpcy54ZmFkZXJzWyBpIF0ud2V0ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnhmYWRlcnNbIGkgLSAxIF0uY29ubmVjdCggdGhpcy54ZmFkZXJzWyBpIF0uZHJ5ICk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgKyAxIF0uY29ubmVjdCggdGhpcy54ZmFkZXJzWyBpIF0ud2V0ICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuaW5kZXguY29ubmVjdCggdGhpcy5zdWJ0cmFjdHNbIGkgXSApO1xuICAgICAgICAgICAgdGhpcy5zdWJ0cmFjdHNbIGkgXS5jb25uZWN0KCB0aGlzLmNsYW1wc1sgaSBdICk7XG4gICAgICAgICAgICB0aGlzLmNsYW1wc1sgaSBdLmNvbm5lY3QoIHRoaXMueGZhZGVyc1sgaSBdLmNvbnRyb2xzLmRyeVdldCApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy54ZmFkZXJzWyB0aGlzLnhmYWRlcnMubGVuZ3RoIC0gMSBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ3Jvc3NmYWRlciA9IGZ1bmN0aW9uKCBudW1DYXNlcywgc3RhcnRpbmdDYXNlICkge1xuICAgIHJldHVybiBuZXcgQ3Jvc3NmYWRlciggdGhpcywgbnVtQ2FzZXMsIHN0YXJ0aW5nQ2FzZSApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgRGlmZnVzZURlbGF5IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzID0ge1xuICAgICAgICAgICAgZGlmZnVzaW9uOiB0aGlzLmlvLmNyZWF0ZVBhcmFtKCksXG4gICAgICAgICAgICB0aW1lOiB0aGlzLmlvLmNyZWF0ZVBhcmFtKClcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmZlZWRiYWNrQWRkZXIgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICB0aGlzLmRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIHRoaXMubmVnYXRlID0gdGhpcy5pby5jcmVhdGVOZWdhdGUoKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseTEgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkyID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLnN1bSA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuc2hlbGYgPSB0aGlzLmlvLmNyZWF0ZUVRU2hlbGYoKTtcblxuICAgICAgICB0aGlzLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgIHRoaXMuY29udHJvbHMudGltZS5jb25uZWN0KCB0aGlzLmRlbGF5LmRlbGF5VGltZSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZGlmZnVzaW9uLmNvbm5lY3QoIHRoaXMubmVnYXRlICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5tdWx0aXBseTEsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5uZWdhdGUuY29ubmVjdCggdGhpcy5tdWx0aXBseTEsIDAsIDEgKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseTEuY29ubmVjdCggdGhpcy5zdW0sIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1swXS5jb25uZWN0KCB0aGlzLmZlZWRiYWNrQWRkZXIsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseTIuY29ubmVjdCggdGhpcy5mZWVkYmFja0FkZGVyLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5mZWVkYmFja0FkZGVyLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLnNoZWxmICk7XG5cbiAgICAgICAgdGhpcy5zaGVsZi5jb25uZWN0KCB0aGlzLnN1bSwgMCwgMCApO1xuXG5cbiAgICAgICAgdGhpcy5jb250cm9scy5kaWZmdXNpb24uY29ubmVjdCggdGhpcy5tdWx0aXBseTIsIDAsIDEgKTtcbiAgICAgICAgdGhpcy5zdW0uY29ubmVjdCggdGhpcy5tdWx0aXBseTIsIDAsIDEgKTtcbiAgICAgICAgdGhpcy5zdW0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRGlmZnVzZURlbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBEaWZmdXNlRGVsYXkoIHRoaXMgKTtcbn07XG5cbmV4cG9ydFxuZGVmYXVsdCBEaWZmdXNlRGVsYXk7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBjb25uZWN0aW9ucyBmcm9tIFwiLi4vbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNlwiO1xuaW1wb3J0IGNsZWFuZXJzIGZyb20gXCIuLi9taXhpbnMvY2xlYW5lcnMuZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbi8vIFRoaXMgZnVuY3Rpb24gY3JlYXRlcyBhIGdyYXBoIHRoYXQgYWxsb3dzIG1vcnBoaW5nXG4vLyBiZXR3ZWVuIHR3byBnYWluIG5vZGVzLlxuLy9cbi8vIEl0IGxvb2tzIGEgbGl0dGxlIGJpdCBsaWtlIHRoaXM6XG4vL1xuLy8gICAgICAgICAgICAgICAgIGRyeSAtPiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0+IHxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ICBHYWluKDAtMSkgICAgLT4gICAgIEdhaW4oLTEpICAgICAtPiAgICAgb3V0cHV0XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZmFkZXIpICAgICAgICAgKGludmVydCBwaGFzZSkgICAgICAgIChzdW1taW5nKVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgXlxuLy8gICAgd2V0IC0+ICAgR2FpbigtMSkgICAtPiAtfFxuLy8gICAgICAgICAgKGludmVydCBwaGFzZSlcbi8vXG4vLyBXaGVuIGFkanVzdGluZyB0aGUgZmFkZXIncyBnYWluIHZhbHVlIGluIHRoaXMgZ3JhcGgsXG4vLyBpbnB1dDEncyBnYWluIGxldmVsIHdpbGwgY2hhbmdlIGZyb20gMCB0byAxLFxuLy8gd2hpbHN0IGlucHV0MidzIGdhaW4gbGV2ZWwgd2lsbCBjaGFuZ2UgZnJvbSAxIHRvIDAuXG5jbGFzcyBEcnlXZXROb2RlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBkcnlXZXRWYWx1ZSA9IDAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMiwgMSApO1xuXG4gICAgICAgIHRoaXMuZHJ5ID0gdGhpcy5pbnB1dHNbIDAgXTtcbiAgICAgICAgdGhpcy53ZXQgPSB0aGlzLmlucHV0c1sgMSBdO1xuXG4gICAgICAgIC8vIEludmVydCB3ZXQgc2lnbmFsJ3MgcGhhc2VcbiAgICAgICAgdGhpcy53ZXRJbnB1dEludmVydCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMud2V0SW5wdXRJbnZlcnQuZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICB0aGlzLndldC5jb25uZWN0KCB0aGlzLndldElucHV0SW52ZXJ0ICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBmYWRlciBub2RlXG4gICAgICAgIHRoaXMuZmFkZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmZhZGVyLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgY29udHJvbCBub2RlLiBJdCBzZXRzIHRoZSBmYWRlcidzIHZhbHVlLlxuICAgICAgICB0aGlzLmRyeVdldENvbnRyb2wgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuZHJ5V2V0Q29udHJvbC5jb25uZWN0KCB0aGlzLmZhZGVyLmdhaW4gKTtcblxuICAgICAgICAvLyBJbnZlcnQgdGhlIGZhZGVyIG5vZGUncyBwaGFzZVxuICAgICAgICB0aGlzLmZhZGVySW52ZXJ0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5mYWRlckludmVydC5nYWluLnZhbHVlID0gLTE7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBmYWRlciB0byBmYWRlciBwaGFzZSBpbnZlcnNpb24sXG4gICAgICAgIC8vIGFuZCBmYWRlciBwaGFzZSBpbnZlcnNpb24gdG8gb3V0cHV0LlxuICAgICAgICB0aGlzLndldElucHV0SW52ZXJ0LmNvbm5lY3QoIHRoaXMuZmFkZXIgKTtcbiAgICAgICAgdGhpcy5mYWRlci5jb25uZWN0KCB0aGlzLmZhZGVySW52ZXJ0ICk7XG4gICAgICAgIHRoaXMuZmFkZXJJbnZlcnQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBDb25uZWN0IGRyeSBpbnB1dCB0byBib3RoIHRoZSBvdXRwdXQgYW5kIHRoZSBmYWRlciBub2RlXG4gICAgICAgIHRoaXMuZHJ5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuZHJ5LmNvbm5lY3QoIHRoaXMuZmFkZXIgKTtcblxuICAgICAgICAvLyBBZGQgYSAnZHJ5V2V0JyBwcm9wZXJ0eSB0byB0aGUgY29udHJvbHMgb2JqZWN0LlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRyeVdldCA9IHRoaXMuZHJ5V2V0Q29udHJvbDtcbiAgICB9XG5cbn1cblxuXG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRHJ5V2V0Tm9kZSA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IERyeVdldE5vZGUoIHRoaXMsIHZhbHVlICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBEcnlXZXROb2RlO1xuIiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIEVRU2hlbGYgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGhpZ2hGcmVxdWVuY3kgPSAyNTAwLCBsb3dGcmVxdWVuY3kgPSAzNTAsIGhpZ2hCb29zdCA9IC02LCBsb3dCb29zdCA9IDAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuaGlnaEZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hGcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5sb3dGcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dGcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5oaWdoQm9vc3QgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoQm9vc3QgKTtcbiAgICAgICAgdGhpcy5sb3dCb29zdCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd0Jvb3N0ICk7XG5cbiAgICAgICAgdGhpcy5sb3dTaGVsZiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgICAgICAgdGhpcy5sb3dTaGVsZi50eXBlID0gJ2xvd3NoZWxmJztcbiAgICAgICAgdGhpcy5sb3dTaGVsZi5mcmVxdWVuY3kudmFsdWUgPSBsb3dGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMubG93U2hlbGYuZ2Fpbi52YWx1ZSA9IGxvd0Jvb3N0O1xuXG4gICAgICAgIHRoaXMuaGlnaFNoZWxmID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICB0aGlzLmhpZ2hTaGVsZi50eXBlID0gJ2hpZ2hzaGVsZic7XG4gICAgICAgIHRoaXMuaGlnaFNoZWxmLmZyZXF1ZW5jeS52YWx1ZSA9IGhpZ2hGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuaGlnaFNoZWxmLmdhaW4udmFsdWUgPSBoaWdoQm9vc3Q7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmxvd1NoZWxmICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5oaWdoU2hlbGYgKTtcbiAgICAgICAgdGhpcy5sb3dTaGVsZi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmhpZ2hTaGVsZi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIFN0b3JlIGNvbnRyb2xsYWJsZSBwYXJhbXMuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRPRE86XG4gICAgICAgIC8vICAtIFNob3VsZCB0aGVzZSBiZSByZWZlcmVuY2VzIHRvIHBhcmFtLmNvbnRyb2w/IFRoaXNcbiAgICAgICAgLy8gICAgbWlnaHQgYWxsb3cgZGVmYXVsdHMgdG8gYmUgc2V0IHdoaWxzdCBhbHNvIGFsbG93aW5nXG4gICAgICAgIC8vICAgIGF1ZGlvIHNpZ25hbCBjb250cm9sLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hGcmVxdWVuY3kgPSB0aGlzLmhpZ2hGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93RnJlcXVlbmN5ID0gdGhpcy5sb3dGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEJvb3N0ID0gdGhpcy5oaWdoQm9vc3Q7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93Qm9vc3QgPSB0aGlzLmxvd0Jvb3N0O1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVFUVNoZWxmID0gZnVuY3Rpb24oIGhpZ2hGcmVxdWVuY3ksIGxvd0ZyZXF1ZW5jeSwgaGlnaEJvb3N0LCBsb3dCb29zdCApIHtcbiAgICByZXR1cm4gbmV3IEVRU2hlbGYoIHRoaXMsIGhpZ2hGcmVxdWVuY3ksIGxvd0ZyZXF1ZW5jeSwgaGlnaEJvb3N0LCBsb3dCb29zdCApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRVFTaGVsZjsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxudmFyIE9TQ0lMTEFUT1JfVFlQRVMgPSBbXG4gICAgJ3NpbmUnLFxuICAgICd0cmlhbmdsZScsXG4gICAgJ3Nhd3Rvb3RoJyxcbiAgICAnc3F1YXJlJ1xuXTtcblxuY2xhc3MgT3NjaWxsYXRvckJhbmsgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuZnJlcXVlbmN5ID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLnN3aXRjaCA9IHRoaXMuaW8uY3JlYXRlU3dpdGNoKCBPU0NJTExBVE9SX1RZUEVTLmxlbmd0aCApO1xuXG4gICAgICAgIHRoaXMub3NjaWxsYXRvcnMgPSBbXTtcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IE9TQ0lMTEFUT1JfVFlQRVMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB2YXIgb3NjID0gdGhpcy5jb250ZXh0LmNyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgICAgICAgICAgIG9zYy50eXBlID0gT1NDSUxMQVRPUl9UWVBFU1sgaSBdO1xuICAgICAgICAgICAgb3NjLmZyZXF1ZW5jeS52YWx1ZSA9IDA7XG4gICAgICAgICAgICB0aGlzLmZyZXF1ZW5jeS5jb25uZWN0KCBvc2MuZnJlcXVlbmN5ICk7XG4gICAgICAgICAgICBvc2Muc3RhcnQoIDAgKTtcbiAgICAgICAgICAgIG9zYy5jb25uZWN0KCB0aGlzLnN3aXRjaCwgMCwgaSApO1xuICAgICAgICAgICAgdGhpcy5vc2NpbGxhdG9ycy5wdXNoKCBvc2MgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3dpdGNoLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgLy8gU3RvcmUgY29udHJvbGxhYmxlIHBhcmFtcy5cbiAgICAgICAgdGhpcy5jb250cm9scy53YXZlZm9ybSA9IHRoaXMuc3dpdGNoLmNvbnRyb2w7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5mcmVxdWVuY3k7XG4gICAgfVxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU9zY2lsbGF0b3JCYW5rID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBPc2NpbGxhdG9yQmFuayggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgT3NjaWxsYXRvckJhbms7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIFBoYXNlT2Zmc2V0IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLnJlY2lwcm9jYWwgPSB0aGlzLmlvLmNyZWF0ZVJlY2lwcm9jYWwoIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlICogMC41ICk7XG4gICAgICAgIHRoaXMuZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMucGhhc2UgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuaGFsZlBoYXNlID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggMC41ICk7XG5cbiAgICAgICAgdGhpcy5kZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuXG4gICAgICAgIHRoaXMuZnJlcXVlbmN5LmNvbm5lY3QoIHRoaXMucmVjaXByb2NhbCApO1xuICAgICAgICB0aGlzLnJlY2lwcm9jYWwuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLnBoYXNlLmNvbm5lY3QoIHRoaXMuaGFsZlBoYXNlICk7XG4gICAgICAgIHRoaXMuaGFsZlBoYXNlLmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseS5jb25uZWN0KCB0aGlzLmRlbGF5LmRlbGF5VGltZSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gMC41O1xuXG4gICAgICAgIC8vIFN0b3JlIGNvbnRyb2xsYWJsZSBwYXJhbXMuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZnJlcXVlbmN5ID0gdGhpcy5mcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuY29udHJvbHMucGhhc2UgPSB0aGlzLnBoYXNlO1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVQaGFzZU9mZnNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUGhhc2VPZmZzZXQoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFBoYXNlT2Zmc2V0OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG4vLyBpbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5pbXBvcnQgbWF0aCBmcm9tIFwiLi4vbWl4aW5zL21hdGguZXM2XCI7XG4vLyBpbXBvcnQgTm90ZSBmcm9tIFwiLi4vbm90ZS9Ob3RlLmVzNlwiO1xuLy8gaW1wb3J0IENob3JkIGZyb20gXCIuLi9ub3RlL0Nob3JkLmVzNlwiO1xuXG4vLyAgUGxheWVyXG4vLyAgPT09PT09XG4vLyAgVGFrZXMgY2FyZSBvZiByZXF1ZXN0aW5nIEdlbmVyYXRvck5vZGVzIGJlIGNyZWF0ZWQuXG4vL1xuLy8gIEhhczpcbi8vICAgICAgLSBQb2x5cGhvbnkgKHBhcmFtKVxuLy8gICAgICAtIFVuaXNvbiAocGFyYW0pXG4vLyAgICAgIC0gVW5pc29uIGRldHVuZSAocGFyYW0pXG4vLyAgICAgIC0gVW5pc29uIHBoYXNlIChwYXJhbSlcbi8vICAgICAgLSBHbGlkZSBtb2RlXG4vLyAgICAgIC0gR2xpZGUgdGltZVxuLy8gICAgICAtIFZlbG9jaXR5IHNlbnNpdGl2aXR5IChwYXJhbSlcbi8vICAgICAgLSBHbG9iYWwgdHVuaW5nIChwYXJhbSlcbi8vXG4vLyAgTWV0aG9kczpcbi8vICAgICAgLSBzdGFydCggZnJlcS9ub3RlLCB2ZWwsIGRlbGF5IClcbi8vICAgICAgLSBzdG9wKCBmcmVxL25vdGUsIHZlbCwgZGVsYXkgKVxuLy9cbi8vICBQcm9wZXJ0aWVzOlxuLy8gICAgICAtIHBvbHlwaG9ueSAobnVtYmVyLCA+MSlcbi8vICAgICAgLSB1bmlzb24gKG51bWJlciwgPjEpXG4vLyAgICAgIC0gdW5pc29uRGV0dW5lIChudW1iZXIsIGNlbnRzKVxuLy8gICAgICAtIHVuaXNvblBoYXNlIChudW1iZXIsIDAtMSlcbi8vICAgICAgLSBnbGlkZU1vZGUgKHN0cmluZylcbi8vICAgICAgLSBnbGlkZVRpbWUgKG1zLCBudW1iZXIpXG4vLyAgICAgIC0gdmVsb2NpdHlTZW5zaXRpdml0eSAoMC0xLCBudW1iZXIpXG4vLyAgICAgIC0gdHVuaW5nICgtNjQsICs2NCwgc2VtaXRvbmVzKVxuLy9cbmNsYXNzIEdlbmVyYXRvclBsYXllciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgb3B0aW9ucyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmdlbmVyYXRvciA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnR2VuZXJhdG9yUGxheWVyIHJlcXVpcmVzIGEgYGdlbmVyYXRvcmAgb3B0aW9uIHRvIGJlIGdpdmVuLicgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yID0gb3B0aW9ucy5nZW5lcmF0b3I7XG5cbiAgICAgICAgdGhpcy5wb2x5cGhvbnkgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBvcHRpb25zLnBvbHlwaG9ueSB8fCAxICk7XG5cbiAgICAgICAgdGhpcy51bmlzb24gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBvcHRpb25zLnVuaXNvbiB8fCAxICk7XG4gICAgICAgIHRoaXMudW5pc29uRGV0dW5lID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMudW5pc29uRGV0dW5lID09PSAnbnVtYmVyJyA/IG9wdGlvbnMudW5pc29uRGV0dW5lIDogMCApO1xuICAgICAgICB0aGlzLnVuaXNvblBoYXNlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMudW5pc29uUGhhc2UgPT09ICdudW1iZXInID8gb3B0aW9ucy51bmlzb25QaGFzZSA6IDAgKTtcbiAgICAgICAgdGhpcy51bmlzb25Nb2RlID0gb3B0aW9ucy51bmlzb25Nb2RlIHx8ICdjZW50ZXJlZCc7XG5cbiAgICAgICAgdGhpcy5nbGlkZU1vZGUgPSBvcHRpb25zLmdsaWRlTW9kZSB8fCAnZXF1YWwnO1xuICAgICAgICB0aGlzLmdsaWRlVGltZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHR5cGVvZiBvcHRpb25zLmdsaWRlVGltZSA9PT0gJ251bWJlcicgPyBvcHRpb25zLmdsaWRlVGltZSA6IDAgKTtcblxuICAgICAgICB0aGlzLnZlbG9jaXR5U2Vuc2l0aXZpdHkgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy52ZWxvY2l0eVNlbnNpdGl2aXR5ID09PSAnbnVtYmVyJyA/IG9wdGlvbnMudmVsb2NpdHlTZW5zaXRpdml0eSA6IDAgKTtcblxuICAgICAgICB0aGlzLnR1bmluZyA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHR5cGVvZiBvcHRpb25zLnR1bmluZyA9PT0gJ251bWJlcicgPyBvcHRpb25zLnR1bmluZyA6IDAgKTtcblxuICAgICAgICB0aGlzLndhdmVmb3JtID0gb3B0aW9ucy53YXZlZm9ybSB8fCAnc2luZSc7XG5cbiAgICAgICAgdGhpcy5lbnZlbG9wZSA9IG9wdGlvbnMuZW52ZWxvcGUgfHwgdGhpcy5pby5jcmVhdGVBU0RSRW52ZWxvcGUoKTtcblxuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHMgPSB7fTtcbiAgICAgICAgdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdCA9IFtdO1xuICAgICAgICB0aGlzLnRpbWVycyA9IFtdO1xuICAgIH1cblxuXG4gICAgX2NyZWF0ZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmVmb3JtICkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0b3IuY2FsbCggdGhpcy5pbywgZnJlcXVlbmN5LCBkZXR1bmUgKyB0aGlzLnR1bmluZy52YWx1ZSAqIDEwMCwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZWZvcm0gKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZXMgdGhlIGFtb3VudCBvZiBkZXR1bmUgKGNlbnRzKSB0byBhcHBseSB0byBhIGdlbmVyYXRvciBub2RlXG4gICAgICogZ2l2ZW4gYW4gaW5kZXggYmV0d2VlbiAwIGFuZCB0aGlzLnVuaXNvbi52YWx1ZVxuICAgICAqXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSB1bmlzb25JbmRleCBVbmlzb24gaW5kZXguXG4gICAgICogQHJldHVybiB7TnVtYmVyfSAgICAgICAgICAgICBEZXR1bmUgdmFsdWUsIGluIGNlbnRzLlxuICAgICAqL1xuICAgIF9jYWxjdWxhdGVEZXR1bmUoIHVuaXNvbkluZGV4ICkge1xuICAgICAgICB2YXIgZGV0dW5lID0gMC4wLFxuICAgICAgICAgICAgdW5pc29uRGV0dW5lID0gdGhpcy51bmlzb25EZXR1bmUudmFsdWU7XG5cbiAgICAgICAgaWYgKCB0aGlzLnVuaXNvbk1vZGUgPT09ICdjZW50ZXJlZCcgKSB7XG4gICAgICAgICAgICB2YXIgaW5jciA9IHVuaXNvbkRldHVuZTtcblxuICAgICAgICAgICAgZGV0dW5lID0gaW5jciAqIHVuaXNvbkluZGV4O1xuICAgICAgICAgICAgZGV0dW5lIC09IGluY3IgKiAoIHRoaXMudW5pc29uLnZhbHVlICogMC41ICk7XG4gICAgICAgICAgICBkZXR1bmUgKz0gaW5jciAqIDAuNTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBtdWx0aXBsaWVyO1xuXG4gICAgICAgICAgICAvLyBMZWF2ZSB0aGUgZmlyc3Qgbm90ZSBpbiB0aGUgdW5pc29uXG4gICAgICAgICAgICAvLyBhbG9uZSwgc28gaXQncyBkZXR1bmUgdmFsdWUgaXMgdGhlIHJvb3RcbiAgICAgICAgICAgIC8vIG5vdGUuXG4gICAgICAgICAgICBpZiAoIHVuaXNvbkluZGV4ID4gMCApIHtcbiAgICAgICAgICAgICAgICAvLyBIb3AgZG93biBuZWdhdGl2ZSBoYWxmIHRoZSB1bmlzb25JbmRleFxuICAgICAgICAgICAgICAgIGlmICggdW5pc29uSW5kZXggJSAyID09PSAwICkge1xuICAgICAgICAgICAgICAgICAgICBtdWx0aXBsaWVyID0gLXVuaXNvbkluZGV4ICogMC41O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSG9wIHVwIG4gY2VudHNcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB1bmlzb25JbmRleCA+IDEgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1bmlzb25JbmRleCA9IHRoaXMuTWF0aC5yb3VuZFRvTXVsdGlwbGUoIHVuaXNvbkluZGV4LCAyICkgLSAyO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGllciA9IHVuaXNvbkluZGV4O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgdGhlIG11bHRpcGxpZXIsIGNhbGN1bGF0ZSB0aGUgZGV0dW5lIHZhbHVlXG4gICAgICAgICAgICAgICAgLy8gZm9yIHRoZSBnaXZlbiB1bmlzb25JbmRleC5cbiAgICAgICAgICAgICAgICBkZXR1bmUgPSB1bmlzb25EZXR1bmUgKiBtdWx0aXBsaWVyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRldHVuZTtcbiAgICB9XG5cbiAgICBfY2FsY3VsYXRlR2xpZGVUaW1lKCBvbGRGcmVxLCBuZXdGcmVxICkge1xuICAgICAgICB2YXIgbW9kZSA9IHRoaXMuZ2xpZGVNb2RlLFxuICAgICAgICAgICAgdGltZSA9IHRoaXMuZ2xpZGVUaW1lLnZhbHVlLFxuICAgICAgICAgICAgZ2xpZGVUaW1lLFxuICAgICAgICAgICAgZnJlcURpZmZlcmVuY2U7XG5cbiAgICAgICAgaWYgKCB0aW1lID09PSAwLjAgKSB7XG4gICAgICAgICAgICBnbGlkZVRpbWUgPSAwLjA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG1vZGUgPT09ICdlcXVhbCcgKSB7XG4gICAgICAgICAgICBnbGlkZVRpbWUgPSB0aW1lICogMC4wMDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmcmVxRGlmZmVyZW5jZSA9IE1hdGguYWJzKCBvbGRGcmVxIC0gbmV3RnJlcSApO1xuICAgICAgICAgICAgZnJlcURpZmZlcmVuY2UgPSB0aGlzLk1hdGguY2xhbXAoIGZyZXFEaWZmZXJlbmNlLCAwLCA1MDAgKTtcbiAgICAgICAgICAgIGdsaWRlVGltZSA9IHRoaXMuTWF0aC5zY2FsZU51bWJlckV4cChcbiAgICAgICAgICAgICAgICBmcmVxRGlmZmVyZW5jZSxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDUwMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIHRpbWVcbiAgICAgICAgICAgICkgKiAwLjAwMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnbGlkZVRpbWU7XG4gICAgfVxuXG5cbiAgICBfc3RvcmVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZ2VuZXJhdG9yT2JqZWN0ICkge1xuICAgICAgICB2YXIgb2JqZWN0cyA9IHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0cztcblxuICAgICAgICBvYmplY3RzWyBmcmVxdWVuY3kgXSA9IG9iamVjdHNbIGZyZXF1ZW5jeSBdIHx8IFtdO1xuICAgICAgICBvYmplY3RzWyBmcmVxdWVuY3kgXS51bnNoaWZ0KCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICAgICAgdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC51bnNoaWZ0KCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICB9XG5cbiAgICBfZmV0Y2hHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSApIHtcbiAgICAgICAgdmFyIG9iamVjdHMgPSB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNbIGZyZXF1ZW5jeSBdLFxuICAgICAgICAgICAgaW5kZXggPSAwO1xuXG4gICAgICAgIGlmICggIW9iamVjdHMgfHwgb2JqZWN0cy5sZW5ndGggPT09IDAgKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQucG9wKCk7XG4gICAgICAgIHJldHVybiBvYmplY3RzLnBvcCgpO1xuICAgIH1cblxuICAgIF9mZXRjaEdlbmVyYXRvck9iamVjdFRvUmV1c2UoKSB7XG4gICAgICAgIHZhciBnZW5lcmF0b3IgPSB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0LnBvcCgpLFxuICAgICAgICAgICAgZnJlcXVlbmN5O1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCAncmV1c2UnLCBnZW5lcmF0b3IgKTtcblxuICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGdlbmVyYXRvciApICkge1xuICAgICAgICAgICAgZnJlcXVlbmN5ID0gZ2VuZXJhdG9yWyAwIF0uZnJlcXVlbmN5O1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBnZW5lcmF0b3IubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbnZlbG9wZS5mb3JjZVN0b3AoIGdlbmVyYXRvclsgaSBdLm91dHB1dHNbIDAgXS5nYWluICk7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KCBnZW5lcmF0b3JbIGkgXS50aW1lciApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZnJlcXVlbmN5ID0gZ2VuZXJhdG9yLmZyZXF1ZW5jeTtcbiAgICAgICAgICAgIHRoaXMuZW52ZWxvcGUuZm9yY2VTdG9wKCBnZW5lcmF0b3Iub3V0cHV0c1sgMCBdLmdhaW4gKTtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCggZ2VuZXJhdG9yLnRpbWVyICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNbIGZyZXF1ZW5jeSBdLnBvcCgpO1xuXG4gICAgICAgIHJldHVybiBnZW5lcmF0b3I7XG4gICAgfVxuXG5cbiAgICBfc3RhcnRHZW5lcmF0b3JPYmplY3QoIGdlbmVyYXRvck9iamVjdCwgZGVsYXkgKSB7XG4gICAgICAgIGdlbmVyYXRvck9iamVjdC5vdXRwdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5lbnZlbG9wZS5zdGFydCggZ2VuZXJhdG9yT2JqZWN0Lm91dHB1dHNbIDAgXS5nYWluLCBkZWxheSApO1xuICAgICAgICBnZW5lcmF0b3JPYmplY3Quc3RhcnQoIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgX3N0YXJ0U2luZ2xlKCBmcmVxdWVuY3ksIHZlbG9jaXR5LCBkZWxheSApIHtcbiAgICAgICAgdmFyIHVuaXNvbiA9IHRoaXMudW5pc29uLnZhbHVlLFxuICAgICAgICAgICAgZGV0dW5lID0gMC4wLFxuICAgICAgICAgICAgdW5pc29uR2VuZXJhdG9yQXJyYXksXG4gICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QsXG4gICAgICAgICAgICBhY3RpdmVHZW5lcmF0b3JDb3VudCA9IHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQubGVuZ3RoLFxuICAgICAgICAgICAgZXhpc3RpbmdGcmVxdWVuY3ksXG4gICAgICAgICAgICBnbGlkZVRpbWUgPSAwLjA7XG5cbiAgICAgICAgaWYgKCBhY3RpdmVHZW5lcmF0b3JDb3VudCA8IHRoaXMucG9seXBob255LnZhbHVlICkge1xuICAgICAgICAgICAgaWYgKCB1bmlzb24gPT09IDEuMCApIHtcbiAgICAgICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSB0aGlzLl9jcmVhdGVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB0aGlzLndhdmVmb3JtICk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRHZW5lcmF0b3JPYmplY3QoIGdlbmVyYXRvck9iamVjdCwgZGVsYXkgKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHVuaXNvbkdlbmVyYXRvckFycmF5ID0gW107XG5cbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB1bmlzb247ICsraSApIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0dW5lID0gdGhpcy5fY2FsY3VsYXRlRGV0dW5lKCBpICk7XG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2NyZWF0ZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHRoaXMud2F2ZWZvcm0gKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRHZW5lcmF0b3JPYmplY3QoIGdlbmVyYXRvck9iamVjdCwgZGVsYXkgKTtcbiAgICAgICAgICAgICAgICAgICAgdW5pc29uR2VuZXJhdG9yQXJyYXkucHVzaCggZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgdW5pc29uR2VuZXJhdG9yQXJyYXkgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCB1bmlzb24gPT09IDEuMCApIHtcbiAgICAgICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSB0aGlzLl9mZXRjaEdlbmVyYXRvck9iamVjdFRvUmV1c2UoKTtcbiAgICAgICAgICAgICAgICBleGlzdGluZ0ZyZXF1ZW5jeSA9IGdlbmVyYXRvck9iamVjdC5mcmVxdWVuY3k7XG4gICAgICAgICAgICAgICAgZ2xpZGVUaW1lID0gdGhpcy5fY2FsY3VsYXRlR2xpZGVUaW1lKCBleGlzdGluZ0ZyZXF1ZW5jeSwgZnJlcXVlbmN5ICk7XG5cbiAgICAgICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QucmVzZXQoIGZyZXF1ZW5jeSwgZGV0dW5lICsgdGhpcy50dW5pbmcudmFsdWUgKiAxMDAsIHZlbG9jaXR5LCBnbGlkZVRpbWUgKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2ZldGNoR2VuZXJhdG9yT2JqZWN0VG9SZXVzZSgpO1xuICAgICAgICAgICAgICAgIGV4aXN0aW5nRnJlcXVlbmN5ID0gZ2VuZXJhdG9yT2JqZWN0WyAwIF0uZnJlcXVlbmN5O1xuICAgICAgICAgICAgICAgIGdsaWRlVGltZSA9IHRoaXMuX2NhbGN1bGF0ZUdsaWRlVGltZSggZXhpc3RpbmdGcmVxdWVuY3ksIGZyZXF1ZW5jeSApO1xuXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdW5pc29uOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgICAgIGRldHVuZSA9IHRoaXMuX2NhbGN1bGF0ZURldHVuZSggaSApO1xuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0b3JPYmplY3RbIGkgXS5yZXNldCggZnJlcXVlbmN5LCBkZXR1bmUgKyB0aGlzLnR1bmluZy52YWx1ZSAqIDEwMCwgdmVsb2NpdHksIGdsaWRlVGltZSApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmV0dXJuIHRoZSBnZW5lcmF0ZWQgb2JqZWN0KHMpIGluIGNhc2UgdGhleSdyZSBuZWVkZWQuXG4gICAgICAgIHJldHVybiB1bmlzb25HZW5lcmF0b3JBcnJheSA/IHVuaXNvbkdlbmVyYXRvckFycmF5IDogZ2VuZXJhdG9yT2JqZWN0O1xuICAgIH1cblxuICAgIHN0YXJ0KCBmcmVxdWVuY3ksIHZlbG9jaXR5LCBkZWxheSApIHtcbiAgICAgICAgdmFyIGZyZXEgPSAwLFxuICAgICAgICAgICAgdmVsb2NpdHlTZW5zaXRpdml0eSA9IHRoaXMudmVsb2NpdHlTZW5zaXRpdml0eS52YWx1ZTtcblxuICAgICAgICB2ZWxvY2l0eSA9IHR5cGVvZiB2ZWxvY2l0eSA9PT0gJ251bWJlcicgPyB2ZWxvY2l0eSA6IDE7XG4gICAgICAgIGRlbGF5ID0gdHlwZW9mIGRlbGF5ID09PSAnbnVtYmVyJyA/IGRlbGF5IDogMDtcblxuXG4gICAgICAgIGlmICggdmVsb2NpdHlTZW5zaXRpdml0eSAhPT0gMCApIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gdGhpcy5NYXRoLnNjYWxlTnVtYmVyKCB2ZWxvY2l0eSwgMCwgMSwgMC41IC0gdmVsb2NpdHlTZW5zaXRpdml0eSAqIDAuNSwgMC41ICsgdmVsb2NpdHlTZW5zaXRpdml0eSAqIDAuNSApXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2ZWxvY2l0eSA9IDAuNTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgaWYgKCB0eXBlb2YgZnJlcXVlbmN5ID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0U2luZ2xlKCBmcmVxdWVuY3ksIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGVsc2UgaWYgKCBmcmVxdWVuY3kgaW5zdGFuY2VvZiBOb3RlICkge1xuICAgICAgICAvLyAgICAgZnJlcSA9IGZyZXF1ZW5jeS52YWx1ZUh6O1xuICAgICAgICAvLyAgICAgdGhpcy5fc3RhcnRTaW5nbGUoIGZyZXEsIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGVsc2UgaWYgKCBmcmVxdWVuY3kgaW5zdGFuY2VvZiBDaG9yZCApIHtcbiAgICAgICAgLy8gICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGZyZXF1ZW5jeS5ub3Rlcy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgLy8gICAgICAgICBmcmVxID0gZnJlcXVlbmN5Lm5vdGVzWyBpIF0udmFsdWVIejtcbiAgICAgICAgLy8gICAgICAgICB0aGlzLl9zdGFydFNpbmdsZSggZnJlcSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cblxuXG4gICAgX3N0b3BHZW5lcmF0b3JPYmplY3QoIGdlbmVyYXRvck9iamVjdCwgZGVsYXkgKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICB0aGlzLmVudmVsb3BlLnN0b3AoIGdlbmVyYXRvck9iamVjdC5vdXRwdXRzWyAwIF0uZ2FpbiwgZGVsYXkgKTtcblxuICAgICAgICBnZW5lcmF0b3JPYmplY3QudGltZXIgPSBzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIHNlbGYuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQucG9wKCk7XG4gICAgICAgICAgICBnZW5lcmF0b3JPYmplY3Quc3RvcCggZGVsYXkgKTtcbiAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdC5jbGVhblVwKCk7XG4gICAgICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSBudWxsO1xuICAgICAgICB9LCBkZWxheSAqIDEwMDAgKyB0aGlzLmVudmVsb3BlLnRvdGFsU3RvcFRpbWUgKiAxMDAwICsgMTAwICk7XG4gICAgfVxuXG4gICAgX3N0b3BTaW5nbGUoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICkge1xuICAgICAgICB2YXIgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fZmV0Y2hHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSApO1xuXG4gICAgICAgIGlmICggZ2VuZXJhdG9yT2JqZWN0ICkge1xuICAgICAgICAgICAgLy8gU3RvcCBnZW5lcmF0b3JzIGZvcm1lZCB3aGVuIHVuaXNvbiB3YXMgPiAxIGF0IHRpbWUgb2Ygc3RhcnQoLi4uKVxuICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBnZW5lcmF0b3JPYmplY3QgKSApIHtcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IGdlbmVyYXRvck9iamVjdC5sZW5ndGggLSAxOyBpID49IDA7IC0taSApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RvcEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0WyBpIF0sIGRlbGF5ICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBzdG9wKCBmcmVxdWVuY3ksIHZlbG9jaXR5LCBkZWxheSApIHtcbiAgICAgICAgdmVsb2NpdHkgPSB0eXBlb2YgdmVsb2NpdHkgPT09ICdudW1iZXInID8gdmVsb2NpdHkgOiAwO1xuICAgICAgICBkZWxheSA9IHR5cGVvZiBkZWxheSA9PT0gJ251bWJlcicgPyBkZWxheSA6IDA7XG5cbiAgICAgICAgaWYgKCB0eXBlb2YgZnJlcXVlbmN5ID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMuX3N0b3BTaW5nbGUoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZWxzZSBpZiAoIGZyZXF1ZW5jeSBpbnN0YW5jZW9mIE5vdGUgKSB7XG4gICAgICAgIC8vICAgICBmcmVxID0gZnJlcXVlbmN5LnZhbHVlSHo7XG4gICAgICAgIC8vICAgICB0aGlzLl9zdG9wU2luZ2xlKCBmcmVxLCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBlbHNlIGlmICggZnJlcXVlbmN5IGluc3RhbmNlb2YgQ2hvcmQgKSB7XG4gICAgICAgIC8vICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBmcmVxdWVuY3kubm90ZXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgIC8vICAgICAgICAgZnJlcSA9IGZyZXF1ZW5jeS5ub3Rlc1sgaSBdLnZhbHVlSHo7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5fc3RvcFNpbmdsZSggZnJlcSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cblxuLy8gQXVkaW9JTy5taXhpblNpbmdsZSggR2VuZXJhdG9yUGxheWVyLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuR2VuZXJhdG9yUGxheWVyLnByb3RvdHlwZS5NYXRoID0gbWF0aDtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlR2VuZXJhdG9yUGxheWVyID0gZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG4gICAgcmV0dXJuIG5ldyBHZW5lcmF0b3JQbGF5ZXIoIHRoaXMsIG9wdGlvbnMgKTtcbn07Iiwid2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcblxuaW1wb3J0IEF1ZGlvSU8gZnJvbSAnLi9jb3JlL0F1ZGlvSU8uZXM2JztcblxuaW1wb3J0IE5vZGUgZnJvbSAnLi9jb3JlL05vZGUuZXM2JztcbmltcG9ydCBQYXJhbSBmcm9tICcuL2NvcmUvUGFyYW0uZXM2JztcbmltcG9ydCAnLi9jb3JlL1dhdmVTaGFwZXIuZXM2JztcblxuXG4vLyBpbXBvcnQgJy4vZ3JhcGhzL0Nyb3NzZmFkZXIuZXM2JztcblxuaW1wb3J0ICcuL2Z4L0RlbGF5LmVzNic7XG5pbXBvcnQgJy4vZngvUGluZ1BvbmdEZWxheS5lczYnO1xuXG5pbXBvcnQgJy4vZ2VuZXJhdG9ycy9Pc2NpbGxhdG9yR2VuZXJhdG9yLmVzNic7XG5pbXBvcnQgJy4vaW5zdHJ1bWVudHMvR2VuZXJhdG9yUGxheWVyLmVzNic7XG5cblxuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L0RlZ1RvUmFkLmVzNic7XG5pbXBvcnQgJy4vbWF0aC90cmlnb25vbWV0cnkvU2luZS5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L0Nvcy5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L1Rhbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L1JhZFRvRGVnLmVzNic7XG5cblxuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUby5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUb1plcm8uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhblplcm8uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0lmRWxzZS5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvTGVzc1RoYW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuWmVyby5lczYnO1xuXG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9Mb2dpY2FsT3BlcmF0b3IuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL0FORC5lczYnO1xuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvT1IuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL05PVC5lczYnO1xuXG5pbXBvcnQgJy4vbWF0aC9BYnMuZXM2JztcbmltcG9ydCAnLi9tYXRoL0FkZC5lczYnO1xuaW1wb3J0ICcuL21hdGgvQXZlcmFnZS5lczYnO1xuaW1wb3J0ICcuL21hdGgvQXZlcmFnZTIuZXM2JztcbmltcG9ydCAnLi9tYXRoL0NsYW1wLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9Db25zdGFudC5lczYnO1xuaW1wb3J0ICcuL21hdGgvRGl2aWRlLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9GbG9vci5lczYnO1xuaW1wb3J0ICcuL21hdGgvTWF4LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9NaW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL011bHRpcGx5LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9OZWdhdGUuZXM2JztcbmltcG9ydCAnLi9tYXRoL1Bvdy5lczYnO1xuaW1wb3J0ICcuL21hdGgvUmVjaXByb2NhbC5lczYnO1xuaW1wb3J0ICcuL21hdGgvUm91bmQuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NjYWxlLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TY2FsZUV4cC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU2lnbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3FydC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3VidHJhY3QuZXM2JztcbmltcG9ydCAnLi9tYXRoL1N3aXRjaC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3F1YXJlLmVzNic7XG5cbmltcG9ydCAnLi9tYXRoL0xlcnAuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NhbXBsZURlbGF5LmVzNic7XG5cbmltcG9ydCAnLi9lbnZlbG9wZXMvQ3VzdG9tRW52ZWxvcGUuZXM2JztcbmltcG9ydCAnLi9lbnZlbG9wZXMvQVNEUkVudmVsb3BlLmVzNic7XG5cbmltcG9ydCAnLi9ncmFwaHMvRVFTaGVsZi5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9EaWZmdXNlRGVsYXkuZXM2JztcbmltcG9ydCAnLi9ncmFwaHMvT3NjaWxsYXRvckJhbmsuZXM2JztcbmltcG9ydCAnLi9ncmFwaHMvQ291bnRlci5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9EcnlXZXROb2RlLmVzNic7XG5pbXBvcnQgJy4vZ3JhcGhzL1BoYXNlT2Zmc2V0LmVzNic7XG5pbXBvcnQgJy4vZ3JhcGhzL0Nyb3NzZmFkZXIuZXM2JztcblxuaW1wb3J0ICcuL29zY2lsbGF0b3JzL05vaXNlT3NjaWxsYXRvci5lczYnO1xuXG4vLyBpbXBvcnQgJy4vZ3JhcGhzL1NrZXRjaC5lczYnO1xuXG53aW5kb3cuUGFyYW0gPSBQYXJhbTtcbndpbmRvdy5Ob2RlID0gTm9kZTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbmNsYXNzIEFicyBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCBhY2N1cmFjeSA9IDEwICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyB2YXIgZ2FpbkFjY3VyYWN5ID0gYWNjdXJhY3kgKiAxMDA7XG4gICAgICAgIHZhciBnYWluQWNjdXJhY3kgPSBNYXRoLnBvdyggYWNjdXJhY3ksIDIgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAxIC8gZ2FpbkFjY3VyYWN5O1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gZ2FpbkFjY3VyYWN5O1xuXG4gICAgICAgIHRoaXMuc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCBmdW5jdGlvbiggeCApIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmFicyggeCApO1xuICAgICAgICB9LCA4MTkyICogYWNjdXJhY3kgKTtcblxuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5zaGFwZXIgKTtcbiAgICAgICAgdGhpcy5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnNoYXBlci5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuc2hhcGVyID0gbnVsbDtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUFicyA9IGZ1bmN0aW9uKCBhY2N1cmFjeSApIHtcbiAgICByZXR1cm4gbmV3IEFicyggdGhpcywgYWNjdXJhY3kgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBBZGRzIHR3byBhdWRpbyBzaWduYWxzIHRvZ2V0aGVyLlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKlxuICogdmFyIGFkZCA9IGlvLmNyZWF0ZUFkZCggMiApO1xuICogaW4xLmNvbm5lY3QoIGFkZCApO1xuICpcbiAqIHZhciBhZGQgPSBpby5jcmVhdGVBZGQoKTtcbiAqIGluMS5jb25uZWN0KCBhZGQsIDAsIDAgKTtcbiAqIGluMi5jb25uZWN0KCBhZGQsIDAsIDEgKTtcbiAqL1xuY2xhc3MgQWRkIGV4dGVuZHMgTm9kZXtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5jb250cm9sID0gbnVsbDtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQWRkID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgQWRkKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbmNsYXNzIEF2ZXJhZ2UgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtU2FtcGxlcywgc2FtcGxlU2l6ZSA9IDEgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBvbmVTYW1wbGUgPSAoMSAvIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlKSAqIHNhbXBsZVNpemUsXG4gICAgICAgICAgICBub2RlID0gdGhpcy5pbnB1dHNbIDAgXTtcblxuICAgICAgICB0aGlzLnNhbXBsZVNpemUgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5zYW1wbGVTaXplID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLnNhbXBsZVNpemUuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnNhbXBsZVNpemUuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoIG51bVNhbXBsZXMsIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlICogMC41ICk7XG5cbiAgICAgICAgdGhpcy5zdW0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICAvLyB0aGlzLnN1bS5nYWluLnZhbHVlID0gMSAvIG51bVNhbXBsZXM7XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBudW1TYW1wbGVzOyArK2kgKSB7XG4gICAgICAgICAgICB2YXIgZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgICAgIGRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgICAgICB0aGlzLm11bHRpcGx5LmNvbm5lY3QoIGRlbGF5LmRlbGF5VGltZSApO1xuICAgICAgICAgICAgbm9kZS5jb25uZWN0KCBkZWxheSApO1xuICAgICAgICAgICAgZGVsYXkuY29ubmVjdCggdGhpcy5zdW0gKTtcbiAgICAgICAgICAgIG5vZGUgPSBkZWxheTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5zdW0uY29ubmVjdCggdGhpcy5kaXZpZGUgKTtcbiAgICAgICAgdGhpcy5kaXZpZGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuXG4gICAgICAgIC8vIHZhciBvbmVTYW1wbGUgPSAoMSAvIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlKTtcblxuICAgICAgICAvLyB0aGlzLmRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIC8vIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gb25lU2FtcGxlO1xuICAgICAgICAvLyB0aGlzLnN1bSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIC8vIHRoaXMuZGVjYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICAvLyB0aGlzLmRlY2F5LmdhaW4udmFsdWUgPSBzYW1wbGVTaXplO1xuICAgICAgICAvLyB0aGlzLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCBudW1TYW1wbGVzLCB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSAqIDAuNSApO1xuXG5cbiAgICAgICAgLy8gdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG4gICAgICAgIC8vIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5zdW0gKTtcbiAgICAgICAgLy8gdGhpcy5zdW0uY29ubmVjdCggdGhpcy5kaXZpZGUgKTtcbiAgICAgICAgLy8gdGhpcy5zdW0uY29ubmVjdCggdGhpcy5kZWNheSApO1xuICAgICAgICAvLyB0aGlzLmRlY2F5LmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcbiAgICAgICAgLy8gdGhpcy5kaXZpZGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnNoYXBlci5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuc2hhcGVyID0gbnVsbDtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUF2ZXJhZ2UgPSBmdW5jdGlvbiggbnVtU2FtcGxlcywgc2FtcGxlU2l6ZSApIHtcbiAgICByZXR1cm4gbmV3IEF2ZXJhZ2UoIHRoaXMsIG51bVNhbXBsZXMsIHNhbXBsZVNpemUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBBdmVyYWdlMiBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCBzYW1wbGVTaXplICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLnNhbXBsZVNpemUgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5zYW1wbGVTaXplID0gdGhpcy5pby5jcmVhdGVQYXJhbSggc2FtcGxlU2l6ZSApO1xuICAgICAgICB0aGlzLnNhbXBsZVNpemUuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnNhbXBsZVNpemUuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuZGl2aWRlID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggMC41ICk7XG4gICAgICAgIHRoaXMuc3VtID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICB2YXIgZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgdGhpcy5tdWx0aXBseS5jb25uZWN0KCBkZWxheS5kZWxheVRpbWUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBkZWxheSApO1xuICAgICAgICBkZWxheS5jb25uZWN0KCB0aGlzLnN1bSApO1xuXG4gICAgICAgIHZhciBkZWxheTIgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgZGVsYXkyLmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgIHRoaXMubXVsdGlwbHkuY29ubmVjdCggZGVsYXkyLmRlbGF5VGltZSApO1xuICAgICAgICBkZWxheS5jb25uZWN0KCBkZWxheTIgKTtcbiAgICAgICAgZGVsYXkyLmNvbm5lY3QoIHRoaXMuc3VtICk7XG5cbiAgICAgICAgdGhpcy5zdW0uY29ubmVjdCggdGhpcy5kaXZpZGUgKTtcbiAgICAgICAgdGhpcy5kaXZpZGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnNoYXBlci5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuc2hhcGVyID0gbnVsbDtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUF2ZXJhZ2UyID0gZnVuY3Rpb24oIHNhbXBsZVNpemUgKSB7XG4gICAgcmV0dXJuIG5ldyBBdmVyYWdlMiggdGhpcywgc2FtcGxlU2l6ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIFtDbGFtcCBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSB7W3R5cGVdfSBpbyAgICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0ge1t0eXBlXX0gbWluVmFsdWUgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtIHtbdHlwZV19IG1heFZhbHVlIFtkZXNjcmlwdGlvbl1cbiAqL1xuY2xhc3MgQ2xhbXAgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIG1pblZhbHVlLCBtYXhWYWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAwICk7IC8vIGlvLCAxLCAxXG5cbiAgICAgICAgdGhpcy5taW4gPSB0aGlzLmlvLmNyZWF0ZU1pbiggbWF4VmFsdWUgKTtcbiAgICAgICAgdGhpcy5tYXggPSB0aGlzLmlvLmNyZWF0ZU1heCggbWluVmFsdWUgKTtcblxuICAgICAgICB0aGlzLm1pbi5jb25uZWN0KCB0aGlzLm1heCApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gWyB0aGlzLm1pbiBdO1xuICAgICAgICB0aGlzLm91dHB1dHMgPSBbIHRoaXMubWF4IF07XG5cbiAgICAgICAgLy8gU3RvcmUgY29udHJvbGxhYmxlIHBhcmFtcy5cbiAgICAgICAgdGhpcy5jb250cm9scy5taW4gPSB0aGlzLm1pbi5jb250cm9scy52YWx1ZTtcbiAgICAgICAgdGhpcy5jb250cm9scy5tYXggPSB0aGlzLm1heC5jb250cm9scy52YWx1ZTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm1pbiA9IG51bGw7XG4gICAgICAgIHRoaXMubWF4ID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgbWluVmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IG1pblZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5taW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgbWF4VmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1heC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IG1heFZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5tYXgudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDbGFtcCA9IGZ1bmN0aW9uKCBtaW5WYWx1ZSwgbWF4VmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDbGFtcCggdGhpcywgbWluVmFsdWUsIG1heFZhbHVlICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gJy4uL2NvcmUvQXVkaW9JTy5lczYnO1xuaW1wb3J0IE5vZGUgZnJvbSAnLi4vY29yZS9Ob2RlLmVzNic7XG5cbmNsYXNzIENvbnN0YW50IGV4dGVuZHMgTm9kZSB7XG4gICAgLyoqXG4gICAgICogQSBjb25zdGFudC1yYXRlIGF1ZGlvIHNpZ25hbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyAgICBJbnN0YW5jZSBvZiBBdWRpb0lPXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIFZhbHVlIG9mIHRoZSBjb25zdGFudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgPSAwLjAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInID8gdmFsdWUgOiAwO1xuICAgICAgICB0aGlzLmlvLmNvbnN0YW50RHJpdmVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnQgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBDb25zdGFudCggdGhpcywgdmFsdWUgKTtcbn07XG5cblxuLy8gQSBidW5jaCBvZiBwcmVzZXQgY29uc3RhbnRzLlxuKGZ1bmN0aW9uKCkge1xuICAgIHZhciBFLFxuICAgICAgICBQSSxcbiAgICAgICAgUEkyLFxuICAgICAgICBMTjEwLFxuICAgICAgICBMTjIsXG4gICAgICAgIExPRzEwRSxcbiAgICAgICAgTE9HMkUsXG4gICAgICAgIFNRUlQxXzIsXG4gICAgICAgIFNRUlQyO1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRFID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gRSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkUgKTtcbiAgICAgICAgRSA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudFBJID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gUEkgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5QSSApO1xuICAgICAgICBQSSA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudFBJMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFBJMiB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLlBJICogMiApO1xuICAgICAgICBQSTIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRMTjEwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gTE4xMCB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxOMTAgKTtcbiAgICAgICAgTE4xMCA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudExOMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IExOMiB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxOMiApO1xuICAgICAgICBMTjIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRMT0cxMEUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBMT0cxMEUgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5MT0cxMEUgKTtcbiAgICAgICAgTE9HMTBFID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50TE9HMkUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBMT0cyRSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxPRzJFICk7XG4gICAgICAgIExPRzJFID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50U1FSVDFfMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFNRUlQxXzIgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5TUVJUMV8yICk7XG4gICAgICAgIFNRUlQxXzIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRTUVJUMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IFNRUlQyIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguU1FSVDIgKTtcbiAgICAgICAgU1FSVDIgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xufSgpKTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIERpdmlkZXMgdHdvIG51bWJlcnNcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBEaXZpZGUgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlLCBtYXhJbnB1dCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgdGhpcy5fdmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdLnZhbHVlO1xuXG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSAwLjA7XG5cbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsID0gdGhpcy5pby5jcmVhdGVSZWNpcHJvY2FsKCBtYXhJbnB1dCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIHRoaXMucmVjaXByb2NhbCApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRpdmlzb3IgPSB0aGlzLmlucHV0c1sgMSBdO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucmVjaXByb2NhbC5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMucmVjaXByb2NhbCA9IG51bGw7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcblxuICAgICAgICAgICAgLy8gaWYoIHRoaXMuaW5wdXRzWyAwIF0gaW5zdGFuY2VvZiBDb25zdGFudCApIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyAxIF0udmFsdWUgPSB0aGlzLl92YWx1ZTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBtYXhJbnB1dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVjaXByb2NhbC5tYXhJbnB1dDtcbiAgICB9XG4gICAgc2V0IG1heElucHV0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsLm1heElucHV0ID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEaXZpZGUgPSBmdW5jdGlvbiggdmFsdWUsIG1heElucHV0ICkge1xuICAgIHJldHVybiBuZXcgRGl2aWRlKCB0aGlzLCB2YWx1ZSwgbWF4SW5wdXQgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG4vLyBOT1RFOlxuLy8gIE9ubHkgYWNjZXB0cyB2YWx1ZXMgPj0gLTEgJiYgPD0gMS4gVmFsdWVzIG91dHNpZGVcbi8vICB0aGlzIHJhbmdlIGFyZSBjbGFtcGVkIHRvIHRoaXMgcmFuZ2UuXG5jbGFzcyBGbG9vciBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkZsb29yICk7XG5cbiAgICAgICAgLy8gVGhpcyBicmFuY2hpbmcgaXMgYmVjYXVzZSBpbnB1dHRpbmcgYDBgIHZhbHVlc1xuICAgICAgICAvLyBpbnRvIHRoZSB3YXZlc2hhcGVyIGFib3ZlIG91dHB1dHMgLTAuNSA7KFxuICAgICAgICB0aGlzLmlmRWxzZSA9IHRoaXMuaW8uY3JlYXRlSWZFbHNlKCk7XG4gICAgICAgIHRoaXMuZXF1YWxUb1plcm8gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG9aZXJvKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmVxdWFsVG9aZXJvICk7XG4gICAgICAgIHRoaXMuZXF1YWxUb1plcm8uY29ubmVjdCggdGhpcy5pZkVsc2UuaWYgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmlmRWxzZS50aGVuICk7XG4gICAgICAgIHRoaXMuc2hhcGVyLmNvbm5lY3QoIHRoaXMuaWZFbHNlLmVsc2UgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc2hhcGVyICk7XG4gICAgICAgIHRoaXMuaWZFbHNlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnNoYXBlci5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuaWZFbHNlLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5lcXVhbFRvWmVyby5jbGVhblVwKCk7XG5cbiAgICAgICAgdGhpcy5zaGFwZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmlmRWxzZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZXF1YWxUb1plcm8gPSBudWxsO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRmxvb3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEZsb29yKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIExlcnAgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAzLCAxICk7XG5cbiAgICAgICAgdGhpcy5hZGQgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICB0aGlzLnN1YnRyYWN0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIHRoaXMuc3RhcnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuZW5kID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuICAgICAgICB0aGlzLmRlbHRhID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIHRoaXMuZW5kLmNvbm5lY3QoIHRoaXMuc3VidHJhY3QsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5zdGFydC5jb25uZWN0KCB0aGlzLnN1YnRyYWN0LCAwLCAxICk7XG4gICAgICAgIHRoaXMuc3VidHJhY3QuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmRlbHRhLmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICB0aGlzLnN0YXJ0LmNvbm5lY3QoIHRoaXMuYWRkLCAwLCAwICk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkuY29ubmVjdCggdGhpcy5hZGQsIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmFkZC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5zdGFydCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIHRoaXMuZW5kICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAyIF0uY29ubmVjdCggdGhpcy5kZWx0YSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuc3RhcnQgPSB0aGlzLnN0YXJ0O1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmVuZCA9IHRoaXMuZW5kO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmRlbHRhID0gdGhpcy5kZWx0YTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIC8vIFRPRE8uLiFcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxlcnAgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IExlcnAoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBXaGVuIGlucHV0IGlzIDwgYHZhbHVlYCwgb3V0cHV0cyBgdmFsdWVgLCBvdGhlcndpc2Ugb3V0cHV0cyBpbnB1dC5cbiAqIEBwYXJhbSB7QXVkaW9JT30gaW8gICBBdWRpb0lPIGluc3RhbmNlXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgVGhlIG1pbmltdW0gdmFsdWUgdG8gdGVzdCBhZ2FpbnN0LlxuICovXG5cbmNsYXNzIE1heCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuZ3JlYXRlclRoYW4gPSB0aGlzLmlvLmNyZWF0ZUdyZWF0ZXJUaGFuKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCB0aGlzLmdyZWF0ZXJUaGFuICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5ncmVhdGVyVGhhbi5jb250cm9scy52YWx1ZSApO1xuXG4gICAgICAgIHRoaXMuc3dpdGNoID0gdGhpcy5pby5jcmVhdGVTd2l0Y2goIDIsIDAgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc3dpdGNoLmlucHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggdGhpcy5zd2l0Y2guaW5wdXRzWyAxIF0gKTtcbiAgICAgICAgdGhpcy5ncmVhdGVyVGhhbi5jb25uZWN0KCB0aGlzLnN3aXRjaC5jb250cm9sICk7XG4gICAgICAgIHRoaXMuc3dpdGNoLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5ncmVhdGVyVGhhbi5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuc3dpdGNoLmNsZWFuVXAoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gbnVsbDtcbiAgICAgICAgdGhpcy5ncmVhdGVyVGhhbiA9IG51bGw7XG4gICAgICAgIHRoaXMuc3dpdGNoID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVNYXggPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBNYXgoIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogV2hlbiBpbnB1dCBpcyA+IGB2YWx1ZWAsIG91dHB1dHMgYHZhbHVlYCwgb3RoZXJ3aXNlIG91dHB1dHMgaW5wdXQuXG4gKiBAcGFyYW0ge0F1ZGlvSU99IGlvICAgQXVkaW9JTyBpbnN0YW5jZVxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIFRoZSBtaW5pbXVtIHZhbHVlIHRvIHRlc3QgYWdhaW5zdC5cbiAqL1xuY2xhc3MgTWluIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cblxuICAgICAgICB0aGlzLmxlc3NUaGFuID0gdGhpcy5pby5jcmVhdGVMZXNzVGhhbigpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggdGhpcy5sZXNzVGhhbiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMubGVzc1RoYW4uY29udHJvbHMudmFsdWUgKTtcblxuICAgICAgICB0aGlzLnN3aXRjaCA9IHRoaXMuaW8uY3JlYXRlU3dpdGNoKCAyLCAwICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnN3aXRjaC5pbnB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIHRoaXMuc3dpdGNoLmlucHV0c1sgMSBdICk7XG4gICAgICAgIHRoaXMubGVzc1RoYW4uY29ubmVjdCggdGhpcy5zd2l0Y2guY29udHJvbCApO1xuICAgICAgICB0aGlzLnN3aXRjaC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5sZXNzVGhhbi5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuc3dpdGNoLmNsZWFuVXAoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gbnVsbDtcbiAgICAgICAgdGhpcy5sZXNzVGhhbiA9IG51bGw7XG4gICAgICAgIHRoaXMuc3dpdGNoID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU1pbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IE1pbiggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byBhdWRpbyBzaWduYWxzIHRvZ2V0aGVyLlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKi9cbmNsYXNzIE11bHRpcGx5IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSAwLjA7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDEgXTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmNvbnRyb2wgPSBudWxsO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG5cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTXVsdGlwbHkgPSBmdW5jdGlvbiggdmFsdWUxLCB2YWx1ZTIgKSB7XG4gICAgcmV0dXJuIG5ldyBNdWx0aXBseSggdGhpcywgdmFsdWUxLCB2YWx1ZTIgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBOZWdhdGVzIHRoZSBpbmNvbWluZyBhdWRpbyBzaWduYWwuXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgTmVnYXRlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDAgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAtMTtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gdGhpcy5pbnB1dHM7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5lZ2F0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTmVnYXRlKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKlxuICogTm90ZTogRE9FUyBOT1QgSEFORExFIE5FR0FUSVZFIFBPV0VSUy5cbiAqL1xuY2xhc3MgUG93IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5tdWx0aXBsaWVycyA9IFtdO1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgbm9kZSA9IHRoaXMuaW5wdXRzWyAwIF07IGkgPCB2YWx1ZSAtIDE7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMubXVsdGlwbGllcnNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5tdWx0aXBsaWVyc1sgaSBdLmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgICAgICBub2RlLmNvbm5lY3QoIHRoaXMubXVsdGlwbGllcnNbIGkgXSApO1xuICAgICAgICAgICAgbm9kZSA9IHRoaXMubXVsdGlwbGllcnNbIGkgXTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSB0aGlzLm11bHRpcGxpZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgICAgdGhpcy5tdWx0aXBsaWVyc1sgaSBdLmNsZWFuVXAoKTtcbiAgICAgICAgICAgIHRoaXMubXVsdGlwbGllcnNbIGkgXSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm11bHRpcGxpZXJzID0gbnVsbDtcblxuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIGZvciAoIHZhciBpID0gdGhpcy5tdWx0aXBsaWVycy5sZW5ndGggLSAxOyBpID49IDA7IC0taSApIHtcbiAgICAgICAgICAgIHRoaXMubXVsdGlwbGllcnNbIGkgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICB0aGlzLm11bHRpcGxpZXJzLnNwbGljZSggaSwgMSApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5kaXNjb25uZWN0KCk7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBub2RlID0gdGhpcy5pbnB1dHNbIDAgXTsgaSA8IHZhbHVlIC0gMTsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5tdWx0aXBsaWVyc1sgaSBdID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm11bHRpcGxpZXJzWyBpIF0uY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdCggdGhpcy5tdWx0aXBsaWVyc1sgaSBdICk7XG4gICAgICAgICAgICBub2RlID0gdGhpcy5tdWx0aXBsaWVyc1sgaSBdO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVQb3cgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBQb3coIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogT3V0cHV0cyB0aGUgdmFsdWUgb2YgMSAvIGlucHV0VmFsdWUgKG9yIHBvdyhpbnB1dFZhbHVlLCAtMSkpXG4gKiBXaWxsIGJlIHVzZWZ1bCBmb3IgZG9pbmcgbXVsdGlwbGljYXRpdmUgZGl2aXNpb24uXG4gKlxuICogVE9ETzpcbiAqICAgICAtIFRoZSB3YXZlc2hhcGVyIGlzbid0IGFjY3VyYXRlLiBJdCBwdW1wcyBvdXQgdmFsdWVzIGRpZmZlcmluZ1xuICogICAgICAgYnkgMS43OTA2NzkzMTQwMzAxNTI1ZS05IG9yIG1vcmUuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKi9cbmNsYXNzIFJlY2lwcm9jYWwgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIG1heElucHV0ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgZmFjdG9yID0gbWF4SW5wdXQgfHwgMTAwLFxuICAgICAgICAgICAgZ2FpbiA9IE1hdGgucG93KCBmYWN0b3IsIC0xICk7XG5cbiAgICAgICAgdGhpcy5fbWF4SW5wdXQgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLl9tYXhJbnB1dC5nYWluLnNldFZhbHVlQXRUaW1lKCBnYWluLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcblxuICAgICAgICAvLyB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnNldFZhbHVlQXRUaW1lKCAwLjAsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuXG4gICAgICAgIHRoaXMuc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5SZWNpcHJvY2FsICk7XG5cbiAgICAgICAgLy8gdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnNldFZhbHVlQXRUaW1lKCAwLjAsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuXG4gICAgICAgIHRoaXMuaW8uY29uc3RhbnREcml2ZXIuY29ubmVjdCggdGhpcy5fbWF4SW5wdXQgKTtcbiAgICAgICAgdGhpcy5fbWF4SW5wdXQuY29ubmVjdCggdGhpcy5pbnB1dHNbIDAgXS5nYWluICk7XG4gICAgICAgIHRoaXMuX21heElucHV0LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4gKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc2hhcGVyICk7XG4gICAgICAgIHRoaXMuc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zaGFwZXIuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLl9tYXhJbnB1dC5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuc2hhcGVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbWF4SW5wdXQgPSBudWxsO1xuICAgIH1cblxuICAgIGdldCBtYXhJbnB1dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21heElucHV0LmdhaW47XG4gICAgfVxuICAgIHNldCBtYXhJbnB1dCggdmFsdWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMuX21heElucHV0LmdhaW4uY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICAgICAgICAgIHRoaXMuX21heElucHV0LmdhaW4uc2V0VmFsdWVBdFRpbWUoIDEgLyB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVJlY2lwcm9jYWwgPSBmdW5jdGlvbiggbWF4SW5wdXQgKSB7XG4gICAgcmV0dXJuIG5ldyBSZWNpcHJvY2FsKCB0aGlzLCBtYXhJbnB1dCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBOT1RFOlxuLy8gIE9ubHkgYWNjZXB0cyB2YWx1ZXMgPj0gLTEgJiYgPD0gMS4gVmFsdWVzIG91dHNpZGVcbi8vICB0aGlzIHJhbmdlIGFyZSBjbGFtcGVkIHRvIHRoaXMgcmFuZ2UuXG5jbGFzcyBSb3VuZCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gdGhpcy5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLlJvdW5kICk7XG5cbiAgICAgICAgLy8gVGhpcyBicmFuY2hpbmcgaXMgYmVjYXVzZSBpbnB1dHRpbmcgYDBgIHZhbHVlc1xuICAgICAgICAvLyBpbnRvIHRoZSB3YXZlc2hhcGVyIGFib3ZlIG91dHB1dHMgLTAuNSA7KFxuICAgICAgICAvLyB0aGlzLmlmRWxzZSA9IHRoaXMuaW8uY3JlYXRlSWZFbHNlKCk7XG4gICAgICAgIC8vIHRoaXMuZXF1YWxUb1plcm8gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG9aZXJvKCk7XG5cbiAgICAgICAgLy8gdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmVxdWFsVG9aZXJvICk7XG4gICAgICAgIC8vIHRoaXMuZXF1YWxUb1plcm8uY29ubmVjdCggdGhpcy5pZkVsc2UuaWYgKTtcbiAgICAgICAgLy8gdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmlmRWxzZS50aGVuICk7XG4gICAgICAgIC8vIHRoaXMuc2hhcGVyLmNvbm5lY3QoIHRoaXMuaWZFbHNlLmVsc2UgKTtcbiAgICAgICAgLy8gdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnNoYXBlciApO1xuICAgICAgICAvLyB0aGlzLmlmRWxzZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuZmxvb3IgPSB0aGlzLmlvLmNyZWF0ZUZsb29yKCk7XG4gICAgICAgIHRoaXMuYWRkID0gdGhpcy5pby5jcmVhdGVBZGQoIDAuNSApO1xuICAgICAgICB0aGlzLmlucHV0c1swXS5jb25uZWN0KCB0aGlzLmFkZCApO1xuICAgICAgICB0aGlzLmFkZC5jb25uZWN0KCB0aGlzLmZsb29yICk7XG4gICAgICAgIHRoaXMuZmxvb3IuY29ubmVjdCggdGhpcy5vdXRwdXRzWzBdICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLmZsb29yLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5hZGQuY2xlYW5VcCgpO1xuXG4gICAgICAgIHRoaXMuZmxvb3IgPSBudWxsO1xuICAgICAgICB0aGlzLmFkZCA9IG51bGw7XG5cbiAgICAgICAgLy8gdGhpcy5pZkVsc2UuY2xlYW5VcCgpO1xuICAgICAgICAvLyB0aGlzLmVxdWFsVG9aZXJvLmNsZWFuVXAoKTtcbiAgICAgICAgLy8gdGhpcy5zaGFwZXIuY2xlYW5VcCgpO1xuXG4gICAgICAgIC8vIHRoaXMuaWZFbHNlID0gbnVsbDtcbiAgICAgICAgLy8gdGhpcy5lcXVhbFRvWmVybyA9IG51bGw7XG4gICAgICAgIC8vIHRoaXMuc2hhcGVyID0gbnVsbDtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVJvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSb3VuZCggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbmNsYXNzIFNhbXBsZURlbGF5IGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIG51bVNhbXBsZXMgPSAxICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLnNhbXBsZVNpemUgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAxIC8gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5zYW1wbGVzID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbnVtU2FtcGxlcyApO1xuXG4gICAgICAgIHRoaXMuc2FtcGxlU2l6ZS5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuc2FtcGxlcy5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICB0aGlzLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgIHRoaXMubXVsdGlwbHkuY29ubmVjdCggdGhpcy5kZWxheS5kZWxheVRpbWUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmRlbGF5LmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5kZWxheSA9IG51bGw7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTYW1wbGVEZWxheSA9IGZ1bmN0aW9uKCBudW1TYW1wbGVzICkge1xuICAgIHJldHVybiBuZXcgU2FtcGxlRGVsYXkoIHRoaXMsIG51bVNhbXBsZXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gR2l2ZW4gYW4gaW5wdXQgdmFsdWUgYW5kIGl0cyBoaWdoIGFuZCBsb3cgYm91bmRzLCBzY2FsZVxuLy8gdGhhdCB2YWx1ZSB0byBuZXcgaGlnaCBhbmQgbG93IGJvdW5kcy5cbi8vXG4vLyBGb3JtdWxhIGZyb20gTWF4TVNQJ3MgU2NhbGUgb2JqZWN0OlxuLy8gIGh0dHA6Ly93d3cuY3ljbGluZzc0LmNvbS9mb3J1bXMvdG9waWMucGhwP2lkPTI2NTkzXG4vL1xuLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSkgKiAoaGlnaE91dC1sb3dPdXQpICsgbG93T3V0O1xuXG5cbi8vIFRPRE86XG4vLyAgLSBBZGQgY29udHJvbHMhXG5jbGFzcyBTY2FsZSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICBsb3dJbiA9IHR5cGVvZiBsb3dJbiA9PT0gJ251bWJlcicgPyBsb3dJbiA6IDA7XG4gICAgICAgIGhpZ2hJbiA9IHR5cGVvZiBoaWdoSW4gPT09ICdudW1iZXInID8gaGlnaEluIDogMTtcbiAgICAgICAgbG93T3V0ID0gdHlwZW9mIGxvd091dCA9PT0gJ251bWJlcicgPyBsb3dPdXQgOiAwO1xuICAgICAgICBoaWdoT3V0ID0gdHlwZW9mIGhpZ2hPdXQgPT09ICdudW1iZXInID8gaGlnaE91dCA6IDEwO1xuXG4gICAgICAgIHRoaXMuX2xvd0luID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93SW4gKTtcbiAgICAgICAgdGhpcy5faGlnaEluID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaEluICk7XG4gICAgICAgIHRoaXMuX2xvd091dCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd091dCApO1xuICAgICAgICB0aGlzLl9oaWdoT3V0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaE91dCApO1xuXG4gICAgICAgIC8vIHRoaXMuaW5wdXRzID0gWyB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpIF07XG5cbiAgICAgICAgLy8gKGlucHV0LWxvd0luKVxuICAgICAgICB0aGlzLmlucHV0TWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmlucHV0TWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLl9sb3dJbi5jb25uZWN0KCB0aGlzLmlucHV0TWludXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vIChoaWdoSW4tbG93SW4pXG4gICAgICAgIHRoaXMuaGlnaEluTWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5faGlnaEluLmNvbm5lY3QoIHRoaXMuaGlnaEluTWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLl9sb3dJbi5jb25uZWN0KCB0aGlzLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoKGlucHV0LWxvd0luKSAvIChoaWdoSW4tbG93SW4pKVxuICAgICAgICB0aGlzLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCk7XG4gICAgICAgIHRoaXMuaW5wdXRNaW51c0xvd0luLmNvbm5lY3QoIHRoaXMuZGl2aWRlLCAwLCAwICk7XG4gICAgICAgIHRoaXMuaGlnaEluTWludXNMb3dJbi5jb25uZWN0KCB0aGlzLmRpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIC8vIChoaWdoT3V0LWxvd091dClcbiAgICAgICAgdGhpcy5oaWdoT3V0TWludXNMb3dPdXQgPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuX2hpZ2hPdXQuY29ubmVjdCggdGhpcy5oaWdoT3V0TWludXNMb3dPdXQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5fbG93T3V0LmNvbm5lY3QoIHRoaXMuaGlnaE91dE1pbnVzTG93T3V0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSkgKiAoaGlnaE91dC1sb3dPdXQpXG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5oaWdoT3V0TWludXNMb3dPdXQuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIC8vICgoaW5wdXQtbG93SW4pIC8gKGhpZ2hJbi1sb3dJbikpICogKGhpZ2hPdXQtbG93T3V0KSArIGxvd091dFxuICAgICAgICB0aGlzLmFkZCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkuY29ubmVjdCggdGhpcy5hZGQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5fbG93T3V0LmNvbm5lY3QoIHRoaXMuYWRkLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5hZGQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuX2xvd0luLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5faGlnaEluLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5fbG93T3V0LmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5faGlnaE91dC5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuaW5wdXRNaW51c0xvd0luLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5oaWdoSW5NaW51c0xvd0luLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5kaXZpZGUuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmhpZ2hPdXRNaW51c0xvd091dC5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkuY2xlYW5VcCgpO1xuXG4gICAgICAgIHRoaXMuX2xvd0luID0gbnVsbDtcbiAgICAgICAgdGhpcy5faGlnaEluID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbG93T3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5faGlnaE91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuaW5wdXRNaW51c0xvd0luID0gbnVsbDtcbiAgICAgICAgdGhpcy5oaWdoSW5NaW51c0xvd0luID0gbnVsbDtcbiAgICAgICAgdGhpcy5kaXZpZGUgPSBudWxsO1xuICAgICAgICB0aGlzLmhpZ2hPdXRNaW51c0xvd091dCA9IG51bGw7XG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSBudWxsO1xuICAgICAgICB0aGlzLmFkZCA9IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IGxvd0luKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG93SW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBsb3dJbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuX2xvd0luLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG5cbiAgICBnZXQgaGlnaEluKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faGlnaEluLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgaGlnaEluKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5faGlnaEluLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGxvd091dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvd091dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd091dCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuX2xvd091dC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuXG5cbiAgICBnZXQgaGlnaE91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hpZ2hPdXQudmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoT3V0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5faGlnaE91dC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTY2FsZSA9IGZ1bmN0aW9uKCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG4gICAgcmV0dXJuIG5ldyBTY2FsZSggdGhpcywgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIEdpdmVuIGFuIGlucHV0IHZhbHVlIGFuZCBpdHMgaGlnaCBhbmQgbG93IGJvdW5kcywgc2NhbGVcbi8vIHRoYXQgdmFsdWUgdG8gbmV3IGhpZ2ggYW5kIGxvdyBib3VuZHMuXG4vL1xuLy8gRm9ybXVsYSBmcm9tIE1heE1TUCdzIFNjYWxlIG9iamVjdDpcbi8vICBodHRwOi8vd3d3LmN5Y2xpbmc3NC5jb20vZm9ydW1zL3RvcGljLnBocD9pZD0yNjU5M1xuLy9cbi8vIGlmKCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID09PSAwICkge1xuLy8gICAgIHJldHVybiBsb3dPdXQ7XG4vLyB9XG4vLyBlbHNlIGlmKCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID4gMCApIHtcbi8vICAgICByZXR1cm4gbG93T3V0ICsgKGhpZ2hPdXQgLSBsb3dPdXQpICogTWF0aC5wb3coIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cCk7XG4vLyB9XG4vLyBlbHNlIHtcbi8vICAgICByZXR1cm4gbG93T3V0ICsgKGhpZ2hPdXQgLSBsb3dPdXQpICogLShNYXRoLnBvdyggKC1pbnB1dCArIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cCkpO1xuLy8gfVxuXG4vLyBUT0RPOlxuLy8gIC0gQWRkIGNvbnRyb2xzXG5jbGFzcyBTY2FsZUV4cCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHBvbmVudCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgbG93SW4gPSB0eXBlb2YgbG93SW4gPT09ICdudW1iZXInID8gbG93SW4gOiAwO1xuICAgICAgICBoaWdoSW4gPSB0eXBlb2YgaGlnaEluID09PSAnbnVtYmVyJyA/IGhpZ2hJbiA6IDE7XG4gICAgICAgIGxvd091dCA9IHR5cGVvZiBsb3dPdXQgPT09ICdudW1iZXInID8gbG93T3V0IDogMDtcbiAgICAgICAgaGlnaE91dCA9IHR5cGVvZiBoaWdoT3V0ID09PSAnbnVtYmVyJyA/IGhpZ2hPdXQgOiAxMDtcbiAgICAgICAgZXhwb25lbnQgPSB0eXBlb2YgZXhwb25lbnQgPT09ICdudW1iZXInID8gZXhwb25lbnQgOiAxO1xuXG4gICAgICAgIHRoaXMuX2xvd0luID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93SW4gKTtcbiAgICAgICAgdGhpcy5faGlnaEluID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaEluICk7XG4gICAgICAgIHRoaXMuX2xvd091dCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd091dCApO1xuICAgICAgICB0aGlzLl9oaWdoT3V0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggaGlnaE91dCApO1xuICAgICAgICB0aGlzLl9leHBvbmVudCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGV4cG9uZW50ICk7XG5cblxuICAgICAgICAvLyAoaW5wdXQgLSBsb3dJbilcbiAgICAgICAgdGhpcy5pbnB1dE1pbnVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5pbnB1dE1pbnVzTG93SW4sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5fbG93SW4uY29ubmVjdCggdGhpcy5pbnB1dE1pbnVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoLWlucHV0ICsgbG93SW4pXG4gICAgICAgIHRoaXMubWludXNJbnB1dCA9IHRoaXMuaW8uY3JlYXRlTmVnYXRlKCk7XG4gICAgICAgIHRoaXMubWludXNJbnB1dFBsdXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5taW51c0lucHV0ICk7XG4gICAgICAgIHRoaXMubWludXNJbnB1dC5jb25uZWN0KCB0aGlzLm1pbnVzSW5wdXRQbHVzTG93SW4sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5fbG93SW4uY29ubmVjdCggdGhpcy5taW51c0lucHV0UGx1c0xvd0luLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hJbiAtIGxvd0luKVxuICAgICAgICB0aGlzLmhpZ2hJbk1pbnVzTG93SW4gPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuX2hpZ2hJbi5jb25uZWN0KCB0aGlzLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5fbG93SW4uY29ubmVjdCggdGhpcy5oaWdoSW5NaW51c0xvd0luLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikpXG4gICAgICAgIHRoaXMuZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgdGhpcy5pbnB1dE1pbnVzTG93SW4uY29ubmVjdCggdGhpcy5kaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5oaWdoSW5NaW51c0xvd0luLmNvbm5lY3QoIHRoaXMuZGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKC1pbnB1dCArIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbilcbiAgICAgICAgdGhpcy5uZWdhdGl2ZURpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCk7XG4gICAgICAgIHRoaXMubWludXNJbnB1dFBsdXNMb3dJbi5jb25uZWN0KCB0aGlzLm5lZ2F0aXZlRGl2aWRlLCAwLCAwICk7XG4gICAgICAgIHRoaXMuaGlnaEluTWludXNMb3dJbi5jb25uZWN0KCB0aGlzLm5lZ2F0aXZlRGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hPdXQgLSBsb3dPdXQpXG4gICAgICAgIHRoaXMuaGlnaE91dE1pbnVzTG93T3V0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLl9oaWdoT3V0LmNvbm5lY3QoIHRoaXMuaGlnaE91dE1pbnVzTG93T3V0LCAwLCAwICk7XG4gICAgICAgIHRoaXMuX2xvd091dC5jb25uZWN0KCB0aGlzLmhpZ2hPdXRNaW51c0xvd091dCwgMCwgMSApO1xuXG4gICAgICAgIC8vIE1hdGgucG93KCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApXG4gICAgICAgIHRoaXMucG93ID0gdGhpcy5pby5jcmVhdGVQb3coIGV4cG9uZW50ICk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNvbm5lY3QoIHRoaXMucG93ICk7XG5cbiAgICAgICAgLy8gLShNYXRoLnBvdyggKC1pbnB1dCArIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cCkpXG4gICAgICAgIHRoaXMubmVnYXRpdmVQb3dOZWdhdGUgPSB0aGlzLmlvLmNyZWF0ZU5lZ2F0ZSgpO1xuICAgICAgICB0aGlzLm5lZ2F0aXZlUG93ID0gdGhpcy5pby5jcmVhdGVQb3coIGV4cG9uZW50ICk7XG4gICAgICAgIHRoaXMubmVnYXRpdmVEaXZpZGUuY29ubmVjdCggdGhpcy5uZWdhdGl2ZVBvdyApO1xuICAgICAgICB0aGlzLm5lZ2F0aXZlUG93LmNvbm5lY3QoIHRoaXMubmVnYXRpdmVQb3dOZWdhdGUgKTtcblxuXG4gICAgICAgIC8vIGxvd091dCArIChoaWdoT3V0IC0gbG93T3V0KSAqIE1hdGgucG93KCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApO1xuICAgICAgICB0aGlzLmVsc2VJZkJyYW5jaCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuZWxzZUlmTXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuaGlnaE91dE1pbnVzTG93T3V0LmNvbm5lY3QoIHRoaXMuZWxzZUlmTXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5wb3cuY29ubmVjdCggdGhpcy5lbHNlSWZNdWx0aXBseSwgMCwgMSApO1xuICAgICAgICB0aGlzLl9sb3dPdXQuY29ubmVjdCggdGhpcy5lbHNlSWZCcmFuY2gsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5lbHNlSWZNdWx0aXBseS5jb25uZWN0KCB0aGlzLmVsc2VJZkJyYW5jaCwgMCwgMSApO1xuXG4gICAgICAgIC8vIGxvd091dCArIChoaWdoT3V0IC0gbG93T3V0KSAqIC0oTWF0aC5wb3coICgtaW5wdXQgKyBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pLCBleHApKTtcbiAgICAgICAgdGhpcy5lbHNlQnJhbmNoID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgdGhpcy5lbHNlTXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuaGlnaE91dE1pbnVzTG93T3V0LmNvbm5lY3QoIHRoaXMuZWxzZU11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMubmVnYXRpdmVQb3dOZWdhdGUuY29ubmVjdCggdGhpcy5lbHNlTXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgdGhpcy5fbG93T3V0LmNvbm5lY3QoIHRoaXMuZWxzZUJyYW5jaCwgMCwgMCApO1xuICAgICAgICB0aGlzLmVsc2VNdWx0aXBseS5jb25uZWN0KCB0aGlzLmVsc2VCcmFuY2gsIDAsIDEgKTtcblxuXG5cbiAgICAgICAgLy8gZWxzZSBpZiggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSA+IDAgKSB7XG4gICAgICAgIHRoaXMuZ3JlYXRlclRoYW5aZXJvID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhblplcm8oKTtcbiAgICAgICAgdGhpcy5pZkdyZWF0ZXJUaGFuWmVybyA9IHRoaXMuaW8uY3JlYXRlSWZFbHNlKCk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNvbm5lY3QoIHRoaXMuZ3JlYXRlclRoYW5aZXJvICk7XG4gICAgICAgIHRoaXMuZ3JlYXRlclRoYW5aZXJvLmNvbm5lY3QoIHRoaXMuaWZHcmVhdGVyVGhhblplcm8uaWYgKTtcbiAgICAgICAgdGhpcy5lbHNlSWZCcmFuY2guY29ubmVjdCggdGhpcy5pZkdyZWF0ZXJUaGFuWmVyby50aGVuICk7XG4gICAgICAgIHRoaXMuZWxzZUJyYW5jaC5jb25uZWN0KCB0aGlzLmlmR3JlYXRlclRoYW5aZXJvLmVsc2UgKTtcblxuICAgICAgICAvLyBpZigoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID09PSAwKVxuICAgICAgICB0aGlzLmVxdWFsc1plcm8gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG9aZXJvKCk7XG4gICAgICAgIHRoaXMuaWZFcXVhbHNaZXJvID0gdGhpcy5pby5jcmVhdGVJZkVsc2UoKTtcbiAgICAgICAgdGhpcy5kaXZpZGUuY29ubmVjdCggdGhpcy5lcXVhbHNaZXJvICk7XG4gICAgICAgIHRoaXMuZXF1YWxzWmVyby5jb25uZWN0KCB0aGlzLmlmRXF1YWxzWmVyby5pZiApO1xuICAgICAgICB0aGlzLl9sb3dPdXQuY29ubmVjdCggdGhpcy5pZkVxdWFsc1plcm8udGhlbiApO1xuICAgICAgICB0aGlzLmlmR3JlYXRlclRoYW5aZXJvLmNvbm5lY3QoIHRoaXMuaWZFcXVhbHNaZXJvLmVsc2UgKTtcblxuICAgICAgICB0aGlzLmlmRXF1YWxzWmVyby5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5fbG93SW4uY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLl9oaWdoSW4uY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLl9sb3dPdXQuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLl9oaWdoT3V0LmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5fZXhwb25lbnQuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmlucHV0TWludXNMb3dJbi5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMubWludXNJbnB1dC5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMubWludXNJbnB1dFBsdXNMb3dJbi5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuaGlnaEluTWludXNMb3dJbi5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5uZWdhdGl2ZURpdmlkZS5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuaGlnaE91dE1pbnVzTG93T3V0LmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5wb3cuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLm5lZ2F0aXZlUG93TmVnYXRlLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5uZWdhdGl2ZVBvdy5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuZWxzZUlmQnJhbmNoLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5lbHNlSWZNdWx0aXBseS5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuZWxzZUJyYW5jaC5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuZ3JlYXRlclRoYW5aZXJvLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5pZkdyZWF0ZXJUaGFuWmVyby5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuZXF1YWxzWmVyby5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuaWZFcXVhbHNaZXJvLmNsZWFuVXAoKTtcblxuICAgICAgICB0aGlzLl9sb3dJbiA9IG51bGw7XG4gICAgICAgIHRoaXMuX2hpZ2hJbiA9IG51bGw7XG4gICAgICAgIHRoaXMuX2xvd091dCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2hpZ2hPdXQgPSBudWxsO1xuICAgICAgICB0aGlzLl9leHBvbmVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuaW5wdXRNaW51c0xvd0luID0gbnVsbDtcbiAgICAgICAgdGhpcy5taW51c0lucHV0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5taW51c0lucHV0UGx1c0xvd0luID0gbnVsbDtcbiAgICAgICAgdGhpcy5oaWdoSW5NaW51c0xvd0luID0gbnVsbDtcbiAgICAgICAgdGhpcy5kaXZpZGUgPSBudWxsO1xuICAgICAgICB0aGlzLm5lZ2F0aXZlRGl2aWRlID0gbnVsbDtcbiAgICAgICAgdGhpcy5oaWdoT3V0TWludXNMb3dPdXQgPSBudWxsO1xuICAgICAgICB0aGlzLnBvdyA9IG51bGw7XG4gICAgICAgIHRoaXMubmVnYXRpdmVQb3dOZWdhdGUgPSBudWxsO1xuICAgICAgICB0aGlzLm5lZ2F0aXZlUG93ID0gbnVsbDtcbiAgICAgICAgdGhpcy5lbHNlSWZCcmFuY2ggPSBudWxsO1xuICAgICAgICB0aGlzLmVsc2VJZk11bHRpcGx5ID0gbnVsbDtcbiAgICAgICAgdGhpcy5lbHNlQnJhbmNoID0gbnVsbDtcbiAgICAgICAgdGhpcy5ncmVhdGVyVGhhblplcm8gPSBudWxsO1xuICAgICAgICB0aGlzLmlmR3JlYXRlclRoYW5aZXJvID0gbnVsbDtcbiAgICAgICAgdGhpcy5lcXVhbHNaZXJvID0gbnVsbDtcbiAgICAgICAgdGhpcy5pZkVxdWFsc1plcm8gPSBudWxsO1xuICAgIH1cblxuXG4gICAgZ2V0IGxvd0luKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG93SW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBsb3dJbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuX2xvd0luLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGhpZ2hJbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hpZ2hJbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGhpZ2hJbiggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuX2hpZ2hJbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBsb3dPdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sb3dPdXQudmFsdWU7XG4gICAgfVxuICAgIHNldCBsb3dPdXQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLl9sb3dPdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgaGlnaE91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hpZ2hPdXQudmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoT3V0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5faGlnaE91dC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBleHBvbmVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2V4cG9uZW50LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgZXhwb25lbnQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLl9leHBvbmVudC52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLnBvdy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLm5lZ2F0aXZlUG93LnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNjYWxlRXhwID0gZnVuY3Rpb24oIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCwgZXhwb25lbnQgKSB7XG4gICAgcmV0dXJuIG5ldyBTY2FsZUV4cCggdGhpcywgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHBvbmVudCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbmNsYXNzIFNpZ24gZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIGZ1bmN0aW9uKCB4ICkge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguc2lnbiggeCApO1xuICAgICAgICB9LCA0MDk2ICk7XG5cbiAgICAgICAgdGhpcy5pZkVsc2UgPSB0aGlzLmlvLmNyZWF0ZUlmRWxzZSgpO1xuICAgICAgICB0aGlzLmVxdWFsVG9aZXJvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvWmVybygpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5lcXVhbFRvWmVybyApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuaWZFbHNlLnRoZW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnNoYXBlciApO1xuXG4gICAgICAgIHRoaXMuZXF1YWxUb1plcm8uY29ubmVjdCggdGhpcy5pZkVsc2UuaWYgKTtcbiAgICAgICAgdGhpcy5zaGFwZXIuY29ubmVjdCggdGhpcy5pZkVsc2UuZWxzZSApO1xuICAgICAgICB0aGlzLmlmRWxzZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zaGFwZXIuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLnNoYXBlciA9IG51bGw7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTaWduID0gZnVuY3Rpb24oIGFjY3VyYWN5ICkge1xuICAgIHJldHVybiBuZXcgU2lnbiggdGhpcywgYWNjdXJhY3kgKTtcbn07XG4iLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NZXRob2RzX29mX2NvbXB1dGluZ19zcXVhcmVfcm9vdHMjRXhhbXBsZVxuLy9cbi8vIGZvciggdmFyIGkgPSAwLCB4OyBpIDwgc2lnRmlndXJlczsgKytpICkge1xuLy8gICAgICBpZiggaSA9PT0gMCApIHtcbi8vICAgICAgICAgIHggPSBzaWdGaWd1cmVzICogTWF0aC5wb3coIDEwLCAyICk7XG4vLyAgICAgIH1cbi8vICAgICAgZWxzZSB7XG4vLyAgICAgICAgICB4ID0gMC41ICogKCB4ICsgKGlucHV0IC8geCkgKTtcbi8vICAgICAgfVxuLy8gfVxuY2xhc3MgU3FydEhlbHBlciB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBwcmV2aW91c1N0ZXAsIGlucHV0LCBtYXhJbnB1dCApIHtcbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IGlvLmNyZWF0ZU11bHRpcGx5KCAwLjUgKTtcbiAgICAgICAgdGhpcy5kaXZpZGUgPSBpby5jcmVhdGVEaXZpZGUoIG51bGwsIG1heElucHV0ICk7XG4gICAgICAgIHRoaXMuYWRkID0gaW8uY3JlYXRlQWRkKCk7XG5cbiAgICAgICAgLy8gaW5wdXQgLyB4O1xuICAgICAgICBpbnB1dC5jb25uZWN0KCB0aGlzLmRpdmlkZSwgMCwgMCApO1xuICAgICAgICBwcmV2aW91c1N0ZXAub3V0cHV0LmNvbm5lY3QoIHRoaXMuZGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8geCArICggaW5wdXQgLyB4IClcbiAgICAgICAgcHJldmlvdXNTdGVwLm91dHB1dC5jb25uZWN0KCB0aGlzLmFkZCwgMCwgMCApO1xuICAgICAgICB0aGlzLmRpdmlkZS5jb25uZWN0KCB0aGlzLmFkZCwgMCwgMSApO1xuXG4gICAgICAgIC8vIDAuNSAqICggeCArICggaW5wdXQgLyB4ICkgKVxuICAgICAgICB0aGlzLmFkZC5jb25uZWN0KCB0aGlzLm11bHRpcGx5ICk7XG5cbiAgICAgICAgdGhpcy5vdXRwdXQgPSB0aGlzLm11bHRpcGx5O1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHRoaXMubXVsdGlwbHkuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmRpdmlkZS5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuYWRkLmNsZWFuVXAoKTtcblxuICAgICAgICB0aGlzLm11bHRpcGx5ID0gbnVsbDtcbiAgICAgICAgdGhpcy5kaXZpZGUgPSBudWxsO1xuICAgICAgICB0aGlzLmFkZCA9IG51bGw7XG4gICAgICAgIHRoaXMub3V0cHV0ID0gbnVsbDtcbiAgICB9XG59XG5cbmNsYXNzIFNxcnQgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHNpZ25pZmljYW50RmlndXJlcywgbWF4SW5wdXQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIC8vIERlZmF1bHQgdG8gNiBzaWduaWZpY2FudCBmaWd1cmVzLlxuICAgICAgICBzaWduaWZpY2FudEZpZ3VyZXMgPSBzaWduaWZpY2FudEZpZ3VyZXMgfHwgNjtcblxuICAgICAgICBtYXhJbnB1dCA9IG1heElucHV0IHx8IDEwMDtcblxuICAgICAgICB0aGlzLngwID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggc2lnbmlmaWNhbnRGaWd1cmVzICogTWF0aC5wb3coIDEwLCAyICkgKTtcblxuICAgICAgICB0aGlzLnN0ZXBzID0gWyB7XG4gICAgICAgICAgICBvdXRwdXQ6IHRoaXMueDBcbiAgICAgICAgfSBdO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMTsgaSA8IHNpZ25pZmljYW50RmlndXJlczsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5zdGVwcy5wdXNoKFxuICAgICAgICAgICAgICAgIG5ldyBTcXJ0SGVscGVyKCB0aGlzLmlvLCB0aGlzLnN0ZXBzWyBpIC0gMSBdLCB0aGlzLmlucHV0c1sgMCBdLCBtYXhJbnB1dCApXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGVwc1sgdGhpcy5zdGVwcy5sZW5ndGggLSAxIF0ub3V0cHV0LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLngwLmNsZWFuVXAoKTtcblxuICAgICAgICB0aGlzLnN0ZXBzWyAwIF0gPSBudWxsO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSB0aGlzLnN0ZXBzLmxlbmd0aCAtIDE7IGkgPj0gMTsgLS1pICkge1xuICAgICAgICAgICAgdGhpcy5zdGVwc1sgaSBdLmNsZWFuVXAoKTtcbiAgICAgICAgICAgIHRoaXMuc3RlcHNbIGkgXSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLngwID0gbnVsbDtcbiAgICAgICAgdGhpcy5zdGVwcyA9IG51bGw7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNxcnQgPSBmdW5jdGlvbiggc2lnbmlmaWNhbnRGaWd1cmVzLCBtYXhJbnB1dCApIHtcbiAgICByZXR1cm4gbmV3IFNxcnQoIHRoaXMsIHNpZ25pZmljYW50RmlndXJlcywgbWF4SW5wdXQgKTtcbn07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuY2xhc3MgU3F1YXJlIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDEgKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gbnVsbDtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNxdWFyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgU3F1YXJlKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogU3VidHJhY3RzIHRoZSBzZWNvbmQgaW5wdXQgZnJvbSB0aGUgZmlyc3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKi9cbmNsYXNzIFN1YnRyYWN0IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5uZWdhdGUgPSB0aGlzLmlvLmNyZWF0ZU5lZ2F0ZSgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCB0aGlzLm5lZ2F0ZSApO1xuICAgICAgICB0aGlzLm5lZ2F0ZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMubmVnYXRlLmNsZWFuVXAoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gbnVsbDtcbiAgICAgICAgdGhpcy5uZWdhdGUgPSBudWxsO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVN1YnRyYWN0ID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgU3VidHJhY3QoIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIFN3aXRjaCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtQ2FzZXMsIHN0YXJ0aW5nQ2FzZSA9IDAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIC8vIEVuc3VyZSBzdGFydGluZ0Nhc2UgaXMgbmV2ZXIgPCAwXG4gICAgICAgIHN0YXJ0aW5nQ2FzZSA9IE1hdGguYWJzKCBzdGFydGluZ0Nhc2UgKTtcblxuICAgICAgICB0aGlzLmNhc2VzID0gW107XG4gICAgICAgIHRoaXMuY29udHJvbHMuaW5kZXggPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBzdGFydGluZ0Nhc2UgKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1DYXNlczsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIGkgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgaSBdLmdhaW4udmFsdWUgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLmNhc2VzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG8oIGkgKTtcbiAgICAgICAgICAgIHRoaXMuY2FzZXNbIGkgXS5jb25uZWN0KCB0aGlzLmlucHV0c1sgaSBdLmdhaW4gKTtcbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMuaW5kZXguY29ubmVjdCggdGhpcy5jYXNlc1sgaSBdICk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgaSBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSB0aGlzLmNhc2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgICAgdGhpcy5jYXNlc1sgaSBdLmNsZWFuVXAoKTtcbiAgICAgICAgICAgIHRoaXMuY2FzZXNbIGkgXSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4LmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5pbmRleCA9IG51bGw7XG4gICAgICAgIHRoaXMuY2FzZXMgPSBudWxsO1xuICAgIH1cblxuICAgIGdldCBjb250cm9sKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5pbmRleC5jb250cm9sO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMuaW5kZXgudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaW5kZXgudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3dpdGNoID0gZnVuY3Rpb24oIG51bUNhc2VzLCBzdGFydGluZ0Nhc2UgKSB7XG4gICAgcmV0dXJuIG5ldyBTd2l0Y2goIHRoaXMsIG51bUNhc2VzLCBzdGFydGluZ0Nhc2UgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IExvZ2ljYWxPcGVyYXRvciBmcm9tIFwiLi9Mb2dpY2FsT3BlcmF0b3IuZXM2XCI7XG5cblxuY2xhc3MgQU5EIGV4dGVuZHMgTG9naWNhbE9wZXJhdG9yIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVDbGFtcCggMCwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIGdyYXBoLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoIHRoaXMgKTtcblxuICAgICAgICBncmFwaC5tdWx0aXBseS5jbGVhblVwKCk7XG4gICAgICAgIGdyYXBoLm11bHRpcGx5ID0gbnVsbDtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEFORDtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQU5EID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBBTkQoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBMb2dpY2FsT3BlcmF0b3IgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmNsYW1wID0gdGhpcy5pby5jcmVhdGVDbGFtcCggMCwgMSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gZ3JhcGguY2xhbXA7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgZ3JhcGguY2xhbXAuY2xlYW5VcCgpO1xuICAgICAgICBncmFwaC5jbGFtcCA9IG51bGw7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMb2dpY2FsT3BlcmF0b3I7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxvZ2ljYWxPcGVyYXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTG9naWNhbE9wZXJhdG9yKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBMb2dpY2FsT3BlcmF0b3IgZnJvbSBcIi4vTG9naWNhbE9wZXJhdG9yLmVzNlwiO1xuXG5cbmNsYXNzIE5PVCBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcbiAgICAgICAgY29uc29sZS5sb2coIHRoaXMsIGdyYXBoICk7XG5cbiAgICAgICAgZ3JhcGguYWJzID0gdGhpcy5pby5jcmVhdGVBYnMoIDEwMCApO1xuICAgICAgICBncmFwaC5zdWJ0cmFjdCA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoIDEgKTtcbiAgICAgICAgZ3JhcGgucm91bmQgPSB0aGlzLmlvLmNyZWF0ZVJvdW5kKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5zdWJ0cmFjdCApO1xuICAgICAgICBncmFwaC5zdWJ0cmFjdC5jb25uZWN0KCBncmFwaC5hYnMgKTtcbiAgICAgICAgZ3JhcGguYWJzLmNvbm5lY3QoIGdyYXBoLnJvdW5kIClcblxuICAgICAgICBncmFwaC5yb3VuZC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgLy8gdGhpcy5hYnMuY2xlYW5VcCgpO1xuICAgICAgICAvLyB0aGlzLmFicyA9IG51bGw7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLnN1YnRyYWN0LmNsZWFuVXAoKTtcbiAgICAgICAgZ3JhcGguYWJzLmNsZWFuVXAoKTtcbiAgICAgICAgZ3JhcGgucm91bmQuY2xlYW5VcCgpO1xuICAgICAgICBncmFwaC5zdWJ0cmFjdCA9IG51bGw7XG4gICAgICAgIGdyYXBoLmFicyA9IG51bGw7XG4gICAgICAgIGdyYXBoLnJvdW5kID0gbnVsbDtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE5PVDtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTk9UID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBOT1QoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IExvZ2ljYWxPcGVyYXRvciBmcm9tIFwiLi9Mb2dpY2FsT3BlcmF0b3IuZXM2XCI7XG5cblxuY2xhc3MgT1IgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubWF4ID0gdGhpcy5pby5jcmVhdGVNYXgoKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUbyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbyggMSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVDbGFtcCggMCwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggZ3JhcGgubWF4ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggZ3JhcGgubWF4LmNvbnRyb2xzLnZhbHVlICk7XG4gICAgICAgIGdyYXBoLm1heC5jb25uZWN0KCBncmFwaC5lcXVhbFRvICk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuXG4gICAgICAgIGdyYXBoLmVxdWFsVG8uY2xlYW5VcCgpO1xuICAgICAgICBncmFwaC5lcXVhbFRvID0gbnVsbDtcblxuICAgICAgICBncmFwaC5tYXguY2xlYW5VcCgpO1xuICAgICAgICBncmFwaC5tYXggPSBudWxsO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgT1I7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU9SID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBPUiggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBnYWluKCsxMDAwMDApIC0+IHNoYXBlciggPD0gMDogMSwgMSApXG5jbGFzcyBFcXVhbFRvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAwICk7XG5cbiAgICAgICAgLy8gVE9ET1xuICAgICAgICAvLyAgLSBSZW5hbWUgdGhpcy5cbiAgICAgICAgdGhpcy5jb250cm9sID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKSxcbiAgICAgICAgdGhpcy5pbnZlcnNpb24gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuXG4gICAgICAgIHRoaXMuaW52ZXJzaW9uLmdhaW4udmFsdWUgPSAtMTtcblxuICAgICAgICAvLyBUaGlzIGN1cnZlIG91dHB1dHMgMC41IHdoZW4gaW5wdXQgaXMgMCxcbiAgICAgICAgLy8gc28gaXQgaGFzIHRvIGJlIHBpcGVkIGludG8gYSBub2RlIHRoYXRcbiAgICAgICAgLy8gdHJhbnNmb3JtcyBpdCBpbnRvIDEsIGFuZCBsZWF2ZXMgemVyb3NcbiAgICAgICAgLy8gYWxvbmUuXG4gICAgICAgIHRoaXMuc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5FcXVhbFRvWmVybyApO1xuXG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhblplcm8oKTtcbiAgICAgICAgdGhpcy5jb250cm9sLmNvbm5lY3QoIHRoaXMuaW52ZXJzaW9uICk7XG4gICAgICAgIHRoaXMuaW52ZXJzaW9uLmNvbm5lY3QoIHRoaXMuaW5wdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc2hhcGVyICk7XG4gICAgICAgIHRoaXMuc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuY29udHJvbDtcblxuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5zaGFwZXIuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmNvbnRyb2wuY2xlYW5VcCgpO1xuXG4gICAgICAgIHRoaXMuaW52ZXJzaW9uLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5pbnZlcnNpb24gPSBudWxsO1xuICAgICAgICB0aGlzLnNoYXBlciA9IG51bGw7XG4gICAgICAgIHRoaXMuY29udHJvbCA9IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2wuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUVxdWFsVG8gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBFcXVhbFRvKCB0aGlzLCB2YWx1ZSApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRXF1YWxUbzsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuaW1wb3J0IEVxdWFsVG8gZnJvbSBcIi4vRXF1YWxUby5lczZcIjtcblxuLy8gSGF2ZW4ndCBxdWl0ZSBmaWd1cmVkIG91dCB3aHkgeWV0LCBidXQgdGhpcyByZXR1cm5zIDAgd2hlbiBpbnB1dCBpcyAwLlxuLy8gSXQgc2hvdWxkIHJldHVybiAxLi4uXG4vL1xuLy8gRm9yIG5vdywgSSdtIGp1c3QgdXNpbmcgdGhlIEVxdWFsVG8gbm9kZSB3aXRoIGEgc3RhdGljIDAgYXJndW1lbnQuXG4vLyAtLS0tLS0tLVxuLy9cbi8vIGNsYXNzIEVxdWFsVG9aZXJvIGV4dGVuZHMgTm9kZSB7XG4vLyAgICAgY29uc3RydWN0b3IoIGlvICkge1xuLy8gICAgICAgICBzdXBlciggaW8sIDEsIDAgKTtcblxuLy8gICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAxMDAwMDA7XG5cbi8vICAgICAgICAgLy8gVGhpcyBvdXRwdXRzIDAuNSB3aGVuIGlucHV0IGlzIDAsXG4vLyAgICAgICAgIC8vIHNvIGl0IGhhcyB0byBiZSBwaXBlZCBpbnRvIGEgbm9kZSB0aGF0XG4vLyAgICAgICAgIC8vIHRyYW5zZm9ybXMgaXQgaW50byAxLCBhbmQgbGVhdmVzIHplcm9zXG4vLyAgICAgICAgIC8vIGFsb25lLlxuLy8gICAgICAgICB0aGlzLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuRXF1YWxUb1plcm8gKTtcblxuLy8gICAgICAgICB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlR3JlYXRlclRoYW4oIDAgKTtcblxuLy8gICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc2hhcGVyICk7XG4vLyAgICAgICAgIHRoaXMuc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4vLyAgICAgfVxuXG4vLyAgICAgY2xlYW5VcCgpIHtcbi8vICAgICAgICAgc3VwZXIoKTtcblxuLy8gICAgICAgICB0aGlzLnNoYXBlci5jbGVhblVwKCk7XG4vLyAgICAgICAgIHRoaXMuc2hhcGVyID0gbnVsbDtcbi8vICAgICB9XG4vLyB9XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUVxdWFsVG9aZXJvID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gcmV0dXJuIG5ldyBFcXVhbFRvWmVybyggdGhpcyApO1xuXG4gICAgcmV0dXJuIG5ldyBFcXVhbFRvKCB0aGlzLCAwICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIEdyZWF0ZXJUaGFuIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAwICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG4gICAgICAgIHRoaXMuaW52ZXJzaW9uID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICB0aGlzLmludmVyc2lvbi5nYWluLnZhbHVlID0gLTE7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gMTAwMDAwO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuR3JlYXRlclRoYW5aZXJvICk7XG5cblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNvbm5lY3QoIHRoaXMuaW52ZXJzaW9uICk7XG4gICAgICAgIHRoaXMuaW52ZXJzaW9uLmNvbm5lY3QoIHRoaXMuaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5pbnZlcnNpb24uZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmludmVyc2lvbiA9IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlR3JlYXRlclRoYW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBHcmVhdGVyVGhhbiggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgR3JlYXRlclRoYW5aZXJvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDAgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gMTAwMDAwO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuR3JlYXRlclRoYW5aZXJvICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUdyZWF0ZXJUaGFuWmVybyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgR3JlYXRlclRoYW5aZXJvKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIElmRWxzZSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAwICk7XG5cbiAgICAgICAgdGhpcy5zd2l0Y2ggPSB0aGlzLmlvLmNyZWF0ZVN3aXRjaCggMiwgMCApO1xuXG4gICAgICAgIHRoaXMuaWYgPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG9aZXJvKCk7XG4gICAgICAgIHRoaXMuaWYuY29ubmVjdCggdGhpcy5zd2l0Y2guY29udHJvbCApO1xuICAgICAgICB0aGlzLnRoZW4gPSB0aGlzLnN3aXRjaC5pbnB1dHNbIDAgXTtcbiAgICAgICAgdGhpcy5lbHNlID0gdGhpcy5zd2l0Y2guaW5wdXRzWyAxIF07XG5cbiAgICAgICAgdGhpcy5pbnB1dHMgPSB0aGlzLnN3aXRjaC5pbnB1dHM7XG4gICAgICAgIHRoaXMub3V0cHV0cyA9IHRoaXMuc3dpdGNoLm91dHB1dHM7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnN3aXRjaC5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuaWYuY2xlYW5VcCgpO1xuXG4gICAgICAgIHRoaXMuaWYgPSBudWxsO1xuICAgICAgICB0aGlzLnRoZW4gPSBudWxsO1xuICAgICAgICB0aGlzLmVsc2UgPSBudWxsO1xuICAgICAgICB0aGlzLmlucHV0cyA9IG51bGw7XG4gICAgICAgIHRoaXMub3V0cHV0cyA9IG51bGw7XG4gICAgICAgIHRoaXMuc3dpdGNoID0gbnVsbDtcblxuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlSWZFbHNlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJZkVsc2UoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgTGVzc1RoYW4gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDAgKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICB0aGlzLnZhbHVlSW52ZXJzaW9uID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy52YWx1ZUludmVyc2lvbi5nYWluLnZhbHVlID0gLTE7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5jb25uZWN0KCB0aGlzLnZhbHVlSW52ZXJzaW9uICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gLTEwMDAwMDtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkdyZWF0ZXJUaGFuWmVybyApO1xuXG4gICAgICAgIHRoaXMudmFsdWVJbnZlcnNpb24uY29ubmVjdCggdGhpcy5pbnB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSBudWxsO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxlc3NUaGFuID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgTGVzc1RoYW4oIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIExlc3NUaGFuWmVybyBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAwICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gLTEwMDAwMDtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkdyZWF0ZXJUaGFuWmVybyApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUxlc3NUaGFuWmVybyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTGVzc1RoYW5aZXJvKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIENvc2luZSBhcHByb3hpbWF0aW9uIVxuLy9cbi8vIE9ubHkgd29ya3MgaW4gcmFuZ2Ugb2YgLU1hdGguUEkgdG8gTWF0aC5QSS5cbmNsYXNzIENvcyBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgdGhpcy5zcXVhcmUgPSB0aGlzLmlvLmNyZWF0ZVNxdWFyZSgpO1xuXG4gICAgICAgIHRoaXMuY29uc3QxID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggLTIuNjA1ZS03ICk7XG4gICAgICAgIHRoaXMuY29uc3QyID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggMi40NzYwOWUtNSApO1xuICAgICAgICB0aGlzLmNvbnN0MyA9IHRoaXMuaW8uY3JlYXRlQ29uc3RhbnQoIC0wLjAwMTM4ODg0ICk7XG4gICAgICAgIHRoaXMuY29uc3Q0ID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggMC4wNDE2NjY2ICk7XG4gICAgICAgIHRoaXMuY29uc3Q1ID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggLTAuNDk5OTIzICk7XG4gICAgICAgIHRoaXMuY29uc3Q2ID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggMSApO1xuXG4gICAgICAgIHRoaXMubXVsdGlwbHkxID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLm11bHRpcGx5MiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseTMgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHk0ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLm11bHRpcGx5NSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICB0aGlzLmFkZDEgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICB0aGlzLmFkZDIgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICB0aGlzLmFkZDMgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICB0aGlzLmFkZDQgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICB0aGlzLmFkZDUgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5zcXVhcmUgKTtcblxuXG4gICAgICAgIHRoaXMuY29uc3Q1LmNvbm5lY3QoIHRoaXMuYWRkNCwgMCwgMSApO1xuICAgICAgICB0aGlzLmNvbnN0Ni5jb25uZWN0KCB0aGlzLmFkZDUsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IG11bHRpcGx5MSdzIGlucHV0c1xuICAgICAgICB0aGlzLnNxdWFyZS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MSwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnN0MS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MSwgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgYWRkMSdzIGlucHV0c1xuICAgICAgICB0aGlzLm11bHRpcGx5MS5jb25uZWN0KCB0aGlzLmFkZDEsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb25zdDIuY29ubmVjdCggdGhpcy5hZGQxLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBtdWx0aXBseTIncyBpbnB1dHNcbiAgICAgICAgdGhpcy5zcXVhcmUuY29ubmVjdCggdGhpcy5tdWx0aXBseTIsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5hZGQxLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkyLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBhZGQyJ3MgaW5wdXRzXG4gICAgICAgIHRoaXMubXVsdGlwbHkyLmNvbm5lY3QoIHRoaXMuYWRkMiwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnN0My5jb25uZWN0KCB0aGlzLmFkZDIsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIG11bHRpcGx5MydzIGlucHV0c1xuICAgICAgICB0aGlzLnNxdWFyZS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MywgMCwgMCApO1xuICAgICAgICB0aGlzLmFkZDIuY29ubmVjdCggdGhpcy5tdWx0aXBseTMsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGFkZDMncyBpbnB1dHNcbiAgICAgICAgdGhpcy5tdWx0aXBseTMuY29ubmVjdCggdGhpcy5hZGQzLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29uc3Q0LmNvbm5lY3QoIHRoaXMuYWRkMywgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgbXVsdGlwbHk0J3MgaW5wdXRzXG4gICAgICAgIHRoaXMuc3F1YXJlLmNvbm5lY3QoIHRoaXMubXVsdGlwbHk0LCAwLCAwICk7XG4gICAgICAgIHRoaXMuYWRkMy5jb25uZWN0KCB0aGlzLm11bHRpcGx5NCwgMCwgMSApO1xuXG4gICAgICAgIC8vIGFkZDQncyBpbnB1dHNcbiAgICAgICAgdGhpcy5tdWx0aXBseTQuY29ubmVjdCggdGhpcy5hZGQ0LCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29uc3Q1LmNvbm5lY3QoIHRoaXMuYWRkNCwgMCwgMSApO1xuXG4gICAgICAgIC8vIG11bHRpcGx5NSdzIGlucHV0c1xuICAgICAgICB0aGlzLnNxdWFyZS5jb25uZWN0KCB0aGlzLm11bHRpcGx5NSwgMCwgMCApO1xuICAgICAgICB0aGlzLmFkZDQuY29ubmVjdCggdGhpcy5tdWx0aXBseTUsIDAsIDEgKTtcblxuICAgICAgICAvLyBhZGQ1J3MgaW5wdXRzXG4gICAgICAgIHRoaXMubXVsdGlwbHk1LmNvbm5lY3QoIHRoaXMuYWRkNSwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnN0Ni5jb25uZWN0KCB0aGlzLmFkZDUsIDAsIDEgKTtcblxuICAgICAgICAvLyBPdXRwdXQgKGZpbmFsbHkhISlcbiAgICAgICAgdGhpcy5hZGQ1LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgLy8gU3RvcmUgY29udHJvbGxhYmxlIHBhcmFtcy5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW5wdXRzWyAwIF07XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvcyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IENvcyggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgRGVnVG9SYWQgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCBNYXRoLlBJIC8gMTgwICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEZWdUb1JhZCA9IGZ1bmN0aW9uKCBkZWcgKSB7XG4gICAgcmV0dXJuIG5ldyBEZWdUb1JhZCggdGhpcywgZGVnICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIFJhZFRvRGVnIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDAgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMub3V0cHV0c1sgMCBdID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggMTgwIC8gTWF0aC5QSSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUmFkVG9EZWcgPSBmdW5jdGlvbiggZGVnICkge1xuICAgIHJldHVybiBuZXcgUmFkVG9EZWcoIHRoaXMsIGRlZyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBTaW5lIGFwcHJveGltYXRpb24hXG4vL1xuLy8gT25seSB3b3JrcyBpbiByYW5nZSBvZiAtTWF0aC5QSSB0byBNYXRoLlBJLlxuY2xhc3MgU2luZSBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIHRoaXMuc3F1YXJlID0gdGhpcy5pby5jcmVhdGVTcXVhcmUoKTtcblxuICAgICAgICB0aGlzLmNvbnN0MSA9IHRoaXMuaW8uY3JlYXRlQ29uc3RhbnQoIC0yLjM5ZS04ICk7XG4gICAgICAgIHRoaXMuY29uc3QyID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggMi43NTI2ZS02ICk7XG4gICAgICAgIHRoaXMuY29uc3QzID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggLTAuMDAwMTk4NDA5ICk7XG4gICAgICAgIHRoaXMuY29uc3Q0ID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggMC4wMDgzMzMzMyApO1xuICAgICAgICB0aGlzLmNvbnN0NSA9IHRoaXMuaW8uY3JlYXRlQ29uc3RhbnQoIC0wLjE2NjY2NyApO1xuICAgICAgICB0aGlzLmNvbnN0NiA9IHRoaXMuaW8uY3JlYXRlQ29uc3RhbnQoIDEgKTtcblxuICAgICAgICB0aGlzLm11bHRpcGx5MSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseTIgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkzID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLm11bHRpcGx5NCA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseTUgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHk2ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIHRoaXMuYWRkMSA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuYWRkMiA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuYWRkMyA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuYWRkNCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuYWRkNSA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnNxdWFyZSApO1xuXG5cbiAgICAgICAgdGhpcy5jb25zdDUuY29ubmVjdCggdGhpcy5hZGQ0LCAwLCAxICk7XG4gICAgICAgIHRoaXMuY29uc3Q2LmNvbm5lY3QoIHRoaXMuYWRkNSwgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgbXVsdGlwbHkxJ3MgaW5wdXRzXG4gICAgICAgIHRoaXMuc3F1YXJlLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkxLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29uc3QxLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkxLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBhZGQxJ3MgaW5wdXRzXG4gICAgICAgIHRoaXMubXVsdGlwbHkxLmNvbm5lY3QoIHRoaXMuYWRkMSwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnN0Mi5jb25uZWN0KCB0aGlzLmFkZDEsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIG11bHRpcGx5MidzIGlucHV0c1xuICAgICAgICB0aGlzLnNxdWFyZS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MiwgMCwgMCApO1xuICAgICAgICB0aGlzLmFkZDEuY29ubmVjdCggdGhpcy5tdWx0aXBseTIsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIGFkZDIncyBpbnB1dHNcbiAgICAgICAgdGhpcy5tdWx0aXBseTIuY29ubmVjdCggdGhpcy5hZGQyLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29uc3QzLmNvbm5lY3QoIHRoaXMuYWRkMiwgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgbXVsdGlwbHkzJ3MgaW5wdXRzXG4gICAgICAgIHRoaXMuc3F1YXJlLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkzLCAwLCAwICk7XG4gICAgICAgIHRoaXMuYWRkMi5jb25uZWN0KCB0aGlzLm11bHRpcGx5MywgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgYWRkMydzIGlucHV0c1xuICAgICAgICB0aGlzLm11bHRpcGx5My5jb25uZWN0KCB0aGlzLmFkZDMsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb25zdDQuY29ubmVjdCggdGhpcy5hZGQzLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBtdWx0aXBseTQncyBpbnB1dHNcbiAgICAgICAgdGhpcy5zcXVhcmUuY29ubmVjdCggdGhpcy5tdWx0aXBseTQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5hZGQzLmNvbm5lY3QoIHRoaXMubXVsdGlwbHk0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNCdzIGlucHV0c1xuICAgICAgICB0aGlzLm11bHRpcGx5NC5jb25uZWN0KCB0aGlzLmFkZDQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb25zdDUuY29ubmVjdCggdGhpcy5hZGQ0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gbXVsdGlwbHk1J3MgaW5wdXRzXG4gICAgICAgIHRoaXMuc3F1YXJlLmNvbm5lY3QoIHRoaXMubXVsdGlwbHk1LCAwLCAwICk7XG4gICAgICAgIHRoaXMuYWRkNC5jb25uZWN0KCB0aGlzLm11bHRpcGx5NSwgMCwgMSApO1xuXG4gICAgICAgIC8vIGFkZDUncyBpbnB1dHNcbiAgICAgICAgdGhpcy5tdWx0aXBseTUuY29ubmVjdCggdGhpcy5hZGQ1LCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29uc3Q2LmNvbm5lY3QoIHRoaXMuYWRkNSwgMCwgMSApO1xuXG4gICAgICAgIC8vIG11bHRpcGx5NidzIGlucHV0c1xuICAgICAgICB0aGlzLmlucHV0c1swXS5jb25uZWN0KCB0aGlzLm11bHRpcGx5NiwgMCwgMCApO1xuICAgICAgICB0aGlzLmFkZDUuY29ubmVjdCggdGhpcy5tdWx0aXBseTYsIDAsIDEgKTtcblxuICAgICAgICAvLyBPdXRwdXQgKGZpbmFsbHkhISlcbiAgICAgICAgdGhpcy5tdWx0aXBseTYuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2luZSA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFNpbmUoIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIFRhbmdlbnQgYXBwcm94aW1hdGlvbiFcbi8vXG4vLyBPbmx5IHdvcmtzIGluIHJhbmdlIG9mIC1NYXRoLlBJIHRvIE1hdGguUEkuXG4vL1xuLy8gc2luKCBpbnB1dCApIC8gY29zKCBpbnB1dCApXG5jbGFzcyBUYW4gZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICB0aGlzLnNpbmUgPSB0aGlzLmlvLmNyZWF0ZVNpbmUoKTtcbiAgICAgICAgdGhpcy5jb3MgPSB0aGlzLmlvLmNyZWF0ZUNvcygpO1xuICAgICAgICB0aGlzLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCB1bmRlZmluZWQsIE1hdGguUEkgKiAyICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnNpbmUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmNvcyApO1xuICAgICAgICB0aGlzLnNpbmUuY29ubmVjdCggdGhpcy5kaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb3MuY29ubmVjdCggdGhpcy5kaXZpZGUsIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmRpdmlkZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIHRoaXMuc3F1YXJlID0gdGhpcy5pby5jcmVhdGVTcXVhcmUoKTtcbiAgICAgICAgLy8gdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnNxdWFyZSApO1xuXG4gICAgICAgIC8vIHRoaXMubXVsdGlwbHkxID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICAvLyB0aGlzLm11bHRpcGx5VGhpcmQgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAwLjMzMzMzMyApO1xuICAgICAgICAvLyB0aGlzLm11bHRpcGx5MiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgLy8gdGhpcy5tdWx0aXBseU9uZVRocmVlID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSggMC4xMzMzMzMgKTtcbiAgICAgICAgLy8gdGhpcy5hZGQxID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgLy8gdGhpcy5hZGQyID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcblxuICAgICAgICAvLyB0aGlzLnNxdWFyZS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MSwgMCwgMCApO1xuICAgICAgICAvLyB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkxLCAwLCAxICk7XG5cbiAgICAgICAgLy8gdGhpcy5zcXVhcmUuY29ubmVjdCggdGhpcy5tdWx0aXBseTIsIDAsIDAgKTtcbiAgICAgICAgLy8gdGhpcy5tdWx0aXBseTEuY29ubmVjdCggdGhpcy5tdWx0aXBseTIsIDAsIDEgKTtcblxuICAgICAgICAvLyB0aGlzLm11bHRpcGx5MS5jb25uZWN0KCB0aGlzLm11bHRpcGx5VGhpcmQgKTtcbiAgICAgICAgLy8gdGhpcy5tdWx0aXBseTIuY29ubmVjdCggdGhpcy5tdWx0aXBseU9uZVRocmVlICk7XG5cbiAgICAgICAgLy8gdGhpcy5tdWx0aXBseVRoaXJkLmNvbm5lY3QoIHRoaXMuYWRkMSwgMCwgMCApO1xuICAgICAgICAvLyB0aGlzLm11bHRpcGx5T25lVGhyZWUuY29ubmVjdCggdGhpcy5hZGQxLCAwLCAxICk7XG5cbiAgICAgICAgLy8gdGhpcy5hZGQxLmNvbm5lY3QoIHRoaXMuYWRkMiwgMCwgMCApO1xuICAgICAgICAvLyB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuYWRkMiwgMCwgMSApO1xuXG4gICAgICAgIC8vIHRoaXMuYWRkMi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSBudWxsO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlVGFuID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgVGFuKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgQ09ORklHIGZyb20gXCIuLi9jb3JlL2NvbmZpZy5lczZcIjtcblxuZnVuY3Rpb24gUGlua051bWJlcigpIHtcbiAgICB0aGlzLm1heEtleSA9IDB4MWY7XG4gICAgdGhpcy5rZXkgPSAwO1xuICAgIHRoaXMud2hpdGVWYWx1ZXMgPSBbXTtcbiAgICB0aGlzLnJhbmdlID0gMTI4O1xuICAgIHRoaXMubGltaXQgPSA1O1xuXG4gICAgdGhpcy5nZW5lcmF0ZSA9IHRoaXMuZ2VuZXJhdGUuYmluZCggdGhpcyApO1xuICAgIHRoaXMuZ2V0TmV4dFZhbHVlID0gdGhpcy5nZXROZXh0VmFsdWUuYmluZCggdGhpcyApO1xufVxuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZW5lcmF0ZSA9IGZ1bmN0aW9uKCByYW5nZSwgbGltaXQgKSB7XG4gICAgdGhpcy5yYW5nZSA9IHJhbmdlIHx8IDEyODtcbiAgICB0aGlzLm1heEtleSA9IDB4MWY7XG4gICAgdGhpcy5rZXkgPSAwO1xuICAgIHRoaXMubGltaXQgPSBsaW1pdCB8fCAxO1xuXG5cdHZhciByYW5nZUxpbWl0ID0gdGhpcy5yYW5nZSAvIHRoaXMubGltaXQ7XG5cbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubGltaXQ7ICsraSApIHtcbiAgICAgICAgdGhpcy53aGl0ZVZhbHVlc1sgaSBdID0gTWF0aC5yYW5kb20oKSAlIHJhbmdlTGltaXQ7XG4gICAgfVxufTtcblxuUGlua051bWJlci5wcm90b3R5cGUuZ2V0TmV4dFZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxhc3RLZXkgPSB0aGlzLmtleSxcbiAgICAgICAgc3VtID0gMDtcblxuICAgICsrdGhpcy5rZXk7XG5cbiAgICBpZiggdGhpcy5rZXkgPiB0aGlzLm1heEtleSApIHtcbiAgICAgICAgdGhpcy5rZXkgPSAwO1xuICAgIH1cblxuICAgIHZhciBkaWZmID0gdGhpcy5sYXN0S2V5IF4gdGhpcy5rZXk7XG4gICAgdmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICBpZiggZGlmZiAmICgxIDw8IGkpICkge1xuICAgICAgICAgICAgdGhpcy53aGl0ZVZhbHVlc1sgaSBdID0gTWF0aC5yYW5kb20oKSAlIHJhbmdlTGltaXQ7XG4gICAgICAgIH1cblxuICAgICAgICBzdW0gKz0gdGhpcy53aGl0ZVZhbHVlc1sgaSBdO1xuICAgIH1cblxuICAgIHJldHVybiBzdW0gLyB0aGlzLmxpbWl0O1xufTtcblxudmFyIHBpbmsgPSBuZXcgUGlua051bWJlcigpO1xucGluay5nZW5lcmF0ZSgpO1xuXG5cblxuXG5cbmV4cG9ydCBkZWZhdWx0IHtcblx0cm91bmRGcm9tRXBzaWxvbjogZnVuY3Rpb24oIG4gKSB7XG5cdFx0bGV0IHJvdW5kZWQgPSBNYXRoLnJvdW5kKCBuICk7XG5cblx0XHRpZiAoIHJvdW5kZWQgJSBuIDwgQ09ORklHLmVwc2lsb24gKSB7XG5cdFx0XHRyZXR1cm4gcm91bmRlZFxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiBuO1xuXHRcdH1cblx0fSxcblxuXHRyb3VuZFRvTXVsdGlwbGU6IGZ1bmN0aW9uKCBuLCBtdWx0aXBsZSApIHtcblx0XHRyZXR1cm4gTWF0aC5mbG9vciggKCBuICsgbXVsdGlwbGUgLSAxICkgLyBtdWx0aXBsZSApICogbXVsdGlwbGU7XG5cdH0sXG5cblx0Y2xhbXA6IGZ1bmN0aW9uKCB2YWx1ZSwgbWluLCBtYXggKSB7XG5cdFx0cmV0dXJuIE1hdGgubWluKCBtYXgsIE1hdGgubWF4KCB2YWx1ZSwgbWluICkgKTtcblx0fSxcblxuXHRzY2FsZU51bWJlcjogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICkge1xuXHRcdHJldHVybiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSApICogKCBoaWdoT3V0IC0gbG93T3V0ICkgKyBsb3dPdXQ7XG5cdH0sXG5cblx0c2NhbGVOdW1iZXJFeHA6IGZ1bmN0aW9uKCBudW0sIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCwgZXhwICkge1xuXHRcdGlmICggdHlwZW9mIGV4cCAhPT0gJ251bWJlcicgfHwgZXhwID09PSAxICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc2NhbGVOdW1iZXIoIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0ICk7XG5cdFx0fVxuXG5cdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPT09IDAgKSB7XG5cdFx0XHRyZXR1cm4gbG93T3V0O1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApID4gMCApIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiBNYXRoLnBvdyggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApLCBleHAgKSApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHJldHVybiAoIGxvd091dCArICggaGlnaE91dCAtIGxvd091dCApICogLSggTWF0aC5wb3coICggKCAtbnVtICsgbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSApLCBleHAgKSApICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdC8vIEEgdmVyeSBwb29yIGFwcHJveGltYXRpb24gb2YgYSBnYXVzc2lhbiByYW5kb20gbnVtYmVyIGdlbmVyYXRvciFcblx0Z2F1c3NpYW5SYW5kb206IGZ1bmN0aW9uKCBjeWNsZXMgKSB7XG5cdFx0Y3ljbGVzID0gY3ljbGVzIHx8IDEwO1xuXG5cdFx0dmFyIG4gPSAwLFxuXHRcdFx0aSA9IGN5Y2xlcztcblxuXHRcdHdoaWxlKCAtLWkgKSB7XG5cdFx0XHRuICs9IE1hdGgucmFuZG9tKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG4gLyBjeWNsZXM7XG5cdH0sXG5cblx0Ly8gRnJvbTpcblx0Ly8gXHRodHRwOi8vd3d3Lm1lcmVkaXRoZG9kZ2UuY29tLzIwMTIvMDUvMzAvYS1ncmVhdC1saXR0bGUtamF2YXNjcmlwdC1mdW5jdGlvbi1mb3ItZ2VuZXJhdGluZy1yYW5kb20tZ2F1c3NpYW5ub3JtYWxiZWxsLWN1cnZlLW51bWJlcnMvXG5cdG5yYW5kOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgeDEsXG5cdFx0XHR4Mixcblx0XHRcdHJhZCxcblx0XHRcdHkxO1xuXG5cdFx0ZG8ge1xuXHRcdFx0eDEgPSAyICogTWF0aC5yYW5kb20oKSAtIDE7XG5cdFx0XHR4MiA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHJhZCA9IHgxICogeDEgKyB4MiAqIHgyO1xuXHRcdH0gd2hpbGUoIHJhZCA+PSAxIHx8IHJhZCA9PT0gMCApO1xuXG5cdFx0dmFyIGMgPSBNYXRoLnNxcnQoIC0yICogTWF0aC5sb2coIHJhZCApIC8gcmFkICk7XG5cblx0XHRyZXR1cm4gKCh4MSAqIGMpIC8gNSkgKiAwLjUgKyAwLjU7XG5cdH0sXG5cblx0Z2VuZXJhdGVQaW5rTnVtYmVyOiBwaW5rLmdlbmVyYXRlLFxuXHRnZXROZXh0UGlua051bWJlcjogcGluay5nZXROZXh0VmFsdWUsXG5cbn07IiwiZXhwb3J0IGRlZmF1bHQge1xuICAgIGNsZWFuVXBJbk91dHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaW5wdXRzLFxuICAgICAgICAgICAgb3V0cHV0cztcblxuICAgICAgICBpZiggQXJyYXkuaXNBcnJheSggdGhpcy5pbnB1dHMgKSApIHtcbiAgICAgICAgICAgIGlucHV0cyA9IHRoaXMuaW5wdXRzO1xuXG4gICAgICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgICAgICBpZiggaW5wdXRzWyBpIF0gJiYgdHlwZW9mIGlucHV0c1sgaSBdLmNsZWFuVXAgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0c1sgaSBdLmNsZWFuVXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiggaW5wdXRzWyBpIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0c1sgaSBdLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpbnB1dHNbIGkgXSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuaW5wdXRzID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KCB0aGlzLm91dHB1dHMgKSApIHtcbiAgICAgICAgICAgIG91dHB1dHMgPSB0aGlzLm91dHB1dHM7XG5cbiAgICAgICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgb3V0cHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgICAgICBpZiggb3V0cHV0c1sgaSBdICYmIHR5cGVvZiBvdXRwdXRzWyBpIF0uY2xlYW5VcCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0c1sgaSBdLmNsZWFuVXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiggb3V0cHV0c1sgaSBdICkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRzWyBpIF0uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG91dHB1dHNbIGkgXSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMub3V0cHV0cyA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY2xlYW5JTzogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmKCB0aGlzLmlvICkge1xuICAgICAgICAgICAgdGhpcy5pbyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiggdGhpcy5jb250ZXh0ICkge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn07IiwiZXhwb3J0IGRlZmF1bHQge1xuICAgIGNvbm5lY3Q6IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCApIHtcbiAgICAgICAgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9QYXJhbSB8fCBub2RlIGluc3RhbmNlb2YgQXVkaW9Ob2RlICkge1xuICAgICAgICAgICAgLy8gdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0uY29ubmVjdCggbm9kZSApO1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0uY29ubmVjdC5jYWxsKCB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXSwgbm9kZSwgMCwgaW5wdXRDaGFubmVsICk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICggbm9kZSAmJiBub2RlLm91dHB1dHMgJiYgbm9kZS5vdXRwdXRzLmxlbmd0aCApIHtcbiAgICAgICAgICAgIC8vIGlmKCBub2RlLmlucHV0c1sgaW5wdXRDaGFubmVsIF0gaW5zdGFuY2VvZiBQYXJhbSApIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAnQ09OTkVDVElORyBUTyBQQVJBTScgKTtcbiAgICAgICAgICAgIC8vIG5vZGUuaW8uY29uc3RhbnREcml2ZXIuZGlzY29ubmVjdCggbm9kZS5jb250cm9sICk7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmNvbm5lY3QoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnQVNTRVJUIE5PVCBSRUFDSEVEJyApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGRpc2Nvbm5lY3Q6IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCkge1xuICAgICAgICBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb1BhcmFtIHx8IG5vZGUgaW5zdGFuY2VvZiBBdWRpb05vZGUgKSB7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXS5kaXNjb25uZWN0LmNhbGwoIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLCBub2RlLCAwLCBpbnB1dENoYW5uZWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKCBub2RlICYmIG5vZGUuaW5wdXRzICYmIG5vZGUuaW5wdXRzLmxlbmd0aCApIHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLmRpc2Nvbm5lY3QoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnQVNTRVJUIE5PVCBSRUFDSEVEJyApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgICB9XG4gICAgfVxufTsiLCJpbXBvcnQgbWF0aCBmcm9tIFwiLi9tYXRoLmVzNlwiO1xuaW1wb3J0IG5vdGVTdHJpbmdzIGZyb20gXCIuL25vdGVTdHJpbmdzLmVzNlwiO1xuaW1wb3J0IG5vdGVzIGZyb20gXCIuL25vdGVzLmVzNlwiO1xuaW1wb3J0IENPTkZJRyBmcm9tIFwiLi4vY29yZS9jb25maWcuZXM2XCI7XG5pbXBvcnQgbm90ZVJlZ0V4cCBmcm9tIFwiLi9ub3RlUmVnRXhwLmVzNlwiO1xuXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBzY2FsYXJUb0RiOiBmdW5jdGlvbiggc2NhbGFyICkge1xuICAgICAgICByZXR1cm4gMjAgKiAoIE1hdGgubG9nKCBzY2FsYXIgKSAvIE1hdGguTE4xMCApO1xuICAgIH0sXG4gICAgZGJUb1NjYWxhcjogZnVuY3Rpb24oIGRiICkge1xuICAgICAgICByZXR1cm4gTWF0aC5wb3coIDIsIGRiIC8gNiApO1xuICAgIH0sXG5cbiAgICBoelRvTUlESTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gbWF0aC5yb3VuZEZyb21FcHNpbG9uKCA2OSArIDEyICogTWF0aC5sb2cyKCB2YWx1ZSAvIDQ0MCApICk7XG4gICAgfSxcblxuICAgIGh6VG9Ob3RlOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb05vdGUoIHRoaXMuaHpUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgaHpUb01zOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIGlmICggdmFsdWUgPT09IDAgKSByZXR1cm4gMDtcbiAgICAgICAgcmV0dXJuIDEwMDAgLyB2YWx1ZTtcbiAgICB9LFxuXG4gICAgaHpUb0JQTTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5tc1RvQlBNKCB0aGlzLmh6VG9NcyggdmFsdWUgKSApO1xuICAgIH0sXG5cblxuXG4gICAgbWlkaVRvSHo6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KCAyLCAoIHZhbHVlIC0gNjkgKSAvIDEyICkgKiA0NDA7XG4gICAgfSxcblxuICAgIG1pZGlUb05vdGU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgbGV0IHZhbHVlcyA9ICggdmFsdWUgKyAnJyApLnNwbGl0KCAnLicgKSxcbiAgICAgICAgICAgIG5vdGVWYWx1ZSA9ICt2YWx1ZXNbIDAgXSxcbiAgICAgICAgICAgIGNlbnRzID0gKCB2YWx1ZXNbIDEgXSA/IHBhcnNlRmxvYXQoICcwLicgKyB2YWx1ZXNbIDEgXSwgMTAgKSA6IDAgKSAqIDEwMDtcblxuICAgICAgICBpZiAoIE1hdGguYWJzKCBjZW50cyApID49IDEwMCApIHtcbiAgICAgICAgICAgIG5vdGVWYWx1ZSArPSBjZW50cyAlIDEwMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByb290ID0gbm90ZVZhbHVlICUgMTIgfCAwLFxuICAgICAgICAgICAgb2N0YXZlID0gbm90ZVZhbHVlIC8gMTIgfCAwLFxuICAgICAgICAgICAgbm90ZU5hbWUgPSBub3RlU3RyaW5nc1sgcm9vdCBdO1xuXG4gICAgICAgIHJldHVybiBub3RlTmFtZSArICggb2N0YXZlICsgQ09ORklHLmxvd2VzdE9jdGF2ZSApICsgKCBjZW50cyA/ICcrJyArIGNlbnRzIDogJycgKTtcbiAgICB9LFxuXG4gICAgbWlkaVRvTXM6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaHpUb01zKCB0aGlzLm1pZGlUb0h6KCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIG1pZGlUb0JQTTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5tc1RvQlBNKCB0aGlzLm1pZGlUb01zKCB2YWx1ZSApICk7XG4gICAgfSxcblxuXG5cbiAgICBub3RlVG9IejogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9IeiggdGhpcy5ub3RlVG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIG5vdGVUb01JREk6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgbGV0IG1hdGNoZXMgPSBub3RlUmVnRXhwLmV4ZWMoIHZhbHVlICksXG4gICAgICAgICAgICBub3RlLCBhY2NpZGVudGFsLCBvY3RhdmUsIGNlbnRzLFxuICAgICAgICAgICAgbm90ZVZhbHVlO1xuXG4gICAgICAgIGlmICggIW1hdGNoZXMgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdJbnZhbGlkIG5vdGUgZm9ybWF0OicsIHZhbHVlICk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBub3RlID0gbWF0Y2hlc1sgMSBdO1xuICAgICAgICBhY2NpZGVudGFsID0gbWF0Y2hlc1sgMiBdO1xuICAgICAgICBvY3RhdmUgPSBwYXJzZUludCggbWF0Y2hlc1sgMyBdLCAxMCApICsgLUNPTkZJRy5sb3dlc3RPY3RhdmU7XG4gICAgICAgIGNlbnRzID0gcGFyc2VGbG9hdCggbWF0Y2hlc1sgNCBdICkgfHwgMDtcblxuICAgICAgICBub3RlVmFsdWUgPSBub3Rlc1sgbm90ZSArIGFjY2lkZW50YWwgXTtcblxuICAgICAgICByZXR1cm4gbWF0aC5yb3VuZEZyb21FcHNpbG9uKCBub3RlVmFsdWUgKyAoIG9jdGF2ZSAqIDEyICkgKyAoIGNlbnRzICogMC4wMSApICk7XG4gICAgfSxcblxuICAgIG5vdGVUb01zOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb01zKCB0aGlzLm5vdGVUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbm90ZVRvQlBNOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb0JQTSggdGhpcy5ub3RlVG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuXG5cbiAgICBtc1RvSHo6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaHpUb01zKCB2YWx1ZSApO1xuICAgIH0sXG5cbiAgICBtc1RvTm90ZTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9NcyggdGhpcy5ub3RlVG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIG1zVG9NSURJOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmh6VG9NSURJKCB0aGlzLm1zVG9IeiggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBtc1RvQlBNOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IDAgOiA2MDAwMCAvIHZhbHVlO1xuICAgIH0sXG5cblxuXG4gICAgYnBtVG9IejogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5tc1RvSHooIHRoaXMuYnBtVG9NcyggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBicG1Ub05vdGU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvQlBNKCB0aGlzLm5vdGVUb01JREkoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgYnBtVG9NSURJOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zVG9NSURJKCB0aGlzLmJwbVRvTXMoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgYnBtVG9NczogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5tc1RvQlBNKCB2YWx1ZSApO1xuICAgIH1cbn07IiwiaW1wb3J0IENPTkZJRyBmcm9tIFwiLi4vY29yZS9jb25maWcuZXM2XCI7XG5cbmZ1bmN0aW9uIFBpbmtOdW1iZXIoKSB7XG4gICAgdGhpcy5tYXhLZXkgPSAweDFmO1xuICAgIHRoaXMua2V5ID0gMDtcbiAgICB0aGlzLndoaXRlVmFsdWVzID0gW107XG4gICAgdGhpcy5yYW5nZSA9IDEyODtcbiAgICB0aGlzLmxpbWl0ID0gNTtcblxuICAgIHRoaXMuZ2VuZXJhdGUgPSB0aGlzLmdlbmVyYXRlLmJpbmQoIHRoaXMgKTtcbiAgICB0aGlzLmdldE5leHRWYWx1ZSA9IHRoaXMuZ2V0TmV4dFZhbHVlLmJpbmQoIHRoaXMgKTtcbn1cblxuUGlua051bWJlci5wcm90b3R5cGUuZ2VuZXJhdGUgPSBmdW5jdGlvbiggcmFuZ2UsIGxpbWl0ICkge1xuICAgIHRoaXMucmFuZ2UgPSByYW5nZSB8fCAxMjg7XG4gICAgdGhpcy5tYXhLZXkgPSAweDFmO1xuICAgIHRoaXMua2V5ID0gMDtcbiAgICB0aGlzLmxpbWl0ID0gbGltaXQgfHwgMTtcblxuXHR2YXIgcmFuZ2VMaW1pdCA9IHRoaXMucmFuZ2UgLyB0aGlzLmxpbWl0O1xuXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbWl0OyArK2kgKSB7XG4gICAgICAgIHRoaXMud2hpdGVWYWx1ZXNbIGkgXSA9IE1hdGgucmFuZG9tKCkgJSByYW5nZUxpbWl0O1xuICAgIH1cbn07XG5cblBpbmtOdW1iZXIucHJvdG90eXBlLmdldE5leHRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsYXN0S2V5ID0gdGhpcy5rZXksXG4gICAgICAgIHN1bSA9IDA7XG5cbiAgICArK3RoaXMua2V5O1xuXG4gICAgaWYoIHRoaXMua2V5ID4gdGhpcy5tYXhLZXkgKSB7XG4gICAgICAgIHRoaXMua2V5ID0gMDtcbiAgICB9XG5cbiAgICB2YXIgZGlmZiA9IHRoaXMubGFzdEtleSBeIHRoaXMua2V5O1xuICAgIHZhciByYW5nZUxpbWl0ID0gdGhpcy5yYW5nZSAvIHRoaXMubGltaXQ7XG5cbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubGltaXQ7ICsraSApIHtcbiAgICAgICAgaWYoIGRpZmYgJiAoMSA8PCBpKSApIHtcbiAgICAgICAgICAgIHRoaXMud2hpdGVWYWx1ZXNbIGkgXSA9IE1hdGgucmFuZG9tKCkgJSByYW5nZUxpbWl0O1xuICAgICAgICB9XG5cbiAgICAgICAgc3VtICs9IHRoaXMud2hpdGVWYWx1ZXNbIGkgXTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3VtIC8gdGhpcy5saW1pdDtcbn07XG5cbnZhciBwaW5rID0gbmV3IFBpbmtOdW1iZXIoKTtcbnBpbmsuZ2VuZXJhdGUoKTtcblxuXG5cblxuXG5leHBvcnQgZGVmYXVsdCB7XG5cdHJvdW5kRnJvbUVwc2lsb246IGZ1bmN0aW9uKCBuICkge1xuXHRcdGxldCByb3VuZGVkID0gTWF0aC5yb3VuZCggbiApO1xuXG5cdFx0aWYgKCByb3VuZGVkICUgbiA8IENPTkZJRy5lcHNpbG9uICkge1xuXHRcdFx0cmV0dXJuIHJvdW5kZWRcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4gbjtcblx0XHR9XG5cdH0sXG5cblx0cm91bmRUb011bHRpcGxlOiBmdW5jdGlvbiggbiwgbXVsdGlwbGUgKSB7XG5cdFx0cmV0dXJuIE1hdGguZmxvb3IoICggbiArIG11bHRpcGxlIC0gMSApIC8gbXVsdGlwbGUgKSAqIG11bHRpcGxlO1xuXHR9LFxuXG5cdGNsYW1wOiBmdW5jdGlvbiggdmFsdWUsIG1pbiwgbWF4ICkge1xuXHRcdHJldHVybiBNYXRoLm1pbiggbWF4LCBNYXRoLm1heCggdmFsdWUsIG1pbiApICk7XG5cdH0sXG5cblx0c2NhbGVOdW1iZXI6IGZ1bmN0aW9uKCBudW0sIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCApIHtcblx0XHRyZXR1cm4gKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgKSAqICggaGlnaE91dCAtIGxvd091dCApICsgbG93T3V0O1xuXHR9LFxuXG5cdHNjYWxlTnVtYmVyRXhwOiBmdW5jdGlvbiggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQsIGV4cCApIHtcblx0XHRpZiAoIHR5cGVvZiBleHAgIT09ICdudW1iZXInIHx8IGV4cCA9PT0gMSApIHtcblx0XHRcdHJldHVybiB0aGlzLnNjYWxlTnVtYmVyKCBudW0sIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCApO1xuXHRcdH1cblxuXHRcdGlmICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApID09PSAwICkge1xuXHRcdFx0cmV0dXJuIGxvd091dDtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSA+IDAgKSB7XG5cdFx0XHRcdHJldHVybiAoIGxvd091dCArICggaGlnaE91dCAtIGxvd091dCApICogTWF0aC5wb3coICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSwgZXhwICkgKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gKCBsb3dPdXQgKyAoIGhpZ2hPdXQgLSBsb3dPdXQgKSAqIC0oIE1hdGgucG93KCAoICggLW51bSArIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgKSwgZXhwICkgKSApO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHQvLyBBIHZlcnkgcG9vciBhcHByb3hpbWF0aW9uIG9mIGEgZ2F1c3NpYW4gcmFuZG9tIG51bWJlciBnZW5lcmF0b3IhXG5cdGdhdXNzaWFuUmFuZG9tOiBmdW5jdGlvbiggY3ljbGVzICkge1xuXHRcdGN5Y2xlcyA9IGN5Y2xlcyB8fCAxMDtcblxuXHRcdHZhciBuID0gMCxcblx0XHRcdGkgPSBjeWNsZXM7XG5cblx0XHR3aGlsZSggLS1pICkge1xuXHRcdFx0biArPSBNYXRoLnJhbmRvbSgpO1xuXHRcdH1cblxuXHRcdHJldHVybiBuIC8gY3ljbGVzO1xuXHR9LFxuXG5cdC8vIEZyb206XG5cdC8vIFx0aHR0cDovL3d3dy5tZXJlZGl0aGRvZGdlLmNvbS8yMDEyLzA1LzMwL2EtZ3JlYXQtbGl0dGxlLWphdmFzY3JpcHQtZnVuY3Rpb24tZm9yLWdlbmVyYXRpbmctcmFuZG9tLWdhdXNzaWFubm9ybWFsYmVsbC1jdXJ2ZS1udW1iZXJzL1xuXHRucmFuZDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHgxLFxuXHRcdFx0eDIsXG5cdFx0XHRyYWQsXG5cdFx0XHR5MTtcblxuXHRcdGRvIHtcblx0XHRcdHgxID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuXHRcdFx0eDIgPSAyICogTWF0aC5yYW5kb20oKSAtIDE7XG5cdFx0XHRyYWQgPSB4MSAqIHgxICsgeDIgKiB4Mjtcblx0XHR9IHdoaWxlKCByYWQgPj0gMSB8fCByYWQgPT09IDAgKTtcblxuXHRcdHZhciBjID0gTWF0aC5zcXJ0KCAtMiAqIE1hdGgubG9nKCByYWQgKSAvIHJhZCApO1xuXG5cdFx0cmV0dXJuICgoeDEgKiBjKSAvIDUpICogMC41ICsgMC41O1xuXHR9LFxuXG5cdGdlbmVyYXRlUGlua051bWJlcjogcGluay5nZW5lcmF0ZSxcblx0Z2V0TmV4dFBpbmtOdW1iZXI6IHBpbmsuZ2V0TmV4dFZhbHVlLFxuXG59OyIsImV4cG9ydCBkZWZhdWx0IC9eKFtBfEJ8Q3xEfEV8RnxHXXsxfSkoWyNieF17MCwyfSkoW1xcLVxcK10/XFxkKyk/KFtcXCt8XFwtXXsxfVxcZCouXFxkKik/LzsiLCJleHBvcnQgZGVmYXVsdCBbICdDJywgJ0MjJywgJ0QnLCAnRCMnLCAnRScsICdGJywgJ0YjJywgJ0cnLCAnRyMnLCAnQScsICdBIycsICdCJyBdOyIsImV4cG9ydCBkZWZhdWx0IHtcbiAgICAnQyc6IDAsICAgICAnRGJiJzogMCwgICAnQiMnOiAwLFxuICAgICdDIyc6IDEsICAgICdEYic6IDEsICAgICdCIyMnOiAxLCAgICdCeCc6IDEsXG4gICAgJ0QnOiAyLCAgICAgJ0ViYic6IDIsICAgJ0MjIyc6IDIsICAgJ0N4JzogMixcbiAgICAnRCMnOiAzLCAgICAnRWInOiAzLCAgICAnRmJiJzogMyxcbiAgICAnRSc6IDQsICAgICAnRmInOiA0LCAgICAnRCMjJzogNCwgICAnRHgnOiA0LFxuICAgICdGJzogNSwgICAgICdHYmInOiA1LCAgICdFIyc6IDUsXG4gICAgJ0YjJzogNiwgICAgJ0diJzogNiwgICAgJ0UjIyc6IDYsICAgJ0V4JzogNixcbiAgICAnRyc6IDcsICAgICAnQWJiJzogNywgICAnRiMjJzogNywgICdGeCc6IDcsXG4gICAgJ0cjJzogOCwgICAgJ0FiJzogOCxcbiAgICAnQSc6IDksICAgICAnQmJiJzogOSwgICAnRyMjJzogOSwgICdHeCc6IDksXG4gICAgJ0EjJzogMTAsICAgJ0JiJzogMTAsICAgJ0NiYic6IDEwLFxuICAgICdCJzogMTEsICAgICdDYic6IDExLCAgICdBIyMnOiAxMSwgJ0F4JzogMTFcbn07IiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gX3NldElPKCBpbyApIHtcbiAgICB0aGlzLmlvID0gaW87XG4gICAgdGhpcy5jb250ZXh0ID0gaW8uY29udGV4dDtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcbmltcG9ydCBtYXRoIGZyb20gXCIuLi9taXhpbnMvbWF0aC5lczZcIjtcblxuXG52YXIgQlVGRkVSUyA9IG5ldyBXZWFrTWFwKCk7XG5cbmNsYXNzIE5vaXNlT3NjaWxsYXRvciBleHRlbmRzIE5vZGUge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCggdGhpcyApLFxuICAgICAgICAgICAgdHlwZXMgPSB0aGlzLmNvbnN0cnVjdG9yLnR5cGVzLFxuICAgICAgICAgICAgdHlwZUtleXMgPSBPYmplY3Qua2V5cyggdHlwZXMgKSxcbiAgICAgICAgICAgIGJ1ZmZlcnMgPSB0aGlzLl9nZXRCdWZmZXJzKCk7XG5cbiAgICAgICAgZ3JhcGguYnVmZmVyU291cmNlcyA9IFtdO1xuICAgICAgICBncmFwaC5vdXRwdXRHYWluID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZ3JhcGguc3dpdGNoID0gdGhpcy5pby5jcmVhdGVTd2l0Y2goIE9iamVjdC5rZXlzKCB0eXBlcyApLmxlbmd0aCwgMCApO1xuICAgICAgICBncmFwaC5vdXRwdXRHYWluLmdhaW4udmFsdWUgPSAwO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdHlwZUtleXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpLFxuICAgICAgICAgICAgICAgIGJ1ZmZlciA9IGJ1ZmZlcnNbIHR5cGVLZXlzWyBpIF0gXTtcblxuICAgICAgICAgICAgc291cmNlLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgICAgIHNvdXJjZS5sb29wID0gdHJ1ZTtcbiAgICAgICAgICAgIHNvdXJjZS5zdGFydCggMCApO1xuXG4gICAgICAgICAgICBzb3VyY2UuY29ubmVjdCggZ3JhcGguc3dpdGNoLCAwLCBpICk7XG4gICAgICAgICAgICBncmFwaC5idWZmZXJTb3VyY2VzLnB1c2goIHNvdXJjZSApO1xuICAgICAgICB9XG5cbiAgICAgICAgZ3JhcGguc3dpdGNoLmNvbm5lY3QoIGdyYXBoLm91dHB1dEdhaW4gKTtcbiAgICAgICAgZ3JhcGgub3V0cHV0R2Fpbi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudHlwZSA9IGdyYXBoLnN3aXRjaC5jb250cm9sO1xuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIF9jcmVhdGVTaW5nbGVCdWZmZXIoIHR5cGUgKSB7XG4gICAgICAgIHZhciBzYW1wbGVSYXRlID0gdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUsXG4gICAgICAgICAgICBidWZmZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyKCAxLCBzYW1wbGVSYXRlLCBzYW1wbGVSYXRlICksXG4gICAgICAgICAgICBjaGFubmVsID0gYnVmZmVyLmdldENoYW5uZWxEYXRhKCAwICksXG4gICAgICAgICAgICBmbjtcblxuICAgICAgICBzd2l0Y2goIHR5cGUgKSB7XG4gICAgICAgICAgICBjYXNlICdXSElURSc6XG4gICAgICAgICAgICAgICAgZm4gPSBNYXRoLnJhbmRvbTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnR0FVU1NJQU5fV0hJVEUnOlxuICAgICAgICAgICAgICAgIGZuID0gbWF0aC5ucmFuZDtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnUElOSyc6XG4gICAgICAgICAgICAgICAgbWF0aC5nZW5lcmF0ZVBpbmtOdW1iZXIoIDEyOCwgNSApO1xuICAgICAgICAgICAgICAgIGZuID0gbWF0aC5nZXROZXh0UGlua051bWJlcjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgc2FtcGxlUmF0ZTsgKytpICkge1xuICAgICAgICAgICAgY2hhbm5lbFsgaSBdID0gZm4oKSAqIDIgLSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coIHR5cGUsIE1hdGgubWluLmFwcGx5KCBNYXRoLCBjaGFubmVsICksIE1hdGgubWF4LmFwcGx5KCBNYXRoLCBjaGFubmVsICkgKTtcblxuICAgICAgICByZXR1cm4gYnVmZmVyO1xuICAgIH1cblxuICAgIF9jcmVhdGVCdWZmZXJzKCkge1xuICAgICAgICB2YXIgYnVmZmVycyA9IHt9LFxuICAgICAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKCBidWZmZXJzICksXG4gICAgICAgICAgICB0eXBlcyA9IHRoaXMuY29uc3RydWN0b3IudHlwZXMsXG4gICAgICAgICAgICB0eXBlS2V5cyA9IE9iamVjdC5rZXlzKCB0eXBlcyApLFxuICAgICAgICAgICAgYnVmZmVyO1xuXG4gICAgICAgIC8vIEJ1ZmZlcnMgYWxyZWFkeSBjcmVhdGVkLiBTdG9wIGhlcmUuXG4gICAgICAgIGlmKCBrZXlzLmxlbmd0aCAhPT0gMCApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdHlwZUtleXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICBidWZmZXJzWyB0eXBlS2V5c1sgaSBdIF0gPSB0aGlzLl9jcmVhdGVTaW5nbGVCdWZmZXIoIHR5cGVLZXlzWyBpIF0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3NldEJ1ZmZlcnMoIGJ1ZmZlcnMgKTtcbiAgICB9XG5cbiAgICBfZ2V0QnVmZmVycygpIHtcbiAgICAgICAgdmFyIGJ1ZmZlcnMgPSBCVUZGRVJTLmdldCggdGhpcy5pbyApO1xuXG4gICAgICAgIGlmKCBidWZmZXJzID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVCdWZmZXJzKCk7XG4gICAgICAgICAgICBidWZmZXJzID0gQlVGRkVSUy5nZXQoIHRoaXMuaW8gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBidWZmZXJzO1xuICAgIH1cblxuICAgIF9zZXRCdWZmZXJzKCBidWZmZXJzICkge1xuICAgICAgICBCVUZGRVJTLnNldCggdGhpcy5pbywgYnVmZmVycyApO1xuICAgIH1cblxuICAgIHN0YXJ0KCB0aW1lICkge1xuICAgICAgICB2YXIgb3V0cHV0R2FpbiA9IHRoaXMuZ2V0R3JhcGgoIHRoaXMgKS5vdXRwdXRHYWluO1xuXG4gICAgICAgIHRpbWUgPSB0aW1lIHx8IHRoaXMuY29udGV4dC5jdXJyZW50VGltZTtcbiAgICAgICAgb3V0cHV0R2Fpbi5nYWluLnZhbHVlID0gMTtcbiAgICB9XG5cbiAgICBzdG9wKCB0aW1lICkge1xuICAgICAgICB2YXIgb3V0cHV0R2FpbiA9IHRoaXMuZ2V0R3JhcGgoIHRoaXMgKS5vdXRwdXRHYWluO1xuXG4gICAgICAgIHRpbWUgPSB0aW1lIHx8IHRoaXMuY29udGV4dC5jdXJyZW50VGltZTtcbiAgICAgICAgb3V0cHV0R2Fpbi5nYWluLnZhbHVlID0gMDtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cblxuXG5Ob2lzZU9zY2lsbGF0b3IudHlwZXMgPSB7XG4gICAgV0hJVEU6IDAsXG4gICAgR0FVU1NJQU5fV0hJVEU6IDEsXG4gICAgUElOSzogMlxufTtcblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOb2lzZU9zY2lsbGF0b3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE5vaXNlT3NjaWxsYXRvciggdGhpcyApO1xufTsiXX0=
