import AudioIO from "../../core/AudioIO.es6";
import DryWetNode from "../../graphs/DryWetNode.es6";

class SimpleChorus extends DryWetNode {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.ensureStereoInput = this.context.createChannelMerger( 2 );
        graph.splitter = this.context.createChannelSplitter( 2 );
        graph.delayL = this.context.createDelay();
        graph.delayR = this.context.createDelay();
        graph.feedbackL = this.context.createGain();
        graph.feedbackR = this.context.createGain();
        graph.merger = this.context.createChannelMerger( 2 );
        graph.mod = this.context.createOscillator();
        graph.modAmount = this.context.createGain();
        graph.modPhase = this.io.createPhaseOffset();

        graph.delayL.delayTime.value = 0;
        graph.delayR.delayTime.value = 0;
        graph.feedbackL.gain.value = 0;
        graph.feedbackR.gain.value = 0;
        graph.mod.frequency.value = 0;
        graph.modAmount.gain.value = 0;

        this.inputs[ 0 ].connect( graph.ensureStereoInput, 0, 0 );
        this.inputs[ 0 ].connect( graph.ensureStereoInput, 0, 1 );
        graph.ensureStereoInput.connect( graph.splitter );
        graph.splitter.connect( graph.delayL, 0 );
        graph.splitter.connect( graph.delayR, 1 );
        graph.delayL.connect( graph.feedbackL );
        graph.delayR.connect( graph.feedbackR );
        graph.feedbackL.connect( graph.delayR );
        graph.feedbackR.connect( graph.delayL );
        graph.delayL.connect( graph.merger, 0, 0 );
        graph.delayR.connect( graph.merger, 0, 1 );
        graph.merger.connect( this.wet );

        // Modulation graph
        graph.mod.connect( graph.modAmount );
        graph.modAmount.connect( graph.delayL.delayTime );
        graph.modAmount.connect( graph.modPhase );
        graph.modPhase.connect( graph.delayR.delayTime );
        graph.mod.start();

        // Create controls
        this.controls.delayTime = this.io.createParam();
        this.controls.feedback = this.io.createParam();
        this.controls.modFrequency = this.io.createParam();
        this.controls.modAmount = this.io.createParam();
        this.controls.modPhase = graph.modPhase.controls.phase;

        this.controls.delayTime.connect( graph.delayL.delayTime );
        this.controls.delayTime.connect( graph.delayR.delayTime );
        this.controls.feedback.connect( graph.feedbackL.gain );
        this.controls.feedback.connect( graph.feedbackR.gain );
        this.controls.modFrequency.connect( graph.mod.frequency );
        this.controls.modFrequency.connect( graph.modPhase.controls.frequency );
        this.controls.modAmount.connect( graph.modAmount.gain );


        this.setGraph( graph );
    }
}

AudioIO.prototype.createSimpleChorus = function() {
    return new SimpleChorus( this );
};

export default SimpleChorus;