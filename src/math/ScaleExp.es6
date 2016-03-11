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

        var graph = this.getGraph();

        // lowIn = typeof lowIn === 'number' ? lowIn : 0;
        // highIn = typeof highIn === 'number' ? highIn : 1;
        // lowOut = typeof lowOut === 'number' ? lowOut : 0;
        // highOut = typeof highOut === 'number' ? highOut : 10;
        // exponent = typeof exponent === 'number' ? exponent : 1;

        this.controls.lowIn = this.io.createParam( lowIn );
        this.controls.highIn = this.io.createParam( highIn );
        this.controls.lowOut = this.io.createParam( lowOut );
        this.controls.highOut = this.io.createParam( highOut );
        graph._exponent = this.io.createParam( exponent );


        // (input - lowIn)
        graph.inputMinusLowIn = this.io.createSubtract();
        this.inputs[ 0 ].connect( graph.inputMinusLowIn, 0, 0 );
        this.controls.lowIn.connect( graph.inputMinusLowIn, 0, 1 );

        // (-input + lowIn)
        graph.minusInput = this.io.createNegate();
        graph.minusInputPlusLowIn = this.io.createAdd();
        this.inputs[ 0 ].connect( graph.minusInput );
        graph.minusInput.connect( graph.minusInputPlusLowIn, 0, 0 );
        this.controls.lowIn.connect( graph.minusInputPlusLowIn, 0, 1 );

        // (highIn - lowIn)
        graph.highInMinusLowIn = this.io.createSubtract();
        this.controls.highIn.connect( graph.highInMinusLowIn, 0, 0 );
        this.controls.lowIn.connect( graph.highInMinusLowIn, 0, 1 );

        // ((input - lowIn) / (highIn - lowIn))
        graph.divide = this.io.createDivide();
        graph.inputMinusLowIn.connect( graph.divide, 0, 0 );
        graph.highInMinusLowIn.connect( graph.divide, 0, 1 );

        // (-input + lowIn) / (highIn - lowIn)
        graph.negativeDivide = this.io.createDivide();
        graph.minusInputPlusLowIn.connect( graph.negativeDivide, 0, 0 );
        graph.highInMinusLowIn.connect( graph.negativeDivide, 0, 1 );

        // (highOut - lowOut)
        graph.highOutMinusLowOut = this.io.createSubtract();
        this.controls.highOut.connect( graph.highOutMinusLowOut, 0, 0 );
        this.controls.lowOut.connect( graph.highOutMinusLowOut, 0, 1 );

        // Math.pow( (input - lowIn) / (highIn - lowIn), exp)
        graph.pow = this.io.createPow( exponent );
        graph.divide.connect( graph.pow );

        // -(Math.pow( (-input + lowIn) / (highIn - lowIn), exp))
        graph.negativePowNegate = this.io.createNegate();
        graph.negativePow = this.io.createPow( exponent );
        graph.negativeDivide.connect( graph.negativePow );
        graph.negativePow.connect( graph.negativePowNegate );


        // lowOut + (highOut - lowOut) * Math.pow( (input - lowIn) / (highIn - lowIn), exp);
        graph.elseIfBranch = this.io.createAdd();
        graph.elseIfMultiply = this.io.createMultiply();
        graph.highOutMinusLowOut.connect( graph.elseIfMultiply, 0, 0 );
        graph.pow.connect( graph.elseIfMultiply, 0, 1 );
        this.controls.lowOut.connect( graph.elseIfBranch, 0, 0 );
        graph.elseIfMultiply.connect( graph.elseIfBranch, 0, 1 );

        // lowOut + (highOut - lowOut) * -(Math.pow( (-input + lowIn) / (highIn - lowIn), exp));
        graph.elseBranch = this.io.createAdd();
        graph.elseMultiply = this.io.createMultiply();
        graph.highOutMinusLowOut.connect( graph.elseMultiply, 0, 0 );
        graph.negativePowNegate.connect( graph.elseMultiply, 0, 1 );
        this.controls.lowOut.connect( graph.elseBranch, 0, 0 );
        graph.elseMultiply.connect( graph.elseBranch, 0, 1 );



        // else if( (input - lowIn) / (highIn - lowIn) > 0 ) {
        graph.greaterThanZero = this.io.createGreaterThanZero();
        graph.ifGreaterThanZero = this.io.createIfElse();
        graph.divide.connect( graph.greaterThanZero );
        graph.greaterThanZero.connect( graph.ifGreaterThanZero.if );
        graph.elseIfBranch.connect( graph.ifGreaterThanZero.then );
        graph.elseBranch.connect( graph.ifGreaterThanZero.else );

        // if((input - lowIn) / (highIn - lowIn) === 0)
        graph.equalsZero = this.io.createEqualToZero();
        graph.ifEqualsZero = this.io.createIfElse();
        graph.divide.connect( graph.equalsZero );
        graph.equalsZero.connect( graph.ifEqualsZero.if );
        this.controls.lowOut.connect( graph.ifEqualsZero.then );
        graph.ifGreaterThanZero.connect( graph.ifEqualsZero.else );

        graph.ifEqualsZero.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }

    get lowIn() {
        return this.controls.lowIn.value;
    }
    set lowIn( value ) {
        this.controls.lowIn.value = value;
    }

    get highIn() {
        return this.controls.highIn.value;
    }
    set highIn( value ) {
        this.controls.highIn.value = value;
    }

    get lowOut() {
        return this.controls.lowOut.value;
    }
    set lowOut( value ) {
        this.controls.lowOut.value = value;
    }

    get highOut() {
        return this.controls.highOut.value;
    }
    set highOut( value ) {
        this.controls.highOut.value = value;
    }

    get exponent() {
        return this.getGraph()._exponent.value;
    }
    set exponent( value ) {
        var graph = this.getGraph();
        graph._exponent.value = value;
        graph.pow.value = value;
        graph.negativePow.value = value;
    }
}


AudioIO.prototype.createScaleExp = function( lowIn, highIn, lowOut, highOut, exponent ) {
    return new ScaleExp( this, lowIn, highIn, lowOut, highOut, exponent );
};