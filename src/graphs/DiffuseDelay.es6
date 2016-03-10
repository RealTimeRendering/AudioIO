import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class DiffuseDelay extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        this.controls = {
            diffusion: this.io.createParam(),
            time: this.io.createParam()
        };

        this.feedbackAdder = this.io.createAdd();
        this.delay = this.context.createDelay();
        this.negate = this.io.createNegate();
        this.multiply1 = this.io.createMultiply();
        this.multiply2 = this.io.createMultiply();
        this.sum = this.io.createAdd();
        this.shelf = this.io.createEQShelf();

        this.delay.delayTime.value = 0;
        this.controls.time.connect( this.delay.delayTime );

        this.controls.diffusion.connect( this.negate );
        this.inputs[ 0 ].connect( this.multiply1, 0, 0 );
        this.negate.connect( this.multiply1, 0, 1 );
        this.multiply1.connect( this.sum, 0, 1 );

        this.inputs[0].connect( this.feedbackAdder, 0, 0 );
        this.multiply2.connect( this.feedbackAdder, 0, 1 );

        this.feedbackAdder.connect( this.delay );
        this.delay.connect( this.shelf );

        this.shelf.connect( this.sum, 0, 0 );


        this.controls.diffusion.connect( this.multiply2, 0, 1 );
        this.sum.connect( this.multiply2, 0, 1 );
        this.sum.connect( this.outputs[ 0 ] );
    }

}

AudioIO.prototype.createDiffuseDelay = function() {
    return new DiffuseDelay( this );
};

export
default DiffuseDelay;