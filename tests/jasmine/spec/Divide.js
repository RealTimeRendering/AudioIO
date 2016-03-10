describe( "Math / Divide", function() {
    var node = io.createDivide();


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
        var n = io.createDivide();
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( n._value ).toEqual( null );
        expect( n.reciprocal ).toEqual( null );
    } );


    it( 'should divide input one by input two', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 5, 44100 ) ),
            _node,
            input1, input2;

        input1 = _io.createConstant( 125 );
        input2 = _io.createConstant( 600 );
        _node = _io.createDivide( null, 600 );

        input1.connect( _node, 0, 0 );
        input2.connect( _node, 0, 1 );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 125 / 600 );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should handle negative inputs correctly', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 5, 44100 ) ),
            _node,
            input1, input2;

        input1 = _io.createConstant( -10 );
        input2 = _io.createConstant( -2 );
        _node = _io.createDivide();

        input1.connect( _node, 0, 0 );
        input2.connect( _node, 0, 1 );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( -10 / -2 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should divide a positive number by a negative number correctly', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input1, input2;

        input1 = _io.createConstant( 10 );
        input2 = _io.createConstant( -2 );
        _node = _io.createDivide();

        input1.connect( _node, 0, 0 );
        input2.connect( _node, 0, 1 );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 10 / -2 );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should divide a negative number by a positive number correctly', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input1, input2;

        input1 = _io.createConstant( -2 );
        input2 = _io.createConstant( 5 );
        _node = _io.createDivide();

        input1.connect( _node, 0, 0 );
        input2.connect( _node, 0, 1 );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( -2 / 5 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should take one numerical argument and divide incoming connections by it', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input1;

        input1 = _io.createConstant( 10 );
        _node = _io.createDivide( 2 );

        input1.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 10 / 2 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should allow numerical argument to be altered after creation', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input1;

        input1 = _io.createConstant( 10 );
        _node = _io.createDivide( 2 );

        input1.connect( _node );
        _node.connect( _io.master );

        _node.value = 4;

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 10 / 4 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should handle divisors < 1 (requires a low `maxValue` argument)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input1;

        input1 = _io.createConstant( 10 );
        _node = _io.createDivide( 0.2, 1 );

        input1.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 10 / 0.2 );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should allow divisor to be controlled with audio signal', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input1;

        input1 = _io.createConstant( 10 );
        _node = _io.createDivide();

        var divisor = _io.createConstant( 0.5 );
        divisor.connect( _node.controls.divisor );

        input1.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 10 / 0.5 );
            }

            done();
        };

        _io.context.startRendering();
    } );
} );