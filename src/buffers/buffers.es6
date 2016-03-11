import CONFIG from '../core/config.es6';
import math from '../mixins/Math.es6';


let buffers = {};

Object.defineProperty( buffers, 'SineWave', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.defaultBufferSize,
            curve = new Float32Array( resolution );

        for ( let i = 0, x; i < resolution; ++i ) {
            x = Math.PI * ( i / resolution ) - Math.PI * 0.5;
            x *= 2;
            curve[ i ] = Math.sin( x );
        }

        return curve;
    }() )
} );

Object.defineProperty( buffers, 'SawWave', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.defaultBufferSize,
            curve = new Float32Array( resolution );

        for ( let i = 0, x; i < resolution; ++i ) {
            x = ( i / resolution ) * 2 - 1;
            curve[ i ] = x;
        }

        return curve;
    }() )
} );

Object.defineProperty( buffers, 'SquareWave', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.defaultBufferSize,
            curve = new Float32Array( resolution );

        for ( let i = 0, x; i < resolution; ++i ) {
            x = ( i / resolution ) * 2 - 1;
            curve[ i ] = Math.sign(x + 0.001);
        }

        // console.log( curve );

        return curve;
    }() )
} );

Object.defineProperty( buffers, 'TriangleWave', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.defaultBufferSize,
            curve = new Float32Array( resolution );

        for ( let i = 0, x; i < resolution; ++i ) {
            x = Math.abs((i % resolution * 2) - resolution) - resolution*0.5;
            x /= resolution * 0.5;
            curve[ i ] = x;
        }

        return curve;
    }() )
} );


module.exports = buffers;