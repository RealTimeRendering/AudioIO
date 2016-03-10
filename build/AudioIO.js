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
// Need to override existing .connect functions
// for native AudioParams and AudioNodes...
// I don't like doing this, but s'gotta be done :(
"use strict";

(function () {
    var originalAudioNodeConnect = AudioNode.prototype.connect;

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

},{"../core/AudioIO.es6":1,"../graphs/DryWetNode.es6":15}],11:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../graphs/DryWetNode.es6":15,"../mixins/cleaners.es6":62,"../mixins/connections.es6":63,"../mixins/setIO.es6":69,"./Delay.es6":10}],12:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],15:[function(require,module,exports){
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
        this.dryWetControl = this.io.createParam(dryWetValue);
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/cleaners.es6":62,"../mixins/connections.es6":63,"../mixins/setIO.es6":69}],16:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],17:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var EnvelopeFollower = (function (_Node) {

    /**
     * @param {Object} io Instance of AudioIO.
     */

    function EnvelopeFollower(io) {
        var accuracy = arguments[1] === undefined ? 10 : arguments[1];

        _classCallCheck(this, EnvelopeFollower);

        _Node.call(this, io, 1, 1);

        this.divisor = this.io.createConstant(0.693147, this.context.sampleRate * 0.5);
        this.SampleDelay = this.io.createSampleDelay();
        this.greaterThanZero = this.io.createGreaterThanZero();
        this.multiply = this.io.createMultiply();
        this["switch"] = this.io.createSwitch(2, 0);
        this.add = this.io.createAdd();

        this.subtract = this.io.createSubtract();
        this.inputs[0].connect(this.subtract, 0, 0);
        this.SampleDelay.connect(this.subtract, 0, 1);
        this.SampleDelay.connect(this.add, 0, 0);
        this.add.connect(this.SampleDelay);

        this.subtract.connect(this.multiply, 0, 0);
        this.subtract.connect(this.greaterThanZero);

        this.controls.up = this.io.createParam();
        this.controls.down = this.io.createParam();

        // Up flow.
        this.upMin = this.io.createMin(1);
        this.upDivide = this.io.createDivide();
        this.divisor.connect(this.upDivide, 0, 0);
        this.upMin.connect(this.upDivide, 0, 1);
        this.upDivide.connect(this["switch"].inputs[0]);

        // down flow
        this.downMin = this.io.createMin(1);
        this.downDivide = this.io.createDivide();
        this.divisor.connect(this.downDivide, 0, 0);
        this.downMin.connect(this.downDivide, 0, 1);
        this.downDivide.connect(this["switch"].inputs[1]);

        // this.greaterThanZero.connect( this.switch.control );
        this["switch"].connect(this.multiply, 0, 1);
        this.multiply.connect(this.add, 0, 1);

        this.add.connect(this.outputs[0]);
    }

    _inherits(EnvelopeFollower, _Node);

    EnvelopeFollower.prototype.cleanUp = function cleanUp() {
        _Node.prototype.cleanUp.call(this);
    };

    return EnvelopeFollower;
})(_coreNodeEs62["default"]);

AudioIO.prototype.createEnvelopeFollower = function (accuracy) {
    return new EnvelopeFollower(this, accuracy);
};

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

require('./graphs/DryWetNode.es6');

require('./graphs/PhaseOffset.es6');

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

// import './graphs/ReverbEarlyDiffusion.es6';
// import './graphs/ReverbLateDiffusion.es6';

// import './graphs/ParabolicSaturation.es6';

require('./graphs/OscillatorBank.es6');

require('./graphs/EnvelopeFollower.es6');

require('./graphs/Counter.es6');

window.AudioContext = window.AudioContext || window.webkitAudioContext;

// import './graphs/Sketch.es6';

