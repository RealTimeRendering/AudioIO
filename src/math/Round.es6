import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

// NOTE:
//  Only accepts values >= -1 && <= 1. Values outside
//  this range are clamped to this range.
class Round extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        // this.shaper = this.io.createWaveShaper( this.io.curves.Round );

        // This branching is because inputting `0` values
        // into the waveshaper above outputs -0.5 ;(
        // this.ifElse = this.io.createIfElse();
        // this.equalToZero = this.io.createEqualToZero();

        // this.inputs[ 0 ].connect( this.equalToZero );
        // this.equalToZero.connect( this.ifElse.if );
        // this.inputs[ 0 ].connect( this.ifElse.then );
        // this.shaper.connect( this.ifElse.else );
        // this.inputs[ 0 ].connect( this.shaper );
        // this.ifElse.connect( this.outputs[ 0 ] );

        this.floor = this.io.createFloor();
        this.add = this.io.createAdd( 0.5 );
        this.inputs[0].connect( this.add );
        this.add.connect( this.floor );
        this.floor.connect( this.outputs[0] );
    }

    cleanUp() {
        super();

        this.floor.cleanUp();
        this.add.cleanUp();

        this.floor = null;
        this.add = null;

        // this.ifElse.cleanUp();
        // this.equalToZero.cleanUp();
        // this.shaper.cleanUp();

        // this.ifElse = null;
        // this.equalToZero = null;
        // this.shaper = null;
    }
}

AudioIO.prototype.createRound = function() {
    return new Round( this );
};