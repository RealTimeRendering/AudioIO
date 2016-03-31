import AudioIO from "../../core/AudioIO.es6";
import DryWetNode from "../../graphs/DryWetNode.es6";


class StereoDelay extends DryWetNode {
    constructor( io, maxDelayTime = 1 ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.splitter = this.context.createChannelSplitter( 2 );
        graph.delayL = this.context.createDelay( maxDelayTime );
        graph.delayR = this.context.createDelay( maxDelayTime );
        graph.feedbackL = this.context.createGain();
        graph.feedbackR = this.context.createGain();
        graph.merger = this.context.createChannelMerger( 2 );

        graph.delayL.delayTime.value = 0;
        graph.delayR.delayTime.value = 0;
        graph.feedbackL.gain.value = 0;
        graph.feedbackR.gain.value = 0;

        graph.delayL.connect( graph.feedbackL );
        graph.feedbackL.connect( graph.delayL );
        graph.delayR.connect( graph.feedbackR );
        graph.feedbackR.connect( graph.delayR );

        this.inputs[ 0 ].connect( graph.splitter );
        graph.splitter.connect( graph.delayL, 0 );
        graph.splitter.connect( graph.delayR, 1 );
        graph.delayL.connect( graph.merger, 0, 1 );
        graph.delayR.connect( graph.merger, 0, 0 );
        graph.merger.connect( this.wet );

        this.setGraph( graph );
        this.addControls( StereoDelay.controlsMap, maxDelayTime );
    }
}

StereoDelay.controlsMap = {
    delayTimeL: {
        targets: 'graph.delayL.delayTime',
        min: 0,
        max: function( io, context, constructorArguments ) {
            return constructorArguments[ 0 ];
        }
    },

    delayTimeR: {
        targets: 'graph.delayR.delayTime',
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

AudioIO.prototype.createStereoDelay = function() {
    return new StereoDelay( this );
};

export default StereoDelay;