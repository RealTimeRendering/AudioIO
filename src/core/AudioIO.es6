import CONFIG from './config.es6';
import './overrides.es6';
import signalCurves from './signalCurves.es6';
import conversions from '../mixins/conversions.es6';
import math from '../mixins/math.es6';
import BufferGenerators from '../buffers/BufferGenerators.es6';
import BufferUtils from '../utilities/BufferUtils.es6';
import Utils from '../utilities/Utils.es6';

class AudioIO {

    static mixin( target, source ) {
        for ( let i in source ) {
            if ( source.hasOwnProperty( i ) ) {
                target[ i ] = source[ i ];
            }
        }
    }

    static mixinSingle( target, source, name ) {
        target[ name ] = source;
    }


    constructor( context = new AudioContext() ) {
        this._context = context;

        this.master = this._context.destination;

        // Create an always-on 'driver' node that constantly outputs a value
        // of 1.
        //
        // It's used by a fair few nodes, so makes sense to use the same
        // driver, rather than spamming a bunch of WaveShaperNodes all about
        // the place. It can't be deleted, so no worries about breaking
        // functionality of nodes that do use it should it attempt to be
        // overwritten.
        Object.defineProperty( this, 'constantDriver', {
            writeable: false,
            get: ( function() {
                let constantDriver;

                return function() {
                    if ( !constantDriver || constantDriver.context !== this.context ) {
                        constantDriver = null;

                        let context = this.context,
                            buffer = context.createBuffer( 1, 4096, context.sampleRate ),
                            bufferData = buffer.getChannelData( 0 ),
                            bufferSource = context.createBufferSource();

                        for ( let i = 0; i < bufferData.length; ++i ) {
                            bufferData[ i ] = 1.0;
                        }

                        // for( let bufferValue of bufferData ) {
                        //     bufferValue = 1.0;
                        // }

                        bufferSource.buffer = buffer;
                        bufferSource.loop = true;
                        bufferSource.start( 0 );

                        constantDriver = bufferSource;
                    }

                    return constantDriver;
                }
            }() )
        } );
    }



    get context() {
        return this._context;
    }

    set context( context ) {
        if ( !( context instanceof AudioContext ) ) {
            throw new Error( "Invalid audio context given:" + context );
        }

        this._context = context;
        this.master = context.destination;
    }
}

AudioIO.mixinSingle( AudioIO.prototype, signalCurves, 'curves' );
AudioIO.mixinSingle( AudioIO.prototype, conversions, 'convert' );
AudioIO.mixinSingle( AudioIO.prototype, math, 'math' );

AudioIO.BufferUtils = BufferUtils;
AudioIO.Utils = Utils;
AudioIO.BufferGenerators = BufferGenerators;

window.AudioIO = AudioIO;
export default AudioIO;