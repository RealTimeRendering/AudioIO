import AudioIO from "./AudioIO.es6";
import _setIO from "../mixins/setIO.es6";
import connections from "../mixins/connections.es6";
import cleaners from "../mixins/cleaners.es6";

var graphs = new WeakMap();

class Node {
    constructor( io, numInputs = 0, numOutputs = 0 ) {
        this._setIO( io );

        this.inputs = [];
        this.outputs = [];

        // This object will hold any values that can be
        // controlled with audio signals.
        this.controls = {};

        // Both these objects will just hold references
        // to either input or output nodes. Handy when
        // wanting to connect specific ins/outs without
        // having to use the `.connect( ..., 0, 1 )` syntax.
        this.namedInputs = {};
        this.namedOutputs = {};

        for ( var i = 0; i < numInputs; ++i ) {
            this.addInputChannel();
        }

        for ( i = 0; i < numOutputs; ++i ) {
            this.addOutputChannel();
        }
    }

    setGraph( graph ) {
        graphs.set( this, graph );
    }

    getGraph() {
        return graphs.get( this ) || {};
    }

    addInputChannel() {
        this.inputs.push( this.context.createGain() );
    }

    addOutputChannel() {
        this.outputs.push( this.context.createGain() );
    }

    cleanUp() {
        this._cleanUpInOuts();
        this._cleanIO();
        this.disconnect();
    }


    get numberOfInputs() {
        return this.inputs.length;
    }
    get numberOfOutputs() {
        return this.outputs.length;
    }

    get inputValue() {
        return this.inputs.length ? this.inputs[ 0 ].gain.value : null;
    }
    set inputValue( value ) {
        for ( var i = 0; i < this.inputs.length; ++i ) {
            this.inputs[ i ].gain.value = this.invertInputPhase ? -value : value;
        }
    }

    get outputValue() {
        return this.outputs.length ? this.outputs[ 0 ].gain.value : null;
    }
    set outputValue( value ) {
        for ( var i = 0; i < this.outputs.length; ++i ) {
            this.outputs[ i ].gain.value = this.invertOutputPhase ? -value : value;
        }
    }

    get invertInputPhase() {
        return this.inputs.length ?
            ( this.inputs[ 0 ].gain.value < 0 ) :
            null;
    }
    set invertInputPhase( inverted ) {
        for ( var i = 0, input, v; i < this.inputs.length; ++i ) {
            input = this.inputs[ i ].gain;
            v = input.value;
            input.value = v < 0 ? ( inverted ? v : -v ) : ( inverted ? -v : v );
        }
    }

    get invertOutputPhase() {
        return this.outputs.length ?
            ( this.outputs[ 0 ].gain.value < 0 ) :
            null;
    }

    // TODO:
    //  - setValueAtTime?
    set invertOutputPhase( inverted ) {
        for ( var i = 0, v; i < this.outputs.length; ++i ) {
            v = this.outputs[ i ].gain.value;
            this.outputs[ i ].gain.value = v < 0 ? ( inverted ? v : -v ) : ( inverted ? -v : v );
        }
    }
}

AudioIO.mixinSingle( Node.prototype, _setIO, '_setIO' );
AudioIO.mixinSingle( Node.prototype, cleaners.cleanUpInOuts, '_cleanUpInOuts' );
AudioIO.mixinSingle( Node.prototype, cleaners.cleanIO, '_cleanIO' );
AudioIO.mixin( Node.prototype, connections );


AudioIO.prototype.createNode = function( numInputs, numOutputs ) {
    return new Node( this, numInputs, numOutputs );
};

export default Node;