describe( "Math / GreaterThanZero", function() {
    var gtThan = io.createGreaterThanZero();


    it( 'should have a context', function() {
        expect( gtThan.context ).toEqual( io.context );
    } );

    it( "should have a reference to it's AudioIO instance", function() {
        expect( gtThan.io ).toEqual( io );
    } );

    it( "should have a connect method", function() {
        expect( gtThan.connect ).toEqual( jasmine.any( Function ) );
    } );

    it( "should have a disconnect method", function() {
        expect( gtThan.disconnect ).toEqual( jasmine.any( Function ) );
    } );



    it( 'should have one input and one output', function() {
        expect( gtThan.inputs ).toBeDefined();
        expect( gtThan.outputs ).toBeDefined();

        expect( gtThan.inputs.length ).toBeDefined();
        expect( gtThan.outputs.length ).toBeDefined();

        expect( gtThan.inputs.length ).toEqual( 1 );
        expect( gtThan.outputs.length ).toEqual( 1 );
    } );

    it( 'should have a cleanUp method and mark items for GC.', function() {
        var n = io.createGreaterThanZero();
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
    } );

    it( 'should output 0 when input is equal to 0', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _gtThan,
            input;

        input = _io.createConstant( 0 );
        _gtThan = _io.createGreaterThanZero();

        input.connect( _gtThan );
        _gtThan.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0 );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should output 1 when input is greater than 0', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _gtThan,
            input;

        input = _io.createConstant( 0.1 );
        _gtThan = _io.createGreaterThanZero();

        input.connect( _gtThan );
        _gtThan.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 1 );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should output 0 when input is less than 0', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _gtThan,
            input;

        input = _io.createConstant( -1 );
        _gtThan = _io.createGreaterThanZero();

        input.connect( _gtThan );
        _gtThan.connect( _io.master );

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