import AudioIO from "./AudioIO.es6";
import _setIO from "../mixins/setIO.es6";
import connections from "../mixins/connections.es6";
import cleaners from "../mixins/cleaners.es6";

class WaveShaper {
    constructor( io, curveOrIterator, size ) {
        this._setIO( io );

        this.shaper = this.context.createWaveShaper();

        // If a Float32Array is provided, use it
        // as the curve value.
        if ( curveOrIterator instanceof Float32Array ) {
            this.shaper.curve = curveOrIterator;
        }

        // If a function is provided, create a curve
        // using the function as an iterator.
        else if ( typeof curveOrIterator === 'function' ) {
            size = typeof size === 'number' && size >= 2 ? size : CONFIG.curveResolution;

            var array = new Float32Array( size ),
                i = 0,
                x = 0;

            for ( i; i < size; ++i ) {
                x = ( i / size ) * 2 - 1;
                array[ i ] = curveOrIterator( x, i, size );
            }

            this.shaper.curve = array;
        }

        // Otherwise, default to a Linear curve.
        else {
            this.shaper.curve = this.io.curves.Linear;
        }

        this.inputs = this.outputs = [ this.shaper ];
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
    set curve( curve ) {
        if( curve instanceof Float32Array ) {
            this.shaper.curve = curve;
        }
    }
}

AudioIO.mixinSingle( WaveShaper.prototype, _setIO, '_setIO' );
AudioIO.mixinSingle( WaveShaper.prototype, cleaners.cleanUpInOuts, '_cleanUpInOuts' );
AudioIO.mixinSingle( WaveShaper.prototype, cleaners.cleanIO, '_cleanIO' );
AudioIO.mixin( WaveShaper.prototype, connections );

AudioIO.prototype.createWaveShaper = function( curve, size ) {
    return new WaveShaper( this, curve, size );
};