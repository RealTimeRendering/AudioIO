import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

/**
 * Outputs the value of 1 / inputValue (or pow(inputValue, -1))
 * Will be useful for doing multiplicative division.
 *
 * TODO:
 *     - The waveshaper isn't accurate. It pumps out values differing
 *       by 1.7906793140301525e-9 or more.
 *
 * @param {Object} io Instance of AudioIO.
 */
class Reciprocal extends Node {
    constructor( io, maxInput ) {
        super( io, 1, 1 );

        var factor = maxInput || 100,
            gain = Math.pow( factor, -1 ),
            graph = this.getGraph();

        graph.maxInput = this.context.createGain();
        graph.maxInput.gain.setValueAtTime( gain, this.context.currentTime );

        // this.inputs[ 0 ] = this.context.createGain();
        this.inputs[ 0 ].gain.setValueAtTime( 0.0, this.context.currentTime );

        graph.shaper = this.io.createWaveShaper( this.io.curves.Reciprocal );

        // this.outputs[ 0 ] = this.context.createGain();
        this.outputs[ 0 ].gain.setValueAtTime( 0.0, this.context.currentTime );

        this.io.constantDriver.connect( graph.maxInput );
        graph.maxInput.connect( this.inputs[ 0 ].gain );
        graph.maxInput.connect( this.outputs[ 0 ].gain );

        this.inputs[ 0 ].connect( graph.shaper );
        graph.shaper.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }

    get maxInput() {
        return graph.maxInput.gain;
    }
    set maxInput( value ) {
        var graph = this.getGraph();

        if ( typeof value === 'number' ) {
            graph.maxInput.gain.cancelScheduledValues( this.context.currentTime );
            graph.maxInput.gain.setValueAtTime( 1 / value, this.context.currentTime );
        }
    }
}

AudioIO.prototype.createReciprocal = function( maxInput ) {
    return new Reciprocal( this, maxInput );
};