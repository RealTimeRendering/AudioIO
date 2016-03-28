import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

// TODO:
//  - Turn arguments into controllable parameters;
class Counter extends Node {

    constructor( io, increment, limit, stepTime ) {
        super( io, 0, 1 );

        this.running = false;

        // this.stepTime = stepTime || 1 / this.context.sampleRate;

        this.controls.increment = this.io.createParam( increment );
        this.controls.limit = this.io.createParam( limit );
        this.controls.stepTime = this.io.createParam( stepTime || 1 / this.context.sampleRate );

        this.multiply = this.io.createMultiply();

        this.delay = this.context.createDelay();
        this.controls.stepTime.connect( this.delay.delayTime );

        this.feedback = this.context.createGain();
        this.feedback.gain.value = 0;
        this.feedback.connect( this.delay );

        this.multiply.connect( this.delay );
        this.delay.connect( this.feedback );
        this.feedback.connect( this.delay );

        this.lessThan = this.io.createLessThan();
        this.controls.limit.connect( this.lessThan.controls.value );
        this.delay.connect( this.lessThan );
        // this.lessThan.connect( this.feedback.gain );
        this.controls.increment.connect( this.multiply, 0, 0 );
        this.lessThan.connect( this.multiply, 0, 1 );

        // Clamp from 0 to `limit` value.
        // this.clamp = this.io.createClamp( 0 );
        // this.controls.limit.connect( this.clamp.controls.max );

        this.delay.connect( this.outputs[ 0 ] );

    }

    reset() {
        var self = this;

        this.stop();

        setTimeout( function() {
            self.start();
        }, 16 );
    }

    start() {
        if( this.running === false ) {
            this.running = true;
            // this.delay.delayTime.value = this.stepTime;
            this.lessThan.connect( this.feedback.gain );
        }
    }

    stop() {
        if( this.running === true ) {
            this.running = false;
            this.lessThan.disconnect( this.feedback.gain );
            // this.delay.delayTime.value = 0;
        }
    }

    cleanUp() {
        super();
    }
}

AudioIO.prototype.createCounter = function( increment, limit, stepTime ) {
    return new Counter( this, increment, limit, stepTime );
};