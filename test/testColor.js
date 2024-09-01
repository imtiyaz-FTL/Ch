const data = [
    {
        piece: "bp",
        from: [1, 23, 4]
    },
    {
        piece: "wp",
        to: [1, 23, 4]
    },
    {
        piece: "bp",
        to: [1, 23, 4]
    },
    {
        piece: "wp",
        from: [1, 3, 4]
    },
];

// Step 1: Count the frequency of each piece
const frequency = {};
data.forEach(item => {
    if (!frequency[item.piece]) {
        frequency[item.piece] = 0;
    }
    frequency[item.piece]++;
});

// Step 2: Collect 'from' and 'to' positions for pieces with frequency more than one
const result = {};
data.forEach(item => {
    if (frequency[item.piece] > 1) {
        if (!result[item.piece]) {
            result[item.piece] = { from: [], to: [] };
        }
        if (item.from) {
            result[item.piece].from.push(item.from);
        }
        if (item.to) {
            result[item.piece].to.push(item.to);
        }
    }
});

console.log(result);

// Step 3: Combine 'from' and 'to' positions into one object for each piece
let array1 = [];
let array2 = [];

for (let piece in result) {
    let combined = { piece: piece, from: result[piece].from, to: result[piece].to };
    if (array1.length === 0) {
        array1.push(combined);
    } else {
        array2.push(combined);
    }
}
console.log(array1[0].from)

console.log('Array1:', array1);
console.log('Array2:', array2);
