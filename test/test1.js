// Get the current time in IST
const currentTime = new Date();
const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
const istTime = new Date(currentTime.getTime() + istOffset);

// Format the current date as YYYY-MM-DD (e.g., "2024-08-26")
const currentDate = istTime.toISOString().slice(0, 10);

// Format the current time as HH:MM (e.g., "15:32")
const currentFormattedTime = istTime.toTimeString().slice(0, 5);

console.log(currentFormattedTime, currentDate);
