class SearchEngine extends Component
{
    constructor(index) {
        super();

        this.index = index;
        this.documents = [];
    }

    indexDocument(id, text, data) {
        this.index.register(id, text);
        this.documents[id] = data;
    }

    start() {
        this.searchByPrefix('');
    }

    searchByPrefix(value) {
        this.notify('search');

        let ids = this.index.searchByPrefix(value),
            documents = ids.map(function(id) {
                return this.documents[id];
            }.bind(this));

        this.notify('results', {'ids': ids, 'documents': documents});
    }
}

class SearchEngineBuilder
{
    static create() {
        return new SearchEngine(new InvertedIndex());
    }
}
