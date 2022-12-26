# mongoosastic-ts

[![Build Status 7](https://github.com/meabed/mongoosastic-ts/actions/workflows/ci-7.yml/badge.svg)](https://github.com/meabed/mongoosastic-ts/actions/workflows/ci-7.yml)
[![Build Status 8.0](https://github.com/meabed/mongoosastic-ts/actions/workflows/ci-8-0.yml/badge.svg)](https://github.com/meabed/mongoosastic-ts/actions/workflows/ci-8-0.yml)
[![Build Status 8.2](https://github.com/meabed/mongoosastic-ts/actions/workflows/ci-8-2.yml/badge.svg)](https://github.com/meabed/mongoosastic-ts/actions/workflows/ci-8-2.yml)
[![Build Status 8.2](https://github.com/meabed/mongoosastic-ts/actions/workflows/ci-8-5.yml/badge.svg)](https://github.com/meabed/mongoosastic-ts/actions/workflows/ci-8-5.yml)
[![NPM version](https://img.shields.io/npm/v/mongoosastic-ts.svg)](https://www.npmjs.com/package/mongoosastic-ts)
[![Downloads](https://img.shields.io/npm/dm/mongoosastic-ts.svg)](https://www.npmjs.com/package/mongoosastic-ts)
[![UNPKG](https://img.shields.io/badge/UNPKG-OK-179BD7.svg)](https://unpkg.com/browse/mongoosastic-ts@latest/)

#### mongoosastic-ts is a [mongoose](http://mongoosejs.com/) plugin that can automatically index your models into [elasticsearch](https://www.elastic.co/).

> This package is forked version from [mongoosastic](https://github.com/mongoosastic/mongoosastic)
>
> It has been updated and migrated to typescript and updated dependencies and codebase to the latest packages

#### Support elasticsearch 7.x and 8.x

### Getting started

1. Install the package

```bash
npm install -S mongoosastic-ts
```

2. Setup your mongoose model to use the plugin

```typescript
import { mongoosastic } from 'mongoosastic-ts';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from 'mongoosastic-ts/dist/types';
import { Document, Schema, model } from 'mongoose';

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

_NOTE_: You can also query Elasticsearch with any other method. Example:

```bash
curl http://localhost:9200/users/user/_search
```

### Documentation

[View docs](docs/README.md)
