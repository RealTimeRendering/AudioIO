describe( "Math / Cos", function() {
    var node = io.createCos( 1 );


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


    it( 'should output cosine of audio input', function( done ) {
        var val = -Math.PI + Math.random() * ( Math.PI * 2 ),
            expected = Math.cos( val );

        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( val ),
                    node = io.createCos();

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

    it( 'should output cos( value )', function( done ) {
        var val = -Math.PI + Math.random() * ( Math.PI * 2 ),
            expected = Math.cos( val );

        offlineAudioTest( {
            onSetup: function( io ) {
                var node = io.createCos( val );
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