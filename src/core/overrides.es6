// Need to override existing .connect functions
// for native AudioParams and AudioNodes...
// I don't like doing this, but s'gotta be done :(
( function() {
    var originalAudioNodeConnect = AudioNode.prototype.connect;

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
}() );