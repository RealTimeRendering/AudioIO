import "../core/AudioIO.es6";
import Node from "../core/Node.es6";


class SampleDelay extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, numSamples ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.sampleSize = this.io.createConstant( 1 / this.context.sampleRate );
        graph.multiply = this.io.createMultiply();
        this.controls.samples = this.io.createParam( numSamples );

        graph.sampleSize.connect( graph.multiply, 0, 0 );
        this.controls.samples.connect( graph.multiply, 0, 1 );

        graph.delay = this.context.createDelay();
        graph.delay.delayTime.value = 0;
        graph.multiply.connect( graph.delay.delayTime );
        this.inputs[ 0 ].connect( graph.delay );
        graph.delay.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }

    get samples() {
        return this.controls.samples.value;
    }
    set samples( value ) {
        this.controls.samples.value = value;
    }
}

AudioIO.prototype.createSampleDelay = function( numSamples ) {
    return new SampleDelay( this, numSamples );
};