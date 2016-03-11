import AudioIO from "../core/AudioIO.es6";
import DryWetNode from "../graphs/DryWetNode.es6";

// TODO:
//  - 4 filters (LP, HP, BP, notch).
//  - 1 Crossfader with 4 inputs.
class FilterBank extends DryWetNode {
    constructor( io ) {
        super( io, 1, 1 );


    }
}

AudioIO.prototype.createFilterBank = function() {
    return new FilterBank( this );
};

export default FilterBank;