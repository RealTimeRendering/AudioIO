// OR -> NOT -> out
import "../../core/AudioIO.es6";
import LogicalOperator from "./LogicalOperator.es6";


class NOR extends LogicalOperator {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io );

        var graph = this.getGraph();
        graph.OR = this.io.createOR();
        graph.NOT = this.io.createNOT();
        this.inputs[ 1 ] = this.context.createGain();

        this.inputs[ 0 ].connect( graph.OR, 0, 0 );
        this.inputs[ 1 ].connect( graph.OR, 0, 1 );
        graph.OR.connect( graph.NOT );
        graph.NOT.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createNOR = function() {
    return new NOR( this );
};

export default NOR;