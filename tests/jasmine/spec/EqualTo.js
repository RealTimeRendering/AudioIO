describe( "Math / EqualTo", function() {
    var node = io.createEqualTo( 2 );


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
        var n = io.createEqualTo( 10 );
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( n.shaper ).toEqual( null );
        // expect( n.control ).toEqual( null );
        expect( n.inversion ).toEqual( null );
    } );



    it( 'should output 1 when input is equal to comparitor', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 2 );
        _node = _io.createEqualTo( 2 );

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

    it( 'should output 1 when zeros are compared', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 0 );
        _node = _io.createEqualTo( 0 );

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
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.2, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 89 );
        _node = _io.createEqualTo( 20 );

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


    it( 'should output 0 when input is less than comparitor', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.2, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( -9.7 );
        _node = _io.createEqualTo( 2 );

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


    it( 'should allow for numerical argument to be changed after creation', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.2, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( -9.7 );
        _node = _io.createEqualTo( 2 );

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

    it( 'should let comparitor be controlled by audio input (negative input - 1)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.2, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( -9.7 );
        _node = _io.createEqualTo();

        input.connect( _node );
        _node.connect( _io.master );

        var comparitorControl = _io.createConstant( -9.7 );
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

    it( 'should let comparitor be controlled by audio input (negative input - 2)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.2, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( -9.7 );
        _node = _io.createEqualTo();

        input.connect( _node );
        _node.connect( _io.master );

        var comparitorControl = _io.createConstant( -2 );
        comparitorControl.connect( _node.controls.value );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should let comparitor be controlled by audio input (positive input - 1)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.2, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 5 );
        _node = _io.createEqualTo();

        input.connect( _node );
        _node.connect( _io.master );

        var comparitorControl = _io.createConstant( 5 );
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

    it( 'should let comparitor be controlled by audio input (positive input - 2)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.2, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 5 );
        _node = _io.createEqualTo();

        input.connect( _node );
        _node.connect( _io.master );

        var comparitorControl = _io.createConstant( 2 );
        comparitorControl.connect( _node.controls.value );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should let comparitor be controlled by audio input (positive input - 3)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.2, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 1 );
        _node = _io.createEqualTo();

        input.connect( _node );
        _node.connect( _io.master );

        var comparitorControl = _io.createConstant( 1 );
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

    it( 'should let comparitor be controlled by audio input (positive input - 4)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.2, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 1 );
        _node = _io.createEqualTo();

        input.connect( _node );
        _node.connect( _io.master );

        var comparitorControl = _io.createConstant( 0 );
        comparitorControl.connect( _node.controls.value );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should let comparitor be controlled by audio input', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.2, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 0 );
        _node = _io.createEqualTo();

        input.connect( _node );
        _node.connect( _io.master );

        var comparitorControl = _io.createConstant( 1 );
        comparitorControl.connect( _node.controls.value );

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