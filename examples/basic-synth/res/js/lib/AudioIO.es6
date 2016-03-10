(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _configEs6 = require('./config.es6');

var _configEs62 = _interopRequireDefault(_configEs6);

require('./overrides.es6');

var _signalCurvesEs6 = require('./signalCurves.es6');

var _signalCurvesEs62 = _interopRequireDefault(_signalCurvesEs6);

var _mixinsConversionsEs6 = require('../mixins/conversions.es6');

var _mixinsConversionsEs62 = _interopRequireDefault(_mixinsConversionsEs6);

class AudioIO {

    static mixin(target, source) {
        for (var i in source) {
            if (source.hasOwnProperty(i)) {
                target[i] = source[i];
            }
        }
    }

    static mixinSingle(target, source, name) {
        target[name] = source;
    }

    constructor() {
        var context = arguments[0] === undefined ? new AudioContext() : arguments[0];

        this._context = context;

        this.master = this._context.destination;

        // Create an always-on 'driver' node that constantly outputs a value
        // of 1 or -1.
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

    get context() {
        return this._context;
    }

    set context(context) {
        if (!(context instanceof AudioContext)) {
            throw new Error('Invalid audio context given:' + context);
        }

        this._context = context;
        this.master = context.destination;
    }
}

AudioIO.mixinSingle(AudioIO.prototype, _signalCurvesEs62['default'], 'curves');
AudioIO.mixinSingle(AudioIO.prototype, _mixinsConversionsEs62['default'], 'convert');

window.AudioIO = AudioIO;

exports['default'] = AudioIO;
module.exports = exports['default'];

},{"../mixins/conversions.es6":47,"./config.es6":5,"./overrides.es6":6,"./signalCurves.es6":7}],2:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _AudioIOEs6 = require("./AudioIO.es6");

var _AudioIOEs62 = _interopRequireDefault(_AudioIOEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var _mixinsConnectionsEs6 = require("../mixins/connections.es6");

var _mixinsConnectionsEs62 = _interopRequireDefault(_mixinsConnectionsEs6);

var _mixinsCleanersEs6 = require("../mixins/cleaners.es6");

var _mixinsCleanersEs62 = _interopRequireDefault(_mixinsCleanersEs6);

class Node {
    constructor(io) {
        var numInputs = arguments[1] === undefined ? 0 : arguments[1];
        var numOutputs = arguments[2] === undefined ? 0 : arguments[2];

        this._setIO(io);

        this.inputs = [];
        this.outputs = [];

        for (var i = 0; i < numInputs; ++i) {
            this.addInputChannel();
        }

        for (i = 0; i < numOutputs; ++i) {
            this.addOutputChannel();
        }
    }

    addInputChannel() {
        this.inputs.push(this.context.createGain());
    }

    addOutputChannel() {
        this.outputs.push(this.context.createGain());
    }

    cleanUp() {
        this._cleanUpInOuts();
        this._cleanIO();
        this.disconnect();
    }

    get numberOfInputs() {
        return this.inputs.length;
    }
    get numberOfOutputs() {
        return this.outputs.length;
    }

    get inputValue() {
        return this.inputs.length ? this.inputs[0].gain.value : null;
    }
    set inputValue(value) {
        for (var i = 0; i < this.inputs.length; ++i) {
            this.inputs[i].gain.value = this.invertInputPhase ? -value : value;
        }
    }

    get outputValue() {
        return this.outputs.length ? this.outputs[0].gain.value : null;
    }
    set outputValue(value) {
        for (var i = 0; i < this.outputs.length; ++i) {
            this.outputs[i].gain.value = this.invertOutputPhase ? -value : value;
        }
    }

    get invertInputPhase() {
        return this.inputs.length ? this.inputs[0].gain.value < 0 : null;
    }
    set invertInputPhase(inverted) {
        for (var i = 0, input, v; i < this.inputs.length; ++i) {
            input = this.inputs[i].gain;
            v = input.value;
            input.value = v < 0 ? inverted ? v : -v : inverted ? -v : v;
        }
    }

    get invertOutputPhase() {
        return this.outputs.length ? this.outputs[0].gain.value < 0 : null;
    }

    // TODO:
    //  - setValueAtTime?
    set invertOutputPhase(inverted) {
        for (var i = 0, v; i < this.outputs.length; ++i) {
            v = this.outputs[i].gain.value;
            this.outputs[i].gain.value = v < 0 ? inverted ? v : -v : inverted ? -v : v;
        }
    }
}

_AudioIOEs62["default"].mixinSingle(Node.prototype, _mixinsSetIOEs62["default"], "_setIO");
_AudioIOEs62["default"].mixinSingle(Node.prototype, _mixinsCleanersEs62["default"].cleanUpInOuts, "_cleanUpInOuts");
_AudioIOEs62["default"].mixinSingle(Node.prototype, _mixinsCleanersEs62["default"].cleanIO, "_cleanIO");
_AudioIOEs62["default"].mixin(Node.prototype, _mixinsConnectionsEs62["default"]);

_AudioIOEs62["default"].prototype.createNode = function (numInputs, numOutputs) {
    return new Node(this, numInputs, numOutputs);
};

exports["default"] = Node;
module.exports = exports["default"];

},{"../mixins/cleaners.es6":45,"../mixins/connections.es6":46,"../mixins/setIO.es6":53,"./AudioIO.es6":1}],3:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _AudioIOEs6 = require("./AudioIO.es6");

var _AudioIOEs62 = _interopRequireDefault(_AudioIOEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var _mixinsConnectionsEs6 = require("../mixins/connections.es6");

var _mixinsConnectionsEs62 = _interopRequireDefault(_mixinsConnectionsEs6);

var _mixinsCleanersEs6 = require("../mixins/cleaners.es6");

var _mixinsCleanersEs62 = _interopRequireDefault(_mixinsCleanersEs6);

class Param {
    constructor(io, value, defaultValue) {
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

        // if( typeof value === 'number' && value < 0 ) {
        // this.io.constantDriverNegative.connect( this._control );
        // }

        // TODO:
        //  - Should the driver always be connected?
        //  - Not sure whether Param should output 0 if value !== Number.
        if (typeof value === "number") {
            this.io.constantDriver.connect(this._control);
        }
    }

    reset() {
        this.value = this.defaultValue;
        return this;
    }

    cleanUp() {
        this._cleanUpInOuts();
        this._cleanIO();
        this._value = null;
        this._control = null;
        this.defaultValue = null;

        this.disconnect();
    }

    setValueAtTime(value, startTime) {
        this._value = value;
        this._control.gain.setValueAtTime(value, startTime);
        return this;
    }

    linearRampToValueAtTime(value, endTime) {
        this._value = value;
        this._control.gain.linearRampToValueAtTime(value, endTime);
        return this;
    }

    exponentialRampToValueAtTime(value, endTime) {
        this._value = value;
        this._control.gain.exponentialRampToValueAtTime(value, endTime);
        return this;
    }

    setTargetAtTime(value, startTime, timeConstant) {
        this._value = value;
        this._control.gain.setTargetAtTime(value, startTime, timeConstant);
        return this;
    }

    setValueCurveAtTime(values, startTime, duration) {
        this._value = value;
        this._control.gain.setValueCurveAtTime(values, startTime, duration);
        return this;
    }

    cancelScheduledValues(startTime) {
        this._control.gain.cancelScheduledValues(startTime);
        return this;
    }

    get value() {
        // return this._control.gain.value;
        return this._value;
    }
    set value(value) {
        this.setValueAtTime(value, this.context.currentTime);
    }

    get control() {
        return this._control.gain;
    }
}

_AudioIOEs62["default"].mixinSingle(Param.prototype, _mixinsSetIOEs62["default"], "_setIO");
_AudioIOEs62["default"].mixinSingle(Param.prototype, _mixinsCleanersEs62["default"].cleanUpInOuts, "_cleanUpInOuts");
_AudioIOEs62["default"].mixinSingle(Param.prototype, _mixinsCleanersEs62["default"].cleanIO, "_cleanIO");
_AudioIOEs62["default"].mixin(Param.prototype, _mixinsConnectionsEs62["default"]);

_AudioIOEs62["default"].prototype.createParam = function (value, defaultValue) {
    return new Param(this, value, defaultValue);
};

},{"../mixins/cleaners.es6":45,"../mixins/connections.es6":46,"../mixins/setIO.es6":53,"./AudioIO.es6":1}],4:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _AudioIOEs6 = require("./AudioIO.es6");

var _AudioIOEs62 = _interopRequireDefault(_AudioIOEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var _mixinsConnectionsEs6 = require("../mixins/connections.es6");

var _mixinsConnectionsEs62 = _interopRequireDefault(_mixinsConnectionsEs6);

var _mixinsCleanersEs6 = require("../mixins/cleaners.es6");

var _mixinsCleanersEs62 = _interopRequireDefault(_mixinsCleanersEs6);

class WaveShaper {
    constructor(io, curveOrIterator, size) {
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

    cleanUp() {
        this._cleanUpInOuts();
        this._cleanIO();
        this.disconnect();
        this.shaper = null;
    }

    get curve() {
        return this.shaper.curve;
    }
    set curve(curve) {
        if (curve instanceof Float32Array) {
            this.shaper.curve = curve;
        }
    }
}

_AudioIOEs62["default"].mixinSingle(WaveShaper.prototype, _mixinsSetIOEs62["default"], "_setIO");
_AudioIOEs62["default"].mixinSingle(WaveShaper.prototype, _mixinsCleanersEs62["default"].cleanUpInOuts, "_cleanUpInOuts");
_AudioIOEs62["default"].mixinSingle(WaveShaper.prototype, _mixinsCleanersEs62["default"].cleanIO, "_cleanIO");
_AudioIOEs62["default"].mixin(WaveShaper.prototype, _mixinsConnectionsEs62["default"]);

_AudioIOEs62["default"].prototype.createWaveShaper = function (curve, size) {
    return new WaveShaper(this, curve, size);
};

},{"../mixins/cleaners.es6":45,"../mixins/connections.es6":46,"../mixins/setIO.es6":53,"./AudioIO.es6":1}],5:[function(require,module,exports){
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

module.exports = signalCurves;

},{"./config.es6":5}],8:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _CustomEnvelopeEs6 = require("./CustomEnvelope.es6");

