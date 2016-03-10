import "../core/AudioIO.es6";
import Node from "../core/Node.es6";


class NoiseOscillator extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, accuracy = 10 ) {
        super( io, 1, 1 );
    }

    cleanUp() {
        super();
        this.shaper.cleanUp();
        this.shaper = null;
    }
}

AudioIO.prototype.createNoiseOscillator = function( accuracy ) {
    return new NoiseOscillator( this, accuracy );
};