import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

// Given an input value and its high and low bounds, scale
// that value to new high and low bounds.
//
// Formula from MaxMSP's Scale object:
//  http://www.cycling74.com/forums/topic.php?id=26593
//
// if( (input - lowIn) / (highIn - lowIn) === 0 ) {
//     return lowOut;
// }
// else if( (input - lowIn) / (highIn - lowIn) > 0 ) {
//     return lowOut + (highOut - lowOut) * Math.pow( (input - lowIn) / (highIn - lowIn), exp);
// }
// else {
//     return lowOut + (highOut - lowOut) * -(Math.pow( (-input + lowIn) / (highIn - lowIn), exp));
// }

// TODO:
//  - Add controls
class ScaleExp extends Node {
    constructor( io, lowIn, highIn, lowOut, highOut, exponent ) {
        super( io, 1, 1 );

        lowIn = typeof lowIn === 'number' ? lowIn : 0;
        highIn = typeof highIn === 'number' ? highIn : 1;
        lowOut = typeof lowOut === 'number' ? lowOut : 0;
        highOut = typeof highOut === 'number' ? highOut : 10;
        exponent = typeof exponent === 'number' ? exponent : 1;

        this._lowIn = this.io.createParam( lowIn );
        this._highIn = this.io.createParam( highIn );
        this._lowOut = this.io.createParam( lowOut );
        this._highOut = this.io.createParam( highOut );
        this._exponent = this.io.createParam( exponent );


        // (input - lowIn)
        this.inputMinusLowIn = this.io.createSubtract();
        this.inputs[ 0 ].connect( this.inputMinusLowIn, 0, 0 );
        this._lowIn.connect( this.inputMinusLowIn, 0, 1 );

        // (-input + lowIn)
        this.minusInput = this.io.createNegate();
        this.minusInputPlusLowIn = this.io.createAdd();
        this.inputs[ 0 ].connect( this.minusInput );
        this.minusInput.connect( this.minusInputPlusLowIn, 0, 0 );
        this._lowIn.connect( this.minusInputPlusLowIn, 0, 1 );

        // (highIn - lowIn)
        this.highInMinusLowIn = this.io.createSubtract();
        this._highIn.connect( this.highInMinusLowIn, 0, 0 );
        this._lowIn.connect( this.highInMinusLowIn, 0, 1 );

        // ((input - lowIn) / (highIn - lowIn))
        this.divide = this.io.createDivide();
        this.inputMinusLowIn.connect( this.divide, 0, 0 );
        this.highInMinusLowIn.connect( this.divide, 0, 1 );

        // (-input + lowIn) / (highIn - lowIn)
        this.negativeDivide = this.io.createDivide();
        this.minusInputPlusLowIn.connect( this.negativeDivide, 0, 0 );
        this.highInMinusLowIn.connect( this.negativeDivide, 0, 1 );

        // (highOut - lowOut)
        this.highOutMinusLowOut = this.io.createSubtract();
        this._highOut.connect( this.highOutMinusLowOut, 0, 0 );
        this._lowOut.connect( this.highOutMinusLowOut, 0, 1 );

        // Math.pow( (input - lowIn) / (highIn - lowIn), exp)
        this.pow = this.io.createPow( exponent );
        this.divide.connect( this.pow );

        // -(Math.pow( (-input + lowIn) / (highIn - lowIn), exp))
        this.negativePowNegate = this.io.createNegate();
        this.negativePow = this.io.createPow( exponent );
        this.negativeDivide.connect( this.negativePow );
        this.negativePow.connect( this.negativePowNegate );


        // lowOut + (highOut - lowOut) * Math.pow( (input - lowIn) / (highIn - lowIn), exp);
        this.elseIfBranch = this.io.createAdd();
        this.elseIfMultiply = this.io.createMultiply();
        this.highOutMinusLowOut.connect( this.elseIfMultiply, 0, 0 );
        this.pow.connect( this.elseIfMultiply, 0, 1 );
        this._lowOut.connect( this.elseIfBranch, 0, 0 );
        this.elseIfMultiply.connect( this.elseIfBranch, 0, 1 );

        // lowOut + (highOut - lowOut) * -(Math.pow( (-input + lowIn) / (highIn - lowIn), exp));
        this.elseBranch = this.io.createAdd();
        this.elseMultiply = this.io.createMultiply();
        this.highOutMinusLowOut.connect( this.elseMultiply, 0, 0 );
        this.negativePowNegate.connect( this.elseMultiply, 0, 1 );
        this._lowOut.connect( this.elseBranch, 0, 0 );
        this.elseMultiply.connect( this.elseBranch, 0, 1 );



        // else if( (input - lowIn) / (highIn - lowIn) > 0 ) {
        this.greaterThanZero = this.io.createGreaterThanZero();
        this.ifGreaterThanZero = this.io.createIfElse();
        this.divide.connect( this.greaterThanZero );
        this.greaterThanZero.connect( this.ifGreaterThanZero.if );
        this.elseIfBranch.connect( this.ifGreaterThanZero.then );
        this.elseBranch.connect( this.ifGreaterThanZero.else );

        // if((input - lowIn) / (highIn - lowIn) === 0)
        this.equalsZero = this.io.createEqualToZero();
        this.ifEqualsZero = this.io.createIfElse();
        this.divide.connect( this.equalsZero );
        this.equalsZero.connect( this.ifEqualsZero.if );
        this._lowOut.connect( this.ifEqualsZero.then );
        this.ifGreaterThanZero.connect( this.ifEqualsZero.else );

        this.ifEqualsZero.connect( this.outputs[ 0 ] );
    }

