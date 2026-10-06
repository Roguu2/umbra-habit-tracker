// Składa zbudowaną aplikację (dist/) w jeden plik HTML do publikacji jako Artifact na claude.ai.
// Strona jest tam owijana we własny szkielet, więc wycinamy <!doctype>, <html>, <head> i <body>,
// a CSS i JS wstawiamy inline.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist'
const html = readFileSync(join(dist, 'index.html'), 'utf8')

const inline = html
  .replace(/<link rel="stylesheet"[^>]*href="\/?([^"]+\.css)"[^>]*>/g, (_, file) => {
    return `<style>${readFileSync(join(dist, file), 'utf8')}</style>`
  })
  .replace(/<script type="module"[^>]*src="\/?([^"]+\.js)"[^>]*><\/script>/g, (_, file) => {
    const js = readFileSync(join(dist, file), 'utf8').replace(/<\/script/gi, '<\\/script')
    return `<script type="module">${js}</script>`
  })

const head = inline.match(/<head>([\s\S]*?)<\/head>/)[1]
const body = inline.match(/<body>([\s\S]*?)<\/body>/)[1]

// tytuł musi być na samym początku pliku; meta charset/viewport dodaje szkielet artefaktu
const cleanHead = head.replace(/<meta charset[^>]*>\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '')
const title = cleanHead.match(/<title>[\s\S]*?<\/title>/)[0]
const out = `${title}\n${cleanHead.replace(title, '')}\n${body}`

mkdirSync('dist-artifact', { recursive: true })
writeFileSync(join('dist-artifact', 'umbra.html'), out)
console.log(`dist-artifact/umbra.html — ${(out.length / 1024).toFixed(0)} KB`)
