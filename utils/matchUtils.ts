export const getDurationBucket = (duration: number): string => {
    if (duration < 1200) return "0-20";
    if (duration < 1800) return "20-30";
    return "30+";
};
