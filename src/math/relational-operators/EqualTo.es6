import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

// gain(+100000) -> shaper( <= 0: 1, 1 )
class EqualTo extends Node {
    constructor( io, value ) {
        super( io, 1, 0 );

        // TODO
        //  - Rename this.
        this.control = this.io.createParam( value ),
        this.inversion = this.context.createGain();

        this.inversion.gain.value = -1;

        // This curve outputs 0.5 when input is 0,
        // so it has to be piped into a node that
        // transforms it into 1, and leaves zeros
        // alone.
        this.shaper = this.io.createWaveShaper( this.io.curves.EqualToZero );

        this.outputs[ 0 ] = this.io.createGreaterThanZero();
        this.control.connect( this.inversion );
        this.inversion.connect( this.inputs[ 0 ] );

        this.inputs[ 0 ].connect( this.shaper );
        this.shaper.connect( this.outputs[ 0 ] );

        this.controls.value = this.control;

    }

    cleanUp() {
        super();

        this.shaper.cleanUp();
        this.control.cleanUp();

        this.inversion.disconnect();
        this.inversion = null;
        this.shaper = null;
        this.control = null;
    }

    get value() {
        return this.control.value;
    }
    set value( value ) {
        this.control.setValueAtTime( value, this.context.currentTime );
    }
}

AudioIO.prototype.createEqualTo = function( value ) {
    return new EqualTo( this, value );
};

export default EqualTo;