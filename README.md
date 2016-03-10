AudioIO
=======

**Note:** This library is a work-in-progress! Some graphs are incomplete or broken!


About
-----

AudioIO is a modular component system for building complex instruments, effects, and audio signal graphs using the WebAudio API, similar to NI's Reaktor, PureData, or Max/MSP.

The goal behind this library is to elimate the need to use expensive ScriptProcessorNodes and instead pass these calculations through "native" WebAudio components. This allows for a much more efficient way of building audio effects and instruments.


Features
========

* Perform both basic (add, subtract, multiply, divide), complex (abs, sin, cos, tan, max, min, sqrt, reciprocal, pow, etc.), and binary (AND, OR, NOT) maths on audio signals.

* Perform comparisons between audio signals (>, <, ===).

* Emulate JS logic features such as `switch` and `if`/`else`

* Calculate phase offsets for oscillators using only WebAudio components.

* Allow for easy creation of envelopes, and oscillators with unison, glide, and polyphony properties.