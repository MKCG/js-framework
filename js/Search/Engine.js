class SearchEngine extends Component
{
    constructor(index) {
        super();

        this.index = index;
        this.documents = [];
        this.facets = {};
        this.sortedKeywords
    }

    indexDocument(id, doc, fields, facets) {
        for (let field of fields) {
            let value = doc.getNestedValue(field);

            if (typeof value !== undefined) {
                this.index.register(id, value);
            }
        }

        for (let facet of facets) {
            let value = doc.getNestedValue(facet);

            if (value === undefined) {
                continue;
            }

            if (this.facets[facet] === undefined) {
                this.facets[facet] = {
                    'values': {},
                    // 'sorted': {
                    //     'type': 'count',
                    //     'order': 'desc',
                    //     'values': []
                    // }
                };
            }

            if (this.facets[facet].values[value] === undefined) {
                this.facets[facet].values[value] = new Set();
            }

            this.facets[facet].values[value].add(id);
            // this.facets[facet].sorted.values.push(value);
        }

        this.documents[id] = doc;
    }

    // orderFacets() {
    //     for (let name in this.facets) {
    //         this.facets[name].sorted.values = this.facets[name].sorted.values
    //             .filter(function(value, index, array) {
    //                 return array.indexOf(value) === index;
    //             }).sort(function(first, second) {
    //                 if (this.sorted.order === 'asc') {
    //                     return this.values[first].size - this.values[second].size;
    //                 } else {
    //                     return this.values[second].size - this.values[first].size;
    //                 }
    //             }.bind(this.facets[name]));
    //     }
    // }

    start(limit) {
        // this.orderFacets();
        this.searchByPrefix('', limit);
    }

    searchByPrefix(query, limit) {
        this.notify('search');

        let foundIds = this.index.searchByPrefix(query);

        let selectedFacets = {
            'content.company.product.color': ['azure', 'gold', 'indigo', 'green', 'grey', 'orange'],
            'content.company.product.name': ['Table', 'Cheese', 'Bike']
        };

        let ids = new Set(foundIds);

        // for (let facet in selectedFacets) {
        //     if (selectedFacets.hasOwnProperty(facet) === false) {
        //         continue;
        //     }

        //     ids = selectedFacets[facet]
        //         .map(function(selected) {
        //             return this[selected] || new Set();
        //         }.bind(this.facets[facet].values))
        //         .reduce(function(acc, current) {
        //             return acc.union(current);
        //         })
        //         .intersect(ids);
        // }

        ids = [...ids];

        // debugger;

        let count = ids.length;
        let documents = ids.slice(0, limit)
            .map(function(id) {
                return this.documents[id];
            }.bind(this));


        let facets = {};

        for (let facet in this.facets) {
            if (this.facets.hasOwnProperty(facet) === false) {
                continue;
            }

            facets[facet] = [];

            for (let keyword in this.facets[facet].values) {
                if (this.facets[facet].values.hasOwnProperty(keyword) === false) {
                    continue;
                }

                facets[facet][keyword] = this.facets[facet].values[keyword] && this.facets[facet].values[keyword].intersect(new Set(ids)).size;
            }
        }

        this.notify('results', {
            'query': query,
            'ids': ids,
            'count': count,
            'documents': documents,
            'facets': facets
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
