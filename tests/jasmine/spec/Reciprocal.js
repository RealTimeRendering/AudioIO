describe( "Math / Reciprocal", function() {
    var node = io.createReciprocal();


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
        var n = io.createReciprocal( 10 ),
            graph = n.getGraph();

        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( graph.maxInput ).toEqual( null );
        expect( graph.shaper ).toEqual( null );
    } );


    it( 'should output reciprocal of input', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            expectedValue = 1 / 20,
            _node,
            input;

        input = _io.createConstant( 20 );
        _node = _io.createReciprocal();

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( expectedValue );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should not calculate reciprocal correctly if maxValue argument > input', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            expectedValue = 1 / 20,
            _node,
            input;

        input = _io.createConstant( 20 );
        _node = _io.createReciprocal( 5 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).not.toBeCloseTo( expectedValue );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should calculate reciprocal correctly if maxValue argument <= input', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            expectedValue = 1 / 20,
            _node,
            input;

        input = _io.createConstant( 20 );
        _node = _io.createReciprocal( 20 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( expectedValue );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should handle large maxValue arguments (testing ' + io.context.sampleRate + ' as maxValue)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            expectedValue = 1 / _io.context.sampleRate,
            _node,
            input;

        input = _io.createConstant( _io.context.sampleRate );
        _node = _io.createReciprocal( _io.context.sampleRate );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( expectedValue );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should calculate `input value * reciprocal` when input value is < 1', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            expectedValue = 20,
            _node,
            input;

        input = _io.createConstant( 1 / expectedValue );
        _node = _io.createReciprocal( 20 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( expectedValue );
            }

            done();
        };

        _io.context.startRendering();
    } );
} );