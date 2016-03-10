import "../core/AudioIO.es6";
import Node from "../core/Node.es6";

/**
 * [Clamp description]
 * @param {[type]} io       [description]
 * @param {[type]} minValue [description]
 * @param {[type]} maxValue [description]
 */
class Clamp extends Node {
    constructor( io, minValue, maxValue ) {
        super( io, 0, 0 ); // io, 1, 1

        this.min = this.io.createMin( maxValue );
        this.max = this.io.createMax( minValue );

        this.min.connect( this.max );

        this.inputs = [ this.min ];
        this.outputs = [ this.max ];

        // Store controllable params.
        this.controls.min = this.min.controls.value;
        this.controls.max = this.max.controls.value;
    }

    cleanUp() {
        super();
        this.min = null;
        this.max = null;
    }

    get minValue() {
        return this.min.value;
    }
    set minValue( value ) {
        this.min.value = value;
    }

    get maxValue() {
        return this.max.value;
    }
    set maxValue( value ) {
        this.max.value = value;
    }
}



AudioIO.prototype.createClamp = function( minValue, maxValue ) {
    return new Clamp( this, minValue, maxValue );
};