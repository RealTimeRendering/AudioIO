function wrap( wrapTo, input ) {
    var reciprocal = Math.pow( wrapTo, -1 ),
        mul1 = input * reciprocal,
        round = Math.round( mul1 ),
        sub = mul1 - round,
        mul2 = sub * wrapTo;

    return mul2;
}

import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

// TODO:
//  - This.
//  - Wait... it uses Math.round. And values will probably in a range
//    greater than -1 to 1. Booooo :(
class Wrap extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, wrapTo, value ) {
        super( io, 0, 1 );

        this.wrapTo = this.io.createParam( wrapTo );
        this.inputs[ 0 ] = this.io.createParam( value );


        this.reciprocal = this.io.createReciprocal( this.context.sampleRate * 0.5 );
        this.multiply1 = this.io.createMultiply();
    }

    cleanUp() {
        super();
        this.shaper.cleanUp();
        this.shaper = null;
    }
}

AudioIO.prototype.createWrap = function( wrapTo, value ) {
    return new Wrap( this, wrapTo, value );
};