// AND -> NOT -> out
//
import "../../core/AudioIO.es6";
import LogicalOperator from "./LogicalOperator.es6";


class NAND extends LogicalOperator {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io );

        var graph = this.getGraph();
        graph.AND = this.io.createAND();
        graph.NOT = this.io.createNOT();
        this.inputs[ 1 ] = this.context.createGain();

        this.inputs[ 0 ].connect( graph.AND, 0, 0 );
        this.inputs[ 1 ].connect( graph.AND, 0, 1 );
        graph.AND.connect( graph.NOT );
        graph.NOT.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createNAND = function() {
    return new NAND( this );
};

export default NAND;