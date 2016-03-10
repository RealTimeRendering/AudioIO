import "../core/AudioIO.es6";
import _setIO from "../mixins/setIO.es6";

class OscillatorGenerator {
    constructor( io, frequency, detune, velocity, glideTime, waveform ) {
        this._setIO( io );

        this.frequency = frequency;
        this.detune = detune;
        this.velocity = velocity;
        this.glideTime = glideTime;
        this.wave = waveform || 'sine';
        this.resetTimestamp = 0.0;

        this.generator = this.context.createOscillator(),
        this.velocityGraph = this._makeVelocityGraph( velocity );
        this.outputs = [ this.context.createGain() ];
        this.reset( this.frequency, this.detune, this.velocity, this.glideTime, this.wave );

        this.generator.connect( this.velocityGraph );
        this.velocityGraph.connect( this.outputs[ 0 ] );
    }

    _makeVelocityGraph() {
        var gain = this.context.createGain();
        return gain;
    }

    _resetVelocityGraph( velocity ) {
        this.velocityGraph.gain.value = velocity;
    }

    _cleanUpVelocityGraph() {
        this.velocityGraph.disconnect();
        this.outputs[ 0 ].disconnect();
        this.velocityGraph = null;
        this.outputs[ 0 ] = null;
        this.outputs = null;
    }

    lerp( start, end, delta ) {
        return start + ( ( end - start ) * delta );
    }

    reset( frequency, detune, velocity, glideTime, wave ) {
        var now = this.context.currentTime;

        frequency = typeof frequency === 'number' ? frequency : this.frequency;
        detune = typeof detune === 'number' ? detune : this.detune;
        velocity = typeof velocity === 'number' ? velocity : this.velocity;
        wave = typeof wave === 'number' ? wave : this.wave;

        var glideTime = typeof glideTime === 'number' ? glideTime : 0;

        this._resetVelocityGraph( velocity );

        this.generator.frequency.cancelScheduledValues( now );
        this.generator.detune.cancelScheduledValues( now );

        // now += 0.1

        // if ( this.glideTime !== 0.0 ) {
        //     var startFreq = this.frequency,
        //         endFreq = frequency,
        //         freqDiff = endFreq - startFreq,
        //         startTime = this.resetTimestamp,
        //         endTime = this.resetTimestamp + this.glideTime,
        //         currentTime = now - startTime,
        //         lerpPos = currentTime / this.glideTime,
        //         currentFreq = this.lerp( this.frequency, frequency, lerpPos );

        //     if ( currentTime < glideTime ) {
        //         console.log( 'cutoff', startFreq, currentFreq );
        //         this.generator.frequency.setValueAtTime( currentFreq, now );
        //     }


        //     console.log( startTime, endTime, now, currentTime );
        // }


        // now += 0.5;

        if ( glideTime !== 0 ) {
            this.generator.frequency.linearRampToValueAtTime( frequency, now + glideTime );
            this.generator.detune.linearRampToValueAtTime( detune, now + glideTime );
        }
        else {
            this.generator.frequency.setValueAtTime( frequency, now );
            this.generator.detune.setValueAtTime( detune, now );
        }

        if ( typeof wave === 'string' ) {
            this.generator.type = wave;
        }
        else {
            this.generator.type = this.wave;
        }

        this.resetTimestamp = now;
        this.glideTime = glideTime;
        this.frequency = frequency;
        this.detune = detune;
        this.velocity = velocity;
        this.wave = wave;
    }

    start( delay ) {
        this.generator.start( delay );
    }

    stop( delay ) {
        this.generator.stop( delay );
    }

    cleanUp() {
        this.generator.disconnect();
        this.generator = null;

        this._cleanUpVelocityGraph();
    }
}

AudioIO.mixinSingle( OscillatorGenerator.prototype, _setIO, '_setIO' );

AudioIO.prototype.createOscillatorGenerator = function( frequency, detune, velocity, glideTime, wave ) {
    return new OscillatorGenerator( this, frequency, detune, velocity, glideTime, wave );
};