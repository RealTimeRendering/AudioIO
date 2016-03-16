var Utils = {};

Utils.isTypedArray = function( array ) {
	if ( array !== undefined && array.buffer instanceof ArrayBuffer ) {
		return true;
	}

	return false;
};

export default Utils;