AudioIO
=======

**Notes:**
* This library is a work-in-progress. Some graphs are incomplete or broken!
* Test coverage isn't 100%, nor will it ever be. Some Nodes can only really be tested by ear.
* Documentation is inbound in the near future.
* Since this is still pre-alpha, the spec/API might change. There are also a few inconsistences here and there that are known about and will be fixed up!


About
-----

AudioIO is a modular component system for building complex instruments, effects, and audio signal graphs using the WebAudio API, similar to NI's Reaktor, PureData, or Max/MSP.

The goal behind this library is to elimate the need to use expensive ScriptProcessorNodes and instead pass these calculations through "native" WebAudio components. This allows for a much more efficient way of building audio effects and instruments.


Features
--------

* Perform both basic (add, subtract, multiply, divide), complex (abs, sin, cos, tan, max, min, sqrt, reciprocal, pow, etc.), and binary (AND, OR, NOT) maths on audio signals.

* Perform comparisons between audio signals (>, <, ===).

* Emulate JS logic features such as `switch` and `if`/`else`

* Calculate phase offsets for oscillators using only WebAudio components.

* Allow for easy creation of envelopes, and oscillators with unison, glide, and polyphony properties.


Latest Build
------------

#####Version
* 0.0.2

#####New Additions:

* Added SchroederAllPass graph.
* Added SineShaper.
* Added StereoRotation.
* Added StereoWidth.
* Added SineBank (_n_ sine waves, each with harmonic multiplier control)
* OscillatorBank and NoiseOscillator now use the Crossfader node to smoothly transition between waveforms if required.