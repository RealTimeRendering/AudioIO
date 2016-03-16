import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

// TODO:
//  - this!
class BitReduction extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();


        // 			  input -> delay -> delayMultiplier -> out
        // 					|--> NOT -> delayMultiplier.gain
        // counter -> equalToZero -> inputMultiplier.gain
        // 					input -> inputMultiplier -> out

        this.controls.bitDepth = this.io.createParam();

        graph.counter = this.io.createCounter( 1, 1 );

        graph.equalToZero = this.io.createEqualToZero();
        graph.counter.connect( graph.equalToZero );
        graph.equalToZero.connect( this.outputs[ 0 ] );


        graph.delay = this.context.createDelay();
        graph.delay.delayTime.value = (1 / this.context.sampleRate);

        graph.delayMultiplier = this.context.createGain();
        graph.delayMultiplier.gain.value = 0;

        graph.not = this.io.createNOT();
        graph.not.connect( graph.delayMultiplier.gain );
        this.inputs[ 0 ].connect( graph.delay );
        graph.delay.connect( this.outputs[ 0 ] );


        graph.inputMultiplier = this.context.createGain();
        graph.inputMultiplier.gain.value = 0;
        graph.equalToZero.connect( graph.inputMultiplier.gain );
        this.inputs[ 0 ].connect( graph.inputMultiplier );
        graph.inputMultiplier.connect( this.outputs[ 0 ] );

       	graph.counter.start();

        this.setGraph( graph );
    }
}

AudioIO.prototype.createBitReduction = function( deg ) {
    return new BitReduction( this, deg );
};