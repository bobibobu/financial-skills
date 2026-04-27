#!/usr/bin/env node
"use strict";

const { renderSmiley, renderSmileySimple } = require("../src/smiley");

const args = process.argv.slice(2);
const simple = args.includes("--simple") || args.includes("-s");

if (simple) {
  console.log(renderSmileySimple());
} else {
  console.log(renderSmiley());
}
