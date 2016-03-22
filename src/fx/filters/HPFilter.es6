import AudioIO from "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class HPFilter extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.crossfaderSlope = this.io.createCrossfader( 2, 0 );
        graph.lp12dB = this.context.createBiquadFilter();
        graph.lp24dB = this.context.createBiquadFilter();

        graph.lp12dB.type = 'highpass';
        graph.lp24dB.type = 'highpass';
        graph.lp12dB.frequency.value = 0;
        graph.lp24dB.frequency.value = 0;
        graph.lp12dB.Q.value = 0;
        graph.lp24dB.Q.value = 0;

        this.controls.slope = graph.crossfaderSlope.controls.index;
        this.controls.frequency = this.io.createParam();
        this.controls.Q = this.io.createParam();

        this.controls.frequency.connect( graph.lp12dB.frequency );
        this.controls.frequency.connect( graph.lp24dB.frequency );
        this.controls.Q.connect( graph.lp12dB.Q );
        this.controls.Q.connect( graph.lp24dB.Q );

        this.inputs[ 0 ].connect( graph.lp12dB );
        graph.lp12dB.connect( graph.crossfaderSlope, 0, 0 );
        graph.lp12dB.connect( graph.lp24dB );
        graph.lp24dB.connect( graph.crossfaderSlope, 0, 1 );
        graph.crossfaderSlope.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createHPFilter = function() {
    return new HPFilter( this );
};

export default HPFilter;