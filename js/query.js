const QueryBuilder = {
    buildQueryParams: function(params) {
        const query = {};
        
        if (params.page && params.page > 0) {
            query.page = params.page;
        }
        
        if (params.limit && params.limit > 0) {
            query.limit = Math.min(params.limit, 100);
        }
        
        if (params.sort) {
            query.sort = params.sort;
        }
        
        if (params.search && params.search.trim()) {
            query.search = params.search.trim();
        }
        
        if (params.filters) {
            Object.keys(params.filters).forEach(key => {
                const value = params.filters[key];
                if (value !== null && value !== undefined && value !== '') {
                    query[`filter[${key}]`] = value;
                }
            });
        }
        
        return query;
    },
    
    parseQueryString: function(queryString) {
        const params = {};
        const pairs = queryString.substring(1).split('&');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value) {
                const decodedKey = decodeURIComponent(key);
                const decodedValue = decodeURIComponent(value);
                
                if (decodedKey.startsWith('filter[') && decodedKey.endsWith(']')) {
                    const filterKey = decodedKey.slice(7, -1);
                    if (!params.filters) {
                        params.filters = {};
                    }
                    params.filters[filterKey] = decodedValue;
                } else {
                    params[decodedKey] = decodedValue;
                }
            }
        });
        
        return params;
    }
};

