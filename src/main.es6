window.AudioContext = window.AudioContext || window.webkitAudioContext;

// Core components.
import AudioIO from './core/AudioIO.es6';
import Node from './core/Node.es6';
import Param from './core/Param.es6';
import './core/WaveShaper.es6';


// FX.
import './fx/Delay.es6';
import './fx/PingPongDelay.es6';
import './fx/SineShaper.es6';
import './fx/StereoWidth.es6';
import './fx/StereoRotation.es6';
// import './fx/BitReduction.es6';
import './fx/SchroederAllPass.es6';
import './fx/DCTrap.es6';
import './fx/filters/FilterBank.es6';

// Generators and instruments.
import './generators/OscillatorGenerator.es6';
import './instruments/GeneratorPlayer.es6';

// Math: Trigonometry
import './math/trigonometry/DegToRad.es6';
import './math/trigonometry/Sin.es6';
import './math/trigonometry/Cos.es6';
import './math/trigonometry/Tan.es6';
import './math/trigonometry/RadToDeg.es6';

// Math: Relational-operators (inc. if/else)
import './math/relational-operators/EqualTo.es6';
import './math/relational-operators/EqualToZero.es6';
import './math/relational-operators/GreaterThan.es6';
import './math/relational-operators/GreaterThanZero.es6';
import './math/relational-operators/GreaterThanEqualTo.es6';
import './math/relational-operators/IfElse.es6';
import './math/relational-operators/LessThan.es6';
import './math/relational-operators/LessThanZero.es6';
import './math/relational-operators/LessThanEqualTo.es6';

// Math: Logical operators
import './math/logical-operators/LogicalOperator.es6';
import './math/logical-operators/AND.es6';
import './math/logical-operators/OR.es6';
import './math/logical-operators/NOT.es6';
import './math/logical-operators/NAND.es6';
import './math/logical-operators/NOR.es6';
import './math/logical-operators/XOR.es6';

// Math: General.
import './math/Abs.es6';
import './math/Add.es6';
import './math/Average.es6';
import './math/Clamp.es6';
import './math/Constant.es6';
import './math/Divide.es6';
import './math/Floor.es6';
import './math/Max.es6';
import './math/Min.es6';
import './math/Multiply.es6';
import './math/Negate.es6';
import './math/Pow.es6';
import './math/Reciprocal.es6';
import './math/Round.es6';
import './math/Scale.es6';
import './math/ScaleExp.es6';
import './math/Sign.es6';
import './math/Sqrt.es6';
import './math/Subtract.es6';
import './math/Switch.es6';
import './math/Square.es6';

// Math: Special.
import './math/Lerp.es6';
import './math/SampleDelay.es6';

// Envelopes
import './envelopes/CustomEnvelope.es6';
import './envelopes/ADSREnvelope.es6';
import './envelopes/ADEnvelope.es6';
import './envelopes/ADBDSREnvelope.es6';

// General graphs
import './graphs/EQShelf.es6';
import './graphs/Counter.es6';
import './graphs/DryWetNode.es6';
import './graphs/PhaseOffset.es6';
import './graphs/Crossfader.es6';

// Oscillators: Using WebAudio oscillators
import './oscillators/OscillatorBank.es6';
import './oscillators/NoiseOscillatorBank.es6';
import './oscillators/FMOscillator.es6';
import './oscillators/SineBank.es6';

// Oscillators: Buffer-based
import './oscillators/BufferOscillator.es6';

// import './graphs/Sketch.es6';

window.Param = Param;
window.Node = Node;