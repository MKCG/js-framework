class InvertedIndex
{
    constructor(cacheSize) {
        this.tokens = {};
        this.trackedIds = [];
        this.lastQueries = [];
        this.radixTree = new RadixTree(1, 1);
        this.cacheSize = cacheSize;
    }

    register(id, value) {
        if (typeof value !== 'string') {
            return;
        }

        let tokens = this.tokenize(value);

        for (let token of tokens) {
            if (this.tokens.hasOwnProperty(token) === false) {
                this.tokens[token] = new Set();
            }

            this.tokens[token].add(id);
            this.radixTree.add(token);
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

    suggest(value, nb) {
        let tokens = value.normalize('NFD')
            .replace(/[\u0300-\u036f,!?;:@&#"'\.]/g, "")
            .split(' ')
            .filter((v) => v !== '')
            .map((value) => value.toLowerCase());

        if (tokens.length === 0) {
            return [];
        }

        let lastToken = tokens.pop(),
            phrase = value.split(' ').filter((v) => v !== ''),
            lastWord = phrase.pop();

        phrase = phrase.join(' ');

        let suggestions = this.radixTree.match(lastToken, nb).map(function(suggestion) {
            return phrase !== ''
                ? phrase + ' ' + suggestion
                : suggestion;
        }.bind(phrase));

        return suggestions;
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
            .replace(/[\u0300-\u036f,!?;:@&#"']/g, "")
            .split(' ')
            .filter((v) => v !== '')
            .map((value) => value.toLowerCase());

        if (tokens.length === 0) {
            return this.search('');
        }

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

        let prefixedTokens = this.radixTree.match(lastToken);

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
        let matched = new Set();

        // Sort to speedup the matching process when some elements size is greatly smallest than any other
        tokens.sort(function(first, second) {
            return this.tokens[first] !== undefined
                && this.tokens[second] !== undefined
                && this.tokens[first].size > this.tokens[second].size
                ? 1
                : -1;
        }.bind(this));

        for (let token of tokens) {
            if (this.tokens.hasOwnProperty(token) === false) {
                return [];
            }

            matched = matched.size === 0
                ? this.tokens[token].clone()
                : matched.intersect(this.tokens[token]);

            if (matched.size === 0) {
                break;
            }
        }

        return [...matched];
    }

    listMatchingOrIds(tokens) {
        let matched = new Set();

        for (let token of tokens) {
            if (this.tokens.hasOwnProperty(token) === false) {
                return [];
            }

            matched = matched.size === 0
                ? this.tokens[token].clone()
                : matched.union(this.tokens[token]);

            if (matched.size === this.trackedIds.length) {
                break;
            }
        }

        return [...matched];
    }

    tokenize(value) {
        return value.normalize('NFD')
            .replace(/[\u0300-\u036f,!?;:@&#"'\.]/g, "")
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
        this.lastQueries.push({
            'type': type,
            'query': query,
            'result': result
        });

        if (this.lastQueries.length > this.cacheSize) {
            this.lastQueries.shift();
        }
    }
}
