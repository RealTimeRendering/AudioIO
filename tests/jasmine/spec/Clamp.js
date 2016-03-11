describe( "Math / Clamp", function() {
    var node = io.createClamp( 2, 10 );


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
        var n = io.createClamp( 2, 10 ),
            graph = n.getGraph();
        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( graph.min ).toEqual( null );
        expect( graph.max ).toEqual( null );
    } );


    it( 'should output input when input > minValue && input < maxValue', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 12 ),
                    node = io.createClamp( 2, 123 );

                a.connect( node, 0, 0 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 12 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should output minValue when input < minValue ', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 12 ),
                    node = io.createClamp( 34, 123 );

                a.connect( node, 0, 0 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 34 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should output maxValue when input > maxValue', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 12 ),
                    node = io.createClamp( 0, 2 );

                a.connect( node, 0, 0 );
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

    it( 'should allow numerical arguments to be changed after creation (1)', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 543 ),
                    node = io.createClamp( 34, 123 );

                node.min = 1000;
                node.max = 5000;

                a.connect( node, 0, 0 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 1000 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should allow numerical arguments to be changed after creation (2)', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 2500 ),
                    node = io.createClamp( 34, 123 );

                node.min = 1000;
                node.max = 5000;

                a.connect( node, 0, 0 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 2500 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should allow numerical arguments to be changed after creation (3)', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 6000 ),
                    node = io.createClamp( 34, 123 );

                node.min = 1000;
                node.max = 5000;

                a.connect( node, 0, 0 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 5000 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );



    it( 'values should be able to be set using audio inputs', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var a = io.createConstant( 543 ),
                    min = io.createConstant( 2 ),
                    max = io.createConstant( 123 ),
                    node = io.createClamp();

                min.connect( node.controls.min );
                max.connect( node.controls.max );

                a.connect( node, 0, 0 );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 123 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );
} );