var _CustomEnvelopeEs62 = _interopRequireDefault(_CustomEnvelopeEs6);

class ASDREnvelope extends _CustomEnvelopeEs62["default"] {
    constructor(io) {
        super(io);

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

    get attackTime() {
        return this.times.attack;
    }
    set attackTime(time) {
        if (typeof time === "number") {
            this.times.attack = time;
            this.setStepTime("attack", time);
        }
    }

    get decayTime() {
        return this.times.decay;
    }
    set decayTime(time) {
        if (typeof time === "number") {
            this.times.decay = time;
            this.setStepTime("decay", time);
        }
    }

    get releaseTime() {
        return this.times.release;
    }
    set releaseTime(time) {
        if (typeof time === "number") {
            this.times.release = time;
            this.setStepTime("release", time);
        }
    }

    get initialLevel() {
        return this.levels.initial;
    }
    set initialLevel(level) {
        if (typeof level === "number") {
            this.levels.initial = level;
            this.setStepLevel("initial", level);
        }
    }

    get peakLevel() {
        return this.levels.peak;
    }

    set peakLevel(level) {
        if (typeof level === "number") {
            this.levels.peak = level;
            this.setStepLevel("attack", level);
        }
    }

    get sustainLevel() {
        return this.levels.sustain;
    }
    set sustainLevel(level) {
        if (typeof level === "number") {
            this.levels.sustain = level;
            this.setStepLevel("decay", level);
        }
    }

    get releaseLevel() {
        return this.levels.release;
    }
    set releaseLevel(level) {
        if (typeof level === "number") {
            this.levels.release = level;
            this.setStepLevel("release", level);
        }
    }
}

AudioIO.prototype.createASDREnvelope = function () {
    return new ASDREnvelope(this);
};

exports["default"] = ASDREnvelope;
module.exports = exports["default"];

},{"../core/AudioIO.es6":1,"./CustomEnvelope.es6":9}],9:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreConfigEs6 = require("../core/config.es6");

var _coreConfigEs62 = _interopRequireDefault(_coreConfigEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

class CustomEnvelope {
    constructor(io) {
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

    _addStep(section, name, time, level) {
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
    }

    addStartStep(name, time, level) {
        var isExponential = arguments[3] === undefined ? false : arguments[3];

        this._addStep("start", name, time, level, isExponential);
        return this;
    }

    addEndStep(name, time, level) {
        var isExponential = arguments[3] === undefined ? false : arguments[3];

        this._addStep("stop", name, time, level, isExponential);
        return this;
    }

    setStepLevel(name, level) {
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
    }

    setStepTime(name, time) {
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
    }

    _triggerStep(param, step, startTime) {
        // if ( step.isExponential === true ) {
        // There's something amiss here!
        // console.log( Math.max( step.level, CONFIG.epsilon ), startTime + step.time );
        // param.exponentialRampToValueAtTime( Math.max( step.level, 0.01 ), startTime + step.time );
        // }
        // else {
        param.linearRampToValueAtTime(step.level, startTime + step.time);
        // }
    }

    _startSection(section, param, startTime, cancelScheduledValues) {
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
    }

    start(param) {
        var delay = arguments[1] === undefined ? 0 : arguments[1];

        if (param instanceof AudioParam === false && param instanceof Param === false) {
            throw new Error("Can only start an envelope on AudioParam or Param instances.");
        }

        this._startSection("start", param, this.context.currentTime + delay);
    }

    stop(param) {
        var delay = arguments[1] === undefined ? 0 : arguments[1];

        this._startSection("stop", param, this.context.currentTime + 0.1 + delay);
    }

    forceStop(param) {
        var delay = arguments[1] === undefined ? 0 : arguments[1];

        param.cancelScheduledValues(this.context.currentTime + delay);
        // param.setValueAtTime( param.value, this.context.currentTime + delay );
        param.linearRampToValueAtTime(0, this.context.currentTime + 0.001);
    }

    get totalStartTime() {
        var starts = this.steps.start,
            time = 0.0;

        for (var i in starts) {
            time += starts[i].time;
        }

        return time;
    }

    get totalStopTime() {
        var stops = this.steps.stop,
            time = 0.0;

        for (var i in stops) {
            time += stops[i].time;
        }

        return time;
    }
}

_coreAudioIOEs62["default"].mixinSingle(CustomEnvelope.prototype, _mixinsSetIOEs62["default"], "_setIO");

_coreAudioIOEs62["default"].prototype.createCustomEnvelope = function () {
    return new CustomEnvelope(this);
};

exports["default"] = CustomEnvelope;
module.exports = exports["default"];

},{"../core/AudioIO.es6":1,"../core/config.es6":5,"../mixins/setIO.es6":53}],10:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

class OscillatorGenerator {
    constructor(io, frequency, detune, velocity, glideTime, waveform) {
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

    _makeVelocityGraph() {
        var gain = this.context.createGain();
        return gain;
    }

    _resetVelocityGraph(velocity) {
        this.velocityGraph.gain.value = velocity;
    }

    _cleanUpVelocityGraph() {
        this.velocityGraph.disconnect();
        this.outputs[0].disconnect();
        this.velocityGraph = null;
        this.outputs[0] = null;
        this.outputs = null;
    }

    lerp(start, end, delta) {
        return start + (end - start) * delta;
    }

    reset(frequency, detune, velocity, glideTime, wave) {
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
    }

    start(delay) {
        this.generator.start(delay);
    }

    stop(delay) {
        this.generator.stop(delay);
    }

    cleanUp() {
        this.generator.disconnect();
        this.generator = null;

        this._cleanUpVelocityGraph();
    }
}

AudioIO.mixinSingle(OscillatorGenerator.prototype, _mixinsSetIOEs62["default"], "_setIO");

AudioIO.prototype.createOscillatorGenerator = function (frequency, detune, velocity, glideTime, wave) {
    return new OscillatorGenerator(this, frequency, detune, velocity, glideTime, wave);
};

},{"../core/AudioIO.es6":1,"../mixins/setIO.es6":53}],11:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var _mixinsConnectionsEs6 = require("../mixins/connections.es6");

var _mixinsConnectionsEs62 = _interopRequireDefault(_mixinsConnectionsEs6);

var _mixinsCleanersEs6 = require("../mixins/cleaners.es6");

var _mixinsCleanersEs62 = _interopRequireDefault(_mixinsCleanersEs6);

var _DryWetNodeEs6 = require("./DryWetNode.es6");

var _DryWetNodeEs62 = _interopRequireDefault(_DryWetNodeEs6);

class Delay extends _DryWetNodeEs62["default"] {
    constructor(io) {
        var time = arguments[1] === undefined ? 0.25 : arguments[1];
        var feedbackLevel = arguments[2] === undefined ? 0.5 : arguments[2];

        super(io, 1, 1);

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

        this.time = time;
        this.feedbackLevel = feedbackLevel;
    }

    get time() {
        return this.delay.delayTime;
    }

    set time(value) {
        this.delay.delayTime.setValueAtTime(value, this.context.currentTime);
    }

    get feedbackLevel() {
        return this.feedback.gain.value;
    }

    set feedbackLevel(level) {
        this.feedback.gain.value = level;
    }
}

_coreAudioIOEs62["default"].mixinSingle(Delay.prototype, _mixinsSetIOEs62["default"], "_setIO");
_coreAudioIOEs62["default"].mixin(Delay.prototype, _mixinsConnectionsEs62["default"]);
_coreAudioIOEs62["default"].mixin(Delay.prototype, _mixinsCleanersEs62["default"]);

_coreAudioIOEs62["default"].prototype.createDelay = function (time, feedbackLevel) {
    return new Delay(this, time, feedbackLevel);
};

exports["default"] = Delay;
module.exports = exports["default"];

},{"../core/AudioIO.es6":1,"../mixins/cleaners.es6":45,"../mixins/connections.es6":46,"../mixins/setIO.es6":53,"./DryWetNode.es6":12}],12:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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

class DryWetNode extends _coreNodeEs62["default"] {
    constructor(io) {
        var dryWetValue = arguments[1] === undefined ? 0.5 : arguments[1];

        super(io, 1, 1);

        this.dry = this.context.createGain();
        this.wet = this.context.createGain();

        // Connect input to dry, and dry and wet to output
        this.inputs[0].connect(this.dry);
        this.dry.connect(this.outputs[0]);
        this.wet.connect(this.outputs[0]);

        this.value = dryWetValue;
    }

    get dryWet() {
        return this.value;
    }

    set dryWet(value) {
        this.value = value;
        this.dry.gain.value = 1 - this.value;
        this.wet.gain.value = this.value;
    }
}

exports["default"] = DryWetNode;
module.exports = exports["default"];

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/cleaners.es6":45,"../mixins/connections.es6":46,"../mixins/setIO.es6":53}],13:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var _mixinsConnectionsEs6 = require("../mixins/connections.es6");

var _mixinsConnectionsEs62 = _interopRequireDefault(_mixinsConnectionsEs6);

var _mixinsCleanersEs6 = require("../mixins/cleaners.es6");

var _mixinsCleanersEs62 = _interopRequireDefault(_mixinsCleanersEs6);

var _DryWetNodeEs6 = require("./DryWetNode.es6");

var _DryWetNodeEs62 = _interopRequireDefault(_DryWetNodeEs6);

var _DelayEs6 = require("./Delay.es6");

var _DelayEs62 = _interopRequireDefault(_DelayEs6);

