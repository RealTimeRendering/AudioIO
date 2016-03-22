import AudioIO from "../../core/AudioIO.es6";
import DryWetNode from "../../graphs/DryWetNode.es6";

// TODO: Add feedbackLevel and delayTime Param instances
// to control this node.
class Delay extends DryWetNode {
    constructor( io, time = 0, feedbackLevel = 0 ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        // Create the control nodes.
        this.controls.feedback = this.io.createParam( feedbackLevel );
        this.controls.time = this.io.createParam( time );

        // Create feedback and delay nodes
        graph.feedback = this.context.createGain();
        graph.delay = this.context.createDelay();

        // Setup the feedback loop
        graph.delay.connect( graph.feedback );
        graph.feedback.connect( graph.delay );

        // Also connect the delay to the wet output.
        graph.delay.connect( this.wet );

        // Connect input to delay
        this.inputs[ 0 ].connect( graph.delay );

        graph.delay.delayTime.value = 0;
        graph.feedback.gain.value = 0;

        this.controls.time.connect( graph.delay.delayTime );
        this.controls.feedback.connect( graph.feedback.gain );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createDelay = function( time, feedbackLevel ) {
    return new Delay( this, time, feedbackLevel );
};

export default Delay;