import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";

var OSCILLATOR_TYPES = [
    'sine',
    'triangle',
    'sawtooth',
    'square'
];

class OscillatorBank extends Node {
    constructor( io ) {
        super( io, 0, 1 );

        var graph = this.getGraph();

        graph.crossfader = this.io.createCrossfader( OSCILLATOR_TYPES.length, 0 );
        graph.oscillators = [];

        this.controls.frequency = this.io.createParam();
        this.controls.detune = this.io.createParam();
        this.controls.waveform = graph.crossfader.controls.index;

        for( var i = 0; i < OSCILLATOR_TYPES.length; ++i ) {
            var osc = this.context.createOscillator();

            osc.type = OSCILLATOR_TYPES[ i ];
            osc.frequency.value = 0;
            osc.start( 0 );

            this.controls.frequency.connect( osc.frequency );
            this.controls.detune.connect( osc.detune );
            osc.connect( graph.crossfader, 0, i );

            graph.oscillators.push( osc );
        }

        graph.outputLevel = this.context.createGain();
        graph.outputLevel.gain.value = 0;

        graph.crossfader.connect( graph.outputLevel );
        graph.outputLevel.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }

    start( delay = 0 ) {
        this.getGraph().outputLevel.gain.value = 1;
    }

    stop( delay = 0 ) {
        this.getGraph().outputLevel.gain.value = 0;
    }
}

AudioIO.prototype.createOscillatorBank = function() {
    return new OscillatorBank( this );
};

export default OscillatorBank;