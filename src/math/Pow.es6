import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

/**
 * @param {Object} io Instance of AudioIO.
 *
 * Note: DOES NOT HANDLE NEGATIVE POWERS.
 */
class Pow extends Node {
    constructor( io, value ) {
        super( io, 1, 1 );

        this.multipliers = [];
        this._value = value;

        for ( var i = 0, node = this.inputs[ 0 ]; i < value - 1; ++i ) {
            this.multipliers[ i ] = this.io.createMultiply();
            this.inputs[ 0 ].connect( this.multipliers[ i ].controls.value );
            node.connect( this.multipliers[ i ] );
            node = this.multipliers[ i ];
        }

        node.connect( this.outputs[ 0 ] );
    }

    cleanUp() {
        super();

        for( var i = this.multipliers.length - 1; i >= 0; --i ) {
            this.multipliers[ i ].cleanUp();
            this.multipliers[ i ] = null;
        }

        this.multipliers = null;

        this._value = null;
    }

    get value() {
        return this._value;
    }
    set value( value ) {
        for ( var i = this.multipliers.length - 1; i >= 0; --i ) {
            this.multipliers[ i ].disconnect();
            this.multipliers.splice( i, 1 );
        }

        this.inputs[ 0 ].disconnect();

        for ( var i = 0, node = this.inputs[ 0 ]; i < value - 1; ++i ) {
            this.multipliers[ i ] = this.io.createMultiply();
            this.inputs[ 0 ].connect( this.multipliers[ i ].controls.value );
            node.connect( this.multipliers[ i ] );
            node = this.multipliers[ i ];
        }

        node.connect( this.outputs[ 0 ] );

        this._value = value;
    }
}

AudioIO.prototype.createPow = function( value ) {
    return new Pow( this, value );
};