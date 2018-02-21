// contains a playground for the format of defining processes. 
// this includes blocking vs non blocking
// the result returned from the processor are applied in the order defined in the array
// However, the dependsOn determines in what order the tasks are executed and if they are blocking or non blocking
// A step that has no dependencies is always non blocking
// In the example below, the 1st and the 4th step is executed in parallel, when the first is complete the 2nd is run, when that is also complete the 3rd is run
// when all the steps are terminated we can apply the write operations to the io object sequentially
// all steps are by default set to be parallel
{
    test: {}, //json schema
    steps: [{
            blockedBy: []
            targetDuration: '10ms',
            href: 'http://martinhansen.io/self-link-adder'
        },
        {
            blockedBy: ['http://martinhansen.io/self-link-adder']
            targetDuration: '10ms',
            href: 'http://martinhansen.io/relative-links-expander'
        },
        {
            // these steps are executed in parallel
            blockedBy: ['http://martinhansen.io/relative-links-expander'],
            targetDuration: '10ms',
            href: 'http://martinhansen.io/hal-transformer'
        }, {
            blockedBy: [],
            targetDuration: '200ms',
            href: 'http://martinhansen.io/oauth-handler'
        }
    ]
}
