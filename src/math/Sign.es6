import "../core/AudioIO.es6";
import Node from "../core/Node.es6";


class Sign extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io, 1, 1 );

        this.shaper = this.io.createWaveShaper( function( x ) {
            return Math.sign( x );
        }, 4096 );

        this.ifElse = this.io.createIfElse();
        this.equalToZero = this.io.createEqualToZero();

        this.inputs[ 0 ].connect( this.equalToZero );
        this.inputs[ 0 ].connect( this.ifElse.then );
        this.inputs[ 0 ].connect( this.shaper );

        this.equalToZero.connect( this.ifElse.if );
        this.shaper.connect( this.ifElse.else );
        this.ifElse.connect( this.outputs[ 0 ] );
    }


    cleanUp() {
        super();
        this.shaper.cleanUp();
        this.shaper = null;
    }
}

AudioIO.prototype.createSign = function( accuracy ) {
    return new Sign( this, accuracy );
};
