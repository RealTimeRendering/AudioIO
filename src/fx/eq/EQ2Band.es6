import AudioIO from "../../core/AudioIO.es6";
import CustomEQ from "./CustomEQ.es6";


class EQ2Band extends CustomEQ {
	constructor( io ) {
		super( io );

		var lowshelf = this.addFilter( 'lowshelf' ),
			highshelf = this.addFilter( 'highshelf' );

		this.controls.crossoverFrequency = this.io.createParam();
		this.controls.crossoverFrequency.connect( lowshelf.controls.frequency );
		this.controls.crossoverFrequency.connect( highshelf.controls.frequency );

		this.controls.Q = this.io.createParam();
		this.controls.Q.connect( lowshelf.controls.Q );
		this.controls.Q.connect( highshelf.controls.Q );

		this.controls.lowGain = this.io.createParam();
		this.controls.lowGain.connect( lowshelf.controls.gain );

		this.controls.highGain = this.io.createParam();
		this.controls.highGain.connect( highshelf.controls.gain );
	}
}


AudioIO.prototype.createEQ2Band = function() {
    return new EQ2Band( this );
};
