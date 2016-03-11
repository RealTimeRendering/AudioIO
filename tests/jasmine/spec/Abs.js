describe( "Math / Abs", function() {
    var node = io.createAbs( 100 );


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
        var n = io.createAbs( 100 ),
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


    it( 'should output posiive number when input is positive', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 20 ),
                    node = io.createAbs();

                a.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toBeCloseTo( 20, 1 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );


    it( 'should output a positive number when input is negative', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( -0.1 ),
                    node = io.createAbs();

                a.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                // expect( value ).toBeCloseTo( 0.1, 1 );
                expect( value ).toBeCloseTo( 0.1, 1 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );


    it( 'should output 0 (or fairly close to it [+-0.015]) when input is equal to 0', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 0 ),
                    node = io.createAbs();

                a.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toBeCloseTo( 0, 1 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should handle large numbers', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( -12457 ),
                    node = io.createAbs( 200 );

                a.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toBeCloseTo( 12457, 0 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );
} );