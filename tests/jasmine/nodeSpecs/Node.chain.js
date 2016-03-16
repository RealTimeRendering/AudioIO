describe( "Node.chain(...)", function() {
    it( 'should connect the node in series to given arguments', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var node = io.createConstant( 1 ),
                    multiply = io.createMultiply( 2 ),
                    subtract = io.createSubtract( 10 );

                node.chain( multiply, subtract, io.master );
            },
            onCompare: function( value ) {
                expect( value ).toEqual( -8 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );

    it( '"Native" nodes should also be chainable', function( done ) {
        offlineAudioTest( {
            onSetup: function( io ) {
                var osc = io.context.createOscillator(),
                    gain = io.context.createGain(),
                    filter = io.context.createBiquadFilter(),
                    finalGain = io.context.createGain();

                filter.frequency.value = io.context.sampleRate * 0.5;
                finalGain.gain.value = -1;

                osc.chain( gain, filter, finalGain, io.master );
                osc.start();
            },
            onCompare: function( value ) {
                expect( value ).toBeLessThan( 0.0000000001 );
            },
            onComplete: function() {
                done();
            }
        } );
    } );
} );