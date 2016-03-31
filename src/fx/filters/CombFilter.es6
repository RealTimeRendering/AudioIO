import AudioIO from "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

// Frequency of a comb filter is calculated as follows:
//  delayTime = (1 / freq)
//
// E.g:
//  - For 200hz frequency
//      delayTime = (1 / 200) = 0.005s
//
// This is currently a feedback comb filter.
class CombFilter extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.delay = this.context.createDelay();
        graph.feedback = this.context.createGain();
        graph.reciprocal = this.io.createReciprocal( this.context.sampleRate * 0.5 );

        graph.delay.delayTime.value = 0;
        graph.feedback.gain.value = 0;

        this.inputs[ 0 ].connect( graph.delay );
        graph.delay.connect( graph.feedback );
        graph.feedback.connect( graph.delay );
        graph.delay.connect( this.outputs[ 0 ] );

        graph.reciprocal.connect( graph.delay.delayTime );

        this.setGraph( graph );
        this.addControls( CombFilter.controlsMap );
    }
}

// There are two controls for the delayTime AudioParam here:
//
//  - `frequency`: allows the CombFilter to resonate at the
//                 given frequency value.
//  - `delayTime`: allows for direct control of the delayTime
//                 AudioParam.
//
// Best to use only one of these at a time!
CombFilter.controlsMap = {
    frequency: {
        targets: 'graph.reciprocal',
        min: 0,
        max: 'sampleRate',
        exponent: 2
    },

    delayTime: {
        targets: 'graph.delay.delayTime',
        min: 0,
        max: function( io, context ) {
            return 1 / context.sampleRate;
        }
    },

    Q: {
        targets: 'graph.feedback.gain',
        min: 0,
        max: 0.99
    }
};

AudioIO.prototype.createCombFilter = function() {
    return new CombFilter( this );
};

export default CombFilter;