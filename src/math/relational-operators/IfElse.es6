import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class IfElse extends Node {
    constructor( io ) {
        super( io, 0, 0 );

        var graph = this.getGraph();

        graph.switch = this.io.createSwitch( 2, 0 );

        this.if = this.io.createEqualToZero();
        this.if.connect( graph.switch.control );
        this.then = graph.switch.inputs[ 0 ];
        this.else = graph.switch.inputs[ 1 ];

        this.inputs = graph.switch.inputs;
        this.outputs = graph.switch.outputs;

        this.setGraph( graph );
    }
}

AudioIO.prototype.createIfElse = function() {
    return new IfElse( this );
};