import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class ReverbLateDiffusion extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        this.controls = {
            size: this.io.createParam( 0.1 ),
            diffusion: this.io.createParam( 0.5 ),
            feedback: this.io.createParam( 0.02 )
        };

        this.size1 = this.io.createMultiply( 0.8 );
        this.size2 = this.io.createMultiply( 0.6 );
        this.size3 = this.io.createMultiply( 0.2 );

        this.diffusionDelay1 = this.io.createDiffuseDelay();
        this.diffusionDelay2 = this.io.createDiffuseDelay();
        this.diffusionDelay3 = this.io.createDiffuseDelay();

        this.shelf = this.io.createEQShelf();


        this.controls.size.connect( this.size1 );
        this.controls.size.connect( this.size2 );
        this.controls.size.connect( this.size3 );

        this.controls.size.connect( this.diffusionDelay1.controls.time );
        this.size2.connect( this.diffusionDelay2.controls.time );
        this.size1.connect( this.diffusionDelay3.controls.time );

        this.controls.diffusion.connect( this.diffusionDelay1.controls.diffusion );
        this.controls.diffusion.connect( this.diffusionDelay2.controls.diffusion );
        this.controls.diffusion.connect( this.diffusionDelay3.controls.diffusion );

        this.inputs[ 0 ].connect( this.diffusionDelay1 );
        this.diffusionDelay1.connect( this.diffusionDelay2 );
        this.diffusionDelay2.connect( this.diffusionDelay3 );
        this.diffusionDelay3.connect( this.shelf );
        this.shelf.connect( this.outputs[ 0 ] );

        this.delay = this.context.createDelay();
        this.delay.delayTime.value = 0;
        this.size3.connect( this.delay.delayTime );

        this.feedback = this.context.createGain();
        this.feedback.gain.value = 0;
        this.feedback.connect( this.delay );
        this.delay.connect( this.feedback );
        this.controls.feedback.connect( this.feedback.gain );

        this.shelf.connect( this.delay );
        this.feedback.connect( this.inputs[ 0 ] );

        // this.controls.size.connect( this.delay.controls.time );
        // this.controls.feedback.connect( this.delay.controls.feedback );
    }

}

AudioIO.prototype.createReverbLateDiffusion = function() {
    return new ReverbLateDiffusion( this );
};

export default ReverbLateDiffusion;