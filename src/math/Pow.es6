import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

/**
 * @param {Object} io Instance of AudioIO.
 *
 * Note: DOES NOT HANDLE NEGATIVE POWERS.
 */
class Pow extends Node {
    constructor( io, value ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.multipliers = [];
        graph.value = value;

        for ( var i = 0, node = this.inputs[ 0 ]; i < value - 1; ++i ) {
            graph.multipliers[ i ] = this.io.createMultiply();
            this.inputs[ 0 ].connect( graph.multipliers[ i ].controls.value );
            node.connect( graph.multipliers[ i ] );
            node = graph.multipliers[ i ];
        }

        node.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }

    cleanUp() {
        this.getGraph().value = null;
        super();
    }

    get value() {
        return this.getGraph().value;
    }
    set value( value ) {
        var graph = this.getGraph();

        this.inputs[ 0 ].disconnect( graph.multipliers[ 0 ] );

        for ( var i = graph.multipliers.length - 1; i >= 0; --i ) {
            graph.multipliers[ i ].disconnect();
            graph.multipliers.splice( i, 1 );
        }

        for ( var i = 0, node = this.inputs[ 0 ]; i < value - 1; ++i ) {
            graph.multipliers[ i ] = this.io.createMultiply();
            this.inputs[ 0 ].connect( graph.multipliers[ i ].controls.value );
            node.connect( graph.multipliers[ i ] );
            node = graph.multipliers[ i ];
        }

        node.connect( this.outputs[ 0 ] );

        graph.value = value;
    }
}

AudioIO.prototype.createPow = function( value ) {
    return new Pow( this, value );
};