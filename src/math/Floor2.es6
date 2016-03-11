// This was an idea to use overflows
// to provide a floor function that would
// accept values > 1 && < -1. But alas, it
// wasn't meant to be.
//
// GainNode's overflow, sure, but not in the
// same way that Javascript overflows.
//
// The function directly below is a floor function
// that uses JS overflows:
function floor( x ) {
    if( x > 0 ) {
        var c = Number.MAX_SAFE_INTEGER - x + 1;
        x = x + c;
        return x - c;
    }
    else {
        var c = Number.MIN_SAFE_INTEGER + x - 1;
        x = x - c;
        return x + c;
    }
}

// But whilst that works fine in JS, when making
// the same functionality using WebAudio bits,
// the overflow behaviour is not the same.


import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class Floor extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        this.ifElse = this.io.createIfElse();
        this.greaterThanZero = this.io.createGreaterThanZero();

        // POSITIVE FLOW:
        // c = MAX_SAFE_INTEGER - input + 1
        this.maxSafeInteger = this.io.createConstant( Math.pow( 2, 52 ) );
        this.positiveConstantSubInput = this.io.createSubtract();
        this.positiveC = this.io.createAdd( 1 );

        this.maxSafeInteger.connect( this.positiveConstantSubInput, 0, 0 );
        this.inputs[ 0 ].connect( this.positiveConstantSubInput, 0, 1 );
        this.positiveConstantSubInput.connect( this.positiveC, 0, 0 );

        // x = x + c (where c = this.positiveC).
        this.positiveAdd = this.io.createAdd();
        this.inputs[ 0 ].connect( this.positiveAdd, 0, 0 );
        this.positiveC.connect( this.positiveAdd, 0, 1 );

        // return x - c;
        this.positiveOutput = this.io.createSubtract();
        this.positiveAdd.connect( this.positiveOutput, 0, 0 );
        this.positiveC.connect( this.positiveOutput, 0, 1 );




        // NEGATIVE FLOW:
        // c = MIN_SAFE_INTEGER + input - 1
        this.minSafeInteger = this.io.createConstant( Number.MIN_SAFE_INTEGER );
        this.negativeConstantPlusInput = this.io.createAdd();
        this.negativeC = this.io.createSubtract( 1 );

        this.minSafeInteger.connect( this.negativeConstantPlusInput, 0, 0 );
        this.inputs[ 0 ].connect( this.negativeConstantPlusInput, 0, 1 );
        this.negativeConstantPlusInput.connect( this.negativeC, 0, 0 );

        // x = x - c (where c = this.negativeC).
        this.negativeSub = this.io.createSubtract();
        this.inputs[ 0 ].connect( this.negativeSub, 0, 0 );
        this.negativeC.connect( this.negativeSub, 0, 1 );

        // return x + c;
        this.negativeOutput = this.io.createAdd();
        this.negativeSub.connect( this.negativeOutput, 0, 0 );
        this.negativeC.connect( this.negativeOutput, 0, 1 );



        // if( input > 0 ) t

        // if( input > 0 ) then input
        // else shaper
        this.inputs[ 0 ].connect( this.greaterThanZero );
        this.greaterThanZero.connect( this.ifElse.if );
        this.inputs[ 0 ].connect( this.ifElse.then );
        this.shaper.connect( this.ifElse.else );


        this.inputs[ 0 ].connect( this.shaper );
        this.ifElse.connect( this.outputs[ 0 ] );
    }
}

AudioIO.prototype.createFloor = function() {
    return new Floor( this );
};