class PingPongDelay extends _DryWetNodeEs62["default"] {
    constructor(io) {
        var time = arguments[1] === undefined ? 0.25 : arguments[1];
        var feedbackLevel = arguments[2] === undefined ? 0.5 : arguments[2];

        super(io, 1, 1);

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

    get time() {
        return this.delayL.delayTime;
    }

    set time(value) {
        this.delayL.delayTime.linearRampToValueAtTime(value, this.context.currentTime + 0.5);

        this.delayR.delayTime.linearRampToValueAtTime(value, this.context.currentTime + 0.5);
    }

    get feedbackLevel() {
        return this.feedbackL.gain.value;
    }

    set feedbackLevel(level) {
        this.feedbackL.gain.value = level;
        this.feedbackR.gain.value = level;
    }
}

_coreAudioIOEs62["default"].mixinSingle(PingPongDelay.prototype, _mixinsSetIOEs62["default"], "_setIO");
_coreAudioIOEs62["default"].mixin(PingPongDelay.prototype, _mixinsConnectionsEs62["default"]);
_coreAudioIOEs62["default"].mixin(PingPongDelay.prototype, _mixinsCleanersEs62["default"]);

_coreAudioIOEs62["default"].prototype.createPingPongDelay = function (time, feedbackLevel) {
    return new PingPongDelay(this, time, feedbackLevel);
};

},{"../core/AudioIO.es6":1,"../mixins/cleaners.es6":45,"../mixins/connections.es6":46,"../mixins/setIO.es6":53,"./Delay.es6":11,"./DryWetNode.es6":12}],14:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var _mixinsMathEs6 = require("../mixins/math.es6");

var _mixinsMathEs62 = _interopRequireDefault(_mixinsMathEs6);

var _noteNoteEs6 = require("../note/Note.es6");

var _noteNoteEs62 = _interopRequireDefault(_noteNoteEs6);

var _noteChordEs6 = require("../note/Chord.es6");

var _noteChordEs62 = _interopRequireDefault(_noteChordEs6);

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
class GeneratorPlayer extends _coreNodeEs62["default"] {
    constructor(io, options) {
        super(io, 0, 1);

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

    _createGeneratorObject(frequency, detune, velocity, glideTime, waveform) {
        return this.generator.call(this.io, frequency, detune + this.tuning.value * 100, velocity, glideTime, waveform);
    }

    /**
     * Calculates the amount of detune (cents) to apply to a generator node
     * given an index between 0 and this.unison.value
     *
     * @param  {Number} unisonIndex Unison index.
     * @return {Number}             Detune value, in cents.
     */
    _calculateDetune(unisonIndex) {
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
    }

    _calculateGlideTime(oldFreq, newFreq) {
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
    }

    _storeGeneratorObject(frequency, generatorObject) {
        var objects = this.activeGeneratorObjects;

        objects[frequency] = objects[frequency] || [];
        objects[frequency].unshift(generatorObject);
        this.activeGeneratorObjectsFlat.unshift(generatorObject);
    }

    _fetchGeneratorObject(frequency) {
        var objects = this.activeGeneratorObjects[frequency],
            index = 0;

        if (!objects || objects.length === 0) {
            return null;
        }

        this.activeGeneratorObjectsFlat.pop();
        return objects.pop();
    }

    _fetchGeneratorObjectToReuse() {
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
    }

    _startGeneratorObject(generatorObject, delay) {
        generatorObject.outputs[0].connect(this.outputs[0]);
        this.envelope.start(generatorObject.outputs[0].gain, delay);
        generatorObject.start(delay);
    }

    _startSingle(frequency, velocity, delay) {
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
    }

    start(frequency, velocity, delay) {
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
        } else if (frequency instanceof _noteNoteEs62["default"]) {
            freq = frequency.valueHz;
            this._startSingle(freq, velocity, delay);
        } else if (frequency instanceof _noteChordEs62["default"]) {
            for (var i = 0; i < frequency.notes.length; ++i) {
                freq = frequency.notes[i].valueHz;
                this._startSingle(freq, velocity, delay);
            }
        }

        return this;
    }

    _stopGeneratorObject(generatorObject, delay) {
        var self = this;

        this.envelope.stop(generatorObject.outputs[0].gain, delay);

        generatorObject.timer = setTimeout(function () {
            // self.activeGeneratorObjectsFlat.pop();
            generatorObject.stop(delay);
            generatorObject.cleanUp();
            generatorObject = null;
        }, delay * 1000 + this.envelope.totalStopTime * 1000 + 100);
    }

    _stopSingle(frequency, velocity, delay) {
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
    }

    stop(frequency, velocity, delay) {
        velocity = typeof velocity === "number" ? velocity : 0;
        delay = typeof delay === "number" ? delay : 0;

        if (typeof frequency === "number") {
            this._stopSingle(frequency, velocity, delay);
        } else if (frequency instanceof _noteNoteEs62["default"]) {
            freq = frequency.valueHz;
            this._stopSingle(freq, velocity, delay);
        } else if (frequency instanceof _noteChordEs62["default"]) {
            for (var i = 0; i < frequency.notes.length; ++i) {
                freq = frequency.notes[i].valueHz;
                this._stopSingle(freq, velocity, delay);
            }
        }

        return this;
    }
}

AudioIO.mixinSingle(GeneratorPlayer.prototype, _mixinsSetIOEs62["default"], "_setIO");
GeneratorPlayer.prototype.Math = _mixinsMathEs62["default"];

AudioIO.prototype.createGeneratorPlayer = function (options) {
    return new GeneratorPlayer(this, options);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/math.es6":49,"../mixins/setIO.es6":53,"../note/Chord.es6":54,"../note/Note.es6":56}],15:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreAudioIOEs6 = require('./core/AudioIO.es6');

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

require('./core/Node.es6');

require('./core/Param.es6');

require('./core/WaveShaper.es6');

require('./midi/MIDI.es6');

require('./note/Interval.es6');

require('./note/Note.es6');

require('./note/Chord.es6');

require('./note/NoteScale.es6');

require('./graphs/DryWetNode.es6');

require('./graphs/Delay.es6');

require('./graphs/PingPongDelay.es6');

require('./generators/OscillatorGenerator.es6');

require('./instruments/GeneratorPlayer.es6');

require('./math/Abs.es6');

require('./math/Add.es6');

require('./math/Clamp.es6');

require('./math/Constant.es6');

require('./math/DegToRad.es6');

require('./math/Divide.es6');

require('./math/EqualTo.es6');

require('./math/EqualToZero.es6');

require('./math/Floor.es6');

require('./math/GreaterThan.es6');

require('./math/GreaterThanZero.es6');

require('./math/IfElse.es6');

require('./math/LessThan.es6');

require('./math/LessThanZero.es6');

require('./math/Max.es6');

require('./math/Min.es6');

require('./math/Multiply.es6');

require('./math/Negate.es6');

require('./math/Pow.es6');

require('./math/RadToDeg.es6');

require('./math/Reciprocal.es6');

require('./math/Round.es6');

require('./math/Scale.es6');

require('./math/ScaleExp.es6');

require('./math/Sqrt.es6');

require('./math/Subtract.es6');

require('./math/Switch.es6');

require('./envelopes/CustomEnvelope.es6');

require('./envelopes/ASDREnvelope.es6');

window.AudioContext = window.AudioContext || window.webkitAudioContext;

},{"./core/AudioIO.es6":1,"./core/Node.es6":2,"./core/Param.es6":3,"./core/WaveShaper.es6":4,"./envelopes/ASDREnvelope.es6":8,"./envelopes/CustomEnvelope.es6":9,"./generators/OscillatorGenerator.es6":10,"./graphs/Delay.es6":11,"./graphs/DryWetNode.es6":12,"./graphs/PingPongDelay.es6":13,"./instruments/GeneratorPlayer.es6":14,"./math/Abs.es6":16,"./math/Add.es6":17,"./math/Clamp.es6":18,"./math/Constant.es6":19,"./math/DegToRad.es6":20,"./math/Divide.es6":21,"./math/EqualTo.es6":22,"./math/EqualToZero.es6":23,"./math/Floor.es6":24,"./math/GreaterThan.es6":25,"./math/GreaterThanZero.es6":26,"./math/IfElse.es6":27,"./math/LessThan.es6":28,"./math/LessThanZero.es6":29,"./math/Max.es6":30,"./math/Min.es6":31,"./math/Multiply.es6":32,"./math/Negate.es6":33,"./math/Pow.es6":34,"./math/RadToDeg.es6":35,"./math/Reciprocal.es6":36,"./math/Round.es6":37,"./math/Scale.es6":38,"./math/ScaleExp.es6":39,"./math/Sqrt.es6":40,"./math/Subtract.es6":41,"./math/Switch.es6":42,"./midi/MIDI.es6":43,"./note/Chord.es6":54,"./note/Interval.es6":55,"./note/Note.es6":56,"./note/NoteScale.es6":57}],16:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

class Abs extends _coreNodeEs62["default"] {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor(io) {
        var accuracy = arguments[1] === undefined ? 10 : arguments[1];

        super(io, 1, 1);

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

    cleanUp() {
        super();
        this.shaper.cleanUp();
        this.shaper = null;
    }
}

AudioIO.prototype.createAbs = function (accuracy) {
    return new Abs(this, accuracy);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],17:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
class Add extends _coreNodeEs62["default"] {
    constructor(io, value) {
        super(io, 1, 1);

        this.inputs[1] = this.control = this.io.createParam(value);

        this.inputs[0].connect(this.outputs[0]);
        this.inputs[1].connect(this.outputs[0]);
    }

    get value() {
        return this.control.value;
    }
    set value(value) {
        this.control.setValueAtTime(value, this.context.currentTime);
    }

