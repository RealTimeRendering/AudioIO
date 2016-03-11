import "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

// gain(+100000) -> shaper( <= 0: 1, 1 )
class EqualTo extends Node {
    constructor( io, value ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        // TODO
        //  - Rename this.
        graph.value = this.io.createParam( value ),
        graph.inversion = this.context.createGain();

        graph.inversion.gain.value = -1;

        // This curve outputs 0.5 when input is 0,
        // so it has to be piped into a node that
        // transforms it into 1, and leaves zeros
        // alone.
        graph.shaper = this.io.createWaveShaper( this.io.curves.EqualToZero );

        graph.greaterThanZero = this.io.createGreaterThanZero();
        graph.value.connect( graph.inversion );
        graph.inversion.connect( this.inputs[ 0 ] );

        this.inputs[ 0 ].connect( graph.shaper );
        graph.shaper.connect( graph.greaterThanZero );
        graph.greaterThanZero.connect( this.outputs[ 0 ] );

        this.controls.value = graph.value;

        this.setGraph( graph );

    }

    get value() {
        return this.controls.value.value;
    }
    set value( value ) {
        this.controls.value.setValueAtTime( value, this.context.currentTime );
    }
}

AudioIO.prototype.createEqualTo = function( value ) {
    return new EqualTo( this, value );
};

export default EqualTo;