// Tests draaien altijd in Nederlandse tijd, zodat zomer- en wintertijd echt getest worden
module.exports = () => {
  process.env.TZ = 'Europe/Amsterdam';
};
