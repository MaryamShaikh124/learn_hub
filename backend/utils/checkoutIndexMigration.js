const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');

async function removeLegacyCourseUniqueIndexes() {
  for (const model of [Payment, Enrollment]) {
    const collectionName = model.collection.collectionName;
    const collections = await model.db.db
      .listCollections({ name: collectionName }, { nameOnly: true })
      .toArray();
    if (!collections.length) continue;

    const indexes = await model.collection.indexes();
    const isCourseOnlyIndex = (index) => {
      const keys = Object.keys(index.key);
      return keys.length === 1 && index.key.course === 1;
    };
    const legacyIndexes = indexes.filter((index) => index.unique && isCourseOnlyIndex(index));

    for (const index of legacyIndexes) {
      try {
        await model.collection.dropIndex(index.name);
      } catch (error) {
        if (error.code !== 27) throw error;
        const remainingIndexes = await model.collection.indexes();
        if (remainingIndexes.some((remaining) => remaining.name === index.name)) throw error;
      }
    }

    if (
      legacyIndexes.length &&
      !indexes.some((index) => !index.unique && isCourseOnlyIndex(index))
    ) {
      await model.collection.createIndex({ course: 1 });
    }
  }
}

module.exports = { removeLegacyCourseUniqueIndexes };
