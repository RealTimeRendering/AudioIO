describe( "Math / Floor", function() {
    var node = io.createFloor();


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
        var n = io.createFloor(),
            graph = n.getGraph();
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( graph.shaper ).toEqual( null );
        expect( graph.ifElse ).toEqual( null );
        expect( graph.equalToZero ).toEqual( null );
    } );


    it( 'should output input floored to nearest integer', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.001, 44100 ) ),
            _node,
            input,
            val = 0.7;

        input = _io.createConstant( val );
        _node = _io.createFloor();

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0 )
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output input floored to nearest integer', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.001, 44100 ) ),
            _node,
            input,
            val = 0.4;

        input = _io.createConstant( val );
        _node = _io.createFloor();

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0 )
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output input floored to nearest integer', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.001, 44100 ) ),
            _node,
            input,
            val = -0.4;

        input = _io.createConstant( val );
        _node = _io.createFloor();

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( -1 )
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output input floored to nearest integer', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.001, 44100 ) ),
            _node,
            input,
            val = 0.5;

        input = _io.createConstant( val );
        _node = _io.createFloor();

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0 )
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output input floored to nearest integer', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.001, 44100 ) ),
            _node,
            input,
            val = -0.5;

        input = _io.createConstant( val );
        _node = _io.createFloor();

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( -1 )
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should Floor < 0 && >= -1 to -1', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.001, 44100 ) ),
            _node,
            input,
            val = -0.9;

        input = _io.createConstant( val );
        _node = _io.createFloor();

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( -1 )
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output 0 when input is 0', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.001, 44100 ) ),
            _node,
            input,
            val = 0;

        input = _io.createConstant( val );
        _node = _io.createFloor();

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0 )
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should Floor values > 1 to 1.', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.001, 44100 ) ),
            _node,
            input,
            val = 12.5;

        input = _io.createConstant( val );
        _node = _io.createFloor();

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 1 )
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should Floor values < -1 to -1.', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.001, 44100 ) ),
            _node,
            input,
            val = -123.45;

        input = _io.createConstant( val );
        _node = _io.createFloor();

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( -1 )
            }

            done();
        };

        _io.context.startRendering();
    } );
} );