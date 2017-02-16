# Snake Auto Game
Given a plan as an array of strings and a legend to convert every character to the corresponding element, the program can output a self-playing snake game. The snake can automatically find its own way to the food and the food can find a new position after being eaten

## Guide to running:
Changing the last lines into your own plan, legend and number of times running. Needs to be run separately on platforms like WebStorm. Will upload the website version soon

## Sample input
```
    plan = ["*******************",
            "* !               *",
            "* O               *",
            "*******************"];
    
    
    legend = {
    '*' : Wall,
    'O' : Snake,
    '!' : Food,
    ' ' : Blank
    };
```
## Sample output
Five first sample output
```
*******************
* !               *
* O               *
*******************

*******************
* O          !    *
*                 *
*******************

*******************
*  O         !    *
*                 *
*******************

*******************
*    O       !    *
*                 *
*******************

*******************
*      O     !    *
*                 *
*******************
```
