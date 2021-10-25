import cloneDeep from 'lodash.clonedeep';

//
// Get type from the mongoose schema
//
// Returns the type, so in case none is set, it's the mongoose type.
//
// @param paths
// @param field
// @return the type or false
//
function getTypeFromPaths(paths: any, field: any) {
  let type = false;

  if (paths[field] && paths[field].options.type === Date) {
    return 'date';
  }

  if (paths[field] && paths[field].options.type === Boolean) {
    return 'boolean';
  }

  if (paths[field]) {
    type = paths[field].instance ? paths[field].instance.toLowerCase() : 'object';
  }

  return type;
}

//
// Generates the mapping
//
// Can be called recursively.
//
// @param cleanTree
// @param inPrefix
// @return the mapping
//
function getMapping(cleanTree: any, inPrefix: any) {
  const mapping = {};
  let value = [];
  let field = [];
  let prop = [];
  const implicitFields = [];
  let hasEsIndex = false;
  const prefix = inPrefix !== '' ? `${inPrefix}.` : inPrefix;

  // @ts-expect-error ts-migrate(2405) FIXME: The left-hand side of a 'for...in' statement must ... Remove this comment to see the full error message
  for (field in cleanTree) {
    if (!cleanTree.hasOwnProperty(field)) {
      continue;
    }
    // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
    value = cleanTree[field];
    // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
    mapping[field] = {};
    // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
    mapping[field].type = value.type;

    // Check if field was explicity indexed, if not keep track implicitly
    if (value.es_indexed) {
      hasEsIndex = true;
    } else if (value.type) {
      implicitFields.push(field);
    }

    // If there is no type, then it's an object with subfields.
    if (typeof value === 'object' && !value.type) {
      // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
      mapping[field].type = 'object';
      // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
      mapping[field].properties = getMapping(value, prefix + field);
    }

    // If it is a objectid make it a string.
    if (value.type === 'objectid') {
      if (value.ref && value.es_schema) {
        // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
        mapping[field].type = 'object';
        // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
        mapping[field].properties = getMapping(value, prefix + field);
        continue;
      }
      // do not continue here so we can handle other es_ options
      // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
      mapping[field].type = 'string';
    }

    // If indexing a number, and no es_type specified, default to long
    if (value.type === 'number' && value.es_type === undefined) {
      // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
      mapping[field].type = 'long';
      continue;
    }

    // Else, it has a type and we want to map that!
    // @ts-expect-error ts-migrate(2405) FIXME: The left-hand side of a 'for...in' statement must ... Remove this comment to see the full error message
    for (prop in value) {
      // Map to field if it's an Elasticsearch option
      // @ts-expect-error ts-migrate(2367) FIXME: This condition will always return 'true' since the... Remove this comment to see the full error message
      if (value.hasOwnProperty(prop) && prop.indexOf('es_') === 0 && prop !== 'es_indexed') {
        // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
        mapping[field][prop.replace(/^es_/, '')] = value[prop];
      }
    }

    // if type is never mapped, delete mapping
    // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
    if (mapping[field].type === undefined) {
      // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
      delete mapping[field];
    }

    // Set default string type
    // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
    if (mapping[field] && mapping[field].type === 'string') {
      const textType = {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      };
      // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
      mapping[field] = Object.assign(mapping[field], textType);
    }
  }

  // If one of the fields was explicitly indexed, delete all implicit fields
  if (hasEsIndex) {
    implicitFields.forEach((implicitField) => {
      // @ts-expect-error ts-migrate(2538) FIXME: Type 'any[]' cannot be used as an index type.
      delete mapping[implicitField];
    });
  }

  return mapping;
}

