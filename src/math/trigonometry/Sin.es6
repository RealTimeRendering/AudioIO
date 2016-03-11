import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

// Sin approximation!
//
// Only works in range of -Math.PI to Math.PI.
class Sin extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, value ) {
        super( io, 0, 1 );

        var graph = this.getGraph();

        this.inputs[ 0 ] = this.controls.value = this.io.createParam( value );

        graph.square = this.io.createSquare();
        graph.multiply1 = this.io.createMultiply( -2.39e-8 );
        graph.multiply2 = this.io.createMultiply();
        graph.multiply3 = this.io.createMultiply();
        graph.multiply4 = this.io.createMultiply();
        graph.multiply5 = this.io.createMultiply();
        graph.multiply6 = this.io.createMultiply();

        graph.add1 = this.io.createAdd( 2.7526e-6 );
        graph.add2 = this.io.createAdd( -0.000198409 );
        graph.add3 = this.io.createAdd( 0.00833333 );
        graph.add4 = this.io.createAdd( -0.166667 );
        graph.add5 = this.io.createAdd( 1 );

        this.inputs[ 0 ].connect( graph.square );

        // Connect multiply1's inputs
        graph.square.connect( graph.multiply1, 0, 0 );

        // Connect add1's inputs
        graph.multiply1.connect( graph.add1, 0, 0 );

        // Connect up multiply2's inputs
        graph.square.connect( graph.multiply2, 0, 0 );
        graph.add1.connect( graph.multiply2, 0, 1 );

        // Connect up add2's inputs
        graph.multiply2.connect( graph.add2, 0, 0 );

        // Connect up multiply3's inputs
        graph.square.connect( graph.multiply3, 0, 0 );
        graph.add2.connect( graph.multiply3, 0, 1 );

        // Connect add3's inputs
        graph.multiply3.connect( graph.add3, 0, 0 );

        // Connect multiply4's inputs
        graph.square.connect( graph.multiply4, 0, 0 );
        graph.add3.connect( graph.multiply4, 0, 1 );

        // add4's inputs
        graph.multiply4.connect( graph.add4, 0, 0 );

        // multiply5's inputs
        graph.square.connect( graph.multiply5, 0, 0 );
        graph.add4.connect( graph.multiply5, 0, 1 );

        // add5's inputs
        graph.multiply5.connect( graph.add5, 0, 0 );

        // multiply6's inputs
        this.inputs[0].connect( graph.multiply6, 0, 0 );
        graph.add5.connect( graph.multiply6, 0, 1 );

        // Output (finally!!)
        graph.multiply6.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createSin = function( value ) {
    return new Sin( this, value );
};