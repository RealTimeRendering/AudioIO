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

        var graph = this.getGraph();

        graph.lessThan = this.io.createLessThan();
        this.controls.value = this.inputs[ 1 ] = this.io.createParam( value );
        this.inputs[ 1 ].connect( graph.lessThan );
        this.inputs[ 0 ].connect( graph.lessThan.controls.value );

        graph.switch = this.io.createSwitch( 2, 0 );

        this.inputs[ 0 ].connect( graph.switch.inputs[ 0 ] );
        this.inputs[ 1 ].connect( graph.switch.inputs[ 1 ] );
        graph.lessThan.connect( graph.switch.control );
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

AudioIO.prototype.createMin = function( value ) {
    return new Min( this, value );
};