    cleanUp() {
        super();
        this.control = null;
    }
}

AudioIO.prototype.createAdd = function (value1, value2) {
    return new Add(this, value1, value2);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],18:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * [Clamp description]
 * @param {[type]} io       [description]
 * @param {[type]} minValue [description]
 * @param {[type]} maxValue [description]
 */
class Clamp extends _coreNodeEs62["default"] {
    constructor(io, minValue, maxValue) {
        super(io, 0, 0); // io, 1, 1

        this.min = this.io.createMin(minValue);
        this.max = this.io.createMax(maxValue);

        this.min.connect(this.max);

        this.inputs = [this.min];
        this.outputs = [this.max];
    }

    cleanUp() {
        super();
        this.min = null;
        this.max = null;
    }

    get minValue() {
        return this.min.value;
    }
    set minValue(value) {
        this.min.value = value;
    }

    get maxValue() {
        return this.max.value;
    }
    set maxValue(value) {
        this.max.value = value;
    }
}

AudioIO.prototype.createClamp = function (minValue, maxValue) {
    return new Clamp(this, minValue, maxValue);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],19:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreAudioIOEs6 = require('../core/AudioIO.es6');

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _coreNodeEs6 = require('../core/Node.es6');

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

class Constant extends _coreNodeEs62['default'] {
    /**
     * A constant-rate audio signal
     * @param {Object} io    Instance of AudioIO
     * @param {Number} value Value of the constant
     */
    constructor(io) {
        var value = arguments[1] === undefined ? 0.0 : arguments[1];

        super(io, 0, 1);

        this.outputs[0].gain.value = typeof value === 'number' ? value : 0;
        this.io.constantDriver.connect(this.outputs[0]);
    }

    get value() {
        return this.outputs[0].gain.value;
    }
    set value(value) {
        this.outputs[0].gain.value = value;
    }
}

_coreAudioIOEs62['default'].prototype.createConstant = function (value) {
    return new Constant(this, value);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],20:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

class DegToRad extends _coreNodeEs62["default"] {
    constructor(io) {
        super(io, 0, 0);
        this.inputs[0] = this.outputs[0] = this.io.createMultiply(Math.PI / 180);
    }
}

AudioIO.prototype.createDegToRad = function (deg) {
    return new DegToRad(this, deg);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],21:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * Divides two numbers
 * @param {Object} io Instance of AudioIO.
 */
class Divide extends _coreNodeEs62["default"] {
    constructor(io, value, maxInput) {
        super(io, 1, 1);

        this.inputs[1] = this.io.createParam(value);

        this._value = this.inputs[1].value;

        this.outputs[0].gain.value = 0.0;

        this.reciprocal = this.io.createReciprocal(maxInput);
        this.inputs[1].connect(this.reciprocal);

        this.inputs[0].connect(this.outputs[0]);
        this.reciprocal.connect(this.outputs[0].gain);
    }

    cleanUp() {
        super();
        this.reciprocal.cleanUp();
        this.reciprocal = null;
        this._value = null;
    }

    get value() {
        return this._value;
    }
    set value(value) {
        if (typeof value === "number") {
            this._value = value;

            // if( this.inputs[ 0 ] instanceof Constant ) {
            this.inputs[1].value = this._value;
            // }
        }
    }

    get maxInput() {
        return this.reciprocal.maxInput;
    }
    set maxInput(value) {
        this.reciprocal.maxInput = value;
    }
}

AudioIO.prototype.createDivide = function (value, maxInput) {
    return new Divide(this, value, maxInput);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],22:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

// gain(+100000) -> shaper( <= 0: 1, 1 )
class EqualTo extends _coreNodeEs62["default"] {
    constructor(io, value) {
        super(io, 1, 0);

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
    }

    cleanUp() {
        super();

        this.shaper.cleanUp();
        this.control.cleanUp();

        this.inversion.disconnect();
        this.inversion = null;
        this.shaper = null;
        this.control = null;
    }

    get value() {
        return this.control.value;
    }
    set value(value) {
        this.control.setValueAtTime(value, this.context.currentTime);
    }
}

AudioIO.prototype.createEqualTo = function (value) {
    return new EqualTo(this, value);
};

exports["default"] = EqualTo;
module.exports = exports["default"];

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],23:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

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

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"./EqualTo.es6":22}],24:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

class Floor extends _coreNodeEs62["default"] {
    constructor(io) {
        super(io, 1, 1);

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

    cleanUp() {
        super();

        this.shaper.cleanUp();
        this.ifElse.cleanUp();
        this.equalToZero.cleanUp();

        this.shaper = null;
        this.ifElse = null;
        this.equalToZero = null;
    }
}

AudioIO.prototype.createFloor = function () {
    return new Floor(this);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],25:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

class GreaterThan extends _coreNodeEs62["default"] {
    constructor(io, value) {
        super(io, 1, 0);

        this.control = this.io.createParam(value), this.inversion = this.context.createGain();

        this.inversion.gain.value = -1;

        this.inputs[0].gain.value = 100000;
        this.outputs[0] = this.io.createWaveShaper(this.io.curves.GreaterThanZero);

        this.control.connect(this.inversion);
        this.inversion.connect(this.inputs[0]);
        this.inputs[0].connect(this.outputs[0]);
    }

    cleanUp() {
        super();

        this.control.cleanUp();
        this.control = null;

        this.inversion.disconnect();
        this.inversion = null;
    }

    get value() {
        return this.control.value;
    }
    set value(value) {
        this.control.setValueAtTime(value, this.context.currentTime);
    }
}

AudioIO.prototype.createGreaterThan = function (value) {
    return new GreaterThan(this, value);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],26:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

class GreaterThanZero extends _coreNodeEs62["default"] {
    constructor(io) {
        super(io, 1, 0);

        this.inputs[0].gain.value = 100000;
        this.outputs[0] = this.io.createWaveShaper(this.io.curves.GreaterThanZero);

        this.inputs[0].connect(this.outputs[0]);
    }
}

AudioIO.prototype.createGreaterThanZero = function () {
    return new GreaterThanZero(this);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],27:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

class IfElse extends _coreNodeEs62["default"] {
    constructor(io) {
        super(io, 0, 0);

        this["switch"] = this.io.createSwitch(2, 0);

        this["if"] = this.io.createEqualToZero();
        this["if"].connect(this["switch"].control);
        this.then = this["switch"].inputs[0];
        this["else"] = this["switch"].inputs[1];

        this.inputs = this["switch"].inputs;
        this.outputs = this["switch"].outputs;
    }

    cleanUp() {
        super();

        this["switch"].cleanUp();
        this["if"].cleanUp();

        this["if"] = null;
        this.then = null;
        this["else"] = null;
        this.inputs = null;
        this.outputs = null;
        this["switch"] = null;
    }
}

AudioIO.prototype.createIfElse = function () {
    return new IfElse(this);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],28:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

class LessThan extends _coreNodeEs62["default"] {
    constructor(io, value) {
        super(io, 1, 0);

        this.control = this.io.createParam(-value);

        this.inputs[0].gain.value = -100000;
        this.outputs[0] = this.io.createWaveShaper(this.io.curves.GreaterThanZero);

        this.control.connect(this.inputs[0]);
        this.inputs[0].connect(this.outputs[0]);
    }

    cleanUp() {
        super();

        this.control.cleanUp();
        this.control = null;
    }

    get value() {
        return this.control.value;
    }
    set value(value) {
        this.control.setValueAtTime(-value, this.context.currentTime);
    }
}

AudioIO.prototype.createLessThan = function (value) {
    return new LessThan(this, value);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],29:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

class LessThanZero extends _coreNodeEs62["default"] {
    constructor(io) {
        super(io, 1, 0);

        this.inputs[0].gain.value = -100000;
        this.outputs[0] = this.io.createWaveShaper(this.io.curves.GreaterThanZero);

        this.inputs[0].connect(this.outputs[0]);
    }
}

AudioIO.prototype.createLessThanZero = function () {
    return new LessThanZero(this);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],30:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * When input is > `value`, outputs `value`, otherwise outputs input.
 * @param {AudioIO} io   AudioIO instance
 * @param {Number} value The minimum value to test against.
 */
class Max extends _coreNodeEs62["default"] {
    constructor(io, value) {
        super(io, 1, 0);

        this.control = this.io.createParam(value);
        this.ifElse = this.io.createIfElse();
        this.lessThan = this.io.createLessThan(value);

        this.inputs[0].connect(this.lessThan);
        this.lessThan.connect(this.ifElse["if"]);
        this.inputs[0].connect(this.ifElse.then);
        this.control.connect(this.ifElse["else"]);
        this.outputs = this.ifElse.outputs;
    }

    cleanUp() {
        super();

        this.control.cleanUp();
        this.ifElse.cleanUp();
        this.lessThan.cleanUp();

        this.control = null;
        this.ifElse = null;
        this.lessThan = null;
    }

    get value() {
        return this.control.value;
    }
    set value(value) {
        this.control.value = value;
    }

}

AudioIO.prototype.createMax = function (value) {
    return new Max(this, value);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],31:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * When input is < `value`, outputs `value`, otherwise outputs input.
 * @param {AudioIO} io   AudioIO instance
 * @param {Number} value The minimum value to test against.
 */
class Min extends _coreNodeEs62["default"] {
    constructor(io, value) {
        super(io, 1, 0);

        this.control = this.io.createParam(value);
        this.ifElse = this.io.createIfElse();
        this.greaterThan = this.io.createGreaterThan(value);

        this.inputs[0].connect(this.greaterThan);
        this.greaterThan.connect(this.ifElse["if"]);
        this.inputs[0].connect(this.ifElse.then);
        this.control.connect(this.ifElse["else"]);
        this.outputs = this.ifElse.outputs;
    }

    cleanUp() {
        super();

        this.control.cleanUp();
        this.ifElse.cleanUp();
        this.greaterThan.cleanUp();

        this.control = null;
        this.ifElse = null;
        this.greaterThan = null;
    }

