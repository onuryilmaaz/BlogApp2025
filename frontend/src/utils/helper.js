export const getInitials = (title) => {
  if (!title) return "";

  const words = title.split("");
  let initials = "";

  for (let i = 0; i < Math.min(words.length, 1); i++) {
    initials += words[i][0];
  }
  return initials.toUpperCase();
};

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const getToastMessagesByType = (type) => {
  switch (type) {
    case "edit":
      return "Blog post updated succesfully!";
    case "draft":
      return "Blog post save as draft succesfully!";
    case "published":
      return "Blog post published succesfully!";
    default:
      return "Blog post published succesfully!";
  }
};
