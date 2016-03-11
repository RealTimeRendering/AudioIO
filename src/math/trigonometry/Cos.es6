import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

// Cosine approximation!
//
// Only works in range of -Math.PI to Math.PI.
class Cos extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, value ) {
        super( io, 0, 1 );

        var graph = this.getGraph();

        this.inputs[ 0 ] = this.io.createParam( value );

        graph.square = this.io.createSquare();
        graph.multiply1 = this.io.createMultiply( -2.605e-7 );
        graph.multiply2 = this.io.createMultiply();
        graph.multiply3 = this.io.createMultiply();
        graph.multiply4 = this.io.createMultiply();
        graph.multiply5 = this.io.createMultiply();

        graph.add1 = this.io.createAdd( 2.47609e-5 );
        graph.add2 = this.io.createAdd( -0.00138884 );
        graph.add3 = this.io.createAdd( 0.0416666 );
        graph.add4 = this.io.createAdd( -0.499923 );
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

        // Output (finally!!)
        graph.add5.connect( this.outputs[ 0 ] );

        // Store controllable params.
        this.controls.value = this.inputs[ 0 ];

        this.setGraph( graph );
    }
}

AudioIO.prototype.createCos = function( value ) {
    return new Cos( this, value );
};