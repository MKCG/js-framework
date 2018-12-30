Array.prototype.equals = function (other) {
    if (Array.isArray(other) === false || this.length !== other.length) {
        return false;
    }

    for (let i = 0; i < this.length; i++) {
        if (Array.isArray(this[i]) && Array.isArray(other[i])) {
            if (!this[i].equals(other[i])) {
                return false;
            }
        } else if (this[i] != other[i]) {
            return false;   
        }
    }

    return true;
}

Array.prototype.intersect = function(array) {
    let values = array.filter(function(id) {
        return this.indexOf(id) > -1;
    }, this);

    return values;
}


Set.prototype.clone = function() {
    let copy = new Set([...this]);
    return copy;
}

Set.prototype.intersect = function(other) {
    let intersection = new Set();

    for (var elem of other) {
        if (this.has(elem)) {
            intersection.add(elem);
        }
    }

    return intersection;
}

Set.prototype.union = function(other) {
    var union = new Set(this);

    for (var elem of other) {
        union.add(elem);
    }

    return union;
}