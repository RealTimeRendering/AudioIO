export default {
    cleanUpInOuts: function() {
        var inputs,
            outputs;

        if( Array.isArray( this.inputs ) ) {
            inputs = this.inputs;

            for( var i = 0; i < inputs.length; ++i ) {
                if( inputs[ i ] && typeof inputs[ i ].cleanUp === 'function' ) {
                    inputs[ i ].cleanUp();
                }
                else if( inputs[ i ] ) {
                    inputs[ i ].disconnect();
                }

                inputs[ i ] = null;
            }

            this.inputs = null;
        }

        if( Array.isArray( this.outputs ) ) {
            outputs = this.outputs;

            for( var i = 0; i < outputs.length; ++i ) {
                if( outputs[ i ] && typeof outputs[ i ].cleanUp === 'function' ) {
                    outputs[ i ].cleanUp();
                }
                else if( outputs[ i ] ) {
                    outputs[ i ].disconnect();
                }

                outputs[ i ] = null;
            }

            this.outputs = null;
        }
    },

    cleanIO: function() {
        if( this.io ) {
            this.io = null;
        }

        if( this.context ) {
            this.context = null;
        }
    }
};