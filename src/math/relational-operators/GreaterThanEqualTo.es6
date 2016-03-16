import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class GreaterThanEqualTo extends Node {
    constructor( io, value ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        this.controls.value = this.io.createParam( value );
        graph.greaterThan = this.io.createGreaterThan();
        graph.equalTo = this.io.createEqualTo();
        graph.OR = this.io.createOR();

        this.controls.value.connect( graph.greaterThan.controls.value );
        this.controls.value.connect( graph.equalTo.controls.value );

        this.inputs[ 0 ].connect( graph.greaterThan );
        this.inputs[ 0 ].connect( graph.equalTo );
        graph.greaterThan.connect( graph.OR, 0, 0 );
        graph.equalTo.connect( graph.OR, 0, 1 );
        graph.OR.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }

    get value() {
        return this.controls.value.value;
    }
    set value( value ) {
        this.controls.value.setValueAtTime( value, this.context.currentTime );
    }
}

AudioIO.prototype.createGreaterThanEqualTo = function( value ) {
    return new GreaterThanEqualTo( this, value );
};