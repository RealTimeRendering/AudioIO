import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";


class Square extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.multiply = this.io.createMultiply();
        this.inputs[ 0 ].connect( graph.multiply, 0, 0 );
        this.inputs[ 0 ].connect( graph.multiply, 0, 1 );
        graph.multiply.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createSquare = function() {
    return new Square( this );
};