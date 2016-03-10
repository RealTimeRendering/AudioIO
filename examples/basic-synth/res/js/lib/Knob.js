function Knob( element, callback ) {
    this.element = typeof element === 'string' ? document.querySelector( element ) : element;
    this.elementBottom = this.element.querySelector( '.bottom' );
    this.elementIndicator = this.element.querySelector( '.indicator' );
    this.elementReadout = this.element.querySelector( '.readout' );

    var size = this.element.className.match( /(large|medium|small|tiny)/g );
    this.elementSize = size === null ? 'large' : size[ 0 ];

    this.callback = callback;

    this.active = false;

    this.start = {
        x: 0,
        y: 0
    };

    this.move = {
        x: 0,
        y: 0
    };

    // This object will hold the values that control
    // the behaviour of the knob. They're all set using
    // the `._setAttribute` function to stay nice and DRY.
    this.attributes = {};

    // Set key/value pairs in the `.attributes` property above
    // whilst assigning defaults where no values are given in the
    // DOM element.
    this._setAttribute( 'min', 0 );
    this._setAttribute( 'max', 127 );
    this._setAttribute( 'value', function() {
        return Math.abs( this.attributes.max - this.attributes.min ) * 0.5;
    } );
    this._setAttribute( 'exponent', 1 );
    this._setAttribute( 'startAngle', -135 );
    this._setAttribute( 'endAngle', 135 );
    this._setAttribute( 'sensitivity', 1 );

    // Store ranges.
    this.ranges = {
        angle: Math.abs( this.attributes.endAngle - this.attributes.startAngle ),
        value: Math.abs( this.attributes.max - this.attributes.min )
    };

    // The `deltaMultiplier` is used to multiply the mouse movement delta
    // before adding it to the amgle property.
    this.deltaMultiplier = this.ranges.value / this.ranges.angle;

    // Now that we have the deltaMultiplier, we can use that
    // as the default `step` value if one isn't present on
    // the DOM element.
    this._setAttribute( 'step', this.deltaMultiplier );
    this.numSteps = this.ranges.value / this.attributes.step;
    this.angleStep = this.ranges.angle / this.numSteps;

    // Set value-related properties.
    this.value = this.attributes.value;
    this.steppedValue = this._roundToMultiple( this.value, this.attributes.step );
    this.defaultValue = this.value;

    // Set default angle-related properties. Not using `this._setAngle()`
    // here since initial value is set before initial angle. After
    // interaction, the angle is used to calculate the value.
    this.angle = this._scaleNumberExp(
        this.value,
        this.attributes.min,
        this.attributes.max,
        this.attributes.startAngle,
        this.attributes.endAngle,
        this.attributes.exponent
    );
    this.steppedAngle = this._roundToMultiple( this.angle - this.attributes.startAngle, this.angleStep ) + this.attributes.startAngle;;

    // Set default visible state.
    this._setReadout();
    this._setTransform();

    this.element.addEventListener( 'mousedown', this, false );
    this.element.addEventListener( 'dblclick', this, false );
    document.addEventListener( 'mousemove', this, false );
    document.addEventListener( 'mouseup', this, false );
}

Knob.prototype._setAttribute = function( attrName, defaultValue ) {
    var attrValue = this.element.getAttribute( attrName );

    if ( typeof attrValue !== 'string' ) {
        attrValue = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }
    else {
        attrValue = parseFloat( attrValue );
    }

    this.attributes[ attrName ] = attrValue;
};

// This function mimics Max/MSP's `scale` object.
// Can't remember where I found it, but pretty sure it
// was on the Max/MSP forums a looong time ago!
Knob.prototype._scaleNumber = function( num, lowIn, highIn, lowOut, highOut ) {
    return ( ( num - lowIn ) / ( highIn - lowIn ) ) * ( highOut - lowOut ) + lowOut;
};

