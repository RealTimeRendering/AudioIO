describe( "Math / Sine", function() {
    var node = io.createSin( 1 );


    it( 'should have a context', function() {
        expect( node.context ).toEqual( io.context );
    } );

    it( "should have a reference to it's AudioIO instance", function() {
        expect( node.io ).toEqual( io );
    } );

    it( "should have a connect method", function() {
        expect( node.connect ).toEqual( jasmine.any( Function ) );
    } );

    it( "should have a disconnect method", function() {
        expect( node.disconnect ).toEqual( jasmine.any( Function ) );
    } );



    it( 'should have one input and one output', function() {
        expect( node.inputs ).toBeDefined();
        expect( node.outputs ).toBeDefined();

        expect( node.inputs.length ).toBeDefined();
        expect( node.outputs.length ).toBeDefined();

        expect( node.inputs.length ).toEqual( 1 );
        expect( node.outputs.length ).toEqual( 1 );
    } );


    it( 'should output sine of audio input', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input,
            val = -Math.PI + Math.random() * ( Math.PI * 2 ),
            expected = Math.sin( val );

        input = _io.createConstant( val );
        _node = _io.createSin();

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( expected );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output sine( value )', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            val = -Math.PI + Math.random() * ( Math.PI * 2 ),
            expected = Math.sin( val );

        _node = _io.createSin( val );

        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( expected );
            }

            done();
        };

        _io.context.startRendering();
    } );
} );