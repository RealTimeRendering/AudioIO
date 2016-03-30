function SpectrumAnalyser( element, io, bars, width, height, fftSize ) {
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

    this.bars = bars || this.canvas.width;

    // Set context styles, inc. lineWidth based on pixel-ratio.
    this.ctx.strokeStyle = 'rgba( 255, 255, 255, 1.0 )';
    this.ctx.lineWidth = window.devicePixelRatio * 0.5;
    this.ctx.fillStyle = 'rgba( 50, 50, 50, 0.9 )';

    // Set a minimum threshold by which the zero crossing
    // will be found.
    this.minVal = 137;

    // A flag to indicate whether the SpectrumAnalyser is
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


// Once the data array has been filled, this function takes
// care of drawing the data.
SpectrumAnalyser.prototype.draw = function() {
    var length = this.data.length,
        barSize = Math.floor( length / this.bars ),
        barWidth = this.width / this.bars,
        ctx = this.ctx;

    ctx.clearRect( 0, 0, this.width, this.height );

    for ( var i = 0; i < this.bars; ++i ) {
        var sum = 0;

        for ( var j = 0; j < barSize; ++j ) {
            sum += this.data[ ( i * barSize ) + j ];
        }

        // Calculate the average frequency of the samples in the bin
        var average = sum / barSize;

        // Draw the bars on the canvas
        var barWidth = this.width / this.bars;
        var scaled_average = ( average / 256 );

        // console.log( scaled_average, this.scalarToDb( scaled_average ) );

        this.ctx.fillRect(
            i * barWidth,
            this.height,
            barWidth,
            scaled_average * -this.height
        );
    }
};

SpectrumAnalyser.prototype.scalarToDb = function( scalar ) {
    return 20 * ( Math.log( scalar ) / Math.LN10 );
};

SpectrumAnalyser.prototype.update = function() {
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
    this.analyser.getByteFrequencyData( this.data );
    this.draw();
};

// Sets the `active` flag and starts rendering.
SpectrumAnalyser.prototype.start = function() {
    if ( this.active === false ) {
        this.active = true;
        this.update();
    }
};

// Stops rendering by falsifying the `active` flag.
SpectrumAnalyser.prototype.stop = function() {
    this.active = false;
};