import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

/**
 * When input is > `value`, outputs `value`, otherwise outputs input.
 * @param {AudioIO} io   AudioIO instance
 * @param {Number} value The minimum value to test against.
 */
class Min extends Node {
    constructor( io, value ) {
        super( io, 1, 1 );


        this.lessThan = this.io.createLessThan();
        this.controls.value = this.inputs[ 1 ] = this.io.createParam( value );
        this.inputs[ 1 ].connect( this.lessThan );
        this.inputs[ 0 ].connect( this.lessThan.controls.value );

        this.switch = this.io.createSwitch( 2, 0 );

        this.inputs[ 0 ].connect( this.switch.inputs[ 0 ] );
        this.inputs[ 1 ].connect( this.switch.inputs[ 1 ] );
        this.lessThan.connect( this.switch.control );
        this.switch.connect( this.outputs[ 0 ] );
    }


    cleanUp() {
        super();

        this.controls.value.cleanUp();
        this.lessThan.cleanUp();
        this.switch.cleanUp();

        this.controls.value = null;
        this.lessThan = null;
        this.switch = null;
    }

    get value() {
        return this.controls.value.value;
    }
    set value( value ) {
        this.controls.value.value = value;
    }

}

AudioIO.prototype.createMin = function( value ) {
    return new Min( this, value );
};