import Utils from './Utils.es6';

var BufferUtils = {};

// TODO:
// 	- It might be possible to decode the arraybuffer
// 	  using a context different from the one the 
// 	  buffer will be used in.
// 	  If so, remove the `io` argument, and create
// 	  a new AudioContext before the return of the Promise,
// 	  and use that.
BufferUtils.loadBuffer = function( io, uri ) {
	return new Promise( function( resolve, reject ) {
		var xhr = new XMLHttpRequest();

		xhr.open( 'GET', uri );
		xhr.responseType = 'arraybuffer';

		xhr.onload = function() {
			if ( xhr.status === 200 ) {
				// Do the decode dance
				io.context.decodeAudioData(
					xhr.response,
					function( buffer ) {
						resolve( buffer );
					},
					function( e ) {
						reject( e );
					}
				);
			}
			else {
				reject( Error( 'Status !== 200' ) );
			}
		};

		xhr.onerror = function() {
			reject( Error( 'Network error' ) );
		};

		xhr.send();
	} );
};


BufferUtils.fillBuffer = function( buffer, value ) {
	var numChannels = buffer.numberOfChannels,
		length = buffer.length,
		channelData;

	for ( var c = 0; c < numChannels; ++c ) {
		channelData = buffer.getChannelData( c );
		channelData.fill( value );
	}
};


BufferUtils.reverseBuffer = function( buffer ) {
	if ( buffer instanceof AudioBuffer === false ) {
		console.error( '`buffer` argument must be instance of AudioBuffer' );
		return;
	}

	var numChannels = buffer.numberOfChannels,
		length = buffer.length,
		channelData;

	for ( var c = 0; c < numChannels; ++c ) {
		channelData = buffer.getChannelData( c );
		channelData.reverse();
	}
};

BufferUtils.cloneBuffer = function( buffer ) {
	var newBuffer = this.io.createBuffer( buffer.numberOfChannels, buffer.length, buffer.sampleRate );

	for ( var c = 0; c < buffer.numberOfChannels; ++c ) {
		var channelData = newBuffer.getChannelData( c ),
			sourceData = buffer.getChannelData( c );

		for ( var i = 0; i < buffer.length; ++i ) {
			channelData[ i ] = sourceData[ i ];
		}
	}

	return newBuffer;
};

// TODO:
// 	- Support buffers with more than 2 channels.
BufferUtils.toStereo = function( buffer ) {
	var stereoBuffer,
		length;

	if ( buffer.numChannels >= 2 ) {
		console.warn( 'BufferUtils.toStereo currently only supports mono buffers for upmixing' );
		return;
	}

	length = buffer.length;
	stereoBuffer = this.io.createBuffer( 2, length, buffer.sampleRate );

	for ( var c = 0; c < 2; ++c ) {
		var channelData = stereoBuffer.getChannelData( c ),
			sourceData = buffer.getChannelData( 0 );

		for ( var i = 0; i < length; ++i ) {
			channelData[ i ] = sourceData[ i ];
		}
	}

	return stereoBuffer;
};

// TODO:
// 	- These basic math functions. Think of 
// 	  them as a buffer-version of a vector lib.
BufferUtils.addBuffer = function( a, b ) {};


// add
// multiply
// subtract
//

export default BufferUtils;