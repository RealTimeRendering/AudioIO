describe( "Math / Clamp", function() {
    var node = io.createClamp( 2, 10 );


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

    it( 'should have a cleanUp method and mark items for GC.', function() {
        var n = io.createClamp( 2, 10 );
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( n.min ).toEqual( null );
        expect( n.max ).toEqual( null );
    } );


    it( 'should output input when input > minValue && input < maxValue', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 12 );
        _node = _io.createClamp( 2, 123 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 12 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output minValue when input < minValue ', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 12 );
        _node = _io.createClamp( 43, 123 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 43 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output maxValue when input > maxValue', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 543 );
        _node = _io.createClamp( 2, 123 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 123 );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'values should be able to be set using audio inputs', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 543 );
        _node = _io.createClamp();

        var min = _io.createConstant( 2 ),
            max = _io.createConstant( 123 );

        min.connect( _node.min.controls.value );
        max.connect( _node.max.controls.value );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 123 );
            }

            done();
        };

        _io.context.startRendering();
    } );


} );