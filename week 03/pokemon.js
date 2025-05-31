// Modified URL to get list of Pokemon instead of just Ditto
const url = 'https://pokeapi.co/api/v2/pokemon/';
let results = null;

async function getPokemon(url) {
    const response = await fetch(url);
    //check to see if the fetch was successful
    if (response.ok) {
        // the API will send us JSON...but we have to convert the response before we can use it
        // .json() also returns a promise...so we await it as well.
        const data = await response.json();
        doStuff(data);
    }
}

function doStuff(data) {
    results = data;
    console.log("first: ", results);
    
    // Output answers to the questions
    console.log(`1. Total Pokemon count: ${results.count}`);
    console.log(`2. Number of Pokemon returned by default: ${results.results.length}`);
    
    // Populate the select element with Pokemon names
    const select = document.querySelector('#pokemon-select');
    results.results.forEach((pokemon) => {
        const option = document.createElement('option');
        option.value = pokemon.name;
        option.textContent = pokemon.name;
        select.appendChild(option);
    });
}

getPokemon(url);
console.log("second: ", results);