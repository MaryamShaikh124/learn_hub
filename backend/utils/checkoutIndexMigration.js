const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');

async function removeLegacyRelationshipUniqueIndexes() {
  for (const model of [Payment, Enrollment]) {
    const collectionName = model.collection.collectionName;
    const collections = await model.db.db
      .listCollections({ name: collectionName }, { nameOnly: true })
      .toArray();
    if (!collections.length) continue;

    const indexes = await model.collection.indexes();
    const isSingleRelationshipIndex = (index) => {
      const keys = Object.keys(index.key);
      const hasStudent = keys.includes('student');
      const hasCourse = keys.includes('course');
      return (
        (hasStudent || hasCourse) &&
        !(hasStudent && hasCourse) &&
        keys.every((key) => key === 'student' || key === 'course')
      );
    };
    const obsoletePaymentIndex = (index) =>
      model === Payment &&
      index.unique &&
      Object.keys(index.key).length === 1 &&
      ['orderId', 'tracker'].includes(Object.keys(index.key)[0]);
    const legacyIndexes = indexes.filter(
      (index) => index.unique && isSingleRelationshipIndex(index) || obsoletePaymentIndex(index)
    );

    for (const index of legacyIndexes) {
      try {
        await model.collection.dropIndex(index.name);
      } catch (error) {
        if (error.code !== 27) throw error;
        const remainingIndexes = await model.collection.indexes();
        if (remainingIndexes.some((remaining) => remaining.name === index.name)) throw error;
      }
    }

    if (legacyIndexes.some(isSingleRelationshipIndex)) {
      const currentIndexes = await model.collection.indexes();
      for (const field of ['student', 'course']) {
        const hasIndex = currentIndexes.some((index) => {
          const keys = Object.keys(index.key);
          return keys.length === 1 && index.key[field] === 1;
        });
        if (!hasIndex) await model.collection.createIndex({ [field]: 1 });
      }
    }

    await model.createIndexes();
  }
}

module.exports = { removeLegacyRelationshipUniqueIndexes };
