// a equalTo( b ) -> NOT -> out
import "../../core/AudioIO.es6";
import LogicalOperator from "./LogicalOperator.es6";


class XOR extends LogicalOperator {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io );

        var graph = this.getGraph();
        graph.equalTo = this.io.createEqualTo();
        graph.NOT = this.io.createNOT();
        this.inputs[ 1 ] = this.context.createGain();

        this.inputs[ 0 ].connect( graph.equalTo );
        this.inputs[ 1 ].connect( graph.equalTo.controls.value );
        graph.equalTo.connect( graph.NOT );
        graph.NOT.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createXOR = function() {
    return new XOR( this );
};

export default XOR;