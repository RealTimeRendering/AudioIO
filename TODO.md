AudioIO Todo List
=================

Refactoring
-----------
* ~~No default values for Nodes~~
	* ~~If values to Node arguments are provided then they will be passed to the controlling Param instances.~~
	* ~~If not, then Params will simply be gain nodes with _no_ drivers, i.e. pass-thrus. Controlling Param instances will therefore be needed to be controlled by Constants connected to these Params.~~

* ~~Use WeakMaps to store Node graphs. There is a WeakMap shared by all instances (and sub-instances) of the Node class. Use this for all Node subclasses.~~

* Add `color` control to NoiseOscillator.

* Change OscillatorBank to use Crossfader instead of Switch.

* Add `start` and `stop` controls to OscillatorBank, to mimic NoiseOscillator.

* Consider making *Bank classes sub-class Crossfader.

* ~~Ensure graph objects themselves are removed during `cleanUp` operations, and not just the graph's keys.~~

* New folder structure:
	* **src/**
		* **core/**
			* AudioIO
			* Node
			* Param
			* signalCurves
			* overrides
			* config
		* **banks/**
			* OscillatorBank
			* FilterBank
			* NoiseOscillatorBank
		* **buffers/**
			* Sine
			* Triangle
			* Sawtooth
			* Square
		* **envelopes/**
			* CustomEnvelope
			* DEnvelope, ADEnvelope, DREnvelope, SREnvelope, ASDREnvelope, ADBDSREnvelope
		* **fx/**
			* **delay/**
				* Delay, PingPongDelay, StereoDelay, DiffuseDelay
			* **eq/**
				* 4-band, 8-band, Custom.
			* **filter/**
				* Filter (generic), CombFilter, ...
			* **phase/**
				* Phaser, Flanger, Chorus
			* **reverb/**
				* ConvolutionReverb (using built-in ConvolverNode), CustomReverb (using DiffuseDelay)
			* **saturation/**
				* Saturation, SineShaper
			* **utility/**
				* Compressor, Expander (?), Panner, EnvFollower
		* **generators/**
			* OscillatorGenerator
			* SampleGenerator
		* **instruments/**
			* GeneratorPlayer
		* **macros/**
			* Counter
			* Crossfader
			* PhaseOffset
			* StereoWidth
		* **oscillators/**
			* LFO, inc. jitter.
			* FMOscillator
			* PMOscillator
			* FMPMOscillator
			* SyncOscillator (?! Use Counter to control start position of custom wave buffer?)
		* **nodes/**
			* Bank
			* WaveShaper (inherit Node)
			* **math/**
				* **trigonometry/**
					* Sin, Cos, Tan, DegToRad, RadToDeg
				* **logical-operators/**
					* LogicalOperator, AND, NAND, NOR, NOT, OR, XOR, NXOR
				* **relational-operators/**
					* EqualTo, EqualToZero, GreaterThan, GreaterThanZero, LessThan, LessThanZero
					* IfElse
		* **utility/**
			* BufferLoader
			* BufferHelper (perform normalize, reverse, basic math ops, etc. on a Buffer)
			* ImpulseGenerator (create Buffers to be used as impulses for ConvolverNode)
	* **tests/**
		* **jasmine/**
		* **visual-tests/**


New Additions
-------------
* Add `chain` and `fan` connection methods to all nodes.
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