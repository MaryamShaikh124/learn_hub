const mongoose = require('mongoose');

function transactionsUnsupported(error) {
  const message = String(error?.message || '');
  return (
    message.includes('Transaction numbers are only allowed') ||
    message.includes('replica set') ||
    message.includes('Transaction support')
  );
}

async function withTransaction(work) {
  let session;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (transactionsUnsupported(error)) {
      return work(null);
    }
    throw error;
  } finally {
    if (session) await session.endSession();
  }
}

function sessionOpts(session) {
  return session ? { session } : {};
}

module.exports = { withTransaction, sessionOpts };
