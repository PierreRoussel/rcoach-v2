#!/usr/bin/env node

import { buildCiqualInsertQuery, mapCiqualFoodToRow } from './lib/ciqual-import.mjs'
import { parseAlimBlock, parseCompoBlock } from './lib/ciqual-xml.mjs'

const alimBlock = `<ALIM>
  <alim_code> 13000 </alim_code>
  <alim_nom_fr>Tomate, crue</alim_nom_fr>
</ALIM>`

const compoBlock = `<COMPO>
  <alim_code> 13000 </alim_code>
  <const_code>328</const_code>
  <teneur>18,0</teneur>
</COMPO>`

const alim = parseAlimBlock(alimBlock)
if (!alim || alim.alimCode !== '13000' || alim.name !== 'Tomate, crue') {
  throw new Error('Unexpected alim parse')
}

const compo = parseCompoBlock(compoBlock)
if (!compo || compo.alimCode !== '13000' || compo.constCode !== '328' || compo.value !== 18) {
  throw new Error('Unexpected compo parse')
}

const row = mapCiqualFoodToRow(alim, {
  328: 18,
  25000: 0.9,
  31000: 2.7,
  40000: 0.2,
})
if (!row || row.source !== 'ciqual' || row.ciqual_code !== '13000') {
  throw new Error('Expected mapped ciqual row')
}

const query = buildCiqualInsertQuery([row])
if (!query?.text.includes('ciqual_code') || query.values.length !== 16) {
  throw new Error('Unexpected insert query')
}

const incomplete = mapCiqualFoodToRow(alim, { 328: 18 })
if (incomplete != null) {
  throw new Error('Expected incomplete nutrients to be rejected')
}

console.log('CIQUAL import mapping test OK.')
