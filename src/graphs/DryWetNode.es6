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
    constructor( io, dryWetValue = 0 ) {
        super( io, 2, 1 );

        this.dry = this.inputs[ 0 ];
        this.wet = this.inputs[ 1 ];

        // Invert wet signal's phase
        this.wetInputInvert = this.context.createGain();
        this.wetInputInvert.gain.value = -1;
        this.wet.connect( this.wetInputInvert );

        // Create the fader node
        this.fader = this.context.createGain();
        this.fader.gain.value = 0;

        // Create the control node. It sets the fader's value.
        this.dryWetControl = this.io.createParam();
        this.dryWetControl.connect( this.fader.gain );

        // Invert the fader node's phase
        this.faderInvert = this.context.createGain();
        this.faderInvert.gain.value = -1;

        // Connect fader to fader phase inversion,
        // and fader phase inversion to output.
        this.wetInputInvert.connect( this.fader );
        this.fader.connect( this.faderInvert );
        this.faderInvert.connect( this.outputs[ 0 ] );

        // Connect dry input to both the output and the fader node
        this.dry.connect( this.outputs[ 0 ] );
        this.dry.connect( this.fader );

        // Add a 'dryWet' property to the controls object.
        this.controls.dryWet = this.dryWetControl;
    }

}




AudioIO.prototype.createDryWetNode = function( value ) {
    return new DryWetNode( this, value );
};

export default DryWetNode;
