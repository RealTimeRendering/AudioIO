import AudioIO from "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

class AllPassFilter extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.crossfaderSlope = this.io.createCrossfader( 2, 0 );
        graph.lp12dB = this.context.createBiquadFilter();
        graph.lp24dB = this.context.createBiquadFilter();

        graph.lp12dB.type = 'allpass';
        graph.lp24dB.type = 'allpass';
        graph.lp12dB.frequency.value = 0;
        graph.lp24dB.frequency.value = 0;
        graph.lp12dB.Q.value = 0;
        graph.lp24dB.Q.value = 0;

        this.inputs[ 0 ].connect( graph.lp12dB );
        graph.lp12dB.connect( graph.crossfaderSlope, 0, 0 );
        graph.lp12dB.connect( graph.lp24dB );
        graph.lp24dB.connect( graph.crossfaderSlope, 0, 1 );
        graph.crossfaderSlope.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
        this.addControls( AllPassFilter.controlsMap );
    }
}

AllPassFilter.controlsMap = {
    slope: {
        delegate: 'graph.crossfaderSlope.controls.index',
        min: 0,
        max: 1
    },

    frequency: {
        targets: [ 'graph.lp12dB.frequency', 'graph.lp24dB.frequency' ],
        min: 0,
        max: 'sampleRate',
        exponent: 2
    },

    Q: {
        targets: [ 'graph.lp12dB.Q', 'graph.lp12dB.Q' ],
        min: 0,
        max: 20
    }
};

AudioIO.prototype.createAllPassFilter = function() {
    return new AllPassFilter( this );
};

export default AllPassFilter;