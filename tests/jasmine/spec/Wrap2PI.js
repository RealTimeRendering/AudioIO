describe( "Math / OVERFLOW", function() {
    it( 'should overflow when gain > Number.MAX_SAFE_INTEGER', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) );

        var constant = _io.createConstant( Number.MAX_SAFE_INTEGER - 268435455.5000001 ),
            constant5 = _io.createConstant( 5 ),
            additionGain = _io.context.createGain();

        constant.connect( additionGain );
        constant5.connect( additionGain );
        additionGain.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                console.log( buffer[ i ], Number.MAX_SAFE_INTEGER - 5 );
                expect( buffer[ i ] ).toBeCloseTo( Number.MAX_SAFE_INTEGER - 5 );
            }

            done();
        };

        _io.context.startRendering();
    } );
} );


function wrap( wrapTo, input ) {
    var reciprocal = Math.pow( wrapTo, -1 ),
        mul1 = input * reciprocal,
        round = Math.round( mul1 ),
        sub = mul1 - round,
        mul2 = sub * wrapTo;

    console.log( mul1 );

    return mul2;
}

function wrap( kX, kLowerBound, kUpperBound ) {
    var range_size = kUpperBound - kLowerBound + 1;

    if ( kX < kLowerBound )
        return kX + range_size * ( ( kLowerBound - kX ) / range_size + 1 );

    if ( kX > kUpperBound )
        return kX - range_size * ( ( kX - kUpperBound ) / range_size + 1 );

    return kX;
}