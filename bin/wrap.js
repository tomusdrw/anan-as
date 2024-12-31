#!/usr/bin/env node

// wrap input as program

import {fuzz} from './fuzz.js'
    
const program = fuzz([
    20,8,0, 0, 0, 0, 255, 255, 255, 255,20,7,0, 0, 0, 0, 1, 0, 0, 0,193,135,9,194,135,10,195,135,11
]);

console.log(program);
