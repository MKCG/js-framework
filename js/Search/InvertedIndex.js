class InvertedIndex
{
    constructor() {
        this.tokens = {};
        this.trackedIds = [];
        this.lastQueries = [];
    }

    register(id, value) {
        let tokens = this.tokenize(value);

        for (let i = 0; i < tokens.length; i++) {
            if (this.tokens.hasOwnProperty(tokens[i]) === false) {
                this.tokens[tokens[i]] = new Set();
            }

            this.tokens[tokens[i]].add(id);
        }

        if (this.trackedIds.indexOf(id) === -1) {
            this.trackedIds.push(id);
        }

        this.lastQueries = [];
    }

    remove(id) {
        let tokens = Object.keys(this.tokens);

        for (let i = 0; i < tokens.length; i++) {
            this.tokens[tokens[i]].delete(id);

            if (this.tokens[tokens[i]].size === 0) {
                delete this.tokens[tokens[i]];
            }
        }

        this.trackedIds.splice(this.trackedIds.indexOf(id), 1);
        this.lastQueries = [];
    }

    search(value) {
        if (this.trackedIds.length === 0) {
            return [];
        }

        let cachedResult = this.searchQueryResult('search', value);

        if (Array.isArray(cachedResult)) {
            return cachedResult;
        }

        let tokens = this.tokenize(value),
            ids = [];

        if (tokens.length === 0) {
            ids = this.trackedIds;
        } else {
            ids = this.listMatchingAndIds(tokens);
        }

        this.saveQueryResult('search', value, ids);

        return ids;
    }

    searchByPrefix(value) {
        if (value === '' || value.slice(value.length -1) === ' ') {
            return this.search(value);
        }

        let cachedResult = this.searchQueryResult('searchByPrefix', value);

        if (Array.isArray(cachedResult)) {
            return cachedResult;
        }

        let ids = [];
        let tokens = value.normalize('NFD')
            .replace(/[\u0300-\u036f,!?;:]/g, "")
            .split(' ')
            .filter((v) => v !== '')
            .map((value) => value.toLowerCase());

        let lastToken = tokens.pop();

        tokens = tokens.filter(function(value, index, array) {
            return array.indexOf(value) === index;
        });

        if (tokens.length > 0) {
            ids = this.listMatchingAndIds(tokens);

            if (tokens.length > 0 && ids.length === 0) {
                this.saveQueryResult('searchByPrefix', value, []);
                return [];
            }
        }

        let prefixedTokens = Object.keys(this.tokens).filter(function(value) {
            return value.indexOf(this) === 0;
        }, lastToken);

        if (prefixedTokens.length === 0) {
            this.saveQueryResult('searchByPrefix', value, []);
            return [];
        }

        let idsPrefixingLastToken = this.listMatchingOrIds(prefixedTokens);

        if (tokens.length > 0) {
            ids = ids.filter(function(id) {
                return this.indexOf(id) > -1;
            }, idsPrefixingLastToken);
        } else {
            ids = idsPrefixingLastToken;
        }

        this.saveQueryResult('searchByPrefix', value, ids);

        return ids;
    }

    listMatchingAndIds(tokens) {
        let matched = [];

        for (let i = 0; i < tokens.length; i++) {
            if (this.tokens.hasOwnProperty(tokens[i]) === false) {
                return [];
            }

            if (matched.length === 0) {
                matched = this.tokens[tokens[i]].clone();
            } else {
                matched = matched.intersect(this.tokens[tokens[i]]);
            }

            if (matched.size === 0) {
                break;
            }
        }

        matched = [...matched];

        return matched;
    }

    listMatchingOrIds(tokens) {
        let matched = [];

        for (let i = 0; i < tokens.length; i++) {
            if (this.tokens.hasOwnProperty(tokens[i]) === false) {
                return [];
            }

            if (matched.length === 0) {
                matched = this.tokens[tokens[i]].clone();
            } else {
                matched = matched.union(this.tokens[tokens[i]]);
            }

            if (matched.size === this.trackedIds.length) {
                break;
            }
        }

        matched = [...matched];

        return matched;
    }

    tokenize(value) {
        return value.normalize('NFD')
            .replace(/[\u0300-\u036f,!?;:]/g, "")
            .split(' ')
            .filter(function(value, index, array) {
                return value !== '' && array.indexOf(value) === index;
            })
            .map((value) => value.toLowerCase());
    }

    searchQueryResult(type, query) {
        for (let i = this.lastQueries.length - 1; i >= 0; i--) {
            if (this.lastQueries[i].type === type && this.lastQueries[i].query === query) {
                return this.lastQueries[i].result;
            }
        }
    }

    saveQueryResult(type, query, result) {
        this.lastQueries.push({'type': type, 'query': query, 'result': result});

        if (this.lastQueries.length > 50) {
            this.lastQueries.shift();
        }
    }
}
