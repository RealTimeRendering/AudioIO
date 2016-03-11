import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class Lerp extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, start, end, delta ) {
        super( io, 3, 1 );

        var graph = this.getGraph();

        graph.add = this.io.createAdd();
        graph.subtract = this.io.createSubtract();
        graph.multiply = this.io.createMultiply();

        graph.start = this.io.createParam( start );
        graph.end = this.io.createParam( end );
        graph.delta = this.io.createParam( delta );

        graph.end.connect( graph.subtract, 0, 0 );
        graph.start.connect( graph.subtract, 0, 1 );
        graph.subtract.connect( graph.multiply, 0, 0 );
        graph.delta.connect( graph.multiply, 0, 1 );

        graph.start.connect( graph.add, 0, 0 );
        graph.multiply.connect( graph.add, 0, 1 );

        graph.add.connect( this.outputs[ 0 ] );

        this.inputs[ 0 ].connect( graph.start );
        this.inputs[ 1 ].connect( graph.end );
        this.inputs[ 2 ].connect( graph.delta );

        this.controls.start = graph.start;
        this.controls.end = graph.end;
        this.controls.delta = graph.delta;

        this.setGraph( graph );
    }

    get start() {
        return this.getGraph().start.value;
    }
    set start( value ) {
        this.getGraph().start.value = value;
    }

    get end() {
        return this.getGraph().end.value;
    }
    set end( value ) {
        this.getGraph().end.value = value;
    }

    get delta() {
        return this.getGraph().delta.value;
    }
    set delta( value ) {
        this.getGraph().delta.value = value;
    }
}

AudioIO.prototype.createLerp = function( start, end, delta ) {
    return new Lerp( this );
};