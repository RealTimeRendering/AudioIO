import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class Sign extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.shaper = this.io.createWaveShaper( this.io.curves.Sign );

        graph.ifElse = this.io.createIfElse();
        graph.equalToZero = this.io.createEqualToZero();

        this.inputs[ 0 ].connect( graph.equalToZero );
        this.inputs[ 0 ].connect( graph.ifElse.then );
        this.inputs[ 0 ].connect( graph.shaper );

        graph.equalToZero.connect( graph.ifElse.if );
        graph.shaper.connect( graph.ifElse.else );
        graph.ifElse.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createSign = function() {
    return new Sign( this );
};
