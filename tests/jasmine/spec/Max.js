describe( "Math / Max", function() {
    var node = io.createMax( 2 );


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
        var n = io.createMax( 5 ),
            graph = n.getGraph();

        expect( n.cleanUp ).toEqual( jasmine.any( Function ) );

        n.cleanUp();

        expect( n.inputs ).toEqual( null );
        expect( n.outputs ).toEqual( null );
        expect( n.controls.value ).toEqual( null );
        expect( graph.greaterThan ).toEqual( null );
    } );


    it( 'should output input when input is greater than value', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( 12 ),
                    node = io.createMax( 2 );

                input.connect( node );
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

    it( 'should output value when input is less than value', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( 1 ),
                    node = io.createMax( 5 );

                input.connect( node );
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

    it( 'should output value when input is equal to value', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( 2 ),
                    node = io.createMax( 2 );

                input.connect( node );
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

    it( 'should emulate Math.max correctly', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( 5 ),
                    node = io.createMax( 4 );

                input.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( Math.max( 5, 4 ) );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should allow value to be changed after creation', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( 3 ),
                    node = io.createMax( 4 );

                input.connect( node );
                node.connect( io.master );

                node.value = 12;
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 12 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should allow value to be changed after creation and output input when > value', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( 124 ),
                    node = io.createMax( 4 );

                input.connect( node );
                node.connect( io.master );

                node.value = 12;
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 124 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );


    it( 'should allow value to be controlled using audio input', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( 124 ),
                    node = io.createMax(),
                    control = io.createConstant( 200 );

                control.connect( node.controls.value );
                input.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 200 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( 'should allow value to be controlled using audio input', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var input = io.createConstant( 200 ),
                    node = io.createMax(),
                    control = io.createConstant( 124 );

                control.connect( node.controls.value );
                input.connect( node );
                node.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( 200 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );
} );