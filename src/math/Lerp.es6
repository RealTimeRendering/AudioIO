import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class Lerp extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io, 3, 1 );

        this.add = this.io.createAdd();
        this.subtract = this.io.createSubtract();
        this.multiply = this.io.createMultiply();

        this.start = this.io.createParam();
        this.end = this.io.createParam();
        this.delta = this.io.createParam();

        this.end.connect( this.subtract, 0, 0 );
        this.start.connect( this.subtract, 0, 1 );
        this.subtract.connect( this.multiply, 0, 0 );
        this.delta.connect( this.multiply, 0, 1 );

        this.start.connect( this.add, 0, 0 );
        this.multiply.connect( this.add, 0, 1 );

        this.add.connect( this.outputs[ 0 ] );

        this.inputs[ 0 ].connect( this.start );
        this.inputs[ 1 ].connect( this.end );
        this.inputs[ 2 ].connect( this.delta );

        this.controls.start = this.start;
        this.controls.end = this.end;
        this.controls.delta = this.delta;
    }

    cleanUp() {
        super();

        // TODO..!
    }
}

AudioIO.prototype.createLerp = function() {
    return new Lerp( this );
};