function transformViteImportMetaEnv({ types }) {
  return {
    visitor: {
      MemberExpression(path) {
        const { object, property, computed } = path.node
        if (
          types.isMetaProperty(object) &&
          object.meta.name === 'import' &&
          object.property.name === 'meta' &&
          !computed &&
          types.isIdentifier(property, { name: 'env' })
        ) {
          path.replaceWith(
            types.memberExpression(types.identifier('process'), types.identifier('env')),
          )
        }
      },
    },
  }
}

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [transformViteImportMetaEnv],
}
