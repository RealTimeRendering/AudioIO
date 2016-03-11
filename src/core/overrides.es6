// Need to override existing .connect and .disconnect
// functions for "native" AudioParams and AudioNodes...
// I don't like doing this, but s'gotta be done :(
( function() {
    var originalAudioNodeConnect = AudioNode.prototype.connect,
        originalAudioNodeDisconnect = AudioNode.prototype.disconnect;

    AudioNode.prototype.connect = function( node, outputChannel = 0, inputChannel = 0 ) {
        if ( node.inputs ) {
            if ( Array.isArray( node.inputs ) ) {
                this.connect( node.inputs[ inputChannel ] );
            }
            else {
                this.connect( node.inputs[ 0 ], outputChannel, inputChannel );
            }
        }

        else if ( node instanceof AudioNode ) {
            originalAudioNodeConnect.apply( this, arguments );
        }
        else if ( node instanceof AudioParam ) {
            originalAudioNodeConnect.call( this, node, outputChannel );
        }
    };

    AudioNode.prototype.disconnect = function( node, outputChannel = 0, inputChannel = 0 ) {
        if ( node && node.inputs ) {
            if ( Array.isArray( node.inputs ) ) {
                this.disconnect( node.inputs[ inputChannel ] );
            }
            else {
                this.disconnect( node.inputs[ 0 ], outputChannel, inputChannel );
            }
        }

        else if ( node instanceof AudioNode ) {
            originalAudioNodeDisconnect.apply( this, arguments );
        }
        else if ( node instanceof AudioParam ) {
            originalAudioNodeDisconnect.call( this, node, outputChannel );
        }
        else if ( node === undefined ) {
            originalAudioNodeDisconnect.apply( this, arguments );
        }
    };
}() );