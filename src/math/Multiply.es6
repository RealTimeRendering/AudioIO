 import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

/**
 * Multiplies two audio signals together.
 * @param {Object} io Instance of AudioIO.
 */
class Multiply extends Node {
    constructor( io, value ) {
        super( io, 1, 1 );

        this.inputs[ 1 ] = this.io.createParam( value );
        this.outputs[ 0 ].gain.value = 0.0;

        this.inputs[ 0 ].connect( this.outputs[ 0 ] );
        this.inputs[ 1 ].connect( this.outputs[ 0 ].gain );

        this.controls.value = this.inputs[ 1 ];
    }

    get value() {
        return this.controls.value.value;
    }
    set value( value ) {
        this.controls.value.setValueAtTime( value, this.context.currentTime );
    }

}

AudioIO.prototype.createMultiply = function( value1, value2 ) {
    return new Multiply( this, value1, value2 );
};