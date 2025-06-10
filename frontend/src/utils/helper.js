export const getInitials = (title) => {
  if (!title) return "";

  const words = title.split("");
  let initials = "";

  for (let i = 0; i < Math.min(words.length, 1); i++) {
    initials += words[i][0];
  }
  return initials.toUpperCase();
};
