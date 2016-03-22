import AudioIO from "../../core/AudioIO.es6";
import DryWetNode from "../../graphs/DryWetNode.es6";


class StereoDelay extends DryWetNode {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        // Create the control nodes.
        this.controls.feedback = this.io.createParam();
        this.controls.timeL = this.io.createParam();
        this.controls.timeR = this.io.createParam();

        graph.splitter = this.io.createSplitter( 2 );
        graph.delayL = this.context.createDelay();
        graph.delayR = this.context.createDelay();
        graph.feedbackL = this.context.createGain();
        graph.feedbackR = this.context.createGain();
        graph.merger = this.io.createMerger( 2 );

        graph.delayL.delayTime.value = 0;
        graph.delayR.delayTime.value = 0;
        graph.feedbackL.gain.value = 0;
        graph.feedbackR.gain.value = 0;

        graph.delayL.connect( graph.feedbackL );
        graph.feedbackL.connect( graph.delayL );
        graph.delayR.connect( graph.feedbackR );
        graph.feedbackR.connect( graph.delayR );

        this.controls.feedback.connect( graph.feedbackL.gain );
        this.controls.feedback.connect( graph.feedbackR.gain );
        this.controls.timeL.connect( graph.delayL.delayTime );
        this.controls.timeR.connect( graph.delayR.delayTime );

        this.inputs[ 0 ].connect( graph.splitter );
        graph.splitter.connect( graph.delayL, 0 );
        graph.splitter.connect( graph.delayR, 1 );
        graph.delayL.connect( graph.merger, 0, 0 );
        graph.delayR.connect( graph.merger, 0, 1 );
        graph.merger.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createStereoDelay = function() {
    return new StereoDelay( this );
};

export default StereoDelay;