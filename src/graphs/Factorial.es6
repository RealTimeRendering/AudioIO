import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";

function factorial( value, n ) {
    if( n < 2 ) {
        return value;
    }
    else {
        value = value * n;
        return factorial( value * n, n - 1 );
    }
}

class Factorial extends Node {
    constructor( io, value ) {
        super( io, 1, 1 );


        var node = this.io.createParam( value );

        var feedback = this.context.createGain();
        feedback.gain.value = 0.5;

        var subtract = this.io.createSubtract( 0.5 );

        node.connect( feedback );
        feedback.connect( subtract );
        subtract.connect( node );

        node.connect( this.outputs[ 0 ] );

    }

}

AudioIO.prototype.createFactorial = function( value ) {
    return new Factorial( this, value );
};

export
default Factorial;