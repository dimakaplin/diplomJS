'use strict';
class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    plus(vector) {
        if (vector instanceof Vector) { }
        else {
            throw new Error('Не тот объект');
        }
        return new Vector(this.x + vector.x, this.y + vector.y);
    }
    times(multiplier) {
        return new Vector(this.x * multiplier, this.y * multiplier);
    }
}

class Actor {
    constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
        if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
            throw new Error('Не тот объект')
        }
        this.pos = pos;
        this.size = size;
        this.speed = speed;
    }

    act() { }
    get bottom() {
        let bottom = this.pos.y + this.size.y;
        return bottom;
    }
    get left() {
        let left = this.pos.x;
        return left;
    }
    get top() {
        let top = this.pos.y;
        return top;
    }
    get right() {
        let right = this.pos.x + this.size.x;
        return right;
    }
    get type() {
        return 'actor';
    }
    isIntersect(actor) {
        if (!(actor instanceof Actor) || (!actor)) {
            throw new Error('Не тот объект')
        }
        if (actor === this) {
            return false;
        }
        if (this.right > actor.left &&
            this.left < actor.right &&
            this.top < actor.bottom &&
            this.bottom > actor.top) {
            return true;
        }
        return false;
    }
}

class Level {
    constructor(grid = [], Actor = []) {
        this.grid = grid;
        this.actors = Actor;
        this.player = this.actors.filter(function (item) { return item.type === 'player' })[0];
        this.height = this.grid === undefined ? 0 : this.grid.length;
        this.width = this.grid[0] === undefined ? 0 : this.grid.sort(function (first, second) { return second.length - first.length; })[0].length;
        this.status = null;
        this.finishDelay = 1;
    }
    isFinished() {
        if (this.status !== null && this.finishDelay < 0) {
            return true;
        }
        else {
            return false;
        }
    }
    actorAt(actorobj) {
        if (!(actorobj instanceof Actor && !actorobj !== undefined)) {
            throw new Error('Не тот объект')
        }
        for (let i = 0; i < this.actors.length; i++) {
            if (this.actors[i].isIntersect(actorobj)) {
                return this.actors[i];
            } else if (this.actors[i].isIntersect(actorobj)) {
                return undefined;
            }
        }
    }
    obstacleAt(pos, size) {
        if (!(pos instanceof Vector) && !(size instanceof Vector)) {
            throw new Error('Не тот объект')
        }

        let left = Math.floor(pos.x);
        let right = Math.ceil(pos.x + size.x);
        let top = Math.floor(pos.y);
        let bottom = Math.ceil(pos.y + size.y);


        if (left < 0 || right > this.width || top < 0) {
            return 'wall';
        }
        else if (bottom > this.height) {
            return 'lava';
        }
        for (let i = top; i < bottom; i++) {
            for (let k = left; k < right; k++) {
                if (this.grid[i][k]) {
                    return this.grid[i][k];
                }
            }
        }

    }
    removeActor(Actor) {
        this.actors = this.actors.filter(function (item) {
            return item !== Actor;
        });
    }
    noMoreActors(type) {
        if (this.actors.filter(function (item) { return item.type === type }).length === 0) {
            return true;
        }
        else {
            return false;
        }
    }
    playerTouched(type, Actor) {
        if (this.status !== null) { }
        else if (type === 'lava' || type === 'fireball') {
            this.status = 'lost';
        }
        else if (type === 'coin' && Actor.type === 'coin') {
            this.removeActor(Actor);
            if (this.noMoreActors(type)) {
                this.status = 'won';
            }
        }
    }
}


class LevelParser {
    constructor(wordsBook) {
        this.wordsBook = wordsBook;
    }
    actorFromSymbol(symbol) {
        for (let key in this.wordsBook) {
            if (key === symbol) {
                return this.wordsBook[key];
            }
            else {
                return undefined;
            }
        }
    }
    obstacleFromSymbol(symbol) {
        if (symbol === 'x') {
            return 'wall';
        }
        else if (symbol === '!') {
            return 'lava';
        }
        else {
            return undefined;
        }
    }
    createGrid(stringArr) {
        let grid = stringArr.map(function (item) { return item.split('') });
        for (let i = 0; i < grid.length; i++) {
            grid[i] = grid[i].map((item) => { return this.obstacleFromSymbol(item) });
        }
        return grid;
    }
    createActors(stringArr) {
        let actors = [];
        if (this.wordsBook) {
            stringArr.map((elemY, y) => {
                [...elemY].map((elemX, x) => {
                    let res;
                    if (typeof (this.wordsBook[elemX]) === 'function') {
                        res = new this.wordsBook[elemX](new Vector(x, y));
                        if (res instanceof Actor) {
                            actors.push(res);
                        }
                    }
                })
            })
        }
        return actors;
    }

    parse(stringArr) {
        let grid = this.createGrid(stringArr);
        let actors = this.createActors(stringArr);
        let level = new Level(grid, actors)
        return level;
    }
}

class Fireball extends Actor {
    constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
        super();
        this.pos = pos;
        this.size = new Vector(1, 1);
        this.speed = speed;
    }
    get type() {
        return 'fireball';
    }
    getNextPosition(time = 1) {
        return new Vector(this.pos.x + (this.speed.x * time), this.pos.y + (this.speed.y * time));
    }
    handleObstacle() {
        this.speed = new Vector(this.speed.x * -1, this.speed.y * -1);
    }
    act(time, Level) {
        let newPos = this.getNextPosition(time);
        if (Level.obstacleAt(newPos, this.size) === undefined) {
            this.pos = newPos;
        }
        else {
            this.handleObstacle();
        }
    }
}
class HorizontalFireball extends Fireball {
    constructor(pos) {
        super(pos);
        this.speed = new Vector(2, 0);
        this.size = new Vector(1, 1);
    }
}
class VerticalFireball extends Fireball {
    constructor(pos) {
        super(pos);
        this.speed = new Vector(0, 2);
        this.size = new Vector(1, 1);
    }

}
class FireRain extends Fireball {
    constructor(pos) {
        super(pos);
        this.speed = new Vector(0, 3);
        this.size = new Vector(1, 1);
        this.posCopy = pos;
    }
    handleObstacle() {
        this.pos = this.posCopy;
    }
}
class Coin extends Actor {
    constructor(pos) {
        super(pos);
        this.basePos = this.pos.plus(new Vector(0.2, 0.1));
        this.pos = this.pos.plus(new Vector(0.2, 0.1));
        this.size = new Vector(0.6, 0.6);
        this.springSpeed = 8;
        this.springDist = 0.07;
        this.spring = Math.random() * (2 * (Math.PI));
    }
    get type() {
        return 'coin';
    }
    updateSpring(time = 1) {
        this.spring = this.spring + (this.springSpeed * time);
    }
    getSpringVector() {
        return new Vector(0, Math.sin(this.spring) * this.springDist);
    }
    getNextPosition(time = 1) {
        this.updateSpring(time);
        return new Vector(this.basePos.x, this.basePos.y + this.getSpringVector().y);
    }
    act(time) {
        this.pos = this.getNextPosition(time);
    }

}
class Player extends Actor {
    constructor(pos) {
        super(pos);
        this.pos = this.pos.plus(new Vector(0, -0.5));
        this.size = new Vector(0.8, 1.5);
        this.speed = 0;
    }
    get type() {
        return 'player';
    }
}