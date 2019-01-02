class SearchEngine extends Component
{
    constructor(index) {
        super();

        this.index = index;
        this.documents = [];
    }

    indexDocument(id, doc, fields) {
        for (let field of fields) {
            let value = doc.getNestedValue(field);

            if (typeof value === 'string') {
                this.index.register(id, value);
            }
        }

        this.documents[id] = doc;
    }

    start(limit) {
        this.searchByPrefix('', limit);
    }

    searchByPrefix(query, limit) {
        this.notify('search');

        let ids = this.index.searchByPrefix(query),
            count = ids.length;

        let documents = ids.slice(0, limit)
            .map(function(id) {
                return this.documents[id];
            }.bind(this));

        this.notify('results', {
            'query': query,
            'ids': ids,
            'count': count,
            'documents': documents
        });
    }

    suggest(query, limit) {
        this.notify('suggest');

        let suggestions = this.index.suggest(query, limit);

        this.notify('suggestions', {
            'query':query,
            'suggestions': suggestions
        });
    }
}

class SearchEngineBuilder
{
    static create(cacheSize, useWorker) {
        if (useWorker === true) {
            return new SearchEngine(new InvertedIndex(cacheSize));
        } else {
            return new SearchEngine(new InvertedIndex(cacheSize));
        }
    }
}
