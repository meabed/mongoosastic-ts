module.exports = function serialize(model: any, mapping: any) {
  let name;

  function _serializeObject(object: any, mappingData: any) {
    const serialized = {};
    let field;
    let val;
    for (field in mappingData.properties) {
      if (mappingData.properties.hasOwnProperty(field)) {
        val = serialize.call(object, object[field], mappingData.properties[field]);
        if (val !== undefined) {
          // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          serialized[field] = val;
        }
      }
    }
    return serialized;
  }

  if (mapping.properties && model) {
    if (Array.isArray(model)) {
      return model.map((object) => _serializeObject(object, mapping));
    }

    return _serializeObject(model, mapping);
  }

  if (mapping.cast && typeof mapping.cast !== 'function') {
    throw new Error('es_cast must be a function');
  }

  const outModel = mapping.cast ? mapping.cast.call(this, model) : model;
  if (typeof outModel === 'object' && outModel !== null) {
    name = outModel.constructor.name;
    if (name === 'ObjectID') {
      return outModel.toString();
    }

    if (name === 'Date') {
      return new Date(outModel).toJSON();
    }
  }

  return outModel;
};
