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
        var n = io.createDivide(),
            graph = n.getGraph();

        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( graph.reciprocal ).toEqual( null );
    } );


    it( 'should divide input one by input two', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 125 ),
                    b = io.createConstant( 600 ),
                    node = io.createDivide( null, 600 );

                a.connect( node, 0, 0 );
                b.connect( node, 0, 1 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toBeCloseTo( 125 / 600 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );


    it( 'should handle negative inputs correctly', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( -10 ),
                    b = io.createConstant( -2 ),
                    node = io.createDivide();

                a.connect( node, 0, 0 );
                b.connect( node, 0, 1 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toBeCloseTo( -10 / -2 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should divide a positive number by a negative number correctly', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 10 ),
                    b = io.createConstant( -2 ),
                    node = io.createDivide();

                a.connect( node, 0, 0 );
                b.connect( node, 0, 1 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toBeCloseTo( 10 / -2 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );


    it( 'should divide a negative number by a positive number correctly', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( -5 ),
                    b = io.createConstant( 2 ),
                    node = io.createDivide();

                a.connect( node, 0, 0 );
                b.connect( node, 0, 1 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toBeCloseTo( -5 / 2 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should take one numerical argument and divide incoming connections by it', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( -10 ),
                    node = io.createDivide( 25 );

                a.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toBeCloseTo( -10 / 25 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should allow numerical argument to be altered after creation', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( -10 ),
                    node = io.createDivide( 25 );

                node.value = 12;

                a.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toBeCloseTo( -10 / 12 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should handle divisors < 1 (requires a low `maxValue` argument)', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( -10 ),
                    node = io.createDivide( 0.2, 1 );

                a.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toBeCloseTo( -10 / 0.2 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );


    it( 'should allow divisor to be controlled with audio signal', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( -5 ),
                    b = io.createConstant( 2 ),
                    node = io.createDivide();

                a.connect( node, 0, 0 );
                b.connect( node.controls.divisor );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toBeCloseTo( -5 / 2 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );
} );