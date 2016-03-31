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

        graph.frequencyControlProxy = this.context.createGain();
        graph.detuneControlProxy = this.context.createGain();

        for( var i = 0; i < OSCILLATOR_TYPES.length; ++i ) {
            var osc = this.context.createOscillator();

            osc.type = OSCILLATOR_TYPES[ i ];
            osc.frequency.value = 0;
            osc.start( 0 );

            graph.frequencyControlProxy.connect( osc.frequency );
            graph.detuneControlProxy.connect( osc.detune );
            osc.connect( graph.crossfader, 0, i );

            graph.oscillators.push( osc );
        }

        graph.outputLevel = this.context.createGain();
        graph.outputLevel.gain.value = 0;

        graph.crossfader.connect( graph.outputLevel );
        graph.outputLevel.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
        this.addControls( OscillatorBank.controlsMap );
    }

    start( delay = 0 ) {
        this.getGraph().outputLevel.gain.value = 1;
    }

    stop( delay = 0 ) {
        this.getGraph().outputLevel.gain.value = 0;
    }
}

OscillatorBank.controlsMap = {
    frequency: {
        targets: 'graph.frequencyControlProxy',
        min: 0,
        max: function( io, context ) {
            return context.sampleRate * 0.5;
        },
        exponent: 2,
        value: 440
    },

    detune: {
        targets: 'graph.detuneControlProxy',
        min: -100,
        max: 100,
        value: 0
    },

    waveform: {
        delegate: 'graph.crossfader.controls.index',
        min: 0,
        max: OSCILLATOR_TYPES.length - 1,
        value: 0
    },
};


AudioIO.prototype.createOscillatorBank = function() {
    return new OscillatorBank( this );
};

export default OscillatorBank;