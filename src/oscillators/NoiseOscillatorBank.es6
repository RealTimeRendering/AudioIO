import "../core/AudioIO.es6";
import Node from "../core/Node.es6";
import BufferUtils from "../buffers/BufferUtils.es6";
import BufferGenerators from "../buffers/BufferGenerators.es6";


var BUFFERS = new WeakMap();

class NoiseOscillatorBank extends Node {
    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io, 0, 1 );

        var graph = this.getGraph( this ),
            types = this.constructor.types,
            typeKeys = Object.keys( types );

        graph.bufferSources = [];
        graph.outputGain = this.context.createGain();
        graph.crossfader = this.io.createCrossfader( Object.keys( types ).length, 0 );
        graph.outputGain.gain.value = 0;

        for ( var i = 0; i < typeKeys.length; ++i ) {
            var source = this.context.createBufferSource();

            console.log( BufferGenerators[ this.constructor.generatorKeys[ i ] ] );

            source.buffer = BufferUtils.generateBuffer(
                this.io, // context
                1, // channels
                this.context.sampleRate * 5, // length (5 seconds)
                this.context.sampleRate, // SampleRate
                BufferGenerators[ this.constructor.generatorKeys[ i ] ] // Generator function
            );

            source.loop = true;
            source.start( 0 );

            source.connect( graph.crossfader, 0, i );
            graph.bufferSources.push( source );
        }

        graph.crossfader.connect( graph.outputGain );
        graph.outputGain.connect( this.outputs[ 0 ] );

        this.controls.type = graph.crossfader.controls.index;
        this.setGraph( graph );
    }

    start( time ) {
        var outputGain = this.getGraph( this ).outputGain;

        time = time || this.context.currentTime;
        outputGain.gain.value = 1;
    }

    stop( time ) {
        var outputGain = this.getGraph( this ).outputGain;

        time = time || this.context.currentTime;
        outputGain.gain.value = 0;
    }
}


NoiseOscillatorBank.types = {
    WHITE: 0,
    GAUSSIAN_WHITE: 1,
    PINK: 2
};

NoiseOscillatorBank.generatorKeys = [
    'WhiteNoise',
    'GaussianNoise',
    'PinkNoise'
];


AudioIO.prototype.createNoiseOscillatorBank = function() {
    return new NoiseOscillatorBank( this );
};