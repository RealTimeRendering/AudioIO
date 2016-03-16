import "../../core/AudioIO.es6";
import LogicalOperator from "./LogicalOperator.es6";


class OR extends LogicalOperator {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io );

        var graph = this.getGraph();

        graph.max = this.io.createMax();
        graph.equalTo = this.io.createEqualTo( 1 );
        this.inputs[ 1 ] = this.io.createClamp( 0, 1 );

        this.inputs[ 0 ].connect( graph.max );
        this.inputs[ 1 ].connect( graph.max.controls.value );
        graph.max.connect( graph.equalTo );
        graph.equalTo.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createOR = function() {
    return new OR( this );
};

export default OR;
