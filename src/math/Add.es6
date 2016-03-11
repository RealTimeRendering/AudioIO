import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

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
class Add extends Node{
    constructor( io, value ) {
        super( io, 1, 1 );

        this.inputs[ 1 ] = this.io.createParam( value );

        this.inputs[ 0 ].connect( this.outputs[ 0 ] );
        this.inputs[ 1 ].connect( this.outputs[ 0 ] );

        // Store controllable params.
        this.controls.value = this.inputs[ 1 ];
    }

    get value() {
    	return this.controls.value.value;
    }
    set value( value ) {
    	this.controls.value.value = value;
    }
}


AudioIO.prototype.createAdd = function( value ) {
    return new Add( this, value );
};