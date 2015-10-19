'use strict';

var sudokuApp = angular.module('sudokuApp', []);

sudokuApp.controller('Sudoku',
function Sudoku($scope) {
    $scope.sortorder = 'name';

     /* Create the array of cells hold all the values of the grid */
    $scope.cells = [];
    for (var i = 0; i < 81;i += 1) {
        $scope.cells[i] = new Cell(i);
    }

    /* create 9 rows, each holding 9 references to cells in that row*/
    /* While at it, make 9 cols and 9 blocks */
    var nineRows = [];
    var nineCols = [];
    var nineBlocks = [];
    for (var i = 0; i < 9;i += 1) {
        nineRows[i] = new SetofNine('row');
        nineCols[i] = new SetofNine('col');
        nineBlocks[i] = new SetofNine('block');
    }
    /* Now bind the 81 cells to their own row, col and block */
    /* Traverse all cells, attach them to the corresponding row, col and block */
    for (var i = 0; i < 81;i += 1) {
        var thisCell = $scope.cells[i];

        /* Calculate to which row, col and block the cell belongs */
        var row = Math.floor(i/9); /* Rounds down */
        var col = i%9; /* Modulo or remainder */
        /* The block is a tricky calculation, but this is it. Have it start with zero like all array in JS */
        var block = ((1 + ((Math.floor(row/3)*3)) + Math.floor(col/3)) - 1);

        /* Push the correct reference to the rows, cols and blocks collection */
        nineRows[row].cells.push(thisCell);
        nineCols[col].cells.push(thisCell);
        nineBlocks[block].cells.push(thisCell);

        /* Handy for later use, augment the cell object */
        thisCell.row = row;
        thisCell.col = col;
        thisCell.block = block;

    }

    /* Also, to speed things up, attach each cell to 20 surounding cells, based on the fact that 2 cells share a row/col/block  */
    /* 'twenty?' you ask? well, a cell shares the row with 8 others, the col with 8 different other cells. */
    /* That leaves 4 cells in the block that are not part of the same row or col. Elementary, my dear Watson */
    /* Each setvalue() then immediately removes the value from the candidates of the surrounding cells */
    for (var i = 0; i < 81;i += 1) {
      var thisCell = $scope.cells[i];
      /* for each cell, select exactly 20 other surrounding cells */
      for (var j = 0; j < 81;j += 1) {
        var otherCell = $scope.cells[j];
        if (otherCell !== thisCell) {
          /* The OR of JS is powerfull, there will be no duplicates in the cells-array like this!!! yeay */
          if (otherCell.row === thisCell.row ||
            otherCell.col === thisCell.col ||
            otherCell.block === thisCell.block ) {
            /* Push the correct reference to the cells 'influenced cells' collection */
            thisCell.influencedCells.push(otherCell);
          }
        }
      }
    }

    $scope.setActiveCell = function(cell) {
        for (var i = 0; i < 81;i += 1) {
            $scope.cells[i].isActiveCell = false;
        }
        cell.isActiveCell = true;
    }

    $scope.handleKeyStroke = function($event){
        if ($event.keyCode == 38)
            console.log("up arrow");
        else if ($event.keyCode == 39)
            console.log("right arrow");
        else if ($event.keyCode == 40)
            console.log("down arrow");
        else if ($event.keyCode == 37)
            console.log("left arrow");
        else if ($event.keyCode == 46 || $event.keyCode == 8)
            setActiveCellValue("");
        else if ($event.keyCode >= 48 && $event.keyCode <= 57 )
            setActiveCellValue($event.keyCode - 48);
     }

    var setActiveCellValue = function(newValue) {
        var cellToEvaluate;
        for (var i = 0; i < 81;i += 1) {
            $scope.cells[i].isError = false;
            $scope.cells[i].isHint = false;
            if ($scope.cells[i].isActiveCell) {
                cellToEvaluate = $scope.cells[i];
            }
        }

        // Only process when a new value was typed
        if (cellToEvaluate && cellToEvaluate.value != newValue) {
            var conflictingCells = cellToEvaluate.seekConflictingCell(newValue);
            if (conflictingCells.length === 0) {
                cellToEvaluate.value = newValue;
                refreshCandidates();

            } else {
                for (var i=0, max=conflictingCells.length ; i < max ; i += 1) {
                    conflictingCells[i].isError = true;
                }
                cellToEvaluate.isError = true;
                $scope.messageLine = 'Warning: value ' + newValue + ' is allready in this row, col or block!';
            }
        }

        checkSolved();
    }

    $scope.resetGame = function() {
        $scope.isGameSolved = false;
        for (var i = 0; i < 81;i += 1) { /* reset values */
            var thisCell = $scope.cells[i];
            thisCell.isPrefilled=false;
            thisCell.isError=false;
            thisCell.isHint=false;
            thisCell.isActiveCell = false;
            thisCell.value='';
            thisCell.candidates=[1,2,3,4,5,6,7,8,9];
        }
    } /* resetGame */

    var resetDisplay = function() {
        for (var i = 0; i < 81;i += 1) { /* reset values */
            var thisCell = $scope.cells[i];
            thisCell.isError=false;
            thisCell.isHint=false;
        }
    }

    var fillFromString = function(game) {

        $scope.resetGame();
        /* the game is a string of 81 dots or values */
        /* the SUDOKU holds references to the input boxes on the screen */
        /* fill the value in the grid */
        for (var i = 0; i < 81; i += 1) {
            var cellValue=game.substr(i, 1);
            var thisCell = $scope.cells[i];
            /* There are prefilled values, and perhaps custom filled values ( stored as capitals ) */
            /* or there are dots, a graphic notation for no-value */
            if (cellValue !== '.') {
                /* set the prefilled flag or translate capitals  back to numerics */
                var posOfCapital = 'ABCDEFGHI'.indexOf(cellValue);
                if (posOfCapital === -1) { /* A numeric, no capital, indicates prefilled */
                    thisCell.isPrefilled = true; /* Prefilled */
                    thisCell.value = cellValue;
                    thisCell.candidates.splice(0,thisCell.candidates.length);
                }
                else {  /* A capital indicates it was filled later, by the user */
                    thisCell.isPrefilled = false; /* NOT Prefilled */
                    thisCell.value= '' + (posOfCapital+1); /* translate capital back to number, cast to string */
                }
            }
        }
        if (game.indexOf('unsolvable') !== -1) {
            $scope.messageLine = game.substr(82); /* Echo the description if unsolvable */
        }

        refreshCandidates();

    }

    /* all 81 values into a string which can be stored in a cookie */
    $scope.toString = function () {
        /* Evaluate all 81 cells */
        var currentValues ='';
        for (var i = 0; i < 81;i += 1) {
            var cellValue = $scope.cells[i].value;
            if ($scope.cells[i].isPrefilled != true) {
                /* Translate the not-prefilled values to chars, so we can rebuild the grid exactly as it is now */
                cellValue = (cellValue === '') ? '.' : 'ABCDEFGHI'.substr(cellValue-1,1);
            }
            /* Build up string with either dot or value */
            currentValues += cellValue;
        }
        return currentValues;
    }

    /* I fear we must determine all the candidates of all cells, */
    /* if we decide to delete a value from the playfield */
    var refreshCandidates = function () {
        for(var i=0;i<81;i+=1) {
            var thisCell = $scope.cells[i];
            if (thisCell.value == '') {
                thisCell.candidates=[1,2,3,4,5,6,7,8,9];
            }
            if (thisCell.isPrefilled) {
                thisCell.candidates.splice(0,thisCell.candidates.length);
            }
        }
        for(var i=0;i<81;i+=1) {
            var thisCell = $scope.cells[i];
            if (thisCell.value != '') {
                thisCell.candidates = [];
                /* remove the value from all the candidates of the 20 surrounding cells */
                for (var j=0; j < 20; j += 1) {
                    thisCell.influencedCells[j].removeCandidate(thisCell.value);
                }
            }
        }
        // now what if a cell holds 2 candidates, and another cell in the same row/col/block holds exactly the same 2 candidates?
        // No other cell in that row/col/block may hold either of those 2 values...

    }

    $scope.randomFill = function () {

        var games = [
            // Unsolvable yet '8.9..47..6179..2.3...7.3...7.....8...9.....1...1.....2...8.5...1.5..6984..82..3.5:new,patternx'
            '4.5.......2.8.3..7................1..4..9......2.....6....8.95..9...2.6...651.3.8:Difficult, pattern1',
            '....9............2426.7.1....24..36......8.........7.9.7.........42..6.1...8.5...:Difficult, pattern2',
            '.8.7.4...7...61...3..8....5..2...49..6............5.2.97....3...31.........6.2...:Difficult, pattern3',
            '2..1........675...3..........15......6.2.845.......7...4.......7...64..3.2..9..7.:Difficult, pattern4',
            '.8....4.....6....21....9...8.5.4...7....31..4.7............3.6......7...32..8.15.:Difficult, pattern5',
            '........1.9.4.....34859.....5.7.....6.....9.....2387..8.......67..........4.8..3.:Difficult, pattern6',
            '..3.....26..4..37.8.4.7..95.3...5..12...1.95.....9.7..3..6.4.1..581....6.6.....27:Difficult, pattern7',
            '....8716.8......54941...8..3....26.....39..1.69.5.....1.7........59...47.6.2.....:Difficult, pattern8'
        ];
        /* All 9 values in random order into a string */
        var nineNumbers = ['1','2','3','4','5','6','7','8','9'];
        /* Randomly move those 9 numbers around in the array */
        for (var i = 0; i < 9; i += 1) {
            var swapWith = parseInt(Math.random()*9);
            var temp = nineNumbers[i];
            nineNumbers[i] = nineNumbers[swapWith];
            nineNumbers[swapWith] = temp;
        }

        /* Pick the corresponding value from nineNumbers array. The game is the same, but looks different */
        /* Apply the random selected numbers to the game template */
        var selectedGameTemplate = games[Math.floor(Math.random() * games.length)];
        var newGame = '';
        for (var i = 0; i < 81; i += 1) {
            var cellValue=selectedGameTemplate.substr(i, 1);
            newGame = newGame + (cellValue === '.' ? '.' : nineNumbers[cellValue-1]);
        }
        /* reverse it for more variation in pattern. The IF contains a random Boolean(yes-no) decider. Like it PW */
        if (Math.floor((Math.random() *2)-1)) {
            var reversedNewGame = '';
            for (var i = 0; i < 81; i += 1) {
                reversedNewGame += newGame.substr(80-i, 1);
            }
            newGame = reversedNewGame;
        }

        /* Another variation, swap the top 3 boxes, middle 3 boxes and bottom 3 boxes at random */
        /* this produces a valid sudoku also, and is done by substringing into 3 parts */
        var gamePart1 = newGame.substr(0, 27);
        var gamePart2 = newGame.substr(27, 27);
        var gamePart3 = newGame.substr(54, 27);
        var swap = Math.floor((Math.random() *4));
        switch (swap) {
            case 0:
                /* Nothing, keep as is */
                break
            case 1:
                newGame = gamePart2 + gamePart3 + gamePart1;
                break
            case 2:
                newGame = gamePart3 + gamePart1 + gamePart2;
                break
            case 3:
                newGame = gamePart3 + gamePart2 + gamePart1;
                break
            default:
                break

        }

        /* Now, fill the game with the new gamestring */
        fillFromString(newGame + selectedGameTemplate.substr(81));
        $scope.messageLine = 'Each row, col and block of 9 need the values 1-9. ' +
                           'But the same value may only occur once in each row, cell or block. Can you solve this?';

    } /* randomFill */


    $scope.solutions = function () {
        /* Each cell can have max 9 candidates. Each filled cell has no candidates */
        /* Each cell's candidate-list is shortened by filled cells in the same row, col or block */
        /* For this, i have to master array.push and splice */
        /* I think the object 'cell' may hold an ARRAY of candidates, and is responsible for filling and removing items,  */
        /*  since the candidate-array holds only numerics, and require no deeper logic.  */
        /* Therefore we need no new object 'candidate', an array is OK here and processing is done by the CELL object.  */

        /* First things first. Lets say we want to know how many candidates a specific cell has. */
        /* With a dummy filling of 1-8 in row0, the last open cell will have only one (1) candidate.  */
        /* To prove the concept, evaluate all cells in first row, and decide the Nr of candidates per cell */
        /* When all objects are correcly in place and all functions where they should, i will complete it with col and block. */

        /* From here, 2 things indicate a guaranteed solution for a cell: */
        /* A) when a cell has only 1 candidate */
        /* B) when a value appears only in 1 candidatelist within a row/col/block */
        /* since A) is the fastest to detect, go for that first. */

        var solutionsList = [];

        for (var i = 0; i < 81;i += 1) {
        /* Is there only 1 candidate for this cell? */
            var thisCell = $scope.cells[i];
            if (thisCell.candidates.length === 1) {
                solutionsList.push({
                    solutionCell: thisCell,
                    kindOf: 'cell',
                    solutionValue: thisCell.candidates[0]
                });
            }
        }

        /* Next step, see if a value has only 1 valid location in a row, col or block */
        /* If that is so, than its defenitely the correct solution */
        for (var i = 0; i < 9;i += 1) {

            for (var val = 1; val < 10;val += 1) {

                var thisCell = nineBlocks[i].getSingleLocationForValue(val);
                if (thisCell) {
                    solutionsList.push({
                        solutionCell: thisCell,
                        kindOf: 'block',
                        solutionValue: val
                    });
                } else {
                    var thisCell = nineCols[i].getSingleLocationForValue(val);
                    if (thisCell) {
                        solutionsList.push({
                            solutionCell: thisCell,
                            kindOf: 'column',
                            solutionValue: val
                        });
                    } else {
                        var thisCell = nineRows[i].getSingleLocationForValue(val);
                        if (thisCell) {
                            solutionsList.push({
                                solutionCell: thisCell,
                                kindOf: 'row',
                                solutionValue: val
                            });
                        }
                    }
                }

            }
        }

        /* Finally, to solve even the trickiest of sudokus, seek 'twins' . TODO */
		for (var i = 0; i < 9;i += 1) {
			nineRows[i].removeTwinCandidateValues();
			nineCols[i].removeTwinCandidateValues();
			nineBlocks[i].removeTwinCandidateValues();
		}

        /* Return an array holding solutions  */
        return solutionsList;
    }

    /* Solving one step. This Contains the sudoku core logic, the solver */
    $scope.solveOneStep = function() {
        var solutionsList = $scope.solutions();
        for (var i = 0, max=solutionsList.length; i < max; i += 1) {
            var thisSolution = solutionsList[i];
            thisSolution.solutionCell.value = thisSolution.solutionValue;
        }
        refreshCandidates();
        /* See if it is solved, and if so, brag about it with fireworks */
        checkSolved();
    }

    /* We can try to solve it all by solving several steps at the time */
    $scope.trySolve = function() {

        /* Max 30 runs to try to complete the thing */
        var busySolving = true;
        for (var i = 0; i < 30;i += 1 ) {
            var previousString=$scope.toString();
            var currentString = $scope.toString();

            $scope.solveOneStep();

            if (checkSolved()) {
                busySolving = false;  /* Hurraay Solved it.  */
                return; // bail out
            }
            else if (currentString === previousString) {
                busySolving = false;
                $scope.messageLine = 'No solutions found. Either guessing is required, or you entered a wrong value :-(';
            }
         }
    }

    var checkSolved = function() {
    /* See if all values are filled. No DOTS in the toString */
        var currentString = $scope.toString();
        if (currentString.indexOf('.') == -1) {
            /* when all values are filled, display hurray and fireworks */
            $scope.messageLine = 'SOLVED!';
            $scope.isGameSolved = true;
            return true;
        } else {
            return false;
        }

    }

    /* Help the user visually to the next solution */
    $scope.giveHint = function() {
        /* giving hints, that is implementing 1 step of the solving method, and */
        /* select at random "one of the found solutions" */

        resetDisplay();

        var solutionsList = $scope.solutions();
        if (solutionsList.length > 0) {
            var randomNumber = Math.floor(Math.random()*solutionsList.length);
            var hint = solutionsList[randomNumber];

            switch (hint.kindOf) {
            case 'cell':
                hint.solutionCell.isHint=true;
                $scope.messageLine = 'Hint: this cell may only contain the value ' + hint.solutionValue;
                break
            case 'row':
                nineRows[hint.solutionCell.row].markAsHint();
                if (nineRows[hint.solutionCell.row].isOnlyOneCellLeft()) {
                    $scope.messageLine = 'Hint: Complete the row';
                } else {
                    $scope.messageLine = 'Hint: in this row, value ' + hint.solutionValue + ' may only be placed in one location';
                }
                break
            case 'column':
                nineCols[hint.solutionCell.col].markAsHint();
                if (nineCols[hint.solutionCell.col].isOnlyOneCellLeft()) {
                    $scope.messageLine = 'Hint: Complete the column';
                } else {
                    $scope.messageLine = 'Hint: in this column, value ' + hint.solutionValue + ' may only be placed in one location';
                }
                break
            case 'block':
                nineBlocks[hint.solutionCell.block].markAsHint();
                if (nineBlocks[hint.solutionCell.block].isOnlyOneCellLeft()) {
                    $scope.messageLine = 'Hint: Complete the block';
                } else {
                    $scope.messageLine = 'Hint: in this block, value ' + hint.solutionValue + ' may only be placed in one location';
                }
                break
            default:
                break
            }
        }
        else {
            $scope.messageLine = 'Sorry. Can not figure out a hint based on the filled values';
        }

    } /* giveHint */

    /* To be implemented, saving and loading a game. This don't work */
    $scope.saveGame = function() {
        console.log($scope.$root);
        document.cookie=$scope.$root.attr('id') + "=" + escape($scope.toString())+ "; path=/";
    }

    /* To be implemented, saving and loading a game. This don't work */
    $scope.loadGame = function() {
        var game='';
        if (document.cookie.length>0){
            var c_name=$scope.$root.attr('id');
            c_start=document.cookie.indexOf(c_name + "=");
            if (c_start!=-1){
                c_start=c_start + c_name.length+1;
                c_end=document.cookie.indexOf(";",c_start);
                if (c_end==-1) c_end=document.cookie.length;
                game=unescape(document.cookie.substring(c_start,c_end));
            }
        }
        if (game ==='') {
            alert('No game saved yet');
        }
        else {
            $scope.fillFromString(game);
        }

    }

    /* NOTE that row, col and block are VERY similar. SetofNine holds nine cells, irrespective of geography */
    function SetofNine(kindof) {
        this.kindof=kindof; /* For debugging purposes, not for polymorphism  */
        this.cells = [];
        /* Count the number of times a candidate appears in the cells of this row/col/block */
        /* If it appears only 1 time.... Bingo, there is no other place to fill it in       */
        this.getSingleLocationForValue = function(value) {
            var nrPossibilities = 0;
            var cellToPutValue = {};
            /* evaluate all 9 positions */
            for (var i = 0; i < 9; i += 1) {
                if (this.cells[i].value == '') {
                    /* Is the value part of the candidatelist for this cell? */
                    /* Note that IE does not allow indexOf on a number Array */
                    if (this.cells[i].candidates.toString().indexOf(value) !== -1) {
                        cellToPutValue = this.cells[i];
                        nrPossibilities += 1;
                    }
                }
            }
            /* Hey, we found the only cell that may hold the passed value in this SetofNine */
            if (nrPossibilities === 1) {
                return cellToPutValue;
            }
            else {
                /* return undefined? Is this allowed, and a wise thing to do? Return false ? Ask Anthony */
                return false;
            }
        }

        /* Count the number of open cells in row/col/block */
        /* If only 1 cell open, the hint is obvious      */
        this.isOnlyOneCellLeft = function() {
            var nrOpenCells = 0;
            /* evaluate all 9 positions */
            for (var i = 0; i < 9; i += 1) {
                if (this.cells[i].value == '') {
                        nrOpenCells += 1;
                }
            }
            /* Hey, we found the only cell that may hold the passed value in this SetofNine */
            if (nrOpenCells === 1) {
                return true;
            } else {
                return false;
            }
        }

        /* Encapsulate the Cell's "isHint" property, to be able to mark all cells in the setOfNine  */
        this.markAsHint = function() {
            for (var i = 0; i < 9; i += 1) {
                this.cells[i].isHint=true;
            }
        }

		/* Seek twins, and remove the candidatevalues from the other cells in this setOfNine */
		this.removeTwinCandidateValues = function () {
			var cellsWith2Candidates = [];
			for (var i = 0; i < 9; i += 1) {
                if (this.cells[i].candidates.length === 2) {
					cellsWith2Candidates.push(this.cells[i]);
				};
            }
            if (cellsWith2Candidates.length > 2) {
                window.console.log(cellsWith2Candidates);
            }

            if (cellsWith2Candidates.length === 2) {
                if (cellsWith2Candidates[0].candidates[0] === cellsWith2Candidates[1].candidates[0] &&
                    cellsWith2Candidates[0].candidates[1] === cellsWith2Candidates[1].candidates[1]) {
                    console.log('found twin', cellsWith2Candidates[0].sequenceNr, cellsWith2Candidates[1].sequenceNr,  cellsWith2Candidates[0].candidates );
                    // Now remove those 2 candidates from all other cells in this setOfNine
                    for (var i = 0; i < 9; i += 1) {
                        var aCell = this.cells[i];
                        if (!aCell.sequenceNr === cellsWith2Candidates[0].sequenceNr &&
                            !aCell.sequenceNr === cellsWith2Candidates[1].sequenceNr) {
                            aCell.removeCandidate(cellsWith2Candidates[0].candidate[0]);
                            aCell.removeCandidate(cellsWith2Candidates[0].candidate[1]);
                        }
                    }
                }
            }
		}


        return true;
    }

    function Cell(sequenceNr) {
    /* This is one way of making an object come to life.  */
    /* Acts as a prototype, directly bound to the input text box */
    /* But i have to figure out the proper way of prototyping here. Perhaps i am doing it all wrong... */

        this.sequenceNr = sequenceNr;

        /* in the beginning, cell is empty. All values are stil possible */
        this.candidates = [1,2,3,4,5,6,7,8,9];

        /* Each cell influences 20 surrounding cells; 8 in the same row, 8 in the same col and 4 others in the block */
        this.influencedCells = [];

        /* A direct property speeds the JS up, we don't need to go to the DOM every time */
        this.value = '';

        /* Default values */
        this.isPrefilled = false;
        this.isHint = false;
        this.isError = false;

        if ([0,3,6,27,30,33,54,57,60].indexOf(this.sequenceNr) !== -1) {
            this.posInBlock = 'lu';
        } else if ([1,4,7,28,31,34,55,58,61].indexOf(this.sequenceNr) !== -1) {
            this.posInBlock = 'mu';
        } else if ([2,5,8,29,32,35,56,59,62].indexOf(this.sequenceNr) !== -1) {
            this.posInBlock = 'ru';
        } else if ([9,12,15,36,39,42,63,66,69].indexOf(this.sequenceNr) !== -1) {
            this.posInBlock = 'lm';
        } else if ([10,13,16,37,40,43,64,67,70].indexOf(this.sequenceNr) !== -1) {
            this.posInBlock = 'mm';
        } else if ([11,14,17,38,41,44,65,68,71].indexOf(this.sequenceNr) !== -1) {
            this.posInBlock = 'rm';
        } else if ([18,21,24,45,48,51,72,75,78].indexOf(this.sequenceNr) !== -1) {
            this.posInBlock = 'ld';
        } else if ([19,22,25,46,49,52,73,76,79].indexOf(this.sequenceNr) !== -1) {
            this.posInBlock = 'md';
        } else {
            this.posInBlock = 'rd';
        }

        this.thickTop = this.thickLeft = this.thickRight = this.thickBottom = false;

        this.thickTop = ([0,1,2,3,4,5,6,7,8,27,28,29,30,31,32,33,34,35,54,55,56,57,58,59,60,61,62].indexOf(this.sequenceNr) !== -1);
        this.thickLeft = ([0,9,18,27,36,45,54,63,72,3,12,21,30,39,48,57,66,75,6,15,24,33,42,51,60,69,78].indexOf(this.sequenceNr) !== -1);
        this.thickBottom = ([72,73,74,75,76,77,78,79,80].indexOf(this.sequenceNr) !== -1);
        this.thickRight = ([8,17,26,35,44,53,62,71,80].indexOf(this.sequenceNr) !== -1);

        this.seekConflictingCell = function(value) {
        /* if this cell holds the incoming value, will it conflict with neighbours? */
        /* If the candidates are maintained for every set value, the valueallowed must be part of the candidates */
        /* That would speed things up... TODO PW */
            var conflictingCells = []; /* Going to return conflicting cells, or empty object */
            for (var i=0; i < 20; i += 1) {
                /* evaluate all 20 surrounding cells. */
                /* However, the type might differ 6 !== "6" but 6 == "6". PW Ask Anthony*/
                if (value == this.influencedCells[i].value) {
                    conflictingCells.push(this.influencedCells[i]);
                }
            }
            return conflictingCells;
        }

        this.removeCandidate = function(candidate) {
            if (this.candidates.length > 0) {
                for (var i = 0; i < 9;i += 1) {
                    /* Here is a tricky == statement. However, if i change to ===, the model fails ! */
                    /* Has something to do with passing a string (prefilled) and a numeric ( not prefilled) */
                    /* interesting... Perhaps we need to cast to the correct type. PW*/
                    if (this.candidates[i] == candidate) {
                        this.candidates.splice(i,1);
                    }
                }
            }
        }

        /* According to internet, a constructor should retain a valid state. So return true here. */
        return true;
    }

});

