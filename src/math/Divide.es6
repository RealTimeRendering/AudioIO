import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

/**
 * Divides two numbers
 * @param {Object} io Instance of AudioIO.
 */
class Divide extends Node {
    constructor( io, value, maxInput ) {
        super( io, 1, 1 );

        var graph = this.getGraph();


        this.inputs[ 1 ] = this.io.createParam( value );
        this.outputs[ 0 ].gain.value = 0.0;

        graph.reciprocal = this.io.createReciprocal( maxInput );
        this.inputs[ 1 ].connect( graph.reciprocal );

        this.inputs[ 0 ].connect( this.outputs[ 0 ] );
        graph.reciprocal.connect( this.outputs[ 0 ].gain );

        this.controls.divisor = this.inputs[ 1 ];

        this.setGraph( graph );
    }

    get value() {
        return this.inputs[ 1 ].value;
    }
    set value( value ) {
        this.inputs[ 1 ].value = value;
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