    cleanUp() {
        super();

        this._lowIn.cleanUp();
        this._highIn.cleanUp();
        this._lowOut.cleanUp();
        this._highOut.cleanUp();
        this._exponent.cleanUp();
        this.inputMinusLowIn.cleanUp();
        this.minusInput.cleanUp();
        this.minusInputPlusLowIn.cleanUp();
        this.highInMinusLowIn.cleanUp();
        this.divide.cleanUp();
        this.negativeDivide.cleanUp();
        this.highOutMinusLowOut.cleanUp();
        this.pow.cleanUp();
        this.negativePowNegate.cleanUp();
        this.negativePow.cleanUp();
        this.elseIfBranch.cleanUp();
        this.elseIfMultiply.cleanUp();
        this.elseBranch.cleanUp();
        this.greaterThanZero.cleanUp();
        this.ifGreaterThanZero.cleanUp();
        this.equalsZero.cleanUp();
        this.ifEqualsZero.cleanUp();

        this._lowIn = null;
        this._highIn = null;
        this._lowOut = null;
        this._highOut = null;
        this._exponent = null;
        this.inputMinusLowIn = null;
        this.minusInput = null;
        this.minusInputPlusLowIn = null;
        this.highInMinusLowIn = null;
        this.divide = null;
        this.negativeDivide = null;
        this.highOutMinusLowOut = null;
        this.pow = null;
        this.negativePowNegate = null;
        this.negativePow = null;
        this.elseIfBranch = null;
        this.elseIfMultiply = null;
        this.elseBranch = null;
        this.greaterThanZero = null;
        this.ifGreaterThanZero = null;
        this.equalsZero = null;
        this.ifEqualsZero = null;
    }


    get lowIn() {
        return this._lowIn.value;
    }
    set lowIn( value ) {
        this._lowIn.value = value;
    }

    get highIn() {
        return this._highIn.value;
    }
    set highIn( value ) {
        this._highIn.value = value;
    }

    get lowOut() {
        return this._lowOut.value;
    }
    set lowOut( value ) {
        this._lowOut.value = value;
    }

    get highOut() {
        return this._highOut.value;
    }
    set highOut( value ) {
        this._highOut.value = value;
    }

    get exponent() {
        return this._exponent.value;
    }
    set exponent( value ) {
        this._exponent.value = value;
        this.pow.value = value;
        this.negativePow.value = value;
    }
}


AudioIO.prototype.createScaleExp = function( lowIn, highIn, lowOut, highOut, exponent ) {
    return new ScaleExp( this, lowIn, highIn, lowOut, highOut, exponent );
};