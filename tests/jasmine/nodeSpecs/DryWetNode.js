describe( "DryWetNode", function() {
    var node = io.createDryWetNode( 0.5 );

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



    it( 'should have two inputs and one output, with `dry` and `wet` aliases for the two inputs', function() {
        expect( node.inputs ).toBeDefined();
        expect( node.outputs ).toBeDefined();

        expect( node.inputs.length ).toBeDefined();
        expect( node.outputs.length ).toBeDefined();

        expect( node.inputs.length ).toEqual( 2 );
        expect( node.outputs.length ).toEqual( 1 );

        expect( node.dry ).toBeDefined();
        expect( node.wet ).toBeDefined();
    } );




    it( 'should correctly crossfade between dry and wet values (1)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 5, 44100 ) );

        var node = _io.createDryWetNode(),
            dry = _io.createConstant( 10 ),
            wet = _io.createConstant( 0 ),
            dryWetValue = _io.createConstant( 0 );

        dryWetValue.connect( node.controls.dryWet );
        dry.connect( node.dry );
        wet.connect( node.wet );
        node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 10 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should correctly crossfade between dry and wet values (2)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 5, 44100 ) );

        var node = _io.createDryWetNode(),
            dry = _io.createConstant( 0 ),
            wet = _io.createConstant( 20 ),
            dryWetValue = _io.createConstant( 1 );

        dryWetValue.connect( node.controls.dryWet );
        dry.connect( node.dry );
        wet.connect( node.wet );
        node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 20 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should correctly crossfade between dry and wet values (3)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 5, 44100 ) );

        var node = _io.createDryWetNode(),
            dry = _io.createConstant( 0 ),
            wet = _io.createConstant( 4 ),
            dryWetValue = _io.createConstant( 0.5 );

        dryWetValue.connect( node.controls.dryWet );
        dry.connect( node.dry );
        wet.connect( node.wet );
        node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 2 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should correctly crossfade between dry and wet values (4)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 5, 44100 ) );

        var node = _io.createDryWetNode(),
            dry = _io.createConstant( 4 ),
            wet = _io.createConstant( 0 ),
            dryWetValue = _io.createConstant( 0.5 );

        dryWetValue.connect( node.controls.dryWet );
        dry.connect( node.dry );
        wet.connect( node.wet );
        node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 2 );
            }

            done();
        };

        _io.context.startRendering();
    } );



    it( 'should correctly crossfade between dry and wet values when negative (1)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 5, 44100 ) );

        var node = _io.createDryWetNode(),
            dry = _io.createConstant( -4 ),
            wet = _io.createConstant( 0 ),
            dryWetValue = _io.createConstant( 0.5 );

        dryWetValue.connect( node.controls.dryWet );
        dry.connect( node.dry );
        wet.connect( node.wet );
        node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( -2 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should correctly crossfade between dry and wet values when negative (2)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 5, 44100 ) );

        var node = _io.createDryWetNode(),
            dry = _io.createConstant( -4 ),
            wet = _io.createConstant( -4 ),
            dryWetValue = _io.createConstant( 0.5 );

        dryWetValue.connect( node.controls.dryWet );

        dry.connect( node.dry );
        wet.connect( node.wet );
        node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( -4 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should correctly crossfade between dry and wet values when negative (3)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 5, 44100 ) );

        var node = _io.createDryWetNode(),
            dry = _io.createConstant( 0 ),
            wet = _io.createConstant( -4 ),
            dryWetValue = _io.createConstant( 0.5 );

        dryWetValue.connect( node.controls.dryWet );
        dry.connect( node.dry );
        wet.connect( node.wet );
        node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( -2 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should correctly crossfade between dry and wet values when negative (4)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 5, 44100 ) );

        var node = _io.createDryWetNode(),
            dry = _io.createConstant( 10 ),
            wet = _io.createConstant( -10 ),
            dryWetValue = _io.createConstant( 0.5 );

        dryWetValue.connect( node.controls.dryWet );
        dry.connect( node.dry );
        wet.connect( node.wet );
        node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0 );
            }

            done();
        };

        _io.context.startRendering();
    } );

    it( 'should correctly crossfade between dry and wet values when negative (5)', function( done ) {
        var _io = new AudioIO( new OfflineAudioContext( 1, 5, 44100 ) );

        var node = _io.createDryWetNode(),
            dry = _io.createConstant( -10 ),
            wet = _io.createConstant( 10 ),
            dryWetValue = _io.createConstant( 0.5 );

        dryWetValue.connect( node.controls.dryWet );
        dry.connect( node.dry );
        wet.connect( node.wet );
        node.connect( _io.master );

        _io.context.oncomplete = function( e ) {
            var buffer = e.renderedBuffer.getChannelData( 0 );

            for ( var i = 0; i < buffer.length; i++ ) {
                expect( buffer[ i ] ).toEqual( 0 );
            }

            done();
        };

        _io.context.startRendering();
    } );
} );