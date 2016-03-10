import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class GreaterThanZero extends Node {
    constructor( io ) {
        super( io, 1, 0 );
        this.inputs[ 0 ].gain.value = 100000;
        this.outputs[ 0 ] = this.io.createWaveShaper( this.io.curves.GreaterThanZero );
        this.inputs[ 0 ].connect( this.outputs[ 0 ] );
    }
}

AudioIO.prototype.createGreaterThanZero = function() {
    return new GreaterThanZero( this );
};