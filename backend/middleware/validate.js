function validate(schemas = {}) {
  return (req, res, next) => {
    for (const key of ['body', 'params', 'query']) {
      if (!schemas[key]) continue;
      const parsed = schemas[key].safeParse(req[key]);
      if (!parsed.success) return next(parsed.error);
      Object.defineProperty(req, key, { value: parsed.data, writable: true, configurable: true, enumerable: true });
    }
    return next();
  };
}

module.exports = validate;
