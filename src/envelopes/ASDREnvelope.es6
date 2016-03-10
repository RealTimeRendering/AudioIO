import "../core/AudioIO.es6";
import CustomEnvelope from "./CustomEnvelope.es6";

class ASDREnvelope extends CustomEnvelope {
    constructor( io ) {
        super( io );

        this.times = {
            attack: 0.01,
            decay: 0.5,
            release: 0.5
        };

        this.levels = {
            initial: 0,
            peak: 1,
            sustain: 1,
            release: 0
        };

        this.addStartStep( 'initial', 0, this.levels.initial );
        this.addStartStep( 'attack', this.times.attack, this.levels.peak );
        this.addStartStep( 'decay', this.times.decay, this.levels.sustain );
        this.addEndStep( 'release', this.times.release, this.levels.release, true );
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


    get releaseTime() {
        return this.times.release;
    }
    set releaseTime( time ) {
        if ( typeof time === 'number' ) {
            this.times.release = time;
            this.setStepTime( 'release', time );
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


    get sustainLevel() {
        return this.levels.sustain;
    }
    set sustainLevel( level ) {
        if ( typeof level === 'number' ) {
            this.levels.sustain = level;
            this.setStepLevel( 'decay', level );
        }
    }


    get releaseLevel() {
        return this.levels.release;
    }
    set releaseLevel( level ) {
        if ( typeof level === 'number' ) {
            this.levels.release = level;
            this.setStepLevel( 'release', level );
        }
    }
}

AudioIO.prototype.createASDREnvelope = function() {
    return new ASDREnvelope( this );
};

export default ASDREnvelope;