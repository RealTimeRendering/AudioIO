describe( "Math / Switch", function() {
    var numCases = 3,
        node = io.createSwitch( numCases );


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

        expect( node.inputs.length ).toEqual( numCases );
        expect( node.outputs.length ).toEqual( 1 );
    } );

    it( 'should have a cleanUp method and mark items for GC.', function() {
        var n = io.createSwitch( 3 );
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( n.cases ).toEqual( null );
        expect( n.controls.index ).toEqual( null );
    } );


    it( 'should output case 0 when case 0 is selected', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            case1,
            case2;

        case1 = _io.createConstant( 2 );
        case2 = _io.createConstant( 3 );
        _node = _io.createSwitch( 2, 0 );

        case1.connect( _node, 0, 0 );
        case2.connect( _node, 0, 1 );
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

    it( 'should output case 1 when case 1 is selected', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            case1,
            case2;

        case1 = _io.createConstant( 2 );
        case2 = _io.createConstant( 3 );
        _node = _io.createSwitch( 2, 1 );


        case1.connect( _node, 0, 0 );
        case2.connect( _node, 0, 1 );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 3 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should output case 2 when case 2 is selected', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            case1,
            case2,
            case3;

        case1 = _io.createConstant( 2 );
        case2 = _io.createConstant( 3 );
        case3 = _io.createConstant( 25 );
        _node = _io.createSwitch( 3, 2 );


        case1.connect( _node, 0, 0 );
        case2.connect( _node, 0, 1 );
        case3.connect( _node, 0, 2 );
        _node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 25 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should allow case to be changed after creation', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            case1,
            case2;

        case1 = _io.createConstant( 12 );
        case2 = _io.createConstant( 43 );
        _node = _io.createSwitch( 2, 1 );


        case1.connect( _node, 0, 0 );
        case2.connect( _node, 0, 1 );
        _node.connect( _io.master );

        _node.value = 0;

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 12 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should be controllable with audio', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 44100 * 0.1, 44100 ) ),
            _node,
            case1,
            case2;

        case1 = _io.createConstant( 2 );
        case2 = _io.createConstant( 3 );
        _node = _io.createSwitch( 2, 0 );

        case1.connect( _node, 0, 0 );
        case2.connect( _node, 0, 1 );
        _node.connect( _io.master );

        var selector = _io.createConstant( 1 );
        selector.connect( _node.control );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 3 );
            }

            done();
        };

        _io.context.startRendering();
    } );
} );