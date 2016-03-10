import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class FrequencyModulator extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        this.value = this.io.createParam();
        this.frequency = this.io.createParam();

        this.oscillator = this.context.createOscillator();

        this.controls = {
            value: this.value,
            frequency: this.frequency
        };
    }

}

AudioIO.prototype.createFrequencyModulator = function() {
    return new FrequencyModulator( this );
};

export default FrequencyModulator;