    get value() {
        return this.control.value;
    }
    set value(value) {
        this.control.value = value;
    }
}

AudioIO.prototype.createMin = function (value) {
    return new Min(this, value);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],32:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * Multiplies two audio signals together.
 * @param {Object} io Instance of AudioIO.
 */
class Multiply extends _coreNodeEs62["default"] {
    constructor(io, value) {
        super(io, 1, 1);

        this.inputs[1] = this.io.createParam(value);
        this.outputs[0].gain.value = 0.0;

        this.inputs[0].connect(this.outputs[0]);
        this.inputs[1].connect(this.outputs[0].gain);

        this.control = this.inputs[1];
    }

    cleanUp() {
        super();
        this.control = null;
    }

    get value() {
        return this.control.value;
    }
    set value(value) {
        this.control.setValueAtTime(value, this.context.currentTime);
    }

}

AudioIO.prototype.createMultiply = function (value1, value2) {
    return new Multiply(this, value1, value2);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],33:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * Negates the incoming audio signal.
 * @param {Object} io Instance of AudioIO.
 */
class Negate extends _coreNodeEs62["default"] {
    constructor(io) {
        super(io, 1, 0);

        this.inputs[0].gain.value = -1;
        this.outputs = this.inputs;
    }
}

AudioIO.prototype.createNegate = function () {
    return new Negate(this);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],34:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * @param {Object} io Instance of AudioIO.
 *
 * Note: DOES NOT HANDLE NEGATIVE POWERS.
 */
class Pow extends _coreNodeEs62["default"] {
    constructor(io, value) {
        super(io, 1, 1);

        this.multipliers = [];
        // this.sum = this.context.createGain();
        this._value = value;

        for (var i = 0, node = this.inputs[0]; i < value - 1; ++i) {
            this.multipliers[i] = this.io.createMultiply();
            this.inputs[0].connect(this.multipliers[i].control);
            node.connect(this.multipliers[i]);
            node = this.multipliers[i];
        }

        node.connect(this.outputs[0]);
    }

    cleanUp() {
        super();

        for (var i = this.multipliers.length - 1; i >= 0; --i) {
            this.multipliers[i].cleanUp();
            this.multipliers[i] = null;
        }

        this.multipliers = null;

        // this.sum.disconnect();
        // this.sum = null;

        this._value = null;
    }

    get value() {
        return this._value;
    }
    set value(value) {
        for (var i = this.multipliers.length - 1; i >= 0; --i) {
            this.multipliers[i].disconnect();
            this.multipliers.splice(i, 1);
        }

        this.inputs[0].disconnect();

        for (var i = 0, node = this.inputs[0]; i < value - 1; ++i) {
            this.multipliers[i] = this.io.createMultiply();
            this.inputs[0].connect(this.multipliers[i].control);
            node.connect(this.multipliers[i]);
            node = this.multipliers[i];
        }

        node.connect(this.outputs[0]);

        this._value = value;
    }
}

AudioIO.prototype.createPow = function (value) {
    return new Pow(this, value);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],35:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

class RadToDeg extends _coreNodeEs62["default"] {
    constructor(io) {
        super(io, 0, 0);
        this.inputs[0] = this.outputs[0] = this.io.createMultiply(180 / Math.PI);
    }
}

AudioIO.prototype.createRadToDeg = function (deg) {
    return new RadToDeg(this, deg);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],36:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
class Reciprocal extends _coreNodeEs62["default"] {
    constructor(io, maxInput) {
        super(io, 1, 1);

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

    cleanUp() {
        super();
        this.shaper.cleanUp();
        this._maxInput.disconnect();
        this.shaper = null;
        this._maxInput = null;
    }

    get maxInput() {
        return this._maxInput.gain;
    }
    set maxInput(value) {
        if (typeof value === "number") {
            // this.inputs[ 0 ].gain.cancelScheduledValues( this.context.currentTime );
            // this.outputs[ 0 ].gain.cancelScheduledValues( this.context.currentTime );
            // this.inputs[ 0 ].gain.setValueAtTime( 1 / value, this.context.currentTime );
            // this.outputs[ 0 ].gain.setValueAtTime( 1 / value, this.context.currentTime );
            this._maxInput.gain.cancelScheduledValues(this.context.currentTime);
            this._maxInput.gain.setValueAtTime(1 / value, this.context.currentTime);
        }
    }
}

AudioIO.prototype.createReciprocal = function (maxInput) {
    return new Reciprocal(this, maxInput);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],37:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

class Round extends _coreNodeEs62["default"] {
    constructor(io) {
        super(io, 1, 1);

        this.shaper = this.io.createWaveShaper(this.io.curves.Round);

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

    cleanUp() {
        super();

        this.ifElse.cleanUp();
        this.equalToZero.cleanUp();
        this.shaper.cleanUp();

        this.ifElse = null;
        this.equalToZero = null;
        this.shaper = null;
    }
}

AudioIO.prototype.createRound = function () {
    return new Round(this);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],38:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
class Scale extends _coreNodeEs62["default"] {
    constructor(io, lowIn, highIn, lowOut, highOut) {
        super(io, 1, 1);

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
        this.divide = this.io.createDivide(null, Math.max(lowIn, highIn, lowOut, highOut));
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

        this.outputs[0] = this.add;
    }

    cleanUp() {
        super();

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
    }

    get lowIn() {
        return this._lowIn.value;
    }
    set lowIn(value) {
        this._lowIn.value = value;
        // this.divide.maxInput =
    }

    get highIn() {
        return this._highIn.value;
    }
    set highIn(value) {
        this._highIn.value = value;
    }

    get lowOut() {
        return this._lowOut.value;
    }
    set lowOut(value) {
        this._lowOut.value = value;
    }

    get highOut() {
        return this._highOut.value;
    }
    set highOut(value) {
        this._highOut.value = value;
    }
}

AudioIO.prototype.createScale = function (lowIn, highIn, lowOut, highOut) {
    return new Scale(this, lowIn, highIn, lowOut, highOut);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],39:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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

class ScaleExp extends _coreNodeEs62["default"] {
    constructor(io, lowIn, highIn, lowOut, highOut, exponent) {
        super(io, 1, 1);

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
        this.divide = this.io.createDivide(null, Math.max(lowIn, highIn, lowOut, highOut));
        this.inputMinusLowIn.connect(this.divide, 0, 0);
        this.highInMinusLowIn.connect(this.divide, 0, 1);

        // (-input + lowIn) / (highIn - lowIn)
        this.negativeDivide = this.io.createDivide(null, Math.max(lowIn, highIn, lowOut, highOut));
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

    cleanUp() {
        super();

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
    }

    get lowIn() {
        return this._lowIn.value;
    }
    set lowIn(value) {
        this._lowIn.value = value;
    }

    get highIn() {
        return this._highIn.value;
    }
    set highIn(value) {
        this._highIn.value = value;
    }

    get lowOut() {
        return this._lowOut.value;
    }
    set lowOut(value) {
        this._lowOut.value = value;
    }

    get highOut() {
        return this._highOut.value;
    }
    set highOut(value) {
        this._highOut.value = value;
    }

    get exponent() {
        return this._exponent.value;
    }
    set exponent(value) {
        this._exponent.value = value;
        this.pow.value = value;
        this.negativePow.value = value;
    }
}

AudioIO.prototype.createScaleExp = function (lowIn, highIn, lowOut, highOut, exponent) {
    return new ScaleExp(this, lowIn, highIn, lowOut, highOut, exponent);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],40:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
class SqrtHelper {
    constructor(io, previousStep, input, maxInput) {
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

    cleanUp() {
        this.multiply.cleanUp();
        this.divide.cleanUp();
        this.add.cleanUp();

        this.multiply = null;
        this.divide = null;
        this.add = null;
        this.output = null;
    }
}

class Sqrt extends _coreNodeEs62["default"] {
    constructor(io, significantFigures, maxInput) {
        super(io, 1, 1);

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

    cleanUp() {
        super();

        this.x0.cleanUp();

        this.steps[0] = null;

        for (var i = this.steps.length - 1; i >= 1; --i) {
            this.steps[i].cleanUp();
            this.steps[i] = null;
        }

        this.x0 = null;
        this.steps = null;
    }
}

AudioIO.prototype.createSqrt = function (significantFigures, maxInput) {
    return new Sqrt(this, significantFigures, maxInput);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],41:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

/**
 * Subtracts the second input from the first.
 *
 * @param {Object} io Instance of AudioIO.
 */
class Subtract extends _coreNodeEs62["default"] {
    constructor(io, value) {
        super(io, 1, 1);

        this.negate = this.io.createNegate();

        this.inputs[1] = this.io.createParam(value);

        this.inputs[0].connect(this.outputs[0]);
        this.inputs[1].connect(this.negate);
        this.negate.connect(this.outputs[0]);

        this.control = this.inputs[1];
    }

    cleanUp() {
        super();
        this.negate.cleanUp();

        this.control = null;
        this.negate = null;
    }

    get value() {
        return this.control.value;
    }
    set value(value) {
        this.control.setValueAtTime(value, this.context.currentTime);
    }
}

AudioIO.prototype.createSubtract = function (value1, value2) {
    return new Subtract(this, value1, value2);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2}],42:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("../core/AudioIO.es6");

var _coreNodeEs6 = require("../core/Node.es6");

var _coreNodeEs62 = _interopRequireDefault(_coreNodeEs6);

var _mixinsCleanersEs6 = require("../mixins/cleaners.es6");

var _mixinsCleanersEs62 = _interopRequireDefault(_mixinsCleanersEs6);

class Switch extends _coreNodeEs62["default"] {
    constructor(io, numCases) {
        var startingCase = arguments[2] === undefined ? 0 : arguments[2];

        super(io, 1, 1);

        // Ensure startingCase is never < 0
        startingCase = Math.abs(startingCase);

        this.cases = [];
        this._control = this.io.createParam(startingCase);

        for (var i = 0; i < numCases; ++i) {
            this.inputs[i] = this.context.createGain();
            this.inputs[i].gain.value = 0.0;
            this.cases[i] = this.io.createEqualTo(i);
            this.cases[i].connect(this.inputs[i].gain);
            this._control.connect(this.cases[i]);
            this.inputs[i].connect(this.outputs[0]);
        }
    }

