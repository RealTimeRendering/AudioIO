import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";


// Based on the following formula from Michael Gruhn:
//  - http://musicdsp.org/showArchiveComment.php?ArchiveID=255
//
// ------------------------------------------------------------
//
// Calculate transformation matrix's coefficients
// cos_coef = cos(angle);
// sin_coef = sin(angle);

// Do this per sample
// out_left = in_left * cos_coef - in_right * sin_coef;
// out_right = in_left * sin_coef + in_right * cos_coef;
class StereoRotation extends Node {
    constructor( io, rotation ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        this.controls.rotation = this.io.createParam( rotation );

        graph.splitter = this.context.createChannelSplitter( 2 );
        graph.cos = this.io.createCos();
        graph.sin = this.io.createSin();

        this.controls.rotation.connect( graph.cos );
        this.controls.rotation.connect( graph.sin );

        graph.leftMultiplyCos = this.io.createMultiply();
        graph.leftMultiplySin = this.io.createMultiply();
        graph.rightMultiplyCos = this.io.createMultiply();
        graph.rightMultiplySin = this.io.createMultiply();
        graph.leftCosMinusRightSin = this.io.createSubtract();
        graph.leftSinAddRightCos = this.io.createAdd();



        graph.inputLeft = this.context.createGain();
        graph.inputRight = this.context.createGain();
        graph.merger = this.context.createChannelMerger( 2 );

        graph.splitter.connect( graph.inputLeft, 0 );
        graph.splitter.connect( graph.inputRight, 1 );

        graph.inputLeft.connect( graph.leftMultiplyCos, 0, 0 );
        graph.cos.connect( graph.leftMultiplyCos, 0, 1 );
        graph.inputLeft.connect( graph.leftMultiplySin, 0, 0 );
        graph.sin.connect( graph.leftMultiplySin, 0, 1);

        graph.inputRight.connect( graph.rightMultiplySin, 0, 0 );
        graph.sin.connect( graph.rightMultiplySin, 0, 1 );
        graph.inputRight.connect( graph.rightMultiplyCos, 0, 0 );
        graph.cos.connect( graph.rightMultiplyCos, 0, 1 );

        graph.leftMultiplyCos.connect( graph.leftCosMinusRightSin, 0, 0 );
        graph.rightMultiplySin.connect( graph.leftCosMinusRightSin, 0, 1 );
        graph.leftMultiplySin.connect( graph.leftSinAddRightCos, 0, 0 );
        graph.rightMultiplyCos.connect( graph.leftSinAddRightCos, 0, 1 );

        graph.leftCosMinusRightSin.connect( graph.merger, 0, 0 );
        graph.leftSinAddRightCos.connect( graph.merger, 0, 1 );


        this.inputs[ 0 ].connect( graph.splitter );
        graph.merger.connect( this.outputs[ 0 ] );

        this.namedInputs.left = graph.inputLeft;
        this.namedInputs.right = graph.inputRight;

        this.setGraph( graph );
    }
}

AudioIO.prototype.createStereoRotation = function( rotation ) {
    return new StereoRotation( this, rotation );
};