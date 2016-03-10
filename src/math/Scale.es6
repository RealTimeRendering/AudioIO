import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

// Given an input value and its high and low bounds, scale
// that value to new high and low bounds.
//
// Formula from MaxMSP's Scale object:
//  http://www.cycling74.com/forums/topic.php?id=26593
//
// ((input-lowIn) / (highIn-lowIn)) * (highOut-lowOut) + lowOut;


// TODO:
//  - Add controls!
class Scale extends Node {
    constructor( io, lowIn, highIn, lowOut, highOut ) {
        super( io, 1, 1 );

        lowIn = typeof lowIn === 'number' ? lowIn : 0;
        highIn = typeof highIn === 'number' ? highIn : 1;
        lowOut = typeof lowOut === 'number' ? lowOut : 0;
        highOut = typeof highOut === 'number' ? highOut : 10;

        this._lowIn = this.io.createParam( lowIn );
        this._highIn = this.io.createParam( highIn );
        this._lowOut = this.io.createParam( lowOut );
        this._highOut = this.io.createParam( highOut );

        // this.inputs = [ this.context.createGain() ];

        // (input-lowIn)
        this.inputMinusLowIn = this.io.createSubtract();
        this.inputs[ 0 ].connect( this.inputMinusLowIn, 0, 0 );
        this._lowIn.connect( this.inputMinusLowIn, 0, 1 );

        // (highIn-lowIn)
        this.highInMinusLowIn = this.io.createSubtract();
        this._highIn.connect( this.highInMinusLowIn, 0, 0 );
        this._lowIn.connect( this.highInMinusLowIn, 0, 1 );

        // ((input-lowIn) / (highIn-lowIn))
        this.divide = this.io.createDivide();
        this.inputMinusLowIn.connect( this.divide, 0, 0 );
        this.highInMinusLowIn.connect( this.divide, 0, 1 );

        // (highOut-lowOut)
        this.highOutMinusLowOut = this.io.createSubtract();
        this._highOut.connect( this.highOutMinusLowOut, 0, 0 );
        this._lowOut.connect( this.highOutMinusLowOut, 0, 1 );

        // ((input-lowIn) / (highIn-lowIn)) * (highOut-lowOut)
        this.multiply = this.io.createMultiply();
        this.divide.connect( this.multiply, 0, 0 );
        this.highOutMinusLowOut.connect( this.multiply, 0, 1 );

        // ((input-lowIn) / (highIn-lowIn)) * (highOut-lowOut) + lowOut
        this.add = this.io.createAdd();
        this.multiply.connect( this.add, 0, 0 );
        this._lowOut.connect( this.add, 0, 1 );

        this.add.connect( this.outputs[ 0 ] );
    }

    cleanUp() {
        super();

        this._lowIn.cleanUp();
        this._highIn.cleanUp();
        this._lowOut.cleanUp();
        this._highOut.cleanUp();
        this.inputMinusLowIn.cleanUp();
        this.highInMinusLowIn.cleanUp();
        this.divide.cleanUp();
        this.highOutMinusLowOut.cleanUp();
        this.multiply.cleanUp();

        this._lowIn = null;
        this._highIn = null;
        this._lowOut = null;
        this._highOut = null;
        this.inputMinusLowIn = null;
        this.highInMinusLowIn = null;
        this.divide = null;
        this.highOutMinusLowOut = null;
        this.multiply = null;
        this.add = null;
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
}


AudioIO.prototype.createScale = function( lowIn, highIn, lowOut, highOut ) {
    return new Scale( this, lowIn, highIn, lowOut, highOut );
};