//
// Generates a clean tree
//
// Can be called recursively.
//
// @param tree
// @param paths
// @param prefix
// @return the tree
//
function getCleanTree(tree: any, paths: any, inPrefix: any, isRoot: any) {
  const cleanTree = {};
  let type = '';
  let value = {};
  let field;
  let prop;
  let treeNode;
  let subTree;
  let key;
  let geoFound = false;
  const prefix = inPrefix !== '' ? `${inPrefix}.` : inPrefix;

  tree = cloneDeep(tree);
  paths = cloneDeep(paths);

  for (field in tree) {
    if (prefix === '' && field === '_id' && isRoot) {
      continue;
    }

    // @ts-expect-error ts-migrate(2322) FIXME: Type 'string | boolean' is not assignable to type ... Remove this comment to see the full error message
    type = getTypeFromPaths(paths, prefix + field);
    value = tree[field];

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'es_indexed' does not exist on type '{}'.
    if (value.es_indexed === false) {
      continue;
    }

    // Field has some kind of type
    if (type) {
      // If it is an nested schema
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      if (value[0] || type === 'embedded') {
        // A nested array can contain complex objects
        nestedSchema(paths, field, cleanTree, value, prefix); // eslint-disable-line no-use-before-define
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
      } else if (value.type && Array.isArray(value.type)) {
        // An object with a nested array
        nestedSchema(paths, field, cleanTree, value, prefix); // eslint-disable-line no-use-before-define
        // Merge top level es settings
        for (prop in value) {
          // Map to field if it's an Elasticsearch option
          if (value.hasOwnProperty(prop) && prop.indexOf('es_') === 0) {
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            cleanTree[field][prop] = value[prop];
          }
        }
      } else if (
        paths[field] &&
        paths[field].options.es_schema &&
        paths[field].options.es_schema.tree &&
        paths[field].options.es_schema.paths
      ) {
        subTree = paths[field].options.es_schema.tree;
        if (paths[field].options.es_select) {
          for (treeNode in subTree) {
            if (!subTree.hasOwnProperty(treeNode)) {
              continue;
            }
            if (paths[field].options.es_select.split(' ').indexOf(treeNode) === -1) {
              delete subTree[treeNode];
            }
          }
        }
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        cleanTree[field] = getCleanTree(subTree, paths[field].options.es_schema.paths, '');
      } else if (
        value === String ||
        value === Object ||
        value === Date ||
        value === Number ||
        value === Boolean ||
        value === Array
      ) {
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        cleanTree[field] = {};
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        cleanTree[field].type = type;
      } else {
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        cleanTree[field] = {};
        for (key in value) {
          if (value.hasOwnProperty(key)) {
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            cleanTree[field][key] = value[key];
          }
        }
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        cleanTree[field].type = type;
      }

      // It has no type for some reason
    } else {
      // Because it is an geo_* object!!
      if (typeof value === 'object') {
        for (key in value) {
          if (value.hasOwnProperty(key) && /^geo_/.test(key)) {
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            cleanTree[field] = value[key];
            geoFound = true;
          }
        }

        if (geoFound) {
          continue;
        }
      }

      // If it's a virtual type, don't map it
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'getters' does not exist on type '{}'.
      if (typeof value === 'object' && value.getters && value.setters && value.options) {
        continue;
      }

      // Because it is some other object!! Or we assumed that it is one.
      if (typeof value === 'object') {
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        cleanTree[field] = getCleanTree(value, paths, prefix + field);
      }
    }
  }

  return cleanTree;
}

//
// Define a nested schema
//
// @param paths
// @param field
// @param cleanTree
// @param value
// @param prefix
// @return cleanTree modified
//
function nestedSchema(paths: any, field: any, cleanTree: any, value: any, prefix: any) {
  let treeNode;
  let subTree;
  // A nested array can contain complex objects
  if (
    paths[prefix + field] &&
    paths[prefix + field].schema &&
    paths[prefix + field].schema.tree &&
    paths[prefix + field].schema.paths
  ) {
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 4 arguments, but got 3.
    cleanTree[field] = getCleanTree(paths[prefix + field].schema.tree, paths[prefix + field].schema.paths, '');
  } else if (
    paths[prefix + field] &&
    Array.isArray(paths[prefix + field].options.type) &&
    paths[prefix + field].options.type[0].es_schema &&
    paths[prefix + field].options.type[0].es_schema.tree &&
    paths[prefix + field].options.type[0].es_schema.paths
  ) {
    // A nested array of references filtered by the 'es_select' option
    subTree = paths[field].options.type[0].es_schema.tree;
    if (paths[field].options.type[0].es_select) {
      for (treeNode in subTree) {
        if (!subTree.hasOwnProperty(treeNode)) {
          continue;
        }
        if (paths[field].options.type[0].es_select.split(' ').indexOf(treeNode) === -1) {
          delete subTree[treeNode];
        }
      }
    }
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 4 arguments, but got 3.
    cleanTree[field] = getCleanTree(subTree, paths[prefix + field].options.type[0].es_schema.paths, '');
  } else if (paths[prefix + field] && paths[prefix + field].caster && paths[prefix + field].caster.instance) {
    // Even for simple types the value can be an object if there is other attributes than type
    if (typeof value[0] === 'object') {
      cleanTree[field] = value[0];
    } else if (typeof value === 'object') {
      cleanTree[field] = value;
    } else {
      cleanTree[field] = {};
    }

    cleanTree[field].type = paths[prefix + field].caster.instance.toLowerCase();
  } else if (!paths[field] && prefix) {
    if (paths[prefix + field] && paths[prefix + field].caster && paths[prefix + field].caster.instance) {
      cleanTree[field] = {
        type: paths[prefix + field].caster.instance.toLowerCase(),
      };
    }
  } else {
    cleanTree[field] = {
      type: 'object',
    };
  }
}

export const Generator = {
  // Schema<any, any, any>
  generateMapping: function generateMapping(schema: any) {
    const cleanTree = getCleanTree(schema.tree, schema.paths, '', true);
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    delete cleanTree[schema.get('versionKey')];
    const mapping = getMapping(cleanTree, '');
    return { properties: mapping };
  },
  getCleanTree: function (schema: any) {
    return getCleanTree(schema.tree, schema.paths, '', true);
  },
};
