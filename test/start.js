let today = new Date();

// Format the date to 'YYYY-MM-DD'
let year = today.getFullYear();
let month = String(today.getMonth() + 1).padStart(2, '0'); // Ensure two digits for the month
let day = String(today.getDate()).padStart(2, '0'); // Ensure two digits for the day

let date = `${year}-${month}-${day}`;
console.log(date, "kkkkk");

// Get the current time
let currentTime = today.getHours() + ":" + String(today.getMinutes()).padStart(2, '0');

// Calculate the time 5 minutes ahead
let futureTime = new Date(today.getTime() + 5 * 6000); // Add 5 minutes in milliseconds
let futureHours = futureTime.getHours();
let futureMinutes = String(futureTime.getMinutes()).padStart(2, '0');
let futureFormattedTime = futureHours + ":" + futureMinutes;

console.log("Current Time:", currentTime);
console.log("Time 5 Minutes Ahead:", futureFormattedTime);

const sleep=(time)=>{
    setTimeout(()=>{
        console.log(time)
    },time) // 1 second delay
 }
 sleep(2000)  
 console.log("hiiiii")