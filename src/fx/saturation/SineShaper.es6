import AudioIO from "../../core/AudioIO.es6";
import DryWetNode from "../../graphs/DryWetNode.es6";

// TODO: Add feedbackLevel and delayTime Param instances
// to control this node.
class SineShaper extends DryWetNode {
    constructor( io ) {
        super( io );

        var graph = this.getGraph();

        this.controls.drive = this.io.createParam();
        graph.shaper = this.io.createWaveShaper( this.io.curves.Sine );
        graph.shaperDrive = this.context.createGain();
        graph.shaperDrive.gain.value = 1;

        this.inputs[ 0 ].connect( graph.shaperDrive );
        this.controls.drive.connect( graph.shaperDrive.gain );
        graph.shaperDrive.connect( graph.shaper );
        graph.shaper.connect( this.wet );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createSineShaper = function( time, feedbackLevel ) {
    return new SineShaper( this, time, feedbackLevel );
};

export default SineShaper;