import "../core/AudioIO.es6";
import Node from "../core/Node.es6";


class Clamp extends Node {
    constructor( io, minValue, maxValue ) {
        super( io, 1, 1 ); // io, 1, 1

        var graph = this.getGraph();

        graph.min = this.io.createMin( maxValue );
        graph.max = this.io.createMax( minValue );

        // this.inputs = [ graph.min ];
        // this.outputs = [ graph.max ];
        this.inputs[ 0 ].connect( graph.min );
        graph.min.connect( graph.max );
        graph.max.connect( this.outputs[ 0 ] );

        // Store controllable params.
        this.controls.min = graph.min.controls.value;
        this.controls.max = graph.max.controls.value;

        this.setGraph( graph );
    }

    get min() {
        return this.getGraph().max.value;
    }
    set min( value ) {
        this.getGraph().max.value = value;
    }

    get max() {
        return this.getGraph().min.value;
    }
    set max( value ) {
        this.getGraph().min.value = value;
    }
}



AudioIO.prototype.createClamp = function( minValue, maxValue ) {
    return new Clamp( this, minValue, maxValue );
};