/* 
 * QUnit Qt+WebKit powered headless test runner using Phantomjs
 * 
 * Phantomjs installation: http://code.google.com/p/phantomjs/wiki/BuildInstructions
 * 
 * Run with:
 *  phantomjs test.js [url-of-your-qunit-testsuite]
 *  
 * E.g.
 * 	phantomjs test.js http://localhost/qunit/test
 */

/* Global variables */
var finished = false,
    pollResolution = 100,
    isPolling = false,
    page = new WebPage(),
/* Global helper functions */
    isFinished, onFinishedTests, pollForFinishedTests;

// Print usage if called with wrong arguments count.
if (phantom.args.length === 0 || phantom.args.length > 2) {
    console.log('Usage: run-qunit.js URL');
    phantom.exit(1);
}

// Catch random output as xml comment.
console.log('<?xml version="1.0"?>\n');
console.log("<!-- ");
console.log("executing: " + phantom.args[0] + "\n");

// Read isFinished from logger and returns it.
function isFinished () {
    return page.evaluate(function(){
        finished = QUnit.xmlWriter.isFinished();
        return finished;
    });
};

// Once all tests are finished this outputs the results and exits with status code.
function onFinishedTests () {
    var output = page.evaluate(function() {
        return QUnit.xmlWriter.getXML();
    });
    console.log("-->");
    console.log(output);
    // TODO: write to disk
    // try {
    //     f = fs.open("./javascript.xml", "w");
    //     f.write(QUnit.xmlWriter.xmlString);
    //     f.close();
    // } catch (e) {
    //     console.log(e);
    //     console.log("phantomjs> Unable to save result of Suite ''");
    // }
    phantom.exit(0);
};

// Polls Logger until all tests are finished with execution.
function pollForFinishedTests () {
    if (!isPolling) {
        isPolling = true;
        setTimeout(function poller() {
            finished = isFinished();
            // check if tests are finished
            if (!finished) {
                setTimeout(poller, pollResolution);
            }
            if (finished) {
                onFinishedTests();
            }
        });
    }
};

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function(msg) {
    console.log(msg);
};

// Open test page and initialize polling of the logger for the end of test execution.
// Exits with error status code if it fails to load any file.
page.open(phantom.args[0], function(status) {
    if (status !== "success") {
        console.log("Unable to access network");
        phantom.exit(1);
    } else {
        if (!isFinished()) {
            pollForFinishedTests();
        }
    }
});
