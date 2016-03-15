import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class LessThanEqualTo extends Node {
    constructor( io, value ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        this.controls.value = this.io.createParam( value );
        graph.lessThan = this.io.createLessThan();
        graph.equalTo = this.io.createEqualTo();
        graph.OR = this.io.createOR();

        this.controls.value.connect( graph.lessThan.controls.value );
        this.controls.value.connect( graph.equalTo.controls.value );

        this.inputs[ 0 ].connect( graph.lessThan );
        this.inputs[ 0 ].connect( graph.equalTo );
        graph.lessThan.connect( graph.OR, 0, 0 );
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

AudioIO.prototype.createLessThanEqualTo = function( value ) {
    return new LessThanEqualTo( this, value );
};