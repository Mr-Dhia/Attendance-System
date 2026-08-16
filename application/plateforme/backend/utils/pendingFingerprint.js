let pendingEmployeeId = null;

module.exports = {
  set: (id) => { pendingEmployeeId = id; },
  get: () => pendingEmployeeId,
  clear: () => { pendingEmployeeId = null; },
};