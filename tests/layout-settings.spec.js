// Position across / down (1.30.0; X and Y in real units since 2.87.1, tests/units-2-87-1.spec.js). The radial arrangements of the old layer engine went with the layers in 2.2.2; a Pattern has its own layouts (element-pattern spec).
const { test, expect } = require('@playwright/test');
const fs = require('fs'), os = require('os'), path = require('path');
const { zipSync, unzipSync, strToU8, strFromU8 } = require('fflate');
const { openApp, openPanel, settle, getState, openProjectFile, noPattern } = require('./helpers/harness');

const setv = (page, id, v, ev = 'input') => page.locator('#' + id).evaluate((e, [v, ev]) => { e.value = v; e.dispatchEvent(new Event(ev, { bubbles: true })); }, [v, ev]);
// a layer starts with a Pattern; 'x' takes it away and picks the first stamp so clicks on the canvas place stamps freely
const vb = page => page.locator('#art').evaluate(e => e.getAttribute('viewBox').split(' ').map(Number));
const pick = async (page, v) => { await noPattern(page); if (v === 'x') { await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click'); await settle(page); } };

// 2.87.1: Position across / down became the Element group's X and Y in real units (tests/units-2-87-1.spec.js)
