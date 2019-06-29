const Helpers = {};

// standardize weights to whole-number percentages of a given full amount
Helpers.standardizeWeights = (fullMeasure, weights) => {

  // Determine sum of weights
  let totalWeight = 0;
  for (let i = 0; i < weights.length; i++) {
    totalWeight += weights[i];
  }

  // Determine floor values
  const floorVals = [];
  for (let i = 0; i < weights.length; i++) {
    floorVals[i] = Math.floor(weights[i] / totalWeight * fullMeasure);
  }

  // Sum floor values
  let floorSum = 0;
  for (let i = 0; i < floorVals.length; i++) {
    floorSum += floorVals[i];
  }

  // Determine difference between floorVals and fullMeasure
  let difference = fullMeasure - floorSum;

  const addedWeightIndices = []; // weights already used

  while (difference > 0) {

    // Find original weight with highest decimal
    let plusCandidateIndex = -1; // the best candidate to add to
    let currentWeightChampion = -1; // the value of the best candidate
    for (let i = 0; i < weights.length; i++) {

      // check if remainder from %1 is next champion AND hasn't been used yet
      if (weights[i] % 1 > currentWeightChampion && addedWeightIndices.indexOf(i) === -1) {
        plusCandidateIndex = i;
        currentWeightChampion = weights[i] % 1;
      }
    }

    // Add 1 to highest unused decimal number
    floorVals[plusCandidateIndex] += 1;
    addedWeightIndices.push(plusCandidateIndex);
    difference--;
  }

  return floorVals;
};

module.exports = Helpers;
