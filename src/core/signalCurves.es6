import CONFIG from './config.es6';
import math from '../mixins/Math.es6';


let signalCurves = {};

Object.defineProperty( signalCurves, 'Constant', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution,
            curve = new Float32Array( resolution );

        for ( let i = 0; i < resolution; ++i ) {
            curve[ i ] = 1.0;
        }

        return curve;
    }() )
} );

Object.defineProperty( signalCurves, 'Linear', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution,
            curve = new Float32Array( resolution );

        for ( let i = 0, x; i < resolution; ++i ) {
            x = ( i / resolution ) * 2 - 1;
            curve[ i ] = x;
        }

        return curve;
    }() )
} );


Object.defineProperty( signalCurves, 'EqualPower', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution,
            curve = new Float32Array( resolution ),
            sin = Math.sin,
            PI = Math.PI;

        for ( let i = 0, x; i < resolution; ++i ) {
            x = ( i / resolution ) * 2 - 1;
            curve[ i ] = sin( x * 0.5 * PI );
        }

        return curve;
    }() )
} );



Object.defineProperty( signalCurves, 'Cubed', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution,
            curve = new Float32Array( resolution ),
            sin = Math.sin,
            PI = Math.PI,
            pow = Math.pow;

        for ( let i = 0, x; i < resolution; ++i ) {
            x = ( i / resolution ) * 2 - 1;
            x = pow( x, 3 );
            curve[ i ] = sin( x * 0.5 * PI );
        }

        return curve;
    }() )
} );


Object.defineProperty( signalCurves, 'Rectify', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution,
            halfResolution = resolution * 0.5,
            curve = new Float32Array( resolution );

        for ( let i = -halfResolution, x = 0; i < halfResolution; ++i ) {
            x = ( i > 0 ? i : -i ) / halfResolution;
            curve[ i + halfResolution ] = x;
        }

        return curve;
    }() )
} );



// Math curves
Object.defineProperty( signalCurves, 'GreaterThanZero', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution,
            curve = new Float32Array( resolution );

        for ( let i = 0, x; i < resolution; ++i ) {
            x = ( i / resolution ) * 2 - 1;
            curve[ i ] = x <= 0 ? 0.0 : 1.0;
        }

        return curve;
    }() )
} );

Object.defineProperty( signalCurves, 'LessThanZero', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution,
            curve = new Float32Array( resolution );

        for ( let i = 0, x; i < resolution; ++i ) {
            x = ( i / resolution ) * 2 - 1;
            curve[ i ] = x >= 0 ? 0 : 1;
        }

        return curve;
    }() )
} );


Object.defineProperty( signalCurves, 'EqualToZero', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution,
            curve = new Float32Array( resolution );

        for ( let i = 0, x; i < resolution; ++i ) {
            x = ( i / resolution ) * 2 - 1;
            curve[ i ] = x === 0 ? 1 : 0;
        }

        return curve;
    }() )
} );


Object.defineProperty( signalCurves, 'Reciprocal', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = 4096 * 600, // Higher resolution needed here.
            curve = new Float32Array( resolution );

        for ( let i = 0, x; i < resolution; ++i ) {
            x = ( i / resolution ) * 2 - 1;
            // curve[ i ] = x === 0 ? 1 : 0;

            if ( x !== 0 ) {
                x = Math.pow( x, -1 );
            }

            curve[ i ] = x;
        }

        return curve;
    }() )
} );


Object.defineProperty( signalCurves, 'Sine', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution,
            curve = new Float32Array( resolution ),
            sin = Math.sin;

        for ( let i = 0, x; i < resolution; ++i ) {
            x = ( i / resolution ) * (Math.PI * 2) - Math.PI;
            curve[ i ] = sin( x );
        }

        return curve;
    }() )
} );

Object.defineProperty( signalCurves, 'Round', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution * 50,
            curve = new Float32Array( resolution );

        for ( let i = 0, x; i < resolution; ++i ) {
            x = ( i / resolution ) * 2 - 1;

            if (
                ( x > 0 && x <= 0.50001 ) ||
                ( x < 0 && x >= -0.50001 )
            ) {
                x = 0;
            }
            else if ( x > 0 ) {
                x = 1
            }
            else {
                x = -1;
            }


            curve[ i ] = x;
        }

        return curve;
    }() )
} );

Object.defineProperty( signalCurves, 'Sign', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution * 2,
            curve = new Float32Array( resolution );

        for ( let i = 0, x; i < resolution; ++i ) {
            x = ( i / resolution ) * 2 - 1;
            curve[ i ] = Math.sign( x );
        }

        return curve;
    }() )
} );


Object.defineProperty( signalCurves, 'Floor', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution * 50,
            curve = new Float32Array( resolution );

        for ( let i = 0, x; i < resolution; ++i ) {
            x = ( i / resolution ) * 2 - 1;

            if ( x >= 0.9999 ) {
                x = 1;
            }
            else if ( x >= 0 ) {
                x = 0;
            }
            else if ( x < 0 ) {
                x = -1;
            }


            curve[ i ] = x;
        }

        return curve;
    }() )
} );

Object.defineProperty( signalCurves, 'GaussianWhiteNoise', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution * 2,
            curve = new Float32Array( resolution );

        for ( let i = 0, x; i < resolution; ++i ) {
            curve[ i ] = math.nrand();
        }

        return curve;
    }() )
} );

Object.defineProperty( signalCurves, 'WhiteNoise', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution * 2,
            curve = new Float32Array( resolution );

        for ( let i = 0, x; i < resolution; ++i ) {
            curve[ i ] = Math.random();
        }

        return curve;
    }() )
} );

Object.defineProperty( signalCurves, 'PinkNoise', {
    writable: false,
    enumerable: true,
    value: ( function() {
        let resolution = CONFIG.curveResolution * 2,
            curve = new Float32Array( resolution );

        math.generatePinkNumber();

        for ( let i = 0, x; i < resolution; ++i ) {
            curve[ i ] = math.getNextPinkNumber() * 2 - 1;
        }

        return curve;
    }() )
} );



module.exports = signalCurves;