import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class Crossfader extends Node {
    constructor( io, numCases = 2, startingCase = 0 ) {

        // Ensure startingCase is never < 0
        // and number of inputs is always >= 2 (no point
        // x-fading between less than two inputs!)
        startingCase = Math.abs( startingCase );
        numCases = Math.max( numCases, 2 );

        super( io, numCases, 1 );

        this.clamps = [];
        this.subtracts = [];
        this.xfaders = [];
        this.controls.index = this.io.createParam();

        for( var i = 0; i < numCases - 1; ++i ) {
            this.xfaders[ i ] = this.io.createDryWetNode();
            this.subtracts[ i ] = this.io.createSubtract( i);
            this.clamps[ i ] = this.io.createClamp( 0, 1 );

            if( i === 0 ) {
                this.inputs[ i ].connect( this.xfaders[ i ].dry );
                this.inputs[ i + 1 ].connect( this.xfaders[ i ].wet );
            }
            else {
                this.xfaders[ i - 1 ].connect( this.xfaders[ i ].dry );
                this.inputs[ i + 1 ].connect( this.xfaders[ i ].wet );
            }

            this.controls.index.connect( this.subtracts[ i ] );
            this.subtracts[ i ].connect( this.clamps[ i ] );
            this.clamps[ i ].connect( this.xfaders[ i ].controls.dryWet );
        }

        this.xfaders[ this.xfaders.length - 1 ].connect( this.outputs[ 0 ] );
    }

    cleanUp() {
        super();
    }
}


AudioIO.prototype.createCrossfader = function( numCases, startingCase ) {
    return new Crossfader( this, numCases, startingCase );
};

export default Crossfader;