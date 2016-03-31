import AudioIO from "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

var FILTER_TYPES = [
    'lowpass',
    'bandpass',
    'highpass',
    'notch',
    'lowpass'
];

class FilterBank extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.crossfader12dB = this.io.createCrossfader( FILTER_TYPES.length, 0 );
        graph.crossfader24dB = this.io.createCrossfader( FILTER_TYPES.length, 0 );
        graph.crossfaderSlope = this.io.createCrossfader( 2, 0 );
        graph.filters12dB = [];
        graph.filters24dB = [];

        graph.proxyFrequencyControl = this.context.createGain();
        graph.proxyQControl = this.context.createGain();

        // Create the first set of 12db filters (standard issue with WebAudioAPI)
        for ( var i = 0; i < FILTER_TYPES.length; ++i ) {
            var filter = this.context.createBiquadFilter();

            filter.type = FILTER_TYPES[ i ];
            filter.frequency.value = 0;
            filter.Q.value = 0;

            graph.proxyFrequencyControl.connect( filter.frequency );
            graph.proxyQControl.connect( filter.Q );
            this.inputs[ 0 ].connect( filter );
            filter.connect( graph.crossfader12dB, 0, i );

            graph.filters12dB.push( filter );
        }

        // Create the second set of 12db filters,
        // where the first set will be piped into so we
        // end up with double the rolloff (12dB * 2 = 24dB).
        for ( var i = 0; i < FILTER_TYPES.length; ++i ) {
            var filter = this.context.createBiquadFilter();

            filter.type = FILTER_TYPES[ i ];
            filter.frequency.value = 0;
            filter.Q.value = 0;

            graph.proxyFrequencyControl.connect( filter.frequency );
            graph.proxyQControl.connect( filter.Q );
            graph.filters12dB[ i ].connect( filter );
            filter.connect( graph.crossfader24dB, 0, i );

            graph.filters24dB.push( filter );
        }

        graph.crossfader12dB.connect( graph.crossfaderSlope, 0, 0 );
        graph.crossfader24dB.connect( graph.crossfaderSlope, 0, 1 );
        graph.crossfaderSlope.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
        this.addControls( FilterBank.controlsMap );
    }
}

FilterBank.controlsMap = {
    frequency: {
        targets: 'graph.proxyFrequencyControl',
        min: 0,
        max: 'sampleRate',
        exponent: 2
    },

    Q: {
        targets: 'graph.proxyQControl',
        min: 0,
        max: 10
    },

    slope: {
        delegate: 'graph.crossfaderSlope.controls.index',
        min: 0,
        max: 1
    },

    filterType: {
        targets: [ 'graph.crossfader12dB.controls.index', 'graph.crossfader24dB.controls.index' ],
        min: 0,
        max: FILTER_TYPES.length - 1
    }
};

AudioIO.prototype.createFilterBank = function() {
    return new FilterBank( this );
};

export default FilterBank;