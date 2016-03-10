import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class Sketch extends Node {
    constructor( io, value ) {
        super( io, 1, 1 );

		this.controls = {
			cutoff: this.io.createParam( 0.5 ),
			resonance: this.io.createParam( 2 )
		};

		// F calculation
		// cutoff * 1.16
		// -------------
		var f = this.io.createMultiply( 1.16 );
		this.controls.cutoff.connect( f );

		// (1 - f) calculation
		var oneMinusF = this.io.createSubtract(),
			constant1 = this.io.createConstant( 1 );
		constant1.connect( oneMinusF, 0, 0 );
		f.connect( oneMinusF, 0, 1 );

		// fb calculation:
		// resonance * (1.0 - (0.15 * f * f))
		// ----------------------------------
		var fbConstant1 = this.io.createConstant( 1 ),
			fbConstant0_15 = this.io.createConstant( 0.15 ),
			fbSubtract = this.io.createSubtract(),
			fb = this.io.createMultiply(),
			fb_0_15_x_fxf = this.io.createMultiply(),
			fxf = this.io.createMultiply();

		// f*f
		f.connect( fxf, 0, 0 );
		f.connect( fxf, 0, 1 );

		// 0.15 * (f*f)
		fbConstant0_15.connect( fb_0_15_x_fxf, 0, 0 );
		fxf.connect( fb_0_15_x_fxf, 0, 1 );

		// 1.0 - (0.15 * (fxf))
		fbConstant1.connect( fbSubtract, 0, 0 );
		fb_0_15_x_fxf.connect( fbSubtract, 0, 1 );

		this.controls.resonance.connect( fb, 0, 0 );
		fbSubtract.connect( fb, 0, 1 );

		var outs = [ this.io.createParam(), this.io.createParam(), this.io.createParam(), this.io.createParam() ];


		// input[i] -= out4 * fb;
		var out4xFB = this.io.createMultiply();
		outs[3].connect( out4xFB, 0, 0 );
		fb.connect( out4xFB, 0, 1 );

		var inMinusOut4xFB = this.io.createSubtract();
		this.inputs[ 0 ].connect( inMinusOut4xFB, 0, 0 );
		out4xFB.connect( inMinusOut4xFB, 0, 1 );

		// (f*f) * (f*f)
		var fxf_x_fxf = this.io.createMultiply();
		fxf.connect( fxf_x_fxf, 0, 0 );
		fxf.connect( fxf_x_fxf, 0, 1 );

		// 0.35013 * (f*f)*(f*f)
		var constant0_35013 = this.io.createConstant( 0.35013 ),
			inMultiply1 = this.io.createMultiply();
		constant0_35013.connect( inMultiply1, 0, 0 );
		fxf_x_fxf.connect( inMultiply1, 0, 1 );

		// input[i] *= 0.35013 * (f*f)*(f*f);
		var inMultiplyAllTheFs = this.io.createMultiply();
		inMinusOut4xFB.connect( inMultiplyAllTheFs, 0, 0 );
		inMultiply1.connect( inMultiplyAllTheFs, 0, 1 );

		var ins = [ inMultiplyAllTheFs, this.io.createParam(), this.io.createParam(), this.io.createParam() ],
			i = 1,
			node = ins[ i - 1 ];

		for( var i = 1; i < 4; ++i ) {
			// outs[i] = node + 0.3 * ins[i] + (1 - f) * outs[i]; // Pole 2
			// ins[i] = node;
			// node = outs[ i - 1 ];

			// (0.3 * ins[i])
			var point3xIn1 = this.io.createMultiply(),
				point3 = this.io.createConstant( 0.3 );
			point3.connect( point3xIn1, 0, 0 );
			ins[ i ].connect( point3xIn1, 0, 1 );

			// ((1 - f) * outs[ i ])
			var oneMinusFxOut1 = this.io.createMultiply();
			oneMinusF.connect( oneMinusFxOut1, 0, 0 );
			outs[ i ].connect( oneMinusFxOut1, 0, 1 );

			// node + (0.3 * ins[i])
			var inPlusPoint3xIn1 = this.io.createAdd();
			node.connect( inPlusPoint3xIn1, 0, 0 );
			point3xIn1.connect( inPlusPoint3xIn1 );

			// outs[ i ] = node + (0.3 * ins[i]) + ((1 - f) * outs[i]);
			var outResult = this.io.createAdd();
			inPlusPoint3xIn1.connect( outResult, 0, 0 );
			oneMinusFxOut1.connect( outResult, 0, 1 );
			outResult.connect( outs[ i ] );

			node.connect( ins[ i ] );
			node = outs[ i ];
		}

		node.connect( this.outputs[ 0 ] );
    }

}

AudioIO.prototype.createSketch = function( value ) {
    return new Sketch( this, value );
};

export
default Sketch;