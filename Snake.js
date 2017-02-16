/**
 * Created by admin on 2/5/17.
 */

//create a new element from a character
function elementFromChar (char, legend) {
    var element = new legend[char]();
    element.originalChar = char;
    return element;
}

//return the character of an element
function charFromElement(element) {
    if (element == null) {
        return ' ';
    } else {
        return element.originalChar;
    }
}

//declare the object used for position
function Position (x, y) {
    this.x = x;
    this.y = y;
}

//add two position
Position.prototype.plus = function (position) {
    return new Position(this.x + position.x, this.y + position.y);
};

//all the possible adjacent position
var adjacent = [new Position(1,0),new Position(-1,0),new Position(0,1),new Position(0,-1)];

//add an array of blank adjacent position to one element
Position.prototype.addAdjacent = function (grid) {
    //reset all the time to ensure there are no more than 4 adjacent
    grid.get(this).adjacent = [];
    for (var i = 0; i < 4; i++) {
        var possible = this.plus(adjacent[i]);
        //as long as it is not a wall
        if (grid.isInside(possible) && !(grid.get(possible) instanceof Wall)) {
            grid.get(this).adjacent.push(possible);
        }
    }
};

//compare two positions
Position.prototype.equal = function (position) {
    if (position instanceof Position) {
        return position.x == this.x && position.y == this.y;
    }
    return false;
};

//declare the object used as a route, an array of positions
function Route (array) {
    var _route = [];
    if (array != undefined) {
        _route = array;
    }
    //add new position to the route
    Object.defineProperty(this, "push", {
        set: function (position) {
            _route.push(position);
        }
    });
    //return an object used to traverse the route
    Object.defineProperty(this, "iterator", {
        get: function () {
            var index = 0;
            return {
                next: function () {
                    return index >= _route.length ? null : _route[index++];
                },
                current: function () {
                    return _route[index];
                }
            }
        }
    });
    Object.defineProperty(this, "length", {
        get: function () {
            return _route.length;
        }
    });
    Object.defineProperty(this, "data", {
        get: function () {
            return _route;
        }
    });
    //use to check if one position is in the route or not
    this.indexOf = function (other) {
        for (var i = 0; i < _route.length; i++) {
            if (_route[i].equal(other)) {
                return i;
            }
        }
        return -1;
    };
    //copy constructor
    this.clone = function (newRoute) {
        var iterator = this.iterator;
        var element = iterator.next();
        while (element != null) {
            newRoute.push = element;
            element = iterator.next();
        }
    };
}


//declare a grid
function Grid (plan, legend) {
    this.width = plan[0].length;
    this.height = plan.length;
    this.data = [];
    for (var i = 0; i < this.height; i++) {
        this.data.push([]);
    }
    //traverse the plan to add new element to the grid
    plan.forEach(function (row, rowIndex) {
        for (var columnIndex = 0; columnIndex < row.length; columnIndex++) {
                this.data[rowIndex].push(elementFromChar(row[columnIndex], legend));
        }
    }, this);
}


Grid.prototype.isInside = function(vector) {
    return vector.x >= 0 && vector.x < this.width &&
        vector.y >= 0 && vector.y < this.height;
};

Grid.prototype.get = function (position) {
    console.assert(position, "Get wrong position in get");
    if (this.isInside(position)) {
        return this.data[position.y][position.x];
    }
    return null;
};

Grid.prototype.set = function (position, value) {
    console.assert(position, "Get wrong position in set");
    if (this.isInside(position)) {
        this.data[position.y][position.x] = value;
    }
};

//create a new world and add adjacent arrays to every element
function World(plan, legend) {
    this.grid = new Grid(plan, legend);
    this.legend = legend;
    this.updateAdjacent();
}

//find a random element in the grid
World.prototype.findElement = function (element) {
    var possible = [];
    for (var i = 0; i < this.grid.height; i++) {
        for (var j = 0; j < this.grid.width; j++) {
            var position = new Position(j, i);
            if (this.grid.get(position) instanceof element) {
                possible.push(position);
            }
        }
    }
    if (element != Blank && possible.length >= 2) {
        this.grid.set(possible[0], elementFromChar(' ', this.legend));
        return possible[1];
    }
    console.assert(possible.length != 0, "Something not found" + element.originalChar);
    return possible[Math.floor(Math.random() * possible.length)];

};

//check if a position is adjacent to the other
World.prototype.isAdjacent = function (original, other) {
    console.assert(original, "Get wrong position in isAdjacent");
    var element = this.grid.get(original).adjacent;
    if (element) {
        for (var i = 0; i < element.length; i++) {
            if (element[i].equal(other)) {
                return true;
            }
        }
    }
    return false;
};

//reupdate the adjacent of every position
World.prototype.updateAdjacent = function () {
    for (var i = 0; i < this.grid.height; i++) {
        for (var j = 0; j < this.grid.width; j++) {
            var position = new Position(j, i);
            position.addAdjacent(this.grid);
        }
    }
};

