describe( "Math / Constant", function() {
    var node = io.createConstant( 2 );


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



    it( 'should have no inputs and one output', function() {
        expect( node.inputs ).toBeDefined();
        expect( node.outputs ).toBeDefined();
        expect( node.inputs.length ).toEqual( 0 );
        expect( node.outputs.length ).toEqual( 1 );
    } );


    it( 'should have a cleanUp method and mark items for GC.', function() {
        var n = io.createConstant( 2 );
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
    } );

    it( 'should output a positive number if value is positive', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            input;

        input = _io.createConstant( 5 );
        input.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 5 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output a negative number if value is negative', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            input;

        input = _io.createConstant( -2.25 );
        input.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( -2.25 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output 0 if value is equal to 0', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            input;

        input = _io.createConstant( 0 );
        input.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0 );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should output 0 if no value is given', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            input;

        input = _io.createConstant();
        input.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0 );
            }

            done();
        };

        _io.context.startRendering();
    } );
} );