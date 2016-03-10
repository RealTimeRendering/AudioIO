/**
 * Creates a pool of instantiated constructors.
 *
 * Arguments:
 * 	- `Constructor`: 			A reference to the constructor to use in
 * 								the pool.
 *
 * 	- `size`: 					The number of instances to create.
 *
 *  - `constructorArguments`: 	An array of arguments to pass to the
 *   				   			constructor when it's instantiated.
 *
 * 	- `onCreate`: 				A function called after each individual
 * 				  				instance is created. Called with one argument,
 * 				    			which is the instance just created.
 */
class Pool {
	constructor( Constructor, size, constructorArguments, onCreate ) {
		this.size = size;
		this.Constructor = Constructor;
		this.constructorArguments = constructorArguments;
		this.onCreate = onCreate || function() {};

		this.pool = [];

		this.populate();
	}

	populate() {
		for( let i = this.size - 1, instance; i >= 0; --i ) {
			instance = this._createInstance.apply( this, this.constructorArguments );
			this.onCreate( instance );
			this.pool.push( instance );
		}
	}

	get() {
		if( this.pool.length > 0 ) {
			var instance = this.pool.pop();
			instance.__inUse__ = true;
			return instance;
		}
		else {
			return null;
		}
	}

	release( instance ) {
		instance.__inUse__ = false;
		this.pool.unshift( instance );
	}
}

Pool.prototype._createInstance = (function() {
	var Constructor;

	// The surrogate Constructor. Returns an instance of
	// `this.Constructor` called with an array of arguments.
	function Surrogate( args ) {
		return Constructor.apply( this, args );
	}


	return function() {
		// If it's the first time running this
		// function, set up the Constructor variable and the
		// Surrogate's prototype, so the Constructor is constructed
		// properly.
		if( !Constructor ) {
			Constructor = this.Constructor;
			Surrogate.prototype = Constructor.prototype;
		}

		// Return a new instance of the Surrogate constructor,
		// which itself returns a new instance of the `this.Constructor`
		// constructor.
		return new Surrogate( arguments );
	};
}());

export default Pool;