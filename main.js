// SETUP
////////////////////////////////////////////////////////////////////

//get html elements
var resetOneButton = document.querySelector('.resetOne');
var resetAllButton = document.querySelector('.resetAll');
var problemSelect = document.querySelector('.problem');
var backButton = document.querySelector('.back');
var forwardButton = document.querySelector('.forward');
var titleHeader = document.querySelector('.title');
var promptPara = document.querySelector('.prompt');
var runButton = document.querySelector('.run');
var errorPara = document.querySelector('.error');
var resultDiv = document.querySelector('.result');
var continueButton = document.querySelector('.continue');

//create code editor from textarea
var editor = CodeMirror.fromTextArea(

    //get textarea object to upgrade
    document.querySelector('.editor'), 

    //options
    {
        lineNumbers: true,
        mode: 'javascript',
        indentUnit: 4,
        tabSize: 4,
        autoCloseBrackets: true,
        extraKeys: {
            'Ctrl-/': 'toggleComment',
        }
    }
);



// SELECT OPTIONS
////////////////////////////////////////////////////////////////////

//set up problem select options based on problems.js
let optionCounter = 0;
for (let name in problems) {
    let option = document.createElement("option");
    option.text = `${(++optionCounter).toString()}. ${name}`;
    option.value = name;
    problemSelect.add(option);
}

//function to generate empty function
function generateFunctionCode () {

    let name = problemSelect.value;
    let problem = problems[name];

    editor.setValue(
        `function ${name} (${problem.parameters.join(', ')}) {\n\t\n}`
    );
}

//set up reset buttons
resetOneButton.addEventListener('click', generateFunctionCode);
resetAllButton.addEventListener('click', function () {
    deleteAllCookies();
    generateFunctionCode();
});

//get saved problem from cookies
var savedName = getProblemCookie();
if (savedName) {
    //loop throuh options to find right one
    for (let i = 0; i < problemSelect.options.length; i++) {
        if (savedName == problemSelect.options[i].value) {
            problemSelect.selectedIndex = i;
            break;
        }
    }
}

//variable to hold old name of problem
var oldName = '';

//function to set up problem
function setupProblem () {

    //save new problem to cookie
    setProblemCookie(problemSelect);

    //clear output
    errorPara.innerHTML = "";
    resultDiv.innerHTML = "";
    continueButton.style.display = 'none';

    //get problem object
    let name = problemSelect.value;
    let problem = problems[name];

    //save code from previous problem to cookie, if old problem exists
    if (oldName) {
        setCodeCookie(oldName, editor.getValue());
    }

    //set up code editor with saved code
    if (getCodeCookie(name)) {
        editor.setValue(getCodeCookie(name));
    }
    //if no saved code, generate empty function
    else {
        generateFunctionCode();
    }

    //set up prompt
    titleHeader.innerHTML = name;
    promptPara.innerHTML = problem.prompt;

    //set old name to new name
    oldName = name;
}

//set up initial problem
setupProblem();

//event listener to set up new problem when selected
problemSelect.addEventListener('change', setupProblem);

//functions to navigate problems
function nextProblem () {
    if (problemSelect.selectedIndex < problemSelect.length-1) {
        ++problemSelect.selectedIndex;
        setupProblem();
    }
}
function prevProblem() {
    if (problemSelect.selectedIndex > 0) {
        --problemSelect.selectedIndex;
        setupProblem();
    }
}

//set up back and forward and continue
backButton.addEventListener('click', prevProblem);
forwardButton.addEventListener('click', nextProblem);
continueButton.addEventListener('click', nextProblem);

//save code from editor periodically
editor.on('change', function () {
    let name = problemSelect.value;
    //only save code if not transitioning to different problem
    if (oldName == name) {
        setCodeCookie(name, editor.getValue());
    }
});



// EXECUTE CODE
////////////////////////////////////////////////////////////////////

//execute code on button press
runButton.addEventListener('click', function () {

    //clear output
    errorPara.innerHTML = "";
    resultDiv.innerHTML = "";
    continueButton.style.display = 'none';
    
    //get code from editor
    let code = editor.getValue();

    //get problem object
    let name = problemSelect.value;
    let problem = problems[name];

    //array to hold test output
    let results = [];

    //all correct switch
    let allCorrect = true;

    //try to run and test user's code
    try {
        //evaluate user's function
        eval(code);
        
        //test code based on test function and test inputs
        problem.testData.forEach(function (inputs) {

            //result object
            result = {};

            //record test inputs
            for (let i = 0; i < problem.parameters.length; i++) {
                result[problem.parameters[i]] = inputs[i];
            }

            //run test function with Function.prototype.apply()
            result.testResult = problem.testFunction.apply(null, inputs);

            //run users function with Function.prototype.apply()
            eval(`result.userResult = ${name}.apply(null, inputs)`);

            //check if results match
            result.correct = result.testResult === result.userResult;
            allCorrect = allCorrect && result.correct;

            //add to results array
            results.push(result);
        });

        //build result HTML
        let resultHTML = "";

        //overall result
        if (allCorrect) {
            resultHTML += "<h4 class='correct'>Perfect</h4>";

            //show continue button if not last problem
            if (problemSelect.selectedIndex < problemSelect.length -1) {
                continueButton.style.display = '';
            }
        }
        else {
            resultHTML += "<h4 class='incorrect'>Problem Found</h4>";
        }

        //build table
        resultHTML += "<table>"

            //build header row
            resultHTML += "<thead><tr>"
                //column for each input
                for (let i = 0; i < problem.parameters.length; i++) {
                    resultHTML += `<th>${problem.parameters[i]}</th>`
                }
                //column for expected and actual results
                resultHTML += `<th>Expected</th>`
                resultHTML += `<th>Result</th>`
            resultHTML += "</tr></thead>"

            //build body
            resultHTML += "<tbody>"

                //one row for every set of inputs
                results.forEach(function (resultObj) {
                    resultHTML += "<tr>"
                    for (let i = 0; i < problem.parameters.length; i++) {
                        resultHTML += `<td>${JSON.stringify(resultObj[problem.parameters[i]])}</td>`
                    }
                    resultHTML += `<td>${JSON.stringify(resultObj.testResult)}</td>`
                    if (resultObj.correct) {
                        resultHTML += `<th class='correct'>${JSON.stringify(resultObj.userResult)}</th>`
                    }
                    else {
                        resultHTML += `<th class='incorrect'>${JSON.stringify(resultObj.userResult)}</th>`
                    }
                    resultHTML += "</tr>"
                });
            resultHTML += "</tbody>"
        resultHTML += "</table>"


        //place HTML into result element
        resultDiv.innerHTML = resultHTML;
    }   

    //catch errors to display to user
    catch (error) {
        errorPara.innerHTML = `Error Found<br><br>${error.toString()}`;
    }
    
});