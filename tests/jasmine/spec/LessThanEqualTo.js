describe( "Math / LessThanEqualTo", function() {
    var node = io.createLessThanEqualTo( 1 );


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
        var n = io.createLessThanEqualTo( 2 ),
            graph = n.getGraph();

        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( graph.lessThan ).toEqual( null );
        expect( graph.equalTo ).toEqual( null );
        expect( graph.OR ).toEqual( null );
        expect( n.controls.value ).toEqual( null );
    } );


    it( 'should output 1 when input less than comparitor', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 0.9 );
        _node = _io.createLessThanEqualTo( 1 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 1 );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should output 0 when input is greater than comparitor', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 2 );
        _node = _io.createLessThanEqualTo( 1 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0 );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should output 1 when input is equal to comparitor', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 1 );
        _node = _io.createLessThanEqualTo( 1 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 1 );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should allow for numerical argument to be changed after creation (1)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( -9.7 );
        _node = _io.createLessThanEqualTo( 2 );

        input.connect( _node );
        _node.connect( _io.master );

        _node.value = -11;

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should allow for numerical argument to be changed after creation (2)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( -9.7 );
        _node = _io.createLessThanEqualTo( 2 );

        input.connect( _node );
        _node.connect( _io.master );

        _node.value = -9.7;

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 1 );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should let comparitor be controlled by audio input (1)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( -9.7 );
        _node = _io.createLessThanEqualTo();

        input.connect( _node );
        _node.connect( _io.master );

        var comparitorControl = _io.createConstant( 10 );
        comparitorControl.connect( _node.controls.value );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 1 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should let comparitor be controlled by audio input (2)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 100 );
        _node = _io.createLessThanEqualTo();

        input.connect( _node );
        _node.connect( _io.master );

        var comparitorControl = _io.createConstant( 100 );
        comparitorControl.connect( _node.controls.value );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 1 );
            }

            done();
        };

        _io.context.startRendering();
    } );
} );