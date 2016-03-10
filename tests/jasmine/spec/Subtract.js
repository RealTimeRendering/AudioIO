describe( "Math / Subtract", function() {
    var io,
        node;

    io = new AudioIO();
    node = io.createSubtract();


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
        var n = io.createSubtract( 6 );
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( n.negate ).toEqual( null );
        expect( n.controls.value ).toEqual( null );
    } );


    it( 'should subtract two positive inputs', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input1, input2;

        input1 = _io.createConstant( 2 );
        input2 = _io.createConstant( 1 );
        _node = _io.createSubtract();

        input1.connect( _node, 0, 0 );
        input2.connect( _node, 0, 1 );
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

    it( 'should subtract two positive inputs (2)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input1, input2;

        input1 = _io.createConstant( 0 );
        input2 = _io.createConstant( 1 );
        _node = _io.createSubtract();

        input1.connect( _node, 0, 0 );
        input2.connect( _node, 0, 1 );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( -1 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should subtract two negative inputs', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input1, input2;

        input1 = _io.createConstant( -1 );
        input2 = _io.createConstant( -2 );
        _node = _io.createSubtract();

        input1.connect( _node, 0, 0 );
        input2.connect( _node, 0, 1 );
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

    it( 'should subtract a positive and a negative input correctly', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input1, input2;

        input1 = _io.createConstant( 10 );
        input2 = _io.createConstant( -1 );
        _node = _io.createSubtract();

        input1.connect( _node, 0, 0 );
        input2.connect( _node, 0, 1 );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 11 );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should take one numerical argument and subtract it from any incoming connections', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input1;

        input1 = _io.createConstant( 10 );
        _node = _io.createSubtract( 2 );

        input1.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 8 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should take one numerical argument and subtract it from any incoming connections (2)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input1;

        input1 = _io.createConstant( 0 );
        _node = _io.createSubtract( 1 );

        input1.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( -1 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should allow for numerical argument to be changed after creation', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input1;

        input1 = _io.createConstant( 10 );
        _node = _io.createSubtract( 2 );

        input1.connect( _node );
        _node.connect( _io.master );

        _node.value = 4;

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 6 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should correctly calculate 1 - x, where x is a param', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) );

        var sub = _io.createSubtract(),
            constant = _io.createConstant( 1 ),
            param = _io.createParam( 10 );

        constant.connect( sub, 0, 0 );
        param.connect( sub, 0, 1 );
        sub.connect( _io.master );

        // Change param's value.
        param.value = 0.5;


        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0.5 );
            }

            done();
        };

        _io.context.startRendering();
    } );
} );