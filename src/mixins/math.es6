import CONFIG from "../core/config.es6";

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
};