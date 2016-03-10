import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";


class LogicalOperator extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io, 0, 1 );

        var graph = this.getGraph();

        graph.clamp = this.io.createClamp( 0, 1 );
        this.inputs[ 0 ] = graph.clamp;

        this.setGraph( graph );
    }

    cleanUp() {
        super();

        var graph = this.getGraph();
        graph.clamp.cleanUp();
        graph.clamp = null;
    }
}

export default LogicalOperator;

AudioIO.prototype.createLogicalOperator = function() {
    return new LogicalOperator( this );
};