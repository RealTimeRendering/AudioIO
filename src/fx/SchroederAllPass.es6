import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

/*
    This Node is an implementation of one of Schroeder's
    AllPass graphs. This particular graph is shown in Figure2
    in the following paper:

    M. R. Schroeder - Natural Sounding Artificial Reverberation

    Journal of the Audio Engineering Society, July 1962.
    Volume 10, Number 3.


    It's available here:
    http://www.ece.rochester.edu/~zduan/teaching/ece472/reading/Schroeder_1962.pdf


    There are three main paths an input signal can take:

    in -> -gain -> sum1 -> out
    in -> sum2 -> delay -> gain -> sum2
    in -> sum2 -> delay -> gain (1-g^2) -> sum1

    For now, the summing nodes are a part of the following class,
    but can easily be removed by connecting `-gain`, `gain`, and `1-gain^2`
    to `this.outputs[0]` and `-gain` and `in` to the delay directly.
 */

// TODO:
//  - Remove unnecessary summing nodes.
class SchroederAllPass extends Node {

    constructor( io, delayTime, feedback ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.sum1 = io.context.createGain();
        graph.sum2 = io.context.createGain();
        graph.positiveGain = io.context.createGain();
        graph.negativeGain = io.context.createGain();
        graph.negate = io.createNegate();
        graph.delay = io.context.createDelay();
        graph.oneMinusGainSquared = io.context.createGain();
        graph.minusOne = io.createSubtract( 1 );
        graph.gainSquared = io.createSquare();

        this.controls.feedback = io.createParam( feedback ),
        this.controls.delayTime = io.createParam( delayTime );

        // Zero out controlled params.
        graph.positiveGain.gain.value = 0;
        graph.negativeGain.gain.value = 0;
        graph.oneMinusGainSquared.gain.value = 0;

        // Connect up gain controls
        this.controls.feedback.connect( graph.positiveGain.gain );
        this.controls.feedback.connect( graph.negate );
        graph.negate.connect( graph.negativeGain.gain );
        this.controls.feedback.connect( graph.gainSquared );
        graph.gainSquared.connect( graph.minusOne );
        graph.minusOne.connect( graph.oneMinusGainSquared.gain );

        // connect delay time control
        this.controls.delayTime.connect( graph.delay.delayTime );

        // First signal path:
        // in -> -gain -> graph.sum1 -> out
        this.inputs[ 0 ].connect( graph.negativeGain );
        graph.negativeGain.connect( graph.sum1 );
        graph.sum1.connect( this.outputs[ 0 ] );

        // Second signal path:
        // (in -> graph.sum2 ->) delay -> gain -> graph.sum2
        graph.delay.connect( graph.positiveGain );
        graph.positiveGain.connect( graph.sum2 );

        // Third signal path:
        // in -> graph.sum2 -> delay -> gain (1-g^2) -> graph.sum1
        this.inputs[ 0 ].connect( graph.sum2 );
        graph.sum2.connect( graph.delay );
        graph.delay.connect( graph.oneMinusGainSquared );
        graph.oneMinusGainSquared.connect( graph.sum1 );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createSchroederAllPass = function( delayTime, feedback ) {
    return new SchroederAllPass( this, delayTime, feedback );
};