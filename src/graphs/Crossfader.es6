import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";


// This node creates a graph that allows morphing
// between two waveforms.
//
// It looks a little bit like this:
//
//                 input1 -> ---------------------------------------------> |
//                            |                                             v
//                            v  Gain(0-1)    ->     Gain(-1)     ->     output
//                                (fader)         (invert phase)        (summing)
//                            ^
// input2 ->   Gain(-1)   -> -|
//          (invert phase)
//
// When adjusting the control's gain value in this graph,
// input1's gain level will change from 0 to 1,
// whilst input2's gain level will change from 1 to 0.

// NOT TESTED
// NOT TESTED
// NOT TESTED
// NOT TESTED
class Crossfader extends Node {
	constructor( io, curve ) {
		super( io, 2, 1 );

		// Ensure there's a curve to work with.
		curve = curve || this.io.curves.EqualPower;

		// Create nodes and set values.
		this.input1Shaper = this.io.createWaveShaper( curve );
		this.input2Shaper = this.io.createWaveShaper( curve );

		this.fader = this.context.createGain();
		this.fader.gain.value = 0.0;

		this.invertInput2Node = this.context.createGain();
		this.invertInput2Node.gain.value = -1.0;
		this.invertMain = this.context.createGain();
		this.invertMain.gain.value = -1.0;


		// Connect inputs to waveshapers
		this.inputs[ 0 ].connect( this.input1Shaper );
		this.inputs[ 1 ].connect( this.input2Shaper );

		// Connect first waveshaper to fader control, as well as direct to output.
		this.input1Shaper.connect( this.fader );
		this.input1Shaper.connect( this.outputs[ 0 ] );

		// Connect second waveshaper to inversion node and 2nd input's
		// inversion node to the fader control.
		this.input2Shaper.connect( this.invertInput2Node );
		this.invertInput2Node.connect( this.fader );

		/// Connect fader control to main inversion node
		/// and main inversion to output.
		this.fader.connect( this.invertMain );
		this.invertMain.connect( this.outputs[ 0 ] );

		// The control element for this node is the `gain` AudioParam
		// of the fader.
		this.control = this.fader.gain;
	}
}

AudioIO.prototype.createCrossfader = function( curve ) {
	return new Crossfader( this, curve );
};