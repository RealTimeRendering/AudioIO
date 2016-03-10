import CONFIG from "../core/config.es6";

function PinkNumber() {
    this.maxKey = 0x1f;
    this.key = 0;
    this.whiteValues = [];
    this.range = 128;
    this.limit = 5;

    this.generate = this.generate.bind( this );
    this.getNextValue = this.getNextValue.bind( this );
}

PinkNumber.prototype.generate = function( range, limit ) {
    this.range = range || 128;
    this.maxKey = 0x1f;
    this.key = 0;
    this.limit = limit || 1;

	var rangeLimit = this.range / this.limit;

    for( var i = 0; i < this.limit; ++i ) {
        this.whiteValues[ i ] = Math.random() % rangeLimit;
    }
};

PinkNumber.prototype.getNextValue = function() {
    var lastKey = this.key,
        sum = 0;

    ++this.key;

    if( this.key > this.maxKey ) {
        this.key = 0;
    }

    var diff = this.lastKey ^ this.key;
    var rangeLimit = this.range / this.limit;

    for( var i = 0; i < this.limit; ++i ) {
        if( diff & (1 << i) ) {
            this.whiteValues[ i ] = Math.random() % rangeLimit;
        }

        sum += this.whiteValues[ i ];
    }

    return sum / this.limit;
};

var pink = new PinkNumber();
pink.generate();





export default {
	roundFromEpsilon: function( n ) {
		let rounded = Math.round( n );

		if ( rounded % n < CONFIG.epsilon ) {
			return rounded
		}
		else {
			return n;
		}
	},

	roundToMultiple: function( n, multiple ) {
		return Math.floor( ( n + multiple - 1 ) / multiple ) * multiple;
	},

	clamp: function( value, min, max ) {
		return Math.min( max, Math.max( value, min ) );
	},

	scaleNumber: function( num, lowIn, highIn, lowOut, highOut ) {
		return ( ( num - lowIn ) / ( highIn - lowIn ) ) * ( highOut - lowOut ) + lowOut;
	},

	scaleNumberExp: function( num, lowIn, highIn, lowOut, highOut, exp ) {
		if ( typeof exp !== 'number' || exp === 1 ) {
			return this.scaleNumber( num, lowIn, highIn, lowOut, highOut );
		}

		if ( ( num - lowIn ) / ( highIn - lowIn ) === 0 ) {
			return lowOut;
		}
		else {
			if ( ( num - lowIn ) / ( highIn - lowIn ) > 0 ) {
				return ( lowOut + ( highOut - lowOut ) * Math.pow( ( num - lowIn ) / ( highIn - lowIn ), exp ) );
			}
			else {
				return ( lowOut + ( highOut - lowOut ) * -( Math.pow( ( ( -num + lowIn ) / ( highIn - lowIn ) ), exp ) ) );
			}
		}
	},

	// A very poor approximation of a gaussian random number generator!
	gaussianRandom: function( cycles ) {
		cycles = cycles || 10;

		var n = 0,
			i = cycles;

		while( --i ) {
			n += Math.random();
		}

		return n / cycles;
	},

	// From:
	// 	http://www.meredithdodge.com/2012/05/30/a-great-little-javascript-function-for-generating-random-gaussiannormalbell-curve-numbers/
	nrand: function() {
		var x1,
			x2,
			rad,
			y1;

		do {
			x1 = 2 * Math.random() - 1;
			x2 = 2 * Math.random() - 1;
			rad = x1 * x1 + x2 * x2;
		} while( rad >= 1 || rad === 0 );

		var c = Math.sqrt( -2 * Math.log( rad ) / rad );

		return ((x1 * c) / 5) * 0.5 + 0.5;
	},

	generatePinkNumber: pink.generate,
	getNextPinkNumber: pink.getNextValue,

};