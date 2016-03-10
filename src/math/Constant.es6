import AudioIO from '../core/AudioIO.es6';
import Node from '../core/Node.es6';

class Constant extends Node {
    /**
     * A constant-rate audio signal
     * @param {Object} io    Instance of AudioIO
     * @param {Number} value Value of the constant
     */
    constructor( io, value = 0.0 ) {
        super( io, 0, 1 );

        this.outputs[ 0 ].gain.value = typeof value === 'number' ? value : 0;
        this.io.constantDriver.connect( this.outputs[ 0 ] );
    }

    get value() {
        return this.outputs[ 0 ].gain.value;
    }
    set value( value ) {
        this.outputs[ 0 ].gain.value = value;
    }
}

AudioIO.prototype.createConstant = function( value ) {
    return new Constant( this, value );
};


// A bunch of preset constants.
(function() {
    var E,
        PI,
        PI2,
        LN10,
        LN2,
        LOG10E,
        LOG2E,
        SQRT1_2,
        SQRT2;

    AudioIO.prototype.createConstantE = function() {
        var c = E || this.createConstant( Math.E );
        E = c;
        return c;
    };

    AudioIO.prototype.createConstantPI = function() {
        var c = PI || this.createConstant( Math.PI );
        PI = c;
        return c;
    };

    AudioIO.prototype.createConstantPI2 = function() {
        var c = PI2 || this.createConstant( Math.PI * 2 );
        PI2 = c;
        return c;
    };

    AudioIO.prototype.createConstantLN10 = function() {
        var c = LN10 || this.createConstant( Math.LN10 );
        LN10 = c;
        return c;
    };

    AudioIO.prototype.createConstantLN2 = function() {
        var c = LN2 || this.createConstant( Math.LN2 );
        LN2 = c;
        return c;
    };

    AudioIO.prototype.createConstantLOG10E = function() {
        var c = LOG10E || this.createConstant( Math.LOG10E );
        LOG10E = c;
        return c;
    };

    AudioIO.prototype.createConstantLOG2E = function() {
        var c = LOG2E || this.createConstant( Math.LOG2E );
        LOG2E = c;
        return c;
    };

    AudioIO.prototype.createConstantSQRT1_2 = function() {
        var c = SQRT1_2 || this.createConstant( Math.SQRT1_2 );
        SQRT1_2 = c;
        return c;
    };

    AudioIO.prototype.createConstantSQRT2 = function() {
        var c = SQRT2 || this.createConstant( Math.SQRT2 );
        SQRT2 = c;
        return c;
    };
}());