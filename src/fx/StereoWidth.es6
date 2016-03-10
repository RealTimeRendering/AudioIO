import AudioIO from "../core/AudioIO.es6";
import _setIO from "../mixins/setIO.es6";
import connections from "../mixins/connections.es6";
import cleaners from "../mixins/cleaners.es6";


// Based on the following formula from Michael Gruhn:
//  - http://musicdsp.org/showArchiveComment.php?ArchiveID=256
//
// ------------------------------------------------------------
//
// The graph that's created is as follows:
//
//                   |-> L -> leftAddRight( 0 ) -> |
//                   |-> R -> leftAddRight( 1 ) -> | -> multiply( 0.5 ) ------> monoMinusStereo( 0 ) -> merger( 0 ) // outL
// input -> splitter -                                                  |-----> monoPlusStereo( 0 ) --> merger( 1 ) // outR
//                   |-> L -> rightMinusLeft( 1 ) -> |
//                   |-> R -> rightMinusLeft( 0 ) -> | -> multiply( coef ) ---> monoMinusStereo( 1 ) -> merger( 0 ) // outL
//


// TODO:
//  - Convert this to the new ES6 format.
//
class StereoWidth {
    constructor( io, width ) {
        this._setIO( io );

        var splitter = this.context.createChannelSplitter( 2 ),
            coefficient = this.context.createGain(),
            coefficientHalf = this.context.createGain(),
            inputLeft = this.context.createGain(),
            inputRight = this.context.createGain(),
            leftAddRight = this.io.createAdd(),
            rightMinusLeft = this.io.createSubtract(),
            multiplyPointFive = this.io.createMultiply( 0.5 ),
            multiplyCoefficient = this.io.createMultiply(),
            monoMinusStereo = this.io.createSubtract(),
            monoPlusStereo = this.io.createAdd(),
            merger = this.context.createChannelMerger( 2 );

        this.io.constantDriver.connect( coefficient );
        coefficient.connect( coefficientHalf );
        coefficientHalf.connect( multiplyCoefficient.inputs[ 1 ] );
        coefficientHalf.gain.value = 0.5;

        splitter.connect( leftAddRight, 0, 0 ); // L -> add0
        splitter.connect( leftAddRight, 1, 1 ); // R -> add1
        splitter.connect( rightMinusLeft, 0, 1 ); // L -> sub1
        splitter.connect( rightMinusLeft, 1, 0 ); // R -> sub0

        inputLeft.connect( leftAddRight, 0, 0 );
        inputRight.connect( leftAddRight, 0, 1 );
        inputLeft.connect( rightMinusLeft, 0, 1 );
        inputRight.connect( rightMinusLeft, 0, 0 );

        leftAddRight.connect( multiplyPointFive );
        rightMinusLeft.connect( multiplyCoefficient );

        multiplyPointFive.connect( monoMinusStereo, 0, 0 );
        multiplyCoefficient.connect( monoMinusStereo, 0, 1 );

        multiplyPointFive.connect( monoPlusStereo, 0, 0 );
        multiplyCoefficient.connect( monoPlusStereo, 0, 1 );

        monoMinusStereo.connect( merger, 0, 0 );
        monoPlusStereo.connect( merger, 0, 1 );

        this.inputs = [ splitter ];
        this.inputLeft = inputLeft;
        this.inputRight = inputRight;
        this.outputs = [ merger ];

        this._value = coefficient.gain;
    }

    get value() {
        return this._value.gain;
    },
    set value( value ) {
        this._value.value = value;
    }
}

AudioIO.mixinSingle( StereoWidth.prototype, _setIO, '_setIO' );
AudioIO.mixin( StereoWidth.prototype, connections );
AudioIO.mixin( StereoWidth.prototype, cleaners );

AudioIO.prototype.createStereoWidth = function( width ) {
    return new StereoWidth( this, width );
};