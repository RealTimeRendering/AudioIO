describe( "Math / Sign", function() {
    var node = io.createSign( 100 );


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
        var n = io.createSign( 100 ),
            graph = n.getGraph();

        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( graph.shaper ).toEqual( null );
    } );


    it( 'should have one input and one output', function() {
        expect( node.inputs ).toBeDefined();
        expect( node.outputs ).toBeDefined();

        expect( node.inputs.length ).toBeDefined();
        expect( node.outputs.length ).toBeDefined();

        expect( node.inputs.length ).toEqual( 1 );
        expect( node.outputs.length ).toEqual( 1 );
    } );


    it( 'should output -1 when input is < 0', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( -10 ),
                    node = io.createSign();

                input.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( -1 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should output 1 when input is > 0', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( 15 ),
                    node = io.createSign();

                input.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 1 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should output 0 when input is === 0', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( 0 ),
                    node = io.createSign();

                input.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 0 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should emulate Math.sign', function( done ) {

        var count = 0;

        function onComplete() {
            if ( ( ++count ) === 3 ) {
                done();
            }
        }

        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( 0 ),
                    node = io.createSign();

                input.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( Math.sign( 0 ) );
            },
            onComplete: onComplete
        } );

        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( 5 ),
                    node = io.createSign();

                input.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( Math.sign( 5 ) );
            },
            onComplete: onComplete
        } );

        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( -2.5 ),
                    node = io.createSign();

                input.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( Math.sign( -2.5 ) );
            },
            onComplete: onComplete
        } );
    } );
} );