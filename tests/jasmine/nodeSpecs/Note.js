describe( "Note", function() {
    var node = io.createNote();

    it( 'should have a context', function() {
        expect( node.context ).toEqual( io.context );
    } );

    it( "should have a reference to it's AudioIO instance", function() {
        expect( node.io ).toEqual( io );
    } );


    it( 'should default to 440hz note (A3) if !value', function() {
        var note = io.createNote();
        expect( note.valueHz ).toEqual( 440 );
    } );

    it( 'should set default value if given (default format === "hz")', function() {
        var note = io.createNote( 230 );
        expect( note.valueHz ).toEqual( 230 );
    } );


    it( 'should set default value AND format if given', function() {
        var note = io.createNote( 'A3', 'note' );
        expect( note.valueNote ).toEqual( 'A3' );

        note = io.createNote( 69, 'midi' );
        expect( note.valueMIDI ).toEqual( 69 );

        note = io.createNote( 120, 'bpm' );
        expect( note.valueBPM ).toEqual( 120 );

        note = io.createNote( 120, 'hz' );
        expect( note.valueHz ).toEqual( 120 );

        note = io.createNote( 2500, 'ms' );
        expect( note.valueMs ).toBeCloseTo( 2500 );
    } );

    it( 'should be able to set value in various formats (needs Param to reflect value correctly)', function() {
        var note = io.createNote( 440 );
        note.format = 'note';
        note.valueNote = 'C1';
        expect( note.valueNote ).toEqual( 'C1' );
    } );

    it( 'should be able to be transposed in semitones', function() {
        var note = io.createNote( 'A3', 'note' );
        note.transpose( -1 );
        expect( note.valueNote ).toEqual( 'G#3' );

        note.transpose( 12 );
        expect( note.valueNote ).toEqual( 'G#4' );
    } );
} );