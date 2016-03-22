import AudioIO from "../../core/AudioIO.es6";
import DryWetNode from "../../graphs/DryWetNode.es6";

// TODO: Add feedbackLevel and delayTime Param instances
// to control this node.
class Delay extends DryWetNode {
    constructor( io, time = 0, feedbackLevel = 0 ) {
        super( io, 1, 1 );

        // Create the control nodes.
        this.controls.feedback = this.io.createParam( feedbackLevel );
        this.controls.time = this.io.createParam( time );

        // Create feedback and delay nodes
        this.feedback = this.context.createGain();
        this.delay = this.context.createDelay();

        // Setup the feedback loop
        this.delay.connect( this.feedback );
        this.feedback.connect( this.delay );

        // Also connect the delay to the wet output.
        this.delay.connect( this.wet );

        // Connect input to delay
        this.inputs[ 0 ].connect( this.delay );

        this.delay.delayTime.value = 0;
        this.feedback.gain.value = 0;

        this.controls.time.connect( this.delay.delayTime );
        this.controls.feedback.connect( this.feedback.gain );
    }
}

AudioIO.prototype.createDelay = function( time, feedbackLevel ) {
    return new Delay( this, time, feedbackLevel );
};

export default Delay;