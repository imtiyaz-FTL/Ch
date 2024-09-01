
// let array=[1,2,3,4]
// let currentIndex=2
// if the current Index is equal to array.length-2
// if(currentIndex==array.length-2){
// let pushElement=8
// let array2=[]
// array2.push("...")
// array2.push(pushElement)
// array.splice(currentIndex+2,0,array2)
// }
// console.log(array)

// -------------------------
// if the current Index is less than arra.length and its is on the even index (left side)
let array = [1, 2, 3, 4, 5, 6, 7];
let currentIndex = 2;
if (currentIndex < array.length && currentIndex % 2 === 0) {
    let pushElement = 8;
    let array2 = ["...", pushElement];
    array.splice(currentIndex + 2, 0, array2); 
}

if (currentIndex < array.length && currentIndex % 2 === 0 && Array.isArray(array[currentIndex + 2])) {
    let pushElement = 9;
    let array2 = ["...", pushElement];
    // Insert the second array right after the first inserted array
    array.splice(currentIndex + 3, 0, array2);
}
if (currentIndex < array.length && currentIndex % 2 === 0 && Array.isArray(array[currentIndex + 2])) {
    let pushElement = 10;
    let array2 = ["...", pushElement];
    // Insert the second array right after the first inserted array
    array.splice(currentIndex + 4, 0, array2);
}

console.log(array);

