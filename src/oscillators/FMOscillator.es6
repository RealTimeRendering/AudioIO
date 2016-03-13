import "../core/AudioIO.es6";
import OscillatorBank from "../oscillators/OscillatorBank.es6";

class FMOscillator extends OscillatorBank {

    constructor( io ) {
        super( io );

        var graph = this.getGraph( this );

        // FM/modulator oscillator setup
        graph.fmOscillator = this.io.createOscillatorBank();
        graph.fmOscAmount = this.context.createGain();
        graph.fmOscAmountMultiplier = this.io.createMultiply();
        graph.fmOscAmount.gain.value = 0;
        graph.fmOscillator.connect( graph.fmOscAmount );
        graph.fmOscAmount.connect( graph.fmOscAmountMultiplier, 0, 0 );

        this.controls.fmFrequency = this.io.createParam();
        this.controls.fmFrequency.connect( graph.fmOscillator.controls.frequency );
        this.controls.fmFrequency.connect( graph.fmOscAmountMultiplier, 0, 1 );

        this.controls.fmWaveform = this.io.createParam();
        this.controls.fmWaveform.connect( graph.fmOscillator.controls.waveform );

        this.controls.fmOscAmount = this.io.createParam();
        this.controls.fmOscAmount.connect( graph.fmOscAmount.gain );


        // Self-fm setup
        graph.fmSelfAmounts = [];
        graph.fmSelfAmountMultipliers = [];
        this.controls.fmSelfAmount = this.io.createParam();

        for( var i = 0; i < graph.oscillators.length; ++i ) {
        	// Connect FM oscillator to the existing oscillators
        	// frequency control.
        	graph.fmOscAmountMultiplier.connect( graph.oscillators[ i ].frequency );


        	// For each oscillator in the oscillator bank,
        	// create a FM-self GainNode, and connect the osc
        	// to it, then it to the osc's frequency.
        	graph.fmSelfAmounts[ i ] = this.context.createGain();
        	graph.fmSelfAmounts[ i ].gain.value = 0;

        	graph.fmSelfAmountMultipliers[ i ] = this.io.createMultiply();
        	graph.fmSelfAmounts[ i ].connect( graph.fmSelfAmountMultipliers[ i ], 0, 0 );
        	this.controls.frequency.connect( graph.fmSelfAmountMultipliers[ i ], 0, 1 );

        	graph.oscillators[ i ].connect( graph.fmSelfAmounts[ i ] );
        	graph.fmSelfAmountMultipliers[ i ].connect( graph.oscillators[ i ].frequency );

        	// Make sure the FM-self amount is controllable with one parameter.
        	this.controls.fmSelfAmount.connect( graph.fmSelfAmounts[ i ].gain );
        }

        this.setGraph( graph );
    }
}

AudioIO.prototype.createFMOscillator = function() {
    return new FMOscillator( this );
};