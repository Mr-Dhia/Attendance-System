let queue = [];

module.exports = {
  add: (fingerID) => queue.push(fingerID),
  drain: () => {
    const items = [...queue];
    queue = [];
    return items;
  },
};