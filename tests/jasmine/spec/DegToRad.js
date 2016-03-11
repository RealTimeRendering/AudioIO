describe( "Math / DegToRad", function() {
    var node = io.createDegToRad();


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
        var n = io.createDegToRad();
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
    } );

    it( 'should correctly calculate conversion of degrees to radians', function( done ) {
        var angle = -Math.PI + Math.random() * ( Math.PI * 2 ),
            expected = angle * ( Math.PI / 180 );

        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( angle ),
                    node = io.createDegToRad();

                a.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toBeCloseTo( expected );
            },
            onComplete: function() {
                done();
            }
        } );
    } );
} );