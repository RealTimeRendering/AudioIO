import CONFIG from '../core/config.es6';
import math from '../mixins/Math.es6';

var BUFFER_STORE = {};
var BufferGenerators = {};

function generateBufferStoreKey( length, numberOfChannels, sampleRate ) {
    return length + '-' + numberOfChannels + '-' + sampleRate;
}


BufferGenerators.SineWave = function( io, numberOfChannels, length, sampleRate ) {
    var key = generateBufferStoreKey( length, numberOfChannels, sampleRate ),
        buffer,
        channelData;

    if ( BUFFER_STORE[ key ] ) {
        return BUFFER_STORE[ key ];
    }

    buffer = io.context.createBuffer( numberOfChannels, length, sampleRate );

    for ( var c = 0; c < numberOfChannels; ++c ) {
        channelData = buffer.getChannelData( c );

        for ( var i = 0; i < length; ++i ) {
            var x = Math.PI * ( i / length ) - Math.PI * 0.5;
            x *= 2;
            channelData[ i ] = Math.sin( x );
        }
    }

    BUFFER_STORE[ key ] = buffer;

    return buffer;
};

BufferGenerators.SawWave = function( io, numberOfChannels, length, sampleRate ) {
    var key = generateBufferStoreKey( length, numberOfChannels, sampleRate ),
        buffer,
        channelData;

    if ( BUFFER_STORE[ key ] ) {
        return BUFFER_STORE[ key ];
    }

    buffer = io.context.createBuffer( numberOfChannels, length, sampleRate );

    for ( var c = 0; c < numberOfChannels; ++c ) {
        channelData = buffer.getChannelData( c );

        for ( var i = 0; i < length; ++i ) {
            var x = ( i / length ) * 2 - 1;
            channelData[ i ] = x;
        }
    }

    BUFFER_STORE[ key ] = buffer;

    return buffer;
};

BufferGenerators.SquareWave = function( io, numberOfChannels, length, sampleRate ) {
    var key = generateBufferStoreKey( length, numberOfChannels, sampleRate ),
        buffer,
        channelData;

    if ( BUFFER_STORE[ key ] ) {
        return BUFFER_STORE[ key ];
    }

    buffer = io.context.createBuffer( numberOfChannels, length, sampleRate );

    for ( var c = 0; c < numberOfChannels; ++c ) {
        channelData = buffer.getChannelData( c );

        for ( var i = 0; i < length; ++i ) {
            var x = ( i / length ) * 2 - 1;
            channelData[ i ] = Math.sign( x + 0.001 );
        }
    }

    BUFFER_STORE[ key ] = buffer;

    return buffer;
};

BufferGenerators.TriangleWave = function( io, numberOfChannels, length, sampleRate ) {
    var key = generateBufferStoreKey( length, numberOfChannels, sampleRate ),
        buffer,
        channelData;

    if ( BUFFER_STORE[ key ] ) {
        return BUFFER_STORE[ key ];
    }

    buffer = io.context.createBuffer( numberOfChannels, length, sampleRate );

    for ( var c = 0; c < numberOfChannels; ++c ) {
        channelData = buffer.getChannelData( c );

        for ( var i = 0; i < length; ++i ) {
            var x = Math.abs( ( i % length * 2 ) - length ) - length * 0.5;
            x /= length * 0.5;
            channelData[ i ] = Math.sin( x );
        }
    }

    BUFFER_STORE[ key ] = buffer;

    return buffer;
};


module.exports = BufferGenerators;