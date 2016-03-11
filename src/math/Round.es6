import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

// NOTE:
//  Only accepts values >= -1 && <= 1. Values outside
//  this range are clamped to this range.
class Round extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.floor = this.io.createFloor();
        graph.add = this.io.createAdd( 0.5 );
        this.inputs[0].connect( graph.add );
        graph.add.connect( graph.floor );
        graph.floor.connect( this.outputs[0] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createRound = function() {
    return new Round( this );
};