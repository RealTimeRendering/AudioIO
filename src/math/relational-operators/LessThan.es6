import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class LessThan extends Node {
    constructor( io, value ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        this.controls.value = this.io.createParam( value );

        graph.valueInversion = this.context.createGain();
        graph.valueInversion.gain.value = -1;

        this.controls.value.connect( graph.valueInversion );

        this.inputs[ 0 ].gain.value = -100000;
        graph.shaper = this.io.createWaveShaper( this.io.curves.GreaterThanZero );

        graph.valueInversion.connect( this.inputs[ 0 ] );
        this.inputs[ 0 ].connect( graph.shaper );
        graph.shaper.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
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