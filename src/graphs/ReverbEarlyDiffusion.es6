import AudioIO from "../core/AudioIO.es6";
import Node from "../core/Node.es6";

class ReverbEarlyDiffusion extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        this.controls = {
            size: this.io.createParam( 0.5 ),
            diffusion: this.io.createParam( 0.5 )
        };

        this.sizes = [];
        this.diffusionDelays = [];

        var numDelays = 10,
            node = this.inputs[ 0 ];

        this.inputs[ 0 ].gain.value = 1 / (numDelays * numDelays);

        for( var i = 0; i < numDelays; ++i ) {
            var step = Math.min( i / numDelays, 0.1 );

            this.sizes[ i ] = this.io.createMultiply( step );
            this.diffusionDelays[ i ] = this.io.createDiffuseDelay();

            this.controls.size.connect( this.sizes[ i ] );
            this.sizes[ i ].connect( this.diffusionDelays[ i ].controls.time );

            this.controls.diffusion.connect( this.diffusionDelays[ i ].controls.diffusion );

            node.connect( this.diffusionDelays[ i ] );
            node = this.diffusionDelays[ i ];
        }

        this.shelf = this.io.createEQShelf();
        node.connect( this.shelf );

        this.shelf.connect( this.outputs[ 0 ] );
    }

}

AudioIO.prototype.createReverbEarlyDiffusion = function() {
    return new ReverbEarlyDiffusion( this );
};

export default ReverbEarlyDiffusion;