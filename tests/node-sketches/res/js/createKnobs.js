function createControls( node, io ) {
    var wrapper = document.createElement( 'div' ),
        title = document.createElement( 'h2' ),
        knobs = [];

    title.textContent = node.constructor.name;
    wrapper.appendChild( title );

    for ( var controlName in node.controls ) {
        var element = document.createElement( 'div' ),
            map = node.controlProperties[ controlName ],
            constant = io.createConstant( 0 );

        element.className = 'knob indicator-circle rubber small';
        element.setAttribute( 'label', controlName );

        for ( var i in map ) {
            element.setAttribute( i, map[ i ] );
        }

        constant.connect( node.controls[ controlName ] );

        knobs[ i ] = new Knob( element, {
            callback: ( function( constant ) {
                return function( value, knob ) {
                    constant.value = value;
                };
            }( constant ) ),
            type: 'indicator-circle rubber',
            size: 'small'
        } );

        wrapper.appendChild( element );
    }

    document.body.appendChild( wrapper );

    return knobs;
}