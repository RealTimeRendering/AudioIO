import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

// https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Example
//
// for( var i = 0, x; i < sigFigures; ++i ) {
//      if( i === 0 ) {
//          x = sigFigures * Math.pow( 10, 2 );
//      }
//      else {
//          x = 0.5 * ( x + (input / x) );
//      }
// }
class SqrtHelper {
    constructor( io, previousStep, input, maxInput ) {
        this.multiply = io.createMultiply( 0.5 );
        this.divide = io.createDivide( null, maxInput );
        this.add = io.createAdd();

        // input / x;
        input.connect( this.divide, 0, 0 );
        previousStep.output.connect( this.divide, 0, 1 );

        // x + ( input / x )
        previousStep.output.connect( this.add, 0, 0 );
        this.divide.connect( this.add, 0, 1 );

        // 0.5 * ( x + ( input / x ) )
        this.add.connect( this.multiply );

        this.output = this.multiply;
    }

    cleanUp() {
        this.multiply.cleanUp();
        this.divide.cleanUp();
        this.add.cleanUp();

        this.multiply = null;
        this.divide = null;
        this.add = null;
        this.output = null;
    }
}

class Sqrt extends Node {
    constructor( io, significantFigures, maxInput ) {
        super( io, 1, 1 );

        // Default to 6 significant figures.
        significantFigures = significantFigures || 6;

        maxInput = maxInput || 100;

        this.x0 = this.io.createConstant( significantFigures * Math.pow( 10, 2 ) );

        this.steps = [ {
            output: this.x0
        } ];

        for ( var i = 1; i < significantFigures; ++i ) {
            this.steps.push(
                new SqrtHelper( this.io, this.steps[ i - 1 ], this.inputs[ 0 ], maxInput )
            );
        }

        this.steps[ this.steps.length - 1 ].output.connect( this.outputs[ 0 ] );
    }

    cleanUp() {
        super();

        this.x0.cleanUp();

        this.steps[ 0 ] = null;

        for( var i = this.steps.length - 1; i >= 1; --i ) {
            this.steps[ i ].cleanUp();
            this.steps[ i ] = null;
        }

        this.x0 = null;
        this.steps = null;
    }
}


AudioIO.prototype.createSqrt = function( significantFigures, maxInput ) {
    return new Sqrt( this, significantFigures, maxInput );
};