import "../core/AudioIO.es6";
import OscillatorBank from "../graphs/OscillatorBank.es6";

class PMOscillator extends OscillatorBank {

    constructor( io ) {
        super( io );

        var graph = this.getGraph( this );

        graph.switch.disconnect( this.outputs[ 0 ] );

        graph.phaseOffset = this.io.createPhaseOffset();
        this.controls.frequency.connect( graph.phaseOffset.controls.frequency );


        this.setGraph( graph );
    }
}

AudioIO.prototype.createPMOscillator = function() {
    return new PMOscillator( this );
};