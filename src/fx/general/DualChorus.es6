import AudioIO from "../../core/AudioIO.es6";
import DryWetNode from "../../graphs/DryWetNode.es6";

class DualChorus extends DryWetNode {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        // Create nodes.
        graph.ensureStereoInput = this.context.createChannelMerger( 2 );
        graph.splitter = this.context.createChannelSplitter( 2 );
        graph.delay1L = this.context.createDelay();
        graph.delay1R = this.context.createDelay();
        graph.feedback1L = this.context.createGain();
        graph.feedback1R = this.context.createGain();
        graph.delay2L = this.context.createDelay();
        graph.delay2R = this.context.createDelay();
        graph.feedback2L = this.context.createGain();
        graph.feedback2R = this.context.createGain();
        graph.merger = this.context.createChannelMerger( 2 );
        graph.mod = this.context.createOscillator();
        graph.mod1Amount = this.context.createGain();
        graph.mod2Amount = this.context.createGain();
        graph.mod1Phase = this.io.createPhaseOffset();
        graph.mod2Phase = this.io.createPhaseOffset();
        graph.highpassFilterL = this.context.createBiquadFilter();
        graph.highpassFilterR = this.context.createBiquadFilter();

        // Zero out param values that will be controled
        // by Param instances.
        graph.delay1L.delayTime.value = 0;
        graph.delay1R.delayTime.value = 0;
        graph.feedback1L.gain.value = 0;
        graph.feedback1R.gain.value = 0;
        graph.delay2L.delayTime.value = 0;
        graph.delay2R.delayTime.value = 0;
        graph.feedback2L.gain.value = 0;
        graph.feedback2R.gain.value = 0;
        graph.mod.frequency.value = 0;
        graph.mod1Amount.gain.value = 0;
        graph.mod2Amount.gain.value = 0;
        graph.highpassFilterL.frequency.value = 0;
        graph.highpassFilterL.Q.value = 1;
        graph.highpassFilterR.frequency.value = 0;
        graph.highpassFilterR.Q.value = 1;
        graph.highpassFilterL.type = 'highpass';
        graph.highpassFilterR.type = 'highpass';

        // Main graph.
        this.inputs[ 0 ].connect( graph.ensureStereoInput, 0, 0 );
        this.inputs[ 0 ].connect( graph.ensureStereoInput, 0, 1 );
        graph.ensureStereoInput.connect( graph.splitter );
        graph.splitter.connect( graph.highpassFilterL, 0 );
        graph.splitter.connect( graph.highpassFilterR, 1 );
        graph.highpassFilterL.connect( graph.delay1L );
        graph.highpassFilterR.connect( graph.delay1R );
        graph.splitter.connect( graph.delay2L, 0 );
        graph.splitter.connect( graph.delay2R, 1 );

        graph.delay1L.connect( graph.feedback1L );
        graph.delay1R.connect( graph.feedback1R );
        graph.feedback1L.connect( graph.delay1R );
        graph.feedback1R.connect( graph.delay1L );
        graph.delay1L.connect( graph.merger, 0, 0 );
        graph.delay1R.connect( graph.merger, 0, 1 );

        graph.delay2L.connect( graph.feedback1L );
        graph.delay2R.connect( graph.feedback1R );
        graph.feedback2L.connect( graph.delay2R );
        graph.feedback2R.connect( graph.delay2L );
        graph.delay2L.connect( graph.merger, 0, 0 );
        graph.delay2R.connect( graph.merger, 0, 1 );

        graph.merger.connect( this.wet );

        // Modulation graph
        graph.mod.connect( graph.mod1Amount );
        graph.mod.connect( graph.mod2Amount );
        graph.mod1Amount.connect( graph.delay1L.delayTime );
        graph.mod2Amount.connect( graph.delay2L.delayTime );
        graph.mod1Amount.connect( graph.mod1Phase );
        graph.mod2Amount.connect( graph.mod2Phase );
        graph.mod1Phase.connect( graph.delay1R.delayTime );
        graph.mod2Phase.connect( graph.delay2R.delayTime );
        graph.mod.start();

        // Create controls
        this.controls.delay1Time = this.io.createParam();
        this.controls.delay2Time = this.io.createParam();
        this.controls.feedback = this.io.createParam();
        this.controls.highpassFrequency = this.io.createParam();
        this.controls.modFrequency = this.io.createParam();
        this.controls.mod1Amount = this.io.createParam();
        this.controls.mod2Amount = this.io.createParam();
        this.controls.mod1Phase = graph.mod1Phase.controls.phase;
        this.controls.mod2Phase = graph.mod2Phase.controls.phase;

        // Connect controls.
        this.controls.delay1Time.connect( graph.delay1L.delayTime );
        this.controls.delay1Time.connect( graph.delay1R.delayTime );
        this.controls.delay2Time.connect( graph.delay2L.delayTime );
        this.controls.delay2Time.connect( graph.delay2R.delayTime );
        this.controls.feedback.connect( graph.feedback1L.gain );
        this.controls.feedback.connect( graph.feedback1R.gain );
        this.controls.feedback.connect( graph.feedback2L.gain );
        this.controls.feedback.connect( graph.feedback2R.gain );
        this.controls.highpassFrequency.connect( graph.highpassFilterL.frequency );
        this.controls.highpassFrequency.connect( graph.highpassFilterR.frequency );
        this.controls.modFrequency.connect( graph.mod.frequency );
        this.controls.modFrequency.connect( graph.mod1Phase.controls.frequency );
        this.controls.modFrequency.connect( graph.mod2Phase.controls.frequency );
        this.controls.mod1Phase.connect( graph.mod1Phase.controls.phase );
        this.controls.mod2Phase.connect( graph.mod2Phase.controls.phase );
        this.controls.mod1Amount.connect( graph.mod1Amount.gain );
        this.controls.mod2Amount.connect( graph.mod2Amount.gain );



        this.setGraph( graph );
    }
}

AudioIO.prototype.createDualChorus = function() {
    return new DualChorus( this );
};

export default DualChorus;