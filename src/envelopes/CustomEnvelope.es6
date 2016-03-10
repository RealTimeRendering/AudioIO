import AudioIO from "../core/AudioIO.es6";
import CONFIG from "../core/config.es6";
import _setIO from "../mixins/setIO.es6";

class CustomEnvelope {
    constructor( io ) {
        this._setIO( io );

        this.orders = {
            start: [],
            stop: []
        };

        this.steps = {
            start: {},
            stop: {}
        };
    }

    _addStep( section, name, time, level, isExponential = false ) {
        let stops = this.steps[ section ];

        if ( stops[ name ] ) {
            throw new Error( 'Stop with name "' + name + '" already exists.' );
        }

        this.orders[ section ].push( name );

        this.steps[ section ][ name ] = {
            time: time,
            level: level,
            isExponential: isExponential
        };
    }

    addStartStep( name, time, level, isExponential = false ) {
        this._addStep( 'start', name, time, level, isExponential );
        return this;
    }

    addEndStep( name, time, level, isExponential = false ) {
        this._addStep( 'stop', name, time, level, isExponential );
        return this;
    }

    setStepLevel( name, level ) {
        let startIndex = this.orders.start.indexOf( name ),
            endIndex = this.orders.stop.indexOf( name );

        if ( startIndex === -1 && endIndex === -1 ) {
            console.warn( 'No step with name "' + name + '". No level set.' );
            return;
        }

        if ( startIndex !== -1 ) {
            this.steps.start[ name ].level = parseFloat( level );
        }
        else {
            this.steps.stop[ name ].level = parseFloat( level );
        }

        return this;
    }


    setStepTime( name, time ) {
        var startIndex = this.orders.start.indexOf( name ),
            endIndex = this.orders.stop.indexOf( name );

        if ( startIndex === -1 && endIndex === -1 ) {
            console.warn( 'No step with name "' + name + '". No time set.' );
            return;
        }

        if ( startIndex !== -1 ) {
            this.steps.start[ name ].time = parseFloat( time );
        }
        else {
            this.steps.stop[ name ].time = parseFloat( time );
        }

        return this;
    }



    _triggerStep( param, step, startTime ) {
        // if ( step.isExponential === true ) {
            // There's something amiss here!
            // console.log( Math.max( step.level, CONFIG.epsilon ), startTime + step.time );
            // param.exponentialRampToValueAtTime( Math.max( step.level, 0.01 ), startTime + step.time );
        // }
        // else {
            param.linearRampToValueAtTime( step.level, startTime + step.time );
        // }
    }

    _startSection( section, param, startTime, cancelScheduledValues ) {
        var stopOrder = this.orders[ section ],
            steps = this.steps[ section ],
            numStops = stopOrder.length,
            step;

        param.cancelScheduledValues( startTime );
        // param.setValueAtTime( 0, startTime );

        for ( var i = 0; i < numStops; ++i ) {
            step = steps[ stopOrder[ i ] ];
            this._triggerStep( param, step, startTime );
            startTime += step.time;
        }
    }


    start( param, delay = 0 ) {
        if ( param instanceof AudioParam === false && param instanceof Param === false ) {
            throw new Error( 'Can only start an envelope on AudioParam or Param instances.' );
        }

        this._startSection( 'start', param, this.context.currentTime + delay );
    }

    stop( param, delay = 0 ) {
        this._startSection( 'stop', param, this.context.currentTime + 0.1 + delay );
    }

    forceStop( param, delay = 0 ) {
        param.cancelScheduledValues( this.context.currentTime + delay );
        // param.setValueAtTime( param.value, this.context.currentTime + delay );
        param.linearRampToValueAtTime( 0, this.context.currentTime + 0.001 );
    }

    get totalStartTime() {
        var starts = this.steps.start,
            time = 0.0;

        for ( var i in starts ) {
            time += starts[ i ].time;
        }

        return time;
    }

    get totalStopTime() {
        var stops = this.steps.stop,
            time = 0.0;

        for ( var i in stops ) {
            time += stops[ i ].time;
        }

        return time;
    }
}

AudioIO.mixinSingle( CustomEnvelope.prototype, _setIO, '_setIO' );

AudioIO.prototype.createCustomEnvelope = function() {
    return new CustomEnvelope( this );
};

export default CustomEnvelope;