export const bindField = (setForm) => (e) =>
  setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
