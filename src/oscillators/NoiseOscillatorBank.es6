import "../core/AudioIO.es6";
import Node from "../core/Node.es6";
import math from "../mixins/math.es6";


var BUFFERS = new WeakMap();

class NoiseOscillatorBank extends Node {
    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io ) {
        super( io, 0, 1 );

        var graph = this.getGraph( this ),
            types = this.constructor.types,
            typeKeys = Object.keys( types ),
            buffers = this._getBuffers();

        graph.bufferSources = [];
        graph.outputGain = this.context.createGain();
        graph.crossfader = this.io.createCrossfader( Object.keys( types ).length, 0 );
        graph.outputGain.gain.value = 0;

        for ( var i = 0; i < typeKeys.length; ++i ) {
            var source = this.context.createBufferSource(),
                buffer = buffers[ typeKeys[ i ] ];

            source.buffer = buffer;
            source.loop = true;
            source.start( 0 );

            source.connect( graph.crossfader, 0, i );
            graph.bufferSources.push( source );
        }

        graph.crossfader.connect( graph.outputGain );
        graph.outputGain.connect( this.outputs[ 0 ] );

        this.controls.type = graph.crossfader.controls.index;
        this.setGraph( graph );
    }

    _createSingleBuffer( type ) {
        var sampleRate = this.context.sampleRate,
            buffer = this.context.createBuffer( 1, sampleRate, sampleRate ),
            channel = buffer.getChannelData( 0 ),
            fn;

        switch ( type ) {
            case 'WHITE':
                fn = Math.random;
                break;

            case 'GAUSSIAN_WHITE':
                fn = math.nrand;
                break;

            case 'PINK':
                math.generatePinkNumber( 128, 5 );
                fn = math.getNextPinkNumber;
                break;
        }

        for ( var i = 0; i < sampleRate; ++i ) {
            channel[ i ] = fn() * 2 - 1;
        }

        console.log( type, Math.min.apply( Math, channel ), Math.max.apply( Math, channel ) );

        return buffer;
    }

    _createBuffers() {
        var buffers = {},
            keys = Object.keys( buffers ),
            types = this.constructor.types,
            typeKeys = Object.keys( types ),
            buffer;

        // Buffers already created. Stop here.
        if ( keys.length !== 0 ) {
            return;
        }

        for ( var i = 0; i < typeKeys.length; ++i ) {
            buffers[ typeKeys[ i ] ] = this._createSingleBuffer( typeKeys[ i ] );
        }

        this._setBuffers( buffers );
    }

    _getBuffers() {
        var buffers = BUFFERS.get( this.io );

        if ( buffers === undefined ) {
            this._createBuffers();
            buffers = BUFFERS.get( this.io );
        }

        return buffers;
    }

    _setBuffers( buffers ) {
        BUFFERS.set( this.io, buffers );
    }

    start( time ) {
        var outputGain = this.getGraph( this ).outputGain;

        time = time || this.context.currentTime;
        outputGain.gain.value = 1;
    }

    stop( time ) {
        var outputGain = this.getGraph( this ).outputGain;

        time = time || this.context.currentTime;
        outputGain.gain.value = 0;
    }

    cleanUp() {
        super();
    }
}


NoiseOscillatorBank.types = {
    WHITE: 0,
    GAUSSIAN_WHITE: 1,
    PINK: 2
};


AudioIO.prototype.createNoiseOscillatorBank = function() {
    return new NoiseOscillatorBank( this );
};