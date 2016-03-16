import "../core/AudioIO.es6";
import Node from "../core/Node.es6";
// import _setIO from "../mixins/setIO.es6";
import math from "../mixins/math.es6";
// import Note from "../note/Note.es6";
// import Chord from "../note/Chord.es6";

//  Player
//  ======
//  Takes care of requesting GeneratorNodes be created.
//
//  Has:
//      - Polyphony (param)
//      - Unison (param)
//      - Unison detune (param)
//      - Unison phase (param)
//      - Glide mode
//      - Glide time
//      - Velocity sensitivity (param)
//      - Global tuning (param)
//
//  Methods:
//      - start( freq/note, vel, delay )
//      - stop( freq/note, vel, delay )
//
//  Properties:
//      - polyphony (number, >1)
//      - unison (number, >1)
//      - unisonDetune (number, cents)
//      - unisonPhase (number, 0-1)
//      - glideMode (string)
//      - glideTime (ms, number)
//      - velocitySensitivity (0-1, number)
//      - tuning (-64, +64, semitones)
//
class GeneratorPlayer extends Node {
    constructor( io, options ) {
        super( io, 0, 1 );

        if ( options.generator === undefined ) {
            throw new Error( 'GeneratorPlayer requires a `generator` option to be given.' );
        }

        this.generator = options.generator;

        this.polyphony = this.io.createParam( options.polyphony || 1 );

        this.unison = this.io.createParam( options.unison || 1 );
        this.unisonDetune = this.io.createParam( typeof options.unisonDetune === 'number' ? options.unisonDetune : 0 );
        this.unisonPhase = this.io.createParam( typeof options.unisonPhase === 'number' ? options.unisonPhase : 0 );
        this.unisonMode = options.unisonMode || 'centered';

        this.glideMode = options.glideMode || 'equal';
        this.glideTime = this.io.createParam( typeof options.glideTime === 'number' ? options.glideTime : 0 );

        this.velocitySensitivity = this.io.createParam( typeof options.velocitySensitivity === 'number' ? options.velocitySensitivity : 0 );

        this.tuning = this.io.createParam( typeof options.tuning === 'number' ? options.tuning : 0 );

        this.waveform = options.waveform || 'sine';

        this.envelope = options.envelope || this.io.createADSREnvelope();

        this.activeGeneratorObjects = {};
        this.activeGeneratorObjectsFlat = [];
        this.timers = [];
    }


    _createGeneratorObject( frequency, detune, velocity, glideTime, waveform ) {
        return this.generator.call( this.io, frequency, detune + this.tuning.value * 100, velocity, glideTime, waveform );
    }


    /**
     * Calculates the amount of detune (cents) to apply to a generator node
     * given an index between 0 and this.unison.value
     *
     * @param  {Number} unisonIndex Unison index.
     * @return {Number}             Detune value, in cents.
     */
    _calculateDetune( unisonIndex ) {
        var detune = 0.0,
            unisonDetune = this.unisonDetune.value;

        if ( this.unisonMode === 'centered' ) {
            var incr = unisonDetune;

            detune = incr * unisonIndex;
            detune -= incr * ( this.unison.value * 0.5 );
            detune += incr * 0.5;
        }
        else {
            var multiplier;

            // Leave the first note in the unison
            // alone, so it's detune value is the root
            // note.
            if ( unisonIndex > 0 ) {
                // Hop down negative half the unisonIndex
                if ( unisonIndex % 2 === 0 ) {
                    multiplier = -unisonIndex * 0.5;
                }
                else {
                    // Hop up n cents
                    if ( unisonIndex > 1 ) {
                        unisonIndex = this.Math.roundToMultiple( unisonIndex, 2 ) - 2;
                    }

                    multiplier = unisonIndex;
                }

                // Now that we have the multiplier, calculate the detune value
                // for the given unisonIndex.
                detune = unisonDetune * multiplier;
            }
        }

        return detune;
    }

    _calculateGlideTime( oldFreq, newFreq ) {
        var mode = this.glideMode,
            time = this.glideTime.value,
            glideTime,
            freqDifference;

        if ( time === 0.0 ) {
            glideTime = 0.0;
        }

        if ( mode === 'equal' ) {
            glideTime = time * 0.001;
        }
        else {
            freqDifference = Math.abs( oldFreq - newFreq );
            freqDifference = this.Math.clamp( freqDifference, 0, 500 );
            glideTime = this.Math.scaleNumberExp(
                freqDifference,
                0,
                500,
                0,
                time
            ) * 0.001;
        }

        return glideTime;
    }


    _storeGeneratorObject( frequency, generatorObject ) {
        var objects = this.activeGeneratorObjects;

        objects[ frequency ] = objects[ frequency ] || [];
        objects[ frequency ].unshift( generatorObject );
        this.activeGeneratorObjectsFlat.unshift( generatorObject );
    }

    _fetchGeneratorObject( frequency ) {
        var objects = this.activeGeneratorObjects[ frequency ],
            index = 0;

        if ( !objects || objects.length === 0 ) {
            return null;
        }

        this.activeGeneratorObjectsFlat.pop();
        return objects.pop();
    }

    _fetchGeneratorObjectToReuse() {
        var generator = this.activeGeneratorObjectsFlat.pop(),
            frequency;

        console.log( 'reuse', generator );

        if ( Array.isArray( generator ) ) {
            frequency = generator[ 0 ].frequency;

            for ( var i = 0; i < generator.length; ++i ) {
                this.envelope.forceStop( generator[ i ].outputs[ 0 ].gain );
                clearTimeout( generator[ i ].timer );
            }
        }
        else {
            frequency = generator.frequency;
            this.envelope.forceStop( generator.outputs[ 0 ].gain );
            clearTimeout( generator.timer );
        }

        this.activeGeneratorObjects[ frequency ].pop();

        return generator;
    }


