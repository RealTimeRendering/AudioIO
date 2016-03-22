import CONFIG from '../core/config.es6';
import math from '../mixins/Math.es6';


var BufferGenerators = {};

BufferGenerators.SineWave = function sineWaveIterator( i, length ) {
    var x = Math.PI * ( i / length ) - Math.PI * 0.5;
    return Math.sin( x * 2 );
};

BufferGenerators.SawWave = function sawWaveIterator( i, length ) {
    return ( i / length ) * 2 - 1;
};

BufferGenerators.SquareWave = function squareWaveIterator( i, length ) {
    var x = ( i / length ) * 2 - 1;
    return Math.sign( x + 0.001 );
};

BufferGenerators.TriangleWave = function triangleWaveIterator( i, length ) {
    var x = Math.abs( ( i % length * 2 ) - length ) - length * 0.5;
    return Math.sin( x / ( length * 0.5 ) );
};

BufferGenerators.WhiteNoise = function whiteNoiseIterator() {
    return Math.random() * 2 - 1;
};

BufferGenerators.GaussianNoise = function gaussianNoiseIterator() {
    return math.nrand() * 2 - 1;
};

BufferGenerators.PinkNoise = ( function() {
    var hasGeneratedPinkNumber = false;

    return function pinkNoiseIterator( i, length ) {
        var number;

        if ( hasGeneratedPinkNumber === false ) {
            math.generatePinkNumber( 128, 5 );
            hasGeneratedPinkNumber = true;
        }

        number = math.getNextPinkNumber() * 2 - 1;

        if ( i === length - 1 ) {
            hasGeneratedPinkNumber = false;
        }

        return number;
    };
}() );

export default BufferGenerators;