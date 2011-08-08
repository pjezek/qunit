/** 
 * Overrides possible Logging callbacks to produce xml output
 * 
 * qunit to testsuite attribute mapping:
 * name
 * qunit to testcase attribute mapping:
 * module -> classname
 * test -> name
 *
 * @see: qunit.js line 652
 * begin
 * moduleStart: { name }
 * testStart: { name }
 * log: { result, actual, expected, message }
 * testDone: { name, failed, passed, total }
 * moduleDone: { name, failed, passed, total }
 * done: { failed, passed, total, runtime }
*/
QUnit.xmlWriter = (function() {

    /* private variables */
    var DEBUG = false,
        finished = false,
        isPolling = false,
        xmlString = "",
        xmlTestsString = "",
        startTime = new Date(),
        endTime = null,
        testStartTime = null,
        testEndTime = null,
        moduleStartTime = null,
        moduleEndTime = null,
        currentModule = "",
        currentTest = "",
        logged = "",
        logs = ["begin", "moduleStart", "testStart", "log", "testDone", "moduleDone", "done"],
    /* functions */
        getTimeString, isFinished, begin, moduleStart, testStart, log, testDone, moduleDone, done;

    /** returns now formated as 2010-08-01T23:22:05+02:00 */
    getTimeString = function (now) {
        var result, tmp;

        function toTwoLetter(value) {
            if (Number(value) < 9) {
                value = "0" + value;
            }
            return value;
        }

        result  = now.getUTCFullYear() + "-";
        result += toTwoLetter(now.getUTCMonth() + 1) + "-";
        result += toTwoLetter(now.getUTCDate()) + "T";
        result += toTwoLetter(now.getUTCHours()) + ":";
        result += toTwoLetter(now.getUTCMinutes()) + ":";
        result += toTwoLetter(now.getUTCSeconds());
        tmp = now.getTimezoneOffset() * -1 / 60;
        if (tmp > 0) {
            result += "+";
        } else {
            result += "-";
        }
        result += toTwoLetter(tmp) + ":00";

        return result;
    };

    isFinished = function () {
        return finished;
    };

    getXML = function () {
        return xmlString;
    };

    begin = function () {
        xmlString += '<?xml version="1.0"?>\n';
    };

    moduleStart = function () {
        if (DEBUG) {
            console.log("moduleStart -> name: " + arguments[0].name);
        }
        moduleStartTime = new Date();
        currentModule = arguments[0].name;
    };

    testStart = function () {
        if (DEBUG) {
            console.log("testStart -> name: " + arguments[0].name);
        }
        logged = "";
        testStartTime = new Date();
        currentTest = arguments[0].name;
    };

    log = function () {
        if (DEBUG) {
            console.log("log -> result: " + arguments[0].result);
            console.log("log -> actual: " + arguments[0].actual);
            console.log("log -> expected: " + arguments[0].expected);
            console.log("log -> message: " + arguments[0].message);
            console.log("log -> source: " + arguments[0].source);
        }
        if (!arguments[0].result) {
            logged += '\t\t<failure message="' + currentTest + '" type="error">\n';
            logged += 'Message: ' + arguments[0].message + '\n';
            if (arguments[0].expected) {
                logged += 'Expected: ' + arguments[0].expected + '\n';
            }
            if (arguments[0].actual) {
                logged += 'Result: ' + arguments[0].actual + '\n';
            }
            if (arguments[0].expected && arguments[0].actual) {
                logged += 'Diff: ' + QUnit.diff(QUnit.jsDump.parse(arguments[0].expected), QUnit.jsDump.parse(arguments[0].actual)) + '\n';
            }
            if (arguments[0].source) {
                logged += 'Source: ' + arguments[0].source + '\n';
            }
            logged += '\t\t</failure>\n';
        }
    };

    testDone = function () {
        if (DEBUG) {
            console.log("testDone -> name: " + arguments[0].name); // current test
            console.log("testDone -> failed: " + arguments[0].failed);
            console.log("testDone -> passed: " + arguments[0].passed);
            console.log("testDone -> total: " + arguments[0].total);
        }
        testEndTime = new Date();
        // <testcase name="testFeedback" classname="test_feedback" time="19.508135080338"/>
        xmlTestsString += '\t<testcase name="' + currentTest + '" classname="' + currentModule + '" time="' + Number((testEndTime-testStartTime)/1000).toPrecision() + '"';
        if (0 < arguments[0].failed) {
            xmlTestsString += '>\n';
            xmlTestsString += logged;
            xmlTestsString += '\t</testcase>\n';
        } else {
            xmlTestsString += '/>\n';
        }
    };

    moduleDone = function () {
        if (DEBUG) {
            console.log("moduleDone -> failed: " + arguments[0].failed);
            console.log("moduleDone -> name: " + arguments[0].name); // current module
            console.log("moduleDone -> passed: " + arguments[0].passed);
            console.log("moduleDone -> total: " + arguments[0].total);
        }
        moduleEndTime = new Date();
    };

    done = function () {
        if (DEBUG) {
            console.log("done -> failed: " + arguments[0].failed);
            console.log("done -> passed: " + arguments[0].passed);
            console.log("done -> runtime: " + arguments[0].runtime); // in milliseconds
            console.log("done -> total: " + arguments[0].total);
        }
        endTime = new Date();
        // <testsuite name="selenium" timestamp="2011-08-05T16:31:43+02:00" hostname="localhost" tests="128" failures="1" errors="0" time="664.32314705849">
        xmlString += '<testsuite name="javascript"';
        xmlString += ' timestamp="' + getTimeString(startTime) + '"';
        xmlString += ' hostname=""';
        xmlString += ' tests="' + arguments[0].total + '"';
        xmlString += ' failures="' + arguments[0].failed + '"';
        xmlString += ' errors="0"';
        xmlString += ' time="' + Number((endTime - startTime)/1000).toPrecision() + '"';
        xmlString += '>\n';
        xmlString += xmlTestsString;
        xmlString += '</testsuite>\n';
        // console.log(xmlString);
        finished = true;
    };

    return {
        logs: logs,
        isFinished: isFinished,
        getXML: getXML,
        begin: begin,
        moduleStart: moduleStart,
        testStart: testStart,
        log: log,
        testDone: testDone,
        moduleDone: moduleDone,
        done: done
    };
    
})();

// attach xmlWriter Logging callbacks
for (var i = 0; i < QUnit.xmlWriter.logs.length; i++) {
    (function() {
        var log = QUnit.xmlWriter.logs[i],
            args = arguments;
        QUnit[log] = function(args) {
            QUnit.xmlWriter[log](args);
        };
    })();
}
