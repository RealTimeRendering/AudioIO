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

        this.frequency = this.io.createParam();
        this.switch = this.io.createSwitch( OSCILLATOR_TYPES.length );

        this.oscillators = [];

        for( var i = 0; i < OSCILLATOR_TYPES.length; ++i ) {
            var osc = this.context.createOscillator();
            osc.type = OSCILLATOR_TYPES[ i ];
            osc.frequency.value = 0;
            this.frequency.connect( osc.frequency );
            osc.start( 0 );
            osc.connect( this.switch, 0, i );
            this.oscillators.push( osc );
        }

        this.switch.connect( this.outputs[ 0 ] );

        // Store controllable params.
        this.controls.waveform = this.switch.control;
        this.controls.frequency = this.frequency;
    }

}

AudioIO.prototype.createOscillatorBank = function() {
    return new OscillatorBank( this );
};

export default OscillatorBank;