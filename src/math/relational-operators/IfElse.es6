import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class IfElse extends Node {
    constructor( io ) {
        super( io, 0, 0 );

        this.switch = this.io.createSwitch( 2, 0 );

        this.if = this.io.createEqualToZero();
        this.if.connect( this.switch.control );
        this.then = this.switch.inputs[ 0 ];
        this.else = this.switch.inputs[ 1 ];

        this.inputs = this.switch.inputs;
        this.outputs = this.switch.outputs;
    }

    cleanUp() {
        super();

        this.switch.cleanUp();
        this.if.cleanUp();

        this.if = null;
        this.then = null;
        this.else = null;
        this.inputs = null;
        this.outputs = null;
        this.switch = null;

    }
}

AudioIO.prototype.createIfElse = function() {
    return new IfElse( this );
};