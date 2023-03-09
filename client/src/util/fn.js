import JSConfetti from "js-confetti";

export const uuid = () =>
  Math.random()
    .toString(16)
    .slice(3)
    .split("")
    .map((el, index) => {
      if (index > 0 && index % 4 === 0) {
        return `-${el}`;
      } else {
        return el;
      }
    })
    .join("");

export const username = () => {
  const first = Math.random().toString(16).slice(7);
  const temp = Date.now().toString();
  const last = temp.slice(temp.length - 4);
  return `${first}-${last}`;
};

export const jsConfetti = new JSConfetti();
