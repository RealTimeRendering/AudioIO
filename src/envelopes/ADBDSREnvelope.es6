import "../core/AudioIO.es6";
import CustomEnvelope from "./CustomEnvelope.es6";

class ADBDSREnvelope extends CustomEnvelope {
    constructor( io ) {
        super( io );

        this.times = {
            attack: 0.01,
            decay1: 0.5,
            decay2: 0.5,
            release: 0.5
        };

        this.levels = {
            initial: 0,
            peak: 1,
            break: 0.5,
            sustain: 1,
            release: 0
        };

        this.addStartStep( 'initial', 0, this.levels.initial );
        this.addStartStep( 'attack', this.times.attack, this.levels.peak );
        this.addStartStep( 'decay1', this.times.decay1, this.levels.break );
        this.addStartStep( 'decay2', this.times.decay2, this.levels.sustain );
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


    get decay1Time() {
        return this.times.decay1;
    }
    set decay1Time( time ) {
        if ( typeof time === 'number' ) {
            this.times.decay1 = time;
            this.setStepTime( 'decay1', time );
        }
    }


    get decay2Time() {
        return this.times.decay2;
    }
    set decay2Time( time ) {
        if ( typeof time === 'number' ) {
            this.times.decay2 = time;
            this.setStepTime( 'decay2', time );
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

    get breakLevel() {
        return this.levels.break;
    }
    set breakLevel( level ) {
        if ( typeof level === 'number' ) {
            this.levels.break = level;
            this.setStepLevel( 'decay1', level );
        }
    }



    get sustainLevel() {
        return this.levels.sustain;
    }
    set sustainLevel( level ) {
        if ( typeof level === 'number' ) {
            this.levels.sustain = level;
            this.setStepLevel( 'decay2', level );
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

AudioIO.prototype.createADBDSREnvelope = function() {
    return new ADBDSREnvelope( this );
};

export
default ADBDSREnvelope;