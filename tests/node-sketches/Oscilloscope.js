function Oscilloscope( element, io, width, height, fftSize ) {
    this.canvas = typeof element === 'string' ? document.querySelector( element ) : element;
    this.ctx = this.canvas.getContext( '2d' );

    console.dir( this.canvas );

    this.width = width || this.canvas.offsetWidth;
    this.height = height || this.canvas.offsetHeight;
    this.fftSize = fftSize || 2048;

    // Set the canvas's width and height values,
    // ensuring that the canvas is scaled correctly on
    // devices with a pixel-ratio > 1.
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';

    this.width *= window.devicePixelRatio;
    this.height *= window.devicePixelRatio;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Set context styles, inc. lineWidth based on pixel-ratio.
    this.ctx.strokeStyle = 'rgba( 255, 255, 255, 1.0 )';
    this.ctx.lineWidth = window.devicePixelRatio * 0.5;
    this.ctx.fillStyle = 'rgba( 50, 50, 50, 0.2 )';

    // Set a minimum threshold by which the zero crossing
    // will be found.
    this.minVal = 137;

    // A flag to indicate whether the oscilloscope is
    // currently rendering or not.
    this.active = false;

    // Create an analyser node using the AudioContext attached
    // to the given AudioIO instance, and a typed array to hold
    // the time domain data.
    this.analyser = io.context.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.data = new Uint8Array( this.analyser.frequencyBinCount );

    // Scope needs to be bound to the update function since
    // it'll be called by `requestAnimationFrame`.
    this.update = this.update.bind( this );

    this.counter = 0;
}


// I found this incredibly useful function in an article about
// visualizing WebAudio output, but unfortunately I can't find
// the source. Needless to say, this function isn't my work, but
// has been adapted slightly.
Oscilloscope.prototype.findZeroCrossing = function( buffer, bufferLength ) {
    var i = 0,
        lastZero = -1,
        t;

    // Advance until we're zero or negative
    while ( i < bufferLength && ( buffer[ i ] > 128 ) ) {
        i++;
    }

    if ( i >= bufferLength ) {
        return 0;
    }

    // Advance until we're above MINVAL, keeping track of last zero.
    while ( i < bufferLength && ( ( t = buffer[ i ] ) < this.minVal ) ) {
        if ( t >= 128 ) {
            if ( lastZero == -1 )
                lastZero = i;
        }
        else
            lastZero = -1;
        i++;
    }

    // We may have jumped over MINVAL in one sample.
    if ( lastZero == -1 ) {
        lastZero = i;
    }

    // We didn't find any positive zero crossings
    if ( i == bufferLength ) {
        return 0;
    }

    // The first sample might be a zero.  If so, return it.
    if ( lastZero == 0 ) {
        return 0;
    }

    return lastZero;
};

// Once the data array has been filled, this function takes
// care of drawing the data.
Oscilloscope.prototype.draw = function() {
    var ctx = this.ctx,
        data = this.data,
        w = this.width,
        h = this.height,
        zeroCrossing = this.findZeroCrossing( data, data.length ),
        scaling = h / 256;

    ctx.fillRect( 0, 0, w, h );
    ctx.beginPath();
    ctx.moveTo( 0, ( 256 - data[ zeroCrossing ] ) * scaling );

    // Starting at the position in the data array where
    // the zero-crossing was found, draw a pretty line
    // through the remaining data points, making sure
    // the line is scaled to the canvas.
    for ( var i = zeroCrossing, j = 0; j < w && i < data.length; i++, j++ ) {
        ctx.lineTo( j, ( 256 - data[ i ] ) * scaling );
    }

    ctx.stroke();
    ctx.closePath();
};

Oscilloscope.prototype.update = function() {
    // Only request another frame if we still
    // want to draw.
    if ( this.active === true ) {
        requestAnimationFrame( this.update );
    }

    // if ( ++this.counter === 1 ) {
    //     console.log( this.data );
    // }
    // Fill the Uint8Array with the time domain values,
    // and hand off to the draw function.
    this.analyser.getByteTimeDomainData( this.data );
    this.draw();
};

// Sets the `active` flag and starts rendering.
Oscilloscope.prototype.start = function() {
    if ( this.active === false ) {
        this.active = true;
        this.update();
    }
};

// Stops rendering by falsifying the `active` flag.
Oscilloscope.prototype.stop = function() {
    this.active = false;
};