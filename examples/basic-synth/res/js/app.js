// Initializing the namespace like this is a bit odd,
// but for this purpose it provides a quick overview
// of what sits where.
var app = {
    // Will eventually hold an instance of AudioIO
    io: null,

    // Holds an instance of AudioIO's GeneratorPlayer,
    // which takes a sound generator and allows it to
    // be triggered.
    synths: [],

    // Will hold the PingPongDelay node
    delay: null,

    // This object is created and then passed to the
    // generator player constructor when it's instantiated.
    synthConfig: null,

    // Will hold a Gain node, to save our ears
    masterGain: null,

    waveforms: [ 'sine', 'triangle', 'square', 'sawtooth' ],

    // Will hold instances of the `Knob` constructor
    // that will control the synth
    knobs: {}
};

// Creates the audio graph using my AudioIO library.
app.createAudioPieces = function() {
    app.io = new AudioIO();

    app.synthConfig = {
        generator: app.io.createOscillatorGenerator,
        unison: 1,
        unisonDetune: 700,
        unisonMode: 'chord',
        tuning: 12,
        velocitySensitivity: 1,
        glideTime: 750,
        polyphony: 5,
        waveform: 'square'
    };

    // Create the two synths, using the synthConfig object defined above.
    app.synths[ 0 ] = app.io.createGeneratorPlayer( app.synthConfig );
    app.synths[ 1 ] = app.io.createGeneratorPlayer( app.synthConfig );

    // Create a simple delay effect
    //
    // Arguments: delay time (seconds), feedback level (0-1)
    app.delay = app.io.createPingPongDelay( 0.25, 0.8 );
    app.delayDryWet = app.io.createConstant( 0 );
    app.delayDryWet.connect( app.delay.controls.dryWet );

    app.delayFeedback = app.io.createConstant( 0 );
    app.delayTime = app.io.createConstant( 0 );
    app.delayFeedback.connect( app.delay.controls.feedback );
    app.delayTime.connect( app.delay.controls.time );

    // Create an intermediary gain node to sit between
    // the synth and the master output so ears will live
    // to see another day. The gain node's volume is controlled
    // by the value attribute of the #masterGain DOM element.
    app.masterGain = app.io.context.createGain();

    // Connect up the components.
    app.synths[ 0 ].connect( app.delay );
    app.synths[ 1 ].connect( app.delay );
    app.delay.connect( app.masterGain );
    app.masterGain.connect( app.io.master );
};

// Creates all the knobs, referencing DOM elements,
// and assigns onChange callbacks, sometimes binding
// arguments to callbacks in the process.
app.createKnobs = function() {
    // Global control knobs
    app.knobs.masterGain = new Knob( '#masterGain', app.onMasterGainKnobChange );
    app.knobs.globalTuning = new Knob( '#globalTuning', app.onGlobalTuningKnobChange );

    // Synth control knobs
    app.knobs.tuning1 = new Knob( '#tuning1', app.onTuningKnobChange.bind( this, app.synths[ 0 ] ) );
    app.knobs.waveform1 = new Knob( '#waveform1', app.onWaveformKnobChange.bind( this, app.synths[ 0 ], 'waveform1' ) );
    app.knobs.unisonDetune1 = new Knob( '#unisonDetune1', app.onUnisonDetuneKnobChange.bind( this, app.synths[ 0 ] ) );
    app.knobs.unisonCount1 = new Knob( '#unisonCount1', app.onUnisonCountKnobChange.bind( this, app.synths[ 0 ] ) );

    app.knobs.tuning2 = new Knob( '#tuning2', app.onTuningKnobChange.bind( this, app.synths[ 1 ] ) );
    app.knobs.waveform2 = new Knob( '#waveform2', app.onWaveformKnobChange.bind( this, app.synths[ 1 ], 'waveform2' ) );
    app.knobs.unisonDetune2 = new Knob( '#unisonDetune2', app.onUnisonDetuneKnobChange.bind( this, app.synths[ 1 ] ) );
    app.knobs.unisonCount2 = new Knob( '#unisonCount2', app.onUnisonCountKnobChange.bind( this, app.synths[ 1 ] ) );

    // Envelope control knobs
    app.knobs.envAttack = new Knob( '#attack', app.onEnvAttackKnobChange );
    app.knobs.envDecay = new Knob( '#decay', app.onEnvDecayKnobChange );
    app.knobs.envSustain = new Knob( '#sustain', app.onEnvSustainKnobChange );
    app.knobs.envRelease = new Knob( '#release', app.onEnvReleaseKnobChange );

    // Delay control knobs
    app.knobs.delayTime = new Knob( '#delayTime', app.onDelayTimeKnobChange );
    app.knobs.delayFeedback = new Knob( '#delayFeedback', app.onDelayFeedbackKnobChange );
    app.knobs.delayDryWet = new Knob( '#delayDryWet', app.onDelayDryWetKnobChange );

    // Trigger all the knob callback functions so the AudioIO components
    // are updated accordingly.
    for ( var knob in app.knobs ) {
        app.knobs[ knob ].callback( app.knobs[ knob ].value );
    }
};

