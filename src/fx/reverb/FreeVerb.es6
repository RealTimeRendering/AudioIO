import AudioIO from "../../core/AudioIO.es6";
import Node from "../../core/Node.es6";

// An implementation of the Freeverb reverb
// algorithm, which uses Schroeder's Allpass
// filters.
//
// Source:
//  - https://ccrma.stanford.edu/~jos/pasp/Freeverb.html
class Freeverb extends Node {
    constructor( io ) {
        super( io, 1, 1 );

        var graph = this.getGraph();


        this.setGraph( graph );
    }
}

AudioIO.prototype.createFreeverb = function() {
    return new Freeverb( this );
};

export default Freeverb;