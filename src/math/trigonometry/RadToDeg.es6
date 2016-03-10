import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class RadToDeg extends Node {
    constructor( io ) {
        super( io, 0, 0 );
        this.inputs[ 0 ] = this.outputs[ 0 ] = this.io.createMultiply( 180 / Math.PI );
    }
}

AudioIO.prototype.createRadToDeg = function( deg ) {
    return new RadToDeg( this, deg );
};