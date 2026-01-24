export function applyBaseSchemaTransform(schema: any) {
  schema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      return ret;
    },
  });

  schema.set('toObject', {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      return ret;
    },
  });
}
