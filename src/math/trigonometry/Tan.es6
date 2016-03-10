import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

// Tangent approximation!
//
// Only works in range of -Math.PI to Math.PI.
//
// sin( input ) / cos( input )
class Tan extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, value ) {
        super( io, 0, 1 );

        this.inputs[ 0 ] = this.controls.value = this.io.createParam( value );

        this.sine = this.io.createSine();
        this.cos = this.io.createCos();
        this.divide = this.io.createDivide( undefined, Math.PI * 2 );

        this.inputs[ 0 ].connect( this.sine );
        this.inputs[ 0 ].connect( this.cos );
        this.sine.connect( this.divide, 0, 0 );
        this.cos.connect( this.divide, 0, 1 );

        this.divide.connect( this.outputs[ 0 ] );

        // this.square = this.io.createSquare();
        // this.inputs[ 0 ].connect( this.square );

        // this.multiply1 = this.io.createMultiply();
        // this.multiplyThird = this.io.createMultiply( 0.333333 );
        // this.multiply2 = this.io.createMultiply();
        // this.multiplyOneThree = this.io.createMultiply( 0.133333 );
        // this.add1 = this.io.createAdd();
        // this.add2 = this.io.createAdd();

        // this.square.connect( this.multiply1, 0, 0 );
        // this.inputs[ 0 ].connect( this.multiply1, 0, 1 );

        // this.square.connect( this.multiply2, 0, 0 );
        // this.multiply1.connect( this.multiply2, 0, 1 );

        // this.multiply1.connect( this.multiplyThird );
        // this.multiply2.connect( this.multiplyOneThree );

        // this.multiplyThird.connect( this.add1, 0, 0 );
        // this.multiplyOneThree.connect( this.add1, 0, 1 );

        // this.add1.connect( this.add2, 0, 0 );
        // this.inputs[ 0 ].connect( this.add2, 0, 1 );

        // this.add2.connect( this.outputs[ 0 ] );
    }

    cleanUp() {
        super();

        this.controls.value.cleanUp();
        this.controls.value = null;
    }
}

AudioIO.prototype.createTan = function( value ) {
    return new Tan( this, value );
};