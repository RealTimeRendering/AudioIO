import "../core/AudioIO.es6";
import Node from "../core/Node.es6";


class Abs extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, accuracy = 10 ) {
        super( io, 1, 1 );

        // var gainAccuracy = accuracy * 100;
        var gainAccuracy = Math.pow( accuracy, 2 );

        this.inputs[ 0 ].gain.value = 1 / gainAccuracy;
        this.outputs[ 0 ].gain.value = gainAccuracy;

        this.shaper = this.io.createWaveShaper( function( x ) {
            return Math.abs( x );
        }, 8192 * accuracy );


        this.inputs[ 0 ].connect( this.shaper );
        this.shaper.connect( this.outputs[ 0 ] );
    }

    cleanUp() {
        super();
        this.shaper.cleanUp();
        this.shaper = null;
    }
}

AudioIO.prototype.createAbs = function( accuracy ) {
    return new Abs( this, accuracy );
};