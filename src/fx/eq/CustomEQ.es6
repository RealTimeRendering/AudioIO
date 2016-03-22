import AudioIO from "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

var FILTER_STORE = new WeakMap();

function createFilter( io, type ) {
    var graph = {
        filter: io.context.createBiquadFilter(),
        controls: {},
        type: undefined
    };

    graph.filter.frequency.value = 0;
    graph.filter.Q.value = 0;

    graph.controls.frequency = io.createParam();
    graph.controls.Q = io.createParam();

    graph.controls.frequency.connect( graph.filter.frequency );
    graph.controls.Q.connect( graph.filter.Q );

    graph.setType = function( type ) {
        this.type = type;

        switch ( type ) {
            case 'LP12':
                this.filter.type = 'lowpass';
                break;

            case 'notch':
                this.filter.type = 'notch';
                break;

            case 'HP12':
                this.filter.type = 'highpass';
                break;

                // Fall through to handle those filter
                // types with `gain` AudioParams.
            case 'lowshelf':
                this.filter.type = 'lowshelf';
            case 'highshelf':
                this.filter.type = 'highshelf';
            case 'peaking':
                this.filter.type = 'peaking';
                this.filter.gain.value = 0;
                this.controls.gain = io.createParam();
                break;
        }
    };

    graph.setType( type );

    return graph;
}

class CustomEQ extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        // Initially, this Node is just a pass-through
        // until filters are added.
        this.inputs[ 0 ].connect( this.outputs[ 0 ] );
    }

    addFilter( type ) {
        var filterGraph = createFilter( this.io, type ),
            filters = FILTER_STORE.get( this ) || [];

        // If this is the first filter being added,
        // make sure input is connected and filter
        // is then connected to output.
        if ( filters.length === 0 ) {
            this.inputs[ 0 ].disconnect( this.outputs[ 0 ] );
            this.inputs[ 0 ].connect( filterGraph.filter );
            filterGraph.filter.connect( this.outputs[ 0 ] );
        }

        // If there are already filters, the last filter
        // in the graph will need to be disconnected form
        // the output before the new filter is connected.
        else {
            filters[ filters.length - 1 ].filter.disconnect( this.outputs[ 0 ] );
            filters[ filters.length - 1 ].filter.connect( filterGraph.filter );
            filterGraph.filter.connect( this.outputs[ 0 ] );
        }

        // Store the filter and save the new filters object
        // (it needs to be saved in case this is the first
        // filter being added, and very little overhead to
        // calling `set` if it's not the first filter being
        // added).
        filters.push( filterGraph );
        FILTER_STORE.set( this, filters );

        return filterGraph;
    }

    getFilter( index ) {
        return FILTER_STORE.get( this )[ index ];
    }

    getAllFilters() {
        return FILTER_STORE.get( this );
    }

    removeFilter( filterGraph ) {
        var filters = FILTER_STORE.get( this ),
            index = filters.indexOf( filterGraph );

        return this.removeFilterAtIndex( index );
    }

    removeFilterAtIndex( index ) {
        var filters = FILTER_STORE.get( this );


        if ( !filters[ index ] ) {
            console.warn( 'No filter at the given index:', index, filters );
            return false;
        }

        // disconnect the requested filter
        // and remove it from the filters array.
        filters[ index ].filter.disconnect();
        filters.splice( index, 1 );

        // If all filters have been removed, connect the
        // input to the output so audio still passes through.
        if ( filters.length === 0 ) {
            this.inputs[ 0 ].connect( this.outputs[ 0 ] );
        }

        // If the first filter has been removed, and there
        // are still filters in the array, connect the input
        // to the new first filter.
        else if ( index === 0 ) {
            this.inputs[ 0 ].connect( filters[ 0 ].filter );
        }

        // If the last filter has been removed, the
        // new last filter must be connected to the output
        else if ( index === filters.length ) {
            filters[ filters.length - 1 ].filter.connect( this.outputs[ 0 ] );
        }

        // Otherwise, the index of the filter that's been
        // removed isn't the first, last, or only index in the
        // array, so connect the previous filter to the new
        // one at the given index.
        else {
            filters[ index - 1 ].filter.connect( filters[ index ].filter );
        }

        FILTER_STORE.set( this, filters );

        return this;
    }

    removeAllFilters() {
        var filters = FILTER_STORE.get( this );

        for ( var i = filters.length - 1; i >= 0; --i ) {
            this.removeFilterAtIndex( i );
        }

        return this;
    }
}

AudioIO.prototype.createCustomEQ = function() {
    return new CustomEQ( this );
};

export default CustomEQ;