import "../core/AudioIO.es6";
import Node from "../core/Node.es6";


/*
    The average value of a signal is calculated
    by piping the input into a rectifier then into
    a series of DelayNodes. Each DelayNode
    has it's `delayTime` controlled by either the
    `sampleSize` argument or the incoming value of
    the `controls.sampleSize` node. The delayTime
    is therefore measured in samples.

    Each delay is connected to a GainNode that works
    as a summing node. The summing node's value is
    then divided by the number of delays used before
    being sent on its merry way to the output.

    Note:
    High values for `numSamples` will be expensive,
    as that many DelayNodes will be created. Consider
    increasing the `sampleSize` and using a low value
    for `numSamples`.

    Graph:
    ======
    input ->
        abs/rectify ->
            `numSamples` number of delays, in series ->
                sum ->
                    divide by `numSamples` ->
                        output.
 */
class Average extends Node {

    /**
     * @param {Object} io Instance of AudioIO.
     */
    constructor( io, numSamples = 10, sampleSize ) {
        super( io, 1, 1 );

        var graph = this.getGraph();

        graph.numSamples = numSamples;

        // All DelayNodes will be stored here.
        graph.delays = [];
        graph.abs = this.io.createAbs();
        this.inputs[ 0 ].connect( graph.abs );
        graph.sampleSize = this.io.createConstant( 1 / this.context.sampleRate );
        graph.multiply = this.io.createMultiply();
        this.controls.sampleSize = this.io.createParam( sampleSize );
        graph.sampleSize.connect( graph.multiply, 0, 0 );
        this.controls.sampleSize.connect( graph.multiply, 0, 1 );

        // This is a relatively expensive calculation
        // when compared to doing a much simpler reciprocal multiply.
        // this.divide = this.io.createDivide( numSamples, this.context.sampleRate * 0.5 );

        // Avoid the more expensive division above by
        // multiplying the sum by the reciprocal of numSamples.
        graph.divide = this.io.createMultiply( 1 / numSamples );
        graph.sum = this.context.createGain();

        graph.sum.connect( graph.divide );
        graph.divide.connect( this.outputs[ 0 ] );

        this.setGraph( graph );


        // Trigger the setter for `numSamples` that will create
        // the delay series.
        this.numSamples = graph.numSamples;
    }

    get numSamples() {
        return this.getGraph().numSamples;
    }

    set numSamples( numSamples ) {
        var graph = this.getGraph(),
            delays = graph.delays;

        // Disconnect and nullify any existing delay nodes.
        this._cleanUpSingle( delays );

        graph.numSamples = numSamples;
        graph.divide.value = 1 / numSamples;

        for( var i = 0, node = graph.abs; i < numSamples; ++i ) {
            var delay = this.context.createDelay();
            delay.delayTime.value = 0;
            graph.multiply.connect( delay.delayTime );
            node.connect( delay );
            delay.connect( graph.sum );
            graph.delays.push( delay );
            node = delay;
        }

        this.setGraph( graph );
    }
}

AudioIO.prototype.createAverage = function( numSamples, sampleSize ) {
    return new Average( this, numSamples, sampleSize );
};