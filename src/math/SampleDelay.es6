import "../core/AudioIO.es6";
import Node from "../core/Node.es6";


class SampleDelay extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, numSamples = 1 ) {
        super( io, 1, 1 );

        this.sampleSize = this.io.createConstant( 1 / this.context.sampleRate );
        this.multiply = this.io.createMultiply();
        this.controls.samples = this.io.createParam( numSamples );

        this.sampleSize.connect( this.multiply, 0, 0 );
        this.controls.samples.connect( this.multiply, 0, 1 );

        this.delay = this.context.createDelay();
        this.delay.delayTime.value = 0;
        this.multiply.connect( this.delay.delayTime );
        this.inputs[ 0 ].connect( this.delay );
        this.delay.connect( this.outputs[ 0 ] );
    }

    cleanUp() {
        super();
        this.delay.cleanUp();
        this.delay = null;
    }
}

AudioIO.prototype.createSampleDelay = function( numSamples ) {
    return new SampleDelay( this, numSamples );
};