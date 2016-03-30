function createControls( node, io ) {
    for ( var controlName in node.controls ) {
        var element = document.createElement( 'div' ),
            map = node.controlProperties[ controlName ],
            constant = io.createConstant( 0 ),
            knob;

        element.className = 'knob indicator-circle rubber small';
        element.setAttribute( 'label', controlName );

        for ( var i in map ) {
            element.setAttribute( i, map[ i ] );
        }

        constant.connect( node.controls[ controlName ] );

        knob = new Knob( element, {
            callback: ( function( constant ) {
                return function( value, knob ) {
                    constant.value = value;
                };
            }( constant ) ),
            type: 'indicator-circle rubber',
            size: 'small'
        } );


        document.body.appendChild( element );
    }
}