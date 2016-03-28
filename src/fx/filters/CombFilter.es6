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

        this.controls.frequency = this.io.createParam();
        this.controls.Q = this.io.createParam();
        this.controls.frequency.connect( graph.reciprocal );
        graph.reciprocal.connect( graph.delay.delayTime );
        this.controls.Q.connect( graph.feedback.gain );


        this.setGraph( graph );
    }
}

AudioIO.prototype.createCombFilter = function() {
    return new CombFilter( this );
};

export default CombFilter;