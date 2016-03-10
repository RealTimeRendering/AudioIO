import "../core/AudioIO.es6";
import Node from "../core/Node.es6";


class EnvelopeFollower extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, accuracy = 10 ) {
        super( io, 1, 1 );

        this.divisor = this.io.createConstant( 0.693147, this.context.sampleRate * 0.5 );
        this.SampleDelay = this.io.createSampleDelay();
        this.greaterThanZero = this.io.createGreaterThanZero();
        this.multiply = this.io.createMultiply();
        this.switch = this.io.createSwitch( 2, 0 );
        this.add = this.io.createAdd();


        this.subtract = this.io.createSubtract();
        this.inputs[ 0 ].connect( this.subtract, 0, 0 );
        this.SampleDelay.connect( this.subtract, 0, 1 );
        this.SampleDelay.connect( this.add, 0, 0 );
        this.add.connect( this.SampleDelay );

        this.subtract.connect( this.multiply, 0, 0 );
        this.subtract.connect( this.greaterThanZero );

        this.controls.up = this.io.createParam();
        this.controls.down = this.io.createParam();

        // Up flow.
        this.upMin = this.io.createMin( 1 );
        this.upDivide = this.io.createDivide();
        this.divisor.connect( this.upDivide, 0, 0 );
        this.upMin.connect( this.upDivide, 0, 1 );
        this.upDivide.connect( this.switch.inputs[ 0 ] );

        // down flow
        this.downMin = this.io.createMin( 1 );
        this.downDivide = this.io.createDivide();
        this.divisor.connect( this.downDivide, 0, 0 );
        this.downMin.connect( this.downDivide, 0, 1 );
        this.downDivide.connect( this.switch.inputs[ 1 ] );

        // this.greaterThanZero.connect( this.switch.control );
        this.switch.connect( this.multiply, 0, 1 );
        this.multiply.connect( this.add, 0, 1 );

        this.add.connect( this.outputs[ 0 ] );
    }

    cleanUp() {
        super();
    }
}

AudioIO.prototype.createEnvelopeFollower = function( accuracy ) {
    return new EnvelopeFollower( this, accuracy );
};