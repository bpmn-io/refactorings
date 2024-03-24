function getLocalType(type) {
  return type.split(':').pop();
}

module.exports.typeToString = function(type) {
  return getLocalType(type).replace(/([a-z])([A-Z])/g, '$1 $2').trim();
};