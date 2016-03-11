AudioIO Todo List
=================

Refactoring
-----------
* No default values for Nodes
	* If values to Node arguments are provided then they will be passed to the controlling Param instances.
	* If not, then Params will simply be gain nodes with _no_ drivers, i.e. pass-thrus. Controlling Param instances will therefore be needed to be controlled by Constants connected to these Params.

* Use WeakMaps to store Node graphs. There is a WeakMap shared by all instances (and sub-instances) of the Node class. Use this for all Node subclasses.

* Add `color` control to NoiseOscillator.

* Change OscillatorBank to use Crossfader instead of Switch.

* Add `start` and `stop` controls to OscillatorBank, to mimic NoiseOscillator.

* Consider making *Bank classes sub-class Crossfader.


New Additions
-------------
* BrownNoise buffer, and adding BrownNoise buffer to NoiseOscillator.
* Seeded random
* Remaining logical operators (NAND, NOR, XOR, NXOR)
* FilterBank (xfade), with HP, BP, LP, Notch to fade between.
* Chorus
* Flanger
* Phaser
* BufferLoader
* Multi-waveform LFO, inc. jitter
* Env Follower (see tests/node-sketches/average.html)
* Convolver / ImpulseReverb
* ImpulseGenerator
* SampleGenerator (to be used by GeneratorPlayer)
* More envelope templates (D, AD, ADBDSR, DR, SR)
* Xfading OscillatorBankwith both FM and PM.