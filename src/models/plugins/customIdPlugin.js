import Counter from '../Counter.js';

const customIdPlugin = (schema, options) => {
  const modelName = options && options.modelName ? options.modelName : 'Unknown';

  // Add field to schema
  schema.add({
    customId: {
      type: String,
      unique: true,
      sparse: true,
    }
  });

  // Pre-save hook
  schema.pre('save', async function () {
    if (this.customId) return;

    const counter = await Counter.findByIdAndUpdate(
      { _id: `${modelName.toLowerCase()}_customId` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.customId = String(1000 + counter.seq);
  });
};

export default customIdPlugin;
