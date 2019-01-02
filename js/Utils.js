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
    let intersection = new Set(),
        smallest,
        biggest;

    if (this.size < other.size) {
        smallest = this;
        biggest = other;
    } else {
        smallest = other;
        biggest = this;
    }

    for (var elem of smallest) {
        if (biggest.has(elem)) {
            intersection.add(elem);
        }
    }

    return intersection;
}

Set.prototype.union = function(other) {
    let union,
        smallest;

    if (this.size < other.size) {
        union = new Set(other);
        smallest = this;
    } else {
        union = new Set(this);
        smallest = other;
    }

    for (let elem of smallest) {
        union.add(elem);
    }

    return union;
}

Object.prototype.getNestedValue = function(keys) {
    if (typeof keys === 'string') {
        keys = keys.split('.');
    }

    let value = this;

    while ((key = keys.shift()) && value !== undefined) {
        value = value[key];
    }

    return value;
}
