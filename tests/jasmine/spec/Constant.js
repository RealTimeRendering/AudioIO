describe( "Math / Constant", function() {
    var node = io.createConstant( 2 );


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



    it( 'should have no inputs and one output', function() {
        expect( node.inputs ).toBeDefined();
        expect( node.outputs ).toBeDefined();
        expect( node.inputs.length ).toEqual( 0 );
        expect( node.outputs.length ).toEqual( 1 );
    } );


    it( 'should have a cleanUp method and mark items for GC.', function() {
        var n = io.createConstant( 2 );
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
    } );

    it( 'should output a positive number if value is positive', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var node = io.createConstant( 543 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 543 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should output a negative number if value is negative', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var node = io.createConstant( -0.25 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( -0.25 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should output 0 if value is equal to 0', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var node = io.createConstant( 0 );
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


    it( 'should output 0 if no value is given', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var node = io.createConstant();
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
} );