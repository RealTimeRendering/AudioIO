import AudioIO from "../../core/AudioIO.es6";
import DryWetNode from "../../graphs/DryWetNode.es6";

// TODO:
//  - Convert this node to use Param controls
//    for time and feedback.

class PingPongDelay extends DryWetNode {
    constructor( io, maxDelayTime = 1 ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        // Create channel splitter and merger
        graph.splitter = this.context.createChannelSplitter( 2 );
        graph.merger = this.context.createChannelMerger( 2 );

        // Create feedback and delay nodes
        graph.feedbackL = this.context.createGain();
        graph.feedbackR = this.context.createGain();
        graph.delayL = this.context.createDelay( maxDelayTime );
        graph.delayR = this.context.createDelay( maxDelayTime );

        // Setup the feedback loop
        graph.delayL.connect( graph.feedbackL );
        graph.feedbackL.connect( graph.delayR );
        graph.delayR.connect( graph.feedbackR );
        graph.feedbackR.connect( graph.delayL );


        this.inputs[ 0 ].connect( graph.splitter );
        graph.splitter.connect( graph.delayL, 0 );
        graph.feedbackL.connect( graph.merger, 0, 0 );
        graph.feedbackR.connect( graph.merger, 0, 1 );
        graph.merger.connect( this.wet );

        graph.delayL.delayTime.value = 0;
        graph.delayR.delayTime.value = 0;
        graph.feedbackL.gain.value = 0;
        graph.feedbackR.gain.value = 0;

        this.setGraph( graph );
        this.addControls( PingPongDelay.controlsMap, maxDelayTime );
    }
}

PingPongDelay.controlsMap = {
    delayTime: {
        targets: [ 'graph.delayL.delayTime', 'graph.delayR.delayTime' ],
        min: 0,
        max: function( io, context, constructorArguments ) {
            return constructorArguments[ 0 ];
        }
    },

    feedback: {
        targets: [ 'graph.feedbackL.gain', 'graph.feedbackR.gain' ],
        min: 0,
        max: 1
    }
};

AudioIO.prototype.createPingPongDelay = function( maxDelayTime ) {
    return new PingPongDelay( this, maxDelayTime );
};