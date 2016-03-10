function offlineAudioTest( options ) {
    var io = new AudioIO( new OfflineAudioContext( 1, options.cycles || 5, 44100 ) );

    options.onSetup( io );

    io.context.oncomplete = function( e ) {
        var buffer = e.renderedBuffer.getChannelData( 0 ),
            size = buffer.length,
            i = 0;

        for ( i; i < size; i++ ) {
            options.onCompare( buffer[ i ] );
        }

        options.onComplete();
    };

    io.context.startRendering();
}