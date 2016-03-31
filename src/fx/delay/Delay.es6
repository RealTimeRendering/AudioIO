import AudioIO from "../../core/AudioIO.es6";
import DryWetNode from "../../graphs/DryWetNode.es6";

// TODO: Add feedbackLevel and delayTime Param instances
// to control this node.
class Delay extends DryWetNode {
    constructor( io, maxDelayTime = 1 ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        // Create feedback and delay nodes
        graph.feedback = this.context.createGain();
        graph.delay = this.context.createDelay( maxDelayTime );

        // Connect input to delay
        this.inputs[ 0 ].connect( graph.delay );

        // Setup the feedback loop
        graph.delay.connect( graph.feedback );
        graph.feedback.connect( graph.delay );

        // Also connect the delay to the wet output.
        graph.delay.connect( this.wet );

        graph.delay.delayTime.value = 0;
        graph.feedback.gain.value = 0;

        this.setGraph( graph );
        this.addControls( Delay.controlsMap, maxDelayTime );
    }
}

Delay.controlsMap = {
    delayTime: {
        targets: 'graph.delay.delayTime',
        min: 0,
        max: function( io, context, constructorArguments ) {
            return constructorArguments[ 0 ];
        }
    },

    feedback: {
        targets: 'graph.feedback.gain',
        min: 0,
        max: 1
    }
};


AudioIO.prototype.createDelay = function( maxDelayTime ) {
    return new Delay( this, maxDelayTime  );
};

export default Delay;