window.Param = _coreParamEs62['default'];
window.Node = _coreNodeEs62['default'];

},{"./core/AudioIO.es6":1,"./core/Node.es6":2,"./core/Param.es6":3,"./core/WaveShaper.es6":4,"./envelopes/ASDREnvelope.es6":8,"./envelopes/CustomEnvelope.es6":9,"./fx/Delay.es6":10,"./fx/PingPongDelay.es6":11,"./generators/OscillatorGenerator.es6":12,"./graphs/Counter.es6":13,"./graphs/DiffuseDelay.es6":14,"./graphs/DryWetNode.es6":15,"./graphs/EQShelf.es6":16,"./graphs/EnvelopeFollower.es6":17,"./graphs/OscillatorBank.es6":18,"./graphs/PhaseOffset.es6":19,"./instruments/GeneratorPlayer.es6":20,"./math/Abs.es6":22,"./math/Add.es6":23,"./math/Average.es6":24,"./math/Clamp.es6":25,"./math/Constant.es6":26,"./math/Divide.es6":27,"./math/Floor.es6":28,"./math/Lerp.es6":29,"./math/Max.es6":30,"./math/Min.es6":31,"./math/Multiply.es6":32,"./math/Negate.es6":33,"./math/Pow.es6":34,"./math/Reciprocal.es6":35,"./math/Round.es6":36,"./math/SampleDelay.es6":37,"./math/Scale.es6":38,"./math/ScaleExp.es6":39,"./math/Sign.es6":40,"./math/Sqrt.es6":41,"./math/Square.es6":42,"./math/Subtract.es6":43,"./math/Switch.es6":44,"./math/logical-operators/AND.es6":45,"./math/logical-operators/LogicalOperator.es6":46,"./math/logical-operators/NOT.es6":47,"./math/logical-operators/OR.es6":48,"./math/relational-operators/EqualTo.es6":49,"./math/relational-operators/EqualToZero.es6":50,"./math/relational-operators/GreaterThan.es6":51,"./math/relational-operators/GreaterThanZero.es6":52,"./math/relational-operators/IfElse.es6":53,"./math/relational-operators/LessThan.es6":54,"./math/relational-operators/LessThanZero.es6":55,"./math/trigonometry/Cos.es6":56,"./math/trigonometry/DegToRad.es6":57,"./math/trigonometry/RadToDeg.es6":58,"./math/trigonometry/Sine.es6":59,"./math/trigonometry/Tan.es6":60}],22:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],29:[function(require,module,exports){
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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],37:[function(require,module,exports){
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

},{"../../core/AudioIO.es6":1,"../../core/Node.es6":2}],60:[function(require,module,exports){
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

    disconnect: function disconnect(node, outputChannel, inputChannel) {}
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

},{}]},{},[21])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9jb3JlL0F1ZGlvSU8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvY29yZS9Ob2RlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvUGFyYW0uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvY29yZS9XYXZlU2hhcGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvY29uZmlnLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvb3ZlcnJpZGVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2NvcmUvc2lnbmFsQ3VydmVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2VudmVsb3Blcy9BU0RSRW52ZWxvcGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZW52ZWxvcGVzL0N1c3RvbUVudmVsb3BlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L0RlbGF5LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2Z4L1BpbmdQb25nRGVsYXkuZXM2LmpzIiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ2VuZXJhdG9ycy9Pc2NpbGxhdG9yR2VuZXJhdG9yLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9Db3VudGVyLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9EaWZmdXNlRGVsYXkuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL0RyeVdldE5vZGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL0VRU2hlbGYuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL0VudmVsb3BlRm9sbG93ZXIuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvZ3JhcGhzL09zY2lsbGF0b3JCYW5rLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL2dyYXBocy9QaGFzZU9mZnNldC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9pbnN0cnVtZW50cy9HZW5lcmF0b3JQbGF5ZXIuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWFpbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0Ficy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0FkZC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0F2ZXJhZ2UuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9DbGFtcC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL0NvbnN0YW50LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvRGl2aWRlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvRmxvb3IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9MZXJwLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvTWF4LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvTWluLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvTXVsdGlwbHkuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9OZWdhdGUuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9Qb3cuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9SZWNpcHJvY2FsLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvUm91bmQuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TYW1wbGVEZWxheS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1NjYWxlLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU2NhbGVFeHAuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9TaWduLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU3FydC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1NxdWFyZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL1N1YnRyYWN0LmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvU3dpdGNoLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvQU5ELmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTG9naWNhbE9wZXJhdG9yLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTk9ULmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvT1IuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9FcXVhbFRvLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvRXF1YWxUb1plcm8uZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0dyZWF0ZXJUaGFuWmVyby5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0lmRWxzZS5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvTGVzc1RoYW5aZXJvLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L0Nvcy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9EZWdUb1JhZC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9SYWRUb0RlZy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9tYXRoL3RyaWdvbm9tZXRyeS9TaW5lLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21hdGgvdHJpZ29ub21ldHJ5L1Rhbi5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvTWF0aC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvY2xlYW5lcnMuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL2Nvbm5lY3Rpb25zLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9jb252ZXJzaW9ucy5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvbWF0aC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvbm90ZVJlZ0V4cC5lczYiLCIvVm9sdW1lcy9Ecml2ZSAxL0Rldi9hdWRpby9hdWRpby5pby1yZXBvL3NyYy9taXhpbnMvbm90ZVN0cmluZ3MuZXM2IiwiL1ZvbHVtZXMvRHJpdmUgMS9EZXYvYXVkaW8vYXVkaW8uaW8tcmVwby9zcmMvbWl4aW5zL25vdGVzLmVzNiIsIi9Wb2x1bWVzL0RyaXZlIDEvRGV2L2F1ZGlvL2F1ZGlvLmlvLXJlcG8vc3JjL21peGlucy9zZXRJTy5lczYiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7O3lCQ0FtQixjQUFjOzs7O1FBQzFCLGlCQUFpQjs7K0JBQ0Msb0JBQW9COzs7O29DQUNyQiwyQkFBMkI7Ozs7NkJBQ2xDLG9CQUFvQjs7OztJQUUvQixPQUFPO0FBZUUsYUFmVCxPQUFPLEdBZW1DO1lBQS9CLE9BQU8sZ0NBQUcsSUFBSSxZQUFZLEVBQUU7OzhCQWZ2QyxPQUFPOztBQWdCTCxZQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQzs7QUFFeEIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQzs7Ozs7Ozs7OztBQVV4QyxjQUFNLENBQUMsY0FBYyxDQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtBQUMzQyxxQkFBUyxFQUFFLEtBQUs7QUFDaEIsZUFBRyxFQUFJLENBQUEsWUFBVztBQUNkLG9CQUFJLGNBQWMsWUFBQSxDQUFDOztBQUVuQix1QkFBTyxZQUFXO0FBQ2Qsd0JBQUssQ0FBQyxjQUFjLElBQUksY0FBYyxDQUFDLE9BQU8sS0FBSyxJ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SSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLFFBQVEsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7O0FBRXJFLFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQzdCLFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQzs7QUFFcEMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDO0FBQ3BDLFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQztBQUNwQyxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFFLENBQUM7O0FBRXBDLFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUUsS0FBSyxDQUFFLENBQUM7QUFDaEQsWUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBRSxDQUFDO0FBQ3BDLFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFFLENBQUM7QUFDNUMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDN0MsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRTdDLFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztLQUMzQzs7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QUUsQ0FBQyxDQUFFLENBQUM7QUFDM0MsWUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDOztBQUVyQyxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM3QyxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsZUFBZSxDQUFFLENBQUM7O0FBRTlDLFlBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDekMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7O0FBRzNDLFlBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxDQUFFLENBQUM7QUFDcEMsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ3ZDLFlBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLElBQUksVUFBTyxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOzs7QUFHakQsWUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLENBQUUsQ0FBQztBQUN0QyxZQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDekMsWUFBSSxDQUFDLE9BQU8sQ0FB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QztBQUN2QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBR3ZDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHNUMsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUd2QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1QyxZQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzFDLFlBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHdkMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDNUMsWUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUcxQyxZQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBR3ZDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHMUMsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUd2QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1QyxZQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzFDLFlBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHdkMsWUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFD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QUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDdkMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUd2QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzVDLFlBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHdkMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDNUMsWUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUcxQyxZQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBR3ZDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHMUMsWUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUd2QyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUM1QyxZQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBRzFDLFlBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHdkMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDNUMsWUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7OztBQUcxQyxZQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7O0FBR3ZDLFlBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENB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QUssRUFBRSxDQUFDLEVBQUksSUFBSSxFQUFFLENBQUM7QUFDL0IsUUFBSSxFQUFFLENBQUMsRUFBSyxJQUFJLEVBQUUsQ0FBQyxFQUFLLEtBQUssRUFBRSxDQUFDLEVBQUksSUFBSSxFQUFFLENBQUM7QUFDM0MsT0FBRyxFQUFFLENBQUMsRUFBTSxLQUFLLEVBQUUsQ0FBQyxFQUFJLEtBQUssRUFBRSxDQUFDLEVBQUcsSUFBSSxFQUFFLENBQUM7QUFDMUMsUUFBSSxFQUFFLENBQUMsRUFBSyxJQUFJLEVBQUUsQ0FBQztBQUNuQixPQUFHLEVBQUUsQ0FBQyxFQUFNLEtBQUssRUFBRSxDQUFDLEVBQUksS0FBSyxFQUFFLENBQUMsRUFBRyxJQUFJLEVBQUUsQ0FBQztBQUMxQyxRQUFJLEVBQUUsRUFBRSxFQUFJLElBQUksRUFBRSxFQUFFLEVBQUksS0FBSyxFQUFFLEVBQUU7QUFDakMsT0FBRyxFQUFFLEVBQUUsRUFBSyxJQUFJLEVBQUUsRUFBRSxFQUFJLEtBQUssRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUU7Q0FDOUM7Ozs7Ozs7cUJDYnVCLE1BQU07O0FBQWYsU0FBUyxNQUFNLENBQUUsRUFBRSxFQUFHO0FBQ2pDLFFBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0FBQ2IsUUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO0NBQzdCOztBQUFBLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IENPTkZJRyBmcm9tICcuL2NvbmZpZy5lczYnO1xuaW1wb3J0ICcuL292ZXJyaWRlcy5lczYnO1xuaW1wb3J0IHNpZ25hbEN1cnZlcyBmcm9tICcuL3NpZ25hbEN1cnZlcy5lczYnO1xuaW1wb3J0IGNvbnZlcnNpb25zIGZyb20gJy4uL21peGlucy9jb252ZXJzaW9ucy5lczYnO1xuaW1wb3J0IG1hdGggZnJvbSAnLi4vbWl4aW5zL21hdGguZXM2JztcblxuY2xhc3MgQXVkaW9JTyB7XG5cbiAgICBzdGF0aWMgbWl4aW4oIHRhcmdldCwgc291cmNlICkge1xuICAgICAgICBmb3IgKCBsZXQgaSBpbiBzb3VyY2UgKSB7XG4gICAgICAgICAgICBpZiAoIHNvdXJjZS5oYXNPd25Qcm9wZXJ0eSggaSApICkge1xuICAgICAgICAgICAgICAgIHRhcmdldFsgaSBdID0gc291cmNlWyBpIF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgbWl4aW5TaW5nbGUoIHRhcmdldCwgc291cmNlLCBuYW1lICkge1xuICAgICAgICB0YXJnZXRbIG5hbWUgXSA9IHNvdXJjZTtcbiAgICB9XG5cblxuICAgIGNvbnN0cnVjdG9yKCBjb250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpICkge1xuICAgICAgICB0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcblxuICAgICAgICB0aGlzLm1hc3RlciA9IHRoaXMuX2NvbnRleHQuZGVzdGluYXRpb247XG5cbiAgICAgICAgLy8gQ3JlYXRlIGFuIGFsd2F5cy1vbiAnZHJpdmVyJyBub2RlIHRoYXQgY29uc3RhbnRseSBvdXRwdXRzIGEgdmFsdWVcbiAgICAgICAgLy8gb2YgMS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gSXQncyB1c2VkIGJ5IGEgZmFpciBmZXcgbm9kZXMsIHNvIG1ha2VzIHNlbnNlIHRvIHVzZSB0aGUgc2FtZVxuICAgICAgICAvLyBkcml2ZXIsIHJhdGhlciB0aGFuIHNwYW1taW5nIGEgYnVuY2ggb2YgV2F2ZVNoYXBlck5vZGVzIGFsbCBhYm91dFxuICAgICAgICAvLyB0aGUgcGxhY2UuIEl0IGNhbid0IGJlIGRlbGV0ZWQsIHNvIG5vIHdvcnJpZXMgYWJvdXQgYnJlYWtpbmdcbiAgICAgICAgLy8gZnVuY3Rpb25hbGl0eSBvZiBub2RlcyB0aGF0IGRvIHVzZSBpdCBzaG91bGQgaXQgYXR0ZW1wdCB0byBiZVxuICAgICAgICAvLyBvdmVyd3JpdHRlbi5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCB0aGlzLCAnY29uc3RhbnREcml2ZXInLCB7XG4gICAgICAgICAgICB3cml0ZWFibGU6IGZhbHNlLFxuICAgICAgICAgICAgZ2V0OiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGxldCBjb25zdGFudERyaXZlcjtcblxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhY29uc3RhbnREcml2ZXIgfHwgY29uc3RhbnREcml2ZXIuY29udGV4dCAhPT0gdGhpcy5jb250ZXh0ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3RhbnREcml2ZXIgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29udGV4dCA9IHRoaXMuY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSBjb250ZXh0LmNyZWF0ZUJ1ZmZlciggMSwgNDA5NiwgY29udGV4dC5zYW1wbGVSYXRlICksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyRGF0YSA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSggMCApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlclNvdXJjZSA9IGNvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGJ1ZmZlckRhdGEubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyRGF0YVsgaSBdID0gMS4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3IoIGxldCBidWZmZXJWYWx1ZSBvZiBidWZmZXJEYXRhICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGJ1ZmZlclZhbHVlID0gMS4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJTb3VyY2UuYnVmZmVyID0gYnVmZmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyU291cmNlLmxvb3AgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyU291cmNlLnN0YXJ0KCAwICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0YW50RHJpdmVyID0gYnVmZmVyU291cmNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnN0YW50RHJpdmVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0oKSApXG4gICAgICAgIH0gKTtcbiAgICB9XG5cblxuXG4gICAgZ2V0IGNvbnRleHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0O1xuICAgIH1cblxuICAgIHNldCBjb250ZXh0KCBjb250ZXh0ICkge1xuICAgICAgICBpZiAoICEoIGNvbnRleHQgaW5zdGFuY2VvZiBBdWRpb0NvbnRleHQgKSApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggXCJJbnZhbGlkIGF1ZGlvIGNvbnRleHQgZ2l2ZW46XCIgKyBjb250ZXh0ICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5tYXN0ZXIgPSBjb250ZXh0LmRlc3RpbmF0aW9uO1xuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggQXVkaW9JTy5wcm90b3R5cGUsIHNpZ25hbEN1cnZlcywgJ2N1cnZlcycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIEF1ZGlvSU8ucHJvdG90eXBlLCBjb252ZXJzaW9ucywgJ2NvbnZlcnQnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBBdWRpb0lPLnByb3RvdHlwZSwgbWF0aCwgJ21hdGgnICk7XG5cblxuXG53aW5kb3cuQXVkaW9JTyA9IEF1ZGlvSU87XG5leHBvcnQgZGVmYXVsdCBBdWRpb0lPOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5pbXBvcnQgY29ubmVjdGlvbnMgZnJvbSBcIi4uL21peGlucy9jb25uZWN0aW9ucy5lczZcIjtcbmltcG9ydCBjbGVhbmVycyBmcm9tIFwiLi4vbWl4aW5zL2NsZWFuZXJzLmVzNlwiO1xuXG52YXIgZ3JhcGhzID0gbmV3IFdlYWtNYXAoKTtcblxuY2xhc3MgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1JbnB1dHMgPSAwLCBudW1PdXRwdXRzID0gMCApIHtcbiAgICAgICAgdGhpcy5fc2V0SU8oIGlvICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHMgPSBbXTtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gW107XG5cbiAgICAgICAgLy8gVGhpcyBvYmplY3Qgd2lsbCBob2xkIGFueSB2YWx1ZXMgdGhhdCBjYW4gYmVcbiAgICAgICAgLy8gY29udHJvbGxlZCB3aXRoIGF1ZGlvIHNpZ25hbHMuXG4gICAgICAgIHRoaXMuY29udHJvbHMgPSB7fTtcblxuICAgICAgICAvLyBCb3RoIHRoZXNlIG9iamVjdHMgd2lsbCBqdXN0IGhvbGQgcmVmZXJlbmNlc1xuICAgICAgICAvLyB0byBlaXRoZXIgaW5wdXQgb3Igb3V0cHV0IG5vZGVzLiBIYW5keSB3aGVuXG4gICAgICAgIC8vIHdhbnRpbmcgdG8gY29ubmVjdCBzcGVjaWZpYyBpbnMvb3V0cyB3aXRob3V0XG4gICAgICAgIC8vIGhhdmluZyB0byB1c2UgdGhlIGAuY29ubmVjdCggLi4uLCAwLCAxIClgIHN5bnRheC5cbiAgICAgICAgdGhpcy5uYW1lZElucHV0cyA9IHt9O1xuICAgICAgICB0aGlzLm5hbWVkT3V0cHV0cyA9IHt9O1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG51bUlucHV0czsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5hZGRJbnB1dENoYW5uZWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgbnVtT3V0cHV0czsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5hZGRPdXRwdXRDaGFubmVsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRHcmFwaCggZ3JhcGggKSB7XG4gICAgICAgIGdyYXBocy5zZXQoIHRoaXMsIGdyYXBoICk7XG4gICAgfVxuXG4gICAgZ2V0R3JhcGgoKSB7XG4gICAgICAgIHJldHVybiBncmFwaHMuZ2V0KCB0aGlzICkgfHwge307XG4gICAgfVxuXG4gICAgYWRkSW5wdXRDaGFubmVsKCkge1xuICAgICAgICB0aGlzLmlucHV0cy5wdXNoKCB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpICk7XG4gICAgfVxuXG4gICAgYWRkT3V0cHV0Q2hhbm5lbCgpIHtcbiAgICAgICAgdGhpcy5vdXRwdXRzLnB1c2goIHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCkgKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICB0aGlzLl9jbGVhblVwSW5PdXRzKCk7XG4gICAgICAgIHRoaXMuX2NsZWFuSU8oKTtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgfVxuXG5cbiAgICBnZXQgbnVtYmVyT2ZJbnB1dHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlucHV0cy5sZW5ndGg7XG4gICAgfVxuICAgIGdldCBudW1iZXJPZk91dHB1dHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm91dHB1dHMubGVuZ3RoO1xuICAgIH1cblxuICAgIGdldCBpbnB1dFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dHMubGVuZ3RoID8gdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlIDogbnVsbDtcbiAgICB9XG4gICAgc2V0IGlucHV0VmFsdWUoIHZhbHVlICkge1xuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmlucHV0cy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IHRoaXMuaW52ZXJ0SW5wdXRQaGFzZSA/IC12YWx1ZSA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IG91dHB1dFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRwdXRzLmxlbmd0aCA/IHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgOiBudWxsO1xuICAgIH1cbiAgICBzZXQgb3V0cHV0VmFsdWUoIHZhbHVlICkge1xuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLm91dHB1dHMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIGkgXS5nYWluLnZhbHVlID0gdGhpcy5pbnZlcnRPdXRwdXRQaGFzZSA/IC12YWx1ZSA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGludmVydElucHV0UGhhc2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlucHV0cy5sZW5ndGggP1xuICAgICAgICAgICAgKCB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPCAwICkgOlxuICAgICAgICAgICAgbnVsbDtcbiAgICB9XG4gICAgc2V0IGludmVydElucHV0UGhhc2UoIGludmVydGVkICkge1xuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGlucHV0LCB2OyBpIDwgdGhpcy5pbnB1dHMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgICAgICBpbnB1dCA9IHRoaXMuaW5wdXRzWyBpIF0uZ2FpbjtcbiAgICAgICAgICAgIHYgPSBpbnB1dC52YWx1ZTtcbiAgICAgICAgICAgIGlucHV0LnZhbHVlID0gdiA8IDAgPyAoIGludmVydGVkID8gdiA6IC12ICkgOiAoIGludmVydGVkID8gLXYgOiB2ICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgaW52ZXJ0T3V0cHV0UGhhc2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm91dHB1dHMubGVuZ3RoID9cbiAgICAgICAgICAgICggdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA8IDAgKSA6XG4gICAgICAgICAgICBudWxsO1xuICAgIH1cblxuICAgIC8vIFRPRE86XG4gICAgLy8gIC0gc2V0VmFsdWVBdFRpbWU/XG4gICAgc2V0IGludmVydE91dHB1dFBoYXNlKCBpbnZlcnRlZCApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCB2OyBpIDwgdGhpcy5vdXRwdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgdiA9IHRoaXMub3V0cHV0c1sgaSBdLmdhaW4udmFsdWU7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIGkgXS5nYWluLnZhbHVlID0gdiA8IDAgPyAoIGludmVydGVkID8gdiA6IC12ICkgOiAoIGludmVydGVkID8gLXYgOiB2ICk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIE5vZGUucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBOb2RlLnByb3RvdHlwZSwgY2xlYW5lcnMuY2xlYW5VcEluT3V0cywgJ19jbGVhblVwSW5PdXRzJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggTm9kZS5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuSU8sICdfY2xlYW5JTycgKTtcbkF1ZGlvSU8ubWl4aW4oIE5vZGUucHJvdG90eXBlLCBjb25uZWN0aW9ucyApO1xuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU5vZGUgPSBmdW5jdGlvbiggbnVtSW5wdXRzLCBudW1PdXRwdXRzICkge1xuICAgIHJldHVybiBuZXcgTm9kZSggdGhpcywgbnVtSW5wdXRzLCBudW1PdXRwdXRzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOb2RlOyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5pbXBvcnQgY29ubmVjdGlvbnMgZnJvbSBcIi4uL21peGlucy9jb25uZWN0aW9ucy5lczZcIjtcbmltcG9ydCBjbGVhbmVycyBmcm9tIFwiLi4vbWl4aW5zL2NsZWFuZXJzLmVzNlwiO1xuXG5cbmNsYXNzIFBhcmFtIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlLCBkZWZhdWx0VmFsdWUgKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gdGhpcy5vdXRwdXRzID0gWyB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpIF07XG4gICAgICAgIHRoaXMuX2NvbnRyb2wgPSB0aGlzLmlucHV0c1sgMCBdO1xuXG4gICAgICAgIC8vIEhtbS4uLiBIYWQgdG8gcHV0IHRoaXMgaGVyZSBzbyBOb3RlIHdpbGwgYmUgYWJsZVxuICAgICAgICAvLyB0byByZWFkIHRoZSB2YWx1ZS4uLlxuICAgICAgICAvLyBUT0RPOlxuICAgICAgICAvLyAgLSBTaG91bGQgSSBjcmVhdGUgYSBgLl92YWx1ZWAgcHJvcGVydHkgdGhhdCB3aWxsXG4gICAgICAgIC8vICAgIHN0b3JlIHRoZSB2YWx1ZXMgdGhhdCB0aGUgUGFyYW0gc2hvdWxkIGJlIHJlZmxlY3RpbmdcbiAgICAgICAgLy8gICAgKGZvcmdldHRpbmcsIG9mIGNvdXJzZSwgdGhhdCBhbGwgdGhlICpWYWx1ZUF0VGltZSBbZXRjLl1cbiAgICAgICAgLy8gICAgZnVuY3Rpb25zIGFyZSBmdW5jdGlvbnMgb2YgdGltZTsgYC5fdmFsdWVgIHByb3Agd291bGQgYmVcbiAgICAgICAgLy8gICAgc2V0IGltbWVkaWF0ZWx5LCB3aGlsc3QgdGhlIHJlYWwgdmFsdWUgd291bGQgYmUgcmFtcGluZylcbiAgICAgICAgLy9cbiAgICAgICAgLy8gIC0gT3IsIHNob3VsZCBJIGNyZWF0ZSBhIGAuX3ZhbHVlYCBwcm9wZXJ0eSB0aGF0IHdpbGxcbiAgICAgICAgLy8gICAgdHJ1ZWx5IHJlZmxlY3QgdGhlIGludGVybmFsIHZhbHVlIG9mIHRoZSBHYWluTm9kZT8gV2lsbFxuICAgICAgICAvLyAgICByZXF1aXJlIE1BRkZTLi4uXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyA/IHZhbHVlIDogMS4wO1xuICAgICAgICB0aGlzLl9jb250cm9sLmdhaW4udmFsdWUgPSB0aGlzLl92YWx1ZTtcblxuICAgICAgICB0aGlzLnNldFZhbHVlQXRUaW1lKCB0aGlzLl92YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgICAgIHRoaXMuZGVmYXVsdFZhbHVlID0gdHlwZW9mIGRlZmF1bHRWYWx1ZSA9PT0gJ251bWJlcicgPyBkZWZhdWx0VmFsdWUgOiB0aGlzLl9jb250cm9sLmdhaW4uZGVmYXVsdFZhbHVlO1xuXG5cbiAgICAgICAgLy8gVE9ETzpcbiAgICAgICAgLy8gIC0gU2hvdWxkIHRoZSBkcml2ZXIgYWx3YXlzIGJlIGNvbm5lY3RlZD9cbiAgICAgICAgLy8gIC0gTm90IHN1cmUgd2hldGhlciBQYXJhbSBzaG91bGQgb3V0cHV0IDAgaWYgdmFsdWUgIT09IE51bWJlci5cbiAgICAgICAgaWYgKCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5pby5jb25zdGFudERyaXZlci5jb25uZWN0KCB0aGlzLl9jb250cm9sICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5kZWZhdWx0VmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHRoaXMuX2NsZWFuVXBJbk91dHMoKTtcbiAgICAgICAgdGhpcy5fY2xlYW5JTygpO1xuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wgPSBudWxsO1xuICAgICAgICB0aGlzLmRlZmF1bHRWYWx1ZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgfVxuXG4gICAgc2V0VmFsdWVBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHN0YXJ0VGltZSApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBsaW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggdmFsdWUsIGVuZFRpbWUgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggdmFsdWUsIGVuZFRpbWUgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSggdmFsdWUsIGVuZFRpbWUgKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2NvbnRyb2wuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKCB2YWx1ZSwgZW5kVGltZSApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRUYXJnZXRBdFRpbWUoIHZhbHVlLCBzdGFydFRpbWUsIHRpbWVDb25zdGFudCApIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLnNldFRhcmdldEF0VGltZSggdmFsdWUsIHN0YXJ0VGltZSwgdGltZUNvbnN0YW50ICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFZhbHVlQ3VydmVBdFRpbWUoIHZhbHVlcywgc3RhcnRUaW1lLCBkdXJhdGlvbiApIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLnNldFZhbHVlQ3VydmVBdFRpbWUoIHZhbHVlcywgc3RhcnRUaW1lLCBkdXJhdGlvbiApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHN0YXJ0VGltZSApIHtcbiAgICAgICAgdGhpcy5fY29udHJvbC5nYWluLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyggc3RhcnRUaW1lICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgLy8gcmV0dXJuIHRoaXMuX2NvbnRyb2wuZ2Fpbi52YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxuXG4gICAgZ2V0IGNvbnRyb2woKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250cm9sLmdhaW47XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFBhcmFtLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggUGFyYW0ucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhblVwSW5PdXRzLCAnX2NsZWFuVXBJbk91dHMnICk7XG5BdWRpb0lPLm1peGluU2luZ2xlKCBQYXJhbS5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuSU8sICdfY2xlYW5JTycgKTtcbkF1ZGlvSU8ubWl4aW4oIFBhcmFtLnByb3RvdHlwZSwgY29ubmVjdGlvbnMgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUGFyYW0gPSBmdW5jdGlvbiggdmFsdWUsIGRlZmF1bHRWYWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFBhcmFtKCB0aGlzLCB2YWx1ZSwgZGVmYXVsdFZhbHVlICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBQYXJhbTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcblxuY2xhc3MgV2F2ZVNoYXBlciB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBjdXJ2ZU9ySXRlcmF0b3IsIHNpemUgKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMuc2hhcGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZVdhdmVTaGFwZXIoKTtcblxuICAgICAgICAvLyBJZiBhIEZsb2F0MzJBcnJheSBpcyBwcm92aWRlZCwgdXNlIGl0XG4gICAgICAgIC8vIGFzIHRoZSBjdXJ2ZSB2YWx1ZS5cbiAgICAgICAgaWYgKCBjdXJ2ZU9ySXRlcmF0b3IgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgKSB7XG4gICAgICAgICAgICB0aGlzLnNoYXBlci5jdXJ2ZSA9IGN1cnZlT3JJdGVyYXRvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGEgZnVuY3Rpb24gaXMgcHJvdmlkZWQsIGNyZWF0ZSBhIGN1cnZlXG4gICAgICAgIC8vIHVzaW5nIHRoZSBmdW5jdGlvbiBhcyBhbiBpdGVyYXRvci5cbiAgICAgICAgZWxzZSBpZiAoIHR5cGVvZiBjdXJ2ZU9ySXRlcmF0b3IgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICBzaXplID0gdHlwZW9mIHNpemUgPT09ICdudW1iZXInICYmIHNpemUgPj0gMiA/IHNpemUgOiBDT05GSUcuY3VydmVSZXNvbHV0aW9uO1xuXG4gICAgICAgICAgICB2YXIgYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KCBzaXplICksXG4gICAgICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICAgICAgeCA9IDA7XG5cbiAgICAgICAgICAgIGZvciAoIGk7IGkgPCBzaXplOyArK2kgKSB7XG4gICAgICAgICAgICAgICAgeCA9ICggaSAvIHNpemUgKSAqIDIgLSAxO1xuICAgICAgICAgICAgICAgIGFycmF5WyBpIF0gPSBjdXJ2ZU9ySXRlcmF0b3IoIHgsIGksIHNpemUgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zaGFwZXIuY3VydmUgPSBhcnJheTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE90aGVyd2lzZSwgZGVmYXVsdCB0byBhIExpbmVhciBjdXJ2ZS5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNoYXBlci5jdXJ2ZSA9IHRoaXMuaW8uY3VydmVzLkxpbmVhcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5wdXRzID0gdGhpcy5vdXRwdXRzID0gWyB0aGlzLnNoYXBlciBdO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHRoaXMuX2NsZWFuVXBJbk91dHMoKTtcbiAgICAgICAgdGhpcy5fY2xlYW5JTygpO1xuICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5zaGFwZXIgPSBudWxsO1xuICAgIH1cblxuICAgIGdldCBjdXJ2ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2hhcGVyLmN1cnZlO1xuICAgIH1cbiAgICBzZXQgY3VydmUoIGN1cnZlICkge1xuICAgICAgICBpZiggY3VydmUgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgKSB7XG4gICAgICAgICAgICB0aGlzLnNoYXBlci5jdXJ2ZSA9IGN1cnZlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5BdWRpb0lPLm1peGluU2luZ2xlKCBXYXZlU2hhcGVyLnByb3RvdHlwZSwgX3NldElPLCAnX3NldElPJyApO1xuQXVkaW9JTy5taXhpblNpbmdsZSggV2F2ZVNoYXBlci5wcm90b3R5cGUsIGNsZWFuZXJzLmNsZWFuVXBJbk91dHMsICdfY2xlYW5VcEluT3V0cycgKTtcbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIFdhdmVTaGFwZXIucHJvdG90eXBlLCBjbGVhbmVycy5jbGVhbklPLCAnX2NsZWFuSU8nICk7XG5BdWRpb0lPLm1peGluKCBXYXZlU2hhcGVyLnByb3RvdHlwZSwgY29ubmVjdGlvbnMgKTtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlV2F2ZVNoYXBlciA9IGZ1bmN0aW9uKCBjdXJ2ZSwgc2l6ZSApIHtcbiAgICByZXR1cm4gbmV3IFdhdmVTaGFwZXIoIHRoaXMsIGN1cnZlLCBzaXplICk7XG59OyIsImV4cG9ydCBkZWZhdWx0IHtcbiAgICBjdXJ2ZVJlc29sdXRpb246IDQwOTYsIC8vIE11c3QgYmUgYW4gZXZlbiBudW1iZXIuXG5cbiAgICAvLyBVc2VkIHdoZW4gY29udmVydGluZyBub3RlIHN0cmluZ3MgKGVnLiAnQSM0JykgdG8gTUlESSB2YWx1ZXMuXG4gICAgLy8gSXQncyB0aGUgb2N0YXZlIG51bWJlciBvZiB0aGUgbG93ZXN0IEMgbm90ZSAoTUlESSBub3RlIDApLlxuICAgIC8vIENoYW5nZSB0aGlzIGlmIHlvdSdyZSB1c2VkIHRvIGEgREFXIHRoYXQgZG9lc24ndCB1c2UgLTIgYXMgdGhlXG4gICAgLy8gbG93ZXN0IG9jdGF2ZS5cbiAgICBsb3dlc3RPY3RhdmU6IC0yLFxuXG4gICAgLy8gTG93ZXN0IGFsbG93ZWQgbnVtYmVyLiBVc2VkIGJ5IHNvbWUgTWF0aFxuICAgIC8vIGZ1bmN0aW9ucywgZXNwZWNpYWxseSB3aGVuIGNvbnZlcnRpbmcgYmV0d2VlblxuICAgIC8vIG51bWJlciBmb3JtYXRzIChpZS4gaHogLT4gTUlESSwgbm90ZSAtPiBNSURJLCBldGMuIClcbiAgICAvL1xuICAgIC8vIEFsc28gdXNlZCBpbiBjYWxscyB0byBBdWRpb1BhcmFtLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWVcbiAgICAvLyBzbyB0aGVyZSdzIG5vIHJhbXBpbmcgdG8gMCAod2hpY2ggdGhyb3dzIGFuIGVycm9yKS5cbiAgICBlcHNpbG9uOiAwLjAwMSxcblxuICAgIG1pZGlOb3RlUG9vbFNpemU6IDUwMFxufTsiLCIvLyBOZWVkIHRvIG92ZXJyaWRlIGV4aXN0aW5nIC5jb25uZWN0IGZ1bmN0aW9uc1xuLy8gZm9yIG5hdGl2ZSBBdWRpb1BhcmFtcyBhbmQgQXVkaW9Ob2Rlcy4uLlxuLy8gSSBkb24ndCBsaWtlIGRvaW5nIHRoaXMsIGJ1dCBzJ2dvdHRhIGJlIGRvbmUgOihcbiggZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9yaWdpbmFsQXVkaW9Ob2RlQ29ubmVjdCA9IEF1ZGlvTm9kZS5wcm90b3R5cGUuY29ubmVjdDtcblxuICAgIEF1ZGlvTm9kZS5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uKCBub2RlLCBvdXRwdXRDaGFubmVsID0gMCwgaW5wdXRDaGFubmVsID0gMCApIHtcbiAgICAgICAgaWYgKCBub2RlLmlucHV0cyApIHtcbiAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggbm9kZS5pbnB1dHMgKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3QoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0KCBub2RlLmlucHV0c1sgMCBdLCBvdXRwdXRDaGFubmVsLCBpbnB1dENoYW5uZWwgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKCBub2RlIGluc3RhbmNlb2YgQXVkaW9Ob2RlICkge1xuICAgICAgICAgICAgb3JpZ2luYWxBdWRpb05vZGVDb25uZWN0LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICggbm9kZSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEF1ZGlvTm9kZUNvbm5lY3QuY2FsbCggdGhpcywgbm9kZSwgb3V0cHV0Q2hhbm5lbCApO1xuICAgICAgICB9XG4gICAgfTtcbn0oKSApOyIsImltcG9ydCBDT05GSUcgZnJvbSAnLi9jb25maWcuZXM2JztcbmltcG9ydCBtYXRoIGZyb20gJy4uL21peGlucy9NYXRoLmVzNic7XG5cblxubGV0IHNpZ25hbEN1cnZlcyA9IHt9O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0NvbnN0YW50Jywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnTGluZWFyJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnRXF1YWxQb3dlcicsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICksXG4gICAgICAgICAgICBzaW4gPSBNYXRoLnNpbixcbiAgICAgICAgICAgIFBJID0gTWF0aC5QSTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0gc2luKCB4ICogMC41ICogUEkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdDdWJlZCcsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICksXG4gICAgICAgICAgICBzaW4gPSBNYXRoLnNpbixcbiAgICAgICAgICAgIFBJID0gTWF0aC5QSSxcbiAgICAgICAgICAgIHBvdyA9IE1hdGgucG93O1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIHggPSAoIGkgLyByZXNvbHV0aW9uICkgKiAyIC0gMTtcbiAgICAgICAgICAgIHggPSBwb3coIHgsIDMgKTtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBzaW4oIHggKiAwLjUgKiBQSSApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdSZWN0aWZ5Jywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBoYWxmUmVzb2x1dGlvbiA9IHJlc29sdXRpb24gKiAwLjUsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IC1oYWxmUmVzb2x1dGlvbiwgeCA9IDA7IGkgPCBoYWxmUmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSA+IDAgPyBpIDogLWkgKSAvIGhhbGZSZXNvbHV0aW9uO1xuICAgICAgICAgICAgY3VydmVbIGkgKyBoYWxmUmVzb2x1dGlvbiBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5cblxuLy8gTWF0aCBjdXJ2ZXNcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnR3JlYXRlclRoYW5aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA8PSAwID8gMC4wIDogMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnTGVzc1RoYW5aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA+PSAwID8gMCA6IDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0VxdWFsVG9aZXJvJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24sXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geCA9PT0gMCA/IDEgOiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdSZWNpcHJvY2FsJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IDQwOTYgKiA2MDAsIC8vIEhpZ2hlciByZXNvbHV0aW9uIG5lZWRlZCBoZXJlLlxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgLy8gY3VydmVbIGkgXSA9IHggPT09IDAgPyAxIDogMDtcblxuICAgICAgICAgICAgaWYgKCB4ICE9PSAwICkge1xuICAgICAgICAgICAgICAgIHggPSBNYXRoLnBvdyggeCwgLTEgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ1NpbmUnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApLFxuICAgICAgICAgICAgc2luID0gTWF0aC5zaW47XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IHNpbiggeCApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggc2lnbmFsQ3VydmVzLCAnUm91bmQnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDUwLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgeCA9ICggaSAvIHJlc29sdXRpb24gKSAqIDIgLSAxO1xuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgKCB4ID4gMCAmJiB4IDw9IDAuNTAwMDEgKSB8fFxuICAgICAgICAgICAgICAgICggeCA8IDAgJiYgeCA+PSAtMC41MDAwMSApXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCB4ID4gMCApIHtcbiAgICAgICAgICAgICAgICB4ID0gMVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgeCA9IC0xO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSB4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnZlO1xuICAgIH0oKSApXG59ICk7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdGbG9vcicsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogNTAsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIHg7IGkgPCByZXNvbHV0aW9uOyArK2kgKSB7XG4gICAgICAgICAgICB4ID0gKCBpIC8gcmVzb2x1dGlvbiApICogMiAtIDE7XG5cbiAgICAgICAgICAgIGlmICggeCA+PSAwLjk5OTkgKSB7XG4gICAgICAgICAgICAgICAgeCA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICggeCA+PSAwICkge1xuICAgICAgICAgICAgICAgIHggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIHggPCAwICkge1xuICAgICAgICAgICAgICAgIHggPSAtMTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICBjdXJ2ZVsgaSBdID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9KCkgKVxufSApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIHNpZ25hbEN1cnZlcywgJ0dhdXNzaWFuV2hpdGVOb2lzZScsIHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogKCBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJlc29sdXRpb24gPSBDT05GSUcuY3VydmVSZXNvbHV0aW9uICogMixcbiAgICAgICAgICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheSggcmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBtYXRoLm5yYW5kKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdXaGl0ZU5vaXNlJywge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAoIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzb2x1dGlvbiA9IENPTkZJRy5jdXJ2ZVJlc29sdXRpb24gKiAyLFxuICAgICAgICAgICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KCByZXNvbHV0aW9uICk7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwLCB4OyBpIDwgcmVzb2x1dGlvbjsgKytpICkge1xuICAgICAgICAgICAgY3VydmVbIGkgXSA9IE1hdGgucmFuZG9tKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzaWduYWxDdXJ2ZXMsICdQaW5rTm9pc2UnLCB7XG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICggZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByZXNvbHV0aW9uID0gQ09ORklHLmN1cnZlUmVzb2x1dGlvbiAqIDIsXG4gICAgICAgICAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHJlc29sdXRpb24gKTtcblxuICAgICAgICBtYXRoLmdlbmVyYXRlUGlua051bWJlcigpO1xuXG4gICAgICAgIGZvciAoIGxldCBpID0gMCwgeDsgaSA8IHJlc29sdXRpb247ICsraSApIHtcbiAgICAgICAgICAgIGN1cnZlWyBpIF0gPSBtYXRoLmdldE5leHRQaW5rTnVtYmVyKCkgKiAyIC0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCBNYXRoLm1pbi5hcHBseSggTWF0aCwgY3VydmUgKSApO1xuICAgICAgICBjb25zb2xlLmxvZyggTWF0aC5tYXguYXBwbHkoIE1hdGgsIGN1cnZlICkgKTtcblxuICAgICAgICByZXR1cm4gY3VydmU7XG4gICAgfSgpIClcbn0gKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHNpZ25hbEN1cnZlczsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgQ3VzdG9tRW52ZWxvcGUgZnJvbSBcIi4vQ3VzdG9tRW52ZWxvcGUuZXM2XCI7XG5cbmNsYXNzIEFTRFJFbnZlbG9wZSBleHRlbmRzIEN1c3RvbUVudmVsb3BlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHRoaXMudGltZXMgPSB7XG4gICAgICAgICAgICBhdHRhY2s6IDAuMDEsXG4gICAgICAgICAgICBkZWNheTogMC41LFxuICAgICAgICAgICAgcmVsZWFzZTogMC41XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sZXZlbHMgPSB7XG4gICAgICAgICAgICBpbml0aWFsOiAwLFxuICAgICAgICAgICAgcGVhazogMSxcbiAgICAgICAgICAgIHN1c3RhaW46IDEsXG4gICAgICAgICAgICByZWxlYXNlOiAwXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hZGRTdGFydFN0ZXAoICdpbml0aWFsJywgMCwgdGhpcy5sZXZlbHMuaW5pdGlhbCApO1xuICAgICAgICB0aGlzLmFkZFN0YXJ0U3RlcCggJ2F0dGFjaycsIHRoaXMudGltZXMuYXR0YWNrLCB0aGlzLmxldmVscy5wZWFrICk7XG4gICAgICAgIHRoaXMuYWRkU3RhcnRTdGVwKCAnZGVjYXknLCB0aGlzLnRpbWVzLmRlY2F5LCB0aGlzLmxldmVscy5zdXN0YWluICk7XG4gICAgICAgIHRoaXMuYWRkRW5kU3RlcCggJ3JlbGVhc2UnLCB0aGlzLnRpbWVzLnJlbGVhc2UsIHRoaXMubGV2ZWxzLnJlbGVhc2UsIHRydWUgKTtcbiAgICB9XG5cbiAgICBnZXQgYXR0YWNrVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZXMuYXR0YWNrO1xuICAgIH1cbiAgICBzZXQgYXR0YWNrVGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLmF0dGFjayA9IHRpbWU7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBUaW1lKCAnYXR0YWNrJywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgZGVjYXlUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5kZWNheTtcbiAgICB9XG4gICAgc2V0IGRlY2F5VGltZSggdGltZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVzLmRlY2F5ID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdkZWNheScsIHRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2V0IHJlbGVhc2VUaW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcy5yZWxlYXNlO1xuICAgIH1cbiAgICBzZXQgcmVsZWFzZVRpbWUoIHRpbWUgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIHRpbWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy50aW1lcy5yZWxlYXNlID0gdGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcFRpbWUoICdyZWxlYXNlJywgdGltZSApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZXQgaW5pdGlhbExldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMuaW5pdGlhbDtcbiAgICB9XG4gICAgc2V0IGluaXRpYWxMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHRoaXMubGV2ZWxzLmluaXRpYWwgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RlcExldmVsKCAnaW5pdGlhbCcsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBwZWFrTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5wZWFrO1xuICAgIH1cblxuICAgIHNldCBwZWFrTGV2ZWwoIGxldmVsICkge1xuICAgICAgICBpZiAoIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLmxldmVscy5wZWFrID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnNldFN0ZXBMZXZlbCggJ2F0dGFjaycsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCBzdXN0YWluTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5zdXN0YWluO1xuICAgIH1cbiAgICBzZXQgc3VzdGFpbkxldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMuc3VzdGFpbiA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdkZWNheScsIGxldmVsICk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdldCByZWxlYXNlTGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5yZWxlYXNlO1xuICAgIH1cbiAgICBzZXQgcmVsZWFzZUxldmVsKCBsZXZlbCApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5sZXZlbHMucmVsZWFzZSA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGVwTGV2ZWwoICdyZWxlYXNlJywgbGV2ZWwgKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQVNEUkVudmVsb3BlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBBU0RSRW52ZWxvcGUoIHRoaXMgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEFTRFJFbnZlbG9wZTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IENPTkZJRyBmcm9tIFwiLi4vY29yZS9jb25maWcuZXM2XCI7XG5pbXBvcnQgX3NldElPIGZyb20gXCIuLi9taXhpbnMvc2V0SU8uZXM2XCI7XG5cbmNsYXNzIEN1c3RvbUVudmVsb3BlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHRoaXMuX3NldElPKCBpbyApO1xuXG4gICAgICAgIHRoaXMub3JkZXJzID0ge1xuICAgICAgICAgICAgc3RhcnQ6IFtdLFxuICAgICAgICAgICAgc3RvcDogW11cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnN0ZXBzID0ge1xuICAgICAgICAgICAgc3RhcnQ6IHt9LFxuICAgICAgICAgICAgc3RvcDoge31cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBfYWRkU3RlcCggc2VjdGlvbiwgbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgPSBmYWxzZSApIHtcbiAgICAgICAgbGV0IHN0b3BzID0gdGhpcy5zdGVwc1sgc2VjdGlvbiBdO1xuXG4gICAgICAgIGlmICggc3RvcHNbIG5hbWUgXSApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ1N0b3Agd2l0aCBuYW1lIFwiJyArIG5hbWUgKyAnXCIgYWxyZWFkeSBleGlzdHMuJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vcmRlcnNbIHNlY3Rpb24gXS5wdXNoKCBuYW1lICk7XG5cbiAgICAgICAgdGhpcy5zdGVwc1sgc2VjdGlvbiBdWyBuYW1lIF0gPSB7XG4gICAgICAgICAgICB0aW1lOiB0aW1lLFxuICAgICAgICAgICAgbGV2ZWw6IGxldmVsLFxuICAgICAgICAgICAgaXNFeHBvbmVudGlhbDogaXNFeHBvbmVudGlhbFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFkZFN0YXJ0U3RlcCggbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgPSBmYWxzZSApIHtcbiAgICAgICAgdGhpcy5fYWRkU3RlcCggJ3N0YXJ0JywgbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgYWRkRW5kU3RlcCggbmFtZSwgdGltZSwgbGV2ZWwsIGlzRXhwb25lbnRpYWwgPSBmYWxzZSApIHtcbiAgICAgICAgdGhpcy5fYWRkU3RlcCggJ3N0b3AnLCBuYW1lLCB0aW1lLCBsZXZlbCwgaXNFeHBvbmVudGlhbCApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRTdGVwTGV2ZWwoIG5hbWUsIGxldmVsICkge1xuICAgICAgICBsZXQgc3RhcnRJbmRleCA9IHRoaXMub3JkZXJzLnN0YXJ0LmluZGV4T2YoIG5hbWUgKSxcbiAgICAgICAgICAgIGVuZEluZGV4ID0gdGhpcy5vcmRlcnMuc3RvcC5pbmRleE9mKCBuYW1lICk7XG5cbiAgICAgICAgaWYgKCBzdGFydEluZGV4ID09PSAtMSAmJiBlbmRJbmRleCA9PT0gLTEgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdObyBzdGVwIHdpdGggbmFtZSBcIicgKyBuYW1lICsgJ1wiLiBObyBsZXZlbCBzZXQuJyApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzdGFydEluZGV4ICE9PSAtMSApIHtcbiAgICAgICAgICAgIHRoaXMuc3RlcHMuc3RhcnRbIG5hbWUgXS5sZXZlbCA9IHBhcnNlRmxvYXQoIGxldmVsICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnN0b3BbIG5hbWUgXS5sZXZlbCA9IHBhcnNlRmxvYXQoIGxldmVsICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cblxuICAgIHNldFN0ZXBUaW1lKCBuYW1lLCB0aW1lICkge1xuICAgICAgICB2YXIgc3RhcnRJbmRleCA9IHRoaXMub3JkZXJzLnN0YXJ0LmluZGV4T2YoIG5hbWUgKSxcbiAgICAgICAgICAgIGVuZEluZGV4ID0gdGhpcy5vcmRlcnMuc3RvcC5pbmRleE9mKCBuYW1lICk7XG5cbiAgICAgICAgaWYgKCBzdGFydEluZGV4ID09PSAtMSAmJiBlbmRJbmRleCA9PT0gLTEgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdObyBzdGVwIHdpdGggbmFtZSBcIicgKyBuYW1lICsgJ1wiLiBObyB0aW1lIHNldC4nICk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHN0YXJ0SW5kZXggIT09IC0xICkge1xuICAgICAgICAgICAgdGhpcy5zdGVwcy5zdGFydFsgbmFtZSBdLnRpbWUgPSBwYXJzZUZsb2F0KCB0aW1lICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnN0b3BbIG5hbWUgXS50aW1lID0gcGFyc2VGbG9hdCggdGltZSApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG5cblxuICAgIF90cmlnZ2VyU3RlcCggcGFyYW0sIHN0ZXAsIHN0YXJ0VGltZSApIHtcbiAgICAgICAgLy8gaWYgKCBzdGVwLmlzRXhwb25lbnRpYWwgPT09IHRydWUgKSB7XG4gICAgICAgICAgICAvLyBUaGVyZSdzIHNvbWV0aGluZyBhbWlzcyBoZXJlIVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coIE1hdGgubWF4KCBzdGVwLmxldmVsLCBDT05GSUcuZXBzaWxvbiApLCBzdGFydFRpbWUgKyBzdGVwLnRpbWUgKTtcbiAgICAgICAgICAgIC8vIHBhcmFtLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoIE1hdGgubWF4KCBzdGVwLmxldmVsLCAwLjAxICksIHN0YXJ0VGltZSArIHN0ZXAudGltZSApO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGVsc2Uge1xuICAgICAgICAgICAgcGFyYW0ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIHN0ZXAubGV2ZWwsIHN0YXJ0VGltZSArIHN0ZXAudGltZSApO1xuICAgICAgICAvLyB9XG4gICAgfVxuXG4gICAgX3N0YXJ0U2VjdGlvbiggc2VjdGlvbiwgcGFyYW0sIHN0YXJ0VGltZSwgY2FuY2VsU2NoZWR1bGVkVmFsdWVzICkge1xuICAgICAgICB2YXIgc3RvcE9yZGVyID0gdGhpcy5vcmRlcnNbIHNlY3Rpb24gXSxcbiAgICAgICAgICAgIHN0ZXBzID0gdGhpcy5zdGVwc1sgc2VjdGlvbiBdLFxuICAgICAgICAgICAgbnVtU3RvcHMgPSBzdG9wT3JkZXIubGVuZ3RoLFxuICAgICAgICAgICAgc3RlcDtcblxuICAgICAgICBwYXJhbS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHN0YXJ0VGltZSApO1xuICAgICAgICAvLyBwYXJhbS5zZXRWYWx1ZUF0VGltZSggMCwgc3RhcnRUaW1lICk7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgbnVtU3RvcHM7ICsraSApIHtcbiAgICAgICAgICAgIHN0ZXAgPSBzdGVwc1sgc3RvcE9yZGVyWyBpIF0gXTtcbiAgICAgICAgICAgIHRoaXMuX3RyaWdnZXJTdGVwKCBwYXJhbSwgc3RlcCwgc3RhcnRUaW1lICk7XG4gICAgICAgICAgICBzdGFydFRpbWUgKz0gc3RlcC50aW1lO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBzdGFydCggcGFyYW0sIGRlbGF5ID0gMCApIHtcbiAgICAgICAgaWYgKCBwYXJhbSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0gPT09IGZhbHNlICYmIHBhcmFtIGluc3RhbmNlb2YgUGFyYW0gPT09IGZhbHNlICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnQ2FuIG9ubHkgc3RhcnQgYW4gZW52ZWxvcGUgb24gQXVkaW9QYXJhbSBvciBQYXJhbSBpbnN0YW5jZXMuJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc3RhcnRTZWN0aW9uKCAnc3RhcnQnLCBwYXJhbSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgZGVsYXkgKTtcbiAgICB9XG5cbiAgICBzdG9wKCBwYXJhbSwgZGVsYXkgPSAwICkge1xuICAgICAgICB0aGlzLl9zdGFydFNlY3Rpb24oICdzdG9wJywgcGFyYW0sIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIDAuMSArIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgZm9yY2VTdG9wKCBwYXJhbSwgZGVsYXkgPSAwICkge1xuICAgICAgICBwYXJhbS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIGRlbGF5ICk7XG4gICAgICAgIC8vIHBhcmFtLnNldFZhbHVlQXRUaW1lKCBwYXJhbS52YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICsgZGVsYXkgKTtcbiAgICAgICAgcGFyYW0ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIDAsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIDAuMDAxICk7XG4gICAgfVxuXG4gICAgZ2V0IHRvdGFsU3RhcnRUaW1lKCkge1xuICAgICAgICB2YXIgc3RhcnRzID0gdGhpcy5zdGVwcy5zdGFydCxcbiAgICAgICAgICAgIHRpbWUgPSAwLjA7XG5cbiAgICAgICAgZm9yICggdmFyIGkgaW4gc3RhcnRzICkge1xuICAgICAgICAgICAgdGltZSArPSBzdGFydHNbIGkgXS50aW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRpbWU7XG4gICAgfVxuXG4gICAgZ2V0IHRvdGFsU3RvcFRpbWUoKSB7XG4gICAgICAgIHZhciBzdG9wcyA9IHRoaXMuc3RlcHMuc3RvcCxcbiAgICAgICAgICAgIHRpbWUgPSAwLjA7XG5cbiAgICAgICAgZm9yICggdmFyIGkgaW4gc3RvcHMgKSB7XG4gICAgICAgICAgICB0aW1lICs9IHN0b3BzWyBpIF0udGltZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aW1lO1xuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggQ3VzdG9tRW52ZWxvcGUucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUN1c3RvbUVudmVsb3BlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBDdXN0b21FbnZlbG9wZSggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQ3VzdG9tRW52ZWxvcGU7IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBEcnlXZXROb2RlIGZyb20gXCIuLi9ncmFwaHMvRHJ5V2V0Tm9kZS5lczZcIjtcblxuLy8gVE9ETzogQWRkIGZlZWRiYWNrTGV2ZWwgYW5kIGRlbGF5VGltZSBQYXJhbSBpbnN0YW5jZXNcbi8vIHRvIGNvbnRyb2wgdGhpcyBub2RlLlxuY2xhc3MgRGVsYXkgZXh0ZW5kcyBEcnlXZXROb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHRpbWUgPSAwLCBmZWVkYmFja0xldmVsID0gMCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb250cm9sIG5vZGVzLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmZlZWRiYWNrID0gdGhpcy5pby5jcmVhdGVQYXJhbSggZmVlZGJhY2tMZXZlbCApO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnRpbWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0aW1lICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGZlZWRiYWNrIGFuZCBkZWxheSBub2Rlc1xuICAgICAgICB0aGlzLmZlZWRiYWNrID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuXG4gICAgICAgIC8vIFNldHVwIHRoZSBmZWVkYmFjayBsb29wXG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5mZWVkYmFjayApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcblxuICAgICAgICAvLyBBbHNvIGNvbm5lY3QgdGhlIGRlbGF5IHRvIHRoZSB3ZXQgb3V0cHV0LlxuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMud2V0ICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBpbnB1dCB0byBkZWxheVxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcblxuICAgICAgICB0aGlzLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDA7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lLmNvbm5lY3QoIHRoaXMuZGVsYXkuZGVsYXlUaW1lICk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZmVlZGJhY2suY29ubmVjdCggdGhpcy5mZWVkYmFjay5nYWluICk7XG4gICAgfVxuXG5cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRGVsYXkgPSBmdW5jdGlvbiggdGltZSwgZmVlZGJhY2tMZXZlbCApIHtcbiAgICByZXR1cm4gbmV3IERlbGF5KCB0aGlzLCB0aW1lLCBmZWVkYmFja0xldmVsICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBEZWxheTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcbmltcG9ydCBEcnlXZXROb2RlIGZyb20gXCIuLi9ncmFwaHMvRHJ5V2V0Tm9kZS5lczZcIjtcbmltcG9ydCBEZWxheSBmcm9tIFwiLi9EZWxheS5lczZcIjtcblxuLy8gVE9ETzpcbi8vICAtIENvbnZlcnQgdGhpcyBub2RlIHRvIHVzZSBQYXJhbSBjb250cm9sc1xuLy8gICAgZm9yIHRpbWUgYW5kIGZlZWRiYWNrLlxuXG5jbGFzcyBQaW5nUG9uZ0RlbGF5IGV4dGVuZHMgRHJ5V2V0Tm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB0aW1lID0gMC4yNSwgZmVlZGJhY2tMZXZlbCA9IDAuNSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGNoYW5uZWwgc3BsaXR0ZXIgYW5kIG1lcmdlclxuICAgICAgICB0aGlzLnNwbGl0dGVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUNoYW5uZWxTcGxpdHRlciggMiApO1xuICAgICAgICB0aGlzLm1lcmdlciA9IHRoaXMuY29udGV4dC5jcmVhdGVDaGFubmVsTWVyZ2VyKCAyICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGZlZWRiYWNrIGFuZCBkZWxheSBub2Rlc1xuICAgICAgICB0aGlzLmZlZWRiYWNrTCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tSID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5kZWxheUwgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgdGhpcy5kZWxheVIgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcblxuICAgICAgICAvLyBTZXR1cCB0aGUgZmVlZGJhY2sgbG9vcFxuICAgICAgICB0aGlzLmRlbGF5TC5jb25uZWN0KCB0aGlzLmZlZWRiYWNrTCApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrTC5jb25uZWN0KCB0aGlzLmRlbGF5UiApO1xuICAgICAgICB0aGlzLmRlbGF5Ui5jb25uZWN0KCB0aGlzLmZlZWRiYWNrUiApO1xuICAgICAgICB0aGlzLmZlZWRiYWNrUi5jb25uZWN0KCB0aGlzLmRlbGF5TCApO1xuXG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnNwbGl0dGVyICk7XG4gICAgICAgIHRoaXMuc3BsaXR0ZXIuY29ubmVjdCggdGhpcy5kZWxheUwsIDAgKTtcbiAgICAgICAgdGhpcy5mZWVkYmFja0wuY29ubmVjdCggdGhpcy5tZXJnZXIsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5mZWVkYmFja1IuY29ubmVjdCggdGhpcy5tZXJnZXIsIDAsIDEgKTtcbiAgICAgICAgdGhpcy5tZXJnZXIuY29ubmVjdCggdGhpcy53ZXQgKTtcblxuICAgICAgICB0aGlzLnRpbWUgPSB0aW1lO1xuICAgICAgICB0aGlzLmZlZWRiYWNrTGV2ZWwgPSBmZWVkYmFja0xldmVsO1xuICAgIH1cblxuICAgIGdldCB0aW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWxheUwuZGVsYXlUaW1lO1xuICAgIH1cblxuICAgIHNldCB0aW1lKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5kZWxheUwuZGVsYXlUaW1lLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKyAwLjVcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLmRlbGF5Ui5kZWxheVRpbWUubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSArIDAuNVxuICAgICAgICApO1xuICAgIH1cblxuICAgIGdldCBmZWVkYmFja0xldmVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5mZWVkYmFja0wuZ2Fpbi52YWx1ZTtcbiAgICB9XG5cbiAgICBzZXQgZmVlZGJhY2tMZXZlbCggbGV2ZWwgKSB7XG4gICAgICAgIHRoaXMuZmVlZGJhY2tMLmdhaW4udmFsdWUgPSBsZXZlbDtcbiAgICAgICAgdGhpcy5mZWVkYmFja1IuZ2Fpbi52YWx1ZSA9IGxldmVsO1xuICAgIH1cbn1cblxuQXVkaW9JTy5taXhpblNpbmdsZSggUGluZ1BvbmdEZWxheS5wcm90b3R5cGUsIF9zZXRJTywgJ19zZXRJTycgKTtcbkF1ZGlvSU8ubWl4aW4oIFBpbmdQb25nRGVsYXkucHJvdG90eXBlLCBjb25uZWN0aW9ucyApO1xuQXVkaW9JTy5taXhpbiggUGluZ1BvbmdEZWxheS5wcm90b3R5cGUsIGNsZWFuZXJzICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBpbmdQb25nRGVsYXkgPSBmdW5jdGlvbiggdGltZSwgZmVlZGJhY2tMZXZlbCApIHtcbiAgICByZXR1cm4gbmV3IFBpbmdQb25nRGVsYXkoIHRoaXMsIHRpbWUsIGZlZWRiYWNrTGV2ZWwgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuXG5jbGFzcyBPc2NpbGxhdG9yR2VuZXJhdG9yIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGZyZXF1ZW5jeSwgZGV0dW5lLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlZm9ybSApIHtcbiAgICAgICAgdGhpcy5fc2V0SU8oIGlvICk7XG5cbiAgICAgICAgdGhpcy5mcmVxdWVuY3kgPSBmcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuZGV0dW5lID0gZGV0dW5lO1xuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgICAgIHRoaXMuZ2xpZGVUaW1lID0gZ2xpZGVUaW1lO1xuICAgICAgICB0aGlzLndhdmUgPSB3YXZlZm9ybSB8fCAnc2luZSc7XG4gICAgICAgIHRoaXMucmVzZXRUaW1lc3RhbXAgPSAwLjA7XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSB0aGlzLmNvbnRleHQuY3JlYXRlT3NjaWxsYXRvcigpLFxuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGggPSB0aGlzLl9tYWtlVmVsb2NpdHlHcmFwaCggdmVsb2NpdHkgKTtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gWyB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpIF07XG4gICAgICAgIHRoaXMucmVzZXQoIHRoaXMuZnJlcXVlbmN5LCB0aGlzLmRldHVuZSwgdGhpcy52ZWxvY2l0eSwgdGhpcy5nbGlkZVRpbWUsIHRoaXMud2F2ZSApO1xuXG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLmNvbm5lY3QoIHRoaXMudmVsb2NpdHlHcmFwaCApO1xuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGguY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBfbWFrZVZlbG9jaXR5R3JhcGgoKSB7XG4gICAgICAgIHZhciBnYWluID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgcmV0dXJuIGdhaW47XG4gICAgfVxuXG4gICAgX3Jlc2V0VmVsb2NpdHlHcmFwaCggdmVsb2NpdHkgKSB7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaC5nYWluLnZhbHVlID0gdmVsb2NpdHk7XG4gICAgfVxuXG4gICAgX2NsZWFuVXBWZWxvY2l0eUdyYXBoKCkge1xuICAgICAgICB0aGlzLnZlbG9jaXR5R3JhcGguZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMudmVsb2NpdHlHcmFwaCA9IG51bGw7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdID0gbnVsbDtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gbnVsbDtcbiAgICB9XG5cbiAgICBsZXJwKCBzdGFydCwgZW5kLCBkZWx0YSApIHtcbiAgICAgICAgcmV0dXJuIHN0YXJ0ICsgKCAoIGVuZCAtIHN0YXJ0ICkgKiBkZWx0YSApO1xuICAgIH1cblxuICAgIHJlc2V0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZSApIHtcbiAgICAgICAgdmFyIG5vdyA9IHRoaXMuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICBmcmVxdWVuY3kgPSB0eXBlb2YgZnJlcXVlbmN5ID09PSAnbnVtYmVyJyA/IGZyZXF1ZW5jeSA6IHRoaXMuZnJlcXVlbmN5O1xuICAgICAgICBkZXR1bmUgPSB0eXBlb2YgZGV0dW5lID09PSAnbnVtYmVyJyA/IGRldHVuZSA6IHRoaXMuZGV0dW5lO1xuICAgICAgICB2ZWxvY2l0eSA9IHR5cGVvZiB2ZWxvY2l0eSA9PT0gJ251bWJlcicgPyB2ZWxvY2l0eSA6IHRoaXMudmVsb2NpdHk7XG4gICAgICAgIHdhdmUgPSB0eXBlb2Ygd2F2ZSA9PT0gJ251bWJlcicgPyB3YXZlIDogdGhpcy53YXZlO1xuXG4gICAgICAgIHZhciBnbGlkZVRpbWUgPSB0eXBlb2YgZ2xpZGVUaW1lID09PSAnbnVtYmVyJyA/IGdsaWRlVGltZSA6IDA7XG5cbiAgICAgICAgdGhpcy5fcmVzZXRWZWxvY2l0eUdyYXBoKCB2ZWxvY2l0eSApO1xuXG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIG5vdyApO1xuICAgICAgICB0aGlzLmdlbmVyYXRvci5kZXR1bmUuY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCBub3cgKTtcblxuICAgICAgICAvLyBub3cgKz0gMC4xXG5cbiAgICAgICAgLy8gaWYgKCB0aGlzLmdsaWRlVGltZSAhPT0gMC4wICkge1xuICAgICAgICAvLyAgICAgdmFyIHN0YXJ0RnJlcSA9IHRoaXMuZnJlcXVlbmN5LFxuICAgICAgICAvLyAgICAgICAgIGVuZEZyZXEgPSBmcmVxdWVuY3ksXG4gICAgICAgIC8vICAgICAgICAgZnJlcURpZmYgPSBlbmRGcmVxIC0gc3RhcnRGcmVxLFxuICAgICAgICAvLyAgICAgICAgIHN0YXJ0VGltZSA9IHRoaXMucmVzZXRUaW1lc3RhbXAsXG4gICAgICAgIC8vICAgICAgICAgZW5kVGltZSA9IHRoaXMucmVzZXRUaW1lc3RhbXAgKyB0aGlzLmdsaWRlVGltZSxcbiAgICAgICAgLy8gICAgICAgICBjdXJyZW50VGltZSA9IG5vdyAtIHN0YXJ0VGltZSxcbiAgICAgICAgLy8gICAgICAgICBsZXJwUG9zID0gY3VycmVudFRpbWUgLyB0aGlzLmdsaWRlVGltZSxcbiAgICAgICAgLy8gICAgICAgICBjdXJyZW50RnJlcSA9IHRoaXMubGVycCggdGhpcy5mcmVxdWVuY3ksIGZyZXF1ZW5jeSwgbGVycFBvcyApO1xuXG4gICAgICAgIC8vICAgICBpZiAoIGN1cnJlbnRUaW1lIDwgZ2xpZGVUaW1lICkge1xuICAgICAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKCAnY3V0b2ZmJywgc3RhcnRGcmVxLCBjdXJyZW50RnJlcSApO1xuICAgICAgICAvLyAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZSggY3VycmVudEZyZXEsIG5vdyApO1xuICAgICAgICAvLyAgICAgfVxuXG5cbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKCBzdGFydFRpbWUsIGVuZFRpbWUsIG5vdywgY3VycmVudFRpbWUgKTtcbiAgICAgICAgLy8gfVxuXG5cbiAgICAgICAgLy8gbm93ICs9IDAuNTtcblxuICAgICAgICBpZiAoIGdsaWRlVGltZSAhPT0gMCApIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggZnJlcXVlbmN5LCBub3cgKyBnbGlkZVRpbWUgKTtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmRldHVuZS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggZGV0dW5lLCBub3cgKyBnbGlkZVRpbWUgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZSggZnJlcXVlbmN5LCBub3cgKTtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdG9yLmRldHVuZS5zZXRWYWx1ZUF0VGltZSggZGV0dW5lLCBub3cgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggdHlwZW9mIHdhdmUgPT09ICdzdHJpbmcnICkge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3IudHlwZSA9IHdhdmU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRvci50eXBlID0gdGhpcy53YXZlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXNldFRpbWVzdGFtcCA9IG5vdztcbiAgICAgICAgdGhpcy5nbGlkZVRpbWUgPSBnbGlkZVRpbWU7XG4gICAgICAgIHRoaXMuZnJlcXVlbmN5ID0gZnJlcXVlbmN5O1xuICAgICAgICB0aGlzLmRldHVuZSA9IGRldHVuZTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgICAgICB0aGlzLndhdmUgPSB3YXZlO1xuICAgIH1cblxuICAgIHN0YXJ0KCBkZWxheSApIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3Iuc3RhcnQoIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgc3RvcCggZGVsYXkgKSB7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yLnN0b3AoIGRlbGF5ICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3IuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fY2xlYW5VcFZlbG9jaXR5R3JhcGgoKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ubWl4aW5TaW5nbGUoIE9zY2lsbGF0b3JHZW5lcmF0b3IucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU9zY2lsbGF0b3JHZW5lcmF0b3IgPSBmdW5jdGlvbiggZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHdhdmUgKSB7XG4gICAgcmV0dXJuIG5ldyBPc2NpbGxhdG9yR2VuZXJhdG9yKCB0aGlzLCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbmNsYXNzIENvdW50ZXIgZXh0ZW5kcyBOb2RlIHtcblxuICAgIGNvbnN0cnVjdG9yKCBpbywgaW5jcmVtZW50LCBsaW1pdCwgc3RlcFRpbWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuY29uc3RhbnQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBpbmNyZW1lbnQgKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcblxuICAgICAgICB0aGlzLmRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gc3RlcFRpbWUgfHwgMSAvIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlO1xuXG4gICAgICAgIHRoaXMuZmVlZGJhY2sgPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmdhaW4udmFsdWUgPSAwO1xuICAgICAgICB0aGlzLmZlZWRiYWNrLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcblxuICAgICAgICB0aGlzLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLmZlZWRiYWNrICk7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suY29ubmVjdCggdGhpcy5kZWxheSApO1xuXG4gICAgICAgIHRoaXMubGVzc1RoYW4gPSB0aGlzLmlvLmNyZWF0ZUxlc3NUaGFuKCBsaW1pdCApO1xuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMubGVzc1RoYW4gKTtcbiAgICAgICAgdGhpcy5sZXNzVGhhbi5jb25uZWN0KCB0aGlzLmZlZWRiYWNrLmdhaW4gKTtcbiAgICAgICAgdGhpcy5jb25zdGFudC5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMubGVzc1RoYW4uY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuZGVsYXkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ291bnRlciA9IGZ1bmN0aW9uKCBpbmNyZW1lbnQsIGxpbWl0LCBzdGVwVGltZSApIHtcbiAgICByZXR1cm4gbmV3IENvdW50ZXIoIHRoaXMsIGluY3JlbWVudCwgbGltaXQsIHN0ZXBUaW1lICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBEaWZmdXNlRGVsYXkgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMgPSB7XG4gICAgICAgICAgICBkaWZmdXNpb246IHRoaXMuaW8uY3JlYXRlUGFyYW0oKSxcbiAgICAgICAgICAgIHRpbWU6IHRoaXMuaW8uY3JlYXRlUGFyYW0oKVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZmVlZGJhY2tBZGRlciA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuZGVsYXkgPSB0aGlzLmNvbnRleHQuY3JlYXRlRGVsYXkoKTtcbiAgICAgICAgdGhpcy5uZWdhdGUgPSB0aGlzLmlvLmNyZWF0ZU5lZ2F0ZSgpO1xuICAgICAgICB0aGlzLm11bHRpcGx5MSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseTIgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuc3VtID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgdGhpcy5zaGVsZiA9IHRoaXMuaW8uY3JlYXRlRVFTaGVsZigpO1xuXG4gICAgICAgIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgdGhpcy5jb250cm9scy50aW1lLmNvbm5lY3QoIHRoaXMuZGVsYXkuZGVsYXlUaW1lICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5kaWZmdXNpb24uY29ubmVjdCggdGhpcy5uZWdhdGUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MSwgMCwgMCApO1xuICAgICAgICB0aGlzLm5lZ2F0ZS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MSwgMCwgMSApO1xuICAgICAgICB0aGlzLm11bHRpcGx5MS5jb25uZWN0KCB0aGlzLnN1bSwgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWzBdLmNvbm5lY3QoIHRoaXMuZmVlZGJhY2tBZGRlciwgMCwgMCApO1xuICAgICAgICB0aGlzLm11bHRpcGx5Mi5jb25uZWN0KCB0aGlzLmZlZWRiYWNrQWRkZXIsIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmZlZWRiYWNrQWRkZXIuY29ubmVjdCggdGhpcy5kZWxheSApO1xuICAgICAgICB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMuc2hlbGYgKTtcblxuICAgICAgICB0aGlzLnNoZWxmLmNvbm5lY3QoIHRoaXMuc3VtLCAwLCAwICk7XG5cblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRpZmZ1c2lvbi5jb25uZWN0KCB0aGlzLm11bHRpcGx5MiwgMCwgMSApO1xuICAgICAgICB0aGlzLnN1bS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MiwgMCwgMSApO1xuICAgICAgICB0aGlzLnN1bS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVEaWZmdXNlRGVsYXkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IERpZmZ1c2VEZWxheSggdGhpcyApO1xufTtcblxuZXhwb3J0XG5kZWZhdWx0IERpZmZ1c2VEZWxheTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IF9zZXRJTyBmcm9tIFwiLi4vbWl4aW5zL3NldElPLmVzNlwiO1xuaW1wb3J0IGNvbm5lY3Rpb25zIGZyb20gXCIuLi9taXhpbnMvY29ubmVjdGlvbnMuZXM2XCI7XG5pbXBvcnQgY2xlYW5lcnMgZnJvbSBcIi4uL21peGlucy9jbGVhbmVycy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuLy8gVGhpcyBmdW5jdGlvbiBjcmVhdGVzIGEgZ3JhcGggdGhhdCBhbGxvd3MgbW9ycGhpbmdcbi8vIGJldHdlZW4gdHdvIGdhaW4gbm9kZXMuXG4vL1xuLy8gSXQgbG9va3MgYSBsaXR0bGUgYml0IGxpa2UgdGhpczpcbi8vXG4vLyAgICAgICAgICAgICAgICAgZHJ5IC0+IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLT4gfFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYgIEdhaW4oMC0xKSAgICAtPiAgICAgR2FpbigtMSkgICAgIC0+ICAgICBvdXRwdXRcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChmYWRlcikgICAgICAgICAoaW52ZXJ0IHBoYXNlKSAgICAgICAgKHN1bW1pbmcpXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICBeXG4vLyAgICB3ZXQgLT4gICBHYWluKC0xKSAgIC0+IC18XG4vLyAgICAgICAgICAoaW52ZXJ0IHBoYXNlKVxuLy9cbi8vIFdoZW4gYWRqdXN0aW5nIHRoZSBmYWRlcidzIGdhaW4gdmFsdWUgaW4gdGhpcyBncmFwaCxcbi8vIGlucHV0MSdzIGdhaW4gbGV2ZWwgd2lsbCBjaGFuZ2UgZnJvbSAwIHRvIDEsXG4vLyB3aGlsc3QgaW5wdXQyJ3MgZ2FpbiBsZXZlbCB3aWxsIGNoYW5nZSBmcm9tIDEgdG8gMC5cbmNsYXNzIERyeVdldE5vZGUgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGRyeVdldFZhbHVlID0gMCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAyLCAxICk7XG5cbiAgICAgICAgdGhpcy5kcnkgPSB0aGlzLmlucHV0c1sgMCBdO1xuICAgICAgICB0aGlzLndldCA9IHRoaXMuaW5wdXRzWyAxIF07XG5cbiAgICAgICAgLy8gSW52ZXJ0IHdldCBzaWduYWwncyBwaGFzZVxuICAgICAgICB0aGlzLndldElucHV0SW52ZXJ0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy53ZXRJbnB1dEludmVydC5nYWluLnZhbHVlID0gLTE7XG4gICAgICAgIHRoaXMud2V0LmNvbm5lY3QoIHRoaXMud2V0SW5wdXRJbnZlcnQgKTtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGZhZGVyIG5vZGVcbiAgICAgICAgdGhpcy5mYWRlciA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZmFkZXIuZ2Fpbi52YWx1ZSA9IDA7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb250cm9sIG5vZGUuIEl0IHNldHMgdGhlIGZhZGVyJ3MgdmFsdWUuXG4gICAgICAgIHRoaXMuZHJ5V2V0Q29udHJvbCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGRyeVdldFZhbHVlICk7XG4gICAgICAgIHRoaXMuZHJ5V2V0Q29udHJvbC5jb25uZWN0KCB0aGlzLmZhZGVyLmdhaW4gKTtcblxuICAgICAgICAvLyBJbnZlcnQgdGhlIGZhZGVyIG5vZGUncyBwaGFzZVxuICAgICAgICB0aGlzLmZhZGVySW52ZXJ0ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5mYWRlckludmVydC5nYWluLnZhbHVlID0gLTE7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBmYWRlciB0byBmYWRlciBwaGFzZSBpbnZlcnNpb24sXG4gICAgICAgIC8vIGFuZCBmYWRlciBwaGFzZSBpbnZlcnNpb24gdG8gb3V0cHV0LlxuICAgICAgICB0aGlzLndldElucHV0SW52ZXJ0LmNvbm5lY3QoIHRoaXMuZmFkZXIgKTtcbiAgICAgICAgdGhpcy5mYWRlci5jb25uZWN0KCB0aGlzLmZhZGVySW52ZXJ0ICk7XG4gICAgICAgIHRoaXMuZmFkZXJJbnZlcnQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBDb25uZWN0IGRyeSBpbnB1dCB0byBib3RoIHRoZSBvdXRwdXQgYW5kIHRoZSBmYWRlciBub2RlXG4gICAgICAgIHRoaXMuZHJ5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuZHJ5LmNvbm5lY3QoIHRoaXMuZmFkZXIgKTtcblxuICAgICAgICAvLyBBZGQgYSAnZHJ5V2V0JyBwcm9wZXJ0eSB0byB0aGUgY29udHJvbHMgb2JqZWN0LlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmRyeVdldCA9IHRoaXMuZHJ5V2V0Q29udHJvbDtcbiAgICB9XG5cbn1cblxuXG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRHJ5V2V0Tm9kZSA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IERyeVdldE5vZGUoIHRoaXMsIHZhbHVlICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBEcnlXZXROb2RlO1xuIiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbmNsYXNzIEVRU2hlbGYgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIGhpZ2hGcmVxdWVuY3kgPSAyNTAwLCBsb3dGcmVxdWVuY3kgPSAzNTAsIGhpZ2hCb29zdCA9IC02LCBsb3dCb29zdCA9IDAgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuaGlnaEZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGhpZ2hGcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5sb3dGcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dGcmVxdWVuY3kgKTtcbiAgICAgICAgdGhpcy5oaWdoQm9vc3QgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoQm9vc3QgKTtcbiAgICAgICAgdGhpcy5sb3dCb29zdCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIGxvd0Jvb3N0ICk7XG5cbiAgICAgICAgdGhpcy5sb3dTaGVsZiA9IHRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgICAgICAgdGhpcy5sb3dTaGVsZi50eXBlID0gJ2xvd3NoZWxmJztcbiAgICAgICAgdGhpcy5sb3dTaGVsZi5mcmVxdWVuY3kudmFsdWUgPSBsb3dGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMubG93U2hlbGYuZ2Fpbi52YWx1ZSA9IGxvd0Jvb3N0O1xuXG4gICAgICAgIHRoaXMuaGlnaFNoZWxmID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICB0aGlzLmhpZ2hTaGVsZi50eXBlID0gJ2hpZ2hzaGVsZic7XG4gICAgICAgIHRoaXMuaGlnaFNoZWxmLmZyZXF1ZW5jeS52YWx1ZSA9IGhpZ2hGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuaGlnaFNoZWxmLmdhaW4udmFsdWUgPSBoaWdoQm9vc3Q7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmxvd1NoZWxmICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5oaWdoU2hlbGYgKTtcbiAgICAgICAgdGhpcy5sb3dTaGVsZi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmhpZ2hTaGVsZi5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIC8vIFN0b3JlIGNvbnRyb2xsYWJsZSBwYXJhbXMuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRPRE86XG4gICAgICAgIC8vICAtIFNob3VsZCB0aGVzZSBiZSByZWZlcmVuY2VzIHRvIHBhcmFtLmNvbnRyb2w/IFRoaXNcbiAgICAgICAgLy8gICAgbWlnaHQgYWxsb3cgZGVmYXVsdHMgdG8gYmUgc2V0IHdoaWxzdCBhbHNvIGFsbG93aW5nXG4gICAgICAgIC8vICAgIGF1ZGlvIHNpZ25hbCBjb250cm9sLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLmhpZ2hGcmVxdWVuY3kgPSB0aGlzLmhpZ2hGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93RnJlcXVlbmN5ID0gdGhpcy5sb3dGcmVxdWVuY3k7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaGlnaEJvb3N0ID0gdGhpcy5oaWdoQm9vc3Q7XG4gICAgICAgIHRoaXMuY29udHJvbHMubG93Qm9vc3QgPSB0aGlzLmxvd0Jvb3N0O1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVFUVNoZWxmID0gZnVuY3Rpb24oIGhpZ2hGcmVxdWVuY3ksIGxvd0ZyZXF1ZW5jeSwgaGlnaEJvb3N0LCBsb3dCb29zdCApIHtcbiAgICByZXR1cm4gbmV3IEVRU2hlbGYoIHRoaXMsIGhpZ2hGcmVxdWVuY3ksIGxvd0ZyZXF1ZW5jeSwgaGlnaEJvb3N0LCBsb3dCb29zdCApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRVFTaGVsZjsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbmNsYXNzIEVudmVsb3BlRm9sbG93ZXIgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgYWNjdXJhY3kgPSAxMCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5kaXZpc29yID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggMC42OTMxNDcsIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlICogMC41ICk7XG4gICAgICAgIHRoaXMuU2FtcGxlRGVsYXkgPSB0aGlzLmlvLmNyZWF0ZVNhbXBsZURlbGF5KCk7XG4gICAgICAgIHRoaXMuZ3JlYXRlclRoYW5aZXJvID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhblplcm8oKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5zd2l0Y2ggPSB0aGlzLmlvLmNyZWF0ZVN3aXRjaCggMiwgMCApO1xuICAgICAgICB0aGlzLmFkZCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG5cblxuICAgICAgICB0aGlzLnN1YnRyYWN0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc3VidHJhY3QsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5TYW1wbGVEZWxheS5jb25uZWN0KCB0aGlzLnN1YnRyYWN0LCAwLCAxICk7XG4gICAgICAgIHRoaXMuU2FtcGxlRGVsYXkuY29ubmVjdCggdGhpcy5hZGQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5hZGQuY29ubmVjdCggdGhpcy5TYW1wbGVEZWxheSApO1xuXG4gICAgICAgIHRoaXMuc3VidHJhY3QuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLnN1YnRyYWN0LmNvbm5lY3QoIHRoaXMuZ3JlYXRlclRoYW5aZXJvICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy51cCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5kb3duID0gdGhpcy5pby5jcmVhdGVQYXJhbSgpO1xuXG4gICAgICAgIC8vIFVwIGZsb3cuXG4gICAgICAgIHRoaXMudXBNaW4gPSB0aGlzLmlvLmNyZWF0ZU1pbiggMSApO1xuICAgICAgICB0aGlzLnVwRGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgdGhpcy5kaXZpc29yLmNvbm5lY3QoIHRoaXMudXBEaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgdGhpcy51cE1pbi5jb25uZWN0KCB0aGlzLnVwRGl2aWRlLCAwLCAxICk7XG4gICAgICAgIHRoaXMudXBEaXZpZGUuY29ubmVjdCggdGhpcy5zd2l0Y2guaW5wdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBkb3duIGZsb3dcbiAgICAgICAgdGhpcy5kb3duTWluID0gdGhpcy5pby5jcmVhdGVNaW4oIDEgKTtcbiAgICAgICAgdGhpcy5kb3duRGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgdGhpcy5kaXZpc29yLmNvbm5lY3QoIHRoaXMuZG93bkRpdmlkZSwgMCwgMCApO1xuICAgICAgICB0aGlzLmRvd25NaW4uY29ubmVjdCggdGhpcy5kb3duRGl2aWRlLCAwLCAxICk7XG4gICAgICAgIHRoaXMuZG93bkRpdmlkZS5jb25uZWN0KCB0aGlzLnN3aXRjaC5pbnB1dHNbIDEgXSApO1xuXG4gICAgICAgIC8vIHRoaXMuZ3JlYXRlclRoYW5aZXJvLmNvbm5lY3QoIHRoaXMuc3dpdGNoLmNvbnRyb2wgKTtcbiAgICAgICAgdGhpcy5zd2l0Y2guY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMSApO1xuICAgICAgICB0aGlzLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMuYWRkLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5hZGQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRW52ZWxvcGVGb2xsb3dlciA9IGZ1bmN0aW9uKCBhY2N1cmFjeSApIHtcbiAgICByZXR1cm4gbmV3IEVudmVsb3BlRm9sbG93ZXIoIHRoaXMsIGFjY3VyYWN5ICk7XG59OyIsImltcG9ydCBBdWRpb0lPIGZyb20gXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG52YXIgT1NDSUxMQVRPUl9UWVBFUyA9IFtcbiAgICAnc2luZScsXG4gICAgJ3RyaWFuZ2xlJyxcbiAgICAnc2F3dG9vdGgnLFxuICAgICdzcXVhcmUnXG5dO1xuXG5jbGFzcyBPc2NpbGxhdG9yQmFuayBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5mcmVxdWVuY3kgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuc3dpdGNoID0gdGhpcy5pby5jcmVhdGVTd2l0Y2goIE9TQ0lMTEFUT1JfVFlQRVMubGVuZ3RoICk7XG5cbiAgICAgICAgdGhpcy5vc2NpbGxhdG9ycyA9IFtdO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgT1NDSUxMQVRPUl9UWVBFUy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgIHZhciBvc2MgPSB0aGlzLmNvbnRleHQuY3JlYXRlT3NjaWxsYXRvcigpO1xuICAgICAgICAgICAgb3NjLnR5cGUgPSBPU0NJTExBVE9SX1RZUEVTWyBpIF07XG4gICAgICAgICAgICBvc2MuZnJlcXVlbmN5LnZhbHVlID0gMDtcbiAgICAgICAgICAgIHRoaXMuZnJlcXVlbmN5LmNvbm5lY3QoIG9zYy5mcmVxdWVuY3kgKTtcbiAgICAgICAgICAgIG9zYy5zdGFydCggMCApO1xuICAgICAgICAgICAgb3NjLmNvbm5lY3QoIHRoaXMuc3dpdGNoLCAwLCBpICk7XG4gICAgICAgICAgICB0aGlzLm9zY2lsbGF0b3JzLnB1c2goIG9zYyApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zd2l0Y2guY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLndhdmVmb3JtID0gdGhpcy5zd2l0Y2guY29udHJvbDtcbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmZyZXF1ZW5jeTtcbiAgICB9XG5cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlT3NjaWxsYXRvckJhbmsgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9zY2lsbGF0b3JCYW5rKCB0aGlzICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBPc2NpbGxhdG9yQmFuazsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgUGhhc2VPZmZzZXQgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMucmVjaXByb2NhbCA9IHRoaXMuaW8uY3JlYXRlUmVjaXByb2NhbCggdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKiAwLjUgKTtcbiAgICAgICAgdGhpcy5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLmZyZXF1ZW5jeSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5waGFzZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5oYWxmUGhhc2UgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAwLjUgKTtcblxuICAgICAgICB0aGlzLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5mcmVxdWVuY3kuY29ubmVjdCggdGhpcy5yZWNpcHJvY2FsICk7XG4gICAgICAgIHRoaXMucmVjaXByb2NhbC5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMucGhhc2UuY29ubmVjdCggdGhpcy5oYWxmUGhhc2UgKTtcbiAgICAgICAgdGhpcy5oYWxmUGhhc2UuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMSApO1xuICAgICAgICB0aGlzLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMuZGVsYXkuZGVsYXlUaW1lICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4udmFsdWUgPSAwLjU7XG5cbiAgICAgICAgLy8gU3RvcmUgY29udHJvbGxhYmxlIHBhcmFtcy5cbiAgICAgICAgdGhpcy5jb250cm9scy5mcmVxdWVuY3kgPSB0aGlzLmZyZXF1ZW5jeTtcbiAgICAgICAgdGhpcy5jb250cm9scy5waGFzZSA9IHRoaXMucGhhc2U7XG4gICAgfVxuXG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBoYXNlT2Zmc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQaGFzZU9mZnNldCggdGhpcyApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgUGhhc2VPZmZzZXQ7IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcbi8vIGltcG9ydCBfc2V0SU8gZnJvbSBcIi4uL21peGlucy9zZXRJTy5lczZcIjtcbmltcG9ydCBtYXRoIGZyb20gXCIuLi9taXhpbnMvbWF0aC5lczZcIjtcbi8vIGltcG9ydCBOb3RlIGZyb20gXCIuLi9ub3RlL05vdGUuZXM2XCI7XG4vLyBpbXBvcnQgQ2hvcmQgZnJvbSBcIi4uL25vdGUvQ2hvcmQuZXM2XCI7XG5cbi8vICBQbGF5ZXJcbi8vICA9PT09PT1cbi8vICBUYWtlcyBjYXJlIG9mIHJlcXVlc3RpbmcgR2VuZXJhdG9yTm9kZXMgYmUgY3JlYXRlZC5cbi8vXG4vLyAgSGFzOlxuLy8gICAgICAtIFBvbHlwaG9ueSAocGFyYW0pXG4vLyAgICAgIC0gVW5pc29uIChwYXJhbSlcbi8vICAgICAgLSBVbmlzb24gZGV0dW5lIChwYXJhbSlcbi8vICAgICAgLSBVbmlzb24gcGhhc2UgKHBhcmFtKVxuLy8gICAgICAtIEdsaWRlIG1vZGVcbi8vICAgICAgLSBHbGlkZSB0aW1lXG4vLyAgICAgIC0gVmVsb2NpdHkgc2Vuc2l0aXZpdHkgKHBhcmFtKVxuLy8gICAgICAtIEdsb2JhbCB0dW5pbmcgKHBhcmFtKVxuLy9cbi8vICBNZXRob2RzOlxuLy8gICAgICAtIHN0YXJ0KCBmcmVxL25vdGUsIHZlbCwgZGVsYXkgKVxuLy8gICAgICAtIHN0b3AoIGZyZXEvbm90ZSwgdmVsLCBkZWxheSApXG4vL1xuLy8gIFByb3BlcnRpZXM6XG4vLyAgICAgIC0gcG9seXBob255IChudW1iZXIsID4xKVxuLy8gICAgICAtIHVuaXNvbiAobnVtYmVyLCA+MSlcbi8vICAgICAgLSB1bmlzb25EZXR1bmUgKG51bWJlciwgY2VudHMpXG4vLyAgICAgIC0gdW5pc29uUGhhc2UgKG51bWJlciwgMC0xKVxuLy8gICAgICAtIGdsaWRlTW9kZSAoc3RyaW5nKVxuLy8gICAgICAtIGdsaWRlVGltZSAobXMsIG51bWJlcilcbi8vICAgICAgLSB2ZWxvY2l0eVNlbnNpdGl2aXR5ICgwLTEsIG51bWJlcilcbi8vICAgICAgLSB0dW5pbmcgKC02NCwgKzY0LCBzZW1pdG9uZXMpXG4vL1xuY2xhc3MgR2VuZXJhdG9yUGxheWVyIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBvcHRpb25zICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICBpZiAoIG9wdGlvbnMuZ2VuZXJhdG9yID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdHZW5lcmF0b3JQbGF5ZXIgcmVxdWlyZXMgYSBgZ2VuZXJhdG9yYCBvcHRpb24gdG8gYmUgZ2l2ZW4uJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSBvcHRpb25zLmdlbmVyYXRvcjtcblxuICAgICAgICB0aGlzLnBvbHlwaG9ueSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIG9wdGlvbnMucG9seXBob255IHx8IDEgKTtcblxuICAgICAgICB0aGlzLnVuaXNvbiA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIG9wdGlvbnMudW5pc29uIHx8IDEgKTtcbiAgICAgICAgdGhpcy51bmlzb25EZXR1bmUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy51bmlzb25EZXR1bmUgPT09ICdudW1iZXInID8gb3B0aW9ucy51bmlzb25EZXR1bmUgOiAwICk7XG4gICAgICAgIHRoaXMudW5pc29uUGhhc2UgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB0eXBlb2Ygb3B0aW9ucy51bmlzb25QaGFzZSA9PT0gJ251bWJlcicgPyBvcHRpb25zLnVuaXNvblBoYXNlIDogMCApO1xuICAgICAgICB0aGlzLnVuaXNvbk1vZGUgPSBvcHRpb25zLnVuaXNvbk1vZGUgfHwgJ2NlbnRlcmVkJztcblxuICAgICAgICB0aGlzLmdsaWRlTW9kZSA9IG9wdGlvbnMuZ2xpZGVNb2RlIHx8ICdlcXVhbCc7XG4gICAgICAgIHRoaXMuZ2xpZGVUaW1lID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMuZ2xpZGVUaW1lID09PSAnbnVtYmVyJyA/IG9wdGlvbnMuZ2xpZGVUaW1lIDogMCApO1xuXG4gICAgICAgIHRoaXMudmVsb2NpdHlTZW5zaXRpdml0eSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHR5cGVvZiBvcHRpb25zLnZlbG9jaXR5U2Vuc2l0aXZpdHkgPT09ICdudW1iZXInID8gb3B0aW9ucy52ZWxvY2l0eVNlbnNpdGl2aXR5IDogMCApO1xuXG4gICAgICAgIHRoaXMudHVuaW5nID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdHlwZW9mIG9wdGlvbnMudHVuaW5nID09PSAnbnVtYmVyJyA/IG9wdGlvbnMudHVuaW5nIDogMCApO1xuXG4gICAgICAgIHRoaXMud2F2ZWZvcm0gPSBvcHRpb25zLndhdmVmb3JtIHx8ICdzaW5lJztcblxuICAgICAgICB0aGlzLmVudmVsb3BlID0gb3B0aW9ucy5lbnZlbG9wZSB8fCB0aGlzLmlvLmNyZWF0ZUFTRFJFbnZlbG9wZSgpO1xuXG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0cyA9IHt9O1xuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0ID0gW107XG4gICAgICAgIHRoaXMudGltZXJzID0gW107XG4gICAgfVxuXG5cbiAgICBfY3JlYXRlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgd2F2ZWZvcm0gKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRvci5jYWxsKCB0aGlzLmlvLCBmcmVxdWVuY3ksIGRldHVuZSArIHRoaXMudHVuaW5nLnZhbHVlICogMTAwLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lLCB3YXZlZm9ybSApO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogQ2FsY3VsYXRlcyB0aGUgYW1vdW50IG9mIGRldHVuZSAoY2VudHMpIHRvIGFwcGx5IHRvIGEgZ2VuZXJhdG9yIG5vZGVcbiAgICAgKiBnaXZlbiBhbiBpbmRleCBiZXR3ZWVuIDAgYW5kIHRoaXMudW5pc29uLnZhbHVlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHVuaXNvbkluZGV4IFVuaXNvbiBpbmRleC5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICAgICAgICAgIERldHVuZSB2YWx1ZSwgaW4gY2VudHMuXG4gICAgICovXG4gICAgX2NhbGN1bGF0ZURldHVuZSggdW5pc29uSW5kZXggKSB7XG4gICAgICAgIHZhciBkZXR1bmUgPSAwLjAsXG4gICAgICAgICAgICB1bmlzb25EZXR1bmUgPSB0aGlzLnVuaXNvbkRldHVuZS52YWx1ZTtcblxuICAgICAgICBpZiAoIHRoaXMudW5pc29uTW9kZSA9PT0gJ2NlbnRlcmVkJyApIHtcbiAgICAgICAgICAgIHZhciBpbmNyID0gdW5pc29uRGV0dW5lO1xuXG4gICAgICAgICAgICBkZXR1bmUgPSBpbmNyICogdW5pc29uSW5kZXg7XG4gICAgICAgICAgICBkZXR1bmUgLT0gaW5jciAqICggdGhpcy51bmlzb24udmFsdWUgKiAwLjUgKTtcbiAgICAgICAgICAgIGRldHVuZSArPSBpbmNyICogMC41O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIG11bHRpcGxpZXI7XG5cbiAgICAgICAgICAgIC8vIExlYXZlIHRoZSBmaXJzdCBub3RlIGluIHRoZSB1bmlzb25cbiAgICAgICAgICAgIC8vIGFsb25lLCBzbyBpdCdzIGRldHVuZSB2YWx1ZSBpcyB0aGUgcm9vdFxuICAgICAgICAgICAgLy8gbm90ZS5cbiAgICAgICAgICAgIGlmICggdW5pc29uSW5kZXggPiAwICkge1xuICAgICAgICAgICAgICAgIC8vIEhvcCBkb3duIG5lZ2F0aXZlIGhhbGYgdGhlIHVuaXNvbkluZGV4XG4gICAgICAgICAgICAgICAgaWYgKCB1bmlzb25JbmRleCAlIDIgPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIG11bHRpcGxpZXIgPSAtdW5pc29uSW5kZXggKiAwLjU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBIb3AgdXAgbiBjZW50c1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHVuaXNvbkluZGV4ID4gMSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXNvbkluZGV4ID0gdGhpcy5NYXRoLnJvdW5kVG9NdWx0aXBsZSggdW5pc29uSW5kZXgsIDIgKSAtIDI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBtdWx0aXBsaWVyID0gdW5pc29uSW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSB0aGUgbXVsdGlwbGllciwgY2FsY3VsYXRlIHRoZSBkZXR1bmUgdmFsdWVcbiAgICAgICAgICAgICAgICAvLyBmb3IgdGhlIGdpdmVuIHVuaXNvbkluZGV4LlxuICAgICAgICAgICAgICAgIGRldHVuZSA9IHVuaXNvbkRldHVuZSAqIG11bHRpcGxpZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGV0dW5lO1xuICAgIH1cblxuICAgIF9jYWxjdWxhdGVHbGlkZVRpbWUoIG9sZEZyZXEsIG5ld0ZyZXEgKSB7XG4gICAgICAgIHZhciBtb2RlID0gdGhpcy5nbGlkZU1vZGUsXG4gICAgICAgICAgICB0aW1lID0gdGhpcy5nbGlkZVRpbWUudmFsdWUsXG4gICAgICAgICAgICBnbGlkZVRpbWUsXG4gICAgICAgICAgICBmcmVxRGlmZmVyZW5jZTtcblxuICAgICAgICBpZiAoIHRpbWUgPT09IDAuMCApIHtcbiAgICAgICAgICAgIGdsaWRlVGltZSA9IDAuMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggbW9kZSA9PT0gJ2VxdWFsJyApIHtcbiAgICAgICAgICAgIGdsaWRlVGltZSA9IHRpbWUgKiAwLjAwMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZyZXFEaWZmZXJlbmNlID0gTWF0aC5hYnMoIG9sZEZyZXEgLSBuZXdGcmVxICk7XG4gICAgICAgICAgICBmcmVxRGlmZmVyZW5jZSA9IHRoaXMuTWF0aC5jbGFtcCggZnJlcURpZmZlcmVuY2UsIDAsIDUwMCApO1xuICAgICAgICAgICAgZ2xpZGVUaW1lID0gdGhpcy5NYXRoLnNjYWxlTnVtYmVyRXhwKFxuICAgICAgICAgICAgICAgIGZyZXFEaWZmZXJlbmNlLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgNTAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgdGltZVxuICAgICAgICAgICAgKSAqIDAuMDAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdsaWRlVGltZTtcbiAgICB9XG5cblxuICAgIF9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBnZW5lcmF0b3JPYmplY3QgKSB7XG4gICAgICAgIHZhciBvYmplY3RzID0gdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzO1xuXG4gICAgICAgIG9iamVjdHNbIGZyZXF1ZW5jeSBdID0gb2JqZWN0c1sgZnJlcXVlbmN5IF0gfHwgW107XG4gICAgICAgIG9iamVjdHNbIGZyZXF1ZW5jeSBdLnVuc2hpZnQoIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICB0aGlzLmFjdGl2ZUdlbmVyYXRvck9iamVjdHNGbGF0LnVuc2hpZnQoIGdlbmVyYXRvck9iamVjdCApO1xuICAgIH1cblxuICAgIF9mZXRjaEdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5ICkge1xuICAgICAgICB2YXIgb2JqZWN0cyA9IHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c1sgZnJlcXVlbmN5IF0sXG4gICAgICAgICAgICBpbmRleCA9IDA7XG5cbiAgICAgICAgaWYgKCAhb2JqZWN0cyB8fCBvYmplY3RzLmxlbmd0aCA9PT0gMCApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5wb3AoKTtcbiAgICAgICAgcmV0dXJuIG9iamVjdHMucG9wKCk7XG4gICAgfVxuXG4gICAgX2ZldGNoR2VuZXJhdG9yT2JqZWN0VG9SZXVzZSgpIHtcbiAgICAgICAgdmFyIGdlbmVyYXRvciA9IHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c0ZsYXQucG9wKCksXG4gICAgICAgICAgICBmcmVxdWVuY3k7XG5cbiAgICAgICAgY29uc29sZS5sb2coICdyZXVzZScsIGdlbmVyYXRvciApO1xuXG4gICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggZ2VuZXJhdG9yICkgKSB7XG4gICAgICAgICAgICBmcmVxdWVuY3kgPSBnZW5lcmF0b3JbIDAgXS5mcmVxdWVuY3k7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGdlbmVyYXRvci5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVudmVsb3BlLmZvcmNlU3RvcCggZ2VuZXJhdG9yWyBpIF0ub3V0cHV0c1sgMCBdLmdhaW4gKTtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoIGdlbmVyYXRvclsgaSBdLnRpbWVyICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmcmVxdWVuY3kgPSBnZW5lcmF0b3IuZnJlcXVlbmN5O1xuICAgICAgICAgICAgdGhpcy5lbnZlbG9wZS5mb3JjZVN0b3AoIGdlbmVyYXRvci5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KCBnZW5lcmF0b3IudGltZXIgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYWN0aXZlR2VuZXJhdG9yT2JqZWN0c1sgZnJlcXVlbmN5IF0ucG9wKCk7XG5cbiAgICAgICAgcmV0dXJuIGdlbmVyYXRvcjtcbiAgICB9XG5cblxuICAgIF9zdGFydEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApIHtcbiAgICAgICAgZ2VuZXJhdG9yT2JqZWN0Lm91dHB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmVudmVsb3BlLnN0YXJ0KCBnZW5lcmF0b3JPYmplY3Qub3V0cHV0c1sgMCBdLmdhaW4sIGRlbGF5ICk7XG4gICAgICAgIGdlbmVyYXRvck9iamVjdC5zdGFydCggZGVsYXkgKTtcbiAgICB9XG5cbiAgICBfc3RhcnRTaW5nbGUoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICkge1xuICAgICAgICB2YXIgdW5pc29uID0gdGhpcy51bmlzb24udmFsdWUsXG4gICAgICAgICAgICBkZXR1bmUgPSAwLjAsXG4gICAgICAgICAgICB1bmlzb25HZW5lcmF0b3JBcnJheSxcbiAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCxcbiAgICAgICAgICAgIGFjdGl2ZUdlbmVyYXRvckNvdW50ID0gdGhpcy5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5sZW5ndGgsXG4gICAgICAgICAgICBleGlzdGluZ0ZyZXF1ZW5jeSxcbiAgICAgICAgICAgIGdsaWRlVGltZSA9IDAuMDtcblxuICAgICAgICBpZiAoIGFjdGl2ZUdlbmVyYXRvckNvdW50IDwgdGhpcy5wb2x5cGhvbnkudmFsdWUgKSB7XG4gICAgICAgICAgICBpZiAoIHVuaXNvbiA9PT0gMS4wICkge1xuICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2NyZWF0ZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCBkZXR1bmUsIHZlbG9jaXR5LCBnbGlkZVRpbWUsIHRoaXMud2F2ZWZvcm0gKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdW5pc29uR2VuZXJhdG9yQXJyYXkgPSBbXTtcblxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHVuaXNvbjsgKytpICkge1xuICAgICAgICAgICAgICAgICAgICBkZXR1bmUgPSB0aGlzLl9jYWxjdWxhdGVEZXR1bmUoIGkgKTtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fY3JlYXRlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGRldHVuZSwgdmVsb2NpdHksIGdsaWRlVGltZSwgdGhpcy53YXZlZm9ybSApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApO1xuICAgICAgICAgICAgICAgICAgICB1bmlzb25HZW5lcmF0b3JBcnJheS5wdXNoKCBnZW5lcmF0b3JPYmplY3QgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZUdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5LCB1bmlzb25HZW5lcmF0b3JBcnJheSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoIHVuaXNvbiA9PT0gMS4wICkge1xuICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IHRoaXMuX2ZldGNoR2VuZXJhdG9yT2JqZWN0VG9SZXVzZSgpO1xuICAgICAgICAgICAgICAgIGV4aXN0aW5nRnJlcXVlbmN5ID0gZ2VuZXJhdG9yT2JqZWN0LmZyZXF1ZW5jeTtcbiAgICAgICAgICAgICAgICBnbGlkZVRpbWUgPSB0aGlzLl9jYWxjdWxhdGVHbGlkZVRpbWUoIGV4aXN0aW5nRnJlcXVlbmN5LCBmcmVxdWVuY3kgKTtcblxuICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdC5yZXNldCggZnJlcXVlbmN5LCBkZXR1bmUgKyB0aGlzLnR1bmluZy52YWx1ZSAqIDEwMCwgdmVsb2NpdHksIGdsaWRlVGltZSApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3JlR2VuZXJhdG9yT2JqZWN0KCBmcmVxdWVuY3ksIGdlbmVyYXRvck9iamVjdCApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0ID0gdGhpcy5fZmV0Y2hHZW5lcmF0b3JPYmplY3RUb1JldXNlKCk7XG4gICAgICAgICAgICAgICAgZXhpc3RpbmdGcmVxdWVuY3kgPSBnZW5lcmF0b3JPYmplY3RbIDAgXS5mcmVxdWVuY3k7XG4gICAgICAgICAgICAgICAgZ2xpZGVUaW1lID0gdGhpcy5fY2FsY3VsYXRlR2xpZGVUaW1lKCBleGlzdGluZ0ZyZXF1ZW5jeSwgZnJlcXVlbmN5ICk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB1bmlzb247ICsraSApIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0dW5lID0gdGhpcy5fY2FsY3VsYXRlRGV0dW5lKCBpICk7XG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdFsgaSBdLnJlc2V0KCBmcmVxdWVuY3ksIGRldHVuZSArIHRoaXMudHVuaW5nLnZhbHVlICogMTAwLCB2ZWxvY2l0eSwgZ2xpZGVUaW1lICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmVHZW5lcmF0b3JPYmplY3QoIGZyZXF1ZW5jeSwgZ2VuZXJhdG9yT2JqZWN0ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXR1cm4gdGhlIGdlbmVyYXRlZCBvYmplY3QocykgaW4gY2FzZSB0aGV5J3JlIG5lZWRlZC5cbiAgICAgICAgcmV0dXJuIHVuaXNvbkdlbmVyYXRvckFycmF5ID8gdW5pc29uR2VuZXJhdG9yQXJyYXkgOiBnZW5lcmF0b3JPYmplY3Q7XG4gICAgfVxuXG4gICAgc3RhcnQoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICkge1xuICAgICAgICB2YXIgZnJlcSA9IDAsXG4gICAgICAgICAgICB2ZWxvY2l0eVNlbnNpdGl2aXR5ID0gdGhpcy52ZWxvY2l0eVNlbnNpdGl2aXR5LnZhbHVlO1xuXG4gICAgICAgIHZlbG9jaXR5ID0gdHlwZW9mIHZlbG9jaXR5ID09PSAnbnVtYmVyJyA/IHZlbG9jaXR5IDogMTtcbiAgICAgICAgZGVsYXkgPSB0eXBlb2YgZGVsYXkgPT09ICdudW1iZXInID8gZGVsYXkgOiAwO1xuXG5cbiAgICAgICAgaWYgKCB2ZWxvY2l0eVNlbnNpdGl2aXR5ICE9PSAwICkge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSB0aGlzLk1hdGguc2NhbGVOdW1iZXIoIHZlbG9jaXR5LCAwLCAxLCAwLjUgLSB2ZWxvY2l0eVNlbnNpdGl2aXR5ICogMC41LCAwLjUgKyB2ZWxvY2l0eVNlbnNpdGl2aXR5ICogMC41IClcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gMC41O1xuICAgICAgICB9XG5cblxuICAgICAgICBpZiAoIHR5cGVvZiBmcmVxdWVuY3kgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5fc3RhcnRTaW5nbGUoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZWxzZSBpZiAoIGZyZXF1ZW5jeSBpbnN0YW5jZW9mIE5vdGUgKSB7XG4gICAgICAgIC8vICAgICBmcmVxID0gZnJlcXVlbmN5LnZhbHVlSHo7XG4gICAgICAgIC8vICAgICB0aGlzLl9zdGFydFNpbmdsZSggZnJlcSwgdmVsb2NpdHksIGRlbGF5ICk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gZWxzZSBpZiAoIGZyZXF1ZW5jeSBpbnN0YW5jZW9mIENob3JkICkge1xuICAgICAgICAvLyAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgZnJlcXVlbmN5Lm5vdGVzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAvLyAgICAgICAgIGZyZXEgPSBmcmVxdWVuY3kubm90ZXNbIGkgXS52YWx1ZUh6O1xuICAgICAgICAvLyAgICAgICAgIHRoaXMuX3N0YXJ0U2luZ2xlKCBmcmVxLCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG5cbiAgICBfc3RvcEdlbmVyYXRvck9iamVjdCggZ2VuZXJhdG9yT2JqZWN0LCBkZWxheSApIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuZW52ZWxvcGUuc3RvcCggZ2VuZXJhdG9yT2JqZWN0Lm91dHB1dHNbIDAgXS5nYWluLCBkZWxheSApO1xuXG4gICAgICAgIGdlbmVyYXRvck9iamVjdC50aW1lciA9IHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gc2VsZi5hY3RpdmVHZW5lcmF0b3JPYmplY3RzRmxhdC5wb3AoKTtcbiAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdC5zdG9wKCBkZWxheSApO1xuICAgICAgICAgICAgZ2VuZXJhdG9yT2JqZWN0LmNsZWFuVXAoKTtcbiAgICAgICAgICAgIGdlbmVyYXRvck9iamVjdCA9IG51bGw7XG4gICAgICAgIH0sIGRlbGF5ICogMTAwMCArIHRoaXMuZW52ZWxvcGUudG90YWxTdG9wVGltZSAqIDEwMDAgKyAxMDAgKTtcbiAgICB9XG5cbiAgICBfc3RvcFNpbmdsZSggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKSB7XG4gICAgICAgIHZhciBnZW5lcmF0b3JPYmplY3QgPSB0aGlzLl9mZXRjaEdlbmVyYXRvck9iamVjdCggZnJlcXVlbmN5ICk7XG5cbiAgICAgICAgaWYgKCBnZW5lcmF0b3JPYmplY3QgKSB7XG4gICAgICAgICAgICAvLyBTdG9wIGdlbmVyYXRvcnMgZm9ybWVkIHdoZW4gdW5pc29uIHdhcyA+IDEgYXQgdGltZSBvZiBzdGFydCguLi4pXG4gICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGdlbmVyYXRvck9iamVjdCApICkge1xuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gZ2VuZXJhdG9yT2JqZWN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdG9wR2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3RbIGkgXSwgZGVsYXkgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9wR2VuZXJhdG9yT2JqZWN0KCBnZW5lcmF0b3JPYmplY3QsIGRlbGF5ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBnZW5lcmF0b3JPYmplY3QgPSBudWxsO1xuICAgIH1cblxuICAgIHN0b3AoIGZyZXF1ZW5jeSwgdmVsb2NpdHksIGRlbGF5ICkge1xuICAgICAgICB2ZWxvY2l0eSA9IHR5cGVvZiB2ZWxvY2l0eSA9PT0gJ251bWJlcicgPyB2ZWxvY2l0eSA6IDA7XG4gICAgICAgIGRlbGF5ID0gdHlwZW9mIGRlbGF5ID09PSAnbnVtYmVyJyA/IGRlbGF5IDogMDtcblxuICAgICAgICBpZiAoIHR5cGVvZiBmcmVxdWVuY3kgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5fc3RvcFNpbmdsZSggZnJlcXVlbmN5LCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBlbHNlIGlmICggZnJlcXVlbmN5IGluc3RhbmNlb2YgTm90ZSApIHtcbiAgICAgICAgLy8gICAgIGZyZXEgPSBmcmVxdWVuY3kudmFsdWVIejtcbiAgICAgICAgLy8gICAgIHRoaXMuX3N0b3BTaW5nbGUoIGZyZXEsIHZlbG9jaXR5LCBkZWxheSApO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGVsc2UgaWYgKCBmcmVxdWVuY3kgaW5zdGFuY2VvZiBDaG9yZCApIHtcbiAgICAgICAgLy8gICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGZyZXF1ZW5jeS5ub3Rlcy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgLy8gICAgICAgICBmcmVxID0gZnJlcXVlbmN5Lm5vdGVzWyBpIF0udmFsdWVIejtcbiAgICAgICAgLy8gICAgICAgICB0aGlzLl9zdG9wU2luZ2xlKCBmcmVxLCB2ZWxvY2l0eSwgZGVsYXkgKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuXG4vLyBBdWRpb0lPLm1peGluU2luZ2xlKCBHZW5lcmF0b3JQbGF5ZXIucHJvdG90eXBlLCBfc2V0SU8sICdfc2V0SU8nICk7XG5HZW5lcmF0b3JQbGF5ZXIucHJvdG90eXBlLk1hdGggPSBtYXRoO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVHZW5lcmF0b3JQbGF5ZXIgPSBmdW5jdGlvbiggb3B0aW9ucyApIHtcbiAgICByZXR1cm4gbmV3IEdlbmVyYXRvclBsYXllciggdGhpcywgb3B0aW9ucyApO1xufTsiLCJ3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuXG5pbXBvcnQgQXVkaW9JTyBmcm9tICcuL2NvcmUvQXVkaW9JTy5lczYnO1xuXG5pbXBvcnQgTm9kZSBmcm9tICcuL2NvcmUvTm9kZS5lczYnO1xuaW1wb3J0IFBhcmFtIGZyb20gJy4vY29yZS9QYXJhbS5lczYnO1xuaW1wb3J0ICcuL2NvcmUvV2F2ZVNoYXBlci5lczYnO1xuXG5cbi8vIGltcG9ydCAnLi9ncmFwaHMvQ3Jvc3NmYWRlci5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9EcnlXZXROb2RlLmVzNic7XG5pbXBvcnQgJy4vZ3JhcGhzL1BoYXNlT2Zmc2V0LmVzNic7XG5cbmltcG9ydCAnLi9meC9EZWxheS5lczYnO1xuaW1wb3J0ICcuL2Z4L1BpbmdQb25nRGVsYXkuZXM2JztcblxuaW1wb3J0ICcuL2dlbmVyYXRvcnMvT3NjaWxsYXRvckdlbmVyYXRvci5lczYnO1xuaW1wb3J0ICcuL2luc3RydW1lbnRzL0dlbmVyYXRvclBsYXllci5lczYnO1xuXG5cbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9EZWdUb1JhZC5lczYnO1xuaW1wb3J0ICcuL21hdGgvdHJpZ29ub21ldHJ5L1NpbmUuZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9Db3MuZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9UYW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL3RyaWdvbm9tZXRyeS9SYWRUb0RlZy5lczYnO1xuXG5cbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0VxdWFsVG8uZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0VxdWFsVG9aZXJvLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9HcmVhdGVyVGhhbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvcmVsYXRpb25hbC1vcGVyYXRvcnMvR3JlYXRlclRoYW5aZXJvLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9JZkVsc2UuZXM2JztcbmltcG9ydCAnLi9tYXRoL3JlbGF0aW9uYWwtb3BlcmF0b3JzL0xlc3NUaGFuLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9yZWxhdGlvbmFsLW9wZXJhdG9ycy9MZXNzVGhhblplcm8uZXM2JztcblxuaW1wb3J0ICcuL21hdGgvbG9naWNhbC1vcGVyYXRvcnMvTG9naWNhbE9wZXJhdG9yLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9BTkQuZXM2JztcbmltcG9ydCAnLi9tYXRoL2xvZ2ljYWwtb3BlcmF0b3JzL09SLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9sb2dpY2FsLW9wZXJhdG9ycy9OT1QuZXM2JztcblxuaW1wb3J0ICcuL21hdGgvQWJzLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9BZGQuZXM2JztcbmltcG9ydCAnLi9tYXRoL0F2ZXJhZ2UuZXM2JztcbmltcG9ydCAnLi9tYXRoL0NsYW1wLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9Db25zdGFudC5lczYnO1xuaW1wb3J0ICcuL21hdGgvRGl2aWRlLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9GbG9vci5lczYnO1xuaW1wb3J0ICcuL21hdGgvTWF4LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9NaW4uZXM2JztcbmltcG9ydCAnLi9tYXRoL011bHRpcGx5LmVzNic7XG5pbXBvcnQgJy4vbWF0aC9OZWdhdGUuZXM2JztcbmltcG9ydCAnLi9tYXRoL1Bvdy5lczYnO1xuaW1wb3J0ICcuL21hdGgvUmVjaXByb2NhbC5lczYnO1xuaW1wb3J0ICcuL21hdGgvUm91bmQuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NjYWxlLmVzNic7XG5pbXBvcnQgJy4vbWF0aC9TY2FsZUV4cC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU2lnbi5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3FydC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3VidHJhY3QuZXM2JztcbmltcG9ydCAnLi9tYXRoL1N3aXRjaC5lczYnO1xuaW1wb3J0ICcuL21hdGgvU3F1YXJlLmVzNic7XG5cbmltcG9ydCAnLi9tYXRoL0xlcnAuZXM2JztcbmltcG9ydCAnLi9tYXRoL1NhbXBsZURlbGF5LmVzNic7XG5cbmltcG9ydCAnLi9lbnZlbG9wZXMvQ3VzdG9tRW52ZWxvcGUuZXM2JztcbmltcG9ydCAnLi9lbnZlbG9wZXMvQVNEUkVudmVsb3BlLmVzNic7XG5cbmltcG9ydCAnLi9ncmFwaHMvRVFTaGVsZi5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9EaWZmdXNlRGVsYXkuZXM2Jztcbi8vIGltcG9ydCAnLi9ncmFwaHMvUmV2ZXJiRWFybHlEaWZmdXNpb24uZXM2Jztcbi8vIGltcG9ydCAnLi9ncmFwaHMvUmV2ZXJiTGF0ZURpZmZ1c2lvbi5lczYnO1xuXG4vLyBpbXBvcnQgJy4vZ3JhcGhzL1BhcmFib2xpY1NhdHVyYXRpb24uZXM2JztcblxuaW1wb3J0ICcuL2dyYXBocy9Pc2NpbGxhdG9yQmFuay5lczYnO1xuaW1wb3J0ICcuL2dyYXBocy9FbnZlbG9wZUZvbGxvd2VyLmVzNic7XG5pbXBvcnQgJy4vZ3JhcGhzL0NvdW50ZXIuZXM2JztcblxuLy8gaW1wb3J0ICcuL2dyYXBocy9Ta2V0Y2guZXM2Jztcblxud2luZG93LlBhcmFtID0gUGFyYW07XG53aW5kb3cuTm9kZSA9IE5vZGU7IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBBYnMgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgYWNjdXJhY3kgPSAxMCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gdmFyIGdhaW5BY2N1cmFjeSA9IGFjY3VyYWN5ICogMTAwO1xuICAgICAgICB2YXIgZ2FpbkFjY3VyYWN5ID0gTWF0aC5wb3coIGFjY3VyYWN5LCAyICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5nYWluLnZhbHVlID0gMSAvIGdhaW5BY2N1cmFjeTtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IGdhaW5BY2N1cmFjeTtcblxuICAgICAgICB0aGlzLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggZnVuY3Rpb24oIHggKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5hYnMoIHggKTtcbiAgICAgICAgfSwgODE5MiAqIGFjY3VyYWN5ICk7XG5cblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc2hhcGVyICk7XG4gICAgICAgIHRoaXMuc2hhcGVyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zaGFwZXIuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLnNoYXBlciA9IG51bGw7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBYnMgPSBmdW5jdGlvbiggYWNjdXJhY3kgKSB7XG4gICAgcmV0dXJuIG5ldyBBYnMoIHRoaXMsIGFjY3VyYWN5ICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogQWRkcyB0d28gYXVkaW8gc2lnbmFscyB0b2dldGhlci5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICpcbiAqIHZhciBhZGQgPSBpby5jcmVhdGVBZGQoIDIgKTtcbiAqIGluMS5jb25uZWN0KCBhZGQgKTtcbiAqXG4gKiB2YXIgYWRkID0gaW8uY3JlYXRlQWRkKCk7XG4gKiBpbjEuY29ubmVjdCggYWRkLCAwLCAwICk7XG4gKiBpbjIuY29ubmVjdCggYWRkLCAwLCAxICk7XG4gKi9cbmNsYXNzIEFkZCBleHRlbmRzIE5vZGV7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgLy8gU3RvcmUgY29udHJvbGxhYmxlIHBhcmFtcy5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW5wdXRzWyAxIF07XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuY29udHJvbCA9IG51bGw7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUFkZCA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IEFkZCggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBBdmVyYWdlIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIG51bVNhbXBsZXMsIHNhbXBsZVNpemUgPSAxICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB2YXIgb25lU2FtcGxlID0gKDEgLyB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSkgKiBzYW1wbGVTaXplLFxuICAgICAgICAgICAgbm9kZSA9IHRoaXMuaW5wdXRzWyAwIF07XG5cbiAgICAgICAgdGhpcy5zYW1wbGVTaXplID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggMSAvIHRoaXMuY29udGV4dC5zYW1wbGVSYXRlICk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMuc2FtcGxlU2l6ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5zYW1wbGVTaXplLmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5zYW1wbGVTaXplLmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmRpdmlkZSA9IHRoaXMuaW8uY3JlYXRlRGl2aWRlKCBudW1TYW1wbGVzLCB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSAqIDAuNSApO1xuXG4gICAgICAgIHRoaXMuc3VtID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgLy8gdGhpcy5zdW0uZ2Fpbi52YWx1ZSA9IDEgLyBudW1TYW1wbGVzO1xuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgbnVtU2FtcGxlczsgKytpICkge1xuICAgICAgICAgICAgdmFyIGRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgICAgICBkZWxheS5kZWxheVRpbWUudmFsdWUgPSAwO1xuICAgICAgICAgICAgdGhpcy5tdWx0aXBseS5jb25uZWN0KCBkZWxheS5kZWxheVRpbWUgKTtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdCggZGVsYXkgKTtcbiAgICAgICAgICAgIGRlbGF5LmNvbm5lY3QoIHRoaXMuc3VtICk7XG4gICAgICAgICAgICBub2RlID0gZGVsYXk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuc3VtLmNvbm5lY3QoIHRoaXMuZGl2aWRlICk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cblxuICAgICAgICAvLyB2YXIgb25lU2FtcGxlID0gKDEgLyB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSk7XG5cbiAgICAgICAgLy8gdGhpcy5kZWxheSA9IHRoaXMuY29udGV4dC5jcmVhdGVEZWxheSgpO1xuICAgICAgICAvLyB0aGlzLmRlbGF5LmRlbGF5VGltZS52YWx1ZSA9IG9uZVNhbXBsZTtcbiAgICAgICAgLy8gdGhpcy5zdW0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICAvLyB0aGlzLmRlY2F5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgLy8gdGhpcy5kZWNheS5nYWluLnZhbHVlID0gc2FtcGxlU2l6ZTtcbiAgICAgICAgLy8gdGhpcy5kaXZpZGUgPSB0aGlzLmlvLmNyZWF0ZURpdmlkZSggbnVtU2FtcGxlcywgdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUgKiAwLjUgKTtcblxuXG4gICAgICAgIC8vIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5kZWxheSApO1xuICAgICAgICAvLyB0aGlzLmRlbGF5LmNvbm5lY3QoIHRoaXMuc3VtICk7XG4gICAgICAgIC8vIHRoaXMuc3VtLmNvbm5lY3QoIHRoaXMuZGl2aWRlICk7XG4gICAgICAgIC8vIHRoaXMuc3VtLmNvbm5lY3QoIHRoaXMuZGVjYXkgKTtcbiAgICAgICAgLy8gdGhpcy5kZWNheS5jb25uZWN0KCB0aGlzLmRlbGF5ICk7XG4gICAgICAgIC8vIHRoaXMuZGl2aWRlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zaGFwZXIuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLnNoYXBlciA9IG51bGw7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBdmVyYWdlID0gZnVuY3Rpb24oIG51bVNhbXBsZXMsIHNhbXBsZVNpemUgKSB7XG4gICAgcmV0dXJuIG5ldyBBdmVyYWdlKCB0aGlzLCBudW1TYW1wbGVzLCBzYW1wbGVTaXplICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogW0NsYW1wIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtIHtbdHlwZV19IGlvICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSB7W3R5cGVdfSBtaW5WYWx1ZSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0ge1t0eXBlXX0gbWF4VmFsdWUgW2Rlc2NyaXB0aW9uXVxuICovXG5jbGFzcyBDbGFtcCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbWluVmFsdWUsIG1heFZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDAgKTsgLy8gaW8sIDEsIDFcblxuICAgICAgICB0aGlzLm1pbiA9IHRoaXMuaW8uY3JlYXRlTWluKCBtYXhWYWx1ZSApO1xuICAgICAgICB0aGlzLm1heCA9IHRoaXMuaW8uY3JlYXRlTWF4KCBtaW5WYWx1ZSApO1xuXG4gICAgICAgIHRoaXMubWluLmNvbm5lY3QoIHRoaXMubWF4ICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHMgPSBbIHRoaXMubWluIF07XG4gICAgICAgIHRoaXMub3V0cHV0cyA9IFsgdGhpcy5tYXggXTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLm1pbiA9IHRoaXMubWluLmNvbnRyb2xzLnZhbHVlO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLm1heCA9IHRoaXMubWF4LmNvbnRyb2xzLnZhbHVlO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMubWluID0gbnVsbDtcbiAgICAgICAgdGhpcy5tYXggPSBudWxsO1xuICAgIH1cblxuICAgIGdldCBtaW5WYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWluLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbWluVmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLm1pbi52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBtYXhWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWF4LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbWF4VmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLm1heC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNsYW1wID0gZnVuY3Rpb24oIG1pblZhbHVlLCBtYXhWYWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IENsYW1wKCB0aGlzLCBtaW5WYWx1ZSwgbWF4VmFsdWUgKTtcbn07IiwiaW1wb3J0IEF1ZGlvSU8gZnJvbSAnLi4vY29yZS9BdWRpb0lPLmVzNic7XG5pbXBvcnQgTm9kZSBmcm9tICcuLi9jb3JlL05vZGUuZXM2JztcblxuY2xhc3MgQ29uc3RhbnQgZXh0ZW5kcyBOb2RlIHtcbiAgICAvKipcbiAgICAgKiBBIGNvbnN0YW50LXJhdGUgYXVkaW8gc2lnbmFsXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvICAgIEluc3RhbmNlIG9mIEF1ZGlvSU9cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgVmFsdWUgb2YgdGhlIGNvbnN0YW50XG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSA9IDAuMCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgPyB2YWx1ZSA6IDA7XG4gICAgICAgIHRoaXMuaW8uY29uc3RhbnREcml2ZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXS5nYWluLnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudCA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IENvbnN0YW50KCB0aGlzLCB2YWx1ZSApO1xufTtcblxuXG4vLyBBIGJ1bmNoIG9mIHByZXNldCBjb25zdGFudHMuXG4oZnVuY3Rpb24oKSB7XG4gICAgdmFyIEUsXG4gICAgICAgIFBJLFxuICAgICAgICBQSTIsXG4gICAgICAgIExOMTAsXG4gICAgICAgIExOMixcbiAgICAgICAgTE9HMTBFLFxuICAgICAgICBMT0cyRSxcbiAgICAgICAgU1FSVDFfMixcbiAgICAgICAgU1FSVDI7XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudEUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBFIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguRSApO1xuICAgICAgICBFID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50UEkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBQSSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLlBJICk7XG4gICAgICAgIFBJID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50UEkyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gUEkyIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguUEkgKiAyICk7XG4gICAgICAgIFBJMiA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudExOMTAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGMgPSBMTjEwIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguTE4xMCApO1xuICAgICAgICBMTjEwID0gYztcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcblxuICAgIEF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZUNvbnN0YW50TE4yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gTE4yIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguTE4yICk7XG4gICAgICAgIExOMiA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudExPRzEwRSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IExPRzEwRSB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLkxPRzEwRSApO1xuICAgICAgICBMT0cxMEUgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRMT0cyRSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYyA9IExPRzJFIHx8IHRoaXMuY3JlYXRlQ29uc3RhbnQoIE1hdGguTE9HMkUgKTtcbiAgICAgICAgTE9HMkUgPSBjO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuXG4gICAgQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29uc3RhbnRTUVJUMV8yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gU1FSVDFfMiB8fCB0aGlzLmNyZWF0ZUNvbnN0YW50KCBNYXRoLlNRUlQxXzIgKTtcbiAgICAgICAgU1FSVDFfMiA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICBBdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVDb25zdGFudFNRUlQyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjID0gU1FSVDIgfHwgdGhpcy5jcmVhdGVDb25zdGFudCggTWF0aC5TUVJUMiApO1xuICAgICAgICBTUVJUMiA9IGM7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG59KCkpOyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8qKlxuICogRGl2aWRlcyB0d28gbnVtYmVyc1xuICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gKi9cbmNsYXNzIERpdmlkZSBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUsIG1heElucHV0ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICB0aGlzLl92YWx1ZSA9IHRoaXMuaW5wdXRzWyAxIF0udmFsdWU7XG5cbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDAuMDtcblxuICAgICAgICB0aGlzLnJlY2lwcm9jYWwgPSB0aGlzLmlvLmNyZWF0ZVJlY2lwcm9jYWwoIG1heElucHV0ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggdGhpcy5yZWNpcHJvY2FsICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLnJlY2lwcm9jYWwuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMuZGl2aXNvciA9IHRoaXMuaW5wdXRzWyAxIF07XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5yZWNpcHJvY2FsID0gbnVsbDtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBudWxsO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICBpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuXG4gICAgICAgICAgICAvLyBpZiggdGhpcy5pbnB1dHNbIDAgXSBpbnN0YW5jZW9mIENvbnN0YW50ICkge1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS52YWx1ZSA9IHRoaXMuX3ZhbHVlO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IG1heElucHV0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWNpcHJvY2FsLm1heElucHV0O1xuICAgIH1cbiAgICBzZXQgbWF4SW5wdXQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLnJlY2lwcm9jYWwubWF4SW5wdXQgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZURpdmlkZSA9IGZ1bmN0aW9uKCB2YWx1ZSwgbWF4SW5wdXQgKSB7XG4gICAgcmV0dXJuIG5ldyBEaXZpZGUoIHRoaXMsIHZhbHVlLCBtYXhJbnB1dCApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbi8vIE5PVEU6XG4vLyAgT25seSBhY2NlcHRzIHZhbHVlcyA+PSAtMSAmJiA8PSAxLiBWYWx1ZXMgb3V0c2lkZVxuLy8gIHRoaXMgcmFuZ2UgYXJlIGNsYW1wZWQgdG8gdGhpcyByYW5nZS5cbmNsYXNzIEZsb29yIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuRmxvb3IgKTtcblxuICAgICAgICAvLyBUaGlzIGJyYW5jaGluZyBpcyBiZWNhdXNlIGlucHV0dGluZyBgMGAgdmFsdWVzXG4gICAgICAgIC8vIGludG8gdGhlIHdhdmVzaGFwZXIgYWJvdmUgb3V0cHV0cyAtMC41IDsoXG4gICAgICAgIHRoaXMuaWZFbHNlID0gdGhpcy5pby5jcmVhdGVJZkVsc2UoKTtcbiAgICAgICAgdGhpcy5lcXVhbFRvWmVybyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUb1plcm8oKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuZXF1YWxUb1plcm8gKTtcbiAgICAgICAgdGhpcy5lcXVhbFRvWmVyby5jb25uZWN0KCB0aGlzLmlmRWxzZS5pZiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuaWZFbHNlLnRoZW4gKTtcbiAgICAgICAgdGhpcy5zaGFwZXIuY29ubmVjdCggdGhpcy5pZkVsc2UuZWxzZSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5zaGFwZXIgKTtcbiAgICAgICAgdGhpcy5pZkVsc2UuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuc2hhcGVyLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5pZkVsc2UuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmVxdWFsVG9aZXJvLmNsZWFuVXAoKTtcblxuICAgICAgICB0aGlzLnNoYXBlciA9IG51bGw7XG4gICAgICAgIHRoaXMuaWZFbHNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5lcXVhbFRvWmVybyA9IG51bGw7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVGbG9vciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRmxvb3IoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgTGVycCBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDMsIDEgKTtcblxuICAgICAgICB0aGlzLmFkZCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuc3VidHJhY3QgPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG5cbiAgICAgICAgdGhpcy5zdGFydCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oKTtcbiAgICAgICAgdGhpcy5lbmQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG4gICAgICAgIHRoaXMuZGVsdGEgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCk7XG5cbiAgICAgICAgdGhpcy5lbmQuY29ubmVjdCggdGhpcy5zdWJ0cmFjdCwgMCwgMCApO1xuICAgICAgICB0aGlzLnN0YXJ0LmNvbm5lY3QoIHRoaXMuc3VidHJhY3QsIDAsIDEgKTtcbiAgICAgICAgdGhpcy5zdWJ0cmFjdC5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMuZGVsdGEuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuc3RhcnQuY29ubmVjdCggdGhpcy5hZGQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseS5jb25uZWN0KCB0aGlzLmFkZCwgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuYWRkLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnN0YXJ0ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggdGhpcy5lbmQgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDIgXS5jb25uZWN0KCB0aGlzLmRlbHRhICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5zdGFydCA9IHRoaXMuc3RhcnQ7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZW5kID0gdGhpcy5lbmQ7XG4gICAgICAgIHRoaXMuY29udHJvbHMuZGVsdGEgPSB0aGlzLmRlbHRhO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgLy8gVE9ETy4uIVxuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVycCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTGVycCggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIFdoZW4gaW5wdXQgaXMgPCBgdmFsdWVgLCBvdXRwdXRzIGB2YWx1ZWAsIG90aGVyd2lzZSBvdXRwdXRzIGlucHV0LlxuICogQHBhcmFtIHtBdWRpb0lPfSBpbyAgIEF1ZGlvSU8gaW5zdGFuY2VcbiAqIEBwYXJhbSB7TnVtYmVyfSB2YWx1ZSBUaGUgbWluaW11bSB2YWx1ZSB0byB0ZXN0IGFnYWluc3QuXG4gKi9cblxuY2xhc3MgTWF4IGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5ncmVhdGVyVGhhbiA9IHRoaXMuaW8uY3JlYXRlR3JlYXRlclRoYW4oKTtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIHRoaXMuZ3JlYXRlclRoYW4gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmdyZWF0ZXJUaGFuLmNvbnRyb2xzLnZhbHVlICk7XG5cbiAgICAgICAgdGhpcy5zd2l0Y2ggPSB0aGlzLmlvLmNyZWF0ZVN3aXRjaCggMiwgMCApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5zd2l0Y2guaW5wdXRzWyAwIF0gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCB0aGlzLnN3aXRjaC5pbnB1dHNbIDEgXSApO1xuICAgICAgICB0aGlzLmdyZWF0ZXJUaGFuLmNvbm5lY3QoIHRoaXMuc3dpdGNoLmNvbnRyb2wgKTtcbiAgICAgICAgdGhpcy5zd2l0Y2guY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmdyZWF0ZXJUaGFuLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5zd2l0Y2guY2xlYW5VcCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLmdyZWF0ZXJUaGFuID0gbnVsbDtcbiAgICAgICAgdGhpcy5zd2l0Y2ggPSBudWxsO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZU1heCA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IE1heCggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBXaGVuIGlucHV0IGlzID4gYHZhbHVlYCwgb3V0cHV0cyBgdmFsdWVgLCBvdGhlcndpc2Ugb3V0cHV0cyBpbnB1dC5cbiAqIEBwYXJhbSB7QXVkaW9JT30gaW8gICBBdWRpb0lPIGluc3RhbmNlXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgVGhlIG1pbmltdW0gdmFsdWUgdG8gdGVzdCBhZ2FpbnN0LlxuICovXG5jbGFzcyBNaW4gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuXG4gICAgICAgIHRoaXMubGVzc1RoYW4gPSB0aGlzLmlvLmNyZWF0ZUxlc3NUaGFuKCk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCB0aGlzLmxlc3NUaGFuICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5sZXNzVGhhbi5jb250cm9scy52YWx1ZSApO1xuXG4gICAgICAgIHRoaXMuc3dpdGNoID0gdGhpcy5pby5jcmVhdGVTd2l0Y2goIDIsIDAgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc3dpdGNoLmlucHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggdGhpcy5zd2l0Y2guaW5wdXRzWyAxIF0gKTtcbiAgICAgICAgdGhpcy5sZXNzVGhhbi5jb25uZWN0KCB0aGlzLnN3aXRjaC5jb250cm9sICk7XG4gICAgICAgIHRoaXMuc3dpdGNoLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmxlc3NUaGFuLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5zd2l0Y2guY2xlYW5VcCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLmxlc3NUaGFuID0gbnVsbDtcbiAgICAgICAgdGhpcy5zd2l0Y2ggPSBudWxsO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTWluID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgTWluKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdHdvIGF1ZGlvIHNpZ25hbHMgdG9nZXRoZXIuXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgTXVsdGlwbHkgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMSBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDAuMDtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlucHV0c1sgMSBdO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuY29udHJvbCA9IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cblxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVNdWx0aXBseSA9IGZ1bmN0aW9uKCB2YWx1ZTEsIHZhbHVlMiApIHtcbiAgICByZXR1cm4gbmV3IE11bHRpcGx5KCB0aGlzLCB2YWx1ZTEsIHZhbHVlMiApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vKipcbiAqIE5lZ2F0ZXMgdGhlIGluY29taW5nIGF1ZGlvIHNpZ25hbC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICovXG5jbGFzcyBOZWdhdGUgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMCApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICB0aGlzLm91dHB1dHMgPSB0aGlzLmlucHV0cztcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTmVnYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBOZWdhdGUoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqXG4gKiBOb3RlOiBET0VTIE5PVCBIQU5ETEUgTkVHQVRJVkUgUE9XRVJTLlxuICovXG5jbGFzcyBQb3cgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLm11bHRpcGxpZXJzID0gW107XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBub2RlID0gdGhpcy5pbnB1dHNbIDAgXTsgaSA8IHZhbHVlIC0gMTsgKytpICkge1xuICAgICAgICAgICAgdGhpcy5tdWx0aXBsaWVyc1sgaSBdID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm11bHRpcGxpZXJzWyBpIF0uY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgICAgIG5vZGUuY29ubmVjdCggdGhpcy5tdWx0aXBsaWVyc1sgaSBdICk7XG4gICAgICAgICAgICBub2RlID0gdGhpcy5tdWx0aXBsaWVyc1sgaSBdO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IHRoaXMubXVsdGlwbGllcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICAgICAgICB0aGlzLm11bHRpcGxpZXJzWyBpIF0uY2xlYW5VcCgpO1xuICAgICAgICAgICAgdGhpcy5tdWx0aXBsaWVyc1sgaSBdID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubXVsdGlwbGllcnMgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSB0aGlzLm11bHRpcGxpZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgICAgdGhpcy5tdWx0aXBsaWVyc1sgaSBdLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIHRoaXMubXVsdGlwbGllcnMuc3BsaWNlKCBpLCAxICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIG5vZGUgPSB0aGlzLmlucHV0c1sgMCBdOyBpIDwgdmFsdWUgLSAxOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLm11bHRpcGxpZXJzWyBpIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMubXVsdGlwbGllcnNbIGkgXS5jb250cm9scy52YWx1ZSApO1xuICAgICAgICAgICAgbm9kZS5jb25uZWN0KCB0aGlzLm11bHRpcGxpZXJzWyBpIF0gKTtcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLm11bHRpcGxpZXJzWyBpIF07XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVBvdyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IFBvdyggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBPdXRwdXRzIHRoZSB2YWx1ZSBvZiAxIC8gaW5wdXRWYWx1ZSAob3IgcG93KGlucHV0VmFsdWUsIC0xKSlcbiAqIFdpbGwgYmUgdXNlZnVsIGZvciBkb2luZyBtdWx0aXBsaWNhdGl2ZSBkaXZpc2lvbi5cbiAqXG4gKiBUT0RPOlxuICogICAgIC0gVGhlIHdhdmVzaGFwZXIgaXNuJ3QgYWNjdXJhdGUuIEl0IHB1bXBzIG91dCB2YWx1ZXMgZGlmZmVyaW5nXG4gKiAgICAgICBieSAxLjc5MDY3OTMxNDAzMDE1MjVlLTkgb3IgbW9yZS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgUmVjaXByb2NhbCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbWF4SW5wdXQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHZhciBmYWN0b3IgPSBtYXhJbnB1dCB8fCAxMDAsXG4gICAgICAgICAgICBnYWluID0gTWF0aC5wb3coIGZhY3RvciwgLTEgKTtcblxuICAgICAgICB0aGlzLl9tYXhJbnB1dCA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuX21heElucHV0LmdhaW4uc2V0VmFsdWVBdFRpbWUoIGdhaW4sIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuXG4gICAgICAgIC8vIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4uc2V0VmFsdWVBdFRpbWUoIDAuMCwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG5cbiAgICAgICAgdGhpcy5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLlJlY2lwcm9jYWwgKTtcblxuICAgICAgICAvLyB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdLmdhaW4uc2V0VmFsdWVBdFRpbWUoIDAuMCwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG5cbiAgICAgICAgdGhpcy5pby5jb25zdGFudERyaXZlci5jb25uZWN0KCB0aGlzLl9tYXhJbnB1dCApO1xuICAgICAgICB0aGlzLl9tYXhJbnB1dC5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdLmdhaW4gKTtcbiAgICAgICAgdGhpcy5fbWF4SW5wdXQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0uZ2FpbiApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5zaGFwZXIgKTtcbiAgICAgICAgdGhpcy5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnNoYXBlci5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuX21heElucHV0LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5zaGFwZXIgPSBudWxsO1xuICAgICAgICB0aGlzLl9tYXhJbnB1dCA9IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IG1heElucHV0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWF4SW5wdXQuZ2FpbjtcbiAgICB9XG4gICAgc2V0IG1heElucHV0KCB2YWx1ZSApIHtcbiAgICAgICAgaWYgKCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgdGhpcy5fbWF4SW5wdXQuZ2Fpbi5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgICAgICAgICAgdGhpcy5fbWF4SW5wdXQuZ2Fpbi5zZXRWYWx1ZUF0VGltZSggMSAvIHZhbHVlLCB0aGlzLmNvbnRleHQuY3VycmVudFRpbWUgKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUmVjaXByb2NhbCA9IGZ1bmN0aW9uKCBtYXhJbnB1dCApIHtcbiAgICByZXR1cm4gbmV3IFJlY2lwcm9jYWwoIHRoaXMsIG1heElucHV0ICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIE5PVEU6XG4vLyAgT25seSBhY2NlcHRzIHZhbHVlcyA+PSAtMSAmJiA8PSAxLiBWYWx1ZXMgb3V0c2lkZVxuLy8gIHRoaXMgcmFuZ2UgYXJlIGNsYW1wZWQgdG8gdGhpcyByYW5nZS5cbmNsYXNzIFJvdW5kIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICAvLyB0aGlzLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuUm91bmQgKTtcblxuICAgICAgICAvLyBUaGlzIGJyYW5jaGluZyBpcyBiZWNhdXNlIGlucHV0dGluZyBgMGAgdmFsdWVzXG4gICAgICAgIC8vIGludG8gdGhlIHdhdmVzaGFwZXIgYWJvdmUgb3V0cHV0cyAtMC41IDsoXG4gICAgICAgIC8vIHRoaXMuaWZFbHNlID0gdGhpcy5pby5jcmVhdGVJZkVsc2UoKTtcbiAgICAgICAgLy8gdGhpcy5lcXVhbFRvWmVybyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUb1plcm8oKTtcblxuICAgICAgICAvLyB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuZXF1YWxUb1plcm8gKTtcbiAgICAgICAgLy8gdGhpcy5lcXVhbFRvWmVyby5jb25uZWN0KCB0aGlzLmlmRWxzZS5pZiApO1xuICAgICAgICAvLyB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuaWZFbHNlLnRoZW4gKTtcbiAgICAgICAgLy8gdGhpcy5zaGFwZXIuY29ubmVjdCggdGhpcy5pZkVsc2UuZWxzZSApO1xuICAgICAgICAvLyB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc2hhcGVyICk7XG4gICAgICAgIC8vIHRoaXMuaWZFbHNlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5mbG9vciA9IHRoaXMuaW8uY3JlYXRlRmxvb3IoKTtcbiAgICAgICAgdGhpcy5hZGQgPSB0aGlzLmlvLmNyZWF0ZUFkZCggMC41ICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWzBdLmNvbm5lY3QoIHRoaXMuYWRkICk7XG4gICAgICAgIHRoaXMuYWRkLmNvbm5lY3QoIHRoaXMuZmxvb3IgKTtcbiAgICAgICAgdGhpcy5mbG9vci5jb25uZWN0KCB0aGlzLm91dHB1dHNbMF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuZmxvb3IuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmFkZC5jbGVhblVwKCk7XG5cbiAgICAgICAgdGhpcy5mbG9vciA9IG51bGw7XG4gICAgICAgIHRoaXMuYWRkID0gbnVsbDtcblxuICAgICAgICAvLyB0aGlzLmlmRWxzZS5jbGVhblVwKCk7XG4gICAgICAgIC8vIHRoaXMuZXF1YWxUb1plcm8uY2xlYW5VcCgpO1xuICAgICAgICAvLyB0aGlzLnNoYXBlci5jbGVhblVwKCk7XG5cbiAgICAgICAgLy8gdGhpcy5pZkVsc2UgPSBudWxsO1xuICAgICAgICAvLyB0aGlzLmVxdWFsVG9aZXJvID0gbnVsbDtcbiAgICAgICAgLy8gdGhpcy5zaGFwZXIgPSBudWxsO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlUm91bmQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFJvdW5kKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuY2xhc3MgU2FtcGxlRGVsYXkgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbywgbnVtU2FtcGxlcyA9IDEgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIHRoaXMuc2FtcGxlU2l6ZSA9IHRoaXMuaW8uY3JlYXRlQ29uc3RhbnQoIDEgLyB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSApO1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnNhbXBsZXMgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBudW1TYW1wbGVzICk7XG5cbiAgICAgICAgdGhpcy5zYW1wbGVTaXplLmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb250cm9scy5zYW1wbGVzLmNvbm5lY3QoIHRoaXMubXVsdGlwbHksIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmRlbGF5ID0gdGhpcy5jb250ZXh0LmNyZWF0ZURlbGF5KCk7XG4gICAgICAgIHRoaXMuZGVsYXkuZGVsYXlUaW1lLnZhbHVlID0gMDtcbiAgICAgICAgdGhpcy5tdWx0aXBseS5jb25uZWN0KCB0aGlzLmRlbGF5LmRlbGF5VGltZSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuZGVsYXkgKTtcbiAgICAgICAgdGhpcy5kZWxheS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZGVsYXkuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmRlbGF5ID0gbnVsbDtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNhbXBsZURlbGF5ID0gZnVuY3Rpb24oIG51bVNhbXBsZXMgKSB7XG4gICAgcmV0dXJuIG5ldyBTYW1wbGVEZWxheSggdGhpcywgbnVtU2FtcGxlcyApO1xufTsiLCJpbXBvcnQgXCIuLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG4vLyBHaXZlbiBhbiBpbnB1dCB2YWx1ZSBhbmQgaXRzIGhpZ2ggYW5kIGxvdyBib3VuZHMsIHNjYWxlXG4vLyB0aGF0IHZhbHVlIHRvIG5ldyBoaWdoIGFuZCBsb3cgYm91bmRzLlxuLy9cbi8vIEZvcm11bGEgZnJvbSBNYXhNU1AncyBTY2FsZSBvYmplY3Q6XG4vLyAgaHR0cDovL3d3dy5jeWNsaW5nNzQuY29tL2ZvcnVtcy90b3BpYy5waHA/aWQ9MjY1OTNcbi8vXG4vLyAoKGlucHV0LWxvd0luKSAvIChoaWdoSW4tbG93SW4pKSAqIChoaWdoT3V0LWxvd091dCkgKyBsb3dPdXQ7XG5cblxuLy8gVE9ETzpcbi8vICAtIEFkZCBjb250cm9scyFcbmNsYXNzIFNjYWxlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMSApO1xuXG4gICAgICAgIGxvd0luID0gdHlwZW9mIGxvd0luID09PSAnbnVtYmVyJyA/IGxvd0luIDogMDtcbiAgICAgICAgaGlnaEluID0gdHlwZW9mIGhpZ2hJbiA9PT0gJ251bWJlcicgPyBoaWdoSW4gOiAxO1xuICAgICAgICBsb3dPdXQgPSB0eXBlb2YgbG93T3V0ID09PSAnbnVtYmVyJyA/IGxvd091dCA6IDA7XG4gICAgICAgIGhpZ2hPdXQgPSB0eXBlb2YgaGlnaE91dCA9PT0gJ251bWJlcicgPyBoaWdoT3V0IDogMTA7XG5cbiAgICAgICAgdGhpcy5fbG93SW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dJbiApO1xuICAgICAgICB0aGlzLl9oaWdoSW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoSW4gKTtcbiAgICAgICAgdGhpcy5fbG93T3V0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93T3V0ICk7XG4gICAgICAgIHRoaXMuX2hpZ2hPdXQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoT3V0ICk7XG5cbiAgICAgICAgLy8gdGhpcy5pbnB1dHMgPSBbIHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCkgXTtcblxuICAgICAgICAvLyAoaW5wdXQtbG93SW4pXG4gICAgICAgIHRoaXMuaW5wdXRNaW51c0xvd0luID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuaW5wdXRNaW51c0xvd0luLCAwLCAwICk7XG4gICAgICAgIHRoaXMuX2xvd0luLmNvbm5lY3QoIHRoaXMuaW5wdXRNaW51c0xvd0luLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hJbi1sb3dJbilcbiAgICAgICAgdGhpcy5oaWdoSW5NaW51c0xvd0luID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCgpO1xuICAgICAgICB0aGlzLl9oaWdoSW4uY29ubmVjdCggdGhpcy5oaWdoSW5NaW51c0xvd0luLCAwLCAwICk7XG4gICAgICAgIHRoaXMuX2xvd0luLmNvbm5lY3QoIHRoaXMuaGlnaEluTWludXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vICgoaW5wdXQtbG93SW4pIC8gKGhpZ2hJbi1sb3dJbikpXG4gICAgICAgIHRoaXMuZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgdGhpcy5pbnB1dE1pbnVzTG93SW4uY29ubmVjdCggdGhpcy5kaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5oaWdoSW5NaW51c0xvd0luLmNvbm5lY3QoIHRoaXMuZGl2aWRlLCAwLCAxICk7XG5cbiAgICAgICAgLy8gKGhpZ2hPdXQtbG93T3V0KVxuICAgICAgICB0aGlzLmhpZ2hPdXRNaW51c0xvd091dCA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5faGlnaE91dC5jb25uZWN0KCB0aGlzLmhpZ2hPdXRNaW51c0xvd091dCwgMCwgMCApO1xuICAgICAgICB0aGlzLl9sb3dPdXQuY29ubmVjdCggdGhpcy5oaWdoT3V0TWludXNMb3dPdXQsIDAsIDEgKTtcblxuICAgICAgICAvLyAoKGlucHV0LWxvd0luKSAvIChoaWdoSW4tbG93SW4pKSAqIChoaWdoT3V0LWxvd091dClcbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5kaXZpZGUuY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmhpZ2hPdXRNaW51c0xvd091dC5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAxICk7XG5cbiAgICAgICAgLy8gKChpbnB1dC1sb3dJbikgLyAoaGlnaEluLWxvd0luKSkgKiAoaGlnaE91dC1sb3dPdXQpICsgbG93T3V0XG4gICAgICAgIHRoaXMuYWRkID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseS5jb25uZWN0KCB0aGlzLmFkZCwgMCwgMCApO1xuICAgICAgICB0aGlzLl9sb3dPdXQuY29ubmVjdCggdGhpcy5hZGQsIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmFkZC5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5fbG93SW4uY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLl9oaWdoSW4uY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLl9sb3dPdXQuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLl9oaWdoT3V0LmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5pbnB1dE1pbnVzTG93SW4uY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmhpZ2hJbk1pbnVzTG93SW4uY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmRpdmlkZS5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuaGlnaE91dE1pbnVzTG93T3V0LmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseS5jbGVhblVwKCk7XG5cbiAgICAgICAgdGhpcy5fbG93SW4gPSBudWxsO1xuICAgICAgICB0aGlzLl9oaWdoSW4gPSBudWxsO1xuICAgICAgICB0aGlzLl9sb3dPdXQgPSBudWxsO1xuICAgICAgICB0aGlzLl9oaWdoT3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbnB1dE1pbnVzTG93SW4gPSBudWxsO1xuICAgICAgICB0aGlzLmhpZ2hJbk1pbnVzTG93SW4gPSBudWxsO1xuICAgICAgICB0aGlzLmRpdmlkZSA9IG51bGw7XG4gICAgICAgIHRoaXMuaGlnaE91dE1pbnVzTG93T3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IG51bGw7XG4gICAgICAgIHRoaXMuYWRkID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgbG93SW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sb3dJbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd0luKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5fbG93SW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cblxuICAgIGdldCBoaWdoSW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9oaWdoSW4udmFsdWU7XG4gICAgfVxuICAgIHNldCBoaWdoSW4oIHZhbHVlICkge1xuICAgICAgICB0aGlzLl9oaWdoSW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgbG93T3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG93T3V0LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgbG93T3V0KCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5fbG93T3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG5cblxuICAgIGdldCBoaWdoT3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faGlnaE91dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGhpZ2hPdXQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLl9oaWdoT3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuXG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNjYWxlID0gZnVuY3Rpb24oIGxvd0luLCBoaWdoSW4sIGxvd091dCwgaGlnaE91dCApIHtcbiAgICByZXR1cm4gbmV3IFNjYWxlKCB0aGlzLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gR2l2ZW4gYW4gaW5wdXQgdmFsdWUgYW5kIGl0cyBoaWdoIGFuZCBsb3cgYm91bmRzLCBzY2FsZVxuLy8gdGhhdCB2YWx1ZSB0byBuZXcgaGlnaCBhbmQgbG93IGJvdW5kcy5cbi8vXG4vLyBGb3JtdWxhIGZyb20gTWF4TVNQJ3MgU2NhbGUgb2JqZWN0OlxuLy8gIGh0dHA6Ly93d3cuY3ljbGluZzc0LmNvbS9mb3J1bXMvdG9waWMucGhwP2lkPTI2NTkzXG4vL1xuLy8gaWYoIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikgPT09IDAgKSB7XG4vLyAgICAgcmV0dXJuIGxvd091dDtcbi8vIH1cbi8vIGVsc2UgaWYoIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikgPiAwICkge1xuLy8gICAgIHJldHVybiBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiBNYXRoLnBvdyggKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKTtcbi8vIH1cbi8vIGVsc2Uge1xuLy8gICAgIHJldHVybiBsb3dPdXQgKyAoaGlnaE91dCAtIGxvd091dCkgKiAtKE1hdGgucG93KCAoLWlucHV0ICsgbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKSk7XG4vLyB9XG5cbi8vIFRPRE86XG4vLyAgLSBBZGQgY29udHJvbHNcbmNsYXNzIFNjYWxlRXhwIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQsIGV4cG9uZW50ICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICBsb3dJbiA9IHR5cGVvZiBsb3dJbiA9PT0gJ251bWJlcicgPyBsb3dJbiA6IDA7XG4gICAgICAgIGhpZ2hJbiA9IHR5cGVvZiBoaWdoSW4gPT09ICdudW1iZXInID8gaGlnaEluIDogMTtcbiAgICAgICAgbG93T3V0ID0gdHlwZW9mIGxvd091dCA9PT0gJ251bWJlcicgPyBsb3dPdXQgOiAwO1xuICAgICAgICBoaWdoT3V0ID0gdHlwZW9mIGhpZ2hPdXQgPT09ICdudW1iZXInID8gaGlnaE91dCA6IDEwO1xuICAgICAgICBleHBvbmVudCA9IHR5cGVvZiBleHBvbmVudCA9PT0gJ251bWJlcicgPyBleHBvbmVudCA6IDE7XG5cbiAgICAgICAgdGhpcy5fbG93SW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBsb3dJbiApO1xuICAgICAgICB0aGlzLl9oaWdoSW4gPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoSW4gKTtcbiAgICAgICAgdGhpcy5fbG93T3V0ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggbG93T3V0ICk7XG4gICAgICAgIHRoaXMuX2hpZ2hPdXQgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCBoaWdoT3V0ICk7XG4gICAgICAgIHRoaXMuX2V4cG9uZW50ID0gdGhpcy5pby5jcmVhdGVQYXJhbSggZXhwb25lbnQgKTtcblxuXG4gICAgICAgIC8vIChpbnB1dCAtIGxvd0luKVxuICAgICAgICB0aGlzLmlucHV0TWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmlucHV0TWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLl9sb3dJbi5jb25uZWN0KCB0aGlzLmlucHV0TWludXNMb3dJbiwgMCwgMSApO1xuXG4gICAgICAgIC8vICgtaW5wdXQgKyBsb3dJbilcbiAgICAgICAgdGhpcy5taW51c0lucHV0ID0gdGhpcy5pby5jcmVhdGVOZWdhdGUoKTtcbiAgICAgICAgdGhpcy5taW51c0lucHV0UGx1c0xvd0luID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm1pbnVzSW5wdXQgKTtcbiAgICAgICAgdGhpcy5taW51c0lucHV0LmNvbm5lY3QoIHRoaXMubWludXNJbnB1dFBsdXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLl9sb3dJbi5jb25uZWN0KCB0aGlzLm1pbnVzSW5wdXRQbHVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoaGlnaEluIC0gbG93SW4pXG4gICAgICAgIHRoaXMuaGlnaEluTWludXNMb3dJbiA9IHRoaXMuaW8uY3JlYXRlU3VidHJhY3QoKTtcbiAgICAgICAgdGhpcy5faGlnaEluLmNvbm5lY3QoIHRoaXMuaGlnaEluTWludXNMb3dJbiwgMCwgMCApO1xuICAgICAgICB0aGlzLl9sb3dJbi5jb25uZWN0KCB0aGlzLmhpZ2hJbk1pbnVzTG93SW4sIDAsIDEgKTtcblxuICAgICAgICAvLyAoKGlucHV0IC0gbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSlcbiAgICAgICAgdGhpcy5kaXZpZGUgPSB0aGlzLmlvLmNyZWF0ZURpdmlkZSgpO1xuICAgICAgICB0aGlzLmlucHV0TWludXNMb3dJbi5jb25uZWN0KCB0aGlzLmRpdmlkZSwgMCwgMCApO1xuICAgICAgICB0aGlzLmhpZ2hJbk1pbnVzTG93SW4uY29ubmVjdCggdGhpcy5kaXZpZGUsIDAsIDEgKTtcblxuICAgICAgICAvLyAoLWlucHV0ICsgbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKVxuICAgICAgICB0aGlzLm5lZ2F0aXZlRGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoKTtcbiAgICAgICAgdGhpcy5taW51c0lucHV0UGx1c0xvd0luLmNvbm5lY3QoIHRoaXMubmVnYXRpdmVEaXZpZGUsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5oaWdoSW5NaW51c0xvd0luLmNvbm5lY3QoIHRoaXMubmVnYXRpdmVEaXZpZGUsIDAsIDEgKTtcblxuICAgICAgICAvLyAoaGlnaE91dCAtIGxvd091dClcbiAgICAgICAgdGhpcy5oaWdoT3V0TWludXNMb3dPdXQgPSB0aGlzLmlvLmNyZWF0ZVN1YnRyYWN0KCk7XG4gICAgICAgIHRoaXMuX2hpZ2hPdXQuY29ubmVjdCggdGhpcy5oaWdoT3V0TWludXNMb3dPdXQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5fbG93T3V0LmNvbm5lY3QoIHRoaXMuaGlnaE91dE1pbnVzTG93T3V0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gTWF0aC5wb3coIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cClcbiAgICAgICAgdGhpcy5wb3cgPSB0aGlzLmlvLmNyZWF0ZVBvdyggZXhwb25lbnQgKTtcbiAgICAgICAgdGhpcy5kaXZpZGUuY29ubmVjdCggdGhpcy5wb3cgKTtcblxuICAgICAgICAvLyAtKE1hdGgucG93KCAoLWlucHV0ICsgbG93SW4pIC8gKGhpZ2hJbiAtIGxvd0luKSwgZXhwKSlcbiAgICAgICAgdGhpcy5uZWdhdGl2ZVBvd05lZ2F0ZSA9IHRoaXMuaW8uY3JlYXRlTmVnYXRlKCk7XG4gICAgICAgIHRoaXMubmVnYXRpdmVQb3cgPSB0aGlzLmlvLmNyZWF0ZVBvdyggZXhwb25lbnQgKTtcbiAgICAgICAgdGhpcy5uZWdhdGl2ZURpdmlkZS5jb25uZWN0KCB0aGlzLm5lZ2F0aXZlUG93ICk7XG4gICAgICAgIHRoaXMubmVnYXRpdmVQb3cuY29ubmVjdCggdGhpcy5uZWdhdGl2ZVBvd05lZ2F0ZSApO1xuXG5cbiAgICAgICAgLy8gbG93T3V0ICsgKGhpZ2hPdXQgLSBsb3dPdXQpICogTWF0aC5wb3coIChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cCk7XG4gICAgICAgIHRoaXMuZWxzZUlmQnJhbmNoID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgdGhpcy5lbHNlSWZNdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5oaWdoT3V0TWludXNMb3dPdXQuY29ubmVjdCggdGhpcy5lbHNlSWZNdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLnBvdy5jb25uZWN0KCB0aGlzLmVsc2VJZk11bHRpcGx5LCAwLCAxICk7XG4gICAgICAgIHRoaXMuX2xvd091dC5jb25uZWN0KCB0aGlzLmVsc2VJZkJyYW5jaCwgMCwgMCApO1xuICAgICAgICB0aGlzLmVsc2VJZk11bHRpcGx5LmNvbm5lY3QoIHRoaXMuZWxzZUlmQnJhbmNoLCAwLCAxICk7XG5cbiAgICAgICAgLy8gbG93T3V0ICsgKGhpZ2hPdXQgLSBsb3dPdXQpICogLShNYXRoLnBvdyggKC1pbnB1dCArIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbiksIGV4cCkpO1xuICAgICAgICB0aGlzLmVsc2VCcmFuY2ggPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICB0aGlzLmVsc2VNdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5oaWdoT3V0TWludXNMb3dPdXQuY29ubmVjdCggdGhpcy5lbHNlTXVsdGlwbHksIDAsIDAgKTtcbiAgICAgICAgdGhpcy5uZWdhdGl2ZVBvd05lZ2F0ZS5jb25uZWN0KCB0aGlzLmVsc2VNdWx0aXBseSwgMCwgMSApO1xuICAgICAgICB0aGlzLl9sb3dPdXQuY29ubmVjdCggdGhpcy5lbHNlQnJhbmNoLCAwLCAwICk7XG4gICAgICAgIHRoaXMuZWxzZU11bHRpcGx5LmNvbm5lY3QoIHRoaXMuZWxzZUJyYW5jaCwgMCwgMSApO1xuXG5cblxuICAgICAgICAvLyBlbHNlIGlmKCAoaW5wdXQgLSBsb3dJbikgLyAoaGlnaEluIC0gbG93SW4pID4gMCApIHtcbiAgICAgICAgdGhpcy5ncmVhdGVyVGhhblplcm8gPSB0aGlzLmlvLmNyZWF0ZUdyZWF0ZXJUaGFuWmVybygpO1xuICAgICAgICB0aGlzLmlmR3JlYXRlclRoYW5aZXJvID0gdGhpcy5pby5jcmVhdGVJZkVsc2UoKTtcbiAgICAgICAgdGhpcy5kaXZpZGUuY29ubmVjdCggdGhpcy5ncmVhdGVyVGhhblplcm8gKTtcbiAgICAgICAgdGhpcy5ncmVhdGVyVGhhblplcm8uY29ubmVjdCggdGhpcy5pZkdyZWF0ZXJUaGFuWmVyby5pZiApO1xuICAgICAgICB0aGlzLmVsc2VJZkJyYW5jaC5jb25uZWN0KCB0aGlzLmlmR3JlYXRlclRoYW5aZXJvLnRoZW4gKTtcbiAgICAgICAgdGhpcy5lbHNlQnJhbmNoLmNvbm5lY3QoIHRoaXMuaWZHcmVhdGVyVGhhblplcm8uZWxzZSApO1xuXG4gICAgICAgIC8vIGlmKChpbnB1dCAtIGxvd0luKSAvIChoaWdoSW4gLSBsb3dJbikgPT09IDApXG4gICAgICAgIHRoaXMuZXF1YWxzWmVybyA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUb1plcm8oKTtcbiAgICAgICAgdGhpcy5pZkVxdWFsc1plcm8gPSB0aGlzLmlvLmNyZWF0ZUlmRWxzZSgpO1xuICAgICAgICB0aGlzLmRpdmlkZS5jb25uZWN0KCB0aGlzLmVxdWFsc1plcm8gKTtcbiAgICAgICAgdGhpcy5lcXVhbHNaZXJvLmNvbm5lY3QoIHRoaXMuaWZFcXVhbHNaZXJvLmlmICk7XG4gICAgICAgIHRoaXMuX2xvd091dC5jb25uZWN0KCB0aGlzLmlmRXF1YWxzWmVyby50aGVuICk7XG4gICAgICAgIHRoaXMuaWZHcmVhdGVyVGhhblplcm8uY29ubmVjdCggdGhpcy5pZkVxdWFsc1plcm8uZWxzZSApO1xuXG4gICAgICAgIHRoaXMuaWZFcXVhbHNaZXJvLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLl9sb3dJbi5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuX2hpZ2hJbi5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuX2xvd091dC5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuX2hpZ2hPdXQuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLl9leHBvbmVudC5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuaW5wdXRNaW51c0xvd0luLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5taW51c0lucHV0LmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5taW51c0lucHV0UGx1c0xvd0luLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5oaWdoSW5NaW51c0xvd0luLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5kaXZpZGUuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLm5lZ2F0aXZlRGl2aWRlLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5oaWdoT3V0TWludXNMb3dPdXQuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLnBvdy5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMubmVnYXRpdmVQb3dOZWdhdGUuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLm5lZ2F0aXZlUG93LmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5lbHNlSWZCcmFuY2guY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmVsc2VJZk11bHRpcGx5LmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5lbHNlQnJhbmNoLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5ncmVhdGVyVGhhblplcm8uY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmlmR3JlYXRlclRoYW5aZXJvLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5lcXVhbHNaZXJvLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5pZkVxdWFsc1plcm8uY2xlYW5VcCgpO1xuXG4gICAgICAgIHRoaXMuX2xvd0luID0gbnVsbDtcbiAgICAgICAgdGhpcy5faGlnaEluID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbG93T3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5faGlnaE91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2V4cG9uZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbnB1dE1pbnVzTG93SW4gPSBudWxsO1xuICAgICAgICB0aGlzLm1pbnVzSW5wdXQgPSBudWxsO1xuICAgICAgICB0aGlzLm1pbnVzSW5wdXRQbHVzTG93SW4gPSBudWxsO1xuICAgICAgICB0aGlzLmhpZ2hJbk1pbnVzTG93SW4gPSBudWxsO1xuICAgICAgICB0aGlzLmRpdmlkZSA9IG51bGw7XG4gICAgICAgIHRoaXMubmVnYXRpdmVEaXZpZGUgPSBudWxsO1xuICAgICAgICB0aGlzLmhpZ2hPdXRNaW51c0xvd091dCA9IG51bGw7XG4gICAgICAgIHRoaXMucG93ID0gbnVsbDtcbiAgICAgICAgdGhpcy5uZWdhdGl2ZVBvd05lZ2F0ZSA9IG51bGw7XG4gICAgICAgIHRoaXMubmVnYXRpdmVQb3cgPSBudWxsO1xuICAgICAgICB0aGlzLmVsc2VJZkJyYW5jaCA9IG51bGw7XG4gICAgICAgIHRoaXMuZWxzZUlmTXVsdGlwbHkgPSBudWxsO1xuICAgICAgICB0aGlzLmVsc2VCcmFuY2ggPSBudWxsO1xuICAgICAgICB0aGlzLmdyZWF0ZXJUaGFuWmVybyA9IG51bGw7XG4gICAgICAgIHRoaXMuaWZHcmVhdGVyVGhhblplcm8gPSBudWxsO1xuICAgICAgICB0aGlzLmVxdWFsc1plcm8gPSBudWxsO1xuICAgICAgICB0aGlzLmlmRXF1YWxzWmVybyA9IG51bGw7XG4gICAgfVxuXG5cbiAgICBnZXQgbG93SW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sb3dJbi52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd0luKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5fbG93SW4udmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgaGlnaEluKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faGlnaEluLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgaGlnaEluKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5faGlnaEluLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGxvd091dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvd091dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGxvd091dCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuX2xvd091dC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBoaWdoT3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faGlnaE91dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IGhpZ2hPdXQoIHZhbHVlICkge1xuICAgICAgICB0aGlzLl9oaWdoT3V0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGV4cG9uZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZXhwb25lbnQudmFsdWU7XG4gICAgfVxuICAgIHNldCBleHBvbmVudCggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuX2V4cG9uZW50LnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMucG93LnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMubmVnYXRpdmVQb3cudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU2NhbGVFeHAgPSBmdW5jdGlvbiggbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHBvbmVudCApIHtcbiAgICByZXR1cm4gbmV3IFNjYWxlRXhwKCB0aGlzLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQsIGV4cG9uZW50ICk7XG59OyIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cblxuY2xhc3MgU2lnbiBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLnNoYXBlciA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggZnVuY3Rpb24oIHggKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5zaWduKCB4ICk7XG4gICAgICAgIH0sIDQwOTYgKTtcblxuICAgICAgICB0aGlzLmlmRWxzZSA9IHRoaXMuaW8uY3JlYXRlSWZFbHNlKCk7XG4gICAgICAgIHRoaXMuZXF1YWxUb1plcm8gPSB0aGlzLmlvLmNyZWF0ZUVxdWFsVG9aZXJvKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLmVxdWFsVG9aZXJvICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5pZkVsc2UudGhlbiApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc2hhcGVyICk7XG5cbiAgICAgICAgdGhpcy5lcXVhbFRvWmVyby5jb25uZWN0KCB0aGlzLmlmRWxzZS5pZiApO1xuICAgICAgICB0aGlzLnNoYXBlci5jb25uZWN0KCB0aGlzLmlmRWxzZS5lbHNlICk7XG4gICAgICAgIHRoaXMuaWZFbHNlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnNoYXBlci5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuc2hhcGVyID0gbnVsbDtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZVNpZ24gPSBmdW5jdGlvbiggYWNjdXJhY3kgKSB7XG4gICAgcmV0dXJuIG5ldyBTaWduKCB0aGlzLCBhY2N1cmFjeSApO1xufTtcbiIsImltcG9ydCBcIi4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL01ldGhvZHNfb2ZfY29tcHV0aW5nX3NxdWFyZV9yb290cyNFeGFtcGxlXG4vL1xuLy8gZm9yKCB2YXIgaSA9IDAsIHg7IGkgPCBzaWdGaWd1cmVzOyArK2kgKSB7XG4vLyAgICAgIGlmKCBpID09PSAwICkge1xuLy8gICAgICAgICAgeCA9IHNpZ0ZpZ3VyZXMgKiBNYXRoLnBvdyggMTAsIDIgKTtcbi8vICAgICAgfVxuLy8gICAgICBlbHNlIHtcbi8vICAgICAgICAgIHggPSAwLjUgKiAoIHggKyAoaW5wdXQgLyB4KSApO1xuLy8gICAgICB9XG4vLyB9XG5jbGFzcyBTcXJ0SGVscGVyIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHByZXZpb3VzU3RlcCwgaW5wdXQsIG1heElucHV0ICkge1xuICAgICAgICB0aGlzLm11bHRpcGx5ID0gaW8uY3JlYXRlTXVsdGlwbHkoIDAuNSApO1xuICAgICAgICB0aGlzLmRpdmlkZSA9IGlvLmNyZWF0ZURpdmlkZSggbnVsbCwgbWF4SW5wdXQgKTtcbiAgICAgICAgdGhpcy5hZGQgPSBpby5jcmVhdGVBZGQoKTtcblxuICAgICAgICAvLyBpbnB1dCAvIHg7XG4gICAgICAgIGlucHV0LmNvbm5lY3QoIHRoaXMuZGl2aWRlLCAwLCAwICk7XG4gICAgICAgIHByZXZpb3VzU3RlcC5vdXRwdXQuY29ubmVjdCggdGhpcy5kaXZpZGUsIDAsIDEgKTtcblxuICAgICAgICAvLyB4ICsgKCBpbnB1dCAvIHggKVxuICAgICAgICBwcmV2aW91c1N0ZXAub3V0cHV0LmNvbm5lY3QoIHRoaXMuYWRkLCAwLCAwICk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNvbm5lY3QoIHRoaXMuYWRkLCAwLCAxICk7XG5cbiAgICAgICAgLy8gMC41ICogKCB4ICsgKCBpbnB1dCAvIHggKSApXG4gICAgICAgIHRoaXMuYWRkLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkgKTtcblxuICAgICAgICB0aGlzLm91dHB1dCA9IHRoaXMubXVsdGlwbHk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgdGhpcy5tdWx0aXBseS5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuZGl2aWRlLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5hZGQuY2xlYW5VcCgpO1xuXG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSBudWxsO1xuICAgICAgICB0aGlzLmRpdmlkZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYWRkID0gbnVsbDtcbiAgICAgICAgdGhpcy5vdXRwdXQgPSBudWxsO1xuICAgIH1cbn1cblxuY2xhc3MgU3FydCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgc2lnbmlmaWNhbnRGaWd1cmVzLCBtYXhJbnB1dCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gRGVmYXVsdCB0byA2IHNpZ25pZmljYW50IGZpZ3VyZXMuXG4gICAgICAgIHNpZ25pZmljYW50RmlndXJlcyA9IHNpZ25pZmljYW50RmlndXJlcyB8fCA2O1xuXG4gICAgICAgIG1heElucHV0ID0gbWF4SW5wdXQgfHwgMTAwO1xuXG4gICAgICAgIHRoaXMueDAgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCBzaWduaWZpY2FudEZpZ3VyZXMgKiBNYXRoLnBvdyggMTAsIDIgKSApO1xuXG4gICAgICAgIHRoaXMuc3RlcHMgPSBbIHtcbiAgICAgICAgICAgIG91dHB1dDogdGhpcy54MFxuICAgICAgICB9IF07XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAxOyBpIDwgc2lnbmlmaWNhbnRGaWd1cmVzOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzLnB1c2goXG4gICAgICAgICAgICAgICAgbmV3IFNxcnRIZWxwZXIoIHRoaXMuaW8sIHRoaXMuc3RlcHNbIGkgLSAxIF0sIHRoaXMuaW5wdXRzWyAwIF0sIG1heElucHV0IClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0ZXBzWyB0aGlzLnN0ZXBzLmxlbmd0aCAtIDEgXS5vdXRwdXQuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMueDAuY2xlYW5VcCgpO1xuXG4gICAgICAgIHRoaXMuc3RlcHNbIDAgXSA9IG51bGw7XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IHRoaXMuc3RlcHMubGVuZ3RoIC0gMTsgaSA+PSAxOyAtLWkgKSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBzWyBpIF0uY2xlYW5VcCgpO1xuICAgICAgICAgICAgdGhpcy5zdGVwc1sgaSBdID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMueDAgPSBudWxsO1xuICAgICAgICB0aGlzLnN0ZXBzID0gbnVsbDtcbiAgICB9XG59XG5cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3FydCA9IGZ1bmN0aW9uKCBzaWduaWZpY2FudEZpZ3VyZXMsIG1heElucHV0ICkge1xuICAgIHJldHVybiBuZXcgU3FydCggdGhpcywgc2lnbmlmaWNhbnRGaWd1cmVzLCBtYXhJbnB1dCApO1xufTsiLCJpbXBvcnQgQXVkaW9JTyBmcm9tIFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuXG5jbGFzcyBTcXVhcmUgZXh0ZW5kcyBOb2RlIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgdGhpcy5tdWx0aXBseSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm11bHRpcGx5LCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5tdWx0aXBseSwgMCwgMSApO1xuICAgICAgICB0aGlzLm11bHRpcGx5LmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseS5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkgPSBudWxsO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3F1YXJlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBTcXVhcmUoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuLyoqXG4gKiBTdWJ0cmFjdHMgdGhlIHNlY29uZCBpbnB1dCBmcm9tIHRoZSBmaXJzdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAqL1xuY2xhc3MgU3VidHJhY3QgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDEgKTtcblxuICAgICAgICB0aGlzLm5lZ2F0ZSA9IHRoaXMuaW8uY3JlYXRlTmVnYXRlKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIHRoaXMubmVnYXRlICk7XG4gICAgICAgIHRoaXMubmVnYXRlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW5wdXRzWyAxIF07XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5uZWdhdGUuY2xlYW5VcCgpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLm5lZ2F0ZSA9IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlU3VidHJhY3QgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBTdWJ0cmFjdCggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgU3dpdGNoIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvLCBudW1DYXNlcywgc3RhcnRpbmdDYXNlID0gMCApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAxLCAxICk7XG5cbiAgICAgICAgLy8gRW5zdXJlIHN0YXJ0aW5nQ2FzZSBpcyBuZXZlciA8IDBcbiAgICAgICAgc3RhcnRpbmdDYXNlID0gTWF0aC5hYnMoIHN0YXJ0aW5nQ2FzZSApO1xuXG4gICAgICAgIHRoaXMuY2FzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5jb250cm9scy5pbmRleCA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHN0YXJ0aW5nQ2FzZSApO1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG51bUNhc2VzOyArK2kgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0c1sgaSBdID0gdGhpcy5jb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0uZ2Fpbi52YWx1ZSA9IDAuMDtcbiAgICAgICAgICAgIHRoaXMuY2FzZXNbIGkgXSA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUbyggaSApO1xuICAgICAgICAgICAgdGhpcy5jYXNlc1sgaSBdLmNvbm5lY3QoIHRoaXMuaW5wdXRzWyBpIF0uZ2FpbiApO1xuICAgICAgICAgICAgdGhpcy5jb250cm9scy5pbmRleC5jb25uZWN0KCB0aGlzLmNhc2VzWyBpIF0gKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzWyBpIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IHRoaXMuY2FzZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICAgICAgICB0aGlzLmNhc2VzWyBpIF0uY2xlYW5VcCgpO1xuICAgICAgICAgICAgdGhpcy5jYXNlc1sgaSBdID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29udHJvbHMuaW5kZXguY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmluZGV4ID0gbnVsbDtcbiAgICAgICAgdGhpcy5jYXNlcyA9IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IGNvbnRyb2woKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLmluZGV4LmNvbnRyb2w7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy5pbmRleC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy5pbmRleC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cblxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTd2l0Y2ggPSBmdW5jdGlvbiggbnVtQ2FzZXMsIHN0YXJ0aW5nQ2FzZSApIHtcbiAgICByZXR1cm4gbmV3IFN3aXRjaCggdGhpcywgbnVtQ2FzZXMsIHN0YXJ0aW5nQ2FzZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTG9naWNhbE9wZXJhdG9yIGZyb20gXCIuL0xvZ2ljYWxPcGVyYXRvci5lczZcIjtcblxuXG5jbGFzcyBBTkQgZXh0ZW5kcyBMb2dpY2FsT3BlcmF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8gKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbHkgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZUNsYW1wKCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5tdWx0aXBseSwgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMSBdLmNvbm5lY3QoIGdyYXBoLm11bHRpcGx5LCAwLCAxICk7XG5cbiAgICAgICAgZ3JhcGgubXVsdGlwbHkuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCggdGhpcyApO1xuXG4gICAgICAgIGdyYXBoLm11bHRpcGx5LmNsZWFuVXAoKTtcbiAgICAgICAgZ3JhcGgubXVsdGlwbHkgPSBudWxsO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQU5EO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVBTkQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEFORCggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5cbmNsYXNzIExvZ2ljYWxPcGVyYXRvciBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguY2xhbXAgPSB0aGlzLmlvLmNyZWF0ZUNsYW1wKCAwLCAxICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSBncmFwaC5jbGFtcDtcblxuICAgICAgICB0aGlzLnNldEdyYXBoKCBncmFwaCApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuICAgICAgICBncmFwaC5jbGFtcC5jbGVhblVwKCk7XG4gICAgICAgIGdyYXBoLmNsYW1wID0gbnVsbDtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExvZ2ljYWxPcGVyYXRvcjtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTG9naWNhbE9wZXJhdG9yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBMb2dpY2FsT3BlcmF0b3IoIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IExvZ2ljYWxPcGVyYXRvciBmcm9tIFwiLi9Mb2dpY2FsT3BlcmF0b3IuZXM2XCI7XG5cblxuY2xhc3MgTk9UIGV4dGVuZHMgTG9naWNhbE9wZXJhdG9yIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbyBJbnN0YW5jZSBvZiBBdWRpb0lPLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvICk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gdGhpcy5nZXRHcmFwaCgpO1xuICAgICAgICBjb25zb2xlLmxvZyggdGhpcywgZ3JhcGggKTtcblxuICAgICAgICBncmFwaC5hYnMgPSB0aGlzLmlvLmNyZWF0ZUFicyggMTAwICk7XG4gICAgICAgIGdyYXBoLnN1YnRyYWN0ID0gdGhpcy5pby5jcmVhdGVTdWJ0cmFjdCggMSApO1xuICAgICAgICBncmFwaC5yb3VuZCA9IHRoaXMuaW8uY3JlYXRlUm91bmQoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIGdyYXBoLnN1YnRyYWN0ICk7XG4gICAgICAgIGdyYXBoLnN1YnRyYWN0LmNvbm5lY3QoIGdyYXBoLmFicyApO1xuICAgICAgICBncmFwaC5hYnMuY29ubmVjdCggZ3JhcGgucm91bmQgKVxuXG4gICAgICAgIGdyYXBoLnJvdW5kLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgdGhpcy5zZXRHcmFwaCggZ3JhcGggKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICAvLyB0aGlzLmFicy5jbGVhblVwKCk7XG4gICAgICAgIC8vIHRoaXMuYWJzID0gbnVsbDtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguc3VidHJhY3QuY2xlYW5VcCgpO1xuICAgICAgICBncmFwaC5hYnMuY2xlYW5VcCgpO1xuICAgICAgICBncmFwaC5yb3VuZC5jbGVhblVwKCk7XG4gICAgICAgIGdyYXBoLnN1YnRyYWN0ID0gbnVsbDtcbiAgICAgICAgZ3JhcGguYWJzID0gbnVsbDtcbiAgICAgICAgZ3JhcGgucm91bmQgPSBudWxsO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTk9UO1xuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVOT1QgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE5PVCggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTG9naWNhbE9wZXJhdG9yIGZyb20gXCIuL0xvZ2ljYWxPcGVyYXRvci5lczZcIjtcblxuXG5jbGFzcyBPUiBleHRlbmRzIExvZ2ljYWxPcGVyYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbyApO1xuXG4gICAgICAgIHZhciBncmFwaCA9IHRoaXMuZ2V0R3JhcGgoKTtcblxuICAgICAgICBncmFwaC5tYXggPSB0aGlzLmlvLmNyZWF0ZU1heCgpO1xuICAgICAgICBncmFwaC5lcXVhbFRvID0gdGhpcy5pby5jcmVhdGVFcXVhbFRvKCAxICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAxIF0gPSB0aGlzLmlvLmNyZWF0ZUNsYW1wKCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCBncmFwaC5tYXggKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDEgXS5jb25uZWN0KCBncmFwaC5tYXguY29udHJvbHMudmFsdWUgKTtcbiAgICAgICAgZ3JhcGgubWF4LmNvbm5lY3QoIGdyYXBoLmVxdWFsVG8gKTtcbiAgICAgICAgZ3JhcGguZXF1YWxUby5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuc2V0R3JhcGgoIGdyYXBoICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSB0aGlzLmdldEdyYXBoKCk7XG5cbiAgICAgICAgZ3JhcGguZXF1YWxUby5jbGVhblVwKCk7XG4gICAgICAgIGdyYXBoLmVxdWFsVG8gPSBudWxsO1xuXG4gICAgICAgIGdyYXBoLm1heC5jbGVhblVwKCk7XG4gICAgICAgIGdyYXBoLm1heCA9IG51bGw7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBPUjtcblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlT1IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9SKCB0aGlzICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIGdhaW4oKzEwMDAwMCkgLT4gc2hhcGVyKCA8PSAwOiAxLCAxIClcbmNsYXNzIEVxdWFsVG8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDAgKTtcblxuICAgICAgICAvLyBUT0RPXG4gICAgICAgIC8vICAtIFJlbmFtZSB0aGlzLlxuICAgICAgICB0aGlzLmNvbnRyb2wgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApLFxuICAgICAgICB0aGlzLmludmVyc2lvbiA9IHRoaXMuY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgdGhpcy5pbnZlcnNpb24uZ2Fpbi52YWx1ZSA9IC0xO1xuXG4gICAgICAgIC8vIFRoaXMgY3VydmUgb3V0cHV0cyAwLjUgd2hlbiBpbnB1dCBpcyAwLFxuICAgICAgICAvLyBzbyBpdCBoYXMgdG8gYmUgcGlwZWQgaW50byBhIG5vZGUgdGhhdFxuICAgICAgICAvLyB0cmFuc2Zvcm1zIGl0IGludG8gMSwgYW5kIGxlYXZlcyB6ZXJvc1xuICAgICAgICAvLyBhbG9uZS5cbiAgICAgICAgdGhpcy5zaGFwZXIgPSB0aGlzLmlvLmNyZWF0ZVdhdmVTaGFwZXIoIHRoaXMuaW8uY3VydmVzLkVxdWFsVG9aZXJvICk7XG5cbiAgICAgICAgdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZUdyZWF0ZXJUaGFuWmVybygpO1xuICAgICAgICB0aGlzLmNvbnRyb2wuY29ubmVjdCggdGhpcy5pbnZlcnNpb24gKTtcbiAgICAgICAgdGhpcy5pbnZlcnNpb24uY29ubmVjdCggdGhpcy5pbnB1dHNbIDAgXSApO1xuXG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5zaGFwZXIgKTtcbiAgICAgICAgdGhpcy5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5jb250cm9sO1xuXG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnNoYXBlci5jbGVhblVwKCk7XG4gICAgICAgIHRoaXMuY29udHJvbC5jbGVhblVwKCk7XG5cbiAgICAgICAgdGhpcy5pbnZlcnNpb24uZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmludmVyc2lvbiA9IG51bGw7XG4gICAgICAgIHRoaXMuc2hhcGVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5jb250cm9sID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSggdmFsdWUgKSB7XG4gICAgICAgIHRoaXMuY29udHJvbC5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRXF1YWxUbyA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IEVxdWFsVG8oIHRoaXMsIHZhbHVlICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBFcXVhbFRvOyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5pbXBvcnQgRXF1YWxUbyBmcm9tIFwiLi9FcXVhbFRvLmVzNlwiO1xuXG4vLyBIYXZlbid0IHF1aXRlIGZpZ3VyZWQgb3V0IHdoeSB5ZXQsIGJ1dCB0aGlzIHJldHVybnMgMCB3aGVuIGlucHV0IGlzIDAuXG4vLyBJdCBzaG91bGQgcmV0dXJuIDEuLi5cbi8vXG4vLyBGb3Igbm93LCBJJ20ganVzdCB1c2luZyB0aGUgRXF1YWxUbyBub2RlIHdpdGggYSBzdGF0aWMgMCBhcmd1bWVudC5cbi8vIC0tLS0tLS0tXG4vL1xuLy8gY2xhc3MgRXF1YWxUb1plcm8gZXh0ZW5kcyBOb2RlIHtcbi8vICAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4vLyAgICAgICAgIHN1cGVyKCBpbywgMSwgMCApO1xuXG4vLyAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uZ2Fpbi52YWx1ZSA9IDEwMDAwMDtcblxuLy8gICAgICAgICAvLyBUaGlzIG91dHB1dHMgMC41IHdoZW4gaW5wdXQgaXMgMCxcbi8vICAgICAgICAgLy8gc28gaXQgaGFzIHRvIGJlIHBpcGVkIGludG8gYSBub2RlIHRoYXRcbi8vICAgICAgICAgLy8gdHJhbnNmb3JtcyBpdCBpbnRvIDEsIGFuZCBsZWF2ZXMgemVyb3Ncbi8vICAgICAgICAgLy8gYWxvbmUuXG4vLyAgICAgICAgIHRoaXMuc2hhcGVyID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5FcXVhbFRvWmVybyApO1xuXG4vLyAgICAgICAgIHRoaXMub3V0cHV0c1sgMCBdID0gdGhpcy5pby5jcmVhdGVHcmVhdGVyVGhhbiggMCApO1xuXG4vLyAgICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5zaGFwZXIgKTtcbi8vICAgICAgICAgdGhpcy5zaGFwZXIuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbi8vICAgICB9XG5cbi8vICAgICBjbGVhblVwKCkge1xuLy8gICAgICAgICBzdXBlcigpO1xuXG4vLyAgICAgICAgIHRoaXMuc2hhcGVyLmNsZWFuVXAoKTtcbi8vICAgICAgICAgdGhpcy5zaGFwZXIgPSBudWxsO1xuLy8gICAgIH1cbi8vIH1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlRXF1YWxUb1plcm8gPSBmdW5jdGlvbigpIHtcbiAgICAvLyByZXR1cm4gbmV3IEVxdWFsVG9aZXJvKCB0aGlzICk7XG5cbiAgICByZXR1cm4gbmV3IEVxdWFsVG8oIHRoaXMsIDAgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgR3JlYXRlclRoYW4gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDAgKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcbiAgICAgICAgdGhpcy5pbnZlcnNpb24gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuXG4gICAgICAgIHRoaXMuaW52ZXJzaW9uLmdhaW4udmFsdWUgPSAtMTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAxMDAwMDA7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5HcmVhdGVyVGhhblplcm8gKTtcblxuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY29ubmVjdCggdGhpcy5pbnZlcnNpb24gKTtcbiAgICAgICAgdGhpcy5pbnZlcnNpb24uY29ubmVjdCggdGhpcy5pbnB1dHNbIDAgXSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUuY2xlYW5VcCgpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gbnVsbDtcblxuICAgICAgICB0aGlzLmludmVyc2lvbi5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuaW52ZXJzaW9uID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xzLnZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoIHZhbHVlICkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLnNldFZhbHVlQXRUaW1lKCB2YWx1ZSwgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVHcmVhdGVyVGhhbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICByZXR1cm4gbmV3IEdyZWF0ZXJUaGFuKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBHcmVhdGVyVGhhblplcm8gZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAxMDAwMDA7XG4gICAgICAgIHRoaXMub3V0cHV0c1sgMCBdID0gdGhpcy5pby5jcmVhdGVXYXZlU2hhcGVyKCB0aGlzLmlvLmN1cnZlcy5HcmVhdGVyVGhhblplcm8gKTtcbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlR3JlYXRlclRoYW5aZXJvID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBHcmVhdGVyVGhhblplcm8oIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgSWZFbHNlIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDAgKTtcblxuICAgICAgICB0aGlzLnN3aXRjaCA9IHRoaXMuaW8uY3JlYXRlU3dpdGNoKCAyLCAwICk7XG5cbiAgICAgICAgdGhpcy5pZiA9IHRoaXMuaW8uY3JlYXRlRXF1YWxUb1plcm8oKTtcbiAgICAgICAgdGhpcy5pZi5jb25uZWN0KCB0aGlzLnN3aXRjaC5jb250cm9sICk7XG4gICAgICAgIHRoaXMudGhlbiA9IHRoaXMuc3dpdGNoLmlucHV0c1sgMCBdO1xuICAgICAgICB0aGlzLmVsc2UgPSB0aGlzLnN3aXRjaC5pbnB1dHNbIDEgXTtcblxuICAgICAgICB0aGlzLmlucHV0cyA9IHRoaXMuc3dpdGNoLmlucHV0cztcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gdGhpcy5zd2l0Y2gub3V0cHV0cztcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuc3dpdGNoLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5pZi5jbGVhblVwKCk7XG5cbiAgICAgICAgdGhpcy5pZiA9IG51bGw7XG4gICAgICAgIHRoaXMudGhlbiA9IG51bGw7XG4gICAgICAgIHRoaXMuZWxzZSA9IG51bGw7XG4gICAgICAgIHRoaXMuaW5wdXRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5vdXRwdXRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5zd2l0Y2ggPSBudWxsO1xuXG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVJZkVsc2UgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IElmRWxzZSggdGhpcyApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBMZXNzVGhhbiBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbywgdmFsdWUgKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMSwgMCApO1xuXG4gICAgICAgIHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIHRoaXMudmFsdWVJbnZlcnNpb24gPSB0aGlzLmNvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLnZhbHVlSW52ZXJzaW9uLmdhaW4udmFsdWUgPSAtMTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNvbm5lY3QoIHRoaXMudmFsdWVJbnZlcnNpb24gKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAtMTAwMDAwO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuR3JlYXRlclRoYW5aZXJvICk7XG5cbiAgICAgICAgdGhpcy52YWx1ZUludmVyc2lvbi5jb25uZWN0KCB0aGlzLmlucHV0c1sgMCBdICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9scy52YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKCB2YWx1ZSApIHtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZS5zZXRWYWx1ZUF0VGltZSggdmFsdWUsIHRoaXMuY29udGV4dC5jdXJyZW50VGltZSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVzc1RoYW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBMZXNzVGhhbiggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgTGVzc1RoYW5aZXJvIGV4dGVuZHMgTm9kZSB7XG4gICAgY29uc3RydWN0b3IoIGlvICkge1xuICAgICAgICBzdXBlciggaW8sIDEsIDAgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmdhaW4udmFsdWUgPSAtMTAwMDAwO1xuICAgICAgICB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlV2F2ZVNoYXBlciggdGhpcy5pby5jdXJ2ZXMuR3JlYXRlclRoYW5aZXJvICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlTGVzc1RoYW5aZXJvID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBMZXNzVGhhblplcm8oIHRoaXMgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gQ29zaW5lIGFwcHJveGltYXRpb24hXG4vL1xuLy8gT25seSB3b3JrcyBpbiByYW5nZSBvZiAtTWF0aC5QSSB0byBNYXRoLlBJLlxuY2xhc3MgQ29zIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5pby5jcmVhdGVQYXJhbSggdmFsdWUgKTtcblxuICAgICAgICB0aGlzLnNxdWFyZSA9IHRoaXMuaW8uY3JlYXRlU3F1YXJlKCk7XG5cbiAgICAgICAgdGhpcy5jb25zdDEgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAtMi42MDVlLTcgKTtcbiAgICAgICAgdGhpcy5jb25zdDIgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAyLjQ3NjA5ZS01ICk7XG4gICAgICAgIHRoaXMuY29uc3QzID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggLTAuMDAxMzg4ODQgKTtcbiAgICAgICAgdGhpcy5jb25zdDQgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAwLjA0MTY2NjYgKTtcbiAgICAgICAgdGhpcy5jb25zdDUgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAtMC40OTk5MjMgKTtcbiAgICAgICAgdGhpcy5jb25zdDYgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAxICk7XG5cbiAgICAgICAgdGhpcy5tdWx0aXBseTEgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHkyID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLm11bHRpcGx5MyA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseTQgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHk1ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuXG4gICAgICAgIHRoaXMuYWRkMSA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuYWRkMiA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuYWRkMyA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuYWRkNCA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG4gICAgICAgIHRoaXMuYWRkNSA9IHRoaXMuaW8uY3JlYXRlQWRkKCk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXS5jb25uZWN0KCB0aGlzLnNxdWFyZSApO1xuXG5cbiAgICAgICAgdGhpcy5jb25zdDUuY29ubmVjdCggdGhpcy5hZGQ0LCAwLCAxICk7XG4gICAgICAgIHRoaXMuY29uc3Q2LmNvbm5lY3QoIHRoaXMuYWRkNSwgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgbXVsdGlwbHkxJ3MgaW5wdXRzXG4gICAgICAgIHRoaXMuc3F1YXJlLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkxLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29uc3QxLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkxLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBhZGQxJ3MgaW5wdXRzXG4gICAgICAgIHRoaXMubXVsdGlwbHkxLmNvbm5lY3QoIHRoaXMuYWRkMSwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnN0Mi5jb25uZWN0KCB0aGlzLmFkZDEsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIG11bHRpcGx5MidzIGlucHV0c1xuICAgICAgICB0aGlzLnNxdWFyZS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MiwgMCwgMCApO1xuICAgICAgICB0aGlzLmFkZDEuY29ubmVjdCggdGhpcy5tdWx0aXBseTIsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IHVwIGFkZDIncyBpbnB1dHNcbiAgICAgICAgdGhpcy5tdWx0aXBseTIuY29ubmVjdCggdGhpcy5hZGQyLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29uc3QzLmNvbm5lY3QoIHRoaXMuYWRkMiwgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgbXVsdGlwbHkzJ3MgaW5wdXRzXG4gICAgICAgIHRoaXMuc3F1YXJlLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkzLCAwLCAwICk7XG4gICAgICAgIHRoaXMuYWRkMi5jb25uZWN0KCB0aGlzLm11bHRpcGx5MywgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgYWRkMydzIGlucHV0c1xuICAgICAgICB0aGlzLm11bHRpcGx5My5jb25uZWN0KCB0aGlzLmFkZDMsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb25zdDQuY29ubmVjdCggdGhpcy5hZGQzLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBtdWx0aXBseTQncyBpbnB1dHNcbiAgICAgICAgdGhpcy5zcXVhcmUuY29ubmVjdCggdGhpcy5tdWx0aXBseTQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5hZGQzLmNvbm5lY3QoIHRoaXMubXVsdGlwbHk0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNCdzIGlucHV0c1xuICAgICAgICB0aGlzLm11bHRpcGx5NC5jb25uZWN0KCB0aGlzLmFkZDQsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb25zdDUuY29ubmVjdCggdGhpcy5hZGQ0LCAwLCAxICk7XG5cbiAgICAgICAgLy8gbXVsdGlwbHk1J3MgaW5wdXRzXG4gICAgICAgIHRoaXMuc3F1YXJlLmNvbm5lY3QoIHRoaXMubXVsdGlwbHk1LCAwLCAwICk7XG4gICAgICAgIHRoaXMuYWRkNC5jb25uZWN0KCB0aGlzLm11bHRpcGx5NSwgMCwgMSApO1xuXG4gICAgICAgIC8vIGFkZDUncyBpbnB1dHNcbiAgICAgICAgdGhpcy5tdWx0aXBseTUuY29ubmVjdCggdGhpcy5hZGQ1LCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29uc3Q2LmNvbm5lY3QoIHRoaXMuYWRkNSwgMCwgMSApO1xuXG4gICAgICAgIC8vIE91dHB1dCAoZmluYWxseSEhKVxuICAgICAgICB0aGlzLmFkZDUuY29ubmVjdCggdGhpcy5vdXRwdXRzWyAwIF0gKTtcblxuICAgICAgICAvLyBTdG9yZSBjb250cm9sbGFibGUgcGFyYW1zLlxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlID0gdGhpcy5pbnB1dHNbIDAgXTtcbiAgICB9XG5cbiAgICBjbGVhblVwKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cblxuQXVkaW9JTy5wcm90b3R5cGUuY3JlYXRlQ29zID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgQ29zKCB0aGlzLCB2YWx1ZSApO1xufTsiLCJpbXBvcnQgXCIuLi8uLi9jb3JlL0F1ZGlvSU8uZXM2XCI7XG5pbXBvcnQgTm9kZSBmcm9tIFwiLi4vLi4vY29yZS9Ob2RlLmVzNlwiO1xuXG5jbGFzcyBEZWdUb1JhZCBleHRlbmRzIE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKCBpbyApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAwICk7XG4gICAgICAgIHRoaXMuaW5wdXRzWyAwIF0gPSB0aGlzLm91dHB1dHNbIDAgXSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIE1hdGguUEkgLyAxODAgKTtcbiAgICB9XG59XG5cbkF1ZGlvSU8ucHJvdG90eXBlLmNyZWF0ZURlZ1RvUmFkID0gZnVuY3Rpb24oIGRlZyApIHtcbiAgICByZXR1cm4gbmV3IERlZ1RvUmFkKCB0aGlzLCBkZWcgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuY2xhc3MgUmFkVG9EZWcgZXh0ZW5kcyBOb2RlIHtcbiAgICBjb25zdHJ1Y3RvciggaW8gKSB7XG4gICAgICAgIHN1cGVyKCBpbywgMCwgMCApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5vdXRwdXRzWyAwIF0gPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAxODAgLyBNYXRoLlBJICk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVSYWRUb0RlZyA9IGZ1bmN0aW9uKCBkZWcgKSB7XG4gICAgcmV0dXJuIG5ldyBSYWRUb0RlZyggdGhpcywgZGVnICk7XG59OyIsImltcG9ydCBcIi4uLy4uL2NvcmUvQXVkaW9JTy5lczZcIjtcbmltcG9ydCBOb2RlIGZyb20gXCIuLi8uLi9jb3JlL05vZGUuZXM2XCI7XG5cbi8vIFNpbmUgYXBwcm94aW1hdGlvbiFcbi8vXG4vLyBPbmx5IHdvcmtzIGluIHJhbmdlIG9mIC1NYXRoLlBJIHRvIE1hdGguUEkuXG5jbGFzcyBTaW5lIGV4dGVuZHMgTm9kZSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW8gSW5zdGFuY2Ugb2YgQXVkaW9JTy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggaW8sIHZhbHVlICkge1xuICAgICAgICBzdXBlciggaW8sIDAsIDEgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdID0gdGhpcy5jb250cm9scy52YWx1ZSA9IHRoaXMuaW8uY3JlYXRlUGFyYW0oIHZhbHVlICk7XG5cbiAgICAgICAgdGhpcy5zcXVhcmUgPSB0aGlzLmlvLmNyZWF0ZVNxdWFyZSgpO1xuXG4gICAgICAgIHRoaXMuY29uc3QxID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggLTIuMzllLTggKTtcbiAgICAgICAgdGhpcy5jb25zdDIgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAyLjc1MjZlLTYgKTtcbiAgICAgICAgdGhpcy5jb25zdDMgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAtMC4wMDAxOTg0MDkgKTtcbiAgICAgICAgdGhpcy5jb25zdDQgPSB0aGlzLmlvLmNyZWF0ZUNvbnN0YW50KCAwLjAwODMzMzMzICk7XG4gICAgICAgIHRoaXMuY29uc3Q1ID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggLTAuMTY2NjY3ICk7XG4gICAgICAgIHRoaXMuY29uc3Q2ID0gdGhpcy5pby5jcmVhdGVDb25zdGFudCggMSApO1xuXG4gICAgICAgIHRoaXMubXVsdGlwbHkxID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLm11bHRpcGx5MiA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseTMgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIHRoaXMubXVsdGlwbHk0ID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICB0aGlzLm11bHRpcGx5NSA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseTYgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG5cbiAgICAgICAgdGhpcy5hZGQxID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgdGhpcy5hZGQyID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgdGhpcy5hZGQzID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgdGhpcy5hZGQ0ID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcbiAgICAgICAgdGhpcy5hZGQ1ID0gdGhpcy5pby5jcmVhdGVBZGQoKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc3F1YXJlICk7XG5cblxuICAgICAgICB0aGlzLmNvbnN0NS5jb25uZWN0KCB0aGlzLmFkZDQsIDAsIDEgKTtcbiAgICAgICAgdGhpcy5jb25zdDYuY29ubmVjdCggdGhpcy5hZGQ1LCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBtdWx0aXBseTEncyBpbnB1dHNcbiAgICAgICAgdGhpcy5zcXVhcmUuY29ubmVjdCggdGhpcy5tdWx0aXBseTEsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb25zdDEuY29ubmVjdCggdGhpcy5tdWx0aXBseTEsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IGFkZDEncyBpbnB1dHNcbiAgICAgICAgdGhpcy5tdWx0aXBseTEuY29ubmVjdCggdGhpcy5hZGQxLCAwLCAwICk7XG4gICAgICAgIHRoaXMuY29uc3QyLmNvbm5lY3QoIHRoaXMuYWRkMSwgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgbXVsdGlwbHkyJ3MgaW5wdXRzXG4gICAgICAgIHRoaXMuc3F1YXJlLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkyLCAwLCAwICk7XG4gICAgICAgIHRoaXMuYWRkMS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MiwgMCwgMSApO1xuXG4gICAgICAgIC8vIENvbm5lY3QgdXAgYWRkMidzIGlucHV0c1xuICAgICAgICB0aGlzLm11bHRpcGx5Mi5jb25uZWN0KCB0aGlzLmFkZDIsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb25zdDMuY29ubmVjdCggdGhpcy5hZGQyLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCB1cCBtdWx0aXBseTMncyBpbnB1dHNcbiAgICAgICAgdGhpcy5zcXVhcmUuY29ubmVjdCggdGhpcy5tdWx0aXBseTMsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5hZGQyLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkzLCAwLCAxICk7XG5cbiAgICAgICAgLy8gQ29ubmVjdCBhZGQzJ3MgaW5wdXRzXG4gICAgICAgIHRoaXMubXVsdGlwbHkzLmNvbm5lY3QoIHRoaXMuYWRkMywgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnN0NC5jb25uZWN0KCB0aGlzLmFkZDMsIDAsIDEgKTtcblxuICAgICAgICAvLyBDb25uZWN0IG11bHRpcGx5NCdzIGlucHV0c1xuICAgICAgICB0aGlzLnNxdWFyZS5jb25uZWN0KCB0aGlzLm11bHRpcGx5NCwgMCwgMCApO1xuICAgICAgICB0aGlzLmFkZDMuY29ubmVjdCggdGhpcy5tdWx0aXBseTQsIDAsIDEgKTtcblxuICAgICAgICAvLyBhZGQ0J3MgaW5wdXRzXG4gICAgICAgIHRoaXMubXVsdGlwbHk0LmNvbm5lY3QoIHRoaXMuYWRkNCwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvbnN0NS5jb25uZWN0KCB0aGlzLmFkZDQsIDAsIDEgKTtcblxuICAgICAgICAvLyBtdWx0aXBseTUncyBpbnB1dHNcbiAgICAgICAgdGhpcy5zcXVhcmUuY29ubmVjdCggdGhpcy5tdWx0aXBseTUsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5hZGQ0LmNvbm5lY3QoIHRoaXMubXVsdGlwbHk1LCAwLCAxICk7XG5cbiAgICAgICAgLy8gYWRkNSdzIGlucHV0c1xuICAgICAgICB0aGlzLm11bHRpcGx5NS5jb25uZWN0KCB0aGlzLmFkZDUsIDAsIDAgKTtcbiAgICAgICAgdGhpcy5jb25zdDYuY29ubmVjdCggdGhpcy5hZGQ1LCAwLCAxICk7XG5cbiAgICAgICAgLy8gbXVsdGlwbHk2J3MgaW5wdXRzXG4gICAgICAgIHRoaXMuaW5wdXRzWzBdLmNvbm5lY3QoIHRoaXMubXVsdGlwbHk2LCAwLCAwICk7XG4gICAgICAgIHRoaXMuYWRkNS5jb25uZWN0KCB0aGlzLm11bHRpcGx5NiwgMCwgMSApO1xuXG4gICAgICAgIC8vIE91dHB1dCAoZmluYWxseSEhKVxuICAgICAgICB0aGlzLm11bHRpcGx5Ni5jb25uZWN0KCB0aGlzLm91dHB1dHNbIDAgXSApO1xuICAgIH1cblxuICAgIGNsZWFuVXAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVTaW5lID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgIHJldHVybiBuZXcgU2luZSggdGhpcywgdmFsdWUgKTtcbn07IiwiaW1wb3J0IFwiLi4vLi4vY29yZS9BdWRpb0lPLmVzNlwiO1xuaW1wb3J0IE5vZGUgZnJvbSBcIi4uLy4uL2NvcmUvTm9kZS5lczZcIjtcblxuLy8gVGFuZ2VudCBhcHByb3hpbWF0aW9uIVxuLy9cbi8vIE9ubHkgd29ya3MgaW4gcmFuZ2Ugb2YgLU1hdGguUEkgdG8gTWF0aC5QSS5cbi8vXG4vLyBzaW4oIGlucHV0ICkgLyBjb3MoIGlucHV0IClcbmNsYXNzIFRhbiBleHRlbmRzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlvIEluc3RhbmNlIG9mIEF1ZGlvSU8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIGlvLCB2YWx1ZSApIHtcbiAgICAgICAgc3VwZXIoIGlvLCAwLCAxICk7XG5cbiAgICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IHRoaXMuY29udHJvbHMudmFsdWUgPSB0aGlzLmlvLmNyZWF0ZVBhcmFtKCB2YWx1ZSApO1xuXG4gICAgICAgIHRoaXMuc2luZSA9IHRoaXMuaW8uY3JlYXRlU2luZSgpO1xuICAgICAgICB0aGlzLmNvcyA9IHRoaXMuaW8uY3JlYXRlQ29zKCk7XG4gICAgICAgIHRoaXMuZGl2aWRlID0gdGhpcy5pby5jcmVhdGVEaXZpZGUoIHVuZGVmaW5lZCwgTWF0aC5QSSAqIDIgKTtcblxuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc2luZSApO1xuICAgICAgICB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuY29zICk7XG4gICAgICAgIHRoaXMuc2luZS5jb25uZWN0KCB0aGlzLmRpdmlkZSwgMCwgMCApO1xuICAgICAgICB0aGlzLmNvcy5jb25uZWN0KCB0aGlzLmRpdmlkZSwgMCwgMSApO1xuXG4gICAgICAgIHRoaXMuZGl2aWRlLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG5cbiAgICAgICAgLy8gdGhpcy5zcXVhcmUgPSB0aGlzLmlvLmNyZWF0ZVNxdWFyZSgpO1xuICAgICAgICAvLyB0aGlzLmlucHV0c1sgMCBdLmNvbm5lY3QoIHRoaXMuc3F1YXJlICk7XG5cbiAgICAgICAgLy8gdGhpcy5tdWx0aXBseTEgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCk7XG4gICAgICAgIC8vIHRoaXMubXVsdGlwbHlUaGlyZCA9IHRoaXMuaW8uY3JlYXRlTXVsdGlwbHkoIDAuMzMzMzMzICk7XG4gICAgICAgIC8vIHRoaXMubXVsdGlwbHkyID0gdGhpcy5pby5jcmVhdGVNdWx0aXBseSgpO1xuICAgICAgICAvLyB0aGlzLm11bHRpcGx5T25lVGhyZWUgPSB0aGlzLmlvLmNyZWF0ZU11bHRpcGx5KCAwLjEzMzMzMyApO1xuICAgICAgICAvLyB0aGlzLmFkZDEgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuICAgICAgICAvLyB0aGlzLmFkZDIgPSB0aGlzLmlvLmNyZWF0ZUFkZCgpO1xuXG4gICAgICAgIC8vIHRoaXMuc3F1YXJlLmNvbm5lY3QoIHRoaXMubXVsdGlwbHkxLCAwLCAwICk7XG4gICAgICAgIC8vIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5tdWx0aXBseTEsIDAsIDEgKTtcblxuICAgICAgICAvLyB0aGlzLnNxdWFyZS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MiwgMCwgMCApO1xuICAgICAgICAvLyB0aGlzLm11bHRpcGx5MS5jb25uZWN0KCB0aGlzLm11bHRpcGx5MiwgMCwgMSApO1xuXG4gICAgICAgIC8vIHRoaXMubXVsdGlwbHkxLmNvbm5lY3QoIHRoaXMubXVsdGlwbHlUaGlyZCApO1xuICAgICAgICAvLyB0aGlzLm11bHRpcGx5Mi5jb25uZWN0KCB0aGlzLm11bHRpcGx5T25lVGhyZWUgKTtcblxuICAgICAgICAvLyB0aGlzLm11bHRpcGx5VGhpcmQuY29ubmVjdCggdGhpcy5hZGQxLCAwLCAwICk7XG4gICAgICAgIC8vIHRoaXMubXVsdGlwbHlPbmVUaHJlZS5jb25uZWN0KCB0aGlzLmFkZDEsIDAsIDEgKTtcblxuICAgICAgICAvLyB0aGlzLmFkZDEuY29ubmVjdCggdGhpcy5hZGQyLCAwLCAwICk7XG4gICAgICAgIC8vIHRoaXMuaW5wdXRzWyAwIF0uY29ubmVjdCggdGhpcy5hZGQyLCAwLCAxICk7XG5cbiAgICAgICAgLy8gdGhpcy5hZGQyLmNvbm5lY3QoIHRoaXMub3V0cHV0c1sgMCBdICk7XG4gICAgfVxuXG4gICAgY2xlYW5VcCgpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLnZhbHVlLmNsZWFuVXAoKTtcbiAgICAgICAgdGhpcy5jb250cm9scy52YWx1ZSA9IG51bGw7XG4gICAgfVxufVxuXG5BdWRpb0lPLnByb3RvdHlwZS5jcmVhdGVUYW4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgcmV0dXJuIG5ldyBUYW4oIHRoaXMsIHZhbHVlICk7XG59OyIsImltcG9ydCBDT05GSUcgZnJvbSBcIi4uL2NvcmUvY29uZmlnLmVzNlwiO1xuXG5mdW5jdGlvbiBQaW5rTnVtYmVyKCkge1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy53aGl0ZVZhbHVlcyA9IFtdO1xuICAgIHRoaXMucmFuZ2UgPSAxMjg7XG4gICAgdGhpcy5saW1pdCA9IDU7XG5cbiAgICB0aGlzLmdlbmVyYXRlID0gdGhpcy5nZW5lcmF0ZS5iaW5kKCB0aGlzICk7XG4gICAgdGhpcy5nZXROZXh0VmFsdWUgPSB0aGlzLmdldE5leHRWYWx1ZS5iaW5kKCB0aGlzICk7XG59XG5cblBpbmtOdW1iZXIucHJvdG90eXBlLmdlbmVyYXRlID0gZnVuY3Rpb24oIHJhbmdlLCBsaW1pdCApIHtcbiAgICB0aGlzLnJhbmdlID0gcmFuZ2UgfHwgMTI4O1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy5saW1pdCA9IGxpbWl0IHx8IDE7XG5cblx0dmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICB9XG59O1xuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZXROZXh0VmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGFzdEtleSA9IHRoaXMua2V5LFxuICAgICAgICBzdW0gPSAwO1xuXG4gICAgKyt0aGlzLmtleTtcblxuICAgIGlmKCB0aGlzLmtleSA+IHRoaXMubWF4S2V5ICkge1xuICAgICAgICB0aGlzLmtleSA9IDA7XG4gICAgfVxuXG4gICAgdmFyIGRpZmYgPSB0aGlzLmxhc3RLZXkgXiB0aGlzLmtleTtcbiAgICB2YXIgcmFuZ2VMaW1pdCA9IHRoaXMucmFuZ2UgLyB0aGlzLmxpbWl0O1xuXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbWl0OyArK2kgKSB7XG4gICAgICAgIGlmKCBkaWZmICYgKDEgPDwgaSkgKSB7XG4gICAgICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1bSArPSB0aGlzLndoaXRlVmFsdWVzWyBpIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bSAvIHRoaXMubGltaXQ7XG59O1xuXG52YXIgcGluayA9IG5ldyBQaW5rTnVtYmVyKCk7XG5waW5rLmdlbmVyYXRlKCk7XG5cblxuXG5cblxuZXhwb3J0IGRlZmF1bHQge1xuXHRyb3VuZEZyb21FcHNpbG9uOiBmdW5jdGlvbiggbiApIHtcblx0XHRsZXQgcm91bmRlZCA9IE1hdGgucm91bmQoIG4gKTtcblxuXHRcdGlmICggcm91bmRlZCAlIG4gPCBDT05GSUcuZXBzaWxvbiApIHtcblx0XHRcdHJldHVybiByb3VuZGVkXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIG47XG5cdFx0fVxuXHR9LFxuXG5cdHJvdW5kVG9NdWx0aXBsZTogZnVuY3Rpb24oIG4sIG11bHRpcGxlICkge1xuXHRcdHJldHVybiBNYXRoLmZsb29yKCAoIG4gKyBtdWx0aXBsZSAtIDEgKSAvIG11bHRpcGxlICkgKiBtdWx0aXBsZTtcblx0fSxcblxuXHRjbGFtcDogZnVuY3Rpb24oIHZhbHVlLCBtaW4sIG1heCApIHtcblx0XHRyZXR1cm4gTWF0aC5taW4oIG1heCwgTWF0aC5tYXgoIHZhbHVlLCBtaW4gKSApO1xuXHR9LFxuXG5cdHNjYWxlTnVtYmVyOiBmdW5jdGlvbiggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG5cdFx0cmV0dXJuICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICkgKiAoIGhpZ2hPdXQgLSBsb3dPdXQgKSArIGxvd091dDtcblx0fSxcblxuXHRzY2FsZU51bWJlckV4cDogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHAgKSB7XG5cdFx0aWYgKCB0eXBlb2YgZXhwICE9PSAnbnVtYmVyJyB8fCBleHAgPT09IDEgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5zY2FsZU51bWJlciggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKTtcblx0XHR9XG5cblx0XHRpZiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSA9PT0gMCApIHtcblx0XHRcdHJldHVybiBsb3dPdXQ7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPiAwICkge1xuXHRcdFx0XHRyZXR1cm4gKCBsb3dPdXQgKyAoIGhpZ2hPdXQgLSBsb3dPdXQgKSAqIE1hdGgucG93KCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICksIGV4cCApICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiAtKCBNYXRoLnBvdyggKCAoIC1udW0gKyBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICksIGV4cCApICkgKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Ly8gQSB2ZXJ5IHBvb3IgYXBwcm94aW1hdGlvbiBvZiBhIGdhdXNzaWFuIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yIVxuXHRnYXVzc2lhblJhbmRvbTogZnVuY3Rpb24oIGN5Y2xlcyApIHtcblx0XHRjeWNsZXMgPSBjeWNsZXMgfHwgMTA7XG5cblx0XHR2YXIgbiA9IDAsXG5cdFx0XHRpID0gY3ljbGVzO1xuXG5cdFx0d2hpbGUoIC0taSApIHtcblx0XHRcdG4gKz0gTWF0aC5yYW5kb20oKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbiAvIGN5Y2xlcztcblx0fSxcblxuXHQvLyBGcm9tOlxuXHQvLyBcdGh0dHA6Ly93d3cubWVyZWRpdGhkb2RnZS5jb20vMjAxMi8wNS8zMC9hLWdyZWF0LWxpdHRsZS1qYXZhc2NyaXB0LWZ1bmN0aW9uLWZvci1nZW5lcmF0aW5nLXJhbmRvbS1nYXVzc2lhbm5vcm1hbGJlbGwtY3VydmUtbnVtYmVycy9cblx0bnJhbmQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB4MSxcblx0XHRcdHgyLFxuXHRcdFx0cmFkLFxuXHRcdFx0eTE7XG5cblx0XHRkbyB7XG5cdFx0XHR4MSA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHgyID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuXHRcdFx0cmFkID0geDEgKiB4MSArIHgyICogeDI7XG5cdFx0fSB3aGlsZSggcmFkID49IDEgfHwgcmFkID09PSAwICk7XG5cblx0XHR2YXIgYyA9IE1hdGguc3FydCggLTIgKiBNYXRoLmxvZyggcmFkICkgLyByYWQgKTtcblxuXHRcdHJldHVybiAoKHgxICogYykgLyA1KSAqIDAuNSArIDAuNTtcblx0fSxcblxuXHRnZW5lcmF0ZVBpbmtOdW1iZXI6IHBpbmsuZ2VuZXJhdGUsXG5cdGdldE5leHRQaW5rTnVtYmVyOiBwaW5rLmdldE5leHRWYWx1ZSxcblxufTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgY2xlYW5VcEluT3V0czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbnB1dHMsXG4gICAgICAgICAgICBvdXRwdXRzO1xuXG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KCB0aGlzLmlucHV0cyApICkge1xuICAgICAgICAgICAgaW5wdXRzID0gdGhpcy5pbnB1dHM7XG5cbiAgICAgICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgIGlmKCBpbnB1dHNbIGkgXSAmJiB0eXBlb2YgaW5wdXRzWyBpIF0uY2xlYW5VcCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRzWyBpIF0uY2xlYW5VcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBpbnB1dHNbIGkgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRzWyBpIF0uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlucHV0c1sgaSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5pbnB1dHMgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIEFycmF5LmlzQXJyYXkoIHRoaXMub3V0cHV0cyApICkge1xuICAgICAgICAgICAgb3V0cHV0cyA9IHRoaXMub3V0cHV0cztcblxuICAgICAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBvdXRwdXRzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgICAgICAgIGlmKCBvdXRwdXRzWyBpIF0gJiYgdHlwZW9mIG91dHB1dHNbIGkgXS5jbGVhblVwID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRzWyBpIF0uY2xlYW5VcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBvdXRwdXRzWyBpIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dHNbIGkgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb3V0cHV0c1sgaSBdID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5vdXRwdXRzID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjbGVhbklPOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYoIHRoaXMuaW8gKSB7XG4gICAgICAgICAgICB0aGlzLmlvID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCB0aGlzLmNvbnRleHQgKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgY29ubmVjdDogZnVuY3Rpb24oIG5vZGUsIG91dHB1dENoYW5uZWwgPSAwLCBpbnB1dENoYW5uZWwgPSAwICkge1xuICAgICAgICBpZiAoIG5vZGUgaW5zdGFuY2VvZiBBdWRpb1BhcmFtIHx8IG5vZGUgaW5zdGFuY2VvZiBBdWRpb05vZGUgKSB7XG4gICAgICAgICAgICAvLyB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXS5jb25uZWN0KCBub2RlICk7XG4gICAgICAgICAgICB0aGlzLm91dHB1dHNbIG91dHB1dENoYW5uZWwgXS5jb25uZWN0LmNhbGwoIHRoaXMub3V0cHV0c1sgb3V0cHV0Q2hhbm5lbCBdLCBub2RlLCAwLCBpbnB1dENoYW5uZWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKCBub2RlICYmIG5vZGUub3V0cHV0cyAmJiBub2RlLm91dHB1dHMubGVuZ3RoICkge1xuICAgICAgICAgICAgLy8gaWYoIG5vZGUuaW5wdXRzWyBpbnB1dENoYW5uZWwgXSBpbnN0YW5jZW9mIFBhcmFtICkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coICdDT05ORUNUSU5HIFRPIFBBUkFNJyApO1xuICAgICAgICAgICAgLy8gbm9kZS5pby5jb25zdGFudERyaXZlci5kaXNjb25uZWN0KCBub2RlLmNvbnRyb2wgKTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgdGhpcy5vdXRwdXRzWyBvdXRwdXRDaGFubmVsIF0uY29ubmVjdCggbm9kZS5pbnB1dHNbIGlucHV0Q2hhbm5lbCBdICk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdBU1NFUlQgTk9UIFJFQUNIRUQnICk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyggYXJndW1lbnRzICk7XG4gICAgICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZGlzY29ubmVjdDogZnVuY3Rpb24oIG5vZGUsIG91dHB1dENoYW5uZWwsIGlucHV0Q2hhbm5lbCApIHtcblxuICAgIH1cbn07IiwiaW1wb3J0IG1hdGggZnJvbSBcIi4vbWF0aC5lczZcIjtcbmltcG9ydCBub3RlU3RyaW5ncyBmcm9tIFwiLi9ub3RlU3RyaW5ncy5lczZcIjtcbmltcG9ydCBub3RlcyBmcm9tIFwiLi9ub3Rlcy5lczZcIjtcbmltcG9ydCBDT05GSUcgZnJvbSBcIi4uL2NvcmUvY29uZmlnLmVzNlwiO1xuaW1wb3J0IG5vdGVSZWdFeHAgZnJvbSBcIi4vbm90ZVJlZ0V4cC5lczZcIjtcblxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgc2NhbGFyVG9EYjogZnVuY3Rpb24oIHNjYWxhciApIHtcbiAgICAgICAgcmV0dXJuIDIwICogKCBNYXRoLmxvZyggc2NhbGFyICkgLyBNYXRoLkxOMTAgKTtcbiAgICB9LFxuICAgIGRiVG9TY2FsYXI6IGZ1bmN0aW9uKCBkYiApIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KCAyLCBkYiAvIDYgKTtcbiAgICB9LFxuXG4gICAgaHpUb01JREk6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIG1hdGgucm91bmRGcm9tRXBzaWxvbiggNjkgKyAxMiAqIE1hdGgubG9nMiggdmFsdWUgLyA0NDAgKSApO1xuICAgIH0sXG5cbiAgICBoelRvTm90ZTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9Ob3RlKCB0aGlzLmh6VG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGh6VG9NczogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICBpZiAoIHZhbHVlID09PSAwICkgcmV0dXJuIDA7XG4gICAgICAgIHJldHVybiAxMDAwIC8gdmFsdWU7XG4gICAgfSxcblxuICAgIGh6VG9CUE06IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0JQTSggdGhpcy5oelRvTXMoIHZhbHVlICkgKTtcbiAgICB9LFxuXG5cblxuICAgIG1pZGlUb0h6OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnBvdyggMiwgKCB2YWx1ZSAtIDY5ICkgLyAxMiApICogNDQwO1xuICAgIH0sXG5cbiAgICBtaWRpVG9Ob3RlOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIGxldCB2YWx1ZXMgPSAoIHZhbHVlICsgJycgKS5zcGxpdCggJy4nICksXG4gICAgICAgICAgICBub3RlVmFsdWUgPSArdmFsdWVzWyAwIF0sXG4gICAgICAgICAgICBjZW50cyA9ICggdmFsdWVzWyAxIF0gPyBwYXJzZUZsb2F0KCAnMC4nICsgdmFsdWVzWyAxIF0sIDEwICkgOiAwICkgKiAxMDA7XG5cbiAgICAgICAgaWYgKCBNYXRoLmFicyggY2VudHMgKSA+PSAxMDAgKSB7XG4gICAgICAgICAgICBub3RlVmFsdWUgKz0gY2VudHMgJSAxMDA7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcm9vdCA9IG5vdGVWYWx1ZSAlIDEyIHwgMCxcbiAgICAgICAgICAgIG9jdGF2ZSA9IG5vdGVWYWx1ZSAvIDEyIHwgMCxcbiAgICAgICAgICAgIG5vdGVOYW1lID0gbm90ZVN0cmluZ3NbIHJvb3QgXTtcblxuICAgICAgICByZXR1cm4gbm90ZU5hbWUgKyAoIG9jdGF2ZSArIENPTkZJRy5sb3dlc3RPY3RhdmUgKSArICggY2VudHMgPyAnKycgKyBjZW50cyA6ICcnICk7XG4gICAgfSxcblxuICAgIG1pZGlUb01zOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmh6VG9NcyggdGhpcy5taWRpVG9IeiggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBtaWRpVG9CUE06IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0JQTSggdGhpcy5taWRpVG9NcyggdmFsdWUgKSApO1xuICAgIH0sXG5cblxuXG4gICAgbm90ZVRvSHo6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvSHooIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBub3RlVG9NSURJOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIGxldCBtYXRjaGVzID0gbm90ZVJlZ0V4cC5leGVjKCB2YWx1ZSApLFxuICAgICAgICAgICAgbm90ZSwgYWNjaWRlbnRhbCwgb2N0YXZlLCBjZW50cyxcbiAgICAgICAgICAgIG5vdGVWYWx1ZTtcblxuICAgICAgICBpZiAoICFtYXRjaGVzICkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCAnSW52YWxpZCBub3RlIGZvcm1hdDonLCB2YWx1ZSApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbm90ZSA9IG1hdGNoZXNbIDEgXTtcbiAgICAgICAgYWNjaWRlbnRhbCA9IG1hdGNoZXNbIDIgXTtcbiAgICAgICAgb2N0YXZlID0gcGFyc2VJbnQoIG1hdGNoZXNbIDMgXSwgMTAgKSArIC1DT05GSUcubG93ZXN0T2N0YXZlO1xuICAgICAgICBjZW50cyA9IHBhcnNlRmxvYXQoIG1hdGNoZXNbIDQgXSApIHx8IDA7XG5cbiAgICAgICAgbm90ZVZhbHVlID0gbm90ZXNbIG5vdGUgKyBhY2NpZGVudGFsIF07XG5cbiAgICAgICAgcmV0dXJuIG1hdGgucm91bmRGcm9tRXBzaWxvbiggbm90ZVZhbHVlICsgKCBvY3RhdmUgKiAxMiApICsgKCBjZW50cyAqIDAuMDEgKSApO1xuICAgIH0sXG5cbiAgICBub3RlVG9NczogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9NcyggdGhpcy5ub3RlVG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIG5vdGVUb0JQTTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWRpVG9CUE0oIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cblxuXG4gICAgbXNUb0h6OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmh6VG9NcyggdmFsdWUgKTtcbiAgICB9LFxuXG4gICAgbXNUb05vdGU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlkaVRvTXMoIHRoaXMubm90ZVRvTUlESSggdmFsdWUgKSApO1xuICAgIH0sXG5cbiAgICBtc1RvTUlESTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5oelRvTUlESSggdGhpcy5tc1RvSHooIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgbXNUb0JQTTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IDAgPyAwIDogNjAwMDAgLyB2YWx1ZTtcbiAgICB9LFxuXG5cblxuICAgIGJwbVRvSHo6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0h6KCB0aGlzLmJwbVRvTXMoIHZhbHVlICkgKTtcbiAgICB9LFxuXG4gICAgYnBtVG9Ob3RlOiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pZGlUb0JQTSggdGhpcy5ub3RlVG9NSURJKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGJwbVRvTUlESTogZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICByZXR1cm4gdGhpcy5tc1RvTUlESSggdGhpcy5icG1Ub01zKCB2YWx1ZSApICk7XG4gICAgfSxcblxuICAgIGJwbVRvTXM6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNUb0JQTSggdmFsdWUgKTtcbiAgICB9XG59OyIsImltcG9ydCBDT05GSUcgZnJvbSBcIi4uL2NvcmUvY29uZmlnLmVzNlwiO1xuXG5mdW5jdGlvbiBQaW5rTnVtYmVyKCkge1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy53aGl0ZVZhbHVlcyA9IFtdO1xuICAgIHRoaXMucmFuZ2UgPSAxMjg7XG4gICAgdGhpcy5saW1pdCA9IDU7XG5cbiAgICB0aGlzLmdlbmVyYXRlID0gdGhpcy5nZW5lcmF0ZS5iaW5kKCB0aGlzICk7XG4gICAgdGhpcy5nZXROZXh0VmFsdWUgPSB0aGlzLmdldE5leHRWYWx1ZS5iaW5kKCB0aGlzICk7XG59XG5cblBpbmtOdW1iZXIucHJvdG90eXBlLmdlbmVyYXRlID0gZnVuY3Rpb24oIHJhbmdlLCBsaW1pdCApIHtcbiAgICB0aGlzLnJhbmdlID0gcmFuZ2UgfHwgMTI4O1xuICAgIHRoaXMubWF4S2V5ID0gMHgxZjtcbiAgICB0aGlzLmtleSA9IDA7XG4gICAgdGhpcy5saW1pdCA9IGxpbWl0IHx8IDE7XG5cblx0dmFyIHJhbmdlTGltaXQgPSB0aGlzLnJhbmdlIC8gdGhpcy5saW1pdDtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5saW1pdDsgKytpICkge1xuICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICB9XG59O1xuXG5QaW5rTnVtYmVyLnByb3RvdHlwZS5nZXROZXh0VmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGFzdEtleSA9IHRoaXMua2V5LFxuICAgICAgICBzdW0gPSAwO1xuXG4gICAgKyt0aGlzLmtleTtcblxuICAgIGlmKCB0aGlzLmtleSA+IHRoaXMubWF4S2V5ICkge1xuICAgICAgICB0aGlzLmtleSA9IDA7XG4gICAgfVxuXG4gICAgdmFyIGRpZmYgPSB0aGlzLmxhc3RLZXkgXiB0aGlzLmtleTtcbiAgICB2YXIgcmFuZ2VMaW1pdCA9IHRoaXMucmFuZ2UgLyB0aGlzLmxpbWl0O1xuXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbWl0OyArK2kgKSB7XG4gICAgICAgIGlmKCBkaWZmICYgKDEgPDwgaSkgKSB7XG4gICAgICAgICAgICB0aGlzLndoaXRlVmFsdWVzWyBpIF0gPSBNYXRoLnJhbmRvbSgpICUgcmFuZ2VMaW1pdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1bSArPSB0aGlzLndoaXRlVmFsdWVzWyBpIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bSAvIHRoaXMubGltaXQ7XG59O1xuXG52YXIgcGluayA9IG5ldyBQaW5rTnVtYmVyKCk7XG5waW5rLmdlbmVyYXRlKCk7XG5cblxuXG5cblxuZXhwb3J0IGRlZmF1bHQge1xuXHRyb3VuZEZyb21FcHNpbG9uOiBmdW5jdGlvbiggbiApIHtcblx0XHRsZXQgcm91bmRlZCA9IE1hdGgucm91bmQoIG4gKTtcblxuXHRcdGlmICggcm91bmRlZCAlIG4gPCBDT05GSUcuZXBzaWxvbiApIHtcblx0XHRcdHJldHVybiByb3VuZGVkXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIG47XG5cdFx0fVxuXHR9LFxuXG5cdHJvdW5kVG9NdWx0aXBsZTogZnVuY3Rpb24oIG4sIG11bHRpcGxlICkge1xuXHRcdHJldHVybiBNYXRoLmZsb29yKCAoIG4gKyBtdWx0aXBsZSAtIDEgKSAvIG11bHRpcGxlICkgKiBtdWx0aXBsZTtcblx0fSxcblxuXHRjbGFtcDogZnVuY3Rpb24oIHZhbHVlLCBtaW4sIG1heCApIHtcblx0XHRyZXR1cm4gTWF0aC5taW4oIG1heCwgTWF0aC5tYXgoIHZhbHVlLCBtaW4gKSApO1xuXHR9LFxuXG5cdHNjYWxlTnVtYmVyOiBmdW5jdGlvbiggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKSB7XG5cdFx0cmV0dXJuICggKCBudW0gLSBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICkgKiAoIGhpZ2hPdXQgLSBsb3dPdXQgKSArIGxvd091dDtcblx0fSxcblxuXHRzY2FsZU51bWJlckV4cDogZnVuY3Rpb24oIG51bSwgbG93SW4sIGhpZ2hJbiwgbG93T3V0LCBoaWdoT3V0LCBleHAgKSB7XG5cdFx0aWYgKCB0eXBlb2YgZXhwICE9PSAnbnVtYmVyJyB8fCBleHAgPT09IDEgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5zY2FsZU51bWJlciggbnVtLCBsb3dJbiwgaGlnaEluLCBsb3dPdXQsIGhpZ2hPdXQgKTtcblx0XHR9XG5cblx0XHRpZiAoICggbnVtIC0gbG93SW4gKSAvICggaGlnaEluIC0gbG93SW4gKSA9PT0gMCApIHtcblx0XHRcdHJldHVybiBsb3dPdXQ7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICkgPiAwICkge1xuXHRcdFx0XHRyZXR1cm4gKCBsb3dPdXQgKyAoIGhpZ2hPdXQgLSBsb3dPdXQgKSAqIE1hdGgucG93KCAoIG51bSAtIGxvd0luICkgLyAoIGhpZ2hJbiAtIGxvd0luICksIGV4cCApICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0cmV0dXJuICggbG93T3V0ICsgKCBoaWdoT3V0IC0gbG93T3V0ICkgKiAtKCBNYXRoLnBvdyggKCAoIC1udW0gKyBsb3dJbiApIC8gKCBoaWdoSW4gLSBsb3dJbiApICksIGV4cCApICkgKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Ly8gQSB2ZXJ5IHBvb3IgYXBwcm94aW1hdGlvbiBvZiBhIGdhdXNzaWFuIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yIVxuXHRnYXVzc2lhblJhbmRvbTogZnVuY3Rpb24oIGN5Y2xlcyApIHtcblx0XHRjeWNsZXMgPSBjeWNsZXMgfHwgMTA7XG5cblx0XHR2YXIgbiA9IDAsXG5cdFx0XHRpID0gY3ljbGVzO1xuXG5cdFx0d2hpbGUoIC0taSApIHtcblx0XHRcdG4gKz0gTWF0aC5yYW5kb20oKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbiAvIGN5Y2xlcztcblx0fSxcblxuXHQvLyBGcm9tOlxuXHQvLyBcdGh0dHA6Ly93d3cubWVyZWRpdGhkb2RnZS5jb20vMjAxMi8wNS8zMC9hLWdyZWF0LWxpdHRsZS1qYXZhc2NyaXB0LWZ1bmN0aW9uLWZvci1nZW5lcmF0aW5nLXJhbmRvbS1nYXVzc2lhbm5vcm1hbGJlbGwtY3VydmUtbnVtYmVycy9cblx0bnJhbmQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB4MSxcblx0XHRcdHgyLFxuXHRcdFx0cmFkLFxuXHRcdFx0eTE7XG5cblx0XHRkbyB7XG5cdFx0XHR4MSA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcblx0XHRcdHgyID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuXHRcdFx0cmFkID0geDEgKiB4MSArIHgyICogeDI7XG5cdFx0fSB3aGlsZSggcmFkID49IDEgfHwgcmFkID09PSAwICk7XG5cblx0XHR2YXIgYyA9IE1hdGguc3FydCggLTIgKiBNYXRoLmxvZyggcmFkICkgLyByYWQgKTtcblxuXHRcdHJldHVybiAoKHgxICogYykgLyA1KSAqIDAuNSArIDAuNTtcblx0fSxcblxuXHRnZW5lcmF0ZVBpbmtOdW1iZXI6IHBpbmsuZ2VuZXJhdGUsXG5cdGdldE5leHRQaW5rTnVtYmVyOiBwaW5rLmdldE5leHRWYWx1ZSxcblxufTsiLCJleHBvcnQgZGVmYXVsdCAvXihbQXxCfEN8RHxFfEZ8R117MX0pKFsjYnhdezAsMn0pKFtcXC1cXCtdP1xcZCspPyhbXFwrfFxcLV17MX1cXGQqLlxcZCopPy87IiwiZXhwb3J0IGRlZmF1bHQgWyAnQycsICdDIycsICdEJywgJ0QjJywgJ0UnLCAnRicsICdGIycsICdHJywgJ0cjJywgJ0EnLCAnQSMnLCAnQicgXTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgJ0MnOiAwLCAgICAgJ0RiYic6IDAsICAgJ0IjJzogMCxcbiAgICAnQyMnOiAxLCAgICAnRGInOiAxLCAgICAnQiMjJzogMSwgICAnQngnOiAxLFxuICAgICdEJzogMiwgICAgICdFYmInOiAyLCAgICdDIyMnOiAyLCAgICdDeCc6IDIsXG4gICAgJ0QjJzogMywgICAgJ0ViJzogMywgICAgJ0ZiYic6IDMsXG4gICAgJ0UnOiA0LCAgICAgJ0ZiJzogNCwgICAgJ0QjIyc6IDQsICAgJ0R4JzogNCxcbiAgICAnRic6IDUsICAgICAnR2JiJzogNSwgICAnRSMnOiA1LFxuICAgICdGIyc6IDYsICAgICdHYic6IDYsICAgICdFIyMnOiA2LCAgICdFeCc6IDYsXG4gICAgJ0cnOiA3LCAgICAgJ0FiYic6IDcsICAgJ0YjIyc6IDcsICAnRngnOiA3LFxuICAgICdHIyc6IDgsICAgICdBYic6IDgsXG4gICAgJ0EnOiA5LCAgICAgJ0JiYic6IDksICAgJ0cjIyc6IDksICAnR3gnOiA5LFxuICAgICdBIyc6IDEwLCAgICdCYic6IDEwLCAgICdDYmInOiAxMCxcbiAgICAnQic6IDExLCAgICAnQ2InOiAxMSwgICAnQSMjJzogMTEsICdBeCc6IDExXG59OyIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIF9zZXRJTyggaW8gKSB7XG4gICAgdGhpcy5pbyA9IGlvO1xuICAgIHRoaXMuY29udGV4dCA9IGlvLmNvbnRleHQ7XG59OyJdfQ==
