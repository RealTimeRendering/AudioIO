import AudioIO from "../core/AudioIO.es6";
import DryWetNode from "../graphs/DryWetNode.es6";

// TODO: Add feedbackLevel and delayTime Param instances
// to control this node.
class SineShaper extends DryWetNode {
    constructor( io ) {
        super( io );

        this.controls.drive = this.io.createParam();
        this.shaper = this.io.createWaveShaper( this.io.curves.Sine );
        this.shaperDrive = this.context.createGain();
        this.shaperDrive.gain.value = 1;

        this.inputs[ 0 ].connect( this.shaperDrive );
        this.controls.drive.connect( this.shaperDrive.gain );
        this.shaperDrive.connect( this.shaper );
        this.shaper.connect( this.wet );
    }
}

AudioIO.prototype.createSineShaper = function( time, feedbackLevel ) {
    return new SineShaper( this, time, feedbackLevel );
};

export default SineShaper;