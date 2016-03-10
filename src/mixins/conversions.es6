import math from "./math.es6";
import noteStrings from "./noteStrings.es6";
import notes from "./notes.es6";
import CONFIG from "../core/config.es6";
import noteRegExp from "./noteRegExp.es6";


export default {
    scalarToDb: function( scalar ) {
        return 20 * ( Math.log( scalar ) / Math.LN10 );
    },
    dbToScalar: function( db ) {
        return Math.pow( 2, db / 6 );
    },

    hzToMIDI: function( value ) {
        return math.roundFromEpsilon( 69 + 12 * Math.log2( value / 440 ) );
    },

    hzToNote: function( value ) {
        return this.midiToNote( this.hzToMIDI( value ) );
    },

    hzToMs: function( value ) {
        if ( value === 0 ) return 0;
        return 1000 / value;
    },

    hzToBPM: function( value ) {
        return this.msToBPM( this.hzToMs( value ) );
    },



    midiToHz: function( value ) {
        return Math.pow( 2, ( value - 69 ) / 12 ) * 440;
    },

    midiToNote: function( value ) {
        let values = ( value + '' ).split( '.' ),
            noteValue = +values[ 0 ],
            cents = ( values[ 1 ] ? parseFloat( '0.' + values[ 1 ], 10 ) : 0 ) * 100;

        if ( Math.abs( cents ) >= 100 ) {
            noteValue += cents % 100;
        }

        let root = noteValue % 12 | 0,
            octave = noteValue / 12 | 0,
            noteName = noteStrings[ root ];

        return noteName + ( octave + CONFIG.lowestOctave ) + ( cents ? '+' + cents : '' );
    },

    midiToMs: function( value ) {
        return this.hzToMs( this.midiToHz( value ) );
    },

    midiToBPM: function( value ) {
        return this.msToBPM( this.midiToMs( value ) );
    },



    noteToHz: function( value ) {
        return this.midiToHz( this.noteToMIDI( value ) );
    },

    noteToMIDI: function( value ) {
        let matches = noteRegExp.exec( value ),
            note, accidental, octave, cents,
            noteValue;

        if ( !matches ) {
            console.warn( 'Invalid note format:', value );
            return;
        }

        note = matches[ 1 ];
        accidental = matches[ 2 ];
        octave = parseInt( matches[ 3 ], 10 ) + -CONFIG.lowestOctave;
        cents = parseFloat( matches[ 4 ] ) || 0;

        noteValue = notes[ note + accidental ];

        return math.roundFromEpsilon( noteValue + ( octave * 12 ) + ( cents * 0.01 ) );
    },

    noteToMs: function( value ) {
        return this.midiToMs( this.noteToMIDI( value ) );
    },

    noteToBPM: function( value ) {
        return this.midiToBPM( this.noteToMIDI( value ) );
    },



    msToHz: function( value ) {
        return this.hzToMs( value );
    },

    msToNote: function( value ) {
        return this.midiToMs( this.noteToMIDI( value ) );
    },

    msToMIDI: function( value ) {
        return this.hzToMIDI( this.msToHz( value ) );
    },

    msToBPM: function( value ) {
        return value === 0 ? 0 : 60000 / value;
    },



    bpmToHz: function( value ) {
        return this.msToHz( this.bpmToMs( value ) );
    },

    bpmToNote: function( value ) {
        return this.midiToBPM( this.noteToMIDI( value ) );
    },

    bpmToMIDI: function( value ) {
        return this.msToMIDI( this.bpmToMs( value ) );
    },

    bpmToMs: function( value ) {
        return this.msToBPM( value );
    }
};