    cleanUp() {
        super();

        for (var i = this.cases.length - 1; i >= 0; --i) {
            this.cases[i].cleanUp();
            this.cases[i] = null;
        }

        this._control.cleanUp();
        this._control = null;
        this.cases = null;
    }

    get control() {
        return this._control.control;
    }

    get value() {
        return this._control.value;
    }
    set value(value) {
        this._control.value = value;
    }
}

AudioIO.prototype.createSwitch = function (numCases, startingCase) {
    return new Switch(this, numCases, startingCase);
};

},{"../core/AudioIO.es6":1,"../core/Node.es6":2,"../mixins/cleaners.es6":45}],43:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreAudioIOEs6 = require('../core/AudioIO.es6');

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _mixinsEventsEs6 = require('../mixins/events.es6');

var _mixinsEventsEs62 = _interopRequireDefault(_mixinsEventsEs6);

var _mixinsPoolEs6 = require('../mixins/Pool.es6');

var _mixinsPoolEs62 = _interopRequireDefault(_mixinsPoolEs6);

class MIDI {
    constructor() {
        this.midiAccess = null;
        this._inputs = [];
        this._outputs = [];

        this._onMIDIMessage = this._onMIDIMessage.bind(this);
    }

    _onMIDIMessage(event) {
        var data = event.data,
            command = data[0] >> 4,
            channel = data[0] & 0xf,
            type = data[0] & 0xf0,
            param1 = data[1],
            param2 = data[2];

        event.customData = {
            command: command,
            channel: channel,
            type: type,
            param1: param1,
            param2: param2
        };

        console.log(event.customData);

        this._emitMIDIEvent(event);
    }

    _emitMIDIEvent(event) {
        var command = event.customData.command,
            channel = event.customData.channel,
            type = event.customData.type,
            param1 = event.customData.param1,
            param2 = event.customData.param2,
            noteInstance;

        switch (command) {

            // Note-on and note-off (when velocity === 0)
            case 9:
                if (param2 !== 0) {
                    this.trigger('note-on', event);
                    this.trigger('note-on:' + channel, event);
                }

            // Explicit Note-off
            case 8:
                if (param2 === 0) {
                    this.trigger('note-off', event);
                    this.trigger('note-off:' + channel, event);
                }
                break;

            // CC messages
            case 11:
                this._emitMIDICCEvent(event, param1, param2, channel);
                break;

            // Channel pressure
            case 13:
                this.trigger('channel-pressure', event);
                this.trigger('channel-pressure:' + channel, event);
                break;

            // Pitchbend
            case 14:
                this.trigger('pitchbend', event);
                this.trigger('pitchbend:' + channel, event);
                break;
        }
    }

    // page 2 here:
    // http://www.midi.org/techspecs/midi_chart-v2.pdf
    _emitMIDICCEvent(event, param1, param2, channel) {
        switch (param1) {
            // Mod wheel
            case 1:
                this.trigger('mod-wheel', event);
                this.trigger('mod-wheel:' + channel, event);
                break;
        }
    }

    enable() {
        var self = this;

        navigator.requestMIDIAccess().then(function (midiAccess) {
            self.midiAccess = midiAccess;

            self.iterateInputs(function (value) {
                value.onmidimessage = self._onMIDIMessage;
                self._inputs.push(value);
            });

            self.iterateOutputs(function (value) {
                self._outputs.push(value);
            });

            console.log(self._inputs);
            console.log(self._outputs);
        });
    }

    get inputs() {
        if (this.midiAccess === null) {
            throw new Error('MIDI must be requested before fetching inputs. Call MIDI#enable() first.');
        }

        return this._inputs;
    }

    get outputs() {
        if (this.midiAccess === null) {
            throw new Error('MIDI must be requested before fetching outputs. Call MIDI#enable() first.');
        }

        return this._outputs;
    }

    iterateValues(values, iterator) {
        for (var value = values.next(); value && !value.done; value = values.next()) {
            console.log(value);
            iterator(value);
        }
    }

    iterateInputs(iterator) {
        this.midiAccess.inputs.forEach(iterator);
    }

    iterateOutputs(iterator) {
        this.midiAccess.outputs.forEach(iterator);
    }
}

_coreAudioIOEs62['default'].mixin(MIDI.prototype, _mixinsEventsEs62['default']);

_coreAudioIOEs62['default'].prototype.midi = new MIDI();

exports['default'] = MIDI;
module.exports = exports['default'];

},{"../core/AudioIO.es6":1,"../mixins/Pool.es6":44,"../mixins/events.es6":48}],44:[function(require,module,exports){
/**
 * Creates a pool of instantiated constructors.
 *
 * Arguments:
 * 	- `Constructor`: 			A reference to the constructor to use in
 * 								the pool.
 *
 * 	- `size`: 					The number of instances to create.
 *
 *  - `constructorArguments`: 	An array of arguments to pass to the
 *   				   			constructor when it's instantiated.
 *
 * 	- `onCreate`: 				A function called after each individual
 * 				  				instance is created. Called with one argument,
 * 				    			which is the instance just created.
 */
"use strict";

exports.__esModule = true;
class Pool {
	constructor(Constructor, size, constructorArguments, onCreate) {
		this.size = size;
		this.Constructor = Constructor;
		this.constructorArguments = constructorArguments;
		this.onCreate = onCreate || function () {};

		this.pool = [];

		this.populate();
	}

	populate() {
		for (var i = this.size - 1, instance = undefined; i >= 0; --i) {
			instance = this._createInstance.apply(this, this.constructorArguments);
			this.onCreate(instance);
			this.pool.push(instance);
		}
	}

	get() {
		if (this.pool.length > 0) {
			var instance = this.pool.pop();
			instance.__inUse__ = true;
			return instance;
		} else {
			return null;
		}
	}

	release(instance) {
		instance.__inUse__ = false;
		this.pool.unshift(instance);
	}
}

Pool.prototype._createInstance = (function () {
	var Constructor;

	// The surrogate Constructor. Returns an instance of
	// `this.Constructor` called with an array of arguments.
	function Surrogate(args) {
		return Constructor.apply(this, args);
	}

	return function () {
		// If it's the first time running this
		// function, set up the Constructor variable and the
		// Surrogate's prototype, so the Constructor is constructed
		// properly.
		if (!Constructor) {
			Constructor = this.Constructor;
			Surrogate.prototype = Constructor.prototype;
		}

		// Return a new instance of the Surrogate constructor,
		// which itself returns a new instance of the `this.Constructor`
		// constructor.
		return new Surrogate(arguments);
	};
})();

exports["default"] = Pool;
module.exports = exports["default"];

},{}],45:[function(require,module,exports){
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

},{}],46:[function(require,module,exports){
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

},{}],47:[function(require,module,exports){
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

},{"../core/config.es6":5,"./math.es6":49,"./noteRegExp.es6":50,"./noteStrings.es6":51,"./notes.es6":52}],48:[function(require,module,exports){
//     Backbone.js 1.2.1

//     (c) 2010-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

// Backbone.Events
// ---------------

// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback
// functions to an event; `trigger`-ing an event fires all callbacks in
// succession.
//
//     var object = {};
//     _.extend(object, Backbone.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//
'use strict';

exports.__esModule = true;
var Events = {};

// Regular expression used to split event strings.
var eventSplitter = /\s+/;

// Iterates over the standard `event, callback` (as well as the fancy multiple
// space-separated events `"change blur", callback` and jQuery-style event
// maps `{event: callback}`), reducing them by manipulating `memo`.
// Passes a normalized single event name and callback, as well as any
// optional `opts`.
var eventsApi = function eventsApi(iteratee, memo, name, callback, opts) {
    var i = 0,
        names;
    if (name && typeof name === 'object') {
        // Handle event maps.
        if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
        for (names = _.keys(name); i < names.length; i++) {
            memo = iteratee(memo, names[i], name[names[i]], opts);
        }
    } else if (name && eventSplitter.test(name)) {
        // Handle space separated event names.
        for (names = name.split(eventSplitter); i < names.length; i++) {
            memo = iteratee(memo, names[i], callback, opts);
        }
    } else {
        memo = iteratee(memo, name, callback, opts);
    }
    return memo;
};

// Bind an event to a `callback` function. Passing `"all"` will bind
// the callback to all events fired.
Events.on = function (name, callback, context) {
    return internalOn(this, name, callback, context);
};

// An internal use `on` function, used to guard the `listening` argument from
// the public API.
var internalOn = function internalOn(obj, name, callback, context, listening) {
    obj._events = eventsApi(onApi, obj._events || {}, name, callback, {
        context: context,
        ctx: obj,
        listening: listening
    });

    if (listening) {
        var listeners = obj._listeners || (obj._listeners = {});
        listeners[listening.id] = listening;
    }

    return obj;
};

// Inversion-of-control versions of `on`. Tell *this* object to listen to
// an event in another object... keeping track of what it's listening to.
Events.listenTo = function (obj, name, callback) {
    if (!obj) return this;
    var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
    var listeningTo = this._listeningTo || (this._listeningTo = {});
    var listening = listeningTo[id];

    // This object is not listening to any other events on `obj` yet.
    // Setup the necessary references to track the listening callbacks.
    if (!listening) {
        var thisId = this._listenId || (this._listenId = _.uniqueId('l'));
        listening = listeningTo[id] = {
            obj: obj,
            objId: id,
            id: thisId,
            listeningTo: listeningTo,
            count: 0
        };
    }

    // Bind callbacks on obj, and keep track of them on listening.
    internalOn(obj, name, callback, this, listening);
    return this;
};

// The reducing API that adds a callback to the `events` object.
var onApi = function onApi(events, name, callback, options) {
    if (callback) {
        var handlers = events[name] || (events[name] = []);
        var context = options.context,
            ctx = options.ctx,
            listening = options.listening;
        if (listening) listening.count++;

        handlers.push({
            callback: callback,
            context: context,
            ctx: context || ctx,
            listening: listening
        });
    }
    return events;
};

// Remove one or many callbacks. If `context` is null, removes all
// callbacks with that function. If `callback` is null, removes all
// callbacks for the event. If `name` is null, removes all bound
// callbacks for all events.
Events.off = function (name, callback, context) {
    if (!this._events) return this;
    this._events = eventsApi(offApi, this._events, name, callback, {
        context: context,
        listeners: this._listeners
    });
    return this;
};

// Tell this object to stop listening to either specific events ... or
// to every object it's currently listening to.
Events.stopListening = function (obj, name, callback) {
    var listeningTo = this._listeningTo;
    if (!listeningTo) return this;

    var ids = obj ? [obj._listenId] : _.keys(listeningTo);

    for (var i = 0; i < ids.length; i++) {
        var listening = listeningTo[ids[i]];

        // If listening doesn't exist, this object is not currently
        // listening to obj. Break out early.
        if (!listening) break;

        listening.obj.off(name, callback, this);
    }
    if (_.isEmpty(listeningTo)) this._listeningTo = void 0;

    return this;
};

// The reducing API that removes a callback from the `events` object.
var offApi = function offApi(events, name, callback, options) {
    // No events to consider.
    if (!events) return;

    var i = 0,
        listening;
    var context = options.context,
        listeners = options.listeners;

    // Delete all events listeners and "drop" events.
    if (!name && !callback && !context) {
        var ids = _.keys(listeners);
        for (; i < ids.length; i++) {
            listening = listeners[ids[i]];
            delete listeners[listening.id];
            delete listening.listeningTo[listening.objId];
        }
        return;
    }

    var names = name ? [name] : _.keys(events);
    for (; i < names.length; i++) {
        name = names[i];
        var handlers = events[name];

        // Bail out if there are no events stored.
        if (!handlers) break;

        // Replace events if there are any remaining.  Otherwise, clean up.
        var remaining = [];
        for (var j = 0; j < handlers.length; j++) {
            var handler = handlers[j];
            if (callback && callback !== handler.callback && callback !== handler.callback._callback || context && context !== handler.context) {
                remaining.push(handler);
            } else {
                listening = handler.listening;
                if (listening && --listening.count === 0) {
                    delete listeners[listening.id];
                    delete listening.listeningTo[listening.objId];
                }
            }
        }

        // Update tail event if the list has any events.  Otherwise, clean up.
        if (remaining.length) {
            events[name] = remaining;
        } else {
            delete events[name];
        }
    }
    if (_.size(events)) return events;
};

// Bind an event to only be triggered a single time. After the first time
// the callback is invoked, it will be removed. When multiple events are
// passed in using the space-separated syntax, the event will fire once for every
// event you passed in, not once for a combination of all events
Events.once = function (name, callback, context) {
    // Map the event into a `{event: once}` object.
    var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
    return this.on(events, void 0, context);
};

// Inversion-of-control versions of `once`.
Events.listenToOnce = function (obj, name, callback) {
    // Map the event into a `{event: once}` object.
    var events = eventsApi(onceMap, {}, name, callback, _.bind(this.stopListening, this, obj));
    return this.listenTo(obj, events);
};

// Reduces the event callbacks into a map of `{event: onceWrapper}`.
// `offer` unbinds the `onceWrapper` after it has been called.
var onceMap = function onceMap(map, name, callback, offer) {
    if (callback) {
        var once = map[name] = _.once(function () {
            offer(name, once);
            callback.apply(this, arguments);
        });
        once._callback = callback;
    }
    return map;
};

// Trigger one or many events, firing all bound callbacks. Callbacks are
// passed the same arguments as `trigger` is, apart from the event name
// (unless you're listening on `"all"`, which will cause your callback to
// receive the true name of the event as the first argument).
Events.trigger = function (name) {
    if (!this._events) return this;

    var length = Math.max(0, arguments.length - 1);
    var args = Array(length);
    for (var i = 0; i < length; i++) args[i] = arguments[i + 1];

    eventsApi(triggerApi, this._events, name, void 0, args);
    return this;
};

// Handles triggering the appropriate event callbacks.
var triggerApi = function triggerApi(objEvents, name, cb, args) {
    if (objEvents) {
        var events = objEvents[name];
        var allEvents = objEvents.all;
        if (events && allEvents) allEvents = allEvents.slice();
        if (events) triggerEvents(events, args);
        if (allEvents) triggerEvents(allEvents, [name].concat(args));
    }
    return objEvents;
};

// A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
// Backbone events have 3 arguments).
var triggerEvents = function triggerEvents(events, args) {
    var ev,
        i = -1,
        l = events.length,
        a1 = args[0],
        a2 = args[1],
        a3 = args[2];
    switch (args.length) {
        case 0:
            while (++i < l) (ev = events[i]).callback.call(ev.ctx);
            return;
        case 1:
            while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1);
            return;
        case 2:
            while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2);
            return;
        case 3:
            while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
            return;
        default:
            while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
            return;
    }
};

exports['default'] = Events;
module.exports = exports['default'];

},{}],49:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _coreConfigEs6 = require("../core/config.es6");

