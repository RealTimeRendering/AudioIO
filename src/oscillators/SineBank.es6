import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";


class SineBank extends Node {
    constructor( io, numSines = 4 ) {
        super( io, 0, 1 );

        var graph = this.getGraph();

        graph.oscillators = [];
        graph.harmonicMultipliers = [];
        graph.numSines = numSines;
        graph.outputLevel = this.context.createGain();
        graph.outputLevel.gain.value = 1 / numSines;

        this.controls.frequency = this.io.createParam();
        this.controls.detune = this.io.createParam();
        this.controls.harmonics = [];

        for ( var i = 0; i < numSines; ++i ) {
            var osc = this.context.createOscillator(),
                harmonicControl = this.io.createParam(),
                harmonicMultiplier = this.io.createMultiply();

            osc.type = 'sine';
            osc.frequency.value = 0;

            this.controls.frequency.connect( harmonicMultiplier, 0, 0 );
            harmonicControl.connect( harmonicMultiplier, 0, 1 );
            harmonicMultiplier.connect( osc.frequency );
            this.controls.detune.connect( osc.detune );

            this.controls.harmonics[ i ] = harmonicControl;

            osc.start( 0 );
            osc.connect( graph.outputLevel );
            graph.oscillators.push( osc );
        }

        graph.outputLevel.connect( this.outputs[ 0 ] );

        this.setGraph( graph );
    }

    start( delay = 0 ) {
        var graph = this.getGraph();
        graph.outputLevel.gain.value = 1 / graph.numSines;
    }

    stop( delay = 0 ) {
        this.getGraph().outputLevel.gain.value = 0;
    }
}

AudioIO.prototype.createSineBank = function( numSines ) {
    return new SineBank( this, numSines );
};

export
default SineBank;