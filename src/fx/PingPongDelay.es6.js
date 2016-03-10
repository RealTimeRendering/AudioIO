import AudioIO from "../core/AudioIO.es6";
import _setIO from "../mixins/setIO.es6";
import connections from "../mixins/connections.es6";
import cleaners from "../mixins/cleaners.es6";
import DryWetNode from "../graphs/DryWetNode.es6";
import Delay from "./Delay.es6";

// TODO:
//  - Convert this node to use Param controls
//    for time and feedback.

class PingPongDelay extends DryWetNode {
    constructor( io, time = 0.25, feedbackLevel = 0.5 ) {
        super( io, 1, 1 );

        // Create channel splitter and merger
        this.splitter = this.context.createChannelSplitter( 2 );
        this.merger = this.context.createChannelMerger( 2 );

        // Create feedback and delay nodes
        this.feedbackL = this.context.createGain();
        this.feedbackR = this.context.createGain();
        this.delayL = this.context.createDelay();
        this.delayR = this.context.createDelay();

        // Setup the feedback loop
        this.delayL.connect( this.feedbackL );
        this.feedbackL.connect( this.delayR );
        this.delayR.connect( this.feedbackR );
        this.feedbackR.connect( this.delayL );


        this.inputs[ 0 ].connect( this.splitter );
        this.splitter.connect( this.delayL, 0 );
        this.feedbackL.connect( this.merger, 0, 0 );
        this.feedbackR.connect( this.merger, 0, 1 );
        this.merger.connect( this.wet );

        this.time = time;
        this.feedbackLevel = feedbackLevel;
    }

    get time() {
        return this.delayL.delayTime;
    }

    set time( value ) {
        this.delayL.delayTime.linearRampToValueAtTime(
            value,
            this.context.currentTime + 0.5
        );

        this.delayR.delayTime.linearRampToValueAtTime(
            value,
            this.context.currentTime + 0.5
        );
    }

    get feedbackLevel() {
        return this.feedbackL.gain.value;
    }

    set feedbackLevel( level ) {
        this.feedbackL.gain.value = level;
        this.feedbackR.gain.value = level;
    }
}

AudioIO.mixinSingle( PingPongDelay.prototype, _setIO, '_setIO' );
AudioIO.mixin( PingPongDelay.prototype, connections );
AudioIO.mixin( PingPongDelay.prototype, cleaners );

AudioIO.prototype.createPingPongDelay = function( time, feedbackLevel ) {
    return new PingPongDelay( this, time, feedbackLevel );
};