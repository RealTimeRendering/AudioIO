describe( "Math / NOT", function() {
    var node = io.createNOT();


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
        var n = io.createNOT();
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
    } );


    it( 'should have one input and one output', function() {
        expect( node.inputs ).toBeDefined();
        expect( node.outputs ).toBeDefined();

        expect( node.inputs.length ).toBeDefined();
        expect( node.outputs.length ).toBeDefined();

        expect( node.inputs.length ).toEqual( 1 );
        expect( node.outputs.length ).toEqual( 1 );
    } );

    it( 'should emulate NOT (!) operation (!0 = 1)', function( done ) {
        var aValue = 0;

        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( aValue ),
                    node = io.createNOT();

                a.connect( node, 0, 0 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( Number( !aValue ) );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should emulate NOT (!) operation (!1 = 0)', function( done ) {
        var aValue = 1;

        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( aValue ),
                    node = io.createNOT();

                a.connect( node, 0, 0 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( Number( !aValue ) );
            },
            onComplete: function() {
                done();
            }
        } );
    } );


} );