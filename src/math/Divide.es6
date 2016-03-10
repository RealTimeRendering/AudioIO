import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

/**
 * Divides two numbers
 * @param {Object} io Instance of AudioIO.
 */
class Divide extends Node {
    constructor( io, value, maxInput ) {
        super( io, 1, 1 );

        this.inputs[ 1 ] = this.io.createParam( value );

        this._value = this.inputs[ 1 ].value;

        this.outputs[ 0 ].gain.value = 0.0;

        this.reciprocal = this.io.createReciprocal( maxInput );
        this.inputs[ 1 ].connect( this.reciprocal );

        this.inputs[ 0 ].connect( this.outputs[ 0 ] );
        this.reciprocal.connect( this.outputs[ 0 ].gain );

        this.controls.divisor = this.inputs[ 1 ];
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
    set value( value ) {
        if ( typeof value === 'number' ) {
            this._value = value;

            // if( this.inputs[ 0 ] instanceof Constant ) {
            this.inputs[ 1 ].value = this._value;
            // }
        }
    }

    get maxInput() {
        return this.reciprocal.maxInput;
    }
    set maxInput( value ) {
        this.reciprocal.maxInput = value;
    }
}

AudioIO.prototype.createDivide = function( value, maxInput ) {
    return new Divide( this, value, maxInput );
};