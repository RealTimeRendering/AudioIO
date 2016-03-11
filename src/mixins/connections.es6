export default {
    connect: function( node, outputChannel = 0, inputChannel = 0 ) {
        if ( node instanceof AudioParam || node instanceof AudioNode ) {
            // this.outputs[ outputChannel ].connect( node );
            this.outputs[ outputChannel ].connect.call( this.outputs[ outputChannel ], node, 0, inputChannel );
        }

        else if ( node && node.outputs && node.outputs.length ) {
            // if( node.inputs[ inputChannel ] instanceof Param ) {
            // console.log( 'CONNECTING TO PARAM' );
            // node.io.constantDriver.disconnect( node.control );
            // }

            this.outputs[ outputChannel ].connect( node.inputs[ inputChannel ] );
        }

        else {
            console.error( 'ASSERT NOT REACHED' );
            console.log( arguments );
            console.trace();
        }
    },

    disconnect: function( node, outputChannel = 0, inputChannel = 0) {
        if ( node instanceof AudioParam || node instanceof AudioNode ) {
            this.outputs[ outputChannel ].disconnect.call( this.outputs[ outputChannel ], node, 0, inputChannel );
        }

        else if ( node && node.inputs && node.inputs.length ) {
            this.outputs[ outputChannel ].disconnect( node.inputs[ inputChannel ] );
        }

        else {
            console.error( 'ASSERT NOT REACHED' );
            console.log( arguments );
            console.trace();
        }
    }
};