// Exponential version of the `scaleNumber` function above.
Knob.prototype._scaleNumberExp = function( num, lowIn, highIn, lowOut, highOut, exp ) {
    if ( typeof exp !== 'number' || exp === 1 ) {
        return this._scaleNumber( num, lowIn, highIn, lowOut, highOut );
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
};

Knob.prototype._clamp = function( value, min, max ) {
    return Math.min( max, Math.max( value, min ) );
};

Knob.prototype._roundToMultiple = function( n, multiple ) {
    return Math.round( n / multiple ) * multiple;
};

// Ensure the angle property is cllamped to start- and endAngle props
// before rounding it to the nearest multiple of the angleStep property.
Knob.prototype._setAngle = function() {
    var attrs = this.attributes;

    this.angle = this._clamp( this.angle, attrs.startAngle, attrs.endAngle );
    this.steppedAngle = this._roundToMultiple( this.angle - attrs.startAngle, this.angleStep ) + attrs.startAngle;
};

// Using the angle as a starting point, work out the value.
Knob.prototype._setValue = function() {
    var attrs = this.attributes;

    this.value = this._scaleNumberExp( this.angle, attrs.startAngle, attrs.endAngle, attrs.min, attrs.max, attrs.exponent );
    this.steppedValue = this._roundToMultiple( this.value, attrs.step );
};

// If there's a readout element present, print
// the value to it.
Knob.prototype._setReadout = function() {
    var value = this.steppedValue;

    if ( this.elementReadout instanceof HTMLElement ) {
        if ( this.attributes.step >= 1 ) {
            value = Math.round( value );
            this.elementReadout.textContent = value;
        }
        else {
            this.elementReadout.textContent = this.elementSize !== 'tiny' ? value.toFixed( 2 ) : value.toFixed( 1 );
        }
    }
};

// Set the transform styles on the bottom and
// indicator elements. Boooo to vendor-prefixes.
Knob.prototype._setTransform = function() {
    var str = 'rotate(' + this.steppedAngle + 'deg)',
        bottom = this.elementBottom.style,
        indicator = this.elementIndicator.style;

    bottom.transform = bottom.WebkitTransform = bottom.MozTransform = str;
    indicator.transform = indicator.WebkitTransform = indicator.MozTransform = str;
};

// Preserve scope while switching on events.
Knob.prototype.handleEvent = function( e ) {
    switch ( e.type ) {
        case 'dblclick':
            this.onDoubleClick( e );
            break;
        case 'mousedown':
            this.onMouseDown( e );
            break;
        case 'mousemove':
            this.onMouseMove( e );
            break;
        case 'mouseup':
            this.onMouseUp( e );
            break;
    }
};

// When a knob is double-clicked, reset the value to the
// default value (as given by the `value` attribute in the DOM)
Knob.prototype.onDoubleClick = function( e ) {
    this.value = this.defaultValue;


    this.angle = this._scaleNumberExp(
        this.value,
        this.attributes.min,
        this.attributes.max,
        this.attributes.startAngle,
        this.attributes.endAngle,
        this.attributes.exponent
    );
    this._setReadout();
    this._setTransform();

    if ( typeof this.callback === 'function' ) {
        this.callback( this.value );
    }
};

// Set the x and y start position when mouse down
// is triggered.
Knob.prototype.onMouseDown = function( e ) {
    e.preventDefault();

    this.active = true;
    this.start.x = e.pageX;
    this.start.y = e.pageY;
};

// When the mouse is moved after a mousedown event,
// make sure the value and transform angle are calculated
// correctly and then applied to the element.
//
// The `.callout` method is invoked with the new value
// if it's present.
Knob.prototype.onMouseMove = function( e ) {
    if ( !this.active ) return;

    e.preventDefault();

    this.move.x = e.pageX;
    this.move.y = e.pageY;

    var dx = this.start.x - this.move.x,
        dy = this.start.y - this.move.y,
        startAngle = this.steppedAngle,
        attrs = this.attributes;


    this.start.x = this.move.x;
    this.start.y = this.move.y;

    // If we're outside bounds, don't do owt.
    if (
        ( dy <= 0 && this.angle === attrs.startAngle ) ||
        ( dy >= 0 && this.angle === attrs.endAngle )
    ) {
        return;
    }

    this.angle += dy * attrs.sensitivity;

    // Set properties and visual feedback values.
    this._setAngle();
    this._setValue();
    this._setTransform();
    this._setReadout();

    if ( /*this.steppedAngle !== startAngle &&*/ typeof this.callback === 'function' ) {
        this.callback( this.steppedValue, this );
    }
};

// De-activate the event listeners on mouseup if necessary.
Knob.prototype.onMouseUp = function( e ) {
    if ( this.active ) {
        e.preventDefault();
        this.active = false;
    }
};