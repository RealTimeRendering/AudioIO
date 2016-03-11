import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

/**
 * When input is < `value`, outputs `value`, otherwise outputs input.
 * @param {AudioIO} io   AudioIO instance
 * @param {Number} value The minimum value to test against.
 */

class Max extends Node {
    constructor( io, value ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.greaterThan = this.io.createGreaterThan();
        graph.switch = this.io.createSwitch( 2, 0 );

        this.controls.value = this.inputs[ 1 ] = this.io.createParam( value );
        this.inputs[ 1 ].connect( graph.greaterThan );
        this.inputs[ 0 ].connect( graph.greaterThan.controls.value );


        this.inputs[ 0 ].connect( graph.switch.inputs[ 0 ] );
        this.inputs[ 1 ].connect( graph.switch.inputs[ 1 ] );
        graph.greaterThan.connect( graph.switch.control );
        graph.switch.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }

    get value() {
        return this.controls.value.value;
    }
    set value( value ) {
        this.controls.value.value = value;
    }
}

AudioIO.prototype.createMax = function( value ) {
    return new Max( this, value );
};