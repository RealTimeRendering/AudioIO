export default {
    resolveGraphPath( str ) {
        var graph = this.getGraph(),
            keys = str.split( '.' ),
            obj = graph;

        for( var i = 0; i < keys.length; ++i ) {
            if( i === 0 && keys[ i ] === 'graph' ) {
                continue;
            }

            obj = obj[ keys[ i ] ];
        }

        return obj;
    },

    addControls( map ) {
        var controlsMap = map || this.constructor.controlsMap,

            // Will cause a de-opt in Chrome, but I need it!
            //
            // TODO:
            //  - Work around the de-opt.
            args = Array.prototype.slice.call( arguments, 1 );

        if( controlsMap ) {
            for( var name in controlsMap ) {
                this.addControl( name, controlsMap[ name ], args );
            }
        }
    },

    addControl( name, options, args ) {
        if( options.delegate ) {
            this.controls[ name ] = this.resolveGraphPath( options.delegate );
        }
        else {
            this.controls[ name ] = this.io.createParam();
        }

        if( Array.isArray( options.targets ) ) {
            for( var i = 0; i < options.targets.length; ++i ) {
                this.controls[ name ].connect( this.resolveGraphPath( options.targets[ i ] ) );
            }
        }
        else if( options.targets ) {
            this.controls[ name ].connect( this.resolveGraphPath( options.targets ) );
        }

        this.controlProperties[ name ] = {};

        for( var i in options ) {
            if( options[ i ] === 'sampleRate' ) {
                this.controlProperties[ name ][ i ] = this.context.sampleRate * 0.5;
            }
            else if( typeof options[ i ] === 'function' ) {
                this.controlProperties[ name ][ i ] = options[ i ]( this.io, this.context, args );
            }
            else {
                this.controlProperties[ name ][ i ] = options[ i ];
            }
        }
    }
};
