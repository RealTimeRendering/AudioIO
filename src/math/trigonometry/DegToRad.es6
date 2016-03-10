import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class DegToRad extends Node {
    constructor( io ) {
        super( io, 0, 0 );
        this.inputs[ 0 ] = this.outputs[ 0 ] = this.io.createMultiply( Math.PI / 180 );
    }
}

AudioIO.prototype.createDegToRad = function( deg ) {
    return new DegToRad( this, deg );
};