// Creates the pretty little Oscilloscope and connects
// it to the `masterGain` GainNode.
app.createOscilloscope = function() {
    app.oscilloscope = new Oscilloscope( '#scope', app.io );
    app.masterGain.connect( app.oscilloscope.analyser );
    app.oscilloscope.start();
};

// Creates the music keyboard by instantiating the KeyboardInput
// constructor, and also deals with the MIDI input button.
app.createKeyboard = function() {
    var midiButton = document.querySelector( '#midi-enable' );

    app.keyboard = new KeyboardInput( '#keyboard', app.triggerNote );

    if ( typeof navigator.requestMIDIAccess !== 'function' ) {
        midiButton.setAttribute( 'disabled', true );
    }
    else {
        midiButton.addEventListener( 'click', app.enableMIDIInput, false );
    }
};


// A bunch of functions triggered when knob values are changed.
// Function names should show what knob they're fired by.
//
// In most cases, values given by the knobs are transferred
// directly to the synth.
app.onMasterGainKnobChange = function( value ) {
    app.masterGain.gain.value = value;
};
app.onGlobalTuningKnobChange = function( value ) {
    app.synths[ 0 ].tuning.value = value + app.knobs.tuning1.value;
    app.synths[ 1 ].tuning.value = value + app.knobs.tuning2.value;
};

app.onTuningKnobChange = function( synth, value ) {
    synth.tuning.value = value + app.knobs.globalTuning.value;
};
app.onWaveformKnobChange = function( synth, knobName, value ) {
    synth.waveform = app.waveforms[ value ];
    app.knobs[ knobName ].elementReadout.textContent = synth.waveform.substr( 0, 3 );
};
app.onUnisonCountKnobChange = function( synth, value ) {
    synth.unison.value = value;
};
app.onUnisonDetuneKnobChange = function( synth, value ) {
    synth.unisonDetune.value = value * 100;
};

app.onEnvAttackKnobChange = function( value ) {
    app.synths[ 0 ].envelope.attackTime = value;
    app.synths[ 1 ].envelope.attackTime = value;
};
app.onEnvDecayKnobChange = function( value ) {
    app.synths[ 0 ].envelope.decayTime = value;
    app.synths[ 1 ].envelope.decayTime = value;
};
app.onEnvSustainKnobChange = function( value ) {
    app.synths[ 0 ].envelope.sustainLevel = value;
    app.synths[ 1 ].envelope.sustainLevel = value;
};
app.onEnvReleaseKnobChange = function( value ) {
    app.synths[ 0 ].envelope.releaseTime = value;
    app.synths[ 1 ].envelope.releaseTime = value;
};

app.onDelayTimeKnobChange = function( value ) {
    app.delayTime.value = value;
};
app.onDelayFeedbackKnobChange = function( value ) {
    app.delayFeedback.value = value;
};
app.onDelayDryWetKnobChange = function( value ) {
    app.delayDryWet.value = value;
    // app.delay.dryWetControl.value = value;
};


// Fired when either a valid key on the keyboard is pressed
// or the user has clicked one of the keyboard keys in the DOM
app.triggerNote = function( state, note, velocity ) {
    var hz = app.io.convert.noteToHz( note ),
        vel = velocity / 127;

    if ( state === true ) {
        console.log( 'Playing:', note, velocity );
        app.synths[ 0 ].start( hz, vel );
        app.synths[ 1 ].start( hz, vel );
    }
    else {
        console.log( 'Stopping:', note, velocity );
        app.synths[ 0 ].stop( hz, vel );
        app.synths[ 1 ].stop( hz, vel );
    }
};

// Enables MIDI input by enumerating available devices and
// assigning the `onmidimessage` callback.
app.enableMIDIInput = function() {

    document.querySelector( '#midi-enable' ).setAttribute( 'disabled', true );

    navigator.requestMIDIAccess().then( function( midi ) {
        var inputs = midi.inputs.values();

        for ( var input = inputs.next(); input && !input.done; input = inputs.next() ) {
            console.log( input.value.name );
            input.value.onmidimessage = app.onMIDIMessage;
        }
    } );
};

// When a MIDI message is received, the three data bytes
// must be looked at and the relevant data extracted.
//
// Once that's done, the synths are either started or stopped.
app.onMIDIMessage = function( e ) {
    var data = e.data,
        cmd = data[ 0 ] >> 4,
        note = data[ 1 ],
        velocity = data[ 2 ] / 127,
        hz = app.io.convert.midiToHz( note );

    // Note-on event
    if ( cmd === 9 ) {
        if ( velocity > 0 ) {
            app.synths[ 0 ].start( hz, velocity );
            app.synths[ 1 ].start( hz, velocity );
        }
        else {
            app.synths[ 0 ].stop( hz, velocity );
            app.synths[ 1 ].stop( hz, velocity );
        }
    }
};


// Kick off all the things!
app.createAudioPieces();
app.createKnobs();
app.createOscilloscope();
app.createKeyboard();