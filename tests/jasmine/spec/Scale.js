describe( "Math / Scale", function() {
    var node = io.createScale( 0, 1, 10, 100 );

    function scaleNumber( num, lowIn, highIn, lowOut, highOut ) {
        return ( ( num - lowIn ) / ( highIn - lowIn ) ) * ( highOut - lowOut ) + lowOut;
    }


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
        var n = io.createScale( 0, 1, 10, 100 );
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );

        expect( n._lowIn ).toEqual( null );
        expect( n._lowOut ).toEqual( null );
        expect( n._highIn ).toEqual( null );
        expect( n._highOut ).toEqual( null );
        expect( n.inputMinusLowIn ).toEqual( null );
        expect( n.highInMinusLowIn ).toEqual( null );
        expect( n.divide ).toEqual( null );
        expect( n.highOutMinusLowOut ).toEqual( null );
        expect( n.multiply ).toEqual( null );
        expect( n.add ).toEqual( null );
    } );


    it( 'should scale up an input correctly when using small differences', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 0.1 );
        _node = _io.createScale( 0, 1, 0, 2 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 0.2 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should scale down an input correctly when using small differences', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 0.4 );
        _node = _io.createScale( 0, 2, 0, 1 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 0.2 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should scale up an input correctly when using average-sized differences', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 0.1 );
        _node = _io.createScale( 0, 1, 0, 10 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 1 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should scale up an input correctly when using large differences', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 0.1 );
        _node = _io.createScale( 0, 1, 0, 100 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 10 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should scale an input correctly with offset', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 0.1 );
        _node = _io.createScale( 0, 1, 2, 4 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 2.2 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should scale an input correctly with large offset', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 0.5 );
        _node = _io.createScale( 0, 1, 500, 1000 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 750, 0 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should scale down an input correctly with large offset', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 50 );
        _node = _io.createScale( 25, 75, 0, 1 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 0.5 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should handle negative input', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( -0.5 );
        _node = _io.createScale( -1, 0, 0, 10 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 5 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should handle negative output', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 12.5 );
        _node = _io.createScale( 10, 20, -10, -20 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( -12.5 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should handle lowIn being greater than highIn', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 5 );
        _node = _io.createScale( 10, 0, 0, 1 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( scaleNumber( 5, 10, 0, 0, 1 ) );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should handle lowOut being greater than highOut', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 5 );
        _node = _io.createScale( 0, 10, 5, -5 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( scaleNumber( 5, 0, 10, 5, -5 ) );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should handle all equal values', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 5 );
        _node = _io.createScale( 1, 1, 1, 1 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 1 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should allow `lowIn` argument to be changed after creation', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 1 );
        _node = _io.createScale( 0, 2, 2, 4 );

        input.connect( _node );
        _node.connect( _io.master );

        _node.lowIn = 1;

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 2 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should allow `highIn` argument to be changed after creation', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 1 );
        _node = _io.createScale( 0, 5, 2, 4 );

        input.connect( _node );
        _node.connect( _io.master );

        _node.highIn = 1;

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 4 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should allow `lowOut` argument to be changed after creation', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 0.5 );
        _node = _io.createScale( 0, 1, 2, 10 );

        input.connect( _node );
        _node.connect( _io.master );

        _node.lowOut = 0;

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 5 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should allow `highOut` argument to be changed after creation', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 0.5 );
        _node = _io.createScale( 0, 1, 2, 10 );

        input.connect( _node );
        _node.connect( _io.master );

        _node.highOut = 4;

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( 3 );
            }

            done();
        };

        _io.context.startRendering();
    } );
} );