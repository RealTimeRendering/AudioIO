import AudioIO from "./AudioIO.es6";
import _setIO from "../mixins/setIO.es6";
import connections from "../mixins/connections.es6";
import cleaners from "../mixins/cleaners.es6";


class Param {
    constructor( io, value, defaultValue ) {
        this._setIO( io );

        this.inputs = this.outputs = [ this.context.createGain() ];
        this._control = this.inputs[ 0 ];

        // Hmm... Had to put this here so Note will be able
        // to read the value...
        // TODO:
        //  - Should I create a `._value` property that will
        //    store the values that the Param should be reflecting
        //    (forgetting, of course, that all the *ValueAtTime [etc.]
        //    functions are functions of time; `._value` prop would be
        //    set immediately, whilst the real value would be ramping)
        //
        //  - Or, should I create a `._value` property that will
        //    truely reflect the internal value of the GainNode? Will
        //    require MAFFS...
        this._value = typeof value === 'number' ? value : 1.0;
        this._control.gain.value = this._value;

        this.setValueAtTime( this._value, this.context.currentTime );
        this.defaultValue = typeof defaultValue === 'number' ? defaultValue : this._control.gain.defaultValue;


        // TODO:
        //  - Should the driver always be connected?
        //  - Not sure whether Param should output 0 if value !== Number.
        if ( typeof value === 'number' ) {
            this.io.constantDriver.connect( this._control );
        }
    }


    reset() {
        this.value = this.defaultValue;
        return this;
    }

    cleanUp() {
        this._cleanUpInOuts();
        this._cleanIO();
        this._value = null;
        this._control = null;
        this.defaultValue = null;

        this.disconnect();
    }

    setValueAtTime( value, startTime ) {
        this._value = value;
        this._control.gain.setValueAtTime( value, startTime );
        return this;
    }

    linearRampToValueAtTime( value, endTime ) {
        this._value = value;
        this._control.gain.linearRampToValueAtTime( value, endTime );
        return this;
    }

    exponentialRampToValueAtTime( value, endTime ) {
        this._value = value;
        this._control.gain.exponentialRampToValueAtTime( value, endTime );
        return this;
    }

    setTargetAtTime( value, startTime, timeConstant ) {
        this._value = value;
        this._control.gain.setTargetAtTime( value, startTime, timeConstant );
        return this;
    }

    setValueCurveAtTime( values, startTime, duration ) {
        this._value = value;
        this._control.gain.setValueCurveAtTime( values, startTime, duration );
        return this;
    }

    cancelScheduledValues( startTime ) {
        this._control.gain.cancelScheduledValues( startTime );
        return this;
    }

    get value() {
        // return this._control.gain.value;
        return this._value;
    }
    set value( value ) {
        this._value = value;
        this.setValueAtTime( value, this.context.currentTime );
    }

    get control() {
        return this._control.gain;
    }
}


AudioIO.mixinSingle( Param.prototype, _setIO, '_setIO' );
AudioIO.mixinSingle( Param.prototype, cleaners.cleanUpInOuts, '_cleanUpInOuts' );
AudioIO.mixinSingle( Param.prototype, cleaners.cleanIO, '_cleanIO' );
AudioIO.mixin( Param.prototype, connections );

AudioIO.prototype.createParam = function( value, defaultValue ) {
    return new Param( this, value, defaultValue );
};

export default Param;