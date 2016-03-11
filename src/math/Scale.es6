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

        var graph = this.getGraph();

        this.controls.lowIn = this.io.createParam( lowIn );
        this.controls.highIn = this.io.createParam( highIn );
        this.controls.lowOut = this.io.createParam( lowOut );
        this.controls.highOut = this.io.createParam( highOut );


        // (input-lowIn)
        graph.inputMinusLowIn = this.io.createSubtract();
        this.inputs[ 0 ].connect( graph.inputMinusLowIn, 0, 0 );
        this.controls.lowIn.connect( graph.inputMinusLowIn, 0, 1 );

        // (highIn-lowIn)
        graph.highInMinusLowIn = this.io.createSubtract();
        this.controls.highIn.connect( graph.highInMinusLowIn, 0, 0 );
        this.controls.lowIn.connect( graph.highInMinusLowIn, 0, 1 );

        // ((input-lowIn) / (highIn-lowIn))
        graph.divide = this.io.createDivide();
        graph.inputMinusLowIn.connect( graph.divide, 0, 0 );
        graph.highInMinusLowIn.connect( graph.divide, 0, 1 );

        // (highOut-lowOut)
        graph.highOutMinusLowOut = this.io.createSubtract();
        this.controls.highOut.connect( graph.highOutMinusLowOut, 0, 0 );
        this.controls.lowOut.connect( graph.highOutMinusLowOut, 0, 1 );

        // ((input-lowIn) / (highIn-lowIn)) * (highOut-lowOut)
        graph.multiply = this.io.createMultiply();
        graph.divide.connect( graph.multiply, 0, 0 );
        graph.highOutMinusLowOut.connect( graph.multiply, 0, 1 );

        // ((input-lowIn) / (highIn-lowIn)) * (highOut-lowOut) + lowOut
        graph.add = this.io.createAdd();
        graph.multiply.connect( graph.add, 0, 0 );
        this.controls.lowOut.connect( graph.add, 0, 1 );

        graph.add.connect( this.outputs[ 0 ] );

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
}


AudioIO.prototype.createScale = function( lowIn, highIn, lowOut, highOut ) {
    return new Scale( this, lowIn, highIn, lowOut, highOut );
};