var _coreConfigEs62 = _interopRequireDefault(_coreConfigEs6);

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
	}
};
module.exports = exports["default"];

},{"../core/config.es6":5}],50:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = /^([A|B|C|D|E|F|G]{1})([#bx]{0,2})([\-\+]?\d+)?([\+|\-]{1}\d*.\d*)?/;
module.exports = exports["default"];

},{}],51:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
module.exports = exports['default'];

},{}],52:[function(require,module,exports){
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

},{}],53:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = _setIO;

function _setIO(io) {
    this.io = io;
    this.context = io.context;
}

;
module.exports = exports["default"];

},{}],54:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var _IntervalEs6 = require("./Interval.es6");

var _IntervalEs62 = _interopRequireDefault(_IntervalEs6);

var _NoteEs6 = require("./Note.es6");

var _NoteEs62 = _interopRequireDefault(_NoteEs6);

class Chord {

    constructor(io, root, notes) {
        this._setIO(io);

        this.notes = [];

        this.addNote(root);
        this.root = this.notes[0].clone();

        for (var i = 0; i < notes.length; ++i) {
            if (notes[i] === 0) continue;

            this.addNote(notes[i]);
        }

        this._inversion = 0;
    }

    get inversion() {
        return this._inversion;
    }
    set inversion(inversion) {
        if (inversion === this._inversion) return;

        if (this.notes.length > 0 && inversion > this.notes.length - 1) {
            console.warn("Chord.inversion will be clamped to", this.notes.length - 1, "due to number of notes in chord.");
            inversion = this.notes.length - 1;
        }

        // Reset all notes
        for (var i = 0; i < this._inversion; ++i) {
            this.notes[i].transpose(-12);
        }

        // Apply the inversion to the notes
        for (var i = 0; i < inversion; ++i) {
            this.notes[i].transpose(12);
        }

        // Save the new inversion.
        this._inversion = inversion;

        return inversion;
    }

    get noteValues() {
        return this.notes.map(function (note) {
            return note.valueNote;
        });
    }

    clone() {
        var chord = this.io.createChord(this.root, this.notes);
        chord._inversion = this.inversion;
        return chord;
    }

    copy(chord) {
        if (chord instanceof Chord === false) {
            throw new Error("Invalid `note` argument:" + note);
        }

        this.notes.length = 0;
        this.root.copy(chord.root);

        for (var i = 0; i < chord.notes.length; ++i) {
            this.notes.push(chord.notes[i].clone());
        }

        this._inversion = chord.inversion;

        return this;
    }

    _ensureNote(value) {
        var note;

        // If it's a string, then it's a note value,
        // so a Note object needs to be created and
        // pushed into the `notes` array.
        if (typeof value === "string") {
            note = this.io.createNote(value, "note");
        }

        // If it's a number, then treat it as an interval
        else if (typeof value === "number") {
            note = this.io.createNote(this.root.valueMIDI + value, "midi");
        } else if (value instanceof _IntervalEs62["default"]) {
            note = this.io.createNote(this.root.valueMIDI + value.value, "midi");
        } else if (!(value instanceof _NoteEs62["default"])) {
            throw new Error("Invalid value passed to Chord:" + value);
        }

        return note;
    }

    addNote(value) {
        var inversion = this._inversion;

        value = this._ensureNote(value);

        if (this.inversion !== 0) {
            this.inversion = 0;
        }

        for (var i = 0; i < this.notes.length; ++i) {
            if (this.notes[i].valueMIDI === value.valueMIDI) {
                this.inversion = inversion;
                console.warn("Note already exists in chord.");
                return false;
            }
        }

        this.notes.push(value);

        if (inversion !== 0) {
            this.inversion = inversion;
        }
    }

    removeNoteAtIndex(index) {
        if (typeof index === "number") {
            this.notes.splice(index, 1);
        }
    }

    add(value) {
        value = this._ensureNote(value);

        for (var i = 0; i < notes.length; ++i) {
            notes[i].valueHz += value.valueHz;
        }
    }

    subtract(value) {
        value = this._ensureNote(value);

        for (var i = 0; i < notes.length; ++i) {
            notes[i].valueHz -= value.valueHz;
        }
    }

    multiply(value) {
        value = this._ensureNote(value);

        for (var i = 0; i < notes.length; ++i) {
            notes[i].valueHz *= value.valueHz;
        }
    }

    divide(value) {
        value = this._ensureNote(value);

        for (var i = 0; i < notes.length; ++i) {
            notes[i].valueHz /= value.valueHz;
        }
    }

    // Theory stuff
    transpose(interval) {
        for (var i = 0; i < this.notes.length; ++i) {
            this.notes[i].transpose(interval);
        }
    }

