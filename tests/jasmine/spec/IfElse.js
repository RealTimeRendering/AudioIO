describe( "Math / IfElse", function() {
    var node = io.createIfElse();


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



    it( 'should have as many inputs as cases and one output', function() {
        expect( node.inputs ).toBeDefined();
        expect( node.outputs ).toBeDefined();

        expect( node.inputs.length ).toBeDefined();
        expect( node.outputs.length ).toBeDefined();

        expect( node.inputs.length ).toEqual( 2 );
        expect( node.outputs.length ).toEqual( 1 );
    } );

    it( 'should have a cleanUp method and mark items for GC.', function() {
        var n = io.createIfElse(),
            graph = n.getGraph();

        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( graph.switch ).toEqual( null );
        expect( n.if ).toEqual( null );
        expect( n.then ).toEqual( null );
        expect( n.else ).toEqual( null );
    } );


    it( 'should output `then` input when `if` is truthy', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            ifTest,
            then,
            elseOutput;

        ifTest = _io.createConstant( 1 );
        then = _io.createConstant( 21 );
        elseOutput = _io.createConstant( 234 );
        _node = _io.createIfElse();

        ifTest.connect( _node.if );
        then.connect( _node.then );
        elseOutput.connect( _node.else );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 21 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output `else` input when `if` is falsey', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            ifTest,
            then,
            elseOutput;

        ifTest = _io.createConstant( 0 );
        then = _io.createConstant( 21 );
        elseOutput = _io.createConstant( 234 );
        _node = _io.createIfElse();

        ifTest.connect( _node.if );
        then.connect( _node.then );
        elseOutput.connect( _node.else );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 234 );
            }

            done();
        };

        _io.context.startRendering();
    } );


    it( 'should output `then` input when `if` is truthy when connections dictate input channel', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            ifTest,
            then,
            elseOutput;

        ifTest = _io.createConstant( 1 );
        then = _io.createConstant( 21 );
        elseOutput = _io.createConstant( 234 );
        _node = _io.createIfElse();

        ifTest.connect( _node.if );
        then.connect( _node, 0, 0 );
        elseOutput.connect( _node, 0, 1 );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 21 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output `else` input when `if` is falsey when connections dictate input channel', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.01, 44100 ) ),
            _node,
            ifTest,
            then,
            elseOutput;

        ifTest = _io.createConstant( 0 );
        then = _io.createConstant( 21 );
        elseOutput = _io.createConstant( 234 );
        _node = _io.createIfElse();

        ifTest.connect( _node.if );
        then.connect( _node, 0, 0 );
        elseOutput.connect( _node, 0, 1 );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 234 );
            }

            done();
        };

        _io.context.startRendering();
    } );
} );