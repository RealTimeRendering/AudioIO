import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class PhaseOffset extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        this.reciprocal = this.io.createReciprocal( this.context.sampleRate * 0.5 );
        this.delay = this.context.createDelay();
        this.multiply = this.io.createMultiply();
        this.frequency = this.io.createParam();
        this.phase = this.io.createParam();
        this.halfPhase = this.io.createMultiply( 0.5 );

        this.delay.delayTime.value = 0;

        this.frequency.connect( this.reciprocal );
        this.reciprocal.connect( this.multiply, 0, 0 );
        this.phase.connect( this.halfPhase );
        this.halfPhase.connect( this.multiply, 0, 1 );
        this.multiply.connect( this.delay.delayTime );

        this.inputs[ 0 ].connect( this.outputs[ 0 ] );
        this.inputs[ 0 ].connect( this.delay );
        this.delay.connect( this.outputs[ 0 ] );

        this.outputs[ 0 ].gain.value = 0.5;

        // Store controllable params.
        this.controls.frequency = this.frequency;
        this.controls.phase = this.phase;
    }

}

AudioIO.prototype.createPhaseOffset = function() {
    return new PhaseOffset( this );
};

export default PhaseOffset;