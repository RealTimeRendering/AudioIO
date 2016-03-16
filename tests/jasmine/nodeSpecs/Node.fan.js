describe( "Node.fan(...)", function() {
    it( 'should connect the node in parallel to given arguments', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var node = io.createConstant( 1 ),
                    multiply = io.createMultiply( 2 ),
                    subtract = io.createSubtract( 10 );

                node.fan( multiply, subtract );
                multiply.connect( io.master );
                subtract.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( -7 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( '"Native" nodes should also be fannable', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var osc = io.context.createOscillator(),
                    gain = io.context.createGain(),
                    filter = io.context.createBiquadFilter(),
                    finalGain = io.context.createGain();

                filter.frequency.value = io.context.sampleRate * 0.15;
                gain.gain.value = -1;
                finalGain.gain.value = 10000;

                osc.fan( gain, filter );
                osc.start();

                gain.connect( finalGain );
                filter.connect( finalGain );
                finalGain.connect( io.master );
            },
            onCompare: function( value ) {
                expect( value ).toBeLessThan( 0.00000001 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );
} );