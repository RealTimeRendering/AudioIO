import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class Switch extends Node {
    constructor( io, numCases, startingCase ) {
        super( io, 1, 1 );

        // Ensure startingCase is never < 0
        startingCase = Math.abs( startingCase );

        var graph = this.getGraph();

        graph.cases = [];

        this.controls.index = this.io.createParam( startingCase );

        for ( var i = 0; i < numCases; ++i ) {
            this.inputs[ i ] = this.context.createGain();
            this.inputs[ i ].gain.value = 0.0;
            graph.cases[ i ] = this.io.createEqualTo( i );
            graph.cases[ i ].connect( this.inputs[ i ].gain );
            this.controls.index.connect( graph.cases[ i ] );
            this.inputs[ i ].connect( this.outputs[ 0 ] );
        }

        this.setGraph( graph );
    }

    get control() {
        return this.controls.index.control;
    }

    get value() {
        return this.controls.index.value;
    }
    set value( value ) {
        this.controls.index.value = value;
    }
}


AudioIO.prototype.createSwitch = function( numCases, startingCase ) {
    return new Switch( this, numCases, startingCase );
};