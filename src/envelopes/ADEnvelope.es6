import "../core/AudioIO.es6";
import CustomEnvelope from "./CustomEnvelope.es6";

class ADEnvelope extends CustomEnvelope {
    constructor( io ) {
        super( io );

        this.times = {
            attack: 0.01,
            decay: 0.5
        };

        this.levels = {
            initial: 0,
            peak: 1
        };

        this.addStartStep( 'initial', 0, this.levels.initial );
        this.addStartStep( 'attack', this.times.attack, this.levels.peak );
        this.addEndStep( 'decay', this.times.decay, this.levels.sustain, true );
    }

    get attackTime() {
        return this.times.attack;
    }
    set attackTime( time ) {
        if ( typeof time === 'number' ) {
            this.times.attack = time;
            this.setStepTime( 'attack', time );
        }
    }


    get decayTime() {
        return this.times.decay;
    }
    set decayTime( time ) {
        if ( typeof time === 'number' ) {
            this.times.decay = time;
            this.setStepTime( 'decay', time );
        }
    }

    get initialLevel() {
        return this.levels.initial;
    }
    set initialLevel( level ) {
        if ( typeof level === 'number' ) {
            this.levels.initial = level;
            this.setStepLevel( 'initial', level );
        }
    }


    get peakLevel() {
        return this.levels.peak;
    }

    set peakLevel( level ) {
        if ( typeof level === 'number' ) {
            this.levels.peak = level;
            this.setStepLevel( 'attack', level );
        }
    }
}

AudioIO.prototype.createADEnvelope = function() {
    return new ADEnvelope( this );
};

export
default ADEnvelope;