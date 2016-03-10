import AudioIO from "../core/AudioIO.es6";
import DryWetNode from "./DryWetNode.es6";


// level = Math.max( level, 2e-12 );
// var doubleLevel = level + level;
// input = Math.max( -doubleLevel, Math.min( doubleLevel, input ) );
// return input * (1 - (Math.abs( input ) * ( 0.25 / level )))

// BROKEN
// BROKEN
// BROKEN
// BROKEN

class ParabolicSaturation extends DryWetNode {
    constructor( io, saturationLevel = 1 ) {
        super( io );

        this.value = this.io.createParam( saturationLevel );

        this.max = this.io.createMax( 2e-12 );
        this.add = this.io.createAdd();
        this.negate = this.io.createNegate();
        this.divideConstant = this.io.createConstant( 0.25 );
        this.divide = this.io.createDivide();
        this.clamp = this.io.createClamp();
        this.abs = this.io.createAbs();
        this.multiply1 = this.io.createMultiply();
        this.subtractConstant = this.io.createConstant( 1 );
        this.subtract = this.io.createSubtract();
        this.multiply2 = this.io.createMultiply();

        this.inputs[ 0 ].connect( this.clamp );

        this.control.connect( this.max );
        this.max.connect( this.add, 0, 0 );
        this.max.connect( this.add, 0, 1 );

        this.divideConstant.connect( this.divide, 0, 0 );
        this.max.connect( this.divide, 0, 1 );

        this.add.connect( this.negate );

        this.negate.connect( this.clamp.max.control );
        this.add.connect( this.clamp.min.control );
        this.clamp.connect( this.multiply2, 0, 0 );
        this.clamp.connect( this.abs );

        this.abs.connect( this.multiply1, 0, 0 );
        this.divide.connect( this.multiply1, 0, 1 );

        this.subtractConstant.connect( this.subtract, 0, 0 );
        this.multiply1.connect( this.subtract, 0, 1 );
        this.subtract.connect( this.multiply2, 0, 1 );
        this.subtract.connect( this.wet );



        this.controls = {
            value: this.value.control
        };
    }
}

AudioIO.prototype.createParabolicSaturation = function( saturationLevel ) {
    return new ParabolicSaturation( this, saturationLevel );
};

export default ParabolicSaturation;