import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

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
class Reciprocal extends Node {
    constructor( io, maxInput ) {
        super( io, 1, 1 );

        var factor = maxInput || 100,
            gain = Math.pow( factor, -1 );

        this._maxInput = this.context.createGain();
        this._maxInput.gain.setValueAtTime( gain, this.context.currentTime );

        // this.inputs[ 0 ] = this.context.createGain();
        this.inputs[ 0 ].gain.setValueAtTime( 0.0, this.context.currentTime );

        this.shaper = this.io.createWaveShaper( this.io.curves.Reciprocal );

        // this.outputs[ 0 ] = this.context.createGain();
        this.outputs[ 0 ].gain.setValueAtTime( 0.0, this.context.currentTime );

        this.io.constantDriver.connect( this._maxInput );
        this._maxInput.connect( this.inputs[ 0 ].gain );
        this._maxInput.connect( this.outputs[ 0 ].gain );

        this.inputs[ 0 ].connect( this.shaper );
        this.shaper.connect( this.outputs[ 0 ] );
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
    set maxInput( value ) {
        if ( typeof value === 'number' ) {
            this._maxInput.gain.cancelScheduledValues( this.context.currentTime );
            this._maxInput.gain.setValueAtTime( 1 / value, this.context.currentTime );
        }
    }
}

AudioIO.prototype.createReciprocal = function( maxInput ) {
    return new Reciprocal( this, maxInput );
};