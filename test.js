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

var finished = false;
var pollResolution = 100;
var isPolling = false;

function isFinished () {
    return page.evaluate(function(){
        finished = QUnit.xmlWriter.isFinished();
        return finished;
    });
};

function onfinishedTests () {
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
                onfinishedTests();
            }
        });
    }
};

if (phantom.args.length === 0 || phantom.args.length > 2) {
    console.log('Usage: run-qunit.js URL');
    phantom.exit(1);
}

var page = new WebPage();

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function(msg) {
    console.log(msg);
};

console.log('<?xml version="1.0"?>\n');
// catch random output as xml comment
console.log("<!-- ");
console.log("executing: " + phantom.args[0] + "\n");

// open test page
page.open(phantom.args[0], function(status){
    if (status !== "success") {
        console.log("Unable to access network");
        phantom.exit(1);
    } else {
        if (!isFinished()) {
            pollForFinishedTests();
        }
    }
});