    clampToScale(scale) {
        if (!(scale instanceof Scale)) {
            throw new Error("Chord.clampToScale can only support instances of Scale.");
        }

        var scaleValues = scale.values,
            root = this.root,
            rootMIDI = root.valueMIDI;

        for (var i = 0; i < scaleValues.length; ++i) {}
    }

}

_coreAudioIOEs62["default"].mixinSingle(Chord.prototype, _mixinsSetIOEs62["default"], "_setIO");

_coreAudioIOEs62["default"].prototype.createChord = function (root) {
    var notes = Array.isArray(arguments[1]) ? arguments[1] : Array.prototype.slice.call(arguments, 1);
    return new Chord(this, root, notes);
};

exports["default"] = Chord;
module.exports = exports["default"];

},{"../core/AudioIO.es6":1,"../mixins/setIO.es6":53,"./Interval.es6":55,"./Note.es6":56}],55:[function(require,module,exports){
"use strict";

exports.__esModule = true;
class Interval {
    constructor(value, name) {
        this.name = name;
        this.value = parseFloat(value);
    }

    clone() {
        return new Interval(this.value, this.name);
    }

    copy(interval) {
        this.name = interval.name;
        this.value = interval.value;
        return this;
    }
}

AudioIO.prototype.createInterval = function (value, name) {
    return new Interval(value, name);
};

exports["default"] = Interval;
module.exports = exports["default"];

},{}],56:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var _IntervalEs6 = require("./Interval.es6");

var _IntervalEs62 = _interopRequireDefault(_IntervalEs6);

class Note {
    constructor(io, value, format) {
        this._setIO(io);

        this._format = this._validateFormat(format);

        switch (this._format) {
            case "MIDI":
                value = typeof value === "undefined" ? this.io.convert.hzToMIDI(440) : value;
                this._value = this.io.createParam(this.io.convert.midiToHz(value));
                break;
            case "Note":
                value = typeof value === "undefined" ? this.io.convert.hzToNote(440) : value;
                this._value = this.io.createParam(this.io.convert.noteToHz(value));
                break;
            case "BPM":
                value = typeof value === "undefined" ? this.io.convert.hzToBPM(440) : value;
                this._value = this.io.createParam(this.io.convert.bpmToHz(value));
                break;
            case "Ms":
                value = typeof value === "undefined" ? this.io.convert.hzToMs(440) : value;
                this._value = this.io.createParam(this.io.convert.msToHz(value));
                break;
            // Hz, or invalid.
            default:
                value = typeof value === "undefined" ? 440 : value;
                this._value = this.io.createParam(value);
        }
    }

    _validateFormat(format) {
        if (typeof format === "string") {
            format = format.toLowerCase();

            for (var i = 0; i < this.formats.length; ++i) {
                if (format === this.formats[i].toLowerCase()) {
                    return this.formats[i];
                }
            }
        }

        return this.formats[0];
    }

    clone() {
        var note = this.io.createNote(this.valueNote, "note");
        note.format = this._format;
        return note;
    }

    copy(note) {
        if (note instanceof Note === false) {
            throw new Error("Invalid `note` argument:" + note);
        }

        this.format = note.format;
        this.valueHz = note.valueHz;

        return this;
    }

    transpose(interval) {
        var difference;

        // Number arguments treated as semitones
        if (typeof interval === "number") {
            this.valueMIDI += interval;
        }

        // String arguments treated as Note strings
        else if (typeof interval === "string") {
            interval = this.io.convert.noteToMIDI(interval);
            difference = interval - this.valueMIDI;
            this.valueMIDI += difference;
        } else if (interval instanceof _IntervalEs62["default"]) {
            this.valueMIDI += interval.value;
        } else if (interval instanceof Note) {
            difference = interval.valueMIDI - this.valueMIDI;
            this.valueMIDI += difference;
        }

        return this;
    }

    // TODO:
    //  - Not sure about the naming of this function.
    //    Should it be called something like `removeDetune`?
    round() {
        this.valueMIDI = Math.round(this.valueMIDI);
        return this;
    }

    get value() {
        return this._value.value;
    }
    set value(value) {
        this._value.value = this.io.convert[this._format.toLowerCase() + "ToHz"](value);
    }

    get control() {
        return this._value.control;
    }

    get valueHz() {
        return this._value.value;
    }
    set valueHz(value) {
        if (typeof value === "number") {
            this._value.value = value;
        }
    }

    get valueMIDI() {
        return this.io.convert.hzToMIDI(this.value);
    }
    set valueMIDI(value) {
        if (typeof value === "number") {
            this._value.value = this.io.convert.midiToHz(value);
        }
    }

    get valueNote() {
        return this.io.convert.hzToNote(this.value);
    }
    set valueNote(value) {
        if (typeof value === "string") {
            this._value.value = this.io.convert.noteToHz(value);
        }
    }

    get valueMs() {
        return this.io.convert.hzToMs(this.value);
    }
    set valueMs(value) {
        if (typeof value === "number") {
            this._value.value = this.io.convert.msToHz(value);
        }
    }

    get valueBPM() {
        return this.io.convert.hzToBPM(this.value);
    }
    set valueBPM(value) {
        if (typeof value === "number") {
            this._value.value = this.io.convert.bpmToHz(value);
        }
    }

    get octave() {
        var matches = _coreAudioIOEs62["default"].mixins.noteRegExp.exec(this.valueNote),
            octave = parseInt(matches[3], 10);

        return octave;
    }
    set octave(octave) {
        if (typeof octave === "number") {
            this.transpose((octave - this.octave) * 12);
        }
    }

    get format() {
        return this._format;
    }
    set format(format) {
        if (this._validateFormat(format)) {
            this._format = format;
        }
    }

    get accidental() {
        var matches = _coreAudioIOEs62["default"].mixins.noteRegExp.exec(this.valueNote),
            accidental = matches[2];

        return accidental;
    }

    // TODO:
    //  - Oh no. valueNote is only ever natural or sharp.
    //    That throws a spanner in the works.
    set accidental(accidental) {
        var currentAccidental = this.accidental,
            currentAccidentalTranspose = this.accidentals.indexOf(currentAccidental) - 2,
            newAccidentalTranspose = this.accidentals.indexOf(accidental) - 2;

        this.transpose(newAccidentalTranspose - currentAccidentalTranspose);
    }
}

_coreAudioIOEs62["default"].mixinSingle(Note.prototype, _mixinsSetIOEs62["default"], "_setIO");

Object.defineProperty(Note.prototype, "formats", {
    writable: false,
    value: ["Hz", "MIDI", "Note", "BPM", "Ms"]
});

Object.defineProperty(Note.prototype, "accidentals", {
    writable: false,
    value: ["bb", "b", "", "#", "##"]
});

_coreAudioIOEs62["default"].prototype.createNote = function (value, format) {
    return new Note(this, value, format);
};

exports["default"] = Note;
module.exports = exports["default"];

},{"../core/AudioIO.es6":1,"../mixins/setIO.es6":53,"./Interval.es6":55}],57:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _coreAudioIOEs6 = require("../core/AudioIO.es6");

var _coreAudioIOEs62 = _interopRequireDefault(_coreAudioIOEs6);

var _mixinsSetIOEs6 = require("../mixins/setIO.es6");

var _mixinsSetIOEs62 = _interopRequireDefault(_mixinsSetIOEs6);

var _IntervalEs6 = require("./Interval.es6");

var _IntervalEs62 = _interopRequireDefault(_IntervalEs6);

class NoteScale {
    constructor(io, name, values) {
        this._setIO(io);

        values = Array.isArray(values) ? values : [];

        for (var i = 0; i < values.length; ++i) {
            if (!(values[i] instanceof _IntervalEs62["default"])) {
                values[i] = this.io.createInterval(values[i]);
            }
        }

        this.values = values;
        this.semitones = [];
        this.name = name;

        this._updateSemitones();
    }

    static sortFn(a, b) {
        return a.value - b.value;
    }

    clone() {
        return this.io.createNoteScale(this.name, this.values);
    }

    copy(scale) {
        if (scale instanceof NoteScale === false) {
            throw new Error("Invalid `scale` argument:" + scale);
        }

        var fromValues = scale.values,
            toValues = this.values;

        toValues.length = 0;

        for (var i = 0; i < fromValues.length; ++i) {
            toValues[i] = fromValues[i];
        }

        this.name = scale.name;
        this._updateSemitones();
    }

    _updateSemitones() {
        this.semitones.length = 0;
        this.semitones[0] = 0;

        for (var i = 0, count = 0; i < this.values.length; ++i) {
            count += this.values[i].value;
            this.semitones[i + 1] = count;
        }
    }

    push(interval) {
        if (!(interval instanceof _IntervalEs62["default"])) {
            interval = this.io.createInterval(interval);
        }

        this.values.push(interval);
        this._updateSemitones();
    }

    pop() {
        var interval = this.values.pop();
        this._updateSemitones();
        return interval;
    }

    shift() {
        var interval = this.values.shift();
        this._updateSemitones();
        return interval;
    }

    unshift(interval) {
        if (!(interval instanceof _IntervalEs62["default"])) {
            interval = this.io.createInterval(interval);
        }

        this.values.unshift(interval);
        this._updateSemitones();
    }

    sort(sortFn) {
        this.values.sort(typeof sortFn === "function" ? sortFn : NoteScale.sortFn);
        this._updateSemitones();
    }

    get lowerTetrachord() {
        var values = this.values,
            end = Math.min(values.length, 4);

        return values.slice(0, end);
    }

    get upperTetrachord() {
        var values = this.values,
            length = values.length,
            start = Math.max(0, length - 4);

        return values.slice(start, length);
    }
}

_coreAudioIOEs62["default"].mixinSingle(NoteScale.prototype, _mixinsSetIOEs62["default"], "_setIO");

_coreAudioIOEs62["default"].prototype.createNoteScale = function (name, values) {
    return new NoteScale(this, name, values);
};

},{"../core/AudioIO.es6":1,"../mixins/setIO.es6":53,"./Interval.es6":55}]},{},[15]);
