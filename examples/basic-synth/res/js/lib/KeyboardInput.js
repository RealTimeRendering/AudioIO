function KeyboardInput( element, callback ) {

    var KEY_CODES = this.constructor.KEY_CODES;

    // Grab the necessary elements from the DOM
    this.element = typeof element === 'string' ? document.querySelector( element ) : element;
    this.keys = Array.prototype.slice.call( this.element.querySelectorAll( '.key' ) );

    // For each key found in the DOM, add interactivity
    // and store the keyCode on the DOM object. It's
    // not pretty, I know, but it does save going
    // around the houses later!
    this.keys.forEach( function( key, index ) {
        var keyCode = KEY_CODES[ index ];

        key._keyCode = keyCode;
        this._addKeyInteractivity( key, keyCode );
    }.bind( this ) );


    // A flag used to determine if a mousedown event
    // has been triggered.
    this.active = false;

    // Played note settings
    this.octave = 3;
    this.velocity = 100;

    this.callback = callback;

    // Arrays used to store which keys are currently
    // active.
    this.activeKeyFlags = [];
    this.activeKeyElements = [];

    // Fill the flag and element arrays with some data to save
    // some checks later on.
    for ( var i = 0; i < KEY_CODES.length; ++i ) {
        this.activeKeyFlags[ KEY_CODES[ i ] ] = false;
        this.activeKeyElements[ KEY_CODES[ i ] ] = null;
    }
}

KeyboardInput.constructor = KeyboardInput;

// A map of note names to their relevamt key codes.
//
// These note names are passed (with the `this.octave`
// property added on), to an AudioIO conversion function
// that will give us a hertz value to pass to the synth.
KeyboardInput.KEY_NAMES = {
    'C': 65,
    'C#': 87,
    'D': 83,
    'D#': 69,
    'E': 68,
    'F': 70,
    'F#': 84,
    'G': 71,
    'G#': 89,
    'A': 72,
    'A#': 85,
    'B': 74,
    'C+8VE': 75
};

// Following the note name map above, this is just a flat
// array of the values for easy access. It's not very DRY,
// though, but this is just a sketch for now.
KeyboardInput.KEY_CODES = [
    65,
    87,
    83,
    69,
    68,
    70,
    84,
    71,
    89,
    72,
    85,
    74,
    75
];


KeyboardInput.prototype._addKeyInteractivity = function( key, keyCode ) {
    key.addEventListener( 'mousedown', this, false );
    document.addEventListener( 'mouseup', this, false );

    document.addEventListener( 'keydown', function( e ) {
        if ( e.keyCode === keyCode && this.activeKeyFlags[ keyCode ] === false ) {
            this.onKeyDown( key, keyCode );
        }
    }.bind( this ), false );

    document.addEventListener( 'keyup', function( e ) {
        if ( e.keyCode === keyCode && this.activeKeyFlags[ keyCode ] === true ) {
            this.onKeyUp( key, keyCode );
        }
    }.bind( this ), false );
};

KeyboardInput.prototype.handleEvent = function( e ) {
    switch ( e.type ) {
        case 'mousedown':
            this.onMouseDown( e );
            break;

        case 'mouseup':
            this.onMouseUp( e );
            break;
    }
};

// Sets the active flag and delegates to onKeyDown
// for main functionality.
KeyboardInput.prototype.onMouseDown = function( e ) {
    var key = e.target;

    this.active = true;

    // Stops rapid clicks triggering text-selection
    // on other DOM elements.
    e.preventDefault();

    this.onKeyDown( key, key._keyCode );
};

// Falsifies the active flag and delegates to onKeyUp.
//
// Also ensures that any other active keys are turned off.
KeyboardInput.prototype.onMouseUp = function( e ) {
    if ( this.active === false ) {
        return;
    }

    this.active = false;

    for ( var i = 0; i < this.activeKeyFlags.length; ++i ) {
        if ( this.activeKeyFlags[ i ] === true ) {
            this.onKeyUp( this.activeKeyElements[ i ], i );
        }
    }
};

// Set the appropriate flags using the given keyCode argument,
// fire the callback, and make sure the key DOM element has
// the proper styles associated with it.
KeyboardInput.prototype.onKeyDown = function( key, keyCode ) {
    this.activeKeyFlags[ keyCode ] = true;
    this.activeKeyElements[ keyCode ] = key;
    this._triggerCallback( true, key, keyCode );
    this._activateKey( key );
};

// Falsify active flags, fire the callback and deactivate
// the given key's DOM element.
KeyboardInput.prototype.onKeyUp = function( key, keyCode ) {
    this.activeKeyFlags[ keyCode ] = false;
    this.activeKeyElements[ keyCode ] = null;
    this._triggerCallback( false, key, keyCode );
    this._deactivateKey( key );
};

KeyboardInput.prototype._activateKey = function( key ) {
    key.setAttribute( 'state', 'down' );
};

KeyboardInput.prototype._deactivateKey = function( key ) {
    key.setAttribute( 'state', 'up' );
};

// Given the key element and the keyCode associated with it,
// look up the associated note name using the key code, add
// the octave value onto it, and pass it along to the callback function.
KeyboardInput.prototype._triggerCallback = function( state, key, keyCode ) {
    var note,
        octave = this.octave,
        notes = this.constructor.KEY_NAMES;

    for ( var name in notes ) {
        if ( notes[ name ] === keyCode ) {
            note = name;
        }
    }

    if ( ~note.indexOf( '+8VE' ) ) {
        octave += 1;
        note = note.replace( '+8VE', '' );
    }


    this.callback( state, note + octave, this.velocity );
};