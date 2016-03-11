import "../../core/AudioIO.es6";
import LogicalOperator from "./LogicalOperator.es6";


class AND extends LogicalOperator {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io );

        var graph = this.getGraph();

        graph.multiply = this.io.createMultiply();
        this.inputs[ 1 ] = this.io.createClamp( 0, 1 );

        this.inputs[ 0 ].connect( graph.multiply, 0, 0 );
        this.inputs[ 1 ].connect( graph.multiply, 0, 1 );

        graph.multiply.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

export default AND;

AudioIO.prototype.createAND = function() {
    return new AND( this );
};