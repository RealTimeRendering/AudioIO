import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

// Tangent approximation!
//
// Only works in range of -Math.PI to Math.PI.
//
// sin( input ) / cos( input )
class Tan extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, value ) {
        super( io, 0, 1 );

        var graph = this.getGraph();

        this.inputs[ 0 ] = this.controls.value = this.io.createParam( value );

        graph.sine = this.io.createSin();
        graph.cos = this.io.createCos();
        graph.divide = this.io.createDivide( undefined, Math.PI * 2 );

        this.inputs[ 0 ].connect( graph.sine );
        this.inputs[ 0 ].connect( graph.cos );
        graph.sine.connect( graph.divide, 0, 0 );
        graph.cos.connect( graph.divide, 0, 1 );

        graph.divide.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }

    get value() {
        return this.controls.value.value;
    }

    set value( value ) {
        this.controls.value.value = value;
    }
}

AudioIO.prototype.createTan = function( value ) {
    return new Tan( this, value );
};