import "../core/AudioIO.es6";
import Node from "../core/Node.es6";


// NOTE:
//  Only accepts values >= -1 && <= 1. Values outside
//  this range are clamped to this range.
class Floor extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.shaper = this.io.createWaveShaper( this.io.curves.Floor );

        // This branching is because inputting `0` values
        // into the waveshaper above outputs -0.5 ;(
        graph.ifElse = this.io.createIfElse();
        graph.equalToZero = this.io.createEqualToZero();

        this.inputs[ 0 ].connect( graph.equalToZero );
        graph.equalToZero.connect( graph.ifElse.if );
        this.inputs[ 0 ].connect( graph.ifElse.then );
        graph.shaper.connect( graph.ifElse.else );

        this.inputs[ 0 ].connect( graph.shaper );
        graph.ifElse.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createFloor = function() {
    return new Floor( this );
};