    _startGeneratorObject( generatorObject, delay ) {
        generatorObject.outputs[ 0 ].connect( this.outputs[ 0 ] );
        this.envelope.start( generatorObject.outputs[ 0 ].gain, delay );
        generatorObject.start( delay );
    }

    _startSingle( frequency, velocity, delay ) {
        var unison = this.unison.value,
            detune = 0.0,
            unisonGeneratorArray,
            generatorObject,
            activeGeneratorCount = this.activeGeneratorObjectsFlat.length,
            existingFrequency,
            glideTime = 0.0;

        if ( activeGeneratorCount < this.polyphony.value ) {
            if ( unison === 1.0 ) {
                generatorObject = this._createGeneratorObject( frequency, detune, velocity, glideTime, this.waveform );
                this._startGeneratorObject( generatorObject, delay );
                this._storeGeneratorObject( frequency, generatorObject );
            }
            else {
                unisonGeneratorArray = [];

                for ( var i = 0; i < unison; ++i ) {
                    detune = this._calculateDetune( i );
                    generatorObject = this._createGeneratorObject( frequency, detune, velocity, glideTime, this.waveform );
                    this._startGeneratorObject( generatorObject, delay );
                    unisonGeneratorArray.push( generatorObject );
                }

                this._storeGeneratorObject( frequency, unisonGeneratorArray );
            }
        }

        else {
            if ( unison === 1.0 ) {
                generatorObject = this._fetchGeneratorObjectToReuse();
                existingFrequency = generatorObject.frequency;
                glideTime = this._calculateGlideTime( existingFrequency, frequency );

                generatorObject.reset( frequency, detune + this.tuning.value * 100, velocity, glideTime );
                this._storeGeneratorObject( frequency, generatorObject );
            }
            else {
                generatorObject = this._fetchGeneratorObjectToReuse();
                existingFrequency = generatorObject[ 0 ].frequency;
                glideTime = this._calculateGlideTime( existingFrequency, frequency );

                for ( var i = 0; i < unison; ++i ) {
                    detune = this._calculateDetune( i );
                    generatorObject[ i ].reset( frequency, detune + this.tuning.value * 100, velocity, glideTime );
                }

                this._storeGeneratorObject( frequency, generatorObject );
            }
        }

        // Return the generated object(s) in case they're needed.
        return unisonGeneratorArray ? unisonGeneratorArray : generatorObject;
    }

    start( frequency, velocity, delay ) {
        var freq = 0,
            velocitySensitivity = this.velocitySensitivity.value;

        velocity = typeof velocity === 'number' ? velocity : 1;
        delay = typeof delay === 'number' ? delay : 0;


        if ( velocitySensitivity !== 0 ) {
            velocity = this.Math.scaleNumber( velocity, 0, 1, 0.5 - velocitySensitivity * 0.5, 0.5 + velocitySensitivity * 0.5 )
        }
        else {
            velocity = 0.5;
        }


        if ( typeof frequency === 'number' ) {
            this._startSingle( frequency, velocity, delay );
        }
        // else if ( frequency instanceof Note ) {
        //     freq = frequency.valueHz;
        //     this._startSingle( freq, velocity, delay );
        // }
        // else if ( frequency instanceof Chord ) {
        //     for ( var i = 0; i < frequency.notes.length; ++i ) {
        //         freq = frequency.notes[ i ].valueHz;
        //         this._startSingle( freq, velocity, delay );
        //     }
        // }

        return this;
    }



    _stopGeneratorObject( generatorObject, delay ) {
        var self = this;

        this.envelope.stop( generatorObject.outputs[ 0 ].gain, delay );

        generatorObject.timer = setTimeout( function() {
            // self.activeGeneratorObjectsFlat.pop();
            generatorObject.stop( delay );
            generatorObject.cleanUp();
            generatorObject = null;
        }, delay * 1000 + this.envelope.totalStopTime * 1000 + 100 );
    }

    _stopSingle( frequency, velocity, delay ) {
        var generatorObject = this._fetchGeneratorObject( frequency );

        if ( generatorObject ) {
            // Stop generators formed when unison was > 1 at time of start(...)
            if ( Array.isArray( generatorObject ) ) {
                for ( var i = generatorObject.length - 1; i >= 0; --i ) {
                    this._stopGeneratorObject( generatorObject[ i ], delay );
                }
            }
            else {
                this._stopGeneratorObject( generatorObject, delay );
            }
        }

        generatorObject = null;
    }

    stop( frequency, velocity, delay ) {
        velocity = typeof velocity === 'number' ? velocity : 0;
        delay = typeof delay === 'number' ? delay : 0;

        if ( typeof frequency === 'number' ) {
            this._stopSingle( frequency, velocity, delay );
        }
        // else if ( frequency instanceof Note ) {
        //     freq = frequency.valueHz;
        //     this._stopSingle( freq, velocity, delay );
        // }
        // else if ( frequency instanceof Chord ) {
        //     for ( var i = 0; i < frequency.notes.length; ++i ) {
        //         freq = frequency.notes[ i ].valueHz;
        //         this._stopSingle( freq, velocity, delay );
        //     }
        // }

        return this;
    }
}


// AudioIO.mixinSingle( GeneratorPlayer.prototype, _setIO, '_setIO' );
GeneratorPlayer.prototype.Math = math;

AudioIO.prototype.createGeneratorPlayer = function( options ) {
    return new GeneratorPlayer( this, options );
};