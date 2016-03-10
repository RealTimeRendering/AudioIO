import "../core/AudioIO.es6";
import Node from "../core/Node.es6";


class Average extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, numSamples, sampleSize = 1 ) {
        super( io, 1, 1 );

        var oneSample = (1 / this.context.sampleRate) * sampleSize,
            node = this.inputs[ 0 ];

        this.sampleSize = this.io.createConstant( 1 / this.context.sampleRate );
        this.multiply = this.io.createMultiply();
        this.controls.sampleSize = this.io.createParam();
        this.sampleSize.connect( this.multiply, 0, 0 );
        this.controls.sampleSize.connect( this.multiply, 0, 1 );

        this.divide = this.io.createDivide( numSamples, this.context.sampleRate * 0.5 );

        this.sum = this.context.createGain();
        // this.sum.gain.value = 1 / numSamples;

        for( var i = 0; i < numSamples; ++i ) {
            var delay = this.context.createDelay();
            delay.delayTime.value = 0;
            this.multiply.connect( delay.delayTime );
            node.connect( delay );
            delay.connect( this.sum );
            node = delay;
        }

        // this.inputs[ 0 ].connect( this.outputs[ 0 ] );
        this.sum.connect( this.divide );
        this.divide.connect( this.outputs[ 0 ] );


        // var oneSample = (1 / this.context.sampleRate);

        // this.delay = this.context.createDelay();
        // this.delay.delayTime.value = oneSample;
        // this.sum = this.context.createGain();
        // this.decay = this.context.createGain();
        // this.decay.gain.value = sampleSize;
        // this.divide = this.io.createDivide( numSamples, this.context.sampleRate * 0.5 );


        // this.inputs[ 0 ].connect( this.delay );
        // this.delay.connect( this.sum );
        // this.sum.connect( this.divide );
        // this.sum.connect( this.decay );
        // this.decay.connect( this.delay );
        // this.divide.connect( this.outputs[ 0 ] );
    }

    cleanUp() {
        super();
        this.shaper.cleanUp();
        this.shaper = null;
    }
}

AudioIO.prototype.createAverage = function( numSamples, sampleSize ) {
    return new Average( this, numSamples, sampleSize );
};