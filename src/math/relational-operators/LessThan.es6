import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class LessThan extends Node {
    constructor( io, value ) {
        super( io, 1, 0 );

        this.controls.value = this.io.createParam( value );

        this.valueInversion = this.context.createGain();
        this.valueInversion.gain.value = -1;

        this.controls.value.connect( this.valueInversion );

        this.inputs[ 0 ].gain.value = -100000;
        this.outputs[ 0 ] = this.io.createWaveShaper( this.io.curves.GreaterThanZero );

        this.valueInversion.connect( this.inputs[ 0 ] );
        this.inputs[ 0 ].connect( this.outputs[ 0 ] );
    }

    cleanUp() {
        super();
        this.controls.value.cleanUp();
        this.controls.value = null;
    }

    get value() {
        return this.controls.value.value;
    }
    set value( value ) {
        this.controls.value.setValueAtTime( value, this.context.currentTime );
    }
}

AudioIO.prototype.createLessThan = function( value ) {
    return new LessThan( this, value );
};