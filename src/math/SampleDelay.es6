import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

/*
    Also known as z-1, this node delays the input by
    one sample.
 */
class SampleDelay extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.delay = this.context.createDelay();
        graph.delay.delayTime.value = 1 / this.context.sampleRate;

        this.inputs[ 0 ].connect( graph.delay );
        graph.delay.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

// The factory for SampleDelay has an alias to it's more common name!
AudioIO.prototype.createSampleDelay = AudioIO.prototype.createZMinusOne = function() {
    return new SampleDelay( this );
};