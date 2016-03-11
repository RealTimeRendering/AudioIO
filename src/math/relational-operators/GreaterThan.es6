import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class GreaterThan extends Node {
    constructor( io, value ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        this.controls.value = this.io.createParam( value );
        graph.inversion = this.context.createGain();

        graph.inversion.gain.value = -1;

        this.inputs[ 0 ].gain.value = 100000;
        graph.shaper = this.io.createWaveShaper( this.io.curves.GreaterThanZero );


        this.controls.value.connect( graph.inversion );
        graph.inversion.connect( this.inputs[ 0 ] );
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

AudioIO.prototype.createGreaterThan = function( value ) {
    return new GreaterThan( this, value );
};