//find a route between two position
World.prototype.findRouteAlt = function (originPosition, targetPosition, route, maxLength) {
    //remember to pass the maxLength to ensure the memory is not overloaded
    //two base cases
    if (originPosition.equal(targetPosition)) {
        return route;
    }
    console.assert(originPosition, "Get wrong position in findRouteAlt");
    var origin = this.grid.get(originPosition);
    var routeData = route.data;
    //defensive programming, always check for undefined
    if (origin == undefined || origin.adjacent == undefined || routeData.length > maxLength) {
        return undefined;
    }
    var array = [];
    for (var i = 0; i < origin.adjacent.length; i++) {
        var dupeRoute = new Route();
        var dupeData = dupeRoute.data;
        //make a copy of the original route
        route.clone(dupeRoute);
        //check if the next position is in the route or not and if the next position is adjacent to the last position in the route
        if (dupeRoute.indexOf(origin.adjacent[i]) == -1 && this.isAdjacent(dupeData[dupeData.length - 1], origin.adjacent[i])) {
            dupeRoute.push = origin.adjacent[i];
            var foundRoute = this.findRouteAlt(origin.adjacent[i], targetPosition, dupeRoute, maxLength);
            array.push(foundRoute);
        }
    }
    var filtered = array.filter(function (route) {
        return route != undefined;
    });
    return filtered[0];
};


World.prototype.findRoute = function (origin, target) {
    var route = new Route([origin]);
    console.assert(target != undefined, "Target undefined");
    //calculate the maxLength
    var maxLength = Math.abs(origin.x - target.x) + Math.abs(origin.y - target.y);
    return this.findRouteAlt(origin,target,route, maxLength);
};

var actionTypes = Object.create(null);

//the list of possible action
actionTypes.move = function (element, position, action) {
    this.grid.set(position, this.grid.get(action.dest));
    this.grid.set(action.dest, element);
};

actionTypes.findFood = function (element, position, action) {
    var destination = this.findElement(Food);
    var route = this.findRoute(position, destination);
    //find a new route from the snake to the food, then give the element that data
    element.route = route;
    element.iterator = element.route.iterator;
    //ensure the iterator has been started
    element.iterator.next();
};

actionTypes.findNewPosition = function (element, position, action) {
    var newPosition = this.findElement(Blank);
    while (newPosition.equal(position)) {
        //ensure it find a new far
        newPosition = this.findElement(Blank);
    }
    var numSnake = this.findElement(Snake);
    var numFood = this.findElement(Food);
    console.assert(numSnake != undefined || numFood != undefined, "No snake/food before find new position");
    this.grid.set(newPosition, element);
    this.grid.set(position, elementFromChar(" ", this.legend));
};

actionTypes.start = function() {

};

actionTypes.eat = function () {

};

World.prototype.turn = function () {
    var snakePosition1 = this.findElement(Snake);
    this.letAct(this.grid.get(snakePosition1), snakePosition1);
    this.updateAdjacent();
    var snakePosition2 = this.findElement(Snake);
    console.assert(!snakePosition1.equal(snakePosition2), "Snake doesn't move");
};

World.prototype.letAct = function(element, position) {
    var action = element.act();
    if (action && action.type in actionTypes) {
        if (action.type == 'eat') {
            console.assert(action.dest, "Get wrong position in letAct");
            actionTypes["findNewPosition"].call(this, this.grid.get(action.dest), action.dest, action);
            actionTypes["move"].call(this, element, position, action);
            this.updateAdjacent();
            actionTypes["findFood"].call(this, element, action.dest, action);

        }
        if (action.type == 'start') {
            var numSnake = this.findElement(Snake);
            var numFood = this.findElement(Food);
            console.assert(numSnake != undefined || numFood != undefined, "No snake/food before starting");
            actionTypes["findFood"].call(this, element, position, action);
            numSnake = this.findElement(Snake);
            numFood = this.findElement(Food);
            console.assert(numSnake != undefined || numFood != undefined, "No snake/food after starting");
            this.letAct(element, position);
        }
        actionTypes[action.type].call(this, element, position, action);
    }
};

World.prototype.toString = function () {
    var output = "";
    for (var y = 0; y < this.grid.height; y++) {
        for (var x = 0; x < this.grid.width; x++) {
            var element = this.grid.get(new Position(x, y));
            output += charFromElement(element);
        }
        output += "\n";
    }
    return output;
};


function Wall () {

}

function Food () {

}

function Blank () {

}

function Snake () {
    this.route = null;
    this.iterator = null;
}


Snake.prototype.act = function () {
    if (this.route == null) {
        return {
            type: "start"
        }
    }
    var routeData = this.route.data;
    var current = this.iterator.next();
    var next = this.iterator.next();
    if (next == null) {
        if (current == null) {
            return {
                type: "eat",
                dest: routeData[routeData.length - 1]
            }
        }
        return {
            type: "eat",
            dest: current
        }
    } else {
        return {
            type: "move",
            dest: current
        }
    }
};

var plan = ["*******************",
            "* !               *",
            "* O               *",
            "*******************"];

var legend = {
    '*' : Wall,
    'O' : Snake,
    '!' : Food,
    ' ' : Blank
};

var world = new World(plan, legend);
console.log(world.toString());
for (var i = 0; i < 10; i++) {
    world.turn();
    console.log(world.toString());
}





