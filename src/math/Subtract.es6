import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

/**
 * Subtracts the second input from the first.
 *
 * @param {Object} io Instance of AudioIO.
 */
class Subtract extends Node {
    constructor( io, value ) {
        super( io, 1, 1 );

        this.negate = this.io.createNegate();

        this.inputs[ 1 ] = this.io.createParam( value );

        this.inputs[ 0 ].connect( this.outputs[ 0 ] );
        this.inputs[ 1 ].connect( this.negate );
        this.negate.connect( this.outputs[ 0 ] );

        this.controls.value = this.inputs[ 1 ];
    }

    cleanUp() {
        super();
        this.negate.cleanUp();

        this.controls.value = null;
        this.negate = null;
    }

    get value() {
        return this.controls.value.value;
    }
    set value( value ) {
        this.controls.value.setValueAtTime( value, this.context.currentTime );
    }
}

AudioIO.prototype.createSubtract = function( value ) {
    return new Subtract( this, value );
};