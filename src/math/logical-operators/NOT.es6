import "../../core/AudioIO.es6";
import LogicalOperator from "./LogicalOperator.es6";


class NOT extends LogicalOperator {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io );

        var graph = this.getGraph();

        graph.abs = this.io.createAbs( 100 );
        graph.subtract = this.io.createSubtract( 1 );
        graph.round = this.io.createRound();

        this.inputs[ 0 ].connect( graph.subtract );
        graph.subtract.connect( graph.abs );
        graph.abs.connect( graph.round )

        graph.round.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createNOT = function() {
    return new NOT( this );
};

export default NOT;