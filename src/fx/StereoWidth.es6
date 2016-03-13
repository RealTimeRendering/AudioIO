import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";


// Based on the following formula from Michael Gruhn:
//  - http://musicdsp.org/showArchiveComment.php?ArchiveID=256
//
// ------------------------------------------------------------
//
// The graph that's created is as follows:
//
//                   |-> L -> leftAddRight( 0 ) -> |
//                   |-> R -> leftAddRight( 1 ) -> | -> multiply( 0.5 ) ------> monoMinusStereo( 0 ) -> merger( 0 ) // outL
// input -> splitter -                                                  |-----> monoPlusStereo( 0 ) --> merger( 1 ) // outR
//                   |-> L -> rightMinusLeft( 1 ) -> |
//                   |-> R -> rightMinusLeft( 0 ) -> | -> multiply( coef ) ---> monoMinusStereo( 1 ) -> merger( 0 ) // outL
//


// TODO:
//  - Convert this to the new ES6 format.
//
class StereoWidth Node {
    constructor( io, width ) {
        super( io );

        var graph = this.getGraph();

        graph.splitter = this.context.createChannelSplitter( 2 );
        graph.coefficient = this.io.createParam( width );
        graph.coefficientHalf = this.context.createGain();
        // graph.inputLeft = this.context.createGain();
        // graph.inputRight = this.context.createGain();
        graph.leftAddRight = this.io.createAdd();
        graph.rightMinusLeft = this.io.createSubtract();
        graph.multiplyPointFive = this.io.createMultiply( 0.5 );
        graph.multiplyCoefficient = this.io.createMultiply();
        graph.monoMinusStereo = this.io.createSubtract();
        graph.monoPlusStereo = this.io.createAdd();
        graph.merger = this.context.createChannelMerger( 2 );

        graph.coefficient.connect( graph.coefficientHalf );
        graph.coefficientHalf.connect( graph.multiplyCoefficient.inputs[ 1 ] );
        graph.coefficientHalf.gain.value = 0.5;

        graph.splitter.connect( graph.leftAddRight, 0, 0 ); // L -> add0
        graph.splitter.connect( graph.leftAddRight, 1, 1 ); // R -> add1
        graph.splitter.connect( graph.rightMinusLeft, 0, 1 ); // L -> sub1
        graph.splitter.connect( graph.rightMinusLeft, 1, 0 ); // R -> sub0

        // graph.inputLeft.connect( graph.leftAddRight, 0, 0 );
        // graph.inputRight.connect( graph.leftAddRight, 0, 1 );
        // graph.inputLeft.connect( graph.rightMinusLeft, 0, 1 );
        // graph.inputRight.connect( graph.rightMinusLeft, 0, 0 );

        graph.leftAddRight.connect( graph.multiplyPointFive );
        graph.rightMinusLeft.connect( graph.multiplyCoefficient );

        graph.multiplyPointFive.connect( graph.monoMinusStereo, 0, 0 );
        graph.multiplyCoefficient.connect( graph.monoMinusStereo, 0, 1 );

        graph.multiplyPointFive.connect( graph.monoPlusStereo, 0, 0 );
        graph.multiplyCoefficient.connect( graph.monoPlusStereo, 0, 1 );

        graph.monoMinusStereo.connect( graph.merger, 0, 0 );
        graph.monoPlusStereo.connect( graph.merger, 0, 1 );

        this.inputs[ 0 ].connect( graph.splitter );
        graph.merger.connet( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createStereoWidth = function( width ) {
    return new StereoWidth( this, width );
};