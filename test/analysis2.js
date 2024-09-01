// let array1 = [1, 2, 3, 4, 5, 6, 7];

// let ci1 = array1.length - 1;
// let ci2 = array1.length - 1;
// let oldCi1;
// let oldCi2;

// function normalAdd(num) {
//     array1.push(num);
//     oldCi1 = ci1;
//     oldCi2 = ci2;
// }

// if (ci1 === ci2 && ci1 === array1.length - 1) {
//     normalAdd(8);
//     console.log(array1);
// }

// ci1 = 4;
// ci2 = oldCi2;

// function func1(num, ci1) {
//     let array2 = ["...", num];
//     array1.splice(ci1 + 2, 0, array2);
//     oldCi1 = ci1;
//     ci2 = ci1 + 3;
//     console.log(ci1, ci2, oldCi1, ci2, "hahahahh");
// }

// if (ci1 < array1.length - 1 && ci1 % 2 === 0) {
//     ci2 = ci1;
//     let pushElement = 9;
//     func1(pushElement, ci1);
// }

// console.log(array1);

// function func2(num, ci1) {
//     array1[ci1 + 2].push(num);
//     console.log("hahahah");
// }

// console.log(ci1, ci2, oldCi1, "lalalal");

// if (ci1 === oldCi1 && ci1 !== ci2) {
//     let pushElement = 10;
//     func2(pushElement, ci1);
// }

// ci1 = 2;
// ci2 = oldCi2;

// function func1(num, ci1) {
//     let array2 = ["...", num];
//     array1.splice(ci1 + 2, 0, array2);
//     oldCi1 = ci1;
//     ci2 = ci1 + 3;
//     console.log(ci1, ci2, oldCi1, ci2, "hahahahh");
// }

// if (ci1 < array1.length - 1 && ci1 % 2 === 0) {
//     ci2 = ci1;
//     let pushElement = 11;
//     func1(pushElement, ci1);
// }

// console.log(array1);

// function func2(num, ci1) {
//     array1[ci1 + 2].push(num);
//     console.log("hahahah");
// }

// console.log(ci1, ci2, oldCi1, "lalalal");

// if (ci1 === oldCi1 && ci1 !== ci2) {
//     let pushElement = 12;
//     func2(pushElement, ci1);
// }

// console.log(array1);
// Given array
// Given array
const array = [ 1, 2, 3, 4, [ '...', 11, 12 ], [ '...', 9, 10 ],[ '...', 9, 10 ], 7, 8 ];

// Given indices
let ci1 = 2;
let ci2 = array[6][2]; // array[5] is [ '...', 9, 10 ], and array[5][2] is 10
// Determine the index of ci2 in the array
let ci2Index = array.findIndex (element => {
  if (Array.isArray(element)) {
    return element.includes(ci2);
  }
  return element === ci2;
});

// Extract the subarray between ci1 and ci2
let subarray = array.slice(ci1, ci2Index + 1);

// Count the continuous arrays in the subarray
let count = subarray.filter(element => Array.isArray(element)).length;

// Output the result
console.log(count); // Output should be 2

let data=[ 1, 2, 3, 4, [ '...', 11, 12 ], [ '...', 9, 10 ],[ '...', 9, 10 ], 7, 8 ]
let countValue=0
for(let element of data){
    if(Array.isArray(element)){
        continue
    }else{
        console.log(countValue)
        countValue++
    }

}

