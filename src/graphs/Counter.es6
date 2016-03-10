import "../core/AudioIO.es6";
import Node from "../core/Node.es6";


class Counter extends Node {

    constructor( io, increment, limit, stepTime ) {
        super( io, 0, 1 );

        this.constant = this.io.createParam( increment );
        this.multiply = this.io.createMultiply();

        this.delay = this.context.createDelay();
        this.delay.delayTime.value = stepTime || 1 / this.context.sampleRate;

        this.feedback = this.context.createGain();
        this.feedback.gain.value = 0;
        this.feedback.connect( this.delay );

        this.multiply.connect( this.delay );
        this.delay.connect( this.feedback );
        this.feedback.connect( this.delay );

        this.lessThan = this.io.createLessThan( limit );
        this.delay.connect( this.lessThan );
        this.lessThan.connect( this.feedback.gain );
        this.constant.connect( this.multiply, 0, 0 );
        this.lessThan.connect( this.multiply, 0, 1 );

        this.delay.connect( this.outputs[ 0 ] );
    }

    cleanUp() {
        super();
    }
}

AudioIO.prototype.createCounter = function( increment, limit, stepTime ) {
    return new Counter( this, increment, limit, stepTime );
};