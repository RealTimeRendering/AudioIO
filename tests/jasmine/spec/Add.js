describe( "Math / Add", function() {
    var node = io.createAdd();


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
        var n = io.createAdd();
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( n.controls.value ).toEqual( null );
    } );

    it( 'should add two positive inputs together', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 1 ),
                    b = io.createConstant( 1 ),
                    node = io.createAdd();

                a.connect( node, 0, 0 );
                b.connect( node, 0, 1 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 2 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should add two negative inputs together', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( -1 ),
                    b = io.createConstant( -1 ),
                    node = io.createAdd();

                a.connect( node, 0, 0 );
                b.connect( node, 0, 1 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( -2 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should add a positive and a negative input together', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 10 ),
                    b = io.createConstant( -1 ),
                    node = io.createAdd();

                a.connect( node, 0, 0 );
                b.connect( node, 0, 1 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 9 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );


    it( 'should take one numerical argument and add it to any incoming connections', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 10 ),
                    node = io.createAdd( 5 );

                a.connect( node, 0, 0 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 15 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should allow for numerical argument to be changed after creation', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 10 ),
                    node = io.createAdd( 5 );

                node.value = 100;

                a.connect( node, 0, 0 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 110 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should allow for numerical argument to be driven by another input', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 10 ),
                    b = io.createConstant( -5 ),
                    node = io.createAdd();

                a.connect( node, 0, 0 );
                b.connect( node.controls.value );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 5 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );
} );