import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class GreaterThanZero extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        this.inputs[ 0 ].gain.value = 100000;
        graph.shaper = this.io.createWaveShaper( this.io.curves.GreaterThanZero );
        this.inputs[ 0 ].connect( graph.shaper );
        graph.shaper.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createGreaterThanZero = function() {
    return new GreaterThanZero( this );
};