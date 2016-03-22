import AudioIO from "../../core/AudioIO.es6";
import DryWetNode from "../../graphs/DryWetNode.es6";

class Chorus extends DryWetNode {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        this.controls.feedback = this.io.createParam();
        this.controls.delay1Time = this.io.createParam();
        this.controls.delay2Time = this.io.createParam();
        this.controls.highpassFrequency = this.io.createParam();
        this.controls.modFrequency = this.io.createParam();
        this.controls.modAmount = this.io.createParam();


        graph.highpassFilter = this.context.createBiquadFilter();
        graph.delay1 = this.context.createDelay();
        graph.delay2 = this.context.createDelay();
        graph.feedback1 = this.context.createGain();
        graph.feedback2 = this.context.createGain();
        graph.delayBalance = this.io.createCrossfader( 2, 1 );
        graph.mod = this.context.createOscillator();
        graph.modAmount = this.context.createGain();
        graph.modPhase = this.io.createPhaseOffset();

        graph.highpassFilter.frequency.value = 0;
        graph.highpassFilter.Q.value = 1;
        graph.highpassFilter.type = 'highpass';
        graph.delay1.delayTime.value = 0;
        graph.delay2.delayTime.value = 0;
        graph.feedback1.gain.value = 0;
        graph.feedback2.gain.value = 0;
        graph.mod.frequency.value = 0;
        graph.modAmount.gain.value = 0;

        this.controls.feedback.connect( graph.feedback1.gain );
        this.controls.feedback.connect( graph.feedback2.gain );
        this.controls.delay1Time.connect( graph.delay1.delayTime );
        this.controls.delay2Time.connect( graph.delay2.delayTime );
        this.controls.highpassFrequency.connect( graph.highpassFilter.frequency );
        this.controls.modFrequency.connect( graph.mod.frequency );
        this.controls.modFrequency.connect( graph.modPhase.controls.frequency );
        this.controls.modAmount.connect( graph.modAmount.gain );
        this.controls.modPhase = graph.modPhase.controls.phase;
        this.controls.delayBalance = graph.delayBalance.controls.index;


        // Delay 1 graph
        this.inputs[ 0 ].connect( graph.highpassFilter );
        graph.highpassFilter.connect( graph.delay1 );
        graph.delay1.connect( graph.feedback1 );
        graph.feedback1.connect( graph.delay1 );
        graph.delay1.connect( graph.delayBalance, 0, 0 );

        // Delay 2 graph
        this.inputs[ 0 ].connect( graph.delay2 );
        graph.delay2.connect( graph.feedback2 );
        graph.feedback2.connect( graph.delay2 );
        graph.delay2.connect( graph.delayBalance, 0, 1 );

        // Modulation graph
        graph.mod.connect( graph.modAmount );
        graph.modAmount.connect( graph.delay1.delayTime );
        graph.modAmount.connect( graph.modPhase );
        graph.modPhase.connect( graph.delay2.delayTime );
        graph.mod.start();

        graph.delayBalance.connect( this.wet );

        this.setGraph( graph );
    }
}

AudioIO.prototype.createChorus = function() {
    return new Chorus( this );
};

export default Chorus;