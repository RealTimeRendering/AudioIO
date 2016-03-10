import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

// Emulates Math.exp:
//
// Math.pow( Math.E, value );
//
//
// BROKEN!!!
// Having floats, or dynamic exponents to AudioIO's Pow
// class DOES NOT WORK. It's just not do-able ;(
class Exp extends Node{
    constructor( io, value ) {
        super( io, 0, 1 );

        this.inputs[ 0 ] = this.control = this.io.createParam( value );
        this.E = this.io.createConstantE();

    }

    get value() {
        return this.control.value;
    }
    set value( value ) {
        this.control.setValueAtTime( value, this.context.currentTime );
    }

    cleanUp() {
        super();
        this.control = null;
    }
}


AudioIO.prototype.createExp = function( value1, value2 ) {
    return new Exp( this, value1, value2 );
};