import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";

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

        graph.crossfader = this.io.createCrossfader( FILTER_TYPES.length, 0 );
        graph.filters = [];

        this.controls.frequency = this.io.createParam();
        this.controls.Q = this.io.createParam();
        this.controls.filterType = graph.crossfader.controls.index;

        for ( var i = 0; i < FILTER_TYPES.length; ++i ) {
            var filter = this.context.createBiquadFilter();

            filter.type = FILTER_TYPES[ i ];
            filter.frequency.value = 0;
            filter.Q.value = 0;

            this.controls.frequency.connect( filter.frequency );
            this.controls.Q.connect( filter.Q );
            this.inputs[ 0 ].connect( filter );
            filter.connect( graph.crossfader, 0, i );

            graph.filters.push( filter );
        }

        graph.crossfader.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createFilterBank = function() {
    return new FilterBank( this );
};

export default FilterBank;