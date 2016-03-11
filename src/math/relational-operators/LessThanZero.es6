import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class LessThanZero extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.booster = this.context.createGain();
        graph.booster.gain.value = -100000;
        this.inputs[ 0 ].connect( graph.booster );

        graph.shaper = this.io.createWaveShaper( this.io.curves.GreaterThanZero );

        graph.booster.connect( graph.shaper );
        graph.shaper.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createLessThanZero = function() {
    return new LessThanZero( this );
};