describe( "Param", function() {
    var node = io.createParam( 100 );

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




    it( 'should set default value if given', function() {
        var param = io.createParam( 1, 10 );
        expect( param.defaultValue ).toEqual( 10 );
    } );




    it( 'should output value when value is passed', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 5, 44100 ) ),
            node,
            val = Math.random() * 20;

        _node = _io.createParam( val );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( val, 5 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output 0 if value is not passed', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 5, 44100 ) ),
            node;

        _node = _io.createParam();
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0.0 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should be controllable', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 5, 44100 ) ),
            _node = _io.createParam(),
            control = _io.createConstant( 2 );

        control.connect( _node );
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
} );