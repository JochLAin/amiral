module.exports.chain = (promises) => {
    let chain = Promise.resolve();
    for (const index in promises) {
        chain = chain.then(promises[index]);
    }
    return chain;
};
