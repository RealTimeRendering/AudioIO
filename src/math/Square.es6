import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";


class Square extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io, 1, 1 );

        this.multiply = this.io.createMultiply();
        this.inputs[ 0 ].connect( this.multiply, 0, 0 );
        this.inputs[ 0 ].connect( this.multiply, 0, 1 );
        this.multiply.connect( this.outputs[ 0 ] );
    }

    cleanUp() {
        super();
        this.multiply.cleanUp();
        this.multiply = null;
    }
}

AudioIO.prototype.createSquare = function() {
    return new Square( this );
};