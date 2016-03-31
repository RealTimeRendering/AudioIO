import AudioIO from "../core/AudioIO.es6";
import _setIO from "../mixins/setIO.es6";
import connections from "../mixins/connections.es6";
import cleaners from "../mixins/cleaners.es6";
import Node from "../core/Node.es6";


// This function creates a graph that allows morphing
// between two gain nodes.
//
// It looks a little bit like this:
//
//                 dry -> ---------------------------------------------> |
//                            |                                             v
//                            v  Gain(0-1)    ->     Gain(-1)     ->     output
//                               (fader)         (invert phase)        (summing)
//                            ^
//    wet ->   Gain(-1)   -> -|
//          (invert phase)
//
// When adjusting the fader's gain value in this graph,
// input1's gain level will change from 0 to 1,
// whilst input2's gain level will change from 1 to 0.
class DryWetNode extends Node {
    constructor( io ) {
        super( io, 2, 1 );

        var graph = this.getGraph();

        this.dry = this.inputs[ 0 ];
        this.wet = this.inputs[ 1 ];

        // Invert wet signal's phase
        graph.wetInputInvert = this.context.createGain();
        graph.wetInputInvert.gain.value = -1;
        this.wet.connect( graph.wetInputInvert );

        // Create the fader node
        graph.fader = this.context.createGain();
        graph.fader.gain.value = 0;
        // Invert the fader node's phase
        graph.faderInvert = this.context.createGain();
        graph.faderInvert.gain.value = -1;

        // Connect fader to fader phase inversion,
        // and fader phase inversion to output.
        graph.wetInputInvert.connect( graph.fader );
        graph.fader.connect( graph.faderInvert );
        graph.faderInvert.connect( this.outputs[ 0 ] );

        // Connect dry input to both the output and the fader node
        this.dry.connect( this.outputs[ 0 ] );
        this.dry.connect( graph.fader );

        this.setGraph( graph );
        this.addControls( DryWetNode.controlsMap );
    }
}

DryWetNode.controlsMap = {
    dryWet: {
        targets: 'graph.fader.gain',
        min: 0,
        max: 1
    }
};




AudioIO.prototype.createDryWetNode = function() {
    return new DryWetNode( this );
};

export default DryWetNode;
