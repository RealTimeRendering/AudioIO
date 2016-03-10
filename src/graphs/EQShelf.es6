import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class EQShelf extends Node {
    constructor( io, highFrequency = 2500, lowFrequency = 350, highBoost = -6, lowBoost = 0 ) {
        super( io, 1, 1 );

        this.highFrequency = this.io.createParam( highFrequency );
        this.lowFrequency = this.io.createParam( lowFrequency );
        this.highBoost = this.io.createParam( highBoost );
        this.lowBoost = this.io.createParam( lowBoost );

        this.lowShelf = this.context.createBiquadFilter();
        this.lowShelf.type = 'lowshelf';
        this.lowShelf.frequency.value = lowFrequency;
        this.lowShelf.gain.value = lowBoost;

        this.highShelf = this.context.createBiquadFilter();
        this.highShelf.type = 'highshelf';
        this.highShelf.frequency.value = highFrequency;
        this.highShelf.gain.value = highBoost;

        this.inputs[ 0 ].connect( this.lowShelf );
        this.inputs[ 0 ].connect( this.highShelf );
        this.lowShelf.connect( this.outputs[ 0 ] );
        this.highShelf.connect( this.outputs[ 0 ] );

        // Store controllable params.
        //
        // TODO:
        //  - Should these be references to param.control? This
        //    might allow defaults to be set whilst also allowing
        //    audio signal control.
        this.controls.highFrequency = this.highFrequency;
        this.controls.lowFrequency = this.lowFrequency;
        this.controls.highBoost = this.highBoost;
        this.controls.lowBoost = this.lowBoost;
    }

}

AudioIO.prototype.createEQShelf = function( highFrequency, lowFrequency, highBoost, lowBoost ) {
    return new EQShelf( this, highFrequency, lowFrequency, highBoost, lowBoost );
};

export default EQShelf;