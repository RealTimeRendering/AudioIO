import AudioIO from "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

// Frequency of a comb filter is calculated as follows:
//  delayTime = (1 / freq)
//
// E.g:
//  - For 200hz frequency
//      delayTime = (1 / 200) = 0.005s
//
// This is currently a feedback comb filter.
class CombFilterBank extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.outputLevel = this.context.createGain();
        graph.outputLevel.gain.value = 0.25;

        graph.filter = this.io.createFilterBank();

        graph.controlQProxy = this.context.createGain();
        graph.controlFilter0FrequencyProxy = this.context.createGain();
        graph.controlFilter1FrequencyProxy = this.context.createGain();
        graph.controlFilter2FrequencyProxy = this.context.createGain();
        graph.controlFilter3FrequencyProxy = this.context.createGain();

        graph.filters = [];

        for( var i = 0; i < 4; ++i ) {
            graph.filters[ i ] = this.io.createCombFilter();
            graph[ 'controlFilter' + i + 'FrequencyProxy' ].connect( graph.filters[ i ].controls.frequency );
            graph.controlQProxy.connect( graph.filters[ i ].controls.Q );
            this.inputs[ 0 ].connect( graph.filters[ i ] );
            graph.filters[ i ].connect( graph.outputLevel );
        }

        graph.outputLevel.connect( graph.filter );
        graph.filter.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
        this.addControls( CombFilterBank.controlsMap );
    }
}

// There are two controls for the delayTime AudioParam here:
//
//  - `frequency`: allows the CombFilter to resonate at the
//                 given frequency value.
//  - `delayTime`: allows for direct control of the delayTime
//                 AudioParam.
//
// Best to use only one of these at a time!
CombFilterBank.controlsMap = {
    frequency0: {
        targets: 'graph.controlFilter0FrequencyProxy',
        min: 0,
        max: 'sampleRate',
        exponent: 2
    },

    frequency1: {
        targets: 'graph.controlFilter1FrequencyProxy',
        min: 0,
        max: 'sampleRate',
        exponent: 2
    },

    frequency2: {
        targets: 'graph.controlFilter2FrequencyProxy',
        min: 0,
        max: 'sampleRate',
        exponent: 2
    },

    frequency3: {
        targets: 'graph.controlFilter3FrequencyProxy',
        min: 0,
        max: 'sampleRate',
        exponent: 2
    },

    Q: {
        delegate: 'graph.controlQProxy',
        min: 0,
        max: 1
    }
};

AudioIO.prototype.createCombFilterBank = function() {
    return new CombFilterBank( this );
};

export default CombFilterBank;