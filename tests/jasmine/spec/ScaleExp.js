describe( "Math / ScaleExp", function() {
    var node = io.createScaleExp( 0, 1, 10, 100, 1 );

    function scaleNumberExp( num, lowIn, highIn, lowOut, highOut, exp ) {
        if ( !exp ) {
            exp = 1;
        }

        if ( ( num - lowIn ) / ( highIn - lowIn ) === 0 ) {
            return lowOut;
        }
        else if ( ( num - lowIn ) / ( highIn - lowIn ) > 0 ) {
            return ( lowOut + ( highOut - lowOut ) * Math.pow( ( num - lowIn ) / ( highIn - lowIn ), exp ) );
        }
        else {
            return ( lowOut + ( highOut - lowOut ) * -( Math.pow( ( ( -num + lowIn ) / ( highIn - lowIn ) ), exp ) ) );
        }
    }

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

    it( 'should have a cleanUp method and mark items for GC.', function() {
        var n = io.createScaleExp( 0, 1, 10, 100, 2 );
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );

        expect( n._lowIn ).toEqual( null );
        expect( n._highIn ).toEqual( null );
        expect( n._lowOut ).toEqual( null );
        expect( n._highOut ).toEqual( null );
        expect( n._exponent ).toEqual( null );
        expect( n.inputMinusLowIn ).toEqual( null );
        expect( n.minusInput ).toEqual( null );
        expect( n.highInMinusLowIn ).toEqual( null );
        expect( n.divide ).toEqual( null );
        expect( n.negativeDivide ).toEqual( null );
        expect( n.highOutMinusLowOut ).toEqual( null );
        expect( n.pow ).toEqual( null );
        expect( n.negativePowNegate ).toEqual( null );
        expect( n.negativePow ).toEqual( null );
        expect( n.elseIfBranch ).toEqual( null );
        expect( n.elseIfMultiply ).toEqual( null );
        expect( n.elseBranch ).toEqual( null );
        expect( n.greaterThanZero ).toEqual( null );
        expect( n.ifGreaterThanZero ).toEqual( null );
        expect( n.equalsZero ).toEqual( null );
        expect( n.ifEqualsZero ).toEqual( null );
    } );

    it( 'should have one input and one output', function() {
        expect( node.inputs ).toBeDefined();
        expect( node.outputs ).toBeDefined();

        expect( node.inputs.length ).toBeDefined();
        expect( node.outputs.length ).toBeDefined();

        expect( node.inputs.length ).toEqual( 1 );
        expect( node.outputs.length ).toEqual( 1 );
    } );


    it( 'should invert input using default exponent of 1', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 1 );
        _node = _io.createScaleExp( 0, 1, 1, 0 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( scaleNumberExp( 1, 0, 1, 1, 0 ) );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should scale an input correctly using default exponent of 1', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 5 );
        _node = _io.createScaleExp( 1, 10, 0, 2 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( scaleNumberExp( 5, 1, 10, 0, 2 ) );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should scale an input correctly using given exponent', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 5 );
        _node = _io.createScaleExp( 1, 10, 0, 2, 2 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( scaleNumberExp( 5, 1, 10, 0, 2, 2 ) );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should return lowOut when (input - lowIn) / (highIn - lowIn) === 0', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input;

        input = _io.createConstant( 5 );
        _node = _io.createScaleExp( 5, 10, 0, 2, 2 );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( scaleNumberExp( 5, 5, 10, 0, 2, 2 ) );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should return negated power calculation when (input - lowIn) / (highIn - lowIn) < 0', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            input,
            num = -5,
            lowIn = 6,
            highIn = 10,
            lowOut = 0,
            highOut = 2,
            exponent = 1;

        input = _io.createConstant( num );
        _node = _io.createScaleExp( lowIn, highIn, lowOut, highOut, exponent );

        input.connect( _node );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toBeCloseTo( scaleNumberExp( num, lowIn, highIn, lowOut, highOut, exponent ) );
            }

            done();
        };

        _io.context.startRendering();
    } );
} );