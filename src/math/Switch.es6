import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class Switch extends Node {
    constructor( io, numCases, startingCase = 0 ) {
        super( io, 1, 1 );

        // Ensure startingCase is never < 0
        startingCase = Math.abs( startingCase );

        this.cases = [];
        this.controls.index = this.io.createParam( startingCase );

        for ( var i = 0; i < numCases; ++i ) {
            this.inputs[ i ] = this.context.createGain();
            this.inputs[ i ].gain.value = 0.0;
            this.cases[ i ] = this.io.createEqualTo( i );
            this.cases[ i ].connect( this.inputs[ i ].gain );
            this.controls.index.connect( this.cases[ i ] );
            this.inputs[ i ].connect( this.outputs[ 0 ] );
        }
    }

    cleanUp() {
        super();

        for( var i = this.cases.length - 1; i >= 0; --i ) {
            this.cases[ i ].cleanUp();
            this.cases[ i ] = null;
        }

        this.controls.index.cleanUp();
        this.controls.index = null;
        this.cases = null;
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