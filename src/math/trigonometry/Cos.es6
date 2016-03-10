import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

// Cosine approximation!
//
// Only works in range of -Math.PI to Math.PI.
class Cos extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, value ) {
        super( io, 0, 1 );

        this.inputs[ 0 ] = this.io.createParam( value );

        this.square = this.io.createSquare();

        this.const1 = this.io.createConstant( -2.605e-7 );
        this.const2 = this.io.createConstant( 2.47609e-5 );
        this.const3 = this.io.createConstant( -0.00138884 );
        this.const4 = this.io.createConstant( 0.0416666 );
        this.const5 = this.io.createConstant( -0.499923 );
        this.const6 = this.io.createConstant( 1 );

        this.multiply1 = this.io.createMultiply();
        this.multiply2 = this.io.createMultiply();
        this.multiply3 = this.io.createMultiply();
        this.multiply4 = this.io.createMultiply();
        this.multiply5 = this.io.createMultiply();

        this.add1 = this.io.createAdd();
        this.add2 = this.io.createAdd();
        this.add3 = this.io.createAdd();
        this.add4 = this.io.createAdd();
        this.add5 = this.io.createAdd();

        this.inputs[ 0 ].connect( this.square );


        this.const5.connect( this.add4, 0, 1 );
        this.const6.connect( this.add5, 0, 1 );

        // Connect multiply1's inputs
        this.square.connect( this.multiply1, 0, 0 );
        this.const1.connect( this.multiply1, 0, 1 );

        // Connect add1's inputs
        this.multiply1.connect( this.add1, 0, 0 );
        this.const2.connect( this.add1, 0, 1 );

        // Connect up multiply2's inputs
        this.square.connect( this.multiply2, 0, 0 );
        this.add1.connect( this.multiply2, 0, 1 );

        // Connect up add2's inputs
        this.multiply2.connect( this.add2, 0, 0 );
        this.const3.connect( this.add2, 0, 1 );

        // Connect up multiply3's inputs
        this.square.connect( this.multiply3, 0, 0 );
        this.add2.connect( this.multiply3, 0, 1 );

        // Connect add3's inputs
        this.multiply3.connect( this.add3, 0, 0 );
        this.const4.connect( this.add3, 0, 1 );

        // Connect multiply4's inputs
        this.square.connect( this.multiply4, 0, 0 );
        this.add3.connect( this.multiply4, 0, 1 );

        // add4's inputs
        this.multiply4.connect( this.add4, 0, 0 );
        this.const5.connect( this.add4, 0, 1 );

        // multiply5's inputs
        this.square.connect( this.multiply5, 0, 0 );
        this.add4.connect( this.multiply5, 0, 1 );

        // add5's inputs
        this.multiply5.connect( this.add5, 0, 0 );
        this.const6.connect( this.add5, 0, 1 );

        // Output (finally!!)
        this.add5.connect( this.outputs[ 0 ] );

        // Store controllable params.
        this.controls.value = this.inputs[ 0 ];
    }

    cleanUp() {
        super();
    }
}

AudioIO.prototype.createCos = function( value ) {
    return new Cos( this, value );
};