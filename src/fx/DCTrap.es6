/*
	Graph for this node is shown in the following paper:

		Beat Frei - Digital Sound Generation (Appendix C: Miscellaneous – 1. DC Trap)
		ICST, Zurich Uni of Arts.

	Available here:
		https://courses.cs.washington.edu/courses/cse490s/11au/Readings/Digital_Sound_Generation_1.pdf



	Essentially, a DCTrap removes the DC offset or DC bias
	from the incoming signal, where a DC offset is elements
	of the signal that are at 0Hz.

	The graph is as follows:

		   |---<---<|   input
		   |		|	  |
		   -> z-1 -> -> negate -> -> out
		   |					 |
		   |<-------------- *a <-|


	The a, or alpha, value is calculated is as follows:
		`a = 2PIfg / fs`

	Where `fg` determines the 'speed' of the trap (the 'cutoff'),
	and `fs` is the sample rate. This can be expanded into the
	following to avoid a more expensive division (as the reciprocal
	of the sample rate can be calculated beforehand):
		`a = (2 * PI * fg) * (1 / fs)`


	Given an `fg` of 5, and sample rate of 48000, we get:
		`a = 2 * PI * 5 * (1 / 48000)`
		`a = 6.2831 * 5 * 2.08333e-05`
		`a = 31.4155 * 2.08333e-05`
		`a = 0.00065448853615`.
 */

import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class DCTrap extends Node {
    constructor( io, cutoff = 5 ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        // Create the cutoff, or `fg` constant.
        // There will rarely be a need to change this value from
        // either the given one, or it's default of 5,
        // so I'm not making this into a control.
        graph.cutoff = this.io.createConstant( cutoff );

        // Alpha calculation
        graph.PI2 = this.io.createConstantPI2();
        graph.cutoffMultiply = this.io.createMultiply();
        graph.alpha = this.io.createMultiply( 1 / this.context.sampleRate );
        graph.PI2.connect( graph.cutoffMultiply, 0, 0 );
        graph.cutoff.connect( graph.cutoffMultiply, 0, 1 );
        graph.cutoffMultiply.connect( graph.alpha, 0, 0 );

        // Main graph
        graph.negate = this.io.createNegate();
        graph.zMinusOne = this.io.createSampleDelay();
        graph.multiply = this.io.createMultiply();

        // Connect up main graph and alpha.
        this.inputs[ 0 ].connect( graph.negate );
        graph.negate.connect( graph.multiply, 0, 0 );
        graph.alpha.connect( graph.multiply, 0, 1 );
        graph.multiply.connect( graph.zMinusOne );
        graph.zMinusOne.connect( graph.zMinusOne );
        graph.zMinusOne.connect( graph.negate );
        graph.negate.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createDCTrap = function( cutoff ) {
    return new DCTrap( this, cutoff );
};