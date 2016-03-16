import AudioIO from "../core/AudioIO.es6";
import DryWetNode from "../graphs/DryWetNode.es6";

// TODO: Add feedbackLevel and delayTime Param instances
// to control this node.
class StereoDelay extends DryWetNode {
    constructor( io ) {
        super( io, 1, 1 );

        // Create the control nodes.
        this.controls.feedback = this.io.createParam();
        this.controls.timeL = this.io.createParam();
        this.controls.timeR = this.io.createParam();

        this.splitter = this.io.createSplitter( 2 );
        this.delayL = this.context.createDelay();
        this.delayR = this.context.createDelay();
        this.feedbackL = this.context.createGain();
        this.feedbackR = this.context.createGain();
        this.merger = this.io.createMerger( 2 );

        this.delayL.delayTime.value = 0;
        this.delayR.delayTime.value = 0;
        this.feedbackL.gain.value = 0;
        this.feedbackR.gain.value = 0;

        this.delayL.connect( this.feedbackL );
        this.feedbackL.connect( this.delayL );
        this.delayR.connect( this.feedbackR );
        this.feedbackR.connect( this.delayR );

        this.controls.feedback.connect( this.feedbackL.gain );
        this.controls.feedback.connect( this.feedbackR.gain );
        this.controls.timeL.connect( this.delayL.delayTime );
        this.controls.timeR.connect( this.delayR.delayTime );

        this.inputs[ 0 ].connect( this.splitter );
        this.splitter.connect( this.delayL, 0 );
        this.splitter.connect( this.delayR, 1 );
        this.delayL.connect( this.merger, 0, 0 );
        this.delayR.connect( this.merger, 0, 1 );
        this.merger.connect( this.outputs[ 0 ] );
    }


}

AudioIO.prototype.createStereoDelay = function() {
    return new StereoDelay( this );
};

export default StereoDelay;