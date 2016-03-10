import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class GreaterThan extends Node {
    constructor( io, value ) {
        super( io, 1, 0 );

        this.controls.value = this.io.createParam( value );
        this.inversion = this.context.createGain();

        this.inversion.gain.value = -1;

        this.inputs[ 0 ].gain.value = 100000;
        this.outputs[ 0 ] = this.io.createWaveShaper( this.io.curves.GreaterThanZero );


        this.controls.value.connect( this.inversion );
        this.inversion.connect( this.inputs[ 0 ] );
        this.inputs[ 0 ].connect( this.outputs[ 0 ] );
    }


    cleanUp() {
        super();

        this.controls.value.cleanUp();
        this.controls.value = null;

        this.inversion.disconnect();
        this.inversion = null;
    }

    get value() {
        return this.controls.value.value;
    }
    set value( value ) {
        this.controls.value.setValueAtTime( value, this.context.currentTime );
    }
}

AudioIO.prototype.createGreaterThan = function( value ) {
    return new GreaterThan( this, value );
};