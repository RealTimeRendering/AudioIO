describe( "Math / LogicalOperator", function() {
    var node = io.createLogicalOperator();


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
        var n = io.createLogicalOperator( 100 );
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


    it( 'should force all inputs to be between 0 and 1 (1)', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( 10 ),
                    node = io.createLogicalOperator();

                node.inputs[ 0 ].connect( node.outputs[ 0 ] );

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

    it( 'should force all inputs to be between 0 and 1 (2)', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( 0 ),
                    node = io.createLogicalOperator();
                node.inputs[ 0 ].connect( node.outputs[ 0 ] );

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

    it( 'should force all inputs to be between 0 and 1 (3)', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( -125.512 ),
                    node = io.createLogicalOperator();
                node.inputs[ 0 ].connect( node.outputs[ 0 ] );
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


} );