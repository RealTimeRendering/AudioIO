describe( "Math / Min", function() {
    var node = io.createMin( 2 );


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



    it( 'should have two inputs and one output', function() {
        expect( node.inputs ).toBeDefined();
        expect( node.outputs ).toBeDefined();

        expect( node.inputs.length ).toBeDefined();
        expect( node.outputs.length ).toBeDefined();

        expect( node.inputs.length ).toEqual( 2 );
        expect( node.outputs.length ).toEqual( 1 );
    } );

    it( 'should have a cleanUp method and mark items for GC.', function() {
        var n = io.createMin( 5 );
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( n.controls.value ).toEqual( null );
        expect( n.lessThan ).toEqual( null );
    } );


    it( 'should output value when input is greater than value', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 12 );
        _node = _io.createMin( 2 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 2 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should emulate Math.min correctly', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 5 );
        _node = _io.createMin( 4 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( Math.min( 5, 4 ) );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output input when input is less than value', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 4 );
        _node = _io.createMin( 5 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 4 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output value when input is equal to value', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 2 );
        _node = _io.createMin( 2 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 2 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should allow value to be changed after creation', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 3 );
        _node = _io.createMin( 4 );

        input.connect( _node );
        _node.connect( _io.master );

        _node.value = 12;

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 3 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should allow value to be changed after creation and output value when input > value', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 124 );
        _node = _io.createMin( 4 );

        input.connect( _node );
        _node.connect( _io.master );

        _node.value = 12;

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 12 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should allow value to be controlled using audio input (1)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 2 );
        _node = _io.createMin();

        input.connect( _node );
        _node.connect( _io.master );

        var control = _io.createConstant( 5 );
        control.connect( _node.controls.value );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 2 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should allow value to be controlled using audio input (2)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 5 );
        _node = _io.createMin();

        input.connect( _node );
        _node.connect( _io.master );

        var control = _io.createConstant( 2 );
        control.connect( _node.controls.value );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 2 );
            }

            done();
        };

        _io.context.startRendering();
    } );
} );