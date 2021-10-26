# Mongoosastic-ts
![Build Status](https://github.com/meabed/mongoosastic-ts/actions/workflows/ci.yml/badge.svg)
[![NPM version](https://img.shields.io/npm/v/mongoosastic-ts.svg)](https://www.npmjs.com/package/mongoosastic-ts)
[![Coverage Status](https://coveralls.io/repos/meabed/mongoosastic-ts/badge.svg?branch=master&service=github)](https://coveralls.io/github/meabed/mongoosastic-ts?branch=master)
[![Downloads](https://img.shields.io/npm/dm/mongoosastic-ts.svg)](https://www.npmjs.com/package/mongoosastic-ts)

### mongoosastic-ts is a [mongoose](http://mongoosejs.com/) plugin that can automatically index your models into [elasticsearch](https://www.elastic.co/).
> This package is forked version from [mongoosastic](https://github.com/mongoosastic/mongoosastic)
> 
> It has been updated and migrated to typescript and updated dependencies and codebase to the latest packages 

## Getting started

1. Install the package

```bash
npm install -S mongoosastic-ts
```

2. Setup your mongoose model to use the plugin

```typescript
import { Document, model, Schema } from 'mongoose';
import { mongoosastic } from 'mongoosastic-ts';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from 'mongoosastic-ts/dist/types';

export interface IBookModel extends Document, MongoosasticDocument {
  title?: string;
}

const BookSchema = new Schema<IBookModel>({
  title: {
    type: String,
    required: true,
  },
});

BookSchema.plugin(mongoosastic, {
  index: 'books',
  type: 'book',
} as MongoosasticPluginOpts);


export const bookModel = model<IBookModel, MongoosasticModel<IBookModel>>('Book', BookSchema);
```


3. Query your Elasticsearch with the `search()` method (added by the plugin)

```typescript
const results = await bookModel.search({
  query_string: {
    query: "john"
});
// do something with elastic search results
```

*NOTE*: You can also query Elasticsearch with any other method. Example: 

```bash
curl http://localhost:9200/users/user/_search
```

## Documentation

[View docs](docs/README.md)



