describe( "Math / Pow", function() {
    var node = io.createPow();


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
        var n = io.createPow( 2 ),
            graph = n.getGraph();

        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        console.log( graph );

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( graph.multipliers ).toEqual( null );
        expect( graph.value ).toEqual( null );
    } );


    it( 'should output input^pow', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 2 );
        _node = _io.createPow( 4 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( Math.pow( 2, 4 ) );
            }

            done();
        };

        _io.context.startRendering();
    } );

    // it( 'should output input^pow (float exponent)', function( done ) {
    //     var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
    //         _node,
    //         input;

    //     input = _io.createConstant( 2 );
    //     _node = _io.createPow( 2.5 );

    //     input.connect( _node );
    //     _node.connect( _io.master );

    //     _io.context.oncomplete = function( e ) {
    //         var buffer = e.renderedBuffer.getChannelData( 0 );

    //         for ( var i = 0; i < buffer.length; i++ ) {
    //             expect( buffer[ i ] ).toEqual( Math.pow( 2, 2.5 ) );
    //         }

    //         done();
    //     };

    //     _io.context.startRendering();
    // } );

    it( 'should output input when pow === 1', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 2 );
        _node = _io.createPow( 1 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( Math.pow( 2, 1 ) );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should allow `pow` argument to be changed after creation', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 2 );
        _node = _io.createPow( 4 );

        input.connect( _node );
        _node.connect( _io.master );
        _node.value = 10;

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( Math.pow( 2, 10 ) );
            }

            done();
        };

        _io.context.startRendering();
    } );
} );