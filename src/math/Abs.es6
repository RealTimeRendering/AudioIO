import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

var SHAPERS = {};

function generateShaperCurve( size ) {
    var array = new Float32Array( size ),
        i = 0,
        x = 0;

    for ( i; i < size; ++i ) {
        x = ( i / size ) * 2 - 1;
        array[ i ] = Math.abs( x );
    }

    return array;
}

class Abs extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, accuracy = 10 ) {
        super( io, 1, 1 );

        // var gainAccuracy = accuracy * 100;
        var gainAccuracy = Math.pow( accuracy, 2 ),
            graph = this.getGraph(),
            size = 1024 * accuracy;

        this.inputs[ 0 ].gain.value = 1 / gainAccuracy;
        this.outputs[ 0 ].gain.value = gainAccuracy;

        // To save creating new shaper curves (that can be quite large!)
        // each time an instance of Abs is created, shaper curves
        // are stored in the SHAPERS object above. The keys to the
        // SHAPERS object are the base wavetable curve size (1024)
        // multiplied by the accuracy argument.
        if( !SHAPERS[ size ] ) {
            SHAPERS[ size ] = generateShaperCurve( size );
        }

        graph.shaper = this.io.createWaveShaper( SHAPERS[ size ] );


        this.inputs[ 0 ].connect( graph.shaper );
        graph.shaper.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createAbs = function( accuracy ) {
    return new Abs( this, accuracy );
};