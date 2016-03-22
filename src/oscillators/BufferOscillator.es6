import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";
import BufferGenerators from "../buffers/BufferGenerators.es6";
import BufferUtils from "../utilities/BufferUtils.es6";

// TODO:
// 	- Issue with playback rate not having a wide enough range
// 	  to support the full frequency range.
// 	  
// 	- Fix:
// 		- Create multiple buffer sources attached to a switch.
// 		- Number of sources: 
// 			Available range: 1024 
// 				* -512 to +512 is a fair balance between range and 
// 				artifacts on different browsers, Firefox having issues
// 				around the +800 mark, Chrome stops increasing 
// 				after around +1000. Safari is just broken: playbackRate 
// 				AudioParam cannot be driven by audio signal. Wat.
// 			Max freq: sampleRate * 0.5
// 			
// 			numSources: Math.ceil( maxFreq / availableRange )
// 				
// 			breakpoints: i * maxFreq
// 			initial value of playbackRate: -512.
// 			
// 		- For sampleRate of 48000:
// 			numSources: Math.ceil( (48000 * 0.5) / 1024 ) = 24.
// 			
// 			
//  - Major downside: many, many bufferSources will be created
//    each time `start()` is called. 
// 			
//
class BufferOscillator extends Node {
	constructor( io, generator ) {
		super( io, 0, 1 );

		this.generator = generator;
		this.controls.frequency = this.io.createParam();
		this.controls.detune = this.io.createParam();

		this.reset();
	}

	start( when, phase ) {
		var buffer = BufferUtils.generateBuffer(
				this.io,
				1,
				this.context.sampleRate,
				this.context.sampleRate,
				this.generator
			),
			bufferSource;

		this.reset();

		bufferSource = this.getGraph().bufferSource;
		bufferSource.buffer = buffer;
		bufferSource.start( when, phase );
		console.log( bufferSource );
	}

	stop( when ) {
		var graph = this.getGraph(),
			bufferSource = graph.bufferSource,
			self = this;

		bufferSource.stop( when );
	}

	reset() {
		var graph = this.getGraph();

		graph.bufferSource = this.context.createBufferSource();
		graph.bufferSource.loop = true;
		graph.bufferSource.playbackRate.value = 0;
		graph.bufferSource.connect( this.outputs[ 0 ] );

		this.controls.frequency.connect( graph.bufferSource.playbackRate );

		if ( graph.bufferSource.detune instanceof AudioParam ) {
			this.controls.detune.connect( graph.bufferSource.detune );
		}

		this.setGraph( graph );
	}
}

AudioIO.prototype.createBufferOscillator = function( generator ) {
	return new BufferOscillator( this, generator );
};