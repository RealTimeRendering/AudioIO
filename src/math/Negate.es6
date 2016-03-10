import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

/**
 * Negates the incoming audio signal.
 * @param {Object} io Instance of AudioIO.
 */
class Negate extends Node {
    constructor( io ) {
        super( io, 1, 0 );

        this.inputs[ 0 ].gain.value = -1;
        this.outputs = this.inputs;
    }
}


AudioIO.prototype.createNegate = function() {
    return new Negate( this );
};