export const formatDateString = (date: string) => {
  return new Date(date).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};


export const formatDateForChart = (date: Date) => {
  // 31 Oct (no year)
  return date.toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
  });
};
